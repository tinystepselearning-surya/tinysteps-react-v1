#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  GRAMMAR_WRITING_CONTENT_ACTIONS,
  GRAMMAR_WRITING_CONTENT_AUDIT,
  GRAMMAR_WRITING_KNOWLEDGE_DOMAINS,
  GRAMMAR_WRITING_KNOWLEDGE_REVISION,
} from '../src/lib/grammarWritingKnowledgeArchitecture.js';
import { getCanonicalTopicOwnerPath } from '../src/lib/canonicalTopicOwnershipRegistry.js';

const root = process.cwd();
const errors = [];
const warnings = [];
const add = (code, id, detail) => errors.push({ code, id, detail });

const domainIds = GRAMMAR_WRITING_KNOWLEDGE_DOMAINS.map((item) => item.id);
if (GRAMMAR_WRITING_KNOWLEDGE_DOMAINS.length !== 9) add('domain-count', 'grammar-writing', `Expected 9 domains, found ${GRAMMAR_WRITING_KNOWLEDGE_DOMAINS.length}.`);
if (new Set(domainIds).size !== domainIds.length) add('duplicate-domain', 'grammar-writing', 'Domain IDs must be unique.');
if (GRAMMAR_WRITING_KNOWLEDGE_DOMAINS.map((item) => item.order).join(',') !== '1,2,3,4,5,6,7,8,9') add('domain-order', 'grammar-writing', 'Domain order must remain explicit and stable.');
const domainSet = new Set(domainIds);
for (const domain of GRAMMAR_WRITING_KNOWLEDGE_DOMAINS) {
  if (!domain.summary || domain.summary.length < 60) add('thin-domain-summary', domain.id, 'Domain summary is too thin for editorial use.');
  for (const adjacentId of domain.adjacentDomainIds) if (!domainSet.has(adjacentId)) add('unknown-adjacent-domain', domain.id, adjacentId);
}

const auditIds = GRAMMAR_WRITING_CONTENT_AUDIT.map((item) => item.id);
if (new Set(auditIds).size !== auditIds.length) add('duplicate-audit-id', 'grammar-writing-audit', 'Audit IDs must be unique.');
for (const item of GRAMMAR_WRITING_CONTENT_AUDIT) {
  if (!domainSet.has(item.domainId)) add('unknown-domain', item.id, item.domainId);
  if (!GRAMMAR_WRITING_CONTENT_ACTIONS.includes(item.action)) add('unknown-action', item.id, item.action);
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

const creates = GRAMMAR_WRITING_CONTENT_AUDIT.filter((item) => item.action === 'create');
if (creates.length !== 2) add('create-gap-count', 'grammar-writing-audit', `Expected exactly 2 controlled gaps, found ${creates.length}.`);
const expectedCreateIds = ['punctuation-capitalisation-parent-guide', 'paragraph-writing-parent-guide'];
if (JSON.stringify(creates.map((item) => item.id)) !== JSON.stringify(expectedCreateIds)) add('unexpected-create-gaps', 'grammar-writing-audit', creates.map((item) => item.id).join(', '));

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
for (const item of creates) {
  const slug = item.proposedPath.split('/').filter(Boolean).at(-1);
  for (const file of publicationSurfaces) {
    const text = fs.readFileSync(file, 'utf8');
    if (text.includes(slug)) add('gap-already-published', item.id, path.relative(root, file));
  }
}

const source = fs.readFileSync(path.join(root, 'src/lib/grammarWritingKnowledgeArchitecture.js'), 'utf8');
if (!source.includes('not a claim that grammar and writing develop in one')) add('missing-nonlinear-boundary', 'grammar-writing', 'Architecture must preserve the non-rigid-development caveat.');
if (!source.includes('separate generic parts-of-speech pillar would add little value')) add('parts-of-speech-guard', 'grammar-roadmap', 'R17 must preserve the broad roadmap instead of splitting a thin parts-of-speech pillar.');
if (!source.includes('One substantial conventions guide is preferable to thin pages')) add('punctuation-thin-page-guard', 'punctuation-capitalisation-parent-guide', 'Punctuation must remain one useful parent resource rather than multiple thin definition pages.');

const summary = {
  revision: GRAMMAR_WRITING_KNOWLEDGE_REVISION,
  domains: GRAMMAR_WRITING_KNOWLEDGE_DOMAINS.length,
  auditedHighValueItems: GRAMMAR_WRITING_CONTENT_AUDIT.length,
  keep: GRAMMAR_WRITING_CONTENT_AUDIT.filter((item) => item.action === 'keep').length,
  refresh: GRAMMAR_WRITING_CONTENT_AUDIT.filter((item) => item.action === 'refresh').length,
  consolidate: GRAMMAR_WRITING_CONTENT_AUDIT.filter((item) => item.action === 'consolidate').length,
  create: creates.length,
};
const result = { summary, errors, warnings };
console.log(JSON.stringify(result, null, 2));
if (process.argv.includes('--report')) {
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts/resources-r17-grammar-writing-architecture.json'), `${JSON.stringify(result, null, 2)}\n`);
}
if (errors.length) process.exitCode = 1;
else console.log(`PASS: R17 maps ${summary.domains} grammar/writing domains, protects ${summary.keep} strong existing owners, and records only ${summary.create} unpublished content gaps.`);
