import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ─── Security Headers ────────────────────────────────────────────────────
  async headers() {
    // ── Content Security Policy ─────────────────────────────────────────────
    // مبني على المصادر الخارجية المستخدمة فعلاً في المشروع:
    //   - fonts.googleapis.com + fonts.gstatic.com → خطوط Cairo, Playfair, Outfit
    //   - unpkg.com → خط ثمانية (Thmanyah Font)
    //   - الصور والفيديو محلية من /uploads/
    //   - Telegram API لا يُستدعى من المتصفح (فقط من السيرفر)
    const csp = [
      "default-src 'self'",
      // السكربتات: Next.js يحتاج unsafe-inline للـ hydration
      "script-src 'self' 'unsafe-inline'",
      // الأنماط: خطوط جوجل + ثمانية + inline styles لـ Next.js
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
      // الخطوط
      "font-src 'self' https://fonts.gstatic.com https://unpkg.com data:",
      // الصور: محلية + data URIs + blob للمعاينة
      "img-src 'self' data: blob:",
      // الوسائط (فيديو): محلية + blob
      "media-src 'self' blob:",
      // الاتصالات: محلية فقط (API calls)
      "connect-src 'self'",
      // منع التضمين في iframes من أي موقع
      "frame-ancestors 'none'",
      // منع plugins (Flash إلخ)
      "object-src 'none'",
      // منع base tag injection
      "base-uri 'self'",
      // ترقية HTTP إلى HTTPS تلقائياً في الإنتاج
      "upgrade-insecure-requests",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          // ── CSP ─────────────────────────────────────────────────────────
          { key: 'Content-Security-Policy', value: csp },
          // ── بقية الـ headers ─────────────────────────────────────────────
          { key: 'X-Frame-Options',          value: 'DENY' },
          { key: 'X-Content-Type-Options',   value: 'nosniff' },
          { key: 'X-XSS-Protection',         value: '1; mode=block' },
          { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=(), payment=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
