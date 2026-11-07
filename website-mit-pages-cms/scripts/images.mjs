// Makes every image in public/img ready for the page.
//
// The client uploads photos through Pages CMS (any size, JPG, PNG or WebP).
// The page always loads "<name>.webp" (max 2000 px wide) and "<name>-s.webp" (900 px).
// This script creates whichever of the two is missing. Existing files are never touched.
// Runs automatically before `npm run dev` and `npm run build`.

import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const dir = new URL('../public/img/', import.meta.url).pathname;
const IMAGE = /\.(webp|jpe?g|png|avif)$/i;

const files = (await readdir(dir)).filter((f) => IMAGE.test(f));
const have = new Set(files);
const bases = new Map(); // base name -> best source file

for (const f of files) {
  const base = f.replace(IMAGE, '');
  if (base.endsWith('-s')) continue;
  // Prefer the original upload (JPG/PNG) as the source, it has the most detail.
  const current = bases.get(base);
  if (!current || current.endsWith('.webp')) bases.set(base, f);
}

let made = 0;
for (const [base, source] of bases) {
  const input = join(dir, source);
  const jobs = [
    [`${base}.webp`, 2000, 80],
    [`${base}-s.webp`, 900, 78],
  ];
  for (const [out, width, quality] of jobs) {
    if (have.has(out)) continue;
    await sharp(input)
      .rotate() // respect the orientation a phone wrote into the photo
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toFile(join(dir, out));
    const kb = Math.round((await stat(join(dir, out))).size / 1024);
    console.log(`images: ${out} (${kb} KB) from ${source}`);
    made++;
  }
}

if (!made) console.log('images: all variants present');
