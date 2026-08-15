import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/sessionToken';

// ─── المسارات التي تحتاج حماية إدمن (صفحات) ─────────────────────────────────
const ADMIN_PATHS = [
  '/admin/dashboard',
  '/admin/products',
  '/admin/orders',
  '/admin/import-inspector',
];

// ─── مسارات API التي تحتاج حماية إدمن ───────────────────────────────────────
const ADMIN_API_PATHS = [
  '/api/orders',
  '/api/products',
  '/api/upload',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPage = ADMIN_PATHS.some(p => pathname.startsWith(p));
  const isAdminApi  = ADMIN_API_PATHS.some(p => pathname.startsWith(p));

  // ── استثناءات عامة للزبائن ────────────────────────────────────────────────
  const isPublicApiRoute =
    (pathname === '/api/orders'            && request.method === 'POST') || // تثبيت طلب
    (pathname.startsWith('/api/products') && request.method === 'GET');  // عرض الكتالوج

  if (isAdminPage || (isAdminApi && !isPublicApiRoute)) {
    const sessionToken = request.cookies.get('riva_admin_session')?.value;

    // ── التحقق من التوكن بـ HMAC-SHA256 (Timing-Safe) ───────────────────────
    const isValid = sessionToken ? await verifySessionToken(sessionToken) : false;

    if (!isValid) {
      if (isAdminPage) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.json(
        { error: 'غير مصرح — يرجى تسجيل الدخول' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/orders/:path*',
    '/api/products/:path*',
    '/api/upload/:path*',
  ],
};
