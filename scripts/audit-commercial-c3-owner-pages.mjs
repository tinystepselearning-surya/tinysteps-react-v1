#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const failures = [];
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const hasCI = (content, token) => content.toLowerCase().includes(token.toLowerCase());

const c3Path = 'src/lib/commercialC3OwnerPageAudit.ts';
const c2Path = 'src/lib/commercialC2KeywordOwnership.ts';
const routeSeoPath = 'src/lib/routeSeoRegistry.js';
const routeManifestPath = 'src/lib/publicRouteManifest.js';
const vitePath = 'vite.config.js';

for (const required of [c3Path, c2Path, routeSeoPath, routeManifestPath, vitePath]) {
  if (!exists(required)) failures.push(`${required} is missing`);
}

const expectedClusters = [
  'phonics-provider',
  'phonics-comparison',
  'phonics-price',
  'reading-provider',
  'reading-fluency',
  'grammar-provider',
  'writing-provider',
  'spoken-english-provider',
  'public-speaking-provider',
  'communication-provider',
  'confidence-building',
  'broad-english-provider',
  'broad-english-hyderabad',
  'english-tutor-provider',
  'general-pricing',
  'free-demo-booking',
];

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
for (const source of ownerSources) {
  if (!exists(source)) failures.push(`owner source missing: ${source}`);
}

if (exists(c3Path)) {
  const c3 = read(c3Path);
  const rowCount = (c3.match(/audit\(\{ clusterId:/g) || []).length;
  if (rowCount !== 16) failures.push(`expected 16 C3 machine-readable cluster audits, found ${rowCount}`);
  for (const cluster of expectedClusters) {
    if (!c3.includes(`clusterId:'${cluster}'`)) failures.push(`C3 missing cluster audit ${cluster}`);
  }
  for (const token of [
    "COMMERCIAL_C3_REVISION = '2026-09-11-c3-r4'",
    "COMMERCIAL_C3_RECONCILIATION_STATUS = '15-of-15-reconciled'",
    'expectedClusterAudits: 16',
    'expectedUserFacingOwnershipBoundaries: 15',
    'expectedUniqueOwnerPages: 14',
    'countryPagesCreated: 0',
    'aiPromptPagesCreated: 0',
    'sourceLevelFactsRequired: true',
  ]) {
    if (!c3.includes(token)) failures.push(`C3 final contract missing ${JSON.stringify(token)}`);
  }
  if (c3.includes("needs-strengthening'")) {
    failures.push('C3 final contract still contains needs-strengthening status');
  }
}

if (exists(c2Path)) {
  const c2 = read(c2Path);
  if (!c2.includes("COMMERCIAL_C2_STATUS = 'ownership-complete'")) failures.push('C2 ownership is not complete');
}

const sourceSignals = {
  'src/pages/phonics.tsx': ['Online Phonics Classes for Kids', '/best-online-phonics-classes-for-kids-in-india', '/phonics-fees-india'],
  'src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx': ['Best Online Phonics Classes for Kids in India', '/phonics-fees-india'],
  'src/pages/public/PhonicsFeesIndiaPage.tsx': ['Phonics Class Fees in India', 'PHONICS_FEES_INDIA_RESEARCH', '/best-online-phonics-classes-for-kids-in-india'],
  'src/pages/public/ReadingClassesForKidsPage.tsx': ['Online Reading Classes for Kids', '/reading-fluency-program', '/writing-classes-for-kids'],
  'src/pages/public/ReadingFluencyProgramPage.tsx': ['Reading Fluency Classes for Kids Online', '/reading-classes-for-kids'],
  'src/pages/grammar.tsx': ['Online Grammar Classes for Kids', '/writing-classes-for-kids', '/spoken-english-classes-for-kids-online'],
  'src/pages/public/WritingClassesForKidsPage.tsx': ['Creative Writing Classes for Kids Online', '/grammar'],
  'src/pages/public/SpokenEnglishClassesForKidsPage.tsx': ['Spoken English Classes for Kids Online', '/speaking', '/confidence-building-program-kids'],
  'src/pages/speaking.tsx': ['Public Speaking & Communication Classes for Kids', '/spoken-english-classes-for-kids-online', '/confidence-building-program-kids'],
  'src/pages/public/ConfidenceBuildingProgramKidsPage.tsx': ['Confidence Building Classes for Kids', '/speaking', '/shy-child-speaking-confidence'],
  'src/pages/public/OnlineEnglishClassesForKidsPage.tsx': ['Online English Classes for Kids', 'online English tutor for kids', '1 to 1 English tutor for kids online', '/online-english-classes-hyderabad'],
  'src/pages/public/OnlineEnglishClassesHyderabadPage.tsx': ['Online English Classes for Kids in Hyderabad', '/online-english-classes-for-kids'],
  'src/pages/PricingPage.tsx': ['Online English Classes for Kids: Fees & Pricing', 'OfferCatalog', '/phonics-fees-india'],
  'src/pages/public/BookDemoPage.tsx': ['Free 35-Minute 1:1 English Assessment', 'programmeRoutes', 'multi-class free trial'],
};
for (const [file, tokens] of Object.entries(sourceSignals)) {
  if (!exists(file)) continue;
  const content = read(file);
  for (const token of tokens) {
    if (!hasCI(content, token)) failures.push(`${file} missing final owner signal ${JSON.stringify(token)}`);
  }
  if (content.includes('35–40')) failures.push(`${file} still contains stale 35–40 wording`);
}

if (exists(vitePath)) {
  const vite = read(vitePath);
  for (const obsoleteRewrite of [
    "id.includes('/src/pages/public/OnlineEnglishClassesForKidsPage.tsx')",
    "id.includes('/src/pages/public/PhonicsFeesIndiaPage.tsx')",
    "id.includes('/src/pages/public/ReadingClassesForKidsPage.tsx')",
    "id.includes('/src/pages/phonics.tsx')",
  ]) {
    if (vite.includes(obsoleteRewrite)) failures.push(`obsolete owner-specific Vite rewrite remains: ${obsoleteRewrite}`);
  }
}

if (exists('src/pages/PricingPage.tsx')) {
  const pricing = read('src/pages/PricingPage.tsx');
  for (const required of ['ONE_TO_ONE_MONTHLY_PACKAGES', 'GROUP_MONTHLY_FEES', 'ULTRA_PREMIUM_PRICING', "'@type': 'OfferCatalog'", '/phonics-fees-india']) {
    if (!pricing.includes(required)) failures.push(`pricing owner missing ${JSON.stringify(required)}`);
  }
  for (const forbidden of [
    'Optional Game Subscriptions',
    'Daily AI reading/speaking coach prompts',
    'Monthly parent Q&A call',
    'we’ll arrange it',
    'We set up 2-month or 3-month payment splits for most families.',
  ]) {
    if (pricing.includes(forbidden)) failures.push(`pricing owner retains unsupported promise ${JSON.stringify(forbidden)}`);
  }
}

if (exists('src/pages/public/BookDemoPage.tsx')) {
  const demo = read('src/pages/public/BookDemoPage.tsx');
  for (const required of ['programmeRoutes', "areaServed: ['India', 'Worldwide']", 'Is the free demo a multi-class free trial?', '/confidence-building-program-kids']) {
    if (!demo.includes(required)) failures.push(`demo owner missing ${JSON.stringify(required)}`);
  }
  for (const forbidden of ['No credit card required', 'Takes less than a minute', "availability: 'https://schema.org/InStock'"]) {
    if (demo.includes(forbidden)) failures.push(`demo owner retains unsupported claim ${JSON.stringify(forbidden)}`);
  }
}

if (exists(routeSeoPath)) {
  const routeSeoModule = await import(`${pathToFileURL(path.join(root, routeSeoPath)).href}?c3seo=${Date.now()}`);
  const registry = routeSeoModule.ROUTE_SEO_REGISTRY;
  const metadataOwners = [
    ['/phonics', 'Online Phonics Classes for Kids'],
    ['/best-online-phonics-classes-for-kids-in-india', 'Best Online Phonics Classes for Kids in India'],
    ['/phonics-fees-india', 'Phonics Class Fees in India'],
    ['/reading-classes-for-kids', 'Online Reading Classes for Kids'],
    ['/reading-fluency-program', 'Reading Fluency Classes for Kids Online'],
    ['/grammar', 'Online Grammar Classes for Kids'],
    ['/writing-classes-for-kids', 'Creative Writing Classes for Kids Online'],
    ['/spoken-english-classes-for-kids-online', 'Spoken English Classes for Kids Online'],
    ['/speaking', 'Public Speaking & Communication Classes for Kids'],
    ['/confidence-building-program-kids', 'Confidence Building Classes for Kids'],
    ['/online-english-classes-for-kids', 'Online English Classes for Kids'],
    ['/online-english-classes-hyderabad', 'Online English Classes for Kids in Hyderabad'],
    ['/pricing', 'Online English Classes for Kids Fees & Pricing'],
    ['/book-demo', 'Free 35-Minute 1:1 English Assessment'],
  ];
  for (const [route, titleSignal] of metadataOwners) {
    const entry = registry?.[route];
    if (!entry) {
      failures.push(`route SEO registry missing ${route}`);
      continue;
    }
    if (entry.canonicalPath !== route) failures.push(`${route} route SEO canonical mismatch: ${entry.canonicalPath}`);
    if (!hasCI(String(entry.title || ''), titleSignal)) failures.push(`${route} title missing ${JSON.stringify(titleSignal)}: ${entry.title}`);
  }
}

if (exists(routeManifestPath)) {
  const manifestModule = await import(`${pathToFileURL(path.join(root, routeManifestPath)).href}?c3manifest=${Date.now()}`);
  const routes = manifestModule.PUBLIC_ROUTE_MANIFEST;
  const expectedOwners = [
    '/phonics',
    '/best-online-phonics-classes-for-kids-in-india',
    '/phonics-fees-india',
    '/reading-classes-for-kids',
    '/reading-fluency-program',
    '/grammar',
    '/writing-classes-for-kids',
    '/spoken-english-classes-for-kids-online',
    '/speaking',
    '/confidence-building-program-kids',
    '/online-english-classes-for-kids',
    '/online-english-classes-hyderabad',
    '/pricing',
    '/book-demo',
  ];
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
  console.error('Commercial C3 final owner-page reconciliation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Commercial C3 final reconciliation passed: 16 machine-readable clusters / 15 user-facing boundaries / 14 unique owner pages.');
