'use client';

import { useState } from 'react';

interface MediaManagerProps {
  product: any;
  onClose: () => void;
  onRefresh?: () => void;
  onUpdate?: () => void;
}

const DEFAULT_SIZES = ['36', '38', '40', '42', '44', '46', '48', '50'];

export default function AdminMediaManagerModal({ product, onClose, onRefresh, onUpdate }: MediaManagerProps) {
  const triggerRefresh = () => {
    if (onRefresh) onRefresh();
    if (onUpdate) onUpdate();
  };
  // Extract unique color groups and their variants/images
  const colorGroups: { color: string; colorHex: string; variants: any[]; images: string[] }[] = [];
  if (product?.variants) {
    product.variants.forEach((v: any) => {
      let group = colorGroups.find(g => g.color === v.color);
      if (!group) {
        group = { color: v.color, colorHex: v.colorHex || '#800020', variants: [], images: [] };
        colorGroups.push(group);
      }
      group.variants.push(v);
      v.images?.forEach((img: any) => {
        if (img.url && !group.images.includes(img.url)) {
          group.images.push(img.url);
        }
      });
    });
  }

  const [activeColorIdx, setActiveColorIdx] = useState(0);
  const activeGroup = colorGroups[activeColorIdx] || colorGroups[0];
  const activeColor = activeGroup?.color || '';

  // Media state per color
  const [mediaMap, setMediaMap] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    colorGroups.forEach(g => {
      map[g.color] = [...g.images];
    });
    return map;
  });

  // Size Availability State per color: { [color]: { [size]: boolean } }
  const [sizeMap, setSizeMap] = useState<Record<string, Record<string, boolean>>>(() => {
    const map: Record<string, Record<string, boolean>> = {};
    colorGroups.forEach(g => {
      map[g.color] = {};
      DEFAULT_SIZES.forEach(sz => {
        // Active if there is a variant with size = sz and quantity > 0
        const v = g.variants.find((v: any) => v.size === sz);
        map[g.color][sz] = v ? v.quantity > 0 : false;
      });
    });
    return map;
  });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentMediaList = mediaMap[activeColor] || [];
  const currentSizes = sizeMap[activeColor] || {};

  const toggleSize = (size: string) => {
    setSizeMap(prev => ({
      ...prev,
      [activeColor]: {
        ...(prev[activeColor] || {}),
        [size]: !prev[activeColor]?.[size],
      },
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.url) {
          newUrls.push(data.url);
        }
      }

      setMediaMap(prev => ({
        ...prev,
        [activeColor]: [...(prev[activeColor] || []), ...newUrls],
      }));
    } catch (err) {
      alert('حدث خطأ أثناء رفع الملف');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveMedia = (urlToRemove: string) => {
    setMediaMap(prev => ({
      ...prev,
      [activeColor]: (prev[activeColor] || []).filter(u => u !== urlToRemove),
    }));
  };

  const handleAddUrl = () => {
    const url = prompt('أدخل رابط الفيديو أو الصورة (مثال: /uploads/video.mp4):');
    if (url && url.trim()) {
      setMediaMap(prev => ({
        ...prev,
        [activeColor]: [...(prev[activeColor] || []), url.trim()],
      }));
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // 1. Update Media for active color
      const urls = mediaMap[activeColor] || [];
      await fetch(`/api/products/${product.id}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color: activeColor, imageUrls: urls }),
      });

      // 2. Prepare full variants array for PUT /api/products/[id]
      const updatedVariants: any[] = [];

      // Preserve or construct variants for all colors
      colorGroups.forEach(g => {
        const cSizes = sizeMap[g.color] || {};
        let hasActive = false;

        DEFAULT_SIZES.forEach(sz => {
          if (cSizes[sz]) {
            hasActive = true;
            updatedVariants.push({
              color: g.color,
              colorHex: g.colorHex,
              size: sz,
              quantity: 5,
              imageUrls: mediaMap[g.color] || [],
            });
          }
        });

        // If all sizes toggled off, add sold out variant
        if (!hasActive) {
          updatedVariants.push({
            color: g.color,
            colorHex: g.colorHex,
            size: 'خالص (نفذت الكمية)',
            quantity: 0,
            imageUrls: mediaMap[g.color] || [],
          });
        }
      });

      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: product.name,
          description: product.description,
          price: product.price,
          isNew: product.isNew,
          isFeatured: product.isFeatured,
          variants: updatedVariants,
        }),
      });

      if (res.ok) {
        alert(`تم حفظ الفيديوهات والمقاسات للون (${activeColor}) بنجاح! ✨`);
        triggerRefresh();
      } else {
        alert('حدث خطأ في حفظ التعديلات');
      }
    } catch (err) {
      alert('حدث خطأ بالاتصال بالسيرفر');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay-insta" onClick={onClose}>
      <div className="modal-content-luxe" onClick={e => e.stopPropagation()} style={{ padding: '32px', maxWidth: '800px', width: '92%' }}>
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        <div style={{ marginBottom: '20px', borderBottom: '1px solid #E5E7EB', paddingBottom: '16px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#111827' }}>
            ⚡ تعديل المقاسات والفيديوهات للون ({activeColor})
          </h2>
          <p style={{ color: '#6B7280', fontSize: '13px', marginTop: '4px' }}>
            الفستان: <strong style={{ color: '#722F37' }}>{product.name}</strong>
          </p>
        </div>

        {/* Color Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
          {colorGroups.map((g, idx) => (
            <button
              key={idx}
              onClick={() => setActiveColorIdx(idx)}
              style={{
                padding: '10px 18px',
                borderRadius: '16px',
                border: activeColorIdx === idx ? '2px solid #722F37' : '1px solid #D1D5DB',
                background: activeColorIdx === idx ? '#FAF7F2' : '#fff',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: activeColorIdx === idx ? '0 4px 12px rgba(114, 47, 55, 0.15)' : 'none'
              }}
            >
              <span style={{ width: 14, height: 14, borderRadius: '50%', background: g.colorHex, border: '1px solid rgba(0,0,0,0.2)' }} />
              <span>{g.color}</span>
            </button>
          ))}
        </div>

        {/* Interactive Size Pills Section */}
        <div style={{ background: '#FAF7F2', padding: '24px', borderRadius: '18px', marginBottom: '24px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
          <h4 style={{ fontWeight: 900, fontSize: '15px', marginBottom: '14px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📏 المقاسات المتوفرة للون ({activeColor}) — <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>اضغط على المربع لتفعيله أو إلغائه (خالص)</span>
          </h4>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {DEFAULT_SIZES.map(size => {
              const isAvailable = !!currentSizes[size];
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  style={{
                    minWidth: '64px',
                    height: '50px',
                    borderRadius: '14px',
                    border: isAvailable ? '2px solid #722F37' : '2px dashed #EF4444',
                    background: isAvailable ? '#722F37' : '#FEF2F2',
                    color: isAvailable ? '#fff' : '#EF4444',
                    fontWeight: 900,
                    fontSize: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: isAvailable ? '0 4px 12px rgba(114, 47, 55, 0.25)' : 'none'
                  }}
                >
                  <span>{size}</span>
                  <span style={{ fontSize: '10px', opacity: 0.9 }}>
                    {isAvailable ? '✓ متوفر' : '🔴 خالص'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Video & Photo Upload Section */}
        <div style={{ background: '#F9FAFB', padding: '24px', borderRadius: '18px', marginBottom: '24px', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontWeight: 900, fontSize: '15px', color: '#111827' }}>
              🎬 فيديو وصور لون ({activeColor}):
            </h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              <label className="btn-luxe-admin" style={{ cursor: 'pointer', margin: 0, fontSize: '12px', padding: '8px 16px' }}>
                📁 رفع فيديو/صورة من الجهاز
                <input 
                  type="file" 
                  accept="image/*,video/*" 
                  multiple 
                  onChange={handleFileUpload} 
                  style={{ display: 'none' }} 
                />
              </label>
              <button onClick={handleAddUrl} className="btn-luxe-outline" style={{ fontSize: '12px', padding: '8px 14px' }}>
                🔗 إضافة رابط
              </button>
            </div>
          </div>

          {uploading && (
            <div style={{ textAlign: 'center', padding: '16px', color: '#722F37', fontWeight: 800 }}>
              ⏳ جاري رفع الفيديو إلى السيرفر...
            </div>
          )}

          {currentMediaList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#9CA3AF', fontSize: '14px', background: '#fff', borderRadius: '14px', border: '2px dashed #E5E7EB' }}>
              🎥 لا يوجد فيديو مخصص بعد لهذا اللون. اضغط زر الرفع أعلاه واختر مقطع الفيديو من هاتفك أو جهازك!
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '14px' }}>
              {currentMediaList.map((url, idx) => {
                const isVid = url.endsWith('.mp4') || url.endsWith('.webm');
                return (
                  <div key={idx} style={{ position: 'relative', height: '160px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #D1D5DB', background: '#000' }}>
                    {isVid ? (
                      <video src={url} controls muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <img src={url} alt={`Media ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                    <button
                      onClick={() => handleRemoveMedia(url)}
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        background: '#EF4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '26px',
                        height: '26px',
                        cursor: 'pointer',
                        fontWeight: '900',
                        fontSize: '12px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                      }}
                      title="حذف هذه الميديا"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} className="btn-luxe-outline">
            إغلاق
          </button>
          <button onClick={handleSaveAll} disabled={saving} className="btn-luxe-admin" style={{ fontSize: '15px' }}>
            {saving ? '⏳ جاري الحفظ...' : `💾 حفظ تعديلات لون (${activeColor})`}
          </button>
        </div>
      </div>
    </div>
  );
}
