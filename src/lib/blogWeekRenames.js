export const LEGACY_WEEK_BLOG_RENAMES = Object.freeze({
  'week-1-phonics-satpin-launch': {
    slug: 'phonics-satpin-launch',
    title: 'SATPIN for Parents: A Research-Backed Launch Plan for Confident Readers',
  },
  'week-2-phonics-blending-club': {
    slug: 'phonics-blending-club',
    title: 'Build a Blending Club at Home',
  },
  'week-3-phonics-tricky-words': {
    slug: 'phonics-tricky-words',
    title: 'Introduce Tricky Words the Smart Way',
  },
  'week-4-phonics-long-vowels': {
    slug: 'phonics-long-vowels',
    title: 'Long Vowel Patterns Without Tears',
  },
  'week-5-phonics-r-controlled': {
    slug: 'phonics-r-controlled',
    title: 'R-Controlled Vowels Made Simple',
  },
  'week-6-phonics-comprehension': {
    slug: 'phonics-comprehension',
    title: 'From Sounding Out to Understanding',
  },
  'week-16-phonics-summer-plan': {
    slug: 'phonics-summer-plan',
    title: 'Summer Phonics Booster Schedule',
  },
  'week-19-phonics-multisyllabic': {
    slug: 'phonics-multisyllabic',
    title: 'Multisyllabic Word Play',
  },
  'week-22-phonics-diagnostics': {
    slug: 'phonics-diagnostics',
    title: 'Diagnostic Checklist Before a New Term',
  },
  'week-27-prevent-summer-slide-reading': {
    slug: 'prevent-summer-slide-reading',
    title: 'How to Prevent the Summer Slide in Reading (10-Minute Daily Plan)',
  },
  'week-7-grammar-nouns-to-paragraphs': {
    slug: 'grammar-nouns-to-paragraphs',
    title: 'Grammar Basics Roadmap: Nouns to Paragraphs in 7 Days (Ages 3-10)',
  },
  'week-8-grammar-tenses': {
    slug: 'grammar-tenses',
    title: 'Tenses Without Tears',
  },
  'week-9-grammar-conjunctions': {
    slug: 'grammar-conjunctions',
    title: 'Conjunction Toolkits',
  },
  'week-10-grammar-subject-verb': {
    slug: 'grammar-subject-verb',
    title: 'Subject-Verb Agreement Rescue Plan',
  },
  'week-11-grammar-creative-writing': {
    slug: 'grammar-creative-writing',
    title: 'Creative Writing Scaffolds for Ages 8–10',
  },
  'week-17-grammar-assessment': {
    slug: 'grammar-assessment',
    title: 'DIY Grammar Assessment for Parents',
  },
  'week-20-grammar-editing-camp': {
    slug: 'grammar-editing-camp',
    title: 'Editing Camp at Home',
  },
  'week-23-grammar-speaking-bridge': {
    slug: 'grammar-speaking-bridge',
    title: 'Bridge Grammar & Speaking with Story Cards',
  },
  'week-12-speaking-confidence-seeds': {
    slug: 'speaking-confidence-seeds',
    title: 'Speaking Confidence Roadmap: A 7-Day Calm Plan for Kids (Ages 3–10)',
  },
  'week-13-speaking-structure': {
    slug: 'speaking-structure',
    title: 'Hook-Body-Close for Kids',
  },
  'week-14-speaking-visual-aids': {
    slug: 'speaking-visual-aids',
    title: 'Visual Aids That Wow',
  },
  'week-15-speaking-debate-starters': {
    slug: 'speaking-debate-starters',
    title: 'Debate Starters for Tweens',
  },
  'week-18-speaking-video-feedback': {
    slug: 'speaking-video-feedback',
    title: 'Use Video for Instant Speaking Feedback',
  },
  'week-21-speaking-competition-prep': {
    slug: 'speaking-competition-prep',
    title: 'Competition Prep Checklist',
  },
  'week-24-speaking-family-showcase': {
    slug: 'speaking-family-showcase',
    title: 'Host a Family Showcase Night',
  },
  'week-25-back-to-school-plan': {
    slug: 'back-to-school-english-confidence-plan',
    title: 'Back-to-School English Confidence Plan',
  },
  'week-26-screen-smart-summer-routine': {
    slug: 'screen-smart-summer-routine-for-kids',
    title: 'Screen-Smart Summer Routine for Kids (Ages 3-12)',
  },
});

export const LEGACY_WEEK_SOURCE_SLUGS = Object.freeze(Object.keys(LEGACY_WEEK_BLOG_RENAMES));
export const LEGACY_WEEK_PUBLIC_SLUGS = Object.freeze(
  Object.values(LEGACY_WEEK_BLOG_RENAMES).map((rename) => rename.slug),
);

export const LEGACY_WEEK_BLOG_PATH_REDIRECTS = Object.freeze(
  Object.fromEntries(
    Object.entries(LEGACY_WEEK_BLOG_RENAMES).map(([sourceSlug, rename]) => [
      `/blog/${sourceSlug}`,
      `/blog/${rename.slug}`,
    ]),
  ),
);

const PUBLIC_TO_SOURCE_SLUG = Object.freeze(
  Object.fromEntries(
    Object.entries(LEGACY_WEEK_BLOG_RENAMES).map(([sourceSlug, rename]) => [rename.slug, sourceSlug]),
  ),
);

export function getPublicBlogSlug(slug) {
  const normalized = String(slug || '').trim();
  return LEGACY_WEEK_BLOG_RENAMES[normalized]?.slug || normalized;
}

export function getPublicBlogTitle(slug, fallbackTitle = '') {
  const normalized = String(slug || '').trim();
  return LEGACY_WEEK_BLOG_RENAMES[normalized]?.title || fallbackTitle;
}

export function getLegacyWeekSourceSlug(publicSlug) {
  return PUBLIC_TO_SOURCE_SLUG[String(publicSlug || '').trim()] || null;
}

export function rewriteLegacyWeekBlogPaths(value) {
  let output = String(value ?? '');
  for (const [source, destination] of Object.entries(LEGACY_WEEK_BLOG_PATH_REDIRECTS)) {
    output = output.split(source).join(destination);
  }
  return output;
}
