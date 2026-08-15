import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { parseDressWithAi } from '../src/lib/ai-parser.js';
import fs from 'fs';
import path from 'path';

const apiId = 34081063;
const apiHash = '018dc673429227e26a1b8d9d65eb76ca';
const SESSION_FILE = path.join(process.cwd(), 'prisma', 'telegram_user.session');
const PREV_SCAN_FILE = path.join(process.cwd(), 'prisma', 'previous_scan_cache.json');

async function compareScans() {
  if (!fs.existsSync(SESSION_FILE)) {
    console.log('❌ ملف الجلسة غير موجود.');
    return;
  }

  const stringSession = fs.readFileSync(SESSION_FILE, 'utf8').trim();
  const client = new TelegramClient(new StringSession(stringSession), apiId, apiHash, {
    connectionRetries: 5,
  });

  console.log('⚡ جاري الاتصال المباشر بالتيليجرام وعمل سكان جديد لحظي لقناة الجرد...');
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
  console.log('🔍 جاري فحص ومقارنة الجرد اللحظي الآن مع السكان السابق من التيليجرام...\n');

  const messages = await client.getMessages(targetChannel.entity, { limit: 500 });
  const currentScanState: Record<string, { text: string; date: number; parsedVariants: string }> = {};

  for (const msg of messages) {
    const text = msg.message || '';
    if (!text || text.length < 10) continue;

    const parsed = await parseDressWithAi(text);
    if (!parsed) continue;

    const key = parsed.name.toLowerCase().trim();
    currentScanState[key] = {
      text,
      date: msg.date || 0,
      parsedVariants: parsed.variants.map(v => `${v.color}:${v.size}:${v.quantity}`).sort().join('|')
    };
  }

  let changesCount = 0;
  const changesDetails: string[] = [];

  if (fs.existsSync(PREV_SCAN_FILE)) {
    const prevScanState: Record<string, { text: string; date: number; parsedVariants: string }> = JSON.parse(
      fs.readFileSync(PREV_SCAN_FILE, 'utf8')
    );

    for (const [key, currentItem] of Object.entries(currentScanState)) {
      const prevItem = prevScanState[key];
      if (!prevItem) {
        changesCount++;
        changesDetails.push(`✨ منشور جديد في القناة الآن: "${key}"`);
      } else if (prevItem.parsedVariants !== currentItem.parsedVariants) {
        changesCount++;
        changesDetails.push(`🔄 تعديل في مقاسات أو ألوان بالقناة لمنشور: "${key}"`);
      }
    }
  } else {
    console.log('ℹ️ تم حفظ السكان الحالي كمرجع للمقارنات اللحظية القادمة.');
  }

  // Save current scan state as previous cache for next comparison
  fs.writeFileSync(PREV_SCAN_FILE, JSON.stringify(currentScanState, null, 2));

  console.log('===========================================================');
  console.log(`⏱️ نتيجة فحص التيليجرام اللحظي الآن (مقارنة بالسكان السابق):`);
  console.log('===========================================================\n');

  if (changesCount === 0) {
    console.log('🟢 لا يوجد أي تغيير إطلاقاً في القناة منذ السكان السابق!');
    console.log('✅ لم ينزل أي منشور جديد ولم يتم تعديل أي مقاس في قناة الجرد حتى هذه اللحظة.');
  } else {
    console.log(`⚠️ تم اكتشاف ${changesCount} تغييرات جديدة في القناة منذ الفحص السابق:\n`);
    changesDetails.forEach(d => console.log(d));
  }

  await client.disconnect();
}

compareScans().catch(console.error);
