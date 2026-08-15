'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileBottomBar() {
  const pathname = usePathname();

  // Hide bottom bar inside admin pages
  if (pathname.startsWith('/admin')) return null;

  return (
    <nav className="mobile-bottom-bar">
      <Link href="/" className={`mobile-bar-item ${pathname === '/' ? 'active' : ''}`}>
        <span className="mobile-bar-icon">🏠</span>
        <span>الرئيسية</span>
      </Link>

      <Link href="/products" className={`mobile-bar-item ${pathname.startsWith('/products') ? 'active' : ''}`}>
        <span className="mobile-bar-icon">👗</span>
        <span>الفساتين</span>
      </Link>

      <a 
        href="https://www.instagram.com/riva.dress1/" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="mobile-bar-item"
      >
        <span className="mobile-bar-icon">📸</span>
        <span>إنستغرام</span>
      </a>

      <a 
        href="https://ig.me/m/riva.dress1" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="mobile-bar-item"
      >
        <span className="mobile-bar-icon">💬</span>
        <span>تواصل معنا</span>
      </a>
    </nav>
  );
}
