export const GRAMMAR_KNOWLEDGE_SENTENCE_AND_WRITING = {
  'compound-sentences': {
    sourceIds: ['cambridge-conjunctions', 'purdue-runons'],
    rulePoints: [
      'A compound sentence joins two or more independent clauses so that each side could stand as a complete sentence. Coordinating conjunctions such as and, but, or, so, for, nor and yet can express the relationship.',
      'When two independent clauses are joined with a coordinating conjunction, formal written English commonly uses a comma before the conjunction. A semicolon can also join closely related independent clauses without a coordinating conjunction.',
      'A compound sentence is not simply any long sentence containing and. The joined parts need to be clauses of equal grammatical status rather than single words or phrases.',
    ],
    workedExamples: [
      { example: 'Maya finished the poster, and Arjun checked the labels.', explanation: 'Both sides are independent clauses, and the conjunction connects two complete messages.' },
      { example: 'The path was steep, but the group kept walking.', explanation: 'But signals contrast between the difficult path and the continued action.' },
      { example: 'The bell rang; everyone returned to class.', explanation: 'A semicolon links two closely related independent clauses without adding a conjunction.' },
    ],
    teachingNote: 'Ask children to cover one side of the joining word and test whether the other side can stand as a complete sentence. This exposes the difference between a true compound sentence and a simple sentence with two nouns or verbs.',
    trickyCases: [
      'A comma alone should not normally join two independent clauses in formal writing; that creates a comma splice.',
      'The word and does not automatically create a compound sentence. “Riya opened the book and read quietly” has one stated subject and a compound predicate.',
    ],
    faqs: [
      { question: 'Does every compound sentence need a comma?', answer: 'When a coordinating conjunction joins two independent clauses, a comma is standard in many formal styles. Other structures, including semicolon joins, use different punctuation.' },
      { question: 'Can a sentence with “and” still be simple?', answer: 'Yes. And can join words, phrases or verb elements inside one clause without creating a second independent clause.' },
    ],
  },
  'reason-result': {
    sourceIds: ['cambridge-conjunctions', 'cambridge-grammar'],
    rulePoints: [
      'Reason connectors explain why something happens; result connectors show what follows from a cause. Because and since can introduce reasons, while so, therefore and as a result can signal consequences in different structures.',
      'Connector choice affects grammar and punctuation. Because usually introduces a dependent reason clause, while therefore is commonly an adverbial connector linking complete ideas rather than functioning like a coordinating conjunction.',
      'Clear writing makes the logical relationship accurate. A connector should match the actual cause-and-effect relationship rather than simply making two sentences sound more formal.',
    ],
    workedExamples: [
      { example: 'We stayed inside because the rain became heavier.', explanation: 'Because introduces the reason for staying inside.' },
      { example: 'The rain became heavier, so we stayed inside.', explanation: 'So connects the cause to its result in a coordinated structure.' },
      { example: 'The road was flooded. Therefore, the bus was delayed.', explanation: 'Therefore signals a result across two complete sentences and is punctuated as a linking adverb.' },
    ],
    teachingNote: 'Give children two facts and ask them to decide which is the cause and which is the result before selecting a connector. This meaning-first step prevents random substitution among because, so and therefore.',
    trickyCases: [
      'Because and because of use different structures: because introduces a clause, while because of is followed by a noun phrase or similar complement.',
      'Therefore is not used exactly like so. It typically needs punctuation that reflects its adverbial role rather than being treated as a simple coordinating conjunction.',
    ],
    faqs: [
      { question: 'Can because start a sentence?', answer: 'Yes. A sentence can begin with a because-clause when the main clause follows and the whole structure is complete.' },
      { question: 'Are so and therefore interchangeable?', answer: 'They can express a similar result relationship, but their grammatical role, register and punctuation differ.' },
    ],
  },
  'time-sequence': {
    sourceIds: ['cambridge-conjunctions', 'british-council-grammar'],
    rulePoints: [
      'Time and sequence connectors help readers follow when events happen and in what order. Words and phrases such as before, after, while, when, first, next, then and finally serve different grammatical roles.',
      'Subordinating time words can introduce clauses, while sequencing adverbs often organise discourse across sentences. Children should learn the structure around the connector rather than treating all linking words as one category.',
      'Accurate sequencing is especially important in instructions, narratives and explanations because the connector helps the reader reconstruct the intended timeline.',
    ],
    workedExamples: [
      { example: 'Before the lesson began, we checked our materials.', explanation: 'Before introduces a time clause that places the checking earlier than the lesson.' },
      { example: 'First, measure the paper. Next, draw the line.', explanation: 'First and next organise the steps of an instruction across sentences.' },
      { example: 'While Riya was reading, her brother was drawing.', explanation: 'While presents two activities as overlapping in time.' },
    ],
    teachingNote: 'Use shuffled event cards and ask children to rebuild the timeline before writing. Once the order is clear, choose connectors that show beginning, overlap, interruption, continuation or completion.',
    trickyCases: [
      'When referring to future time after words such as when, before and after, English often uses a present form in the time clause rather than will.',
      'Then and than are different words: then commonly relates to time or sequence; than is used in comparisons.',
    ],
    faqs: [
      { question: 'Do sequence words always need commas?', answer: 'No. Punctuation depends on where and how the word or phrase functions. Introductory sequencing adverbs often take a comma, while subordinating conjunctions follow clause punctuation rules.' },
      { question: 'Why are time connectors important in writing?', answer: 'They make chronology explicit so the reader can understand the order, overlap or timing relationship between events.' },
    ],
  },
  conditionals: {
    sourceIds: ['british-council-conditionals', 'cambridge-future'],
    rulePoints: [
      'Conditional structures connect a condition with a consequence. The grammar changes according to whether the speaker presents the condition as general, realistically possible, hypothetical or contrary to past fact.',
      'A common real-future pattern uses present tense in the if-clause and a future/modal form in the result: “If it rains, we will stay inside.” Standard teaching avoids unnecessary will inside this basic if-clause.',
      'Hypothetical patterns use past forms to create distance from present or future reality, while past-perfect forms can help express unreal past conditions.',
    ],
    workedExamples: [
      { example: 'If you heat ice, it melts.', explanation: 'This presents a general relationship rather than one specific future event.' },
      { example: 'If it rains tomorrow, we will stay inside.', explanation: 'The condition is presented as realistically possible; the result refers to the future.' },
      { example: 'If I had more time, I would learn another language.', explanation: 'The past form had marks a hypothetical present situation rather than ordinary past time.' },
    ],
    teachingNote: 'Teach conditionals through meaning categories before attaching numbers such as first or second conditional. Ask whether the speaker means a general truth, a real possibility, an imagined situation or an unreal past.',
    trickyCases: [
      'Unless usually means if not, but it is not a mechanical replacement for every if-not structure. The logic of the condition must remain the same.',
      'Past tense forms in hypothetical conditionals often express distance from reality rather than literal past time.',
    ],
    faqs: [
      { question: 'Why not say “If it will rain, we will stay inside”?', answer: 'In the basic real-future pattern, the if-clause normally uses a present form even though the condition refers to the future.' },
      { question: 'Does “if I had” always refer to the past?', answer: 'No. In hypothetical conditionals it can describe an unreal or unlikely present situation, such as “If I had more time…”' },
    ],
  },
  'contrast-concession': {
    sourceIds: ['cambridge-conjunctions', 'cambridge-grammar'],
    rulePoints: [
      'Contrast highlights a difference between ideas; concession acknowledges one fact while showing that another result still follows. But, although, however and despite can all express contrastive relationships with different grammar.',
      'But coordinates comparable elements or clauses. Although introduces a dependent clause. However often links complete ideas as an adverbial connector. Despite is followed by a noun phrase or -ing form rather than a finite clause in its ordinary pattern.',
      'Good connector choice depends on both meaning and sentence structure. Replacing one connector with another may require rewriting the surrounding grammar and punctuation.',
    ],
    workedExamples: [
      { example: 'The task was difficult, but Maya finished it.', explanation: 'But coordinates two contrasting independent clauses.' },
      { example: 'Although the task was difficult, Maya finished it.', explanation: 'Although introduces a dependent concessive clause.' },
      { example: 'Despite the difficulty, Maya finished the task.', explanation: 'Despite is followed by the noun phrase the difficulty rather than a full finite clause.' },
    ],
    teachingNote: 'Have children transform one idea across several structures instead of filling blanks: but → although → however → despite. They will see that the relationship stays similar while the grammar changes.',
    trickyCases: [
      'Avoid pairing although with but in the same basic clause relationship in standard school writing; each already signals the contrast.',
      'Despite and in spite of are prepositional structures and do not normally take a that-clause directly without additional wording.',
    ],
    faqs: [
      { question: 'What is the difference between contrast and concession?', answer: 'Contrast simply shows difference, while concession often means “this fact is true, but the expected result did not prevent the other fact.”' },
      { question: 'Can however replace but without other changes?', answer: 'Not always. However commonly behaves as an adverbial connector and usually requires different punctuation and sentence structure.' },
    ],
  },
  'relative-clauses': {
    sourceIds: ['british-council-relative-clauses', 'british-council-clauses'],
    rulePoints: [
      'A relative clause adds information about a noun. Relative pronouns such as who, which, that and whose help connect the clause to the noun being described.',
      'Defining relative clauses identify which person or thing is meant and are essential to the reference. Non-defining relative clauses add extra information and are typically set off with commas.',
      'Who is commonly used for people, which for things, and that can often replace who or which in defining clauses. Pronoun choice also depends on grammatical role and style.',
    ],
    workedExamples: [
      { example: 'The student who solved the puzzle explained her method.', explanation: 'The defining relative clause identifies which student is meant.' },
      { example: 'My uncle, who lives in Kochi, is visiting us.', explanation: 'The comma-marked clause adds extra information about an already identified person.' },
      { example: 'This is the book that I borrowed.', explanation: 'That introduces a defining relative clause describing the book.' },
    ],
    teachingNote: 'Start with two short sentences about the same noun and combine them. This makes the relative clause’s job visible: it packages information about a noun without starting a completely separate sentence.',
    trickyCases: [
      'That is common in defining relative clauses but is not normally used in the same way in non-defining comma clauses.',
      'The relative pronoun can sometimes be omitted when it functions as the object in a defining clause, but not when it is the subject in the same way.',
    ],
    faqs: [
      { question: 'What is the difference between defining and non-defining relative clauses?', answer: 'A defining clause is needed to identify the noun; a non-defining clause adds extra information about a noun that is already identifiable.' },
      { question: 'Can “that” refer to people?', answer: 'Yes, especially in defining relative clauses, although who is also common for people.' },
    ],
  },
  'fragments-runons': {
    sourceIds: ['purdue-fragments', 'purdue-runons'],
    rulePoints: [
      'A sentence fragment is an incomplete structure presented as if it were a complete sentence. It may be a dependent clause, a phrase or a group missing a required subject or verb.',
      'A run-on occurs when independent clauses are joined without appropriate punctuation or connection. A comma splice is a related error in which a comma alone joins independent clauses.',
      'Repair depends on the structure: attach a fragment to a suitable main clause, or separate/join independent clauses with a full stop, semicolon or appropriate conjunction and punctuation.',
    ],
    workedExamples: [
      { example: 'Because the rain became heavier.', explanation: 'This is a dependent reason clause presented alone; it leaves the main result unstated.' },
      { example: 'The rain became heavier we went inside.', explanation: 'Two independent clauses are fused without punctuation or a connector.' },
      { example: 'The rain became heavier, so we went inside.', explanation: 'The coordinating conjunction and comma create a clear boundary between the two clauses.' },
    ],
    teachingNote: 'Teach children to find clause boundaries before fixing punctuation. If they can identify independent and dependent clauses, fragments and run-ons become structural problems they can reason through rather than errors corrected by guesswork.',
    trickyCases: [
      'Professional and creative writing sometimes uses deliberate fragments for effect, but school writing should first establish control of complete standard sentences.',
      'A sentence can be very long without being a run-on if its clauses are connected and punctuated correctly; length alone is not the test.',
    ],
    faqs: [
      { question: 'Is every short sentence a fragment?', answer: 'No. A complete imperative such as “Stop!” is short but grammatically complete because the subject is understood.' },
      { question: 'Is every long sentence a run-on?', answer: 'No. A long sentence can be correct when clause relationships and punctuation are controlled.' },
    ],
  },
  'reported-speech': {
    sourceIds: ['cambridge-reported-speech', 'british-council-grammar'],
    rulePoints: [
      'Direct speech presents the speaker’s words as quoted; reported or indirect speech represents the content through a reporting structure. Pronouns, time references and verb forms may shift when the reporting viewpoint changes.',
      'Common reporting verbs include say, tell and ask, but they follow different patterns. Tell normally takes a person object; say does not take that object directly in the same way.',
      'Reported questions use statement-like word order after the reporting phrase rather than ordinary direct-question inversion, and they normally do not keep the original question mark inside the reported clause.',
    ],
    workedExamples: [
      { example: 'Maya said, “I am tired.” → Maya said that she was tired.', explanation: 'The pronoun and verb viewpoint shift because the report is made from a later perspective.' },
      { example: 'He told me that the bus was late.', explanation: 'Tell is followed by the person receiving the information: me.' },
      { example: 'She asked where I lived.', explanation: 'The reported question uses where I lived, not the direct-question order where did I live.' },
    ],
    teachingNote: 'Treat reported speech as a change of viewpoint, not a mechanical tense-backshift exercise. Ask who is speaking now, who originally spoke, when the report is made and whether time/person references need to change.',
    trickyCases: [
      'Backshift is not automatic in every context. A speaker may keep a present form when the reported information is still true or when the reporting context supports it.',
      'Say and tell are not interchangeable without structural changes: “She said me” is not standard, while “She told me” is.',
    ],
    faqs: [
      { question: 'Must every reported verb move one tense back?', answer: 'No. Backshift is common when reporting from a past viewpoint, but context, continuing truth and reporting purpose can affect the choice.' },
      { question: 'Why does word order change in reported questions?', answer: 'The reported question becomes embedded inside a larger statement structure, so ordinary direct-question inversion is normally removed.' },
    ],
  },
  'active-passive': {
    sourceIds: ['cambridge-passive', 'purdue-sentence-clarity'],
    rulePoints: [
      'Active voice typically makes the doer the grammatical subject: “The class completed the project.” Passive voice typically makes the affected participant the subject: “The project was completed by the class.”',
      'The common passive pattern uses a form of be plus a past participle. The tense and aspect are carried largely by the be/auxiliary sequence while the lexical verb appears as a participle.',
      'Passive voice is useful when the doer is unknown, obvious, unimportant or deliberately backgrounded. Active voice is often clearer when identifying the agent matters.',
    ],
    workedExamples: [
      { example: 'The chef prepared the meal.', explanation: 'The active sentence foregrounds the chef as the doer.' },
      { example: 'The meal was prepared by the chef.', explanation: 'The passive foregrounds the meal and moves the agent into an optional by-phrase.' },
      { example: 'The window was broken overnight.', explanation: 'Passive is useful because the doer may be unknown or irrelevant to the immediate message.' },
    ],
    teachingNote: 'Do not teach active as “good” and passive as “bad.” Give children a communication purpose and ask what should receive attention. Then choose the voice that places that information in the most useful subject position.',
    trickyCases: [
      'Not every verb can form a normal passive. Passive construction generally requires a verb relationship that has an object or another suitable complement in the active form.',
      'A sentence containing a form of be is not automatically passive; “The room is quiet” uses be as a linking verb, not a passive auxiliary.',
    ],
    faqs: [
      { question: 'Should children always avoid passive voice?', answer: 'No. Passive voice is useful when the affected thing is the topic or when the agent is unknown, obvious or less important.' },
      { question: 'How can I spot a passive?', answer: 'Look for an appropriate form of be combined with a past participle and ask whether the grammatical subject receives the action rather than performs it.' },
    ],
  },
};
