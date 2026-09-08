import {
  CANONICAL_TOPIC_OWNERSHIP,
  getCanonicalTopicOwner,
  getCanonicalTopicOwnerPath,
} from './canonicalTopicOwnershipRegistry.js';

const freezeList = (values = []) => Object.freeze([...values]);
const semanticLink = (relation, targetTopicId, label, rationale) => Object.freeze({
  relation,
  targetTopicId,
  label,
  rationale,
});
const journey = (sourceTopicId, links) => Object.freeze({
  sourceTopicId,
  links: freezeList(links),
});

export const SEMANTIC_INTERNAL_LINK_RELATIONS = Object.freeze([
  'hub',
  'prerequisite',
  'next',
  'related',
  'diagnostic',
  'practice',
  'assessment',
  'programme',
]);

/**
 * Brick 6 semantic internal-link graph.
 *
 * The graph stores topic IDs rather than destination URLs. URLs are resolved
 * through Brick 5 canonical ownership at runtime, preventing link drift when a
 * topic owner changes deliberately in the future.
 */
export const SEMANTIC_INTERNAL_LINK_GRAPH = Object.freeze([
  journey('phonics-subject-discovery', [
    semanticLink('related', 'phonics-parent-guide', 'Read the parent phonics guide', 'Give parents the broad instructional context before a narrow skill path.'),
    semanticLink('diagnostic', 'broad-child-reading-problem', 'Start from a reading difficulty', 'Route problem-aware parents to the established reading-problem owner.'),
    semanticLink('practice', 'word-building-practice', 'Practise word building', 'Offer a low-friction practice route from the subject hub.'),
    semanticLink('programme', 'live-phonics-classes', 'Explore live phonics support', 'Keep the commercial route distinct from informational ownership.'),
  ]),
  journey('phonics-parent-guide', [
    semanticLink('related', 'phonics-definition', 'Understand what phonics teaches', 'Move from the parent overview into the core concept owner.'),
    semanticLink('next', 'phonics-blending-progression', 'See how blending develops', 'Connect the broad parent guide to the first transferable decoding progression.'),
    semanticLink('programme', 'live-phonics-classes', 'Explore structured phonics support', 'Provide one clearly separated commercial next step.'),
  ]),
  journey('phonics-definition', [
    semanticLink('next', 'satpin-phonics', 'See the first sound-set pathway', 'Move from the phonics definition into an early instructional sequence.'),
    semanticLink('practice', 'letter-sound-practice', 'Practise letter sounds', 'Pair explanation with focused letter-sound practice.'),
    semanticLink('related', 'phonics-parent-guide', 'Open the parent phonics guide', 'Return to the broader parent-facing roadmap when more context is needed.'),
  ]),
  journey('satpin-phonics', [
    semanticLink('prerequisite', 'phonics-definition', 'Review the phonics foundation', 'Clarify the core concept before applying the SATPIN sequence.'),
    semanticLink('next', 'phonics-blending-progression', 'Move into blending', 'Continue from sound recognition into combining sounds for reading.'),
    semanticLink('practice', 'letter-sound-practice', 'Practise the sounds', 'Reinforce early sound recognition without creating another explanation page.'),
  ]),
  journey('phonics-blending-progression', [
    semanticLink('prerequisite', 'satpin-phonics', 'Review the early sound set', 'Check sound readiness before expecting blending transfer.'),
    semanticLink('next', 'cvc-words-explanation', 'Move into CVC decoding', 'Connect blending to the first transferable word-decoding milestone.'),
    semanticLink('practice', 'phonics-blending-practice', 'Practise blending', 'Pair the progression guide with the dedicated activity owner.'),
    semanticLink('diagnostic', 'letter-sounds-known-word-reading-fails', 'If sounds are known but words are still hard', 'Route a visible transfer problem to its diagnostic owner.'),
  ]),
  journey('phonics-blending-practice', [
    semanticLink('related', 'phonics-blending-progression', 'Review how blending develops', 'Anchor practice to the underlying learning progression.'),
    semanticLink('practice', 'word-building-practice', 'Build words interactively', 'Move from activity guidance into the dedicated word-building practice route.'),
    semanticLink('related', 'cvc-words-explanation', 'Connect blending to CVC words', 'Explain the decoding structure behind early blending practice.'),
  ]),
  journey('cvc-words-explanation', [
    semanticLink('prerequisite', 'phonics-blending-progression', 'Review blending first', 'Ensure the child can combine sounds before increasing word-level demand.'),
    semanticLink('practice', 'word-building-practice', 'Practise building CVC words', 'Use the existing word-building practice owner after the explanation.'),
    semanticLink('related', 'reading-practice', 'Continue into reading practice', 'Extend decoding into broader reading practice without creating a duplicate CVC page.'),
  ]),
  journey('abc-known-reading-fails', [
    semanticLink('related', 'phonics-definition', 'Check what phonics knowledge is missing', 'Separate alphabet-name knowledge from sound-based decoding.'),
    semanticLink('next', 'phonics-blending-progression', 'Check the blending pathway', 'Move from the observed problem into the relevant decoding progression.'),
    semanticLink('practice', 'letter-sound-practice', 'Practise letter sounds', 'Strengthen the sound-print connection when letter names are masking the gap.'),
    semanticLink('assessment', 'free-assessment-booking', 'Book a free assessment', 'Offer assessment only after a concrete reading problem has been identified.'),
  ]),
  journey('letter-sounds-known-word-reading-fails', [
    semanticLink('related', 'phonics-blending-progression', 'Review the blending progression', 'Explain why isolated sound knowledge may not transfer to word reading.'),
    semanticLink('practice', 'word-building-practice', 'Practise word building', 'Use active sound-to-word construction after diagnosis.'),
    semanticLink('assessment', 'free-assessment-booking', 'Book a free assessment', 'Offer assessment when the transfer gap remains unclear.'),
  ]),
  journey('reading-fluency-guide', [
    semanticLink('practice', 'reading-practice', 'Practise reading fluency', 'Pair fluency guidance with the dedicated reading-practice route.'),
    semanticLink('diagnostic', 'slow-reader-help', 'If reading is still slow', 'Route persistent slow reading to the established problem owner.'),
    semanticLink('programme', 'reading-fluency-programme', 'Explore the reading fluency programme', 'Use the dedicated fluency programme rather than the broad phonics programme.'),
  ]),
  journey('grammar-subject-discovery', [
    semanticLink('related', 'grammar-progression', 'See the grammar-to-writing roadmap', 'Start the subject journey with the established progression owner.'),
    semanticLink('diagnostic', 'sentence-formation', 'Check weak sentence formation', 'Route a common visible writing problem to its diagnostic owner.'),
    semanticLink('practice', 'grammar-practice', 'Practise grammar', 'Connect the subject hub to the existing practice collection.'),
    semanticLink('programme', 'live-grammar-classes', 'Explore live grammar support', 'Keep programme intent separate from discovery intent.'),
  ]),
  journey('grammar-progression', [
    semanticLink('next', 'sentence-formation', 'Build stronger sentences', 'Move from the broad progression into sentence construction.'),
    semanticLink('practice', 'grammar-practice', 'Practise grammar choices', 'Reinforce concepts through the existing grammar-practice owner.'),
    semanticLink('programme', 'live-grammar-classes', 'Explore structured grammar support', 'Provide one distinct commercial continuation.'),
  ]),
  journey('sentence-formation', [
    semanticLink('prerequisite', 'grammar-progression', 'Review the grammar roadmap', 'Place sentence construction inside the wider grammar progression.'),
    semanticLink('practice', 'sentence-building-practice', 'Practise building sentences', 'Move directly into the dedicated sentence-building practice route.'),
    semanticLink('programme', 'writing-classes', 'Explore writing support', 'Use the writing programme when sentence construction is the primary need.'),
  ]),
  journey('grammar-transfer-mistakes', [
    semanticLink('related', 'grammar-progression', 'Review the grammar progression', 'Reconnect rule knowledge with the broader transfer pathway.'),
    semanticLink('next', 'sentence-formation', 'Apply grammar in stronger sentences', 'Shift from isolated rule recall into sentence-level application.'),
    semanticLink('practice', 'grammar-focused-practice-game', 'Use focused grammar practice', 'Provide repetition without introducing another explanatory owner.'),
    semanticLink('programme', 'live-grammar-classes', 'Explore live grammar support', 'Offer structured support after a transfer problem is established.'),
  ]),
  journey('speaking-subject-discovery', [
    semanticLink('related', 'speaking-confidence-progression', 'See how speaking confidence develops', 'Start with the established communication-progression owner.'),
    semanticLink('diagnostic', 'one-word-answers', 'If answers stay very short', 'Route a common visible speaking difficulty to its diagnostic owner.'),
    semanticLink('practice', 'speaking-practice', 'Practise speaking', 'Connect discovery to active expression practice.'),
    semanticLink('programme', 'live-public-speaking-classes', 'Explore live speaking support', 'Keep programme intent separate from discovery intent.'),
  ]),
  journey('speaking-confidence-progression', [
    semanticLink('practice', 'speaking-practice', 'Practise speaking actively', 'Pair confidence guidance with active expression practice.'),
    semanticLink('related', 'one-word-answers', 'If answers stay too short', 'Connect confidence progression to a common response-generation problem.'),
    semanticLink('programme', 'live-public-speaking-classes', 'Explore structured speaking support', 'Provide one separated programme route.'),
  ]),
  journey('one-word-answers', [
    semanticLink('related', 'speaking-confidence-progression', 'Review the confidence pathway', 'Check whether confidence and response habits are limiting fuller answers.'),
    semanticLink('practice', 'speaking-practice', 'Practise fuller responses', 'Use guided speaking practice after identifying the bottleneck.'),
    semanticLink('programme', 'spoken-english-classes', 'Explore spoken English support', 'Use the language-production programme when fuller spoken output is the need.'),
  ]),
  journey('understands-english-does-not-speak', [
    semanticLink('related', 'speaking-confidence-progression', 'See the speaking confidence pathway', 'Separate receptive understanding from expressive confidence and retrieval.'),
    semanticLink('practice', 'speaking-focused-practice-game', 'Use focused speaking practice', 'Provide low-friction active expression practice.'),
    semanticLink('programme', 'spoken-english-classes', 'Explore spoken English support', 'Offer the programme aligned to expressive-language need.'),
  ]),
  journey('shy-child-speaking-confidence', [
    semanticLink('related', 'speaking-confidence-progression', 'Understand the confidence pathway', 'Connect the problem landing page to the deeper progression guide.'),
    semanticLink('practice', 'speaking-practice', 'Use low-pressure speaking practice', 'Provide an active practice route without forcing performance.'),
    semanticLink('assessment', 'free-assessment-booking', 'Book a free assessment', 'Offer assessment after the confidence problem has been identified.'),
  ]),
]);

export const SEMANTIC_INTERNAL_LINK_REQUIRED_TOPIC_IDS = Object.freeze([
  'phonics-parent-guide',
  'phonics-definition',
  'satpin-phonics',
  'phonics-blending-progression',
  'phonics-blending-practice',
  'cvc-words-explanation',
  'abc-known-reading-fails',
  'letter-sounds-known-word-reading-fails',
  'reading-fluency-guide',
  'grammar-progression',
  'sentence-formation',
  'grammar-transfer-mistakes',
  'speaking-confidence-progression',
  'one-word-answers',
  'understands-english-does-not-speak',
]);

const JOURNEYS_BY_TOPIC_ID = Object.freeze(
  Object.fromEntries(SEMANTIC_INTERNAL_LINK_GRAPH.map((entry) => [entry.sourceTopicId, entry])),
);

function normalizedPath(value) {
  return String(value || '').split(/[?#]/, 1)[0];
}

function topicIdsForPath(pathname) {
  const normalized = normalizedPath(pathname);
  return CANONICAL_TOPIC_OWNERSHIP
    .filter((entry) => entry.ownerPath === normalized)
    .map((entry) => entry.id);
}

export function getSemanticInternalLinksForTopic(topicId, options = {}) {
  const journeyEntry = JOURNEYS_BY_TOPIC_ID[topicId];
  if (!journeyEntry) return [];

  const allowedRelations = Array.isArray(options.relations) && options.relations.length
    ? new Set(options.relations)
    : null;
  const excludedRelations = new Set(Array.isArray(options.excludeRelations) ? options.excludeRelations : []);
  const limit = Number.isFinite(options.limit) ? Math.max(0, Number(options.limit)) : Infinity;

  return journeyEntry.links
    .filter((entry) => (!allowedRelations || allowedRelations.has(entry.relation)) && !excludedRelations.has(entry.relation))
    .slice(0, limit)
    .map((entry) => {
      const target = getCanonicalTopicOwner(entry.targetTopicId);
      return Object.freeze({
        ...entry,
        to: getCanonicalTopicOwnerPath(entry.targetTopicId),
        targetOwnerRole: target.ownerRole,
        targetIntent: target.intent,
      });
    });
}

export function getSemanticInternalLinksForPath(pathname, options = {}) {
  const seenTargets = new Set();
  const resolved = [];

  for (const topicId of topicIdsForPath(pathname)) {
    for (const entry of getSemanticInternalLinksForTopic(topicId, options)) {
      if (seenTargets.has(entry.to)) continue;
      seenTargets.add(entry.to);
      resolved.push(entry);
    }
  }

  const limit = Number.isFinite(options.limit) ? Math.max(0, Number(options.limit)) : Infinity;
  return resolved.slice(0, limit);
}

export function getSemanticJourneyForTopic(topicId) {
  return JOURNEYS_BY_TOPIC_ID[topicId] || null;
}
