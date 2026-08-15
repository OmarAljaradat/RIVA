import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import prisma from '../src/lib/prisma.js';
import { parseDressWithAi } from '../src/lib/ai-parser.js';
import fs from 'fs';
import path from 'path';

const apiId = 34081063;
const apiHash = '018dc673429227e26a1b8d9d65eb76ca';
const SESSION_FILE = path.join(process.cwd(), 'prisma', 'telegram_user.session');

interface AuditResult {
  dressName: string;
  telegramPostText: string;
  aiExtractedSizes: string[];
  dbCurrentSizes: string[];
  isIdentical: boolean;
  diffSummary: string;
}

async function scanTelegramWithAi() {
  if (!fs.existsSync(SESSION_FILE)) {
    console.log('❌ ملف الجلسة غير موجود.');
    return;
  }

  const stringSession = fs.readFileSync(SESSION_FILE, 'utf8').trim();
  const client = new TelegramClient(new StringSession(stringSession), apiId, apiHash, {
    connectionRetries: 5,
  });

  console.log('📱 جاري الاتصال بالتيليجرام وعمل سكان كامل بالقناة بواسطة الذكاء الاصطناعي...');
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

  console.log(`🎯 القناة المستهدفة: "${targetChannel.title}"`);
  console.log('🤖 جاري تحليل جميع منشورات الجرد بواسطة محرك الذكاء الاصطناعي...\n');

  const messages = await client.getMessages(targetChannel.entity, { limit: 150 });
  const dbDresses = await prisma.dress.findMany({
    include: { variants: true }
  });

  const results: AuditResult[] = [];

  for (const msg of messages.reverse()) {
    const text = msg.message || '';
    if (!text || text.length < 10) continue;

    // Use AI parser to analyze the raw post text
    const aiParsed = await parseDressWithAi(text);
    if (!aiParsed || aiParsed.variants.length === 0) continue;

    // Match with current DB dresses
    const dbMatch = dbDresses.find(d => {
      const dbDesc = (d.description || d.name).toLowerCase();
      const aiDesc = aiParsed.description.toLowerCase();
      return dbDesc.includes(aiDesc.slice(0, 15)) || aiDesc.includes(dbDesc.slice(0, 15));
    });

    const aiSizesFormatted = aiParsed.variants
      .map(v => `${v.color}: ${v.size}`)
      .sort();

    if (dbMatch) {
      const dbSizesFormatted = dbMatch.variants
        .map(v => `${v.color}: ${v.size}`)
        .sort();

      const isIdentical = JSON.stringify(aiSizesFormatted) === JSON.stringify(dbSizesFormatted);

      let diffSummary = '✅ متطابق 100%';
      if (!isIdentical) {
        diffSummary = `⚠️ يوجد اختلاف بين القناة والموقع:
     • بالتيليجرام (حسب الذكاء الاصطناعي): [ ${aiParsed.variants.map(v => `${v.color} (${v.size})`).join(', ')} ]
     • على الموقع حالياً: [ ${dbMatch.variants.map(v => `${v.color} (${v.size})`).join(', ')} ]`;
      }

      results.push({
        dressName: dbMatch.name,
        telegramPostText: text,
        aiExtractedSizes: aiSizesFormatted,
        dbCurrentSizes: dbSizesFormatted,
        isIdentical,
        diffSummary
      });
    } else {
      results.push({
        dressName: `[منشور جديد غير موجود بالكتالوج]: ${aiParsed.description}`,
        telegramPostText: text,
        aiExtractedSizes: aiSizesFormatted,
        dbCurrentSizes: [],
        isIdentical: false,
        diffSummary: `✨ فستان جديد بالقناة بسعر بيع مقترح: ${aiParsed.sellingPrice} د.أ`
      });
    }
  }

  console.log('===========================================================');
  console.log(`📊 تقرير السكان الكامل بواسطة الذكاء الاصطناعي (${results.length} فستان/منشور):`);
  console.log('===========================================================\n');

  let matchCount = 0;
  let diffCount = 0;

  results.forEach((item, idx) => {
    console.log(`[${idx + 1}] 👗 ${item.dressName}`);
    console.log(`    ${item.diffSummary}\n`);
    if (item.isIdentical) matchCount++;
    else diffCount++;
  });

  console.log('-----------------------------------------------------------');
  console.log(`📈 الخلاصة: ${matchCount} متطابق | ${diffCount} بها اختلافات أو منشورات جديدة.`);
  console.log('🔒 ملاحظة: التقرير للعرض والقرار فقط، لم يتم تعديل أي شيء على الموقع.');

  await client.disconnect();
}

scanTelegramWithAi().catch(console.error);
