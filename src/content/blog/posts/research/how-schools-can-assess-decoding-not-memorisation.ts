import type { BlogPost } from '../../types';

const post: BlogPost = {
  slug: 'how-schools-can-assess-decoding-not-memorisation',
  title: 'How Schools Can Assess Decoding Instead of Word Memorisation',
  category: 'Research',
  author: 'Tiny Steps Academic Team',
  date: '2026-08-10',
  readTime: '9 min read',
  hero: '/blog/hero-research.jpg',
  metaDescription:
    'How can schools tell whether children are truly decoding or simply remembering familiar words? Use unfamiliar-word transfer checks, blending, segmenting, spelling and connected-text evidence.',
  excerpt:
    'The strongest phonics assessment question is not “Has the child seen this word?” but “Can the child apply taught patterns to a word they have not practised?”',
  body: [
    { type: 'h2', content: 'The assessment question that changes everything' },
    {
      type: 'p',
      content:
        'Can the child decode a word they have never seen before? This question helps schools distinguish transferable sound–spelling knowledge from familiarity with words repeatedly practised in textbooks, worksheets or spelling lists.',
    },
    { type: 'h2', content: 'Why familiar-word reading can overestimate mastery' },
    {
      type: 'p',
      content:
        'Repeated exposure is useful, but it can make assessment misleading. A child may quickly recognise a practised word while still lacking the blending or pattern knowledge needed to decode a new word with similar structure.',
    },
    { type: 'h2', content: 'Check 1: unfamiliar decodable words' },
    {
      type: 'p',
      content:
        'Select a small set of unfamiliar words that use only sound–spelling patterns the child has already been taught. The goal is not to surprise or trick the child. It is to remove prior visual memory as the main route to the answer.',
    },
    { type: 'li', content: 'Observe whether the child tracks the word from left to right.' },
    { type: 'li', content: 'Notice whether sounds are blended rather than named separately and abandoned.' },
    { type: 'li', content: 'Record which grapheme or pattern causes the breakdown.' },
    { type: 'li', content: 'Avoid picture clues during the decoding check.' },
    { type: 'h2', content: 'Check 2: segment the same knowledge for spelling' },
    {
      type: 'p',
      content:
        'Ask the child to spell spoken words that use the same taught pattern. Decoding and encoding should reinforce each other. A child who can read a pattern but cannot hear and map it during spelling may need more segmenting practice.',
    },
    { type: 'h2', content: 'Check 3: mix old and new learning' },
    {
      type: 'p',
      content:
        'A cumulative assessment should not test only the concept taught yesterday. Mix previously secured patterns with the current target. This shows whether earlier learning is still available when attention is not explicitly directed to one rule.',
    },
    { type: 'h2', content: 'Check 4: move into connected text' },
    {
      type: 'p',
      content:
        'Word-level decoding must eventually transfer into sentence and passage reading. Use connected text that is appropriately matched to the child’s taught knowledge and observe accuracy, self-correction, phrasing and whether decoding effort still overwhelms comprehension.',
    },
    { type: 'h2', content: 'Check 5: separate accuracy from fluency' },
    {
      type: 'p',
      content:
        'A child may decode accurately but slowly, or read quickly while guessing. Schools should record both accuracy and developing automaticity rather than treating speed alone as reading success.',
    },
    { type: 'h2', content: 'What assessment should trigger next' },
    {
      type: 'p',
      content:
        'The purpose of a phonics check is instructional. If a pattern is insecure, teachers need a clear reteaching response: return to the sound–spelling relationship, model blending, add controlled word practice, segment for spelling and reassess transfer before moving forward.',
    },
    { type: 'h2', content: 'A simple leadership dashboard' },
    { type: 'li', content: 'Sound and grapheme knowledge: secure / developing / needs reteaching.' },
    { type: 'li', content: 'Unfamiliar-word decoding: accuracy by taught pattern.' },
    { type: 'li', content: 'Segmenting and spelling: pattern transfer into encoding.' },
    { type: 'li', content: 'Connected reading: accuracy, fluency and self-correction.' },
    { type: 'li', content: 'Next instructional action: continue, consolidate or reteach.' },
    { type: 'h2', content: 'How Tiny Steps embeds assessment into implementation' },
    {
      type: 'p',
      content:
        'Tiny Steps school partnerships use baseline, checkpoint and end-of-cycle guidance across sound knowledge, blending, segmenting, decoding, spelling and fluency. The emphasis is on what children can independently transfer and what teachers should teach next. See https://tinystepslearning.com/for-schools.',
    },
  ],
  faq: [
    {
      question: 'What is the easiest way to test whether a child is decoding?',
      answer:
        'Give the child unfamiliar words built only from previously taught phonics patterns. If the child can work through the graphemes and blend them without relying on picture clues, that is stronger evidence of decoding transfer.',
    },
    {
      question: 'Should schools use nonsense or pseudo-words?',
      answer:
        'They can isolate decoding because the words cannot be recognised from vocabulary memory, but schools should use them carefully and explain the task. Unfamiliar real words can also provide useful transfer evidence.',
    },
    {
      question: 'Is reading speed enough to measure phonics progress?',
      answer:
        'No. Schools should consider accuracy, decoding strategy, spelling transfer, connected-text reading and developing fluency. Fast guessing is not the same as secure reading.',
    },
    {
      question: 'What should happen when a child fails a phonics checkpoint?',
      answer:
        'The result should lead to targeted reteaching and additional cumulative practice, followed by another transfer check. Assessment should inform instruction rather than simply generate a score.',
    },
  ],
  popularScore: 102,
};

export default post;
