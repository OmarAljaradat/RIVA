'use client';
import { useState, useEffect, useCallback } from 'react';
import { formatOrderNumber } from '@/lib/orderCode';

interface Order {
  id: number;
  customerName: string;
  phone: string;
  city: string;
  address: string;
  notes: string | null;
  total: number;
  status: string;
  createdAt: string;
  items: {
    id: number;
    quantity: number;
    price: number;
    dress: { name: string; nickname?: string | null };
    variant: { color: string; size: string };
  }[];
}

const statusLabels: Record<string, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
};

export default function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  const fetchOrders = useCallback(async (isManual = false) => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      const freshOrders: Order[] = Array.isArray(data) ? data : [];
      
      if (isManual) {
        setOrders(freshOrders);
        setNewOrdersCount(0);
        setLastRefresh(new Date());
      } else {
        setOrders(prev => {
          const newCount = freshOrders.filter(o => !prev.find(p => p.id === o.id)).length;
          if (newCount > 0) setNewOrdersCount(n => n + newCount);
          return freshOrders;
        });
        setLastRefresh(new Date());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetchOrders(true); }, [fetchOrders]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchOrders(false), 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);



  const updateStatus = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
      }
    } catch {
      alert('حدث خطأ أثناء تحديث الحالة');
    }
  };

  const deleteOrder = async (id: number) => {
    if (!window.confirm(`هل أنت متأكد من حذف الطلب #${id}؟\nهذا الإجراء لا يمكن التراجع عنه.`)) return;
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setOrders(prev => prev.filter(o => o.id !== id));
      } else {
        alert('حدث خطأ أثناء الحذف');
      }
    } catch {
      alert('حدث خطأ في الاتصال');
    }
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      {/* New Orders Alert Banner */}
      {newOrdersCount > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #722F37, #9B3A45)',
          color: '#fff',
          padding: '14px 24px',
          borderRadius: '16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 20px rgba(114,47,55,0.3)',
          animation: 'pulse 2s infinite'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 800, fontSize: '16px' }}>
            🔔 وصل {newOrdersCount} طلب جديد!
          </div>
          <button
            onClick={() => fetchOrders(true)}
            style={{
              background: '#fff',
              color: '#722F37',
              border: 'none',
              padding: '8px 20px',
              borderRadius: '10px',
              fontWeight: 900,
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            👁️ عرض الطلبات الجديدة
          </button>
        </div>
      )}

      <div className="admin-header">
        <div>
          <h1 className="admin-title">📦 إدارة طلبات العملاء</h1>
          <p style={{ color: '#6B7280', fontSize: '13px', marginTop: '4px' }}>
            🔄 يتحدث تلقائياً كل 30 ثانية • آخر تحديث: {lastRefresh.toLocaleTimeString('ar-JO')}
          </p>
        </div>
        <select 
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            border: '1px solid #D1D5DB',
            background: '#fff',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer'
          }}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">🔍 جميع الطلبات</option>
          <option value="pending">⏳ قيد الانتظار</option>
          <option value="confirmed">✅ مؤكد</option>
          <option value="shipped">🚚 تم الشحن</option>
          <option value="delivered">🎉 تم التسليم</option>
          <option value="cancelled">❌ ملغي</option>
        </select>
      </div>

      {/* Automatic Financial & Profit Calculator */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '28px'
      }}>
        {/* Total active orders */}
        <div style={{ background: '#fff', padding: '20px 24px', borderRadius: '18px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: 800 }}>📦 طلبات نشطة (غير ملغية):</div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#111827', marginTop: '4px' }}>{orders.filter(o => o.status !== 'cancelled').length} طلب</div>
          <div style={{ fontSize: '12px', color: '#F59E0B', fontWeight: 700, marginTop: '4px' }}>
            ⏳ قيد الانتظار: {orders.filter(o => o.status === 'pending').length} طلب
          </div>
        </div>

        {/* Collected from delivered only */}
        <div style={{ background: '#fff', padding: '20px 24px', borderRadius: '18px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: 800 }}>💰 محصّل فعلياً (تم التسليم فقط):</div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#722F37', marginTop: '4px' }}>
            {orders.filter(o => o.status === 'delivered').reduce((acc, curr) => acc + curr.total, 0)} د.أ
          </div>
          <div style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 700, marginTop: '4px' }}>
            متوقع (قيد الشحن): {orders.filter(o => ['confirmed','shipped'].includes(o.status)).reduce((acc, curr) => acc + curr.total, 0)} د.أ
          </div>
        </div>

        {/* NET PROFIT - delivered only */}
        <div style={{ background: '#ECFDF5', padding: '20px 24px', borderRadius: '18px', boxShadow: '0 4px 16px rgba(16,185,129,0.1)', border: '2px solid #10B981' }}>
          <div style={{ fontSize: '13px', color: '#047857', fontWeight: 800 }}>💵 أرباحك الصافية (تم التسليم فقط):</div>
          <div style={{ fontSize: '30px', fontWeight: 900, color: '#047857', marginTop: '4px' }}>
            +{orders.filter(o => o.status === 'delivered').reduce((acc, order) => {
              const itemProfit = order.items.reduce((itemAcc, item) => {
                const itemSelling = item.price;
                const cost = itemSelling < 26 ? (itemSelling - 9) : (itemSelling - 8);
                const margin = itemSelling - cost;
                return itemAcc + (margin * item.quantity);
              }, 0);
              return acc + itemProfit + 1;
            }, 0)} د.أ صافي
          </div>
          <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px', fontWeight: 700 }}>
            ✅ لا يُحسب ربح إلا بعد تحديث الحالة لـ "تم التسليم"
          </div>
        </div>
      </div>


      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>رقم الطلب</th>
              <th>العميل</th>
              <th>الهاتف</th>
              <th>المدينة</th>
              <th>المبلغ</th>
              <th>حالة الطلب</th>
              <th>التاريخ</th>
              <th>التفاصيل</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF' }}>لا توجد طلبات بهذه الحالة حالياً</td></tr>
            ) : (
              filteredOrders.map(order => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 900, color: '#722F37' }}>{formatOrderNumber(order.id)}</td>
                  <td style={{ fontWeight: 800 }}>{order.customerName}</td>
                  <td dir="ltr" style={{ textAlign: 'right', fontWeight: 600 }}>{order.phone}</td>
                  <td>{order.city}</td>
                  <td style={{ fontWeight: 900, color: '#722F37' }}>{order.total} د.أ</td>
                  <td>
                    <select 
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      style={{ 
                        padding: '6px 12px', 
                        fontSize: '13px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '10px',
                        fontWeight: 700,
                        background: '#fff'
                      }}
                    >
                      <option value="pending">⏳ قيد الانتظار</option>
                      <option value="confirmed">✅ مؤكد</option>
                      <option value="shipped">🚚 تم الشحن</option>
                      <option value="delivered">🎉 تم التسليم</option>
                      <option value="cancelled">❌ ملغي</option>
                    </select>
                  </td>
                  <td style={{ color: '#6B7280', fontSize: '13px' }}>
                    {new Date(order.createdAt).toLocaleDateString('ar-JO')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {/* Details button */}
                      <button
                        className="btn-luxe-outline"
                        style={{ fontSize: '12px', padding: '6px 10px' }}
                        onClick={() => setSelectedOrder(order)}
                      >
                        👁️ التفاصيل
                      </button>

                      {/* Copy to group button */}
                      <button
                        onClick={() => {
                          const item = order.items[0];
                          const groupDressLabel = item?.dress?.nickname ? item.dress.nickname : (item?.dress?.name || 'فستان');
                          const color = item?.variant?.color || '';
                          const size = item?.variant?.size || '';
                          const formatted = `الاسم: ${order.customerName}
رقم الهاتف: ${order.phone}
الموقع: ${order.city} - ${order.address}
${groupDressLabel} - ${color} - سايز ${size}
السعر: ${order.total} دينار شامل التوصيل`;
                          navigator.clipboard.writeText(formatted);
                          alert('✅ تم نسخ تفاصيل الطلب للجروب!');
                        }}
                        style={{
                          background: '#ECFDF5',
                          border: '1px solid #10B981',
                          color: '#047857',
                          fontSize: '12px',
                          fontWeight: 800,
                          padding: '6px 10px',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        📋 نسخ
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={() => deleteOrder(order.id)}
                        title="حذف الطلب"
                        style={{
                          background: '#FEF2F2',
                          border: '1px solid #FECACA',
                          color: '#DC2626',
                          fontSize: '14px',
                          fontWeight: 900,
                          padding: '6px 10px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          lineHeight: 1,
                          transition: 'all 0.15s ease'
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.background = '#DC2626';
                          e.currentTarget.style.color = '#fff';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.background = '#FEF2F2';
                          e.currentTarget.style.color = '#DC2626';
                        }}
                      >
                        ✕
                      </button>

                      {order.notes?.includes('📸 انستقرام:') && (() => {
                        const instaRaw = order.notes.match(/📸 انستقرام: (@\S+)/)?.[1] || '';
                        const instaUsername = instaRaw.replace('@', '');
                        const item = order.items[0];
                        // Customer message MUST use the public name, NEVER the nickname!
                        const customerDressName = item?.dress?.name || 'فستان';
                        const color = item?.variant?.color || '';
                        const size = item?.variant?.size || '';
                        const dmMessage = `مرحبا 🌸
وصلنا طلبك من بوتيك ريفا (${formatOrderNumber(order.id)}) ✨

تفاصيل طلبك:
${customerDressName} - ${color} - سايز ${size}
السعر: ${order.total} دينار شامل التوصيل

تم تثبيت طلبك بنجاح 🎉
رح نتواصل معك لتأكيد موعد التوصيل 🚚`;


                        return (
                          <button
                            key="insta"
                            onClick={() => {
                              navigator.clipboard.writeText(dmMessage).then(() => {
                                window.open(`https://www.instagram.com/${instaUsername}/`, '_blank');
                                setTimeout(() => {
                                  alert('✅ تم نسخ الرسالة!\n\n📋 اضغط "Message" في البروفايل والصق الرسالة');
                                }, 800);
                              });
                            }}
                            style={{
                              background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
                              border: 'none',
                              color: '#fff',
                              fontSize: '12px',
                              fontWeight: 800,
                              padding: '6px 10px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              boxShadow: '0 2px 8px rgba(220,39,67,0.3)',
                            }}
                            onMouseOver={e => (e.currentTarget.style.opacity = '0.85')}
                            onMouseOut={e => (e.currentTarget.style.opacity = '1')}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                            انستا
                          </button>
                        );
                      })()}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay-insta" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content-luxe" onClick={(e) => e.stopPropagation()} style={{ padding: '32px', maxWidth: '600px' }}>
            <button className="modal-close-btn" onClick={() => setSelectedOrder(null)}>✕</button>

            <div style={{ marginBottom: '24px', borderBottom: '1px solid #eee', paddingBottom: '16px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#111827' }}>تفاصيل الطلب #{selectedOrder.id}</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '15px' }}>
              <div>
                <span style={{ color: '#6B7280' }}>اسم العميل:</span> <strong style={{ color: '#111827' }}>{selectedOrder.customerName}</strong>
              </div>
              <div>
                <span style={{ color: '#6B7280' }}>رقم الهاتف:</span> <strong dir="ltr">{selectedOrder.phone}</strong>
              </div>
              {/* Extract Instagram from notes */}
              {selectedOrder.notes?.includes('📸 انستقرام:') && (
                <div style={{ background: 'linear-gradient(135deg, #fdf2f8, #fce7f3)', border: '1px solid #f9a8d4', padding: '14px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ color: '#9D174D', fontWeight: 700, fontSize: '13px' }}>📸 حساب الانستقرام:</span>
                    <strong style={{ color: '#BE185D', fontSize: '16px', display: 'block', marginTop: '2px' }}>
                      {selectedOrder.notes.match(/📸 انستقرام: (@\S+)/)?.[1] || ''}
                    </strong>
                  </div>
                  <a
                    href={`https://instagram.com/${(selectedOrder.notes.match(/📸 انستقرام: (@\S+)/)?.[1] || '').replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: 'linear-gradient(135deg, #E1306C, #833AB4)',
                      color: '#fff',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontWeight: 800,
                      fontSize: '13px',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    فتح الحساب ↗
                  </a>
                </div>
              )}
              <div>
                <span style={{ color: '#6B7280' }}>رقم الهاتف:</span> <strong dir="ltr">{selectedOrder.phone}</strong>
              </div>
              <div>
                <span style={{ color: '#6B7280' }}>المدينة:</span> <strong>{selectedOrder.city}</strong>
              </div>
              <div>
                <span style={{ color: '#6B7280' }}>العنوان التفصيلي:</span> <strong>{selectedOrder.address}</strong>
              </div>
              {selectedOrder.notes && (
                <div style={{ background: '#FFFBEB', padding: '12px', borderRadius: '10px', border: '1px solid #FDE68A' }}>
                  <span style={{ color: '#92400E', fontWeight: 700 }}>ملاحظات العميل:</span> {selectedOrder.notes}
                </div>
              )}

              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '16px', marginTop: '8px' }}>
                <strong style={{ display: 'block', marginBottom: '12px', color: '#111827' }}>الفستان المطلوب:</strong>
                {selectedOrder.items?.map(item => (
                  <div key={item.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: '10px 0',
                    borderBottom: '1px solid #F3F4F6',
                    fontSize: '14px'
                  }}>
                    <span>{item.dress?.name} - (اللون: {item.variant?.color} / المقاس: {item.variant?.size})</span>
                    <strong style={{ color: '#722F37' }}>{item.price} د.أ</strong>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '20px', marginTop: '16px', background: '#FAF7F2', padding: '16px', borderRadius: '14px' }}>
                <span>المبلغ الإجمالي</span>
                <span style={{ color: '#722F37' }}>{selectedOrder.total} د.أ</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
