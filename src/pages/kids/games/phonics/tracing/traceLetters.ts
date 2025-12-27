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
export const TRACE_LETTERS: Partial<Record<LetterId, TraceLetter>> = {
  // ✅ A: stroke 1 starts at TOP (start point = first "M")
  A: {
    id: "A",
    label: "A",
    viewBox: "0 0 100 100",
    strokes: [
      { id: "A_1", kind: "trace", pathD: "M 50 18 L 30 88" },
      { id: "A_2", kind: "trace", pathD: "M 50 18 L 70 88" },
      { id: "A_3", kind: "trace", pathD: "M 38 58 L 62 58" },
    ],
    skillTags: ["letter:a", "case:upper", "subtopic:tracing"],
  },

  a: {
    id: "a",
    label: "a",
    viewBox: "0 0 100 100",
    strokes: [
      { id: "a_1", kind: "trace", pathD: "M 68 40 C 48 24, 28 36, 28 58 C 28 84, 52 92, 68 86" },
      { id: "a_2", kind: "trace", pathD: "M 68 40 L 68 86" },
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

  b: {
    id: "b",
    label: "b",
    viewBox: "0 0 100 100",
    strokes: [
      { id: "b_1", kind: "trace", pathD: "M 40 16 L 40 86" },
      { id: "b_2", kind: "trace", pathD: "M 40 52 C 68 48, 78 64, 74 76 C 70 92, 52 94, 40 86" },
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
      { id: "D_2", kind: "trace", pathD: "M 34 16 C 78 16, 86 30, 86 51 C 86 72, 78 86, 34 86" },
    ],
    skillTags: ["letter:d", "case:upper", "subtopic:tracing"],
  },

  d: {
    id: "d",
    label: "d",
    viewBox: "0 0 100 100",
    strokes: [
            { id: "d_2", kind: "trace", pathD: "M 66 16 L 66 86" },
      { id: "d_1", kind: "trace", pathD: "M 66 48 C 46 34, 28 46, 28 66 C 28 86, 50 94, 66 86" },
    ],
    skillTags: ["letter:d", "case:lower", "subtopic:tracing"],
  },

  E: {
    id: "E",
    label: "E",
    viewBox: "0 0 100 100",
    strokes: [
      { id: "E_1", kind: "trace", pathD: "M 34 16 L 34 86" },
      { id: "E_2", kind: "trace", pathD: "M 34 16 L 74 16" },
      { id: "E_3", kind: "trace", pathD: "M 34 51 L 66 51" },
      { id: "E_4", kind: "trace", pathD: "M 34 86 L 74 86" },
    ],
    skillTags: ["letter:e", "case:upper", "subtopic:tracing"],
  },

  e: {
    id: "e",
    label: "e",
    viewBox: "0 0 100 100",
    strokes: [
      { id: "e_1", kind: "trace", pathD: "M 34 52 L 64 52" },
      {
        id: "e_2",
        kind: "trace",
        pathD:
          "M 64 52 " +
          "C 58 24, 34 28, 28 48 " +
          "C 26 82, 48 92, 64 78",
      },
    ],
    skillTags: ["letter:e", "case:lower", "subtopic:tracing"],
  },

  F: {
    id: "F",
    label: "F",
    viewBox: "0 0 100 100",
    skillTags: ["letter:F", "sound:/f/"],
    strokes: [
      { id: "F1", kind: "trace", pathD: "M 32 14 L 32 88" },
      { id: "F2", kind: "trace", pathD: "M 32 14 L 76 14" },
      { id: "F3", kind: "trace", pathD: "M 32 50 L 64 50" },
    ],
  },

  f: {
    id: "f",
    label: "f",
    viewBox: "0 0 100 100",
    skillTags: ["letter:f", "sound:f", "case:lower"],
    strokes: [
      { id: "f-main", kind: "trace", pathD: "M 64 16 C 58 10 50 12 50 28 L 50 92" },
      { id: "f-bar", kind: "trace", pathD: "M 34 54 L 66 54" },
    ],
  },

  G: {
    id: "G",
    label: "G",
    viewBox: "0 0 100 100",
    skillTags: ["letter:g", "sound:g", "case:upper"],
    strokes: [
      { id: "G-curve", kind: "trace", pathD: "M 70 30 C 60 18 42 18 32 30 C 22 44 22 60 32 74 C 42 86 60 86 70 74" },
      { id: "G-bar-down", kind: "trace", pathD: "M 48 56 L 72 56 L 72 94" },
    ],
  },

  g: {
    id: "g",
    label: "g",
    viewBox: "0 0 100 140",
    skillTags: ["letter:g", "sound:g", "case:lower"],
    strokes: [
      { id: "g-bowl", kind: "trace", pathD: "M 68 34 C 48 20, 28 32, 28 52 C 28 74, 52 82, 68 70" },
      { id: "g-tail", kind: "trace", pathD: "M 68 34 L 68 106 C 68 124 30 124 30 100" },
    ],
  },

  H: {
    id: "H",
    label: "H",
    viewBox: "0 0 100 100",
    strokes: [
      { id: "H_1", kind: "trace", pathD: "M 32 16 L 32 86" },
      { id: "H_2", kind: "trace", pathD: "M 68 16 L 68 86" },
      { id: "H_3", kind: "trace", pathD: "M 32 51 L 68 51" },
    ],
    skillTags: ["letter:h", "case:upper", "subtopic:tracing"],
  },

  h: {
    id: "h",
    label: "h",
    viewBox: "0 0 100 100",
    strokes: [
      { id: "h_1", kind: "trace", pathD: "M 40 16 L 40 86" },
      { id: "h_2", kind: "trace", pathD: "M 40 52 C 40 44, 66 46, 66 52 L 66 86" },
    ],
    skillTags: ["letter:h", "case:lower", "subtopic:tracing"],
  },

  I: {
    id: "I",
    label: "I",
    viewBox: "0 0 100 100",
    strokes: [
      { id: "I_1", kind: "trace", pathD: "M 50 22 L 50 78" },
      { id: "I_2", kind: "trace", pathD: "M 34 22 L 66 22" },
      { id: "I_3", kind: "trace", pathD: "M 34 78 L 66 78" },
    ],
    skillTags: ["letter:i", "case:upper", "subtopic:tracing"],
  },

  i: {
    id: "i",
    label: "i",
    viewBox: "0 0 100 100",
    strokes: [
      { id: "i_1", kind: "trace", pathD: "M 50 40 L 50 86" },
      { id: "i_2", kind: "tap", pathD: "M 50 20" },
    ],
    skillTags: ["letter:i", "case:lower", "subtopic:tracing"],
  },

  J: {
    id: "J",
    label: "J",
    viewBox: "0 0 100 100",
    strokes: [
      { id: "J_1", kind: "trace", pathD: "M 40 18 L 85 18" },
      { id: "J_2", kind: "trace", pathD: "M 62 18 L 62 70 C 62 90, 38 92, 34 72" },
    ],
    skillTags: ["letter:j", "case:upper", "subtopic:tracing"],
  },

  j: {
    id: "j",
    label: "j",
    viewBox: "0 0 100 140",
    strokes: [
      { id: "j_1", kind: "trace", pathD: "M 50 50 L 50 108 C 50 126, 22 126, 22 110" },
      { id: "j_2", kind: "tap", pathD: "M 50 30" },
    ],
    skillTags: ["letter:j", "case:lower", "subtopic:tracing"],
  },

  K: {
    id: "K",
    label: "K",
    viewBox: "0 0 100 100",
    strokes: [
      { id: "K_1", kind: "trace", pathD: "M 34 16 L 34 86" },
      { id: "K_2", kind: "trace", pathD: "M 74 18 L 34 52" },
      { id: "K_3", kind: "trace", pathD: "M 34 52 L 74 86" },
    ],
    skillTags: ["letter:k", "case:upper", "subtopic:tracing"],
  },

  k: {
    id: "k",
    label: "k",
    viewBox: "0 0 100 100",
    strokes: [
      { id: "k_1", kind: "trace", pathD: "M 40 16 L 40 86" },
      { id: "k_2", kind: "trace", pathD: "M 66 48 L 40 64" },
      { id: "k_3", kind: "trace", pathD: "M 40 64 L 68 86" },
    ],
    skillTags: ["letter:k", "case:lower", "subtopic:tracing"],
  },

  L: {
    id: "L",
    label: "L",
    viewBox: "0 0 100 100",
    strokes: [
      { id: "L_1", kind: "trace", pathD: "M 34 16 L 34 86" },
      { id: "L_2", kind: "trace", pathD: "M 34 86 L 76 86" },
    ],
    skillTags: ["letter:l", "case:upper", "subtopic:tracing"],
  },

  l: {
    id: "l",
    label: "l",
    viewBox: "0 0 100 100",
    strokes: [{ id: "l_1", kind: "trace", pathD: "M 50 16 L 50 86" }],
    skillTags: ["letter:l", "case:lower", "subtopic:tracing"],
  },

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

  N: {
    id: "N",
    label: "N",
    viewBox: "0 0 100 100",
    strokes: [
      { id: "N_1", kind: "trace", pathD: "M 30 16 L 30 86" },
      { id: "N_2", kind: "trace", pathD: "M 30 16 L 70 86" },
      { id: "N_3", kind: "trace", pathD: "M 70 16 L 70 86" },
    ],
    skillTags: ["letter:n", "case:upper", "subtopic:tracing"],
  },

  n: {
    id: "n",
    label: "n",
    viewBox: "0 0 100 100",
    strokes: [
      { id: "n_1", kind: "trace", pathD: "M 40 40 L 40 86" },
      { id: "n_2", kind: "trace", pathD: "M 40 52 C 44 38, 66 38, 66 52 L 66 86" },
    ],
    skillTags: ["letter:n", "case:lower", "subtopic:tracing"],
  },

  O: {
    id: "O",
    label: "O",
    viewBox: "0 0 100 100",
    strokes: [
      {
        id: "O_1",
        kind: "trace",
        pathD:
          "M 50 18 " +
          "C 28 18, 14 34, 14 52 " +
          "C 14 72, 28 86, 50 86 " +
          "C 72 86, 86 72, 86 52 " +
          "C 86 34, 72 18, 50 18",
      },
    ],
    skillTags: ["letter:o", "case:upper", "subtopic:tracing"],
  },

  o: {
    id: "o",
    label: "o",
    viewBox: "0 0 100 100",
    strokes: [
      {
        id: "o_1",
        kind: "trace",
        pathD:
          "M 50 40 " +
          "C 37.3 40, 27 50.3, 27 63 " +
          "C 27 75.7, 37.3 86, 50 86 " +
          "C 62.7 86, 73 75.7, 73 63 " +
          "C 73 50.3, 62.7 40, 50 40",
      },
    ],
    skillTags: ["letter:o", "case:lower", "subtopic:tracing"],
  },

  P: {
    id: "P",
    label: "P",
    viewBox: "0 0 100 100",
    strokes: [
      { id: "P_1", kind: "trace", pathD: "M 34 16 L 34 86" },
      { id: "P_2", kind: "trace", pathD: "M 34 16 C 78 16, 78 52, 34 52" },
    ],
    skillTags: ["letter:p", "case:upper", "subtopic:tracing"],
  },

  p: {
    id: "p",
    label: "p",
    viewBox: "0 0 100 140",
    strokes: [
      { id: "p_1", kind: "trace", pathD: "M 40 40 L 40 112" },
      { id: "p_2", kind: "trace", pathD: "M 40 40 C 74 40, 74 74, 40 74" },
    ],
    skillTags: ["letter:p", "case:lower", "subtopic:tracing"],
  },

  // --------------------
  // Q / q
  // --------------------
  Q: {
    id: "Q",
    label: "Q",
    viewBox: "0 0 100 100",
    strokes: [
      {
        id: "Q_1",
        kind: "trace",
        pathD:
          "M 50 18 " +
          "C 28 18, 14 34, 14 52 " +
          "C 14 72, 28 86, 50 86 " +
          "C 72 86, 86 72, 86 52 " +
          "C 86 34, 72 18, 50 18",
      },
      { id: "Q_2", kind: "trace", pathD: "M 58 66 L 78 92" },
    ],
    skillTags: ["letter:q", "case:upper", "subtopic:tracing"],
  },

  q: {
    id: "q",
    label: "q",
    viewBox: "0 0 100 140",
    strokes: [
    // 1) c-curve bowl (anti-clockwise feel; open like "c")
    {
      id: "q_1",
      kind: "trace",
      // start near top-right, curve around to bottom-right (open on right)
      pathD: "M 68 48 C 48 34, 28 46, 28 66 C 28 90, 52 94, 68 84",
    },

    // 2) standing line (starts just ABOVE the curve start point, then comes down)
    {
      id: "q_2",
      kind: "trace",
      // start slightly above q_1 start (x=68), go down into descender
      pathD: "M 68 42 L 68 112",
    },
  ],
    skillTags: ["letter:q", "case:lower", "subtopic:tracing"],
  },
  // --------------------
  // R / r
  // --------------------
  R: {
    id: "R",
    label: "R",
    viewBox: "0 0 100 100",
    strokes: [
      // 1) main stem (top -> baseline)
      { id: "R_1", kind: "trace", pathD: "M 34 16 L 34 86" },

      // 2) top bowl (like P)
      { id: "R_2", kind: "trace", pathD: "M 34 16 C 78 16, 78 52, 34 52" },

      // 3) diagonal leg (mid -> bottom-right)
      { id: "R_3", kind: "trace", pathD: "M 50 52 L 76 86" },
    ],
    skillTags: ["letter:r", "case:upper", "subtopic:tracing"],
  },

  r: {
    id: "r",
    label: "r",
    viewBox: "0 0 100 100",
    strokes: [
      // 1) stem (x-height -> baseline)
      { id: "r_1", kind: "trace", pathD: "M 40 40 L 40 86" },

      // 2) small shoulder (starts at midline, small curve to the right)
      { id: "r_2", kind: "trace", pathD: "M 40 52 C 42 38, 62 40, 66 44" },
    ],
    skillTags: ["letter:r", "case:lower", "subtopic:tracing"],
  },

// --------------------
  // S / s
  // --------------------
  S: {
    id: "S",
    label: "S",
    viewBox: "0 0 100 100",
    strokes: [
      {
        id: "S_1",
        kind: "trace",
pathD:
          "M 72 24 " +
  "C 60 10, 34 12, 28 28 " +
  "C 22 42, 36 48, 52 52 " +
  "C 68 56, 82 62, 76 76 " +
  "C 70 92, 44 94, 22 80",      },
    ],
    skillTags: ["letter:s", "case:upper", "subtopic:tracing"],
  },

  s: {
    id: "s",
    label: "s",
    viewBox: "0 0 100 140",
    strokes: [
      {
        id: "s_1",
        kind: "trace",
        pathD:  "M 72 24 " +
  "C 60 10, 34 12, 28 28 " +
  "C 22 42, 36 48, 52 52 " +
  "C 68 56, 82 62, 76 76 " +
  "C 70 92, 44 94, 22 80", 
      },
    ],
    skillTags: ["letter:s", "case:lower", "subtopic:tracing"],
  },
  // --------------------
  // T / t
  // --------------------
  T: {
    id: "T",
    label: "T",
    viewBox: "0 0 100 100",
    strokes: [
      // 1) top bar
            { id: "T_2", kind: "trace", pathD: "M 50 18 L 50 86" },

      { id: "T_1", kind: "trace", pathD: "M 26 18 L 74 18" },
      // 2) center stem (top -> baseline)
    ],
    skillTags: ["letter:t", "case:upper", "subtopic:tracing"],
  },

  t: {
    id: "t",
    label: "t",
    viewBox: "0 0 100 100",
    strokes: [
      // 1) tall stem (top -> baseline)
{ id: "t_1", kind: "trace", pathD: "M 50 16 L 50 84 C 50 96, 74 96, 74 84" },
      // 2) cross bar (left -> right)
      { id: "t_2", kind: "trace", pathD: "M 34 50 L 66 50" },
    ],
    skillTags: ["letter:t", "case:lower", "subtopic:tracing"],
  },
// --------------------
// U / u
// --------------------
U: {
  id: "U",
  label: "U",
  viewBox: "0 0 100 100",
  strokes: [
    // 1) down left → rounded bottom → up right (single stroke)
    {
      id: "U_1",
      kind: "trace",
      pathD: "M 32 16 L 32 62 C 32 86, 68 86, 68 62 L 68 16",
    },
  ],
  skillTags: ["letter:u", "case:upper", "subtopic:tracing"],
},

u: {
  id: "u",
  label: "u",
  viewBox: "0 0 100 120",
  strokes: [
    // 1) left down → bottom curve → up to mid (like your reference stroke 1)
    {
      id: "u_1",
      kind: "trace",
      pathD: "M 32 46 L 32 58 C 30 98, 72 90, 72 86",
    },
    // 2) right down stroke
    {
      id: "u_2",
      kind: "trace",
      pathD: "M 72 46 L 72 94",
    },
  ],
  skillTags: ["letter:u", "case:lower", "subtopic:tracing"],
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
    pairs: [
      { upper: "M", lower: "m" },
      { upper: "N", lower: "n" },
      { upper: "O", lower: "o" },
      { upper: "P", lower: "p" },
    ],
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
  {
    levelId: 5,
    title: "Level 5",
    subtitle: "Q–Z",
    pairs: [
      { upper: "Q", lower: "q" },
      { upper: "R", lower: "r" },
      { upper: "S", lower: "s" },
            { upper: "T", lower: "t" },
            { upper: "U", lower: "u" },



    ],
  },
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
