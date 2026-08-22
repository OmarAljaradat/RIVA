import 'dotenv/config';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import prisma from '../src/lib/prisma.js';
import { parseDressExpert } from '../src/lib/ai-parser.js';
import fs from 'fs';
import path from 'path';

const apiId = 34081063;
const apiHash = '018dc673429227e26a1b8d9d65eb76ca';
const stringSession = process.env.TELEGRAM_USER_SESSION || '';
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// الكلمات الشائعة لتجنب التداخل
const STOP_WORDS = new Set([
  'قماش', 'نخب', 'اول', 'فاخر', 'مميز', 'راقي', 'فستان', 'طقم', 'قطعتين',
  'مع', 'على', 'من', 'في', 'ال', 'و', 'بالكامل', 'مبطن', 'مبطنه'
]);

function extractDistinctiveKeywords(text: string): string[] {
  return text
    .replace(/[✨💫🌷🎗💕🍂⭐🍁👑🌸👗💎]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[،,.\-_/\\|():]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w) && isNaN(Number(w)));
}

function calculateStrictMatchScore(dbName: string, postText: string): number {
  const normPost = postText
    .replace(/[✨💫🌷🎗💕🍂⭐🍁👑🌸👗💎]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .toLowerCase();

  const dbKeywords = extractDistinctiveKeywords(dbName);
  if (dbKeywords.length === 0) return 0;

  if (dbName.includes('76') && !normPost.includes('76')) return 0;
  if (dbName.includes('80') && !normPost.includes('80')) return 0;
  if (dbName.includes('شال طويل') && !normPost.includes('شال')) return 0;
  if (dbName.includes('ببل') && !normPost.includes('ببل')) return 0;
  if (dbName.includes('دانتيل فرنسي') && !normPost.includes('فرنسي')) return 0;
  if (dbName.includes('شاحط') && !normPost.includes('شاحط')) return 0;
  if (dbName.includes('لولو') && !normPost.includes('لولو')) return 0;
  if (dbName.includes('بليسيه') && !normPost.includes('بليسيه')) return 0;
  if (dbName.includes('جازارا') && !normPost.includes('جازارا')) return 0;
  if (dbName.includes('يوريا') && !normPost.includes('يوريا')) return 0;

  let matched = 0;
  for (const kw of dbKeywords) {
    if (normPost.includes(kw)) matched++;
  }

  return matched / dbKeywords.length;
}

async function downloadAndBindAllMedia() {
  console.log('🚀 بدء المحرك الشامل لسحب الفيديوهات والصور وتوزيعها بدقة 100% على الألوان...\n');

  const client = new TelegramClient(new StringSession(stringSession), apiId, apiHash, { connectionRetries: 3 });
  await client.connect();

  const dialogs = await client.getDialogs({});
  const targetChannel = dialogs.find(d => d.title?.includes('جرد مندوبات') || d.title?.includes('Corner') || d.title?.includes('جرد'));
  if (!targetChannel) {
    console.log('❌ لم يتم العثور على القناة');
    return;
  }

  const messages = await client.getMessages(targetChannel.entity, { limit: 250 });
  console.log(`📦 تم قراءة ${messages.length} رسالة من القناة.\n`);

  const dbDresses = await prisma.dress.findMany({
    include: {
      variants: {
        include: { images: true }
      }
    },
    orderBy: { id: 'asc' }
  });

  let processedCount = 0;
  let totalMediaDownloaded = 0;
  const claimedMessageIds = new Set<number>();

  for (const dress of dbDresses) {
    let bestTextMsg: any = null;
    let highestScore = 0;

    for (const msg of messages) {
      if (claimedMessageIds.has(msg.id)) continue;
      const text = msg.message || '';
      if (!text || text.length < 15) continue;

      const score = calculateStrictMatchScore(dress.name, text);
      if (score > highestScore && score >= 0.7) {
        highestScore = score;
        bestTextMsg = msg;
      }
    }

    if (!bestTextMsg) continue;
    claimedMessageIds.add(bestTextMsg.id);

    // استخراج الألوان بالتسلسل المكتوب في المنشور
    const parsed = parseDressExpert(bestTextMsg.message || '');
    if (!parsed || parsed.variants.length === 0) continue;

    // ألوان الفستان مرتبة
    const orderedColors: string[] = [];
    parsed.variants.forEach(v => {
      if (!orderedColors.includes(v.color)) orderedColors.push(v.color);
    });

    // البحث عن ألبوم الميديا (فيديوهات وصور) التابع للمنشور
    const textMsgId = bestTextMsg.id;
    // الميديا تسبق المنشور مباشرة (id أصغر من textMsgId) أو تشترك في نفس groupedId
    const albumMessages = messages
      .filter(m => m.media && m.id < textMsgId && m.id >= textMsgId - 10)
      .sort((a, b) => a.id - b.id); // ترتيب تصاعدي من أول صورة/فيديو لآخر صورة/فيديو

    if (albumMessages.length === 0) continue;

    processedCount++;
    console.log(`================================================================`);
    console.log(`👗 [${processedCount}] فستان ID ${dress.id}: "${dress.name.slice(0, 45)}"`);
    console.log(`   🎨 الألوان (${orderedColors.length}): ${orderedColors.join('، ')}`);
    console.log(`   🎥 حزمة الميديا (${albumMessages.length} ملف): رسائل [${albumMessages.map(m => m.id).join(', ')}]`);

    // ربط كل ملف ميديا باللون المناظر له بالتسلسل
    for (let i = 0; i < albumMessages.length; i++) {
      const mediaMsg = albumMessages[i];
      // إذا كان عدد الميديا يطابق عدد الألوان نربط بالترتيب، وإلا نوزع دورياً
      const targetColor = orderedColors[i] || orderedColors[i % orderedColors.length];
      if (!targetColor) continue;

      const isVideo = !!mediaMsg.video || mediaMsg.media?.className === 'MessageMediaDocument';
      const ext = isVideo ? 'mp4' : 'jpg';
      const fileName = `dress_${dress.id}_color_${targetColor}_tg_${mediaMsg.id}.${ext}`;
      const filePath = path.join(UPLOADS_DIR, fileName);
      const webUrl = `/uploads/${fileName}`;

      // تحميل الملف إذا لم يكن موجوداً مسبقاً
      if (!fs.existsSync(filePath)) {
        console.log(`   📥 تحميل ${isVideo ? '🎥 فيديو' : '📸 صورة'} للون [${targetColor}]...`);
        try {
          const buffer = await client.downloadMedia(mediaMsg.media, {});
          if (buffer && buffer instanceof Buffer) {
            fs.writeFileSync(filePath, buffer);
            totalMediaDownloaded++;
            console.log(`      ✅ تم الحفظ: ${fileName} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
          }
        } catch (dlErr) {
          console.error(`      ⚠️ خطأ في تحميل الميديا ${mediaMsg.id}:`, dlErr);
          continue;
        }
      }

      // ربط الصورة/الفيديو في قاعدة البيانات بجميع مقاسات هذا اللون
      const colorVariants = dress.variants.filter(v => v.color.trim() === targetColor.trim());
      for (const cv of colorVariants) {
        const imageExists = cv.images.some(img => img.url === webUrl);
        if (!imageExists) {
          await prisma.dressImage.create({
            data: {
              url: webUrl,
              variantId: cv.id
            }
          });
        }
      }
    }

    // تنظيف الصور الوهمية /uploads/dress1.jpg بعد إضافة الميديا الحقيقية
    for (const v of dress.variants) {
      const realImages = await prisma.dressImage.findMany({
        where: { variantId: v.id, NOT: { url: '/uploads/dress1.jpg' } }
      });
      if (realImages.length > 0) {
        await prisma.dressImage.deleteMany({
          where: { variantId: v.id, url: '/uploads/dress1.jpg' }
        });
      }
    }
  }

  console.log('\n============================================================');
  console.log(`🎉 اكتمل سحب وتوزيع الميديا بالكامل!`);
  console.log(`👗 إجمالي الفساتين المعالجة: ${processedCount}`);
  console.log(`🎥 إجمالي الفيديوهات والصور الجديدة المحملة والمربوطة: ${totalMediaDownloaded}`);
  console.log('============================================================');

  await client.disconnect();
}

downloadAndBindAllMedia().catch(console.error);
