import 'dotenv/config';
import prisma from '../src/lib/prisma.js';
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

async function relinkAllDressImages() {
  console.log('🔗 جاري فحص وربط جميع الصور والفيديوهات الموجودة على السيرفر بالفساتين وألوانها...\n');

  const files = fs.readdirSync(UPLOADS_DIR);
  console.log(`📁 إجمالي ملفات الميديا المتوفرة في uploads: ${files.length} ملف.\n`);

  const dresses = await prisma.dress.findMany({
    include: {
      variants: {
        include: { images: true }
      }
    },
    orderBy: { id: 'asc' }
  });

  let linkedCount = 0;

  for (const dress of dresses) {
    // Find all files belonging to this dress
    const dressFiles = files.filter(f => f.startsWith(`dress_${dress.id}_`));

    for (const v of dress.variants) {
      // 1. Look for color-specific media
      let colorFiles = dressFiles.filter(f => f.includes(`_color_${v.color.trim()}_`));
      
      // 2. If no color-specific media, use any dress media
      if (colorFiles.length === 0 && dressFiles.length > 0) {
        colorFiles = dressFiles;
      }

      for (const cf of colorFiles) {
        const url = `/uploads/${cf}`;
        const exists = v.images.some(img => img.url === url);
        if (!exists) {
          await prisma.dressImage.create({
            data: {
              url,
              variantId: v.id
            }
          });
          linkedCount++;
        }
      }

      // Remove placeholder /uploads/dress1.jpg if real files exist
      if (colorFiles.length > 0) {
        await prisma.dressImage.deleteMany({
          where: { variantId: v.id, url: '/uploads/dress1.jpg' }
        });
      }
    }
  }

  console.log(`\n🎉 تم ربط ${linkedCount} رابط ميديا حقيقي جديد بنجاح!`);
}

relinkAllDressImages().catch(console.error);
