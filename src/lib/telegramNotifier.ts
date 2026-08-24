import { formatOrderNumber } from './orderCode';

function escapeHtml(str: string) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function sendTelegramOrderNotification(order: any) {
  const token = process.env.TELEGRAM_BOT_TOKEN || '8647389861:AAG4JGyAQYu4FD6IcX1NVa3wV6HACaoQo0U';
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID || '1965859902';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.SITE_URL || 'https://riva-lime.vercel.app';

  if (!token || !chatId) {
    console.log('⚠️ لم يتم إرسال تنبيه التيليجرام: TELEGRAM_BOT_TOKEN أو TELEGRAM_ADMIN_CHAT_ID غير معرف في البيئة.');
    return;
  }

  try {
    // 1. Format items list — Use nickname if available
    const itemsText = order.items?.map((item: any) => {
      const dressLabel = item.dress?.nickname?.trim() ? item.dress.nickname.trim() : (item.dress?.name || 'فستان');
      const color = item.variant?.color || '';
      const size = item.variant?.size || '';
      return `• <b>${escapeHtml(dressLabel)}</b> - ${escapeHtml(color)} - مقاس ${escapeHtml(size)} (${item.quantity}x)`;
    }).join('\n') || 'لا يوجد تفاصيل';

    // 2. Extract clean Instagram handle
    let cleanInsta = '';
    if (order.instagram && typeof order.instagram === 'string') {
      cleanInsta = order.instagram.replace('@', '').trim();
    } else if (order.notes && typeof order.notes === 'string') {
      const match = order.notes.match(/انستقرام:\s*@?([a-zA-Z0-9._]+)/i);
      if (match) cleanInsta = match[1].trim();
    }

    // 3. Prepare ready-to-copy confirmation message for customer
    const firstItem = order.items?.[0];
    const firstDressLabel = firstItem?.dress?.nickname?.trim() || firstItem?.dress?.name || 'الفستان';
    const firstColor = firstItem?.variant?.color || '';
    const firstSize = firstItem?.variant?.size || '';

    const isExpress = order.notes?.includes('شحن فوري');
    const deliveryNoteLine = isExpress ? '\n▫️ التوصيل: فوري VIP (بدون معاينة ⚡)' : '';

    const copyableMessage = `مرحباً ${order.customerName} يسعد أوقاتك 🌸
معك متجر RIVA ✨

لتأكيد طلبك الأنيق:
▫️ ${firstDressLabel} (${firstColor} - مقاس ${firstSize})
▫️ ${order.city} - ${order.address}
▫️ الإجمالي: ${order.total} د.أ (الدفع عند الاستلام 💵)${deliveryNoteLine}

بانتظار ردك لتثبيت وتجهيز الطلب 👗🤍`;

    const adminOrdersUrl = baseUrl.startsWith('https://') ? `${baseUrl}/admin/orders` : 'https://riva-lime.vercel.app/admin/orders';
    const buttonUrl = adminOrdersUrl;
    const orderCode = formatOrderNumber(order.id);

    const deliveryBadge = isExpress ? '⚡ <b>نوع التوصيل</b>: <u>شحن فوري VIP (مستعجل)</u>' : '🚚 <b>نوع التوصيل</b>: شحن عادي (مع معاينة وتجربة)';

    const message = `🛍️ <b>طلب جديد في متجر ريفا!</b> (${escapeHtml(orderCode)})

👤 <b>الاسم</b>: ${escapeHtml(order.customerName)}
📞 <b>الهاتف</b>: <code>${escapeHtml(order.phone)}</code>
📍 <b>الموقع</b>: ${escapeHtml(order.city)} - ${escapeHtml(order.address)}
${deliveryBadge}

👗 <b>المنتجات المطلوبة</b>:
${itemsText}

💰 <b>الإجمالي</b>: ${order.total} د.أ (شامل التوصيل)
${order.notes ? `\n📝 <b>تفاصيل إضافية</b>: ${escapeHtml(order.notes)}` : ''}

📋 <b>رسالة تأكيد جاهزة للنسخ بنقرة واحدة:</b>
<code>${escapeHtml(copyableMessage)}</code>

🔗 <b>رابط الطلبات</b>: ${adminOrdersUrl}`;

    // 4. Build Direct WhatsApp Message for Delivery Team/Group (Exact Format as requested)
    const itemsListForWa = order.items?.map((item: any) => {
      const dressLabel = item.dress?.nickname?.trim() ? item.dress.nickname.trim() : (item.dress?.name || 'فستان');
      const color = item.variant?.color || '';
      const size = item.variant?.size || '';
      return `${dressLabel} ${color} سايز ${size}`;
    }).join('\n') || '';

    const expressSuffix = isExpress ? ' (فوري)' : '';
    const locationStr = order.city === 'عمان' ? order.address : `${order.city} - ${order.address}`;

    const whatsAppText = `الاسم: ${order.customerName}
رقم الهاتف: ${order.phone}
الموقع: ${locationStr}
السعر : ${order.total} دينار شامل التوصيل${expressSuffix}
${itemsListForWa}`;

    const directWhatsAppUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsAppText)}`;

    // 5. Build inline keyboard (Direct WhatsApp + Instagram + Admin Panel)
    const inlineKeyboard: any[] = [];

    // Row 1: Instant Direct WhatsApp Button
    inlineKeyboard.push([
      {
        text: '📲 إرسال لقروب واتساب الطلبات',
        url: directWhatsAppUrl
      }
    ]);

    // Row 2: Instagram + Admin Panel
    const secondRow: any[] = [];
    if (cleanInsta) {
      secondRow.push({
        text: `💬 مراسلة إنستقرام (@${cleanInsta})`,
        url: `https://ig.me/m/${cleanInsta}`
      });
    }
    secondRow.push({
      text: '📦 لوحة الطلبات',
      url: buttonUrl
    });
    inlineKeyboard.push(secondRow);

    const payload = {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: inlineKeyboard
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
      console.log('✅ تم إرسال تنبيه الطلب للتيليجرام بنجاح مع زر الواتساب المباشر! Order ID:', order.id);
    }
  } catch (error) {
    console.error('❌ خطأ في الاتصال بالتيليجرام:', error);
  }
}
