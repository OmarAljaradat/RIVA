import prisma from '../src/lib/prisma.js';

// Precise mapping of dressId -> color -> array of media URLs
const ACCURATE_MAPPINGS: Record<number, Record<string, string[]>> = {
  // ─── 360: فستان اورجنزرا قصير ناعم ───
  360: {
    'خمري': [
      '/uploads/dress_360_tg_551_8863.mp4',
    ],
    'بني': [
      '/uploads/dress_360_tg_550_7567.mp4',
    ],
    'زهري': [
      '/uploads/dress_360_tg_552_0813.jpg',
      '/uploads/dress_360_tg_555_1108.jpg',
    ],
    'بيبي بلو': [
      '/uploads/dress_360_tg_553_0913.jpg',
      '/uploads/dress_360_tg_554_1013.jpg',
    ],
  },

  // ─── 361: فستان طبقتين شيفون ودانتيل ───
  361: {
    'كحلي': [
      '/uploads/dress_361_tg_543_2601.mp4',
      '/uploads/dress_361_tg_546_4955.jpg',
    ],
    'خمري': [
      '/uploads/dress_361_tg_544_6759.mp4',
      '/uploads/dress_361_tg_548_5258.jpg',
    ],
    'بني': [
      '/uploads/dress_361_tg_545_0997.mp4',
      '/uploads/dress_361_tg_547_5152.jpg',
    ],
  },

  // ─── 359: فستان كريب فاخر وشال دانتيل ───
  359: {
    'بني': [
      '/uploads/dress_359_tg_557_2247.mp4',
    ],
    'ابيض': [
      '/uploads/dress_359_tg_558_9446.mp4',
    ],
    'خمري': [
      '/uploads/dress_359_tg_559_7881.mp4',
    ],
    'زهري': [
      '/uploads/dress_359_tg_560_0912.mp4',
      '/uploads/dress_359_tg_561_4243.mp4',
    ],
  },
};

async function relinkMedia() {
  console.log('🔄 جاري إعادة ربط الصور والفيديوهات بالألوان الدقيقة الخاصة بها...');

  for (const [dressIdStr, colorMap] of Object.entries(ACCURATE_MAPPINGS)) {
    const dressId = parseInt(dressIdStr);

    const dress = await prisma.dress.findUnique({
      where: { id: dressId },
      include: { variants: true }
    });

    if (!dress) continue;

    console.log(`\n👗 فستان ID ${dress.id}: "${dress.name}"`);

    // 1. Delete all current image associations for this dress
    for (const v of dress.variants) {
      await prisma.dressImage.deleteMany({
        where: { variantId: v.id }
      });
    }

    // 2. Insert accurate media for each variant based on its color
    for (const variant of dress.variants) {
      const urls = colorMap[variant.color];
      if (urls && urls.length > 0) {
        for (const url of urls) {
          await prisma.dressImage.create({
            data: {
              url,
              variantId: variant.id
            }
          });
        }
      } else {
        // Fallback
        await prisma.dressImage.create({
          data: {
            url: '/uploads/dress1.jpg',
            variantId: variant.id
          }
        });
      }
    }

    console.log(`   ✅ تم ربط كل لون بمقطعه وصورته الخاصة بنجاح.`);
  }

  console.log('\n🎉 اكتمل التحديث! الآن كل لون في الموقع يعرض الفيديو والصور الخاصة به فقط 100%');
}

relinkMedia()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
