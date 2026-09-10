import { getSpeakingCommunicationSemanticInternalLinksForPath as getR22SpeakingCommunicationSemanticInternalLinksForPath } from './speakingCommunicationSemanticJourneyGraph.js';
import {
  SP6_CANONICAL_TOPIC_OWNERSHIP,
  getSP6CanonicalTopicOwner,
  getSP6CanonicalTopicOwnerPath,
} from './speakingCommunicationCompletionCanonicalOwnership.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);
const semanticLink = (relation, targetTopicId, label, rationale) => freeze({ relation, targetTopicId, label, rationale });
const journey = (sourceTopicId, links) => freeze({ sourceTopicId, links: freezeList(links) });

export const SPEAKING_COMMUNICATION_COMPLETION_SEMANTIC_REVISION = '2026-09-10-sp6';

/**
 * SP6 composes after R22. Only the newly registered classroom owner receives
 * completion edges ahead of upstream output. For every pre-existing R22 source,
 * R22 links keep precedence so its visible four-link journey remains exact.
 * Supplemental SP6 edges are still available to uncapped semantic consumers.
 */
export const SP6_SPEAKING_COMMUNICATION_SEMANTIC_JOURNEYS = freezeList([
  journey('classroom-communication-guide', [
    semanticLink('diagnostic', 'understands-english-does-not-speak', 'If classroom speaking rarely starts', 'Use the established comprehension-versus-independent-speaking diagnostic before treating classroom silence as a generic confidence problem.'),
    semanticLink('related', 'conversation-skills-guide', 'Transfer conversation into classroom interaction', 'Classroom participation draws on listening, relevant responses, follow-up, clarification and communication repair.'),
    semanticLink('related', 'sentence-formation', 'Support sentence formation when ideas will not come together', 'If the child has an idea but cannot formulate a usable spoken sentence even with a familiar listener, use the established sentence-formation owner rather than adding more performance pressure.'),
    semanticLink('practice', 'speaking-family-showcase-practice', 'Rehearse with a familiar listener first', 'A low-stakes familiar audience can be used before adding one classroom-like demand such as another listener or a follow-up question.'),
  ]),
  journey('conversation-skills-guide', [
    semanticLink('related', 'classroom-communication-guide', 'Use the same conversation moves in class', 'Connect ordinary reciprocal conversation with answering, clarification, group participation and repair in classroom routines.'),
    semanticLink('related', 'sentence-formation', 'If the idea is clear but the sentence is hard to build', 'Separate a sentence-formulation bottleneck from a conversation-turn problem.'),
    semanticLink('practice', 'speaking-practice', 'Practise short spontaneous turns', 'Use short speaking games to retrieve and reuse language without turning practice into memorised performance.'),
  ]),
  journey('speaking-confidence-progression', [
    semanticLink('related', 'classroom-communication-guide', 'Transfer confidence into classroom routines', 'Confidence should be observed through participation and independence in real routines rather than loudness or personality labels.'),
  ]),
  journey('one-word-answers', [
    semanticLink('related', 'sentence-formation', 'Check whether sentence construction is the bottleneck', 'A child may retrieve the idea but still need direct support joining words into a clear spoken sentence.'),
    semanticLink('related', 'classroom-communication-guide', 'Apply fuller responses to classroom participation', 'Once expansion is possible, practise the same skill in predictable classroom response routines.'),
  ]),
]);

const JOURNEYS_BY_TOPIC_ID = new Map(SP6_SPEAKING_COMMUNICATION_SEMANTIC_JOURNEYS.map((entry) => [entry.sourceTopicId, entry]));
const TOPIC_IDS_BY_PATH = new Map();
for (const entry of SP6_CANONICAL_TOPIC_OWNERSHIP) {
  const pathname = String(entry.ownerPath || '').split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/';
  const values = TOPIC_IDS_BY_PATH.get(pathname) || [];
  values.push(entry.id);
  TOPIC_IDS_BY_PATH.set(pathname, values);
}
const COMPLETION_NATIVE_TOPIC_IDS = new Set(['classroom-communication-guide']);
const normalizePath = (value) => String(value || '').split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/';

function resolveSP6AdditiveLinks(pathname, options = {}) {
  const path = normalizePath(pathname);
  const allowedRelations = Array.isArray(options.relations) && options.relations.length ? new Set(options.relations) : null;
  const excludedRelations = new Set(Array.isArray(options.excludeRelations) ? options.excludeRelations : []);
  const resolved = [];

  for (const topicId of TOPIC_IDS_BY_PATH.get(path) || []) {
    const journeyEntry = JOURNEYS_BY_TOPIC_ID.get(topicId);
    if (!journeyEntry) continue;
    for (const entry of journeyEntry.links) {
      if (allowedRelations && !allowedRelations.has(entry.relation)) continue;
      if (excludedRelations.has(entry.relation)) continue;
      const target = getSP6CanonicalTopicOwner(entry.targetTopicId);
      const to = getSP6CanonicalTopicOwnerPath(entry.targetTopicId);
      if (!target || !to) throw new Error(`SP6 semantic journey cannot resolve target topic ${entry.targetTopicId}.`);
      resolved.push(freeze({ ...entry, to, targetOwnerRole: target.ownerRole, targetIntent: target.intent }));
    }
  }
  return resolved;
}

export function getSpeakingCommunicationSemanticInternalLinksForPath(pathname, options = {}) {
  const { limit: _ignoredLimit, ...upstreamOptions } = options;
  const upstream = getR22SpeakingCommunicationSemanticInternalLinksForPath(pathname, upstreamOptions);
  const additive = resolveSP6AdditiveLinks(pathname, options);
  const path = normalizePath(pathname);
  const topicIds = TOPIC_IDS_BY_PATH.get(path) || [];
  const completionNative = topicIds.some((id) => COMPLETION_NATIVE_TOPIC_IDS.has(id));
  const ordered = completionNative ? [...additive, ...upstream] : [...upstream, ...additive];
  const seenTargets = new Set();
  const combined = [];

  for (const entry of ordered) {
    if (seenTargets.has(entry.to) || entry.to === path) continue;
    seenTargets.add(entry.to);
    combined.push(entry);
  }

  const limit = Number.isFinite(options.limit) ? Math.max(0, Number(options.limit)) : Infinity;
  return freezeList(combined.slice(0, limit));
}

export function getSP6SpeakingCommunicationSemanticJourney(topicId) {
  return JOURNEYS_BY_TOPIC_ID.get(String(topicId || '')) ?? null;
}
