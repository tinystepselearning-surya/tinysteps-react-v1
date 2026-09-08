const freezeList = (values = []) => Object.freeze([...values]);
const freezeRefs = (values = []) => Object.freeze(values.map((value) => Object.freeze({ ...value })));

export const PHONICS_KNOWLEDGE_DATASET_REVISION = '2026-09-08-r8';

export const PHONICS_KNOWLEDGE_STAGES = Object.freeze([
  'pre-phonics',
  'foundations',
  'early-decoding',
  'pattern-decoding',
  'advanced-patterns',
]);

export const PHONICS_KNOWLEDGE_TYPES = Object.freeze([
  'phonological-foundation',
  'sound-symbol',
  'decoding-skill',
  'vowel-system',
  'spelling-rule',
  'digraph',
  'vowel-team',
  'magic-e',
  'syllable-rule',
  'r-controlled',
  'diphthong',
  'alternate-vowel',
  'advanced-pattern',
]);

export const PHONICS_EXPANSION_STATES = Object.freeze([
  'existing-owner',
  'supporting-only',
  'pilot-wave-1',
  'future-wave-2',
]);

export function definePhonicsKnowledge(id, config) {
  return Object.freeze({
    id,
    subject: 'phonics-reading',
    publicationStatus: 'dataset-only',
    graphemes: freezeList(config.graphemes),
    exampleWords: freezeList(config.exampleWords),
    commonConfusions: freezeList(config.commonConfusions),
    teachingNotes: freezeList(config.teachingNotes),
    practiceIdeas: freezeList(config.practiceIdeas),
    prerequisiteIds: freezeList(config.prerequisiteIds),
    nextIds: freezeList(config.nextIds),
    curriculumRefs: freezeRefs(config.curriculumRefs),
    distinctValueSignals: freezeList(config.distinctValueSignals),
    ...config,
  });
}
