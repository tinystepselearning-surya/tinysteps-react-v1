export const LEGACY_WEEK_BLOG_RENAMES = Object.freeze({
  'week-1-phonics-satpin-launch': {
    slug: 'phonics-satpin-launch',
    title: 'SATPIN at Home: A Parent Launch Plan for Early Blending and Reading',
  },
  'week-2-phonics-blending-club': {
    slug: 'phonics-blending-club',
    title: 'Blending Practice for Kids at Home: A Simple Daily Routine',
  },
  'week-3-phonics-tricky-words': {
    slug: 'phonics-tricky-words',
    title: 'How to Teach Tricky Words to Kids Without Encouraging Guessing',
  },
  'week-4-phonics-long-vowels': {
    slug: 'phonics-long-vowels',
    title: 'Long Vowel Practice for Kids: Simple Activities for Common Patterns',
  },
  'week-5-phonics-r-controlled': {
    slug: 'phonics-r-controlled',
    title: 'R-Controlled Vowel Practice for Kids: ar, er, ir, or and ur',
  },
  'week-6-phonics-comprehension': {
    slug: 'phonics-comprehension',
    title: 'From Decoding to Comprehension: How to Help Kids Understand What They Read',
  },
  'week-16-phonics-summer-plan': {
    slug: 'phonics-summer-plan',
    title: 'Summer Phonics Practice for Kids: A 10-Minute Daily Routine',
  },
  'week-19-phonics-multisyllabic': {
    slug: 'phonics-multisyllabic',
    title: 'How to Help Kids Read Multisyllabic Words: Simple Chunking Practice',
  },
  'week-22-phonics-diagnostics': {
    slug: 'phonics-diagnostics',
    title: 'Phonics Assessment Checklist for Parents Before a New School Term',
  },
  'week-27-prevent-summer-slide-reading': {
    slug: 'prevent-summer-slide-reading',
    title: 'How to Prevent the Summer Slide in Reading (10-Minute Daily Plan)',
  },
  'week-7-grammar-nouns-to-paragraphs': {
    slug: 'grammar-nouns-to-paragraphs',
    title: 'Grammar Basics for Kids: From Nouns to Paragraphs — A Parent Roadmap',
  },
  'week-8-grammar-tenses': {
    slug: 'grammar-tenses',
    title: 'English Tenses for Kids: Simple Present, Past and Future Explained',
  },
  'week-9-grammar-conjunctions': {
    slug: 'grammar-conjunctions',
    title: 'Conjunctions for Kids: How to Use and, but, because and so',
  },
  'week-10-grammar-subject-verb': {
    slug: 'grammar-subject-verb',
    title: 'Subject-Verb Agreement for Kids: Common Mistakes and Easy Fixes',
  },
  'week-11-grammar-creative-writing': {
    slug: 'grammar-creative-writing',
    title: 'Creative Writing Scaffolds for Ages 8–10',
  },
  'week-17-grammar-assessment': {
    slug: 'grammar-assessment',
    title: 'Grammar Assessment for Kids: A Simple Parent Checklist',
  },
  'week-20-grammar-editing-camp': {
    slug: 'grammar-editing-camp',
    title: 'Grammar Editing Practice for Kids: Find and Fix Common Mistakes',
  },
  'week-23-grammar-speaking-bridge': {
    slug: 'grammar-speaking-bridge',
    title: 'Story Cards for Kids: Build Grammar and Speaking Skills Together',
  },
  'week-12-speaking-confidence-seeds': {
    slug: 'speaking-confidence-seeds',
    title: 'How to Build Speaking Confidence in Kids: A 7-Day Calm Practice Plan',
  },
  'week-13-speaking-structure': {
    slug: 'speaking-structure',
    title: 'How to Structure a Speech for Kids: Hook, Body and Conclusion',
  },
  'week-14-speaking-visual-aids': {
    slug: 'speaking-visual-aids',
    title: 'How Kids Can Use Visual Aids in Public Speaking',
  },
  'week-15-speaking-debate-starters': {
    slug: 'speaking-debate-starters',
    title: 'Debate Topics and Starters for Kids and Tweens to Build Speaking Confidence',
  },
  'week-18-speaking-video-feedback': {
    slug: 'speaking-video-feedback',
    title: 'How Video Feedback Helps Kids Improve Public Speaking',
  },
  'week-21-speaking-competition-prep': {
    slug: 'speaking-competition-prep',
    title: 'Public Speaking Competition Checklist for Kids: How to Prepare Step by Step',
  },
  'week-24-speaking-family-showcase': {
    slug: 'speaking-family-showcase',
    title: 'Public Speaking Activities for Kids at Home: Host a Family Showcase',
  },
  'week-25-back-to-school-plan': {
    slug: 'back-to-school-english-confidence-plan',
    title: 'Back-to-School English Confidence Plan for Kids: Speaking, Participation and Classroom Routines',
  },
  'week-26-screen-smart-summer-routine': {
    slug: 'screen-smart-summer-routine-for-kids',
    title: 'Screen-Smart Summer Learning Routine for Kids: Balance English Practice and Screen Time',
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
