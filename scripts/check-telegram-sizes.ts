import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import prisma from '../src/lib/prisma.js';
import { parseChannelPost } from '../src/lib/telegram.js';
import fs from 'fs';
import path from 'path';

const apiId = 34081063;
const apiHash = '018dc673429227e26a1b8d9d65eb76ca';
const SESSION_FILE = path.join(process.cwd(), 'prisma', 'telegram_user.session');

async function checkTelegramSizes() {
  if (!fs.existsSync(SESSION_FILE)) {
    console.log('❌ لا يوجد ملف جلسة تيليجرام محفوظ.');
    return;
  }

  const stringSession = fs.readFileSync(SESSION_FILE, 'utf8').trim();
  const client = new TelegramClient(new StringSession(stringSession), apiId, apiHash, {
    connectionRetries: 5,
  });

  console.log('📱 جاري الاتصال بحسابك في تيليجرام وتفقد قناة الجرد...');
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

  console.log(`🎯 تم الاتصال بالقناة: "${targetChannel.title}"`);
  console.log('🔍 جاري فحص المنشورات والمقارنة مع المقاسات الحالية دون أي تعديل على الموقع...\n');

  const messages = await client.getMessages(targetChannel.entity, { limit: 150 });
  const dbDresses = await prisma.dress.findMany({
    include: { variants: true }
  });

  let totalChecked = 0;
  let changesFoundCount = 0;
  const changesReport: string[] = [];

  for (const msg of messages) {
    const text = msg.message || '';
    if (!text) continue;

    const parsed = parseChannelPost(text);
    if (!parsed) continue;

    totalChecked++;

    // Find matching dress in DB by similar description/name keywords
    const dbMatch = dbDresses.find(d => {
      const dbText = (d.description || d.name).toLowerCase();
      const parseText = parsed.name.toLowerCase();
      return dbText.includes(parseText) || parseText.includes(dbText);
    });

    if (dbMatch) {
      // Compare available sizes
      const liveSizes = parsed.variants.map(v => `${v.color}: ${v.size} (qty: ${v.quantity})`).sort();
      const currentDbSizes = dbMatch.variants.map(v => `${v.color}: ${v.size} (qty: ${v.quantity})`).sort();

      const hasChange = JSON.stringify(liveSizes) !== JSON.stringify(currentDbSizes);

      if (hasChange) {
        changesFoundCount++;
        changesReport.push(`
📌 الفستان: "${dbMatch.name}"
   - السايزات في قناة التيليجرام الآن: [ ${parsed.variants.map(v => `${v.color} (${v.size})`).join(' ، ')} ]
   - السايزات على الموقع حالياً: [ ${dbMatch.variants.map(v => `${v.color} (${v.size})`).join(' ، ')} ]
`);
      }
    }
  }

  console.log('====================================================');
  console.log(`📊 نتيجة الفحص الشامل (${totalChecked} منشور تم فحصها):`);
  console.log('====================================================');

  if (changesFoundCount === 0) {
    console.log('✅ جميع المقاسات والسايزات في قناة التيليجرام متطابقة 100% مع الموجود على الموقع!');
    console.log('👍 لا يوجد أي تغيير أو تحديث جديد في القناة حالياً.');
  } else {
    console.log(`⚠️ تم اكتشاف تغييرات في ${changesFoundCount} فساتين في قناة التيليجرام:\n`);
    console.log(changesReport.join('\n'));
    console.log('⚠️ ملاحظة: تم الفحص للعرض فقط ولم يتم إجراء أي تعديل على الموقع.');
  }

  await client.disconnect();
}

checkTelegramSizes().catch(console.error);
