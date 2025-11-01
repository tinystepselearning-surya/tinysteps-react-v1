/**
 * Boss Level Mini-Rounds
 * FlashMCQ, EarTraining, SpeedMeaning, BalloonPopLite, DragDropLite, FixupLite
 */

import { useState, useEffect, useRef } from "react";
import type { WordEntry } from "./data";
import { generateMeaningDistractors, generateIPADistractors, speakText, shuffle } from "./utils";

// ==================== Types ====================

export interface RoundProps {
  word: WordEntry;
  allWords: WordEntry[];
  onComplete: (correct: boolean, timeSpent: number, hintsUsed: number) => void;
  adaptiveConfig: { timerDuration: number; distractorCount: number; balloonSpeed: number };
}

// ==================== FlashMCQ ====================

export function FlashMCQ({ word, allWords, onComplete, adaptiveConfig }: RoundProps) {
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<number>(-1);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const distractors = generateMeaningDistractors(word.meaning, allWords, adaptiveConfig.distractorCount);
    const opts = shuffle([word.meaning, ...distractors]);
    setOptions(opts);
    startTime.current = Date.now();
  }, [word, allWords, adaptiveConfig]);

  const handleSelect = (index: number) => {
    if (selected !== -1) return;
    setSelected(index);
    const correct = options[index] === word.meaning;
    setIsCorrect(correct);
    
    const timeSpent = (Date.now() - startTime.current) / 1000;
    setTimeout(() => onComplete(correct, timeSpent, 0), 1200);
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-slate-800 mb-2">{word.word}</h2>
        <p className="text-sm text-slate-500">Pick the right meaning</p>
      </div>
      
      <div className="grid gap-3 w-full max-w-md">
        {options.map((option, idx) => {
          const isSelected = selected === idx;
          const showCorrect = selected !== -1 && option === word.meaning;
          const showWrong = isSelected && !isCorrect;
          
          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={selected !== -1}
              className={`min-h-[64px] px-4 py-3 rounded-2xl text-left transition-all ${
                showCorrect
                  ? "bg-green-500 text-white animate-pulse"
                  : showWrong
                  ? "bg-red-500 text-white animate-shake"
                  : isSelected
                  ? "bg-blue-500 text-white"
                  : "bg-white hover:bg-blue-50 border-2 border-slate-200"
              }`}
              aria-label={`Option ${String.fromCharCode(65 + idx)}: ${option}`}
            >
              <span className="mr-2 font-bold">{String.fromCharCode(65 + idx)}.</span>
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ==================== EarTraining ====================

export function EarTraining({ word, allWords, onComplete, adaptiveConfig }: RoundProps) {
  const [hasPlayed, setHasPlayed] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<number>(-1);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const distractors = generateIPADistractors(word.ipa, allWords, adaptiveConfig.distractorCount);
    const opts = shuffle([word.ipa, ...distractors]);
    setOptions(opts);
    startTime.current = Date.now();
  }, [word, allWords, adaptiveConfig]);

  const handlePlay = () => {
    speakText(word.word);
    setHasPlayed(true);
  };

  const handleSelect = (index: number) => {
    if (selected !== -1 || !hasPlayed) return;
    setSelected(index);
    const correct = options[index] === word.ipa;
    setIsCorrect(correct);
    
    if (!correct && !showHint) {
      setShowHint(true);
      setHintsUsed(1);
      setTimeout(() => setSelected(-1), 1500);
    } else {
      const timeSpent = (Date.now() - startTime.current) / 1000;
      setTimeout(() => onComplete(correct, timeSpent, hintsUsed), 1200);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">👂 Listen & Pick</h2>
        <p className="text-sm text-slate-500">Tap Play, then choose the IPA</p>
      </div>
      
      <button
        onClick={handlePlay}
        className="min-h-[64px] px-8 py-4 bg-purple-500 hover:bg-purple-600 text-white rounded-full text-xl font-bold shadow-lg transition-transform hover:scale-105"
        aria-label="Play word sound"
      >
        🔊 Play Sound
      </button>

      {showHint && (
        <div className="text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
          💡 Listen again! The word is "{word.word}"
        </div>
      )}
      
      {hasPlayed && (
        <div className="grid gap-3 w-full max-w-md">
          {options.map((option, idx) => {
            const isSelected = selected === idx;
            const showCorrect = selected !== -1 && option === word.ipa;
            const showWrong = isSelected && !isCorrect;
            
            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={selected !== -1}
                className={`min-h-[64px] px-4 py-3 rounded-2xl text-center text-lg transition-all ${
                  showCorrect
                    ? "bg-green-500 text-white animate-pulse"
                    : showWrong
                    ? "bg-red-500 text-white animate-shake"
                    : "bg-white hover:bg-blue-50 border-2 border-slate-200"
                }`}
                aria-label={`IPA option: ${option}`}
              >
                {option}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==================== SpeedMeaning ====================

export function SpeedMeaning({ word, allWords, onComplete, adaptiveConfig }: RoundProps) {
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<number>(-1);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [timeLeft, setTimeLeft] = useState(adaptiveConfig.timerDuration);
  const startTime = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const distractors = generateMeaningDistractors(word.meaning, allWords, 3);
    const opts = shuffle([word.meaning, ...distractors]);
    setOptions(opts);
    startTime.current = Date.now();
    setTimeLeft(adaptiveConfig.timerDuration);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          if (timerRef.current) clearInterval(timerRef.current);
          onComplete(false, adaptiveConfig.timerDuration, 0);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [word, allWords, adaptiveConfig, onComplete]);

  const handleSelect = (index: number) => {
    if (selected !== -1) return;
    if (timerRef.current) clearInterval(timerRef.current);
    
    setSelected(index);
    const correct = options[index] === word.meaning;
    setIsCorrect(correct);
    
    const timeSpent = (Date.now() - startTime.current) / 1000;
    setTimeout(() => onComplete(correct, timeSpent, 0), 1200);
  };

  const progress = (timeLeft / adaptiveConfig.timerDuration) * 100;
  const barColor = progress > 50 ? "bg-green-500" : progress > 25 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="w-full max-w-md">
        <div className="h-3 bg-slate-200 rounded-full overflow-hidden mb-4">
          <div
            className={`h-full transition-all duration-100 ${barColor}`}
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={timeLeft}
            aria-valuemin={0}
            aria-valuemax={adaptiveConfig.timerDuration}
          />
        </div>
        <p className="text-center text-sm text-slate-600">⏱️ {timeLeft.toFixed(1)}s</p>
      </div>
      
      <div className="text-center">
        <h2 className="text-4xl font-bold text-slate-800 mb-2">{word.word}</h2>
        <p className="text-sm text-red-500 font-semibold">⚡ Speed Round!</p>
      </div>
      
      <div className="grid gap-3 w-full max-w-md">
        {options.map((option, idx) => {
          const isSelected = selected === idx;
          const showCorrect = selected !== -1 && option === word.meaning;
          const showWrong = isSelected && !isCorrect;
          
          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={selected !== -1}
              className={`min-h-[64px] px-4 py-3 rounded-2xl text-left transition-all ${
                showCorrect
                  ? "bg-green-500 text-white animate-pulse"
                  : showWrong
                  ? "bg-red-500 text-white animate-shake"
                  : "bg-white hover:bg-blue-50 border-2 border-slate-200"
              }`}
              aria-label={`Option ${String.fromCharCode(65 + idx)}: ${option}`}
            >
              <span className="mr-2 font-bold">{String.fromCharCode(65 + idx)}.</span>
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ==================== BalloonPopLite ====================

interface Balloon {
  id: number;
  ipa: string;
  x: number;
  y: number;
  isCorrect: boolean;
  popped: boolean;
}

export function BalloonPopLite({ word, allWords, onComplete, adaptiveConfig }: RoundProps) {
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [popped, setPopped] = useState(false);
  const startTime = useRef(Date.now());
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef(Date.now());

  useEffect(() => {
    const distractors = generateIPADistractors(word.ipa, allWords, 2);
    const ipas = shuffle([word.ipa, ...distractors]);
    
    const initialBalloons: Balloon[] = ipas.map((ipa, idx) => ({
      id: idx,
      ipa,
      x: 20 + idx * 30,
      y: 100,
      isCorrect: ipa === word.ipa,
      popped: false,
    }));
    
    setBalloons(initialBalloons);
    startTime.current = Date.now();
    lastTimeRef.current = Date.now();

    const animate = () => {
      const now = Date.now();
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      setBalloons((prev) =>
        prev.map((b) => {
          if (b.popped) return b;
          const newY = b.y - adaptiveConfig.balloonSpeed * 30 * dt;
          const sway = Math.sin(now / 500 + b.id) * 2;
          return { ...b, y: newY, x: b.x + sway * 0.1 };
        })
      );

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [word, allWords, adaptiveConfig]);

  const handlePop = (balloon: Balloon) => {
    if (popped || balloon.popped) return;
    
    setPopped(true);
    setBalloons((prev) => prev.map((b) => (b.id === balloon.id ? { ...b, popped: true } : b)));
    
    const timeSpent = (Date.now() - startTime.current) / 1000;
    setTimeout(() => onComplete(balloon.isCorrect, timeSpent, 0), 1000);
  };

  return (
    <div className="relative w-full h-[500px] bg-gradient-to-b from-sky-200 to-sky-50 rounded-3xl overflow-hidden">
      <div className="absolute top-4 left-0 right-0 text-center">
        <p className="text-lg font-bold text-slate-700">Pop the balloon: {word.ipa}</p>
        <p className="text-sm text-slate-500">Word: {word.word}</p>
      </div>
      
      {balloons.map((balloon) => (
        <button
          key={balloon.id}
          onClick={() => handlePop(balloon)}
          disabled={popped || balloon.popped}
          className={`absolute min-w-[80px] min-h-[80px] rounded-full text-white font-bold text-lg transition-all ${
            balloon.popped
              ? balloon.isCorrect
                ? "bg-green-500 scale-150 opacity-0"
                : "bg-red-500 scale-50 opacity-0"
              : "bg-gradient-to-br from-pink-400 to-purple-500 hover:scale-110 shadow-lg"
          }`}
          style={{
            left: `${balloon.x}%`,
            bottom: `${balloon.y}px`,
          }}
          aria-label={`Balloon with IPA ${balloon.ipa}`}
        >
          {balloon.ipa}
        </button>
      ))}
      
      {popped && balloons.find((b) => b.popped && b.isCorrect) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-6xl animate-bounce">🎉</div>
        </div>
      )}
    </div>
  );
}

// ==================== DragDropLite ====================

interface DragItem {
  id: string;
  word: string;
  ipa: string;
  meaning: string;
}

export function DragDropLite({ word, allWords, onComplete }: RoundProps) {
  const [items, setItems] = useState<DragItem[]>([]);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const secondWord = allWords.find((w) => w.id !== word.id) || word;
    setItems([
      { id: word.id, word: word.word, ipa: word.ipa, meaning: word.meaning },
      { id: secondWord.id, word: secondWord.word, ipa: secondWord.ipa, meaning: secondWord.meaning },
    ]);
    startTime.current = Date.now();
  }, [word, allWords]);

  const handleDragStart = (wordId: string) => {
    setDragging(wordId);
  };

  const handleDrop = (target: string, type: "meaning" | "ipa") => {
    if (!dragging) return;
    
    const item = items.find((i) => i.id === dragging);
    if (!item) return;
    
    const isCorrect =
      (type === "meaning" && item.meaning === target) ||
      (type === "ipa" && item.ipa === target);
    
    if (isCorrect) {
      setMatches((prev) => ({ ...prev, [dragging]: target }));
      setDragging(null);
      
      const newMatches = { ...matches, [dragging]: target };
      if (Object.keys(newMatches).length === items.length) {
        const timeSpent = (Date.now() - startTime.current) / 1000;
        const hintsUsed = showHint ? 1 : 0;
        setTimeout(() => onComplete(true, timeSpent, hintsUsed), 800);
      }
    } else {
      const newErrors = errors + 1;
      setErrors(newErrors);
      if (newErrors >= 2) setShowHint(true);
      setDragging(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">🎯 Match Words</h2>
        <p className="text-sm text-slate-500">Drag each word to its meaning & IPA</p>
      </div>
      
      {showHint && (
        <div className="text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg text-center">
          💡 Hint: Read carefully and try again!
        </div>
      )}
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-700">Words</h3>
          {items.map((item) =>
            matches[item.id] ? (
              <div
                key={item.id}
                className="min-h-[64px] px-4 py-3 rounded-xl bg-green-100 border-2 border-green-400 flex items-center justify-center font-bold text-green-700"
              >
                ✓ {item.word}
              </div>
            ) : (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(item.id)}
                className="min-h-[64px] px-4 py-3 rounded-xl bg-blue-500 text-white cursor-move flex items-center justify-center font-bold shadow-md hover:scale-105 transition-transform"
              >
                {item.word}
              </div>
            )
          )}
        </div>
        
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-700">Targets</h3>
          {items.flatMap((item) => [
            <div
              key={`${item.id}-meaning`}
              onDrop={() => handleDrop(item.meaning, "meaning")}
              onDragOver={handleDragOver}
              className={`min-h-[64px] px-4 py-3 rounded-xl border-2 border-dashed transition-all ${
                Object.values(matches).includes(item.meaning)
                  ? "bg-green-50 border-green-400"
                  : "bg-slate-50 border-slate-300 hover:border-blue-400"
              }`}
            >
              <p className="text-sm text-slate-600">{item.meaning}</p>
            </div>,
            <div
              key={`${item.id}-ipa`}
              onDrop={() => handleDrop(item.ipa, "ipa")}
              onDragOver={handleDragOver}
              className={`min-h-[64px] px-4 py-3 rounded-xl border-2 border-dashed transition-all flex items-center justify-center ${
                Object.values(matches).includes(item.ipa)
                  ? "bg-green-50 border-green-400"
                  : "bg-slate-50 border-slate-300 hover:border-blue-400"
              }`}
            >
              <p className="text-lg font-mono">{item.ipa}</p>
            </div>,
          ])}
        </div>
      </div>
    </div>
  );
}

// ==================== FixupLite ====================

export function FixupLite({ word, allWords, onComplete, adaptiveConfig }: RoundProps) {
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<number>(-1);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const distractors = generateMeaningDistractors(word.meaning, allWords, 2);
    const opts = shuffle([word.meaning, ...distractors]);
    setOptions(opts);
    startTime.current = Date.now();
  }, [word, allWords, adaptiveConfig]);

  const handleSelect = (index: number) => {
    if (selected !== -1) return;
    setSelected(index);
    const correct = options[index] === word.meaning;
    setIsCorrect(correct);
    
    const timeSpent = (Date.now() - startTime.current) / 1000;
    setTimeout(() => onComplete(correct, timeSpent, 0), 1200);
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="text-center">
        <div className="text-5xl mb-2">🔧</div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Fix-Up Round</h2>
        <p className="text-sm text-slate-500">Let's master this tricky word!</p>
      </div>
      
      <div className="text-center bg-amber-50 px-6 py-3 rounded-2xl">
        <h3 className="text-4xl font-bold text-slate-800">{word.word}</h3>
        <p className="text-sm text-slate-600 mt-1">{word.ipa}</p>
      </div>
      
      <div className="grid gap-3 w-full max-w-md">
        {options.map((option, idx) => {
          const isSelected = selected === idx;
          const showCorrect = selected !== -1 && option === word.meaning;
          const showWrong = isSelected && !isCorrect;
          
          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={selected !== -1}
              className={`min-h-[64px] px-4 py-3 rounded-2xl text-left transition-all ${
                showCorrect
                  ? "bg-green-500 text-white animate-pulse"
                  : showWrong
                  ? "bg-red-500 text-white animate-shake"
                  : "bg-white hover:bg-blue-50 border-2 border-slate-200"
              }`}
              aria-label={`Option ${String.fromCharCode(65 + idx)}: ${option}`}
            >
              <span className="mr-2 font-bold">{String.fromCharCode(65 + idx)}.</span>
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
