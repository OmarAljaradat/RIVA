import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import fs from 'fs';
import path from 'path';

const apiId = 34081063;
const apiHash = '018dc673429227e26a1b8d9d65eb76ca';
const phoneNumber = '+962770239570';

const SESSION_FILE = path.join(process.cwd(), 'prisma', 'telegram_user.session');

async function main() {
  const client = new TelegramClient(new StringSession(''), apiId, apiHash, {
    connectionRetries: 5,
  });

  const codeFile = path.join(process.cwd(), 'prisma', 'user_code.txt');
  const passFile = path.join(process.cwd(), 'prisma', 'user_password.txt');

  if (fs.existsSync(codeFile)) fs.unlinkSync(codeFile);

  console.log(`📱 Launching login session for ${phoneNumber}...`);

  await client.start({
    phoneNumber: async () => phoneNumber,
    password: async () => {
      if (fs.existsSync(passFile)) {
        return fs.readFileSync(passFile, 'utf8').trim();
      }
      return 'Omarjaradat1omar';
    },
    phoneCode: async () => {
      console.log('✅ CODE_SENT_WAITING_FOR_INPUT');
      while (!fs.existsSync(codeFile)) {
        await new Promise(r => setTimeout(r, 1000));
      }
      const code = fs.readFileSync(codeFile, 'utf8').trim();
      console.log(`🔑 Read code: ${code}`);
      return code;
    },
    onError: (err) => console.log('Auth error:', err),
  });

  console.log('🎉 LOGIN_SUCCESSFUL!');
  const sessionString = client.session.save() as unknown as string;
  fs.writeFileSync(SESSION_FILE, sessionString);
  console.log('Saved session string to prisma/telegram_user.session');
}

main().catch(err => {
  console.error('Login error:', err);
  process.exit(1);
});
