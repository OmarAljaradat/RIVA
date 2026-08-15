import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { parseDressWithAi } from '../src/lib/ai-parser.js';
import fs from 'fs';
import path from 'path';

const apiId = 34081063;
const apiHash = '018dc673429227e26a1b8d9d65eb76ca';
const SESSION_FILE = path.join(process.cwd(), 'prisma', 'telegram_user.session');

async function countAllAiDresses() {
  if (!fs.existsSync(SESSION_FILE)) {
    console.log('❌ ملف الجلسة غير موجود.');
    return;
  }

  const stringSession = fs.readFileSync(SESSION_FILE, 'utf8').trim();
  const client = new TelegramClient(new StringSession(stringSession), apiId, apiHash, {
    connectionRetries: 5,
  });

  console.log('📱 جاري الاتصال بالتيليجرام لحصر كافة الفساتين والموديلات بالقناة بواسطة الذكاء الاصطناعي...');
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
  console.log('🔍 جاري سحب وقراءة كافة منشورات القناة بدون استثناء...\n');

  // Fetch up to 500 posts
  const messages = await client.getMessages(targetChannel.entity, { limit: 500 });
  console.log(`📦 إجمالي المنشورات بالقناة: ${messages.length} منشور.`);

  const aiDetectedDresses: { name: string; costPrice: number; sellingPrice: number; variantsCount: number; isSoldOutAll: boolean }[] = [];

  for (const msg of messages) {
    const text = msg.message || '';
    if (!text || text.length < 10) continue;

    const parsed = await parseDressWithAi(text);
    if (!parsed || parsed.variants.length === 0) continue;

    const isSoldOutAll = parsed.variants.every(v => v.quantity === 0 || v.size.includes('خالص') || v.size.includes('نفذت'));

    aiDetectedDresses.push({
      name: parsed.name || parsed.description,
      costPrice: parsed.costPrice,
      sellingPrice: parsed.sellingPrice,
      variantsCount: parsed.variants.length,
      isSoldOutAll
    });
  }

  console.log('\n===========================================================');
  console.log(`📊 العدد الإجمالي للموديلات التي يراها الذكاء الاصطناعي في القناة: ${aiDetectedDresses.length} فستاناً/موديلاً`);
  console.log('===========================================================\n');

  const availableDressesCount = aiDetectedDresses.filter(d => !d.isSoldOutAll).length;
  const soldOutDressesCount = aiDetectedDresses.filter(d => d.isSoldOutAll).length;

  console.log(`✅ فساتين فيها مقاسات متوفرة: ${availableDressesCount}`);
  console.log(`🔴 فساتين خالص كل السايزات فيها: ${soldOutDressesCount}`);
  console.log(`📦 المجموع الكلي: ${aiDetectedDresses.length} موديل.`);

  await client.disconnect();
}

countAllAiDresses().catch(console.error);
