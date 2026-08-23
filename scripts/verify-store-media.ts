import 'dotenv/config';
import prisma from '../src/lib/prisma.js';

async function verifyStoreMedia() {
  const dresses = await prisma.dress.findMany({
    include: { variants: { include: { images: true } } },
    orderBy: { sortOrder: 'asc' }
  });

  console.log(`👗 إجمالي الفساتين في المتجر: ${dresses.length}\n`);

  let totalVideos = 0;
  let totalPhotos = 0;

  for (let i = 0; i < dresses.length; i++) {
    const d = dresses[i];
    const colors = Array.from(new Set(d.variants.map(v => v.color)));
    const allUrls = Array.from(new Set(d.variants.flatMap(v => v.images.map(img => img.url))));
    const vids = allUrls.filter(u => u.includes('.mp4') || u.includes('.webm'));
    const photos = allUrls.filter(u => !u.includes('.mp4') && !u.includes('.webm'));

    totalVideos += vids.length;
    totalPhotos += photos.length;

    console.log(`#${i + 1} [ID ${d.id}] "${d.name.slice(0, 45)}"`);
    console.log(`   🎨 الألوان (${colors.length}): [${colors.join(', ')}]`);
    console.log(`   🎬 الوسائط: ${photos.length} صور 📸 | ${vids.length} فيديوهات 🎬`);
  }

  console.log(`\n✨ الحصيلة الإجمالية للمتجر: ${totalPhotos} صورة فوتوغرافية و ${totalVideos} مقطع فيديو عالي الدقة.`);
}

verifyStoreMedia().catch(console.error);
