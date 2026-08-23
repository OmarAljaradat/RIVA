import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'];
const MAX_FILE_SIZE = 150 * 1024 * 1024; // 150MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'لم يتم اختيار أي ملف' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'حجم الملف يتجاوز الحد المسموح (150MB)' }, { status: 400 });
    }

    // Upload directly to high-speed Global Storage CDN (Catbox)
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

    return NextResponse.json({ error: 'فشل الرفع إلى السحابة، حاول مرة أخرى' }, { status: 500 });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error?.message || 'حدث خطأ أثناء رفع الملف' }, { status: 500 });
  }
}
