import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import prisma from '../src/lib/prisma.js';
import { parseDressWithAi } from '../src/lib/ai-parser.js';
import fs from 'fs';
import path from 'path';

const apiId = 34081063;
const apiHash = '018dc673429227e26a1b8d9d65eb76ca';
const SESSION_FILE = path.join(process.cwd(), 'prisma', 'telegram_user.session');

async function syncTelegramSizesToDb() {
  if (!fs.existsSync(SESSION_FILE)) {
    console.log('❌ ملف الجلسة غير موجود.');
    return;
  }

  const stringSession = fs.readFileSync(SESSION_FILE, 'utf8').trim();
  const client = new TelegramClient(new StringSession(stringSession), apiId, apiHash, {
    connectionRetries: 5,
  });

  console.log('⚡ جاري الاتصال بالتيليجرام وتطبيق السايزات والألوان الحية من القناة إلى قاعدة بيانات الموقع...');
  await client.connect();

  const dialogs = await client.getDialogs({});
  const targetChannel = dialogs.find(d => 
    d.title?.includes('جرد مندوبات') || 
    d.title?.includes('Corner') || 
    d.title?.includes('جرد')
  );

  if (!targetChannel) {
    console.log('❌ لم يتم العثور على القناة.');
    await client.disconnect();
    return;
  }

  console.log(`🎯 القناة المستهدفة: "${targetChannel.title}"`);
  console.log('🔄 جاري تحديث المقاسات والألوان بالموقع لتطابق القناة 100%...\n');

  const messages = await client.getMessages(targetChannel.entity, { limit: 500 });
  const dbDresses = await prisma.dress.findMany({
    include: { variants: true },
    orderBy: { id: 'asc' }
  });

  let updatedCount = 0;

  for (let idx = 0; idx < dbDresses.length; idx++) {
    const dbDress = dbDresses[idx];
    const dbCleanName = dbDress.name.toLowerCase().replace(/✨️|💫|🌷|🎗/g, '').trim();

    // Find matching Telegram message
    let matchedAiParsed = null;

    for (const msg of messages) {
      const text = msg.message || '';
      if (!text || text.length < 10) continue;

      if (text.toLowerCase().includes(dbCleanName.slice(0, 15)) || dbCleanName.includes(text.toLowerCase().slice(0, 15))) {
        const parsed = await parseDressWithAi(text);
        if (parsed && parsed.variants.length > 0) {
          matchedAiParsed = parsed;
          break;
        }
      }
    }

    if (matchedAiParsed) {
      // Clear existing variants for this dress
      await prisma.dressImage.deleteMany({
        where: { variant: { dressId: dbDress.id } }
      });
      await prisma.dressVariant.deleteMany({
        where: { dressId: dbDress.id }
      });

      // Create new variants matching exact Telegram live scan
      for (const v of matchedAiParsed.variants) {
        const createdVariant = await prisma.dressVariant.create({
          data: {
            dressId: dbDress.id,
            color: v.color,
            colorHex: v.colorHex,
            size: v.size,
            quantity: v.quantity,
          }
        });

        // Add placeholder image
        await prisma.dressImage.create({
          data: {
            url: '/uploads/dress1.jpg',
            variantId: createdVariant.id,
          }
        });
      }

      updatedCount++;
      console.log(`✅ [${updatedCount}] تم تحديث سايزات وألوان "${dbDress.name}" بنجاح ليطابق القناة 100%.`);
    }
  }

  console.log('\n===========================================================');
  console.log(`🎉 تم تحديث ومطابقة مقاسات وألوان ${updatedCount} فستاناً على الموقع مع قناة التيليجرام الحية!`);
  console.log('===========================================================');

  await client.disconnect();
}

syncTelegramSizesToDb().catch(console.error);
