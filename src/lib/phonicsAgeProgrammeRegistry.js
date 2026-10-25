// Explicit, editorially approved Phonics age pages. No arbitrary age URL generation.
// This is a commercial-support family, separate from the 31 Phonics topic resources.
const approvedPages = [
  {
    age: 4,
    path: '/phonics/age-4',
    title: 'Online Phonics Classes for 4-Year-Olds | Tiny Steps',
    description: 'Explore age-appropriate online phonics for 4-year-olds: sound listening, playful letter-sound links, early blending readiness and live 1:1 assessment.',
    heading: 'Online Phonics Classes for 4-Year-Olds',
    introduction: 'At four, phonics is not a race to finish a list of letter sounds. Some children are learning to notice speech sounds; others are ready to connect familiar sounds to letters and try blending. The right next step depends on the child.',
    directAnswer: 'Good phonics support for a four-year-old starts with enjoyable sound awareness, checks which sound–letter links are secure, and introduces oral or printed-word blending only when the child is ready.',
    parentQuestions: [
      'My child can recite the alphabet but cannot identify the sounds in simple words.',
      'My child enjoys letters but gets frustrated when asked to read too soon.',
      'I want playful, individual support rather than memorising phonics worksheets.',
    ],
    assessmentFocus: [
      'Can the child hear or recognise the starting sound in familiar spoken words?',
      'Which letter–sound links are familiar without prompts?',
      'Can the child blend two or three spoken sounds with modelling, or is more listening practice needed?',
    ],
    classApproach: [
      { title: 'Listen and notice', detail: 'The teacher uses familiar objects and spoken words to help the child listen for a sound without relying on alphabet-name recitation.' },
      { title: 'Connect sounds with print', detail: 'A small set of useful letter–sound links is introduced with visual and verbal feedback rather than a long list of sounds.' },
      { title: 'Try blending when ready', detail: 'Oral blending precedes simple printed words where appropriate; the teacher slows down or steps back when sound awareness is not yet stable.' },
    ],
    activityHeading: 'A short sound-hunt example',
    activityExample: 'Say “moon”, “map” and “sun” clearly. Invite your child to spot which two words begin with the same sound. Ask them to explain what they heard. If this is difficult, model one pair and try again without testing a large list.',
    progressSigns: [
      'Recognises a familiar starting sound with less prompting.',
      'Associates a small set of letters with sounds in new examples.',
      'Participates confidently in short oral-blending games when ready.',
    ],
    homeGuidance: 'Play with sounds in real words for a few minutes rather than drilling letter cards. Stop if the child loses interest, and share persistent confusion with the teacher so the next lesson can be adapted.',
    courseLabel: 'Explore Phonics Foundations',
    coursePath: '/courses/phonics-foundation',
    broaderAgePath: '/english-classes-for-4-year-old',
    broaderAgeLabel: 'English learning at age four',
    faqs: [
      { question: 'Does a four-year-old need to read words already?', answer: 'No fixed reading milestone applies to every four-year-old. The teacher checks listening, sound awareness and letter–sound readiness, then introduces decoding when the necessary foundations are secure.' },
      { question: 'What if my child knows letter names but not sounds?', answer: 'Letter-name recitation and sound recognition are different skills. We check the sound the child can hear and associate with print, then practise a manageable set through meaningful examples.' },
      { question: 'Are classes adjusted for attention and confidence?', answer: 'Tiny Steps uses live 1:1 teaching and assessment-led placement. The teacher can vary the activity length, prompting and sound practice according to the child’s responses.' },
    ],
  },
  {
    age: 5,
    path: '/phonics/age-5',
    title: 'Online Phonics Classes for 5-Year-Olds | Tiny Steps',
    description: 'Live 1:1 online phonics support for 5-year-olds who know sounds but struggle to blend, decode CVC words or move from letters to reading.',
    heading: 'Online Phonics Classes for 5-Year-Olds',
    introduction: 'A five-year-old may name letters correctly yet struggle to read “map” without guessing. Knowing sounds and combining them into a whole word are different skills. We look at the exact point where decoding breaks down before choosing practice.',
    directAnswer: 'For a five-year-old who knows letter sounds but cannot read words, phonics lessons should check sound recall, oral blending and left-to-right blending of printed letters, then use fresh simple words to confirm learning.',
    parentQuestions: [
      'My child says /m/, /a/, /p/ separately but cannot blend them into “map”.',
      'My child guesses a word from the picture or first letter instead of reading all its sounds.',
      'My child reads a practised word but struggles with a new word using the same pattern.',
    ],
    assessmentFocus: [
      'Can the child give the sound of a printed letter without relying on its name?',
      'Can the child blend spoken sounds orally before looking at the letters?',
      'When reading a simple printed word, does the child track each sound left to right or guess?',
      'Can the child apply a taught pattern to an unfamiliar decodable word?',
    ],
    classApproach: [
      { title: 'Locate the blending bottleneck', detail: 'The teacher distinguishes inconsistent sound recall from difficulty joining spoken sounds or decoding printed letters.' },
      { title: 'Model connected blending', detail: 'Using appropriate continuous sounds and simple words, the teacher demonstrates smooth sound-to-word blending and guides a new attempt.' },
      { title: 'Check fresh-word transfer', detail: 'The child tries an unfamiliar, suitable CVC word to show whether the strategy transfers beyond a memorised example.' },
    ],
    activityHeading: 'A blending example parents can observe',
    activityExample: 'If /m/, /a/ and /p/ are known, ask the child to say the sounds in “map” in order and join them smoothly. Try a fresh word such as “mat” only when its letters are known. Observe whether the child blends or guesses; do not demand faster reading.',
    progressSigns: [
      'Blends appropriate CVC words with decreasing adult prompting.',
      'Tracks print left to right instead of guessing from pictures.',
      'Applies a recently learnt sound pattern to new decodable words.',
    ],
    homeGuidance: 'Practise two or three decodable words that use sounds your child already knows. Praise careful sound-by-sound attempts, avoid asking the child to guess from pictures, and tell the teacher where blending stops.',
    courseLabel: 'Explore Early Phonics',
    coursePath: '/courses/phonics-brush-up',
    broaderAgePath: '/english-classes-for-5-year-old',
    broaderAgeLabel: 'English learning at age five',
    faqs: [
      { question: 'My five-year-old knows letter sounds but cannot blend. What next?', answer: 'First check oral blending and stable letter–sound recall. If those foundations are secure, model how sounds join in simple words and assess the same approach on fresh decodable examples.' },
      { question: 'Should my child memorise more sight words to read?', answer: 'Memorising additional whole words does not resolve a missing blending routine. Explicit decoding practice should continue, alongside appropriate teaching of common irregular words.' },
      { question: 'How quickly should blending improve?', answer: 'There is no universal number of classes. We look for accuracy, independence, retention and successful reading of new words at the child’s assessed level.' },
    ],
  },
];

export const PHONICS_AGE_PROGRAMME_PAGES = Object.freeze(
  approvedPages.map((page) => Object.freeze(page))
);
export const PHONICS_AGE_PROGRAMME_PATHS = Object.freeze(
  PHONICS_AGE_PROGRAMME_PAGES.map((page) => page.path)
);
export const PHONICS_AGE_PROGRAMME_SEO = Object.freeze(
  Object.fromEntries(PHONICS_AGE_PROGRAMME_PAGES.map((page) => [page.path, {
    title: page.title,
    description: page.description,
    canonicalPath: page.path,
    robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
    ogType: 'website',
  }]))
);

for (const page of PHONICS_AGE_PROGRAMME_PAGES) {
  if (!/^\/phonics\/age-[45]$/.test(page.path) || page.age !== Number(page.path.at(-1))) {
    throw new Error('Unapproved Phonics age URL in publication registry');
  }
  if (!page.title || !page.description || !page.heading || page.faqs.length < 3 ||
      page.assessmentFocus.length < 3 || page.classApproach.length < 3 ||
      page.progressSigns.length < 3) {
    throw new Error(`Incomplete editorial contract for ${page.path}`);
  }
}
if (PHONICS_AGE_PROGRAMME_PATHS.length !== 2 || new Set(PHONICS_AGE_PROGRAMME_PATHS).size !== 2) {
  throw new Error('Phonics age pilot must contain two unique approved pages');
}

export function getPublishedPhonicsAgeProgramme(age) {
  return PHONICS_AGE_PROGRAMME_PAGES.find((page) => page.age === Number(age)) ?? null;
}
