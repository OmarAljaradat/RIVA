'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface VariantForm {
  colorName: string;
  colorCode: string;
  size: string;
  quantity: number;
}

export default function NewProduct() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    isNew: true,
    isFeatured: false,
  });

  const [variants, setVariants] = useState<VariantForm[]>([
    { colorName: '', colorCode: '#800020', size: '38', quantity: 5 },
  ]);

  const addVariant = () => {
    setVariants([...variants, { colorName: '', colorCode: '#800020', size: '38', quantity: 5 }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 1) return;
    const newVariants = [...variants];
    newVariants.splice(index, 1);
    setVariants(newVariants);
  };

  const updateVariant = (index: number, field: keyof VariantForm, value: string | number) => {
    const newVariants = [...variants];
    (newVariants[index] as any)[field] = value;
    setVariants(newVariants);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;
    setSaving(true);

    try {
      const apiVariants = variants.map(v => ({
        color: v.colorName || 'أساسي',
        colorHex: v.colorCode,
        size: v.size,
        quantity: v.quantity,
        imageUrls: [],
      }));

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          isNew: formData.isNew,
          isFeatured: formData.isFeatured,
          variants: apiVariants,
        }),
      });

      if (res.ok) {
        alert('تم إضافة الفستان بنجاح! ✨');
        router.push('/admin/products');
      } else {
        const data = await res.json();
        alert(data.error || 'حدث خطأ أثناء الحفظ');
      }
    } catch {
      alert('حدث خطأ في الاتصال');
    } finally {
      setSaving(false);
    }
  };

  const allSizes = ['34','36','38','40','42','44','46','48','50','XS','S','M','L','XL','XXL','3XL','خالص (نفذت الكمية)'];

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="admin-header">
        <div>
          <h1 className="admin-title">✨ إضافة فستان جديد يدوي</h1>
          <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '4px' }}>
            إضافة فستان جديد يدوياً وتحديد السعر والألوان والمقاسات
          </p>
        </div>
        <button onClick={() => router.back()} className="btn-luxe-outline">
          ← العودة إلى القائمة
        </button>
      </div>

      <div style={{
        background: '#fff',
        borderRadius: '24px',
        padding: '36px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
        border: '1px solid rgba(0,0,0,0.06)'
      }}>
        <form onSubmit={handleSubmit}>
          {/* Main Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#374151', marginBottom: '8px' }}>
                اسم الفستان *
              </label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                placeholder="مثال: فستان كريب فاخر مع شاحط"
                required 
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  borderRadius: '14px',
                  border: '1px solid #D1D5DB',
                  fontSize: '15px',
                  outline: 'none',
                  background: '#F9FAFB',
                  fontWeight: 700
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#374151', marginBottom: '8px' }}>
                السعر (د.أ) *
              </label>
              <input 
                type="number" 
                value={formData.price} 
                onChange={(e) => setFormData({...formData, price: e.target.value})} 
                placeholder="مثال: 25"
                step="0.5" 
                min="0" 
                required 
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  borderRadius: '14px',
                  border: '1px solid #D1D5DB',
                  fontSize: '16px',
                  outline: 'none',
                  background: '#F9FAFB',
                  fontWeight: 900,
                  color: '#722F37'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#374151', marginBottom: '8px' }}>
              وصف الفستان
            </label>
            <textarea 
              rows={3}
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="وصف القماش، التفاصيل، أو الملاحظات..."
              style={{
                width: '100%',
                padding: '14px 18px',
                borderRadius: '14px',
                border: '1px solid #D1D5DB',
                fontSize: '14px',
                outline: 'none',
                background: '#F9FAFB',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', background: '#FAF7F2', padding: '16px 20px', borderRadius: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '14px' }}>
              <input 
                type="checkbox" 
                checked={formData.isNew} 
                onChange={(e) => setFormData({...formData, isNew: e.target.checked})} 
                style={{ width: 20, height: 20, accentColor: '#722F37', cursor: 'pointer' }} 
              />
              ✨ تحديد كمنتج جديد (New Arrival)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '14px' }}>
              <input 
                type="checkbox" 
                checked={formData.isFeatured} 
                onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})} 
                style={{ width: 20, height: 20, accentColor: '#722F37', cursor: 'pointer' }} 
              />
              ⭐ تحديد كمنتج مميز بالصفحة الرئيسية
            </label>
          </div>

          {/* Variants Section */}
          <div style={{ borderTop: '2px solid #F3F4F6', paddingTop: '28px', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '20px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🎨 الألوان والمقاسات المتوفرة
            </h3>
            
            {variants.map((variant, index) => (
              <div key={index} style={{
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                padding: '20px',
                borderRadius: '16px',
                marginBottom: '16px',
                position: 'relative'
              }}>
                {variants.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeVariant(index)} 
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: '#FEF2F2',
                      color: '#EF4444',
                      border: '1px solid #FCA5A5',
                      borderRadius: '8px',
                      padding: '4px 10px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 800
                    }}
                  >
                    ✕ حذف
                  </button>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr 1fr', gap: '16px', alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#4B5563', marginBottom: '6px' }}>
                      اسم اللون (مثال: خمري)
                    </label>
                    <input 
                      type="text" 
                      value={variant.colorName} 
                      onChange={(e) => updateVariant(index, 'colorName', e.target.value)} 
                      placeholder="مثال: كحلي"
                      required 
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid #D1D5DB',
                        fontSize: '14px',
                        background: '#fff',
                        fontWeight: 700
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#4B5563', marginBottom: '6px' }}>
                      كود اللون
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="color" 
                        value={variant.colorCode} 
                        onChange={(e) => updateVariant(index, 'colorCode', e.target.value)} 
                        style={{ width: 40, height: 38, border: 'none', background: 'transparent', cursor: 'pointer' }} 
                      />
                      <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 700 }}>{variant.colorCode}</span>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#4B5563', marginBottom: '6px' }}>
                      المقاس
                    </label>
                    <select 
                      value={variant.size} 
                      onChange={(e) => updateVariant(index, 'size', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid #D1D5DB',
                        fontSize: '14px',
                        background: '#fff',
                        fontWeight: 700
                      }}
                    >
                      {allSizes.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#4B5563', marginBottom: '6px' }}>
                      الكمية المخزنة
                    </label>
                    <input 
                      type="number" 
                      value={variant.quantity} 
                      onChange={(e) => updateVariant(index, 'quantity', parseInt(e.target.value) || 0)} 
                      min="0" 
                      required 
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid #D1D5DB',
                        fontSize: '14px',
                        background: '#fff',
                        fontWeight: 800
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button 
              type="button" 
              onClick={addVariant} 
              className="btn-luxe-outline"
              style={{ fontSize: '13px', marginTop: '8px' }}
            >
              + إضافة لون أو مقاس آخر
            </button>
          </div>

          <button 
            type="submit" 
            className="btn-luxe-admin" 
            style={{ width: '100%', padding: '16px', justifyContent: 'center', fontSize: '16px' }}
            disabled={saving}
          >
            {saving ? '⏳ جاري الحفظ...' : '✨ إضافة الفستان الآن'}
          </button>
        </form>
      </div>
    </div>
  );
}
