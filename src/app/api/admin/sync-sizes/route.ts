import { NextRequest, NextResponse } from 'next/server';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import prisma from '@/lib/prisma';
import { parseDressWithAi } from '@/lib/ai-parser';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Max execution time for Vercel Hobby

const apiId = 34081063;
const apiHash = '018dc673429227e26a1b8d9d65eb76ca';

async function performTelegramSync() {
  // Get string session from environment variable or file
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
  const dbDresses = await prisma.dress.findMany({
    include: {
      variants: {
        include: { images: true }
      }
    },
    orderBy: { id: 'asc' }
  });

  let updatedDressesCount = 0;
  const changesSummary: string[] = [];

  for (const dbDress of dbDresses) {
    const dbCleanName = dbDress.name.toLowerCase().replace(/✨️|💫|🌷|🎗|💕|🍂/g, '').trim();

    // Match message from channel
    let matchedParsed = null;
    for (const msg of messages) {
      const text = msg.message || '';
      if (!text || text.length < 10) continue;

      const cleanText = text.toLowerCase().replace(/✨️|💫|🌷|🎗|💕|🍂/g, '');
      if (cleanText.includes(dbCleanName.slice(0, 12)) || dbCleanName.includes(cleanText.slice(0, 12))) {
        matchedParsed = await parseDressWithAi(text);
        if (matchedParsed && matchedParsed.variants.length > 0) break;
      }
    }

    if (!matchedParsed) continue;

    let dressHasChanges = false;

    // Update quantities for each variant
    for (const pv of matchedParsed.variants) {
      const existing = dbDress.variants.find(
        ev => ev.color.trim() === pv.color.trim() && ev.size.trim() === pv.size.trim()
      );

      if (existing) {
        if (existing.quantity !== pv.quantity) {
          await prisma.dressVariant.update({
            where: { id: existing.id },
            data: { quantity: pv.quantity }
          });
          dressHasChanges = true;
        }
      } else {
        // Create new variant if not in DB
        const createdV = await prisma.dressVariant.create({
          data: {
            dressId: dbDress.id,
            color: pv.color,
            colorHex: pv.colorHex || '#000000',
            size: pv.size,
            quantity: pv.quantity,
          }
        });

        // Link existing color image if available
        const sameColor = dbDress.variants.find(ev => ev.color === pv.color && ev.images.length > 0);
        if (sameColor && sameColor.images[0]) {
          await prisma.dressImage.create({
            data: {
              url: sameColor.images[0].url,
              variantId: createdV.id
            }
          });
        }
        dressHasChanges = true;
      }
    }

    // Mark colors as sold out if channel post specifies "خالص"
    const soldOutColors = matchedParsed.variants
      .filter(v => v.quantity === 0 || v.size.includes('خالص'))
      .map(v => v.color);

    for (const sc of soldOutColors) {
      for (const v of dbDress.variants) {
        if (v.color === sc && v.quantity > 0) {
          await prisma.dressVariant.update({
            where: { id: v.id },
            data: { quantity: 0 }
          });
          dressHasChanges = true;
        }
      }
    }

    if (dressHasChanges) {
      updatedDressesCount++;
      changesSummary.push(`تم تحديث مقاسات ومخزون: "${dbDress.nickname || dbDress.name}"`);
    }
  }

  await client.disconnect();

  return {
    success: true,
    totalScannedDresses: dbDresses.length,
    updatedDressesCount,
    changesSummary,
    timestamp: new Date().toISOString()
  };
}

// GET: For Vercel Cron Jobs & Health Checks
export async function GET(req: NextRequest) {
  try {
    const result = await performTelegramSync();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in sync-sizes GET:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: For Admin Dashboard Manual Click
export async function POST(req: NextRequest) {
  try {
    const result = await performTelegramSync();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in sync-sizes POST:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
