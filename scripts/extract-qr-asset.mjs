import fs from 'node:fs';
import path from 'node:path';

const legacyAssetsPath = 'E:/cenimatic/cinematic-math-builder/cinematic-math-builder-fullBV/cinematic-math-builder/js/00-assets.js';
if (fs.existsSync(legacyAssetsPath)) {
  const content = fs.readFileSync(legacyAssetsPath, 'utf8');
  const match = content.match(/const QR_SRC = "([^"]+)";/);
  if (match) {
    const outDir = path.resolve('src/assets');
    fs.mkdirSync(outDir, { recursive: true });
    const targetFile = path.join(outDir, 'telegram-qr.ts');
    const outCode = `// Telegram QR Code Asset from original Cinematic Math Builder\nexport const TELEGRAM_BOT_HANDLE = '@MathZyno_bot';\nexport const TELEGRAM_BOT_URL = 'https://t.me/MathZyno_bot';\nexport const TELEGRAM_QR_SRC = ${JSON.stringify(match[1])};\n`;
    fs.writeFileSync(targetFile, outCode, 'utf8');
    console.log('Successfully saved QR code asset to', targetFile);
  } else {
    console.error('Could not find QR_SRC in legacy asset file');
  }
} else {
  console.error('Legacy assets file not found at', legacyAssetsPath);
}
