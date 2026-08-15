import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    // Clean existing data
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.dressImage.deleteMany();
    await prisma.dressVariant.deleteMany();
    await prisma.dress.deleteMany();

    // 6 Realistic Dresses derived from Telegram with Auto Pricing (+8 / +9 JOD)
    const dressesData = [
      {
        name: 'فستان شيفون راقي مبطن',
        description: 'فستان شيفون نخب أول مبطن بالكامل بقصة ملكية أنيقة، خامات فاخرة ومريحة للتنقل والسهرات.',
        costPrice: 20,
        price: 29, // 20 + 9 = 29 JOD
        originalPrice: 38,
        sortOrder: 0,
        colors: [
          { name: 'خمري', hex: '#722F37' },
          { name: 'كحلي', hex: '#1E3A5F' },
          { name: 'أسود', hex: '#000000' }
        ],
        sizes: ['38', '40', '42', '44', '46'],
        img: '/uploads/dress1.jpg'
      },
      {
        name: 'طقم قطعتين قماش كريب رويال',
        description: 'طقم فاخر قطعتين قماش كريب رويال ممتازة، مبطن بالكامل ومصمم بأعلى معايير الأناقة.',
        costPrice: 30,
        price: 38, // 30 + 8 = 38 JOD
        originalPrice: 48,
        sortOrder: 1,
        colors: [
          { name: 'عنابي', hex: '#800020' },
          { name: 'أسود', hex: '#000000' },
          { name: 'بيج', hex: '#F5F5DC' }
        ],
        sizes: ['36', '38', '40', '42'],
        img: '/uploads/dress2.jpg'
      },
      {
        name: 'فستان مخمل ملكي تطريز يدوي',
        description: 'فستان مخمل فاخر جداً بتطريز يدوي أنيق على الصدر والأكمام، يناسب سهرات الشتاء والمناسبات الخاصة.',
        costPrice: 24,
        price: 33, // 24 + 9 = 33 JOD
        originalPrice: 42,
        sortOrder: 2,
        colors: [
          { name: 'كحلي', hex: '#1E3A5F' },
          { name: 'خمري', hex: '#722F37' },
          { name: 'زيتي', hex: '#556B2F' }
        ],
        sizes: ['40', '42', '44'],
        img: '/uploads/dress3.jpg'
      },
      {
        name: 'فستان شيفون طبقات مطرز',
        description: 'فستان شيفون طبقات مميز بتصميم بوهيمي أنيق، قماش ناعم وخفيف متوفر بألوان ساحرة.',
        costPrice: 35,
        price: 43, // 35 + 8 = 43 JOD
        originalPrice: 55,
        sortOrder: 3,
        colors: [
          { name: 'وردي', hex: '#FFC0CB' },
          { name: 'بيج', hex: '#F5F5DC' },
          { name: 'أسود', hex: '#000000' }
        ],
        sizes: ['38', '40', '42', '44'],
        img: '/uploads/dress4.jpg'
      },
      {
        name: 'فستان سهرة ساتان ميكادو فاخر',
        description: 'فستان سهرة ساتان ميكادو بريق ملكي ساحر، بقصة مجسمة تبرز جمال أنوثتك.',
        costPrice: 22,
        price: 31, // 22 + 9 = 31 JOD
        originalPrice: 40,
        sortOrder: 4,
        colors: [
          { name: 'ذهبي', hex: '#D4AF37' },
          { name: 'زيتي', hex: '#556B2F' },
          { name: 'خمري', hex: '#722F37' }
        ],
        sizes: ['36', '38', '40'],
        img: '/uploads/dress1.jpg'
      },
      {
        name: 'عباية فستان ملكية بقصة فرنسية',
        description: 'تصميم راقي يجمع بين العباية الملكية واللفيف الفرنسي، خامات كريب ومبطنة بالكامل.',
        costPrice: 28,
        price: 36, // 28 + 8 = 36 JOD
        originalPrice: 45,
        sortOrder: 5,
        colors: [
          { name: 'أسود', hex: '#000000' },
          { name: 'كحلي', hex: '#1E3A5F' },
          { name: 'بني', hex: '#6B4226' }
        ],
        sizes: ['38', '40', '42', '44', '46'],
        img: '/uploads/dress2.jpg'
      }
    ];

    const createdDresses = [];

    for (const d of dressesData) {
      const dress = await prisma.dress.create({
        data: {
          name: d.name,
          description: d.description,
          price: d.price,
          originalPrice: d.originalPrice,
          sortOrder: d.sortOrder,
          isNew: true,
          isFeatured: true
        }
      });

      for (const col of d.colors) {
        for (const sz of d.sizes) {
          const variant = await prisma.dressVariant.create({
            data: {
              dressId: dress.id,
              color: col.name,
              colorHex: col.hex,
              size: sz,
              quantity: 5
            }
          });

          await prisma.dressImage.create({
            data: {
              variantId: variant.id,
              url: d.img
            }
          });
        }
      }

      createdDresses.push(dress);
    }

    // Create 2 sample orders for financial testing
    const firstDressVariants = await prisma.dressVariant.findMany({ where: { dressId: createdDresses[0].id } });
    await prisma.order.create({
      data: {
        customerName: 'فرح الزعبي',
        phone: '0798765432',
        address: 'دابوق، شارع الملك عبد الله',
        city: 'عمان',
        status: 'confirmed',
        total: 32, // 29 dress + 3 delivery
        items: {
          create: [{ dressId: createdDresses[0].id, variantId: firstDressVariants[0].id, quantity: 1, price: 29 }]
        }
      }
    });

    return NextResponse.json({ success: true, count: createdDresses.length, message: 'Database populated with 6 Telegram dresses!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
