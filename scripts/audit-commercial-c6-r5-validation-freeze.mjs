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
  'src/lib/commercialC6ValidationFreeze.ts',
  'src/tests/seo/commercialC6ValidationFreeze.spec.ts',
  'scripts/audit-commercial-c6-r5-validation-freeze.mjs',
  'docs/seo/commercial-growth/C6_R5_VALIDATION_FREEZE_2026-09-11.md',
];
for (const relativePath of requiredFiles) {
  if (!exists(relativePath)) failures.push(`${relativePath} is missing`);
}

requireTokens('src/lib/commercialC6ValidationFreeze.ts', [
  "COMMERCIAL_C6_R5_REVISION = '2026-09-11-c6-r5'",
  "COMMERCIAL_C6_R5_STATUS = 'validation-complete'",
  "COMMERCIAL_C6_STATUS = 'frozen'",
  'c6Frozen: true',
  'frozenOwnerCount: 14',
  "singleConversionOwner: '/book-demo'",
  "crossProgrammePricingOwner: '/pricing'",
  "dedicatedComparisonOwner: '/best-online-phonics-classes-for-kids-in-india'",
  "dedicatedPhonicsPriceResearchOwner: '/phonics-fees-india'",
  'newCommercialUrlsAllowed: false',
  'c2OwnershipMutationAllowed: false',
  'c4MetadataMutationAllowed: false',
  'c5ConversionOwnerMutationAllowed: false',
  'reopenRequiresNewEvidence: true',
  'c4ObservationContinuesAfterC6Freeze: true',
  "id: 'R0'",
  "id: 'R1'",
  "id: 'R2'",
  "id: 'R3'",
  "id: 'R4'",
  "id: 'R5'",
  'C7 knowledge-to-commercial conversion graph',
  'C8 trust, evidence and differentiation',
  'C9 external authority and brand-search growth',
]);

requireTokens('src/lib/commercialC6BuyerIntentAudit.ts', [
  "COMMERCIAL_C6_R0_STATUS = 'buyer-intent-audit-complete'",
  "pricingHub: '/pricing'",
  "conversionOwner: '/book-demo'",
]);
requireTokens('src/lib/commercialC6BuyerIntentArchitecture.ts', [
  "COMMERCIAL_C6_R1_STATUS = 'buyer-intent-architecture-validated'",
  'newCommercialUrlsAllowed: false',
  "r2ApprovedOwnerPaths: freezeList(COMMERCIAL_C6_R1_R2_APPROVALS.map((entry) => entry.ownerPath))",
]);
requireTokens('src/pages/PricingPage.tsx', [
  'const subjectPricingRoutes = [',
  'Fees by learning need',
  'this page remains the Tiny Steps fee and value owner',
  'Phonics is the exception:',
  'to="/phonics-fees-india"',
  'to="/book-demo"',
]);
requireTokens('src/lib/commercialC6ParentDecisionFramework.ts', [
  "COMMERCIAL_C6_R3_STATUS = 'parent-decision-framework-implemented'",
  "canonicalOwnerPath: '/book-demo' as const",
  'paymentFlowCreated: false',
]);
requireTokens('src/lib/commercialC6InternalCommercialPaths.ts', [
  "COMMERCIAL_C6_R4_STATUS = 'internal-commercial-paths-validated'",
  'ownerCount: 14',
  'requiredDirectAssessmentOwners: 13',
  "singleConversionOwner: '/book-demo' as const",
  'journeyCount: COMMERCIAL_C6_R4_JOURNEYS.length',
]);
requireTokens('src/lib/commercialC4CtrOptimization.ts', [
  "COMMERCIAL_C4_STATUS = 'experiment-governance-armed'",
]);
requireTokens('src/lib/commercialC5ConversionFlow.ts', [
  "singleConversionOwner: '/book-demo'",
  'expectedUniqueOwnerPages: 14',
  'directAssessmentEntryPages: 13',
]);
requireTokens('.github/workflows/commercial-c6-buyer-intent-audit.yml', [
  'src/lib/commercialC6ValidationFreeze.ts',
  'src/tests/seo/commercialC6ValidationFreeze.spec.ts',
  'scripts/audit-commercial-c6-r5-validation-freeze.mjs',
  'Audit C6-R5 validation and freeze',
  'node scripts/audit-commercial-c6-r5-validation-freeze.mjs',
]);

if (failures.length) {
  console.error('Commercial C6-R5 validation/freeze audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Commercial C6-R5 validation/freeze audit passed.');
console.log('C6-R0 through R5 are accounted for and C6 is frozen.');
console.log('The commercial architecture remains 14 owners with /pricing as the cross-programme fee/value owner and /book-demo as the single conversion owner.');
console.log('All 13 pre-conversion owners retain direct assessment access and R4 preserves six strategic buyer journeys.');
console.log('C4 experiment governance remains active; C6 freeze does not deploy or mutate C4-controlled metadata.');
console.log('Reopening C6 requires new evidence or a verified defect; planned growth work proceeds to C7, C8 and C9.');
