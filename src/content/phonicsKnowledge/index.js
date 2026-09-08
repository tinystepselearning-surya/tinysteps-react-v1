import { FOUNDATION_PHONICS_KNOWLEDGE } from './foundations.js';
import { PILOT_RULE_AND_DIGRAPH_KNOWLEDGE } from './pilotRulesDigraphs.js';
import { PILOT_VOWEL_AND_SYLLABLE_KNOWLEDGE } from './pilotVowelsSyllables.js';
import { ADVANCED_R_CONTROLLED_AND_VOWEL_KNOWLEDGE } from './advancedRControlledVowels.js';
import { ADVANCED_DIPHTHONG_AND_ENDING_KNOWLEDGE } from './advancedDiphthongsEndings.js';
import { LATER_CONSONANT_KNOWLEDGE } from './laterConsonants.js';
import { LATER_VOWEL_FAMILY_KNOWLEDGE } from './laterVowelFamilies.js';
export { PHONICS_KNOWLEDGE_DATASET_REVISION, PHONICS_KNOWLEDGE_STAGES, PHONICS_KNOWLEDGE_TYPES, PHONICS_EXPANSION_STATES } from './schema.js';

export const PHONICS_KNOWLEDGE_DATASET = Object.freeze([
  ...FOUNDATION_PHONICS_KNOWLEDGE,
  ...PILOT_RULE_AND_DIGRAPH_KNOWLEDGE,
  ...PILOT_VOWEL_AND_SYLLABLE_KNOWLEDGE,
  ...ADVANCED_R_CONTROLLED_AND_VOWEL_KNOWLEDGE,
  ...ADVANCED_DIPHTHONG_AND_ENDING_KNOWLEDGE,
  ...LATER_CONSONANT_KNOWLEDGE,
  ...LATER_VOWEL_FAMILY_KNOWLEDGE,
]);

const EMPTY = Object.freeze([]);
const byId = new Map();
const bySlug = new Map();
const byFamily = new Map();
const byStatus = new Map();
const byLesson = new Map();
const byOwner = new Map();
const add = (index, key, value) => {
  if (!index.has(key)) index.set(key, []);
  index.get(key).push(value);
};
for (const item of PHONICS_KNOWLEDGE_DATASET) {
  if (byId.has(item.id)) throw new Error(`Duplicate phonics concept: ${item.id}`);
  byId.set(item.id, item);
  if (item.futureSlugCandidate) {
    if (bySlug.has(item.futureSlugCandidate)) throw new Error(`Duplicate candidate slug: ${item.futureSlugCandidate}`);
    bySlug.set(item.futureSlugCandidate, item);
  }
  add(byFamily, item.conceptType, item);
  add(byStatus, item.expansionState, item);
  if (item.canonicalOwnerTopicId) add(byOwner, item.canonicalOwnerTopicId, item);
  for (const ref of item.curriculumRefs) add(byLesson, ref.lessonId, item);
}
for (const index of [byFamily, byStatus, byLesson, byOwner]) {
  for (const [key, values] of index) index.set(key, Object.freeze(values));
}
// Maps are private; callers receive only immutable concepts and result arrays.
export const getPhonicsKnowledgeConcept = (id) => byId.get(id) ?? null;
export const getPhonicsKnowledgeByCandidateSlug = (slug) => bySlug.get(slug) ?? null;
export const getPhonicsKnowledgeByFamily = (family) => byFamily.get(family) ?? EMPTY;
export const getPhonicsKnowledgeByExpansionStatus = (status) => byStatus.get(status) ?? EMPTY;
export const getPhonicsKnowledgeForLesson = (lessonId) => byLesson.get(lessonId) ?? EMPTY;
export const getPhonicsKnowledgeByCanonicalOwner = (topicId) => byOwner.get(topicId) ?? EMPTY;
export const getBrick9PilotCandidates = () => getPhonicsKnowledgeByExpansionStatus('pilot-wave-1');
export const getConceptsWithExistingOwners = () => getPhonicsKnowledgeByExpansionStatus('existing-owner');
