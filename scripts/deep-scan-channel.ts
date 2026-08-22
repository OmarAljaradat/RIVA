import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { parseChannelPost } from '../src/lib/telegram.js';
import { parseDressWithAi } from '../src/lib/ai-parser.js';
import prisma from '../src/lib/prisma.js';
import fs from 'fs';
import path from 'path';

const apiId = 34081063;
const apiHash = '018dc673429227e26a1b8d9d65eb76ca';
const SESSION_FILE = path.join(process.cwd(), 'prisma', 'telegram_user.session');

async function main() {
  if (!fs.existsSync(SESSION_FILE)) {
    console.log('❌ ملف الجلسة غير موجود.');
    return;
  }

  const stringSession = fs.readFileSync(SESSION_FILE, 'utf8').trim();
  const client = new TelegramClient(new StringSession(stringSession), apiId, apiHash, {
    connectionRetries: 5,
  });

  console.log('📱 جاري الاتصال بحساب التيليجرام...');
  await client.connect();

  console.log('📋 جاري جلب جميع المحادثات والقنوات في الحساب...');
  const dialogs = await client.getDialogs({});
  console.log(`\n🔍 القنوات والمجموعات الموجودة في الحساب (${dialogs.length}):`);
  dialogs.forEach((d, i) => {
    if (d.isChannel || d.isGroup) {
      console.log(`  [${i + 1}] "${d.title}" (ID: ${d.id})`);
    }
  });

  const targetChannel = dialogs.find(d => 
    d.title?.includes('جرد مندوبات') || 
    d.title?.includes('Corner') || 
    d.title?.includes('جرد')
  );

  if (!targetChannel) {
    console.log('❌ لم يتم العثور على القناة المستهدفة.');
    await client.disconnect();
    return;
  }

  console.log(`\n🎯 القناة المستهدفة: "${targetChannel.title}" (ID: ${targetChannel.id})`);
  console.log('📥 جاري سحب آخر 200 رسالة من القناة...\n');

  const messages = await client.getMessages(targetChannel.entity, { limit: 200 });
  console.log(`📦 إجمالي الرسائل المسحوبة: ${messages.length}`);

  // Fetch all existing dresses from DB for comparison
  const dbDresses = await prisma.dress.findMany({
    select: { id: true, name: true, price: true }
  });
  console.log(`🌐 الفساتين المسجلة في الموقع حالياً: ${dbDresses.length} فستان\n`);

  const allFoundDresses: Array<{
    msgId: number;
    date: Date;
    rawText: string;
    parsedName: string;
    parsedPrice: number;
    inDb: boolean;
  }> = [];

  for (const msg of messages) {
    const text = msg.message || '';
    if (!text || text.trim().length < 5) continue;

    // Check if message has price or dress details
    const hasPrice = text.includes('السعر') || text.toLowerCase().includes('jd') || text.includes('دينار') || /\d+\s*(?:jd|دينار)/i.test(text);
    if (!hasPrice) continue;

    const parsed = parseChannelPost(text);
    const name = parsed ? parsed.name : text.split('\n')[0].replace(/^[✨🔹👗🌸⭐👑🖤❤️💙\s]+/, '').trim();
    const price = parsed ? parsed.price : 0;

    // Check if this exists in DB
    const cleanName = name.toLowerCase().replace(/✨️|💫|🌷|🎗/g, '').trim();
    const match = dbDresses.find(d => {
      const dbClean = d.name.toLowerCase().replace(/✨️|💫|🌷|🎗/g, '').trim();
      return dbClean.includes(cleanName.slice(0, 12)) || cleanName.includes(dbClean.slice(0, 12));
    });

    allFoundDresses.push({
      msgId: msg.id,
      date: new Date(msg.date * 1000),
      rawText: text,
      parsedName: name,
      parsedPrice: price,
      inDb: !!match
    });
  }

  console.log('===========================================================');
  console.log(`👗 إجمالي المنشورات التي تحتوي فساتين/أسعار في القناة: ${allFoundDresses.length}`);
  console.log('===========================================================\n');

  const newDresses = allFoundDresses.filter(d => !d.inDb);
  const existingDresses = allFoundDresses.filter(d => d.inDb);

  console.log(`✅ فساتين موجودة بالموقع: ${existingDresses.length}`);
  console.log(`✨ فساتين جديدة في القناة غير مضافة للموقع: ${newDresses.length}\n`);

  if (newDresses.length > 0) {
    console.log('🚨 الفساتين الجديدة المكتشفة في القناة:');
    newDresses.forEach((d, idx) => {
      console.log(`\n[جديد #${idx + 1}] رسالة ID: ${d.msgId} | التاريخ: ${d.date.toLocaleString('ar-JO')}`);
      console.log(`الاسم: "${d.parsedName}" | السعر: ${d.parsedPrice} د.أ`);
      console.log(`نص المنشور:`);
      console.log(d.rawText);
      console.log('-----------------------------------------------------------');
    });
  } else {
    console.log('📌 كل المنشورات التي تحتوي فساتين وأسعار في القناة موجودة مسبقاً في قاعدة البيانات.');
  }

  // Print all found posts with dates
  console.log('\n📋 قائمة بكافة منشورات الفساتين في القناة مرتبة من الأحدث للأقدم:');
  allFoundDresses.forEach((d, idx) => {
    const status = d.inDb ? '✅ موجود بالموقع' : '✨ جديد';
    console.log(`${idx + 1}. [${status}] (${d.date.toLocaleDateString('ar-JO')}) "${d.parsedName}" - ${d.parsedPrice} د.أ`);
  });

  await client.disconnect();
}

main().catch(console.error);
