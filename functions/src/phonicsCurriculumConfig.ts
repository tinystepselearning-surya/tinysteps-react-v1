export type CanonicalPhonicsCourseId =
  | 'phonics-foundations'
  | 'early-phonics'
  | 'advanced-phonics';

export type CanonicalPhonicsRubricType =
  | 'single_sound'
  | 'short_vowels'
  | 'sound_set'
  | 'digraph'
  | 'vowel_team'
  | 'magic_e'
  | 'diphthong'
  | 'r_controlled'
  | 'alternate_vowel'
  | 'suffix_ending'
  | 'rule'
  | 'revision';

export type CanonicalPhonicsStage = {
  stageOrder: number;
  label: string;
  start: number;
  end: number;
};

export type CanonicalPhonicsTopic = {
  id: string;
  courseId: CanonicalPhonicsCourseId;
  courseLabel: string;
  area: 'phonics';
  lesson: string;
  lessonNumber: number;
  label: string;
  displayTitle: string;
  order: number;
  stageLabel: string;
  stageOrder: number;
  rubricType: CanonicalPhonicsRubricType;
};

/**
 * Server-safe shared source of truth for the Tiny Steps phonics curriculum.
 *
 * Keep this module free of Firebase/Node/browser-only imports. The Functions
 * enforcer and the web client both consume these exact runtime definitions so
 * lesson identity, ordering, stages and rubric metadata cannot drift between
 * client and server.
 */
export const PHONICS_CURRICULUM_REVISION = '2026-08-10';

const FOUNDATION_LESSONS = [
  'Letter S', 'Letter A', 'Letter T', 'Letter I', 'Letter P', 'Letter N',
  'Letter C', 'Letter K', 'Letter E', 'Letter H', 'Letter R', 'Letter M',
  'Letter D', 'Letter G', 'Letter O', 'Letter U', 'Letter L', 'Letter F',
  'Letter B', 'Letter J', 'Letter Z', 'Letter W', 'Letter V', 'Letter Y',
  'Letter X', 'Letter Q', 'Short Vowels', 'Revision 1', 'Revision 2',
  'Revision 3', 'Grand Revision',
] as const;

const EARLY_LESSONS = [
  'Letters S, A, T',
  'Letters I, P, N',
  'Letters M, D, G',
  'Letters O, C, K',
  'CK Rule',
  'Letters E, U, R',
  'Letters H, B, F',
  'Floss Rule',
  'Letters J, V, W',
  'Letters X, Y, Z',
  'QU Sound',
  'Short Vowels',
  'Digraph CH',
  'Digraphs SH and NG',
  'Digraphs TH and KN',
  'Vowel Team AI',
  'Vowel Team EE',
  'Vowel Team EA',
  'Vowel Team IE',
  'Vowel Team OA',
  'Magic E: A_E',
  'Magic E: E_E',
  'Magic E: I_E',
  'Magic E: O_E',
  'Magic E: U_E',
  'Rabbit Rule',
  'Monster LE',
  'Soft C and Hard C',
  'Soft G and Hard G',
  'Controlling R: AR',
  'Controlling R: OR',
  'Controlling R: ER, IR, UR',
  'Y as a Secret Vowel',
  'Diphthong OO',
  'Diphthongs OI and OY',
  'Diphthongs AU and AW',
  'Diphthongs OU and OW',
  'J Sounds',
  'The SHUN Family',
  'The Lazy Sound',
] as const;

const ADVANCED_LESSONS = [
  'Letter Sounds A–Z',
  'CK Rule',
  'Rabbit Rule',
  'Floss Rule',
  'Digraphs CH and TCH',
  'Digraphs SH and TH',
  'WH and PH',
  'Magic E: A_E and E_E',
  'Magic E: I_E, O_E, U_E',
  'Vowel Teams AI, EE, and EA',
  'Vowel Teams IE and OA',
  'Monster LE / Consonant LE',
  'Soft C and G, Hard C and G',
  'Y as a Secret Vowel',
  'Revision',
  '3 Different J Sounds',
  'Diphthongs OI, OY, AU, and AW',
  'Diphthongs OU and OW',
  'Diphthongs OO and UI',
  'The SHUN Sound Family',
  'Controlling R: AR',
  'Controlling R: OR',
  'Controlling R: IR, UR, ER',
  'Long A Sound Families',
  'Long E Sound Families',
  'Long I Sound Families',
  'Long O Sound Families',
  'Long U Sound Families',
  'Missing and Sleepy Sounds',
  'The Lazy Vowel Mystery',
] as const;

export const CANONICAL_PHONICS_STAGE_DEFINITIONS: Record<
  CanonicalPhonicsCourseId,
  CanonicalPhonicsStage[]
> = {
  'phonics-foundations': [
    { stageOrder: 1, label: 'Stage 1 — Letters S, A, T, I, P, N', start: 1, end: 6 },
    { stageOrder: 2, label: 'Stage 2 — Letters C, K, E, H, R, M', start: 7, end: 12 },
    { stageOrder: 3, label: 'Stage 3 — Letters D, G, O, U, L, F', start: 13, end: 18 },
    { stageOrder: 4, label: 'Stage 4 — Letters B, J, Z, W, V, Y', start: 19, end: 24 },
    { stageOrder: 5, label: 'Stage 5 — Letters X, Q + Short Vowels', start: 25, end: 27 },
    { stageOrder: 6, label: 'Stage 6 — Revision + Grand Revision', start: 28, end: 31 },
  ],
  'early-phonics': [
    { stageOrder: 1, label: 'Stage 1 — Core letter sets + first rules', start: 1, end: 12 },
    { stageOrder: 2, label: 'Stage 2 — Digraphs + vowel teams', start: 13, end: 20 },
    { stageOrder: 3, label: 'Stage 3 — Magic E + word rules', start: 21, end: 29 },
    { stageOrder: 4, label: 'Stage 4 — Controlling R + secret vowel', start: 30, end: 33 },
    { stageOrder: 5, label: 'Stage 5 — Diphthongs', start: 34, end: 37 },
    { stageOrder: 6, label: 'Stage 6 — J, SHUN + Lazy Sound', start: 38, end: 40 },
  ],
  'advanced-phonics': [
    { stageOrder: 1, label: 'Stage 1 — Core rules + digraphs', start: 1, end: 7 },
    { stageOrder: 2, label: 'Stage 2 — Magic E + vowel teams', start: 8, end: 14 },
    { stageOrder: 3, label: 'Stage 3 — Revision + advanced sound families', start: 15, end: 20 },
    { stageOrder: 4, label: 'Stage 4 — Controlling R', start: 21, end: 23 },
    { stageOrder: 5, label: 'Stage 5 — Long vowel sound families', start: 24, end: 28 },
    { stageOrder: 6, label: 'Stage 6 — Missing, sleepy + lazy vowel sounds', start: 29, end: 30 },
  ],
};

export const CANONICAL_PHONICS_COURSE_LABELS: Record<CanonicalPhonicsCourseId, string> = {
  'phonics-foundations': 'Foundation Phonics',
  'early-phonics': 'Early Phonics',
  'advanced-phonics': 'Advanced Phonics',
};

const stageForLesson = (
  courseId: CanonicalPhonicsCourseId,
  lessonNumber: number,
): CanonicalPhonicsStage => {
  const stage = CANONICAL_PHONICS_STAGE_DEFINITIONS[courseId].find(
    (candidate) => lessonNumber >= candidate.start && lessonNumber <= candidate.end,
  );
  if (!stage) throw new Error(`Missing phonics stage for ${courseId} lesson ${lessonNumber}`);
  return stage;
};

const inferRubricType = (
  courseId: CanonicalPhonicsCourseId,
  lessonNumber: number,
  label: string,
): CanonicalPhonicsRubricType => {
  const lower = label.toLowerCase();
  if (courseId === 'phonics-foundations') {
    if (lessonNumber <= 26) return 'single_sound';
    if (lessonNumber === 27) return 'short_vowels';
    return 'revision';
  }
  if (lower.includes('revision')) return 'revision';
  if (lower.includes('short vowels')) return 'short_vowels';
  if (lower.startsWith('letters ') || lower.includes('letter sounds')) return 'sound_set';
  if (lower.includes('digraph') || lower === 'wh and ph') return 'digraph';
  if (lower.includes('magic e')) return 'magic_e';
  if (lower.includes('vowel team')) return 'vowel_team';
  if (lower.includes('diphthong')) return 'diphthong';
  if (lower.includes('controlling r')) return 'r_controlled';
  if (lower.includes('monster le') || lower.includes('shun')) return 'suffix_ending';
  if (
    lower.includes('secret vowel') ||
    lower.includes('long a sound') ||
    lower.includes('long e sound') ||
    lower.includes('long i sound') ||
    lower.includes('long o sound') ||
    lower.includes('long u sound') ||
    lower.includes('lazy vowel') ||
    lower.includes('lazy sound') ||
    lower.includes('missing and sleepy')
  ) return 'alternate_vowel';
  return 'rule';
};

const buildTopics = (
  courseId: CanonicalPhonicsCourseId,
  labels: readonly string[],
): CanonicalPhonicsTopic[] => labels.map((label, index) => {
  const lessonNumber = index + 1;
  const stage = stageForLesson(courseId, lessonNumber);
  return {
    id: `${courseId}__lesson-${String(lessonNumber).padStart(2, '0')}`,
    courseId,
    courseLabel: CANONICAL_PHONICS_COURSE_LABELS[courseId],
    area: 'phonics',
    lesson: `Lesson-${lessonNumber}`,
    lessonNumber,
    label,
    displayTitle: `Lesson ${lessonNumber} — ${label}`,
    order: lessonNumber,
    stageLabel: stage.label,
    stageOrder: stage.stageOrder,
    rubricType: inferRubricType(courseId, lessonNumber, label),
  };
});

export const CANONICAL_PHONICS_TOPICS: CanonicalPhonicsTopic[] = [
  ...buildTopics('phonics-foundations', FOUNDATION_LESSONS),
  ...buildTopics('early-phonics', EARLY_LESSONS),
  ...buildTopics('advanced-phonics', ADVANCED_LESSONS),
];

export const CANONICAL_PHONICS_TOPIC_SIGNATURE = CANONICAL_PHONICS_TOPICS
  .map((topic) => `${topic.id}:${topic.label}:${topic.stageOrder}:${topic.rubricType}`)
  .join('|');

const PHONICS_COURSE_IDS = new Set<string>([
  'phonics-foundations',
  'early-phonics',
  'advanced-phonics',
]);

export function canonicalizeCurriculumTopics(existingTopics: unknown): unknown[] {
  const source = Array.isArray(existingTopics) ? existingTopics : [];
  const nonPhonics = source.filter((raw) => {
    if (!raw || typeof raw !== 'object') return true;
    const topic = raw as Record<string, unknown>;
    const area = String(topic.area || '').trim().toLowerCase();
    const courseId = String(topic.courseId || '').trim().toLowerCase();
    return area !== 'phonics' && !PHONICS_COURSE_IDS.has(courseId);
  });
  return [...nonPhonics, ...CANONICAL_PHONICS_TOPICS];
}

export function hasCanonicalPhonicsTopics(existingTopics: unknown): boolean {
  if (!Array.isArray(existingTopics)) return false;
  const phonicsTopics = existingTopics
    .filter((raw): raw is Record<string, unknown> => Boolean(raw && typeof raw === 'object'))
    .filter((topic) => {
      const area = String(topic.area || '').trim().toLowerCase();
      const courseId = String(topic.courseId || '').trim().toLowerCase();
      return area === 'phonics' || PHONICS_COURSE_IDS.has(courseId);
    });
  if (phonicsTopics.length !== CANONICAL_PHONICS_TOPICS.length) return false;
  const signature = phonicsTopics
    .map((topic) => `${String(topic.id || '')}:${String(topic.label || '')}:${Number(topic.stageOrder || 0)}:${String(topic.rubricType || '')}`)
    .join('|');
  return signature === CANONICAL_PHONICS_TOPIC_SIGNATURE;
}
