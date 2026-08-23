import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const chunk = formData.get('chunk') as File;
    const chunkIndex = parseInt(formData.get('chunkIndex') as string || '0', 10);
    const totalChunks = parseInt(formData.get('totalChunks') as string || '1', 10);
    const uploadId = (formData.get('uploadId') as string || 'upload_' + Date.now()).replace(/[^a-zA-Z0-9_-]/g, '');
    const fileName = (formData.get('fileName') as string || 'media.mp4').replace(/[^a-zA-Z0-9._-]/g, '_');

    if (!chunk) {
      return NextResponse.json({ error: 'لم يتم استلام أي جزء من الملف' }, { status: 400 });
    }

    const tempDir = path.join(os.tmpdir(), 'riva_uploads', uploadId);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Save chunk
    const chunkBuffer = Buffer.from(await chunk.arrayBuffer());
    const chunkPath = path.join(tempDir, `chunk_${chunkIndex}`);
    fs.writeFileSync(chunkPath, chunkBuffer);

    // If not the last chunk, acknowledge receipt
    if (chunkIndex < totalChunks - 1) {
      return NextResponse.json({ success: true, progress: Math.round(((chunkIndex + 1) / totalChunks) * 100) });
    }

    // Last chunk received -> Combine all chunks
    const finalFilePath = path.join(tempDir, fileName);
    const writeStream = fs.createWriteStream(finalFilePath);

    for (let i = 0; i < totalChunks; i++) {
      const currentChunkPath = path.join(tempDir, `chunk_${i}`);
      if (fs.existsSync(currentChunkPath)) {
        const data = fs.readFileSync(currentChunkPath);
        writeStream.write(data);
        fs.unlinkSync(currentChunkPath); // clean chunk
      }
    }
    writeStream.end();

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // Upload combined file to Catbox CDN
    const finalBuffer = fs.readFileSync(finalFilePath);
    const blob = new Blob([finalBuffer], { type: chunk.type || 'video/mp4' });

    const cdnFormData = new FormData();
    cdnFormData.append('reqtype', 'fileupload');
    cdnFormData.append('fileToUpload', blob, fileName);

    const cdnRes = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: cdnFormData,
    });

    const cdnUrl = (await cdnRes.text()).trim();

    // Clean up temporary directory
    try {
      if (fs.existsSync(finalFilePath)) fs.unlinkSync(finalFilePath);
      if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);
    } catch {}

    if (cdnUrl.startsWith('https://files.catbox.moe/')) {
      return NextResponse.json({ url: cdnUrl, success: true });
    }

    return NextResponse.json({ error: 'فشل حفظ الملف على السحابة: ' + cdnUrl }, { status: 500 });
  } catch (error: any) {
    console.error('Chunk upload error:', error);
    return NextResponse.json({ error: error?.message || 'حدث خطأ أثناء رفع الفيديو' }, { status: 500 });
  }
}
