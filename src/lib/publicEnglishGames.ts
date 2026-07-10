import {
  ENGLISH_EXCELLENCE_STAGES,
  type EnglishExcellenceStage,
  type EnglishExcellenceTile,
} from "./englishExcellenceMission";

export const PUBLIC_ENGLISH_GAMES_HUB_PATH = "/free-english-games-for-kids";
export const PUBLIC_PROGRESS_STORAGE_KEY = "ts_public_game_progress_v1";

export type PublicProgressStore = {
  v: 1;
  completedTileIds: string[];
};

export type PublicTileRoute = {
  route?: string;
  enabled: boolean;
  footer: string;
};

export type PublicEnglishGamesCategoryConfig = {
  route: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  categoryQuestion: string;
  categoryAnswer: string;
  learningAnswer: string;
  differenceAnswer: string;
  stageIds?: string[];
  gameIds?: string[];
};

export type PublicEnglishGameLandingConfig = {
  publicPath: string;
  categoryPath: string;
  seoTitle: string;
  seoDescription: string;
  h1: string;
  intro: string;
  ageRange: string;
  skills: string[];
  howToPlay: string[];
  skillAnswer: string;
  differenceAnswer: string;
  gameIds: string[];
  isPublicPageReady: boolean;
  isPublicPlayReady: boolean;
  playPath?: string;
  statusText: string;
};

export type PublicCategoryTileEntry = {
  stage: EnglishExcellenceStage;
  tile: EnglishExcellenceTile;
};

export const PUBLIC_TILE_ROUTES: Record<string, PublicTileRoute> = {
  "eem-g00-letter-tracing": {
    route: "/free-letter-tracing-game-for-kids",
    enabled: true,
    footer: "Play free in browser",
  },
  "eem-g00b-letter-tracing-sounds": {
    route: "/free-letter-tracing-with-sounds-game-for-kids",
    enabled: true,
    footer: "Play free in browser",
  },
  "eem-g04-letter-sounds": {
    route: "/free-letter-sounds-game-for-kids",
    enabled: true,
    footer: "Play free in browser",
  },
  "eem-g04b-balloon-pop": {
    route: "/free-phonics-balloon-pop-game-for-kids",
    enabled: true,
    footer: "Play free in browser",
  },
  "eem-g05-sound-listening": {
    route: "/free-sound-listening-game-for-kids",
    enabled: true,
    footer: "Play free in browser",
  },
  // TODO(phase-2c): connect these landing pages to safe public gameplay when the engines are public-ready.
  "eem-g06-blend-2-sounds": {
    route: "/free-word-building-game-for-kids",
    enabled: true,
    footer: "Play free in browser",
  },
  "eem-g06b-more-blending": {
    route: "/free-word-building-game-for-kids",
    enabled: true,
    footer: "Play free in browser",
  },
  "eem-g08b-read-tiny-words": {
    route: "/free-word-building-game-for-kids",
    enabled: true,
    footer: "Play free in browser",
  },
  "eem-g09-word-families": {
    route: "/free-word-building-game-for-kids",
    enabled: true,
    footer: "Play free in browser",
  },
  "eem-g10-spelling-practice": {
    route: "/free-word-building-game-for-kids",
    enabled: true,
    footer: "Play free in browser",
  },
  // TODO(phase-2c): add read-sentences and early-reader-fluency public gameplay before enabling these routes.
  "eem-g12-read-sentences": {
    route: "/free-sentence-making-game-for-kids",
    enabled: false,
    footer: "Public version coming soon",
  },
  "eem-g12b-early-reader-fluency": {
    route: "/free-reading-fluency-game-for-kids",
    enabled: false,
    footer: "Public version coming soon",
  },
  "eem-g13-fill-the-blank": {
    route: "/free-sentence-making-game-for-kids",
    enabled: true,
    footer: "Play free in browser",
  },
  // TODO(phase-2c): add reading public gameplay before enabling these routes.
  "eem-g18-fluent-reading": {
    route: "/free-reading-fluency-game-for-kids",
    enabled: false,
    footer: "Public version coming soon",
  },
  "eem-g18b-story-reading": {
    route: "/free-reading-fluency-game-for-kids",
    enabled: false,
    footer: "Public version coming soon",
  },
  "eem-g19-comprehension-questions": {
    route: "/free-reading-fluency-game-for-kids",
    enabled: false,
    footer: "Public version coming soon",
  },
  "eem-g20-new-words-from-reading": {
    route: "/free-reading-fluency-game-for-kids",
    enabled: false,
    footer: "Public version coming soon",
  },
  "eem-g20b-summarize-simply": {
    route: "/free-reading-fluency-game-for-kids",
    enabled: false,
    footer: "Public version coming soon",
  },
  "eem-g21-meaning-from-context": {
    route: "/free-games/word-meaning-flashcards",
    enabled: true,
    footer: "Play free in browser",
  },
  // TODO(phase-2c): add grammar public gameplay before enabling these routes.
  "eem-g15-better-sentences": {
    route: "/free-grammar-practice-game-for-kids",
    enabled: true,
    footer: "Play free in browser",
  },
  "eem-g14-grammar-fix": {
    route: "/free-grammar-practice-game-for-kids",
    enabled: false,
    footer: "Public version coming soon",
  },
  "eem-g16-collocation-builder": {
    route: "/free-grammar-practice-game-for-kids",
    enabled: false,
    footer: "Public version coming soon",
  },
  // TODO(phase-2c): add speaking public gameplay before enabling these routes.
  "eem-g24-picture-talk": {
    route: "/free-speaking-practice-game-for-kids",
    enabled: false,
    footer: "Public version coming soon",
  },
};

export const PUBLIC_ENGLISH_GAMES_CATEGORY_CONFIGS: PublicEnglishGamesCategoryConfig[] = [
  {
    route: "/free-phonics-games-for-kids",
    title: "Free Phonics Games for Kids | Letter Sounds, Tracing & Listening",
    description:
      "Play free phonics games for kids from Tiny Steps. Practise letter tracing, letter sounds, sound listening and early reading skills online. No login required.",
    h1: "Free Phonics Games for Kids",
    intro:
      "Explore free phonics practice for tracing, sound recognition, blending, and first-word confidence in one public games collection.",
    categoryQuestion: "What are phonics games for kids?",
    categoryAnswer:
      "Phonics games help children connect letters with sounds, practise listening, and build early decoding skills through short interactive activities.",
    learningAnswer:
      "These games help children notice sounds, trace letters, blend simple words, and practise early reading in a child-friendly format.",
    differenceAnswer:
      "Tiny Steps free games are useful for short practice. Teacher-guided classes add saved progress, correction, speaking support, and structured weekly learning.",
    stageIds: ["eem-stage-1-letters-sounds", "eem-stage-2-build-words"],
  },
  {
    route: "/free-letter-sound-games-for-kids",
    title: "Free Letter Sound Games for Kids | ABC Phonics Practice",
    description:
      "Help children practise alphabet sounds, phonics listening and early letter recognition with free online letter sound games from Tiny Steps.",
    h1: "Free Letter Sound Games for Kids",
    intro:
      "Use these free letter sound games to practise tracing, sound matching, listening, and early alphabet confidence without logging in.",
    categoryQuestion: "What are letter sound games for kids?",
    categoryAnswer:
      "Letter sound games help children hear a sound, connect it to a letter, and build faster recognition of alphabet sounds.",
    learningAnswer:
      "They support phonics listening, letter identification, tracing, and early sound recall that children need before fluent reading.",
    differenceAnswer:
      "Free practice helps children repeat core phonics patterns, while Tiny Steps classes add teacher feedback, saved milestones, and guided progression.",
    stageIds: ["eem-stage-1-letters-sounds"],
  },
  {
    route: "/free-word-building-games-for-kids",
    title: "Free Word Building Games for Kids | CVC & Blending Practice",
    description:
      "Play free word building games for kids. Practise blending sounds, building simple words and improving early reading confidence online.",
    h1: "Free Word Building Games for Kids",
    intro:
      "These word-building games focus on blending sounds, building small words, and helping children move from phonics practice into early reading.",
    categoryQuestion: "What are word building games for kids?",
    categoryAnswer:
      "Word building games help children join sounds together, read simple words, and understand how letters work inside short word patterns.",
    learningAnswer:
      "They strengthen blending, decoding, word-family recognition, and the confidence children need before reading longer text.",
    differenceAnswer:
      "Tiny Steps free games make blending practice easier at home, while live classes help children fix mistakes early and build stronger reading habits.",
    stageIds: ["eem-stage-2-build-words"],
  },
  {
    route: "/free-sentence-building-games-for-kids",
    title: "Free Sentence Building Games for Kids | English Practice Online",
    description:
      "Help children build simple English sentences with free online sentence games from Tiny Steps. Practise grammar, word order and clear expression.",
    h1: "Free Sentence Building Games for Kids",
    intro:
      "Children can practise simple sentence order, early fluency, and clearer expression through sentence-building games designed for short browser sessions.",
    categoryQuestion: "What are sentence building games for kids?",
    categoryAnswer:
      "Sentence building games help children put words in order, understand simple grammar, and express ideas more clearly in English.",
    learningAnswer:
      "These games support sentence order, fluency, grammar awareness, and the habit of turning words into complete ideas.",
    differenceAnswer:
      "Free games are useful for quick repetition, while Tiny Steps classes give children guided correction, live speaking practice, and saved progress.",
    gameIds: ["eem-g12-read-sentences", "eem-g12b-early-reader-fluency", "eem-g13-fill-the-blank", "eem-g15-better-sentences", "eem-g14-grammar-fix"],
  },
  {
    route: "/free-reading-games-for-kids",
    title: "Free Reading Games for Kids | Online Reading Practice",
    description:
      "Play free reading games for kids. Build fluency, word recognition and reading confidence with child-friendly English practice from Tiny Steps.",
    h1: "Free Reading Games for Kids",
    intro:
      "This reading games page groups fluency, comprehension, vocabulary, and context-based practice for children who are moving beyond basic decoding.",
    categoryQuestion: "What are reading games for kids?",
    categoryAnswer:
      "Reading games help children practise fluency, recognise words faster, understand meaning, and stay engaged with child-friendly text tasks.",
    learningAnswer:
      "They build word recognition, reading stamina, vocabulary, and simple comprehension habits that support stronger English learning.",
    differenceAnswer:
      "Free reading games are helpful for extra practice, while Tiny Steps classes add teacher support, comprehension coaching, and tracked progress over time.",
    stageIds: ["eem-stage-4-read-understand"],
  },
  {
    route: "/free-grammar-games-for-kids",
    title: "Free Grammar Games for Kids | English Grammar Practice Online",
    description:
      "Practise English grammar with free online games for kids. Learn sentences, grammar rules and language skills through child-friendly activities.",
    h1: "Free Grammar Games for Kids",
    intro:
      "Use these grammar games for simple sentence practice, grammar correction, and more natural English usage in a browser-only format.",
    categoryQuestion: "What are grammar games for kids?",
    categoryAnswer:
      "Grammar games help children practise sentence rules, notice mistakes, and build more accurate English through short guided challenges.",
    learningAnswer:
      "They strengthen grammar awareness, sentence quality, word choice, and the confidence to use better English patterns in everyday learning.",
    differenceAnswer:
      "Free practice games help children repeat grammar concepts, while Tiny Steps classes add live correction, teacher explanations, and saved progress.",
    stageIds: ["eem-stage-5-grammar-practice"],
  },
  {
    route: "/free-speaking-games-for-kids",
    title: "Free Speaking Games for Kids | Confidence & Communication Practice",
    description:
      "Explore free speaking games for kids from Tiny Steps. Help children practise clear speaking, confidence, expression and communication skills.",
    h1: "Free Speaking Games for Kids",
    intro:
      "These speaking games highlight expression, picture-based talk, and confidence-building practice for children who are ready to speak more clearly.",
    categoryQuestion: "What are speaking games for kids?",
    categoryAnswer:
      "Speaking games help children practise saying ideas aloud, building confidence, and expressing thoughts more clearly in English.",
    learningAnswer:
      "They support oral confidence, expression, vocabulary recall, and the habit of speaking in complete ideas instead of single-word answers.",
    differenceAnswer:
      "Free speaking practice is useful for exposure, while Tiny Steps classes give children live teacher prompting, feedback, and confidence coaching.",
    stageIds: ["eem-stage-6-speak-confidence"],
  },
];

export const PUBLIC_ENGLISH_GAMES_CATEGORY_ROUTES = PUBLIC_ENGLISH_GAMES_CATEGORY_CONFIGS.map(
  (config) => config.route,
);

export const PUBLIC_ENGLISH_GAME_LANDING_CONFIGS: PublicEnglishGameLandingConfig[] = [
  {
    publicPath: "/free-letter-sounds-game-for-kids",
    categoryPath: "/free-letter-sound-games-for-kids",
    seoTitle: "Free Letter Sounds Game for Kids | ABC Phonics Practice",
    seoDescription:
      "Play a free letter sounds game for kids from Tiny Steps. Help children match alphabet letters with phonics sounds through child-friendly online practice.",
    h1: "Free Letter Sounds Game for Kids",
    intro:
      "This public Tiny Steps page introduces a child-friendly letter sounds practice game that helps children hear a sound, match it to a letter, and build stronger phonics confidence.",
    ageRange: "Ages 4 to 7",
    skills: ["Letter-sound matching", "Alphabet recognition", "Phonics listening", "Early reading readiness"],
    howToPlay: [
      "Start with a short sound warm-up and ask your child to say the sound aloud.",
      "Choose one letter sound at a time and match it carefully before moving faster.",
      "Keep practice short and repeat the same sounds over several days for stronger recall.",
    ],
    skillAnswer:
      "This game practises letter-sound matching, alphabet recognition, and the phonics listening skills children need before fluent reading.",
    differenceAnswer:
      "Tiny Steps free practice pages help families try focused English skills at home, while teacher-guided classes add saved progress, correction, and structured weekly learning.",
    gameIds: ["eem-g04-letter-sounds"],
    isPublicPageReady: true,
    isPublicPlayReady: true,
    playPath: "/free-letter-sounds-game-for-kids?play=1",
    statusText: "Play free",
  },
  {
    publicPath: "/free-sound-listening-game-for-kids",
    categoryPath: "/free-phonics-games-for-kids",
    seoTitle: "Free Sound Listening Game for Kids | Phonics Listening Practice",
    seoDescription:
      "Help children listen carefully and identify phonics sounds with a free online sound listening game from Tiny Steps. No login required.",
    h1: "Free Sound Listening Game for Kids",
    intro:
      "This Tiny Steps sound listening page is built for children who need extra phonics listening practice before they move confidently into blending and reading.",
    ageRange: "Ages 4 to 7",
    skills: ["Listening for phonics sounds", "Sound discrimination", "Attention and recall", "Early phonics confidence"],
    howToPlay: [
      "Play in a quiet space so your child can focus on each target sound.",
      "Ask your child to listen first, then point or say the matching answer.",
      "Repeat a few sounds at a time instead of rushing through a long session.",
    ],
    skillAnswer:
      "This game practises careful listening, sound discrimination, and the ability to notice phonics differences before reading longer words.",
    differenceAnswer:
      "Free Tiny Steps listening practice is useful for repetition at home, while full classes add teacher prompting, correction, and saved learning progress.",
    gameIds: ["eem-g05-sound-listening"],
    isPublicPageReady: true,
    isPublicPlayReady: true,
    playPath: "/free-sound-listening-game-for-kids?play=1",
    statusText: "Play free",
  },
  {
    publicPath: "/free-word-building-game-for-kids",
    categoryPath: "/free-word-building-games-for-kids",
    seoTitle: "Free Word Building Game for Kids | CVC & Blending Practice",
    seoDescription:
      "Play a free word building game for kids. Practise blending sounds, building simple words and improving early reading confidence online.",
    h1: "Free Word Building Game for Kids",
    intro:
      "This public Tiny Steps word-building page introduces simple blending and CVC practice that helps children move from individual sounds into real words.",
    ageRange: "Ages 5 to 8",
    skills: ["Blending sounds", "CVC word reading", "Word-family recognition", "Early spelling confidence"],
    howToPlay: [
      "Begin with two-sound and three-sound words that your child can hear clearly.",
      "Encourage blending slowly from left to right before asking for the whole word.",
      "Repeat a small group of words until your child reads them smoothly and confidently.",
    ],
    skillAnswer:
      "This game practises blending, simple word building, CVC recognition, and the reading confidence children need before tackling longer text.",
    differenceAnswer:
      "Free Tiny Steps word practice helps families rehearse sound blending at home, while teacher-guided classes fix decoding mistakes early and track progress over time.",
    gameIds: [
      "eem-g06-blend-2-sounds",
      "eem-g06b-more-blending",
      "eem-g08b-read-tiny-words",
      "eem-g09-word-families",
      "eem-g10-spelling-practice",
    ],
    isPublicPageReady: true,
    isPublicPlayReady: true,
    playPath: "/free-word-building-game-for-kids?play=1",
    statusText: "Play free",
  },
  {
    publicPath: "/free-sentence-making-game-for-kids",
    categoryPath: "/free-sentence-building-games-for-kids",
    seoTitle: "Free Sentence Making Game for Kids | English Sentence Practice",
    seoDescription:
      "Help children build simple English sentences with a free sentence making game from Tiny Steps. Practise word order, grammar and expression online.",
    h1: "Free Sentence Making Game for Kids",
    intro:
      "This sentence-making page is designed for children who are ready to turn words into clear English sentences with better order, grammar awareness, and expression.",
    ageRange: "Ages 6 to 9",
    skills: ["Sentence order", "Reading simple sentences", "Grammar awareness", "Clear expression"],
    howToPlay: [
      "Ask your child to read the words aloud before arranging them into a sentence.",
      "Encourage your child to check whether the sentence sounds natural after building it.",
      "Use short daily sessions so sentence practice stays clear, calm, and repeatable.",
    ],
    skillAnswer:
      "This game practises sentence order, grammar awareness, reading fluency, and the habit of expressing ideas in complete English sentences.",
    differenceAnswer:
      "Tiny Steps free sentence practice helps children rehearse key patterns, while live classes add teacher correction, speaking support, and saved progress.",
    gameIds: ["eem-g12-read-sentences", "eem-g12b-early-reader-fluency", "eem-g13-fill-the-blank"],
    isPublicPageReady: true,
    isPublicPlayReady: true,
    playPath: "/free-sentence-making-game-for-kids?play=1",
    statusText: "Play free",
  },
  {
    publicPath: "/free-reading-fluency-game-for-kids",
    categoryPath: "/free-reading-games-for-kids",
    seoTitle: "Free Reading Fluency Game for Kids | Online Reading Practice",
    seoDescription:
      "Play a free reading fluency game for kids. Build word recognition, smooth reading and English confidence through child-friendly practice.",
    h1: "Free Reading Fluency Game for Kids",
    intro:
      "This Tiny Steps reading fluency page introduces child-friendly reading practice that supports smoother reading, stronger vocabulary, and better English confidence.",
    ageRange: "Ages 6 to 10",
    skills: ["Reading fluency", "Word recognition", "Vocabulary growth", "Comprehension confidence"],
    howToPlay: [
      "Choose short reading passages or questions that your child can handle without rushing.",
      "Encourage smooth reading aloud instead of stopping on every single word.",
      "Follow each reading attempt with one quick question or one new word review.",
    ],
    skillAnswer:
      "This game practises smoother reading, word recognition, vocabulary, and simple comprehension habits that support stronger English learning.",
    differenceAnswer:
      "Free Tiny Steps reading practice helps children build confidence at home, while full classes add live coaching, comprehension support, and tracked progress.",
    gameIds: [
      "eem-g18-fluent-reading",
      "eem-g18b-story-reading",
      "eem-g19-comprehension-questions",
      "eem-g20-new-words-from-reading",
      "eem-g20b-summarize-simply",
    ],
    isPublicPageReady: true,
    isPublicPlayReady: false,
    statusText: "Ready soon",
  },
  {
    publicPath: "/free-grammar-practice-game-for-kids",
    categoryPath: "/free-grammar-games-for-kids",
    seoTitle: "Free Grammar Practice Game for Kids | English Grammar Online",
    seoDescription:
      "Practise English grammar with a free online grammar game for kids from Tiny Steps. Build sentence sense, grammar awareness and confidence.",
    h1: "Free Grammar Practice Game for Kids",
    intro:
      "This public Tiny Steps grammar page gives parents a clear preview of grammar practice that focuses on sentence sense, error correction, and more natural English usage.",
    ageRange: "Ages 6 to 10",
    skills: ["Sentence sense", "Grammar correction", "Natural word choice", "English confidence"],
    howToPlay: [
      "Start with one short sentence at a time instead of giving your child too much text.",
      "Ask your child what sounds wrong before showing the correct answer.",
      "Repeat similar grammar patterns until your child notices the rule more independently.",
    ],
    skillAnswer:
      "This game practises grammar awareness, sentence quality, error correction, and clearer English sentence construction.",
    differenceAnswer:
      "Tiny Steps free grammar practice helps children repeat language patterns, while teacher-led classes explain mistakes clearly and save long-term progress.",
    gameIds: ["eem-g15-better-sentences", "eem-g14-grammar-fix", "eem-g16-collocation-builder"],
    isPublicPageReady: true,
    isPublicPlayReady: true,
    playPath: "/free-grammar-practice-game-for-kids?play=1",
    statusText: "Play free",
  },
  {
    publicPath: "/free-speaking-practice-game-for-kids",
    categoryPath: "/free-speaking-games-for-kids",
    seoTitle: "Free Speaking Practice Game for Kids | Confidence & Communication",
    seoDescription:
      "Explore a free speaking practice game for kids. Help children build clear speaking, confidence, expression and communication skills.",
    h1: "Free Speaking Practice Game for Kids",
    intro:
      "This Tiny Steps speaking practice page is for children who need more support with expression, confidence, and speaking in complete ideas instead of very short answers.",
    ageRange: "Ages 6 to 10",
    skills: ["Speaking confidence", "Expression", "Vocabulary recall", "Communication practice"],
    howToPlay: [
      "Show one simple prompt or picture and give your child a moment to think before speaking.",
      "Encourage full answers instead of one-word replies whenever possible.",
      "Keep practice warm and low-pressure so confidence can grow steadily over time.",
    ],
    skillAnswer:
      "This game practises clear speaking, expression, vocabulary recall, and the confidence children need to communicate in fuller English sentences.",
    differenceAnswer:
      "Tiny Steps free speaking pages give families a practice preview, while live classes add teacher prompting, corrective feedback, and guided communication growth.",
    gameIds: ["eem-g24-picture-talk"],
    isPublicPageReady: true,
    isPublicPlayReady: false,
    statusText: "Coming soon",
  },
];

export const PUBLIC_ENGLISH_GAME_LANDING_ROUTES = PUBLIC_ENGLISH_GAME_LANDING_CONFIGS.map(
  (config) => config.publicPath,
);

export function parsePublicProgress(raw: string | null): PublicProgressStore | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PublicProgressStore;
    return parsed && parsed.v === 1 ? parsed : null;
  } catch {
    return null;
  }
}

export function createEmptyPublicProgress(): PublicProgressStore {
  return { v: 1, completedTileIds: [] };
}

export function getPublicTileRoute(gameId: string) {
  return PUBLIC_TILE_ROUTES[gameId];
}

export function isPublicTilePageReady(gameId: string) {
  const route = PUBLIC_TILE_ROUTES[gameId];
  return Boolean(route?.route);
}

export function isPublicTilePlayable(gameId: string) {
  const route = PUBLIC_TILE_ROUTES[gameId];
  return Boolean(route?.enabled && route.route);
}

export function getPublicEnglishGamesCategoryByPath(pathname: string) {
  return PUBLIC_ENGLISH_GAMES_CATEGORY_CONFIGS.find((config) => config.route === pathname) || null;
}

export function getPublicEnglishGamesTilesForCategory(
  config: PublicEnglishGamesCategoryConfig,
): PublicCategoryTileEntry[] {
  const stageIds = new Set(config.stageIds || []);
  const gameIds = new Set(config.gameIds || []);

  return ENGLISH_EXCELLENCE_STAGES.flatMap((stage) =>
    stage.tiles
      .filter((tile) => {
        if (gameIds.size > 0) return gameIds.has(tile.gameId);
        if (stageIds.size > 0) return stageIds.has(stage.stageId);
        return true;
      })
      .map((tile) => ({ stage, tile })),
  );
}

export function getPublicCategoryTrackSummary(config: PublicEnglishGamesCategoryConfig) {
  const stageIds = new Set(
    getPublicEnglishGamesTilesForCategory(config).map(({ stage }) => stage.stageId),
  );
  return ENGLISH_EXCELLENCE_STAGES.filter((stage) => stageIds.has(stage.stageId));
}

export function getPublicEnglishGameLandingByPath(pathname: string) {
  return PUBLIC_ENGLISH_GAME_LANDING_CONFIGS.find((config) => config.publicPath === pathname) || null;
}

export function getPublicEnglishGameLandingForGameId(gameId: string) {
  return PUBLIC_ENGLISH_GAME_LANDING_CONFIGS.find((config) => config.gameIds.includes(gameId)) || null;
}

export function getPublicEnglishGameLandingTiles(config: PublicEnglishGameLandingConfig) {
  const gameIds = new Set(config.gameIds);
  return ENGLISH_EXCELLENCE_STAGES.flatMap((stage) =>
    stage.tiles
      .filter((tile) => gameIds.has(tile.gameId))
      .map((tile) => ({ stage, tile })),
  );
}
