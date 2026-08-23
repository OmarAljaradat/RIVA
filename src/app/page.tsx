'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import InstagramStories from '@/components/InstagramStories';
import InstagramFeedGrid from '@/components/InstagramFeedGrid';
import ProductCardInsta from '@/components/ProductCardInsta';
import MobileBottomBar from '@/components/MobileBottomBar';
import QuickViewModal from '@/components/QuickViewModal';
import ParisianHero from '@/components/ParisianHero';
import Link from 'next/link';

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickViewId, setQuickViewId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/products?t=' + Date.now(), { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formattedProducts = products.map(dress => {
    const colors = [...new Set(dress.variants?.map((v: any) => v.colorHex) || [])];
    
    // Pick real image/video over default placeholder
    let allImages: string[] = [];
    dress.variants?.forEach((v: any) => {
      v.images?.forEach((img: any) => {
        if (img.url && !allImages.includes(img.url)) allImages.push(img.url);
      });
    });

    const realMedia = allImages.filter(url => url !== '/uploads/dress1.jpg');
    const firstMedia = realMedia.length > 0 ? realMedia[0] : (allImages[0] || '/uploads/dress1.jpg');

    return {
      id: String(dress.id),
      name: dress.name,
      price: dress.price,
      image: firstMedia,
      isNew: dress.isNew,
      colors,
    };
  });

  const newArrivals = formattedProducts.filter(p => p.isNew);
  const featured = formattedProducts;

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-cream)' }}>
      <Navbar />

      {/* Parisian Luxury Header Banner */}
      <ParisianHero />



      {/* Single Unified Dress Collection Section */}
      <section className="container" style={{ margin: '48px auto 64px' }}>
        <div className="section-header-center">
          <span className="section-tag">RIVA DRESSES COLLECTION 2026</span>
          <h2 className="section-heading-main">تشكيلة فساتين ريفا 👑</h2>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="products-grid-insta">
            {products.slice(0, 6).map(dress => (
              <ProductCardInsta 
                key={dress.id} 
                product={dress} 
                onQuickView={(id) => setQuickViewId(id)}
              />
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <Link href="/products" className="btn-luxe-admin" style={{ padding: '16px 44px', fontSize: '16px', boxShadow: '0 4px 20px rgba(114, 47, 55, 0.3)' }}>
            👗 تصفحي جميع الفساتين والكتالوج الكامل
          </Link>
        </div>
      </section>

      {/* Instagram Compact Banner */}
      <InstagramFeedGrid />

      {/* Quick View Modal */}
      <QuickViewModal 
        productId={quickViewId} 
        onClose={() => setQuickViewId(null)} 
      />

      <Footer />
      <MobileBottomBar />
    </main>
  );
}
