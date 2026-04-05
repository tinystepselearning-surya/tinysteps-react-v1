export type BlogPost = {
  slug: string;
  title: string;
  category: 'Phonics'|'Grammar'|'Public Speaking'|'Parent Tips'|'Research';
  author: string;
  date: string; // ISO date
  readTime: string;
  hero?: string; // image url
  metaDescription?: string;
  excerpt: string;
  body: { type: 'h2'|'h3'|'p'|'li'; content: string }[];
  faq?: { question: string; answer: string }[];
  viewsCount?: number;
  popularScore?: number;
};

type PhonicsSeoPost = {
  slug: string;
  title: string;
  focus: string;
  quickAnswer: string;
  homePlan: string[];
  classChecklistFocus: string;
  avoidFocus: string;
  progress: string;
  support: string;
  faq: { question: string; answer: string }[];
  relatedReads?: { label: string; to: string }[];
  readTime?: string;
};

type BlogBlock = { type: 'h2'|'h3'|'p'|'li'; content: string };

const PHONICS_BASE_FAQ = [
  {
    question: 'How often should parents do phonics at home?',
    answer: 'Aim for 10 minutes a day, 5-6 days a week. Short daily practice gives better results than one long weekend session.',
  },
  {
    question: 'What should I do if my child refuses phonics practice?',
    answer: 'Shrink the task to 2-3 minutes, switch to a game, and end with one success. Consistency with low pressure works better than forcing long sessions.',
  },
  {
    question: 'When should I seek extra support?',
    answer: 'If your child has regular practice for 6-8 weeks but still cannot match basic sounds or blend simple CVC words, get an assessment from a phonics specialist.',
  },
];

const PHONICS_BASE_CLASS_CHECKLIST = [
  'The program is systematic: sounds -> blending -> decodable reading -> spelling.',
  'Children read decodable text based on taught sounds, not picture guessing.',
  'Parents get weekly progress updates with clear home-practice goals.',
];

const PHONICS_BASE_MISTAKES = [
  'Do not switch methods every week; children need repeated routines to build automaticity.',
  'Do not rely only on worksheets; children need oral sound work and reading aloud.',
  'Do not over-correct every error; model once, retry, and praise effort quickly.',
];

const BLOG_PUBLICATION_DATES: Record<string, string> = {
  'week-1-phonics-satpin-launch': '2026-04-03',
  'satpin-phonics-guide': '2025-11-06',
  'what-age-to-start-phonics': '2025-11-08',
  'what-is-phonics-for-kids': '2025-11-10',
  'phonics-rules-for-beginners': '2025-11-12',
  'week-2-phonics-blending-club': '2025-11-14',
  'phonics-blending-activities': '2025-11-16',
  'how-kids-learn-blending': '2025-11-18',
  'cvc-words-explained-for-parents': '2025-11-20',
  'phonics-games-for-letter-sounds': '2025-11-22',
  'phonics-activities-for-kids-at-home': '2025-11-24',
  'best-phonics-classes-for-kids': '2025-11-26',
  'how-phonics-classes-help-kids-read': '2025-11-28',
  'child-knows-abc-but-cannot-read': '2025-11-29',
  'benefits-of-phonics-for-kids': '2025-11-30',
  'best-online-phonics-classes-for-kids': '2025-12-02',
  'how-to-choose-phonics-classes': '2025-12-04',
  'online-phonics-classes-vs-school': '2025-12-06',
  'synthetic-phonics-vs-traditional-reading': '2025-12-08',
  'why-parents-choose-online-phonics': '2025-12-10',
  'online-phonics-games': '2025-12-12',
  'how-long-does-phonics-take': '2025-12-14',
  'how-phonics-builds-reading-confidence': '2025-12-16',
  'how-tiny-steps-builds-reading-confidence': '2025-12-18',
  'how-phonics-improves-spelling': '2025-12-20',
  'science-of-phonics-learning': '2025-12-22',
  'week-3-phonics-tricky-words': '2025-12-24',
  'digraphs-and-tricky-words': '2025-12-27',
  'week-4-phonics-long-vowels': '2025-12-29',
  'long-vowel-sounds-for-kids': '2025-12-31',
  'week-5-phonics-r-controlled': '2026-01-03',
  'r-controlled-vowels-explained': '2026-01-05',
  'week-6-phonics-comprehension': '2026-01-08',
  'online-english-classes-for-kids-india': '2026-01-10',
  'spoken-english-classes-for-kids-confidence': '2026-01-13',
  'week-7-grammar-nouns-to-paragraphs': '2026-04-03',
  'week-8-grammar-tenses': '2026-01-20',
  'week-9-grammar-conjunctions': '2026-01-25',
  'week-10-grammar-subject-verb': '2026-01-29',
  'week-11-grammar-creative-writing': '2026-02-03',
  'week-12-speaking-confidence-seeds': '2026-04-04',
  'week-13-speaking-structure': '2026-02-11',
  'week-14-speaking-visual-aids': '2026-02-14',
  'week-15-speaking-debate-starters': '2026-02-18',
  'week-16-phonics-summer-plan': '2026-02-21',
  'week-17-grammar-assessment': '2026-02-24',
  'week-18-speaking-video-feedback': '2026-02-27',
  'week-19-phonics-multisyllabic': '2026-03-01',
  'week-20-grammar-editing-camp': '2026-03-04',
  'week-21-speaking-competition-prep': '2026-03-07',
  'week-22-phonics-diagnostics': '2026-03-10',
  'week-23-grammar-speaking-bridge': '2026-03-12',
  'week-24-speaking-family-showcase': '2026-03-14',
  'week-25-back-to-school-plan': '2026-03-16',
  'week-26-screen-smart-summer-routine': '2026-03-23',
  'week-27-prevent-summer-slide-reading': '2026-03-30',
};

const PHONICS_EXAMPLES_BY_SLUG: Record<string, string[]> = {
  'satpin-phonics-guide': [
    'SATPIN blending ladder: /s/ /a/ /t/ -> sat, /p/ /i/ /n/ -> pin, /t/ /a/ /p/ -> tap.',
    'Day-wise mini list: Day 1 (sat, pat), Day 2 (tap, pin), Day 3 (tin, nip), Day 4 review all six.',
    'Quick oral prompts: "What sound does s make?" "Can you tap /s/ /a/ /t/?" "Now say it fast."',
    'Write-read loop: child writes sat, parent points and child reads sat in a sentence: "Pat sat."',
    'Trouble-shoot pair: if child says letter name ("ess"), immediately model pure sound /s/ and repeat twice.',
    'Two-minute game: place s/a/t cards on floor, child hops each sound then says sat.',
  ],
  'cvc-words-explained-for-parents': [
    'Short-a examples: cat, mat, bat, jam, cap. Read each word, then ask child to spot the middle sound /a/.',
    'Short-i examples: pin, tin, lip, sit, rim. Use finger taps for each sound before reading the full word.',
    'Short-o examples: top, hop, log, pot, mop. Mix with one non-example to check if child is decoding or guessing.',
    'Short-u examples: sun, cup, bug, mud, bus. Ask child to segment first, then blend back.',
    'Sentence frames parents can reuse: "The cat is on the mat." "I can sit on top." "The bug is in a cup."',
    'Dictation sample: say "pin", child taps /p/ /i/ /n/, writes pin, then reads back pin aloud.',
  ],
  'phonics-blending-activities': [
    'Oral-only blending set: /c/ /a/ /t/, /m/ /a/ /p/, /s/ /i/ /t/. No print first, just listening and joining.',
    'Print blending set: cat, map, sit, pin, top. Parent slides finger under each grapheme while child blends.',
    'Contrast drill: sat vs sit, pin vs pan, hop vs hip to strengthen vowel hearing.',
    'Phrase practice: "a red cat", "sit up", "top hat" so blending moves into connected reading.',
    'Correction script: "Let us sound slowly: /s/ /a/ /t/. Now fast: sat."',
    '3-step session: 3 oral blends + 3 printed words + 1 short decodable sentence.',
  ],
  'how-kids-learn-blending': [
    'Stage 1 example (oral merge): parent says /m/ /a/ /n/, child says man.',
    'Stage 2 example (sound cards): child arranges m-a-n cards and blends to man.',
    'Stage 3 example (print): child reads man, fan, pan in one row without picture clues.',
    'Stage 4 example (sentence): "The man can run." Child points word-by-word while reading.',
    'Micro progression: 5 days oral + print CVC, next 5 days add mixed CVC review and one sentence daily.',
    'If blending breaks, step back one stage for 2 days and rebuild speed with 1-minute drills.',
  ],
  'child-knows-abc-but-cannot-read': [
    'Contrast the two skills: letter naming = "This is B"; decoding = /b/ /a/ /t/ → bat. Practice both separately for clarity.',
    'Start with 5 decodable CVC words daily: mat, sat, pin, top, sun. Avoid picture clues initially.',
    'Use the parent prompt: "Show me sounds first, then blend." This reduces random guessing.',
    'Try an oral-only warmup: say /c/ /a/ /t/, child says cat. Then move to print for transfer.',
    'If child guesses from first letter, cover the word, reveal one sound at a time, then blend fully.',
    'Close with one confidence sentence your child can decode: "The cat sat."',
  ],
  'r-controlled-vowels-explained': [
    'Bossy-R AR set: car, star, park, farm. Sentence: "The car is far."',
    'Bossy-R OR set: fork, corn, storm, short. Sentence: "The fork is on the corn tray."',
    'Bossy-R ER/IR/UR set: her, bird, turn, fur, shirt. Sentence: "The bird can turn."',
    'Sort game: mix 12 words and ask child to place each under AR / OR / ER-IR-UR.',
    'Sound cue: "R pulls the vowel." Model slowly: c-a-r -> car (not cah).',
    'Review loop: 4 AR words Monday, 4 OR words Tuesday, mixed review Wednesday onward.',
  ],
};

const DEFAULT_PHONICS_EXAMPLES = [
  'Use a 10-minute loop: 2 minutes sound review, 4 minutes blending, 4 minutes decodable reading.',
  'Keep a 3-old + 2-new word rule so review and new learning stay balanced.',
  'Use parent script: "Try it slowly, then fast." Avoid giving the answer immediately.',
  'End each session with one success sentence your child can read aloud independently.',
];

const PHONICS_PARENT_GUIDE_SCRIPTS = [
  'Before practice: "We will do only 10 minutes, then stop."',
  'During practice: "Show me the sounds first, then blend."',
  'After effort: "I liked how you tried again when it felt tricky."',
  'For correction: "Let us check it together slowly, then you try once more."',
];

const PHONICS_SEO_POSTS: PhonicsSeoPost[] = [
  {
    slug: 'best-online-phonics-classes-for-kids',
    title: 'Best Online Phonics Classes for Kids: What Parents Should Check First',
    focus: 'best online phonics classes for kids',
    quickAnswer: 'The best phonics class is not the flashiest one. It is the one that teaches pure sounds clearly, gives guided blending practice, and proves progress with decodable reading samples.',
    homePlan: [
      'Run a 3-minute sound check: show 6 letters and ask for sounds, not letter names.',
      'Practice 5 CVC words daily: 2 old words, 3 new words.',
      'Read one short decodable line aloud together and celebrate one success.',
    ],
    classChecklistFocus: 'Ask for a trial with live correction and a written 4-week learning plan before enrollment.',
    avoidFocus: 'Do not choose based on app graphics or discounts alone; teaching quality matters more than platform polish.',
    progress: 'In 2-4 weeks, most children should decode familiar CVC words more independently and hesitate less while reading.',
    support: 'If classes are regular but your child still guesses from pictures after a month, request a diagnostic lesson and slower sequencing.',
    faq: [
      {
        question: 'Is 1:1 better than group phonics for beginners?',
        answer: 'For shy or struggling readers, 1:1 usually gives faster correction and confidence. Small groups can work if children already know basic sounds.',
      },
      {
        question: 'How many phonics classes per week are ideal?',
        answer: 'Two to three guided classes with short daily home practice is a strong routine for most children aged 4-8.',
      },
    ],
    relatedReads: [
      { label: 'Online phonics classes vs school support', to: '/blog/online-phonics-classes-vs-school' },
      { label: 'How to choose phonics classes', to: '/blog/how-to-choose-phonics-classes' },
      { label: 'What is phonics for kids?', to: '/blog/what-is-phonics-for-kids' },
    ],
  },
  {
    slug: 'how-phonics-classes-help-kids-read',
    title: 'Why Kids Struggle With Reading—and How Phonics Helps',
    focus: 'how phonics classes help kids read',
    quickAnswer: 'Many children struggle because they are asked to recognize whole words before they can decode them. Systematic phonics teaches a calmer path: connect sounds to letters, then blend into words with confidence.',
    homePlan: [
      'Match 5 letter cards to their sounds every day.',
      'Blend 3 short words aloud with finger tracking.',
      'Read one decodable sentence and ask your child to point to each word.',
    ],
    classChecklistFocus: 'Check whether each lesson includes explicit segmenting and blending practice, not only rhyme songs.',
    avoidFocus: 'Do not depend only on sight-word memorization; decoding is what unlocks independent reading.',
    progress: 'Many children start reading simple words in 2-3 weeks and short decodable sentences in 6-8 weeks.',
    support: 'If your child avoids print entirely, ask for multisensory teaching with movement, tapping, and oral-only warmups first.',
    faq: [
      {
        question: 'Can phonics help if my child knows ABC but cannot read?',
        answer: 'Yes. ABC knowledge is letter naming. Phonics bridges the gap by teaching how those letters represent sounds in words.',
      },
      {
        question: 'Will phonics improve school reading too?',
        answer: 'Yes, because decoding skills transfer to textbook reading, dictation, and spelling tasks across subjects.',
      },
    ],
    relatedReads: [
      { label: 'Child knows ABC but cannot read', to: '/blog/child-knows-abc-but-cannot-read' },
      { label: 'How kids learn blending in stages', to: '/blog/how-kids-learn-blending' },
      { label: 'Phonics blending activities', to: '/blog/phonics-blending-activities' },
    ],
  },
  {
    slug: 'child-knows-abc-but-cannot-read',
    title: 'My Child Knows ABC but Cannot Read: What Parents Should Do Next',
    focus: 'child knows ABC but cannot read',
    quickAnswer: 'Knowing ABC means your child can name letters, not yet read words. The missing step is decoding—matching sounds to letters and blending in order—which improves quickly with consistent, low-pressure phonics practice.',
    homePlan: [
      'Run a 2-minute sound check daily using lowercase letters and pure sounds, not letter names.',
      'Blend 5 CVC words daily with finger tracking: 3 familiar words + 2 new words.',
      'Read one short decodable sentence and ask your child to point word-by-word while reading.',
    ],
    classChecklistFocus: 'Ask whether the class explicitly teaches the path from letter naming to decoding and blending, with real-time correction.',
    avoidFocus: 'Do not jump to sight-word memorization as the main method when decoding is still weak.',
    progress: 'In 2-4 weeks of consistent support, many children reduce guessing and begin decoding simple unfamiliar words more confidently.',
    support: 'If your child still cannot blend basic CVC words after 6-8 weeks of regular guided practice, request a structured phonics assessment.',
    faq: [
      {
        question: 'Why does my child read the alphabet but freeze on words?',
        answer: 'Letter naming and decoding are different skills. Children need explicit practice connecting sounds in sequence inside words.',
      },
      {
        question: 'Should I teach sight words first if blending is hard?',
        answer: 'Teach a small sight-word set, but keep decoding as the core. Sight words alone do not build independent reading of new words.',
      },
    ],
    relatedReads: [
      { label: 'What is phonics for kids?', to: '/blog/what-is-phonics-for-kids' },
      { label: 'How phonics classes help kids read', to: '/blog/how-phonics-classes-help-kids-read' },
      { label: 'What is Jolly Phonics and is it best?', to: '/blog/what-is-jolly-phonics-and-is-it-the-best-way-to-teach-reading' },
    ],
  },
  {
    slug: 'benefits-of-phonics-for-kids',
    title: 'Top 7 Benefits of Phonics Classes for Kids',
    focus: 'benefits of phonics for kids',
    quickAnswer: 'Good phonics instruction improves reading accuracy, spelling, fluency, and confidence because children finally understand how words are built.',
    homePlan: [
      'Track one weekly win: a new sound, word family, or sentence read independently.',
      'Use a 10-minute daily loop: sounds, blending, reading, quick dictation.',
      'End each session with verbal praise for effort, not just correct answers.',
    ],
    classChecklistFocus: 'Ask if the program tracks reading accuracy, blending speed, and spelling transfer as separate outcomes.',
    avoidFocus: 'Do not expect fluent story reading immediately; fluency comes after accuracy and repeated decoding success.',
    progress: 'Parents often see better word reading first, then spelling accuracy, then smoother sentence reading over 8-12 weeks.',
    support: 'If confidence drops despite practice, reduce difficulty and rebuild with easier decodable words for one week.',
    faq: [
      {
        question: 'Does phonics help only weak readers?',
        answer: 'No. It helps all early readers because decoding and spelling are foundational skills for later comprehension.',
      },
      {
        question: 'Can phonics support spoken English too?',
        answer: 'Indirectly yes. Clear sound awareness improves pronunciation and helps children notice word patterns in speech.',
      },
    ],
  },
  {
    slug: 'what-age-to-start-phonics',
    title: 'What Is the Right Age to Start Phonics? A Parent Readiness Guide',
    focus: 'what age to start phonics',
    quickAnswer: 'For most families, a playful start between ages 3.5 and 5 works well. Readiness matters more than age alone: listening, sound imitation, and 5-10 minutes of steady attention are strong signs.',
    homePlan: [
      'Start with oral sound games before worksheets.',
      'Introduce 2-3 new sounds per week using actions and picture cues.',
      'Blend only after your child can recall 4-6 sounds comfortably.',
    ],
    classChecklistFocus: 'Choose age-appropriate sessions: shorter, playful, and multisensory for younger children.',
    avoidFocus: 'Do not force writing-heavy tasks too early; first build listening and sound awareness.',
    progress: 'By 4-6 weeks, children should identify several sounds quickly and begin blending simple words with support.',
    support: 'If a child older than 6 still struggles with basic sounds, begin immediately but use an assessment-driven catch-up plan.',
    faq: [
      {
        question: 'What readiness signs matter more than age?',
        answer: 'Ability to listen, imitate sounds, follow short instructions, and enjoy rhymes are stronger indicators than age alone.',
      },
      {
        question: 'Is it too late to start phonics at age 7 or 8?',
        answer: 'No. Older children can catch up quickly with explicit teaching and consistent daily review.',
      },
    ],
    relatedReads: [
      { label: 'What is phonics for kids?', to: '/blog/what-is-phonics-for-kids' },
      { label: 'How long does phonics usually take?', to: '/blog/how-long-does-phonics-take' },
      { label: 'Phonics activities at home', to: '/blog/phonics-activities-for-kids-at-home' },
    ],
  },
  {
    slug: 'how-to-choose-phonics-classes',
    title: 'How to Choose the Best Phonics Classes for Your Child',
    focus: 'how to choose phonics classes',
    quickAnswer: 'Choose a phonics class using evidence of teaching quality: lesson flow, correction style, progress tracking, and parent communication.',
    homePlan: [
      'Compare 2-3 programs using the same checklist, not marketing claims.',
      'Attend trial classes and observe how errors are corrected.',
      'Ask for a clear 4-week target and home-practice guidance.',
    ],
    classChecklistFocus: 'Confirm that the teacher can explain exactly what your child should read after the first month.',
    avoidFocus: 'Do not enroll in programs that cannot show curriculum sequence or sample progress reports.',
    progress: 'A good class should show measurable sound recall and blending growth within 3-4 weeks.',
    support: 'If your child has hearing, speech, or attention concerns, prioritize programs that adapt pace and provide individual support.',
    faq: [
      {
        question: 'What should I ask during a trial class?',
        answer: 'Ask about sequence, correction approach, homework expectations, and what progress evidence parents receive weekly.',
      },
      {
        question: 'Are certificates enough proof of progress?',
        answer: 'No. Real evidence is in reading samples, blending performance, and spelling transfer to schoolwork.',
      },
    ],
  },
  {
    slug: 'synthetic-phonics-vs-traditional-reading',
    title: 'What Is Synthetic Phonics? A Parent Guide With Clear Method Comparison',
    focus: 'synthetic phonics vs traditional reading',
    quickAnswer: 'Synthetic phonics teaches children to build words from sounds in sequence, rather than guessing from pictures or context. For most beginners, this creates stronger decoding accuracy and more independent reading.',
    homePlan: [
      'Practice sound-by-sound decoding with short CVC words.',
      'Use picture support after decoding, not before.',
      'Read one decodable text plus one storybook daily for balance.',
    ],
    classChecklistFocus: 'Look for explicit blending instruction and cumulative review if you want strong decoding outcomes.',
    avoidFocus: 'Do not replace decoding with repeated guessing from pictures or first letters.',
    progress: 'Children taught with structured synthetic phonics often decode unfamiliar words earlier and with fewer guessing errors.',
    support: 'If comprehension is fine but decoding is weak, shift to explicit sound-first teaching for at least 8 weeks.',
    faq: [
      {
        question: 'Can I combine synthetic phonics with story reading?',
        answer: 'Yes. Use phonics for decoding lessons and storybooks for vocabulary and comprehension.',
      },
      {
        question: 'Why does my child guess even after many books?',
        answer: 'Many children memorize patterns visually. They need explicit training to map letters to sounds consistently.',
      },
    ],
    relatedReads: [
      { label: 'What is Jolly Phonics and is it best?', to: '/blog/what-is-jolly-phonics-and-is-it-the-best-way-to-teach-reading' },
      { label: 'What is phonics for kids?', to: '/blog/what-is-phonics-for-kids' },
      { label: 'Child knows ABC but cannot read', to: '/blog/child-knows-abc-but-cannot-read' },
    ],
  },
  {
    slug: 'online-phonics-classes-vs-school',
    title: 'Online vs Offline (School) Phonics Classes: What Works Better for Your Child?',
    focus: 'online phonics classes vs school',
    quickAnswer: 'School phonics often provides broad exposure, while focused online support offers tighter correction and pacing. The best choice depends on your child’s current gaps, confidence, and consistency at home.',
    homePlan: [
      'Review school sounds and words for 5 minutes daily.',
      'Use online practice to target only the missed sounds.',
      'Send school dictation errors to your tutor for focused correction.',
    ],
    classChecklistFocus: 'Choose classes that align with school pace but still personalize remedial work.',
    avoidFocus: 'Do not assume workbook completion means mastery; many children still need explicit blending support.',
    progress: 'When school and home plans align, parents often see cleaner dictation and smoother reading within one term.',
    support: 'If school feedback says "reads below grade level," add structured phonics support immediately rather than waiting.',
    faq: [
      {
        question: 'Should I stop school reading homework if I add online phonics?',
        answer: 'No. Keep school work, but reduce overload by doing short targeted phonics sessions separately.',
      },
      {
        question: 'How do I know if school phonics is enough?',
        answer: 'If your child can decode new words independently and spell taught patterns, school support may be sufficient.',
      },
    ],
    relatedReads: [
      { label: 'Best online phonics classes for kids', to: '/blog/best-online-phonics-classes-for-kids' },
      { label: 'How to choose phonics classes', to: '/blog/how-to-choose-phonics-classes' },
      { label: 'How phonics classes help kids read', to: '/blog/how-phonics-classes-help-kids-read' },
    ],
  },
  {
    slug: 'how-long-does-phonics-take',
    title: 'How Long Does It Take for a Child to Learn Phonics?',
    focus: 'how long does phonics take',
    quickAnswer: 'Most children need 6-12 months for solid phonics foundations, depending on attendance, practice consistency, and starting level.',
    homePlan: [
      'Set 6-week milestones: sound recall, blending, decodable reading, spelling.',
      'Use a weekly tracker with three metrics: sounds known, words blended, sentences read.',
      'Review weak sounds every weekend before adding new patterns.',
    ],
    classChecklistFocus: 'Pick programs with milestone-based progress reporting instead of vague "doing well" feedback.',
    avoidFocus: 'Do not compare speed with other children; consistency matters more than pace.',
    progress: 'Many children show first decoding gains in 3-6 weeks, but fluency and spelling transfer take longer and need cumulative revision.',
    support: 'If there is no measurable growth after 8 weeks of regular sessions, reassess method, pacing, and practice quality.',
    faq: [
      {
        question: 'Can phonics be completed in 1-2 months?',
        answer: 'Basics may start in that time, but full foundation and fluent transfer usually require sustained multi-month practice.',
      },
      {
        question: 'What slows phonics progress the most?',
        answer: 'Irregular attendance, inconsistent home review, and jumping to advanced texts too early are common delays.',
      },
    ],
  },
  {
    slug: 'what-is-phonics-for-kids',
    title: 'What Is Phonics for Kids? A Simple Parent Guide',
    focus: 'what is phonics for kids',
    quickAnswer: 'Phonics is a method that teaches children the relationship between letters and sounds so they can read and spell words independently.',
    homePlan: [
      'Teach one sound at a time with a letter card and action cue.',
      'Blend three-sound words orally before reading from print.',
      'Use short dictation: say a word, child taps sounds, then writes.',
    ],
    classChecklistFocus: 'Ensure teachers model pure sounds clearly and avoid adding extra vowel sounds.',
    avoidFocus: 'Do not treat phonics as only alphabet recitation; children need sound manipulation, not just letter names.',
    progress: 'Within a few weeks, children should begin sounding out words instead of guessing them from memory.',
    support: 'If your child cannot hear beginning or ending sounds in words, begin with phonological awareness games first.',
    faq: [
      {
        question: 'Is phonics the same as the alphabet?',
        answer: 'No. Alphabet learning is letter names. Phonics teaches how letters represent sounds in real words.',
      },
      {
        question: 'Does phonics reduce love for storybooks?',
        answer: 'Not when balanced well. Phonics builds decoding while storybooks build vocabulary and imagination.',
      },
    ],
    relatedReads: [
      { label: 'Right age to start phonics', to: '/blog/what-age-to-start-phonics' },
      { label: 'Synthetic phonics vs traditional reading', to: '/blog/synthetic-phonics-vs-traditional-reading' },
      { label: 'My child knows ABC but cannot read', to: '/blog/child-knows-abc-but-cannot-read' },
    ],
  },
  {
    slug: 'how-phonics-builds-reading-confidence',
    title: 'How Phonics Helps Children Become Confident Readers',
    focus: 'how phonics builds reading confidence',
    quickAnswer: 'Confidence grows when children can decode words by themselves; phonics creates that independence through predictable success.',
    homePlan: [
      'Choose texts where your child can read at least 80% of words.',
      'Use "I do, we do, you do" for tricky words.',
      'Track one confidence win daily: faster decoding, less hesitation, clearer reading voice.',
    ],
    classChecklistFocus: 'Look for teachers who use warm correction and visible success ladders instead of constant testing.',
    avoidFocus: 'Do not hand children books far above decoding level; repeated failure harms confidence quickly.',
    progress: 'Many parents notice fewer "I cannot read" statements after 2-3 weeks of consistent, successful decoding practice.',
    support: 'If anxiety around reading is high, reduce demand, use very short texts, and add frequent praise for attempts.',
    faq: [
      {
        question: 'My child reads but lacks confidence. Can phonics still help?',
        answer: 'Yes. Confidence often improves when decoding becomes faster and more accurate, reducing fear of unknown words.',
      },
      {
        question: 'How can I praise without overhelping?',
        answer: 'Praise strategy: "You looked at each sound and blended it." Avoid giving the answer too quickly.',
      },
    ],
  },
  {
    slug: 'phonics-rules-for-beginners',
    title: 'Common Phonics Rules Every Child Should Learn',
    focus: 'phonics rules for beginners',
    quickAnswer: 'Beginner phonics works best when rules are introduced in sequence: short vowels, consonant blends, digraphs, and then long-vowel patterns.',
    homePlan: [
      'Teach one pattern family at a time for 3-5 days.',
      'Read and spell words from that pattern before moving on.',
      'Keep a "known patterns" wall so children revisit old learning.',
    ],
    classChecklistFocus: 'Check whether rule teaching includes reading, spelling, and sentence-level practice, not isolated drills only.',
    avoidFocus: 'Do not teach too many rules in one week; overload leads to confusion and mixed recall.',
    progress: 'Children usually retain patterns better when each rule is practiced across listening, reading, and writing in the same week.',
    support: 'If rules are frequently mixed up, reduce scope and reteach with fewer words and more cumulative review.',
    faq: [
      {
        question: 'Should children memorize phonics rules like grammar formulas?',
        answer: 'No. They should apply patterns through repeated reading and spelling, not rote memorization alone.',
      },
      {
        question: 'Which rule should I teach first?',
        answer: 'Start with simple consonant-vowel-consonant decoding using short vowels before moving to complex spellings.',
      },
    ],
  },
  {
    slug: 'how-phonics-improves-spelling',
    title: 'How Phonics Improves Spelling and Reading Skills',
    focus: 'how phonics improves spelling',
    quickAnswer: 'Phonics improves spelling because children learn to segment words into sounds and map each sound to likely letter patterns.',
    homePlan: [
      'Use sound tapping before writing each word.',
      'Do 5-word dictated spelling practice from taught patterns.',
      'After dictation, ask your child to read the same words back.',
    ],
    classChecklistFocus: 'Choose programs that include dictation and spelling feedback every week, not reading-only sessions.',
    avoidFocus: 'Do not rely on copying spellings repeatedly without sound analysis; transfer stays weak.',
    progress: 'Spelling gains typically appear after decoding stabilizes, often within 4-8 weeks of consistent segmenting practice.',
    support: 'If spelling errors are random and persistent, revisit sound segmentation before introducing new spelling rules.',
    faq: [
      {
        question: 'Why can my child read a word but misspell it?',
        answer: 'Reading recognition develops before spelling production. Extra segmentation and dictation practice closes that gap.',
      },
      {
        question: 'Should I correct every spelling mistake?',
        answer: 'Prioritize taught patterns first. Correcting everything at once can overload and discourage beginners.',
      },
    ],
  },
  {
    slug: 'science-of-phonics-learning',
    title: 'Phonics vs Sight Words and Traditional Reading: A Calm Parent Decision Guide',
    focus: 'phonics vs sight words traditional reading',
    quickAnswer: 'For beginners, phonics should lead because it teaches children how to decode unfamiliar words. Sight words still matter, but in small controlled sets that support—never replace—sound-based reading instruction.',
    homePlan: [
      'Build phonemic awareness with oral sound games for 3 minutes daily.',
      'Teach grapheme-phoneme links explicitly using cumulative review.',
      'Use decodable reading to apply only what has already been taught.',
    ],
    classChecklistFocus: 'Check that instruction teaches decoding first, introduces sight words gradually, and reviews patterns cumulatively.',
    avoidFocus: 'Do not run a sight-word-only approach for beginners with weak decoding foundations.',
    progress: 'Children usually show fewer guessing errors and better unfamiliar-word reading when phonics leads and sight words are added strategically.',
    support: 'If your child memorizes words but struggles on new text, shift to a decoding-first plan for 6-8 weeks with daily blending practice.',
    faq: [
      {
        question: 'Should I teach sight words before phonics?',
        answer: 'Usually no. Start with phonics for decoding, then add high-frequency sight words in small sets as support.',
      },
      {
        question: 'Can phonics and sight words be taught together?',
        answer: 'Yes. Keep phonics as the core and use sight words as a controlled supplement so children still learn to decode unfamiliar words.',
      },
    ],
    relatedReads: [
      { label: 'What is synthetic phonics?', to: '/blog/synthetic-phonics-vs-traditional-reading' },
      { label: 'My child knows ABC but cannot read', to: '/blog/child-knows-abc-but-cannot-read' },
      { label: 'What is phonics for kids?', to: '/blog/what-is-phonics-for-kids' },
    ],
  },
  {
    slug: 'phonics-activities-for-kids-at-home',
    title: 'How to Teach Phonics at Home: 10 Activities That Build Reading',
    focus: 'phonics activities for kids at home',
    quickAnswer: 'Home phonics works best when routines are short, playful, and focused on one clear sound goal at a time. Repetition and clarity matter more than doing many new activities every day.',
    homePlan: [
      'Rotate three activity types: sound hunt, blend game, quick dictation.',
      'Use household objects for initial-sound sorting.',
      'Repeat the same activity for 3 days before switching.',
    ],
    classChecklistFocus: 'Ask teachers to assign specific at-home activities linked to that week\'s taught sounds.',
    avoidFocus: 'Do not run too many new games every day; repetition is what builds mastery.',
    progress: 'In 2-3 weeks, children should identify target sounds faster and decode practiced words with less prompting.',
    support: 'If attention span is low, split practice into two 5-minute blocks instead of one 10-minute block.',
    faq: [
      {
        question: 'Do I need worksheets for home phonics?',
        answer: 'No. Many strong activities are oral and game-based, especially for younger children.',
      },
      {
        question: 'How many activities should I do each day?',
        answer: 'One to three short activities are enough if they are focused and repeated consistently.',
      },
    ],
    relatedReads: [
      { label: 'What is phonics for kids?', to: '/blog/what-is-phonics-for-kids' },
      { label: 'How kids learn blending', to: '/blog/how-kids-learn-blending' },
      { label: 'Child knows ABC but cannot read', to: '/blog/child-knows-abc-but-cannot-read' },
    ],
  },
  {
    slug: 'phonics-games-for-letter-sounds',
    title: 'Phonics Games That Help Kids Learn Letter Sounds',
    focus: 'phonics games for letter sounds',
    quickAnswer: 'Letter-sound games are effective when children must say and apply sounds, not just tap colorful buttons quickly.',
    homePlan: [
      'Play "sound detective": find objects that begin with a target sound.',
      'Use a card flip game where each card requires saying the pure sound.',
      'Finish with one blending word that uses today\'s sounds.',
    ],
    classChecklistFocus: 'Select classes where games are tied to measurable sound mastery, not entertainment alone.',
    avoidFocus: 'Do not let games replace direct instruction; games should reinforce what was explicitly taught.',
    progress: 'Children often improve sound recall first, then blending speed once games are paired with reading practice.',
    support: 'If your child enjoys games but cannot read words, increase direct blending practice after each game round.',
    faq: [
      {
        question: 'Are digital phonics games enough by themselves?',
        answer: 'Usually not. Children still need guided teacher or parent feedback to transfer game skills to real reading.',
      },
      {
        question: 'How long should a phonics game session be?',
        answer: '5-8 focused minutes is enough before moving to blending or reading practice.',
      },
    ],
  },
  {
    slug: 'phonics-blending-activities',
    title: 'Simple Blending Activities to Teach Kids Reading',
    focus: 'phonics blending activities',
    quickAnswer: 'Blending improves when children move from oral sound merging to printed word decoding with frequent, short practice.',
    homePlan: [
      'Start with oral blending: you say sounds, child says the full word.',
      'Use finger-slide blending on 3-letter printed words.',
      'Read 3-5 blended words in short sentence frames.',
    ],
    classChecklistFocus: 'Look for lessons where teachers model slow, continuous, and snap blending methods.',
    avoidFocus: 'Do not jump to long words before CVC blending is automatic.',
    progress: 'Many children begin blending confidently within 3-4 weeks when practice is daily and scaffolded.',
    support: 'If blending stalls, return to oral-only work for a few days and rebuild with easier sound sets.',
    faq: [
      {
        question: 'Why does my child know sounds but still not blend?',
        answer: 'Sound recall and blending are different skills. Blending needs separate guided practice with pacing support.',
      },
      {
        question: 'Should I correct blending instantly?',
        answer: 'Give a short pause first. If needed, model once and ask for a retry to build self-correction.',
      },
    ],
  },
  {
    slug: 'cvc-words-explained-for-parents',
    title: 'CVC Words Explained for Parents',
    focus: 'CVC words explained for parents',
    quickAnswer: 'CVC words are simple three-sound words (like cat, pin, sun) that build the first bridge from phonics sounds to real reading.',
    homePlan: [
      'Pick one CVC family daily and read 5 words.',
      'Use Elkonin boxes or finger taps to segment each sound.',
      'Write and read the same 3 words to connect reading and spelling.',
    ],
    classChecklistFocus: 'Ensure early lessons spend enough time on CVC automaticity before introducing complex spellings.',
    avoidFocus: 'Do not mix too many irregular words while CVC decoding is still shaky.',
    progress: 'When CVC mastery is solid, children decode new short words faster and show fewer guessing errors.',
    support: 'If CVC reading remains difficult, reduce word count and reteach each sound with oral blending first.',
    faq: [
      {
        question: 'How many CVC words should my child know before moving ahead?',
        answer: 'There is no fixed number, but your child should blend and read most taught CVC patterns with minimal prompting.',
      },
      {
        question: 'Are CVC words only for preschoolers?',
        answer: 'No. They are useful for any beginner who needs decoding foundations, including older catch-up learners.',
      },
    ],
  },
  {
    slug: 'online-phonics-games',
    title: 'Fun Phonics Games for Online Learning',
    focus: 'online phonics games',
    quickAnswer: 'Online phonics games help when they are used as guided reinforcement, with parents or teachers linking game tasks to real reading.',
    homePlan: [
      'Choose one game objective per day: sound ID, blending, or spelling.',
      'After each game round, read 3 matching words from print.',
      'Use a simple scorecard focused on accuracy, not speed only.',
    ],
    classChecklistFocus: 'Pick classes that assign game practice with specific follow-up reading tasks.',
    avoidFocus: 'Do not leave children in self-play mode for long periods without feedback.',
    progress: 'With guided transfer, online game practice can improve engagement while still growing decoding accuracy over weeks.',
    support: 'If screen-based practice causes distraction, shorten game time and move quickly to offline reading tasks.',
    faq: [
      {
        question: 'What makes an online phonics game useful?',
        answer: 'Clear sound targets, immediate feedback, and a direct link to printable or spoken reading tasks.',
      },
      {
        question: 'How much screen time is appropriate for phonics games?',
        answer: 'Usually 5-10 minutes per session is enough when followed by offline reading or writing.',
      },
    ],
  },
  {
    slug: 'satpin-phonics-guide',
    title: 'SATPIN Phonics Explained for Parents',
    focus: 'SATPIN phonics guide',
    quickAnswer: 'SATPIN introduces six high-utility sounds that quickly create many readable words, making it a practical starting set for beginners.',
    homePlan: [
      'Teach one to two SATPIN sounds at a time with actions.',
      'Blend simple SATPIN words like sat, pin, tap, tin.',
      'Review all taught sounds daily before adding a new one.',
    ],
    classChecklistFocus: 'Check that teachers model pure SATPIN sounds and quickly move into blending, not isolated drill only.',
    avoidFocus: 'Do not teach all six letters in one day; gradual mastery is more effective than speed.',
    progress: 'Most children can begin blending a few SATPIN words within the first 1-2 weeks with daily short practice.',
    support: 'If sounds are mixed repeatedly, slow down and use multisensory cues before introducing new letters.',
    faq: [
      {
        question: 'Why is SATPIN taught before full alphabet order?',
        answer: 'Because those sounds combine quickly into useful words, giving children early decoding success.',
      },
      {
        question: 'Can we teach letter names along with SATPIN sounds?',
        answer: 'Yes, but prioritize sound production during reading practice and use names separately when needed.',
      },
    ],
  },
  {
    slug: 'how-kids-learn-blending',
    title: 'How Kids Learn to Blend Sounds in Phonics',
    focus: 'how kids learn blending',
    quickAnswer: 'Children learn blending in stages: sound awareness, sound recall, oral merging, then printed word blending with repeated support.',
    homePlan: [
      'Begin with oral-only sound merging games for 2-3 days.',
      'Add printed CVC blending with finger tracking.',
      'Use one-minute blend drills twice daily for automaticity.',
    ],
    classChecklistFocus: 'Prioritize classes where blending is taught explicitly every lesson, not assumed after sound teaching.',
    avoidFocus: 'Do not rush to paragraph reading before single-word blending becomes reliable.',
    progress: 'With steady practice, many children shift from slow sounding-out to smoother blending in about 4-6 weeks.',
    support: 'If blending remains labored, reduce word complexity and increase oral blending reps before print.',
    faq: [
      {
        question: 'What is the difference between segmenting and blending?',
        answer: 'Segmenting breaks a word into sounds. Blending combines sounds to form a word. Children need both for reading and spelling.',
      },
      {
        question: 'Can children blend without knowing every letter?',
        answer: 'They can start with a small known set, but strong blending needs reliable recall of taught sound-letter pairs.',
      },
    ],
  },
  {
    slug: 'digraphs-and-tricky-words',
    title: 'Understanding Digraphs and Tricky Words',
    focus: 'digraphs and tricky words',
    quickAnswer: 'Digraphs are two letters making one sound (sh, ch, th), while tricky words contain parts that cannot be decoded fully using current phonics knowledge.',
    homePlan: [
      'Teach one digraph family at a time with picture cues.',
      'Keep tricky-word practice short and visual, 3-5 words only.',
      'Separate decodable words and tricky words in two lists.',
    ],
    classChecklistFocus: 'Look for programs that teach digraphs systematically and introduce tricky words in controlled sets.',
    avoidFocus: 'Do not label all common words as tricky; children should still decode what is decodable.',
    progress: 'Children typically improve word accuracy when they can identify digraph chunks quickly inside new words.',
    support: 'If confusion rises, pause new tricky words and reinforce known digraph patterns for one week.',
    faq: [
      {
        question: 'How many tricky words should we teach each week?',
        answer: 'Usually 3-5 words with high review is better than large weekly lists.',
      },
      {
        question: 'Should tricky words be spelled from memory?',
        answer: 'Yes, but first highlight the regular and irregular parts so memory has structure.',
      },
    ],
  },
  {
    slug: 'long-vowel-sounds-for-kids',
    title: 'Long Vowel Sounds Explained for Kids',
    focus: 'long vowel sounds for kids',
    quickAnswer: 'Long vowels are easier after short-vowel decoding is stable; teach common spelling patterns one at a time with plenty of reading practice.',
    homePlan: [
      'Start with one long-vowel pattern (for example, a_e) for 3 days.',
      'Read and sort words by pattern (cake, lake, make).',
      'Contrast short vs long pairs (cap/cape) to build awareness.',
    ],
    classChecklistFocus: 'Choose classes that sequence long-vowel spellings clearly rather than mixing many patterns together.',
    avoidFocus: 'Do not introduce all long-vowel spellings at once; children need focused pattern repetition.',
    progress: 'Expect gradual gains: first recognition, then accurate reading, then correct spelling of long-vowel patterns.',
    support: 'If short and long vowels are mixed up often, revisit short-vowel mastery before adding new long patterns.',
    faq: [
      {
        question: 'When should long vowels be introduced?',
        answer: 'Usually after children can decode short-vowel CVC words with confidence and low prompting.',
      },
      {
        question: 'Which long-vowel pattern should come first?',
        answer: 'Many programs start with silent-e patterns because children can compare them directly with CVC words.',
      },
    ],
  },
  {
    slug: 'r-controlled-vowels-explained',
    title: 'R-Controlled Vowels Made Easy for Children',
    focus: 'r-controlled vowels explained',
    quickAnswer: 'R-controlled vowels (ar, er, ir, or, ur) change vowel sounds and require targeted listening plus pattern practice.',
    homePlan: [
      'Teach one pattern group daily (for example: ar words).',
      'Use minimal pairs to hear contrast (car/cat, bird/bid).',
      'Read short phrases using only one r-controlled pattern first.',
    ],
    classChecklistFocus: 'Pick classes that provide auditory discrimination exercises along with printed practice for r-controlled vowels.',
    avoidFocus: 'Do not teach ar/er/ir/or/ur as one large unit in the same lesson for beginners.',
    progress: 'With focused practice, children usually recognize r-controlled chunks faster and decode related words with fewer pauses.',
    support: 'If speech sound production is unclear, combine phonics practice with pronunciation modeling and slow repetition.',
    faq: [
      {
        question: 'Why are er, ir, and ur confusing for children?',
        answer: 'They often sound similar in speech. Children need repeated mapping from sound to spelling patterns.',
      },
      {
        question: 'Should I teach spelling and reading together for r-controlled vowels?',
        answer: 'Yes. Reading and spelling the same pattern set helps retention and transfer.',
      },
    ],
  },
  {
    slug: 'why-parents-choose-online-phonics',
    title: 'Why Parents Prefer Online Phonics Classes Today',
    focus: 'why parents choose online phonics',
    quickAnswer: 'Parents often choose online phonics for flexible scheduling, individualized pacing, and easier access to qualified teachers and progress tracking.',
    homePlan: [
      'Fix class time in your weekly routine to avoid missed sessions.',
      'Sit in for the first 5 minutes to align home practice goals.',
      'Review teacher notes and do 10 minutes of follow-up the same day.',
    ],
    classChecklistFocus: 'Choose online programs that offer frequent teacher feedback and clear parent dashboards, not just recorded videos.',
    avoidFocus: 'Do not treat online class as passive screen time; outcomes depend on active follow-up.',
    progress: 'When class consistency and home follow-up are strong, online formats can deliver fast gap-closing for early readers.',
    support: 'If attention drops online, shorten sessions, increase interaction, and use 1:1 or smaller groups.',
    faq: [
      {
        question: 'Is online phonics suitable for very young children?',
        answer: 'Yes, if sessions are short, interactive, and supported by a parent during initial weeks.',
      },
      {
        question: 'How do I keep my child engaged in online classes?',
        answer: 'Use a fixed routine, remove distractions, and follow each class with a quick game or reading win.',
      },
    ],
  },
  {
    slug: 'how-tiny-steps-builds-reading-confidence',
    title: 'How Tiny Steps Helps Kids Become Confident Readers',
    focus: 'how Tiny Steps builds reading confidence',
    quickAnswer: 'Tiny Steps builds confidence through systematic phonics, warm correction, short decodable reading wins, and weekly parent guidance.',
    homePlan: [
      'Use weekly teacher goals to plan 10-minute home sessions.',
      'Practice the exact sound set taught in class before adding extras.',
      'Record one short read-aloud each week to track fluency growth.',
    ],
    classChecklistFocus: 'Check that your child gets clear feedback, not generic praise, after each session.',
    avoidFocus: 'Do not skip revision weeks; confidence grows when old skills feel easy before new skills are added.',
    progress: 'Parents typically report stronger reading willingness and fewer decoding breakdowns after consistent month-long routines.',
    support: 'If confidence dips, ask for temporary level adjustment, simpler decodable texts, and targeted confidence goals.',
    faq: [
      {
        question: 'How does Tiny Steps track progress for parents?',
        answer: 'Parents receive stage-wise updates on sounds mastered, blending quality, reading behavior, and next practice priorities.',
      },
      {
        question: 'Can Tiny Steps support children who already feel behind?',
        answer: 'Yes. Individualized pacing and focused remediation help children rebuild foundation skills without shame.',
      },
    ],
  },
];

function makePhonicsExcerpt(focus: string) {
  return `Parent guide to ${focus}: clear answers, a 10-minute home routine, class-selection checkpoints, and realistic milestones to help your child become a confident reader.`;
}

function getPhonicsExamples(slug: string) {
  return PHONICS_EXAMPLES_BY_SLUG[slug] ?? DEFAULT_PHONICS_EXAMPLES;
}

function buildFaqBody(faq: { question: string; answer: string }[]) {
  const blocks: BlogBlock[] = [{ type: 'h2', content: 'Parent FAQ' }];
  faq.forEach((item) => {
    blocks.push({ type: 'h3', content: item.question });
    blocks.push({ type: 'p', content: item.answer });
  });
  return blocks;
}

function buildRelatedReadsBody(relatedReads?: { label: string; to: string }[]) {
  if (!relatedReads?.length) return [];
  return [
    { type: 'h2' as const, content: 'Related reading in this phonics cluster' },
    ...relatedReads.map((item) => ({ type: 'li' as const, content: `${item.label}: ${item.to}` })),
  ];
}

const PHONICS_CLUSTER_INTENT_SLUGS = new Set([
  'synthetic-phonics-vs-traditional-reading',
  'child-knows-abc-but-cannot-read',
  'what-age-to-start-phonics',
  'science-of-phonics-learning',
  'how-phonics-classes-help-kids-read',
  'phonics-activities-for-kids-at-home',
  'online-phonics-classes-vs-school',
]);

const PHONICS_CLUSTER_SIBLING_LINKS: Record<string, { label: string; to: string }> = {
  'synthetic-phonics-vs-traditional-reading': {
    label: 'Phonics vs sight words and traditional reading',
    to: '/blog/science-of-phonics-learning',
  },
  'child-knows-abc-but-cannot-read': {
    label: 'Why kids struggle with reading',
    to: '/blog/how-phonics-classes-help-kids-read',
  },
  'what-age-to-start-phonics': {
    label: 'What is phonics for kids?',
    to: '/blog/what-is-phonics-for-kids',
  },
  'science-of-phonics-learning': {
    label: 'What is synthetic phonics?',
    to: '/blog/synthetic-phonics-vs-traditional-reading',
  },
  'how-phonics-classes-help-kids-read': {
    label: 'My child knows ABC but cannot read',
    to: '/blog/child-knows-abc-but-cannot-read',
  },
  'phonics-activities-for-kids-at-home': {
    label: 'What is phonics for kids?',
    to: '/blog/what-is-phonics-for-kids',
  },
  'online-phonics-classes-vs-school': {
    label: 'Best online phonics classes for kids',
    to: '/blog/best-online-phonics-classes-for-kids',
  },
};

function normalizeClusterRelatedReads(post: PhonicsSeoPost) {
  if (!PHONICS_CLUSTER_INTENT_SLUGS.has(post.slug)) return post.relatedReads ?? [];

  const related = [...(post.relatedReads ?? [])];

  if (!related.some((item) => item.to === '/phonics')) {
    related.unshift({ label: 'Explore phonics classes', to: '/phonics' });
  }

  const hasCommercialSupport = related.some((item) => item.to === '/curriculum' || item.to === '/courses');
  if (!hasCommercialSupport) {
    related.push({ label: 'See curriculum progression', to: '/curriculum' });
  }

  const hasSiblingBlog = related.some((item) => item.to.startsWith('/blog/') && item.to !== `/blog/${post.slug}`);
  if (!hasSiblingBlog && PHONICS_CLUSTER_SIBLING_LINKS[post.slug]) {
    related.push(PHONICS_CLUSTER_SIBLING_LINKS[post.slug]);
  }

  const deduped = related.filter((item, index, arr) => arr.findIndex((i) => i.to === item.to) === index);
  return deduped;
}

function buildClusterSoftCtaBody(slug: string) {
  if (!PHONICS_CLUSTER_INTENT_SLUGS.has(slug)) return [];
  return [
    { type: 'h2' as const, content: 'Next calm step for parents' },
    {
      type: 'p' as const,
      content:
        'Pick one steady next step: keep practice short, use one consistent method, and review your child’s level before increasing difficulty.',
    },
    { type: 'li' as const, content: 'Explore phonics support: /phonics' },
    { type: 'li' as const, content: 'See your level pathway: /curriculum' },
    { type: 'li' as const, content: 'Compare class options: /courses' },
  ];
}

function makePhonicsPost(post: PhonicsSeoPost): BlogPost {
  const excerpt = makePhonicsExcerpt(post.focus);
  const faq = [...post.faq, ...PHONICS_BASE_FAQ];
  const examples = getPhonicsExamples(post.slug);
  const relatedReads = normalizeClusterRelatedReads(post);
  return {
    slug: post.slug,
    title: post.title,
    category: 'Phonics',
    author: 'Tiny Steps Learning',
    date: BLOG_PUBLICATION_DATES[post.slug] ?? '2026-03-05',
    readTime: post.readTime ?? '9 min',
    excerpt,
    metaDescription: excerpt,
    faq,
    body: [
      { type: 'h2', content: 'Quick answer for parents' },
      { type: 'p', content: post.quickAnswer },
      { type: 'h2', content: 'At-home plan: 10 minutes that actually works' },
      {
        type: 'p',
        content: `If you are currently researching ${post.focus}, run this simple routine for 2-3 weeks before judging progress.`,
      },
      ...post.homePlan.map((step) => ({ type: 'li' as const, content: step })),
      { type: 'h2', content: 'Checklist when choosing a phonics class' },
      ...PHONICS_BASE_CLASS_CHECKLIST.map((item) => ({ type: 'li' as const, content: item })),
      { type: 'li', content: post.classChecklistFocus },
      { type: 'h2', content: 'Mistakes that slow progress' },
      ...PHONICS_BASE_MISTAKES.map((item) => ({ type: 'li' as const, content: item })),
      { type: 'li', content: post.avoidFocus },
      { type: 'h2', content: 'Progress timeline parents can expect' },
      { type: 'p', content: post.progress },
      { type: 'h2', content: 'Useful examples parents can use tonight' },
      { type: 'p', content: 'Use these examples directly during practice so your child sees the concept in real words and short sentences.' },
      ...examples.map((item) => ({ type: 'li' as const, content: item })),
      { type: 'h2', content: 'Parent-guide scripts to keep practice positive' },
      ...PHONICS_PARENT_GUIDE_SCRIPTS.map((item) => ({ type: 'li' as const, content: item })),
      { type: 'h2', content: 'When to ask for extra support' },
      { type: 'p', content: post.support },
      ...buildRelatedReadsBody(relatedReads),
      ...buildClusterSoftCtaBody(post.slug),
      ...buildFaqBody(faq),
    ],
  };
}

const rawBlogPosts: BlogPost[] = [
  {
    slug: 'week-1-phonics-satpin-launch',
    title: 'SATPIN for Parents: A Research-Backed Week 1 Launch Plan for Confident Readers',
    category: 'Phonics',
    author: 'Tiny Steps Research Desk',
    date: '2026-04-03',
    readTime: '11 min read',
    hero: '/blog/hero-research.jpg',
    metaDescription:
      'A research-backed SATPIN phonics guide for parents: what to teach first, how to model pure sounds, how to blend in week 1, and how multilingual homes can support early reading calmly.',
    excerpt: 'A premium SATPIN week 1 roadmap for parents who want a calm, research-backed plan to teach s, a, t, p, i, and n at home.',
    body: [
      { type: 'h2', content: 'What “SATPIN” means (and why it’s a smart first set)' },
      { type: 'p', content: 'SATPIN is six simple sounds: s, a, t, p, i, n. These letters combine to make dozens of simple three-letter (CVC) words like sat, pin, tap, and tin.' },
      { type: 'p', content: 'We choose SATPIN first because the letters are distinct, their sounds are easy to say, and they form many early words. For busy parents and short attention spans, this set gives quick wins.' },

      { type: 'h2', content: 'Letter names vs letter sounds (the common confusion)' },
      { type: 'p', content: 'Many children know the ABC song and can say “bee” or “see.” But reading needs the speech sounds those letters make: /b/ /s/ /t/ etc. Saying the letter name (“bee”) is not the same as saying the sound /b/ used in decoding.' },
      { type: 'p', content: 'So the first job is to teach the sound, not the name. Use lowercase letters from storybooks — that’s what children see in real reading.' },

      { type: 'h2', content: 'The Week 1 plan (7 days, 10 minutes/day)' },
      { type: 'p', content: 'Each day: warm-up (1 min), teach/practice (6–7 min), celebrate & stop (1–2 min). Keep sessions playful and routine-based so your child knows what to expect.' },
      { type: 'h3', content: 'Day 1 — s, a' },
      { type: 'p', content: 'Introduce /s/ and /a/. Show the letters, say the sound, let your child repeat, then trace each letter once with a finger.' },
      { type: 'p', content: 'Example words to say: sat, pat. Success: child says /s/ and /a/ when you show the letters.' },

      { type: 'h3', content: 'Day 2 — t, p' },
      { type: 'p', content: 'Introduce /t/ and /p/. Play a quick I-Spy: “I spy something that starts with /t/.” Trace and tap as you say each sound.' },
      { type: 'p', content: 'Example words: tap, pat. Success: child identifies the initial sound in a spoken word.' },

      { type: 'h3', content: 'Day 3 — i, n' },
      { type: 'p', content: 'Introduce /i/ and /n/. Use a motion (e.g., point to tummy for /i/ like “it”) and a nose touch for /n/ so learning is multisensory.' },
      { type: 'p', content: 'Example words: pin, tin. Success: child repeats sounds and traces letters.' },

      { type: 'h3', content: 'Day 4 — Review + blend a few words' },
      { type: 'p', content: 'Quickly review all six sounds, then demonstrate blending for one word: /s/ /a/ /t/ → “sat.” Let your child try with support.' },
      { type: 'p', content: 'Example words: sat, pat. Success: child blends one word with prompting.' },

      { type: 'h3', content: 'Day 5 — More blending practice' },
      { type: 'p', content: 'Blend two or three CVC words together. Use letter cards or toys as markers for each sound.' },
      { type: 'p', content: 'Example words: sat, pat, pin. Success: child blends independently or with minimal help.' },

      { type: 'h3', content: 'Day 6 — Little reading practice' },
      { type: 'p', content: 'Read a very short decodable sentence using learned words: “Pat sat.” Point to each word and blend as you go.' },
      { type: 'p', content: 'Success: child recognizes at least one word when you point and sound it out.' },

      { type: 'h3', content: 'Day 7 — Game day + celebrate' },
      { type: 'p', content: 'Play quick sound games (see below), then review any words your child found tricky. Give a small reward — a sticker or a thumbs-up — and end on a positive note.' },

      { type: 'h2', content: 'Games that work (no worksheets needed)' },
      { type: 'p', content: 'Short, playful games are best for LKG/UKG and early primary. Here are quick options you can use in 1–3 minutes each.' },
      { type: 'li', content: 'I Spy Sounds — spot initial sounds around the room.' },
      { type: 'li', content: 'Sound Clap — say a CVC word and clap for each sound.' },
      { type: 'li', content: 'Toy Match — place three toys and ask which one starts with /p/.' },
      { type: 'li', content: 'Letter Trace Race — trace a letter in the air with a finger, add silly sound effects.' },
      { type: 'li', content: 'Sound Hop — place cards on the floor and let your child hop to the card after you say a sound.' },
      { type: 'li', content: 'Blend Basket — put letter cards in a basket and pull three to blend aloud.' },

      { type: 'h2', content: 'SATPIN example bank (ready-to-use for busy parents)' },
      { type: 'p', content: 'Use these examples as-is so practice is quick and predictable. Do one mini set per day and repeat it twice.' },
      { type: 'li', content: 'Set A: sat, pat, tap. Sentence: "Pat sat." "Tap, tap."'},
      { type: 'li', content: 'Set B: pin, tin, nip. Sentence: "Pin it." "Tin can."'},
      { type: 'li', content: 'Set C: pan, tan, nap. Sentence: "Tan pan." "Nap in pan."'},
      { type: 'li', content: 'Mixed review: sat, pin, tap, tan, nip. Ask child to sort by middle vowel /a/ vs /i/.'},
      { type: 'li', content: 'Parent prompt: "Show me each sound first, then blend." If stuck, return to slow blend and retry once.'},
      { type: 'p', content: 'If your child reads one full sentence independently from these sets, count that as a strong daily win.' },

      { type: 'h2', content: 'Blending: when to start (and how to do it without pressure)' },
      { type: 'p', content: 'Start blending once your child can hear and say 4–6 sounds reliably. Blending should be short and supported: you say the sounds, then say them faster to make the word.' },
      { type: 'p', content: 'Use gestures: stretch sounds slowly (/s—a—t/) then snap to “sat.” Praise effort and try again another day if it’s not clicking.' },

      { type: 'h2', content: 'Mistakes to avoid (and what to do instead)' },
      { type: 'p', content: 'Avoid long worksheets, timed drills, or pushing too many letters at once. These create frustration and turn sessions into homework.' },
      { type: 'p', content: 'Do instead: short play-based practice, one new sound at a time, clear praise, and immediate positive feedback. If you notice confusion, slow down and revisit sounds with games.' },

      { type: 'h2', content: 'Troubleshooting' },
      { type: 'h3', content: 'If my child mixes sounds (b/d or p/q)' },
      { type: 'p', content: 'Use multi-sensory cues — say the sound, trace, and add a small action. For b/d confusion, try a “bat” vs “dog” gesture so shapes and sounds link to movement.' },
      { type: 'h3', content: 'If my child can’t blend yet' },
      { type: 'p', content: 'Return to phonemic awareness games. Clap sounds, segment words, and slow the pace. Blending often follows with a little more practice.' },
      { type: 'h3', content: 'If my child gets bored' },
      { type: 'p', content: 'Switch to a 1‑minute game, sing the sounds, or try a toy-based activity. Always end on a win.' },

      { type: 'h2', content: 'Signs Week 1 is “done” (simple checklist)' },
      { type: 'li', content: 'Can say 4–6 SATPIN sounds when prompted.' },
      { type: 'li', content: 'Can blend at least one CVC word with support.' },
      { type: 'li', content: 'Enjoys short, 5–10 minute sessions and asks to play again.' },

      { type: 'h2', content: 'What to do in Week 2 (teaser + next step)' },
      { type: 'p', content: 'Week 2 builds on blending: we add two more sounds, increase blending practice, and introduce short decodable books. The aim is fluent decoding of many CVC words by the end of the fortnight.' },
      { type: 'p', content: 'If you want guided lessons and a clear progression, Tiny Steps has a structured Phonics program with lesson-by-lesson milestones.' },
      { type: 'p', content: 'Try this next: pick 3 CVC words your child liked this week and practise blending them twice a day for three days.' }
    ]
  },
  {
    slug: 'week-2-phonics-blending-club',
    title: 'Week 2: Build a Blending Club at Home',
    category: 'Phonics',
    author: 'Priya',
    date: '2025-11-14',
    readTime: '9 min',
    excerpt: "Seven-day Blending Club for busy parents: two-minute setups, playful micro-games and ready scripts that build blending fluency, boost reading confidence, and create a simple daily habit.",
    body: [
      { type: 'h2', content: 'Why blending is the real “reading switch”' },
      { type: 'p', content: 'Blending is the skill that turns separate letter sounds into a readable word. Once a child can hear /s/ /a/ /t/ and press those sounds together, they can decode many simple words independently.' },
      { type: 'p', content: 'Parents often notice a big jump in confidence when blending clicks — a child who was naming letters starts reading short words and smiling. That’s why Week 2 focuses on short, repeated blending practice.' },

      { type: 'h2', content: 'The biggest reason kids can’t blend (and how to fix it)' },
      { type: 'p', content: 'Most children can’t blend because they haven’t yet learned to hold each sound in their ear long enough to push them together. They either say letter names or rush through sounds.' },
      { type: 'p', content: 'Fix: slow the sounds, give a simple physical cue (tap or finger under each letter), then blend. Use the 2‑minute setup below so practice stays short and repeatable.' },

      { type: 'h2', content: 'Your “Blending Club” setup at home (2 minutes, no fancy materials)' },
      { type: 'p', content: 'You only need three things: 1) 6 letter cards (SATPIN), 2) a small basket or place to put cards, and 3) enthusiasm. Keep the cards in a tray so your child recognises the routine.' },
      { type: 'p', content: 'The 2‑minute rule: do a quick warm-up, pull three cards, and blend. If it goes well, repeat once. If not, stop and try again tomorrow. Always end while it is still fun.' },

      { type: 'h2', content: 'The Week 2 plan (7 days, 10–12 minutes/day)' },
      { type: 'p', content: 'Each day includes warm-up (2–3 min), focused blending (5–7 min), and games/review (2 min). Keep sessions consistent in time so the child anticipates the routine.' },
      { type: 'h3', content: 'Day 1 — Review SATPIN + slow blends' },
      { type: 'p', content: 'Warm-up with sounds. Model a slow blend: /s/…/a/…/t/ then slide to “sat.” Use finger taps under each sound.' },
      { type: 'h3', content: 'Day 2 — Continuous blending practice' },
      { type: 'p', content: 'Practice continuous blends where you do not pause between sounds: /s-a-t/ → sat. Support with sliding finger under the word.' },
      { type: 'h3', content: 'Day 3 — Snap blends and short sentences' },
      { type: 'p', content: 'Introduce a “snap” blend after slow practice. Parent reads a short sentence aloud; child points to or echoes the word "sat".' },
      { type: 'h3', content: 'Day 4 — Mix practice with little games' },
      { type: 'p', content: 'Use blend baskets and I-Spy games to practise blending without pressure. Keep it playful.' },
      { type: 'h3', content: 'Day 5 — Quick timed wins (2-minute challenge)' },
      { type: 'p', content: 'Try a short 2‑minute challenge: how many blends can you do together? Celebrate 3 correct blends and stop.' },
      { type: 'h3', content: 'Day 6 — Reading with pointers' },
      { type: 'p', content: 'Point to each word and blend aloud. Encourage your child to read the first word and echo the second.' },
      { type: 'h3', content: 'Day 7 — Game marathon + review' },
      { type: 'p', content: 'Play multiple mini-games from the list below and review any tricky words. Celebrate progress with praise or a sticker.' },

      { type: 'h2', content: 'Three blending methods (simple explanations)' },
      { type: 'h3', content: 'Slow blend (stretch → snap)' },
      { type: 'p', content: 'Say each sound slowly with a pause: /s/…/a/…/t/. Then say the sounds faster to snap to “sat.” This gives the child time to hold each sound.' },
      { type: 'h3', content: 'Continuous blend (smooth slide)' },
      { type: 'p', content: 'Say the sounds smoothly without pausing: /s-a-t/ and slide your finger under the made-up word. This mirrors fluent reading.' },
      { type: 'h3', content: 'Snap blend (quick combine)' },
      { type: 'p', content: 'After practicing slow and continuous blends, encourage a quick snap: say the three sounds together and let the child say the final word. Use excited praise for small wins.' },

      { type: 'h2', content: 'Mini-games that make blending fun' },
      { type: 'p', content: 'Use these short games in between practice bursts to keep interest high.' },
      { type: 'li', content: 'Blend Basket — pull three letter cards and blend aloud.' },
      { type: 'li', content: 'Sound Hop — place cards on floor; child hops to each sound and blends.' },
      { type: 'li', content: 'Echo Read — you blend, child echoes then swaps roles.' },
      { type: 'li', content: 'Mystery Word — blend and let child guess the object.' },
      { type: 'li', content: 'Blend Race — who can blend three words correctly first (gentle competition).' },
      { type: 'li', content: 'Finger Slide — slide finger under letters while sounding.' },
      { type: 'li', content: 'Toy Read — hide a toy under a word and read to reveal it.' },
      { type: 'li', content: 'Sticker Ladder — earn a sticker for each successful blend.' },

      { type: 'h2', content: 'What words to practice (SATPIN CVC list + how to choose 5/day)' },
      { type: 'p', content: 'Use SATPIN CVC words: sat, sit, sip, sap, pat, pan, pin, pit, tap, tin, tan, nap, nip, sin.' },
      { type: 'p', content: 'Choose five words a day: three new + two review. Pick words that use sounds your child already knows and relate to familiar objects at home.' },

      { type: 'h2', content: 'CVC blending ladder with concrete examples' },
      { type: 'p', content: 'Move from easiest to hardest in one session: oral blend first, then printed words, then a short sentence.' },
      { type: 'li', content: 'Step 1 (oral): /s/ /a/ /t/ -> sat, /p/ /i/ /n/ -> pin, /t/ /a/ /n/ -> tan.' },
      { type: 'li', content: 'Step 2 (print): sat, pin, tan, sip, tap. Point and blend each word once.' },
      { type: 'li', content: 'Step 3 (sentence): "Pat sat." "Pin is in." "Tan cap." Keep lines short and decodable.' },
      { type: 'li', content: 'Contrast drill: sat vs sit, pin vs pan, tin vs tan to train vowel attention.' },
      { type: 'li', content: 'Parent correction line: "Let us tap each sound, now slide and read it."'},
      { type: 'p', content: 'This ladder helps children stop guessing and rely on decoding, which is the core of confident early reading.' },

      { type: 'h2', content: 'Troubleshooting' },
      { type: 'h3', content: 'If your child guesses words' },
      { type: 'p', content: 'Ask them to show the sounds: “Can you tap each sound for me?” If guessing continues, slow down and return to slow blending.' },
      { type: 'h3', content: 'If extra sounds appear (suh for s)' },
      { type: 'p', content: 'Model the pure sound without adding vowel-like endings. Practice with short bursts and tactile cues (finger tap per sound).' },
      { type: 'h3', content: 'If the middle vowel is skipped' },
      { type: 'p', content: 'Use a small pause or a gentle hum for the vowel: /s/ … /a/ … /t/, then blend. Reinforce by stretching the vowel slightly.' },
      { type: 'h3', content: 'If frustration shows up' },
      { type: 'p', content: 'Stop. Celebrate what went well and try again later with a favourite game. Keep sessions short and predictable.' },

      { type: 'h2', content: 'When to move on (readiness checklist + Week 3 teaser)' },
      { type: 'p', content: 'Move on when your child can reliably blend 6–8 CVC words with minimal prompting and enjoys at least one short practice per day.' },
      { type: 'li', content: 'Can blend 3 CVC words independently.' },
      { type: 'li', content: 'Can hear and say individual sounds for each letter used.' },
      { type: 'li', content: 'Shows curiosity about short books or words.' },
      { type: 'p', content: 'Week 3 introduces tricky words and high-frequency words while keeping blending practice alive. If you want guided lesson plans that follow this progression, Tiny Steps has structured lessons and short daily activities to help.' }
    ]
  },
  // Phonics SEO series (Mar 2026)
  ...PHONICS_SEO_POSTS.map(makePhonicsPost),
      // New SEO-targeted posts (Jan 2026)
      {
        slug: 'online-english-classes-for-kids-india',
        title: 'Online English classes for kids in India: how to choose the right program (ages 3–12)',
        category: 'Parent Tips',
        author: 'Tiny Steps Learning',
        date: '2026-01-10',
        readTime: '7 min',
        excerpt:
          "If you’re searching online English classes for kids in India, here’s a simple parent checklist: phonics-first reading, speaking confidence, writing, and stage-based progress updates—without overwhelm.",
        hero: '/blog/hero-parent-tips.jpg',
        body: [
          { type: 'p', content: "If you’re typing “online English classes for kids India” into Google, you’re not alone. Most parents want the same outcome: better communication, stronger reading, fewer writing struggles—and confidence in school." },
          { type: 'p', content: "The problem is that many programs look similar on the outside. So here’s a clear, parent-friendly way to choose the right one (especially for ages 3–12)." },
          { type: 'h2', content: '1) First check: does the program build reading, not just speaking?' },
          { type: 'p', content: 'Speaking improves faster when children can decode words confidently. A good program doesn’t treat reading as “extra.” It teaches phonics (letter sounds), blending, and simple reading routines alongside speaking practice.' },
          { type: 'h2', content: '2) 1:1 vs group: what works better for most Indian kids?' },
          { type: 'p', content: 'Many children are shy in groups, especially in English. In 1:1 sessions, the teacher can correct gently, prompt the child, and build confidence faster.' },
          { type: 'h2', content: '3) Look for a clear age-wise pathway (not random topics)' },
          { type: 'p', content: 'Parents often get confused because children learn best in a sequence. Ask the institute: “What will my child learn in the next 4 weeks?”' },
          { type: 'h2', content: '4) Speaking confidence needs a method (not just “talk more”)' },
          { type: 'p', content: 'Good spoken English classes for kids scaffold speaking: 10–15s → 30s → 60s using prompts and roleplay.' },
          { type: 'h2', content: '5) Grammar should show up inside real sentences' },
          { type: 'p', content: 'Grammar is learned through use, not lectures. Look for sentence games and speaking-to-writing activities.' },
          { type: 'h2', content: '6) Demand clear progress updates (simple and clear)' },
          { type: 'p', content: 'Ask for stage-based updates: what was taught, what the child can do now, what to practice, and the next goal.' },
          { type: 'h2', content: 'If you want, start with a free level check' },
          { type: 'p', content: 'A good online English tutor for kids will first identify your child’s level then recommend a plan. Explore our courses and FAQs.' },
        ]
      },
      {
        slug: 'best-phonics-classes-for-kids',
        title: 'Best phonics classes for kids: the parent checklist (plus a 10-minute daily routine)',
        category: 'Phonics',
        author: 'Tiny Steps Learning',
        date: '2026-01-10',
        readTime: '8 min',
        excerpt:
          'Choosing the best phonics classes for kids? Use this simple checklist: sound-first teaching, blending support, correct letter formation, decodable reading, and clear progress updates.',
        hero: '/blog/hero-phonics.jpg',
        body: [
          { type: 'p', content: 'Parents often say: “My child knows ABC but can’t read.” That’s exactly what phonics is designed to solve—by teaching children how to decode words using sounds.' },
          { type: 'p', content: 'If you’re comparing the best online phonics programs, here’s a clean checklist (no confusion, no jargon).' },
          { type: 'h2', content: 'What good phonics looks like (in one line)' },
          { type: 'p', content: 'Sound → blend → read → spell → fluency. If any step is missing, progress becomes slow.' },
          { type: 'h2', content: '1) Sound-first teaching (not letter names first)' },
          { type: 'p', content: 'Early readers must hear and say sounds clearly. If a program starts with A-B-C names and long worksheets, kids often struggle to blend later.' },
          { type: 'h2', content: '2) A smart sequence (SATPIN style progression)' },
          { type: 'p', content: 'Phonics learning for children works best when letters are introduced in a sequence that quickly forms words.' },
          { type: 'h2', content: '3) Blending support (most kids need this!)' },
          { type: 'p', content: 'Many children know letter sounds but still cannot blend. That doesn’t mean they’re weak—it means blending needs separate teaching.' },
          { type: 'h2', content: '4) Decodable reading (not guessing from pictures)' },
          { type: 'p', content: 'Decodable reading uses words the child can actually decode. That builds real reading.' },
          { type: 'h2', content: '5) Correct letter formation + tracing guidance' },
          { type: 'p', content: 'Writing supports reading. When children form letters correctly, they remember sounds better and reduce reversals over time.' },
          { type: 'h2', content: '6) Progress tracking parents can understand' },
          { type: 'p', content: 'Parents need clarity: sounds mastered, blending ability, words read, next goal.' },
          { type: 'h2', content: 'A simple 10-minute daily routine (at home)' },
          { type: 'p', content: 'Try this: 1 minute revise 3 sounds; 2 minutes blend 5 words; 3 minutes read a tiny list; 2 minutes write 2–3 words; 2 minutes read one short sentence.' },
        ]
      },
      {
        slug: 'spoken-english-classes-for-kids-confidence',
        title: 'Spoken English classes for kids: a simple confidence plan for shy children (ages 4–12)',
        category: 'Public Speaking',
        author: 'Tiny Steps Learning',
        date: '2026-01-10',
        readTime: '7 min',
        excerpt:
          'If your child understands English but hesitates to speak, this step-by-step confidence plan helps: short prompts, sentence frames, gentle corrections, and weekly practice.',
        hero: '/blog/hero-speaking.jpg',
        body: [
          { type: 'p', content: 'Many children in India understand English but don’t speak confidently. This is usually not a “knowledge problem”—it’s a confidence + practice design problem.' },
          { type: 'p', content: 'If you’re searching for spoken English classes for kids, use this simple plan to check whether a program will actually help your child speak.' },
          { type: 'h2', content: 'Why kids stay silent (even when they know the answer)' },
          { type: 'p', content: 'Common reasons: fear of mistakes, being corrected too sharply, not having the words ready, being forced to speak for too long.' },
          { type: 'h2', content: 'A 4-step confidence ladder (what good classes follow)' },
          { type: 'p', content: 'Step 1: 10–15 second answers; Step 2: 2-sentence speaking; Step 3: 30–60 second picture talk; Step 4: 1–2 minute structured speaking.' },
          { type: 'h2', content: 'Sentence frames help kids speak instantly' },
          { type: 'p', content: 'Ask if the teacher uses sentence frames like: “I can see…”, “My favourite… because…”.' },
        ]
      },
  {
    slug: 'week-3-phonics-tricky-words',
    title: 'Week 3: Introduce Tricky Words the Smart Way',
    category: 'Phonics',
    author: 'Priya',
    date: '2025-12-24',
    readTime: '9 min',
    excerpt: "A seven‑day tricky‑word plan: gentle memory hooks, short context practice and brief spaced reviews to help children recognise high‑frequency words without heavy drilling or pressure.",
    body: [
      { type: 'h2', content: 'What “tricky words” really are (and why kids struggle)' },
      { type: 'p', content: 'Tricky words (also called high-frequency or sight words) are words that do not follow regular letter-sound patterns easily. Examples are “the”, “to”, and “was”. Children struggle because these words often require memory or a special cue rather than pure decoding.' },
      { type: 'p', content: 'Understanding this helps parents change approach: less drilling, more gentle memory hooks and repeated exposure in short, enjoyable bursts.' },

      { type: 'h2', content: 'The smart order to teach tricky words (don’t overload)' },
      { type: 'p', content: 'Start small. Teach 1–2 tricky words at a time alongside decodable words. Choose words that appear in your child’s short reading lines so practice transfers quickly.' },
      { type: 'p', content: 'Order suggestion: 1) “the” 2) “to” 3) “was” 4) “said”. Teach the first three in Week 3 and add “said” only if blends are steady.' },

      { type: 'h2', content: 'The 3-part method: Read it / Build it / Fix the tricky part' },
      { type: 'h3', content: '1) Read it' },
      { type: 'p', content: 'Show the word in a short sentence and read it together. Parent reads the sentence aloud; child points to or echoes the word "the".' },
      { type: 'h3', content: '2) Build it' },
      { type: 'p', content: 'Use letter cards or magnetic letters to build the word. For “the”, you might point out that the letters don’t blend like a normal CVC word — that’s OK.' },
      { type: 'h3', content: '3) Fix the tricky part' },
      { type: 'p', content: "Give a simple memory cue for the irregular part. For 'the' try this clear parent script: 'th' is one new sound and the final 'e' often sounds like /uh/ — so we learn 'the' as a whole word (say it and spot it)." },

      { type: 'h2', content: 'Week 3 plan (7 days, 10 minutes/day)' },
      { type: 'p', content: 'Each day: warm-up (2–3 min), tricky word focus (4–5 min), playful review (2–3 min). Keep the 2‑minute rule in mind: stop while it’s happy.' },
      { type: 'h3', content: 'Day 1 — Introduce “the”' },
      { type: 'p', content: 'Show the word in a sentence, say it together, build it with letters, and give the memory cue.' },
      { type: 'h3', content: 'Day 2 — Reinforce “the” with games' },
      { type: 'p', content: 'Play a quick find-the-word game in a book or list. Praise every correct recognition.' },
      { type: 'h3', content: 'Day 3 — Introduce “to”' },
      { type: 'p', content: 'Repeat the 3-part method for “to”: read, build, fix. Use a short phrase: “to the shop”.' },
      { type: 'h3', content: 'Day 4 — Mix practice: the + to' },
      { type: 'p', content: 'Run short exercises alternating the two words in sentences and quick games.' },
      { type: 'h3', content: 'Day 5 — Introduce “was” (if ready)' },
      { type: 'p', content: 'Teach “was” similarly, using a small visual cue (e.g., a small cloud symbol) to mark the tricky vowel sound.' },
      { type: 'h3', content: 'Day 6 — Review day' },
      { type: 'p', content: 'Use spaced repetition: quick flash, a sentence read, and a game. Keep it positive.' },
      { type: 'h3', content: 'Day 7 — Game + mini-check' },
      { type: 'p', content: 'Play several short games and run a 1-minute check: can your child spot “the” and “to” in short lines? Celebrate progress.' },

      { type: 'h2', content: '10 quick games for tricky words (no worksheets needed)' },
      { type: 'li', content: 'Treasure Hunt — hide word cards and find them.' },
      { type: 'li', content: 'Word Swap — swap one letter card to show why it’s tricky.' },
      { type: 'li', content: 'Cover & Recall — show word for 3 seconds, cover, child recalls.' },
      { type: 'li', content: 'Sentence Spot — read a short sentence and ask “Where is the word ‘the’?”' },
      { type: 'li', content: 'Memory Photo — child draws a tiny picture cue for the tricky part.' },
      { type: 'li', content: 'Echo Read — you read the sentence, child echoes the tricky word.' },
      { type: 'li', content: 'Match Pairs — match printed word to handwritten version.' },
      { type: 'li', content: 'Sticker Find — place stickers next to tricky words in a short passage.' },
      { type: 'li', content: 'Act It Out — act the sentence and emphasise the tricky word.' },
      { type: 'li', content: 'Quick Quiz — 3-second flash, child points to correct card.' },

      { type: 'h2', content: 'How to use tricky words in real reading + simple sentences' },
      { type: 'p', content: 'Always show tricky words in context: read short sentences like “The sun is hot.” Point to the word each time it appears and use the 3-part method if the child hesitates.' },
      { type: 'p', content: 'Use familiar names and routines — morning, school, snack — so the words feel useful, not abstract.' },

      { type: 'h2', content: 'Spaced repetition plan (how to review without boredom)' },
      { type: 'p', content: 'Short, scheduled reviews work best: after initial teaching, revisit the word later the same day, the next day, then after two days, then a week. Keep each review under 2 minutes.' },
      { type: 'p', content: 'Mix reviews with games so repetition stays playful.' },

      { type: 'h2', content: 'Common mistakes parents make (and what to do instead)' },
      { type: 'p', content: 'Mistake: over-drilling single words with flashcards for long periods. Instead: embed words in sentences and games.' },
      { type: 'p', content: 'Mistake: pushing too many tricky words at once. Instead: teach 1–2 at a time and review daily.' },

      { type: 'h2', content: 'Signs your child is ready for Week 4 (long vowel patterns teaser)' },
      { type: 'p', content: 'If your child can recognise “the” and “to” in short lines, build them with letters, and show improved recall after two short reviews, they are likely ready for Week 4.' },
      { type: 'p', content: 'Week 4 will introduce long vowel patterns (magic-e and vowel teams) with the same low-pressure, game-based approach.' },

      { type: 'h2', content: 'Micro-checklist' },
      { type: 'li', content: 'Can spot “the” and “to” in a short sentence.' },
      { type: 'li', content: 'Can build at least one tricky word with letter cards.' },
      { type: 'li', content: 'Shows small wins and tolerates brief practice (5–10 minutes).' }
    ]
  },
  {
    slug: 'week-4-phonics-long-vowels',
    title: 'Week 4: Long Vowel Patterns Without Tears',
    category: 'Phonics',
    author: 'Priya',
    date: '2025-12-29',
    readTime: '9 min',
    excerpt: "Seven short lessons for long vowels: magic‑e and vowel teams taught with quick visuals, short games and decodable reading so patterns stick without stress.",
    body: [
      { type: 'h3', content: 'Prerequisite' },
      { type: 'p', content: 'This week is for children who can already read 30–50 CVC words with short vowels and know most letter sounds.' },
      { type: 'h2', content: 'Why long vowels confuse children (short vs long, “name” vowel idea)' },
      { type: 'p', content: 'Long vowels are confusing because letters can say two things: a short sound (kit = /ɪ/) and a long “name” sound (kite = /aɪ/). Children who learned short vowel decoding are surprised when the same letters change sound.' },
      { type: 'p', content: 'This is not a failure — it’s a new pattern. The aim is to give a clear visual and a tiny rule so the child recognises the change quickly.' },

      { type: 'h2', content: 'Two big patterns: Magic‑e and vowel teams (keep it simple)' },
      { type: 'p', content: 'There are two main ways long vowels appear: the “magic‑e” (cap → cape) and vowel teams (ai, oa, ee, ea). Teach one pattern at a time so the child doesn’t mix rules.' },
      { type: 'p', content: 'Start with magic‑e because it is easy to show visually and gives dramatic quick wins.' },

      { type: 'h2', content: 'Start with Magic‑e (the “flip” rule kids understand fast)' },
      { type: 'p', content: 'Show a short pair: cap and cape. Explain: “See the e at the end? It’s quiet but it makes the vowel say its name — like a tiny magic friend.”' },
      { type: 'p', content: 'Visual anchor (10‑second draw): draw a small hat above the last letter for short vowels, and a tiny wand over the final e for magic‑e. Parents can sketch this on a scrap of paper while teaching.' },
      { type: 'p', content: 'Script: “Let’s flip the e — cap becomes cape. Listen: /c/ /a/ /p/ → cap. Now add the magic e: /c/ /a/ /p/ …cape!”' },

      { type: 'h2', content: 'Week 4 plan (7 days, 12 minutes/day)' },
      { type: 'p', content: 'Keep sessions short: warm-up (2 min), teach/play (8 min), celebrate & stop (2 min). Use the 3‑wins rule: when your child reads 3 words correctly, celebrate and stop.' },
      { type: 'h3', content: 'Day 1 — Introduce magic‑e with cap/cape' },
      { type: 'p', content: 'Show both words, draw the wand over e, say the short word then the long word. Child echoes.' },
      { type: 'h3', content: 'Day 2 — Practice 4 pairs' },
      { type: 'p', content: 'Pairs: pin/pine, kit/kite, hop/hope, cut/cute. Use letter cards and the finger slide under the word when blending.' },
      { type: 'h3', content: 'Day 3 — Mini‑games and quick checks' },
      { type: 'p', content: 'Play treasure hunt with the pairs and ask the child to read the found word.' },
      { type: 'h3', content: 'Day 4 — Introduce one vowel team (ai or oa)' },
      { type: 'p', content: 'Show ai and say it sounds like the name of the vowel: /eɪ/. Use simple words like rain/boat.' },
      { type: 'h3', content: 'Day 5 — Mix magic‑e and vowel team practice' },
      { type: 'p', content: 'Give a short worksheet of 6 words (mix) but make it a game: sort into two baskets: magic‑e or team.' },
      { type: 'h3', content: 'Day 6 — Read a short decodable text' },
      { type: 'p', content: 'Choose a 1–2 sentence decodable line with mixed long vowels. Point and blend together.' },
      { type: 'h3', content: 'Day 7 — Celebration + quick review' },
      { type: 'p', content: 'Play favourite games from the week and run the 3‑wins quick test. End on praise.' },

      { type: 'h2', content: 'Mini‑games to teach long vowels (8–12)' },
      { type: 'li', content: 'Magic Wand — child waves a wand over the final e and says the long word.' },
      { type: 'li', content: 'Pair Match — match cap→cape cards.' },
      { type: 'li', content: 'Sound Slide — slide finger under letters as you say sounds slowly then fast.' },
      { type: 'li', content: 'Treasure Sort — sort words into magic‑e vs team baskets.' },
      { type: 'li', content: 'Flash & Cover — show word 3s, cover, child says it.' },
      { type: 'li', content: 'Puppet Read — puppet reads the short word; child adds magic e to make it long.' },
      { type: 'li', content: 'Picture Swap — show two pictures (cap vs cape), child picks correct word.' },
      { type: 'li', content: 'Sticker Ladder — one sticker per correct long vowel read.' },
      { type: 'li', content: 'Vowel Team Race — who reads 5 team words correctly first (gentle).' },

      { type: 'h2', content: 'Word list: minimal pairs' },
      { type: 'p', content: 'Use simple pairs: cap / cape, pin / pine, hop / hope, kit / kite, cut / cute. These show the pattern clearly and are easy to act out.' },
      { type: 'p', content: 'Choose 4–6 words per practice: 3 review + 1–3 new.' },

      { type: 'h2', content: 'How to stop guessing (sound it, check it, fix it)' },
      { type: 'p', content: 'If a child guesses, use a calm script: “Let’s sound it together: /c/ /a/ /p/. Now check — do we add a magic e? If yes, say cape.” This models checking rather than guessing.' },
      { type: 'p', content: 'Encourage the child to use the visual anchor (wand/hat) to decide whether the vowel is long.' },

      { type: 'h2', content: 'Troubleshooting' },
      { type: 'p', content: 'Silent‑e forgotten: slow down and point to the final e every time; have the child tap it.' },
      { type: 'p', content: 'Reading “hop” as “hope” too early: remind them to look for the final e or vowel team before changing the vowel sound.' },
      { type: 'p', content: 'Confusion with teams: teach one team at a time and use distinct pictures for each to reduce mixing.' },

      { type: 'h2', content: 'When to move on (Week 5 R‑controlled teaser)' },
      { type: 'p', content: 'Move on when your child reads 6–8 minimal pairs with 80% accuracy across two short sessions. Also ensure they can explain the wand/hat visual anchor.' },
      { type: 'p', content: 'Week 5 focuses on R‑controlled vowels (ar/or/er). We’ll use movement and action hooks to help memory.' },

      { type: 'h2', content: 'Quick parent scripts and visual anchor summary' },
      { type: 'p', content: '10‑second visual: draw a tiny wand over final e for magic‑e. Draw a linked chain for vowel teams (ai, oa).' },
      { type: 'p', content: 'Say this: “We flip the e — it’s quiet but strong. Cap becomes cape. Can you wave the wand and say cape?”' },
      { type: 'p', content: 'Rules: stop while it’s happy. 3 wins then stop. Keep praise specific: “You heard the long vowel — great listening!”' }
    ]
  },
  {
    slug: 'week-5-phonics-r-controlled',
    title: 'Week 5: R-Controlled Vowels Made Simple',
    category: 'Phonics',
    author: 'Priya',
    date: '2026-01-03',
    readTime: '9 min',
    excerpt: "Seven quick sessions to teach R‑controlled vowels with clear action hooks and multisensory cues: short, playful practice that helps children remember bossy‑R patterns calmly.",
    body: [
      { type: 'h3', content: 'Prerequisite' },
      { type: 'p', content: 'This week is for children who can already read 30–50 CVC words with short vowels and know most letter sounds.' },
      { type: 'h2', content: 'What "bossy R" does (why the vowel changes)' },
      { type: 'p', content: 'When R follows a vowel (as in “ar”, “or”, “er”), it changes the vowel sound. Instead of a clear short or long vowel, the R pulls the vowel toward its own sound — children hear a new combined sound.' },
      { type: 'p', content: 'This “bossy R” effect can feel odd after weeks of simple CVC decoding. The goal in Week 5 is to make these shifts predictable with movement and simple cues so the child doesn’t guess or get confused.' },

      { type: 'h2', content: 'Teach in the easiest order (start with “ar” and “or”, then “er/ir/ur”)' },
      { type: 'p', content: 'Begin with the clearest sounds: “ar” (car, star) and “or” (for, born). These are distinct and children can feel them when saying the words.' },
      { type: 'p', content: 'Leave the trickier trio (er, ir, ur) for later in the week — they sound similar in many accents and are best taught with multi-sensory anchors.' },

      { type: 'h2', content: 'Action hooks that work (body actions for each)' },
      { type: 'p', content: 'Movement helps memory. Try these quick actions — one clear action per vowel cluster.' },
      { type: 'li', content: '“ar” — steering wheel arms: hold both hands and pretend to steer; say /ar/ like a long engine sound.' },
      { type: 'li', content: '“or” — hand over heart then point out: a gentle round shape with hands for the /or/ sound.' },
      { type: 'li', content: '“er”/“ir”/“ur” — shrug shoulders + tiny nod; call it the “thinking sound” and use a single gesture for all three while teaching differences with examples.' },
      { type: 'p', content: 'Keep actions short and consistent — use the same gesture every time so it becomes a reliable cue.' },

      { type: 'h2', content: 'Week 5 plan (7 days, 10–12 min/day)' },
      { type: 'p', content: 'Daily structure: warm-up (2 min), teach + action (6–8 min), game/review (2 min). Use the 3‑wins rule: stop after three correct reads.' },
      { type: 'h3', content: 'Day 1 — Introduce “ar”' },
      { type: 'p', content: 'Show 4 words (car, star, park, far). Demonstrate steering-wheel action and say the sound together. Build with letter cards.' },
      { type: 'h3', content: 'Day 2 — Practice “ar” with games' },
      { type: 'p', content: 'Play Treasure Sort (find “ar” words) and do quick read‑alouds.' },
      { type: 'h3', content: 'Day 3 — Introduce “or”' },
      { type: 'p', content: 'Show words: for, horn, sort, corn. Use the heart/round hands action and echo-read.' },
      { type: 'h3', content: 'Day 4 — Mix “ar” and “or”' },
      { type: 'p', content: 'Alternate words and sort them into two baskets using the actions as clues.' },
      { type: 'h3', content: 'Day 5 — Teach “er/ir/ur” (one at a time)' },
      { type: 'p', content: 'Introduce one of the trio with the shrug action and use simple words like her, bird, turn.' },
      { type: 'h3', content: 'Day 6 — Reading practice with tiny sentences' },
      { type: 'p', content: 'Read short decodable lines: “The car is red.” “He sat by the fire.” Point and use gestures.' },
      { type: 'h3', content: 'Day 7 — Game day + quick assessment' },
      { type: 'p', content: 'Play favourite games from the week and run a micro‑check: can your child read 5 R‑controlled words correctly? Celebrate and stop.' },

      { type: 'h2', content: 'Game bank (8–12 games)' },
      { type: 'li', content: 'Steering Race — read “ar” words while pretending to drive.' },
      { type: 'li', content: 'Heart Hunt — find “or” words in a short passage.' },
      { type: 'li', content: 'Gesture Match — match word to correct action card.' },
      { type: 'li', content: 'Build & Read — build words with magnets and read aloud.' },
      { type: 'li', content: 'Quick Flash — 3‑second show then cover, child reads.' },
      { type: 'li', content: 'Puppet Prompt — puppet asks “Which word has ar?” and child answers.' },
      { type: 'li', content: 'Sticker Sort — place stickers under correct vowel group.' },
      { type: 'li', content: 'Vowel Team Relay — two players pick correct cards and read.' },
      { type: 'li', content: 'Echo & Swap — you read, child echoes, then swap roles.' },

      { type: 'h2', content: 'Word list (kid‑friendly words + avoid rare ones)' },
      { type: 'p', content: 'Use common, familiar words: AR — car, star, park, barn, far. OR — for, horse, corn, fork, born. ER/IR/UR — her, bird, turn, surf (keep examples short and frequent).' },
      { type: 'p', content: 'Avoid rare or complex words with unusual spellings until the child has practice with common patterns.' },

      { type: 'h2', content: 'Bossy-R example sets and sentence practice' },
      { type: 'p', content: 'Parents often ask for exact examples. Use these mini sets during the week and rotate one set per day.' },
      { type: 'li', content: 'AR set: car, star, farm, park. Sentence: "The car is far." "A star is in the dark."'},
      { type: 'li', content: 'OR set: horn, fork, storm, corn. Sentence: "The horn is loud." "We eat corn."'},
      { type: 'li', content: 'ER/IR/UR set: her, bird, shirt, turn, fur. Sentence: "The bird can turn." "Her shirt is purple."'},
      { type: 'li', content: 'Sort-and-read task: mix 9 cards and ask child to sort into AR / OR / ER-IR-UR, then read each row.'},
      { type: 'li', content: 'Parent script: "R changes the vowel sound. Let us read the chunk together: ar, or, er."'},
      { type: 'p', content: 'When children read these sets smoothly, start adding one new bossy-R word per session while keeping at least three review words.' },

      { type: 'h2', content: 'Common confusions (er/ir/ur) and how to simplify' },
      { type: 'p', content: 'Many accents pronounce er/ir/ur similarly. Teach one neutral gesture for the trio and focus first on reading functional words (her, bird, turn) in context rather than perfect pronunciation.' },
      { type: 'p', content: 'If phonetic detail matters later, refine pronunciation once decoding is stable.' },

      { type: 'h2', content: 'Reading practice: tiny sentences + decodable phrases' },
      { type: 'p', content: 'Use short sentences that include R‑controlled words: “The car is red.” “She went for a walk.” Point to each word and use the action hooks as you read.' },
      { type: 'p', content: 'Keep practice under 10–12 minutes and end when the child has achieved three correct reads.' },

      { type: 'h2', content: 'Done checklist + Week 6 comprehension teaser' },
      { type: 'li', content: 'Can read 6–8 R‑controlled words correctly across two short sessions.' },
      { type: 'li', content: 'Uses the gesture cue to help decode new words.' },
      { type: 'li', content: 'Reads tiny sentences with one R‑controlled word with confidence.' },
      { type: 'p', content: 'When these are true, move to Week 6 where we focus on comprehension: asking who/what/where questions and using short texts to check understanding.' },

      { type: 'h2', content: 'Parent scripts and quick review plan' },
      { type: 'p', content: 'Script: “Let’s drive the car and say /ar/ — car. Great! Can you say car and steer with me?”' },
      { type: 'p', content: 'Quick review plan: revisit new R‑words later the same day, next day, and after two days. Keep each review to 1–2 minutes and mix with a game.' },
      { type: 'p', content: 'Do not over‑correct small pronunciation differences; aim for functional reading and confidence.' }
    ]
  },
  {
    slug: 'week-6-phonics-comprehension',
    title: 'Week 6: From Sounding Out to Understanding',
    category: 'Phonics',
    author: 'Priya',
    date: '2026-01-08',
    readTime: '9 min',
    excerpt: "Move from decoding to understanding in seven days: adopt a 3‑question habit, stop‑and‑talk prompts and short review routines that make reading meaningful and motivating.",
    body: [
      { type: 'h2', content: 'When comprehension should start (even with simple decoding)' },
      { type: 'p', content: 'Comprehension can and should start as soon as a child can decode a few words. Understanding short sentences builds meaning and motivation — reading becomes useful, not just a puzzle.' },
      { type: 'p', content: 'You do not need full fluency to ask simple questions. Even one decoded sentence gives a chance to check understanding and build vocabulary.' },

      { type: 'h2', content: 'The 3‑question habit: Who? What happened? Where/When?' },
      { type: 'p', content: 'Make asking three short, repeatable questions a habit after every page or two: Who is it about? What happened? Where or when did it happen?' },
      { type: 'p', content: 'Example: after “The dog ran to the park.” ask: Who ran? (The dog.) What happened? (It ran.) Where did it run? (To the park.) Keep answers short and praise attempts.' },

      { type: 'h2', content: 'How to read with your child (without turning it into a test)' },
      { type: 'p', content: 'Keep a calm, conversational tone. Read a line, point to the words, then ask one question. Use the child’s interests and daily routines to make the reading relatable.' },
      { type: 'p', content: 'Use “think‑alouds”: model your thinking briefly — “I see a red ball. I wonder who threw it?” This shows comprehension strategies rather than quizzing.' },

      { type: 'h2', content: 'Week 6 plan (7 days, 10 minutes/day)' },
      { type: 'p', content: 'Each session: warm-up (2 min), guided reading + stop‑and‑talk (6 min), vocabulary play (2 min). Keep the 2‑minute rule: end while it is still fun.' },
      { type: 'h3', content: 'Day 1 — Model the 3‑question habit' },
      { type: 'p', content: 'Read 1–2 short lines and ask the three questions. Praise every attempt and keep answers one or two words.' },
      { type: 'h3', content: 'Day 2 — Practice with picture prompts' },
      { type: 'p', content: 'Show a picture, ask the three questions, then read a line that matches the picture. Link words to images.' },
      { type: 'h3', content: 'Day 3 — Add “stop‑and‑talk” prompts' },
      { type: 'p', content: 'Use prompts from the list below during reading. Keep your voice gentle and curious.' },
      { type: 'h3', content: 'Day 4 — Tiny sentence sequencing' },
      { type: 'p', content: 'Read three short sentences and ask the child to put picture cards in order to show the story.' },
      { type: 'h3', content: 'Day 5 — Vocabulary day (1 new word)' },
      { type: 'p', content: 'Pick one useful word from the text, show a picture, and use it in three places (sentence, toy, daily routine).' },
      { type: 'h3', content: 'Day 6 — Reading with role play' },
      { type: 'p', content: 'Let the child act out a sentence or be a puppet narrator. This deepens meaning without extra pressure.' },
      { type: 'h3', content: 'Day 7 — Quick check & celebrate' },
      { type: 'p', content: 'Run a 1‑minute micro‑check: ask the 3 questions for two lines. Celebrate every correct or improved answer.' },

      { type: 'h2', content: '“Stop‑and‑talk” prompts (20 easy prompts)' },
      { type: 'li', content: 'What is the dog doing?' },
      { type: 'li', content: 'Who is in this picture?' },
      { type: 'li', content: 'Where did they go?' },
      { type: 'li', content: 'When did this happen?' },
      { type: 'li', content: 'How do you think they feel?' },
      { type: 'li', content: 'What might happen next?' },
      { type: 'li', content: 'Find the word for “big” in the line.' },
      { type: 'li', content: 'Which word tells us where?' },
      { type: 'li', content: 'Show me the word that means “run”.' },
      { type: 'li', content: 'Point to the person who is happy.' },
      { type: 'li', content: 'What did they use (toy/tool)?' },
      { type: 'li', content: 'Find a word you know.' },
      { type: 'li', content: 'Can you say that in your words?' },
      { type: 'li', content: 'Who helped who?' },
      { type: 'li', content: 'Which part was funniest?' },
      { type: 'li', content: 'Show me the first word.' },
      { type: 'li', content: 'Which word tells the time?' },
      { type: 'li', content: 'Name one thing in the picture.' },
      { type: 'li', content: 'What would you ask the character?' },
      { type: 'li', content: 'Can you tell the story in two sentences?' },

      { type: 'h2', content: 'Vocabulary the easy way (1 word/day, use in 3 places)' },
      { type: 'p', content: 'Pick a single useful word each day. Show a picture, say the word, use it in a sentence, and ask the child to use it in a sentence or action.' },
      { type: 'p', content: 'Example: word = “park”. Say: “We will go to the park.” Then: point to a toy car and say, “The car goes to the park.” Later, ask the child to show the park with a toy.' },

      { type: 'h2', content: 'Troubleshooting: child reads but doesn’t understand / rushes / guesses' },
      { type: 'p', content: 'If a child reads words but shows no understanding, slow the pace and focus on one sentence. Use pictures and the 3‑question habit to link words to meaning.' },
      { type: 'p', content: 'If the child rushes, try whisper reading together or echo reading where you read first and the child repeats. If guessing is frequent, model checking: “Let’s sound it and then think if it makes sense.”' },

      { type: 'h2', content: 'Signs Week 6 is done' },
      { type: 'li', content: 'Child answers the 3 questions for short sentences with one or two words.' },
      { type: 'li', content: 'Child uses the daily vocabulary word in one other context.' },
      { type: 'li', content: 'Reading sessions feel conversational, not testing.' },

      { type: 'h2', content: 'Next step: bridging to grammar week (Week 7 teaser)' },
      { type: 'p', content: 'Week 7 moves from comprehension to simple grammar: naming nouns, adding details, and writing short four‑sentence paragraphs. Comprehension skills from Week 6 make this transition smooth.' },

      { type: 'h2', content: 'Parent scripts and micro‑checklist' },
      { type: 'p', content: 'Scripts: “Who is this about?” “What happened?” “Where did it happen?” Praise specifically: “Nice thinking — you said who and where!”' },
      { type: 'p', content: 'Micro‑checklist: ask the 3 questions for two lines; teach 1 vocab word and use in 3 places; end with a quick praise and a sticker if you like.' }
    ]
  },
  {
    slug: 'week-7-grammar-nouns-to-paragraphs',
    title: 'Grammar Basics Roadmap: Nouns to Paragraphs in 7 Days (Ages 3-10)',
    category: 'Grammar',
    author: 'Tiny Steps Research Desk',
    date: '2026-04-03',
    readTime: '12 min read',
    hero: '/blog/hero-research.jpg',
    metaDescription:
      'A research-backed grammar roadmap for ages 3-10: nouns, verbs, sentence boundaries, sentence combining, and short paragraph writing in 10 calm minutes a day.',
    excerpt: 'A premium week 7 grammar guide for parents who want to move children from naming words to clear sentences and short paragraphs without rule-heavy worksheets.',
    body: [
      { type: 'h2', content: 'Why grammar should feel like “meaning”, not memorizing rules' },
      { type: 'p', content: 'Grammar is easiest when it helps children say what they mean. Instead of drills, focus on choosing words that tell a story: who, what happened, and one detail.' },
      { type: 'p', content: 'When grammar connects to ideas, children write with purpose — and confidence grows faster than from memorising forms.' },

      { type: 'h2', content: 'Nouns made easy (person/place/thing/idea + naming game)' },
      { type: 'p', content: 'Explain nouns simply: a noun names a person, place, thing or idea. Play a quick naming game: pick a toy and ask, “Who is this? Where is it? What is it?”' },
      { type: 'p', content: 'Use daily contexts (school, park, kitchen) so the noun bank stays relevant and memorable.' },

      { type: 'h2', content: 'Sentence building first: who + did what (subject + verb)' },
      { type: 'p', content: 'Start with small sentences: subject (who) and verb (did what). Model it: “The boy (who) runs (did what).” Then extend by adding one detail.' },
      { type: 'p', content: 'Use the I do → we do → you do model: write one sentence together, then let the child finish the next one.' },

      { type: 'h2', content: 'The 4‑sentence paragraph frame (topic, detail, detail, closer)' },
      { type: 'p', content: 'Teach a simple structure: 1) Topic sentence (what the paragraph is about). 2) Two detail sentences (one or two facts). 3) Closer (wrap-up or feeling).' },
      { type: 'p', content: 'Sample Grade 1 paragraph: “My cat is small. It likes milk. It sleeps on my bed. I love my cat.”' },
      { type: 'p', content: 'Sample Grade 2 paragraph: “Ria went to the park. She saw a green kite. The kite flew very high. Ria was very happy.”' },

      { type: 'h2', content: 'Week 7 plan (7 days, 12 minutes/day)' },
      { type: 'p', content: 'Daily structure: warm-up naming game (2 min), guided sentence building (6–8 min), short independent write or draw (2–3 min). Keep sessions short and celebratory.' },
      { type: 'h3', content: 'Day 1 — Noun naming + write one sentence' },
      { type: 'p', content: 'Play naming game with toys and write one sentence together: “The dog runs.”' },
      { type: 'h3', content: 'Day 2 — Add a verb and one detail' },
      { type: 'p', content: 'Model who + did what + detail. Use a picture to prompt ideas.' },
      { type: 'h3', content: 'Day 3 — Paragraph frame practice' },
      { type: 'p', content: 'Work through the 4 sentences together using prompts.' },
      { type: 'h3', content: 'Day 4 — Independent attempt (draw + write)' },
      { type: 'p', content: 'Child draws the scene, labels nouns, and writes short sentences with help.' },
      { type: 'h3', content: 'Day 5 — Game day (see bank)' },
      { type: 'p', content: 'Use grammar games to practise sentence parts without pressure.' },
      { type: 'h3', content: 'Day 6 — Build a paragraph together' },
      { type: 'p', content: 'Parent and child each write two sentences, then read the paragraph aloud.' },
      { type: 'h3', content: 'Day 7 — Share + celebrate' },
      { type: 'p', content: 'Child reads their paragraph to a family member. Give specific praise for content (not handwriting).' },

      { type: 'h2', content: '10 quick grammar games (no heavy worksheets)' },
      { type: 'li', content: 'Noun Hunt — find five nouns in a room.' },
      { type: 'li', content: 'Verb Charades — act out verbs and guess.' },
      { type: 'li', content: 'Detail Swap — change one detail in a sentence.' },
      { type: 'li', content: 'Story Dice — roll and make a one-line sentence.' },
      { type: 'li', content: 'Sentence Jigsaw — cut a sentence into parts and reorder.' },
      { type: 'li', content: 'Picture Prompt — draw and label nouns/verbs.' },
      { type: 'li', content: 'Role Play — act the paragraph.' },
      { type: 'li', content: 'Two‑word challenge — make a sentence with two cards.' },
      { type: 'li', content: 'Finish the line — parent starts, child finishes.' },
      { type: 'li', content: 'Praise Badge — award badges for three clear sentences.' },

      { type: 'h2', content: 'Mini word banks for Grades 1–2 (nouns/verbs/adjectives)' },
      { type: 'p', content: 'Grade 1 nouns: cat, dog, ball, school, mom. Verbs: runs, eats, sleeps, plays. Adjectives: big, small, red, happy.' },
      { type: 'p', content: 'Grade 2 nouns: kite, park, teacher, cake, friend. Verbs: flew, climbed, shared, laughed. Adjectives: blue, tall, noisy, bright.' },

      { type: 'h2', content: 'Troubleshooting (child writes 1‑line only / repeats words / messy spelling / refuses to write)' },
      { type: 'p', content: 'If your child writes one line, celebrate it and slowly add a second the next day. For repeated words, offer gentle prompts: “Can you think of another word that means the same?”' },
      { type: 'p', content: 'If spelling is messy, focus on ideas and use a word bank for correct spellings nearby. If the child refuses, switch to drawing or oral storytelling and try writing later.' },

      { type: 'h2', content: 'Done checklist + Week 8 tenses teaser' },
      { type: 'li', content: 'Can write 3 simple sentences that make sense.' },
      { type: 'li', content: 'Uses at least one noun and one verb correctly.' },
      { type: 'li', content: 'Feels proud to share their paragraph.' },
      { type: 'p', content: 'When these are true, move to Week 8 where we use colour coding to teach past/present/future in short spoken and written activities.' },

      { type: 'h2', content: 'Parent scripts (“Let’s say it first… now write it.”)' },
      { type: 'p', content: 'Script: “Let’s say one sentence about your picture. Now I will write it and you say the words. Your turn to write one.”' },
      { type: 'p', content: 'Confidence tip: three good sentences = success. Celebrate content and ideas before neatness.' }
    ]
  },
  {
    slug: 'week-8-grammar-tenses',
    title: 'Week 8: Tenses Without Tears',
    category: 'Grammar',
    author: 'Priya',
    date: '2026-01-20',
    readTime: '9 min',
    excerpt: "Seven short 'tense talks' using a simple timeline and colour cues to make past, present and future visible and usable in everyday family sentences.",
    body: [
      { type: 'h2', content: 'Why tense mistakes happen (“he go”, “yesterday I go”) — not laziness, it’s development' },
      { type: 'p', content: 'Children often say “he go” or “yesterday I go” because tense is a layer on top of meaning. Young learners focus on who and what first; adding time is a later step.' },
      { type: 'p', content: 'This is normal. Our job is to make time visible and simple so the child can map words to time without pressure.' },

      { type: 'h2', content: 'The 3 time zones: Past / Present / Future (simple definition)' },
      { type: 'p', content: 'Past: something that already happened (yesterday). Present: happening now. Future: will happen later (tomorrow).' },
      { type: 'p', content: 'Use everyday moments to name the time: breakfast (past for yesterday, present for now, future for tomorrow’s plan).' },

      { type: 'h2', content: 'Visual anchors: timeline + colour code method (easy at home)' },
      { type: 'p', content: 'Create a simple timeline on paper or table: left = Past (blue), middle = Now (yellow), right = Future (green). Use sticky notes or toy cards to place actions.' },
      { type: 'p', content: 'Colour cues make it easier for children to choose the right verb form: blue for past, yellow for present, green for future.' },

      { type: 'h2', content: 'Week 8 plan (7 days, 10–12 minutes/day)' },
      { type: 'p', content: 'Each day: quick warm-up (2 min), tense talk + timeline (6–8 min), playful review (2 min). Keep it conversational and end on a small win.' },
      { type: 'h3', content: 'Day 1 — Introduce timeline + “I go / I went / I will go”' },
      { type: 'p', content: 'Model three short forms with actions and place toy cards on the timeline.' },
      { type: 'h3', content: 'Day 2 — Practice with pictures' },
      { type: 'p', content: 'Show pictures and ask: Did this happen before, now, or later? Child places the card and says the sentence.' },
      { type: 'h3', content: 'Day 3 — Morning tense talk (present) + yesterday talk (past)' },
      { type: 'p', content: 'Use real routines: “Yesterday we ate idli. Today we eat toast. Tomorrow we will go to the park.”' },
      { type: 'h3', content: 'Day 4 — Introduce special verbs (go/went, do/did, see/saw)' },
      { type: 'p', content: 'Show how these verbs change and add them to the timeline with colour cards.' },
      { type: 'h3', content: 'Day 5 — Story retell with tense choices' },
      { type: 'p', content: 'Read a one‑page story and ask the child to retell part in past or present using the timeline as a guide.' },
      { type: 'h3', content: 'Day 6 — Mini diary (2–3 sentences)' },
      { type: 'p', content: 'Ask the child to say/write two sentences: one about yesterday, one about today.' },
      { type: 'h3', content: 'Day 7 — Game day + checklist' },
      { type: 'p', content: 'Play tense baskets and run a quick 3‑item check: can the child produce past/present/future for three common verbs?' },

      { type: 'h2', content: 'Daily “tense talk” scripts (morning + evening)' },
      { type: 'p', content: 'Morning script: “What are we doing now? I am drinking tea. Yesterday I drank milk. What did you do yesterday?”' },
      { type: 'p', content: 'Evening script: “Tell me one thing you did today. Now tell me one thing you will do tomorrow.”' },

      { type: 'h2', content: 'Games (8–12): tense baskets, time travel cards, verb flip, story retell' },
      { type: 'li', content: 'Tense Baskets — place cards in Past/Now/Future baskets.' },
      { type: 'li', content: 'Time Travel Cards — draw a card and say the sentence in past/present/future.' },
      { type: 'li', content: 'Verb Flip — flip a card from base form to past form and say both.' },
      { type: 'li', content: 'Story Retell — child retells a short event using the timeline.' },
      { type: 'li', content: 'Picture Swap — swap pictures and change the tense in the sentence.' },
      { type: 'li', content: 'Action Replay — act an action (jump), then say “I jumped”/“I jump”/“I will jump”.' },
      { type: 'li', content: 'Sticker Timeline — earn stickers for correct placements.' },
      { type: 'li', content: 'Guess the Day — parent mimes an action and child guesses when it happened.' },
      { type: 'li', content: 'Quick Quiz — three cards flash, child sorts by time.' },

      { type: 'h2', content: 'Common verb confusions (go/went, eat/ate, is/was) — teach as “special verbs”' },
      { type: 'p', content: 'Teach special verbs separately because they do not follow a simple -ed pattern. Use clear examples and add them to the timeline with their past forms: go → went, eat → ate, is → was.' },
      { type: 'p', content: 'Practice these with actions and repetition: act it, say present, say past, place on the blue card.' },

      { type: 'h2', content: 'Writing practice without pressure (2–4 sentence mini diary)' },
      { type: 'p', content: 'Encourage a tiny diary: one sentence about yesterday, one about today, optionally one for tomorrow. Child can draw and label if writing is hard.' },
      { type: 'p', content: 'Example sentences to copy and personalise: “Yesterday I ate dosa. Today I eat breakfast. Tomorrow I will go to the park.”' },

      { type: 'h2', content: 'Done checklist + Week 9 conjunctions teaser' },
      { type: 'li', content: 'Can place three common verbs correctly into Past/Present/Future.' },
      { type: 'li', content: 'Uses the timeline to check tense in short sentences.' },
      { type: 'li', content: 'Writes a 2‑sentence mini diary with help.' },
      { type: 'p', content: 'When these are true, move to Week 9 where we use conjunctions (and, because, but) to combine ideas and make longer sentences.' },

      { type: 'h2', content: 'Small list of “special verbs” and quick examples' },
      { type: 'p', content: 'Special verbs: go → went, do → did, see → saw, eat → ate, have → had.' },
      { type: 'p', content: 'Copy + personalise examples: “I went to the shop.” → “Riya went to the shop.” Encourage the child to replace the name.' }
    ]
  },
  {
    slug: 'week-9-grammar-conjunctions',
    title: 'Week 9: Conjunction Toolkits',
    category: 'Grammar',
    author: 'Priya',
    date: '2026-01-25',
    readTime: '9 min',
    excerpt: "Seven days of connector practice (AND / BUT / BECAUSE / SO): DIY sentence strips, quick games and gentle writing tasks that help children join ideas and expand expression.",
    body: [
      { type: 'h2', content: 'Why kids write “baby sentences” (and how conjunctions fix it)' },
      { type: 'p', content: 'Early writers often produce short, single‑idea sentences: “I see a dog.” “It runs.” This is a natural stage — children name things before they link ideas.' },
      { type: 'p', content: 'Conjunctions are the bridge that lets children join ideas and explain reasons. Teaching connectors gently expands thinking and helps writing sound more like spoken language.' },

      { type: 'h2', content: 'Meet the 4 connectors: AND / BUT / BECAUSE / SO (meaning + kid examples)' },
      { type: 'p', content: 'AND: joins ideas. Example: “I have a ball AND a bat.”' },
      { type: 'p', content: 'BUT: shows contrast. Example: “I wanted to play BUT it rained.”' },
      { type: 'p', content: 'BECAUSE: gives a reason. Example: “I stayed home BECAUSE I was sick.”' },
      { type: 'p', content: 'SO: shows result. Example: “It rained SO we stayed inside.”' },

      { type: 'h2', content: 'The sentence‑strip method (easy DIY at home)' },
      { type: 'p', content: 'Write short phrases on strips of paper (subject, verb, object). Let the child pick two strips and then choose a connector strip to join them.' },
      { type: 'p', content: 'This tactile method makes the idea of “joining” concrete and playful — no heavy grammar talk needed.' },

      { type: 'h2', content: 'Week 9 plan (7 days, 10–12 minutes/day)' },
      { type: 'p', content: 'Daily routine: warm‑up (2 min), sentence strip work + speaking (6–8 min), quick writing (2 min). Use I do → we do → you do. Stop after three clear successes.' },
      { type: 'h3', content: 'Day 1 — AND practice' },
      { type: 'p', content: 'Model joining two ideas with AND. Use toys and say: “I have a doll AND a car.” Child repeats and makes their own.' },
      { type: 'h3', content: 'Day 2 — BUT practice' },
      { type: 'p', content: 'Show contrast with pictures: “I like ice cream BUT it is cold.” Child makes two simple sentences then joins with BUT.' },
      { type: 'h3', content: 'Day 3 — BECAUSE practice' },
      { type: 'p', content: 'Model cause: “I wore a hat BECAUSE it was sunny.” Emphasise the reason with gestures.' },
      { type: 'h3', content: 'Day 4 — SO practice' },
      { type: 'p', content: 'Show result: “It rained SO we stayed in.” Use story cards to create cause → result pairs.' },
      { type: 'h3', content: 'Day 5 — Mix & match' },
      { type: 'p', content: 'Let the child pick strips and choose an appropriate connector. Speak first, then write.' },
      { type: 'h3', content: 'Day 6 — Mini writing task' },
      { type: 'p', content: 'Use a picture prompt and ask the child to speak three sentences joined by at least one conjunction, then write one line together.' },
      { type: 'h3', content: 'Day 7 — Game day + share' },
      { type: 'p', content: 'Play the conjunction spinner and share favourite joined sentences with family.' },

      { type: 'h2', content: 'Games (8–12): conjunction spinner, connect‑the‑ideas, silly sentence lab' },
      { type: 'li', content: 'Conjunction Spinner — spin to pick AND/BUT/BECAUSE/SO and join two strips.' },
      { type: 'li', content: 'Connect‑the‑Ideas — draw two pictures and make a sentence with a connector.' },
      { type: 'li', content: 'Silly Sentence Lab — pick random strips and make funny joined sentences.' },
      { type: 'li', content: 'Role Play — act two short scenes, then join with a connector.' },
      { type: 'li', content: 'Chain Story — each child adds a sentence joined by a connector.' },
      { type: 'li', content: 'Match the Reason — give outcome, child finds the cause and uses BECAUSE.' },
      { type: 'li', content: 'Swap the Connector — change AND to BUT and notice meaning change.' },
      { type: 'li', content: 'Two‑word challenge — make a sentence with two cards + connector.' },
      { type: 'li', content: 'Conjunction Bank Race — pick correct connector from a bank under time pressure (gentle).' },

      { type: 'h2', content: 'Speaking → writing bridge (say it, clap it, write it)' },
      { type: 'p', content: 'Have the child say the joined sentence aloud, clap the rhythm (one clap per chunk), then write it. This links oral fluency with written output.' },
      { type: 'p', content: 'Model first: parent says, child echoes, parent writes, child copies — then child tries independently.' },

      { type: 'h2', content: 'Common mistakes (run‑ons, “because” without reason, too many ANDs)' },
      { type: 'p', content: 'Run‑ons: teach short joins first and stop; prefer two short sentences before trying complex joins. “Because” without reason: prompt with “Why?” to get a real cause. Too many ANDs: encourage a stronger connector like BUT or SO to vary sentences.' },

      { type: 'h2', content: 'Mini writing tasks (picture prompt, 4‑sentence story with 2 conjunctions)' },
      { type: 'p', content: 'Prompt: show a picture of a child who lost and found a kite. Task: write 4 sentences using at least two conjunctions, for example: “Ria lost her kite AND she looked for it. She found it BUT it was wet. She dried it SO she could fly it again.”' },
      { type: 'p', content: 'Keep expectations low: one joined sentence and two extra sentences is a great start.' },

      { type: 'h2', content: 'Done checklist + Week 10 SVA teaser' },
      { type: 'li', content: 'Can join two ideas with an appropriate connector.' },
      { type: 'li', content: 'Speaks joined sentences before writing them.' },
      { type: 'li', content: 'Writes a 2–4 sentence story with at least one conjunction.' },
      { type: 'p', content: 'When these are true, move to Week 10 where we focus on subject‑verb agreement (SVA) with stick figures and quick checks.' },

      { type: 'h2', content: 'Parent scripts and a mini conjunction bank' },
      { type: 'p', content: 'Script: “Tell me two ideas. Now choose a connector: AND, BUT, BECAUSE or SO. Say the sentence, clap it, then write it.”' },
      { type: 'p', content: 'Mini conjunction bank (keep near the table): AND, BUT, BECAUSE, SO — your child can pick a card when joining ideas.' }
    ]
  },
  {
    slug: 'week-10-grammar-subject-verb',
    title: 'Week 10: Subject-Verb Agreement Rescue Plan',
    category: 'Grammar',
    author: 'Priya',
    date: '2026-01-29',
    readTime: '9 min',
    excerpt: "A short SVA rescue plan: stick‑figure anchors and quick daily drills with warm correction to fix subject‑verb slips and build clearer sentence habits.",
    body: [
      { type: 'h2', content: 'What is subject–verb agreement (SVA) in kid language' },
      { type: 'p', content: 'Subject–verb agreement simply means the doing word (verb) matches who is doing it (the subject). In child language: one person needs a different verb form than many people.' },
      { type: 'p', content: 'For example: “I run,” “He runs,” “They run.” The tiny change in the verb helps the sentence sound right and clear.' },
      { type: 'p', content: 'Note: this rule is for present tense everyday actions (e.g., He runs; She eats). Other tenses follow different patterns.' },

      { type: 'h2', content: 'The single vs many rule (he/she/it vs they/we)' },
      { type: 'p', content: 'Teach a simple rule: if it is one person or thing (he/she/it), the verb often gets an extra sound (often an “s”). If it is many (they/we/you), the verb stays in its base form.' },
      { type: 'p', content: 'Use very short prompts: “One person — add S. Many people — no S.” Practise with toys: one doll vs two dolls.' },

      { type: 'h2', content: 'The “S” trick for he/she/it (go/goes, play/plays) — keep exceptions simple' },
      { type: 'p', content: 'Explain: for he/she/it add an “s” to common verbs: go → goes, play → plays, eat → eats. Use the S as a tiny badge for single people.' },
      { type: 'p', content: 'Exceptions (be, have) are special: I am / He is; I have / She has. Teach these as special cards in the word bank rather than confusing rules.' },

      { type: 'h2', content: 'Week 10 plan (7 days, 10 minutes/day)' },
      { type: 'p', content: 'Each day: warm-up (2 min), focused SVA practice (6 min), playful review (2 min). Use the 3‑wins rule: stop after three correct forms to build confidence.' },
      { type: 'h3', content: 'Day 1 — Introduce stick figures + S badge' },
      { type: 'p', content: 'Draw a single stick figure and a group of stick figures. Show verb cards and practise: “He runs” (badge on single), “They run” (no badge).' },
      { type: 'h3', content: 'Day 2 — Practice common verbs with S' },
      { type: 'p', content: 'Use play: “The monkey jumps” vs “The monkeys jump.” Swap one vs two toys to feel the change.' },
      { type: 'h3', content: 'Day 3 — Special verbs day (be/have)' },
      { type: 'p', content: 'Teach quick cards for: I am / He is / They are and I have / She has / They have. Use chants to remember.' },
      { type: 'h3', content: 'Day 4 — Sentence repair practice' },
      { type: 'p', content: 'Give incorrect sentences (“He are happy”) and ask your child to fix them using the stick figure cue.' },
      { type: 'h3', content: 'Day 5 — Pronoun swap game' },
      { type: 'p', content: 'Swap pronouns in a sentence aloud and watch how the verb changes: “I play” → “He plays”.' },
      { type: 'h3', content: 'Day 6 — Quick writing: fix the sentence' },
      { type: 'p', content: 'Do a 5‑minute “fix the sentence” with three lines to correct and two original sentences to write.' },
      { type: 'h3', content: 'Day 7 — Share + celebrate' },
      { type: 'p', content: 'Child reads corrected sentences or their short writing to a family member. Praise effort and clarity.' },

      { type: 'h2', content: 'Visual anchors: stick figures + verb cards (DIY)' },
      { type: 'p', content: 'Draw one stick figure for single, three small figures for many. Create a small red “S” sticker (or badge) you put near the single figure when the verb needs S.' },
      { type: 'p', content: 'Use laminated cards for verbs so children can place them under single or many and see the match.' },

      { type: 'h2', content: 'Games (8–12): verb matching, sentence repair, S detective, pronoun swap' },
      { type: 'li', content: 'S Detective — spot the missing S in a sentence.' },
      { type: 'li', content: 'Pronoun Swap — swap cards and change the verb.' },
      { type: 'li', content: 'Fix the Line — parent writes wrong sentence, child corrects.' },
      { type: 'li', content: 'Badge Race — place S badges on correct verbs.' },
      { type: 'li', content: 'Memory Match — match pronoun cards to verb forms.' },
      { type: 'li', content: 'Role Play — act a scene and narrate with correct verbs.' },
      { type: 'li', content: 'Quick Quiz — 3 cards shown, child says correct form.' },
      { type: 'li', content: 'Sentence Jumble — reorder words and add correct S.' },

      { type: 'h2', content: 'Common errors in Indian English context (he are, she have, they was) — gentle correction' },
      { type: 'p', content: 'These are frequent and normal. Correct gently with a question: “Let’s check — one person or many?” This helps the child self-correct rather than feel scolded.' },
      { type: 'p', content: 'Use modelling rather than repetition: repeat the correct sentence in a positive tone: “Yes — He is happy.”' },

      { type: 'h2', content: 'Writing practice: 5‑minute daily “fix the sentence” + 2 original sentences' },
      { type: 'p', content: 'Quick routine: 1) Show 3 short wrong sentences to fix, 2) child writes 2 original sentences using taught pronouns and verbs. Keep feedback warm and specific.' },

      { type: 'h2', content: 'Done checklist + Week 11 creative writing teaser' },
      { type: 'li', content: 'Can use correct verb forms for he/she/it vs they/we in short sentences.' },
      { type: 'li', content: 'Fixes three incorrect sentences in a quick check.' },
      { type: 'li', content: 'Writes two short original sentences with correct SVA.' },
      { type: 'p', content: 'When ready, Week 11 focuses on creative writing scaffolds to extend ideas and use grammar for expression.' },

      { type: 'h2', content: 'Quick reference table' },
      { type: 'li', content: 'I am / He is / They are' },
      { type: 'li', content: 'I have / She has / They have' },
      { type: 'li', content: 'I go / He goes / They go' },

      { type: 'h2', content: 'Parent scripts for corrections (“Let’s check: one person or many?”)' },
      { type: 'p', content: 'Script: “Let’s check — one person or many? If one, we add our little S badge: He plays. If many, we keep the verb: They play.”' },
      { type: 'p', content: 'Praise tip: say specifically: “Great — you added the S for he. Good listening!”' }
    ]
  },
  {
    slug: 'week-11-grammar-creative-writing',
    title: 'Week 11: Creative Writing Scaffolds for Ages 8–10',
    category: 'Grammar',
    author: 'Priya',
    date: '2026-02-03',
    readTime: '9 min',
    excerpt: "Story Mountain scaffolds to help 8–10 year‑olds plan and write short stories: picture prompts, two brief writing sprints and a friendly two‑step edit to protect motivation.",
    body: [
      { type: 'h2', content: 'Track B — Ages 8–10 (advanced track)' },
      { type: 'p', content: 'This week is part of Track B (Ages 8–10): a separate, more advanced creative-writing track. If your child is younger or still practising CVC fluency, continue the early phonics track instead.' },
      { type: 'h2', content: 'Why kids say “I don’t know what to write” (and how to help)' },
      { type: 'p', content: 'When a child says “I don’t know what to write,” it often means they are unsure where to begin, worried about getting it “right,” or simply overwhelmed by the blank page. Parents can remove those barriers with low-pressure routines and modelling. Say this is practice, not a test; invite them to tell the story out loud first; and praise the idea, even before any spelling is fixed. Small changes — reducing time, offering a prompt, and treating the first draft as talk captured on paper — turn a freeze into a try.' },

      { type: 'h2', content: 'The idea pipeline: Talk → Plan → Write → Fix (simple routine)' },
      { type: 'p', content: 'Give writing a repeatable shape so it stops feeling random. The pipeline is four tiny steps: 1) Talk: have your child tell the story like a movie. 2) Plan: jot three beats (who, where, problem). 3) Write: one short draft in two mini-sprints (12–15 minutes). 4) Fix: a tiny edit. Do these steps aloud with them at first, then let them try independently. Routine reduces anxiety and makes each session predictable and safe.' },

      { type: 'h2', content: 'Story Mountain (beginning, build-up, problem, solution, ending) with example' },
      { type: 'p', content: 'A Story Mountain is a simple visual scaffold: five boxes that guide the story arc. It keeps plots short and focused, and helps children know what to write next.' },
      { type: 'h3', content: 'How to use it' },
      { type: 'li', content: 'Beginning — set the scene and character.' },
      { type: 'li', content: 'Build-up — one or two events that lead toward trouble.' },
      { type: 'li', content: 'Problem — the main challenge or surprise.' },
      { type: 'li', content: 'Solution — how the child or character solves it.' },
      { type: 'li', content: 'Ending — a short wrap-up or feeling.' },
      { type: 'h3', content: 'Example plan (Story Mountain)' },
      { type: 'li', content: 'Beginning: Asha finds a folded paper inside an old library book.' },
      { type: 'li', content: 'Build-up: The paper has a riddle that points to three clues around town.' },
      { type: 'li', content: 'Problem: The last clue is a locked box with no key.' },
      { type: 'li', content: 'Solution: Asha asks neighbours to share stories and pieces together a key from a broken charm.' },
      { type: 'li', content: 'Ending: The box contains seeds and a note; Asha starts a tiny garden with friends.' },

      { type: 'h3', content: 'Short sample paragraph (final paragraph example)' },
      { type: 'p', content: 'When Asha turned the charm, the lock clicked and sunlight spilled over the paper seeds. She planted one in a tin, watered it, and smiled as a small green shoot pushed through the soil. The garden was not treasure in a chest, but something she and her neighbours would grow together.' },

      { type: 'h2', content: 'Picture prompts the smart way (observe 5 details first)' },
      { type: 'p', content: 'A picture prompt is only useful when a child first looks closely. Ask them to name five details: one person, one object, one colour, one sound they imagine, and one feeling the picture gives them. These five anchors immediately create hooks for plot, dialogue, and atmosphere — and they remove the demand to “be clever” from nothing.' },

      { type: 'h2', content: 'Week 11 plan (7 days, 12–15 minutes/day)' },
      { type: 'p', content: 'This gentle week builds a habit. Each day takes 12–15 minutes: a quick warm-up, a clear focus, and a tiny finish so the child stops while it’s happy.' },
      { type: 'h3', content: 'Day-by-day (exact) ' },
      { type: 'li', content: 'Day 1 — Talk (12–15 min): Pick one picture prompt. Parent: use the script “Tell me it like a movie first — what do we see and hear?” Note 3 beats together.' },
      { type: 'li', content: 'Day 2 — Plan (12 min): Use Story Mountain to place the 3 beats into beginning, problem, and solution. Add one small twist.' },
      { type: 'li', content: 'Day 3 — Write (15 min): Two 7-minute sprints. Child writes the beginning and build-up in the first sprint; quick break; finish problem and solution in the second.' },
      { type: 'li', content: 'Day 4 — Picture remix (12 min): Change one detail (colour, place, or character) and re-tell the plan aloud. This practices flexible ideas.' },
      { type: 'li', content: 'Day 5 — Expand (15 min): Add one sensory sentence to the build-up and one to the ending (sight or sound).' },
      { type: 'li', content: 'Day 6 — Edit (12 min): Two-step edit — capitals & punctuation then better words (see below).' },
      { type: 'li', content: 'Day 7 — Share & celebrate (12–15 min): Read aloud to a family member. Use specific praise (see scripts). Tick the Done checklist.' },

      { type: 'h2', content: 'Word banks that actually help (verbs, feelings, sensory words)' },
      { type: 'p', content: 'A short list of ready words removes the “I can’t think of the right word” block. Keep this on a sticky note beside the page.' },
      { type: 'h3', content: 'Verbs' },
      { type: 'li', content: 'tip, scramble, peek, tumble, whisper, march, pluck, rumble' },
      { type: 'h3', content: 'Feelings' },
      { type: 'li', content: 'curious, proud, worried, brave, puzzled, relieved' },
      { type: 'h3', content: 'Sensory words' },
      { type: 'li', content: 'glint, hush, scratchy, sticky, fizz, warm' },

      { type: 'h2', content: 'Sentence variety: add because/so/but + 1 adjective rule' },
      { type: 'p', content: 'Teach one small trick for variety: add a connector (because / so / but) and one adjective. For example: “She ran because she was excited.” “The box was heavy but rusty.” This simple pattern increases sentence complexity without grammar charts.' },

      { type: 'h2', content: 'Editing without tears (2-step edit: capitals/punctuation, then better words)' },
      { type: 'p', content: 'Separate editing into two tiny passes. Pass 1: Capitals and punctuation — only fix those so the piece becomes readable. Pass 2: Better words — change one word per sentence to a stronger verb or a specific adjective. Keep the child in control: ask permission before editing and praise each change.' },

      { type: 'h2', content: 'Done checklist + Week 12 speaking confidence teaser' },
      { type: 'li', content: 'I told the story out loud (Talk).' },
      { type: 'li', content: 'I wrote at least one paragraph (Write).' },
      { type: 'li', content: 'I did one tiny edit (Fix).' },
      { type: 'p', content: 'Stop while it’s happy: if your child is smiling at the end, end the session there. Ending on a positive note protects motivation and makes the next day easier.' },
      { type: 'p', content: 'Week 12 teaser: Next week we use these short stories for speaking practice — reading with expression builds confidence and makes writing feel alive.' },

      { type: 'h3', content: 'One sample story plan + short parent scripts' },
      { type: 'p', content: 'Sample plan (3 beats): 1) Who: Kabir, a boy who collects lost buttons. 2) Where: The railway platform. 3) Problem: A button holds a small note and no return address. Kabir follows clues and learns the note belonged to a grandmother who misses her grandson. Final idea: Kabir finds a letter and returns it, starting a pen-pal friendship.' },
      { type: 'p', content: 'Short parent scripts: “Tell me it like a movie first — what do we see, what do we hear?” “That sounds fun — what happens next, in one sentence?” After they speak: “I like that. Can you show me the beginning and the problem?” For praise: “I loved how you described the sound — that made me feel there.”' },

      { type: 'h3', content: 'Stop while it’s happy (final note)' },
      { type: 'p', content: 'If a child is tired or frustrated, acknowledge it quickly and close with a single positive sentence about the idea. Saving a cheerful ending keeps curiosity alive — and when a child returns to writing with a smile, real progress happens.' }
    ]
  },
  {
    slug: 'week-12-speaking-confidence-seeds',
    title: 'Speaking Confidence Roadmap: A 7-Day Calm Plan for Kids (Ages 3-10)',
    category: 'Public Speaking',
    author: 'Tiny Steps Research Desk',
    date: '2026-04-04',
    readTime: '12 min read',
    hero: '/blog/hero-research.jpg',
    metaDescription:
      'A research-backed speaking confidence roadmap for ages 3-10: 10-minute routines, bravery-ladder practice, multilingual support, and when to seek extra help.',
    excerpt: 'A premium week 12 speaking guide for parents who want calm, structured speaking practice for shy or hesitant children without forcing performance.',
    body: [
      { type: 'h2', content: 'Why some kids freeze while speaking (temperament + fear of mistakes)' },
      { type: 'p', content: 'Many children are not shy because they do not want to speak — they are wired to be cautious. Temperament, past experiences, and fear of making mistakes all combine to cause freezing. For some children, the worry is about being judged; for others it is about not knowing what to say. Recognise this as normal: the goal is to make speaking low-risk, predictable and rewarding so the child can practise without fear.' },

      { type: 'h2', content: 'The golden rule: connection before correction' },
      { type: 'p', content: 'Before offering any correction, build a connection. Mirror their interest, repeat one thing you liked, and only then gently guide. When a parent shows they are on the same team, a child’s nervous system relaxes and learning becomes possible. Start with praise for effort — not performance — and keep corrections tiny and specific.' },

      { type: 'h2', content: 'The 15-second spotlight routine (daily, low pressure)' },
      { type: 'p', content: 'A short, consistent routine removes performance pressure. Every day, give your child a 15-second “spotlight” — at dinner, before bed, or during a walk. Use a timer, keep the task simple (one sentence about their day or a tiny story), and celebrate attempts. Fifteen seconds is short enough to feel safe and long enough to practise pacing and expression.' },

      { type: 'h2', content: 'Week 12 plan (7 days, 8–10 minutes/day)' },
      { type: 'p', content: 'This plan uses very small steps to build muscle memory. Each day is 8–10 minutes: warm-up, practice, and quick praise.' },
      { type: 'h3', content: 'Day-by-day (exact)' },
      { type: 'li', content: 'Day 1 — Warm-up (8 min): Play a 2-minute “sound search” (name 5 sounds). Give a 15-second spotlight; praise the try.' },
      { type: 'li', content: 'Day 2 — Short story (9 min): Read a 1-paragraph story together; ask your child to retell one sentence in the spotlight.' },
      { type: 'li', content: 'Day 3 — Picture talk (10 min): Show a picture and ask for three details; child describes one for 15 seconds.' },
      { type: 'li', content: 'Day 4 — Bravery ladder step (8–10 min): Pick ladder level 1 or 2 (see below); practise twice.' },
      { type: 'li', content: 'Day 5 — Voice tools (9 min): Quick volume and pace game (whisper to shout scale); spotlight with a chosen volume.' },
      { type: 'li', content: 'Day 6 — Game day (10 min): Play a confidence-building game from the list below.' },
      { type: 'li', content: 'Day 7 — Share & celebrate (10 min): Choose one favourite attempt from the week and celebrate with specific praise.' },

      { type: 'h2', content: '10 confidence-building games (easy at home)' },
      { type: 'li', content: '1) Spotlight Spoon — a spoon passes; holder speaks for 15 seconds.' },
      { type: 'li', content: '2) Echo Story — parent says one line, child repeats with expression.' },
      { type: 'li', content: '3) Voice Scale — say a line whisper → normal → loud (fun, not scary).' },
      { type: 'li', content: '4) Picture Interview — child answers two simple questions about a picture.' },
      { type: 'li', content: '5) One-Word Story — family builds a story one word at a time.' },
      { type: 'li', content: '6) Puppet Reporter — child interviews a puppet or toy.' },
      { type: 'li', content: '7) Question Ball — toss a soft ball; catcher answers one fun question.' },
      { type: 'li', content: '8) Record & Replay — short voice note and replay, celebrate small wins.' },
      { type: 'li', content: '9) Postcard Pitch — describe a picture on a postcard in two sentences.' },
      { type: 'li', content: '10) Family Fan Mail — child reads one sentence of praise written by a family member.' },

      { type: 'h2', content: 'Voice tools: volume, pace, eye contact (kid-friendly)' },
      { type: 'p', content: 'Teach three friendly tools: 1) Volume — practise “party voice” and “library voice” so they learn range. 2) Pace — encourage short pauses between ideas (count 1–2). 3) Eye contact — aim for 3 friendly looks at a person, then glance away. Turn each into a playful exercise: silly loud, calm slow, three smiles.' },

      { type: 'h2', content: 'What parents should say (and not say) — scripts' },
      { type: 'p', content: 'Words matter. Say encouraging, specific phrases and avoid comparing or fixing mid-sentence. Good scripts: “I loved how you tried that line — your voice sounded clear.” “Thank you for sharing — can you say the last part again slowly?” Avoid: “Speak louder!” or “Why are you so shy?” (these increase pressure).' },
      { type: 'h3', content: 'Short ready scripts' },
      { type: 'li', content: 'Before: “Tell me for 15 seconds — just one thing you liked today.”' },
      { type: 'li', content: 'After: “I loved how you tried that — your words were clear.”' },
      { type: 'li', content: 'If stuck: “Try it like telling a short movie — what do we see first?”' },

      { type: 'h2', content: 'Troubleshooting (whispers, avoids camera, speaks only 1 word, compares with siblings)' },
      { type: 'p', content: 'If a child whispers, encourage volume with playful scale games and accept whisper attempts as progress. If they avoid the camera, start with audio-only notes and slowly add a still picture. If they answer in one word, ask a follow-up that has two choices (“Was it funny or surprising?”) to extend the response. If comparisons with siblings arise, redirect to the child’s own small wins and the bravery ladder below.' },

      { type: 'h2', content: 'A simple bravery ladder (easy steps from 1 → 5)' },
      { type: 'li', content: '1 — One word in the spotlight (safest).' },
      { type: 'li', content: '2 — One short sentence (15 seconds).' },
      { type: 'li', content: '3 — Two-sentence mini-story.' },
      { type: 'li', content: '4 — Read a short paragraph to a family member.' },
      { type: 'li', content: '5 — Record a 30-second message or speak to a small group.' },

      { type: 'h2', content: 'Praise examples (“I loved how you tried…”)' },
      { type: 'p', content: 'Specific praise builds courage. Try: “I loved how you tried that line — your voice was clear.” “I noticed you waited and didn’t rush — that made your story easy to follow.” Avoid praising only results; praise the attempt and the choice to try.' },

      { type: 'h2', content: 'Done checklist + Week 13 structure teaser' },
      { type: 'li', content: 'I gave myself a 15-second spotlight.' },
      { type: 'li', content: 'I tried one voice tool (volume/pace/eye contact).' },
      { type: 'li', content: 'I played one short confidence game.' },
      { type: 'p', content: 'Finish on a positive note. Tell the child one thing you liked about their attempt and stop while it’s happy — that keeps motivation high.' },
      { type: 'p', content: 'Week 13 teaser: next week we practise short talk structure (Hook — Body — Close) so children can share ideas with a tidy plan.' }
    ]
  },
  {
    slug: 'week-13-speaking-structure',
    title: 'Week 13: Hook-Body-Close for Kids',
    category: 'Public Speaking',
    author: 'Priya',
    date: '2026-02-11',
    readTime: '9 min',
    excerpt: "A Hook–Body–Close template to help children plan short talks: one‑line hooks, two clear points and a tidy close practised through daily 10‑minute rehearsals for steady confidence.",
    body: [
      { type: 'h2', content: 'Why structure makes speaking easier (brain loves patterns)' },
      { type: 'p', content: 'Our brains prefer patterns — giving children a tidy structure reduces the load of thinking on the spot. A simple template like Hook–Body–Close provides a predictable map: they know how to start, what to say in the middle, and how to finish. Templates lower anxiety, help organise thoughts, and make rehearsal straightforward.' },

      { type: 'h2', content: 'Hook ideas for kids (question, wow fact, sound, prop)' },
      { type: 'p', content: 'A hook is one short line that makes the listener curious. Keep hooks playful and sensory for younger children: a question (“Have you ever seen a flying kite at night?”), a wow fact (“I found a pudding that sparkles!”), a sound effect (a quick “whoosh!”), or a prop (a bright scarf). Teach children to practise the hook until they can say it confidently in one line.' },

      { type: 'h2', content: 'Body: 2–3 points rule (keep it short)' },
      { type: 'p', content: 'Ask children to stick to two or three simple points. Each point can be one sentence for younger kids or two short sentences for older ones. The aim is clarity: fewer points means less to remember and more chance to speak smoothly. If they have a story, ask them to pick two moments to describe.' },

      { type: 'h2', content: 'Close: summary + feeling + thank you' },
      { type: 'p', content: 'A tidy close ties the talk together. Teach a three-part close: (1) One-line summary, (2) How it made them feel, (3) A polite finish such as “Thank you.” For example: “That’s why I love rainy days — they feel cosy, and I like splashing — thank you.”' },

      { type: 'h2', content: 'Week 13 plan (7 days, 10 minutes/day)' },
      { type: 'p', content: 'This week focuses on practice and short rehearsals. Each day is about 10 minutes: warm-up, practice the template, and a quick share.' },
      { type: 'h3', content: 'Day-by-day' },
      { type: 'li', content: 'Day 1 — Hook practice (10 min): Pick a hook from the starters list. Parent: “Let’s do the hook first. Only one line.”' },
      { type: 'li', content: 'Day 2 — One point (10 min): Add one body point and practise saying the hook + point.' },
      { type: 'li', content: 'Day 3 — Two points (10 min): Add a second point; practise hook + two points.' },
      { type: 'li', content: 'Day 4 — Full close (10 min): Teach the close (summary + feeling + thank you) and practise the whole structure.' },
      { type: 'li', content: 'Day 5 — Mirror + record (10 min): Child rehearses in front of a mirror, then record a short take.' },
      { type: 'li', content: 'Day 6 — Share to a small audience (10 min): Read to a sibling or parent; keep feedback to one positive line.' },
      { type: 'li', content: 'Day 7 — Performance & praise (10 min): Pick the best short speech and celebrate with specific praise.' },

      { type: 'h2', content: '12 ready speech starters (age-appropriate topics)' },
      { type: 'li', content: '1 — My favourite food and why.' },
      { type: 'li', content: '2 — A game I love to play.' },
      { type: 'li', content: '3 — A time I helped someone.' },
      { type: 'li', content: '4 — My best holiday memory.' },
      { type: 'li', content: '5 — If I had a superpower, I would...' },
      { type: 'li', content: '6 — My favourite animal and a fun fact.' },
      { type: 'li', content: '7 — A book I recommend.' },
      { type: 'li', content: '8 — One thing I am proud of.' },
      { type: 'li', content: '9 — A place I want to visit.' },
      { type: 'li', content: '10 — A small project I made.' },
      { type: 'li', content: '11 — My favourite school subject and why.' },
      { type: 'li', content: '12 — A question I would ask a scientist/artist/chef.' },

      { type: 'h2', content: 'Practice routine: mirror + record + replay (gentle)' },
      { type: 'p', content: 'A simple loop helps self-awareness: practise in front of a mirror once, record one short take, replay and praise two things that went well. Keep comments brief and kind. This routine builds awareness of voice and expression without turning practice into critique.' },

      { type: 'h2', content: 'Common mistakes (rambling, forgetting, speaking too fast) + fixes' },
      { type: 'p', content: 'Rambling: ask them to stop after each point and breathe — use a finger to tap the table as a pause reminder. Forgetting: give them a tiny note card with the three words of their structure (Hook, Points, Close). Speaking too fast: practise counting 1–2 pauses between ideas and slowing one notch.' },

      { type: 'h2', content: 'Done checklist + Week 14 visual aids teaser' },
      { type: 'li', content: 'I practised my hook.' },
      { type: 'li', content: 'I said 1–2 clear points.' },
      { type: 'li', content: 'I finished with a summary, feeling, and thank you.' },
      { type: 'p', content: 'Finish with a short, specific praise line and stop while it’s happy. Week 14 will introduce simple visual aids to support young speakers — one prop, one picture.' },

      { type: 'h3', content: 'Two full example speeches (Hook–Body–Close)' },
      { type: 'h3', content: 'For ages 5–7 (short and simple)' },
      { type: 'p', content: 'Hook: “Do you like butterflies?” Body: “I saw a big blue butterfly in my garden. It sat on my mother’s flower and did a tiny dance.” Close: “I felt happy to see it. Thank you.”' },
      { type: 'h3', content: 'For ages 8–10 (slightly longer)' },
      { type: 'p', content: 'Hook: “Imagine a library that never closes.” Body: “I love the quiet rows and the smell of old pages. My favourite corner has books about space and maps. Once, I found a hidden note in a book and I felt curious.” Close: “That surprise made me want to learn more. Thank you.”' },

      { type: 'h3', content: 'Parent scripts' },
      { type: 'p', content: 'Short, simple prompts work best. Try: “Let’s do the hook first. Only 1 line.” “That was great — can you add one point next?” For praise: “I liked how you used your voice there — it sounded clear.” Avoid criticisms like “Don’t mumble” — instead model the clear sentence and ask them to repeat it.' },

      { type: 'h3', content: 'Quick tips before you finish' },
      { type: 'p', content: 'Keep sessions short, celebrate attempts, and use the template regularly. Structure plus small, steady practice builds both skill and confidence — and makes speaking a safe, repeatable activity for shy children.' }
    ]
  },
  {
    slug: 'week-14-speaking-visual-aids',
    title: 'Week 14: Visual Aids That Wow',
    category: 'Public Speaking',
    author: 'Priya',
    date: '2026-02-14',
    readTime: '9 min',
    excerpt: "One‑prop visual aid week: simple props, chart templates and quick routines that reduce cognitive load and help young speakers present with clarity and calm.",
    body: [
      { type: 'h2', content: 'Why visual aids help kids speak better (not decoration—support)' },
      { type: 'p', content: 'Visual aids reduce the cognitive load of speaking: they give children something concrete to point to, remind them of sequence, and engage the audience. A well-chosen visual is not a distraction — it supports memory, reduces the need to hold everything in the head, and gives the child a tiny focus that calms nerves.' },

      { type: 'h2', content: 'The “one prop” rule (keep it simple)' },
      { type: 'p', content: 'Always start with one prop. One small, meaningful object keeps attention on the speaker and the message. A single prop prevents fidgeting and makes setup quick. Teach your child to put the prop down after using it, so it does not become a toy during the talk.' },

      { type: 'h2', content: 'Types of visual aids kids can manage (object, picture, chart, drawing)' },
      { type: 'p', content: 'Choose light, safe, and easy-to-handle aids. Examples: an object (small toy or scarf), a picture (printed photo or postcard), a simple chart (three boxes), or a drawing on a small card. Avoid heavy or noisy props that invite play rather than speech.' },

      { type: 'h2', content: 'Week 14 plan (7 days, 10–12 min/day)' },
      { type: 'p', content: 'This week teaches choosing, using, and putting away aids. Each day is short and practical.' },
      { type: 'h3', content: 'Day-by-day' },
      { type: 'li', content: 'Day 1 — Pick a prop (10 min): Let the child choose one small prop and explain why it fits the talk.' },
      { type: 'li', content: 'Day 2 — Practice holding (10 min): Practice using the prop to point to three moments in the story.' },
      { type: 'li', content: 'Day 3 — Picture prompt (12 min): Use a picture and label three details aloud while showing it.' },
      { type: 'li', content: 'Day 4 — Chart it (10 min): Make a simple 3-box chart for beginning/build-up/ending and stick a small drawing in each box.' },
      { type: 'li', content: 'Day 5 — Show-and-tell run (12 min): Do a short show-and-tell with the prop; parent gives one specific praise.' },
      { type: 'li', content: 'Day 6 — Games day (10–12 min): Play two prop games from the list below.' },
      { type: 'li', content: 'Day 7 — Mini showcase (12 min): Child presents a 2-minute talk using the prop to the family.' },

      { type: 'h2', content: 'Prop checklist (size, visibility, safety, one-hand rule)' },
      { type: 'li', content: 'Small enough to hold with one hand.' },
      { type: 'li', content: 'Visible from a short distance (colourful or clear shape).' },
      { type: 'li', content: 'Safe: no sharp edges, small parts, or choking risk.' },
      { type: 'li', content: 'Relevant: connects clearly to the story or idea.' },
      { type: 'li', content: 'Put-away plan: a dedicated box so prop does not become a toy.' },

      { type: 'h2', content: 'Games (8–12): show-and-tell roulette, picture zoom, draw-and-speak' },
      { type: 'li', content: 'Show-and-tell roulette — place props in a bag, pick one and speak for 30 seconds.' },
      { type: 'li', content: 'Picture zoom — show a small area of a picture and ask child to invent what is outside the frame.' },
      { type: 'li', content: 'Draw-and-speak — draw a quick 3-box comic; child narrates each box.' },
      { type: 'li', content: 'Pass-the-prop story — each person adds one sentence while holding the prop.' },
      { type: 'li', content: 'Prop switch — child speaks, then swaps prop and repeats with new emphasis.' },
      { type: 'li', content: 'Silent show — child uses the prop to act a feeling, then says one sentence about it.' },
      { type: 'li', content: 'Picture timeline — arrange three pictures in order and narrate.' },
      { type: 'li', content: 'Speedy describe — 30-second flash description of a prop.' },
      { type: 'li', content: 'Family fan mail — show a prop that represents someone and say why they are special.' },
      { type: 'li', content: 'Prop detective — child hides a small prop and gives clues until someone finds it.' },

      { type: 'h2', content: 'Common issues (plays with prop, hides face, forgets lines) + fixes' },
      { type: 'p', content: 'If a child plays with the prop, set a clear rule: use the prop to show, not to fiddle. Practice placing the prop down between uses. If they hide their face, remind them gently to look up for a few seconds and then look away — practice “three friendly looks.” If they forget lines, give them a tiny note card with three words: Hook, Point, Close.' },

      { type: 'h2', content: 'Mini showcase plan (2 minutes, family audience)' },
      { type: 'p', content: 'A short family showcase gives purpose. Setup: one child, one prop, 2 minutes max. Audience rule: only positive, one-sentence praise. After the talk, the child picks one thing they liked. This keeps the showcase supportive and short.' },

      { type: 'h2', content: 'Done checklist + Week 15 debate teaser' },
      { type: 'li', content: 'I chose one prop and explained why.' },
      { type: 'li', content: 'I used the prop to show one story moment.' },
      { type: 'li', content: 'I put the prop away after the talk.' },
      { type: 'p', content: 'Finish with specific praise: “I liked how you looked up when you showed the prop.” Week 15 will introduce simple debate starters and short timers to grow critical thinking.' },

      { type: 'h3', content: '5 sample topics + suggested props' },
      { type: 'li', content: 'Topic: My favourite toy — Prop: the toy itself or a photo of it.' },
      { type: 'li', content: 'Topic: A memorable meal — Prop: a small spoon or a photo.' },
      { type: 'li', content: 'Topic: A place I visited — Prop: a postcard or ticket stub.' },
      { type: 'li', content: 'Topic: Something I made — Prop: the object or a quick sketch.' },
      { type: 'li', content: 'Topic: A helpful person — Prop: a small token that represents them.' },

      { type: 'h3', content: 'Parent scripts to coach (“Look at people, not prop”)' },
      { type: 'p', content: 'Use short, clear coaching lines: “Look at people, not the prop — show it, then look at us.” “Put the prop down between lines.” “Show one thing the prop helps us see.” Give specific praise: “I liked how you pointed at the picture and then told us why.”' }
    ]
  },
  {
    slug: 'week-15-speaking-debate-starters',
    title: 'Week 15: Debate Starters for Tweens',
    category: 'Public Speaking',
    author: 'Priya',
    date: '2026-02-18',
    readTime: '9 min',
    excerpt: "Gentle debate starters and short timed rounds for tweens: Claim→Reason→Example frames, calm moderation and simple timers to practise respectful reasoning and clear speaking.",
    body: [
      { type: 'h2', content: 'What debate teaches (thinking + speaking) without being aggressive' },
      { type: 'p', content: 'Debate is not about being loud or winning at any cost. For tweens, it teaches clear thinking, organising ideas quickly, and listening to others. When framed as a friendly exchange, debate builds reasoning skills, vocabulary, and confidence to state an opinion with logic. Emphasise curiosity over conquest: the goal is to explain, not to attack.' },

      { type: 'h2', content: 'Rules for respectful debate (kid-friendly)' },
      { type: 'p', content: 'Set simple, positive rules so debate stays kind and focused: 1) Speak in turn — no interrupting. 2) Use calm voices — no shouting. 3) Address ideas, not people — say “I disagree because…” rather than “You are wrong.” 4) One short point at a time. 5) Thank the other person at the end. These rules keep disagreement constructive and safe.' },

      { type: 'h2', content: 'The 3-step argument frame: Claim → Reason → Example' },
      { type: 'p', content: 'Teach children a short frame for every argument. Step 1: Claim — a one-line opinion (I believe…). Step 2: Reason — why you think that (because…). Step 3: Example — a quick example or short story (for example…). Practise this frame until it becomes automatic; it helps children avoid rambling and gives judges a clear idea of each point.' },

      { type: 'h2', content: 'Week 15 plan (7 days, 12 minutes/day)' },
      { type: 'p', content: 'Each day is a focused 12-minute session: warm-up, short practice with the frame, and a tiny timed round. Keep feedback brief and positive.' },
      { type: 'h3', content: 'Day-by-day' },
      { type: 'li', content: 'Day 1 — Intro + claim practice (12 min): Explain the 3-step frame. Child picks a simple claim and says it aloud twice.' },
      { type: 'li', content: 'Day 2 — Reason building (12 min): Practice adding a clear reason to the claim, using “because…”' },
      { type: 'li', content: 'Day 3 — Example hunt (12 min): Add a short example or personal story to the claim.' },
      { type: 'li', content: 'Day 4 — Timer routine (12 min): Run the mini timer routine (30s think, 60s speak, 15s rebuttal) with a sibling or parent.' },
      { type: 'li', content: 'Day 5 — For/Against cards (12 min): Use cards to practise taking a side and delivering the 3-step frame.' },
      { type: 'li', content: 'Day 6 — Short round (12 min): Two quick rounds with a calm moderator; praise effort, not only content.' },
      { type: 'li', content: 'Day 7 — Reflection + praise (12 min): Child picks a favourite attempt and notes one thing they did well.' },

      { type: 'h2', content: 'For/Against card method (easy at home)' },
      { type: 'p', content: 'Write simple topics on cards and divide them into For and Against piles. Draw one topic, assign sides, and give each child a short preparation (use the mini timer routine). The card method removes debate selection anxiety and encourages practice on a variety of topics.' },

      { type: 'h2', content: 'Sentence starters kids can use (I believe…, because…, for example…)' },
      { type: 'li', content: 'I believe that...' },
      { type: 'li', content: 'Because...' },
      { type: 'li', content: 'For example...' },
      { type: 'li', content: 'One reason is...' },
      { type: 'li', content: 'I respect that view, but...' },

      { type: 'h2', content: '12 debate topics (school + home + tech) age-appropriate' },
      { type: 'li', content: '1 — Homework should be optional.' },
      { type: 'li', content: '2 — School uniforms are helpful.' },
      { type: 'li', content: '3 — Mobile phones should be allowed at school.' },
      { type: 'li', content: '4 — Every child should learn a musical instrument.' },
      { type: 'li', content: '5 — Watching TV is better than reading.' },
      { type: 'li', content: '6 — Kids should choose their own bedtime.' },
      { type: 'li', content: '7 — Schools should have longer breaks.' },
      { type: 'li', content: '8 — Online classes are useful for homework.' },
      { type: 'li', content: '9 — Team sports teach more than individual sports.' },
      { type: 'li', content: '10 — Children should help with house chores.' },
      { type: 'li', content: '11 — Robots will help with homework.' },
      { type: 'li', content: '12 — Library visits are better than video tutorials.' },

      { type: 'h2', content: 'Common issues (gets emotional, repeats same point, interrupts) + fixes' },
      { type: 'p', content: 'If a child becomes emotional, pause the round and invite a breathing break; say “Take one breath, then tell us one calm sentence.” For repetition, introduce a gentle rule: make a new point or pause — no repeating the same reason. For interrupting, use a simple token system: only the holder of a token may speak; pass the token to take turns. Reinforce calm moderation and model short, composed responses.' },

      { type: 'h2', content: 'Mini “timer routine” (30s think, 60s speak, 15s rebuttal)' },
      { type: 'p', content: 'This mini routine keeps rounds moving and teaches quick organisation. 30 seconds of quiet thinking (notes allowed), 60 seconds to present a Claim→Reason→Example, and 15 seconds for a short rebuttal or question. Use a visible timer or phone stopwatch. For younger or anxious children, shorten speaking to 45 seconds.' },

      { type: 'h2', content: 'Parent scripts to moderate calmly' },
      { type: 'p', content: 'Moderation keeps debate safe and constructive. Use calm, short phrases: “Thank you — now one sentence to explain your reason.” “Let’s pause and breathe for five seconds.” “Nice try — can you add one example?” Avoid saying “Win” or “Lose”; instead say “Good point” and ask a follow-up question.' },

      { type: 'h2', content: 'Done checklist + Week 16 phonics summer plan teaser' },
      { type: 'li', content: 'I used the Claim → Reason → Example frame.' },
      { type: 'li', content: 'I tried the timer routine at least once.' },
      { type: 'li', content: 'I listened to a partner and gave one calm response.' },
      { type: 'p', content: 'Finish by praising the attempt specifically: “I liked how you used an example — that made your point clearer.” Week 16 will focus on a short phonics summer plan to keep reading skills strong.' }
    ]
  },
  {
    slug: 'week-16-phonics-summer-plan',
    title: 'Week 16: Summer Phonics Booster Schedule',
    category: 'Phonics',
    author: 'Priya',
    date: '2026-02-21',
    readTime: '9 min',
    excerpt: "A light 15‑minute summer phonics routine: short review beats, one new focus and a weekly reading party to keep decoding and fluency active without pressure.",
    body: [
      { type: 'h2', content: 'Why kids “forget” reading in holidays (and why it’s normal)' },
      { type: 'p', content: 'During long breaks children often shift routines and spend more time on play and screens. This change reduces the daily micro-practice of reading sounds and words, so fluency dips slightly — not because skills vanish, but because practice becomes irregular. Treat this as normal: short, frequent reminders rebuild the muscle quickly without pressure.' },

      { type: 'h2', content: 'The summer rule: short + frequent beats long + rare' },
      { type: 'p', content: 'When structure is low, short daily beats work best. Fifteen minutes a day keeps skills active and is easier to fit into holiday life than long sessions. Frequent, playful practice builds habit and avoids burnout; remember habit > intensity in summer.' },

      { type: 'h2', content: 'The 5-day weekly rhythm (2 review, 2 new, 1 reading party)' },
      { type: 'p', content: 'A simple weekly beat keeps variety and progress: two days of review of known sounds, two days of gentle introduction to a new pattern (blend or digraph), and one day to celebrate with a reading party.' },

      { type: 'h2', content: 'Week 16 plan (7 days, 15 minutes/day)' },
      { type: 'p', content: 'This seven-day plan stays light and consistent. Each session is 15 minutes: a short warm-up, focused practice, and a tiny reading or game.' },
      { type: 'h3', content: 'Day-by-day (exact)' },
      { type: 'li', content: 'Day 1 — Warm-up + review (15 min): Quick sound flash (5 mins), 8 decodable words (7 mins), 3-minute reread trick (3 mins).' },
      { type: 'li', content: 'Day 2 — Review blends (15 min): review two blends (fl, tr) with cards and 6 short words.' },
      { type: 'li', content: 'Day 3 — New digraph intro (15 min): introduce one digraph (sh/ch) with sound hunt and 6 practice words.' },
      { type: 'li', content: 'Day 4 — New long vowel pattern (15 min): short game to hear long vowel vs short (cake vs cat) and 6 practice words.' },
      { type: 'li', content: 'Day 5 — Reading party (15 min): choose a decodable page or short book and do a 3-minute reread trick.' },
      { type: 'li', content: 'Day 6 — Mix & games (15 min): two quick travel games (see list) and a 5-word sprint.' },
      { type: 'li', content: 'Day 7 — Choice day (15 min): child picks favourite activity from the week and reads aloud.' },

      { type: 'h2', content: 'What to review (sounds, blends, digraphs, long vowels) — simple checklist' },
      { type: 'li', content: 'Single sounds (m, s, t, p) — quick 1-minute flash.' },
      { type: 'li', content: 'Blends (bl, tr, st) — practise 4–6 words each.' },
      { type: 'li', content: 'Digraphs (sh, ch, th) — sound hunt + words.' },
      { type: 'li', content: 'Long vowels (a_e, i_e) — contrast short vs long.' },

      { type: 'h2', content: 'Games that travel well (8–12 games for car/park/home)' },
      { type: 'li', content: '1) Sound hunt — spot words with a target sound on signs.' },
      { type: 'li', content: '2) I Spy phonics — “I spy something that starts with s.”' },
      { type: 'li', content: '3) Two-word challenge — say two words with the same blend.' },
      { type: 'li', content: '4) Rhyme race — find a rhyme for the chosen word.' },
      { type: 'li', content: '5) Syllable clap — clap out syllables in park objects.' },
      { type: 'li', content: '6) Story stitch — make a 3-word sentence using a decodable word.' },
      { type: 'li', content: '7) Speed read — 30-second flash of simple words.' },
      { type: 'li', content: '8) Draw the sound — sketch something that makes the sound.' },
      { type: 'li', content: '9) Memory match — decodable word cards face down.' },
      { type: 'li', content: '10) Car karaoke — sing a simple decodable chorus.' },

      { type: 'h2', content: 'Decodable reading routine (how to pick books + 3-minute reread trick)' },
      { type: 'p', content: 'Choose books where most words are decodable for your child’s level (look for simple predictable patterns). The 3-minute reread trick: child reads a short page once, you give one specific praise, then read it again for speed and confidence — this builds fluency and enjoyment fast.' },

      { type: 'h2', content: 'Troubleshooting (resistance, boredom, mixed levels with siblings)' },
      { type: 'p', content: 'Resistance: reduce to two words and celebrate (“Two words and done!”). Boredom: change the activity (game, car, park). Mixed levels: pair siblings for storytelling roles (one reads, one acts) or use levelled cards so each child has achievable practice.' },

      { type: 'h2', content: 'Done checklist + Week 17 grammar assessment teaser' },
      { type: 'li', content: 'I practised sounds for 5 minutes.' },
      { type: 'li', content: 'I did one 3-minute reread.' },
      { type: 'li', content: 'I played one short phonics game.' },
      { type: 'p', content: 'Finish with a quick praise line: “Nice — you read those words clearly.” Week 17 will offer a gentle DIY grammar assessment to track progress.' },

      { type: 'h3', content: 'Sample 15-minute session breakdown (minute-by-minute)' },
      { type: 'p', content: '0–2 min: warm-up sounds (quick flash). 2–7 min: focused word practice (5 words, decode and blend). 7–10 min: short book or page read. 10–12 min: 3-minute reread trick (read again for speed). 12–15 min: wrap with a game or praise.' },

      { type: 'h3', content: 'Parent scripts (“Two words and done!”)' },
      { type: 'p', content: 'Short scripts keep practice snappy: “Two words and done!” “Let’s read one short page and stop.” “Good — that was clear; one more time for fun.” Praise specifically: “I liked how you sounded the ch in church.”' }
    ]
  },
  {
    slug: 'week-17-grammar-assessment',
    title: 'Week 17: DIY Grammar Assessment for Parents',
    category: 'Grammar',
    author: 'Priya',
    date: '2026-02-24',
    readTime: '9 min',
    excerpt: "A calm 15‑minute grammar checklist for parents: quick, game‑like checks for nouns, verbs, tenses and paragraph structure that reveal two focused practice targets.",
    body: [
      { type: 'h2', content: 'Why quick assessments help (plan smarter, reduce nagging)' },
      { type: 'p', content: 'Quick, playful assessments show you what to practise next — without turning every mistake into a lecture. When parents know a small, specific gap (for example, tenses or punctuation), they can plan short practice bursts instead of repeated corrections. Assessments free you from guessing, reduce nagging, and make learning feel like a series of small wins.' },

      { type: 'h2', content: 'The 15-minute home assessment (how to set the mood)' },
      { type: 'p', content: 'Keep the mood calm and game-like. Choose a quiet 15 minutes, remove screens, offer a small snack, and frame it as “a quick check to see how we can help.” Use a timer, keep your tone warm, and tell your child you will celebrate effort. The aim is information, not judgment.' },

      { type: 'h2', content: 'Nouns/verbs/adjectives quick checks (simple tasks)' },
      { type: 'p', content: 'Task 1 — Naming game: Ask your child to name five things in the room and tell you one word to describe each (adjective). Task 2 — Action swap: Give a photo and ask “What is happening?” to elicit a verb. Tick whether they can label the noun, verb, and an adjective for each prompt.' },

      { type: 'h2', content: 'Tenses + punctuation checks (mini prompts)' },
      { type: 'p', content: 'Prompt 1 — Tense check: Say a short sentence in present (“She eats”) and ask your child to say it in the past and future. Prompt 2 — Punctuation quick-fix: Give a short two-line paragraph with missing punctuation and ask them to add full stops and capitals. Keep each prompt to one minute.' },

      { type: 'h2', content: 'Paragraph check (4-sentence frame test)' },
      { type: 'p', content: 'Ask your child to write or tell a four-sentence mini-paragraph: 1) Topic sentence, 2) Two detail sentences, 3) Closing sentence. Use this to check sentence structure, tense consistency, and punctuation. For speaking versions, record or note whether they used linking words (and, because, but).' },

      { type: 'h2', content: 'Week 17 plan (7 days, 10 minutes/day): assess → fix → reassess' },
      { type: 'p', content: 'A gentle rhythm helps correct small issues quickly. Day 1 assess, Days 2–3 target practice, Day 4 mini reassess, Days 5–6 repeat practice, Day 7 final check and celebrate.' },
      { type: 'h3', content: 'Day-by-day (exact)' },
      { type: 'li', content: 'Day 1 — 15-minute assessment: run the 15-minute home assessment using the script below.' },
      { type: 'li', content: 'Day 2 — Target practice (10 min): Pick one skill (e.g., past tense) and practise with 5 quick prompts.' },
      { type: 'li', content: 'Day 3 — Target practice (10 min): Continue with short games that focus on the same skill.' },
      { type: 'li', content: 'Day 4 — Mini reassess (10 min): Quick check of 3 items from Day 1.' },
      { type: 'li', content: 'Day 5 — Practice with reading (10 min): Choose a short paragraph and highlight target forms.' },
      { type: 'li', content: 'Day 6 — Fun review (10 min): Play a grammar game (sentence scramble or role-play).' },
      { type: 'li', content: 'Day 7 — Final check & praise (10 min): One quick reassess and a celebration of progress.' },

      { type: 'h2', content: 'Red/Amber/Green scoring method (easy for parents)' },
      { type: 'p', content: 'Use three simple labels to record results: Green = confident, Amber = needs practice, Red = target for instruction. For example, mark nouns as Green, verbs Amber, tenses Red. This gives a clear visual snapshot and helps you decide which two small targets to work on for the next four weeks.' },

      { type: 'h2', content: 'What to do with results (focus plan for next 4 weeks)' },
      { type: 'p', content: 'Turn results into a tiny plan: pick two Amber/Red items, schedule 8–10 short (5–10 minute) practice moments across two weeks, then reassess. Use games and reading, not drills — parents can mix practice into daily routines like cooking or car time.' },

      { type: 'h2', content: 'Done checklist + Week 18 video feedback teaser' },
      { type: 'li', content: 'I ran a short 15-minute home assessment.' },
      { type: 'li', content: 'I noted two focus items for practice.' },
      { type: 'li', content: 'I scheduled short practice across the next week.' },
      { type: 'p', content: 'Finish by praising effort: “Thank you — you tried that really well.” Week 18 will show how video feedback can help notice small improvements.' },

      { type: 'h3', content: 'Ready-to-use parent script (read aloud)' },
      { type: 'p', content: '“We will do a quick, fun check to see what to practise. No marks, just things to help us. I will read or show a short sentence and you can tell me or write your answer. Remember, this is practice — I will tell you one thing I liked at the end.”' },

      { type: 'h3', content: 'Simple score sheet idea (no printing — use Notes app)' },
      { type: 'p', content: 'Create a note with three columns: Skill | R/A/G | Example. Under Skill list: Nouns, Verbs, Adjectives, Past tense, Punctuation, Paragraph. Tap to edit during the assessment and use a single line per skill. This is fast, portable, and searchable.' },

      { type: 'h3', content: 'Gentle guidance for kids who get anxious' },
      { type: 'p', content: 'If a child seems nervous, pause and do a two-minute “breathing break” or a silly sound warm-up. Reassure them: “This is not a test — it shows what we can practise together.” Keep praise specific and quick, and let them choose a reward (sticker, choice of story) to end on a positive note.' }
    ]
  },
  {
    slug: 'week-18-speaking-video-feedback',
    title: 'Week 18: Use Video for Instant Speaking Feedback',
    category: 'Public Speaking',
    author: 'Priya',
    date: '2026-02-27',
    readTime: '9 min',
    excerpt: "Short, kind video feedback to spot one small improvement: record brief takes, praise strengths and pick one clear target to practise with a simple Loved/Try‑Next review.",
    body: [
      { type: 'h2', content: 'Why video helps (kids can see progress)' },
      { type: 'p', content: 'Video makes growth visible. Children often cannot notice small improvements in speed, clarity, or expression until they watch themselves. A short recording turns speaking practice into a concrete, re-watchable moment. When handled kindly, it becomes a positive feedback loop: see one small win, try it again, and the win grows.' },

      { type: 'h2', content: 'The rule: praise first, pick ONE improvement only' },
      { type: 'p', content: 'Always start with praise to keep the child motivated. Then choose a single, tiny target for the next practice — for example, a clearer ending or one slower pause. One improvement keeps feedback manageable and avoids shame. Praise first, suggest one improvement, and practise that one thing.' },

      { type: 'h2', content: 'The 2-column review method (Loved / Try next)' },
      { type: 'p', content: 'Use a two-column note: Column A (Loved) — list strengths; Column B (Try next) — list one clear target. Keep entries short and specific. Example: Loved — ‘Your smile at the end’; Try next — ‘Pause for two seconds after the first line.’ This method keeps feedback balanced and action-oriented.' },

      { type: 'h2', content: 'Week 18 plan (7 days, 8–10 minutes/day)' },
      { type: 'p', content: 'Daily short recordings with gentle review build confidence. Each day: a quick warm-up, record one short take, and review with the 2-column method.' },
      { type: 'h3', content: 'Day-by-day' },
      { type: 'li', content: 'Day 1 — Introduce camera (8–10 min): Explain the plan and do a 20–30 second practice recording; show how review works.' },
      { type: 'li', content: 'Day 2 — Praise + one target (8–10 min): Record, praise two things, pick one small target.' },
      { type: 'li', content: 'Day 3 — Practice target (8–10 min): Short warm-up, two takes focusing on the single target.' },
      { type: 'li', content: 'Day 4 — Self-reflect (8–10 min): Child watches one take and names one Loved item.' },
      { type: 'li', content: 'Day 5 — Replay & improve (8–10 min): Record a new take and compare to the first.' },
      { type: 'li', content: 'Day 6 — Fun prompt (8–10 min): Use a playful prompt (weather report or toy review) and record.' },
      { type: 'li', content: 'Day 7 — Progress tracker & praise (8–10 min): Fill the tracker box and celebrate one clear improvement.' },

      { type: 'h2', content: 'What to look for (volume, pace, eye contact, fillers) in kid language' },
      { type: 'p', content: 'Use child-friendly labels: Volume (loud/soft), Pace (slow/fast), Eye contact (looks up), Fillers (um/ah). For each take, choose words the child understands: “Try one smile, one pause, and say slow once.” Avoid technical jargon.' },

      { type: 'h2', content: 'Games using video (8–10): weather report, toy review, story retell' },
      { type: 'li', content: '1) Weather report — child reports today’s weather with expression.' },
      { type: 'li', content: '2) Toy review — give a short review of a toy (what it does, one thing they liked).' },
      { type: 'li', content: '3) Story retell — read a short page, then retell from memory.' },
      { type: 'li', content: '4) Weather remix — same report told in two different voices.' },
      { type: 'li', content: '5) Reporter question — answer a single “why” question on camera.' },
      { type: 'li', content: '6) Two-line drama — act and speak two lines with expression.' },
      { type: 'li', content: '7) Mirror mimic — child copies their own smile or gesture from the video.' },
      { type: 'li', content: '8) Speed switch — one fast take, one slow take; pick the best.' },
      { type: 'li', content: '9) Family fan mail — family records one sentence of praise to show after the take.' },

      { type: 'h2', content: 'What parents should say (scripts) and what to avoid' },
      { type: 'p', content: 'Say short, positive lines: “I loved how you said that — your words were clear.” “Nice pause — that helped.” Avoid negative comparisons (“That was worse than yesterday”) or focusing on many faults. Never use video to shame or criticise; always end with praise and a single, doable suggestion.' },

      { type: 'h2', content: 'Troubleshooting (child hates seeing self, gets silly, refuses camera)' },
      { type: 'p', content: 'If a child dislikes video, start with audio-only notes or record from behind a puppet. If they get silly, keep takes short and set a silly vs serious timer (fun vs practice). If they refuse, offer choice: watch or not watch; if they decline, praise the attempt and try again later. Respecting boundaries keeps practice safe.' },

      { type: 'h2', content: 'Done checklist + Week 19 multisyllabic word play teaser' },
      { type: 'li', content: 'I recorded one short take.' },
      { type: 'li', content: 'I wrote two Loved items and one Try-next.' },
      { type: 'li', content: 'I practised the single chosen target once.' },
      { type: 'p', content: 'Finish with a celebration line: “Great — I noticed you paused before your last sentence.” Week 19 will explore multisyllabic word play to build fluency.' },

      { type: 'h3', content: 'A simple progress tracker idea (3 boxes)' },
      { type: 'p', content: 'Create three small boxes in a note or on paper: This week I improved..., Loved..., Try next.... Fill them after the final take to make progress visible and encourage the next small step.' },

      { type: 'h3', content: 'Sample feedback lines that feel safe' },
      { type: 'li', content: '“I loved how you smiled at the end — it felt friendly.”' },
      { type: 'li', content: '“Nice clear words — next time, try one slow pause after the first line.”' },
      { type: 'li', content: '“Good energy — your voice was loud enough for the microphone.”' }
    ]
  },
  {
    slug: 'week-19-phonics-multisyllabic',
    title: 'Week 19: Multisyllabic Word Play',
    category: 'Phonics',
    author: 'Priya',
    date: '2026-03-01',
    readTime: '9 min',
    excerpt: "Playful multisyllable work: scoop‑and‑say, clapping and short reads across a week to break long words into parts and build fluency, rhythm and confidence.",
    body: [
      { type: 'h2', content: 'Why long words scare kids (and how chunking fixes it)' },
      { type: 'p', content: 'Big words feel heavy because they demand holding many sounds in the head at once. Children often skip parts or guess. Chunking — breaking words into small syllable pieces — reduces cognitive load and turns a scary task into a sequence of small, achievable steps. Teaching scoop-and-say makes long words predictable and fun.' },

      { type: 'h2', content: 'The “scoop syllables” method (step-by-step)' },
      { type: 'p', content: 'Scoop syllables is simple and visual. Step 1: Say the word slowly and listen for beats. Step 2: Underline the vowels. Step 3: Draw small scoops (curved lines) under each syllable. Step 4: Read each scoop separately, then blend them together. Repeat with clap or hop for each scoop to reinforce rhythm.' },

      { type: 'h2', content: 'Vowel spotting: underline vowels first (easy rule)' },
      { type: 'p', content: 'A quick trick is to underline all vowels first — they mark the heart of each syllable. Once vowels are visible, children can spot where to split. This visual cue is especially helpful with longer words and reduces guessing.' },

      { type: 'h2', content: 'Week 19 plan (7 days, 12 minutes/day)' },
      { type: 'p', content: 'Keep sessions short and playful: each day includes a warm-up, a scoop practice, and a tiny read. Use a timer for 12 minutes and end on a success.' },
      { type: 'h3', content: 'Day-by-day (exact)' },
      { type: 'li', content: 'Day 1 — Introduction to scooping (12 min): Teach scoops with simple two-syllable words and clap each scoop.' },
      { type: 'li', content: 'Day 2 — Two-syllable practice (12 min): Practice 10 two-syllable words with scoop + blend.' },
      { type: 'li', content: 'Day 3 — Three-syllable intro (12 min): Show how three-syllable words have three scoops; practise 8 words.' },
      { type: 'li', content: 'Day 4 — Vowel spotting (12 min): Underline vowels and split words; do a quick read race.' },
      { type: 'li', content: 'Day 5 — Games day (12 min): Play two scoop games from the list below.' },
      { type: 'li', content: 'Day 6 — Sentences with long words (12 min): Read short sentences that include long words.' },
      { type: 'li', content: 'Day 7 — Mini showcase & praise (12 min): Child reads a short passage and picks one favourite long word to show.' },

      { type: 'h2', content: 'Games (8–12): syllable clap, syllable hop, scoop race, word puzzles' },
      { type: 'li', content: 'Syllable clap — clap once for each syllable.' },
      { type: 'li', content: 'Syllable hop — hop for each scoop.' },
      { type: 'li', content: 'Scoop race — who can scoop and blend a word correctly first.' },
      { type: 'li', content: 'Word puzzles — mix syllable cards and rebuild words.' },
      { type: 'li', content: 'Echo read — parent says scoop-by-scoop, child echoes.' },
      { type: 'li', content: 'Beat band — tap a rhythm for each syllable.' },
      { type: 'li', content: 'Memory match — match words by syllable count.' },
      { type: 'li', content: 'Syllable swap — change one syllable to make a new word.' },

      { type: 'h2', content: 'Word list by difficulty (2 syllables → 3 syllables)' },
      { type: 'p', content: 'Begin with predictable two-syllable words and move to common three-syllable words. Read these scoop-by-scoop with your child.' },
      { type: 'h3', content: 'Two-syllable examples (10 words)' },
      { type: 'li', content: 'basket, tiger, window, helper, flower, pencil, planet, summer, music, market' },
      { type: 'h3', content: 'Three-syllable examples (8 words)' },
      { type: 'li', content: 'banana, elephant, butterfly, together, family, remember, beautiful, yesterday' },

      { type: 'h2', content: 'Common errors (skipping syllables, wrong stress) + gentle fixes' },
      { type: 'p', content: 'If a child skips syllables, slow down and point to each scoop as they say it. For wrong stress, model the correct stress by saying the word clearly and having the child echo. Use tapping or clapping to mark the stressed syllable so rhythm becomes physical.' },

      { type: 'h2', content: 'Reading practice: short sentences with long words' },
      { type: 'p', content: 'Create short sentences that include one long word and practise reading them aloud. Example: “The butterfly landed on the flower.” Scoop the long word, then read the full sentence for fluency.' },

      { type: 'h2', content: 'Done checklist + Week 20 editing camp teaser' },
      { type: 'li', content: 'I practised scooping 10 two-syllable words.' },
      { type: 'li', content: 'I tried 8 three-syllable words with scoops.' },
      { type: 'li', content: 'I read one short sentence with a long word.' },
      { type: 'p', content: 'Finish with a specific praise: “Nice scooping — you blended the parts together.” Week 20 will focus on simple editing games to polish writing.' },

      { type: 'h3', content: 'Parent scripts (“Let’s find the vowels first…”)' },
      { type: 'p', content: 'Use short, guiding lines: “Let’s find the vowels first — underline them.” “Now scoop the word and clap each part.” “Say each scoop slowly and then put them together.” Praise attempts: “Good — that sounded smoother.”' }
    ]
  },
  {
    slug: 'week-20-grammar-editing-camp',
    title: 'Week 20: Editing Camp at Home',
    category: 'Grammar',
    author: 'Priya',
    date: '2026-03-04',
    readTime: '9 min',
    excerpt: "Make editing playful: two quick passes (basics then style), stations, scavenger hunts and immediate rewards so children polish writing without losing confidence.",
    body: [
      { type: 'h2', content: 'Why kids hate editing (and how to change the feeling)' },
      { type: 'p', content: 'Editing often feels like criticism to a child. They may equate corrections with being “wrong” and lose confidence. Change the frame: editing is a game that improves a story, not proof of failure. Celebrate ideas first and treat corrections as small upgrades — this protects motivation and keeps practicing fun.' },

      { type: 'h2', content: 'The 2-pass rule: Fix basics first, improve style second' },
      { type: 'p', content: 'Pass 1 — Basics: capitals, full stops, simple spelling. Pass 2 — Style: better words, varied sentences, clearer verbs. Keep passes short and focused; never fix both at once. This helps a child see visible improvement quickly and keeps confidence intact.' },

      { type: 'h2', content: 'Editing stations (capitals, punctuation, spelling, better words) — simple' },
      { type: 'p', content: 'Set up four small stations: Capitals (find and fix), Punctuation (full stops and commas), Spelling (common words), Better Words (swap one word to a stronger choice). Rotate quickly so each station feels like a mini-challenge.' },

      { type: 'h2', content: 'Week 20 plan (7 days, 10 minutes/day) — day-by-day' },
      { type: 'p', content: 'Each day is 10 minutes: a warm-up, a focused station, and a tiny reward or praise. Keep tasks short and celebrate each fix.' },
      { type: 'h3', content: 'Day-by-day (exact)' },
      { type: 'li', content: 'Day 1 — Introduce the 2-pass rule and set up stations (10 min).' },
      { type: 'li', content: 'Day 2 — Pass 1: Capitals & punctuation (10 min) — scavenger hunt.' },
      { type: 'li', content: 'Day 3 — Pass 1: Spelling station (10 min) — quick word checks.' },
      { type: 'li', content: 'Day 4 — Pass 2: Better words station (10 min) — swap one word per sentence.' },
      { type: 'li', content: 'Day 5 — Scavenger hunt (10 min) — find 5 capitals, 5 verbs, 5 punctuation marks.' },
      { type: 'li', content: 'Day 6 — Mix & match (10 min) — rotate through two stations quickly.' },
      { type: 'li', content: 'Day 7 — Showcase & reward (10 min) — child reads edited piece and earns a non-money reward.' },

      { type: 'h2', content: 'Scavenger hunt editing game (find 5 capitals, 5 verbs, 5 punctuation marks)' },
      { type: 'p', content: 'Turn editing into a race: give a short paragraph and a 5-minute timer. Child finds five capitals, five verbs, and five punctuation marks to fix or confirm. Celebrate each correct find with a sticker or a point.' },

      { type: 'h2', content: '“Better words” mini bank (swap good→great, said→whispered etc.)' },
      { type: 'p', content: 'Keep a tiny bank of substitutions: good → great, said → whispered/remarked, big → enormous/huge, walked → marched/strolled, looked → peered/gazed. Teach the child to pick one replacement per sentence to improve style without overwhelming them.' },

      { type: 'h2', content: 'Parent scripts: how to correct without crushing confidence' },
      { type: 'p', content: 'Use short, specific, and positive language. Try: “I love your idea — shall we make one small fix to make it even clearer?” or “Nice line — can we try one stronger word here?” Avoid long lists of corrections. Always show the before and after and ask which they prefer.' },

      { type: 'h2', content: 'Troubleshooting (child refuses, cries, says “I’m bad at writing”)' },
      { type: 'p', content: 'If a child resists, pause and switch to a playful activity (clap the capitals, draw a punctuation face). If they say “I’m bad at writing,” reframe with specific praise: “You had a great idea — that’s the hard part. Editing makes it shine.” Offer a choice: fix one sentence now, or two tomorrow.' },

      { type: 'h2', content: 'A short sample paragraph with intentional mistakes + how to fix (describe steps)' },
      { type: 'p', content: 'Sample paragraph with mistakes: "the dog run fast it barked loud and then it sleep." Steps to fix: Pass 1 — Capitals & punctuation: Capitalise The, add full stops: "The dog run fast. It barked loud and then it sleep." Pass 1 — Spelling: change run→ran, sleep→slept: "The dog ran fast. It barked loud and then it slept." Pass 2 — Better words & clarity: replace loud→ferociously, add a connector: "The dog ran fast. It barked ferociously, and then it slept." Read aloud and praise each step.' },

      { type: 'h2', content: 'Reward system that isn’t money (stickers, points, choice time)' },
      { type: 'p', content: 'Use simple non-monetary rewards: a sticker, a point towards a small privilege (extra story, choose dessert), or five points = 10 minutes of choice time. Keep rewards immediate and tied to effort not perfection.' },

      { type: 'h2', content: 'Done checklist + Week 21 competition prep teaser' },
      { type: 'li', content: 'I completed Pass 1 (capitals & punctuation).' },
      { type: 'li', content: 'I completed Pass 2 (better words).' },
      { type: 'li', content: 'I played the scavenger hunt game.' },
      { type: 'p', content: 'Finish with a clear praise line: “You made the story even better — well done.” Week 21 will focus on competition-ready rehearsal with timing and props.' },

      { type: 'h3', content: 'Sample parent script to read aloud' },
      { type: 'p', content: '“This is editing camp — we will do two quick passes. First we fix the basics so the story is tidy. Then we make one small change to make a sentence sparkle. Ready? I will time two minutes for Pass 1.”' }
    ]
  },
  {
    slug: 'week-21-speaking-competition-prep',
    title: 'Week 21: Competition Prep Checklist',
    category: 'Public Speaking',
    author: 'Priya',
    date: '2026-03-07',
    readTime: '9 min',
    excerpt: "A practical competition‑prep checklist for parents: brief daily rehearsals, timing drills, expression tools and stage habits to calmly polish a short performance at home.",
    body: [
      { type: 'h2', content: 'Why kids feel nervous (and why it’s a good sign)' },
      { type: 'p', content: 'Nerves mean the child cares — that attention to the moment can be channelled into energy. Feeling butterflies is normal; it shows the brain is alert. The job of parents and coaches is to normalise nerves, offer strategies to manage them, and focus on progress (not perfection).' },

      { type: 'h2', content: 'The 4-step rehearsal system (script → audio → mirror → full run)' },
      { type: 'p', content: 'A clear, repeatable rehearsal system reduces surprises. Step 1: Script — write and mark the script with pauses and emphasis. Step 2: Audio — record an audio-only take so the child hears pace and phrasing. Step 3: Mirror — practise in front of a mirror to add expression and gestures. Step 4: Full run — complete the whole piece with entrance and exit, ideally in costume or with the prop.' },

      { type: 'h2', content: 'Timing practice without stress (simple timer routine)' },
      { type: 'p', content: 'Use a gentle timer routine: 30s warm-up, two short timed runs (first at comfortable pace, second at performance pace), then a 60-second calm review. Use a visible timer so the child learns pacing without clock anxiety.' },

      { type: 'h2', content: 'Week 21 plan (7 days, 12 minutes/day) — day-by-day' },
      { type: 'p', content: 'Short daily rehearsals build confidence. Each day is 12 minutes: warm-up, focused rehearsal, and a quick positive note.' },
      { type: 'h3', content: 'Day-by-day (exact)' },
      { type: 'li', content: 'Day 1 — Script polish (12 min): Mark pauses, decide first line and ending. Practice the opening line until it feels natural.' },
      { type: 'li', content: 'Day 2 — Audio practice (12 min): Record two audio takes; listen for pace and clarity.' },
      { type: 'li', content: 'Day 3 — Mirror work (12 min): Add facial expression and one simple gesture.' },
      { type: 'li', content: 'Day 4 — Timing drills (12 min): Use the timer routine; practise short runs.' },
      { type: 'li', content: 'Day 5 — Stage habits (12 min): Rehearse entry, mic distance, and exit.' },
      { type: 'li', content: 'Day 6 — Dress rehearsal (12 min): Full run with costume/prop and a small audience (family).' },
      { type: 'li', content: 'Day 7 — Calm review & celebration (12 min): One final short run and specific praise; note one improvement.' },

      { type: 'h2', content: 'Expression toolkit (pause, smile, gesture, volume) — kid-friendly' },
      { type: 'p', content: 'Teach four simple tools: Pause — a short beat between ideas; Smile — friendly energy at key moments; Gesture — one clear hand movement; Volume — practice soft→normal→projected. Turn each into a tiny game: pause charades, smile practice, gesture copy, volume scale.' },

      { type: 'h2', content: 'Stage habits: entry, eye contact, mic distance, exit (simple)' },
      { type: 'p', content: 'Keep stage habits minimal and repeatable: enter with a steady walk, take two friendly looks at the audience, hold the mic 2–3 fingers away from the mouth, and exit with a small smile. Practise these habits until they become automatic.' },

      { type: 'h2', content: 'What parents should say (scripts) before and after performance' },
      { type: 'p', content: 'Before: “You are ready — trust your practice. Take one breath and say the first line like a small story.” After: “I loved how you [specific detail] — what felt best to you?” Keep language specific and warm; avoid pressure or over-coaching immediately before going on stage.' },

      { type: 'h2', content: 'Troubleshooting (child forgets lines, speaks too fast, cries, compares)' },
      { type: 'p', content: 'If lines are forgotten, teach two quick fixes: 1) a tiny note card with three keywords, or 2) an anchor gesture to bring back the line. For fast speaking, practise pauses and count quietly in practice. If the child cries, step back, offer a breathing reset, and remind them practice is the priority. For comparisons, redirect to personal progress: “Look how much you improved.”' },

      { type: 'h2', content: 'Done checklist + Week 22 phonics diagnostics teaser' },
      { type: 'li', content: 'I practised my opening line until it felt natural.' },
      { type: 'li', content: 'I timed two short runs.' },
      { type: 'li', content: 'I rehearsed entry and exit once.' },
      { type: 'p', content: 'Finish with a clear praise line: “You were brave and prepared — well done.” Week 22 will include a quick phonics diagnostic to plan the next steps.' },

      { type: 'h3', content: 'Mini checklist parents can screenshot' },
      { type: 'li', content: '1) First line ready' },
      { type: 'li', content: '2) Two timed runs done' },
      { type: 'li', content: '3) One expression tool used (pause/smile/gesture)' },
      { type: 'li', content: '4) Entry & exit practised' },

      { type: 'h3', content: 'A 60-second “reset routine” before stage (breath + posture + first line)' },
      { type: 'p', content: 'Stand tall for 5 seconds, take three slow breaths (inhale 3, exhale 4), relax shoulders, smile once, say the first line quietly to yourself. This short routine calms nerves, sets posture, and brings attention to the opening sentence.' },

      { type: 'h3', content: 'Quick parent scripts' },
      { type: 'p', content: 'Before: “Two breaths and one smile — you are ready.” After: “I noticed you slowed down — that sounded great. What did you like about your performance?”' }
    ]
  },
  {
    slug: 'week-22-phonics-diagnostics',
    title: 'Week 22: Diagnostic Checklist Before a New Term',
    category: 'Phonics',
    author: 'Priya',
    date: '2026-03-10',
    readTime: '9 min',
    excerpt: "A friendly 20‑minute phonics diagnostic to identify two priority skills: quick checks for sounds, blends, digraphs and vowels to plan the coming term's practice.",
    body: [
      { type: 'h2', content: 'Why diagnostics save time (teach the right thing next)' },
      { type: 'p', content: 'A quick check shows exactly which skills need practice. Without diagnosis, parents often guess and spend time on things the child already knows. A gentle diagnostic points you to targeted practice, so each minute you spend is effective and confidence-building.' },

      { type: 'h2', content: 'The 20-minute home check (set the mood, make it game-like)' },
      { type: 'p', content: 'Keep the session short and playful. Choose a quiet time, offer a small reward (sticker or choice time), and explain it is a friendly check: “Let’s see what you already know!” Use a timer for 20 minutes, move quickly between mini-tasks, and celebrate every correct answer.' },

      { type: 'h2', content: 'What to assess: letter sounds, blending, tricky words, digraphs, long vowels' },
      { type: 'p', content: 'Cover core areas briefly: single-letter sounds (m, s, t), simple blends (tr, st), digraphs (sh, ch, th), common tricky words (the, said, was), and long vowel patterns (a_e, i_e). Each check should take 30–90 seconds so you get a clear snapshot without fatigue.' },

      { type: 'h2', content: 'Simple scoring: Green/Amber/Red (what it means)' },
      { type: 'p', content: 'Use Green = confident and automatic, Amber = needs practise with prompts, Red = target for focused instruction. Don’t label the child — label the skill. This simple coding helps you choose two priorities for the next four weeks.' },

      { type: 'h2', content: 'Week 22 plan (7 days, 10 minutes/day): assess → target → reassess' },
      { type: 'p', content: 'A short week of focused checks and small practice: Day 1 assess, Days 2–4 practice chosen targets, Day 5 mini-reassess, Days 6–7 consolidate and celebrate.' },
      { type: 'h3', content: 'Day-by-day (exact)' },
      { type: 'li', content: 'Day 1 — 20-minute diagnostic: follow the 20-minute home check and mark Green/Amber/Red.' },
      { type: 'li', content: 'Day 2 — Target practice 1 (10 min): practise the first Amber/Red skill with a short game.' },
      { type: 'li', content: 'Day 3 — Target practice 2 (10 min): practise the second priority skill.' },
      { type: 'li', content: 'Day 4 — Mixed review (10 min): quick mix of known Green items and Amber items.' },
      { type: 'li', content: 'Day 5 — Mini reassess (10 min): check the two priority skills again.' },
      { type: 'li', content: 'Day 6 — Fun practice (10 min): pick a phonics game that uses the target sounds.' },
      { type: 'li', content: 'Day 7 — Reflect & plan (10 min): note progress and set two small practice goals for the next two weeks.' },

      { type: 'h2', content: 'If your child is Amber/Red: what to do first (priority order)' },
      { type: 'p', content: 'Start with the most common functional skill: 1) single sounds that block blending, 2) blends/digraphs that appear often, 3) tricky words needed for reading fluency, 4) long vowel patterns. Focus on short, daily micro-practice (5 minutes) rather than long sessions.' },

      { type: 'h2', content: 'Troubleshooting (child guesses, refuses, gets upset)' },
      { type: 'p', content: 'If a child guesses, make the task multi-step: ask them to say the sound, then show a picture or point to a letter. If they refuse or get upset, stop and try a playful activity or return later; reassure them that this is just a friendly check. Keep language positive: “We’re just finding the next fun thing to practise.”' },

      { type: 'h2', content: 'How to track progress without worksheets (notes app method)' },
      { type: 'p', content: 'Use the Notes app or a simple note with columns: Skill | G/A/R | Example. During the check tap to mark Green/Amber/Red and type one example word. This is searchable and portable — no printing needed.' },

      { type: 'h2', content: 'Done checklist + Week 23 story cards bridge teaser' },
      { type: 'li', content: 'I ran a friendly 20-minute diagnostic.' },
      { type: 'li', content: 'I chose two priority skills to practise.' },
      { type: 'li', content: 'I scheduled short practice for the next two weeks.' },
      { type: 'p', content: 'Finish with praise and one specific note: “Great — you read that sound clearly.” Week 23 will use story cards to bridge speaking and grammar practice.' },

      { type: 'h3', content: 'Diagnostic list (screenshot-friendly) — quick items' },
      { type: 'li', content: 'Single-letter sounds: m, s, t, p, b' },
      { type: 'li', content: 'Blends: tr, st, bl, gr' },
      { type: 'li', content: 'Digraphs: sh, ch, th' },
      { type: 'li', content: 'Tricky/common words: the, said, was, they' },
      { type: 'li', content: 'Long vowel patterns: a_e, i_e, o_e' },

      { type: 'h3', content: 'Parent scripts (“Let’s just see what you already know!”)' },
      { type: 'p', content: 'Short friendly lines to open the check: “Let’s just see what you already know — nothing to worry about.” During: “Can you say this sound for me?” After: “Nice — that helps me pick a tiny next step.”' }
    ]
  },
  {
    slug: 'week-23-grammar-speaking-bridge',
    title: 'Week 23: Bridge Grammar & Speaking with Story Cards',
    category: 'Grammar',
    author: 'Priya',
    date: '2026-03-12',
    readTime: '9 min',
    excerpt: "Story cards that bridge speaking and writing: a week of talk→shape→write tasks with simple frames that turn oral ideas into short, confident sentences.",
    body: [
      { type: 'h2', content: 'Why some kids can speak but can’t write (motor load + planning)' },
      { type: 'p', content: 'Speaking and writing use different mental muscles. Many children can tell a story easily but freeze when asked to write because handwriting, spelling and planning combine to overload working memory. Speaking first reduces the planning burden — the words are already shaped in the child’s head.' },

      { type: 'h2', content: 'The bridge method: Say it → Shape it → Write it' },
      { type: 'p', content: 'Use a three-step bridge. Say it: child tells the idea aloud. Shape it: parent or child shapes the sentence using a simple frame. Write it: child copies or writes one sentence. This method keeps writing short and builds confidence by turning speech into a scaffolded writing task.' },

      { type: 'h2', content: 'DIY story cards (how to make in 5 minutes)' },
      { type: 'p', content: 'Take index cards or cut paper into small cards. Write a character, a place, and a problem on separate cards (12 total). Add a few action cards (finds, loses, helps). Keep the cards colourful and store in a small box — ready to grab for quick practice.' },

      { type: 'h2', content: 'Week 23 plan (7 days, 12 minutes/day) — day-by-day' },
      { type: 'p', content: 'Short daily sessions focus on speaking first, shaping, and writing one or two sentences.' },
      { type: 'h3', content: 'Day-by-day (exact)' },
      { type: 'li', content: 'Day 1 — Make story cards & pick one character + place (12 min). Tell the story aloud.' },
      { type: 'li', content: 'Day 2 — Say it (12 min): child tells a 2-sentence story; parent repeats clearly.' },
      { type: 'li', content: 'Day 3 — Shape it (12 min): use a sentence frame to shape one sentence; child copies it.' },
      { type: 'li', content: 'Day 4 — Write it (12 min): child writes one sentence from the shaped line; praise effort.' },
      { type: 'li', content: 'Day 5 — Expand (12 min): add one adjective or short detail to the second sentence.' },
      { type: 'li', content: 'Day 6 — Game day (12 min): play pick-a-card talk or 3-sentence story.' },
      { type: 'li', content: 'Day 7 — Share & celebrate (12 min): child reads aloud two sentences and picks a favourite card.' },

      { type: 'h2', content: 'Sentence frames that help (who/what/where/when/why) — kid-friendly' },
      { type: 'p', content: 'Give simple frames: “Who + did what + where.” “I saw + who + do + what.” Use prompts like: Who? What happened? Where? When? Why? These short frames reduce cognitive load and make copying easier.' },

      { type: 'h2', content: 'Games (8–12): pick-a-card talk, 3-sentence story, because chain' },
      { type: 'li', content: 'Pick-a-card talk — draw three cards and tell a short story.' },
      { type: 'li', content: '3-sentence story — beginning, problem, ending.' },
      { type: 'li', content: 'Because chain — each person adds a line starting with “because”.' },
      { type: 'li', content: 'Story relay — family adds one sentence each.' },
      { type: 'li', content: 'Character swap — change the character and retell.' },
      { type: 'li', content: 'Picture prompt — pick a card and draw a quick scene.' },
      { type: 'li', content: 'Silent storyteller — act the card, then narrate.' },
      { type: 'li', content: '3-word summary — sum the story in three words.' },

      { type: 'h2', content: 'Troubleshooting (child says 1 word, repeats, freezes when writing)' },
      { type: 'p', content: 'If the child gives only one word, expand with a gentle question: “Who did that? Where did it happen?” If they repeat, encourage a change: “Can you make the next one new?” If they freeze when writing, offer to write the shaped sentence and ask them to copy one short part — or dictate into a voice note and transcribe together.' },

      { type: 'h2', content: 'How to level up (add adjectives, conjunctions, dialogue)' },
      { type: 'p', content: 'Once one-sentence writing is comfortable, add small upgrades: one adjective per sentence, a conjunction (and/but/because) to join ideas, or a short line of dialogue in quotes. Level up slowly and celebrate each added element.' },

      { type: 'h2', content: 'Done checklist + Week 24 family showcase teaser' },
      { type: 'li', content: 'I made story cards and picked three.' },
      { type: 'li', content: 'I shaped and wrote one sentence.' },
      { type: 'li', content: 'I played one story card game.' },
      { type: 'p', content: 'Finish with praise: “I liked how you told that part — great idea.” Week 24 will guide hosting a family showcase to celebrate progress.' },

      { type: 'h3', content: '12 sample story card ideas (characters/places/problems)' },
      { type: 'li', content: '1 — A lost kitten in a busy market' },
      { type: 'li', content: '2 — A friendly robot at the school library' },
      { type: 'li', content: '3 — A magic tree in the playground' },
      { type: 'li', content: '4 — A secret note found on a bus' },
      { type: 'li', content: '5 — A picnic where it starts to rain' },
      { type: 'li', content: '6 — A small chef who burns a cake' },
      { type: 'li', content: '7 — A brave child who helps a neighbour' },
      { type: 'li', content: '8 — A lost key and a helpful dog' },
      { type: 'li', content: '9 — A mysterious sound at night' },
      { type: 'li', content: '10 — A day the playground disappeared' },
      { type: 'li', content: '11 — A birthday surprise that goes wrong' },
      { type: 'li', content: '12 — A map that leads to a small treasure' },

      { type: 'h3', content: 'Parent scripts (“Tell me first. I’ll write it once. Then you copy one sentence.”)' },
      { type: 'p', content: 'Short scripts to guide the bridge: “Tell me the story first — just say it like a movie.” “I’ll write one sentence exactly how you said it. Now you copy that sentence.” Praise specifically: “Great choice — that made the picture so clear.”' }
    ]
  },
  {
    slug: 'week-24-speaking-family-showcase',
    title: 'Week 24: Host a Family Showcase Night',
    category: 'Public Speaking',
    author: 'Priya',
    date: '2026-03-14',
    readTime: '9 min',
    excerpt: "Host a family showcase with short rehearsals and clear audience rules: low‑pressure performances that celebrate progress and build speaking joy at home.",
    body: [
      { type: 'h2', content: 'Why showcase nights work (motivation + real speaking practice)' },
      { type: 'p', content: 'Showcases give a real audience in a safe space — and that is powerful. Performing for family creates a natural reward loop: practice leads to applause, which builds confidence. Short, regular showcases turn speaking into a shared celebration rather than a one-off test.' },

      { type: 'h2', content: 'The simplest format (2 minutes each, clap loudly, no corrections)' },
      { type: 'p', content: 'Keep the format tiny and joyous: 2 minutes per child, warm applause after each performance, and no corrections from the audience. Praise effort and one specific detail (voice, smile, idea). The rule is: celebrate, not critique.' },

      { type: 'h2', content: 'How to host at home or on Zoom (grandparents included)' },
      { type: 'p', content: 'Choose a comfortable space, set a clear start time, and send a simple invite for Zoom if you include distant family. Ask remote guests to mute except for applause or a short encouraging line. Use a laptop on a stable surface for video and a low table as a stage.' },

      { type: 'h2', content: 'Week 24 plan (7 days) — prep small each day, then host' },
      { type: 'p', content: 'Prepare in small steps so performing feels easy. Each day is short: pick topics, rehearse lines, choose props, then host the night on Day 7.' },
      { type: 'h3', content: 'Day-by-day (exact)' },
      { type: 'li', content: 'Day 1 — Invite & plan (5–10 min): Decide date, invite family, select who will perform.' },
      { type: 'li', content: 'Day 2 — Topic choices (10 min): Let each child pick a 1-minute topic.' },
      { type: 'li', content: 'Day 3 — Short rehearsals (10 min): Practise first lines and one expression tool.' },
      { type: 'li', content: 'Day 4 — Props & stage (10 min): Choose a simple prop or backdrop.' },
      { type: 'li', content: 'Day 5 — Dress rehearsal (10 min): One brief run with timing.' },
      { type: 'li', content: 'Day 6 — Final polish (10 min): Quick warm-ups and calm breathing.' },
      { type: 'li', content: 'Day 7 — Showcase night (30–45 min): Host the event, clap, and celebrate.' },

      { type: 'h2', content: 'Topic ideas (15) for different ages' },
      { type: 'li', content: '1 — My favourite toy' },
      { type: 'li', content: '2 — A day at the park' },
      { type: 'li', content: '3 — A funny cooking moment' },
      { type: 'li', content: '4 — A book I recommend' },
      { type: 'li', content: '5 — A helpful neighbour' },
      { type: 'li', content: '6 — My best holiday' },
      { type: 'li', content: '7 — A small science trick' },
      { type: 'li', content: '8 — How I made something' },
      { type: 'li', content: '9 — A memory with grandparents' },
      { type: 'li', content: '10 — My favourite animal' },
      { type: 'li', content: '11 — A short joke or riddle' },
      { type: 'li', content: '12 — A short poem' },
      { type: 'li', content: '13 — A picture description' },
      { type: 'li', content: '14 — A tiny report (weather/news)' },
      { type: 'li', content: '15 — A 30-second story about a hero' },

      { type: 'h2', content: 'Parent role: host, timekeeper, cheerleader (scripts included)' },
      { type: 'p', content: 'Parents keep the event smooth: welcome guests, keep time with a visible timer, and lead applause. Use short scripts: “Thank you for coming — let’s welcome [child].” After each performance: “That was lovely — I noticed [specific detail].”' },

      { type: 'h2', content: 'Troubleshooting (shy child, sibling rivalry, child gets silly)' },
      { type: 'p', content: 'If a child is shy, let them go first or last depending on preference, or allow audio-only performances. For sibling rivalry, set clear turns and praise each child’s unique strength. If a child gets silly, keep takes short and offer a calm redo: “One more try if you like.”' },

      { type: 'h2', content: 'How to keep it monthly without effort (repeatable routine)' },
      { type: 'p', content: 'Automate invites (calendar event), keep a small box of props, and rotate topics. Make it part of the family rhythm: first Sunday of every month. Short prep days keep it low-effort and high-reward.' },

      { type: 'h2', content: 'Done checklist + Week 25 back-to-school teaser' },
      { type: 'li', content: 'I invited family and set a date.' },
      { type: 'li', content: 'I rehearsed with my child twice.' },
      { type: 'li', content: 'I clapped and praised each performance.' },
      { type: 'p', content: 'Finish by asking the child what they enjoyed and one thing they’d like to try next. Week 25 will focus on a back-to-school confidence plan.' },

      { type: 'h3', content: 'A sample event flow (minute-by-minute)' },
      { type: 'p', content: '0–5 min: Welcome & brief warm-up. 5–35 min: Performances (2 min each, with quick applause). 35–40 min: Short family feedback (one line each) and a small celebration (song or snack).' },

      { type: 'h3', content: 'Certificate idea parents can write on paper (no printing)' },
      { type: 'p', content: 'Make a simple certificate: "Tiny Steps Showcase — [Child Name] — For sharing their story with courage on [Date]" Add one specific praise sentence and sign it. Fold and present it after the showcase.' }
    ]
  },
  {
    slug: 'week-25-back-to-school-plan',
    title: 'Week 25: Back-to-School English Confidence Plan',
    category: 'Parent Tips',
    author: 'Priya',
    date: '2026-03-16',
    readTime: '11 min',
    excerpt: "A research-informed back‑to‑school protocol for parents: baseline checks, a 7-day micro-plan, and measurable targets in phonics, grammar, reading, and speaking.",
    body: [
      { type: 'h2', content: 'Research abstract: why confidence drops after holidays' },
      { type: 'p', content: 'Back-to-school confidence usually drops because routines break and retrieval opportunities reduce, not because children suddenly "lose ability." A short, structured restart improves performance faster than intensive cramming. This Week 25 article uses a research-informed protocol designed for real family schedules.' },

      { type: 'h2', content: 'Evidence base used in this plan (plain-language summary)' },
      { type: 'li', content: 'Systematic phonics improves early word reading and spelling accuracy when practice is explicit and cumulative (National Reading Panel; later reviews in reading science).' },
      { type: 'li', content: 'Guided repeated oral reading improves fluency and supports comprehension when texts are matched to level.' },
      { type: 'li', content: 'Retrieval + spacing improves retention better than one long session; short daily review is more durable than weekend-only practice.' },
      { type: 'li', content: 'Child motivation improves with mastery experiences: small wins first, then gradual challenge (self-efficacy research).' },

      { type: 'h2', content: 'Tiny Steps Back-to-School Diagnostic (Day 0, 15 minutes)' },
      { type: 'p', content: 'Run a brief baseline before planning. This prevents random practice and ensures parents target the right skill gap.' },
      { type: 'li', content: 'Phonics check (5 min): 10 sound cards + 5 blend words; note accuracy and hesitation.' },
      { type: 'li', content: 'Reading fluency check (5 min): one short decodable passage; note error count and smoothness.' },
      { type: 'li', content: 'Grammar/writing check (3 min): one sentence expansion task.' },
      { type: 'li', content: 'Speaking check (2 min): 30-second prompt with beginning-middle-end.' },

      { type: 'h2', content: 'Seven-day intervention protocol (20-30 minutes/day)' },
      { type: 'h3', content: 'Day-by-day implementation' },
      { type: 'li', content: 'Day 1 (Reset): 10 min phonics refresh + 10 min guided reading + 5 min spoken recap.' },
      { type: 'li', content: 'Day 2 (Accuracy): 12 min decoding ladder + 8 min sentence dictation + 5 min confidence close.' },
      { type: 'li', content: 'Day 3 (Fluency): 5 min word review + 10 min repeated reading + 5 min comprehension questions.' },
      { type: 'li', content: 'Day 4 (Grammar transfer): 10 min sentence building + 10 min edit-and-read + 5 min oral explanation.' },
      { type: 'li', content: 'Day 5 (Speaking structure): 10 min topic planning + 10 min 45-second talk rehearsal.' },
      { type: 'li', content: 'Day 6 (Mixed transfer): combine one phonics, one grammar, one speaking task in short rounds.' },
      { type: 'li', content: 'Day 7 (Review): rerun mini-diagnostic, compare with Day 0, and set next 2 weekly targets.' },

      { type: 'h2', content: 'Age-band goals with measurable outcomes' },
      { type: 'li', content: 'Ages 3-5: stronger sound recall and oral blending; target is faster response and clearer segmenting.' },
      { type: 'li', content: 'Ages 6-7: improved decoding + sentence control; target is fewer reading errors and cleaner punctuation.' },
      { type: 'li', content: 'Ages 8-10: improved fluency + structured speaking; target is smoother passage reading and coherent 45-second response.' },

      { type: 'h2', content: 'Implementation standards for parents (to keep quality high)' },
      { type: 'li', content: 'Keep one fixed daily slot to reduce negotiation and decision fatigue.' },
      { type: 'li', content: 'Use 80/20 difficulty: mostly successful tasks, small stretch at the end.' },
      { type: 'li', content: 'Correct quickly: model once, child retries once, then move forward.' },
      { type: 'li', content: 'End every session with one specific praise line tied to effort or strategy.' },

      { type: 'h2', content: 'Progress tracker template (Notes app or notebook)' },
      { type: 'p', content: 'Track daily with five fields: Date | Task | Accuracy | Confidence (1-5) | Next focus. This makes parent-teacher communication precise and useful.' },
      { type: 'li', content: 'Example entry: "Mar 17 | CVC blending + retell | 8/10 | 4/5 | Review short-i contrasts tomorrow."' },

      { type: 'h2', content: 'Decision rules: continue, adapt, or escalate' },
      { type: 'li', content: 'Continue current plan if accuracy and confidence rise for 3 consecutive sessions.' },
      { type: 'li', content: 'Adapt task level if child resists or accuracy drops below about 60 percent for 2 sessions.' },
      { type: 'li', content: 'Escalate for teacher support if no visible gain after 2 weeks of consistent practice.' },

      { type: 'h2', content: 'Common back-to-school failure points and fixes' },
      { type: 'li', content: 'Failure point: too many new tasks at once. Fix: reduce to one target skill per day.' },
      { type: 'li', content: 'Failure point: reading-only practice without comprehension. Fix: add two meaning questions daily.' },
      { type: 'li', content: 'Failure point: correction overload. Fix: prioritize one correction type each session.' },

      { type: 'h2', content: 'Professional conclusion: what Week 25 should accomplish' },
      { type: 'p', content: 'By the end of this protocol, parents should see measurable recovery in decoding confidence, cleaner sentence control, and more organized speaking responses. Tiny Steps recommends carrying the same measurement habit into the next four weeks to protect gains during the school transition.' },

      { type: 'h3', content: 'Parent scripts (high-impact, low-pressure)' },
      { type: 'li', content: '"We are doing a short 10-minute reset, not a test."' },
      { type: 'li', content: '"Try slowly first; speed can come later."' },
      { type: 'li', content: '"You improved from yesterday on this exact skill."' },

      { type: 'h3', content: 'End-of-week checklist for families' },
      { type: 'li', content: 'Baseline and Day-7 recheck completed.' },
      { type: 'li', content: 'At least one measurable gain recorded (accuracy, fluency, or confidence).' },
      { type: 'li', content: 'Next two weekly targets documented and shared with teacher.' },
    ],
    faq: [
      {
        question: 'How long should we run this back-to-school reset before changing strategy?',
        answer: 'Run the protocol for 7 days, then review data. If there is no improvement after 2 consistent weeks, reduce difficulty and seek teacher guidance.',
      },
      {
        question: 'Should we prioritize fluency or comprehension first?',
        answer: 'Build both together. Keep decoding and fluency tasks short, then add two immediate comprehension checks so meaning is never delayed.',
      },
      {
        question: 'What is the minimum routine for very busy weekdays?',
        answer: 'Use a 10-minute minimum: 3 minutes phonics review, 4 minutes reading, 2 minutes comprehension, 1 minute praise and next-step note.',
      },
    ],
  },
  {
    slug: 'week-26-screen-smart-summer-routine',
    title: 'Week 26: Screen-Smart Summer Routine for Kids (Ages 3-12)',
    category: 'Parent Tips',
    author: 'Priya',
    date: '2026-03-23',
    readTime: '10 min',
    excerpt: 'A practical screen-smart summer routine for ages 3-12: reduce passive screen time, keep learning active in 10-minute blocks, and build reading, grammar, and speaking confidence without daily battles.',
    metaDescription: 'Screen-smart summer routine for kids ages 3-12: reduce passive screen time and use a 10-minute daily plan for phonics, reading, grammar, and speaking confidence.',
    body: [
      { type: 'h2', content: 'Quick answer for busy parents' },
      { type: 'p', content: 'If you want to reduce screen time for kids without daily arguments, do not ban screens suddenly. Replace one passive block with one short, repeatable learning block. A 10-minute routine works better than a long weekend reset.' },

      { type: 'h2', content: 'Why screen time rises in summer' },
      { type: 'p', content: 'Summer schedules are loose, parents are juggling work, and children need fast entertainment. Screens fill the gap quickly. The problem is not every screen minute, but long passive stretches that replace conversation, reading, and movement.' },

      { type: 'h2', content: 'The screen-smart rule that actually works' },
      { type: 'p', content: 'Use this sequence: Connect first, then a short learning block, then screen choice. Children cooperate more when they know what comes next and when the task is short.' },
      { type: 'li', content: 'Predictable timing: same 10-minute learning slot each day.' },
      { type: 'li', content: 'Clear trade: one short offline task before passive screen time.' },
      { type: 'li', content: 'Low pressure: stop on success, not after a struggle.' },

      { type: 'h2', content: 'Age-wise screen-smart guidance (3-12 years)' },
      { type: 'h3', content: 'Ages 3-5' },
      { type: 'li', content: 'Focus on sound play, picture talk, and movement-based phonics for 5-10 minutes.' },
      { type: 'li', content: 'Use short, supervised screen sessions and avoid background autoplay.' },
      { type: 'h3', content: 'Ages 6-8' },
      { type: 'li', content: 'Add simple reading plus one grammar sentence task before leisure screen time.' },
      { type: 'li', content: 'Use timers and one clear stop rule to avoid repeated negotiation.' },
      { type: 'h3', content: 'Ages 9-12' },
      { type: 'li', content: 'Use a daily reading and speaking checkpoint before social/video content.' },
      { type: 'li', content: 'Let children choose from 2-3 offline learning activities to increase ownership.' },

      { type: 'h2', content: 'The 10-minute summer routine (daily)' },
      { type: 'li', content: 'Minute 1-2: Quick phonics or vocabulary warm-up (sound cards or word family drill).' },
      { type: 'li', content: 'Minute 3-6: Read one short passage aloud and ask one meaning question.' },
      { type: 'li', content: 'Minute 7-8: One grammar-in-use task (fix one sentence or combine two lines).' },
      { type: 'li', content: 'Minute 9-10: 30-second speaking recap: "What did I learn today?"' },
      { type: 'p', content: 'This routine supports offline learning activities for kids while keeping the load realistic for working families.' },

      { type: 'h2', content: 'Six practical replacements for passive screen time' },
      { type: 'li', content: 'Phonics sound hunt: find 5 objects starting with a target sound.' },
      { type: 'li', content: 'Reading relay: parent reads one line, child reads one line.' },
      { type: 'li', content: 'Grammar fix card: spot and fix one sentence error.' },
      { type: 'li', content: 'Picture speaking challenge: describe one image in 3 clear lines.' },
      { type: 'li', content: 'Word-building game: make new words by swapping one sound.' },
      { type: 'li', content: 'Family mini show: 45-second talk at dinner on one topic.' },

      { type: 'h2', content: 'Mistakes parents should avoid' },
      { type: 'li', content: 'Do not remove all screens overnight; sudden restriction usually creates resistance.' },
      { type: 'li', content: 'Do not run 45-minute study blocks in summer; short consistency beats long sessions.' },
      { type: 'li', content: 'Do not use learning only as punishment for screen use; present it as routine, not penalty.' },
      { type: 'li', content: 'Do not change rules daily; consistency lowers conflict and decision fatigue.' },

      { type: 'h2', content: 'When to seek extra support' },
      { type: 'p', content: 'If your child avoids reading, melts down during short tasks, or shows no progress after 3-4 weeks of consistent routine, get guided support. A targeted plan often fixes the bottleneck faster than trying random worksheets.' },

      { type: 'h2', content: 'Tiny Steps summer support (next best step)' },
      { type: 'p', content: 'If you want a structured summer routine for kids with mentor guidance, start with /summer-camps. For focused skill support, use /phonics, /grammar, and /speaking. For parent-friendly home plans, use /parents.' },
    ],
    faq: [
      {
        question: 'How much screen time is okay in summer for children aged 3-12?',
        answer: 'The key is quality and structure. Keep passive screen blocks limited, supervise younger children closely, and protect at least one daily offline learning block.',
      },
      {
        question: 'How can I reduce screen time for children without arguments?',
        answer: 'Use a predictable sequence: short offline routine first, then screen choice. Keep the routine brief and consistent so children know what to expect.',
      },
      {
        question: 'What is the minimum routine on busy weekdays?',
        answer: 'Run a 10-minute flow: 2 minutes phonics or vocabulary, 4 minutes reading, 2 minutes grammar, 2 minutes speaking recap.',
      },
    ],
  },
  {
    slug: 'week-27-prevent-summer-slide-reading',
    title: 'Week 27: How to Prevent the Summer Slide in Reading (10-Minute Daily Plan)',
    category: 'Phonics',
    author: 'Priya',
    date: '2026-03-30',
    readTime: '10 min',
    excerpt: 'Prevent summer slide reading loss with a 10-minute daily routine for ages 3-12: phonics review, short reading, grammar transfer, and speaking recap that parents can run consistently.',
    metaDescription: 'How to prevent summer slide in reading: a 10-minute daily plan for ages 3-12 with phonics practice at home, short reading routines, and clear progress checkpoints.',
    body: [
      { type: 'h2', content: 'Quick answer for parents' },
      { type: 'p', content: 'Summer slide in reading is preventable when children read a little every day. A short 10-minute reading routine with phonics review is usually enough to maintain or improve reading confidence during April-June.' },

      { type: 'h2', content: 'What is the summer slide in reading?' },
      { type: 'p', content: 'Summer slide means children lose reading fluency, decoding accuracy, or writing confidence when practice drops for several weeks. The loss is usually in routine and retrieval, not intelligence.' },

      { type: 'h2', content: 'Why learning loss happens in summer' },
      { type: 'li', content: 'Reading becomes optional instead of daily.' },
      { type: 'li', content: 'Children do passive content instead of active decoding and speaking.' },
      { type: 'li', content: 'Parents use random worksheets instead of a consistent sequence.' },
      { type: 'li', content: 'There is no simple progress check, so gaps stay hidden.' },

      { type: 'h2', content: '10-minute daily reading plan (ages 3-12)' },
      { type: 'li', content: 'Minute 1-2: Phonics practice at home (sound review or blending pairs).' },
      { type: 'li', content: 'Minute 3-6: Read one short passage aloud (child first, parent support only when needed).' },
      { type: 'li', content: 'Minute 7-8: Meaning check (who/what/why question) plus one vocabulary word.' },
      { type: 'li', content: 'Minute 9-10: One sentence writing or speaking recap to lock in learning.' },
      { type: 'p', content: 'This summer reading plan for kids keeps decoding, comprehension, and expression connected in one compact routine.' },

      { type: 'h2', content: 'Age-wise targets parents can track' },
      { type: 'h3', content: 'Ages 3-5' },
      { type: 'li', content: 'Target: stronger sound awareness and oral blending of simple words.' },
      { type: 'h3', content: 'Ages 6-8' },
      { type: 'li', content: 'Target: smoother sentence reading with fewer decoding pauses.' },
      { type: 'h3', content: 'Ages 9-12' },
      { type: 'li', content: 'Target: better fluency plus clear summary speaking and cleaner sentence writing.' },

      { type: 'h2', content: 'Simple weekly rhythm for April-June' },
      { type: 'li', content: 'Monday: phonics refresh + short reading.' },
      { type: 'li', content: 'Tuesday: fluency reread + comprehension question.' },
      { type: 'li', content: 'Wednesday: grammar transfer inside one short paragraph.' },
      { type: 'li', content: 'Thursday: speaking recap (45-60 seconds) from reading topic.' },
      { type: 'li', content: 'Friday: mixed review and mini progress check.' },
      { type: 'li', content: 'Saturday: game-based revision (word sort, story card, or read-and-retell).' },
      { type: 'li', content: 'Sunday: light rest or one short read-aloud for continuity.' },

      { type: 'h2', content: 'Mistakes that make summer learning loss worse' },
      { type: 'li', content: 'Weekend-only study with no weekday reading touchpoint.' },
      { type: 'li', content: 'Books that are too hard, causing guessing and frustration.' },
      { type: 'li', content: 'Skipping phonics review and expecting fluency to hold automatically.' },
      { type: 'li', content: 'Tracking nothing, so parents cannot adjust in time.' },

      { type: 'h2', content: 'When to seek extra support' },
      { type: 'p', content: 'If your child avoids reading for two weeks, guesses many words, or cannot explain what they read despite daily practice, move to guided support. Early correction prevents a larger reset before school reopens.' },

      { type: 'h2', content: 'Tiny Steps CTA: get summer support early' },
      { type: 'p', content: 'For a structured summer plan, start at /summer-camps. If your child needs focused help, use /phonics for decoding, /grammar for writing accuracy, and /speaking for confidence. Parents can also follow step-by-step home guides at /parents.' },
    ],
    faq: [
      {
        question: 'How do I prevent learning loss in summer if my schedule is busy?',
        answer: 'Use one fixed 10-minute slot daily. Consistent short practice in phonics, reading, and recap is more effective than occasional long sessions.',
      },
      {
        question: 'What is a realistic summer reading routine for kids?',
        answer: 'A practical routine is 2 minutes phonics, 4 minutes reading aloud, 2 minutes comprehension, and 2 minutes recap through speaking or writing.',
      },
      {
        question: 'Should I focus on phonics or comprehension first during summer?',
        answer: 'Keep both connected. Start with short decoding review, then immediately check meaning so reading accuracy and understanding improve together.',
      },
    ],
  }
];

const DEFAULT_HERO_BY_CATEGORY: Record<BlogPost['category'], string> = {
  Phonics: '/blog/hero-phonics.jpg',
  Grammar: '/blog/hero-grammar.jpg',
  'Public Speaking': '/blog/hero-speaking.jpg',
  'Parent Tips': '/blog/hero-parent-tips.jpg',
  Research: '/blog/hero-research.jpg',
};

const WEEKLY_PARENT_GUIDE_BLOCKS: BlogBlock[] = [
  { type: 'h2', content: 'Parent guide: how to use this weekly plan in real life' },
  { type: 'p', content: 'Use this weekly post as a practical checklist, not a one-time read. Keep routines short, repeat the same target for 5-7 days, and track one visible win.' },
  { type: 'li', content: 'Choose one daily slot and keep it fixed (same time, same place).' },
  { type: 'li', content: 'Do 10-15 focused minutes only; stop while your child still feels successful.' },
  { type: 'li', content: 'Use one correction script: "Let us try slowly, then fast."' },
  { type: 'li', content: 'Send one weekly note to the teacher: what improved, what still needs support.' },
];

const WEEKLY_RESEARCH_BASIS_BLOCKS: BlogBlock[] = [
  { type: 'h2', content: 'Research basis: why this weekly plan works' },
  { type: 'p', content: 'This weekly structure reflects evidence-aligned classroom practice used in early literacy and communication instruction: explicit teaching, short retrieval cycles, and repeated guided practice with feedback.' },
  { type: 'li', content: 'Distributed practice beats cramming: short sessions across the week improve retention better than one long session.' },
  { type: 'li', content: 'Retrieval and correction loops build fluency: recall first, then immediate gentle correction, then one successful retry.' },
  { type: 'li', content: 'Clear success criteria improve motivation: children engage better when the goal is visible and achievable in one session.' },
];

const WEEKLY_TINY_STEPS_STANDARD_BLOCKS: BlogBlock[] = [
  { type: 'h2', content: 'Tiny Steps quality standard for this week' },
  { type: 'p', content: 'Every Tiny Steps weekly blog should give parents a usable routine, measurable progress signal, and practical fallback when the child gets stuck. Use this page as a field guide, not theory-only reading.' },
  { type: 'li', content: 'One concrete routine parents can run in 10-15 minutes.' },
  { type: 'li', content: 'One measurable checkpoint (accuracy, fluency, or confidence) by week-end.' },
  { type: 'li', content: 'One rescue strategy for low-motivation days so consistency does not break.' },
];

const WEEKLY_DEFAULT_FAQ: { question: string; answer: string }[] = [
  {
    question: 'How long should this weekly plan take each day?',
    answer: 'Keep it to 10-15 focused minutes. Consistency across 5-6 days is more effective than a single long session.',
  },
  {
    question: 'What if my child resists practice on school days?',
    answer: 'Use a 5-minute minimum routine and keep one easy success at the end. Resume the full 10-15 minute flow the next day.',
  },
  {
    question: 'How do I know if this week worked?',
    answer: 'Track one simple metric from Day 1 to Day 7: accuracy, fluency smoothness, or speaking confidence. Improvement on one metric is a valid week win.',
  },
];

const BLOG_CATEGORY_OVERRIDES: Partial<Record<string, BlogPost['category']>> = {
  'science-of-phonics-learning': 'Research',
};

type WeeklyPlaybook = {
  heading: string;
  context: string;
  routine: string[];
  rescue: string;
  outcomes: string[];
  parentQuestions: string[];
};

const WEEKLY_REAL_WORLD_PLAYBOOKS: Record<string, WeeklyPlaybook> = {
  'week-1-phonics-satpin-launch': {
    heading: 'Real-world action plan: SATPIN without overwhelm',
    context: 'Do not start with heavy worksheets. Start with clear sound production, oral blending, and short decodable lines children can actually read.',
    routine: [
      'Day 1-2: Teach s, a, t with pure sounds. Ask for sound in under 2 seconds using flash cards.',
      'Day 3-4: Add p, i, n and blend sat, pin, tap, tin with finger taps.',
      'Day 5-7: Read 4 tiny lines like "Sam sat." and "Pat taps." Keep each session to 10 minutes.',
    ],
    rescue: 'If your child says letter names instead of sounds, model once, ask for echo twice, then return to one simple blend. If frustration rises, switch to oral-only blending for 2 minutes.',
    outcomes: [
      'Child recalls all six SATPIN sounds quickly.',
      'Child blends at least five CVC words without picture guessing.',
      'Child reads one short decodable sentence with support.',
    ],
    parentQuestions: [
      'My child forgets sounds the next day. Start every session with a 90-second sound review before new words.',
      'My child mixes b and d. Delay these letters for now and return after sound confidence is stable.',
    ],
  },
  'week-2-phonics-blending-club': {
    heading: 'Real-world action plan: blending that works on school nights',
    context: 'Blending becomes automatic with short daily repetition. Use a fixed ladder from oral sounds to print to sentence.',
    routine: [
      'Start with 3 oral blends: /c/ /a/ /t/, /m/ /a/ /p/, /s/ /i/ /t/ before opening a book.',
      'Read a CVC ladder: sat -> sit -> sip -> tip -> tap and discuss the changed middle sound.',
      'Finish with one decodable line: "The cat sat." "I tap the map."',
    ],
    rescue: 'If your child guesses whole words, cover the word, reveal one sound at a time, and blend again slowly. Keep correction neutral and quick.',
    outcomes: [
      'Child blends 6-8 CVC words with less pausing.',
      'Child notices vowel changes between similar words.',
      'Child reads one short sentence by tracking each word left to right.',
    ],
    parentQuestions: [
      'How long should blending practice be? Ten focused minutes daily beats one long weekend session.',
      'Should I let my child skip hard words? No, help decode them once, then repeat for confidence.',
    ],
  },
  'week-3-phonics-tricky-words': {
    heading: 'Real-world action plan: teach tricky words without rote pressure',
    context: 'Use a "sound part + heart part" method so children understand what is decodable and what must be remembered.',
    routine: [
      'Pick 3 words only for the week: said, was, the. Circle the unusual letter part.',
      'Read each tricky word in a tiny sentence: "He said hi." "It was fun." "The dog ran."',
      'Play snap game with word cards for 2 minutes before bed.',
    ],
    rescue: 'If a tricky word keeps failing, reduce to one word for two days. Use tracing in sand or air writing, then read it in a sentence.',
    outcomes: [
      'Child reads 2-3 target tricky words automatically.',
      'Child can use at least one target word while reading a sentence.',
      'Child can spell one target tricky word from memory.',
    ],
    parentQuestions: [
      'How many tricky words per week? Usually 2-4 is enough for retention.',
      'Should I test spelling daily? No, test lightly twice a week and prioritize reading use.',
    ],
  },
  'week-4-phonics-long-vowels': {
    heading: 'Real-world action plan: long vowels with clear contrasts',
    context: 'Parents get faster results when children compare short and long vowel pairs directly instead of learning patterns in isolation.',
    routine: [
      'Use pair cards: cap/cape, pin/pine, tub/tube. Read short first, then long.',
      'Teach one pattern per day: a_e Monday, i_e Tuesday, o_e Wednesday, mixed review Thursday-Friday.',
      'Write one sentence per day using a long vowel word: "I ride the bike."',
    ],
    rescue: 'If child reads every vowel as short, exaggerate mouth shape and stretch the long sound once before blending the whole word.',
    outcomes: [
      'Child can read at least six long-vowel words with magic-e patterns.',
      'Child can explain that final e is silent but changes the vowel.',
      'Child can read mixed short and long vowel lines with fewer errors.',
    ],
    parentQuestions: [
      'Do I teach all long vowel patterns in one week? No, one pattern at a time is more realistic.',
      'My child says the final e. Remind: "Final e is quiet, vowel speaks."',
    ],
  },
  'week-5-phonics-r-controlled': {
    heading: 'Real-world action plan: bossy-r practice that sticks',
    context: 'R-controlled vowels are easier when grouped by sound families and revisited through sentence reading and dictation.',
    routine: [
      'Day 1-2: AR family (car, star, farm, park) with a 2-minute picture sort.',
      'Day 3-4: OR family (fork, corn, storm, short) in quick read-and-point games.',
      'Day 5-7: ER/IR/UR mixed set (her, bird, turn, fur) plus one dictation sentence daily.',
    ],
    rescue: 'If your child collapses all r-vowels into one sound, split practice by family and avoid mixed lists for two days.',
    outcomes: [
      'Child correctly sorts words into AR, OR, and ER/IR/UR groups.',
      'Child reads one sentence per r-controlled family.',
      'Child spells at least four r-controlled words correctly in dictation.',
    ],
    parentQuestions: [
      'Should I teach er/ir/ur separately first? Yes, but combine later because they sound similar.',
      'My child reads car as cah. Model slowly: /c/ /ar/ and repeat in short phrases.',
    ],
  },
  'week-6-phonics-comprehension': {
    heading: 'Real-world action plan: connect decoding to understanding',
    context: 'Children must decode and comprehend together. Keep text decodable but always ask one meaning question after each line.',
    routine: [
      'Read 4-6 decodable sentences and ask one who/what question after each.',
      'Use "retell in 10 words" challenge to keep recall simple.',
      'End with one sentence drawing: child draws and labels the key event.',
    ],
    rescue: 'If your child reads accurately but cannot answer, shorten text and ask questions immediately after each sentence, not at the end.',
    outcomes: [
      'Child answers who/what questions from short decodable text.',
      'Child gives a simple beginning-middle-end retell for a tiny passage.',
      'Child connects at least one decoded word to meaning in context.',
    ],
    parentQuestions: [
      'Should comprehension wait until fluent reading? No, comprehension starts from first decodable texts.',
      'What if my child answers in one word? Accept one word first, then model a full-sentence answer.',
    ],
  },
  'week-7-grammar-nouns-to-paragraphs': {
    heading: 'Real-world action plan: build grammar through sentence construction',
    context: 'Children need a visible ladder: naming word -> who + did what sentence -> one added detail -> sentence combining -> short paragraph. The routine works best when children say ideas first and write second.',
    routine: [
      'Day 1-2: Noun hunt plus verb charades, then build one who + did what sentence from a picture or daily-life scene.',
      'Day 3-4: Add where/when details and combine two short sentences with and, because, or so.',
      'Day 5-7: Use a 4-sentence frame: topic sentence, two details, closer. Draw first if writing still feels heavy.',
    ],
    rescue: 'If your child freezes when writing, switch to oral storytelling, scribe one sentence, and ask for one gentle fix only: capital, full stop, or a stronger verb.',
    outcomes: [
      'Child builds a clear who + did what sentence with less prompting.',
      'Child adds one useful detail without creating a run-on.',
      'Child writes 3-4 linked sentences on one topic and reads them aloud with confidence.',
    ],
    parentQuestions: [
      'Should grammar drills be separate from writing? No. Grammar transfers better when it is taught inside sentence building and short writing tasks.',
      'My child can speak but cannot write. What should I do? Start with oral rehearsal, scribe one line, then move into copying or writing the next sentence.',
    ],
  },
  'week-8-grammar-tenses': {
    heading: 'Real-world action plan: tense control using daily life',
    context: 'Tenses are easiest when anchored to yesterday, today, and tomorrow events from the childs routine.',
    routine: [
      'Use 3 sticky notes daily: Yesterday I played. Today I play. Tomorrow I will play.',
      'Practice 5 verb triples: eat/ate/will eat, go/went/will go, read/read/will read.',
      'Do a 60-second evening recap in all three time forms.',
    ],
    rescue: 'If your child mixes tense forms, reduce to one verb family at a time and repeat with gesture cues for past/present/future.',
    outcomes: [
      'Child chooses correct tense in short spoken and written lines.',
      'Child writes one three-sentence timeline (past, present, future).',
      'Child reduces random tense switching in paragraph tasks.',
    ],
    parentQuestions: [
      'Do irregular verbs need separate practice? Yes, keep a small weekly list and recycle often.',
      'Should I correct every tense error? Correct one pattern per day to avoid overload.',
    ],
  },
  'week-9-grammar-conjunctions': {
    heading: 'Real-world action plan: conjunctions for clearer ideas',
    context: 'Children overuse "and" unless parents explicitly model different conjunction jobs: addition, contrast, reason.',
    routine: [
      'Teach one connector per day with a hand signal: and (add), but (contrast), because (reason).',
      'Run "sentence combine" drills: merge two short lines into one better line.',
      'Do a dinner-table challenge: each person says one because sentence.',
    ],
    rescue: 'If sentences become very long and confusing, go back to two short sentences and combine only once.',
    outcomes: [
      'Child uses and, but, because correctly in separate examples.',
      'Child combines at least three sentence pairs without losing meaning.',
      'Child starts explaining reasons in writing, not just listing facts.',
    ],
    parentQuestions: [
      'Can I teach more connectors now? Add so and although only after and/but/because are stable.',
      'My child forgets punctuation in long lines. Add comma practice only after idea clarity improves.',
    ],
  },
  'week-10-grammar-subject-verb': {
    heading: 'Real-world action plan: fix subject-verb agreement errors',
    context: 'Agreement improves when children hear and compare pairs aloud: "He runs" versus "They run".',
    routine: [
      'Read pair cards daily: He runs/They run, She has/They have, It is/They are.',
      'Use action game: parent says subject, child says correct verb form while acting it.',
      'Write 5 short lines using mixed singular and plural subjects.',
    ],
    rescue: 'If errors persist, isolate one pattern per day (is/are or has/have) and postpone less common patterns.',
    outcomes: [
      'Child self-corrects common is/are and has/have mistakes.',
      'Child writes mixed singular/plural sentence sets accurately.',
      'Child reads own writing aloud and notices agreement issues.',
    ],
    parentQuestions: [
      'Should I teach grammar terms first? No, pattern practice comes before terminology.',
      'My child says correct form but writes wrong form. Add quick dictation after oral drills.',
    ],
  },
  'week-11-grammar-creative-writing': {
    heading: 'Real-world action plan: creative writing with support rails',
    context: 'Creativity grows faster when structure is provided. Use prompt + planning frame + short drafting window.',
    routine: [
      'Use one prompt card daily: who, where, problem, ending.',
      'Draft in 8 minutes with a four-sentence frame, then edit one target only.',
      'Read the piece aloud and ask the child to improve one line with a stronger verb.',
    ],
    rescue: 'If your child says "I have no idea," offer two prompt choices and start with oral storytelling before writing.',
    outcomes: [
      'Child writes a coherent 4-6 sentence mini story.',
      'Child adds at least one descriptive word and one dialogue or feeling line.',
      'Child can edit one clear target (capital, punctuation, or verb choice).',
    ],
    parentQuestions: [
      'Should spelling mistakes stop story flow? No, keep drafting and edit spelling later.',
      'How do I avoid perfection pressure? Time-box writing and celebrate idea quality first.',
    ],
  },
  'week-12-speaking-confidence-seeds': {
    heading: 'Real-world action plan: build speaking confidence through safe repetition',
    context: 'Speaking confidence grows when children practise short, predictable talk steps with one calm listener before they face a bigger audience.',
    routine: [
      'Run a 10-15 minute routine: warm-up, 15-60 second spotlight, one voice tool game, praise plus one retry.',
      'Use a bravery ladder: one word -> one sentence -> two sentences -> one trusted listener -> small group or voice note.',
      'Let multilingual children plan ideas in a home language first, then shape one English sentence together.',
    ],
    rescue: 'If your child avoids speaking, shrink the step first: whispering counts, audio-only is allowed, and one sentence is enough for a successful session.',
    outcomes: [
      'Child starts speaking faster and with less avoidance than on day one.',
      'Child can give one complete sentence or short retell with more calm.',
      'Child tolerates one gentle fix after speaking without shutting down.',
    ],
    parentQuestions: [
      'Do memorized speeches help beginners? Usually no. Structured prompts and retell practice are safer than heavy memorisation at the start.',
      'How many speaking sessions per week? Five or more short sessions are usually better than one long practice block.',
    ],
  },
  'week-13-speaking-structure': {
    heading: 'Real-world action plan: teach hook-body-close structure',
    context: 'Children sound confident when they know where to start, what to say next, and how to end.',
    routine: [
      'Use 3-card format: hook, two body points, close.',
      'Practice one-minute talks on familiar topics using this structure daily.',
      'Record once, replay once, and ask child to self-rate clarity from 1 to 3.',
    ],
    rescue: 'If speech feels robotic, keep the structure but allow free wording instead of memorized sentences.',
    outcomes: [
      'Child uses opening, body, and closing in order.',
      'Child includes two relevant supporting details.',
      'Child ends with a complete closing line instead of trailing off.',
    ],
    parentQuestions: [
      'Should I give full scripts? Give bullet points only, then let child phrase naturally.',
      'My child rushes through the speech. Add pause marks between sections during rehearsal.',
    ],
  },
  'week-14-speaking-visual-aids': {
    heading: 'Real-world action plan: visual aids that support speech',
    context: 'Visuals should clarify one key idea, not distract. One prop or one slide is enough for beginners.',
    routine: [
      'Pick one object per talk (book, toy, chart) and explain why it matters.',
      'Use "show, explain, connect" pattern: show item, explain detail, connect to message.',
      'Practice pointing and looking back at audience, not only at the visual.',
    ],
    rescue: 'If child depends on the prop too much, hide it for final 15 seconds and ask for verbal summary.',
    outcomes: [
      'Child uses one visual aid naturally during a short talk.',
      'Child maintains audience eye contact between visual references.',
      'Child explains the visual in clear, complete sentences.',
    ],
    parentQuestions: [
      'Do slides help younger kids? Usually a physical object works better than slides for early speakers.',
      'What if visual fails online? Teach a backup no-visual version of the same talk.',
    ],
  },
  'week-15-speaking-debate-starters': {
    heading: 'Real-world action plan: beginner debate without argument stress',
    context: 'Debate skills start with respectful disagreement and simple evidence, not competitive pressure.',
    routine: [
      'Use one child-friendly motion daily: homework time, screen limits, uniforms.',
      'Teach CER mini-frame: claim, reason, example in 45-60 seconds.',
      'Run role-swap rounds where child argues both sides once.',
    ],
    rescue: 'If debates become emotional, pause and switch to sentence stems: "I think... because..." and "I understand... but..."',
    outcomes: [
      'Child states a clear position in one sentence.',
      'Child supports opinion with at least one reason and example.',
      'Child listens and responds politely to a different view.',
    ],
    parentQuestions: [
      'Should I correct content opinions? Focus on reasoning quality and tone, not agreement.',
      'My child repeats one point. Ask for one new reason before ending the round.',
    ],
  },
  'week-16-phonics-summer-plan': {
    heading: 'Real-world action plan: summer phonics without learning loss',
    context: 'A light, repeatable summer routine protects reading accuracy and confidence better than irregular intensive sessions.',
    routine: [
      'Follow 4-day cycle: sound review, blending, decodable reading, spelling dictation.',
      'Use travel-friendly materials: 20 word cards, one notebook, one timer.',
      'Keep a weekly scorecard: words read correctly, words spelled correctly, confidence level.',
    ],
    rescue: 'If routine breaks during travel, run a 5-minute oral-only session in car or at bedtime and resume full practice next day.',
    outcomes: [
      'Child maintains reading level across holiday weeks.',
      'Child retains core phonics patterns already taught.',
      'Parent can identify exactly which pattern needs revision after breaks.',
    ],
    parentQuestions: [
      'Can I skip practice on vacation? Skip occasionally, but keep at least 4 sessions per week.',
      'What is minimum summer workload? Ten minutes daily or 40-50 minutes spread across the week.',
    ],
  },
  'week-17-grammar-assessment': {
    heading: 'Real-world action plan: low-stress grammar assessment at home',
    context: 'Assessment should guide next teaching steps, not label the child. Keep checks short and skill-specific.',
    routine: [
      'Run three 5-minute checks: sentence correction, tense usage, and punctuation application.',
      'Mark with a simple rubric: green (secure), amber (needs practice), red (reteach).',
      'Choose only two amber/red targets for next week to avoid overload.',
    ],
    rescue: 'If child gets anxious, call it a "checkpoint game," allow oral answers first, then convert to writing.',
    outcomes: [
      'Parent gets a clear map of strengths and gaps.',
      'Child understands one to two priority targets for next week.',
      'Practice plan is based on evidence, not guesswork.',
    ],
    parentQuestions: [
      'How often should I assess? Light weekly checks and a deeper check once every 4 weeks.',
      'Should I compare siblings? No, compare each child to their own previous baseline.',
    ],
  },
  'week-18-speaking-video-feedback': {
    heading: 'Real-world action plan: use video feedback without pressure',
    context: 'Short recordings help children notice posture, voice, and pacing quickly when feedback stays specific and kind.',
    routine: [
      'Record 30-60 second talks on phone using one topic and one retake max.',
      'Review with a 3-point checklist: voice clear, eye contact, full ending line.',
      'Set one improvement target per recording and re-record after 24 hours.',
    ],
    rescue: 'If child dislikes seeing themselves on video, play audio first, discuss positives, then show only first 10 seconds.',
    outcomes: [
      'Child identifies one personal speaking strength independently.',
      'Child improves one measurable speaking behavior across two recordings.',
      'Parent feedback becomes specific instead of general praise.',
    ],
    parentQuestions: [
      'How many recordings per week? Two or three are enough for progress.',
      'Should mistakes be edited out? No, raw recordings are useful for authentic self-review.',
    ],
  },
  'week-19-phonics-multisyllabic': {
    heading: 'Real-world action plan: multisyllabic decoding step by step',
    context: 'Long-word reading improves when children learn syllable chunking and stress patterns before speed.',
    routine: [
      'Teach clap-and-chunk with words like sunset, rabbit, picnic, market.',
      'Mark syllable splits visually and blend chunks: sun-set, pic-nic, mar-ket.',
      'Add one 2-3 syllable word to each decodable reading session.',
    ],
    rescue: 'If child guesses long words, cover ending, decode first chunk, then reveal next chunk and blend.',
    outcomes: [
      'Child decodes familiar two-syllable words without panic.',
      'Child uses chunking strategy independently on new words.',
      'Child reads short passages with fewer breakdowns on longer words.',
    ],
    parentQuestions: [
      'Should I teach syllable rules all at once? No, start with closed syllables and compound words first.',
      'My child reads chunks but misses meaning. Ask for quick meaning check after decoding.',
    ],
  },
  'week-20-grammar-editing-camp': {
    heading: 'Real-world action plan: editing skills children can transfer to school writing',
    context: 'Editing should be a routine skill. Use one clear checklist so children know what to scan first.',
    routine: [
      'Use COPS order daily: Capitals, Organization, Punctuation, Spelling.',
      'Edit one short paragraph together with colored pens for each error type.',
      'Have child do final read-aloud to catch missing words or awkward phrasing.',
    ],
    rescue: 'If editing feels overwhelming, cut paragraph length in half and fix only one category per pass.',
    outcomes: [
      'Child independently checks capitals and full stops first.',
      'Child can find and fix at least three errors in a short paragraph.',
      'Child begins submitting cleaner writing at school.',
    ],
    parentQuestions: [
      'Is editing before drafting okay? No, draft first, edit second for smoother writing flow.',
      'How do I stop over-correction? Limit parent corrections to one teachable pattern each day.',
    ],
  },
  'week-21-speaking-competition-prep': {
    heading: 'Real-world action plan: competition prep with calm confidence',
    context: 'Competition success comes from stable routines: script clarity, timed rehearsal, and confidence management.',
    routine: [
      'Break speech into sections and rehearse with timer in 45-second chunks.',
      'Practice stage entry, pause, and opening line separately every day.',
      'Run two mock rounds with family judging on clarity, structure, and confidence.',
    ],
    rescue: 'If performance anxiety spikes, shorten speech by 20 percent, add breathing reset, and prioritize clean delivery over complexity.',
    outcomes: [
      'Child delivers full speech within time limit.',
      'Child uses planned pauses and clear transitions.',
      'Child handles one unexpected interruption and restarts calmly.',
    ],
    parentQuestions: [
      'Should child memorize word for word? Use cue cards and section memory to reduce blanking risk.',
      'How close to event should rehearsals stop? Do light rehearsal day before, no heavy drilling.',
    ],
  },
  'week-22-phonics-diagnostics': {
    heading: 'Real-world action plan: diagnostics that lead to targeted fixes',
    context: 'Diagnostics are useful only when they produce a specific reteach plan with measurable goals.',
    routine: [
      'Check 5 domains: sound recall, blending, decoding, spelling, and connected reading.',
      'Log error patterns by type, such as vowel confusion or skipped blends.',
      'Create 7-day reteach plan focused on top two error patterns only.',
    ],
    rescue: 'If too many gaps appear, start with foundation errors first because advanced errors usually improve after base repair.',
    outcomes: [
      'Parent can name exact weak patterns, not just "reading is weak."',
      'Child receives focused reteach tasks matched to real errors.',
      'Progress can be rechecked after one week with clear metrics.',
    ],
    parentQuestions: [
      'Should diagnostics be timed? Start untimed, then add light timing only after accuracy stabilizes.',
      'Can I diagnose through homework only? No, include oral reading to catch hidden decoding issues.',
    ],
  },
  'week-23-grammar-speaking-bridge': {
    heading: 'Real-world action plan: turn grammar knowledge into spoken fluency',
    context: 'Children often know grammar in notebooks but not in speech. Bridge tasks make grammar usable in conversation.',
    routine: [
      'Take one written sentence and ask child to say it three ways: simple, expanded, and with reason.',
      'Use daily retell task where child must include target grammar pattern.',
      'Record a 45-second explanation and check for grammar target usage.',
    ],
    rescue: 'If spoken grammar collapses under pressure, reduce speaking length and focus on one target form per talk.',
    outcomes: [
      'Child applies grammar targets during spontaneous speaking.',
      'Child produces cleaner sentence forms in both speech and writing.',
      'Parent sees transfer from worksheet accuracy to real communication.',
    ],
    parentQuestions: [
      'Should spoken errors be corrected immediately? Correct after child finishes to preserve confidence.',
      'How do I make transfer visible? Track one grammar target across writing and speaking samples weekly.',
    ],
  },
  'week-24-speaking-family-showcase': {
    heading: 'Real-world action plan: family showcase that feels safe and joyful',
    context: 'A predictable showcase routine helps children practice speaking for real audiences without fear.',
    routine: [
      'Plan 2-minute performances with one fixed order and one timekeeper.',
      'Rehearse opening and closing lines on two separate days before event night.',
      'After each child, give one specific appreciation and one optional next step.',
    ],
    rescue: 'If a child refuses to perform, allow partner speaking with parent first, then invite solo attempt later.',
    outcomes: [
      'Child completes a short presentation for family audience.',
      'Child experiences speaking as celebration, not correction.',
      'Parent establishes monthly showcase rhythm with minimal setup.',
    ],
    parentQuestions: [
      'Should guests give corrections? No, showcase night is for encouragement; coaching comes next day.',
      'What if siblings compete for attention? Set clear turns and praise different strengths per child.',
    ],
  },
  'week-25-back-to-school-plan': {
    heading: 'Research-backed action plan: sustainable back-to-school reset',
    context: 'The target is measurable recovery, not cramming. Use short, consistent routines with visible metrics across phonics, grammar, and speaking.',
    routine: [
      'Run a 3-track week: decoding/reading, grammar/writing, and speaking; rotate these predictably across days.',
      'Keep each session to 10-15 minutes, and record one data point (accuracy or confidence) per session.',
      'Use end-of-week comparison to Day 0 baseline before increasing difficulty.',
    ],
    rescue: 'If routines break due to school load, use 5-minute minimum sessions for 3 days, then return to full routine with the same baseline target.',
    outcomes: [
      'Child restarts school with stronger decoding confidence and lower task resistance.',
      'Parent has a repeatable, low-friction routine that fits weekday constraints.',
      'Teacher communication becomes evidence-based with clear progress notes.',
    ],
    parentQuestions: [
      'Should I push harder in Week 1? No. Keep challenge moderate and prioritize consistency.',
      'How do I verify progress? Compare Day 0 and Day 7 data on accuracy, fluency smoothness, and speaking organization.',
    ],
  },
  'week-26-screen-smart-summer-routine': {
    heading: 'Real-world action plan: reduce passive screens with a predictable summer rhythm',
    context: 'Parents get better cooperation when learning comes in short fixed blocks, followed by planned leisure screen time.',
    routine: [
      'Set one fixed 10-minute slot daily before passive screen use.',
      'Run a simple flow: phonics warm-up, short reading, one grammar task, one speaking recap.',
      'Use a visible tracker for 5 days each week and celebrate consistency, not perfection.',
    ],
    rescue: 'If resistance is high, cut to a 5-minute minimum for two days, then return to the full 10-minute flow once cooperation improves.',
    outcomes: [
      'Child transitions to screen time with fewer daily arguments.',
      'Child maintains reading and language practice during summer break.',
      'Parent follows a repeatable routine without decision fatigue.',
    ],
    parentQuestions: [
      'Should I ban all screens to reset habits? No, replace passive time gradually with structured active blocks.',
      'What if both parents are busy? Keep one non-negotiable 10-minute learning touchpoint and protect it daily.',
    ],
  },
  'week-27-prevent-summer-slide-reading': {
    heading: 'Real-world action plan: stop summer slide with a 10-minute reading loop',
    context: 'Children hold reading gains when decoding and comprehension are revisited in short, consistent daily sessions.',
    routine: [
      'Do 2 minutes of phonics or word-pattern review before reading.',
      'Read one short passage aloud and ask one meaning question immediately.',
      'Close with a one-sentence write or 30-second spoken summary to reinforce transfer.',
    ],
    rescue: 'If reading breaks down, reduce text level, reread easier lines for success, and rebuild difficulty gradually over 3-4 days.',
    outcomes: [
      'Child maintains reading fluency through April-June.',
      'Child shows stronger decoding confidence on unfamiliar words.',
      'Parent can spot progress early with a simple weekly check.',
    ],
    parentQuestions: [
      'Is 10 minutes really enough? Yes, when done daily with a clear structure.',
      'Should we do only reading in summer? No, include brief grammar and speaking transfer for stronger retention.',
    ],
  },
};

function buildWeeklyPlaybookBlocks(playbook: WeeklyPlaybook): BlogBlock[] {
  const routineBlocks = playbook.routine.map((content): BlogBlock => ({ type: 'li', content }));
  const outcomeBlocks = playbook.outcomes.map((content): BlogBlock => ({ type: 'li', content }));
  const questionBlocks = playbook.parentQuestions.map((content): BlogBlock => ({ type: 'li', content }));
  return [
    { type: 'h2', content: playbook.heading },
    { type: 'p', content: playbook.context },
    { type: 'h3', content: '10-minute at-home routine (realistic for busy parents)' },
    ...routineBlocks,
    { type: 'h3', content: 'If your child gets stuck' },
    { type: 'p', content: playbook.rescue },
    { type: 'h3', content: 'End-of-week success signs' },
    ...outcomeBlocks,
    { type: 'h3', content: 'Parents also ask this week' },
    ...questionBlocks,
  ];
}

function enrichWeekPost(post: BlogPost): BlogPost {
  if (!/^week-\d+-/.test(post.slug)) return post;
  let body = post.body;
  const hasGuide = body.some((b) => b.type === 'h2' && b.content === 'Parent guide: how to use this weekly plan in real life');
  if (!hasGuide) {
    body = [...body, ...WEEKLY_PARENT_GUIDE_BLOCKS];
  }

  const hasResearchBasis = body.some((b) => b.type === 'h2' && b.content === 'Research basis: why this weekly plan works');
  if (!hasResearchBasis) {
    body = [...body, ...WEEKLY_RESEARCH_BASIS_BLOCKS];
  }

  const hasTinyStepsStandard = body.some((b) => b.type === 'h2' && b.content === 'Tiny Steps quality standard for this week');
  if (!hasTinyStepsStandard) {
    body = [...body, ...WEEKLY_TINY_STEPS_STANDARD_BLOCKS];
  }

  const playbook = WEEKLY_REAL_WORLD_PLAYBOOKS[post.slug];
  if (playbook) {
    const playbookBlocks = buildWeeklyPlaybookBlocks(playbook);
    const playbookHeading = playbookBlocks.find((b) => b.type === 'h2')?.content;
    const hasPlaybook = !!playbookHeading && body.some((b) => b.type === 'h2' && b.content === playbookHeading);
    if (!hasPlaybook) {
      body = [...body, ...playbookBlocks];
    }
  }

  return {
    ...post,
    faq: post.faq?.length ? post.faq : WEEKLY_DEFAULT_FAQ,
    body,
  };
}

const normalizedBlogPosts: BlogPost[] = rawBlogPosts.map((p) => ({
  ...enrichWeekPost(p),
  category: BLOG_CATEGORY_OVERRIDES[p.slug] ?? p.category,
  date: BLOG_PUBLICATION_DATES[p.slug] ?? p.date,
}));

const customBlogSurfacePosts: BlogPost[] = [
  {
    slug: 'phonics-for-parents-guide',
    title: 'Phonics for Parents: What It Is, Why It Matters, and How to Teach It at Home',
    category: 'Research',
    author: 'Tiny Steps Research Desk',
    date: '2026-04-03',
    readTime: '12 min read',
    hero: '/blog/hero-research.jpg',
    metaDescription:
      'A practical, evidence-backed phonics guide for parents: what phonics is, why phonics is important, how to teach phonics at home, and how multilingual families can support reading without pressure.',
    excerpt:
      'A calm, research-backed guide for parents searching what phonics is, why it matters, and how to teach phonics at home in 10 minutes a day.',
    body: [
      { type: 'h2', content: 'What this guide covers' },
      {
        type: 'p',
        content:
          'This editorial research guide explains what phonics is, why systematic phonics helps, why children often struggle, and what parents can realistically do at home.',
      },
      {
        type: 'p',
        content:
          'It also includes multilingual-home guidance, a 10-minute daily routine, myth-busting, a class-quality checklist, parent FAQ, and a citation appendix.',
      },
    ],
    faq: [
      {
        question: 'Can I teach phonics at home?',
        answer:
          'Yes. A short daily routine built around sound play, blending, decodable reading, and simple dictation can reinforce learning without replacing live teaching.',
      },
      {
        question: 'Is phonics useful in multilingual homes?',
        answer:
          'Yes for decoding. Children may still need extra oral language and vocabulary support for comprehension, especially in English as an additional language.',
      },
      {
        question: 'What should I look for in a phonics class?',
        answer:
          'Look for a clear sequence, explicit blending and segmenting, decodable text practice, predictable routines, and comprehension support alongside decoding.',
      },
    ],
    popularScore: 100,
  },
];

export const blogPosts: BlogPost[] = [...customBlogSurfacePosts, ...normalizedBlogPosts]
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .map((p) => ({
    ...p,
    hero: p.hero ?? DEFAULT_HERO_BY_CATEGORY[p.category],
  }));

// --- DEV-only excerpt length checker (keeps blog cards clean) ---
const EXCERPT_MIN = 120; // adjust if your UI needs tighter/longer
const EXCERPT_MAX = 200;

function normalizeExcerpt(s: string) {
  return s.replace(/\s+/g, ' ').trim();
}

function checkBlogExcerpts(posts: BlogPost[]) {
  const rows = posts.map((p) => {
    const norm = normalizeExcerpt(p.excerpt);
    const len = norm.length;
    const ok = len >= EXCERPT_MIN && len <= EXCERPT_MAX;
    const changed = norm !== p.excerpt;

    return { ok, len, changed, slug: p.slug, title: p.title };
  });

  const bad = rows.filter((r) => !r.ok || r.changed);

  // Pretty console table in dev tools / terminal logs
   
  console.table(
    rows.map((r) => ({
      ok: r.ok ? '✅' : '❌',
      len: r.len,
      changed: r.changed ? '⚠️ trim' : '',
      slug: r.slug,
      title: r.title,
    }))
  );

  if (bad.length) {
     
    console.warn(
      `[blog] ${bad.length} excerpt(s) need attention. Target ${EXCERPT_MIN}–${EXCERPT_MAX} chars (after trimming).`
    );
  }
}

// Run only in dev (avoid noisy logs in production builds)
if (import.meta?.env?.DEV) {
  checkBlogExcerpts([...rawBlogPosts, ...customBlogSurfacePosts]);
}
