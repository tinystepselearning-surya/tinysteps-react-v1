#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const failures = [];
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));

const c4Path = 'src/lib/commercialC4CtrOptimization.ts';
const c3Path = 'src/lib/commercialC3OwnerPageAudit.ts';
const c2Path = 'src/lib/commercialC2KeywordOwnership.ts';
const c1EvidencePath = 'src/lib/commercialC1ObservedSearchEvidence.ts';
const routeSeoPath = 'src/lib/routeSeoRegistry.js';

for (const required of [c4Path, c3Path, c2Path, c1EvidencePath, routeSeoPath]) {
  if (!exists(required)) failures.push(`${required} is missing`);
}

if (exists(c4Path)) {
  const c4 = read(c4Path);
  for (const token of [
    "COMMERCIAL_C4_REVISION = '2026-09-11-c4-r1'",
    "COMMERCIAL_C4_STATUS = 'baseline-armed'",
    'historicalEvidencePredatesC3: true',
    'currentSnippetIsControl: true',
    'deployCandidateBeforeFreshEvidence: false',
    'minimumFreshObservationDays: 14',
    'minimumFreshPageImpressions: 200',
    'minimumFreshQueryImpressions: 50',
    'newCommercialUrlsAllowed: false',
    'ownershipChangesAllowed: false',
  ]) {
    if (!c4.includes(token)) failures.push(`C4 contract missing ${JSON.stringify(token)}`);
  }

  for (const pathName of [
    '/phonics',
    '/best-online-phonics-classes-for-kids-in-india',
    '/grammar',
    '/speaking',
    '/online-english-classes-hyderabad',
    '/pricing',
  ]) {
    if (!c4.includes(`'${pathName}'`)) failures.push(`C4 priority candidate missing ${pathName}`);
  }
}

if (exists(c1EvidencePath)) {
  const c1 = read(c1EvidencePath);
  for (const token of [
    "observedFrom: '2026-06-09'",
    "observedThrough: '2026-09-08'",
    "path:'/phonics', clicks:371, impressions:11306, ctr:0.0328, position:4.86",
    "path:'/pricing', clicks:16, impressions:1551, ctr:0.0103, position:5.09",
  ]) {
    if (!c1.includes(token)) failures.push(`C1 evidence drifted from C4 baseline: ${JSON.stringify(token)}`);
  }
}

if (exists(c2Path) && !read(c2Path).includes("COMMERCIAL_C2_STATUS = 'ownership-complete'")) {
  failures.push('C2 ownership is not complete');
}
if (exists(c3Path) && !read(c3Path).includes("COMMERCIAL_C3_STATUS = 'implementation-complete'")) {
  failures.push('C3 implementation is not complete');
}

if (exists(routeSeoPath)) {
  const routeSeoModule = await import(`${pathToFileURL(path.join(root, routeSeoPath)).href}?c4seo=${Date.now()}`);
  const registry = routeSeoModule.ROUTE_SEO_REGISTRY;
  const controlTitles = {
    '/phonics': 'Online Phonics Classes for Kids | Live 1:1 | Tiny Steps',
    '/best-online-phonics-classes-for-kids-in-india': 'Best Online Phonics Classes for Kids in India | Tiny Steps Learning',
    '/grammar': 'Online Grammar Classes for Kids | Live 1:1 | Tiny Steps',
    '/speaking': 'Public Speaking & Communication Classes for Kids | Tiny Steps',
    '/online-english-classes-hyderabad': 'Online English Classes for Kids in Hyderabad | Tiny Steps',
    '/pricing': 'Online English Classes for Kids Fees & Pricing | Tiny Steps',
  };

  for (const [route, expectedTitle] of Object.entries(controlTitles)) {
    const entry = registry?.[route];
    if (!entry) {
      failures.push(`route SEO registry missing C4 control ${route}`);
      continue;
    }
    if (entry.canonicalPath !== route) failures.push(`${route} lost self-canonical ownership`);
    if (entry.title !== expectedTitle) failures.push(`${route} control title changed before fresh C4 evidence: ${entry.title}`);
  }
}

if (failures.length) {
  console.error('Commercial C4 CTR baseline audit failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Commercial C4 CTR baseline passed: historical opportunity is ranked, C3 snippets remain control, and no candidate is deployable before fresh evidence.');
