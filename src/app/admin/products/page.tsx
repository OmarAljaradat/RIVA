'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminMediaManagerModal from '@/components/AdminMediaManagerModal';

interface Product {
  id: number;
  name: string;
  nickname?: string;
  price: number;
  isNew: boolean;
  isFeatured: boolean;
  sortOrder?: number;
  variants: {
    id: number;
    color: string;
    colorHex: string;
    size: string;
    quantity: number;
    images: { url: string }[];
  }[];
}

// Inline nickname editor component
function NicknameEditor({ productId, initialNickname, onSaved }: {
  productId: number;
  initialNickname: string;
  onSaved: (nickname: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialNickname);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: value }),
      });
      onSaved(value);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div style={{ display: 'flex', gap: '4px', marginTop: '6px', alignItems: 'center' }}>
        <input
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
          placeholder="اللقب الداخلي..."
          style={{
            padding: '4px 8px', borderRadius: '6px', border: '1.5px solid #722F37',
            fontSize: '12px', fontWeight: 700, width: '130px', outline: 'none'
          }}
        />
        <button onClick={save} disabled={saving} style={{ background: '#722F37', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>
          {saving ? '...' : '✓'}
        </button>
        <button onClick={() => setEditing(false)} style={{ background: '#F3F4F6', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}>✕</button>
      </div>
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      title="اضغط لتعديل اللقب الداخلي"
      style={{
        marginTop: '5px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px',
        background: value ? '#FFF7ED' : '#F9FAFB',
        border: `1px dashed ${value ? '#F59E0B' : '#D1D5DB'}`,
        borderRadius: '6px', padding: '3px 8px'
      }}
    >
      <span style={{ fontSize: '11px', fontWeight: 800, color: value ? '#92400E' : '#9CA3AF' }}>
        {value ? `🏷️ ${value}` : '+ أضف لقب داخلي'}
      </span>
    </div>
  );
}

export default function ProductsList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductForMedia, setSelectedProductForMedia] = useState<Product | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiText, setAiText] = useState('');
  const [parsingAi, setParsingAi] = useState(false);
  const [aiError, setAiError] = useState('');
  const [syncingSizes, setSyncingSizes] = useState(false);

  const handleSyncSizes = async () => {
    if (syncingSizes) return;
    setSyncingSizes(true);
    try {
      const res = await fetch('/api/admin/sync-sizes', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`✅ تم فحص ومطابقة المقاسات مع تيليجرام بنجاح!\n• إجمالي الفساتين المفحوصة: ${data.totalScannedDresses}\n• فساتين تم تحديث مخزونها: ${data.updatedDressesCount}`);
        fetchProducts();
      } else {
        alert(`⚠️ تنبيه: ${data.error || 'فشلت المزامنة'}`);
      }
    } catch (err: any) {
      alert(`❌ خطأ في الاتصال: ${err.message}`);
    } finally {
      setSyncingSizes(false);
    }
  };

  const fetchProducts = () => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الفستان؟')) return;
    
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts(products.filter(p => p.id !== id));
      } else {
        alert('حدث خطأ أثناء الحذف');
      }
    } catch {
      alert('حدث خطأ في الاتصال');
    }
  };

  // Reorder dresses handler (Up, Down, Top)
  const handleMove = (index: number, direction: 'up' | 'down' | 'top') => {
    const updated = [...products];
    if (direction === 'up' && index > 0) {
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
    } else if (direction === 'down' && index < updated.length - 1) {
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
    } else if (direction === 'top' && index > 0) {
      const [item] = updated.splice(index, 1);
      updated.unshift(item);
    }
    setProducts(updated);

    // Save new sorting order immediately to database
    const orderedIds = updated.map(p => p.id);
    fetch('/api/products/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds })
    }).catch(console.error);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
      {/* Parisian White Header */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid rgba(212, 175, 55, 0.4)',
        borderRadius: '24px',
        padding: '24px 32px',
        marginBottom: '28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#111827', margin: 0, fontFamily: "'Thmanyah Sans', sans-serif" }}>
              👗 ترتيب وإدارة كتالوج الفساتين
            </h1>
            <span style={{ background: '#ECFDF5', border: '1px solid #10B981', color: '#065F46', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px' }}>
              v2.5 (الرفع اليدوي المباشر)
            </span>
          </div>
          <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '4px' }}>
            يمكنك إعادة ترتيب ظهور الفساتين بالكتالوج بالضغط على أزرار الترتيب (⬆️ للأعلى / 🥇 في البداية)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={handleSyncSizes}
            disabled={syncingSizes}
            style={{
              background: syncingSizes ? '#9CA3AF' : '#059669',
              color: '#fff',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '16px',
              fontWeight: 800,
              fontSize: '14px',
              cursor: syncingSizes ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(5,150,105,0.3)',
              transition: 'all 0.2s'
            }}
          >
            <span>{syncingSizes ? '⏳' : '🔄'}</span>
            <span>{syncingSizes ? 'جاري المزامنة...' : 'مزامنة المقاسات مع تيليجرام'}</span>
          </button>
          <button 
            onClick={() => setShowAiModal(true)} 
            style={{
              background: 'linear-gradient(135deg, #FAF7F2 0%, #FFFDF9 100%)',
              border: '1px solid rgba(212, 175, 55, 0.6)',
              color: '#722F37',
              padding: '12px 20px',
              borderRadius: '16px',
              fontWeight: 900,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>🤖</span>
            <span>إضافة بالذكاء الاصطناعي</span>
          </button>
          <Link 
            href="/admin/products/new" 
            style={{
              background: 'linear-gradient(135deg, #722F37 0%, #4A1C22 100%)',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '16px',
              fontWeight: 800,
              fontSize: '14px',
              textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(114, 47, 55, 0.3)'
            }}
          >
            ✨ إضافة فستان جديد
          </Link>
        </div>
      </div>

      {/* Table with Custom Reordering Controls */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr style={{ background: '#FAF7F2', color: '#4B5563', fontSize: '12px', textTransform: 'uppercase', borderBottom: '1px solid #E5E7EB' }}>
              <th style={{ padding: '16px 20px', textAlign: 'center' }}>الترتيب</th>
              <th style={{ padding: '16px 24px' }}>المعاينة</th>
              <th style={{ padding: '16px 24px' }}>اسم الفستان</th>
              <th style={{ padding: '16px 24px' }}>سعر البيع</th>
              <th style={{ padding: '16px 24px' }}>الألوان المتوفرة</th>
              <th style={{ padding: '16px 24px' }}>إدارة ميديا اللون</th>
              <th style={{ padding: '16px 24px' }}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF', fontSize: '15px' }}>
                  ⏳ لا توجد فساتين حالياً في المتجر المباشر
                </td>
              </tr>
            ) : (
              products.map((product, idx) => {
                const uniqueColors = [...new Set(product.variants.map(v => v.colorHex))];
                const firstImage = product.variants[0]?.images[0]?.url || '/uploads/dress1.jpg';
                const isFirstVid = firstImage.endsWith('.mp4') || firstImage.endsWith('.webm');
                
                return (
                  <tr key={product.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    {/* Position & Order Control Column */}
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 900, color: '#722F37', background: '#FFFDF9', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(212,175,55,0.4)' }}>
                          #{idx + 1}
                        </span>
                        <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                          <button
                            disabled={idx === 0}
                            onClick={() => handleMove(idx, 'up')}
                            title="رفع للأعلى"
                            style={{ padding: '2px 6px', fontSize: '12px', borderRadius: '4px', border: '1px solid #D1D5DB', background: '#fff', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.3 : 1 }}
                          >
                            ⬆️
                          </button>
                          <button
                            disabled={idx === products.length - 1}
                            onClick={() => handleMove(idx, 'down')}
                            title="تنزيل لأسفل"
                            style={{ padding: '2px 6px', fontSize: '12px', borderRadius: '4px', border: '1px solid #D1D5DB', background: '#fff', cursor: idx === products.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === products.length - 1 ? 0.3 : 1 }}
                          >
                            ⬇️
                          </button>
                          <button
                            disabled={idx === 0}
                            onClick={() => handleMove(idx, 'top')}
                            title="جعله بالبداية"
                            style={{ padding: '2px 6px', fontSize: '12px', borderRadius: '4px', border: '1px solid rgba(212,175,55,0.5)', background: '#FFFDF9', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.3 : 1 }}
                          >
                            🥇
                          </button>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ width: 54, height: 72, borderRadius: '10px', overflow: 'hidden', background: '#000', border: '1px solid #E5E7EB' }}>
                        {isFirstVid ? (
                          <video src={firstImage} muted autoPlay loop style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <img 
                            src={firstImage} 
                            alt={product.name} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 800, fontSize: '14px', color: '#111827' }}>{product.name}</div>
                      <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>ID: #{product.id}</div>
                      {/* Nickname inline edit */}
                      <NicknameEditor productId={product.id} initialNickname={product.nickname || ''} onSaved={(nn) => {
                        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, nickname: nn } : p));
                      }} />
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ fontWeight: 900, color: '#722F37', fontSize: '18px' }}>
                        {product.price} <span style={{ fontSize: '13px', color: '#6B7280' }}>د.أ</span>
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {uniqueColors.map((hex, i) => (
                          <span 
                            key={i} 
                            style={{ 
                              width: '16px', 
                              height: '16px', 
                              borderRadius: '50%', 
                              background: hex,
                              border: '1px solid rgba(0,0,0,0.2)',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
                            }} 
                          />
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <button
                        onClick={() => setSelectedProductForMedia(product)}
                        style={{
                          background: '#FFFDF9',
                          border: '1px solid rgba(212, 175, 55, 0.4)',
                          color: '#722F37',
                          padding: '6px 14px',
                          borderRadius: '10px',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                        }}
                      >
                        <span>🎨</span>
                        <span>صور وألوان الفستان</span>
                      </button>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link 
                          href={`/admin/products/${product.id}/edit`}
                          style={{
                            padding: '6px 14px',
                            background: '#F3F4F6',
                            color: '#374151',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 800,
                            textDecoration: 'none',
                            border: '1px solid #E5E7EB'
                          }}
                        >
                          تعديل ✏️
                        </Link>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          style={{
                            padding: '6px 14px',
                            background: '#FEF2F2',
                            color: '#DC2626',
                            border: '1px solid #FCA5A5',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          حذف 🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Media Manager Modal */}
      {selectedProductForMedia && (
        <AdminMediaManagerModal
          product={selectedProductForMedia}
          onClose={() => setSelectedProductForMedia(null)}
          onUpdate={fetchProducts}
        />
      )}

      {/* AI Dress Parser Modal */}
      {showAiModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '24px',
            maxWidth: '600px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            direction: 'rtl'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#722F37', margin: 0 }}>
                🤖 إضافة فستان بالذكاء الاصطناعي
              </h2>
              <button 
                onClick={() => setShowAiModal(false)}
                style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px', lineHeight: 1.6 }}>
              انسخ نص الفستان من قناة التيليجرام والصقه بالأسفل، وسيتم استخراج اسم الفستان والألوان والمقاسات وحساب سعر البيع تلقائياً وحفظه بالكتالوج ✨
            </p>

            <textarea
              rows={6}
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              placeholder={`انسخ وانصق نص المنشور هنا، مثال:
الوصف : قماش كريب مع دانتيل
اللوان و السايزات لكل لون :
اسود 🖤 38 40
خمري ❤️
السعر : 25 jd`}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '16px',
                border: '1px solid #D1D5DB',
                fontSize: '14px',
                fontFamily: 'inherit',
                marginBottom: '16px',
                outline: 'none'
              }}
            />

            {aiError && (
              <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '12px', color: '#991B1B', fontSize: '13px', marginBottom: '16px' }}>
                ⚠️ {aiError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAiModal(false)}
                style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid #D1D5DB', background: '#fff', cursor: 'pointer', fontWeight: 700 }}
              >
                إلغاء
              </button>

              <button
                disabled={parsingAi || !aiText.trim()}
                onClick={async () => {
                  setParsingAi(true);
                  setAiError('');
                  try {
                    const res = await fetch('/api/admin/parse-ai', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ text: aiText, autoSave: true })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'فشل معالجة النص');

                    alert('🎉 تم تحليل الفستان وحفظه بالكتالوج بنجاح بواسطة الذكاء الاصطناعي!');
                    setAiText('');
                    setShowAiModal(false);
                    fetchProducts();
                  } catch (err: any) {
                    setAiError(err.message || 'حدث خطأ غير متوقع');
                  } finally {
                    setParsingAi(false);
                  }
                }}
                style={{
                  padding: '10px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #722F37 0%, #4A1C22 100%)',
                  color: '#fff',
                  cursor: parsingAi ? 'wait' : 'pointer',
                  fontWeight: 900,
                  fontSize: '14px',
                  opacity: parsingAi || !aiText.trim() ? 0.6 : 1
                }}
              >
                {parsingAi ? '⏳ جاري التحليل بالحاسوب الذكي...' : '✨ تحليل وإضافة بالكتالوج'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
