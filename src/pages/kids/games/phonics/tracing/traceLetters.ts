// src/pages/kids/games/phonics/tracing/traceLetters.ts
// Pure TS data/types ONLY (no JSX). If you put JSX here, Vite will crash.

type BaseStroke = {
  id: string;
  pathD: string;
  // Optional trimming window used by the game sampler.
  // Keep on BOTH variants so TS never complains in the game file.
  startT?: number;
  endT?: number;
};

export type TraceStroke =
  | (BaseStroke & { kind: "trace" })
  | (BaseStroke & { kind: "tap" }); // tap uses "M x y"

export type TraceLetter = {
  id: string;
  label: string;
  viewBox?: string;
  strokes: TraceStroke[];
  skillTags?: string[];
};

export const LETTER_IDS = [
  "A","a","B","b","C","c","D","d",
  "E","e","F","f","G","g","H","h",
  "I","i","J","j","K","k","L","l",
  "M","m","N","n","O","o","P","p",
  "Q","q","R","r","S","s","T","t",
  "U","u","V","v","W","w","X","x",
  "Y","y","Z","z",
] as const;

export type LetterId = (typeof LETTER_IDS)[number];

export type TracePair = { upper: LetterId; lower?: LetterId };

export type PreTraceId = "line" | "curve" | "circle";

export const PRETRACE_LEVEL = {
  levelId: 0 as const,
  title: "Level 0 — Warm-up Tracing",
  subtitle: "Lines, curves, circles",
  items: ["line", "curve", "circle"] as PreTraceId[],
};

export const PRETRACE_ITEMS: Record<PreTraceId, TraceLetter> = {
  line: {
    id: "pre_line",
    label: "Straight line",
    viewBox: "0 0 100 100",
    strokes: [{ id: "line_1", kind: "trace", pathD: "M 50 18 L 50 88" }],
    skillTags: ["subtopic:pretracing", "shape:line"],
  },
  curve: {
    id: "pre_curve",
    label: "Curve",
    viewBox: "0 0 100 100",
    strokes: [
      {
        id: "curve_1",
        kind: "trace",
        pathD: "M 72 26 C 44 18, 26 34, 26 54 C 26 78, 52 90, 72 74",
      },
    ],
    skillTags: ["subtopic:pretracing", "shape:curve"],
  },
  circle: {
    id: "pre_circle",
    label: "Circle",
    viewBox: "0 0 100 100",
    strokes: [
      {
        id: "circle_1",
        kind: "trace",
        pathD:
          "M 70 34 C 58 18, 34 20, 26 38 C 18 56, 26 80, 48 84 C 72 88, 84 62, 76 44 C 74 40, 72 36, 70 34",
      },
    ],
    skillTags: ["subtopic:pretracing", "shape:circle"],
  },
};

// --------------------
// Letters (manual, kid-friendly) — Level 1 only for now
// Baseline ≈ y=86 (so bowls end cleanly on the lower line).
// --------------------
export const TRACE_LETTERS: Partial<Record<LetterId, TraceLetter>> = {
  // ✅ A: stroke 1 starts at TOP (start point = first "M")
  A: {
    id: "A",
    label: "A",
    viewBox: "0 0 100 100",
    strokes: [
      { id: "A_1", kind: "trace", pathD: "M 50 18 L 30 88" }, // top -> bottom
      { id: "A_2", kind: "trace", pathD: "M 50 18 L 70 88" }, // top -> bottom
      { id: "A_3", kind: "trace", pathD: "M 38 58 L 62 58" }, // bar
    ],
    skillTags: ["letter:a", "case:upper", "subtopic:tracing"],
  },

  // ✅ a: make bowl curve like "c" (two smooth cubics) AND end at baseline + same x as stem
  a: {
    id: "a",
    label: "a",
    viewBox: "0 0 100 100",
    strokes: [
      {
        id: "a_1",
        kind: "trace",
        // Smooth "c-like" bowl, OPEN on right, ends at (68,86) to meet lower line
        pathD: "M 68 40 C 48 24, 28 36, 28 58 C 28 84, 52 92, 68 86",
      },
      {
        id: "a_2",
        kind: "trace",
        // Right stem: EXACT same x=68 and ends at y=86 so it joins perfectly
        pathD: "M 68 40 L 68 86",
      },
    ],
    skillTags: ["letter:a", "case:lower", "subtopic:tracing"],
  },

  B: {
    id: "B",
    label: "B",
    viewBox: "0 0 100 100",
    strokes: [
      { id: "B_1", kind: "trace", pathD: "M 32 16 L 32 86" },
      { id: "B_2", kind: "trace", pathD: "M 32 16 C 74 16, 74 46, 32 46" },
      { id: "B_3", kind: "trace", pathD: "M 32 46 C 78 46, 78 86, 32 86" },
    ],
    skillTags: ["letter:b", "case:upper", "subtopic:tracing"],
  },

  // ✅ b: belly must meet the lower line (baseline) + return to stem cleanly
  b: {
    id: "b",
    label: "b",
    viewBox: "0 0 100 100",
    strokes: [
      { id: "b_1", kind: "trace", pathD: "M 40 16 L 40 86" }, // stem ends at baseline
      {
        id: "b_2",
        kind: "trace",
        // Start on stem (40,52) and end on stem at baseline (40,86)
        // Two-cubic style (smoother than the old “messy” one)
        pathD: "M 40 52 C 68 48, 78 64, 74 76 C 70 92, 52 94, 40 86",
      },
    ],
    skillTags: ["letter:b", "case:lower", "subtopic:tracing"],
  },

  C: {
    id: "C",
    label: "C",
    viewBox: "0 0 100 100",
    strokes: [
      { id: "C_1", kind: "trace", pathD: "M 72 28 C 48 12, 24 28, 24 52 C 24 78, 52 92, 72 74" },
    ],
    skillTags: ["letter:c", "case:upper", "subtopic:tracing"],
  },

  // ✅ c (your good reference curve — keep as-is)
  c: {
    id: "c",
    label: "c",
    viewBox: "0 0 100 100",
    strokes: [
      { id: "c_1", kind: "trace", pathD: "M 68 34 C 48 20, 28 32, 28 52 C 28 74, 52 82, 68 70" },
    ],
    skillTags: ["letter:c", "case:lower", "subtopic:tracing"],
  },

  D: {
    id: "D",
    label: "D",
    viewBox: "0 0 100 100",
    strokes: [
      { id: "D_1", kind: "trace", pathD: "M 34 16 L 34 86" },
      {
        id: "D_2",
        kind: "trace",
        pathD: "M 34 16 C 78 16, 86 30, 86 51 C 86 72, 78 86, 34 86",
      },
    ],
    skillTags: ["letter:d", "case:upper", "subtopic:tracing"],
  },

  // ✅ d: bowl like "c" AND end at baseline (66,86) + stem shares same x + same bottom y
  d: {
    id: "d",
    label: "d",
    viewBox: "0 0 100 100",
    strokes: [
      {
        id: "d_1",
        kind: "trace",
        // Smooth open bowl, endpoints on x=66; ends at baseline y=86
        pathD: "M 66 48 C 46 34, 28 46, 28 66 C 28 86, 50 94, 66 86",
      },
      {
        id: "d_2",
        kind: "trace",
        // stem exactly x=66, ends exactly y=86 so bowl meets perfectly
        pathD: "M 66 16 L 66 86",
      },
    ],
    skillTags: ["letter:d", "case:lower", "subtopic:tracing"],
  },

  // ✅ E: 4 strokes (vertical + top/middle/bottom bars)
  E: {
    id: "E",
    label: "E",
    viewBox: "0 0 100 100",
    strokes: [
      { id: "E_1", kind: "trace", pathD: "M 34 16 L 34 86" }, // spine
      { id: "E_2", kind: "trace", pathD: "M 34 16 L 74 16" }, // top bar
      { id: "E_3", kind: "trace", pathD: "M 34 51 L 66 51" }, // middle bar
      { id: "E_4", kind: "trace", pathD: "M 34 86 L 74 86" }, // bottom bar (baseline)
    ],
    skillTags: ["letter:e", "case:upper", "subtopic:tracing"],
  },

  // ✅ e: "c-like" bowl + small cross stroke (simple handwriting-style)
  e: {
    id: "e",
    label: "e",
    viewBox: "0 0 100 100",
    strokes: [
      {
        id: "e_1",
        kind: "trace",
        // Start near middle-right, loop like a "c", finish at baseline (66,86)
        pathD: "M 66 52 C 58 40, 38 40, 32 56 C 24 78, 46 94, 66 86 C 78 80, 78 64, 66 60 C 54 56, 42 60, 42 68",
      },
      {
        id: "e_2",
        kind: "trace",
        // Small top stroke (like writing e)
        pathD: "M 34 54 L 62 54",
      },
    ],
    skillTags: ["letter:e", "case:lower", "subtopic:tracing"],
  },
};



// --------------------
// Levels
// --------------------
export type TraceLevel = {
  levelId: number;
  title: string;
  subtitle?: string;
  pairs: TracePair[];
};

export const TRACE_LEVELS: TraceLevel[] = [
  {
    levelId: 1,
    title: "Level 1",
    subtitle: "A–D",
    pairs: [
      { upper: "A", lower: "a" },
      { upper: "B", lower: "b" },
      { upper: "C", lower: "c" },
      { upper: "D", lower: "d" },
    ],
  },
  { levelId: 2, title: "Level 2", subtitle: "E–H", pairs: [{ upper: "E", lower: "e" }] },
  { levelId: 3, title: "Level 3", subtitle: "I–L", pairs: [] },
  { levelId: 4, title: "Level 4", subtitle: "M–P", pairs: [] },
  { levelId: 5, title: "Level 5", subtitle: "Q–Z", pairs: [] },
];

export function isLetterReady(letterId: LetterId): boolean {
  const l = TRACE_LETTERS[letterId];
  return Boolean(l?.strokes?.length);
}

export function getEnabledPairsForLevel(levelId: number): TracePair[] {
  const lv = TRACE_LEVELS.find((x) => x.levelId === levelId);
  if (!lv) return [];
  return (lv.pairs ?? []).filter((p) => {
    const upOk = isLetterReady(p.upper);
    const loOk = p.lower ? isLetterReady(p.lower) : true;
    return upOk && loOk;
  });
}

export function isLevelReady(levelId: number): boolean {
  if (levelId === 0) return true;
  return getEnabledPairsForLevel(levelId).length > 0;
}
