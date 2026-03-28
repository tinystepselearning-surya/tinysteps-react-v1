import {
  formatINR,
  ONE_TO_ONE_MONTHLY_PACKAGES,
  ULTRA_PREMIUM_PRICING,
} from '../config/pricing';

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
  ibLens: string[];
  reviews?: string;
};

const courseStartingPriceCopy = `Plans from ${formatINR(
  ONE_TO_ONE_MONTHLY_PACKAGES[0].monthlyFee
)}/month (Tiny Steps Premium Classes) • Ultra Premium monthly plans from ${formatINR(
  Math.min(...ULTRA_PREMIUM_PRICING.map((row) => row.package12))
)} to ${formatINR(
  Math.max(...ULTRA_PREMIUM_PRICING.map((row) => row.package12))
)} (12 classes)`;

export const catalogs: CourseCatalogItem[] = [
  {
    slug: 'phonics-foundation',
    icon: '🔤',
    name: 'Phonics Foundations',
    track: 'phonics',
    age: 'Ages 3–7',
    duration: '30 lessons',
    frequency: 'Flexible pace',
    level: 'Foundation',
    overview: ['Letter sounds', 'Short vowels', 'Sound practice', 'Early blending', 'Confidence building'],
    outcomes: ['Recognize core letter sounds', 'Blend simple CVC words', 'Read and spell short words'],
    price: courseStartingPriceCopy,
    ibLens: [
      'ATL: Communication & Thinking (phonological awareness, reflection journals)',
      'PYP Language: Phonemic awareness, decoding, emergent writing',
      'Learner Profile: Inquirer, Communicator',
    ],
    reviews: '⭐⭐⭐⭐⭐ (127 reviews) — "Perfect for my 4‑year‑old! She’s reading now!"',
  },
  {
    slug: 'phonics-brush-up',
    icon: '📘',
    name: 'Early Phonics',
    track: 'phonics',
    age: 'Ages 4–8',
    duration: '41 lessons',
    frequency: 'Flexible pace',
    level: 'Early',
    overview: ['Sound sets', 'Digraphs', 'Vowel teams', 'Magic E', 'Longer word rules'],
    outcomes: ['Read patterned words', 'Apply core phonics rules', 'Build decoding confidence'],
    price: courseStartingPriceCopy,
    ibLens: [
      'ATL: Self-Management & Communication (goal tracking, oral reading logs)',
      'PYP Language: Differentiated decoding + encoding sequences',
      'Learner Profile: Balanced, Principled',
    ],
  },
  {
    slug: 'phonics-advanced',
    icon: '📚',
    name: 'Advanced Phonics',
    track: 'phonics',
    age: 'Ages 6–12',
    duration: '20 lessons',
    frequency: 'Flexible pace',
    level: 'Advanced',
    overview: ['Diphthongs', 'Bossy R', 'Alternate vowels', 'Endings', 'Fluency'],
    outcomes: ['Read longer words', 'Apply advanced patterns', 'Improve reading fluency'],
    price: courseStartingPriceCopy,
    ibLens: [
      'ATL: Research & Self-Management (word inquiries, independent practice logs)',
      'PYP Language: Reading comprehension, spelling conventions, fluency',
      'Learner Profile: Knowledgeable, Reflective',
    ],
  },
  {
    slug: 'basic-grammar',
    icon: '✍️',
    name: 'Beginner Grammar',
    track: 'grammar',
    age: 'Ages 5–10',
    duration: '36 lessons',
    frequency: 'Flexible pace',
    level: 'Basic',
    overview: ['Word foundations', 'Grammar basics', 'Sentence building', 'Conjunctions + adverbs', 'Tenses basics', 'Guided writing + revision'],
    outcomes: ['Build clear and meaningful sentences', 'Use punctuation and tenses correctly in simple writing', 'Write supported short paragraphs with confidence'],
    price: courseStartingPriceCopy,
    ibLens: [
      'ATL: Communication (sentence crafting, peer dialogue) & Research (language inquiry)',
      'PYP Language: Written conventions, grammar usage, short-form writing',
      'Learner Profile: Communicator, Thinker',
    ],
  },
  {
    slug: 'advanced-grammar',
    icon: '🧠',
    name: 'Advanced Grammar',
    track: 'grammar',
    age: 'Ages 8–15',
    duration: '36 lessons',
    frequency: 'Flexible pace',
    level: 'Advanced',
    overview: ['Tense control', 'Clauses & complex sentences', 'Voice & reported speech', 'Paragraph cohesion'],
    outcomes: ['Write structured paragraphs', 'Edit grammar mistakes', 'Use advanced grammar confidently'],
    price: courseStartingPriceCopy,
    ibLens: [
      'ATL: Thinking & Research (essay planning, language analysis)',
      'MYP Language & Literature alignment: grammar accuracy, rationale writing',
      'Learner Profile: Reflective, Principled',
    ],
  },
  {
    slug: 'basic-public-speaking',
    icon: '🎤',
    name: 'Public Speaking (Basic)',
    track: 'speaking',
    age: 'Ages 4–7',
    duration: '36 lessons',
    frequency: 'Flexible pace',
    level: 'Basic',
    overview: ['Confidence & posture', 'Clear speech', 'Show & tell', 'Mini talks + Q&A'],
    outcomes: ['30–60s short talks', 'Eye contact & voice control', 'Simple structure'],
    price: courseStartingPriceCopy,
    ibLens: [
      'ATL: Communication & Social skills (spoken interactions, empathy building)',
      'PYP Oral Language scope: listening & speaking, presentation skills',
      'Learner Profile: Courageous, Caring',
    ],
  },
  {
    slug: 'advanced-public-speaking',
    icon: '🏆',
    name: 'Public Speaking (Advanced)',
    track: 'speaking',
    age: 'Ages 7–15',
    duration: '36 lessons',
    frequency: 'Flexible pace',
    level: 'Advanced',
    overview: ['Presence & engagement', 'Structure + details', 'Impromptu + debate', 'Presentation mastery'],
    outcomes: ['1–2 minute speeches', 'Confident Q&A handling', 'Polished presentations'],
    price: courseStartingPriceCopy,
    ibLens: [
      'ATL: Communication & Self-management (speech planning, rehearsals, feedback journals)',
      'Approaches to Learning – Presentation & Media literacy strands',
      'Learner Profile: Communicator, Risk-taker',
    ],
  },
];

const buildLessonTitles = (labels: string[]) =>
  labels.map((label, idx) => `Lesson ${idx + 1} — ${label}`);

const buildStageItems = (
  lessonTitles: string[],
  stages: { title: string; start: number; end: number; focus?: string }[],
) =>
  stages.map((stage) => ({
    title: stage.title,
    focus: stage.focus,
    lessons: lessonTitles.slice(stage.start - 1, stage.end),
  }));

const PHONICS_FOUNDATIONS_LESSONS = [
  'Lesson 1 — Letter sound: /s/',
  'Lesson 2 — Letter sound: /a/',
  'Lesson 3 — Letter sound: /t/',
  'Lesson 4 — Letter sound: /i/',
  'Lesson 5 — Letter sound: /p/',
  'Lesson 6 — Letter sound: /n/',
  'Lesson 7 — Letter sound: /c/',
  'Lesson 8 — Letter sound: /k/',
  'Lesson 9 — Letter sound: /e/',
  'Lesson 10 — Letter sound: /h/',
  'Lesson 11 — Letter sound: /r/',
  'Lesson 12 — Letter sound: /m/',
  'Lesson 13 — Letter sound: /d/',
  'Lesson 14 — Letter sound: /g/',
  'Lesson 15 — Letter sound: /o/',
  'Lesson 16 — Letter sound: /u/',
  'Lesson 17 — Letter sound: /l/',
  'Lesson 18 — Letter sound: /f/',
  'Lesson 19 — Letter sound: /b/',
  'Lesson 20 — Letter sound: /j/',
  'Lesson 21 — Letter sound: /z/',
  'Lesson 22 — Letter sound: /w/',
  'Lesson 23 — Letter sound: /v/',
  'Lesson 24 — Letter sound: /y/',
  'Lesson 25 — Letter sound: /x/',
  'Lesson 26 — Letter sound: /qu/',
  'Lesson 27 — Short vowels: a e i o u',
  'Lesson 28 — Review: all letter sounds',
  'Lesson 29 — Revision',
  'Lesson 30 — Revision',
];

const EARLY_PHONICS_LESSONS = [
  'Lesson 1 — Sound Set 1: /s/ /a/ /t/',
  'Lesson 2 — Sound Set 2: /i/ /p/ /n/',
  'Lesson 3 — Hard /k/ sound: c & k',
  'Lesson 4 — Sound Set 3: /e/ /h/ /r/',
  'Lesson 5 — Sound Set 4: /m/ /d/ /g/',
  'Lesson 6 — Sound Set 5: /o/ /u/ /l/',
  'Lesson 7 — Sound Set 6: /f/ /b/ /j/',
  'Lesson 8 — Sound Set 7: /z/ /w/ /v/',
  'Lesson 9 — Special letters: y, x, qu',
  'Lesson 10 — Short vowels: a, e, i, o, u',
  'Lesson 11 — Digraph: sh (/sh/)',
  'Lesson 12 — Digraph: ch + spelling: tch',
  'Lesson 13 — Digraph: th (voiced & unvoiced)',
  'Lesson 14 — Ending Rule: ck says /k/',
  'Lesson 15 — End patterns: ng + silent b (mb)',
  'Lesson 16 — Silent letters: kn = /n/',
  'Lesson 17 — Silent letters: wr = /r/',
  'Lesson 18 — Digraph: wh (/w/)',
  'Lesson 19 — Tricky patterns: ph=/f/, gh (silent or /f/)',
  'Lesson 20 — Revision: digraphs + tricky patterns',
  'Lesson 21 — Floss Rule: double f/l/s after short vowel',
  'Lesson 22 — Long A: ai (/ā/)',
  'Lesson 23 — Long E: ee (/ē/)',
  'Lesson 24 — Vowel team: ea (/ē/)',
  'Lesson 25 — Vowel team: ie (/ī/)',
  'Lesson 26 — Long O: oa (/ō/)',
  'Lesson 27 — OO sounds: /oo/ vs /ʊ/',
  'Lesson 28 — Long O: oe (/ō/)',
  'Lesson 29 — Long U spelling: ui (fruit sound)',
  'Lesson 30 — Long U spelling: ue (blue sound)',
  'Lesson 31 — Long I: igh (/ī/)',
  'Lesson 32 — Magic E: a_e (/ā/)',
  'Lesson 33 — Magic E: e_e (/ē/)',
  'Lesson 34 — Magic E: i_e (/ī/)',
  'Lesson 35 — Magic E: o_e (/ō/)',
  'Lesson 36 — Magic E: u_e (/yoo/ or /oo/)',
  'Lesson 37 — Rabbit Rule: double consonant in 2-syllable words',
  'Lesson 38 — Monster-le: consonant + le ending',
  'Lesson 39 — Soft C: c says /s/ (before e/i/y)',
  'Lesson 40 — Hard G: g says /g/',
  'Lesson 41 — Final revision + reading check',
];

const ADVANCED_PHONICS_LESSONS = [
  'Lesson 1 — Diphthongs: ai / ay',
  'Lesson 2 — Diphthongs: oi / oy',
  'Lesson 3 — Diphthongs: ou / ow',
  'Lesson 4 — Diphthongs: au / aw',
  'Lesson 5 — Bossy R: ar',
  'Lesson 6 — Bossy R: or',
  'Lesson 7 — Bossy R: ir / ur / er',
  'Lesson 8 — Three J sounds',
  'Lesson 9 — /shun/ endings',
  'Lesson 10 — Silent letters',
  'Lesson 11 — Alternate A',
  'Lesson 12 — Alternate E',
  'Lesson 13 — Alternate I',
  'Lesson 14 — Alternate O',
  'Lesson 15 — Alternate U',
  'Lesson 16 — Ending rule: c / ct sound',
  'Lesson 17 — Revision',
  'Lesson 18 — Revision',
  'Lesson 19 — Revision',
  'Lesson 20 — Revision',
];

const GRAMMAR_BASIC_LABELS = [
  'Nouns',
  'Proper Nouns',
  'Verbs',
  'Adjectives',
  'Pronouns',
  'Revision',
  'Singular and Plural — Part 1',
  'Singular and Plural — Part 2',
  'Articles — a / an',
  'Articles — the',
  'Prepositions',
  'Revision',
  'Capital Letters and Full Stop',
  'Question Mark',
  'Exclamation Mark and Comma',
  'Simple Sentences',
  'Sentence Formation',
  'Revision',
  'Conjunctions — Part 1',
  'Conjunctions — Part 2',
  'Adverbs — How',
  'Adverbs — When and Where',
  'Expanding Sentences',
  'Revision',
  'Simple Present Tense',
  'Simple Past Tense',
  'Simple Future Tense',
  'Revision — Tenses Basics',
  'Questions and Answers',
  'Revision',
  'Jumbled Sentences',
  'Make Better Sentences',
  'Picture Description',
  'Paragraph Writing',
  'Overall Revision — 1',
  'Overall Revision — 2',
];

const GRAMMAR_ADVANCED_LABELS = [
  'Tense review: simple vs continuous',
  'Time clauses and tense choice',
  'Choose the correct tense',
  'Edit tense shifts',
  'Tense mastery practice',
  'Revision: tense control',
  'Present perfect',
  'Past perfect',
  'Future perfect',
  'Modal verbs: meaning + choice',
  'Edit modal sentences',
  'Revision: perfects + modals',
  'Independent vs dependent clauses',
  'Relative clauses',
  'Complex sentences with clauses',
  'Punctuation in complex sentences',
  'Fix fragments',
  'Revision: clauses',
  'Active vs passive voice',
  'Convert active → passive',
  'Reported speech basics',
  'Reported speech + tense shift',
  'Edit for clarity',
  'Revision: voice + reported speech',
  'Commas + semicolons',
  'Transition words',
  'Paragraph structure',
  'Cohesion and flow',
  'Paragraph edit practice',
  'Revision: cohesion',
  'Tone and formality',
  'Claim + reason',
  'Evidence sentence',
  'Word choice + impact',
  'Counterargument',
  'Final writing showcase',
];

const SPEAKING_BASIC_LABELS = [
  'Warm-up routine',
  'Eye contact basics',
  'Posture + body stillness',
  'Friendly voice volume',
  'Simple self-introduction',
  'Revision: confidence routine',
  'Speak in full sentences',
  'Clear speech: slow pace',
  'Clear word endings',
  'Volume control',
  'Pause between ideas',
  'Revision: clear speaking',
  'Picture talk (what do you see?)',
  'Describe with 3 details',
  'Use describing words',
  'Simple gestures',
  'Emotion words',
  'Revision: describe + show & tell',
  'Answer questions in full sentences',
  'One-minute talk',
  'Sequence words: first/next/last',
  'Voice variety',
  'Revision: mini talks + Q&A',
  'Tell a short story',
  'Beginning–middle–end',
  'Character voice (light)',
  'Emphasis on key words',
  'Small audience practice',
  'Revision: story basics',
  'Presentation practice',
  'Speaking with a prop/visual',
  'Handling mistakes calmly',
  'Clarity check',
  'Final mini speech',
  'Showcase + reflection',
];

const SPEAKING_ADVANCED_LABELS = [
  'Strong opening lines',
  'Audience engagement',
  'Stage presence',
  'Clear speech (articulation)',
  'Pacing for impact',
  'Revision: presence check',
  'Hook-body-close',
  'Supporting details',
  'Evidence and examples',
  'Sequence + transitions',
  'Stay on message',
  'Revision: structure',
  'Storytelling with emotion',
  'Character voices',
  'Scene setting',
  'Pause for effect',
  'Voice variety',
  'Revision: story performance',
  'Impromptu speaking',
  'Thinking time strategies',
  'Answering tough questions',
  'Clarity under pressure',
  'Confidence reset',
  'Revision: impromptu',
  'Persuasion basics',
  'Agree/disagree politely',
  'Rebuttal practice',
  'Strong conclusion',
  'Audience Q&A',
  'Revision: debate',
  'Presentation with visuals',
  'Speaking with notes',
  'Timing and pacing',
  'Engaging the audience',
  'Final capstone speech',
  'Revision: showcase',
];

const GRAMMAR_BASIC_LESSONS = buildLessonTitles(GRAMMAR_BASIC_LABELS);
const GRAMMAR_ADVANCED_LESSONS = buildLessonTitles(GRAMMAR_ADVANCED_LABELS);
const SPEAKING_BASIC_LESSONS = buildLessonTitles(SPEAKING_BASIC_LABELS);
const SPEAKING_ADVANCED_LESSONS = buildLessonTitles(SPEAKING_ADVANCED_LABELS);

const PHONICS_FOUNDATIONS_STAGES = [
  { title: 'Stage 1 — First letter sounds', start: 1, end: 5, focus: 'Learn the first letter sounds and match them to pictures.' },
  { title: 'Stage 2 — Letter sounds set 2', start: 6, end: 10, focus: 'Build quick recall of more letter sounds.' },
  { title: 'Stage 3 — Letter sounds set 3', start: 11, end: 15, focus: 'Add new letter sounds and use them in simple words.' },
  { title: 'Stage 4 — Letter sounds set 4', start: 16, end: 20, focus: 'Practice additional consonant sounds with picture-word matching.' },
  { title: 'Stage 5 — Letter sounds set 5', start: 21, end: 25, focus: 'Complete the core set of letter sounds.' },
  { title: 'Stage 6 — Short vowels + review', start: 26, end: 30, focus: 'Short vowels + review all sounds.' },
];

const EARLY_PHONICS_STAGES = [
  { title: 'Stage 1 — Sound sets 1–5', start: 1, end: 6, focus: 'Blend sound sets 1–5 and read simple CVC words.' },
  { title: 'Stage 2 — Sound sets 6–7 + short vowels', start: 7, end: 10, focus: 'Finish sound sets + short vowels for smoother blending.' },
  { title: 'Stage 3 — Digraphs + silent letters', start: 11, end: 20, focus: 'Learn digraphs and silent letters in words.' },
  { title: 'Stage 4 — Vowel teams + long vowels', start: 21, end: 31, focus: 'Practice vowel teams and long vowel patterns.' },
  { title: 'Stage 5 — Magic E', start: 32, end: 36, focus: 'Master Magic E long vowels.' },
  { title: 'Stage 6 — Longer words + review', start: 37, end: 41, focus: 'Apply rules in longer words and review.' },
];

const ADVANCED_PHONICS_STAGES = [
  { title: 'Stage 1 — Diphthongs', start: 1, end: 4, focus: 'Diphthongs and gliding vowel sounds.' },
  { title: 'Stage 2 — Bossy R', start: 5, end: 7, focus: 'Bossy R patterns for ar/or/er/ir/ur.' },
  { title: 'Stage 3 — Special sounds + silent letters', start: 8, end: 10, focus: 'Special sounds and silent letter patterns.' },
  { title: 'Stage 4 — Alternate vowels', start: 11, end: 15, focus: 'Alternate vowel spellings in words.' },
  { title: 'Stage 5 — Endings', start: 16, end: 16, focus: 'Endings and suffix sounds.' },
  { title: 'Stage 6 — Revision', start: 17, end: 20, focus: 'Mixed revision + fluency practice.' },
];

const GRAMMAR_BASIC_STAGES = [
  { title: 'Stage 1 — Word Foundations', start: 1, end: 6, focus: 'Goal: Identify and understand the main basic word types.' },
  { title: 'Stage 2 — Grammar Basics', start: 7, end: 12, focus: 'Goal: Learn core grammar rules and usage basics.' },
  { title: 'Stage 3 — Sentence Building', start: 13, end: 18, focus: 'Goal: Build correct sentences with proper punctuation.' },
  { title: 'Stage 4 — Conjunctions and Adverbs', start: 19, end: 24, focus: 'Goal: Connect ideas and add detail to sentences.' },
  { title: 'Stage 5 — Tenses Basics', start: 25, end: 30, focus: 'Goal: Learn the three basic tenses in a simple and gradual way.' },
  { title: 'Stage 6 — Sentence Writing and Final Revision', start: 31, end: 36, focus: 'Goal: Apply learning to build and write meaningful sentences and short paragraphs.' },
];

const GRAMMAR_ADVANCED_STAGES = [
  { title: 'Stage 1 — Tense Control', start: 1, end: 6, focus: 'Control tense choices and keep them consistent.' },
  { title: 'Stage 2 — Perfect Tenses + Modals', start: 7, end: 12, focus: 'Use perfect tenses and modals accurately.' },
  { title: 'Stage 3 — Clauses + Complex Sentences', start: 13, end: 18, focus: 'Build complex sentences with clauses.' },
  { title: 'Stage 4 — Voice + Reported Speech', start: 19, end: 24, focus: 'Use voice and reported speech clearly.' },
  { title: 'Stage 5 — Paragraph Cohesion', start: 25, end: 30, focus: 'Write cohesive paragraphs with transitions.' },
  { title: 'Stage 6 — Tone + Argument + Impact', start: 31, end: 36, focus: 'Write with tone, argument, and impact.' },
];

const SPEAKING_BASIC_STAGES = [
  { title: 'Stage 1 — Comfort + Routine', start: 1, end: 6, focus: 'Feel comfortable speaking in class routines.' },
  { title: 'Stage 2 — Clear Speaking', start: 7, end: 12, focus: 'Speak clearly with pace, volume, and full words.' },
  { title: 'Stage 3 — Describe + Show & Tell', start: 13, end: 18, focus: 'Describe objects with details and expression.' },
  { title: 'Stage 4 — Mini Talks + Q&A', start: 19, end: 24, focus: 'Give short talks and answer simple questions.' },
  { title: 'Stage 5 — Story Basics', start: 25, end: 30, focus: 'Tell a short story in order.' },
  { title: 'Stage 6 — Presentation Readiness', start: 31, end: 36, focus: 'Practice presentations with confidence.' },
];

const SPEAKING_ADVANCED_STAGES = [
  { title: 'Stage 1 — Presence + Engagement', start: 1, end: 6, focus: 'Engage the audience with confident presence.' },
  { title: 'Stage 2 — Structure + Supporting Details', start: 7, end: 12, focus: 'Structure talks with strong openings and details.' },
  { title: 'Stage 3 — Story Performance', start: 13, end: 18, focus: 'Perform stories with voice and emotion.' },
  { title: 'Stage 4 — Impromptu + Q&A', start: 19, end: 24, focus: 'Handle impromptu questions calmly.' },
  { title: 'Stage 5 — Persuasion + Debate', start: 25, end: 30, focus: 'Use persuasion and debate skills.' },
  { title: 'Stage 6 — Presentation Mastery', start: 31, end: 36, focus: 'Deliver polished presentations.' },
];

// Deep curriculum for detail pages (stage-based, lesson-by-lesson)
export const curriculumBySlug: Record<string, { weeks?: { title: string; focus?: string; lessons?: string[] }[] }> = {
  'phonics-foundation': {
    weeks: buildStageItems(PHONICS_FOUNDATIONS_LESSONS, PHONICS_FOUNDATIONS_STAGES),
  },
  'phonics-brush-up': {
    weeks: buildStageItems(EARLY_PHONICS_LESSONS, EARLY_PHONICS_STAGES),
  },
  'phonics-advanced': {
    weeks: buildStageItems(ADVANCED_PHONICS_LESSONS, ADVANCED_PHONICS_STAGES),
  },
  'grammar-essentials': {
    weeks: buildStageItems(GRAMMAR_BASIC_LESSONS, GRAMMAR_BASIC_STAGES),
  },
  'grammar-mastery': {
    weeks: buildStageItems(GRAMMAR_ADVANCED_LESSONS, GRAMMAR_ADVANCED_STAGES),
  },
  'public-speaking-foundations': {
    weeks: buildStageItems(SPEAKING_BASIC_LESSONS, SPEAKING_BASIC_STAGES),
  },
  'public-speaking-excellence': {
    weeks: buildStageItems(SPEAKING_ADVANCED_LESSONS, SPEAKING_ADVANCED_STAGES),
  },
  // Internal aliases to keep curriculum links stable
  'phonics-foundations': {
    weeks: buildStageItems(PHONICS_FOUNDATIONS_LESSONS, PHONICS_FOUNDATIONS_STAGES),
  },
  'early-phonics': {
    weeks: buildStageItems(EARLY_PHONICS_LESSONS, EARLY_PHONICS_STAGES),
  },
  'advanced-phonics': {
    weeks: buildStageItems(ADVANCED_PHONICS_LESSONS, ADVANCED_PHONICS_STAGES),
  },
  'basic-grammar': {
    weeks: buildStageItems(GRAMMAR_BASIC_LESSONS, GRAMMAR_BASIC_STAGES),
  },
  'advanced-grammar': {
    weeks: buildStageItems(GRAMMAR_ADVANCED_LESSONS, GRAMMAR_ADVANCED_STAGES),
  },
  'basic-public-speaking': {
    weeks: buildStageItems(SPEAKING_BASIC_LESSONS, SPEAKING_BASIC_STAGES),
  },
  'advanced-public-speaking': {
    weeks: buildStageItems(SPEAKING_ADVANCED_LESSONS, SPEAKING_ADVANCED_STAGES),
  },
};
