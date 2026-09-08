const freezeList = (values = []) => Object.freeze([...values]);
const freezeRefs = (values = []) => Object.freeze(values.map((value) => Object.freeze({
  ...value,
  lessonId: value.lessonId ?? `${value.courseId}__lesson-${String(value.lessonNumber).padStart(2, '0')}`,
})));

export const PHONICS_KNOWLEDGE_DATASET_REVISION = '2026-09-08-r8';
export const PHONICS_KNOWLEDGE_STAGES = Object.freeze([
  'pre-phonics', 'foundations', 'early-decoding', 'pattern-decoding', 'advanced-patterns',
]);
export const PHONICS_KNOWLEDGE_TYPES = Object.freeze([
  'phonological-foundation', 'sound-symbol', 'decoding-skill', 'vowel-system',
  'spelling-rule', 'digraph', 'vowel-team', 'magic-e', 'syllable-rule',
  'r-controlled', 'diphthong', 'alternate-vowel', 'advanced-pattern',
]);
export const PHONICS_EXPANSION_STATES = Object.freeze([
  'existing-owner', 'supporting-only', 'pilot-wave-1', 'future-wave-2',
]);

// Apply copied, frozen collections LAST so config cannot restore mutable arrays.
// Review readiness is deliberately separate from approval to publish.
export function definePhonicsKnowledge(id, config) {
  return Object.freeze({
    ...config,
    id,
    subject: 'phonics-reading',
    publicationStatus: 'dataset-only',
    editorialState: 'needs-human-review',
    publicationApproved: false,
    phonemeDescription: config.phonemeDescription ?? null,
    standardTerm: config.standardTerm ?? null,
    graphemes: freezeList(config.graphemes),
    exampleWords: freezeList(config.exampleWords),
    contrastWords: freezeList(config.contrastWords),
    commonConfusions: freezeList(config.commonConfusions),
    teachingNotes: freezeList(config.teachingNotes),
    practiceIdeas: freezeList(config.practiceIdeas),
    prerequisiteIds: freezeList(config.prerequisiteIds),
    nextIds: freezeList(config.nextIds),
    curriculumRefs: freezeRefs(config.curriculumRefs),
    supportingPaths: freezeList(config.supportingPaths),
    distinctValueSignals: freezeList(config.distinctValueSignals),
  });
}
