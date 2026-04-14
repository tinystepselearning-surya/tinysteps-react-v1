import type { PhonicsSeoPost } from '../../types';

const post: PhonicsSeoPost = {
  slug: 'phonics-blending-activities',
  title: 'Phonics Blending Activities: Daily Drills That Fix Real Blending Gaps',
  focus: 'phonics blending activities',
  quickAnswer: 'Blending improves fastest when practice is structured and diagnostic: oral merge first, then printed word blending, then sentence transfer. The key is not more words, but the right drill for the exact blending error.',
  homePlan: [
    'Run a fixed 8-10 minute blending block: 3 minutes oral blending, 4 minutes print blending, 1-2 minutes sentence transfer.',
    'Use a small drill set per day (5-8 words) so your child can retry and stabilize accuracy before adding new patterns.',
    'Match drill to error type: sound-dropping -> slower sound taps; vowel confusion -> contrast pairs; guessing -> no-picture decodable words.',
    'Use one correction sequence: pause, model once, blend together once, then child retries independently.',
    'Track two daily metrics: blending accuracy and number of independent retries before adult help.',
    'If blending quality drops for 3-4 sessions, reduce word complexity for 2 days, then rebuild gradually.'
  ],
  classChecklistFocus: 'Pick classes that teach blending as a trainable process: slow-to-smooth blending, error-type correction, and weekly evidence on unfamiliar-word decoding.',
  avoidFocus: 'Avoid jumping to long words or passage reading before CVC and basic digraph blending are reliable. Avoid speed pressure before accuracy is stable.',
  progress: 'Common trajectory: weeks 1-2 better oral merges; weeks 2-4 cleaner CVC blending; weeks 4-8 stronger transfer to short sentence reading with less guessing.',
  support: 'Seek structured support if your child can name sounds but still cannot blend basic words after 6-8 weeks of consistent, stage-matched blending drills.',
  faq: [{
    question: 'Why does my child know sounds but still not blend?',
    answer: 'Sound recall and blending are separate skills. Blending needs sequential sound holding plus merge practice, which must be taught explicitly.'
  }, {
    question: 'Should I correct blending instantly?',
    answer: 'Give a short pause first, then model once and prompt a retry. This builds self-correction rather than dependency.'
  }, {
    question: 'How many words should I use in one blending activity?',
    answer: 'Usually 5-8 words is enough per drill block. Too many words often reduces correction quality and carryover.'
  }, {
    question: 'My child blends in drills but guesses in books. Why?',
    answer: 'Transfer is not yet stable. Add short no-picture decodable lines immediately after drills so blending applies to connected text.'
  }, {
    question: 'Should I blend letter names or letter sounds?',
    answer: 'Blend letter sounds. Letter-name blending usually slows decoding and can create confusion for beginners.'
  }, {
    question: 'When should I introduce longer words?',
    answer: 'Introduce longer words only after basic CVC and common digraph blending are accurate with low prompting across several sessions.'
  }],
  relatedReads: [{
    label: 'How kids learn blending',
    to: '/blog/how-kids-learn-blending'
  }, {
    label: 'Phonics activities at home',
    to: '/blog/phonics-activities-for-kids-at-home'
  }, {
    label: 'Child knows ABC but cannot read',
    to: '/blog/child-knows-abc-but-cannot-read'
  }, {
    label: 'How phonics builds reading confidence',
    to: '/blog/how-phonics-builds-reading-confidence'
  }]
};

export default post;
