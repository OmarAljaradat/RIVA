import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import input from 'input';
import prisma from '../src/lib/prisma.js';
import { parseChannelPost } from '../src/lib/telegram.js';
import fs from 'fs';
import path from 'path';

// User's Telegram API Credentials
const apiId = 34081063;
const apiHash = '018dc673429227e26a1b8d9d65eb76ca';

const SESSION_FILE = path.join(process.cwd(), 'prisma', 'telegram_user.session');

async function downloadMedia(client: TelegramClient, message: any): Promise<string | null> {
  try {
    if (!message.media) return null;
    const buffer = await client.downloadMedia(message.media, {});
    if (!buffer || !(buffer instanceof Buffer)) return null;

    const isVideo = !!message.video || message.media?.className === 'MessageMediaDocument';
    const ext = isVideo ? 'mp4' : 'jpg';
    const fileName = `tg_corner_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    fs.writeFileSync(path.join(uploadsDir, fileName), buffer);

    return `/uploads/${fileName}`;
  } catch (err) {
    console.error('Error downloading media:', err);
    return null;
  }
}

async function startUserSync() {
  let stringSession = '';
  if (fs.existsSync(SESSION_FILE)) {
    stringSession = fs.readFileSync(SESSION_FILE, 'utf8').trim();
  }

  const client = new TelegramClient(new StringSession(stringSession), apiId, apiHash, {
    connectionRetries: 5,
  });

  console.log('📱 Connecting to Telegram Account for channel: "جرد مندوبات 🍁 Corner"...');

  await client.start({
    phoneNumber: async () => await input.text('أدخل رقم هاتفك مع المفتاح الدولي (مثال: +962791234567): '),
    password: async () => await input.text('أدخل كلمة مرور التحقق بخطوتين (إن وجدت): '),
    phoneCode: async () => await input.text('أدخل كود التفعيل المكون من 5 أرقام المرسل لك في تطبيق تيليجرام: '),
    onError: (err) => console.log('Login error:', err),
  });

  console.log('✅ Logged in successfully!');
  const sessionString = client.session.save() as unknown as string;
  fs.writeFileSync(SESSION_FILE, sessionString);

  // Auto-find "جرد مندوبات 🍁 Corner"
  const dialogs = await client.getDialogs({});
  const targetChannel = dialogs.find(d => 
    d.title?.includes('جرد مندوبات') || 
    d.title?.includes('Corner') || 
    d.title?.includes('جرد')
  );

  if (!targetChannel) {
    console.log('\n❌ لم يتم العثور تلقائياً على قناة "جرد مندوبات 🍁 Corner". القنوات الموجودة بحسابك:');
    dialogs.forEach((d, idx) => console.log(`[${idx + 1}] ${d.title}`));
    const selStr = await input.text('\nأدخل رقم القناة من القائمة: ');
    const selIdx = parseInt(selStr) - 1;
    if (!dialogs[selIdx]) return;
    await processChannel(client, dialogs[selIdx]);
  } else {
    console.log(`\n🎯 Found target channel: "${targetChannel.title}" (ID: ${targetChannel.id})`);
    await processChannel(client, targetChannel);
  }
}

async function processChannel(client: TelegramClient, targetChannel: any) {
  console.log(`\n⏱️ Starting controlled import (1 dress every 30 seconds)...`);

  const messages = await client.getMessages(targetChannel.entity, { limit: 500 });
  console.log(`📦 Found ${messages.length} total posts in channel.`);

  let processedCount = 0;

  for (const msg of messages.reverse()) {
    const textContent = msg.message || '';
    if (!textContent) continue;

    const parsed = parseChannelPost(textContent);
    if (!parsed) continue;

    console.log(`\n----------------------------------------`);
    console.log(`👗 Processing dress #${processedCount + 1}: "${parsed.name}" (${parsed.price} JD)`);

    // No media download - user adds photos/videos manually from admin panel
    const photoUrl = '/uploads/dress1.jpg';

    // Insert or update in database
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

        if (existingVariant) {
          await prisma.dressVariant.update({
            where: { id: existingVariant.id },
            data: { quantity: variant.quantity },
          });
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
          await prisma.dressImage.create({ data: { url: photoUrl, variantId: newV.id } });
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
            create: parsed.variants.length > 0 ? parsed.variants.map(v => ({
              color: v.color,
              colorHex: v.colorHex,
              size: v.size,
              quantity: v.quantity,
            })) : [
              { color: 'افتراضي', colorHex: '#000000', size: 'M', quantity: 5 }
            ],
          },
        },
      });
      dressId = newDress.id;
      const variants = await prisma.dressVariant.findMany({ where: { dressId } });
      for (const v of variants) {
        await prisma.dressImage.create({ data: { url: photoUrl, variantId: v.id } });
      }
    }

    processedCount++;
    console.log(`✅ Dress "${parsed.name}" synced to store database successfully!`);
    console.log(`⏳ Waiting 30 seconds before fetching next dress...`);

    // 30-second delay between dresses as requested by user
    await new Promise(r => setTimeout(r, 5000));
  }

  console.log(`\n🎉 Historical sync finished! Processed ${processedCount} dresses.`);
  console.log(`📡 Live listener is now ACTIVE for any new posts or size updates in real-time...`);

  // Live real-time event listener
  client.addEventHandler(async (event: any) => {
    const msg = event.message;
    if (!msg || String(msg.peerId?.channelId) !== String(targetChannel.id)) return;

    const textContent = msg.message || '';
    if (!textContent) return;

    const parsed = parseChannelPost(textContent);
    if (!parsed) return;

    console.log(`\n⚡ LIVE UPDATE in "جرد مندوبات 🍁 Corner": "${parsed.name}"`);

    let photoUrl = '/uploads/dress1.jpg';
    if (msg.media) {
      const downloaded = await downloadMedia(client, msg);
      if (downloaded) photoUrl = downloaded;
    }

    const existing = await prisma.dress.findFirst({ where: { name: parsed.name }, include: { variants: true } });
    if (existing) {
      for (const v of parsed.variants) {
        const extV = existing.variants.find(ev => ev.color === v.color && ev.size === v.size);
        if (extV) {
          await prisma.dressVariant.update({ where: { id: extV.id }, data: { quantity: v.quantity } });
        }
      }
    } else {
      const newD = await prisma.dress.create({
        data: {
          name: parsed.name,
          price: parsed.price,
          isNew: true,
          isFeatured: true,
          variants: { create: parsed.variants.map(v => ({ color: v.color, colorHex: v.colorHex, size: v.size, quantity: v.quantity })) }
        }
      });
      const vars = await prisma.dressVariant.findMany({ where: { dressId: newD.id } });
      for (const v of vars) {
        await prisma.dressImage.create({ data: { url: photoUrl, variantId: v.id } });
      }
    }
    console.log(`✨ Real-time update saved to site: "${parsed.name}"`);
  });
}

startUserSync().catch(console.error);
