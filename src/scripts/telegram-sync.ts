/**
 * Standalone Telegram Sync Script
 * يشتغل مباشرة من GitHub Actions بدون الحاجة لـ Vercel
 */

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { parseChannelPost } from '../lib/telegram';

import fs from 'fs';
import path from 'path';

// Auto-load .env if running standalone/locally
if (!process.env.TELEGRAM_USER_SESSION) {
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = (match[2] || '').trim();
          if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
          if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
          if (!process.env[key]) process.env[key] = value;
        }
      });
    }
  } catch {}
}

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter } as any);

const apiId   = Number(process.env.TELEGRAM_API_ID || '0');
const apiHash = process.env.TELEGRAM_API_HASH || '';
const session = process.env.TELEGRAM_USER_SESSION || '';

const syncBotToken =
  process.env.TELEGRAM_SYNC_BOT_TOKEN ||
  process.env.TELEGRAM_BOT_TOKEN ||
  '8584452230:AAGRdOL8RDhZZQQPzd55VzLJwYIVnHxMiUY';

const syncChatId =
  process.env.TELEGRAM_SYNC_CHAT_ID ||
  process.env.TELEGRAM_ADMIN_CHAT_ID ||
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
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
      });
      const data = await res.json();
      if (!data.ok) {
        console.error('⚠️ Telegram API response error:', data);
      }
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

function isQuietHours(): boolean {
  if (process.env.FORCE_SYNC === 'true') return false;
  const now = new Date();
  const jorHour = Number(
    now.toLocaleString('en-US', { timeZone: 'Asia/Amman', hour: 'numeric', hour12: false })
  );
  // Quiet hours: 1:00 AM to 9:59 AM Jordan Time
  return jorHour >= 1 && jorHour < 10;
}

async function main() {
  if (isQuietHours()) {
    console.log('🌙 فترة الهدوء الليلي (من 1:00 ص إلى 10:00 ص بتوقيت الأردن) — تم إيقاف المزامنة التلقائية.');
    await prisma.$disconnect();
    process.exit(0);
  }

  if (!session || !apiId || !apiHash) {
    console.error('❌ متغيرات البيئة ناقصة: TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_USER_SESSION');
    process.exit(1);
  }

  console.log('🔗 جاري الاتصال بتيليجرام...');
  const client = new TelegramClient(new StringSession(session), apiId, apiHash, {
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
    console.error('❌ القناة غير موجودة');
    await client.disconnect();
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log(`✅ تم العثور على القناة: ${targetChannel.title}`);

  const messages = await client.getMessages(targetChannel.entity, { limit: 500 });
  const textMessages: Array<{ id: number; text: string; date: number }> = [];

  for (const m of messages) {
    const text = (m.message || '').trim();
    if (text && text.length > 10) {
      textMessages.push({ id: m.id, text, date: m.date });
    }
  }

  textMessages.sort((a, b) => a.date - b.date);
  console.log(`📋 تم جلب ${textMessages.length} رسالة من القناة`);

  const updatedDresses: DressDiff[] = [];
  const newDresses: NewDressDetail[] = [];

  for (const tm of textMessages) {
    const parsed = parseChannelPost(tm.text);
    if (!parsed) continue;

    const validColors = Array.from(new Set(parsed.variants.map(v => v.color.trim())));

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
        await prisma.dress.update({ where: { id: dress.id }, data: { telegramMsgId: tm.id } });
      }

      // 2. Check Price change
      const newPrice = parsed.price > 0 ? parsed.price : dress.price;
      if (parsed.price > 0 && Math.abs(dress.price - parsed.price) > 0.01) {
        dressChanges.push(`💵 تغيير السعر: من ${dress.price} د.أ إلى ${parsed.price} د.أ`);
      }

      await prisma.dress.update({
        where: { id: dress.id },
        data: {
          name: parsed.name,
          description: tm.text,
          price: newPrice,
        }
      });

      // 3. Purge invalid colors and track deleted ones
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
          where: { dressId: dress.id, color: { notIn: validColors } }
        });
        dressChanges.push(`🗑️ إزالة ألوان غير متوفرة: ${removedColors.join('، ')}`);
      }

      // 4. Fetch fresh variants
      const freshVariants = await prisma.dressVariant.findMany({ where: { dressId: dress.id } });

      // 5. Check and upsert parsed variants
      for (const pv of parsed.variants) {
        const existing = freshVariants.find(
          ev => ev.color.trim() === pv.color.trim() && ev.size.trim() === pv.size.trim()
        );

        if (existing) {
          if (existing.quantity !== pv.quantity) {
            await prisma.dressVariant.update({ where: { id: existing.id }, data: { quantity: pv.quantity } });
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
            data: { dressId: dress.id, color: pv.color.trim(), colorHex: pv.colorHex, size: pv.size.trim(), quantity: pv.quantity }
          });
          if (pv.quantity > 0) {
            dressChanges.push(`➕ إضافة مقاس جديد: لون ${pv.color.trim()} (مقاس ${pv.size.trim()})`);
          }
        }
      }

      // 6. Check for variants still in valid colors that are missing in the new post
      for (const fv of freshVariants) {
        if (validColors.includes(fv.color.trim())) {
          const stillInPost = parsed.variants.some(
            pv => pv.color.trim() === fv.color.trim() && pv.size.trim() === fv.size.trim() && pv.quantity > 0
          );
          if (!stillInPost && fv.quantity > 0) {
            await prisma.dressVariant.update({ where: { id: fv.id }, data: { quantity: 0 } });
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
      }
    } else {
      // 7. Create new dress
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

      // Group colors and sizes for clean reporting
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
    }
  }

  await client.disconnect();
  await prisma.$disconnect();

  const jorTime = new Date().toLocaleString('ar-JO', {
    timeZone: 'Asia/Amman',
    hour: '2-digit',
    minute: '2-digit',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  console.log(`\n✅ انتهت المزامنة بنجاح:`);
  console.log(`   📦 فساتين تم تعديلها: ${updatedDresses.length}`);
  console.log(`   ✨ فساتين جديدة: ${newDresses.length}`);
  console.log(`   🕐 وقت المزامنة: ${jorTime}`);

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
}

main().catch(async err => {
  console.error('❌ خطأ في المزامنة:', err);
  const jorTime = new Date().toLocaleString('ar-JO', {
    timeZone: 'Asia/Amman',
    hour: '2-digit',
    minute: '2-digit',
  });
  const errorMsg = `❌ <b>فشل في المزامنة التلقائية — بوتيك ريفا</b>\n\n` +
    `🕐 <b>الوقت:</b> ${jorTime}\n` +
    `⚠️ <b>الخطأ:</b> <code>${escapeHtml(err.message || String(err))}</code>`;

  await sendTelegramMessage(syncBotToken, syncChatId, errorMsg);
  process.exit(1);
});
