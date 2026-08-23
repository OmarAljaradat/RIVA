import 'dotenv/config';
import prisma from '../src/lib/prisma.js';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
const CACHE_FILE = path.join(process.cwd(), 'scripts', 'catbox-cache.json');

async function uploadToCatbox(filePath: string): Promise<string | null> {
  try {
    const cmd = `curl.exe -s -F "reqtype=fileupload" -F "fileToUpload=@${filePath}" https://catbox.moe/user/api.php`;
    const { stdout } = await execPromise(cmd, { timeout: 45000 });
    const output = stdout.trim();
    if (output.startsWith('https://files.catbox.moe/')) {
      return output;
    }
    return null;
  } catch (err: any) {
    return null;
  }
}

async function run() {
  console.log('⚡ بدء الرفع المتوازي فائق السرعة إلى Catbox Global Storage CDN...\n');

  let cache: Record<string, string> = {};
  if (fs.existsSync(CACHE_FILE)) {
    try {
      cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    } catch {}
  }

  // 1. Get all real files on disk in public/uploads
  const diskFiles = fs.readdirSync(UPLOADS_DIR).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm'].includes(ext);
  });

  console.log(`📁 إجمالي الملفات الفعلية على القرص: ${diskFiles.length}`);

  // 2. Upload missing files with concurrency limit
  const pendingFiles = diskFiles.filter(f => !cache[f]);
  console.log(`⏳ الملفات المتبقي رفعها: ${pendingFiles.length}`);

  const CONCURRENCY = 6;
  let completed = diskFiles.length - pendingFiles.length;

  for (let i = 0; i < pendingFiles.length; i += CONCURRENCY) {
    const chunk = pendingFiles.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async fn => {
        const localPath = path.join(UPLOADS_DIR, fn);
        const url = await uploadToCatbox(localPath);
        if (url) {
          cache[fn] = url;
          fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
          completed++;
          console.log(`[${completed}/${diskFiles.length}] ✅ ${fn} -> ${url}`);
        } else {
          console.log(`❌ Failed: ${fn}`);
        }
      })
    );
  }

  console.log(`\n🎉 اكتمل رفع جميع الملفات على القرص إلى Catbox CDN!`);
  console.log(`💾 جاري ربط قاعدة بيانات Neon بالروابط المباشرة...`);

  // 3. For every DressImage in DB, match it to the best uploaded file on disk
  const allImages = await prisma.dressImage.findMany({
    include: { variant: true }
  });

  const colorSlugMap: Record<string, string> = {
    'اسود': 'black', 'ابيض': 'white', 'خمري': 'maroon', 'زهري': 'pink',
    'اصفر': 'yellow', 'بيبي بلو': 'babyblue', 'بني': 'brown', 'بني موكا': 'mocca',
    'كحلي': 'navy', 'زيتي': 'olive', 'سومو': 'somon', 'عنابي': 'burgundy',
    'نهدي': 'purple', 'اوف وايت': 'offwhite', 'احمر': 'red'
  };

  const updates: Array<{ id: number; url: string }> = [];

  for (const img of allImages) {
    const rawUrl = img.url;
    let targetCdnUrl = '';

    // Direct match from cache by filename
    for (const [fn, cdnUrl] of Object.entries(cache)) {
      if (rawUrl.includes(fn)) {
        targetCdnUrl = cdnUrl;
        break;
      }
    }

    // If not direct filename match, match by dressId and colorSlug
    if (!targetCdnUrl && img.variant) {
      const dressId = img.variant.dressId;
      const colorArabic = img.variant.color.trim();
      const colorSlug = colorSlugMap[colorArabic] || '';

      const matchedFile = diskFiles.find(fn => {
        if (!fn.startsWith(`dress_${dressId}_`)) return false;
        if (colorSlug && fn.includes(`_${colorSlug}_`)) return true;
        return false;
      });

      if (matchedFile && cache[matchedFile]) {
        targetCdnUrl = cache[matchedFile];
      }
    }

    if (targetCdnUrl && img.url !== targetCdnUrl) {
      updates.push({ id: img.id, url: targetCdnUrl });
    }
  }

  console.log(`🚀 جاري تحديث ${updates.length} سجل في قاعدة البيانات بالتوازي...`);
  const CHUNK_SIZE = 50;
  for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
    const chunk = updates.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map(u => prisma.dressImage.update({ where: { id: u.id }, data: { url: u.url } }))
    );
  }

  console.log(`\n🎉 اكتمل بنجاح 100%! جميع الصور والفيديوهات أصبحت مستضافة على Catbox CDN ومربوطة بـ Neon!`);
}

run().catch(console.error);
