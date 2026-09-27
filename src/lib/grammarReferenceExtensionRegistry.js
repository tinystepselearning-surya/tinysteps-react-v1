import {
  GRAMMAR_REFERENCE_EXTENSION_PATHS as MANIFEST_PATHS,
  GRAMMAR_REFERENCE_EXTENSION_RESOURCE_SEO as MANIFEST_SEO,
} from './grammarReferenceExtensionSeoManifest.js';
import { getGrammarKnowledgeSources } from './grammarKnowledgeSources.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);

const page = (config) => {
  const sources = getGrammarKnowledgeSources(config.sourceIds);
  if (sources.length < 2) {
    throw new Error(`GV3 Grammar reference page ${config.id} requires at least two authoritative references.`);
  }

  return freeze({
    state: 'reference-extension',
    publicationApproved: true,
    publicationBatch: 'gv3-first-reference-batch',
    referenceOrder: config.referenceOrder,
    hubPath: '/resources/grammar',
    ...config,
    sources,
    path: `/resources/grammar/${config.slug}`,
    examples: freezeList(config.examples),
    commonMistakes: freezeList(config.commonMistakes),
    practicePrompts: freezeList(config.practicePrompts),
    relatedPaths: freezeList(config.relatedPaths),
    sourceIds: freezeList(config.sourceIds),
    rulePoints: freezeList(config.rulePoints),
    workedExamples: freezeList(config.workedExamples.map((item) => freeze({ ...item }))),
    trickyCases: freezeList(config.trickyCases),
    faqs: freezeList(config.faqs.map((item) => freeze({ ...item }))),
  });
};

export const GRAMMAR_REFERENCE_EXTENSION_REVISION = '2026-09-27-gv3';

export const GRAMMAR_REFERENCE_EXTENSION_PAGES = freezeList([
  page({
    referenceOrder: 1,
    id: 'determiners',
    slug: 'determiners-for-kids',
    cardTitle: 'Determiners for Kids',
    seoTitle: 'Determiners for Kids: Articles, This, My, Some & More | Tiny Steps',
    seoDescription: 'Teach determiners as the words that help identify, count or limit nouns, including articles, demonstratives, possessives, numbers and quantifiers.',
    quickAnswer: 'A determiner is a word placed before a noun or noun phrase to help show which one, whose one, how many, or how much we mean. Common determiners include a, an, the, this, those, my, some, many, each and numbers.',
    concept: 'Determiners work with nouns to make reference clear. Instead of treating articles, demonstratives, possessives and quantifiers as unrelated lists, children can learn that these words all help the listener or reader understand the noun more precisely.',
    whyItMatters: 'Determiners affect meaning in nearly every noun phrase a child writes or says. A small change from a book to the book, from this pencil to those pencils, or from many apples to much water can change specificity, number and quantity. Understanding the larger determiner system also makes article and quantifier rules easier to connect rather than memorise separately.',
    rulePoints: [
      'Determiners normally come before the noun and before ordinary adjectives: this red bag, my two new notebooks, every careful answer. Different determiners do different jobs. Articles mark general or specific reference; demonstratives point to something; possessives show a relationship; quantifiers and numbers show amount or number. Children should first ask what meaning the speaker needs before choosing the form.',
      'Determiner choice must agree with the type and number of noun. A and an normally introduce one singular countable noun, while many and a few go with plural countable nouns. Much and a little normally go with uncountable nouns. This and that combine with singular reference; these and those combine with plural reference. The noun pattern therefore helps decide which determiner is possible.',
      'English does not simply stack any two determiners together. Some combinations are natural, such as all my books or my two best friends, while forms such as the my book or some many questions are not standard. For children, the safest early strategy is to build one clear noun phrase, then add number or quantity only when the meaning requires it.',
    ],
    workedExamples: [
      {
        example: 'I saw a puppy. The puppy followed me home.',
        explanation: 'The first sentence introduces one puppy that is not yet identified for the listener, so a is natural. The second sentence refers back to that same known puppy, so the makes the reference specific. The change of determiner reflects a change in what the listener already knows.',
      },
      {
        example: 'This book is mine, but those books belong to Arjun.',
        explanation: 'This points to one nearby singular book. Those points to more than one book that is treated as farther away or less immediate. The demonstrative and noun number work together: this book, these books, that book, those books.',
      },
      {
        example: 'Many students brought their notebooks, but one student forgot hers.',
        explanation: 'Many combines with a plural countable noun. Their is a possessive determiner before notebooks, while one gives an exact number before student. The sentence shows that different determiner families can appear in the same message when each has a clear job.',
      },
    ],
    examples: [
      'an interesting story · the same story · my favourite story',
      'this chair · these chairs · that idea · those ideas',
      'some water · many questions · a few minutes · each child',
    ],
    commonMistakes: [
      'Using a or an with plural or uncountable nouns, such as a books or an information, instead of choosing a determiner that matches the noun type.',
      'Mixing singular and plural demonstratives, such as this shoes or those pencil, without checking whether the noun refers to one item or more than one.',
      'Combining determiners that do not normally appear together, such as the my bag, rather than selecting the determiner pattern that expresses the intended meaning.',
    ],
    trickyCases: [
      'Some words can act as determiners in front of nouns and as pronouns when the noun is omitted. Compare “Some children stayed” with “Some stayed.” For younger learners, identify the job by checking whether a noun follows the word instead of memorising one permanent label.',
      'A noun may appear with no visible determiner in some general statements, especially plural and uncountable nouns: “Books can teach us a lot” and “Water is essential.” The absence of a determiner can itself be meaningful, so children should not be taught that every noun must always have one.',
    ],
    teachingNote: 'Teach determiners through contrasts inside short contexts rather than one long terminology list. Start with familiar pairs such as a/the and this/these, then connect possessives and quantity words. Ask the child to explain what changes when the determiner changes: Is the noun now specific? Is it one or many? Is it near or far? Does it belong to someone? This meaning-first routine is more useful than asking the child only to name the determiner type.',
    practicePrompts: [
      'Choose a, an, the or no article for six short contexts and explain what makes the noun general, new, known or specific.',
      'Rewrite four noun phrases by changing this/that to these/those and adjust the noun form so number stays correct.',
      'Sort a mixed set of determiners into article, demonstrative, possessive, quantity/number and question-word groups, then use one from each group in a sentence.',
    ],
    faqs: [
      {
        question: 'Are articles such as a, an and the also determiners?',
        answer: 'Yes. Articles are one important type of determiner. Demonstratives such as this and those, possessives such as my and their, quantity words such as some and many, and numbers can also function as determiners before nouns. Teaching the larger category helps children see why these different words all affect how a noun is identified or limited.',
      },
      {
        question: 'Should children memorise every type of determiner at once?',
        answer: 'No. A child benefits more from learning the most useful contrasts in context: one versus many, general versus specific, near versus far, possession and quantity. Once those meanings are secure, the grammatical labels can organise what the child already understands. Accuracy in a fresh sentence matters more than reciting a complete list.',
      },
    ],
    sourceIds: ['cambridge-determiners', 'cambridge-determiners-types-noun', 'british-council-quantifiers'],
    relatedPaths: [
      '/resources/grammar/a-an-articles-for-kids',
      '/resources/grammar/the-article-for-kids',
      '/resources/grammar/quantifiers-for-kids',
      '/resources/grammar/countable-uncountable-nouns-for-kids',
    ],
  }),

  page({
    referenceOrder: 2,
    id: 'countable-uncountable-nouns',
    slug: 'countable-uncountable-nouns-for-kids',
    cardTitle: 'Countable & Uncountable Nouns',
    seoTitle: 'Countable and Uncountable Nouns for Kids | Tiny Steps',
    seoDescription: 'Help children distinguish countable and uncountable nouns and choose a/an, some, any, much, many, few and little accurately.',
    quickAnswer: 'Countable nouns can normally be counted as separate items, so they can have singular and plural forms such as one apple and three apples. Uncountable nouns are usually treated as a mass, substance or idea in that meaning, such as water, information or homework.',
    concept: 'Countability is not just about whether something can be counted in the real world. It is about how English treats a noun in a particular meaning. That grammar choice affects articles, plural forms, numbers and quantity words throughout the sentence.',
    whyItMatters: 'Children often know the meaning of a noun but still produce forms such as an advice, many homework or informations. These errors happen because noun meaning and noun grammar have not been connected. Once a child checks whether the noun is countable in that use, choices such as a/an, many/much, few/little and singular/plural become much more predictable.',
    rulePoints: [
      'Countable nouns can normally be singular or plural and can combine directly with numbers: one chair, two chairs, several chairs. A singular countable noun usually needs an appropriate determiner in an ordinary sentence, such as a chair, the chair or my chair. This is why “I bought book” is incomplete in standard everyday English when one specific countable book is intended.',
      'Uncountable nouns are generally not used with a/an or a direct plural ending in their uncountable meaning. We say some water, much information, a little rice and enough homework rather than a water, informations or homeworks. To count portions, English often uses a countable unit phrase: a glass of water, two pieces of information, three bowls of rice.',
      'Some nouns can be countable in one meaning and uncountable in another. “Chicken” can mean the food as a mass, while “a chicken” can mean one bird. “Paper” can mean the material, while “a paper” can mean a document or article in some contexts. Children should therefore learn countability with the sentence meaning, not attach one permanent rule to every word.',
    ],
    workedExamples: [
      {
        example: 'We need three chairs and some furniture for the room.',
        explanation: 'Chairs are separate countable items, so a number and plural form are natural. Furniture is treated as an uncountable collective noun in standard English, so we do not normally say three furnitures. If exact counting is needed, we name the pieces: three pieces of furniture.',
      },
      {
        example: 'How many questions do you have? How much time do we have?',
        explanation: 'Many asks about plural countable nouns such as questions. Much asks about an amount of an uncountable noun such as time in this meaning. The question word is chosen from the noun pattern, not simply from whether the amount feels large or small.',
      },
      {
        example: 'I ate chicken for lunch, and I saw three chickens near the farm.',
        explanation: 'The same spelling can belong to two countability patterns because the meanings differ. Chicken as food is treated as a mass in the first clause; chickens refers to individual birds in the second. Context decides the grammatical pattern.',
      },
    ],
    examples: [
      'a book · two books · many books · a few books',
      'some milk · much milk · a little milk · enough milk',
      'a piece of advice · two bottles of water · three pieces of information',
    ],
    commonMistakes: [
      'Adding a plural -s to common uncountable nouns in their mass meaning, for example informations, advices, furnitures or homeworks.',
      'Using many with an uncountable noun or much with an ordinary plural countable noun without checking the noun pattern.',
      'Using a/an directly before an uncountable noun, such as an advice, instead of choosing some advice or a countable unit such as a piece of advice.',
    ],
    trickyCases: [
      'Countability can vary with meaning, dialect and context. Words such as coffee, experience, paper and hair can shift between mass and count uses. A child should first master stable high-frequency examples, then learn flexible nouns through complete sentences that make the intended meaning visible.',
      'Quantity expressions are not perfect synonyms. A few means a small but present number of countable items, while few often suggests not many. A little means a small but present amount of an uncountable noun, while little can suggest not much. The difference is partly about speaker meaning, not only grammar form.',
    ],
    teachingNote: 'Use a two-question routine: “Can English count this noun directly in this meaning?” and “What word can naturally come before it?” Give the child a mixture of familiar nouns and ask for complete phrases rather than isolated labels. Pair chairs with many, water with much, books with a few and rice with a little. Then introduce countable unit phrases for uncountable nouns. Revisit flexible nouns only after the core distinction is stable.',
    practicePrompts: [
      'Sort twelve nouns into countable, uncountable or depends-on-meaning, and justify two of the choices with complete sentences.',
      'Choose a/an, some, many, much, a few or a little for a set of noun phrases, then explain which noun feature controlled the choice.',
      'Repair five sentences containing errors such as informations, many homework or an advice and state the rule used for each correction.',
    ],
    faqs: [
      {
        question: 'Is an uncountable noun something that cannot be counted in real life?',
        answer: 'Not exactly. Countability describes how English packages a noun in a particular meaning. We can count containers or units of water, but water itself is usually uncountable. We can count pieces of information, but information is normally uncountable. The grammar pattern matters more than whether a person could physically count related objects.',
      },
      {
        question: 'Why can the same noun sometimes be countable and uncountable?',
        answer: 'Because the meaning changes. A noun can refer to a material, activity or general idea in one sentence and to separate examples in another. “Experience” can mean knowledge gained over time, but “an experience” can mean one event. Children should use the surrounding sentence to identify which meaning is intended.',
      },
    ],
    sourceIds: ['cambridge-countable-uncountable', 'british-council-countable-uncountable', 'cambridge-determiners-types-noun'],
    relatedPaths: [
      '/resources/grammar/nouns-for-kids',
      '/resources/grammar/singular-and-plural-nouns',
      '/resources/grammar/quantifiers-for-kids',
      '/resources/grammar/determiners-for-kids',
    ],
  }),

  page({
    referenceOrder: 3,
    id: 'noun-phrases',
    slug: 'noun-phrases-for-kids',
    cardTitle: 'Noun Phrases for Kids',
    seoTitle: 'Noun Phrases for Kids: Head Nouns, Determiners & Modifiers | Tiny Steps',
    seoDescription: 'Teach noun phrases by finding the head noun and showing how determiners, adjectives and other words add precise information around it.',
    quickAnswer: 'A noun phrase is a group of words built around a noun or pronoun that acts together as one unit in a sentence. In “the three curious students”, students is the head noun and the other words help identify, count or describe those students.',
    concept: 'Noun phrases connect several grammar skills that children often learn separately. Determiners, numbers, adjectives, noun modifiers and extra information can all work around one head noun. Learning to find the head first makes long phrases much easier to read, build and edit.',
    whyItMatters: 'Strong noun phrases help children understand complex reading and write precise sentences without adding random description. They also support subject–verb agreement because the verb usually agrees with the head of the subject noun phrase, not whichever noun happens to be closest. This becomes especially important as school sentences grow longer.',
    rulePoints: [
      'Every noun phrase has a central head, usually a noun or pronoun. The head carries the main identity of the phrase. In “those two enormous science books”, books is the head; those identifies the books, two counts them, enormous describes them and science helps classify them. Finding the head first prevents the child from treating every word as equally important.',
      'Words before the head can include determiners, numbers, adjectives and noun modifiers. A typical order is determiner + quantity/number + adjective + noun modifier + head noun, although not every slot is needed. Children should add only information that improves meaning. “The old wooden bridge” is useful when age and material matter; stacking many weak adjectives can make a sentence heavier without making it clearer.',
      'Noun phrases can also include information after the head, such as a prepositional phrase or relative clause: “the book on the shelf” or “the student who solved the puzzle”. The complete phrase still functions as one sentence unit. When the noun phrase is the subject, the head helps control number agreement: “The box of pencils is here,” because box is singular.',
    ],
    workedExamples: [
      {
        example: 'The three nervous speakers waited outside.',
        explanation: 'The complete subject noun phrase is “The three nervous speakers”. Speakers is the plural head noun. The identifies the group, three gives number and nervous describes the speakers. Because the head is plural, the verb form waited fits the plural subject without any special agreement ending.',
      },
      {
        example: 'The box of coloured pencils is under the desk.',
        explanation: 'The subject noun phrase is “The box of coloured pencils”. Box is the singular head noun; “of coloured pencils” gives extra information about the box. The nearby plural word pencils does not change the subject number, so the standard agreement is “box … is”, not “box … are”.',
      },
      {
        example: 'A child who asks thoughtful questions learns quickly.',
        explanation: 'The head of the subject noun phrase is child. The relative clause “who asks thoughtful questions” adds information about that child. The longer phrase still functions as the subject of learns. This shows why noun-phrase awareness supports both reading comprehension and grammar accuracy.',
      },
    ],
    examples: [
      'my new school bag',
      'those two difficult questions',
      'the puppy under the table',
    ],
    commonMistakes: [
      'Calling the first noun inside a long phrase the head without checking which noun the whole phrase is mainly about.',
      'Making the verb agree with a noun inside an of-phrase instead of the subject head, such as “The list of names are ready.”',
      'Expanding noun phrases with many adjectives or details that do not help the reader identify or understand the noun more clearly.',
    ],
    trickyCases: [
      'A pronoun can form a noun phrase by itself: “She arrived.” Proper names can also stand alone as noun phrases. The phrase does not have to contain several words. The key question is whether the word or group performs a noun-like job such as subject, object or complement.',
      'Not every phrase containing a noun should be analysed in isolation from its sentence job. In “She sat near the window,” the words “the window” form a noun phrase inside the larger prepositional phrase “near the window.” Children benefit from building analysis in layers instead of assigning one label to the whole string.',
    ],
    teachingNote: 'Use colour-free bracketing or simple underlining to prevent visual overload: first underline the whole noun phrase, then circle the head noun, then label only the words that add useful information. Ask the child to shrink a long noun phrase to its head and then rebuild it. This “shrink and expand” method reveals which words are essential to the identity of the phrase and which words modify it.',
    practicePrompts: [
      'Underline the complete noun phrase in five sentences and circle the head noun inside each one.',
      'Expand three plain nouns into precise noun phrases using a determiner and one or two useful modifiers, then remove any word that does not add meaning.',
      'Correct subject–verb agreement in sentences where an extra noun appears between the subject head and the verb.',
    ],
    faqs: [
      {
        question: 'Is every group of words with a noun a noun phrase?',
        answer: 'A noun phrase is organised around a noun or pronoun and functions as a noun-like unit in the sentence. It may sit inside a larger structure. For example, “the table” is a noun phrase inside the prepositional phrase “under the table.” Looking at both the head and the sentence job helps avoid over-labelling.',
      },
      {
        question: 'Why teach noun phrases if a child already knows nouns and adjectives?',
        answer: 'Because real sentences combine those skills. A child may identify nouns and adjectives separately but still struggle to understand a long subject, choose the correct verb or write precise descriptions. Noun-phrase work shows how determiners, modifiers and the head noun function together as one grammatical unit.',
      },
    ],
    sourceIds: ['cambridge-noun-phrases-dependent', 'british-council-clauses', 'cambridge-determiners'],
    relatedPaths: [
      '/resources/grammar/nouns-for-kids',
      '/resources/grammar/adjectives-for-kids',
      '/resources/grammar/determiners-for-kids',
      '/blog/grammar-subject-verb',
    ],
  }),

  page({
    referenceOrder: 4,
    id: 'verb-forms-irregular-verbs',
    slug: 'verb-forms-irregular-verbs-for-kids',
    cardTitle: 'Verb Forms & Irregular Verbs',
    seoTitle: 'Verb Forms and Irregular Verbs for Kids | Tiny Steps',
    seoDescription: 'Teach base, past, past participle, -ing and third-person verb forms, with high-frequency irregular verbs and tense-linked practice.',
    quickAnswer: 'English main verbs have several forms, including a base form, past form, past participle, -ing form and third-person singular present form. Regular verbs follow predictable patterns, while common irregular verbs such as go–went–gone and write–wrote–written must be learned as form families.',
    concept: 'Verb forms are the building pieces used by tense, aspect and voice. A child who understands the form family of a verb can see why “did go”, “has gone”, “is going” and “she goes” use different forms even though every sentence is built from the same verb meaning.',
    whyItMatters: 'Many tense errors are really verb-form errors. Children may know that an event happened in the past but still write goed, did went or has wrote. Teaching the complete form family makes later work on perfect tenses, continuous forms, passive voice and question formation more coherent and reduces the need to memorise each sentence pattern as a separate rule.',
    rulePoints: [
      'A useful school-level form set is base, past, past participle, -ing and third-person singular present: play–played–played–playing–plays; take–took–taken–taking–takes. The base form appears after modal verbs and after do/does/did in questions and negatives. The -ing form works with forms of be in continuous constructions, while the past participle works with have in perfect constructions and with be in passive constructions.',
      'Regular verbs normally form the past and past participle with -ed, with spelling adjustments such as study–studied and stop–stopped. Irregular verbs do not follow one universal -ed rule. Some change completely, such as go–went–gone; some change vowels, such as sing–sang–sung; some keep the same form, such as cut–cut–cut. Children need repeated retrieval of high-frequency irregular families rather than one enormous list learned without context.',
      'Auxiliaries control which main-verb form follows. After did, use the base form: “Did she write?” not “Did she wrote?” After has/have/had, use the past participle: “She has written,” not “She has wrote.” After is/am/are/was/were in a continuous form, use -ing: “They are writing.” Checking the helper verb is often the fastest way to choose the correct main-verb form.',
    ],
    workedExamples: [
      {
        example: 'write → wrote → written → writing → writes',
        explanation: 'Write is irregular because the past and past participle are not formed with -ed. “She wrote yesterday” uses the past form. “She has written three pages” uses the past participle after has. “She is writing now” uses the -ing form after is. “He writes daily” uses the third-person -s form.',
      },
      {
        example: 'Did Arjun go home early? — not “Did Arjun went home early?”',
        explanation: 'Did already carries the past-time marking in this question, so the main verb returns to its base form go. The same pattern appears in negatives: “Arjun did not go.” This is why simply choosing a past-looking form for every past sentence can create double marking.',
      },
      {
        example: 'The window was broken during the game.',
        explanation: 'Broken is the past participle of break. The passive construction uses a form of be plus the past participle, so “was broken” is correct. “Was broke” uses the simple-past form where a participle is required. Recognising the form family helps the child repair the structure.',
      },
    ],
    examples: [
      'play · played · played · playing · plays',
      'begin · began · begun · beginning · begins',
      'cut · cut · cut · cutting · cuts',
    ],
    commonMistakes: [
      'Adding -ed to every verb and producing forms such as goed, eated or writed instead of learning the irregular past form.',
      'Using the simple-past form after did or after a modal, such as did went or can wrote, instead of returning the main verb to its base form.',
      'Using the simple-past form instead of the past participle after have or in a passive structure, such as has took or was broke.',
    ],
    trickyCases: [
      'Past form and past participle are identical for many verbs, including most regular verbs, so the difference is not always visible. The grammatical job still differs: “played” in “They played” is a past form, while “played” in “They have played” is a past participle. Children should use the surrounding auxiliary to identify the role.',
      'British and American English sometimes prefer different accepted forms or spellings for particular verbs. A child does not need a long dialect list at this stage. Use one consistent classroom standard, recognise common valid alternatives when they arise, and focus on the high-frequency form families that affect sentence accuracy.',
    ],
    teachingNote: 'Teach irregular verbs in small families and immediately place each form in a sentence. A five-column reference can help, but retrieval should always answer a grammatical question: Which form follows did? Which form follows has? Which form follows is? Mix regular and irregular verbs so the child learns to identify the pattern rather than assuming every item in an exercise is irregular. Recycle difficult verbs across reading, speaking and writing.',
    practicePrompts: [
      'Build the five-form family for eight high-frequency verbs and use the past, past participle and -ing forms in separate sentences.',
      'Correct sentences containing did + past-form and has/have + simple-past errors, explaining which auxiliary controls the main-verb form.',
      'Sort a mixed set of verbs into regular, irregular vowel-change, same-form and other irregular patterns, then test the forms from memory.',
    ],
    faqs: [
      {
        question: 'Does a child need to memorise every irregular verb?',
        answer: 'No. Start with high-frequency verbs that children repeatedly need in speaking and school writing, such as be, go, come, do, have, make, take, see, write, eat and give. Teach the forms in meaningful sentences and expand the set gradually. Frequent retrieval is more effective than trying to memorise a very long list at once.',
      },
      {
        question: 'What is the difference between the past form and the past participle?',
        answer: 'The past form can carry a simple-past clause by itself, as in “She wrote yesterday.” The past participle usually works with an auxiliary, for example “She has written” or “The note was written.” Some verbs use the same spelling for both forms, while irregular verbs such as write make the difference visible.',
      },
    ],
    sourceIds: ['cambridge-verb-forms', 'british-council-irregular-verbs', 'cambridge-present-simple'],
    relatedPaths: [
      '/resources/grammar/verbs-for-kids',
      '/resources/grammar/simple-past-tense-for-kids',
      '/resources/grammar/present-perfect-vs-simple-past-for-kids',
      '/resources/grammar/active-and-passive-voice-for-kids',
    ],
  }),

  page({
    referenceOrder: 5,
    id: 'word-order-focus',
    slug: 'word-order-for-kids',
    cardTitle: 'Word Order in English',
    seoTitle: 'Word Order in English for Kids: Clear Sentence Patterns | Tiny Steps',
    seoDescription: 'Teach children how subject, verb, object and adverb placement shape clear English statements, questions and focused sentences.',
    quickAnswer: 'English word order helps the reader identify who is doing what to whom. A common statement pattern is subject + verb + object, but questions, adverb placement and information focus can change the order. Children should learn the normal pattern first, then learn the reasons for controlled changes.',
    concept: 'Word order is the architecture of a sentence. English depends heavily on position to show relationships between the subject, verb, object, complements and adverbials. A sentence can contain the right vocabulary and verb tense but still sound unclear or change meaning if those parts are arranged badly.',
    whyItMatters: 'Children often transfer word order from another language, place adverbs wherever they sound convenient, or build questions by simply adding a question word to a statement. A clear word-order framework helps sentence formation, question accuracy, adverb placement, editing and reading comprehension. It also gives children a practical way to diagnose sentences that feel “wrong” even when every individual word is familiar.',
    rulePoints: [
      'A basic English statement often follows subject + verb + object or complement: “Maya solved the puzzle” and “The soup tastes delicious.” This is a starting pattern, not a claim that every English sentence has an object. Children should identify the subject and complete verb first, then ask what other information the verb requires. Keeping those core relationships visible prevents accidental rearrangement.',
      'Questions often require an auxiliary before the subject: “Does Maya like science?” or “Where did they go?” If there is no suitable auxiliary in a simple-present or simple-past question, English uses do/does/did and the main verb takes the base form. Question order is therefore not created by moving only the question word; the auxiliary-subject relationship must also be correct.',
      'Adverbs and adverbials have preferred positions depending on their type and the emphasis intended. Frequency adverbs such as usually and often commonly appear before an ordinary main verb but after be: “She usually walks” and “She is usually early.” Time and place expressions are often placed later: “We practised in the hall yesterday.” Children should learn high-frequency placement patterns before exploring deliberate focus changes.',
    ],
    workedExamples: [
      {
        example: 'Riya carefully packed the books after class.',
        explanation: 'Riya is the subject, packed is the verb and the books is the object. Carefully modifies the action and is placed close to the verb, while after class gives time information at the end. The sentence keeps the core subject–verb–object relationship easy to recognise.',
      },
      {
        example: 'Where did the students put the posters?',
        explanation: 'Where comes first because the missing information is place. Did moves before the subject the students, and the main verb returns to the base form put. A form such as “Where the students did put the posters?” does not follow the ordinary English question pattern in this context.',
      },
      {
        example: 'She usually reads before bed. / She is usually quiet before bed.',
        explanation: 'With an ordinary main verb, the frequency adverb usually comes before reads. With be, usually normally follows the be form: is usually. The adverb has the same meaning, but the verb type affects its usual position.',
      },
    ],
    examples: [
      'The dog chased the ball across the garden.',
      'Does your brother play chess after school?',
      'We often revise grammar on Friday afternoons.',
    ],
    commonMistakes: [
      'Reordering the subject and object so the sentence accidentally changes who performed the action, especially when both are people or animals.',
      'Building a question in statement order, such as “Where she is going?” or using did while keeping the main verb in the past form.',
      'Placing frequency adverbs mechanically in one position and producing forms such as “She usually is late” when the intended neutral pattern is “She is usually late.”',
    ],
    trickyCases: [
      'English allows alternative word orders for emphasis, style and information structure, but marked patterns should not be taught as random freedom. A child first needs the neutral form that readers expect. Once that is secure, texts can be compared to show how authors deliberately move information for focus.',
      'Long adverbials and subordinate clauses can appear at the beginning or end: “After the match, we went home” and “We went home after the match.” When a fronted element is long, punctuation may help the reader. The child should check whether the core subject and verb remain clear after the extra information is moved.',
    ],
    teachingNote: 'Use movable sentence chunks rather than isolated words. Label subject, verb, object/complement and adverbial, then let the child test which rearrangements remain grammatical and how the meaning changes. For questions, practise the auxiliary-subject-main verb frame as one pattern. For adverbs, compare pairs such as “She often reads” and “She is often ready.” The goal is controlled choice, not memorising one rigid formula for every sentence.',
    practicePrompts: [
      'Reorder five scrambled sentences into natural statements and identify the subject, complete verb and object or complement.',
      'Turn statements into yes/no and wh- questions, checking auxiliary position and returning the main verb to its base form when do/does/did is used.',
      'Move time, place and frequency information through several possible positions and decide which version sounds neutral, clear or deliberately emphatic.',
    ],
    faqs: [
      {
        question: 'Is English always subject + verb + object?',
        answer: 'No. Subject + verb + object is a common pattern for transitive statements, but some verbs do not take objects, some clauses use complements, questions change auxiliary order, and adverbials can appear in several positions. The value of the pattern is that it gives children a reliable neutral starting point before they learn the controlled variations.',
      },
      {
        question: 'Why does word order matter if all the correct words are present?',
        answer: 'Because English uses position to signal grammatical relationships and information focus. “The dog chased the cat” and “The cat chased the dog” contain almost the same words but describe opposite events. In questions and adverb placement, unusual order can also make a sentence sound non-standard or harder to understand.',
      },
    ],
    sourceIds: ['cambridge-word-order-focus', 'british-council-clauses', 'cambridge-questions'],
    relatedPaths: [
      '/blog/how-to-improve-sentence-formation-in-kids',
      '/resources/grammar/forming-questions-in-english-for-kids',
      '/resources/grammar/adverbs-for-kids',
      '/resources/grammar/noun-phrases-for-kids',
    ],
  }),

  page({
    referenceOrder: 6,
    id: 'common-grammar-mistakes',
    slug: 'common-grammar-mistakes-for-kids',
    cardTitle: 'Common Grammar Mistakes for Kids',
    seoTitle: 'Common Grammar Mistakes for Kids: Find, Explain & Fix Errors | Tiny Steps',
    seoDescription: 'Use a diagnostic guide to identify common child grammar errors in agreement, articles, countability, tense, questions, word order and sentence boundaries.',
    quickAnswer: 'A useful grammar-mistakes guide should do more than list “wrong” sentences. It should help a child identify the error family, explain why the form does not fit the meaning or structure, correct it, and then practise the underlying skill in a fresh sentence.',
    concept: 'Grammar errors usually come from a smaller number of systems: noun reference and countability, subject–verb agreement, verb tense and form, question or negative structure, word order, sentence boundaries and word choice. Diagnosing the system turns correction into learning instead of one-time proofreading.',
    whyItMatters: 'A child can correct a sentence after being told the answer and still repeat the same mistake in independent writing. The missing step is diagnosis. When children learn to classify an error and connect it to a rule they already know, they can monitor new sentences, explain corrections and transfer grammar knowledge into schoolwork rather than depending on an adult to mark every error.',
    rulePoints: [
      'First identify the error family before changing the sentence. Ask whether the problem is about the noun, determiner, verb, sentence order or sentence boundary. For example, “many homework” points to countability and quantifier choice, while “She go to school” points to subject–verb agreement. This prevents children from making unrelated edits simply because a sentence looks unfamiliar.',
      'Then explain the correction using meaning plus structure. “She goes to school every day” needs simple present because it describes a routine and goes because the third-person singular subject requires the matching present form. “Did she go?” needs the base form because did already carries the past marking. A reasoned correction is more transferable than replacing one word by memory.',
      'Finally test the rule on a fresh sentence. After correcting “an advice” to “some advice” or “a piece of advice”, ask the child to use information, furniture or homework in a new sentence. After fixing a run-on, ask for a different pair of complete ideas joined accurately. The new example shows whether the child learned the grammar principle rather than copied the correction.',
    ],
    workedExamples: [
      {
        example: 'Incorrect: She don’t likes maths. → Correct: She doesn’t like maths.',
        explanation: 'This is an auxiliary and verb-form problem. With third-person singular she in a simple-present negative, use does not/doesn’t. Once does carries the agreement, the main verb returns to the base form like. The repair is not merely deleting s; it is choosing the complete negative pattern.',
      },
      {
        example: 'Incorrect: I have many homeworks. → Correct: I have a lot of homework.',
        explanation: 'Homework is normally uncountable in standard English, so a plural homeworks and the countable quantifier many do not fit that noun meaning. The correction keeps homework uncountable and uses a quantity expression that can combine naturally with it.',
      },
      {
        example: 'Incorrect: Maya finished her work, she went outside. → Correct: Maya finished her work, and she went outside.',
        explanation: 'The original joins two independent clauses with only a comma, creating a comma splice. Adding a coordinating conjunction produces a correct compound sentence. A full stop or semicolon could also work in suitable writing; the key is to mark the boundary between two complete ideas.',
      },
    ],
    examples: [
      'He plays football every Saturday. — not “He play football every Saturday.”',
      'Did they see the film? — not “Did they saw the film?”',
      'I need some information. — not “I need an information.”',
    ],
    commonMistakes: [
      'Correcting only the visible word without identifying the grammar system, which makes it difficult to apply the same rule in a different sentence.',
      'Assuming every unusual sentence is wrong; some forms are grammatical but less common, stylistically marked or dependent on context, so the intended meaning must be checked.',
      'Giving children a finished corrected sentence too quickly instead of asking them to locate the error, name the rule in child-friendly language and test the rule on a new example.',
    ],
    trickyCases: [
      'Not every difference is a grammar mistake. British and American English may prefer different spellings or some different forms, and spoken English can contain patterns that formal school writing avoids. The teaching goal is to use the standard expected for the child’s task while distinguishing genuine grammar errors from harmless variation.',
      'One sentence can contain more than one error, but correcting all of them at once can hide the teaching point. For practice, isolate the main error family first. During authentic writing revision, work in passes: sentence boundaries, verbs, noun/determiner choices, then word choice and spelling. This reduces cognitive load and makes patterns easier to notice.',
    ],
    teachingNote: 'Use a consistent four-step correction routine: Find it → Name the family → Fix it → Prove it with a new sentence. Keep a small error log by category rather than a long list of corrected sentences. If the same family repeats, route the child back to the focused owner: articles, countability, questions, tense, word order, fragments/run-ons or subject–verb agreement. The purpose of the diagnostic hub is to send the learner to the right concept, not to replace the detailed concept guides.',
    practicePrompts: [
      'Classify twelve incorrect sentences by error family before correcting any of them: agreement, article/determiner, countability, verb form, question order, word order or sentence boundary.',
      'Choose four corrected sentences and write a one-sentence explanation of the rule, then create a fresh example that uses the same rule accurately.',
      'Edit a short paragraph in two passes: first fix sentence boundaries and verbs; then check noun/determiner choices and word order. Record which error family appeared most often.',
    ],
    faqs: [
      {
        question: 'What grammar mistakes should children fix first?',
        answer: 'Prioritise errors that affect sentence meaning and structure: missing or incorrect verbs, subject–verb agreement, sentence fragments or run-ons, question/negative structure and noun/determiner patterns. Then work on recurring word-order or usage issues. The best priority depends on the child’s actual writing sample rather than a universal list of mistakes.',
      },
      {
        question: 'Should a parent correct every grammar mistake in a child’s writing?',
        answer: 'Usually not in one pass. Too many corrections can turn writing into copying. Select a small number of recurring error families, ask the child to find and explain the pattern, then test it in a fresh sentence. Keep content and ideas separate from grammar editing when possible so the child can improve both without losing confidence or ownership of the writing.',
      },
    ],
    sourceIds: ['cambridge-common-mistakes', 'british-council-grammar', 'purdue-sentence-clarity'],
    relatedPaths: [
      '/blog/grammar-subject-verb',
      '/resources/grammar/countable-uncountable-nouns-for-kids',
      '/resources/grammar/forming-questions-in-english-for-kids',
      '/resources/grammar/sentence-fragments-and-run-ons-for-kids',
    ],
  }),
]);

export const GRAMMAR_REFERENCE_EXTENSION_PATHS = MANIFEST_PATHS;
export const GRAMMAR_REFERENCE_EXTENSION_RESOURCE_SEO = MANIFEST_SEO;

const bySlug = new Map(GRAMMAR_REFERENCE_EXTENSION_PAGES.map((entry) => [entry.slug, entry]));
const byPath = new Map(GRAMMAR_REFERENCE_EXTENSION_PAGES.map((entry) => [entry.path, entry]));

export const getGrammarReferenceExtensionPageBySlug = (slug) =>
  bySlug.get(String(slug || '')) ?? null;

export const getGrammarReferenceExtensionPageByPath = (pathname) =>
  byPath.get(String(pathname || '').replace(/\/+$/, '')) ?? null;

if (GRAMMAR_REFERENCE_EXTENSION_PAGES.length !== 6) {
  throw new Error('GV3 must publish exactly six first-batch Grammar reference extensions.');
}
if (
  GRAMMAR_REFERENCE_EXTENSION_PAGES.length !== GRAMMAR_REFERENCE_EXTENSION_PATHS.length
  || GRAMMAR_REFERENCE_EXTENSION_PAGES.some((entry, index) => entry.path !== GRAMMAR_REFERENCE_EXTENSION_PATHS[index])
) {
  throw new Error('GV3 Grammar reference content must stay aligned with the lightweight SEO manifest.');
}
for (const entry of GRAMMAR_REFERENCE_EXTENSION_PAGES) {
  const seo = GRAMMAR_REFERENCE_EXTENSION_RESOURCE_SEO[entry.path];
  if (!seo || seo.title !== entry.seoTitle || seo.description !== entry.seoDescription || seo.canonicalPath !== entry.path) {
    throw new Error(`GV3 Grammar reference SEO manifest drift detected for ${entry.path}.`);
  }
}
