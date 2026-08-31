import { NextRequest, NextResponse } from 'next/server';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const apiId = 34081063;
const apiHash = '018dc673429227e26a1b8d9d65eb76ca';
const BOT_TOKEN = '8647968101:AAFVO3ukMsC32RvbIA18OLAwl83wACWV_-4';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const numericId = Number(resolvedParams.id);
    if (isNaN(numericId)) return NextResponse.json({ error: 'ID غير صحيح' }, { status: 400 });

    const dress = await prisma.dress.findUnique({
      where: { id: numericId },
      include: { variants: { include: { images: true } } }
    });

    if (!dress || !dress.telegramMsgId) {
      return NextResponse.json({ error: 'الفستان غير مربوط بمنشور تيليجرام' }, { status: 404 });
    }

    let stringSession = process.env.TELEGRAM_USER_SESSION || '';
    if (!stringSession) {
      const sessionFile = path.join(process.cwd(), 'prisma', 'telegram_user.session');
      if (fs.existsSync(sessionFile)) {
        stringSession = fs.readFileSync(sessionFile, 'utf8').trim();
      }
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
      return NextResponse.json({ error: 'قناة التيليجرام غير موجودة' }, { status: 404 });
    }

    // Get messages around this dress post
    const messages = await client.getMessages(targetChannel.entity, { limit: 100 });
    const textMsg = messages.find(m => m.id === dress.telegramMsgId);

    if (!textMsg) {
      await client.disconnect();
      return NextResponse.json({ error: 'منشور التيليجرام غير موجود' }, { status: 404 });
    }

    // Find related media messages (same groupedId or directly preceding)
    let relatedMediaMsgs: any[] = [];
    if (textMsg.groupedId) {
      relatedMediaMsgs = messages.filter(m => m.groupedId && m.groupedId.toString() === textMsg.groupedId?.toString() && m.media);
    } else {
      relatedMediaMsgs = messages.filter(m => m.id < textMsg.id && m.id >= textMsg.id - 8 && m.media);
    }

    // Sort media messages chronologically
    relatedMediaMsgs.sort((a, b) => a.id - b.id);

    const mediaUrls: string[] = [];

    // For each media message, upload to Catbox or generate streaming URL
    for (const rm of relatedMediaMsgs) {
      try {
        const buffer = await client.downloadMedia(rm.media, {} as any);
        if (buffer && (buffer as any).length > 0) {
          const isVideo = rm.media?.className === 'MessageMediaDocument' && rm.media?.document?.mimeType?.includes('video');
          const ext = isVideo ? 'mp4' : 'jpg';
          const mime = isVideo ? 'video/mp4' : 'image/jpeg';
          const uint8 = new Uint8Array(buffer as any);
          const blob = new Blob([uint8], { type: mime });

          const uploadFormData = new FormData();
          uploadFormData.append('reqtype', 'fileupload');
          uploadFormData.append('fileToUpload', blob, `dress_${dress.id}_${rm.id}.${ext}`);

          const cdnRes = await fetch('https://catbox.moe/user/api.php', {
            method: 'POST',
            body: uploadFormData,
          });

          const cdnUrl = (await cdnRes.text()).trim();
          if (cdnUrl.startsWith('https://files.catbox.moe/')) {
            mediaUrls.push(cdnUrl);
          }
        }
      } catch (err) {
        console.error('Error downloading/uploading Telegram media item:', err);
      }
    }

    await client.disconnect();

    return NextResponse.json({
      success: true,
      foundMediaCount: relatedMediaMsgs.length,
      uploadedUrls: mediaUrls,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'حدث خطأ في جلب وسائط التيليجرام' }, { status: 500 });
  }
}
