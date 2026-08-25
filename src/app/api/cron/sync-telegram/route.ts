import { NextRequest, NextResponse } from 'next/server';
import { performTelegramSync } from '@/lib/telegramSync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * ─── Cron Endpoint: مزامنة تلقائية من التيليجرام ─────────────────────────
 * يتم استدعاؤه تلقائياً من Vercel Cron أو من خدمة خارجية مثل cron-job.org.
 * محمي بـ CRON_SECRET لمنع أي استدعاء غير مصرح به.
 */
export async function GET(req: NextRequest) {
  // ── التحقق من مفتاح الحماية ──
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { success: false, error: 'CRON_SECRET غير مهيأ في Environment Variables' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: 'غير مصرح - مفتاح الحماية غير صحيح' },
      { status: 401 }
    );
  }

  try {
    console.log(`[CRON] بدء مزامنة التيليجرام التلقائية - ${new Date().toISOString()}`);
    const result = await performTelegramSync();
    console.log(`[CRON] انتهت المزامنة - تم تحديث ${result.updatedCount || 0} فستان، ${result.newDressesCount || 0} جديد`);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[CRON] خطأ في المزامنة التلقائية:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
