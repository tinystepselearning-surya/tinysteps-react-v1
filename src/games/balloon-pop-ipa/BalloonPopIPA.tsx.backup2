/**
 * Balloon Pop IPA - Main Game Component
 * 
 * Interactive phoneme learning with physics-based balloon animations.
 * Features: Framer Motion balloons, centered confetti, accessibility, persistence.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import type { PhonemeCategory } from './phoneme-data';
import { getPhonemesByCategory } from './phoneme-data';
import { useSession } from './useSession';
import { generateQuestion, recordResult, nextLevelConfig, type SimpleQuestion } from './engine';
import { playSound, initSounds } from './sfx';

// ========== GAME META ==========

export const gameMeta = {
  slug: 'balloon-pop-ipa',
  title: 'Balloon Pop – Phonetic Sounds',
  description: 'Pop balloons with IPA symbols! Learn phonetic sounds through fun, adaptive gameplay.',
};

// ========== TYPES ==========

type BalloonData = {
  id: string;
  symbol: string;
  phonemeId: string;
  isCorrect: boolean;
  lane: number;
  delay: number;
};

// ========== CONSTANTS ==========

const BALLOON_COLORS = [
  'bg-red-400',
  'bg-blue-400',
  'bg-green-400',
  'bg-yellow-400',
  'bg-purple-400',
  'bg-pink-400',
  'bg-orange-400',
  'bg-teal-400'
];

const LANE_WIDTH = 80; // px min spacing
const RISE_DURATION = 8; // seconds base

// ========== MAIN COMPONENT ==========

export default function BalloonPopIPA() {
  const navigate = useNavigate();
  const {
    state: session,
    accuracy,
    mastered,
    needsPractice,
    dispatchCorrect,
    dispatchWrong,
    levelUp,
    levelDown
  } = useSession();

  const [category, setCategory] = useState<PhonemeCategory | 'mixed'>('mixed');
  const [question, setQuestion] = useState<SimpleQuestion | null>(null);
  const [balloons, setBalloons] = useState<BalloonData[]>([]);
  const [poppedIds, setPoppedIds] = useState<Set<string>>(new Set());
  const [showCongrats, setShowCongrats] = useState(false);
  const [shake, setShake] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const ariaLiveRef = useRef<HTMLDivElement>(null);
  const congratsTimerRef = useRef<number | null>(null);

  // ========== INIT ==========

  useEffect(() => {
    initSounds();
  }, []);

  // Page Visibility: pause when tab hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPaused(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // ========== QUESTION GENERATION ==========

  const generateNewQuestion = useCallback(() => {
    const pool = getPhonemesByCategory(category);
    const q = generateQuestion(pool);
    setQuestion(q);
    setPoppedIds(new Set());

    // Create balloon data with lanes
    const cfg = nextLevelConfig(session.level);
    const balloonData: BalloonData[] = q.choices.map((sym, idx) => {
      const stripped = sym.replace(/\//g, '');
      const phoneme = pool.find(p => p.symbol === stripped);
      return {
        id: `balloon-${idx}-${Date.now()}`,
        symbol: sym,
        phonemeId: phoneme?.id || stripped,
        isCorrect: sym === q.prompt.targetIPA,
        lane: idx,
        delay: idx * (cfg.spawnIntervalMs / 1000)
      };
    });

    setBalloons(balloonData);
  }, [category, session.level]);

  useEffect(() => {
    generateNewQuestion();
  }, [generateNewQuestion]);

  // Check adaptivity
  useEffect(() => {
    if (session.recent.length >= 10) {
      const last10 = session.recent.slice(0, 10);
      const acc = last10.filter(Boolean).length / 10;
      if (acc >= 0.8 && session.level < 5) levelUp();
      else if (acc < 0.6 && session.level > 1) levelDown();
    }
  }, [session.recent, session.level, levelUp, levelDown]);

  // ========== BALLOON CLICK ==========

  const handleBalloonClick = useCallback((balloon: BalloonData) => {
    if (poppedIds.has(balloon.id) || !question) return;

    setPoppedIds(prev => new Set(prev).add(balloon.id));
    playSound('pop');

    if (balloon.isCorrect) {
      // CORRECT
      dispatchCorrect(balloon.phonemeId);
      recordResult(true);
      playSound('correct');

      // Centered confetti
      fireConfetti();

      // Show congratulations banner
      setShowCongrats(true);
      if (ariaLiveRef.current) {
        ariaLiveRef.current.textContent = `Correct! You found ${balloon.symbol}`;
      }

      // Auto-hide after 2.5s, then next question
      if (congratsTimerRef.current) clearTimeout(congratsTimerRef.current);
      congratsTimerRef.current = window.setTimeout(() => {
        setShowCongrats(false);
        generateNewQuestion();
      }, 2500);
    } else {
      // WRONG
      dispatchWrong(balloon.phonemeId);
      recordResult(false);
      playSound('wrong');

      setShake(true);
      setTimeout(() => setShake(false), 500);

      if (ariaLiveRef.current) {
        ariaLiveRef.current.textContent = 'Try again!';
      }
    }
  }, [poppedIds, question, dispatchCorrect, dispatchWrong, generateNewQuestion]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (congratsTimerRef.current) clearTimeout(congratsTimerRef.current);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused) return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= balloons.length) {
        const balloon = balloons[num - 1];
        if (balloon && !poppedIds.has(balloon.id)) {
          handleBalloonClick(balloon);
        }
      }
      if (e.key === 'Enter') {
        // Reserved: replay prompt audio
        console.log('Replay prompt audio');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [balloons, poppedIds, handleBalloonClick, isPaused]);

  // ========== CONFETTI ==========

  const fireConfetti = () => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const duration = 2500;
    const end = Date.now() + duration;

    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f7dc6f', '#bb8fce'];

    const frame = () => {
      confetti({
        particleCount: 5,
        startVelocity: 25,
        spread: 70,
        origin: { x: cx / window.innerWidth, y: cy / window.innerHeight },
        gravity: 0.6,
        ticks: 250,
        scalar: 0.9,
        colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  };

  // ========== RENDER ==========

  const cfg = nextLevelConfig(session.level);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-300 via-sky-200 to-blue-100 relative overflow-hidden">
      {/* ARIA live region */}
      <div
        ref={ariaLiveRef}
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />

      {/* Header */}
      <header className="bg-white/90 backdrop-blur shadow-md p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <button
            onClick={() => navigate('/games')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500"
            aria-label="Back to games"
          >
            <span className="text-xl">←</span>
            <span className="font-semibold">Back</span>
          </button>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="text-center min-w-[80px]">
              <div className="text-xs text-gray-600">Score</div>
              <div className="text-xl font-bold text-blue-600">{session.score}</div>
            </div>

            <div className="text-center min-w-[80px]">
              <div className="text-xs text-gray-600">Streak</div>
              <div className="text-xl font-bold text-orange-500">
                {session.streak > 0 && '🔥'} {session.streak}
              </div>
            </div>

            <div className="px-4 py-2 bg-purple-100 rounded-lg">
              <div className="text-sm font-semibold text-purple-700">Level {session.level}</div>
            </div>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as PhonemeCategory | 'mixed')}
              className="px-3 py-2 bg-white border-2 border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500"
              aria-label="Select phoneme category"
            >
              <option value="mixed">Mixed</option>
              <option value="monophthongs">Monophthongs</option>
              <option value="diphthongs">Diphthongs</option>
              <option value="consonants">Consonants</option>
            </select>
          </div>
        </div>
      </header>

      {/* Prompt Card */}
      {question && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto mt-6 bg-white rounded-2xl shadow-xl p-6"
        >
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-2">Find the sound in:</div>
            <div className="text-5xl font-bold text-gray-800 mb-3">{question.prompt.letter}</div>
            <div className="text-lg text-purple-600 mb-2">
              Target: <span className="text-3xl font-bold">{question.prompt.targetIPA}</span>
            </div>
            {question.prompt.image && (
              <img src={question.prompt.image} alt={question.prompt.letter} className="mx-auto w-32 h-32 object-contain mt-4" />
            )}
          </div>
        </motion.div>
      )}

      {/* Playfield */}
      <div
        className={`relative min-h-[70vh] mt-8 overflow-hidden ${shake ? 'animate-shake' : ''}`}
        style={{ maxHeight: '75vh' }}
      >
        {balloons.map((balloon, idx) => (
          <Balloon
            key={balloon.id}
            balloon={balloon}
            index={idx}
            isPopped={poppedIds.has(balloon.id)}
            onClick={() => handleBalloonClick(balloon)}
            config={cfg}
            isPaused={isPaused}
          />
        ))}
      </div>

      {/* Summary Chips */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur py-3 px-4 border-t border-gray-200">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Accuracy:</span>
            <span className="font-bold text-blue-600">{accuracy.toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Mastered:</span>
            <span className="font-bold text-green-600">{mastered.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Needs Practice:</span>
            <span className="font-bold text-orange-600">{needsPractice.length}</span>
          </div>
          <div className="text-gray-500 text-xs hidden md:block">
            💡 Use keyboard 1-{balloons.length} for faster play!
          </div>
        </div>
      </div>

      {/* Congratulations Banner */}
      <AnimatePresence>
        {showCongrats && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
          >
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-12 py-6 rounded-2xl shadow-2xl text-center">
              <h2 className="text-4xl font-bold mb-2">🎉 Congratulations! 🎉</h2>
              <p className="text-xl">Great job!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pause Overlay */}
      {isPaused && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-40">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Paused</h3>
            <p className="text-gray-600">Switch back to the tab to continue</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== BALLOON COMPONENT ==========

function Balloon({
  balloon,
  index,
  isPopped,
  onClick,
  config,
  isPaused
}: {
  balloon: BalloonData;
  index: number;
  isPopped: boolean;
  onClick: () => void;
  config: ReturnType<typeof nextLevelConfig>;
  isPaused: boolean;
}) {
  const laneX = 5 + (index * LANE_WIDTH / 6); // percentage

  const sizePx = config.sizePx;
  const duration = RISE_DURATION / config.speed;

  return (
    <AnimatePresence>
      {!isPopped && (
        <motion.button
          initial={{ y: '100vh', opacity: 0, x: `${laneX}%` }}
          animate={{
            y: '-15vh',
            opacity: 1,
            x: [`${laneX}%`, `${laneX + 2}%`, `${laneX - 2}%`, `${laneX}%`]
          }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{
            y: { duration, ease: 'linear', delay: balloon.delay },
            opacity: { duration: 0.3, delay: balloon.delay },
            x: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
          }}
          onClick={onClick}
          className={`absolute ${BALLOON_COLORS[index % BALLOON_COLORS.length]} rounded-full shadow-lg hover:scale-110 transition-transform focus:outline-none focus:ring-4 focus:ring-yellow-400 flex items-center justify-center text-white font-bold border-4 border-white/30`}
          style={{
            width: sizePx,
            height: sizePx + 10,
            fontSize: Math.max(16, sizePx / 4),
            minWidth: 64,
            minHeight: 64
          }}
          aria-label={`Balloon ${index + 1}: ${balloon.symbol} sound, press to pop`}
          disabled={isPaused}
        >
          <span className="drop-shadow-md">{balloon.symbol}</span>
          {/* Balloon string */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-0.5 bg-gray-400"
            style={{ top: '100%', height: sizePx / 2 }}
          />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
