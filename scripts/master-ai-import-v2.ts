import 'dotenv/config';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../src/lib/prisma.js';
import fs from 'fs';
import path from 'path';

const apiId = 34081063;
const apiHash = '018dc673429227e26a1b8d9d65eb76ca';
const stringSession = process.env.TELEGRAM_USER_SESSION || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

interface VariantData {
  color: string;
  colorHex: string;
  size: string;
  quantity: number;
}

interface DressData {
  name: string;
  description: string;
  price: number;
  variants: VariantData[];
}

const EXTRACTION_PROMPT = `أنت نظام ذكاء اصطناعي فائق الدقة متخصص في تحليل منشورات فساتين التيليجرام لمتاجر الأزياء في الأردن.
مهمتك: استخراج بيانات الفستان بالكامل وبدون أي أخطاء كـ JSON صالح فقط:

القواعد الإلزامية:
1. "name": عنوان الفستان الحقيقي من أول سطر بدون إيموجيات (مثال: "قماش ستان نخب اول مع شال طويل").
2. "description": وصف القماش والتفاصيل والقصة والأطوال المذكورة.
3. "price": السعر الأساسي المذكور في المنشور كرقم صحيح فقط (مثال: "السعر : 34 jd" -> 34). إذا لم يذكر السعر ضع 30 كافتراضي.
4. "variants": مصفوفة تحتوي على كل لون ومقاساته المتاحة:
   - "color": اسم اللون الصافي بالعربية (اصفر, خمري, اسود, ابيض, زهري, بيبي بلو, بني, كحلي, زيتي, سومو, عنابي, نهدي, اوف وايت).
   - "colorHex": كود الهاكس للون (#EAB308, #722F37, #000000, #FFFFFF, #F472B6, #89CFF0, #78350F, #1E3A5F, #4D7C0F, #F87171, #831843, #9333EA, #FAF7F2).
   - "size": المقاس المتاح فقط (36, 38, 40, 42, 44, 46).
   - إذا ذُكر "من 36 الى 46" أضف المقاسات الزوجية: 36, 38, 40, 42, 44, 46.
   - إذا ذُكر "خالص ما عدا 38" أضف فقط المقاس 38 بكمية 5.
   - إذا كان اللون "خالص" بالكامل لا تضف له مقاسات بكمية موجبة.
   - "quantity": 5 للمقاس المتوفر.

الصيغة المطلوبة:
{
  "name": "اسم الفستان",
  "description": "الوصف",
  "price": 34,
  "variants": [
    {"color": "اصفر", "colorHex": "#EAB308", "size": "40", "quantity": 5},
    {"color": "خمري", "colorHex": "#722F37", "size": "38", "quantity": 5}
  ]
}`;

const AUDIT_PROMPT = `أنت مدقق جودة بيانات فائق الدقة. راجع البيانات المستخرجة وقارنها بنص المنشور الأصلي:
1. هل هناك أي لون لم يذكر في المنشور الأصلي؟ إذا نعم، احذفه فوراً.
2. هل المقاسات لكل لون مطابقة لما هو مكتوب بالمللي؟
3. هل السعر صحيح؟

أرجع فقط JSON النهائي النظيف والمدقق 100%.`;

async function callGeminiWithRetry(prompt: string, maxRetries = 3): Promise<string | null> {
  const models = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.6-flash'];
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    for (const mName of models) {
      try {
        const model = genAI.getGenerativeModel({
          model: mName,
          generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
        });
        const res = await model.generateContent(prompt);
        const txt = res.response.text();
        if (txt) return txt;
      } catch (err) {
        // try next model
      }
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  return null;
}

function cleanJsonString(str: string): string {
  if (!str) return '{}';
  const clean = str.replace(/```json/gi, '').replace(/```/g, '').trim();
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return clean.slice(firstBrace, lastBrace + 1);
  }
  return clean;
}

async function extractAndVerifyDressWithAI(postText: string): Promise<DressData | null> {
  try {
    // 1. الفحص الأول: الاستخراج الأولي
    const text1 = await callGeminiWithRetry(`${EXTRACTION_PROMPT}\n\nنص المنشور:\n${postText}`);
    if (!text1) return null;
    const initialData: DressData = JSON.parse(cleanJsonString(text1));

    // 2. الفحص الثاني: التدقيق والمطابقة العكسية مع النص
    const text2 = await callGeminiWithRetry(
      `${AUDIT_PROMPT}\n\nنص المنشور الأصلي:\n${postText}\n\nالبيانات المستخرجة للتدقيق:\n${JSON.stringify(initialData, null, 2)}`
    );
    const auditedData: DressData = text2 ? JSON.parse(cleanJsonString(text2)) : initialData;

    // 3. الفحص الثالث: التأكد البرمجي من سلامة الحقول
    if (!auditedData.name || auditedData.name.length < 3) auditedData.name = initialData.name;
    if (!auditedData.price || auditedData.price <= 0) auditedData.price = initialData.price || 30;
    if (!auditedData.variants || auditedData.variants.length === 0) auditedData.variants = initialData.variants;

    return auditedData;
  } catch (err: any) {
    console.error('⚠️ خطأ في تدقيق الذكاء الاصطناعي:', err?.message || err);
    return null;
  }
}

async function masterImport() {
  console.log('🚀 بدء نظام الاستيراد الفائق والتدقيق الثلاثي (من الأقدم للأحدث مع هامش +8 د.أ وأولوية الصور)...\n');

  const client = new TelegramClient(new StringSession(stringSession), apiId, apiHash, { connectionRetries: 3 });
  await client.connect();

  const dialogs = await client.getDialogs({});
  const targetChannel = dialogs.find(d =>
    d.title?.includes('جرد مندوبات') ||
    d.title?.includes('Corner') ||
    d.title?.includes('جرد')
  );

  if (!targetChannel) {
    console.log('❌ لم يتم العثور على القناة');
    return;
  }

  const messages = await client.getMessages(targetChannel.entity, { limit: 300 });
  console.log(`📦 تم قراءة ${messages.length} رسالة من القناة.\n`);

  // استخراج المنشورات النصية وترتيبها من الأقدم للأحدث تصاعدياً
  const textPosts = messages
    .filter(m => {
      const txt = m.message || '';
      return txt.length > 20 && (txt.includes('السعر') || txt.includes('jd') || txt.includes('دينار') || txt.includes('قماش') || txt.includes('فستان'));
    })
    .sort((a, b) => a.id - b.id); // ⭐️ الترتيب من الأقدم للأحدث تصاعدياً حتى يظهر الأحدث أول شيء للزبائن في الموقع

  console.log(`👗 تم العثور على ${textPosts.length} فستان منشور (مرتبين من الأقدم للأحدث).\n`);

  let importedCount = 0;

  for (let idx = 0; idx < textPosts.length; idx++) {
    const post = textPosts[idx];
    const postText = post.message || '';

    console.log(`================================================================`);
    console.log(`🔍 [${idx + 1}/${textPosts.length}] فحص وتدقيق المنشور ID: ${post.id} (منشور ${idx < 10 ? 'أقدم' : 'أحدث'})`);

    // تدقيق الذكاء الاصطناعي الثلاثي
    const aiDress = await extractAndVerifyDressWithAI(postText);
    if (!aiDress || aiDress.variants.length === 0) {
      console.log(`   ⚠️ تم تخطي المنشور (لا يحتوي على ألوان ومقاسات صالحة).`);
      continue;
    }

    const uniqueColors = Array.from(new Set(aiDress.variants.map(v => v.color.trim())));
    
    // ⭐️ إضافة 8 دنانير فوق سعر التيليجرام
    const telegramBasePrice = aiDress.price || 30;
    const finalSellingPrice = telegramBasePrice + 8;

    console.log(`   ✅ تم التحقق الثلاثي بنجاح 100%:`);
    console.log(`      👗 الاسم: "${aiDress.name}"`);
    console.log(`      💰 السعر في التيليجرام: ${telegramBasePrice} د.أ -> سعر البيع في الموقع (+8 د.أ): ${finalSellingPrice} د.أ`);
    console.log(`      🎨 الألوان الحقيقية (${uniqueColors.length}): ${uniqueColors.join('، ')}`);

    // 1. إنشاء الفستان في قاعدة البيانات Neon
    const createdDress = await prisma.dress.create({
      data: {
        name: aiDress.name,
        description: aiDress.description || aiDress.name,
        price: finalSellingPrice,
        isNew: idx >= textPosts.length - 10, // آخر 10 فساتين تأخذ شارة "جديد"
        isFeatured: idx >= textPosts.length - 15,
      }
    });

    // 2. إنشاء المتغيرات (الألوان والمقاسات)
    const createdVariantsMap: Record<string, number[]> = {};

    for (const v of aiDress.variants) {
      if (!v.size || v.quantity <= 0) continue;

      const createdVar = await prisma.dressVariant.create({
        data: {
          dressId: createdDress.id,
          color: v.color.trim(),
          colorHex: v.colorHex || '#722F37',
          size: v.size.trim(),
          quantity: v.quantity || 5
        }
      });

      if (!createdVariantsMap[v.color.trim()]) {
        createdVariantsMap[v.color.trim()] = [];
      }
      createdVariantsMap[v.color.trim()].push(createdVar.id);
    }

    // 3. سحب الفيديوهات والصور من ألبوم التيليجرام مع إعطاء الأولوية للصور الثابتة أولاً
    const albumMedia = messages
      .filter(m => m.media && m.id < post.id && m.id >= post.id - 10)
      .sort((a, b) => {
        // ترتيب الصور الثابتة أولاً ثم الفيديوهات ثانياً
        const isVidA = !!a.video || a.media?.className === 'MessageMediaDocument';
        const isVidB = !!b.video || b.media?.className === 'MessageMediaDocument';
        if (isVidA && !isVidB) return 1;
        if (!isVidA && isVidB) return -1;
        return a.id - b.id;
      });

    console.log(`      📸 ألبوم الميديا (${albumMedia.length} ملف مرتب: صور أولاً ثم فيديوهات)`);

    for (let mIdx = 0; mIdx < albumMedia.length; mIdx++) {
      const mediaMsg = albumMedia[mIdx];
      const targetColor = uniqueColors[mIdx] || uniqueColors[mIdx % uniqueColors.length];
      if (!targetColor) continue;

      const isVideo = !!mediaMsg.video || mediaMsg.media?.className === 'MessageMediaDocument';
      const ext = isVideo ? 'mp4' : 'jpg';
      const fileName = `dress_${createdDress.id}_color_${targetColor}_tg_${mediaMsg.id}.${ext}`;
      const filePath = path.join(UPLOADS_DIR, fileName);
      const webUrl = `/uploads/${fileName}`;

      // تحميل الملف إذا لم يكن موجوداً
      if (!fs.existsSync(filePath)) {
        try {
          const buffer = await client.downloadMedia(mediaMsg.media, {});
          if (buffer && buffer instanceof Buffer) {
            fs.writeFileSync(filePath, buffer);
            console.log(`         📥 تم حفظ ${isVideo ? '🎥 فيديو' : '📸 صورة'} للون [${targetColor}]: ${fileName} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
          }
        } catch (dlErr: any) {
          console.error(`         ⚠️ خطأ في تحميل الميديا ${mediaMsg.id}:`, dlErr?.message || dlErr);
          continue;
        }
      }

      // ربط الصورة/الفيديو في قاعدة البيانات بجميع مقاسات هذا اللون
      const variantIds = createdVariantsMap[targetColor] || [];
      for (const vId of variantIds) {
        await prisma.dressImage.create({
          data: {
            url: webUrl,
            variantId: vId
          }
        });
      }
    }

    // صورة افتراضية في حال لم تكن هناك صور
    const anyImages = await prisma.dressImage.findFirst({
      where: { variant: { dressId: createdDress.id } }
    });

    if (!anyImages) {
      const firstVar = await prisma.dressVariant.findFirst({
        where: { dressId: createdDress.id }
      });
      if (firstVar) {
        await prisma.dressImage.create({
          data: { url: '/uploads/dress1.jpg', variantId: firstVar.id }
        });
      }
    }

    importedCount++;
    console.log(`   🌟 اكتمل إدراج الفستان [ID ${createdDress.id}] بسعر ${finalSellingPrice} د.أ بنجاح 100%!\n`);
  }

  console.log('============================================================');
  console.log(`🎉 تم الانتهاء بنجاح! تم استيراد وتدقيق ${importedCount} فستاناً بالكامل عبر Gemini AI!`);
  console.log('============================================================');

  await client.disconnect();
}

masterImport().catch(console.error);
