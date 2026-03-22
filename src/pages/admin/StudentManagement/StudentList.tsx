import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  onSnapshot,
  collection,
  collectionGroup,
  query,
  orderBy,
  limit,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  where,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../../../lib/firebaseConfig';
import { Card } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Button } from '@components/ui/button';
import { toast } from '@components/hooks/use-toast';
import AssignCourseModal from './AssignCourseModal';
import AssignTeacherModal from './AssignTeacherModal';
import AssignLPModal from './AssignLPModal';
import { Student } from '../../../types/Student';
import { useEnrollmentsForStudents } from '../../../hooks/useData';
import { User } from '../../../types/User';
import { useAuthStore } from '../../../store/useAuthStore';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@components/ui/dialog';
import type { RescheduleCreditStatus } from '../../../services/rescheduleCredits';

const DEFAULT_PAGE_SIZE = 25;
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
type StudentSortField = 'student' | 'parents' | 'age' | 'grade' | 'status';
type SortDirection = 'asc' | 'desc';

const getClassSessionsCollection = () => collection(db, 'classSessions');

const COURSE_CATALOG_SYNC = [
  { id: 'phonics-foundations', title: 'Phonics Foundations', area: 'phonics', level: 'foundations' },
  { id: 'early-phonics', title: 'Early Phonics', area: 'phonics', level: 'early' },
  { id: 'advanced-phonics', title: 'Advanced Phonics', area: 'phonics', level: 'advanced' },
  { id: 'basic-grammar', title: 'Basic Grammar', area: 'grammar', level: 'basic' },
  { id: 'advanced-grammar', title: 'Advanced Grammar', area: 'grammar', level: 'advanced' },
  { id: 'basic-public-speaking', title: 'Public Speaking (Basic)', area: 'speaking', level: 'basic' },
  { id: 'advanced-public-speaking', title: 'Public Speaking (Advanced)', area: 'speaking', level: 'advanced' },
];

const buildDisplayTitleMap = (courseId: string, titles: string[]) =>
  titles.reduce<Record<string, string>>((acc, title, idx) => {
    const key = `${courseId}__lesson-${String(idx + 1).padStart(2, '0')}`;
    acc[key] = title;
    return acc;
  }, {});

const PHONICS_FOUNDATIONS_TITLES = [
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

const EARLY_PHONICS_TITLES = [
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

const ADVANCED_PHONICS_TITLES = [
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

const PHONICS_DISPLAY_TITLES = {
  ...buildDisplayTitleMap('phonics-foundations', PHONICS_FOUNDATIONS_TITLES),
  ...buildDisplayTitleMap('early-phonics', EARLY_PHONICS_TITLES),
  ...buildDisplayTitleMap('advanced-phonics', ADVANCED_PHONICS_TITLES),
};

const buildLessonTitles = (labels: string[]) =>
  labels.map((label, idx) => `Lesson ${idx + 1} — ${label}`);

type StageDefinition = {
  stageOrder: number;
  label: string;
  start: number;
  end: number;
};

const STAGE_DEFINITIONS_BY_COURSE: Record<string, StageDefinition[]> = {
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
  courseId: string,
  lessonNumber: number | null | undefined,
): StageDefinition | null => {
  if (!lessonNumber) return null;
  const stages = STAGE_DEFINITIONS_BY_COURSE[courseId];
  if (!stages) return null;
  return stages.find((stage) => lessonNumber >= stage.start && lessonNumber <= stage.end) ?? null;
};

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

const CURRICULUM_DISPLAY_TITLES = {
  ...PHONICS_DISPLAY_TITLES,
  ...buildDisplayTitleMap('basic-grammar', buildLessonTitles(GRAMMAR_BASIC_LABELS)),
  ...buildDisplayTitleMap('advanced-grammar', buildLessonTitles(GRAMMAR_ADVANCED_LABELS)),
  ...buildDisplayTitleMap('basic-public-speaking', buildLessonTitles(SPEAKING_BASIC_LABELS)),
  ...buildDisplayTitleMap('advanced-public-speaking', buildLessonTitles(SPEAKING_ADVANCED_LABELS)),
};

const buildSequentialTopics = (
  courseId: string,
  area: 'phonics' | 'grammar' | 'speaking',
  labels: string[],
) =>
  labels.map((label, idx) => {
    const lessonNumber = idx + 1;
    const stage = resolveStageByLessonNumber(courseId, lessonNumber);
    return {
      id: `${courseId}__lesson-${String(lessonNumber).padStart(2, '0')}`,
      courseId,
      area,
      lesson: `Lesson-${lessonNumber}`,
      label,
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

const extractLessonNumber = (lesson?: string, id?: string): number | null => {
  const raw = lesson || id || '';
  const match = /lesson[-_ ]*0*(\d+)/i.exec(raw);
  if (!match) return null;
  const num = Number(match[1]);
  return Number.isFinite(num) ? num : null;
};

const classifyRubricType = (courseId: string, lesson?: string, id?: string): RubricType => {
  const num = extractLessonNumber(lesson, id);
  if (courseId === 'phonics-foundations') {
    if (num != null && num >= 1 && num <= 26) return 'single_sound';
    if (num === 27) return 'short_vowels';
    return 'revision';
  }
  if (courseId === 'early-phonics') {
    if (num != null && num >= 1 && num <= 9) return 'sound_set';
    if (num === 10 || num === 20 || num === 41) return 'revision';
    if (num != null && ((num >= 11 && num <= 13) || num === 18 || num === 19)) return 'digraph';
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

type TopicOverride = {
  rubricType?: RubricType;
  subskillChips?: string[];
  confusionOptions?: string[];
};

const FOUNDATION_CONFUSIONS_BY_LETTER: Record<string, string[]> = {
  a: ['a vs e'],
  b: ['b vs d', 'b vs p'],
  c: ['c vs k'],
  d: ['b vs d'],
  e: ['e vs i', 'a vs e'],
  f: ['f vs v'],
  g: ['g vs j'],
  h: [],
  i: ['i vs e'],
  j: ['j vs g'],
  k: ['k vs c'],
  l: ['l vs r'],
  m: ['m vs n'],
  n: ['m vs n', 'n vs u'],
  o: ['o vs u'],
  p: ['p vs b'],
  q: ['q vs k'],
  r: ['r vs l'],
  s: ['s vs z'],
  t: ['t vs d'],
  u: ['u vs n'],
  v: ['v vs w'],
  w: ['v vs w'],
  x: ['x (/ks/) vs s'],
  y: ['y vs i'],
  z: ['z vs s'],
};

const buildGrammarOverride = (label: string): TopicOverride | null => {
  const l = label.toLowerCase();
  if (l.includes('revision')) {
    return {
      subskillChips: SUBSKILL_CHIPS_BY_RUBRIC.revision,
      confusionOptions: [],
    };
  }
  if (l.includes('noun')) {
    return {
      subskillChips: ['identify nouns', 'label nouns', 'sort nouns', 'use nouns in sentence', 'capitalize names'],
      confusionOptions: ['noun vs verb', 'noun vs pronoun', 'proper vs common'],
    };
  }
  if (l.includes('pronoun')) {
    return {
      subskillChips: ['choose pronoun', 'replace noun', 'subject pronouns', 'pronoun agreement', 'use pronouns in sentence'],
      confusionOptions: ['he vs she', 'him vs he', 'they vs he'],
    };
  }
  if (l.includes('irregular verb')) {
    return {
      subskillChips: ['irregular verb forms', 'choose correct form', 'use in sentence', 'read irregular verbs', 'spell irregular verbs'],
      confusionOptions: ['go vs went', 'see vs saw', 'have vs had'],
    };
  }
  if (l.includes('verb')) {
    return {
      subskillChips: ['identify verbs', 'choose correct verb', 'use action verbs', 'verb in sentence', 'verb agreement'],
      confusionOptions: ['is vs are', 'was vs were', 'do vs does'],
    };
  }
  if (l.includes('adjective')) {
    return {
      subskillChips: ['identify adjectives', 'add adjective', 'choose describing word', 'expand sentence', 'use adjective in sentence'],
      confusionOptions: ['adjective vs noun', 'adjective vs adverb', 'wrong describing word'],
    };
  }
  if (l.includes('article')) {
    return {
      subskillChips: ['a/an choice', 'use the', 'insert missing article', 'fix article errors', 'article in sentence'],
      confusionOptions: ['a vs an', 'a/an vs the', 'missing article'],
    };
  }
  if (l.includes('preposition')) {
    return {
      subskillChips: ['identify prepositions', 'choose correct preposition', 'add preposition phrase', 'use in sentence', 'preposition picture match'],
      confusionOptions: ['in vs on', 'under vs over', 'at vs in'],
    };
  }
  if (l.includes('adverb')) {
    return {
      subskillChips: ['identify adverbs', 'add adverb', 'choose adverb', 'edit for adverbs', 'use adverb in sentence'],
      confusionOptions: ['adverb vs adjective', 'too many adverbs', 'wrong adverb choice'],
    };
  }
  if (l.includes('conjunction') || l.includes('join two sentences')) {
    return {
      subskillChips: ['identify conjunctions', 'choose connector', 'join two sentences', 'use and/but/because', 'fix run-on'],
      confusionOptions: ['and vs but', 'because vs so', 'run-on sentence'],
    };
  }
  if (l.includes('plural')) {
    return {
      subskillChips: ['make plural', 'choose s/es', 'singular vs plural', 'plural spelling', 'use plurals in sentence'],
      confusionOptions: ['s vs es', 'y to ies', 'singular vs plural'],
    };
  }
  if (l.includes('run-on') || l.includes('fragment')) {
    return {
      subskillChips: ['spot run-on/fragment', 'split sentences', 'add punctuation', 'rewrite correctly', 'read for clarity'],
      confusionOptions: ['run-on vs complete', 'fragment vs sentence', 'missing punctuation'],
    };
  }
  if (l.includes('question')) {
    return {
      subskillChips: ['use question words', 'write a question', 'question mark', 'question vs statement', 'edit questions'],
      confusionOptions: ['missing question mark', 'question vs statement', 'wrong word order'],
    };
  }
  if (l.includes('exclamation')) {
    return {
      subskillChips: ['use exclamation mark', 'exclaim vs statement', 'punctuation choice', 'express excitement', 'edit punctuation'],
      confusionOptions: ['exclamation vs period', 'exclamation vs question', 'overuse of !'],
    };
  }
  if (l.includes('capital')) {
    return {
      subskillChips: ['capitalize first word', 'capitalize names', 'fix capital errors', 'sentence basics', 'edit for capitals'],
      confusionOptions: ['missing capital', 'mid-sentence caps', 'name not capitalized'],
    };
  }
  if (l.includes('punctuation')) {
    return {
      subskillChips: ['fix punctuation', 'choose correct end mark', 'edit sentence endings', 'read for clarity', 'rewrite correctly'],
      confusionOptions: ['missing punctuation', 'question vs statement', 'exclamation vs period'],
    };
  }
  if (l.includes('tense') || l.includes('past') || l.includes('present') || l.includes('future')) {
    return {
      subskillChips: ['identify tense', 'choose correct tense', 'use time words', 'fix tense mistakes', 'write tense sentences'],
      confusionOptions: ['past vs present', 'present vs future', 'was vs were'],
    };
  }
  if (l.includes('time words')) {
    return {
      subskillChips: ['time words meaning', 'choose correct time word', 'match time word to tense', 'use in sentence', 'spot time words'],
      confusionOptions: ['yesterday vs tomorrow', 'today vs tomorrow', 'last vs next'],
    };
  }
  if (l.includes('perfect')) {
    return {
      subskillChips: ['use present perfect', 'use past perfect', 'use future perfect', 'choose auxiliary', 'edit perfect tense'],
      confusionOptions: ['has vs have', 'had vs has', 'been vs being'],
    };
  }
  if (l.includes('modal')) {
    return {
      subskillChips: ['modal meaning', 'choose modal', 'use modal in sentence', 'edit modal sentence', 'spot modal'],
      confusionOptions: ['can vs could', 'should vs would', 'may vs might'],
    };
  }
  if (l.includes('clause') || l.includes('complex')) {
    return {
      subskillChips: ['identify clauses', 'independent vs dependent', 'combine clauses', 'punctuate clauses', 'fix fragments'],
      confusionOptions: ['fragment vs sentence', 'run-on vs clause', 'comma splice'],
    };
  }
  if (l.includes('reported speech')) {
    return {
      subskillChips: ['change tense', 'use reporting verbs', 'convert direct to reported', 'pronoun shift', 'punctuate correctly'],
      confusionOptions: ['said vs told', 'tense shift missing', 'quote punctuation'],
    };
  }
  if (l.includes('passive') || l.includes('active')) {
    return {
      subskillChips: ['active vs passive', 'convert to passive', 'use by-phrase', 'choose correct form', 'edit voice'],
      confusionOptions: ['active vs passive', 'was vs were', 'missing by-phrase'],
    };
  }
  if (l.includes('transition') || l.includes('paragraph') || l.includes('cohesion')) {
    return {
      subskillChips: ['use transitions', 'topic sentence', 'supporting details', 'organize paragraph', 'edit for flow'],
      confusionOptions: ['missing transitions', 'off-topic detail', 'weak topic sentence'],
    };
  }
  if (l.includes('tone') || l.includes('formality')) {
    return {
      subskillChips: ['formal vs informal', 'adjust tone', 'word choice', 'audience awareness', 'edit for tone'],
      confusionOptions: ['too casual', 'too formal', 'inconsistent tone'],
    };
  }
  if (l.includes('claim') || l.includes('reason') || l.includes('evidence') || l.includes('counterargument')) {
    return {
      subskillChips: ['claim and reason', 'evidence sentence', 'counterargument', 'strong conclusion', 'word choice impact'],
      confusionOptions: ['claim vs reason', 'weak evidence', 'off-topic argument'],
    };
  }
  if (l.includes('clarity')) {
    return {
      subskillChips: ['rewrite for clarity', 'remove extra words', 'correct grammar mistake', 'improve sentence flow', 'edit carefully'],
      confusionOptions: ['run-on sentence', 'fragment vs sentence', 'missing punctuation'],
    };
  }
  return null;
};

const buildSpeakingOverride = (label: string): TopicOverride | null => {
  const l = label.toLowerCase();
  if (l.includes('revision')) {
    return {
      subskillChips: SUBSKILL_CHIPS_BY_RUBRIC.revision,
      confusionOptions: [],
    };
  }
  if (l.includes('warm-up')) {
    return {
      subskillChips: ['warm-up routine', 'calm breathing', 'confidence start', 'voice check', 'ready posture'],
      confusionOptions: ['shy/low confidence', 'needs prompting', 'too soft voice'],
    };
  }
  if (l.includes('eye contact')) {
    return {
      subskillChips: ['eye contact', 'look at audience', 'hold gaze', 'smile', 'start confidently'],
      confusionOptions: ['low eye contact', 'looks down', 'nervous'],
    };
  }
  if (l.includes('posture')) {
    return {
      subskillChips: ['posture', 'stand still', 'hands by side', 'face audience', 'confident stance'],
      confusionOptions: ['slouching', 'fidgeting', 'turns away'],
    };
  }
  if (l.includes('volume') || l.includes('voice volume')) {
    return {
      subskillChips: ['volume control', 'speak loudly enough', 'clear voice', 'confidence start', 'steady pace'],
      confusionOptions: ['too soft voice', 'too loud', 'mumbling'],
    };
  }
  if (l.includes('self-introduction')) {
    return {
      subskillChips: ['say name clearly', 'greet audience', 'full sentence intro', 'eye contact', 'clear ending'],
      confusionOptions: ['forgets name', 'too soft voice', 'no greeting'],
    };
  }
  if (l.includes('full sentences')) {
    return {
      subskillChips: ['full sentences', 'complete thoughts', 'subject + verb', 'speak clearly', 'pause between ideas'],
      confusionOptions: ['sentence fragments', 'missing verbs', 'mumbles'],
    };
  }
  if (l.includes('clear speech') || l.includes('slow pace') || l.includes('word ending') || l.includes('clarity check')) {
    return {
      subskillChips: ['speak clearly', 'slow pace', 'say full words', 'articulation', 'pause between ideas'],
      confusionOptions: ['too fast', 'mumbling', 'drops word endings'],
    };
  }
  if (l.includes('pause')) {
    return {
      subskillChips: ['use pauses', 'separate ideas', 'steady pace', 'breathing control', 'clear speech'],
      confusionOptions: ['no pauses', 'too fast', 'runs sentences together'],
    };
  }
  if (l.includes('picture talk') || l.includes('describe') || l.includes('details')) {
    return {
      subskillChips: ['describe object', 'use 3 details', 'use describing words', 'stay on topic', 'clear sentence'],
      confusionOptions: ['missing details', 'off-topic', 'too short'],
    };
  }
  if (l.includes('gesture')) {
    return {
      subskillChips: ['use gestures', 'match gesture to words', 'open posture', 'facial expression', 'eye contact'],
      confusionOptions: ['no gestures', 'too much movement', 'distracting hands'],
    };
  }
  if (l.includes('emotion')) {
    return {
      subskillChips: ['emotion words', 'express feelings', 'voice tone', 'facial expression', 'clear sentence'],
      confusionOptions: ['flat expression', 'wrong emotion word', 'monotone'],
    };
  }
  if (l.includes('answer questions')) {
    return {
      subskillChips: ['listen to question', 'answer in full sentence', 'stay on topic', 'eye contact', 'clear voice'],
      confusionOptions: ['off-topic', 'one-word answers', 'too soft voice'],
    };
  }
  if (l.includes('one-minute') || l.includes('mini speech') || l.includes('capstone')) {
    return {
      subskillChips: ['speak 30–60 seconds', 'stay on topic', 'sequence ideas', 'clear voice', 'strong ending'],
      confusionOptions: ['too short', 'off-topic', 'no ending'],
    };
  }
  if (l.includes('sequence') || l.includes('hook-body-close') || l.includes('structure')) {
    return {
      subskillChips: ['sequence words', 'organize ideas', 'supporting details', 'stay on topic', 'strong conclusion'],
      confusionOptions: ['missing sequence', 'mixed order', 'no clear ending'],
    };
  }
  if (l.includes('voice variety') || l.includes('emphasis') || l.includes('expression') || l.includes('pause for effect')) {
    return {
      subskillChips: ['voice variety', 'emphasis', 'pace changes', 'expression', 'pause for effect'],
      confusionOptions: ['monotone', 'no emphasis', 'too fast'],
    };
  }
  if (l.includes('story') || l.includes('beginning') || l.includes('character')) {
    return {
      subskillChips: ['beginning-middle-end', 'character voice', 'stay on story', 'clear ending', 'expression'],
      confusionOptions: ['missing ending', 'mixed order', 'off-topic'],
    };
  }
  if (l.includes('presentation') || l.includes('visual') || l.includes('notes')) {
    return {
      subskillChips: ['clear opening', 'use visual/prop', 'steady pace', 'eye contact', 'confident ending'],
      confusionOptions: ['nervous', 'too soft voice', 'reads without looking up'],
    };
  }
  if (l.includes('mistakes') || l.includes('confidence reset')) {
    return {
      subskillChips: ['pause and restart', 'stay calm', 'keep going', 'self-correct', 'confidence reset'],
      confusionOptions: ['stops speaking', 'gets flustered', 'needs prompting'],
    };
  }
  if (l.includes('impromptu') || l.includes('tough questions')) {
    return {
      subskillChips: ['thinking time strategy', 'answer clearly', 'stay calm', 'structure reply', 'confidence reset'],
      confusionOptions: ['freezes', 'off-topic', 'too soft voice'],
    };
  }
  if (l.includes('persuasion') || l.includes('rebuttal') || l.includes('debate')) {
    return {
      subskillChips: ['state opinion', 'give reason', 'rebut politely', 'strong conclusion', 'audience Q&A'],
      confusionOptions: ['unclear opinion', 'weak reason', 'off-topic'],
    };
  }
  if (l.includes('engagement') || l.includes('presence') || l.includes('opening')) {
    return {
      subskillChips: ['strong opening', 'stage presence', 'audience engagement', 'clear articulation', 'confident tone'],
      confusionOptions: ['low energy', 'no eye contact', 'too soft voice'],
    };
  }
  return null;
};

const buildPhonicsOverride = (
  courseId: string,
  lessonNumber: number | null,
  label: string,
): TopicOverride | null => {
  if (!lessonNumber) return null;
  const lowerLabel = label.toLowerCase();

  if (courseId === 'phonics-foundations' && lessonNumber <= 26) {
    const letter = lowerLabel.trim().split(/\s+/)[0];
    const confusions = FOUNDATION_CONFUSIONS_BY_LETTER[letter] ?? [];
    return confusions.length ? { confusionOptions: confusions } : { confusionOptions: [] };
  }

  if (courseId !== 'early-phonics' && courseId !== 'advanced-phonics') return null;

  if (courseId === 'early-phonics') {
    if (lessonNumber === 10) {
      return {
        rubricType: 'short_vowels',
        subskillChips: ['short vowel recognition', 'sound discrimination', 'CVC blending', 'CVC word reading', 'CVC spelling'],
        confusionOptions: ['a vs e', 'e vs i', 'i vs o', 'o vs u'],
      };
    }
    const overridesByLesson: Record<number, TopicOverride> = {
      3: {
        subskillChips: ['k sound recognition', 'c vs k choice', 'read c/k words', 'spell c/k words', 'dictation'],
        confusionOptions: ['c vs k', 'ck vs k', 'c vs s'],
      },
      8: {
        subskillChips: ['sound recognition (z/w/v)', 'sound discrimination', 'read z/w/v words', 'spell z/w/v words', 'dictation'],
        confusionOptions: ['v vs w', 'z vs s', 'v vs b'],
      },
      9: {
        subskillChips: ['sound recognition (y/x/q)', 'letter-sound match', 'read y/x/q words', 'spell y/x/q words', 'dictation'],
        confusionOptions: ['q vs k', 'x (/ks/) vs s', 'y vs i'],
      },
      11: {
        subskillChips: ['sh sound recognition', 'read sh words', 'spell sh words', 'word reading', 'dictation'],
        confusionOptions: ['sh vs ch', 'sh vs s'],
      },
      12: {
        subskillChips: ['ch sound recognition', 'tch spelling after short vowel', 'read ch/tch words', 'spell ch/tch words', 'dictation'],
        confusionOptions: ['ch vs tch', 'ch vs sh'],
      },
      13: {
        subskillChips: ['th sound recognition', 'voiced vs unvoiced th', 'read th words', 'spell th words', 'dictation'],
        confusionOptions: ['th vs f', 'th vs t'],
      },
      14: {
        subskillChips: ['ck pattern recognition', 'k sound spelling choice', 'read ck words', 'spell ck words', 'dictation'],
        confusionOptions: ['ck vs k', 'ck vs c'],
      },
      15: {
        subskillChips: ['ng sound', 'read ng words', 'spell ng words', 'spot silent b', 'spell mb words', 'dictation'],
        confusionOptions: ['ng vs n', 'mb vs m', 'mb vs mp'],
      },
      16: {
        subskillChips: ['spot silent letter', 'read kn words', 'spell kn words', 'pronounce correctly', 'dictation'],
        confusionOptions: ['kn vs n', 'kn vs k'],
      },
      17: {
        subskillChips: ['spot silent letter', 'read wr words', 'spell wr words', 'pronounce correctly', 'dictation'],
        confusionOptions: ['wr vs r', 'wr vs w'],
      },
      18: {
        subskillChips: ['wh sound recognition', 'read wh words', 'spell wh words', 'word reading', 'dictation'],
        confusionOptions: ['wh vs w'],
      },
      19: {
        subskillChips: ['ph sound recognition', 'gh pattern recognition', 'read ph/gh words', 'spell ph/gh words', 'dictation'],
        confusionOptions: ['ph vs f', 'gh vs g', 'gh silent'],
      },
      21: {
        subskillChips: ['double consonant rule', 'read floss words', 'spell floss words', 'word sorting', 'dictation'],
        confusionOptions: ['f vs ff', 'l vs ll', 's vs ss'],
      },
      22: {
        subskillChips: ['ai pattern recognition', 'long a sound', 'read ai words', 'spell ai words', 'sound discrimination'],
        confusionOptions: ['ai vs ay', 'ai vs a_e'],
      },
      23: {
        subskillChips: ['ee pattern recognition', 'long e sound', 'read ee words', 'spell ee words', 'sound discrimination'],
        confusionOptions: ['ee vs ea', 'ee vs e_e'],
      },
      24: {
        subskillChips: ['ea pattern recognition', 'long e sound', 'read ea words', 'spell ea words', 'sound discrimination'],
        confusionOptions: ['ea vs ee', 'ea vs e_e'],
      },
      25: {
        subskillChips: ['ie pattern recognition', 'long i sound', 'read ie words', 'spell ie words', 'sound discrimination'],
        confusionOptions: ['ie vs i_e', 'ie vs igh'],
      },
      26: {
        subskillChips: ['oa pattern recognition', 'long o sound', 'read oa words', 'spell oa words', 'sound discrimination'],
        confusionOptions: ['oa vs oe', 'oa vs o_e'],
      },
      27: {
        subskillChips: ['oo sound recognition', 'sound discrimination', 'read oo words', 'spell oo words', 'word reading'],
        confusionOptions: ['oo: /oo/ vs /ʊ/', 'oo vs u_e'],
      },
      28: {
        subskillChips: ['oe pattern recognition', 'long o sound', 'read oe words', 'spell oe words', 'sound discrimination'],
        confusionOptions: ['oa vs oe', 'oe vs o_e'],
      },
      29: {
        subskillChips: ['ui pattern recognition', 'long u sound', 'read ui words', 'spell ui words', 'sound discrimination'],
        confusionOptions: ['ui vs ue', 'ui vs u_e'],
      },
      30: {
        subskillChips: ['ue pattern recognition', 'long u sound', 'read ue words', 'spell ue words', 'sound discrimination'],
        confusionOptions: ['ue vs ui', 'ue vs u_e'],
      },
      31: {
        subskillChips: ['igh pattern recognition', 'long i sound', 'read igh words', 'spell igh words', 'sound discrimination'],
        confusionOptions: ['i_e vs igh', 'igh vs y'],
      },
      32: {
        subskillChips: ['magic e rule', 'short vs long a', 'read a_e words', 'spell a_e words', 'dictation'],
        confusionOptions: ['a_e vs ai', 'a_e vs ay', 'short vs long a'],
      },
      33: {
        subskillChips: ['magic e rule', 'short vs long e', 'read e_e words', 'spell e_e words', 'dictation'],
        confusionOptions: ['e_e vs ee', 'short vs long e'],
      },
      34: {
        subskillChips: ['magic e rule', 'short vs long i', 'read i_e words', 'spell i_e words', 'dictation'],
        confusionOptions: ['i_e vs igh', 'short vs long i'],
      },
      35: {
        subskillChips: ['magic e rule', 'short vs long o', 'read o_e words', 'spell o_e words', 'dictation'],
        confusionOptions: ['o_e vs oa', 'short vs long o'],
      },
      36: {
        subskillChips: ['magic e rule', 'short vs long u', 'read u_e words', 'spell u_e words', 'dictation'],
        confusionOptions: ['u_e vs ue', 'short vs long u'],
      },
      37: {
        subskillChips: ['double consonant spotting', 'rabbit rule', 'read rabbit words', 'spell rabbit words', 'word sorting'],
        confusionOptions: ['double vs single consonant', 'rabbit vs one syllable'],
      },
      38: {
        subskillChips: ['-le ending recognition', 'read consonant+le words', 'spell -le words', 'syllable division', 'word sorting'],
        confusionOptions: ['le vs el', 'ble vs bel'],
      },
      39: {
        subskillChips: ['soft c rule', 'read soft c words', 'spell soft c words', 'sound discrimination', 'word sorting'],
        confusionOptions: ['soft c vs hard c', 'c vs s'],
      },
      40: {
        subskillChips: ['hard g rule', 'read hard g words', 'spell hard g words', 'sound discrimination', 'word sorting'],
        confusionOptions: ['g vs j', 'soft g vs hard g'],
      },
    };
    return overridesByLesson[lessonNumber] ?? null;
  }

  if (courseId === 'advanced-phonics' && lessonNumber === 9) {
    return {
      rubricType: 'suffix_ending',
      subskillChips: ['/shun/ recognition', 'choose spelling', 'read /shun/ words', 'spell /shun/ words', 'dictation'],
      confusionOptions: ['tion vs sion', 'tion vs cian', 'sion vs cian'],
    };
  }
  if (courseId === 'advanced-phonics' && lessonNumber === 8) {
    return {
      subskillChips: ['j sound recognition', 'choose j spelling', 'read j sound words', 'spell j sound words', 'dictation'],
      confusionOptions: ['j vs g', 'dge vs ge', 'j vs dge'],
    };
  }
  return null;
};

const applyLessonOverrides = (
  topic: { courseId: string; lesson?: string; id?: string; label?: string },
  rubricType: RubricType,
): { rubricType: RubricType; subskillChips: string[]; confusionOptions: string[] } => {
  const lessonNumber = extractLessonNumber(topic.lesson, topic.id);
  const label = String(topic.label ?? '');
  let override: TopicOverride | null = null;

  if (topic.courseId.startsWith('phonics')) {
    override = buildPhonicsOverride(topic.courseId, lessonNumber, label);
  } else if (topic.courseId.includes('grammar')) {
    override = buildGrammarOverride(label);
  } else if (topic.courseId.includes('public-speaking')) {
    override = buildSpeakingOverride(label);
  }

  const finalRubric = override?.rubricType ?? rubricType;
  const subskillChips = override?.subskillChips ?? SUBSKILL_CHIPS_BY_RUBRIC[finalRubric];
  const confusionOptions = override?.confusionOptions ?? CONFUSION_OPTIONS_BY_RUBRIC[finalRubric];

  return {
    rubricType: finalRubric,
    subskillChips,
    confusionOptions,
  };
};

const PHONICS_CURRICULUM_TOPICS = [
  { id: 'phonics-foundations__lesson-01', courseId: 'phonics-foundations', lesson: 'Lesson-1', label: 's' },
  { id: 'phonics-foundations__lesson-02', courseId: 'phonics-foundations', lesson: 'Lesson-2', label: 'a' },
  { id: 'phonics-foundations__lesson-03', courseId: 'phonics-foundations', lesson: 'Lesson-3', label: 't' },
  { id: 'phonics-foundations__lesson-04', courseId: 'phonics-foundations', lesson: 'Lesson-4', label: 'i' },
  { id: 'phonics-foundations__lesson-05', courseId: 'phonics-foundations', lesson: 'Lesson-5', label: 'p' },
  { id: 'phonics-foundations__lesson-06', courseId: 'phonics-foundations', lesson: 'Lesson-6', label: 'n' },
  { id: 'phonics-foundations__lesson-07', courseId: 'phonics-foundations', lesson: 'Lesson-7', label: 'c' },
  { id: 'phonics-foundations__lesson-08', courseId: 'phonics-foundations', lesson: 'Lesson-8', label: 'k' },
  { id: 'phonics-foundations__lesson-09', courseId: 'phonics-foundations', lesson: 'Lesson-9', label: 'e' },
  { id: 'phonics-foundations__lesson-10', courseId: 'phonics-foundations', lesson: 'Lesson-10', label: 'h' },
  { id: 'phonics-foundations__lesson-11', courseId: 'phonics-foundations', lesson: 'Lesson-11', label: 'r' },
  { id: 'phonics-foundations__lesson-12', courseId: 'phonics-foundations', lesson: 'Lesson-12', label: 'm' },
  { id: 'phonics-foundations__lesson-13', courseId: 'phonics-foundations', lesson: 'Lesson-13', label: 'd' },
  { id: 'phonics-foundations__lesson-14', courseId: 'phonics-foundations', lesson: 'Lesson-14', label: 'g' },
  { id: 'phonics-foundations__lesson-15', courseId: 'phonics-foundations', lesson: 'Lesson-15', label: 'o' },
  { id: 'phonics-foundations__lesson-16', courseId: 'phonics-foundations', lesson: 'Lesson-16', label: 'u' },
  { id: 'phonics-foundations__lesson-17', courseId: 'phonics-foundations', lesson: 'Lesson-17', label: 'l' },
  { id: 'phonics-foundations__lesson-18', courseId: 'phonics-foundations', lesson: 'Lesson-18', label: 'f' },
  { id: 'phonics-foundations__lesson-19', courseId: 'phonics-foundations', lesson: 'Lesson-19', label: 'b' },
  { id: 'phonics-foundations__lesson-20', courseId: 'phonics-foundations', lesson: 'Lesson-20', label: 'j' },
  { id: 'phonics-foundations__lesson-21', courseId: 'phonics-foundations', lesson: 'Lesson-21', label: 'z' },
  { id: 'phonics-foundations__lesson-22', courseId: 'phonics-foundations', lesson: 'Lesson-22', label: 'w' },
  { id: 'phonics-foundations__lesson-23', courseId: 'phonics-foundations', lesson: 'Lesson-23', label: 'v' },
  { id: 'phonics-foundations__lesson-24', courseId: 'phonics-foundations', lesson: 'Lesson-24', label: 'y' },
  { id: 'phonics-foundations__lesson-25', courseId: 'phonics-foundations', lesson: 'Lesson-25', label: 'x' },
  { id: 'phonics-foundations__lesson-26', courseId: 'phonics-foundations', lesson: 'Lesson-26', label: 'q' },
  { id: 'phonics-foundations__lesson-27', courseId: 'phonics-foundations', lesson: 'Lesson-27', label: 'a e i o u' },
  { id: 'phonics-foundations__lesson-28', courseId: 'phonics-foundations', lesson: 'Lesson-28', label: 'all letter sounds' },
  { id: 'phonics-foundations__lesson-29', courseId: 'phonics-foundations', lesson: 'Lesson-29', label: 'revision' },
  { id: 'phonics-foundations__lesson-30', courseId: 'phonics-foundations', lesson: 'Lesson-30', label: 'revision' },
  { id: 'early-phonics__lesson-01', courseId: 'early-phonics', lesson: 'Lesson-1', label: 's a t' },
  { id: 'early-phonics__lesson-02', courseId: 'early-phonics', lesson: 'Lesson-2', label: 'i p n' },
  { id: 'early-phonics__lesson-03', courseId: 'early-phonics', lesson: 'Lesson-3', label: 'c and k' },
  { id: 'early-phonics__lesson-04', courseId: 'early-phonics', lesson: 'Lesson-4', label: 'e  h  r' },
  { id: 'early-phonics__lesson-05', courseId: 'early-phonics', lesson: 'Lesson-5', label: 'm d g' },
  { id: 'early-phonics__lesson-06', courseId: 'early-phonics', lesson: 'Lesson-6', label: 'o u l' },
  { id: 'early-phonics__lesson-07', courseId: 'early-phonics', lesson: 'Lesson-7', label: 'f b j' },
  { id: 'early-phonics__lesson-08', courseId: 'early-phonics', lesson: 'Lesson-8', label: 'z w v' },
  { id: 'early-phonics__lesson-09', courseId: 'early-phonics', lesson: 'Lesson-9', label: 'y x q' },
  { id: 'early-phonics__lesson-10', courseId: 'early-phonics', lesson: 'Lesson-10', label: 'short vowels' },
  { id: 'early-phonics__lesson-11', courseId: 'early-phonics', lesson: 'Lesson-11', label: 'sh' },
  { id: 'early-phonics__lesson-12', courseId: 'early-phonics', lesson: 'Lesson-12', label: 'ch, tch' },
  { id: 'early-phonics__lesson-13', courseId: 'early-phonics', lesson: 'Lesson-13', label: 'th, TH' },
  { id: 'early-phonics__lesson-14', courseId: 'early-phonics', lesson: 'Lesson-14', label: 'ck' },
  { id: 'early-phonics__lesson-15', courseId: 'early-phonics', lesson: 'Lesson-15', label: 'ng, mb' },
  { id: 'early-phonics__lesson-16', courseId: 'early-phonics', lesson: 'Lesson-16', label: 'kn' },
  { id: 'early-phonics__lesson-17', courseId: 'early-phonics', lesson: 'Lesson-17', label: 'wr' },
  { id: 'early-phonics__lesson-18', courseId: 'early-phonics', lesson: 'Lesson-18', label: 'wh' },
  { id: 'early-phonics__lesson-19', courseId: 'early-phonics', lesson: 'Lesson-19', label: 'ph, gh' },
  { id: 'early-phonics__lesson-20', courseId: 'early-phonics', lesson: 'Lesson-20', label: 'revision of digraphs' },
  { id: 'early-phonics__lesson-21', courseId: 'early-phonics', lesson: 'Lesson-21', label: 'Floss rule' },
  { id: 'early-phonics__lesson-22', courseId: 'early-phonics', lesson: 'Lesson-22', label: 'ai' },
  { id: 'early-phonics__lesson-23', courseId: 'early-phonics', lesson: 'Lesson-23', label: 'ee' },
  { id: 'early-phonics__lesson-24', courseId: 'early-phonics', lesson: 'Lesson-24', label: 'ea' },
  { id: 'early-phonics__lesson-25', courseId: 'early-phonics', lesson: 'Lesson-25', label: 'ie' },
  { id: 'early-phonics__lesson-26', courseId: 'early-phonics', lesson: 'Lesson-26', label: 'oa' },
  { id: 'early-phonics__lesson-27', courseId: 'early-phonics', lesson: 'Lesson-27', label: 'oo' },
  { id: 'early-phonics__lesson-28', courseId: 'early-phonics', lesson: 'Lesson-28', label: 'oe' },
  { id: 'early-phonics__lesson-29', courseId: 'early-phonics', lesson: 'Lesson-29', label: 'ui' },
  { id: 'early-phonics__lesson-30', courseId: 'early-phonics', lesson: 'Lesson-30', label: 'ue' },
  { id: 'early-phonics__lesson-31', courseId: 'early-phonics', lesson: 'Lesson-31', label: 'igh' },
  { id: 'early-phonics__lesson-32', courseId: 'early-phonics', lesson: 'Lesson-32', label: 'a_e' },
  { id: 'early-phonics__lesson-33', courseId: 'early-phonics', lesson: 'Lesson-33', label: 'e_e' },
  { id: 'early-phonics__lesson-34', courseId: 'early-phonics', lesson: 'Lesson-34', label: 'i_e' },
  { id: 'early-phonics__lesson-35', courseId: 'early-phonics', lesson: 'Lesson-35', label: 'o_e' },
  { id: 'early-phonics__lesson-36', courseId: 'early-phonics', lesson: 'Lesson-36', label: 'u_e' },
  { id: 'early-phonics__lesson-37', courseId: 'early-phonics', lesson: 'Lesson-37', label: 'Rabbit rule' },
  { id: 'early-phonics__lesson-38', courseId: 'early-phonics', lesson: 'Lesson-38', label: 'monster le' },
  { id: 'early-phonics__lesson-39', courseId: 'early-phonics', lesson: 'Lesson-39', label: 'soft c' },
  { id: 'early-phonics__lesson-40', courseId: 'early-phonics', lesson: 'Lesson-40', label: 'hard g' },
  { id: 'early-phonics__lesson-41', courseId: 'early-phonics', lesson: 'Lesson-41', label: 'Revision' },
  { id: 'advanced-phonics__lesson-01', courseId: 'advanced-phonics', lesson: 'Lesson-1', label: 'ai, ay' },
  { id: 'advanced-phonics__lesson-02', courseId: 'advanced-phonics', lesson: 'Lesson-2', label: 'oi, oy' },
  { id: 'advanced-phonics__lesson-03', courseId: 'advanced-phonics', lesson: 'Lesson-3', label: 'ou, ow' },
  { id: 'advanced-phonics__lesson-04', courseId: 'advanced-phonics', lesson: 'Lesson-4', label: 'au, aw' },
  { id: 'advanced-phonics__lesson-05', courseId: 'advanced-phonics', lesson: 'Lesson-5', label: 'bossy ar' },
  { id: 'advanced-phonics__lesson-06', courseId: 'advanced-phonics', lesson: 'Lesson-6', label: 'bossy or' },
  { id: 'advanced-phonics__lesson-07', courseId: 'advanced-phonics', lesson: 'Lesson-7', label: 'ir, ur, er' },
  { id: 'advanced-phonics__lesson-08', courseId: 'advanced-phonics', lesson: 'Lesson-8', label: '3  j sounds' },
  { id: 'advanced-phonics__lesson-09', courseId: 'advanced-phonics', lesson: 'Lesson-9', label: 'shun sounds' },
  { id: 'advanced-phonics__lesson-10', courseId: 'advanced-phonics', lesson: 'Lesson-10', label: 'silent letters' },
  { id: 'advanced-phonics__lesson-11', courseId: 'advanced-phonics', lesson: 'Lesson-11', label: 'alternate a' },
  { id: 'advanced-phonics__lesson-12', courseId: 'advanced-phonics', lesson: 'Lesson-12', label: 'alternate e' },
  { id: 'advanced-phonics__lesson-13', courseId: 'advanced-phonics', lesson: 'Lesson-13', label: 'alternate i' },
  { id: 'advanced-phonics__lesson-14', courseId: 'advanced-phonics', lesson: 'Lesson-14', label: 'alternate o' },
  { id: 'advanced-phonics__lesson-15', courseId: 'advanced-phonics', lesson: 'Lesson-15', label: 'alternate u' },
  { id: 'advanced-phonics__lesson-16', courseId: 'advanced-phonics', lesson: 'Lesson-16', label: 'c at the end, ct sound' },
  { id: 'advanced-phonics__lesson-17', courseId: 'advanced-phonics', lesson: 'Lesson-17', label: 'revision' },
  { id: 'advanced-phonics__lesson-18', courseId: 'advanced-phonics', lesson: 'Lesson-18', label: 'revision' },
  { id: 'advanced-phonics__lesson-19', courseId: 'advanced-phonics', lesson: 'Lesson-19', label: 'revision' },
  { id: 'advanced-phonics__lesson-20', courseId: 'advanced-phonics', lesson: 'Lesson-20', label: 'revision' },
].map((topic) => {
  const rubricType = classifyRubricType(topic.courseId, topic.lesson, topic.id);
  const overrides = applyLessonOverrides(topic, rubricType);
  const stage = resolveStageByLessonNumber(
    topic.courseId,
    extractLessonNumber(topic.lesson, topic.id),
  );
  return {
    ...topic,
    area: 'phonics',
    displayTitle: CURRICULUM_DISPLAY_TITLES[topic.id] ?? `${topic.lesson} — ${topic.label}`,
    stageLabel: stage?.label ?? null,
    stageOrder: stage?.stageOrder ?? null,
    rubricType: overrides.rubricType,
    subskillChips: overrides.subskillChips,
    confusionOptions: overrides.confusionOptions,
  };
});

const GRAMMAR_CURRICULUM_TOPICS = [
  ...buildSequentialTopics('basic-grammar', 'grammar', GRAMMAR_BASIC_LABELS),
  ...buildSequentialTopics('advanced-grammar', 'grammar', GRAMMAR_ADVANCED_LABELS),
].map((topic) => {
  const rubricType = classifyRubricType(topic.courseId, topic.lesson, topic.id);
  const overrides = applyLessonOverrides(topic, rubricType);
  const stage = resolveStageByLessonNumber(
    topic.courseId,
    extractLessonNumber(topic.lesson, topic.id),
  );
  return {
    ...topic,
    displayTitle: CURRICULUM_DISPLAY_TITLES[topic.id] ?? `${topic.lesson} — ${topic.label}`,
    stageLabel: stage?.label ?? null,
    stageOrder: stage?.stageOrder ?? null,
    rubricType: overrides.rubricType,
    subskillChips: overrides.subskillChips,
    confusionOptions: overrides.confusionOptions,
  };
});

const SPEAKING_CURRICULUM_TOPICS = [
  ...buildSequentialTopics('basic-public-speaking', 'speaking', SPEAKING_BASIC_LABELS),
  ...buildSequentialTopics('advanced-public-speaking', 'speaking', SPEAKING_ADVANCED_LABELS),
].map((topic) => {
  const rubricType = classifyRubricType(topic.courseId, topic.lesson, topic.id);
  const overrides = applyLessonOverrides(topic, rubricType);
  const stage = resolveStageByLessonNumber(
    topic.courseId,
    extractLessonNumber(topic.lesson, topic.id),
  );
  return {
    ...topic,
    displayTitle: CURRICULUM_DISPLAY_TITLES[topic.id] ?? `${topic.lesson} — ${topic.label}`,
    stageLabel: stage?.label ?? null,
    stageOrder: stage?.stageOrder ?? null,
    rubricType: overrides.rubricType,
    subskillChips: overrides.subskillChips,
    confusionOptions: overrides.confusionOptions,
  };
});

interface StudentListProps {
  onEdit: (student: Student) => void;
  onDelete: (studentId: string) => void;
  onAssignCourse: (student: Student) => void;
}

type EnrollmentLite = {
  id: string;
  status?: string;
  courseId?: string;
  course?: { title?: string };
  teacherId?: string;
  teacher?: { name?: string; email?: string; uid?: string; id?: string };
  parentId?: string;
  parentIds?: string[];
  feePerClass?: number;
  currency?: string;
  joinUrl?: string;
  schedule?: {
    timezone?: string;
    weekdays?: number[];
    timeHHmm?: string;
    durationMins?: number;
    weeksAhead?: number;
    plannedSessions?: number;
    endDateYmd?: string;
  };
  startDate?: any; // Timestamp
  startDateYmd?: string;
  classesStartDate?: any; // Timestamp
  classesStartDateYmd?: string;
};

type SessionRequestRow = {
  id: string;
  path: string;
  teacherId: string;
  kidId: string;
  startAt: Date;
  endAt: Date;
  durationMins: number;
  note?: string;
  status?: string;
};

type RescheduleCreditMonitorEntry = {
  id: string;
  kidId: string;
  teacherId: string;
  status: RescheduleCreditStatus;
  updatedAt: Date | null;
};

type RescheduleCreditsMonitorRow = {
  key: string;
  kidId: string;
  teacherId: string;
  studentName: string;
  teacherName: string;
  open: number;
  scheduled: number;
  consumed: number;
  total: number;
  lastUpdatedAt: Date | null;
};

function computeAgeYearsFromDob(dob?: string): number | null {
  try {
    if (!dob) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
    if (!m) return null;

    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;

    const birth = new Date(y, mo - 1, d);
    if (Number.isNaN(birth.getTime())) return null;

    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const hasHadBirthdayThisYear =
      now.getMonth() > birth.getMonth() ||
      (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
    if (!hasHadBirthdayThisYear) age -= 1;

    return age >= 0 && age <= 30 ? age : null;
  } catch {
    return null;
  }
}

function displayAgeYears(s: any): string {
  const direct = s?.ageYears ?? s?.age;
  if (typeof direct === 'number' && Number.isFinite(direct)) return String(direct);

  const legacyDob = s?.dob ?? s?.birthdate;
  const fromDob = computeAgeYearsFromDob(legacyDob);
  return fromDob != null ? String(fromDob) : '—';
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseISODateOnly(iso: string): Date | null {
  // iso: YYYY-MM-DD
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  const dt = new Date(y, mo - 1, d, 0, 0, 0, 0);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function dateLikeToDate(value: any): Date | null {
  if (!value) return null;
  if (typeof value?.toDate === 'function') {
    const dt = value.toDate();
    if (dt instanceof Date && !Number.isNaN(dt.getTime())) return dt;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const dt = new Date(value);
    if (!Number.isNaN(dt.getTime())) return dt;
  }
  return null;
}

function dateLikeToYmd(value: any): string | null {
  if (!value) return null;
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return toISODate(parsed);
    return null;
  }
  if (typeof value?.toDate === 'function') {
    const dt = value.toDate();
    if (dt instanceof Date && !Number.isNaN(dt.getTime())) return toISODate(dt);
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) return toISODate(value);
  return null;
}

function formatYMDCompact(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}


function formatTimeHHmm(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatDateTime(d: Date): string {
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function safeNumber(v: any, fallback = 0): number {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
}

function enrollmentLabel(e: EnrollmentLite): string {
  const courseTitle = e.course?.title || e.courseId || 'Course';
  const teacher = e.teacher?.name || e.teacher?.email || e.teacherId || '';
  const fee = safeNumber(e.feePerClass, 0);
  const feeText = fee > 0 ? ` — ₹${fee}/class` : '';
  return `${courseTitle}${teacher ? ` — ${teacher}` : ''}${feeText}`;
}

function normalizeEnrollmentStatus(value: any): string {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'active';
  if (raw === 'pending_teacher') return 'trial';
  if (raw === 'pending_payment' || raw === 'pending_lp') return 'active';
  if (raw === 'enrolled' || raw === 'current' || raw === 'ongoing') return 'active';
  if (raw === 'canceled') return 'cancelled';
  return raw;
}

function isPastEnrollmentStatus(status: string): boolean {
  return (
    status === 'completed' ||
    status === 'discontinued' ||
    status === 'expired' ||
    status === 'cancelled'
  );
}

export default function StudentList({ onEdit, onDelete, onAssignCourse }: StudentListProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<User[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [parentFilter, setParentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<StudentSortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [enrollmentStatusTab, setEnrollmentStatusTab] = useState<'active' | 'past'>('active');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(DEFAULT_PAGE_SIZE);

  const [assignCourseFor, setAssignCourseFor] = useState<Student | null>(null);
  const [assignTeacherFor, setAssignTeacherFor] = useState<Student | null>(null);
  const [assignLPFor, setAssignLPFor] = useState<Student | null>(null);
  const [enrollmentDetailsFor, setEnrollmentDetailsFor] = useState<Student | null>(null);
  const [actionsFor, setActionsFor] = useState<Student | null>(null);

  // ✅ NEW: schedule modal state
  const [scheduleFor, setScheduleFor] = useState<Student | null>(null);
  const [scheduleEnrollmentId, setScheduleEnrollmentId] = useState<string>('');
  const [enrollmentStartDate, setEnrollmentStartDate] = useState<string>(toISODate(new Date()));
  const [classesStartDate, setClassesStartDate] = useState<string>(toISODate(new Date()));
  const [weekdays, setWeekdays] = useState<number[]>([1, 3, 5]); // Mon, Wed, Fri default
  const [timeHHmm, setTimeHHmm] = useState<string>('18:00');
  const [durationMins, setDurationMins] = useState<number>(35);
  const [feePerClass, setFeePerClass] = useState<number>(0);
  const [generateWeeks, setGenerateWeeks] = useState<number>(8);
  const [plannedSessions, setPlannedSessions] = useState<number>(0);
  const [endDate, setEndDate] = useState<string>(''); // optional
  const [meetingLink, setMeetingLink] = useState<string>(''); // optional (Zoom/Meet)
  const [savingSchedule, setSavingSchedule] = useState<boolean>(false);

  const [sessionRequests, setSessionRequests] = useState<SessionRequestRow[]>([]);
  const [requestActionId, setRequestActionId] = useState<string | null>(null);
  const [sessionRequestsOpen, setSessionRequestsOpen] = useState(false);
  const [rescheduleCreditsMonitorEntries, setRescheduleCreditsMonitorEntries] = useState<RescheduleCreditMonitorEntry[]>([]);
  const [rescheduleCreditsMonitorLoading, setRescheduleCreditsMonitorLoading] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState({
    running: false,
  });
  const [syncCurriculumStatus, setSyncCurriculumStatus] = useState({
    phonics: false,
    grammar: false,
    speaking: false,
  });

  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const applyScheduleFormFromEnrollment = (enrollment: EnrollmentLite) => {
    const todayISO = toISODate(new Date());
    const enrollmentStartYmd =
      dateLikeToYmd(enrollment.startDateYmd) ||
      dateLikeToYmd(enrollment.startDate) ||
      todayISO;
    const classesStartYmd =
      dateLikeToYmd(enrollment.classesStartDateYmd) ||
      dateLikeToYmd(enrollment.classesStartDate) ||
      enrollmentStartYmd;

    setEnrollmentStartDate(enrollmentStartYmd);
    setClassesStartDate(classesStartYmd);
    setWeekdays(
      Array.isArray(enrollment.schedule?.weekdays) && enrollment.schedule.weekdays.length > 0
        ? enrollment.schedule.weekdays
        : [1, 3, 5],
    );
    setTimeHHmm(enrollment.schedule?.timeHHmm || '18:00');
    setDurationMins(safeNumber(enrollment.schedule?.durationMins, 35));
    setGenerateWeeks(safeNumber(enrollment.schedule?.weeksAhead, 8));
    setPlannedSessions(safeNumber(enrollment.schedule?.plannedSessions, 0));
    setEndDate(
      typeof enrollment.schedule?.endDateYmd === 'string'
        ? enrollment.schedule.endDateYmd
        : '',
    );
    setFeePerClass(safeNumber(enrollment.feePerClass, 0));
    setMeetingLink(enrollment.joinUrl || '');
  };

  const handleDeleteEnrollment = async (enrollmentId: string) => {
    if (!window.confirm('Discontinue this enrollment?')) return;
    try {
      const functions = getFunctions(undefined, 'asia-south1');
      const setEnrollmentStatus = httpsCallable(functions, 'setEnrollmentStatus');
      await setEnrollmentStatus({
        enrollmentId,
        status: 'discontinued',
        reason: 'admin_deleted',
      });
      toast({ title: 'Enrollment discontinued' });
      enrollmentsQuery.refetch();
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to discontinue enrollment', variant: 'destructive' });
    }
  };

  useEffect(() => {
    // load parent/teacher lists for filters and monitor labels
    const loadUsers = async () => {
      try {
        const [parentSnap, teacherSnap] = await Promise.all([
          getDocs(query(collection(db, 'users'), where('role', '==', 'parent'))),
          getDocs(query(collection(db, 'users'), where('role', '==', 'teacher'))),
        ]);
        const allParents = parentSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as User[];
        const allTeachers = teacherSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as User[];
        setParents(allParents);
        setTeachers(allTeachers);
      } catch (err) {
        console.error('users load error', err);
      }
    };
    loadUsers();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'kids'), orderBy('createdAt', 'desc'), limit(1000));
    const unsub = onSnapshot(
      q,
      snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Student[];
        setStudents(list);
      },
      err => console.error(err)
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user?.role !== 'admin') {
      setSessionRequests([]);
      return;
    }

    const q = query(
      collectionGroup(db, 'sessionRequests'),
      where('status', '==', 'requested'),
      orderBy('startAt', 'asc'),
      limit(200),
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const rows = snapshot.docs
          .map((d) => {
            const raw = d.data() as any;
            const startAt = raw?.startAt?.toDate ? raw.startAt.toDate() : raw?.startAt ? new Date(raw.startAt) : null;
            const endAt = raw?.endAt?.toDate ? raw.endAt.toDate() : raw?.endAt ? new Date(raw.endAt) : null;
            if (!startAt) return null;
            const durationMins = safeNumber(raw?.durationMins, endAt ? Math.round((endAt.getTime() - startAt.getTime()) / 60000) : 35);
            const finalEndAt = endAt || new Date(startAt.getTime() + durationMins * 60 * 1000);

            return {
              id: d.id,
              path: d.ref.path,
              teacherId: raw?.teacherId || '',
              kidId: raw?.kidId || '',
              startAt,
              endAt: finalEndAt,
              durationMins,
              note: raw?.note || '',
              status: raw?.status || 'requested',
            } as SessionRequestRow;
          })
          .filter(Boolean) as SessionRequestRow[];

        setSessionRequests(rows);
      },
      (err) => console.error('sessionRequests onSnapshot error', err),
    );

    return () => unsub();
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      setRescheduleCreditsMonitorEntries([]);
      setRescheduleCreditsMonitorLoading(false);
      return;
    }

    setRescheduleCreditsMonitorLoading(true);
    const q = query(
      collection(db, 'rescheduleCredits'),
      orderBy('updatedAt', 'desc'),
      limit(2000),
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const rows = snapshot.docs
          .map((d) => {
            const raw = d.data() as any;
            const kidId = String(raw?.kidId || '').trim();
            if (!kidId) return null;

            const teacherId = String(raw?.teacherId || '').trim();
            const statusRaw = String(raw?.status || '').trim().toLowerCase();
            const status = (
              ['open', 'scheduled', 'consumed', 'cancelled'].includes(statusRaw)
                ? statusRaw
                : 'open'
            ) as RescheduleCreditStatus;
            const updatedAt = dateLikeToDate(raw?.updatedAt) || dateLikeToDate(raw?.createdAt);

            return {
              id: d.id,
              kidId,
              teacherId,
              status,
              updatedAt,
            } as RescheduleCreditMonitorEntry;
          })
          .filter(Boolean) as RescheduleCreditMonitorEntry[];

        setRescheduleCreditsMonitorEntries(rows);
        setRescheduleCreditsMonitorLoading(false);
      },
      (err) => {
        console.error('rescheduleCredits monitor onSnapshot error', err);
        setRescheduleCreditsMonitorEntries([]);
        setRescheduleCreditsMonitorLoading(false);
      },
    );

    return () => unsub();
  }, [user?.role]);

  const parentLabelById = useMemo(() => {
    const map = new Map<string, string>();
    parents.forEach((parent) => {
      const id = String((parent as any).uid || parent.id || '');
      if (!id) return;
      const label = String(parent.email || parent.name || (parent as any).displayName || id);
      map.set(id, label);
    });
    return map;
  }, [parents]);

  const teacherLabelById = useMemo(() => {
    const map = new Map<string, string>();
    teachers.forEach((teacher) => {
      const docId = String(teacher.id || '').trim();
      const uid = String((teacher as any).uid || '').trim();
      const label = String(teacher.name || teacher.email || (teacher as any).displayName || docId || uid || '—');
      if (docId) map.set(docId, label);
      if (uid) map.set(uid, label);
    });
    return map;
  }, [teachers]);

  const studentNameById = useMemo(() => {
    const map = new Map<string, string>();
    students.forEach((student) => {
      if (!student?.id) return;
      map.set(String(student.id), String(student.fullName || student.id));
    });
    return map;
  }, [students]);

  const rescheduleCreditsTotals = useMemo(() => {
    return rescheduleCreditsMonitorEntries.reduce(
      (acc, entry) => {
        if (entry.status === 'open') acc.open += 1;
        if (entry.status === 'scheduled') acc.scheduled += 1;
        if (entry.status === 'consumed') acc.consumed += 1;
        return acc;
      },
      { open: 0, scheduled: 0, consumed: 0 },
    );
  }, [rescheduleCreditsMonitorEntries]);

  const rescheduleCreditsMonitorRows = useMemo(() => {
    const grouped = new Map<string, RescheduleCreditsMonitorRow>();

    rescheduleCreditsMonitorEntries.forEach((entry) => {
      if (entry.status === 'cancelled') return;

      const teacherKey = entry.teacherId || 'unassigned';
      const key = `${entry.kidId}__${teacherKey}`;
      const studentName = studentNameById.get(entry.kidId) || entry.kidId;
      const teacherName = entry.teacherId
        ? (teacherLabelById.get(entry.teacherId) || entry.teacherId)
        : 'Unassigned';

      const existing = grouped.get(key);
      if (!existing) {
        grouped.set(key, {
          key,
          kidId: entry.kidId,
          teacherId: entry.teacherId,
          studentName,
          teacherName,
          open: entry.status === 'open' ? 1 : 0,
          scheduled: entry.status === 'scheduled' ? 1 : 0,
          consumed: entry.status === 'consumed' ? 1 : 0,
          total: 1,
          lastUpdatedAt: entry.updatedAt,
        });
        return;
      }

      if (entry.status === 'open') existing.open += 1;
      if (entry.status === 'scheduled') existing.scheduled += 1;
      if (entry.status === 'consumed') existing.consumed += 1;
      existing.total += 1;

      if (
        entry.updatedAt
        && (!existing.lastUpdatedAt || entry.updatedAt.getTime() > existing.lastUpdatedAt.getTime())
      ) {
        existing.lastUpdatedAt = entry.updatedAt;
      }
    });

    return Array.from(grouped.values()).sort((a, b) => {
      if (b.open !== a.open) return b.open - a.open;
      if (b.scheduled !== a.scheduled) return b.scheduled - a.scheduled;
      const aTime = a.lastUpdatedAt?.getTime() || 0;
      const bTime = b.lastUpdatedAt?.getTime() || 0;
      if (bTime !== aTime) return bTime - aTime;
      const studentCompare = a.studentName.localeCompare(b.studentName, undefined, { sensitivity: 'base' });
      if (studentCompare !== 0) return studentCompare;
      return a.teacherName.localeCompare(b.teacherName, undefined, { sensitivity: 'base' });
    });
  }, [rescheduleCreditsMonitorEntries, studentNameById, teacherLabelById]);

  const getParentLabelsForStudent = useCallback((student: Student): string[] => {
    return (student.parentIds || [])
      .map((pid) => parentLabelById.get(pid) || pid)
      .filter((value): value is string => Boolean(value));
  }, [parentLabelById]);

  const getParentSortValue = useCallback((student: Student): string => {
    const labels = getParentLabelsForStudent(student);
    return labels.length > 0 ? labels[0].toLowerCase() : '';
  }, [getParentLabelsForStudent]);

  const getAgeSortValue = (student: Student): number => {
    const ageText = displayAgeYears(student);
    const ageNumber = Number(ageText);
    return Number.isFinite(ageNumber) ? ageNumber : -1;
  };

  const filtered = useMemo(() => {
    let list = students.slice();

    if (search) {
      const s = search.toLowerCase();
      list = list.filter(st =>
        (st.fullName || '').toLowerCase().includes(s) ||
        (st.parentIds || []).some(pid => {
          const p = parents.find(x => (x as any).uid === pid || x.id === pid);
          return (p?.email || '').toLowerCase().includes(s);
        })
      );
    }

    if (gradeFilter !== 'all') list = list.filter(s => s.grade === gradeFilter);
    if (statusFilter !== 'all') list = list.filter(s => (s as any).status === statusFilter);
    if (parentFilter !== 'all') list = list.filter(s => (s.parentIds || []).includes(parentFilter));

    if (sortField) {
      const directionFactor = sortDirection === 'asc' ? 1 : -1;

      list.sort((a, b) => {
        if (sortField === 'age') {
          return (getAgeSortValue(a) - getAgeSortValue(b)) * directionFactor;
        }

        let aValue = '';
        let bValue = '';

        if (sortField === 'student') {
          aValue = String(a.fullName || '').toLowerCase();
          bValue = String(b.fullName || '').toLowerCase();
        } else if (sortField === 'parents') {
          aValue = getParentSortValue(a);
          bValue = getParentSortValue(b);
        } else if (sortField === 'grade') {
          aValue = String(a.grade || '').toLowerCase();
          bValue = String(b.grade || '').toLowerCase();
        } else if (sortField === 'status') {
          aValue = String((a as any).status || '').toLowerCase();
          bValue = String((b as any).status || '').toLowerCase();
        }

        return (
          aValue.localeCompare(bValue, undefined, {
            numeric: true,
            sensitivity: 'base',
          }) * directionFactor
        );
      });
    }

    return list;
  }, [
    students,
    search,
    gradeFilter,
    statusFilter,
    parentFilter,
    parents,
    sortField,
    sortDirection,
    getParentSortValue,
  ]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const pagedStudentIds = paged.map(s => s.id);

  const enrollmentsQuery = useEnrollmentsForStudents(pagedStudentIds);

  const enrollmentsByStudent = useMemo(() => {
    const map: Record<string, EnrollmentLite[]> = {};
    if (!enrollmentsQuery.data) return map;
    (enrollmentsQuery.data as any[]).forEach((e: any) => {
      const sid = e.studentId || e.kidId || (e.kidIds && e.kidIds[0]);
      if (!sid) return;
      if (!map[sid]) map[sid] = [];
      map[sid].push(e as EnrollmentLite);
    });
    return map;
  }, [enrollmentsQuery.data]);

  const studentById = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  async function findEnrollmentForRequest(kidId: string, teacherId?: string): Promise<EnrollmentLite | null> {
    const enrollments: EnrollmentLite[] = [];
    const base = collection(db, 'enrollments');

    const q1 = query(base, where('kidId', '==', kidId));
    const q2 = query(base, where('kidIds', 'array-contains', kidId));

    for (const q of [q1, q2]) {
      const snap = await getDocs(q);
      snap.docs.forEach((d) => {
        enrollments.push({ id: d.id, ...(d.data() as any) } as EnrollmentLite);
      });
    }

    if (enrollments.length === 0) return null;

    const byTeacher = teacherId
      ? enrollments.find((e) => e.teacherId === teacherId)
      : null;

    return byTeacher || enrollments[0];
  }

  function openScheduleModal(student: Student) {
    const enrolls = enrollmentsByStudent[student.id] || [];
    if (enrolls.length === 0) {
      toast({
        title: 'No enrollment found',
        description: 'Assign a course first, then schedule recurring classes.',
        variant: 'destructive',
      });
      return;
    }

    const first = enrolls[0];

    setScheduleFor(student);
    setScheduleEnrollmentId(first.id);
    setGenerateWeeks(8);
    setEndDate('');
    applyScheduleFormFromEnrollment(first);
  }

  async function handleSaveSchedule() {
    if (!scheduleFor) return;

    const enrolls = enrollmentsByStudent[scheduleFor.id] || [];
    const selectedEnrollment = enrolls.find(e => e.id === scheduleEnrollmentId);

    if (!scheduleEnrollmentId || !selectedEnrollment) {
      toast({ title: 'Select an enrollment', variant: 'destructive' });
      return;
    }

    const enrollStart = parseISODateOnly(enrollmentStartDate);
    const classStart = parseISODateOnly(classesStartDate);
    const classEnd = endDate ? parseISODateOnly(endDate) : null;
    if (!enrollStart || !classStart) {
      toast({ title: 'Invalid start date', variant: 'destructive' });
      return;
    }
    if (endDate && !classEnd) {
      toast({ title: 'Invalid end date', variant: 'destructive' });
      return;
    }
    if (classEnd && classEnd.getTime() < classStart.getTime()) {
      toast({ title: 'End date must be after classes start date', variant: 'destructive' });
      return;
    }

    if (!timeHHmm || !/^\d{2}:\d{2}$/.test(timeHHmm)) {
      toast({ title: 'Invalid time', description: 'Use HH:MM format.', variant: 'destructive' });
      return;
    }

    if (!Array.isArray(weekdays) || weekdays.length === 0) {
      toast({ title: 'Pick at least one weekday', variant: 'destructive' });
      return;
    }

    const fee = safeNumber(feePerClass, 0);
    if (fee <= 0) {
      toast({ title: 'Fee per class required', description: 'Enter a fee > 0.', variant: 'destructive' });
      return;
    }

    const dur = Math.max(10, Math.min(180, safeNumber(durationMins, 35)));
    const weeks = Math.max(1, Math.min(52, safeNumber(generateWeeks, 8)));
    const planned = Math.max(0, Math.min(365, safeNumber(plannedSessions, 0)));

    setSavingSchedule(true);
    try {
      // 1) Update enrollment with start date + fee + schedule
      const enrollmentRef = doc(db, 'enrollments', scheduleEnrollmentId);
      await updateDoc(enrollmentRef, {
        startDate: Timestamp.fromDate(enrollStart),
        startDateYmd: enrollmentStartDate,
        classesStartDate: Timestamp.fromDate(classStart),
        classesStartDateYmd: classesStartDate,
        feePerClass: fee,
        currency: 'INR',
        joinUrl: meetingLink ? meetingLink : null,
        schedule: {
          timezone: 'Asia/Kolkata',
          weekdays,
          timeHHmm,
          durationMins: dur,
          weeksAhead: weeks,
          plannedSessions: planned > 0 ? planned : null,
          endDateYmd: endDate || null,
        },
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid || null,
      });

      // 2) Call Cloud Function to generate sessions
      const functions = getFunctions(undefined, 'asia-south1');
      const createSessionsFromSchedule = httpsCallable<
        {
          enrollmentId: string;
          weeksAhead?: number;
          plannedSessions?: number;
          replaceFuture?: boolean;
          startDate?: string;
          endDate?: string;
        },
        {
          created: number;
          skipped: number;
          replaced?: number;
          plannedSessionsTarget?: number | null;
          plannedSessionsGenerated?: number;
          rangeStart: string;
          rangeEnd: string;
          rangeStartYmd?: string;
          rangeEndYmd?: string;
        }
      >(functions, 'createSessionsFromSchedule');

      const result = await createSessionsFromSchedule({
        enrollmentId: scheduleEnrollmentId,
        weeksAhead: weeks,
        ...(planned > 0 ? { plannedSessions: planned } : {}),
        replaceFuture: true,
        startDate: classesStartDate,
        ...(endDate ? { endDate } : {}),
      });

      const {
        created,
        skipped,
        replaced,
        plannedSessionsTarget,
        plannedSessionsGenerated,
      } = result.data;
      const plannedSummary =
        plannedSessionsTarget && plannedSessionsGenerated !== undefined
          ? ` · planned ${plannedSessionsGenerated}/${plannedSessionsTarget}`
          : '';

      toast({
        title: 'Schedule saved',
        description:
          typeof replaced === 'number'
            ? `✅ Updated schedule: replaced ${replaced}, created ${created}, skipped ${skipped}${plannedSummary}`
            : `✅ Created ${created} sessions (${skipped} already existed)${plannedSummary}`,
      });

      setScheduleFor(null);
      enrollmentsQuery.refetch();
    } catch (err: any) {
      console.error('Error saving schedule:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to save schedule / create sessions.',
        variant: 'destructive',
      });
    } finally {
      setSavingSchedule(false);
    }
  }

  async function handleApproveRequest(req: SessionRequestRow) {
    if (user?.role !== 'admin') return;
    if (!req.kidId || !req.teacherId) {
      toast({ title: 'Missing data', description: 'Request is missing kid or teacher.', variant: 'destructive' });
      return;
    }

    setRequestActionId(req.id);
    try {
      const enrollment = await findEnrollmentForRequest(req.kidId, req.teacherId);
      const student = studentById.get(req.kidId);

      const parentIds = (student?.parentIds || enrollment?.parentIds || []).filter(Boolean);
      const parentId = student?.primaryParentId || enrollment?.parentId || parentIds[0] || null;

      const feeAmount = safeNumber(enrollment?.feePerClass, 0);
      const currency = enrollment?.currency || 'INR';
      const courseId = enrollment?.courseId || null;
      const joinUrl = enrollment?.joinUrl || null;
      const enrollmentId = enrollment?.id || null;

      const startAt = req.startAt;
      const endAt = req.endAt;
      const dateStr = toISODate(startAt);
      const startTime = formatTimeHHmm(startAt);
      const endTime = formatTimeHHmm(endAt);
      const hhmmCompact = startTime.replace(":", "");
      if (!enrollmentId) {
        throw new Error('No active enrollment found for this request.');
      }
      const sessionId = `${enrollmentId}_${dateStr.replace(/-/g, "")}_${hhmmCompact}`;

      const payload = {
        enrollmentId,
        kidId: req.kidId,
        kidIds: [req.kidId],
        parentId,
        parentIds,
        teacherId: req.teacherId,
        courseId,
        startAt: Timestamp.fromDate(startAt),
        endAt: Timestamp.fromDate(endAt),
        date: dateStr,
        startTime,
        endTime,
        status: 'scheduled',
        attendance: null,
        feeAmount,
        currency,
        joinUrl,
        notes: req.note || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user?.uid || 'admin',
        updatedBy: user?.uid || 'admin',
        source: 'admin_approved_request',
      };

      const classSessionRef = doc(getClassSessionsCollection(), sessionId);
      await setDoc(classSessionRef, payload, { merge: true });

      await deleteDoc(doc(db, req.path));
      toast({ title: 'Session approved', description: 'Session created and request removed.' });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Approve failed',
        description: err?.message || 'Unable to approve request.',
        variant: 'destructive',
      });
    } finally {
      setRequestActionId(null);
    }
  }

  const handleSyncCourseCatalog = async () => {
    if (!isAdmin || syncStatus.running) return;

    const confirmed = window.confirm('Sync the course catalog with the standard 7 courses?');
    if (!confirmed) return;

    setSyncStatus({ running: true });
    try {
      for (const course of COURSE_CATALOG_SYNC) {
        const ref = doc(db, 'courses', course.id);
        const snap = await getDoc(ref);
        const existing = snap.exists() ? (snap.data() as any) : {};

        const payload: Record<string, unknown> = {
          title: course.title,
          name: course.title,
          area: course.area,
          level: course.level,
          status: 'active',
          active: true,
          durationMinutes: typeof existing?.durationMinutes === 'number'
            ? existing.durationMinutes
            : 35,
          updatedAt: serverTimestamp(),
          updatedBy: user?.uid ?? null,
        };

        if (!snap.exists() || !existing?.createdAt) {
          payload.createdAt = serverTimestamp();
        }
        if (!snap.exists() || !existing?.createdBy) {
          payload.createdBy = user?.uid ?? null;
        }

        await setDoc(ref, payload, { merge: true });
      }

      const legacyCourseIds = ['intermediate-grammar', 'intermediate-public-speaking'];
      for (const legacyId of legacyCourseIds) {
        const ref = doc(db, 'courses', legacyId);
        const snap = await getDoc(ref);
        if (!snap.exists()) continue;
        await setDoc(
          ref,
          {
            status: 'archived',
            active: false,
            updatedAt: serverTimestamp(),
            updatedBy: user?.uid ?? null,
          },
          { merge: true },
        );
      }

      toast({
        title: 'Course catalog synced',
        description: 'Standard courses are now active in /courses.',
      });
    } catch (err: any) {
      console.error('Sync course catalog failed', err);
      toast({
        title: 'Sync failed',
        description: err?.message || 'Unable to sync courses.',
        variant: 'destructive',
      });
    } finally {
      setSyncStatus({ running: false });
    }
  };

  const isCurriculumSyncing =
    syncCurriculumStatus.phonics || syncCurriculumStatus.grammar || syncCurriculumStatus.speaking;

  const mergeCurriculumTopics = (
    existingTopics: any[],
    area: 'phonics' | 'grammar' | 'speaking',
    courseIds: string[],
    newTopics: any[],
  ) => {
    const areaKey = area.toLowerCase();
    const courseIdSet = new Set(courseIds.map((id) => id.toLowerCase()));
    const filtered = existingTopics.filter((topic) => {
      const topicArea = String(topic?.area ?? '').toLowerCase();
      const topicCourseId = String(topic?.courseId ?? '').toLowerCase();
      return !(topicArea === areaKey || courseIdSet.has(topicCourseId));
    });
    return [...filtered, ...newTopics];
  };

  const syncCurriculumArea = async (options: {
    area: 'phonics' | 'grammar' | 'speaking';
    label: string;
    topics: any[];
    courseIds: string[];
  }) => {
    if (!isAdmin || isCurriculumSyncing || syncCurriculumStatus[options.area]) return;

    const confirmed = window.confirm(`Sync ${options.label} curriculum topics to Firestore?`);
    if (!confirmed) return;

    setSyncCurriculumStatus((prev) => ({ ...prev, [options.area]: true }));
    try {
      const curriculumRef = doc(db, 'config', 'curriculumTopics');
      const snap = await getDoc(curriculumRef);
      const existing = snap.exists() ? (snap.data() as any) : {};
      const existingTopics = Array.isArray(existing?.topics) ? existing.topics : [];

      const updatedTopics = mergeCurriculumTopics(
        existingTopics,
        options.area,
        options.courseIds,
        options.topics,
      );
      const hadExisting = updatedTopics.length !== options.topics.length;

      const payload: Record<string, unknown> = {
        topics: updatedTopics,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid ?? null,
      };

      if (!snap.exists() || !existing?.createdAt) {
        payload.createdAt = serverTimestamp();
      }
      if (!snap.exists() || !existing?.createdBy) {
        payload.createdBy = user?.uid ?? null;
      }

      await setDoc(curriculumRef, payload, { merge: true });

      toast({
        title: hadExisting ? 'Curriculum updated' : 'Curriculum synced',
        description: hadExisting
          ? `Curriculum updated (${options.topics.length} topics).`
          : `${options.label} curriculum topics are now available.`,
      });
    } catch (err: any) {
      console.error('Sync curriculum failed', err);
      toast({
        title: 'Sync failed',
        description: err?.message || 'Unable to sync curriculum.',
        variant: 'destructive',
      });
    } finally {
      setSyncCurriculumStatus((prev) => ({ ...prev, [options.area]: false }));
    }
  };

  const handleSyncCurriculumPhonics = () =>
    syncCurriculumArea({
      area: 'phonics',
      label: 'Phonics',
      topics: PHONICS_CURRICULUM_TOPICS,
      courseIds: ['phonics-foundations', 'early-phonics', 'advanced-phonics'],
    });

  const handleSyncCurriculumGrammar = () =>
    syncCurriculumArea({
      area: 'grammar',
      label: 'Grammar',
      topics: GRAMMAR_CURRICULUM_TOPICS,
      courseIds: ['basic-grammar', 'advanced-grammar'],
    });

  const handleSyncCurriculumSpeaking = () =>
    syncCurriculumArea({
      area: 'speaking',
      label: 'Speaking',
      topics: SPEAKING_CURRICULUM_TOPICS,
      courseIds: ['basic-public-speaking', 'advanced-public-speaking'],
    });

  async function handleRejectRequest(req: SessionRequestRow) {
    if (user?.role !== 'admin') return;
    const confirmed = window.confirm('Reject this session request?');
    if (!confirmed) return;

    setRequestActionId(req.id);
    try {
      await deleteDoc(doc(db, req.path));
      toast({ title: 'Request rejected', description: 'Request removed.' });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Reject failed',
        description: err?.message || 'Unable to reject request.',
        variant: 'destructive',
      });
    } finally {
      setRequestActionId(null);
    }
  }

  function toggleWeekday(day: number) {
    setWeekdays(prev => (prev.includes(day) ? prev.filter(x => x !== day) : [...prev, day].sort((a, b) => a - b)));
  }

  const canManageStudent = (student: Student) =>
    Boolean(
      user?.role === 'admin' ||
      (user?.role === 'learningPartner' && ((student as any).lpId === user.uid))
    );

  const getVisibleEnrollmentsForStudent = (studentId: string): EnrollmentLite[] => {
    const allEnrollments = enrollmentsByStudent[studentId] || [];
    return allEnrollments.filter((enrollment: EnrollmentLite) => {
      const status = normalizeEnrollmentStatus(enrollment.status);
      const isPast = isPastEnrollmentStatus(status);
      return enrollmentStatusTab === 'active' ? !isPast : isPast;
    });
  };

  const formatParentSummary = (student: Student): string => {
    const labels = getParentLabelsForStudent(student);

    if (labels.length === 0) return '—';
    if (labels.length === 1) return labels[0];
    return `${labels[0]} +${labels.length - 1} more`;
  };

  const enrollmentDetails = enrollmentDetailsFor
    ? getVisibleEnrollmentsForStudent(enrollmentDetailsFor.id)
    : [];
  const canManageEnrollmentDetails = enrollmentDetailsFor
    ? canManageStudent(enrollmentDetailsFor)
    : false;
  const canManageActionsFor = actionsFor ? canManageStudent(actionsFor) : false;

  useEffect(() => {
    setPage(0);
  }, [search, gradeFilter, statusFilter, parentFilter, enrollmentStatusTab, rowsPerPage, sortField, sortDirection]);

  const handleSort = (field: StudentSortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortField(field);
    setSortDirection('asc');
  };

  const sortIndicator = (field: StudentSortField): string => {
    if (sortField !== field) return '↕';
    return sortDirection === 'asc' ? '▲' : '▼';
  };

  return (
    <div className="space-y-4">
      {isAdmin ? (
        <div className="flex justify-end">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSyncCourseCatalog}
              disabled={syncStatus.running}
              className="h-8 text-xs"
            >
              {syncStatus.running ? 'Syncing Courses...' : 'Sync Course Catalog'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSyncCurriculumPhonics}
              disabled={isCurriculumSyncing}
              className="h-8 text-xs"
            >
              {syncCurriculumStatus.phonics ? 'Syncing Curriculum...' : 'Sync Curriculum (Phonics)'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSyncCurriculumGrammar}
              disabled={isCurriculumSyncing}
              className="h-8 text-xs"
            >
              {syncCurriculumStatus.grammar ? 'Syncing Grammar...' : 'Sync Curriculum (Grammar)'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSyncCurriculumSpeaking}
              disabled={isCurriculumSyncing}
              className="h-8 text-xs"
            >
              {syncCurriculumStatus.speaking ? 'Syncing Speaking...' : 'Sync Curriculum (Speaking)'}
            </Button>
          </div>
        </div>
      ) : null}

      <Card className="p-3">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search name or parent email"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Grade"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              <SelectItem value="Pre-K">Pre-K</SelectItem>
              <SelectItem value="KG">KG</SelectItem>
              <SelectItem value="Grade 1">Grade 1</SelectItem>
              <SelectItem value="Grade 2">Grade 2</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Select value={parentFilter} onValueChange={setParentFilter}>
            <SelectTrigger className="w-[250px]"><SelectValue placeholder="Filter by parent"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Parents</SelectItem>
              {parents.map(p => (
                <SelectItem key={(p as any).uid || p.id} value={(p as any).uid || p.id}>
                  {p.email} — {p.name || p.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {user?.role === 'admin' ? (
            <div className="ml-auto">
              <Button
                size="sm"
                variant="outline"
                className="h-9 text-xs"
                onClick={() => setSessionRequestsOpen(true)}
              >
                Session Requests
                <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700">
                  {sessionRequests.length}
                </span>
              </Button>
            </div>
          ) : null}
        </div>
      </Card>

      {isAdmin ? (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-2">
            <div>
              <div className="text-sm font-medium text-gray-700">Reschedule Credits Monitor</div>
              <div className="text-xs text-gray-500">Operational status by student and teacher</div>
            </div>
            <div className="text-xs text-gray-600">
              Open: <span className="font-semibold">{rescheduleCreditsTotals.open}</span>
              <span className="mx-2 text-gray-300">|</span>
              Scheduled: <span className="font-semibold">{rescheduleCreditsTotals.scheduled}</span>
              <span className="mx-2 text-gray-300">|</span>
              Consumed: <span className="font-semibold">{rescheduleCreditsTotals.consumed}</span>
            </div>
          </div>

          {rescheduleCreditsMonitorLoading ? (
            <div className="p-4 text-sm text-gray-500">Loading reschedule credits...</div>
          ) : rescheduleCreditsMonitorRows.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No reschedule credits yet.</div>
          ) : (
            <div className="max-h-56 overflow-auto">
              <Table className="w-full text-sm">
                <TableHeader className="sticky top-0 z-20 bg-slate-50">
                  <TableRow>
                    <TableHead className="w-[220px]">Student</TableHead>
                    <TableHead className="w-[220px]">Teacher</TableHead>
                    <TableHead className="w-[90px] text-right">Open</TableHead>
                    <TableHead className="w-[90px] text-right">Scheduled</TableHead>
                    <TableHead className="w-[90px] text-right">Consumed</TableHead>
                    <TableHead className="w-[90px] text-right">Total</TableHead>
                    <TableHead className="w-[180px]">Last Update</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rescheduleCreditsMonitorRows.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell className="font-medium">
                        <div className="truncate" title={row.studentName}>{row.studentName}</div>
                        <div className="text-[11px] text-gray-500">{row.kidId}</div>
                      </TableCell>
                      <TableCell>
                        <div className="truncate" title={row.teacherName}>{row.teacherName}</div>
                        <div className="text-[11px] text-gray-500">{row.teacherId || 'unassigned'}</div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-amber-700">{row.open}</TableCell>
                      <TableCell className="text-right font-semibold text-blue-700">{row.scheduled}</TableCell>
                      <TableCell className="text-right font-semibold text-emerald-700">{row.consumed}</TableCell>
                      <TableCell className="text-right">{row.total}</TableCell>
                      <TableCell className="text-xs text-gray-600">
                        {row.lastUpdatedAt ? formatDateTime(row.lastUpdatedAt) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-2">
          <div className="text-sm font-medium text-gray-700">Enrollments</div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setEnrollmentStatusTab('active')}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                enrollmentStatusTab === 'active'
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-200 bg-white text-gray-700'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setEnrollmentStatusTab('past')}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                enrollmentStatusTab === 'past'
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-200 bg-white text-gray-700'
              }`}
            >
              Past
            </button>
          </div>
        </div>
        <div className="relative max-h-[62vh] overflow-auto">
          <Table className="w-full table-fixed text-sm">
            <TableHeader className="sticky top-0 z-30 bg-slate-50">
              <TableRow>
                <TableHead className="sticky top-0 z-30 w-[180px] bg-slate-50 px-3 py-2 text-xs font-semibold shadow-sm">
                  <button type="button" className="inline-flex items-center gap-1 hover:text-blue-700" onClick={() => handleSort('student')}>
                    <span>Student</span>
                    <span className="text-[10px] leading-none">{sortIndicator('student')}</span>
                  </button>
                </TableHead>
                <TableHead className="sticky top-0 z-30 w-[240px] bg-slate-50 px-3 py-2 text-xs font-semibold shadow-sm">
                  <button type="button" className="inline-flex items-center gap-1 hover:text-blue-700" onClick={() => handleSort('parents')}>
                    <span>Parents</span>
                    <span className="text-[10px] leading-none">{sortIndicator('parents')}</span>
                  </button>
                </TableHead>
                <TableHead className="sticky top-0 z-30 w-[70px] bg-slate-50 px-3 py-2 text-xs font-semibold shadow-sm">
                  <button type="button" className="inline-flex items-center gap-1 hover:text-blue-700" onClick={() => handleSort('age')}>
                    <span>Age</span>
                    <span className="text-[10px] leading-none">{sortIndicator('age')}</span>
                  </button>
                </TableHead>
                <TableHead className="sticky top-0 z-30 w-[90px] bg-slate-50 px-3 py-2 text-xs font-semibold shadow-sm">
                  <button type="button" className="inline-flex items-center gap-1 hover:text-blue-700" onClick={() => handleSort('grade')}>
                    <span>Grade</span>
                    <span className="text-[10px] leading-none">{sortIndicator('grade')}</span>
                  </button>
                </TableHead>
                <TableHead className="sticky top-0 z-30 w-[90px] bg-slate-50 px-3 py-2 text-xs font-semibold shadow-sm">
                  <button type="button" className="inline-flex items-center gap-1 hover:text-blue-700" onClick={() => handleSort('status')}>
                    <span>Status</span>
                    <span className="text-[10px] leading-none">{sortIndicator('status')}</span>
                  </button>
                </TableHead>
                <TableHead className="sticky top-0 z-30 w-[220px] bg-slate-50 px-3 py-2 text-xs font-semibold shadow-sm">Enrollments</TableHead>
                <TableHead className="sticky top-0 z-30 w-[110px] bg-slate-50 px-3 py-2 text-xs font-semibold shadow-sm">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paged.map(s => {
                const filteredEnrollments = getVisibleEnrollmentsForStudent(s.id);
                const enrollmentSummary =
                  filteredEnrollments.length > 0
                    ? `${filteredEnrollments.length} ${enrollmentStatusTab === 'active' ? 'active' : 'past'} enrollment${filteredEnrollments.length === 1 ? '' : 's'}`
                    : enrollmentStatusTab === 'active'
                      ? 'No active enrollments'
                      : 'No past enrollments';

                return (
                  <TableRow key={s.id}>
                    <TableCell className="px-3 py-2 whitespace-nowrap">
                      <span className="font-medium">{s.fullName || '—'}</span>
                    </TableCell>
                    <TableCell className="px-3 py-2 max-w-[240px]">
                      <span className="block truncate whitespace-nowrap" title={formatParentSummary(s)}>
                        {formatParentSummary(s)}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-2 whitespace-nowrap">{displayAgeYears(s)}</TableCell>
                    <TableCell className="px-3 py-2 whitespace-nowrap">{s.grade || '—'}</TableCell>
                    <TableCell className="px-3 py-2 whitespace-nowrap">{(s as any).status || '—'}</TableCell>
                    <TableCell className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">{enrollmentSummary}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={() => setEnrollmentDetailsFor(s)}
                        >
                          View
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2 whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={() => setActionsFor(s)}
                      >
                        Actions
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>Showing {filtered.length} students</div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500">Per page</span>
            <Select
              value={String(rowsPerPage)}
              onValueChange={(value) => setRowsPerPage(Number(value))}
            >
              <SelectTrigger className="h-8 w-[84px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
              Prev
            </Button>
            <span>Page {page + 1} / {pageCount}</span>
            <Button onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1}>
              Next
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={sessionRequestsOpen} onOpenChange={setSessionRequestsOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Session Requests</DialogTitle>
          </DialogHeader>

          {sessionRequests.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-500">
              No pending requests.
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-auto rounded-lg border border-slate-100">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 z-10 bg-white">Teacher</TableHead>
                    <TableHead className="sticky top-0 z-10 bg-white">Student</TableHead>
                    <TableHead className="sticky top-0 z-10 bg-white">Date & Time</TableHead>
                    <TableHead className="sticky top-0 z-10 bg-white">Duration</TableHead>
                    <TableHead className="sticky top-0 z-10 bg-white">Note</TableHead>
                    <TableHead className="sticky top-0 z-10 bg-white">Status</TableHead>
                    <TableHead className="sticky top-0 z-10 bg-white">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessionRequests.map((req) => {
                    const student = studentById.get(req.kidId);
                    return (
                      <TableRow key={req.id}>
                        <TableCell className="text-xs">{req.teacherId || '—'}</TableCell>
                        <TableCell>{student?.fullName || req.kidId || '—'}</TableCell>
                        <TableCell>{formatDateTime(req.startAt)}</TableCell>
                        <TableCell>{req.durationMins} min</TableCell>
                        <TableCell className="max-w-[260px] text-xs" title={req.note || '—'}>
                          <span className="block truncate">{req.note || '—'}</span>
                        </TableCell>
                        <TableCell className="text-xs">{req.status || 'requested'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleApproveRequest(req)}
                              disabled={requestActionId === req.id}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleRejectRequest(req)}
                              disabled={requestActionId === req.id}
                            >
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!enrollmentDetailsFor} onOpenChange={(open) => !open && setEnrollmentDetailsFor(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Enrollments {enrollmentDetailsFor?.fullName ? `— ${enrollmentDetailsFor.fullName}` : ''}
            </DialogTitle>
          </DialogHeader>

          {enrollmentDetailsFor ? (
            <div className="space-y-3">
              <div className="text-xs text-gray-500">
                Showing {enrollmentStatusTab === 'active' ? 'active' : 'past'} enrollments
              </div>
              {enrollmentDetails.length > 0 ? (
                <div className="space-y-2">
                  {enrollmentDetails.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2"
                    >
                      <div className="min-w-0 text-sm">
                        <div className="truncate font-semibold" title={enrollment.course?.title || enrollment.courseId}>
                          {enrollment.course?.title || enrollment.courseId || 'Course'}
                        </div>
                        <div className="truncate text-xs text-gray-500" title={enrollment.teacher?.name || enrollment.teacher?.email || ''}>
                          {enrollment.teacher ? enrollment.teacher.name || enrollment.teacher.email : 'Teacher unassigned'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {normalizeEnrollmentStatus(enrollment.status)}
                          {safeNumber(enrollment.feePerClass, 0) > 0 ? ` · ₹${enrollment.feePerClass}/class` : ''}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleDeleteEnrollment(enrollment.id)}
                        disabled={!canManageEnrollmentDetails}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                  {enrollmentStatusTab === 'active' ? 'No active enrollments' : 'No past enrollments'}
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!actionsFor} onOpenChange={(open) => !open && setActionsFor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Actions {actionsFor?.fullName ? `— ${actionsFor.fullName}` : ''}
            </DialogTitle>
          </DialogHeader>

          {actionsFor ? (
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="h-8 text-xs"
                onClick={() => {
                  onEdit(actionsFor);
                  setActionsFor(null);
                }}
              >
                Edit age
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="h-8 text-xs"
                onClick={() => {
                  onEdit(actionsFor);
                  setActionsFor(null);
                }}
              >
                Edit student
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  onAssignCourse(actionsFor);
                  setActionsFor(null);
                }}
                disabled={!canManageActionsFor}
              >
                Course
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setAssignTeacherFor(actionsFor);
                  setActionsFor(null);
                }}
                disabled={!canManageActionsFor}
              >
                Teacher
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setAssignLPFor(actionsFor);
                  setActionsFor(null);
                }}
                disabled={!isAdmin}
              >
                LP
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => {
                  setActionsFor(null);
                  openScheduleModal(actionsFor);
                }}
                disabled={!canManageActionsFor}
              >
                Schedule
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="col-span-2 h-8 text-xs"
                onClick={() => {
                  onDelete(actionsFor.id);
                  setActionsFor(null);
                }}
              >
                Delete student
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {assignCourseFor && (
        <AssignCourseModal
          student={assignCourseFor}
          onClose={() => setAssignCourseFor(null)}
          onAssigned={() => {
            setAssignCourseFor(null);
            enrollmentsQuery.refetch();
          }}
        />
      )}

      {assignTeacherFor && (
        <AssignTeacherModal
          student={assignTeacherFor}
          onClose={() => setAssignTeacherFor(null)}
          onAssigned={() => {
            setAssignTeacherFor(null);
            enrollmentsQuery.refetch();
          }}
        />
      )}

      {assignLPFor && (
        <AssignLPModal
          student={assignLPFor}
          onClose={() => setAssignLPFor(null)}
          onAssigned={() => {
            setAssignLPFor(null);
            enrollmentsQuery.refetch();
          }}
        />
      )}

      {/* ✅ NEW: Schedule Classes Modal */}
      <Dialog open={!!scheduleFor} onOpenChange={(open) => !open && setScheduleFor(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Schedule Classes {scheduleFor?.fullName ? `— ${scheduleFor.fullName}` : ''}
            </DialogTitle>
          </DialogHeader>

          {scheduleFor ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-sm font-medium mb-1">Enrollment (Course)</div>
                  <Select
                    value={scheduleEnrollmentId}
                    onValueChange={(value) => {
                      setScheduleEnrollmentId(value);
                      const selected = (enrollmentsByStudent[scheduleFor.id] || []).find((e) => e.id === value);
                      if (selected) {
                        applyScheduleFormFromEnrollment(selected);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select enrollment" />
                    </SelectTrigger>
                    <SelectContent>
                      {(enrollmentsByStudent[scheduleFor.id] || []).map(e => (
                        <SelectItem key={e.id} value={e.id}>
                          {enrollmentLabel(e)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-gray-500 mt-1">
                    Tip: Assign course + teacher first if needed.
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Fee per class (₹)</div>
                  <Input
                    type="number"
                    min={0}
                    value={feePerClass}
                    onChange={(e) => setFeePerClass(safeNumber(e.target.value, 0))}
                    placeholder="e.g., 599"
                  />
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Enrollment start date</div>
                  <Input
                    type="date"
                    value={enrollmentStartDate}
                    onChange={(e) => setEnrollmentStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Classes start date</div>
                  <Input
                    type="date"
                    value={classesStartDate}
                    onChange={(e) => setClassesStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Time (HH:MM)</div>
                  <Input
                    type="time"
                    value={timeHHmm}
                    onChange={(e) => setTimeHHmm(e.target.value)}
                  />
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Duration (minutes)</div>
                  <Input
                    type="number"
                    min={10}
                    max={180}
                    value={durationMins}
                    onChange={(e) => setDurationMins(safeNumber(e.target.value, 35))}
                  />
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Generate for (weeks)</div>
                  <Input
                    type="number"
                    min={1}
                    max={52}
                    value={generateWeeks}
                    onChange={(e) => setGenerateWeeks(safeNumber(e.target.value, 8))}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    We will create future sessions in Firestore → sessions.
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Planned classes (optional)</div>
                  <Input
                    type="number"
                    min={0}
                    max={365}
                    value={plannedSessions}
                    onChange={(e) => setPlannedSessions(safeNumber(e.target.value, 0))}
                    placeholder="e.g., 28"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    If set, schedule creation stops after this many class slots.
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">End date (optional)</div>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    If set, it overrides “weeks” as the date boundary.
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="text-sm font-medium mb-1">Weekdays</div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { d: 0, label: 'Sun' },
                      { d: 1, label: 'Mon' },
                      { d: 2, label: 'Tue' },
                      { d: 3, label: 'Wed' },
                      { d: 4, label: 'Thu' },
                      { d: 5, label: 'Fri' },
                      { d: 6, label: 'Sat' },
                    ].map(w => (
                      <Button
                        key={w.d}
                        type="button"
                        size="sm"
                        variant={weekdays.includes(w.d) ? 'default' : 'outline'}
                        onClick={() => toggleWeekday(w.d)}
                      >
                        {w.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="text-sm font-medium mb-1">Teams meeting link (optional)</div>
                  <Input
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="text-xs text-gray-500">
                Note: Re-saving schedule replaces upcoming sessions so updated date/time/duration/link are applied.
              </div>
            </div>
          ) : null}

          <DialogFooter className="gap-2">
            <Button variant="secondary" onClick={() => setScheduleFor(null)} disabled={savingSchedule}>
              Cancel
            </Button>
            <Button onClick={handleSaveSchedule} disabled={savingSchedule}>
              {savingSchedule ? 'Saving...' : 'Save Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
