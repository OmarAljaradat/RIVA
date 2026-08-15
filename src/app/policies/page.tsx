'use client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function PoliciesPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-cream)' }}>
      <Navbar />
      <div style={{ padding: '48px 0 80px' }}>
        <div className="container" style={{ maxWidth: '720px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '3px', color: '#D4AF37' }}>RIVA BOUTIQUE</span>
            <h1 className="font-thmanyah" style={{ fontSize: '32px', fontWeight: 800, color: '#111827', margin: '10px 0 8px' }}>
              الشروط والسياسات
            </h1>
            <p style={{ color: '#6B7280', fontSize: '14px' }}>آخر تحديث: أغسطس 2026</p>
          </div>

          {/* Policy Sections */}
          {[
            {
              icon: '🚚',
              title: 'سياسة التوصيل',
              items: [
                'نوصل لجميع محافظات المملكة الأردنية الهاشمية.',
                'رسوم التوصيل: 3 دنانير للشحن العادي.',
                'مواعيد التوصيل داخل عمان: من 10 صباحاً حتى 10 مساءً.',
                'مواعيد التوصيل للمحافظات: خلال الشفت الصباحي فقط (10 ص – 5 م).',
                'يتوفر خيار الشحن الفوري المستعجل (بدون معاينة): مجاناً وبدون تكلفة إضافية لعمان، وبتكلفة إضافية 2 دينار للمحافظات.',
                'يتم التواصل مع العميل لتأكيد الوقت والعنوان قبل الشحن.',
              ]
            },
            {
              icon: '🔍',
              title: 'سياسة المعاينة والدفع',
              items: [
                'طرق الدفع المتاحة: نقداً عند الاستلام (Cash on Delivery) أو عن طريق كليك (CliQ).',
                'يحق للعميلة معاينة الفستان وتجربته قبل الدفع (في حالة الشحن العادي).',
                'في حالة الشحن الفوري المستعجل: لا تتوفر معاينة.',
              ]
            },
            {
              icon: '↩️',
              title: 'سياسة الإرجاع والاستبدال',
              items: [
                'يُمنع إرجاع أو استبدال أي فستان نهائياً في حالة مغادرة مندوب التوصيل من عند الزبونة.',
                'تقتصر المعاينة والتجربة فقط أثناء تواجد مندوب التوصيل وقبل استلام الطلب ومغادرة المندوب.',
              ]
            },
            {
              icon: '📋',
              title: 'شروط الطلب',
              items: [
                'يُعتبر الطلب مثبتاً فقط بعد تأكيده من فريق ريفا عبر الانستقرام.',
                'يحق لريفا رفض أي طلب غير مؤكد أو في حال وجود معلومات غير صحيحة.',
                'تحتفظ ريفا بحق تعديل الأسعار والعروض دون إشعار مسبق.',
                'الطلبات المكررة أو الوهمية قد تُلغى تلقائياً.',
              ]
            },
            {
              icon: '🔒',
              title: 'الخصوصية وحماية البيانات',
              items: [
                'نحافظ على خصوصية بيانات العملاء ولا نشاركها مع أي طرف ثالث.',
                'يتم استخدام اسم العميلة ورقم هاتفها وعنوانها لأغراض التوصيل فقط.',
                'حساب الانستقرام يُستخدم فقط للتحقق من الطلب والتواصل.',
              ]
            },
          ].map((section, i) => (
            <div key={i} style={{
              background: '#fff',
              borderRadius: '20px',
              padding: '28px 32px',
              marginBottom: '20px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
              border: '1px solid rgba(212,175,55,0.15)'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#722F37', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>{section.icon}</span> {section.title}
              </h2>
              <ul style={{ margin: 0, paddingRight: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {section.items.map((item, j) => (
                  <li key={j} style={{ fontSize: '14px', color: '#374151', lineHeight: 1.7, fontWeight: 600 }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Back button */}
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <Link href="/products" className="btn-luxe-admin" style={{ padding: '14px 36px', fontSize: '15px' }}>
              👗 العودة لتصفح الفساتين
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
