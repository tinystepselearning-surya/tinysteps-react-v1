const freeze = (value) => Object.freeze(value);
const freezeList = (values = []) => Object.freeze([...values]);

export const VOCABULARY_KNOWLEDGE_SOURCES = Object.freeze({
  'british-council-vocabulary-overview': freeze({
    id: 'british-council-vocabulary-overview',
    publisher: 'British Council LearnEnglish',
    title: 'Vocabulary',
    url: 'https://learnenglish.britishcouncil.org/free-resources/vocabulary',
    note: 'Reference for teaching vocabulary through meaning, pronunciation, spelling, topic grouping and interactive practice.',
  }),
  'british-council-vocabulary-a1-a2': freeze({
    id: 'british-council-vocabulary-a1-a2',
    publisher: 'British Council LearnEnglish',
    title: 'A1-A2 vocabulary',
    url: 'https://learnenglish.britishcouncil.org/free-resources/vocabulary/a1-a2',
    note: 'Reference for beginner topic vocabulary including actions, everyday objects, school, homes, transport and other familiar semantic fields.',
  }),
  'british-council-vocabulary-b1-b2': freeze({
    id: 'british-council-vocabulary-b1-b2',
    publisher: 'British Council LearnEnglish',
    title: 'B1-B2 vocabulary',
    url: 'https://learnenglish.britishcouncil.org/free-resources/vocabulary/b1-b2',
    note: 'Reference for broader vocabulary progression into more precise real-world domains and increasingly independent word use.',
  }),
  'british-council-everyday-objects': freeze({
    id: 'british-council-everyday-objects',
    publisher: 'British Council LearnEnglish',
    title: 'Everyday objects',
    url: 'https://learnenglish.britishcouncil.org/free-resources/vocabulary/a1-a2/everyday-objects',
    note: 'Topic-vocabulary reference showing familiar everyday objects taught through recognition, practice and discussion.',
  }),
  'british-council-school-vocabulary': freeze({
    id: 'british-council-school-vocabulary',
    publisher: 'British Council LearnEnglish',
    title: 'School',
    url: 'https://learnenglish.britishcouncil.org/free-resources/vocabulary/a1-a2/school',
    note: 'Topic-vocabulary reference for school-related words and classroom discussion at beginner level.',
  }),
  'british-council-feelings-adjectives': freeze({
    id: 'british-council-feelings-adjectives',
    publisher: 'British Council LearnEnglish',
    title: 'Adjectives and prepositions',
    url: 'https://learnenglish.britishcouncil.org/free-resources/grammar/a1-a2/adjectives-prepositions',
    note: 'Usage reference showing common feeling adjectives such as angry, excited, happy, nervous, sad, stressed, worried, afraid, scared and proud in natural patterns.',
  }),
  'cambridge-thesaurus-antonym': freeze({
    id: 'cambridge-thesaurus-antonym',
    publisher: 'Cambridge Dictionary',
    title: 'Antonym — synonyms and antonyms',
    url: 'https://dictionary.cambridge.org/thesaurus/antonym',
    note: 'Reference for the concept of antonymy and thesaurus-style relationships between words with contrasting meanings.',
  }),
  'cambridge-word-formation': freeze({
    id: 'cambridge-word-formation',
    publisher: 'Cambridge Dictionary',
    title: 'Word formation',
    url: 'https://dictionary.cambridge.org/grammar/british-grammar/word-formation_2',
    note: 'Reference for common word-formation processes, including prefixes and suffixes added to a base or stem.',
  }),
  'ies-foundational-vocabulary': freeze({
    id: 'ies-foundational-vocabulary',
    publisher: 'Institute of Education Sciences / What Works Clearinghouse',
    title: 'Foundational Skills to Support Reading for Understanding in Kindergarten Through 3rd Grade',
    url: 'https://ies.ed.gov/ncee/wwc/PracticeGuide/21/Published',
    note: 'Evidence-based practice guide that includes vocabulary knowledge and academic language as part of reading for understanding.',
  }),
  'ies-academic-vocabulary': freeze({
    id: 'ies-academic-vocabulary',
    publisher: 'Institute of Education Sciences / What Works Clearinghouse',
    title: 'Teaching Academic Content and Literacy to English Learners in Elementary and Middle School',
    url: 'https://ies.ed.gov/ncee/WWC/PracticeGuide/19/Published',
    note: 'Evidence-based guidance recommending intensive teaching of selected academic vocabulary across multiple instructional activities.',
  }),
  'ies-context-clues': freeze({
    id: 'ies-context-clues',
    publisher: 'Institute of Education Sciences',
    title: 'Steps for Using Context Clues to Determine Word Meanings',
    url: 'https://ies.ed.gov/use-work/resource-library/resource/fact-sheetinfographicfaq/steps-using-context-clues-determine-word-meanings',
    note: 'Instructional reference for rereading around an unfamiliar word, generating a possible meaning and checking whether it makes sense in context.',
  }),
  'ies-reading-interventions': freeze({
    id: 'ies-reading-interventions',
    publisher: 'Institute of Education Sciences / What Works Clearinghouse',
    title: 'Providing Reading Interventions for Students in Grades 4–9',
    url: 'https://ies.ed.gov/ncee/wwc/practiceguide/29',
    note: 'Evidence-based practice guide that includes building world and word knowledge as part of comprehension instruction.',
  }),
  'cambridge-collocation': freeze({
    id: 'cambridge-collocation',
    publisher: 'Cambridge Dictionary',
    title: 'Collocation',
    url: 'https://dictionary.cambridge.org/grammar/british-grammar/collocation_2',
    note: 'Reference explaining that collocations are recurring word partnerships and that some combinations are stronger or more restricted than others.',
  }),
  'cambridge-phrasal-verbs': freeze({
    id: 'cambridge-phrasal-verbs',
    publisher: 'Cambridge Dictionary',
    title: 'Phrasal verbs and multi-word verbs',
    url: 'https://dictionary.cambridge.org/grammar/british-grammar/phrasal-verbs-and-multi-word-verbs',
    note: 'Reference for multi-word verb structure, meaning, particles and common differences between phrasal and prepositional verbs.',
  }),
  'british-council-phrasal-verbs': freeze({
    id: 'british-council-phrasal-verbs',
    publisher: 'British Council LearnEnglish',
    title: 'Phrasal verbs',
    url: 'https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/phrasal-verbs',
    note: 'Learner-facing reference showing common phrasal verbs in context and explaining separable and inseparable patterns.',
  }),
});

export const getVocabularyKnowledgeSources = (ids = []) =>
  freezeList(ids.map((id) => {
    const source = VOCABULARY_KNOWLEDGE_SOURCES[id];
    if (!source) throw new Error(`Unknown Vocabulary knowledge source: ${id}`);
    return source;
  }));
