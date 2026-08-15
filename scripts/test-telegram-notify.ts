import fs from 'fs';
import path from 'path';

// Parse .env manually
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '');
});

async function main() {
  console.log('📱 إرسال رسالة تجريبية لـ ID:', env.TELEGRAM_ADMIN_CHAT_ID);

  const adminUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const isLocal = adminUrl.includes('localhost') || adminUrl.includes('127.0.0.1');
  
  // Telegram inline button requires valid public HTTP/HTTPS URL
  const buttonUrl = isLocal ? 'https://riva-boutique.replit.app/admin/orders' : `${adminUrl}/admin/orders`;

  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_ADMIN_CHAT_ID,
      text: `🛍️ *تم تفعيل إشعارات متجر ريفا بنجاح!* 🎉\n\nأهلاً عمر (@Omar1Jaradat)! الآن أي طلب جديد يوصل على الموقع سيوصلك إشعار فوري هنا مع زر مباشر للوحة الإدمن.\n\n🔗 رابط الأدمن المحلي: ${adminUrl}/admin/orders`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📦 فتح لوحة الطلبات بالإدمن', url: buttonUrl }
          ]
        ]
      }
    })
  });


  const data = await res.json();
  console.log('النتيجة:', data);
}

main();
