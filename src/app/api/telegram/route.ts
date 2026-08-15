import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseChannelPost } from '@/lib/telegram';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendTelegramReply(chatId: number, text: string) {
  if (!TELEGRAM_BOT_TOKEN) return;
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

async function downloadTelegramPhoto(fileId: string): Promise<string | null> {
  if (!TELEGRAM_BOT_TOKEN) return null;
  try {
    // 1. Get file path
    const fileRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`);
    const fileData = await fileRes.json();
    if (!fileData.ok || !fileData.result?.file_path) return null;

    const filePath = fileData.result.file_path;
    const downloadUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;

    // 2. Download and save locally
    const photoRes = await fetch(downloadUrl);
    const buffer = await photoRes.arrayBuffer();

    const fileName = `tg_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
    const path = await import('path');
    const fs = await import('fs/promises');

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(path.join(uploadsDir, fileName), Buffer.from(buffer));

    return `/uploads/${fileName}`;
  } catch (err) {
    console.error('Error downloading Telegram photo:', err);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const update = await req.json();

    // Support both direct channel posts AND forwarded messages sent to the bot!
    const message = update.message || update.channel_post;
    if (!message) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat?.id;
    const textContent = message.text || message.caption || '';

    if (!textContent) {
      if (chatId) {
        await sendTelegramReply(
          chatId,
          '⚠️ الرجاء تحويل أو إرسال منشور يحتوي على تفاصيل الفستان (الاسم، السعر، الألوان والمقاسات).'
        );
      }
      return NextResponse.json({ ok: true });
    }

    // Parse post
    const parsed = parseChannelPost(textContent);
    if (!parsed) {
      if (chatId) {
        await sendTelegramReply(
          chatId,
          '⚠️ لم نتمكن من قراءة تفاصيل الفستان تلقائياً.\nتأكد أن النص يحتوي على اسم الفستان والسعر (مثال: 💰 السعر: 65).'
        );
      }
      return NextResponse.json({ ok: true, parsed: false });
    }

    // Handle photo attachment if present
    let photoUrl = '/uploads/dress1.jpg';
    if (message.photo && Array.isArray(message.photo) && message.photo.length > 0) {
      // Pick the largest photo size
      const largestPhoto = message.photo[message.photo.length - 1];
      const downloaded = await downloadTelegramPhoto(largestPhoto.file_id);
      if (downloaded) photoUrl = downloaded;
    }

    // Check if dress exists
    const existingDress = await prisma.dress.findFirst({
      where: { name: parsed.name },
      include: { variants: true },
    });

    let dressId: number;
    let actionType: 'created' | 'updated' = 'created';

    if (existingDress) {
      dressId = existingDress.id;
      actionType = 'updated';

      // Update variants & quantities
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
          const newVariant = await prisma.dressVariant.create({
            data: {
              dressId: existingDress.id,
              color: variant.color,
              colorHex: variant.colorHex,
              size: variant.size,
              quantity: variant.quantity,
            },
          });
          // Attach photo to new variant
          await prisma.dressImage.create({
            data: { url: photoUrl, variantId: newVariant.id },
          });
        }
      }

      if (existingDress.price !== parsed.price) {
        await prisma.dress.update({
          where: { id: existingDress.id },
          data: { price: parsed.price },
        });
      }
    } else {
      // Create new dress
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

      // Attach image to all created variants
      const variants = await prisma.dressVariant.findMany({ where: { dressId } });
      for (const v of variants) {
        await prisma.dressImage.create({
          data: { url: photoUrl, variantId: v.id },
        });
      }
    }

    // Reply back to Telegram Chat!
    if (chatId) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const actionMsg = actionType === 'created' ? 'إضافة' : 'تحديث';
      const replyMsg = 
        `🎉 <b>تم ${actionMsg} الفستان بنجاح في متجر Riva!</b>\n\n` +
        `👗 <b>الاسم:</b> ${parsed.name}\n` +
        `💰 <b>السعر:</b> ${parsed.price} د.أ\n` +
        `🎨 <b>عدد الخيارات:</b> ${parsed.variants.length} خيار\n\n` +
        `🔗 <b>رابط الفستان في الموقع:</b>\n${appUrl}/products/${dressId}`;
      
      await sendTelegramReply(chatId, replyMsg);
    }

    return NextResponse.json({ ok: true, action: actionType, dressId });
  } catch (error: any) {
    console.error('Telegram Webhook error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'active',
    mode: 'Forwarding & Direct Message Support Active',
    message: 'Riva Store Telegram Webhook Engine' 
  });
}
