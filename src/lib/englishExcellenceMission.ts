import { frontendJourneyStageLabelForKidsStageId } from "./frontendJourneyStages";

export type EnglishExcellenceTile = {
  gameId: string;
  gameTitle: string;
  moduleId: string;
  gameOrder: number;
  title?: string;
  description?: string;
  order?: number;
  unlockAfterGameId?: string;
  sampleItems?: Array<{
    itemId: string;
    stageId: string;
    activityType:
      | "reorder"
      | "fillBlank"
      | "chooseBest"
      | "errorSpot"
      | "errorFix"
      | "matchPairs"
      | "contextChoice";
    prompt: unknown;
    answer: unknown;
    options?: string[];
  }>;
  stages?: Array<{
    stageId: string;
    title: string;
    skillFocus: string;
    difficulty: "easy" | "medium" | "hard";
    activityType:
      | "reorder"
      | "fillBlank"
      | "chooseBest"
      | "errorSpot"
      | "errorFix"
      | "matchPairs"
      | "contextChoice";
    masteryTarget: {
      accuracyPct: number;
      maxHints: number;
    };
    hintMode: "guided" | "standard" | "minimal";
    promptShape: string;
    answerShape: string;
    supportsHints: boolean;
    supportsAudio: boolean;
    maxOptions: number;
    minItemsRecommended: number;
  }>;
  desc: string;
  route?: string;
  comingSoon?: boolean;
  isFreeGame?: boolean;
  status?: "live" | "legacyLive" | "ready" | "comingSoon" | "replaced" | "hidden";
  supersededBy?: string;
  roundIds?: string[];
};

export type EnglishExcellenceStage = {
  stageId: string;
  stageNumber: number;
  stageTitle: string;
  stageOrder: number;
  tiles: EnglishExcellenceTile[];
};

const ACTIVITY_CONTENT_CONTRACTS = {
  reorder: {
    promptShape: "wordBank",
    answerShape: "orderedSentence",
    supportsHints: true,
    supportsAudio: false,
    maxOptions: 8,
    minItemsRecommended: 8,
  },
  fillBlank: {
    promptShape: "sentenceWithBlank",
    answerShape: "missingToken",
    supportsHints: true,
    supportsAudio: false,
    maxOptions: 4,
    minItemsRecommended: 8,
  },
  chooseBest: {
    promptShape: "chooseBetweenSentences",
    answerShape: "optionIndex",
    supportsHints: true,
    supportsAudio: false,
    maxOptions: 4,
    minItemsRecommended: 8,
  },
  errorSpot: {
    promptShape: "singleSentenceErrorLocate",
    answerShape: "tokenOrIndex",
    supportsHints: true,
    supportsAudio: false,
    maxOptions: 0,
    minItemsRecommended: 8,
  },
  errorFix: {
    promptShape: "singleSentenceCorrect",
    answerShape: "correctedSentence",
    supportsHints: true,
    supportsAudio: false,
    maxOptions: 0,
    minItemsRecommended: 8,
  },
  matchPairs: {
    promptShape: "pairColumns",
    answerShape: "pairedMatches",
    supportsHints: true,
    supportsAudio: false,
    maxOptions: 8,
    minItemsRecommended: 8,
  },
  contextChoice: {
    promptShape: "scenarioWithOptions",
    answerShape: "optionIndex",
    supportsHints: true,
    supportsAudio: false,
    maxOptions: 4,
    minItemsRecommended: 8,
  },
} as const;

const stageTitleFromSharedCatalog = (stageId: string, fallbackLabel: string): string =>
  frontendJourneyStageLabelForKidsStageId(stageId, fallbackLabel);

export const ENGLISH_EXCELLENCE_STAGES: EnglishExcellenceStage[] = [
  {
    stageId: "eem-stage-1-letters-sounds",
    stageNumber: 1,
    stageTitle: stageTitleFromSharedCatalog("eem-stage-1-letters-sounds", "Letters & Sounds"),
    stageOrder: 1,
    tiles: [
      { gameId: "eem-g00-letter-tracing", gameTitle: "Letter Tracing", moduleId: "eem-m00-pre-writing-tracing", gameOrder: 0, desc: "trace letter shapes smoothly", route: "/kids/games/phonics/letter-tracing", status: "live" },
      { gameId: "eem-g00b-letter-tracing-sounds", gameTitle: "Letter Tracing + Sounds", moduleId: "eem-m00-pre-writing-tracing", gameOrder: 1, desc: "trace while hearing letter sounds", route: "/kids/games/phonics/letter-tracing-sounds", status: "live" },
      { gameId: "eem-g04-letter-sounds", gameTitle: "Letter Sounds", moduleId: "eem-m02-phonics-spelling-patterns", gameOrder: 2, desc: "letter → sound match", route: "/kids/games/phonics/letter-sound", status: "live" },
      { gameId: "eem-g04b-balloon-pop", gameTitle: "Balloon Pop", moduleId: "eem-m02-phonics-spelling-patterns", gameOrder: 3, desc: "pop balloons with the correct sound", route: "/kids/games/phonics/balloon-pop", status: "live" },
      { gameId: "eem-g05-sound-listening", gameTitle: "Sound Listening", moduleId: "eem-m02-phonics-spelling-patterns", gameOrder: 4, desc: "listen and tap the correct picture", route: "/kids/games/phonics/sound-detective", status: "live" },
    ],
  },
  {
    stageId: "eem-stage-2-build-words",
    stageNumber: 2,
    stageTitle: stageTitleFromSharedCatalog("eem-stage-2-build-words", "Build Words"),
    stageOrder: 2,
    tiles: [
      { gameId: "eem-g06-blend-2-sounds", gameTitle: "Blend 2 Sounds", moduleId: "eem-m02-blending-foundations", gameOrder: 1, desc: "combine two sounds into words", route: "/kids/games/phonics/my-first-words?level=1", status: "live" },
      { gameId: "eem-g06b-more-blending", gameTitle: "More Blending", moduleId: "eem-m02-blending-foundations", gameOrder: 2, desc: "blend three sounds and more", route: "/kids/games/phonics/my-first-words?level=2", status: "live" },
      { gameId: "eem-g08b-read-tiny-words", gameTitle: "Read Tiny Words", moduleId: "eem-m03-cvc-blending", gameOrder: 3, desc: "read 3-letter CVC words", route: "/kids/games/phonics/cvc-word-reader", status: "live" },
      { gameId: "eem-g09-word-families", gameTitle: "Word Families", moduleId: "eem-m04-suffixes-word-families", gameOrder: 4, desc: "make-a-word (rimes)", route: "/kids/games/phonics/cvc-word-reader/make-a-word", status: "live" },
      { gameId: "eem-g10-spelling-practice", gameTitle: "Spelling Practice", moduleId: "eem-m05-spelling-pattern-application", gameOrder: 5, desc: "hear → spell", route: "/kids/games/phonics/spelling-practice", status: "live" },
    ],
  },
  {
    stageId: "eem-stage-3-make-sentences",
    stageNumber: 3,
    stageTitle: stageTitleFromSharedCatalog("eem-stage-3-make-sentences", "Make Sentences"),
    stageOrder: 3,
    tiles: [
      { gameId: "eem-g12-read-sentences", gameTitle: "Read Sentences", moduleId: "eem-m06-sentence-order-context", gameOrder: 1, desc: "tap words in order to read decodable sentences", route: "/kids/games/phonics/sentence-stepper?pack=4.0&eemTile=read_sentences&eemStage=3", status: "live" },
      { gameId: "eem-g12b-early-reader-fluency", gameTitle: "Early Reader Fluency", moduleId: "eem-m06-sentence-order-context", gameOrder: 2, desc: "read sentences with increasing fluency", route: "/kids/games/phonics/sentence-stepper?pack=4.3&eemTile=early_reader_fluency&eemStage=3", status: "live" },
      { gameId: "eem-g13-fill-the-blank", gameTitle: "Sentence Builder", moduleId: "eem-m06-sentence-order-context", gameOrder: 3, desc: "put words in order to build sentences", route: "/kids/games/phonics/sentence-stepper?pack=4.2&eemStage=3", status: "live" },
    ],
  },
  {
    stageId: "eem-stage-4-read-understand",
    stageNumber: 4,
    stageTitle: stageTitleFromSharedCatalog("eem-stage-4-read-understand", "Fluent Reading"),
    stageOrder: 4,
    tiles: [
      { gameId: "eem-g18-fluent-reading", gameTitle: "Fluent Reading", moduleId: "eem-m09-story-reading", gameOrder: 1, desc: "read passages fluently with expression", route: "/kids/games/reading/story-reading", status: "live" },
      { gameId: "eem-g18b-story-reading", gameTitle: "Story Reading", moduleId: "eem-m09-story-reading", gameOrder: 2, desc: "read and explore short stories", route: "/kids/games/reading/story-reading", status: "live" },
      { gameId: "eem-g19-comprehension-questions", gameTitle: "Comprehension Questions", moduleId: "eem-m10-comprehension-vocabulary", gameOrder: 3, desc: "who/what/where/why questions", route: "/kids/games/reading/comprehension", status: "live" },
      { gameId: "eem-g20-new-words-from-reading", gameTitle: "New Words from Reading", moduleId: "eem-m10-comprehension-vocabulary", gameOrder: 4, desc: "discover vocabulary in context", route: "/kids/games/reading/new-words", status: "live" },
      { gameId: "eem-g20b-summarize-simply", gameTitle: "Summarize Simply", moduleId: "eem-m10-comprehension-vocabulary", gameOrder: 5, desc: "write simple summaries of stories", route: "/kids/games/reading/new-words", status: "live" },
      {
        gameId: "eem-g21-meaning-from-context",
        gameTitle: "Vocabulary Adventure",
        moduleId: "eem-m11-context-meaning-relations",
        gameOrder: 6,
        desc: "Match meanings, use context clues, and solve synonym-antonym word challenges.",
        route: "/free-games/word-meaning-flashcards",
        isFreeGame: true,
        status: "live",
      },
      { gameId: "eem-g22-synonym-antonym-hunt", gameTitle: "Synonym & Antonym Hunt", moduleId: "eem-m11-context-meaning-relations", gameOrder: 7, desc: "find similar/opposite words", comingSoon: true, status: "comingSoon" },
      { gameId: "eem-g23-crossword-from-reading", gameTitle: "Crossword from Reading", moduleId: "eem-m12-reading-crossword-recall", gameOrder: 8, desc: "puzzle based on passage", comingSoon: true, status: "comingSoon" },
    ],
  },
  {
    stageId: "eem-stage-5-grammar-practice",
    stageNumber: 5,
    stageTitle: stageTitleFromSharedCatalog("eem-stage-5-grammar-practice", "Grammar Practice"),
    stageOrder: 5,
    tiles: [
      {
        gameId: "eem-g15-better-sentences",
        gameTitle: "Build Better Sentences",
        title: "Build Better Sentences",
        moduleId: "eem-m07-grammar-correctness",
        gameOrder: 1,
        order: 1,
        desc: "build and improve clear, meaningful sentences",
        description: "build and improve clear, meaningful sentences",
        route: "/kids/games/grammar/build-better-sentences",
        status: "live",
        sampleItems: [
          {
            itemId: "gps-sample-01",
            stageId: "gps-1a-reorder-words",
            activityType: "reorder",
            prompt: ["is", "The cat", "sleeping"],
            answer: "The cat is sleeping.",
          },
          {
            itemId: "gps-sample-02",
            stageId: "gps-1c-choose-better-sentence",
            activityType: "chooseBest",
            prompt: "Choose the clearer sentence.",
            options: ["The boy ran.", "The boy ran to school quickly."],
            answer: 1,
          },
        ],
        stages: [
          {
            stageId: "gps-1a-reorder-words",
            title: "Reorder Words",
            skillFocus: "sentence-order",
            difficulty: "easy",
            activityType: "reorder",
            masteryTarget: { accuracyPct: 80, maxHints: 2 },
            hintMode: "guided",
            ...ACTIVITY_CONTENT_CONTRACTS.reorder,
          },
          {
            stageId: "gps-1b-fill-missing-word",
            title: "Fill Missing Word",
            skillFocus: "sentence-completion",
            difficulty: "easy",
            activityType: "fillBlank",
            masteryTarget: { accuracyPct: 80, maxHints: 2 },
            hintMode: "guided",
            ...ACTIVITY_CONTENT_CONTRACTS.fillBlank,
          },
          {
            stageId: "gps-1c-choose-better-sentence",
            title: "Choose Better Sentence",
            skillFocus: "sentence-quality",
            difficulty: "medium",
            activityType: "chooseBest",
            masteryTarget: { accuracyPct: 80, maxHints: 2 },
            hintMode: "standard",
            ...ACTIVITY_CONTENT_CONTRACTS.chooseBest,
          },
          {
            stageId: "gps-1d-expand-sentence",
            title: "Expand Sentence",
            skillFocus: "sentence-expansion",
            difficulty: "medium",
            activityType: "chooseBest",
            masteryTarget: { accuracyPct: 80, maxHints: 2 },
            hintMode: "standard",
            ...ACTIVITY_CONTENT_CONTRACTS.chooseBest,
          },
        ],
      },
      {
        gameId: "eem-g14-grammar-fix",
        gameTitle: "Grammar Fix",
        title: "Grammar Fix",
        moduleId: "eem-m07-grammar-correctness",
        gameOrder: 2,
        order: 2,
        unlockAfterGameId: "eem-g15-better-sentences",
        desc: "spot and fix sentence-level grammar errors",
        description: "spot and fix sentence-level grammar errors",
        route: "/kids/games/grammar/grammar-fix/spot-one-error",
        status: "live",
        sampleItems: [
          {
            itemId: "gpf-sample-01",
            stageId: "gpf-2a-spot-one-error",
            activityType: "errorSpot",
            prompt: "She go to school every day.",
            answer: "go",
          },
          {
            itemId: "gpf-sample-02",
            stageId: "gpf-2b-fix-one-error",
            activityType: "errorFix",
            prompt: "I saw elephant at the zoo.",
            answer: "I saw an elephant at the zoo.",
          },
        ],
        stages: [
          {
            stageId: "gpf-2a-spot-one-error",
            title: "Spot One Error",
            skillFocus: "grammar-identification",
            difficulty: "easy",
            activityType: "errorSpot",
            masteryTarget: { accuracyPct: 80, maxHints: 2 },
            hintMode: "guided",
            ...ACTIVITY_CONTENT_CONTRACTS.errorSpot,
          },
          {
            stageId: "gpf-2b-fix-one-error",
            title: "Fix One Error",
            skillFocus: "grammar-correction",
            difficulty: "medium",
            activityType: "errorFix",
            masteryTarget: { accuracyPct: 80, maxHints: 2 },
            hintMode: "standard",
            ...ACTIVITY_CONTENT_CONTRACTS.errorFix,
          },
          {
            stageId: "gpf-2c-fix-full-sentence",
            title: "Fix Full Sentence",
            skillFocus: "grammar-rewrite",
            difficulty: "medium",
            activityType: "errorFix",
            masteryTarget: { accuracyPct: 85, maxHints: 2 },
            hintMode: "standard",
            ...ACTIVITY_CONTENT_CONTRACTS.errorFix,
          },
          {
            stageId: "gpf-2d-timed-correction",
            title: "Timed Correction",
            skillFocus: "grammar-speed",
            difficulty: "hard",
            activityType: "errorSpot",
            masteryTarget: { accuracyPct: 85, maxHints: 1 },
            hintMode: "minimal",
            ...ACTIVITY_CONTENT_CONTRACTS.errorSpot,
          },
        ],
      },
      {
        gameId: "eem-g16-collocation-builder",
        gameTitle: "Collocation Builder",
        title: "Collocation Builder",
        moduleId: "eem-m08-expression-naturalness",
        gameOrder: 3,
        order: 3,
        unlockAfterGameId: "eem-g14-grammar-fix",
        desc: "learn words that naturally go together",
        description: "learn words that naturally go together",
        route: "/kids/games/grammar/collocation-builder/match-pairs",
        status: "live",
        sampleItems: [
          {
            itemId: "gcb-sample-01",
            stageId: "gcb-3a-match-pairs",
            activityType: "matchPairs",
            prompt: ["make", "do"],
            options: ["homework", "a mistake"],
            answer: [["make", "a mistake"], ["do", "homework"]],
          },
          {
            itemId: "gcb-sample-02",
            stageId: "gcb-3b-choose-natural-pair",
            activityType: "chooseBest",
            prompt: "Choose the natural pair.",
            options: ["strong rain", "heavy rain"],
            answer: 1,
          },
        ],
        stages: [
          {
            stageId: "gcb-3a-match-pairs",
            title: "Match Pairs",
            skillFocus: "collocation-match",
            difficulty: "easy",
            activityType: "matchPairs",
            masteryTarget: { accuracyPct: 80, maxHints: 2 },
            hintMode: "guided",
            ...ACTIVITY_CONTENT_CONTRACTS.matchPairs,
          },
          {
            stageId: "gcb-3b-choose-natural-pair",
            title: "Choose Natural Pair",
            skillFocus: "collocation-choice",
            difficulty: "medium",
            activityType: "chooseBest",
            masteryTarget: { accuracyPct: 80, maxHints: 2 },
            hintMode: "standard",
            ...ACTIVITY_CONTENT_CONTRACTS.chooseBest,
          },
          {
            stageId: "gcb-3c-fill-sentence",
            title: "Fill Sentence",
            skillFocus: "collocation-usage",
            difficulty: "medium",
            activityType: "fillBlank",
            masteryTarget: { accuracyPct: 80, maxHints: 2 },
            hintMode: "standard",
            ...ACTIVITY_CONTENT_CONTRACTS.fillBlank,
          },
          {
            stageId: "gcb-3d-context-choice",
            title: "Context Choice",
            skillFocus: "collocation-context",
            difficulty: "hard",
            activityType: "contextChoice",
            masteryTarget: { accuracyPct: 85, maxHints: 1 },
            hintMode: "minimal",
            ...ACTIVITY_CONTENT_CONTRACTS.contextChoice,
          },
        ],
      },
      {
        gameId: "eem-g17-idiom-in-a-sentence",
        gameTitle: "Idiom in a Sentence",
        moduleId: "eem-m08-expression-naturalness",
        gameOrder: 4,
        desc: "use idioms in the right context",
        comingSoon: true,
        status: "comingSoon",
      },
    ],
  },
  {
    stageId: "eem-stage-6-speak-confidence",
    stageNumber: 6,
    stageTitle: stageTitleFromSharedCatalog("eem-stage-6-speak-confidence", "Speak with Confidence"),
    stageOrder: 6,
    tiles: [
      { gameId: "eem-g24-picture-talk", gameTitle: "Picture Talk", moduleId: "eem-m13-speaking-expression", gameOrder: 1, desc: "describe what you see", comingSoon: true, status: "comingSoon" },
      { gameId: "eem-g25-read-and-say", gameTitle: "Read & Say", moduleId: "eem-m13-speaking-expression", gameOrder: 2, desc: "read aloud with expression", comingSoon: true, status: "comingSoon" },
      { gameId: "eem-g26-story-retell", gameTitle: "Story Retell", moduleId: "eem-m13-speaking-expression", gameOrder: 3, desc: "retell short stories", comingSoon: true, status: "comingSoon" },
      { gameId: "eem-g27-present-argument-timed", gameTitle: "Present an Argument – Timed", moduleId: "eem-m13-speaking-expression", gameOrder: 4, desc: "quick presentation", comingSoon: true, status: "comingSoon" },
    ],
  },
  {
    stageId: "eem-stage-7-review-championship",
    stageNumber: 7,
    stageTitle: stageTitleFromSharedCatalog("eem-stage-7-review-championship", "Review & Championship"),
    stageOrder: 7,
    tiles: [
      { gameId: "eem-g28-spaced-review-replay", gameTitle: "Spaced Review Replay", moduleId: "eem-m14-review-arena", gameOrder: 1, desc: "review past lessons", comingSoon: true, status: "comingSoon" },
      { gameId: "eem-g29-timed-round-quiz", gameTitle: "Timed Round Quiz", moduleId: "eem-m14-review-arena", gameOrder: 2, desc: "quiz against the clock", comingSoon: true, status: "comingSoon" },
      { gameId: "eem-g30-mixed-round-challenge", gameTitle: "Mixed Round Challenge", moduleId: "eem-m14-review-arena", gameOrder: 3, desc: "all skills mixed", comingSoon: true, status: "comingSoon" },
      { gameId: "eem-g31-general-knowledge-quick-quiz", gameTitle: "General Knowledge Quick Quiz", moduleId: "eem-m14-review-arena", gameOrder: 4, desc: "knowledge check", comingSoon: true, status: "comingSoon" },
      { gameId: "eem-g32-mock-test", gameTitle: "Mock Test", moduleId: "eem-m15-mock-championship", gameOrder: 5, desc: "full-length practice", comingSoon: true, status: "comingSoon" },
      { gameId: "eem-g33-championship-mode", gameTitle: "Championship Mode", moduleId: "eem-m15-mock-championship", gameOrder: 6, desc: "final achievement test", comingSoon: true, status: "comingSoon" },
    ],
  },
];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const getEnglishExcellenceTileId = (
  stageNumber: number,
  tileTitle: string,
  gameId?: string,
) => gameId || `${stageNumber}:${slugify(tileTitle)}`;

export const getEnglishExcellenceIcon = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes("tracing")) return "✍️";
  if (t.includes("balloon")) return "🎈";
  if (t.includes("sound") || t.includes("listening")) return "🔤";
  if (t.includes("blend")) return "🔗";
  if (t.includes("word")) return "📝";
  if (t.includes("sentence") || t.includes("fluency")) return "🧩";
  if (t.includes("read")) return "📖";
  if (t.includes("speak")) return "🗣️";
  return "✨";
};
