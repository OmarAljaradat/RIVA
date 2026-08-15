import { formatOrderNumber } from './orderCode';

export async function sendTelegramOrderNotification(order: any) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.SITE_URL || 'http://localhost:3000';

  if (!token || !chatId) {
    console.log('⚠️ لم يتم إرسال تنبيه التيليجرام: TELEGRAM_BOT_TOKEN أو TELEGRAM_ADMIN_CHAT_ID غير معرف في البيئة.');
    return;
  }

  try {
    // Format items list
    const itemsText = order.items?.map((item: any) => {
      const dressLabel = item.dress?.nickname ? item.dress.nickname : (item.dress?.name || 'فستان');
      const color = item.variant?.color || '';
      const size = item.variant?.size || '';
      return `• ${dressLabel} - ${color} - مقاس ${size} (${item.quantity}x)`;
    }).join('\n') || 'لا يوجد تفاصيل';


    // Format text
    const isLocal = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
    const adminOrdersUrl = `${baseUrl}/admin/orders`;
    const buttonUrl = isLocal ? 'https://t.me/RivaForwardBot' : adminOrdersUrl;
    const orderCode = formatOrderNumber(order.id);

    const message = `🛍️ *طلب جديد في متجر ريفا!* (${orderCode})

👤 *الاسم*: ${order.customerName}
📞 *الهاتف*: \`${order.phone}\`
📍 *الموقع*: ${order.city} - ${order.address}

👗 *المنتجات*:
${itemsText}

💰 *الإجمالي*: ${order.total} د.أ (شامل التوصيل)
${order.notes ? `\n📝 *الملاحظات*: ${order.notes}` : ''}

🔗 *رابط الطلبات*: ${adminOrdersUrl}`;

    const payload = {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '📦 فتح لوحة الطلبات بالإدمن',
              url: buttonUrl
            }
          ]
        ]
      }
    };


    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!data.ok) {
      console.error('❌ فشل إرسال تنبيه التيليجرام:', data);
    } else {
      console.log('✅ تم إرسال تنبيه الطلب للتيليجرام بنجاح! Order ID:', order.id);
    }
  } catch (error) {
    console.error('❌ خطأ في الاتصال بالتيليجرام:', error);
  }
}
