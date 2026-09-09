const fs = require("fs");
const path = require("path");

const revealDir = path.join(__dirname, "..", "node_modules", "reveal.js");
const revealDistDir = path.join(revealDir, "dist");
const revealPluginDir = path.join(revealDistDir, "plugin");
const outDir = path.join(__dirname, "..", "libs", "reveal.js");

function copyEssentialFiles(srcDir, destDir) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  const files = fs.readdirSync(srcDir);
  files.forEach((file) => {
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
        !file.endsWith(".map") &&
        !file.startsWith(".") &&
        !file.endsWith(".md") &&
        !file.endsWith(".esm.j") &&
        !file.endsWith(".txt")
      ) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  });
}

copyEssentialFiles(revealDistDir, outDir);
copyEssentialFiles(revealPluginDir, path.join(outDir, "plugin"));

console.log(`Copied Reveal.js essentials to ${outDir}`);

// Deploy reveal.js-plugins packages from node_modules to libs/reveal.js-plugins

const revealPluginsRoot = path.join(
  __dirname,
  "..",
  "node_modules",
  "reveal.js-plugins",
);
const outPluginsRoot = path.join(__dirname, "..", "libs", "reveal.js-plugins");

function copyRevealPlugins(srcRoot, destRoot) {
  if (!fs.existsSync(srcRoot)) {
    console.warn(`Reveal.js-plugins directory not found: ${srcRoot}`);
    return;
  }
  if (!fs.existsSync(destRoot)) {
    fs.mkdirSync(destRoot, { recursive: true });
  }

  const entries = fs.readdirSync(srcRoot);
  entries.forEach((entry) => {
    const pluginPath = path.join(srcRoot, entry);
    const stat = fs.statSync(pluginPath);
    if (!stat.isDirectory()) {
      return;
    }

    // prefer dist folder inside plugin package, fallback to plugin root
    const pluginDist = path.join(pluginPath, "dist");
    const srcToCopy = fs.existsSync(pluginDist) ? pluginDist : pluginPath;
    const destForPlugin = path.join(destRoot, entry);

    try {
      copyEssentialFiles(srcToCopy, destForPlugin);
      console.log(`Copied plugin ${entry} -> ${destForPlugin}`);
    } catch (err) {
      console.error(`Failed to copy plugin ${entry}:`, err);
    }
  });
}

copyRevealPlugins(revealPluginsRoot, outPluginsRoot);
console.log(`Copied Reveal.js plugins to ${outPluginsRoot}`);
