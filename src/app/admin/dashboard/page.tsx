'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface Order {
  id: number;
  customerName: string;
  phone: string;
  total: number;
  status: string;
  createdAt: string;
  city: string;
  items: { price: number; quantity: number; dress?: { name: string; nickname?: string } }[];
}

// ── ألوان العلامة التجارية ───────────────────────────────────────────────────
const BURGUNDY  = '#722F37';
const GOLD      = '#D4AF37';
const GOLD_LIGHT = '#F0E0A0';
const GREEN     = '#059669';
const AMBER     = '#D97706';
const BLUE      = '#2563EB';
const RED       = '#DC2626';

const STATUS_COLORS: Record<string, string> = {
  pending: AMBER, confirmed: BLUE, shipped: '#7C3AED',
  delivered: GREEN, cancelled: RED,
};
const STATUS_LABELS: Record<string, string> = {
  pending: 'انتظار', confirmed: 'مؤكد', shipped: 'شحن',
  delivered: 'مُسلَّم', cancelled: 'ملغي',
};

// ── Tooltip مخصص ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff', border: `1px solid ${GOLD}`, borderRadius: 12,
      padding: '10px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', fontSize: 13,
      direction: 'rtl', fontFamily: 'Cairo, sans-serif'
    }}>
      {label && <div style={{ fontWeight: 900, color: '#111', marginBottom: 6 }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color || BURGUNDY, fontWeight: 700 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(p.name?.includes('د.أ') || p.name?.includes('مبيعات') || p.name?.includes('ربح') ? 1 : 0) : p.value}
          {p.name?.includes('مبيعات') || p.name?.includes('ربح') || p.name?.includes('مبلغ') ? ' د.أ' : ''}
        </div>
      ))}
    </div>
  );
};

// ── مساعد: اسم الشهر بالعربي ────────────────────────────────────────────────
const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

export default function Dashboard() {
  const [orders,   setOrders]   = useState<Order[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [syncingSizes, setSyncingSizes] = useState(false);

  const handleSyncSizes = async () => {
    if (syncingSizes) return;
    setSyncingSizes(true);
    try {
      const res = await fetch('/api/admin/sync-sizes', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`✅ تم فحص ومطابقة المقاسات مع تيليجرام بنجاح!\n• إجمالي الفساتين المفحوصة: ${data.totalScannedDresses}\n• فساتين تم تحديث مخزونها: ${data.updatedDressesCount}`);
        window.location.reload();
      } else {
        alert(`⚠️ تنبيه: ${data.error || 'فشلت المزامنة'}`);
      }
    } catch (err: any) {
      alert(`❌ خطأ في الاتصال: ${err.message}`);
    } finally {
      setSyncingSizes(false);
    }
  };

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then(r => r.json()),
      fetch('/api/orders').then(r => r.json()),
    ]).then(([prods, ords]) => {
      setProducts(Array.isArray(prods) ? prods : []);
      setOrders(Array.isArray(ords) ? ords : []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
        <div className="spinner" />
        <div style={{ color: BURGUNDY, fontWeight: 800, fontSize: 16 }}>جاري تحميل البيانات...</div>
      </div>
    );
  }

  // ── حسابات إجمالية ──────────────────────────────────────────────────────────
  // المبيعات والأرباح تُحسب فقط للطلبات المؤكدة أو المشحونة أو المسلّمة (وليس قيد الانتظار أو الملغاة)
  const confirmedOrders = orders.filter(o => ['confirmed', 'shipped', 'delivered'].includes(o.status));
  const delivered       = orders.filter(o => o.status === 'delivered');
  const pending         = orders.filter(o => o.status === 'pending');

  const totalRevenue = confirmedOrders.reduce((s, o) => s + o.total, 0);
  const netProfit    = delivered.reduce((acc, order) => {
    const p = (order.items || []).reduce((ia, item) => {
      const sell = item.price || 35;
      const margin = sell < 26 ? 9 : 8;
      return ia + margin * (item.quantity || 1);
    }, 0);
    return acc + p + 1;
  }, 0);

  // ── بيانات: المبيعات اليومية آخر 14 يوم ────────────────────────────────────
  const dailyMap: Record<string, { date: string; مبيعات: number; ربح: number; طلبات: number }> = {};
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const label = `${d.getDate()}/${d.getMonth() + 1}`;
    dailyMap[key] = { date: label, مبيعات: 0, ربح: 0, طلبات: 0 };
  }
  orders.forEach(o => {
    const key = o.createdAt.split('T')[0];
    if (dailyMap[key] && o.status !== 'cancelled') {
      dailyMap[key].طلبات += 1;
      if (['confirmed', 'shipped', 'delivered'].includes(o.status)) {
        dailyMap[key].مبيعات += o.total;
      }
      if (o.status === 'delivered') {
        const p = (o.items || []).reduce((ia, item) => {
          const sell = item.price || 35; const margin = sell < 26 ? 9 : 8;
          return ia + margin * (item.quantity || 1);
        }, 0) + 1;
        dailyMap[key].ربح += p;
      }
    }
  });
  const dailyData = Object.values(dailyMap);

  // ── بيانات: توزيع حالات الطلبات (Pie) ─────────────────────────────────────
  const statusCount: Record<string, number> = {};
  orders.forEach(o => { statusCount[o.status] = (statusCount[o.status] || 0) + 1; });
  const pieData = Object.entries(statusCount).map(([status, count]) => ({
    name: STATUS_LABELS[status] || status, value: count, color: STATUS_COLORS[status] || BURGUNDY,
  }));

  // ── بيانات: المدن الأكثر طلباً ────────────────────────────────────────────
  const cityMap: Record<string, number> = {};
  orders.filter(o => o.status !== 'cancelled').forEach(o => {
    const city = o.city?.trim() || 'أخرى';
    cityMap[city] = (cityMap[city] || 0) + 1;
  });
  const cityData = Object.entries(cityMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([city, count]) => ({ city, طلبات: count }));

  // ── بيانات: المبيعات الشهرية ────────────────────────────────────────────────
  const monthlyMap: Record<string, { month: string; مبيعات: number; طلبات: number }> = {};
  orders.filter(o => o.status !== 'cancelled').forEach(o => {
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!monthlyMap[key]) monthlyMap[key] = { month: MONTHS_AR[d.getMonth()], مبيعات: 0, طلبات: 0 };
    if (['confirmed', 'shipped', 'delivered'].includes(o.status)) {
      monthlyMap[key].مبيعات += o.total;
    }
    monthlyMap[key].طلبات += 1;
  });
  const monthlyData = Object.values(monthlyMap).slice(-6);

  // ── بيانات: المخزون ─────────────────────────────────────────────────────────
  const sizeMap: Record<string, number> = {};
  products.forEach(p => (p.variants || []).forEach((v: any) => {
    if (v.quantity > 0) sizeMap[v.size] = (sizeMap[v.size] || 0) + v.quantity;
  }));
  const stockData = Object.entries(sizeMap)
    .sort((a, b) => {
      const order = ['36','38','40','42','44','46','48','XS','S','M','L','XL','XXL'];
      return (order.indexOf(a[0]) ?? 99) - (order.indexOf(b[0]) ?? 99);
    })
    .map(([size, count]) => ({ size, كمية: count }));

  // ── KPI Cards ────────────────────────────────────────────────────────────────
  const kpis = [
    { label: 'صافي الربح الحقيقي',  value: `${netProfit} د.أ`,    icon: '💵', bg: '#ECFDF5', border: GREEN,   color: GREEN   },
    { label: 'إجمالي المبيعات المؤكدة', value: `${Math.round(totalRevenue)} د.أ`, icon: '💰', bg: '#FFFBEB', border: GOLD, color: BURGUNDY },
    { label: 'طلبات بالانتظار',     value: `${pending.length}`,   icon: '⏳', bg: '#FFFBEB', border: AMBER,   color: AMBER   },
    { label: 'طلبات مُسلَّمة',      value: `${delivered.length}`, icon: '🎉', bg: '#EFF6FF', border: BLUE,    color: BLUE    },
    { label: 'الموديلات بالكتالوج', value: `${products.length}`,  icon: '👗', bg: '#FAF5FF', border: '#7C3AED', color: '#7C3AED' },
    { label: 'إجمالي الطلبات',      value: `${orders.length}`,    icon: '📦', bg: '#FFF7F7', border: BURGUNDY, color: BURGUNDY },
  ];

  const cardStyle = (kpi: any) => ({
    background: kpi.bg, border: `1.5px solid ${kpi.border}`,
    borderRadius: 20, padding: '22px 24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)', transition: 'transform .2s',
  });

  const sectionTitle = (icon: string, title: string) => (
    <h2 style={{ fontSize: 17, fontWeight: 900, color: '#111827', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 20 }}>{icon}</span> {title}
    </h2>
  );

  return (
    <div style={{ maxWidth: 1260, margin: '0 auto', direction: 'rtl', fontFamily: 'Cairo, sans-serif' }}>

      {/* ─── Header ────────────────────────────────────────────────── */}
      <div style={{
        background: '#fff', border: `1px solid ${GOLD_LIGHT}`, borderRadius: 24,
        padding: '24px 32px', marginBottom: 28,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
      }}>
        <div>
          <div style={{ fontSize: 11, color: BURGUNDY, fontWeight: 900, letterSpacing: 3, marginBottom: 4 }}>
            👑 RIVA BOUTIQUE • ANALYTICS DASHBOARD
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#111827', margin: 0 }}>
            لوحة التحليلات والرسوم البيانية 📊
          </h1>
          <p style={{ color: '#6B7280', fontSize: 13, marginTop: 6, margin: '6px 0 0' }}>
            بيانات حية من قاعدة البيانات — تُحدَّث تلقائياً
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={handleSyncSizes}
            disabled={syncingSizes}
            style={{
              background: syncingSizes ? '#9CA3AF' : '#059669',
              color: '#fff',
              border: 'none',
              padding: '12px 20px',
              borderRadius: 16,
              fontWeight: 800,
              fontSize: 14,
              cursor: syncingSizes ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 16px rgba(5,150,105,0.3)',
              transition: 'all 0.2s'
            }}
          >
            {syncingSizes ? '⏳ جاري المزامنة...' : '🔄 مزامنة المقاسات مع تيليجرام'}
          </button>
          <Link href="/admin/import-inspector" style={{
            background: `linear-gradient(135deg, ${BURGUNDY}, #4A1C22)`, color: '#fff',
            padding: '12px 22px', borderRadius: 16, fontWeight: 800, fontSize: 14,
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
            boxShadow: `0 4px 16px ${BURGUNDY}40`
          }}>
            🤖 المُعالج الذكي
          </Link>
        </div>
      </div>

      {/* ─── KPI Cards ─────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16, marginBottom: 28 }}>
        {kpis.map((kpi, i) => (
          <div key={i} style={cardStyle(kpi)}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{kpi.icon}</div>
            <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 700, marginBottom: 4 }}>{kpi.label}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* ─── Row 1: Area Chart المبيعات اليومية ─────────────────────── */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 20, padding: '24px 28px', marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
        {sectionTitle('📈', 'المبيعات والأرباح اليومية — آخر 14 يوم')}
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={dailyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={BURGUNDY} stopOpacity={0.2} />
                <stop offset="95%" stopColor={BURGUNDY} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={GREEN} stopOpacity={0.2} />
                <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 13, fontFamily: 'Cairo, sans-serif', paddingTop: 8 }} />
            <Area type="monotone" dataKey="مبيعات" stroke={BURGUNDY} strokeWidth={2.5} fill="url(#gSales)" dot={{ fill: BURGUNDY, r: 3 }} />
            <Area type="monotone" dataKey="ربح"    stroke={GREEN}    strokeWidth={2.5} fill="url(#gProfit)" dot={{ fill: GREEN, r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ─── Row 2: Bar + Pie ───────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>

        {/* Pie: حالات الطلبات */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 20, padding: '24px 28px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          {sectionTitle('🥧', 'توزيع حالات الطلبات')}
          {pieData.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '60px 0', fontSize: 14 }}>لا توجد طلبات بعد</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                  dataKey="value" nameKey="name" paddingAngle={3}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#D1D5DB', strokeWidth: 1 }}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar: المدن الأكثر طلباً */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 20, padding: '24px 28px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          {sectionTitle('📍', 'المدن الأكثر طلباً')}
          {cityData.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '60px 0', fontSize: 14 }}>لا توجد بيانات بعد</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={cityData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <YAxis type="category" dataKey="city" tick={{ fontSize: 12, fill: '#374151', fontFamily: 'Cairo' }} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="طلبات" radius={[0, 8, 8, 0]}>
                  {cityData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? BURGUNDY : i === 1 ? GOLD : `hsl(${200 + i * 30}, 60%, 55%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ─── Row 3: Bar شهري + Bar مخزون ────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>

        {/* Bar: المبيعات الشهرية */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 20, padding: '24px 28px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          {sectionTitle('📅', 'المبيعات الشهرية')}
          {monthlyData.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '60px 0', fontSize: 14 }}>لا توجد بيانات بعد</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 13, fontFamily: 'Cairo' }} />
                <Bar dataKey="مبيعات" fill={BURGUNDY} radius={[6, 6, 0, 0]} />
                <Bar dataKey="طلبات"  fill={GOLD}     radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar: توزيع المخزون بالسايزات */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 20, padding: '24px 28px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          {sectionTitle('📦', 'توزيع المخزون بالمقاسات')}
          {stockData.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '60px 0', fontSize: 14 }}>لا توجد بيانات مخزون</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stockData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="size" tick={{ fontSize: 12, fill: '#374151' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="كمية" radius={[6, 6, 0, 0]}>
                  {stockData.map((entry, i) => (
                    <Cell key={i} fill={entry.كمية < 5 ? AMBER : entry.كمية < 15 ? BLUE : GREEN} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ─── أحدث الطلبات ───────────────────────────────────────────── */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 28px', borderBottom: '1px solid #F3F4F6', background: '#FFFDF9' }}>
          {sectionTitle('📋', 'أحدث الطلبات')}
          <Link href="/admin/orders" style={{ color: BURGUNDY, fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
            عرض الكل ←
          </Link>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#FAF7F2', color: '#6B7280', fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>
                {['رقم الطلب','العميل','المدينة','المبلغ','الحالة','التاريخ'].map(h => (
                  <th key={h} style={{ padding: '14px 20px', borderBottom: '1px solid #E5E7EB' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 8).map(order => {
                const st = STATUS_LABELS[order.status] || order.status;
                const cl = STATUS_COLORS[order.status] || BURGUNDY;
                const bg = `${cl}18`;
                const d  = new Date(order.createdAt);
                return (
                  <tr key={order.id} style={{ borderBottom: '1px solid #F9FAFB' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 900, color: BURGUNDY }}>RIVA-{1000 + order.id}</td>
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: '#111827' }}>{order.customerName}</td>
                    <td style={{ padding: '14px 20px', color: '#4B5563' }}>{order.city}</td>
                    <td style={{ padding: '14px 20px', fontWeight: 900, color: BURGUNDY }}>{order.total} د.أ</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ background: bg, color: cl, padding: '3px 10px', borderRadius: 10, fontSize: 12, fontWeight: 800 }}>{st}</span>
                    </td>
                    <td style={{ padding: '14px 20px', color: '#9CA3AF', fontSize: 12 }} dir="ltr">
                      {d.getDate()}/{d.getMonth()+1}/{d.getFullYear()}
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>لا توجد طلبات بعد</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
