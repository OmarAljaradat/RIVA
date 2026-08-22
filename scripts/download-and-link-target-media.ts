import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import prisma from '../src/lib/prisma.js';
import fs from 'fs';
import path from 'path';

const apiId = 34081063;
const apiHash = '018dc673429227e26a1b8d9d65eb76ca';
const SESSION_FILE = path.join(process.cwd(), 'prisma', 'telegram_user.session');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Media groups mapped to dresses
const DRESS_CONFIGS = [
  {
    dressId: 361, // فستان طبقتين شيفون ودانتيل
    textMsgId: 549,
    mediaMsgIds: [543, 544, 545, 546, 547, 548], // 3 videos + 3 photos
    colors: ['كحلي', 'خمري', 'بني']
  },
  {
    dressId: 360, // فستان اورجنزا قصير ناعم
    textMsgId: 556,
    mediaMsgIds: [550, 551, 552, 553, 554, 555], // 2 videos + 4 photos
    colors: ['خمري', 'زهري', 'بني', 'بيبي بلو']
  },
  {
    dressId: 359, // فستان كريب فاخر وشال دانتيل
    textMsgId: 562,
    mediaMsgIds: [557, 558, 559, 560, 561], // 5 videos
    colors: ['بني', 'ابيض', 'خمري', 'زهري']
  }
];

async function downloadAndLinkMedia() {
  const stringSession = fs.readFileSync(SESSION_FILE, 'utf8').trim();
  const client = new TelegramClient(new StringSession(stringSession), apiId, apiHash, { connectionRetries: 5 });
  await client.connect();

  const dialogs = await client.getDialogs({});
  const targetChannel = dialogs.find(d => d.title?.includes('جرد مندوبات') || d.title?.includes('Corner') || d.title?.includes('جرد'));
  if (!targetChannel) { console.log('Channel not found'); return; }

  console.log('🚀 بدء تحميل وربط الميديا (صور وفيديو) للفساتين الـ 3 الجديدة...\n');

  for (const config of DRESS_CONFIGS) {
    const dress = await prisma.dress.findUnique({
      where: { id: config.dressId },
      include: { variants: { include: { images: true } } }
    });

    if (!dress) {
      console.log(`❌ فستان ID ${config.dressId} غير موجود.`);
      continue;
    }

    console.log(`===========================================================`);
    console.log(`👗 معالجة الفستان ID ${dress.id}: "${dress.name}"`);
    console.log(`===========================================================`);

    // Fetch the media messages
    const msgs = await client.getMessages(targetChannel.entity, { ids: config.mediaMsgIds });
    const downloadedUrls: string[] = [];

    for (const msg of msgs.filter(Boolean)) {
      if (!msg.media) continue;

      const isVideo = !!msg.video || msg.media?.className === 'MessageMediaDocument';
      const ext = isVideo ? 'mp4' : 'jpg';
      const fileName = `dress_${dress.id}_tg_${msg.id}_${Date.now().toString().slice(-4)}.${ext}`;
      const filePath = path.join(UPLOADS_DIR, fileName);

      console.log(`  📥 جاري تحميل ${isVideo ? '🎥 فيديو' : '📸 صورة'} (رسالة ID: ${msg.id})...`);
      const buffer = await client.downloadMedia(msg.media, {});

      if (buffer && buffer instanceof Buffer) {
        fs.writeFileSync(filePath, buffer);
        const webUrl = `/uploads/${fileName}`;
        downloadedUrls.push(webUrl);
        console.log(`     ✅ تم الحفظ: ${webUrl} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
      }
    }

    if (downloadedUrls.length === 0) {
      console.log(`  ⚠️ لم يتم العثور على ميديا للتحميل.`);
      continue;
    }

    // Delete old placeholder images for this dress
    for (const v of dress.variants) {
      await prisma.dressImage.deleteMany({
        where: { variantId: v.id, url: '/uploads/dress1.jpg' }
      });
    }

    // Group variants by color
    const variantsByColor: Record<string, typeof dress.variants> = {};
    dress.variants.forEach(v => {
      if (!variantsByColor[v.color]) variantsByColor[v.color] = [];
      variantsByColor[v.color].push(v);
    });

    const colorKeys = Object.keys(variantsByColor);

    // If we have photos/videos per color, distribute them
    // E.g. if we have multiple media, link them smartly
    console.log(`\n  🔗 جاري ربط الميديا بالألوان: [${colorKeys.join(' ، ')}]...`);

    // Link each media file to its color group, or all media to all variants
    for (let cIdx = 0; cIdx < colorKeys.length; cIdx++) {
      const color = colorKeys[cIdx];
      const vars = variantsByColor[color];

      // Pick corresponding media for this color, or assign all downloaded media
      const mediaForColor = downloadedUrls.length === colorKeys.length
        ? [downloadedUrls[cIdx]]
        : downloadedUrls; // attach full gallery if exact 1:1 match isn't 100% known

      for (const variant of vars) {
        for (const url of mediaForColor) {
          await prisma.dressImage.create({
            data: {
              url: url,
              variantId: variant.id
            }
          });
        }
      }
      console.log(`     🎨 لون "${color}": تم ربط ${mediaForColor.length} ملف ميديا.`);
    }

    console.log(`\n  ✨ تم تحديث فستان "${dress.nickname || dress.name}" بالكامل بنجاح!\n`);
  }

  await client.disconnect();
  console.log('🎉 اكتمل سحب وربط كافة الصور والفيديوهات للفساتين الـ 3 بنجاح تام!');
}

downloadAndLinkMedia()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
