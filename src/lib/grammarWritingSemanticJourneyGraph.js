import { getReadingSemanticInternalLinksForPath } from './readingSemanticJourneyGraph.js';
import {
  R19_CANONICAL_TOPIC_OWNERSHIP,
  getR19CanonicalTopicOwner,
  getR19CanonicalTopicOwnerPath,
} from './grammarWritingSemanticCanonicalOwnership.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);
const semanticLink = (relation, targetTopicId, label, rationale) => freeze({ relation, targetTopicId, label, rationale });
const journey = (sourceTopicId, links) => freeze({ sourceTopicId, links: freezeList(links) });

export const GRAMMAR_WRITING_SEMANTIC_JOURNEY_REVISION = '2026-09-09-r19';

/**
 * R19 composes after the frozen Brick 6 graph and the additive R16 reading
 * graph. It connects the R18 grammar/writing guides and six strong existing
 * grammar owners without changing any historical journey or URL ownership.
 */
export const R19_GRAMMAR_WRITING_SEMANTIC_JOURNEYS = freezeList([
  journey('punctuation-capitalisation-guide', [
    semanticLink('prerequisite', 'sentence-formation', 'Review complete sentence formation', 'Sentence boundaries are easier to apply when the child can first express one complete idea.'),
    semanticLink('related', 'grammar-progression', 'See the wider grammar roadmap', 'Place punctuation inside the broader move from words and sentences into connected writing.'),
    semanticLink('practice', 'grammar-editing-guide', 'Practise finding and fixing punctuation', 'Move from explanation into an existing editing context where conventions must be noticed and repaired.'),
    semanticLink('practice', 'grammar-practice', 'Use focused grammar practice', 'Offer short practice without creating separate thin pages for individual punctuation marks.'),
  ]),
  journey('paragraph-writing-guide', [
    semanticLink('prerequisite', 'sentence-formation', 'Secure complete sentences first', 'Paragraph coherence depends on sentences that can already stand clearly on their own.'),
    semanticLink('related', 'conjunctions-guide', 'Connect ideas with useful conjunctions', 'Use connectives when they express a real relationship rather than forcing transitions into every sentence.'),
    semanticLink('related', 'creative-writing-guide', 'Develop ideas for longer writing', 'Move from one coherent paragraph into supported idea generation and composition.'),
    semanticLink('practice', 'grammar-editing-guide', 'Revise and edit a finished paragraph', 'Apply relevance, order and conventions during a separate editing pass.'),
  ]),
  journey('grammar-tenses-guide', [
    semanticLink('related', 'subject-verb-agreement-guide', 'Check subject–verb agreement', 'Keep time control and agreement connected but conceptually distinct.'),
    semanticLink('diagnostic', 'grammar-transfer-mistakes', 'If tense rules disappear in fresh writing', 'Route worksheet knowledge that does not transfer to the established grammar-transfer diagnostic.'),
    semanticLink('practice', 'grammar-practice', 'Practise tense choices', 'Provide focused grammar repetition after the parent understands the time meaning.'),
  ]),
  journey('subject-verb-agreement-guide', [
    semanticLink('related', 'grammar-tenses-guide', 'Review tense and verb forms', 'Show the nearby verb-system skill without collapsing tense and agreement into one rule.'),
    semanticLink('diagnostic', 'grammar-transfer-mistakes', 'If agreement errors return in fresh work', 'Use the transfer diagnostic when a child succeeds in exercises but not independent language.'),
    semanticLink('practice', 'grammar-practice', 'Practise agreement choices', 'Reinforce the pattern through the existing grammar practice route.'),
  ]),
  journey('conjunctions-guide', [
    semanticLink('prerequisite', 'sentence-formation', 'Build clear sentences first', 'A child should understand the ideas being connected before making sentence structures longer.'),
    semanticLink('next', 'paragraph-writing-guide', 'Use connections across a paragraph', 'Move from joining related ideas to organising several related sentences around one focus.'),
    semanticLink('practice', 'sentence-building-practice', 'Practise building connected sentences', 'Apply conjunction choices inside active sentence construction.'),
  ]),
  journey('creative-writing-guide', [
    semanticLink('prerequisite', 'paragraph-writing-guide', 'Review paragraph structure', 'Give ideas a coherent paragraph structure before expanding composition demands.'),
    semanticLink('practice', 'grammar-editing-guide', 'Edit the finished writing', 'Separate idea generation from a later revision and editing pass.'),
    semanticLink('related', 'grammar-progression', 'See the grammar-to-writing roadmap', 'Reconnect composition to the broader grammar and writing pathway.'),
  ]),
  journey('grammar-editing-guide', [
    semanticLink('diagnostic', 'grammar-transfer-mistakes', 'If the same errors keep returning', 'Persistent errors after correction may indicate a transfer problem rather than a lack of editing exposure.'),
    semanticLink('related', 'punctuation-capitalisation-guide', 'Review punctuation and capitals', 'Return to the conventions owner when sentence boundaries or punctuation are the specific editing target.'),
    semanticLink('related', 'grammar-assessment-guide', 'Use the parent grammar checklist', 'Move from one editing task to a broader observation of patterns across fresh language.'),
  ]),
  journey('grammar-assessment-guide', [
    semanticLink('diagnostic', 'grammar-transfer-mistakes', 'Check a grammar transfer gap', 'Use the diagnostic owner when known rules repeatedly disappear in spontaneous use.'),
    semanticLink('related', 'grammar-progression', 'Review the grammar roadmap', 'Place observations from the checklist back into the broader learning pathway.'),
    semanticLink('assessment', 'free-assessment-booking', 'Book a free assessment', 'Offer professional assessment only after the parent has used the observational checklist and still needs a starting point.'),
  ]),
]);

const JOURNEYS_BY_TOPIC_ID = new Map(R19_GRAMMAR_WRITING_SEMANTIC_JOURNEYS.map((entry) => [entry.sourceTopicId, entry]));
const TOPIC_IDS_BY_PATH = new Map();
for (const entry of R19_CANONICAL_TOPIC_OWNERSHIP) {
  const pathname = String(entry.ownerPath || '').split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/';
  const values = TOPIC_IDS_BY_PATH.get(pathname) || [];
  values.push(entry.id);
  TOPIC_IDS_BY_PATH.set(pathname, values);
}

const normalizePath = (value) => String(value || '').split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/';

function resolveR19AdditiveLinks(pathname, options = {}) {
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
      const target = getR19CanonicalTopicOwner(entry.targetTopicId);
      const to = getR19CanonicalTopicOwnerPath(entry.targetTopicId);
      if (!target || !to) throw new Error(`R19 semantic journey cannot resolve target topic ${entry.targetTopicId}.`);
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

export function getGrammarWritingSemanticInternalLinksForPath(pathname, options = {}) {
  const { limit: _ignoredLimit, ...upstreamOptions } = options;
  const upstream = getReadingSemanticInternalLinksForPath(pathname, upstreamOptions);
  const additive = resolveR19AdditiveLinks(pathname, options);
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

export function getR19GrammarWritingSemanticJourney(topicId) {
  return JOURNEYS_BY_TOPIC_ID.get(String(topicId || '')) ?? null;
}
