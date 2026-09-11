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

for (const relativePath of [
  'src/lib/commercialC6ParentDecisionFramework.ts',
  'src/tests/seo/commercialC6ParentDecisionFramework.spec.ts',
  'scripts/audit-commercial-c6-r3-parent-decision.mjs',
  'docs/seo/commercial-growth/C6_R3_PARENT_DECISION_FRAMEWORK_2026-09-11.md',
  'src/pages/public/BookDemoPage.tsx',
]) {
  if (!exists(relativePath)) failures.push(`${relativePath} is missing`);
}

requireTokens('src/lib/commercialC6ParentDecisionFramework.ts', [
  "COMMERCIAL_C6_R3_REVISION = '2026-09-11-c6-r3'",
  "COMMERCIAL_C6_R3_STATUS = 'parent-decision-framework-implemented'",
  "id: 'assessment-and-programme-fit'",
  "id: 'teacher-and-trial-fit'",
  "id: 'class-structure-and-outcomes'",
  "id: 'practical-fit'",
  "id: 'progress-expectations'",
  "canonicalOwnerPath: '/book-demo'",
  'newCommercialUrlsAllowed: false',
  'c2OwnershipMutationAllowed: false',
  'c4MetadataMutationAllowed: false',
  'c5ConversionOwnerMutationAllowed: false',
  'operatingPriorsMayBePresentedAsMeasuredData: false',
  'bodyCopyChangeRequired: false',
]);

requireTokens('src/pages/public/BookDemoPage.tsx', [
  'What Happens in the Demo Assessment?',
  'What Can the Assessment Recommend?',
  'What Will You Understand After the Assessment?',
  'Before You Enrol',
  'Which learning path is being recommended?',
  'Where should your child begin?',
  'Is the suitable option live 1:1 or an available small group?',
  'What does the recommended format currently cost?',
  'available timings',
  'Watch Class Samples',
  'View Pricing',
  'individual learning progress varies',
]);

requireTokens('src/lib/commercialC5ConversionFlow.ts', [
  "singleConversionOwner: '/book-demo'",
  "ownerPath: '/book-demo'",
  "stage: 'conversion'",
]);

requireTokens('src/lib/commercialC4CtrOptimization.ts', [
  "COMMERCIAL_C4_STATUS = 'experiment-governance-armed'",
]);

requireTokens('src/lib/commercialC1InternationalAiResearch.ts', [
  "id:'ai-global-demo-to-enrol'",
  "id:'ai-global-phonics-enrol'",
  "id:'ai-global-speaking-enrol'",
  "trackingStatus: 'not-systematically-measured'",
]);

const bookDemo = read('src/pages/public/BookDemoPage.tsx');
if (bookDemo.includes('33.3%') || bookDemo.includes('one enrolment is expected for every three')) {
  failures.push('/book-demo must not present the declared demo-to-enrolment heuristic as measured performance');
}

if (failures.length) {
  console.error('Commercial C6-R3 audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Commercial C6-R3 parent decision framework audit passed.');
console.log('Five post-demo decision gates are accounted for on the existing /book-demo conversion owner.');
console.log('No new commercial URL, C2 ownership change, C4 metadata change, payment flow or second conversion owner was introduced.');
console.log('Declared C1 funnel priors remain planning heuristics and are not presented as measured performance.');
