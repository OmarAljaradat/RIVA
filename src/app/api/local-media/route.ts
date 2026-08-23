import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const videosDir = path.join(process.cwd(), 'public', 'videos');
    const photosDir = path.join(process.cwd(), 'public', 'photos');

    let videos: string[] = [];
    let photos: string[] = [];

    if (fs.existsSync(videosDir)) {
      videos = fs.readdirSync(videosDir).filter(f => !f.startsWith('.')).map(f => `/videos/${f}`);
    }

    if (fs.existsSync(photosDir)) {
      photos = fs.readdirSync(photosDir).filter(f => !f.startsWith('.')).map(f => `/photos/${f}`);
    }

    return NextResponse.json({ videos, photos });
  } catch (error: any) {
    return NextResponse.json({ videos: [], photos: [], error: error.message });
  }
}
