'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileBottomBar from '@/components/MobileBottomBar';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { calculateDeliveryEstimate } from '@/lib/delivery';
import SizeCalculatorModal from '@/components/SizeCalculatorModal';
import ProductCardInsta from '@/components/ProductCardInsta';


interface Variant {
  id: number;
  color: string;
  colorHex: string;
  size: string;
  quantity: number;
  images: { id: number; url: string }[];
}

interface Dress {
  id: number;
  name: string;
  description: string;
  price: number;
  variants: Variant[];
}

interface ColorGroup {
  color: string;
  colorHex: string;
  images: string[];
  sizes: { variantId: number; size: string; quantity: number }[];
  isSoldOut: boolean;
}

export default function ProductDetailPage() {

  const params = useParams();
  const router = useRouter();
  const [dress, setDress] = useState<Dress | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showSizeCalc, setShowSizeCalc] = useState(false);
  const [stockUpdating, setStockUpdating] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── دالة تحديث الستوك بصمت (بدون spinner كامل) ─────────────────────
  const refreshStock = useCallback(() => {
    setStockUpdating(true);
    fetch(`/api/products/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          // نحدّث الكميات فقط — بدون إعادة رسم كامل للصفحة
          setDress(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              variants: prev.variants.map(v => {
                const updated = data.variants?.find((u: Variant) => u.id === v.id);
                return updated ? { ...v, quantity: updated.quantity } : v;
              }),
            };
          });
        }
      })
      .catch(() => {/* نتجاهل أخطاء الـ polling بصمت */})
      .finally(() => setStockUpdating(false));
  }, [params.id]);

  useEffect(() => {
    // ─── التحميل الأولي الكامل ────────────────────────────────────────────
    fetch(`/api/products/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setDress(data);
        if (data.variants && data.variants.length > 0) {
          setSelectedVariantId(data.variants[0].id);
        }
      })
      .catch(() => router.push('/products'))
      .finally(() => setLoading(false));

    // Fetch all products for Related Section
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRelatedProducts(data);
        }
      })
      .catch(console.error);

    // ─── Polling كل 30 ثانية لتحديث الستوك بصمت ─────────────────────────
    pollingRef.current = setInterval(refreshStock, 30_000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [params.id, router, refreshStock]);


  if (loading || !dress) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--color-cream)' }}>
        <Navbar />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
          <div className="spinner"></div>
        </div>
      </main>
    );
  }

  // Extract description from variant color if needed
  let fullDressDescription = dress.description || '';
  dress.variants.forEach(v => {
    if (!fullDressDescription && v.color && v.color.length > 15) {
      fullDressDescription = v.color;
    }
  });

  // Group variants by color
  const colorGroups: ColorGroup[] = [];
  dress.variants.forEach(v => {
    let rawColor = v.color || '';
    let cleanColor = rawColor;
    if (rawColor.length > 15) {
      if (v.colorHex === '#800020' || v.colorHex === '#722F37') cleanColor = 'خمري';
      else if (v.colorHex === '#000000') cleanColor = 'أسود';
      else if (v.colorHex === '#1E3A5F') cleanColor = 'كحلي';
      else if (v.colorHex === '#92400E') cleanColor = 'بني';
      else cleanColor = 'خمري';
    }
    let group = colorGroups.find(g => g.color === cleanColor);
    if (!group) {
      group = { color: cleanColor, colorHex: v.colorHex, images: [], sizes: [], isSoldOut: false };
      colorGroups.push(group);
    }
    v.images.forEach(img => {
      if (img.url && !group!.images.includes(img.url)) group!.images.push(img.url);
    });
    if (!v.size.includes('خالص') && !v.size.includes('نفذ')) {
      group.sizes.push({ variantId: v.id, size: v.size, quantity: v.quantity });
    }
  });

  colorGroups.forEach(g => {
    // ترتيب المقاسات تصاعدياً بدقة متناهية من الأصغر للأكبر (36 -> 38 -> 40 -> 42 -> 44 -> 46...)
    g.sizes.sort((a, b) => {
      const numA = parseInt(a.size.replace(/\D/g, ''), 10);
      const numB = parseInt(b.size.replace(/\D/g, ''), 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.size.localeCompare(b.size);
    });

    const totalQty = g.sizes.reduce((acc, curr) => acc + (curr.quantity > 0 ? curr.quantity : 0), 0);
    g.isSoldOut = g.sizes.length === 0 || totalQty === 0;
    const realMedia = g.images.filter((url: string) => url !== '/uploads/dress1.jpg');
    if (realMedia.length > 0) g.images = realMedia;

    // ترجيح الصور الثابتة أولاً ثم الفيديوهات لمنع بطء التصفح
    g.images.sort((a, b) => {
      const isVidA = a.includes('.mp4') || a.includes('.webm');
      const isVidB = b.includes('.mp4') || b.includes('.webm');
      if (isVidA && !isVidB) return 1;
      if (!isVidA && isVidB) return -1;
      return 0;
    });
  });

  const selectedColor = colorGroups[selectedColorIndex] || colorGroups[0];
  let activeMedia = selectedColor?.images[activeImageIndex];
  if (!activeMedia || activeMedia === '/uploads/dress1.jpg') {
    const anyRealMedia = colorGroups.flatMap(g => g.images).find(img => img && img !== '/uploads/dress1.jpg');
    activeMedia = anyRealMedia || '/uploads/dress_hero.jpg';
  }
  const isVideo = activeMedia?.includes('.mp4') || activeMedia?.includes('.webm');

  // تحديد المقاس الفعّال (يبدأ دائماً بأصغر مقاس متوفر 36)
  const currentSelectedSize = selectedColor?.sizes.find(s => s.variantId === selectedVariantId);
  const effectiveVariantId = currentSelectedSize?.variantId || selectedColor?.sizes.find(s => s.quantity > 0)?.variantId || selectedColor?.sizes[0]?.variantId;
  const selectedSizeInfo = selectedColor?.sizes.find(s => s.variantId === effectiveVariantId);
  const colorIsSoldOut = selectedColor?.isSoldOut || (selectedSizeInfo && selectedSizeInfo.quantity <= 0);

  const handleDirectOrder = () => {
    if (colorIsSoldOut) return;
    if (!effectiveVariantId) { alert('يرجى اختيار المقاس أولاً'); return; }
    router.push(`/checkout?dressId=${dress.id}&variantId=${effectiveVariantId}`);
  };

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-cream)' }}>
      <Navbar />

      {/* Breadcrumb */}
      <div style={{ padding: '12px 0' }}>
        <div className="container">
          <div className="breadcrumb" style={{ fontSize: '12px' }}>
            <Link href="/">الرئيسية</Link>
            <span className="breadcrumb-separator">/</span>
            <Link href="/products">الفساتين</Link>
            <span className="breadcrumb-separator">/</span>
            <span style={{ color: 'var(--color-burgundy)', fontWeight: 700, maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', verticalAlign: 'bottom' }}>
              {dress.name}
            </span>
          </div>
        </div>
      </div>

      <section className="container" style={{ margin: '0 auto 80px', maxWidth: '800px' }}>
        <div style={{
          background: '#fff',
          borderRadius: '24px',
          padding: 'clamp(16px, 4vw, 28px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
          border: '1px solid rgba(212,175,55,0.2)'
        }}>

          {/* ── 1. DRESS HEADER (NAME & PRICE) — ABOVE THE VIDEO! ── */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ color: 'var(--color-rose-gold)', fontSize: '11px', fontWeight: 900, letterSpacing: '1.5px' }}>
                  RIVA LUXURY DRESS
                </span>
                <h1 style={{ fontSize: 'clamp(20px, 4.5vw, 28px)', fontWeight: 900, margin: '4px 0 0', color: 'var(--color-dark)', lineHeight: 1.25 }}>
                  {dress.name}
                </h1>
              </div>

              <div style={{ fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 900, color: 'var(--color-burgundy)', whiteSpace: 'nowrap' }}>
                {dress.price} <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: 700 }}>د.أ</span>
              </div>
            </div>
          </div>

          {/* ── 2. VIDEO & PHOTO FRAME ── */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              width: '100%',
              borderRadius: '20px',
              overflow: 'hidden',
              background: '#0F172A',
              position: 'relative',
              aspectRatio: '3/4',
              maxHeight: '480px',
              margin: '0 auto'
            }}>
              {colorIsSoldOut && (
                <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, background: '#EF4444', color: '#fff', padding: '5px 12px', borderRadius: '20px', fontWeight: 800, fontSize: '12px' }}>
                  🔴 خالص
                </div>
              )}
              {isVideo
                ? <video key={activeMedia} src={activeMedia} controls autoPlay loop muted playsInline crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <img key={activeMedia} src={activeMedia} alt={dress.name} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              }
            </div>

            {selectedColor.images.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingTop: '10px', paddingBottom: '4px' }}>
                {selectedColor.images.map((img, idx) => {
                  const isThumbVideo = img.includes('.mp4') || img.includes('.webm');
                  return (
                    <button key={idx} onClick={() => setActiveImageIndex(idx)} style={{
                      width: '60px', height: '80px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0,
                      border: activeImageIndex === idx ? '3px solid var(--color-burgundy)' : '2px solid #E5E7EB',
                      cursor: 'pointer', background: '#000', padding: 0, position: 'relative'
                    }}>
                      {isThumbVideo ? (
                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', background: 'linear-gradient(135deg, #1C0A10, #722F37)' }}>
                          <span style={{ fontSize: '18px' }}>▶️</span>
                          <span style={{ fontSize: '9px', marginTop: '2px', fontWeight: 800 }}>فيديو</span>
                        </div>
                      ) : (
                        <img src={img} alt="" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── 3. COLOR PICKER (RIGHT UNDER VIDEO!) ── */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '10px', color: '#111827', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>اللون المختار: <strong style={{ color: 'var(--color-burgundy)' }}>{selectedColor.color}</strong></span>
              {selectedColor.isSoldOut && <span style={{ color: '#EF4444', fontSize: '11px', fontWeight: 800 }}>⚠️ هذا اللون خالص</span>}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {colorGroups.map((group, idx) => (
                <button key={idx}
                  onClick={() => { setSelectedColorIndex(idx); setActiveImageIndex(0); if (group.sizes[0]) setSelectedVariantId(group.sizes[0].variantId); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '7px',
                    padding: '8px 14px', borderRadius: '30px',
                    border: selectedColorIndex === idx ? '2.5px solid var(--color-burgundy)' : '1.5px solid #D1D5DB',
                    background: selectedColorIndex === idx ? '#FDF2F2' : '#fff',
                    cursor: 'pointer', fontWeight: 700, fontSize: '13px',
                    opacity: group.isSoldOut ? 0.55 : 1,
                    boxShadow: selectedColorIndex === idx ? '0 2px 10px rgba(114,47,55,0.2)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ width: '13px', height: '13px', borderRadius: '50%', background: group.colorHex, border: '1px solid rgba(0,0,0,0.15)', flexShrink: 0 }} />
                  <span>{group.color}</span>
                  {group.isSoldOut && <span style={{ fontSize: '10px' }}>🔴</span>}
                </button>
              ))}
            </div>
          </div>

          {/* ── 4. SIZE PICKER (RIGHT UNDER COLORS!) ── */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '10px', color: '#111827', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>المقاس المتوفر:</span>
              <button onClick={() => setShowSizeCalc(true)} style={{
                background: '#FAF7F2', border: '1px solid rgba(212,175,55,0.4)', color: '#722F37',
                fontSize: '11px', fontWeight: 800, padding: '5px 12px', borderRadius: '10px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}>
                📏 معرفة مقاسك
              </button>
            </div>

            {selectedColor.isSoldOut ? (
              <div style={{ padding: '14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '12px', color: '#991B1B', fontWeight: 700, fontSize: '13px', textAlign: 'center' }}>
                ❌ نفذت كافة المقاسات لهذا اللون
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {selectedColor.sizes.map(sizeInfo => {
                  const isSelected = effectiveVariantId === sizeInfo.variantId;
                  const isSoldOut = sizeInfo.quantity === 0;
                  return (
                    <button key={sizeInfo.variantId}
                      disabled={isSoldOut}
                      onClick={() => setSelectedVariantId(sizeInfo.variantId)}
                      style={{
                        minWidth: '56px', padding: '10px 16px', borderRadius: '50px',
                        border: isSelected ? '2.5px solid var(--color-burgundy)' : isSoldOut ? '1.5px dashed #D1D5DB' : '1.5px solid #D1D5DB',
                        background: isSelected ? 'var(--color-burgundy)' : isSoldOut ? '#F9FAFB' : '#fff',
                        color: isSelected ? '#fff' : isSoldOut ? '#9CA3AF' : '#111827',
                        fontWeight: isSelected ? 900 : 600, fontSize: '14px',
                        cursor: isSoldOut ? 'not-allowed' : 'pointer',
                        boxShadow: isSelected ? '0 4px 14px rgba(114,47,55,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s', textDecoration: isSoldOut ? 'line-through' : 'none',
                      }}
                    >
                      {sizeInfo.size}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── 5. ORDER BUTTON ── */}
          <div className="product-order-cta" style={{ marginBottom: '20px' }}>
            <button
              onClick={handleDirectOrder}
              disabled={!!colorIsSoldOut}
              style={{
                width: '100%', padding: '16px', borderRadius: '16px',
                background: colorIsSoldOut ? '#9CA3AF' : 'var(--color-burgundy)',
                color: '#fff', fontSize: '16px', fontWeight: 900,
                border: 'none', cursor: colorIsSoldOut ? 'not-allowed' : 'pointer',
                boxShadow: colorIsSoldOut ? 'none' : '0 6px 20px rgba(114,47,55,0.4)',
                transition: 'all 0.2s', letterSpacing: '0.3px'
              }}
            >
              {colorIsSoldOut ? '❌ هذا اللون خالص' : '🛒 اطلبي الآن — الدفع عند الاستلام'}
            </button>
          </div>

          {/* ── 6. DELIVERY BANNER & DESCRIPTION (PLACED BELOW CTA) ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', padding: '11px 14px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>🚚</span>
              <div>
                <div style={{ fontWeight: 900, color: '#166534', fontSize: '13px' }}>{calculateDeliveryEstimate().fullFormatted} ⚡</div>
                <div style={{ fontSize: '11px', color: '#15803D', marginTop: '1px', fontWeight: 700 }}>🔍 معاينة وتجربة عند الاستلام قبل الدفع</div>
              </div>
            </div>

            {fullDressDescription && (
              <div style={{ background: '#FAF7F2', border: '1px solid rgba(212,175,55,0.25)', padding: '12px 14px', borderRadius: '14px', fontSize: '13px', color: '#374151', lineHeight: 1.7 }}>
                <div style={{ fontWeight: 800, color: '#722F37', marginBottom: '4px', fontSize: '11px' }}>📝 تفاصيل الفستان:</div>
                {fullDressDescription}
              </div>
            )}
          </div>

        </div>
      </section>

        {/* ── RELATED DRESSES SECTION ── */}


        {relatedProducts.filter(p => Number(p.id) !== dress.id).length > 0 && (
          <div style={{ marginTop: '64px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
              borderBottom: '2px solid rgba(212,175,55,0.2)',
              paddingBottom: '14px'
            }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-rose-gold)', letterSpacing: '2px' }}>RECOMMENDED FOR YOU</span>
                <h2 style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 900, color: '#111827', margin: '4px 0 0', fontFamily: 'Playfair Display, serif' }}>
                  فساتين قد تعجبك ✨
                </h2>
              </div>
              <Link href="/products" style={{
                color: 'var(--color-burgundy)',
                fontSize: '13px',
                fontWeight: 800,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                عرض الكل ←
              </Link>
            </div>

            <div className="products-grid-insta">
              {relatedProducts
                .filter(p => Number(p.id) !== dress.id)
                .slice(0, 4)
                .map(relDress => (
                  <ProductCardInsta key={relDress.id} product={relDress} />
                ))}
            </div>
          </div>
        )}

        {showSizeCalc && (
          <SizeCalculatorModal
            onClose={() => setShowSizeCalc(false)}
            onSelectSize={(calcSize) => {
              const matched = selectedColor.sizes.find(s => s.size === calcSize || s.size.includes(calcSize));
              if (matched) setSelectedVariantId(matched.variantId);
            }}
          />
        )}
      </section>

      <Footer />
      <MobileBottomBar />
    </main>
  );

}
