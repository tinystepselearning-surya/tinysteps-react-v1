import { VOCABULARY_AUTHORITY_ROUTE_MANIFEST, VOCABULARY_RESOURCE_SEO } from './vocabularyAuthoritySeoManifest.js';
import { getVocabularyKnowledgeSources } from './vocabularyKnowledgeSources.js';

const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);

const page = (config) => {
  const sources = getVocabularyKnowledgeSources(config.sourceIds);
  if (sources.length < 2) {
    throw new Error(`GV4 Vocabulary authority page ${config.id} requires at least two authoritative references.`);
  }

  return freeze({
    state: 'published',
    publicationApproved: true,
    publicationBatch: 'gv4-first-authority-batch',
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

export const VOCABULARY_AUTHORITY_REVISION = '2026-09-27-gv4';

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
    order: 2,
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
    order: 3,
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
    order: 4,
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
    order: 5,
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
    order: 6,
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
    relatedPaths: ['/resources/grammar/word-formation-prefixes-suffixes-for-kids', '/free-spelling-game-for-kids', '/reading-classes-for-kids'],
    featuredWordIds: ['happy', 'read', 'write', 'teacher', 'practice'],
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
  throw new Error('GV4 Vocabulary content must stay aligned with its lightweight SEO manifest.');
}
for (const entry of VOCABULARY_AUTHORITY_PAGES) {
  const manifest = VOCABULARY_AUTHORITY_ROUTE_MANIFEST.find((item) => item.id === entry.id);
  const seo = VOCABULARY_RESOURCE_SEO[entry.path];
  if (!manifest || manifest.path !== entry.path || manifest.cardTitle !== entry.cardTitle) {
    throw new Error(`GV4 Vocabulary manifest drift detected for ${entry.id}.`);
  }
  if (!seo || seo.title !== entry.seoTitle || seo.description !== entry.seoDescription) {
    throw new Error(`GV4 Vocabulary SEO drift detected for ${entry.id}.`);
  }
}
