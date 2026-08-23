'use client';

import { useState } from 'react';

interface MediaManagerProps {
  product: any;
  onClose: () => void;
  onRefresh?: () => void;
  onUpdate?: () => void;
}

const DEFAULT_SIZES = ['36', '38', '40', '42', '44', '46', '48', '50'];

function isVideoUrl(url: string) {
  if (url.startsWith('data:video/')) return true;
  const clean = url.toLowerCase().split('?')[0];
  return clean.endsWith('.mp4') || clean.endsWith('.webm') || clean.endsWith('.mov') || clean.includes('video');
}

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

  // Media state per color: { [color]: string[] }
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
        const v = g.variants.find((v: any) => v.size === sz);
        map[g.color][sz] = v ? v.quantity > 0 : false;
      });
    });
    return map;
  });

  const [uploadingType, setUploadingType] = useState<'photo' | 'video' | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncingTgMedia, setSyncingTgMedia] = useState(false);

  const handleSyncTelegramMedia = async () => {
    setSyncingTgMedia(true);
    try {
      const res = await fetch(`/api/products/${product.id}/sync-telegram-media`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.uploadedUrls && data.uploadedUrls.length > 0) {
        alert(`تم جلب ${data.uploadedUrls.length} وسائط بنجاح من التيليجرام! ✨`);
        triggerRefresh();
        onClose();
      } else {
        alert(data.error || 'لم يتم العثور على وسائط مرتبطة في التيليجرام');
      }
    } catch (err) {
      alert('حدث خطأ في الاتصال بالتيليجرام');
    } finally {
      setSyncingTgMedia(false);
    }
  };

  const currentMediaList = mediaMap[activeColor] || [];
  const currentPhotos = currentMediaList.filter(url => !isVideoUrl(url));
  const currentVideos = currentMediaList.filter(url => isVideoUrl(url));
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

  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1600;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processVideoFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'video') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingType(type);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (type === 'photo') {
          const dataUrl = await processImageFile(file);
          newUrls.push(dataUrl);
        } else {
          const dataUrl = await processVideoFile(file);
          newUrls.push(dataUrl);
        }
      }

      if (newUrls.length > 0) {
        setMediaMap(prev => {
          const existing = prev[activeColor] || [];
          if (type === 'photo') {
            return {
              ...prev,
              [activeColor]: [...newUrls, ...existing]
            };
          } else {
            return {
              ...prev,
              [activeColor]: [...existing, ...newUrls]
            };
          }
        });
      }
    } catch (err: any) {
      alert(`حدث خطأ أثناء معالجة الملف: ${err?.message || 'يرجى المحاولة مرة أخرى'}`);
    } finally {
      setUploadingType(null);
      e.target.value = '';
    }
  };

  const handleRemoveMedia = (urlToRemove: string) => {
    setMediaMap(prev => ({
      ...prev,
      [activeColor]: (prev[activeColor] || []).filter(u => u !== urlToRemove),
    }));
  };

  const handleAddUrlPrompt = (type: 'photo' | 'video') => {
    const example = type === 'photo' ? 'https://files.catbox.moe/image.jpg' : 'https://files.catbox.moe/video.mp4';
    const url = prompt(`أدخل رابط الـ ${type === 'photo' ? 'صورة' : 'فيديو'} المباشر:\n(مثال: ${example})`);
    if (url && url.trim()) {
      setMediaMap(prev => {
        const existing = prev[activeColor] || [];
        if (type === 'photo') {
          return { ...prev, [activeColor]: [url.trim(), ...existing] };
        } else {
          return { ...prev, [activeColor]: [...existing, url.trim()] };
        }
      });
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // 1. Order active color media: Photos FIRST, Videos SECOND (prevents website lag!)
      const activeUrls = mediaMap[activeColor] || [];
      const sortedActiveUrls = [
        ...activeUrls.filter(u => !isVideoUrl(u)),
        ...activeUrls.filter(u => isVideoUrl(u))
      ];

      await fetch(`/api/products/${product.id}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color: activeColor, imageUrls: sortedActiveUrls }),
      });

      // 2. Prepare full variants array for PUT /api/products/[id]
      const updatedVariants: any[] = [];

      colorGroups.forEach(g => {
        const cSizes = sizeMap[g.color] || {};
        const gUrls = mediaMap[g.color] || [];
        const sortedGUrls = [
          ...gUrls.filter(u => !isVideoUrl(u)),
          ...gUrls.filter(u => isVideoUrl(u))
        ];

        let hasActive = false;
        DEFAULT_SIZES.forEach(sz => {
          if (cSizes[sz]) {
            hasActive = true;
            updatedVariants.push({
              color: g.color,
              colorHex: g.colorHex,
              size: sz,
              quantity: 5,
              imageUrls: sortedGUrls,
            });
          }
        });

        if (!hasActive) {
          updatedVariants.push({
            color: g.color,
            colorHex: g.colorHex,
            size: 'خالص',
            quantity: 0,
            imageUrls: sortedGUrls,
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
        alert(`تم حفظ صور وفيديوهات ومقاسات لون (${activeColor}) بنجاح! ✨`);
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
      <div className="modal-content-luxe" onClick={e => e.stopPropagation()} style={{ padding: '28px', maxWidth: '880px', width: '94%', maxHeight: '92vh', overflowY: 'auto' }}>
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        {/* Modal Header */}
        <div style={{ marginBottom: '18px', borderBottom: '1.5px solid #F3F4F6', paddingBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-rose-gold)', letterSpacing: '1px' }}>RIVA MEDIA & SIZES STUDIO</span>
            <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#111827', margin: '4px 0 2px' }}>
              🎨 إدارة صور وفيديوهات ومقاسات اللون: <span style={{ color: '#722F37' }}>({activeColor})</span>
            </h2>
            <p style={{ color: '#6B7280', fontSize: '13px', margin: 0 }}>
              الفستان: <strong>{product.name}</strong> ({product.price} د.أ)
            </p>
          </div>
          <button
            type="button"
            onClick={handleSyncTelegramMedia}
            disabled={syncingTgMedia}
            className="btn-luxe-admin"
            style={{ background: 'linear-gradient(135deg, #0088cc, #005f8f)', border: 'none', color: '#fff', fontSize: '13px', padding: '9px 16px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(0,136,204,0.25)' }}
          >
            {syncingTgMedia ? '⏳ جاري سحب الوسائط من التيليجرام...' : '⚡ سحب صور وفيديوهات الفستان من تيليجرام'}
          </button>
        </div>

        {/* Color Switcher Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '6px' }}>
          {colorGroups.map((g, idx) => {
            const isSelected = activeColorIdx === idx;
            const gPhotos = (mediaMap[g.color] || []).filter(u => !isVideoUrl(u));
            const gVideos = (mediaMap[g.color] || []).filter(u => isVideoUrl(u));
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveColorIdx(idx)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '14px',
                  border: isSelected ? '2px solid #722F37' : '1.5px solid #E5E7EB',
                  background: isSelected ? '#FAF7F2' : '#fff',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  boxShadow: isSelected ? '0 4px 12px rgba(114, 47, 55, 0.12)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ width: 13, height: 13, borderRadius: '50%', background: g.colorHex, border: '1px solid rgba(0,0,0,0.2)' }} />
                <span>{g.color}</span>
                <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600 }}>
                  ({gPhotos.length} 📸 | {gVideos.length} 🎬)
                </span>
              </button>
            );
          })}
        </div>

        {/* SECTION 1: PHOTOS (Primary - Loads instantly without lag) */}
        <div style={{ background: '#FDFBF7', border: '1.5px solid rgba(212, 175, 55, 0.3)', borderRadius: '16px', padding: '18px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h4 style={{ fontWeight: 900, fontSize: '15px', color: '#722F37', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                📸 صور الفستان لهذا اللون ({activeColor})
              </h4>
              <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>
                ✨ تظهر أولاً للزبائن فوراً وبسرعة فائقة (الترتيب: أول صورة ستكون الغلاف الأساسي).
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <label className="btn-luxe-admin" style={{ cursor: 'pointer', margin: 0, fontSize: '12px', padding: '7px 14px', background: '#722F37' }}>
                {uploadingType === 'photo' ? '⏳ جاري رفع الصورة...' : '🖼️ + رفع صورة من جهازك'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  disabled={uploadingType !== null}
                  onChange={e => handleFileUpload(e, 'photo')}
                  style={{ display: 'none' }}
                />
              </label>
              <button
                type="button"
                onClick={() => handleAddUrlPrompt('photo')}
                className="btn-luxe-outline"
                style={{ fontSize: '12px', padding: '7px 12px' }}
              >
                🔗 رابط صورة
              </button>
            </div>
          </div>

          {currentPhotos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF', fontSize: '13px', background: '#fff', borderRadius: '12px', border: '1.5px dashed #E5E7EB' }}>
              🖼️ لا توجد صور ثابتة بعد للون ({activeColor}). اضغط زر "رفع صورة" لإضافة صور هذا اللون بدقة.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '12px' }}>
              {currentPhotos.map((url, idx) => (
                <div key={idx} style={{ position: 'relative', height: '140px', borderRadius: '10px', overflow: 'hidden', border: idx === 0 ? '2px solid #722F37' : '1px solid #E5E7EB', background: '#fff' }}>
                  {idx === 0 && (
                    <span style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(114,47,55,0.85)', color: '#fff', fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', zIndex: 2 }}>
                      الغلاف الرئيسي
                    </span>
                  )}
                  <img src={url} alt={`Photo ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(url)}
                    style={{
                      position: 'absolute', top: '5px', right: '5px', background: '#EF4444', color: '#fff',
                      border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer',
                      fontWeight: '900', fontSize: '11px', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', zIndex: 3
                    }}
                    title="حذف الصورة"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: VIDEOS (Secondary - Won't slow down the page) */}
        <div style={{ background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '16px', padding: '18px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h4 style={{ fontWeight: 900, fontSize: '15px', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                🎬 فيديو الفستان لهذا اللون ({activeColor})
              </h4>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                ⚡ اختياري — يتم تحميله فقط عند رغبة الزبون لمشاهدة حركة الفستان بدون التأثير على سرعة الموقع.
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <label className="btn-luxe-admin" style={{ cursor: 'pointer', margin: 0, fontSize: '12px', padding: '7px 14px', background: '#1E293B' }}>
                {uploadingType === 'video' ? '⏳ جاري رفع الفيديو...' : '🎥 + رفع مقطع فيديو (MP4)'}
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  disabled={uploadingType !== null}
                  onChange={e => handleFileUpload(e, 'video')}
                  style={{ display: 'none' }}
                />
              </label>
              <button
                type="button"
                onClick={() => handleAddUrlPrompt('video')}
                className="btn-luxe-outline"
                style={{ fontSize: '12px', padding: '7px 12px' }}
              >
                🔗 رابط فيديو
              </button>
            </div>
          </div>

          {currentVideos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94A3B8', fontSize: '13px', background: '#fff', borderRadius: '12px', border: '1.5px dashed #E2E8F0' }}>
              🎥 لا يوجد فيديو لهذا اللون حالياً. يمكنك رفع فيديو اختياري لاستعراض حركة وتفاصيل الفستان.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
              {currentVideos.map((url, idx) => (
                <div key={idx} style={{ position: 'relative', height: '170px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #CBD5E1', background: '#000' }}>
                  <video src={url} controls muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(url)}
                    style={{
                      position: 'absolute', top: '5px', right: '5px', background: '#EF4444', color: '#fff',
                      border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer',
                      fontWeight: '900', fontSize: '11px', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', zIndex: 3
                    }}
                    title="حذف الفيديو"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 3: SIZES (Toggle available/sold out) */}
        <div style={{ background: '#FAF7F2', padding: '18px', borderRadius: '16px', marginBottom: '20px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
          <h4 style={{ fontWeight: 900, fontSize: '14px', marginBottom: '10px', color: '#111827' }}>
            📏 المقاسات المتوفرة للون ({activeColor}):
          </h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {DEFAULT_SIZES.map(size => {
              const isAvailable = !!currentSizes[size];
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  style={{
                    minWidth: '58px',
                    height: '46px',
                    borderRadius: '12px',
                    border: isAvailable ? '2px solid #722F37' : '1.5px dashed #D1D5DB',
                    background: isAvailable ? '#722F37' : '#fff',
                    color: isAvailable ? '#fff' : '#9CA3AF',
                    fontWeight: 900,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    boxShadow: isAvailable ? '0 2px 8px rgba(114, 47, 55, 0.2)' : 'none'
                  }}
                >
                  <span>{size}</span>
                  <span style={{ fontSize: '9px', opacity: 0.85 }}>
                    {isAvailable ? '✓ متوفر' : 'خالص'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" onClick={onClose} className="btn-luxe-outline" style={{ padding: '9px 18px', fontSize: '14px' }}>
            إغلاق
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving || uploadingType !== null}
            className="btn-luxe-admin"
            style={{ fontSize: '14px', padding: '9px 22px', background: '#722F37' }}
          >
            {saving ? '⏳ جاري الحفظ...' : `💾 حفظ وسائط ومقاسات (${activeColor})`}
          </button>
        </div>
      </div>
    </div>
  );
}
