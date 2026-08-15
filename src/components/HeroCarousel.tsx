'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const slides = [
  {
    id: 1,
    image: '/hero-dress.jpg',
    badge: '✨ تشكيلة ريفا الجديدة 2026',
    title: 'أناقة <span style="background: linear-gradient(135deg, #FFE8A3 0%, #D4AF37 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">تليق بكِ</span> بلمسة ملكية',
    subtitle: 'اكتشفي أحدث فساتين السهرات والمناسبات المصممة لتبرز جمالك. شحن سريع لكافة المحافظات وحق المعاينة قبل الدفع.',
    buttonText: '🛍️ تسوقي التشكيلة الجديدة',
    link: '/products'
  },
  {
    id: 2,
    image: '/uploads/dress1.jpg',
    badge: '🍁 تشكيلة الشيفون والساتان الفاخر',
    title: 'فخامة <span style="background: linear-gradient(135deg, #FFE8A3 0%, #D4AF37 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">التفاصيل</span> والخامات الفاخرة',
    subtitle: 'قصّات عصرية مبطنة بالكامل ومصممة بأعلى معايير الجودة لتلائم إطلالتك الساحرة في كل مناسبة.',
    buttonText: '✨ تصفحي فساتين الشيفون',
    link: '/products'
  },
  {
    id: 3,
    image: '/uploads/dress2.jpg',
    badge: '🚚 خدمة التوصيل الملكية مع المعاينة',
    title: 'حق المعاينة والتجربة <span style="background: linear-gradient(135deg, #FFE8A3 0%, #D4AF37 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">قبل الدفع</span>',
    subtitle: 'توصيل ميسر لجميع محافظات المملكة خلال 24-48 ساعة. معاينة وتجربة الفستان مضمونة عند الاستلام.',
    buttonText: '🛒 اطلبي فستانك الآن',
    link: '/products'
  }
];

export default function HeroCarousel() {
  const [currentIdx, setCurrentIdx] = useState(0);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx(prev => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const activeSlide = slides[currentIdx];

  return (
    <section className="container" style={{ margin: '24px auto 40px' }}>
      <div style={{
        position: 'relative',
        width: '100%',
        height: '480px',
        borderRadius: '32px',
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0,0,0,0.12)',
        border: '1px solid rgba(212, 175, 55, 0.3)',
        background: '#0D0E12'
      }}>
        {/* Background Image with Transition */}
        {slides.map((s, idx) => (
          <div
            key={s.id}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: idx === currentIdx ? 1 : 0,
              transition: 'opacity 0.8s ease-in-out',
              zIndex: 1
            }}
          >
            <img 
              src={s.image} 
              alt="Riva Hero" 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: idx === currentIdx ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 6s ease'
              }} 
            />
            {/* Dark Vignette Gradient Overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, rgba(15,17,23,0.92) 0%, rgba(15,17,23,0.7) 50%, rgba(15,17,23,0.3) 100%)'
            }} />
          </div>
        ))}

        {/* Foreground Content */}
        <div style={{
          position: 'relative',
          zIndex: 3,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 48px',
          maxWidth: '650px'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(212, 175, 55, 0.4)',
            padding: '6px 16px',
            borderRadius: '20px',
            color: '#D4AF37',
            fontSize: '13px',
            fontWeight: 800,
            marginBottom: '16px',
            width: 'fit-content'
          }}>
            {activeSlide.badge}
          </div>

          <h1 
            style={{
              fontSize: '42px',
              fontWeight: 900,
              color: '#fff',
              lineHeight: 1.2,
              marginBottom: '16px',
              fontFamily: 'Playfair Display, serif'
            }}
            dangerouslySetInnerHTML={{ __html: activeSlide.title }}
          />

          <p style={{
            fontSize: '16px',
            color: 'rgba(255,255,255,0.85)',
            lineHeight: 1.7,
            marginBottom: '28px'
          }}>
            {activeSlide.subtitle}
          </p>

          <div>
            <Link 
              href={activeSlide.link} 
              className="btn-luxe-admin" 
              style={{
                padding: '16px 36px',
                fontSize: '16px',
                boxShadow: '0 4px 20px rgba(114, 47, 55, 0.5)',
                background: 'linear-gradient(135deg, #722F37 0%, #4A1C22 100%)',
                border: '1px solid rgba(212, 175, 55, 0.4)'
              }}
            >
              {activeSlide.buttonText}
            </Link>
          </div>
        </div>

        {/* Carousel Navigation Arrows */}
        <button
          onClick={() => setCurrentIdx(prev => (prev === 0 ? slides.length - 1 : prev - 1))}
          style={{
            position: 'absolute',
            top: '50%',
            right: 16,
            transform: 'translateY(-50%)',
            zIndex: 4,
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff',
            borderRadius: '50%',
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '18px'
          }}
        >
          ❯
        </button>

        <button
          onClick={() => setCurrentIdx(prev => (prev === slides.length - 1 ? 0 : prev + 1))}
          style={{
            position: 'absolute',
            top: '50%',
            left: 16,
            transform: 'translateY(-50%)',
            zIndex: 4,
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff',
            borderRadius: '50%',
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '18px'
          }}
        >
          ❮
        </button>

        {/* Carousel Bottom Dots */}
        <div style={{
          position: 'absolute',
          bottom: 20,
          right: 48,
          zIndex: 4,
          display: 'flex',
          gap: '8px'
        }}>
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIdx(idx)}
              style={{
                width: idx === currentIdx ? 28 : 10,
                height: 8,
                borderRadius: '4px',
                background: idx === currentIdx ? '#D4AF37' : 'rgba(255,255,255,0.4)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
