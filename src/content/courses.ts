import {
  formatINR,
  ONE_TO_ONE_MONTHLY_PACKAGES,
  ULTRA_PREMIUM_PRICING,
} from '../config/pricing';
import { SEMANTIC_FACTS } from '../config/semanticFacts';
import { PHONICS_LESSONS_BY_COURSE, PHONICS_STAGE_DEFINITIONS } from './phonicsCurriculum';
import { buildPublicGrammarStages } from './grammarCurriculum';

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

const phonicsFacts = SEMANTIC_FACTS.programmes.phonics.levels;
const grammarFacts = SEMANTIC_FACTS.programmes.grammar.levels;
const speakingFacts = SEMANTIC_FACTS.programmes.speaking.levels;
const lessonDuration = (count: number) => `${count} lessons`;

export const catalogs: CourseCatalogItem[] = [
  {
    slug: phonicsFacts.foundations.publicSlug,
    icon: '🔤',
    name: phonicsFacts.foundations.label,
    track: 'phonics',
    age: phonicsFacts.foundations.ageRange.label,
    duration: lessonDuration(phonicsFacts.foundations.lessonCount),
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
    slug: phonicsFacts.early.publicSlug,
    icon: '📘',
    name: phonicsFacts.early.label,
    track: 'phonics',
    age: phonicsFacts.early.ageRange.label,
    duration: lessonDuration(phonicsFacts.early.lessonCount),
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
    slug: phonicsFacts.advanced.publicSlug,
    icon: '📚',
    name: phonicsFacts.advanced.label,
    track: 'phonics',
    age: phonicsFacts.advanced.ageRange.label,
    duration: lessonDuration(phonicsFacts.advanced.lessonCount),
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
    slug: grammarFacts.beginner.publicSlug,
    icon: '✍️',
    name: grammarFacts.beginner.label,
    track: 'grammar',
    age: grammarFacts.beginner.ageRange.label,
    duration: lessonDuration(grammarFacts.beginner.lessonCount),
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
    slug: grammarFacts.advanced.publicSlug,
    icon: '🧠',
    name: grammarFacts.advanced.label,
    track: 'grammar',
    age: grammarFacts.advanced.ageRange.label,
    duration: lessonDuration(grammarFacts.advanced.lessonCount),
    frequency: 'Flexible pace',
    level: 'Advanced',
    overview: [
      'Sentence foundations',
      'Tense control',
      'Grammar accuracy',
      'Connecting ideas',
      'Advanced sentence craft',
      'Speaking & writing mastery',
    ],
    outcomes: [
      'Speak in complete and grammatically controlled sentences',
      'Use tense accurately according to time and meaning',
      'Ask questions and form negative sentences naturally',
      'Connect ideas using compound and complex sentence structures',
      'Express reason, result, time, condition, and contrast clearly',
      'Use richer and more varied sentence structures',
      'Recognise and correct common grammatical errors',
      'Maintain grammar, tense, and cohesion across longer writing',
      'Write organised and meaningful paragraphs independently',
      'Narrate, describe, explain, and express opinions confidently',
      'Adapt language according to audience and purpose',
      'Review and improve their own writing with less teacher support',
    ],
    price: courseStartingPriceCopy,
    ibLens: [
      'ATL: Thinking & Research (essay planning, language analysis)',
      'MYP Language & Literature alignment: grammar accuracy, rationale writing',
      'Learner Profile: Reflective, Principled',
    ],
  },
  {
    slug: speakingFacts.beginner.publicSlug,
    icon: '🎤',
    name: speakingFacts.beginner.label,
    track: 'speaking',
    age: speakingFacts.beginner.ageRange.label,
    duration: lessonDuration(speakingFacts.beginner.lessonCount),
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
    slug: speakingFacts.advanced.publicSlug,
    icon: '🏆',
    name: speakingFacts.advanced.label,
    track: 'speaking',
    age: speakingFacts.advanced.ageRange.label,
    duration: lessonDuration(speakingFacts.advanced.lessonCount),
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

type CurriculumStageDefinition = {
  title: string;
  start: number;
  end: number;
  focus?: string;
  learns?: string[];
};

const buildStageItems = (
  lessonTitles: string[],
  stages: CurriculumStageDefinition[],
) =>
  stages.map((stage) => ({
    title: stage.title,
    focus: stage.focus,
    learns: stage.learns,
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

type CurriculumWeek = {
  title: string;
  focus?: string;
  learns?: string[];
  lessons?: string[];
};

// Deep curriculum for detail pages (stage-based, lesson-by-lesson)
export const curriculumBySlug: Record<string, { weeks?: CurriculumWeek[] }> = {
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
    weeks: buildPublicGrammarStages('grammar-essentials'),
  },
  grammar: {
    weeks: buildPublicGrammarStages('grammar'),
  },
  'grammar-mastery': {
    weeks: buildPublicGrammarStages('grammar-mastery'),
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
    weeks: buildPublicGrammarStages('basic-grammar'),
  },
  'advanced-grammar': {
    weeks: buildPublicGrammarStages('advanced-grammar'),
  },
  'basic-public-speaking': {
    weeks: buildStageItems(SPEAKING_BASIC_LESSONS, SPEAKING_BASIC_STAGES),
  },
  'advanced-public-speaking': {
    weeks: buildStageItems(SPEAKING_ADVANCED_LESSONS, SPEAKING_ADVANCED_STAGES),
  },
};
