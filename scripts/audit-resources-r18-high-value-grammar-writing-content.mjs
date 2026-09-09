#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { GRAMMAR_WRITING_CONTENT_EXECUTION } from '../src/lib/grammarWritingContentExecutionRegistry.js';
import {
  R18_GRAMMAR_WRITING_CANONICAL_TOPIC_OWNERSHIP,
  R18_CANONICAL_TOPIC_OWNERSHIP,
} from '../src/lib/grammarWritingContentCanonicalOwnership.js';
import { R16_CANONICAL_TOPIC_OWNERSHIP } from '../src/lib/readingSemanticCanonicalOwnership.js';

const root = process.cwd();
const dist = process.argv.includes('--dist');
const errors = [];
const warnings = [];
const add = (code, id, detail) => errors.push({ code, id, detail });
const exists = (relative) => fs.existsSync(path.join(root, relative));
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const CREATED = Object.freeze([
  Object.freeze({
    id: 'punctuation-capitalisation-parent-guide',
    slug: 'punctuation-and-capital-letters-for-kids',
    file: 'src/content/blog/posts/grammar/punctuation-and-capital-letters-for-kids.ts',
    required: [
      'meaning → sentence boundary → punctuation choice → rereading → transfer',
      'SAY → FIND → CHOOSE → WRITE → REREAD',
      'Commas have several jobs',
      'Evidence and curriculum boundary',
      'ies.ed.gov/ncee/wwc/PracticeGuide/17',
      'national-curriculum-in-england-english-programmes-of-study',
    ],
  }),
  Object.freeze({
    id: 'paragraph-writing-parent-guide',
    slug: 'how-to-teach-paragraph-writing-to-kids',
    file: 'src/content/blog/posts/grammar/how-to-teach-paragraph-writing-to-kids.ts',
    required: [
      'Do not begin by demanding “five sentences.”',
      'FOCUS → PLAN → SAY → WRITE → CONNECT → REREAD',
      'Relevant details: teach children to choose, not just add',
      'Cohesion: how do sentences stick together?',
      'Evidence and curriculum boundary',
      'ies.ed.gov/ncee/wwc/PracticeGuide/17',
      'national-curriculum-in-england-english-programmes-of-study',
    ],
  }),
]);

if (GRAMMAR_WRITING_CONTENT_EXECUTION.length !== 2) add('execution-count', 'R18', `Expected 2 execution decisions, found ${GRAMMAR_WRITING_CONTENT_EXECUTION.length}.`);
const published = GRAMMAR_WRITING_CONTENT_EXECUTION.filter((item) => item.state === 'published');
if (published.length !== 2) add('published-count', 'R18', `Expected 2 published CREATE decisions, found ${published.length}.`);

for (const item of CREATED) {
  const execution = GRAMMAR_WRITING_CONTENT_EXECUTION.find((entry) => entry.id === item.id);
  const expectedPath = `/blog/${item.slug}`;
  if (execution?.state !== 'published' || execution.path !== expectedPath) add('execution-path', item.id, `Expected published ${expectedPath}.`);
  if (!exists(item.file)) {
    add('missing-content-file', item.id, item.file);
    continue;
  }
  const source = read(item.file);
  if (!source.includes(`slug: '${item.slug}'`)) add('slug-mismatch', item.id, item.slug);
  if (!source.includes("author: 'Priya'")) add('authorship-boundary', item.id, 'R18 grammar/writing guides should keep the assigned Priya authorship.');
  if (!source.includes("audience: 'Parent'")) add('audience-mismatch', item.id, 'Expected parent-facing content.');
  for (const marker of item.required) if (!source.includes(marker)) add('missing-content-marker', item.id, marker);
  if ((source.match(/type: 'h2'/g) || []).length < 8) add('thin-structure', item.id, 'Expected at least 8 H2 sections.');
  if ((source.match(/question:/g) || []).length < 5) add('thin-faq', item.id, 'Expected at least 5 FAQs.');
  if (source.includes('learnphonics.co') || source.includes('readnaturally.com') || source.includes('jollylearning.com')) add('reference-copy-boundary', item.id, 'Competitor/reference sites may inform architecture but are not evidence sources for R18 content.');
}

if (R18_GRAMMAR_WRITING_CANONICAL_TOPIC_OWNERSHIP.length !== 2) add('ownership-count', 'R18', `Expected 2 new canonical owners, found ${R18_GRAMMAR_WRITING_CANONICAL_TOPIC_OWNERSHIP.length}.`);
if (R18_CANONICAL_TOPIC_OWNERSHIP.length !== R16_CANONICAL_TOPIC_OWNERSHIP.length + 2) add('ownership-composition', 'R18', 'R18 full ownership view must be exactly R16 + 2 grammar/writing owners.');
const ids = R18_CANONICAL_TOPIC_OWNERSHIP.map((item) => item.id);
const intents = R18_CANONICAL_TOPIC_OWNERSHIP.map((item) => String(item.queryIntent || '').trim().toLowerCase());
if (new Set(ids).size !== ids.length) add('duplicate-owner-id', 'R18', 'Canonical topic IDs must be unique.');
if (new Set(intents).size !== intents.length) add('duplicate-query-intent', 'R18', 'Canonical query intents must be unique.');
for (const owner of R18_GRAMMAR_WRITING_CANONICAL_TOPIC_OWNERSHIP) {
  if (!published.some((item) => item.path === owner.ownerPath)) add('owner-without-publication', owner.id, owner.ownerPath);
  if (owner.hubPath !== '/resources/grammar') add('wrong-owner-hub', owner.id, owner.hubPath);
  if (owner.subject !== 'grammar-writing') add('wrong-owner-subject', owner.id, owner.subject);
}

const hubFile = 'src/pages/SubjectResourcesPage.tsx';
if (!exists(hubFile)) add('missing-hub-source', 'R18', hubFile);
else {
  const hub = read(hubFile);
  if (!hub.includes('data-grammar-writing-featured-guides')) add('missing-discovery-strip', 'R18', 'Expected compact grammar/writing featured-guide navigation.');
  for (const item of CREATED) if (!hub.includes(`/blog/${item.slug}`)) add('missing-hub-link', item.id, item.slug);
  if (!hub.includes("programmeTo: '/grammar'")) add('grammar-commercial-owner-changed', 'R18', 'The live grammar programme owner must remain /grammar.');
}

if (dist) {
  if (!exists('dist/index.html')) add('missing-build', 'R18', 'dist/index.html');
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
      if (/noindex/i.test(html)) add('rendered-noindex', item.id, 'New high-value grammar/writing article must remain indexable.');
    }
    if (sitemapText && !sitemapText.includes(`/blog/${item.slug}`)) add('missing-sitemap-entry', item.id, item.slug);
  }
  if (exists('dist/resources/grammar/index.html')) {
    const hubHtml = read('dist/resources/grammar/index.html');
    if (!hubHtml.includes('data-grammar-writing-featured-guides')) add('missing-rendered-discovery-strip', 'R18', '/resources/grammar');
    for (const item of CREATED) if (!hubHtml.includes(`/blog/${item.slug}`)) add('missing-rendered-hub-link', item.id, item.slug);
  } else add('missing-rendered-hub', 'R18', 'dist/resources/grammar/index.html');
}

const summary = {
  revision: '2026-09-09-r18',
  executionDecisions: GRAMMAR_WRITING_CONTENT_EXECUTION.length,
  published: published.length,
  additiveCanonicalOwners: R18_GRAMMAR_WRITING_CANONICAL_TOPIC_OWNERSHIP.length,
  dist,
};
const result = { summary, errors, warnings };
console.log(JSON.stringify(result, null, 2));
if (process.argv.includes('--report')) {
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts/resources-r18-high-value-grammar-writing-content.json'), `${JSON.stringify(result, null, 2)}\n`);
}
if (errors.length) process.exitCode = 1;
else console.log(`PASS: R18 publishes ${summary.published} controlled grammar/writing guides and adds ${summary.additiveCanonicalOwners} canonical intents without changing commercial ownership.`);
