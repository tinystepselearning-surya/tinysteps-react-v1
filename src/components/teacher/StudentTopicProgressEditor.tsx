// src/components/teacher/StudentTopicProgressEditor.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import {
  useProgressPicklists,
} from '../../hooks/useProgressPicklists';
import {
  useKidTopicProgress,
  type KidTopicProgress,
} from '../../hooks/useKidTopicProgress';

interface StudentTopicProgressEditorProps {
  kidId: string;
  kidName?: string;
  onSaveAndBack?: () => void;
}

type CourseId =
  | 'phonics-foundations'
  | 'early-phonics'
  | 'advanced-phonics'
  | 'basic-grammar'
  | 'advanced-grammar'
  | 'basic-public-speaking'
  | 'advanced-public-speaking';

type CourseDefinition = {
  id: CourseId;
  label: string;
};

type CourseTopic = {
  id: string;
  lesson: string;
  label: string;
  displayTitle?: string;
  order?: number | null;
  stageLabel?: string | null;
  stageOrder?: number | null;
  rubricType?: RubricType;
  subskillChips?: string[];
  confusionOptions?: string[];
  courseId: CourseId;
  courseLabel: string;
  area: 'phonics' | 'grammar' | 'speaking';
};

const COURSE_DEFINITIONS: CourseDefinition[] = [
  { id: 'phonics-foundations', label: 'Phonics Foundations' },
  { id: 'early-phonics', label: 'Early Phonics' },
  { id: 'advanced-phonics', label: 'Advanced Phonics' },
  { id: 'basic-grammar', label: 'Basic Grammar' },
  { id: 'advanced-grammar', label: 'Advanced Grammar' },
  { id: 'basic-public-speaking', label: 'Public Speaking (Basic)' },
  { id: 'advanced-public-speaking', label: 'Public Speaking (Advanced)' },
];

const normalizeSlug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const extractLessonNumber = (value?: string, id?: string): number | null => {
  const raw = value || id || '';
  if (!raw) return null;
  const match = /lesson[-\s]*0*(\d+)/i.exec(raw);
  if (!match) return null;
  const num = Number(match[1]);
  return Number.isFinite(num) ? num : null;
};

const makeTopicId = (courseId: CourseId, lesson: string): string => {
  const lessonNum = extractLessonNumber(lesson);
  if (lessonNum != null) {
    return `${courseId}__lesson-${String(lessonNum).padStart(2, '0')}`;
  }
  return `${courseId}__${normalizeSlug(lesson)}`;
};

type StageDefinition = {
  stageOrder: number;
  label: string;
  start: number;
  end: number;
};

const STAGE_DEFINITIONS_BY_COURSE: Record<CourseId, StageDefinition[]> = {
  'phonics-foundations': [
    { stageOrder: 1, label: 'Stage 1 — First letter sounds', start: 1, end: 5 },
    { stageOrder: 2, label: 'Stage 2 — Letter sounds set 2', start: 6, end: 10 },
    { stageOrder: 3, label: 'Stage 3 — Letter sounds set 3', start: 11, end: 15 },
    { stageOrder: 4, label: 'Stage 4 — Letter sounds set 4', start: 16, end: 20 },
    { stageOrder: 5, label: 'Stage 5 — Letter sounds set 5', start: 21, end: 25 },
    { stageOrder: 6, label: 'Stage 6 — Short vowels + review', start: 26, end: 30 },
  ],
  'early-phonics': [
    { stageOrder: 1, label: 'Stage 1 — Sound sets 1–5', start: 1, end: 6 },
    { stageOrder: 2, label: 'Stage 2 — Sound sets 6–7 + short vowels', start: 7, end: 10 },
    { stageOrder: 3, label: 'Stage 3 — Digraphs + silent letters', start: 11, end: 20 },
    { stageOrder: 4, label: 'Stage 4 — Vowel teams + long vowels', start: 21, end: 31 },
    { stageOrder: 5, label: 'Stage 5 — Magic E', start: 32, end: 36 },
    { stageOrder: 6, label: 'Stage 6 — Longer words + review', start: 37, end: 41 },
  ],
  'advanced-phonics': [
    { stageOrder: 1, label: 'Stage 1 — Diphthongs', start: 1, end: 4 },
    { stageOrder: 2, label: 'Stage 2 — Bossy R', start: 5, end: 7 },
    { stageOrder: 3, label: 'Stage 3 — Special sounds + silent letters', start: 8, end: 10 },
    { stageOrder: 4, label: 'Stage 4 — Alternate vowels', start: 11, end: 15 },
    { stageOrder: 5, label: 'Stage 5 — Endings', start: 16, end: 16 },
    { stageOrder: 6, label: 'Stage 6 — Revision', start: 17, end: 20 },
  ],
  'basic-grammar': [
    { stageOrder: 1, label: 'Stage 1 — Sentence Foundations', start: 1, end: 6 },
    { stageOrder: 2, label: 'Stage 2 — Meaning Builders', start: 7, end: 12 },
    { stageOrder: 3, label: 'Stage 3 — Where/When/How', start: 13, end: 18 },
    { stageOrder: 4, label: 'Stage 4 — Longer Sentences', start: 19, end: 24 },
    { stageOrder: 5, label: 'Stage 5 — Asking + Punctuation', start: 25, end: 30 },
    { stageOrder: 6, label: 'Stage 6 — Tenses Basics', start: 31, end: 36 },
  ],
  'advanced-grammar': [
    { stageOrder: 1, label: 'Stage 1 — Tense Control', start: 1, end: 6 },
    { stageOrder: 2, label: 'Stage 2 — Perfect Tenses + Modals', start: 7, end: 12 },
    { stageOrder: 3, label: 'Stage 3 — Clauses + Complex Sentences', start: 13, end: 18 },
    { stageOrder: 4, label: 'Stage 4 — Voice + Reported Speech', start: 19, end: 24 },
    { stageOrder: 5, label: 'Stage 5 — Paragraph Cohesion', start: 25, end: 30 },
    { stageOrder: 6, label: 'Stage 6 — Tone + Argument + Impact', start: 31, end: 36 },
  ],
  'basic-public-speaking': [
    { stageOrder: 1, label: 'Stage 1 — Comfort + Routine', start: 1, end: 6 },
    { stageOrder: 2, label: 'Stage 2 — Clear Speaking', start: 7, end: 12 },
    { stageOrder: 3, label: 'Stage 3 — Describe + Show & Tell', start: 13, end: 18 },
    { stageOrder: 4, label: 'Stage 4 — Mini Talks + Q&A', start: 19, end: 24 },
    { stageOrder: 5, label: 'Stage 5 — Story Basics', start: 25, end: 30 },
    { stageOrder: 6, label: 'Stage 6 — Presentation Readiness', start: 31, end: 36 },
  ],
  'advanced-public-speaking': [
    { stageOrder: 1, label: 'Stage 1 — Presence + Engagement', start: 1, end: 6 },
    { stageOrder: 2, label: 'Stage 2 — Structure + Supporting Details', start: 7, end: 12 },
    { stageOrder: 3, label: 'Stage 3 — Story Performance', start: 13, end: 18 },
    { stageOrder: 4, label: 'Stage 4 — Impromptu + Q&A', start: 19, end: 24 },
    { stageOrder: 5, label: 'Stage 5 — Persuasion + Debate', start: 25, end: 30 },
    { stageOrder: 6, label: 'Stage 6 — Presentation Mastery', start: 31, end: 36 },
  ],
};

const resolveStageByLessonNumber = (
  courseId: CourseId,
  lessonNumber: number | null | undefined,
): StageDefinition | null => {
  if (!lessonNumber) return null;
  const stages = STAGE_DEFINITIONS_BY_COURSE[courseId];
  if (!stages) return null;
  return stages.find((stage) => lessonNumber >= stage.start && lessonNumber <= stage.end) ?? null;
};

const buildSequentialTopics = (
  courseId: CourseId,
  courseLabel: string,
  area: CourseTopic['area'],
  labels: string[],
): CourseTopic[] =>
  labels.map((label, idx) => {
    const lessonNumber = idx + 1;
    const lesson = `Lesson-${lessonNumber}`;
    const stage = resolveStageByLessonNumber(courseId, lessonNumber);
    return {
      id: makeTopicId(courseId, lesson),
      lesson,
      label,
      courseId,
      courseLabel,
      area,
      stageLabel: stage?.label ?? null,
      stageOrder: stage?.stageOrder ?? null,
    };
  });

type RubricType =
  | 'single_sound'
  | 'short_vowels'
  | 'sound_set'
  | 'digraph'
  | 'silent_letter'
  | 'vowel_team'
  | 'magic_e'
  | 'diphthong'
  | 'r_controlled'
  | 'alternate_vowel'
  | 'suffix_ending'
  | 'concept'
  | 'sentence_building'
  | 'usage_practice'
  | 'writing_editing'
  | 'confidence'
  | 'clarity'
  | 'structure'
  | 'expression'
  | 'rule'
  | 'revision';

const classifyRubricType = (courseId: CourseId, lesson?: string, id?: string): RubricType => {
  const raw = lesson || id || '';
  const num = extractLessonNumber(raw);

  if (courseId === 'phonics-foundations') {
    if (num != null && num >= 1 && num <= 26) return 'single_sound';
    if (num === 27) return 'short_vowels';
    return 'revision';
  }

  if (courseId === 'early-phonics') {
    if (num != null && num >= 1 && num <= 9) return 'sound_set';
    if (num === 10 || num === 20 || num === 41) return 'revision';
    if (num != null && (num === 11 || num === 12 || num === 13 || num === 18 || num === 19)) return 'digraph';
    if (num != null && (num === 16 || num === 17)) return 'silent_letter';
    if (num != null && num >= 22 && num <= 31) return 'vowel_team';
    if (num != null && num >= 32 && num <= 36) return 'magic_e';
    return 'rule';
  }

  if (courseId === 'advanced-phonics') {
    if (num != null && num >= 1 && num <= 4) return 'diphthong';
    if (num != null && num >= 5 && num <= 7) return 'r_controlled';
    if (num === 9 || num === 16) return 'suffix_ending';
    if (num === 10) return 'silent_letter';
    if (num != null && num >= 11 && num <= 15) return 'alternate_vowel';
    if (num != null && num >= 17) return 'revision';
    return 'rule';
  }

  if (courseId === 'basic-grammar' || courseId === 'advanced-grammar') {
    if (num == null) return 'revision';
    const mod = num % 6;
    if (mod === 0) return 'revision';
    if (mod === 1 || mod === 2) return 'concept';
    if (mod === 3) return 'sentence_building';
    if (mod === 4) return 'usage_practice';
    return 'writing_editing';
  }

  if (
    courseId === 'basic-public-speaking'
    || courseId === 'advanced-public-speaking'
  ) {
    if (num == null) return 'revision';
    const mod = num % 6;
    if (mod === 0) return 'revision';
    if (mod === 1 || mod === 2) return 'confidence';
    if (mod === 3) return 'clarity';
    if (mod === 4) return 'structure';
    return 'expression';
  }

  return 'revision';
};

const SUBSKILL_CHIPS_BY_RUBRIC: Record<RubricType, string[]> = {
  single_sound: [
    'letter recognition',
    'sound pronunciation',
    'initial sound spotting',
    'letter formation',
    'picture-word match',
  ],
  short_vowels: ['short vowel recognition', 'sound discrimination', 'CVC blending', 'CVC word reading', 'CVC spelling'],
  sound_set: ['sound recall', 'blending', 'segmenting', 'CVC word reading', 'simple dictation'],
  digraph: ['digraph recognition', 'sound pronunciation', 'word reading', 'spelling (digraph)', 'dictation'],
  silent_letter: ['spot silent letters', 'pronounce correctly', 'word reading', 'spelling pattern', 'dictation'],
  vowel_team: [
    'vowel team recognition',
    'sound pronunciation',
    'word reading',
    'spelling (vowel team)',
    'sound discrimination',
  ],
  magic_e: ['magic e rule', 'short vs long', 'word reading', 'spelling (magic e)', 'dictation'],
  diphthong: ['diphthong recognition', 'sound glide practice', 'word reading', 'spelling choice', 'sound discrimination'],
  r_controlled: [
    'bossy r recognition',
    'sound pronunciation',
    'word reading',
    'spelling (r-controlled)',
    'sound discrimination',
  ],
  alternate_vowel: ['alternate vowel recognition', 'sound choice', 'word reading', 'spelling', 'sound discrimination'],
  suffix_ending: ['ending pattern recognition', 'word building', 'word reading', 'spelling', 'dictation'],
  concept: ['identify rule', 'definition recall', 'label parts', 'spot examples', 'sort words'],
  sentence_building: ['make a sentence', 'expand sentence', 'word order', 'join sentences', 'use connectors'],
  usage_practice: ['choose correct form', 'fill blanks correctly', 'apply rule in sentence', 'explain choice', 'spot the error'],
  writing_editing: ['fix punctuation', 'correct grammar mistake', 'rewrite better sentence', 'fix run-on/fragment', 'improve clarity'],
  confidence: ['eye contact', 'posture', 'volume', 'calm start', 'speak without prompting'],
  clarity: ['speak clearly', 'slow pace', 'say full words', 'articulation', 'pause between ideas'],
  structure: ['topic sentence', 'sequence words', 'supporting details', 'stay on topic', 'conclusion'],
  expression: ['voice variety', 'gestures', 'facial expression', 'emphasis', 'pause for effect'],
  rule: ['rule spotting', 'apply in reading', 'apply in spelling', 'word sorting', 'explain rule'],
  revision: ['mixed practice', 'independent use', 'speed + accuracy', 'confidence', 'minimal teacher help'],
};

const CONFUSION_OPTIONS_BY_RUBRIC: Record<RubricType, string[]> = {
  single_sound: ['b vs d', 'p vs b', 'm vs n', 'u vs n', 'a vs e', 'i vs e'],
  short_vowels: ['a vs e', 'e vs i', 'i vs o', 'o vs u'],
  sound_set: ['b vs d', 'p vs b', 'm vs n', 'u vs n', 'a vs e', 'i vs e'],
  digraph: ['sh vs ch', 'th vs f', 'ph vs f', 'ck vs k'],
  silent_letter: [],
  vowel_team: ['ee vs ea', 'oa vs oe', 'oo: /oo/ vs /ʊ/', 'i_e vs igh'],
  magic_e: ['short vs long', 'i_e vs igh', 'oa vs oe'],
  diphthong: ['ai vs ay', 'oi vs oy', 'ou vs ow', 'au vs aw'],
  r_controlled: ['ar vs or', 'ir vs er', 'ur vs er'],
  alternate_vowel: ['a (cat) vs a (cake)', 'o (hot) vs o (go)', 'u (cup) vs u (rule)'],
  suffix_ending: ['/shun/ spellings', 'c vs ct ending'],
  concept: ['subject–verb agreement', 'tense confusion', 'articles a/an/the', 'prepositions', 'punctuation'],
  sentence_building: ['subject–verb agreement', 'tense confusion', 'articles a/an/the', 'prepositions', 'punctuation'],
  usage_practice: ['subject–verb agreement', 'tense confusion', 'articles a/an/the', 'prepositions', 'punctuation'],
  writing_editing: ['subject–verb agreement', 'tense confusion', 'articles a/an/the', 'prepositions', 'punctuation'],
  confidence: ['shy/low confidence', 'too soft voice', 'low eye contact', 'needs prompting', 'nervous'],
  clarity: ['too fast', 'mumbling', 'unclear speech', 'drops word endings', 'too soft voice'],
  structure: ['off-topic', 'missing details', 'no clear ending', 'rambling', 'forgets sequence'],
  expression: ['monotone voice', 'no pauses', 'flat expression', 'weak emphasis', 'too fast'],
  rule: ['soft c vs hard c', 'g vs j', 'double consonant rule'],
  revision: [],
};

const isRubricType = (value: any): value is RubricType =>
  typeof value === 'string' && value in SUBSKILL_CHIPS_BY_RUBRIC;

const GRAMMAR_BASIC_LABELS = [
  'Nouns: people, places, things',
  'Pronouns: he/she/they',
  'Make a simple sentence (noun + verb)',
  'Verb choice: is/are',
  'Fix sentence basics (caps + full stop)',
  'Revision: sentence foundations',
  'Verbs: action words',
  'Adjectives: describing words',
  'Add an adjective',
  'Articles: a/an/the',
  'Capital letters check',
  'Revision: meaning builders',
  'Prepositions: in/on/under',
  'Adverbs: how/when',
  'Add a preposition phrase',
  'Choose the correct preposition',
  'Edit for adverbs',
  'Revision: where/when/how',
  'Conjunctions: and/but/because',
  'Plurals: s/es',
  'Join two sentences',
  'Plural vs singular',
  'Fix run-on sentences',
  'Revision: longer sentences',
  'Question words: who/what/where',
  'Questions vs statements',
  'Question marks',
  'Exclamations: wow!/oh!',
  'Edit question sentences',
  'Revision: asking + punctuation',
  'Tenses: past/present/future',
  'Irregular verbs: go/went',
  'Time words in sentences',
  'Choose the correct tense',
  'Fix tense mistakes',
  'Revision: tenses capstone',
];

const GRAMMAR_ADVANCED_LABELS = [
  'Simple vs continuous tense',
  'Time clauses (when/while)',
  'Choose the correct tense',
  'Edit tense shifts',
  'Tense consistency in paragraphs',
  'Revision: tense control',
  'Perfect tenses (have/has/had)',
  'Present perfect vs past simple',
  'Modals: can/must/should',
  'Modal meaning & choice',
  'Edit modal sentences',
  'Revision: perfect + modals',
  'Clauses: independent/dependent',
  'Relative clauses: who/which/that',
  'Complex sentences',
  'Clause punctuation (comma)',
  'Fix fragments',
  'Revision: clauses',
  'Passive voice',
  'Active → passive',
  'Reported speech',
  'Reported speech tense shifts',
  'Edit for clarity (voice + speech)',
  'Revision: voice + speech',
  'Punctuation: commas/semicolons',
  'Transition words',
  'Paragraph structure',
  'Choose a transition',
  'Edit paragraph cohesion',
  'Revision: paragraphs',
  'Tone + formality',
  'Argument structure: claim/reason',
  'Evidence sentence',
  'Word choice for impact',
  'Counterargument',
  'Revision: capstone',
];

const SPEAKING_BASIC_LABELS = [
  'Confidence warm-up',
  'Eye contact + posture',
  'Speak loud enough',
  'Two-line introduction',
  'Smile + friendly voice',
  'Revision: comfort check',
  'Full sentences',
  'Slow pace',
  'Say full words (clear endings)',
  'Voice clarity',
  'Pauses between ideas',
  'Revision: clarity check',
  'Picture talk',
  '3 details about an object',
  'Senses words',
  'Simple gestures',
  'Emotion words',
  'Revision: describe and tell',
  'Answering questions',
  'One-minute talk',
  'Sequence words (first/next)',
  'Topic sentence + 2 details',
  'Voice variety',
  'Revision: Q&A',
  'Story: beginning-middle-end',
  'Describe a person/place',
  'Show & tell with props',
  'Emphasis on key words',
  'Small audience practice',
  'Revision: mini presentation',
  'Class presentation practice',
  'Speaking with a simple visual',
  'Handling mistakes calmly',
  'Final delivery practice',
  'Confidence reflection',
  'Revision: celebration',
];

const SPEAKING_ADVANCED_LABELS = [
  'Audience engagement',
  'Confident openings',
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

const TOPICS_BY_COURSE: Record<CourseId, CourseTopic[]> = {
  'phonics-foundations': [
    { lesson: 'Lesson-1', label: 's' },
    { lesson: 'Lesson-2', label: 'a' },
    { lesson: 'Lesson-3', label: 't' },
    { lesson: 'Lesson-4', label: 'i' },
    { lesson: 'Lesson-5', label: 'p' },
    { lesson: 'Lesson-6', label: 'n' },
    { lesson: 'Lesson-7', label: 'c' },
    { lesson: 'Lesson-8', label: 'k' },
    { lesson: 'Lesson-9', label: 'e' },
    { lesson: 'Lesson-10', label: 'h' },
    { lesson: 'Lesson-11', label: 'r' },
    { lesson: 'Lesson-12', label: 'm' },
    { lesson: 'Lesson-13', label: 'd' },
    { lesson: 'Lesson-14', label: 'g' },
    { lesson: 'Lesson-15', label: 'o' },
    { lesson: 'Lesson-16', label: 'u' },
    { lesson: 'Lesson-17', label: 'l' },
    { lesson: 'Lesson-18', label: 'f' },
    { lesson: 'Lesson-19', label: 'b' },
    { lesson: 'Lesson-20', label: 'j' },
    { lesson: 'Lesson-21', label: 'z' },
    { lesson: 'Lesson-22', label: 'w' },
    { lesson: 'Lesson-23', label: 'v' },
    { lesson: 'Lesson-24', label: 'y' },
    { lesson: 'Lesson-25', label: 'x' },
    { lesson: 'Lesson-26', label: 'q' },
    { lesson: 'Lesson-27', label: 'a e i o u' },
    { lesson: 'Lesson-28', label: 'all letter sounds' },
    { lesson: 'Lesson-29', label: 'revision' },
    { lesson: 'Lesson-30', label: 'revision' },
  ].map((topic) => ({
    ...topic,
    id: makeTopicId('phonics-foundations', topic.lesson),
    courseId: 'phonics-foundations',
    courseLabel: 'Phonics Foundations',
    area: 'phonics',
    stageLabel: resolveStageByLessonNumber(
      'phonics-foundations',
      extractLessonNumber(topic.lesson),
    )?.label ?? null,
    stageOrder: resolveStageByLessonNumber(
      'phonics-foundations',
      extractLessonNumber(topic.lesson),
    )?.stageOrder ?? null,
  })),
  'early-phonics': [
    { lesson: 'Lesson 1', label: 's a t' },
    { lesson: 'Lesson-2', label: 'i p n' },
    { lesson: 'Lesson-3', label: 'c and k' },
    { lesson: 'Lesson-4', label: 'e  h  r' },
    { lesson: 'Lesson-5', label: 'm d g' },
    { lesson: 'Lesson-6', label: 'o u l' },
    { lesson: 'Lesson-7', label: 'f b j' },
    { lesson: 'Lesson-8', label: 'z w v' },
    { lesson: 'Lesson-9', label: 'y x q' },
    { lesson: 'Lesson-10', label: 'short vowels' },
    { lesson: 'Lesson-11', label: 'sh' },
    { lesson: 'Lesson-12', label: 'ch, tch' },
    { lesson: 'Lesson-13', label: 'th, TH' },
    { lesson: 'Lesson-14', label: 'ck' },
    { lesson: 'Lesson-15', label: 'ng, mb' },
    { lesson: 'Lesson-16', label: 'kn' },
    { lesson: 'Lesson-17', label: 'wr' },
    { lesson: 'Lesson-18', label: 'wh' },
    { lesson: 'Lesson-19', label: 'ph, gh' },
    { lesson: 'Lesson-20', label: 'revision of digraphs' },
    { lesson: 'Lesson-21', label: 'Floss rule' },
    { lesson: 'Lesson-22', label: 'ai' },
    { lesson: 'Lesson-23', label: 'ee' },
    { lesson: 'Lesson-24', label: 'ea' },
    { lesson: 'Lesson-25', label: 'ie' },
    { lesson: 'Lesson-26', label: 'oa' },
    { lesson: 'Lesson-27', label: 'oo' },
    { lesson: 'Lesson-28', label: 'oe' },
    { lesson: 'Lesson-29', label: 'ui' },
    { lesson: 'Lesson-30', label: 'ue' },
    { lesson: 'Lesson-31', label: 'igh' },
    { lesson: 'Lesson-32', label: 'a_e' },
    { lesson: 'Lesson-33', label: 'e_e' },
    { lesson: 'Lesson-34', label: 'i_e' },
    { lesson: 'Lesson-35', label: 'o_e' },
    { lesson: 'Lesson-36', label: 'u_e' },
    { lesson: 'Lesson-37', label: 'Rabbit rule' },
    { lesson: 'Lesson-38', label: 'monster le' },
    { lesson: 'Lesson-39', label: 'soft c' },
    { lesson: 'Lesson-40', label: 'hard g' },
    { lesson: 'Lesson-41', label: 'Revision' },
  ].map((topic) => ({
    ...topic,
    id: makeTopicId('early-phonics', topic.lesson),
    courseId: 'early-phonics',
    courseLabel: 'Early Phonics',
    area: 'phonics',
    stageLabel: resolveStageByLessonNumber(
      'early-phonics',
      extractLessonNumber(topic.lesson),
    )?.label ?? null,
    stageOrder: resolveStageByLessonNumber(
      'early-phonics',
      extractLessonNumber(topic.lesson),
    )?.stageOrder ?? null,
  })),
  'advanced-phonics': [
    { lesson: 'Lesson 1', label: 'ai, ay' },
    { lesson: 'Lesson-2', label: 'oi, oy' },
    { lesson: 'Lesson-3', label: 'ou, ow' },
    { lesson: 'Lesson-4', label: 'au, aw' },
    { lesson: 'Lesson-5', label: 'bossy ar' },
    { lesson: 'Lesson-6', label: 'bossy or' },
    { lesson: 'Lesson-7', label: 'ir, ur, er' },
    { lesson: 'Lesson-8', label: '3  j sounds' },
    { lesson: 'Lesson-9', label: 'shun sounds' },
    { lesson: 'Lesson-10', label: 'silent letters' },
    { lesson: 'Lesson-11', label: 'alternate a' },
    { lesson: 'Lesson-12', label: 'alternate e' },
    { lesson: 'Lesson-13', label: 'alternate i' },
    { lesson: 'Lesson-14', label: 'alternate o' },
    { lesson: 'Lesson-15', label: 'alternate u' },
    { lesson: 'Lesson-16', label: 'c at the end, ct sound' },
    { lesson: 'Lesson-17', label: 'revision' },
    { lesson: 'Lesson-18', label: 'revision' },
    { lesson: 'Lesson-19', label: 'revision' },
    { lesson: 'Lesson-20', label: 'revision' },
  ].map((topic) => ({
    ...topic,
    id: makeTopicId('advanced-phonics', topic.lesson),
    courseId: 'advanced-phonics',
    courseLabel: 'Advanced Phonics',
    area: 'phonics',
    stageLabel: resolveStageByLessonNumber(
      'advanced-phonics',
      extractLessonNumber(topic.lesson),
    )?.label ?? null,
    stageOrder: resolveStageByLessonNumber(
      'advanced-phonics',
      extractLessonNumber(topic.lesson),
    )?.stageOrder ?? null,
  })),
  'basic-grammar': buildSequentialTopics('basic-grammar', 'Basic Grammar', 'grammar', GRAMMAR_BASIC_LABELS),
  'advanced-grammar': buildSequentialTopics('advanced-grammar', 'Advanced Grammar', 'grammar', GRAMMAR_ADVANCED_LABELS),
  'basic-public-speaking': buildSequentialTopics(
    'basic-public-speaking',
    'Public Speaking (Basic)',
    'speaking',
    SPEAKING_BASIC_LABELS,
  ),
  'advanced-public-speaking': buildSequentialTopics(
    'advanced-public-speaking',
    'Public Speaking (Advanced)',
    'speaking',
    SPEAKING_ADVANCED_LABELS,
  ),
};

const COURSE_LABEL_BY_ID = COURSE_DEFINITIONS.reduce<Record<CourseId, string>>(
  (acc, course) => {
    acc[course.id] = course.label;
    return acc;
  },
  {
    'phonics-foundations': 'Phonics Foundations',
    'early-phonics': 'Early Phonics',
    'advanced-phonics': 'Advanced Phonics',
    'basic-grammar': 'Basic Grammar',
    'advanced-grammar': 'Advanced Grammar',
    'basic-public-speaking': 'Public Speaking (Basic)',
    'advanced-public-speaking': 'Public Speaking (Advanced)',
  },
);

const normalizeCourseId = (value?: string): CourseId | null => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'phonics-foundations' || normalized === 'phonics foundation') return 'phonics-foundations';
  if (normalized === 'phonics-foundation' || normalized === 'phonics foundations') return 'phonics-foundations';
  if (normalized === 'foundational' || normalized === 'foundational course') return 'phonics-foundations';
  if (normalized === 'early-phonics' || normalized === 'early phonics') return 'early-phonics';
  if (normalized === 'phonics-early' || normalized === 'early') return 'early-phonics';
  if (normalized === 'advanced-phonics' || normalized === 'advanced phonics') return 'advanced-phonics';
  if (normalized === 'phonics-advanced' || normalized === 'advanced') return 'advanced-phonics';

  if (normalized === 'basic-grammar' || normalized === 'grammar-essentials' || normalized === 'grammar essentials') {
    return 'basic-grammar';
  }
  if (normalized === 'advanced-grammar' || normalized === 'grammar-mastery' || normalized === 'grammar mastery') {
    return 'advanced-grammar';
  }
  if (normalized.includes('grammar')) {
    if (normalized.includes('intermediate')) return 'basic-grammar';
    if (normalized.includes('advanced') || normalized.includes('mastery')) return 'advanced-grammar';
    return 'basic-grammar';
  }

  if (
    normalized === 'basic-public-speaking'
    || normalized === 'public-speaking-basic'
    || normalized === 'public-speaking-foundations'
  ) {
    return 'basic-public-speaking';
  }
  if (
    normalized === 'advanced-public-speaking'
    || normalized === 'public-speaking-advanced'
    || normalized === 'public-speaking-excellence'
  ) {
    return 'advanced-public-speaking';
  }
  if (normalized.includes('speaking') || normalized.includes('speech') || normalized.includes('public')) {
    if (normalized.includes('intermediate')) return 'basic-public-speaking';
    if (normalized.includes('advanced') || normalized.includes('excellence')) return 'advanced-public-speaking';
    return 'basic-public-speaking';
  }
  return null;
};

const normalizeCourseName = (value?: string): CourseId | null =>
  normalizeCourseId(value);

const areaForCourseId = (courseId: CourseId): CourseTopic['area'] => {
  if (courseId.includes('grammar')) return 'grammar';
  if (courseId.includes('public-speaking')) return 'speaking';
  return 'phonics';
};

const normalizeTopicText = (value?: string): string =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const toggleInArray = (value: string, items: string[], max?: number): string[] => {
  if (items.includes(value)) {
    return items.filter((item) => item !== value);
  }
  if (typeof max === 'number' && items.length >= max) return items;
  return [...items, value];
};

const labelizeLevel = (value: string): string =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const RUBRIC_LABEL: Record<RubricType, string> = {
  single_sound: 'Single sound',
  short_vowels: 'Short vowels',
  sound_set: 'Sound set',
  digraph: 'Digraph / pattern',
  silent_letter: 'Silent letters',
  vowel_team: 'Vowel teams',
  magic_e: 'Magic E',
  diphthong: 'Diphthongs',
  r_controlled: 'Bossy R',
  alternate_vowel: 'Alternate vowels',
  suffix_ending: 'Endings / suffix',
  concept: 'Concept',
  sentence_building: 'Sentence building',
  usage_practice: 'Usage practice',
  writing_editing: 'Writing and editing',
  confidence: 'Confidence',
  clarity: 'Clarity',
  structure: 'Structure',
  expression: 'Expression',
  rule: 'Rule',
  revision: 'Revision',
};

const MASTERY_LEVELS: { key: string; pct: number }[] = [
  { key: 'not_started', pct: 0 },
  { key: 'emerging', pct: 25 },
  { key: 'developing', pct: 50 },
  { key: 'proficient', pct: 75 },
  { key: 'mastered', pct: 100 },
];

const MASTERY_KEYS = new Set(MASTERY_LEVELS.map((l) => l.key));

const normalizeMasteryKey = (value: any): string => {
  const raw = String(value ?? '').toLowerCase().trim();
  if (MASTERY_KEYS.has(raw)) return raw;
  if (raw === 'not started') return 'not_started';

  const num =
    typeof value === 'number' && Number.isFinite(value)
      ? value
      : Number.isFinite(Number(raw))
        ? Number(raw)
        : null;
  if (num == null) return 'not_started';

  let best = MASTERY_LEVELS[0];
  let bestDiff = Math.abs(num - best.pct);
  for (const level of MASTERY_LEVELS) {
    const diff = Math.abs(num - level.pct);
    if (diff < bestDiff) {
      best = level;
      bestDiff = diff;
    }
  }
  return best.key;
};

type ChipTone = 'blue' | 'green' | 'indigo' | 'amber' | 'slate';
type ChipSize = 'xs' | 'sm';

const CHIP_TONES: Record<ChipTone, { base: string; active: string; ring: string }> = {
  blue: {
    base: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    active: 'border-blue-600 bg-blue-600 text-white shadow-sm',
    ring: 'focus-visible:ring-blue-200',
  },
  green: {
    base: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    active: 'border-emerald-600 bg-emerald-600 text-white shadow-sm',
    ring: 'focus-visible:ring-emerald-200',
  },
  indigo: {
    base: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    active: 'border-indigo-600 bg-indigo-600 text-white shadow-sm',
    ring: 'focus-visible:ring-indigo-200',
  },
  amber: {
    base: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    active: 'border-amber-600 bg-amber-600 text-white shadow-sm',
    ring: 'focus-visible:ring-amber-200',
  },
  slate: {
    base: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    active: 'border-slate-900 bg-slate-900 text-white shadow-sm',
    ring: 'focus-visible:ring-slate-200',
  },
};

const CHIP_SIZES: Record<ChipSize, string> = {
  xs: 'px-2 py-0.5 text-[11px]',
  sm: 'px-2.5 py-1 text-xs',
};

const ChipButton = ({
  label,
  active = false,
  onClick,
  disabled,
  tone = 'slate',
  size = 'sm',
  ariaPressed,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  tone?: ChipTone;
  size?: ChipSize;
  ariaPressed?: boolean;
}) => {
  const styles = CHIP_TONES[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={ariaPressed ?? active}
      className={`rounded-full border font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 ${
        CHIP_SIZES[size]
      } ${active ? styles.active : styles.base} ${styles.ring} disabled:opacity-60`}
    >
      {label}
    </button>
  );
};

const StudentTopicProgressEditor: React.FC<StudentTopicProgressEditorProps> = ({
  kidId,
  kidName,
  onSaveAndBack,
}) => {
  const { config, loading: configLoading, error: configError } =
    useProgressPicklists();

  const {
    topics: existingTopics,
    loading: topicsLoading,
    error: topicsError,
  } = useKidTopicProgress(kidId);

  const [curriculumTopics, setCurriculumTopics] = useState<any[]>([]);
  const [curriculumLoading, setCurriculumLoading] = useState(false);
  const [curriculumError, setCurriculumError] = useState<string | null>(null);

  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<CourseId | ''>('phonics-foundations');
  const [courseOptions, setCourseOptions] = useState<CourseDefinition[]>(COURSE_DEFINITIONS);
  const [courseManuallySelected, setCourseManuallySelected] = useState(false);
  const [checks, setChecks] = useState<Record<string, string>>({
    recognise: 'not_started',
    say: 'not_started',
    read: 'not_started',
    write: 'not_started',
  });
  const [selectedSubskills, setSelectedSubskills] = useState<string[]>([]);
  const [confusions, setConfusions] = useState<string[]>([]);
  const [mastery, setMastery] = useState<string>('not_started');
  const [scoreBand, setScoreBand] = useState<string>('');
  const [teacherRemark, setTeacherRemark] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [baseline, setBaseline] = useState<string>('');
  const [checksTouched, setChecksTouched] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const resolvedCourseOptions = useMemo<CourseDefinition[]>(() => courseOptions, [courseOptions]);

  useEffect(() => {
    if (!selectedCourseId && resolvedCourseOptions.length > 0 && !courseManuallySelected) {
      setSelectedCourseId(resolvedCourseOptions[0].id);
    }
  }, [selectedCourseId, resolvedCourseOptions, courseManuallySelected]);

  useEffect(() => {
    let active = true;
    const loadCurriculum = async () => {
      setCurriculumLoading(true);
      setCurriculumError(null);
      try {
        const snap = await getDoc(doc(db, 'config', 'curriculumTopics'));
        if (!active) return;
        const data = snap.exists() ? (snap.data() as any) : {};
        setCurriculumTopics(Array.isArray(data?.topics) ? data.topics : []);
      } catch (err: any) {
        if (!active) return;
        setCurriculumError(err?.message || 'Unable to load curriculum.');
        setCurriculumTopics([]);
      } finally {
        if (active) setCurriculumLoading(false);
      }
    };
    loadCurriculum();
    return () => {
      active = false;
    };
  }, []);

  const courseTopics = useMemo<CourseTopic[]>(() => {
    if (!selectedCourseId) return [];
    const courseLabel = COURSE_LABEL_BY_ID[selectedCourseId];
    const topicsForCourse = curriculumTopics
      .filter((t) => normalizeCourseId(String(t?.courseId ?? t?.course)) === selectedCourseId)
      .map((t) => {
        const lesson = String(t?.lesson ?? t?.lessonNumber ?? t?.lessonNo ?? '');
        const label = String(t?.label ?? t?.topic ?? t?.topicName ?? '');
        const displayTitle = String(t?.displayTitle ?? '').trim();
        const areaRaw = String(t?.area ?? '').toLowerCase();
        const topicArea: CourseTopic['area'] =
          areaRaw === 'grammar' ? 'grammar' : areaRaw === 'speaking' ? 'speaking' : areaForCourseId(selectedCourseId);
        const stageLabelFromDb = typeof t?.stageLabel === 'string' ? t.stageLabel : null;
        const stageOrderFromDb = typeof t?.stageOrder === 'number' ? t.stageOrder : null;
        const computedStage = resolveStageByLessonNumber(
          selectedCourseId,
          extractLessonNumber(lesson, String(t?.id ?? '')),
        );
        const rubricRaw = t?.rubricType;
        const computedRubric = isRubricType(rubricRaw)
          ? rubricRaw
          : classifyRubricType(selectedCourseId, lesson, String(t?.id ?? ''));
        const subskillChipsFromDb = Array.isArray(t?.subskillChips)
          ? t.subskillChips.filter((chip: unknown) => typeof chip === 'string')
          : [];
        const confusionFromDb = Array.isArray(t?.confusionOptions)
          ? t.confusionOptions.filter((chip: unknown) => typeof chip === 'string')
          : [];
        const finalSubskills = subskillChipsFromDb.length > 0
          ? subskillChipsFromDb
          : (SUBSKILL_CHIPS_BY_RUBRIC[computedRubric] ?? []);
        const finalConfusions = confusionFromDb.length > 0
          ? confusionFromDb
          : (CONFUSION_OPTIONS_BY_RUBRIC[computedRubric] ?? []);
        const order = Number.isFinite(Number(t?.order))
          ? Number(t.order)
          : extractLessonNumber(lesson);
        return {
          id: String(t?.id ?? makeTopicId(selectedCourseId, lesson)),
          lesson,
          label,
          displayTitle: displayTitle || (lesson ? `${lesson} — ${label}` : label),
          order: order ?? null,
          stageLabel: stageLabelFromDb ?? computedStage?.label ?? null,
          stageOrder: stageOrderFromDb ?? computedStage?.stageOrder ?? null,
          rubricType: computedRubric,
          subskillChips: finalSubskills,
          confusionOptions: finalConfusions,
          courseId: selectedCourseId,
          courseLabel,
          area: topicArea,
        } as CourseTopic;
      });

    if (topicsForCourse.length > 0) {
      return topicsForCourse.sort((a, b) => {
        const aOrder = a.order ?? extractLessonNumber(a.lesson) ?? null;
        const bOrder = b.order ?? extractLessonNumber(b.lesson) ?? null;
        if (aOrder !== null && bOrder !== null && aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        if (aOrder !== null && bOrder === null) return -1;
        if (aOrder === null && bOrder !== null) return 1;
        return a.lesson.localeCompare(b.lesson);
      });
    }

    const fallbackTopics = TOPICS_BY_COURSE[selectedCourseId] || [];
    return fallbackTopics.map((topic) => {
      const computedRubric = classifyRubricType(selectedCourseId, topic.lesson, topic.id);
      return {
        ...topic,
        rubricType: computedRubric,
        subskillChips: SUBSKILL_CHIPS_BY_RUBRIC[computedRubric] ?? [],
        confusionOptions: CONFUSION_OPTIONS_BY_RUBRIC[computedRubric] ?? [],
      };
    });
  }, [curriculumTopics, selectedCourseId]);

  const selectedTopicDef: CourseTopic | undefined = useMemo(
    () => courseTopics.find((t) => t.id === selectedTopicId),
    [courseTopics, selectedTopicId],
  );

  const topicGroups = useMemo(() => {
    if (courseTopics.length === 0) return [];
    const map = new Map<string, { label: string; order: number; topics: CourseTopic[] }>();
    courseTopics.forEach((topic) => {
      const order = typeof topic.stageOrder === 'number' ? topic.stageOrder : 999;
      const label = topic.stageLabel || 'Lessons';
      const key = `${order}__${label}`;
      const entry = map.get(key);
      if (entry) entry.topics.push(topic);
      else map.set(key, { label, order, topics: [topic] });
    });
    return Array.from(map.values()).sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.label.localeCompare(b.label);
    });
  }, [courseTopics]);

  // Load student courses
  useEffect(() => {
    let active = true;
    const loadCourses = async () => {
      try {
        const studentRef = doc(db, 'students', kidId);
        const snap = await getDoc(studentRef);
        if (!active) return;
        if (snap.exists()) {
          const data = snap.data() as any;
          const explicitIds = [
            ...(Array.isArray(data.courseIds) ? data.courseIds : []),
            ...(data.courseId ? [data.courseId] : []),
          ]
            .map((id: string) => normalizeCourseId(String(id)))
            .filter(Boolean) as CourseId[];

          const nameSources = [
            ...(Array.isArray(data.courseNames) ? data.courseNames : []),
            ...(Array.isArray(data.courses) ? data.courses : []),
            ...(data.courseName ? [data.courseName] : []),
          ]
            .map((name: string) => normalizeCourseName(String(name)))
            .filter(Boolean) as CourseId[];

          const uniqueIds = Array.from(new Set([...explicitIds, ...nameSources]));
          const normalizedActive = normalizeCourseId(String(data.activeCourseId || ''));
          if (uniqueIds.length > 0) {
            const options = COURSE_DEFINITIONS.filter((c) => uniqueIds.includes(c.id));
            const defaultCourse = (normalizedActive && uniqueIds.includes(normalizedActive))
              ? normalizedActive
              : uniqueIds[0];
            setCourseOptions(options);
            setSelectedCourseId((prev) => (courseManuallySelected ? prev : (defaultCourse || prev || options[0]?.id || '')));
          } else {
            setCourseOptions(COURSE_DEFINITIONS);
            setSelectedCourseId((prev) => (courseManuallySelected ? prev : prev || 'phonics-foundations'));
          }
        } else {
          setCourseOptions(COURSE_DEFINITIONS);
          setSelectedCourseId((prev) => (courseManuallySelected ? prev : prev || 'phonics-foundations'));
        }
      } catch {
        if (!active) return;
        setCourseOptions(COURSE_DEFINITIONS);
        setSelectedCourseId((prev) => (courseManuallySelected ? prev : prev || 'phonics-foundations'));
      }
    };

    if (kidId) {
      loadCourses();
    }

    return () => {
      active = false;
    };
  }, [kidId, courseManuallySelected]);

  // When course changes, pick first topic by default
  useEffect(() => {
    if (!selectedCourseId) return;
    if (!selectedTopicId && courseTopics.length > 0) {
      setSelectedTopicId(courseTopics[0].id);
    }
    if (selectedTopicId && courseTopics.length > 0) {
      const exists = courseTopics.some((t) => t.id === selectedTopicId);
      if (!exists) {
        setSelectedTopicId(courseTopics[0].id);
      }
    }
  }, [selectedCourseId, selectedTopicId, courseTopics]);

  // When topic changes, load existing progress (if any) or reset form
  useEffect(() => {
    if (!selectedTopicId) return;

    let existing: KidTopicProgress | undefined = existingTopics.find(
      (t) => t.id === selectedTopicId,
    );

    if (!existing && selectedTopicDef) {
      const fallbackLabels = [
        selectedTopicDef.displayTitle,
        `${selectedTopicDef.lesson} — ${selectedTopicDef.label}`,
      ].filter(Boolean) as string[];
      const fallbackKeys = fallbackLabels.map((label) => normalizeTopicText(label));
      existing = existingTopics.find((t) => {
        const raw = String((t as any)?.topicName ?? (t as any)?.label ?? (t as any)?.topicLabel ?? '');
        const key = normalizeTopicText(raw);
        return key.length > 0 && fallbackKeys.includes(key);
      });
    }

    if (existing) {
      const existingMastery =
        (existing as any).masteryKey ?? (existing as any).mastery ?? 'not_started';
      setMastery(normalizeMasteryKey(existingMastery));
      setScoreBand(existing.scoreBand || '');
      setTeacherRemark(existing.teacherRemark || '');
      const existingChecks = (existing as any).checks ?? {};
      setChecks({
        recognise: existingChecks?.recognise ?? 'not_started',
        say: existingChecks?.say ?? 'not_started',
        read: existingChecks?.read ?? 'not_started',
        write: existingChecks?.write ?? 'not_started',
      });
      setChecksTouched(false);
    } else {
      setMastery('not_started');
      setScoreBand('');
      setTeacherRemark('');
      setChecks({
        recognise: 'not_started',
        say: 'not_started',
        read: 'not_started',
        write: 'not_started',
      });
      setChecksTouched(false);
    }

    setSaveMessage(null);
    const allowedSubskills = new Set((selectedTopicDef?.subskillChips ?? []) as string[]);
    const allowedConfusions = new Set((selectedTopicDef?.confusionOptions ?? []) as string[]);
    const rawSelectedSubskills = existing && Array.isArray((existing as any).selectedSubskills)
      ? (existing as any).selectedSubskills.filter((item: unknown) => typeof item === 'string')
      : [];
    const rawConfusions = existing && Array.isArray((existing as any).confusions)
      ? (existing as any).confusions.filter((item: unknown) => typeof item === 'string')
      : [];
    const filteredSubskills = allowedSubskills.size > 0
      ? rawSelectedSubskills.filter((s: string) => allowedSubskills.has(s)).slice(0, 3)
      : rawSelectedSubskills.slice(0, 3);
    const filteredConfusions = allowedConfusions.size > 0
      ? rawConfusions.filter((s: string) => allowedConfusions.has(s))
      : rawConfusions;
    setSelectedSubskills(filteredSubskills);
    setConfusions(filteredConfusions);

    const baselineMastery = existing
      ? normalizeMasteryKey((existing as any).masteryKey ?? (existing as any).mastery)
      : 'not_started';
    const snapshot = JSON.stringify({
      mastery: baselineMastery,
      scoreBand: existing ? (existing as any).scoreBand ?? '' : '',
      checks: existing
        ? {
            recognise: (existing as any).checks?.recognise ?? 'not_started',
            say: (existing as any).checks?.say ?? 'not_started',
            read: (existing as any).checks?.read ?? 'not_started',
            write: (existing as any).checks?.write ?? 'not_started',
          }
        : {
            recognise: 'not_started',
            say: 'not_started',
            read: 'not_started',
            write: 'not_started',
          },
      selectedSubskills: [...filteredSubskills].sort(),
      confusions: [...filteredConfusions].sort(),
      teacherRemark: existing ? (existing as any).teacherRemark ?? '' : '',
    });
    setBaseline(snapshot);
  }, [selectedTopicId, existingTopics, selectedTopicDef]);

  const handleSave = async (): Promise<boolean> => {
    if (!kidId || !selectedTopicId || !selectedTopicDef) return false;

    try {
      setSaving(true);
      setSaveMessage(null);

      const ref = doc(db, 'students', kidId, 'progress', selectedTopicId);

      const topicDisplayTitle =
        selectedTopicDef.displayTitle ||
        `${selectedTopicDef.lesson} — ${selectedTopicDef.label}`;

      await setDoc(
        ref,
        {
          topicName: topicDisplayTitle,
          area: selectedTopicDef.area,
          courseId: selectedCourseId || null,
          courseLabel: selectedCourseId ? COURSE_LABEL_BY_ID[selectedCourseId] : null,
          mastery: mastery || 'not_started',
          scoreBand: scoreBand || null,
          checks,
          selectedSubskills,
          confusions,
          teacherRemark: teacherRemark || null,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      setSaveMessage('Progress saved.');
      setLastSavedAt(Date.now());
      setBaseline(
        JSON.stringify({
          mastery,
          scoreBand,
          checks,
          selectedSubskills: [...selectedSubskills].sort(),
          confusions: [...confusions].sort(),
          teacherRemark,
        }),
      );
      return true;
    } catch (err: any) {
      setSaveMessage(
        err?.message || 'Could not save progress. Please try again.',
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndBack = async () => {
    const ok = await handleSave();
    if (ok && onSaveAndBack) onSaveAndBack();
  };

  const handleSaveAndNext = async () => {
    const ok = await handleSave();
    if (!ok) return;
    const idx = courseTopics.findIndex((t) => t.id === selectedTopicId);
    if (idx >= 0 && idx < courseTopics.length - 1) {
      setSelectedTopicId(courseTopics[idx + 1].id);
    }
  };

  const disabled =
    topicsLoading || curriculumLoading || !selectedCourseId || courseTopics.length === 0;
  const DEFAULT_MASTERY_LEVELS = [
    'not_started',
    'emerging',
    'developing',
    'proficient',
    'mastered',
  ];
  const checkLevels =
    Array.isArray(config?.mastery) && config.mastery.length > 0
      ? config.mastery
      : DEFAULT_MASTERY_LEVELS;
  const subskillChips = selectedTopicDef?.subskillChips ?? [];
  const confusionOptions = selectedTopicDef?.confusionOptions ?? [];
  const showChecks = selectedTopicDef?.area === 'phonics';
  const containerClass = 'rounded-lg border border-slate-200 bg-white text-sm space-y-2 p-3';
  const cardBase = 'rounded-xl border border-slate-200 p-3';
  const snapshotNow = JSON.stringify({
    mastery,
    scoreBand,
    checks,
    selectedSubskills: [...selectedSubskills].sort(),
    confusions: [...confusions].sort(),
    teacherRemark,
  });

  let debugSection: React.ReactNode = null;
  if (import.meta.env.DEV) {
    debugSection = (
      <details className="text-[10px] text-slate-500">
        <summary className="cursor-pointer">Debug</summary>
        <div className="mt-1">
          selectedCourseId={selectedCourseId || "''"} · selectedTopicId={selectedTopicId || "''"} ·
          courseTopics={courseTopics.length} · curriculumTopics={curriculumTopics.length} ·
          curriculumLoading={String(curriculumLoading)} · curriculumError={curriculumError || 'none'}
        </div>
      </details>
    );
  }
  const isDirty = baseline !== '' && snapshotNow !== baseline;
  const setChecksAll = (level: string) => {
    setChecksTouched(true);
    setChecks({
      recognise: level,
      say: level,
      read: level,
      write: level,
    });
  };

  useEffect(() => {
    if (!mastery) return;
    if (showChecks && !checksTouched) {
      setChecks({
        recognise: mastery,
        say: mastery,
        read: mastery,
        write: mastery,
      });
    }
  }, [mastery, showChecks, checksTouched]);

  const checksDifferFromMastery = showChecks
    ? Object.values(checks).some((value) => value !== mastery)
    : false;
  const hasAdvancedData = confusions.length > 0 || (showChecks && checksDifferFromMastery);
  const showAdvanced = advancedOpen || hasAdvancedData;
  const masteryStatus =
    mastery === 'proficient' || mastery === 'mastered' ? 'Completed' : 'In progress';

  return (
    <div className={containerClass}>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">
            Topic Progress — Quick Update
          </h2>
          {kidName && (
            <p className="text-xs text-slate-500">
              Updating progress for: {kidName}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {saving && <span className="text-xs text-slate-500">Saving…</span>}
          {!saving && saveMessage && (
            <span className="text-xs text-emerald-600">{saveMessage}</span>
          )}
        </div>
      </div>

      {configError && (
        <p className="text-xs text-red-600">
          Couldn&apos;t load picklists: {configError}
        </p>
      )}
      {topicsError && (
        <p className="text-xs text-red-600">
          Couldn&apos;t load existing progress: {topicsError}
        </p>
      )}
      {curriculumError && (
        <p className="text-xs text-red-600">
          Couldn&apos;t load curriculum: {curriculumError}
        </p>
      )}
      {debugSection}

      <div className={`${cardBase} bg-sky-50/60`}>
        <div className="text-xs font-semibold text-slate-700">Lesson</div>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
            Course
            <select
              className="h-9 rounded border border-slate-300 bg-white px-2 text-sm"
              value={selectedCourseId}
              onChange={(e) => {
                setCourseManuallySelected(true);
                setSelectedCourseId(e.target.value as CourseId);
              }}
              disabled={configLoading || topicsLoading || curriculumLoading}
            >
              <option value="" disabled>
                Select course
              </option>
              {resolvedCourseOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
            Topic
            <select
              className="h-9 rounded border border-slate-300 bg-white px-2 text-sm"
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              disabled={disabled}
            >
              {selectedTopicId === '' && courseTopics.length > 0 && (
                <option value="" disabled>
                  Select topic
                </option>
              )}
              {courseTopics.length === 0 && (
                <option value="">No topics configured</option>
              )}
              {topicGroups.map((group) => (
                <optgroup key={`${group.order}-${group.label}`} label={group.label}>
                  {group.topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.displayTitle || `${t.lesson} — ${t.label}`}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
        </div>
        {selectedTopicDef?.rubricType ? (
          <div className="mt-2 text-[11px] text-slate-600">
            Rubric: <span className="font-semibold">{RUBRIC_LABEL[selectedTopicDef.rubricType]}</span>
          </div>
        ) : null}
        {selectedTopicDef?.stageLabel ? (
          <div className="mt-2 text-[11px] text-slate-600">
            Stage:{' '}
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 font-semibold text-slate-700">
              {selectedTopicDef.stageLabel}
            </span>
          </div>
        ) : null}
      </div>

      <div className={`${cardBase} bg-emerald-50/60 space-y-3`}>
        <div className="text-xs font-semibold text-slate-700">Quick update</div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-xs font-medium text-slate-700">Mastery</div>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              {masteryStatus}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {checkLevels.map((m) => {
              const active = mastery === m;
              return (
                <ChipButton
                  key={m}
                  onClick={() => setMastery(m)}
                  disabled={disabled}
                  active={active}
                  tone="blue"
                  size="xs"
                  label={String(m).replace(/_/g, ' ')}
                />
              );
            })}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs font-medium text-slate-700">
            Subskills <span className="text-[11px] text-slate-500">(pick up to 3)</span>
          </div>
          {subskillChips.length === 0 ? (
            <div className="text-[11px] text-slate-500">No subskills listed for this lesson.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {subskillChips.map((chip) => {
                const active = selectedSubskills.includes(chip);
                return (
                  <ChipButton
                    key={chip}
                    onClick={() =>
                      setSelectedSubskills((prev) => toggleInArray(chip, prev, 3))
                    }
                    disabled={disabled}
                    active={active}
                    tone="indigo"
                    size="xs"
                    label={chip}
                  />
                );
              })}
            </div>
          )}
        </div>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
          Teacher remark
          <input
            type="text"
            className="h-9 rounded border border-slate-300 bg-white px-2 text-sm"
            placeholder="One-line note for parents"
            value={teacherRemark}
            onChange={(e) => setTeacherRemark(e.target.value)}
            disabled={disabled}
          />
        </label>

      </div>

      <details
        open={showAdvanced}
        onToggle={(e) => setAdvancedOpen((e.target as HTMLDetailsElement).open)}
        className="rounded-lg border border-slate-200 bg-white/70 px-3 py-2"
      >
        <summary className="cursor-pointer text-xs font-semibold text-slate-700">
          Advanced (optional)
        </summary>
        <div className="mt-3 space-y-3">
          {confusionOptions.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-700">Confusions (optional)</div>
              <div className="flex flex-wrap gap-2">
                {confusionOptions.map((chip) => {
                  const active = confusions.includes(chip);
                  return (
                    <ChipButton
                      key={chip}
                      onClick={() =>
                        setConfusions((prev) => toggleInArray(chip, prev))
                      }
                      disabled={disabled}
                      active={active}
                      tone="amber"
                      size="xs"
                      label={chip}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {showChecks && (
            <>
              <div className="text-xs font-semibold text-slate-700">Quick presets</div>
              <div className="flex flex-wrap gap-2">
                <ChipButton
                  label="Set checks = Mastery"
                  onClick={() => setChecksAll(mastery || 'not_started')}
                  disabled={disabled}
                  tone="slate"
                  size="xs"
                />
                {checkLevels.map((level) => (
                  <ChipButton
                    key={`preset-${level}`}
                    onClick={() => setChecksAll(level)}
                    disabled={disabled}
                    tone="slate"
                    size="xs"
                    label={`All ${labelizeLevel(level)}`}
                  />
                ))}
              </div>

              <div className="grid gap-2 md:grid-cols-4">
                {[
                  { key: 'recognise', label: 'Recognise' },
                  { key: 'say', label: 'Say' },
                  { key: 'read', label: 'Read' },
                  { key: 'write', label: 'Write/Spell' },
                ].map((check) => (
                  <div key={check.key} className="space-y-1">
                    <div className="text-[11px] font-medium text-slate-600">{check.label}</div>
                    <div className="flex flex-wrap gap-1">
                      {checkLevels.map((level) => {
                        const active = checks[check.key] === level;
                        return (
                          <ChipButton
                            key={`${check.key}-${level}`}
                            onClick={() => {
                              setChecksTouched(true);
                              setChecks((prev) => ({
                                ...prev,
                                [check.key]: level,
                              }));
                            }}
                            disabled={disabled}
                            active={active}
                            tone="indigo"
                            size="xs"
                            label={labelizeLevel(level)}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </details>

      <div className="sticky bottom-0 -mx-3 border-t border-slate-200 bg-white/80 px-3 py-2 backdrop-blur md:-mx-4 md:px-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-slate-600">
            {isDirty ? 'Unsaved changes' : 'All changes saved'}
            <span className="ml-2 text-slate-400">• Last saved: {lastSavedAt ? new Date(lastSavedAt).toLocaleString() : '—'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={disabled || saving || !selectedTopicId || !isDirty}
              className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            {onSaveAndBack ? (
              <button
                type="button"
                onClick={handleSaveAndBack}
                disabled={disabled || saving || !selectedTopicId || !isDirty}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {saving ? 'Saving…' : 'Save & Back'}
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleSaveAndNext}
              disabled={disabled || saving || !selectedTopicId || !isDirty}
              className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              {saving ? 'Saving…' : 'Save & Next Topic'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentTopicProgressEditor;
