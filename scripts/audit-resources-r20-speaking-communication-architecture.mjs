#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { CANONICAL_TOPIC_OWNERSHIP } from '../src/lib/canonicalTopicOwnershipRegistry.js';
import { R19_CANONICAL_TOPIC_OWNERSHIP } from '../src/lib/grammarWritingSemanticCanonicalOwnership.js';
import { getGrammarWritingSemanticInternalLinksForPath } from '../src/lib/grammarWritingSemanticJourneyGraph.js';
import { PUBLIC_ROUTE_MANIFEST } from '../src/lib/publicRouteManifest.js';
import { ROUTE_SEO_REGISTRY } from '../src/lib/routeSeoRegistry.js';
import {
  SPEAKING_COMMUNICATION_CONTENT_AUDIT,
  SPEAKING_COMMUNICATION_KNOWLEDGE_DOMAINS,
  getSpeakingCommunicationContentAuditByAction,
} from '../src/lib/speakingCommunicationKnowledgeArchitecture.js';

const root = process.cwd();
const distMode = process.argv.includes('--dist');
const allowR21Execution = process.argv.includes('--r21-executed');
const errors = [];
const add = (code, id, detail) => errors.push({ code, id, detail });
const routePaths = new Set(PUBLIC_ROUTE_MANIFEST.map((entry) => entry.path));
const ownersById = new Map(R19_CANONICAL_TOPIC_OWNERSHIP.map((entry) => [entry.id, entry]));
const ownerPaths = new Set(R19_CANONICAL_TOPIC_OWNERSHIP.map((entry) => entry.ownerPath));
let r21ExecutionById = new Map();
if (allowR21Execution) {
  const { SPEAKING_COMMUNICATION_CONTENT_EXECUTION } = await import('../src/lib/speakingCommunicationContentExecutionRegistry.js');
  r21ExecutionById = new Map(SPEAKING_COMMUNICATION_CONTENT_EXECUTION.map((item) => [item.id, item]));
}

const collectFiles = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const absolute = path.join(directory, entry.name);
  return entry.isDirectory() ? collectFiles(absolute) : [absolute];
});
const blogFiles = collectFiles(path.join(root, 'src/content/blog/posts')).filter((file) => file.endsWith('.ts'));
const blogSources = blogFiles.map((file) => ({ file, source: fs.readFileSync(file, 'utf8') }));
const hasBlogSlug = (slug) => blogSources.some(({ source }) => source.includes(`slug: '${slug}'`));

if (SPEAKING_COMMUNICATION_KNOWLEDGE_DOMAINS.length !== 9) add('domain-count', 'R20', 'Expected exactly nine communication domains.');
const domainIds = new Set(SPEAKING_COMMUNICATION_KNOWLEDGE_DOMAINS.map((item) => item.id));
if (domainIds.size !== 9) add('duplicate-domain', 'R20', 'Domain IDs must be unique.');
for (const domain of SPEAKING_COMMUNICATION_KNOWLEDGE_DOMAINS) {
  if (!domain.adjacentDomainIds.length) add('isolated-domain', domain.id, 'Every domain needs meaningful adjacency.');
  for (const adjacent of domain.adjacentDomainIds) if (!domainIds.has(adjacent)) add('unknown-adjacent-domain', domain.id, adjacent);
}

const keep = getSpeakingCommunicationContentAuditByAction('keep');
const consolidate = getSpeakingCommunicationContentAuditByAction('consolidate');
const create = getSpeakingCommunicationContentAuditByAction('create');
if (keep.length !== 10 || consolidate.length !== 1 || create.length !== 3) add('action-counts', 'R20', `Expected 10 KEEP, 1 CONSOLIDATE/HOLD and 3 CREATE proposals; found ${keep.length}/${consolidate.length}/${create.length}.`);

for (const item of keep) {
  const slug = item.path?.replace(/^\/blog\//, '');
  if (!slug || !hasBlogSlug(slug)) add('missing-keep-source', item.id, item.path);
  if (item.implementationState !== 'established') add('keep-state', item.id, item.implementationState);
}
for (const item of SPEAKING_COMMUNICATION_CONTENT_AUDIT.filter((entry) => entry.canonicalTopicId)) {
  const owner = ownersById.get(item.canonicalTopicId);
  if (!owner || owner.ownerPath !== item.path) add('canonical-owner-drift', item.id, `${item.canonicalTopicId} -> ${item.path}`);
}
for (const item of create) {
  const slug = item.proposedPath?.replace(/^\/blog\//, '');
  if (!slug) {
    add('create-path', item.id, item.proposedPath);
    continue;
  }
  if (item.path || item.canonicalTopicId || item.publicationApproved || item.implementationState !== 'proposal-only') add('create-boundary', item.id, 'R20 CREATE planning records must remain proposal-only and ownerless even after downstream execution.');

  if (allowR21Execution) {
    const execution = r21ExecutionById.get(item.id);
    if (!execution || execution.state !== 'published' || execution.path !== item.proposedPath) add('r21-execution-missing', item.id, `Expected published execution at ${item.proposedPath}.`);
    if (!hasBlogSlug(slug)) add('r21-source-missing', item.id, item.proposedPath);
  } else if (hasBlogSlug(slug) || routePaths.has(item.proposedPath) || ROUTE_SEO_REGISTRY[item.proposedPath] || ownerPaths.has(item.proposedPath)) {
    add('create-published', item.id, item.proposedPath);
  }
}
if (allowR21Execution && r21ExecutionById.size !== create.length) add('r21-execution-count', 'R20', `Expected exactly ${create.length} downstream R21 executions, found ${r21ExecutionById.size}.`);

const legacy = consolidate[0];
if (!legacy || legacy.path !== '/blog/spoken-english-classes-for-kids-confidence' || legacy.consolidationTarget !== '/blog/speaking-confidence-seeds' || legacy.implementationState !== 'hold' || legacy.urlChangeAuthorized) add('legacy-hold', 'legacy-hidden-confidence-article', 'R20 must authorize no new redirect, deletion or canonical change.');
if (!hasBlogSlug('spoken-english-classes-for-kids-confidence')) add('legacy-source-missing', 'legacy-hidden-confidence-article', 'The historical source must remain present during audit-only R20.');

const canonicalById = new Map(CANONICAL_TOPIC_OWNERSHIP.map((entry) => [entry.id, entry]));
for (const [id, expected] of [
  ['speaking-subject-discovery', ['/resources/speaking', 'informational']],
  ['live-public-speaking-classes', ['/speaking', 'high-commercial']],
  ['spoken-english-classes', ['/spoken-english-classes-for-kids-online', 'commercial']],
]) {
  const owner = canonicalById.get(id);
  if (!owner || owner.ownerPath !== expected[0] || owner.intent !== expected[1]) add('commercial-owner-drift', id, JSON.stringify(owner));
}

const blending = getGrammarWritingSemanticInternalLinksForPath('/blog/how-kids-learn-blending').map((link) => [link.relation, link.to]);
const expectedBlending = [['prerequisite', '/blog/satpin-phonics-guide'], ['next', '/blog/cvc-words-explained-for-parents'], ['practice', '/blog/phonics-blending-activities'], ['diagnostic', '/blog/why-child-knows-letter-sounds-but-cannot-read-words']];
if (JSON.stringify(blending) !== JSON.stringify(expectedBlending)) add('brick6-regression', 'phonics-blending-progression', JSON.stringify(blending));
const reading = getGrammarWritingSemanticInternalLinksForPath('/blog/how-vocabulary-supports-reading-comprehension').map((link) => link.to);
if (!reading.includes('/blog/phonics-comprehension') || !reading.includes('/blog/why-child-reads-words-but-does-not-understand-story')) add('r16-regression', 'vocabulary-reading-connection', JSON.stringify(reading));
const grammar = getGrammarWritingSemanticInternalLinksForPath('/blog/how-to-teach-paragraph-writing-to-kids').map((link) => link.to);
const expectedGrammar = ['/blog/how-to-improve-sentence-formation-in-kids', '/blog/grammar-conjunctions', '/blog/grammar-creative-writing', '/blog/grammar-editing-camp'];
if (JSON.stringify(grammar) !== JSON.stringify(expectedGrammar)) add('r19-regression', 'paragraph-writing-guide', JSON.stringify(grammar));

if (distMode) {
  for (const item of keep) {
    const html = path.join(root, 'dist', ...item.path.slice(1).split('/'), 'index.html');
    if (!fs.existsSync(html)) add('missing-rendered-keep', item.id, item.path);
  }
  for (const item of create) {
    const html = path.join(root, 'dist', ...item.proposedPath.slice(1).split('/'), 'index.html');
    if (allowR21Execution) {
      if (!fs.existsSync(html)) add('missing-rendered-r21-execution', item.id, item.proposedPath);
    } else if (fs.existsSync(html)) add('rendered-create-proposal', item.id, item.proposedPath);
  }
  for (const route of ['/resources/speaking', '/speaking', '/spoken-english-classes-for-kids-online']) {
    const html = path.join(root, 'dist', ...route.slice(1).split('/'), 'index.html');
    if (!fs.existsSync(html)) add('missing-protected-route', route, html);
  }
}

const report = {
  brick: 'R20',
  revision: '2026-09-09-r20',
  domains: SPEAKING_COMMUNICATION_KNOWLEDGE_DOMAINS.length,
  keep: keep.length,
  consolidateHold: consolidate.length,
  createProposals: create.length,
  downstreamExecuted: allowR21Execution ? r21ExecutionById.size : 0,
  publishedCreates: allowR21Execution ? r21ExecutionById.size : 0,
  distMode,
  errors,
};
console.log(JSON.stringify(report, null, 2));
if (process.argv.includes('--report')) {
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts/resources-r20-speaking-communication-architecture.json'), `${JSON.stringify(report, null, 2)}\n`);
}
if (errors.length) process.exitCode = 1;
else console.log(allowR21Execution
  ? 'PASS: R20 planning remains intact and exactly 3 explicit R21 speaking content executions are present.'
  : 'PASS: R20 preserves 10 strong speaking owners, holds 1 legacy consolidation candidate and keeps 3 CREATE records unpublished.');
