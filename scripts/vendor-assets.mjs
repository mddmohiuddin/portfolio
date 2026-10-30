/**
 * Vendor step — runs after the Tailwind build.
 *
 * 1. Copies the self-hosted woff2 files we actually use into assets/fonts/
 *    (Google Fonts CDN costs an extra connection + DNS lookup before text paints).
 * 2. Injects the generated Lucide sprite into index.html / 404.html.
 *
 * Run: node scripts/vendor-assets.mjs   (or `npm run build`)
 */
import { copyFile, mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const FONTS = [
  ['@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-400-normal.woff2', 'plus-jakarta-400.woff2'],
  ['@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-500-normal.woff2', 'plus-jakarta-500.woff2'],
  ['@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-600-normal.woff2', 'plus-jakarta-600.woff2'],
  ['@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-700-normal.woff2', 'plus-jakarta-700.woff2'],
  ['@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-800-normal.woff2', 'plus-jakarta-800.woff2'],
  ['@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2', 'instrument-serif-400.woff2'],
  ['@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2', 'instrument-serif-400-italic.woff2'],
];

await mkdir('assets/fonts', { recursive: true });

let bytes = 0;
for (const [from, to] of FONTS) {
  if (!existsSync(`node_modules/${from}`)) {
    console.warn(`  ! missing font source: ${from}`);
    continue;
  }
  await copyFile(`node_modules/${from}`, `assets/fonts/${to}`);
  bytes += (await stat(`assets/fonts/${to}`)).size;
}
console.log(`fonts: ${FONTS.length} files, ${(bytes / 1024).toFixed(0)} KB total`);

// ---- copy the site JS (source lives in src/, output in assets/) --------
await copyFile('src/quick-actions.js', 'assets/site.js');
console.log(`js: assets/site.js ${((await stat('assets/site.js')).size / 1024).toFixed(1)} KB`);

// ---- inject the icon sprite -------------------------------------------
const sprite = await readFile('src/_sprite.html', 'utf8');
const START = '<!-- ICON-SPRITE:START -->';
const END = '<!-- ICON-SPRITE:END -->';

for (const file of ['index.html', '404.html']) {
  if (!existsSync(file)) continue;
  let html = await readFile(file, 'utf8');
  const block = `${START}\n${sprite.trim()}\n${END}`;
  if (html.includes(START)) {
    html = html.replace(new RegExp(`${START}[\\s\\S]*?${END}`), block);
  } else if (html.includes('<body')) {
    html = html.replace(/(<body[^>]*>)/, `$1\n\n  ${block}\n`);
  } else {
    continue;
  }
  await writeFile(file, html);
  console.log(`sprite injected into ${file}`);
}
