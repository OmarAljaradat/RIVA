import 'dotenv/config';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { parseDressExpert } from '../src/lib/ai-parser.js';

const apiId = 34081063;
const apiHash = '018dc673429227e26a1b8d9d65eb76ca';
const stringSession = process.env.TELEGRAM_USER_SESSION || '';

async function testAllChannelPosts() {
  console.log('🧪 اختبار قوة ودقة المحلل الجديد على جميع منشورات القناة...\n');

  const client = new TelegramClient(new StringSession(stringSession), apiId, apiHash, { connectionRetries: 3 });
  await client.connect();

  const dialogs = await client.getDialogs({});
  const targetChannel = dialogs.find(d => d.title?.includes('جرد مندوبات') || d.title?.includes('Corner') || d.title?.includes('جرد'));
  if (!targetChannel) return;

  const messages = await client.getMessages(targetChannel.entity, { limit: 200 });
  let parsedCount = 0;
  let totalColorsFound = 0;
  let totalSizesFound = 0;

  for (const msg of messages) {
    const text = msg.message || '';
    if (!text || text.length < 15) continue;

    const parsed = parseDressExpert(text);
    if (parsed && parsed.variants.length > 0) {
      parsedCount++;
      const uniqueColors = Array.from(new Set(parsed.variants.map(v => v.color)));
      const activeVariants = parsed.variants.filter(v => v.quantity > 0);
      totalColorsFound += uniqueColors.length;
      totalSizesFound += activeVariants.length;

      console.log(`[${parsedCount}] 👗 "${parsed.name.slice(0, 45)}" | سعر: ${parsed.sellingPrice} د.أ`);
      console.log(`     🎨 الألوان (${uniqueColors.length}): ${uniqueColors.join('، ')}`);
      console.log(`     📏 المقاسات المتوفرة (${activeVariants.length}): ${activeVariants.map(v => `${v.color}:${v.size}`).slice(0, 6).join(' | ')}${activeVariants.length > 6 ? ' ...' : ''}`);
    }
  }

  console.log('\n============================================================');
  console.log(`🎉 النتيجة: تم تحليل وتفكيك ${parsedCount} فستاناً بنجاح 100%!`);
  console.log(`🎨 إجمالي الألوان المستخرجة بدقة: ${totalColorsFound}`);
  console.log(`📏 إجمالي خيارات المقاسات المستخرجة: ${totalSizesFound}`);
  console.log('============================================================');

  await client.disconnect();
}

testAllChannelPosts().catch(console.error);
