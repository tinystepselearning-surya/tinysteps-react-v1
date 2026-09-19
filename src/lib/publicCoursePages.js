const PHONICS_STAGE_SEQUENCE = [
  {
    name: 'Phonics Foundations',
    routePath: '/courses/phonics-foundation',
    level: 'Foundation',
    summary: 'Build letter-sound knowledge, oral blending, CVC decoding, early spelling, and reading readiness.',
  },
  {
    name: 'Early Phonics',
    routePath: '/courses/phonics-brush-up',
    level: 'Early',
    summary: 'Extend decoding through digraphs, long vowels, vowel teams, core phonics rules, and more systematic spelling.',
  },
  {
    name: 'Advanced Phonics',
    routePath: '/courses/phonics-advanced',
    level: 'Advanced',
    summary: 'Apply advanced sound patterns to longer words, spelling, connected reading, and smoother fluency.',
  },
];

const SPEAKING_LEVEL_SEQUENCE = [
  {
    name: 'Public Speaking Foundations',
    routePath: '/courses/public-speaking-foundations',
    level: 'Basic',
    summary: 'Build organised responses, picture talk, show-and-tell, simple storytelling, clear expression, and short presentation readiness.',
  },
  {
    name: 'Public Speaking Excellence',
    routePath: '/courses/public-speaking-excellence',
    level: 'Advanced',
    summary: 'Extend into longer structured talks, storytelling, presentations, guided debate, audience awareness, and stronger delivery.',
  },
];

export const PUBLIC_COURSE_PAGE_CONFIGS = [
  {
    internalSlug: 'phonics-foundation',
    publicSlug: 'phonics-foundation',
    routePath: '/courses/phonics-foundation',
    name: 'Phonics Foundations',
    h1: 'Phonics Foundation Course for Kids | Beginner Phonics Classes',
    title: 'Phonics Foundation Course for Kids | Beginner Phonics | Tiny Steps',
    description:
      'Live 1:1 beginner phonics course for kids building letter sounds, oral blending, CVC decoding, early spelling, and reading readiness through 31 structured lessons.',
    educationalLevel: 'Foundation',
    track: 'phonics',
    breadcrumbName: 'Phonics Foundation',
    teaches: [
      'letter-sound correspondence',
      'phonemic awareness',
      'oral blending',
      'CVC word decoding',
      'segmenting for early spelling',
      'early reading readiness',
    ],
    keywords: [
      'phonics foundation course',
      'phonics foundation classes',
      'beginner phonics course',
      'phonics course for beginners',
      'beginner phonics classes for kids',
      'online phonics course for beginners',
      'synthetic phonics course for kids',
      'letter sounds and blending course',
      'CVC reading course for kids',
      'phonics classes for ages 3 to 7',
      'online phonics classes for ages 3 to 7',
    ],
    legacySlugs: ['phonics-foundations'],
    stageAuthority: {
      title: 'Is Phonics Foundations the right starting stage for my child?',
      directAnswer:
        'Phonics Foundations is the beginner stage for children who still need secure letter-sound links, oral blending, CVC decoding, and early spelling. Placement is based on what the child can do during assessment, not age alone.',
      entrySignals: [
        'Knows some letter names but cannot reliably give the matching sounds.',
        'Can say individual sounds but cannot yet blend them into a word.',
        'Guesses short words from pictures or memory instead of decoding them.',
        'Needs a structured first pathway into CVC reading and early spelling.',
      ],
      skillsBuilt: [
        'Hear, identify, and recall core speech sounds.',
        'Connect sounds to written letters and graphemes.',
        'Blend sounds to read simple CVC words.',
        'Segment short words to support early spelling.',
        'Move from isolated sounds into short decodable reading practice.',
      ],
      exitSignals: [
        'Recalls the core sounds taught with growing automaticity.',
        'Blends and decodes simple CVC words with less prompting.',
        'Segments familiar short words for spelling with improving accuracy.',
        'Is ready to extend into digraphs, vowel patterns, and broader phonics rules.',
      ],
      sequence: PHONICS_STAGE_SEQUENCE,
    },
    relatedLinks: [
      { label: 'See the complete Tiny Steps phonics program', to: '/phonics' },
      { label: 'Continue to Early Phonics', to: '/courses/phonics-brush-up' },
      { label: 'View the full curriculum roadmap', to: '/curriculum' },
      { label: 'What is phonics for kids?', to: '/blog/what-is-phonics-for-kids' },
      { label: 'Why letter sounds alone are not enough to read', to: '/blog/why-letter-sounds-are-not-enough-to-read' },
      { label: 'How kids learn blending', to: '/blog/how-kids-learn-blending' },
      { label: 'Book one free 35-minute 1:1 online demo assessment class', to: '/book-demo' },
    ],
    faq: [
      {
        question: 'What is a phonics foundation course?',
        answer:
          'A phonics foundation course is the beginner stage of structured phonics instruction. It builds sound awareness, letter-sound correspondence, oral blending, CVC decoding, early segmenting for spelling, and the first habits needed for independent word reading.',
      },
      {
        question: 'Who is the phonics foundation course best for?',
        answer:
          'It is best for children who are still building sound-letter links, early blending, CVC decoding, and confidence with short decodable words. A child may know ABC names and still need this stage if they cannot yet blend sounds to read.',
      },
      {
        question: 'Does my child need Foundation Phonics if they already know the alphabet?',
        answer:
          'Possibly. Knowing alphabet names is different from using speech sounds to decode. If a child knows ABC but cannot blend sounds, read simple CVC words, or segment short words for spelling, Foundation Phonics may still be the appropriate starting stage.',
      },
      {
        question: 'What does a child learn first in phonics foundation?',
        answer:
          'Children begin by hearing and identifying sounds, connecting those sounds to letters, practising oral blending, and reading simple CVC words before moving into more independent decoding and early spelling.',
      },
      {
        question: 'How long does the Tiny Steps Phonics Foundations course take?',
        answer:
          'The published Foundation curriculum contains 31 lessons, but completion time is not fixed. Tiny Steps uses assessment-led placement and a flexible pace, so revision or progression can be adjusted to the child’s readiness.',
      },
      {
        question: 'What comes after the phonics foundation stage?',
        answer:
          'Children who can recall core sounds, blend and decode simple words, and segment short words more independently can move into Early Phonics, where they begin broader patterns such as digraphs, long vowels, vowel teams, and additional phonics rules.',
      },
      {
        question: 'Is phonics placement based only on age?',
        answer:
          'No. The age range is a guide, but placement should follow demonstrated reading readiness. Tiny Steps uses the assessment to decide whether a child needs Foundation, Early, or Advanced Phonics rather than moving children forward only because of age.',
      },
      {
        question: 'How can parents support this course at home?',
        answer:
          'Short, low-pressure review is usually more useful than long drills. Parents can revisit the sounds and blending patterns already taught in class and use brief decodable reading practice without introducing harder patterns too early.',
      },
    ],
  },
  {
    internalSlug: 'phonics-brush-up',
    publicSlug: 'phonics-brush-up',
    routePath: '/courses/phonics-brush-up',
    name: 'Early Phonics',
    h1: 'Early Phonics Course for Kids | Digraphs, Long Vowels & Decoding',
    title: 'Early Phonics Course for Kids | Digraphs & Long Vowels | Tiny Steps',
    description:
      'Live 1:1 Early Phonics course for developing readers covering digraphs, long vowels, vowel teams, Magic E, core phonics rules, decoding, and spelling.',
    educationalLevel: 'Early',
    track: 'phonics',
    breadcrumbName: 'Early Phonics',
    teaches: [
      'digraph decoding',
      'long vowel patterns',
      'vowel teams',
      'Magic E',
      'core phonics rules',
      'pattern-based spelling',
      'developing reading fluency',
    ],
    keywords: [
      'early phonics course',
      'early phonics classes',
      'phonics course for developing readers',
      'intermediate phonics course for kids',
      'digraph classes for kids',
      'digraph phonics course',
      'long vowel phonics course',
      'vowel team phonics classes',
      'Magic E phonics classes',
      'phonics spelling course for kids',
      'phonics decoding classes for kids',
    ],
    stageAuthority: {
      title: 'When should a child move from Foundation to Early Phonics?',
      directAnswer:
        'Early Phonics is the next stage for children who can already handle basic sounds and simple word blending but are not yet secure with broader spelling patterns such as digraphs, long vowels, vowel teams, and other common phonics rules.',
      entrySignals: [
        'Recognises the core letter sounds with reasonable consistency.',
        'Can blend and decode simple CVC words but struggles as patterns become more complex.',
        'Needs explicit teaching for digraphs, long vowels, vowel teams, and rule-based spelling.',
        'Reads simple words but still guesses unfamiliar patterned words.',
      ],
      skillsBuilt: [
        'Decode common digraphs and broader grapheme patterns.',
        'Read and spell long-vowel patterns and vowel teams.',
        'Apply Magic E and other core phonics rules to unfamiliar words.',
        'Use pattern knowledge for both reading and spelling rather than memorising word lists.',
        'Build greater accuracy and confidence in phrases and connected reading.',
      ],
      exitSignals: [
        'Applies the main Early Phonics patterns across unfamiliar words with less prompting.',
        'Uses sound-pattern knowledge more consistently when spelling.',
        'Reads patterned words and short connected text with improving automaticity.',
        'Is ready for advanced sound families, longer words, and more demanding fluency work.',
      ],
      sequence: PHONICS_STAGE_SEQUENCE,
    },
    relatedLinks: [
      { label: 'Review Phonics Foundations', to: '/courses/phonics-foundation' },
      { label: 'Continue to Advanced Phonics', to: '/courses/phonics-advanced' },
      { label: 'Compare all phonics levels', to: '/phonics' },
      { label: 'View the full curriculum roadmap', to: '/curriculum' },
      { label: 'How kids learn blending', to: '/blog/how-kids-learn-blending' },
      { label: 'Digraphs and tricky words for parents', to: '/blog/digraphs-and-tricky-words' },
      { label: 'Book one free 35-minute 1:1 online demo assessment class', to: '/book-demo' },
    ],
    faq: [
      {
        question: 'Who is the Early Phonics course for?',
        answer:
          'Early Phonics fits children who know basic sounds and can blend simple words but still need explicit support with digraphs, long vowels, vowel teams, Magic E, broader phonics rules, and more consistent spelling.',
      },
      {
        question: 'How is Early Phonics different from Phonics Foundations?',
        answer:
          'Phonics Foundations builds the first decoding system: sound awareness, letter-sound links, blending, CVC reading, and early spelling. Early Phonics assumes those basics are developing and extends them into more complex grapheme patterns and phonics rules.',
      },
      {
        question: 'What does a child learn in Early Phonics?',
        answer:
          'The stage develops digraphs, long vowels, vowel teams, Magic E, additional phonics rules, stronger word decoding, spelling through sound patterns, and more confident connected reading.',
      },
      {
        question: 'Will Early Phonics help with spelling as well as reading?',
        answer:
          'Yes. Children practise using the same sound-pattern knowledge in both directions: decoding graphemes while reading and segmenting sounds to choose plausible spellings when writing.',
      },
      {
        question: 'Should my child start here just because they are older?',
        answer:
          'No. Age is only a guide. A child who is older but still cannot blend or decode simple CVC words may need Foundation work first, while a younger child with secure foundations may be ready for Early Phonics after assessment.',
      },
      {
        question: 'What comes after Early Phonics?',
        answer:
          'Children who can apply the main early patterns with growing independence can move into Advanced Phonics for more complex sound families, longer patterned words, multisyllabic decoding, spelling, and smoother reading fluency.',
      },
    ],
  },
  {
    internalSlug: 'phonics-advanced',
    publicSlug: 'phonics-advanced',
    routePath: '/courses/phonics-advanced',
    name: 'Advanced Phonics',
    h1: 'Advanced Phonics Course for Kids | Longer Words, Spelling & Fluency',
    title: 'Advanced Phonics Course for Kids | Spelling & Fluency | Tiny Steps',
    description:
      'Live 1:1 advanced phonics course for kids covering complex vowel patterns, controlling R, longer-word decoding, spelling patterns, and smoother reading fluency.',
    educationalLevel: 'Advanced',
    track: 'phonics',
    breadcrumbName: 'Advanced Phonics',
    teaches: [
      'advanced vowel patterns',
      'r-controlled vowel patterns',
      'advanced sound families',
      'multisyllabic decoding',
      'pattern-based spelling',
      'connected reading fluency',
    ],
    keywords: [
      'advanced phonics course',
      'advanced phonics classes for kids',
      'advanced phonics program for kids',
      'multisyllabic decoding course',
      'longer word reading classes',
      'advanced spelling patterns for kids',
      'reading fluency phonics support',
      'advanced vowel pattern classes',
      'r controlled vowel phonics classes',
      'phonics fluency course for kids',
    ],
    stageAuthority: {
      title: 'Who is ready for Advanced Phonics?',
      directAnswer:
        'Advanced Phonics is for children whose basic decoding system is already working but who still need explicit support with complex vowel patterns, advanced sound families, longer words, spelling conventions, and smoother connected reading.',
      entrySignals: [
        'Reads simple and many patterned words accurately but slows down on longer or less familiar words.',
        'Understands common early phonics patterns but is inconsistent with advanced vowel or R-controlled patterns.',
        'Needs a more systematic strategy for decoding multisyllabic words instead of guessing parts of them.',
        'Can decode but still needs stronger spelling transfer and smoother connected reading.',
      ],
      skillsBuilt: [
        'Apply advanced vowel patterns and sound families across unfamiliar words.',
        'Use R-controlled and other advanced phonics patterns more accurately.',
        'Break longer and multisyllabic words into manageable decoding units.',
        'Transfer advanced phonics knowledge into spelling.',
        'Read sentences and passages with greater accuracy, phrasing, and fluency.',
      ],
      exitSignals: [
        'Approaches unfamiliar longer words with a decoding strategy rather than guessing.',
        'Applies advanced spelling patterns with greater consistency.',
        'Reads connected text more smoothly because word recognition requires less effort.',
        'Is increasingly ready to focus beyond phonics on broader fluency and comprehension needs where appropriate.',
      ],
      sequence: PHONICS_STAGE_SEQUENCE,
    },
    relatedLinks: [
      { label: 'Review Early Phonics', to: '/courses/phonics-brush-up' },
      { label: 'See the complete Tiny Steps phonics program', to: '/phonics' },
      { label: 'View the full curriculum roadmap', to: '/curriculum' },
      { label: 'Reading fluency support', to: '/reading-fluency-program' },
      { label: 'How to help kids read multisyllabic words', to: '/blog/phonics-multisyllabic' },
      { label: 'Long vowel sounds for kids', to: '/blog/long-vowel-sounds-for-kids' },
      { label: 'Book one free 35-minute 1:1 online demo assessment class', to: '/book-demo' },
    ],
    faq: [
      {
        question: 'Who should join Advanced Phonics?',
        answer:
          'Advanced Phonics is for children who can already read simple and many patterned words but still need help with complex vowel patterns, advanced sound families, longer words, spelling conventions, and smoother connected reading.',
      },
      {
        question: 'How is Advanced Phonics different from Early Phonics?',
        answer:
          'Early Phonics establishes common digraphs, vowel patterns, Magic E, and core phonics rules. Advanced Phonics builds on that base with more complex sound families, longer-word and multisyllabic decoding, advanced spelling patterns, and fluency application.',
      },
      {
        question: 'Does Advanced Phonics teach children how to read longer words?',
        answer:
          'Yes. Children learn to apply known sound patterns and break longer words into manageable parts so they can decode systematically rather than guessing the whole word from its first letters or context.',
      },
      {
        question: 'Does Advanced Phonics include spelling support?',
        answer:
          'Yes. Advanced phonics connects reading and spelling so children practise hearing sound units, recognising likely patterns, and applying those patterns when spelling increasingly complex words.',
      },
      {
        question: 'Does Advanced Phonics include reading fluency?',
        answer:
          'Yes. Children apply decoding skills in sentences and connected reading so word recognition can become more automatic. If decoding is already secure and fluency is the main remaining difficulty, the dedicated reading fluency pathway may be a better fit.',
      },
      {
        question: 'What comes after Advanced Phonics?',
        answer:
          'There is no automatic next phonics level. Once advanced decoding and spelling patterns are secure, the next priority depends on the child: some need continued reading fluency work, while others are ready to focus more heavily on comprehension, vocabulary, or broader English skills.',
      },
      {
        question: 'Is Advanced Phonics placement based only on age?',
        answer:
          'No. The published age range is a guide. Tiny Steps uses assessment-led placement because an older child may still need earlier decoding work, while another child may be ready for advanced patterns sooner.',
      },
    ],
  },
  {
    internalSlug: 'basic-grammar',
    publicSlug: 'grammar',
    routePath: '/courses/grammar',
    name: 'Beginner Grammar',
    h1: 'Beginner Grammar Classes for Kids',
    title: 'Beginner Grammar Classes for Kids | Tiny Steps',
    description:
      'Build strong sentence basics with live beginner grammar classes covering nouns, verbs, punctuation, sentence formation, and early writing accuracy.',
    educationalLevel: 'Beginner',
    track: 'grammar',
    breadcrumbName: 'Grammar Foundations',
    keywords: [
      'beginner grammar classes for kids',
      'sentence formation classes for children',
      'grammar basics online classes',
    ],
    legacySlugs: ['grammar-essentials', 'basic-grammar'],
    relatedLinks: [
      { label: 'Parent course chooser', to: '/parents/choosing-course' },
      { label: 'Grammar roadmap for parents', to: '/blog/grammar-nouns-to-paragraphs' },
      { label: 'Book one free 35-minute 1:1 online demo assessment class', to: '/book-demo' },
    ],
    faq: [
      {
        question: 'Who is beginner grammar for?',
        answer:
          'It is best for children who read but still make frequent sentence mistakes, struggle with punctuation, or need clearer written expression.',
      },
      {
        question: 'What skills improve first in beginner grammar?',
        answer:
          'Children usually begin by improving sentence structure, grammar basics, and simple writing accuracy before moving into more complex expression.',
      },
      {
        question: 'Can grammar support help school writing too?',
        answer:
          'Yes. Stronger grammar habits help children write clearer classwork, homework answers, and short paragraphs with more confidence.',
      },
    ],
  },
  {
    internalSlug: 'advanced-grammar',
    publicSlug: 'grammar-mastery',
    routePath: '/courses/grammar-mastery',
    name: 'Advanced Grammar',
    h1: 'Grammar Mastery Classes for Stronger Writing',
    title: 'Grammar Mastery Classes for Kids | Tiny Steps',
    description:
      'Learners progress from basic grammar knowledge to confident, accurate speaking and independent writing, with stronger sentence structure, tense control, clarity, fluency, and self-editing skills.',
    educationalLevel: 'Advanced',
    track: 'grammar',
    breadcrumbName: 'Grammar Mastery',
    keywords: [
      'advanced grammar classes for kids',
      'grammar mastery classes',
      'writing support for children',
    ],
    legacySlugs: ['advanced-grammar'],
    relatedLinks: [
      { label: 'Track your child’s progress', to: '/parents/tracking-progress' },
      { label: 'Common grammar mistakes parents notice', to: '/parents/common-mistakes' },
      { label: 'Book one free 35-minute 1:1 online demo assessment class', to: '/book-demo' },
    ],
    faq: [
      {
        question: 'When does a child need grammar mastery instead of beginner grammar?',
        answer:
          'Grammar mastery fits children who already know basics but still struggle with tenses, sentence control, editing, and clear written structure.',
      },
      {
        question: 'Does this course help with paragraph writing?',
        answer:
          'Yes. Children practise writing more clearly, editing mistakes, and organizing ideas into stronger sentences and paragraphs.',
      },
    ],
  },
  {
    internalSlug: 'basic-public-speaking',
    publicSlug: 'public-speaking-foundations',
    routePath: '/courses/public-speaking-foundations',
    name: 'Public Speaking (Basic)',
    h1: 'Public Speaking Foundations for Kids',
    title: 'Public Speaking Foundations for Kids | Tiny Steps',
    description:
      'Live 1:1 Public Speaking Foundations for ages 4–7, building organised responses, picture talk, show-and-tell, simple storytelling, clear expression, and short presentation readiness.',
    educationalLevel: 'Beginner',
    track: 'speaking',
    breadcrumbName: 'Public Speaking Foundations',
    teaches: [
      'organised spoken responses',
      'picture talk',
      'show and tell',
      'simple storytelling',
      'clear voice and expression',
      'short presentation structure',
      'guided question and answer',
    ],
    areaServed: ['India', 'Worldwide'],
    keywords: [
      'public speaking foundations for kids',
      'basic public speaking classes for kids',
      'show and tell classes online',
      'public speaking classes ages 4 to 7',
    ],
    legacySlugs: ['basic-public-speaking'],
    stageAuthority: {
      title: 'Is Public Speaking Foundations the right starting level for my child?',
      directAnswer:
        'Public Speaking Foundations is the first Tiny Steps Public Speaking level for children who can communicate basic ideas but need more structure, organisation, expression, and practice with picture talk, show-and-tell, storytelling, and short presentations. Placement is based on readiness as well as age.',
      prerequisiteNote:
        'No previous Public Speaking course is required. The child should have enough spoken language to attempt familiar responses. If everyday conversation, sentence formation, or speaking confidence itself is the main barrier, the assessment may recommend Spoken English, Grammar, or the specialist Confidence Building pathway before or alongside Public Speaking.',
      entrySignals: [
        'Can communicate familiar ideas in short spoken responses, with or without light prompting.',
        'Needs help organising an answer instead of giving disconnected details.',
        'Is ready to practise picture talk, show-and-tell, simple storytelling, and short speaking tasks.',
        'Benefits from clear models, guided retries, and predictable presentation structure.',
      ],
      skillsBuilt: [
        'Organise short responses around one clear idea.',
        'Use picture talk and show-and-tell to add relevant detail.',
        'Sequence simple stories with a clearer beginning, middle, and end.',
        'Use voice, pace, posture, and eye contact more intentionally.',
        'Deliver short prepared or guided talks and handle simple follow-up questions.',
      ],
      exitSignals: [
        'Can sustain a short 30–60 second talk on a familiar topic with less prompting.',
        'Organises familiar ideas into a simple sequence or structure.',
        'Uses clearer delivery and can respond to simple follow-up questions.',
        'Is ready for longer speeches, richer storytelling, presentations, impromptu speaking, and guided debate.',
      ],
      sequence: SPEAKING_LEVEL_SEQUENCE,
      progressionTitle: 'Tiny Steps Public Speaking progression',
      progressionDescription:
        'Foundations and Excellence are readiness-based Public Speaking levels. Age is a guide, while assessment considers response organisation, storytelling, presentation readiness, delivery, and how much prompting the child needs.',
      providerNote:
        'Live classes are delivered by Tiny Steps teachers within the Tiny Steps academic system. Teacher assignment can vary by schedule and learning fit; the curriculum and progression stay shared.',
      teachingMethod:
        'Teachers model the speaking task, guide one attempt, give specific feedback, invite a retry, and gradually reduce support as the child becomes more independent.',
    },
    relatedLinks: [
      { label: 'See the complete Speaking & Communication programme', to: '/speaking' },
      { label: 'Continue to Public Speaking Excellence', to: '/courses/public-speaking-excellence' },
      { label: 'Everyday conversation support: Spoken English', to: '/spoken-english-classes-for-kids-online' },
      { label: 'Specialist confidence support', to: '/confidence-building-program-kids' },
      { label: 'View real class samples', to: '/class-samples' },
      { label: 'Meet the Tiny Steps academic team', to: '/team' },
      { label: 'Book one free 35-minute 1:1 online English assessment', to: '/book-demo' },
    ],
    faq: [
      {
        question: 'Who should start with Public Speaking Foundations?',
        answer:
          'This level suits children who can already communicate basic ideas but need more structure, organisation, expression, and practice with speaking tasks such as picture talk, show-and-tell, storytelling, and short presentations.',
      },
      {
        question: 'Does a child need Spoken English before Public Speaking Foundations?',
        answer:
          'Not automatically. If everyday conversational fluency or sentence formation is the main gap, Spoken English or Grammar may be the better first or parallel pathway. If the child can communicate basic ideas and mainly needs public-speaking structure and delivery practice, Foundations may be appropriate.',
      },
      {
        question: 'What comes after Public Speaking Foundations?',
        answer:
          'Children who can sustain short organised talks, tell simple stories, respond to follow-up questions, and use clearer delivery with less prompting may be ready for Public Speaking Excellence. Placement is confirmed through assessment rather than age alone.',
      },
      {
        question: 'What if confidence itself is the main barrier?',
        answer:
          'If the child has enough language and structure but hesitation, participation comfort, or dependence on prompting is the primary difficulty across situations, the specialist Confidence Building programme may be a clearer fit.',
      },
    ],
  },
  {
    internalSlug: 'advanced-public-speaking',
    publicSlug: 'public-speaking-excellence',
    routePath: '/courses/public-speaking-excellence',
    name: 'Public Speaking (Advanced)',
    h1: 'Public Speaking Excellence for Kids',
    title: 'Public Speaking Excellence for Kids | Tiny Steps',
    description:
      'Live 1:1 advanced Public Speaking for ages 7–12, developing longer structured talks, storytelling, presentations, impromptu speaking, guided debate, audience awareness, and stronger delivery.',
    educationalLevel: 'Advanced',
    track: 'speaking',
    breadcrumbName: 'Public Speaking Excellence',
    teaches: [
      'structured speeches',
      'storytelling and retelling',
      'presentation planning',
      'impromptu speaking',
      'guided debate and opinion speaking',
      'audience awareness',
      'voice modulation and delivery',
      'question and answer handling',
    ],
    areaServed: ['India', 'Worldwide'],
    keywords: [
      'advanced public speaking classes for kids',
      'presentation skills for children',
      'storytelling and debate classes online',
      'public speaking classes ages 7 to 12',
    ],
    legacySlugs: ['advanced-public-speaking'],
    stageAuthority: {
      title: 'Is Public Speaking Excellence the right level for my child?',
      directAnswer:
        'Public Speaking Excellence is the advanced Tiny Steps Public Speaking level for children who can already organise familiar responses and are ready for longer speeches, richer storytelling, presentations, impromptu speaking, guided debate, and stronger audience-facing delivery.',
      prerequisiteNote:
        'Children may arrive from Public Speaking Foundations or demonstrate equivalent readiness during assessment. The useful prerequisite is not a certificate from the earlier level; it is the ability to communicate organised ideas, sustain a short talk, and respond to feedback with growing independence.',
      entrySignals: [
        'Can sustain a short organised talk on a familiar topic.',
        'Can sequence a simple story or explanation with reasonable clarity.',
        'Can respond to basic follow-up questions without needing the full answer supplied.',
        'Is ready for longer talks, presentations, impromptu prompts, opinion speaking, and guided debate.',
      ],
      skillsBuilt: [
        'Plan and deliver longer structured speeches with clearer openings, details, and conclusions.',
        'Use storytelling, examples, and reasons to develop ideas for an audience.',
        'Practise presentations, impromptu speaking, opinion sharing, and guided debate.',
        'Use voice modulation, pace, eye contact, and audience awareness more deliberately.',
        'Handle follow-up questions and adjust a response after feedback.',
      ],
      exitSignals: [
        'Can plan and deliver a structured 1–2 minute talk with less teacher prompting.',
        'Transfers speaking structure to fresh topics, stories, presentations, and opinion prompts.',
        'Handles short question-and-answer exchanges with clearer reasoning and delivery.',
        'Can continue advanced practice based on individual goals rather than needing another invented Public Speaking level.',
      ],
      sequence: SPEAKING_LEVEL_SEQUENCE,
      progressionTitle: 'Tiny Steps Public Speaking progression',
      progressionDescription:
        'Foundations and Excellence are the two published Public Speaking levels. Children can enter Excellence after completing Foundations or by demonstrating equivalent readiness during assessment.',
      providerNote:
        'Live classes are delivered by Tiny Steps teachers within the Tiny Steps academic system. Teacher assignment can vary by schedule and learning fit; the curriculum and progression stay shared.',
      teachingMethod:
        'Teachers model structure and delivery, use guided practice and feedback, ask the child to retry, and then move the skill into fresh speeches, stories, presentations, questions, or debate-style prompts.',
    },
    relatedLinks: [
      { label: 'Review Public Speaking Foundations', to: '/courses/public-speaking-foundations' },
      { label: 'See the complete Speaking & Communication programme', to: '/speaking' },
      { label: 'Everyday conversation support: Spoken English', to: '/spoken-english-classes-for-kids-online' },
      { label: 'Specialist confidence support', to: '/confidence-building-program-kids' },
      { label: 'View real class samples', to: '/class-samples' },
      { label: 'Meet the Tiny Steps academic team', to: '/team' },
      { label: 'Book one free 35-minute 1:1 online English assessment', to: '/book-demo' },
    ],
    faq: [
      {
        question: 'When is a child ready for Public Speaking Excellence?',
        answer:
          'This level suits children who can already organise familiar responses, sustain a short talk, tell a simple story, and use feedback, and who are ready for longer speeches, presentations, impromptu prompts, and guided debate.',
      },
      {
        question: 'Must a child complete Public Speaking Foundations first?',
        answer:
          'No. Foundations is the normal earlier level, but placement is readiness-based. A child can enter Excellence if the assessment shows equivalent speaking structure, independence, and presentation readiness.',
      },
      {
        question: 'Does the advanced course include speeches and debate practice?',
        answer:
          'Yes. Children work on structured talks, storytelling, presentations, impromptu speaking, opinion sharing, and guided debate-style tasks with feedback on organisation, reasoning, expression, and delivery.',
      },
      {
        question: 'What comes after Public Speaking Excellence?',
        answer:
          'Tiny Steps does not publish a third Public Speaking level. After Excellence, the next priority depends on the child’s goals and observed needs, such as continued advanced speaking practice, specific presentation goals, everyday Spoken English, or specialist confidence support.',
      },
    ],
  },
];

function normalizeSlug(slug) {
  return String(slug || '').trim().toLowerCase();
}

const bySlug = new Map();

for (const config of PUBLIC_COURSE_PAGE_CONFIGS) {
  bySlug.set(normalizeSlug(config.publicSlug), config);
  bySlug.set(normalizeSlug(config.internalSlug), config);
  for (const legacySlug of config.legacySlugs || []) {
    bySlug.set(normalizeSlug(legacySlug), config);
  }
}

export function resolvePublicCoursePageBySlug(slug) {
  return bySlug.get(normalizeSlug(slug)) || null;
}

export function getPublicCoursePathForSlug(slug) {
  const config = resolvePublicCoursePageBySlug(slug);
  return config?.routePath || null;
}

export function isCanonicalPublicCourseSlug(slug) {
  const config = resolvePublicCoursePageBySlug(slug);
  return Boolean(config) && normalizeSlug(slug) === normalizeSlug(config.publicSlug);
}

export function getPublicCourseRedirectTarget(slug) {
  const config = resolvePublicCoursePageBySlug(slug);
  if (!config) return null;
  return isCanonicalPublicCourseSlug(slug) ? null : config.routePath;
}

export function getPublicCourseSitemapPaths() {
  return PUBLIC_COURSE_PAGE_CONFIGS.map((config) => config.routePath);
}
