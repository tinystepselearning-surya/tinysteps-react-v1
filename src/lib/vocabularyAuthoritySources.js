const freeze = (value) => Object.freeze(value);

export const VOCABULARY_AUTHORITY_SOURCES = Object.freeze({
  'british-council-vocabulary-overview': freeze({
    id: 'british-council-vocabulary-overview',
    publisher: 'British Council LearnEnglish',
    title: 'Vocabulary',
    url: 'https://learnenglish.britishcouncil.org/free-resources/vocabulary',
    note: 'Reference for vocabulary learning through meaning, pronunciation, spelling, topic organisation and repeated practice.',
  }),
  'british-council-a1-a2-vocabulary': freeze({
    id: 'british-council-a1-a2-vocabulary',
    publisher: 'British Council LearnEnglish',
    title: 'A1-A2 vocabulary',
    url: 'https://learnenglish.britishcouncil.org/free-resources/vocabulary/a1-a2',
    note: 'Topic-based beginner vocabulary reference covering actions, everyday objects, school, homes, transport, weather and other high-frequency domains.',
  }),
  'british-council-b1-b2-vocabulary': freeze({
    id: 'british-council-b1-b2-vocabulary',
    publisher: 'British Council LearnEnglish',
    title: 'B1-B2 vocabulary',
    url: 'https://learnenglish.britishcouncil.org/free-resources/vocabulary/b1-b2',
    note: 'Intermediate vocabulary reference used as a breadth benchmark for progression into more precise real-world lexical domains.',
  }),
  'british-council-everyday-objects': freeze({
    id: 'british-council-everyday-objects',
    publisher: 'British Council LearnEnglish',
    title: 'Everyday objects',
    url: 'https://learnenglish.britishcouncil.org/free-resources/vocabulary/a1-a2/everyday-objects',
    note: 'Topic-level vocabulary reference showing beginner practice with familiar objects and retrieval through repeated exercises.',
  }),
  'british-council-daily-routine': freeze({
    id: 'british-council-daily-routine',
    publisher: 'British Council LearnEnglish',
    title: 'Daily routine vocabulary',
    url: 'https://learnenglish.britishcouncil.org/free-resources/vocabulary/a1-a2/daily-routine-vocabulary-a1-beginner-english-vocabulary-lesson',
    note: 'Topic-level reference for useful daily-routine expressions and practice that connects vocabulary to real-life use and sequence.',
  }),
  'british-council-school': freeze({
    id: 'british-council-school',
    publisher: 'British Council LearnEnglish',
    title: 'School',
    url: 'https://learnenglish.britishcouncil.org/free-resources/vocabulary/a1-a2/school',
    note: 'Topic-level learner reference for vocabulary connected to school objects and school contexts.',
  }),
  'cambridge-thesaurus': freeze({
    id: 'cambridge-thesaurus',
    publisher: 'Cambridge Dictionary',
    title: 'Cambridge English Thesaurus',
    url: 'https://dictionary.cambridge.org/thesaurus/',
    note: 'Corpus-informed reference for synonyms, antonyms, usage differences, register and shades of meaning.',
  }),
  'cambridge-angry-thesaurus': freeze({
    id: 'cambridge-angry-thesaurus',
    publisher: 'Cambridge Dictionary',
    title: 'Synonyms and antonyms of angry',
    url: 'https://dictionary.cambridge.org/thesaurus/angry',
    note: 'Topic-level thesaurus reference illustrating intensity and meaning differences across emotion words such as annoyed, irritated, frustrated and furious.',
  }),
  'cambridge-calm-thesaurus': freeze({
    id: 'cambridge-calm-thesaurus',
    publisher: 'Cambridge Dictionary',
    title: 'Synonyms and antonyms of calm',
    url: 'https://dictionary.cambridge.org/thesaurus/calm',
    note: 'Topic-level thesaurus reference for distinguishing nearby emotion and personality vocabulary rather than treating all synonyms as interchangeable.',
  }),
  'cambridge-word-formation': freeze({
    id: 'cambridge-word-formation',
    publisher: 'Cambridge Dictionary',
    title: 'Word formation',
    url: 'https://dictionary.cambridge.org/grammar/british-grammar/word-formation',
    note: 'Grammar reference explaining major word-formation processes including prefixes, suffixes, conversion and compounds.',
  }),
  'reading-rockets-context-clues': freeze({
    id: 'reading-rockets-context-clues',
    publisher: 'Reading Rockets',
    title: 'Using Context Clues to Understand Word Meanings',
    url: 'https://www.readingrockets.org/topics/vocabulary/articles/using-context-clues-understand-word-meanings',
    note: 'Literacy reference for teaching children to infer unfamiliar word meanings from surrounding definitions, examples, contrast and other contextual evidence.',
  }),
  'reading-rockets-vocabulary-guidelines': freeze({
    id: 'reading-rockets-vocabulary-guidelines',
    publisher: 'Reading Rockets',
    title: 'Vocabulary: Instructional Guidelines and Classroom Examples',
    url: 'https://www.readingrockets.org/topics/vocabulary/articles/vocabulary-instructional-guidelines-and-classroom-examples',
    note: 'Literacy reference supporting explicit vocabulary teaching, word-family work and careful use of context clues rather than unsupported guessing.',
  }),
  'eef-vocabulary': freeze({
    id: 'eef-vocabulary',
    publisher: 'Education Endowment Foundation',
    title: 'Vocabulary',
    url: 'https://educationendowmentfoundation.org.uk/reading-house/vocabulary',
    note: 'Evidence-informed reference describing receptive and expressive vocabulary and the need to embed recently taught words for secure understanding and use.',
  }),
});

export function getVocabularyAuthoritySources(ids = []) {
  return ids.map((id) => {
    const source = VOCABULARY_AUTHORITY_SOURCES[id];
    if (!source) throw new Error(`Unknown Vocabulary authority source: ${id}`);
    return source;
  });
}
