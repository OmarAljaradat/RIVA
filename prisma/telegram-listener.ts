import prisma from '../src/lib/prisma.js';
import { parseChannelPost } from '../src/lib/telegram.js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN غير موجود في متغيرات البيئة. أوقف السكريبت.');
  process.exit(1);
}
let lastOffset = 0;

// Cache to hold photos/videos sent by the user right before or after sending text
const userMediaCache: Record<number, string[]> = {};

async function sendTelegramReply(chatId: number, text: string) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
      }),
    });
  } catch (err) {
    console.error('Error sending Telegram reply:', err);
  }
}

async function downloadTelegramMedia(fileId: string, isVideo = false): Promise<string | null> {
  try {
    const fileRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`);
    const fileData = await fileRes.json();
    if (!fileData.ok || !fileData.result?.file_path) return null;

    const filePath = fileData.result.file_path;
    const downloadUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;

    const mediaRes = await fetch(downloadUrl);
    const buffer = await mediaRes.arrayBuffer();

    const ext = isVideo ? 'mp4' : 'jpg';
    const fileName = `tg_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
    const path = await import('path');
    const fs = await import('fs/promises');

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(path.join(uploadsDir, fileName), Buffer.from(buffer));

    return `/uploads/${fileName}`;
  } catch (err) {
    console.error('Error downloading media:', err);
    return null;
  }
}

async function processMessage(message: any) {
  if (!message) return;
  const chatId = message.chat?.id;
  if (!chatId) return;

  if (!userMediaCache[chatId]) {
    userMediaCache[chatId] = [];
  }

  // 1. Check if this message contains a Photo or Video
  if (message.photo && Array.isArray(message.photo) && message.photo.length > 0) {
    const largestPhoto = message.photo[message.photo.length - 1];
    const photoUrl = await downloadTelegramMedia(largestPhoto.file_id, false);
    if (photoUrl) {
      userMediaCache[chatId].push(photoUrl);
      console.log(`📸 Downloaded & Cached photo for user ${chatId}: ${photoUrl}`);
    }
  }

  if (message.video) {
    const videoUrl = await downloadTelegramMedia(message.video.file_id, true);
    if (videoUrl) {
      userMediaCache[chatId].push(videoUrl);
      console.log(`🎥 Downloaded & Cached video for user ${chatId}: ${videoUrl}`);
    }
  }

  const textContent = message.text || message.caption || '';

  // If message is purely media without text details yet, acknowledge and wait for text
  if (!textContent) {
    console.log(`ℹ️ Received media without text from ${chatId}, cached for dress creation.`);
    return;
  }

  // 2. Parse text for dress details
  const parsed = parseChannelPost(textContent);
  if (!parsed) {
    if (chatId) {
      await sendTelegramReply(
        chatId,
        '⚠️ تم استلام الصورة/الميديا ولكن لم نتمكن من قراءة تفاصيل الفستان من النص.\n' +
        'تأكد أن النص يحتوي على اسم الفستان والسعر (مثال: 💰 السعر: 25 jd).'
      );
    }
    return;
  }

  // Collect all media from cache or fallback
  let mediaUrls: string[] = [...userMediaCache[chatId]];
  // Reset cache after taking media
  userMediaCache[chatId] = [];

  if (mediaUrls.length === 0) {
    mediaUrls = ['/uploads/dress1.jpg'];
  }

  const existingDress = await prisma.dress.findFirst({
    where: { name: parsed.name },
    include: { variants: true },
  });

  let dressId: number;
  let actionType: 'created' | 'updated' = 'created';

  if (existingDress) {
    dressId = existingDress.id;
    actionType = 'updated';

    for (const variant of parsed.variants) {
      const existingVariant = existingDress.variants.find(
        v => v.color === variant.color && v.size === variant.size
      );

      if (existingVariant) {
        await prisma.dressVariant.update({
          where: { id: existingVariant.id },
          data: { quantity: variant.quantity },
        });

        // Replace or add photos if new media arrived
        if (mediaUrls[0] !== '/uploads/dress1.jpg') {
          for (const url of mediaUrls) {
            await prisma.dressImage.create({
              data: { url, variantId: existingVariant.id },
            });
          }
        }
      } else {
        const newVariant = await prisma.dressVariant.create({
          data: {
            dressId: existingDress.id,
            color: variant.color,
            colorHex: variant.colorHex,
            size: variant.size,
            quantity: variant.quantity,
          },
        });
        for (const url of mediaUrls) {
          await prisma.dressImage.create({
            data: { url, variantId: newVariant.id },
          });
        }
      }
    }

    if (existingDress.price !== parsed.price) {
      await prisma.dress.update({
        where: { id: existingDress.id },
        data: { price: parsed.price },
      });
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
      for (const url of mediaUrls) {
        await prisma.dressImage.create({
          data: { url, variantId: v.id },
        });
      }
    }
  }

  if (chatId) {
    const actionMsg = actionType === 'created' ? 'إضافة' : 'تحديث';
    const mediaMsg = mediaUrls[0] !== '/uploads/dress1.jpg' ? '📸 مع الصور والفيديو' : '';
    const replyMsg = 
      `🎉 <b>تم ${actionMsg} الفستان ${mediaMsg} بنجاح في متجر Riva!</b>\n\n` +
      `👗 <b>الاسم:</b> ${parsed.name}\n` +
      `💰 <b>السعر:</b> ${parsed.price} د.أ\n` +
      `🎨 <b>عدد الخيارات:</b> ${parsed.variants.length} خيار\n\n` +
      `🔗 <b>شاهد الفستان في الموقع:</b>\nhttp://localhost:3000/products/${dressId}`;

    await sendTelegramReply(chatId, replyMsg);
  }
}

async function poll() {
  console.log('🤖 Riva Smart Media Listener (Photo & Video Caching) Started...');
  
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook`);
  } catch {}

  while (true) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${lastOffset}&timeout=10`);
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          lastOffset = update.update_id + 1;
          const msg = update.message || update.channel_post;
          if (msg) {
            await processMessage(msg);
          }
        }
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
    await new Promise(r => setTimeout(r, 2000));
  }
}

poll();
