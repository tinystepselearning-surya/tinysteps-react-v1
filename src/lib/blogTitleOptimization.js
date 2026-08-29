export const BLOG_TITLE_OPTIMIZATIONS = Object.freeze({
  // Phonics
  'phonics-satpin-launch': 'SATPIN at Home: A Parent Launch Plan for Early Blending and Reading',
  'phonics-diagnostics': 'Phonics Assessment Checklist for Parents Before a New School Term',
  'phonics-multisyllabic': 'How to Help Kids Read Multisyllabic Words: Simple Chunking Practice',
  'phonics-summer-plan': 'Summer Phonics Practice for Kids: A 10-Minute Daily Routine',
  'phonics-comprehension': 'From Decoding to Comprehension: How to Help Kids Understand What They Read',
  'phonics-r-controlled': 'R-Controlled Vowel Practice for Kids: ar, er, ir, or and ur',
  'phonics-long-vowels': 'Long Vowel Practice for Kids: Simple Activities for Common Patterns',
  'phonics-tricky-words': 'How to Teach Tricky Words to Kids Without Encouraging Guessing',
  'how-phonics-classes-help-kids-read': 'How Phonics Classes Help Kids Read: Decoding, Blending and Fluency Explained',
  'phonics-blending-club': 'Blending Practice for Kids at Home: A Simple Daily Routine',

  // Grammar
  'grammar-nouns-to-paragraphs': 'Grammar Basics for Kids: From Nouns to Paragraphs — A Parent Roadmap',
  'grammar-speaking-bridge': 'Story Cards for Kids: Build Grammar and Speaking Skills Together',
  'grammar-editing-camp': 'Grammar Editing Practice for Kids: Find and Fix Common Mistakes',
  'grammar-assessment': 'Grammar Assessment for Kids: A Simple Parent Checklist',
  'grammar-subject-verb': 'Subject-Verb Agreement for Kids: Common Mistakes and Easy Fixes',
  'grammar-conjunctions': 'Conjunctions for Kids: How to Use and, but, because and so',
  'grammar-tenses': 'English Tenses for Kids: Simple Present, Past and Future Explained',

  // Public Speaking
  'speaking-confidence-seeds': 'How to Build Speaking Confidence in Kids: A 7-Day Calm Practice Plan',
  'speaking-family-showcase': 'Public Speaking Activities for Kids at Home: Host a Family Showcase',
  'speaking-competition-prep': 'Public Speaking Competition Checklist for Kids: How to Prepare Step by Step',
  'speaking-video-feedback': 'How Video Feedback Helps Kids Improve Public Speaking',
  'speaking-debate-starters': 'Debate Topics and Starters for Kids and Tweens to Build Speaking Confidence',
  'speaking-visual-aids': 'How Kids Can Use Visual Aids in Public Speaking',
  'speaking-structure': 'How to Structure a Speech for Kids: Hook, Body and Conclusion',
  'spoken-english-classes-for-kids-confidence': 'Communication Classes for Kids: How to Help Shy Children Speak With Confidence',

  // Parent Tips
  'how-to-engage-kids-in-english-learning-at-home': 'How to Keep Kids Engaged in English Practice at Home: Phonics, Grammar and Speaking',
  'june-school-reopening-english-readiness-plan': 'School Reopening English Readiness Checklist for Kids: Reading, Writing and Speaking',
  'child-reads-in-class-but-forgets-at-home': 'Why Can My Child Read in Class but Struggle at Home? What Parents Can Do',
  'screen-smart-summer-routine-for-kids': 'Screen-Smart Summer Learning Routine for Kids: Balance English Practice and Screen Time',
  'back-to-school-english-confidence-plan': 'Back-to-School English Confidence Plan for Kids: Speaking, Participation and Classroom Routines',

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
