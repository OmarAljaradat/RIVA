'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function TelegramImportInspectorPage() {
  const [rawInput, setRawInput] = useState('');
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const samplePosts = [
    `✨ وصل حديثاً فستان شيفون راقي مبطن بالكامل ✨\nالسعر: 20 دينار\nالوان: خمري، كحلي، اسود\nالمقاسات: 38 40 42 44 46\nتوصيل ميسر لجميع المحافظات 🚚`,
    `👑 طقم قطعتين فاخر قماش كريب رويال 👑\nالسعر 30 د.أ\nالألوان المتاحة: عنابي / اسود / بيج\nالمقاسات: 36 38 40 42`,
    `👗 فستان مخمل ملكي تطريز يدوي 👗\nالسعر: 24 دينار\nالوان: كحلي، خمري، زيتي\nالمقاسات: 40 42 44`,
    `🌸 فستان شيفون طبقات مطرز 🌸\nالسعر 35 د.أ\nالألوان: وردي / بيج / اسود\nالمقاسات: 38 40 42 44`,
    `💎 فستان سهرة ساتان ميكادو فاخر 💎\nالسعر: 22 دينار\nالوان: ذهبي، زيتي، خمري\nالمقاسات: 36 38 40`,
    `✨ عباية فستان ملكية بقصة فرنسية ✨\nالسعر 28 د.أ\nالوان: اسود، كحلي، بني\nالمقاسات: 38 40 42 44 46`
  ];

  const handleParseText = () => {
    const textToProcess = rawInput.trim() || samplePosts.join('\n---\n');
    const postsArray = textToProcess.split(/---|\n\n\n/).map(p => ({
      caption: p.trim(),
      imageUrls: ['/uploads/dress1.jpg', '/uploads/dress2.jpg']
    })).filter(p => p.caption.length > 5);

    setLoading(true);
    fetch('/api/admin/import-telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ posts: postsArray })
    })
      .then(res => res.json())
      .then(data => {
        if (data.products) setParsedItems(data.products);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handlePublishAll = () => {
    if (parsedItems.length === 0) return;
    setPublishing(true);
    fetch('/api/admin/import-telegram', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvedProducts: parsedItems })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSuccessMsg(data.message);
          setParsedItems([]);
        }
      })
      .catch(console.error)
      .finally(() => setPublishing(false));
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const updated = [...parsedItems];
    updated[index][field] = value;
    setParsedItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setParsedItems(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', background: '#fff', padding: '24px 32px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🤖</span>
            <span>مُحرك السحب الذكي ومختبر التدقيق (Telegram Smart Inspector)</span>
          </h1>
          <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '4px' }}>
            استخراج تلقائي دقيق للموديلات والأسعار والألوان، مع شاشة تدقيق لمنع أي خطأ قبل النشر للمتجر!
          </p>
        </div>
        <Link href="/admin/products" style={{ background: '#FAF7F2', color: '#722F37', padding: '10px 20px', borderRadius: '12px', fontWeight: 800, textDecoration: 'none', border: '1px solid rgba(212, 175, 55, 0.4)' }}>
          📋 إدارة المنتجات الحالية
        </Link>
      </div>

      {successMsg && (
        <div style={{ background: '#ECFDF5', border: '1px solid #10B981', color: '#065F46', padding: '16px 24px', borderRadius: '16px', fontWeight: 800, marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>✕</button>
        </div>
      )}

      {/* Telegram Raw Import Input Box */}
      <div style={{ background: '#fff', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', marginBottom: '32px', border: '1px solid rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1F2937', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📝</span>
          <span>لصق منشورات التليجرام (أو اضغط زر التجربة التلقائية):</span>
        </h3>
        <textarea
          rows={4}
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder={`انسخ هنا منشورات التليجرام... 
مثال:
فستان شيفون فاخر
السعر: 35 دينار
الوان: خمري، كحلي، اسود`}
          style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #E5E7EB', fontSize: '14px', fontFamily: 'sans-serif', marginBottom: '16px' }}
        />

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={handleParseText}
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #722F37 0%, #4A1C22 100%)',
              color: '#fff',
              padding: '12px 28px',
              borderRadius: '14px',
              border: 'none',
              fontWeight: 800,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(114, 47, 55, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {loading ? 'جاري الفرز والتحليل الذكي...' : '⚡ تحليل وفرز المنشورات تلقائياً'}
          </button>
        </div>
      </div>

      {/* Parsed Inspection Cards Grid */}
      {parsedItems.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔍</span>
              <span>نتائج التحليل والتدقيق ({parsedItems.length} موديل جاهز)</span>
            </h2>

            <button
              onClick={handlePublishAll}
              disabled={publishing}
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
                color: '#fff',
                padding: '14px 32px',
                borderRadius: '16px',
                border: 'none',
                fontWeight: 900,
                fontSize: '15px',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {publishing ? 'جاري النشر المباشر...' : '🚀 اعتماد ونشر جميع المنتجات للمتجر فوراً'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {parsedItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: '#fff',
                  border: item.confidenceScore === 100 ? '2px solid #10B981' : '2px solid #F59E0B',
                  borderRadius: '20px',
                  padding: '24px',
                  boxShadow: '0 6px 24px rgba(0,0,0,0.04)',
                  position: 'relative'
                }}
              >
                {/* Confidence Badge */}
                <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{
                    background: item.confidenceScore === 100 ? '#ECFDF5' : '#FEF3C7',
                    color: item.confidenceScore === 100 ? '#047857' : '#D97706',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 900,
                    border: item.confidenceScore === 100 ? '1px solid #10B981' : '1px solid #F59E0B'
                  }}>
                    {item.confidenceScore === 100 ? '✅ تدقيق دقيق 100%' : '⚠️ تم التعيين الذكي - تحقق سريع'}
                  </span>

                  <button
                    onClick={() => handleRemoveItem(idx)}
                    style={{ background: '#FEF2F2', color: '#EF4444', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 800 }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '24px', alignItems: 'start' }}>
                  {/* Image Preview */}
                  <div>
                    <img
                      src={item.imageUrls[0] || '/uploads/dress1.jpg'}
                      alt="Dress Preview"
                      style={{ width: '120px', height: '150px', objectFit: 'cover', borderRadius: '14px', border: '1px solid #E5E7EB' }}
                    />
                  </div>

                  {/* Editable Fields Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                    {/* Clean Name Input */}
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#374151', display: 'block', marginBottom: '6px' }}>
                        👗 اسم الفستان:
                      </label>
                      <input
                        type="text"
                        value={item.cleanName}
                        onChange={(e) => handleUpdateItem(idx, 'cleanName', e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #D1D5DB', fontSize: '14px', fontWeight: 800 }}
                      />
                    </div>

                    {/* Wholesale Cost Price Input */}
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#374151', display: 'block', marginBottom: '6px' }}>
                        📦 سعر الشراء والجملة (التليجرام):
                      </label>
                      <input
                        type="number"
                        value={item.costPrice}
                        onChange={(e) => {
                          const cost = parseFloat(e.target.value) || 0;
                          const margin = cost < 26 ? 9 : 8;
                          const sellingPrice = cost + margin;
                          const estimatedNetProfit = margin + 1;
                          const updated = [...parsedItems];
                          updated[idx].costPrice = cost;
                          updated[idx].sellingPrice = sellingPrice;
                          updated[idx].estimatedNetProfit = estimatedNetProfit;
                          setParsedItems(updated);
                        }}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #D1D5DB', fontSize: '14px', fontWeight: 800 }}
                      />
                    </div>

                    {/* Auto Selling Price to Customer */}
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#722F37', display: 'block', marginBottom: '6px' }}>
                        🏷️ سعر البيع للزبون تلقائياً:
                      </label>
                      <div style={{ background: '#FFFDF9', border: '1px solid rgba(212,175,55,0.5)', padding: '10px 14px', borderRadius: '10px', fontSize: '15px', fontWeight: 900, color: '#722F37' }}>
                        {item.sellingPrice} د.أ <span style={{ fontSize: '11px', color: '#059669', fontWeight: 800 }}>(+{item.costPrice < 26 ? '9' : '8'} د.أ)</span>
                      </div>
                    </div>

                    {/* Net Profit Display */}
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#047857', display: 'block', marginBottom: '6px' }}>
                        💵 صافي ربحك النقي (مع التوصيل):
                      </label>
                      <div style={{ background: '#ECFDF5', border: '1px solid #10B981', padding: '10px 14px', borderRadius: '10px', fontSize: '15px', fontWeight: 900, color: '#047857' }}>
                        +{item.estimatedNetProfit} د.أ صافي
                      </div>
                    </div>

                    {/* Colors Display */}
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#374151', display: 'block', marginBottom: '6px' }}>
                        🎨 الألوان المستخرجة ({item.colors.length}):
                      </label>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingTop: '4px' }}>
                        {item.colors.map((c: any, cIdx: number) => (
                          <span key={cIdx} style={{ background: '#FAF7F2', border: '1px solid rgba(212,175,55,0.4)', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 800, color: '#722F37', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: c.hex, display: 'inline-block' }} />
                            <span>{c.name}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Sizes Display */}
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#374151', display: 'block', marginBottom: '6px' }}>
                        📏 المقاسات:
                      </label>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingTop: '4px' }}>
                        {item.sizes.map((s: string, sIdx: number) => (
                          <span key={sIdx} style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, color: '#374151' }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Warnings List */}
                {item.warnings && item.warnings.length > 0 && (
                  <div style={{ marginTop: '16px', background: '#FFFDF9', border: '1px solid rgba(212, 175, 55, 0.4)', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', color: '#B45309', fontWeight: 700 }}>
                    {item.warnings.map((w: string, wIdx: number) => (
                      <div key={wIdx}>• {w}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
