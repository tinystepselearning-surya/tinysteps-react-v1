import { PHONICS_KNOWLEDGE_DATASET } from '../content/phonicsKnowledge';
import { PHONICS_READING_TAXONOMY } from './phonicsReadingTaxonomy.js';
import { PHONICS_READING_COVERAGE, getPhonicsReadingCoverage } from './phonicsReadingCoverageRegistry.js';
import { PHONICS_READING_PROBLEMS } from './phonicsReadingProblemRegistry.js';
import { PHONICS_PRACTICE_CAPABILITIES } from './phonicsPracticeCapabilityRegistry';
import { R16_READING_SEMANTIC_JOURNEYS } from './readingSemanticJourneyGraph.js';
import { R16_CANONICAL_TOPIC_OWNERSHIP } from './readingSemanticCanonicalOwnership.js';

export type PhonicsReadingSemanticNodeKind = 'skill' | 'pattern' | 'practice' | 'problem' | 'owner';
export type PhonicsReadingSemanticEdgeRelation =
  | 'progresses-to'
  | 'teaches-pattern'
  | 'practise-with'
  | 'diagnose-skill'
  | 'problem-practice'
  | 'problem-owner'
  | 'reading-owner'
  | `r16:${string}`;

export type PhonicsReadingSemanticNode = Readonly<{
  id: string;
  kind: PhonicsReadingSemanticNodeKind;
  label: string;
  path: string | null;
}>;

export type PhonicsReadingSemanticEdge = Readonly<{
  from: string;
  to: string;
  relation: PhonicsReadingSemanticEdgeRelation;
}>;

export const PHONICS_READING_SEMANTIC_GRAPH_REVISION = '2026-09-10-ph6';

const node = (id: string, kind: PhonicsReadingSemanticNodeKind, label: string, path: string | null = null): PhonicsReadingSemanticNode =>
  Object.freeze({ id, kind, label, path });

const nodes: PhonicsReadingSemanticNode[] = [];
for (const skill of PHONICS_READING_TAXONOMY) nodes.push(node(`skill:${skill.id}`, 'skill', skill.label));
for (const concept of PHONICS_KNOWLEDGE_DATASET) {
  const coverage = getPhonicsReadingCoverage(concept.id);
  nodes.push(node(`pattern:${concept.id}`, 'pattern', concept.label, coverage?.ownerPath ?? null));
}
for (const practice of PHONICS_PRACTICE_CAPABILITIES) nodes.push(node(`practice:${practice.id}`, 'practice', practice.label, practice.path));
for (const problem of PHONICS_READING_PROBLEMS) nodes.push(node(`problem:${problem.id}`, 'problem', problem.label, problem.ownerPath));
for (const owner of R16_CANONICAL_TOPIC_OWNERSHIP.filter((entry: { subject?: string }) => entry.subject === 'phonics-reading')) {
  nodes.push(node(`owner:${owner.id}`, 'owner', owner.queryIntent || owner.id, owner.ownerPath));
}

export const PHONICS_READING_SEMANTIC_NODES = Object.freeze(nodes);
const nodeById = new Map(PHONICS_READING_SEMANTIC_NODES.map((entry) => [entry.id, entry]));
if (nodeById.size !== PHONICS_READING_SEMANTIC_NODES.length) throw new Error('PH6 semantic graph contains duplicate node IDs.');

const edges: PhonicsReadingSemanticEdge[] = [];
const edgeKeys = new Set<string>();
const addEdge = (from: string, to: string, relation: PhonicsReadingSemanticEdgeRelation) => {
  if (!nodeById.has(from) || !nodeById.has(to)) return;
  const key = `${from}|${relation}|${to}`;
  if (edgeKeys.has(key)) return;
  edgeKeys.add(key);
  edges.push(Object.freeze({ from, to, relation }));
};

for (const skill of PHONICS_READING_TAXONOMY) {
  for (const nextSkillId of skill.nextSkillIds) addEdge(`skill:${skill.id}`, `skill:${nextSkillId}`, 'progresses-to');
  for (const conceptId of skill.knowledgeConceptIds) addEdge(`skill:${skill.id}`, `pattern:${conceptId}`, 'teaches-pattern');
}

const explicitPatternSkill = new Map<string, string>();
for (const skill of PHONICS_READING_TAXONOMY) for (const conceptId of skill.knowledgeConceptIds) if (!explicitPatternSkill.has(conceptId)) explicitPatternSkill.set(conceptId, skill.id);
const familyFallbackSkill: Record<string, string> = {
  'sound-symbol': 'letter-sounds',
  digraph: 'digraphs',
  'spelling-rule': 'spelling-rules',
  'vowel-team': 'vowel-teams',
  'magic-e': 'long-vowels',
  'syllable-rule': 'multisyllabic-decoding',
  'r-controlled': 'r-controlled',
  diphthong: 'advanced-patterns',
  'alternate-vowel': 'advanced-patterns',
  'advanced-pattern': 'advanced-patterns',
};
for (const concept of PHONICS_KNOWLEDGE_DATASET) {
  if (explicitPatternSkill.has(concept.id)) continue;
  const skillId = familyFallbackSkill[concept.conceptType];
  if (skillId) addEdge(`skill:${skillId}`, `pattern:${concept.id}`, 'teaches-pattern');
}

for (const practice of PHONICS_PRACTICE_CAPABILITIES) {
  for (const skillId of practice.skillIds) addEdge(`skill:${skillId}`, `practice:${practice.id}`, 'practise-with');
}

const practiceByPath = new Map(PHONICS_PRACTICE_CAPABILITIES.map((entry) => [entry.path, entry]));
for (const problem of PHONICS_READING_PROBLEMS) {
  for (const skillId of problem.skillIds) addEdge(`problem:${problem.id}`, `skill:${skillId}`, 'diagnose-skill');
  for (const path of problem.practicePaths) {
    const practice = practiceByPath.get(path);
    if (practice) addEdge(`problem:${problem.id}`, `practice:${practice.id}`, 'problem-practice');
  }
  if (problem.ownerPath && problem.ownerTopicId) addEdge(`problem:${problem.id}`, `owner:${problem.ownerTopicId}`, 'problem-owner');
}

addEdge('skill:fluency', 'owner:reading-fluency-guide', 'reading-owner');
addEdge('skill:comprehension-transition', 'owner:reading-comprehension-bridge', 'reading-owner');
addEdge('problem:reads-without-comprehension', 'owner:story-comprehension-diagnostic', 'problem-owner');

for (const journey of R16_READING_SEMANTIC_JOURNEYS) {
  for (const link of journey.links) addEdge(`owner:${journey.sourceTopicId}`, `owner:${link.targetTopicId}`, `r16:${link.relation}`);
}

export const PHONICS_READING_SEMANTIC_EDGES = Object.freeze(edges);

export function getPhonicsReadingSemanticNode(id: string): PhonicsReadingSemanticNode | null {
  return nodeById.get(String(id || '')) ?? null;
}

export function getPhonicsReadingSemanticEdgesFrom(nodeId: string): readonly PhonicsReadingSemanticEdge[] {
  return Object.freeze(PHONICS_READING_SEMANTIC_EDGES.filter((entry) => entry.from === nodeId));
}

export function isPhonicsReadingSkillReachable(fromSkillId: string, toSkillId: string): boolean {
  const start = `skill:${fromSkillId}`;
  const target = `skill:${toSkillId}`;
  if (!nodeById.has(start) || !nodeById.has(target)) return false;
  const seen = new Set<string>([start]);
  const queue = [start];
  while (queue.length) {
    const current = queue.shift() as string;
    if (current === target) return true;
    for (const edge of PHONICS_READING_SEMANTIC_EDGES) {
      if (edge.from !== current || edge.relation !== 'progresses-to' || seen.has(edge.to)) continue;
      seen.add(edge.to);
      queue.push(edge.to);
    }
  }
  return false;
}

export function getPhonicsReadingSemanticOrphans(): readonly PhonicsReadingSemanticNode[] {
  const connected = new Set<string>();
  for (const edge of PHONICS_READING_SEMANTIC_EDGES) {
    connected.add(edge.from);
    connected.add(edge.to);
  }
  return Object.freeze(PHONICS_READING_SEMANTIC_NODES.filter((entry) => !connected.has(entry.id)));
}

if (PHONICS_READING_COVERAGE.length !== PHONICS_KNOWLEDGE_DATASET.length) throw new Error('PH6 requires complete PH3 pattern coverage.');
