/**
 * src/lib/sessionToken.ts
 *
 * مكتبة الجلسة المشتركة — تعمل في Edge Runtime (middleware) وNode.js (API routes)
 * تستخدم Web Crypto API (متاحة في كلا البيئتين)
 * HMAC-SHA256 بدل Base64 + Salt ثابت
 */

const encoder = new TextEncoder();

// ── بناء مفتاح HMAC من السر البيئي ─────────────────────────────────────────
async function getHmacKey(): Promise<CryptoKey> {
  // SESSION_SECRET هو الأولوية — يسقط على ADMIN_PASSWORD كـ fallback
  const secret = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || 'riva_fallback_key';
  return globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

// ── بناء التوكن (HMAC-SHA256 hex string) ────────────────────────────────────
export async function buildSessionToken(): Promise<string> {
  const key = await getHmacKey();
  const signature = await globalThis.crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode('riva_admin_session_v2') // نص ثابت غير سري — السر هو الـ key
  );
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── التحقق من التوكن بمقارنة XOR ثابتة الزمن (Timing-Safe) ─────────────────
export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const expected = await buildSessionToken();

    // الطولان لازم يكونوا متساويين أولاً
    if (token.length !== expected.length) return false;

    // XOR bit-by-bit — يمنع Timing Attack لأن المقارنة دائماً تكتمل
    const aBytes = encoder.encode(token);
    const bBytes = encoder.encode(expected);
    let diff = 0;
    for (let i = 0; i < aBytes.length; i++) {
      diff |= aBytes[i] ^ bBytes[i];
    }
    return diff === 0;
  } catch {
    return false;
  }
}
