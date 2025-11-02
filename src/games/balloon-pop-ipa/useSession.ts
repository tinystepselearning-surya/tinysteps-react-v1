/**
 * Balloon Pop IPA - Session State Management
 * 
 * useReducer-based state with persistence, mastery tracking, and summary derivations.
 * Persists to localStorage debounced every 5th action.
 */

import { useReducer, useEffect, useRef } from 'react';

// ========== TYPES ==========

export type SessionState = {
  level: number;
  score: number;
  streak: number;
  bestStreak: number;
  recent: boolean[]; // Last 20 results
  mastery: Record<string, number>; // phonemeId -> 0..1
  actionCount: number; // For debounced save
};

type SessionAction =
  | { type: 'CORRECT'; phonemeId: string }
  | { type: 'WRONG'; phonemeId: string }
  | { type: 'RESET' }
  | { type: 'LEVEL_UP' }
  | { type: 'LEVEL_DOWN' }
  | { type: 'LOAD'; state: SessionState };

// ========== CONSTANTS ==========

const STORAGE_KEY = 'ts.balloonPopIPA.v1';
const MAX_RECENT = 20;
const SAVE_EVERY_N = 5;
const MASTERY_ALPHA = 0.2; // EWMA smoothing

const INITIAL_STATE: SessionState = {
  level: 1,
  score: 0,
  streak: 0,
  bestStreak: 0,
  recent: [],
  mastery: {},
  actionCount: 0
};

// ========== PERSISTENCE ==========

function loadState(): SessionState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...INITIAL_STATE };
    const parsed = JSON.parse(stored);
    return { ...INITIAL_STATE, ...parsed, actionCount: 0 };
  } catch (err) {
    console.warn('Failed to load session:', err);
    return { ...INITIAL_STATE };
  }
}

function saveState(state: SessionState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to save session:', err);
  }
}

// ========== REDUCER ==========

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'CORRECT': {
      const newStreak = state.streak + 1;
      const streakBonus = Math.min(newStreak * 10, 500);
      const newScore = state.score + 100 + streakBonus;
      const newRecent = [true, ...state.recent].slice(0, MAX_RECENT);
      
      // Update mastery with EWMA
      const prev = state.mastery[action.phonemeId] ?? 0.5;
      const updated = prev * (1 - MASTERY_ALPHA) + 1 * MASTERY_ALPHA;
      const newMastery = { ...state.mastery, [action.phonemeId]: updated };

      return {
        ...state,
        score: newScore,
        streak: newStreak,
        bestStreak: Math.max(newStreak, state.bestStreak),
        recent: newRecent,
        mastery: newMastery,
        actionCount: state.actionCount + 1
      };
    }

    case 'WRONG': {
      const newRecent = [false, ...state.recent].slice(0, MAX_RECENT);
      
      // Update mastery
      const prev = state.mastery[action.phonemeId] ?? 0.5;
      const updated = prev * (1 - MASTERY_ALPHA) + 0 * MASTERY_ALPHA;
      const newMastery = { ...state.mastery, [action.phonemeId]: updated };

      return {
        ...state,
        streak: 0,
        recent: newRecent,
        mastery: newMastery,
        actionCount: state.actionCount + 1
      };
    }

    case 'LEVEL_UP':
      return { ...state, level: Math.min(5, state.level + 1) };

    case 'LEVEL_DOWN':
      return { ...state, level: Math.max(1, state.level - 1) };

    case 'RESET':
      return { ...INITIAL_STATE };

    case 'LOAD':
      return action.state;

    default:
      return state;
  }
}

// ========== HOOK ==========

export function useSession() {
  const [state, dispatch] = useReducer(sessionReducer, INITIAL_STATE, loadState);
  const saveCountRef = useRef(0);

  // Debounced save: every 5th action
  useEffect(() => {
    if (state.actionCount > saveCountRef.current && state.actionCount % SAVE_EVERY_N === 0) {
      saveState(state);
      saveCountRef.current = state.actionCount;
    }
  }, [state]);

  // Save on unmount
  useEffect(() => {
    return () => saveState(state);
  }, [state]);

  // ========== DERIVED VALUES ==========

  const accuracy = state.recent.length > 0
    ? (state.recent.filter(Boolean).length / state.recent.length) * 100
    : 0;

  const mastered = Object.entries(state.mastery)
    .filter(([, val]) => val > 0.8)
    .map(([id]) => id);

  const needsPractice = Object.entries(state.mastery)
    .filter(([, val]) => val < 0.5)
    .map(([id]) => id);

  // ========== ACTIONS ==========

  const dispatchCorrect = (phonemeId: string) => dispatch({ type: 'CORRECT', phonemeId });
  const dispatchWrong = (phonemeId: string) => dispatch({ type: 'WRONG', phonemeId });
  const resetSession = () => dispatch({ type: 'RESET' });
  const levelUp = () => dispatch({ type: 'LEVEL_UP' });
  const levelDown = () => dispatch({ type: 'LEVEL_DOWN' });

  return {
    state,
    accuracy,
    mastered,
    needsPractice,
    dispatchCorrect,
    dispatchWrong,
    resetSession,
    levelUp,
    levelDown
  };
}
