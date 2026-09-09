#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  READING_CONTENT_ACTIONS,
  READING_CONTENT_AUDIT,
  READING_KNOWLEDGE_DOMAINS,
  READING_KNOWLEDGE_REVISION,
} from '../src/lib/readingKnowledgeArchitecture.js';
import { getCanonicalTopicOwnerPath } from '../src/lib/canonicalTopicOwnershipRegistry.js';

const root = process.cwd();
const errors = [];
const warnings = [];
const add = (code, id, detail) => errors.push({ code, id, detail });
const allowR15Execution = process.argv.includes('--r15-executed');
let r15ExecutionById = new Map();
if (allowR15Execution) {
  const { READING_CONTENT_EXECUTION } = await import('../src/lib/readingContentExecutionRegistry.js');
  r15ExecutionById = new Map(READING_CONTENT_EXECUTION.map((item) => [item.id, item]));
}

const domainIds = READING_KNOWLEDGE_DOMAINS.map((item) => item.id);
if (READING_KNOWLEDGE_DOMAINS.length !== 9) add('domain-count', 'reading-knowledge', `Expected 9 domains, found ${READING_KNOWLEDGE_DOMAINS.length}.`);
if (new Set(domainIds).size !== domainIds.length) add('duplicate-domain', 'reading-knowledge', 'Reading knowledge domain IDs must be unique.');
if (READING_KNOWLEDGE_DOMAINS.map((item) => item.order).join(',') !== '1,2,3,4,5,6,7,8,9') add('domain-order', 'reading-knowledge', 'Domain order must remain explicit and stable.');
const domainSet = new Set(domainIds);
for (const domain of READING_KNOWLEDGE_DOMAINS) {
  for (const adjacentId of domain.adjacentDomainIds) if (!domainSet.has(adjacentId)) add('unknown-adjacent-domain', domain.id, adjacentId);
  if (!domain.summary || domain.summary.length < 40) add('thin-domain-summary', domain.id, 'Domain summaries must be substantive enough for editorial use.');
}

const auditIds = READING_CONTENT_AUDIT.map((item) => item.id);
if (new Set(auditIds).size !== auditIds.length) add('duplicate-audit-id', 'content-audit', 'Audit IDs must be unique.');
for (const item of READING_CONTENT_AUDIT) {
  if (!domainSet.has(item.domainId)) add('unknown-domain', item.id, item.domainId);
  if (!READING_CONTENT_ACTIONS.includes(item.action)) add('unknown-action', item.id, item.action);
  if (!item.reasons?.length) add('missing-reason', item.id, 'Every content decision needs a reason.');
  if (item.action === 'create') {
    if (item.path) add('create-has-live-path', item.id, item.path);
    if (!item.proposedPath?.startsWith('/blog/')) add('create-missing-proposed-path', item.id, item.proposedPath);
  } else {
    if (!item.path?.startsWith('/blog/')) add('existing-missing-path', item.id, item.path);
    if (item.proposedPath) add('existing-has-proposed-path', item.id, item.proposedPath);
  }
  if (item.canonicalTopicId) {
    const owner = getCanonicalTopicOwnerPath(item.canonicalTopicId);
    if (owner !== item.path) add('canonical-owner-mismatch', item.id, `${item.canonicalTopicId}: expected ${item.path}, got ${owner}`);
  }
}

const createRecords = READING_CONTENT_AUDIT.filter((item) => item.action === 'create');
if (createRecords.length !== 3) add('create-gap-count', 'content-audit', `Expected 3 controlled gaps, found ${createRecords.length}.`);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
}
const publicationSurfaces = [
  ...walk(path.join(root, 'src/content/blog/posts')),
  path.join(root, 'src/lib/publicRouteManifest.js'),
  path.join(root, 'src/lib/routeSeoRegistry.js'),
  path.join(root, 'public/llms.txt'),
  path.join(root, 'public/llms-full.txt'),
  path.join(root, 'public/sitemap-blog.xml'),
].filter((file) => fs.existsSync(file));

for (const item of createRecords) {
  const slug = item.proposedPath.split('/').filter(Boolean).at(-1);
  const execution = r15ExecutionById.get(item.id);
  const explicitlyExecuted = allowR15Execution && execution?.state === 'published' && execution.path === item.proposedPath;
  let occurrences = 0;
  for (const file of publicationSurfaces) {
    const text = fs.readFileSync(file, 'utf8');
    if (!text.includes(slug)) continue;
    occurrences += 1;
    if (!explicitlyExecuted) add('gap-already-published', item.id, path.relative(root, file));
  }
  if (allowR15Execution && !explicitlyExecuted) add('gap-missing-r15-execution', item.id, item.proposedPath);
  if (allowR15Execution && explicitlyExecuted && occurrences === 0) add('executed-gap-not-found', item.id, item.proposedPath);
}

const source = fs.readFileSync(path.join(root, 'src/lib/readingKnowledgeArchitecture.js'), 'utf8');
if (!source.includes('not a claim that reading develops in one rigid staircase')) add('missing-non-linear-boundary', 'reading-knowledge', 'Architecture must preserve the non-rigid-development caveat.');
if (!source.includes('One substantial comparison/learning-path resource is preferable to multiple thin definition pages.')) add('thin-page-guard-missing', 'phonological-phonemic-phonics-boundary', 'The primary new awareness gap must remain one substantial parent resource, not thin fragments.');

const summary = {
  revision: READING_KNOWLEDGE_REVISION,
  domains: READING_KNOWLEDGE_DOMAINS.length,
  auditedHighValueItems: READING_CONTENT_AUDIT.length,
  keep: READING_CONTENT_AUDIT.filter((item) => item.action === 'keep').length,
  refresh: READING_CONTENT_AUDIT.filter((item) => item.action === 'refresh').length,
  consolidate: READING_CONTENT_AUDIT.filter((item) => item.action === 'consolidate').length,
  create: createRecords.length,
  downstreamExecuted: allowR15Execution ? createRecords.filter((item) => r15ExecutionById.get(item.id)?.state === 'published').length : 0,
};

const result = { summary, errors, warnings };
console.log(JSON.stringify(result, null, 2));
if (process.argv.includes('--report')) {
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts/resources-r14-reading-knowledge-architecture.json'), `${JSON.stringify(result, null, 2)}\n`);
}
if (errors.length) process.exitCode = 1;
else console.log(allowR15Execution
  ? `PASS: R14 planning remains intact and exactly ${summary.downstreamExecuted} controlled CREATE gaps are explicitly executed by R15.`
  : `PASS: R14 maps ${summary.domains} reading domains, protects ${summary.keep + summary.refresh} existing high-value owners, and records only ${summary.create} unpublished content gaps.`);
