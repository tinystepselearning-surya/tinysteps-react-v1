import { getGrammarWritingSkill } from './grammarWritingKnowledgeTaxonomy.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);
const freezeAnchors = (values = []) => freezeList(values.map((item) => freeze({ ...item })));
const tense = (config) => freeze({
  ...config,
  formPatterns: freezeList(config.formPatterns),
  meaningUses: freezeList(config.meaningUses),
  timeClues: freezeList(config.timeClues),
  examples: freezeList(config.examples),
  prerequisiteTenseIds: freezeList(config.prerequisiteTenseIds),
  nextTenseIds: freezeList(config.nextTenseIds),
  comparisonIds: freezeList(config.comparisonIds),
  commonErrorIds: freezeList(config.commonErrorIds),
  writingApplications: freezeList(config.writingApplications),
  curriculumAnchors: freezeAnchors(config.curriculumAnchors),
});
const comparison = (config) => freeze({
  ...config,
  tenseIds: freezeList(config.tenseIds),
  contrastExamples: freezeList(config.contrastExamples),
  commonErrorIds: freezeList(config.commonErrorIds),
  curriculumAnchors: freezeAnchors(config.curriculumAnchors),
});
const errorPattern = (config) => freeze({ ...config, tenseIds: freezeList(config.tenseIds) });

export const GRAMMAR_WRITING_TENSE_REVISION = '2026-09-10-gr2';
export const GRAMMAR_WRITING_TENSE_PARENT_SKILL_ID = 'tenses';
export const GRAMMAR_WRITING_TENSE_ROOT_ID = 'simple-present';
export const GRAMMAR_WRITING_TENSE_TERMINAL_ID = 'tense-consistency-transfer';

export const GRAMMAR_WRITING_TENSE_TEACHING_PRINCIPLES = freezeList([
  freeze({ id: 'meaning-before-label', statement: 'Choose tense from the intended time meaning and sentence context before relying on a grammatical label.' }),
  freeze({ id: 'clues-not-rules', statement: 'Time words such as yesterday, usually and now are useful clues, but they are not mechanical rules that determine tense by themselves.' }),
  freeze({ id: 'form-and-use-together', statement: 'Teach the verb form together with the meaning it expresses so children do not learn isolated conjugation charts without application.' }),
  freeze({ id: 'oral-to-written-transfer', statement: 'When writing load is high, stabilise the tense orally first, then transfer the same meaning into a fresh written sentence or connected passage.' }),
  freeze({ id: 'future-time-system', statement: 'English future time is expressed through more than one construction; will is a useful starting form but not the only future option.' }),
  freeze({ id: 'connected-language-check', statement: 'Tense control is not secure until the child can maintain or intentionally shift time across connected speaking and writing.' }),
]);

export const GRAMMAR_WRITING_TENSE_NODES = freezeList([
  tense({
    id: 'simple-present', order: 1, label: 'Simple Present', family: 'simple', timeFrame: 'present',
    childFriendlyMeaning: 'Use the simple present for routines, repeated actions, facts and states that are generally true rather than automatically for an action happening at this exact moment.',
    formPatterns: ['I/you/we/they + base verb', 'he/she/it + verb-s/es', 'do/does not + base verb', 'Do/Does + subject + base verb?'],
    meaningUses: ['habits and routines', 'repeated actions', 'facts and general truths', 'stable states'],
    timeClues: ['usually', 'always', 'often', 'sometimes', 'never', 'every day', 'on Mondays'],
    examples: ['Maya wears glasses.', 'We read after dinner.', 'Plants need water and light.'],
    teachingBoundary: 'Do not define simple present as “happening now.” Contrast routine/general meaning with present continuous when the child is ready.',
    prerequisiteTenseIds: [], nextTenseIds: ['simple-past', 'present-continuous'],
    comparisonIds: ['simple-present-vs-present-continuous'],
    commonErrorIds: ['simple-present-now-confusion', 'third-person-s-omission'],
    writingApplications: ['describe routines', 'write facts', 'state general characteristics consistently'],
    curriculumAnchors: [
      { courseSlug: 'basic-grammar', lessonNumber: 25, lessonTitle: 'Simple Present Tense' },
      { courseSlug: 'advanced-grammar', lessonNumber: 2, lessonTitle: 'Simple Present Tense' },
      { courseSlug: 'advanced-grammar', lessonNumber: 7, lessonTitle: 'Present Time: Simple Present vs Present Continuous' },
    ],
  }),
  tense({
    id: 'simple-past', order: 2, label: 'Simple Past', family: 'simple', timeFrame: 'past',
    childFriendlyMeaning: 'Use the simple past for an event, action or state understood as completed in the past, including regular -ed forms and high-frequency irregular verbs.',
    formPatterns: ['regular verb + -ed where appropriate', 'irregular past form where required', 'did not + base verb', 'Did + subject + base verb?'],
    meaningUses: ['completed past events', 'past actions in sequence', 'finished past states', 'retelling what happened'],
    timeClues: ['yesterday', 'last night', 'last week', 'ago', 'then'],
    examples: ['Tara visited her grandmother yesterday.', 'We went to the park.', 'He did not finish the book.'],
    teachingBoundary: 'Do not reduce past tense to adding -ed. Children need regular and irregular forms, and after did/did not the main verb returns to its base form.',
    prerequisiteTenseIds: ['simple-present'], nextTenseIds: ['simple-future-will', 'past-continuous', 'present-perfect'],
    comparisonIds: ['simple-past-vs-past-continuous', 'present-perfect-vs-simple-past', 'past-perfect-vs-simple-past'],
    commonErrorIds: ['past-base-form-in-past-context', 'irregular-past-overgeneralisation', 'did-double-past-marking', 'present-perfect-finished-time-marker', 'past-perfect-sequence-confusion'],
    writingApplications: ['retell completed events', 'write past-event sequences', 'maintain past time in short narratives'],
    curriculumAnchors: [
      { courseSlug: 'basic-grammar', lessonNumber: 26, lessonTitle: 'Simple Past Tense' },
      { courseSlug: 'advanced-grammar', lessonNumber: 3, lessonTitle: 'Simple Past Tense' },
      { courseSlug: 'advanced-grammar', lessonNumber: 8, lessonTitle: 'Past Time: Simple Past vs Past Continuous' },
      { courseSlug: 'advanced-grammar', lessonNumber: 10, lessonTitle: 'Present Perfect & Simple Past' },
      { courseSlug: 'advanced-grammar', lessonNumber: 11, lessonTitle: 'Past Perfect & Event Sequence' },
    ],
  }),
  tense({
    id: 'simple-future-will', order: 3, label: 'Simple Future (will)', family: 'future', timeFrame: 'future',
    childFriendlyMeaning: 'Use will + base verb as an accessible way to express future predictions, decisions, promises and other later-time meanings while recognising that English has additional future constructions.',
    formPatterns: ['subject + will + base verb', 'subject + will not/won’t + base verb', 'Will + subject + base verb?'],
    meaningUses: ['predictions', 'decisions made at the moment', 'promises and offers', 'straightforward future statements'],
    timeClues: ['tomorrow', 'later', 'soon', 'next week', 'in the future'],
    examples: ['I will call you later.', 'It will rain tomorrow.', 'We will help you.'],
    teachingBoundary: 'Keep the classroom-friendly “simple future” label, but do not imply that will is the only way English expresses future time.',
    prerequisiteTenseIds: ['simple-past'], nextTenseIds: ['future-forms'],
    comparisonIds: ['future-forms-choice'],
    commonErrorIds: ['will-nonbase-verb', 'future-form-meaning-mismatch'],
    writingApplications: ['write predictions', 'state future decisions or promises', 'shift a familiar sentence into future time'],
    curriculumAnchors: [
      { courseSlug: 'basic-grammar', lessonNumber: 27, lessonTitle: 'Simple Future Tense' },
      { courseSlug: 'advanced-grammar', lessonNumber: 4, lessonTitle: 'Simple Future Tense' },
      { courseSlug: 'advanced-grammar', lessonNumber: 9, lessonTitle: 'Talking About the Future Naturally' },
    ],
  }),
  tense({
    id: 'present-continuous', order: 4, label: 'Present Continuous', family: 'continuous', timeFrame: 'present',
    childFriendlyMeaning: 'Use the present continuous for an action or temporary situation in progress around now, and later for some arranged future events when context makes that meaning clear.',
    formPatterns: ['subject + am/is/are + verb-ing', 'subject + am/is/are not + verb-ing', 'Am/Is/Are + subject + verb-ing?'],
    meaningUses: ['actions happening now', 'temporary present situations', 'developing situations', 'arranged future events in later instruction'],
    timeClues: ['now', 'right now', 'at the moment', 'today', 'this week', 'currently'],
    examples: ['Maya is wearing her blue jacket now.', 'They are reading at the moment.', 'We are meeting Grandma tomorrow.'],
    teachingBoundary: 'The -ing form alone is not the tense; the child needs the correct form of be. Do not make clue words override meaning.',
    prerequisiteTenseIds: ['simple-present'], nextTenseIds: ['past-continuous', 'future-forms'],
    comparisonIds: ['simple-present-vs-present-continuous'],
    commonErrorIds: ['continuous-missing-be', 'simple-present-now-confusion'],
    writingApplications: ['describe an action in progress', 'contrast routine with current action', 'describe a temporary situation'],
    curriculumAnchors: [{ courseSlug: 'advanced-grammar', lessonNumber: 7, lessonTitle: 'Present Time: Simple Present vs Present Continuous' }],
  }),
  tense({
    id: 'past-continuous', order: 5, label: 'Past Continuous', family: 'continuous', timeFrame: 'past',
    childFriendlyMeaning: 'Use the past continuous for an action that was in progress at a past time, especially when another event happened or when setting the background of a past scene.',
    formPatterns: ['subject + was/were + verb-ing', 'subject + was/were not + verb-ing', 'Was/Were + subject + verb-ing?'],
    meaningUses: ['past actions in progress', 'story background actions', 'interrupted ongoing actions', 'simultaneous past actions'],
    timeClues: ['while', 'when', 'at that moment', 'at 7 o’clock yesterday'],
    examples: ['I was reading when the phone rang.', 'They were playing while it was raining.', 'She was sleeping at ten.'],
    teachingBoundary: 'Past continuous describes an ongoing past frame; it should not replace simple past for every completed event in a narrative.',
    prerequisiteTenseIds: ['simple-past', 'present-continuous'], nextTenseIds: ['tense-consistency-transfer'],
    comparisonIds: ['simple-past-vs-past-continuous'],
    commonErrorIds: ['past-continuous-wrong-auxiliary'],
    writingApplications: ['set a past scene', 'show interruption', 'combine background and completed events'],
    curriculumAnchors: [{ courseSlug: 'advanced-grammar', lessonNumber: 8, lessonTitle: 'Past Time: Simple Past vs Past Continuous' }],
  }),
  tense({
    id: 'future-forms', order: 6, label: 'Future Forms & Choice', family: 'future-system', timeFrame: 'future',
    childFriendlyMeaning: 'Choose among common future constructions according to meaning: will for suitable predictions or decisions, be going to for intentions or evidence-based predictions, and present forms for arrangements or schedules where suitable.',
    formPatterns: ['will + base verb', 'am/is/are going to + base verb', 'present continuous for a planned arrangement', 'simple present for a fixed timetable or schedule'],
    meaningUses: ['predictions', 'intentions and plans', 'arrangements', 'scheduled future events'],
    timeClues: ['tomorrow', 'next week', 'this evening', 'at six tomorrow', 'on Friday'],
    examples: ['I think it will rain.', 'We are going to visit the museum.', 'I am meeting my teacher at five.', 'The train leaves at six.'],
    teachingBoundary: 'Future time is a meaning system, not one conjugated tense. Do not teach will, going to and present forms as interchangeable just because they all refer to later time.',
    prerequisiteTenseIds: ['simple-future-will', 'present-continuous'], nextTenseIds: ['tense-consistency-transfer'],
    comparisonIds: ['future-forms-choice'],
    commonErrorIds: ['will-nonbase-verb', 'going-to-missing-be', 'future-form-meaning-mismatch'],
    writingApplications: ['write plans and intentions', 'choose a natural future form', 'edit repetitive overuse of will'],
    curriculumAnchors: [{ courseSlug: 'advanced-grammar', lessonNumber: 9, lessonTitle: 'Talking About the Future Naturally' }],
  }),
  tense({
    id: 'present-perfect', order: 7, label: 'Present Perfect', family: 'perfect', timeFrame: 'present-linked-past',
    childFriendlyMeaning: 'Use the present perfect when a past event or experience is connected to the present and the focus is not a finished past time point, including experience, recent result and unfinished time contexts.',
    formPatterns: ['subject + have/has + past participle', 'subject + have/has not + past participle', 'Have/Has + subject + past participle?'],
    meaningUses: ['life experience', 'recent events with present relevance', 'unfinished time periods', 'situations continuing to the present'],
    timeClues: ['ever', 'never', 'already', 'yet', 'just', 'so far', 'since', 'for'],
    examples: ['I have visited Delhi twice.', 'She has just finished her homework.', 'We have lived here for three years.'],
    teachingBoundary: 'Do not treat present perfect as simply another past tense. Contrast it explicitly with simple past when a finished past time such as yesterday is named.',
    prerequisiteTenseIds: ['simple-past'], nextTenseIds: ['past-perfect', 'tense-consistency-transfer'],
    comparisonIds: ['present-perfect-vs-simple-past'],
    commonErrorIds: ['present-perfect-wrong-auxiliary-or-participle', 'present-perfect-finished-time-marker'],
    writingApplications: ['write about experiences', 'connect recent events to present results', 'choose between finished and present-linked past'],
    curriculumAnchors: [{ courseSlug: 'advanced-grammar', lessonNumber: 10, lessonTitle: 'Present Perfect & Simple Past' }],
  }),
  tense({
    id: 'past-perfect', order: 8, label: 'Past Perfect', family: 'perfect', timeFrame: 'earlier-past',
    childFriendlyMeaning: 'Use the past perfect when the writer or speaker needs to make one past event clearly earlier than another past reference point, especially when event order would otherwise be unclear.',
    formPatterns: ['subject + had + past participle', 'subject + had not + past participle', 'Had + subject + past participle?'],
    meaningUses: ['earlier event before another past event', 'clarifying event sequence', 'completed earlier-past background'],
    timeClues: ['before', 'after', 'already', 'by the time'],
    examples: ['The film had started before we arrived.', 'She had finished her work when her friend called.', 'By the time I reached school, the bell had rung.'],
    teachingBoundary: 'Do not require past perfect for every sentence containing two past events. Use it when the earlier-past relationship needs to be made explicit.',
    prerequisiteTenseIds: ['present-perfect'], nextTenseIds: ['tense-consistency-transfer'],
    comparisonIds: ['past-perfect-vs-simple-past'],
    commonErrorIds: ['past-perfect-sequence-confusion'],
    writingApplications: ['clarify event order in narratives', 'show an earlier cause or background event', 'edit ambiguous past sequences'],
    curriculumAnchors: [{ courseSlug: 'advanced-grammar', lessonNumber: 11, lessonTitle: 'Past Perfect & Event Sequence' }],
  }),
  tense({
    id: 'tense-consistency-transfer', order: 9, label: 'Tense Consistency & Transfer', family: 'transfer', timeFrame: 'cross-time',
    childFriendlyMeaning: 'Maintain the intended time frame across connected speaking and writing, and change tense only when the meaning or time relationship genuinely changes rather than drifting accidentally between forms.',
    formPatterns: [],
    meaningUses: ['maintaining tense across connected sentences', 'intentional time shifts', 'editing tense drift', 'independent tense choice without supplied clue words'],
    timeClues: [],
    examples: ['Yesterday we visited the zoo. We saw two lions and watched the penguins.', 'I usually walk to school, but today I am taking the bus.'],
    teachingBoundary: 'Consistency does not mean using one tense forever. A purposeful tense shift is correct when the time meaning changes; the target is controlled choice, not uniformity.',
    prerequisiteTenseIds: ['past-continuous', 'future-forms', 'present-perfect', 'past-perfect'], nextTenseIds: [],
    comparisonIds: [],
    commonErrorIds: ['tense-drift-connected-language', 'clue-word-matching-without-meaning', 'controlled-practice-transfer-gap'],
    writingApplications: ['maintain tense in a paragraph', 'edit narrative tense drift', 'shift time intentionally', 'transfer tense control into fresh writing'],
    curriculumAnchors: [{ courseSlug: 'advanced-grammar', lessonNumber: 12, lessonTitle: 'Tense Mastery: Speak, Write & Edit' }],
  }),
]);

export const GRAMMAR_WRITING_TENSE_COMPARISONS = freezeList([
  comparison({ id: 'simple-present-vs-present-continuous', order: 1, label: 'Simple Present vs Present Continuous', tenseIds: ['simple-present', 'present-continuous'], decisionQuestion: 'Is this a routine/general truth, or an action/temporary situation in progress around now?', distinction: 'Use simple present for routines and general states; use present continuous for actions or temporary situations in progress around the present.', contrastExamples: ['Maya wears glasses. / Maya is wearing sunglasses today.', 'I read every evening. / I am reading now.'], commonErrorIds: ['simple-present-now-confusion', 'continuous-missing-be'], curriculumAnchors: [{ courseSlug: 'advanced-grammar', lessonNumber: 7, lessonTitle: 'Present Time: Simple Present vs Present Continuous' }] }),
  comparison({ id: 'simple-past-vs-past-continuous', order: 2, label: 'Simple Past vs Past Continuous', tenseIds: ['simple-past', 'past-continuous'], decisionQuestion: 'Is the past event completed, or was it in progress at a particular past moment/background?', distinction: 'Use simple past for completed events and event steps; use past continuous for an ongoing past frame, often around another event.', contrastExamples: ['The phone rang. / I was reading when the phone rang.', 'We played outside. / We were playing outside when it started to rain.'], commonErrorIds: ['past-base-form-in-past-context', 'past-continuous-wrong-auxiliary'], curriculumAnchors: [{ courseSlug: 'advanced-grammar', lessonNumber: 8, lessonTitle: 'Past Time: Simple Past vs Past Continuous' }] }),
  comparison({ id: 'future-forms-choice', order: 3, label: 'Choosing Future Forms', tenseIds: ['simple-future-will', 'future-forms'], decisionQuestion: 'Is the speaker predicting, deciding, expressing an intention, describing an arrangement, or referring to a fixed schedule?', distinction: 'Future meaning can use will, be going to, present continuous or simple present depending on purpose and context; the forms are related but not interchangeable.', contrastExamples: ['I think it will rain. / Look at those clouds—it is going to rain.', 'I will call her. / I am meeting her at five.'], commonErrorIds: ['future-form-meaning-mismatch', 'going-to-missing-be', 'will-nonbase-verb'], curriculumAnchors: [{ courseSlug: 'advanced-grammar', lessonNumber: 9, lessonTitle: 'Talking About the Future Naturally' }] }),
  comparison({ id: 'present-perfect-vs-simple-past', order: 4, label: 'Present Perfect vs Simple Past', tenseIds: ['present-perfect', 'simple-past'], decisionQuestion: 'Is the event tied to a finished past time, or connected to the present without a finished past time point?', distinction: 'Use simple past with completed past-time reference; use present perfect when the past is connected to the present and finished past time is not the focus.', contrastExamples: ['I visited Delhi last year. / I have visited Delhi twice.', 'She finished at six. / She has just finished.'], commonErrorIds: ['present-perfect-finished-time-marker', 'present-perfect-wrong-auxiliary-or-participle'], curriculumAnchors: [{ courseSlug: 'advanced-grammar', lessonNumber: 10, lessonTitle: 'Present Perfect & Simple Past' }] }),
  comparison({ id: 'past-perfect-vs-simple-past', order: 5, label: 'Past Perfect & Event Sequence', tenseIds: ['past-perfect', 'simple-past'], decisionQuestion: 'Do we need to make one past event explicitly earlier than another past reference point?', distinction: 'Simple past can narrate a clear chronological sequence; past perfect is useful when an earlier-past event must be distinguished from another past event.', contrastExamples: ['We arrived and the film started. / The film had started before we arrived.', 'She finished the work and called me. / She had finished the work before she called me.'], commonErrorIds: ['past-perfect-sequence-confusion'], curriculumAnchors: [{ courseSlug: 'advanced-grammar', lessonNumber: 11, lessonTitle: 'Past Perfect & Event Sequence' }] }),
]);

export const GRAMMAR_WRITING_TENSE_ERROR_PATTERNS = freezeList([
  errorPattern({ id: 'simple-present-now-confusion', category: 'meaning', tenseIds: ['simple-present', 'present-continuous'], incorrectExample: 'I play football now.', correction: 'I am playing football now.', diagnosis: 'The child may be treating all present-time meaning as simple present instead of distinguishing routine meaning from an action in progress.', teachingResponse: 'Contrast the same verb in a routine sentence and a right-now sentence, then remove the clue and ask the child to explain the choice.' }),
  errorPattern({ id: 'third-person-s-omission', category: 'form', tenseIds: ['simple-present'], incorrectExample: 'She walk to school every day.', correction: 'She walks to school every day.', diagnosis: 'The child has the correct time meaning but has not consistently marked third-person singular present agreement.', teachingResponse: 'Keep time meaning stable and practise subject–verb contrasts such as I walk / she walks before returning to fresh sentences.' }),
  errorPattern({ id: 'continuous-missing-be', category: 'form', tenseIds: ['present-continuous'], incorrectExample: 'She running now.', correction: 'She is running now.', diagnosis: 'The child recognises the -ing idea but is treating the participle as a complete verb phrase without am/is/are.', teachingResponse: 'Build the continuous as correct form of be + verb-ing, then vary the subject so the auxiliary must change.' }),
  errorPattern({ id: 'past-base-form-in-past-context', category: 'form', tenseIds: ['simple-past'], incorrectExample: 'Yesterday I go to school.', correction: 'Yesterday I went to school.', diagnosis: 'The child understands past time but defaults to a familiar base verb or has not secured the required irregular form.', teachingResponse: 'Acknowledge the correct past meaning, retrieve the past form, and reuse that verb in another fresh past sentence.' }),
  errorPattern({ id: 'irregular-past-overgeneralisation', category: 'morphology', tenseIds: ['simple-past'], incorrectExample: 'Yesterday I eated pizza.', correction: 'Yesterday I ate pizza.', diagnosis: 'The child has discovered the regular -ed pattern and over-applied it to an irregular verb.', teachingResponse: 'Preserve the successful past-time idea, contrast regular and irregular forms, and recycle a small high-frequency irregular set.' }),
  errorPattern({ id: 'did-double-past-marking', category: 'form', tenseIds: ['simple-past'], incorrectExample: 'Did she went home?', correction: 'Did she go home?', diagnosis: 'Past marking is appearing on both did and the main verb instead of only on the auxiliary.', teachingResponse: 'Show that did already carries past time, so the following main verb returns to its base form; practise matched question/answer pairs.' }),
  errorPattern({ id: 'past-continuous-wrong-auxiliary', category: 'form', tenseIds: ['past-continuous'], incorrectExample: 'They was playing outside.', correction: 'They were playing outside.', diagnosis: 'The child understands ongoing past meaning but has not matched was/were to the subject.', teachingResponse: 'Reconnect the form to subject agreement, then practise the whole was/were + verb-ing phrase inside background-event sentences.' }),
  errorPattern({ id: 'will-nonbase-verb', category: 'form', tenseIds: ['simple-future-will', 'future-forms'], incorrectExample: 'I will went tomorrow.', correction: 'I will go tomorrow.', diagnosis: 'The child marks future with will but also changes the main verb instead of keeping the base form.', teachingResponse: 'Treat will as the time-carrying auxiliary and contrast will go / went / am going with the same lexical verb.' }),
  errorPattern({ id: 'going-to-missing-be', category: 'form', tenseIds: ['future-forms'], incorrectExample: 'We going to visit Grandma.', correction: 'We are going to visit Grandma.', diagnosis: 'The child knows the going to sequence but omits the required form of be.', teachingResponse: 'Build subject + am/is/are + going to + base verb and vary subjects before returning to plan and intention examples.' }),
  errorPattern({ id: 'future-form-meaning-mismatch', category: 'meaning', tenseIds: ['simple-future-will', 'future-forms'], incorrectExample: 'The child uses will for every future context, including fixed arrangements and schedules.', correction: 'Choose the future form that best matches prediction, decision, intention, arrangement or schedule meaning.', diagnosis: 'The learner recognises future time but has not yet differentiated the purposes served by common English future constructions.', teachingResponse: 'Classify the intended future meaning first, then choose among will, going to, present continuous and simple present as appropriate.' }),
  errorPattern({ id: 'present-perfect-wrong-auxiliary-or-participle', category: 'form', tenseIds: ['present-perfect'], incorrectExample: 'She has went home.', correction: 'She has gone home.', diagnosis: 'The child uses the correct perfect auxiliary but substitutes a simple-past form for the past participle.', teachingResponse: 'Practise a small verb family across base / past / past participle, then rebuild the full have/has + participle pattern in context.' }),
  errorPattern({ id: 'present-perfect-finished-time-marker', category: 'meaning', tenseIds: ['present-perfect', 'simple-past'], incorrectExample: 'I have visited Delhi last year.', correction: 'I visited Delhi last year.', diagnosis: 'The child combines present perfect with an explicitly finished past-time reference where simple past is normally required.', teachingResponse: 'Contrast a finished-time sentence with an experience sentence: last year → simple past; no finished time → present perfect.' }),
  errorPattern({ id: 'past-perfect-sequence-confusion', category: 'meaning', tenseIds: ['past-perfect', 'simple-past'], incorrectExample: 'I had went to school before the rain started.', correction: 'I had gone to school before the rain started.', diagnosis: 'The child may understand earlier-past meaning but has not formed the participle correctly, or may use past perfect mechanically.', teachingResponse: 'Establish the two past events and their order first, decide whether earlier-past marking is useful, then focus on had + participle.' }),
  errorPattern({ id: 'tense-drift-connected-language', category: 'consistency', tenseIds: ['tense-consistency-transfer'], incorrectExample: 'Yesterday we went to the park. We play football and saw a dog.', correction: 'Yesterday we went to the park. We played football and saw a dog.', diagnosis: 'The child can form individual tense examples but loses the chosen time frame while producing connected language.', teachingResponse: 'Use a short retell or paragraph, mark the intended time frame once, and audit each verb for purposeful consistency.' }),
  errorPattern({ id: 'clue-word-matching-without-meaning', category: 'strategy', tenseIds: ['tense-consistency-transfer'], incorrectExample: 'The child chooses a memorised tense whenever one clue word appears, even when the wider meaning requires another form.', correction: 'Use the full sentence meaning and context to choose the tense; clue words support the decision but do not make it automatic.', diagnosis: 'The learner may have learned a keyword-matching test strategy instead of a transferable time-and-meaning system.', teachingResponse: 'Vary or remove clue words and require a short explanation of why the chosen tense fits the meaning.' }),
  errorPattern({ id: 'controlled-practice-transfer-gap', category: 'transfer', tenseIds: ['tense-consistency-transfer'], incorrectExample: 'The child scores well on tense worksheets but switches forms unpredictably in spontaneous speaking or independent writing.', correction: 'Move from recognition and controlled choice into oral production, fresh sentence generation, connected writing and self-editing.', diagnosis: 'Tense knowledge is available under prompts but is not yet automatic or independently retrievable during real language production.', teachingResponse: 'Use HEAR → NOTICE → CHOOSE → SAY → WRITE → TRANSFER, reducing prompts and changing topics so the tense must be retrieved independently.' }),
]);

const tenseById = new Map(GRAMMAR_WRITING_TENSE_NODES.map((item) => [item.id, item]));
const comparisonById = new Map(GRAMMAR_WRITING_TENSE_COMPARISONS.map((item) => [item.id, item]));
const errorById = new Map(GRAMMAR_WRITING_TENSE_ERROR_PATTERNS.map((item) => [item.id, item]));

export const GRAMMAR_WRITING_TENSE_NEXT_EDGES = freezeList(GRAMMAR_WRITING_TENSE_NODES.flatMap((source) => source.nextTenseIds.map((targetTenseId) => freeze({ sourceTenseId: source.id, relation: 'next', targetTenseId }))));
export const getGrammarWritingTense = (id) => tenseById.get(String(id || '')) ?? null;
export const getGrammarWritingTensePrerequisites = (id) => freezeList((getGrammarWritingTense(id)?.prerequisiteTenseIds ?? []).map((tenseId) => getGrammarWritingTense(tenseId)).filter(Boolean));
export const getGrammarWritingNextTenses = (id) => freezeList((getGrammarWritingTense(id)?.nextTenseIds ?? []).map((tenseId) => getGrammarWritingTense(tenseId)).filter(Boolean));
export const getGrammarWritingTenseComparison = (id) => comparisonById.get(String(id || '')) ?? null;
export const getGrammarWritingTenseComparisonsForTense = (tenseId) => freezeList(GRAMMAR_WRITING_TENSE_COMPARISONS.filter((item) => item.tenseIds.includes(String(tenseId || ''))));
export const getGrammarWritingTenseErrorPattern = (id) => errorById.get(String(id || '')) ?? null;
export const getGrammarWritingTenseErrorsForTense = (tenseId) => freezeList(GRAMMAR_WRITING_TENSE_ERROR_PATTERNS.filter((item) => item.tenseIds.includes(String(tenseId || ''))));

function canReach(startId, targetId) {
  const seen = new Set();
  const queue = [startId];
  while (queue.length) {
    const currentId = queue.shift();
    if (currentId === targetId) return true;
    if (seen.has(currentId)) continue;
    seen.add(currentId);
    for (const nextId of tenseById.get(currentId)?.nextTenseIds ?? []) queue.push(nextId);
  }
  return false;
}

if (getGrammarWritingSkill(GRAMMAR_WRITING_TENSE_PARENT_SKILL_ID)?.label !== 'Tenses') throw new Error('GR2 must refine the existing GR1 Tenses node rather than create a second taxonomy.');
if (tenseById.size !== 9 || comparisonById.size !== 5 || errorById.size !== 16) throw new Error('GR2 contains duplicate or missing architecture IDs.');
if (GRAMMAR_WRITING_TENSE_NODES.map((item) => item.order).join(',') !== '1,2,3,4,5,6,7,8,9') throw new Error('GR2 tense order must remain stable.');
if (GRAMMAR_WRITING_TENSE_COMPARISONS.map((item) => item.order).join(',') !== '1,2,3,4,5') throw new Error('GR2 comparison order must remain stable.');

for (const item of GRAMMAR_WRITING_TENSE_NODES) {
  if (!item.childFriendlyMeaning || item.childFriendlyMeaning.length < 80 || !item.meaningUses.length || !item.examples.length || !item.teachingBoundary || !item.writingApplications.length || !item.curriculumAnchors.length) throw new Error(`GR2 tense node is incomplete: ${item.id}.`);
  if (item.id !== GRAMMAR_WRITING_TENSE_TERMINAL_ID && !item.formPatterns.length) throw new Error(`GR2 form patterns are missing: ${item.id}.`);
  for (const prerequisiteId of item.prerequisiteTenseIds) {
    if (!tenseById.has(prerequisiteId) || !tenseById.get(prerequisiteId).nextTenseIds.includes(item.id)) throw new Error(`GR2 prerequisite edge is not reciprocal: ${prerequisiteId} -> ${item.id}.`);
  }
  for (const nextId of item.nextTenseIds) {
    if (!tenseById.has(nextId) || !tenseById.get(nextId).prerequisiteTenseIds.includes(item.id)) throw new Error(`GR2 next edge is not reciprocal: ${item.id} -> ${nextId}.`);
  }
  for (const comparisonId of item.comparisonIds) {
    if (!comparisonById.get(comparisonId)?.tenseIds.includes(item.id)) throw new Error(`GR2 comparison is not reciprocal: ${item.id} -> ${comparisonId}.`);
  }
  for (const errorId of item.commonErrorIds) {
    if (!errorById.get(errorId)?.tenseIds.includes(item.id)) throw new Error(`GR2 error pattern is not reciprocal: ${item.id} -> ${errorId}.`);
  }
}
for (const item of GRAMMAR_WRITING_TENSE_COMPARISONS) {
  for (const tenseId of item.tenseIds) if (!tenseById.get(tenseId)?.comparisonIds.includes(item.id)) throw new Error(`GR2 comparison backlink is missing: ${item.id} -> ${tenseId}.`);
  for (const errorId of item.commonErrorIds) if (!errorById.has(errorId)) throw new Error(`GR2 comparison points to unknown error: ${item.id} -> ${errorId}.`);
}
for (const item of GRAMMAR_WRITING_TENSE_ERROR_PATTERNS) {
  if (!item.tenseIds.length || !item.incorrectExample || !item.correction || !item.diagnosis || !item.teachingResponse) throw new Error(`GR2 error pattern is incomplete: ${item.id}.`);
  for (const tenseId of item.tenseIds) if (!tenseById.get(tenseId)?.commonErrorIds.includes(item.id)) throw new Error(`GR2 error backlink is missing: ${item.id} -> ${tenseId}.`);
}
if (getGrammarWritingTense(GRAMMAR_WRITING_TENSE_ROOT_ID)?.prerequisiteTenseIds.length) throw new Error('GR2 tense root must not have prerequisites.');
if (getGrammarWritingTense(GRAMMAR_WRITING_TENSE_TERMINAL_ID)?.nextTenseIds.length) throw new Error('GR2 tense terminal must not have next nodes.');
for (const item of GRAMMAR_WRITING_TENSE_NODES) {
  if (!canReach(GRAMMAR_WRITING_TENSE_ROOT_ID, item.id)) throw new Error(`GR2 tense is unreachable from root: ${item.id}.`);
  if (!canReach(item.id, GRAMMAR_WRITING_TENSE_TERMINAL_ID)) throw new Error(`GR2 tense cannot reach consistency/transfer: ${item.id}.`);
}
