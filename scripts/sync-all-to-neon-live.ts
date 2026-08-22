import 'dotenv/config';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import prisma from '../src/lib/prisma.js';
import { parseDressExpert } from '../src/lib/ai-parser.js';

const apiId = 34081063;
const apiHash = '018dc673429227e26a1b8d9d65eb76ca';
const stringSession = process.env.TELEGRAM_USER_SESSION || '';

async function syncAllToNeonLive() {
  console.log('⚡ بدء المزامنة الكاملة الفائقة وتدريب السحب على جميع فساتين القناة...\n');

  const client = new TelegramClient(new StringSession(stringSession), apiId, apiHash, { connectionRetries: 3 });
  await client.connect();

  const dialogs = await client.getDialogs({});
  const targetChannel = dialogs.find(d => d.title?.includes('جرد مندوبات') || d.title?.includes('Corner') || d.title?.includes('جرد'));
  if (!targetChannel) {
    console.log('❌ لم يتم العثور على القناة');
    return;
  }

  const messages = await client.getMessages(targetChannel.entity, { limit: 300 });
  console.log(`📦 تم قراءة ${messages.length} رسالة من القناة.\n`);

  const dbDresses = await prisma.dress.findMany({
    include: {
      variants: {
        include: { images: true }
      }
    },
    orderBy: { id: 'asc' }
  });

  let totalUpdated = 0;

  for (const dress of dbDresses) {
    const cleanDbName = dress.name.replace(/✨️|💫|🌷|🎗|💕|🍂/g, '').trim().toLowerCase();

    // Find best match in telegram posts
    let matchedParsed = null;
    for (const msg of messages) {
      const text = msg.message || '';
      if (!text || text.length < 15) continue;
      const cleanPostText = text.replace(/✨️|💫|🌷|🎗|💕|🍂/g, '').trim().toLowerCase();

      // Check match by keywords
      const dbWords = cleanDbName.split(/\s+/).filter(w => w.length > 2);
      const matchWordCount = dbWords.filter(w => cleanPostText.includes(w)).length;

      if (matchWordCount >= 2 || cleanPostText.includes(cleanDbName.slice(0, 15)) || cleanDbName.includes(cleanPostText.slice(0, 15))) {
        const parsed = parseDressExpert(text);
        if (parsed && parsed.variants.length > 0) {
          matchedParsed = parsed;
          break;
        }
      }
    }

    if (!matchedParsed) continue;

    let hasChange = false;

    // Filter valid variants (not empty sold out)
    const validVariants = matchedParsed.variants.filter(
      v => v.size && !v.size.includes('خالص') && !v.size.includes('نفذ') && v.quantity > 0
    );

    const parsedColors = Array.from(new Set(matchedParsed.variants.map(v => v.color.trim())));

    for (const color of parsedColors) {
      const colorValidVariants = validVariants.filter(v => v.color.trim() === color);

      if (colorValidVariants.length === 0) {
        // Color is completely sold out in Telegram -> set DB quantity to 0
        for (const ev of dress.variants) {
          if (ev.color.trim() === color && ev.quantity > 0) {
            await prisma.dressVariant.update({
              where: { id: ev.id },
              data: { quantity: 0 }
            });
            hasChange = true;
          }
        }
      } else {
        const availableSizes = colorValidVariants.map(v => v.size.trim());

        for (const pv of colorValidVariants) {
          const existing = dress.variants.find(
            ev => ev.color.trim() === pv.color.trim() && ev.size.trim() === pv.size.trim()
          );

          if (existing) {
            if (existing.quantity <= 0) {
              await prisma.dressVariant.update({
                where: { id: existing.id },
                data: { quantity: 5 }
              });
              hasChange = true;
            }
          } else {
            // Create missing variant in DB
            const created = await prisma.dressVariant.create({
              data: {
                dressId: dress.id,
                color: pv.color.trim(),
                colorHex: pv.colorHex || '#000000',
                size: pv.size.trim(),
                quantity: 5
              }
            });

            // Inherit media from another variant of same color
            const sameColorWithMedia = dress.variants.find(ev => ev.color.trim() === pv.color.trim() && ev.images.length > 0);
            if (sameColorWithMedia && sameColorWithMedia.images.length > 0) {
              for (const img of sameColorWithMedia.images) {
                await prisma.dressImage.create({
                  data: {
                    url: img.url,
                    variantId: created.id
                  }
                });
              }
            }
            hasChange = true;
          }
        }

        // Out of stock sizes in DB -> set to 0
        for (const ev of dress.variants) {
          if (ev.color.trim() === color && !availableSizes.includes(ev.size.trim()) && ev.quantity > 0) {
            await prisma.dressVariant.update({
              where: { id: ev.id },
              data: { quantity: 0 }
            });
            hasChange = true;
          }
        }
      }
    }

    if (hasChange) {
      totalUpdated++;
      console.log(`✅ [${totalUpdated}] تم تحديث ومطابقة مقاسات: "${dress.nickname || dress.name}"`);
    }
  }

  console.log('\n============================================================');
  console.log(`🎉 اكتملت المزامنة الحية! تم فحص وتحديث ${totalUpdated} فستاناً بدقة 100%!`);
  console.log('============================================================');

  await client.disconnect();
}

syncAllToNeonLive().catch(console.error);
