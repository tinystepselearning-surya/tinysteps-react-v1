#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const exists = (relativePath) => fs.existsSync(path.join(ROOT, relativePath));

function requireTokens(relativePath, tokens) {
  if (!exists(relativePath)) {
    failures.push(`${relativePath} is missing`);
    return;
  }
  const source = read(relativePath);
  for (const token of tokens) {
    if (!source.includes(token)) failures.push(`${relativePath} missing token: ${token}`);
  }
}

const requiredFiles = [
  'src/lib/commercialC6InternalCommercialPaths.ts',
  'src/tests/seo/commercialC6InternalCommercialPaths.spec.ts',
  'scripts/audit-commercial-c6-r4-internal-paths.mjs',
  'docs/seo/commercial-growth/C6_R4_INTERNAL_COMMERCIAL_PATHS_2026-09-11.md',
];
for (const relativePath of requiredFiles) {
  if (!exists(relativePath)) failures.push(`${relativePath} is missing`);
}

requireTokens('src/lib/commercialC6InternalCommercialPaths.ts', [
  "COMMERCIAL_C6_R4_REVISION = '2026-09-11-c6-r4'",
  "COMMERCIAL_C6_R4_STATUS = 'internal-commercial-paths-validated'",
  "implementationMode: 'validate-existing-links'",
  'ownerCount: 14',
  'requiredDirectAssessmentOwners: 13',
  "singleConversionOwner: '/book-demo'",
  'newCommercialUrlsAllowed: false',
  'c2OwnershipMutationAllowed: false',
  'c4MetadataMutationAllowed: false',
  'c5ConversionOwnerMutationAllowed: false',
  'bodyCopyChangeRequired: false',
  'crossProgrammePricingRule:',
  'conversionSupportRule:',
  "id: 'phonics-comparison-path'",
  "id: 'cross-programme-pricing-path'",
  "id: 'reading-fit-path'",
  "id: 'grammar-writing-fit-path'",
  "id: 'speaking-confidence-fit-path'",
  "id: 'hyderabad-local-path'",
]);

const sourceEdges = [
  ['src/pages/phonics.tsx', ['/book-demo']],
  ['src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx', ['/phonics-fees-india', '/phonics', '/book-demo']],
  ['src/pages/public/PhonicsFeesIndiaPage.tsx', ['/phonics', '/pricing', '/book-demo']],
  ['src/pages/public/ReadingClassesForKidsPage.tsx', ['/reading-fluency-program', '/book-demo']],
  ['src/pages/public/ReadingFluencyProgramPage.tsx', ['/reading-classes-for-kids', '/book-demo']],
  ['src/pages/grammar.tsx', ['/writing-classes-for-kids', '/book-demo']],
  ['src/pages/public/WritingClassesForKidsPage.tsx', ['/grammar', '/book-demo']],
  ['src/pages/public/SpokenEnglishClassesForKidsPage.tsx', ['/speaking', '/book-demo']],
  ['src/pages/speaking.tsx', ['/spoken-english-classes-for-kids-online', '/confidence-building-program-kids', '/book-demo']],
  ['src/pages/public/ConfidenceBuildingProgramKidsPage.tsx', ['/speaking', '/book-demo']],
  ['src/pages/public/OnlineEnglishClassesForKidsPage.tsx', ['/phonics', '/reading-classes-for-kids', '/grammar', '/writing-classes-for-kids', '/spoken-english-classes-for-kids-online', '/speaking', '/book-demo']],
  ['src/pages/public/OnlineEnglishClassesHyderabadPage.tsx', ['/online-english-classes-for-kids', '/book-demo']],
  ['src/pages/PricingPage.tsx', ['/phonics', '/reading-classes-for-kids', '/grammar', '/writing-classes-for-kids', '/spoken-english-classes-for-kids-online', '/speaking', '/book-demo']],
  ['src/pages/public/BookDemoPage.tsx', ['/pricing']],
];

if (sourceEdges.length !== 14) failures.push('C6-R4 source audit must cover exactly 14 commercial owners.');
for (const [sourcePath, destinations] of sourceEdges) {
  requireTokens(sourcePath, destinations);
}

requireTokens('src/lib/commercialC5ConversionFlow.ts', [
  "singleConversionOwner: '/book-demo'",
  'expectedUniqueOwnerPages: 14',
  'directAssessmentEntryPages: 13',
  'bodyCopyChurnDuringC4ControlWindow: false',
]);
requireTokens('src/lib/commercialC4CtrOptimization.ts', [
  "COMMERCIAL_C4_STATUS = 'experiment-governance-armed'",
]);
requireTokens('src/lib/commercialC2KeywordOwnership.ts', [
  "COMMERCIAL_C2_STATUS = 'ownership-complete'",
]);
requireTokens('src/lib/commercialC6ParentDecisionFramework.ts', [
  "COMMERCIAL_C6_R3_STATUS = 'parent-decision-framework-implemented'",
]);

if (failures.length) {
  console.error('Commercial C6-R4 internal commercial path audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Commercial C6-R4 internal commercial path audit passed.');
console.log('All 14 commercial owners remain inside the frozen C2/C3 architecture.');
console.log('All 13 pre-conversion owners retain a direct /book-demo path.');
console.log('Comparison, fees, programme-fit, local-fit and conversion-support handoffs are present in source.');
console.log('General pricing can move directly to assessment when programme fit is unresolved; subject-aware programme handoffs remain available.');
console.log('/book-demo keeps /pricing as its remaining commercial support route without forcing a backward broad-programme detour.');
console.log('No new commercial URL, C2 owner, C4 metadata change or second conversion owner is introduced.');
