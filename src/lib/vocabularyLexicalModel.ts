import {
  VOCABULARY_AUTHORITY_REQUIREMENTS,
  VOCABULARY_KNOWLEDGE_STAGES,
} from './grammarVocabularyAuthorityRequirements.js';

export type VocabularyDifficultyBandId = 'foundation' | 'developing' | 'expanding' | 'transfer';
export type VocabularyWordClass = 'noun' | 'verb' | 'adjective' | 'adverb' | 'expression';
export type LegacyVocabularyCategory = 'action' | 'feeling' | 'describing' | 'school' | 'everyday';

export type VocabularySemanticDomain = Readonly<{
  id: string;
  label: string;
  description: string;
}>;

export type VocabularyDifficultyBand = Readonly<{
  id: VocabularyDifficultyBandId;
  order: number;
  label: string;
  description: string;
}>;

export type VocabularyLexicalEntry = Readonly<{
  id: string;
  headword: string;
  childFriendlyMeaning: string;
  exampleSentence: string;
  primaryWordClass: VocabularyWordClass;
  difficultyBandId: VocabularyDifficultyBandId;
  stageId: string;
  primaryAuthorityTopicId: string;
  semanticDomainIds: readonly string[];
  legacyCategory: LegacyVocabularyCategory;
  synonyms: readonly string[];
  antonyms: readonly string[];
  wordFamily: readonly string[];
  collocations: readonly string[];
  commonConfusions: readonly string[];
  speakingPrompts: readonly string[];
  writingPrompts: readonly string[];
  migrationSource: 'publicVocabularyContent-v1';
  enrichmentStatus: 'legacy-baseline';
}>;

const freeze = <T>(value: T): Readonly<T> => Object.freeze(value);
const freezeList = <T>(values: readonly T[] = []): readonly T[] => Object.freeze([...values]);

export const VOCABULARY_LEXICAL_MODEL_REVISION = '2026-09-27-gv2';

export const VOCABULARY_DIFFICULTY_BANDS: readonly VocabularyDifficultyBand[] = freezeList([
  freeze({
    id: 'foundation',
    order: 1,
    label: 'Foundation',
    description: 'High-frequency, concrete or immediately useful child vocabulary that can be understood through a short definition, sentence or familiar context.',
  }),
  freeze({
    id: 'developing',
    order: 2,
    label: 'Developing',
    description: 'Broader vocabulary that requires comparison, multiple contexts, word relationships or more precise semantic distinctions.',
  }),
  freeze({
    id: 'expanding',
    order: 3,
    label: 'Expanding',
    description: 'Richer vocabulary including morphology, collocations, phrasal expressions and less concrete school or real-world language.',
  }),
  freeze({
    id: 'transfer',
    order: 4,
    label: 'Transfer',
    description: 'Vocabulary selected for independent speaking, writing, explanation, argument, storytelling and school-language transfer.',
  }),
]);

export const VOCABULARY_SEMANTIC_DOMAINS: readonly VocabularySemanticDomain[] = freezeList([
  freeze({ id: 'actions', label: 'Actions', description: 'Movement, communication, learning and everyday actions.' }),
  freeze({ id: 'feelings-emotions', label: 'Feelings & Emotions', description: 'Emotion, mood, response and social-feeling vocabulary.' }),
  freeze({ id: 'description-properties', label: 'Description & Properties', description: 'Size, speed, temperature, sound, texture, colour and quality words.' }),
  freeze({ id: 'school-learning', label: 'School & Learning', description: 'Classroom people, objects, places, instructions and learning actions.' }),
  freeze({ id: 'home-family-routines', label: 'Home, Family & Routines', description: 'Family, rooms, household objects and daily-routine vocabulary.' }),
  freeze({ id: 'places-environment', label: 'Places & Environment', description: 'Local places, streets, gardens, transport-adjacent and environmental vocabulary.' }),
  freeze({ id: 'everyday-objects', label: 'Everyday Objects', description: 'Common concrete objects used across home, school and daily life.' }),
  freeze({ id: 'word-relationships', label: 'Word Relationships', description: 'Synonyms, antonyms, multiple meanings, shades of meaning and confusable words.' }),
  freeze({ id: 'word-building', label: 'Word Building', description: 'Roots, word families, prefixes, suffixes and morphology-driven vocabulary growth.' }),
  freeze({ id: 'context-inference', label: 'Context & Inference', description: 'Vocabulary meaning inferred and checked from sentence or passage context.' }),
  freeze({ id: 'natural-english', label: 'Natural English', description: 'Collocations, phrasal verbs, expressions and natural word combinations.' }),
  freeze({ id: 'speaking-transfer', label: 'Speaking Transfer', description: 'Vocabulary for fuller spoken answers, retelling, conversation and presentation.' }),
  freeze({ id: 'writing-transfer', label: 'Writing Transfer', description: 'Vocabulary for precise verbs, description, sequence, cause, opinion and revision.' }),
]);

const lexical = (config: Omit<VocabularyLexicalEntry, 'migrationSource' | 'enrichmentStatus'>): VocabularyLexicalEntry => freeze({
  ...config,
  semanticDomainIds: freezeList(config.semanticDomainIds),
  synonyms: freezeList(config.synonyms),
  antonyms: freezeList(config.antonyms),
  wordFamily: freezeList(config.wordFamily),
  collocations: freezeList(config.collocations),
  commonConfusions: freezeList(config.commonConfusions),
  speakingPrompts: freezeList(config.speakingPrompts),
  writingPrompts: freezeList(config.writingPrompts),
  migrationSource: 'publicVocabularyContent-v1',
  enrichmentStatus: 'legacy-baseline',
});

const base = (
  id: string,
  headword: string,
  childFriendlyMeaning: string,
  exampleSentence: string,
  primaryWordClass: VocabularyWordClass,
  legacyCategory: LegacyVocabularyCategory,
  primaryAuthorityTopicId: string,
  semanticDomainIds: readonly string[],
  relationships: Partial<Pick<VocabularyLexicalEntry, 'synonyms' | 'antonyms'>> = {},
): VocabularyLexicalEntry => lexical({
  id,
  headword,
  childFriendlyMeaning,
  exampleSentence,
  primaryWordClass,
  difficultyBandId: 'foundation',
  stageId: 'everyday-foundations',
  primaryAuthorityTopicId,
  semanticDomainIds,
  legacyCategory,
  synonyms: relationships.synonyms ?? [],
  antonyms: relationships.antonyms ?? [],
  wordFamily: [],
  collocations: [],
  commonConfusions: [],
  speakingPrompts: [],
  writingPrompts: [],
});

export const VOCABULARY_LEXICAL_ENTRIES: readonly VocabularyLexicalEntry[] = freezeList([
  base('run', 'run', 'to move fast using your legs', 'I run in the park.', 'verb', 'action', 'action-words', ['actions']),
  base('jump', 'jump', 'to push your body up into the air', 'The boy jumps over the rope.', 'verb', 'action', 'action-words', ['actions']),
  base('eat', 'eat', 'to put food in your mouth and swallow it', 'I eat an apple.', 'verb', 'action', 'action-words', ['actions']),
  base('read', 'read', 'to look at words and understand them', 'She reads a storybook.', 'verb', 'action', 'action-words', ['actions', 'school-learning']),
  base('write', 'write', 'to make letters or words on paper', 'I write my name.', 'verb', 'action', 'action-words', ['actions', 'school-learning']),
  base('draw', 'draw', 'to make a picture with a pencil, crayon, or pen', 'I draw a flower.', 'verb', 'action', 'action-words', ['actions']),
  base('sing', 'sing', 'to make music with your voice', 'We sing a happy song.', 'verb', 'action', 'action-words', ['actions']),
  base('dance', 'dance', 'to move your body to music', 'The children dance on the stage.', 'verb', 'action', 'action-words', ['actions']),
  base('carry', 'carry', 'to hold something and take it with you', 'I carry my school bag.', 'verb', 'action', 'action-words', ['actions']),
  base('open', 'open', 'to move something so it is not closed', 'Please open the door.', 'verb', 'action', 'action-words', ['actions'], { antonyms: ['close'] }),

  base('happy', 'happy', 'feeling good or joyful', 'The child is happy.', 'adjective', 'feeling', 'feelings-emotions', ['feelings-emotions'], { synonyms: ['joyful'], antonyms: ['sad'] }),
  base('sad', 'sad', 'feeling unhappy', 'The girl is sad.', 'adjective', 'feeling', 'feelings-emotions', ['feelings-emotions']),
  base('angry', 'angry', 'feeling upset or mad', 'He is angry because his toy broke.', 'adjective', 'feeling', 'feelings-emotions', ['feelings-emotions']),
  base('tired', 'tired', 'needing rest or sleep', 'I am tired after playing.', 'adjective', 'feeling', 'feelings-emotions', ['feelings-emotions']),
  base('excited', 'excited', 'feeling very happy and eager', 'She is excited for her birthday.', 'adjective', 'feeling', 'feelings-emotions', ['feelings-emotions']),
  base('scared', 'scared', 'feeling afraid', 'The puppy is scared of thunder.', 'adjective', 'feeling', 'feelings-emotions', ['feelings-emotions']),
  base('proud', 'proud', 'feeling happy about something you did well', 'I am proud of my drawing.', 'adjective', 'feeling', 'feelings-emotions', ['feelings-emotions']),
  base('bored', 'bored', 'feeling uninterested', 'He is bored during the long wait.', 'adjective', 'feeling', 'feelings-emotions', ['feelings-emotions']),
  base('calm', 'calm', 'peaceful and not worried', 'I feel calm after taking a deep breath.', 'adjective', 'feeling', 'feelings-emotions', ['feelings-emotions'], { synonyms: ['peaceful'] }),
  base('surprised', 'surprised', 'feeling amazed because something unexpected happened', 'She was surprised by the gift.', 'adjective', 'feeling', 'feelings-emotions', ['feelings-emotions']),

  base('big', 'big', 'large in size', 'The elephant is big.', 'adjective', 'describing', 'describing-words', ['description-properties'], { synonyms: ['large'], antonyms: ['small'] }),
  base('small', 'small', 'little in size', 'The cup is small.', 'adjective', 'describing', 'describing-words', ['description-properties']),
  base('soft', 'soft', 'smooth and gentle to touch', 'The pillow is soft.', 'adjective', 'describing', 'describing-words', ['description-properties']),
  base('loud', 'loud', 'making a lot of sound', 'The drum is loud.', 'adjective', 'describing', 'describing-words', ['description-properties']),
  base('bright', 'bright', 'full of light or colour', 'The sun is bright.', 'adjective', 'describing', 'describing-words', ['description-properties'], { synonyms: ['shiny'] }),
  base('clean', 'clean', 'not dirty', 'My room is clean.', 'adjective', 'describing', 'describing-words', ['description-properties'], { antonyms: ['dirty'] }),
  base('cold', 'cold', 'having a low temperature', 'The water is cold.', 'adjective', 'describing', 'describing-words', ['description-properties']),
  base('sweet', 'sweet', 'tasting like sugar', 'The mango is sweet.', 'adjective', 'describing', 'describing-words', ['description-properties']),
  base('fast', 'fast', 'moving quickly', 'The rabbit is fast.', 'adjective', 'describing', 'describing-words', ['description-properties'], { synonyms: ['quick'], antonyms: ['slow'] }),
  base('slow', 'slow', 'moving with little speed', 'The turtle is slow.', 'adjective', 'describing', 'describing-words', ['description-properties']),

  base('pencil', 'pencil', 'a tool used for writing or drawing', 'I write with a pencil.', 'noun', 'school', 'school-vocabulary', ['school-learning', 'everyday-objects']),
  base('teacher', 'teacher', 'a person who helps children learn', 'My teacher explains the lesson.', 'noun', 'school', 'school-vocabulary', ['school-learning']),
  base('classroom', 'classroom', 'a room where children learn', 'We sit in the classroom.', 'noun', 'school', 'school-vocabulary', ['school-learning']),
  base('lesson', 'lesson', 'something we learn', "Today's lesson is about words.", 'noun', 'school', 'school-vocabulary', ['school-learning']),
  base('homework', 'homework', 'school work done at home', 'I finish my homework.', 'noun', 'school', 'school-vocabulary', ['school-learning']),
  base('notebook', 'notebook', 'a book used for writing notes or work', 'I write answers in my notebook.', 'noun', 'school', 'school-vocabulary', ['school-learning', 'everyday-objects']),
  base('question', 'question', 'something we ask to get an answer', 'The teacher asks a question.', 'noun', 'school', 'school-vocabulary', ['school-learning']),
  base('answer', 'answer', 'what we say or write for a question', 'I know the answer.', 'noun', 'school', 'school-vocabulary', ['school-learning']),
  base('library', 'library', 'a place where books are kept', 'We read books in the library.', 'noun', 'school', 'school-vocabulary', ['school-learning', 'places-environment']),
  base('practice', 'practice', 'doing something again to get better', 'I practice reading every day.', 'verb', 'school', 'school-vocabulary', ['school-learning', 'actions']),

  base('family', 'family', 'people who live with us or care for us', 'I love my family.', 'noun', 'everyday', 'home-family-routines', ['home-family-routines']),
  base('garden', 'garden', 'a place where plants and flowers grow', 'The flowers are in the garden.', 'noun', 'everyday', 'nature-weather-places-transport', ['places-environment']),
  base('market', 'market', 'a place where people buy and sell things', 'We buy fruits from the market.', 'noun', 'everyday', 'nature-weather-places-transport', ['places-environment']),
  base('bottle', 'bottle', 'a container used to hold water or other liquids', 'I drink water from a bottle.', 'noun', 'everyday', 'everyday-vocabulary', ['everyday-objects']),
  base('window', 'window', 'an opening in a wall that lets in light and air', 'I opened the window.', 'noun', 'everyday', 'home-family-routines', ['home-family-routines', 'everyday-objects']),
  base('kitchen', 'kitchen', 'a room where food is cooked', 'Mother is in the kitchen.', 'noun', 'everyday', 'home-family-routines', ['home-family-routines']),
  base('blanket', 'blanket', 'a warm cover used while sleeping', 'I sleep under a blanket.', 'noun', 'everyday', 'home-family-routines', ['home-family-routines', 'everyday-objects']),
  base('street', 'street', 'a road in a town or city', 'Cars move on the street.', 'noun', 'everyday', 'nature-weather-places-transport', ['places-environment']),
  base('neighbour', 'neighbour', 'a person who lives near your home', 'Our neighbour has a dog.', 'noun', 'everyday', 'home-family-routines', ['home-family-routines']),
  base('morning', 'morning', 'the early part of the day', 'I brush my teeth in the morning.', 'noun', 'everyday', 'home-family-routines', ['home-family-routines']),
]);

export const VOCABULARY_LEXICAL_ENTRIES_BY_ID = Object.fromEntries(
  VOCABULARY_LEXICAL_ENTRIES.map((entry) => [entry.id, entry]),
) as Readonly<Record<string, VocabularyLexicalEntry>>;

export const VOCABULARY_LEXICAL_ENTRY_IDS = freezeList(VOCABULARY_LEXICAL_ENTRIES.map((entry) => entry.id));

export function toLegacyPublicVocabularyWord(entry: VocabularyLexicalEntry) {
  return freeze({
    id: entry.id,
    word: entry.headword,
    meaning: entry.childFriendlyMeaning,
    sentence: entry.exampleSentence,
    category: entry.legacyCategory,
  });
}

const stageIds = new Set(VOCABULARY_KNOWLEDGE_STAGES.map((stage) => stage.id));
const topicIds = new Set(VOCABULARY_AUTHORITY_REQUIREMENTS.map((topic) => topic.id));
const domainIds = new Set(VOCABULARY_SEMANTIC_DOMAINS.map((domain) => domain.id));
const difficultyIds = new Set(VOCABULARY_DIFFICULTY_BANDS.map((band) => band.id));

if (VOCABULARY_LEXICAL_ENTRIES.length !== 50) {
  throw new Error(`[vocabularyLexicalModel] Expected 50 migrated legacy entries; found ${VOCABULARY_LEXICAL_ENTRIES.length}.`);
}
if (new Set(VOCABULARY_LEXICAL_ENTRY_IDS).size !== VOCABULARY_LEXICAL_ENTRY_IDS.length) {
  throw new Error('[vocabularyLexicalModel] Duplicate lexical entry id.');
}
if (new Set(VOCABULARY_LEXICAL_ENTRIES.map((entry) => entry.headword.toLowerCase())).size !== VOCABULARY_LEXICAL_ENTRIES.length) {
  throw new Error('[vocabularyLexicalModel] Duplicate legacy headword.');
}

for (const entry of VOCABULARY_LEXICAL_ENTRIES) {
  if (!entry.headword.trim() || !entry.childFriendlyMeaning.trim() || !entry.exampleSentence.trim()) {
    throw new Error(`[vocabularyLexicalModel] Missing core lexical content: ${entry.id}`);
  }
  if (!stageIds.has(entry.stageId)) {
    throw new Error(`[vocabularyLexicalModel] Unknown vocabulary stage: ${entry.id} -> ${entry.stageId}`);
  }
  if (!topicIds.has(entry.primaryAuthorityTopicId)) {
    throw new Error(`[vocabularyLexicalModel] Unknown authority topic: ${entry.id} -> ${entry.primaryAuthorityTopicId}`);
  }
  if (!difficultyIds.has(entry.difficultyBandId)) {
    throw new Error(`[vocabularyLexicalModel] Unknown difficulty band: ${entry.id} -> ${entry.difficultyBandId}`);
  }
  if (!entry.semanticDomainIds.length || entry.semanticDomainIds.some((id) => !domainIds.has(id))) {
    throw new Error(`[vocabularyLexicalModel] Invalid semantic-domain mapping: ${entry.id}`);
  }
  if (entry.migrationSource !== 'publicVocabularyContent-v1' || entry.enrichmentStatus !== 'legacy-baseline') {
    throw new Error(`[vocabularyLexicalModel] Legacy migration provenance changed unexpectedly: ${entry.id}`);
  }
}
