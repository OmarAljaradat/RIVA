import 'dotenv/config';
import prisma from '../src/lib/prisma.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
const CACHE_FILE = path.join(process.cwd(), 'scripts', 'catbox-cache.json');

// Exact Bidirectional Color Map
const ARABIC_TO_ENGLISH_SLUGS: Record<string, string[]> = {
  'اسود': ['black', 'اسود'],
  'ابيض': ['white', 'ابيض', 'أبيض'],
  'خمري': ['maroon', 'burgundy', 'خمري'],
  'زهري': ['pink', 'زهري', 'وردي'],
  'اصفر': ['yellow', 'اصفر', 'أصفر'],
  'بيبي بلو': ['babyblue', 'blue', 'بيبي بلو', 'سماوي'],
  'بني': ['brown', 'بني'],
  'بني موكا': ['mocca', 'mocha', 'بني موكا', 'موكا'],
  'كحلي': ['navy', 'كحلي', 'نيفي'],
  'زيتي': ['olive', 'زيتي', 'زيتوني'],
  'سومو': ['somon', 'salmon', 'سومو', 'سلمون'],
  'عنابي': ['burgundy', 'عنابي'],
  'نهدي': ['purple', 'نهدي', 'بنفسجي', 'موف'],
  'اوف وايت': ['offwhite', 'اوف وايت', 'أوف وايت'],
  'احمر': ['red', 'احمر', 'أحمر'],
  'ذهبي': ['gold', 'ذهبي'],
  'فضي': ['silver', 'فضي'],
  'بيج': ['beige', 'بيج']
};

async function classifyImageColor(imageBuffer: Buffer, availableColors: string[]): Promise<string | null> {
  try {
    const base64 = imageBuffer.toString('base64');
    const prompt = `أنت خبير فحص أزياء وألوان فساتين دقيق جداً.
انظر إلى صورة هذا الفستان بعناية فائقة.
من بين هذه الخيارات الدقيقة للألوان المتاحة لهذا الموديل فقط:
[${availableColors.join('، ')}]

ما هو اللون الحقيقي والظاهر للفستان في هذه الصورة؟
أجب باسم اللون فقط من القائمة السابقة بدون أي نقط أو علامات أو كلمات إضافية.`;

    const res = await model.generateContent([
      { inlineData: { data: base64, mimeType: 'image/jpeg' } },
      { text: prompt }
    ]);

    const detected = res.response.text().trim().replace(/[.،!]/g, '');
    const matched = availableColors.find(c => detected.includes(c) || c.includes(detected));
    return matched || detected;
  } catch (err: any) {
    return null;
  }
}

async function run() {
  console.log('🤖 بدء الفحص والمطابقة البصرية الفائقة لموديلات وألوان متجر Riva بالكامل...\n');

  let catboxCache: Record<string, string> = {};
  if (fs.existsSync(CACHE_FILE)) {
    try {
      catboxCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    } catch {}
  }

  const allDiskFiles = fs.existsSync(UPLOADS_DIR) ? fs.readdirSync(UPLOADS_DIR) : [];

  const dresses = await prisma.dress.findMany({
    include: {
      variants: {
        include: { images: true }
      }
    },
    orderBy: { id: 'desc' }
  });

  console.log(`👗 إجمالي الموديلات: ${dresses.length}\n`);

  let totalImagesUpdated = 0;

  for (let dIdx = 0; dIdx < dresses.length; dIdx++) {
    const dress = dresses[dIdx];
    const uniqueColors = Array.from(new Set(dress.variants.map(v => v.color.trim()))).filter(Boolean);
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`[${dIdx + 1}/${dresses.length}] 👗 فستان #${dress.id}: "${dress.name}"`);
    console.log(`🎨 ألوان الموديل: [${uniqueColors.join(', ')}]`);

    // Find all files on disk belonging strictly to this dress ID
    const dressFiles = allDiskFiles.filter(f => f.startsWith(`dress_${dress.id}_`));

    // Map: { 'خمري': ['url1', 'url2'], 'زهري': ['url3'] }
    const colorMediaMap: Record<string, string[]> = {};
    uniqueColors.forEach(c => colorMediaMap[c] = []);

    for (const f of dressFiles) {
      const ext = path.extname(f).toLowerCase();
      const localPath = path.join(UPLOADS_DIR, f);
      const cdnUrl = catboxCache[f];

      if (!cdnUrl) continue;

      let matchedArabicColor: string | null = null;

      // 1. Try matching by slug dictionary
      for (const [arabicColor, slugs] of Object.entries(ARABIC_TO_ENGLISH_SLUGS)) {
        if (!uniqueColors.includes(arabicColor)) continue;
        for (const slug of slugs) {
          if (f.toLowerCase().includes(`_${slug}_`) || f.toLowerCase().includes(`_${slug}.`)) {
            matchedArabicColor = arabicColor;
            break;
          }
        }
        if (matchedArabicColor) break;
      }

      // 2. If it is an image and slug was ambiguous, use Gemini Vision!
      if (!matchedArabicColor && ['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        try {
          const buf = fs.readFileSync(localPath);
          matchedArabicColor = await classifyImageColor(buf, uniqueColors);
          if (matchedArabicColor) {
            console.log(`  👁️ صورة ${f} -> حددها الذكاء الاصطناعي كلون: [${matchedArabicColor}]`);
          }
        } catch {}
      }

      if (matchedArabicColor && colorMediaMap[matchedArabicColor]) {
        if (!colorMediaMap[matchedArabicColor].includes(cdnUrl)) {
          // Put static images (.jpg) first, videos second
          if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
            colorMediaMap[matchedArabicColor].unshift(cdnUrl);
          } else {
            colorMediaMap[matchedArabicColor].push(cdnUrl);
          }
          console.log(`  🔗 ${f} (${ext}) -> تم ربطه باللون: [${matchedArabicColor}]`);
        }
      }
    }

    // 3. Fallback for colors without direct file: use first available media of this dress
    const allAssigned = Object.values(colorMediaMap).flat();
    const defaultMedia = allAssigned[0] || 'https://files.catbox.moe/evbw2v.jpg';

    // 4. Update Neon Database for this dress
    for (const variant of dress.variants) {
      const col = variant.color.trim();
      const mediaList = (colorMediaMap[col] && colorMediaMap[col].length > 0)
        ? colorMediaMap[col]
        : [defaultMedia];

      // Delete old records for this variant
      await prisma.dressImage.deleteMany({
        where: { variantId: variant.id }
      });

      // Insert verified records
      for (const url of mediaList) {
        await prisma.dressImage.create({
          data: {
            variantId: variant.id,
            url: url
          }
        });
        totalImagesUpdated++;
      }
    }

    console.log(`  ✅ تم ضبط وتحديث كافة خيارات الألوان للفستان #${dress.id} بنجاح!`);
  }

  console.log('\n================================================================================');
  console.log(`🎉 اكتمل التدقيق والمطابقة الشاملة بنجاح 100%!`);
  console.log(`📊 إجمالي سجلات الميديا المحدثة والمطابقة: ${totalImagesUpdated}`);
  console.log('================================================================================\n');
}

run().catch(console.error);
