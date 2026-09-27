export const GRAMMAR_KNOWLEDGE_TENSES_AND_FORMS = {
  'simple-present': {
    sourceIds: ['cambridge-present-simple', 'british-council-grammar'],
    whyItMatters: 'The simple present is one of the core systems for everyday communication. It supports routines, facts, instructions and stable states, and its do/does patterns become the basis for many later questions, negatives and tense contrasts.',
    rulePoints: [
      'The simple present commonly expresses routines, repeated actions, general facts and relatively stable states. It can also appear in instructions, commentaries and fixed schedules.',
      'With most verbs, I/you/we/they use the base form while he/she/it takes -s or -es in affirmative clauses. Be and a few other very common verbs have irregular forms.',
      'Questions and negatives normally use do/does plus the base form: “Does she play?” and “She does not play.” The main verb does not keep a second third-person -s after does.',
    ],
    workedExamples: [
      { example: 'Maya walks to school every day.', explanation: 'Walks matches the third-person singular subject Maya and describes a routine.' },
      { example: 'Plants need water.', explanation: 'Need expresses a general fact rather than an action limited to this moment.' },
      { example: 'Does he read before bed?', explanation: 'Does carries the third-person marking, so read stays in the base form.' },
    ],
    teachingNote: 'Anchor the tense in meaning before drilling endings. Ask whether the child is describing a routine, fact or stable state. Then check form. This reduces the common habit of choosing a tense only because a time word appears nearby.',
    trickyCases: [
      'The simple present can refer to scheduled future events, as in “The train leaves at six,” because the event is treated as part of a timetable.',
      'Some state verbs are normally used in simple rather than continuous forms when they describe states such as knowing, believing or needing.',
    ],
    faqs: [
      { question: 'Why do we add -s only with he, she and it?', answer: 'In the ordinary present-simple system, third-person singular subjects carry a special agreement form on most lexical verbs. Other present-simple subjects use the base form.' },
      { question: 'Is simple present always about the present moment?', answer: 'No. It often describes habits, facts, states and schedules rather than an event unfolding right now.' },
    ],
  },
  'simple-past': {
    sourceIds: ['cambridge-past-simple-continuous', 'british-council-grammar'],
    whyItMatters: 'The simple past is fundamental for recounts, stories and explanations of completed events. Accurate control of regular, irregular and did-based forms gives children a reliable base for more advanced narrative tense choices. It also supports sequencing because children can place several finished events in a clear order before learning how background and earlier-past forms interact with them.',
    rulePoints: [
      'The simple past presents an event, action or state as located in a completed past time. The speaker views the event as a whole rather than as ongoing background.',
      'Regular verbs usually form the past with -ed, but many high-frequency verbs are irregular. Children need both pattern knowledge and repeated exposure to common irregular forms.',
      'Questions and negatives normally use did plus the base form: “Did she go?” and “She did not go.” Using did went or did finished duplicates the past marking.',
    ],
    workedExamples: [
      { example: 'We visited the museum yesterday.', explanation: 'Visited presents the trip as a completed event at a finished past time.' },
      { example: 'She went home early.', explanation: 'Went is the irregular simple-past form of go.' },
      { example: 'Did he finish the book?', explanation: 'Did carries the past marking, so finish returns to its base form.' },
    ],
    teachingNote: 'Teach past meaning first, then verb form. A timeline or short retell works well: identify what is finished, sequence the events, and only then check regular and irregular forms.',
    trickyCases: [
      'A past-time sentence can contain more than one tense when one event was already in progress or had happened earlier. The simple past is not the only form available for past meaning.',
      'Time expressions such as yesterday or last year strongly favour the simple past because they locate the event inside a finished period.',
    ],
    faqs: [
      { question: 'Why is “Did she went?” incorrect?', answer: 'Did already marks the question as past, so the main verb returns to its base form: “Did she go?”' },
      { question: 'Do all past verbs end in -ed?', answer: 'No. English has many irregular past forms such as went, saw, made and took.' },
    ],
  },
  'simple-future': {
    sourceIds: ['cambridge-future', 'british-council-future-forms'],
    whyItMatters: 'Will is a useful first future pattern because its form is simple and stable. Teaching its real meanings also prevents children from assuming that every future idea requires will, preparing them for the wider future system.',
    rulePoints: [
      'Will + base verb is one common way to refer to future time, especially for spontaneous decisions, predictions, promises and willingness. It is useful for beginners but is not the whole English future system.',
      'The form is stable across subjects: I will go, she will go, they will go. Questions invert will and the subject, and negatives use will not or won’t.',
      'English also uses going to, present continuous, present simple and other constructions for future meaning. The most natural choice depends on whether the speaker means a prediction, prior plan, arrangement or schedule.',
    ],
    workedExamples: [
      { example: 'I will help you.', explanation: 'Will can express a decision or willingness made in the speaking situation.' },
      { example: 'It will probably rain later.', explanation: 'Will commonly expresses a prediction, especially when paired with a certainty marker such as probably.' },
      { example: 'Will she join us?', explanation: 'The modal will moves before the subject to form the question; join stays in the base form.' },
    ],
    teachingNote: 'Present will as a useful future form, not as “the future tense.” Once the form is secure, compare it with going to and present continuous so children learn to choose a future construction by meaning.',
    trickyCases: [
      'English has no single verb ending that functions as a universal future tense; several present/modal constructions can refer to future time.',
      'After time and condition words such as when and if, English often uses a present form rather than will in the subordinate clause: “I’ll call when I arrive.”',
    ],
    faqs: [
      { question: 'Can we use will for every future sentence?', answer: 'It may be grammatically possible in some contexts, but it is often not the most natural choice for prior plans, arrangements or schedules.' },
      { question: 'Does the verb change after will?', answer: 'No. The ordinary pattern is will + base verb, such as will go, will read and will help.' },
    ],
  },
  'modal-verbs': {
    sourceIds: ['british-council-modals', 'cambridge-grammar'],
    whyItMatters: 'Modal verbs allow children to express shades of meaning rather than only facts: ability, possibility, permission, advice, necessity and prediction. This makes them important for both accurate grammar and more mature communication.',
    rulePoints: [
      'Core modal verbs such as can, could, may, might, must, should, will and would combine with the base form of another verb and add meanings such as ability, possibility, advice, permission, obligation or prediction.',
      'Modals do not normally take -s with third-person singular subjects and do not use do/does/did to form ordinary questions or negatives. The modal itself moves before the subject in questions.',
      'Choosing the modal changes strength and stance. “You should check” gives advice; “You must check” expresses much stronger necessity or obligation.',
    ],
    workedExamples: [
      { example: 'She can swim.', explanation: 'Can expresses ability and is followed by the base verb swim.' },
      { example: 'It might rain later.', explanation: 'Might expresses possibility without presenting the event as certain.' },
      { example: 'Should we leave now?', explanation: 'Should comes before the subject in the question and the following verb stays in the base form.' },
    ],
    teachingNote: 'Teach modal meaning through contrasts rather than isolated definitions. Ask children to rank should, must and might by strength or purpose, then explain why one choice fits a situation better than another.',
    trickyCases: [
      'Some expressions behave similarly to modals but have different grammar, such as have to, be able to and be going to.',
      'Modal meaning can depend on context. Must can express obligation in one sentence and a strong logical conclusion in another.',
    ],
    faqs: [
      { question: 'Why do we say “She can swim,” not “She can swims”?', answer: 'A core modal is followed by the base form of the main verb, so third-person -s is not added after can.' },
      { question: 'What is the difference between should and must?', answer: 'Should often presents advice or a recommended action, while must commonly expresses a much stronger requirement or conclusion.' },
    ],
  },
  clauses: {
    sourceIds: ['british-council-clauses', 'cambridge-grammar'],
    whyItMatters: 'Clause awareness is the structural foundation of sentence building. Once children can distinguish independent and dependent clauses, conjunctions, complex sentences, punctuation and sentence-boundary errors become much easier to reason about.',
    rulePoints: [
      'A clause is built around a verb phrase and normally has a subject. An independent clause can stand as a complete sentence, while a dependent clause relies on another clause for a complete message.',
      'Dependent clauses can express relationships such as time, reason, condition, contrast or additional information about a noun. Their opening words often signal the relationship.',
      'Understanding clause boundaries helps children build complex sentences and also prevents fragments, comma splices and run-ons.',
    ],
    workedExamples: [
      { example: 'The children laughed.', explanation: 'This is an independent clause because it forms a complete statement with a subject and verb.' },
      { example: 'because the joke was funny', explanation: 'This reason clause is dependent; by itself it leaves the reader waiting for the main message.' },
      { example: 'The children laughed because the joke was funny.', explanation: 'The independent and dependent clauses combine to show both event and reason.' },
    ],
    teachingNote: 'Use the “complete message” test carefully. First identify the verb and subject, then ask whether the clause can stand independently. This is more reliable than simply judging whether a group of words sounds long enough to be a sentence.',
    trickyCases: [
      'A long group of words can still be a dependent clause if it begins with a subordinating relationship and cannot stand alone as the intended complete message.',
      'Some imperative clauses have an understood subject rather than an overt one, so “Stop!” is still a clause even though you is not written.',
    ],
    faqs: [
      { question: 'Is every clause a sentence?', answer: 'No. An independent clause can function as a sentence, but a dependent clause normally needs to be attached to a main clause.' },
      { question: 'Why teach clauses before advanced sentence writing?', answer: 'Clause awareness helps children control conjunctions, punctuation, complex sentences and common boundary errors.' },
    ],
  },
  'present-simple-vs-continuous': {
    sourceIds: ['cambridge-present-simple', 'british-council-present-continuous'],
    whyItMatters: 'This contrast teaches children that tense choice reflects viewpoint, not only time words. Distinguishing routine or state from temporary or ongoing activity is a major step toward flexible, natural control of English verbs.',
    rulePoints: [
      'The simple present typically presents routines, facts and states; the present continuous commonly presents activity in progress around now or a temporary situation. The contrast is about how the speaker views the situation.',
      'Present continuous uses a present form of be plus an -ing form: am working, is reading, are playing. Omitting be produces an incomplete standard continuous form.',
      'Some verbs describing states are not normally used in continuous forms with their ordinary state meaning, so “I know the answer” is more natural than “I am knowing the answer.”',
    ],
    workedExamples: [
      { example: 'Mina reads before bed.', explanation: 'Reads describes a regular habit, so the simple present fits.' },
      { example: 'Mina is reading now.', explanation: 'Is reading presents the activity as in progress at the moment.' },
      { example: 'We live in Hyderabad, but this month we are staying with relatives.', explanation: 'Live presents the stable home situation; are staying presents a temporary arrangement.' },
    ],
    teachingNote: 'Use paired contexts rather than isolated signal words. Ask “Is this a routine/state, or is it unfolding/temporary?” Then check the form. This prevents children from choosing continuous simply because the sentence contains now.',
    trickyCases: [
      'Present continuous can also describe future arrangements, so the form is not limited to actions happening at this exact second.',
      'Some verbs can be stative in one meaning and dynamic in another, so usage depends on the intended sense of the verb.',
    ],
    faqs: [
      { question: 'Does “now” always require present continuous?', answer: 'No. State verbs and other meanings can still use simple forms. The intended meaning and verb type matter more than one signal word.' },
      { question: 'Why does present continuous need be?', answer: 'Standard English forms the construction with a present form of be plus the -ing participle, such as is reading or are working.' },
    ],
  },
  'past-simple-vs-continuous': {
    sourceIds: ['cambridge-past-simple-continuous', 'british-council-grammar'],
    whyItMatters: 'This contrast is central to narrative writing because it separates completed story events from background activity in progress. Children who understand the distinction can create clearer timelines and more controlled storytelling.',
    rulePoints: [
      'The simple past often presents a completed event as a whole, while the past continuous presents an activity or temporary state as already in progress at a particular past time.',
      'Past continuous uses was/were + -ing. It is especially useful for background situations, interrupted activity and two events viewed as unfolding at the same time.',
      'A common narrative pattern uses past continuous for the background and simple past for the shorter event that enters or interrupts it.',
    ],
    workedExamples: [
      { example: 'I was reading when the lights went out.', explanation: 'Was reading gives the ongoing background; went out presents the shorter completed event.' },
      { example: 'They played football after school.', explanation: 'Played presents the activity as a completed past event without focusing on its internal progress.' },
      { example: 'At eight o’clock, we were travelling home.', explanation: 'Were travelling locates an activity already in progress at a past reference time.' },
    ],
    teachingNote: 'Use timelines and ask what the narrator wants the reader to “see.” If the event is the background scene, past continuous may fit; if it is treated as a completed step in the story, simple past often fits.',
    trickyCases: [
      'The contrast is not always “long action versus short action.” It is primarily about viewpoint: ongoing/background versus bounded/completed presentation.',
      'State verbs are less common in continuous forms, so not every situation lasting for a long time naturally takes past continuous.',
    ],
    faqs: [
      { question: 'Can both tenses appear in one sentence?', answer: 'Yes. They frequently work together, especially when an ongoing background event is interrupted by another completed event.' },
      { question: 'Is past continuous only for interrupted actions?', answer: 'No. It can also describe background scenes, temporary past situations or parallel ongoing activities.' },
    ],
  },
  'future-forms': {
    sourceIds: ['british-council-future-forms', 'cambridge-future'],
    whyItMatters: 'Choosing among future forms develops meaning-based grammar control. Children learn to distinguish decisions, intentions, arrangements, schedules and predictions instead of applying one future pattern to every situation.',
    rulePoints: [
      'English uses several constructions for future time. Will commonly suits spontaneous decisions and some predictions; going to often suits prior intentions or evidence-based predictions; present continuous commonly suits arrangements.',
      'Present simple can refer to timetabled or scheduled future events, while other future constructions such as future continuous and future perfect express different viewpoints.',
      'Choosing a future form is therefore a meaning decision, not a mechanical substitution. Two forms can sometimes be possible but may present the plan or prediction differently.',
    ],
    workedExamples: [
      { example: 'I forgot to call Mum. I’ll call her now.', explanation: 'Will fits a spontaneous decision made in response to the situation.' },
      { example: 'I’m going to start swimming lessons next month.', explanation: 'Going to presents an intention decided before the speaking moment.' },
      { example: 'We’re meeting the teacher at four.', explanation: 'Present continuous presents an arrangement that is already organised.' },
    ],
    teachingNote: 'Give children the same future event in several contexts and ask what changed: decision now, prior plan, fixed arrangement or timetable. This develops choice rather than memorisation.',
    trickyCases: [
      'More than one future form may be grammatically possible, but the speaker’s perspective can shift subtly between prediction, intention and arrangement.',
      'Present forms can refer to future time, so a future meaning does not guarantee the presence of will.',
    ],
    faqs: [
      { question: 'Which form is the “future tense”?', answer: 'English does not rely on one single future-tense form. It uses several constructions, including will, going to, present continuous and present simple.' },
      { question: 'Why use present continuous for the future?', answer: 'It commonly presents an arrangement that has already been organised, often with a known time, place or other participants.' },
    ],
  },
  'present-perfect-vs-past': {
    sourceIds: ['british-council-present-perfect', 'cambridge-past-simple-continuous'],
    whyItMatters: 'This distinction helps children manage the boundary between finished past time and past events connected to the present. It is one of the most important tense contrasts for moving from basic accuracy to natural English usage.',
    rulePoints: [
      'The simple past locates an event inside a finished past time; the present perfect connects past experience or activity to the present and normally avoids finished-time expressions such as yesterday or last year.',
      'Present perfect uses have/has + past participle. It is common for life experience, recent events with present relevance, unfinished time periods and situations continuing from the past.',
      'The question “When?” often pushes the speaker toward simple past when a finished time is supplied, while the question “Have you ever…?” commonly invites present perfect experience.',
    ],
    workedExamples: [
      { example: 'I visited Jaipur last year.', explanation: 'Last year is a finished past period, so simple past is the natural choice.' },
      { example: 'I have visited Jaipur three times.', explanation: 'The sentence reports life experience without locating the visits in one finished time.' },
      { example: 'She has finished her homework, so she can go out.', explanation: 'The completed action has a clear result relevant to the present situation.' },
    ],
    teachingNote: 'Do not teach this contrast as “past versus recent past.” Instead, ask whether the speaker places the event in a finished past time or connects it to the present reference point.',
    trickyCases: [
      'A recent event can still use simple past if the speaker gives a finished time, and an old event can use present perfect when discussed as life experience without a finished-time frame.',
      'Different varieties of English sometimes differ in preference for present perfect versus simple past in recent-event contexts, so focus on the core time-reference distinction.',
    ],
    faqs: [
      { question: 'Can present perfect be used with “yesterday”?', answer: 'Normally no, because yesterday is a finished past time. Standard teaching uses simple past for that combination.' },
      { question: 'Does present perfect mean the action is still happening?', answer: 'Not always. It can describe a completed event with present relevance as well as a situation that continues up to now.' },
    ],
  },
  'past-perfect': {
    sourceIds: ['cambridge-past-perfect', 'british-council-grammar'],
    whyItMatters: 'Past perfect gives writers a precise way to look back from one past moment to an earlier one. It is especially useful in narratives and explanations where event order would otherwise be unclear.',
    rulePoints: [
      'The past perfect uses had + past participle and looks back from one past reference point to an earlier event or state. It helps make the order of past events explicit.',
      'It is especially useful when chronology might otherwise be unclear: “When we arrived, the film had started” makes the earlier start clear.',
      'Writers do not need past perfect for every earlier action. Once the time relationship is established, simple past may continue naturally when the sequence remains clear.',
    ],
    workedExamples: [
      { example: 'The bus had left before we reached the stop.', explanation: 'Had left marks the departure as earlier than reached.' },
      { example: 'She was nervous because she had never flown before.', explanation: 'Had never flown describes experience before the past state of being nervous.' },
      { example: 'By the time the teacher arrived, the class had finished the task.', explanation: 'The task completion is placed before the teacher’s arrival.' },
    ],
    teachingNote: 'Use two-point timelines: mark the later past event first, then ask what had already happened before it. This prevents children from using past perfect simply because a sentence contains two past verbs.',
    trickyCases: [
      'Past perfect is about relative time within the past, not about an event being “very old.”',
      'Words such as before and after can already clarify sequence, so past perfect may be optional in some contexts rather than mandatory.',
    ],
    faqs: [
      { question: 'Why not use past perfect for every past event?', answer: 'It is mainly useful when one past event is viewed as earlier than another past reference point. Overusing it can make a narrative unnecessarily heavy.' },
      { question: 'What verb form follows had?', answer: 'The past participle, such as had gone, had written, had seen or had finished.' },
    ],
  },
  questions: {
    sourceIds: ['cambridge-questions', 'british-council-grammar'],
    whyItMatters: 'Question formation is essential for real communication and reveals how English auxiliary verbs work. Mastering question structure also reinforces tense, agreement, word order and the difference between direct and embedded questions.',
    rulePoints: [
      'Many English questions use auxiliary or modal inversion: auxiliary/modal + subject + main verb. When there is no other auxiliary in a simple-present or simple-past question, do/does/did is normally introduced.',
      'Wh-questions add a question word such as who, what, where, when, why or how. If the wh-word itself is the subject, ordinary do-support is not required in the same way.',
      'Natural questioning also depends on meaning and register: yes/no questions, information questions, choice questions and polite indirect questions use different patterns.',
    ],
    workedExamples: [
      { example: 'Does Maya play tennis?', explanation: 'Does moves before the subject; play remains in the base form.' },
      { example: 'Where did they go?', explanation: 'The wh-word comes first, followed by did, the subject and the base verb.' },
      { example: 'Who opened the window?', explanation: 'Who is the subject of opened, so there is no added did in this ordinary subject question.' },
    ],
    teachingNote: 'Build questions from statements by identifying the verb system first. Ask whether the sentence already has be, an auxiliary or a modal; if not, decide whether do/does/did is needed. This is more dependable than memorising word-order templates in isolation.',
    trickyCases: [
      'Indirect questions often keep statement word order after the introductory phrase: “Could you tell me where she lives?” not “where does she live?”',
      'Subject questions behave differently from object questions, so children should identify what information the question word replaces.',
    ],
    faqs: [
      { question: 'Why do we say “Where did she go?” not “Where did she went?”', answer: 'Did carries the past marking, so the lexical verb returns to its base form go.' },
      { question: 'Do all questions need do/does/did?', answer: 'No. Questions with be, auxiliaries or modal verbs normally use those verbs directly, and subject wh-questions have their own pattern.' },
    ],
  },
  'negatives-short-answers': {
    sourceIds: ['cambridge-negation', 'british-council-grammar'],
    whyItMatters: 'Negatives and short answers show children how auxiliaries carry tense, agreement and polarity. Learning them as part of one verb system improves both spoken responsiveness and written sentence accuracy.',
    rulePoints: [
      'Standard negative clauses commonly place not after be, a modal or an auxiliary. When a simple-present or simple-past clause has no auxiliary, do/does/did is normally introduced.',
      'Short answers repeat the relevant auxiliary rather than the whole clause: “Does she swim?” — “Yes, she does.” This keeps agreement and tense visible.',
      'Negative meaning can also come from words such as never, nobody, nothing and nowhere. Standard written English normally avoids adding an unnecessary second negative to the same clause.',
    ],
    workedExamples: [
      { example: 'She does not like olives.', explanation: 'Does carries present-tense agreement, so like stays in the base form.' },
      { example: 'They aren’t waiting outside.', explanation: 'Not attaches to the auxiliary are in the continuous verb phrase.' },
      { example: 'Did he call? No, he didn’t.', explanation: 'The short answer repeats the past auxiliary rather than the lexical verb call.' },
    ],
    teachingNote: 'Teach positives, questions, negatives and short answers as one connected system. When children can identify the auxiliary, they can usually control all four patterns more reliably.',
    trickyCases: [
      'Cannot is commonly written as one word in its uncontracted negative form, while many other negatives use a separate not.',
      'Words such as hardly and rarely have negative-like meaning even though they do not contain not, so combining them with another negative can change or confuse the intended meaning.',
    ],
    faqs: [
      { question: 'Why is “She doesn’t likes it” incorrect?', answer: 'Doesn’t already carries the third-person present marking, so the main verb returns to the base form: like.' },
      { question: 'Why do short answers use auxiliaries?', answer: 'The auxiliary carries tense, agreement, polarity or modality and can stand in for the rest of the repeated verb phrase.' },
    ],
  },
  quantifiers: {
    sourceIds: ['british-council-quantifiers', 'cambridge-determiners'],
    whyItMatters: 'Quantifiers connect grammar with real meaning about amount and number. They also reinforce countable and uncountable noun distinctions, helping children make noun phrases that sound natural and precise.',
    rulePoints: [
      'Quantifiers express amount or number. Choosing among much, many, some, any, few, little, a lot of and related forms depends partly on whether a noun is countable and whether it is singular or plural.',
      'Many is used with plural count nouns; much is used with uncount nouns, especially in questions and negatives. A lot of works naturally with both in many everyday contexts.',
      'Some and any are not controlled by a single positive-versus-negative rule. Meaning matters: some can appear in offers and requests, while any can appear in affirmative clauses with meanings such as “it does not matter which.”',
    ],
    workedExamples: [
      { example: 'How many books do you need?', explanation: 'Books is a plural count noun, so many fits the quantity question.' },
      { example: 'How much water is left?', explanation: 'Water is uncount in this meaning, so much fits.' },
      { example: 'Would you like some tea?', explanation: 'Some is natural in an offer even though the sentence is a question.' },
    ],
    teachingNote: 'Teach quantity together with countability. Give children noun phrases to classify first, then select a quantifier. This is more effective than memorising much = negative and many = plural without understanding the noun system.',
    trickyCases: [
      'Few versus a few and little versus a little can carry different implications: the version without a often suggests an insufficiently small amount.',
      'Some nouns can be countable in one meaning and uncountable in another, so quantifier choice may change with meaning.',
    ],
    faqs: [
      { question: 'Is “much books” correct?', answer: 'No in standard usage. Books is a plural count noun, so many books is the ordinary combination.' },
      { question: 'Can some appear in a question?', answer: 'Yes. It is common in offers and requests when the speaker expects or invites a positive response, such as “Would you like some water?”' },
    ],
  },
};
