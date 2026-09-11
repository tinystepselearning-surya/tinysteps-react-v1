#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const read = (relative) => {
  const full = path.join(root, relative);
  if (!fs.existsSync(full)) {
    failures.push(`${relative} is missing`);
    return '';
  }
  return fs.readFileSync(full, 'utf8');
};

const c2Path = 'src/lib/commercialC2KeywordOwnership.ts';
const c2 = read(c2Path);
const c1 = read('src/lib/commercialC1SearchUniverse.ts');
const c1International = read('src/lib/commercialC1InternationalAiResearch.ts');
const c1Observed = read('src/lib/commercialC1ObservedSearchEvidence.ts');
const routes = read('src/lib/publicRouteManifest.js');
const canonical = read('src/lib/canonicalTopicOwnershipRegistry.js');

for (const required of [
  "COMMERCIAL_C2_STATUS = 'ownership-complete'",
  "implementationBeginsAt: 'C3'",
  'newCountryOwnersCreated: 0',
  "canonicalOwnerPath: '/phonics'",
  "canonicalOwnerPath: '/best-online-phonics-classes-for-kids-in-india'",
  "canonicalOwnerPath: '/phonics-fees-india'",
  "canonicalOwnerPath: '/reading-classes-for-kids'",
  "canonicalOwnerPath: '/grammar'",
  "canonicalOwnerPath: '/writing-classes-for-kids'",
  "canonicalOwnerPath: '/spoken-english-classes-for-kids-online'",
  "canonicalOwnerPath: '/speaking'",
  "canonicalOwnerPath: '/online-english-classes-for-kids'",
  "canonicalOwnerPath: '/online-english-classes-hyderabad'",
  "canonicalOwnerPath: '/pricing'",
  "canonicalOwnerPath: '/book-demo'",
  "path:'/public-speaking-communication-kids', action:'CONSOLIDATE_TO_OWNER'",
  "path:'/english-grammar-writing-classes', action:'DEMOTE_TO_SUPPORT'",
  "path:'/online-english-classes-for-kids-india', action:'CONSOLIDATED_REDIRECT'",
]) {
  if (!c2.includes(required)) failures.push(`C2 registry missing ${JSON.stringify(required)}`);
}

for (const forbidden of [
  'publicPageChangesInC2: true',
  'titleChangesInC2: true',
  'h1ChangesInC2: true',
  'copyChangesInC2: true',
  'redirectChangesInC2: true',
  'newCommercialUrlsInC2: true',
  'aiPromptPagesAllowed: true',
  'countryPagesAllowed: true',
]) {
  if (c2.includes(forbidden)) failures.push(`C2 implementation leakage: ${forbidden}`);
}

if (!c1.includes("COMMERCIAL_C1_STATUS = 'research-complete'")) failures.push('C1 base research is not complete');
if (!c1International.includes("COMMERCIAL_C1_ENHANCEMENT_STATUS = 'research-complete'")) failures.push('C1 international/AI research is not complete');
if (!c1Observed.includes("COMMERCIAL_C1_OBSERVED_EVIDENCE_STATUS = 'evidence-complete'")) failures.push('C1 observed Google/Bing evidence is not complete');

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
  if (!routes.includes(`route('${owner}'`)) failures.push(`C2 owner is not an indexable public route: ${owner}`);
}

if (!routes.includes("{ source: '/online-english-classes-for-kids-india', destination: '/online-english-classes-for-kids', status: 301 }")) {
  failures.push('Historical India broad-English duplicate is not preserved as a 301 to the core owner');
}

for (const frozenOwnership of [
  "ownerPath: '/phonics'",
  "ownerPath: '/grammar'",
  "ownerPath: '/writing-classes-for-kids'",
  "ownerPath: '/speaking'",
  "ownerPath: '/spoken-english-classes-for-kids-online'",
  "ownerPath: '/book-demo'",
]) {
  if (!canonical.includes(frozenOwnership)) failures.push(`C2 conflicts with frozen KB ownership: ${frozenOwnership}`);
}

const requiredFiles = [
  'src/lib/commercialC2KeywordOwnership.ts',
  'src/tests/seo/commercialC2KeywordOwnership.spec.ts',
  'scripts/audit-commercial-c2-keyword-ownership.mjs',
  'docs/seo/commercial-growth/C2_CANONICAL_COMMERCIAL_KEYWORD_OWNERSHIP.md',
  '.github/workflows/commercial-c2-keyword-ownership.yml',
];
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`${file} is missing`);
}

if (failures.length) {
  console.error('Commercial C2 keyword-ownership audit failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Commercial C2 keyword-ownership audit passed.');
