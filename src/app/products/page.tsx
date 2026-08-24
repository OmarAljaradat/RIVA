'use client';

import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCardInsta from '@/components/ProductCardInsta';
import QuickViewModal from '@/components/QuickViewModal';
import SizeCalculatorModal from '@/components/SizeCalculatorModal';
import MobileBottomBar from '@/components/MobileBottomBar';
import Link from 'next/link';

const AVAILABLE_SIZES = ['الكل', '36', '38', '40', '42', '44', '46', '48'];

const AVAILABLE_COLORS = [
  { name: 'الكل', label: 'كل الألوان', hex: 'transparent', emoji: '🌈' },
  { name: 'خمري', label: 'خمري', hex: '#722F37', emoji: '🍷' },
  { name: 'اسود', label: 'أسود', hex: '#000000', emoji: '🖤' },
  { name: 'بيبي بلو', label: 'بيبي بلو', hex: '#7DD3FC', emoji: '🩵' },
  { name: 'زهري', label: 'زهري', hex: '#F472B6', emoji: '🩷' },
  { name: 'كحلي', label: 'كحلي', hex: '#1E3A5F', emoji: '💙' },
  { name: 'اصفر', label: 'أصفر', hex: '#FBBF24', emoji: '💛' },
  { name: 'بني', label: 'بني', hex: '#92400E', emoji: '🤎' },
  { name: 'فستقي', label: 'فستقي', hex: '#84CC16', emoji: '💚' },
  { name: 'سومو', label: 'سومو', hex: '#FB923C', emoji: '🌸' },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickViewId, setQuickViewId] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState('الكل');
  const [selectedColor, setSelectedColor] = useState('الكل');
  const [showSizeCalc, setShowSizeCalc] = useState(false);

  useEffect(() => {
    fetch('/api/products?t=' + Date.now(), { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Normalize color helper
  const normalizeColorName = (col: string) => {
    if (!col) return '';
    const clean = col.trim();
    if (clean.includes('اسود') || clean.includes('أسود')) return 'اسود';
    if (clean.includes('خمري') || clean.includes('مارون') || clean.includes('عنابي')) return 'خمري';
    if (clean.includes('بيبي بلو') || clean.includes('سماوي')) return 'بيبي بلو';
    if (clean.includes('زهري') || clean.includes('وردي') || clean.includes('بينك')) return 'زهري';
    if (clean.includes('كحلي') || clean.includes('ازرق') || clean.includes('أزرق')) return 'كحلي';
    if (clean.includes('اصفر') || clean.includes('أصفر') || clean.includes('خردلي')) return 'اصفر';
    if (clean.includes('بني') || clean.includes('شوكولا') || clean.includes('هافان')) return 'بني';
    if (clean.includes('فستقي') || clean.includes('زيتي') || clean.includes('اخضر') || clean.includes('أخضر')) return 'فستقي';
    if (clean.includes('سومو') || clean.includes('مشمشي') || clean.includes('بيتش')) return 'سومو';
    return clean;
  };

  // Filtered Products Memo
  const filteredProducts = useMemo(() => {
    return products.filter(dress => {
      if (!dress.variants || !Array.isArray(dress.variants)) return false;

      // 1. Size filter
      const matchesSize = selectedSize === 'الكل' || dress.variants.some((v: any) => {
        return v.size?.trim() === selectedSize && v.quantity > 0;
      });

      if (!matchesSize) return false;

      // 2. Color filter
      const matchesColor = selectedColor === 'الكل' || dress.variants.some((v: any) => {
        const norm = normalizeColorName(v.color);
        const normSelected = normalizeColorName(selectedColor);
        return norm === normSelected && (selectedSize === 'الكل' || (v.size?.trim() === selectedSize && v.quantity > 0));
      });

      return matchesColor;
    });
  }, [products, selectedSize, selectedColor]);

  const hasActiveFilters = selectedSize !== 'الكل' || selectedColor !== 'الكل';

  const handleResetFilters = () => {
    setSelectedSize('الكل');
    setSelectedColor('الكل');
  };

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-cream)' }}>
      <Navbar />

      {/* Luxury Catalog Header */}
      <div style={{ background: 'linear-gradient(135deg, #1C0A10 0%, #2D0F1A 100%)', color: '#fff', padding: '52px 0 36px', borderBottom: '1px solid rgba(212, 175, 55, 0.2)' }}>
        <div className="container">
          <div className="breadcrumb" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
            <Link href="/" style={{ color: '#fff' }}>الرئيسية</Link>
            <span className="breadcrumb-separator">/</span>
            <span style={{ color: 'var(--color-gold)', fontWeight: 700 }}>كتالوج الفساتين</span>
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: 900, marginTop: '12px', fontFamily: "'Thmanyah Sans', sans-serif" }}>
            تشكيلة فساتين RIVA الملكية 👗
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px', marginTop: '6px' }}>
            تصفحي أحدث الموديلات الراقية المصممة بأعلى معايير الجودة والأناقة • معاينة وتجربة عند الاستلام
          </p>
        </div>
      </div>

      {/* ── LUXURY DUAL FILTER SECTION (SIZE + COLOR) ── */}
      <section className="container" style={{ marginTop: '24px' }}>
        <div style={{
          background: '#fff',
          padding: '20px 24px',
          borderRadius: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>

          {/* 1. COLOR FILTER ROW */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ minWidth: '130px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 900, color: '#722F37' }}>
              <span>🎨 التصفية باللون:</span>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1, alignItems: 'center' }}>
              {AVAILABLE_COLORS.map(c => {
                const isActive = selectedColor === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColor(c.name)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      padding: '6px 14px',
                      borderRadius: '30px',
                      border: isActive ? '2px solid #722F37' : '1px solid #E2E8F0',
                      background: isActive ? '#FFF1F2' : '#FFFFFF',
                      color: isActive ? '#722F37' : '#334155',
                      fontSize: '13px',
                      fontWeight: isActive ? 900 : 700,
                      cursor: 'pointer',
                      boxShadow: isActive ? '0 2px 8px rgba(114,47,55,0.18)' : 'none',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    {c.hex !== 'transparent' && (
                      <span style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: c.hex,
                        border: '1px solid rgba(0,0,0,0.15)',
                        flexShrink: 0,
                      }} />
                    )}
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ height: '1px', background: '#F1F5F9', margin: '2px 0' }} />

          {/* 2. SIZE FILTER ROW */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
              <div style={{ minWidth: '130px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 900, color: '#722F37' }}>
                <span>📏 التصفية بالمقاس:</span>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {AVAILABLE_SIZES.map(size => {
                  const isActive = selectedSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      style={{
                        padding: '6px 16px',
                        borderRadius: '14px',
                        border: isActive ? '2px solid #722F37' : '1px solid #E2E8F0',
                        background: isActive ? 'linear-gradient(135deg, #722F37 0%, #4A1C22 100%)' : '#fff',
                        color: isActive ? '#fff' : '#334155',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                        boxShadow: isActive ? '0 3px 10px rgba(114, 47, 55, 0.25)' : 'none',
                      }}
                    >
                      {size === 'الكل' ? 'كل المقاسات ✨' : `مقاس ${size}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size Calculator Button Trigger */}
            <button 
              onClick={() => setShowSizeCalc(true)}
              style={{
                background: 'linear-gradient(135deg, #FFFDF9 0%, #FAF7F2 100%)',
                border: '1px solid rgba(212, 175, 55, 0.45)',
                color: '#722F37',
                fontSize: '12px',
                fontWeight: 800,
                padding: '8px 16px',
                borderRadius: '14px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <span>📏</span>
              <span>معرفة مقاسك المثالي ✨</span>
            </button>
          </div>

          {/* 3. ACTIVE FILTER SUMMARY & RESET BAR */}
          {hasActiveFilters && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#FFF7ED',
              border: '1px solid #FED7AA',
              padding: '10px 16px',
              borderRadius: '14px',
              fontSize: '13px',
              color: '#9A3412',
              fontWeight: 800,
              flexWrap: 'wrap',
              gap: '10px',
              marginTop: '4px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>✨ نتائج التصفية:</span>
                <span style={{ background: '#722F37', color: '#fff', padding: '2px 10px', borderRadius: '10px', fontSize: '12px' }}>
                  {filteredProducts.length} فستان متوفر
                </span>
                {selectedColor !== 'الكل' && <span>• اللون: <strong>{selectedColor}</strong></span>}
                {selectedSize !== 'الكل' && <span>• المقاس: <strong>{selectedSize}</strong></span>}
              </div>

              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  background: '#fff',
                  border: '1px solid #EA580C',
                  color: '#EA580C',
                  padding: '4px 12px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                ✕ مسح التصفية وعرض الكل
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Catalog Grid */}
      <section className="container" style={{ margin: '28px auto 60px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
            <div className="spinner"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{
            background: '#fff',
            padding: '48px 24px',
            borderRadius: '24px',
            textAlign: 'center',
            border: '1px solid #E5E7EB',
            maxWidth: '540px',
            margin: '40px auto',
          }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>👗✨</span>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#722F37', margin: '0 0 8px' }}>
              لم نجد فستاناً يطابق هذا اللون والمقاس معاً
            </h3>
            <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '20px' }}>
              جربي تغيير اللون أو المقاس، أو تصفحي كامل تشكيلتنا الفاخرة المتاحة!
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                background: 'var(--color-burgundy)',
                color: '#fff',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '16px',
                fontWeight: 900,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(114,47,55,0.3)',
              }}
            >
              عرض كافة الفساتين ✨
            </button>
          </div>
        ) : (
          <div className="products-grid-insta">
            {filteredProducts.map(dress => (
              <ProductCardInsta 
                key={dress.id} 
                product={dress} 
                onQuickView={(id) => setQuickViewId(id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Quick View Modal */}
      <QuickViewModal 
        productId={quickViewId} 
        onClose={() => setQuickViewId(null)} 
      />

      {/* Standalone Size Calculator Modal Trigger */}
      {showSizeCalc && (
        <SizeCalculatorModal 
          onClose={() => setShowSizeCalc(false)}
          onSelectSize={(s) => {
            setSelectedSize(s);
            setShowSizeCalc(false);
          }}
        />
      )}

      <Footer />
      <MobileBottomBar />
    </main>
  );
}
