import { NextRequest, NextResponse } from 'next/server';
import { parseDressWithAi } from '@/lib/ai-parser';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { text, autoSave } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'يرجى تزويد نص الفستان للتحليل' }, { status: 400 });
    }

    const parsed = await parseDressWithAi(text);

    if (!parsed) {
      return NextResponse.json({ error: 'لم يتمكن الذكاء الاصطناعي من استخراج البيانات' }, { status: 400 });
    }

    if (autoSave) {
      // Save directly to Prisma DB
      const createdDress = await prisma.dress.create({
        data: {
          name: parsed.name,
          description: parsed.description,
          price: parsed.sellingPrice,
          originalPrice: null,
          sortOrder: 1, // Add to top
          isNew: true,
          isFeatured: true,
          variants: {
            create: parsed.variants.map(v => ({
              color: v.color,
              colorHex: v.colorHex,
              size: v.size,
              quantity: v.quantity,
              images: {
                create: [{ url: '/uploads/dress1.jpg' }]
              }
            }))
          }
        },
        include: {
          variants: { include: { images: true } }
        }
      });

      return NextResponse.json({
        success: true,
        message: 'تم التحليل والحفظ بنجاح بواسطة الذكاء الاصطناعي ✨',
        parsed,
        dress: createdDress
      });
    }

    return NextResponse.json({
      success: true,
      parsed
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في معالجة النص' }, { status: 500 });
  }
}
