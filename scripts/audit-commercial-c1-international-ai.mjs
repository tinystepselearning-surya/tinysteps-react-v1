#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const target = path.join(root, 'src/lib/commercialC1InternationalAiResearch.ts');
const failures = [];

if (!fs.existsSync(target)) failures.push('international/AI C1 research module is missing');

if (fs.existsSync(target)) {
  const text = fs.readFileSync(target, 'utf8');
  for (const token of [
    "id: 'uae'",
    "id: 'usa'",
    "id: 'uk'",
    "id: 'australia'",
    "id: 'singapore'",
    "id: 'nri'",
    "COMMERCIAL_C1_INTERNATIONAL_QUERIES",
    "COMMERCIAL_C1_AI_STYLE_QUERIES",
    "COMMERCIAL_C1_ENROLMENT_QUERY_FAMILY",
    "COMMERCIAL_C1_DECLARED_OPERATING_PRIORS",
    "approximateRatePct: 33.3",
    "approximateRatePct: 20",
    "pricePerClassInr: COMMERCIAL_C0_FACTS.pricing.standardOneToOnePerClassInr",
    "parentStage:'enrolment'",
    "newCountryPagesAuthorized: false",
    "aiPromptPagesAuthorized: false",
    "canonicalOwnershipAuthorized: false",
    "ownershipBeginsAt: 'C2'",
  ]) {
    if (!text.includes(token)) failures.push(`missing required C1 enhancement token ${JSON.stringify(token)}`);
  }

  const marketIds = [...text.matchAll(/id: '(uae|usa|uk|australia|singapore|nri)'/g)].map((match) => match[1]);
  for (const market of ['uae','usa','uk','australia','singapore','nri']) {
    if (!marketIds.includes(market)) failures.push(`market ${market} missing`);
  }

  if (!text.includes('COMMERCIAL_C1_INTERNATIONAL_QUERIES.length !== 54')) failures.push('international query cardinality guard missing');
  if (!text.includes("trackingStatus: 'not-systematically-measured'")) failures.push('operating priors must be explicitly unmeasured');
  if (!text.includes('doNotCombineIntoObservedFunnel: true')) failures.push('operating priors must not be combined into observed funnel analytics');
}

if (failures.length) {
  console.error('Commercial C1 international/AI audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Commercial C1 international/AI audit passed.');
