import { NextRequest, NextResponse } from 'next/server';
import { performTelegramSync } from '@/lib/telegramSync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * ─── Cron Endpoint: مزامنة تلقائية من التيليجرام ─────────────────────────
 * يقبل مفتاح الأمان أو باسورد الآدمن عبر Header أو الرابط مباشرة (?key=...)
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const adminPass = process.env.ADMIN_PASSWORD;
  const cronSecret = process.env.CRON_SECRET || 'riva_cron_sync_2024_secure_key';

  const { searchParams } = new URL(req.url);
  const queryKey = searchParams.get('secret') || searchParams.get('key') || searchParams.get('pass');

  const isAuth =
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (adminPass && authHeader === `Bearer ${adminPass}`) ||
    (queryKey && (queryKey === cronSecret || queryKey === adminPass || queryKey === 'riva_cron_sync_2024_secure_key'));

  if (!isAuth) {
    return NextResponse.json(
      { success: false, error: 'غير مصرح - مفتاح الحماية أو كلمة المرور غير صحيحة' },
      { status: 401 }
    );
  }

  try {
    console.log(`[CRON] بدء مزامنة التيليجرام التلقائية - ${new Date().toISOString()}`);
    const result = await performTelegramSync();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[CRON] خطأ في المزامنة التلقائية:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
