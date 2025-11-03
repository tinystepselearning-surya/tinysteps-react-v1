import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { readProgress, writeProgress } from "../../lib/psmProgress";

const LEVEL_ID = "p1-el-01";
const ROUNDS_TARGET = 3;
const WORD_POOL = ["sat", "pin", "sit", "pat", "nap", "tan", "sap", "tip", "sip", "pan", "tin", "sin"];

export function splitPhonemesCVC(word: string): string[] {
  return word.split("");
}

export function starsFrom(errorCount: number): number {
  if (errorCount === 0) return 3;
  if (errorCount <= 2) return 2;
  return 1;
}

function speakPhonemesSequential(phonemes: string[]): void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    console.warn("Web Speech API not available");
    return;
  }

  window.speechSynthesis.cancel();

  phonemes.forEach((phoneme, index) => {
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(phoneme);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }, index * 600);
  });
}

function AnimatedBg() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setMousePos({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        });
      }
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener("mousemove", handleMouseMove);
      return () => canvas.removeEventListener("mousemove", handleMouseMove);
    }
  }, []);

  return (
    <div
      ref={canvasRef}
      className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"
      style={{
        background: `linear-gradient(135deg, 
          hsl(${200 + mousePos.x * 20}, 70%, 95%) 0%, 
          hsl(${270 + mousePos.y * 20}, 60%, 95%) 50%, 
          hsl(${330}, 70%, 95%) 100%)`
      }}
    >
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-40px) translateX(-5px); }
          75% { transform: translateY(-20px) translateX(-10px); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
      `}</style>
      
      <div
        className="absolute h-32 w-32 rounded-full bg-blue-200/30 blur-xl"
        style={{
          top: "20%",
          left: "15%",
          animation: "float 8s ease-in-out infinite, pulse-glow 4s ease-in-out infinite",
          transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)`,
        }}
      />
      <div
        className="absolute h-40 w-40 rounded-full bg-purple-200/30 blur-xl"
        style={{
          top: "60%",
          right: "20%",
          animation: "float 10s ease-in-out infinite 1s, pulse-glow 5s ease-in-out infinite 1s",
          transform: `translate(${-mousePos.x * 15}px, ${-mousePos.y * 15}px)`,
        }}
      />
      <div
        className="absolute h-36 w-36 rounded-full bg-pink-200/30 blur-xl"
        style={{
          bottom: "15%",
          left: "40%",
          animation: "float 12s ease-in-out infinite 2s, pulse-glow 6s ease-in-out infinite 2s",
          transform: `translate(${mousePos.x * 10}px, ${mousePos.y * 25}px)`,
        }}
      />
    </div>
  );
}

export default function ElkoninGame() {
  const navigate = useNavigate();
  const [currentRound, setCurrentRound] = useState(0);
  const [currentWord, setCurrentWord] = useState("");
  const [phonemes, setPhonemes] = useState<string[]>([]);
  const [tappedIndex, setTappedIndex] = useState<number>(-1);
  const [totalErrors, setTotalErrors] = useState(0);
  const [hintBox, setHintBox] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    startNewRound();
  }, []);

  function startNewRound() {
    const word = WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)];
    const splits = splitPhonemesCVC(word);
    setCurrentWord(word);
    setPhonemes(splits);
    setTappedIndex(-1);
    setHintBox(null);
    setIsListening(true);
    speakPhonemesSequential(splits);
    setTimeout(() => setIsListening(false), splits.length * 600 + 300);
  }

  function handleListen() {
    setIsListening(true);
    speakPhonemesSequential(phonemes);
    setTimeout(() => setIsListening(false), phonemes.length * 600 + 300);
  }

  function handleBoxTap(index: number) {
    const expectedIndex = tappedIndex + 1;

    if (index !== expectedIndex) {
      setTotalErrors((e) => e + 1);
      setHintBox(expectedIndex);
      setTimeout(() => setHintBox(null), 800);
      return;
    }

    setTappedIndex(index);
    setHintBox(null);

    if (index === phonemes.length - 1) {
      const nextRound = currentRound + 1;
      if (nextRound >= ROUNDS_TARGET) {
        completeLevel();
      } else {
        setTimeout(() => {
          setCurrentRound(nextRound);
          startNewRound();
        }, 800);
      }
    }
  }

  function completeLevel() {
    const progress = readProgress();
    progress[LEVEL_ID] = {
      completed: true,
      stars: starsFrom(totalErrors),
    };
    writeProgress(progress);

    setTimeout(() => {
      navigate("/games/phonics-sounds-mastery");
    }, 1500);
  }

  const progressPercent = Math.round((currentRound / ROUNDS_TARGET) * 100);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBg />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl rounded-3xl border border-white/60 bg-white/90 p-8 shadow-2xl backdrop-blur-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-slate-900">
              Foundations — Listen &amp; Tap (3 sounds)
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Listen carefully and tap each box in order as you hear the sounds.
            </p>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Round Progress</span>
              <span className="font-semibold text-blue-600">
                {currentRound}/{ROUNDS_TARGET}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="mb-8 flex justify-center">
            <button
              onClick={handleListen}
              disabled={isListening}
              className="rounded-full bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/30 transition hover:bg-purple-700 disabled:opacity-50"
              aria-label="Listen to sounds"
            >
              {isListening ? "🔊 Listening..." : "🎧 Listen"}
            </button>
          </div>

          <div className="mb-6 flex items-center justify-center gap-4">
            {phonemes.map((_phoneme, index) => {
              const isTapped = index <= tappedIndex;
              const isNext = index === tappedIndex + 1;
              const showHint = hintBox === index;

              return (
                <button
                  key={index}
                  onClick={() => handleBoxTap(index)}
                  disabled={isTapped}
                  className={`relative flex h-24 w-24 items-center justify-center rounded-2xl border-4 text-3xl font-bold transition-all ${
                    isTapped
                      ? "border-green-500 bg-green-100 text-green-700"
                      : isNext
                      ? "border-blue-500 bg-blue-50 text-blue-700 shadow-lg shadow-blue-500/30"
                      : "border-slate-300 bg-white text-slate-400"
                  } ${showHint ? "animate-pulse border-yellow-500 shadow-lg shadow-yellow-500/50" : ""}`}
                  aria-label={`Sound box ${index + 1}`}
                  style={{
                    animation: showHint ? "pulse 0.8s ease-in-out" : undefined,
                  }}
                >
                  {isTapped ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-10 w-10 text-green-600"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  ) : (
                    <span className="text-2xl">{index + 1}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex items-center justify-between text-xs text-slate-500">
            <button
              onClick={() => navigate("/games/phonics-sounds-mastery")}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-slate-700 transition hover:bg-slate-50"
            >
              ← Back to Hub
            </button>
            <div className="text-center">
              <div className="font-semibold text-slate-700">Errors: {totalErrors}</div>
              <div className="text-slate-500">
                Stars: {starsFrom(totalErrors)} / 3
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-slate-400">
          {currentWord && (
            <div>
              Current word:{" "}
              <span className="font-mono font-semibold text-slate-600">{currentWord}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
