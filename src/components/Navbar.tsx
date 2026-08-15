'use client';

import { useState } from 'react';
import Link from 'next/link';
import InstagramTopBar from './InstagramTopBar';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <InstagramTopBar />
      <header className="navbar-luxe hide-mobile">
        <div className="container">
          <div className="navbar-inner-luxe">
            {/* Brand Logo */}
            <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              <img 
                src="/logo.jpg" 
                alt="RIVA Boutique" 
                style={{ height: '44px', width: 'auto', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} 
              />
            </Link>

            {/* Desktop Nav Links */}
            <nav className="nav-links-desktop">
              <Link href="/" className="nav-link-item active">الرئيسية</Link>
              <Link href="/products" className="nav-link-item">الفساتين</Link>
              <a href="https://www.instagram.com/riva.dress1/" target="_blank" rel="noopener noreferrer" className="nav-link-item">
                إنستغرام
              </a>
              <a 
                href="https://ig.me/m/riva.dress1" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="nav-link-item"
              >
                تواصل معنا 💬
              </a>
            </nav>

            <div className="nav-actions hide-mobile">
              <Link href="/products" className="btn-insta-order">
                <span>🛍️</span>
                <span>تصفحي الكتالوج</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Slide-out Menu */}
      {mobileMenuOpen && (
        <>
          <div className="mobile-menu-overlay open" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="mobile-menu open">
            <button className="mobile-menu-close" onClick={() => setMobileMenuOpen(false)}>✕</button>
            <div className="mobile-menu-links" style={{ paddingTop: '40px' }}>
              <Link href="/" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>🏠 الرئيسية</Link>
              <Link href="/products" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>👗 جميع الفساتين</Link>
              <a href="https://www.instagram.com/riva.dress1/" target="_blank" rel="noopener noreferrer" className="mobile-menu-link">📸 حساب الإنستغرام</a>
              <Link href="/admin" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>⚙️ لوحة التحكم</Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
