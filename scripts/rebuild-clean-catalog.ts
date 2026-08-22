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

// الكلمات العامة
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

async function rebuildCleanCatalog() {
  console.log('🧹 بدء تنظيف وإعادة ضبط جميع الفساتين بدقة 100% وإزالة أي ألوان زائدة أو مدبلجة...\n');

  const client = new TelegramClient(new StringSession(stringSession), apiId, apiHash, { connectionRetries: 3 });
  await client.connect();

  const dialogs = await client.getDialogs({});
  const targetChannel = dialogs.find(d => d.title?.includes('جرد مندوبات') || d.title?.includes('Corner') || d.title?.includes('جرد'));
  if (!targetChannel) {
    console.log('❌ لم يتم العثور على القناة');
    return;
  }

  const messages = await client.getMessages(targetChannel.entity, { limit: 300 });
  const dbDresses = await prisma.dress.findMany({
    include: {
      variants: {
        include: { images: true }
      }
    },
    orderBy: { id: 'asc' }
  });

  const claimedMessageIds = new Set<number>();
  let cleanedDressesCount = 0;

  for (const dress of dbDresses) {
    let bestMsg: any = null;
    let highestScore = 0;

    for (const msg of messages) {
      if (claimedMessageIds.has(msg.id)) continue;
      const text = msg.message || '';
      if (!text || text.length < 15) continue;

      const score = calculateStrictMatchScore(dress.name, text);
      if (score > highestScore && score >= 0.7) {
        highestScore = score;
        bestMsg = msg;
      }
    }

    if (!bestMsg) {
      console.log(`⚠️ فستان ID ${dress.id} ("${dress.name.slice(0, 35)}"): لم يتم العثور على منشور مطابق -> تم تركه كما هو.`);
      continue;
    }

    claimedMessageIds.add(bestMsg.id);

    const parsed = parseDressExpert(bestMsg.message || '');
    if (!parsed || parsed.variants.length === 0) continue;

    // الألوان الحقيقية فقط المذكورة في منشور هذا الفستان
    const realColors = Array.from(new Set(parsed.variants.map(v => v.color.trim())));

    console.log(`================================================================`);
    console.log(`👗 [${++cleanedDressesCount}] تنظيف فستان ID ${dress.id}: "${dress.name.slice(0, 45)}"`);
    console.log(`   📝 المنشور الأصلي ID ${bestMsg.id}`);
    console.log(`   🎨 الألوان الحقيقية (${realColors.length}): ${realColors.join('، ')}`);

    // 1. حذف جميع المتغيرات (Variants) والصور التي لا تنتمي للألوان الحقيقية للمنشور
    const variantsToDelete = dress.variants.filter(v => !realColors.includes(v.color.trim()));
    if (variantsToDelete.length > 0) {
      const idsToDelete = variantsToDelete.map(v => v.id);
      await prisma.dressImage.deleteMany({ where: { variantId: { in: idsToDelete } } });
      await prisma.dressVariant.deleteMany({ where: { id: { in: idsToDelete } } });
      console.log(`   🗑️ تم حذف ${variantsToDelete.length} لون/مقاس زائد ودخيل (${Array.from(new Set(variantsToDelete.map(v => v.color))).join(', ')})`);
    }

    // 2. تحديث وتثبيت المقاسات الدقيقة للألوان الحقيقية فقط
    for (const color of realColors) {
      const postColorVariants = parsed.variants.filter(v => v.color.trim() === color && v.quantity > 0 && !v.size.includes('خالص'));

      if (postColorVariants.length === 0) {
        // اللون خالص في المنشور
        const existingColorVars = dress.variants.filter(v => v.color.trim() === color);
        for (const ev of existingColorVars) {
          await prisma.dressVariant.update({ where: { id: ev.id }, data: { quantity: 0 } });
        }
      } else {
        const activeSizes = postColorVariants.map(v => v.size.trim());

        for (const pv of postColorVariants) {
          const existing = dress.variants.find(v => v.color.trim() === color && v.size.trim() === pv.size.trim());
          if (existing) {
            await prisma.dressVariant.update({ where: { id: existing.id }, data: { quantity: 5 } });
          } else {
            await prisma.dressVariant.create({
              data: {
                dressId: dress.id,
                color: pv.color.trim(),
                colorHex: pv.colorHex || '#000000',
                size: pv.size.trim(),
                quantity: 5
              }
            });
          }
        }

        // تصفير أي مقاس غير مذكور في المنشور
        const existingColorVars = dress.variants.filter(v => v.color.trim() === color);
        for (const ev of existingColorVars) {
          if (!activeSizes.includes(ev.size.trim())) {
            await prisma.dressVariant.update({ where: { id: ev.id }, data: { quantity: 0 } });
          }
        }
      }
    }
  }

  console.log('\n============================================================');
  console.log(`🎉 تم تنظيف وضبط كافة الفساتين (${cleanedDressesCount} فستان) بنجاح 100%!`);
  console.log('============================================================');

  await client.disconnect();
}

rebuildCleanCatalog().catch(console.error);
