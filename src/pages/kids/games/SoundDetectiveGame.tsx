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

  useEffect(() => {
    // reset UI when letter changes
    setAnswerState("idle");
    setSelectedId(null);
    setIsPlaying(false);
  }, [currentLetter]);

  const playSound = async () => {
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
    <div className="w-full">
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="relative w-full aspect-video overflow-hidden rounded-2xl shadow-lg">
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

          {/* Headphones button (invisible clickable area) */}
          <button
            type="button"
            onClick={playSound}
            className={[
              "absolute rounded-full",
              "focus:outline-none focus:ring-4 focus:ring-white/40",
              isPlaying ? "animate-pulse" : "",
            ].join(" ")}
            style={headphoneBtnStyle}
            aria-label="Play sound"
          />

          {/* Letter display (optional) */}
          <div
            className="absolute text-white/95 font-extrabold drop-shadow-md select-none uppercase"
            style={{
              left: "52%",
              top: "18%",
              fontSize: "clamp(44px, 6vw, 96px)",
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
                  isCorrectPick ? "ring-8 ring-green-400/80" : "",
                  isWrongPick ? "animate-[shake_0.25s_ease-in-out_0s_2]" : "",
                ].join(" ")}
                style={cardSlots[i]}
                aria-label="Pick answer"
              >
                {/* Image inside the frame area */}
                <img
                  src={opt.imgSrc}
                  alt=""
                  className="h-full w-full object-contain p-[10%] select-none"
                  draggable={false}
                />
              </button>
            );
          })}

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
