const GSC_SOURCE = 'user-shared-gsc-2026-08-28';

const gsc = (metricsBySlug, finding) => ({
  source: GSC_SOURCE,
  period: '3 months',
  capturedAt: '2026-08-28',
  metricsCaptured: true,
  metricsBySlug,
  finding,
});

export const BLOG_INTENT_CLUSTERS = Object.freeze([
  {
    id: 'parent-abc-cannot-read',
    audience: 'Parent',
    queryIntent: 'Child knows alphabet/ABC or letter names but cannot read words',
    risk: 'low',
    action: 'keep-distinct-owner',
    canonicalOwner: 'child-knows-abc-but-cannot-read',
    slugs: ['child-knows-abc-but-cannot-read'],
    evidence: gsc(
      {
        'child-knows-abc-but-cannot-read': { clicks: 3, impressions: 134 },
      },
      'The page has real search visibility and serves the earlier alphabet/letter-name-to-sound diagnostic stage. It should not be merged into the later letter-sounds-to-blending problem.',
    ),
    notes:
      'Own searches such as “knows ABC but cannot read” and “knows letters but cannot read”. Its first diagnostic step is whether the child knows letter sounds at all.',
  },
  {
    id: 'parent-letter-sounds-cannot-read',
    audience: 'Parent',
    queryIntent: 'Child already knows letter sounds but cannot blend/decode words',
    risk: 'resolved',
    action: 'protect-existing-consolidation',
    canonicalOwner: 'why-child-knows-letter-sounds-but-cannot-read-words',
    slugs: ['why-child-knows-letter-sounds-but-cannot-read-words'],
    retiredSlugs: ['child-knows-letter-sounds-but-cannot-read'],
    evidence: gsc(
      {
        'why-child-knows-letter-sounds-but-cannot-read-words': { clicks: 8, impressions: 460 },
        'child-knows-letter-sounds-but-cannot-read': { clicks: 8, impressions: 615, historicalRedirectSource: true },
      },
      'The current owner and its legacy duplicate both accumulated visibility. The source content explicitly targets blending, sequencing, unfamiliar-word decoding and transfer after sound knowledge is present.',
    ),
    notes:
      'Keep the ABC/letter-name page separate. Retire only the true letter-sounds duplicate into this owner.',
  },
  {
    id: 'school-letter-sounds-not-enough',
    audience: 'Schools & Research',
    queryIntent: 'Why letter-sound knowledge alone does not create transferable decoding in school implementation',
    risk: 'low',
    action: 'protect-distinct-audience',
    canonicalOwner: 'why-letter-sounds-are-not-enough-to-read',
    slugs: ['why-letter-sounds-are-not-enough-to-read'],
    evidence: gsc(
      {
        'why-letter-sounds-are-not-enough-to-read': { clicks: 0, impressions: 13 },
      },
      'The school/research page has its own institutional implementation intent and must not be collapsed into the parent diagnosis pages.',
    ),
    notes: 'Protect as school/research content even though vocabulary overlaps parent decoding articles.',
  },
  {
    id: 'school-cbse-ncf-foundational-literacy',
    audience: 'Schools & Research',
    queryIntent: 'Whether CBSE/NCF includes phonics and what foundational literacy guidance requires',
    risk: 'low',
    action: 'protect-gsc-visible-owner',
    canonicalOwner: 'does-cbse-include-phonics-ncf-foundational-literacy',
    slugs: ['does-cbse-include-phonics-ncf-foundational-literacy'],
    evidence: gsc(
      {
        'does-cbse-include-phonics-ncf-foundational-literacy': { clicks: 2, impressions: 55 },
      },
      'The institutional framework article already receives Google visibility and answers a distinct CBSE/NCF interpretation question.',
    ),
    notes: 'Do not fold this compliance/framework question into parent phonics-help content.',
  },
  {
    id: 'school-phonics-scope-sequence',
    audience: 'Schools & Research',
    queryIntent: 'Phonics scope and sequence for CBSE schools',
    risk: 'low',
    action: 'protect-gsc-visible-owner',
    canonicalOwner: 'phonics-scope-and-sequence-for-cbse-schools',
    slugs: ['phonics-scope-and-sequence-for-cbse-schools'],
    evidence: gsc(
      {
        'phonics-scope-and-sequence-for-cbse-schools': { clicks: 1, impressions: 24 },
      },
      'The implementation-sequence page already receives Google visibility and answers a different school-leader job than curriculum interpretation.',
    ),
    notes: 'Owns implementation-sequence intent for schools.',
  },
  {
    id: 'school-international-phonics-benchmarks',
    audience: 'Schools & Research',
    queryIntent: 'International phonics benchmarks for Indian schools',
    risk: 'low',
    action: 'protect-gsc-visible-owner',
    canonicalOwner: 'international-phonics-benchmarks-for-indian-schools',
    slugs: ['international-phonics-benchmarks-for-indian-schools'],
    evidence: gsc(
      {
        'international-phonics-benchmarks-for-indian-schools': { clicks: 1, impressions: 20 },
      },
      'The benchmarks article already receives Google visibility for its distinct institutional comparison/research intent.',
    ),
    notes: 'Do not merge into general parent phonics evidence pages merely because terminology overlaps.',
  },
  {
    id: 'school-phonics-teacher-training',
    audience: 'Schools & Research',
    queryIntent: 'Phonics teacher training and implementation support for schools',
    risk: 'low',
    action: 'protect-gsc-visible-owner',
    canonicalOwner: 'phonics-teacher-training-for-schools-implementation',
    slugs: ['phonics-teacher-training-for-schools-implementation'],
    evidence: gsc(
      {
        'phonics-teacher-training-for-schools-implementation': { clicks: 1, impressions: 19 },
      },
      'Teacher-training content already receives Google visibility and serves a distinct school implementation decision.',
    ),
    notes: 'Keep separate from parent-facing class-selection and phonics-help content.',
  },
  {
    id: 'phonics-start-age',
    audience: 'Parent',
    queryIntent: 'Right/best age to start phonics',
    risk: 'resolved',
    action: 'protect-existing-consolidation',
    canonicalOwner: 'what-age-to-start-phonics',
    slugs: ['what-age-to-start-phonics'],
    retiredSlugs: ['best-age-to-start-phonics-classes-for-kids'],
    evidence: gsc(
      {
        'what-age-to-start-phonics': { clicks: 0, impressions: 112 },
        'best-age-to-start-phonics-classes-for-kids': { clicks: 0, impressions: 1403, historicalRedirectSource: true },
      },
      'The legacy “best age” URL accumulated substantially more historical impressions but no clicks in the shared three-month view. The stronger evergreen content is readiness-led, so preserve the existing one-way redirect while B10 monitors post-consolidation visibility.',
    ),
    notes:
      'Do not reverse the redirect based on impressions alone. Preserve the retired URL’s signals through a permanent redirect, updated internal links and clean sitemap/feed generation.',
  },
  {
    id: 'phonics-blending',
    audience: 'Parent',
    queryIntent: 'How children learn to blend sounds versus practical blending activities',
    risk: 'medium',
    action: 'differentiate',
    canonicalOwner: null,
    slugs: ['how-kids-learn-blending', 'phonics-blending-activities', 'week-2-phonics-blending-club'],
    evidence: gsc(
      {
        'how-kids-learn-blending': { clicks: 3, impressions: 239 },
        'phonics-blending-activities': { clicks: 0, impressions: 154 },
        'week-2-phonics-blending-club': { clicks: 1, impressions: 25 },
      },
      'All three have distinct explanatory, activity and weekly-plan roles. Their real visibility supports differentiation rather than a blanket merge.',
    ),
    notes: 'Keep one explainer and one activity page distinct; weekly content remains a supporting routine.',
  },
  {
    id: 'reading-confidence',
    audience: 'Parent',
    queryIntent: 'How phonics improves reading confidence',
    risk: 'resolved',
    action: 'merge-planned',
    canonicalOwner: 'how-phonics-builds-reading-confidence',
    slugs: ['how-phonics-builds-reading-confidence', 'how-tiny-steps-builds-reading-confidence'],
    mergeSourceSlugs: ['how-tiny-steps-builds-reading-confidence'],
    evidence: gsc(
      {
        'how-phonics-builds-reading-confidence': { clicks: 0, impressions: 7 },
      },
      'The generic article is the better informational owner. The branded article substantially repeats the same confidence, correction, retry, home-routine and progress framework and should contribute its Tiny Steps-specific material to the generic owner before retirement.',
    ),
    notes:
      'B2 finalizes ownership only. B3 must first merge any unique branded method material into the owner, then implement a permanent redirect and remove the retired URL from discovery outputs.',
  },
  {
    id: 'phonics-class-selection',
    audience: 'Parent',
    queryIntent: 'How to choose phonics classes versus online/school format comparison and online-class benefits',
    risk: 'medium',
    action: 'differentiate',
    canonicalOwner: null,
    slugs: ['how-to-choose-phonics-classes', 'online-phonics-classes-vs-school', 'why-parents-choose-online-phonics'],
    retiredSlugs: ['best-online-phonics-classes-for-kids', 'best-phonics-classes-for-kids'],
    retiredRedirectOwner: 'how-to-choose-phonics-classes',
    evidence: gsc(
      {
        'how-to-choose-phonics-classes': { clicks: 0, impressions: 30 },
        'online-phonics-classes-vs-school': { clicks: 0, impressions: 20 },
        'why-parents-choose-online-phonics': { clicks: 0, impressions: 35 },
        'best-online-phonics-classes-for-kids': { clicks: 2, impressions: 563, historicalRedirectSource: true },
      },
      'Selection checklist, modality comparison and online-benefits intent can coexist. Existing “best classes” duplicates remain consolidated into the selection owner.',
    ),
    notes: 'Keep titles/meta/internal anchors distinct and preserve existing retired-source redirect lineage.',
  },
  {
    id: 'phonics-apps-and-games',
    audience: 'Parent',
    queryIntent: 'Whether apps are sufficient versus specific phonics games/activities',
    risk: 'medium',
    action: 'differentiate',
    canonicalOwner: null,
    slugs: ['are-phonics-apps-enough-for-kids', 'online-phonics-games', 'phonics-games-for-letter-sounds', 'phonics-activities-for-kids-at-home'],
    notes: 'Decision intent and activity intent are separate. Prevent all four from targeting the same broad “phonics games/apps” language.',
  },
  {
    id: 'phonics-method-comparison',
    audience: 'Parent',
    queryIntent: 'Synthetic phonics versus traditional reading / sight words / evidence',
    risk: 'medium',
    action: 'differentiate',
    canonicalOwner: null,
    slugs: ['synthetic-phonics-vs-traditional-reading', 'sight-words-or-phonics-first', 'science-of-phonics-learning'],
    notes: 'Method comparison, sequencing decision and research/evidence explainer should each own a distinct question.',
  },
  {
    id: 'long-vowels',
    audience: 'Parent',
    queryIntent: 'Long vowel concepts versus a weekly long-vowel practice plan',
    risk: 'resolved',
    action: 'protect-indexable-owner',
    canonicalOwner: 'long-vowel-sounds-for-kids',
    slugs: ['long-vowel-sounds-for-kids', 'week-4-phonics-long-vowels'],
    supportingNoindexSlugs: ['week-4-phonics-long-vowels'],
    evidence: gsc(
      {
        'long-vowel-sounds-for-kids': { clicks: 0, impressions: 15 },
        'week-4-phonics-long-vowels': { clicks: 0, impressions: 10, historicalNoindexCandidate: true },
      },
      'The evergreen guide owns the concept query while Week 4 provides a time-boxed implementation routine. Preserve the weekly page for users but keep it out of search competition.',
    ),
    notes: 'No redirect or deletion: evergreen owner + supporting noindex weekly plan.',
  },
  {
    id: 'r-controlled-vowels',
    audience: 'Parent',
    queryIntent: 'R-controlled vowel concepts versus a weekly practice plan',
    risk: 'resolved',
    action: 'protect-indexable-owner',
    canonicalOwner: 'r-controlled-vowels-explained',
    slugs: ['r-controlled-vowels-explained', 'week-5-phonics-r-controlled'],
    supportingNoindexSlugs: ['week-5-phonics-r-controlled'],
    evidence: gsc(
      {
        'r-controlled-vowels-explained': { clicks: 0, impressions: 50 },
        'week-5-phonics-r-controlled': { clicks: 5, impressions: 552, historicalNoindexCandidate: true },
      },
      'Week 5 has meaningful historical performance in the shared three-month view, so it must not be deleted or redirected. The final architecture still assigns the evergreen concept page as the search owner and keeps Week 5 as a public supporting routine; B10 must monitor whether the noindex transition transfers/retains topical visibility as intended.',
    ),
    notes:
      'This is deliberately not a content deletion. Preserve internal links and the weekly experience while keeping one evergreen concept owner.',
  },
  {
    id: 'one-word-answers',
    audience: 'Parent',
    queryIntent: 'Child answers only in one word',
    risk: 'resolved',
    action: 'protect-existing-consolidation',
    canonicalOwner: 'child-gives-one-word-answers',
    slugs: ['child-gives-one-word-answers'],
    retiredSlugs: ['why-child-answers-only-in-one-word'],
    evidence: gsc(
      {
        'child-gives-one-word-answers': { clicks: 2, impressions: 128 },
        'why-child-answers-only-in-one-word': { clicks: 5, impressions: 500, historicalRedirectSource: true },
      },
      'The legacy URL had more historical visibility, while the surviving article is the deeper parent resource. Preserve legacy equity through the existing permanent redirect and do not resurrect the duplicate.',
    ),
    notes: 'Current owner remains the comprehensive problem-solving article; legacy source remains a redirect only.',
  },
  {
    id: 'english-speaking-hesitation',
    audience: 'Parent',
    queryIntent: 'Child understands English but hesitates or does not speak',
    risk: 'resolved',
    action: 'protect-hosting-consolidation',
    canonicalOwner: 'child-understands-english-but-does-not-speak',
    slugs: ['child-understands-english-but-does-not-speak', 'spoken-english-classes-for-kids-confidence'],
    hostingRedirectSourceSlugs: ['spoken-english-classes-for-kids-confidence'],
    evidence: gsc(
      {
        'child-understands-english-but-does-not-speak': { clicks: 0, impressions: 34 },
        'spoken-english-classes-for-kids-confidence': { clicks: 0, impressions: 3, historicalRedirectSource: true },
      },
      'The current parent diagnosis page has stronger visibility and Firebase Hosting already permanently redirects the old overlapping blog URL to it. Commercial “spoken English classes” intent belongs on the separate program landing page.',
    ),
    notes: 'Protect the existing hosting 301. Do not create another informational page for the same hesitation problem.',
  },
  {
    id: 'grammar-application-gap',
    audience: 'Parent',
    queryIntent: 'Child knows grammar rules but still makes mistakes versus sentence-formation intervention',
    risk: 'medium',
    action: 'differentiate',
    canonicalOwner: null,
    slugs: ['child-knows-grammar-but-makes-mistakes', 'how-to-improve-sentence-formation-in-kids'],
    notes: 'Knowledge-transfer diagnosis and sentence-building intervention should link to each other but not use duplicate titles/meta descriptions.',
  },
]);

export const FINAL_BLOG_OWNERSHIP_DECISIONS = Object.freeze(
  BLOG_INTENT_CLUSTERS.filter((cluster) => cluster.risk === 'resolved' || cluster.risk === 'low'),
);

export const UNRESOLVED_BLOG_INTENTS = Object.freeze(
  BLOG_INTENT_CLUSTERS.filter((cluster) => cluster.action === 'merge-review' || cluster.requiresPerformanceValidation),
);

export const GSC_VISIBLE_BLOG_INTENTS = Object.freeze(
  BLOG_INTENT_CLUSTERS.filter((cluster) => cluster.evidence?.source === GSC_SOURCE),
);
