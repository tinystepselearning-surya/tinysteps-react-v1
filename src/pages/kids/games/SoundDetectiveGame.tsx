import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { recordLevelResult } from '../../../games/engine/recordLevelResult';

const BASE = "/games/phonics/sound-detective";

// 5 Level groups as per the plan
const LETTER_GROUPS = [
  ["s", "a", "t", "p", "i", "n"],
  ["m", "d", "g", "o", "c"],
  ["k", "e", "r", "h", "b"],
  ["f", "l", "u", "j", "w"],
  ["v", "y", "x", "q", "z"],
] as const;

// Image catalog mapping letter to asset
const IMAGE_CATALOG = [
  { id: "apple", letter: "a", img: `${BASE}/apple.png` },
  { id: "ball", letter: "b", img: `${BASE}/ball.png` },
  { id: "cat", letter: "c", img: `${BASE}/cat.png` },
  { id: "dog", letter: "d", img: `${BASE}/dog.png` },
  { id: "elephant", letter: "e", img: `${BASE}/elephant.png` },
  { id: "fish", letter: "f", img: `${BASE}/fish.png` },
  { id: "grape", letter: "g", img: `${BASE}/grape.png` },
  { id: "hat", letter: "h", img: `${BASE}/hat.png` },
  { id: "igloo", letter: "i", img: `${BASE}/igloo.png` },
  { id: "jug", letter: "j", img: `${BASE}/jug.png` },
  { id: "kite", letter: "k", img: `${BASE}/kite.png` },
  { id: "lion", letter: "l", img: `${BASE}/lion.png` },
  { id: "mango", letter: "m", img: `${BASE}/mango.png` },
  { id: "nest", letter: "n", img: `${BASE}/nest.png` },
  { id: "orange", letter: "o", img: `${BASE}/orange.png` },
  { id: "pig", letter: "p", img: `${BASE}/pig.png` },
  { id: "queen", letter: "q", img: `${BASE}/queen.png` },
  { id: "rabbit", letter: "r", img: `${BASE}/rabbit.png` },
  { id: "sun", letter: "s", img: `${BASE}/sun.png` },
  { id: "tiger", letter: "t", img: `${BASE}/tiger.png` },
  { id: "umbrella", letter: "u", img: `${BASE}/umbrella.png` },
  { id: "van", letter: "v", img: `${BASE}/van.png` },
  { id: "whale", letter: "w", img: `${BASE}/whale.png` },
  { id: "xray", letter: "x", img: `${BASE}/xray.png` },
  { id: "yoyo", letter: "y", img: `${BASE}/yoyo.png` },
  { id: "zebra", letter: "z", img: `${BASE}/zebra.png` },
];

type Option = { id: string; imgSrc: string };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Simple hash for deterministic decoy selection
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Get correct option for a letter
function getCorrectOption(letter: string): Option | null {
  const item = IMAGE_CATALOG.find((c) => c.letter === letter);
  if (!item) return null;
  return { id: item.id, imgSrc: item.img };
}

// Build 3 options: 1 correct + 2 deterministic decoys
function buildOptions(
  letter: string,
  levelGroupIndex: number,
  letterIndexWithinGroup: number
): Option[] {
  const correct = getCorrectOption(letter);
  if (!correct) {
    // Fallback: return placeholder
    return [
      { id: "missing", imgSrc: `${BASE}/sun.png` },
      { id: "missing2", imgSrc: `${BASE}/apple.png` },
      { id: "missing3", imgSrc: `${BASE}/ball.png` },
    ];
  }

  // Get all other catalog items (excluding current letter)
  const others = IMAGE_CATALOG.filter((c) => c.letter !== letter);
  if (others.length < 2) {
    // Not enough decoys, duplicate for safety
    return [correct, correct, correct];
  }

  // Deterministic seed from current position
  const seed = simpleHash(`${letter}${levelGroupIndex}${letterIndexWithinGroup}`);
  const decoy1Idx = seed % others.length;
  const decoy2Idx = (seed + 7) % others.length;

  const decoy1 = others[decoy1Idx];
  const decoy2 = others[decoy2Idx === decoy1Idx ? (decoy1Idx + 1) % others.length : decoy2Idx]
;                                                                                             
  return [
    correct,
    { id: decoy1.id, imgSrc: decoy1.img },
    { id: decoy2.id, imgSrc: decoy2.img },
  ];
}

type AnswerState = "idle" | "correct" | "wrong";

export default function SoundDetectiveGame() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Fullscreen wrapper ref
  const fsRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const [isFs, setIsFs] = useState<boolean>(() => !!document.fullscreenElement);
  const [hasUserGesture, setHasUserGesture] = useState(false);
  const levelStartMsRef = useRef<number>(Date.now());
  const levelResultSentRef = useRef<boolean>(false);
  const location = useLocation();

  // Tracking state
  const [attempts, setAttempts] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const masteredTagsRef = useRef<Set<string>>(new Set());
  const skillMapRef = useRef<Map<string, { attempts: number; correct: number; wrong: number }>>(new Map());

  // Confetti
  const [confettiActive, setConfettiActive] = useState(false);
  // resetLevelTracking defined earlier near tracking state

  const isDocFullscreen = () => !!document.fullscreenElement;

  const enterFullscreen = React.useCallback(async () => {
    try {
      const el = containerRef.current || document.documentElement;
      if (!el) return;

      if ((el as any).requestFullscreen) {
        await (el as any).requestFullscreen();
      } else if ((el as any).webkitRequestFullscreen) {
        await (el as any).webkitRequestFullscreen();
      } else if ((el as any).webkitEnterFullscreen) {
        await (el as any).webkitEnterFullscreen();
      } else if (document.documentElement && (document.documentElement as any).requestFullscreen) {
        // Fallback: request on documentElement
        await (document.documentElement as any).requestFullscreen();
      }
    } catch (e) {
      // Ignore failures (browsers may block without gesture)
    }
  }, []);

  const exitFullscreen = React.useCallback(() => {
    try {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    } catch (e) {
      // ignore
    }
  }, []);
  const [levelGroupIndex, setLevelGroupIndex] = useState(0);
  const [letterIndexWithinGroup, setLetterIndexWithinGroup] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [singleLevelMode, setSingleLevelMode] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  // Prefer kidId from URL, fall back to persistent storage (same pattern used elsewhere)
  const urlKidId = searchParams.get('kidId') || '';
  const storedKidId = typeof window !== 'undefined' ? (localStorage.getItem('ts_active_kid_v1') || '') : '';
  const kidId = urlKidId || storedKidId;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Compute current letter from indexes
  const currentLetter = LETTER_GROUPS[levelGroupIndex]?.[letterIndexWithinGroup] || "s";
  const currentGroup = LETTER_GROUPS[levelGroupIndex] || [];

  // Build simple level defs from LETTER_GROUPS
  const SOUND_LEVELS = LETTER_GROUPS.map((group, i) => ({ id: i + 1, title: `Level ${i + 1}`, items: group }));
  
  // Build options for current letter
  const options = useMemo(
    () => buildOptions(currentLetter, levelGroupIndex, letterIndexWithinGroup),
    [currentLetter, levelGroupIndex, letterIndexWithinGroup]
  );

  const correctOption = options[0]; // First option is always correct
  const shuffledOptions = useMemo(() => shuffle(options), [options]);

  const audioSrc = `${BASE}/audio/${currentLetter}.mp3`;

  const resetLevelTracking = React.useCallback(() => {
    levelStartMsRef.current = Date.now();
    levelResultSentRef.current = false;
    setAttempts(0);
    setCorrectCount(0);
    setWrongCount(0);
    masteredTagsRef.current = new Set();
    skillMapRef.current = new Map();
  }, []);

  // Effect A: read level query param (watch for changes to searchParams)
  useEffect(() => {
    const levelParam = parseInt(searchParams.get('level') || '', 10);
    if (!isNaN(levelParam) && levelParam >= 1 && levelParam <= LETTER_GROUPS.length) {
      setSelectedLevel(levelParam);
      setLevelGroupIndex(levelParam - 1);
      setLetterIndexWithinGroup(0);
      setSingleLevelMode(true);
    }
  }, [searchParams]);

  // Effect B: preload audio (depends only on audioSrc)
  useEffect(() => {
    audioRef.current = new Audio(audioSrc);
    audioRef.current.preload = 'auto';
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [audioSrc]);

  // Reset tracking when a level selection starts
  useEffect(() => {
    if (selectedLevel != null) {
      resetLevelTracking();
    }
  }, [selectedLevel, resetLevelTracking]);

  // Reset tracking when entering a new group/level
  useEffect(() => {
    // only reset if we're inside play (selectedLevel set) or we're progressing through groups
    if (selectedLevel != null || !singleLevelMode) {
      resetLevelTracking();
    }
  }, [levelGroupIndex, resetLevelTracking, selectedLevel, singleLevelMode]);

  // Submit a level result once per level end
  const submitLevelResult = async (levelId: number, completed: boolean) => {
    if (!kidId) {
      console.warn('[SoundDetective] No kidId present; skipping recordLevelResult');
      return;
    }
    if (levelResultSentRef.current) return;
    levelResultSentRef.current = true;

    const eventId = (typeof crypto !== 'undefined' && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : `${Date.now()}-${Math.floor(Math.random()*100000)}`;
    const durationSec = Math.max(1, Math.round((Date.now() - (levelStartMsRef.current || Date.now())) / 1000));
    const accuracyPct = attempts ? Math.round((correctCount / attempts) * 100) : 0;
    const score = correctCount;

    // Build tagDeltas from skillMapRef and skillResults array
    const tagDeltas: Record<string, { attempts: number; correct: number; wrong: number }> = {};
    const skillResults: Array<{ tag: string; attempts: number; correct: number; wrong: number }> = [];
    skillMapRef.current.forEach((v, k) => {
      tagDeltas[k] = { attempts: v.attempts, correct: v.correct, wrong: v.wrong };
      skillResults.push({ tag: k, attempts: v.attempts, correct: v.correct, wrong: v.wrong });
    });

    const payload = {
      kidId,
      gameId: 'sound-detective',
      progressDocId: 'phonics_sound_detective',
      levelId,
      completed,
      stars: undefined,
      score,
      accuracy: accuracyPct,
      accuracyPct,
      timeSpentSec: durationSec,
      durationSec,
      attempts,
      correct: correctCount,
      wrong: wrongCount,
      pointsEarned: score,
      tagDeltas,
      skillResults,
      evidence: { itemId: currentLetter },
      eventId,
      schemaVersion: 1,
    } as const;

    try {
      const res = await recordLevelResult(payload as any);
      console.info('[SoundDetective] recordLevelResult Success', res);
    } catch (err) {
      console.error('[SoundDetective] recordLevelResult failed (non-blocking):', err);
    }
  };

  // Fullscreen change listener + mount attempt
  useEffect(() => {
    const onFsChange = () => {
      const isFsNow = document.fullscreenElement === fsRef.current;
      setIsFs(isFsNow);
      if (!isFsNow) {
        try { document.body.classList.remove('ts-immersive-game'); } catch (e) {}
        try { if ((screen.orientation as any)?.unlock) { (screen.orientation as any).unlock(); } } catch (e) {}
      } else {
        try { document.body.classList.add('ts-immersive-game'); } catch (e) {}
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);

    // initialize fullscreen state
    setIsFs(document.fullscreenElement === fsRef.current);

    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
    };
  }, [enterFullscreen]);

  // (No-op) we do not auto-enter fullscreen from pointer events; fullscreen must be user-initiated from Play click
  const handlePointerDown = () => {};

  useEffect(() => {
    // reset UI when letter changes
    setAnswerState("idle");
    setSelectedId(null);
    setIsPlaying(false);
  }, [currentLetter]);

  const playSound = async () => {
    // Do not enter fullscreen here; Play click on Levels must handle fullscreen
    setIsPlaying(true);

    // Try mp3 first if available
    if (audioRef.current && audioSrc) {
      try {
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
        audioRef.current.onended = () => setIsPlaying(false);
        return;
      } catch (error) {
        // mp3 failed or not found, fall through to TTS
        console.warn('[SoundDetective] Audio file not found, using TTS fallback');
      }
    }

    // Fallback to TTS
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(currentLetter);
        utterance.rate = 0.9;
        utterance.onend = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
      } catch {
        setIsPlaying(false);
      }
    } else {
      setIsPlaying(false);
    }
  };

  const onPick = (optionId: string) => {
    if (answerState !== "idle") return;

    // Record attempt
    setAttempts((s) => s + 1);

    setSelectedId(optionId);
    const correct = optionId === correctOption.id;
    setAnswerState(correct ? "correct" : "wrong");

    // Tags for this attempt
    const letterTag = `letter:${currentLetter}`;
    const subtopicTag = `subtopic:sound_detective`;
    const tags = [letterTag, subtopicTag];

    // Update skillMapRef
    tags.forEach((tag) => {
      const prev = skillMapRef.current.get(tag) ?? { attempts: 0, correct: 0, wrong: 0 };
      prev.attempts += 1;
      if (correct) prev.correct += 1; else prev.wrong += 1;
      skillMapRef.current.set(tag, prev);
    });

    if (correct) {
      setCorrectCount((s) => s + 1);
      tags.forEach((t) => masteredTagsRef.current.add(t));

      // show confetti briefly
      try {
        setConfettiActive(true);
        setTimeout(() => setConfettiActive(false), 2200);
      } catch {}

      window.setTimeout(async () => {
        // Move to next letter
        const nextLetterIndex = letterIndexWithinGroup + 1;

        if (nextLetterIndex < currentGroup.length) {
          // Next letter in same group
          setLetterIndexWithinGroup(nextLetterIndex);
          // keep the levelStartMsRef (ongoing level)
        } else {
          // End of current group - submit results for this level
          const levelId = levelGroupIndex + 1;
          await submitLevelResult(levelId, true);

          if (singleLevelMode) {
            // In single-level mode we stop here
            setIsComplete(true);
          } else {
            // Move to next group
            const nextGroupIndex = levelGroupIndex + 1;
            if (nextGroupIndex < LETTER_GROUPS.length) {
              setLevelGroupIndex(nextGroupIndex);
              setLetterIndexWithinGroup(0);
              // reset counters for next level
              resetLevelTracking();
            } else {
              // All levels complete
              setIsComplete(true);
            }
          }
        }
      }, 900);
    } else {
      // wrong pick
      setWrongCount((s) => s + 1);
      // allow retry after short pause
      window.setTimeout(() => {
        setAnswerState("idle");
        setSelectedId(null);
      }, 700);
    }
  };

  const handleRestart = () => {
    setLevelGroupIndex(0);
    setLetterIndexWithinGroup(0);
    setIsComplete(false);
    setAnswerState("idle");
    setSelectedId(null);
    // exit single-level mode when restarting
    setSelectedLevel(null);
    setSingleLevelMode(false);
    resetLevelTracking();
  };

  // Start a specific level (called from Choose Level UI). Must be called from a user gesture.
  const startLevel = async (levelId: number) => {
    // Ensure fullscreen request is invoked synchronously from the click handler
    try {
      const el = fsRef.current || containerRef.current || document.documentElement;
      if (el && (el as any).requestFullscreen) {
        await (el as any).requestFullscreen();
      } else if (el && (el as any).webkitRequestFullscreen) {
        (el as any).webkitRequestFullscreen();
      }

      try { document.body.classList.add('ts-immersive-game'); } catch (e) {}
      if (window.matchMedia('(max-width: 767px)').matches && (screen.orientation as any)?.lock) {
        try { await (screen.orientation as any).lock('landscape'); } catch (e) {}
      }
    } catch (e) {
      // ignore fullscreen failure
    }

    // reflect level in URL (this drives state via the searchParams effect)
    try {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('level', String(levelId));
      setSearchParams(newParams, { replace: false });
    } catch (e) {
      // ignore
    }
  };

  // Call fullscreen request synchronously (must run inside user gesture)
  const safeEnterFullscreen = async () => {
    try {
      const el = fsRef.current || containerRef.current || document.documentElement;
      if (!el) return;
      if ((el as any).requestFullscreen) {
        await (el as any).requestFullscreen({ navigationUI: 'hide' } as any);
      } else if ((el as any).webkitRequestFullscreen) {
        (el as any).webkitRequestFullscreen();
      } else if ((el as any).webkitEnterFullscreen) {
        (el as any).webkitEnterFullscreen();
      }
      setIsFs(document.fullscreenElement === el);
      try { document.body.classList.add('ts-immersive-game'); } catch (e) {}
    } catch (e) {
      // ignore
    }
  };

  const safeExitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    } catch (e) {
      // ignore
    } finally {
      try { document.body.classList.remove('ts-immersive-game'); } catch (e) {}
      try { if ((screen.orientation as any)?.unlock) { (screen.orientation as any).unlock(); } } catch (e) {}
      setIsFs(false);
    }
  };

  const goBackToLevels = async () => {
    // Exit fullscreen first
    try {
      await safeExitFullscreen();
    } catch (e) {}

    // Remove level / letter / fs params and return to level chooser (replace history)
    try {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('level');
      newParams.delete('letter');
      newParams.delete('fs');
      const to = `${location.pathname}${newParams.toString() ? `?${newParams.toString()}` : ''}`;
      navigate(to, { replace: true });
    } catch (e) {
      // fallback: clear local state
      setSelectedLevel(null);
      setSingleLevelMode(false);
      setIsComplete(false);
    }
  };

  // Positions tuned for your 2048x1152 background (percentage-based so it scales)
  // NOTE: headphone positions are inline in the stage for flexible tuning — removed unused headphoneBtnStyle

  // Three card slots (left, middle, right)
  const cardSlots: React.CSSProperties[] = [
    { left: "14%", top: "57%", width: "22%", height: "32%" },
    { left: "39%", top: "57%", width: "22%", height: "32%" },
    { left: "64%", top: "57%", width: "22%", height: "32%" },
  ];

  // Stage content (rendered when a level is selected)
  const stageContent = selectedLevel ? (
    <div className="mx-auto w-full max-w-[1200px] select-none">
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        className="w-full h-full"
        style={{ touchAction: "none" }}
      >
        <div className={`${isFs ? "flex items-center justify-center bg-black" : ""} w-full h-full`}>
          <div className={`${isFs ? 'relative w-full h-full overflow-hidden' : 'relative w-full aspect-video max-w-[1800px] max-h-screen overflow-hidden rounded-2xl shadow-lg'}`}>
            {/* Background */}
            <img
              src={`${BASE}/bg.png`}
              alt="Sound Detective Background"
              className="absolute inset-0 h-full w-full object-cover select-none z-0"
              draggable={false}
            />

            {/* Progress indicator */}
            <div className="absolute top-3 left-3 rounded-full bg-black/40 px-3 py-1 text-xs text-white font-medium">
              Level {levelGroupIndex + 1}/5 • Letter {letterIndexWithinGroup + 1}/{currentGroup.length}
            </div>

            {/* Headphones absolute (left of S) */}
              <div
                className="absolute z-30"
                style={{ left: "35%", top: "30.0%", transform: "translate(-50%,-50%)" }}
              >
              <div
                style={{ width: "clamp(110px,12vw,190px)", height: "clamp(110px,12vw,190px)" }}
                className="relative"
              >
                {/* Glow behind icon */}
                <div
                  className={`absolute inset-[-18%] rounded-full ${isPlaying ? "hp-glow-playing" : "hp-glow-idle"}`}
                  style={{
                    background:
                      "radial-gradient(closest-side, rgba(59,130,246,0.14), rgba(59,130,246,0) 55%)",
                  }}
                />

                <div className={isPlaying ? "hp-pop-playing" : "hp-pop-idle"} style={{ width: "100%", height: "100%" }}>
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
            </div>

            {/* Letter */}
            <div className="absolute z-20" style={{ left: "55.0%", top: "29.9%", transform: "translate(-50%,-50%)" }}>
                <div
                  className="text-white font-extrabold tracking-wide drop-shadow-lg select-none uppercase"
                  style={{ fontSize: "clamp(110px,12vw,220px)", lineHeight: 1 }}
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
                    <div
                      className="w-[70%] h-[70%] flex items-center justify-center"
style={{ transform: `translate(${offset}, -22%)` }}
                    >
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

            {/* Fullscreen gating removed — Play button now initiates fullscreen directly */}

            {/* Exit fullscreen button */}
            {isFs && (
              <div className="absolute top-3 right-3">
                <button
                  type="button"
                  onClick={() => goBackToLevels()}
                  className="px-4 py-2 bg-black/65 text-white rounded-full text-sm font-semibold shadow-md backdrop-blur-sm"
                  aria-label="Back to Levels"
                >
                  ← Back to Levels
                </button>
              </div>
            )}

            {/* Completion overlay (Next / Replay / Back to Levels) */}
            {isComplete && (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/95 via-pink-500/95 to-orange-500/95 flex flex-col items-center justify-center text-center z-50 backdrop-blur-sm">
                <div className="text-8xl mb-4 animate-bounce">🎉</div>
                <h2 className="text-4xl font-bold text-white mb-2">Level Complete!</h2>
                <p className="text-white/90 mb-6">Great job — you finished this level.</p>
                <div className="flex gap-4 mb-6">
                  <button
                    type="button"
                    onClick={async () => {
                      // Next: advance to next letter or next level, or go back to levels
                      const nextLetterIndex = letterIndexWithinGroup + 1;
                      if (nextLetterIndex < currentGroup.length) {
                        setLetterIndexWithinGroup(nextLetterIndex);
                        setIsComplete(false);
                        resetLevelTracking();
                      } else {
                        const nextLevelIndex = levelGroupIndex + 1;
                        if (nextLevelIndex < LETTER_GROUPS.length) {
                          const newParams = new URLSearchParams(searchParams);
                          newParams.set('level', String(nextLevelIndex + 1));
                          setSearchParams(newParams, { replace: false });
                          setIsComplete(false);
                          resetLevelTracking();
                        } else {
                          await goBackToLevels();
                        }
                      }
                    }}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-lg"
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Replay current level: restart group
                      setLetterIndexWithinGroup(0);
                      setIsComplete(false);
                      resetLevelTracking();
                    }}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg"
                  >
                    Replay
                  </button>
                  <button
                    type="button"
                    onClick={() => goBackToLevels()}
                    className="px-6 py-3 bg-black/65 text-white rounded-2xl font-bold shadow-lg"
                  >
                    ← Back to Levels
                  </button>
                </div>
              </div>
            )}

            {/* Helper hint */}
            <div className="absolute bottom-3 left-4 rounded-full bg-black/35 px-3 py-1 text-xs text-white">
              Tap 🎧 then choose the picture
            </div>

            {/* Confetti overlay (triggered on correct) */}
            {confettiActive && (() => {
              const colors = ['#FFD54A', '#FF7A59', '#FF4D8D', '#7C5CFF', '#2EE6A6', '#FFFFFF'];
              const confettiPieces = Array.from({ length: 22 }, (_, i) => ({ id: i, left: Math.random() * 100, color: colors[i % colors.length], delay: Math.random() * 0.6, duration: 1 + Math.random() * 0.8 }));
              return (
                <div className="absolute inset-0 pointer-events-none z-40">
                  {confettiPieces.map(p => (
                    <div key={p.id} style={{ left: `${p.left}%`, top: 0, width: 10, height: 10, backgroundColor: p.color, position: 'absolute', animation: `confettiFall ${p.duration}s linear forwards`, animationDelay: `${p.delay}s` }} />
                  ))}
                </div>
              );
            })()}

            {/* Animations */}
            <style>{`
              @keyframes shake {
                0% { transform: translateX(0); }
                25% { transform: translateX(-6px); }
                50% { transform: translateX(6px); }
                75% { transform: translateX(-6px); }
                100% { transform: translateX(0); }
              }

              @keyframes hpPop { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
              @keyframes hpGlow { 0%,100%{opacity:.55; filter:blur(14px)} 50%{opacity:1; filter:blur(18px)} }

              .hp-pop-idle { animation: hpPop 1400ms ease-in-out infinite; transform-origin:center; }
              .hp-pop-playing { animation: hpPop 850ms ease-in-out infinite; transform-origin:center; }

              .hp-glow-idle { animation: hpGlow 1400ms ease-in-out infinite; }
              .hp-glow-playing { animation: hpGlow 850ms ease-in-out infinite; }

              @media (prefers-reduced-motion: reduce) {
                .hp-pop-idle, .hp-pop-playing, .hp-glow-playing { animation: none !important; }
              }

              /* Simple confetti fall */
              @keyframes confettiFall {
                0% { transform: translateY(-8vh) rotate(0deg); opacity: 1 }
                100% { transform: translateY(110vh) rotate(360deg); opacity: 0 }
              }
            `}</style>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div ref={fsRef} className={isFs ? "fixed inset-0 z-[9999] w-screen h-screen bg-black select-none" : "relative w-full select-none"} draggable={false}>
      {/* Choose Level screen when no level selected */}
      {!selectedLevel && (
        <div className="relative min-h-screen flex flex-col items-center justify-start py-12 px-4 overflow-hidden" style={{ background: 'linear-gradient(180deg, #050510 0%, #150a2b 35%, #0b2a5e 100%)', boxShadow: 'inset 0 0 160px rgba(0,0,0,0.75)' }}>
          <style>{`
            .level-grid { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:16px; max-width:900px; }
            .level-card { padding:18px; border-radius:16px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); cursor:pointer; }
            .level-card.locked { opacity:0.4; cursor:not-allowed; }
            @media (prefers-reduced-motion: reduce) { .level-card { transition:none !important } }
          `}</style>

          <div className="w-full max-w-6xl mx-auto text-center mb-8">
            <h1 className="text-5xl font-bold text-white">Choose Level</h1>
            <p className="text-white/70 mt-2">Pick a level to play Sound Detective</p>
          </div>

          <div className="level-grid w-full max-w-3xl mx-auto">
            {SOUND_LEVELS.map(l => {
              const locked = l.id > 1; // lock levels > 1 by default
              return (
                <button key={l.id} type="button" aria-label={`Level ${l.id} ${l.title}`} onClick={() => { if (!locked) startLevel(l.id); }} className={`level-card ${locked ? 'locked' : ''}`}>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-white">{l.title}</div>
                        <div className="text-sm text-white/80 mt-2">{l.items.join(' ')}</div>
                      </div>
                      <div className="text-sm text-white/60">{locked ? 'Locked 🔒' : 'Play'}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {stageContent}
    </div>
  );
}
