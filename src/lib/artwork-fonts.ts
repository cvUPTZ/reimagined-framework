import regular from '@fontsource/space-grotesk/files/space-grotesk-latin-400-normal.woff2?url';
import medium from '@fontsource/space-grotesk/files/space-grotesk-latin-500-normal.woff2?url';
import semibold from '@fontsource/space-grotesk/files/space-grotesk-latin-600-normal.woff2?url';
import bold from '@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff2?url';
import arabic from '@fontsource/tajawal/files/tajawal-arabic-500-normal.woff2?url';
import arabicBold from '@fontsource/tajawal/files/tajawal-arabic-700-normal.woff2?url';

let embedded: Promise<string> | undefined;
export function embeddedArtworkFonts() {
  embedded ??= Promise.all([
    { url: regular, family: 'Space Grotesk', weight: 400 },
    { url: medium, family: 'Space Grotesk', weight: 500 },
    { url: semibold, family: 'Space Grotesk', weight: 600 },
    { url: bold, family: 'Space Grotesk', weight: 700 },
    { url: arabic, family: 'Tajawal', weight: 500 },
    { url: arabicBold, family: 'Tajawal', weight: 700 },
  ].map(async font => {
    const response = await fetch(font.url);
    if (!response.ok) throw new Error('Video fonts could not be loaded. Please try again.');
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return `@font-face{font-family:'${font.family}';font-weight:${font.weight};src:url(data:font/woff2;base64,${btoa(binary)}) format('woff2');}`;
  })).then(rules => rules.join('\n')).catch(error => { embedded = undefined; throw error; });
  return embedded;
}