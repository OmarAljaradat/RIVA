import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import fs from 'fs';
import path from 'path';

const apiId = 34081063;
const apiHash = '018dc673429227e26a1b8d9d65eb76ca';
const SESSION_FILE = path.join(process.cwd(), 'prisma', 'telegram_user.session');

async function test() {
  const sessionString = fs.readFileSync(SESSION_FILE, 'utf8').trim();
  const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.connect();
  console.log('Connected! Searching for channel...');

  const dialogs = await client.getDialogs({});
  const targetChannel = dialogs.find(d => d.title?.includes('جرد') || d.title?.includes('Corner'));

  if (!targetChannel) {
    console.log('Channel not found!');
    return;
  }

  const messages = await client.getMessages(targetChannel.entity, { limit: 20 });
  console.log(`Inspecting ${messages.length} messages...`);

  for (const m of messages) {
    console.log(`Msg ID: ${m.id} | HasMedia: ${!!m.media} | GroupedId: ${m.groupedId} | Text: ${(m.message || '').substring(0, 30)}`);
    if (m.media) {
      console.log(`   Media className: ${m.media.className}`);
      try {
        const buf = await client.downloadMedia(m, {});
        if (buf && buf instanceof Buffer) {
          console.log(`   ✅ Downloaded ${buf.length} bytes!`);
        } else {
          console.log(`   ❌ Downloaded returned empty/non-buffer`);
        }
      } catch (err: any) {
        console.log(`   ❌ Download error: ${err.message}`);
      }
    }
  }
}

test().catch(console.error);
