/**
 * src/lib/adminAuth.ts
 *
 * مساعد موحّد للتحقق من صلاحية الإدمن في API routes
 * يستخدم HMAC-SHA256 عبر verifySessionToken — متوافق مع Edge + Node.js
 */

import { type NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/sessionToken';

/**
 * يتحقق من أن الطلب مرسل من إدمن مصادق عليه.
 * يقرأ الـ cookie من الـ request مباشرة (يعمل في Node.js runtime).
 */
export async function isAdminAuthenticated(request: NextRequest): Promise<boolean> {
  try {
    const sessionToken = request.cookies.get('riva_admin_session')?.value;
    if (!sessionToken) return false;
    return await verifySessionToken(sessionToken);
  } catch {
    return false;
  }
}
