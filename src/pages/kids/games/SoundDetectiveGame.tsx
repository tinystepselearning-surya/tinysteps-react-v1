import React, { useEffect, useMemo, useRef, useState } from "react";

const BASE = "/games/phonics/sound-detective";

// Catalog of all available assets (a-z)
const CATALOG = [
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

type Option = { id: string; imgSrc: string; label?: string };
type Level = {
  id: string;
  letter: string;
  audioSrc?: string; // optional mp3
  tts: string; // TTS fallback text
  options: Option[];
  correctOptionId: string;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Generate levels from catalog with deterministic decoys
function buildLevels(): Level[] {
  return CATALOG.map((item, idx) => {
    // Pick 2 decoys: previous 2 items in circular fashion
    const decoy1Idx = (idx - 1 + CATALOG.length) % CATALOG.length;
    const decoy2Idx = (idx - 2 + CATALOG.length) % CATALOG.length;
    const decoy1 = CATALOG[decoy1Idx];
    const decoy2 = CATALOG[decoy2Idx];

    return {
      id: `${item.letter}-1`,
      letter: item.letter,
      audioSrc: `${BASE}/audio/${item.letter}.mp3`,
      tts: item.letter, // Simple TTS: just say the letter name
      options: [
        { id: item.id, imgSrc: item.img },
        { id: decoy1.id, imgSrc: decoy1.img },
        { id: decoy2.id, imgSrc: decoy2.img },
      ],
      correctOptionId: item.id,
    };
  });
}

const LEVELS: Level[] = buildLevels();

type AnswerState = "idle" | "correct" | "wrong";

export default function SoundDetectiveGame() {
  const [levelIndex, setLevelIndex] = useState(0);
  const level = LEVELS[levelIndex];

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Shuffle options per level (stable until level changes)
  const shuffledOptions = useMemo(() => shuffle(level.options), [level.id]);

  useEffect(() => {
    // Preload audio if available (optional)
    if (level.audioSrc) {
      audioRef.current = new Audio(level.audioSrc);
      audioRef.current.preload = "auto";
    }
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [level.audioSrc]);

  useEffect(() => {
    // reset UI when level changes
    setAnswerState("idle");
    setSelectedId(null);
    setIsPlaying(false);
  }, [level.id]);

  const playSound = async () => {
    setIsPlaying(true);

    // Try mp3 first if available
    if (audioRef.current && level.audioSrc) {
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
        const utterance = new SpeechSynthesisUtterance(level.tts);
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
    const correct = optionId === level.correctOptionId;
    setAnswerState(correct ? "correct" : "wrong");

    // Optional: auto move to next after correct
    if (correct) {
      window.setTimeout(() => {
        const next = levelIndex + 1;
        if (next < LEVELS.length) setLevelIndex(next);
        else {
          // end of game
          setLevelIndex(0);
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
            className="absolute text-white/95 font-extrabold drop-shadow-md select-none"
            style={{
              left: "52%",
              top: "18%",
              fontSize: "clamp(44px, 6vw, 96px)",
            }}
          >
            {level.letter}
          </div>

          {/* Choice cards */}
          {cardSlots.map((slot, i) => {
            const opt = shuffledOptions[i];
            const isSelected = selectedId === opt.id;

            const isCorrectPick =
              answerState === "correct" && opt.id === level.correctOptionId;
            const isWrongPick = answerState === "wrong" && isSelected;

            return (
              <button
                key={opt.id}
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
                style={slot}
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
