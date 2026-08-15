import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import fs from 'fs';
import path from 'path';

const apiId = 34081063;
const apiHash = '018dc673429227e26a1b8d9d65eb76ca';
const phoneNumber = '+962770239570';
const phoneCode = '68275';

const SESSION_FILE = path.join(process.cwd(), 'prisma', 'telegram_user.session');

async function main() {
  const client = new TelegramClient(new StringSession(''), apiId, apiHash, {
    connectionRetries: 5,
  });

  console.log('📱 Connecting to Telegram using continuous session...');

  await client.start({
    phoneNumber: async () => phoneNumber,
    password: async () => '',
    phoneCode: async () => phoneCode,
    onError: (err) => console.log('Auth error:', err),
  });

  console.log('✅ LOGIN_SUCCESS!');
  const sessionString = client.session.save() as unknown as string;
  fs.writeFileSync(SESSION_FILE, sessionString);
  console.log('Saved session to prisma/telegram_user.session');
}

main().catch(console.error);
