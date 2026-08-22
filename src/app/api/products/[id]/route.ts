import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ─── Helper: التحقق من session الإدمن ─────────────────────────────────────
function isAdminAuthenticated(request: NextRequest): boolean {
  const sessionToken = request.cookies.get('riva_admin_session')?.value;
  if (!sessionToken) return false;
  const password = process.env.ADMIN_PASSWORD || '';
  const salt = 'riva_boutique_2026';
  const expectedToken = Buffer.from(`${salt}:${password}`).toString('base64');
  return sessionToken === expectedToken;
}

// ─── GET: عام — يُستخدم من صفحات المنتج للزبائن ─────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const numericId = Number(resolvedParams.id);
    if (isNaN(numericId)) return NextResponse.json({ error: 'ID غير صحيح' }, { status: 400 });

    const product = await prisma.dress.findUnique({
      where: { id: numericId },
      include: {
        variants: { include: { images: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'المنتج غير موجود' }, { status: 404 });
    }

    // لا نُرجع الـ nickname للزبون (معلومة داخلية)
    const { nickname: _nickname, ...publicProduct } = product as any;
    return NextResponse.json(publicProduct);
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في جلب المنتج' }, { status: 500 });
  }
}

// ─── PUT: إدمن فقط ────────────────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }
  try {
    const resolvedParams = await params;
    const numericId = Number(resolvedParams.id);
    if (isNaN(numericId)) return NextResponse.json({ error: 'ID غير صحيح' }, { status: 400 });

    const body = await request.json();
    const { name, description, price, isNew, isFeatured, variants, nickname } = body;

    // تحديث اللقب فقط (quick inline edit)
    if (nickname !== undefined && !name && !variants) {
      if (typeof nickname !== 'string' || nickname.length > 100) {
        return NextResponse.json({ error: 'اللقب غير صحيح' }, { status: 400 });
      }
      const updated = await prisma.dress.update({
        where: { id: numericId },
        data: { nickname: nickname.trim() || null },
      });
      return NextResponse.json(updated);
    }

    // تحديث كامل
    if (!name || typeof name !== 'string' || name.length > 200) {
      return NextResponse.json({ error: 'اسم المنتج غير صحيح' }, { status: 400 });
    }

    const product = await prisma.$transaction(async (tx: any) => {
      await tx.dressVariant.deleteMany({ where: { dressId: numericId } });

      return tx.dress.update({
        where: { id: numericId },
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
    });

    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في تحديث المنتج' }, { status: 500 });
  }
}

// ─── DELETE: إدمن فقط ─────────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }
  try {
    const resolvedParams = await params;
    const numericId = Number(resolvedParams.id);
    if (isNaN(numericId)) return NextResponse.json({ error: 'ID غير صحيح' }, { status: 400 });

    await prisma.dress.delete({ where: { id: numericId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في حذف المنتج' }, { status: 500 });
  }
}
