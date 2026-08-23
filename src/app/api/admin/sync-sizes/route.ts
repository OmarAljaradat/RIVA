import { NextRequest, NextResponse } from 'next/server';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import prisma from '@/lib/prisma';
import { parseDressWithAi, parseDressExpert } from '@/lib/ai-parser';
import { parseDressWithGemini } from '@/lib/gemini-parser';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Max execution time for Vercel Hobby

const apiId = 34081063;
const apiHash = '018dc673429227e26a1b8d9d65eb76ca';

// الكلمات العامة التي تسبب تداخل بين الفساتين
const STOP_WORDS = new Set([
  'قماش', 'نخب', 'اول', 'فاخر', 'مميز', 'راقي', 'فستان', 'طقم', 'قطعتين',
  'مع', 'على', 'من', 'في', 'ال', 'و', 'بالكامل', 'مبطن', 'مبطنه'
]);

function extractDistinctiveKeywords(text: string): string[] {
  return text
    .replace(/[✨💫🌷🎗💕🍂⭐🍁👑🌸👗💎]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[،,.\-_/\\|():]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w) && isNaN(Number(w)));
}

function calculateStrictMatchScore(dbName: string, postText: string): number {
  const normPost = postText
    .replace(/[✨💫🌷🎗💕🍂⭐🍁👑🌸👗💎]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .toLowerCase();

  const dbKeywords = extractDistinctiveKeywords(dbName);
  if (dbKeywords.length === 0) return 0;

  // فحص الفوارق الجوهرية
  if (dbName.includes('76') && !normPost.includes('76')) return 0;
  if (dbName.includes('80') && !normPost.includes('80')) return 0;
  if (dbName.includes('شال طويل') && !normPost.includes('شال')) return 0;
  if (dbName.includes('ببل') && !normPost.includes('ببل')) return 0;
  if (dbName.includes('دانتيل فرنسي') && !normPost.includes('فرنسي')) return 0;
  if (dbName.includes('شاحط') && !normPost.includes('شاحط')) return 0;
  if (dbName.includes('لولو') && !normPost.includes('لولو')) return 0;
  if (dbName.includes('بليسيه') && !normPost.includes('بليسيه')) return 0;
  if (dbName.includes('جازارا') && !normPost.includes('جازارا')) return 0;
  if (dbName.includes('يوريا') && !normPost.includes('يوريا')) return 0;

  let matched = 0;
  for (const kw of dbKeywords) {
    if (normPost.includes(kw)) matched++;
  }

  return matched / dbKeywords.length;
}

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
  const claimedMessageIds = new Set<number>(); // حجز المنشورات لمنع أي دمج نهائياً

  for (const dbDress of dbDresses) {
    let dressHasChanges = false;
    let bestMsgId: number | null = null;
    let bestMsgText: string | null = null;
    let highestScore = 0;

    for (const msg of messages) {
      if (claimedMessageIds.has(msg.id)) continue; // لا يمكن استخدام منشور تم حجزه لفستان آخر

      const text = msg.message || '';
      if (!text || text.length < 15) continue;

      const score = calculateStrictMatchScore(dbDress.name, text);
      if (score > highestScore && score >= 0.7) {
        highestScore = score;
        bestMsgId = msg.id;
        bestMsgText = text;
      }
    }

    if (!bestMsgId || !bestMsgText) continue;

    claimedMessageIds.add(bestMsgId); // حجز المنشور حصرياً لهذا الفستان

    // استخدام الذكاء الاصطناعي Gemini AI للتحليل فائق الدقة
    let matchedParsed: any = await parseDressWithGemini(bestMsgText);
    if (!matchedParsed || matchedParsed.variants.length === 0) {
      matchedParsed = parseDressExpert(bestMsgText);
    }
    if (!matchedParsed || matchedParsed.variants.length === 0) continue;

    // Filter valid parsed variants with real sizes
    const validVariants = matchedParsed.variants.filter(
      (pv: any) => pv.size && !pv.size.includes('خالص') && !pv.size.includes('نفذ') && pv.quantity > 0
    );

    // Group parsed valid variants by color
    const parsedColors = Array.from(new Set(matchedParsed.variants.map((v: any) => v.color.trim())));

    for (const color of parsedColors) {
      const colorValidVariants = validVariants.filter((v: any) => v.color.trim() === color);

      if (colorValidVariants.length === 0) {
        // Color has NO available sizes in Telegram -> mark all existing DB sizes for this color as 0
        for (const ev of dbDress.variants) {
          if (ev.color.trim() === color && ev.quantity > 0) {
            await prisma.dressVariant.update({
              where: { id: ev.id },
              data: { quantity: 0 }
            });
            dressHasChanges = true;
          }
        }
      } else {
        // Color has valid available sizes in Telegram!
        const availableSizes = colorValidVariants.map((v: any) => v.size.trim());

        for (const pv of colorValidVariants) {
          const existing = dbDress.variants.find(
            ev => ev.color.trim() === pv.color.trim() && ev.size.trim() === pv.size.trim()
          );

          if (existing) {
            if (existing.quantity <= 0) {
              await prisma.dressVariant.update({
                where: { id: existing.id },
                data: { quantity: 5 }
              });
              dressHasChanges = true;
            }
          } else {
            // Create new variant in DB
            const createdV = await prisma.dressVariant.create({
              data: {
                dressId: dbDress.id,
                color: pv.color.trim(),
                colorHex: pv.colorHex || '#000000',
                size: pv.size.trim(),
                quantity: 5,
              }
            });

            // Copy media from another variant of the same color if available
            const sameColorVar = dbDress.variants.find(ev => ev.color.trim() === pv.color.trim() && ev.images.length > 0);
            if (sameColorVar && sameColorVar.images.length > 0) {
              for (const img of sameColorVar.images) {
                await prisma.dressImage.create({
                  data: {
                    url: img.url,
                    variantId: createdV.id
                  }
                });
              }
            }
            dressHasChanges = true;
          }
        }

        // Any DB size for this color not present in Telegram is out of stock -> 0
        for (const ev of dbDress.variants) {
          if (ev.color.trim() === color && !availableSizes.includes(ev.size.trim()) && ev.quantity > 0) {
            await prisma.dressVariant.update({
              where: { id: ev.id },
              data: { quantity: 0 }
            });
            dressHasChanges = true;
          }
        }
      }
    }

    if (dressHasChanges) {
      updatedDressesCount++;
      changesSummary.push(`تم تحديث مقاسات ومخزون: "${dbDress.name}"`);
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
