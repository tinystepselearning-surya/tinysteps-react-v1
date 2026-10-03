import {
  formatINR,
  ONE_TO_ONE_MONTHLY_PACKAGES,
  ULTRA_PREMIUM_PRICING,
} from '../config/pricing';
import { SEMANTIC_FACTS } from '../config/semanticFacts';
import { PHONICS_LESSONS_BY_COURSE, PHONICS_STAGE_DEFINITIONS } from './phonicsCurriculum';
import { buildPublicGrammarStages } from './grammarCurriculum';
import { buildPublicSpeakingStages } from './speakingCurriculum';

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
    overview: ['Conversation & turn-taking', 'Questions + clarification', 'Description + explanation', 'Storytelling + short talks'],
    outcomes: ['Sustain short back-and-forth exchanges', 'Ask and answer relevant questions', 'Organise and explain ideas for a listener', 'Deliver a short talk and respond to simple Q&A'],
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
    overview: ['Purpose + audience', 'Questioning + dialogue', 'Reasoning + evidence', 'Discussion + AI-era communication'],
    outcomes: ['Adapt communication for purpose and audience', 'Ask, clarify, paraphrase, and build on ideas', 'Explain and support reasoning with evidence', 'Evaluate information and AI outputs with human judgement', 'Deliver independent presentations and handle Q&A'],
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
    weeks: buildPublicSpeakingStages('basic-public-speaking'),
  },
  'public-speaking-excellence': {
    weeks: buildPublicSpeakingStages('advanced-public-speaking'),
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
    weeks: buildPublicSpeakingStages('basic-public-speaking'),
  },
  'advanced-public-speaking': {
    weeks: buildPublicSpeakingStages('advanced-public-speaking'),
  },
};
