// Lightweight course catalog and deep curriculum samples
export type CourseTrack = 'phonics' | 'grammar' | 'speaking';

export type CourseCatalogItem = {
  slug: string;
  icon: string;
  name: string;
  track: CourseTrack;
  age: string;
  duration: string;
  frequency: string;
  level: string;
  overview: string[];
  outcomes: string[];
  price: string;
  reviews?: string;
};

export const catalogs: CourseCatalogItem[] = [
  {
    slug: 'phonics-foundation',
    icon: '🔤',
    name: 'Phonics Foundation',
    track: 'phonics',
    age: 'Ages 3–7',
    duration: '12 weeks',
    frequency: '3x/week • 35–40 min',
    level: 'Foundation',
    overview: ['Letters & sounds (SATPIN)', 'Blending CVC', 'Digraphs', 'Magic‑e & teams', 'Tricky words'],
    outcomes: ['Identify 100+ letter sounds', 'Read decodable books', 'Write CVC words correctly', 'Recognize tricky words'],
    price: '₹4,400/month',
    reviews: '⭐⭐⭐⭐⭐ (127 reviews) — "Perfect for my 4‑year‑old! She’s reading now!"'
  },
  {
    slug: 'phonics-advanced',
    icon: '📚',
    name: 'Phonics Advanced',
    track: 'phonics',
    age: 'Ages 6–12',
    duration: '12 weeks',
    frequency: '2–3x/week',
    level: 'Advanced',
    overview: ['Long vowels', 'R‑controlled', 'Diphthongs', 'Multisyllabic strategies', 'Fluency'],
    outcomes: ['Read 150–300 word passages', 'Write 8–10 sentence paragraphs', 'Apply advanced patterns'],
    price: '₹6,600/month'
  },
  {
    slug: 'phonics-foundations',
    icon: '🧩',
    name: 'Phonics Foundations (Brush‑Up)',
    track: 'phonics',
    age: 'Ages 5–10',
    duration: '8–12 weeks',
    frequency: '2–3x/week',
    level: 'Brush‑Up',
    overview: ['Gap analysis', 'Targeted digraphs', 'Magic‑e & teams', 'Tricky words intensive', 'Multisyllabic decoding'],
    outcomes: ['Eliminate identified gaps', 'Personal reader booklet', 'Spelling list mastery'],
    price: '₹4,400–₹6,600/month'
  },
  {
    slug: 'grammar-essentials',
    icon: '✍️',
    name: 'Grammar Essentials',
    track: 'grammar',
    age: 'Ages 5–10',
    duration: '12 weeks',
    frequency: '2x/week',
    level: 'Basic',
    overview: ['Nouns & pronouns', 'Verbs & tenses', 'Adjectives', 'Prepositions', 'Conjunctions'],
    outcomes: ['Write 6–8 sentence paragraph', 'Punctuate correctly', 'Subject‑verb agreement mastery'],
    price: '₹4,400–₹6,600/month'
  },
  {
    slug: 'grammar-mastery',
    icon: '🧠',
    name: 'Grammar Mastery',
    track: 'grammar',
    age: 'Ages 8–15',
    duration: '12 weeks',
    frequency: '2x/week',
    level: 'Advanced',
    overview: ['All 12 tenses', 'Clauses & modals', 'Reported speech', 'Passive voice', 'Advanced punctuation'],
    outcomes: ['120–180 word informative paragraph', 'Cohesion & transition words', 'Advanced accuracy'],
    price: '₹6,600–₹8,800/month'
  },
  {
    slug: 'public-speaking-foundations',
    icon: '🎤',
    name: 'Public Speaking Foundations',
    track: 'speaking',
    age: 'Ages 4–7',
    duration: '12 weeks',
    frequency: '2x/week',
    level: 'Basic',
    overview: ['Confidence & posture', 'Clear voice', 'Picture talks', 'Show & Tell structure'],
    outcomes: ['30–45s Show & Tell', 'Eye contact & posture', 'Intro‑middle‑close'],
    price: '₹4,400–₹6,600/month'
  },
  {
    slug: 'public-speaking-excellence',
    icon: '🏆',
    name: 'Public Speaking Excellence',
    track: 'speaking',
    age: 'Ages 7–15',
    duration: '12 weeks',
    frequency: '2x/week',
    level: 'Advanced',
    overview: ['Hook‑Body‑Close', 'Persuasion & debate', 'Impromptu speaking', 'Visual aids mastery'],
    outcomes: ['1–2 minute capstone speech', 'Rubric‑based evaluation', 'Leadership presence'],
    price: '₹6,600–₹8,800/month'
  }
];

// Deep curriculum for detail pages (sample; Early Phonics expanded; others outline)
export const curriculumBySlug: Record<string, { weeks?: { title: string; learns?: string[]; focus?: string; activities?: string[]; homework?: string[]; mastery?: string }[] }>
  = {
    'phonics-foundation': {
      weeks: [
        { title: 'Week 1: SATPIN Set 1', focus: '/s/ /a/ /t/ /p/ /i/ /n/', learns: ['Identify sounds (not letter names)', 'Sound‑motion hooks', 'Intro to blending', 'CVC words: at, in, sat, pin'], activities: ['Sound ID', 'Motions', 'Blend sat/pin/tap', 'Match letter→sound'], homework: ['Worksheet (5 min)', 'Listen & repeat (2 min)'], mastery: 'Identifies all 6 sounds ✓' },
        { title: 'Week 2: Set 2 + CK', focus: '/m/ /d/ /g/ /o/ /c/ /k/ + CK', learns: ['6 new sounds', 'CK rule (back/pack)', 'Word families'], activities: ['Digraph Detective', 'Word ladders', 'Build words'], homework: ['List 10 CK words'], mastery: 'Reads CK words ✓' },
        { title: 'Week 3: Set 3 + Blending Drill', learns: ['Add next sound set', 'Slow→fast blending', 'Onset‑rime'], activities: ['CVC builder', 'Minimal pairs', 'Tap & blend'], homework: ['Daily blending 5–10 min'], mastery: 'Blend 10 CVC words ✓' },
        { title: 'Week 4: Fluency with CVC', learns: ['Accuracy → speed', 'One‑sentence readers'], activities: ['1‑sentence readers', 'Timed reads'], mastery: 'Reads short CVC sentences ✓' },
        { title: 'Week 5: End‑Double Rules (ff/ll/ss/zz)', learns: ['Double endings'], activities: ['Word sort', 'Read & mark'], mastery: 'Applies end‑double rules ✓' },
        { title: 'Week 6: Intro to Digraphs', focus: 'sh, ch, th, wh', learns: ['2 letters = 1 sound'], activities: ['Digraph hunt', 'Sort & read'], mastery: 'Identifies 4 digraphs ✓' },
        { title: 'Week 7: Mixed CVC+Digraphs', learns: ['Mix patterns in readers', 'Accuracy + expression'], activities: ['Sentence dice', 'Read & retell'], mastery: 'Reads mixed patterns ✓' },
        { title: 'Week 8: Early Rules Review', learns: ['CK + doubles + digraphs'], activities: ['Game day review'], mastery: '90% accuracy ✓' },
        { title: 'Week 9: Tricky Words Set 1', learns: ['the, to, do, was, are, said, come'], activities: ['Rhymes & sentences', 'Spaced practice'], mastery: 'Reads 7 tricky words ✓' },
        { title: 'Week 10: Fluency — 1‑minute Reads', learns: ['Pace & accuracy'], activities: ['1‑minute readers', 'Progress chart'], mastery: '95% sentence accuracy ✓' },
        { title: 'Week 11: Comprehension Basics', learns: ['who/what/where Q&A'], activities: ['Picture talk + read'], mastery: 'Answers 3 W‑questions ✓' },
        { title: 'Week 12: Review + Tricky Words', focus: 'Review all + TW set', learns: ['Capstone practice'], activities: ['Decodable page'], mastery: 'Capstone: 95%+ fluent page + 5 sentences ✓' }
      ]
    },
    'phonics-advanced': {
      weeks: [
        { title: 'Week 1: Diagnostic + Syllable Types' },
        { title: 'Week 2: Long Vowels — A (ai, ay, a_e, eigh/ei)' },
        { title: 'Week 3: E/I patterns (ee, ea, e_e, ie, igh, i_e, y)' },
        { title: 'Week 4: O/U patterns (oa, oe, o_e, oo, ue, ui, u_e, ew)' },
        { title: 'Week 5: R‑controlled review (ar, er, ir, or, ur)' },
        { title: 'Week 6: Diphthongs (oi/oy, ou/ow, au/aw)' },
        { title: 'Week 7: Soft/Hard C & G + J sounds' },
        { title: 'Week 8: Schwa & reduction patterns' },
        { title: 'Week 9: Consonant+le + Morphology rules' },
        { title: 'Week 10: Common prefixes (un‑, re‑, pre‑, mis‑, dis‑)' },
        { title: 'Week 11: Multisyllabic strategies + fluency' },
        { title: 'Week 12: Comprehensive review + CAPSTONE' }
      ]
    },
    'grammar-essentials': { weeks: [] },
    'grammar-mastery': { weeks: [] },
    'public-speaking-foundations': { weeks: [] },
    'public-speaking-excellence': { weeks: [] },
    'phonics-foundations': { weeks: [] }
  };
