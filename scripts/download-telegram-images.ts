import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { parseDressWithAi } from '../src/lib/ai-parser.js';
import prisma from '../src/lib/prisma.js';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const apiId = 34081063;
const apiHash = '018dc673429227e26a1b8d9d65eb76ca';
const SESSION_FILE = path.join(process.cwd(), 'prisma', 'telegram_user.session');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

async function downloadImage(url: string, destPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const proto = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    proto.get(url, (res) => {
      if (res.statusCode !== 200) { resolve(false); return; }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(true); });
    }).on('error', () => resolve(false));
  });
}

async function downloadTelegramImages() {
  if (!fs.existsSync(SESSION_FILE)) {
    console.log('❌ ملف الجلسة غير موجود.');
    return;
  }

  const stringSession = fs.readFileSync(SESSION_FILE, 'utf8').trim();
  const client = new TelegramClient(new StringSession(stringSession), apiId, apiHash, {
    connectionRetries: 5,
  });

  console.log('⚡ جاري الاتصال بالتيليجرام لسحب صور الفساتين...');
  await client.connect();

  const dialogs = await client.getDialogs({});
  const targetChannel = dialogs.find(d =>
    d.title?.includes('جرد مندوبات') ||
    d.title?.includes('Corner') ||
    d.title?.includes('جرد')
  );

  if (!targetChannel) {
    console.log('❌ لم يتم العثور على القناة.');
    await client.disconnect();
    return;
  }

  console.log(`🎯 القناة: "${targetChannel.title}"`);
  console.log('📸 جاري سحب الصور فقط (بدون فيديوهات) من القناة...\n');

  const dbDresses = await prisma.dress.findMany({
    include: { variants: true },
    orderBy: { id: 'asc' }
  });

  const messages = await client.getMessages(targetChannel.entity, { limit: 500 });

  let totalImagesDownloaded = 0;
  let dressesUpdated = 0;

  for (const dbDress of dbDresses) {
    const dbCleanName = dbDress.name.toLowerCase().replace(/✨️|💫|🌷|🎗/g, '').trim();

    // Find matching message
    let matchedMsg = null;
    for (const msg of messages) {
      const text = msg.message || '';
      if (!text || text.length < 10) continue;
      if (text.toLowerCase().includes(dbCleanName.slice(0, 15))) {
        matchedMsg = msg;
        break;
      }
    }

    if (!matchedMsg) continue;

    // Find all messages in this album/group that have photos
    const msgDate = matchedMsg.date || 0;
    const albumMessages = messages.filter(m => {
      const mDate = m.date || 0;
      return Math.abs(mDate - msgDate) < 120; // within 2 minutes
    });

    const dressImages: string[] = [];

    for (const albumMsg of albumMessages) {
      // @ts-ignore
      const media = albumMsg.media;
      if (!media) continue;

      // Only download photos (skip videos/documents)
      const isPhoto = media.className === 'MessageMediaPhoto' || media.photo;
      const isDoc = media.className === 'MessageMediaDocument' || media.document;
      
      if (isDoc) {
        // @ts-ignore
        const mime = media.document?.mimeType || '';
        if (mime.startsWith('video/')) {
          console.log(`  ⏭️ تخطي فيديو (${mime})`);
          continue;
        }
      }

      if (!isPhoto && !isDoc) continue;

      try {
        console.log(`  📥 جاري تنزيل صورة لـ "${dbDress.name}"...`);
        // @ts-ignore
        const buffer = await client.downloadMedia(albumMsg, { maxSize: 10 * 1024 * 1024 }) as Buffer;
        
        if (!buffer || buffer.length === 0) continue;

        const fileName = `dress_${dbDress.id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.jpg`;
        const filePath = path.join(UPLOADS_DIR, fileName);
        fs.writeFileSync(filePath, buffer);

        const imageUrl = `/uploads/${fileName}`;
        dressImages.push(imageUrl);
        totalImagesDownloaded++;
        console.log(`  ✅ تم حفظ: ${imageUrl}`);
      } catch (e) {
        console.log(`  ⚠️ فشل تنزيل صورة: ${e}`);
      }
    }

    if (dressImages.length > 0) {
      // Get first variant of this dress and assign images to it
      const firstVariant = dbDress.variants[0];
      if (firstVariant) {
        // Remove placeholder images
        await prisma.dressImage.deleteMany({
          where: {
            variant: { dressId: dbDress.id },
            url: '/uploads/dress1.jpg'
          }
        });

        // Add real downloaded images
        for (const imgUrl of dressImages) {
          await prisma.dressImage.create({
            data: {
              url: imgUrl,
              variantId: firstVariant.id,
            }
          });
        }

        dressesUpdated++;
        console.log(`\n🎉 "${dbDress.name}" → تم حفظ ${dressImages.length} صورة بقاعدة البيانات!\n`);
      }
    }
  }

  console.log('===========================================================');
  console.log(`✅ تم الانتهاء! إجمالي الصور المُنزَّلة: ${totalImagesDownloaded} صورة`);
  console.log(`👗 الفساتين التي تم تحديثها: ${dressesUpdated} فستان`);
  console.log('===========================================================');

  await client.disconnect();
}

downloadTelegramImages().catch(console.error);
