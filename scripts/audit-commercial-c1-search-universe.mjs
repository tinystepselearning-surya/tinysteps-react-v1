#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const registryPath = path.join(root, 'src/lib/commercialC1SearchUniverse.ts');
const c0Path = path.join(root, 'src/lib/commercialC0Foundation.ts');
const kbPath = path.join(root, 'src/lib/knowledgeBaseFinalClosure.js');
const failures = [];

for (const required of [registryPath, c0Path, kbPath]) {
  if (!fs.existsSync(required)) failures.push(`${path.relative(root, required)} is missing`);
}

if (fs.existsSync(registryPath)) {
  const text = fs.readFileSync(registryPath, 'utf8');
  const requiredTokens = [
    "COMMERCIAL_C1_STATUS = 'research-complete'",
    "ownershipBeginsAt: 'C2'",
    'canonicalKeywordOwnershipAllowed: false',
    "authenticatedQueryLevelGsc: 'unavailable-in-this-execution'",
    "query:'online phonics classes for kids'",
    "query:'online reading classes for kids'",
    "query:'online grammar classes for kids'",
    "query:'creative writing classes for kids online'",
    "query:'spoken english classes for kids online'",
    "query:'public speaking classes for kids online'",
    "query:'communication skills classes for kids online'",
    "query:'online english classes for kids'",
    "query:'online english tutor for kids'",
    "impressions:9756",
    "impressions:2722",
  ];
  for (const token of requiredTokens) {
    if (!text.includes(token)) failures.push(`C1 registry missing ${JSON.stringify(token)}`);
  }
  for (const forbidden of ['canonicalOwner:', 'ownerPath:', 'titleChangesAllowed: true', 'newUrlsAllowed: true']) {
    if (text.includes(forbidden)) failures.push(`C1 contains forbidden ownership/implementation token ${JSON.stringify(forbidden)}`);
  }
  const queryCount = (text.match(/query:'/g) || []).length;
  if (queryCount < 45) failures.push(`C1 keyword universe too small: ${queryCount}`);
  for (const subject of ['phonics','reading','grammar','writing','spoken_english','public_speaking','communication','broad_english','tutor']) {
    if (!text.includes(`subject:'${subject}'`)) failures.push(`C1 missing subject ${subject}`);
  }
  for (const stage of ['problem','solution','provider_research','comparison','price','trial_demo']) {
    if (!text.includes(`parentStage:'${stage}'`)) failures.push(`C1 missing parent stage ${stage}`);
  }
}

if (fs.existsSync(c0Path)) {
  const text = fs.readFileSync(c0Path, 'utf8');
  if (!text.includes("COMMERCIAL_C0_STATUS = 'frozen'")) failures.push('C0 is not frozen');
  if (!text.includes("commercialKeywordResearchBeginsAt: 'C1'")) failures.push('C0 does not hand off research to C1');
  if (!text.includes("canonicalCommercialOwnershipBeginsAt: 'C2'")) failures.push('C0 does not reserve ownership for C2');
}

if (fs.existsSync(kbPath)) {
  const text = fs.readFileSync(kbPath, 'utf8');
  if (!text.includes("KNOWLEDGE_BASE_FINAL_STATUS = 'frozen'")) failures.push('KB-FINAL is not frozen');
}

if (failures.length) {
  console.error('Commercial C1 audit failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Commercial C1 search-universe audit passed.');
