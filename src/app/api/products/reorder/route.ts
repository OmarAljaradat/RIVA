import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { orderedIds } = body;

    if (!orderedIds || !Array.isArray(orderedIds)) {
      return NextResponse.json({ error: 'قائمة ترتيب الفساتين غير صالحة' }, { status: 400 });
    }

    // Batch update sortOrder based on index position
    for (let index = 0; index < orderedIds.length; index++) {
      const dressId = orderedIds[index];
      await prisma.dress.update({
        where: { id: dressId },
        data: { sortOrder: index }
      });
    }

    return NextResponse.json({ success: true, message: 'تم تحديث ترتيب الفساتين بالكتالوج بنجاح! ✨' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
