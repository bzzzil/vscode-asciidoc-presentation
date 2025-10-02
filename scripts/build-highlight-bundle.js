const fs = require('fs');
const path = require('path');

const hljsDir = path.join(__dirname, '..', 'node_modules', '@highlightjs', 'cdn-assets');
const langDir = path.join(hljsDir, 'languages');
const stylesDir = path.join(hljsDir, 'styles');
const outDir = path.join(__dirname, '..', 'libs','highlight.js');
const outFile = path.join(outDir, 'highlight.min.js');

const outStylesDir = path.join(outDir,'styles');

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
}

if (!fs.existsSync(outStylesDir)) {
    fs.mkdirSync(outStylesDir);
}

let bundle = '';

// Always include core first
bundle += fs.readFileSync(path.join(hljsDir, 'highlight.min.js'), 'utf8');

// Detect all available languages
const languageFiles = fs.readdirSync(langDir)
  .filter(f => f.endsWith('.min.js'));

// Add each language
languageFiles.forEach(lang => {
  const langFile = path.join(langDir, lang);
  if (fs.existsSync(langFile)) {
    bundle += '\n' + fs.readFileSync(langFile, 'utf8');
  } else {
    console.warn(`Language file not found: ${langFile}`);
  }
});

// Write the bundle
fs.writeFileSync(outFile, bundle, 'utf8');
console.log(`Custom Highlight.js bundle created at ${outFile}`);

// Detect all not minimized styles or other files
const styleFiles = fs.readdirSync(stylesDir)
  .filter(f => (f.endsWith('.css') && !f.endsWith('.min.css')) || !f.endsWith('.css'));

// Copy each style
styleFiles.forEach(style => {
  const styleFile = path.join(stylesDir, style);
  const outStyleFile = path.join(outStylesDir, style);
  if (fs.existsSync(styleFile) && fs.statSync(styleFile).isFile()) {
    fs.copyFileSync(styleFile, outStyleFile);
    console.log(`Copied style: ${style}`);
  }
});

console.log('Done.');
