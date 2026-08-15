#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const FACTS_FILE = path.join(ROOT, 'src/config/publicFacts.ts');
const REQUIRED_FACTS = [
  "minimumLearners: 5000",
  "minimumCountries: 15",
  "ageMin: 3",
  "ageMax: 12",
  "minimumMinutes: 35",
  "maximumMinutes: 40",
  "focusedLaunchInr: 59000",
  "wholeSchoolInr: 149000",
  "multiCampusInr: 299000",
  "pilotInr: 24900",
  "endDateLabel: '13 June 2026'",
];

const REQUIRED_PARITY = [
  ['public/llms.txt', '5000+'],
  ['public/llms.txt', '15+ countries'],
  ['public/llms.txt', 'ended on 13 June 2026'],
  ['public/llms.txt', 'Rs. 59,000 plus GST'],
  ['public/llms.txt', 'Rs. 1.49 lakh plus GST'],
  ['public/llms.txt', 'Rs. 2.99 lakh plus GST'],
  ['public/llms.txt', 'Rs. 24,900 plus GST'],
  ['src/lib/schemas.ts', 'children aged 3–12'],
  ['src/lib/schemas.ts', '35–40 minutes per session'],
  ['src/pages/ForSchoolsPage.tsx', '₹59,000'],
  ['src/pages/ForSchoolsPage.tsx', '₹1.49 lakh'],
  ['src/pages/ForSchoolsPage.tsx', '₹2.99 lakh'],
  ['src/pages/ForSchoolsPage.tsx', '₹24,900'],
];

const FORBIDDEN_PUBLIC_CLAIMS = [
  [/Trusted by 250\+ families/gi, 'unsupported 250+ families claim'],
  [/4\.9\s*\/\s*5\s*parent satisfaction/gi, 'unsupported 4.9/5 parent satisfaction claim'],
  [/Current official offer:\s*Summer Camp/gi, 'expired Summer Camp current-offer claim'],
  [/Summer Camp 2026[^\n]{0,120}(?:enrol(?:l)? now|enroll now|reserve your child.?s seat)/gi, 'expired Summer Camp enrollment CTA'],
];

const SCAN_ROOTS = ['src/pages', 'src/components', 'src/content', 'public/llms.txt', 'public/kb.json', 'functions/src/ai'];
const failures = [];

function collect(target, files) {
  if (!fs.existsSync(target)) return;
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    if (!/\.(?:ts|tsx|js|jsx|json|txt)$/i.test(target)) return;
    files.push(target);
    return;
  }
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (['node_modules', 'dist', 'output', '.git'].includes(entry.name)) continue;
    collect(path.join(target, entry.name), files);
  }
}

if (!fs.existsSync(FACTS_FILE)) failures.push('src/config/publicFacts.ts is missing');
else {
  const text = fs.readFileSync(FACTS_FILE, 'utf8');
  for (const required of REQUIRED_FACTS) {
    if (!text.includes(required)) failures.push(`publicFacts.ts missing ${JSON.stringify(required)}`);
  }
}

for (const [relativePath, required] of REQUIRED_PARITY) {
  const filePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(filePath)) {
    failures.push(`${relativePath} is missing`);
    continue;
  }
  const text = fs.readFileSync(filePath, 'utf8');
  if (!text.includes(required)) failures.push(`${relativePath} is out of parity: missing ${JSON.stringify(required)}`);
}

const files = [];
for (const root of SCAN_ROOTS) collect(path.join(ROOT, root), files);
for (const filePath of files) {
  const text = fs.readFileSync(filePath, 'utf8');
  for (const [regex, label] of FORBIDDEN_PUBLIC_CLAIMS) {
    regex.lastIndex = 0;
    if (regex.test(text)) failures.push(`${path.relative(ROOT, filePath)}: ${label}`);
  }
}

if (failures.length) {
  console.error(`FAIL: public facts consistency (${failures.length} issue${failures.length === 1 ? '' : 's'})`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`PASS: public facts consistency (${files.length} public files scanned)`);
