import type { BlogBlock, BlogPost, PhonicsSeoPost } from '../types';
import { BLOG_PUBLICATION_DATES } from './defaults';

const PHONICS_BASE_FAQ = [{
  question: 'How often should parents do phonics at home?',
  answer: 'Aim for 10 minutes a day, 5-6 days a week. Short daily practice gives better results than one long weekend session.'
}, {
  question: 'What should I do if my child refuses phonics practice?',
  answer: 'Shrink the task to 2-3 minutes, switch to a game, and end with one success. Consistency with low pressure works better than forcing long sessions.'
}, {
  question: 'When should I seek extra support?',
  answer: 'If your child has regular practice for 6-8 weeks but still cannot match basic sounds or blend simple CVC words, get an assessment from a phonics specialist.'
}];

const PHONICS_BASE_CLASS_CHECKLIST = ['The program is systematic: sounds -> blending -> decodable reading -> spelling.', 'Children read decodable text based on taught sounds, not picture guessing.', 'Parents get weekly progress updates with clear home-practice goals.'];

const PHONICS_BASE_MISTAKES = ['Do not switch methods every week; children need repeated routines to build automaticity.', 'Do not rely only on worksheets; children need oral sound work and reading aloud.', 'Do not over-correct every error; model once, retry, and praise effort quickly.'];

const PHONICS_EXAMPLES_BY_SLUG: Record<string, string[]> = {
  'best-online-phonics-classes-for-kids': ['Trial-class prompt: "Please teach one new sound, one blending word list, and one decodable sentence in 10 minutes so I can observe correction quality."', 'Parent observation sheet: note if teacher models pure sounds, checks blending left-to-right, and gives immediate specific feedback.', 'Ask for week-1 output sample: "After 3 classes, what exact words/sentences should my child read independently?"', 'Look for cumulative review: lesson includes 2 old sounds + 1 new sound before introducing fresh words.', 'Quality indicator: child retries after correction and succeeds within 1-2 attempts (not repeated guessing).', 'Home follow-up: practice the same class sound set for 8-10 minutes instead of adding random app activities.'],
  'online-phonics-classes-vs-school': ['Use a bridge notebook: copy school dictation errors, then practise those same patterns in online sessions.', 'Weekly sync routine: school teaches short-a words; online class reinforces short-a blending and spelling with decodable lines.', 'Error clustering: group mistakes by sound pattern (for example /i/ vs /e/) instead of correcting word-by-word randomly.', '10-minute hybrid practice: 5 minutes school review + 5 minutes targeted online reinforcement.', 'Parent-teacher message template: "This week’s school gap is consonant blends. Please focus on bl, cl, st with sentence reading."', 'Progress check after 3 weeks: fewer repeated school dictation errors in the same phonics pattern.'],
  'how-long-does-phonics-take': ['Phase 1 (weeks 1-6): sound recall and oral blending become faster with daily short practice.', 'Phase 2 (weeks 7-16): children decode CVC and early digraph words more independently.', 'Phase 3 (months 4-9): accuracy improves in short decodable passages and spelling starts stabilizing.', 'Phase 4 (months 9-18): fluency, multisyllable decoding, and transfer into school writing become more consistent.', 'Simple tracker: record sounds mastered, words decoded, and sentence accuracy once per week.', 'Plateau response: hold new content for 5-7 days and increase mixed review before pushing ahead.'],
  'satpin-phonics-guide': ['SATPIN blending ladder: /s/ /a/ /t/ -> sat, /p/ /i/ /n/ -> pin, /t/ /a/ /p/ -> tap.', 'Day-wise mini list: Day 1 (sat, pat), Day 2 (tap, pin), Day 3 (tin, nip), Day 4 review all six.', 'Quick oral prompts: "What sound does s make?" "Can you tap /s/ /a/ /t/?" "Now say it fast."', 'Write-read loop: child writes sat, parent points and child reads sat in a sentence: "Pat sat."', 'Trouble-shoot pair: if child says letter name ("ess"), immediately model pure sound /s/ and repeat twice.', 'Two-minute game: place s/a/t cards on floor, child hops each sound then says sat.'],
  'cvc-words-explained-for-parents': ['Short-a examples: cat, mat, bat, jam, cap. Read each word, then ask child to spot the middle sound /a/.', 'Short-i examples: pin, tin, lip, sit, rim. Use finger taps for each sound before reading the full word.', 'Short-o examples: top, hop, log, pot, mop. Mix with one non-example to check if child is decoding or guessing.', 'Short-u examples: sun, cup, bug, mud, bus. Ask child to segment first, then blend back.', 'Sentence frames parents can reuse: "The cat is on the mat." "I can sit on top." "The bug is in a cup."', 'Dictation sample: say "pin", child taps /p/ /i/ /n/, writes pin, then reads back pin aloud.'],
  'phonics-blending-activities': ['Oral-only blending set: /c/ /a/ /t/, /m/ /a/ /p/, /s/ /i/ /t/. No print first, just listening and joining.', 'Print blending set: cat, map, sit, pin, top. Parent slides finger under each grapheme while child blends.', 'Contrast drill: sat vs sit, pin vs pan, hop vs hip to strengthen vowel hearing.', 'Phrase practice: "a red cat", "sit up", "top hat" so blending moves into connected reading.', 'Correction script: "Let us sound slowly: /s/ /a/ /t/. Now fast: sat."', '3-step session: 3 oral blends + 3 printed words + 1 short decodable sentence.'],
  'how-kids-learn-blending': ['Stage 1 example (oral merge): parent says /m/ /a/ /n/, child says man.', 'Stage 2 example (sound cards): child arranges m-a-n cards and blends to man.', 'Stage 3 example (print): child reads man, fan, pan in one row without picture clues.', 'Stage 4 example (sentence): "The man can run." Child points word-by-word while reading.', 'Micro progression: 5 days oral + print CVC, next 5 days add mixed CVC review and one sentence daily.', 'If blending breaks, step back one stage for 2 days and rebuild speed with 1-minute drills.'],
  'how-phonics-improves-spelling': ['Say-tap-spell-read routine: parent says "ship", child taps /sh/ /i/ /p/, writes ship, then reads ship aloud.', 'Use 3 sound boxes for CVC and 4 boxes for digraph words (for example, "shop" has 3 sounds: /sh/ /o/ /p/).', 'Contrast dictation pairs to sharpen listening: pin/pan, sit/set, chip/ship.', 'Sentence transfer: dictate "The ship is big." Child underlines the target spelling pattern after writing.', 'Error-fix script: "Which sound did we miss?" Child adds or changes one grapheme, then reads the corrected word.', 'Weekly review stack: 4 new words + 2 old words so spelling memory stays cumulative.'],
  'how-phonics-builds-reading-confidence': ['Use a success-first text set: 8 easy words + 2 stretch words to keep accuracy high and stress low.', 'Echo reading: parent reads a short decodable line once, child reads the same line with finger tracking.', 'Retry loop for hard words: segment slowly, blend once, then reread the full sentence to restore flow.', 'Confidence tracker: log one daily win such as "read without guessing" or "self-corrected after a pause."', 'Choice routine: let your child pick one of two decodable texts at the same level to increase ownership.', 'Two-praise rule after practice: praise effort strategy plus one skill gain (for example, smoother blending).'],
  'child-knows-abc-but-cannot-read': ['Contrast the two skills: letter naming = "This is B"; decoding = /b/ /a/ /t/ → bat. Practice both separately for clarity.', 'Start with 5 decodable CVC words daily: mat, sat, pin, top, sun. Avoid picture clues initially.', 'Use the parent prompt: "Show me sounds first, then blend." This reduces random guessing.', 'Try an oral-only warmup: say /c/ /a/ /t/, child says cat. Then move to print for transfer.', 'If child guesses from first letter, cover the word, reveal one sound at a time, then blend fully.', 'Close with one confidence sentence your child can decode: "The cat sat."'],
  'r-controlled-vowels-explained': ['Bossy-R AR set: car, star, park, farm. Sentence: "The car is far."', 'Bossy-R OR set: fork, corn, storm, short. Sentence: "The fork is on the corn tray."', 'Bossy-R ER/IR/UR set: her, bird, turn, fur, shirt. Sentence: "The bird can turn."', 'Sort game: mix 12 words and ask child to place each under AR / OR / ER-IR-UR.', 'Sound cue: "R pulls the vowel." Model slowly: c-a-r -> car (not cah).', 'Review loop: 4 AR words Monday, 4 OR words Tuesday, mixed review Wednesday onward.'],
  'phonics-rules-for-beginners': ['Short-vowel week: cat, pin, top, sun; child reads, spells, then uses each word in a short oral sentence.', 'Digraph day: teach sh/ch/th with mouth cueing and contrast pairs (ship/chip, thin/then).', 'Silent-e contrast: tap vs tape, kit vs kite, hop vs hope to show how one letter changes vowel sound.', 'Rule application loop: hear word -> segment sounds -> choose pattern -> write -> read back.', 'Cumulative review board: keep 6-8 "known patterns" visible and revisit daily before new rule teaching.', 'Error sort: classify mistakes as "sound missed" or "pattern choice" to guide next practice.'],
  'phonics-activities-for-kids-at-home': ['Monday sound hunt: find 5 home objects with target beginning sounds and say each sound clearly.', 'Tuesday blend race: parent says segmented sounds, child blends and then finds matching word card.', 'Wednesday dictation mini-set: 4 words + 1 sentence from taught patterns only.', 'Thursday read-and-act: child reads a short decodable sentence and acts it out for meaning connection.', 'Friday mixed review: 3 old words + 2 new words + one self-correction challenge.', 'Weekend parent reflection: note one easy pattern, one tricky pattern, and next week’s target.']
};

const DEFAULT_PHONICS_EXAMPLES = ['Use a 10-minute loop: 2 minutes sound review, 4 minutes blending, 4 minutes decodable reading.', 'Keep a 3-old + 2-new word rule so review and new learning stay balanced.', 'Use parent script: "Try it slowly, then fast." Avoid giving the answer immediately.', 'End each session with one success sentence your child can read aloud independently.'];

const PHONICS_PARENT_GUIDE_SCRIPTS = ['Before practice: "We will do only 10 minutes, then stop."', 'During practice: "Show me the sounds first, then blend."', 'After effort: "I liked how you tried again when it felt tricky."', 'For correction: "Let us check it together slowly, then you try once more."'];

const PHONICS_CLUSTER_INTENT_SLUGS = new Set(['synthetic-phonics-vs-traditional-reading', 'child-knows-abc-but-cannot-read', 'what-age-to-start-phonics', 'science-of-phonics-learning', 'how-phonics-classes-help-kids-read', 'phonics-activities-for-kids-at-home', 'online-phonics-classes-vs-school', 'how-to-choose-phonics-classes']);

const PHONICS_PRIMARY_DESTINATION_BY_SLUG: Record<string, {
  label: string;
  to: string;
}> = {
  'child-knows-abc-but-cannot-read': {
    label: 'Explore structured phonics support',
    to: '/phonics'
  },
  'how-to-choose-phonics-classes': {
    label: 'Explore structured phonics support',
    to: '/phonics'
  }
};

const PHONICS_CLUSTER_SIBLING_LINKS: Record<string, {
  label: string;
  to: string;
}> = {
  'synthetic-phonics-vs-traditional-reading': {
    label: 'Phonics vs sight words and traditional reading',
    to: '/blog/science-of-phonics-learning'
  },
  'child-knows-abc-but-cannot-read': {
    label: 'Why kids struggle with reading',
    to: '/blog/how-phonics-classes-help-kids-read'
  },
  'what-age-to-start-phonics': {
    label: 'What is phonics for kids?',
    to: '/blog/what-is-phonics-for-kids'
  },
  'science-of-phonics-learning': {
    label: 'What is synthetic phonics?',
    to: '/blog/synthetic-phonics-vs-traditional-reading'
  },
  'how-phonics-classes-help-kids-read': {
    label: 'My child knows ABC but cannot read',
    to: '/blog/child-knows-abc-but-cannot-read'
  },
  'phonics-activities-for-kids-at-home': {
    label: 'What is phonics for kids?',
    to: '/blog/what-is-phonics-for-kids'
  },
  'online-phonics-classes-vs-school': {
    label: 'Best online phonics classes for kids',
    to: '/blog/best-online-phonics-classes-for-kids'
  }
};

function makePhonicsExcerpt(focus: string) {
  return `Parent guide to ${focus}: clear answers, a 10-minute home routine, class-selection checkpoints, and realistic milestones to help your child become a confident reader.`;
}

function getPhonicsExamples(slug: string) {
  return PHONICS_EXAMPLES_BY_SLUG[slug] ?? DEFAULT_PHONICS_EXAMPLES;
}

function buildFaqBody(faq: {
  question: string;
  answer: string;
}[]) {
  const blocks: BlogBlock[] = [{
    type: 'h2',
    content: 'Parent FAQ'
  }];
  faq.forEach(item => {
    blocks.push({
      type: 'h3',
      content: item.question
    });
    blocks.push({
      type: 'p',
      content: item.answer
    });
  });
  return blocks;
}

function buildRelatedReadsBody(relatedReads?: {
  label: string;
  to: string;
}[]) {
  if (!relatedReads?.length) return [];
  return [{
    type: 'h2' as const,
    content: 'Related reading in this phonics cluster'
  }, ...relatedReads.map(item => ({
    type: 'li' as const,
    content: `${item.label}: ${item.to}`
  }))];
}

function normalizeClusterRelatedReads(post: PhonicsSeoPost) {
  if (!PHONICS_CLUSTER_INTENT_SLUGS.has(post.slug)) return post.relatedReads ?? [];
  const related = [...(post.relatedReads ?? [])];
  const primaryDestination = PHONICS_PRIMARY_DESTINATION_BY_SLUG[post.slug];
  if (primaryDestination) {
    const filtered = related.filter(item => item.to !== '/phonics' && item.to !== '/curriculum' && item.to !== '/courses');
    filtered.unshift(primaryDestination);
    const hasSiblingBlog = filtered.some(item => item.to.startsWith('/blog/') && item.to !== `/blog/${post.slug}`);
    if (!hasSiblingBlog && PHONICS_CLUSTER_SIBLING_LINKS[post.slug]) {
      filtered.push(PHONICS_CLUSTER_SIBLING_LINKS[post.slug]);
    }
    return filtered.filter((item, index, arr) => arr.findIndex(i => i.to === item.to) === index);
  }
  if (!related.some(item => item.to === '/phonics')) {
    related.unshift({
      label: 'Explore phonics classes',
      to: '/phonics'
    });
  }
  const hasCommercialSupport = related.some(item => item.to === '/curriculum' || item.to === '/courses');
  if (!hasCommercialSupport) {
    related.push({
      label: 'See curriculum progression',
      to: '/curriculum'
    });
  }
  const hasSiblingBlog = related.some(item => item.to.startsWith('/blog/') && item.to !== `/blog/${post.slug}`);
  if (!hasSiblingBlog && PHONICS_CLUSTER_SIBLING_LINKS[post.slug]) {
    related.push(PHONICS_CLUSTER_SIBLING_LINKS[post.slug]);
  }
  const deduped = related.filter((item, index, arr) => arr.findIndex(i => i.to === item.to) === index);
  return deduped;
}

function buildClusterSoftCtaBody(slug: string) {
  if (!PHONICS_CLUSTER_INTENT_SLUGS.has(slug)) return [];
  const primaryDestination = PHONICS_PRIMARY_DESTINATION_BY_SLUG[slug];
  if (primaryDestination) {
    return [{
      type: 'h2' as const,
      content: 'Next calm step for parents'
    }, {
      type: 'p' as const,
      content: 'Focus on one structured next step and keep practice consistent before adding extra programs or methods.'
    }, {
      type: 'li' as const,
      content: `${primaryDestination.label}: ${primaryDestination.to}`
    }];
  }
  return [{
    type: 'h2' as const,
    content: 'Next calm step for parents'
  }, {
    type: 'p' as const,
    content: 'Pick one steady next step: keep practice short, use one consistent method, and review your child’s level before increasing difficulty.'
  }, {
    type: 'li' as const,
    content: 'Explore phonics support: /phonics'
  }, {
    type: 'li' as const,
    content: 'See your level pathway: /curriculum'
  }, {
    type: 'li' as const,
    content: 'Compare class options: /courses'
  }];
}

function makeOnlinePhonicsGamesPost(post: PhonicsSeoPost): BlogPost {
  const faq = post.faq;
  const relatedReads = normalizeClusterRelatedReads(post);
  const excerpt = 'Parent guide to online phonics games with skill-by-skill game types, age guidance (3-4, 5-6, 7+), distraction filters, and a stage-matching plan that connects games to real reading progress.';
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
    body: [{
      type: 'h2',
      content: 'Quick answer for parents'
    }, {
      type: 'p',
      content: post.quickAnswer
    }, {
      type: 'h2',
      content: 'Game types by skill: what each type should train'
    }, {
      type: 'li',
      content: 'Letter sounds games: children hear a sound and map it to the correct letter or letter team. Good for early sound recall, not full reading yet.'
    }, {
      type: 'li',
      content: 'Blending games: children join 2-4 sounds into a word (for example, /c/ /a/ /t/ -> cat). This is the core bridge from sounds to decoding.'
    }, {
      type: 'li',
      content: 'Segmenting games: children break spoken words into sounds before spelling. Useful when reading is ahead of spelling accuracy.'
    }, {
      type: 'li',
      content: 'Tricky-word games: children rehearse high-frequency words that are not fully decodable at current level. Keep list size small and reviewed.'
    }, {
      type: 'li',
      content: 'Fluency games: repeated phrase or sentence reading with accuracy before speed. Best after basic decoding is already stable.'
    }, {
      type: 'h2',
      content: 'Which games work by age group'
    }, {
      type: 'h3',
      content: 'Ages 3-4'
    }, {
      type: 'li',
      content: 'Best fit: short letter-sound matching, oral sound-play, and listening-response games with adult support.'
    }, {
      type: 'li',
      content: 'Session length: 5-8 minutes max before switching to movement or print-light activities.'
    }, {
      type: 'h3',
      content: 'Ages 5-6'
    }, {
      type: 'li',
      content: 'Best fit: blending and segmenting games on simple CVC words plus small tricky-word sets.'
    }, {
      type: 'li',
      content: 'Session length: 8-12 minutes, then immediate transfer to reading 3-5 words or 1 short sentence.'
    }, {
      type: 'h3',
      content: 'Ages 7+'
    }, {
      type: 'li',
      content: 'Best fit: complex blending, spelling pattern games, and fluency drills tied to connected text.'
    }, {
      type: 'li',
      content: 'Session length: 12-15 minutes with focus on accuracy, self-correction, and meaning checks.'
    }, {
      type: 'h2',
      content: 'Signs a phonics game is helpful vs distracting'
    }, {
      type: 'h3',
      content: 'Helpful signs'
    }, {
      type: 'li',
      content: 'The game targets one clear reading skill per round, not mixed random tasks.'
    }, {
      type: 'li',
      content: 'Errors trigger immediate correction and retry, not only points or animations.'
    }, {
      type: 'li',
      content: 'Your child can apply the same pattern in print right after the game.'
    }, {
      type: 'li',
      content: 'Progress is visible in fewer guesses and steadier blending over 2-3 weeks.'
    }, {
      type: 'h3',
      content: 'Distracting signs'
    }, {
      type: 'li',
      content: 'Children can win by tapping fast without reading the full word.'
    }, {
      type: 'li',
      content: 'Too many visual rewards interrupt focus more than they support decoding.'
    }, {
      type: 'li',
      content: 'No clear level pathway from sounds to words to sentence reading.'
    }, {
      type: 'li',
      content: 'Performance improves in-app but not in book reading or school tasks.'
    }, {
      type: 'h2',
      content: 'How to match a game to your child’s current reading stage'
    }, {
      type: 'li',
      content: 'Stage 1 (sound awareness): choose letter-sound listening games. Move up when your child can recall taught sounds without prompts.'
    }, {
      type: 'li',
      content: 'Stage 2 (early decoding): choose blending games on short words. Move up when blending is accurate and less effortful.'
    }, {
      type: 'li',
      content: 'Stage 3 (spelling transfer): choose segmenting + spelling games. Move up when word spellings stabilize across practice days.'
    }, {
      type: 'li',
      content: 'Stage 4 (connected reading): choose fluency games tied to short passages. Stay here until expression and comprehension improve together.'
    }, {
      type: 'h2',
      content: 'How this differs from adjacent Tiny Steps phonics pages'
    }, {
      type: 'li',
      content: 'This page is a decision guide for choosing online games by skill and stage, not just a list of activities.'
    }, {
      type: 'li',
      content: 'For letter-sound-only ideas, use the separate phonics games for letter sounds article.'
    }, {
      type: 'li',
      content: 'For offline routines and printable home practice, use the phonics activities for kids at home article.'
    }, {
      type: 'li',
      content: 'For the full live program pathway (assessment, teaching, progress), use the main phonics program page.'
    }, {
      type: 'h2',
      content: 'When games are not enough on their own'
    }, {
      type: 'p',
      content: post.support
    }, {
      type: 'li',
      content: 'Use games as reinforcement, not replacement, for explicit phonics teaching.'
    }, {
      type: 'li',
      content: 'Escalate to guided instruction when guessing patterns persist across weeks.'
    }, {
      type: 'li',
      content: 'Review stage placement regularly so game difficulty matches current reading level.'
    }, ...buildRelatedReadsBody(relatedReads), ...buildFaqBody(faq)]
  };
}

function makePhonicsPost(post: PhonicsSeoPost): BlogPost {
  if (post.slug === 'online-phonics-games') {
    return makeOnlinePhonicsGamesPost(post);
  }
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
    body: [{
      type: 'h2',
      content: 'Quick answer for parents'
    }, {
      type: 'p',
      content: post.quickAnswer
    }, {
      type: 'h2',
      content: 'At-home plan: 10 minutes that actually works'
    }, {
      type: 'p',
      content: `If you are currently researching ${post.focus}, run this simple routine for 2-3 weeks before judging progress.`
    }, ...post.homePlan.map(step => ({
      type: 'li' as const,
      content: step
    })), {
      type: 'h2',
      content: 'Checklist when choosing a phonics class'
    }, ...PHONICS_BASE_CLASS_CHECKLIST.map(item => ({
      type: 'li' as const,
      content: item
    })), {
      type: 'li',
      content: post.classChecklistFocus
    }, {
      type: 'h2',
      content: 'Mistakes that slow progress'
    }, ...PHONICS_BASE_MISTAKES.map(item => ({
      type: 'li' as const,
      content: item
    })), {
      type: 'li',
      content: post.avoidFocus
    }, {
      type: 'h2',
      content: 'Progress timeline parents can expect'
    }, {
      type: 'p',
      content: post.progress
    }, {
      type: 'h2',
      content: 'Useful examples parents can use tonight'
    }, {
      type: 'p',
      content: 'Use these examples directly during practice so your child sees the concept in real words and short sentences.'
    }, ...examples.map(item => ({
      type: 'li' as const,
      content: item
    })), {
      type: 'h2',
      content: 'Parent-guide scripts to keep practice positive'
    }, ...PHONICS_PARENT_GUIDE_SCRIPTS.map(item => ({
      type: 'li' as const,
      content: item
    })), {
      type: 'h2',
      content: 'When to ask for extra support'
    }, {
      type: 'p',
      content: post.support
    }, ...buildRelatedReadsBody(relatedReads), ...buildClusterSoftCtaBody(post.slug), ...buildFaqBody(faq)]
  };
}

export { makePhonicsPost };
