import {
  GRAMMAR_WRITING_SKILL_TAXONOMY,
  getGrammarWritingSkill,
} from './grammarWritingKnowledgeTaxonomy.js';
import {
  GRAMMAR_WRITING_TENSE_NODES,
  GRAMMAR_WRITING_TENSE_COMPARISONS,
  GRAMMAR_WRITING_TENSE_ERROR_PATTERNS,
  getGrammarWritingTense,
} from './grammarWritingTenseArchitecture.js';
import {
  GRAMMAR_WRITING_WRITING_STAGES,
  getGrammarWritingWritingStage,
} from './grammarWritingWritingProgression.js';
import {
  GRAMMAR_WRITING_PARENT_PROBLEMS,
  getGrammarWritingParentProblem,
} from './grammarWritingParentProblemArchitecture.js';
import {
  GRAMMAR_WRITING_PRACTICE_UTILITIES,
  getGrammarWritingPracticeUtility,
} from './grammarWritingPracticeUtilities.js';
import {
  R19_CANONICAL_TOPIC_OWNERSHIP,
  getR19CanonicalTopicOwner,
  getR19CanonicalTopicOwnerPath,
} from './grammarWritingSemanticCanonicalOwnership.js';
import { R19_GRAMMAR_WRITING_SEMANTIC_JOURNEYS } from './grammarWritingSemanticJourneyGraph.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);
const unique = (values = []) => freezeList([...new Set(values)]);
const ref = (kind, id) => `${kind}:${id}`;
const edge = (from, relation, to, rationale) => freeze({ from, relation, to, rationale });
const publicLink = (relation, targetTopicId, label, rationale) => freeze({ relation, targetTopicId, label, rationale });
const publicJourney = (sourceTopicId, links) => freeze({ sourceTopicId, links: freezeList(links) });

export const GRAMMAR_WRITING_GR6_SEMANTIC_REVISION = '2026-09-10-gr6';
export const GRAMMAR_WRITING_GR6_RELATION_SEQUENCE = freezeList([
  'prerequisite',
  'comparison',
  'common-error',
  'writing-application',
  'practice',
  'next-concept',
]);

/**
 * GR6 is the semantic composition layer for GR1-GR5. It does not create
 * content or URLs. Internal entities remain internal; public owner nodes are
 * existing canonical owners only.
 */
export const GRAMMAR_WRITING_GR6_PRINCIPLES = freezeList([
  freeze({ id: 'one-canonical-node-per-layer', statement: 'Reuse the frozen GR1-GR5 IDs as semantic nodes instead of creating a second taxonomy for internal linking.' }),
  freeze({ id: 'prerequisite-before-next', statement: 'A semantic journey should expose what supports the concept before suggesting a later concept, especially when the learner has a visible prerequisite gap.' }),
  freeze({ id: 'comparison-only-when-meaningful', statement: 'Use explicit comparison nodes where the architecture has a genuine contrast, such as tense choice; do not manufacture artificial comparison pages for every grammar label.' }),
  freeze({ id: 'error-to-diagnosis-to-practice', statement: 'Common errors should connect to the diagnosed bottleneck and an appropriate practice utility rather than functioning as isolated lists of mistakes.' }),
  freeze({ id: 'writing-is-application', statement: 'Grammar concepts should point into authentic sentence, paragraph or composition use so informational knowledge is not separated from writing transfer.' }),
  freeze({ id: 'practice-follows-diagnosis', statement: 'Practice links must reuse the GR4-to-GR5 routing so a child is not sent to a generic activity unrelated to the diagnosed problem.' }),
  freeze({ id: 'existing-public-owners-only', statement: 'Public semantic destinations must resolve through the existing canonical ownership registry; GR6 does not add a route, canonical owner or query intent.' }),
  freeze({ id: 'no-orphan-nodes-or-owners', statement: 'Every GR1-GR5 entity and every grammar-writing canonical public owner must participate in the semantic graph with a meaningful connection.' }),
]);

const grammarPublicOwners = freezeList(R19_CANONICAL_TOPIC_OWNERSHIP.filter((item) => item.subject === 'grammar-writing'));
export const GRAMMAR_WRITING_GR6_PUBLIC_OWNERS = grammarPublicOwners;

const semanticNodes = [];
for (const item of GRAMMAR_WRITING_SKILL_TAXONOMY) semanticNodes.push(freeze({ ref: ref('skill', item.id), kind: 'skill', id: item.id, label: item.label }));
for (const item of GRAMMAR_WRITING_TENSE_NODES) semanticNodes.push(freeze({ ref: ref('tense', item.id), kind: 'tense', id: item.id, label: item.label }));
for (const item of GRAMMAR_WRITING_TENSE_COMPARISONS) semanticNodes.push(freeze({ ref: ref('comparison', item.id), kind: 'comparison', id: item.id, label: item.label }));
for (const item of GRAMMAR_WRITING_TENSE_ERROR_PATTERNS) semanticNodes.push(freeze({ ref: ref('error', item.id), kind: 'error', id: item.id, label: item.id }));
for (const item of GRAMMAR_WRITING_WRITING_STAGES) semanticNodes.push(freeze({ ref: ref('writing-stage', item.id), kind: 'writing-stage', id: item.id, label: item.label }));
for (const item of GRAMMAR_WRITING_PARENT_PROBLEMS) semanticNodes.push(freeze({ ref: ref('parent-problem', item.id), kind: 'parent-problem', id: item.id, label: item.label }));
for (const item of GRAMMAR_WRITING_PRACTICE_UTILITIES) semanticNodes.push(freeze({ ref: ref('practice', item.id), kind: 'practice', id: item.id, label: item.label }));
for (const item of grammarPublicOwners) semanticNodes.push(freeze({ ref: ref('public-topic', item.id), kind: 'public-topic', id: item.id, label: item.queryIntent, ownerPath: item.ownerPath }));

export const GRAMMAR_WRITING_GR6_SEMANTIC_NODES = freezeList(semanticNodes);
const nodeByRef = new Map(GRAMMAR_WRITING_GR6_SEMANTIC_NODES.map((item) => [item.ref, item]));

const semanticEdges = [];
const addEdge = (from, relation, to, rationale) => semanticEdges.push(edge(from, relation, to, rationale));

// GR1 skill prerequisites, next concepts, writing applications, diagnostics and practice.
for (const item of GRAMMAR_WRITING_SKILL_TAXONOMY) {
  const source = ref('skill', item.id);
  for (const id of item.prerequisiteSkillIds) addEdge(source, 'prerequisite', ref('skill', id), 'Reuse the GR1 prerequisite graph.');
  for (const id of item.nextSkillIds) addEdge(source, 'next-concept', ref('skill', id), 'Reuse the GR1 next-skill graph.');
  for (const stage of GRAMMAR_WRITING_WRITING_STAGES.filter((entry) => entry.requiredGr1SkillIds.includes(item.id))) addEdge(source, 'writing-application', ref('writing-stage', stage.id), 'Apply the GR1 skill inside its GR3 writing stages.');
  for (const problem of GRAMMAR_WRITING_PARENT_PROBLEMS.filter((entry) => entry.gr1SkillIds.includes(item.id))) addEdge(source, 'diagnostic', ref('parent-problem', problem.id), 'Route a visible breakdown through the GR4 diagnostic layer.');
  for (const practice of GRAMMAR_WRITING_PRACTICE_UTILITIES.filter((entry) => entry.targetGr1SkillIds.includes(item.id))) addEdge(source, 'practice', ref('practice', practice.id), 'Use a GR5 utility already mapped to this skill.');
}

// GR2 tense journeys: the clearest full concept -> prerequisite -> comparison -> error -> writing -> practice -> next sequence.
for (const item of GRAMMAR_WRITING_TENSE_NODES) {
  const source = ref('tense', item.id);
  const prerequisites = item.prerequisiteTenseIds.length ? item.prerequisiteTenseIds.map((id) => ref('tense', id)) : [ref('skill', 'tenses')];
  for (const target of prerequisites) addEdge(source, 'prerequisite', target, 'Use the GR2 tense prerequisite, or the GR1 Tenses parent for the GR2 root.');
  for (const id of item.comparisonIds) addEdge(source, 'comparison', ref('comparison', id), 'Use the explicit GR2 contrast before broadening tense choice.');
  for (const id of item.commonErrorIds) addEdge(source, 'common-error', ref('error', id), 'Expose a known GR2 error pattern for diagnosis and repair.');
  for (const stage of GRAMMAR_WRITING_WRITING_STAGES.filter((entry) => entry.supportingGr2TenseIds.includes(item.id))) addEdge(source, 'writing-application', ref('writing-stage', stage.id), 'Transfer tense control into a GR3 writing application.');
  for (const practice of GRAMMAR_WRITING_PRACTICE_UTILITIES.filter((entry) => entry.targetGr2TenseIds.includes(item.id))) addEdge(source, 'practice', ref('practice', practice.id), 'Use a GR5 utility already mapped to this tense/control node.');
  const next = item.nextTenseIds.length ? item.nextTenseIds.map((id) => ref('tense', id)) : [ref('skill', 'editing-revision')];
  for (const target of next) addEdge(source, 'next-concept', target, 'Continue to the GR2 next tense/control node, then into editing after terminal transfer control.');
}

// GR2 comparison/error relationships remain explicit and reciprocal at the semantic layer.
for (const item of GRAMMAR_WRITING_TENSE_COMPARISONS) {
  const source = ref('comparison', item.id);
  for (const id of item.tenseIds) addEdge(source, 'comparison', ref('tense', id), 'Comparison node resolves back to the contrasted tense concepts.');
  for (const id of item.commonErrorIds) addEdge(source, 'common-error', ref('error', id), 'Comparison exposes the error patterns that commonly reveal the contrast gap.');
}
for (const item of GRAMMAR_WRITING_TENSE_ERROR_PATTERNS) {
  const source = ref('error', item.id);
  for (const id of item.tenseIds) addEdge(source, 'prerequisite', ref('tense', id), 'Repair begins by returning to the tense meaning/form that owns the error.');
  const relatedProblems = GRAMMAR_WRITING_PARENT_PROBLEMS.filter((problem) => problem.gr2TenseIds.some((id) => item.tenseIds.includes(id)));
  for (const problem of relatedProblems) addEdge(source, 'diagnostic', ref('parent-problem', problem.id), 'Map the error into a GR4 parent-visible diagnostic when the tense scope overlaps.');
}

// GR3 progression, GR4 diagnostic routing and GR5 practice routing.
for (const item of GRAMMAR_WRITING_WRITING_STAGES) {
  const source = ref('writing-stage', item.id);
  for (const id of item.prerequisiteStageIds) addEdge(source, 'prerequisite', ref('writing-stage', id), 'Reuse the GR3 writing prerequisite graph.');
  for (const id of item.nextStageIds) addEdge(source, 'next-concept', ref('writing-stage', id), 'Reuse the GR3 writing progression graph.');
  for (const practice of GRAMMAR_WRITING_PRACTICE_UTILITIES.filter((entry) => entry.targetGr3WritingStageIds.includes(item.id))) addEdge(source, 'practice', ref('practice', practice.id), 'Use a GR5 utility that practises this writing stage.');
  for (const topicId of item.publicAnchorTopicIds) addEdge(source, 'public-anchor', ref('public-topic', topicId), 'Resolve the writing stage to an existing public owner only.');
}
for (const item of GRAMMAR_WRITING_PARENT_PROBLEMS) {
  const source = ref('parent-problem', item.id);
  for (const id of item.gr3WritingStageIds) addEdge(source, 'writing-application', ref('writing-stage', id), 'Show where the parent-visible problem appears in the GR3 writing progression.');
  for (const id of item.recommendedPracticeKinds) addEdge(source, 'practice', ref('practice', id), 'Preserve the ordered GR4-to-GR5 practice handoff.');
  for (const topicId of item.publicAnchorTopicIds) addEdge(source, 'public-anchor', ref('public-topic', topicId), 'Resolve the diagnostic to an existing public owner only.');
}
for (const item of GRAMMAR_WRITING_PRACTICE_UTILITIES) {
  const source = ref('practice', item.id);
  for (const id of item.targetParentProblemIds) addEdge(source, 'diagnostic', ref('parent-problem', id), 'Keep practice reciprocal with the GR4 diagnosis that selected it.');
  for (const topicId of item.publicAnchorTopicIds) addEdge(source, 'public-anchor', ref('public-topic', topicId), 'Resolve practice to an existing public practice/content owner only.');
}

/**
 * R19 already owns eight focused public journeys. GR6 preserves those exactly
 * and adds semantic completion specs for the nine grammar/writing owners that
 * predate R19 or sit at hub/commercial/practice level. These are graph data;
 * they do not replace the historical rendered R19 adapter in GR6.
 */
export const GRAMMAR_WRITING_GR6_PUBLIC_COMPLETION_JOURNEYS = freezeList([
  publicJourney('grammar-subject-discovery', [
    publicLink('next', 'grammar-progression', 'Follow the grammar-to-writing progression', 'Move from the subject hub into the established learning roadmap.'),
    publicLink('diagnostic', 'sentence-formation', 'If complete sentences are the bottleneck', 'Route a sentence-construction problem to its existing diagnostic owner.'),
    publicLink('practice', 'grammar-practice', 'Practise grammar skills', 'Use the established grammar practice category after the concept is understood.'),
    publicLink('programme', 'live-grammar-classes', 'Explore live grammar classes', 'Keep the commercial programme as a bounded continuation from the subject hub.'),
  ]),
  publicJourney('live-grammar-classes', [
    publicLink('prerequisite', 'grammar-subject-discovery', 'Review the grammar resource pathway', 'Return to the subject hub when the parent needs informational guidance before programme selection.'),
    publicLink('diagnostic', 'grammar-transfer-mistakes', 'Check whether known rules transfer', 'Use the established transfer diagnostic for recurring real-use errors.'),
    publicLink('practice', 'grammar-practice', 'Use focused grammar practice', 'Connect programme interest to the existing practice category without creating a new game owner.'),
  ]),
  publicJourney('writing-classes', [
    publicLink('prerequisite', 'paragraph-writing-guide', 'Secure paragraph organisation', 'Paragraph control is a useful prerequisite for longer composition work.'),
    publicLink('next', 'creative-writing-guide', 'Develop description and narrative', 'Move from programme context into the established composition guide.'),
    publicLink('practice', 'sentence-building-practice', 'Practise sentence building', 'Strengthen sentence-level production inside the existing practice owner.'),
    publicLink('related', 'grammar-subject-discovery', 'Browse grammar and writing resources', 'Keep the writing programme connected to the subject resource hub.'),
  ]),
  publicJourney('grammar-progression', [
    publicLink('next', 'sentence-formation', 'Build complete sentences', 'The established roadmap moves from grammar knowledge into sentence production.'),
    publicLink('practice', 'grammar-practice', 'Practise grammar choices', 'Provide short practice without fragmenting the information architecture.'),
    publicLink('programme', 'live-grammar-classes', 'Explore live grammar classes', 'Keep the programme as the bounded commercial continuation already used by the historical journey.'),
  ]),
  publicJourney('sentence-formation', [
    publicLink('prerequisite', 'grammar-progression', 'Review the wider grammar progression', 'Use the roadmap when the sentence problem reflects an earlier grammar foundation.'),
    publicLink('next', 'paragraph-writing-guide', 'Move from sentences into paragraphs', 'Once complete sentences are stable, organise several related sentences around one focus.'),
    publicLink('practice', 'sentence-building-practice', 'Practise building sentences', 'Use the existing sentence-building practice category for active construction.'),
    publicLink('diagnostic', 'grammar-transfer-mistakes', 'If known grammar disappears in fresh sentences', 'Separate sentence construction from a rule-transfer problem.'),
  ]),
  publicJourney('grammar-transfer-mistakes', [
    publicLink('prerequisite', 'grammar-assessment-guide', 'Locate the first unstable point', 'Use the assessment guide to identify whether the breakdown is knowledge, production or transfer.'),
    publicLink('practice', 'grammar-editing-guide', 'Practise finding and repairing known errors', 'Move from diagnosis into explicit detection and correction practice.'),
    publicLink('programme', 'live-grammar-classes', 'Get guided grammar support', 'Keep professional support as one bounded continuation after diagnosis.'),
  ]),
  publicJourney('grammar-practice', [
    publicLink('prerequisite', 'grammar-progression', 'Choose the skill before practising', 'Practice should follow a known concept or diagnosed bottleneck.'),
    publicLink('practice', 'grammar-focused-practice-game', 'Use focused grammar practice', 'Move from the category to the established focused-practice owner.'),
    publicLink('practice', 'sentence-building-practice', 'Practise sentence construction', 'Use sentence-building when the target is active production rather than rule selection.'),
  ]),
  publicJourney('sentence-building-practice', [
    publicLink('prerequisite', 'sentence-formation', 'Review complete sentence formation', 'Use the diagnostic owner when sentence construction itself remains unstable.'),
    publicLink('next', 'conjunctions-guide', 'Connect related ideas', 'After complete sentence construction, progress into meaningful sentence connection.'),
    publicLink('practice', 'grammar-focused-practice-game', 'Add focused grammar repair', 'Use the focused practice owner when a specific grammar pattern needs reinforcement.'),
  ]),
  publicJourney('grammar-focused-practice-game', [
    publicLink('prerequisite', 'grammar-progression', 'Identify the grammar target', 'Focused practice is more useful when the child and teacher know which concept is being strengthened.'),
    publicLink('diagnostic', 'grammar-transfer-mistakes', 'If correct answers do not transfer', 'Route persistent worksheet-to-real-use gaps to the established transfer diagnostic.'),
    publicLink('next', 'grammar-editing-guide', 'Apply the skill in editing', 'Move from isolated correction into finding and repairing the same pattern in connected writing.'),
  ]),
]);

const r19GrammarPublicJourneys = R19_GRAMMAR_WRITING_SEMANTIC_JOURNEYS.map((entry) => publicJourney(entry.sourceTopicId, entry.links.filter((link) => getR19CanonicalTopicOwner(link.targetTopicId)?.subject === 'grammar-writing')));
export const GRAMMAR_WRITING_GR6_PUBLIC_JOURNEYS = freezeList([
  ...r19GrammarPublicJourneys,
  ...GRAMMAR_WRITING_GR6_PUBLIC_COMPLETION_JOURNEYS,
]);

// Public-owner graph edges are represented in the same semantic node graph.
for (const journey of GRAMMAR_WRITING_GR6_PUBLIC_JOURNEYS) {
  const source = ref('public-topic', journey.sourceTopicId);
  for (const link of journey.links) addEdge(source, link.relation === 'next' ? 'next-concept' : link.relation, ref('public-topic', link.targetTopicId), link.rationale);
}

const dedupedEdges = [];
const seenEdgeKeys = new Set();
for (const item of semanticEdges) {
  const key = `${item.from}|${item.relation}|${item.to}`;
  if (seenEdgeKeys.has(key)) continue;
  seenEdgeKeys.add(key);
  dedupedEdges.push(item);
}
export const GRAMMAR_WRITING_GR6_SEMANTIC_EDGES = freezeList(dedupedEdges);

const outgoingByRef = new Map();
const incomingByRef = new Map();
for (const item of GRAMMAR_WRITING_GR6_SEMANTIC_EDGES) {
  const outgoing = outgoingByRef.get(item.from) || [];
  outgoing.push(item);
  outgoingByRef.set(item.from, outgoing);
  const incoming = incomingByRef.get(item.to) || [];
  incoming.push(item);
  incomingByRef.set(item.to, incoming);
}
const publicJourneyByTopicId = new Map(GRAMMAR_WRITING_GR6_PUBLIC_JOURNEYS.map((item) => [item.sourceTopicId, item]));

export const getGrammarWritingGr6SemanticNode = (nodeRef) => nodeByRef.get(String(nodeRef || '')) ?? null;
export const getGrammarWritingGr6OutgoingEdges = (nodeRef, relation = null) => freezeList((outgoingByRef.get(String(nodeRef || '')) || []).filter((item) => !relation || item.relation === relation));
export const getGrammarWritingGr6IncomingEdges = (nodeRef, relation = null) => freezeList((incomingByRef.get(String(nodeRef || '')) || []).filter((item) => !relation || item.relation === relation));

export function getGrammarWritingGr6TenseJourney(tenseId) {
  const item = getGrammarWritingTense(tenseId);
  if (!item) return null;
  const source = ref('tense', item.id);
  const byRelation = (relation) => unique(getGrammarWritingGr6OutgoingEdges(source, relation).map((entry) => entry.to));
  return freeze({
    conceptRef: source,
    prerequisiteRefs: byRelation('prerequisite'),
    comparisonRefs: byRelation('comparison'),
    commonErrorRefs: byRelation('common-error'),
    writingApplicationRefs: byRelation('writing-application'),
    practiceRefs: byRelation('practice'),
    nextConceptRefs: byRelation('next-concept'),
  });
}

export const getGrammarWritingGr6PublicJourney = (topicId) => publicJourneyByTopicId.get(String(topicId || '')) ?? null;

export function getGrammarWritingGr6PublicLinksForPath(pathname, options = {}) {
  const normalized = String(pathname || '').split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/';
  const owner = grammarPublicOwners.find((item) => (String(item.ownerPath || '').split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/') === normalized);
  if (!owner) return freezeList([]);
  const journey = getGrammarWritingGr6PublicJourney(owner.id);
  if (!journey) return freezeList([]);
  const excluded = new Set(Array.isArray(options.excludeRelations) ? options.excludeRelations : []);
  const links = journey.links
    .filter((item) => !excluded.has(item.relation))
    .map((item) => {
      const target = getR19CanonicalTopicOwner(item.targetTopicId);
      const to = getR19CanonicalTopicOwnerPath(item.targetTopicId);
      if (!target || !to) throw new Error(`GR6 public semantic journey cannot resolve ${item.targetTopicId}.`);
      return freeze({ ...item, to, targetOwnerRole: target.ownerRole, targetIntent: target.intent });
    });
  const limit = Number.isFinite(options.limit) ? Math.max(0, Number(options.limit)) : Infinity;
  return freezeList(links.slice(0, limit));
}

// Architecture guards.
if (nodeByRef.size !== GRAMMAR_WRITING_GR6_SEMANTIC_NODES.length) throw new Error('GR6 contains duplicate semantic node refs.');
if (grammarPublicOwners.length !== 17) throw new Error(`GR6 expects 17 established grammar-writing public owners, found ${grammarPublicOwners.length}.`);
if (GRAMMAR_WRITING_GR6_PUBLIC_JOURNEYS.length !== 17) throw new Error(`GR6 expects one public journey record for each of the 17 grammar-writing owners.`);
if (GRAMMAR_WRITING_GR6_PUBLIC_COMPLETION_JOURNEYS.length !== 9) throw new Error('GR6 public completion must cover exactly the nine non-R19 grammar/writing owner sources.');

for (const item of GRAMMAR_WRITING_GR6_SEMANTIC_EDGES) {
  if (!nodeByRef.has(item.from)) throw new Error(`GR6 semantic edge has unknown source: ${item.from}.`);
  if (!nodeByRef.has(item.to)) throw new Error(`GR6 semantic edge has unknown target: ${item.to}.`);
  if (item.from === item.to) throw new Error(`GR6 semantic edge cannot self-link: ${item.from}.`);
}
for (const node of GRAMMAR_WRITING_GR6_SEMANTIC_NODES) {
  if (!(outgoingByRef.get(node.ref)?.length || incomingByRef.get(node.ref)?.length)) throw new Error(`GR6 orphan semantic node: ${node.ref}.`);
}
for (const owner of grammarPublicOwners) {
  const nodeRef = ref('public-topic', owner.id);
  if (!outgoingByRef.get(nodeRef)?.length) throw new Error(`GR6 public owner has no outgoing semantic edge: ${owner.id}.`);
  if (!incomingByRef.get(nodeRef)?.length) throw new Error(`GR6 public owner has no incoming semantic edge: ${owner.id}.`);
}
for (const item of GRAMMAR_WRITING_TENSE_NODES) {
  const journey = getGrammarWritingGr6TenseJourney(item.id);
  if (!journey?.prerequisiteRefs.length || !journey.commonErrorRefs.length || !journey.writingApplicationRefs.length || !journey.practiceRefs.length || !journey.nextConceptRefs.length) throw new Error(`GR6 tense journey is incomplete: ${item.id}.`);
  if (journey.comparisonRefs.join('|') !== item.comparisonIds.map((id) => ref('comparison', id)).join('|')) throw new Error(`GR6 tense comparison journey drifted: ${item.id}.`);
  if (journey.commonErrorRefs.join('|') !== item.commonErrorIds.map((id) => ref('error', id)).join('|')) throw new Error(`GR6 tense error journey drifted: ${item.id}.`);
}
for (const journey of GRAMMAR_WRITING_GR6_PUBLIC_JOURNEYS) {
  if (!getR19CanonicalTopicOwner(journey.sourceTopicId) || getR19CanonicalTopicOwner(journey.sourceTopicId)?.subject !== 'grammar-writing') throw new Error(`GR6 public journey has unknown/non-grammar source: ${journey.sourceTopicId}.`);
  if (!journey.links.length || journey.links.length > 4) throw new Error(`GR6 public journey must stay concise: ${journey.sourceTopicId}.`);
  if (new Set(journey.links.map((item) => item.targetTopicId)).size !== journey.links.length) throw new Error(`GR6 public journey has duplicate targets: ${journey.sourceTopicId}.`);
  for (const link of journey.links) if (getR19CanonicalTopicOwner(link.targetTopicId)?.subject !== 'grammar-writing') throw new Error(`GR6 public journey leaves grammar-writing ownership: ${journey.sourceTopicId} -> ${link.targetTopicId}.`);
}

// Reference helpers are intentionally used in guards so accidental removal of a
// GR1/GR3/GR4/GR5 node is caught at module load instead of silently orphaning it.
for (const item of GRAMMAR_WRITING_SKILL_TAXONOMY) if (!getGrammarWritingSkill(item.id)) throw new Error(`GR6 cannot resolve GR1 skill ${item.id}.`);
for (const item of GRAMMAR_WRITING_WRITING_STAGES) if (!getGrammarWritingWritingStage(item.id)) throw new Error(`GR6 cannot resolve GR3 writing stage ${item.id}.`);
for (const item of GRAMMAR_WRITING_PARENT_PROBLEMS) if (!getGrammarWritingParentProblem(item.id)) throw new Error(`GR6 cannot resolve GR4 parent problem ${item.id}.`);
for (const item of GRAMMAR_WRITING_PRACTICE_UTILITIES) if (!getGrammarWritingPracticeUtility(item.id)) throw new Error(`GR6 cannot resolve GR5 practice utility ${item.id}.`);
