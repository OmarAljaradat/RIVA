'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/admin/dashboard');
      } else {
        setError('كلمة المرور غير صحيحة');
      }
    } catch {
      setError('حدث خطأ، حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1C0A10 0%, #3B121F 50%, #12050A 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'Cairo, sans-serif'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '28px',
        padding: '48px 40px',
        maxWidth: '440px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(212, 175, 55, 0.3)',
        textAlign: 'center'
      }}>
        <div style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '44px',
          fontWeight: 900,
          background: 'linear-gradient(135deg, #722F37 0%, #D4AF37 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '8px',
          letterSpacing: '3px'
        }}>
          RIVA
        </div>
        <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '32px', fontWeight: 600 }}>
          لوحة التحكم الفاخرة لمتجر ريفا فساتين
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <label style={{ fontSize: '13px', fontWeight: 800, color: '#374151', display: 'block', marginBottom: '8px' }}>
              كلمة المرور الرئيسية
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="أدخل كلمة المرور"
              required
              style={{
                width: '100%',
                padding: '14px 18px',
                borderRadius: '14px',
                border: error ? '2px solid #EF4444' : '1px solid #D1D5DB',
                fontSize: '15px',
                outline: 'none',
                background: '#F9FAFB'
              }}
            />
            {error && <span style={{ color: '#EF4444', fontSize: '12px', fontWeight: 700, marginTop: '6px', display: 'block' }}>{error}</span>}
          </div>

          <button 
            type="submit" 
            className="btn-luxe-admin" 
            style={{ width: '100%', padding: '14px', justifyContent: 'center', fontSize: '16px', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? '⏳ جاري التحقق...' : '🔐 تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
}
