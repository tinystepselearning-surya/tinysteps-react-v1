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
  'src/lib/commercialC6BuyerIntentAudit.ts',
  'src/tests/seo/commercialC6BuyerIntentAudit.spec.ts',
  'scripts/audit-commercial-c6-buyer-intent.mjs',
  'docs/seo/commercial-growth/C6_R0_BUYER_INTENT_AUDIT_2026-09-11.md',
  '.github/workflows/commercial-c6-buyer-intent-audit.yml',
];
for (const relativePath of requiredFiles) {
  if (!exists(relativePath)) failures.push(`${relativePath} is missing`);
}

requireTokens('src/lib/commercialC6BuyerIntentAudit.ts', [
  "COMMERCIAL_C6_R0_REVISION = '2026-09-11-c6-r0'",
  "COMMERCIAL_C6_R0_STATUS = 'buyer-intent-audit-complete'",
  "path: '/best-online-phonics-classes-for-kids-in-india'",
  "path: '/phonics-fees-india'",
  "path: '/pricing'",
  "pricingHub: '/pricing'",
  "conversionOwner: '/book-demo'",
  'auditOnly: true',
  'livePageCopyChangesAllowed: false',
  'titleChangesAllowed: false',
  'metaDescriptionChangesAllowed: false',
  'canonicalChangesAllowed: false',
  'newCommercialUrlsAllowed: false',
  'c2OwnershipMutationAllowed: false',
  'c4ControlMutationAllowed: false',
  'c5ConversionOwnerMutationAllowed: false',
]);

requireTokens('src/lib/commercialC2KeywordOwnership.ts', [
  "id: 'phonics-comparison'",
  "canonicalOwnerPath: '/best-online-phonics-classes-for-kids-in-india'",
  "id: 'phonics-price'",
  "canonicalOwnerPath: '/phonics-fees-india'",
  "id: 'general-pricing'",
  "canonicalOwnerPath: '/pricing'",
  "id: 'free-demo-booking'",
  "canonicalOwnerPath: '/book-demo'",
]);

requireTokens('src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx', [
  'const decisionGates = [',
  'const comparisonFormats = [',
  'const providerScorecard = [',
  'const demoQuestions = [',
  'const redFlags = [',
  "href: '/phonics-fees-india'",
  "href: '/book-demo'",
]);

requireTokens('src/pages/public/PhonicsFeesIndiaPage.tsx', [
  'const comparisonChecks = [',
  'Market pricing research',
  'Compare 1:1 and group phonics fees separately',
  "to=\"/book-demo\"",
  'PHONICS_FEES_INDIA_RESEARCH',
]);

requireTokens('src/pages/PricingPage.tsx', [
  'Fees, packages & value comparison',
  'Should I choose 1:1 or a small group based only on price?',
  'Where can I compare phonics fees in India?',
  "to=\"/book-demo\"",
  'offerCatalog',
]);

requireTokens('src/lib/commercialC4CtrOptimization.ts', [
  "COMMERCIAL_C4_STATUS = 'experiment-governance-armed'",
]);
requireTokens('src/lib/commercialC5ConversionFlow.ts', [
  "COMMERCIAL_C5_STATUS = 'decision-flow-implemented'",
  "singleConversionOwner: '/book-demo'",
  'newCommercialUrlsAllowed: false',
]);

if (failures.length) {
  console.error('Commercial C6-R0 buyer-intent audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Commercial C6-R0 buyer-intent audit passed.');
console.log('Baseline owner architecture remains unchanged: one phonics comparison owner, one phonics fee-research owner, /pricing as the cross-programme fee/value hub, and /book-demo as the conversion owner.');
console.log('C6-R0 is audit-only: no titles, descriptions, canonicals, live owner-page copy, ownership, or new commercial URLs are changed.');
console.log('Non-phonics comparison and subject-fee opportunities remain evidence-gated for C6-R1+ rather than being turned into thin pages.');
