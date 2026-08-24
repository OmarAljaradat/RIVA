import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/adminAuth';

// ─── GET: جلب طلب واحد (إدمن فقط) ────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }
  try {
    const resolvedParams = await params;
    const numericId = Number(resolvedParams.id);
    if (isNaN(numericId)) return NextResponse.json({ error: 'ID غير صحيح' }, { status: 400 });

    const order = await prisma.order.findUnique({
      where: { id: numericId },
      include: {
        items: {
          include: {
            dress: { select: { id: true, name: true, nickname: true, price: true } },
            variant: {
              select: {
                id: true,
                color: true,
                colorHex: true,
                size: true,
                images: { select: { id: true, url: true } }
              }
            },
          }
        },
      },
    });

    if (!order) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في جلب الطلب' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }
  try {
    const resolvedParams = await params;
    const numericId = Number(resolvedParams.id);
    if (isNaN(numericId)) return NextResponse.json({ error: 'ID غير صحيح' }, { status: 400 });

    const body = await request.json();
    const { status } = body;

    // التحقق من القيم المسموح بها لحالة الطلب
    const allowedStatuses = ['pending', 'confirmed', 'delivered', 'cancelled'];
    if (!status || !allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'حالة الطلب غير صحيحة' }, { status: 400 });
    }

    const order = await prisma.order.update({
      where: { id: numericId },
      data: { status },
      include: { items: true },
    });

    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في تحديث الطلب' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }
  try {
    const resolvedParams = await params;
    const numericId = Number(resolvedParams.id);
    if (isNaN(numericId)) return NextResponse.json({ error: 'ID غير صحيح' }, { status: 400 });

    await prisma.orderItem.deleteMany({ where: { orderId: numericId } });
    await prisma.order.delete({ where: { id: numericId } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في حذف الطلب' }, { status: 500 });
  }
}
