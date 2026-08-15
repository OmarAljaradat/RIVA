'use client';

import { useState } from 'react';

interface SizeCalculatorProps {
  onClose: () => void;
  onSelectSize?: (size: string) => void;
}

export default function SizeCalculatorModal({ onClose, onSelectSize }: SizeCalculatorProps) {
  const [weight, setWeight] = useState<string>('58');
  const [height, setHeight] = useState<string>('162');
  const [calculated, setCalculated] = useState<{
    numericSize: string;
    letterSize: string;
    note: string;
    alternativeSize?: string;
  } | null>(null);

  const calculateSize = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight);
    const h = parseFloat(height);

    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return;

    // 1. Base Numeric Size determination by weight
    let numericBaseIndex = 0; // 0: 36, 1: 38, 2: 40, 3: 42, 4: 44, 5: 46, 6: 48, 7: 50, 8: 52
    let nearAlternative = '';

    if (w <= 49) {
      numericBaseIndex = 0; // 36
      if (w >= 48) nearAlternative = '38';
    } else if (w <= 56) {
      numericBaseIndex = 1; // 38
      if (w <= 51) nearAlternative = '36';
      else if (w >= 55) nearAlternative = '40';
    } else if (w <= 61) {
      numericBaseIndex = 2; // 40
      if (w <= 58) nearAlternative = '38';
      else if (w >= 60) nearAlternative = '42';
    } else if (w <= 67) {
      numericBaseIndex = 3; // 42
      if (w <= 63) nearAlternative = '40';
      else if (w >= 66) nearAlternative = '44';
    } else if (w <= 74) {
      numericBaseIndex = 4; // 44
      if (w <= 69) nearAlternative = '42';
      else if (w >= 73) nearAlternative = '46';
    } else if (w <= 79) {
      numericBaseIndex = 5; // 46
      if (w <= 76) nearAlternative = '44';
      else if (w >= 78) nearAlternative = '48';
    } else if (w <= 84) {
      numericBaseIndex = 6; // 48
      if (w <= 81) nearAlternative = '46';
      else if (w >= 83) nearAlternative = '50';
    } else if (w <= 89) {
      numericBaseIndex = 7; // 50
      if (w <= 86) nearAlternative = '48';
      else if (w >= 88) nearAlternative = '52';
    } else {
      numericBaseIndex = 8; // 52
      if (w <= 91) nearAlternative = '50';
    }

    // 2. Adjust for height (Standard = 158 to 165 cm)
    // Taller than 165 -> Shift 1 size down (smaller size)
    // Shorter than 158 -> Shift 1 size up (larger size)
    let finalNumericIdx = numericBaseIndex;
    let heightAdjustmentNote = '';

    if (h > 165) {
      finalNumericIdx = Math.max(0, numericBaseIndex - 1);
      heightAdjustmentNote = 'تم مراعاة طولكِ الفارع (أكبر من 165 سم)، حيث يتركز الوزن بطول أكبر فاخترنا لكِ مقاساً أرقَّ تناسباً.';
    } else if (h < 158) {
      finalNumericIdx = Math.min(8, numericBaseIndex + 1);
      heightAdjustmentNote = 'تم مراعاة طولكِ النحيل (أقل من 158 سم) لاختيار المقاس المريح تماماً لكِ.';
    } else {
      heightAdjustmentNote = 'طولكِ مثالي ضمن المتوسط (158 - 165 سم).';
    }

    const numericSizes = ['36', '38', '40', '42', '44', '46', '48', '50', '52'];
    const letterSizesMap: Record<string, string> = {
      '36': 'S',
      '38': 'S / M',
      '40': 'M',
      '42': 'L',
      '44': 'XL',
      '46': 'XL / 2XL',
      '48': '2XL',
      '50': '3XL',
      '52': '3XL+',
    };

    const finalNumeric = numericSizes[finalNumericIdx];
    const finalLetter = letterSizesMap[finalNumeric] || 'M';

    setCalculated({
      numericSize: finalNumeric,
      letterSize: finalLetter,
      note: heightAdjustmentNote,
      alternativeSize: nearAlternative && nearAlternative !== finalNumeric ? nearAlternative : undefined,
    });
  };

  return (
    <div className="modal-overlay-insta" onClick={onClose}>
      <div className="modal-content-luxe" onClick={e => e.stopPropagation()} style={{ padding: '36px', maxWidth: '540px', width: '92%' }}>
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>📏✨</div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#111827', fontFamily: 'Playfair Display, serif' }}>
            حاسبة المقاس المثالي لـ RIVA
          </h2>
          <p style={{ color: '#6B7280', fontSize: '13px', marginTop: '4px' }}>
            أدخلي وزنك وطولك لنحسب لكِ المقاس الأنسب بدقة مع مراعاة تفصيل الفستان
          </p>
        </div>

        <form onSubmit={calculateSize} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#374151', marginBottom: '8px' }}>
                الوزن الحالي (كغم) *
              </label>
              <input 
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="مثال: 58"
                min="35"
                max="140"
                required
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '14px',
                  border: '1px solid #D1D5DB',
                  fontSize: '16px',
                  fontWeight: 900,
                  textAlign: 'center',
                  background: '#F9FAFB'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#374151', marginBottom: '8px' }}>
                الطول (سم) *
              </label>
              <input 
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="مثال: 162"
                min="130"
                max="200"
                required
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '14px',
                  border: '1px solid #D1D5DB',
                  fontSize: '16px',
                  fontWeight: 900,
                  textAlign: 'center',
                  background: '#F9FAFB'
                }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-luxe-admin" 
            style={{ width: '100%', padding: '14px', justifyContent: 'center', fontSize: '16px' }}
          >
            ✨ احسبي مقاسي المثالي الآن
          </button>
        </form>

        {calculated && (
          <div style={{
            marginTop: '28px',
            background: '#FAF7F2',
            border: '2px solid rgba(212, 175, 55, 0.4)',
            padding: '24px',
            borderRadius: '20px',
            textAlign: 'center',
            boxShadow: '0 4px 16px rgba(114, 47, 55, 0.08)'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#722F37', letterSpacing: '1px', textTransform: 'uppercase' }}>
              RECOMMENDED FIT
            </span>
            <h3 style={{ fontSize: '32px', fontWeight: 900, color: '#722F37', margin: '6px 0' }}>
              مقاسكِ الأنسب: <span style={{ color: '#111827' }}>{calculated.numericSize}</span> ({calculated.letterSize})
            </h3>
            
            <p style={{ color: '#4B5563', fontSize: '13px', margin: '8px 0 16px', lineHeight: 1.6 }}>
              {calculated.note}
            </p>

            {calculated.alternativeSize && (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '10px 14px', borderRadius: '12px', fontSize: '12px', color: '#92400E', fontWeight: 800, marginBottom: '16px' }}>
                💡 نصيحة ريفا: قريبة أيضاً من مقاس ({calculated.alternativeSize})؛ إذا كنتِ تفضلين الفستان مشدوداً يمكنكِ اختيار الأصغر، أو الأكبر للراحة.
              </div>
            )}

            {onSelectSize && (
              <button 
                onClick={() => {
                  onSelectSize(calculated.numericSize);
                  onClose();
                }}
                className="btn-luxe-admin"
                style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: '14px' }}
              >
                ✓ اختيار مقاس {calculated.numericSize} للفستان مباشرة
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
