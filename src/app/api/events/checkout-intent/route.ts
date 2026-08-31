import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function escapeHtml(str: string) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function sendTelegram(text: string) {
  const token =
    process.env.TELEGRAM_TRACKING_BOT_TOKEN ||
    process.env.TELEGRAM_RADAR_BOT_TOKEN ||
    '8743461604:AAGpFwPg5u8YAOeqKl4_W7UJXPVVwCdaIp8';

  const chatId =
    process.env.TELEGRAM_TRACKING_CHAT_ID ||
    process.env.TELEGRAM_RADAR_CHAT_ID ||
    '1965859902';

  if (!token || !chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });
  } catch (err) {
    console.error('Error sending telegram checkout intent:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, dressId, variantId, formData, platform, pageTitle } = body;

    // Jordan current time
    const jordanTime = new Date().toLocaleTimeString('ar-JO', {
      timeZone: 'Asia/Amman',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    let dress: any = null;
    let dressLabel = '';
    let color = '';
    let size = '';

    if (dressId) {
      dress = await prisma.dress.findUnique({
        where: { id: Number(dressId) },
        include: { variants: true },
      });
      if (dress) {
        dressLabel = dress.nickname?.trim() || dress.name;
        if (variantId) {
          const variant = dress.variants.find((v: any) => v.id === Number(variantId));
          color = variant?.color || '';
          size = variant?.size || '';
        }
      }
    }

    if (type === 'view_checkout') {
      const message = `👀 <b>زبونة دخلت صفحة الطلب الآن!</b>

👗 <b>الفستان</b>: ${escapeHtml(dressLabel)}
🎨 <b>اللون</b>: ${escapeHtml(color)}
📏 <b>المقاس</b>: ${escapeHtml(size)}
💰 <b>السعر</b>: ${dress?.price} د.أ
🕒 <b>الوقت</b>: ${jordanTime}

<i>(الزبونة تتصفح خيارات الدفع وكتابة العنوان...)</i>`;

      await sendTelegram(message);
    } else if (type === 'lead_typed') {
      const { fullName, phone, city, address } = formData || {};
      if (!phone || phone.length < 9) {
        return NextResponse.json({ ok: true });
      }

      const addressStr = address ? ` - ${escapeHtml(address)}` : '';
      const message = `📝 <b>بيانات زبونة بدأت بالكتابة (Lead حار 🔥)</b>

👤 <b>الاسم</b>: ${escapeHtml(fullName || 'قيد الكتابة')}
📞 <b>الهاتف</b>: <code>${escapeHtml(phone)}</code>
📍 <b>المدينة</b>: ${escapeHtml(city || 'عمان')}${addressStr}
👗 <b>الفستان</b>: ${escapeHtml(dressLabel)} (${escapeHtml(color)} - مقاس ${escapeHtml(size)})
🕒 <b>الوقت</b>: ${jordanTime}

<i>(الزبونة كتبت رقمها في النموذج ولم تضغط تأكيد بعد)</i>`;

      await sendTelegram(message);
    } else if (type === 'engaged_view') {
      const message = `✨ <b>زبونة مهتمة جداً بفستان الآن!</b>

👗 <b>الفستان</b>: ${escapeHtml(dressLabel)}
💰 <b>السعر</b>: ${dress?.price} د.أ
⏱️ <b>النشاط</b>: تتصفح الفيديوهات والصور وتدقق في تفاصيل الفستان منذ 15+ ثانية!
🕒 <b>الوقت</b>: ${jordanTime}`;

      await sendTelegram(message);
    } else if (type === 'social_click') {
      const platformName = platform === 'instagram' ? 'انستقرام 📸' : (platform === 'whatsapp' ? 'واتساب 💬' : platform || 'تواصل');
      const message = `💬 <b>زبونة نقرت على رابط (${escapeHtml(platformName)})!</b>

📍 <b>الموقع</b>: ${escapeHtml(pageTitle || dressLabel || 'الصفحة الرئيسية')}
🕒 <b>الوقت</b>: ${jordanTime}

<i>(الزبونة تحاول التواصل أو الدخول لحساب الانستقرام)</i>`;

      await sendTelegram(message);
    } else if (type === 'share_dress') {
      const message = `🔗 <b>زبونة قامت بنسخ / مشاركة رابط الفستان!</b>

👗 <b>الفستان</b>: ${escapeHtml(dressLabel)}
💰 <b>السعر</b>: ${dress?.price} د.أ
🕒 <b>الوقت</b>: ${jordanTime}

<i>(الزبونة تنوي إرسال الفستان لصديقتها أو حفظه للشراء)</i>`;

      await sendTelegram(message);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Checkout intent error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
