/**
 * Balloon Pop IPA - Main Game Component
 * 
 * Interactive phoneme learning with phase-based progression.
 * Features: 6 phases, multi-select, special rounds, rhyme cards, celebration.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import type { PhonemeCategory } from './phoneme-data';
import { useSession } from './useSession';
import { selectRound, resetQuestionCounter } from './engine';
import type { Phase, LearnerState, RoundSpec } from './types';
import { initSounds } from './sfx';
import { PromptDisplay, PhaseTabs } from './ui';
import { sfx, initAudioContext } from './audio';

// ========== GAME META ==========

export const gameMeta = {
  slug: 'balloon-pop-ipa',
  title: 'Balloon Pop – Phonetic Sounds',
  description: 'Pop balloons with IPA symbols! Learn phonetic sounds through fun, adaptive gameplay.',
};

// ========== TYPES ==========

type UIState = {
  showCongrats: boolean;
  celebrating: boolean;
  showRhymeCard: boolean;
  rhymeCardData: { word: string; anchors: string[] } | null;
  feedback: string;
};

// ========== CONSTANTS ==========

const CELEBRATION_DURATION = 2500; // ms

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
  } = useSession();

  // Game state
  const [phase, setPhase] = useState<Phase>(1);
  const [category, setCategory] = useState<PhonemeCategory | 'mixed'>('mixed');
  const [round, setRound] = useState<RoundSpec | null>(null);
  
  // UI state
  const [ui, setUI] = useState<UIState>({
    showCongrats: false,
    celebrating: false,
    showRhymeCard: false,
    rhymeCardData: null,
    feedback: '',
  });

  const ariaLiveRef = useRef<HTMLDivElement>(null);
  const congratsTimerRef = useRef<number | null>(null);

  // Calculate unlocked phases based on mastery
  const unlockedPhase = Math.min(6, Math.floor(mastered.length / 5) + 1) as Phase;

  // ========== INIT ==========

  useEffect(() => {
    initSounds();
    initAudioContext();
    resetQuestionCounter();
  }, []);

  // ========== ROUND GENERATION ==========

  const startNewRound = useCallback(() => {
    // Build learner state from session
    const learnerState: LearnerState = {
      phase,
      level: session.level,
      mastery: {}, // TODO: Convert session.mastery to Record<string, number>
      confusionMatrix: {},
      avgResponseMs: 1500,
      recent: [],
    };

    // Use category as string for selectRound
    const categoryKey = category === 'mixed' ? 'mixed' : 
                        category === 'monophthongs' ? 'mono' :
                        category === 'diphthongs' ? 'diph' : 'cons';

    const newRound = selectRound(phase, learnerState, categoryKey);
    setRound(newRound);
    
    // Clear any previous feedback
    setUI(prev => ({
      ...prev,
      showCongrats: false,
      celebrating: false,
      showRhymeCard: false,
      feedback: '',
    }));
  }, [phase, category, session.level]);

  useEffect(() => {
    startNewRound();
  }, [startNewRound]);

  // ========== ANSWER HANDLING ==========

  const handleAnswer = useCallback((selectedIds: string[], elapsedMs: number) => {
    if (!round) return;

    // Check if all correct and only correct
    const correctSet = new Set(round.correctIds);
    const selectedSet = new Set(selectedIds);
    
    const isCorrect =
      correctSet.size === selectedSet.size &&
      Array.from(correctSet).every((id: string) => selectedSet.has(id));

    if (isCorrect) {
      // CORRECT
      dispatchCorrect(round.prompt.targetId);
      
      // Staggered SFX: pop then correct
      sfx.pop();
      setTimeout(() => sfx.correct(), 150);

      // Fire centered confetti
      fireConfetti();

      // Show congratulations
      setUI(prev => ({ ...prev, showCongrats: true, celebrating: true, feedback: 'Correct!' }));
      
      if (ariaLiveRef.current) {
        ariaLiveRef.current.textContent = 'Correct! Well done!';
      }

      // Check for bonus (minimal pairs under 2s)
      const isBonusRound = round.promptType === 'minimalPair';
      const gotBonus = isBonusRound && elapsedMs < 2000;
      
      if (gotBonus) {
        console.log('Bonus streak earned! +2');
        // TODO: Dispatch bonus streak logic
      }

      // Auto-hide and next round
      if (congratsTimerRef.current) clearTimeout(congratsTimerRef.current);
      congratsTimerRef.current = window.setTimeout(() => {
        setUI(prev => ({ ...prev, showCongrats: false, celebrating: false }));
        startNewRound();
      }, CELEBRATION_DURATION);

    } else {
      // WRONG
      dispatchWrong(round.prompt.targetId);
      sfx.wrong();

      setUI(prev => ({ ...prev, feedback: 'Try again!' }));
      
      if (ariaLiveRef.current) {
        ariaLiveRef.current.textContent = 'Not quite, try again!';
      }

      // Clear feedback after 1.5s
      setTimeout(() => {
        setUI(prev => ({ ...prev, feedback: '' }));
      }, 1500);
    }
  }, [round, dispatchCorrect, dispatchWrong, startNewRound]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (congratsTimerRef.current) clearTimeout(congratsTimerRef.current);
    };
  }, []);

  // ========== CONFETTI ==========

  const fireConfetti = () => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const duration = CELEBRATION_DURATION;
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

  // Determine if multi-select mode
  const isMultiSelect = round?.promptType === 'ipaToGrapheme' || round?.promptType === 'trickyRhyme';

  // ========== RENDER ==========

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

      {/* Phase Tabs */}
      <div className="max-w-4xl mx-auto mt-6 px-4">
        <PhaseTabs
          current={phase}
          unlocked={unlockedPhase}
          onChange={setPhase}
        />
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto mt-8 px-4">
        {round && (
          <PromptDisplay
            round={round}
            onAnswer={handleAnswer}
            multiSelect={isMultiSelect}
          />
        )}
      </div>

      {/* Summary Footer */}
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
        </div>
      </div>

      {/* Congratulations Banner */}
      <AnimatePresence>
        {ui.showCongrats && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
          >
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-12 py-6 rounded-2xl shadow-2xl text-center">
              <h2 className="text-4xl font-bold mb-2">🎉 Congratulations! 🎉</h2>
              <p className="text-xl">{ui.feedback}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rhyme Card */}
      <AnimatePresence>
        {ui.showRhymeCard && ui.rhymeCardData && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md">
              <h3 className="text-2xl font-bold text-green-600 mb-4 text-center">
                Words that rhyme with "{ui.rhymeCardData.word}"
              </h3>
              <div className="flex flex-wrap gap-3 justify-center">
                {ui.rhymeCardData.anchors.map((anchor) => (
                  <span
                    key={anchor}
                    className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-semibold text-lg"
                  >
                    {anchor}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Message */}
      {ui.feedback && !ui.showCongrats && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-red-500 text-white px-8 py-4 rounded-lg shadow-lg text-xl font-bold">
            {ui.feedback}
          </div>
        </motion.div>
      )}
    </div>
  );
}
