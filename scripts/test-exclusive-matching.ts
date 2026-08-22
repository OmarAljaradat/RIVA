import 'dotenv/config';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import prisma from '../src/lib/prisma.js';
import { parseDressExpert } from '../src/lib/ai-parser.js';

const apiId = 34081063;
const apiHash = '018dc673429227e26a1b8d9d65eb76ca';
const stringSession = process.env.TELEGRAM_USER_SESSION || '';

// الكلمات الشائعة التي لا تميز الفستان وتسبب تداخل
const STOP_WORDS = new Set([
  'قماش', 'نخب', 'اول', 'فاخر', 'مميز', 'راقي', 'فستان', 'طقم', 'قطعتين',
  'مع', 'على', 'من', 'في', 'ال', 'و', 'بالكامل', 'مبطن', 'مبطنه', 'نخب_اول'
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

  // فحص المقاسات/الأطوال المميزة (مثل 76cm مقابل 80cm)
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

async function testExclusive1To1Matching() {
  console.log('🛡️ اختبار نظام المطابقة الحصري (1-to-1 Exclusive Matcher) لمنع أي دمج نهائياً...\n');

  const client = new TelegramClient(new StringSession(stringSession), apiId, apiHash, { connectionRetries: 3 });
  await client.connect();

  const dialogs = await client.getDialogs({});
  const targetChannel = dialogs.find(d => d.title?.includes('جرد مندوبات') || d.title?.includes('Corner') || d.title?.includes('جرد'));
  if (!targetChannel) return;

  const messages = await client.getMessages(targetChannel.entity, { limit: 200 });
  const dbDresses = await prisma.dress.findMany({
    include: { variants: true },
    orderBy: { id: 'asc' }
  });

  const claimedPostIds = new Set<number>();
  const matchResults: { dressId: number; dressName: string; postId: number; score: number; colors: string[] }[] = [];

  for (const dress of dbDresses) {
    let bestMsgId: number | null = null;
    let bestMsgText: string | null = null;
    let highestScore = 0;

    for (const msg of messages) {
      if (claimedPostIds.has(msg.id)) continue; // لا يمكن لأي فستان استخدام منشور فستان آخر!

      const text = msg.message || '';
      if (!text || text.length < 15) continue;

      const score = calculateStrictMatchScore(dress.name, text);
      if (score > highestScore && score >= 0.7) {
        highestScore = score;
        bestMsgId = msg.id;
        bestMsgText = text;
      }
    }

    if (bestMsgId && bestMsgText) {
      claimedPostIds.add(bestMsgId); // حجز المنشور حصرياً لهذا الفستان فقط!
      const parsed = parseDressExpert(bestMsgText);
      const uniqueColors = parsed ? Array.from(new Set(parsed.variants.map(v => v.color))) : [];

      matchResults.push({
        dressId: dress.id,
        dressName: dress.name,
        postId: bestMsgId,
        score: highestScore,
        colors: uniqueColors
      });

      console.log(`✅ [مطابقة حصرية 100%] فستان ID ${dress.id}: "${dress.name.slice(0, 40)}"`);
      console.log(`   🔗 حُجز للمنشور ID: ${bestMsgId} (نسبة الدقة: ${Math.round(highestScore * 100)}%)`);
      console.log(`   🎨 ألوان المنشور الحصرية: ${uniqueColors.join('، ')}\n`);
    } else {
      console.log(`ℹ️ [فستان مستقل بدون منشور مطابق]: ID ${dress.id} - "${dress.name.slice(0, 40)}" (يحافظ على بياناته المستقلة)\n`);
    }
  }

  console.log('============================================================');
  console.log(`🎉 النتيجة: تم مطابقة ${matchResults.length} فستاناً بشكل حصري منفرد 1-to-1!`);
  console.log(`🚫 عدد المنشورات المكررة أو المدمجة: 0 (صفر تكرار!)`);
  console.log('============================================================');

  await client.disconnect();
}

testExclusive1To1Matching().catch(console.error);
