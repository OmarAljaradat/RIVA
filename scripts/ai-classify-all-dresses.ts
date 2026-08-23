import 'dotenv/config';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../src/lib/prisma.js';
import fs from 'fs';

const apiId = 34081063;
const apiHash = '018dc673429227e26a1b8d9d65eb76ca';
const SESSION_FILE = 'prisma/telegram_user.session';

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

async function classifyAndSyncAllDresses() {
  console.log('💎 بدء المعالجة الذكية والتحليل البصري (AI Vision) لفصل وربط كل فيديو وصورة بلونها الحقيقي...\n');

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const models = ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];

  const session = fs.readFileSync(SESSION_FILE, 'utf8').trim();
  const client = new TelegramClient(new StringSession(session), apiId, apiHash, {
    connectionRetries: 3,
  });
  await client.connect();

  const dialogs = await client.getDialogs({});
  const targetChannel = dialogs.find(d =>
    d.title?.includes('جرد مندوبات') ||
    d.title?.includes('Corner') ||
    d.title?.includes('جرد')
  );

  if (!targetChannel) {
    console.log('Channel not found');
    await client.disconnect();
    return;
  }

  const messages = await client.getMessages(targetChannel.entity, { limit: 400 });

  // Get all dresses
  const dresses = await prisma.dress.findMany({
    include: { variants: { include: { images: true } } },
    orderBy: { telegramMsgId: 'desc' }
  });

  console.log(`Found ${dresses.length} dresses in DB to process.\n`);

  for (let dIdx = 0; dIdx < dresses.length; dIdx++) {
    const dress = dresses[dIdx];
    if (!dress.telegramMsgId) continue;
    const textMsg = messages.find(m => m.id === dress.telegramMsgId);
    if (!textMsg) continue;

    console.log(`\n================================================================`);
    console.log(`👗 [${dIdx + 1}/${dresses.length}] الفستان: "${dress.name}" (ID: ${dress.id}, Telegram Msg: #${dress.telegramMsgId})`);

    // Group variants by color
    const variantsByColor = new Map<string, any[]>();
    for (const v of dress.variants) {
      if (!variantsByColor.has(v.color)) {
        variantsByColor.set(v.color, []);
      }
      variantsByColor.get(v.color)!.push(v);
    }
    const candidateColors = Array.from(variantsByColor.keys());
    console.log(`   🎨 الألوان المتاحة لهذا الفستان فقط (${candidateColors.length}): [${candidateColors.join(', ')}]`);

    if (candidateColors.length === 0) continue;

    // Find media messages strictly belonging to this dress
    let relatedMedia: any[] = [];
    if (textMsg.groupedId) {
      relatedMedia = messages.filter(m => m.groupedId && m.groupedId.toString() === textMsg.groupedId?.toString() && m.media);
    } else {
      const prevDress = dresses.find(d => d.telegramMsgId && d.telegramMsgId < textMsg.id);
      const minMsgId = prevDress?.telegramMsgId ? prevDress.telegramMsgId : textMsg.id - 8;
      relatedMedia = messages.filter(m => m.id < textMsg.id && m.id > minMsgId && m.media);
    }
    relatedMedia.sort((a, b) => a.id - b.id);
    console.log(`   🎬 عدد الوسائط المرتبطة في المنشور: ${relatedMedia.length}`);

    // Clear old images for this dress variants to ensure 100% clean state
    const allVariantIds = dress.variants.map(v => v.id);
    await prisma.dressImage.deleteMany({
      where: { variantId: { in: allVariantIds } }
    });

    for (let mIdx = 0; mIdx < relatedMedia.length; mIdx++) {
      const rm = relatedMedia[mIdx];
      const isVideo = rm.media?.className === 'MessageMediaDocument' && rm.media?.document?.mimeType?.includes('video');
      const isPhoto = rm.media?.className === 'MessageMediaPhoto';
      if (!isVideo && !isPhoto) continue;

      console.log(`\n   🔍 تحليل الوسيط #${rm.id} (${isVideo ? 'فيديو' : 'صورة'})...`);

      // 1. Download buffer
      let buffer: Buffer | null = null;
      try {
        const thumbBuffer = await client.downloadMedia(rm.media, { thumb: 1 } as any);
        buffer = (thumbBuffer as Buffer) || (await client.downloadMedia(rm.media, {} as any) as Buffer);
      } catch (dlErr: any) {
        console.log('      ⚠️ فشل تحميل الصورة المصغرة، تحميل الملف الكامل...');
        try {
          buffer = (await client.downloadMedia(rm.media, {} as any)) as Buffer;
        } catch (e: any) {
          console.error('      ❌ تعذر التحميل:', e.message);
          continue;
        }
      }

      if (!buffer || buffer.length === 0) continue;

      // 2. Upload to CDN
      let cdnUrl = '';
      try {
        const ext = isVideo ? 'mp4' : 'jpg';
        const mime = isVideo ? 'video/mp4' : 'image/jpeg';
        const uint8 = new Uint8Array(buffer);
        const blob = new Blob([uint8], { type: mime });

        const uploadFormData = new FormData();
        uploadFormData.append('reqtype', 'fileupload');
        uploadFormData.append('fileToUpload', blob, `dress_${dress.id}_${rm.id}.${ext}`);

        const cdnRes = await fetch('https://catbox.moe/user/api.php', {
          method: 'POST',
          body: uploadFormData,
        });

        cdnUrl = (await cdnRes.text()).trim();
        if (!cdnUrl.startsWith('https://files.catbox.moe/')) {
          console.log('      ⚠️ فشل الرفع لـ Catbox');
          continue;
        }
        console.log(`      ☁️ تم الرفع للـ CDN: ${cdnUrl}`);
      } catch (upErr: any) {
        console.error('      ❌ خطأ في الرفع:', upErr.message);
        continue;
      }

      // 3. AI Vision Color Detection
      let detectedColor = '';
      if (candidateColors.length === 1) {
        detectedColor = candidateColors[0];
        console.log(`      🎯 لون وحيد للموديل: (${detectedColor})`);
      } else {
        const base64Image = buffer.toString('base64');
        const prompt = `
أنت خبير أزياء ومحلل ألوان متخصص.
انظر إلى صورة / إطار فيديو الفستان المرفق.
هذا الفستان ينتمي لموديل يحتوي حصرياً على الألوان التالية فقط:
${JSON.stringify(candidateColors)}

ما هو اللون المعروض في الصورة من هذه القائمة الحصرية فقط؟
أجب بصيغة JSON فقط:
{
  "color": "اسم اللون المختار من القائمة أعلاه بالحرف",
  "confidence": 0.95,
  "reason": "سبب بسيط"
}
`;

        for (const modelName of models) {
          try {
            const aiModel = genAI.getGenerativeModel({ model: modelName });
            const aiRes = await aiModel.generateContent([
              prompt,
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Image
                }
              }
            ]);

            const text = aiRes.response.text();
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed.color && candidateColors.includes(parsed.color)) {
                detectedColor = parsed.color;
                console.log(`      🧠 الذكاء الاصطناعي حلل اللون: (${detectedColor}) بنسبة ثقة ${parsed.confidence * 100}% [${parsed.reason}]`);
                break;
              }
            }
          } catch (aiErr: any) {
            console.log(`      ⏳ محاولة مع نموذج بديل بسبب: ${aiErr.message?.slice(0, 60)}...`);
            await sleep(2000);
          }
        }

        // Fallback if AI didn't match
        if (!detectedColor) {
          detectedColor = candidateColors[mIdx % candidateColors.length];
          console.log(`      ⚠️ تعذر التحليل بالذكاء الاصطناعي، استخدام اللون التسلسلي: (${detectedColor})`);
        }
      }

      // 4. Attach media to the database variant
      const matchingVariants = variantsByColor.get(detectedColor) || [];
      for (const mv of matchingVariants) {
        await prisma.dressImage.create({
          data: {
            variantId: mv.id,
            url: cdnUrl
          }
        });
      }
      console.log(`      ✅ تم ربط ${isVideo ? 'الفيديو' : 'الصورة'} بلون (${detectedColor}) بنجاح!`);

      // Gentle pause to respect rate limits and give the model full breathing room
      await sleep(3500);
    }
  }

  await client.disconnect();
  console.log('\n🎉 اكتملت المعالجة الشاملة والربط الدقيق لجميع الموديلات بنجاح تام!');
}

classifyAndSyncAllDresses().catch(console.error);
