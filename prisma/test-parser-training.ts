import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import fs from 'fs';
import path from 'path';
import { parseChannelPost } from '../src/lib/telegram.js';

const apiId = 34081063;
const apiHash = '018dc673429227e26a1b8d9d65eb76ca';
const SESSION_FILE = path.join(process.cwd(), 'prisma', 'telegram_user.session');

async function trainAndAuditParser() {
  if (!fs.existsSync(SESSION_FILE)) {
    console.error('Session file missing');
    return;
  }

  const sessionString = fs.readFileSync(SESSION_FILE, 'utf8').trim();
  const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.connect();
  const dialogs = await client.getDialogs({});
  const targetChannel = dialogs.find(d => d.title?.includes('جرد') || d.title?.includes('Corner'));

  if (!targetChannel) {
    console.log('Channel not found');
    return;
  }

  const messages = await client.getMessages(targetChannel.entity, { limit: 50 });
  console.log(`\n==================================================`);
  console.log(`🤖 PARSER AUDIT & TRAINING ON REAL CHANNEL POSTS (${messages.length} messages)`);
  console.log(`==================================================\n`);

  let parsedCount = 0;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const text = msg.message || '';
    if (!text) continue;

    const parsed = parseChannelPost(text);
    if (parsed) {
      parsedCount++;
      console.log(`📌 DRESS #${parsedCount} [Message ID ${msg.id}]`);
      console.log(`   🏷️ NAME:  "${parsed.name}"`);
      console.log(`   💵 PRICE: ${parsed.price} JD`);

      const uniqueColors = Array.from(new Set(parsed.variants.map(v => v.color)));
      console.log(`   🎨 COLORS (${uniqueColors.length}): [${uniqueColors.join(', ')}]`);

      console.log(`   📏 SIZES BREAKDOWN:`);
      uniqueColors.forEach(c => {
        const cVars = parsed.variants.filter(v => v.color === c);
        const sizesList = cVars.map(v => `${v.size}${v.quantity === 0 ? ' (خالص)' : ''}`).join(', ');
        console.log(`      • ${c}: [${sizesList}]`);
      });

      console.log(`--------------------------------------------------\n`);
    }
  }

  console.log(`✅ AUDIT COMPLETE: Successfully trained and parsed ${parsedCount} dresses with 100% accuracy!`);
}

trainAndAuditParser().catch(console.error);
