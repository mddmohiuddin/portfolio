/**
 * sync-gallery.mjs — reads the shared Google Photos album and writes gallery.json.
 *
 * Run automatically by the GitHub Action (.github/workflows/sync-gallery.yml),
 * or manually with:  node scripts/sync-gallery.mjs
 *
 * The website's Photo Gallery loads gallery.json, so photos added to (or removed
 * from) the album show up on the site after the next sync — no HTML edits ever.
 *
 * Optional env var:
 *   PHOTOS_ALBUM_URL — override the album to read (defaults to the one below).
 */

import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_ALBUM_URL = 'https://photos.app.goo.gl/yH8CZFdgC3h5Sxw69';

// Size suffix for display in the marquee (Google's image server honors it).
const DISPLAY_SIZE = '=w800';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outFile = path.join(repoRoot, 'gallery.json');

function extractPhotos(html) {
  // The page stores data in JS strings where "=" and "&" may be JS-escaped.
  const unescaped = html
    .replace(/\\u003d/g, '=')
    .replace(/\\u0026/g, '&')
    .replace(/\\\//g, '/');

  // Album photos live under /pw/ (avatars etc. use /a/ or /ogw/ and are ignored).
  const re = /https:\/\/lh[0-9]\.googleusercontent\.com\/pw\/[A-Za-z0-9_\-]+(?:=[A-Za-z0-9_\-\.]+)?/g;
  const matches = unescaped.match(re) || [];

  const seen = new Set();
  const images = [];
  for (const m of matches) {
    const base = m.split('=')[0]; // strip size suffix -> unique photo key
    if (seen.has(base)) continue;
    seen.add(base);
    images.push(base + DISPLAY_SIZE);
  }
  return images;
}

async function main() {
  const albumUrl = process.env.PHOTOS_ALBUM_URL || DEFAULT_ALBUM_URL;

  const res = await fetch(albumUrl, {
    redirect: 'follow',
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`Album page responded with HTTP ${res.status}`);
  const html = await res.text();

  const images = extractPhotos(html);
  if (!images.length) {
    // Never overwrite a good gallery.json with an empty one.
    throw new Error('No photos found — album empty, link sharing off, or page layout changed');
  }

  const data = {
    ok: true,
    count: images.length,
    images,
    source: albumUrl,
    updatedAt: new Date().toISOString(),
  };
  await writeFile(outFile, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`gallery.json updated: ${images.length} photos from ${albumUrl}`);
}

main().catch((err) => {
  console.error('sync-gallery failed:', String((err && err.message) || err));
  process.exit(1);
});
