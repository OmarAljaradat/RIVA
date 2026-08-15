import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import prisma from '../src/lib/prisma.js';
import { parseDressWithAi } from '../src/lib/ai-parser.js';
import fs from 'fs';
import path from 'path';

const apiId = 34081063;
const apiHash = '018dc673429227e26a1b8d9d65eb76ca';
const SESSION_FILE = path.join(process.cwd(), 'prisma', 'telegram_user.session');

interface DiffItem {
  idNum: number;
  name: string;
  telegramVariantsStr: string;
  siteVariantsStr: string;
  diffDetails: string[];
}

async function detailedSizeDiff() {
  if (!fs.existsSync(SESSION_FILE)) {
    console.log('❌ ملف الجلسة غير موجود.');
    return;
  }

  const stringSession = fs.readFileSync(SESSION_FILE, 'utf8').trim();
  const client = new TelegramClient(new StringSession(stringSession), apiId, apiHash, {
    connectionRetries: 5,
  });

  console.log('📱 جاري الاتصال بالتيليجرام وعمل مقارنة تفصيلية للمقاسات بين القناة والموقع...');
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

  console.log(`🎯 القناة: "${targetChannel.title}"`);
  console.log('🔍 جاري قراءة ومقارنة مقاسات الـ 39 فستاناً...\n');

  const messages = await client.getMessages(targetChannel.entity, { limit: 500 });
  const dbDresses = await prisma.dress.findMany({
    include: { variants: true },
    orderBy: { id: 'asc' }
  });

  const diffItems: DiffItem[] = [];

  for (let idx = 0; idx < dbDresses.length; idx++) {
    const dbDress = dbDresses[idx];
    const dbCleanName = dbDress.name.toLowerCase().replace(/✨️|💫|🌷|🎗/g, '').trim();

    // Find corresponding message in Telegram channel
    let matchedMsg = null;
    let matchedAiParsed = null;

    for (const msg of messages) {
      const text = msg.message || '';
      if (!text || text.length < 10) continue;

      if (text.toLowerCase().includes(dbCleanName.slice(0, 15)) || dbCleanName.includes(text.toLowerCase().slice(0, 15))) {
        const parsed = await parseDressWithAi(text);
        if (parsed) {
          matchedMsg = msg;
          matchedAiParsed = parsed;
          break;
        }
      }
    }

    if (matchedAiParsed) {
      const tgVars = matchedAiParsed.variants.map(v => `${v.color}: ${v.size}`).sort();
      const siteVars = dbDress.variants.map(v => `${v.color}: ${v.size}`).sort();

      const tgStr = matchedAiParsed.variants.map(v => `${v.color} (${v.size})`).join(' ، ');
      const siteStr = dbDress.variants.map(v => `${v.color} (${v.size})`).join(' ، ');

      if (JSON.stringify(tgVars) !== JSON.stringify(siteVars)) {
        const diffDetails: string[] = [];

        // Check sold out in TG vs available on site
        matchedAiParsed.variants.forEach(v => {
          if (v.quantity === 0 || v.size.includes('خالص')) {
            const siteMatch = dbDress.variants.find(sv => sv.color === v.color && sv.quantity > 0);
            if (siteMatch) {
              diffDetails.push(`🔴 لون [${v.color}] أصبح خالص بالقناة لكنه متوفر بالموقع بمقاس (${siteMatch.size})`);
            }
          }
        });

        // Check available in TG vs sold out on site
        dbDress.variants.forEach(sv => {
          if (sv.quantity === 0 || sv.size.includes('خالص')) {
            const tgMatch = matchedAiParsed!.variants.find(v => v.color === sv.color && v.quantity > 0);
            if (tgMatch) {
              diffDetails.push(`🟢 لون [${sv.color}] متوفر بالقناة بمقاس (${tgMatch.size}) ولكنه خالص بالموقع`);
            }
          }
        });

        if (diffDetails.length === 0) {
          diffDetails.push(`⚠️ اختلافات في توزيع أرقام المقاسات بين منشور القناة وحقول الموقع`);
        }

        diffItems.push({
          idNum: idx + 1,
          name: dbDress.name,
          telegramVariantsStr: tgStr,
          siteVariantsStr: siteStr,
          diffDetails
        });
      }
    }
  }

  console.log('===========================================================');
  console.log(`📊 التقرير التفصيلي لاختلافات المقاسات (${diffItems.length} فستاناً بها تفاوت):`);
  console.log('===========================================================\n');

  diffItems.forEach(item => {
    console.log(`👗 فستان #${item.idNum}: "${item.name}"`);
    console.log(`   📱 بالقناة الآن : [ ${item.telegramVariantsStr} ]`);
    console.log(`   🌐 بالموقع حالياً : [ ${item.siteVariantsStr} ]`);
    item.diffDetails.forEach(d => console.log(`   👉 ${d}`));
    console.log('');
  });

  console.log('-----------------------------------------------------------');
  console.log(`💡 إجمالي الفساتين التي تملك اختلافات بالسايزات: ${diffItems.length} من أصل 39 فستاناً.`);
  console.log('🔒 ملاحظة: التقرير للعرض والقرار فقط، لم يتم تعديل أي شيء على الموقع.');

  await client.disconnect();
}

detailedSizeDiff().catch(console.error);
