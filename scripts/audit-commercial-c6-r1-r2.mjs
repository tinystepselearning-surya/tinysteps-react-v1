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
  'src/lib/commercialC6BuyerIntentArchitecture.ts',
  'src/tests/seo/commercialC6BuyerIntentArchitecture.spec.ts',
  'src/tests/seo/commercialC6PricingDecisionSupport.spec.ts',
  'scripts/audit-commercial-c6-r1-r2.mjs',
  'docs/seo/commercial-growth/C6_R1_BUYER_INTENT_ARCHITECTURE_2026-09-11.md',
  'docs/seo/commercial-growth/C6_R2_PRICING_IMPLEMENTATION_2026-09-11.md',
  'src/pages/PricingPage.tsx',
];
for (const relativePath of requiredFiles) {
  if (!exists(relativePath)) failures.push(`${relativePath} is missing`);
}

requireTokens('src/lib/commercialC6BuyerIntentArchitecture.ts', [
  "COMMERCIAL_C6_R1_REVISION = '2026-09-11-c6-r1'",
  "COMMERCIAL_C6_R1_STATUS = 'buyer-intent-architecture-validated'",
  "id: 'phonics-comparison'",
  "canonicalOwnerPath: '/best-online-phonics-classes-for-kids-in-india'",
  "id: 'public-speaking-comparison'",
  "canonicalOwnerPath: '/speaking'",
  "id: 'non-phonics-subject-fees'",
  "canonicalOwnerPath: '/pricing'",
  "id: 'format-value-comparison'",
  "implementationState: 'R2_APPROVED'",
  "ownerPath: '/pricing'",
  'metadataChangeAllowed: false',
  'canonicalChangeAllowed: false',
  'newUrlAllowed: false',
  'newCommercialUrlsAllowed: false',
  'c2OwnershipMutationAllowed: false',
  'c4MetadataMutationAllowed: false',
  'c5ConversionOwnerMutationAllowed: false',
]);

requireTokens('src/pages/PricingPage.tsx', [
  'const subjectPricingRoutes = [',
  "label: 'Reading'",
  "href: '/reading-classes-for-kids'",
  "label: 'Grammar'",
  "href: '/grammar'",
  "label: 'Writing'",
  "href: '/writing-classes-for-kids'",
  "label: 'Spoken English'",
  "href: '/spoken-english-classes-for-kids-online'",
  "label: 'Public Speaking'",
  "href: '/speaking'",
  'Fees by learning need',
  'this page remains the Tiny Steps fee and value owner',
  'Use this pricing page, then check programme fit',
  'Phonics is the exception:',
  'to="/phonics-fees-india"',
  'to="/book-demo"',
]);

// C4-controlled pricing metadata must stay exactly wired to the frozen route
// config while R2 changes body-level decision support only.
requireTokens('src/pages/PricingPage.tsx', [
  "const pricingCanonicalPath = pricingSeo?.canonicalPath ?? '/pricing';",
  "pricingSeo?.title ?? 'Online English Classes for Kids Fees & Pricing | Tiny Steps'",
  'See Tiny Steps online English class fees: standard live 1:1',
  'title={pricingSeoTitle}',
  'description={pricingSeoDescription}',
  'canonical={pricingCanonicalUrl}',
]);

requireTokens('src/lib/commercialC2KeywordOwnership.ts', [
  "id: 'general-pricing'",
  "canonicalOwnerPath: '/pricing'",
  "id: 'phonics-price'",
  "canonicalOwnerPath: '/phonics-fees-india'",
]);
requireTokens('src/lib/commercialC4CtrOptimization.ts', [
  "COMMERCIAL_C4_STATUS = 'experiment-governance-armed'",
]);
requireTokens('src/lib/commercialC5ConversionFlow.ts', [
  "singleConversionOwner: '/book-demo'",
  "ownerPath: '/pricing'",
]);

if (failures.length) {
  console.error('Commercial C6-R1/R2 audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Commercial C6-R1/R2 audit passed.');
console.log('R1 validates the buyer architecture with no new commercial URLs.');
console.log('R2 is limited to subject-aware fee/value decision support on /pricing.');
console.log('C2 ownership, C4 metadata controls, /pricing canonical and the C5 /book-demo conversion owner remain unchanged.');
