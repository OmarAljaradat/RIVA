'use client';
import { useState, useEffect } from 'react';

const STANDARD_SIZES = ['36', '38', '40', '42', '44', '46', '48', '50'];

interface ProductVariant {
  id: number;
  color: string;
  colorHex: string;
  size: string;
  quantity: number;
  images: { url: string }[];
}

interface Product {
  id: number;
  name: string;
  price: number;
  telegramMsgId?: number;
  variants: ProductVariant[];
}

interface Props {
  product: Product;
  onClose: () => void;
  onUpdate: () => void;
}

export default function AdminMediaManagerModalV2({ product, onClose, onUpdate }: Props) {
  const [colors, setColors] = useState<string[]>([]);
  const [activeColor, setActiveColor] = useState<string>('');
  
  // Media map: color -> string[] of URLs
  const [mediaMap, setMediaMap] = useState<Record<string, string[]>>({});
  // Size map: color -> { [size]: boolean }
  const [sizeMap, setSizeMap] = useState<Record<string, Record<string, boolean>>>({});
  
  const [uploadingType, setUploadingType] = useState<'photo' | 'video' | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Direct URL inline inputs
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [customVideoUrl, setCustomVideoUrl] = useState('');

  useEffect(() => {
    const colorSet = new Set<string>();
    const initialMedia: Record<string, string[]> = {};
    const initialSizes: Record<string, Record<string, boolean>> = {};

    product.variants.forEach(v => {
      colorSet.add(v.color);
      
      if (!initialMedia[v.color]) {
        initialMedia[v.color] = [];
      }
      v.images.forEach(img => {
        if (!initialMedia[v.color].includes(img.url)) {
          initialMedia[v.color].push(img.url);
        }
      });

      if (!initialSizes[v.color]) {
        initialSizes[v.color] = {};
      }
      if (v.quantity > 0) {
        initialSizes[v.color][v.size] = true;
      }
    });

    const colorList = Array.from(colorSet);
    setColors(colorList);
    if (colorList.length > 0) {
      setActiveColor(colorList[0]);
    }
    setMediaMap(initialMedia);
    setSizeMap(initialSizes);
  }, [product]);

  const isVideoUrl = (url: string) => {
    return url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') || url.startsWith('data:video');
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

  const uploadVideoChunked = async (file: File): Promise<string> => {
    const CHUNK_SIZE = 1024 * 1024; // 1MB per chunk for 100% stability
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const uploadId = 'up_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunkBlob = file.slice(start, end);

      const formData = new FormData();
      formData.append('chunk', chunkBlob, file.name);
      formData.append('chunkIndex', chunkIndex.toString());
      formData.append('totalChunks', totalChunks.toString());
      formData.append('uploadId', uploadId);
      formData.append('fileName', file.name);

      setUploadProgress(Math.round(((chunkIndex + 1) / totalChunks) * 100));

      const res = await fetch('/api/upload/chunk', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || `خطأ في معالجة الجزء (${chunkIndex + 1}/${totalChunks})`);
      }

      if (data.url) {
        return data.url;
      }
    }

    throw new Error('لم يتم استلام رابط الفيديو المرفوع');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'video') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingType(type);
    setUploadProgress(0);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (type === 'photo') {
          const dataUrl = await processImageFile(file);
          newUrls.push(dataUrl);
        } else {
          const videoUrl = await uploadVideoChunked(file);
          newUrls.push(videoUrl);
        }
      }

      if (newUrls.length > 0) {
        setMediaMap(prev => {
          const existing = prev[activeColor] || [];
          if (type === 'photo') {
            return { ...prev, [activeColor]: [...newUrls, ...existing] };
          } else {
            return { ...prev, [activeColor]: [...existing, ...newUrls] };
          }
        });
      }
    } catch (err: any) {
      alert(`حدث خطأ أثناء معالجة الملف: ${err?.message || 'يرجى المحاولة مرة أخرى أو وضع رابط مباشر'}`);
    } finally {
      setUploadingType(null);
      setUploadProgress(null);
      e.target.value = '';
    }
  };

  const handleRemoveMedia = (urlToRemove: string) => {
    setMediaMap(prev => ({
      ...prev,
      [activeColor]: (prev[activeColor] || []).filter(u => u !== urlToRemove),
    }));
  };

  const handleAddDirectUrl = (type: 'photo' | 'video') => {
    const targetUrl = type === 'photo' ? customPhotoUrl.trim() : customVideoUrl.trim();
    if (!targetUrl) return;

    setMediaMap(prev => ({
      ...prev,
      [activeColor]: [...(prev[activeColor] || []), targetUrl],
    }));

    if (type === 'photo') setCustomPhotoUrl('');
    else setCustomVideoUrl('');
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const currentUrls = mediaMap[activeColor] || [];
      const res = await fetch(`/api/products/${product.id}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          color: activeColor,
          imageUrls: currentUrls,
          mediaMap,
          sizeMap,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'فشل حفظ التعديلات');
      }

      setSaveSuccess(true);
      setTimeout(() => {
        onUpdate();
        onClose();
      }, 700);
    } catch (err: any) {
      alert(`خطأ في الحفظ: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px',
      direction: 'rtl',
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '24px',
        maxWidth: '880px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        border: '1px solid #E2E8F0',
        padding: '24px',
        position: 'relative',
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: '#F1F5F9',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            cursor: 'pointer',
            fontSize: '18px',
            color: '#64748B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
        >
          ✕
        </button>

        {/* Modal Header */}
        <div style={{ marginBottom: '18px', borderBottom: '1.5px solid #F1F5F9', paddingBottom: '14px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ECFDF5', border: '1px solid #10B981', padding: '4px 12px', borderRadius: '8px', color: '#065F46', fontSize: '12px', fontWeight: 800, marginBottom: '6px' }}>
            🟢 ستوديو إدارة الوسائط والمقاسات (V2.7) — رفع فوري متعدد الخيارات
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#0F172A', margin: '4px 0' }}>
            🎨 صور وفيديوهات ومقاسات اللون: <span style={{ color: '#722F37' }}>({activeColor})</span>
          </h2>
          <p style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>
            الفستان: <strong>{product.name}</strong> ({product.price} د.أ)
          </p>
        </div>

        {/* Color Tabs */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px' }}>
          {colors.map(color => {
            const isActive = color === activeColor;
            const photoCount = (mediaMap[color] || []).filter(u => !isVideoUrl(u)).length;
            const videoCount = (mediaMap[color] || []).filter(u => isVideoUrl(u)).length;

            return (
              <button
                key={color}
                type="button"
                onClick={() => setActiveColor(color)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '14px',
                  border: isActive ? '2px solid #722F37' : '1.5px solid #E2E8F0',
                  background: isActive ? '#FFF1F2' : '#FFFFFF',
                  color: isActive ? '#722F37' : '#334155',
                  fontWeight: isActive ? 900 : 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{color}</span>
                <span style={{
                  fontSize: '11px',
                  padding: '2px 7px',
                  borderRadius: '10px',
                  background: isActive ? '#722F37' : '#F1F5F9',
                  color: isActive ? '#FFFFFF' : '#64748B',
                  fontWeight: 800,
                }}>
                  {photoCount} 📸 | {videoCount} 🎬
                </span>
              </button>
            );
          })}
        </div>

        {/* SECTION 1: PHOTOS */}
        <div style={{ background: '#FAF7F2', border: '1.5px solid rgba(212, 175, 55, 0.3)', borderRadius: '16px', padding: '18px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h4 style={{ fontWeight: 900, fontSize: '15px', color: '#722F37', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                📸 صور الفستان لهذا اللون ({activeColor})
              </h4>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                ✨ الصورة الأولى ستكون الغلاف الرئيسي المعروض في المتجر.
              </span>
            </div>
            <label className="btn-luxe-admin" style={{ cursor: 'pointer', margin: 0, fontSize: '12px', padding: '8px 16px', background: '#722F37' }}>
              {uploadingType === 'photo' ? '⏳ جاري إضافة الصور...' : '🖼️ + رفع صورة من جهازك'}
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                disabled={uploadingType !== null}
                onChange={e => handleFileUpload(e, 'photo')}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* Direct Photo URL Input Bar */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <input
              type="text"
              value={customPhotoUrl}
              onChange={e => setCustomPhotoUrl(e.target.value)}
              placeholder="أو الصق رابط صورة مباشر هنا (https://...)..."
              onKeyDown={e => { if (e.key === 'Enter') handleAddDirectUrl('photo'); }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid #D1D5DB',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => handleAddDirectUrl('photo')}
              disabled={!customPhotoUrl.trim()}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: 'none',
                background: '#722F37',
                color: '#fff',
                fontWeight: 800,
                fontSize: '12px',
                cursor: customPhotoUrl.trim() ? 'pointer' : 'not-allowed',
                opacity: customPhotoUrl.trim() ? 1 : 0.6,
              }}
            >
              + إضافة الرابط
            </button>
          </div>

          {currentPhotos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94A3B8', fontSize: '13px', background: '#FFFFFF', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
              🖼️ لا توجد صور لهذا اللون بعد.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '12px' }}>
              {currentPhotos.map((url, idx) => (
                <div key={idx} style={{ position: 'relative', height: '140px', borderRadius: '10px', overflow: 'hidden', border: idx === 0 ? '2.5px solid #722F37' : '1px solid #E2E8F0', background: '#fff' }}>
                  {idx === 0 && (
                    <span style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(114,47,55,0.9)', color: '#fff', fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', zIndex: 2 }}>
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

        {/* SECTION 2: VIDEOS */}
        <div style={{ background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '16px', padding: '18px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h4 style={{ fontWeight: 900, fontSize: '15px', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                🎬 فيديو الفستان لهذا اللون ({activeColor})
              </h4>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                ⚡ يمكنك رفع فيديو من جهازك مباشرة، أو لصق رابط فيديو مباشر (MP4).
              </span>
            </div>
            <label className="btn-luxe-admin" style={{ cursor: 'pointer', margin: 0, fontSize: '12px', padding: '8px 18px', background: '#1E293B', borderRadius: '10px' }}>
              {uploadingType === 'video' ? (uploadProgress !== null ? `⏳ جاري رفع الفيديو (${uploadProgress}%)...` : '⏳ جاري الرفع...') : '🎥 + رفع مقطع فيديو (MP4)'}
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/*"
                disabled={uploadingType !== null}
                onChange={e => handleFileUpload(e, 'video')}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* Direct Video URL Input Bar */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <input
              type="text"
              value={customVideoUrl}
              onChange={e => setCustomVideoUrl(e.target.value)}
              placeholder="أو الصق رابط فيديو مباشر هنا (https://...mp4)..."
              onKeyDown={e => { if (e.key === 'Enter') handleAddDirectUrl('video'); }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => handleAddDirectUrl('video')}
              disabled={!customVideoUrl.trim()}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: 'none',
                background: '#1E293B',
                color: '#fff',
                fontWeight: 800,
                fontSize: '12px',
                cursor: customVideoUrl.trim() ? 'pointer' : 'not-allowed',
                opacity: customVideoUrl.trim() ? 1 : 0.6,
              }}
            >
              + إضافة الفيديو
            </button>
          </div>

          {currentVideos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94A3B8', fontSize: '13px', background: '#FFFFFF', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
              🎥 لا يوجد فيديو لهذا اللون حالياً.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {currentVideos.map((url, idx) => (
                <div key={idx} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #0F172A', background: '#000' }}>
                  <video
                    src={url}
                    controls
                    playsInline
                    style={{ width: '100%', height: '220px', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(url)}
                    style={{
                      position: 'absolute', top: '8px', right: '8px', background: '#EF4444', color: '#fff',
                      border: 'none', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer',
                      fontWeight: '900', fontSize: '13px', boxShadow: '0 2px 6px rgba(0,0,0,0.5)', zIndex: 5
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

        {/* SECTION 3: SIZES */}
        <div style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '16px', padding: '18px', marginBottom: '20px' }}>
          <h4 style={{ fontWeight: 900, fontSize: '14px', color: '#334155', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            📏 المقاسات المتوفرة للون ({activeColor}):
          </h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {STANDARD_SIZES.map(size => {
              const isAvailable = !!currentSizes[size];
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: isAvailable ? '2px solid #722F37' : '1.5px solid #CBD5E1',
                    background: isAvailable ? '#722F37' : '#F8FAFC',
                    color: isAvailable ? '#FFFFFF' : '#94A3B8',
                    fontWeight: 900,
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minWidth: '55px',
                  }}
                >
                  <span>{size}</span>
                  <span style={{ fontSize: '9px', opacity: 0.85 }}>{isAvailable ? 'متوفر' : 'خالص'}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Save Footer */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center', borderTop: '1.5px solid #F1F5F9', paddingTop: '16px' }}>
          {saveSuccess && (
            <span style={{ color: '#059669', fontWeight: 800, fontSize: '14px' }}>
              ✓ تم الحفظ بنجاح!
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              border: '1.5px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#475569',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            إغلاق
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 28px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #722F37 0%, #4A1C22 100%)',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: '14px',
              cursor: saving ? 'wait' : 'pointer',
              boxShadow: '0 4px 14px rgba(114, 47, 55, 0.35)',
            }}
          >
            {saving ? '⏳ جاري الحفظ...' : `💾 حفظ وسائط ومقاسات (${activeColor})`}
          </button>
        </div>
      </div>
    </div>
  );
}
