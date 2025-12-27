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

  // ✅ e: simple 2-stroke (bar, then anticlockwise c from bar end)
  e: {
    id: "e",
    label: "e",
    viewBox: "0 0 100 100",
    strokes: [
      // 1) bar (left -> right)
      { id: "e_1", kind: "trace", pathD: "M 34 52 L 64 52" },

      // 2) start exactly at bar end, draw anticlockwise c-shape
      {
        id: "e_2",
        kind: "trace",
        pathD:
          "M 64 52 " +
          "C 58 24, 34 28, 28 48 " + // go up/left
          "C 26 82, 48 92, 64 78",   // come down and finish lower-right (open)
      },
    ],
    skillTags: ["letter:e", "case:lower", "subtopic:tracing"],
  },

  // --------------------
  // F / f
  // --------------------
  F: {
    id: "F",
    label: "F",
    // ✅ IMPORTANT: if your other letters use a different viewBox (like "0 0 120 120"),
    // use the SAME value here for consistency.
    viewBox: "0 0 100 100",
    skillTags: ["letter:F", "sound:/f/"],
    strokes: [
      // Stroke 1: big down line
      { id: "F1", kind: "trace", pathD: "M 32 14 L 32 88" },
      // Stroke 2: top line
      { id: "F2", kind: "trace", pathD: "M 32 14 L 76 14" },
      // Stroke 3: middle line
      { id: "F3", kind: "trace", pathD: "M 32 50 L 64 50" },
    ],
  },

  f: {
  id: "f",
  label: "f",
  viewBox: "0 0 100 100",
  skillTags: ["letter:f", "sound:f", "case:lower"],
  strokes: [
    {
      id: "f-main",
      kind: "trace",
      // ✅ TOP CURVE IS ONLY THIS SMALL PART (then straight down)
      // Start point = (64,16)  → hook into stem at (50,28)
      pathD: "M 64 16 C 58 10 50 12 50 28 L 50 92",
    },
    {
      id: "f-bar",
      kind: "trace",
      // middle bar, left → right
      pathD: "M 34 54 L 66 54",
    },
  ],
},

  "G": {
    id: "G",
    label: "G",
    viewBox: "0 0 100 100",
    skillTags: ["letter:g", "sound:g", "case:upper"],
    strokes: [
      {
        id: "G-curve",
        kind: "trace",
        // Stroke 1: big curve (like C), start near top-right, go around, end near mid-right
        pathD: "M 70 30 C 60 18 42 18 32 30 C 22 44 22 60 32 74 C 42 86 60 86 70 74",
      },
      {
        id: "G-bar-down",
        kind: "trace",
        // Stroke 2: middle bar THEN a short vertical line DOWN at the end
        pathD: "M 48 56 L 72 56 L 72 94",
      },
    ],
  },

  "g": {
    id: "g",
    label: "g",
    viewBox: "0 0 100 140",
    skillTags: ["letter:g", "sound:g", "case:lower"],
    strokes: [
      {
        id: "g-bowl",
        kind: "trace",
        // Stroke 1: bowl (like 'o'), BUT end on the right side where the downstroke starts
pathD: "M 68 34 C 48 20, 28 32, 28 52 C 28 74, 52 82, 68 70",
      },
      {
        id: "g-tail",
        kind: "trace",
        // Stroke 2: downstroke + hook tail (descender)
pathD: "M 68 34 L 68 106 C 68 124 30 124 30 100",

      },
    ],
  },

  H: {
    id: "H",
    label: "H",
    viewBox: "0 0 100 100",
    strokes: [
      { id: "H_1", kind: "trace", pathD: "M 32 16 L 32 86" }, // left stem
      { id: "H_2", kind: "trace", pathD: "M 68 16 L 68 86" }, // right stem
      { id: "H_3", kind: "trace", pathD: "M 32 51 L 68 51" }, // middle bar
    ],
    skillTags: ["letter:h", "case:upper", "subtopic:tracing"],
  },

  h: {
    id: "h",
    label: "h",
    viewBox: "0 0 100 100",
    strokes: [
      { id: "h_1", kind: "trace", pathD: "M 40 16 L 40 86" }, // tall stem
      {
        id: "h_2",
        kind: "trace",
        // hump: start on stem midline, arch, then straight down to baseline
        pathD: "M 40 52 C 40 44, 66 46, 66 52 L 66 86",
      },
    ],
    skillTags: ["letter:h", "case:lower", "subtopic:tracing"],
  },
  I: {
    id: "I",
    label: "I",
    viewBox: "0 0 100 100",
     strokes: [
    // 1) standing line (top -> bottom) ✅ reduced height ~20%
    { id: "I_1", kind: "trace", pathD: "M 50 22 L 50 78" },

    // 2) top sleeping line (right -> left)
    { id: "I_2", kind: "trace", pathD: "M 34 22 L 66 22" },

    // 3) bottom sleeping line (right -> left)
    { id: "I_3", kind: "trace", pathD: "M 34 78 L 66 78" },
  ],
    skillTags: ["letter:i", "case:upper", "subtopic:tracing"],
  },

  i: {
    id: "i",
    label: "i",
    viewBox: "0 0 100 100",
    strokes: [
      // Stroke 1: stem
      { id: "i_1", kind: "trace", pathD: "M 50 40 L 50 86" },

      // Stroke 2: dot (tap)
      { id: "i_2", kind: "tap", pathD: "M 50 20" },
    ],
    skillTags: ["letter:i", "case:lower", "subtopic:tracing"],
  },

  J: {
    id: "J",
    label: "J",
    viewBox: "0 0 100 100",
    strokes: [
      // 1) top sleeping line (left -> right)
      { id: "J_1", kind: "trace", pathD: "M 40 18 L 85 18" },


      // 2) down + hook (start at top-right, curve to the left at bottom)

      { id: "J_2", kind: "trace", pathD: "M 62 18 L 62 70 C 62 90, 38 92, 34 72" },
    ],
    skillTags: ["letter:j", "case:upper", "subtopic:tracing"],
  },

  j: {
    id: "j",
    label: "j",
    // needs extra height because j goes below the baseline
    viewBox: "0 0 100 140",
    strokes: [
      // 1) stem + tail (descender) with a small left hook
      { id: "j_1", kind: "trace", pathD: "M 50 50 L 50 108 C 50 126, 22 126, 22 110" },

      // 2) dot (tap) — a bit higher for nice gap
      { id: "j_2", kind: "tap", pathD: "M 50 30" },
    ],
    skillTags: ["letter:j", "case:lower", "subtopic:tracing"],
  },

  K: {
    id: "K",
    label: "K",
    viewBox: "0 0 100 100",
    strokes: [
      // 1) main stem (top -> baseline)
      { id: "K_1", kind: "trace", pathD: "M 34 16 L 34 86" },

      // 2) upper arm (from middle -> top-right)
      { id: "K_2", kind: "trace", pathD: "M 74 18 L 34 52" },

      // 3) lower arm (from middle -> bottom-right)
      { id: "K_3", kind: "trace", pathD: "M 34 52 L 74 86" },
    ],
    skillTags: ["letter:k", "case:upper", "subtopic:tracing"],
  },

  k: {
    id: "k",
    label: "k",
    viewBox: "0 0 100 100",
    strokes: [
      // 1) tall stem (top -> baseline)
      { id: "k_1", kind: "trace", pathD: "M 40 16 L 40 86" },

      // 2) small upper arm (middle -> up-right)
      { id: "k_2", kind: "trace", pathD: "M 66 48 L 40 64" },

      // 3) lower leg (middle -> down-right)
      { id: "k_3", kind: "trace", pathD: "M 40 64 L 68 86" },
    ],
    skillTags: ["letter:k", "case:lower", "subtopic:tracing"],
  },
  L: {
    id: "L",
    label: "L",
    viewBox: "0 0 100 100",
    strokes: [
      // 1) standing line (top -> bottom)
      { id: "L_1", kind: "trace", pathD: "M 34 16 L 34 86" },

      // 2) bottom sleeping line (left -> right)
      { id: "L_2", kind: "trace", pathD: "M 34 86 L 76 86" },
    ],
    skillTags: ["letter:l", "case:upper", "subtopic:tracing"],
  },

  l: {
    id: "l",
    label: "l",
    viewBox: "0 0 100 100",
    strokes: [
      // 1) tall standing line (top -> bottom)
      { id: "l_1", kind: "trace", pathD: "M 50 16 L 50 86" },
    ],
    skillTags: ["letter:l", "case:lower", "subtopic:tracing"],
  },
  // Uppercase M
  M: {
    id: "M",
    label: "M",
    viewBox: "0 0 100 100",
    strokes: [
      { id: "M_1", kind: "trace", pathD: "M 24 16 L 24 86" },
      { id: "M_2", kind: "trace", pathD: "M 24 16 L 50 86" },
      { id: "M_3", kind: "trace", pathD: "M 50 86 L 76 16" },
      { id: "M_4", kind: "trace", pathD: "M 76 16 L 76 86" },
    ],
    skillTags: ["letter:m", "case:upper", "subtopic:tracing"],
  },

  // Lowercase m
  m: {
    id: "m",
    label: "m",
    viewBox: "0 0 100 100",
    strokes: [
      { id: "m_1", kind: "trace", pathD: "M 24 40 L 24 86" },
      { id: "m_2", kind: "trace", pathD: "M 24 52 C 20 44, 50 44, 50 52 L 50 86" },
      { id: "m_3", kind: "trace", pathD: "M 50 52 C 50 44, 76 44, 76 52 L 76 86" },
    ],
    skillTags: ["letter:m", "case:lower", "subtopic:tracing"],
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
  {
      levelId: 4,
      title: "Level 4",
      subtitle: "M–P",
      pairs: [{ upper: "M", lower: "m" }],
    },
  {
    levelId: 2,
    title: "Level 2",
    subtitle: "E–H",
    pairs: [
      { upper: "E", lower: "e" },
      { upper: "F", lower: "f" },
      { upper: "G", lower: "g" },
      { upper: "H", lower: "h" },
    ],
  },
  {
    levelId: 3,
    title: "Level 3",
    subtitle: "I–L",
    pairs: [
      { upper: "I", lower: "i" },
      { upper: "J", lower: "j" },
      { upper: "K", lower: "k" },
      { upper: "L", lower: "l" },
    ],
  },
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
