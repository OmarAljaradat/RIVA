import 'dotenv/config';
import prisma from '../src/lib/prisma.js';

async function wipeAllDresses() {
  console.log('🗑️ جاري حذف جميع الفساتين والمتغيرات والصور من قاعدة البيانات Neon للبدء بسجل نظيف تماماً...\n');

  try {
    // Delete order items first to avoid foreign key constraints if any
    const deletedOrderItems = await prisma.orderItem.deleteMany({});
    console.log(`- تم مسح ${deletedOrderItems.count} عنصر طلبات مرتبطة.`);

    // Delete dress images
    const deletedImages = await prisma.dressImage.deleteMany({});
    console.log(`- تم مسح ${deletedImages.count} صورة وفيديو.`);

    // Delete dress variants
    const deletedVariants = await prisma.dressVariant.deleteMany({});
    console.log(`- تم مسح ${deletedVariants.count} متغير ولون ومقاس.`);

    // Delete dresses
    const deletedDresses = await prisma.dress.deleteMany({});
    console.log(`- تم مسح ${deletedDresses.count} فستان بالكامل.`);

    console.log('\n✅ قاعدة البيانات الآن نظيفة تماماً 100% وجاهزة للسحب الجديد بدون أي تراكمات سابقة!');
  } catch (err) {
    console.error('❌ خطأ أثناء الحذف:', err);
  }
}

wipeAllDresses().catch(console.error);
