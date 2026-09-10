const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);

export const PHONICS_READING_TAXONOMY_REVISION = '2026-09-10-ph1';

export const PHONICS_READING_TEACHING_STAGES = freezeList([
  'pre-print',
  'foundations',
  'early-decoding',
  'pattern-decoding',
  'advanced-decoding',
  'reading-transition',
]);

function skill(id, config) {
  return freeze({
    id,
    label: config.label,
    skill: config.skill,
    teachingStage: config.teachingStage,
    prerequisiteIds: freezeList(config.prerequisiteIds),
    graphemes: freezeList(config.graphemes),
    phonemes: freezeList(config.phonemes),
    exampleWords: freezeList(config.exampleWords),
    exceptions: freezeList(config.exceptions),
    pronunciationConventions: freezeList(config.pronunciationConventions),
    relatedSkillIds: freezeList(config.relatedSkillIds),
    nextSkillIds: freezeList(config.nextSkillIds),
    knowledgeConceptIds: freezeList(config.knowledgeConceptIds),
    learningBoundary: config.learningBoundary,
  });
}

/**
 * PH1 is the authoritative high-level structured-literacy progression for
 * Session A. It is intentionally route-agnostic: taxonomy membership never
 * auto-publishes a URL. Granular R8 phonics concepts remain useful supporting
 * knowledge; this layer provides the complete child-skill progression that was
 * previously spread across curriculum, articles, games and reading journeys.
 */
export const PHONICS_READING_TAXONOMY = freezeList([
  skill('phonemic-awareness', {
    label: 'Phonemic awareness',
    skill: 'Hear, identify, blend, segment and manipulate speech sounds before relying on print.',
    teachingStage: 'pre-print',
    prerequisiteIds: [],
    graphemes: [],
    phonemes: ['individual spoken phonemes', 'onsets and rimes where developmentally useful'],
    exampleWords: ['sat', 'map', 'fish', 'ship'],
    exceptions: ['This is an oral language skill; printed letters are not required for the core task.'],
    pronunciationConventions: ['Model clean speech sounds without adding an extra schwa to consonants.', 'Accept ordinary accent variation while keeping the target contrast clear.'],
    relatedSkillIds: ['blending', 'segmenting'],
    nextSkillIds: ['letter-sounds'],
    knowledgeConceptIds: ['phonemic-awareness'],
    learningBoundary: 'A child can know alphabet names and still need oral phonemic work before printed decoding becomes reliable.',
  }),
  skill('letter-sounds', {
    label: 'Letter sounds',
    skill: 'Connect common graphemes to useful speech sounds and recall them accurately enough for decoding and spelling.',
    teachingStage: 'foundations',
    prerequisiteIds: ['phonemic-awareness'],
    graphemes: ['s', 'a', 't', 'i', 'p', 'n', 'c', 'k', 'e', 'h', 'r', 'm', 'd', 'g', 'o', 'u', 'l', 'f', 'b', 'j', 'z', 'w', 'v', 'y', 'x', 'q'],
    phonemes: ['common consonant phonemes', 'short vowel phonemes'],
    exampleWords: ['sat', 'pin', 'map', 'dog'],
    exceptions: ['Letters can represent more than one sound; begin with frequent correspondences and add alternatives explicitly later.'],
    pronunciationConventions: ['Use the sound required for blending rather than the letter name.', 'Keep stop consonants clipped and continuous consonants stretchable without a strong added vowel.'],
    relatedSkillIds: ['phonemic-awareness', 'blending', 'segmenting'],
    nextSkillIds: ['blending', 'segmenting'],
    knowledgeConceptIds: ['letter-sound-foundations', 'satpin'],
    learningBoundary: 'Sound recall is useful only when it transfers into hearing, blending, segmenting and fresh word reading.',
  }),
  skill('blending', {
    label: 'Blending',
    skill: 'Combine a left-to-right sequence of known phonemes into a spoken word and transfer the process to print.',
    teachingStage: 'early-decoding',
    prerequisiteIds: ['phonemic-awareness', 'letter-sounds'],
    graphemes: [],
    phonemes: ['ordered phoneme sequences'],
    exampleWords: ['sat', 'pin', 'sun', 'map'],
    exceptions: ['A word is not an appropriate blending target if it depends on untaught correspondences at the child’s current stage.'],
    pronunciationConventions: ['Keep sounds close enough together that the sequence is retained.', 'Do not insert extra vowel sounds between consonants while modelling a blend.'],
    relatedSkillIds: ['segmenting', 'cvc'],
    nextSkillIds: ['segmenting', 'cvc'],
    knowledgeConceptIds: ['blending'],
    learningBoundary: 'Successful blending must transfer to unfamiliar decodable words rather than only rehearsed lists.',
  }),
  skill('segmenting', {
    label: 'Segmenting',
    skill: 'Break a spoken word into ordered phonemes and connect those sounds to spellings for encoding.',
    teachingStage: 'early-decoding',
    prerequisiteIds: ['phonemic-awareness', 'letter-sounds'],
    graphemes: [],
    phonemes: ['initial', 'medial', 'final phonemes'],
    exampleWords: ['sat', 'map', 'fish', 'ring'],
    exceptions: ['The number of phonemes is not always the number of letters: ship has four letters but three phonemes.'],
    pronunciationConventions: ['Say the whole word naturally before stretching or tapping individual phonemes.', 'Keep digraphs as one phoneme when the taught spelling represents one sound.'],
    relatedSkillIds: ['blending', 'cvc', 'spelling-rules'],
    nextSkillIds: ['cvc'],
    knowledgeConceptIds: ['phonemic-awareness'],
    learningBoundary: 'Segmenting is the encoding partner of blending and should be checked independently rather than assumed from reading success.',
  }),
  skill('cvc', {
    label: 'CVC decoding and encoding',
    skill: 'Read and spell regular consonant-vowel-consonant words using known consonants and short vowels.',
    teachingStage: 'early-decoding',
    prerequisiteIds: ['blending', 'segmenting', 'letter-sounds'],
    graphemes: ['CVC structure', 'a', 'e', 'i', 'o', 'u'],
    phonemes: ['short vowel phonemes', 'known consonant phonemes'],
    exampleWords: ['cat', 'bed', 'pin', 'hot', 'sun'],
    exceptions: ['Not every three-letter word is a regular CVC word at the child’s current stage.'],
    pronunciationConventions: ['Hear and preserve the medial short vowel instead of guessing from the outside letters.'],
    relatedSkillIds: ['blending', 'segmenting', 'digraphs', 'blends'],
    nextSkillIds: ['digraphs', 'blends'],
    knowledgeConceptIds: ['short-vowels', 'cvc-words'],
    learningBoundary: 'Fresh-word transfer matters more than memorising a fixed CVC card set.',
  }),
  skill('digraphs', {
    label: 'Consonant digraphs',
    skill: 'Recognise common multi-letter graphemes that represent one primary consonant sound in taught words.',
    teachingStage: 'pattern-decoding',
    prerequisiteIds: ['cvc'],
    graphemes: ['sh', 'ch', 'th', 'ng', 'ph', 'wh'],
    phonemes: ['/sh/', '/ch/', 'voiced and voiceless th', '/ng/', '/f/', 'accent-dependent wh/w'],
    exampleWords: ['ship', 'chat', 'thin', 'this', 'ring', 'phone'],
    exceptions: ['Not every two-letter consonant spelling is a digraph: a consonant blend preserves multiple phonemes.', 'Some digraph spellings have alternative pronunciations in later vocabulary.'],
    pronunciationConventions: ['Teach voiced and voiceless th as distinct sound outcomes.', 'Treat accent-sensitive wh without judging one ordinary accent as incorrect.'],
    relatedSkillIds: ['blends', 'spelling-rules'],
    nextSkillIds: ['blends', 'long-vowels'],
    knowledgeConceptIds: ['digraph-sh', 'digraph-ch', 'digraph-th', 'digraph-ng', 'digraph-wh-ph'],
    learningBoundary: 'Children should recognise the grapheme inside unfamiliar decodable words, not only recite a digraph list.',
  }),
  skill('blends', {
    label: 'Consonant blends',
    skill: 'Read and spell adjacent consonants while retaining the individual phonemes in sequence.',
    teachingStage: 'pattern-decoding',
    prerequisiteIds: ['cvc', 'digraphs'],
    graphemes: ['st', 'sp', 'sn', 'bl', 'cl', 'fl', 'gr', 'cr', 'nd', 'mp', 'nt'],
    phonemes: ['two- and three-consonant phoneme sequences'],
    exampleWords: ['stop', 'spin', 'flag', 'crab', 'hand', 'jump'],
    exceptions: ['A blend is different from a digraph because the component consonant phonemes remain audible.'],
    pronunciationConventions: ['Model the consonants closely but do not collapse them into a new single sound.', 'Avoid inserting a vowel between adjacent consonants.'],
    relatedSkillIds: ['digraphs', 'cvc', 'multisyllabic-decoding'],
    nextSkillIds: ['long-vowels'],
    knowledgeConceptIds: [],
    learningBoundary: 'The goal is accurate sequencing in new words, not naming blend families from memory.',
  }),
  skill('long-vowels', {
    label: 'Long vowels and Magic E',
    skill: 'Read common long-vowel spellings, beginning with controlled split-vowel/Magic E patterns and expanding to other frequent spellings.',
    teachingStage: 'pattern-decoding',
    prerequisiteIds: ['cvc', 'blends'],
    graphemes: ['a_e', 'e_e', 'i_e', 'o_e', 'u_e'],
    phonemes: ['long a', 'long e', 'long i', 'long o', 'long u'],
    exampleWords: ['cake', 'these', 'kite', 'home', 'cube'],
    exceptions: ['Final e does not always make the preceding vowel long.', 'Long u may be pronounced with /yoo/ or /oo/ depending on the word and accent.'],
    pronunciationConventions: ['Teach the target word’s pronunciation explicitly rather than treating the written pattern as an infallible rule.'],
    relatedSkillIds: ['vowel-teams', 'spelling-rules'],
    nextSkillIds: ['vowel-teams', 'spelling-rules'],
    knowledgeConceptIds: ['magic-e', 'long-vowel-families'],
    learningBoundary: 'Children need to contrast short- and long-vowel words and apply the pattern in fresh decoding and spelling.',
  }),
  skill('vowel-teams', {
    label: 'Vowel teams and common vowel patterns',
    skill: 'Decode and spell frequent multi-letter vowel spellings while learning that one spelling can have more than one pronunciation.',
    teachingStage: 'pattern-decoding',
    prerequisiteIds: ['long-vowels'],
    graphemes: ['ai', 'ay', 'ee', 'ea', 'oa', 'ow', 'ie', 'igh', 'oo'],
    phonemes: ['long-vowel phonemes', 'common oo variants'],
    exampleWords: ['rain', 'play', 'seed', 'team', 'boat', 'night', 'book', 'moon'],
    exceptions: ['Vowel teams are not one-sound-only rules; ea, ow, oo and other spellings can represent multiple pronunciations.'],
    pronunciationConventions: ['Store and teach pronunciation at word/pattern level where the spelling is ambiguous.', 'Do not infer a sound from the grapheme alone when multiple legitimate mappings exist.'],
    relatedSkillIds: ['long-vowels', 'advanced-patterns', 'spelling-rules'],
    nextSkillIds: ['spelling-rules', 'r-controlled'],
    knowledgeConceptIds: ['vowel-team-ai', 'vowel-team-ee', 'vowel-team-ea', 'vowel-team-oa', 'diphthong-oo'],
    learningBoundary: 'Pattern knowledge should improve transfer to unfamiliar words, not become another memorised word list.',
  }),
  skill('spelling-rules', {
    label: 'Spelling rules and positional generalisations',
    skill: 'Use high-value spelling generalisations to choose likely graphemes while preserving explicit exception awareness.',
    teachingStage: 'pattern-decoding',
    prerequisiteIds: ['segmenting', 'cvc', 'digraphs', 'long-vowels'],
    graphemes: ['ck', 'ff', 'll', 'ss', 'zz', 'tch', 'dge', 'consonant-le'],
    phonemes: ['/k/', '/f/', '/l/', '/s/', '/z/', '/ch/', '/j/'],
    exampleWords: ['back', 'hill', 'miss', 'buzz', 'match', 'badge', 'little'],
    exceptions: ['These are useful English spelling generalisations, not exception-free laws.'],
    pronunciationConventions: ['Teach the sound first, then the positional spelling choice.', 'Separate grapheme choice from pronunciation when multiple spellings represent the same phoneme.'],
    relatedSkillIds: ['segmenting', 'vowel-teams', 'multisyllabic-decoding'],
    nextSkillIds: ['r-controlled', 'advanced-patterns'],
    knowledgeConceptIds: ['ck-rule', 'floss-rule', 'digraph-tch', 'dge-rule', 'consonant-le'],
    learningBoundary: 'A child should explain and apply the generalisation in mixed dictation rather than reproduce an isolated rule sentence.',
  }),
  skill('r-controlled', {
    label: 'R-controlled vowel patterns',
    skill: 'Read and spell common vowel-plus-r patterns while respecting accent differences and spelling alternatives.',
    teachingStage: 'advanced-decoding',
    prerequisiteIds: ['vowel-teams', 'spelling-rules'],
    graphemes: ['ar', 'or', 'er', 'ir', 'ur'],
    phonemes: ['r-influenced vowel phonemes'],
    exampleWords: ['car', 'fork', 'her', 'bird', 'turn'],
    exceptions: ['Pronunciation varies by rhotic/non-rhotic accent and by word.', 'Er, ir and ur often overlap in sound but remain different spellings.'],
    pronunciationConventions: ['Treat ordinary accent variation explicitly and keep spelling instruction separate from accent correction.'],
    relatedSkillIds: ['vowel-teams', 'advanced-patterns'],
    nextSkillIds: ['advanced-patterns'],
    knowledgeConceptIds: ['r-controlled-ar', 'r-controlled-or', 'r-controlled-er-ir-ur'],
    learningBoundary: 'Children should recognise the written pattern and decode the word within their accent, not imitate a single accent model mechanically.',
  }),
  skill('advanced-patterns', {
    label: 'Advanced spelling and pronunciation patterns',
    skill: 'Handle less regular or multi-option patterns through explicit pattern families, word-level mappings and exception-aware teaching.',
    teachingStage: 'advanced-decoding',
    prerequisiteIds: ['vowel-teams', 'spelling-rules', 'r-controlled'],
    graphemes: ['oi', 'oy', 'ou', 'ow', 'aw', 'au', 'eigh', 'augh', 'ough', 'kn', 'wr', 'mb', 'soft c', 'soft g', 'y', 'schwa'],
    phonemes: ['diphthongs', 'alternative vowel phonemes', 'soft consonant phonemes', 'schwa', 'silent-letter outcomes'],
    exampleWords: ['coin', 'toy', 'out', 'cow', 'haul', 'eight', 'caught', 'night', 'city', 'gem', 'happy', 'about'],
    exceptions: ['OUGH and several advanced spelling families have multiple pronunciations and must not be taught as one deterministic sound rule.', 'Schwa depends on stress and accent.'],
    pronunciationConventions: ['Use explicit word-level sound mappings for ambiguous spellings.', 'Preserve accent-sensitive notes for r-colouring, wh, schwa and other variable outcomes.'],
    relatedSkillIds: ['vowel-teams', 'r-controlled', 'multisyllabic-decoding'],
    nextSkillIds: ['multisyllabic-decoding'],
    knowledgeConceptIds: ['soft-c-hard-c', 'soft-g-hard-g', 'silent-kn-wr-mb', 'shy-i-toughy-y', 'schwa-lazy-vowel', 'ough-family'],
    learningBoundary: 'The system should group meaningful pattern families; it must not create a separate public page for every word or pronunciation variant.',
  }),
  skill('multisyllabic-decoding', {
    label: 'Multisyllabic decoding',
    skill: 'Break longer words into manageable syllable/morpheme units, apply known patterns, blend the parts and confirm the whole word in context.',
    teachingStage: 'advanced-decoding',
    prerequisiteIds: ['advanced-patterns', 'spelling-rules'],
    graphemes: ['closed syllables', 'open syllables', 'consonant-le', 'common prefixes and suffixes'],
    phonemes: ['syllable-level sound sequences'],
    exampleWords: ['sunset', 'rabbit', 'inside', 'little', 'helpful'],
    exceptions: ['Syllable division is a decoding aid rather than a promise that every English word divides or pronounces perfectly by one visual rule.'],
    pronunciationConventions: ['Reblend the whole word naturally after decoding parts.', 'Allow unstressed vowels to reduce naturally, including schwa where appropriate.'],
    relatedSkillIds: ['advanced-patterns', 'fluency'],
    nextSkillIds: ['fluency'],
    knowledgeConceptIds: ['rabbit-rule', 'consonant-le', 'schwa-lazy-vowel'],
    learningBoundary: 'Success means independently attacking unfamiliar longer words, not merely clapping syllables in familiar vocabulary.',
  }),
  skill('fluency', {
    label: 'Reading fluency',
    skill: 'Read connected text accurately, with increasing automaticity, appropriate phrasing and enough ease to preserve meaning.',
    teachingStage: 'reading-transition',
    prerequisiteIds: ['multisyllabic-decoding'],
    graphemes: [],
    phonemes: [],
    exampleWords: ['connected decodable sentences', 'short passages', 'age-appropriate controlled text'],
    exceptions: ['Fluency is not speed alone; pushing rate before accuracy and phrasing can reinforce guessing.'],
    pronunciationConventions: ['Model natural phrasing and punctuation while accepting ordinary accent variation.', 'Correct decoding errors without demanding performance-style pronunciation.'],
    relatedSkillIds: ['comprehension-transition'],
    nextSkillIds: ['comprehension-transition'],
    knowledgeConceptIds: [],
    learningBoundary: 'The child should use decoding knowledge with less conscious effort while still monitoring accuracy and meaning.',
  }),
  skill('comprehension-transition', {
    label: 'Comprehension transition',
    skill: 'Move from accurate word reading into understanding connected text by combining decoding with vocabulary, syntax, background knowledge and active meaning checks.',
    teachingStage: 'reading-transition',
    prerequisiteIds: ['fluency'],
    graphemes: [],
    phonemes: [],
    exampleWords: ['story vocabulary', 'sentence meaning', 'short passage questions'],
    exceptions: ['Accurate decoding does not guarantee comprehension; language comprehension can remain the limiting factor.'],
    pronunciationConventions: ['Do not treat accent as a comprehension error when the child reads and understands the word accurately.'],
    relatedSkillIds: ['fluency'],
    nextSkillIds: [],
    knowledgeConceptIds: [],
    learningBoundary: 'When a child can read the words but cannot explain the text, diagnosis must move beyond phonics alone.',
  }),
]);

const byId = new Map(PHONICS_READING_TAXONOMY.map((entry) => [entry.id, entry]));
const byStage = new Map();
for (const entry of PHONICS_READING_TAXONOMY) {
  if (!PHONICS_READING_TEACHING_STAGES.includes(entry.teachingStage)) {
    throw new Error(`PH1 taxonomy has unknown teaching stage: ${entry.teachingStage}`);
  }
  const stageEntries = byStage.get(entry.teachingStage) || [];
  stageEntries.push(entry);
  byStage.set(entry.teachingStage, stageEntries);
}
if (byId.size !== PHONICS_READING_TAXONOMY.length) throw new Error('PH1 taxonomy contains duplicate skill IDs.');
for (const entry of PHONICS_READING_TAXONOMY) {
  for (const relation of [...entry.prerequisiteIds, ...entry.relatedSkillIds, ...entry.nextSkillIds]) {
    if (!byId.has(relation)) throw new Error(`PH1 taxonomy ${entry.id} references unknown skill: ${relation}`);
    if (relation === entry.id) throw new Error(`PH1 taxonomy ${entry.id} contains a self relation.`);
  }
}
for (const [stage, values] of byStage) byStage.set(stage, freezeList(values));

export const PHONICS_READING_TAXONOMY_ORDER = freezeList(PHONICS_READING_TAXONOMY.map((entry) => entry.id));

export function getPhonicsReadingSkill(id) {
  return byId.get(String(id || '')) ?? null;
}

export function getPhonicsReadingSkillsByStage(stage) {
  return byStage.get(String(stage || '')) ?? freezeList([]);
}

export function getPhonicsReadingProgression() {
  return PHONICS_READING_TAXONOMY;
}
