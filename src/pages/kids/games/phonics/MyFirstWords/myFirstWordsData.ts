// ========================================
// MY FIRST WORDS - Shared Data & Helpers (UPDATED)
// ========================================

export type Item = { left: string; right: string; word: string };

export type LevelId = "slide_join" | "tap_word";
export type VowelGroupId = "short_a" | "short_e" | "short_i" | "short_o" | "short_u";

export type VowelGroup = {
  id: VowelGroupId;
  title: string;
  hint?: string;
  words: string[];
};

export const MY_FIRST_WORDS_META = {
  title: "My First Words",
  tagline: "Level 1: Slide & Join • Level 2: Tap the Word",
} as const;

export const GAME_ID = "my_first_words_v1";
export const PROGRESS_DOC_ID = "phonics_my_first_words";

// ✅ Public asset base (served from /public/games/...)
export const ASSET_BASE = "/games/phonics/my-first-words";

// ✅ Audio files
export const SND_CONFETTI = `${ASSET_BASE}/confetti.mp3`;

/**
 * IMPORTANT NAMING (recommended)
 * - Tap sound for vowel:   `${vowel}-initial.mp3`
 * - Drag loop for vowel:   `short-${vowel}-sound.mp3`   (short vowels in this game)
 * - Merged word sound:     `${word}-sound.mp3`
 *
 * You can still override specific letters below if your assets differ.
 */

// Existing override you had (kept for backward compatibility)
const SND_A_TAP = `${ASSET_BASE}/at-initial.mp3`;     // "a" tap cue recorded as at-initial
const SND_A_DRAG = `${ASSET_BASE}/long-a-sound.mp3`; // if this is actually short /ă/ loop, keep filename

export function normalizeWord(word: string) {
  return (word || "").trim().toLowerCase();
}

export function isVowel(letter: string) {
  const k = (letter || "").toLowerCase();
  return k === "a" || k === "e" || k === "i" || k === "o" || k === "u";
}

// --- Audio URL helpers ---
export const mergeSoundUrl = (word: string) => `${ASSET_BASE}/${normalizeWord(word)}-sound.mp3`;

export const tapSoundUrl = (left: string) => {
  const k = (left || "").toLowerCase();

  // Keep your existing special-case
  if (k === "a") return SND_A_TAP;

  // Default convention for vowels + any other single letter
  return `${ASSET_BASE}/${k}-initial.mp3`;
};

export const dragSoundUrl = (left: string) => {
  const k = (left || "").toLowerCase();

  // Keep your existing special-case
  if (k === "a") return SND_A_DRAG;

  // ✅ UPDATED: short vowel loop naming (this game is short-vowel families)
  // If your files are still named "long-e-sound.mp3", rename them OR change this line back.
  if (isVowel(k)) return `${ASSET_BASE}/short-${k}-sound.mp3`;

  // If a consonant ever becomes "left" in future content, provide a safe fallback
  return `${ASSET_BASE}/${k}-sound.mp3`;
};

// --- Content ---
export const VOWEL_GROUPS: VowelGroup[] = [
  { id: "short_a", title: "Short a families", hint: "only families", words: ["at", "an", "ap", "ad", "am", "ag"] },
  { id: "short_e", title: "Short e families", hint: "only families", words: ["et", "en", "ed", "eg"] },
  { id: "short_i", title: "Short i families", hint: "only families", words: ["it", "in", "ip", "ig"] },
  { id: "short_o", title: "Short o families", hint: "only families", words: ["ot", "op", "og", "ox"] },
  { id: "short_u", title: "Short u families", hint: "only families", words: ["ug", "un", "up", "ut"] },
] as const;

export const LEVELS: { id: LevelId; title: string; subtitle: string }[] = [
  { id: "slide_join", title: "1) Make the Word (Practice)", subtitle: "Slide the sounds together to make a word." },
  { id: "tap_word", title: "2) Tap the Word (Quick Quiz)", subtitle: "Listen and tap the word you hear." },
];

// --- Utils ---
export function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

// --- Phonics labels (simple + child-friendly) ---
// ✅ UPDATED: include consonants used in your current word sets
export const PHONICS_MAP: Record<string, string> = {
  // short vowels
  a: "/ă/",
  e: "/ĕ/",
  i: "/ĭ/",
  o: "/ŏ/",
  u: "/ŭ/",

  // common consonants in sets
  t: "/t/",
  n: "/n/",
  p: "/p/",
  d: "/d/",
  m: "/m/",
  g: "/g/",
  b: "/b/",
  c: "/k/",
  k: "/k/",
  f: "/f/",
  h: "/h/",
  r: "/r/",
  l: "/l/",
  j: "/j/",
  v: "/v/",
  w: "/w/",
  x: "/ks/",
  y: "/y/",
  z: "/z/",
  q: "/kw/",
  s: "/s/",
};

export function phonicLabel(letter: string) {
  const k = (letter || "").toLowerCase();
  if (!k) return "";
  return PHONICS_MAP[k] ?? `/${k}/`;
}

// --- Small RAF animator (for snap-back / snap-to-merge) ---
export function animateNumber(
  from: number,
  to: number,
  ms: number,
  onUpdate: (v: number) => void,
  onDone?: () => void
) {
  const t0 = performance.now();
  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

  let raf = 0;
  const tick = (now: number) => {
    const p = Math.min(1, (now - t0) / ms);
    const v = from + (to - from) * easeOut(p);
    onUpdate(v);
    if (p < 1) raf = requestAnimationFrame(tick);
    else onDone?.();
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

export function splitVC(word: string): Item {
  const w = normalizeWord(word);
  return { left: w.slice(0, 1), right: w.slice(1), word: w };
}

export function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function makeTapOptions(target: string, pool: string[]) {
  const t = normalizeWord(target);
  const p = pool.map(normalizeWord);
  const others = p.filter((w) => w !== t);
  const picks = shuffle(others).slice(0, 2);
  return shuffle([t, ...picks]);
}

/**
 * OPTIONAL: simple spaced review queue builder.
 * - Inserts each review word again after 2 items and again at the end.
 * - Safe: if reviewWords empty, returns original.
 */
export function buildPracticeQueue(words: string[], reviewWords: string[] = []) {
  const base = words.map(normalizeWord);
  const review = Array.from(new Set(reviewWords.map(normalizeWord))).filter(Boolean);

  if (review.length === 0) return base;

  const out: string[] = [];
  let i = 0;
  for (const w of base) {
    out.push(w);
    i += 1;
    if (i % 2 === 0 && review.length > 0) {
      // rotate review insertions
      const rw = review[(i / 2 - 1) % review.length];
      out.push(rw);
    }
  }
  // final quick review pass
  out.push(...review);
  return out;
}
