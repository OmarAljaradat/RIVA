import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.dressImage.deleteMany();
  await prisma.dressVariant.deleteMany();
  await prisma.dress.deleteMany();

  // Create dresses with variants
  const dress1 = await prisma.dress.create({
    data: {
      name: 'فستان سهرة أنيق',
      description: 'فستان سهرة فاخر بتصميم عصري وأنيق، مناسب للمناسبات الخاصة والحفلات. قماش ساتان ناعم مع تطريز يدوي راقي.',
      price: 65,
      isNew: true,
      isFeatured: true,
      variants: {
        create: [
          { color: 'أسود', colorHex: '#000000', size: 'S', quantity: 5 },
          { color: 'أسود', colorHex: '#000000', size: 'M', quantity: 8 },
          { color: 'أسود', colorHex: '#000000', size: 'L', quantity: 3 },
          { color: 'أسود', colorHex: '#000000', size: 'XL', quantity: 2 },
          { color: 'عنابي', colorHex: '#800020', size: 'S', quantity: 4 },
          { color: 'عنابي', colorHex: '#800020', size: 'M', quantity: 6 },
          { color: 'عنابي', colorHex: '#800020', size: 'L', quantity: 3 },
        ],
      },
    },
  });

  // Add images for dress1 variants
  const dress1Variants = await prisma.dressVariant.findMany({ where: { dressId: dress1.id } });
  for (const variant of dress1Variants) {
    await prisma.dressImage.create({
      data: {
        url: '/uploads/dress1.jpg',
        variantId: variant.id,
      },
    });
  }

  const dress2 = await prisma.dress.create({
    data: {
      name: 'فستان كوكتيل عصري',
      description: 'فستان كوكتيل بقصة أنيقة، مثالي للسهرات والمناسبات شبه الرسمية. قماش شيفون مع لمسات من الدانتيل.',
      price: 45,
      isNew: true,
      isFeatured: true,
      variants: {
        create: [
          { color: 'أحمر', colorHex: '#DC2626', size: 'S', quantity: 6 },
          { color: 'أحمر', colorHex: '#DC2626', size: 'M', quantity: 4 },
          { color: 'أحمر', colorHex: '#DC2626', size: 'L', quantity: 5 },
          { color: 'أحمر', colorHex: '#DC2626', size: 'XL', quantity: 2 },
          { color: 'وردي', colorHex: '#EC4899', size: 'S', quantity: 3 },
          { color: 'وردي', colorHex: '#EC4899', size: 'M', quantity: 5 },
          { color: 'وردي', colorHex: '#EC4899', size: 'L', quantity: 4 },
        ],
      },
    },
  });

  const dress2Variants = await prisma.dressVariant.findMany({ where: { dressId: dress2.id } });
  for (const variant of dress2Variants) {
    await prisma.dressImage.create({
      data: {
        url: '/uploads/dress2.jpg',
        variantId: variant.id,
      },
    });
  }

  const dress3 = await prisma.dress.create({
    data: {
      name: 'فستان سواريه كحلي',
      description: 'فستان سواريه بلون كحلي داكن مع تفاصيل كريستال على الصدر. تصميم كلاسيكي يناسب جميع المناسبات الرسمية.',
      price: 85,
      isNew: true,
      isFeatured: false,
      variants: {
        create: [
          { color: 'كحلي', colorHex: '#1E3A5F', size: 'S', quantity: 3 },
          { color: 'كحلي', colorHex: '#1E3A5F', size: 'M', quantity: 7 },
          { color: 'كحلي', colorHex: '#1E3A5F', size: 'L', quantity: 4 },
          { color: 'كحلي', colorHex: '#1E3A5F', size: 'XL', quantity: 2 },
          { color: 'أزرق', colorHex: '#2563EB', size: 'M', quantity: 3 },
          { color: 'أزرق', colorHex: '#2563EB', size: 'L', quantity: 2 },
        ],
      },
    },
  });

  const dress3Variants = await prisma.dressVariant.findMany({ where: { dressId: dress3.id } });
  for (const variant of dress3Variants) {
    await prisma.dressImage.create({
      data: {
        url: '/uploads/dress3.jpg',
        variantId: variant.id,
      },
    });
  }

  const dress4 = await prisma.dress.create({
    data: {
      name: 'فستان ذهبي فاخر',
      description: 'فستان مسائي بلون ذهبي لامع. قماش حرير مع تطريز يدوي بخيوط ذهبية. مناسب لحفلات الخطوبة والأعراس.',
      price: 120,
      isNew: false,
      isFeatured: true,
      variants: {
        create: [
          { color: 'ذهبي', colorHex: '#D4AF37', size: 'S', quantity: 2 },
          { color: 'ذهبي', colorHex: '#D4AF37', size: 'M', quantity: 4 },
          { color: 'ذهبي', colorHex: '#D4AF37', size: 'L', quantity: 3 },
          { color: 'ذهبي', colorHex: '#D4AF37', size: 'XL', quantity: 1 },
          { color: 'فضي', colorHex: '#C0C0C0', size: 'S', quantity: 3 },
          { color: 'فضي', colorHex: '#C0C0C0', size: 'M', quantity: 5 },
          { color: 'فضي', colorHex: '#C0C0C0', size: 'L', quantity: 2 },
        ],
      },
    },
  });

  const dress4Variants = await prisma.dressVariant.findMany({ where: { dressId: dress4.id } });
  for (const variant of dress4Variants) {
    await prisma.dressImage.create({
      data: {
        url: '/uploads/dress4.jpg',
        variantId: variant.id,
      },
    });
  }

  const dress5 = await prisma.dress.create({
    data: {
      name: 'فستان بيج كلاسيكي',
      description: 'فستان بقصة كلاسيكية أنيقة بلون بيج هادئ. مناسب للمناسبات النهارية والسهرات الخفيفة.',
      price: 55,
      isNew: true,
      isFeatured: false,
      variants: {
        create: [
          { color: 'بيج', colorHex: '#D4B896', size: 'S', quantity: 7 },
          { color: 'بيج', colorHex: '#D4B896', size: 'M', quantity: 5 },
          { color: 'بيج', colorHex: '#D4B896', size: 'L', quantity: 4 },
          { color: 'بيج', colorHex: '#D4B896', size: 'XL', quantity: 3 },
          { color: 'كريمي', colorHex: '#FFFDD0', size: 'S', quantity: 4 },
          { color: 'كريمي', colorHex: '#FFFDD0', size: 'M', quantity: 6 },
        ],
      },
    },
  });

  const dress5Variants = await prisma.dressVariant.findMany({ where: { dressId: dress5.id } });
  for (const variant of dress5Variants) {
    await prisma.dressImage.create({
      data: {
        url: '/uploads/dress1.jpg',
        variantId: variant.id,
      },
    });
  }

  const dress6 = await prisma.dress.create({
    data: {
      name: 'فستان موف ملكي',
      description: 'فستان بلون موف ملكي فاخر مع أكمام شيفون. تصميم حديث يجمع بين الأناقة والراحة.',
      price: 75,
      isNew: false,
      isFeatured: true,
      variants: {
        create: [
          { color: 'موف', colorHex: '#A855F7', size: 'S', quantity: 3 },
          { color: 'موف', colorHex: '#A855F7', size: 'M', quantity: 5 },
          { color: 'موف', colorHex: '#A855F7', size: 'L', quantity: 4 },
          { color: 'بنفسجي', colorHex: '#7C3AED', size: 'S', quantity: 2 },
          { color: 'بنفسجي', colorHex: '#7C3AED', size: 'M', quantity: 3 },
          { color: 'بنفسجي', colorHex: '#7C3AED', size: 'L', quantity: 2 },
        ],
      },
    },
  });

  const dress6Variants = await prisma.dressVariant.findMany({ where: { dressId: dress6.id } });
  for (const variant of dress6Variants) {
    await prisma.dressImage.create({
      data: {
        url: '/uploads/dress2.jpg',
        variantId: variant.id,
      },
    });
  }

  // Create sample orders
  const variant1 = dress1Variants[0];
  const variant2 = dress2Variants[0];

  await prisma.order.create({
    data: {
      customerName: 'سارة أحمد',
      phone: '0791234567',
      address: 'شارع الجامعة، بناية رقم 15',
      city: 'عمان',
      status: 'confirmed',
      total: 65,
      items: {
        create: [
          {
            dressId: dress1.id,
            variantId: variant1.id,
            quantity: 1,
            price: 65,
          },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      customerName: 'ليلى محمد',
      phone: '0781234567',
      address: 'شارع الحسين، عمارة النور',
      city: 'إربد',
      status: 'pending',
      total: 45,
      items: {
        create: [
          {
            dressId: dress2.id,
            variantId: variant2.id,
            quantity: 1,
            price: 45,
          },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      customerName: 'نور العلي',
      phone: '0771234567',
      address: 'حي الرشيد، شارع 20',
      city: 'الزرقاء',
      status: 'shipped',
      total: 85,
      items: {
        create: [
          {
            dressId: dress3.id,
            variantId: dress3Variants[1].id,
            quantity: 1,
            price: 85,
          },
        ],
      },
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log(`   - ${6} dresses created`);
  console.log(`   - ${3} sample orders created`);
}

seed()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
