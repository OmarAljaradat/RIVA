'use client';

export default function Footer() {
  const trackSocial = (platform: string) => {
    fetch('/api/events/checkout-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'social_click', platform, pageTitle: 'أسفل الصفحة (Footer)' }),
    }).catch(() => {});
  };

  return (
    <footer style={{
      background: '#0D0E12',
      color: '#fff',
      paddingTop: '40px',
      paddingBottom: '32px',
      borderTop: '1px solid rgba(212, 175, 55, 0.2)'
    }}>
      <div className="container" style={{ textAlign: 'center' }}>
        {/* Centered RIVA Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
          <img 
            src="/logo.jpg" 
            alt="RIVA Boutique" 
            style={{ height: '56px', width: 'auto', objectFit: 'contain', borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }} 
          />
        </div>

        {/* Brand Tagline */}
        <div style={{
          color: '#D4AF37',
          fontSize: '12px',
          fontWeight: 800,
          letterSpacing: '3px',
          marginBottom: '20px'
        }}>
          R I V A &nbsp; B O U T I Q U E &nbsp; • &nbsp; J O R D A N
        </div>

        {/* Instagram Direct Link Pill */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <a
            href="https://www.instagram.com/riva.dress1/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackSocial('instagram')}
            style={{
              background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
              padding: '8px 20px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 800,
              color: '#fff',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(220, 39, 67, 0.3)'
            }}
          >
            <span>📸</span>
            <span>riva.dress1@</span>
          </a>
        </div>

        {/* Policy Links */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {[
            { label: 'سياسة التوصيل', href: '/policies#delivery' },
            { label: 'سياسة الإرجاع', href: '/policies#return' },
            { label: 'الشروط والأحكام', href: '/policies' },
          ].map((link, i) => (
            <a key={i} href={link.href} style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', fontWeight: 700, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseOver={e => (e.currentTarget.style.color = '#D4AF37')}
              onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Minimal Copyright Line */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: '20px',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <span>© 2026 Riva Boutique (riva.dress1). جميع الحقوق محفوظة.</span>
        </div>
      </div>
    </footer>
  );
}
