'use client';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname === '/admin') {
      setLoading(false);
      return;
    }
    fetch('/api/auth', { method: 'GET' })
      .then(res => {
        if (res.ok) {
          setIsAuthed(true);
        } else {
          router.push('/admin');
        }
      })
      .catch(() => router.push('/admin'))
      .finally(() => setLoading(false));
  }, [pathname, router]);


  if (pathname === '/admin') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div style={{ background: '#FAF7F2', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/admin');
  };

  const navItems = [
    { href: '/admin/dashboard', label: 'لوحة القيادة والمبيعات', icon: '📊' },
    { href: '/admin/import-inspector', label: 'مُعالج وسحب المنشورات', icon: '🤖' },
    { href: '/admin/products', label: 'إدارة الكتالوج والفساتين', icon: '👗' },
    { href: '/admin/orders', label: 'طلبات العملاء والأرباح', icon: '📦' },
  ];

  return (
    <div style={{ background: '#FAF7F2', color: '#111827', minHeight: '100vh', display: 'flex' }} dir="rtl">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 90 }}
        />
      )}

      {/* Parisian White & Gold Sidebar */}
      <aside style={{
        width: '280px',
        background: '#FFFFFF',
        borderLeft: '1px solid rgba(212, 175, 55, 0.3)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.03)',
        padding: '32px 20px',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 100
      }}>
        {/* Official Brand Logo Badge */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <img 
            src="/logo.jpg" 
            alt="RIVA Logo" 
            style={{ height: '60px', width: 'auto', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }} 
          />
          <div style={{ fontSize: '10px', color: '#722F37', letterSpacing: '3px', marginTop: '8px', fontWeight: 800 }}>
            ADMIN COMMAND CENTER
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {navItems.map(item => {
            const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 18px',
                  borderRadius: '14px',
                  fontSize: '14px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  color: isActive ? '#fff' : '#374151',
                  background: isActive ? 'linear-gradient(135deg, #722F37 0%, #4A1C22 100%)' : '#FFFDF9',
                  border: isActive ? '1px solid #722F37' : '1px solid #E5E7EB',
                  boxShadow: isActive ? '0 4px 16px rgba(114, 47, 55, 0.3)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Live Site Preview Link & Logout */}
        <div style={{ paddingTop: '20px', borderTop: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px',
              borderRadius: '12px',
              background: '#FFFDF9',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              color: '#722F37',
              fontWeight: 800,
              fontSize: '13px',
              textDecoration: 'none'
            }}
          >
            <span>🛍️</span>
            <span>معاينة المتجر المباشر</span>
          </a>

          <button 
            onClick={handleLogout}
            style={{
              padding: '10px',
              borderRadius: '12px',
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              color: '#DC2626',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>🚪</span>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main style={{ flex: 1, padding: '36px clamp(16px, 3vw, 48px)', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
