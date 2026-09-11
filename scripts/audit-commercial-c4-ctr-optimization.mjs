#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const failures = [];
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));

const c4Path = 'src/lib/commercialC4CtrOptimization.ts';
const c4SerpPath = 'src/lib/commercialC4SerpSnapshot.ts';
const c3Path = 'src/lib/commercialC3OwnerPageAudit.ts';
const c2Path = 'src/lib/commercialC2KeywordOwnership.ts';
const c1EvidencePath = 'src/lib/commercialC1ObservedSearchEvidence.ts';
const routeSeoPath = 'src/lib/routeSeoRegistry.js';

for (const required of [c4Path, c4SerpPath, c3Path, c2Path, c1EvidencePath, routeSeoPath]) {
  if (!exists(required)) failures.push(`${required} is missing`);
}

if (exists(c4Path)) {
  const c4 = read(c4Path);
  for (const token of [
    "COMMERCIAL_C4_REVISION = '2026-09-11-c4-r2'",
    "COMMERCIAL_C4_STATUS = 'experiment-governance-armed'",
    'COMMERCIAL_C4_GSC_CORE_QUERY_EVIDENCE',
    'COMMERCIAL_C4_ACTIVE_CONTROL_SNIPPETS',
    'evaluateCommercialC4FreshObservation',
    "'CONTROL' | 'READY' | 'DEPLOYED' | 'MEASURING' | 'WIN' | 'LOSS' | 'INCONCLUSIVE'",
    'historicalEvidencePredatesC3: true',
    'currentSnippetIsControl: true',
    'controlTitleAndDescriptionFrozen: true',
    'deployCandidateBeforeFreshEvidence: false',
    'minimumFreshObservationDays: 14',
    'minimumFreshPageImpressions: 200',
    'minimumFreshQueryImpressions: 50',
    'triageCtrReference: 0.04',
    'newCommercialUrlsAllowed: false',
    'ownershipChangesAllowed: false',
    'keywordStuffingAllowed: false',
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
    if (!c4.includes(`'${pathName}'`)) failures.push(`C4 active control missing ${pathName}`);
  }
}

if (exists(c4SerpPath)) {
  const serp = read(c4SerpPath);
  for (const token of [
    "COMMERCIAL_C4_SERP_SNAPSHOT_STATUS = 'directional-snapshot-complete'",
    "capturedOn: '2026-09-11'",
    'directionalOnly: true',
    "observedTitle: 'Online Phonics Classes for Kids in India | Live 1:1 | Tiny Steps'",
    "observedTitle: 'Premium 1:1 Online English Class Pricing | Tiny Steps Learning'",
    "observedTitle: 'Grammar Classes for Kids in India | Tiny Steps'",
  ]) {
    if (!serp.includes(token)) failures.push(`C4 SERP snapshot missing ${JSON.stringify(token)}`);
  }
}

if (exists(c1EvidencePath)) {
  const c1 = read(c1EvidencePath);
  for (const token of [
    "observedFrom: '2026-06-09'",
    "observedThrough: '2026-09-08'",
    "query:'phonics classes', clicks:6, impressions:1056, ctr:0.0057, position:4.88",
    "query:'online grammar classes for kids', clicks:0, impressions:4, ctr:0, position:7.25",
    "query:'public speaking classes for kids', clicks:0, impressions:74, ctr:0, position:23.59",
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
  const controlSnippets = {
    '/phonics': {
      title: 'Online Phonics Classes for Kids | Live 1:1 | Tiny Steps',
      description: 'Live 1:1 online phonics classes for kids ages 3–12 in India and worldwide. Build blending, decoding, spelling and reading fluency with assessment-first placement.',
    },
    '/best-online-phonics-classes-for-kids-in-india': {
      title: 'Best Online Phonics Classes for Kids in India | Tiny Steps Learning',
      description: 'Compare online phonics classes for kids in India by child fit, 1:1 vs group format, curriculum, live correction, reading transfer, progress visibility and overall value.',
    },
    '/grammar': {
      title: 'Online Grammar Classes for Kids | Live 1:1 | Tiny Steps',
      description: 'Live 1:1 online grammar classes for kids in India and worldwide. Build sentence formation, tenses, punctuation, grammar accuracy and clearer school answers with assessment-first placement.',
    },
    '/speaking': {
      title: 'Public Speaking & Communication Classes for Kids | Tiny Steps',
      description: 'Live 1:1 public speaking and communication classes for kids in India and worldwide. Build structured answers, storytelling, presentations and communication confidence in 35-minute classes.',
    },
    '/online-english-classes-hyderabad': {
      title: 'Online English Classes for Kids in Hyderabad | Tiny Steps',
      description: 'Live online English classes for kids ages 3–12 in Hyderabad. Start with a free 35-minute 1:1 assessment, then choose the right phonics, reading, grammar, writing or speaking path.',
    },
    '/pricing': {
      title: 'Online English Classes for Kids Fees & Pricing | Tiny Steps',
      description: 'See Tiny Steps online English class fees: standard live 1:1 ₹400/class, 12 classes ₹4,800, small groups ₹180–₹300 per child/class, plus native-teacher options.',
    },
  };

  for (const [route, expected] of Object.entries(controlSnippets)) {
    const entry = registry?.[route];
    if (!entry) {
      failures.push(`route SEO registry missing C4 control ${route}`);
      continue;
    }
    if (entry.canonicalPath !== route) failures.push(`${route} lost self-canonical ownership`);
    if (entry.title !== expected.title) failures.push(`${route} control title changed before fresh C4 evidence: ${entry.title}`);
    if (entry.description !== expected.description) failures.push(`${route} control description changed before fresh C4 evidence: ${entry.description}`);
  }
}

if (failures.length) {
  console.error('Commercial C4 CTR governance audit failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Commercial C4 CTR governance passed: page/query evidence is mapped, title and description controls are frozen, directional SERP rewrites are tracked, and deployment remains gated by fresh post-C3 evidence.');
