import { NextRequest, NextResponse } from 'next/server';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import prisma from '@/lib/prisma';
import { parseChannelPost } from '@/lib/telegram';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const apiId = 34081063;
const apiHash = '018dc673429227e26a1b8d9d65eb76ca';

async function performTelegramSync() {
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

  let updatedCount = 0;
  const changesSummary: string[] = [];

  for (const tm of textMessages) {
    const parsed = parseChannelPost(tm.text);
    if (!parsed) continue;

    const validColors = Array.from(new Set(parsed.variants.map(v => v.color.trim())));

    // Find dress strictly by unique telegramMsgId
    const dress = await prisma.dress.findFirst({
      where: { telegramMsgId: tm.id }
    });

    if (dress) {
      // 1. Update basic metadata
      await prisma.dress.update({
        where: { id: dress.id },
        data: {
          name: parsed.name,
          description: tm.text,
          price: parsed.price,
        }
      });

      // 2. PURGE all variants that do NOT belong to this post's valid colors
      await prisma.dressVariant.deleteMany({
        where: {
          dressId: dress.id,
          color: { notIn: validColors }
        }
      });

      // 3. Fetch fresh variants after purge
      const freshVariants = await prisma.dressVariant.findMany({
        where: { dressId: dress.id }
      });

      // 4. Upsert/update valid sizes & quantities
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
        }
      }

      // 5. Zero out any sizes not in current post
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
          }
        }
      }

      updatedCount++;
      changesSummary.push(`تمت مزامنة: "${parsed.name}" (${validColors.length} ألوان)`);
    }
  }

  await client.disconnect();

  return {
    success: true,
    totalScannedDresses: textMessages.length,
    updatedCount,
    changesSummary,
    timestamp: new Date().toISOString()
  };
}

export async function GET(req: NextRequest) {
  try {
    const result = await performTelegramSync();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const result = await performTelegramSync();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
