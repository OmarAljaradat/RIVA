import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import fs from 'fs';
import path from 'path';

const apiId = 34081063;
const apiHash = '018dc673429227e26a1b8d9d65eb76ca';
const SESSION_FILE = path.join(process.cwd(), 'prisma', 'telegram_user.session');

async function inspectMedia() {
  const stringSession = fs.readFileSync(SESSION_FILE, 'utf8').trim();
  const client = new TelegramClient(new StringSession(stringSession), apiId, apiHash, { connectionRetries: 5 });
  await client.connect();

  const dialogs = await client.getDialogs({});
  const targetChannel = dialogs.find(d => d.title?.includes('جرد مندوبات') || d.title?.includes('Corner') || d.title?.includes('جرد'));
  if (!targetChannel) { console.log('Channel not found'); return; }

  // Target message IDs from previous scan: 562, 556, 549
  const targetIds = [562, 556, 549];

  for (const tid of targetIds) {
    console.log(`\n======================================================`);
    console.log(`🔍 فحص المنشور ID: ${tid} والرسائل المحيطة به...`);
    console.log(`======================================================`);

    // Fetch surrounding messages around tid (from tid - 10 to tid + 10)
    const msgs = await client.getMessages(targetChannel.entity, {
      ids: Array.from({ length: 15 }, (_, i) => tid - 7 + i)
    });

    msgs.filter(Boolean).forEach(m => {
      const isVideo = !!m.video || m.media?.className === 'MessageMediaDocument';
      const isPhoto = !!m.photo;
      const text = (m.message || '').slice(0, 60);
      const groupedId = m.groupedId ? m.groupedId.toString() : 'none';
      console.log(`Msg ID: ${m.id} | Photo: ${isPhoto} | Video: ${isVideo} | Group: ${groupedId} | Text: "${text}"`);
    });
  }

  await client.disconnect();
}

inspectMedia().catch(console.error);
