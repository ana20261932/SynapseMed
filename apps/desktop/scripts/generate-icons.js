const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');
const SVG = path.join(ASSETS, 'icon.svg');

fs.mkdirSync(ASSETS, { recursive: true });

function run(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

// 1. Base PNG (linux icon, 1024x1024)
run(`convert -background none -resize 1024x1024 "${SVG}" "${ASSETS}/icon.png"`);

// 2. Tray icon (small)
run(`convert -background none -resize 32x32 "${SVG}" "${ASSETS}/tray-icon.png"`);

// 3. Windows ICO (multi-size)
const icoSizes = [16, 32, 48, 64, 128, 256].map(s => `-resize ${s}x${s}`).join(' ');
run(`convert -background none ${icoSizes} "${SVG}" "${ASSETS}/icon.ico"`);

// 4. macOS ICNS (1024 master)
run(`convert -background none -resize 1024x1024 "${SVG}" "${ASSETS}/icon.icns"`);

// 5. NSIS installer sidebar BMP
run(`convert -size 164x314 xc:#0f172a -gravity center -fill "#0ea5e9" -pointsize 24 -annotate +0+40 "SynapseMed" "${ASSETS}/installer-sidebar.bmp"`);

console.log('Icons generated in', ASSETS);
