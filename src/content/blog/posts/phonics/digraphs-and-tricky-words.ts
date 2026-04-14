import type { PhonicsSeoPost } from '../../types';

const post: PhonicsSeoPost = {
  slug: 'digraphs-and-tricky-words',
  title: 'Digraphs and Tricky Words: What to Decode and What to Memorize',
  focus: 'digraphs and tricky words',
  quickAnswer: 'Digraphs are fully decodable sound patterns (sh, ch, th, wh, ng), while tricky words are words with one or more parts that are not yet decodable for your child. Progress improves when parents decode regular parts and memorize only the truly irregular part.',
  homePlan: [
    'Teach one digraph set at a time and practise it in 5-8 words before mixing with new sets.',
    'Split tricky words into "can decode" and "must remember" parts (for example in "said," /s/ and /d/ are regular, "ai" is the tricky part).',
    'Use two lists daily: decodable digraph words and a short tricky-word memory set (3-5 words).',
    'Run a read-spell-transfer loop: decode digraph words, then dictate one short sentence containing one tricky word.',
    'Review tricky words cumulatively across the week instead of replacing the whole list daily.',
    'If confusion increases, pause new tricky words and reinforce one digraph family until decoding is stable again.'
  ],
  classChecklistFocus: 'Choose programs that teach digraph decoding explicitly, introduce tricky words in controlled sets, and explain which parts are regular vs irregular.',
  avoidFocus: 'Avoid calling every high-frequency word "tricky." Over-labeling reduces decoding effort and increases guessing habits.',
  progress: 'Typical gains include faster digraph chunk recognition in 2-4 weeks and improved accuracy on mixed decodable/tricky word sentences in 4-8 weeks.',
  support: 'If your child keeps guessing or cannot retain small tricky-word sets after 6-8 weeks, reduce list size and use structured review with explicit part-marking.',
  faq: [{
    question: 'How many tricky words should we teach each week?',
    answer: 'Usually 3-5 words with high cumulative review is more effective than large rotating lists.'
  }, {
    question: 'Should tricky words be spelled from memory?',
    answer: 'Yes, but first mark regular and irregular parts so memory has structure rather than pure visual recall.'
  }, {
    question: 'Should digraphs and tricky words be taught in the same lesson?',
    answer: 'Yes, but keep the roles clear: decode digraph words by sound and treat tricky words as controlled exceptions.'
  }, {
    question: 'Why does my child read digraph words but fail on tricky words?',
    answer: 'This is common. Digraphs rely on decoding, while tricky words need partial memory support. Keep tricky-word lists short and reviewed daily.'
  }, {
    question: 'Can picture cues help with tricky words?',
    answer: 'Use picture cues lightly. Prioritize letter-by-letter attention and explicit marking of the irregular part to build durable recall.'
  }, {
    question: 'When should we add new digraph families?',
    answer: 'Add new families only after current digraph words are read accurately with low prompting across multiple sessions.'
  }],
  relatedReads: [{
    label: 'Phonics rules for beginners',
    to: '/blog/phonics-rules-for-beginners'
  }, {
    label: 'Long vowel sounds for kids',
    to: '/blog/long-vowel-sounds-for-kids'
  }, {
    label: 'How phonics improves spelling',
    to: '/blog/how-phonics-improves-spelling'
  }, {
    label: 'CVC words explained for parents',
    to: '/blog/cvc-words-explained-for-parents'
  }]
};

export default post;
