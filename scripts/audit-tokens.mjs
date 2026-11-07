import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.resolve(rootDir, 'src');

let hasErrors = false;

function getAllFiles(dir, exts = ['.ts', '.tsx']) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        results = results.concat(getAllFiles(fullPath, exts));
      }
    } else if (exts.includes(path.extname(file))) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = getAllFiles(srcDir);

// 1. Audit banned border radii (> 6px)
const bannedRadiiRegex = /\brounded-(?:lg|xl|2xl|3xl)\b|rounded-\[(\d+)px\]/g;

// 2. Audit banned font sizes (> 20px)
const bannedFontSizeRegex = /\btext-(?:xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b|text-\[(\d+)px\]/g;

// 3. Audit raw hex codes outside tokens.css
// Allowed exceptions: '#061014' (explicitly specified in DESIGN.md §8 for primary button text)
const hexColorRegex = /#([A-Fa-f0-9]{3,8})\b/g;
const allowedHex = new Set(['#061014']);

// 4. Audit rounded-full (permitted only on status dots <= 8px: w-1.5, w-2, h-1.5, h-2)
const roundedFullRegex = /\brounded-full\b/g;

console.log(`Auditing ${files.length} source files for token and design compliance...`);

for (const filePath of files) {
  const relPath = path.relative(rootDir, filePath);
  // Skip test files for token audits if needed, or scan all
  if (relPath.includes('tokens.css')) continue;

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, lineIdx) => {
    // 1. Check banned radii
    let match;
    while ((match = bannedRadiiRegex.exec(line)) !== null) {
      if (match[1]) {
        const px = parseInt(match[1], 10);
        if (px > 6) {
          console.error(`[FAIL] ${relPath}:${lineIdx + 1} - Banned radius > 6px (${px}px): "${match[0]}"`);
          hasErrors = true;
        }
      } else {
        console.error(`[FAIL] ${relPath}:${lineIdx + 1} - Banned radius: "${match[0]}" (Max allowed is 6px)`);
        hasErrors = true;
      }
    }

    // 2. Check banned font sizes
    while ((match = bannedFontSizeRegex.exec(line)) !== null) {
      if (match[1]) {
        const px = parseInt(match[1], 10);
        if (px > 20) {
          console.error(`[FAIL] ${relPath}:${lineIdx + 1} - Banned font size > 20px (${px}px): "${match[0]}"`);
          hasErrors = true;
        }
      } else {
        console.error(`[FAIL] ${relPath}:${lineIdx + 1} - Banned font size: "${match[0]}" (Max allowed is 20px)`);
        hasErrors = true;
      }
    }

    // 3. Check raw hex colors
    while ((match = hexColorRegex.exec(line)) !== null) {
      const hex = match[0].toUpperCase();
      if (!allowedHex.has(match[0].toLowerCase())) {
        console.error(`[FAIL] ${relPath}:${lineIdx + 1} - Raw hex color not permitted in components: "${match[0]}". Use CSS token.`);
        hasErrors = true;
      }
    }

    // 4. Check rounded-full usage
    if (roundedFullRegex.test(line)) {
      const isStatusDot = /w-1\.5|w-2|h-1\.5|h-2|8px/.test(line);
      if (!isStatusDot) {
        console.error(`[FAIL] ${relPath}:${lineIdx + 1} - rounded-full is only allowed on status dots <= 8px: "${line.trim()}"`);
        hasErrors = true;
      }
    }
  });
}

if (hasErrors) {
  console.error('\nToken & Design Audit FAILED.');
  process.exit(1);
} else {
  console.log('✓ Token & Design Audit PASSED: Zero unauthorized hex colors, zero radii > 6px, zero font sizes > 20px.');
}
