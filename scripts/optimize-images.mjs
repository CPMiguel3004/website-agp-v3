/**
 * Converts photos in public/fotos to web-sized WebP.
 *
 * Source photos are straight from the camera (4000x6000, 24MP), which made the
 * homepage ship ~71 MB of images. Web pages never need more than ~1920px on the
 * long edge for a full-bleed background.
 *
 * Run with: npm run optimize:images
 *
 * og-default.jpg is deliberately left as JPEG — several social crawlers still
 * fail to render WebP link previews.
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'public/fotos';
const MAX_EDGE = 1920;
const QUALITY = 82;
const OG_IMAGE = 'og-default.jpg';

const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (/\.(png|jpe?g)$/i.test(entry.name)) files.push(p);
  }
}
walk(ROOT);

let before = 0;
let after = 0;
const converted = [];

for (const file of files) {
  const name = path.basename(file);
  const sizeBefore = fs.statSync(file).size;
  before += sizeBefore;

  // The Open Graph image stays a JPEG, just resized to the 1200x630 social ratio.
  if (name === OG_IMAGE) {
    const tmp = file + '.tmp';
    await sharp(file)
      .resize(1200, 630, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: 85, mozjpeg: true })
      .toFile(tmp);
    fs.renameSync(tmp, file);
    const sizeAfter = fs.statSync(file).size;
    after += sizeAfter;
    converted.push({ from: file, to: file, sizeBefore, sizeAfter });
    continue;
  }

  const target = file.replace(/\.(png|jpe?g)$/i, '.webp');
  await sharp(file)
    .rotate() // honour EXIF orientation before stripping metadata
    .resize(MAX_EDGE, MAX_EDGE, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(target);

  const sizeAfter = fs.statSync(target).size;
  after += sizeAfter;
  converted.push({ from: file, to: target, sizeBefore, sizeAfter });
}

converted.sort((a, b) => b.sizeBefore - a.sizeBefore);

console.log('Maiores reduções:\n');
for (const c of converted.slice(0, 12)) {
  const mbB = (c.sizeBefore / 1048576).toFixed(2);
  const kbA = (c.sizeAfter / 1024).toFixed(0);
  const pct = (100 - (c.sizeAfter / c.sizeBefore) * 100).toFixed(1);
  console.log(
    `${mbB.padStart(7)} MB  ->  ${kbA.padStart(6)} KB  (-${pct}%)  ${path.basename(c.to)}`
  );
}

console.log(
  `\nTOTAL: ${(before / 1048576).toFixed(1)} MB -> ${(after / 1048576).toFixed(1)} MB ` +
    `(-${(100 - (after / before) * 100).toFixed(1)}%)`
);
console.log(`${converted.length} ficheiros processados.`);
