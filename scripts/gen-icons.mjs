// Generates public/icon-192.png and icon-512.png using only node built-ins.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

// Full-bleed pink background (safe for maskable), centered paint palette with four color dots.
function render(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const c = size / 2;
  const dots = [
    [-0.13, -0.1, [255, 89, 94]],
    [0.03, -0.17, [255, 202, 58]],
    [0.16, -0.06, [138, 201, 38]],
    [0.12, 0.11, [25, 130, 196]],
  ];
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const t = (x + y) / (2 * size);
      let rgb = [255, Math.round(200 + 30 * t), Math.round(221 + 20 * t)];
      const dx = x - c, dy = y - c;
      // 팔레트: 둥근 판 + 엄지 구멍
      const inPalette = Math.hypot(dx / 1.08, dy) < size * 0.33;
      const inHole = Math.hypot(dx + 0.13 * size, dy - 0.13 * size) < size * 0.065;
      if (inPalette && !inHole) {
        rgb = [255, 244, 222];
        for (const [ox, oy, col] of dots) {
          if (Math.hypot(dx - ox * size, dy - oy * size) < size * 0.065) rgb = col;
        }
      }
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = rgb[0]; raw[o + 1] = rgb[1]; raw[o + 2] = rgb[2]; raw[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync('public', { recursive: true });
for (const s of [192, 512]) writeFileSync(`public/icon-${s}.png`, render(s));
console.log('icons written');
