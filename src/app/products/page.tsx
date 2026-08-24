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

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickViewId, setQuickViewId] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState('الكل');
  const [showSizeCalc, setShowSizeCalc] = useState(false);

  useEffect(() => {
    fetch('/api/products?t=' + Date.now(), { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Filtered Products by Size
  const filteredProducts = useMemo(() => {
    if (selectedSize === 'الكل') return products;
    return products.filter(dress => {
      if (!dress.variants || !Array.isArray(dress.variants)) return false;
      return dress.variants.some((v: any) => v.size?.trim() === selectedSize && v.quantity > 0);
    });
  }, [products, selectedSize]);

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

      {/* ── CLEAN & LUXURY SIZE SELECTOR BAR ── */}
      <section className="container" style={{ marginTop: '24px' }}>
        <div style={{
          background: '#fff',
          padding: '16px 24px',
          borderRadius: '20px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#722F37', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📏 اختاري مقاسك المفضل:
            </span>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {AVAILABLE_SIZES.map(size => {
                const isActive = selectedSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    style={{
                      padding: '7px 18px',
                      borderRadius: '14px',
                      border: isActive ? '2px solid #722F37' : '1px solid #E5E7EB',
                      background: isActive ? 'linear-gradient(135deg, #722F37 0%, #4A1C22 100%)' : '#fff',
                      color: isActive ? '#fff' : '#374151',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      boxShadow: isActive ? '0 4px 12px rgba(114, 47, 55, 0.3)' : 'none',
                    }}
                  >
                    {size === 'الكل' ? 'عرض الكل ✨' : `مقاس ${size}`}
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
              لا توجد فساتين متوفرة بهذا المقاس حالياً
            </h3>
            <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '20px' }}>
              تصفحي باقي المقاسات المتاحة أو شاهدي كامل تشكيلتنا!
            </p>
            <button
              type="button"
              onClick={() => setSelectedSize('الكل')}
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
