import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// ─── Helper: التحقق من session الإدمن ─────────────────────────────────────
function isAdminAuthenticated(request: NextRequest): boolean {
  const sessionToken = request.cookies.get('riva_admin_session')?.value;
  if (!sessionToken) return false;
  const password = process.env.ADMIN_PASSWORD || '';
  const salt = 'riva_boutique_2026';
  const expectedToken = Buffer.from(`${salt}:${password}`).toString('base64');
  return sessionToken === expectedToken;
}

// ─── GET: عام — يُستخدم من صفحة المتجر ─────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured') === 'true';
    const isNew = searchParams.get('new') === 'true';

    const where: any = {};
    if (searchParams.has('featured')) where.isFeatured = featured;
    if (searchParams.has('new')) where.isNew = isNew;

    let products = [];
    try {
      products = await prisma.dress.findMany({
        where,
        include: {
          variants: { include: { images: true } },
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      });
    } catch {
      products = await prisma.dress.findMany({
        where,
        include: {
          variants: { include: { images: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // لا نُرجع الـ nickname للزبائن (معلومة داخلية)
    const safeProducts = products.map(({ nickname: _nickname, ...p }: any) => p);
    return NextResponse.json(safeProducts);
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في جلب المنتجات' }, { status: 500 });
  }
}

// ─── POST: إدمن فقط ────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, price, isNew, isFeatured, variants } = body;

    if (!name || typeof name !== 'string' || name.length > 200) {
      return NextResponse.json({ error: 'اسم المنتج غير صحيح' }, { status: 400 });
    }
    if (isNaN(Number(price)) || Number(price) < 0) {
      return NextResponse.json({ error: 'السعر غير صحيح' }, { status: 400 });
    }

    const product = await prisma.dress.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: Number(price),
        isNew: Boolean(isNew),
        isFeatured: Boolean(isFeatured),
        variants: {
          create: (variants || []).map((v: any) => ({
            color: String(v.color || '').slice(0, 50),
            colorHex: String(v.colorHex || '#000000').slice(0, 20),
            size: String(v.size || '').slice(0, 20),
            quantity: Math.max(0, Number(v.quantity) || 0),
            images: {
              create: (v.imageUrls || []).map((url: string) => ({ url: String(url) })),
            },
          })),
        },
      },
      include: {
        variants: { include: { images: true } },
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في إضافة المنتج' }, { status: 500 });
  }
}
