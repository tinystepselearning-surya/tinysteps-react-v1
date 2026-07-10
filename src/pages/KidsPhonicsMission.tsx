// src/pages/KidsPhonicsMission.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { recordLevelResult } from "../games/engine/recordLevelResult";
import { applyKidAndMissionContext, buildMissionReturnHref } from "./kids/games/phonics/missionNavigation";

// --- Config ---
const TOTAL_ROUNDS = 8;
const MASTERY_UNLOCK_STARS = 6;
// Bump when generation / hint logic changes (affects resume validation)
const QUESTION_SET_VERSION = 4;

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

type KidsPhonicsMissionProps = {
  forceAnonymousMode?: boolean;
  missionReturnHrefOverride?: string;
  missionBackLabel?: string;
};

const LEVELS: LevelDef[] = [
  // Group 1: s, a, t, i, p, n
  {
    id: 1,
    title: "Starter Sounds",
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
    title: "More Core Sounds",
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
    title: "Build Sound Power",
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
    title: "J Sound Focus",
    items: [{ grapheme: "j", cue: "j" }],
    choicesCount: 3,
  },

  // Group 5: z, w, v
  {
    id: 5,
    title: "Z, W, V Practice",
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
    title: "Y, X Practice",
    items: [
      { grapheme: "y", cue: "y" },
      { grapheme: "x", cue: "ks" },
    ],
    choicesCount: 3,
  },

  // Group 7: q
  {
    id: 7,
    title: "Q Sound Focus",
    items: [{ grapheme: "q", cue: "kw" }],
    choicesCount: 3,
  },
];

const getLettersPreview = (level: LevelDef) =>
  level.items.map((it) => (it.display || it.grapheme).toLowerCase()).join(" ");

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const computeMasteryStars = (params: {
  attempts: number;
  correct: number;
  hintCounts: Record<string, number>;
  answeredBeforeListen: number;
}): number => {
  const { attempts, correct, hintCounts, answeredBeforeListen } = params;
  if (correct <= 0 || attempts <= 0) return 0;

  const accuracyRatio = correct / Math.max(1, attempts);
  const baseStars = accuracyRatio * TOTAL_ROUNDS;

  const hint1 = hintCounts["hint:1"] || 0;
  const hint2 = hintCounts["hint:2"] || 0;
  const hint3 = hintCounts["hint:3"] || 0;
  const hint4 = hintCounts["hint:4"] || 0;
  const supportPenalty =
    hint1 * 0.1 +
    hint2 * 0.2 +
    hint3 * 0.35 +
    hint4 * 0.5 +
    answeredBeforeListen * 0.08;

  const adjusted = baseStars - supportPenalty;
  const rounded = Math.round(adjusted);
  return clamp(rounded, 0, TOTAL_ROUNDS);
};

// For later levels (like j/q), we need distractors from earlier letters.
const ALL_GRAPHEMES = LEVELS.flatMap((l) => l.items.map((i) => i.grapheme));
const getIntroducedGraphemes = (levelId: number) =>
  LEVELS.filter((l) => l.id <= levelId).flatMap((l) => l.items.map((i) => i.grapheme));

const STORAGE_KEY = "ts_phonics_unlocked_level";
const BEST_KEY = "ts_phonics_level_bestStars_v1";
const PROGRESS_KEY = "ts_phonics_level_progress_v1";
const PUBLIC_LETTER_SOUNDS_PLAY_PATH = "/free-letter-sounds-game-for-kids?play=1";

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

type ConfettiPiece = {
  id: number;
  leftPct: number;
  delay: number;
  duration: number;
  rotation: number;
  color: string;
  size: number;
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

// --- Firestore/Game Identity ---
const LETTER_SOUNDS_GAME_ID = "letter-sound-match";
const LETTER_SOUNDS_PROGRESS_DOC_ID = "phonics_letter_sound";

type GameProgressDoc = {
  gameId?: string;
  title?: string;
  areaPractised?: string;
  expertiseArea?: string;
  started?: boolean;
  totalLevels?: number;
  levelsCompleted?: number;
  progressStatus?: "not_started" | "getting_started" | "in_progress" | "progressing" | "completed";
  totalTimeSpentMs?: number;
  bestStarsByLevel?: Record<string, number>;
  lastPlayedAt?: any;
};

const saveGameProgressDoc = async (kidId: string, data: Partial<GameProgressDoc>): Promise<void> => {
  try {
    const { doc, setDoc, getFirestore, serverTimestamp } = await import("firebase/firestore");
    const db = getFirestore();
    const docRef = doc(db, "kids", kidId, "gameProgress", LETTER_SOUNDS_PROGRESS_DOC_ID);
    await setDoc(docRef, { ...data, lastPlayedAt: serverTimestamp() }, { merge: true });
  } catch (e) {
    console.error("Failed to save game progress:", e);
  }
};

// --- Helper Functions ---
const LETTER_SOUND_DIR = "/games/phonics/letter-sound-match";
const CONFETTI_SFX_SRC = "/confetti.mp3";

const normalizeGraphemeForAudio = (g: string) => (g || "").toLowerCase().trim().replace(/\d+$/, "");
const getRecordedSoundSrc = (grapheme: string): string | null => {
  const n = normalizeGraphemeForAudio(grapheme);
  return /^[a-z]$/.test(n) ? `${LETTER_SOUND_DIR}/${n}.mp3` : null;
};

// NOTE: TTS is a last resort (phoneme quality can vary). Prefer recordings.
const speak = (text: string) => {
  if (!text) return;
  if ("speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  }
};

// Build a cue map for “same sound” filtering (prevents c/k conflict)
const CUE_BY_GRAPHEME: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  LEVELS.flatMap((l) => l.items).forEach((it) => {
    out[it.grapheme] = it.cue;
  });
  return out;
})();

const getCueFor = (g: string) => CUE_BY_GRAPHEME[g] || PHONETIC_MAP[g] || g;

// Scheduling targets for a level
const scheduleTargetsForLevel = (levelDef: LevelDef): string[] => {
  const focus = levelDef.items.map((i) => i.grapheme);
  const introduced = getIntroducedGraphemes(levelDef.id);
  const review = introduced.filter((g) => !focus.includes(g));

  const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

  const targets: string[] = [];

  const focusOnce = shuffle(focus);
  for (const g of focusOnce) {
    if (targets.length >= TOTAL_ROUNDS) break;
    targets.push(g);
  }

  const maxFocusSlots = Math.min(TOTAL_ROUNDS, focus.length * 2);
  const secondWaveNeeded = Math.max(0, maxFocusSlots - targets.length);
  if (secondWaveNeeded > 0) {
    targets.push(...shuffle(focus).slice(0, secondWaveNeeded));
  }

  const remaining = TOTAL_ROUNDS - targets.length;
  if (remaining > 0) {
    const reviewPool = review.length ? review : introduced.filter((g) => !targets.includes(g));
    const bag = shuffle(reviewPool);

    while (targets.length < TOTAL_ROUNDS && bag.length) {
      targets.push(bag.shift()!);
    }
    while (targets.length < TOTAL_ROUNDS) {
      targets.push(focus[0] || introduced[0]);
    }
  }

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

// Create a single question with “same-cue distractors filtered out”
const buildQuestion = (target: string, pool: string[], choicesCount: number): Question => {
  const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

  const needed = Math.max(0, choicesCount - 1);
  const targetCue = getCueFor(target);

  // Filter distractors:
  // - not the target
  // - not same cue as target (prevents c/k conflict in this sound→letter game)
  const distractorPool = pool.filter((g) => g !== target && getCueFor(g) !== targetCue);

  const distractors = shuffle(distractorPool).slice(0, needed);
  let choices = shuffle([target, ...distractors]);

  // Ensure exact length
  while (choices.length < choicesCount) {
    // If we ran out of cue-safe distractors, fall back to any introduced (still not target)
    const fallback = pool.filter((g) => g !== target);
    const pick = fallback[Math.floor(Math.random() * fallback.length)] || target;
    if (!choices.includes(pick)) choices.push(pick);
    else choices.push(target);
  }
  if (choices.length > choicesCount) choices = choices.slice(0, choicesCount);

  if (!choices.includes(target)) choices[0] = target;

  // De-dupe if any duplicates slipped in
  choices = Array.from(new Set(choices));
  while (choices.length < choicesCount) {
    const fallback = pool.filter((g) => g !== target && !choices.includes(g));
    const pick = fallback[Math.floor(Math.random() * fallback.length)] || target;
    choices.push(pick);
  }
  choices = choices.slice(0, choicesCount);

  return { target, choices: shuffle(choices) };
};

const generateQuestionsForLevel = (levelDef: LevelDef): Question[] => {
  const introduced = getIntroducedGraphemes(levelDef.id);
  const targets = scheduleTargetsForLevel(levelDef);

  const questions: Question[] = [];
  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    const target = targets[i] ?? targets[targets.length - 1];
    questions.push(buildQuestion(target, introduced, levelDef.choicesCount));
  }
  return questions;
};

// --- Main Component ---
const KidsPhonicsMission: React.FC<KidsPhonicsMissionProps> = ({
  forceAnonymousMode = false,
  missionReturnHrefOverride,
  missionBackLabel = "← Back to Mission",
}) => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const kidId = forceAnonymousMode ? "" : searchParams.get("kidId") || "";

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [starsEarned, setStarsEarned] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [lastTappedChoice, setLastTappedChoice] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [highestUnlocked, setHighestUnlocked] = useState<number>(
    forceAnonymousMode ? 1 : getUnlockedLevel(kidId),
  );

  const currentLevelDef = useMemo(
    () => (selectedLevel ? LEVELS.find((l) => l.id === selectedLevel) || null : null),
    [selectedLevel]
  );

  // --- Listen gating + hint ladder state ---
  const [hasListenedThisRound, setHasListenedThisRound] = useState(false);
  const [choicesEnabled, setChoicesEnabled] = useState(false);
  const [wrongThisRound, setWrongThisRound] = useState(0);
  const [pulseCorrect, setPulseCorrect] = useState(false);
  const [disabledChoices, setDisabledChoices] = useState<Set<string>>(new Set());
  const [forceCorrectOnly, setForceCorrectOnly] = useState(false);
  const [nudgeText, setNudgeText] = useState<string | null>(null);

  // Timing refs for telemetry-ish signals
  const roundStartMsRef = useRef<number>(Date.now());
  const listenedCountThisRoundRef = useRef<number>(0);
  const answeredBeforeListenRef = useRef<number>(0);

  // Auto-recover kidId from localStorage if missing in URL
  useEffect(() => {
    if (forceAnonymousMode) return;
    if (!kidId) {
      try {
        const stored = localStorage.getItem("ts_active_kid_v1");
        if (stored) {
          const newParams = new URLSearchParams(searchParams);
          newParams.set("kidId", stored);
          navigate({ pathname: location.pathname, search: newParams.toString() }, { replace: true });
          return;
        }

        if (location.pathname === "/kids/games/phonics/letter-sound") {
          navigate(PUBLIC_LETTER_SOUNDS_PLAY_PATH, { replace: true });
        }
      } catch {
        // ignore
      }
    }
  }, [forceAnonymousMode, kidId, searchParams, location.pathname, navigate]);

  // Persist kidId to localStorage when present
  useEffect(() => {
    if (forceAnonymousMode) return;
    if (kidId) {
      try {
        localStorage.setItem("ts_active_kid_v1", kidId);
      } catch {
        // ignore
      }
    }
  }, [forceAnonymousMode, kidId]);

  const missionReturnHref =
    missionReturnHrefOverride ?? buildMissionReturnHref(searchParams, kidId);
  const levelRouteBase = forceAnonymousMode ? location.pathname : "/kids/games/phonics/letter-sound";

  // Helper to preserve kidId in all navigation
  const withKid = (path: string) => {
    const [pathname, queryString = ""] = path.split("?");
    const params = new URLSearchParams(queryString);
    applyKidAndMissionContext(params, searchParams, kidId);
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };
  const buildLevelRoute = (level?: number) => {
    if (forceAnonymousMode) {
      return level ? `${levelRouteBase}?level=${level}` : levelRouteBase;
    }
    return withKid(level ? `${levelRouteBase}?level=${level}` : levelRouteBase);
  };

  const timeoutsRef = useRef<number[]>([]);
  const pushTimeout = (id: number) => {
    timeoutsRef.current.push(id);
  };
  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];
  };

  const [bestStarsMap, setBestStarsMap] = useState<Record<number, number>>(() =>
    forceAnonymousMode ? {} : readBestStars(kidId),
  );

  // Session logging refs
  const sessionStartMsRef = useRef<number | null>(null);
  const sessionLoggedRef = useRef(false);
  const attemptsRef = useRef(0);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const perLetterRef = useRef<Record<string, { attempts: number; correct: number; wrong: number }>>({});
  const hintLevelCountsRef = useRef<Record<string, number>>({}); // e.g. "hint:2" -> count

  const [confettiActive, setConfettiActive] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const [fireworks, setFireworks] = useState<FireworkParticle[]>([]);

  const gameRef = useRef<HTMLDivElement | null>(null);

  // --- Prompt audio (recorded mp3) ---
  const promptAudioCacheRef = useRef<Record<string, HTMLAudioElement>>({});
  const activePromptAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPromptPlaying, setIsPromptPlaying] = useState(false);

  // Confetti SFX (used only on mission complete now)
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
    setIsPromptPlaying(false);
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
      a.play().catch(() => {});
    } catch {}
  }, []);

  // “Listen first” gating: enable choices shortly after we start the prompt
  const enableChoicesSoon = useCallback(() => {
    setChoicesEnabled(false);
    const id = window.setTimeout(() => {
      setChoicesEnabled(true);
      setNudgeText(null);
    }, 450);
    pushTimeout(id);
  }, []);

  const playPromptForGrapheme = useCallback(
    (grapheme: string) => {
      const allItems = LEVELS.flatMap((l) => l.items);
      const item = allItems.find((it) => it.grapheme === grapheme);
      const cue = item ? item.cue : PHONETIC_MAP[grapheme] || grapheme;

      stopPromptAudio();

      const src = getRecordedSoundSrc(grapheme);
      listenedCountThisRoundRef.current += 1;
      setHasListenedThisRound(true);
      enableChoicesSoon();
      setIsPromptPlaying(true);

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

        audio.onended = () => setIsPromptPlaying(false);
        audio.onpause = () => setIsPromptPlaying(false);

        audio.play().catch(() => {
          // If blocked, we still keep “listened” false-ish? Here we keep gating via user tap.
          setIsPromptPlaying(false);
        });
        return;
      }

      // No mp3 yet -> fallback to TTS
      try {
        speak(cue);
      } finally {
        // TTS end event isn’t reliable; just mark prompt as “not playing” after a short window.
        const id = window.setTimeout(() => setIsPromptPlaying(false), 700);
        pushTimeout(id);
      }
    },
    [stopPromptAudio, enableChoicesSoon]
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

  const generateAndStart = useCallback(
    (levelId: number) => {
      clearAllTimeouts();
      const levelDef = LEVELS.find((l) => l.id === levelId)!;

      setQuestions(generateQuestionsForLevel(levelDef));
      setCurrentRound(0);
      setStarsEarned(0);
      setFeedback(null);
      setLastTappedChoice(null);
      setIsComplete(false);

      // reset round gating
      setHasListenedThisRound(false);
      setChoicesEnabled(false);
      setWrongThisRound(0);
      setPulseCorrect(false);
      setDisabledChoices(new Set());
      setForceCorrectOnly(false);
      setNudgeText(null);
      listenedCountThisRoundRef.current = 0;
      answeredBeforeListenRef.current = 0;
      roundStartMsRef.current = Date.now();
    },
    []
  );

  // Helper to start a level atomically (local resume + local best stars)
  const startLevel = useCallback(
    (levelId: number) => {
      clearAllTimeouts();

      setQuestions([]);
      setCurrentRound(0);
      setStarsEarned(0);

      setSelectedLevel(levelId);
      setIsComplete(false);
      setFeedback(null);
      setLastTappedChoice(null);

      // Reset round gating
      setHasListenedThisRound(false);
      setChoicesEnabled(false);
      setWrongThisRound(0);
      setPulseCorrect(false);
      setDisabledChoices(new Set());
      setForceCorrectOnly(false);
      setNudgeText(null);
      listenedCountThisRoundRef.current = 0;
      answeredBeforeListenRef.current = 0;
      roundStartMsRef.current = Date.now();

      // Initialize session tracking
      sessionStartMsRef.current = Date.now();
      sessionLoggedRef.current = false;
      attemptsRef.current = 0;
      correctRef.current = 0;
      wrongRef.current = 0;
      perLetterRef.current = {};
      hintLevelCountsRef.current = {};

      let resumeData: SavedProgress | null = null;

      // Fallback to localStorage resume (STRICT validation) only in tracked mode.
      if (!forceAnonymousMode && !resumeData) {
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
    [forceAnonymousMode, kidId]
  );

  // If opened with ?level=..., use startLevel (resume logic)
  useEffect(() => {
    const levelParam = searchParams.get("level");
    const lp = levelParam ? parseInt(levelParam, 10) : NaN;

    const unlocked = forceAnonymousMode ? highestUnlocked : getUnlockedLevel(kidId);
    setHighestUnlocked(unlocked);

    if (!Number.isNaN(lp) && lp >= 1 && lp <= 7 && lp <= unlocked) {
      void startLevel(lp);
      return;
    }
  }, [searchParams, forceAnonymousMode, kidId, startLevel]);

  // Play prompt (manual)
  const playSound = useCallback(() => {
    if (!currentQuestion) return;
    setAudioUnlocked(true);
    setNudgeText(null);
    playPromptForGrapheme(currentQuestion.target);
  }, [currentQuestion, playPromptForGrapheme]);

  // Auto-prompt after first user interaction unlock
  useEffect(() => {
    if (!currentQuestion) return;

    // Reset per-round gating & hint state whenever the question changes
    setFeedback(null);
    setLastTappedChoice(null);
    setWrongThisRound(0);
    setPulseCorrect(false);
    setDisabledChoices(new Set());
    setForceCorrectOnly(false);
    setHasListenedThisRound(false);
    setChoicesEnabled(false);
    setNudgeText(null);
    listenedCountThisRoundRef.current = 0;
    answeredBeforeListenRef.current = 0;
    roundStartMsRef.current = Date.now();

    if (!audioUnlocked) return;
    playPromptForGrapheme(currentQuestion.target);
  }, [currentQuestion, audioUnlocked, playPromptForGrapheme]);

  // Cleanup on unmount + cleanup timeouts/fullscreen
  useEffect(() => {
    return () => {
      stopPromptAudio();
      try {
        if (confettiSfxRef.current) {
          confettiSfxRef.current.pause();
          confettiSfxRef.current.currentTime = 0;
        }
      } catch {}
      clearAllTimeouts();
      void exitImmersiveMode();
    };
  }, [stopPromptAudio]);

  // Save progress to localStorage
  useEffect(() => {
    if (forceAnonymousMode) return;
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
  }, [selectedLevel, starsEarned, currentRound, questions, isComplete, forceAnonymousMode, kidId]);

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

  const bumpHint = (level: number) => {
    const k = `hint:${level}`;
    hintLevelCountsRef.current[k] = (hintLevelCountsRef.current[k] || 0) + 1;
  };

  const makeConfettiPieces = useCallback((count: number) => {
    const colors = ["#fbbf24", "#34d399", "#60a5fa", "#f87171", "#a78bfa", "#fb923c"];
    const pieces: ConfettiPiece[] = Array.from({ length: count }).map((_, i) => ({
      id: i,
      leftPct: Math.random() * 100,
      delay: Math.random() * 0.35,
      duration: 1.6 + Math.random() * 0.9,
      rotation: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 8 + Math.random() * 6,
    }));
    setConfettiPieces(pieces);
  }, []);

  const triggerMiniCelebrate = useCallback(() => {
    setConfettiActive(true);
    makeConfettiPieces(18);
    const t = window.setTimeout(() => {
      setConfettiActive(false);
      setConfettiPieces([]);
    }, 1800);
    pushTimeout(t);
  }, [makeConfettiPieces]);

  const triggerBigCelebrate = useCallback(() => {
    // Confetti sfx only on mission complete (lower stimulation during practice)
    playConfettiSfx();
    setConfettiActive(true);
    makeConfettiPieces(42);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!prefersReducedMotion) {
      const particles: FireworkParticle[] = [];
      let particleId = 0;
      const colors = ["#FFD54A", "#FF7A59", "#FF4D8D", "#7C5CFF", "#2EE6A6", "#FFFFFF"];

      const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

      const bursts = [
        { x: 14, y: 86, count: 20, angleMin: -140, angleMax: -40 },
        { x: 86, y: 86, count: 20, angleMin: -140, angleMax: -40 },
        { x: 50, y: 88, count: 20, angleMin: -140, angleMax: -40 },
        { x: 92, y: 18, count: 10, angleMin: 140, angleMax: 220 },
        { x: 8, y: 14, count: 10, angleMin: -40, angleMax: 40 },
      ];

      bursts.forEach((burst) => {
        const xClamped = clamp(burst.x, 6, 94);
        const yClamped = clamp(burst.y, 8, 92);

        for (let i = 0; i < burst.count; i++) {
          const angle = burst.angleMin + Math.random() * (burst.angleMax - burst.angleMin);
          const angleRad = (angle * Math.PI) / 180;
          const radius = 160 + Math.random() * 220;
          const dx = Math.cos(angleRad) * radius;
          const dy = Math.sin(angleRad) * radius;

          particles.push({
            id: particleId++,
            x: `${xClamped}vw`,
            y: `${yClamped}vh`,
            dx,
            dy,
            rot: Math.random() * 720 - 360,
            delayMs: Math.random() * 420,
            durMs: 1600 + Math.random() * 900,
            sizePx: 4 + Math.random() * 4,
            color: colors[Math.floor(Math.random() * colors.length)],
          });
        }
      });

      setFireworks(particles);
      const t = window.setTimeout(() => setFireworks([]), 3200);
      pushTimeout(t);
    }

    const t2 = window.setTimeout(() => {
      setConfettiActive(false);
      setConfettiPieces([]);
    }, 2600);
    pushTimeout(t2);
  }, [makeConfettiPieces, playConfettiSfx]);

  // Light in-session spaced review: after a miss, ensure the target appears again soon
  const scheduleSoonReview = useCallback(
    (target: string) => {
      if (!currentLevelDef) return;
      setQuestions((prev) => {
        if (!prev || prev.length !== TOTAL_ROUNDS) return prev;
        const idx = Math.min(currentRound + 2, TOTAL_ROUNDS - 1);
        if (idx <= currentRound) return prev;
        if (prev[idx]?.target === target) return prev;

        const pool = getIntroducedGraphemes(currentLevelDef.id);
        const next = [...prev];
        next[idx] = buildQuestion(target, pool, currentLevelDef.choicesCount);
        return next;
      });
    },
    [currentLevelDef, currentRound]
  );

  const handleChoice = (choice: string) => {
    if (feedback) return;
    if (!currentQuestion || !currentLevelDef) return;

    // If choices are still gated, treat as “answered before listen”
    if (!choicesEnabled || !hasListenedThisRound) {
      answeredBeforeListenRef.current += 1;
      setAudioUnlocked(true);
      setNudgeText("Tap Listen, then choose the letter");
      // Replay prompt to guide
      playPromptForGrapheme(currentQuestion.target);
      // Track behavior
      const k = "behavior:answered_before_listen";
      hintLevelCountsRef.current[k] = (hintLevelCountsRef.current[k] || 0) + 1;
      return;
    }

    // Unlock autoplay on answer tap too
    setAudioUnlocked(true);

    // Stop current prompt audio so feedback feels clean
    stopPromptAudio();

    // Track attempts for session logging
    attemptsRef.current++;

    setLastTappedChoice(choice);

    // Enforce hint-based disabling
    if (forceCorrectOnly && choice !== currentQuestion.target) {
      setNudgeText("Tap the glowing letter");
      playPromptForGrapheme(currentQuestion.target);
      return;
    }
    if (disabledChoices.has(choice)) {
      setNudgeText("Try the other one");
      playPromptForGrapheme(currentQuestion.target);
      return;
    }

    const isCorrect = choice === currentQuestion.target;

    if (isCorrect) {
      correctRef.current++;
      bumpLetter(currentQuestion.target, "correct");
      setFeedback("correct");
      setNudgeText("Great job! Get ready for the next sound");
      setPulseCorrect(false);

      // Minimal celebration (no fireworks here)
      playClaps();
      triggerMiniCelebrate();

      const provisionalStars = computeMasteryStars({
        attempts: attemptsRef.current,
        correct: correctRef.current,
        hintCounts: hintLevelCountsRef.current,
        answeredBeforeListen: answeredBeforeListenRef.current,
      });
      setStarsEarned(provisionalStars);

      // Advance in ~2.2s (not 4s)
      const t = window.setTimeout(() => {
        setNudgeText(null);

        if (currentRound < TOTAL_ROUNDS - 1) {
          setCurrentRound((r) => r + 1);
          setFeedback(null);
          setLastTappedChoice(null);
          return;
        }

        // Mission complete
        setIsComplete(true);
        const finalStars = computeMasteryStars({
          attempts: attemptsRef.current,
          correct: correctRef.current,
          hintCounts: hintLevelCountsRef.current,
          answeredBeforeListen: answeredBeforeListenRef.current,
        });
        setStarsEarned(finalStars);

        if (selectedLevel) {
          const prevBest = bestStarsMap[selectedLevel] || 0;

          if (finalStars > prevBest) {
            const nextMap = { ...bestStarsMap, [selectedLevel]: finalStars };
            setBestStarsMap(nextMap);
            if (!forceAnonymousMode) {
              writeBestStars(nextMap, kidId);
            }
          }

          if (!forceAnonymousMode) {
            clearLevelProgress(selectedLevel, kidId);
          }

          // Log session summary (best-effort)
          if (!forceAnonymousMode && kidId && sessionStartMsRef.current && !sessionLoggedRef.current) {
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

                // Pack hint/behavior counts into tagDeltas safely as “attempts only”
                Object.entries(hintLevelCountsRef.current).forEach(([k, v]) => {
                  if (v > 0) {
                    tagDeltas[k] = { attempts: v, correct: 0, wrong: 0 };
                  }
                });

                await recordLevelResult({
                  kidId,
                  gameId: LETTER_SOUNDS_GAME_ID,
                  progressDocId: LETTER_SOUNDS_PROGRESS_DOC_ID,
                  levelId: selectedLevel,
                  completed: true,
                  stars: finalStars,
                  score: correctRef.current,
                  accuracyPct: accuracy * 100,
                  durationSec,
                  tagDeltas,
                } as any);
              } catch (err) {
                console.error("[recordLevelResult] Failed (non-blocking):", err);
              }
            })();
          }

          // Save completion to Firestore
          if (!forceAnonymousMode && kidId && finalStars > prevBest) {
            const mergedBest = { ...bestStarsMap, [selectedLevel]: finalStars };
            const bestByLevel: Record<string, number> = {};
            Object.entries(mergedBest).forEach(([k, v]) => (bestByLevel[k] = v));
            const levelsCompleted = Object.values(bestByLevel).reduce((count, stars) => count + (stars > 0 ? 1 : 0), 0);
            const totalLevels = LEVELS.length;
            const progressStatus: GameProgressDoc["progressStatus"] =
              levelsCompleted >= totalLevels
                ? "completed"
                : levelsCompleted >= Math.ceil(totalLevels / 2)
                  ? "progressing"
                  : "in_progress";

            saveGameProgressDoc(kidId, {
              gameId: LETTER_SOUNDS_GAME_ID,
              title: "Letter Sounds",
              areaPractised: "Letter-sound recognition",
              expertiseArea: "phonics",
              started: true,
              totalLevels,
              levelsCompleted,
              progressStatus,
              bestStarsByLevel: bestByLevel,
            }).catch(() => {});
          }

          // Unlock next level if criteria met
          if (finalStars >= MASTERY_UNLOCK_STARS && selectedLevel < 7) {
            const newUnlocked = forceAnonymousMode
              ? Math.max(highestUnlocked, selectedLevel + 1)
              : Math.max(getUnlockedLevel(kidId), selectedLevel + 1);
            if (!forceAnonymousMode) {
              setUnlockedLevel(newUnlocked, kidId);
            }
            setHighestUnlocked(newUnlocked);
          }
        }
      }, 2200);

      pushTimeout(t);
      return;
    }

    // Wrong answer
    wrongRef.current++;
    bumpLetter(currentQuestion.target, "wrong");
    setFeedback("wrong");
    setNudgeText("Not that one. Tap Listen and try again");
    scheduleSoonReview(currentQuestion.target);

    const nextWrong = wrongThisRound + 1;
    setWrongThisRound(nextWrong);

    // Hint ladder
    // H1: replay
    if (nextWrong === 1) {
      bumpHint(1);
      const t = window.setTimeout(() => {
        playPromptForGrapheme(currentQuestion.target);
      }, 450);
      pushTimeout(t);
    }

    // H2: replay + pulse correct
    if (nextWrong === 2) {
      bumpHint(2);
      setPulseCorrect(true);
      const t = window.setTimeout(() => {
        playPromptForGrapheme(currentQuestion.target);
        const t2 = window.setTimeout(() => setPulseCorrect(false), 900);
        pushTimeout(t2);
      }, 350);
      pushTimeout(t);
      setNudgeText("Look for the glowing letter");
    }

    // H3: reduce choices (if 3 choices)
    if (nextWrong === 3) {
      bumpHint(3);
      setNudgeText("Let’s make it easier");
      const nonTarget = currentQuestion.choices.filter((c) => c !== currentQuestion.target);
      if (nonTarget.length >= 2) {
        // Disable one distractor (keep target + one distractor)
        const toDisable = nonTarget.find((c) => c !== choice) || nonTarget[0];
        setDisabledChoices(new Set([toDisable]));
      }
      setPulseCorrect(true);
      const t = window.setTimeout(() => {
        playPromptForGrapheme(currentQuestion.target);
      }, 350);
      pushTimeout(t);
    }

    // H4+: errorless success
    if (nextWrong >= 4) {
      bumpHint(4);
      setForceCorrectOnly(true);
      setPulseCorrect(true);
      setDisabledChoices(new Set(currentQuestion.choices.filter((c) => c !== currentQuestion.target)));
      setNudgeText("Tap the glowing letter");
      const t = window.setTimeout(() => {
        playPromptForGrapheme(currentQuestion.target);
      }, 250);
      pushTimeout(t);
    }

    const updatedMasteryStars = computeMasteryStars({
      attempts: attemptsRef.current,
      correct: correctRef.current,
      hintCounts: hintLevelCountsRef.current,
      answeredBeforeListen: answeredBeforeListenRef.current,
    });
    setStarsEarned(updatedMasteryStars);

    // Reset feedback after a teachable window (not 350ms)
    const reset = window.setTimeout(() => {
      setFeedback(null);
      setLastTappedChoice(null);
    }, 1100);
    pushTimeout(reset);
  };

  // Trigger big celebration when mission completes
  useEffect(() => {
    if (!isComplete) return;
    triggerBigCelebrate();
  }, [isComplete, triggerBigCelebrate]);

  const accuracyPct = Math.round((correctRef.current / Math.max(1, attemptsRef.current)) * 100);

  // --- UI ---
  return (
    <div ref={gameRef} className="ts-phonics-mission-root" style={{ fontFamily: KIDS_FONT_STACK }}>
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
            @media (max-width: 760px) { .level-grid { grid-template-columns: 1fr; max-width: 560px; } }
            @media (prefers-reduced-motion: reduce) { .level-card { transition:none !important } }
          `}</style>

          <Link
            to={missionReturnHref}
            className="absolute top-5 right-5 px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 transition-all duration-200 font-semibold shadow-lg text-white hover:text-white focus:text-white"
            style={{ zIndex: 50 }}
          >
            {missionBackLabel}
          </Link>

          <div className="w-full max-w-6xl mx-auto text-center mb-8">
            <h1 className="text-5xl font-bold text-white">Letter Sounds Adventure</h1>
            <p className="text-white/70 mt-2">Listen to a sound, then tap the matching letter.</p>
            <p className="text-white/60 mt-1 text-sm">Unlock rule: earn {MASTERY_UNLOCK_STARS}+ mastery stars to open the next level.</p>

            {!kidId && !forceAnonymousMode && (
              <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-500/40 rounded-lg max-w-md mx-auto">
                <p className="text-yellow-200 font-semibold mb-3">⚠️ No child selected</p>
                <p className="text-yellow-100/80 text-sm mb-4">
                  Progress can continue on this device. Add `kidId` later for synced per-child tracking.
                </p>
                <Link
                  to={missionReturnHref}
                  className="inline-block px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors"
                >
                  ← Open English Excellence Mission
                </Link>
              </div>
            )}
          </div>

          <div className="level-grid w-full max-w-3xl mx-auto">
            {LEVELS.map((l) => {
              const locked = l.id > highestUnlocked;
              const best = bestStarsMap[l.id] || 0;
              const progressMap = forceAnonymousMode ? {} : readProgressMap(kidId);
              const savedProgress = progressMap[l.id];

              let badge = "Not started";
              let starsToShow = 0;

              if (best >= MASTERY_UNLOCK_STARS) {
                badge = "Mastery ready";
                starsToShow = best;
              } else if (savedProgress && (savedProgress.starsEarned > 0 || savedProgress.currentRound > 0)) {
                badge = "Practicing";
                starsToShow = savedProgress.starsEarned;
              } else if (best > 0) {
                badge = "Practicing";
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
                        <div className="text-2xl font-bold text-white">{`Level ${l.id} · ${l.title}`}</div>
                        <div className="text-sm text-white/80 mt-2 leading-snug whitespace-normal">
                          {getLettersPreview(l)}
                        </div>
                      </div>
                      <div className="text-sm text-white/60">{locked ? "Locked 🔒" : "Start"}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div aria-label={`Mastery stars: ${starsToShow} of ${TOTAL_ROUNDS}`} className="text-yellow-300">
                        {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
                          <span
                            key={i}
                            className={`text-sm mr-0.5 ${i < starsToShow ? "text-yellow-300" : "text-white/30"}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <div className="text-sm text-white/60">{badge}</div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-white/65">
                      <span>
                        {locked
                          ? l.id > 1
                            ? `Finish level ${l.id - 1} with ${MASTERY_UNLOCK_STARS}+ stars`
                            : "Locked"
                          : "Ready to play"}
                      </span>
                      <span>{`Best mastery: ${starsToShow}/${TOTAL_ROUNDS}`}</span>
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
            @keyframes pop { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
            @keyframes gentleShake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
            @keyframes boomingPulse { 0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(255, 140, 66, 0.28); } 50% { transform: scale(1.04); box-shadow: 0 0 36px rgba(255, 140, 66, 0.55); } }
            @keyframes confettiFall { 0% { top: -10%; opacity: 1; } 85% { opacity: 1; } 100% { top: 120%; opacity: 0; } }
            @keyframes fireworkBurst { 0% { transform: translate3d(0,0,0) scale(0.9) rotate(0deg); opacity: 0; } 10% { opacity: 1; } 100% { transform: translate3d(var(--dx), var(--dy), 0) scale(1) rotate(var(--rot)); opacity: 0; } }
            @keyframes glowPulse { 0%, 100% { box-shadow: 0 0 0 rgba(52, 211, 153, 0); } 50% { box-shadow: 0 0 40px rgba(52, 211, 153, 0.85); } }

            .ts-immersive-game header,
            .ts-immersive-game nav,
            .ts-immersive-game [role="banner"],
            .ts-immersive-game .site-header,
            .ts-immersive-game .navbar { display: none !important; }

            .choice-btn { transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease, opacity 0.15s ease; }
            .choice-btn:hover { transform: scale(1.04); box-shadow: 0 0 24px rgba(255, 255, 255, 0.22); }
            .choice-btn:active { transform: scale(0.98); }

            .choice-btn.sparkle-correct {
              animation: pop 220ms cubic-bezier(.2,.9,.2,1);
              background: rgba(45, 212, 191, 0.55) !important;
              border-color: rgba(45, 212, 191, 1) !important;
              box-shadow: 0 0 50px rgba(45, 212, 191, 0.85) !important;
            }
            .choice-btn.shake-wrong { animation: gentleShake 0.35s ease-in-out; }
            .choice-btn.glow-wrong {
              animation: pop 220ms cubic-bezier(.2,.9,.2,1);
              background: rgba(239, 68, 68, 0.45) !important;
              border-color: rgba(239, 68, 68, 1) !important;
              box-shadow: 0 0 50px rgba(239, 68, 68, 0.75) !important;
            }
            .choice-btn.pulse-correct { animation: glowPulse 0.9s ease-in-out infinite; }
            .listen-btn-booming { animation: boomingPulse 1.8s ease-in-out infinite; }

            @media (prefers-reduced-motion: reduce) {
              * { animation: none !important; transition: none !important; }
              .listen-btn-booming { animation: none !important; transform: scale(1) !important; }
            }
          `}</style>

          <button
            type="button"
            onClick={() => {
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
              navigate(buildLevelRoute(), { replace: true });
            }}
            className="absolute top-5 right-5 px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 transition-all duration-200 font-semibold shadow-lg text-white hover:text-white focus:text-white"
            style={{ zIndex: 50 }}
          >
            ← Back to Levels
          </button>

          {isComplete ? (
            <div className="text-center z-10 p-8 bg-black/30 backdrop-blur-md rounded-3xl border border-white/20">
              <h1 className="text-6xl font-bold text-yellow-300 mb-4">Level Complete!</h1>
              <div className="text-5xl mb-6">
                {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
                  <span key={i} className="text-3xl">
                    {i < starsEarned ? "★" : "☆"}
                  </span>
                ))}
              </div>
              <p className="text-2xl mb-2">Mastery Stars: {starsEarned}/{TOTAL_ROUNDS}</p>
              <p className="text-lg text-white/85 mb-4">Accuracy this round: {accuracyPct}%</p>
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
                    navigate(buildLevelRoute(), { replace: true });
                  }}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-lg font-semibold"
                  type="button"
                >
                  Choose Level
                </button>

                {selectedLevel && starsEarned >= MASTERY_UNLOCK_STARS && selectedLevel < 7 && (
                  <button
                    onClick={() => {
                      const next = selectedLevel + 1;
                      const unlocked = getUnlockedLevel(kidId);
                      if (next <= unlocked) {
                        void startLevel(next);
                        navigate(buildLevelRoute(next), { replace: true });
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
              <div
                className="absolute top-5 left-1/2 transform -translate-x-1/2 flex flex-col items-center justify-center gap-1"
                style={{ zIndex: 20 }}
              >
                <div className="text-sm md:text-base font-semibold text-gray-800/90 drop-shadow-md">
                  {`Question ${Math.min(currentRound + 1, TOTAL_ROUNDS)} of ${TOTAL_ROUNDS}`}
                </div>
                <div
                  className="flex justify-center gap-1"
                  aria-label={`Mastery stars: ${starsEarned} of ${TOTAL_ROUNDS}`}
                >
                  {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
                    <span key={i} className="text-2xl md:text-3xl drop-shadow-lg" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>
                      {i < starsEarned ? "★" : "☆"}
                    </span>
                  ))}
                </div>
                <div className="text-xs md:text-sm font-semibold text-gray-700/85">Mastery stars update with accuracy + hints</div>
              </div>

              <div
                className="absolute top-24 left-1/2 text-2xl md:text-3xl font-bold text-gray-800 drop-shadow-lg text-center"
                style={{
                  transform: "translateX(-50%)",
                  width: "min(980px, 94vw)",
                  textShadow: "2px 2px 4px rgba(255,255,255,0.5), 0 0 8px rgba(255,255,255,0.3)",
                  zIndex: 20,
                }}
              >
                1) Tap Listen, 2) Tap the letter that matches the sound
              </div>

              <div className="w-full flex items-center justify-center" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 clamp(16px, 4vw, 56px)" }}>
                <div className="flex flex-col md:flex-row items-center justify-center" style={{ gap: "clamp(24px, 7vw, 120px)", transform: "translateY(24px)" }}>
                  {/* Listen */}
                  <div className="flex flex-col items-center justify-center gap-6">
                    <button
                      onClick={playSound}
                      type="button"
                      aria-label="Listen to sound"
                      className={[
                        "relative flex items-center justify-center rounded-full shadow-2xl transition-transform hover:scale-105 active:scale-95",
                        (!hasListenedThisRound || feedback === "wrong" || nudgeText) ? "listen-btn-booming" : "",
                      ].join(" ")}
                      style={{
                        width: "clamp(200px, 30vw, 310px)",
                        height: "clamp(200px, 30vw, 310px)",
                        background: "linear-gradient(135deg, #FF8C42 0%, #FF6B35 100%)",
                        border: "8px solid rgba(255,255,255,0.9)",
                        touchAction: "manipulation",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        filter: isPromptPlaying ? "brightness(1.03)" : "none",
                      }}
                    >
                      <img
                        src="/games/phonics/letter-sound-match/listen.png"
                        alt="Listen"
                        style={{ width: "70%", height: "70%", objectFit: "contain", pointerEvents: "none" }}
                      />
                    </button>
                    <div className="text-3xl md:text-4xl font-bold text-gray-800" style={{ textShadow: "2px 2px 4px rgba(255,255,255,0.6)" }}>
                      Listen
                    </div>

                    {!hasListenedThisRound && (
                      <div className="text-lg md:text-xl font-semibold text-gray-800/90 text-center" style={{ textShadow: "1px 1px 2px rgba(255,255,255,0.6)" }}>
                        Tap Listen first
                      </div>
                    )}
                  </div>

                  {/* Choices */}
                  <div className="flex flex-col items-stretch justify-center" style={{ gap: "clamp(14px, 2.6vh, 28px)", width: "min(420px, 92vw)" }}>
                    <div className="text-sm md:text-base font-semibold text-gray-800/85 text-center">After you listen, tap one letter.</div>
                    {currentQuestion.choices.map((choice) => {
                      const allItems = LEVELS.flatMap((l) => l.items);
                      const item = allItems.find((x) => x.grapheme === choice);
                      const displayText = item ? item.display || item.grapheme : choice;

                      const isCorrect = choice === currentQuestion.target;
                      const isWrong = choice === lastTappedChoice && !isCorrect;

                      const disabled =
                        !!feedback ||
                        !choicesEnabled ||
                        !hasListenedThisRound ||
                        disabledChoices.has(choice) ||
                        (forceCorrectOnly && !isCorrect);

                      return (
                        <button
                          key={choice}
                          type="button"
                          onClick={() => handleChoice(choice)}
                          aria-label={`Choose ${displayText}`}
                          disabled={disabled}
                          className={[
                            "choice-btn flex items-center justify-center rounded-3xl shadow-xl font-black text-gray-800 transition-all",
                            feedback === "correct" && isCorrect ? "sparkle-correct" : "",
                            feedback === "wrong" && isWrong ? "glow-wrong shake-wrong" : "",
                            pulseCorrect && isCorrect ? "pulse-correct" : "",
                          ].join(" ")}
                          style={{
                            height: "clamp(96px, 16vh, 150px)",
                            background: "linear-gradient(135deg, #FFDAB9 0%, #FFB88C 100%)",
                            border: "6px solid rgba(139, 69, 19, 0.4)",
                            fontSize: displayText.length > 1 ? "clamp(2.8rem, 7vw, 4.2rem)" : "clamp(3.4rem, 8.4vw, 5rem)",
                            fontWeight: 700,
                            touchAction: "manipulation",
                            userSelect: "none",
                            WebkitUserSelect: "none",
                            opacity: disabled ? 0.62 : 1,
                            filter: disabled ? "grayscale(0.05)" : "none",
                            cursor: disabled ? "not-allowed" : "pointer",
                          }}
                        >
                          {displayText.toLowerCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Guidance text (replaces big “Try again!” loop with instruction) */}
              {!!nudgeText && (
                <div
                  className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center text-4xl font-bold drop-shadow-lg"
                  style={{
                    zIndex: 30,
                    textShadow: "2px 2px 6px rgba(0,0,0,0.75)",
                    color: feedback === "wrong" ? "#FDE68A" : "#34D399",
                  }}
                >
                  {nudgeText}
                </div>
              )}

              {/* Confetti Overlay */}
              {confettiActive && confettiPieces.length > 0 && (
                <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 60, overflow: "hidden" }} aria-hidden="true">
                  {confettiPieces.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        position: "absolute",
                        left: `${p.leftPct}%`,
                        top: "-10%",
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        backgroundColor: p.color,
                        borderRadius: "2px",
                        animation: `confettiFall ${p.duration}s linear ${p.delay}s forwards`,
                        transform: `rotate(${p.rotation}deg)`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Fireworks Overlay (mission complete only) */}
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
