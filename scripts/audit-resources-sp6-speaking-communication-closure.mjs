#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { CANONICAL_TOPIC_OWNERSHIP } from '../src/lib/canonicalTopicOwnershipRegistry.js';
import { SPEAKING_COMMUNICATION_KNOWLEDGE_DOMAINS, getSpeakingCommunicationContentAuditByAction } from '../src/lib/speakingCommunicationKnowledgeArchitecture.js';
import { R22_CANONICAL_TOPIC_OWNERSHIP } from '../src/lib/speakingCommunicationSemanticCanonicalOwnership.js';
import { getSpeakingCommunicationSemanticInternalLinksForPath as getR22Links } from '../src/lib/speakingCommunicationSemanticJourneyGraph.js';
import {
  SPEAKING_COMMUNICATION_COMPLETION_REVISION,
  SPEAKING_COMMUNICATION_COMPLETION_BRICKS,
  SPEAKING_COMMUNICATION_FREEZE,
  SPEAKING_COMMUNICATION_PARENT_PROBLEM_ROUTES,
  SPEAKING_COMMUNICATION_POST_R22_GAPS,
  SPEAKING_COMMUNICATION_PRACTICE_ROUTES,
  SPEAKING_COMMUNICATION_TIER1_CLUSTER_OWNERS,
} from '../src/lib/speakingCommunicationCompletionArchitecture.js';
import {
  SP6_CANONICAL_TOPIC_OWNERSHIP,
  SP6_SPEAKING_COMMUNICATION_ADDITIVE_CANONICAL_OWNERSHIP,
  getSP6CanonicalTopicOwnerPath,
} from '../src/lib/speakingCommunicationCompletionCanonicalOwnership.js';
import {
  SP6_SPEAKING_COMMUNICATION_SEMANTIC_JOURNEYS,
  getSpeakingCommunicationSemanticInternalLinksForPath as getSP6Links,
} from '../src/lib/speakingCommunicationCompletionSemanticJourneyGraph.js';

const root = process.cwd();
const distMode = process.argv.includes('--dist');
const errors = [];
const warnings = [];
const add = (code, id, detail) => errors.push({ code, id, detail });
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const educationalOptions = { limit: 4, excludeRelations: ['assessment', 'programme'] };

if (SPEAKING_COMMUNICATION_COMPLETION_BRICKS.length !== 7) add('brick-count', 'SP0-SP6', `Expected 7 bricks, found ${SPEAKING_COMMUNICATION_COMPLETION_BRICKS.length}.`);
if (SPEAKING_COMMUNICATION_COMPLETION_BRICKS.map((entry) => entry.id).join(',') !== 'SP0,SP1,SP2,SP3,SP4,SP5,SP6') add('brick-order', 'SP0-SP6', 'Completion brick IDs must remain SP0 through SP6.');
if (SPEAKING_COMMUNICATION_FREEZE.state !== 'frozen' || SPEAKING_COMMUNICATION_FREEZE.contentExpansionAllowed !== false) add('freeze-state', 'SP6', JSON.stringify(SPEAKING_COMMUNICATION_FREEZE));

if (SPEAKING_COMMUNICATION_POST_R22_GAPS.length !== 5) add('gap-count', 'SP0', `Expected five post-R22 gaps, found ${SPEAKING_COMMUNICATION_POST_R22_GAPS.length}.`);
if (SPEAKING_COMMUNICATION_POST_R22_GAPS.some((entry) => entry.action === 'create')) add('thin-expansion', 'SP0', 'No post-R22 gap may create a new content URL.');
const classroomGap = SPEAKING_COMMUNICATION_POST_R22_GAPS.find((entry) => entry.id === 'classroom-communication-semantic-integration');
if (!classroomGap || classroomGap.ownerPath !== '/blog/back-to-school-english-confidence-plan' || classroomGap.action !== 'register-existing-owner') add('classroom-gap', 'SP0', 'Classroom communication must be registered as an existing owner, not recreated.');

if (SPEAKING_COMMUNICATION_TIER1_CLUSTER_OWNERS.length !== 15) add('cluster-count', 'SP6', `Expected 15 Tier-1 cluster records, found ${SPEAKING_COMMUNICATION_TIER1_CLUSTER_OWNERS.length}.`);
const domainIds = new Set(SPEAKING_COMMUNICATION_KNOWLEDGE_DOMAINS.map((entry) => entry.id));
for (const cluster of SPEAKING_COMMUNICATION_TIER1_CLUSTER_OWNERS) if (!domainIds.has(cluster.domainId)) add('unknown-domain', cluster.id, cluster.domainId);
for (const domainId of domainIds) if (!SPEAKING_COMMUNICATION_TIER1_CLUSTER_OWNERS.some((entry) => entry.domainId === domainId)) add('unowned-domain', domainId, 'Every R20 communication domain needs at least one Tier-1 owner.');

if (SPEAKING_COMMUNICATION_PARENT_PROBLEM_ROUTES.length !== 9) add('parent-problem-count', 'SP5', `Expected 9 parent problem routes, found ${SPEAKING_COMMUNICATION_PARENT_PROBLEM_ROUTES.length}.`);
for (const route of SPEAKING_COMMUNICATION_PARENT_PROBLEM_ROUTES) {
  if (!route.ownerPath || !route.practicePath) add('parent-route-incomplete', route.id, JSON.stringify(route));
  if (route.ownerPath === '/speaking' || route.ownerPath === '/spoken-english-classes-for-kids-online') add('commercial-as-problem-owner', route.id, route.ownerPath);
}

if (SPEAKING_COMMUNICATION_PRACTICE_ROUTES.length !== 9) add('practice-count', 'SP5', `Expected one practice route for each R20 domain; found ${SPEAKING_COMMUNICATION_PRACTICE_ROUTES.length}.`);
const practiceDomains = new Set(SPEAKING_COMMUNICATION_PRACTICE_ROUTES.map((entry) => entry.domainId));
for (const domainId of domainIds) if (!practiceDomains.has(domainId)) add('practice-gap', domainId, 'Missing practice continuation.');

if (SP6_SPEAKING_COMMUNICATION_ADDITIVE_CANONICAL_OWNERSHIP.length !== 1) add('additive-owner-count', 'SP6', `Expected exactly one additive existing owner, found ${SP6_SPEAKING_COMMUNICATION_ADDITIVE_CANONICAL_OWNERSHIP.length}.`);
if (SP6_CANONICAL_TOPIC_OWNERSHIP.length !== R22_CANONICAL_TOPIC_OWNERSHIP.length + 1) add('ownership-view', 'SP6', 'SP6 ownership must be exactly R22 plus the classroom owner.');
if (getSP6CanonicalTopicOwnerPath('classroom-communication-guide') !== '/blog/back-to-school-english-confidence-plan') add('classroom-owner', 'classroom-communication-guide', getSP6CanonicalTopicOwnerPath('classroom-communication-guide'));
for (const [label, values] of [
  ['topic id', SP6_CANONICAL_TOPIC_OWNERSHIP.map((entry) => entry.id)],
  ['query intent', SP6_CANONICAL_TOPIC_OWNERSHIP.map((entry) => String(entry.queryIntent || '').trim().toLowerCase())],
]) if (new Set(values).size !== values.length) add('duplicate-owner', label, `Duplicate ${label} in SP6 ownership.`);

if (SP6_SPEAKING_COMMUNICATION_SEMANTIC_JOURNEYS.length !== 4) add('completion-journey-count', 'SP6', `Expected four narrow completion journeys, found ${SP6_SPEAKING_COMMUNICATION_SEMANTIC_JOURNEYS.length}.`);
for (const journey of SP6_SPEAKING_COMMUNICATION_SEMANTIC_JOURNEYS) {
  if (!getSP6CanonicalTopicOwnerPath(journey.sourceTopicId)) add('unknown-source', journey.sourceTopicId, 'Completion journey source must resolve.');
  for (const link of journey.links) if (!getSP6CanonicalTopicOwnerPath(link.targetTopicId)) add('unknown-target', journey.sourceTopicId, link.targetTopicId);
}

const protectedR22Paths = [
  '/blog/conversation-skills-for-kids',
  '/blog/child-gives-one-word-answers',
  '/blog/how-to-teach-storytelling-to-kids',
  '/blog/speaking-structure',
  '/blog/public-speaking-delivery-for-kids',
  '/blog/speaking-confidence-seeds',
  '/blog/speaking-debate-starters',
  '/blog/speaking-video-feedback',
];
for (const pathname of protectedR22Paths) {
  const before = getR22Links(pathname, educationalOptions).map((link) => [link.relation, link.to]);
  const after = getSP6Links(pathname, educationalOptions).map((link) => [link.relation, link.to]);
  if (JSON.stringify(before) !== JSON.stringify(after)) add('r22-visible-regression', pathname, `Expected ${JSON.stringify(before)}, got ${JSON.stringify(after)}.`);
}

const classroomExpected = [
  ['diagnostic', '/blog/child-understands-english-but-does-not-speak'],
  ['related', '/blog/conversation-skills-for-kids'],
  ['related', '/blog/how-to-improve-sentence-formation-in-kids'],
  ['practice', '/blog/speaking-family-showcase'],
];
const classroomActual = getSP6Links('/blog/back-to-school-english-confidence-plan', educationalOptions).map((link) => [link.relation, link.to]);
if (JSON.stringify(classroomActual) !== JSON.stringify(classroomExpected)) add('classroom-journey', 'classroom-communication-guide', `Expected ${JSON.stringify(classroomExpected)}, got ${JSON.stringify(classroomActual)}.`);
for (const sourcePath of ['/blog/conversation-skills-for-kids', '/blog/speaking-confidence-seeds']) {
  if (!getSP6Links(sourcePath).some((link) => link.to === '/blog/back-to-school-english-confidence-plan')) add('missing-inbound', sourcePath, '/blog/back-to-school-english-confidence-plan');
}

const conversationSource = read('src/content/blog/posts/public-speaking/conversation-skills-for-kids.ts');
if (!conversationSource.includes('When vocabulary disappears during speaking: RETRIEVE → USE → REUSE')) add('vocabulary-refresh', 'SP1', 'Conversation owner must close spoken-vocabulary retrieval transfer.');
if (!conversationSource.includes('/blog/how-to-improve-sentence-formation-in-kids')) add('sentence-formation-bridge', 'SP1', 'Conversation owner must route formulation difficulty to the existing sentence-formation owner.');
if (!conversationSource.includes('/blog/back-to-school-english-confidence-plan')) add('classroom-inline-inbound', 'SP1', 'Conversation owner needs contextual classroom transfer linking.');

const storytellingSource = read('src/content/blog/posts/public-speaking/how-to-teach-storytelling-to-kids.ts');
if (!storytellingSource.includes('Retelling and summarising are different speaking jobs')) add('summarising-refresh', 'SP2', 'Storytelling owner must explicitly distinguish oral retelling from summarising.');
if (!storytellingSource.includes('If the listener only needs the most important part, what must stay?')) add('summarising-practice', 'SP2', 'Storytelling owner needs a practical oral-summary prompt.');

for (const [topicId, expectedPath] of [
  ['speaking-debate-guide', '/blog/speaking-debate-starters'],
  ['speech-structure-guide', '/blog/speaking-structure'],
  ['public-speaking-delivery-guide', '/blog/public-speaking-delivery-for-kids'],
]) if (getSP6CanonicalTopicOwnerPath(topicId) !== expectedPath) add('protected-speaking-owner', topicId, getSP6CanonicalTopicOwnerPath(topicId));

const deliverySource = read('src/content/blog/posts/public-speaking/public-speaking-delivery-for-kids.ts');
for (const phrase of ['Intelligibility is more useful than accent conformity', 'Constant eye contact is not a universal requirement']) if (!deliverySource.includes(phrase)) add('delivery-safety-boundary', 'SP4', phrase);

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
if (!legacy || legacy.path !== '/blog/spoken-english-classes-for-kids-confidence' || legacy.consolidationTarget !== '/blog/speaking-confidence-seeds' || legacy.implementationState !== 'hold' || legacy.urlChangeAuthorized || legacy.publicationApproved) add('legacy-hold', 'legacy-hidden-confidence-article', 'SP6 must preserve the R20 HOLD boundary exactly.');

const pathwaySource = read('src/components/blog/BlogSemanticPathway.tsx');
if (!pathwaySource.includes("from '../../lib/speakingCommunicationCompletionSemanticJourneyGraph.js'")) add('runtime-adapter', 'BlogSemanticPathway', 'Runtime must compose through the SP6 completion adapter.');
if (!pathwaySource.includes("excludeRelations: ['assessment', 'programme']")) add('commercial-ui-boundary', 'BlogSemanticPathway', 'Educational pathway must continue excluding assessment/programme links.');

function distHtmlPath(pathname) {
  const clean = pathname.replace(/^\/+|\/+$/g, '');
  return path.join(root, 'dist', clean, 'index.html');
}

if (distMode) {
  const classroomFile = distHtmlPath('/blog/back-to-school-english-confidence-plan');
  if (!fs.existsSync(classroomFile)) add('missing-rendered-page', 'classroom-communication-guide', path.relative(root, classroomFile));
  else {
    const html = fs.readFileSync(classroomFile, 'utf8');
    if (!html.includes('data-semantic-internal-links="true"')) add('missing-rendered-journey', 'classroom-communication-guide', 'Semantic pathway missing.');
    for (const href of classroomExpected.map((entry) => entry[1])) if (!html.includes(`href="${href}"`)) add('missing-rendered-classroom-link', 'classroom-communication-guide', href);
  }

  for (const [pathname, phrase] of [
    ['/blog/conversation-skills-for-kids', 'RETRIEVE → USE → REUSE'],
    ['/blog/how-to-teach-storytelling-to-kids', 'Retelling and summarising are different speaking jobs'],
  ]) {
    const file = distHtmlPath(pathname);
    if (!fs.existsSync(file)) add('missing-rendered-page', pathname, path.relative(root, file));
    else if (!fs.readFileSync(file, 'utf8').includes(phrase)) add('missing-rendered-refresh', pathname, phrase);
  }
}

const summary = {
  revision: SPEAKING_COMMUNICATION_COMPLETION_REVISION,
  bricks: SPEAKING_COMMUNICATION_COMPLETION_BRICKS.length,
  postR22Gaps: SPEAKING_COMMUNICATION_POST_R22_GAPS.length,
  tier1Clusters: SPEAKING_COMMUNICATION_TIER1_CLUSTER_OWNERS.length,
  parentProblems: SPEAKING_COMMUNICATION_PARENT_PROBLEM_ROUTES.length,
  practiceRoutes: SPEAKING_COMMUNICATION_PRACTICE_ROUTES.length,
  additiveCanonicalOwners: SP6_SPEAKING_COMMUNICATION_ADDITIVE_CANONICAL_OWNERSHIP.length,
  completionJourneys: SP6_SPEAKING_COMMUNICATION_SEMANTIC_JOURNEYS.length,
  state: SPEAKING_COMMUNICATION_FREEZE.state,
  dist: distMode,
};
const result = { summary, errors, warnings };
console.log(JSON.stringify(result, null, 2));
if (process.argv.includes('--report')) {
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts/resources-sp6-speaking-communication-closure.json'), `${JSON.stringify(result, null, 2)}\n`);
}
if (errors.length) process.exitCode = 1;
else console.log(`PASS: Session C closes SP0-SP6 with ${summary.tier1Clusters} Tier-1 cluster records, ${summary.parentProblems} parent problem routes, ${summary.practiceRoutes} practice routes and no thin-page expansion. SPEAKING & COMMUNICATION = FROZEN.`);
