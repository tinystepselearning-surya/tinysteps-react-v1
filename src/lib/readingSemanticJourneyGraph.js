import { getSemanticInternalLinksForPath as getLegacySemanticInternalLinksForPath } from './semanticInternalLinkRegistry.js';
import {
  R16_CANONICAL_TOPIC_OWNERSHIP,
  getR16CanonicalTopicOwner,
  getR16CanonicalTopicOwnerPath,
} from './readingSemanticCanonicalOwnership.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);
const semanticLink = (relation, targetTopicId, label, rationale) => freeze({ relation, targetTopicId, label, rationale });
const journey = (sourceTopicId, links) => freeze({ sourceTopicId, links: freezeList(links) });

export const READING_SEMANTIC_JOURNEY_REVISION = '2026-09-09-r16';

/**
 * R16 is additive to the frozen Brick 6 graph. It gives the R15 reading owners
 * and two established comprehension owners explicit skill relationships while
 * preserving every historical R6 journey unchanged.
 */
export const R16_READING_SEMANTIC_JOURNEYS = freezeList([
  journey('phonological-phonemic-phonics-boundary', [
    semanticLink('related', 'phonics-definition', 'See what phonics teaches', 'Move from spoken-sound awareness into the established print-based phonics owner.'),
    semanticLink('next', 'phonics-blending-progression', 'See how blending develops', 'Connect sound awareness to the established progression for combining sounds during word reading.'),
    semanticLink('practice', 'letter-sound-practice', 'Practise letter sounds', 'Use print-linked sound practice after the parent understands where phonics begins.'),
  ]),
  journey('automatic-word-recognition', [
    semanticLink('prerequisite', 'cvc-words-explanation', 'Review transferable decoding', 'Automatic recognition should rest on secure word reading rather than visual guessing.'),
    semanticLink('related', 'reading-fluency-guide', 'Connect word recognition to fluency', 'Show how easier word recognition supports connected-text fluency without equating the two.'),
    semanticLink('practice', 'reading-practice', 'Practise reading in context', 'Move from explanation into appropriate connected reading practice.'),
  ]),
  journey('vocabulary-reading-comprehension', [
    semanticLink('related', 'reading-comprehension-bridge', 'Move from decoding into meaning', 'Connect word meaning to the established decoding-to-comprehension teaching bridge.'),
    semanticLink('diagnostic', 'story-comprehension-diagnostic', 'If words are read but stories are not understood', 'Route persistent meaning difficulty to the established problem-aware owner.'),
    semanticLink('related', 'reading-fluency-guide', 'Check whether effort is blocking meaning', 'Separate vocabulary and language-comprehension difficulty from effortful connected reading.'),
    semanticLink('practice', 'reading-practice', 'Use reading practice', 'Apply vocabulary and meaning work inside connected reading rather than isolated word lists alone.'),
  ]),
  journey('reading-comprehension-bridge', [
    semanticLink('related', 'vocabulary-reading-comprehension', 'See how vocabulary supports understanding', 'Deepen the word-meaning layer without turning comprehension into a vocabulary-only problem.'),
    semanticLink('related', 'automatic-word-recognition', 'Understand easier word recognition', 'Explain how reduced word-reading effort can leave more attention for meaning.'),
    semanticLink('diagnostic', 'story-comprehension-diagnostic', 'If story understanding stays weak', 'Route a persistent word-reading-versus-understanding gap to the diagnostic owner.'),
    semanticLink('related', 'reading-fluency-guide', 'Check fluency and phrasing', 'Connect the bridge to accuracy, ease and phrasing when connected reading is effortful.'),
  ]),
  journey('story-comprehension-diagnostic', [
    semanticLink('related', 'vocabulary-reading-comprehension', 'Check the vocabulary layer', 'Help parents test whether important word meanings are blocking understanding.'),
    semanticLink('related', 'reading-comprehension-bridge', 'Use the decoding-to-comprehension bridge', 'Provide a teaching route after the problem has been identified.'),
    semanticLink('related', 'reading-fluency-guide', 'Check whether reading effort is the issue', 'Separate comprehension difficulty from slow or effortful connected reading.'),
    semanticLink('assessment', 'free-assessment-booking', 'Book a free assessment', 'Offer assessment only after the comprehension problem is clearly identified.'),
  ]),
  journey('reading-fluency-guide', [
    semanticLink('related', 'automatic-word-recognition', 'Understand automatic word recognition', 'Add the missing conceptual link between easier familiar-word recognition and connected-text fluency.'),
  ]),
]);

const JOURNEYS_BY_TOPIC_ID = new Map(R16_READING_SEMANTIC_JOURNEYS.map((entry) => [entry.sourceTopicId, entry]));
const TOPIC_IDS_BY_PATH = new Map();
for (const entry of R16_CANONICAL_TOPIC_OWNERSHIP) {
  const path = String(entry.ownerPath || '').split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/';
  const values = TOPIC_IDS_BY_PATH.get(path) || [];
  values.push(entry.id);
  TOPIC_IDS_BY_PATH.set(path, values);
}

const normalizePath = (value) => String(value || '').split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/';

function resolveAdditiveLinks(pathname, options = {}) {
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
      const target = getR16CanonicalTopicOwner(entry.targetTopicId);
      const to = getR16CanonicalTopicOwnerPath(entry.targetTopicId);
      if (!target || !to) throw new Error(`R16 semantic journey cannot resolve target topic ${entry.targetTopicId}.`);
      resolved.push(freeze({
        ...entry,
        to,
        targetOwnerRole: target.ownerRole,
        targetIntent: target.intent,
      }));
    }
  }

  return resolved;
}

export function getReadingSemanticInternalLinksForPath(pathname, options = {}) {
  const { limit: _ignoredLimit, ...legacyOptions } = options;
  const legacy = getLegacySemanticInternalLinksForPath(pathname, legacyOptions);
  const additive = resolveAdditiveLinks(pathname, options);
  const seenTargets = new Set();
  const combined = [];

  for (const entry of [...legacy, ...additive]) {
    if (seenTargets.has(entry.to)) continue;
    seenTargets.add(entry.to);
    combined.push(entry);
  }

  const limit = Number.isFinite(options.limit) ? Math.max(0, Number(options.limit)) : Infinity;
  return freezeList(combined.slice(0, limit));
}

export function getR16ReadingSemanticJourney(topicId) {
  return JOURNEYS_BY_TOPIC_ID.get(String(topicId || '')) ?? null;
}
