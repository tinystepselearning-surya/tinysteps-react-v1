const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);

export const READING_KNOWLEDGE_REVISION = '2026-09-09-r14';
export const READING_CONTENT_ACTIONS = freezeList(['keep', 'refresh', 'consolidate', 'create']);

const domain = (id, config) => freeze({ id, ...config, adjacentDomainIds: freezeList(config.adjacentDomainIds) });

/**
 * Reading knowledge architecture used for editorial planning and gap control.
 * This is not a claim that reading develops in one rigid staircase. The domains
 * interact, and phonemic awareness is a focused part of phonological awareness.
 */
export const READING_KNOWLEDGE_DOMAINS = freezeList([
  domain('oral-language', {
    order: 1,
    title: 'Oral Language & Listening',
    printBoundary: 'spoken-language',
    summary: 'Listening comprehension, spoken vocabulary and oral language that support later reading comprehension.',
    adjacentDomainIds: ['phonological-awareness', 'vocabulary', 'comprehension'],
  }),
  domain('phonological-awareness', {
    order: 2,
    title: 'Phonological Awareness',
    printBoundary: 'spoken-language',
    summary: 'Awareness of sound structure in spoken language, including words, syllables, rhyme/onset-rime and phoneme-level work.',
    adjacentDomainIds: ['oral-language', 'phonemic-awareness', 'phonics-decoding'],
  }),
  domain('phonemic-awareness', {
    order: 3,
    title: 'Phonemic Awareness',
    printBoundary: 'spoken-language',
    summary: 'The phoneme-level part of phonological awareness: identifying, blending, segmenting and manipulating individual speech sounds.',
    adjacentDomainIds: ['phonological-awareness', 'phonics-decoding', 'spelling-encoding'],
  }),
  domain('phonics-decoding', {
    order: 4,
    title: 'Phonics & Decoding',
    printBoundary: 'speech-to-print',
    summary: 'Connecting phonemes with graphemes and using those relationships to decode unfamiliar printed words.',
    adjacentDomainIds: ['phonemic-awareness', 'word-recognition', 'spelling-encoding', 'fluency'],
  }),
  domain('word-recognition', {
    order: 5,
    title: 'Word Recognition',
    printBoundary: 'print',
    summary: 'Increasingly accurate and automatic recognition of familiar written words built from secure word-reading knowledge.',
    adjacentDomainIds: ['phonics-decoding', 'fluency', 'spelling-encoding'],
  }),
  domain('fluency', {
    order: 6,
    title: 'Reading Fluency',
    printBoundary: 'connected-text',
    summary: 'Accurate, appropriately paced and expressive connected-text reading that supports attention to meaning.',
    adjacentDomainIds: ['word-recognition', 'vocabulary', 'comprehension'],
  }),
  domain('vocabulary', {
    order: 7,
    title: 'Vocabulary',
    printBoundary: 'language-and-text',
    summary: 'Knowledge of word meanings and relationships that supports understanding spoken and written language.',
    adjacentDomainIds: ['oral-language', 'fluency', 'comprehension'],
  }),
  domain('comprehension', {
    order: 8,
    title: 'Reading Comprehension',
    printBoundary: 'connected-text',
    summary: 'Building meaning across words, sentences and whole texts using language, vocabulary, knowledge and active comprehension processes.',
    adjacentDomainIds: ['oral-language', 'fluency', 'vocabulary'],
  }),
  domain('spelling-encoding', {
    order: 9,
    title: 'Spelling & Encoding',
    printBoundary: 'speech-to-print',
    summary: 'Segmenting spoken words and representing their sound, spelling and later morphological structure in writing.',
    adjacentDomainIds: ['phonemic-awareness', 'phonics-decoding', 'word-recognition'],
  }),
]);

const auditRecord = (config) => freeze({
  ...config,
  path: config.path ?? null,
  proposedPath: config.proposedPath ?? null,
  reasons: freezeList(config.reasons),
  protectFromCompetingIntent: config.protectFromCompetingIntent !== false,
});

/**
 * High-value reading-content audit. This deliberately does not classify every
 * blog in the repository. R14 first protects the major reading owners and
 * records only clear, useful gaps. Later editorial bricks can expand this map.
 */
export const READING_CONTENT_AUDIT = freezeList([
  auditRecord({
    id: 'phonics-definition',
    domainId: 'phonics-decoding',
    action: 'keep',
    path: '/blog/what-is-phonics-for-kids',
    canonicalTopicId: 'phonics-definition',
    reasons: ['Already owns the start-here phonics definition intent.', 'Explains phoneme, grapheme, blending, decoding, spelling and connected reading without reducing literacy to phonics alone.'],
  }),
  auditRecord({
    id: 'phonics-parent-support',
    domainId: 'phonics-decoding',
    action: 'keep',
    path: '/blog/phonics-for-parents-guide',
    canonicalTopicId: 'phonics-parent-guide',
    reasons: ['Already owns the broad parent phonics-support intent.', 'Connects home support, decoding, spelling and connected-text reading.'],
  }),
  auditRecord({
    id: 'blending-progression',
    domainId: 'phonics-decoding',
    action: 'keep',
    path: '/blog/how-kids-learn-blending',
    canonicalTopicId: 'phonics-blending-progression',
    reasons: ['Established blending progression owner.', 'Should remain separate from generic phonological-awareness content.'],
  }),
  auditRecord({
    id: 'letter-sounds-but-no-word-reading',
    domainId: 'phonics-decoding',
    action: 'keep',
    path: '/blog/why-child-knows-letter-sounds-but-cannot-read-words',
    canonicalTopicId: 'letter-sounds-known-word-reading-fails',
    reasons: ['Established diagnostic owner for the letter-sounds-to-word-reading bottleneck.', 'Directly supports the R13 sound/word utility without competing with it.'],
  }),
  auditRecord({
    id: 'abc-known-reading-fails',
    domainId: 'phonics-decoding',
    action: 'keep',
    path: '/blog/child-knows-abc-but-cannot-read',
    canonicalTopicId: 'abc-known-reading-fails',
    reasons: ['Established diagnostic owner for alphabet knowledge without decoding.', 'Distinct from knowing letter sounds but failing to blend.'],
  }),
  auditRecord({
    id: 'cvc-parent-guide',
    domainId: 'phonics-decoding',
    action: 'keep',
    path: '/blog/cvc-words-explained-for-parents',
    canonicalTopicId: 'cvc-words-explanation',
    reasons: ['Established CVC explanation owner.', 'Should feed examples into the word utility rather than be replaced by mass word pages.'],
  }),
  auditRecord({
    id: 'reading-fluency-guide',
    domainId: 'fluency',
    action: 'refresh',
    path: '/blog/how-to-improve-reading-fluency-in-children',
    canonicalTopicId: 'reading-fluency-guide',
    reasons: ['Established fluency owner.', 'Future refresh should strengthen accuracy-rate-expression distinctions, repeated-reading boundaries and observable parent checks without creating a duplicate fluency pillar.'],
  }),
  auditRecord({
    id: 'reading-comprehension-guide',
    domainId: 'comprehension',
    action: 'refresh',
    path: '/blog/phonics-comprehension',
    canonicalTopicId: null,
    reasons: ['Existing decoding-to-comprehension guide already covers vocabulary, sentence difficulty and listening-comprehension comparisons.', 'Future refresh should make the decoding-versus-language-comprehension diagnostic boundary easier for parents to scan.'],
  }),
  auditRecord({
    id: 'reads-words-no-story-understanding',
    domainId: 'comprehension',
    action: 'keep',
    path: '/blog/why-child-reads-words-but-does-not-understand-story',
    canonicalTopicId: null,
    reasons: ['Existing problem-aware page addresses successful word reading with weak story understanding.', 'Keep this diagnostic intent separate from the broad comprehension guide.'],
  }),
  auditRecord({
    id: 'phonics-spelling-connection',
    domainId: 'spelling-encoding',
    action: 'keep',
    path: '/blog/how-phonics-improves-spelling',
    canonicalTopicId: null,
    reasons: ['Existing encoding-focused resource already explains the reading/spelling direction change.', 'No separate generic spelling-from-phonics article is needed.'],
  }),
  auditRecord({
    id: 'phonological-phonemic-phonics-boundary',
    domainId: 'phonological-awareness',
    action: 'create',
    proposedPath: '/blog/phonological-awareness-vs-phonemic-awareness-vs-phonics',
    canonicalTopicId: null,
    reasons: ['Current material explains the distinction inside broader phonics guides, but there is no clear parent-facing owner for the oral-sound hierarchy and the point where print enters.', 'One substantial comparison/learning-path resource is preferable to multiple thin definition pages.'],
  }),
  auditRecord({
    id: 'vocabulary-reading-connection',
    domainId: 'vocabulary',
    action: 'create',
    proposedPath: '/blog/how-vocabulary-supports-reading-comprehension',
    canonicalTopicId: null,
    reasons: ['Vocabulary appears inside comprehension content but lacks a clear reading-specific parent owner.', 'A future page should focus on word meaning in reading rather than competing with general English-vocabulary content.'],
  }),
  auditRecord({
    id: 'automatic-word-recognition',
    domainId: 'word-recognition',
    action: 'create',
    proposedPath: '/blog/how-children-recognise-words-automatically-after-phonics',
    canonicalTopicId: null,
    reasons: ['The existing library explains decoding and sight-word decisions but does not have a clear parent owner for the transition from effortful decoding to rapid familiar-word recognition.', 'This must not become a duplicate sight-word or phonics-definition page.'],
  }),
]);

const domainsById = new Map(READING_KNOWLEDGE_DOMAINS.map((item) => [item.id, item]));
const auditsById = new Map(READING_CONTENT_AUDIT.map((item) => [item.id, item]));

export const getReadingKnowledgeDomain = (id) => domainsById.get(String(id || '')) ?? null;
export const getReadingContentAuditRecord = (id) => auditsById.get(String(id || '')) ?? null;
export const getReadingContentAuditForDomain = (domainId) => freezeList(READING_CONTENT_AUDIT.filter((item) => item.domainId === String(domainId || '')));
export const getReadingContentAuditByAction = (action) => freezeList(READING_CONTENT_AUDIT.filter((item) => item.action === String(action || '')));
