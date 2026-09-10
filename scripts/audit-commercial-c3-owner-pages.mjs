#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const failures = [];
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));

const c3Path = 'src/lib/commercialC3OwnerPageAudit.ts';
const c2Path = 'src/lib/commercialC2KeywordOwnership.ts';
const routeSeoPath = 'src/lib/routeSeoRegistry.js';
const routeManifestPath = 'src/lib/publicRouteManifest.js';

for (const required of [c3Path, c2Path, routeSeoPath, routeManifestPath]) {
  if (!exists(required)) failures.push(`${required} is missing`);
}

const ownerSources = [
  'src/pages/phonics.tsx',
  'src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx',
  'src/pages/public/PhonicsFeesIndiaPage.tsx',
  'src/pages/public/ReadingClassesForKidsPage.tsx',
  'src/pages/public/ReadingFluencyProgramPage.tsx',
  'src/pages/grammar.tsx',
  'src/pages/public/WritingClassesForKidsPage.tsx',
  'src/pages/public/SpokenEnglishClassesForKidsPage.tsx',
  'src/pages/speaking.tsx',
  'src/pages/public/ConfidenceBuildingProgramKidsPage.tsx',
  'src/pages/public/OnlineEnglishClassesForKidsPage.tsx',
  'src/pages/public/OnlineEnglishClassesHyderabadPage.tsx',
  'src/pages/PricingPage.tsx',
  'src/pages/public/BookDemoPage.tsx',
];
for (const source of ownerSources) if (!exists(source)) failures.push(`owner source missing: ${source}`);

if (exists(c3Path)) {
  const c3 = read(c3Path);
  const rowCount = (c3.match(/audit\(\{ clusterId:/g) || []).length;
  if (rowCount !== 15) failures.push(`expected 15 C3 cluster audits, found ${rowCount}`);
  for (const cluster of [
    'phonics-provider','phonics-comparison','phonics-price','reading-provider','reading-fluency','grammar-provider','writing-provider','spoken-english-provider','public-speaking-provider','communication-provider','confidence-building','broad-english-provider','broad-english-hyderabad','english-tutor-provider','general-pricing','free-demo-booking',
  ]) {
    // communication/public-speaking share one page; the list intentionally includes all C2 IDs and catches typo/missing IDs.
    if (!c3.includes(`clusterId:'${cluster}'`)) failures.push(`C3 missing cluster audit ${cluster}`);
  }
  if (!c3.includes('expectedUniqueOwnerPages: 14')) failures.push('C3 must lock 14 unique owner pages');
  if (!c3.includes('countryPagesCreated: 0')) failures.push('C3 must create zero country pages');
  if (!c3.includes('aiPromptPagesCreated: 0')) failures.push('C3 must create zero AI-prompt pages');
}

if (exists(c2Path)) {
  const c2 = read(c2Path);
  if (!c2.includes("COMMERCIAL_C2_STATUS = 'ownership-complete'")) failures.push('C2 ownership is not complete');
}

const strengthened = {
  'src/pages/public/WritingClassesForKidsPage.tsx': ['creative writing classes for kids online','createCourseSchema',"areaServed: ['India', 'Worldwide']",'35 minutes'],
  'src/pages/public/ReadingFluencyProgramPage.tsx': ['reading fluency classes for kids online','createCourseSchema','createWebPageSchema',"areaServed: ['India', 'Worldwide']",'35 minutes'],
  'src/pages/public/ConfidenceBuildingProgramKidsPage.tsx': ['confidence building classes for kids','createCourseSchema','createWebPageSchema','general public speaking or communication classes','35 minutes'],
  'src/pages/public/SpokenEnglishClassesForKidsPage.tsx': ['spoken English classes for NRI kids','1 to 1 spoken English classes for kids','difference between spoken English and public speaking','35 minutes'],
  'src/pages/public/OnlineEnglishClassesForKidsPage.tsx': ['online English tutor for kids','NRI families','United Arab Emirates','United States','United Kingdom','Australia','Singapore','Ages 3 to 12'],
};
for (const [file, tokens] of Object.entries(strengthened)) {
  if (!exists(file)) continue;
  const content = read(file);
  for (const token of tokens) if (!content.includes(token)) failures.push(`${file} missing ${JSON.stringify(token)}`);
}

if (exists('src/pages/public/OnlineEnglishClassesForKidsPage.tsx')) {
  const globalEnglish = read('src/pages/public/OnlineEnglishClassesForKidsPage.tsx');
  if (globalEnglish.includes('Ages 9 to 13')) failures.push('broad English page still exposes age 13');
}

if (exists('vite.config.js')) {
  const vite = read('vite.config.js');
  for (const token of [
    ".replace('<div>35–40 min</div>', '<div>35 min</div>')",
    '₹4,800 for 12 classes · 35 min · 1 child : 1 teacher',
    'Standard 1:1 classes are 35 minutes',
  ]) {
    if (!vite.includes(token)) failures.push(`phonics-fee public-fact normalization missing ${JSON.stringify(token)}`);
  }
}

if (exists(routeSeoPath)) {
  const routeSeo = read(routeSeoPath);
  const metadataOwners = [
    ['/phonics', 'Online Phonics Classes'],
    ['/best-online-phonics-classes-for-kids-in-india', 'Best Online Phonics Classes'],
    ['/phonics-fees-india', 'Phonics Class Fees'],
    ['/reading-classes-for-kids', 'Reading Classes'],
    ['/reading-fluency-program', 'Reading Fluency'],
    ['/grammar', 'Grammar Classes'],
    ['/writing-classes-for-kids', 'Writing Classes'],
    ['/spoken-english-classes-for-kids-online', 'Spoken English Classes'],
    ['/speaking', 'Public Speaking Classes'],
    ['/confidence-building-program-kids', 'Confidence Building'],
    ['/online-english-classes-for-kids', 'Online English Classes'],
    ['/online-english-classes-hyderabad', 'Online English Classes'],
    ['/pricing', 'Pricing'],
    ['/book-demo', 'Free 35-Minute Demo'],
  ];
  for (const [route, signal] of metadataOwners) {
    if (!routeSeo.includes(`'${route}': {`)) failures.push(`route SEO registry missing ${route}`);
    if (!routeSeo.toLowerCase().includes(signal.toLowerCase())) failures.push(`route SEO registry missing metadata signal ${signal}`);
  }
}

if (exists(routeManifestPath)) {
  const manifestModule = await import(`${pathToFileURL(path.join(root, routeManifestPath)).href}?c3=${Date.now()}`);
  const routes = manifestModule.PUBLIC_ROUTE_MANIFEST;
  const expectedOwners = ['/phonics','/best-online-phonics-classes-for-kids-in-india','/phonics-fees-india','/reading-classes-for-kids','/reading-fluency-program','/grammar','/writing-classes-for-kids','/spoken-english-classes-for-kids-online','/speaking','/confidence-building-program-kids','/online-english-classes-for-kids','/online-english-classes-hyderabad','/pricing','/book-demo'];
  for (const owner of expectedOwners) {
    const entry = routes.find((route) => route.path === owner);
    if (!entry) failures.push(`public route manifest missing ${owner}`);
    else {
      if (!entry.indexable) failures.push(`${owner} is not indexable`);
      if (entry.canonicalPath !== owner) failures.push(`${owner} lost self-canonical ownership`);
    }
  }
}

if (failures.length) {
  console.error('Commercial C3 owner-page audit failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Commercial C3 owner-page audit passed: 15 clusters / 14 unique owner pages, owner signals protected or strengthened.');
