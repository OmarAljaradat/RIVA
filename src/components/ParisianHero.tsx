'use client';

import Link from 'next/link';

export default function ParisianHero() {
  return (
    <section className="container" style={{ margin: '20px auto 36px' }}>
      <div style={{
        background: 'linear-gradient(135deg, #FAF7F2 0%, #F5EFE6 50%, #FAF7F2 100%)',
        borderRadius: '28px',
        border: '1px solid rgba(212, 175, 55, 0.35)',
        padding: 'clamp(28px, 5vw, 52px) clamp(16px, 3vw, 36px)',
        textAlign: 'center',
        boxShadow: '0 12px 40px rgba(114, 47, 55, 0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Subtle Sparkle Glows */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        
        <div style={{
          position: 'absolute',
          bottom: '-40px',
          left: '-40px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(114, 47, 55, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Centered Standalone Official RIVA Logo Image */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <img 
            src="/logo.jpg" 
            alt="RIVA Boutique" 
            style={{ height: 'clamp(55px, 12vw, 80px)', width: 'auto', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 6px 20px rgba(0,0,0,0.05)' }} 
          />
        </div>

        {/* Main Elegance Title with Luxe Dual-Tone Gradient */}
        <h1 style={{
          fontSize: 'clamp(24px, 5.5vw, 42px)',
          fontWeight: 900,
          color: '#111827',
          lineHeight: 1.35,
          marginBottom: '14px',
          fontFamily: "'Thmanyah Sans', 'Thmanyah Serif Display', sans-serif",
          maxWidth: '850px',
          margin: '0 auto 14px'
        }}>
          أناقة <span style={{
            background: 'linear-gradient(135deg, #722F37 0%, #D4AF37 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>تليق بكِ</span> في كل مناسبة ✨
        </h1>

        {/* Calm & Refined Subtitle */}
        <p style={{
          fontSize: '16px',
          color: '#4B5563',
          lineHeight: 1.8,
          maxWidth: '720px',
          margin: '0 auto 28px',
          fontWeight: 500
        }}>
          اكتشفي تشكيلة الفساتين الراقية المصممة بعناية فائقة لتبرز جمالك. خامات فاخرة، شحن سريع لجميع المحافظات، وحق المعاينة والتجربة قبل الدفع 💖
        </p>

        {/* Luxe Feature Badges with Gold Accents */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '32px'
        }}>
          <span style={{
            background: '#fff',
            border: '1px solid rgba(212, 175, 55, 0.4)',
            padding: '9px 20px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 800,
            color: '#722F37',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            👗 تصاميم راقية 2026
          </span>

          <span style={{
            background: '#fff',
            border: '1px solid rgba(5, 150, 105, 0.3)',
            padding: '9px 20px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 800,
            color: '#059669',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            🔍 معاينة وتجربة قبل الدفع
          </span>

          <span style={{
            background: '#fff',
            border: '1px solid rgba(212, 175, 55, 0.4)',
            padding: '9px 20px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 800,
            color: '#722F37',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            🚚 توصيل سريع 24-48 ساعة
          </span>
        </div>

        {/* Premium Gold/Burgundy CTA Button */}
        <div>
          <Link
            href="/products"
            className="btn-luxe-admin"
            style={{
              padding: '16px 44px',
              fontSize: '16px',
              borderRadius: '16px',
              boxShadow: '0 8px 28px rgba(114, 47, 55, 0.35)',
              background: 'linear-gradient(135deg, #722F37 0%, #4A1C22 100%)',
              color: '#fff',
              border: '1.5px solid #D4AF37',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <span>🛍️ تصفحي تشكيلة الفساتين والكتالوج</span>
            <span style={{ fontSize: '18px' }}>←</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
