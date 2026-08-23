import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/OmarAljaradat/RIVA/main/public/uploads';
const LOCAL_UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params;
    const filename = slug.join('/');
    if (!filename || filename.includes('..')) {
      return new NextResponse('Invalid filename', { status: 400 });
    }

    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.mp4') contentType = 'video/mp4';
    else if (ext === '.webm') contentType = 'video/webm';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.webp') contentType = 'image/webp';

    // 1. Try local disk first (for local development or if available)
    const localPath = path.join(LOCAL_UPLOADS_DIR, filename);
    if (fs.existsSync(localPath)) {
      const fileBuffer = fs.readFileSync(localPath);
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Accept-Ranges': 'bytes',
        },
      });
    }

    // 2. Fetch from GitHub Raw and stream with proper MIME type for cloud
    const githubUrl = `${GITHUB_RAW_BASE}/${filename}`;
    const remoteRes = await fetch(githubUrl);
    if (!remoteRes.ok) {
      return new NextResponse('Media not found', { status: 404 });
    }

    const arrayBuffer = await remoteRes.arrayBuffer();
    return new NextResponse(Buffer.from(arrayBuffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}
