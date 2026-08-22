import prisma from '../src/lib/prisma.js';

const COLOR_MAP: Record<string, string> = {
  'بني': '#92400E',
  'ابيض': '#FFFFFF',
  'أبيض': '#FFFFFF',
  'خمري': '#722F37',
  'زهري': '#F472B6',
  'بيبي بلو': '#89CFF0',
  'كحلي': '#1E3A5F',
  'اسود': '#000000',
  'أسود': '#000000',
};

const newDressesData = [
  {
    name: 'فستان ساحر بقماش الكريب الفاخر مع شال طويل بتفاصيل دانتيل ناعمة 🍂',
    nickname: 'كريب فاخر وشال دانتيل',
    price: 35,
    description: 'فستان ساحر وراقي من قماش الكريب الفاخر نخب أول مع شال طويل مميز ولمسات وتفاصيل دانتيل ناعمة.',
    isNew: true,
    isFeatured: true,
    variants: [
      { color: 'بني', colorHex: '#92400E', sizes: ['36', '38', '40', '42', '44', '46'] },
      { color: 'ابيض', colorHex: '#FFFFFF', sizes: ['36', '38', '40', '42', '44', '46'] },
      { color: 'خمري', colorHex: '#722F37', sizes: ['36', '38', '40', '42', '44', '46'] },
      { color: 'زهري', colorHex: '#F472B6', sizes: ['36', '38', '40', '42', '44', '46'] },
    ]
  },
  {
    name: 'فستان اورجنزرا قصير ناعم 💕',
    nickname: 'اورجنزا قصير ناعم',
    price: 34,
    description: 'فستان قصير بقصة أنيقة ومميزة من قماش الأورجنزا الناعم والفخم مناسب لكافة المناسبات الخاصة.',
    isNew: true,
    isFeatured: true,
    variants: [
      { color: 'خمري', colorHex: '#722F37', sizes: ['36', '38', '40', '42', '44', '46'] },
      { color: 'زهري', colorHex: '#F472B6', sizes: ['36', '38', '40', '42', '44', '46'] },
      { color: 'بني', colorHex: '#92400E', sizes: ['36', '38', '40', '42', '44', '46'] },
      { color: 'بيبي بلو', colorHex: '#89CFF0', sizes: ['36', '38', '40', '42', '44', '46'] },
    ]
  },
  {
    name: 'فستان طبقتين شيفون خارجيه مع طبقة دانتيل داخليه مبطن ✨️',
    nickname: 'طبقتين شيفون ودانتيل مبطن',
    price: 37,
    description: 'فستان ملكي فاخر بتصميم طبقتين، طبقة خارجية من الشيفون الانسيابي مع طبقة دانتيل داخلية مبطنة بالكامل.',
    isNew: true,
    isFeatured: true,
    variants: [
      { color: 'كحلي', colorHex: '#1E3A5F', sizes: ['36', '38', '40', '42', '44', '46'] },
      { color: 'خمري', colorHex: '#722F37', sizes: ['36', '40'] },
      { color: 'بني', colorHex: '#92400E', sizes: ['36', '38', '40', '42', '44', '46'] },
    ]
  }
];

async function insertNewDresses() {
  console.log('🚀 جاري إضافة الفساتين الـ 3 الجديدة إلى قاعدة البيانات...');

  for (const item of newDressesData) {
    const existing = await prisma.dress.findFirst({
      where: { name: item.name },
      include: { variants: true }
    });

    if (existing) {
      console.log(`ℹ️ الفستان "${item.name}" موجود مسبقاً (ID: ${existing.id})، تخطي...`);
      continue;
    }

    const createdDress = await prisma.dress.create({
      data: {
        name: item.name,
        nickname: item.nickname,
        price: item.price,
        description: item.description,
        isNew: item.isNew,
        isFeatured: item.isFeatured,
      }
    });

    console.log(`✅ تم إنشاء الفستان: "${item.name}" (ID: ${createdDress.id})`);

    let totalVariants = 0;
    for (const vGroup of item.variants) {
      for (const size of vGroup.sizes) {
        const variant = await prisma.dressVariant.create({
          data: {
            dressId: createdDress.id,
            color: vGroup.color,
            colorHex: vGroup.colorHex,
            size: size,
            quantity: 5, // Default stock quantity
          }
        });

        // Add default placeholder image
        await prisma.dressImage.create({
          data: {
            url: '/uploads/dress1.jpg',
            variantId: variant.id,
          }
        });

        totalVariants++;
      }
    }

    console.log(`   🎨 تم إنشاء ${totalVariants} خيار (مقاس × لون) لهذا الفستان بنجاح.`);
  }

  const totalDressesInDb = await prisma.dress.count();
  const totalVariantsInDb = await prisma.dressVariant.count();

  console.log('\n===========================================================');
  console.log(`🎉 اكتملت الإضافة! إجمالي الفساتين في الموقع الآن: ${totalDressesInDb} فستاناً`);
  console.log(`📦 إجمالي الخيارات (Variants) في الموقع الآن: ${totalVariantsInDb} خياراً`);
  console.log('===========================================================');
}

insertNewDresses()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
