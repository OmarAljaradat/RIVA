import 'dotenv/config';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';

const apiId = 34081063;
const apiHash = '018dc673429227e26a1b8d9d65eb76ca';
const stringSession = process.env.TELEGRAM_USER_SESSION || '';

async function inspectMediaStructure() {
  console.log('🔍 فحص هيكلية المنشورات والميديا في القناة لمعرفة ترتيب الفيديوهات والصور والألوان...\n');

  const client = new TelegramClient(new StringSession(stringSession), apiId, apiHash, { connectionRetries: 3 });
  await client.connect();

  const dialogs = await client.getDialogs({});
  const targetChannel = dialogs.find(d => d.title?.includes('جرد مندوبات') || d.title?.includes('Corner') || d.title?.includes('جرد'));
  if (!targetChannel) return;

  const messages = await client.getMessages(targetChannel.entity, { limit: 100 });
  console.log(`📦 تم سحب ${messages.length} رسالة حديثة.\n`);

  // Print first 5 text posts and the media preceding/following them
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.message && (msg.message.includes('السعر') || msg.message.includes('فستان') || msg.message.includes('قماش'))) {
      console.log(`================================================================`);
      console.log(`📌 منشور نصي (ID: ${msg.id}):\n${msg.message}`);
      console.log(`   GroupedId: ${msg.groupedId ? msg.groupedId.toString() : 'None'}`);

      // Find adjacent media messages (before and after)
      const nearby = messages.filter(m => Math.abs(m.id - msg.id) <= 10 && m.id !== msg.id && m.media);
      console.log(`   📸 الميديا المجاورة (${nearby.length} ملف):`);
      for (const nm of nearby) {
        const isVideo = !!nm.video || nm.media?.className === 'MessageMediaDocument';
        console.log(`      - رسالة ID: ${nm.id} | النوع: ${isVideo ? '🎥 فيديو' : '📸 صورة'} | GroupedId: ${nm.groupedId ? nm.groupedId.toString() : 'None'} | Caption: "${nm.message || ''}"`);
      }
    }
  }

  await client.disconnect();
}

inspectMediaStructure().catch(console.error);
