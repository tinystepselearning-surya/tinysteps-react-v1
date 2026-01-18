// src/pages/KidsBalloonPop.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";

type Balloon = {
  id: number;
  letter: string;
  x: number; // percent 0..100
  y: number; // percent (0 at top, 100 at bottom)
  speed: number; // percent per second
  wobblePhase?: number;
  isPopping?: boolean; // correct pop burst only
  popAt?: number;

  // New: wrong-feedback states
  shakeUntil?: number; // timestamp
  disabledUntil?: number; // timestamp (errorless rescue)
};

type LevelConfig = {
  id: number;
  title: string;
  letters: string[];
  balloonCount: number;
  speedMin: number;
  speedMax: number;
};

// --- CONFIG (pedagogy-friendly defaults) ---
const TARGET_CORRECT = 10;

// Reduce early load slightly (you can tune)
const JOLLY_LEVELS: LevelConfig[] = [
  { id: 1, title: "Level 1", letters: ["s", "a", "t", "i", "p", "n"], balloonCount: 5, speedMin: 7, speedMax: 12 },
  { id: 2, title: "Level 2", letters: ["c", "k", "e", "h", "r", "m"], balloonCount: 5, speedMin: 7, speedMax: 13 },
  { id: 3, title: "Level 3", letters: ["d", "g", "o", "u", "l", "f"], balloonCount: 6, speedMin: 8, speedMax: 14 },
  { id: 4, title: "Level 4", letters: ["b", "j"], balloonCount: 6, speedMin: 9, speedMax: 15 },
  { id: 5, title: "Level 5", letters: ["v", "w"], balloonCount: 6, speedMin: 10, speedMax: 16 },
  { id: 6, title: "Level 6", letters: ["x", "y"], balloonCount: 6, speedMin: 10, speedMax: 17 },
  { id: 7, title: "Level 7", letters: ["q", "z"], balloonCount: 6, speedMin: 11, speedMax: 18 },
];

type Progress = {
  unlocked: number;
  completed: Record<number, { stars: number; bestScore: number }>;
};

const BALLOON_BODY_W = 120;
const BALLOON_BODY_H = 145;
const STRING_H = 48;
const BALLOON_BTN_W = BALLOON_BODY_W;
const BALLOON_BTN_H = BALLOON_BODY_H + STRING_H + 8;

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const choice = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

const getProgressKey = (kidId: string) =>
  kidId ? `ts_balloonpop_progress_${kidId}` : "ts_balloonpop_progress_guest";

const loadProgress = (kidId: string): Progress => {
  if (typeof window === "undefined") return { unlocked: 1, completed: {} };
  try {
    const raw = localStorage.getItem(getProgressKey(kidId));
    if (!raw) return { unlocked: 1, completed: {} };
    const parsed = JSON.parse(raw);
    return { unlocked: parsed.unlocked || 1, completed: parsed.completed || {} };
  } catch {
    return { unlocked: 1, completed: {} };
  }
};

const saveProgress = (kidId: string, progress: Progress) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getProgressKey(kidId), JSON.stringify(progress));
  } catch {}
};

// --- Non-overlapping spawn ---
const MIN_DX = 16;
const MIN_DY = 22;

const makeBalloonNoOverlap = (
  id: number,
  letters: string[],
  speedMin: number,
  speedMax: number,
  existing: Balloon[]
): Balloon => {
  for (let attempt = 0; attempt < 25; attempt++) {
    const x = rand(10, 90);
    const y = rand(110, 170);
    const overlaps = existing.some((b) => Math.abs(x - b.x) < MIN_DX && Math.abs(y - b.y) < MIN_DY);
    if (!overlaps) {
      return {
        id,
        letter: choice(letters),
        x,
        y,
        speed: rand(speedMin, speedMax),
        wobblePhase: rand(0, Math.PI * 2),
      };
    }
  }

  // fallback pattern
  const count = existing.length + 1;
  const spacing = count > 1 ? 76 / (count - 1) : 0;
  const x = 12 + (id % count) * spacing;
  const y = 110 + ((id % 3) * 18);
  return { id, letter: choice(letters), x, y, speed: rand(speedMin, speedMax), wobblePhase: rand(0, Math.PI * 2) };
};

// Ensure there are >= desiredCount visible target balloons (to reduce searching frustration)
const ensureTargetCount = (balloons: Balloon[], target: string, desiredCount: number): Balloon[] => {
  const currentCount = balloons.filter((b) => b.letter === target && !b.isPopping).length;
  if (currentCount >= desiredCount) return balloons;

  const needed = desiredCount - currentCount;
  const candidates = balloons.filter((b) => b.letter !== target && !b.isPopping);

  const visibleCandidates = candidates.filter((b) => b.y >= -10 && b.y <= 95);
  const toConvert =
    visibleCandidates.length >= needed
      ? visibleCandidates.slice(0, needed)
      : [...visibleCandidates, ...candidates.slice(0, needed - visibleCandidates.length)];

  const convertIds = new Set(toConvert.map((b) => b.id));
  return balloons.map((b) => (convertIds.has(b.id) ? { ...b, letter: target } : b));
};

const BALLOON_COLORS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
];

// --- Audio pools (your existing approach) ---
type SfxKey = "pop" | "correct" | "wrong" | "confetti";
const SFX_BASE = "/games/phonics/balloon-pop";
const LETTER_BASE = "/games/phonics/balloon-pop";

const SFX_URLS: Record<SfxKey, string> = {
  pop: `${SFX_BASE}/pop.mp3`,
  correct: `${SFX_BASE}/correct.mp3`,
  wrong: `${SFX_BASE}/wrong.mp3`,
  confetti: `${SFX_BASE}/confetti.mp3`,
};

const letterSoundUrl = (letter: string) => `${LETTER_BASE}/${(letter || "").toLowerCase()}.mp3`;

function makePool(src: string, poolSize = 4) {
  const pool = Array.from({ length: poolSize }, () => {
    const a = new Audio(src);
    a.preload = "auto";
    a.volume = 0.8;
    return a;
  });
  let idx = 0;

  async function tryPlay(a: HTMLAudioElement) {
    try {
      a.pause();
      a.currentTime = 0;
      const p = a.play();
      if (p && typeof (p as any).then === "function") await p;
      return true;
    } catch {
      return false;
    }
  }

  return {
    prime: async () => {
      try {
        const a = pool[0];
        a.muted = true;
        const ok = await tryPlay(a);
        a.pause();
        a.currentTime = 0;
        a.muted = false;
        return ok;
      } catch {
        return false;
      }
    },
    play: async (volume = 0.85) => {
      const a = pool[idx];
      idx = (idx + 1) % pool.length;
      a.volume = volume;
      return await tryPlay(a);
    },
  };
}

function useBalloonPopSfx() {
  const poolsRef = React.useRef<{
    sfx: Record<SfxKey, ReturnType<typeof makePool>>;
    letters: Record<string, ReturnType<typeof makePool>>;
  } | null>(null);

  if (!poolsRef.current) {
    poolsRef.current = {
      sfx: {
        pop: makePool(SFX_URLS.pop, 5),
        correct: makePool(SFX_URLS.correct, 4),
        wrong: makePool(SFX_URLS.wrong, 3),
        confetti: makePool(SFX_URLS.confetti, 2),
      },
      letters: {},
    };
  }

  const prime = React.useCallback(async () => {
    const p = poolsRef.current!;
    await Promise.all([p.sfx.pop.prime(), p.sfx.correct.prime(), p.sfx.wrong.prime(), p.sfx.confetti.prime()]);
  }, []);

  const playSfx = React.useCallback(async (key: SfxKey, volume?: number) => {
    return await poolsRef.current!.sfx[key].play(volume);
  }, []);

  const playLetter = React.useCallback(async (letter: string, volume = 0.9) => {
    const p = poolsRef.current!;
    const key = (letter || "").toLowerCase();
    if (!key) return false;
    if (!p.letters[key]) p.letters[key] = makePool(letterSoundUrl(key), 2);
    return await p.letters[key].play(volume);
  }, []);

  return { prime, playSfx, playLetter };
}

const KidsBalloonPop: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const kidId = searchParams.get("kidId") || "";

  const sfx = useBalloonPopSfx();

  const audioPrimedRef = useRef(false);
  const ensureAudioPrimed = useCallback(async () => {
    if (audioPrimedRef.current) return;
    audioPrimedRef.current = true;
    await sfx.prime();
  }, [sfx]);

  const [progress, setProgress] = useState<Progress>(() => loadProgress(kidId));

  const levelParam = searchParams.get("level");
  const currentLevelId = levelParam ? parseInt(levelParam, 10) : null;
  const currentLevel = currentLevelId ? JOLLY_LEVELS.find((l) => l.id === currentLevelId) : null;

  const navigateWithKid = useCallback(
    (path: string) => {
      const params = new URLSearchParams();
      if (kidId) params.set("kidId", kidId);
      navigate(`${path}?${params.toString()}`);
    },
    [kidId, navigate]
  );

  const goToLevels = useCallback(() => {
    navigateWithKid("/kids/games/phonics/balloon-pop");
  }, [navigateWithKid]);

  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [fsBlocked, setFsBlocked] = useState(false);

  const [target, setTarget] = useState<string>("");
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  // Replace “lives” with “mistakes” (non-punitive)
  const [mistakes, setMistakes] = useState(0);

  const [levelComplete, setLevelComplete] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [hintUntil, setHintUntil] = useState<number>(0);
  const wrongStreakRef = useRef(0);

  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const lastCorrectPopRef = useRef<number>(Date.now());
  const containerRef = useRef<HTMLDivElement | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const confettiGeneratedRef = useRef<boolean>(false);

  // --- Fullscreen helpers ---
  const playLevel = useCallback(
    async (levelId: number) => {
      if (levelId > progress.unlocked) return;

      setFullscreenMode(true);
      setFeedback(null);
      setFsBlocked(false);

      // Wait a tick for container render
      await new Promise((r) => setTimeout(r, 50));

      // Request fullscreen inside user gesture
      try {
        const elem = containerRef.current;
        if (!elem) return;

        if (elem.requestFullscreen) await elem.requestFullscreen();
        else if ((elem as any).webkitRequestFullscreen) await (elem as any).webkitRequestFullscreen();
      } catch {
        setFsBlocked(true);
        setTimeout(() => setFsBlocked(false), 4000);
      }

      // Update URL
      const params = new URLSearchParams();
      if (kidId) params.set("kidId", kidId);
      params.set("level", String(levelId));
      navigate(`/kids/games/phonics/balloon-pop?${params.toString()}`, { replace: true });

      // Init balloons
      const level = JOLLY_LEVELS.find((l) => l.id === levelId);
      if (!level) return;

      const initial: Balloon[] = [];
      for (let i = 0; i < level.balloonCount; i++) {
        initial.push(makeBalloonNoOverlap(i, level.letters, level.speedMin, level.speedMax, initial));
      }

      const t = choice(level.letters);
      const desiredTargetCount = Math.min(2, level.balloonCount, level.letters.length);

      setBalloons(ensureTargetCount(initial, t, desiredTargetCount));
      setTarget(t);

      setScore(0);
      setCorrectCount(0);
      setMistakes(0);
      wrongStreakRef.current = 0;

      setHasStarted(false);
      setLevelComplete(false);
      lastCorrectPopRef.current = Date.now();
    },
    [kidId, navigate, progress.unlocked]
  );

  const exitFullscreen = useCallback(() => {
    setFullscreenMode(false);
    setHasStarted(false);

    try {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
    } catch {}

    goToLevels();
  }, [goToLevels]);

  useEffect(() => {
    const handleFSChange = () => {
      const isFull = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      if (!isFull && fullscreenMode) {
        setFullscreenMode(false);
        setHasStarted(false);
        goToLevels();
      }
    };
    document.addEventListener("fullscreenchange", handleFSChange);
    document.addEventListener("webkitfullscreenchange", handleFSChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFSChange);
      document.removeEventListener("webkitfullscreenchange", handleFSChange);
    };
  }, [fullscreenMode, goToLevels]);

  useEffect(() => {
    document.body.style.overflow = fullscreenMode ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [fullscreenMode]);

  // Respawn balloon by id (same id, no new balloon ids)
  const respawn = useCallback(
    (id: number, ensureTarget?: string) => {
      if (!currentLevel) return;

      setBalloons((prev) => {
        const others = prev.filter((b) => b.id !== id);
        const next = makeBalloonNoOverlap(id, currentLevel.letters, currentLevel.speedMin, currentLevel.speedMax, others);

        const updated = prev.map((b) => (b.id === id ? next : b));
        const desiredTargetCount = Math.min(2, currentLevel.balloonCount, currentLevel.letters.length);
        const t = (ensureTarget ?? target) || "";
        return t ? ensureTargetCount(updated, t, desiredTargetCount) : updated;
      });
    },
    [currentLevel, target]
  );

  const pickNewTarget = useCallback(
    (prev?: string) => {
      if (!currentLevel) return prev || "";
      if (currentLevel.letters.length === 1) return currentLevel.letters[0];

      let next = choice(currentLevel.letters);
      let attempts = 0;
      while (next === prev && attempts < 8) {
        next = choice(currentLevel.letters);
        attempts += 1;
      }

      const desiredTargetCount = Math.min(2, currentLevel.balloonCount, currentLevel.letters.length);
      setBalloons((prevB) => ensureTargetCount(prevB, next, desiredTargetCount));
      lastCorrectPopRef.current = Date.now();
      return next;
    },
    [currentLevel]
  );

  const completeLevel = useCallback(() => {
    if (!currentLevel) return;

    setLevelComplete(true);
    confettiGeneratedRef.current = false;

    sfx.playSfx("confetti", 1.0);

    // Stars based on mistakes (not punitive)
    const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;

    const newProgress: Progress = {
      unlocked: Math.min(7, Math.max(progress.unlocked, currentLevel.id + 1)),
      completed: {
        ...progress.completed,
        [currentLevel.id]: {
          stars,
          bestScore: Math.max(progress.completed[currentLevel.id]?.bestScore || 0, score),
        },
      },
    };

    setProgress(newProgress);
    saveProgress(kidId, newProgress);

    // Optional: recordLevelResult (kept as you had; safe best-effort)
    if (kidId) {
      (async () => {
        try {
          const { recordLevelResult } = await import("../games/engine/recordLevelResult");
          const attempts = correctCount + mistakes;
          await recordLevelResult({
            kidId,
            gameId: "balloon-pop",
            progressDocId: "phonics_balloon_pop",
            levelId: currentLevel.id,
            completed: true,
            stars,
            score: correctCount,
            accuracyPct: attempts > 0 ? (correctCount / attempts) * 100 : 0,
            tagDeltas: {
              "subtopic:letter_sounds": { attempts, correct: correctCount, wrong: mistakes },
            },
          });
        } catch {
          // non-blocking
        }
      })();
    }
  }, [currentLevel, mistakes, progress, kidId, sfx, score, correctCount]);

  const playNextLevel = useCallback(() => {
    if (!currentLevel || currentLevel.id >= 7) return;
    const nextLevelId = currentLevel.id + 1;
    if (nextLevelId > progress.unlocked) return;
    playLevel(nextLevelId);
  }, [currentLevel, progress.unlocked, playLevel]);

  const replayLevel = useCallback(() => {
    if (!currentLevel) return;
    playLevel(currentLevel.id);
  }, [currentLevel, playLevel]);

  // Big cue button: (optional) reinforces letter with sound
  const handleHearAgain = useCallback(async () => {
    if (!target) return;
    await ensureAudioPrimed();
    await sfx.playLetter(target, 0.95);
  }, [target, ensureAudioPrimed, sfx]);

  // --- Core fix: only correct balloons pop ---
  const handlePop = useCallback(
    async (id: number) => {
      if (!hasStarted || levelComplete) return;

      const now = Date.now();
      const b = balloons.find((x) => x.id === id);
      if (!b || b.isPopping) return;

      // If temporarily disabled (errorless rescue)
      if (b.disabledUntil && now < b.disabledUntil) return;

      const wasCorrect = b.letter === target;

      if (!wasCorrect) {
        // WRONG: do NOT pop. Shake + feedback + hint ladder.
        await ensureAudioPrimed();
        sfx.playSfx("wrong", 0.9);

        setBalloons((prev) =>
          prev.map((x) =>
            x.id === id ? { ...x, shakeUntil: now + 260 } : x
          )
        );

        setMistakes((m) => m + 1);
        setFeedback("Try again!");
        window.setTimeout(() => setFeedback(null), 700);

        // Increase wrong streak and escalate help
        const nextStreak = wrongStreakRef.current + 1;
        wrongStreakRef.current = nextStreak;

        if (nextStreak === 2) {
          // Pulse target balloons
          setHintUntil(now + 900);
        } else if (nextStreak >= 3) {
          // Errorless rescue: temporarily disable/dim non-target balloons
          const lockMs = 1500;
          setHintUntil(now + lockMs);
          setBalloons((prev) =>
            prev.map((x) =>
              x.letter !== target
                ? { ...x, disabledUntil: now + lockMs, shakeUntil: x.id === id ? now + 260 : x.shakeUntil }
                : { ...x, disabledUntil: undefined }
            )
          );
        }

        // Optional gentle re-cue after wrong
        window.setTimeout(() => {
          void handleHearAgain();
        }, 250);

        return;
      }

      // CORRECT: pop + respawn + new target
      wrongStreakRef.current = 0;
      setHintUntil(0);

      await ensureAudioPrimed();
      sfx.playSfx("pop", 0.85);
      sfx.playSfx("correct", 0.9);

      setBalloons((prev) => prev.map((x) => (x.id === id ? { ...x, isPopping: true, popAt: now } : x)));

      // Update score/progress
      setScore((s) => s + 1);
      setCorrectCount((c) => {
        const nc = c + 1;
        if (nc >= TARGET_CORRECT) {
          window.setTimeout(() => completeLevel(), 350);
        }
        return nc;
      });

      // Choose next target and ensure it exists
      const nextTarget = pickNewTarget(target);
      setTarget(nextTarget);

      // Respawn the popped balloon after burst
      window.setTimeout(() => {
        respawn(id, nextTarget);
      }, 240);
    },
    [hasStarted, levelComplete, balloons, target, ensureAudioPrimed, sfx, handleHearAgain, pickNewTarget, respawn, completeLevel]
  );

  // --- Animation loop (fixed: no balloon-count growth) ---
  useEffect(() => {
    if (!hasStarted || !fullscreenMode || !currentLevel || levelComplete) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTimeRef.current = null;
      return;
    }

    const desiredTargetCount = Math.min(2, currentLevel.balloonCount, currentLevel.letters.length);

    // Reduced motion: slower interval updates
    if (prefersReducedMotion) {
      const interval = window.setInterval(() => {
        const now = Date.now();

        // periodic hint if no correct for a while
        if (now - lastCorrectPopRef.current > 4500) {
          setHintUntil(now + 900);
          lastCorrectPopRef.current = now;
        }

        setBalloons((prev) => {
          const moved = prev.map((b) => {
            if (b.isPopping) return b;
            const y = b.y - 2.4;
            if (y < -25) {
              const others = prev.filter((x) => x.id !== b.id);
              return makeBalloonNoOverlap(b.id, currentLevel.letters, currentLevel.speedMin, currentLevel.speedMax, others);
            }
            return { ...b, y };
          });
          return ensureTargetCount(moved, target, desiredTargetCount);
        });
      }, 140);

      return () => window.clearInterval(interval);
    }

    const step = (ts: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = ts;
      const rawDtSec = (ts - lastTimeRef.current) / 1000;
      const dtSec = Math.min(0.033, rawDtSec);
      lastTimeRef.current = ts;

      const now = Date.now();
      if (now - lastCorrectPopRef.current > 4500) {
        setHintUntil(now + 900);
        lastCorrectPopRef.current = now;
      }

      setBalloons((prev) => {
        const moved = prev.map((b) => {
          if (b.isPopping) return b;
          const y = b.y - b.speed * dtSec;
          if (y < -25) {
            const others = prev.filter((x) => x.id !== b.id);
            return makeBalloonNoOverlap(b.id, currentLevel.letters, currentLevel.speedMin, currentLevel.speedMax, others);
          }
          return { ...b, y };
        });
        return ensureTargetCount(moved, target, desiredTargetCount);
      });

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTimeRef.current = null;
    };
  }, [hasStarted, fullscreenMode, currentLevel, levelComplete, target]);

  // --- Landing page ---
  if (!fullscreenMode) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-start py-8 px-4"
        style={{ background: "linear-gradient(180deg, #667eea 0%, #764ba2 100%)" }}
      >
        <style>{`
          .level-card { padding:18px; border-radius:16px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); cursor:pointer; transition:all 0.2s ease; }
          .level-card:hover:not(.locked) { background:rgba(255,255,255,0.08); transform:translateY(-2px); }
          .level-card.locked { opacity:0.4; cursor:not-allowed; }
          @media (prefers-reduced-motion: reduce) { .level-card { transition:none !important; transform:none !important; } }
        `}</style>

        <Link
          to={kidId ? `/kids/games/phonics?kidId=${encodeURIComponent(kidId)}` : "/kids/games/phonics"}
          className="absolute top-3 right-3 px-4 py-2 bg-black/90 hover:bg-black/95 text-white font-semibold rounded-full shadow-lg transition-all duration-200"
          style={{ zIndex: 50 }}
        >
          ← Back to Phonics Library
        </Link>

        <div className="w-full max-w-6xl mx-auto text-center mb-8">
          <h1 className="text-5xl font-bold text-white">Choose Level</h1>
          <p className="text-white/70 mt-2">Pick a Jolly Phonics level to play Balloon Pop</p>

          {!kidId && (
            <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-500/40 rounded-lg max-w-md mx-auto">
              <p className="text-yellow-200 font-semibold mb-3">⚠️ No child selected</p>
              <p className="text-yellow-100/80 text-sm mb-4">Please go back and choose a child to track progress.</p>
              <Link
                to="/parent"
                className="inline-block px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors"
              >
                ← Back to Parent Dashboard
              </Link>
            </div>
          )}
        </div>

        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {JOLLY_LEVELS.map((level) => {
            const locked = level.id > progress.unlocked;
            const completed = progress.completed[level.id];
            const stars = completed ? "⭐".repeat(completed.stars) : "";
            return (
              <button
                key={level.id}
                type="button"
                aria-label={`Level ${level.id} ${level.title}`}
                onClick={() => {
                  if (!locked) void playLevel(level.id);
                }}
                className={`level-card ${locked ? "locked" : ""}`}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="text-left flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold text-white">{level.title}</div>
                        {completed && <div className="text-base">{stars}</div>}
                      </div>
                      <div className="text-sm text-white/80 mt-2">{level.letters.join(" ")}</div>
                      {completed && (
                        <div className="text-xs text-green-300 mt-1 font-semibold">
                          Completed • Best: {completed.bestScore}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-white/60 font-semibold">{locked ? "🔒 Locked" : "▶ Play"}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // --- Fullscreen game ---
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #87CEEB 0%, #B0E8FF 40%, #E0F6FF 70%, #F0F9FF 100%)",
        width: "100vw",
        height: "100vh",
      }}
    >
      <style>{`
        @keyframes hintPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); box-shadow: 0 0 0 rgba(251, 191, 36, 0); }
          50% { transform: translate(-50%, -50%) scale(1.15); box-shadow: 0 0 40px rgba(251, 191, 36, 0.8), 0 0 80px rgba(251, 191, 36, 0.4); }
        }
        @keyframes sparkleFade {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(0.5); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes wrongWiggle {
          0%, 100% { transform: translate3d(var(--wx), -50%, 0) translateX(-50%) rotate(0deg); }
          25% { transform: translate3d(calc(var(--wx) - 4px), -50%, 0) translateX(-50%) rotate(-2deg); }
          75% { transform: translate3d(calc(var(--wx) + 4px), -50%, 0) translateX(-50%) rotate(2deg); }
        }
        @keyframes popBurst {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
        }
        .burst-particle {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.9), rgba(255,215,0,0.6));
          animation: popBurst 0.22s ease-out forwards;
        }
        .balloon-btn { border-radius: 9999px; -webkit-tap-highlight-color: transparent; outline: none; }
        .balloon-btn:focus-visible { box-shadow: 0 0 0 10px rgba(253, 224, 71, 0.14); outline: none; }

        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>

      {/* Exit */}
      <button
        onClick={exitFullscreen}
        className="absolute top-4 right-4 z-50 px-4 py-2 bg-red-500/90 hover:bg-red-600 text-white font-semibold rounded-full shadow-lg backdrop-blur-sm"
      >
        ✕ Exit
      </button>

      {/* HUD */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex gap-4 items-center bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full shadow-xl border border-white/50">
        <div className="text-sm font-semibold text-gray-800">{currentLevel?.title || "Level"}</div>
        <div className="text-sm font-semibold text-gray-800">
          Score: <span className="font-bold text-green-600">{score}</span>
        </div>
        <div className="text-sm font-semibold text-gray-800">
          Progress: <span className="font-bold text-blue-600">{correctCount}/{TARGET_CORRECT}</span>
        </div>
      </div>

      {/* Helper text */}
      <div className="absolute top-20 left-6 z-30 flex items-center gap-3">
        <div className="text-white/70 text-sm font-medium backdrop-blur-sm bg-black/10 px-3 py-1.5 rounded-lg">
          👆 Tap the balloon with letter: <span className="font-bold text-white text-lg">{target}</span>
        </div>
        <button
          onClick={handleHearAgain}
          className="px-3 py-1.5 bg-blue-500/90 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-lg backdrop-blur-sm transition-all"
          style={{ touchAction: "manipulation" }}
        >
          🔊 Hear Again
        </button>
      </div>

      {/* Fullscreen blocked toast */}
      {fsBlocked && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg z-50">
          Tap fullscreen icon / allow fullscreen
        </div>
      )}

      {/* Tap to Start overlay */}
      {!hasStarted && !levelComplete && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <button
            onClick={async () => {
              await ensureAudioPrimed();
              setHasStarted(true);
              // Optional: play target sound once at start (reinforces without requiring)
              if (target) await sfx.playLetter(target, 0.95);
            }}
            className="px-16 py-8 bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:from-green-500 hover:via-green-600 hover:to-green-700 text-white text-5xl font-black rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-200"
            style={{
              animation: "bounce 1.5s ease-in-out infinite",
              boxShadow: "0 0 60px rgba(34, 197, 94, 0.6), 0 20px 50px rgba(0,0,0,0.5)",
            }}
          >
            🎈 Tap to Start! 🎈
          </button>
        </div>
      )}

      {/* Balloons */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ paddingBottom: 150, paddingTop: 100 }}>
        {balloons.map((b) => {
          const now = Date.now();
          const elapsed = (now - startTimeRef.current) * 0.001;
          const wobbleOffset = Math.sin((elapsed + (b.wobblePhase || 0)) * 2) * 10;

          const shouldPulse = b.letter === target && !b.isPopping && now < hintUntil;
          const isDisabled = !!(b.disabledUntil && now < b.disabledUntil);
          const isShaking = !!(b.shakeUntil && now < b.shakeUntil);

          if (b.isPopping) {
            const particles = Array.from({ length: 10 }, (_, i) => {
              const angle = (i / 10) * Math.PI * 2;
              const distance = 25;
              const xOffset = Math.cos(angle) * distance;
              const yOffset = Math.sin(angle) * distance;
              return (
                <div
                  key={i}
                  className="burst-particle"
                  style={{
                    left: "50%",
                    top: "50%",
                    transform: `translate(calc(-50% + ${xOffset}px), calc(-50% + ${yOffset}px))`,
                  }}
                />
              );
            });

            return (
              <div
                key={b.id}
                className="absolute"
                style={{
                  left: `calc(${b.x}% + ${wobbleOffset}px)`,
                  top: `${b.y}%`,
                  width: BALLOON_BODY_W,
                  height: BALLOON_BODY_H,
                  pointerEvents: "none",
                  zIndex: 25,
                }}
              >
                {particles}
              </div>
            );
          }

          return (
            <button
              key={b.id}
              onClick={() => void handlePop(b.id)}
              aria-label={`Balloon ${b.letter}`}
              className="absolute balloon-btn"
              style={{
                left: `${b.x}%`,
                top: `${b.y}%`,
                // CSS var for wiggle animation
                // @ts-ignore
                ["--wx" as any]: `${wobbleOffset}px`,
                transform: `translate3d(${wobbleOffset}px, -50%, 0) translateX(-50%)`,
                width: BALLOON_BTN_W,
                height: BALLOON_BTN_H,
                zIndex: 20,
                background: "transparent",
                border: "none",
                cursor: isDisabled ? "default" : "pointer",
                padding: 8,
                willChange: "transform",
                opacity: isDisabled ? 0.55 : 1,
                filter: isDisabled ? "grayscale(0.2)" : "none",
                animation: shouldPulse ? "hintPulse 0.8s ease-in-out" : isShaking ? "wrongWiggle 0.26s ease-in-out" : "none",
                touchAction: "manipulation",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            >
              {/* Curved string */}
              <svg
                width={44}
                height={STRING_H}
                viewBox="0 0 44 46"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: BALLOON_BODY_H + 2,
                  transform: "translateX(-50%)",
                  pointerEvents: "none",
                  opacity: 0.6,
                }}
              >
                <path
                  d="M22 0 C 14 10, 30 18, 19 28 C 10 36, 28 40, 22 46"
                  fill="none"
                  stroke="rgba(0,0,0,0.35)"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </svg>

              {/* Balloon body */}
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 0,
                  transform: "translateX(-50%)",
                  width: BALLOON_BODY_W,
                  height: BALLOON_BODY_H,
                  borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                  background: BALLOON_COLORS[b.id % BALLOON_COLORS.length],
                  boxShadow: "0 12px 35px rgba(0,0,0,0.35), inset 0 -3px 10px rgba(0,0,0,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  outline: isDisabled ? "6px solid rgba(255,255,255,0.25)" : "none",
                }}
              >
                {/* Shine */}
                <div
                  style={{
                    position: "absolute",
                    top: "15%",
                    left: "20%",
                    width: "35%",
                    height: "40%",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(ellipse at center, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 40%, transparent 70%)",
                    transform: "rotate(-25deg)",
                    pointerEvents: "none",
                  }}
                />

                {/* Letter */}
                <span
                  style={{
                    fontSize: b.letter.length > 1 ? 40 : 50,
                    fontWeight: 900,
                    color: "#fff",
                    textShadow: "2px 2px 8px rgba(0,0,0,0.5), 0 0 4px rgba(0,0,0,0.3)",
                    zIndex: 1,
                  }}
                >
                  {b.letter}
                </span>
              </div>

              {/* Knot */}
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: BALLOON_BODY_H - 12,
                  transform: "translateX(-50%)",
                  width: 0,
                  height: 0,
                  borderLeft: "10px solid transparent",
                  borderRight: "10px solid transparent",
                  borderTop: "14px solid rgba(0,0,0,0.35)",
                  filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.25))",
                  pointerEvents: "none",
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Bottom cue (keep as your “POP: letter” because this is a letter-ID game) */}
      {hasStarted && !levelComplete && (
        <button
          onClick={handleHearAgain}
          className="absolute left-1/2 px-8 py-4 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 rounded-full font-black text-white focus:outline-none focus:ring-4 focus:ring-yellow-500"
          style={{
            bottom: 24,
            transform: "translateX(-50%)",
            zIndex: 30,
            border: "4px solid rgba(255,255,255,0.9)",
            touchAction: "manipulation",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl opacity-80">POP:</span>
            <span className={`${target.length > 1 ? "text-5xl" : "text-6xl"} drop-shadow-lg`}>{target}</span>
            <span className="text-xl opacity-80">🔊</span>
          </div>
        </button>
      )}

      {/* Feedback */}
      {feedback && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-6 py-3 rounded-full text-lg font-bold shadow-lg z-50">
          {feedback}
        </div>
      )}

      {/* Level Complete overlay */}
      {levelComplete && currentLevel && (() => {
        if (!confettiGeneratedRef.current) confettiGeneratedRef.current = true;
        const confettiPieces = Array.from({ length: 25 }, (_, i) => ({
          id: i,
          left: Math.random() * 100,
          color: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F"][i % 6],
          delay: Math.random() * 0.5,
          duration: 1.2 + Math.random() * 0.6,
        }));

        const stars = mistakes === 0 ? "⭐⭐⭐" : mistakes <= 2 ? "⭐⭐" : "⭐";

        return (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/95 via-pink-500/95 to-orange-500/95 flex flex-col items-center justify-center text-center z-50 backdrop-blur-sm">
            {confettiPieces.map((piece) => (
              <div
                key={piece.id}
                className="absolute pointer-events-none"
                style={{
                  left: `${piece.left}%`,
                  top: 0,
                  width: 10,
                  height: 10,
                  backgroundColor: piece.color,
                  animation: `confettiFall ${piece.duration}s ease-in forwards`,
                  animationDelay: `${piece.delay}s`,
                }}
              />
            ))}

            <div className="text-8xl mb-4">🎉</div>
            <h2 className="text-6xl font-bold text-white mb-2">{currentLevel.title} Complete!</h2>
            <div className="text-7xl mb-4">{stars}</div>
            <p className="text-3xl text-white mb-8">
              Score: <span className="font-bold text-yellow-200">{score}</span>
            </p>

            <div className="flex gap-4 flex-wrap justify-center">
              {currentLevel.id < 7 && currentLevel.id + 1 <= progress.unlocked && (
                <button
                  onClick={playNextLevel}
                  className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-2xl text-2xl font-bold text-white shadow-2xl transform hover:scale-105 transition-all"
                  style={{ touchAction: "manipulation" }}
                >
                  ➡️ Next Level
                </button>
              )}
              <button
                onClick={replayLevel}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl text-2xl font-bold text-white shadow-2xl transform hover:scale-105 transition-all"
                style={{ touchAction: "manipulation" }}
              >
                🔄 Replay
              </button>
              <button
                onClick={exitFullscreen}
                className="px-8 py-4 bg-gray-700 hover:bg-gray-800 rounded-2xl text-2xl font-bold text-white shadow-2xl transform hover:scale-105 transition-all"
                style={{ touchAction: "manipulation" }}
              >
                ⬅️ Back to Levels
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default KidsBalloonPop;
