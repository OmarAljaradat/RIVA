import 'dotenv/config';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import prisma from '../src/lib/prisma.js';
import { parseDressWithAi } from '../src/lib/ai-parser.js';

const apiId = 34081063;
const apiHash = '018dc673429227e26a1b8d9d65eb76ca';
const stringSession = process.env.TELEGRAM_USER_SESSION || '';

async function findYellowDresses() {
  console.log('🔍 جاري البحث عن الفساتين التي تحتوي على اللون الأصفر في التيليجرام وقاعدة البيانات...\n');

  const client = new TelegramClient(new StringSession(stringSession), apiId, apiHash, { connectionRetries: 3 });
  await client.connect();

  const dialogs = await client.getDialogs({});
  const targetChannel = dialogs.find(d => d.title?.includes('جرد مندوبات') || d.title?.includes('Corner') || d.title?.includes('جرد'));
  if (!targetChannel) {
    console.log('❌ Channel not found');
    return;
  }

  const messages = await client.getMessages(targetChannel.entity, { limit: 300 });
  console.log(`📦 تم سحب ${messages.length} رسالة من القناة.\n`);

  const yellowPosts: any[] = [];

  for (const msg of messages) {
    const text = msg.message || '';
    if (!text) continue;

    if (
      text.includes('اصفر') || text.includes('أصفر') || 
      text.includes('خردلي') || text.includes('ليموني') || 
      text.includes('كموني') || text.includes('كركمي')
    ) {
      const parsed = await parseDressWithAi(text);
      yellowPosts.push({
        id: msg.id,
        text: text,
        parsed: parsed
      });
    }
  }

  console.log(`🎯 تم العثور على ${yellowPosts.length} منشور في القناة يذكر درجات اللون الأصفر:\n`);

  for (const yp of yellowPosts) {
    console.log('----------------------------------------------------');
    console.log(`📌 Post ID: ${yp.id}`);
    console.log(`📝 نص المنشور الأصلي:\n${yp.text}`);
    console.log(`\n🤖 نتيجة التحليل (Parsed Variants):`);
    if (yp.parsed) {
      console.log('اسم الفستان:', yp.parsed.name);
      console.log('الخيارات:', JSON.stringify(yp.parsed.variants, null, 2));
    } else {
      console.log('❌ فشل التحليل (null)');
    }
  }

  console.log('\n====================================================');
  console.log('👗 فحص الفساتين الموجودة في قاعدة البيانات لمعرفة المطابقة:');
  const dbDresses = await prisma.dress.findMany({
    include: { variants: true }
  });

  for (const d of dbDresses) {
    const hasYellowInDb = d.variants.some(v => 
      v.color.includes('اصفر') || v.color.includes('أصفر') || 
      v.color.includes('خردلي') || v.color.includes('ليموني')
    );
    if (hasYellowInDb) {
      console.log(`✅ فستان في الداتا بيس فيه أصفر: ID ${d.id} - ${d.name}`);
      d.variants.filter(v => v.color.includes('اصفر') || v.color.includes('أصفر') || v.color.includes('خردلي')).forEach(v => {
        console.log(`   - اللون: ${v.color} | المقاس: ${v.size} | الكمية: ${v.quantity}`);
      });
    }
  }

  await client.disconnect();
}

findYellowDresses().catch(console.error);
