'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { calculateDeliveryEstimate } from '@/lib/delivery';
import SizeCalculatorModal from '@/components/SizeCalculatorModal';

interface QuickViewProps {
  productId: string | null;
  onClose: () => void;
}

export default function QuickViewModal({ productId, onClose }: QuickViewProps) {
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [showSizeCalc, setShowSizeCalc] = useState(false);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    fetch(`/api/products/${productId}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data);
        if (data.variants && data.variants.length > 0) {
          setSelectedVariantId(data.variants[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [productId]);

  if (!productId) return null;

  // Group variants by color
  const colorGroups: any[] = [];
  if (product?.variants) {
    product.variants.forEach((v: any) => {
      let group = colorGroups.find(g => g.color === v.color);
      if (!group) {
        group = { color: v.color, colorHex: v.colorHex, images: [], sizes: [], isSoldOut: false };
        colorGroups.push(group);
      }
      v.images?.forEach((img: any) => {
        if (img.url && !group.images.includes(img.url)) group.images.push(img.url);
      });
      group.sizes.push({ variantId: v.id, size: v.size, quantity: v.quantity });
    });
  }

  // Calculate sold out status per color & clean downloaded media
  colorGroups.forEach(g => {
    const totalQty = g.sizes.reduce((acc: number, curr: any) => acc + curr.quantity, 0);
    g.isSoldOut = totalQty === 0 || g.sizes.some((s: any) => s.size.includes('خالص') || s.size.includes('نفذت'));

    const realMedia = g.images.filter((url: string) => url !== '/uploads/dress1.jpg');
    if (realMedia.length > 0) {
      g.images = realMedia;
    }
  });

  const activeColorGroup = colorGroups[selectedColorIdx] || colorGroups[0];
  const activeMedia = activeColorGroup?.images[0] || '/uploads/dress1.jpg';
  const isVideo = activeMedia?.endsWith('.mp4') || activeMedia?.endsWith('.webm');
  const isSoldOut = activeColorGroup?.isSoldOut;

  const handleOrder = () => {
    if (isSoldOut || !selectedVariantId) return;
    router.push(`/checkout?dressId=${product.id}&variantId=${selectedVariantId}`);
    onClose();
  };

              {/* Order Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                  onClick={handleOrder} 
                  disabled={isSoldOut}
                  className="btn-luxe btn-luxe-primary" 
                  style={{ width: '100%', padding: '14px', fontSize: '15px', opacity: isSoldOut ? 0.5 : 1, cursor: isSoldOut ? 'not-allowed' : 'pointer' }}
                >
                  {isSoldOut ? '❌ هذا اللون خالص' : '🛒 اطلبي الآن (الدفع عند الاستلام)'}
                </button>
              </div>

  return (
    <div className="modal-overlay-insta" onClick={onClose}>
      <div className="modal-content-luxe" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        {loading || !product ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            {/* Media Preview (Photo or Video) */}
            <div style={{ borderRadius: '16px', overflow: 'hidden', height: '420px', background: 'var(--color-gray-100)', position: 'relative' }}>
              {isSoldOut && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  zIndex: 10,
                  background: '#EF4444',
                  color: '#fff',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontWeight: 800,
                  fontSize: '12px'
                }}>
                  🔴 خالص (نفذت الكمية)
                </div>
              )}

              {isVideo ? (
                <video 
                  src={activeMedia} 
                  controls 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <img src={activeMedia} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>

            {/* Product Details */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span style={{ color: 'var(--color-rose-gold)', fontSize: '12px', fontWeight: 800 }}>RIVA BOUTIQUE</span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', marginBottom: '8px' }}>{product.name}</h2>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-burgundy)', marginBottom: '16px' }}>
                  {product.price} <span style={{ fontSize: '14px', color: 'var(--color-gray-500)' }}>د.أ</span>
                </div>

                <p style={{ color: 'var(--color-gray-500)', fontSize: '14px', lineHeight: 1.6, marginBottom: '16px' }}>
                  {product.description || 'فستان سهرة أنيق من تشكيلة ريفا الفاخرة.'}
                </p>

                {/* Delivery Estimate */}
                <div style={{ background: '#FAF7F2', border: '1px solid rgba(212, 175, 55, 0.3)', padding: '10px 14px', borderRadius: '12px', marginBottom: '20px', fontSize: '13px', color: '#722F37', fontWeight: 800 }}>
                  🚚 {calculateDeliveryEstimate().fullFormatted} عند الطلب الآن!
                </div>

                {/* Colors */}
                {colorGroups.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>اللون المختار: <strong style={{ color: 'var(--color-burgundy)' }}>{activeColorGroup.color}</strong></div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {colorGroups.map((g, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedColorIdx(idx);
                            if (g.sizes[0]) setSelectedVariantId(g.sizes[0].variantId);
                          }}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '16px',
                            backgroundColor: selectedColorIdx === idx ? 'var(--color-cream-dark)' : '#fff',
                            border: selectedColorIdx === idx ? '2px solid var(--color-burgundy)' : '1px solid #ccc',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            opacity: g.isSoldOut ? 0.5 : 1,
                            textDecoration: g.isSoldOut ? 'line-through' : 'none'
                          }}
                        >
                          <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: g.colorHex, border: '1px solid rgba(0,0,0,0.2)' }} />
                          <span>{g.color}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sizes */}
                {activeColorGroup && (
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>المقاسات:</span>
                      <button 
                        onClick={() => setShowSizeCalc(true)}
                        style={{
                          background: 'linear-gradient(135deg, #FFFDF9 0%, #FAF7F2 100%)',
                          border: '1px solid rgba(212, 175, 55, 0.45)',
                          color: '#722F37',
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '4px 12px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                        }}
                      >
                        <span>📏</span>
                        <span>معرفة مقاسك المثالي ✨</span>
                      </button>
                    </div>
                    {isSoldOut ? (
                      <div style={{ color: '#EF4444', fontWeight: 700, fontSize: '13px' }}>
                        ❌ نفذت المقاسات لهذا اللون (خالص)
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {activeColorGroup.sizes.map((s: any) => (
                          <button
                            key={s.variantId}
                            disabled={s.quantity === 0}
                            onClick={() => setSelectedVariantId(s.variantId)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '8px',
                              border: selectedVariantId === s.variantId ? '2px solid var(--color-burgundy)' : '1px solid var(--color-gray-300)',
                              background: selectedVariantId === s.variantId ? 'var(--color-burgundy)' : '#fff',
                              color: selectedVariantId === s.variantId ? '#fff' : 'var(--color-dark)',
                              fontWeight: 700,
                              fontSize: '13px',
                              cursor: s.quantity === 0 ? 'not-allowed' : 'pointer',
                              opacity: s.quantity === 0 ? 0.4 : 1
                            }}
                          >
                            {s.size}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Order Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                  onClick={handleOrder} 
                  disabled={isSoldOut}
                  className="btn-luxe btn-luxe-primary" 
                  style={{ width: '100%', padding: '14px', fontSize: '15px', opacity: isSoldOut ? 0.5 : 1, cursor: isSoldOut ? 'not-allowed' : 'pointer' }}
                >
                  {isSoldOut ? '❌ هذا اللون خالص' : '🛒 اطلبي الآن (الدفع عند الاستلام)'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showSizeCalc && (
        <SizeCalculatorModal 
          onClose={() => setShowSizeCalc(false)}
          onSelectSize={(calcSize) => {
            if (activeColorGroup) {
              const matched = activeColorGroup.sizes.find((s: any) => s.size === calcSize || s.size.includes(calcSize));
              if (matched) {
                setSelectedVariantId(matched.variantId);
              }
            }
          }}
        />
      )}
    </div>
  );
}
