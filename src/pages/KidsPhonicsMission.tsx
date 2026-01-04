// src/pages/KidsPhonicsMission.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { recordLevelResult } from "../games/engine/recordLevelResult";

// --- Config ---
const TOTAL_ROUNDS = 8;
const QUESTION_SET_VERSION = 3; // bump when question generation logic changes

const KIDS_FONT_STACK =
  '"Fredoka", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

// Optional fallback only (we normally use LEVELS[].items[].cue)
const PHONETIC_MAP: Record<string, string> = {
  a: "aaa",
  b: "b",
  c: "k",
  d: "d",
  e: "eh",
  f: "fff",
  g: "g",
  h: "h",
  i: "iii",
  j: "j",
  k: "k",
  l: "lll",
  m: "mmm",
  n: "nnn",
  o: "o",
  p: "p",
  q: "kw",
  r: "rrr",
  s: "sss",
  t: "t",
  u: "uh",
  v: "vvv",
  w: "w",
  x: "ks",
  y: "y",
  z: "zzz",
};

type Question = {
  target: string;
  choices: string[];
};

type LevelDef = {
  id: number;
  title: string;
  items: { grapheme: string; cue: string; display?: string }[];
  choicesCount: number;
};

const LEVELS: LevelDef[] = [
  // Group 1: s, a, t, i, p, n
  {
    id: 1,
    title: "Level 1 (s a t i p n)",
    items: [
      { grapheme: "s", cue: "sss" },
      { grapheme: "a", cue: "aaa" },
      { grapheme: "t", cue: "t" },
      { grapheme: "i", cue: "iii" },
      { grapheme: "p", cue: "p" },
      { grapheme: "n", cue: "nnn" },
    ],
    choicesCount: 2,
  },

  // Group 2: c, k, e, h, r, m, d
  {
    id: 2,
    title: "Level 2 (c k e h r m d)",
    items: [
      { grapheme: "c", cue: "k" },
      { grapheme: "k", cue: "k" },
      { grapheme: "e", cue: "eh" },
      { grapheme: "h", cue: "h" },
      { grapheme: "r", cue: "rrr" },
      { grapheme: "m", cue: "mmm" },
      { grapheme: "d", cue: "d" },
    ],
    choicesCount: 2,
  },

  // Group 3: g, o, u, l, f, b
  {
    id: 3,
    title: "Level 3 (g o u l f b)",
    items: [
      { grapheme: "g", cue: "g" },
      { grapheme: "o", cue: "o" },
      { grapheme: "u", cue: "uh" },
      { grapheme: "l", cue: "lll" },
      { grapheme: "f", cue: "fff" },
      { grapheme: "b", cue: "b" },
    ],
    choicesCount: 2,
  },

  // Group 4: j
  {
    id: 4,
    title: "Level 4 (j)",
    items: [{ grapheme: "j", cue: "j" }],
    choicesCount: 3,
  },

  // Group 5: z, w, v
  {
    id: 5,
    title: "Level 5 (z w v)",
    items: [
      { grapheme: "z", cue: "zzz" },
      { grapheme: "w", cue: "w" },
      { grapheme: "v", cue: "vvv" },
    ],
    choicesCount: 3,
  },

  // Group 6: y, x
  {
    id: 6,
    title: "Level 6 (y x)",
    items: [
      { grapheme: "y", cue: "y" },
      { grapheme: "x", cue: "ks" },
    ],
    choicesCount: 3,
  },

  // Group 7: q
  {
    id: 7,
    title: "Level 7 (q)",
    items: [{ grapheme: "q", cue: "kw" }],
    choicesCount: 3,
  },
];

// For later levels (like j/q), we need distractors from earlier letters.
const ALL_GRAPHEMES = LEVELS.flatMap((l) => l.items.map((i) => i.grapheme));
const getIntroducedGraphemes = (levelId: number) =>
  LEVELS.filter((l) => l.id <= levelId).flatMap((l) => l.items.map((i) => i.grapheme));

const STORAGE_KEY = "ts_phonics_unlocked_level";
const BEST_KEY = "ts_phonics_level_bestStars_v1";
const PROGRESS_KEY = "ts_phonics_level_progress_v1";

// --- Web Audio Helper: Clap-Clap Sound ---
let audioCtx: AudioContext | null = null;
const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

const playClaps = () => {
  try {
    const ctx = getAudioContext();
    // best-effort resume (mobile browsers often start suspended)
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    const playOneClap = (startTime: number) => {
      const bufferSize = ctx.sampleRate * 0.12;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1700;
      filter.Q.value = 2.5;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.12, startTime + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(startTime);
      noise.stop(startTime + 0.12);
    };

    playOneClap(now);
    playOneClap(now + 0.13);
  } catch (e) {
    console.warn("Clap sound failed:", e);
  }
};

type SavedProgress = {
  version: number;
  starsEarned: number;
  currentRound: number;
  questions: Question[];
  updatedAt: number;
};

type ProgressMap = Record<number, SavedProgress>;

type FireworkParticle = {
  id: number;
  x: string; // vw
  y: string; // vh
  dx: number; // px
  dy: number; // px
  rot: number; // deg
  delayMs: number;
  durMs: number;
  sizePx: number;
  color: string;
};

const readBestStars = (kidId?: string): Record<number, number> => {
  try {
    const key = kidId ? `${BEST_KEY}:${kidId}` : BEST_KEY;
    let raw = localStorage.getItem(key);
    if (!raw && kidId) {
      const legacy = localStorage.getItem(BEST_KEY);
      if (legacy) {
        try {
          localStorage.setItem(key, legacy);
        } catch {}
        raw = legacy;
      }
    }
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const writeBestStars = (map: Record<number, number>, kidId?: string) => {
  try {
    const key = kidId ? `${BEST_KEY}:${kidId}` : BEST_KEY;
    localStorage.setItem(key, JSON.stringify(map));
  } catch {}
};

const readProgressMap = (kidId?: string): ProgressMap => {
  try {
    const key = kidId ? `${PROGRESS_KEY}:${kidId}` : PROGRESS_KEY;
    let raw = localStorage.getItem(key);
    if (!raw && kidId) {
      const legacy = localStorage.getItem(PROGRESS_KEY);
      if (legacy) {
        try {
          localStorage.setItem(key, legacy);
        } catch {}
        raw = legacy;
      }
    }
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const writeProgressMap = (map: ProgressMap, kidId?: string) => {
  try {
    const key = kidId ? `${PROGRESS_KEY}:${kidId}` : PROGRESS_KEY;
    localStorage.setItem(key, JSON.stringify(map));
  } catch {}
};

const saveLevelProgress = (levelId: number, data: SavedProgress, kidId?: string) => {
  try {
    const map = readProgressMap(kidId);
    map[levelId] = data;
    writeProgressMap(map, kidId);
  } catch {}
};

const clearLevelProgress = (levelId: number, kidId?: string) => {
  try {
    const map = readProgressMap(kidId);
    delete map[levelId];
    writeProgressMap(map, kidId);
  } catch {}
};

const getUnlockedLevel = (kidId?: string): number => {
  try {
    const key = kidId ? `${STORAGE_KEY}:${kidId}` : STORAGE_KEY;
    let v = localStorage.getItem(key);
    if (!v && kidId) {
      const legacy = localStorage.getItem(STORAGE_KEY);
      if (legacy) {
        try {
          localStorage.setItem(key, legacy);
        } catch {}
        v = legacy;
      }
    }
    const n = v ? parseInt(v, 10) : 1;
    return Number.isFinite(n) && n >= 1 ? Math.min(7, n) : 1;
  } catch {
    return 1;
  }
};

const setUnlockedLevel = (n: number, kidId?: string) => {
  try {
    const key = kidId ? `${STORAGE_KEY}:${kidId}` : STORAGE_KEY;
    localStorage.setItem(key, String(Math.min(7, Math.max(1, n))));
  } catch {}
};

// --- Firestore Progress Helpers ---
const GAME_ID = "phonics_letter_sound";

type GameResume = {
  level: number;
  round: number;
  stars: number;
  questions: Question[];
  updatedAt?: any;
};

type GameProgressDoc = {
  bestStarsByLevel?: Record<string, number>;
  completedLevels?: number[];
  resume?: GameResume | null;
  lastPlayedAt?: any;
  version?: number;
};

const getGameProgressDoc = async (kidId: string): Promise<GameProgressDoc | null> => {
  try {
    const { doc, getDoc, getFirestore } = await import("firebase/firestore");
    const db = getFirestore();
    const docRef = doc(db, "kids", kidId, "gameProgress", GAME_ID);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? (snapshot.data() as GameProgressDoc) : null;
  } catch (e) {
    console.error("Failed to read game progress:", e);
    return null;
  }
};

const saveGameProgressDoc = async (kidId: string, data: Partial<GameProgressDoc>): Promise<void> => {
  try {
    const { doc, setDoc, getFirestore, serverTimestamp } = await import("firebase/firestore");
    const db = getFirestore();
    const docRef = doc(db, "kids", kidId, "gameProgress", GAME_ID);
    await setDoc(docRef, { ...data, lastPlayedAt: serverTimestamp() }, { merge: true });
  } catch (e) {
    console.error("Failed to save game progress:", e);
  }
};

// --- Helper Functions ---

// Recorded letter sounds live in /public/games/phonics/letter-sound-match
const LETTER_SOUND_DIR = "/games/phonics/letter-sound-match";
const CONFETTI_SFX_SRC = "/confetti.mp3";

// Normalize grapheme keys (e.g., "oo2" -> "oo")
const normalizeGraphemeForAudio = (g: string) => (g || "").toLowerCase().trim().replace(/\d+$/, "");

// Only a–z are recorded right now (a.mp3 ... z.mp3)
const getRecordedSoundSrc = (grapheme: string): string | null => {
  const n = normalizeGraphemeForAudio(grapheme);
  return /^[a-z]$/.test(n) ? `${LETTER_SOUND_DIR}/${n}.mp3` : null;
};

// Fallback (used only when we DON'T have an mp3, e.g., ai/oa/th etc.)
const speak = (text: string) => {
  if (!text) return;
  if ("speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  }
};

// Generate questions for a specific level (scheduled targets)
// Rule:
// - Each "focus" letter (this level's items) appears at most 2 times.
// - Any remaining rounds are filled with review letters from earlier levels.
// - Distractors are ONLY from letters introduced up to this level (never future letters).
const scheduleTargetsForLevel = (levelDef: LevelDef): string[] => {
  const focus = levelDef.items.map((i) => i.grapheme);
  const introduced = getIntroducedGraphemes(levelDef.id);
  const review = introduced.filter((g) => !focus.includes(g));

  const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

  const targets: string[] = [];

  // 1) Ensure each focus letter appears at least once (as much as TOTAL_ROUNDS allows)
  const focusOnce = shuffle(focus);
  for (const g of focusOnce) {
    if (targets.length >= TOTAL_ROUNDS) break;
    targets.push(g);
  }

  // 2) Add a 2nd pass of focus letters, but never exceed 2 per focus letter
  const maxFocusSlots = Math.min(TOTAL_ROUNDS, focus.length * 2);
  const secondWaveNeeded = Math.max(0, maxFocusSlots - targets.length);
  if (secondWaveNeeded > 0) {
    targets.push(...shuffle(focus).slice(0, secondWaveNeeded));
  }

  // 3) Fill remaining rounds with review letters
  const remaining = TOTAL_ROUNDS - targets.length;
  if (remaining > 0) {
    const reviewPool = review.length ? review : introduced.filter((g) => !targets.includes(g));
    const bag = shuffle(reviewPool);

    while (targets.length < TOTAL_ROUNDS && bag.length) {
      targets.push(bag.shift()!);
    }

    // last resort (should not happen)
    while (targets.length < TOTAL_ROUNDS) {
      targets.push(focus[0] || introduced[0]);
    }
  }

  // 4) Shuffle final order + avoid immediate repeats when possible
  const out = shuffle(targets);
  for (let i = 1; i < out.length; i++) {
    if (out[i] === out[i - 1]) {
      const j = out.findIndex((v, idx) => idx > i && v !== out[i - 1]);
      if (j !== -1) {
        const tmp = out[i];
        out[i] = out[j];
        out[j] = tmp;
      }
    }
  }

  return out;
};

const generateQuestionsForLevel = (levelDef: LevelDef): Question[] => {
  const introduced = getIntroducedGraphemes(levelDef.id);
  const targets = scheduleTargetsForLevel(levelDef);

  const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

  const questions: Question[] = [];
  const needed = Math.max(0, levelDef.choicesCount - 1);

  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    const target = targets[i] ?? targets[targets.length - 1];

    // Distractors ONLY from introduced letters (never future letters)
    const distractorPool = introduced.filter((g) => g !== target);
    const distractors = shuffle(distractorPool).slice(0, needed);

    let choices = shuffle([target, ...distractors]);

    // Ensure exact length
    while (choices.length < levelDef.choicesCount) choices.push(target);
    if (choices.length > levelDef.choicesCount) choices = choices.slice(0, levelDef.choicesCount);

    // Ensure target is included
    if (!choices.includes(target)) choices[0] = target;

    questions.push({ target, choices });
  }

  return questions;
};

// --- Main Component ---
const KidsPhonicsMission: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { user } = useAuth();

  const navigate = useNavigate();

  let kidId = searchParams.get("kidId") || "";

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [starsEarned, setStarsEarned] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [lastTappedChoice, setLastTappedChoice] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [highestUnlocked, setHighestUnlocked] = useState<number>(getUnlockedLevel(kidId));

  // Auto-recover kidId from localStorage if missing in URL
  useEffect(() => {
    if (!kidId) {
      try {
        let stored = localStorage.getItem("ts_active_kid_v1");
        if (!stored && user?.uid) {
          stored = localStorage.getItem(`ts_parent_selected_kid_v1:${user.uid}`);
        }
        if (stored) {
          const newParams = new URLSearchParams(searchParams);
          newParams.set("kidId", stored);
          navigate({ pathname: location.pathname, search: newParams.toString() }, { replace: true });
        }
      } catch {
        // ignore
      }
    }
  }, [kidId, user?.uid, searchParams, location.pathname, navigate]);

  // Persist kidId to localStorage when present
  useEffect(() => {
    if (kidId) {
      try {
        localStorage.setItem("ts_active_kid_v1", kidId);
      } catch {
        // ignore
      }
    }
  }, [kidId]);

  // Helper to preserve kidId in all navigation
  const withKid = (path: string) => {
    if (!kidId) return path;
    const sep = path.includes("?") ? "&" : "?";
    return path.includes("kidId=") ? path : `${path}${sep}kidId=${encodeURIComponent(kidId)}`;
  };

  const timeoutsRef = useRef<number[]>([]);
  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];
  };

  const [bestStarsMap, setBestStarsMap] = useState<Record<number, number>>(() => readBestStars(kidId));

  // Session logging refs
  const sessionStartMsRef = useRef<number | null>(null);
  const sessionLoggedRef = useRef(false);
  const attemptsRef = useRef(0);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const perLetterRef = useRef<Record<string, { attempts: number; correct: number; wrong: number }>>({});

  const [confettiActive, setConfettiActive] = useState(false);
  const [fireworks, setFireworks] = useState<FireworkParticle[]>([]);

  const gameRef = useRef<HTMLDivElement | null>(null);

  const lastFirestoreSaveRef = useRef<number>(0);
  const firestoreSaveTimeoutRef = useRef<number | null>(null);

  // --- Prompt audio (recorded mp3) ---
  const promptAudioCacheRef = useRef<Record<string, HTMLAudioElement>>({});
  const activePromptAudioRef = useRef<HTMLAudioElement | null>(null);

  // Confetti SFX
  const confettiSfxRef = useRef<HTMLAudioElement | null>(null);

  // Autoplay is often blocked until first user tap; we unlock after first Listen/Choice tap
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const stopPromptAudio = useCallback(() => {
    try {
      window.speechSynthesis?.cancel?.();
    } catch {}
    try {
      if (activePromptAudioRef.current) {
        activePromptAudioRef.current.pause();
        activePromptAudioRef.current.currentTime = 0;
      }
    } catch {}
  }, []);

  const playConfettiSfx = useCallback(() => {
    try {
      if (!confettiSfxRef.current) {
        const a = new Audio(CONFETTI_SFX_SRC);
        a.preload = "auto";
        confettiSfxRef.current = a;
      }
      const a = confettiSfxRef.current;
      if (!a) return;
      try {
        a.currentTime = 0;
      } catch {}
      a.play().catch((err) => {
        // If blocked (rare here because correct answer is a user gesture), ignore.
        console.warn("[letter-sound-match] confetti.mp3 play blocked:", err);
      });
    } catch (e) {
      console.warn("Confetti SFX failed:", e);
    }
  }, []);

  const playPromptForGrapheme = useCallback(
    (grapheme: string) => {
      const allItems = LEVELS.flatMap((l) => l.items);
      const item = allItems.find((it) => it.grapheme === grapheme);
      const cue = item ? item.cue : PHONETIC_MAP[grapheme] || grapheme;

      // Stop any ongoing TTS/audio to avoid overlap
      stopPromptAudio();

      const src = getRecordedSoundSrc(grapheme);

      if (src) {
        let audio = promptAudioCacheRef.current[src];
        if (!audio) {
          audio = new Audio(src);
          audio.preload = "auto";
          promptAudioCacheRef.current[src] = audio;
        }
        activePromptAudioRef.current = audio;

        try {
          audio.currentTime = 0;
        } catch {}

        audio.play().catch((err) => {
          console.warn("[letter-sound-match] Prompt mp3 play blocked:", err);
        });
        return;
      }

      // No mp3 yet -> fallback to TTS
      speak(cue);
    },
    [stopPromptAudio]
  );

  const isSmallScreen = () => window.matchMedia("(max-width: 767px)").matches;

  async function enterImmersiveMode() {
    try {
      if (gameRef.current?.requestFullscreen) {
        await gameRef.current.requestFullscreen();
      } else if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      try {
        document.body.classList.add("ts-immersive-game");
      } catch {}

      if (isSmallScreen() && (screen.orientation as any)?.lock) {
        try {
          await (screen.orientation as any).lock("landscape");
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
  }

  async function exitImmersiveMode() {
    try {
      try {
        document.body.classList.remove("ts-immersive-game");
      } catch {}
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen().catch(() => {});
      }
      if ((screen.orientation as any)?.unlock) {
        try {
          (screen.orientation as any).unlock();
        } catch {}
      }
    } catch {
      // ignore
    }
  }

  const currentQuestion = questions[currentRound];

  const generateAndStart = useCallback((levelId: number) => {
    clearAllTimeouts();
    const levelDef = LEVELS.find((l) => l.id === levelId)!;
    setQuestions(generateQuestionsForLevel(levelDef));
    setCurrentRound(0);
    setStarsEarned(0);
    setFeedback(null);
    setLastTappedChoice(null);
    setIsComplete(false);
  }, []);

  // Helper to start a level atomically (uses Firestore/local resume + merges bestStars)
  const startLevel = useCallback(
    async (levelId: number) => {
      clearAllTimeouts();
      // IMPORTANT: clear previous level questions immediately
      // so we never auto-save old questions under the new selectedLevel
      setQuestions([]);
      setCurrentRound(0);
      setStarsEarned(0);

      setSelectedLevel(levelId);
      setIsComplete(false);
      setFeedback(null);
      setLastTappedChoice(null);

      // Initialize session tracking
      sessionStartMsRef.current = Date.now();
      sessionLoggedRef.current = false;
      attemptsRef.current = 0;
      correctRef.current = 0;
      wrongRef.current = 0;
      perLetterRef.current = {};

      let resumeData: SavedProgress | null = null;
      let firestoreBestStars: Record<number, number> | null = null;

      // Firestore first
      if (kidId) {
        try {
          const fsDoc = await getGameProgressDoc(kidId);
          if (fsDoc) {
            if (fsDoc.bestStarsByLevel) {
              firestoreBestStars = {};
              Object.entries(fsDoc.bestStarsByLevel).forEach(([k, v]) => {
                const lvl = parseInt(k, 10);
                if (!isNaN(lvl)) firestoreBestStars![lvl] = v;
              });
            }

            if (
              fsDoc.resume &&
              fsDoc.resume.level === levelId &&
              fsDoc.version === QUESTION_SET_VERSION
            ) {
              const r = fsDoc.resume;
              const levelDef = LEVELS.find((l) => l.id === levelId);

              if (
                levelDef &&
                r.round >= 0 &&
                r.round < TOTAL_ROUNDS &&
                r.stars >= 0 &&
                r.stars <= TOTAL_ROUNDS &&
                Array.isArray(r.questions) &&
                r.questions.length === TOTAL_ROUNDS
              ) {
                // targets/choices can be ANY introduced letters up to this level
                const pool = getIntroducedGraphemes(levelDef.id);

                const allQuestionsValid = r.questions.every((q) => {
                  return (
                    q &&
                    typeof q === "object" &&
                    typeof q.target === "string" &&
                    pool.includes(q.target) &&
                    Array.isArray(q.choices) &&
                    q.choices.length === levelDef.choicesCount &&
                    q.choices.includes(q.target) &&
                    q.choices.every((c) => typeof c === "string" && pool.includes(c))
                  );
                });

                if (allQuestionsValid) {
                  resumeData = {
                    version: QUESTION_SET_VERSION,
                    questions: r.questions,
                    currentRound: r.round,
                    starsEarned: r.stars,
                    updatedAt: r.updatedAt || Date.now(),
                  };
                }
              }
            }
          }
        } catch (e) {
          console.warn("Firestore load failed, falling back to localStorage:", e);
        }
      }

      // Merge Firestore best stars into state + localStorage
      if (firestoreBestStars) {
        const merged = { ...readBestStars(kidId), ...firestoreBestStars };
        setBestStarsMap(merged);
        writeBestStars(merged, kidId);
      }

      // Fallback to localStorage resume (STRICT validation)
      if (!resumeData) {
        const progressMap = readProgressMap(kidId);
        const saved = progressMap[levelId];
        const levelDef = LEVELS.find((l) => l.id === levelId);

        const isValid =
          !!saved &&
          saved.version === QUESTION_SET_VERSION &&
          !!levelDef &&
          Array.isArray(saved.questions) &&
          saved.questions.length === TOTAL_ROUNDS &&
          typeof saved.currentRound === "number" &&
          saved.currentRound >= 0 &&
          saved.currentRound < TOTAL_ROUNDS &&
          typeof saved.starsEarned === "number" &&
          saved.starsEarned >= 0 &&
          saved.starsEarned <= TOTAL_ROUNDS &&
          (() => {
            const pool = getIntroducedGraphemes(levelDef.id);
            return saved.questions.every((q) => {
              if (!q || typeof q !== "object") return false;
              if (!q.target || !pool.includes(q.target)) return false;
              if (!Array.isArray(q.choices) || q.choices.length !== levelDef.choicesCount) return false;
              if (!q.choices.includes(q.target)) return false;
              return q.choices.every((c) => pool.includes(c));
            });
          })();

        if (isValid) {
          resumeData = saved;
        } else if (saved) {
          // stale/corrupt resume -> clear it so it won't keep coming back
          clearLevelProgress(levelId, kidId);
        }
      }

      if (resumeData) {
        setQuestions(resumeData.questions);
        setCurrentRound(resumeData.currentRound);
        setStarsEarned(resumeData.starsEarned);
      } else {
        const levelDef = LEVELS.find((l) => l.id === levelId)!;
        const qs = generateQuestionsForLevel(levelDef);
        setQuestions(qs);
        setCurrentRound(0);
        setStarsEarned(0);
      }
    },
    [kidId]
  );

  // ✅ Fix #2: If opened with ?level=..., use startLevel (resume logic), NOT generateAndStart
  useEffect(() => {
    const levelParam = searchParams.get("level");
    const lp = levelParam ? parseInt(levelParam, 10) : NaN;

    const unlocked = getUnlockedLevel(kidId);
    setHighestUnlocked(unlocked);

    if (!Number.isNaN(lp) && lp >= 1 && lp <= 7 && lp <= unlocked) {
      void startLevel(lp);
      return;
    }

    // If no valid level param, stay on Choose Level screen
  }, [searchParams, kidId, startLevel]);

  const playSound = useCallback(() => {
    if (!currentQuestion) return;
    setAudioUnlocked(true); // unlock autoplay after first user tap
    playPromptForGrapheme(currentQuestion.target);
  }, [currentQuestion, playPromptForGrapheme]);

  useEffect(() => {
    if (!currentQuestion) return;
    if (!audioUnlocked) return; // avoid autoplay until user interaction
    playPromptForGrapheme(currentQuestion.target);
  }, [currentQuestion, audioUnlocked, playPromptForGrapheme]);

  // ✅ Fix #3: stop audio on unmount + cleanup timeouts/fullscreen
  useEffect(() => {
    return () => {
      try {
        window.speechSynthesis?.cancel?.();
      } catch {}
      try {
        if (activePromptAudioRef.current) {
          activePromptAudioRef.current.pause();
          activePromptAudioRef.current.currentTime = 0;
        }
      } catch {}
      try {
        if (confettiSfxRef.current) {
          confettiSfxRef.current.pause();
          confettiSfxRef.current.currentTime = 0;
        }
      } catch {}

      if (firestoreSaveTimeoutRef.current) clearTimeout(firestoreSaveTimeoutRef.current);
      clearAllTimeouts();
      void exitImmersiveMode();
    };
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    if (selectedLevel && questions.length > 0 && !isComplete) {
      saveLevelProgress(
        selectedLevel,
        {
          version: QUESTION_SET_VERSION,
          starsEarned,
          currentRound,
          questions,
          updatedAt: Date.now(),
        },
        kidId
      );
    }
  }, [selectedLevel, starsEarned, currentRound, questions, isComplete, kidId]);

  // Throttled Firestore autosave (every 3 seconds max)
  useEffect(() => {
    if (!kidId || !selectedLevel || questions.length === 0 || isComplete) return;

    const now = Date.now();
    const timeSinceLastSave = now - lastFirestoreSaveRef.current;

    const doSave = () => {
      saveGameProgressDoc(kidId, {
        resume: {
          level: selectedLevel,
          round: currentRound,
          stars: starsEarned,
          questions,
          updatedAt: now,
        },
        version: QUESTION_SET_VERSION,
      }).catch((e) => console.warn("Firestore autosave failed:", e));
      lastFirestoreSaveRef.current = now;
    };

    if (timeSinceLastSave >= 3000) {
      doSave();
    } else {
      if (firestoreSaveTimeoutRef.current) clearTimeout(firestoreSaveTimeoutRef.current);
      firestoreSaveTimeoutRef.current = window.setTimeout(doSave, 3000 - timeSinceLastSave);
    }

    return () => {
      if (firestoreSaveTimeoutRef.current) clearTimeout(firestoreSaveTimeoutRef.current);
    };
  }, [kidId, selectedLevel, currentRound, starsEarned, questions, isComplete]);

  // Listen for fullscreen changes (ESC) to ensure cleanup
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) {
        try {
          void exitImmersiveMode();
        } catch {}
      }
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Helper to track per-letter stats
  const bumpLetter = (target: string, outcome: "correct" | "wrong") => {
    const normalized = target.toLowerCase().trim().replace(/\d+$/, "");
    if (!normalized) return;

    if (!perLetterRef.current[normalized]) {
      perLetterRef.current[normalized] = { attempts: 0, correct: 0, wrong: 0 };
    }

    perLetterRef.current[normalized].attempts += 1;
    if (outcome === "correct") perLetterRef.current[normalized].correct += 1;
    else perLetterRef.current[normalized].wrong += 1;
  };

  const handleChoice = (choice: string) => {
    if (feedback) return; // Prevent multiple clicks

    // ✅ Fix #1: unlock autoplay on answer tap
    setAudioUnlocked(true);

    // Stop current prompt audio so celebration sounds feel clean
    stopPromptAudio();

    setLastTappedChoice(choice);

    // Track attempts for session logging
    attemptsRef.current++;

    if (!currentQuestion) return;

    if (choice === currentQuestion.target) {
      correctRef.current++;
      bumpLetter(currentQuestion.target, "correct");
      setFeedback("correct");

      // Confetti + sounds
      setConfettiActive(true);
      playClaps();
      playConfettiSfx(); // ✅ confetti.mp3 plays along with falling confetti

      // Fireworks
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!prefersReducedMotion) {
        const particles: FireworkParticle[] = [];
        let particleId = 0;
        const colors = ["#FFD54A", "#FF7A59", "#FF4D8D", "#7C5CFF", "#2EE6A6", "#FFFFFF"];

        const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

        const groundBursts = [
          { x: 14, y: 86, count: 24 },
          { x: 86, y: 86, count: 24 },
          { x: 50, y: 88, count: 24 },
        ];

        groundBursts.forEach((burst) => {
          const xClamped = clamp(burst.x, 6, 94);
          const yClamped = clamp(burst.y, 8, 92);

          for (let i = 0; i < burst.count; i++) {
            const angle = -140 + Math.random() * 100;
            const angleRad = (angle * Math.PI) / 180;
            const radius = 220 + Math.random() * 200;
            const dx = Math.cos(angleRad) * radius;
            const dy = Math.sin(angleRad) * radius;

            particles.push({
              id: particleId++,
              x: `${xClamped}vw`,
              y: `${yClamped}vh`,
              dx,
              dy,
              rot: Math.random() * 720 - 360,
              delayMs: Math.random() * 450,
              durMs: 1800 + Math.random() * 800,
              sizePx: 4 + Math.random() * 4,
              color: colors[Math.floor(Math.random() * colors.length)],
            });
          }
        });

        const cornerBursts = [
          { x: 92, y: 18, count: 12, angleMin: 140, angleMax: 220 },
          { x: 8, y: 14, count: 12, angleMin: -40, angleMax: 40 },
        ];

        cornerBursts.forEach((burst) => {
          const xClamped = clamp(burst.x, 6, 94);
          const yClamped = clamp(burst.y, 8, 92);

          for (let i = 0; i < burst.count; i++) {
            const angle = burst.angleMin + Math.random() * (burst.angleMax - burst.angleMin);
            const angleRad = (angle * Math.PI) / 180;
            const radius = 120 + Math.random() * 120;
            const dx = Math.cos(angleRad) * radius;
            const dy = Math.sin(angleRad) * radius;

            particles.push({
              id: particleId++,
              x: `${xClamped}vw`,
              y: `${yClamped}vh`,
              dx,
              dy,
              rot: Math.random() * 720 - 360,
              delayMs: Math.random() * 450,
              durMs: 1800 + Math.random() * 800,
              sizePx: 4 + Math.random() * 3,
              color: colors[Math.floor(Math.random() * colors.length)],
            });
          }
        });

        setFireworks(particles);

        const fireworkTimeout = window.setTimeout(() => setFireworks([]), 3000);
        timeoutsRef.current.push(fireworkTimeout);
      }

      const newStars = starsEarned + 1;
      setStarsEarned((s) => s + 1);

      const t = window.setTimeout(() => {
        setConfettiActive(false);

        if (currentRound < TOTAL_ROUNDS - 1) {
          setCurrentRound((r) => r + 1);
          setFeedback(null);
          setLastTappedChoice(null);
          return;
        }

        // Level complete
        setIsComplete(true);

        if (selectedLevel) {
          const prevBest = bestStarsMap[selectedLevel] || 0;

          if (newStars > prevBest) {
            const nextMap = { ...bestStarsMap, [selectedLevel]: newStars };
            setBestStarsMap(nextMap);
            writeBestStars(nextMap, kidId);
          }

          clearLevelProgress(selectedLevel, kidId);

          // Log session summary (best-effort)
          if (kidId && sessionStartMsRef.current && !sessionLoggedRef.current) {
            sessionLoggedRef.current = true;

            const endMs = Date.now();
            const durationSec = Math.round((endMs - sessionStartMsRef.current) / 1000);
            const accuracy = attemptsRef.current > 0 ? correctRef.current / attemptsRef.current : 0;

            (async () => {
              try {
                const tagDeltas: Record<string, { attempts: number; correct: number; wrong: number }> = {};

                Object.entries(perLetterRef.current).forEach(([letter, stats]) => {
                  if (stats.attempts > 0) {
                    tagDeltas[`letter:${letter}`] = {
                      attempts: stats.attempts,
                      correct: stats.correct,
                      wrong: stats.wrong,
                    };
                  }
                });

                if (attemptsRef.current > 0) {
                  tagDeltas["subtopic:letter_sounds"] = {
                    attempts: attemptsRef.current,
                    correct: correctRef.current,
                    wrong: wrongRef.current,
                  };
                }

                await recordLevelResult({
                  kidId,
                  gameId: "letter-sound-match",
                  progressDocId: "phonics_letter_sound",
                  levelId: selectedLevel,
                  completed: true,
                  stars: newStars,
                  score: correctRef.current,
                  accuracyPct: accuracy * 100,
                  durationSec,
                  tagDeltas,
                });
              } catch (err) {
                console.error("[recordLevelResult] Failed (non-blocking):", err);
              }
            })();
          }

          // Save completion to Firestore
          if (kidId) {
            const mergedBest = { ...bestStarsMap, [selectedLevel]: Math.max(prevBest, newStars) };
            const bestByLevel: Record<string, number> = {};
            Object.entries(mergedBest).forEach(([k, v]) => (bestByLevel[k] = v));

            saveGameProgressDoc(kidId, { bestStarsByLevel: bestByLevel, resume: null, version: QUESTION_SET_VERSION }).catch((e) =>
              console.warn("Firestore completion save failed:", e)
            );
          }

          // Unlock next level if criteria met
          if (newStars >= 6 && selectedLevel < 7) {
            const newUnlocked = Math.max(getUnlockedLevel(kidId), selectedLevel + 1);
            setUnlockedLevel(newUnlocked, kidId);
            setHighestUnlocked(newUnlocked);
          }
        }
      }, 4000);

      timeoutsRef.current.push(t);
      return;
    }

    // Wrong answer
    wrongRef.current++;
    bumpLetter(currentQuestion.target, "wrong");
    setFeedback("wrong");

    const t2 = window.setTimeout(() => {
      setFeedback(null);
      setLastTappedChoice(null);
    }, 350);
    timeoutsRef.current.push(t2);
  };

  // --- UI ---
  return (
    <div
      ref={gameRef}
      className="ts-phonics-mission-root"
      style={{ fontFamily: KIDS_FONT_STACK }}
    >
      {!selectedLevel ? (
        <div
          className="relative min-h-screen flex flex-col items-center justify-start py-12 px-4 overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #050510 0%, #150a2b 35%, #0b2a5e 100%)",
            boxShadow: "inset 0 0 160px rgba(0,0,0,0.75)",
          }}
        >
          <style>{`
            .level-grid { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:16px; max-width:900px; }
            .level-card { padding:18px; border-radius:16px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); cursor:pointer; }
            .level-card.locked { opacity:0.4; cursor:not-allowed; }
            @media (prefers-reduced-motion: reduce) { .level-card { transition:none !important } }
          `}</style>

          <Link
            to={withKid("/kids/games/phonics")}
            className="absolute top-5 right-5 px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 transition-all duration-200 font-semibold shadow-lg text-white hover:text-white focus:text-white"
            style={{ zIndex: 50 }}
          >
            ← Back to Phonics Library
          </Link>

          <div className="w-full max-w-6xl mx-auto text-center mb-8">
            <h1 className="text-5xl font-bold text-white">Choose Level</h1>
            <p className="text-white/70 mt-2">Pick a Jolly Phonics level to play</p>

            {!kidId && (
              <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-500/40 rounded-lg max-w-md mx-auto">
                <p className="text-yellow-200 font-semibold mb-3">⚠️ No child selected</p>
                <p className="text-yellow-100/80 text-sm mb-4">Please go back and choose a child to track progress.</p>
                <Link
                  to={withKid("/parent")}
                  className="inline-block px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors"
                >
                  ← Back to Parent Dashboard
                </Link>
              </div>
            )}
          </div>

          <div className="level-grid w-full max-w-3xl mx-auto">
            {LEVELS.map((l) => {
              const locked = l.id > highestUnlocked;
              const best = bestStarsMap[l.id] || 0;
              const progressMap = readProgressMap(kidId);
              const savedProgress = progressMap[l.id];

              let badge = "Not started";
              let starsToShow = 0;

              if (best >= 6) {
                badge = "Completed";
                starsToShow = best;
              } else if (savedProgress && (savedProgress.starsEarned > 0 || savedProgress.currentRound > 0)) {
                badge = "In progress";
                starsToShow = savedProgress.starsEarned;
              } else if (best > 0) {
                badge = "In progress";
                starsToShow = best;
              }

              return (
                <button
                  key={l.id}
                  type="button"
                  aria-label={`Level ${l.id} ${l.title}`}
                  onClick={() => {
                    if (locked) return;
                    void startLevel(l.id);
                    void enterImmersiveMode();
                  }}
                  className={`level-card ${locked ? "locked" : ""}`}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-white">{l.title}</div>
                        <div className="text-sm text-white/80 mt-2 leading-snug whitespace-normal">
                          {l.items.map((it) => (it.display || it.grapheme).toLowerCase()).join(" ")}
                        </div>
                      </div>
                      <div className="text-sm text-white/60">{locked ? "Locked 🔒" : "Play"}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div aria-label={`Stars: ${starsToShow} of ${TOTAL_ROUNDS}`} className="text-yellow-300">
                        {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
                          <span key={i} className={`text-sm mr-0.5 ${i < starsToShow ? "text-yellow-300" : "text-white/30"}`}>
                            ★
                          </span>
                        ))}
                      </div>
                      <div className="text-sm text-white/60">{badge}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : !currentQuestion ? (
        <div
          className="relative min-h-screen flex items-center justify-center text-white text-2xl font-semibold"
          style={{
            background: "linear-gradient(180deg, #0a0618 0%, #1a1040 50%, #0f1b4a 100%)",
            boxShadow: "inset 0 0 200px rgba(0,0,0,0.8)",
          }}
        >
          <div className="starfield" aria-hidden="true" />
          Loading Mission...
        </div>
      ) : (
        <div
          className="relative overflow-hidden text-white flex flex-col items-center justify-center"
          style={{
            position: "fixed",
            inset: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 40,
            backgroundImage: 'url("/games/phonics/letter-sound-match/bg.png")',
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <style>{`
            @keyframes pop { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
            @keyframes sparkle { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.15); opacity: 0.95; } }
            @keyframes sparkleBurst { 0% { transform: scale(0); opacity: 1; } 50% { transform: scale(1.2); opacity: 0.9; } 100% { transform: scale(1.5); opacity: 0; } }
            @keyframes gentleShake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
            @keyframes boomingPulse { 0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(255, 140, 66, 0.4); } 50% { transform: scale(1.06); box-shadow: 0 0 40px rgba(255, 140, 66, 0.8), 0 0 60px rgba(255, 107, 53, 0.6); } }
            @keyframes twinkle { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }
            @keyframes drift { 0% { transform: translate(0, 0); } 100% { transform: translate(15px, -15px); } }
            .starfield { position: absolute; inset: 0; pointer-events: none; }
            .starfield::before, .starfield::after {
              content: ''; position: absolute; inset: 0;
              background-image:
                radial-gradient(circle at 15% 20%, white 1px, transparent 1.1px),
                radial-gradient(circle at 85% 30%, white 0.8px, transparent 0.9px),
                radial-gradient(circle at 40% 70%, white 1px, transparent 1.1px),
                radial-gradient(circle at 70% 50%, white 0.9px, transparent 1px);
              background-size: 120px 120px;
              animation: twinkle 6s ease-in-out infinite, drift 80s linear infinite;
            }
            .starfield::after { background-size: 180px 180px; animation-delay: -3s; animation-duration: 8s, 120s; }

            .ts-immersive-game header,
            .ts-immersive-game nav,
            .ts-immersive-game [role="banner"],
            .ts-immersive-game .site-header,
            .ts-immersive-game .navbar { display: none !important; }

            .ts-immersive-game body,
            .ts-immersive-game #root,
            .ts-immersive-game main,
            .ts-immersive-game .min-h-screen { padding-top: 0 !important; margin-top: 0 !important; }

            .choice-btn { transition: transform 0.15s ease, box-shadow 0.15s ease; }
            .choice-btn:hover { transform: scale(1.05); box-shadow: 0 0 30px rgba(255, 255, 255, 0.3); }
            .choice-btn:active { transform: scale(0.98); }

            .choice-btn.sparkle-correct {
              animation: pop 220ms cubic-bezier(.2,.9,.2,1);
              background: rgba(45, 212, 191, 0.6) !important;
              border-color: rgba(45, 212, 191, 1) !important;
              box-shadow: 0 0 60px rgba(45, 212, 191, 0.95), 0 0 140px rgba(45, 212, 191, 0.6) !important;
            }
            .choice-btn.shake-wrong { animation: gentleShake 0.35s ease-in-out; }
            .choice-btn.glow-wrong {
              animation: pop 220ms cubic-bezier(.2,.9,.2,1);
              background: rgba(239, 68, 68, 0.6) !important;
              border-color: rgba(239, 68, 68, 1) !important;
              box-shadow: 0 0 60px rgba(239, 68, 68, 0.95), 0 0 140px rgba(239, 68, 68, 0.6) !important;
            }
            .listen-btn-booming { animation: boomingPulse 1.8s ease-in-out infinite; }

            @keyframes confettiFall { 0% { top: -10%; opacity: 1; } 85% { opacity: 1; } 100% { top: 120%; opacity: 0; } }
            @keyframes fireworkBurst { 0% { transform: translate3d(0,0,0) scale(0.9) rotate(0deg); opacity: 0; } 10% { opacity: 1; } 100% { transform: translate3d(var(--dx), var(--dy), 0) scale(1) rotate(var(--rot)); opacity: 0; } }

            @media (prefers-reduced-motion: reduce) {
              * { animation: none !important; transition: none !important; }
              .listen-btn-booming { animation: none !important; transform: scale(1) !important; }
            }
          `}</style>

          <button
            type="button"
            onClick={() => {
              // Save progress immediately before leaving
              if (kidId && selectedLevel && questions.length > 0 && !isComplete) {
                  saveGameProgressDoc(kidId, {
                    resume: {
                      level: selectedLevel,
                      round: currentRound,
                      stars: starsEarned,
                      questions,
                      updatedAt: Date.now(),
                    },
                    version: QUESTION_SET_VERSION,
                  }).catch((e) => console.warn("Firestore save on exit failed:", e));
                }
              stopPromptAudio();
              void exitImmersiveMode();
              clearAllTimeouts();
              setSelectedLevel(null);
              setQuestions([]);
              setFeedback(null);
              setLastTappedChoice(null);
              setIsComplete(false);
              setStarsEarned(0);
              setCurrentRound(0);
              navigate(withKid("/kids/games/phonics/letter-sound"), { replace: true });
            }}
            className="absolute top-5 right-5 px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 transition-all duration-200 font-semibold shadow-lg text-white hover:text-white focus:text-white"
            style={{ zIndex: 50 }}
          >
            ← Back to Levels
          </button>

          {isComplete ? (
            <div className="text-center z-10 p-8 bg-black/30 backdrop-blur-md rounded-3xl border border-white/20">
              <h1 className="text-6xl font-bold text-yellow-300 mb-4">Mission Complete!</h1>
              <div className="text-5xl mb-6">
                {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
                  <span key={i} className="text-3xl">
                    {i < starsEarned ? "★" : "☆"}
                  </span>
                ))}
              </div>
              <p className="text-2xl mb-4">You earned {starsEarned} stars!</p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => {
                    if (selectedLevel) {
                      generateAndStart(selectedLevel);
                      void enterImmersiveMode();
                    }
                  }}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-2xl text-lg font-bold shadow-xl"
                  type="button"
                >
                  Play Again 🚀
                </button>

                <button
                  onClick={() => {
                    stopPromptAudio();
                    void exitImmersiveMode();
                    clearAllTimeouts();
                    setSelectedLevel(null);
                    setQuestions([]);
                    setFeedback(null);
                    setLastTappedChoice(null);
                    navigate(withKid("/kids/games/phonics/letter-sound"), { replace: true });
                  }}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-lg font-semibold"
                  type="button"
                >
                  Choose Level
                </button>

                {selectedLevel && starsEarned >= 6 && selectedLevel < 7 && (
                  <button
                    onClick={() => {
                      const next = selectedLevel + 1;
                      const unlocked = getUnlockedLevel(kidId);
                      if (next <= unlocked) {
                        void startLevel(next);
                        navigate(withKid(`/kids/games/phonics/letter-sound?level=${next}`), { replace: true });
                      }
                    }}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-2xl text-lg font-bold text-white"
                    type="button"
                  >
                    Next Level ▶
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center px-4" style={{ zIndex: 10, paddingTop: 60 }}>
              {/* Progress Stars */}
              <div
                className="absolute top-6 left-1/2 transform -translate-x-1/2 flex justify-center gap-2"
                aria-label={`Progress: ${starsEarned} of ${TOTAL_ROUNDS} stars earned`}
                style={{ zIndex: 20 }}
              >
                {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
                  <span key={i} className="text-4xl drop-shadow-lg" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>
                    {i < starsEarned ? "★" : "☆"}
                  </span>
                ))}
              </div>

              <div
                className="absolute top-24 left-1/2 text-3xl md:text-4xl font-bold text-gray-800 drop-shadow-lg text-center"
                style={{
                  transform: "translateX(-50%)",
                  width: "min(1100px, 92vw)",
                  textShadow: "2px 2px 4px rgba(255,255,255,0.5), 0 0 8px rgba(255,255,255,0.3)",
                  zIndex: 20,
                }}
              >
                Tap the letter that says this sound
              </div>

              <div className="w-full flex items-center justify-center" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 56px" }}>
                <div className="flex flex-col md:flex-row items-center justify-center" style={{ gap: "160px", transform: "translateY(24px)" }}>
                  {/* Listen */}
                  <div className="flex flex-col items-center justify-center gap-6">
                    <button
                      onClick={playSound}
                      type="button"
                      aria-label="Listen to sound"
                      className="listen-btn-booming relative flex items-center justify-center rounded-full shadow-2xl transition-transform hover:scale-105 active:scale-95"
                      style={{
                        width: 340,
                        height: 340,
                        background: "linear-gradient(135deg, #FF8C42 0%, #FF6B35 100%)",
                        border: "8px solid rgba(255,255,255,0.9)",
                        touchAction: "manipulation",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                      }}
                    >
                      <img
                        src="/games/phonics/letter-sound-match/listen.png"
                        alt="Listen"
                        style={{ width: "70%", height: "70%", objectFit: "contain", pointerEvents: "none" }}
                      />
                    </button>
                    <div className="text-4xl font-bold text-gray-800" style={{ textShadow: "2px 2px 4px rgba(255,255,255,0.6)" }}>
                      listen
                    </div>
                  </div>

                  {/* Choices */}
                  <div className="flex flex-col items-stretch justify-center" style={{ gap: "34px", width: 420 }}>
                    {currentQuestion.choices.map((choice) => {
                      const allItems = LEVELS.flatMap((l) => l.items);
                      const item = allItems.find((x) => x.grapheme === choice);
                      const displayText = item ? item.display || item.grapheme : choice;

                      const isCorrect = choice === currentQuestion.target;
                      const isWrong = choice === lastTappedChoice && !isCorrect;

                      return (
                        <button
                          key={choice}
                          type="button"
                          onClick={() => handleChoice(choice)}
                          aria-label={`Choose ${displayText}`}
                          className={`choice-btn flex items-center justify-center rounded-3xl shadow-xl font-black text-gray-800 transition-all
                            ${feedback === "correct" && isCorrect ? "sparkle-correct" : ""}
                            ${feedback === "wrong" && isWrong ? "glow-wrong shake-wrong" : ""}
                          `}
                          style={{
                            height: 160,
                            background: "linear-gradient(135deg, #FFDAB9 0%, #FFB88C 100%)",
                            border: "6px solid rgba(139, 69, 19, 0.4)",
                            fontSize: displayText.length > 1 ? "5rem" : "6rem",
                            fontWeight: 700,
                            touchAction: "manipulation",
                            userSelect: "none",
                            WebkitUserSelect: "none",
                          }}
                        >
                          {displayText.toLowerCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Feedback */}
              {feedback === "correct" && (
                <div
                  className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center text-4xl text-green-400 font-bold drop-shadow-lg"
                  style={{ zIndex: 30, textShadow: "2px 2px 6px rgba(0,0,0,0.8)" }}
                >
                  Great job! ✨
                </div>
              )}
              {feedback === "wrong" && (
                <div
                  className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center text-4xl text-yellow-300 font-bold drop-shadow-lg"
                  style={{ zIndex: 30, textShadow: "2px 2px 6px rgba(0,0,0,0.8)" }}
                >
                  Try again! 🌟
                </div>
              )}

              {/* Confetti Overlay */}
              {confettiActive && (
                <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 60, overflow: "hidden" }} aria-hidden="true">
                  {Array.from({ length: 50 }).map((_, i) => {
                    const left = Math.random() * 100;
                    const delay = Math.random() * 0.6;
                    const duration = 2.8 + Math.random() * 1.4;
                    const rotation = Math.random() * 360;
                    const colors = ["#fbbf24", "#34d399", "#60a5fa", "#f87171", "#a78bfa", "#fb923c"];
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    return (
                      <div
                        key={i}
                        style={{
                          position: "absolute",
                          left: `${left}%`,
                          top: "-10%",
                          width: "10px",
                          height: "10px",
                          backgroundColor: color,
                          borderRadius: "2px",
                          animation: `confettiFall ${duration}s linear ${delay}s forwards`,
                          transform: `rotate(${rotation}deg)`,
                        }}
                      />
                    );
                  })}
                </div>
              )}

              {/* Fireworks Overlay */}
              {fireworks.length > 0 && (
                <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 60, overflow: "hidden" }} aria-hidden="true">
                  {fireworks.map((particle) => (
                    <div
                      key={particle.id}
                      style={
                        {
                          position: "absolute",
                          left: particle.x,
                          top: particle.y,
                          width: particle.sizePx,
                          height: particle.sizePx,
                          backgroundColor: particle.color,
                          borderRadius: "2px",
                          // @ts-ignore
                          "--dx": `${particle.dx}px`,
                          // @ts-ignore
                          "--dy": `${particle.dy}px`,
                          // @ts-ignore
                          "--rot": `${particle.rot}deg`,
                          animation: `fireworkBurst ${particle.durMs}ms ease-out ${particle.delayMs}ms forwards`,
                        } as React.CSSProperties
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KidsPhonicsMission;
