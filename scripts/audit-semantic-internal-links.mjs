#!/usr/bin/env node
import {
  CANONICAL_TOPIC_OWNERS_BY_ID,
  getCanonicalTopicOwner,
} from '../src/lib/canonicalTopicOwnershipRegistry.js';
import {
  SEMANTIC_INTERNAL_LINK_GRAPH,
  SEMANTIC_INTERNAL_LINK_RELATIONS,
  SEMANTIC_INTERNAL_LINK_REQUIRED_TOPIC_IDS,
  getSemanticInternalLinksForTopic,
} from '../src/lib/semanticInternalLinkRegistry.js';

const relationTypes = new Set(SEMANTIC_INTERNAL_LINK_RELATIONS);
const sourceIds = new Set();
const inboundCounts = new Map();
const nextEdges = new Map();
let failures = 0;
let edgeCount = 0;

function fail(message) {
  failures += 1;
  console.error(`FAIL: ${message}`);
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

function commercialRole(role) {
  return ['commercial-programme', 'commercial-research', 'commercial-comparison'].includes(role);
}

for (const journey of SEMANTIC_INTERNAL_LINK_GRAPH) {
  if (sourceIds.has(journey.sourceTopicId)) fail(`Duplicate semantic journey source: ${journey.sourceTopicId}`);
  sourceIds.add(journey.sourceTopicId);

  const source = CANONICAL_TOPIC_OWNERS_BY_ID[journey.sourceTopicId];
  if (!source) {
    fail(`Unknown semantic journey source topic: ${journey.sourceTopicId}`);
    continue;
  }

  if (!Array.isArray(journey.links) || journey.links.length === 0) {
    fail(`Semantic journey has no links: ${journey.sourceTopicId}`);
    continue;
  }
  if (journey.links.length > 4) fail(`Semantic journey exceeds four curated links: ${journey.sourceTopicId}`);

  const targetIds = new Set();
  let commercialDestinations = 0;

  for (const link of journey.links) {
    edgeCount += 1;
    if (!relationTypes.has(link.relation)) fail(`Unsupported relation ${link.relation} from ${journey.sourceTopicId}`);
    if (!String(link.label || '').trim()) fail(`Missing link label from ${journey.sourceTopicId} to ${link.targetTopicId}`);
    if (!String(link.rationale || '').trim()) fail(`Missing link rationale from ${journey.sourceTopicId} to ${link.targetTopicId}`);
    if (targetIds.has(link.targetTopicId)) fail(`Duplicate target in semantic journey ${journey.sourceTopicId}: ${link.targetTopicId}`);
    targetIds.add(link.targetTopicId);

    const target = CANONICAL_TOPIC_OWNERS_BY_ID[link.targetTopicId];
    if (!target) {
      fail(`Unknown semantic target ${link.targetTopicId} from ${journey.sourceTopicId}`);
      continue;
    }
    if (link.targetTopicId === journey.sourceTopicId) fail(`Semantic link cannot target itself: ${journey.sourceTopicId}`);
    if (target.ownerPath === source.ownerPath) fail(`Semantic link cannot resolve back to the same canonical owner path: ${journey.sourceTopicId} -> ${link.targetTopicId}`);

    inboundCounts.set(link.targetTopicId, (inboundCounts.get(link.targetTopicId) || 0) + 1);

    if (link.relation === 'practice' && !['activity-guide', 'practice-hub', 'practice-category'].includes(target.ownerRole)) {
      fail(`Practice relation must target a practice owner: ${journey.sourceTopicId} -> ${link.targetTopicId} (${target.ownerRole})`);
    }
    if (link.relation === 'diagnostic' && !['diagnostic-owner', 'problem-landing'].includes(target.ownerRole)) {
      fail(`Diagnostic relation must target a diagnostic/problem owner: ${journey.sourceTopicId} -> ${link.targetTopicId} (${target.ownerRole})`);
    }
    if (link.relation === 'assessment' && target.ownerRole !== 'conversion') {
      fail(`Assessment relation must target the conversion owner: ${journey.sourceTopicId} -> ${link.targetTopicId}`);
    }
    if (link.relation === 'programme' && !commercialRole(target.ownerRole)) {
      fail(`Programme relation must target a commercial owner: ${journey.sourceTopicId} -> ${link.targetTopicId} (${target.ownerRole})`);
    }
    if (['prerequisite', 'next'].includes(link.relation) && (commercialRole(target.ownerRole) || target.ownerRole === 'conversion')) {
      fail(`${link.relation} relation cannot disguise a commercial destination: ${journey.sourceTopicId} -> ${link.targetTopicId}`);
    }

    if (commercialRole(target.ownerRole) || target.ownerRole === 'conversion') commercialDestinations += 1;
    if (link.relation === 'next') {
      if (!nextEdges.has(journey.sourceTopicId)) nextEdges.set(journey.sourceTopicId, []);
      nextEdges.get(journey.sourceTopicId).push(link.targetTopicId);
    }
  }

  if (commercialDestinations > 1) {
    fail(`Semantic journey has more than one commercial/conversion destination: ${journey.sourceTopicId}`);
  }

  const resolved = getSemanticInternalLinksForTopic(journey.sourceTopicId);
  if (resolved.length !== journey.links.length) fail(`Runtime resolver changed link count for ${journey.sourceTopicId}`);
  for (const link of resolved) {
    const target = getCanonicalTopicOwner(link.targetTopicId);
    if (link.to !== target.ownerPath) fail(`Runtime link bypasses canonical owner for ${journey.sourceTopicId} -> ${link.targetTopicId}`);
  }
}

for (const topicId of SEMANTIC_INTERNAL_LINK_REQUIRED_TOPIC_IDS) {
  if (!CANONICAL_TOPIC_OWNERS_BY_ID[topicId]) fail(`Required semantic topic is missing from Brick 5 ownership: ${topicId}`);
  if (!sourceIds.has(topicId)) fail(`Required semantic topic has no outbound journey: ${topicId}`);
}

// Acyclicity is intentionally strict only for directed "next" edges. Related,
// prerequisite and diagnostic links may legitimately point back to context.
const visiting = new Set();
const visited = new Set();
function visitNext(topicId, trail = []) {
  if (visiting.has(topicId)) {
    fail(`Cycle detected in semantic next-step graph: ${[...trail, topicId].join(' -> ')}`);
    return;
  }
  if (visited.has(topicId)) return;
  visiting.add(topicId);
  for (const target of nextEdges.get(topicId) || []) visitNext(target, [...trail, topicId]);
  visiting.delete(topicId);
  visited.add(topicId);
}
for (const topicId of nextEdges.keys()) visitNext(topicId);

if (failures > 0) {
  console.error(`\nSemantic internal-link audit failed with ${failures} error(s).`);
  process.exit(1);
}

pass(`${SEMANTIC_INTERNAL_LINK_GRAPH.length} curated journeys and ${edgeCount} semantic edges resolve through Brick 5 canonical ownership`);
pass(`${SEMANTIC_INTERNAL_LINK_REQUIRED_TOPIC_IDS.length} core editorial/diagnostic topics have explicit outbound journeys`);
pass('Practice, diagnostic, assessment, and programme relations land on role-appropriate canonical owners');
pass('Each journey has at most one commercial/conversion destination');
pass('Directed next-step relationships are acyclic');
console.log('\nSemantic internal-link audit passed.');
