const fs = require('fs');
const path = require('path');

const qrcodeDir = path.join(__dirname, '..', 'node_modules', 'qrcodejs');
const outDir = path.join(__dirname, '..', 'libs', 'qrcode');

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

const srcFile = path.join(qrcodeDir, 'qrcode.min.js');
const destFile = path.join(outDir, 'qrcode.min.js');

fs.copyFileSync(srcFile, destFile);

console.log(`Copied qrcode.min.js to ${destFile}`);
