import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/OmarAljaradat/RIVA/main/public/uploads';
const LOCAL_UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string[] | string }> | { slug: string[] | string } }
) {
  try {
    const resolvedParams = await context.params;
    const rawSlug = resolvedParams?.slug;
    const slugArray = Array.isArray(rawSlug) ? rawSlug : [rawSlug];
    const filename = slugArray.filter(Boolean).join('/');

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

    // 1. Check local filesystem
    const localPath = path.join(LOCAL_UPLOADS_DIR, filename);
    if (fs.existsSync(localPath)) {
      const fileBuffer = fs.readFileSync(localPath);
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Accept-Ranges': 'bytes',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // 2. Fetch from GitHub Raw with proper headers
    const githubUrl = `${GITHUB_RAW_BASE}/${encodeURIComponent(filename)}`;
    const remoteRes = await fetch(githubUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
      },
    });

    if (!remoteRes.ok) {
      console.error(`Media proxy error: ${remoteRes.status} for ${githubUrl}`);
      return new NextResponse(`Media not found: ${remoteRes.status}`, { status: 404 });
    }

    const arrayBuffer = await remoteRes.arrayBuffer();
    return new NextResponse(Buffer.from(arrayBuffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('Media proxy exception:', error?.message);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
