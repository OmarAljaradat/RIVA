'use client';

import { useState } from 'react';
import Link from 'next/link';

interface VariantGroup {
  color: string;
  colorHex: string;
  photoUrl: string;
}

interface ProductCardProps {
  product: {
    id: number | string;
    name: string;
    price: number;
    originalPrice?: number;
    description?: string;
    isNew?: boolean;
    variants?: {
      id: number;
      color: string;
      colorHex: string;
      size: string;
      quantity: number;
      images: { url: string }[];
    }[];
  };
  onQuickView?: (id: string) => void;
}

export default function ProductCardInsta({ product }: ProductCardProps) {
  // Extract color groups with photos or videos
  const colorGroups: VariantGroup[] = [];

  if (product.variants && product.variants.length > 0) {
    product.variants.forEach(v => {
      let group = colorGroups.find(g => g.color === v.color);
      if (!group) {
        let photo = '/uploads/dress1.jpg';
        if (v.images && v.images.length > 0) {
          // Prefer static image (.jpg/.png) if available, otherwise take video
          const imgFile = v.images.find(img => img.url && (img.url.endsWith('.jpg') || img.url.endsWith('.jpeg') || img.url.endsWith('.png') || img.url.endsWith('.webp')));
          if (imgFile) {
            photo = imgFile.url;
          } else if (v.images[0]?.url) {
            photo = v.images[0].url;
          }
        }
        colorGroups.push({
          color: v.color,
          colorHex: v.colorHex || '#722F37',
          photoUrl: photo,
        });
      }
    });
  }

  const [activeColorIdx, setActiveColorIdx] = useState(0);
  const activeGroup = colorGroups[activeColorIdx] || colorGroups[0] || null;

  // Find best available media (active color photo -> any variant photo -> default)
  let displayMedia = activeGroup?.photoUrl || '';
  if (!displayMedia || displayMedia === '/uploads/dress1.jpg') {
    const anyValidMedia = product.variants
      ?.flatMap(v => v.images || [])
      .map(img => img.url)
      .find(url => url && url !== '/uploads/dress1.jpg');
    if (anyValidMedia) {
      displayMedia = anyValidMedia;
    } else {
      displayMedia = '/uploads/dress_hero.jpg';
    }
  }

  const isVideo = displayMedia.endsWith('.mp4') || displayMedia.endsWith('.webm');

  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
      border: '1px solid #F3F4F6',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      transition: 'all 0.25s ease'
    }}
    className="simple-card-hover"
    >
      <Link href={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Photo/Video Container (Clean 3:4 Aspect Ratio) */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '3 / 4', background: '#FAF7F2', overflow: 'hidden' }}>
          {product.isNew && (
            <span style={{
              position: 'absolute',
              top: 10,
              right: 10,
              zIndex: 2,
              background: '#722F37',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 800,
              padding: '3px 9px',
              borderRadius: '6px'
            }}>
              جديد ✨
            </span>
          )}

          {/* Discount Badge */}
          {product.originalPrice && product.originalPrice > product.price && (
            <span style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 10,
              background: '#DC2626',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 900,
              padding: '4px 10px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(220,38,38,0.4)'
            }}>
              🔥 خصم {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
            </span>
          )}

          {isVideo ? (
            <video 
              key={displayMedia}
              src={displayMedia} 
              autoPlay 
              loop 
              muted 
              playsInline
              preload="metadata"
              crossOrigin="anonymous"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          ) : (
            <img 
              key={displayMedia}
              src={displayMedia} 
              alt={product.name} 
              crossOrigin="anonymous"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                if (!target.src.includes('/hero-dress.jpg')) {
                  target.src = '/hero-dress.jpg';
                }
              }}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.2s ease' }} 
            />
          )}
        </div>

        {/* Clean Details */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1F2937', margin: 0, lineHeight: 1.4 }}>
              {product.name}
            </h3>

            {/* Interactive Color Switcher Dots */}
            {colorGroups.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                {colorGroups.map((g, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveColorIdx(idx);
                    }}
                    onMouseEnter={() => setActiveColorIdx(idx)}
                    title={g.color}
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: g.colorHex,
                      border: activeColorIdx === idx ? '2px solid #722F37' : '1px solid #D1D5DB',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F3F4F6', paddingTop: '10px', marginTop: '4px' }}>
            <div>
              {product.originalPrice && product.originalPrice > product.price && (
                <span style={{ fontSize: '13px', color: '#9CA3AF', textDecoration: 'line-through', marginLeft: '6px' }}>
                  {product.originalPrice} د.أ
                </span>
              )}
              <span style={{ fontSize: '18px', fontWeight: 900, color: '#722F37' }}>
                {product.price} <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>د.أ</span>
              </span>
            </div>

            <span className="btn-luxe-admin" style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '10px' }}>
              🛒 أطلبي الآن
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
