import {
  getBrick9PilotCandidates,
  getPhonicsKnowledgeConcept,
} from '../content/phonicsKnowledge/index.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);

export const PHONICS_PROGRAMMATIC_PILOT_REVISION = '2026-09-09-r9';
export const PHONICS_PROGRAMMATIC_PILOT_PREFIX = '/resources/phonics';

const APPROVALS = freeze({
  'ck-rule': freeze({
    topicId: 'r9-phonics-ck-rule',
    seoTitle: 'CK Rule in Phonics: When to Use CK vs K | Tiny Steps',
    seoDescription: 'Learn the CK phonics rule: when /k/ is commonly spelled ck after a short vowel, with examples, k-vs-ck contrasts, common mistakes and practice.',
    cardTitle: 'CK rule: when to use ck',
    group: 'Spelling rules',
  }),
  'floss-rule': freeze({
    topicId: 'r9-phonics-floss-rule',
    seoTitle: 'Floss Rule in Phonics: FF, LL, SS & ZZ | Tiny Steps',
    seoDescription: 'Learn the Floss Rule for final ff, ll, ss and zz after a short vowel, with examples, exceptions, teaching tips and spelling practice for kids.',
    cardTitle: 'Floss rule: ff, ll, ss and zz',
    group: 'Spelling rules',
  }),
  'qu-sound': freeze({
    topicId: 'r9-phonics-qu-pattern',
    seoTitle: 'QU Sound in Phonics: How Q and U Work Together | Tiny Steps',
    seoDescription: 'Learn how qu commonly represents /kw/ in phonics words, why q is usually paired with u, and how to teach, blend and practise the pattern.',
    cardTitle: 'QU sound pattern',
    group: 'Consonant patterns',
  }),
  'digraph-ch': freeze({
    topicId: 'r9-phonics-ch-digraph',
    seoTitle: 'CH Digraph in Phonics: Sound, Words & Practice | Tiny Steps',
    seoDescription: 'Teach the CH digraph as one sound unit with clear word examples, common reading mistakes, alternative-pronunciation boundaries and practice ideas.',
    cardTitle: 'CH digraph',
    group: 'Consonant patterns',
  }),
  'digraph-sh': freeze({
    topicId: 'r9-phonics-sh-digraph',
    seoTitle: 'SH Digraph in Phonics: Sound, Words & Practice | Tiny Steps',
    seoDescription: 'Teach the SH digraph as one grapheme with beginning and ending word examples, blending guidance, common confusions and simple phonics practice.',
    cardTitle: 'SH digraph',
    group: 'Consonant patterns',
  }),
  'digraph-th': freeze({
    topicId: 'r9-phonics-th-digraph',
    seoTitle: 'TH Digraph: Voiced and Voiceless TH for Kids | Tiny Steps',
    seoDescription: 'Understand the two common TH sounds in words such as thin and this, with articulation cues, examples, common confusions and decoding practice.',
    cardTitle: 'TH: voiced and voiceless',
    group: 'Consonant patterns',
  }),
  'digraph-ng': freeze({
    topicId: 'r9-phonics-ng-digraph',
    seoTitle: 'NG Digraph in Phonics: Sound, Words & Practice | Tiny Steps',
    seoDescription: 'Learn how ng represents the final nasal sound in words such as sing and long, with decoding examples, spelling transfer and practice ideas.',
    cardTitle: 'NG digraph',
    group: 'Consonant patterns',
  }),
  'soft-c-hard-c': freeze({
    topicId: 'r9-phonics-soft-hard-c',
    seoTitle: 'Soft C and Hard C in Phonics: Cat vs City | Tiny Steps',
    seoDescription: 'Learn when c commonly represents /k/ or /s/, how the e-i-y clue works, examples such as cat and city, common mistakes and practice for kids.',
    cardTitle: 'Soft C and hard C',
    group: 'Consonant patterns',
  }),
  'vowel-team-ai': freeze({
    topicId: 'r9-phonics-ai-vowel-team',
    seoTitle: 'AI Vowel Team in Phonics: Long A Words & Practice | Tiny Steps',
    seoDescription: 'Teach the AI vowel team for long a with words such as rain and train, position guidance, spelling contrasts, common confusions and practice.',
    cardTitle: 'AI vowel team',
    group: 'Vowel patterns',
  }),
  'vowel-team-ee': freeze({
    topicId: 'r9-phonics-ee-vowel-team',
    seoTitle: 'EE Vowel Team in Phonics: Long E Words & Practice | Tiny Steps',
    seoDescription: 'Teach the EE vowel team as one grapheme for long e, with examples such as green and feet, spelling contrasts, mistakes and word-building practice.',
    cardTitle: 'EE vowel team',
    group: 'Vowel patterns',
  }),
  'vowel-team-ea': freeze({
    topicId: 'r9-phonics-ea-vowel-team',
    seoTitle: 'EA Vowel Team: Why Team, Head and Break Differ | Tiny Steps',
    seoDescription: 'Understand the main EA pronunciation patterns with team, head and break, plus teaching sequence, word sorting, common confusions and practice.',
    cardTitle: 'EA vowel team',
    group: 'Vowel patterns',
  }),
  'vowel-team-ie': freeze({
    topicId: 'r9-phonics-ie-vowel-team',
    seoTitle: 'IE Vowel Team in Phonics: Long I, Long E & Practice | Tiny Steps',
    seoDescription: 'Teach IE in controlled pronunciation families, including long-i and long-e examples, common mix-ups, contrast practice and decoding guidance.',
    cardTitle: 'IE vowel team',
    group: 'Vowel patterns',
  }),
  'vowel-team-oa': freeze({
    topicId: 'r9-phonics-oa-vowel-team',
    seoTitle: 'OA Vowel Team in Phonics: Long O Words & Practice | Tiny Steps',
    seoDescription: 'Teach OA as one grapheme for long o with words such as boat and road, spelling comparisons, common mistakes and practical word-building activities.',
    cardTitle: 'OA vowel team',
    group: 'Vowel patterns',
  }),
  'magic-e': freeze({
    topicId: 'r9-phonics-magic-e',
    seoTitle: 'Magic E in Phonics: A_E, I_E, O_E, U_E & More | Tiny Steps',
    seoDescription: 'Understand Magic E or silent-e patterns with short-vowel contrasts, five VCe patterns, examples, common exceptions and teaching practice for kids.',
    cardTitle: 'Magic E / silent-e',
    group: 'Vowel patterns',
  }),
  'rabbit-rule': freeze({
    topicId: 'r9-phonics-rabbit-rule',
    seoTitle: 'Rabbit Rule in Phonics: Two-Syllable Word Pattern | Tiny Steps',
    seoDescription: 'Learn the Rabbit Rule for common two-syllable words such as rabbit and kitten, with syllable chunking, spelling boundaries, examples and practice.',
    cardTitle: 'Rabbit Rule',
    group: 'Word structure',
  }),
  'consonant-le': freeze({
    topicId: 'r9-phonics-consonant-le',
    seoTitle: 'Consonant-LE in Phonics: Monster LE Words & Practice | Tiny Steps',
    seoDescription: 'Learn the consonant-le or Monster LE ending, how to read the final syllable, examples, the Magic-E difference, common confusions and practice.',
    cardTitle: 'Consonant-LE / Monster LE',
    group: 'Word structure',
  }),
});

const candidateIds = new Set(getBrick9PilotCandidates().map((concept) => concept.id));

function buildPage(conceptId, approval) {
  const concept = getPhonicsKnowledgeConcept(conceptId);
  if (!concept) throw new Error(`Brick 9 approval references missing concept: ${conceptId}`);
  if (!candidateIds.has(conceptId) || concept.expansionState !== 'pilot-wave-1') {
    throw new Error(`Brick 9 may publish only R8 pilot-wave-1 concepts: ${conceptId}`);
  }
  if (!concept.futureSlugCandidate) throw new Error(`Brick 9 concept lacks candidate slug: ${conceptId}`);
  const path = `${PHONICS_PROGRAMMATIC_PILOT_PREFIX}/${concept.futureSlugCandidate}`;
  return freeze({
    conceptId,
    topicId: approval.topicId,
    slug: concept.futureSlugCandidate,
    path,
    seoTitle: approval.seoTitle,
    seoDescription: approval.seoDescription,
    cardTitle: approval.cardTitle,
    group: approval.group,
    publicationState: 'approved-wave-1',
    reviewedRevision: PHONICS_PROGRAMMATIC_PILOT_REVISION,
    reviewDecision: 'Distinct parent intent, sufficient curated teaching value, direct curriculum alignment and no established canonical-owner collision.',
    concept,
  });
}

export const PHONICS_PROGRAMMATIC_PILOT_PAGES = freezeList(
  Object.entries(APPROVALS)
    .map(([conceptId, approval]) => buildPage(conceptId, approval))
    .sort((a, b) => a.concept.progressionRank - b.concept.progressionRank || a.cardTitle.localeCompare(b.cardTitle)),
);

export const PHONICS_PROGRAMMATIC_PILOT_PATHS = freezeList(
  PHONICS_PROGRAMMATIC_PILOT_PAGES.map((page) => page.path),
);

export const PHONICS_PROGRAMMATIC_PILOT_TOPIC_IDS = freezeList(
  PHONICS_PROGRAMMATIC_PILOT_PAGES.map((page) => page.topicId),
);

export const PHONICS_PROGRAMMATIC_PILOT_SEO = freeze(Object.fromEntries(
  PHONICS_PROGRAMMATIC_PILOT_PAGES.map((page) => [page.path, freeze({
    title: page.seoTitle,
    description: page.seoDescription,
    canonicalPath: page.path,
    robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
    ogType: 'website',
  })]),
));

const bySlug = new Map(PHONICS_PROGRAMMATIC_PILOT_PAGES.map((page) => [page.slug, page]));
const byPath = new Map(PHONICS_PROGRAMMATIC_PILOT_PAGES.map((page) => [page.path, page]));
const byConceptId = new Map(PHONICS_PROGRAMMATIC_PILOT_PAGES.map((page) => [page.conceptId, page]));
const byTopicId = new Map(PHONICS_PROGRAMMATIC_PILOT_PAGES.map((page) => [page.topicId, page]));

export const getPhonicsProgrammaticPilotPageBySlug = (slug) => bySlug.get(String(slug || '')) ?? null;
export const getPhonicsProgrammaticPilotPageByPath = (path) => byPath.get(String(path || '').split(/[?#]/, 1)[0].replace(/\/+$/, '')) ?? null;
export const getPhonicsProgrammaticPilotPageByConceptId = (conceptId) => byConceptId.get(String(conceptId || '')) ?? null;
export const getPhonicsProgrammaticPilotPageByTopicId = (topicId) => byTopicId.get(String(topicId || '')) ?? null;

export function getPhonicsProgrammaticPilotPagesByGroup(group) {
  return freezeList(PHONICS_PROGRAMMATIC_PILOT_PAGES.filter((page) => page.group === group));
}

export const PHONICS_PROGRAMMATIC_PILOT_GROUPS = freezeList([
  'Spelling rules', 'Consonant patterns', 'Vowel patterns', 'Word structure',
]);
