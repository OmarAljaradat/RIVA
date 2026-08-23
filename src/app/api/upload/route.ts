import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BOT_TOKEN = '8647389861:AAG4JGyAQYu4FD6IcX1NVa3wV6HACaoQo0U';
const CHAT_ID = '1965859902';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'لم يتم اختيار أي ملف' }, { status: 400 });
    }

    const isVideo = file.type?.includes('video') || file.name?.endsWith('.mp4') || file.name?.endsWith('.mov');

    // 1. Try Telegram Bot Storage
    try {
      const endpoint = isVideo ? 'sendVideo' : 'sendPhoto';
      const tgFormData = new FormData();
      tgFormData.append('chat_id', CHAT_ID);
      tgFormData.append(isVideo ? 'video' : 'photo', file, file.name || 'media.mp4');

      const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${endpoint}`, {
        method: 'POST',
        body: tgFormData,
      });

      const tgData = await tgRes.json();
      if (tgData.ok) {
        const fileId = isVideo
          ? (tgData.result?.video?.file_id || tgData.result?.document?.file_id)
          : (tgData.result?.photo?.[tgData.result.photo.length - 1]?.file_id || tgData.result?.document?.file_id);

        if (fileId) {
          const fileRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
          const fileData = await fileRes.json();
          if (fileData.ok && fileData.result?.file_path) {
            const url = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.result.file_path}`;
            return NextResponse.json({ url, success: true });
          }
        }
      }
    } catch (tgErr) {
      console.warn('Telegram bot upload failed, trying Catbox...', tgErr);
    }

    // 2. Try Catbox
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('reqtype', 'fileupload');
      uploadFormData.append('fileToUpload', file, file.name || 'media.jpg');

      const cdnRes = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: uploadFormData,
      });

      const cdnUrl = (await cdnRes.text()).trim();
      if (cdnUrl.startsWith('https://files.catbox.moe/')) {
        return NextResponse.json({ url: cdnUrl, success: true });
      }
    } catch (catboxErr) {
      console.warn('Catbox upload failed...', catboxErr);
    }

    // 3. Fallback to Data URL for images
    if (!isVideo && file.size < 4 * 1024 * 1024) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const dataUrl = `data:${file.type || 'image/jpeg'};base64,${buffer.toString('base64')}`;
      return NextResponse.json({ url: dataUrl, success: true });
    }

    return NextResponse.json({ error: 'تعذر رفع الملف، يرجى المحاولة مرة أخرى أو استخدام رابط مباشر' }, { status: 500 });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error?.message || 'حدث خطأ أثناء رفع الملف' }, { status: 500 });
  }
}
