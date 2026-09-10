#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const REPORT = process.argv.includes('--report');
const failures = [];
const evidence = {
  brick: 'C0',
  revision: '2026-09-10-c0',
  purpose: 'Revenue Measurement + Commercial Facts',
  checkedAt: new Date().toISOString(),
  checks: {},
};

const read = (relativePath) => {
  const fullPath = path.join(ROOT, relativePath);
  if (!fs.existsSync(fullPath)) {
    failures.push(`${relativePath} is missing`);
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
};

const requireTokens = (relativePath, tokens) => {
  const text = read(relativePath);
  const missing = tokens.filter((token) => !text.includes(token));
  if (missing.length) {
    missing.forEach((token) => failures.push(`${relativePath} missing ${JSON.stringify(token)}`));
  }
  evidence.checks[relativePath] = {
    present: Boolean(text),
    requiredTokenCount: tokens.length,
    missing,
  };
  return text;
};

const c0 = requireTokens('src/lib/commercialC0Foundation.ts', [
  "COMMERCIAL_C0_REVISION = '2026-09-10-c0'",
  "COMMERCIAL_C0_STATUS = 'frozen'",
  "commercialFacts: 'src/config/semanticFacts.ts'",
  "leadLifecycle: 'functions/src/leadLifecycle.ts'",
  "primaryKpi: 'qualified_organic_leads_per_day'",
  'minPerDay: 6',
  'maxPerDay: 7',
  'minPerDay: 11',
  'maxPerDay: 12',
  "kind: 'declared planning baseline'",
  "countingUnit: 'distinct canonical lead record'",
  "timezone: 'Asia/Kolkata'",
  "primaryChannel: 'organic_search'",
  "aiReferralPolicy: 'report-separately'",
  "unattributedPolicy: 'do-not-backfill-as-organic'",
  "ga4Role: 'traffic-and-funnel-corroboration-not-lead-qualification'",
  "commercialKeywordResearchBeginsAt: 'C1'",
  "canonicalCommercialOwnershipBeginsAt: 'C2'",
  'pageOptimizationAllowed: false',
  'newCommercialUrlsAllowed: false',
  'newInformationalUrlsAllowed: false',
]);

requireTokens('src/config/semanticFacts.ts', [
  'SEMANTIC_FACTS_VERSION',
  'coreAgeMin: 3',
  'coreAgeMax: 12',
  'STANDARD_ONE_TO_ONE_DURATION_MINUTES = 35',
  'FREE_ASSESSMENT_DURATION_MINUTES = 35',
  'FREE_ASSESSMENT_PRICE_INR = 0',
  'standardOneToOnePerClassInr: PER_CLASS_PRICE',
  "commercialPath: '/phonics'",
  "commercialPath: '/grammar'",
  "commercialPath: '/speaking'",
]);

requireTokens('src/config/pricing.ts', [
  'PER_CLASS_PRICE = 400',
  "{ id: 'starter', classes: 12, monthlyFee: 4800, durationMinutes: 35 }",
  'GROUP_MONTHLY_FEES',
]);

requireTokens('src/lib/conversionTracking.ts', [
  "LEAD_ATTRIBUTION_STORAGE_KEY = 'ts_lead_attribution_v1'",
  'landingPage',
  'firstSeenAt',
  'referrerDomain',
  'utmSource',
  'utmMedium',
  'utmCampaign',
  'gclid',
  'fbclid',
  'msclkid',
  'buildLeadAttributionPayload',
  "trackEvent('lead_form_submit'",
  "trackEvent('generate_lead'",
  "trackEvent('book_demo_click'",
  "trackEvent('whatsapp_click'",
]);

requireTokens('src/lib/analytics.ts', [
  "location.hostname !== 'tinystepslearning.com'",
  'isPublicAnalyticsPath(location.pathname)',
  "window.gtag('event', 'page_view'",
]);

const lifecycle = requireTokens('functions/src/leadLifecycle.ts', [
  "| 'qualified'",
  "| 'demo_pending_schedule'",
  "| 'demo_booked'",
  "| 'demo_completed'",
  "| 'admission_follow_up'",
  "| 'admitted_confirmed'",
  "| 'not_interested'",
  "| 'wrong_fit'",
  "| 'no_response'",
  "| 'lost'",
]);

requireTokens('src/lib/knowledgeBaseFinalClosure.js', [
  "KNOWLEDGE_BASE_FINAL_STATUS = 'frozen'",
  "commercialSeoExpansion: 'separate-project'",
]);

const requiredC0Files = [
  '.github/workflows/commercial-c0-revenue-measurement-facts.yml',
  'docs/seo/commercial-growth/C0_REVENUE_MEASUREMENT_COMMERCIAL_FACTS.md',
  'scripts/audit-commercial-c0-foundation.mjs',
  'src/lib/commercialC0Foundation.ts',
  'src/tests/seo/commercialC0Foundation.spec.ts',
];
for (const relativePath of requiredC0Files) {
  if (!fs.existsSync(path.join(ROOT, relativePath))) failures.push(`${relativePath} is missing`);
}
evidence.checks.c0Files = { expected: requiredC0Files, allPresent: requiredC0Files.every((file) => fs.existsSync(path.join(ROOT, file))) };

const qualifyingStatuses = [
  'qualified',
  'demo_pending_schedule',
  'demo_booked',
  'demo_completed',
  'admission_follow_up',
  'admitted_confirmed',
];
for (const status of qualifyingStatuses) {
  if (!c0.includes(`'${status}'`)) failures.push(`C0 qualification registry missing ${status}`);
  if (!lifecycle.includes(`'${status}'`)) failures.push(`lead lifecycle missing ${status}`);
}

evidence.checks.qualification = {
  sourceOfTruth: 'functions/src/leadLifecycle.ts',
  qualifyingStatuses,
  eventSubmissionIsQualification: false,
};

const forbiddenC0Tokens = [
  'primaryKeyword:',
  'secondaryKeyword:',
  'keywordCluster:',
  'titleRewrite:',
  'h1Rewrite:',
  'newCommercialOwner:',
];
for (const token of forbiddenC0Tokens) {
  if (c0.includes(token)) failures.push(`C0 crossed into C1/C2 implementation: ${token}`);
}

evidence.checks.scope = {
  pageOptimizationAllowed: false,
  keywordResearchBeginsAt: 'C1',
  ownerAssignmentBeginsAt: 'C2',
  forbiddenTokensFound: forbiddenC0Tokens.filter((token) => c0.includes(token)),
};

try {
  const changed = execFileSync('git', ['diff', '--name-only', 'origin/main...HEAD'], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
    .split('\n')
    .map((value) => value.trim())
    .filter(Boolean);
  const unexpected = changed.filter((file) => !requiredC0Files.includes(file));
  if (unexpected.length) {
    unexpected.forEach((file) => failures.push(`C0 scope violation: unexpected changed file ${file}`));
  }
  evidence.checks.changedFiles = { changed, unexpected };
} catch {
  evidence.checks.changedFiles = {
    skipped: true,
    reason: 'origin/main comparison unavailable in this execution environment',
  };
}

const reportPath = path.join(ROOT, 'artifacts', 'commercial-c0-foundation.json');
const result = {
  ...evidence,
  status: failures.length ? 'failed' : 'passed',
  failures,
};

if (REPORT) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(result, null, 2)}\n`);
}

if (failures.length) {
  console.error(`Commercial C0 audit failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Commercial C0 audit passed.');
console.log('Qualified organic lead = distinct qualifying lead lifecycle record + stored first-touch organic-search attribution.');
console.log('GA4 CTA/form events remain diagnostic signals, not qualification.');
if (REPORT) console.log(`Evidence: ${path.relative(ROOT, reportPath)}`);
