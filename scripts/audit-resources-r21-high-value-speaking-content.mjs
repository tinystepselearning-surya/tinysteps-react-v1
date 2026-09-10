#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { CANONICAL_TOPIC_OWNERSHIP } from '../src/lib/canonicalTopicOwnershipRegistry.js';
import { R19_CANONICAL_TOPIC_OWNERSHIP } from '../src/lib/grammarWritingSemanticCanonicalOwnership.js';
import {
  R21_CANONICAL_TOPIC_OWNERSHIP,
  R21_SPEAKING_COMMUNICATION_CANONICAL_TOPIC_OWNERSHIP,
} from '../src/lib/speakingCommunicationContentCanonicalOwnership.js';
import { SPEAKING_COMMUNICATION_CONTENT_EXECUTION } from '../src/lib/speakingCommunicationContentExecutionRegistry.js';
import { getSpeakingCommunicationContentAuditByAction } from '../src/lib/speakingCommunicationKnowledgeArchitecture.js';

const root = process.cwd();
const dist = process.argv.includes('--dist');
const errors = [];
const warnings = [];
const add = (code, id, detail) => errors.push({ code, id, detail });
const exists = (relative) => fs.existsSync(path.join(root, relative));
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const CREATED = Object.freeze([
  Object.freeze({
    id: 'conversation-skills-parent-guide',
    slug: 'conversation-skills-for-kids',
    file: 'src/content/blog/posts/public-speaking/conversation-skills-for-kids.ts',
    required: [
      'two-way exchange',
      'LISTEN → RESPOND → ADD → ASK → REPAIR',
      'turn-taking',
      'follow-up question',
      'repair a misunderstanding',
      'does not require constant eye contact',
      'Evidence and curriculum boundary',
    ],
  }),
  Object.freeze({
    id: 'storytelling-retelling-parent-guide',
    slug: 'how-to-teach-storytelling-to-kids',
    file: 'src/content/blog/posts/public-speaking/how-to-teach-storytelling-to-kids.ts',
    required: [
      'Retelling and creating a story are related but different jobs',
      'SET → START → CHANGE → BUILD → END → RETELL',
      'Teach sequence with meaning',
      'choose relevant details',
      'fewer adult prompts',
      'Multilingual storytelling',
      'Evidence and curriculum boundary',
    ],
  }),
  Object.freeze({
    id: 'speaking-delivery-parent-guide',
    slug: 'public-speaking-delivery-for-kids',
    file: 'src/content/blog/posts/public-speaking/public-speaking-delivery-for-kids.ts',
    required: [
      'pace, audible volume, pausing, emphasis, intelligibility',
      'HEAR → FOLLOW → FEEL → CONNECT → ADJUST',
      'Intelligibility is more useful than accent conformity',
      'Constant eye contact is not a universal requirement',
      'SAY → NOTICE → CHOOSE ONE TARGET → RETRY → TRANSFER',
      'formal public-speaking and presentation skills are not the main focus',
      'Evidence and curriculum boundary',
    ],
  }),
]);

if (SPEAKING_COMMUNICATION_CONTENT_EXECUTION.length !== 3) add('execution-count', 'R21', `Expected 3 execution decisions, found ${SPEAKING_COMMUNICATION_CONTENT_EXECUTION.length}.`);
const published = SPEAKING_COMMUNICATION_CONTENT_EXECUTION.filter((item) => item.state === 'published');
if (published.length !== 3) add('published-count', 'R21', `Expected 3 published CREATE decisions, found ${published.length}.`);

for (const item of CREATED) {
  const execution = SPEAKING_COMMUNICATION_CONTENT_EXECUTION.find((entry) => entry.id === item.id);
  const expectedPath = `/blog/${item.slug}`;
  if (execution?.state !== 'published' || execution.path !== expectedPath) add('execution-path', item.id, `Expected published ${expectedPath}.`);
  if (!exists(item.file)) {
    add('missing-content-file', item.id, item.file);
    continue;
  }
  const source = read(item.file);
  if (!source.includes(`slug: '${item.slug}'`)) add('slug-mismatch', item.id, item.slug);
  if (!source.includes("author: 'Priya'")) add('authorship-boundary', item.id, 'R21 speaking guides should keep Priya authorship.');
  if (!source.includes("audience: 'Parent'")) add('audience-mismatch', item.id, 'Expected parent-facing content.');
  if (!source.includes("discoveryCategory: 'Speaking & Communication'")) add('discovery-category', item.id, 'Expected Speaking & Communication discovery category.');
  if (!source.includes("date: '2026-09-10'")) add('publication-date', item.id, 'Expected the actual R21 publication revision date.');
  for (const marker of item.required) if (!source.includes(marker)) add('missing-content-marker', item.id, marker);
  if ((source.match(/type: 'h2'/g) || []).length < 8) add('thin-structure', item.id, 'Expected at least 8 H2 sections.');
  if ((source.match(/question:/g) || []).length < 5) add('thin-faq', item.id, 'Expected at least 5 FAQs.');
  for (const evidence of [
    'www.gov.uk/government/publications/national-curriculum-in-england-english-programmes-of-study',
    'www.australiancurriculum.edu.au/',
    'educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/oral-language-interventions',
  ]) if (!source.includes(evidence)) add('missing-evidence-source', item.id, evidence);
  if (source.includes('learnphonics.co') || source.includes('readnaturally.com') || source.includes('jollylearning.com')) add('reference-copy-boundary', item.id, 'Reference/competitor sites must not become R21 evidence sources.');
}

if (R21_SPEAKING_COMMUNICATION_CANONICAL_TOPIC_OWNERSHIP.length !== 3) add('ownership-count', 'R21', `Expected 3 new canonical owners, found ${R21_SPEAKING_COMMUNICATION_CANONICAL_TOPIC_OWNERSHIP.length}.`);
if (R21_CANONICAL_TOPIC_OWNERSHIP.length !== R19_CANONICAL_TOPIC_OWNERSHIP.length + 3) add('ownership-composition', 'R21', 'R21 full ownership view must be exactly R19 + 3 speaking owners.');
const ids = R21_CANONICAL_TOPIC_OWNERSHIP.map((item) => item.id);
const intents = R21_CANONICAL_TOPIC_OWNERSHIP.map((item) => String(item.queryIntent || '').trim().toLowerCase());
if (new Set(ids).size !== ids.length) add('duplicate-owner-id', 'R21', 'Canonical topic IDs must be unique.');
if (new Set(intents).size !== intents.length) add('duplicate-query-intent', 'R21', 'Canonical query intents must be unique.');
for (const owner of R21_SPEAKING_COMMUNICATION_CANONICAL_TOPIC_OWNERSHIP) {
  if (!published.some((item) => item.path === owner.ownerPath)) add('owner-without-publication', owner.id, owner.ownerPath);
  if (owner.hubPath !== '/resources/speaking') add('wrong-owner-hub', owner.id, owner.hubPath);
  if (owner.subject !== 'speaking-communication') add('wrong-owner-subject', owner.id, owner.subject);
  if (owner.intent !== 'informational') add('wrong-owner-intent', owner.id, owner.intent);
}

const canonicalById = new Map(CANONICAL_TOPIC_OWNERSHIP.map((entry) => [entry.id, entry]));
for (const [id, expected] of [
  ['speaking-subject-discovery', ['/resources/speaking', 'informational']],
  ['live-public-speaking-classes', ['/speaking', 'high-commercial']],
  ['spoken-english-classes', ['/spoken-english-classes-for-kids-online', 'commercial']],
]) {
  const owner = canonicalById.get(id);
  if (!owner || owner.ownerPath !== expected[0] || owner.intent !== expected[1]) add('commercial-owner-drift', id, JSON.stringify(owner));
}

const legacy = getSpeakingCommunicationContentAuditByAction('consolidate')[0];
if (!legacy || legacy.path !== '/blog/spoken-english-classes-for-kids-confidence' || legacy.consolidationTarget !== '/blog/speaking-confidence-seeds' || legacy.implementationState !== 'hold' || legacy.urlChangeAuthorized || legacy.publicationApproved) add('legacy-hold', 'legacy-hidden-confidence-article', 'R21 must not silently consolidate, redirect or transfer the held legacy URL.');

if (dist) {
  if (!exists('dist/index.html')) add('missing-build', 'R21', 'dist/index.html');
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
      if (/noindex/i.test(html)) add('rendered-noindex', item.id, 'R21 speaking article must remain indexable.');
      if (!html.includes('Speaking & Communication')) add('rendered-discovery-context', item.id, 'Expected rendered speaking/communication context.');
    }
    if (sitemapText && !sitemapText.includes(`/blog/${item.slug}`)) add('missing-sitemap-entry', item.id, item.slug);
  }
  for (const protectedRoute of ['resources/speaking', 'speaking', 'spoken-english-classes-for-kids-online']) {
    if (!exists(`dist/${protectedRoute}/index.html`)) add('missing-protected-route', protectedRoute, `dist/${protectedRoute}/index.html`);
  }
}

const summary = {
  revision: '2026-09-10-r21',
  executionDecisions: SPEAKING_COMMUNICATION_CONTENT_EXECUTION.length,
  published: published.length,
  additiveCanonicalOwners: R21_SPEAKING_COMMUNICATION_CANONICAL_TOPIC_OWNERSHIP.length,
  legacyConsolidationState: legacy?.implementationState ?? null,
  dist,
};
const result = { summary, errors, warnings };
console.log(JSON.stringify(result, null, 2));
if (process.argv.includes('--report')) {
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts/resources-r21-high-value-speaking-content.json'), `${JSON.stringify(result, null, 2)}\n`);
}
if (errors.length) process.exitCode = 1;
else console.log(`PASS: R21 publishes ${summary.published} controlled speaking guides and adds ${summary.additiveCanonicalOwners} canonical intents while preserving speaking commercial ownership and the legacy hold.`);
