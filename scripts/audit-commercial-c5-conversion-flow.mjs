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
  'src/lib/commercialC5ConversionFlow.ts',
  'src/lib/commercialC5Tracking.ts',
  'src/tests/seo/commercialC5ConversionFlow.spec.ts',
  'scripts/audit-commercial-c5-conversion-flow.mjs',
  'docs/seo/commercial-growth/C5_COMMERCIAL_CRO_DECISION_FLOW_2026-09-11.md',
  '.github/workflows/commercial-c5-cro-decision-flow.yml',
];
for (const relativePath of requiredFiles) {
  if (!exists(relativePath)) failures.push(`${relativePath} is missing`);
}

requireTokens('src/lib/commercialC5ConversionFlow.ts', [
  "COMMERCIAL_C5_REVISION = '2026-09-11-c5-r1'",
  "COMMERCIAL_C5_STATUS = 'decision-flow-implemented'",
  'expectedUniqueOwnerPages: 14',
  'directAssessmentEntryPages: 13',
  "singleConversionOwner: '/book-demo'",
  'newCommercialUrlsAllowed: false',
  'c2OwnershipMutationAllowed: false',
  'c3CommercialFactDriftAllowed: false',
  'c4MetadataMutationAllowed: false',
  'directPaymentFromCommercialOwnerAllowed: false',
  'bodyCopyChurnDuringC4ControlWindow: false',
  'primaryKpi: COMMERCIAL_C0_MEASUREMENT.primaryKpi',
  "ownerView: 'commercial_owner_view'",
  "decisionClick: 'commercial_decision_click'",
  "kind: 'assessment-submit-attempt'",
  'resolveCommercialC5Decision',
]);

requireTokens('src/lib/commercialC5Tracking.ts', [
  "trackEvent('commercial_owner_view'",
  "trackEvent('commercial_decision_click'",
  'owner_stage:',
  'owner_priority:',
  'decision_kind:',
  'decision_alignment:',
  'landing_page:',
]);

requireTokens('src/components/common/ConversionTracker.tsx', [
  'isCommercialC5OwnerPath',
  'trackCommercialC5OwnerView',
  'trackCommercialC5DecisionClick',
  'const isCommercialOwner = isCommercialC5OwnerPath(pagePath);',
  'const isMeasuredLanding = isFunnelLandingPath(pagePath) || isCommercialOwner;',
  "source_context: 'conversion_tracker'",
]);

requireTokens('src/components/forms/PublicAssessmentForm.tsx', [
  'trackLeadFormView',
  'trackLeadFormStart',
  'trackLeadFormSubmit',
  'trackGenerateLead',
  'trackDemoBookingComplete',
]);

requireTokens('src/lib/commercialC0Foundation.ts', ["COMMERCIAL_C0_STATUS = 'frozen'"]);
requireTokens('src/lib/commercialC2KeywordOwnership.ts', ["COMMERCIAL_C2_STATUS = 'ownership-complete'"]);
requireTokens('src/lib/commercialC3OwnerPageAudit.ts', ["COMMERCIAL_C3_STATUS = 'implementation-complete'"]);
requireTokens('src/lib/commercialC4CtrOptimization.ts', ["COMMERCIAL_C4_STATUS = 'experiment-governance-armed'"]);

const ownerSources = [
  ['/phonics', 'src/pages/phonics.tsx'],
  ['/best-online-phonics-classes-for-kids-in-india', 'src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx'],
  ['/phonics-fees-india', 'src/pages/public/PhonicsFeesIndiaPage.tsx'],
  ['/reading-classes-for-kids', 'src/pages/public/ReadingClassesForKidsPage.tsx'],
  ['/reading-fluency-program', 'src/pages/public/ReadingFluencyProgramPage.tsx'],
  ['/grammar', 'src/pages/grammar.tsx'],
  ['/writing-classes-for-kids', 'src/pages/public/WritingClassesForKidsPage.tsx'],
  ['/spoken-english-classes-for-kids-online', 'src/pages/public/SpokenEnglishClassesForKidsPage.tsx'],
  ['/speaking', 'src/pages/speaking.tsx'],
  ['/confidence-building-program-kids', 'src/pages/public/ConfidenceBuildingProgramKidsPage.tsx'],
  ['/online-english-classes-for-kids', 'src/pages/public/OnlineEnglishClassesForKidsPage.tsx'],
  ['/online-english-classes-hyderabad', 'src/pages/public/OnlineEnglishClassesHyderabadPage.tsx'],
  ['/pricing', 'src/pages/PricingPage.tsx'],
  ['/book-demo', 'src/pages/public/BookDemoPage.tsx'],
];

if (ownerSources.length !== 14) failures.push('C5 source audit must cover exactly 14 unique owner pages');

const c5Source = exists('src/lib/commercialC5ConversionFlow.ts')
  ? read('src/lib/commercialC5ConversionFlow.ts')
  : '';
for (const [ownerPath, sourcePath] of ownerSources) {
  if (!c5Source.includes(`ownerPath: '${ownerPath}'`)) {
    failures.push(`C5 flow missing owner ${ownerPath}`);
  }
  if (!exists(sourcePath)) {
    failures.push(`${sourcePath} is missing for ${ownerPath}`);
    continue;
  }

  const source = read(sourcePath);
  if (ownerPath === '/book-demo') {
    if (!source.includes('PublicAssessmentForm')) {
      failures.push('/book-demo must keep PublicAssessmentForm as its conversion surface');
    }
    if (!source.includes('assessment-form')) {
      failures.push('/book-demo must keep the assessment-form anchor/surface');
    }
  } else if (!/["']\/book-demo(?:[?#"']|$)/.test(source)) {
    failures.push(`${ownerPath} must keep a direct /book-demo path in ${sourcePath}`);
  }
}

const c0Source = exists('src/lib/commercialC0Foundation.ts') ? read('src/lib/commercialC0Foundation.ts') : '';
if (!c0Source.includes('Traffic, CTA and form events are diagnostic funnel signals')) {
  failures.push('C0 diagnostic-vs-qualified-lead rule is missing');
}

const c4Source = exists('src/lib/commercialC4CtrOptimization.ts') ? read('src/lib/commercialC4CtrOptimization.ts') : '';
if (!c4Source.includes("COMMERCIAL_C4_STATUS = 'experiment-governance-armed'")) {
  failures.push('C4 control governance is not armed');
}

if (failures.length) {
  console.error('Commercial C5 CRO decision-flow audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Commercial C5 CRO decision-flow audit passed.');
console.log('14 C2/C3 commercial owners are covered by one measured decision system.');
console.log('13 pre-conversion owners retain a direct /book-demo path; /book-demo remains the single assessment conversion owner.');
console.log('C5 owner-view and decision-click events remain diagnostic; qualified organic leads still use C0 canonical lifecycle + first-touch attribution.');
console.log('C2 ownership, C3 facts and the active C4 metadata control window remain protected.');
