'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function InstagramProfilePage() {
  const reels = [
    { title: 'فستان شيفون مبطن ملكي 🍷', views: '14.2K', color: '#722F37' },
    { title: 'كولكشن سهرات 2026 الجديد ✨', views: '28.5K', color: '#1C0A10' },
    { title: 'أناقة الفساتين الكريب الرويال 👗', views: '19.8K', color: '#1E3A5F' },
    { title: 'تجربة ومعاينة فورية عند الاستلام 🚚', views: '33.1K', color: '#800020' },
  ];

  return (
    <main style={{ minHeight: '100vh', background: '#FAFAFA' }}>
      <Navbar />

      {/* Instagram Profile Header Container */}
      <div className="container" style={{ maxWidth: '935px', padding: '36px 16px' }}>
        
        {/* Profile Info Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(20px, 5vw, 60px)',
          borderBottom: '1px solid #DBDBDB',
          paddingBottom: '36px',
          marginBottom: '28px',
          flexWrap: 'wrap'
        }}>
          {/* Profile Picture with Gradient Ring */}
          <div style={{
            width: 'clamp(84px, 15vw, 150px)',
            height: 'clamp(84px, 15vw, 150px)',
            borderRadius: '50%',
            background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
            padding: '3px',
            flexShrink: 0
          }}>
            <img 
              src="/logo.jpg" 
              alt="RIVA Boutique" 
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', background: '#fff' }} 
            />
          </div>

          {/* Profile Details */}
          <div style={{ flex: 1, minWidth: '260px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#262626', margin: 0 }}>
                riva.dress1
              </h1>
              <span style={{ color: '#0095F6', fontSize: '18px' }} title="حساب موثق">✓</span>
              
              <a
                href="https://www.instagram.com/riva.dress1/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#0095F6',
                  color: '#fff',
                  padding: '6px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 800,
                  textDecoration: 'none',
                }}
              >
                متابعة على إنستغرام
              </a>

              <Link
                href="/products"
                style={{
                  background: '#EFEFEF',
                  color: '#000',
                  padding: '6px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 800,
                  textDecoration: 'none',
                }}
              >
                تصفح الكتالوج 🛍️
              </Link>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '28px', marginBottom: '14px', fontSize: '14px', color: '#262626' }}>
              <div><strong>35</strong> منشور</div>
              <div><strong>52.4K</strong> متابع</div>
              <div><strong>120</strong> يتابع</div>
            </div>

            {/* Bio */}
            <div style={{ fontSize: '14px', lineHeight: 1.6, color: '#262626' }}>
              <div style={{ fontWeight: 900 }}>بوتيك ريفا للأزياء الراقية 👗✨</div>
              <div style={{ color: '#737373' }}>متجر فساتين سهرة ومناسبات - الأردن 🇯🇴</div>
              <div>• توصيل لجميع المحافظات خلال 24-48 ساعة 🚚</div>
              <div>• تتوفر معاينة وتجربة الفستان عند الاستلام والتأكد قبل الدفع 💵</div>
              <div style={{ marginTop: '4px', fontWeight: 800, color: '#00376B' }}>
                🔗 <Link href="/products" style={{ color: 'inherit' }}>riva-boutique.jo/products</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stories / Highlights row */}
        <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px', marginBottom: '24px' }}>
          {[
            { title: 'آراء الصبايا 🤍', icon: '⭐' },
            { title: 'كولكشن 2026 👗', icon: '✨' },
            { title: 'توصيل وتجارب 🚚', icon: '📦' },
            { title: 'تنسيقات ملكية 👑', icon: '💎' },
          ].map((h, i) => (
            <div key={i} style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#F3F4F6',
                border: '2px solid #DBDBDB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                margin: '0 auto 6px'
              }}>
                {h.icon}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#262626' }}>{h.title}</div>
            </div>
          ))}
        </div>

        {/* Reels & Grid Showcase */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
          marginTop: '10px'
        }}>
          {reels.map((reel, idx) => (
            <Link
              key={idx}
              href="/products"
              style={{
                textDecoration: 'none',
                position: 'relative',
                aspectRatio: '9/16',
                borderRadius: '12px',
                overflow: 'hidden',
                background: reel.color,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '14px',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 800, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                {reel.title}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>
                👁️ {reel.views} مشاهدة
              </div>
            </Link>
          ))}
        </div>
      </div>

      <Footer />
    </main>
  );
}
