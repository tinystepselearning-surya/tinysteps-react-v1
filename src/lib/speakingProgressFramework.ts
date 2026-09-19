export const SPEAKING_PROGRESS_FRAMEWORK_REVISION = '2026-09-19-b7-v2';
export const SPEAKING_PROGRESS_FRAMEWORK_PATH = '/speaking-progress-framework';
export const SPEAKING_PROGRESS_FRAMEWORK_NAME = 'Tiny Steps Speaking Progress Framework';

export type SpeakingProgressBandId =
  | 'modelled_support'
  | 'guided_attempt'
  | 'independent_use'
  | 'fresh_task_transfer';

export type SpeakingProgressDimensionId =
  | 'response_expansion'
  | 'sentence_formation'
  | 'vocabulary_in_use'
  | 'idea_organisation'
  | 'listening_response'
  | 'storytelling_retelling'
  | 'delivery_intelligibility'
  | 'prompt_independence'
  | 'presentation_audience'
  | 'fresh_task_transfer';

export type SpeakingProgressObservationBand = {
  readonly id: SpeakingProgressBandId;
  readonly order: number;
  readonly label: string;
  readonly shortLabel: string;
  readonly description: string;
  readonly evidenceQuestion: string;
};

export type SpeakingProgressDimension = {
  readonly id: SpeakingProgressDimensionId;
  readonly order: number;
  readonly label: string;
  readonly shortLabel: string;
  readonly parentQuestion: string;
  readonly description: string;
  readonly baselineEvidence: string;
  readonly progressEvidence: string;
  readonly avoidJudgingBy: string;
  readonly knowledgeDomainIds: readonly string[];
};

const freezeRecord = <T extends object>(value: T): Readonly<T> => Object.freeze(value);
const freezeList = <T>(values: readonly T[]): readonly T[] => Object.freeze([...values]);

const defineObservationBand = (
  band: SpeakingProgressObservationBand,
): SpeakingProgressObservationBand => freezeRecord({ ...band });

const defineDimension = (
  dimension: SpeakingProgressDimension,
): SpeakingProgressDimension =>
  freezeRecord({
    ...dimension,
    knowledgeDomainIds: freezeList(dimension.knowledgeDomainIds),
  });

export const SPEAKING_PROGRESS_OBSERVATION_BANDS: readonly SpeakingProgressObservationBand[] = freezeList([
  defineObservationBand({
    id: 'modelled_support',
    order: 1,
    label: 'Modelled / supported',
    shortLabel: 'Supported',
    description:
      'The child can participate when the teacher supplies a model, sentence starter, repeated prompt, or substantial planning support.',
    evidenceQuestion: 'What did the adult have to supply before the child could respond?',
  }),
  defineObservationBand({
    id: 'guided_attempt',
    order: 2,
    label: 'Guided attempt',
    shortLabel: 'Guided',
    description:
      'The child attempts the skill with lighter support such as a cue, question, visual organiser, keyword, or targeted follow-up.',
    evidenceQuestion: 'Which small cue still helps the child complete the task?',
  }),
  defineObservationBand({
    id: 'independent_use',
    order: 3,
    label: 'Independent use',
    shortLabel: 'Independent',
    description:
      'The child completes a comparable task with little or no direct prompting, while normal thinking time and self-correction remain allowed.',
    evidenceQuestion: 'What can the child now do without the adult building the answer for them?',
  }),
  defineObservationBand({
    id: 'fresh_task_transfer',
    order: 4,
    label: 'Fresh-task transfer',
    shortLabel: 'Transfer',
    description:
      'The child applies the same skill to a new prompt, topic, listener, story, or presentation task with little or no direct prompting.',
    evidenceQuestion: 'Does the skill still appear when the exact practice material changes?',
  }),
]);

export const SPEAKING_PROGRESS_DIMENSIONS: readonly SpeakingProgressDimension[] = freezeList([
  defineDimension({
    id: 'response_expansion',
    order: 1,
    label: 'Response expansion',
    shortLabel: 'Response',
    parentQuestion: 'Can my child give enough relevant information to answer the speaking task?',
    description:
      'Looks at whether the child moves beyond fragments or minimal answers into a complete, relevant message with useful detail when the task calls for it.',
    baselineEvidence:
      'Record the response type: fragment, one idea, connected ideas, or a fuller response, together with the prompt needed.',
    progressEvidence:
      'Responses become more informative and complete with less adult sentence completion or repeated prompting.',
    avoidJudgingBy:
      'Word count alone. A longer answer is not automatically clearer, more relevant, or more independent.',
    knowledgeDomainIds: ['response-expansion-language'],
  }),
  defineDimension({
    id: 'sentence_formation',
    order: 2,
    label: 'Sentence formation in speaking',
    shortLabel: 'Sentences',
    parentQuestion: 'Can my child turn an idea into a sentence that a listener can follow?',
    description:
      'Looks at spoken sentence completeness, word order, grammar in use, and whether errors prevent the message from being understood.',
    baselineEvidence:
      'Note the sentence pattern the child can produce independently and the type of correction or model still required.',
    progressEvidence:
      'The child forms clearer sentences more independently and begins to reuse corrected patterns in fresh speaking.',
    avoidJudgingBy:
      'Perfect grammar in every spontaneous sentence. The useful question is whether sentence control supports communication and is becoming more independent.',
    knowledgeDomainIds: ['response-expansion-language'],
  }),
  defineDimension({
    id: 'vocabulary_in_use',
    order: 3,
    label: 'Vocabulary in use',
    shortLabel: 'Vocabulary',
    parentQuestion: 'Can my child retrieve and use useful words while speaking, not only recognise them?',
    description:
      'Looks at functional word choice, retrieval, useful detail, and the ability to choose vocabulary that helps explain the idea.',
    baselineEvidence:
      'Note where the child relies on very general words, pauses for retrieval, or needs a supplied word to continue.',
    progressEvidence:
      'The child retrieves more useful words independently and can explain around a missing word instead of stopping completely.',
    avoidJudgingBy:
      'Rare or difficult vocabulary for its own sake. Appropriate, usable language is more valuable than impressive isolated words.',
    knowledgeDomainIds: ['response-expansion-language'],
  }),
  defineDimension({
    id: 'idea_organisation',
    order: 4,
    label: 'Idea organisation',
    shortLabel: 'Organisation',
    parentQuestion: 'Can my child organise ideas and support an opinion so the listener can follow the message?',
    description:
      'Looks at choosing relevant ideas, sequencing and linking points, keeping a response focused, and—when the task involves opinion or discussion—supporting a position with reasons or examples.',
    baselineEvidence:
      'Record whether the child needs the adult to choose the order, provide the structure, supply reasons or examples, or repeatedly bring the response back to the topic.',
    progressEvidence:
      'Ideas follow a clearer sequence with fewer structural prompts; on opinion or discussion tasks, reasons and examples become more connected and independent on a fresh topic.',
    avoidJudgingBy:
      'Memorising one fixed script. Organisation should survive reasonable changes in wording or topic.',
    knowledgeDomainIds: ['speech-organisation', 'discussion-reasoning'],
  }),
  defineDimension({
    id: 'listening_response',
    order: 5,
    label: 'Listening & response relevance',
    shortLabel: 'Listening',
    parentQuestion: 'Does my child listen to the prompt or other speaker and respond to what was actually said?',
    description:
      'Looks at listening for meaning, staying on topic, answering the question asked, taking turns, following up, and repairing misunderstandings when needed.',
    baselineEvidence:
      'Note whether the child answers a different question, repeats prepared material, misses a conversational cue, or needs the prompt repeated.',
    progressEvidence:
      'Responses connect more reliably to the prompt or previous speaker, with fewer repetitions and better follow-up.',
    avoidJudgingBy:
      'Silent compliance or eye contact. Listening evidence comes from the child’s relevant response and interaction.',
    knowledgeDomainIds: ['conversation-listening'],
  }),
  defineDimension({
    id: 'storytelling_retelling',
    order: 6,
    label: 'Storytelling & retelling',
    shortLabel: 'Storytelling',
    parentQuestion: 'Can my child tell or retell an event so a listener understands what happened?',
    description:
      'Looks at a clear situation, meaningful sequence, relevant detail, connections between events, and an ending or resolution appropriate to the task.',
    baselineEvidence:
      'Use a familiar event, picture sequence, or short retell and note where the child needs sequencing questions or adult-added details.',
    progressEvidence:
      'The child keeps the story clearer and more complete with fewer sequencing prompts, including on a new story or event.',
    avoidJudgingBy:
      'Memorising a teacher-written story word for word. Flexible retelling is stronger evidence of ownership.',
    knowledgeDomainIds: ['storytelling-retelling'],
  }),
  defineDimension({
    id: 'delivery_intelligibility',
    order: 7,
    label: 'Delivery & intelligibility',
    shortLabel: 'Delivery',
    parentQuestion: 'Can listeners follow the child comfortably because pace, volume, pausing and expression support the message?',
    description:
      'Looks at audible delivery, manageable pace, pausing, emphasis, intelligibility and physical presentation choices that help communicate meaning.',
    baselineEvidence:
      'Note the one or two delivery behaviours that most affect listener understanding on the current task.',
    progressEvidence:
      'The child adjusts a relevant delivery behaviour after feedback and increasingly notices or manages it independently.',
    avoidJudgingBy:
      'Accent conformity, constant eye contact, loudness, theatrical performance, or copying one “ideal” speaking style.',
    knowledgeDomainIds: ['delivery-audience-connection'],
  }),
  defineDimension({
    id: 'prompt_independence',
    order: 8,
    label: 'Speaking independence',
    shortLabel: 'Independence',
    parentQuestion: 'How much adult help does my child need to start, continue and complete the speaking task?',
    description:
      'Tracks prompt dependency directly: models, sentence starters, repeated questions, supplied ideas, keyword cues, thinking time and independent completion.',
    baselineEvidence:
      'Record the lightest support that lets the child succeed instead of writing only “good” or “needs confidence”.',
    progressEvidence:
      'Support can be faded: full model to cue, cue to thinking time, and thinking time to independent completion where appropriate.',
    avoidJudgingBy:
      'Speed alone. A child may need normal planning time and still be speaking independently.',
    knowledgeDomainIds: ['response-initiation-independence', 'confidence-context-transfer'],
  }),
  defineDimension({
    id: 'presentation_audience',
    order: 9,
    label: 'Presentation & audience awareness',
    shortLabel: 'Presentation',
    parentQuestion: 'Can my child shape a short talk for a listener or audience rather than only recite content?',
    description:
      'Looks at purpose, opening, useful points, ending, audience awareness, handling simple questions, and using visuals or notes without becoming dependent on them.',
    baselineEvidence:
      'Use a short show-and-tell or presentation task and note which parts the child can plan and deliver without adult construction.',
    progressEvidence:
      'The child can prepare and deliver a clearer short talk, adapt it for the task, and respond to simple audience questions with less support.',
    avoidJudgingBy:
      'A polished memorised script alone. Presentation skill includes organisation, communication and response to the audience.',
    knowledgeDomainIds: ['speech-organisation', 'delivery-audience-connection'],
  }),
  defineDimension({
    id: 'fresh_task_transfer',
    order: 10,
    label: 'Transfer to fresh tasks',
    shortLabel: 'Transfer',
    parentQuestion: 'Does the speaking skill appear again when the topic, material, listener or setting changes?',
    description:
      'Checks whether learning survives beyond the exact practised prompt through fresh questions, unfamiliar pictures, new stories, new topics, or a different communication setting.',
    baselineEvidence:
      'After successful practice, use one comparable but unfamiliar task and record what remains independent and what support returns.',
    progressEvidence:
      'The skill appears more reliably across fresh tasks, with less fall-back to the original model or memorised wording.',
    avoidJudgingBy:
      'Success only on the rehearsed item. Familiar-task performance is useful practice but not sufficient evidence of transfer.',
    knowledgeDomainIds: ['rehearsal-feedback-transfer', 'confidence-context-transfer'],
  }),
]);

export const SPEAKING_PROGRESS_REVIEW_LOOP = freezeList([
  freezeRecord({
    id: 'baseline',
    order: 1,
    label: 'Baseline',
    description: 'Capture what the child can do now, the task used, and the support needed.',
  }),
  freezeRecord({
    id: 'focus',
    order: 2,
    label: 'One current target',
    description: 'Choose one high-value dimension or closely related pair instead of trying to improve everything at once.',
  }),
  freezeRecord({
    id: 'guided-practice',
    order: 3,
    label: 'Teach, retry, fade support',
    description: 'Model when needed, give specific feedback, retry, and reduce prompting as the skill becomes usable.',
  }),
  freezeRecord({
    id: 'fresh-check',
    order: 4,
    label: 'Fresh-task check',
    description: 'Use a comparable but unfamiliar speaking task to see what transfers.',
  }),
  freezeRecord({
    id: 'next-step',
    order: 5,
    label: 'Next learning priority',
    description: 'Record what is now more independent, what still needs support, and the next useful teaching target.',
  }),
]);

export const SPEAKING_PROGRESS_FRAMEWORK_GUARDRAILS = freezeList([
  'Do not average the ten dimensions into one overall speaking score.',
  'Do not convert the framework into a developmental age, IQ-style result, diagnosis, or clinical label.',
  'Do not judge confidence by loudness, extroversion, accent, or constant eye contact.',
  'Do not treat memorised performance on one prompt as proof of transfer.',
  'Do not expect every child to progress evenly across all ten dimensions.',
  'Do compare the same child over time using comparable tasks and the support needed.',
  'Do record multilingual and setting differences when they materially affect what the child can demonstrate.',
  'Do choose one useful next target rather than reporting broad labels such as “good” or “weak”.',
]);

export const SPEAKING_PROGRESS_PARENT_SUMMARY_FIELDS = freezeList([
  'Current speaking target',
  'Observation band for the target',
  'What the child can now do independently',
  'Support that is still useful',
  'Fresh-task evidence',
  'Next learning priority',
]);

export function getSpeakingProgressDimension(
  id: SpeakingProgressDimensionId | string,
): SpeakingProgressDimension | null {
  return SPEAKING_PROGRESS_DIMENSIONS.find((item) => item.id === id) ?? null;
}

export function getSpeakingProgressBand(
  id: SpeakingProgressBandId | string,
): SpeakingProgressObservationBand | null {
  return SPEAKING_PROGRESS_OBSERVATION_BANDS.find((item) => item.id === id) ?? null;
}

export function createSpeakingProgressObservationTemplate() {
  return SPEAKING_PROGRESS_DIMENSIONS.map((dimension) => ({
    dimensionId: dimension.id,
    bandId: null as SpeakingProgressBandId | null,
    evidence: '',
    supportUsed: '',
    freshTaskEvidence: '',
    nextTarget: '',
  }));
}
