/**
 * generate-png-icons.cjs
 * Creates minimal valid PNG files for PWA manifest icons.
 * Uses raw PNG encoding without external dependencies.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ICONS_DIR = path.resolve(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(ICONS_DIR)) fs.mkdirSync(ICONS_DIR, { recursive: true });

/**
 * Creates a PNG buffer with a solid color and a centered leaf-like shape.
 */
function createPNG(size, maskable) {
  // Build raw RGBA pixel data
  const pixels = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const radius = maskable ? 0 : Math.round(size * 0.18);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      
      // Check if pixel is inside the icon shape
      let insideBackground = maskable;
      if (!maskable) {
        // Rounded rectangle
        insideBackground = isInsideRoundedRect(x, y, 0, 0, size, size, radius);
      } else {
        insideBackground = true;
      }

      if (!insideBackground) {
        // Transparent
        pixels[idx] = 0;
        pixels[idx + 1] = 0;
        pixels[idx + 2] = 0;
        pixels[idx + 3] = 0;
        continue;
      }

      // Check if pixel is part of the leaf icon
      const leafScale = size * 0.22;
      const dx = x - cx;
      const dy = y - cy;

      if (isInsideLeaf(dx, dy, leafScale)) {
        // White leaf
        pixels[idx] = 255;
        pixels[idx + 1] = 255;
        pixels[idx + 2] = 255;
        pixels[idx + 3] = 242; // slight transparency
      } else {
        // Green background: #059669 = rgb(5, 150, 105)
        pixels[idx] = 5;
        pixels[idx + 1] = 150;
        pixels[idx + 2] = 105;
        pixels[idx + 3] = 255;
      }
    }
  }

  return encodePNG(size, size, pixels);
}

function isInsideRoundedRect(x, y, rx, ry, w, h, r) {
  if (x < rx || x >= rx + w || y < ry || y >= ry + h) return false;
  // Check corners
  const corners = [
    [rx + r, ry + r],
    [rx + w - r, ry + r],
    [rx + r, ry + h - r],
    [rx + w - r, ry + h - r],
  ];
  for (const [ccx, ccy] of corners) {
    const inCornerRegion =
      (x < rx + r && y < ry + r) ||
      (x >= rx + w - r && y < ry + r) ||
      (x < rx + r && y >= ry + h - r) ||
      (x >= rx + w - r && y >= ry + h - r);
    if (inCornerRegion) {
      const distX = x - ccx;
      const distY = y - ccy;
      if (
        (x < rx + r && y < ry + r && distX * distX + distY * distY > r * r) ||
        (x >= rx + w - r && y < ry + r && (x - (rx + w - r)) ** 2 + (y - (ry + r)) ** 2 > r * r) ||
        (x < rx + r && y >= ry + h - r && (x - (rx + r)) ** 2 + (y - (ry + h - r)) ** 2 > r * r) ||
        (x >= rx + w - r && y >= ry + h - r && (x - (rx + w - r)) ** 2 + (y - (ry + h - r)) ** 2 > r * r)
      ) {
        return false;
      }
    }
  }
  return true;
}

function isInsideLeaf(dx, dy, scale) {
  // Simplified elliptical leaf shape
  const nx = dx / scale;
  const ny = dy / scale;
  // Leaf is an ellipse rotated and tapered
  const r = Math.sqrt(nx * nx + ny * ny);
  if (r > 1.1) return false;
  // Egg/leaf shape: wider at top, tapered at bottom
  const angle = Math.atan2(ny, nx);
  const leafRadius = 0.85 + 0.15 * Math.cos(angle * 2);
  return r < leafRadius;
}

/**
 * Encodes raw RGBA pixel data into a valid PNG file buffer.
 */
function encodePNG(width, height, pixels) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  // IDAT chunk — filter each row with filter type 0 (None)
  const rowSize = width * 4 + 1; // +1 for filter byte
  const rawData = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    rawData[y * rowSize] = 0; // filter type: None
    pixels.copy(rawData, y * rowSize + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressed = zlib.deflateSync(rawData, { level: 6 });
  const idat = makeChunk('IDAT', compressed);

  // IEND chunk
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function makeChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput) >>> 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

// CRC32 lookup table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc ^ 0xffffffff;
}

// Generate icons
const configs = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-maskable.png', size: 512, maskable: true },
];

for (const cfg of configs) {
  const png = createPNG(cfg.size, cfg.maskable);
  const filePath = path.join(ICONS_DIR, cfg.name);
  fs.writeFileSync(filePath, png);
  console.log(`✓ Created ${cfg.name} (${cfg.size}x${cfg.size}, ${png.length} bytes)`);
}

console.log('\nAll PNG icons generated in:', ICONS_DIR);
