import { getGrammarWritingSemanticInternalLinksForPath } from './grammarWritingSemanticJourneyGraph.js';
import {
  R22_CANONICAL_TOPIC_OWNERSHIP,
  getR22CanonicalTopicOwner,
  getR22CanonicalTopicOwnerPath,
} from './speakingCommunicationSemanticCanonicalOwnership.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);
const semanticLink = (relation, targetTopicId, label, rationale) => freeze({ relation, targetTopicId, label, rationale });
const journey = (sourceTopicId, links) => freeze({ sourceTopicId, links: freezeList(links) });

export const SPEAKING_COMMUNICATION_SEMANTIC_JOURNEY_REVISION = '2026-09-10-r22';

/**
 * R22 composes after Brick 6, R16 reading and R19 grammar/writing. It connects
 * the R21 speaking guides with strong established speaking resources. These are
 * semantic relationships, not a rigid developmental ladder: a child may need a
 * different entry point depending on language formulation, context, confidence,
 * audience and task demands.
 */
export const R22_SPEAKING_COMMUNICATION_SEMANTIC_JOURNEYS = freezeList([
  journey('conversation-skills-guide', [
    semanticLink('diagnostic', 'one-word-answers', 'If replies stay very short', 'Use the established one-word-answer diagnostic before assuming the child simply needs to speak for longer.'),
    semanticLink('related', 'speaking-confidence-progression', 'Build confidence across different listeners', 'Conversation participation can change by listener and setting, so connect ordinary interaction with the broader confidence-and-transfer roadmap.'),
    semanticLink('related', 'speaking-debate-guide', 'Extend turn-taking into reasoned discussion', 'Move from everyday reciprocal conversation into giving reasons, listening to another view and responding respectfully.'),
    semanticLink('practice', 'speaking-family-showcase-practice', 'Practise with a familiar audience', 'Use a low-stakes family context to rehearse listening, responding and adding relevant detail without turning conversation into a performance test.'),
  ]),
  journey('one-word-answers', [
    semanticLink('related', 'conversation-skills-guide', 'Practise two-way follow-up', 'Response expansion is more useful when the child also learns to listen, respond to the other speaker and keep the exchange moving.'),
    semanticLink('next', 'oral-storytelling-retelling-guide', 'Grow complete responses into short sequences', 'Once a child can add relevant detail, oral retelling gives those ideas a beginning, sequence and ending.'),
    semanticLink('diagnostic', 'understands-english-does-not-speak', 'If the child rarely starts a response at all', 'A child who understands but does not independently begin speaking needs a different diagnostic path from a child who speaks in short answers.'),
    semanticLink('practice', 'speaking-practice', 'Use short speaking practice', 'Offer brief, repeatable speaking opportunities after the parent identifies the response bottleneck.'),
  ]),
  journey('oral-storytelling-retelling-guide', [
    semanticLink('prerequisite', 'one-word-answers', 'Build complete spoken messages first', 'If retelling collapses into isolated words, return to relevant complete responses before increasing narrative demands.'),
    semanticLink('next', 'speech-structure-guide', 'Move from story sequence to planned talk structure', 'Narrative sequencing is a useful bridge into organising a short speech around purpose, points and a conclusion.'),
    semanticLink('practice', 'story-card-speaking-bridge', 'Use Story Cards for oral rehearsal', 'Apply sequence and relevant detail in an existing activity bridge without making the activity the canonical storytelling owner.'),
    semanticLink('practice', 'speaking-family-showcase-practice', 'Retell for a familiar listener', 'Use a low-pressure audience to practise clarity and independence before increasing presentation demands.'),
  ]),
  journey('speech-structure-guide', [
    semanticLink('prerequisite', 'oral-storytelling-retelling-guide', 'Review sequence and relevant detail', 'Storytelling can strengthen the ability to order ideas before the child plans a more formal short talk.'),
    semanticLink('next', 'public-speaking-delivery-guide', 'Add delivery after the message is organised', 'Pace, pauses, audible volume and emphasis are easier to practise when the child already knows what they want to say.'),
    semanticLink('related', 'speaking-visual-aids-guide', 'Use visuals to support the message', 'Introduce pictures, props or slides only when they clarify meaning rather than replacing the speaker or the structure.'),
    semanticLink('practice', 'speaking-video-feedback-guide', 'Rehearse and review one target', 'Use optional recording to notice one observable structure or delivery target and retry it.'),
  ]),
  journey('public-speaking-delivery-guide', [
    semanticLink('prerequisite', 'speech-structure-guide', 'Organise the talk before polishing delivery', 'Delivery practice should serve a clear message rather than compensate for an unclear or overloaded speech.'),
    semanticLink('related', 'speaking-confidence-progression', 'Connect delivery with confidence and transfer', 'Audible, intelligible delivery and confidence are related but neither requires extroversion, accent conformity or constant eye contact.'),
    semanticLink('practice', 'speaking-video-feedback-guide', 'Use focused feedback and retry', 'Optional recording can help the child notice pace, pauses or intelligibility and then practise one target at a time.'),
    semanticLink('related', 'speaking-competition-preparation-guide', 'Prepare for a specific speaking event', 'Use competition preparation only when the child has a real event, keeping event readiness separate from general speaking development.'),
  ]),
  journey('speaking-confidence-progression', [
    semanticLink('diagnostic', 'understands-english-does-not-speak', 'If speaking rarely starts independently', 'Use the comprehension-versus-speaking diagnostic when participation is limited even in situations where the child appears to understand.'),
    semanticLink('related', 'conversation-skills-guide', 'Build confidence through ordinary conversation', 'Confidence can grow through reciprocal everyday interaction, not only presentations or staged performance.'),
    semanticLink('practice', 'speaking-family-showcase-practice', 'Use a familiar low-stakes audience', 'A supportive home audience can provide a manageable context for increasing independence and participation.'),
    semanticLink('related', 'public-speaking-delivery-guide', 'Review delivery without forcing performance behaviours', 'Use pace, pausing and intelligibility as observable supports while keeping accent and constant eye contact outside the definition of confidence.'),
  ]),
  journey('speaking-debate-guide', [
    semanticLink('prerequisite', 'conversation-skills-guide', 'Secure listening and turn-taking first', 'Reasoned discussion depends on listening to another speaker, staying on topic and responding rather than only delivering a prepared opinion.'),
    semanticLink('related', 'speech-structure-guide', 'Organise a position and supporting points', 'A clear claim, reasons and examples benefit from the same organisation principles used in short planned talks.'),
    semanticLink('practice', 'speaking-video-feedback-guide', 'Review one discussion target', 'Focused feedback can target clarity, pace or response quality without scoring personality, accent or extroversion.'),
    semanticLink('related', 'speaking-confidence-progression', 'Transfer discussion skills across settings', 'A child may reason well in one context but need confidence and transfer support in a group, classroom or unfamiliar audience.'),
  ]),
  journey('speaking-video-feedback-guide', [
    semanticLink('related', 'public-speaking-delivery-guide', 'Choose a clear delivery target', 'Use the delivery guide to define observable targets such as pace, pauses, audible volume and intelligibility before recording.'),
    semanticLink('related', 'speech-structure-guide', 'Check whether the message is organised', 'If the recording is hard to follow, separate structure problems from delivery problems before asking for repeated performance.'),
    semanticLink('practice', 'speaking-competition-preparation-guide', 'Transfer feedback into event rehearsal', 'Apply focused feedback to a real competition only when event-specific preparation is relevant.'),
    semanticLink('related', 'speaking-confidence-progression', 'Keep feedback supportive of confidence', 'Recording should remain optional and should not become a judgement of personality, accent, appearance or natural communication style.'),
  ]),
]);

const JOURNEYS_BY_TOPIC_ID = new Map(R22_SPEAKING_COMMUNICATION_SEMANTIC_JOURNEYS.map((entry) => [entry.sourceTopicId, entry]));
const TOPIC_IDS_BY_PATH = new Map();
for (const entry of R22_CANONICAL_TOPIC_OWNERSHIP) {
  const pathname = String(entry.ownerPath || '').split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/';
  const values = TOPIC_IDS_BY_PATH.get(pathname) || [];
  values.push(entry.id);
  TOPIC_IDS_BY_PATH.set(pathname, values);
}

const normalizePath = (value) => String(value || '').split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/';

function resolveR22AdditiveLinks(pathname, options = {}) {
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
      const target = getR22CanonicalTopicOwner(entry.targetTopicId);
      const to = getR22CanonicalTopicOwnerPath(entry.targetTopicId);
      if (!target || !to) throw new Error(`R22 semantic journey cannot resolve target topic ${entry.targetTopicId}.`);
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

export function getSpeakingCommunicationSemanticInternalLinksForPath(pathname, options = {}) {
  const { limit: _ignoredLimit, ...upstreamOptions } = options;
  const upstream = getGrammarWritingSemanticInternalLinksForPath(pathname, upstreamOptions);
  const additive = resolveR22AdditiveLinks(pathname, options);
  const seenTargets = new Set();
  const combined = [];

  for (const entry of [...upstream, ...additive]) {
    if (seenTargets.has(entry.to)) continue;
    seenTargets.add(entry.to);
    combined.push(entry);
  }

  const limit = Number.isFinite(options.limit) ? Math.max(0, Number(options.limit)) : Infinity;
  return freezeList(combined.slice(0, limit));
}

export function getR22SpeakingCommunicationSemanticJourney(topicId) {
  return JOURNEYS_BY_TOPIC_ID.get(String(topicId || '')) ?? null;
}
