import {
  getPhonicsKnowledgeConcept,
  PHONICS_KNOWLEDGE_DATASET,
} from '../content/phonicsKnowledge/index.js';
import {
  assertCurrentWavePublicationEligibility,
  CURRENT_WAVE_PUBLICATION_APPROVAL_STATE,
} from './resourceExpansionGovernance.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);

export const PHONICS_WAVE_2_REVISION = '2026-09-09-r12';
export const PHONICS_WAVE_2_PREFIX = '/resources/phonics';
export const PHONICS_WAVE_2_PAGE_COUNT = 15;
export const PHONICS_WAVE_2_APPROVAL_REVISION = '2026-09-09-r12-publication-approval';

const approveForCurrentWave = (record) => freeze({
  ...record,
  publicationApprovalState: CURRENT_WAVE_PUBLICATION_APPROVAL_STATE,
  publicationApprovalRevision: PHONICS_WAVE_2_APPROVAL_REVISION,
  publicationApprovalBasis: 'curriculum-eligibility-editorial-intent-and-canonical-governance',
});

const WAVE_2_APPROVAL_DETAILS = freeze({
  'digraph-kn': freeze({ topicId: 'r12-phonics-kn-silent-k', seoTitle: 'KN Digraph in Phonics: Silent K Words & Practice | Tiny Steps', seoDescription: 'Teach initial KN as the /n/ sound in words such as knee, knot and knit, with silent-k guidance, spelling contrasts, common mistakes and practice.', cardTitle: 'KN and the silent K', group: 'Consonant patterns' }),
  'digraph-tch': freeze({ topicId: 'r12-phonics-ch-tch-spelling', seoTitle: 'CH vs TCH in Phonics: The Short-Vowel Spelling Pattern | Tiny Steps', seoDescription: 'Learn when TCH commonly follows a single short vowel in one-syllable words, how CH differs, and how to teach exceptions such as much and rich.', cardTitle: 'CH vs TCH spelling', group: 'Spelling rules' }),
  'soft-g-hard-g': freeze({ topicId: 'r12-phonics-soft-hard-g', seoTitle: 'Soft G and Hard G in Phonics: Gem vs Game | Tiny Steps', seoDescription: 'Learn when G commonly represents /j/ or /g/, how the e-i-y clue works, where it has exceptions, and how to practise soft G and hard G with kids.', cardTitle: 'Soft G and hard G', group: 'Consonant patterns' }),
  'r-controlled-ar': freeze({ topicId: 'r12-phonics-r-controlled-ar', seoTitle: 'AR R-Controlled Vowel in Phonics: Words & Practice | Tiny Steps', seoDescription: 'Teach AR as an r-controlled vowel pattern in words such as car, star and farm, with short-a contrasts, accent-aware guidance and decoding practice.', cardTitle: 'R-controlled AR', group: 'Vowel patterns' }),
  'r-controlled-or': freeze({ topicId: 'r12-phonics-r-controlled-or', seoTitle: 'OR R-Controlled Vowel in Phonics: Words & Practice | Tiny Steps', seoDescription: 'Teach OR as an r-controlled vowel pattern in words such as fork, storm and short, with AR contrasts, pronunciation boundaries and word-family practice.', cardTitle: 'R-controlled OR', group: 'Vowel patterns' }),
  'r-controlled-er-ir-ur': freeze({ topicId: 'r12-phonics-er-ir-ur', seoTitle: 'ER, IR and UR R-Controlled Vowels: Words & Spelling | Tiny Steps', seoDescription: 'Learn why ER, IR and UR often represent a similar r-controlled sound, with her, bird and turn examples, spelling-family comparisons and practice.', cardTitle: 'ER, IR and UR', group: 'Vowel patterns' }),
  'y-secret-vowel': freeze({ topicId: 'r12-phonics-y-as-vowel', seoTitle: 'Y as a Vowel in Phonics: My, Happy, Gym & More | Tiny Steps', seoDescription: 'Learn when Y acts as a vowel, how its sound changes by position in words such as my, happy and gym, and how to teach the patterns without overgeneralising.', cardTitle: 'Y as a vowel', group: 'Vowel patterns' }),
  'diphthong-oo': freeze({ topicId: 'r12-phonics-oo-sounds', seoTitle: 'OO Sounds in Phonics: Moon vs Book Words & Practice | Tiny Steps', seoDescription: 'Teach the two common OO pronunciation families with moon and book, using contrast sets, word sorts, vocabulary checks and clear practice for kids.', cardTitle: 'OO: moon vs book', group: 'Vowel patterns' }),
  'diphthong-oi-oy': freeze({ topicId: 'r12-phonics-oi-oy', seoTitle: 'OI and OY in Phonics: Words, Position Clues & Practice | Tiny Steps', seoDescription: 'Learn how OI and OY commonly represent the same vowel sound, why OI often appears inside words and OY at the end, with word sorts and spelling practice.', cardTitle: 'OI and OY', group: 'Vowel patterns' }),
  'diphthong-au-aw': freeze({ topicId: 'r12-phonics-au-aw', seoTitle: 'AU and AW in Phonics: Words, Sound & Spelling Practice | Tiny Steps', seoDescription: 'Teach AU and AW as related vowel spellings in words such as haul and saw, with controlled word sets, spelling-family comparisons and accent-aware guidance.', cardTitle: 'AU and AW', group: 'Vowel patterns' }),
  'diphthong-ou-ow': freeze({ topicId: 'r12-phonics-ou-ow', seoTitle: 'OU and OW in Phonics: Out vs Cow Words & Practice | Tiny Steps', seoDescription: 'Teach the /ow/ sound with OU and OW in words such as out and cow, while showing why these graphemes can have other pronunciations in different words.', cardTitle: 'OU and OW', group: 'Vowel patterns' }),
  'j-sounds': freeze({ topicId: 'r12-phonics-j-sound-spellings', seoTitle: 'J Sound Spellings in Phonics: J, Soft G and DGE | Tiny Steps', seoDescription: 'Learn three common spellings for the /j/ sound—J, soft G and DGE—with position clues, word examples, spelling contrasts and encoding practice for kids.', cardTitle: 'J sound: J, G and DGE', group: 'Consonant patterns' }),
  'shun-family': freeze({ topicId: 'r12-phonics-shun-family', seoTitle: 'SHUN Sound Family in Phonics: TION, SION & Word Endings | Tiny Steps', seoDescription: 'Teach common /shun/ ending families such as -tion and -sion through whole words, morphology, vocabulary and spelling sorts without forcing one fixed rule.', cardTitle: 'SHUN sound family', group: 'Word structure' }),
  'schwa-lazy-vowel': freeze({ topicId: 'r12-phonics-schwa', seoTitle: 'Schwa Sound for Kids: The Weak Vowel in Longer Words | Tiny Steps', seoDescription: 'Explain schwa as a weak neutral vowel in unstressed syllables, why written vowels can sound reduced, and how to connect pronunciation with stable spelling.', cardTitle: 'Schwa / lazy vowel', group: 'Word structure' }),
  'vowel-team-ui': freeze({ topicId: 'r12-phonics-ui-vowel-sound', seoTitle: 'UI Vowel Sound in Phonics: Fruit, Suit and Tricky UI Words | Tiny Steps', seoDescription: 'Teach UI in the long /oo/ family with fruit and suit, compare it with OO, and show why words such as build need a different pronunciation family.', cardTitle: 'UI vowel sound', group: 'Vowel patterns' }),
});

export const PHONICS_WAVE_2_PUBLICATION_APPROVALS = freeze(Object.fromEntries(
  Object.entries(WAVE_2_APPROVAL_DETAILS).map(([conceptId, record]) => [conceptId, approveForCurrentWave(record)]),
));

const wave2ConceptIds = new Set(PHONICS_KNOWLEDGE_DATASET.filter((concept) => concept.expansionState === 'future-wave-2').map((concept) => concept.id));
const approvedIds = Object.keys(PHONICS_WAVE_2_PUBLICATION_APPROVALS);
if (approvedIds.length !== PHONICS_WAVE_2_PAGE_COUNT) {
  throw new Error(`R12 Wave 2 scope drift: expected ${PHONICS_WAVE_2_PAGE_COUNT} explicit approvals, found ${approvedIds.length}.`);
}
for (const conceptId of approvedIds) if (!wave2ConceptIds.has(conceptId)) throw new Error(`R12 approval is not future-wave-2: ${conceptId}`);

function buildPage(conceptId, approval) {
  const concept = getPhonicsKnowledgeConcept(conceptId);
  assertCurrentWavePublicationEligibility(concept, approval, {
    curriculumState: 'future-wave-2',
    approvalRevision: PHONICS_WAVE_2_APPROVAL_REVISION,
  });
  if (!concept.futureSlugCandidate) throw new Error(`Invalid R12 Wave 2 concept: ${conceptId}`);
  const path = `${PHONICS_WAVE_2_PREFIX}/${concept.futureSlugCandidate}`;
  return freeze({
    conceptId,
    topicId: approval.topicId,
    slug: concept.futureSlugCandidate,
    path,
    seoTitle: approval.seoTitle,
    seoDescription: approval.seoDescription,
    cardTitle: approval.cardTitle,
    group: approval.group,
    publicationState: 'approved-wave-2',
    publicationWave: 'expansion-wave-2',
    publicationRevision: PHONICS_WAVE_2_REVISION,
    publicationApprovalState: approval.publicationApprovalState,
    publicationApprovalRevision: approval.publicationApprovalRevision,
    publicationApprovalBasis: approval.publicationApprovalBasis,
    reviewDecision: 'Explicit current-wave publication approval for a curriculum-eligible Brick 8 concept with distinct informational intent and protected canonical ownership. This is not a human phonics-review claim or an R11 performance decision.',
    concept,
  });
}

export const PHONICS_WAVE_2_PAGES = freezeList(Object.entries(PHONICS_WAVE_2_PUBLICATION_APPROVALS).map(([id, approval]) => buildPage(id, approval)).sort((a, b) => a.concept.progressionRank - b.concept.progressionRank || a.cardTitle.localeCompare(b.cardTitle)));
export const PHONICS_WAVE_2_PATHS = freezeList(PHONICS_WAVE_2_PAGES.map((page) => page.path));
export const PHONICS_WAVE_2_TOPIC_IDS = freezeList(PHONICS_WAVE_2_PAGES.map((page) => page.topicId));
export const PHONICS_WAVE_2_SEO = freeze(Object.fromEntries(PHONICS_WAVE_2_PAGES.map((page) => [page.path, freeze({ title: page.seoTitle, description: page.seoDescription, canonicalPath: page.path, robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1', ogType: 'website' })])));

for (const [label, values] of [['path', PHONICS_WAVE_2_PATHS], ['topicId', PHONICS_WAVE_2_TOPIC_IDS], ['conceptId', PHONICS_WAVE_2_PAGES.map((page) => page.conceptId)]]) {
  if (new Set(values).size !== values.length) throw new Error(`R12 Wave 2 contains duplicate ${label} values.`);
}

const bySlug = new Map(PHONICS_WAVE_2_PAGES.map((page) => [page.slug, page]));
const byPath = new Map(PHONICS_WAVE_2_PAGES.map((page) => [page.path, page]));
const byConcept = new Map(PHONICS_WAVE_2_PAGES.map((page) => [page.conceptId, page]));
export const getPhonicsWave2PageBySlug = (slug) => bySlug.get(String(slug || '')) ?? null;
export const getPhonicsWave2PageByPath = (path) => byPath.get(String(path || '').split(/[?#]/, 1)[0].replace(/\/+$/, '')) ?? null;
export const getPhonicsWave2PageByConceptId = (conceptId) => byConcept.get(String(conceptId || '')) ?? null;
