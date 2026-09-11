#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const evidencePath = path.join(root, 'src/lib/commercialC1ObservedSearchEvidence.ts');
const internationalPath = path.join(root, 'src/lib/commercialC1InternationalCoreSubjectCompletion.ts');
const basePath = path.join(root, 'src/lib/commercialC1SearchUniverse.ts');
const failures = [];

for (const required of [evidencePath, internationalPath, basePath]) {
  if (!fs.existsSync(required)) failures.push(`${path.relative(root, required)} is missing`);
}

if (fs.existsSync(evidencePath)) {
  const text = fs.readFileSync(evidencePath, 'utf8');
  const requiredTokens = [
    "COMMERCIAL_C1_OBSERVED_EVIDENCE_STATUS = 'evidence-complete'",
    "observedFrom: '2026-06-09'",
    "observedThrough: '2026-09-08'",
    'queryRows: 1000',
    'clicks: 6612',
    'impressions: 107515',
    "family:'phonics', queryRows:103, impressions:7604, clicks:124",
    "query:'best online phonics classes in india with fees', clicks:11, impressions:117, ctr:0.094, position:2.72",
    "path:'/phonics', clicks:371, impressions:11306, ctr:0.0328, position:4.86",
    "country:'United States', clicks:1587, impressions:26641",
    "country:'United Arab Emirates', clicks:104, impressions:1700",
    'keywordRows: 830',
    'pageRows: 59',
    'groundingQueryRows: 31',
    'aiPageRows: 71',
    "source:'bing-ai', query:'online phonics classes'",
    'citations:24, citationShare:0.2034',
    "path:'/phonics', clicks:null, impressions:null, ctr:null, position:null, citations:120",
    "googleQueryLevelEvidence: 'available-from-user-export'",
    "bingKeywordEvidence: 'available-from-user-export'",
    "bingAiGroundingEvidence: 'available-from-user-export'",
    "conversionEvidence: 'declared-operating-priors-only'",
    "ownershipDecision: 'deferred-to-C2'",
    'publicImplementationAllowed: false',
  ];
  for (const token of requiredTokens) {
    if (!text.includes(token)) failures.push(`Observed evidence missing ${JSON.stringify(token)}`);
  }

  for (const forbidden of ['canonicalOwner:', 'ownerPath:', 'publicImplementationAllowed: true']) {
    if (text.includes(forbidden)) failures.push(`Observed evidence contains forbidden C2/implementation token ${JSON.stringify(forbidden)}`);
  }

  if (!text.includes("reportPeriod: null")) failures.push('Bing report period must remain unknown rather than guessed.');
  if (!text.includes('Do not sum family totals into a site total.')) failures.push('Commercial family overlap warning is missing.');
}

if (fs.existsSync(internationalPath)) {
  const text = fs.readFileSync(internationalPath, 'utf8');
  if (!text.includes('COMMERCIAL_C1_INTERNATIONAL_COMPLETE_QUERY_COUNT = 66')) failures.push('International C1 matrix is not complete at 66 queries.');
}

if (fs.existsSync(basePath)) {
  const text = fs.readFileSync(basePath, 'utf8');
  if (!text.includes("COMMERCIAL_C1_STATUS = 'research-complete'")) failures.push('Base C1 is not research-complete.');
  if (!text.includes("ownershipBeginsAt: 'C2'")) failures.push('Base C1 no longer reserves ownership for C2.');
}

if (failures.length) {
  console.error('Commercial C1 observed-evidence audit failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Commercial C1 observed Google/Bing evidence audit passed.');
