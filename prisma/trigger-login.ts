import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import fs from 'fs';
import path from 'path';

const apiId = 34081063;
const apiHash = '018dc673429227e26a1b8d9d65eb76ca';
const phoneNumber = '+962770239570';

const SESSION_FILE = path.join(process.cwd(), 'prisma', 'telegram_user.session');

async function sendCode() {
  const client = new TelegramClient(new StringSession(''), apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.connect();
  console.log(`📱 Requesting code for ${phoneNumber}...`);
  
  const sendCodeResult = await client.sendCode(
    { apiId, apiHash },
    phoneNumber
  );

  console.log('✅ CODE_SENT_SUCCESSFULLY!');
  fs.writeFileSync(path.join(process.cwd(), 'prisma', 'phone_code_hash.txt'), sendCodeResult.phoneCodeHash);
}

sendCode().catch(err => {
  console.error('SendCode Error:', err);
  process.exit(1);
});
