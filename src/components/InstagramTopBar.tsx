'use client';

import { useState, useEffect } from 'react';

const announcements = [
  '🔍 يتوفر معاينة وتجربة الفستان عند الاستلام والتأكد قبل الدفع 🇯🇴',
  '🚚 توصيل سريع خلال 24-48 ساعة لجميع محافظات المملكة',
  '✨ تشكيلة ريفا الجديدة 2026 - خامات فاخرة مبطنة بالكامل'
];

export default function InstagramTopBar() {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="insta-top-banner" style={{ background: 'linear-gradient(90deg, #3D131C 0%, #722F37 50%, #3D131C 100%)', color: '#fff', borderBottom: '1px solid rgba(212, 175, 55, 0.3)', padding: '6px 0' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        {/* Desktop Instagram Handle Badge */}
        <a 
          href="https://www.instagram.com/riva.dress1/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="insta-handle-badge hide-mobile"
          style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(212, 175, 55, 0.4)' }}
        >
          <span>📸</span>
          <span>riva.dress1@</span>
        </a>

        {/* Rotating Announcement Message (Centered 1-line on mobile & desktop) */}
        <div style={{
          flex: 1,
          textAlign: 'center',
          fontSize: '12px',
          fontWeight: 800,
          color: '#FFE8A3',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          padding: '0 8px'
        }}>
          {announcements[currentIdx]}
        </div>

        <div style={{ fontSize: '11px', color: '#D4AF37', fontWeight: 800 }} className="hide-mobile">
          RIVA BOUTIQUE 👑
        </div>
      </div>
    </div>
  );
}
