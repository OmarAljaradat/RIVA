/**
 * Standalone Telegram Sync Script
 * يشتغل مباشرة من GitHub Actions بدون الحاجة لـ Vercel
 */

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { PrismaClient } from '../generated/prisma';
import { parseChannelPost } from '../lib/telegram';

const prisma = new PrismaClient();

const apiId   = Number(process.env.TELEGRAM_API_ID || '0');
const apiHash = process.env.TELEGRAM_API_HASH || '';
const session = process.env.TELEGRAM_USER_SESSION || '';

async function main() {
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

  let updatedCount = 0;
  let newDressesCount = 0;

  for (const tm of textMessages) {
    const parsed = parseChannelPost(tm.text);
    if (!parsed) continue;

    const validColors = Array.from(new Set(parsed.variants.map(v => v.color.trim())));

    let dress = await prisma.dress.findFirst({
      where: {
        OR: [
          { telegramMsgId: tm.id },
          { name: parsed.name }
        ]
      }
    });

    if (dress) {
      if (!dress.telegramMsgId) {
        await prisma.dress.update({ where: { id: dress.id }, data: { telegramMsgId: tm.id } });
      }

      await prisma.dress.update({
        where: { id: dress.id },
        data: {
          name: parsed.name,
          description: tm.text,
          price: parsed.price > 0 ? parsed.price : dress.price,
        }
      });

      await prisma.dressVariant.deleteMany({
        where: { dressId: dress.id, color: { notIn: validColors } }
      });

      const freshVariants = await prisma.dressVariant.findMany({ where: { dressId: dress.id } });

      for (const pv of parsed.variants) {
        const existing = freshVariants.find(
          ev => ev.color.trim() === pv.color.trim() && ev.size.trim() === pv.size.trim()
        );
        if (existing) {
          if (existing.quantity !== pv.quantity) {
            await prisma.dressVariant.update({ where: { id: existing.id }, data: { quantity: pv.quantity } });
          }
        } else {
          await prisma.dressVariant.create({
            data: { dressId: dress.id, color: pv.color.trim(), colorHex: pv.colorHex, size: pv.size.trim(), quantity: pv.quantity }
          });
        }
      }

      for (const fv of freshVariants) {
        if (validColors.includes(fv.color.trim())) {
          const stillInPost = parsed.variants.some(
            pv => pv.color.trim() === fv.color.trim() && pv.size.trim() === fv.size.trim() && pv.quantity > 0
          );
          if (!stillInPost && fv.quantity > 0) {
            await prisma.dressVariant.update({ where: { id: fv.id }, data: { quantity: 0 } });
          }
        }
      }

      updatedCount++;
    } else {
      await prisma.dress.create({
        data: {
          telegramMsgId: tm.id,
          name: parsed.name,
          description: tm.text,
          price: parsed.price > 0 ? parsed.price : 30,
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
      newDressesCount++;
    }
  }

  await client.disconnect();
  await prisma.$disconnect();

  console.log(`\n✅ انتهت المزامنة بنجاح:`);
  console.log(`   📦 فساتين محدّثة: ${updatedCount}`);
  console.log(`   ✨ فساتين جديدة: ${newDressesCount}`);
  console.log(`   🕐 وقت المزامنة: ${new Date().toISOString()}`);
}

main().catch(err => {
  console.error('❌ خطأ في المزامنة:', err);
  process.exit(1);
});
