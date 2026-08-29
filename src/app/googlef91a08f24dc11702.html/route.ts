import { NextResponse } from 'next/server';

export function GET() {
  return new NextResponse('google-site-verification: googlef91a08f24dc11702.html', {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
