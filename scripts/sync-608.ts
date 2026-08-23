import 'dotenv/config';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import prisma from '../src/lib/prisma.js';
import fs from 'fs';

async function sync608() {
  const session = fs.readFileSync('prisma/telegram_user.session', 'utf8').trim();
  const client = new TelegramClient(new StringSession(session), 34081063, '018dc673429227e26a1b8d9d65eb76ca', {});
  await client.connect();

  const msgs = await client.getMessages(-1003574689156, { ids: [529, 530, 531, 532, 533] });
  const dress = await prisma.dress.findUnique({ where: { id: 608 }, include: { variants: true } });
  if (!dress) return;

  const colors = Array.from(new Set(dress.variants.map(v => v.color)));

  for (let i = 0; i < msgs.length; i++) {
    const m = msgs[i];
    if (!m.media) continue;

    const buf = await client.downloadMedia(m.media, {});
    const uint8 = new Uint8Array(buf as any);
    const blob = new Blob([uint8], { type: 'video/mp4' });

    const fd = new FormData();
    fd.append('reqtype', 'fileupload');
    fd.append('fileToUpload', blob, `dress_608_${m.id}.mp4`);

    const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: fd });
    const url = (await res.text()).trim();

    if (url.startsWith('https://files.catbox.moe/')) {
      const targetColor = colors[i % colors.length];
      const targetVariants = dress.variants.filter(v => v.color === targetColor);
      for (const v of targetVariants) {
        await prisma.dressImage.create({ data: { variantId: v.id, url } });
      }
      console.log('✅ Synced Dress 608 video:', targetColor, url);
    }
  }

  await client.disconnect();
}

sync608().catch(console.error);
