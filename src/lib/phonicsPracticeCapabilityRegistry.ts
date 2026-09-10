import { PUBLIC_TILE_ROUTES } from './publicEnglishGames';
import { getPhonicsReadingSkill } from './phonicsReadingTaxonomy.js';

export type PhonicsPracticeCapabilityKind = 'practice-hub' | 'interactive-game' | 'tracing';
export type PhonicsPracticeAvailability = 'public-ready' | 'category-owner';

export type PhonicsPracticeCapability = Readonly<{
  id: string;
  label: string;
  kind: PhonicsPracticeCapabilityKind;
  path: string;
  availability: PhonicsPracticeAvailability;
  skillIds: readonly string[];
  sourceGameIds: readonly string[];
  datasetIds: readonly string[];
  learningBoundary: string;
}>;

export const PHONICS_PRACTICE_CAPABILITY_REVISION = '2026-09-10-ph5';

const capability = (
  id: string,
  config: Omit<PhonicsPracticeCapability, 'id'>,
): PhonicsPracticeCapability => Object.freeze({
  id,
  ...config,
  skillIds: Object.freeze([...config.skillIds]),
  sourceGameIds: Object.freeze([...config.sourceGameIds]),
  datasetIds: Object.freeze([...config.datasetIds]),
});

export const PHONICS_PRACTICE_CAPABILITIES: readonly PhonicsPracticeCapability[] = Object.freeze([
  capability('letter-sound-practice-hub', {
    label: 'Letter-sound practice collection', kind: 'practice-hub', path: '/free-letter-sound-games-for-kids', availability: 'category-owner',
    skillIds: ['phonemic-awareness', 'letter-sounds'], sourceGameIds: [], datasetIds: ['phonics-sound-registry', 'trace-letter-data'],
    learningBoundary: 'The category orchestrates existing practice; it does not own the informational explanation of letter sounds.',
  }),
  capability('word-building-practice-hub', {
    label: 'Word-building practice collection', kind: 'practice-hub', path: '/free-word-building-games-for-kids', availability: 'category-owner',
    skillIds: ['blending', 'segmenting', 'cvc', 'digraphs', 'spelling-rules'], sourceGameIds: [], datasetIds: ['phonics-word-utility-registry', 'phonics-sound-registry'],
    learningBoundary: 'Use controlled word-building practice after the required sound-pattern knowledge is taught.',
  }),
  capability('reading-practice-hub', {
    label: 'Reading practice collection', kind: 'practice-hub', path: '/free-reading-games-for-kids', availability: 'category-owner',
    skillIds: ['multisyllabic-decoding', 'fluency', 'comprehension-transition'], sourceGameIds: [], datasetIds: ['connected-reading-content'],
    learningBoundary: 'Reading practice supports transfer into connected text; it does not replace diagnosis when accuracy is weak.',
  }),
  capability('letter-tracing', {
    label: 'Letter tracing game', kind: 'tracing', path: '/free-letter-tracing-game-for-kids', availability: 'public-ready',
    skillIds: ['letter-sounds'], sourceGameIds: ['eem-g00-letter-tracing'], datasetIds: ['trace-letter-data'],
    learningBoundary: 'Tracing supports letter-form familiarity; it is not evidence that a child can retrieve sounds or decode words.',
  }),
  capability('letter-tracing-with-sounds', {
    label: 'Letter tracing with sounds', kind: 'tracing', path: '/letter-tracing-with-sounds-game', availability: 'public-ready',
    skillIds: ['letter-sounds'], sourceGameIds: ['eem-g00b-letter-tracing-sounds'], datasetIds: ['trace-letter-data', 'phonics-sound-registry'],
    learningBoundary: 'Sound-supported tracing connects print and sound but should feed into blending rather than remain isolated handwriting practice.',
  }),
  capability('letter-sounds-game', {
    label: 'Letter sounds game', kind: 'interactive-game', path: '/free-letter-sounds-game-for-kids', availability: 'public-ready',
    skillIds: ['letter-sounds'], sourceGameIds: ['eem-g04-letter-sounds'], datasetIds: ['phonics-sound-registry'],
    learningBoundary: 'Recognition practice must ultimately transfer to decoding and spelling.',
  }),
  capability('balloon-pop-phonics', {
    label: 'Balloon pop phonics game', kind: 'interactive-game', path: '/free-balloon-pop-phonics-game-for-kids', availability: 'public-ready',
    skillIds: ['phonemic-awareness', 'letter-sounds'], sourceGameIds: ['eem-g04b-balloon-pop'], datasetIds: ['phonics-sound-registry'],
    learningBoundary: 'Fast sound matching is practice, not a substitute for fresh-word decoding.',
  }),
  capability('sound-listening', {
    label: 'Sound listening game', kind: 'interactive-game', path: '/free-sound-listening-game-for-kids', availability: 'public-ready',
    skillIds: ['phonemic-awareness', 'letter-sounds'], sourceGameIds: ['eem-g05-sound-listening'], datasetIds: ['phonics-sound-registry'],
    learningBoundary: 'Listening tasks should keep speech-sound discrimination distinct from printed decoding.',
  }),
  capability('word-building-game', {
    label: 'Word building game', kind: 'interactive-game', path: '/free-word-building-game-for-kids', availability: 'public-ready',
    skillIds: ['blending', 'segmenting', 'cvc', 'digraphs'], sourceGameIds: ['eem-g06-blend-2-sounds', 'eem-g06b-more-blending', 'eem-g08b-read-tiny-words', 'eem-g09-word-families'], datasetIds: ['phonics-word-utility-registry', 'phonics-sound-registry'],
    learningBoundary: 'Only use words whose required correspondences are already taught; do not infer pronunciation from spelling.',
  }),
  capability('spelling-game', {
    label: 'Spelling game', kind: 'interactive-game', path: '/free-spelling-game-for-kids', availability: 'public-ready',
    skillIds: ['segmenting', 'cvc', 'spelling-rules'], sourceGameIds: ['eem-g10-spelling-practice'], datasetIds: ['phonics-word-utility-registry'],
    learningBoundary: 'Encoding practice should diagnose phoneme segmentation separately from later spelling-choice knowledge.',
  }),
  capability('reading-fluency-game', {
    label: 'Reading fluency game', kind: 'interactive-game', path: '/free-reading-fluency-game-for-kids', availability: 'public-ready',
    skillIds: ['fluency'], sourceGameIds: ['eem-g18-fluent-reading'], datasetIds: ['connected-reading-content'],
    learningBoundary: 'Fluency practice follows accurate decoding; rate alone is not the goal.',
  }),
  capability('word-meaning-flashcards', {
    label: 'Word meaning flashcards', kind: 'interactive-game', path: '/free-games/word-meaning-flashcards', availability: 'public-ready',
    skillIds: ['comprehension-transition'], sourceGameIds: ['eem-g21-meaning-from-context'], datasetIds: ['vocabulary-practice-content'],
    learningBoundary: 'Vocabulary practice supports comprehension but does not remediate a decoding bottleneck by itself.',
  }),
]);

const byId = new Map(PHONICS_PRACTICE_CAPABILITIES.map((entry) => [entry.id, entry]));
if (byId.size !== PHONICS_PRACTICE_CAPABILITIES.length) throw new Error('PH5 practice registry contains duplicate capability IDs.');
for (const entry of PHONICS_PRACTICE_CAPABILITIES) {
  for (const skillId of entry.skillIds) if (!getPhonicsReadingSkill(skillId)) throw new Error(`PH5 ${entry.id} references unknown skill: ${skillId}`);
  for (const gameId of entry.sourceGameIds) {
    const publicRoute = PUBLIC_TILE_ROUTES[gameId];
    if (!publicRoute?.enabled) throw new Error(`PH5 ${entry.id} references a non-public game: ${gameId}`);
    if (publicRoute.route !== entry.path) throw new Error(`PH5 ${entry.id} route drift for ${gameId}: ${publicRoute.route}`);
  }
}

export function getPhonicsPracticeCapability(id: string): PhonicsPracticeCapability | null {
  return byId.get(String(id || '')) ?? null;
}

export function getPhonicsPracticeCapabilitiesForSkill(skillId: string): readonly PhonicsPracticeCapability[] {
  return Object.freeze(PHONICS_PRACTICE_CAPABILITIES.filter((entry) => entry.skillIds.includes(String(skillId || ''))));
}

export function getPhonicsPracticeCapabilityByPath(path: string): PhonicsPracticeCapability | null {
  return PHONICS_PRACTICE_CAPABILITIES.find((entry) => entry.path === path) ?? null;
}
