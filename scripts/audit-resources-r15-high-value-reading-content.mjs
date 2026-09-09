#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { READING_CONTENT_EXECUTION } from '../src/lib/readingContentExecutionRegistry.js';
import {
  R15_READING_CANONICAL_TOPIC_OWNERSHIP,
  R15_CANONICAL_TOPIC_OWNERSHIP,
} from '../src/lib/readingContentCanonicalOwnership.js';
import { R12_CANONICAL_TOPIC_OWNERSHIP } from '../src/lib/phonicsWave2CanonicalOwnership.js';

const root = process.cwd();
const dist = process.argv.includes('--dist');
const errors = [];
const warnings = [];
const add = (code, id, detail) => errors.push({ code, id, detail });
const exists = (relative) => fs.existsSync(path.join(root, relative));
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const CREATED = Object.freeze([
  Object.freeze({
    id: 'phonological-phonemic-phonics-boundary',
    slug: 'phonological-awareness-vs-phonemic-awareness-vs-phonics',
    file: 'src/content/blog/posts/research/phonological-awareness-vs-phonemic-awareness-vs-phonics.ts',
    required: ['Phonological awareness', 'Phonemic awareness', 'phonics begins when speech sounds are explicitly connected with print', 'Evidence and source boundary', 'ies.ed.gov/ncee/wwc/PracticeGuide/21/Published'],
  }),
  Object.freeze({
    id: 'vocabulary-reading-connection',
    slug: 'how-vocabulary-supports-reading-comprehension',
    file: 'src/content/blog/posts/research/how-vocabulary-supports-reading-comprehension.ts',
    required: ['Decoding gives the child access to the spoken form of the word', 'Oral vocabulary', 'Evidence and source boundary', 'national-curriculum-in-england-english-programmes-of-study'],
  }),
  Object.freeze({
    id: 'automatic-word-recognition',
    slug: 'how-children-recognise-words-automatically-after-phonics',
    file: 'src/content/blog/posts/research/how-children-recognise-words-automatically-after-phonics.ts',
    required: ['orthographic mapping', 'memorising the word as a picture', 'Guessing from shape, picture or first letter', 'doi.org/10.1080/10888438.2013.819356'],
  }),
]);

if (READING_CONTENT_EXECUTION.length !== 5) add('execution-count', 'R15', `Expected 5 execution decisions, found ${READING_CONTENT_EXECUTION.length}.`);
const published = READING_CONTENT_EXECUTION.filter((item) => item.state === 'published');
const satisfied = READING_CONTENT_EXECUTION.filter((item) => item.state === 'already-satisfied');
if (published.length !== 3) add('published-count', 'R15', `Expected 3 published CREATE decisions, found ${published.length}.`);
if (satisfied.length !== 2) add('already-satisfied-count', 'R15', `Expected 2 already-satisfied refresh decisions, found ${satisfied.length}.`);

for (const item of CREATED) {
  const execution = READING_CONTENT_EXECUTION.find((entry) => entry.id === item.id);
  const expectedPath = `/blog/${item.slug}`;
  if (execution?.state !== 'published' || execution.path !== expectedPath) add('execution-path', item.id, `Expected published ${expectedPath}.`);
  if (!exists(item.file)) {
    add('missing-content-file', item.id, item.file);
    continue;
  }
  const source = read(item.file);
  if (!source.includes(`slug: '${item.slug}'`)) add('slug-mismatch', item.id, item.slug);
  if (!source.includes("author: 'Tiny Steps Research Desk'")) add('authorship-boundary', item.id, 'R15 research articles must use the organizational Research Desk authorship unless a real human author is explicitly assigned.');
  if (!source.includes("audience: 'Parent'")) add('audience-mismatch', item.id, 'Expected parent-facing content.');
  for (const marker of item.required) if (!source.includes(marker)) add('missing-content-marker', item.id, marker);
  if ((source.match(/type: 'h2'/g) || []).length < 8) add('thin-structure', item.id, 'Expected at least 8 H2 sections.');
  if ((source.match(/question:/g) || []).length < 5) add('thin-faq', item.id, 'Expected at least 5 FAQs.');
  if (source.includes('readnaturally.com') || source.includes('jollylearning.com') || source.includes('literacytrust.org.uk')) add('reference-copy-boundary', item.id, 'Competitor/reference sites may inspire architecture but are not R15 evidence sources.');
}

const expectedSatisfiedPaths = new Set(['/blog/how-to-improve-reading-fluency-in-children', '/blog/phonics-comprehension']);
for (const item of satisfied) if (!expectedSatisfiedPaths.has(item.path)) add('unexpected-noop-refresh', item.id, item.path);
if (satisfied.some((item) => item.contentRevision)) add('false-refresh-revision', 'R15', 'Already-satisfied records must not claim a new content revision.');

if (R15_READING_CANONICAL_TOPIC_OWNERSHIP.length !== 3) add('ownership-count', 'R15', `Expected 3 new canonical owners, found ${R15_READING_CANONICAL_TOPIC_OWNERSHIP.length}.`);
if (R15_CANONICAL_TOPIC_OWNERSHIP.length !== R12_CANONICAL_TOPIC_OWNERSHIP.length + 3) add('ownership-composition', 'R15', 'R15 full ownership view must be exactly R12 + 3 reading owners.');
const ids = R15_CANONICAL_TOPIC_OWNERSHIP.map((item) => item.id);
const intents = R15_CANONICAL_TOPIC_OWNERSHIP.map((item) => String(item.queryIntent || '').trim().toLowerCase());
if (new Set(ids).size !== ids.length) add('duplicate-owner-id', 'R15', 'Canonical topic IDs must be unique.');
if (new Set(intents).size !== intents.length) add('duplicate-query-intent', 'R15', 'Canonical query intents must be unique.');
for (const owner of R15_READING_CANONICAL_TOPIC_OWNERSHIP) {
  if (!published.some((item) => item.path === owner.ownerPath)) add('owner-without-publication', owner.id, owner.ownerPath);
  if (owner.hubPath !== '/resources/phonics') add('wrong-owner-hub', owner.id, owner.hubPath);
}

const hubFile = 'src/components/resources/PhonicsPilotGuideGrid.tsx';
if (!exists(hubFile)) add('missing-hub-source', 'R15', hubFile);
else {
  const hub = read(hubFile);
  if (!hub.includes('data-reading-knowledge-guides')) add('missing-discovery-strip', 'R15', 'Expected compact reading knowledge discovery navigation.');
  for (const item of CREATED) if (!hub.includes(`/blog/${item.slug}`)) add('missing-hub-link', item.id, item.slug);
}

if (dist) {
  if (!exists('dist/index.html')) add('missing-build', 'R15', 'dist/index.html');
  const sitemapCandidates = ['dist/sitemap-blog.xml', 'public/sitemap-blog.xml'].filter(exists);
  if (!sitemapCandidates.length) warnings.push('Blog sitemap file was not found at the expected dist/public paths.');
  const sitemapText = sitemapCandidates.map(read).join('\n');
  for (const item of CREATED) {
    const rendered = `dist/blog/${item.slug}/index.html`;
    if (!exists(rendered)) add('missing-prerender', item.id, rendered);
    else {
      const html = read(rendered);
      const canonical = `https://tinystepslearning.com/blog/${item.slug}`;
      if (!html.includes(canonical)) add('missing-rendered-canonical', item.id, canonical);
      if (/noindex/i.test(html)) add('rendered-noindex', item.id, 'New high-value reading article must remain indexable.');
    }
    if (sitemapText && !sitemapText.includes(`/blog/${item.slug}`)) add('missing-sitemap-entry', item.id, item.slug);
  }
  if (exists('dist/resources/phonics/index.html')) {
    const hubHtml = read('dist/resources/phonics/index.html');
    for (const item of CREATED) if (!hubHtml.includes(`/blog/${item.slug}`)) add('missing-rendered-hub-link', item.id, item.slug);
  } else add('missing-rendered-hub', 'R15', 'dist/resources/phonics/index.html');
}

const summary = {
  revision: '2026-09-09-r15',
  executionDecisions: READING_CONTENT_EXECUTION.length,
  published: published.length,
  alreadySatisfied: satisfied.length,
  additiveCanonicalOwners: R15_READING_CANONICAL_TOPIC_OWNERSHIP.length,
  dist,
};
const result = { summary, errors, warnings };
console.log(JSON.stringify(result, null, 2));
if (process.argv.includes('--report')) {
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts/resources-r15-high-value-reading-content.json'), `${JSON.stringify(result, null, 2)}\n`);
}
if (errors.length) process.exitCode = 1;
else console.log(`PASS: R15 publishes ${summary.published} controlled reading guides, preserves ${summary.alreadySatisfied} strong existing owners without churn, and adds ${summary.additiveCanonicalOwners} canonical intents.`);
