import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import prisma from '@/lib/prisma';
import { parseChannelPost } from '@/lib/telegram';
import fs from 'fs';
import path from 'path';

// ─── Telegram MTProto credentials من Environment Variables فقط ───────────
const apiId   = Number(process.env.TELEGRAM_API_ID   || '0');
const apiHash = process.env.TELEGRAM_API_HASH         || '';

const syncBotToken =
  process.env.TELEGRAM_SYNC_BOT_TOKEN ||
  '8584452230:AAGRdOL8RDhZZQQPzd55VzLJwYIVnHxMiUY';

const syncChatId =
  process.env.TELEGRAM_SYNC_CHAT_ID ||
  '1965859902';

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function sendTelegramMessage(token: string, chatId: string, text: string) {
  if (!token || !chatId) return;

  const MAX_CHUNK = 3800;
  if (text.length <= MAX_CHUNK) {
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
      });
    } catch (err) {
      console.error('⚠️ Error sending Telegram message:', err);
    }
    return;
  }

  const paragraphs = text.split('\n\n');
  let currentChunk = '';

  for (const para of paragraphs) {
    if ((currentChunk + '\n\n' + para).length > MAX_CHUNK) {
      if (currentChunk) {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: currentChunk, parse_mode: 'HTML' }),
        });
      }
      currentChunk = para;
    } else {
      currentChunk = currentChunk ? `${currentChunk}\n\n${para}` : para;
    }
  }

  if (currentChunk) {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: currentChunk, parse_mode: 'HTML' }),
    });
  }
}

interface DressDiff {
  name: string;
  nickname?: string | null;
  changes: string[];
}

interface NewDressDetail {
  name: string;
  price: number;
  colorsMap: Record<string, string[]>;
}

function shouldRunSync(): { shouldRun: boolean; reason: string } {
  if (process.env.FORCE_SYNC === 'true') {
    return { shouldRun: true, reason: 'تشغيل إجباري (Force Sync)' };
  }

  const now = new Date();
  const jorHour = Number(
    now.toLocaleString('en-US', { timeZone: 'Asia/Amman', hour: 'numeric', hour12: false })
  );
  const jorMin = Number(
    now.toLocaleString('en-US', { timeZone: 'Asia/Amman', minute: 'numeric' })
  );

  // 1. فحص فترة الهدوء الليلي (1:00 ص إلى 10:00 ص بتوقيت الأردن)
  if (jorHour >= 1 && jorHour < 10) {
    return {
      shouldRun: false,
      reason: `🌙 فترة الهدوء الليلي (${jorHour}:${jorMin < 10 ? '0' + jorMin : jorMin} بتوقيت الأردن) — المزامنة متوقفة حتى 10:00 ص.`
    };
  }

  // 2. فحص فترة الذروة (3:00 م إلى 6:00 م بتوقيت الأردن: الساعات 15, 16, 17, 18)
  const isPeakHours = (jorHour >= 15 && jorHour < 18) || (jorHour === 18 && jorMin <= 5);
  if (isPeakHours) {
    // في وقت الذروة: تشغيل كل 15 دقيقة
    return {
      shouldRun: true,
      reason: `🔥 فترة الذروة (${jorHour}:${jorMin < 10 ? '0' + jorMin : jorMin} بتوقيت الأردن) — مزامنة سريعة كل 15 دقيقة.`
    };
  }

  // 3. الفترة العادية (10:00 ص إلى 3:00 م، و 6:00 م إلى 1:00 ص)
  // تشغيل كل 30 دقيقة (عند الدقائق القريبة من 00 أو 30)
  const isHalfHourMark = (jorMin >= 0 && jorMin <= 8) || (jorMin >= 25 && jorMin <= 38) || (jorMin >= 55);
  if (isHalfHourMark) {
    return {
      shouldRun: true,
      reason: `🟢 الفترة العادية (${jorHour}:${jorMin < 10 ? '0' + jorMin : jorMin} بتوقيت الأردن) — مزامنة دورية كل 30 دقيقة.`
    };
  } else {
    return {
      shouldRun: false,
      reason: `⏳ الفترة العادية (${jorHour}:${jorMin < 10 ? '0' + jorMin : jorMin} بتوقيت الأردن) — تخطي هذه الدورة لأن المزامنة العادية كل 30 دقيقة.`
    };
  }
}

export async function performTelegramSync(force: boolean = false) {
  if (!force) {
    const check = shouldRunSync();
    if (!check.shouldRun) {
      return {
        success: true,
        skipped: true,
        reason: check.reason
      };
    }
  }

  let stringSession = process.env.TELEGRAM_USER_SESSION || '';
  if (!stringSession) {
    const sessionFile = path.join(process.cwd(), 'prisma', 'telegram_user.session');
    if (fs.existsSync(sessionFile)) {
      stringSession = fs.readFileSync(sessionFile, 'utf8').trim();
    }
  }

  if (!stringSession) {
    return { success: false, error: 'جلسة التيليجرام غير مهيأة' };
  }

  const client = new TelegramClient(new StringSession(stringSession), apiId, apiHash, {
    connectionRetries: 3,
  });

  await client.connect();

  const dialogs = await client.getDialogs({});
  const targetChannel = dialogs.find(d =>
    d.title?.includes('جرد مندوبات') ||
    d.title?.includes('Corner') ||
    d.title?.includes('جرد')
  );

  if (!targetChannel) {
    await client.disconnect();
    return { success: false, error: 'قناة التيليجرام غير موجودة' };
  }

  const messages = await client.getMessages(targetChannel.entity, { limit: 500 });
  const textMessages: Array<{ id: number; text: string; date: number }> = [];

  for (const m of messages) {
    const text = (m.message || '').trim();
    if (text && text.length > 10) {
      textMessages.push({ id: m.id, text, date: m.date });
    }
  }

  // Oldest to newest
  textMessages.sort((a, b) => a.date - b.date);

  const updatedDresses: DressDiff[] = [];
  const newDresses: NewDressDetail[] = [];
  const changesSummary: string[] = [];

  for (const tm of textMessages) {
    const parsed = parseChannelPost(tm.text);
    if (!parsed) continue;

    const validColors = Array.from(new Set(parsed.variants.map(v => v.color.trim())));

    // Find dress strictly by unique telegramMsgId OR unassigned dress by name
    let dress = await prisma.dress.findFirst({
      where: {
        telegramMsgId: tm.id
      }
    });

    if (!dress) {
      dress = await prisma.dress.findFirst({
        where: {
          telegramMsgId: null,
          name: parsed.name
        }
      });
    }

    if (dress) {
      const dressChanges: string[] = [];

      // 1. Bind unique telegramMsgId if missing
      if (!dress.telegramMsgId) {
        await prisma.dress.update({
          where: { id: dress.id },
          data: { telegramMsgId: tm.id }
        });
      }

      // 2. Check price changes
      const newPrice = parsed.price > 0 ? parsed.price : dress.price;
      if (parsed.price > 0 && Math.abs(dress.price - parsed.price) > 0.01) {
        dressChanges.push(`💵 تغيير السعر: من ${dress.price} د.أ إلى ${parsed.price} د.أ`);
      }

      // Update basic metadata
      await prisma.dress.update({
        where: { id: dress.id },
        data: {
          name: parsed.name,
          description: tm.text,
          price: newPrice,
        }
      });

      // 3. PURGE all variants that do NOT belong to this post's valid colors
      const existingVariantsBeforePurge = await prisma.dressVariant.findMany({ where: { dressId: dress.id } });
      const removedColors = Array.from(
        new Set(
          existingVariantsBeforePurge
            .filter(v => !validColors.includes(v.color.trim()))
            .map(v => v.color.trim())
        )
      );

      if (removedColors.length > 0) {
        await prisma.dressVariant.deleteMany({
          where: {
            dressId: dress.id,
            color: { notIn: validColors }
          }
        });
        dressChanges.push(`🗑️ إزالة ألوان غير متوفرة: ${removedColors.join('، ')}`);
      }

      // 4. Fetch fresh variants after purge
      const freshVariants = await prisma.dressVariant.findMany({
        where: { dressId: dress.id }
      });

      // 5. Upsert/update valid sizes & quantities
      for (const pv of parsed.variants) {
        const existing = freshVariants.find(
          ev => ev.color.trim() === pv.color.trim() && ev.size.trim() === pv.size.trim()
        );

        if (existing) {
          if (existing.quantity !== pv.quantity) {
            await prisma.dressVariant.update({
              where: { id: existing.id },
              data: { quantity: pv.quantity }
            });
            if (existing.quantity > 0 && pv.quantity === 0) {
              dressChanges.push(`❌ نفد: لون ${pv.color.trim()} (مقاس ${pv.size.trim()})`);
            } else if (existing.quantity === 0 && pv.quantity > 0) {
              dressChanges.push(`✅ توفر: لون ${pv.color.trim()} (مقاس ${pv.size.trim()})`);
            } else {
              dressChanges.push(`🔄 تعديل كمية: لون ${pv.color.trim()} (مقاس ${pv.size.trim()}) [${existing.quantity} ➔ ${pv.quantity}]`);
            }
          }
        } else {
          await prisma.dressVariant.create({
            data: {
              dressId: dress.id,
              color: pv.color.trim(),
              colorHex: pv.colorHex,
              size: pv.size.trim(),
              quantity: pv.quantity
            }
          });
          if (pv.quantity > 0) {
            dressChanges.push(`➕ إضافة مقاس جديد: لون ${pv.color.trim()} (مقاس ${pv.size.trim()})`);
          }
        }
      }

      // 6. Zero out any sizes not in current post
      for (const fv of freshVariants) {
        if (validColors.includes(fv.color.trim())) {
          const isStillInPost = parsed.variants.some(
            pv => pv.color.trim() === fv.color.trim() && pv.size.trim() === fv.size.trim() && pv.quantity > 0
          );
          if (!isStillInPost && fv.quantity > 0) {
            await prisma.dressVariant.update({
              where: { id: fv.id },
              data: { quantity: 0 }
            });
            dressChanges.push(`❌ نفد: لون ${fv.color.trim()} (مقاس ${fv.size.trim()})`);
          }
        }
      }

      if (dressChanges.length > 0) {
        updatedDresses.push({
          name: dress.name,
          nickname: dress.nickname,
          changes: dressChanges,
        });
        changesSummary.push(`تم تحديث: "${parsed.name}" (${dressChanges.length} تعديل)`);
      }
    } else {
      // 7. CREATE BRAND NEW DRESS!
      const initialPrice = parsed.price > 0 ? parsed.price : 30;
      await prisma.dress.create({
        data: {
          telegramMsgId: tm.id,
          name: parsed.name,
          description: tm.text,
          price: initialPrice,
          isNew: true,
          isFeatured: true,
          sortOrder: 0,
          variants: {
            create: parsed.variants.map(pv => ({
              color: pv.color.trim(),
              colorHex: pv.colorHex,
              size: pv.size.trim(),
              quantity: pv.quantity > 0 ? pv.quantity : 5,
            }))
          }
        }
      });

      const colorsMap: Record<string, string[]> = {};
      parsed.variants.forEach(v => {
        const c = v.color.trim();
        if (!colorsMap[c]) colorsMap[c] = [];
        if (v.quantity > 0 && !colorsMap[c].includes(v.size.trim())) {
          colorsMap[c].push(v.size.trim());
        }
      });

      newDresses.push({
        name: parsed.name,
        price: initialPrice,
        colorsMap,
      });

      changesSummary.push(`✨ فستان جديد تم سحبه وإضافته: "${parsed.name}"`);
    }
  }

  await client.disconnect();

  const jorTime = new Date().toLocaleString('ar-JO', {
    timeZone: 'Asia/Amman',
    hour: '2-digit',
    minute: '2-digit',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  // Format detailed Telegram report
  let message = '';
  const totalChanges = updatedDresses.length + newDresses.length;

  if (totalChanges === 0) {
    message = `🔄 <b>تقرير المزامنة التلقائية — بوتيك ريفا</b> 👑\n\n` +
      `🕐 <b>الوقت:</b> ${jorTime} (بتوقيت الأردن)\n` +
      `📋 <b>المنشورات المفحوصة:</b> ${textMessages.length} منشور\n\n` +
      `✅ <b>الحالة:</b> جميع الفساتين والمقاسات مطابقة تماماً للمخزون ولا يوجد أي تعديلات جديدة في القناة.`;
  } else {
    message = `🔄 <b>تقرير المزامنة التلقائية — بوتيك ريفا</b> 👑\n\n` +
      `🕐 <b>الوقت:</b> ${jorTime} (بتوقيت الأردن)\n` +
      `📊 <b>ملخص التحديثات:</b>\n` +
      `• ✨ فساتين جديدة: <b>${newDresses.length}</b>\n` +
      `• 🔄 فساتين تم تعديل مقاساتها: <b>${updatedDresses.length}</b>\n` +
      `• 📋 إجمالي المنشورات: ${textMessages.length}\n\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `<b>التفاصيل والتغييرات:</b>\n\n`;

    // 1. New dresses
    if (newDresses.length > 0) {
      message += `✨ <b>الفساتين الجديدة المضافة (${newDresses.length}):</b>\n`;
      newDresses.forEach((d, idx) => {
        message += `\n${idx + 1}. <b>${escapeHtml(d.name)}</b>\n   💰 السعر: ${d.price} د.أ\n   🎨 الألوان والسايزات:\n`;
        Object.entries(d.colorsMap).forEach(([color, sizes]) => {
          message += `     ▫️ ${escapeHtml(color)}: (${sizes.join('، ')})\n`;
        });
      });
      message += `\n━━━━━━━━━━━━━━━━━━━\n\n`;
    }

    // 2. Updated dresses
    if (updatedDresses.length > 0) {
      message += `👗 <b>تعديلات السايزات والمخزون (${updatedDresses.length}):</b>\n`;
      updatedDresses.forEach((d, idx) => {
        const label = d.nickname?.trim() ? escapeHtml(d.nickname.trim()) : escapeHtml(d.name);
        message += `\n${idx + 1}. <b>${label}</b>\n`;
        d.changes.forEach(ch => {
          message += `   ${escapeHtml(ch)}\n`;
        });
      });
    }

    message += `\n━━━━━━━━━━━━━━━━━━━\n✅ تم تطبيق كافة التعديلات على المتجر تلقائياً.`;
  }

  await sendTelegramMessage(syncBotToken, syncChatId, message);

  return {
    success: true,
    totalScannedDresses: textMessages.length,
    updatedCount: updatedDresses.length,
    newDressesCount: newDresses.length,
    changesSummary,
    timestamp: new Date().toISOString()
  };
}

