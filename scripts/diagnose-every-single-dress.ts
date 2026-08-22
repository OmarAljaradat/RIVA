import 'dotenv/config';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import prisma from '../src/lib/prisma.js';
import fs from 'fs';
import path from 'path';

const apiId = 34081063;
const apiHash = '018dc673429227e26a1b8d9d65eb76ca';
const stringSession = process.env.TELEGRAM_USER_SESSION || '';

async function diagnose() {
  const dresses = await prisma.dress.findMany({
    include: {
      variants: {
        include: { images: true }
      }
    },
    orderBy: { id: 'asc' }
  });

  console.log(`👗 فحص شامل للـ ${dresses.length} فستان في قاعدة البيانات:\n`);

  for (const d of dresses) {
    const colors = Array.from(new Set(d.variants.map(v => v.color.trim())));
    const allImages = d.variants.flatMap(v => v.images.map(img => img.url));
    const uniqueImages = Array.from(new Set(allImages));
    
    // Check if images exist on disk
    const missingImages = uniqueImages.filter(url => {
      if (url.startsWith('/uploads/')) {
        const localPath = path.join(process.cwd(), 'public', url);
        return !fs.existsSync(localPath);
      }
      return false;
    });

    console.log(`----------------------------------------------------------------`);
    console.log(`[ID ${d.id}] "${d.name}" | السعر: ${d.price} د.أ`);
    console.log(`   🎨 الألوان الحالية (${colors.length}): ${colors.join(', ')}`);
    console.log(`   🖼️ الصور والفيديوهات (${uniqueImages.length}): ${uniqueImages.slice(0, 3).join(', ')}${uniqueImages.length > 3 ? '...' : ''}`);
    if (uniqueImages.length === 0) {
      console.log(`   🚨 تحذير: لا توجد أي صورة أو فيديو لهذا الفستان (ستظهر بطاقته بيضاء!)`);
    }
    if (missingImages.length > 0) {
      console.log(`   ❌ ملفات مفقودة من السيرفر (${missingImages.length}): ${missingImages.join(', ')}`);
    }
  }
}

diagnose().catch(console.error);
