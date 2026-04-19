export const TESTIMONIAL_PROGRAM_ORDER = [
  'Phonics Foundations',
  'Early Phonics',
  'Advanced Phonics',
  'Basic Grammar',
  'Advanced Grammar',
  'Basic Public Speaking',
  'Advanced Public Speaking',
] as const;

export type StaticTestimonialProgram = (typeof TESTIMONIAL_PROGRAM_ORDER)[number];

export type StaticTestimonial = {
  id: string;
  parentName: string;
  childAge?: number;
  location?: string;
  program: StaticTestimonialProgram;
  rating: 5;
  title: string;
  quote: string;
  source: 'Tiny Steps parent feedback';
};

const SOURCE: StaticTestimonial['source'] = 'Tiny Steps parent feedback';

function review(
  id: string,
  program: StaticTestimonialProgram,
  parentName: string,
  title: string,
  quote: string,
  childAge?: number,
  location?: string,
): StaticTestimonial {
  return {
    id,
    program,
    parentName,
    title,
    quote,
    childAge,
    location,
    rating: 5,
    source: SOURCE,
  };
}

export const STATIC_TESTIMONIALS_BY_PROGRAM: Record<StaticTestimonialProgram, StaticTestimonial[]> = {
  'Phonics Foundations': [
    review(
      'pf-1',
      'Phonics Foundations',
      'Neha',
      'Strong reading start',
      'My daughter moved from letter names to letter sounds in a clear way. Blending practice was simple and consistent. She now reads short words with confidence.',
      5,
      'Hyderabad',
    ),
    review(
      'pf-2',
      'Phonics Foundations',
      'Ritika',
      'Structured and calm teaching',
      'Classes are well paced and my son stays focused till the end. Teacher attention is very good. We finally have a practical home reading routine.',
      6,
      'Bengaluru',
    ),
    review(
      'pf-3',
      'Phonics Foundations',
      'Kavya',
      'Clear sound clarity',
      'Earlier my child guessed words. Now she uses sounds and blends properly. Her confidence while reading aloud has improved a lot.',
      5,
      'Pune',
    ),
    review(
      'pf-4',
      'Phonics Foundations',
      'Anita',
      'Easy for parents to support',
      'The lesson flow is clear and we know exactly what to practice. Homework is short but effective. Reading time at home is much smoother now.',
      6,
      'Chennai',
    ),
    review(
      'pf-5',
      'Phonics Foundations',
      'Megha',
      'Good teacher guidance',
      'Teacher corrections are kind and specific. My child started identifying sounds faster within a few weeks. We can see steady progress.',
      4,
      'Mumbai',
    ),
  ],
  'Early Phonics': [
    review(
      'ep-1',
      'Early Phonics',
      'Priya',
      'Blending became natural',
      'My child now blends CVC words without hesitation. Digraph practice was handled very nicely. Reading confidence in school has improved.',
      7,
      'Noida',
    ),
    review(
      'ep-2',
      'Early Phonics',
      'Aparna',
      'Good transition to sentences',
      'We saw clear progress from words to short sentence reading. The class activities keep children engaged. Teacher feedback is always actionable.',
      7,
      'Gurugram',
    ),
    review(
      'ep-3',
      'Early Phonics',
      'Pooja',
      'Consistent progress',
      'The weekly progression is very systematic. My son reads with fewer pauses now. His pronunciation has also become cleaner.',
      6,
      'Ahmedabad',
    ),
    review(
      'ep-4',
      'Early Phonics',
      'Divya',
      'Confidence in unfamiliar words',
      'Earlier my daughter got stuck on new words. Now she tries decoding first. That one change has made reading practice much more positive.',
      7,
      'Kolkata',
    ),
    review(
      'ep-5',
      'Early Phonics',
      'Sonia',
      'Practical and child-friendly',
      'Lessons are interactive but still structured. My child looks forward to class days. We can clearly see better fluency and expression.',
      6,
      'Coimbatore',
    ),
  ],
  'Advanced Phonics': [
    review(
      'ap-1',
      'Advanced Phonics',
      'Shweta',
      'Big improvement in decoding',
      'Advanced sounds and patterns were taught with clarity. My child now handles longer words more confidently. Reading hesitation has reduced a lot.',
      8,
      'Hyderabad',
    ),
    review(
      'ap-2',
      'Advanced Phonics',
      'Ananya',
      'Fluency gains are visible',
      'Sentence reading speed and accuracy are better now. Teacher attention to pronunciation is excellent. School reading tasks feel easier.',
      9,
      'Bengaluru',
    ),
    review(
      'ap-3',
      'Advanced Phonics',
      'Smita',
      'Useful correction style',
      'Corrections are detailed but never discouraging. My son has become more independent while reading new passages. Blending and chunking are much better.',
      8,
      'Pune',
    ),
    review(
      'ap-4',
      'Advanced Phonics',
      'Rekha',
      'Reading confidence for school',
      'This level helped my daughter with difficult words in textbooks. She reads with more expression now. Overall confidence is noticeably higher.',
      9,
      'Chennai',
    ),
    review(
      'ap-5',
      'Advanced Phonics',
      'Nisha',
      'Strong support and tracking',
      'Progress tracking is clear and realistic. We know exactly where the child is improving. Teacher guidance has been very consistent.',
      8,
      'Mumbai',
    ),
  ],
  'Basic Grammar': [
    review(
      'bg-1',
      'Basic Grammar',
      'Swati',
      'Sentence formation improved',
      'My child now writes cleaner sentences with correct punctuation. Basic grammar concepts are taught in a practical way. Homework mistakes have reduced.',
      9,
      'Hyderabad',
    ),
    review(
      'bg-2',
      'Basic Grammar',
      'Asha',
      'Easy to understand lessons',
      'The teacher explains grammar rules with simple examples. My son can apply them in writing tasks. We can see better clarity in his school notebook.',
      10,
      'Bengaluru',
    ),
    review(
      'bg-3',
      'Basic Grammar',
      'Harini',
      'Good balance of practice',
      'Classes include speaking and writing usage, not only theory. Sentence confidence has improved significantly. Parent updates are very clear.',
      9,
      'Pune',
    ),
    review(
      'bg-4',
      'Basic Grammar',
      'Jyoti',
      'Grammar fear reduced',
      'Earlier grammar felt confusing for my daughter. Now she attempts worksheets confidently. Teacher corrections are specific and helpful.',
      10,
      'Chennai',
    ),
    review(
      'bg-5',
      'Basic Grammar',
      'Renu',
      'Visible daily impact',
      'We now hear better sentence structure in regular conversation too. Writing errors have gone down. The learning process feels steady and practical.',
      9,
      'Mumbai',
    ),
  ],
  'Advanced Grammar': [
    review(
      'ag-1',
      'Advanced Grammar',
      'Bhavna',
      'Writing became sharper',
      'My child now writes with better tense control and sentence flow. Advanced topics are taught with clarity. School writing quality has improved.',
      11,
      'Noida',
    ),
    review(
      'ag-2',
      'Advanced Grammar',
      'Madhavi',
      'Strong concept clarity',
      'Complex grammar points are broken into simple steps. My daughter now edits her own writing more confidently. That has been a big positive change.',
      12,
      'Gurugram',
    ),
    review(
      'ag-3',
      'Advanced Grammar',
      'Tanvi',
      'Excellent writing support',
      'Teacher feedback on sentence formation and paragraph flow is very practical. My son now writes with better structure. Confidence has improved.',
      11,
      'Ahmedabad',
    ),
    review(
      'ag-4',
      'Advanced Grammar',
      'Sneha',
      'From rules to usage',
      'The classes focus on application, not memorising rules. My child makes fewer repeated mistakes now. We can see clear academic benefit.',
      12,
      'Kolkata',
    ),
    review(
      'ag-5',
      'Advanced Grammar',
      'Sujata',
      'Consistent measurable progress',
      'Progress updates are honest and specific. My daughter has stronger grammar clarity in both speech and writing. The improvement feels sustainable.',
      11,
      'Coimbatore',
    ),
  ],
  'Basic Public Speaking': [
    review(
      'bps-1',
      'Basic Public Speaking',
      'Deepa',
      'Shy child started speaking',
      'My son was very hesitant to speak earlier. With guided prompts, he now answers in full sentences. Confidence in class participation is much better.',
      8,
      'Hyderabad',
    ),
    review(
      'bps-2',
      'Basic Public Speaking',
      'Pallavi',
      'Better expression at home',
      'My child now explains ideas more clearly at home and in school. Teacher attention to pace and clarity is excellent. Sessions are very encouraging.',
      9,
      'Bengaluru',
    ),
    review(
      'bps-3',
      'Basic Public Speaking',
      'Vidya',
      'Strong confidence boost',
      'Stage fear has reduced a lot. My daughter speaks with better voice clarity and sentence structure. She is now willing to present in class.',
      8,
      'Pune',
    ),
    review(
      'bps-4',
      'Basic Public Speaking',
      'Manasa',
      'Practical communication training',
      'The activities are child-friendly and useful for daily communication. My son now speaks with more confidence and less hesitation. Feedback is always clear.',
      9,
      'Chennai',
    ),
    review(
      'bps-5',
      'Basic Public Speaking',
      'Tejaswini',
      'Good teacher involvement',
      'Teachers patiently guide each child and correct gently. My child is now more expressive and participates actively. We are very happy with the progress.',
      8,
      'Mumbai',
    ),
  ],
  'Advanced Public Speaking': [
    review(
      'aps-1',
      'Advanced Public Speaking',
      'Keerthi',
      'Structured speaking growth',
      'My daughter now plans and delivers short speeches with clear structure. She handles questions more confidently. Expression and clarity have improved.',
      11,
      'Noida',
    ),
    review(
      'aps-2',
      'Advanced Public Speaking',
      'Nandini',
      'Presentation confidence improved',
      'My son now speaks with better eye contact and voice control. Teachers help with content organisation very well. School presentations are much smoother now.',
      12,
      'Gurugram',
    ),
    review(
      'aps-3',
      'Advanced Public Speaking',
      'Gauri',
      'Clear communication impact',
      'This course improved sentence flow and confidence in formal speaking. My child is now more expressive and organised while presenting. Teacher feedback is very specific.',
      11,
      'Ahmedabad',
    ),
    review(
      'aps-4',
      'Advanced Public Speaking',
      'Shruti',
      'Strong stage readiness',
      'My daughter now speaks with better structure, confidence, and pacing. She prepares independently and presents calmly. The improvement is clearly visible.',
      12,
      'Kolkata',
    ),
    review(
      'aps-5',
      'Advanced Public Speaking',
      'Ishita',
      'Excellent mentoring quality',
      'Sessions are premium and focused, with personal attention in every class. My child now communicates ideas with clarity and confidence. We appreciate the consistency.',
      11,
      'Coimbatore',
    ),
  ],
};

const ALL_STATIC_TESTIMONIALS: StaticTestimonial[] = TESTIMONIAL_PROGRAM_ORDER.flatMap(
  (program) => STATIC_TESTIMONIALS_BY_PROGRAM[program],
);

const TRACK_TO_PROGRAMS: Record<'phonics' | 'grammar' | 'speaking', StaticTestimonialProgram[]> = {
  phonics: ['Phonics Foundations', 'Early Phonics', 'Advanced Phonics'],
  grammar: ['Basic Grammar', 'Advanced Grammar'],
  speaking: ['Basic Public Speaking', 'Advanced Public Speaking'],
};

function normalizeTrack(courseTag?: string): 'phonics' | 'grammar' | 'speaking' | null {
  const tag = String(courseTag || '').toLowerCase();
  if (tag.includes('grammar')) return 'grammar';
  if (tag.includes('speaking') || tag.includes('public-speaking') || tag.includes('communication')) return 'speaking';
  if (tag.includes('phonic')) return 'phonics';
  return null;
}

export function getStaticTestimonialsForProgram(program: StaticTestimonialProgram, limit = 5): StaticTestimonial[] {
  return STATIC_TESTIMONIALS_BY_PROGRAM[program].slice(0, Math.max(0, limit));
}

export function getStaticTestimonialsByCourseTag(courseTag?: string, limit = 3): StaticTestimonial[] {
  const track = normalizeTrack(courseTag);
  if (!track) return ALL_STATIC_TESTIMONIALS.slice(0, Math.max(0, limit));
  const items = TRACK_TO_PROGRAMS[track].flatMap((program) => STATIC_TESTIMONIALS_BY_PROGRAM[program]);
  return items.slice(0, Math.max(0, limit));
}

export function getStaticTestimonialsForSection(params: {
  pageTag?: string;
  courseTag?: string;
  limit?: number;
}): StaticTestimonial[] {
  const limit = Math.max(0, params.limit ?? 3);
  const pageTag = String(params.pageTag || '').toLowerCase();

  if (params.courseTag) {
    return getStaticTestimonialsByCourseTag(params.courseTag, limit);
  }

  if (pageTag === 'class-samples') {
    const picks: StaticTestimonial[] = [
      STATIC_TESTIMONIALS_BY_PROGRAM['Phonics Foundations'][0],
      STATIC_TESTIMONIALS_BY_PROGRAM['Basic Grammar'][0],
      STATIC_TESTIMONIALS_BY_PROGRAM['Basic Public Speaking'][0],
      STATIC_TESTIMONIALS_BY_PROGRAM['Advanced Phonics'][0],
    ];
    return picks.slice(0, limit);
  }

  if (pageTag === 'why-tiny-steps') {
    const picks: StaticTestimonial[] = [
      STATIC_TESTIMONIALS_BY_PROGRAM['Phonics Foundations'][1],
      STATIC_TESTIMONIALS_BY_PROGRAM['Early Phonics'][1],
      STATIC_TESTIMONIALS_BY_PROGRAM['Basic Grammar'][1],
      STATIC_TESTIMONIALS_BY_PROGRAM['Advanced Grammar'][1],
      STATIC_TESTIMONIALS_BY_PROGRAM['Basic Public Speaking'][1],
      STATIC_TESTIMONIALS_BY_PROGRAM['Advanced Public Speaking'][1],
    ];
    return picks.slice(0, limit);
  }

  return ALL_STATIC_TESTIMONIALS.slice(0, limit);
}
