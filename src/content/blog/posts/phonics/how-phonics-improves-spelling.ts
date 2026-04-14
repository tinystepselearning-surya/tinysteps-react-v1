import type { PhonicsSeoPost } from '../../types';

const post: PhonicsSeoPost = {
  slug: 'how-phonics-improves-spelling',
  title: 'How Phonics Improves Spelling: A Parent Encoding Roadmap',
  focus: 'how phonics improves spelling',
  quickAnswer: 'Phonics improves spelling when children learn encoding, not copying: hear sounds in order, choose matching graphemes, write, then verify. Repeated sound-to-print mapping builds orthographic memory and gradually reduces random spelling errors.',
  homePlan: [
    'Start with an error map each week: sound omission (letr for letter), order confusion (frmo for from), or pattern confusion (sed for said).',
    'Use a daily say-tap-spell-check loop on 5 target words: say the word, tap sounds, write, then read back and self-correct.',
    'Keep a 4+1 practice structure: four current-pattern words plus one old review word for cumulative retrieval.',
    'Add one short dictation sentence using target patterns so spelling transfers beyond isolated word lists.',
    'Track weekly outcomes in two columns: taught-word accuracy and unfamiliar-word pattern transfer.',
    'If transfer stalls, reduce new patterns and increase mixed review before introducing harder rules.'
  ],
  classChecklistFocus: 'Choose classes that diagnose spelling error types, teach explicit encoding routines, and use cumulative dictation with clear weekly transfer evidence.',
  avoidFocus: 'Avoid copy-and-rewrite drills as the main method. They can improve handwriting and short-term recall but often do not build independent spelling retrieval.',
  progress: 'Typical pattern: weeks 1-3 improve taught-word accuracy; weeks 4-6 reduce recurring sound-order mistakes; weeks 6-10 show stronger transfer to new words within taught patterns.',
  support: 'Seek structured support when spelling errors stay random after 6-8 weeks of consistent encoding practice, especially if sound discrimination and sequencing remain weak.',
  faq: [{
    question: 'Why can my child read a word but misspell it?',
    answer: 'Reading can rely on recognition cues, but spelling requires full sound sequence retrieval and pattern selection without the word in front of the child. That is why spelling typically needs extra encoding practice.'
  }, {
    question: 'Should I correct every spelling mistake?',
    answer: 'Prioritize one or two target patterns at a time. Correcting everything at once can overload working memory and reduce carryover.'
  }, {
    question: 'Is dictation better than copying for spelling growth?',
    answer: 'For most children, yes. Dictation forces sound analysis and recall, while copying can hide encoding gaps.'
  }, {
    question: 'How many words should we practise daily?',
    answer: 'Usually 5-6 focused words plus one short sentence is enough when routines are consistent and patterns are stage-appropriate.'
  }, {
    question: 'Why does spelling improve in class but not in school notebooks?',
    answer: 'Class gains may be context-bound. Add sentence-level dictation and unfamiliar-word checks to strengthen transfer into real writing tasks.'
  }, {
    question: 'When should I move to advanced spelling rules?',
    answer: 'Move forward when your child can encode current patterns with stable accuracy and low prompting over at least two review cycles.'
  }],
  relatedReads: [{
    label: 'Phonics rules for beginners',
    to: '/blog/phonics-rules-for-beginners'
  }, {
    label: 'CVC words explained for parents',
    to: '/blog/cvc-words-explained-for-parents'
  }, {
    label: 'How long phonics progress usually takes',
    to: '/blog/how-long-does-phonics-take'
  }, {
    label: 'How phonics builds reading confidence',
    to: '/blog/how-phonics-builds-reading-confidence'
  }]
};

export default post;
