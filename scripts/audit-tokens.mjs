// Design-token audit for DESIGN.md v2 ("Graphite Node").
// Fails the build when components bypass the design system.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(rootDir, 'src');

function walk(dir) {
  return fs.readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      return ['node_modules', 'dist', '.git'].includes(name) ? [] : walk(full);
    }
    return /\.(tsx?|css)$/.test(name) ? [full] : [];
  });
}

// Files allowed to define raw colors / AI accents.
const TOKEN_FILE = /src[\\/]styles[\\/]tokens\.css$/;
const TEST_FILE = /__tests__|\.test\.tsx?$/;

const RULES = [
  {
    id: 'raw-hex',
    re: /#[0-9A-Fa-f]{3,8}\b/g,
    msg: 'Raw hex color. Use a token from tokens.css.',
    skip: (f) => TOKEN_FILE.test(f),
  },
  {
    id: 'raw-rgb',
    re: /\brgba?\(\s*\d/g,
    msg: 'Raw rgb()/rgba() color. Add a token instead.',
    skip: (f) => TOKEN_FILE.test(f),
  },
  {
    id: 'arbitrary-radius',
    re: /(?<![-\w])rounded(?:-[trblse]{1,2})?-(?:\[[^\]]+\]|(?:sm|md|lg|xl|2xl|3xl)(?![-\w]))|(?<![-\w])rounded(?![-\w])/g,
    msg: 'Use named radius tokens: rounded-chip | control | card | panel | full.',
  },
  {
    id: 'arbitrary-font-size',
    re: /(?<![-\w])text-(?:\[\d+(?:\.\d+)?(?:px|rem)\]|(?:xs|sm|base|lg|xl|[2-9]xl)(?![-\w]))/g,
    msg: 'Use type tokens: text-title | card-title | body | body-strong | label | small | metric | data | hud.',
  },
  {
    id: 'tailwind-palette',
    re: /\b(?:bg|text|border|ring|from|via|to|fill|stroke)-(?:slate|gray|zinc|neutral|stone|red|orange|yellow|lime|emerald|teal|sky|blue|indigo|purple|fuchsia|pink|rose)-\d{2,3}\b/g,
    msg: 'Tailwind default palette color. Use design tokens.',
  },
  {
    id: 'removed-v1-token',
    re: /(?<![-\w])(?:text-section|[hw]-(?:btn-sm|btn-md|header|sb-collapsed|sb-expanded)|shadow-floating|font-\[550\])(?![-\w])/g,
    msg: 'v1 token removed in DESIGN.md v2 — migrate to the v2 tokens.',
  },
  {
    id: 'backdrop-blur',
    re: /\bbackdrop-blur(?:-\w+)?\b|backdrop-filter/g,
    msg: 'Glassmorphism is banned (DESIGN.md §10).',
  },
  {
    id: 'gradient',
    re: /(?<![-\w])bg-gradient-to-\w+|linear-gradient\(|radial-gradient\(/g,
    msg: 'Decorative gradients are banned (DESIGN.md §11). Use bg-canvas for the dot grid.',
    skip: (f) => TOKEN_FILE.test(f) || /index\.css$/.test(f),
  },
  {
    id: 'off-palette-accent',
    re: /(?<![-\w])(?:bg|text|border|ring|fill|stroke|from|via|to)-cyan(?:-[\w]+)?(?![-\w])|(?<![-\w])(?:bg|text|border|ring)-(?:magenta|violet)(?![-\w])/g,
    msg: 'Cyan/magenta are not in the v2 palette. Use accent / accent-bright / accent-dim.',
  },
  {
    id: 'card-shadow',
    re: /(?<![-\w])shadow-(?:sm|md|lg|xl|2xl|inner)(?![-\w])|(?<![-\w])shadow(?![-\w])/g,
    msg: 'Only shadow-float (floating layers), shadow-glow-accent, shadow-focus are allowed.',
  },
];

const files = walk(srcDir).filter((f) => !TEST_FILE.test(f));
let failures = 0;

for (const file of files) {
  const rel = path.relative(rootDir, file);
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (/audit-ignore/.test(line)) return; // explicit, reviewable escape hatch
    for (const rule of RULES) {
      if (rule.skip?.(file)) continue;
      rule.re.lastIndex = 0;
      let m;
      while ((m = rule.re.exec(line)) !== null) {
        console.error(`[${rule.id}] ${rel}:${i + 1}  "${m[0]}"  ${rule.msg}`);
        failures++;
      }
    }
  });
}

if (failures) {
  console.error(`\nDesign token audit FAILED: ${failures} issue(s) in ${files.length} files.`);
  process.exit(1);
}
console.log(`Design token audit passed (${files.length} files).`);
