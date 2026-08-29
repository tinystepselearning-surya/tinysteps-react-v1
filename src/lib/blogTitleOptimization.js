export const BLOG_TITLE_OPTIMIZATIONS = Object.freeze({
  // Phonics
  'how-phonics-classes-help-kids-read': 'How Phonics Classes Help Kids Read: Decoding, Blending and Fluency Explained',

  // Public Speaking
  'spoken-english-classes-for-kids-confidence': 'Communication Classes for Kids: How to Help Shy Children Speak With Confidence',

  // Parent Tips
  'how-to-engage-kids-in-english-learning-at-home': 'How to Keep Kids Engaged in English Practice at Home: Phonics, Grammar and Speaking',
  'june-school-reopening-english-readiness-plan': 'School Reopening English Readiness Checklist for Kids: Reading, Writing and Speaking',
  'child-reads-in-class-but-forgets-at-home': 'Why Can My Child Read in Class but Struggle at Home? What Parents Can Do',

  // Research / Schools
  'does-cbse-include-phonics-ncf-foundational-literacy': 'Does CBSE Include Phonics? What the NCF Says About Foundational Literacy and Early Reading',
  'international-phonics-benchmarks-for-indian-schools': 'International Phonics Benchmarks for Indian Schools: What to Include in a Complete Programme',
  'systematic-cumulative-phonics-explained-for-schools': 'Systematic and Cumulative Phonics: A School Leader’s Guide to Implementation',
  'why-letter-sounds-are-not-enough-to-read': 'Why Letter Sounds Alone Are Not Enough for Reading: What Schools Should Teach Next',
  'phonics-for-parents-guide': 'Phonics for Parents: What It Is, How It Works, and How to Support Reading at Home',
});

export function getOptimizedBlogTitle(slug, fallbackTitle = '') {
  const normalized = String(slug || '').trim();
  return BLOG_TITLE_OPTIMIZATIONS[normalized] || fallbackTitle;
}

export function applyBlogTitleOptimization(post) {
  const title = getOptimizedBlogTitle(post?.slug, post?.title || '');
  if (!post || title === post.title) return post;
  return { ...post, title };
}
