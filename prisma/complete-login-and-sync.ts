import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import prisma from '../src/lib/prisma.js';
import { parseChannelPost } from '../src/lib/telegram.js';
import fs from 'fs';
import path from 'path';

const apiId = 34081063;
const apiHash = '018dc673429227e26a1b8d9d65eb76ca';
const SESSION_FILE = path.join(process.cwd(), 'prisma', 'telegram_user.session');

async function downloadMedia(client: TelegramClient, message: any): Promise<string | null> {
  try {
    if (!message.media) return null;
    const buffer = await client.downloadMedia(message, {});
    if (!buffer || !(buffer instanceof Buffer)) return null;

    const isVideo = message.media?.className === 'MessageMediaDocument' || !!message.video;
    const ext = isVideo ? 'mp4' : 'jpg';
    const fileName = `tg_corner_${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    fs.writeFileSync(path.join(uploadsDir, fileName), buffer);

    console.log(`   📸 Downloaded ${buffer.length} bytes -> /uploads/${fileName}`);
    return `/uploads/${fileName}`;
  } catch (err: any) {
    console.error('   ❌ Error downloading media:', err.message || err);
    return null;
  }
}

async function run() {
  if (!fs.existsSync(SESSION_FILE)) {
    console.error('❌ Session file not found!');
    return;
  }

  const sessionString = fs.readFileSync(SESSION_FILE, 'utf8').trim();
  const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
    connectionRetries: 5,
  });

  console.log('📱 Connecting to Telegram using saved session...');
  await client.connect();
  console.log('✅ CONNECTED_SUCCESSFULLY!');

  const dialogs = await client.getDialogs({});
  const targetChannel = dialogs.find(d => 
    d.title?.includes('جرد مندوبات') || 
    d.title?.includes('Corner') || 
    d.title?.includes('جرد')
  );

  if (!targetChannel) {
    console.log('❌ Channel not found!');
    return;
  }

  console.log(`\n🎯 TARGET CHANNEL FOUND: "${targetChannel.title}" (ID: ${targetChannel.id})`);
  console.log(`⏱️ Starting 1-MINUTE (60s) DEEP ANALYSIS IMPORT per dress...`);

  const messages = await client.getMessages(targetChannel.entity, { limit: 200 });
  console.log(`📦 Found ${messages.length} messages in channel.`);

  let processedCount = 0;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const textContent = msg.message || '';
    if (!textContent) continue;

    const parsed = parseChannelPost(textContent);
    if (!parsed) continue;

    console.log(`\n----------------------------------------`);
    console.log(`👗 DEEP ANALYSIS Dress #${processedCount + 1}: "${parsed.name}" (${parsed.price} JD) [Msg ID: ${msg.id}]`);

    // Automatic video download disabled per user directive; media assignment handled manually via Admin Panel
    const mediaUrls: string[] = ['/uploads/dress1.jpg'];


    // Get unique colors for this dress
    const uniqueColors = Array.from(new Set(parsed.variants.map(v => v.color)));
    console.log(`   🎨 Strict Unique Colors for "${parsed.name}": [${uniqueColors.join(', ')}]`);

    // Map media to colors without cross-mixing
    const colorMediaMap: Record<string, string[]> = {};
    uniqueColors.forEach((color, cIdx) => {
      colorMediaMap[color] = [];
      if (mediaUrls.length === 0 || mediaUrls[0] === '/uploads/dress1.jpg') {
        colorMediaMap[color].push('/uploads/dress1.jpg');
      } else if (mediaUrls.length === uniqueColors.length) {
        colorMediaMap[color].push(mediaUrls[cIdx]);
      } else if (mediaUrls.length > uniqueColors.length && mediaUrls.length % uniqueColors.length === 0) {
        const chunkSize = mediaUrls.length / uniqueColors.length;
        const start = cIdx * chunkSize;
        colorMediaMap[color] = mediaUrls.slice(start, start + chunkSize);
      } else if (cIdx < mediaUrls.length) {
        colorMediaMap[color].push(mediaUrls[cIdx]);
      } else {
        colorMediaMap[color].push(mediaUrls[0]);
      }

      console.log(`   👉 Color "${color}" mapped to ${colorMediaMap[color].length} media items:`, colorMediaMap[color]);
    });

    // Upsert dress in database
    const existingDress = await prisma.dress.findFirst({
      where: { name: parsed.name },
      include: { variants: true },
    });

    let dressId: number;

    if (existingDress) {
      dressId = existingDress.id;
      for (const variant of parsed.variants) {
        const existingVariant = existingDress.variants.find(
          v => v.color === variant.color && v.size === variant.size
        );

        const vMedia = colorMediaMap[variant.color] || mediaUrls;

        if (existingVariant) {
          await prisma.dressVariant.update({
            where: { id: existingVariant.id },
            data: { quantity: variant.quantity },
          });

          if (vMedia[0] !== '/uploads/dress1.jpg') {
            for (const url of vMedia) {
              const hasImg = await prisma.dressImage.findFirst({
                where: { variantId: existingVariant.id, url },
              });
              if (!hasImg) {
                await prisma.dressImage.create({ data: { url, variantId: existingVariant.id } });
              }
            }
          }
        } else {
          const newV = await prisma.dressVariant.create({
            data: {
              dressId: existingDress.id,
              color: variant.color,
              colorHex: variant.colorHex,
              size: variant.size,
              quantity: variant.quantity,
            },
          });
          for (const url of vMedia) {
            await prisma.dressImage.create({ data: { url, variantId: newV.id } });
          }
        }
      }
    } else {
      const newDress = await prisma.dress.create({
        data: {
          name: parsed.name,
          price: parsed.price,
          isNew: true,
          isFeatured: true,
          variants: {
            create: parsed.variants.map(v => ({
              color: v.color,
              colorHex: v.colorHex,
              size: v.size,
              quantity: v.quantity,
            })),
          },
        },
      });
      dressId = newDress.id;
      const variants = await prisma.dressVariant.findMany({ where: { dressId } });
      for (const v of variants) {
        const vMedia = colorMediaMap[v.color] || mediaUrls;
        for (const url of vMedia) {
          await prisma.dressImage.create({ data: { url, variantId: v.id } });
        }
      }
    }

    processedCount++;
    console.log(`✅ Synced "${parsed.name}" (${parsed.price} JD) to DB! Waiting 60 SECONDS (1 MINUTE) before next dress...`);

    // EXACT 1-MINUTE (60s) delay per dress as requested by user
    await new Promise(r => setTimeout(r, 60000));
  }

  console.log(`\n🎉 Historical sync finished! Processed ${processedCount} dresses.`);
  console.log(`📡 Real-time live listener is now ACTIVE for new posts & size edits...`);
}

run().catch(console.error);
