export type SeoRecoveryBrick12AuthorityTier = 'A' | 'B' | 'C';

export type SeoRecoveryBrick12AuthorityNode = {
  path: string;
  tier: SeoRecoveryBrick12AuthorityTier;
  role: string;
};

export type SeoRecoveryBrick12AuthoritySignal = {
  label: string;
  to: string;
};

export type SeoRecoveryBrick12BlogRule = {
  heading: string;
  intro: string;
  signals: readonly SeoRecoveryBrick12AuthoritySignal[];
};

const PHONICS_PROGRAMME = '/phonics';
const PHONICS_COMPARISON = '/best-online-phonics-classes-for-kids-in-india';
const PHONICS_FEES = '/phonics-fees-india';
const SATPIN_MASTER = '/blog/satpin-phonics-guide';
const PARENT_DECODING_DIAGNOSTIC = '/blog/why-child-knows-letter-sounds-but-cannot-read-words';
const TRACING_OWNER = '/free-letter-tracing-game-for-kids';

/**
 * Brick 12 recovery hierarchy.
 *
 * Tier A is the generic commercial authority. Tier B contains narrower buyer
 * decision owners. Tier C contains the strongest informational/free-resource
 * authorities that supporting content should reinforce rather than compete with.
 */
export const SEO_RECOVERY_BRICK12_AUTHORITY_NODES = Object.freeze({
  phonicsProgramme: {
    path: PHONICS_PROGRAMME,
    tier: 'A',
    role: 'generic online phonics classes commercial authority',
  },
  phonicsComparison: {
    path: PHONICS_COMPARISON,
    tier: 'B',
    role: 'best / compare / provider-selection authority',
  },
  phonicsFees: {
    path: PHONICS_FEES,
    tier: 'B',
    role: 'phonics fee / cost / price authority',
  },
  satpinMaster: {
    path: SATPIN_MASTER,
    tier: 'C',
    role: 'SATPIN definition, order, words, blending and progression authority',
  },
  parentDecodingDiagnostic: {
    path: PARENT_DECODING_DIAGNOSTIC,
    tier: 'C',
    role: 'letter-sounds-known but words-still-hard diagnostic authority',
  },
  tracingOwner: {
    path: TRACING_OWNER,
    tier: 'C',
    role: 'ABC / alphabet / letter-tracing authority',
  },
} satisfies Record<string, SeoRecoveryBrick12AuthorityNode>);

/**
 * These edges are the recovery contract for the surviving owner pages. They are
 * verified against the existing source pages in the Brick 12 regression test.
 */
export const SEO_RECOVERY_BRICK12_OWNER_EDGES = Object.freeze([
  { from: PHONICS_PROGRAMME, to: PHONICS_COMPARISON },
  { from: PHONICS_PROGRAMME, to: PHONICS_FEES },
  { from: PHONICS_COMPARISON, to: PHONICS_PROGRAMME },
  { from: PHONICS_COMPARISON, to: PHONICS_FEES },
  { from: PHONICS_FEES, to: PHONICS_PROGRAMME },
  { from: SATPIN_MASTER, to: PHONICS_PROGRAMME },
  { from: PARENT_DECODING_DIAGNOSTIC, to: PHONICS_PROGRAMME },
  { from: TRACING_OWNER, to: SATPIN_MASTER },
  { from: TRACING_OWNER, to: PHONICS_PROGRAMME },
] as const);

const decodingSignal = Object.freeze({
  label: 'why a child can know letter sounds but still struggle to read words',
  to: PARENT_DECODING_DIAGNOSTIC,
});

/**
 * Targeted Tier-D -> Tier-B/C reinforcement.
 *
 * This layer deliberately does NOT add /phonics, /book-demo or pricing CTAs.
 * Commercial handoffs remain governed by the existing C7 owner/next-step rules.
 * Brick 12 only supplies a missing specialist-authority edge; the specialist
 * owner itself carries the established upward relationship to Tier A.
 *
 * The dedicated /blog/phonics-for-parents-guide React route is intentionally
 * outside this post-processing layer. Its existing source already links to the
 * decoding diagnostic and /phonics, while SATPIN already points back to that
 * broad parent guide. Brick 12 avoids creating a second rendering contract there.
 */
export const SEO_RECOVERY_BRICK12_BLOG_RULES = Object.freeze({
  'phonics-satpin-launch': {
    heading: 'Use the SATPIN guide before adding more practice',
    intro: 'For the full explanation of SATPIN order, sounds, words and blending progression, continue with',
    signals: [
      { label: 'the SATPIN phonics guide', to: SATPIN_MASTER },
    ],
  },
  'how-kids-learn-blending': {
    heading: 'If blending is still the sticking point',
    intro: 'If a child can say individual sounds but cannot combine them into unfamiliar words, continue with',
    signals: [decodingSignal],
  },
  'phonics-blending-activities': {
    heading: 'If activities are not transferring into word reading',
    intro: 'When blending practice works only with familiar examples or heavy prompting, continue with',
    signals: [decodingSignal],
  },
  'phonics-blending-club': {
    heading: 'If the daily routine is not transferring into fresh words',
    intro: 'When repeated blending practice is not becoming independent, continue with',
    signals: [decodingSignal],
  },
  'cvc-words-explained-for-parents': {
    heading: 'If CVC words are still not becoming independent',
    intro: 'When a child knows the sounds but cannot reliably blend fresh CVC words, continue with',
    signals: [decodingSignal],
  },
  'phonics-diagnostics': {
    heading: 'Use the diagnostic that matches a sound-to-word breakdown',
    intro: 'If the assessment shows that letter sounds are present but blending or decoding is weak, continue with',
    signals: [decodingSignal],
  },
  'why-letter-sounds-are-not-enough-to-read': {
    heading: 'Move from the research explanation to the child-level diagnostic',
    intro: 'For a practical check of where sound knowledge stops transferring into word reading, continue with',
    signals: [decodingSignal],
  },
  'online-phonics-classes-vs-school': {
    heading: 'Compare online phonics options using one clear framework',
    intro: 'For provider-selection criteria, continue with',
    signals: [
      { label: 'the online phonics class comparison guide', to: PHONICS_COMPARISON },
    ],
  },
  'why-parents-choose-online-phonics': {
    heading: 'Use the comparison guide when you are ready to evaluate options',
    intro: 'For a structured provider-selection framework, continue with',
    signals: [
      { label: 'the online phonics class comparison guide', to: PHONICS_COMPARISON },
    ],
  },
  'are-phonics-apps-enough-for-kids': {
    heading: 'Compare teacher-led options when practice tools are not enough',
    intro: 'For a structured provider-selection framework, continue with',
    signals: [
      { label: 'the online phonics class comparison guide', to: PHONICS_COMPARISON },
    ],
  },
} satisfies Record<string, SeoRecoveryBrick12BlogRule>);

export function getSeoRecoveryBrick12BlogRule(slug: string | undefined) {
  if (!slug) return null;
  return SEO_RECOVERY_BRICK12_BLOG_RULES[
    slug as keyof typeof SEO_RECOVERY_BRICK12_BLOG_RULES
  ] ?? null;
}
