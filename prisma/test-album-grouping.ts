import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import fs from 'fs';
import path from 'path';
import { parseChannelPost } from '../src/lib/telegram.js';

const apiId = 34081063;
const apiHash = '018dc673429227e26a1b8d9d65eb76ca';
const SESSION_FILE = path.join(process.cwd(), 'prisma', 'telegram_user.session');

async function testAlbumGrouping() {
  const sessionString = fs.readFileSync(SESSION_FILE, 'utf8').trim();
  const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.connect();
  const dialogs = await client.getDialogs({});
  const targetChannel = dialogs.find(d => d.title?.includes('جرد') || d.title?.includes('Corner'));

  if (!targetChannel) return;

  const messages = await client.getMessages(targetChannel.entity, { limit: 40 });
  
  console.log(`\n========================================`);
  console.log(`ANALYZING EXACT ALBUM GROUPING FOR CORNER CHANNEL`);
  console.log(`========================================\n`);

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const text = m.message || '';
    const parsed = parseChannelPost(text);

    if (parsed) {
      console.log(`👗 DRESS FOUND: [ID ${m.id}] "${parsed.name}" (${parsed.price} JD)`);

      // Find album media
      let albumGroupedId: string | null = m.groupedId ? String(m.groupedId) : null;

      // If text msg doesn't have groupedId, look at adjacent messages for their groupedId
      if (!albumGroupedId) {
        const prev = messages[i - 1];
        const next = messages[i + 1];
        if (prev?.groupedId && !prev.message) albumGroupedId = String(prev.groupedId);
        else if (next?.groupedId && !next.message) albumGroupedId = String(next.groupedId);
      }

      console.log(`   GroupedId for this dress: ${albumGroupedId || 'None (Single Post)'}`);

      const matchedMediaMsgs: any[] = [];

      if (albumGroupedId) {
        // Collect ALL messages with this exact groupedId
        messages.forEach(msg => {
          if (msg.groupedId && String(msg.groupedId) === albumGroupedId) {
            matchedMediaMsgs.push(msg);
          }
        });
      } else if (m.media) {
        matchedMediaMsgs.push(m);
      }

      console.log(`   📸 Matched EXACT media items: ${matchedMediaMsgs.length} files`);
      matchedMediaMsgs.forEach(mm => {
        console.log(`      - Msg ID ${mm.id}: Media ${mm.media?.className}`);
      });
      console.log(`----------------------------------------`);
    }
  }
}

testAlbumGrouping().catch(console.error);
