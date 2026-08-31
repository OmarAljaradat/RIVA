import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured') === 'true';
    const isNew = searchParams.get('new') === 'true';

    const where: any = {};
    if (searchParams.has('featured')) where.isFeatured = featured;
    if (searchParams.has('new')) where.isNew = isNew;

    const products = await prisma.dress.findMany({
      where,
      include: {
        variants: {
          include: {
            images: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(products || []);
  } catch (err: any) {
    console.error('Products API Error:', err);
    return NextResponse.json({ error: 'حدث خطأ في جلب المنتجات', detail: String(err?.message || err) }, { status: 500 });
  }
}

// ─── POST: إضافة منتج (إدمن فقط) ──────────────────────────────────────────
export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated(request))) {
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
