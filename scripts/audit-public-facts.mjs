#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const FACTS_FILE = path.join(ROOT, 'src/config/publicFacts.ts');
const VITE_CONFIG = path.join(ROOT, 'vite.config.ts');
const REQUIRED_FACTS = [
  'SCHEMA_PUBLIC_FACTS',
  'STANDARD_ONE_TO_ONE_PER_CLASS_PRICE',
  'STANDARD_SMALL_GROUP_MIN_PER_CLASS',
  'STANDARD_SMALL_GROUP_MAX_PER_CLASS',
  'FREE_DEMO_DURATION_MINUTES',
  'FREE_DEMO_PRICE',
  'ageMin: 3',
  'ageMax: 12',
  'minimumLearners: 5000',
  'minimumCountries: 15',
  'minimumMinutes: 35',
  'maximumMinutes: 40',
  'focusedLaunchInr: 59000',
  'wholeSchoolInr: 149000',
  'multiCampusInr: 299000',
  'pilotInr: 24900',
  'aggregateRatingsRequireApprovedTestimonials: true',
  'generatedFallbackTestimonialsAllowed: false',
  'universalGuaranteedTimelineAllowed: false',
  "status: 'concluded'",
  "endDateLabel: '13 June 2026'",
];
const REQUIRED_PARITY = [
  ['public/llms.txt', '5000+'],
  ['public/llms.txt', '15+ countries'],
  ['public/llms.txt', 'Rs. 400 per class'],
  ['public/llms.txt', 'free 35-minute 1:1 online demo assessment class'],
  ['public/llms.txt', 'concluded on 13 June 2026'],
  ['public/llms.txt', 'Rs. 59,000 plus GST'],
  ['public/llms.txt', 'Rs. 1.49 lakh plus GST'],
  ['public/llms.txt', 'Rs. 2.99 lakh plus GST'],
  ['public/llms.txt', 'Rs. 24,900 plus GST'],
  ['public/kb.json', 'concluded on 13 June 2026'],
  ['public/kb.json', '₹400 per class'],
  ['public/kb.json', 'free 35-minute 1:1 online demo assessment class'],
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
const SEASONAL_PUBLIC_FILES = [
  'src/pages/SummerCampsPage.tsx',
  'src/pages/SummerCampProgramPage.tsx',
  'src/pages/public/SummerCampForKidsIndiaPage.tsx',
  'src/pages/public/SummerReadingProgramKidsPage.tsx',
  'src/pages/public/SummerSpeakingCampKidsPage.tsx',
  'public/llms.txt',
  'public/kb.json',
];
const FORBIDDEN_SEASONAL_COPY = [
  [/27 April 2026/gi, 'obsolete Summer Camp start date'],
  [/₹\s*2,400|Rs\.\s*2,400/gi, 'obsolete Summer Camp historical fee'],
  [/₹\s*5,000|Rs\.\s*5,000/gi, 'obsolete Summer Camp historical list fee'],
  [/\b(?:enrolment|enrollment)\b/gi, 'seasonal enrollment language'],
  [/\bcurrent offer\b/gi, 'seasonal current-offer language'],
  [/\b(?:camp|programme|program) is closed\b/gi, 'seasonal closed-offer language'],
  [/\b(?:historical )?(?:batch|capacity)\b[^\n]{0,80}\b(?:cap|learners|seats)\b/gi, 'obsolete seasonal capacity detail'],
];
const failures = [];

function collect(target, files) {
  if (!fs.existsSync(target)) return;
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    if (/\.(?:ts|tsx|js|jsx|json|txt)$/i.test(target)) files.push(target);
    return;
  }
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (['node_modules', 'dist', 'output', '.git'].includes(entry.name)) continue;
    collect(path.join(target, entry.name), files);
  }
}

function seasonalSlice(relativePath, text) {
  if (relativePath !== 'public/llms.txt' && relativePath !== 'public/kb.json') return text;
  const index = text.indexOf('Summer Camp 2026');
  return index >= 0 ? text.slice(index, index + 900) : text;
}

if (!fs.existsSync(FACTS_FILE)) failures.push('src/config/publicFacts.ts is missing');
else {
  const text = fs.readFileSync(FACTS_FILE, 'utf8');
  for (const required of REQUIRED_FACTS) {
    if (!text.includes(required)) failures.push(`publicFacts.ts missing ${JSON.stringify(required)}`);
  }
  for (const forbidden of ['startDateIso', 'startDateLabel', 'historicalEnrollmentPriceInr', 'historicalListPriceInr', 'batchCap']) {
    if (text.includes(forbidden)) failures.push(`publicFacts.ts still exposes obsolete seasonal fact ${forbidden}`);
  }
}
for (const [relativePath, required] of REQUIRED_PARITY) {
  const filePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(filePath)) { failures.push(`${relativePath} is missing`); continue; }
  const text = fs.readFileSync(filePath, 'utf8');
  if (!text.includes(required)) failures.push(`${relativePath} is out of parity: missing ${JSON.stringify(required)}`);
}
const viteText = fs.existsSync(VITE_CONFIG) ? fs.readFileSync(VITE_CONFIG, 'utf8') : '';
if (!viteText.includes('FALLBACK_TESTIMONIAL_TARGET = BASE_FALLBACK_TESTIMONIALS.length')) {
  failures.push('public build does not disable generated testimonial-count inflation');
}
if (!viteText.includes('EXTRA_PHONICS_FALLBACK_COUNT = 0')) {
  failures.push('public build does not disable generated extra phonics testimonials');
}
if (!viteText.includes('LEGACY_PHONICS_PROGRESS_COPY') || !viteText.includes('LEGACY_PHONICS_SUPPORT_COPY')) {
  failures.push('legacy templated phonics posts are not normalized to child-specific progress/support language');
}
if (!viteText.includes("replaceAll('content: post.progress'") || !viteText.includes("replaceAll('content: post.support'")) {
  failures.push('legacy templated phonics timeline/support fields can still render directly');
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

for (const relativePath of SEASONAL_PUBLIC_FILES) {
  const filePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(filePath)) {
    failures.push(`${relativePath} is missing from seasonal audit`);
    continue;
  }
  const text = fs.readFileSync(filePath, 'utf8');
  const seasonalText = seasonalSlice(relativePath, text);
  for (const [regex, label] of FORBIDDEN_SEASONAL_COPY) {
    regex.lastIndex = 0;
    if (regex.test(seasonalText)) failures.push(`${relativePath}: ${label}`);
  }
  if (!/Summer Camp 2026[^\n]{0,160}concluded on 13 June 2026/i.test(seasonalText) && !text.includes('SUMMER_CAMP_2026_ARCHIVE_LABEL')) {
    failures.push(`${relativePath}: missing clear Summer Camp 2026 conclusion status`);
  }
}

if (failures.length) {
  console.error(`FAIL: public facts consistency (${failures.length} issue${failures.length === 1 ? '' : 's'})`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`PASS: public facts consistency (${files.length} public files scanned; offer/proof/outcome parity checked; seasonal archives stripped of obsolete offer details; legacy template timelines normalized in rendered output)`);
