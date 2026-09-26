#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  PHONICS_PREPUBLICATION_QUALITY_REVISION,
  PHONICS_PREPUBLICATION_QUALITY_STATE,
} from '../src/lib/phonicsPrepublicationQuality.js';
import { PHONICS_PUBLISHED_RESOURCE_PAGES } from '../src/lib/phonicsPublicationRegistry.js';
import { getPhonicsResourceDifferentiation } from '../src/lib/phonicsResourceDifferentiation.ts';

const root = process.cwd();
const distMode = process.argv.includes('--dist');
const errors = [];
const checks = [];
const fail = (id, detail) => { errors.push({ id, detail }); checks.push({ id, status: 'fail', detail }); };
const pass = (id, detail) => checks.push({ id, status: 'pass', detail });

if (PHONICS_PUBLISHED_RESOURCE_PAGES.length !== 31) {
  fail('published-count', `Expected 31 governed phonics pages, found ${PHONICS_PUBLISHED_RESOURCE_PAGES.length}.`);
} else {
  pass('published-count', 'Exactly 31 governed phonics resource pages are in the publication registry.');
}

for (const page of PHONICS_PUBLISHED_RESOURCE_PAGES) {
  if (page.prepublicationQualityState !== PHONICS_PREPUBLICATION_QUALITY_STATE) {
    fail('quality-state', `${page.conceptId} is published without a passed pre-publication quality state.`);
  }
  if (page.prepublicationQualityRevision !== PHONICS_PREPUBLICATION_QUALITY_REVISION) {
    fail('quality-revision', `${page.conceptId} is not bound to the current pre-publication quality revision.`);
  }
  if (!Array.isArray(page.prepublicationQualityChecks) || page.prepublicationQualityChecks.length < 10) {
    fail('quality-checks', `${page.conceptId} does not expose the required pre-publication check set.`);
  }

  const concept = page.concept;
  const requirements = [
    ['parentQuestion', String(concept.parentQuestion || '').trim().length >= 20],
    ['quickAnswer', String(concept.quickAnswer || '').trim().length >= 60],
    ['searchIntent', String(concept.searchIntent || '').trim().length >= 10],
    ['exampleWords', Array.isArray(concept.exampleWords) && concept.exampleWords.length >= 3],
    ['teachingNotes', Array.isArray(concept.teachingNotes) && concept.teachingNotes.length >= 2],
    ['practiceIdeas', Array.isArray(concept.practiceIdeas) && concept.practiceIdeas.length >= 2],
    ['commonConfusions', Array.isArray(concept.commonConfusions) && concept.commonConfusions.length >= 1],
    ['curriculumRefs', Array.isArray(concept.curriculumRefs) && concept.curriculumRefs.length >= 1],
    ['supportingPaths', Array.isArray(concept.supportingPaths) && concept.supportingPaths.length >= 1],
    ['seoTitle', String(page.seoTitle || '').trim().length >= 30],
    ['seoDescription', String(page.seoDescription || '').trim().length >= 90],
  ];
  for (const [name, ok] of requirements) if (!ok) fail('content-depth', `${page.conceptId} failed ${name}.`);

  const differentiation = getPhonicsResourceDifferentiation(page.conceptId);
  if (!differentiation || differentiation.learningOutcome.trim().length < 40 || differentiation.boundarySummary.trim().length < 40) {
    fail('differentiation', `${page.conceptId} lacks sufficient learning-outcome/boundary differentiation.`);
  }
}

if (!errors.some((error) => ['quality-state', 'quality-revision', 'quality-checks', 'content-depth', 'differentiation'].includes(error.id))) {
  pass('prepublication-gate', 'All 31 published pages carry a passed quality state and meet the minimum content/differentiation contract before publication.');
}

const pageSource = fs.readFileSync(path.join(root, 'src/pages/PhonicsKnowledgePage.tsx'), 'utf8');
for (const forbidden of [
  'usePublicEditorialApproval',
  'getApprovedPhonicsEditorialReview',
  'Reviewed for phonics accuracy by',
  '"reviewedBy"',
  "reviewedBy: { '@id'",
]) {
  if (pageSource.includes(forbidden)) fail('post-publication-review', `PhonicsKnowledgePage still contains obsolete review dependency: ${forbidden}`);
}
if (!errors.some((error) => error.id === 'post-publication-review')) {
  pass('post-publication-review', 'Published phonics resources no longer depend on a post-publication human-review state or reviewer attribution.');
}

if (distMode) {
  for (const page of PHONICS_PUBLISHED_RESOURCE_PAGES) {
    const htmlPath = path.join(root, 'dist', ...page.path.slice(1).split('/'), 'index.html');
    if (!fs.existsSync(htmlPath)) {
      fail('rendered-page', `Missing prerendered page: ${page.path}`);
      continue;
    }
    const html = fs.readFileSync(htmlPath, 'utf8');
    if (html.includes('Reviewed for phonics accuracy by') || html.includes('"reviewedBy"')) {
      fail('rendered-review-claim', `${page.path} contains obsolete human-review attribution.`);
    }
  }
  if (!errors.some((error) => error.id.startsWith('rendered-'))) {
    pass('rendered-boundary', 'Rendered programmatic pages contain no obsolete post-publication review claims.');
  }
}

const report = {
  gate: 'phonics-prepublication-quality',
  revision: PHONICS_PREPUBLICATION_QUALITY_REVISION,
  state: PHONICS_PREPUBLICATION_QUALITY_STATE,
  publishedPages: PHONICS_PUBLISHED_RESOURCE_PAGES.length,
  distMode,
  checks,
  errors,
};

console.log(JSON.stringify(report, null, 2));
if (process.argv.includes('--report')) {
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts/phonics-prepublication-quality.json'), `${JSON.stringify(report, null, 2)}\n`);
}
if (errors.length) process.exitCode = 1;
else console.log('PASS: all governed phonics programmatic pages pass the pre-publication quality gate before publication.');
