import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dressId = Number(id);
    if (!dressId) return NextResponse.json({ error: 'معرف الفستان غير صحيح' }, { status: 400 });

    const body = await request.json();
    const { color, imageUrls } = body as { color: string; imageUrls: string[] };

    if (!color || !Array.isArray(imageUrls)) {
      return NextResponse.json({ error: 'البيانات غير كافية' }, { status: 400 });
    }

    // Find all variants for this dress matching the color
    const variants = await prisma.dressVariant.findMany({
      where: { dressId, color },
    });

    if (variants.length === 0) {
      return NextResponse.json({ error: 'اللون غير موجود' }, { status: 404 });
    }

    // Delete existing images for these variants and set new ones
    const variantIds = variants.map(v => v.id);
    await prisma.dressImage.deleteMany({
      where: { variantId: { in: variantIds } },
    });

    // Create new image records for each variant of this color
    for (const vId of variantIds) {
      for (const url of imageUrls) {
        if (url && url.trim()) {
          await prisma.dressImage.create({
            data: {
              variantId: vId,
              url: url.trim(),
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true, message: `تم تحديث وسائط اللون (${color}) بنجاح!` });
  } catch (err: any) {
    console.error('Error updating variant media:', err);
    return NextResponse.json({ error: err.message || 'فشل التحديث' }, { status: 500 });
  }
}
