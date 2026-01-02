// src/pages/kids/games/phonics/SoundDetectiveGame.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { recordLevelResult } from "../../../../games/engine/recordLevelResult";

const BASE = "/games/phonics/sound-detective";
const CONFETTI_SFX_SRC = "/confetti.mp3";

// 7 Jolly Phonics Levels (26 letters total)
type LevelDef = { id: number; title: string; focus: string[]; };
const LEVELS: LevelDef[] = [
  { id: 1, title: "Level 1 (s a t i p n)", focus: ["s", "a", "t", "i", "p", "n"] },
  { id: 2, title: "Level 2 (c k e h r m d)", focus: ["c", "k", "e", "h", "r", "m", "d"] },
  { id: 3, title: "Level 3 (g o u l f b)", focus: ["g", "o", "u", "l", "f", "b"] },
  { id: 4, title: "Level 4 (j)", focus: ["j"] },
  { id: 5, title: "Level 5 (z w v)", focus: ["z", "w", "v"] },
  { id: 6, title: "Level 6 (y x)", focus: ["y", "x"] },
  { id: 7, title: "Level 7 (q)", focus: ["q"] },
];

const TOTAL_ROUNDS = 8;

// Image catalog mapping letter to asset
const IMAGE_CATALOG = [
  { id: "apple", letter: "a", img: `${BASE}/apple.png` },
  { id: "ball", letter: "b", img: `${BASE}/ball.png` },
  { id: "cat", letter: "c", img: `${BASE}/cat.png` },
  { id: "dog", letter: "d", img: `${BASE}/dog.png` },
  { id: "elephant", letter: "e", img: `${BASE}/elephant.png` },
  { id: "fish", letter: "f", img: `${BASE}/fish.png` },
  { id: "girl", letter: "g", img: `${BASE}/girl.png` },
  { id: "hat", letter: "h", img: `${BASE}/hat.png` },
  { id: "igloo", letter: "i", img: `${BASE}/igloo.png` },
  { id: "juice", letter: "j", img: `${BASE}/juice.png` },
  { id: "kangaroo", letter: "k", img: `${BASE}/kangaroo.png` },
  { id: "lion", letter: "l", img: `${BASE}/lion.png` },
  { id: "monkey", letter: "m", img: `${BASE}/monkey.png` },
  { id: "nose", letter: "n", img: `${BASE}/nose.png` },
  { id: "orange", letter: "o", img: `${BASE}/orange.png` },
  { id: "pig", letter: "p", img: `${BASE}/pig.png` },
  { id: "queen", letter: "q", img: `${BASE}/queen.png` },
  { id: "ring", letter: "r", img: `${BASE}/ring.png` },
  { id: "sun", letter: "s", img: `${BASE}/sun.png` },
  { id: "train", letter: "t", img: `${BASE}/train.png` },
  { id: "umbrella", letter: "u", img: `${BASE}/umbrella.png` },
  { id: "van", letter: "v", img: `${BASE}/van.png` },
  { id: "watch", letter: "w", img: `${BASE}/watch.png` },
  { id: "box", letter: "x", img: `${BASE}/box.png` },
  { id: "yoyo", letter: "y", img: `${BASE}/yoyo.png` },
  { id: "zoo", letter: "z", img: `${BASE}/zoo.png` },
];

type Option = { id: string; imgSrc: string };
type AnswerState = "idle" | "correct" | "wrong";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function getCorrectOption(letter: string): Option | null {
  const item = IMAGE_CATALOG.find((c) => c.letter === letter);
  if (!item) return null;
  return { id: item.id, imgSrc: item.img };
}

// Build 3 options: 1 correct + 2 deterministic decoys
function buildOptions(letter: string, levelIndex: number, roundIndex: number): Option[] {
  const correct = getCorrectOption(letter);
  if (!correct) {
    return [
      { id: "missing", imgSrc: `${BASE}/sun.png` },
      { id: "missing2", imgSrc: `${BASE}/apple.png` },
      { id: "missing3", imgSrc: `${BASE}/ball.png` },
    ];
  }

  const others = IMAGE_CATALOG.filter((c) => c.letter !== letter);
  const seed = simpleHash(`${letter}${levelIndex}${roundIndex}`);
  const decoy1Idx = seed % others.length;
  const decoy2IdxRaw = (seed + 7) % others.length;
  const decoy2Idx = decoy2IdxRaw === decoy1Idx ? (decoy1Idx + 1) % others.length : decoy2IdxRaw;

  const decoy1 = others[decoy1Idx];
  const decoy2 = others[decoy2Idx];

  return [
    correct,
    { id: decoy1.id, imgSrc: decoy1.img },
    { id: decoy2.id, imgSrc: decoy2.img },
  ];
}

// Helper: introduced letters up to a level
const getIntroducedLetters = (levelId: number) =>
  LEVELS.filter((l) => l.id <= levelId).flatMap((l) => l.focus);

// Rule: in a level (8 rounds) any letter can appear max 2 times.
const scheduleRoundsForLevel = (levelId: number): string[] => {
  const level = LEVELS.find((l) => l.id === levelId);
  const focus = level?.focus ?? ["s"];
  const introduced = getIntroducedLetters(levelId);
  const review = introduced.filter((g) => !focus.includes(g));

  const counts: Record<string, number> = {};
  const out: string[] = [];

  const add = (g: string) => {
    counts[g] = (counts[g] || 0) + 1;
    out.push(g);
  };

  // 1) Ensure each focus letter appears once (as long as we have room)
  const focusOnce = shuffle(focus);
  for (const g of focusOnce) {
    if (out.length >= TOTAL_ROUNDS) break;
    add(g);
  }

  // 2) Add 2nd appearance for focus letters (but never exceed 2)
  const maxFocusSlots = Math.min(TOTAL_ROUNDS, focus.length * 2);
  while (out.length < maxFocusSlots) {
    const candidates = shuffle(focus).filter((g) => (counts[g] || 0) < 2);
    if (!candidates.length) break;
    add(candidates[0]);
  }

  // 3) Fill remaining with review letters (cap 2 per letter)
  const pool = shuffle(review.length ? review : introduced);
  while (out.length < TOTAL_ROUNDS && pool.length) {
    const g = pool.shift()!;
    if ((counts[g] || 0) >= 2) continue;
    add(g);
  }

  // 4) Last resort fill (should not happen)
  while (out.length < TOTAL_ROUNDS) {
    const candidates = introduced.filter((g) => (counts[g] || 0) < 2);
    const g = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : focus[0];
    add(g);
  }

  // 5) Shuffle final order + avoid immediate repeats when possible
  const rounds = shuffle(out);
  for (let i = 1; i < rounds.length; i++) {
    if (rounds[i] === rounds[i - 1]) {
      const j = rounds.findIndex((v, idx) => idx > i && v !== rounds[i - 1]);
      if (j !== -1) {
        const tmp = rounds[i];
        rounds[i] = rounds[j];
        rounds[j] = tmp;
      }
    }
  }

  return rounds;
};

export default function SoundDetectiveGame() {
  const fsRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const confettiSfxRef = useRef<HTMLAudioElement | null>(null);
  const autoPlayNextRef = useRef(false);
  const lastAutoPlayedKeyRef = useRef<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();

  // kidId: URL first, then localStorage fallback
  const urlKidId = searchParams.get("kidId") || "";
  const storedKidId =
    typeof window !== "undefined" ? (localStorage.getItem("ts_active_kid_v1") || "") : "";
  const kidId = urlKidId || storedKidId;

  // Persist kidId when present (helps future sessions)
  useEffect(() => {
    if (!kidId) return;
    try {
      localStorage.setItem("ts_active_kid_v1", kidId);
    } catch {
      // ignore
    }
  }, [kidId]);

  const [isFs, setIsFs] = useState(false);

  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [levelIndex, setLevelIndex] = useState(0); // 0-based
  const [roundIndex, setRoundIndex] = useState(0);
  const [roundLetters, setRoundLetters] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  // Stable refs to avoid stale closures
  const selectedLevelRef = useRef<number | null>(null);
  const levelIndexRef = useRef(0);
  const roundIndexRef = useRef(0);
  const roundsLenRef = useRef(TOTAL_ROUNDS);

  useEffect(() => { selectedLevelRef.current = selectedLevel; }, [selectedLevel]);
  useEffect(() => { levelIndexRef.current = levelIndex; }, [levelIndex]);
  useEffect(() => { roundIndexRef.current = roundIndex; }, [roundIndex]);
  useEffect(() => { roundsLenRef.current = roundLetters.length || TOTAL_ROUNDS; }, [roundLetters.length]);

  // Tracking (use refs for accuracy in submit even if state hasn't flushed yet)
  const levelStartMsRef = useRef<number>(Date.now());
  const levelResultSentRef = useRef<boolean>(false);

  const attemptsRef = useRef(0);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);

  const [attempts, setAttempts] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  const skillMapRef = useRef<Map<string, { attempts: number; correct: number; wrong: number }>>(
    new Map()
  );

  // UI feedback
  const [isPlaying, setIsPlaying] = useState(false);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confettiActive, setConfettiActive] = useState(false);

  // timers (avoid overlaps / leaks)
  const advanceTimeoutRef = useRef<number | null>(null);
  const confettiTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current) window.clearTimeout(advanceTimeoutRef.current);
      if (confettiTimeoutRef.current) window.clearTimeout(confettiTimeoutRef.current);
      try {
        audioRef.current?.pause();
      } catch {}
      audioRef.current = null;

      try {
        confettiSfxRef.current?.pause();
      } catch {}
      confettiSfxRef.current = null;
    };
  }, []);

  const SOUND_LEVELS = useMemo(
    () => LEVELS.map((l) => ({ id: l.id, title: l.title, items: l.focus })),
    []
  );

  const currentLetter = (roundLetters[roundIndex] || "s").toLowerCase();

  // ✅ your files are in /sound-detective root: a.mp3, b.mp3, ...
  const audioSrc = `${BASE}/${currentLetter}.mp3`;

  const options = useMemo(
    () => buildOptions(currentLetter, levelIndex, roundIndex),
    [currentLetter, levelIndex, roundIndex]
  );
  const correctOption = options[0];
  const shuffledOptions = useMemo(() => shuffle(options), [options]);

  const playConfettiSfx = useCallback(() => {
    try {
      if (!confettiSfxRef.current) {
        const a = new Audio(CONFETTI_SFX_SRC);
        a.preload = "auto";
        confettiSfxRef.current = a;
      }
      const a = confettiSfxRef.current;
      if (!a) return;

      try { a.currentTime = 0; } catch {}
      a.play().catch(() => {
        // usually allowed because this happens on user tap
      });
    } catch {
      // ignore
    }
  }, []);

  const resetLevelTracking = useCallback(() => {
    levelStartMsRef.current = Date.now();
    levelResultSentRef.current = false;

    attemptsRef.current = 0;
    correctRef.current = 0;
    wrongRef.current = 0;

    setAttempts(0);
    setCorrectCount(0);
    setWrongCount(0);

    skillMapRef.current = new Map();

    setAnswerState("idle");
    setSelectedId(null);
    setIsComplete(false);

    if (advanceTimeoutRef.current) window.clearTimeout(advanceTimeoutRef.current);
    if (confettiTimeoutRef.current) window.clearTimeout(confettiTimeoutRef.current);
    setConfettiActive(false);
  }, []);

  // Sync from URL (level param)
  useEffect(() => {
    const raw = searchParams.get("level");
    const n = raw ? parseInt(raw, 10) : NaN;

    if (!Number.isNaN(n) && n >= 1 && n <= LEVELS.length) {
      setSelectedLevel(n);
      setLevelIndex(n - 1);
      setRoundIndex(0);
      setRoundLetters(scheduleRoundsForLevel(n));
      resetLevelTracking();
    } else {
      setSelectedLevel(null);
      setIsComplete(false);
      setAnswerState("idle");
      setSelectedId(null);
      setRoundLetters([]);
      setRoundIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Preload audio on letter change
  useEffect(() => {
    const a = new Audio(audioSrc);
    a.preload = "auto";
    audioRef.current = a;
    return () => {
      try {
        a.pause();
      } catch {}
      if (audioRef.current === a) audioRef.current = null;
    };
  }, [audioSrc]);

  // Auto-play next letter sound after a correct answer advances the round
  useEffect(() => {
    if (!selectedLevel) return;
    if (isComplete) return;
    if (!autoPlayNextRef.current) return;

    const key = `${selectedLevel}:${roundIndex}`;
    if (lastAutoPlayedKeyRef.current === key) {
      autoPlayNextRef.current = false;
      return;
    }

    lastAutoPlayedKeyRef.current = key;
    autoPlayNextRef.current = false;

    // Best-effort autoplay (some browsers may still block it)
    playSoundInternal({ allowTTS: false }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLevel, roundIndex, audioSrc, isComplete]);

  // Fullscreenchange: keep isFs in sync + ESC => go back to levels
  const searchParamsRef = useRef(searchParams);
  useEffect(() => { searchParamsRef.current = searchParams; }, [searchParams]);

  useEffect(() => {
    const onFsChange = () => {
      const nowFs = document.fullscreenElement === fsRef.current;
      setIsFs(nowFs);

      if (!document.fullscreenElement && selectedLevelRef.current != null) {
        const sp = new URLSearchParams(searchParamsRef.current);
        sp.delete("level");
        sp.delete("letter");
        sp.delete("fs");
        setSearchParams(sp, { replace: true });
        setSelectedLevel(null);
        setIsComplete(false);
        setAnswerState("idle");
        setSelectedId(null);
        setIsPlaying(false);
        setRoundLetters([]);
        setRoundIndex(0);
      }
    };

    document.addEventListener("fullscreenchange", onFsChange);
    setIsFs(document.fullscreenElement === fsRef.current);

    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, [setSearchParams]);

  const playSoundInternal = async (opts?: { allowTTS?: boolean }) => {
    const allowTTS = opts?.allowTTS ?? true;
    setIsPlaying(true);

    const a = audioRef.current;
    if (a) {
      try {
        a.currentTime = 0;
        await a.play();
        a.onended = () => setIsPlaying(false);
        return;
      } catch {
        // fall through
      }
    }

    // For AUTO-play we don't want TTS fallback (it can feel weird)
    if (allowTTS && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(currentLetter);
        u.rate = 0.9;
        u.onend = () => setIsPlaying(false);
        window.speechSynthesis.speak(u);
        return;
      } catch {
        // ignore
      }
    }

    setIsPlaying(false);
  };

  // Headphones button uses this (manual tap)
  const playSound = () => playSoundInternal({ allowTTS: true });

  const submitLevelResult = async (levelId: number, completed: boolean) => {
    if (!kidId) return;
    if (levelResultSentRef.current) return;
    levelResultSentRef.current = true;

    const durationSec = Math.max(1, Math.round((Date.now() - levelStartMsRef.current) / 1000));
    const acc = attemptsRef.current > 0 ? (correctRef.current / attemptsRef.current) * 100 : 0;

    const tagDeltas: Record<string, { attempts: number; correct: number; wrong: number }> = {};
    skillMapRef.current.forEach((v, k) => {
      tagDeltas[k] = { attempts: v.attempts, correct: v.correct, wrong: v.wrong };
    });

    try {
      await recordLevelResult({
        kidId,
        gameId: "sound-detective",
        progressDocId: "phonics_sound_detective",
        levelId,
        completed,
        stars: undefined,
        score: correctRef.current,
        accuracyPct: acc,
        durationSec,
        tagDeltas,
      } as any);
    } catch (e) {
      console.error("[SoundDetective] recordLevelResult failed:", e);
    }
  };

  const onPick = (optionId: string) => {
    if (answerState !== "idle") return;
    if (isComplete) return;

    attemptsRef.current += 1;
    setAttempts((s) => s + 1);

    setSelectedId(optionId);

    const isCorrect = optionId === correctOption.id;
    setAnswerState(isCorrect ? "correct" : "wrong");

    // skill tags
    const letterTag = `letter:${currentLetter}`;
    const subtopicTag = `subtopic:sound_detective`;
    [letterTag, subtopicTag].forEach((tag) => {
      const prev = skillMapRef.current.get(tag) ?? { attempts: 0, correct: 0, wrong: 0 };
      prev.attempts += 1;
      if (isCorrect) prev.correct += 1;
      else prev.wrong += 1;
      skillMapRef.current.set(tag, prev);
    });

    if (isCorrect) {
      correctRef.current += 1;
      setCorrectCount((s) => s + 1);

      // confetti + ✅ sound
      if (confettiTimeoutRef.current) window.clearTimeout(confettiTimeoutRef.current);
      setConfettiActive(true);
      playConfettiSfx();
      confettiTimeoutRef.current = window.setTimeout(() => setConfettiActive(false), 2200);

      // ADVANCE (ref-safe)
      if (advanceTimeoutRef.current) window.clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = window.setTimeout(async () => {
        const nextIdx = roundIndexRef.current + 1;
        const len = roundsLenRef.current;

        if (nextIdx < len) {
          autoPlayNextRef.current = true; // ✅ trigger auto sound for the NEXT letter
          setRoundIndex(nextIdx);
          setAnswerState("idle");
          setSelectedId(null);
          return;
        }

        await submitLevelResult(levelIndexRef.current + 1, true);
        setIsComplete(true);
      }, 850);
    } else {
      wrongRef.current += 1;
      setWrongCount((s) => s + 1);

      if (advanceTimeoutRef.current) window.clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = window.setTimeout(() => {
        setAnswerState("idle");
        setSelectedId(null);
      }, 650);
    }
  };

  // startLevel: mounts gameplay first, requests fullscreen, updates URL
  const startLevel = async (levelId: number) => {
    setSelectedLevel(levelId);
    setLevelIndex(levelId - 1);
    setRoundIndex(0);
    setRoundLetters(scheduleRoundsForLevel(levelId));
    resetLevelTracking();

    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

    try {
      const target = fsRef.current || document.documentElement;
      if ((target as any)?.requestFullscreen) {
        await (target as any).requestFullscreen({ navigationUI: "hide" } as any);
      } else if ((target as any)?.webkitRequestFullscreen) {
        (target as any).webkitRequestFullscreen();
      }
    } catch {
      // ignore
    }

    const sp = new URLSearchParams(searchParams);
    sp.set("level", String(levelId));
    if (kidId) sp.set("kidId", kidId);
    setSearchParams(sp, { replace: true });
  };

  const goBackToLevels = async () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen().catch(() => {});
      }
    } catch {
      // ignore
    } finally {
      const sp = new URLSearchParams(searchParams);
      sp.delete("level");
      sp.delete("letter");
      sp.delete("fs");
      setSearchParams(sp, { replace: true });

      setSelectedLevel(null);
      setIsComplete(false);
      setAnswerState("idle");
      setSelectedId(null);
      setIsPlaying(false);
      setRoundLetters([]);
      setRoundIndex(0);

      if (advanceTimeoutRef.current) window.clearTimeout(advanceTimeoutRef.current);
      if (confettiTimeoutRef.current) window.clearTimeout(confettiTimeoutRef.current);
      setConfettiActive(false);
    }
  };

  // Card slots (left, middle, right)
  const cardSlots: React.CSSProperties[] = [
    { left: "14%", top: "57%", width: "22%", height: "32%" },
    { left: "39%", top: "57%", width: "22%", height: "32%" },
    { left: "64%", top: "57%", width: "22%", height: "32%" },
  ];

  // Levels screen
  const LevelsUI = (
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
        @media (prefers-reduced-motion: reduce) { .level-card { transition:none !important } }
      `}</style>

      <div className="w-full max-w-6xl mx-auto text-center mb-8">
        <h1 className="text-5xl font-bold text-white">Choose Level</h1>
        <p className="text-white/70 mt-2">Pick a Jolly Phonics level to play Sound Detective</p>
      </div>

      <div className="level-grid w-full max-w-3xl mx-auto">
        {SOUND_LEVELS.map((l) => (
          <button key={l.id} type="button" onClick={() => startLevel(l.id)} className="level-card">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-white">{l.title}</div>
                <div className="text-sm text-white/80 mt-2">{l.items.join(" ")}</div>
              </div>
              <div className="text-sm text-white/60">Play</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // Gameplay UI
  const GameplayUI = selectedLevel ? (
    <div className={isFs ? "fixed inset-0 w-screen h-screen" : "relative w-full"}>
      <div className={isFs ? "w-screen h-screen" : "mx-auto w-full max-w-[1200px] select-none"}>
        <div className={isFs ? "w-screen h-screen" : "w-full"}>
          <div
            className={
              isFs
                ? "relative w-screen h-screen overflow-hidden"
                : "relative w-full aspect-video max-w-[1800px] max-h-screen overflow-hidden rounded-2xl shadow-lg"
            }
          >
            {/* Background */}
            <img
              src={`${BASE}/bg.jpg`}
              alt="Sound Detective Background"
              className="absolute inset-0 h-full w-full object-cover select-none z-0"
              draggable={false}
            />

            {/* Progress */}
            <div className="absolute top-3 left-3 rounded-full bg-black/40 px-3 py-1 text-xs text-white font-medium z-20">
              Level {levelIndex + 1}/{LEVELS.length} • Round {roundIndex + 1}/{roundLetters.length || TOTAL_ROUNDS}
            </div>

            {/* Back button */}
            <div className="absolute top-3 right-3 z-30">
              <button
                type="button"
                onClick={goBackToLevels}
                className="px-4 py-2 bg-black/65 text-white rounded-full text-sm font-semibold shadow-md backdrop-blur-sm"
              >
                ← Back to Levels
              </button>
            </div>

            {/* Headphones */}
            <div className="absolute z-30" style={{ left: "35%", top: "30%", transform: "translate(-50%,-50%)" }}>
              <div style={{ width: "clamp(110px,12vw,190px)", height: "clamp(110px,12vw,190px)" }} className="relative">
                <div
                  className="absolute inset-[-18%] rounded-full"
                  style={{
                    background: "radial-gradient(closest-side, rgba(59,130,246,0.14), rgba(59,130,246,0) 55%)",
                    filter: "blur(10px)",
                  }}
                />
                <button type="button" onClick={playSound} className="relative w-full h-full" aria-label="Play sound">
                  <img
                    src={`${BASE}/headphones.png`}
                    alt="Headphones"
                    className="w-full h-full object-contain select-none opacity-100"
                    draggable={false}
                  />
                </button>
              </div>
            </div>

            {/* Letter */}
            <div className="absolute z-20" style={{ left: "55%", top: "30%", transform: "translate(-50%,-50%)" }}>
              <div
                className="text-white font-extrabold tracking-wide drop-shadow-lg select-none"
                style={{ fontSize: "clamp(120px,12vw,240px)", lineHeight: 1 }}
              >
                {currentLetter}
              </div>
            </div>

            {/* Choice cards */}
            {shuffledOptions.map((opt, i) => {
              const offset = i === 0 ? "-4%" : i === 2 ? "4%" : "0%";
              const isSelected = selectedId === opt.id;

              const isCorrectPick = answerState === "correct" && opt.id === correctOption.id;
              const isWrongPick = answerState === "wrong" && isSelected;

              return (
                <button
                  key={`${opt.id}-${i}`}
                  type="button"
                  onClick={() => onPick(opt.id)}
                  disabled={isPlaying}
                  className={[
                    "absolute rounded-2xl",
                    "transition-transform duration-150",
                    "active:scale-[0.98]",
                    "hover:shadow-xl",
                    isCorrectPick ? "ring-8 ring-green-400/80" : "",
                    isWrongPick ? "animate-[shake_0.25s_ease-in-out_0s_2]" : "",
                  ].join(" ")}
                  style={cardSlots[i]}
                  aria-label="Pick answer"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[70%] h-[70%] flex items-center justify-center" style={{ transform: `translate(${offset}, -22%)` }}>
                      <img
                        src={opt.imgSrc}
                        alt=""
                        className="w-full h-full object-contain block drop-shadow-md select-none"
                        draggable={false}
                      />
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Completion overlay */}
            {isComplete && (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/95 via-pink-500/95 to-orange-500/95 flex flex-col items-center justify-center text-center z-50 backdrop-blur-sm">
                <div className="text-8xl mb-4 animate-bounce">🎉</div>
                <h2 className="text-4xl font-bold text-white mb-2">Level Complete!</h2>
                <p className="text-white/90 mb-6">
                  Great job — you finished this level. (Attempts: {attempts}, Correct: {correctCount}, Wrong: {wrongCount})
                </p>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      const next = levelIndex + 2;
                      if (next <= LEVELS.length) {
                        const sp = new URLSearchParams(searchParams);
                        sp.set("level", String(next));
                        if (kidId) sp.set("kidId", kidId);
                        setSearchParams(sp, { replace: true });
                        setIsComplete(false);
                      } else {
                        goBackToLevels();
                      }
                    }}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-lg"
                  >
                    Next Level ▶
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRoundIndex(0);
                      setRoundLetters(scheduleRoundsForLevel(levelIndex + 1));
                      resetLevelTracking();
                    }}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg"
                  >
                    Replay
                  </button>

                  <button
                    type="button"
                    onClick={goBackToLevels}
                    className="px-6 py-3 bg-black/65 text-white rounded-2xl font-bold shadow-lg"
                  >
                    ← Back to Levels
                  </button>
                </div>
              </div>
            )}

            {/* Hint */}
            <div className="absolute bottom-3 left-4 rounded-full bg-black/35 px-3 py-1 text-xs text-white z-30">
              Tap 🎧 then choose the picture
            </div>

            {/* Confetti */}
            {confettiActive && (() => {
              const colors = ["#FFD54A", "#FF7A59", "#FF4D8D", "#7C5CFF", "#2EE6A6", "#FFFFFF"];
              const confettiPieces = Array.from({ length: 22 }, (_, idx) => ({
                id: idx,
                left: Math.random() * 100,
                color: colors[idx % colors.length],
                delay: Math.random() * 0.6,
                duration: 1 + Math.random() * 0.8,
              }));

              return (
                <div className="absolute inset-0 pointer-events-none z-40">
                  {confettiPieces.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        left: `${p.left}%`,
                        top: 0,
                        width: 10,
                        height: 10,
                        backgroundColor: p.color,
                        position: "absolute",
                        animation: `confettiFall ${p.duration}s linear forwards`,
                        animationDelay: `${p.delay}s`,
                      }}
                    />
                  ))}
                </div>
              );
            })()}

            <style>{`
              @keyframes shake {
                0% { transform: translateX(0); }
                25% { transform: translateX(-6px); }
                50% { transform: translateX(6px); }
                75% { transform: translateX(-6px); }
                100% { transform: translateX(0); }
              }
              @keyframes confettiFall {
                0% { transform: translateY(-8vh) rotate(0deg); opacity: 1 }
                100% { transform: translateY(110vh) rotate(360deg); opacity: 0 }
              }
              @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
            `}</style>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div
      ref={fsRef}
      className={isFs ? "fixed inset-0 z-[9999] w-screen h-screen select-none" : "relative w-full select-none"}
      draggable={false}
    >
      {!selectedLevel && LevelsUI}
      {selectedLevel && GameplayUI}
    </div>
  );
}
