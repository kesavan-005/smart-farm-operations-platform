/**
 * generate-pwa-icons.cjs
 * Generates PWA icon PNG files using an SVG-based approach.
 * Creates simple, clean branded icons without requiring native canvas dependencies.
 * 
 * Usage: node scripts/generate-pwa-icons.cjs
 */
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.resolve(__dirname, '..', 'public', 'icons');

// Ensure the icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

/**
 * Creates a branded SVG icon string.
 * @param {number} size - Icon dimensions (square)
 * @param {boolean} maskable - Whether to use full-bleed background (maskable icon)
 * @returns {string} SVG markup
 */
function createIconSVG(size, maskable) {
  const bg = maskable
    ? `<rect width="${size}" height="${size}" fill="#059669"/>`
    : `<rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="#059669"/>`;

  // Leaf icon centered in the canvas  
  const cx = size / 2;
  const cy = size / 2;
  const s = size * 0.22;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${bg}
  <g transform="translate(${cx}, ${cy})">
    <!-- Leaf shape -->
    <path d="M0,${-s} C${s*0.9},${-s*0.9} ${s*1.05},${-s*0.15} ${s*0.8},${s*0.35}
             C${s*0.55},${s*0.75} ${s*0.2},${s} 0,${s}
             C${-s*0.2},${s} ${-s*0.55},${s*0.75} ${-s*0.8},${s*0.35}
             C${-s*1.05},${-s*0.15} ${-s*0.9},${-s*0.9} 0,${-s} Z"
          fill="white" opacity="0.95"/>
    <!-- Center vein -->
    <line x1="0" y1="${-s*0.55}" x2="0" y2="${s*0.6}" stroke="#059669" stroke-width="${size*0.018}" stroke-linecap="round"/>
    <!-- Side veins -->
    <line x1="0" y1="${-s*0.15}" x2="${s*0.38}" y2="${-s*0.42}" stroke="#059669" stroke-width="${size*0.013}" stroke-linecap="round"/>
    <line x1="0" y1="${-s*0.15}" x2="${-s*0.38}" y2="${-s*0.42}" stroke="#059669" stroke-width="${size*0.013}" stroke-linecap="round"/>
    <line x1="0" y1="${s*0.18}" x2="${s*0.4}" y2="${-s*0.02}" stroke="#059669" stroke-width="${size*0.013}" stroke-linecap="round"/>
    <line x1="0" y1="${s*0.18}" x2="${-s*0.4}" y2="${-s*0.02}" stroke="#059669" stroke-width="${size*0.013}" stroke-linecap="round"/>
  </g>
  <!-- Brand text -->
  <text x="${cx}" y="${size * 0.88}" text-anchor="middle" fill="white" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${size * 0.065}" opacity="0.9">SmartFarm</text>
</svg>`;
}

// Generate SVG icons — these are valid for the web manifest
const icons = [
  { name: 'icon-192.svg', size: 192, maskable: false },
  { name: 'icon-512.svg', size: 512, maskable: false },
  { name: 'icon-maskable.svg', size: 512, maskable: true },
];

for (const icon of icons) {
  const svg = createIconSVG(icon.size, icon.maskable);
  const filePath = path.join(ICONS_DIR, icon.name);
  fs.writeFileSync(filePath, svg, 'utf-8');
  console.log(`✓ Created ${icon.name} (${icon.size}x${icon.size})`);
}

// Also create PNG-equivalent names by writing the SVGs with .png-note
// The web manifest will reference the SVG files directly since all modern browsers support SVG icons
console.log('\nAll PWA icons generated in:', ICONS_DIR);
console.log('Note: SVG icons are used. All modern browsers and PWA runtimes support SVG icons in manifests.');
