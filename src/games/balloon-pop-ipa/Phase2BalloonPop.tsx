/**
 * Phase 2-5: Phoneme → Grapheme Training
 * Supports single letters and digraphs with adaptive difficulty
 */

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { readProgress, writeProgress, readMeta, writeMeta } from '../../lib/psmProgress';
import {
  parsePhase2Config,
  GRAPHEME_SETS,
  speakPhoneme,
  speedToMs,
  starsFromErrors,
  CONFUSABLES,
} from './phase2Config';
import {
  createAdaptiveState,
  updateAdaptive,
  selectDistractors,
  selectWeightedPhoneme,
  type AdaptiveState,
} from './adaptive';
import { clampByPhaseAndPhoneme } from './constraints';
import { Balloon, BALLOON_COLORS } from './Balloon';
import { Confetti } from './Confetti';

const GOAL_CORRECT = 8;

interface BalloonState {
  id: string;
  grapheme: string;
  x: number;
  y: number;
  colorIndex: number;
  isPopped: boolean;
  shake: boolean;
}

export default function Phase2BalloonPop() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const config = parsePhase2Config(searchParams);
  const graphemeSet = GRAPHEME_SETS[config.set];

  const [adaptive, setAdaptive] = useState<AdaptiveState>(() =>
    createAdaptiveState(config.n, config.speed)
  );
  const [targetGrapheme, setTargetGrapheme] = useState('');
  const [balloons, setBalloons] = useState<BalloonState[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [errors, setErrors] = useState(0);
  const [message, setMessage] = useState('');
  const [confetti, setConfetti] = useState<{ id: number; x: number; y: number } | null>(null);
  const [wrongBalloonIds, setWrongBalloonIds] = useState<Set<string>>(new Set());
  const [glowCorrect, setGlowCorrect] = useState(false);

  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const wrongCountRef = useRef(0);

  useEffect(() => {
    startNewRound();
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  function startNewRound() {
    const target = config.adaptive
      ? selectWeightedPhoneme(graphemeSet.graphemes, adaptive.phonemeStats)
      : graphemeSet.graphemes[Math.floor(Math.random() * graphemeSet.graphemes.length)];

    setTargetGrapheme(target);
    wrongCountRef.current = 0;
    setWrongBalloonIds(new Set());
    setGlowCorrect(false);
    setMessage('');

    // Apply phase and phoneme constraints
    const targetStats = adaptive.phonemeStats[target];
    const streak = targetStats?.streak || 0;
    const sessionStreak = adaptive.sessionStreak;
    
    const { n } = clampByPhaseAndPhoneme({
      phase: config.phase,
      targetPhoneme: target,
      requestedN: config.adaptive ? adaptive.currentN : config.n,
      requestedSpeed: config.adaptive ? adaptive.currentSpeed : config.speed,
      streak: sessionStreak,
    });

    // Determine difficulty for distractor selection
    const difficulty = (streak >= 3 || sessionStreak >= 5) ? 'hard' : 'easy';
    
    const distractors = selectDistractors(target, graphemeSet.graphemes, n - 1, {
      difficulty,
      confusables: CONFUSABLES,
    });
    const all = [target, ...distractors].sort(() => Math.random() - 0.5);

    // Generate balloon positions with proper spacing (like original game)
    const minSpacing = 20; // Minimum horizontal spacing
    const usedXPositions: number[] = [];

    const newBalloons: BalloonState[] = all.map((g, i) => {
      // Generate X position with minimum spacing from other balloons
      let x: number;
      let attempts = 0;
      do {
        x = 20 + Math.random() * 60; // Range 20-80%
        attempts++;
      } while (
        attempts < 100 && 
        usedXPositions.some(usedX => Math.abs(usedX - x) < minSpacing)
      );
      usedXPositions.push(x);

      // Start balloons at bottom with random offset (staggered entry)
      const yOffset = Math.random() * 200 + 100; // 100-300px below viewport

      return {
        id: `${Date.now()}-${i}`,
        grapheme: g,
        x,
        y: 100 + yOffset, // Start at bottom (100% + offset)
        colorIndex: Math.floor(Math.random() * BALLOON_COLORS.length),
        isPopped: false,
        shake: false,
      };
    });

    setBalloons(newBalloons);
    speakPhoneme(target);

    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(animateBalloons);
  }

  function animateBalloons(time: number) {
    if (lastTimeRef.current === 0) {
      lastTimeRef.current = time;
    }

    const delta = Math.min((time - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = time;

    const speed = config.adaptive ? speedToMs(adaptive.currentSpeed) : speedToMs(config.speed);
    const pixelsPerSecond = (100 / speed) * 1000; // Move 100% of viewport in 'speed' ms
    const pixelsPerFrame = pixelsPerSecond * delta;

    setBalloons((prev) =>
      prev.map((b) => {
        if (b.isPopped) return b;
        
        // Move balloons upward (decrease y)
        const newY = b.y - pixelsPerFrame;
        
        // If balloon reaches top (-50%), recycle to bottom
        if (newY <= -50) {
          return {
            ...b,
            y: 100 + Math.random() * 200 + 100, // Reset to bottom
          };
        }
        
        return { ...b, y: newY };
      })
    );

    rafRef.current = requestAnimationFrame(animateBalloons);
  }

  function handleBalloonClick(balloon: BalloonState) {
    if (balloon.isPopped) return;

    if (balloon.grapheme === targetGrapheme) {
      handleCorrect(balloon);
    } else {
      handleWrong(balloon);
    }
  }

  // Handler compatible with Balloon component's onPop signature
  function handleBalloonPop(id: string, _grapheme: string) {
    const balloon = balloons.find((b) => b.id === id);
    if (balloon) {
      handleBalloonClick(balloon);
    }
  }

  function handleCorrect(balloon: BalloonState) {
    setBalloons((prev) =>
      prev.map((b) => (b.id === balloon.id ? { ...b, isPopped: true } : b))
    );

    setConfetti({ id: Date.now(), x: balloon.x, y: balloon.y });
    setMessage('Correct! 🎉');
    setCorrectCount((c) => c + 1);

    if (config.adaptive) {
      setAdaptive((prev) => updateAdaptive(prev, targetGrapheme, 'right'));
    }

    // Stop animation loop during transition
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    setTimeout(() => {
      const newCount = correctCount + 1;
      if (newCount >= GOAL_CORRECT) {
        completeLevel();
      } else {
        startNewRound();
      }
    }, 1500);
  }

  function handleWrong(balloon: BalloonState) {
    setBalloons((prev) =>
      prev.map((b) => (b.id === balloon.id ? { ...b, shake: true } : b))
    );

    setWrongBalloonIds((prev) => new Set(prev).add(balloon.id));
    setMessage('Try again');
    setErrors((e) => e + 1);
    wrongCountRef.current++;

    if (config.adaptive) {
      setAdaptive((prev) => updateAdaptive(prev, targetGrapheme, 'wrong'));
    }

    setTimeout(() => {
      setBalloons((prev) =>
        prev.map((b) => (b.id === balloon.id ? { ...b, shake: false } : b))
      );
    }, 600);

    if (wrongCountRef.current >= 3) {
      setGlowCorrect(true);
    }
  }

  function handleListen() {
    speakPhoneme(targetGrapheme);
  }

  function completeLevel() {
    const stars = starsFromErrors(errors);
    const progress = readProgress();
    progress[config.levelId] = { completed: true, stars };
    writeProgress(progress);

    const meta = readMeta();
    meta.lastPlayedLevel = config.levelId;
    writeMeta(meta);

    setTimeout(() => {
      navigate('/games/phonics-sounds-mastery');
    }, 2000);
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-sky-200 via-sky-100 to-sky-50 overflow-hidden">
      {confetti && <Confetti key={confetti.id} x={confetti.x} y={confetti.y} />}

      <div className="absolute inset-0">
        {balloons.map((balloon) => {
          const isWrong = wrongBalloonIds.has(balloon.id);
          const shouldGlow = glowCorrect && balloon.grapheme === targetGrapheme && !balloon.isPopped;

          return (
            <Balloon
              key={balloon.id}
              id={balloon.id}
              ipa={balloon.grapheme} // Display grapheme letter instead of IPA symbol
              x={balloon.x}
              y={balloon.y}
              color={String(balloon.colorIndex)}
              onPop={handleBalloonPop}
              isPopped={balloon.isPopped}
              shake={balloon.shake}
              isWrong={isWrong}
              shouldPulse={shouldGlow}
            />
          );
        })}
      </div>

      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <div className="rounded-full bg-white/90 px-4 py-2 shadow-lg backdrop-blur-sm">
          <div className="text-sm font-semibold text-slate-600">
            Progress: {correctCount}/{GOAL_CORRECT}
          </div>
        </div>

        <div className="rounded-full bg-white/90 px-4 py-2 shadow-lg backdrop-blur-sm">
          <div className="text-sm font-semibold text-slate-600">
            Errors: {errors} | Stars: {starsFromErrors(errors)}/3
          </div>
        </div>
      </div>

      {message && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform rounded-2xl bg-white/95 px-8 py-4 text-2xl font-bold text-slate-800 shadow-2xl">
          {message}
        </div>
      )}

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 transform gap-4">
        <button
          onClick={handleListen}
          className="rounded-full bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/30 transition hover:bg-purple-700"
          aria-label="Listen to sound"
        >
          🎧 Listen
        </button>

        {config.debug && (
          <div className="rounded-full bg-white/90 px-4 py-2 text-xs font-mono text-slate-600">
            Target: {targetGrapheme}
          </div>
        )}

        <button
          onClick={() => navigate('/games/phonics-sounds-mastery')}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
