export const SPEAKING_CURRICULUM_REVISION = '2026.10.03.1';
export const SPEAKING_CURRICULUM_SCHEMA_VERSION = 2;

export type SpeakingCourseId = 'basic-public-speaking' | 'advanced-public-speaking';
export type SpeakingLevel = 'foundations' | 'excellence';

export type SpeakingLessonMethod =
  | 'responsive_conversation'
  | 'dialogic_reading'
  | 'guided_practice'
  | 'role_play'
  | 'sustained_shared_thinking'
  | 'collaborative_dialogue'
  | 'presentation_practice'
  | 'ai_literacy';

export type SpeakingStage = {
  stageOrder: number;
  label: string;
  goal: string;
  learningOutcomes: string[];
  start: number;
  end: number;
};

export type SpeakingLesson = {
  id: string;
  courseId: SpeakingCourseId;
  level: SpeakingLevel;
  area: 'speaking';
  lesson: string;
  lessonNumber: number;
  order: number;
  label: string;
  displayTitle: string;
  stageOrder: number;
  stageLabel: string;
  stageGoal: string;
  method: SpeakingLessonMethod;
  objective: string;
  authenticTask: string;
  transferTask: string;
  evidence: string;
  languageSupport: string;
  curriculumRevision: string;
  schemaVersion: number;
};

export type SpeakingCourse = {
  id: SpeakingCourseId;
  level: SpeakingLevel;
  label: string;
  publicLabel: string;
  publicSlug: string;
  canonicalPublicSlug: string;
  ageGuide: string;
  aliases: string[];
  stages: SpeakingStage[];
  lessons: SpeakingLesson[];
};

const FOUNDATIONS_LABELS = [
  'Speaking Routine: Greet, Introduce & Share One Idea',
  'Listener Awareness & Comfortable Attention',
  'Clear Voice: Volume & Pace',
  'Answer in a Complete Sentence',
  'Turn-Taking: Listen, Wait & Respond',
  'Conversation Challenge: Independent Exchange',
  'Question Words: Who, What & Where',
  'Question Words: When, Why & How',
  'Ask a Question That Fits the Topic',
  'Listen & Answer What Was Actually Asked',
  'Ask a Useful Follow-Up Question',
  'Clarify & Repair: Ask When Meaning Is Unclear',
  'Picture Talk: Notice, Name & Describe',
  'Add Three Useful Details',
  'Choose More Precise Describing Words',
  'Explain a Sequence: First, Next, Then, Last',
  'Explain Why: Cause + Because',
  'Compare, Choose & Give a Reason',
  'Story Structure: Beginning, Middle & End',
  'Character, Setting & Problem',
  'Feelings, Reasons & Simple Perspective',
  'Retell From a Picture Sequence',
  'Another Point of View: What Might They Think?',
  'Story Retell + Listener Questions',
  'Choose a Topic & Key Message',
  'Topic Sentence + Two Supporting Details',
  'Show & Tell With a Prop or Visual',
  'Voice Variety, Emphasis & Pause',
  'Audience Awareness: What Does My Listener Need?',
  '45–60 Second Mini Talk + Q&A',
  'Think → Choose → Order → Say',
  'Ask for Help Without Giving Up',
  'Give Clear Instructions',
  'Good Questions Get Better Answers',
  'Check an Answer: Fact, Guess or Not Sure Yet',
  'Final Communication Showcase: Explain, Ask, Answer & Reflect',
] as const;

const EXCELLENCE_LABELS = [
  'Purpose: Inform, Explain or Persuade',
  'Adapt the Message to the Audience',
  'Strong Openings',
  'Answer First, Then Add Useful Detail',
  'Articulation, Pace & Emphasis',
  'Structured 60–90 Second Talk',
  'Open Questions vs Closed Questions',
  'Clarifying Questions',
  'Follow-Up & Probing Questions',
  'Paraphrase What You Heard',
  'Build on Another Person’s Idea',
  'Interview & Dialogue Challenge',
  'Claim → Reason → Example',
  'Explain Cause & Effect',
  'Compare Options & Trade-Offs',
  'Explain a Process Step by Step',
  'Fact, Opinion & Inference',
  'Evidence & Sources: How Do You Know?',
  'Hook + Story Arc',
  'Scene, Character & Useful Detail',
  'Perspective & Point of View',
  'Impromptu Speaking: Point → Reason → Example',
  'Thinking Time, Notes & Recovery',
  'Difficult Q&A: Clarify, Answer & Admit Uncertainty',
  'Persuasive Claim + Audience Need',
  'Reasons + Evidence',
  'Agree & Disagree Constructively',
  'Counterargument & Rebuttal',
  'Summarise, Rephrase & Mediate Another Idea',
  'Mini Debate + Reflection',
  'Presentation Planning: Message, Notes & Visuals',
  'Recognise AI: Capabilities, Limits & Human Responsibility',
  'AI Safety: Privacy, Personal Information & Responsible Use',
  'Ask AI Clearly: Goal, Context & Constraints',
  'Evaluate & Improve an AI Answer: Follow-Up, Evidence, Gaps & Bias',
  'Capstone: Research Responsibly, Present Independently & Defend Your Ideas',
] as const;

const FOUNDATIONS_STAGES: SpeakingStage[] = [
  {
    stageOrder: 1,
    label: 'Stage 1 — Connect & Communicate',
    start: 1,
    end: 6,
    goal: 'Goal: Enter a reciprocal conversation, respond to another person, and communicate a complete idea with growing independence.',
    learningOutcomes: [
      'Participate in short back-and-forth exchanges',
      'Respond to the listener rather than only recite prepared language',
      'Use an audible, comfortable pace and a complete spoken response',
      'Take turns and continue an interaction with less prompting',
    ],
  },
  {
    stageOrder: 2,
    label: 'Stage 2 — Ask, Listen & Clarify',
    start: 7,
    end: 12,
    goal: 'Goal: Use questions to learn, listen for meaning, and repair misunderstandings.',
    learningOutcomes: [
      'Use age-appropriate question words to seek information',
      'Ask questions that are relevant to the topic',
      'Answer the question that was actually asked',
      'Ask a follow-up or clarification question when more information is needed',
    ],
  },
  {
    stageOrder: 3,
    label: 'Stage 3 — Describe & Explain',
    start: 13,
    end: 18,
    goal: 'Goal: Expand an idea with useful detail, sequence, comparison, and simple reasons.',
    learningOutcomes: [
      'Describe a picture, object, person, or event with relevant detail',
      'Choose more precise vocabulary instead of relying only on general words',
      'Explain a simple sequence in a listener-friendly order',
      'Give a reason using because and make simple comparisons',
    ],
  },
  {
    stageOrder: 4,
    label: 'Stage 4 — Story & Perspective',
    start: 19,
    end: 24,
    goal: 'Goal: Tell and retell coherent stories while beginning to consider another person’s perspective.',
    learningOutcomes: [
      'Use a clear beginning, middle, and end',
      'Include character, setting, problem, feeling, and relevant detail',
      'Retell from pictures without depending on a memorised script',
      'Consider what another character may know, feel, or think',
    ],
  },
  {
    stageOrder: 5,
    label: 'Stage 5 — Short Talks & Audience',
    start: 25,
    end: 30,
    goal: 'Goal: Organise a short message for a listener and respond to simple audience questions.',
    learningOutcomes: [
      'Choose a clear topic and key message',
      'Support the message with relevant details',
      'Use a visual or prop without becoming dependent on it',
      'Adjust pace, emphasis, and information for the listener',
      'Answer simple questions after a short talk',
    ],
  },
  {
    stageOrder: 6,
    label: 'Stage 6 — Independent Communication & Smart Questioning',
    start: 31,
    end: 36,
    goal: 'Goal: Plan, communicate, question, check information, and reflect with less adult construction of the response.',
    learningOutcomes: [
      'Plan an idea before speaking instead of waiting for the adult to build the answer',
      'Ask for help or clarification without giving up',
      'Give clear instructions another person can follow',
      'Recognise that better questions can produce better information',
      'Distinguish a supported fact from a guess or an uncertain answer at an age-appropriate level',
      'Transfer communication skills to a fresh task',
    ],
  },
];

const EXCELLENCE_STAGES: SpeakingStage[] = [
  {
    stageOrder: 1,
    label: 'Stage 1 — Purpose, Audience & Delivery',
    start: 1,
    end: 6,
    goal: 'Goal: Shape a clear spoken message according to purpose, audience, and task.',
    learningOutcomes: [
      'Distinguish informing, explaining, and persuading',
      'Adapt content and detail for the listener or audience',
      'Open clearly and answer the core question before expanding',
      'Use articulation, pace, pausing, and emphasis to support meaning',
      'Deliver a structured short talk with growing independence',
    ],
  },
  {
    stageOrder: 2,
    label: 'Stage 2 — Questioning, Listening & Dialogue',
    start: 7,
    end: 12,
    goal: 'Goal: Use questioning and active listening to sustain purposeful two-way communication.',
    learningOutcomes: [
      'Choose open, closed, clarifying, follow-up, and probing questions for a purpose',
      'Paraphrase another speaker accurately before responding',
      'Build on another person’s idea rather than repeating a prepared answer',
      'Sustain an interview or dialogue across several turns',
    ],
  },
  {
    stageOrder: 3,
    label: 'Stage 3 — Reasoning & Explanation',
    start: 13,
    end: 18,
    goal: 'Goal: Explain thinking clearly and support claims with reasons, examples, and appropriately checked information.',
    learningOutcomes: [
      'Use claim → reason → example structure',
      'Explain cause, effect, sequence, process, and trade-offs',
      'Distinguish fact, opinion, and inference',
      'Ask how a claim is known and what evidence or source supports it',
    ],
  },
  {
    stageOrder: 4,
    label: 'Stage 4 — Story, Perspective & Impromptu Thinking',
    start: 19,
    end: 24,
    goal: 'Goal: Communicate flexibly when the topic, viewpoint, or question is not fully rehearsed.',
    learningOutcomes: [
      'Build a coherent story with a purposeful hook and arc',
      'Shift perspective and recognise that viewpoints can differ',
      'Use a simple structure for impromptu responses',
      'Use normal thinking time, brief notes, clarification, and recovery strategies',
      'State uncertainty rather than inventing an answer',
    ],
  },
  {
    stageOrder: 5,
    label: 'Stage 5 — Discussion, Persuasion & Mediation',
    start: 25,
    end: 30,
    goal: 'Goal: Participate constructively in discussion, persuasion, disagreement, and mediation of another person’s ideas.',
    learningOutcomes: [
      'Match persuasive reasons and evidence to an audience need',
      'Agree and disagree respectfully while addressing the idea',
      'Recognise and respond to a counterargument',
      'Summarise or rephrase another person’s idea fairly',
      'Use discussion to refine thinking rather than only to win',
    ],
  },
  {
    stageOrder: 6,
    label: 'Stage 6 — Presentation & AI-Era Communication',
    start: 31,
    end: 36,
    goal: 'Goal: Present independently and use AI-era communication skills with critical judgement, privacy awareness, and human responsibility.',
    learningOutcomes: [
      'Plan a presentation around purpose, message, notes, visuals, and likely questions',
      'Recognise useful AI capabilities and important limitations',
      'Protect private information and keep human responsibility for decisions',
      'Give a clear AI request using goal, context, and constraints when supervised use is appropriate',
      'Evaluate an AI answer for relevance, evidence, missing context, possible bias, and uncertainty',
      'Use tools to support—not replace—independent thinking, explanation, and final communication',
    ],
  },
];

const FOUNDATIONS_METHODS: SpeakingLessonMethod[] = [
  'responsive_conversation', 'responsive_conversation', 'guided_practice', 'guided_practice', 'responsive_conversation', 'role_play',
  'guided_practice', 'guided_practice', 'responsive_conversation', 'responsive_conversation', 'responsive_conversation', 'role_play',
  'dialogic_reading', 'dialogic_reading', 'guided_practice', 'guided_practice', 'sustained_shared_thinking', 'sustained_shared_thinking',
  'dialogic_reading', 'dialogic_reading', 'sustained_shared_thinking', 'dialogic_reading', 'sustained_shared_thinking', 'collaborative_dialogue',
  'guided_practice', 'guided_practice', 'role_play', 'guided_practice', 'sustained_shared_thinking', 'presentation_practice',
  'guided_practice', 'role_play', 'role_play', 'sustained_shared_thinking', 'sustained_shared_thinking', 'presentation_practice',
];

const EXCELLENCE_METHODS: SpeakingLessonMethod[] = [
  'guided_practice', 'sustained_shared_thinking', 'presentation_practice', 'guided_practice', 'guided_practice', 'presentation_practice',
  'guided_practice', 'collaborative_dialogue', 'collaborative_dialogue', 'collaborative_dialogue', 'collaborative_dialogue', 'role_play',
  'sustained_shared_thinking', 'sustained_shared_thinking', 'sustained_shared_thinking', 'guided_practice', 'sustained_shared_thinking', 'sustained_shared_thinking',
  'guided_practice', 'dialogic_reading', 'sustained_shared_thinking', 'guided_practice', 'guided_practice', 'collaborative_dialogue',
  'sustained_shared_thinking', 'sustained_shared_thinking', 'collaborative_dialogue', 'collaborative_dialogue', 'collaborative_dialogue', 'collaborative_dialogue',
  'presentation_practice', 'ai_literacy', 'ai_literacy', 'ai_literacy', 'ai_literacy', 'presentation_practice',
];

const stageFor = (stages: SpeakingStage[], order: number) => {
  const stage = stages.find((candidate) => order >= candidate.start && order <= candidate.end);
  if (!stage) throw new Error(`Missing Speaking stage for lesson ${order}`);
  return stage;
};

const foundationsObjective = (label: string) => `Develop ${label.toLowerCase()} through age-appropriate reciprocal speaking and listening practice.`;
const excellenceObjective = (label: string) => `Develop ${label.toLowerCase()} through purposeful discussion, reasoning, explanation, or presentation practice.`;

const buildLessons = (
  courseId: SpeakingCourseId,
  level: SpeakingLevel,
  labels: readonly string[],
  stages: SpeakingStage[],
  methods: SpeakingLessonMethod[],
): SpeakingLesson[] =>
  labels.map((label, index) => {
    const order = index + 1;
    const stage = stageFor(stages, order);
    const isFoundations = level === 'foundations';
    return {
      id: `${courseId}__v2-lesson-${String(order).padStart(2, '0')}`,
      courseId,
      level,
      area: 'speaking',
      lesson: `Lesson-${order}`,
      lessonNumber: order,
      order,
      label,
      displayTitle: `Lesson ${order} — ${label}`,
      stageOrder: stage.stageOrder,
      stageLabel: stage.label,
      stageGoal: stage.goal,
      method: methods[index],
      objective: isFoundations ? foundationsObjective(label) : excellenceObjective(label),
      authenticTask: isFoundations
        ? 'Use the target skill in a meaningful child-friendly conversation, picture, story, role-play, explanation, or short audience task.'
        : 'Use the target skill in a purposeful dialogue, reasoning task, story, discussion, explanation, interview, debate, or presentation.',
      transferTask: 'Repeat the target on a fresh topic, prompt, listener, example, or scenario with less direct prompting.',
      evidence: 'Record what the child can do independently, the lightest useful support, and whether the skill survives a fresh task.',
      languageSupport: isFoundations
        ? 'Use visuals, modelling, sentence starters, wait time, first-language support where useful, and expansion/recasting; fade support as ownership grows.'
        : 'Use planning time, key vocabulary, organisers, sentence frames, examples, and clarification support where needed; keep the thinking demand age-appropriate and fade language support over time.',
      curriculumRevision: SPEAKING_CURRICULUM_REVISION,
      schemaVersion: SPEAKING_CURRICULUM_SCHEMA_VERSION,
    };
  });

const foundationsLessons = buildLessons(
  'basic-public-speaking',
  'foundations',
  FOUNDATIONS_LABELS,
  FOUNDATIONS_STAGES,
  FOUNDATIONS_METHODS,
);

const excellenceLessons = buildLessons(
  'advanced-public-speaking',
  'excellence',
  EXCELLENCE_LABELS,
  EXCELLENCE_STAGES,
  EXCELLENCE_METHODS,
);

export const SPEAKING_COURSES: Record<SpeakingCourseId, SpeakingCourse> = {
  'basic-public-speaking': {
    id: 'basic-public-speaking',
    level: 'foundations',
    label: 'Public Speaking (Basic)',
    publicLabel: 'Public Speaking Foundations',
    publicSlug: 'basic-public-speaking',
    canonicalPublicSlug: 'public-speaking-foundations',
    ageGuide: 'Ages 4–7',
    aliases: ['public-speaking-foundations', 'public-speaking-basic', 'intermediate-public-speaking'],
    stages: FOUNDATIONS_STAGES,
    lessons: foundationsLessons,
  },
  'advanced-public-speaking': {
    id: 'advanced-public-speaking',
    level: 'excellence',
    label: 'Public Speaking (Advanced)',
    publicLabel: 'Public Speaking Excellence',
    publicSlug: 'advanced-public-speaking',
    canonicalPublicSlug: 'public-speaking-excellence',
    ageGuide: 'Ages 7–12',
    aliases: ['public-speaking-excellence', 'public-speaking-advanced'],
    stages: EXCELLENCE_STAGES,
    lessons: excellenceLessons,
  },
};

export const SPEAKING_CURRICULUM_TOPICS_V2 = [
  ...SPEAKING_COURSES['basic-public-speaking'].lessons,
  ...SPEAKING_COURSES['advanced-public-speaking'].lessons,
];

export const SPEAKING_COMMUNICATION_DIMENSIONS = [
  'Response expansion',
  'Sentence formation in speaking',
  'Vocabulary in use',
  'Listening & response relevance',
  'Questioning & clarification',
  'Idea organisation',
  'Storytelling & retelling',
  'Reasoning & evidence',
  'Collaborative dialogue & perspective',
  'Delivery & intelligibility',
  'Audience & purpose',
  'Independence & fresh-task transfer',
] as const;

export const SPEAKING_PEDAGOGY_PRINCIPLES = [
  'Responsive back-and-forth interaction before performance',
  'Meaningful communication tasks instead of rapid-fire questioning',
  'Expansion and recasting rather than constant interruption for correction',
  'Dialogic reading, storytelling, role-play, and sustained shared thinking',
  'Model → guide → fade support → independent use → fresh-task transfer',
  'Age-appropriate thinking demand with multilingual language scaffolds when needed',
  'Intelligibility and audience awareness without accent conformity or mandatory eye contact',
  'Communication independence rather than personality-based confidence judgements',
  'Prepared and spontaneous communication, including clarification and uncertainty',
  'AI literacy built on human judgement, privacy, evidence, questioning, and responsible use',
] as const;

export const SPEAKING_CURRICULUM_TRANSITION_POLICY = {
  publicCurriculumOwner: SPEAKING_CURRICULUM_REVISION,
  existingOperationalProgress: 'preserve_v1',
  newV2TopicIdsAreVersioned: true,
  note:
    'Public curriculum and course-detail pages use Speaking Curriculum v2. Existing learner Firestore progress must not be reinterpreted against v2 lesson meanings until an explicit enrollment-level migration or v2 assignment flow is implemented.',
} as const;

export function normalizeSpeakingCourseId(value: unknown): SpeakingCourseId | null {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return null;
  if (raw === 'basic-public-speaking' || raw === 'public-speaking-foundations' || raw === 'public-speaking-basic' || raw === 'intermediate-public-speaking') {
    return 'basic-public-speaking';
  }
  if (raw === 'advanced-public-speaking' || raw === 'public-speaking-excellence' || raw === 'public-speaking-advanced') {
    return 'advanced-public-speaking';
  }
  return null;
}

export function getSpeakingCourse(value: unknown): SpeakingCourse | null {
  const courseId = normalizeSpeakingCourseId(value);
  return courseId ? SPEAKING_COURSES[courseId] : null;
}

export function buildPublicSpeakingStages(value: unknown) {
  const course = getSpeakingCourse(value);
  if (!course) return [];
  return course.stages.map((stage) => ({
    title: stage.label,
    focus: stage.goal.replace(/^Goal:\s*/i, ''),
    learns: stage.learningOutcomes,
    lessons: course.lessons
      .filter((lesson) => lesson.order >= stage.start && lesson.order <= stage.end)
      .map((lesson) => lesson.displayTitle),
  }));
}
