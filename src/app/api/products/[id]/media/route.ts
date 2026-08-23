import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dressId = Number(id);
    if (!dressId) {
      return NextResponse.json({ error: 'معرف الفستان غير صحيح' }, { status: 400 });
    }

    const body = await request.json();
    const { mediaMap, sizeMap, color, imageUrls } = body;

    // 1. If single color update format was sent
    if (color && Array.isArray(imageUrls)) {
      const variants = await prisma.dressVariant.findMany({
        where: { dressId, color },
      });

      if (variants.length > 0) {
        const variantIds = variants.map(v => v.id);
        await prisma.dressImage.deleteMany({
          where: { variantId: { in: variantIds } },
        });

        for (const vId of variantIds) {
          for (const url of imageUrls) {
            if (url && typeof url === 'string' && url.trim()) {
              await prisma.dressImage.create({
                data: { variantId: vId, url: url.trim() },
              });
            }
          }
        }
      }
      return NextResponse.json({ success: true, message: `تم تحديث وسائط اللون (${color}) بنجاح!` });
    }

    // 2. If full mediaMap and sizeMap were sent (from Admin Media Studio)
    if (mediaMap && typeof mediaMap === 'object') {
      for (const [colName, urls] of Object.entries(mediaMap as Record<string, string[]>)) {
        const variants = await prisma.dressVariant.findMany({
          where: { dressId, color: colName },
        });

        if (variants.length > 0) {
          const variantIds = variants.map(v => v.id);
          // Delete old images for this color
          await prisma.dressImage.deleteMany({
            where: { variantId: { in: variantIds } },
          });

          // Insert new images
          if (Array.isArray(urls)) {
            for (const vId of variantIds) {
              for (const u of urls) {
                if (u && typeof u === 'string' && u.trim()) {
                  await prisma.dressImage.create({
                    data: { variantId: vId, url: u.trim() },
                  });
                }
              }
            }
          }
        }
      }
    }

    // 3. Update sizes if sizeMap was provided
    if (sizeMap && typeof sizeMap === 'object') {
      for (const [colName, sizesObj] of Object.entries(sizeMap as Record<string, Record<string, boolean>>)) {
        if (!sizesObj || typeof sizesObj !== 'object') continue;

        for (const [sizeName, isAvailable] of Object.entries(sizesObj)) {
          const variant = await prisma.dressVariant.findFirst({
            where: { dressId, color: colName, size: sizeName },
          });

          if (variant) {
            await prisma.dressVariant.update({
              where: { id: variant.id },
              data: { quantity: isAvailable ? (variant.quantity > 0 ? variant.quantity : 10) : 0 },
            });
          } else if (isAvailable) {
            // Create variant if it didn't exist
            await prisma.dressVariant.create({
              data: {
                dressId,
                color: colName,
                colorHex: '#000000',
                size: sizeName,
                quantity: 10,
              },
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: 'تم حفظ الوسائط والمقاسات بنجاح تام! ✨' });
  } catch (err: any) {
    console.error('Error saving dress media/sizes:', err);
    return NextResponse.json({ error: err.message || 'فشل حفظ التعديلات' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  return PUT(request, props);
}
