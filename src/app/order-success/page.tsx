'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { calculateDeliveryEstimate } from '@/lib/delivery';
import { formatOrderNumber } from '@/lib/orderCode';

interface OrderItemData {
  id: number;
  quantity: number;
  price: number;
  dress?: {
    id: number;
    name: string;
    nickname?: string | null;
    price: number;
  };
  variant?: {
    id: number;
    color: string;
    colorHex: string;
    size: string;
    images?: { url: string }[];
  };
}

interface OrderData {
  id: number;
  customerName: string;
  phone: string;
  city: string;
  address: string;
  instagram?: string | null;
  notes?: string | null;
  status: string;
  total: number;
  createdAt: string;
  items: OrderItemData[];
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || '1';
  const delivery = calculateDeliveryEstimate();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    fetch(`/api/orders/${orderId}`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) setOrder(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [orderId]);

  // Extract clean custom delivery notes (excluding system tags like 📸 or ⚡)
  const extractUserNotes = (rawNotes?: string | null) => {
    if (!rawNotes) return '';
    const parts = rawNotes.split('|').map(s => s.trim());
    const userParts = parts.filter(p => !p.startsWith('📸') && !p.startsWith('⚡') && !p.startsWith('🚚') && !p.startsWith('⏰') && !p.startsWith('ℹ️'));
    return userParts.join(' - ') || rawNotes;
  };

  const userDeliveryNotes = order?.notes ? extractUserNotes(order.notes) : '';

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 16px',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '28px',
        padding: 'clamp(24px, 5vw, 44px)',
        maxWidth: '620px',
        width: '100%',
        boxShadow: '0 16px 44px rgba(114, 47, 55, 0.08)',
        border: '1.5px solid rgba(212, 175, 55, 0.4)',
        textAlign: 'center'
      }}>
        {/* Success Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          color: '#fff',
          fontSize: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 10px 24px rgba(16, 185, 129, 0.3)'
        }}>
          ✓
        </div>
        
        <h1 style={{ fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: 900, color: '#111827', marginBottom: '8px', fontFamily: "'Thmanyah Sans', sans-serif" }}>
          تم استلام طلبك بنجاح! 🎉
        </h1>
        
        <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '20px' }}>
          شكراً لتسوقك من بوتيك ريفا. تم تسجيل طلبك بالمنظومة ورقم الطلب هو:
        </p>
        
        <div style={{ 
          background: 'linear-gradient(135deg, #FAF7F2 0%, #F5EFE6 100%)', 
          border: '1px solid rgba(212, 175, 55, 0.5)', 
          padding: '14px 20px', 
          borderRadius: '16px', 
          marginBottom: '24px',
          fontWeight: 900,
          fontSize: '22px',
          color: '#722F37',
          letterSpacing: '1.5px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
        }}>
          رقم الطلب: {formatOrderNumber(orderId)}
        </div>

        {/* ── ORDERED ITEMS SUMMARY CARD (Item line details) ── */}
        {order && order.items && order.items.length > 0 && (
          <div style={{
            background: '#FAF7F2',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            borderRadius: '18px',
            padding: '18px',
            marginBottom: '20px',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 900, color: '#722F37', marginBottom: '14px', borderBottom: '1px solid rgba(212,175,55,0.25)', paddingBottom: '8px' }}>
              👗 تفاصيل المنتجات المطلوبة:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {order.items.map((item, idx) => {
                const dressTitle = item.dress?.nickname?.trim() || item.dress?.name || 'فستان ريفا الأنيق';
                const color = item.variant?.color || '';
                const size = item.variant?.size || '';
                const imgUrl = item.variant?.images?.[0]?.url || '/uploads/dress1.jpg';
                const isVideo = imgUrl.endsWith('.mp4') || imgUrl.endsWith('.webm');

                return (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    background: '#fff',
                    padding: '12px',
                    borderRadius: '14px',
                    border: '1px solid #E5E7EB'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '54px', height: '68px', borderRadius: '10px', overflow: 'hidden', background: '#000', flexShrink: 0 }}>
                        {isVideo ? (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: '#1C0A10', fontSize: '16px' }}>▶️</div>
                        ) : (
                          <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: '14px', color: '#111827' }}>{dressTitle}</div>
                        <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '3px' }}>
                          <span style={{ background: '#F3F4F6', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>{color}</span>
                          <span style={{ margin: '0 4px' }}>•</span>
                          <span style={{ background: '#F3F4F6', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>مقاس {size}</span>
                          <span style={{ margin: '0 4px' }}>•</span>
                          <span>الكمية: {item.quantity}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ fontWeight: 900, color: '#722F37', fontSize: '15px' }}>
                      {item.price * item.quantity} د.أ
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Line */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #E5E7EB' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#374151' }}>المبلغ الإجمالي (شامل التوصيل):</span>
              <span style={{ fontSize: '18px', fontWeight: 900, color: '#722F37' }}>{order.total} د.أ</span>
            </div>
          </div>
        )}

        {/* ── CUSTOMER & DELIVERY DETAILS ── */}
        {order && (
          <div style={{
            background: '#FFFDF9',
            border: '1px solid rgba(212, 175, 55, 0.25)',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '20px',
            textAlign: 'right',
            fontSize: '13px',
            lineHeight: 1.8,
            color: '#374151'
          }}>
            <div><strong>👤 الاسم:</strong> {order.customerName}</div>
            <div><strong>📞 رقم الهاتف:</strong> <span dir="ltr">{order.phone}</span></div>
            <div><strong>📍 العنوان:</strong> {order.city} - {order.address}</div>

            {/* Delivery Notes Display (Resolves Issue 1) */}
            {userDeliveryNotes && (
              <div style={{
                marginTop: '10px',
                paddingTop: '8px',
                borderTop: '1px dashed #FDE68A',
                color: '#92400E',
                fontWeight: 800,
                background: '#FEF3C7',
                padding: '8px 12px',
                borderRadius: '10px'
              }}>
                📝 <strong>ملاحظات التوصيل:</strong> {userDeliveryNotes}
              </div>
            )}
          </div>
        )}

        {/* Dynamic Delivery Date Card */}
        <div style={{
          background: '#FFFDF9',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          padding: '16px 18px',
          borderRadius: '16px',
          marginBottom: '20px',
          textAlign: 'right'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px' }}>🚚</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 900, color: '#722F37' }}>
                الموعد المتوقع للتوصيل: {delivery.fullFormatted}
              </div>
              <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
                شحن ميسر وسريع لجميع محافظات المملكة
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(5, 150, 105, 0.08)',
            border: '1px solid rgba(5, 150, 105, 0.2)',
            padding: '8px 12px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 800,
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>🔍</span>
            <span>معاينة وتجربة الفستان فور وصول المندوب والتأكد قبل الدفع.</span>
          </div>
        </div>
        
        {/* Instagram Confirmation & Contact Channel */}
        <div style={{
          background: 'linear-gradient(135deg, #FFFDF9 0%, #FAF5EF 100%)',
          border: '1px dashed rgba(212, 175, 55, 0.6)',
          padding: '16px 18px',
          borderRadius: '16px',
          marginBottom: '24px',
          color: '#374151',
          fontSize: '13px',
          lineHeight: 1.7,
          fontWeight: 700,
        }}>
          ✨ <span style={{ color: '#722F37', fontWeight: 900 }}>لتثبيت الطلب:</span> يرجى انتظار رسالة من المتجر عبر الانستقرام (<Link href="/instagram" style={{ color: '#E1306C', fontWeight: 900, textDecoration: 'underline' }} dir="ltr">@riva.dress1</Link>) أو مراسلتنا مباشرة 📩
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Link
            href="/instagram"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '14px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #E1306C, #833AB4)',
              color: '#fff',
              fontWeight: 900,
              fontSize: '14px',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(225, 48, 108, 0.3)',
              boxSizing: 'border-box'
            }}
          >
            <span>📸</span>
            <span>متابعة حساب الإنستقرام (@riva.dress1)</span>
          </Link>

          <Link href="/products" className="btn-luxe-admin" style={{ width: '100%', padding: '14px', justifyContent: 'center', fontSize: '15px', borderRadius: '14px' }}>
            👗 العودة لتصفح كولكشن الفساتين
          </Link>
        </div>
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
