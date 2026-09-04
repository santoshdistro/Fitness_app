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

const GROUND = '#0a0a0a';
const INK = '#ffffff';

/**
 * The mark, on a 100x100 grid: a V with flat mitred cuts — no rounding — sliced
 * by a shallow diagonal, the two halves sliding apart along it. The V is the
 * taper the programme is built around; the slice is what stops it being a font
 * glyph, and comes from the faceted-plane lettering the brief pointed at.
 *
 * CUT is where the slice crosses, GAP the clean space along it, DX/DY how far
 * the halves travel. Push DX/DY much past 3 and the two planes stop reading as
 * one letter; drop GAP to 0 and the break closes up into a seam.
 */
const MARK = 'M 16 20 L 50 80 L 84 20 L 66 20 L 50 52 L 34 20 Z';
const CUT = 48;
const GAP = 3;
const DX = 3;
const DY = 2.5;

/**
 * White mark on black. Not the brand accent: the lime is reserved for "press
 * this" inside the app, and a black tile sits on any home-screen wallpaper
 * without competing with it.
 * `scale` shrinks the mark for maskable icons, whose safe zone is the middle 80%.
 * `radius` rounds the tile itself; iOS and Android mask their own, so PNGs ship square.
 */
function tile({ scale = 1, radius = 0 } = {}) {
  const shift = (100 - 100 * scale) / 2;
  // The clip paths live inside the scaled group, so they scale with the mark.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <clipPath id="cut-top"><polygon points="0,0 100,0 100,${CUT - 8} 0,${CUT + 8}"/></clipPath>
    <clipPath id="cut-bot"><polygon points="0,${CUT + 8 + GAP} 100,${CUT - 8 + GAP} 100,100 0,100"/></clipPath>
  </defs>
  <rect width="100" height="100" rx="${radius}" fill="${GROUND}"/>
  <g transform="translate(${shift} ${shift}) scale(${scale})" fill="${INK}">
    <g clip-path="url(#cut-top)"><path d="${MARK}" transform="translate(${-DX} ${-DY})"/></g>
    <g clip-path="url(#cut-bot)"><path d="${MARK}" transform="translate(${DX} ${DY})"/></g>
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
