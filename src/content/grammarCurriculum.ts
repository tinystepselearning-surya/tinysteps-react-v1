export const GRAMMAR_CURRICULUM_REVISION = '2026.09.26';
export const GRAMMAR_CURRICULUM_SCHEMA_VERSION = 1;

export type GrammarCourseId = 'basic-grammar' | 'advanced-grammar';
export type GrammarRubricType =
  | 'concept'
  | 'sentence_building'
  | 'usage_practice'
  | 'writing_editing'
  | 'revision';

export type GrammarStage = {
  stageOrder: number;
  label: string;
  goal: string;
  learningOutcomes: string[];
  start: number;
  end: number;
};

export type GrammarLesson = {
  id: string;
  courseId: GrammarCourseId;
  area: 'grammar';
  lesson: string;
  lessonNumber: number;
  order: number;
  label: string;
  displayTitle: string;
  stageOrder: number;
  stageLabel: string;
  stageGoal: string;
  rubricType: GrammarRubricType;
  subskillChips: string[];
  confusionOptions: string[];
  curriculumRevision: string;
  schemaVersion: number;
};

export type GrammarCourse = {
  id: GrammarCourseId;
  label: string;
  publicSlug: string;
  aliases: string[];
  stages: GrammarStage[];
  lessons: GrammarLesson[];
};

const BASIC_LABELS = [
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
] as const;

const ADVANCED_LABELS = [
  'Subject, Verb & Object',
  'Simple Present Tense',
  'Simple Past Tense',
  'Simple Future Tense',
  'Simple Tenses Revision',
  'Expanding a Basic Sentence',
  'Present Time: Simple Present vs Present Continuous',
  'Past Time: Simple Past vs Past Continuous',
  'Talking About the Future Naturally',
  'Present Perfect & Simple Past',
  'Past Perfect & Event Sequence',
  'Tense Mastery: Speak, Write & Edit',
  'Forming Questions Naturally',
  'Negative Sentences & Short Answers',
  'Modal Verbs: Meaning & Choice',
  'Talking About Quantity Accurately',
  'Clear Pronoun Reference & Avoiding Repetition',
  'Grammar Accuracy Challenge',
  'Compound Sentences',
  'Expressing Reason & Result',
  'Expressing Time & Sequence',
  'Conditions & Possibilities',
  'Contrast & Concession',
  'Connecting Ideas Mastery',
  'Independent & Dependent Clauses',
  'Relative Clauses',
  'Sentence Combining & Sentence Variety',
  'Sentence Repair: Fragments, Run-ons & Awkward Sentences',
  'Direct & Reported Speech',
  'Active & Passive Voice + Tone',
  'Building a Powerful Paragraph',
  'Cohesion & Paragraph Flow',
  'Narrative Speaking & Writing',
  'Description & Explanation',
  'Opinion, Reason & Evidence',
  'Final Grammar, Speaking & Writing Mastery Showcase',
] as const;

const BASIC_STAGES: GrammarStage[] = [
  {
    stageOrder: 1, label: 'Stage 1 — Word Foundations', start: 1, end: 6,
    goal: 'Goal: Identify and understand the main basic word types.',
    learningOutcomes: [
      'Identify nouns, proper nouns, verbs, adjectives, and pronouns',
      'Understand that different words do different jobs',
      'Build a strong foundation in basic word types',
    ],
  },
  {
    stageOrder: 2, label: 'Stage 2 — Grammar Basics', start: 7, end: 12,
    goal: 'Goal: Learn core grammar rules and usage basics.',
    learningOutcomes: [
      'Understand one and many forms',
      'Use singular and plural nouns correctly',
      'Use a, an, and the correctly',
      'Use simple prepositions such as in, on, under, and near',
    ],
  },
  {
    stageOrder: 3, label: 'Stage 3 — Sentence Building', start: 13, end: 18,
    goal: 'Goal: Build correct sentences with proper punctuation.',
    learningOutcomes: [
      'Understand how a sentence starts and ends',
      'Use basic punctuation marks correctly',
      'Build simple sentences',
      'Form clear and meaningful sentences',
    ],
  },
  {
    stageOrder: 4, label: 'Stage 4 — Conjunctions and Adverbs', start: 19, end: 24,
    goal: 'Goal: Connect ideas and add detail to sentences.',
    learningOutcomes: [
      'Use conjunctions such as and, but, or, and because',
      'Understand adverbs that tell how, when, and where',
      'Make sentences longer, clearer, and more expressive',
    ],
  },
  {
    stageOrder: 5, label: 'Stage 5 — Tenses Basics', start: 25, end: 30,
    goal: 'Goal: Learn the three basic tenses in a simple and gradual way.',
    learningOutcomes: [
      'Understand simple present, simple past, and simple future',
      'Use tense clues in sentences',
      'Answer simple questions in sentence form',
      'Practise tense usage in simple sentences',
    ],
  },
  {
    stageOrder: 6, label: 'Stage 6 — Sentence Writing and Final Revision', start: 31, end: 36,
    goal: 'Goal: Apply learning to build and write meaningful sentences and short paragraphs.',
    learningOutcomes: [
      'Arrange words in the correct order to make sentences',
      'Improve short sentences by adding correct grammar and detail',
      'Describe a picture using clear sentences',
      'Write a short paragraph with support',
      'Revise the full beginner grammar syllabus',
    ],
  },
];

const ADVANCED_STAGES: GrammarStage[] = [
  {
    stageOrder: 1, label: 'Stage 1 — Sentence Foundations', start: 1, end: 6,
    goal: 'Goal: Build accurate sentences and control the three basic time frames.',
    learningOutcomes: ['Build complete and grammatically correct sentences', 'Use present, past, and future simple tenses accurately', 'Choose the correct tense according to time and meaning', 'Expand basic sentences with meaningful detail', 'Improve sentence clarity and structure'],
  },
  {
    stageOrder: 2, label: 'Stage 2 — Tense Control', start: 7, end: 12,
    goal: 'Goal: Use different tense forms naturally while speaking and writing.',
    learningOutcomes: ['Distinguish routines from actions happening now', 'Describe completed and ongoing past actions accurately', 'Talk naturally about future plans, arrangements, and predictions', 'Use present perfect to connect past experiences with the present', 'Sequence past events clearly using past perfect', 'Maintain accurate tense across connected speaking and writing'],
  },
  {
    stageOrder: 3, label: 'Stage 3 — Grammar Accuracy', start: 13, end: 18,
    goal: 'Goal: Speak and write with greater grammatical accuracy in everyday communication.',
    learningOutcomes: ['Form grammatically correct questions using natural word order', 'Build accurate negative sentences and short responses', 'Use modal verbs for ability, possibility, advice, permission, and obligation', 'Talk about quantity using appropriate expressions', 'Use pronouns clearly without confusing the reader or listener', 'Identify and correct common grammatical mistakes independently'],
  },
  {
    stageOrder: 4, label: 'Stage 4 — Connecting Ideas', start: 19, end: 24,
    goal: 'Goal: Join ideas smoothly and express relationships between them clearly.',
    learningOutcomes: ['Combine related ideas into compound sentences', 'Explain reasons and results clearly', 'Organise events using accurate time and sequence language', 'Express conditions, possibilities, and imagined situations', 'Connect contrasting ideas naturally', 'Turn short, disconnected sentences into fluent and connected English'],
  },
  {
    stageOrder: 5, label: 'Stage 5 — Advanced Sentence Craft', start: 25, end: 30,
    goal: 'Goal: Build, combine, vary, and edit more sophisticated sentence structures.',
    learningOutcomes: ['Understand how clauses work together to form complete sentences', 'Add information smoothly using relative clauses', 'Combine short sentences into richer and more mature structures', 'Recognise and correct fragments, run-ons, and awkward sentences', 'Use direct and reported speech accurately', 'Choose appropriate voice and tone according to purpose and audience'],
  },
  {
    stageOrder: 6, label: 'Stage 6 — Speaking & Writing Mastery', start: 31, end: 36,
    goal: 'Goal: Apply grammar confidently in independent speaking, writing, and editing.',
    learningOutcomes: ['Organise ideas into clear and well-developed paragraphs', 'Connect sentences smoothly and maintain logical flow', 'Narrate events using accurate tense and sentence variety', 'Describe and explain ideas clearly using precise language', 'Express opinions and support them with reasons and examples', 'Review, edit, and improve speaking and writing independently'],
  },
];

const RUBRIC_SUBSKILLS: Record<GrammarRubricType, string[]> = {
  concept: ['identify rule', 'definition recall', 'label parts', 'spot examples', 'sort words'],
  sentence_building: ['make a sentence', 'expand sentence', 'word order', 'join sentences', 'use connectors'],
  usage_practice: ['choose correct form', 'fill blanks correctly', 'apply rule in sentence', 'explain choice', 'spot the error'],
  writing_editing: ['fix punctuation', 'correct grammar mistake', 'rewrite better sentence', 'fix run-on/fragment', 'improve clarity'],
  revision: ['mixed practice', 'independent use', 'speed + accuracy', 'confidence', 'minimal teacher help'],
};

const RUBRIC_CONFUSIONS: Record<GrammarRubricType, string[]> = {
  concept: ['subject–verb agreement', 'tense confusion', 'articles a/an/the', 'prepositions', 'punctuation'],
  sentence_building: ['subject–verb agreement', 'tense confusion', 'articles a/an/the', 'prepositions', 'punctuation'],
  usage_practice: ['subject–verb agreement', 'tense confusion', 'articles a/an/the', 'prepositions', 'punctuation'],
  writing_editing: ['subject–verb agreement', 'tense confusion', 'articles a/an/the', 'prepositions', 'punctuation'],
  revision: [],
};

function rubricForLesson(order: number): GrammarRubricType {
  const stagePosition = order % 6;
  if (stagePosition === 0) return 'revision';
  if (stagePosition === 1 || stagePosition === 2) return 'concept';
  if (stagePosition === 3) return 'sentence_building';
  if (stagePosition === 4) return 'usage_practice';
  return 'writing_editing';
}

function lessonMetadata(label: string, fallback: GrammarRubricType) {
  const value = label.toLowerCase();
  if (value.includes('revision') || value.includes('showcase')) {
    return { rubricType: 'revision' as const, subskillChips: RUBRIC_SUBSKILLS.revision, confusionOptions: [] };
  }
  if (value.includes('noun')) return { rubricType: fallback, subskillChips: ['identify nouns', 'label nouns', 'sort nouns', 'use nouns in sentence', 'capitalize names'], confusionOptions: ['noun vs verb', 'noun vs pronoun', 'proper vs common'] };
  if (value.includes('pronoun')) return { rubricType: fallback, subskillChips: ['choose pronoun', 'replace noun', 'subject pronouns', 'pronoun agreement', 'use pronouns in sentence'], confusionOptions: ['he vs she', 'him vs he', 'they vs he'] };
  if (value.includes('irregular verb')) return { rubricType: fallback, subskillChips: ['irregular verb forms', 'choose correct form', 'use in sentence', 'read irregular verbs', 'spell irregular verbs'], confusionOptions: ['go vs went', 'see vs saw', 'have vs had'] };
  if (value.includes('verb') && !value.includes('adverb')) return { rubricType: fallback, subskillChips: ['identify verbs', 'choose correct verb', 'use action verbs', 'verb in sentence', 'verb agreement'], confusionOptions: ['is vs are', 'was vs were', 'do vs does'] };
  if (value.includes('adjective')) return { rubricType: fallback, subskillChips: ['identify adjectives', 'add adjective', 'choose describing word', 'expand sentence', 'use adjective in sentence'], confusionOptions: ['adjective vs noun', 'adjective vs adverb', 'wrong describing word'] };
  if (value.includes('article')) return { rubricType: fallback, subskillChips: ['a/an choice', 'use the', 'insert missing article', 'fix article errors', 'article in sentence'], confusionOptions: ['a vs an', 'a/an vs the', 'missing article'] };
  if (value.includes('preposition')) return { rubricType: fallback, subskillChips: ['identify prepositions', 'choose correct preposition', 'add preposition phrase', 'use in sentence', 'preposition picture match'], confusionOptions: ['in vs on', 'under vs over', 'at vs in'] };
  if (value.includes('adverb')) return { rubricType: fallback, subskillChips: ['identify adverbs', 'add adverb', 'choose adverb', 'edit for adverbs', 'use adverb in sentence'], confusionOptions: ['adverb vs adjective', 'too many adverbs', 'wrong adverb choice'] };
  if (value.includes('conjunction') || value.includes('join two sentences') || value.includes('compound') || value.includes('connecting')) return { rubricType: fallback, subskillChips: ['identify conjunctions', 'choose connector', 'join two sentences', 'use and/but/because', 'fix run-on'], confusionOptions: ['and vs but', 'because vs so', 'run-on sentence'] };
  if (value.includes('plural')) return { rubricType: fallback, subskillChips: ['make plural', 'choose s/es', 'singular vs plural', 'plural spelling', 'use plurals in sentence'], confusionOptions: ['s vs es', 'y to ies', 'singular vs plural'] };
  if (value.includes('run-on') || value.includes('fragment')) return { rubricType: fallback, subskillChips: ['spot run-on/fragment', 'split sentences', 'add punctuation', 'rewrite correctly', 'read for clarity'], confusionOptions: ['run-on vs complete', 'fragment vs sentence', 'missing punctuation'] };
  if (value.includes('question')) return { rubricType: fallback, subskillChips: ['use question words', 'write a question', 'question mark', 'question vs statement', 'edit questions'], confusionOptions: ['missing question mark', 'question vs statement', 'wrong word order'] };
  if (value.includes('exclamation')) return { rubricType: fallback, subskillChips: ['use exclamation mark', 'exclaim vs statement', 'punctuation choice', 'express excitement', 'edit punctuation'], confusionOptions: ['exclamation vs period', 'exclamation vs question', 'overuse of !'] };
  if (value.includes('capital')) return { rubricType: fallback, subskillChips: ['capitalize first word', 'capitalize names', 'fix capital errors', 'sentence basics', 'edit for capitals'], confusionOptions: ['missing capital', 'mid-sentence caps', 'name not capitalized'] };
  if (value.includes('punctuation')) return { rubricType: fallback, subskillChips: ['fix punctuation', 'choose correct end mark', 'edit sentence endings', 'read for clarity', 'rewrite correctly'], confusionOptions: ['missing punctuation', 'question vs statement', 'exclamation vs period'] };
  if (value.includes('tense') || value.includes('past') || value.includes('present') || value.includes('future')) return { rubricType: fallback, subskillChips: ['identify tense', 'choose correct tense', 'use time words', 'fix tense mistakes', 'write tense sentences'], confusionOptions: ['past vs present', 'present vs future', 'was vs were'] };
  if (value.includes('time words')) return { rubricType: fallback, subskillChips: ['time words meaning', 'choose correct time word', 'match time word to tense', 'use in sentence', 'spot time words'], confusionOptions: ['yesterday vs tomorrow', 'today vs tomorrow', 'last vs next'] };
  if (value.includes('perfect')) return { rubricType: fallback, subskillChips: ['use present perfect', 'use past perfect', 'use future perfect', 'choose auxiliary', 'edit perfect tense'], confusionOptions: ['has vs have', 'had vs has', 'been vs being'] };
  if (value.includes('modal')) return { rubricType: fallback, subskillChips: ['modal meaning', 'choose modal', 'use modal in sentence', 'edit modal sentence', 'spot modal'], confusionOptions: ['can vs could', 'should vs would', 'may vs might'] };
  if (value.includes('clause') || value.includes('condition') || value.includes('complex') || value.includes('sentence combining')) return { rubricType: fallback, subskillChips: ['identify clauses', 'independent vs dependent', 'combine clauses', 'punctuate clauses', 'fix fragments'], confusionOptions: ['fragment vs sentence', 'run-on vs clause', 'comma splice'] };
  if (value.includes('reported speech')) return { rubricType: fallback, subskillChips: ['change tense', 'use reporting verbs', 'convert direct to reported', 'pronoun shift', 'punctuate correctly'], confusionOptions: ['said vs told', 'tense shift missing', 'quote punctuation'] };
  if (value.includes('passive') || value.includes('active')) return { rubricType: fallback, subskillChips: ['active vs passive', 'convert to passive', 'use by-phrase', 'choose correct form', 'edit voice'], confusionOptions: ['active vs passive', 'was vs were', 'missing by-phrase'] };
  if (value.includes('transition') || value.includes('paragraph') || value.includes('cohesion')) return { rubricType: fallback, subskillChips: ['use transitions', 'topic sentence', 'supporting details', 'organize paragraph', 'edit for flow'], confusionOptions: ['missing transitions', 'off-topic detail', 'weak topic sentence'] };
  if (value.includes('tone') || value.includes('formality')) return { rubricType: fallback, subskillChips: ['formal vs informal', 'adjust tone', 'word choice', 'audience awareness', 'edit for tone'], confusionOptions: ['too casual', 'too formal', 'inconsistent tone'] };
  if (value.includes('claim') || value.includes('reason') || value.includes('evidence') || value.includes('counterargument') || value.includes('opinion')) return { rubricType: fallback, subskillChips: ['claim and reason', 'evidence sentence', 'counterargument', 'strong conclusion', 'word choice impact'], confusionOptions: ['claim vs reason', 'weak evidence', 'off-topic argument'] };
  if (value.includes('clarity')) return { rubricType: fallback, subskillChips: ['rewrite for clarity', 'remove extra words', 'correct grammar mistake', 'improve sentence flow', 'edit carefully'], confusionOptions: ['run-on sentence', 'fragment vs sentence', 'missing punctuation'] };
  return { rubricType: fallback, subskillChips: RUBRIC_SUBSKILLS[fallback], confusionOptions: RUBRIC_CONFUSIONS[fallback] };
}

function buildLessons(courseId: GrammarCourseId, labels: readonly string[], stages: GrammarStage[]): GrammarLesson[] {
  return labels.map((label, index) => {
    const order = index + 1;
    const stage = stages.find((candidate) => order >= candidate.start && order <= candidate.end);
    if (!stage) throw new Error(`Missing Grammar stage for ${courseId} lesson ${order}`);
    const metadata = lessonMetadata(label, rubricForLesson(order));
    return {
      id: `${courseId}__lesson-${String(order).padStart(2, '0')}`,
      courseId,
      area: 'grammar' as const,
      lesson: `Lesson-${order}`,
      lessonNumber: order,
      order,
      label,
      displayTitle: `Lesson ${order} — ${label}`,
      stageOrder: stage.stageOrder,
      stageLabel: stage.label,
      stageGoal: stage.goal,
      rubricType: metadata.rubricType,
      subskillChips: [...metadata.subskillChips],
      confusionOptions: [...metadata.confusionOptions],
      curriculumRevision: GRAMMAR_CURRICULUM_REVISION,
      schemaVersion: GRAMMAR_CURRICULUM_SCHEMA_VERSION,
    };
  });
}

export const GRAMMAR_COURSES: Record<GrammarCourseId, GrammarCourse> = {
  'basic-grammar': {
    id: 'basic-grammar', label: 'Basic Grammar', publicSlug: 'grammar',
    aliases: ['basic-grammar', 'grammar-essentials', 'grammar', 'intermediate-grammar'],
    stages: BASIC_STAGES,
    lessons: buildLessons('basic-grammar', BASIC_LABELS, BASIC_STAGES),
  },
  'advanced-grammar': {
    id: 'advanced-grammar', label: 'Advanced Grammar', publicSlug: 'grammar-mastery',
    aliases: ['advanced-grammar', 'grammar-mastery'],
    stages: ADVANCED_STAGES,
    lessons: buildLessons('advanced-grammar', ADVANCED_LABELS, ADVANCED_STAGES),
  },
};

export const GRAMMAR_CURRICULUM_TOPICS = [
  ...GRAMMAR_COURSES['basic-grammar'].lessons,
  ...GRAMMAR_COURSES['advanced-grammar'].lessons,
];

const GRAMMAR_ALIAS_TO_COURSE = new Map<string, GrammarCourseId>(
  (Object.values(GRAMMAR_COURSES) as GrammarCourse[])
    .flatMap((course) => course.aliases.map((alias) => [alias, course.id] as const)),
);

export function normalizeGrammarCourseId(value: unknown): GrammarCourseId | null {
  return GRAMMAR_ALIAS_TO_COURSE.get(String(value ?? '').trim().toLowerCase()) ?? null;
}

export function getGrammarCourse(value: unknown): GrammarCourse | null {
  const courseId = normalizeGrammarCourseId(value);
  return courseId ? GRAMMAR_COURSES[courseId] : null;
}

export function getGrammarLessons(value: unknown): GrammarLesson[] {
  return getGrammarCourse(value)?.lessons ?? [];
}

export function buildTeacherGrammarTopics(value: unknown) {
  const course = getGrammarCourse(value);
  if (!course) return [];
  return course.lessons.map((lesson) => ({
    id: lesson.id,
    courseId: lesson.courseId,
    courseLabel: course.label,
    area: lesson.area,
    lesson: lesson.lesson,
    label: lesson.label,
    displayTitle: lesson.displayTitle,
    order: lesson.order,
    stageLabel: lesson.stageLabel,
    stageOrder: lesson.stageOrder,
    rubricType: lesson.rubricType,
    subskillChips: [...lesson.subskillChips],
  }));
}

export function buildPublicGrammarStages(value: unknown) {
  const course = getGrammarCourse(value);
  if (!course) return [];
  return course.stages.map((stage) => ({
    title: stage.label,
    focus: stage.goal,
    learns: stage.learningOutcomes.length ? [...stage.learningOutcomes] : undefined,
    lessons: course.lessons
      .filter((lesson) => lesson.stageOrder === stage.stageOrder)
      .map((lesson) => lesson.displayTitle),
  }));
}

type UnknownRecord = Record<string, unknown>;

function isGrammarTopic(topic: unknown): boolean {
  if (!topic || typeof topic !== 'object') return false;
  const value = topic as UnknownRecord;
  if (normalizeGrammarCourseId(value.courseId ?? value.course)) return true;
  const id = String(value.id ?? value.topicId ?? '').trim().toLowerCase();
  return id.startsWith('basic-grammar__') || id.startsWith('advanced-grammar__');
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as UnknownRecord)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, stableValue(entry)]),
  );
}

function equalValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(stableValue(left)) === JSON.stringify(stableValue(right));
}

export type GrammarProjectionPlan = {
  hasChanges: boolean;
  previousRevision: string | null;
  newRevision: string;
  basicCount: number;
  advancedCount: number;
  addedIds: string[];
  changedIds: string[];
  changedTopics: Array<{ id: string; previousLabel: string | null; nextLabel: string }>;
  staleIds: string[];
  duplicateIds: string[];
  topics: unknown[];
};

export function planGrammarCurriculumProjection(existing: UnknownRecord = {}): GrammarProjectionPlan {
  const existingTopics = Array.isArray(existing.topics) ? existing.topics : [];
  const existingGrammar = existingTopics.filter(isGrammarTopic) as UnknownRecord[];
  const nonGrammar = existingTopics.filter((topic) => !isGrammarTopic(topic));
  const canonicalById = new Map(GRAMMAR_CURRICULUM_TOPICS.map((topic) => [topic.id, topic]));
  const existingById = new Map<string, UnknownRecord>();
  const duplicateIds = new Set<string>();
  existingGrammar.forEach((topic) => {
    const id = String(topic.id ?? topic.topicId ?? '').trim();
    if (!id) return;
    if (existingById.has(id)) duplicateIds.add(id);
    existingById.set(id, topic);
  });
  const addedIds = GRAMMAR_CURRICULUM_TOPICS
    .filter((topic) => !existingById.has(topic.id))
    .map((topic) => topic.id);
  const changedTopics = GRAMMAR_CURRICULUM_TOPICS
    .filter((topic) => {
      const current = existingById.get(topic.id);
      return Boolean(current) && !equalValue(current, topic);
    })
    .map((topic) => {
      const current = existingById.get(topic.id);
      const previousLabel = String(current?.displayTitle ?? current?.label ?? '').trim();
      return {
        id: topic.id,
        previousLabel: previousLabel || null,
        nextLabel: topic.displayTitle,
      };
    });
  const changedIds = changedTopics.map((topic) => topic.id);
  const staleIds = existingGrammar
    .map((topic) => String(topic.id ?? topic.topicId ?? '').trim())
    .filter((id) => id && !canonicalById.has(id));
  const topics = [...nonGrammar, ...GRAMMAR_CURRICULUM_TOPICS];
  const previousRevision = typeof existing.grammarCurriculumRevision === 'string'
    ? existing.grammarCurriculumRevision
    : null;
  const revisionMatches = previousRevision === GRAMMAR_CURRICULUM_REVISION
    && existing.grammarCurriculumSchemaVersion === GRAMMAR_CURRICULUM_SCHEMA_VERSION;
  const grammarProjectionMatches = existingGrammar.length === GRAMMAR_CURRICULUM_TOPICS.length
    && addedIds.length === 0
    && changedIds.length === 0
    && staleIds.length === 0
    && duplicateIds.size === 0;

  return {
    hasChanges: !revisionMatches || !grammarProjectionMatches,
    previousRevision,
    newRevision: GRAMMAR_CURRICULUM_REVISION,
    basicCount: GRAMMAR_COURSES['basic-grammar'].lessons.length,
    advancedCount: GRAMMAR_COURSES['advanced-grammar'].lessons.length,
    addedIds,
    changedIds,
    changedTopics,
    staleIds: Array.from(new Set(staleIds)),
    duplicateIds: Array.from(duplicateIds),
    topics,
  };
}
