import type { BlogPost } from '../types';

type AuthorityIntent =
  | 'phonics-information'
  | 'phonics-diagnostic'
  | 'phonics-practice'
  | 'phonics-comparison'
  | 'reading'
  | 'grammar'
  | 'speaking'
  | 'cross-skill'
  | 'parent-routine'
  | 'buyer-guide';

type AuthorityLink = {
  label: string;
  to: string;
};

export type BlogAuthorityPlan = {
  number: number;
  slug: string;
  intent: AuthorityIntent;
  primary: AuthorityLink;
  secondary?: AuthorityLink;
};

const PHONICS = '/phonics';
const BEST_PHONICS = '/best-online-phonics-classes-for-kids-in-india';
const FOUNDATION = '/courses/phonics-foundation';
const EARLY = '/courses/phonics-brush-up';
const ADVANCED = '/courses/phonics-advanced';
const READING = '/reading-classes-for-kids';

export const B7_BLOG_AUTHORITY_PLANS: readonly BlogAuthorityPlan[] = Object.freeze([
  { number: 1, slug: 'benefits-of-phonics-for-kids', intent: 'phonics-information', primary: { label: 'see the full Tiny Steps phonics pathway', to: PHONICS } },
  { number: 2, slug: 'child-knows-abc-but-cannot-read', intent: 'phonics-diagnostic', primary: { label: 'see the structured phonics pathway', to: PHONICS }, secondary: { label: 'review the Foundation Phonics starting stage', to: FOUNDATION } },
  { number: 3, slug: 'cvc-words-explained-for-parents', intent: 'phonics-information', primary: { label: 'see how CVC reading fits into the full phonics pathway', to: PHONICS }, secondary: { label: 'review the Foundation Phonics stage', to: FOUNDATION } },
  { number: 4, slug: 'digraphs-and-tricky-words', intent: 'phonics-information', primary: { label: 'see the full phonics progression', to: PHONICS }, secondary: { label: 'review the Early Phonics stage', to: EARLY } },
  { number: 5, slug: 'how-kids-learn-blending', intent: 'phonics-information', primary: { label: 'see the structured phonics pathway', to: PHONICS }, secondary: { label: 'review the Foundation Phonics stage', to: FOUNDATION } },
  { number: 6, slug: 'how-long-does-phonics-take', intent: 'phonics-information', primary: { label: 'see the full phonics pathway', to: PHONICS }, secondary: { label: 'review the complete curriculum roadmap', to: '/curriculum' } },
  { number: 7, slug: 'how-phonics-builds-reading-confidence', intent: 'phonics-information', primary: { label: 'see the Tiny Steps phonics pathway', to: PHONICS }, secondary: { label: 'explore reading support when fluency is the bigger need', to: READING } },
  { number: 8, slug: 'how-phonics-classes-help-kids-read', intent: 'phonics-information', primary: { label: 'explore the Tiny Steps phonics programme', to: PHONICS }, secondary: { label: 'watch class samples before deciding', to: '/class-samples' } },
  { number: 9, slug: 'how-phonics-improves-spelling', intent: 'phonics-information', primary: { label: 'see the full phonics pathway', to: PHONICS }, secondary: { label: 'review the curriculum roadmap', to: '/curriculum' } },
  { number: 10, slug: 'how-to-choose-phonics-classes', intent: 'phonics-comparison', primary: { label: 'use the Tiny Steps phonics class comparison guide', to: BEST_PHONICS }, secondary: { label: 'see the full Tiny Steps phonics programme', to: PHONICS } },
  { number: 11, slug: 'long-vowel-sounds-for-kids', intent: 'phonics-information', primary: { label: 'see the full phonics pathway', to: PHONICS }, secondary: { label: 'review the Early Phonics stage', to: EARLY } },
  { number: 12, slug: 'online-phonics-classes-vs-school', intent: 'phonics-comparison', primary: { label: 'compare what to look for in online phonics classes', to: BEST_PHONICS }, secondary: { label: 'see the Tiny Steps phonics pathway', to: PHONICS } },
  { number: 13, slug: 'online-phonics-games', intent: 'phonics-practice', primary: { label: 'see where games fit inside a structured phonics pathway', to: PHONICS }, secondary: { label: 'browse free English learning games', to: '/free-english-games-for-kids' } },
  { number: 14, slug: 'phonics-activities-for-kids-at-home', intent: 'phonics-practice', primary: { label: 'connect home practice to the full phonics pathway', to: PHONICS } },
  { number: 15, slug: 'phonics-blending-activities', intent: 'phonics-practice', primary: { label: 'see the structured phonics pathway', to: PHONICS }, secondary: { label: 'review the Foundation Phonics stage', to: FOUNDATION } },
  { number: 16, slug: 'phonics-games-for-letter-sounds', intent: 'phonics-practice', primary: { label: 'see where letter-sound practice fits in the full phonics pathway', to: PHONICS } },
  { number: 17, slug: 'phonics-rules-for-beginners', intent: 'phonics-information', primary: { label: 'see the full phonics progression', to: PHONICS }, secondary: { label: 'review the curriculum roadmap', to: '/curriculum' } },
  { number: 18, slug: 'r-controlled-vowels-explained', intent: 'phonics-information', primary: { label: 'see the full phonics pathway', to: PHONICS }, secondary: { label: 'review the Advanced Phonics stage', to: ADVANCED } },
  { number: 19, slug: 'satpin-phonics-guide', intent: 'phonics-information', primary: { label: 'see the Tiny Steps phonics pathway', to: PHONICS }, secondary: { label: 'review the Foundation Phonics stage', to: FOUNDATION } },
  { number: 20, slug: 'science-of-phonics-learning', intent: 'phonics-information', primary: { label: 'see how the full phonics pathway is structured', to: PHONICS } },
  { number: 21, slug: 'synthetic-phonics-vs-traditional-reading', intent: 'phonics-comparison', primary: { label: 'see the Tiny Steps structured phonics pathway', to: PHONICS } },
  { number: 22, slug: 'phonics-satpin-launch', intent: 'phonics-practice', primary: { label: 'connect SATPIN practice to the full phonics pathway', to: PHONICS }, secondary: { label: 'review the Foundation Phonics stage', to: FOUNDATION } },
  { number: 23, slug: 'phonics-summer-plan', intent: 'phonics-practice', primary: { label: 'keep summer practice connected to the full phonics pathway', to: PHONICS } },
  { number: 24, slug: 'phonics-multisyllabic', intent: 'phonics-practice', primary: { label: 'see how longer-word reading fits into the phonics pathway', to: PHONICS }, secondary: { label: 'review the Advanced Phonics stage', to: ADVANCED } },
  { number: 25, slug: 'phonics-blending-club', intent: 'phonics-practice', primary: { label: 'connect blending practice to the full phonics pathway', to: PHONICS }, secondary: { label: 'review the Foundation Phonics stage', to: FOUNDATION } },
  { number: 26, slug: 'phonics-diagnostics', intent: 'phonics-diagnostic', primary: { label: 'see the structured phonics pathway', to: PHONICS }, secondary: { label: 'use the free demo assessment for a child-specific starting point', to: '/book-demo' } },
  { number: 27, slug: 'prevent-summer-slide-reading', intent: 'reading', primary: { label: 'explore reading support if the main issue is fluency or reading stamina', to: READING }, secondary: { label: 'see the phonics pathway when decoding still needs work', to: PHONICS } },
  { number: 28, slug: 'phonics-tricky-words', intent: 'phonics-practice', primary: { label: 'see the full phonics pathway', to: PHONICS }, secondary: { label: 'review the Early Phonics stage', to: EARLY } },
  { number: 29, slug: 'phonics-long-vowels', intent: 'phonics-practice', primary: { label: 'see the full phonics pathway', to: PHONICS }, secondary: { label: 'review the Early Phonics stage', to: EARLY } },
  { number: 30, slug: 'phonics-r-controlled', intent: 'phonics-practice', primary: { label: 'see the full phonics pathway', to: PHONICS }, secondary: { label: 'review the Advanced Phonics stage', to: ADVANCED } },
  { number: 31, slug: 'phonics-comprehension', intent: 'reading', primary: { label: 'explore reading support when meaning is the main bottleneck', to: READING }, secondary: { label: 'see the phonics pathway when decoding still needs strengthening', to: PHONICS } },
  { number: 32, slug: 'what-age-to-start-phonics', intent: 'phonics-information', primary: { label: 'see the full Tiny Steps phonics pathway', to: PHONICS }, secondary: { label: 'review the Foundation Phonics starting stage', to: FOUNDATION } },
  { number: 33, slug: 'what-is-phonics-for-kids', intent: 'phonics-information', primary: { label: 'explore the full Tiny Steps phonics programme', to: PHONICS } },
  { number: 34, slug: 'why-parents-choose-online-phonics', intent: 'phonics-comparison', primary: { label: 'compare what parents should look for in online phonics classes', to: BEST_PHONICS }, secondary: { label: 'see the Tiny Steps phonics programme', to: PHONICS } },

  { number: 35, slug: 'are-phonics-apps-enough-for-kids', intent: 'buyer-guide', primary: { label: 'compare teacher-led phonics options before deciding', to: BEST_PHONICS }, secondary: { label: 'see the structured Tiny Steps phonics pathway', to: PHONICS } },
  { number: 36, slug: 'can-child-improve-english-in-10-days', intent: 'cross-skill', primary: { label: 'compare the available Tiny Steps learning routes', to: '/courses' }, secondary: { label: 'use a free demo assessment to identify the real starting need', to: '/book-demo' } },
  { number: 37, slug: 'child-gives-one-word-answers', intent: 'speaking', primary: { label: 'explore speaking and communication support', to: '/speaking' }, secondary: { label: 'use a free demo assessment if the cause is still unclear', to: '/book-demo' } },
  { number: 38, slug: 'child-knows-grammar-but-makes-mistakes', intent: 'grammar', primary: { label: 'explore the Tiny Steps grammar pathway', to: '/grammar' }, secondary: { label: 'use a free demo assessment for a child-specific starting point', to: '/book-demo' } },
  { number: 39, slug: 'child-reads-in-class-but-forgets-at-home', intent: 'reading', primary: { label: 'explore reading support when the gap is transfer, fluency, or meaning', to: READING }, secondary: { label: 'see the phonics pathway if decoding is still inconsistent', to: PHONICS } },
  { number: 40, slug: 'child-understands-english-but-does-not-speak', intent: 'speaking', primary: { label: 'explore speaking and communication support', to: '/speaking' }, secondary: { label: 'use a free demo assessment if confidence and language are hard to separate', to: '/book-demo' } },
  { number: 41, slug: 'how-phonics-grammar-and-communication-work-together', intent: 'cross-skill', primary: { label: 'compare the Tiny Steps learning routes', to: '/courses' }, secondary: { label: 'see the phonics pathway when decoding is part of the gap', to: PHONICS } },
  { number: 42, slug: 'how-to-engage-kids-in-english-learning-at-home', intent: 'parent-routine', primary: { label: 'use the Parents Hub for practical home routines', to: '/parents' }, secondary: { label: 'compare the Tiny Steps learning routes when structured support is needed', to: '/courses' } },
  { number: 43, slug: 'how-to-improve-reading-fluency-in-children', intent: 'reading', primary: { label: 'explore reading support when fluency is the main need', to: READING }, secondary: { label: 'see the phonics pathway if accuracy still breaks down', to: PHONICS } },
  { number: 44, slug: 'how-to-improve-sentence-formation-in-kids', intent: 'grammar', primary: { label: 'explore grammar and sentence-building support', to: '/grammar' }, secondary: { label: 'use a free demo assessment for a child-specific starting point', to: '/book-demo' } },
  { number: 45, slug: 'june-school-reopening-english-readiness-plan', intent: 'cross-skill', primary: { label: 'use the free demo assessment to identify the first priority', to: '/book-demo' }, secondary: { label: 'compare the available learning routes', to: '/courses' } },
  { number: 46, slug: 'online-english-classes-for-kids-india', intent: 'buyer-guide', primary: { label: 'compare the Tiny Steps course routes', to: '/courses' }, secondary: { label: 'watch class samples before deciding', to: '/class-samples' } },
  { number: 47, slug: 'sight-words-or-phonics-first', intent: 'phonics-comparison', primary: { label: 'see the structured Tiny Steps phonics pathway', to: PHONICS }, secondary: { label: 'review the curriculum roadmap', to: '/curriculum' } },
  { number: 48, slug: 'back-to-school-english-confidence-plan', intent: 'speaking', primary: { label: 'explore speaking and communication support', to: '/speaking' }, secondary: { label: 'use a free demo assessment if classroom participation remains difficult', to: '/book-demo' } },
  { number: 49, slug: 'screen-smart-summer-routine-for-kids', intent: 'parent-routine', primary: { label: 'use the Parents Hub for balanced home-learning routines', to: '/parents' }, secondary: { label: 'browse free English learning games for purposeful practice', to: '/free-english-games-for-kids' } },
  { number: 50, slug: 'why-child-knows-letter-sounds-but-cannot-read-words', intent: 'phonics-diagnostic', primary: { label: 'see the structured Tiny Steps phonics pathway', to: PHONICS }, secondary: { label: 'review the Foundation Phonics stage', to: FOUNDATION } },
  { number: 51, slug: 'why-child-reads-words-but-does-not-understand-story', intent: 'reading', primary: { label: 'explore reading support when comprehension is the main need', to: READING }, secondary: { label: 'review the curriculum roadmap', to: '/curriculum' } },
]);

export const B7_PHONICS_FEATURED_GUIDES = Object.freeze([
  'what-is-phonics-for-kids',
  'child-knows-abc-but-cannot-read',
  'how-kids-learn-blending',
  'how-phonics-improves-spelling',
  'what-age-to-start-phonics',
  'why-child-knows-letter-sounds-but-cannot-read-words',
  'sight-words-or-phonics-first',
  'how-to-improve-reading-fluency-in-children',
]);

export const B7_BEST_PHONICS_DECISION_GUIDES = Object.freeze([
  'how-to-choose-phonics-classes',
  'online-phonics-classes-vs-school',
  'why-parents-choose-online-phonics',
  'are-phonics-apps-enough-for-kids',
  'how-long-does-phonics-take',
  'phonics-diagnostics',
]);

const planBySlug = new Map(B7_BLOG_AUTHORITY_PLANS.map((plan) => [plan.slug, plan]));

export function getBlogAuthorityPlan(slug: string | undefined) {
  return slug ? planBySlug.get(slug) ?? null : null;
}

function alreadyLinksTo(bodyText: string, destination: string) {
  return bodyText.includes(`](${destination})`) || bodyText.includes(`(${destination})`);
}

function nextStepHeading(intent: AuthorityIntent) {
  if (intent === 'phonics-comparison' || intent === 'buyer-guide') return 'Compare the next step before you decide';
  if (intent === 'phonics-diagnostic') return 'Choose the next step from the skill gap';
  if (intent === 'phonics-information' || intent === 'phonics-practice') return 'Where this fits in the learning pathway';
  if (intent === 'reading') return 'Choose the next reading step';
  if (intent === 'grammar') return 'Choose the next grammar step';
  if (intent === 'speaking') return 'Choose the next speaking step';
  if (intent === 'parent-routine') return 'Keep the next step practical';
  return 'Choose the next English learning step';
}

export function applyBlogAuthorityLinking(post: BlogPost): BlogPost {
  const plan = getBlogAuthorityPlan(post.slug);
  if (!plan) return post;

  const bodyText = post.body.map((block) => block.content).join('\n');
  const candidates = [plan.primary, plan.secondary]
    .filter((link): link is AuthorityLink => Boolean(link))
    .filter((link, index, links) => links.findIndex((candidate) => candidate.to === link.to) === index)
    .filter((link) => !alreadyLinksTo(bodyText, link.to));

  if (candidates.length === 0) return post;

  const sentences = candidates.map((link) => `[${link.label}](${link.to}).`);
  const intro =
    candidates.length === 1
      ? 'Use this route only if it matches the need you identified above:'
      : 'Use only the routes that match the need you identified above; you do not need to follow every option:';

  return {
    ...post,
    body: [
      ...post.body,
      { type: 'h2', content: nextStepHeading(plan.intent) },
      { type: 'p', content: `${intro} ${sentences.join(' ')}` },
    ],
  };
}
