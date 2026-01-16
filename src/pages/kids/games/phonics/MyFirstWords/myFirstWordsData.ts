// ========================================
// MY FIRST WORDS - Shared Data & Helpers
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

const SND_A_TAP = `${ASSET_BASE}/at-initial.mp3`;
const SND_A_DRAG = `${ASSET_BASE}/long-a-sound.mp3`;

export const mergeSoundUrl = (word: string) => `${ASSET_BASE}/${word}-sound.mp3`;

export const tapSoundUrl = (left: string) => {
  if (left === "a") return SND_A_TAP;
  return `${ASSET_BASE}/${left}-initial.mp3`;
};

export const dragSoundUrl = (left: string) => {
  if (left === "a") return SND_A_DRAG;
  return `${ASSET_BASE}/long-${left}-sound.mp3`;
};

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

export function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

// --- Phonics labels (simple + child-friendly) ---
export const PHONICS_MAP: Record<string, string> = {
  a: "/ă/",
  e: "/ĕ/",
  i: "/ĭ/",
  o: "/ŏ/",
  u: "/ŭ/",
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
  return { left: word.slice(0, 1), right: word.slice(1), word };
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
  const others = pool.filter((w) => w !== target);
  const picks = shuffle(others).slice(0, 2);
  return shuffle([target, ...picks]);
}
