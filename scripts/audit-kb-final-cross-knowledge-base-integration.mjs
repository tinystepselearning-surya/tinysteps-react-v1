import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CANONICAL_TOPIC_OWNERSHIP } from '../src/lib/canonicalTopicOwnershipRegistry.js';
import { PUBLIC_ROUTE_MANIFEST } from '../src/lib/publicRouteManifest.js';
import {
  KNOWLEDGE_BASE_FINAL_POLICY,
  KNOWLEDGE_BASE_FINAL_PROTECTED_COMMERCIAL_OWNERS,
  KNOWLEDGE_BASE_FINAL_PROTECTED_HUBS,
  KNOWLEDGE_BASE_FINAL_REVISION,
  KNOWLEDGE_BASE_FINAL_SESSIONS,
  KNOWLEDGE_BASE_FINAL_STATUS,
} from '../src/lib/knowledgeBaseFinalClosure.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warnings = [];
const add = (code, detail) => errors.push({ code, detail });

const routeByPath = new Map(PUBLIC_ROUTE_MANIFEST.map((route) => [route.path, route]));
const topicById = new Map(CANONICAL_TOPIC_OWNERSHIP.map((topic) => [topic.id, topic]));

if (KNOWLEDGE_BASE_FINAL_REVISION !== '2026-09-10-kb-final') add('revision-drift', KNOWLEDGE_BASE_FINAL_REVISION);
if (KNOWLEDGE_BASE_FINAL_STATUS !== 'frozen') add('status-drift', KNOWLEDGE_BASE_FINAL_STATUS);
if (KNOWLEDGE_BASE_FINAL_SESSIONS.length !== 3) add('session-count', `Expected 3, found ${KNOWLEDGE_BASE_FINAL_SESSIONS.length}`);
if (KNOWLEDGE_BASE_FINAL_SESSIONS.some((session) => session.status !== 'frozen')) add('session-not-frozen', JSON.stringify(KNOWLEDGE_BASE_FINAL_SESSIONS));
if (KNOWLEDGE_BASE_FINAL_PROTECTED_HUBS.join('|') !== '/resources/phonics|/resources/grammar|/resources/speaking') add('hub-scope-drift', KNOWLEDGE_BASE_FINAL_PROTECTED_HUBS.join(','));
if (KNOWLEDGE_BASE_FINAL_PROTECTED_COMMERCIAL_OWNERS.length !== 8) add('commercial-owner-count', `Expected 8, found ${KNOWLEDGE_BASE_FINAL_PROTECTED_COMMERCIAL_OWNERS.length}`);
if (new Set(KNOWLEDGE_BASE_FINAL_PROTECTED_COMMERCIAL_OWNERS.map((owner) => owner.path)).size !== KNOWLEDGE_BASE_FINAL_PROTECTED_COMMERCIAL_OWNERS.length) add('duplicate-commercial-path', 'Protected commercial owner paths must be unique.');

for (const session of KNOWLEDGE_BASE_FINAL_SESSIONS) {
  if (!fs.existsSync(path.join(root, session.closureEvidence))) add('missing-session-closure-evidence', `${session.id}: ${session.closureEvidence}`);
}
for (const candidate of [...KNOWLEDGE_BASE_FINAL_PROTECTED_HUBS, ...KNOWLEDGE_BASE_FINAL_PROTECTED_COMMERCIAL_OWNERS.map((owner) => owner.path)]) {
  const route = routeByPath.get(candidate);
  if (!route) {
    add('missing-public-route', candidate);
    continue;
  }
  if (!route.indexable || !route.prerender || !route.sitemap || route.canonicalPath !== candidate) add('route-contract-drift', `${candidate}: ${JSON.stringify(route)}`);
}
for (const owner of KNOWLEDGE_BASE_FINAL_PROTECTED_COMMERCIAL_OWNERS.filter((entry) => entry.topicId)) {
  const topic = topicById.get(owner.topicId);
  if (!topic || topic.ownerPath !== owner.path) add('canonical-commercial-owner-drift', `${owner.topicId}: expected ${owner.path}, got ${topic?.ownerPath ?? 'missing'}`);
}

const topicIds = CANONICAL_TOPIC_OWNERSHIP.map((topic) => topic.id);
const queryIntents = CANONICAL_TOPIC_OWNERSHIP.map((topic) => topic.queryIntent.trim().toLowerCase());
if (new Set(topicIds).size !== topicIds.length) add('duplicate-topic-id', 'Canonical topic IDs are no longer unique.');
if (new Set(queryIntents).size !== queryIntents.length) add('duplicate-query-intent', 'Canonical query-intent owners are no longer unique.');

for (const topic of CANONICAL_TOPIC_OWNERSHIP.filter((entry) => KNOWLEDGE_BASE_FINAL_PROTECTED_HUBS.includes(entry.ownerPath))) {
  if (topic.ownerRole !== 'subject-hub' || topic.intent !== 'informational') add('hub-ownership-leakage', `${topic.id}: ${topic.ownerRole}/${topic.intent}`);
}

if (KNOWLEDGE_BASE_FINAL_POLICY.informationalExpansion !== 'frozen') add('informational-expansion-open', KNOWLEDGE_BASE_FINAL_POLICY.informationalExpansion);
if (KNOWLEDGE_BASE_FINAL_POLICY.commercialSeoExpansion !== 'separate-project') add('commercial-boundary-drift', KNOWLEDGE_BASE_FINAL_POLICY.commercialSeoExpansion);
if (KNOWLEDGE_BASE_FINAL_POLICY.keywordResearch !== 'commercial-project') add('keyword-boundary-drift', KNOWLEDGE_BASE_FINAL_POLICY.keywordResearch);

const closureSource = fs.readFileSync(path.join(root, 'src/lib/knowledgeBaseFinalClosure.js'), 'utf8');
for (const forbidden of ["ownerPath: '/blog/", 'newArticle', 'publicationApproved: true']) {
  if (closureSource.includes(forbidden)) add('kb-final-content-expansion', forbidden);
}

const report = {
  brick: 'KB-FINAL',
  revision: KNOWLEDGE_BASE_FINAL_REVISION,
  status: errors.length ? 'fail' : 'pass',
  frozenSessions: KNOWLEDGE_BASE_FINAL_SESSIONS.map(({ id, label, status }) => ({ id, label, status })),
  protectedHubs: KNOWLEDGE_BASE_FINAL_PROTECTED_HUBS,
  protectedCommercialOwners: KNOWLEDGE_BASE_FINAL_PROTECTED_COMMERCIAL_OWNERS.map(({ id, path, subject, topicId }) => ({ id, path, subject, topicId })),
  canonicalTopicsChecked: CANONICAL_TOPIC_OWNERSHIP.length,
  publicRoutesChecked: PUBLIC_ROUTE_MANIFEST.length,
  policy: KNOWLEDGE_BASE_FINAL_POLICY,
  errors,
  warnings,
};

console.log(JSON.stringify(report, null, 2));
if (process.argv.includes('--report')) {
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts/kb-final-cross-knowledge-base-integration.json'), `${JSON.stringify(report, null, 2)}\n`);
}
if (errors.length) {
  console.error(`FAIL: KB-FINAL found ${errors.length} integration error(s).`);
  process.exit(1);
}
console.log('PASS: Sessions A, B and C remain frozen, knowledge hubs are discovery-only, protected commercial owners are intact, and commercial SEO remains a separate downstream project. TINY STEPS KNOWLEDGE BASE = FROZEN.');
