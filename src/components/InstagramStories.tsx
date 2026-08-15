'use client';

import { useState } from 'react';

const storiesData = [
  {
    id: 1,
    title: 'جديد 2024 ✨',
    img: '/hero-dress.jpg',
    highlight: 'أحدث التشكيلات المصممة للسهرات والمناسبات'
  },
  {
    id: 2,
    title: 'فساتين سهرة 💃',
    img: '/uploads/dress1.jpg',
    highlight: 'ساتان ومخمل فاخر بتصاميم ملكية'
  },
  {
    id: 3,
    title: 'آراء الصبايا ⭐',
    img: '/uploads/dress2.jpg',
    highlight: 'أكثر من 500+ زبونة سعيدة في الأردن'
  },
  {
    id: 4,
    title: 'الأكثر طلباً 🔥',
    img: '/uploads/dress4.jpg',
    highlight: 'موديلات كلاسيكية تناسب جميع الأذواق'
  },
  {
    id: 5,
    title: 'توصيل الأردن 🚚',
    img: '/uploads/dress3.jpg',
    highlight: 'توصيل سريع خلال 24-48 ساعة والدفع عند الاستلام'
  }
];

export default function InstagramStories() {
  const [activeStory, setActiveStory] = useState<typeof storiesData[0] | null>(null);

  return (
    <div className="stories-section">
      <div className="container">
        <div className="stories-carousel">
          {storiesData.map((story) => (
            <div 
              key={story.id} 
              className="story-item"
              onClick={() => setActiveStory(story)}
            >
              <div className="story-ring">
                <img src={story.img} alt={story.title} className="story-img-inner" />
              </div>
              <span className="story-label">{story.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Story Modal Viewer */}
      {activeStory && (
        <div className="modal-overlay-insta" onClick={() => setActiveStory(null)}>
          <div 
            className="modal-content-luxe" 
            style={{ maxWidth: '420px', borderRadius: '24px', padding: '0', overflow: 'hidden', background: '#0f0f13', color: '#fff' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close-btn" onClick={() => setActiveStory(null)} style={{ color: '#fff', background: 'rgba(255,255,255,0.2)' }}>
              ✕
            </button>
            <div style={{ position: 'relative', width: '100%', height: '540px' }}>
              <img 
                src={activeStory.img} 
                alt={activeStory.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                inset: '0',
                background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.85) 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', padding: '2px', background: 'var(--insta-gradient)' }}>
                    <img src="/hero-dress.jpg" alt="Riva" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700 }}>riva.dress1</h4>
                    <span style={{ fontSize: '11px', opacity: 0.8 }}>الستوري الرسمية</span>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>{activeStory.title}</h3>
                  <p style={{ fontSize: '14px', lineHeight: 1.6, opacity: 0.9, marginBottom: '20px' }}>
                    {activeStory.highlight}
                  </p>
                  <a 
                    href="https://wa.me/962799961823?text=%DD8%A3%D9%87%D9%84%D8%A7%D9%8B%20%D9%85%D8%AA%D8%AC%D8%B1%20%D8%B1%D9%8A%D9%81%D8%A7%D8%8C%20%D8%A3%D8%B1%D8%BA%D8%A8%20%D8%A8%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-luxe btn-luxe-gold"
                    style={{ width: '100%' }}
                  >
                    💬 تواصل عبر الواتساب الآن
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
