import {
  formatINR,
  ONE_TO_ONE_MONTHLY_PACKAGES,
  ULTRA_PREMIUM_PRICING,
} from '../config/pricing';
import { PHONICS_LESSONS_BY_COURSE, PHONICS_STAGE_DEFINITIONS } from './phonicsCurriculum';

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
    duration: '31 lessons',
    frequency: 'Flexible pace',
    level: 'Foundation',
    overview: ['Letter sounds', 'Short vowels', 'Sound practice', 'Structured revision', 'Grand revision'],
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
    duration: '40 lessons',
    frequency: 'Flexible pace',
    level: 'Early',
    overview: ['Sound sets', 'Phonics rules', 'Digraphs', 'Vowel teams + Magic E', 'Controlling R + diphthongs'],
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
    duration: '30 lessons',
    frequency: 'Flexible pace',
    level: 'Advanced',
    overview: ['Core phonics rules', 'Magic E + vowel teams', 'Diphthongs + SHUN', 'Controlling R', 'Long vowel sound families'],
    outcomes: ['Apply advanced sound families', 'Read longer patterned words', 'Improve reading and spelling fluency'],
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

const PHONICS_FOUNDATIONS_LESSONS = PHONICS_LESSONS_BY_COURSE['phonics-foundations'].map(
  (lesson) => lesson.displayTitle,
);
const EARLY_PHONICS_LESSONS = PHONICS_LESSONS_BY_COURSE['early-phonics'].map(
  (lesson) => lesson.displayTitle,
);
const ADVANCED_PHONICS_LESSONS = PHONICS_LESSONS_BY_COURSE['advanced-phonics'].map(
  (lesson) => lesson.displayTitle,
);

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

const toPublicPhonicsStages = (
  stages: Array<{ stageOrder: number; label: string; start: number; end: number }>,
) =>
  stages.map((stage) => ({
    title: stage.label,
    start: stage.start,
    end: stage.end,
    focus: `Lessons ${stage.start}–${stage.end}: ${stage.label.replace(/^Stage \d+ — /, '')}.`,
  }));

const PHONICS_FOUNDATIONS_STAGES = toPublicPhonicsStages(
  PHONICS_STAGE_DEFINITIONS['phonics-foundations'],
);
const EARLY_PHONICS_STAGES = toPublicPhonicsStages(
  PHONICS_STAGE_DEFINITIONS['early-phonics'],
);
const ADVANCED_PHONICS_STAGES = toPublicPhonicsStages(
  PHONICS_STAGE_DEFINITIONS['advanced-phonics'],
);

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