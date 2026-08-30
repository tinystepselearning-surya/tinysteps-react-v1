import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();

const SCAN_ROOTS = [
  'src/pages',
  'src/components',
  'src/content',
  'src/hooks/useAskTinyStepsChat.ts',
  'src/lib/routeSeoRegistry.js',
  'public/kb.json',
  'public/llms.txt',
  'functions/src/ai',
];

const EXCLUDED_PARTS = new Set([
  'admin',
  'teacher',
  'parent-dashboard',
  'kids-dashboard',
]);

const FORBIDDEN_PATTERNS = [
  { label: '₹140 price', regex: /₹\s*140\b/gi },
  { label: '140 per class', regex: /\b140\s*(?:\/\s*class|per\s+class)\b/gi },
  { label: 'three free demos', regex: /\b(?:3|three)\s+free\s+(?:demo|assessment)(?:\s+classes?)?\b/gi },
  { label: '20-minute free assessment', regex: /\bfree\s+20[-– ]minute\s+assessment\b/gi },
  { label: '10–15 minute level check', regex: /\b10\s*[-–]\s*15[- ]minute\s+(?:level\s+check|assessment)\b/gi },
  { label: 'quick level check', regex: /\bquick\s+level\s+check\b/gi },
  { label: 'unqualified Book Free Demo', regex: /\bBook\s+Free\s+Demo\b/g },
  { label: 'unqualified 3-day free trial', regex: /\b3[- ]day\s+free\s+trial\b/gi },
];

const REQUIRED_STRINGS = [
  {
    path: 'src/config/publicOffer.ts',
    value: 'Standard 1:1:',
  },
  {
    path: 'src/config/publicOffer.ts',
    value: 'One Free 35-Minute Demo Assessment Class',
  },
  {
    path: 'src/config/publicOffer.ts',
    value: '3-day digital games trial',
  },
  {
    path: 'src/pages/PricingPage.tsx',
    value: 'STANDARD_PRICING_SUMMARY',
  },
  {
    path: 'public/kb.json',
    value: 'Summer Camp 2026 concluded on 13 June 2026',
  },
];

const REQUIRED_PATTERNS = [
  {
    path: 'src/pages/public/BookDemoPage.tsx',
    label: 'demo Service duration derived from FREE_DEMO_DURATION_MINUTES',
    regex: /duration:\s*`PT\$\{FREE_DEMO_DURATION_MINUTES\}M`/,
  },
];

const RETIRED_KB_PATHS = new Set([
  '/how-it-works',
  '/summer-camps/phonics-fast-track',
  '/summer-camps/grammar-fast-track',
  '/summer-camps/speaking-fast-track',
]);

const failures = [];

function relative(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
}

function isExcluded(filePath) {
  const rel = relative(filePath);
  const parts = rel.split('/');
  if (parts.some((part) => EXCLUDED_PARTS.has(part))) return true;
  if (rel.startsWith('src/pages/parent/')) return true;
  if (rel.startsWith('src/pages/kids/')) return true;
  if (rel === 'src/pages/Home.old.tsx') return true;
  if (rel === 'public/rss.xml' || rel === 'public/feed.xml') return true;
  if (/\.(?:spec|test)\.[cm]?[jt]sx?$/i.test(rel)) return true;
  return false;
}

function collectFiles(targetPath, files) {
  if (!fs.existsSync(targetPath) || isExcluded(targetPath)) return;
  const stat = fs.statSync(targetPath);
  if (stat.isFile()) {
    files.push(targetPath);
    return;
  }
  for (const entry of fs.readdirSync(targetPath, { withFileTypes: true })) {
    collectFiles(path.join(targetPath, entry.name), files);
  }
}

function lineNumberAt(text, index) {
  return text.slice(0, index).split('\n').length;
}

const files = [];
for (const scanRoot of SCAN_ROOTS) {
  collectFiles(path.join(ROOT, scanRoot), files);
}

for (const filePath of files) {
  const text = fs.readFileSync(filePath, 'utf8');
  for (const pattern of FORBIDDEN_PATTERNS) {
    pattern.regex.lastIndex = 0;
    for (const match of text.matchAll(pattern.regex)) {
      failures.push(
        `${relative(filePath)}:${lineNumberAt(text, match.index ?? 0)}: ${pattern.label}: ${JSON.stringify(match[0])}`
      );
    }
  }
}

for (const required of REQUIRED_STRINGS) {
  const filePath = path.join(ROOT, required.path);
  if (!fs.existsSync(filePath)) {
    failures.push(`${required.path}: required file is missing`);
    continue;
  }
  const text = fs.readFileSync(filePath, 'utf8');
  if (!text.includes(required.value)) {
    failures.push(`${required.path}: missing required string ${JSON.stringify(required.value)}`);
  }
}

for (const required of REQUIRED_PATTERNS) {
  const filePath = path.join(ROOT, required.path);
  if (!fs.existsSync(filePath)) {
    failures.push(`${required.path}: required file is missing`);
    continue;
  }
  const text = fs.readFileSync(filePath, 'utf8');
  required.regex.lastIndex = 0;
  if (!required.regex.test(text)) {
    failures.push(`${required.path}: missing required pattern ${JSON.stringify(required.label)}`);
  }
}

let kbEntries = [];
try {
  kbEntries = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/kb.json'), 'utf8'));
  if (!Array.isArray(kbEntries)) {
    failures.push('public/kb.json: root value must be an array');
    kbEntries = [];
  }
} catch (error) {
  failures.push(`public/kb.json: invalid JSON (${error.message})`);
}

const seenKbPaths = new Set();
for (const entry of kbEntries) {
  const entryPath = entry?.path;
  if (typeof entryPath !== 'string') {
    failures.push('public/kb.json: every entry must contain a string path');
    continue;
  }
  if (seenKbPaths.has(entryPath)) {
    failures.push(`public/kb.json: duplicate path ${entryPath}`);
  }
  seenKbPaths.add(entryPath);
  if (RETIRED_KB_PATHS.has(entryPath)) {
    failures.push(`public/kb.json: retired path must not be present: ${entryPath}`);
  }
}

const summerCampEntry = kbEntries.find((entry) => entry?.path === '/summer-camps');
if (!summerCampEntry || !/Summer Camp 2026 concluded on 13 June 2026/i.test(summerCampEntry.text ?? '')) {
  failures.push('public/kb.json: /summer-camps must state the conclusion date');
}

const bookDemoEntry = kbEntries.find((entry) => entry?.path === '/book-demo');
if (!bookDemoEntry || !/35-minute/i.test(bookDemoEntry.text ?? '')) {
  failures.push('public/kb.json: /book-demo must contain "35-minute"');
}

const pricingEntry = kbEntries.find((entry) => entry?.path === '/pricing');
const pricingText = pricingEntry?.text ?? '';
for (const requiredPrice of ['₹400', '₹180', '₹300', '₹4,800']) {
  if (!pricingText.includes(requiredPrice)) {
    failures.push(`public/kb.json: /pricing must contain ${requiredPrice}`);
  }
}

if (failures.length > 0) {
  console.error(`FAIL: public offer consistency (${failures.length} issue${failures.length === 1 ? '' : 's'})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`PASS: public offer consistency (${files.length} files scanned, ${kbEntries.length} KB entries verified)`);
