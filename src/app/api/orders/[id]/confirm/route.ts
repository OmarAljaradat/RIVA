import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { formatOrderNumber } from '@/lib/orderCode';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const numericId = Number(resolvedParams.id);
    if (isNaN(numericId)) return new NextResponse('ID غير صحيح', { status: 400 });

    // 1. Update order to confirmed in DB
    const order = await prisma.order.update({
      where: { id: numericId },
      data: { status: 'confirmed' },
      include: {
        items: {
          include: {
            dress: { select: { id: true, name: true, nickname: true, price: true } },
            variant: { select: { id: true, color: true, colorHex: true, size: true } },
          }
        }
      }
    });

    // 2. Format items for WhatsApp (Exact Template requested)
    const itemsList = order.items.map(item => {
      const dressLabel = item.dress?.nickname?.trim() ? item.dress.nickname.trim() : (item.dress?.name || 'فستان');
      const color = item.variant?.color || '';
      const size = item.variant?.size || '';
      return `${dressLabel} ${color} سايز ${size}`;
    }).join('\n');

    const isExpress = order.notes?.includes('شحن فوري');
    const expressSuffix = isExpress ? ' (فوري)' : '';
    const locationStr = order.city === 'عمان' ? order.address : `${order.city} - ${order.address}`;
    const orderCode = formatOrderNumber(order.id);

    // 3. Build WhatsApp pre-filled message (Exact Template)
    const whatsAppMessage = `الاسم: ${order.customerName}
رقم الهاتف: ${order.phone}
الموقع: ${locationStr}
السعر : ${order.total} دينار شامل التوصيل${expressSuffix}
${itemsList}`;

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsAppMessage)}`;

    // 4. Return interactive confirmation page with instant redirect to WhatsApp
    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تم تأكيد الطلب #${orderCode}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #FAF7F2; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
    .card { background: #fff; padding: 32px 24px; border-radius: 24px; max-width: 440px; width: 100%; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1.5px solid #86EFAC; }
    .icon { font-size: 48px; margin-bottom: 12px; }
    h2 { color: #166534; margin: 0 0 8px; font-size: 22px; font-weight: 900; }
    p { color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
    .btn { display: inline-block; width: 100%; box-sizing: border-box; background: #25D366; color: #fff; text-decoration: none; padding: 14px 20px; border-radius: 14px; font-weight: 900; font-size: 15px; box-shadow: 0 4px 14px rgba(37, 211, 102, 0.35); }
    .btn-admin { display: inline-block; width: 100%; box-sizing: border-box; background: #722F37; color: #fff; text-decoration: none; padding: 12px 20px; border-radius: 14px; font-weight: 800; font-size: 13px; margin-top: 10px; }
  </style>
  <script>
    // Auto redirect to WhatsApp
    window.location.href = "${waUrl}";
  </script>
</head>
<body>
  <div class="card">
    <div class="icon">✅</div>
    <h2>تم تأكيد الطلب #${orderCode} بنجاح!</h2>
    <p>تم تحديث حالة الطلب في قاعدة البيانات إلى (مؤكد). جاري تحويلك الآن إلى تطبيق واتساب لإرسال بيانات الطلب لقروب التوصيل...</p>
    <a href="${waUrl}" class="btn">📲 فتح واتساب الآن</a>
    <a href="https://riva-lime.vercel.app/admin/orders" class="btn-admin">📦 العودة للوحة الطلبات</a>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  } catch (error) {
    console.error('Error confirming order:', error);
    return new NextResponse('حدث خطأ في تأكيد الطلب', { status: 500 });
  }
}
