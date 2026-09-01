/**
 * Regenerates the PNG app icons from the one mark defined below.
 *
 *   npm i -D sharp && node scripts/build-icons.mjs
 *
 * sharp is deliberately NOT a dependency — icons change once a rebrand, so a
 * 30MB image toolchain shouldn't sit in every install. Install it, run this,
 * drop it again.
 *
 * The mark is a tapered V: wide at the shoulders, converging at the waist. It
 * is the V-taper the training programme is built around, and it reads at 16px
 * because it is one idea. Keep `MARK` as the single source of truth — the
 * favicon in public/favicon.svg draws the same path.
 */
import { writeFileSync } from 'node:fs';
import sharp from 'sharp';

const ACCENT = '#6c63ff';
const ACCENT_DEEP = '#4b3fe0';

/**
 * The mark, on a 100x100 grid. Round joins come from stroking it with its own
 * paint. The inner vertex sits well below the midpoint so the arms visibly thin
 * on the way down — roughly 2.3:1 top to bottom. Raise it and the taper washes
 * out into a plain letter V, which is the whole difference between this mark and
 * a font glyph.
 */
const MARK = 'M 24 29 L 50 71 L 76 29 L 60 29 L 50 60 L 40 29 Z';

/**
 * A gradient tile with the mark knocked out in white — the same pairing the
 * app's primary buttons use, so the icon and the thing it opens agree.
 * `scale` shrinks the mark for maskable icons, whose safe zone is the middle 80%.
 * `radius` rounds the tile itself; iOS and Android mask their own, so PNGs ship square.
 */
function tile({ scale = 1, radius = 0 } = {}) {
  const shift = (100 - 100 * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${ACCENT}"/>
      <stop offset="1" stop-color="${ACCENT_DEEP}"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="${radius}" fill="url(#g)"/>
  <g transform="translate(${shift} ${shift}) scale(${scale})">
    <path d="${MARK}" fill="#fff" stroke="#fff" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>
  </g>
</svg>`;
}

const OUTPUTS = [
  { file: 'public/app-icon-180.png', size: 180, svg: tile() },
  { file: 'public/app-icon-192.png', size: 192, svg: tile() },
  { file: 'public/app-icon-512.png', size: 512, svg: tile() },
  // Maskable: Android crops to a circle inscribed in the middle 80%.
  { file: 'public/app-icon-maskable-512.png', size: 512, svg: tile({ scale: 0.78 }) },
];

for (const { file, size, svg } of OUTPUTS) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(file);
  console.log(`wrote ${file} (${size}x${size})`);
}

// The favicon keeps its own rounded corners — a browser tab does no masking.
writeFileSync('public/favicon.svg', `${tile({ radius: 22 })}\n`);
console.log('wrote public/favicon.svg');
