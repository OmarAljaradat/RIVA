'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { calculateDeliveryEstimate } from '@/lib/delivery';

import { formatOrderNumber } from '@/lib/orderCode';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || '1';
  const delivery = calculateDeliveryEstimate();

  return (
    <div style={{
      minHeight: '75vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '32px',
        padding: '52px 40px',
        maxWidth: '560px',
        width: '100%',
        boxShadow: '0 16px 44px rgba(114, 47, 55, 0.08)',
        border: '1.5px solid rgba(212, 175, 55, 0.4)',
        textAlign: 'center'
      }}>
        {/* Success Icon */}
        <div style={{
          width: '88px',
          height: '88px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          color: '#fff',
          fontSize: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 10px 24px rgba(16, 185, 129, 0.3)'
        }}>
          ✓
        </div>
        
        <h1 style={{ fontSize: '30px', fontWeight: 900, color: '#111827', marginBottom: '8px', fontFamily: "'Thmanyah Sans', sans-serif" }}>
          تم استلام طلبك بنجاح! 🎉
        </h1>
        
        <p style={{ color: '#6B7280', fontSize: '15px', marginBottom: '24px' }}>
          شكراً لتسوقك من بوتيك ريفا. تم تسجيل طلبك بالمنظومة ورقم الطلب هو:
        </p>
        
        <div style={{ 
          background: 'linear-gradient(135deg, #FAF7F2 0%, #F5EFE6 100%)', 
          border: '1px solid rgba(212, 175, 55, 0.5)', 
          padding: '16px 24px', 
          borderRadius: '18px', 
          marginBottom: '28px',
          fontWeight: 900,
          fontSize: '24px',
          color: '#722F37',
          letterSpacing: '2px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
        }}>
          {formatOrderNumber(orderId)}
        </div>

        {/* Dynamic Delivery Date Card */}
        <div style={{
          background: '#FFFDF9',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          padding: '18px 20px',
          borderRadius: '18px',
          marginBottom: '28px',
          textAlign: 'right'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <span style={{ fontSize: '26px' }}>🚚</span>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#722F37' }}>
                الموعد المتوقع للتوصيل: {delivery.fullFormatted}
              </div>
              <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                شحن ميسر وسريع لجميع محافظات المملكة
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(5, 150, 105, 0.08)',
            border: '1px solid rgba(5, 150, 105, 0.2)',
            padding: '10px 14px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 800,
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>🔍</span>
            <span>يتوفر معاينة وتجربة الفستان فور وصول المندوب والتأكد قبل الدفع.</span>
          </div>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #FFFDF9 0%, #FAF5EF 100%)',
          border: '1px dashed rgba(212, 175, 55, 0.6)',
          padding: '16px 20px',
          borderRadius: '16px',
          marginBottom: '32px',
          color: '#374151',
          fontSize: '14px',
          lineHeight: 1.7,
          fontWeight: 700,
        }}>
          ✨ <span style={{ color: '#722F37', fontWeight: 900 }}>لتثبيت الطلب:</span> يرجى انتظار رسالة من المتجر عبر الانستقرام (<span style={{ color: '#E1306C', fontWeight: 900 }} dir="ltr">@riva.dress1</span>) لتأكيد التفاصيل وتثبيت الطلب 📩
        </div>
        
        <Link href="/products" className="btn-luxe-admin" style={{ width: '100%', padding: '16px', justifyContent: 'center', fontSize: '16px', borderRadius: '16px' }}>
          👗 العودة لتصفح كولكشن الفساتين
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <main style={{ background: 'var(--color-cream)', minHeight: '100vh' }}>
      <Navbar />
      <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><div className="spinner"></div></div>}>
        <OrderSuccessContent />
      </Suspense>
      <Footer />
    </main>
  );
}
