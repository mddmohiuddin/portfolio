/**
 * sync-gallery.mjs — reads the shared Google Photos album and writes gallery.json.
 *
 * Run automatically by the GitHub Action (.github/workflows/sync-gallery.yml),
 * or manually with:  node scripts/sync-gallery.mjs
 *
 * The website's Photo Gallery loads gallery.json, so photos added to (or removed
 * from) the album show up on the site after the next sync — no HTML edits ever.
 *
 * Environment variables (all optional):
 *   PHOTOS_ALBUM_URL — override the album to read (defaults to the one below)
 *   GALLERY_DEBUG=1  — print how many candidate URLs were found while parsing
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_ALBUM_URL = 'https://photos.app.goo.gl/yH8CZFdgC3h5Sxw69';

// Size suffix for display in the marquee (Google's image server honors it).
const DISPLAY_SIZE = '=w800';

// Album order newest-first: the shared album page lists photos oldest -> newest,
// so the list is reversed before it is written. This only changes the order of
// gallery.json (and therefore the order the marquee starts from) — nothing else.
// Set to false to go back to the album's own order.
const NEWEST_FIRST = true;

// How many times to retry a flaky fetch before giving up.
const ATTEMPTS = 3;

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outFile = path.join(repoRoot, 'gallery.json');
const debug = process.env.GALLERY_DEBUG === '1';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function extractPhotos(html) {
  // The page stores data in JS strings where "=" and "&" may be JS-escaped.
  const unescaped = html
    .replace(/\\u003d/g, '=')
    .replace(/\\u0026/g, '&')
    .replace(/\\\//g, '/');

  // Album photos live under /pw/ (avatars etc. use /a/ or /ogw/ and are ignored).
  const re =
    /https:\/\/lh[0-9]\.googleusercontent\.com\/pw\/[A-Za-z0-9_\-]+(?:=[A-Za-z0-9_\-\.]+)?/g;
  const matches = unescaped.match(re) || [];
  if (debug) console.log(`raw candidate URLs: ${matches.length}`);

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

/**
 * Puts the newest photo first. Google's album page hands the photos back in
 * chronological order, so reversing gives "most recent first" without needing
 * timestamps (the /pw/ URLs carry no date).
 */
export function orderPhotos(images, newestFirst = NEWEST_FIRST) {
  return newestFirst ? images.slice().reverse() : images.slice();
}

async function fetchAlbum(albumUrl) {
  let lastError = null;

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const res = await fetch(albumUrl, {
        redirect: 'follow',
        headers: {
          'User-Agent': UA,
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!res.ok) throw new Error(`album page responded with HTTP ${res.status}`);

      const type = res.headers.get('content-type') || '';
      if (!type.includes('html')) throw new Error(`unexpected content-type: ${type}`);

      const html = await res.text();
      if (debug) console.log(`fetched ${html.length} bytes from ${res.url}`);

      // A sign-in / consent wall means link sharing was turned off.
      if (/accounts\.google\.com|ServiceLogin/i.test(res.url) || /Sign in/i.test(html.slice(0, 4000))) {
        throw new Error(
          'the album is not publicly shared any more — turn link sharing back on ' +
            '(Google Photos -> Album -> Share -> Create link)'
        );
      }

      return html;
    } catch (err) {
      lastError = err;
      const message = String((err && err.message) || err);
      if (attempt < ATTEMPTS) {
        const wait = attempt * 4000;
        console.warn(`attempt ${attempt}/${ATTEMPTS} failed (${message}) — retrying in ${wait / 1000}s`);
        await sleep(wait);
      }
    }
  }

  throw new Error(`${String((lastError && lastError.message) || lastError)} after ${ATTEMPTS} attempts`);
}

async function main() {
  const albumUrl = process.env.PHOTOS_ALBUM_URL || DEFAULT_ALBUM_URL;

  const html = await fetchAlbum(albumUrl);

  const images = orderPhotos(extractPhotos(html));
  if (!images.length) {
    // Never overwrite a good gallery.json with an empty one.
    throw new Error(
      'no photos found — album empty, link sharing off, or the page layout changed'
    );
  }

  // Skip the write (and therefore the commit) when nothing actually changed.
  let previous = null;
  try {
    previous = JSON.parse(await readFile(outFile, 'utf8'));
  } catch {
    /* first run, or a corrupt file we are about to replace anyway */
  }
  const samePhotos =
    previous &&
    Array.isArray(previous.images) &&
    previous.images.length === images.length &&
    previous.images.every((src, i) => src === images[i]);

  if (samePhotos) {
    console.log(`no change: ${images.length} photos, gallery.json left untouched`);
    return;
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

// Only run when executed directly — importing the module (e.g. from a test)
// must not hit the network.
const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  main().catch((err) => {
    console.error('sync-gallery failed:', String((err && err.message) || err));
    process.exit(1);
  });
}
