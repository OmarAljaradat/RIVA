import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendTelegramOrderNotification } from '@/lib/telegramNotifier';

// ─── Rate limiting بسيط في الذاكرة ───────────────────────────────────────
const orderAttempts = new Map<string, { count: number; firstAttempt: number }>();
const RATE_LIMIT = 5;          // أقصى عدد طلبات
const RATE_WINDOW = 10 * 60 * 1000; // 10 دقائق

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = orderAttempts.get(ip);
  if (!record || now - record.firstAttempt > RATE_WINDOW) {
    orderAttempts.set(ip, { count: 1, firstAttempt: now });
    return false;
  }
  record.count++;
  return record.count > RATE_LIMIT;
}

// ─── قواعد الطلب المتعدد ─────────────────────────────────────────────────
// السايزات القياسية مرتبة — الفرق بين سايزين متجاورين = 2 رقم (مثلاً 36, 38, 40...)
// "فرق سايز واحد" = تخطي سايز كامل = فرق 4 أرقام (مثلاً 38 → 42 ✅، 38 → 40 ❌)
const STANDARD_SIZES = ['28', '30', '32', '34', '36', '38', '40', '42', '44', '46', '48', '50', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];

function getSizeIndex(size: string): number {
  const normalized = size.trim().toUpperCase();
  const idx = STANDARD_SIZES.findIndex(s => s.toUpperCase() === normalized);
  return idx; // -1 إذا غير معروف
}

function validateMultiItemRules(
  variants: Array<{ id: number; color: string; size: string; dress: { id: number } | null }>
): string | null {
  // للتبسيط: نتحقق من كل زوج من المنتجات
  for (let i = 0; i < variants.length; i++) {
    for (let j = i + 1; j < variants.length; j++) {
      const a = variants[i];
      const b = variants[j];

      const sameDress = a.dress?.id === b.dress?.id;
      const sameColor = a.color.trim().toLowerCase() === b.color.trim().toLowerCase();

      if (sameDress) {
        // ─── نفس الموديل ───────────────────────────────────────────────
        // السايز لازم يكون فرقه سايزين أو أكثر (فرق 4 أرقام على الأقل)
        const idxA = getSizeIndex(a.size);
        const idxB = getSizeIndex(b.size);

        if (idxA === -1 || idxB === -1) {
          // إذا السايز غير قياسي — اسمح ما دام مختلف
          if (a.size.trim().toLowerCase() === b.size.trim().toLowerCase()) {
            return 'لا يمكن طلب نفس الفستان بنفس المقاس — يجب أن يكون هناك فرق سايز واحد على الأقل';
          }
        } else {
          const gap = Math.abs(idxA - idxB);
          if (gap < 2) {
            return `لا يمكن طلب نفس الفستان بمقاسين متقاربين (${a.size} و${b.size}) — الفرق لازم يكون سايز واحد كامل على الأقل (مثلاً 38 مع 42)`;
          }
        }
      } else {
        // ─── موديل مختلف ───────────────────────────────────────────────
        if (sameColor) {
          // موديل مختلف + نفس اللون = ممنوع دائماً
          return `لا يمكن طلب فستانين مختلفين بنفس اللون (${a.color}) — يجب أن يكون اللون مختلفاً`;
        }
        // موديل مختلف + لون مختلف = مسموح بأي فرق سايز ✅
      }
    }
  }
  return null; // كل شيء صحيح
}



// ─── GET: قائمة الطلبات (للإدمن فقط — محمية بـ middleware) ──────────────
export async function GET(request: NextRequest) {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            dress: { select: { id: true, name: true, nickname: true, price: true } },
            variant: { select: { id: true, color: true, colorHex: true, size: true, quantity: true } },
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(orders);
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في جلب الطلبات' }, { status: 500 });
  }
}

// ─── POST: إنشاء طلب جديد ────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة لاحقاً' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { customerName, phone, address, city, notes, items } = body;

    // ─── Server-side Input Validation ─────────────────────────────────────
    if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2 || customerName.length > 100) {
      return NextResponse.json({ error: 'الاسم غير صحيح' }, { status: 400 });
    }
    if (!phone || typeof phone !== 'string' || !/^07[0-9]{8}$/.test(phone.trim())) {
      return NextResponse.json({ error: 'رقم الهاتف غير صحيح' }, { status: 400 });
    }
    if (!address || typeof address !== 'string' || address.trim().length < 3 || address.length > 300) {
      return NextResponse.json({ error: 'العنوان غير صحيح' }, { status: 400 });
    }
    if (!city || typeof city !== 'string' || city.length > 50) {
      return NextResponse.json({ error: 'المدينة غير صحيحة' }, { status: 400 });
    }
    if (notes && (typeof notes !== 'string' || notes.length > 1000)) {
      return NextResponse.json({ error: 'الملاحظات طويلة جداً' }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0 || items.length > 10) {
      return NextResponse.json({ error: 'بيانات المنتجات غير صحيحة' }, { status: 400 });
    }

    // التحقق من كل منتج
    for (const item of items) {
      const qty = Number(item.quantity);
      if (isNaN(qty) || qty < 1 || qty > 10) {
        return NextResponse.json({ error: 'الكمية يجب أن تكون بين 1 و10' }, { status: 400 });
      }
      if (isNaN(Number(item.dressId)) || isNaN(Number(item.variantId))) {
        return NextResponse.json({ error: 'بيانات المنتج غير صحيحة' }, { status: 400 });
      }
    }

    // ─── السعر يُحسب من قاعدة البيانات — لا نثق بالسعر القادم من العميل
    const variantIds = items.map((item: any) => Number(item.variantId));
    const variants = await prisma.dressVariant.findMany({
      where: { id: { in: variantIds } },
      include: { dress: { select: { id: true, price: true } } },
    });

    // التحقق من توفر المنتجات وحساب السعر الحقيقي
    let itemsTotal = 0;
    for (const item of items) {
      const variantIdNum = Number(item.variantId);
      const qty = Number(item.quantity) || 1;
      const dbVariant = variants.find(v => v.id === variantIdNum);

      if (!dbVariant) {
        return NextResponse.json({ error: 'المنتج غير موجود' }, { status: 400 });
      }
      if (dbVariant.quantity < qty) {
        return NextResponse.json({ error: 'الكمية المطلوبة غير متوفرة في المخزون' }, { status: 400 });
      }
      // السعر الحقيقي من قاعدة البيانات
      itemsTotal += (dbVariant.dress?.price || 0) * qty;
    }

    // ─── قواعد الطلب المتعدد ──────────────────────────────────────────────
    if (variants.length > 1) {
      const multiItemError = validateMultiItemRules(variants as any[]);
      if (multiItemError) {
        return NextResponse.json({ error: multiItemError }, { status: 400 });
      }
    }

    const deliveryFee = 3; // ثابت من السيرفر
    const total = itemsTotal + deliveryFee;

    const order = await prisma.$transaction(async (tx: any) => {
      // تخفيض الكميات
      for (const item of items) {
        const variantIdNum = Number(item.variantId);
        const qtyNum = Number(item.quantity) || 1;
        await tx.dressVariant.update({
          where: { id: variantIdNum },
          data: { quantity: { decrement: qtyNum } },
        });
      }

      // إنشاء الطلب بالسعر الحقيقي من DB
      return tx.order.create({
        data: {
          customerName: String(customerName).trim().slice(0, 100),
          phone: String(phone).trim(),
          address: String(address).trim().slice(0, 300),
          city: String(city).trim().slice(0, 50),
          notes: notes ? String(notes).trim().slice(0, 1000) : null,
          status: 'pending',
          total: Number(total),
          items: {
            create: items.map((item: any) => {
              const dbVariant = variants.find(v => v.id === Number(item.variantId));
              return {
                dressId: Number(item.dressId),
                variantId: Number(item.variantId),
                quantity: Number(item.quantity) || 1,
                price: dbVariant?.dress?.price || 0, // السعر الحقيقي من DB
              };
            }),
          },
        },
        include: {
          items: {
            include: {
              dress: { select: { id: true, name: true, nickname: true, price: true } },
              variant: { select: { id: true, color: true, colorHex: true, size: true } },
            }
          }
        },
      });
    });

    // إرسال إشعار التيليجرام بانتظار الإرسال لضمان عدم قطعه في بيئات Serverless
    try {
      await sendTelegramOrderNotification(order);
    } catch (err) {
      console.error('Failed to send Telegram notification:', err);
    }

    return NextResponse.json(order, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في تثبيت الطلب، يرجى المحاولة مرة أخرى' }, { status: 500 });
  }
}
