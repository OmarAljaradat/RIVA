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
    return { success: false, error: 'Telegram session not configured' };
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
    return { success: false, error: 'Target Telegram channel not found' };
  }

  const messages = await client.getMessages(targetChannel.entity, { limit: 200 });
  const textMessages: Array<{ id: number; text: string; date: number }> = [];

  for (const m of messages) {
    const text = (m.message || '').trim();
    if (text && text.length > 10) {
      textMessages.push({ id: m.id, text, date: m.date });
    }
  }

  textMessages.sort((a, b) => a.date - b.date);

  const dbDresses = await prisma.dress.findMany({
    include: {
      variants: true
    },
    orderBy: { id: 'asc' }
  });

  let updatedCount = 0;
  const changesSummary: string[] = [];

  // Match each dress with its message
  for (const dbDress of dbDresses) {
    let matchedMsg = textMessages.find(tm => {
      const cleanDb = dbDress.name.replace(/[✨️💫🌷🎗💕🍂⭐🍁👑🌸👗💎]/g, '').trim().toLowerCase();
      const cleanTm = tm.text.replace(/[✨️💫🌷🎗💕🍂⭐🍁👑🌸👗💎]/g, '').trim().toLowerCase();
      return cleanTm.includes(cleanDb.slice(0, 15)) || cleanDb.includes(cleanTm.slice(0, 15));
    });

    if (!matchedMsg) continue;

    const parsed = parseChannelPost(matchedMsg.text);
    if (!parsed) continue;

    let hasChanges = false;

    // Available variants from current telegram post
    for (const pv of parsed.variants) {
      const existing = dbDress.variants.find(
        ev => ev.color.trim() === pv.color.trim() && ev.size.trim() === pv.size.trim()
      );

      if (existing) {
        if (existing.quantity !== pv.quantity) {
          await prisma.dressVariant.update({
            where: { id: existing.id },
            data: { quantity: pv.quantity }
          });
          hasChanges = true;
        }
      } else {
        // New size or variant
        await prisma.dressVariant.create({
          data: {
            dressId: dbDress.id,
            color: pv.color,
            colorHex: pv.colorHex,
            size: pv.size,
            quantity: pv.quantity
          }
        });
        hasChanges = true;
      }
    }

    // Check if any old DB size is no longer listed in telegram -> mark quantity = 0 (sold out)
    for (const ev of dbDress.variants) {
      const isStillAvailable = parsed.variants.some(
        pv => pv.color.trim() === ev.color.trim() && pv.size.trim() === ev.size.trim() && pv.quantity > 0
      );

      if (!isStillAvailable && ev.quantity > 0) {
        await prisma.dressVariant.update({
          where: { id: ev.id },
          data: { quantity: 0 }
        });
        hasChanges = true;
      }
    }

    if (hasChanges) {
      updatedCount++;
      changesSummary.push(`تم تحديث مقاسات ومخزون: "${dbDress.name}"`);
    }
  }

  await client.disconnect();

  return {
    success: true,
    totalScannedDresses: dbDresses.length,
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
