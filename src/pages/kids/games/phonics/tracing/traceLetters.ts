// src/pages/kids/games/phonics/tracing/traceLetters.ts
// A+B temporary build (no Hershey import) so we can verify tracing logic + pedagogy.
// ✅ a: 2-stroke (anticlockwise "c" shape, then straight downstroke on right)
// ✅ B: 3-stroke (spine, top belly, bottom belly)
// ✅ b: 2-stroke (downstroke, then OPEN belly curve like inverted "c" — not a circle)

export type LetterId = "A" | "a" | "B" | "b";

export type TraceStrokeKind = "trace" | "tap";

export type TraceStroke = {
  id: string;
  kind: TraceStrokeKind;
  /** SVG path. For tap strokes use: "M x y" */
  pathD: string;
  /** Optional trim window 0..1 used by LetterTracingGame sampling */
  startT?: number;
  endT?: number;
};

export type TraceLetter = {
  id: string;
  label: string;
  viewBox?: string;
  strokes: TraceStroke[];
  skillTags?: string[];
};

export type TracePair = { upper: LetterId; lower: LetterId };

export type PreTraceId = "line" | "slant" | "curve" | "zigzag";

// --------------------
// Pretrace (Level 0)
// --------------------
export const PRETRACE_LEVEL = {
  levelId: 0 as const,
  title: "Level 0 — Warm-up Tracing",
  subtitle: "Lines, slants, curves",
  items: ["line", "slant", "curve", "zigzag"] as PreTraceId[],
};

export const PRETRACE_ITEMS: Record<PreTraceId, TraceLetter> = {
  line: {
    id: "pre_line",
    label: "Straight line",
    viewBox: "0 0 100 100",
    strokes: [{ id: "line_1", kind: "trace", pathD: "M 20 50 L 80 50" }],
    skillTags: ["subtopic:pretracing", "shape:line"],
  },
  slant: {
    id: "pre_slant",
    label: "Slant line",
    viewBox: "0 0 100 100",
    strokes: [{ id: "slant_1", kind: "trace", pathD: "M 30 70 L 70 30" }],
    skillTags: ["subtopic:pretracing", "shape:slant"],
  },
  curve: {
    id: "pre_curve",
    label: "Curve",
    viewBox: "0 0 100 100",
    strokes: [{ id: "curve_1", kind: "trace", pathD: "M 25 60 C 40 20, 60 20, 75 60" }],
    skillTags: ["subtopic:pretracing", "shape:curve"],
  },
  zigzag: {
    id: "pre_zigzag",
    label: "Zigzag",
    viewBox: "0 0 100 100",
    strokes: [{ id: "zigzag_1", kind: "trace", pathD: "M 20 30 L 40 70 L 60 30 L 80 70" }],
    skillTags: ["subtopic:pretracing", "shape:zigzag"],
  },
};

// --------------------
// Letters (A, a, B, b)
// --------------------
export const TRACE_LETTERS: Record<LetterId, TraceLetter> = {
  // -------- A --------
  A: {
    id: "A",
    label: "A",
    viewBox: "0 0 100 100",
    strokes: [
      { id: "A_1", kind: "trace", pathD: "M 50 18 L 30 82" }, // left slant
      { id: "A_2", kind: "trace", pathD: "M 50 18 L 70 82" }, // right slant
      { id: "A_3", kind: "trace", pathD: "M 38 55 L 62 55" }, // crossbar
    ],
    skillTags: ["letter:A", "case:upper", "sound:/a/", "subtopic:tracing"],
  },

  // -------- a --------
  a: {
    id: "a",
    label: "a",
    viewBox: "0 0 100 100",
    strokes: [
      // Stroke 1: anticlockwise "c" (OPEN — not a closed circle)
      // Start near top, curve left/down/around, end near top-right (start/end nicely separated)
      {
        id: "a_1",
        kind: "trace",
        pathD:
          "M 50 34 " +
          "C 38 34, 32 46, 32 58 " + // go left + down
          "C 32 78, 56 86, 66 70 " + // round bottom
          "C 74 58, 72 40, 66 42", // finish near top-right (open end)
      },

      // Stroke 2: standing line from top-right down (kid handwriting)
      { id: "a_2", kind: "trace", pathD: "M 66 42 L 66 86" },
    ],
    skillTags: ["letter:a", "case:lower", "sound:/a/", "subtopic:tracing"],
  },

  // -------- B --------
  B: {
    id: "B",
    label: "B",
    viewBox: "0 0 100 100",
    strokes: [
      // Stroke 1: spine (top → bottom)
      { id: "B_1", kind: "trace", pathD: "M 35 18 L 35 82" },

      // Stroke 2: top belly (start at top of spine → end at mid of spine), open
      { id: "B_2", kind: "trace", pathD: "M 35 18 C 66 18, 70 28, 70 36 C 70 46, 60 46, 35 46" },

      // Stroke 3: bottom belly (start at mid of spine → end at bottom of spine), open
      { id: "B_3", kind: "trace", pathD: "M 35 46 C 68 46, 72 58, 72 66 C 72 80, 60 82, 35 82" },
    ],
    skillTags: ["letter:B", "case:upper", "sound:/b/", "subtopic:tracing"],
  },

  // -------- b --------
  b: {
    id: "b",
    label: "b",
    viewBox: "0 0 100 100",
    strokes: [
      // Stroke 1: long downstroke (top → bottom)
      { id: "b_1", kind: "trace", pathD: "M 45 16 L 45 86" },

      // Stroke 2: belly = OPEN curve (inverted "c"), NOT a circle/loop
      // Start at midline, curve out to the right, finish at bottom of the stem.
      {
        id: "b_2",
        kind: "trace",
        pathD: "M 45 50 C 78 50, 78 86, 45 86",
      },
    ],
    skillTags: ["letter:b", "case:lower", "sound:/b/", "subtopic:tracing"],
  },
};

// --------------------
// Levels
// --------------------
export const TRACE_LEVELS = [
  {
    levelId: 1,
    title: "Level 1",
    subtitle: "Trace Capital → Small",
    pairs: [
      { upper: "A" as const, lower: "a" as const },
      { upper: "B" as const, lower: "b" as const },
    ],
  },
];

export function getEnabledPairsForLevel(levelId: number): TracePair[] {
  const level = TRACE_LEVELS.find((l) => l.levelId === levelId);
  if (!level) return [];
  return (level.pairs ?? []).filter((p) => {
    const up = TRACE_LETTERS[p.upper];
    const lo = TRACE_LETTERS[p.lower];
    return Boolean(up?.strokes?.length && lo?.strokes?.length);
  });
}

export function isLevelReady(levelId: number): boolean {
  return getEnabledPairsForLevel(levelId).length > 0;
}

export function isLetterReady(letterId: LetterId): boolean {
  return Boolean(TRACE_LETTERS[letterId]?.strokes?.length);
}
