'use client';

export default function InstagramFeedGrid() {
  return (
    <section className="container" style={{ margin: '32px auto 40px' }}>
      <div style={{
        background: 'linear-gradient(135deg, #1C0A10 0%, #3B1422 100%)',
        borderRadius: '20px',
        border: '1px solid rgba(212, 175, 55, 0.3)',
        padding: '20px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
      }}>
        {/* Left: Instagram Handle & Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
            padding: '2px',
            flexShrink: 0
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: '#1C0A10',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '20px'
            }}>
              📸
            </div>
          </div>

          <div>
            <div style={{ color: '#D4AF37', fontSize: '16px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px' }}>
              riva.dress1@ <span style={{ color: '#3897f0', fontSize: '13px' }}>✓</span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 700 }}>
              صفحتنا الرسمية على إنستغرام
            </div>
          </div>
        </div>

        {/* Middle Text Message */}
        <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: 700, flex: 1, textAlign: 'center', minWidth: '220px' }}>
          ✨ تابعي جديدنا يومياً واكتشفي آراء وتنسيقات صبايا ريفا مباشرة!
        </div>

        {/* Right CTA Button */}
        <div>
          <a
            href="https://www.instagram.com/riva.dress1/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-luxe-admin"
            style={{
              padding: '10px 22px',
              fontSize: '13px',
              borderRadius: '14px',
              boxShadow: '0 4px 14px rgba(212, 175, 55, 0.25)',
              background: 'linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%)',
              color: '#fff',
              textDecoration: 'none'
            }}
          >
            متابعة الحساب 📸
          </a>
        </div>
      </div>
    </section>
  );
}
