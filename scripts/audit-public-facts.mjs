#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const SEMANTIC_FACTS_FILE = path.join(ROOT, 'src/config/semanticFacts.ts');
const PUBLIC_FACTS_FILE = path.join(ROOT, 'src/config/publicFacts.ts');
const SCHEMAS_FILE = path.join(ROOT, 'src/lib/schemas.ts');
const VITE_CONFIG = ['vite.config.js', 'vite.config.ts', 'vite.config.jsx', 'vite.config.tsx']
  .map((name) => path.join(ROOT, name))
  .find((candidate) => fs.existsSync(candidate));
const DIST = path.join(ROOT, 'dist');
const CHECK_DIST = process.argv.includes('--dist');

const REQUIRED_SEMANTIC_FACTS = [
  "SEMANTIC_FACTS_VERSION = '2026-09-12-r1'",
  "name: 'Tiny Steps Learning'",
  "fullName: 'Vannala Ravali Priya'",
  'coreAgeMin: 3',
  'coreAgeMax: 12',
  "coreLabel: 'children aged 3–12'",
  'STANDARD_ONE_TO_ONE_DURATION_MINUTES = 35',
  'FREE_ASSESSMENT_DURATION_MINUTES = 35',
  'FREE_ASSESSMENT_SESSION_COUNT = 1',
  'FREE_ASSESSMENT_PRICE_INR = 0',
  "email: 'RavaliPriyaVannala@tinystepslearning.com'",
  "whatsappNumber: '919618398383'",
  "url: 'https://www.youtube.com/@TinyStepsLearning_Priya'",
  "url: 'https://www.linkedin.com/company/tiny-steps-learning/'",
  "url: 'https://www.pinterest.com/tinystepselearning/'",
  "url: 'https://www.quora.com/profile/Tiny-Steps-Learning'",
  'lessonCount: 31',
  'lessonCount: 40',
  'lessonCount: 30',
  'totalLessonCount: 101',
  'totalLessonCount: 72',
  'minimumLearners: 5000',
  'minimumCountries: 15',
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

const SEMANTIC_CONSUMERS = [
  'src/config/publicFacts.ts',
  'src/config/publicOffer.ts',
  'src/constants/publicContact.ts',
  'src/content/courses.ts',
  'src/lib/schemas.ts',
  'src/lib/officialProfiles.ts',
  'src/lib/founderProfiles.ts',
  'src/lib/pinterestProfile.ts',
  'src/lib/quoraProfile.ts',
];

const FORBIDDEN_DUPLICATED_LITERALS = [
  ['src/constants/publicContact.ts', /RavaliPriyaVannala@tinystepslearning\.com/g, 'duplicate contact email'],
  ['src/constants/publicContact.ts', /919618398383/g, 'duplicate WhatsApp number'],
  ['src/lib/schemas.ts', /https:\/\/www\.youtube\.com\/@TinyStepsLearning_Priya/g, 'duplicate YouTube URL'],
  ['src/lib/schemas.ts', /https:\/\/www\.linkedin\.com\/company\/tiny-steps-learning\//g, 'duplicate LinkedIn company URL'],
  ['src/lib/schemas.ts', /telephone:\s*['"]\+91-9618398383['"]/g, 'duplicate public telephone'],
  ['src/lib/pinterestProfile.ts', /https:\/\/www\.pinterest\.com\/tinystepselearning\//g, 'duplicate Pinterest URL'],
  ['src/lib/quoraProfile.ts', /https:\/\/www\.quora\.com\/profile\/Tiny-Steps-Learning/g, 'duplicate Quora URL'],
  ['src/lib/founderProfiles.ts', /https:\/\/www\.linkedin\.com\/in\/ravali-priya-vannala\//g, 'duplicate founder LinkedIn URL'],
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
  ['public/kb.json', 'children ages 3–12'],
  ['public/kb.json', 'Standard 1:1 classes are 35 minutes'],
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

const FORBIDDEN_RENDERED_CLAIMS = [
  [/4[–-]6 guided lessons/gi, 'fixed 4–6 lesson blending claim'],
  [/Lessons to begin first blending/gi, 'fixed first-blending lesson metric'],
  [/30[–-]40[^<\n]{0,120}core phonics foundations/gi, 'fixed core-phonics lesson metric'],
  [/36\+ lessons with stage-based progression/gi, 'obsolete 36+ phonics lesson count'],
  [/35[–-]40 minutes,\s*2[–-]3x per week/gi, 'fixed weekly phonics cadence'],
  [/35\s*[–-]\s*40\s+minutes?/gi, 'obsolete 35–40 minute public session range'],
  [/Ages 9 to 13/gi, 'public age range extends beyond 12'],
  [/Ages 8[–-]15/gi, 'advanced grammar age range extends beyond 12'],
  [/Ages 7[–-]15/gi, 'advanced speaking age range extends beyond 12'],
  [/Primary pathway:\s*ages 3[–-]10/gi, 'obsolete public phonics age range'],
  [/For CBSE, ICSE, State Board & International Schools[^<\n]{0,80}Ages 3[–-]10/gi, 'obsolete school public age range'],
  [/Trusted by 250\+ families/gi, 'unsupported 250+ families claim'],
  [/4\.9\s*\/\s*5\s*parent satisfaction/gi, 'unsupported 4.9/5 parent satisfaction claim'],
  [/27 April 2026/gi, 'obsolete Summer Camp start date'],
  [/₹\s*2,400|Rs\.\s*2,400/gi, 'obsolete Summer Camp historical fee', true],
];

const SCAN_ROOTS = [
  'src/pages',
  'src/components',
  'src/content',
  'public/llms.txt',
  'public/kb.json',
  'functions/src/ai',
];

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

function collect(target, files, predicate = (value) => /\.(?:ts|tsx|js|jsx|json|txt)$/i.test(value)) {
  if (!fs.existsSync(target)) return;
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    if (predicate(target)) files.push(target);
    return;
  }
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (['node_modules', 'output', '.git'].includes(entry.name)) continue;
    collect(path.join(target, entry.name), files, predicate);
  }
}

function seasonalSlice(relativePath, text) {
  if (relativePath !== 'public/llms.txt' && relativePath !== 'public/kb.json') return text;
  const index = text.indexOf('Summer Camp 2026');
  return index >= 0 ? text.slice(index, index + 900) : text;
}

if (!fs.existsSync(SEMANTIC_FACTS_FILE)) {
  failures.push('src/config/semanticFacts.ts is missing');
} else {
  const text = fs.readFileSync(SEMANTIC_FACTS_FILE, 'utf8');
  for (const required of REQUIRED_SEMANTIC_FACTS) {
    if (!text.includes(required)) {
      failures.push(`semanticFacts.ts missing ${JSON.stringify(required)}`);
    }
  }
  for (const forbidden of ['35–40 minutes per session', "ageRange: { min: 8, max: 15", "ageRange: { min: 7, max: 15"]) {
    if (text.includes(forbidden)) {
      failures.push(`semanticFacts.ts contains forbidden drift ${JSON.stringify(forbidden)}`);
    }
  }
}

for (const relativePath of SEMANTIC_CONSUMERS) {
  const filePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(filePath)) {
    failures.push(`${relativePath} is missing`);
    continue;
  }
  const text = fs.readFileSync(filePath, 'utf8');
  if (!text.includes('SEMANTIC_FACTS')) {
    failures.push(`${relativePath} does not consume the Brick 1 semantic facts registry`);
  }
}

if (!fs.existsSync(PUBLIC_FACTS_FILE)) {
  failures.push('src/config/publicFacts.ts is missing');
} else {
  const text = fs.readFileSync(PUBLIC_FACTS_FILE, 'utf8');
  if (!text.includes("import { SEMANTIC_FACTS } from './semanticFacts'")) {
    failures.push('publicFacts.ts is not a semanticFacts compatibility facade');
  }
}

if (!fs.existsSync(SCHEMAS_FILE)) {
  failures.push('src/lib/schemas.ts is missing');
} else {
  const text = fs.readFileSync(SCHEMAS_FILE, 'utf8');
  for (const required of [
    'ORGANIZATION_SAME_AS_URLS',
    'sessionDuration: SEMANTIC_FACTS.delivery.standardOneToOne.durationLabel',
    'telephone: SEMANTIC_FACTS.contact.telephoneDisplay',
    'email: SEMANTIC_FACTS.contact.email',
    'sameAs: [...ORGANIZATION_SAME_AS_URLS]',
  ]) {
    if (!text.includes(required)) {
      failures.push(`schemas.ts missing semantic registry projection ${JSON.stringify(required)}`);
    }
  }
  if (text.includes('35–40 minutes per session')) {
    failures.push('schemas.ts still contains the obsolete generic 35–40 minute session range');
  }
}

for (const [relativePath, regex, label] of FORBIDDEN_DUPLICATED_LITERALS) {
  const filePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(filePath)) {
    failures.push(`${relativePath} is missing from duplicate-literal audit`);
    continue;
  }
  const text = fs.readFileSync(filePath, 'utf8');
  regex.lastIndex = 0;
  if (regex.test(text)) failures.push(`${relativePath}: ${label}`);
}

for (const [relativePath, required] of REQUIRED_PARITY) {
  const filePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(filePath)) {
    failures.push(`${relativePath} is missing`);
    continue;
  }
  const text = fs.readFileSync(filePath, 'utf8');
  if (!text.includes(required)) {
    failures.push(`${relativePath} is out of parity: missing ${JSON.stringify(required)}`);
  }
}

const viteText = VITE_CONFIG ? fs.readFileSync(VITE_CONFIG, 'utf8') : '';
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
if (viteText.includes("sessionDuration: '35–40 minutes per session'")) {
  failures.push('vite config still carries the obsolete schemas.ts duration rewrite');
}

// Only legacy surfaces that still require a build-time migration belong in this
// Vite-normalization check. Commercial owner pages now carry canonical facts in
// their source and must be audited at source instead of requiring obsolete
// Vite replacement markers.
for (const required of [
  'P0 public-fact normalization',
  "age: 'Ages 8–12'",
  "age: 'Ages 7–12'",
  'For CBSE, ICSE, State Board & International Schools • Ages 3–12',
]) {
  if (!viteText.includes(required)) failures.push(`public normalization missing ${JSON.stringify(required)}`);
}

const SOURCE_LEVEL_PUBLIC_FACTS = [
  ['src/pages/phonics.tsx', [
    'Blending progress depends on the child’s starting point.',
    '35 minutes per live 1:1 class',
    'Fresh-word transfer',
    'Individual pace',
    '3 levels, 101 structured lessons with stage-based progression',
  ]],
  ['src/pages/public/OnlineEnglishClassesForKidsPage.tsx', [
    'Online English Classes for Kids',
    'Ages 3–12',
  ]],
  ['src/pages/public/ReadingClassesForKidsPage.tsx', [
    'Online Reading Classes for Kids',
  ]],
];

for (const [relativePath, requiredSignals] of SOURCE_LEVEL_PUBLIC_FACTS) {
  const filePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(filePath)) {
    failures.push(`${relativePath} is missing from source-level public facts audit`);
    continue;
  }
  const source = fs.readFileSync(filePath, 'utf8');
  for (const required of requiredSignals) {
    if (!source.includes(required)) failures.push(`${relativePath} missing canonical source fact ${JSON.stringify(required)}`);
  }
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

if (CHECK_DIST) {
  if (!fs.existsSync(DIST)) {
    failures.push('dist/ missing for rendered public claims check');
  } else {
    const htmlFiles = [];
    collect(DIST, htmlFiles, (value) => value.endsWith('.html'));
    for (const filePath of htmlFiles) {
      const text = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(DIST, filePath).replaceAll(path.sep, '/');
      const isSeasonalPage = relativePath.startsWith('summer-camp') || relativePath.startsWith('summer-camps/');
      for (const [regex, label, seasonalOnly = false] of FORBIDDEN_RENDERED_CLAIMS) {
        if (seasonalOnly && !isSeasonalPage) continue;
        regex.lastIndex = 0;
        if (regex.test(text)) failures.push(`${path.relative(ROOT, filePath)}: ${label}`);
      }
    }
  }
}

if (failures.length) {
  console.error(`FAIL: public semantic facts consistency (${failures.length} issue${failures.length === 1 ? '' : 's'})`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `PASS: public semantic facts consistency (${files.length} public files scanned; Brick 1 registry ownership enforced; ages 3–12 and 35-minute standard 1:1 facts enforced; offer/proof/outcome parity checked; seasonal archives stripped of obsolete offer details${CHECK_DIST ? '; rendered public HTML clean' : ''})`,
);
