import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseTelegramPost } from '@/lib/telegramParser';
import { isAdminAuthenticated } from '@/lib/adminAuth';

// POST: Parse Telegram raw posts text array into clean inspectable draft objects
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated(req))) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { posts } = body; // Array of { caption: string, imageUrls: string[] }

    if (!posts || !Array.isArray(posts)) {
      return NextResponse.json({ error: 'منشورات التليجرام غير صالحة' }, { status: 400 });
    }

    const parsedProducts = posts.map(p => parseTelegramPost(p.caption || '', p.imageUrls || []));

    return NextResponse.json({
      success: true,
      count: parsedProducts.length,
      products: parsedProducts
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Bulk publish approved products to live database
export async function PUT(req: NextRequest) {
  if (!(await isAdminAuthenticated(req))) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { approvedProducts } = body;

    if (!approvedProducts || !Array.isArray(approvedProducts) || approvedProducts.length === 0) {
      return NextResponse.json({ error: 'لا توجد منتجات معتمدة للنشر' }, { status: 400 });
    }

    const createdDresses = [];

    for (const item of approvedProducts) {
      // Create Dress record
      const dress = await prisma.dress.create({
        data: {
          name: item.cleanName,
          description: item.cleanDescription || item.cleanName,
          price: parseFloat(item.sellingPrice || item.price),
          isNew: true,
          isFeatured: true,
        }
      });

      // Create Variants & Images for each color + size combination
      for (const col of item.colors) {
        for (const sz of item.sizes) {
          const variant = await prisma.dressVariant.create({
            data: {
              dressId: dress.id,
              color: col.name,
              colorHex: col.hex,
              size: sz,
              quantity: 10 // Default stock
            }
          });

          // Link dress images to variant
          if (item.imageUrls && item.imageUrls.length > 0) {
            for (const imgUrl of item.imageUrls) {
              await prisma.dressImage.create({
                data: {
                  variantId: variant.id,
                  url: imgUrl
                }
              });
            }
          }
        }
      }

      createdDresses.push(dress);
    }

    return NextResponse.json({
      success: true,
      publishedCount: createdDresses.length,
      message: `تم نشر ${createdDresses.length} فستان بنجاح إلى المتجر المباشر! 🎉`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
