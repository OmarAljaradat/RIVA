import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|webp|gif|mp4|webm)$/i;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'لم يتم رفع أي ملف' }, { status: 400 });
    }

    // التحقق من نوع الملف (MIME type)
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'نوع الملف غير مسموح. المسموح: JPG, PNG, WebP, GIF, MP4, WebM' },
        { status: 400 }
      );
    }

    // التحقق من امتداد الملف
    if (!ALLOWED_EXTENSIONS.test(file.name)) {
      return NextResponse.json(
        { error: 'امتداد الملف غير مسموح' },
        { status: 400 }
      );
    }

    // التحقق من حجم الملف
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'حجم الملف يتجاوز الحد المسموح (50MB)' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    try {
      await mkdir(uploadDir, { recursive: true });
    } catch {
      // المجلد موجود
    }

    // اسم آمن بالكامل — بدون اسم الملف الأصلي
    const ext = path.extname(file.name).toLowerCase().replace(/[^a-z0-9.]/g, '');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `upload-${uniqueSuffix}${ext}`;
    const filePath = path.join(uploadDir, filename);

    await writeFile(filePath, buffer);

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في رفع الملف' }, { status: 500 });
  }
}
