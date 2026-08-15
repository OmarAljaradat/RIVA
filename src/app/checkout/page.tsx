'use client';

import { useState, useEffect, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { calculateDeliveryEstimate, calculateExpressDeliveryEstimate } from '@/lib/delivery';

interface DressData {
  id: number;
  name: string;
  price: number;
  variants: {
    id: number;
    color: string;
    colorHex: string;
    size: string;
    quantity: number;
    images: { url: string }[];
  }[];
}

const inputStyle = {
  width: '100%',
  padding: '13px 16px',
  borderRadius: '12px',
  border: '1.5px solid #E5E7EB',
  fontSize: '15px',
  outline: 'none',
  background: '#FAFAFA',
  fontFamily: 'inherit',
  fontWeight: 600,
  color: '#111827',
  boxSizing: 'border-box' as const,
};

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 800,
  color: '#374151',
  marginBottom: '7px',
};

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
      {error && <span style={{ color: '#EF4444', fontSize: '12px', fontWeight: 700, marginTop: '5px', display: 'block' }}>{error}</span>}
    </div>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dressId = searchParams.get('dressId');
  const variantId = searchParams.get('variantId');

  const [dress, setDress] = useState<DressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ fullName: '', phone: '', city: 'عمان', address: '', instagram: '', notes: '' });
  const [deliveryType, setDeliveryType] = useState<'standard' | 'express'>('standard');
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('أي وقت خلال اليوم (من 10:00 ص إلى 10:00 م)');
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!dressId || !variantId) { router.push('/products'); return; }
    fetch(`/api/products/${dressId}`)
      .then(r => r.json()).then(setDress)
      .catch(() => router.push('/products'))
      .finally(() => setLoading(false));
  }, [dressId, variantId, router]);

  if (loading || !dress) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '120px' }}>
      <div className="spinner" />
    </div>
  );

  const selectedVariant = dress.variants.find(v => v.id === Number(variantId));
  if (!selectedVariant) { router.push('/products'); return null; }

  const deliveryCost = deliveryType === 'express' ? (formData.city !== 'عمان' ? 5 : 3) : 3;
  const total = dress.price + deliveryCost;

  const allImgs = selectedVariant.images.map(i => i.url);
  const realMedia = allImgs.filter(u => u !== '/uploads/dress1.jpg');
  const variantImage = realMedia[0] || allImgs[0] || '/uploads/dress1.jpg';
  const isVid = variantImage.endsWith('.mp4') || variantImage.endsWith('.webm');

  const set = (key: string, val: string) => setFormData(p => ({ ...p, [key]: val }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.fullName.trim()) e.fullName = 'الاسم مطلوب';
    if (!formData.phone.trim()) e.phone = 'رقم الهاتف مطلوب';
    else if (!/^07[0-9]{8}$/.test(formData.phone)) e.phone = 'يجب أن يبدأ بـ 07 ويكون 10 أرقام';
    if (!formData.instagram.trim()) e.instagram = 'حساب الانستقرام مطلوب للتحقق';
    if (!formData.address.trim()) e.address = 'المنطقة أو أقرب معلم مطلوب';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (!agreedToPolicy) { alert('يرجى الموافقة على الشروط والسياسات أولاً'); return; }
    setIsSubmitting(true);
    try {
      const insta = formData.instagram.startsWith('@') ? formData.instagram : `@${formData.instagram}`;
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          instagram: insta,
          notes: [
            `📸 انستقرام: ${insta}`,
            deliveryType === 'express' ? '⚡ شحن فوري (بدون معاينة)' : '🚚 شحن عادي (مع معاينة)',
            formData.city === 'عمان' ? `⏰ وقت: ${preferredTimeSlot}` : 'ℹ️ توصيل محافظات',
            formData.notes
          ].filter(Boolean).join(' | '),
          items: [{ dressId: dress.id, variantId: selectedVariant.id, quantity: 1, price: dress.price }],
        }),
      });
      const data = await res.json();
      if (res.ok) router.push(`/order-success?orderId=${data.id}`);
      else alert(data.error || 'حدث خطأ، حاولي مرة أخرى');
    } catch { alert('حدث خطأ في الاتصال'); }
    finally { setIsSubmitting(false); }
  };

  const jordanGovernorates = ['عمان','إربد','الزرقاء','المفرق','عجلون','جرش','مأدبا','البلقاء','الكرك','الطفيلة','معان','العقبة'];

  return (
    <section style={{ padding: '24px 0 100px' }}>
      <div className="container" style={{ maxWidth: '960px' }}>

        {/* Breadcrumb */}
        <div style={{ marginBottom: '20px', fontSize: '13px' }}>
          <Link href="/" style={{ color: '#6B7280' }}>الرئيسية</Link>
          <span style={{ margin: '0 6px', color: '#D1D5DB' }}>/</span>
          <Link href="/products" style={{ color: '#6B7280' }}>الفساتين</Link>
          <span style={{ margin: '0 6px', color: '#D1D5DB' }}>/</span>
          <span style={{ color: '#722F37', fontWeight: 800 }}>إتمام الطلب</span>
        </div>

        {/* Order Summary Banner (mobile-first, shows at top) */}
        <div style={{
          background: '#fff',
          border: '1px solid rgba(212,175,55,0.25)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}>
          <div style={{ width: '70px', height: '90px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, background: '#000' }}>
            {isVid
              ? <video src={variantImage} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <img src={variantImage} alt={dress.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: '15px', color: '#111827', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dress.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: selectedVariant.colorHex, display: 'inline-block', border: '1px solid rgba(0,0,0,0.15)' }} />
              <span>{selectedVariant.color}</span>
              <span>•</span>
              <span style={{ background: '#F3F4F6', padding: '1px 8px', borderRadius: '6px', fontWeight: 700 }}>مقاس {selectedVariant.size}</span>
            </div>
            <div style={{ fontWeight: 900, color: '#722F37', fontSize: '18px' }}>
              {total} <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600 }}>د.أ شامل التوصيل</span>
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <div style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 20px rgba(0,0,0,0.05)' }}>

          {/* Form Header */}
          <div style={{ background: 'linear-gradient(135deg, #1C0A10, #2D0F1A)', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🛍️</span>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: '16px' }}>معلومات التوصيل والدفع</span>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Row 1: Name + Phone */}
            <div className="checkout-row-2">
              <Field label="الاسم الكامل *" error={errors.fullName}>
                <input style={{ ...inputStyle, borderColor: errors.fullName ? '#EF4444' : '#E5E7EB' }}
                  type="text" value={formData.fullName} onChange={e => set('fullName', e.target.value)}
                  placeholder="مثال: سارة أحمد" />
              </Field>
              <Field label="رقم الهاتف *" error={errors.phone}>
                <input style={{ ...inputStyle, borderColor: errors.phone ? '#EF4444' : '#E5E7EB' }}
                  type="tel" value={formData.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="07XXXXXXXX" dir="ltr" />
              </Field>
            </div>

            {/* Row 2: Instagram + City */}
            <div className="checkout-row-2">
              <Field label="حساب الانستقرام * (للتأكيد)" error={errors.instagram}>
                <input style={{ ...inputStyle, borderColor: errors.instagram ? '#EF4444' : '#E5E7EB' }}
                  type="text" value={formData.instagram} onChange={e => {
                    // Strip @ if user types it
                    const val = e.target.value.replace(/^@+/, '');
                    set('instagram', val);
                  }}
                  placeholder="your.username" dir="ltr" />
                <span style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px', display: 'block' }}>
                  📩 سيتم تأكيد طلبك عبر الانستقرام
                </span>
              </Field>
              <Field label="المحافظة *">
                <select value={formData.city} onChange={e => set('city', e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  {jordanGovernorates.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>
            </div>

            {/* Address */}
            <Field label="المنطقة أو أقرب معلم *" error={errors.address}>
              <input style={{ ...inputStyle, borderColor: errors.address ? '#EF4444' : '#E5E7EB' }}
                type="text" value={formData.address} onChange={e => set('address', e.target.value)}
                placeholder="مثال: خلدا - قرب سيتي مول" />
            </Field>

            {/* Delivery Type */}
            <div>
              <label style={labelStyle}>نوع التوصيل *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Standard */}
                <div onClick={() => setDeliveryType('standard')} style={{
                  border: deliveryType === 'standard' ? '2.5px solid #722F37' : '1.5px solid #E5E7EB',
                  background: deliveryType === 'standard' ? '#FDF8F8' : '#fff',
                  borderRadius: '14px', padding: '14px 12px', cursor: 'pointer', transition: 'all 0.2s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <input type="radio" checked={deliveryType === 'standard'} onChange={() => setDeliveryType('standard')} style={{ accentColor: '#722F37', width: 16, height: 16 }} />
                    <span style={{ fontWeight: 900, fontSize: '14px', color: '#111827' }}>🚚 عادي — 3 د.أ</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700, paddingRight: '24px' }}>✓ معاينة وتجربة قبل الدفع</div>
                  <div style={{ fontSize: '11px', color: '#6B7280', paddingRight: '24px', marginTop: '2px' }}>{calculateDeliveryEstimate().fullFormatted}</div>
                </div>
                {/* Express */}
                <div onClick={() => setDeliveryType('express')} style={{
                  border: deliveryType === 'express' ? '2.5px solid #722F37' : '1.5px solid #E5E7EB',
                  background: deliveryType === 'express' ? '#FDF8F8' : '#fff',
                  borderRadius: '14px', padding: '14px 12px', cursor: 'pointer', transition: 'all 0.2s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <input type="radio" checked={deliveryType === 'express'} onChange={() => setDeliveryType('express')} style={{ accentColor: '#722F37', width: 16, height: 16 }} />
                    <span style={{ fontWeight: 900, fontSize: '14px', color: '#111827' }}>⚡ فوري — {formData.city !== 'عمان' ? '5' : '3'} د.أ</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#DC2626', fontWeight: 700, paddingRight: '24px' }}>✗ بدون معاينة (مستعجل)</div>
                  <div style={{ fontSize: '11px', color: '#6B7280', paddingRight: '24px', marginTop: '2px' }}>{calculateExpressDeliveryEstimate().fullFormatted}</div>
                </div>
              </div>
            </div>

            {/* Time Slot (Amman only) */}
            {formData.city === 'عمان' && deliveryType === 'standard' && (
              <Field label="⏰ وقت التوصيل المفضل (اختياري)">
                <select value={preferredTimeSlot} onChange={e => setPreferredTimeSlot(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer', direction: 'rtl', fontSize: '13px' }}>
                  <option value="أي وقت — 10ص حتى 10م">أي وقت — 10ص حتى 10م</option>
                  <option value="الفترة الصباحية — 10ص حتى 5م">الفترة الصباحية — 10ص حتى 5م</option>
                  <option value="الفترة المسائية — 6م حتى 10م">الفترة المسائية — 6م حتى 10م</option>
                </select>
              </Field>
            )}


            {formData.city !== 'عمان' && (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '12px 14px', borderRadius: '12px', fontSize: '12px', color: '#92400E', fontWeight: 700 }}>
                ℹ️ التوصيل للمحافظات: الشفت الصباحي فقط (10 ص – 5 م)
              </div>
            )}

            {/* Notes */}
            <Field label="ملاحظات للمندوب (اختياري)">
              <textarea rows={2} value={formData.notes} onChange={e => set('notes', e.target.value)}
                placeholder="أي تعليمات إضافية..."
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
            </Field>

            {/* Policy Checkbox */}
            <div style={{
              background: '#FFFBEB', border: '1.5px solid #FDE68A',
              borderRadius: '14px', padding: '14px 16px',
              display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer'
            }} onClick={() => setAgreedToPolicy(!agreedToPolicy)}>
              <div style={{
                width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0, marginTop: '1px',
                background: agreedToPolicy ? '#722F37' : '#fff',
                border: agreedToPolicy ? '2px solid #722F37' : '2px solid #D1D5DB',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
              }}>
                {agreedToPolicy && <span style={{ color: '#fff', fontSize: '13px', fontWeight: 900 }}>✓</span>}
              </div>
              <p style={{ fontSize: '13px', color: '#374151', fontWeight: 700, lineHeight: 1.6, margin: 0 }}>
                أوافق على{' '}
                <a href="/policies" target="_blank" onClick={e => e.stopPropagation()}
                  style={{ color: '#722F37', fontWeight: 900, textDecoration: 'underline' }}>
                  الشروط وسياسة التوصيل والإرجاع
                </a>
                {' '}الخاصة ببوتيك ريفا
              </p>
            </div>

            {/* Price Summary */}
            <div style={{ background: '#FAF7F2', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '14px', padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>
                <span>سعر الفستان</span><span style={{ fontWeight: 800 }}>{dress.price} د.أ</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6B7280', marginBottom: '10px' }}>
                <span>رسوم التوصيل</span><span style={{ fontWeight: 800 }}>{deliveryCost} د.أ</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 900, color: '#722F37', borderTop: '1.5px solid rgba(212,175,55,0.25)', paddingTop: '10px' }}>
                <span>الإجمالي</span><span>{total} د.أ</span>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={isSubmitting || !agreedToPolicy}
              style={{
                width: '100%', padding: '16px', borderRadius: '14px',
                background: (!agreedToPolicy || isSubmitting) ? '#D1D5DB' : 'linear-gradient(135deg, #722F37, #8B1A1A)',
                color: '#fff', fontSize: '16px', fontWeight: 900,
                border: 'none', cursor: (!agreedToPolicy || isSubmitting) ? 'not-allowed' : 'pointer',
                boxShadow: (!agreedToPolicy || isSubmitting) ? 'none' : '0 6px 20px rgba(114,47,55,0.4)',
                transition: 'all 0.25s', letterSpacing: '0.3px'
              }}>
              {isSubmitting ? '⏳ جاري إرسال الطلب...' : agreedToPolicy ? '✨ تأكيد الطلب — الدفع عند الاستلام' : '☑️ وافقي على الشروط أولاً'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default function CheckoutPage() {
  return (
    <main style={{ background: 'var(--color-cream)', minHeight: '100vh' }}>
      <Navbar />
      <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><div className="spinner" /></div>}>
        <CheckoutContent />
      </Suspense>
      <Footer />
    </main>
  );
}
