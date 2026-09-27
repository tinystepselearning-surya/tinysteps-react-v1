import { VOCABULARY_AUTHORITY_ROUTE_MANIFEST, VOCABULARY_RESOURCE_SEO } from './vocabularyAuthoritySeoManifest.js';
import { getVocabularyKnowledgeSources } from './vocabularyKnowledgeSources.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);

const page = (config) => {
  const sources = getVocabularyKnowledgeSources(config.sourceIds);
  if (sources.length < 2) {
    throw new Error(`Published Vocabulary authority page ${config.id} requires at least two authoritative references.`);
  }

  return freeze({
    state: 'published',
    publicationApproved: true,
    publicationBatch: config.publicationBatch || 'gv4-first-authority-batch',
    hubPath: '/resources/vocabulary',
    practicePath: '/free-games/word-meaning-flashcards',
    ...config,
    path: `/resources/vocabulary/${config.slug}`,
    sourceIds: freezeList(config.sourceIds),
    sources,
    coreIdeas: freezeList(config.coreIdeas),
    workedExamples: freezeList(config.workedExamples.map((item) => freeze({ ...item }))),
    examples: freezeList(config.examples),
    commonMistakes: freezeList(config.commonMistakes),
    trickyCases: freezeList(config.trickyCases),
    practicePrompts: freezeList(config.practicePrompts),
    faqs: freezeList(config.faqs.map((item) => freeze({ ...item }))),
    relatedPaths: freezeList(config.relatedPaths),
    featuredWordIds: freezeList(config.featuredWordIds || []),
  });
};

export const VOCABULARY_AUTHORITY_REVISION = '2026-09-27-gv5b';

export const VOCABULARY_AUTHORITY_PAGES = freezeList([
  page({
    order: 1,
    id: 'everyday-vocabulary',
    stageId: 'everyday-foundations',
    slug: 'everyday-vocabulary-for-kids',
    cardTitle: 'Everyday Vocabulary for Kids',
    seoTitle: 'Everyday Vocabulary for Kids: Useful Words for Daily Life | Tiny Steps',
    seoDescription: 'Build useful everyday vocabulary through familiar objects, routines, people and places, then practise meaning, context and independent use.',
    quickAnswer: 'Everyday vocabulary is the high-frequency language children need to understand and talk about familiar people, objects, places, routines and actions. Strong everyday vocabulary is not just a list of labels: a child should know what a word means, recognise it in context, say or read it accurately, and use it independently in a relevant sentence.',
    concept: 'A useful everyday-vocabulary system groups words by meaning and real-life use rather than asking children to memorise disconnected lists. Familiar domains such as home, school, routines, objects, food, places and movement give children repeated opportunities to connect a word to an experience, an image, a sentence and a speaking or writing purpose.',
    whyItMatters: 'Children rely on everyday words to follow instructions, understand simple texts, answer questions and describe what happens around them. Limited vocabulary can make a child appear to have a reading, speaking or comprehension problem even when the deeper issue is that too many words in the message are unfamiliar. Building a broad base of high-frequency words therefore supports comprehension and communication across subjects.',
    coreIdeas: [
      'Teach meaning in a useful category, then immediately connect the word to a sentence. A child who learns bottle should also hear and produce language such as “Fill the bottle with water” or “My bottle is in my school bag.” Categorisation helps memory, while sentence use prevents the word from remaining an isolated label that disappears outside a flashcard activity.',
      'Revisit the same word through several forms of retrieval. A child can identify the word from a picture, choose it from a short definition, explain it in simple language, find it in a sentence and use it while speaking. Repeated retrieval should vary the task enough that the child recalls the meaning rather than memorising the position of an answer.',
      'Move gradually from concrete vocabulary into more precise choices. Once a child comfortably uses broad words such as thing, place, go and nice, introduce useful alternatives that fit familiar situations. The goal is not unusually advanced vocabulary; it is a larger set of words the child can retrieve accurately when reading, speaking and writing.',
    ],
    workedExamples: [
      {
        example: 'Word: market — “We bought fruit at the market.”',
        explanation: 'The sentence connects the place word market to a familiar purpose: buying things. A follow-up question such as “What might you buy at a market?” requires the child to retrieve the meaning rather than repeat the original sentence.',
      },
      {
        example: 'Word: blanket — “I pulled the warm blanket over my legs.”',
        explanation: 'The noun is learned with an action and a descriptive detail. The child can then contrast blanket with nearby words such as sheet, towel or jacket. This makes the meaning more precise than simply pointing at a picture and saying the label once.',
      },
      {
        example: 'Word: morning — “I pack my bag in the morning before school.”',
        explanation: 'Time vocabulary becomes more useful when linked to routines. The child can place morning beside afternoon and evening, sequence several actions, and use the word in an original sentence about a real habit.',
      },
    ],
    examples: [
      'Home: kitchen, window, blanket, bottle',
      'People and routines: family, neighbour, morning, teacher',
      'Places: market, garden, street, library',
    ],
    commonMistakes: [
      'Teaching long themed lists without returning to the words later, which can create short-term recognition but weak independent recall.',
      'Accepting a memorised definition as full word knowledge even when the child cannot understand the word in a new sentence or use it while speaking.',
      'Introducing many unusual synonyms too early instead of securing a useful high-frequency word and then adding more precise alternatives gradually.',
    ],
    trickyCases: [
      'Some everyday words have several meanings. A light can be something that shines, while light can also describe weight or colour. Teach the most relevant child-friendly meaning first, then add another meaning when context makes the contrast clear.',
      'A child may understand a word receptively but not retrieve it in speech. Recognition and independent production are different levels of knowledge. Give a short cue, allow thinking time and ask for original use before deciding the word is fully secure.',
    ],
    teachingNote: 'Choose ten to fifteen useful words from one familiar domain and spread them across several days. Use pictures or real objects when helpful, but always add a sentence and a question. Mix old and new words rather than practising one set only once. At home, brief retrieval is enough: “Which word means the room where we cook?” followed by “Tell me one thing you do in the kitchen.” Keep the focus on useful meaning and use, not spelling tests alone.',
    practicePrompts: [
      'Sort twelve familiar words into home, school, people, places, routines or objects, then explain one choice from each group.',
      'Choose five everyday words and create a new sentence for each one that makes the meaning clear without giving a dictionary-style definition.',
      'Play the Vocabulary Adventure, then select three words from the game and use them in a short description of a real morning, school day or trip outside.',
    ],
    faqs: [
      {
        question: 'How many everyday vocabulary words should a child learn at once?',
        answer: 'A small set that can be revisited deeply is usually more useful than a very long list. The child should have enough repetition to understand, retrieve and use the words in new contexts. The right number depends on age and prior knowledge, so progress should be judged by independent use rather than by completing a fixed weekly quota.',
      },
      {
        question: 'Should everyday vocabulary be taught with pictures?',
        answer: 'Pictures and real objects are useful for concrete words, especially for younger learners, but they should not be the only support. Add a short definition, a sentence and a question so the child learns how the word behaves in language. Gradually remove the picture and ask the child to retrieve the word from meaning or context.',
      },
    ],
    sourceIds: ['british-council-vocabulary-a1-a2', 'british-council-everyday-objects', 'ies-foundational-vocabulary'],
    relatedPaths: ['/free-games/word-meaning-flashcards', '/reading-classes-for-kids', '/spoken-english-classes-for-kids-online'],
    featuredWordIds: ['family', 'garden', 'market', 'bottle', 'window', 'kitchen', 'blanket', 'street', 'neighbour', 'morning'],
  }),

  page({
    order: 3,
    id: 'feelings-emotions',
    stageId: 'everyday-foundations',
    slug: 'feelings-emotions-for-kids',
    cardTitle: 'Feelings & Emotions Vocabulary',
    seoTitle: 'Feelings and Emotions Vocabulary for Kids | Tiny Steps',
    seoDescription: 'Help children move beyond happy, sad and angry by learning precise emotion words, intensity, context and natural sentence use.',
    quickAnswer: 'Feelings and emotions vocabulary helps children name internal states more precisely than using only happy, sad, good or bad. Useful emotion knowledge includes the word meaning, how strong the feeling is, what situations can cause it, and the natural language patterns used to explain the feeling.',
    concept: 'Emotion vocabulary grows best through meaningful contrasts. A child can compare calm with excited, scared with nervous, proud with happy, or bored with tired. These words overlap in some situations but are not interchangeable. Context, intensity and cause help children choose the word that best matches what a person is experiencing.',
    whyItMatters: 'Precise emotion words improve comprehension, storytelling, conversation and self-expression. In reading, children need emotion vocabulary to understand characters whose feelings are implied rather than directly named. In speaking and writing, a richer emotional vocabulary helps children explain reactions and reasons instead of relying on one broad word for many different experiences.',
    coreIdeas: [
      'Teach emotion words with causes and situations, not only facial expressions. A surprised face and an excited face can look similar, but the cause differs. Ask what happened before the feeling and what the person might do next. This helps the child connect the word to meaning rather than memorising one picture.',
      'Build simple intensity scales. Calm, pleased, happy and excited do not form a perfect scientific scale, but comparing milder and stronger reactions helps children notice that words carry different strength. Similar work can distinguish worried, nervous, scared and terrified without claiming the words are exact substitutes.',
      'Teach natural patterns around feeling adjectives. Children need language such as “proud of my work”, “excited about the trip”, “scared of thunder” and “angry about the decision”. Learning a word with a common pattern makes it easier to use accurately in spontaneous speaking and writing.',
    ],
    workedExamples: [
      {
        example: '“Mina checked her project twice before the presentation. She felt nervous.”',
        explanation: 'Nervous fits because Mina is anticipating an uncertain event and is worried about how it will go. Excited could also be possible in a different context, so the child should use evidence from the sentence rather than treating one situation as having only one imaginable emotion.',
      },
      {
        example: '“Arun finished a difficult book by himself and felt proud of his progress.”',
        explanation: 'Proud describes satisfaction connected to an achievement or someone we value. The phrase proud of is a useful language pattern. Asking “What did Arun do that made him proud?” keeps the vocabulary tied to cause and evidence.',
      },
      {
        example: '“The long delay gave Leela nothing to do, so she became bored.”',
        explanation: 'Bored means lacking interest or useful engagement, which is different from tired. A child may be both, but the sentence specifically points to having nothing engaging to do. Contrasting nearby words strengthens precise selection.',
      },
    ],
    examples: [
      'calm ↔ excited: different levels of activation',
      'bored ≠ tired: lack of interest is not the same as needing rest',
      'proud of · excited about · scared of · angry about',
    ],
    commonMistakes: [
      'Treating all positive feelings as synonyms for happy and all uncomfortable feelings as synonyms for sad.',
      'Teaching emotion faces without discussing cause, context or what the character may be thinking, which can produce shallow picture matching.',
      'Using a new feeling adjective without its common preposition pattern, leading to unnatural combinations such as proud for my work in contexts where proud of is expected.',
    ],
    trickyCases: [
      'A person can feel more than one emotion at once. A child might be excited and nervous before a performance. Vocabulary teaching should allow mixed emotions rather than forcing every scenario into one correct label when the evidence supports several possibilities.',
      'Emotion words can vary by degree and context. Scared, afraid and frightened overlap strongly, while nervous often relates to anticipation. Teach the central meaning and common use before discussing subtle stylistic differences.',
    ],
    teachingNote: 'Use short scenarios from everyday life and stories. Ask the child to choose an emotion word, point to evidence, and explain why another nearby word is weaker or stronger. Keep a small bank of useful words visible during speaking or story writing, then remove the support later. Encourage sentence frames at first—“She felt ___ because ___”—but quickly move to varied original sentences so the child does not depend on one pattern.',
    practicePrompts: [
      'Place calm, worried, nervous, scared and terrified on a rough intensity line, then explain why two neighbouring words are not exactly the same.',
      'Read six short situations and choose the most precise emotion word for each one, giving one piece of evidence from the situation.',
      'Choose three feeling words from the Vocabulary Adventure and use each in a sentence that includes the cause of the feeling.',
    ],
    faqs: [
      {
        question: 'Are synonyms such as scared and afraid exactly the same?',
        answer: 'They can overlap strongly, but synonyms are rarely interchangeable in every context. Children should learn the shared central meaning first and then notice common patterns, tone and intensity through sentences. The goal is useful precision, not forcing a completely separate definition for every near-synonym.',
      },
      {
        question: 'How can emotion vocabulary help reading comprehension?',
        answer: 'Stories often imply feelings through actions, thoughts and events. When children know a wider range of emotion words, they can infer why a character behaves in a certain way and describe the change more precisely. Ask for evidence from the text so emotion vocabulary becomes part of comprehension rather than a separate word list.',
      },
    ],
    sourceIds: ['british-council-feelings-adjectives', 'british-council-vocabulary-a1-a2', 'ies-foundational-vocabulary'],
    relatedPaths: ['/free-games/word-meaning-flashcards', '/spoken-english-classes-for-kids-online', '/writing-classes-for-kids'],
    featuredWordIds: ['happy', 'sad', 'angry', 'tired', 'excited', 'scared', 'proud', 'bored', 'calm', 'surprised'],
  }),

  page({
    order: 5,
    id: 'school-vocabulary',
    stageId: 'everyday-foundations',
    slug: 'school-vocabulary-for-kids',
    cardTitle: 'School Vocabulary for Kids',
    seoTitle: 'School Vocabulary for Kids: Classroom Words & Learning Language | Tiny Steps',
    seoDescription: 'Teach useful school vocabulary for classroom objects, instructions, learning actions, subjects and everyday school communication.',
    quickAnswer: 'School vocabulary includes the words children need to understand classroom objects, people, instructions, learning actions and school routines. Knowing pencil, notebook and classroom is useful, but strong school vocabulary also means understanding verbs such as explain, compare, practise and answer and using those words while following instructions or talking about learning.',
    concept: 'School language includes concrete labels and more abstract academic actions. Young learners first need familiar nouns for places and objects, but classroom success increasingly depends on words that tell them what to do with information: identify, describe, explain, compare, choose, check, revise and summarise. Vocabulary teaching should therefore move beyond naming objects.',
    whyItMatters: 'A child can understand the lesson topic but still struggle because an instruction word is unclear. If compare, explain or underline is unfamiliar, the child may appear inattentive or unable to complete the task. Building school vocabulary supports independence, listening comprehension, reading instructions and the ability to talk about what was learned.',
    coreIdeas: [
      'Teach classroom nouns together with their functions. A notebook is not only an object to name; it is where a child may write notes or answers. A library is a place where books and other resources are organised for reading or study. Connecting each word to a purpose creates stronger, more flexible knowledge.',
      'Give special attention to instructional verbs. Words such as circle, underline, choose, match, describe, compare and explain control what a task requires. Demonstrate the action, use it in several subjects and then ask the child to explain the instruction in simpler language. This turns vocabulary into academic independence.',
      'Build networks around one school event. A lesson may include a teacher, classroom, question, answer, notebook, practice and homework. Linking the words in a short sequence or retell is more powerful than memorising each one on a separate card because the child sees how the vocabulary works together in real communication.',
    ],
    workedExamples: [
      {
        example: 'Instruction: “Compare the two pictures and explain one difference.”',
        explanation: 'The child needs two academic action words: compare means examine similarities or differences, while explain means give understandable information or reasons. If either verb is unknown, content knowledge alone will not be enough to follow the task.',
      },
      {
        example: '“I wrote my answer in my notebook after the teacher explained the question.”',
        explanation: 'The sentence connects four familiar school words through a realistic event. The child can retell the sequence, substitute a different subject or object, and show understanding of both the nouns and the action explained.',
      },
      {
        example: '“We went to the library to find a book for our science project.”',
        explanation: 'Library is learned through its function rather than as a room label only. A follow-up prompt such as “What might you do in a library?” checks whether the child can generalise the meaning to a fresh context.',
      },
    ],
    examples: [
      'Objects: pencil, notebook, book, ruler',
      'People and places: teacher, student, classroom, library',
      'Learning actions: read, write, answer, practise, explain, compare',
    ],
    commonMistakes: [
      'Teaching only classroom object names and assuming that is enough vocabulary for independent participation in lessons.',
      'Giving complex instructions before checking whether the child understands the academic action words that define the task.',
      'Testing school vocabulary only through spelling or matching rather than asking the child to follow, explain or produce a real classroom instruction.',
    ],
    trickyCases: [
      'Some school words change meaning by context. Subject can mean a school area such as science or the grammatical subject of a sentence. Children should use the surrounding lesson context to select the intended meaning.',
      'Practice and practise differ in spelling across varieties of English when used as noun and verb. Tiny Steps should use one consistent classroom convention while recognising that children may encounter valid regional alternatives.',
    ],
    teachingNote: 'Start with the language children actually meet in their schoolwork. Collect common instruction verbs from worksheets and lessons, then teach them with demonstration and short examples. Use a “say it another way” routine: “Compare these means look at both and tell how they are similar or different.” Recycle the same academic verb in reading, grammar, science and speaking tasks so the child learns a transferable instruction word rather than a subject-specific cue.',
    practicePrompts: [
      'Match eight classroom instruction verbs to actions, then restate each instruction in simpler words.',
      'Use six school vocabulary words to describe what happens during one lesson from beginning to end.',
      'Play the Vocabulary Adventure school-word challenges, then create two new classroom sentences using words from the game.',
    ],
    faqs: [
      {
        question: 'What school vocabulary is most important for children?',
        answer: 'Begin with words the child meets repeatedly: classroom people and objects, common places, routine words and high-frequency instruction verbs. As the child grows, add academic words that appear across subjects, such as compare, describe, explain, evidence and result. Frequency and usefulness matter more than collecting unusually advanced terms.',
      },
      {
        question: 'Why does my child understand English conversation but struggle with school instructions?',
        answer: 'Conversational vocabulary and academic task language overlap, but they are not identical. A child may speak comfortably about familiar topics yet not know what summarise, classify or justify requires. Teach the instruction word explicitly, demonstrate the action and reuse it across different tasks so the meaning becomes independent of one worksheet.',
      },
    ],
    sourceIds: ['british-council-school-vocabulary', 'british-council-vocabulary-a1-a2', 'ies-academic-vocabulary'],
    relatedPaths: ['/free-games/word-meaning-flashcards', '/spoken-english-classes-for-kids-online', '/reading-classes-for-kids'],
    featuredWordIds: ['pencil', 'teacher', 'classroom', 'lesson', 'homework', 'notebook', 'question', 'answer', 'library', 'practice'],
  }),

  page({
    order: 9,
    id: 'synonyms-antonyms',
    stageId: 'word-relationships',
    slug: 'synonyms-antonyms-for-kids',
    cardTitle: 'Synonyms & Antonyms for Kids',
    seoTitle: 'Synonyms and Antonyms for Kids: Meaning, Contrast & Word Choice | Tiny Steps',
    seoDescription: 'Teach similar and opposite meanings without treating every synonym as interchangeable, using context and shades of meaning.',
    quickAnswer: 'Synonyms are words with the same or similar meanings in at least some contexts, while antonyms express contrasting or opposite meanings. Children should learn these relationships through sentences because two synonyms are rarely interchangeable everywhere, and the best antonym often depends on which meaning of the word is being used.',
    concept: 'Word relationships help children organise vocabulary instead of storing every word separately. A known word can become an anchor for a new one: large relates to big, quick relates to fast, and slow contrasts with fast. The important next step is context—children need to see where the relationship holds, how intensity differs and when a different word would sound more natural.',
    whyItMatters: 'Synonym and antonym knowledge supports comprehension, precise writing and flexible speaking. It also helps children infer unfamiliar words when a text provides contrast or restatement. However, teaching synonyms as simple equals signs can create awkward word choice. Good instruction combines relationship, sentence meaning, tone and strength.',
    coreIdeas: [
      'Treat synonyms as meaning neighbours rather than perfect replacements. Big and large overlap in many contexts, but a big mistake sounds natural where a large mistake may sound less typical. Happy and joyful overlap, but joyful often carries stronger or more expressive tone. Ask whether the replacement still sounds natural and keeps the intended meaning.',
      'Teach antonyms around a specific sense of the word. The opposite of light could be heavy when discussing weight, dark when discussing brightness, or serious in some uses of light-hearted. A child should identify the meaning in the sentence before selecting an opposite instead of memorising one permanent antonym pair.',
      'Use shades-of-meaning tasks to build precision. Arrange words such as warm, hot and boiling or pleased, happy and delighted by approximate intensity. The sequence may depend on context, so the useful learning comes from explaining the differences, not from claiming that every set has one rigid universal order.',
    ],
    workedExamples: [
      {
        example: 'fast → quick: “The rabbit is fast.” / “She gave a quick answer.”',
        explanation: 'Fast and quick share the idea of speed, but their most natural uses differ. Replacing one with the other may work in some sentences and sound unusual in others. The child learns the shared meaning plus collocational preference.',
      },
      {
        example: 'clean ↔ dirty: “The table is clean now, but it was dirty after lunch.”',
        explanation: 'The sentence establishes a straightforward contrast in condition. Using both words in one context strengthens the relationship and allows the child to explain what changed rather than memorising two isolated labels.',
      },
      {
        example: 'light: “This bag is light.” → heavy; “The room is light.” → dark',
        explanation: 'The spelling is the same, but the intended meaning is different. The appropriate antonym changes with the sense. This example teaches children to use context before choosing a word relationship.',
      },
    ],
    examples: [
      'big ~ large; fast ~ quick; calm ~ peaceful',
      'clean ↔ dirty; fast ↔ slow; open ↔ closed',
      'pleased → happy → delighted: increasing positive intensity in many contexts',
    ],
    commonMistakes: [
      'Assuming every synonym can replace the original word without changing tone, grammar pattern or natural word combinations.',
      'Memorising one antonym for a multiple-meaning word and using it even when the sentence activates a different meaning.',
      'Choosing the most unusual synonym to make writing sound advanced instead of selecting the word that expresses the intended meaning clearly.',
    ],
    trickyCases: [
      'Some opposites are gradable, such as hot and cold, with many positions between them. Others are more complementary in ordinary use, such as alive and dead. Children do not need formal semantic terminology, but they should notice that “opposite” relationships are not all built in the same way.',
      'A thesaurus suggests related words, not guaranteed replacements. Children should check the definition and sentence use before substituting a word in writing, especially when they encounter a new synonym they have never used before.',
    ],
    teachingNote: 'Start from a word the child already knows and build a small relationship map around it. Compare two or three synonyms in complete sentences and ask which is best for the situation. For antonyms, give enough context to make the intended meaning clear. During writing revision, ask “Is there a more precise word?” rather than “Can you use a harder synonym?” This protects meaning while expanding vocabulary.',
    practicePrompts: [
      'Replace one word in six sentences with a synonym, then decide whether the new sentence sounds equally natural and explain any change in tone.',
      'Find the intended meaning of a multiple-meaning word in four sentences and choose an antonym that fits that specific meaning.',
      'Use the Vocabulary Adventure synonym and antonym challenges, then create one fresh sentence for each relationship you practised.',
    ],
    faqs: [
      {
        question: 'Are synonyms words that mean exactly the same thing?',
        answer: 'Usually they share a central meaning but differ in strength, tone, grammar pattern or typical context. That is why children should learn synonyms in sentences and check whether a replacement remains natural. Treating synonym as “similar meaning” is more useful than teaching that two words are always identical.',
      },
      {
        question: 'Why can one word have different antonyms?',
        answer: 'Many English words have multiple meanings. The opposite must match the meaning active in the sentence. Light can contrast with heavy for weight and dark for brightness. Context therefore comes before the antonym choice.',
      },
    ],
    sourceIds: ['cambridge-thesaurus-antonym', 'british-council-vocabulary-overview', 'ies-foundational-vocabulary'],
    relatedPaths: ['/free-games/word-meaning-flashcards', '/writing-classes-for-kids', '/resources/vocabulary/context-clues-for-kids'],
    featuredWordIds: ['happy', 'calm', 'big', 'bright', 'clean', 'fast', 'open'],
  }),

  page({
    order: 12,
    id: 'context-clues',
    stageId: 'vocabulary-in-context',
    slug: 'context-clues-for-kids',
    cardTitle: 'Context Clues for Kids',
    seoTitle: 'Context Clues for Kids: Work Out Unknown Word Meanings | Tiny Steps',
    seoDescription: 'Teach children how to reread, notice clues, infer a possible meaning and check whether it makes sense in the sentence or passage.',
    quickAnswer: 'Context clues are useful information around an unfamiliar word that can help a reader infer its likely meaning. A reliable routine is to notice the unknown word, reread the sentence and nearby sentences, identify useful clues, propose a meaning, and then check whether that meaning makes sense in the whole passage.',
    concept: 'Context is evidence, not magic. Sometimes a sentence gives a direct definition or example, but often the reader must combine several clues with existing knowledge. In other cases, the text does not provide enough information to know the exact meaning. Children should learn to make a reasonable hypothesis and verify it rather than guess from one nearby word.',
    whyItMatters: 'Independent readers constantly meet unfamiliar vocabulary. Stopping for a dictionary after every unknown word can interrupt comprehension, while guessing without evidence can distort the text. Context-clue strategies give children a middle path: use the text to narrow the meaning, continue reading, then confirm with a dictionary, teacher or another source when precision matters.',
    coreIdeas: [
      'Teach a consistent multi-step routine: mark the unfamiliar word, reread the sentence, read before and after it, look for definitions, examples, contrasts or cause-and-effect information, then state a possible meaning in simple words. Finally replace the unknown word with the proposed meaning and ask whether the passage still makes sense.',
      'Separate strong clues from weak associations. In “The path was treacherous; loose stones made every step dangerous,” dangerous is strong evidence about treacherous. A nearby word such as mountain might be related to the setting but does not itself explain the meaning. Children should point to the clue that actually supports the inference.',
      'Allow “not enough information” as a valid answer. Some passages reveal only a broad category or emotional tone. A strong reader can say, “I think it means something negative about the weather, but I cannot tell the exact meaning yet.” This is better comprehension behaviour than inventing a precise definition from insufficient evidence.',
    ],
    workedExamples: [
      {
        example: '“The puppy was famished, so it ate the food in seconds and looked for more.”',
        explanation: 'The rapid eating and search for more food suggest that famished means very hungry. The clue is behavioural evidence across the sentence, not a direct definition. Replacing famished with very hungry preserves the meaning.',
      },
      {
        example: '“Unlike the noisy playground, the library was tranquil and quiet.”',
        explanation: 'The contrast marker unlike and the nearby word quiet strongly suggest that tranquil means calm or peaceful. The reader uses both contrast and restatement rather than choosing a meaning from sound or spelling.',
      },
      {
        example: '“The instrument was fragile, so we carried it carefully in a padded case.”',
        explanation: 'Careful handling and a padded case indicate that fragile describes something easily damaged or broken. The clue is the protective action caused by the object’s property.',
      },
    ],
    examples: [
      'Definition clue: “A habitat, the natural home of a plant or animal, can change.”',
      'Contrast clue: “Ravi was reluctant, but his sister was eager to begin.”',
      'Example clue: “Nocturnal animals, such as bats and many owls, are active at night.”',
    ],
    commonMistakes: [
      'Guessing from the first familiar word near the unknown word without rereading the whole sentence or nearby context.',
      'Assuming context always reveals an exact dictionary definition when the passage may support only an approximate meaning.',
      'Stopping after making a guess and never checking whether the proposed meaning fits grammatically and logically in the sentence.',
    ],
    trickyCases: [
      'Morphology and context can work together. A prefix or suffix may suggest part of the meaning, while the sentence confirms which interpretation is sensible. Children should combine clues rather than treat context and word parts as competing strategies.',
      'Background knowledge can help interpretation, but it can also pull the reader toward an assumption the text does not support. Ask children to separate “what I already know” from “what this sentence tells me” and then use both responsibly.',
    ],
    teachingNote: 'Model the reasoning aloud before asking children to perform it independently. Say which words are clues and why they matter. Gradually remove prompts until the child can use the sequence: reread → find evidence → propose meaning → check. Use short sentences first, then paragraphs where clues are spread across more than one sentence. When context is weak, explicitly model checking a dictionary instead of rewarding unsupported guessing.',
    practicePrompts: [
      'Underline the unknown word in five sentences, circle the strongest clue, and write a short possible meaning in your own words.',
      'For three passages, decide whether the context gives an exact meaning, an approximate meaning or not enough information, and justify the choice.',
      'Use the Vocabulary Adventure context challenges, then write one new sentence containing an unfamiliar-looking word with enough clues for another person to infer its meaning.',
    ],
    faqs: [
      {
        question: 'What are the main types of context clues?',
        answer: 'Useful classroom categories include direct definitions, restatements or synonyms, examples, contrasts, and cause-and-effect information. These labels can help children notice evidence, but the goal is not memorising a list of clue types. The goal is using whatever information the text actually provides to build and check a plausible meaning.',
      },
      {
        question: 'Should children always use context instead of a dictionary?',
        answer: 'No. Context helps readers make a first inference and maintain comprehension, but some passages do not provide enough information for precision. A dictionary, glossary, teacher or other reliable source is appropriate when the exact meaning matters or when the context remains ambiguous.',
      },
    ],
    sourceIds: ['ies-context-clues', 'ies-reading-interventions', 'british-council-vocabulary-overview'],
    relatedPaths: ['/free-games/word-meaning-flashcards', '/reading-classes-for-kids', '/resources/vocabulary/synonyms-antonyms-for-kids'],
    featuredWordIds: ['calm', 'surprised', 'bright', 'library', 'market'],
  }),

  page({
    order: 11,
    id: 'word-families-prefixes-suffixes',
    stageId: 'word-building',
    slug: 'word-families-prefixes-suffixes-for-kids',
    cardTitle: 'Word Families, Prefixes & Suffixes',
    seoTitle: 'Word Families, Prefixes and Suffixes for Kids | Tiny Steps',
    seoDescription: 'Build vocabulary through base words, prefixes, suffixes and related word families while connecting changes in form to changes in meaning.',
    quickAnswer: 'Word families connect related words built from a shared base, while prefixes are added before a base and suffixes are added after it. Learning common word parts can help children infer meaning, recognise relationships between words and build new vocabulary, but the meaning of the complete word must still be checked in context.',
    concept: 'Morphology gives children another route into unfamiliar vocabulary. A child who knows help can connect helpful, helpless and helper; a child who knows happy can understand unhappy and happiness more efficiently. These relationships also show that adding a prefix or suffix can change meaning, grammatical role or both.',
    whyItMatters: 'As texts become more advanced, many unfamiliar words are related to words children already know. Recognising a base and a familiar affix reduces the amount of vocabulary that must be learned as completely separate items. Morphology also supports spelling and writing because related words often preserve meaningful patterns even when pronunciation or word class changes.',
    coreIdeas: [
      'Start with a clear base word and build a small family. From teach, children can connect teacher and teaching; from care, they can connect careful, careless and carefully. Ask what stays the same in meaning and what the affix changes. This makes the family a meaning system rather than a spelling puzzle.',
      'Teach high-value affixes with several examples instead of one fixed translation. Un- often signals not or the opposite of, as in unhappy or unusual. Re- often signals again, as in rewrite or reread. Suffixes such as -er, -ful, -less and -ly commonly create predictable relationships, but children should still check the complete word because English contains exceptions and multiple uses.',
      'Notice word-class changes. Help is commonly a verb or noun, helpful is an adjective, and helpfully is an adverb. Word formation therefore supports grammar and vocabulary at the same time. The Vocabulary authority layer owns the meaning growth and word-family use, while Grammar may separately explain structural word-class change in greater detail.',
    ],
    workedExamples: [
      {
        example: 'happy → unhappy → happiness',
        explanation: 'The base happy carries the core idea. The prefix un- reverses the positive state in unhappy, while the suffix -ness forms a noun referring to the state or quality. The spelling also changes from happy to happiness, so children should connect meaning and spelling rather than treating suffix work as simple letter attachment.',
      },
      {
        example: 'read → reread → reader → reading',
        explanation: 'Re- adds the idea of doing the action again, reader names a person who reads, and reading can name the activity or appear in a verb construction. One familiar base produces several useful words with connected meanings and different grammatical jobs.',
      },
      {
        example: 'care → careful → careless → carefully',
        explanation: 'Careful and careless contrast because -ful and -less contribute different meanings. Carefully changes the adjective into an adverb in many sentence patterns. Comparing the family helps children see both semantic relationships and word-class changes.',
      },
    ],
    examples: [
      'un-: unhappy, unfair, unusual',
      're-: reread, rewrite, rebuild',
      '-ful / -less / -er / -ly: helpful, careless, teacher, slowly',
    ],
    commonMistakes: [
      'Assuming a familiar prefix or suffix guarantees the full meaning without checking how the complete word is actually used.',
      'Treating every word that shares letters as one family even when the words are unrelated in modern meaning.',
      'Adding an affix mechanically without adjusting spelling where English requires a change, or without checking whether the resulting word is an accepted form.',
    ],
    trickyCases: [
      'Related words may change spelling or pronunciation. Happy becomes happiness; decide becomes decision. Children should first master transparent families before moving into less obvious relationships that require more explicit teaching.',
      'A string at the beginning or end of a word is not automatically an affix. The re- in return is not taught productively in the same way as re- in reread for young learners. Morphological analysis should be based on real meaning relationships, not visual chopping.',
    ],
    teachingNote: 'Use word matrices or simple family trees with one base in the centre. Add only real, useful words and ask the child to explain how each new word changes the original meaning. Combine morphology with sentence context: after building unhappy, ask for a situation where someone might feel unhappy. Keep spelling and pronunciation notes secondary to the meaning relationship until the family is understood.',
    practicePrompts: [
      'Choose five familiar base words and build two or three real family members for each one, explaining what every prefix or suffix contributes.',
      'Sort a mixed set of words by base, then identify which family member is a noun, verb, adjective or adverb when the distinction is clear.',
      'Read a short paragraph containing two unfamiliar derived words, use the base and affix to predict meaning, then check whether the context confirms the prediction.',
    ],
    faqs: [
      {
        question: 'Are word families only words that rhyme?',
        answer: 'No. In vocabulary and morphology, a useful word family is based on shared meaning and form, such as help, helpful, helpless and helper. Some early phonics activities use “word family” to describe rhyming spelling patterns such as cat, hat and mat. Both uses exist, so Tiny Steps should make the intended meaning explicit.',
      },
      {
        question: 'Should children memorise long lists of prefixes and suffixes?',
        answer: 'It is more useful to learn a smaller set of frequent affixes through several meaningful word families and repeated reading. Children should be able to explain what the affix contributes and use the derived word in context. New affixes can be added gradually as texts introduce them.',
      },
    ],
    sourceIds: ['cambridge-word-formation', 'ies-foundational-vocabulary', 'british-council-vocabulary-overview'],
    relatedPaths: ['/resources/grammar/nouns-for-kids', '/free-spelling-game-for-kids', '/reading-classes-for-kids'],
    featuredWordIds: ['happy', 'read', 'write', 'teacher', 'practice'],
  }),

  page({
    order: 13,
    id: 'vocabulary-collocations',
    stageId: 'natural-english',
    publicationBatch: 'gv5-natural-english-transfer',
    slug: 'collocations-for-kids',
    cardTitle: 'Collocations for Kids',
    seoTitle: 'Collocations for Kids: Natural Word Partnerships | Tiny Steps',
    seoDescription: 'Help children notice and use natural English word partnerships such as make a mistake, heavy rain and deeply interested through meaning, context and repeated use.',
    quickAnswer: 'Collocations are words that regularly occur together in ways that sound natural to experienced English users. Children build stronger vocabulary when they learn useful partnerships such as make a mistake, heavy rain, take a break and deeply interested as connected chunks, while still understanding the meaning of each word and the whole expression.',
    concept: 'Knowing individual words does not automatically tell a learner which combinations are usual in English. A child may know strong and rain but still need to learn that heavy rain is the more typical partnership. Collocation knowledge sits between vocabulary and grammar: the sentence can be grammatically possible yet sound unusual because the chosen words are not normally paired in that context.',
    whyItMatters: 'Natural word partnerships help children understand reading more quickly and produce smoother speaking and writing. When a child retrieves make a decision, ask a question or strong evidence as a familiar unit, less effort is spent assembling every word from scratch. This supports fluency, precision and editing because the child starts noticing not only whether a sentence is correct, but whether the word choice fits normal English usage.',
    coreIdeas: [
      'Teach collocations as meaningful partnerships rather than as isolated pairs to memorise. Start with a useful base word such as decision, homework, rain or interested and collect a few common partners in complete sentences. Ask what the phrase means, where the child might hear it, and whether another combination would sound normal in the same situation. This keeps collocation learning connected to communication.',
      'Contrast natural and unusual combinations carefully. Heavy rain is common, while thick rain is unusual in standard everyday English even though thick and heavy can both describe intensity in other contexts. The goal is not to tell children that language has arbitrary secret rules; it is to help them notice recurring patterns through reading, listening and repeated use.',
      'Build collocations across several patterns: adjective + noun, verb + noun, adverb + adjective and verb + preposition or particle combinations where relevant. Child-friendly examples include strong wind, make progress, deeply worried and interested in. Repeated exposure to several pattern types helps children see that vocabulary knowledge includes relationships between words, not only dictionary meanings.',
    ],
    workedExamples: [
      {
        example: '“We had heavy rain all afternoon.”',
        explanation: 'Heavy rain is a common adjective-and-noun collocation. The child already understands heavy in other meanings, but here it expresses intensity. Comparing heavy rain with strong wind shows that English selects different natural partners for related weather ideas.',
      },
      {
        example: '“I made a mistake in the last sentence, so I corrected it.”',
        explanation: 'Make a mistake is a common verb-and-noun partnership. Learners may be tempted to say do a mistake because do and make overlap in some contexts. Practising the complete phrase inside a meaningful sentence makes retrieval more reliable than memorising a rule alone.',
      },
      {
        example: '“Nila was deeply interested in the science experiment.”',
        explanation: 'Deeply interested is an adverb-and-adjective combination that sounds natural when the interest is strong. The preposition in also belongs to the wider usage pattern. Learning the whole frame gives the child a useful speaking and writing unit rather than one disconnected adjective.',
      },
    ],
    examples: [
      'Adjective + noun: heavy rain, strong wind, close friend',
      'Verb + noun: make a mistake, take a break, ask a question',
      'Adverb + adjective: deeply interested, highly unusual, completely different',
    ],
    commonMistakes: [
      'Choosing a grammatically possible partner by translating directly from another language instead of checking which combination English commonly uses.',
      'Teaching long collocation lists without sentences or situations, which can create short-term recognition but weak spontaneous use.',
      'Treating every frequent pair as a fixed expression. Some collocations are strong and restricted, while others allow many reasonable partners, so children need examples rather than absolute rules.',
    ],
    trickyCases: [
      'Some collocations vary by variety, register or context. A combination that is normal in one form of English may be less common in another. For children, prioritise high-frequency widely understood combinations and avoid presenting minor variation as an error when the meaning is clear and usage is accepted.',
      'A collocation can overlap with grammar or idiom teaching. Interested in has a grammatical pattern, while make a mistake is mainly lexical. Vocabulary teaching should focus on acquiring and retrieving the natural partnership; structural explanations can be added only when they help the child use it accurately.',
    ],
    teachingNote: 'Collect collocations from material the child is already reading or hearing. Write the key word in the centre and add two or three useful partners, then place each partnership into a fresh sentence. Use short contrast tasks such as heavy rain or thick rain, make progress or do progress, and ask the child to explain which sounds familiar. Recycle the same partnerships in speaking and writing over several days. During editing, underline a vague or unusual combination and ask the child to choose the natural partnership rather than simply supplying the answer.',
    practicePrompts: [
      'Match ten base words with natural partners, then use five completed collocations in original sentences about school, home, weather or hobbies.',
      'Read six sentences containing one unusual word partnership each, replace it with a more natural collocation, and explain what clue helped you decide.',
      'Choose four useful collocations from reading or conversation this week, record the whole phrase rather than one word, and reuse each phrase in a different context.',
    ],
    faqs: [
      {
        question: 'Is a collocation the same as an idiom?',
        answer: 'No. A collocation is a frequent or natural word partnership whose overall meaning is usually connected to the meanings of its words, such as heavy rain or make a mistake. An idiom can have a meaning that is difficult to predict from the individual words. Some expressions sit between these categories, so children benefit more from learning useful usage in context than from arguing about labels.',
      },
      {
        question: 'Should children memorise collocation lists?',
        answer: 'Short lists can organise review, but memorisation alone is not enough. Children should meet each partnership in a sentence, retrieve it after a delay, compare it with nearby alternatives and use it in speaking or writing. A small number of reusable collocations learned deeply is more valuable than a very long list that never transfers into communication.',
      },
    ],
    sourceIds: ['cambridge-collocation', 'british-council-vocabulary-b1-b2', 'british-council-vocabulary-overview'],
    relatedPaths: ['/resources/vocabulary/context-clues-for-kids', '/writing-classes-for-kids', '/spoken-english-classes-for-kids-online'],
    featuredWordIds: [],
  }),

  page({
    order: 14,
    id: 'phrasal-verbs-expressions',
    stageId: 'natural-english',
    publicationBatch: 'gv5-natural-english-transfer',
    slug: 'phrasal-verbs-common-expressions-for-kids',
    cardTitle: 'Phrasal Verbs & Common Expressions',
    seoTitle: 'Phrasal Verbs and Common Expressions for Kids | Tiny Steps',
    seoDescription: 'Teach useful phrasal verbs and everyday expressions through context, meaning, word order and child-relevant speaking situations.',
    quickAnswer: 'Phrasal verbs combine a verb with one or more small words such as up, out, off or after, and the combined meaning may differ from the basic verb. Children learn them best as useful expressions in context, for example wake up, put away, find out and look after, with attention to meaning and word order rather than by memorising hundreds of disconnected combinations.',
    concept: 'Multi-word expressions are a major part of natural English. Some phrasal verbs are transparent, such as sit down, while others are less predictable, such as find out meaning discover. Common expressions may also include recurring chunks that children hear in conversation. Vocabulary teaching should prioritise high-frequency child-relevant meanings and show how the whole expression behaves inside a sentence.',
    whyItMatters: 'Children encounter phrasal verbs constantly in stories, classroom instructions and conversation. If they process only the main verb, they can misunderstand the sentence: pick up, give up and look up do not simply repeat the meanings of pick, give and look. Learning common multi-word expressions improves listening, reading and conversational fluency and gives children more natural alternatives for everyday speaking.',
    coreIdeas: [
      'Teach one phrasal verb with one useful meaning first. Many phrasal verbs have several meanings, so presenting every dictionary sense at once can overload the learner. For look up, a child may first learn “search for information” in a sentence such as “Look up the word in a dictionary.” Other meanings can be added later when context makes them useful.',
      'Show the expression inside a complete situation. Put away becomes memorable when a teacher says, “Please put away your books before lunch.” Look after becomes clear when a child explains, “I look after my little brother for ten minutes while Mum is nearby.” Meaning, situation and natural sentence pattern should be learned together.',
      'Notice word order where it matters. Some phrasal verbs can be separated with a noun object, while pronouns may require a particular position, as in “pick the book up” and “pick it up.” Other multi-word verbs remain together, as in “look after the dog.” Children do not need dense terminology, but they do need accurate models and repeated examples.',
    ],
    workedExamples: [
      {
        example: '“Please put your pencils away when the activity ends.”',
        explanation: 'Put away means place something where it belongs after use. The object appears between the verb and particle here. The child can compare “put the pencils away” with “put them away” and practise the expression as a classroom routine.',
      },
      {
        example: '“We found out why the plant was bending toward the window.”',
        explanation: 'Find out means discover or learn information. The meaning is not simply the basic meaning of find. A follow-up task can replace found out with discovered and discuss which version sounds more natural in everyday conversation.',
      },
      {
        example: '“Can you look after my bag while I fill my water bottle?”',
        explanation: 'Look after means take care of or keep watch over something. The words remain together before the object in this pattern. The whole expression should be retrieved as one useful unit rather than translated word by word.',
      },
    ],
    examples: [
      'Daily routines: wake up, get dressed, put away',
      'Learning and discovery: find out, look up, work out',
      'Responsibility and interaction: look after, help out, calm down',
    ],
    commonMistakes: [
      'Trying to guess every phrasal verb by combining the literal meanings of its parts, even when the expression has developed a different meaning.',
      'Learning a translation without a sentence pattern, which can lead to incorrect object placement or missing prepositions and particles.',
      'Studying too many low-frequency phrasal verbs at once instead of selecting a small set that the child is likely to hear and use repeatedly.',
    ],
    trickyCases: [
      'The same phrasal verb can have several meanings. Pick up can mean lift something, collect someone, learn something informally or improve depending on context. Teach the most relevant meaning first and use surrounding words to decide which meaning is active.',
      'Not every verb followed by a preposition or particle behaves the same way. Listen to, look after and pick up have different structural patterns. Vocabulary instruction should model correct use, while detailed grammar classification can remain a separate reference topic.',
    ],
    teachingNote: 'Select five or six expressions from the child’s real reading, classroom language or conversation. Create a short scenario for each, act out concrete examples where possible, and ask the child to paraphrase the meaning in simple words. Revisit the expressions in mixed practice so the child must choose from context. When word order matters, compare two correct models and one incorrect model, but keep the main focus on understanding and using the expression naturally.',
    practicePrompts: [
      'Choose the correct expression for eight short situations using a set such as wake up, put away, find out, look up, look after and calm down, then explain the meaning in your own words.',
      'Rewrite five sentences by replacing a longer explanation with a suitable phrasal verb, making sure the object appears in the correct place.',
      'Keep a one-week expression notebook: record the whole phrase, the sentence where you noticed it, a child-friendly meaning and one new sentence of your own.',
    ],
    faqs: [
      {
        question: 'How many phrasal verbs should a child learn?',
        answer: 'There is no useful fixed total for every age. Start with a small set that appears often in the child’s books, classroom instructions and conversations. A phrasal verb is worth keeping when the child can understand it in a new context and use it without depending on the original example. Add new expressions gradually instead of chasing a large list.',
      },
      {
        question: 'Why are phrasal verbs difficult for learners?',
        answer: 'The small particle can change the verb’s meaning, one expression may have several meanings, and word order is not identical across all multi-word verbs. Context and repeated sentence use therefore matter. Children should learn the expression as a meaningful unit while still noticing the structure required for accurate use.',
      },
    ],
    sourceIds: ['cambridge-phrasal-verbs', 'british-council-phrasal-verbs', 'british-council-vocabulary-b1-b2'],
    relatedPaths: ['/resources/vocabulary/context-clues-for-kids', '/spoken-english-classes-for-kids-online', '/writing-classes-for-kids'],
    featuredWordIds: [],
  }),

  page({
    order: 15,
    id: 'vocabulary-for-writing',
    stageId: 'transfer-speaking-writing',
    publicationBatch: 'gv5-natural-english-transfer',
    slug: 'vocabulary-for-better-writing',
    cardTitle: 'Vocabulary for Better Writing',
    seoTitle: 'Vocabulary for Better Writing: Precise Word Choice for Kids | Tiny Steps',
    seoDescription: 'Help children replace vague or repeated wording with precise, natural vocabulary that improves descriptions, explanations, stories and school answers.',
    quickAnswer: 'Better writing vocabulary means choosing words that express the intended idea clearly and precisely, not simply replacing ordinary words with the longest synonym available. Children improve when they build useful word banks, compare shades of meaning, learn natural word partnerships and practise retrieving those words while planning, drafting and revising real sentences.',
    concept: 'Writing places different demands on vocabulary than recognition exercises. A child may understand enormous, exhausted or whispered while reading yet still write big, tired and said because those familiar words are easier to retrieve. Transfer requires deliberate retrieval, sentence-level practice and opportunities to revise vague or repeated wording without making the writing unnatural.',
    whyItMatters: 'Precise vocabulary improves clarity, description and explanation across stories, paragraphs and school answers. It can help a child distinguish a glance from a stare, a narrow path from a dangerous path, or a conclusion from a guess. Strong vocabulary also reduces repetition, but variety should serve meaning. The goal is clear communication, not decorating every sentence with difficult words.',
    coreIdeas: [
      'Move from vague to precise by asking what the writer actually means. Instead of replacing nice mechanically, ask whether the person was kind, helpful, cheerful, patient or generous. Instead of changing went simply to a “strong verb,” ask whether the person rushed, wandered, marched or quietly entered. Precision comes from the situation, not from a synonym list.',
      'Build topic-specific and purpose-specific word banks before writing. A description of a storm may need weather, movement and sound vocabulary; an explanation of a science process may need sequence and cause words; a story may need action, dialogue and emotion language. Organising words by communicative purpose makes retrieval easier during drafting.',
      'Teach revision as a meaning check. Children can underline repeated general words, identify one or two places where a more exact choice would help, test alternatives in the sentence and keep the simplest word when it is already best. This prevents “thesaurus writing,” where unfamiliar substitutes are inserted only to sound advanced.',
    ],
    workedExamples: [
      {
        example: 'Draft: “The dog went to the gate quickly.” Revision: “The dog raced to the gate.”',
        explanation: 'Raced compresses the idea of moving quickly into one precise action verb. The revision is useful because it sharpens meaning, not because raced is a longer or more difficult word.',
      },
      {
        example: 'Draft: “The girl was very scared.” Revision: “The girl was terrified when the lights suddenly went out.”',
        explanation: 'Terrified expresses stronger fear, while the added context explains the cause. The writer should choose it only when the situation supports that intensity. Precision depends on matching the word to evidence in the scene.',
      },
      {
        example: 'Draft: “The experiment was good.” Revision: “The experiment produced clear results that supported our prediction.”',
        explanation: 'Academic writing often improves when a vague evaluation is replaced by specific information. Instead of searching for a harder synonym for good, the child states what made the result useful.',
      },
    ],
    examples: [
      'Precise action: went → hurried, wandered, climbed, returned',
      'Precise description: nice → patient, cheerful, helpful, peaceful',
      'Academic clarity: good result → clear result, reliable evidence, accurate observation',
    ],
    commonMistakes: [
      'Replacing every repeated word even when repetition is needed for clarity, especially with key academic terms that should stay consistent.',
      'Choosing an unfamiliar thesaurus synonym without checking its meaning, tone, grammar pattern or natural collocations.',
      'Trying to improve vocabulary before the sentence has a clear idea, which can produce complicated wording around weak content.',
    ],
    trickyCases: [
      'Simple words are often the best words. Said, went, big and good are not forbidden. Revision should target places where a more precise choice genuinely improves meaning, while leaving clear ordinary vocabulary untouched.',
      'Writing vocabulary differs by genre and audience. A playful story, a science explanation and a formal school answer need different word choices. Teach children to ask who will read the piece and what the writing needs to accomplish before selecting vocabulary.',
    ],
    teachingNote: 'Separate drafting from vocabulary revision so the child can first capture the idea. During a second pass, choose only two or three sentences to improve. Ask: Which word is vague? What exactly happened? What feeling or quality do you mean? Which alternative sounds natural here? Keep a small reusable bank of words the child has already met in reading and speaking. Require each new word to survive a sentence check before it enters the final draft.',
    practicePrompts: [
      'Revise a six-sentence paragraph by improving only three vague words. For every change, explain what extra meaning the new word adds.',
      'Create a word bank for one topic such as a storm, a school competition or a science experiment, grouping words into actions, descriptions, feelings and useful academic language.',
      'Take five synonyms from a dictionary or Vocabulary Adventure challenge, test each in two sentences, and decide where the replacement is natural and where the original word is better.',
    ],
    faqs: [
      {
        question: 'Should children avoid simple words in writing?',
        answer: 'No. Clear simple words are often exactly right. Better vocabulary means having enough choices to express a precise idea, not replacing ordinary language automatically. A child should change a word when the new choice adds useful meaning, fits the tone and sounds natural in the sentence.',
      },
      {
        question: 'How can a child stop repeating the same words?',
        answer: 'First identify which repetition is actually distracting. Then build alternatives by meaning and function rather than by random synonym search. Pronouns, sentence restructuring, precise verbs and a small set of well-understood synonyms can help. Important technical words may need to repeat so the writing stays clear.',
      },
    ],
    sourceIds: ['ies-academic-vocabulary', 'british-council-vocabulary-b1-b2', 'british-council-vocabulary-overview'],
    relatedPaths: ['/resources/vocabulary/synonyms-antonyms-for-kids', '/resources/vocabulary/collocations-for-kids', '/writing-classes-for-kids'],
    featuredWordIds: [],
  }),

  page({
    order: 16,
    id: 'vocabulary-for-speaking',
    stageId: 'transfer-speaking-writing',
    publicationBatch: 'gv5-natural-english-transfer',
    slug: 'vocabulary-for-speaking-conversation',
    cardTitle: 'Vocabulary for Speaking & Conversation',
    seoTitle: 'Vocabulary for Speaking and Conversation for Kids | Tiny Steps',
    seoDescription: 'Build retrievable vocabulary for fuller answers, conversation, explanation, storytelling and confident everyday speaking without memorised scripts.',
    quickAnswer: 'Speaking vocabulary is the language a child can retrieve quickly enough to use while answering, explaining, describing and having a conversation. Growth therefore depends on more than recognising words on a worksheet: children need repeated opportunities to recall useful vocabulary, combine it into natural phrases and use it across changing real-life speaking situations.',
    concept: 'A child can have a large receptive vocabulary but a smaller active vocabulary. During conversation there is little time to search memory, so familiar general words often appear first. Speaking practice should help useful words move from recognition into retrieval through short supported responses, repeated use in new contexts and gradual removal of prompts.',
    whyItMatters: 'Limited active vocabulary can make a child give one-word answers, repeat the same adjectives and verbs or pause even when the underlying idea is clear. A stronger speaking vocabulary supports fuller answers, storytelling, classroom participation and explanation. It also helps confidence because the child has more language available to express a thought instead of memorising one fixed response.',
    coreIdeas: [
      'Teach vocabulary in ready-to-use chunks as well as individual words. Useful frames such as in my opinion, I noticed that, the main reason is, excited about and take part in give children natural starting points for speaking. The frame should support meaning, not become a script that the child repeats without understanding.',
      'Use retrieval with variation. After learning a word such as disappointed, compare several situations and ask where it fits, then use it in a personal answer, a story retell and a prediction. Reusing the word across different prompts strengthens access to the meaning and prevents the child from linking it to only one memorised sentence.',
      'Expand answers through meaningful follow-up questions. Instead of demanding “speak more,” ask for one relevant detail: What happened next? Why did you choose that? How did you feel? What was different? These prompts create a reason to retrieve action, description, emotion and linking vocabulary while keeping the conversation purposeful.',
    ],
    workedExamples: [
      {
        example: 'Short answer: “It was good.” Expanded answer: “I enjoyed the museum because the space exhibit was fascinating.”',
        explanation: 'The stronger response adds a precise reaction and a reason. Fascinating is useful only because it matches the child’s meaning. The goal is not length by itself; it is a clearer and more informative spoken message.',
      },
      {
        example: 'Basic retell: “He went home.” Expanded retell: “He hurried home because the storm was getting stronger.”',
        explanation: 'Hurried and getting stronger make the sequence more vivid and specific. A teacher can first offer two choices, then later ask the child to retrieve an action word independently in a different story.',
      },
      {
        example: 'Conversation: “What do you think about the rule?” — “In my opinion, the rule is fair because everyone gets the same amount of time.”',
        explanation: 'The discourse phrase in my opinion helps organise the response, while fair and the reason that follows carry the actual meaning. Practising a small number of flexible conversation chunks can support fluency without turning answers into scripts.',
      },
    ],
    examples: [
      'Give a reason: because, the main reason is, this happened because',
      'Express an opinion: I think, in my opinion, I prefer, I agree because',
      'Describe precisely: fascinating, crowded, peaceful, disappointed, relieved',
    ],
    commonMistakes: [
      'Giving children long word lists before speaking and expecting all of the words to appear naturally in one conversation.',
      'Correcting every vocabulary choice immediately, which can interrupt the message and make the child focus on avoiding errors instead of communicating.',
      'Practising one perfect answer repeatedly until the child can recite it, then mistaking memorisation for flexible conversational vocabulary.',
    ],
    trickyCases: [
      'A child may know a word but need extra retrieval time. Silence does not always mean lack of knowledge. Give a short pause, a meaning cue or two possible choices, then reduce support over time so independent recall strengthens.',
      'Spoken vocabulary can be informal, neutral or formal depending on the situation. Children should learn that language for chatting with a friend may differ from language for a school presentation, while both can be correct and appropriate.',
    ],
    teachingNote: 'Choose a narrow speaking topic and pre-teach only a few high-value words or chunks. Ask one open question, listen for places where the child relies on vague language, and give a brief prompt only when it will unlock a more precise idea. Recycle the target vocabulary in a second topic so the child has to retrieve it again rather than copy the first answer. Praise clear meaning and independence; correction should be selective and should not turn the conversation into a vocabulary test.',
    practicePrompts: [
      'Answer five familiar questions using one precise action, feeling or description word in each answer, then answer the same questions again with different examples.',
      'Retell a short event twice: first with no word bank, then with five useful vocabulary prompts. Compare which words helped make the retell clearer rather than simply longer.',
      'Hold a three-minute conversation about a hobby, school event or trip. Afterwards, choose two vague words you repeated and practise more precise alternatives in fresh sentences.',
    ],
    faqs: [
      {
        question: 'Why does my child know words in worksheets but not use them while speaking?',
        answer: 'Recognition is easier than rapid retrieval. In conversation the child must understand the question, plan an idea, select words and build a sentence at the same time. Repeated retrieval in varied speaking tasks helps move vocabulary into active use. Small cues can support the transition, but the goal is to remove those cues gradually.',
      },
      {
        question: 'Should children memorise speaking vocabulary sentences?',
        answer: 'A few flexible chunks can reduce cognitive load, but complete memorised answers should not replace genuine conversation. Children need to adapt vocabulary to new questions, people and situations. Practise the same useful words in several different responses so the child learns the language rather than one script.',
      },
    ],
    sourceIds: ['british-council-vocabulary-overview', 'british-council-vocabulary-b1-b2', 'ies-foundational-vocabulary'],
    relatedPaths: ['/resources/vocabulary/feelings-emotions-for-kids', '/resources/vocabulary/collocations-for-kids', '/spoken-english-classes-for-kids-online'],
    featuredWordIds: [],
  }),

  page({
    order: 2,
    id: 'action-words',
    stageId: 'everyday-foundations',
    publicationBatch: 'gv5b-foundation-completion',
    slug: 'action-words-for-kids',
    cardTitle: 'Action Words for Kids',
    seoTitle: 'Action Words for Kids: Stronger Verbs for Speaking & Writing | Tiny Steps',
    seoDescription: 'Build a richer bank of action words for movement, school, home and communication, then choose precise verbs that fit meaning and context.',
    quickAnswer: 'Action words name what people, animals and things do. Children build stronger vocabulary when they move beyond a small set such as go, do and make and learn precise verbs such as hurry, carry, whisper, collect, compare and explain. The vocabulary goal is choosing a word that matches the action clearly; the Grammar guide separately explains how verbs behave in sentences.',
    concept: 'An action-word vocabulary network groups verbs by meaning and situation so children can retrieve a useful word when they speak, read or write. Movement verbs can include walk, march, race, crawl and wander; school verbs can include read, write, compare and explain; home verbs can include pour, fold, tidy and carry. The important step is not memorising labels but noticing how one action differs from another.',
    whyItMatters: 'Precise action words improve comprehension and make speaking and writing more informative. A child who understands dashed, wandered and crept can picture a story more accurately than a child who interprets every movement as went. In writing, one well-chosen verb can replace a vague verb plus several extra words. In classroom instructions, understanding verbs such as compare, underline and summarise is also essential for knowing what a task requires.',
    coreIdeas: [
      'Teach action words in meaningful families. Put walk, march, race, crawl and tiptoe beside one another and ask how the movement changes. A child should notice speed, purpose, body position or mood rather than merely reciting five alternatives for go. Meaningful contrasts create a stronger retrieval network and help the child choose a verb for a real situation.',
      'Connect each verb to a subject and context. “The baby crawled across the mat,” “The class compared two diagrams,” and “Mira whispered the answer” show who performs the action and why that verb fits. This keeps the Vocabulary page focused on usable meaning while the Grammar verb page can separately explain tense, agreement and sentence structure.',
      'Move from recognition to production. First let the child match a verb to a picture or short scenario, then choose between nearby alternatives, explain the difference and finally use the word in an original sentence. Repeated retrieval across different situations is more useful than copying the same definition or completing one predictable worksheet pattern.',
    ],
    workedExamples: [
      {
        example: '“The puppy raced across the garden when it heard the gate open.”',
        explanation: 'Raced tells us that the puppy moved very quickly. Went would be grammatically possible but less precise. Ask the child what evidence in the situation supports raced and whether strolled would change the picture. The comparison makes the meaning of the action word explicit.',
      },
      {
        example: '“Please compare the two maps and explain one difference.”',
        explanation: 'Compare and explain are learning actions. Compare requires looking for similarities or differences, while explain requires making an idea understandable. These verbs are vocabulary children need to follow school instructions, not only grammar terms to identify in sentences.',
      },
      {
        example: '“Ravi carried the box carefully because the glasses inside could break.”',
        explanation: 'Carried means held and moved something from one place to another. The context adds purpose and manner. A follow-up can contrast carried with pushed, pulled or dragged so the child understands that several movement verbs involve different physical actions.',
      },
    ],
    examples: [
      'Movement: walk, race, crawl, climb, hurry, wander',
      'School actions: read, write, compare, explain, practise, check',
      'Communication and home actions: ask, answer, whisper, pour, fold, carry',
    ],
    commonMistakes: [
      'Calling every action word a “strong verb” and assuming unusual vocabulary is automatically better. The best word is the one that expresses the intended action naturally and accurately.',
      'Teaching long verb lists without scenarios, which can leave children able to recognise a word on a card but unable to retrieve it in speaking or writing.',
      'Turning vocabulary practice into a grammar-identification exercise only. Knowing that raced is a verb is useful, but children also need to understand how raced differs in meaning from walked, hurried or wandered.',
    ],
    trickyCases: [
      'Some words can represent actions in one context and other ideas in another. A child can “answer a question,” while answer can also name the response itself. Use the sentence to decide the active meaning and avoid teaching word class as if every word has only one permanent job.',
      'Many precise verbs carry extra information. Whisper includes a quiet voice; sprint includes very fast running; stare includes sustained looking. Children should not replace a broad verb unless the added meaning is actually true in the situation.',
    ],
    teachingNote: 'Choose one small action family at a time and use it in pictures, demonstrations, reading and speaking. Ask the child to act out two contrasting verbs, explain the difference, and then use each in a new sentence. During writing, highlight one vague verb and ask what really happened before offering alternatives. Keep tense correction secondary during a Vocabulary activity unless it blocks meaning; the main objective is accurate lexical choice and independent retrieval.',
    practicePrompts: [
      'Sort twelve action words into movement, school, home and communication groups, then explain why one word could reasonably belong to more than one group.',
      'Replace went, did or said in six short sentences only when a more precise verb fits the evidence, and explain what extra meaning the new verb adds.',
      'Use five action words from Vocabulary Adventure or the 50-word lexical set in a short retell, making each action clear enough that a listener could picture it.',
    ],
    faqs: [
      {
        question: 'Are action words the same as verbs?',
        answer: 'Many beginner action words are verbs, but the Vocabulary goal and Grammar goal are different. This guide focuses on meaning, precision and retrieval: which action word best describes what happened? The Grammar verb guide explains how verbs function structurally, including tense, helping verbs and agreement. Linking the two is useful, but one page should not duplicate the other.',
      },
      {
        question: 'How can a child learn stronger action words without sounding unnatural?',
        answer: 'Start with situations the child understands and compare a few nearby choices. Ask whether the action was fast, slow, quiet, careful, sudden or repeated. Then choose a common precise verb that matches that evidence. Children do not need rare words; they need useful words they can understand, retrieve and use accurately in new sentences.',
      },
    ],
    sourceIds: ['british-council-vocabulary-a1-a2', 'british-council-vocabulary-b1-b2', 'ies-foundational-vocabulary'],
    relatedPaths: ['/resources/grammar/verbs-for-kids', '/resources/vocabulary/vocabulary-for-better-writing', '/free-games/word-meaning-flashcards'],
    featuredWordIds: ['run', 'jump', 'eat', 'read', 'write', 'draw', 'sing', 'dance', 'carry', 'open'],
  }),

  page({
    order: 4,
    id: 'describing-words',
    stageId: 'everyday-foundations',
    publicationBatch: 'gv5b-foundation-completion',
    slug: 'describing-words-for-kids',
    cardTitle: 'Describing Words for Kids',
    seoTitle: 'Describing Words for Kids: Precise Adjectives & Details | Tiny Steps',
    seoDescription: 'Help children choose useful describing words for size, shape, colour, texture, quality and personality without overloading sentences.',
    quickAnswer: 'Describing words help children express what a person, place, object or experience is like. A strong vocabulary goes beyond big, nice and good by giving children precise choices for size, shape, colour, texture, quality, sound, speed and personality. The goal is not adding more adjectives to every sentence; it is choosing the few details that make the meaning clearer.',
    concept: 'Description becomes useful when vocabulary is organised by the property being described. A child can compare big and enormous for size, soft and rough for texture, quiet and noisy for sound, or patient and helpful for personality. Grouping words by meaning makes it easier to retrieve a suitable choice and prevents children from treating every adjective as a decorative extra.',
    whyItMatters: 'Precise describing vocabulary supports reading comprehension, speaking, storytelling and factual writing. Readers need descriptive words to build a mental picture and infer mood or character. Speakers use them to explain preferences and experiences. Writers use them to select relevant detail. A limited descriptive vocabulary can make many answers sound repetitive even when the child has good ideas.',
    coreIdeas: [
      'Teach descriptions through contrasts and scales. Small, medium, large and enormous show size; cool, cold and freezing show temperature; quiet and loud contrast sound. The words should be discussed in context because intensity and appropriateness matter. A cup can be small, a building can be enormous, and the same object may be described differently depending on what it is compared with.',
      'Separate useful precision from adjective stacking. “A rough wooden table” can communicate texture and material clearly, while a sentence with six unrelated adjectives may become harder to understand. Ask which details matter for the listener or reader. This helps children learn that rich vocabulary improves meaning when it is selected, not simply accumulated.',
      'Connect description to nouns and situations without duplicating Grammar. Vocabulary practice asks, “Which word best describes this?” Grammar can separately teach adjective position, comparative forms and sentence structure. Keeping the lexical purpose clear lets children build a broader bank of words while still linking naturally to the adjective reference guide.',
    ],
    workedExamples: [
      {
        example: '“The path was narrow and rocky, so we walked in a single line.”',
        explanation: 'Narrow describes limited width and rocky describes the surface. Both details matter because they explain the walkers’ behaviour. The sentence shows that description can carry useful information rather than merely making writing sound more elaborate.',
      },
      {
        example: '“Maya gave a patient explanation to the younger student.”',
        explanation: 'Patient describes a personal quality shown through behaviour. Instead of saying Maya was nice, the more precise word identifies how she acted. Ask what evidence would make helpful, generous or cheerful a better choice in a different situation.',
      },
      {
        example: '“The blanket felt soft, but the old wall was rough.”',
        explanation: 'Soft and rough are texture words learned through a direct contrast. The child can then apply them to new objects and discuss borderline cases. This moves the words beyond one memorised picture or object.',
      },
    ],
    examples: [
      'Size and shape: tiny, wide, narrow, round, enormous',
      'Texture and quality: soft, rough, smooth, clean, fragile',
      'People and atmosphere: patient, cheerful, peaceful, crowded, noisy',
    ],
    commonMistakes: [
      'Replacing simple words with rare synonyms only to make writing sound advanced, even when the child does not fully understand the new word.',
      'Adding many describing words to one noun without deciding which details are relevant to the message.',
      'Teaching adjective labels without developing meaning contrasts, so the child can identify a describing word but still relies on nice, big and good in real communication.',
    ],
    trickyCases: [
      'The same describing word can activate different meanings. Bright can describe strong light, vivid colour or an intelligent person in some contexts. The surrounding noun and sentence help the child choose the intended sense.',
      'Description can be partly subjective. A room one person calls small may feel comfortable to another. Teach children to distinguish measurable properties from opinions and to give evidence when a descriptive judgement could reasonably vary.',
    ],
    teachingNote: 'Build small word banks around one property at a time. Use real objects, photographs or short passages and ask the child to select one or two details that matter. Compare nearby choices such as small, tiny and narrow rather than teaching them as interchangeable. During speaking and writing, ask “What exactly do you mean?” and “Which detail helps the listener picture it?” Remove word banks gradually so retrieval becomes independent.',
    practicePrompts: [
      'Sort fifteen describing words into size, shape, colour, texture, sound, quality and personality, then discuss any word that could fit more than one group.',
      'Improve five vague descriptions by replacing only one word in each sentence with a more precise choice, then explain the change in meaning.',
      'Choose an object or place and describe it using three relevant details from different categories without repeating a memorised sentence pattern.',
    ],
    faqs: [
      {
        question: 'Are describing words always adjectives?',
        answer: 'Many common describing words taught to children are adjectives, but this Vocabulary guide is about useful descriptive meaning rather than complete grammatical classification. Grammar lessons can explain how adjectives function, where they appear and how comparative forms work. Here the priority is choosing precise words that fit the person, object, place or experience being described.',
      },
      {
        question: 'How can I stop my child using nice, good and big repeatedly?',
        answer: 'Ask what the child specifically means before offering a synonym. Nice might mean kind, peaceful, tasty or enjoyable depending on context. Good might mean accurate, helpful, exciting or effective. Once the intended idea is clear, compare two or three familiar alternatives and reuse the chosen word in several new sentences so it becomes available independently.',
      },
    ],
    sourceIds: ['british-council-vocabulary-a1-a2', 'british-council-vocabulary-b1-b2', 'ies-foundational-vocabulary'],
    relatedPaths: ['/resources/grammar/adjectives-for-kids', '/resources/vocabulary/vocabulary-for-better-writing', '/free-games/word-meaning-flashcards'],
    featuredWordIds: ['big', 'small', 'soft', 'loud', 'bright', 'clean', 'cold', 'sweet', 'fast', 'slow'],
  }),
]);

export const VOCABULARY_AUTHORITY_PATHS = freezeList(
  VOCABULARY_AUTHORITY_PAGES.map((entry) => entry.path),
);

export const getVocabularyAuthorityPageBySlug = (slug) =>
  VOCABULARY_AUTHORITY_PAGES.find((entry) => entry.slug === String(slug || '')) ?? null;

export const getVocabularyAuthorityPageByPath = (pathname) =>
  VOCABULARY_AUTHORITY_PAGES.find((entry) => entry.path === String(pathname || '').replace(/\/+$/, '')) ?? null;

if (VOCABULARY_AUTHORITY_PAGES.length !== VOCABULARY_AUTHORITY_ROUTE_MANIFEST.length) {
  throw new Error('Published Vocabulary content must stay aligned with its lightweight SEO manifest.');
}
for (const entry of VOCABULARY_AUTHORITY_PAGES) {
  const manifest = VOCABULARY_AUTHORITY_ROUTE_MANIFEST.find((item) => item.id === entry.id);
  const seo = VOCABULARY_RESOURCE_SEO[entry.path];
  if (!manifest || manifest.path !== entry.path || manifest.cardTitle !== entry.cardTitle) {
    throw new Error(`Vocabulary manifest drift detected for ${entry.id}.`);
  }
  if (!seo || seo.title !== entry.seoTitle || seo.description !== entry.seoDescription) {
    throw new Error(`Vocabulary SEO drift detected for ${entry.id}.`);
  }
}
