const fs = require('fs');
const path = require('path');

const revealDir = path.join(__dirname, '..', 'node_modules', 'reveal.js');
const revealDistDir = path.join(revealDir, 'dist');
const revealPluginDir = path.join(revealDir, 'plugin');
const outDir = path.join(__dirname, '..', 'libs','reveal.js');

function copyEssentialFiles(srcDir, destDir) {
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    const files = fs.readdirSync(srcDir);
    files.forEach(file => {
        const srcPath = path.join(srcDir, file);
        const destPath = path.join(destDir, file);
        const stat = fs.statSync(srcPath);

        if (stat.isDirectory()) {
            if (!fs.existsSync(destPath)) {
                fs.mkdirSync(destPath);
            }
            copyEssentialFiles(srcPath, destPath);
        } else {
            // Exclude .map files and hidden files
            if (
                !file.endsWith('.map') &&
                !file.startsWith('.') &&
                !file.endsWith('.md') &&
                !file.endsWith('.esm.j') &&
                !file.endsWith('.txt')
            ) {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    });
}

copyEssentialFiles(revealDistDir, outDir);
copyEssentialFiles(revealPluginDir, path.join(outDir, 'plugin'));

console.log('Copied Reveal.js essential files to libs/reveal.js');
console.log('Done.');
