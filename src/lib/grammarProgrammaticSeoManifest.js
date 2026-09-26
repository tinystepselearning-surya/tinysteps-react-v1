const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);

// Lightweight route/SEO data for the 32 governed Grammar guides.
// Detailed teaching copy stays in grammarProgrammaticRegistry.js so eager
// SEO/analytics imports do not pull the full Grammar corpus into initial JS.
export const GRAMMAR_PROGRAMMATIC_ROUTE_MANIFEST = freezeList([
  freeze({
    path: "/resources/grammar/nouns-for-kids",
    title: "Nouns for Kids: Meaning, Types & Examples | Tiny Steps",
    description: "Learn what nouns are, how children can identify naming words in sentences, and how common and proper nouns support clear sentence building.",
  }),
  freeze({
    path: "/resources/grammar/proper-nouns-for-kids",
    title: "Proper Nouns for Kids: Capitals, Names & Examples | Tiny Steps",
    description: "Teach proper nouns as specific names that begin with capital letters, with clear contrasts between common and proper nouns.",
  }),
  freeze({
    path: "/resources/grammar/verbs-for-kids",
    title: "Verbs for Kids: Action, Being & Helping Verbs | Tiny Steps",
    description: "Learn how verbs carry action, state or helping meaning in sentences and prepare children for tense and subject-verb agreement.",
  }),
  freeze({
    path: "/resources/grammar/adjectives-for-kids",
    title: "Adjectives for Kids: Describing Words & Examples | Tiny Steps",
    description: "Teach adjectives as meaningful words that describe or identify nouns, with sentence-level examples and practice.",
  }),
  freeze({
    path: "/resources/grammar/pronouns-for-kids",
    title: "Pronouns for Kids: Clear Reference & Examples | Tiny Steps",
    description: "Learn how pronouns replace or refer to nouns without creating confusing or repetitive sentences.",
  }),
  freeze({
    path: "/resources/grammar/singular-and-plural-nouns",
    title: "Singular and Plural Nouns for Kids: Rules & Examples | Tiny Steps",
    description: "Teach one-and-many noun forms, regular plural patterns and common irregular plurals without overgeneralising one rule.",
  }),
  freeze({
    path: "/resources/grammar/a-an-articles-for-kids",
    title: "A or An for Kids: Article Rules, Sounds & Examples | Tiny Steps",
    description: "Teach a and an through the sound that begins the next word, with clear examples and common exceptions.",
  }),
  freeze({
    path: "/resources/grammar/the-article-for-kids",
    title: "The Article for Kids: When to Use “the” | Tiny Steps",
    description: "Explain when children use the for a specific or already-known noun and when an article may not be needed.",
  }),
  freeze({
    path: "/resources/grammar/prepositions-for-kids",
    title: "Prepositions for Kids: Place, Time & Movement Examples | Tiny Steps",
    description: "Learn prepositions of place, time and movement through sentence relationships rather than memorised word lists.",
  }),
  freeze({
    path: "/resources/grammar/adverbs-for-kids",
    title: "Adverbs for Kids: How, When & Where Examples | Tiny Steps",
    description: "Teach adverbs as words that add useful information about how, when or where an action happens.",
  }),
  freeze({
    path: "/resources/grammar/simple-present-tense-for-kids",
    title: "Simple Present Tense for Kids: Rules & Examples | Tiny Steps",
    description: "Teach simple present for routines, repeated actions, facts and stable states, including third-person singular agreement.",
  }),
  freeze({
    path: "/resources/grammar/simple-past-tense-for-kids",
    title: "Simple Past Tense for Kids: Regular, Irregular & Examples | Tiny Steps",
    description: "Teach simple past for completed past events with regular and irregular verb forms and correct did/did not patterns.",
  }),
  freeze({
    path: "/resources/grammar/simple-future-tense-for-kids",
    title: "Simple Future Tense for Kids: Will + Verb Examples | Tiny Steps",
    description: "Teach the beginner future pattern will + base verb and distinguish it from the wider system of future forms.",
  }),
  freeze({
    path: "/resources/grammar/modal-verbs-for-kids",
    title: "Modal Verbs for Kids: Can, Could, Should, Must & More | Tiny Steps",
    description: "Teach common modal verbs by meaning: ability, possibility, advice, permission and obligation.",
  }),
  freeze({
    path: "/resources/grammar/independent-and-dependent-clauses",
    title: "Independent and Dependent Clauses for Kids | Tiny Steps",
    description: "Help children distinguish complete independent clauses from dependent clauses and combine them into clear sentences.",
  }),
  freeze({
    path: "/resources/grammar/simple-present-vs-present-continuous-for-kids",
    title: "Simple Present vs Present Continuous for Kids | Tiny Steps",
    description: "Help children choose between routines and facts in the simple present and actions happening around now in the present continuous.",
  }),
  freeze({
    path: "/resources/grammar/simple-past-vs-past-continuous-for-kids",
    title: "Simple Past vs Past Continuous for Kids | Tiny Steps",
    description: "Teach completed past events versus actions that were in progress, including when and while patterns.",
  }),
  freeze({
    path: "/resources/grammar/future-forms-for-kids",
    title: "Future Forms for Kids: Will, Going To & Present Continuous | Tiny Steps",
    description: "Compare common English future forms for decisions, predictions, plans, arrangements and schedules.",
  }),
  freeze({
    path: "/resources/grammar/present-perfect-vs-simple-past-for-kids",
    title: "Present Perfect vs Simple Past for Kids | Tiny Steps",
    description: "Compare life experience and present relevance with finished past events and finished-time expressions.",
  }),
  freeze({
    path: "/resources/grammar/past-perfect-tense-for-kids",
    title: "Past Perfect Tense for Kids: Had + Past Participle | Tiny Steps",
    description: "Teach past perfect for showing an earlier event before another past reference point without overusing the form.",
  }),
  freeze({
    path: "/resources/grammar/forming-questions-in-english-for-kids",
    title: "How to Form Questions in English for Kids | Tiny Steps",
    description: "Teach yes/no and wh- questions with correct auxiliaries and natural English word order.",
  }),
  freeze({
    path: "/resources/grammar/negative-sentences-and-short-answers",
    title: "Negative Sentences and Short Answers for Kids | Tiny Steps",
    description: "Teach accurate negatives, contractions and short answers by matching the correct auxiliary to the tense.",
  }),
  freeze({
    path: "/resources/grammar/quantifiers-for-kids",
    title: "Quantifiers for Kids: Much, Many, Some, Any, Few & Little | Tiny Steps",
    description: "Teach quantity expressions by connecting them to countable and uncountable nouns and sentence meaning.",
  }),
  freeze({
    path: "/resources/grammar/compound-sentences-for-kids",
    title: "Compound Sentences for Kids: Joining Complete Ideas | Tiny Steps",
    description: "Teach children to join related independent clauses with suitable coordinating conjunctions and punctuation.",
  }),
  freeze({
    path: "/resources/grammar/reason-and-result-connectors-for-kids",
    title: "Reason and Result Connectors for Kids: Because, So & Therefore | Tiny Steps",
    description: "Teach children to distinguish causes from results and connect them with because, so, therefore and related expressions.",
  }),
  freeze({
    path: "/resources/grammar/time-and-sequence-connectors-for-kids",
    title: "Time and Sequence Connectors for Kids | Before, After, When, While | Tiny Steps",
    description: "Teach children to order events clearly with before, after, when, while, first, next and other sequence language.",
  }),
  freeze({
    path: "/resources/grammar/conditionals-for-kids",
    title: "Conditionals for Kids: If, Unless & Possibility Sentences | Tiny Steps",
    description: "Introduce condition-result relationships with if and unless and distinguish real from imagined possibilities.",
  }),
  freeze({
    path: "/resources/grammar/contrast-and-concession-for-kids",
    title: "Contrast and Concession for Kids: But, Although, However & Despite | Tiny Steps",
    description: "Teach children to connect contrasting ideas accurately with but, although, however and despite.",
  }),
  freeze({
    path: "/resources/grammar/relative-clauses-for-kids",
    title: "Relative Clauses for Kids: Who, Which & That | Tiny Steps",
    description: "Teach relative clauses as a way to add information about a noun with who, which, that and related forms.",
  }),
  freeze({
    path: "/resources/grammar/sentence-fragments-and-run-ons-for-kids",
    title: "Sentence Fragments and Run-ons for Kids: How to Fix Them | Tiny Steps",
    description: "Help children diagnose incomplete fragments, run-on sentences and comma splices, then repair sentence boundaries.",
  }),
  freeze({
    path: "/resources/grammar/direct-and-reported-speech-for-kids",
    title: "Direct and Reported Speech for Kids: Rules & Examples | Tiny Steps",
    description: "Teach quotation punctuation, reporting verbs and accurate changes when reporting what someone said.",
  }),
  freeze({
    path: "/resources/grammar/active-and-passive-voice-for-kids",
    title: "Active and Passive Voice for Kids: Rules & Examples | Tiny Steps",
    description: "Teach children how active and passive voice change sentence focus while preserving tense and core meaning.",
  })
]);

export const GRAMMAR_PROGRAMMATIC_PATHS = freezeList(
  GRAMMAR_PROGRAMMATIC_ROUTE_MANIFEST.map((entry) => entry.path),
);

export const GRAMMAR_PROGRAMMATIC_RESOURCE_SEO = freeze(
  Object.fromEntries(GRAMMAR_PROGRAMMATIC_ROUTE_MANIFEST.map((entry) => [
    entry.path,
    freeze({
      title: entry.title,
      description: entry.description,
      canonicalPath: entry.path,
      ogType: 'article',
    }),
  ])),
);

if (GRAMMAR_PROGRAMMATIC_ROUTE_MANIFEST.length !== 32) {
  throw new Error('Grammar programmatic route manifest must remain bounded to 32 published pages.');
}
if (new Set(GRAMMAR_PROGRAMMATIC_PATHS).size !== GRAMMAR_PROGRAMMATIC_PATHS.length) {
  throw new Error('Grammar programmatic route manifest paths must be unique.');
}
