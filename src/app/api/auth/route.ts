import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { buildSessionToken, verifySessionToken } from '@/lib/sessionToken';

// ─── Rate Limiting لمحاولات تسجيل الدخول الفاشلة ────────────────────────────
// يُخزن في الذاكرة — يكفي لـ Replit single-instance
const loginFailures = new Map<string, { count: number; firstFailure: number }>();
const MAX_FAILURES   = 5;
const BLOCK_WINDOW   = 15 * 60 * 1000; // 15 دقيقة

function checkLoginRateLimit(ip: string): { blocked: boolean; waitMinutes?: number } {
  const now    = Date.now();
  const record = loginFailures.get(ip);

  if (!record) return { blocked: false };

  const elapsed = now - record.firstFailure;

  // انتهت المدة — امسح السجل وابدأ من جديد
  if (elapsed > BLOCK_WINDOW) {
    loginFailures.delete(ip);
    return { blocked: false };
  }

  if (record.count >= MAX_FAILURES) {
    const waitMinutes = Math.ceil((BLOCK_WINDOW - elapsed) / 60_000);
    return { blocked: true, waitMinutes };
  }

  return { blocked: false };
}

function recordFailedLogin(ip: string): void {
  const now    = Date.now();
  const record = loginFailures.get(ip);

  if (!record || now - record.firstFailure > BLOCK_WINDOW) {
    loginFailures.set(ip, { count: 1, firstFailure: now });
  } else {
    record.count++;
  }
}

function clearLoginFailures(ip: string): void {
  loginFailures.delete(ip);
}

// ─── POST: تسجيل الدخول ──────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // ── فحص Rate Limit أولاً ────────────────────────────────────────────────
    const rateCheck = checkLoginRateLimit(ip);
    if (rateCheck.blocked) {
      return NextResponse.json(
        { error: `تم تجاوز الحد المسموح من المحاولات. يرجى الانتظار ${rateCheck.waitMinutes} دقيقة قبل المحاولة مجدداً.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 });
    }

    if (password === process.env.ADMIN_PASSWORD) {
      // ── نجح تسجيل الدخول — امسح المحاولات الفاشلة ──────────────────────
      clearLoginFailures(ip);

      const sessionToken = await buildSessionToken();
      const response = NextResponse.json({ success: true });
      response.cookies.set('riva_admin_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 أيام
      });
      return response;
    } else {
      // ── فشل — سجّل المحاولة ─────────────────────────────────────────────
      recordFailedLogin(ip);

      // احسب كم محاولة تبقت
      const record = loginFailures.get(ip);
      const remaining = record ? Math.max(0, MAX_FAILURES - record.count) : MAX_FAILURES;

      // تأخير ثابت لمنع Timing-based enumeration
      await new Promise(resolve => setTimeout(resolve, 500));

      const msg = remaining > 0
        ? `كلمة السر غير صحيحة. تبقت ${remaining} محاولة قبل الحظر المؤقت.`
        : `تم تجاوز الحد المسموح. يرجى الانتظار ${Math.ceil(BLOCK_WINDOW / 60_000)} دقيقة.`;

      return NextResponse.json({ error: msg }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في تسجيل الدخول' }, { status: 500 });
  }
}

// ─── DELETE: تسجيل الخروج ────────────────────────────────────────────────────
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('riva_admin_session');
  return response;
}

// ─── GET: التحقق من الجلسة (يُستخدم من admin/layout.tsx) ────────────────────
export async function GET() {
  try {
    const cookieStore  = await cookies();
    const sessionToken = cookieStore.get('riva_admin_session')?.value;

    if (sessionToken && (await verifySessionToken(sessionToken))) {
      return NextResponse.json({ authenticated: true });
    }
    return NextResponse.json({ authenticated: false }, { status: 401 });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
