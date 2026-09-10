import { getCanonicalTopicOwnerPath } from './canonicalTopicOwnershipRegistry.js';
import { getR16CanonicalTopicOwnerPath } from './readingSemanticCanonicalOwnership.js';
import { getPhonicsReadingSkill } from './phonicsReadingTaxonomy.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);
const assessmentPath = '/book-demo';

export const PHONICS_READING_PROBLEM_REVISION = '2026-09-10-ph4';
export const PHONICS_READING_PROBLEM_OWNER_STATES = freezeList(['existing-diagnostic', 'supporting-owner', 'hold-no-url']);

const problem = (id, config) => freeze({
  id,
  label: config.label,
  symptom: config.symptom,
  explanation: config.explanation,
  diagnosisChecks: freezeList(config.diagnosisChecks),
  skillIds: freezeList(config.skillIds),
  practicePaths: freezeList(config.practicePaths),
  ownerState: config.ownerState,
  ownerTopicId: config.ownerTopicId ?? null,
  ownerPath: config.ownerPath ?? null,
  nextStepPaths: freezeList(config.nextStepPaths),
  assessmentPath,
});

export const PHONICS_READING_PROBLEMS = freezeList([
  problem('letter-sounds-known-cannot-blend', {
    label: 'Knows letter sounds but cannot blend words',
    symptom: 'The child can say individual letter sounds but cannot combine them into a whole printed word.',
    explanation: 'Isolated sound recall has not yet transferred into ordered left-to-right blending.',
    diagnosisChecks: ['Check oral blending without print.', 'Check whether consonants are pronounced cleanly without added vowel sounds.', 'Try fresh decodable CVC words rather than rehearsed cards.'],
    skillIds: ['phonemic-awareness', 'blending', 'cvc'],
    practicePaths: ['/free-letter-sound-games-for-kids', '/free-word-building-games-for-kids'],
    ownerState: 'existing-diagnostic',
    ownerTopicId: 'letter-sounds-known-word-reading-fails',
    ownerPath: getCanonicalTopicOwnerPath('letter-sounds-known-word-reading-fails'),
    nextStepPaths: ['/blog/how-kids-learn-blending', '/blog/cvc-words-explained-for-parents'],
  }),
  problem('guesses-words', {
    label: 'Guesses words instead of decoding',
    symptom: 'The child relies on pictures, the first letter, context or memory instead of reading the full sound sequence.',
    explanation: 'Guessing often signals weak transfer from sound knowledge into complete grapheme-by-grapheme decoding.',
    diagnosisChecks: ['Remove picture cues and use a fresh decodable word.', 'Check whether the child attends to the medial and final sounds.', 'Compare a familiar word with a one-sound-change neighbour.'],
    skillIds: ['blending', 'cvc', 'digraphs'],
    practicePaths: ['/free-word-building-games-for-kids', '/free-reading-games-for-kids'],
    ownerState: 'existing-diagnostic',
    ownerTopicId: 'broad-child-reading-problem',
    ownerPath: getCanonicalTopicOwnerPath('broad-child-reading-problem'),
    nextStepPaths: ['/blog/how-kids-learn-blending', '/blog/cvc-words-explained-for-parents'],
  }),
  problem('slow-decoding', {
    label: 'Decodes accurately but very slowly',
    symptom: 'The child can work out words but effort remains high and connected reading is slow.',
    explanation: 'First separate an accuracy or pattern-knowledge bottleneck from a fluency and automaticity bottleneck.',
    diagnosisChecks: ['Compare accuracy on familiar and unfamiliar decodable words.', 'Check whether slow reading is caused by one unresolved pattern family.', 'If accuracy is secure, observe phrasing and automatic recognition in connected text.'],
    skillIds: ['advanced-patterns', 'multisyllabic-decoding', 'fluency'],
    practicePaths: ['/free-reading-games-for-kids'],
    ownerState: 'existing-diagnostic',
    ownerTopicId: 'slow-reader-help',
    ownerPath: getCanonicalTopicOwnerPath('slow-reader-help'),
    nextStepPaths: ['/blog/how-to-improve-reading-fluency-in-children', '/blog/how-children-recognise-words-automatically-after-phonics'],
  }),
  problem('vowel-confusion', {
    label: 'Mixes up vowel sounds and spellings',
    symptom: 'The child confuses short vowels, long vowels or later vowel teams while reading and spelling.',
    explanation: 'Vowel difficulty should be diagnosed by the specific contrast instead of treated as one general memory problem.',
    diagnosisChecks: ['Check short vowels in mixed CVC words.', 'Then compare short versus long-vowel patterns.', 'Only then test variable vowel teams such as ea, ow or oo.'],
    skillIds: ['cvc', 'long-vowels', 'vowel-teams'],
    practicePaths: ['/free-word-building-games-for-kids', '/free-reading-games-for-kids'],
    ownerState: 'supporting-owner',
    ownerTopicId: 'phonics-subject-discovery',
    ownerPath: getCanonicalTopicOwnerPath('phonics-subject-discovery'),
    nextStepPaths: ['/blog/long-vowel-sounds-for-kids', '/blog/phonics-rules-for-beginners'],
  }),
  problem('unfamiliar-word-decoding', {
    label: 'Can read familiar words but struggles with unfamiliar words',
    symptom: 'Performance drops when the child sees a decodable word that has not been memorised or rehearsed.',
    explanation: 'This is a transfer problem: decoding knowledge must generalise to fresh words and longer word structures.',
    diagnosisChecks: ['Use fresh words built only from taught correspondences.', 'Change one grapheme in a familiar word and reread.', 'For longer words, check syllable and pattern chunking before meaning cues.'],
    skillIds: ['blending', 'cvc', 'advanced-patterns', 'multisyllabic-decoding'],
    practicePaths: ['/free-word-building-games-for-kids', '/free-reading-games-for-kids'],
    ownerState: 'existing-diagnostic',
    ownerTopicId: 'broad-child-reading-problem',
    ownerPath: getCanonicalTopicOwnerPath('broad-child-reading-problem'),
    nextStepPaths: ['/blog/phonics-multisyllabic', '/blog/how-kids-learn-blending'],
  }),
  problem('decodes-but-lacks-fluency', {
    label: 'Decodes words but lacks reading fluency',
    symptom: 'Word reading is broadly accurate, but connected text remains effortful, choppy or poorly phrased.',
    explanation: 'The next step is automatic recognition and repeated accurate connected-text reading, not abandoning decoding for guessing.',
    diagnosisChecks: ['Confirm decoding accuracy before increasing rate.', 'Observe phrase boundaries and punctuation.', 'Check whether repeated accurate exposure improves ease.'],
    skillIds: ['fluency'],
    practicePaths: ['/free-reading-games-for-kids'],
    ownerState: 'existing-diagnostic',
    ownerTopicId: 'reading-fluency-guide',
    ownerPath: getCanonicalTopicOwnerPath('reading-fluency-guide'),
    nextStepPaths: ['/blog/how-children-recognise-words-automatically-after-phonics'],
  }),
  problem('reads-without-comprehension', {
    label: 'Reads the words but does not understand the text',
    symptom: 'The child can pronounce the written words but cannot explain the sentence, story or key ideas.',
    explanation: 'Accurate decoding gives access to the words; comprehension can still be limited by vocabulary, syntax, background knowledge or active meaning monitoring.',
    diagnosisChecks: ['Ask for a simple retell without rereading.', 'Check understanding of key vocabulary.', 'Compare listening comprehension with reading comprehension at a similar language level.'],
    skillIds: ['fluency', 'comprehension-transition'],
    practicePaths: ['/free-reading-games-for-kids'],
    ownerState: 'existing-diagnostic',
    ownerTopicId: 'story-comprehension-diagnostic',
    ownerPath: getR16CanonicalTopicOwnerPath('story-comprehension-diagnostic'),
    nextStepPaths: ['/blog/phonics-comprehension', '/blog/how-vocabulary-supports-reading-comprehension'],
  }),
  problem('spelling-segmenting-difficulty', {
    label: 'Reads better than they can segment and spell',
    symptom: 'The child may recognise or decode a word but cannot reliably break a spoken word into phonemes and choose spellings.',
    explanation: 'Encoding needs its own diagnosis; reading success does not prove secure phoneme segmentation or spelling-pattern choice.',
    diagnosisChecks: ['Say the word without showing print and ask for sound segmentation.', 'Check medial vowel identification.', 'Separate sound segmentation from later grapheme-choice rules.'],
    skillIds: ['segmenting', 'cvc', 'spelling-rules'],
    practicePaths: ['/free-word-building-games-for-kids'],
    ownerState: 'hold-no-url',
    ownerPath: null,
    nextStepPaths: ['/resources/phonics', '/blog/phonics-rules-for-beginners'],
  }),
  problem('memorises-instead-of-reads', {
    label: 'Memorises word cards instead of transferring decoding',
    symptom: 'The child appears successful on practised lists but cannot decode structurally similar fresh words.',
    explanation: 'Stable word recognition should grow from accurate spelling-sound mapping; memorising a fixed card set can hide weak transfer.',
    diagnosisChecks: ['Use unseen words with already taught patterns.', 'Change one sound in a known word and ask the child to reread.', 'Check whether the child can explain the graphemes rather than only name the whole word.'],
    skillIds: ['blending', 'cvc', 'fluency'],
    practicePaths: ['/free-word-building-games-for-kids', '/free-reading-games-for-kids'],
    ownerState: 'hold-no-url',
    ownerTopicId: 'automatic-word-recognition',
    ownerPath: null,
    nextStepPaths: ['/blog/how-children-recognise-words-automatically-after-phonics', '/blog/how-kids-learn-blending'],
  }),
]);

const byId = new Map(PHONICS_READING_PROBLEMS.map((entry) => [entry.id, entry]));
if (byId.size !== 9) throw new Error('PH4 must contain exactly the nine frozen parent reading problems.');
for (const entry of PHONICS_READING_PROBLEMS) {
  if (!PHONICS_READING_PROBLEM_OWNER_STATES.includes(entry.ownerState)) throw new Error(`PH4 unsupported owner state: ${entry.id}`);
  for (const skillId of entry.skillIds) if (!getPhonicsReadingSkill(skillId)) throw new Error(`PH4 ${entry.id} references unknown skill: ${skillId}`);
  if (entry.ownerState === 'existing-diagnostic' && !entry.ownerPath) throw new Error(`PH4 diagnostic is missing owner: ${entry.id}`);
  if (entry.ownerState === 'hold-no-url' && entry.ownerPath) throw new Error(`PH4 held problem cannot own a new URL: ${entry.id}`);
}

export function getPhonicsReadingProblem(problemId) {
  return byId.get(String(problemId || '')) ?? null;
}

export function getPhonicsReadingProblemsForSkill(skillId) {
  return freezeList(PHONICS_READING_PROBLEMS.filter((entry) => entry.skillIds.includes(String(skillId || ''))));
}
