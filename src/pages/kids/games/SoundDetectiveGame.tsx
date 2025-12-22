import React, { useEffect, useMemo, useRef, useState } from "react";

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
  const decoy2 = others[decoy2Idx === decoy1Idx ? (decoy1Idx + 1) % others.length : decoy2Idx];

  return [
    correct,
    { id: decoy1.id, imgSrc: decoy1.img },
    { id: decoy2.id, imgSrc: decoy2.img },
  ];
}

type AnswerState = "idle" | "correct" | "wrong";

export default function SoundDetectiveGame() {
  // Fullscreen & gesture refs/states
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasUserGesture, setHasUserGesture] = useState(false);

  const isDocFullscreen = () => !!document.fullscreenElement;
  const enterFullscreen = async () => {
    try {
      if (containerRef.current && (containerRef.current as any).requestFullscreen) {
        await (containerRef.current as any).requestFullscreen();
      }
    } catch (e) {
      // Ignore failures (browsers may block without gesture)
      // console.warn('enterFullscreen failed', e);
    }
  };
  const exitFullscreen = () => {
    try {
      document.exitFullscreen?.();
    } catch (e) {
      // ignore
    }
  };
  const [levelGroupIndex, setLevelGroupIndex] = useState(0);
  const [letterIndexWithinGroup, setLetterIndexWithinGroup] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Compute current letter from indexes
  const currentLetter = LETTER_GROUPS[levelGroupIndex]?.[letterIndexWithinGroup] || "s";
  const currentGroup = LETTER_GROUPS[levelGroupIndex] || [];
  
  // Build options for current letter
  const options = useMemo(
    () => buildOptions(currentLetter, levelGroupIndex, letterIndexWithinGroup),
    [currentLetter, levelGroupIndex, letterIndexWithinGroup]
  );

  const correctOption = options[0]; // First option is always correct
  const shuffledOptions = useMemo(() => shuffle(options), [options]);

  const audioSrc = `${BASE}/audio/${currentLetter}.mp3`;

  useEffect(() => {
    // Preload audio if available (optional)
    audioRef.current = new Audio(audioSrc);
    audioRef.current.preload = "auto";
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [audioSrc]);

  // Fullscreen change listener + mount attempt
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(isDocFullscreen());
    document.addEventListener('fullscreenchange', onFsChange);

    // Try best-effort enter fullscreen on mount (may be blocked)
    (async () => {
      try {
        await enterFullscreen();
      } catch {}
      setIsFullscreen(isDocFullscreen());
    })();

    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle initial user gesture to enable fullscreen
  const handlePointerDown = async () => {
    if (!hasUserGesture) {
      setHasUserGesture(true);
      try {
        await enterFullscreen();
      } catch {}
      setIsFullscreen(isDocFullscreen());
    }
  };

  useEffect(() => {
    // reset UI when letter changes
    setAnswerState("idle");
    setSelectedId(null);
    setIsPlaying(false);
  }, [currentLetter]);

  const playSound = async () => {
    // treat headphone click as a user gesture for fullscreen
    if (!hasUserGesture) {
      setHasUserGesture(true);
      try { await enterFullscreen(); } catch {}
      setIsFullscreen(isDocFullscreen());
    }
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

    setSelectedId(optionId);
    const correct = optionId === correctOption.id;
    setAnswerState(correct ? "correct" : "wrong");

    if (correct) {
      window.setTimeout(() => {
        // Move to next letter
        const nextLetterIndex = letterIndexWithinGroup + 1;
        
        if (nextLetterIndex < currentGroup.length) {
          // Next letter in same group
          setLetterIndexWithinGroup(nextLetterIndex);
        } else {
          // Move to next group
          const nextGroupIndex = levelGroupIndex + 1;
          
          if (nextGroupIndex < LETTER_GROUPS.length) {
            setLevelGroupIndex(nextGroupIndex);
            setLetterIndexWithinGroup(0);
          } else {
            // All levels complete
            setIsComplete(true);
          }
        }
      }, 900);
    } else {
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
  };

  // Positions tuned for your 2048x1152 background (percentage-based so it scales)
  const headphoneBtnStyle: React.CSSProperties = {
    left: "23%",
    top: "12%",
    width: "20%",
    height: "33%",
  };

  // Three card slots (left, middle, right)
  const cardSlots: React.CSSProperties[] = [
    { left: "14%", top: "57%", width: "22%", height: "32%" },
    { left: "39%", top: "57%", width: "22%", height: "32%" },
    { left: "64%", top: "57%", width: "22%", height: "32%" },
  ];

  return (
    <div className="w-full select-none" draggable={false}>
      <div className="mx-auto w-full max-w-[1200px] select-none">
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          className="relative w-full aspect-video overflow-hidden rounded-2xl shadow-lg select-none overscroll-contain"
          style={{ touchAction: 'none' }}
        >
          {/* Background */}
          <img
            src={`${BASE}/bg.png`}
            alt="Sound Detective Background"
            className="absolute inset-0 h-full w-full object-cover select-none"
            draggable={false}
          />

          {/* Progress indicator */}
          <div className="absolute top-3 left-3 rounded-full bg-black/40 px-3 py-1 text-xs text-white font-medium">
            Level {levelGroupIndex + 1}/5 • Letter {letterIndexWithinGroup + 1}/{currentGroup.length}
          </div>

          {/* Headphones glow + button */}
          <div
            aria-hidden
            style={{ ...headphoneBtnStyle, width: `calc(${headphoneBtnStyle.width} * 1.12)`, height: `calc(${headphoneBtnStyle.height} * 1.12)` }}
            className="absolute flex items-center justify-center"
          >
            {/* Invisible larger hotspot so kids can tap easily (delegates to playSound) */}
            <button
              type="button"
              onClick={playSound}
              aria-hidden
              className="absolute inset-0 z-0 bg-transparent"
            />

            {/* Visual container (keeps visible size slightly smaller than hotspot) */}
            <div className="relative z-10 flex items-center justify-center" style={{ width: '89.2857%', height: '89.2857%' }}>
              {/* Ring layer: centered using inset-0 + transform scale (no offsets) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className={[
                    'absolute inset-0 rounded-full pointer-events-none transition-all duration-700 ease-in-out',
                    !isPlaying ? 'hd-ring-idle' : 'hd-ring-playing',
                  ].join(' ')}
                  style={{
                    transform: 'scale(1.12)',
                    border: '2px solid rgba(255,255,255,0.12)',
                    background: 'radial-gradient(closest-side, rgba(59,130,246,0.14), rgba(59,130,246,0) 55%)',
                    filter: 'blur(12px)'
                  }}
                />
              </div>

              {/* subtle inner shadow ring */}
              <div
                className={[
                  'absolute rounded-full pointer-events-none transition-shadow duration-300',
                  isPlaying
                    ? 'shadow-[0_18px_48px_rgba(59,130,246,0.22)]'
                    : 'shadow-[0_8px_30px_rgba(59,130,246,0.06)]',
                ].join(' ')}
                style={{ width: '100%', height: '100%', borderRadius: 9999 }}
              />

              {/* Visible headphone image container: pop + glow animation */}
              <div className={['relative z-10 flex items-center justify-center', isPlaying ? 'hd-pop-playing' : 'hd-pop-idle'].join(' ')} style={{ width: '100%', height: '100%' }}>
                <div className="relative z-10 flex items-center justify-center w-full h-full">
                  <img src={`${BASE}/headphones.png`} alt="Headphones" className="max-h-[70%] max-w-[70%] object-contain select-none" draggable={false} />
                </div>
              </div>
            </div>
          </div>

          {/* Letter display (optional) */}
          <div
            className="absolute text-white font-extrabold tracking-wide drop-shadow-lg select-none uppercase"
            style={{
              left: "52%",
              top: "18%",
              fontSize: "clamp(72px, 9vw, 140px)",
            }}
          >
            {currentLetter}
          </div>

          {/* Choice cards */}
          {shuffledOptions.map((opt, i) => {
            const isSelected = selectedId === opt.id;

            const isCorrectPick =
              answerState === "correct" && opt.id === correctOption.id;
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
                {/* Image wrapper */}
                <div className="relative z-10 w-full h-full flex items-center justify-center p-3">
                  <img
                    src={opt.imgSrc}
                    alt=""
                    className="max-h-[72%] max-w-[72%] object-contain drop-shadow-md select-none"
                    draggable={false}
                  />
                </div>
              </button>
            );
          })}

          {/* Fullscreen start overlay (non-intrusive) */}
          {!isFullscreen && !hasUserGesture && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <button
                type="button"
                onClick={async () => { setHasUserGesture(true); await enterFullscreen(); setIsFullscreen(isDocFullscreen()); }}
                className="pointer-events-auto px-4 py-2 bg-black/60 text-white rounded-full backdrop-blur-sm text-sm font-semibold"
                aria-label="Start Full Screen"
              >
                Tap to Start (Full Screen)
              </button>
            </div>
          )}

          {/* Exit fullscreen button */}
          {isFullscreen && (
            <div className="absolute top-3 right-3">
              <button
                type="button"
                onClick={() => exitFullscreen()}
                className="px-3 py-1 bg-white/10 text-white text-xs rounded-full hover:bg-white/20"
                aria-label="Exit Full Screen"
              >
                Exit
              </button>
            </div>
          )}

          {/* Completion overlay */}
          {isComplete && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="bg-white rounded-2xl p-8 max-w-sm text-center shadow-2xl">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  All Done!
                </h2>
                <p className="text-gray-600 mb-6">
                  You completed all 5 levels!
                </p>
                <button
                  type="button"
                  onClick={handleRestart}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
                >
                  Play Again
                </button>
              </div>
            </div>
          )}

          {/* Simple keyframes for shake */}
          <style>
            {`
              @keyframes shake {
                0% { transform: translateX(0); }
                25% { transform: translateX(-6px); }
                50% { transform: translateX(6px); }
                75% { transform: translateX(-6px); }
                100% { transform: translateX(0); }
              }

              /* Pop + Glow keyframes */
              @keyframes sdPopGlowIdle {
                0% { transform: scale(1); box-shadow: 0 8px 30px rgba(59,130,246,0.06); }
                50% { transform: scale(1.03); box-shadow: 0 14px 40px rgba(59,130,246,0.10); }
                100% { transform: scale(1); box-shadow: 0 8px 30px rgba(59,130,246,0.06); }
              }

              @keyframes sdPopGlowPlay {
                0% { transform: scale(1); box-shadow: 0 12px 44px rgba(59,130,246,0.16); }
                50% { transform: scale(1.06); box-shadow: 0 20px 64px rgba(59,130,246,0.22); }
                100% { transform: scale(1); box-shadow: 0 12px 44px rgba(59,130,246,0.16); }
              }

              .sd-pop-idle { animation: sdPopGlowIdle 3300ms ease-in-out infinite; }
              .sd-pop-playing { animation: sdPopGlowPlay 1200ms ease-in-out infinite; }

              .sd-ring-idle { opacity: .75; transform-origin: center; }
              .sd-ring-playing { opacity: 1; transform-origin: center; animation: sdPopGlowPlay 1200ms ease-in-out infinite; }

              /* Respect reduced motion */
              @media (prefers-reduced-motion: reduce) {
                .sd-pop-idle, .sd-pop-playing, .sd-ring-playing { animation: none !important; }
              }

              /* Headphone pop glow (tsPopGlow) */
              @keyframes tsPopGlow {
                0% { transform: scale(1); filter: blur(10px); box-shadow: 0 8px 30px rgba(59,130,246,0.08); }
                50% { transform: scale(1.06); filter: blur(18px); box-shadow: 0 20px 60px rgba(59,130,246,0.20); }
                100% { transform: scale(1); filter: blur(10px); box-shadow: 0 8px 30px rgba(59,130,246,0.08); }
              }

              .hd-pop-idle { animation: tsPopGlow 1400ms ease-in-out infinite; transform-origin: center; }
              .hd-pop-playing { animation: tsPopGlow 850ms ease-in-out infinite; transform-origin: center; }

              .hd-ring-idle { opacity: .8; transform-origin: center; }
              .hd-ring-playing { opacity: 1; transform-origin: center; animation: tsPopGlow 850ms ease-in-out infinite; }

              @media (prefers-reduced-motion: reduce) {
                .hd-pop-idle, .hd-pop-playing, .hd-ring-playing { animation: none !important; }
              }
            `}
          </style>

          {/* Helper hint */}
          <div className="absolute bottom-3 left-4 rounded-full bg-black/35 px-3 py-1 text-xs text-white">
            Tap 🎧 then choose the picture
          </div>
        </div>
      </div>
    </div>
  );
}
