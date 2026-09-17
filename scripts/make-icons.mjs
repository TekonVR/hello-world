/**
 * Generates the PNG app icons from the same shapes as public/icon.svg.
 *
 * Hand-rolled rather than pulled from a rasteriser: the icons are two flat
 * colours and a rounded rectangle, and a placeholder icon is not worth a
 * dependency. Replace both files when the real brand mark exists.
 *
 * Run with: node scripts/make-icons.mjs
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const BG = [0x0c, 0x0f, 0x14];
const ACCENT = [0x6e, 0xe7, 0xa8];
const INK = [0x06, 0x28, 0x1a];

/** Signed distance to a rounded rectangle, used to antialias the edges. */
function roundedRectDistance(x, y, cx, cy, halfWidth, halfHeight, radius) {
  const dx = Math.abs(x - cx) - (halfWidth - radius);
  const dy = Math.abs(y - cy) - (halfHeight - radius);
  const outside = Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
  return outside + Math.min(Math.max(dx, dy), 0) - radius;
}

function mix(base, over, alpha) {
  return base.map((channel, i) => Math.round(channel * (1 - alpha) + over[i] * alpha));
}

/** Coverage from a signed distance: 1 inside, 0 outside, soft over one pixel. */
function coverage(distance) {
  return Math.min(1, Math.max(0, 0.5 - distance));
}

function render(size) {
  const s = size / 512;
  const pixels = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const px = x + 0.5;
      const py = y + 0.5;
      let colour = BG;

      // The app icon's outer rounded square.
      const outer = roundedRectDistance(px, py, size / 2, size / 2, size / 2, size / 2, 112 * s);
      const outerAlpha = coverage(outer);

      // Shackle: a ring above the body, drawn as an annulus clipped to the top.
      const ringRadius = 68 * s;
      const ringWidth = 17 * s;
      const ringCx = 256 * s;
      const ringCy = 232 * s;
      const ringDistance = Math.abs(Math.hypot(px - ringCx, py - ringCy) - ringRadius) - ringWidth;
      if (py < ringCy) colour = mix(colour, ACCENT, coverage(ringDistance));

      // Body.
      const body = roundedRectDistance(px, py, 256 * s, 320 * s, 120 * s, 88 * s, 32 * s);
      colour = mix(colour, ACCENT, coverage(body));

      // Keyhole.
      const hole = roundedRectDistance(px, py, 256 * s, 320 * s, 16 * s, 28 * s, 16 * s);
      colour = mix(colour, INK, coverage(hole));

      const offset = (y * size + x) * 4;
      pixels[offset] = colour[0];
      pixels[offset + 1] = colour[1];
      pixels[offset + 2] = colour[2];
      pixels[offset + 3] = Math.round(255 * outerAlpha);
    }
  }
  return pixels;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function toPng(pixels, size) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  // Each scanline is prefixed with its filter type, which is 0 for none.
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (size * 4 + 1)] = 0;
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of [192, 512]) {
  const file = new URL(`../public/icon-${size}.png`, import.meta.url);
  writeFileSync(file, toPng(render(size), size));
  console.log(`wrote public/icon-${size}.png`);
}
