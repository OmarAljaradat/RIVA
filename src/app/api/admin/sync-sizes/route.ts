import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/sessionToken';
import { performTelegramSync } from '@/lib/telegramSync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ─── Auth Helper ─────────────────────────────────────────────────────────────
async function requireAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('riva_admin_session')?.value;
    if (!token) return false;
    return await verifySessionToken(token);
  } catch { return false; }
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }
  try {
    const result = await performTelegramSync();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }
  try {
    const result = await performTelegramSync();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
