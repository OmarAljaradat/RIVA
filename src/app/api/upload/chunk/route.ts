import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const chunkFile = formData.get('chunk') as File;
    const chunkIndex = parseInt(formData.get('chunkIndex') as string, 10);
    const totalChunks = parseInt(formData.get('totalChunks') as string, 10);
    const uploadId = formData.get('uploadId') as string;
    const fileName = (formData.get('fileName') as string) || 'video.mp4';

    if (!chunkFile || isNaN(chunkIndex) || isNaN(totalChunks) || !uploadId) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
    }

    // Convert chunk to base64
    const buffer = Buffer.from(await chunkFile.arrayBuffer());
    const base64Data = buffer.toString('base64');

    // Save this chunk into PostgreSQL Neon (shared across all lambda instances)
    await prisma.$executeRawUnsafe(
      `INSERT INTO "UploadChunk" ("uploadId", "chunkIndex", data) VALUES ($1, $2, $3)`,
      uploadId,
      chunkIndex,
      base64Data
    );

    // If not final chunk, return success
    if (chunkIndex < totalChunks - 1) {
      return NextResponse.json({ success: true, chunkIndex, totalChunks });
    }

    // Final chunk reached: Fetch all chunks from DB ordered by chunkIndex
    const rows: { data: string }[] = await prisma.$queryRawUnsafe(
      `SELECT data FROM "UploadChunk" WHERE "uploadId" = $1 ORDER BY "chunkIndex" ASC`,
      uploadId
    );

    // Combine all chunk buffers
    const allBuffers = rows.map(r => Buffer.from(r.data, 'base64'));
    const combinedBuffer = Buffer.concat(allBuffers);

    // Clean up temporary chunks from database
    await prisma.$executeRawUnsafe(
      `DELETE FROM "UploadChunk" WHERE "uploadId" = $1`,
      uploadId
    );

    // Upload complete file to Catbox CDN
    const isVideo = fileName.endsWith('.mp4') || fileName.endsWith('.webm') || fileName.endsWith('.mov');
    const mime = isVideo ? 'video/mp4' : 'image/jpeg';
    const blob = new Blob([new Uint8Array(combinedBuffer)], { type: mime });

    const uploadFormData = new FormData();
    uploadFormData.append('reqtype', 'fileupload');
    uploadFormData.append('fileToUpload', blob, fileName);

    const cdnRes = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: uploadFormData,
    });

    const cdnUrl = (await cdnRes.text()).trim();
    if (cdnUrl.startsWith('https://files.catbox.moe/')) {
      return NextResponse.json({ url: cdnUrl, success: true });
    }

    return NextResponse.json({ error: 'فشل الرفع للـ CDN' }, { status: 500 });
  } catch (error: any) {
    console.error('Chunk upload error:', error);
    return NextResponse.json({ error: error?.message || 'خطأ في معالجة الجزء' }, { status: 500 });
  }
}
