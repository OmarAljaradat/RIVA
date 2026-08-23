import 'dotenv/config';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import prisma from '../src/lib/prisma.js';
import fs from 'fs';

const apiId = 34081063;
const apiHash = '018dc673429227e26a1b8d9d65eb76ca';
const SESSION_FILE = 'prisma/telegram_user.session';

async function syncAllMedia() {
  console.log('🚀 بدء مزامنة ورفع جميع فيديوهات وصور الفساتين من التيليجرام لقاعدة البيانات...\n');

  const session = fs.readFileSync(SESSION_FILE, 'utf8').trim();
  const client = new TelegramClient(new StringSession(session), apiId, apiHash, {
    connectionRetries: 3,
  });
  await client.connect();

  const dialogs = await client.getDialogs({});
  const targetChannel = dialogs.find(d =>
    d.title?.includes('جرد مندوبات') ||
    d.title?.includes('Corner') ||
    d.title?.includes('جرد')
  );

  if (!targetChannel) {
    console.log('Channel not found');
    await client.disconnect();
    return;
  }

  const messages = await client.getMessages(targetChannel.entity, { limit: 400 });

  // Get all dresses
  const dresses = await prisma.dress.findMany({
    include: { variants: { include: { images: true } } },
    orderBy: { telegramMsgId: 'desc' }
  });

  console.log(`Found ${dresses.length} dresses in DB.`);

  for (const dress of dresses) {
    if (!dress.telegramMsgId) continue;
    const textMsg = messages.find(m => m.id === dress.telegramMsgId);
    if (!textMsg) continue;

    console.log(`\n-----------------------------------------`);
    console.log(`👗 فستان: "${dress.name}" (ID: ${dress.id}, Telegram Msg: #${dress.telegramMsgId})`);

    // Find media messages
    let relatedMedia: any[] = [];
    if (textMsg.groupedId) {
      relatedMedia = messages.filter(m => m.groupedId && m.groupedId.toString() === textMsg.groupedId?.toString() && m.media);
    } else {
      // Find messages strictly before this text message until the previous text message
      const prevDress = dresses.find(d => d.telegramMsgId && d.telegramMsgId < textMsg.id);
      const minMsgId = prevDress?.telegramMsgId ? prevDress.telegramMsgId : textMsg.id - 8;
      relatedMedia = messages.filter(m => m.id < textMsg.id && m.id > minMsgId && m.media);
    }

    relatedMedia.sort((a, b) => a.id - b.id);
    console.log(`   Found ${relatedMedia.length} media items in Telegram.`);

    const variantsByColor = new Map<string, any[]>();
    for (const v of dress.variants) {
      if (!variantsByColor.has(v.color)) {
        variantsByColor.set(v.color, []);
      }
      variantsByColor.get(v.color)!.push(v);
    }

    const uniqueColors = Array.from(variantsByColor.keys());
    console.log(`   Dress Colors (${uniqueColors.length}): [${uniqueColors.join(', ')}]`);

    // Upload media items and map to colors
    let mediaIdx = 0;
    for (const rm of relatedMedia) {
      const isVideo = rm.media?.className === 'MessageMediaDocument' && rm.media?.document?.mimeType?.includes('video');
      const isPhoto = rm.media?.className === 'MessageMediaPhoto';
      if (!isVideo && !isPhoto) continue;

      try {
        console.log(`   ⏳ Downloading media #${rm.id} (${isVideo ? 'Video' : 'Photo'})...`);
        const buffer = await client.downloadMedia(rm.media, { workers: 2 });
        if (!buffer || (buffer as Buffer).length === 0) continue;

        const ext = isVideo ? 'mp4' : 'jpg';
        const mime = isVideo ? 'video/mp4' : 'image/jpeg';
        const blob = new Blob([buffer as Buffer], { type: mime });

        const uploadFormData = new FormData();
        uploadFormData.append('reqtype', 'fileupload');
        uploadFormData.append('fileToUpload', blob, `dress_${dress.id}_${rm.id}.${ext}`);

        const cdnRes = await fetch('https://catbox.moe/user/api.php', {
          method: 'POST',
          body: uploadFormData,
        });

        const cdnUrl = (await cdnRes.text()).trim();
        if (cdnUrl.startsWith('https://files.catbox.moe/')) {
          console.log(`   ✅ Uploaded: ${cdnUrl}`);

          // Assign to color variant
          const targetColor = uniqueColors[mediaIdx % uniqueColors.length];
          const colorVariants = variantsByColor.get(targetColor) || [];
          for (const variant of colorVariants) {
            // Check if already exists
            const exists = await prisma.dressImage.findFirst({
              where: { variantId: variant.id, url: cdnUrl }
            });
            if (!exists) {
              await prisma.dressImage.create({
                data: { variantId: variant.id, url: cdnUrl }
              });
            }
          }
          console.log(`      Attached to color: (${targetColor})`);
          mediaIdx++;
        }
      } catch (err: any) {
        console.error(`   ❌ Failed to sync media #${rm.id}:`, err?.message);
      }
    }
  }

  await client.disconnect();
  console.log('\n✨ تمت مزامنة جميع الوسائط بنجاح كامل!');
}

syncAllMedia().catch(console.error);
