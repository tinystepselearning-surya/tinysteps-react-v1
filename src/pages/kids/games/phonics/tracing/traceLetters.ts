// src/pages/kids/games/phonics/tracing/traceLetters.ts

export type TraceStroke = {
  id: string; // "stroke1", "cross", "dot", etc.
  pathD: string; // centerline stroke path in the same viewBox
  startT?: number; // 0..1 (optional; default 0)
  endT?: number; // 0..1 (optional; default 1)
  kind?: "trace" | "tap"; // "tap" for dot strokes (i/j)
};

export type TraceLetter = {
  id: string;
  label: string;
  viewBox: string; // keep same for all
  strokes: TraceStroke[]; // stroke-by-stroke
  skillTags: string[];
};

export type LetterId =
  | "A" | "a"
  | "B" | "b"
  | "C" | "c"
  | "D" | "d"
  | "E" | "e"
  | "F" | "f"
  | "G" | "g"
  | "H" | "h"
  | "I" | "i"
  | "J" | "j"
  | "K" | "k"
  | "L" | "l"
  | "M" | "m"
  | "N" | "n"
  | "O" | "o"
  | "P" | "p"
  | "Q" | "q"
  | "R" | "r"
  | "S" | "s"
  | "T" | "t"
  | "U" | "u"
  | "V" | "v"
  | "W" | "w"
  | "X" | "x"
  | "Y" | "y"
  | "Z" | "z";

/**
 * Pre-tracing "shapes" are NOT letters, but we can reuse the same engine.
 * These IDs are separate from LetterId so your letter logic stays clean.
 */
export type PreTraceId =
  | "pre_line_vertical"
  | "pre_line_slant_right"
  | "pre_line_slant_left"
  | "pre_line_horizontal"
  | "pre_curve_c"
  | "pre_curve_u"
  | "pre_curve_s";

/**
 * Unified ID if you want Level 0 to use the exact same renderer later.
 */
export type TraceItemId = LetterId | PreTraceId;

/**
 * If later you decide to introduce capitals first and lowercase later,
 * `lower` being optional avoids fighting TypeScript.
 */
export type TracePair = { upper: LetterId; lower?: LetterId };

export type TraceLevel = {
  levelId: number; // 1..5 (letters)
  title: string;
  subtitle?: string;
  pairs: TracePair[];
};

/**
 * Level 0 plan (pre-tracing).
 * Keep separate so your current letter game doesn't break until you wire it in.
 */
export type PreTraceLevel = {
  levelId: 0;
  title: string;
  subtitle?: string;
  items: PreTraceId[];
};

const VB = "0 0 100 100";
const ST = 0.02;
const EN = 0.98;

/**
 * ✅ Level 0 — Pre-tracing strokes (lines + curves)
 * - All paths start where the child should start (top→bottom for vertical/slants).
 * - All are single-stroke "trace" (no taps).
 */
export const PRETRACE_ITEMS: Record<PreTraceId, TraceLetter> = {
  pre_line_vertical: {
    id: "pre_line_vertical",
    label: "Line (Down)",
    viewBox: VB,
    strokes: [
      { id: "down", kind: "trace", startT: ST, endT: EN, pathD: "M 50 14 L 50 90" },
    ],
    skillTags: ["subtopic:pretracing", "shape:line", "direction:down"],
  },

  pre_line_slant_right: {
    id: "pre_line_slant_right",
    label: "Slant (Down ↘)",
    viewBox: VB,
    strokes: [
      // top-left to bottom-right
      { id: "slant", kind: "trace", startT: ST, endT: EN, pathD: "M 35 18 L 70 90" },
    ],
    skillTags: ["subtopic:pretracing", "shape:slant", "direction:down_right"],
  },

  pre_line_slant_left: {
    id: "pre_line_slant_left",
    label: "Slant (Down ↙)",
    viewBox: VB,
    strokes: [
      // top-right to bottom-left
      { id: "slant", kind: "trace", startT: ST, endT: EN, pathD: "M 65 18 L 30 90" },
    ],
    skillTags: ["subtopic:pretracing", "shape:slant", "direction:down_left"],
  },

  pre_line_horizontal: {
    id: "pre_line_horizontal",
    label: "Line (Across)",
    viewBox: VB,
    strokes: [
      { id: "across", kind: "trace", startT: ST, endT: EN, pathD: "M 20 55 L 80 55" },
    ],
    skillTags: ["subtopic:pretracing", "shape:line", "direction:across"],
  },

  pre_curve_c: {
    id: "pre_curve_c",
    label: "Curve (C)",
    viewBox: VB,
    strokes: [
      // start top-right and curve down (easy "C" motion)
      {
        id: "curve",
        kind: "trace",
        startT: ST,
        endT: EN,
        pathD: "M 68 26 C 54 14, 30 20, 28 46 C 26 72, 52 86, 68 74",
      },
    ],
    skillTags: ["subtopic:pretracing", "shape:curve", "pattern:c"],
  },

  pre_curve_u: {
    id: "pre_curve_u",
    label: "Curve (U)",
    viewBox: VB,
    strokes: [
      // start top-left, go down, round bottom, up to top-right
      {
        id: "curve",
        kind: "trace",
        startT: ST,
        endT: EN,
        pathD: "M 35 22 C 34 70, 66 70, 65 22",
      },
    ],
    skillTags: ["subtopic:pretracing", "shape:curve", "pattern:u"],
  },

  pre_curve_s: {
    id: "pre_curve_s",
    label: "Curve (S)",
    viewBox: VB,
    strokes: [
      // gentle "S" wave from top to bottom
      {
        id: "curve",
        kind: "trace",
        startT: ST,
        endT: EN,
        pathD: "M 70 26 C 55 10, 30 18, 34 36 C 38 52, 64 46, 66 62 C 68 84, 40 90, 30 76",
      },
    ],
    skillTags: ["subtopic:pretracing", "shape:curve", "pattern:s"],
  },
};

export const PRETRACE_LEVEL: PreTraceLevel = {
  levelId: 0,
  title: "Level 0 — Pre-tracing",
  subtitle: "Straight lines and easy curves (get finger control ready)",
  items: [
    "pre_line_vertical",
    "pre_line_slant_right",
    "pre_line_slant_left",
    "pre_line_horizontal",
    "pre_curve_c",
    "pre_curve_u",
    "pre_curve_s",
  ],
};

/**
 * Level plan (Aa pairs).
 * You can reorder anytime without touching the tracing engine.
 */
export const TRACE_LEVELS: TraceLevel[] = [
  {
    levelId: 1,
    title: "Level 1 — Starter strokes",
    subtitle: "Mostly straight + simple curves",
    pairs: [
      { upper: "A", lower: "a" },
      { upper: "I", lower: "i" },
      { upper: "L", lower: "l" },
      { upper: "T", lower: "t" },
      { upper: "E", lower: "e" },
    ],
  },
  {
    levelId: 2,
    title: "Level 2 — Straight + easy joins",
    subtitle: "More lines, simple humps",
    pairs: [
      { upper: "H", lower: "h" },
      { upper: "F", lower: "f" },
      { upper: "K", lower: "k" },
      { upper: "M", lower: "m" },
      { upper: "N", lower: "n" },
    ],
  },
  {
    levelId: 3,
    title: "Level 3 — Round letters",
    subtitle: "Big curves + easy tails",
    pairs: [
      { upper: "O", lower: "o" },
      { upper: "C", lower: "c" },
      { upper: "G", lower: "g" },
      { upper: "Q", lower: "q" },
      { upper: "S", lower: "s" },
    ],
  },
  {
    levelId: 4,
    title: "Level 4 — Mixed curves + diagonals",
    subtitle: "A bit harder shapes",
    pairs: [
      { upper: "U", lower: "u" },
      { upper: "V", lower: "v" },
      { upper: "W", lower: "w" },
      { upper: "X", lower: "x" },
      { upper: "Y", lower: "y" },
    ],
  },
  {
    levelId: 5,
    title: "Level 5 — Tricky shapes",
    subtitle: "More turns / less common forms",
    pairs: [
      { upper: "B", lower: "b" },
      { upper: "D", lower: "d" },
      { upper: "P", lower: "p" },
      { upper: "R", lower: "r" },
      { upper: "J", lower: "j" },
      { upper: "Z", lower: "z" },
    ],
  },
];

/**
 * Enabled letter tracing data (partial).
 * Add more letters any time — levels will automatically unlock as pairs become available.
 *
 * ✅ CRITICAL RULES:
 * - For TRACE strokes, the path MUST start where the child should begin (usually top/left).
 * - For TAP strokes, pathD MUST be exactly "M x y" (single point).
 * - All paths should flow naturally (top→bottom, left→right).
 * - startT and endT should be consistent (ST and EN constants).
 */
export const TRACE_LETTERS: Partial<Record<LetterId, TraceLetter>> = {
  // -------------------------
  // Level 1 (enabled)
  // -------------------------

  A: {
    id: "A",
    label: "A",
    viewBox: VB,
    strokes: [
      // ✅ CORRECTED: Stroke 1 goes from TOP to BOTTOM-LEFT (natural downward motion)
      { id: "left", kind: "trace", startT: ST, endT: EN, pathD: "M 50 14 L 30 88" },
      // ✅ Stroke 2 goes from TOP to BOTTOM-RIGHT (natural downward motion)
      { id: "right", kind: "trace", startT: ST, endT: EN, pathD: "M 50 14 L 70 88" },
      // ✅ Crossbar goes left to right
      { id: "cross", kind: "trace", startT: ST, endT: EN, pathD: "M 38 56 L 62 56" },
    ],
    skillTags: ["letter:A", "case:upper", "subtopic:tracing"],
  },

  a: {
    id: "a",
    label: "a",
    viewBox: VB,
    strokes: [
      // ✅ Simplified circle - starts at top-right, goes counterclockwise
      {
        id: "circle",
        kind: "trace",
        startT: ST,
        endT: EN,
        pathD: "M 62 42 C 58 30, 40 30, 34 40 C 28 50, 30 64, 46 66 C 62 68, 66 56, 62 46",
      },
      // ✅ Down stroke on the right side
      { id: "down", kind: "trace", startT: ST, endT: EN, pathD: "M 62 44 L 62 84" },
    ],
    skillTags: ["letter:a", "case:lower", "subtopic:tracing"],
  },

  I: {
    id: "I",
    label: "I",
    viewBox: VB,
    strokes: [
      { id: "top", kind: "trace", startT: ST, endT: EN, pathD: "M 38 18 L 62 18" },
      { id: "down", kind: "trace", startT: ST, endT: EN, pathD: "M 50 18 L 50 88" },
      { id: "bottom", kind: "trace", startT: ST, endT: EN, pathD: "M 38 88 L 62 88" },
    ],
    skillTags: ["letter:I", "case:upper", "subtopic:tracing"],
  },

  i: {
    id: "i",
    label: "i",
    viewBox: VB,
    strokes: [
      { id: "main", kind: "trace", startT: ST, endT: EN, pathD: "M 50 34 L 50 86" },
      { id: "dot", kind: "tap", pathD: "M 50 20" },
    ],
    skillTags: ["letter:i", "case:lower", "subtopic:tracing"],
  },

  L: {
    id: "L",
    label: "L",
    viewBox: VB,
    strokes: [
      { id: "down", kind: "trace", startT: ST, endT: EN, pathD: "M 40 16 L 40 88" },
      { id: "base", kind: "trace", startT: ST, endT: EN, pathD: "M 40 88 L 68 88" },
    ],
    skillTags: ["letter:L", "case:upper", "subtopic:tracing"],
  },

  l: {
    id: "l",
    label: "l",
    viewBox: VB,
    strokes: [
      { id: "down", kind: "trace", startT: ST, endT: EN, pathD: "M 50 14 L 50 90" },
    ],
    skillTags: ["letter:l", "case:lower", "subtopic:tracing"],
  },

  T: {
    id: "T",
    label: "T",
    viewBox: VB,
    strokes: [
      { id: "top", kind: "trace", startT: ST, endT: EN, pathD: "M 32 18 L 68 18" },
      { id: "down", kind: "trace", startT: ST, endT: EN, pathD: "M 50 18 L 50 90" },
    ],
    skillTags: ["letter:T", "case:upper", "subtopic:tracing"],
  },

  t: {
    id: "t",
    label: "t",
    viewBox: VB,
    strokes: [
      { id: "down", kind: "trace", startT: ST, endT: EN, pathD: "M 52 16 L 52 88" },
      { id: "cross", kind: "trace", startT: ST, endT: EN, pathD: "M 34 40 L 70 40" },
    ],
    skillTags: ["letter:t", "case:lower", "subtopic:tracing"],
  },

  E: {
    id: "E",
    label: "E",
    viewBox: VB,
    strokes: [
      { id: "spine", kind: "trace", startT: ST, endT: EN, pathD: "M 40 16 L 40 90" },
      { id: "top", kind: "trace", startT: ST, endT: EN, pathD: "M 40 16 L 70 16" },
      { id: "mid", kind: "trace", startT: ST, endT: EN, pathD: "M 40 54 L 64 54" },
      { id: "bottom", kind: "trace", startT: ST, endT: EN, pathD: "M 40 90 L 70 90" },
    ],
    skillTags: ["letter:E", "case:upper", "subtopic:tracing"],
  },

  e: {
    id: "e",
    label: "e",
    viewBox: VB,
    strokes: [
      {
        id: "main",
        kind: "trace",
        startT: ST,
        endT: EN,
        pathD: "M 34 52 L 66 52 C 66 36, 54 28, 42 30 C 30 32, 26 44, 28 56 C 30 70, 42 78, 56 76 C 66 74, 70 68, 70 62",
      },
    ],
    skillTags: ["letter:e", "case:lower", "subtopic:tracing"],
  },

  // -------------------------
  // Extra enabled (S/s) for curvy letter testing
  // -------------------------

  S: {
    id: "S",
    label: "S",
    viewBox: VB,
    strokes: [
      {
        id: "curve",
        kind: "trace",
        startT: ST,
        endT: EN,
        pathD: "M 70 24 C 58 10, 34 12, 30 28 C 26 42, 42 48, 52 52 C 70 58, 76 66, 72 78 C 68 94, 40 92, 30 82",
      },
    ],
    skillTags: ["letter:S", "case:upper", "subtopic:tracing"],
  },

  s: {
    id: "s",
    label: "s",
    viewBox: VB,
    strokes: [
      {
        id: "curve",
        kind: "trace",
        startT: ST,
        endT: EN,
        pathD: "M 68 24 C 60 12, 36 12, 30 26 C 24 38, 32 46, 48 50 C 64 54, 72 60, 70 72 C 68 88, 44 88, 32 78",
      },
    ],
    skillTags: ["letter:s", "case:lower", "subtopic:tracing"],
  },
};

/**
 * Convenience helpers for UI.
 */
export const TRACE_LETTER_IDS = Object.keys(TRACE_LETTERS) as LetterId[];

export const isLetterEnabled = (id: LetterId) => Boolean(TRACE_LETTERS[id]);

/** Pair is "ready" if upper exists and (if lower exists) lower exists too. */
export const isPairEnabled = (pair: TracePair) =>
  Boolean(pair.upper && TRACE_LETTERS[pair.upper] && (!pair.lower || TRACE_LETTERS[pair.lower]));

/** Get all enabled pairs for a level */
export const getEnabledPairsForLevel = (levelId: number): TracePair[] => {
  const level = TRACE_LEVELS.find((lv) => lv.levelId === levelId);
  if (!level) return [];
  return level.pairs.filter(isPairEnabled);
};

/** Check if a level is ready (at least one pair available) */
export const isLevelReady = (levelId: number): boolean => {
  return getEnabledPairsForLevel(levelId).length > 0;
};
