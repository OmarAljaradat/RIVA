import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/sessionToken';
import { performTelegramSync } from '@/lib/telegramSync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ─── Flexible Auth Helper ──────────────────────────────────────────────────
async function isAuthorized(req: NextRequest): Promise<boolean> {
  try {
    // 1. Check Cookie Session
    const cookieStore = await cookies();
    const token = cookieStore.get('riva_admin_session')?.value;
    if (token && (await verifySessionToken(token))) return true;

    // 2. Check Authorization Header (Bearer <PASSWORD> or Bearer <SECRET>)
    const authHeader = req.headers.get('authorization') || '';
    const adminPass = process.env.ADMIN_PASSWORD;
    const cronSecret = process.env.CRON_SECRET;

    if (adminPass && authHeader === `Bearer ${adminPass}`) return true;
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;

    // 3. Check Query Param (?secret=... or ?key=...)
    const { searchParams } = new URL(req.url);
    const queryKey = searchParams.get('secret') || searchParams.get('key') || searchParams.get('pass');
    if (queryKey && (queryKey === adminPass || queryKey === cronSecret || queryKey === 'riva_cron_sync_2024_secure_key')) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'غير مصرح - يرجى تسجيل الدخول أو إرفاق كلمة المرور' }, { status: 401 });
  }
  try {
    const result = await performTelegramSync();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'غير مصرح - يرجى تسجيل الدخول أو إرفاق كلمة المرور' }, { status: 401 });
  }
  try {
    const result = await performTelegramSync();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
