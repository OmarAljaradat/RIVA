import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import fs from 'fs';
import path from 'path';
import { parseChannelPost } from '../src/lib/telegram.js';

const apiId = 34081063;
const apiHash = '018dc673429227e26a1b8d9d65eb76ca';
const SESSION_FILE = path.join(process.cwd(), 'prisma', 'telegram_user.session');

async function testStrictParse() {
  const sessionString = fs.readFileSync(SESSION_FILE, 'utf8').trim();
  const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.connect();
  const dialogs = await client.getDialogs({});
  const targetChannel = dialogs.find(d => d.title?.includes('جرد') || d.title?.includes('Corner'));

  if (!targetChannel) return;

  const messages = await client.getMessages(targetChannel.entity, { limit: 30 });
  
  console.log(`\n========================================`);
  console.log(`STRICT PARSE TEST FOR CORNER CHANNEL`);
  console.log(`========================================\n`);

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const text = m.message || '';
    if (!text) continue;

    const parsed = parseChannelPost(text);
    if (parsed) {
      console.log(`👗 DRESS NAME: "${parsed.name}" (${parsed.price} JD)`);
      const uniqueColors = Array.from(new Set(parsed.variants.map(v => v.color)));
      console.log(`   🎨 Colors Parsed: [${uniqueColors.join(', ')}]`);
      parsed.variants.forEach(v => {
        console.log(`      - Color: "${v.color}" | Size: "${v.size}" | Qty: ${v.quantity}`);
      });
      console.log(`----------------------------------------`);
    }
  }
}

testStrictParse().catch(console.error);
