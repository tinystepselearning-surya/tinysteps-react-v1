import {
  VOCABULARY_AUTHORITY_RESOURCE_SEO as MANIFEST_SEO,
  VOCABULARY_AUTHORITY_PATHS as MANIFEST_PATHS,
} from './vocabularyAuthoritySeoManifest.js';
import { getVocabularyAuthoritySources } from './vocabularyAuthoritySources.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);

const page = (config) => {
  const sources = getVocabularyAuthoritySources(config.sourceIds);
  if (sources.length < 2) {
    throw new Error(`GV4 Vocabulary authority page ${config.id} requires at least two authoritative references.`);
  }

  return freeze({
    state: 'vocabulary-authority',
    publicationApproved: true,
    publicationBatch: 'gv4-first-authority-batch',
    hubPath: '/resources/vocabulary',
    practicePath: '/free-games/word-meaning-flashcards',
    ...config,
    sources,
    path: `/resources/vocabulary/${config.slug}`,
    teachingPoints: freezeList(config.teachingPoints),
    wordGroups: freezeList(config.wordGroups.map((group) => freeze({
      ...group,
      words: freezeList(group.words),
    }))),
    workedExamples: freezeList(config.workedExamples.map((item) => freeze({ ...item }))),
    examples: freezeList(config.examples),
    commonMistakes: freezeList(config.commonMistakes),
    trickyCases: freezeList(config.trickyCases),
    practicePrompts: freezeList(config.practicePrompts),
    faqs: freezeList(config.faqs.map((item) => freeze({ ...item }))),
    sourceIds: freezeList(config.sourceIds),
    relatedPaths: freezeList(config.relatedPaths),
  });
};

export const VOCABULARY_AUTHORITY_PAGES = freezeList([
  page({
    order: 1,
    id: 'everyday-vocabulary',
    stageId: 'everyday-foundations',
    slug: 'everyday-vocabulary-for-kids',
    cardTitle: 'Everyday Vocabulary for Kids',
    seoTitle: 'Everyday Vocabulary for Kids: Meaning, Context & Use | Tiny Steps',
    seoDescription: 'Build useful everyday vocabulary for children through clear meanings, real-life contexts, example sentences and active practice.',
    parentQuestion: 'How can I help my child build useful everyday vocabulary?',
    quickAnswer: 'Everyday vocabulary grows when children meet useful words in meaningful situations, connect each word to a clear idea, hear or read it in more than one context, and then retrieve it for speaking or writing. A short list becomes real vocabulary only when the child can understand and use the words independently.',
    concept: 'Everyday vocabulary is the high-frequency language children need to understand ordinary conversations, classroom instructions, stories and daily routines. It includes nouns for people, places and objects; verbs for common actions; adjectives for basic description; and useful time or routine words. The goal is not to collect hundreds of isolated labels. It is to build flexible word knowledge that lets a child recognise a word, explain its meaning, understand it in a sentence and use it when the situation changes.',
    whyItMatters: 'Vocabulary supports far more than word quizzes. A child needs enough word knowledge to understand what a sentence is about, follow instructions, contribute to conversation and express precise ideas in writing. When everyday vocabulary is weak, a child may decode a sentence accurately yet still miss its meaning, or may know what they want to say but rely on vague words such as thing, nice, do and that. Building a stable everyday foundation gives later work on reading comprehension, grammar, speaking and writing something meaningful to operate on.',
    teachingPoints: [
      'Teach a word as a meaning-in-context unit rather than as a translation pair. Start with a child-friendly explanation, then place the word in a short natural sentence and connect it to a familiar situation. For example, “carry means hold something and take it with you” becomes more useful when the child hears “I carry my school bag” and then describes something they carry at home. The definition, context and personal use reinforce one another.',
      'Organise words into semantic groups so memory has structure. Home words such as kitchen, window and blanket can be linked to a familiar room or routine; school words can be connected to classroom actions; place words such as market, garden and street can be used while describing a neighbourhood. Grouping should support meaning, not become another list to memorise. Mix old and new groups regularly so children still retrieve words when the topic cue is removed.',
      'Move deliberately from recognition to retrieval. A child who can point to the correct picture may not yet be able to produce the word. After matching or choosing, ask the child to recall the word without options, explain it in their own words, complete a new sentence and finally use it in a personal spoken or written response. This gradual removal of support helps receptive vocabulary become expressive vocabulary.',
    ],
    wordGroups: [
      {
        label: 'Home and routines',
        words: ['family', 'kitchen', 'window', 'blanket', 'morning', 'carry'],
        note: 'Use these words while describing a real morning routine or a room rather than as disconnected labels.',
      },
      {
        label: 'Places and objects',
        words: ['garden', 'market', 'street', 'bottle', 'notebook', 'library'],
        note: 'Ask where an item is found, what happens there, or what a person might do with it.',
      },
      {
        label: 'Common actions',
        words: ['open', 'read', 'write', 'draw', 'eat', 'jump'],
        note: 'Action words become stronger when children act them out, contrast them and use them with different subjects and objects.',
      },
    ],
    workedExamples: [
      {
        example: 'Word: bottle — “a container used to hold water or another liquid”',
        explanation: 'Start with meaning, then vary the context: “My bottle is on the desk”, “Please fill the bottle”, and “The bottle is empty.” The noun stays the same while the surrounding verbs and adjectives change. The child learns more than a label because the word now participates in several real sentence patterns.',
      },
      {
        example: 'Word: market — “a place where people buy and sell things”',
        explanation: 'Instead of stopping after the definition, compare a market with a library or garden. Ask what people do there, what they might buy, and when the child has visited one. Semantic comparison creates boundaries around the meaning and makes the word easier to retrieve later.',
      },
      {
        example: 'Word: carry — “to hold something and take it with you”',
        explanation: 'Contrast “carry the bag” with “open the bag” and “drop the bag”. Then change the object: carry a box, carry books, carry a baby. The repeated verb with different objects shows the stable meaning while preventing the child from memorising only one fixed phrase.',
      },
    ],
    examples: [
      'I opened the window because the kitchen was warm.',
      'Our neighbour carried a bottle to the garden.',
      'In the morning, I put my notebook in my school bag.',
    ],
    commonMistakes: [
      'Teaching too many words at once and measuring success only by whether the child remembers them immediately. Short-term recognition can look impressive but disappear quickly if the words are not revisited across several days and contexts.',
      'Giving only a dictionary-style definition or translation. A definition can introduce meaning, but children need sentence context, comparison and active use before the word becomes flexible enough for reading or speaking.',
      'Keeping vocabulary entirely inside topic lists. Topic grouping is useful during teaching, but children also need mixed retrieval so they can recall market, blanket or carry when no category heading tells them what kind of word to expect.',
    ],
    trickyCases: [
      'A familiar word can have more than one meaning or grammatical use. “Open” can describe an action in “open the door” and a state in “the door is open”. Younger learners do not need every dictionary sense at once, but adults should avoid presenting one example as if it were the only possible use.',
      'A child may understand a word when listening but not produce it independently. That is a normal receptive–expressive gap. Do not assume the word is fully mastered after a matching task; use low-pressure recall, sentence completion and conversation to see whether the child can retrieve it without options.',
    ],
    teachingNote: 'Choose a small set of words that matter to the child’s real life, explain them simply, and revisit them through different activities. A useful five-minute routine is: remember yesterday’s words, introduce two or three new words, compare one new word with a familiar word, use the new words in sentences, then ask one personal question that requires retrieval. Keep examples natural and do not force every word into the same sentence pattern. When reading together, notice previously taught words in a new text so children see that vocabulary belongs to communication, not only to practice cards.',
    practicePrompts: [
      'Choose six familiar objects or places from the child’s day. For each one, ask the child to name it, explain what it is or where it is found, and use it in a fresh sentence without copying a model.',
      'Play a retrieval round with the Tiny Steps Vocabulary Adventure, then close the choices and ask the child to recall three of the words from memory and use each one in a different situation.',
      'Describe a morning, school or neighbourhood scene using at least five target words. Afterwards, replace one vague word such as thing, go or nice with a more precise word that better matches the meaning.',
    ],
    faqs: [
      {
        question: 'How many new vocabulary words should a child learn at one time?',
        answer: 'There is no useful universal number because difficulty, age, prior knowledge and teaching time differ. For home practice, a small set that can be revisited deeply is usually more valuable than a long list touched once. Judge the load by whether the child can explain, recognise and later retrieve the words in new contexts rather than by how many cards were completed.',
      },
      {
        question: 'Should vocabulary practice use pictures, definitions or sentences?',
        answer: 'Use more than one route to meaning. Pictures are helpful for concrete words, child-friendly definitions clarify the idea, and sentences show how the word behaves in context. The strongest check is independent use: can the child understand the word in a new sentence and produce it when speaking or writing without being shown the answer?',
      },
    ],
    sourceIds: ['british-council-a1-a2-vocabulary', 'british-council-everyday-objects', 'british-council-daily-routine', 'eef-vocabulary'],
    relatedPaths: ['/free-games/word-meaning-flashcards', '/reading-classes-for-kids', '/resources/vocabulary/school-vocabulary-for-kids'],
  }),

  page({
    order: 2,
    id: 'feelings-emotions',
    stageId: 'everyday-foundations',
    slug: 'feelings-emotions-for-kids',
    cardTitle: 'Feelings & Emotions Vocabulary',
    seoTitle: 'Feelings and Emotions Vocabulary for Kids | Tiny Steps',
    seoDescription: 'Teach children precise emotion words, shades of meaning and useful sentence patterns for talking and writing about feelings.',
    parentQuestion: 'How can children learn richer words for feelings and emotions?',
    quickAnswer: 'Children build emotion vocabulary by connecting words to situations, comparing nearby meanings and noticing intensity. Happy, excited, proud and relieved are not interchangeable; angry, annoyed, frustrated and furious also differ. Precise emotion words help children understand stories, explain experiences and write more believable characters.',
    concept: 'Emotion vocabulary names internal states and reactions, but strong teaching goes beyond matching a face to happy or sad. Children need to understand what situations can cause a feeling, how strongly a word expresses it, whether two words are close but not identical, and how the word behaves in a sentence. That creates a semantic network: calm can be compared with peaceful, excited with eager, angry with frustrated, and scared with nervous or terrified depending on context.',
    whyItMatters: 'Stories, conversations and school writing frequently depend on feelings that are implied rather than directly stated. A child with only a few broad emotion words may describe every positive experience as happy and every difficult experience as sad or angry. More precise vocabulary improves comprehension because the child can interpret characters’ reactions, and it improves expression because the child can explain what they or a character actually felt. It also supports richer speaking without requiring children to disclose private emotions; fictional and hypothetical situations work equally well.',
    teachingPoints: [
      'Teach emotion words through situations and evidence. Instead of saying “proud means happy”, give a scenario such as “Asha practised for two weeks and finally read the whole passage smoothly.” Ask which feeling fits and what caused it. Proud includes satisfaction about an achievement or connection, while happy is much broader. The scenario makes the semantic difference visible.',
      'Use intensity scales carefully. Annoyed, angry and furious can all describe anger, but the strength is different. Calm and relaxed may overlap, yet relaxed often suggests freedom from tension while calm can also describe controlled behaviour during a difficult moment. Children do not need rigid numerical rankings; they need to notice that near-synonyms carry different shades and may fit different contexts.',
      'Connect receptive and expressive use. After children identify the best feeling word for a character, ask them to justify the choice with sentence evidence and then use the word in a new situation. Sentence frames can help early on: “She felt ___ because ___.” Later remove the frame and ask for more natural language. This prevents vocabulary practice from stopping at picture recognition.',
    ],
    wordGroups: [
      {
        label: 'Positive and achievement feelings',
        words: ['happy', 'excited', 'proud', 'calm'],
        note: 'Compare the cause of each feeling rather than presenting them as four positive labels.',
      },
      {
        label: 'Difficult feelings',
        words: ['sad', 'angry', 'scared', 'bored', 'tired'],
        note: 'Use fictional situations and ask what evidence makes one word more precise than another.',
      },
      {
        label: 'Surprise and intensity',
        words: ['surprised', 'annoyed', 'frustrated', 'furious', 'nervous', 'relieved'],
        note: 'Teach intensity and cause through short scenarios, not isolated synonym lists.',
      },
    ],
    workedExamples: [
      {
        example: '“I solved the puzzle after trying five times.” → proud or relieved?',
        explanation: 'Both may be possible depending on the intended focus. Proud highlights satisfaction with the achievement; relieved highlights the end of worry or difficulty. Asking the child to explain the choice is more useful than insisting that every scenario has only one emotion label.',
      },
      {
        example: '“The noise continued while I was trying to read.” → annoyed, angry or furious?',
        explanation: 'Annoyed is a reasonable moderate response. Angry is stronger and still plausible. Furious suggests very intense anger and would need stronger contextual evidence. The task teaches that synonyms often overlap but are not identical in strength.',
      },
      {
        example: '“Nina took a slow breath before speaking to the audience.” → calm',
        explanation: 'The action suggests controlled, steady behaviour. The sentence does not prove that Nina felt no nervousness; a person can feel nervous and still act calmly. This helps children separate visible behaviour from an inferred internal state.',
      },
    ],
    examples: [
      'He felt proud when he finished the difficult project independently.',
      'The sudden thunder surprised the children, but they soon became calm.',
      'Mira was frustrated because the instructions were unclear, not because she disliked the activity.',
    ],
    commonMistakes: [
      'Treating synonyms as exact replacements. Joyful, excited, proud and relieved can all occur in positive situations, but changing the word may change the reason or intensity of the feeling.',
      'Teaching emotions only from facial expressions. Faces are ambiguous; the same expression can appear in different states. Context, actions and dialogue provide stronger language-learning evidence.',
      'Pushing children to describe personal feelings when they are uncomfortable. Vocabulary can be taught effectively through story characters, imaginary situations, role play and neutral examples without requiring personal disclosure.',
    ],
    trickyCases: [
      'One situation can reasonably support more than one emotion. A child waiting to perform may feel excited and nervous at the same time. Vocabulary teaching should allow justified alternatives when the context supports them rather than turning every emotional scenario into a single-answer quiz.',
      'Some emotion words can describe temporary feelings, recurring states or personality impressions depending on the sentence. “She is calm today” describes a state; “She is a calm person” describes a more general characteristic. The grammar around the word helps clarify the intended meaning.',
    ],
    teachingNote: 'Build a classroom or home “meaning ladder” with a few carefully chosen emotion families. Give short scenarios and ask children to choose the most precise word, then explain what evidence influenced them. Add one or two new words only when the familiar ones are secure. Use story reading to revisit the vocabulary: pause before an emotion is named, ask what the character may be feeling, and require evidence from actions or events. For writing, replace repeated broad words with a more precise choice only when the new word actually matches the character’s situation.',
    practicePrompts: [
      'Sort twelve emotion words into broad families such as positive, worried/fearful, angry/frustrated and calm/relieved, then explain two words that could fit more than one situation.',
      'Read five short fictional scenarios. Choose the best emotion word for each and underline the clue that supports the choice. Accept alternative answers when the child can justify them from the context.',
      'Rewrite a short paragraph that repeats happy, sad or angry. Replace only three repetitions with more precise words and explain how each replacement changes the meaning.',
    ],
    faqs: [
      {
        question: 'Are synonyms for feelings interchangeable?',
        answer: 'Usually not completely. Synonyms share part of a meaning, but they may differ in intensity, cause, formality or typical context. Angry, annoyed and furious all relate to anger, yet they do not communicate the same strength. Children should compare words in sentences rather than memorising synonym pairs as exact equivalents.',
      },
      {
        question: 'How can I teach emotion vocabulary without making a child talk about private feelings?',
        answer: 'Use fictional characters, picture-free scenarios, story events, role play and hypothetical situations. The learning goal is language: understanding meaning, noticing shades and choosing precise words. Personal sharing can be optional. A child can demonstrate strong emotion vocabulary by analysing a character or inventing a situation.',
      },
    ],
    sourceIds: ['cambridge-thesaurus', 'cambridge-angry-thesaurus', 'cambridge-calm-thesaurus', 'eef-vocabulary'],
    relatedPaths: ['/spoken-english-classes-for-kids-online', '/writing-classes-for-kids', '/free-games/word-meaning-flashcards'],
  }),

  page({
    order: 3,
    id: 'school-vocabulary',
    stageId: 'everyday-foundations',
    slug: 'school-vocabulary-for-kids',
    cardTitle: 'School Vocabulary for Kids',
    seoTitle: 'School Vocabulary for Kids: Classroom Words & Instructions | Tiny Steps',
    seoDescription: 'Learn classroom objects, people, instructions and learning-action vocabulary children need to understand and talk about school.',
    parentQuestion: 'What school vocabulary should children understand and use?',
    quickAnswer: 'Useful school vocabulary includes more than object labels. Children need words for people and places, classroom objects, learning actions and common instructions so they can understand what is happening, ask for help and describe their schoolwork. The strongest practice connects the words to realistic classroom situations.',
    concept: 'School vocabulary is a functional lexical set built around the language of learning. Concrete nouns such as pencil, notebook, classroom and library are an easy entry point, but children also need verbs such as read, write, explain, answer, compare and practise, plus instruction language such as underline, circle, choose, describe and discuss. Learning these words in meaningful clusters supports classroom comprehension and gives children language for talking about what they are learning.',
    whyItMatters: 'A child can understand the academic idea in a lesson yet struggle because the instruction words are unfamiliar. “Compare the two answers” demands a different action from “choose the correct answer”; “describe” is different from “name”. School vocabulary also supports independence: children can explain that they need a notebook, ask a question, describe homework or tell a parent what happened in class. This vocabulary therefore sits between everyday language and later academic vocabulary.',
    teachingPoints: [
      'Separate object vocabulary from instruction vocabulary. Naming pencil, notebook and classroom is useful, but school participation also depends on action words. Teach verbs through the action they require: underline means draw a line under something; circle means mark around something; compare means look for similarities and differences. The child should demonstrate the instruction, not only repeat its definition.',
      'Teach school words in small situational clusters. A “starting the lesson” cluster might include classroom, teacher, notebook, pencil, page and open. A “responding” cluster might include question, answer, explain, choose and check. Situational grouping makes the language retrievable when the real classroom event occurs. Later mix the clusters to prevent dependence on a fixed teaching order.',
      'Connect school vocabulary to complete language. Instead of drilling “homework = work done at home”, ask the child to say what the homework is, when it is due, whether it is finished and what was difficult. This extends vocabulary into grammar and speaking without changing the canonical owner of grammar or speaking skills. The vocabulary page owns the lexical meaning and functional use.',
    ],
    wordGroups: [
      {
        label: 'People, places and objects',
        words: ['teacher', 'classroom', 'library', 'pencil', 'notebook', 'homework'],
        note: 'Use the words to describe where learning happens and what a child needs for a task.',
      },
      {
        label: 'Learning actions',
        words: ['read', 'write', 'practise', 'answer', 'explain', 'check'],
        note: 'Ask the child to perform or demonstrate the instruction so meaning is connected to action.',
      },
      {
        label: 'Instruction words',
        words: ['choose', 'circle', 'underline', 'compare', 'describe', 'discuss'],
        note: 'Teach contrasts between task verbs because these words signal different expected responses.',
      },
    ],
    workedExamples: [
      {
        example: 'Instruction: “Compare the two pictures.”',
        explanation: 'Compare does not simply mean look at both. The learner is expected to notice similarities and/or differences. Ask the child to say one similarity and one difference so the meaning of the instruction becomes observable.',
      },
      {
        example: 'Instruction: “Explain your answer.”',
        explanation: 'Explain requires a reason or account, not only the answer itself. “Seven” answers a calculation; “I chose seven because…” begins an explanation. This distinction helps children understand why a teacher may ask for more after a correct short answer.',
      },
      {
        example: 'Sentence: “I finished my homework in my notebook and checked every answer.”',
        explanation: 'This sentence combines a school task, an object and a learning action. It demonstrates how lexical items work together in real school language rather than remaining separate flashcard labels.',
      },
    ],
    examples: [
      'Please underline the word that gives the clue.',
      'The teacher asked us to compare our answers before the discussion.',
      'I borrowed a book from the library and wrote notes in my notebook.',
    ],
    commonMistakes: [
      'Focusing only on school objects because they are easy to picture. Children may know pencil and desk but still misunderstand the verbs that tell them what to do in a task.',
      'Treating task verbs as interchangeable. Name, describe, compare, explain and discuss require different levels and kinds of response, so examples should make those differences explicit.',
      'Teaching instruction vocabulary only as written definitions. A child may repeat “underline means…” yet fail to act on the instruction. Include physical demonstration, sample questions and real mini-tasks.',
    ],
    trickyCases: [
      'The same word can have a general everyday meaning and a school-specific use. “Check” can mean inspect something generally, while “check your answer” in school means review it for accuracy. Teach the shared core meaning and then show the classroom use.',
      'School terminology varies across countries, curricula and schools. Words such as grade, class, standard, period or timetable may be used differently. Focus first on broadly useful functional language and explain local terms when they occur in the child’s real materials.',
    ],
    teachingNote: 'Collect authentic but simple classroom instructions from the child’s worksheets or school messages and turn them into short comprehension tasks. Highlight one instruction verb at a time, demonstrate it, then give a new example. Keep a small reference list of verbs the child repeatedly meets. For object and place words, ask open questions rather than naming drills: “What would you take to the library?”, “Where would you write the answer?”, “What does the teacher mean by compare?” This makes school vocabulary immediately useful and gives parents a practical way to notice which language—not which academic concept—is causing confusion.',
    practicePrompts: [
      'Give six instruction cards: choose, circle, underline, compare, describe and explain. Ask the child to perform each instruction on a tiny example and say what the instruction expects.',
      'Describe a school day using at least eight target words from people, objects, places and actions. Then replace one vague verb such as do with a more precise school action.',
      'Use the Vocabulary Adventure to review school words, then ask the child to produce three school sentences from memory without seeing the word list.',
    ],
    faqs: [
      {
        question: 'Is school vocabulary the same as academic vocabulary?',
        answer: 'They overlap, but they are not identical. Early school vocabulary includes concrete classroom words and common instructions. Academic vocabulary grows into more general learning words used across subjects, such as analyse, evidence, conclude and evaluate. A child benefits from mastering functional classroom language before and alongside more abstract academic terms.',
      },
      {
        question: 'What if my child knows the subject but does not understand the worksheet instruction?',
        answer: 'Separate the language demand from the subject demand. Explain the instruction verb, demonstrate it with an easy example, then return to the original task. If the child succeeds after the instruction is clarified, the difficulty may be lexical rather than conceptual. Revisit that instruction word in later tasks so the child becomes independent.',
      },
    ],
    sourceIds: ['british-council-school', 'british-council-a1-a2-vocabulary', 'eef-vocabulary'],
    relatedPaths: ['/free-games/word-meaning-flashcards', '/spoken-english-classes-for-kids-online', '/resources/vocabulary/everyday-vocabulary-for-kids'],
  }),

  page({
    order: 4,
    id: 'synonyms-antonyms',
    stageId: 'word-relationships',
    slug: 'synonyms-antonyms-for-kids',
    cardTitle: 'Synonyms & Antonyms for Kids',
    seoTitle: 'Synonyms and Antonyms for Kids: Meaning & Word Choice | Tiny Steps',
    seoDescription: 'Help children compare similar and opposite meanings, notice shades of meaning and choose the best word for a sentence.',
    parentQuestion: 'How should children learn synonyms and antonyms without memorising word pairs?',
    quickAnswer: 'Synonyms are words with similar meanings, while antonyms express contrasting meanings, but most word relationships depend on context. Good vocabulary teaching compares how words overlap, where they differ and which one fits a sentence best instead of treating every synonym or antonym pair as perfectly interchangeable.',
    concept: 'Word relationships help children organise vocabulary as a network rather than a collection of definitions. Synonyms such as big and large share substantial meaning, yet words that appear in the same thesaurus group can differ in intensity, register, typical collocations or emotional tone. Antonyms can also describe different kinds of contrast: hot/cold, open/closed and fast/slow work differently from relational pairs such as buy/sell. For children, the central skill is semantic comparison.',
    whyItMatters: 'Understanding word relationships improves comprehension because children can connect an unfamiliar word to known language and notice contrast signals in a text. It also improves writing by giving children alternatives to repeated broad words. However, indiscriminate synonym replacement can make writing less accurate. A child who learns that synonyms are “words that mean exactly the same thing” may replace a familiar word with a more advanced one that does not fit the context. Precision matters more than novelty.',
    teachingPoints: [
      'Begin with a shared core meaning, then ask what changes. Fast and quick both relate to speed, but their preferred uses are not identical in every phrase. Happy and joyful overlap, but joyful often expresses a stronger or more explicit positive feeling. Children should learn to ask, “Can both words fit here, and does the sentence feel or mean exactly the same?”',
      'Teach antonyms as contextual contrasts rather than permanent one-to-one partners. The opposite of light might be dark when talking about brightness, heavy when talking about weight, or serious when talking about tone. The sentence determines which meaning is active. This is an early and powerful way to teach children that words can have multiple senses.',
      'Use synonym and antonym knowledge to improve word choice, not to decorate sentences. Ask the child to compare two possible replacements and justify the stronger fit. “The rabbit moved fast” may be improved to “The rabbit darted away” only if the verb darted matches the actual movement. A precise familiar word is better than an impressive but inaccurate substitute.',
    ],
    wordGroups: [
      {
        label: 'Clear beginner relationships',
        words: ['big / large', 'fast / quick', 'calm / peaceful', 'open / closed'],
        note: 'Start with strong overlaps and contrasts, then test whether the words fit the same sentences.',
      },
      {
        label: 'Intensity and shade',
        words: ['annoyed / angry / furious', 'happy / joyful / delighted', 'scared / nervous / terrified'],
        note: 'Compare strength, cause and context instead of calling the whole group exact synonyms.',
      },
      {
        label: 'Context-dependent contrasts',
        words: ['light / dark', 'light / heavy', 'hard / soft', 'hard / easy'],
        note: 'Use complete sentences to show that the active meaning controls the antonym.',
      },
    ],
    workedExamples: [
      {
        example: '“The elephant is big.” Could large replace big?',
        explanation: 'Yes, in this sentence large keeps the central size meaning and sounds natural. The two words are strong synonyms here. The next step is to test another phrase rather than assume they are interchangeable everywhere.',
      },
      {
        example: '“She was furious when the prize was delayed by one minute.”',
        explanation: 'The grammar is possible, but furious communicates very intense anger. If the situation only caused mild irritation, annoyed may be more precise. Synonym work therefore includes judging whether the word matches the strength of the context.',
      },
      {
        example: '“This bag is light.” What is the antonym?',
        explanation: 'If light means not heavy, heavy is the relevant contrast. If the sentence were “The room is light”, dark may be the contrast. The same spelling activates different semantic relationships when the meaning changes.',
      },
    ],
    examples: [
      'The bright lamp made the room light, but the heavy box was not light to carry.',
      'The child looked calm even though she felt slightly nervous.',
      'The quick answer was correct, but a hurried answer is not always careful.',
    ],
    commonMistakes: [
      'Teaching synonyms as words that always mean exactly the same thing. This hides useful differences in strength, register and common usage.',
      'Asking for “the antonym” without providing enough context when the target word has several meanings. The child may give a valid contrast for a different sense.',
      'Using a thesaurus as an automatic replacement tool. A list of related words is a starting point for comparison, not proof that every listed word fits the original sentence.',
    ],
    trickyCases: [
      'Some words have no single neat antonym, and some contrasts depend on a scale or viewpoint. Rather than forcing a pair, ask what contrast the sentence needs. This keeps the task about meaning rather than completing a worksheet pattern.',
      'Register matters. Two words may share meaning but differ in formality or typical audience. Young children do not need advanced register terminology, but they can notice that some words sound more conversational, more formal or more dramatic in a particular sentence.',
    ],
    teachingNote: 'Use a “same, different, best” routine. Present two related words, ask what meaning they share, identify one important difference, then choose which one best completes a new sentence. For antonyms, always put the target word in a short context before asking for a contrast. When using a thesaurus, model verification: read the surrounding examples, check the intended meaning and say the revised sentence aloud. This teaches children that vocabulary tools support judgement rather than replace it.',
    practicePrompts: [
      'Take five familiar words and generate two possible synonyms for each. Write one sentence where both work and one sentence where only one sounds natural or precise.',
      'Give six target words with two different sentence meanings, such as light, hard or bright. Ask for an antonym in each context and explain why the antonym changes.',
      'Open a short paragraph with repeated words such as big, nice or said. Replace only the repetitions where a more precise alternative improves meaning, and explain every change.',
    ],
    faqs: [
      {
        question: 'Do synonyms mean exactly the same thing?',
        answer: 'Usually they overlap rather than match perfectly. Synonyms may differ in strength, tone, formality or the phrases they naturally occur in. For children, the useful habit is to compare related words in complete sentences and decide which one best expresses the intended meaning.',
      },
      {
        question: 'Can one word have different antonyms?',
        answer: 'Yes. A word with several meanings can have different contrasts. Light can contrast with dark when it refers to brightness and with heavy when it refers to weight. Give enough sentence context before asking for an antonym so the child knows which meaning is active.',
      },
    ],
    sourceIds: ['cambridge-thesaurus', 'reading-rockets-vocabulary-guidelines', 'eef-vocabulary'],
    relatedPaths: ['/free-games/word-meaning-flashcards', '/writing-classes-for-kids', '/resources/vocabulary/feelings-emotions-for-kids'],
  }),

  page({
    order: 5,
    id: 'context-clues',
    stageId: 'vocabulary-in-context',
    slug: 'context-clues-for-kids',
    cardTitle: 'Context Clues for Kids',
    seoTitle: 'Context Clues for Kids: Work Out Word Meaning | Tiny Steps',
    seoDescription: 'Teach children to infer unfamiliar word meanings from definitions, examples, contrast and surrounding sentence evidence.',
    parentQuestion: 'How can children use context clues to work out unfamiliar words?',
    quickAnswer: 'Context clues are pieces of information around an unfamiliar word that help a reader infer its likely meaning. Useful clues can include a nearby definition, example, contrast, cause-and-effect relationship, familiar word part or the overall logic of the sentence. The reader should form a meaning, test it against the whole passage and revise it if the evidence does not fit.',
    concept: 'Context-clue reading is evidence-based vocabulary inference, not guessing from one nearby word. Sometimes an author directly explains a term; sometimes examples reveal the category; sometimes words such as but, unlike or however signal contrast. In other cases, the reader combines several weaker clues with background knowledge. Good readers also know when context is insufficient and when a dictionary, glossary or teacher is the better next step.',
    whyItMatters: 'Children inevitably meet unfamiliar words while reading. Stopping to ask an adult or look up every word interrupts comprehension, but guessing freely can produce false meanings that distort the passage. Context-clue strategies give children a disciplined middle option: inspect the evidence, propose a meaning and verify it. The skill also deepens comprehension because the child must connect information across the sentence or paragraph rather than treat each word independently.',
    teachingPoints: [
      'Teach several clue types explicitly but keep the goal unified. A definition clue may say “A habitat, the place where an organism lives…”; an example clue may list roses, tulips and lilies after an unfamiliar category word; a contrast clue may use but or unlike. Children can name the clue type when helpful, but the important question is, “What information in the text supports this meaning?”',
      'Require a meaning that fits grammar as well as topic. If an unknown word appears after a determiner and before a verb, it is likely functioning as a noun in that sentence; if it describes a noun, it may be an adjective. Word parts can also help. A familiar prefix or root gives a hypothesis, but the surrounding sentence must confirm it. No single clue should override the full context.',
      'Build verification into the routine. After proposing a meaning, substitute a simple phrase for the unknown word and reread the sentence. Does the sentence still make sense? Does the next sentence support it? If not, revise the hypothesis. This step distinguishes context inference from guessing and teaches children that good readers can change their minds when new evidence appears.',
    ],
    wordGroups: [
      {
        label: 'Direct explanation clues',
        words: ['means', 'is called', 'refers to', 'in other words'],
        note: 'These signals often introduce a definition or restatement close to the unfamiliar word.',
      },
      {
        label: 'Example clues',
        words: ['such as', 'for example', 'including', 'like'],
        note: 'Examples help identify the category or features of an unfamiliar word.',
      },
      {
        label: 'Contrast and logic clues',
        words: ['but', 'however', 'unlike', 'although', 'because', 'therefore'],
        note: 'These connections can reveal opposite meaning, cause, result or a logical relationship that constrains the inference.',
      },
    ],
    workedExamples: [
      {
        example: '“Nocturnal animals, such as bats and many owls, are active at night.”',
        explanation: 'The examples bats and owls plus the direct information “active at night” strongly support a meaning related to being active during the night. The reader does not need to guess from nocturnal alone because the sentence supplies both examples and an explanatory property.',
      },
      {
        example: '“Unlike the noisy corridor, the library was tranquil and still.”',
        explanation: 'Unlike signals contrast. Noisy is contrasted with tranquil, and the added word still supports a calm, quiet interpretation. Multiple clues converge, so “quiet and peaceful” is a reasonable child-friendly meaning.',
      },
      {
        example: '“The path was treacherous after the storm, so we walked slowly and held the railing.”',
        explanation: 'The sentence does not directly define treacherous, but the consequences—walking slowly and holding a railing after a storm—suggest danger or difficulty. A reader can test “dangerous” in the sentence and see that the logic remains coherent.',
      },
    ],
    examples: [
      'A peninsula is a piece of land almost surrounded by water.',
      'The fruit was bitter, not sweet like the ripe mango beside it.',
      'The fragile glass cracked easily, so we carried it carefully.',
    ],
    commonMistakes: [
      'Guessing from the first familiar word nearby and ignoring the rest of the sentence. Strong inference usually depends on several pieces of evidence working together.',
      'Assuming every sentence gives enough information to determine an exact dictionary meaning. Some contexts only suggest a broad category or are genuinely unhelpful.',
      'Accepting a guessed meaning without rereading. A plausible idea can still be wrong if it makes the next sentence, grammar or overall topic inconsistent.',
    ],
    trickyCases: [
      'Context can occasionally mislead or remain neutral. If several meanings are possible and none can be confirmed, teach the child to mark the word and use another source rather than pretend certainty. Strategic dictionary use is part of good reading, not a failure of context skills.',
      'Morphology and context work together. A prefix such as un- may suggest negation, but the base word and sentence determine the final meaning. Children should treat roots and affixes as evidence, then verify the interpretation in context.',
    ],
    teachingNote: 'Model the thinking aloud: “I do not know this word yet. I see unlike, so I expect a contrast. I also see still. I think tranquil may mean calm or quiet. If I put quiet into the sentence, it makes sense.” Then give the child short examples where the clue is strong before moving to paragraphs with multiple weaker clues. Praise evidence, not lucky guesses. If the context is insufficient, explicitly say so and demonstrate looking the word up. This gives children a realistic reading strategy rather than the false rule that every unknown word can be solved from context.',
    practicePrompts: [
      'Underline the unfamiliar word in five sentences, circle the clue words or phrases, then write a short possible meaning and identify the evidence that supports it.',
      'Read a short paragraph containing one invented word whose meaning is recoverable from context. Infer the meaning, substitute a familiar phrase and reread the paragraph to verify the choice.',
      'Compare one helpful context and one unhelpful context for the same unknown word. Explain why the first supports an inference and why the second requires a glossary, dictionary or more text.',
    ],
    faqs: [
      {
        question: 'Should children always guess an unfamiliar word from context?',
        answer: 'No. They should infer when the surrounding text provides useful evidence. If the context is weak, ambiguous or technically precise, checking a glossary, dictionary or trusted adult is more accurate. The important habit is to know what the text supports and avoid pretending certainty when it does not.',
      },
      {
        question: 'Do prefixes and suffixes count as context clues?',
        answer: 'They are word-part or morphological clues rather than surrounding context, but readers often combine them with context. A prefix, root or suffix can suggest a possible meaning or word class; the sentence then helps confirm or reject that interpretation. Teaching both sources of evidence creates a stronger strategy.',
      },
    ],
    sourceIds: ['reading-rockets-context-clues', 'reading-rockets-vocabulary-guidelines', 'eef-vocabulary'],
    relatedPaths: ['/reading-classes-for-kids', '/free-games/word-meaning-flashcards', '/blog/how-vocabulary-supports-reading-comprehension'],
  }),

  page({
    order: 6,
    id: 'word-families-prefixes-suffixes',
    stageId: 'word-building',
    slug: 'word-families-prefixes-suffixes-for-kids',
    cardTitle: 'Word Families, Prefixes & Suffixes',
    seoTitle: 'Word Families, Prefixes and Suffixes for Kids | Tiny Steps',
    seoDescription: 'Build vocabulary by connecting base words, prefixes, suffixes and related word forms while protecting meaning and word class.',
    parentQuestion: 'How do word families, prefixes and suffixes help children build vocabulary?',
    quickAnswer: 'Word families connect words that share a base or root, while prefixes and suffixes add or change meaning and can also change word class. Children can use these patterns to understand and build words, but every new form still needs to be checked in context because spelling, meaning and usage are not always completely predictable.',
    concept: 'Morphology is the structure of meaningful word parts. A prefix is added before a base or stem, a suffix after it, and related words can form families such as help, helpful, helpless, helper and unhelpful. Word-family knowledge lets children connect new vocabulary to known vocabulary instead of learning every form as an unrelated item. It also creates a bridge between vocabulary, spelling and grammar while keeping each domain’s job clear.',
    whyItMatters: 'As reading becomes more advanced, many unfamiliar words are morphologically complex. A child who recognises re-, un-, -ful, -less, -er or -ment can often form a useful first hypothesis about meaning and grammatical role. Word families also strengthen expressive vocabulary: knowing decide can support decision; knowing care can support careful and carefully. But morphology is not a mechanical code. Pronunciation, spelling and meaning can shift, so children need both pattern knowledge and contextual verification.',
    teachingPoints: [
      'Start from a known base and build a small family. Help can become helpful, helpless and helper; care can become careful, careless and carefully. Ask what remains stable in the meaning and what changes with each affix. The purpose is not to memorise terminology alone but to see that a meaningful base can support several related words with different jobs.',
      'Teach common affix meanings with examples and counter-checks. Un- often contributes a not or reverse meaning, re- often signals again, -ful often suggests full of or having, and -less often suggests without. These are productive patterns, not guarantees for every word a child can invent. A generated form must exist in real English and must fit the sentence, so encourage children to verify unfamiliar constructions.',
      'Connect suffixes to word class carefully. -ness often forms a noun from an adjective, as kind → kindness; -ly often forms an adverb from an adjective, as careful → carefully; -er can form a person noun such as teacher but can also mark comparison in faster. The same spelling can perform different morphological jobs, so meaning and sentence role must guide the analysis.',
    ],
    wordGroups: [
      {
        label: 'Prefix families',
        words: ['happy / unhappy', 'write / rewrite', 'possible / impossible', 'agree / disagree'],
        note: 'Compare the base meaning with the meaning contributed by the prefix, then verify the new word in context.',
      },
      {
        label: 'Suffix families',
        words: ['help / helpful / helpless / helper', 'care / careful / careless / carefully'],
        note: 'Notice both meaning change and grammatical job rather than treating suffixes only as spelling chunks.',
      },
      {
        label: 'Word-class change',
        words: ['decide / decision', 'educate / education', 'kind / kindness', 'quick / quickly'],
        note: 'Use complete sentences to show how a related word can take a different role.',
      },
    ],
    workedExamples: [
      {
        example: 'help → helpful → helpless → helper',
        explanation: 'The base help connects the family semantically. Helpful describes someone or something that gives help; helpless describes being unable to help oneself or act effectively in a situation; helper names a person or thing that helps. The shared base does not make the meanings identical, so each form still needs its own example.',
      },
      {
        example: 'kind → unkind → kindness',
        explanation: 'Un- changes kind toward a negative meaning in unkind. The suffix -ness forms the noun kindness from the adjective kind. In “Her kindness mattered,” the noun can act as the subject. This demonstrates how morphology changes both meaning and grammatical possibilities.',
      },
      {
        example: 'quick → quickly',
        explanation: 'Quick is commonly an adjective: “a quick answer.” Quickly is commonly an adverb: “She answered quickly.” The suffix helps signal a change in word class, but children should confirm the sentence job rather than assume every word ending in -ly behaves identically.',
      },
    ],
    examples: [
      'Please rewrite the sentence so the meaning is clearer.',
      'The careful student checked the answer carefully.',
      'Her decision surprised us because she had decided very quickly.',
    ],
    commonMistakes: [
      'Assuming that any familiar prefix or suffix can be attached to any base to make a real word. English morphology is productive but not unlimited, so children should verify unfamiliar creations.',
      'Focusing only on spelling and missing the change in meaning or sentence role. A word family is useful because forms are related but function differently.',
      'Treating every apparent word part as a meaningful affix. Some words happen to begin or end with the same letters as a common affix without being transparently built from that affix in a way useful to the learner.',
    ],
    trickyCases: [
      'Spelling can change when suffixes are added: happy → happiness, decide → decision, run → runner. Morphology and spelling therefore need coordinated teaching. The meaning relationship can remain clear even when the written base changes.',
      'A related family can contain shifts in pronunciation or meaning that are not predictable from a simple rule. For young learners, begin with transparent productive families and add irregular or less transparent relationships only when they are useful in real reading.',
    ],
    teachingNote: 'Use word-family maps, but keep every branch attached to a sentence. Start with a known base in the centre, add two or three real related forms, discuss the contribution of each prefix or suffix, and then place each form in a natural sentence. Mix analysis with generation: sometimes give the complex word and ask for the base; sometimes give the base and ask which form fits a sentence. When spelling changes, point it out explicitly rather than letting the child assume the letters must remain identical. Connect the vocabulary page to Grammar when the child needs deeper word-class explanation and to spelling practice when the difficulty is orthographic.',
    practicePrompts: [
      'Build three small word-family trees from familiar bases such as help, care and kind. Add only real words, explain the affix meaning and use every form in a sentence.',
      'Sort ten complex words by prefix, suffix or both. Underline the base, circle the affix and write what the affix contributes to the meaning.',
      'Complete six sentences by choosing the correct family member, for example decide/decision or careful/carefully, then explain how the sentence role helped you choose.',
    ],
    faqs: [
      {
        question: 'Are word families the same as rhyming families such as -at or -ig?',
        answer: 'The phrase word family is used in more than one way in education. In early phonics it can refer to rime-based spelling families such as cat, hat and sat. In vocabulary and morphology, it usually refers to words connected by a meaningful base or root, such as help, helpful and helper. This Vocabulary guide uses the morphological meaning.',
      },
      {
        question: 'Should children memorise long lists of prefixes and suffixes?',
        answer: 'A small set of frequent, useful affixes taught through real words is more valuable than a long list of definitions. Children should understand what an affix often contributes, recognise it in reading, build or analyse a few real words, and confirm the final meaning in context. Expand the inventory gradually as texts become more complex.',
      },
    ],
    sourceIds: ['cambridge-word-formation', 'reading-rockets-vocabulary-guidelines', 'eef-vocabulary'],
    relatedPaths: ['/resources/grammar/nouns-for-kids', '/resources/grammar/verbs-for-kids', '/resources/grammar/adjectives-for-kids', '/free-spelling-game-for-kids'],
  }),
]);

export const VOCABULARY_AUTHORITY_PATHS = MANIFEST_PATHS;
export const VOCABULARY_AUTHORITY_RESOURCE_SEO = MANIFEST_SEO;

const bySlug = new Map(VOCABULARY_AUTHORITY_PAGES.map((entry) => [entry.slug, entry]));
const byPath = new Map(VOCABULARY_AUTHORITY_PAGES.map((entry) => [entry.path, entry]));

export const getVocabularyAuthorityPageBySlug = (slug) =>
  bySlug.get(String(slug || '')) ?? null;

export const getVocabularyAuthorityPageByPath = (pathname) =>
  byPath.get(String(pathname || '').replace(/\/+$/, '')) ?? null;

if (VOCABULARY_AUTHORITY_PAGES.length !== 6) {
  throw new Error('GV4 must publish exactly six first-batch Vocabulary authority pages.');
}
if (
  VOCABULARY_AUTHORITY_PAGES.length !== VOCABULARY_AUTHORITY_PATHS.length
  || VOCABULARY_AUTHORITY_PAGES.some((entry, index) => entry.path !== VOCABULARY_AUTHORITY_PATHS[index])
) {
  throw new Error('GV4 Vocabulary authority content must stay aligned with the lightweight SEO manifest.');
}
for (const entry of VOCABULARY_AUTHORITY_PAGES) {
  const seo = VOCABULARY_AUTHORITY_RESOURCE_SEO[entry.path];
  if (!seo || seo.title !== entry.seoTitle || seo.description !== entry.seoDescription || seo.canonicalPath !== entry.path) {
    throw new Error(`GV4 Vocabulary authority SEO manifest drift detected for ${entry.path}.`);
  }
}
