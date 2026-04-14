import type { PhonicsSeoPost } from '../../types';

const post: PhonicsSeoPost = {
  slug: 'child-knows-abc-but-cannot-read',
  title: 'My Child Knows ABC but Cannot Read: What Parents Should Do Next',
  focus: 'child knows ABC but cannot read',
  quickAnswer: 'If your child knows A-B-C but still cannot read words, the gap is usually not intelligence or effort. It is a reading-stage mismatch: many children know letter names, but they have not yet secured letter sounds, blending, and decodable reading habits. Start by identifying the exact break point, then practise that one step daily with short, calm phonics routines.',
  homePlan: [
    'Run a 3-minute parent self-check before practice: (1) sound recall on 8 lowercase letters, (2) oral blending of 3 words like /m/ /a/ /t/, (3) reading 5 no-picture CVC words.',
    'Interpret results quickly: names-not-sounds usually means sound-mapping gap; sounds-but-no-blending means sequencing gap; first-letter or picture guessing means decoding stamina is weak; refusal/avoidance often means confidence load is high.',
    'Start this week with one focused routine only: 2 minutes sound review, 4 minutes blending, 4 minutes decodable reading. Keep the same pattern for 7 days before changing materials.',
    'Use tightly controlled practice words (for example: mat, sat, pin, top, sun) and ask for full left-to-right decoding before your child says the word.',
    'After each session, note one signal in a parent log: accurate sounds, smoother blending, reduced guessing, or lower avoidance. This tells you what to teach next.',
    'If blending improves but sentence reading still stalls, add one short decodable sentence daily and ask one meaning question after reading.',
    'If no improvement appears after 2-3 weeks of consistent practice, move from home-only practice to structured guided support.'
  ],
  classChecklistFocus: 'Ask whether the teacher can identify your child’s exact break point (sound recall, blending, or decodable reading), then show a plan to fix that step first rather than reteaching everything at once.',
  avoidFocus: 'Do not rely on alphabet recitation, picture clues, or random app play as your main reading method. Do not push harder books before your child can decode short decodable words accurately.',
  progress: 'In the first 1-2 weeks, parents should usually see clearer sound recall and less random guessing. By weeks 3-4, many children can decode a small set of unfamiliar CVC words more steadily when routines stay consistent.',
  support: 'Seek structured phonics support when your child can name letters but still cannot blend basic words after 6-8 weeks of consistent practice, or when reading avoidance keeps increasing despite low-pressure routines.',
  faq: [{
    question: 'My child can say A to Z but cannot read simple words. Is this normal?',
    answer: 'Yes, this is common. Alphabet recitation and word reading are different skills. Reading needs sound mapping plus blending, not letter names alone.'
  }, {
    question: 'How do I know whether the real issue is sounds or blending?',
    answer: 'Do a quick split test: ask for letter sounds in isolation, then ask for oral blending. If sounds are correct but blending fails, teach blending directly. If sounds are inconsistent, rebuild sound recall first.'
  }, {
    question: 'My child guesses from pictures or the first letter. What should I do?',
    answer: 'Switch to decodable text with minimal picture support for practice sessions. Use the prompt: "Show me each sound, then blend." This retrains decoding habits.'
  }, {
    question: 'How much phonics screen time is useful for this problem?',
    answer: 'Short, targeted use can help, but games should support the exact weak skill and transfer to print reading. Keep game time limited and follow with real-word or sentence decoding.'
  }, {
    question: 'When are games and home practice not enough?',
    answer: 'If your child still cannot blend basic words after several weeks of consistent guided practice, or anxiety rises around reading, move to structured phonics instruction with clear progress checks.'
  }, {
    question: 'Should I teach sight words first if blending is hard?',
    answer: 'Use a small sight-word set only as support. Keep decoding and blending as the core, because that is what enables independent reading of new words.'
  }],
  relatedReads: [{
    label: 'Phonics for parents: full decision guide',
    to: '/blog/phonics-for-parents-guide'
  }, {
    label: 'How phonics builds reading confidence',
    to: '/blog/how-phonics-builds-reading-confidence'
  }, {
    label: 'Broader reading difficulty triage',
    to: '/child-not-reading-properly'
  }, {
    label: 'If pace and fluency are the main issue',
    to: '/slow-reader-child-help'
  }]
};

export default post;
