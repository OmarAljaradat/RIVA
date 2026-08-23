'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCardInsta from '@/components/ProductCardInsta';
import QuickViewModal from '@/components/QuickViewModal';
import SizeCalculatorModal from '@/components/SizeCalculatorModal';
import MobileBottomBar from '@/components/MobileBottomBar';
import Link from 'next/link';

const availableSizes = ['الكل', '36', '38', '40', '42', '44', '46'];

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickViewId, setQuickViewId] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState('الكل');
  const [showSizeCalc, setShowSizeCalc] = useState(false);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Filter logic with Smart Fallback
  let exactMatches: any[] = [];
  let isFallback = false;

  if (selectedSize === 'الكل') {
    exactMatches = products;
  } else {
    exactMatches = products.filter(dress => {
      if (!dress.variants) return false;
      return dress.variants.some((v: any) => v.size === selectedSize && v.quantity > 0);
    });

    if (exactMatches.length === 0) {
      exactMatches = products;
      isFallback = true;
    }
  }

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
            تصفحي أحدث الموديلات المصممة لتمنحك الأناقة والجمال في كل مناسبة • معاينة وتجربة عند الاستلام
          </p>
        </div>
      </div>

      {/* Smart Size Selector Filter Bar */}
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
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#722F37', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📏 اختاري مقاسك المفضل:
            </span>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {availableSizes.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '14px',
                    border: selectedSize === size ? '2px solid #722F37' : '1px solid #E5E7EB',
                    background: selectedSize === size ? 'linear-gradient(135deg, #722F37 0%, #4A1C22 100%)' : '#fff',
                    color: selectedSize === size ? '#fff' : '#374151',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedSize === size ? '0 4px 12px rgba(114, 47, 55, 0.3)' : 'none'
                  }}
                >
                  {size === 'الكل' ? 'عرض الكل ✨' : `مقاس ${size}`}
                </button>
              ))}
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
              transition: 'all 0.2s ease'
            }}
          >
            <span>📏</span>
            <span>معرفة مقاسك المثالي ✨</span>
          </button>
        </div>

        {/* Fallback Smart Tip Banner if Size has no exact match */}
        {isFallback && (
          <div style={{
            marginTop: '16px',
            background: '#FFFDF9',
            border: '1px solid rgba(212, 175, 55, 0.4)',
            padding: '14px 20px',
            borderRadius: '16px',
            fontSize: '14px',
            color: '#722F37',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span>✨</span>
            <span>
              مقاس ({selectedSize}) غير متوفر بهذا الموديل تحديداً، لكن تصفحي هذه التشكيلة الفاخرة المتاحة بمقاسات قريبة ومريحة جداً مع حاسبة المقاس والتجربة عند الاستلام!
            </span>
          </div>
        )}
      </section>

      {/* Catalog Grid */}
      <section className="container" style={{ margin: '28px auto 60px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="products-grid-insta">
            {exactMatches.map(dress => (
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
