// src/pages/KidsPhonicsMission.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// --- Config ---
const TOTAL_ROUNDS = 8;
const SATPIN_LETTERS = ['s', 'a', 't', 'p', 'i', 'n'];
const PHONETIC_MAP: { [key: string]: string } = { 
  s: 'sss', 
  a: 'aaa', 
  t: 't', 
  p: 'p', 
  i: 'iii', 
  n: 'nnn' 
};

type Question = {
  target: string;
  choices: string[];
};

type LevelDef = {
  id: number;
  title: string;
  items: { grapheme: string; cue: string; display?: string }[];
  choicesCount: number;
};

const LEVELS: LevelDef[] = [
  { id: 1, title: 'Level 1', items: [
    { grapheme: 's', cue: 'sss' }, { grapheme: 'a', cue: 'aaa' }, { grapheme: 't', cue: 't' }, { grapheme: 'i', cue: 'iii' }, { grapheme: 'p', cue: 'p' }, { grapheme: 'n', cue: 'nnn' }
  ], choicesCount: 2 },
  { id: 2, title: 'Level 2', items: [
    { grapheme: 'c', cue: 'c' }, { grapheme: 'k', cue: 'k' }, { grapheme: 'e', cue: 'e' }, { grapheme: 'h', cue: 'h' }, { grapheme: 'r', cue: 'r' }, { grapheme: 'm', cue: 'm' }, { grapheme: 'd', cue: 'd' }
  ], choicesCount: 2 },
  { id: 3, title: 'Level 3', items: [
    { grapheme: 'g', cue: 'g' }, { grapheme: 'o', cue: 'o' }, { grapheme: 'u', cue: 'u' }, { grapheme: 'l', cue: 'l' }, { grapheme: 'f', cue: 'f' }, { grapheme: 'b', cue: 'b' }
  ], choicesCount: 2 },
  { id: 4, title: 'Level 4', items: [
    { grapheme: 'ai', cue: 'ay' }, { grapheme: 'j', cue: 'j' }, { grapheme: 'oa', cue: 'oh' }, { grapheme: 'ie', cue: 'igh' }, { grapheme: 'ee', cue: 'ee' }, { grapheme: 'or', cue: 'or' }
  ], choicesCount: 3 },
  { id: 5, title: 'Level 5', items: [
    { grapheme: 'z', cue: 'z' }, { grapheme: 'w', cue: 'w' }, { grapheme: 'ng', cue: 'ng' }, { grapheme: 'v', cue: 'v' }, { grapheme: 'oo', cue: 'oo (moon)', display: 'oo' }, { grapheme: 'oo2', cue: 'oo (book)', display: 'oo' }
  ], choicesCount: 3 },
  { id: 6, title: 'Level 6', items: [
    { grapheme: 'y', cue: 'y' }, { grapheme: 'x', cue: 'x' }, { grapheme: 'ch', cue: 'ch' }, { grapheme: 'sh', cue: 'sh' }, { grapheme: 'th', cue: 'th (thin)', display: 'th' }, { grapheme: 'th2', cue: 'th (this)', display: 'th' }
  ], choicesCount: 3 },
  { id: 7, title: 'Level 7', items: [
    { grapheme: 'qu', cue: 'kw' }, { grapheme: 'ou', cue: 'ow' }, { grapheme: 'oi', cue: 'oy' }, { grapheme: 'ue', cue: 'yoo' }, { grapheme: 'er', cue: 'er' }, { grapheme: 'ar', cue: 'ar' }
  ], choicesCount: 3 },
];

const STORAGE_KEY = 'ts_phonics_unlocked_level';

const BEST_KEY = 'ts_phonics_level_bestStars_v1';

const PROGRESS_KEY = 'ts_phonics_level_progress_v1';

// --- Web Audio Helper: Clap-Clap Sound ---
let audioCtx: AudioContext | null = null;
const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

const playClaps = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Helper to play one clap
    const playOneClap = (startTime: number) => {
      // Create noise burst
      const bufferSize = ctx.sampleRate * 0.12; // 120ms max
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      // Bandpass filter to simulate hand clap (1200-2200Hz range)
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1700;
      filter.Q.value = 2.5;

      // Gain envelope: quick attack, fast decay
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.12, startTime + 0.002); // attack 2ms
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1); // decay 100ms

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(startTime);
      noise.stop(startTime + 0.12);
    };

    // Play two claps with 130ms delay
    playOneClap(now);
    playOneClap(now + 0.13);
  } catch (e) {
    console.warn('Clap sound failed:', e);
  }
};

type SavedProgress = {
  starsEarned: number;
  currentRound: number;
  questions: Question[];
  updatedAt: number;
};

type ProgressMap = Record<number, SavedProgress>;

type FireworkParticle = {
  id: number;
  x: string; // vw units
  y: string; // vh units
  dx: number; // pixels
  dy: number; // pixels
  rot: number; // degrees
  delayMs: number;
  durMs: number;
  sizePx: number;
  color: string;
};

const readBestStars = (kidId?: string): Record<number, number> => {
  try {
    const key = kidId ? `${BEST_KEY}:${kidId}` : BEST_KEY;
    let raw = localStorage.getItem(key);
    // Migration: if kid-specific key missing but legacy exists, copy it once
    if (!raw && kidId) {
      const legacy = localStorage.getItem(BEST_KEY);
      if (legacy) {
        try { localStorage.setItem(key, legacy); } catch {}
        raw = legacy;
      }
    }
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
};

const writeBestStars = (map: Record<number, number>, kidId?: string) => {
  try { const key = kidId ? `${BEST_KEY}:${kidId}` : BEST_KEY; localStorage.setItem(key, JSON.stringify(map)); } catch (e) { /* noop */ }
};

const readProgressMap = (kidId?: string): ProgressMap => {
  try {
    const key = kidId ? `${PROGRESS_KEY}:${kidId}` : PROGRESS_KEY;
    let raw = localStorage.getItem(key);
    // Migration from legacy
    if (!raw && kidId) {
      const legacy = localStorage.getItem(PROGRESS_KEY);
      if (legacy) {
        try { localStorage.setItem(key, legacy); } catch {}
        raw = legacy;
      }
    }
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
};

const writeProgressMap = (map: ProgressMap, kidId?: string) => {
  try { const key = kidId ? `${PROGRESS_KEY}:${kidId}` : PROGRESS_KEY; localStorage.setItem(key, JSON.stringify(map)); } catch (e) { /* noop */ }
};

const saveLevelProgress = (levelId: number, data: SavedProgress, kidId?: string) => {
  try {
    const map = readProgressMap(kidId);
    map[levelId] = data;
    writeProgressMap(map, kidId);
  } catch (e) { /* noop */ }
};

const clearLevelProgress = (levelId: number, kidId?: string) => {
  try {
    const map = readProgressMap(kidId);
    delete map[levelId];
    writeProgressMap(map, kidId);
  } catch (e) { /* noop */ }
};

const getUnlockedLevel = (kidId?: string): number => {
  try {
    const key = kidId ? `${STORAGE_KEY}:${kidId}` : STORAGE_KEY;
    let v = localStorage.getItem(key);
    // Migrate from legacy key if necessary
    if (!v && kidId) {
      const legacy = localStorage.getItem(STORAGE_KEY);
      if (legacy) {
        try { localStorage.setItem(key, legacy); } catch {}
        v = legacy;
      }
    }
    const n = v ? parseInt(v, 10) : 1;
    return Number.isFinite(n) && n >= 1 ? Math.min(7, n) : 1;
  } catch (e) {
    return 1;
  }
};

const setUnlockedLevel = (n: number, kidId?: string) => {
  try { const key = kidId ? `${STORAGE_KEY}:${kidId}` : STORAGE_KEY; localStorage.setItem(key, String(Math.min(7, Math.max(1, n)))); } catch (e) { /* noop */ }
};

// --- Firestore Progress Helpers ---
const GAME_ID = 'phonics_letter_sound';

type GameResume = {
  level: number;
  round: number;
  stars: number;
  questions: Question[];
  updatedAt?: any;
};

type GameProgressDoc = {
  bestStarsByLevel?: Record<string, number>;
  completedLevels?: number[];
  resume?: GameResume;
  lastPlayedAt?: any;
  version?: number;
};

const getGameProgressDoc = async (kidId: string): Promise<GameProgressDoc | null> => {
  try {
    const { doc, getDoc, getFirestore } = await import('firebase/firestore');
    const db = getFirestore();
    const docRef = doc(db, 'kids', kidId, 'gameProgress', GAME_ID);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? (snapshot.data() as GameProgressDoc) : null;
  } catch (e) {
    console.error('Failed to read game progress:', e);
    return null;
  }
};

const saveGameProgressDoc = async (kidId: string, data: Partial<GameProgressDoc>): Promise<void> => {
  try {
    const { doc, setDoc, getFirestore, serverTimestamp } = await import('firebase/firestore');
    const db = getFirestore();
    const docRef = doc(db, 'kids', kidId, 'gameProgress', GAME_ID);
    await setDoc(docRef, { ...data, lastPlayedAt: serverTimestamp() }, { merge: true });
  } catch (e) {
    console.error('Failed to save game progress:', e);
  }
};

const updateGameSummary = async (_kidId: string): Promise<void> => {
  // Stub: will implement summary logic later
};

// --- Helper Functions ---
const speak = (text: string) => {
  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech to prevent overlap
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
};

// Generate questions for a specific level
const generateQuestionsForLevel = (levelDef: LevelDef): Question[] => {
  const pool = levelDef.items.map(i => i.grapheme);
  const questions: Question[] = [];
  let last = '';
  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    const candidates = pool.filter(p => p !== last);
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    last = target;

    const others = pool.filter(p => p !== target);
    const shuffled = others.sort(() => 0.5 - Math.random());
    const needed = Math.max(0, levelDef.choicesCount - 1);
    const choices = [target, ...shuffled.slice(0, needed)];
    if (Math.random() > 0.5) choices.reverse();

    questions.push({ target, choices });
  }
  return questions;
};

// NOTE: Immersive helpers are defined inside the component so they can access `gameRef`.


// --- Main Component ---
const KidsPhonicsMission: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { user } = useAuth();
  let kidId = searchParams.get('kidId') || '';
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [starsEarned, setStarsEarned] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [lastTappedChoice, setLastTappedChoice] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [highestUnlocked, setHighestUnlocked] = useState<number>(getUnlockedLevel(kidId));
  const navigate = useNavigate();

  // Auto-recover kidId from localStorage if missing in URL
  useEffect(() => {
    if (!kidId) {
      try {
        // Try global fallback first
        let stored = localStorage.getItem('ts_active_kid_v1');
        // Then try user-specific storage
        if (!stored && user?.uid) {
          stored = localStorage.getItem(`ts_parent_selected_kid_v1:${user.uid}`);
        }
        if (stored) {
          // Redirect to same page with kidId added
          const newParams = new URLSearchParams(searchParams);
          newParams.set('kidId', stored);
          navigate(
            { pathname: location.pathname, search: newParams.toString() },
            { replace: true }
          );
        }
      } catch {
        // ignore storage errors
      }
    }
  }, [kidId, user?.uid, searchParams, location.pathname, navigate]);

  // Persist kidId to localStorage when present
  useEffect(() => {
    if (kidId) {
      try {
        localStorage.setItem('ts_active_kid_v1', kidId);
      } catch {
        // ignore storage errors
      }
    }
  }, [kidId]);

  // Helper to preserve kidId in all navigation
  const withKid = (path: string) => {
    if (!kidId) return path;
    const sep = path.includes('?') ? '&' : '?';
    return path.includes('kidId=') ? path : `${path}${sep}kidId=${encodeURIComponent(kidId)}`;
  };
  // Helper to namespace localStorage keys by kidId when present
  const keyForKid = (base: string) => (kidId ? `${base}:${kidId}` : base);
  const timeoutsRef = useRef<number[]>([]);
  const clearAllTimeouts = () => { timeoutsRef.current.forEach(id => clearTimeout(id)); timeoutsRef.current = []; };
  const [bestStarsMap, setBestStarsMap] = useState<Record<number, number>>(() => readBestStars(kidId));
  const [confettiActive, setConfettiActive] = useState(false);
  const [fireworks, setFireworks] = useState<FireworkParticle[]>([]);
  const gameRef = useRef<HTMLDivElement | null>(null);
  const lastFirestoreSaveRef = useRef<number>(0);
  const firestoreSaveTimeoutRef = useRef<number | null>(null);

  const isSmallScreen = () => window.matchMedia('(max-width: 767px)').matches;

  async function enterImmersiveMode() {
    try {
      // Attempt to request fullscreen on the game container first
      if (gameRef.current?.requestFullscreen) {
        await gameRef.current.requestFullscreen();
      } else if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }

      // Add body class to hide header
      try { document.body.classList.add('ts-immersive-game'); } catch (e) { /* noop */ }

      // Lock orientation on small screens where supported
      if (isSmallScreen() && (screen.orientation as any)?.lock) {
        try {
          await (screen.orientation as any).lock('landscape');
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // fail silently
    }
  }

  async function exitImmersiveMode() {
    try {
      try { document.body.classList.remove('ts-immersive-game'); } catch (e) { /* noop */ }
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen().catch(() => {/* fail silently */});
      }
      if ((screen.orientation as any)?.unlock) {
        try { (screen.orientation as any).unlock(); } catch (e) { /* noop */ }
      }
    } catch (e) {
      // fail silently
    }
  }

  const currentQuestion = questions[currentRound];

  const generateAndStart = useCallback((levelId: number) => {
    clearAllTimeouts();
    const levelDef = LEVELS.find(l => l.id === levelId)!;
    setQuestions(generateQuestionsForLevel(levelDef));
    setCurrentRound(0);
    setStarsEarned(0);
    setFeedback(null);
    setLastTappedChoice(null);
    setIsComplete(false);
  }, []);

  // Helper to start a level atomically (no intermediate blank state)
  const startLevel = useCallback(async (levelId: number) => {
    clearAllTimeouts();
    setSelectedLevel(levelId);
    setIsComplete(false);
    setFeedback(null);
    setLastTappedChoice(null);
    
    let resumeData: SavedProgress | null = null;
    let firestoreBestStars: Record<number, number> | null = null;
    
    // Try Firestore first if kidId available
    if (kidId) {
      try {
        const fsDoc = await getGameProgressDoc(kidId);
        if (fsDoc) {
          // Merge best stars from Firestore
          if (fsDoc.bestStarsByLevel) {
            firestoreBestStars = {};
            Object.entries(fsDoc.bestStarsByLevel).forEach(([k, v]) => {
              const lvl = parseInt(k, 10);
              if (!isNaN(lvl)) firestoreBestStars![lvl] = v;
            });
          }
          // Check for resume data matching this level
          if (fsDoc.resume && fsDoc.resume.level === levelId) {
            const r = fsDoc.resume;
            // Strict validation of resume data
            const levelDef = LEVELS.find(l => l.id === levelId);
            if (
              levelDef &&
              r.round >= 0 && r.round < TOTAL_ROUNDS &&
              r.stars >= 0 && r.stars <= TOTAL_ROUNDS &&
              r.questions && Array.isArray(r.questions) &&
              r.questions.length === TOTAL_ROUNDS
            ) {
              // Validate each question in the resume
              const levelPool = levelDef.items.map(i => i.grapheme);
              const allQuestionsValid = r.questions.every(q => {
                return (
                  q && typeof q === 'object' &&
                  q.target && levelPool.includes(q.target) &&
                  Array.isArray(q.choices) &&
                  q.choices.length === levelDef.choicesCount &&
                  q.choices.includes(q.target)
                );
              });
              
              if (allQuestionsValid) {
                resumeData = {
                  questions: r.questions,
                  currentRound: r.round,
                  starsEarned: r.stars,
                  updatedAt: r.updatedAt || Date.now()
                };
              }
            }
            // Silently ignore old seed-based resume or invalid data
          }
        }
      } catch (e) {
        console.warn('Firestore load failed, falling back to localStorage:', e);
      }
    }
    
    // Merge Firestore best stars into state
    if (firestoreBestStars) {
      const merged = { ...bestStarsMap, ...firestoreBestStars };
      setBestStarsMap(merged);
      writeBestStars(merged, kidId);
    }
    
    // Fallback to localStorage if Firestore didn't provide resume
    if (!resumeData) {
      const progressMap = readProgressMap(kidId);
      const saved = progressMap[levelId];
      const isValid = saved && 
        Array.isArray(saved.questions) && 
        saved.questions.length === TOTAL_ROUNDS &&
        typeof saved.currentRound === 'number' &&
        saved.currentRound >= 0 && saved.currentRound < TOTAL_ROUNDS &&
        typeof saved.starsEarned === 'number' &&
        saved.starsEarned >= 0 && saved.starsEarned <= TOTAL_ROUNDS;
      if (isValid) resumeData = saved;
    }
    
    if (resumeData) {
      // Resume from saved progress
      setQuestions(resumeData.questions);
      setCurrentRound(resumeData.currentRound);
      setStarsEarned(resumeData.starsEarned);
    } else {
      // Start fresh
      const levelDef = LEVELS.find(l => l.id === levelId)!;
      const qs = generateQuestionsForLevel(levelDef);
      setQuestions(qs);
      setCurrentRound(0);
      setStarsEarned(0);
    }
  }, [kidId, bestStarsMap]);

  // Initialize from query param or keep on level select
  useEffect(() => {
    const levelParam = searchParams.get('level');
    const lp = levelParam ? parseInt(levelParam, 10) : NaN;
    const unlocked = getUnlockedLevel(kidId);
    setHighestUnlocked(unlocked);
    if (!Number.isNaN(lp) && lp >= 1 && lp <= 7 && lp <= unlocked) {
      setSelectedLevel(lp);
      generateAndStart(lp);
    }
  }, [searchParams, generateAndStart]);

  const playSound = useCallback(() => {
    if (currentQuestion) {
      // find cue from LEVELS
      const allItems = LEVELS.flatMap(l => l.items);
      const item = allItems.find(it => it.grapheme === currentQuestion.target);
      const cue = item ? item.cue : (PHONETIC_MAP[currentQuestion.target] || currentQuestion.target);
      speak(cue);
    }
  }, [currentQuestion]);

  useEffect(() => {
    if (currentQuestion) {
      const allItems = LEVELS.flatMap(l => l.items);
      const item = allItems.find(it => it.grapheme === currentQuestion.target);
      const cue = item ? item.cue : (PHONETIC_MAP[currentQuestion.target] || currentQuestion.target);
      speak(cue);
    }
  }, [currentQuestion]);

  useEffect(() => {
    return () => {
      clearAllTimeouts();
      exitImmersiveMode();
    };
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    if (selectedLevel && questions.length > 0 && !isComplete) {
      saveLevelProgress(selectedLevel, {
        starsEarned,
        currentRound,
        questions,
        updatedAt: Date.now()
      }, kidId);
    }
  }, [selectedLevel, starsEarned, currentRound, questions, isComplete]);

  // Throttled Firestore autosave (every 3 seconds max)
  useEffect(() => {
    if (!kidId || !selectedLevel || questions.length === 0 || isComplete) return;
    
    const now = Date.now();
    const timeSinceLastSave = now - lastFirestoreSaveRef.current;
    
    const doSave = () => {
      saveGameProgressDoc(kidId, {
        resume: {
          level: selectedLevel,
          round: currentRound,
          stars: starsEarned,
          questions,
          updatedAt: now
        },
        version: 1
      }).catch(e => console.warn('Firestore autosave failed:', e));
      lastFirestoreSaveRef.current = now;
    };
    
    if (timeSinceLastSave >= 3000) {
      // Save immediately
      doSave();
    } else {
      // Schedule save after throttle period
      if (firestoreSaveTimeoutRef.current) clearTimeout(firestoreSaveTimeoutRef.current);
      firestoreSaveTimeoutRef.current = window.setTimeout(doSave, 3000 - timeSinceLastSave);
    }
    
    return () => {
      if (firestoreSaveTimeoutRef.current) clearTimeout(firestoreSaveTimeoutRef.current);
    };
  }, [kidId, selectedLevel, currentRound, starsEarned, questions, isComplete]);

  // Listen for fullscreen changes (e.g., ESC) to ensure cleanup
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) {
        // fullscreen was exited
        try { exitImmersiveMode(); } catch (e) { /* noop */ }
      }
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const handleChoice = (choice: string) => {
    if (feedback) return; // Prevent multiple clicks

    setLastTappedChoice(choice);

    if (choice === currentQuestion.target) {
        setFeedback('correct');
        setConfettiActive(true);
        playClaps(); // Kid-friendly clap-clap celebration sound
        
        // Generate firecracker fireworks from grass line + corners
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReducedMotion) {
          const particles: FireworkParticle[] = [];
          let particleId = 0;
          const colors = ['#FFD54A', '#FF7A59', '#FF4D8D', '#7C5CFF', '#2EE6A6', '#FFFFFF'];
          
          // Helper to clamp positions
          const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
          
          // Ground bursts (main effect from grass line)
          const groundBursts = [
            { x: 14, y: 86, count: 24 }, // Bottom-left
            { x: 86, y: 86, count: 24 }, // Bottom-right
            { x: 50, y: 88, count: 24 }, // Bottom-center (slightly lower)
          ];
          
          groundBursts.forEach(burst => {
            const xClamped = clamp(burst.x, 6, 94);
            const yClamped = clamp(burst.y, 8, 92);
            
            for (let i = 0; i < burst.count; i++) {
              // Mostly upward fan: angles -140° to -40°
              const angle = -140 + Math.random() * 100;
              const angleRad = (angle * Math.PI) / 180;
              const radius = 220 + Math.random() * 200;
              const dx = Math.cos(angleRad) * radius;
              const dy = Math.sin(angleRad) * radius; // negative = upward
              
              particles.push({
                id: particleId++,
                x: `${xClamped}vw`,
                y: `${yClamped}vh`,
                dx,
                dy,
                rot: Math.random() * 720 - 360,
                delayMs: Math.random() * 450,
                durMs: 1800 + Math.random() * 800,
                sizePx: 4 + Math.random() * 4,
                color: colors[Math.floor(Math.random() * colors.length)],
              });
            }
          });
          
          // Corner bursts (small pops near balloons/bunting)
          const cornerBursts = [
            { x: 92, y: 18, count: 12, angleMin: 140, angleMax: 220 }, // Top-right
            { x: 8, y: 14, count: 12, angleMin: -40, angleMax: 40 },   // Top-left
          ];
          
          cornerBursts.forEach(burst => {
            const xClamped = clamp(burst.x, 6, 94);
            const yClamped = clamp(burst.y, 8, 92);
            
            for (let i = 0; i < burst.count; i++) {
              const angle = burst.angleMin + Math.random() * (burst.angleMax - burst.angleMin);
              const angleRad = (angle * Math.PI) / 180;
              const radius = 120 + Math.random() * 120;
              const dx = Math.cos(angleRad) * radius;
              const dy = Math.sin(angleRad) * radius;
              
              particles.push({
                id: particleId++,
                x: `${xClamped}vw`,
                y: `${yClamped}vh`,
                dx,
                dy,
                rot: Math.random() * 720 - 360,
                delayMs: Math.random() * 450,
                durMs: 1800 + Math.random() * 800,
                sizePx: 4 + Math.random() * 3,
                color: colors[Math.floor(Math.random() * colors.length)],
              });
            }
          });
          
          setFireworks(particles);
          
          // Clear fireworks after 3000ms
          const fireworkTimeout = window.setTimeout(() => {
            setFireworks([]);
          }, 3000);
          timeoutsRef.current.push(fireworkTimeout);
        }
        
        const newStars = starsEarned + 1;
        setStarsEarned(s => s + 1);
        const t = window.setTimeout(() => {
          setConfettiActive(false);
          if (currentRound < TOTAL_ROUNDS - 1) {
            setCurrentRound(r => r + 1);
            setFeedback(null);
            setLastTappedChoice(null);
          } else {
            setIsComplete(true);
            // Update best stars for this level
            if (selectedLevel) {
              const prev = bestStarsMap[selectedLevel] || 0;
              if (newStars > prev) {
                const nextMap = { ...bestStarsMap, [selectedLevel]: newStars };
                setBestStarsMap(nextMap);
                writeBestStars(nextMap, kidId);
              }
              // Clear progress since level is completed
              clearLevelProgress(selectedLevel, kidId);
              
              // Save completion to Firestore
              if (kidId) {
                const bestByLevel: Record<string, number> = {};
                Object.entries({ ...bestStarsMap, [selectedLevel]: Math.max(prev, newStars) }).forEach(([k, v]) => {
                  bestByLevel[k] = v;
                });
                
                const updateData: any = {
                  bestStarsByLevel: bestByLevel,
                  resume: null, // Clear resume on completion (explicit null for merge)
                  version: 1
                };
                
                // Add to completedLevels if 6+ stars
                if (newStars >= 6) {
                  (async () => {
                    try {
                      const { doc, updateDoc, getFirestore, arrayUnion } = await import('firebase/firestore');
                      const db = getFirestore();
                      const docRef = doc(db, 'kids', kidId, 'gameProgress', GAME_ID);
                      await updateDoc(docRef, {
                        ...updateData,
                        completedLevels: arrayUnion(selectedLevel)
                      });
                    } catch (e) {
                      // Fallback to setDoc if doc doesn't exist
                      const currentCompleted = (await getGameProgressDoc(kidId))?.completedLevels || [];
                      const updatedCompleted = Array.from(new Set([...currentCompleted, selectedLevel]));
                      await saveGameProgressDoc(kidId, {
                        ...updateData,
                        completedLevels: updatedCompleted
                      });
                    }
                  })().catch(e => console.warn('Firestore completion save failed:', e));
                } else {
                  saveGameProgressDoc(kidId, updateData).catch(e => console.warn('Firestore completion save failed:', e));
                }
              }
            }
            // Unlock next level if criteria met
            if (selectedLevel && newStars >= 6 && selectedLevel < 7) {
              const newUnlocked = Math.max(getUnlockedLevel(kidId), selectedLevel + 1);
              setUnlockedLevel(newUnlocked, kidId);
              setHighestUnlocked(newUnlocked);
            }
          }
        }, 4000);
        timeoutsRef.current.push(t);
    } else {
      setFeedback('wrong');
      const t2 = window.setTimeout(() => {
        setFeedback(null);
        setLastTappedChoice(null);
      }, 350);
      timeoutsRef.current.push(t2);
    }
  };

  // Stable wrapper for fullscreen - always rendered
  return (
    <div ref={gameRef} className="ts-phonics-mission-root">
      {!selectedLevel ? (
        <div className="relative min-h-screen flex flex-col items-center justify-start py-12 px-4 overflow-hidden" style={{ background: 'linear-gradient(180deg, #050510 0%, #150a2b 35%, #0b2a5e 100%)', boxShadow: 'inset 0 0 160px rgba(0,0,0,0.75)' }}>
        <style>{`
          .level-grid { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:16px; max-width:900px; }
          .level-card { padding:18px; border-radius:16px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); cursor:pointer; }
          .level-card.locked { opacity:0.4; cursor:not-allowed; }
          @media (prefers-reduced-motion: reduce) { .level-card { transition:none !important } }
        `}</style>

        {/* Back to Phonics Library (Choose Level screen) */}
        <Link
          to={withKid('/kids/games/phonics')}
          className="absolute top-5 right-5 px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 transition-all duration-200 font-semibold shadow-lg text-white hover:text-white focus:text-white"
          style={{ zIndex: 50 }}
        >
          ← Back to Phonics Library
        </Link>

        <div className="w-full max-w-6xl mx-auto text-center mb-8">
          <h1 className="text-5xl font-bold text-white">Choose Level</h1>
          <p className="text-white/70 mt-2">Pick a Jolly Phonics level to play</p>
          
          {!kidId && (
            <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-500/40 rounded-lg max-w-md mx-auto">
              <p className="text-yellow-200 font-semibold mb-3">⚠️ No child selected</p>
              <p className="text-yellow-100/80 text-sm mb-4">Please go back and choose a child to track progress.</p>
              <Link
                to={withKid('/parent')}
                className="inline-block px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors"
              >
                ← Back to Parent Dashboard
              </Link>
            </div>
          )}
        </div>

        <div className="level-grid w-full max-w-3xl mx-auto">
          {LEVELS.map(l => {
            const locked = l.id > highestUnlocked;
            const best = bestStarsMap[l.id] || 0;
            const progressMap = readProgressMap(kidId);
            const savedProgress = progressMap[l.id];
            
            // Determine status badge
            let badge = 'Not started';
            let starsToShow = 0;
            
            if (best >= 6) {
              badge = 'Completed';
              starsToShow = best;
            } else if (savedProgress && (savedProgress.starsEarned > 0 || savedProgress.currentRound > 0)) {
              badge = 'In progress';
              starsToShow = savedProgress.starsEarned;
            } else if (best > 0) {
              badge = 'In progress';
              starsToShow = best;
            }
            
            return (
              <button key={l.id} type="button" aria-label={`Level ${l.id} ${l.title}`} onClick={() => { if (!locked) { startLevel(l.id); enterImmersiveMode(); } }} className={`level-card ${locked ? 'locked' : ''}`}>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-white">{l.title}</div>
                      <div className="text-sm text-white/80 mt-2">{l.items.map(it => (it.display || it.grapheme)).slice(0,6).join(' ')}</div>
                    </div>
                    <div className="text-sm text-white/60">{locked ? 'Locked 🔒' : 'Play'}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div aria-label={`Stars: ${starsToShow} of ${TOTAL_ROUNDS}`} className="text-yellow-300">
                      {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
                        <span key={i} className={`text-sm mr-0.5 ${i < starsToShow ? 'text-yellow-300' : 'text-white/30'}`}>★</span>
                      ))}
                    </div>
                    <div className="text-sm text-white/60">{badge}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        </div>
      ) : !currentQuestion ? (
        // Loading state with game background to prevent white flash
        <div className="relative min-h-screen flex items-center justify-center text-white text-2xl font-semibold"
          style={{
            background: 'linear-gradient(180deg, #0a0618 0%, #1a1040 50%, #0f1b4a 100%)',
            boxShadow: 'inset 0 0 200px rgba(0,0,0,0.8)'
          }}>
          <div className="starfield" aria-hidden="true" />
          Loading Mission...
        </div>
      ) : (
        <div className="relative overflow-hidden text-white flex flex-col items-center justify-center"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 40,
          backgroundImage: 'url("/Games/Phonics/letter-sound-match/bg.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
      <style>{`
        /* Animations */
        /* Pop animation used for answer feedback (scale-only, no rotation) */
        @keyframes pop {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }

        /* Simplified sparkle used for small flashes (scale-only, no rotate)
           Keeps visual sparkle but avoids any rotation on answer buttons */
        @keyframes sparkle { 
          0%, 100% { transform: scale(1); opacity: 1; } 
          50% { transform: scale(1.15); opacity: 0.95; } 
        }
        @keyframes sparkleBurst {
          0% { transform: scale(0); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.9; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes gentleShake { 
          0%, 100% { transform: translateX(0); } 
          25% { transform: translateX(-8px); } 
          75% { transform: translateX(8px); } 
        }
        @keyframes boomingPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(255, 140, 66, 0.4); }
          50% { transform: scale(1.06); box-shadow: 0 0 40px rgba(255, 140, 66, 0.8), 0 0 60px rgba(255, 107, 53, 0.6); }
        }
        @keyframes comet { 
          0% { transform: translate(-100vw, 0) rotate(-30deg); opacity: 0; } 
          10% { opacity: 0.6; } 
          90% { opacity: 0.6; } 
          100% { transform: translate(200vw, -50vh) rotate(-30deg); opacity: 0; } 
        }
        @keyframes twinkle { 
          0%, 100% { opacity: 0.3; } 
          50% { opacity: 0.8; } 
        }
        @keyframes drift { 
          0% { transform: translate(0, 0); } 
          100% { transform: translate(15px, -15px); } 
        }
        
        /* Starfield with pseudo-elements */
        .starfield { 
          position: absolute; 
          inset: 0; 
          pointer-events: none; 
        }
        .starfield::before, .starfield::after {
          content: ''; 
          position: absolute; 
          inset: 0;
          background-image:
            radial-gradient(circle at 15% 20%, white 1px, transparent 1.1px),
            radial-gradient(circle at 85% 30%, white 0.8px, transparent 0.9px),
            radial-gradient(circle at 40% 70%, white 1px, transparent 1.1px),
            radial-gradient(circle at 70% 50%, white 0.9px, transparent 1px);
          background-size: 120px 120px;
          animation: twinkle 6s ease-in-out infinite, drift 80s linear infinite;
        }
        .starfield::after { 
          background-size: 180px 180px; 
          animation-delay: -3s; 
          animation-duration: 8s, 120s;
        }

        /* Mission panel sparkle burst on correct */
        .mission-panel.show-sparkle::after {
          content: '✨';
          position: absolute;
          top: 20%;
          right: 10%;
          font-size: 3rem;
          animation: sparkleBurst 0.6s ease-out;
          pointer-events: none;
        }

        /* Immersive mode: hide site header/nav and remove top spacing */
        .ts-immersive-game header,
        .ts-immersive-game nav,
        .ts-immersive-game [role="banner"],
        .ts-immersive-game .site-header,
        .ts-immersive-game .navbar {
          display: none !important;
        }

        .ts-immersive-game body,
        .ts-immersive-game #root,
        .ts-immersive-game main,
        .ts-immersive-game .min-h-screen {
          padding-top: 0 !important;
          margin-top: 0 !important;
        }

        /* Button states */
        .choice-btn {
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .choice-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
        }
        .choice-btn:active {
          transform: scale(0.98);
        }
        .choice-btn.sparkle-correct {
          animation: pop 220ms cubic-bezier(.2,.9,.2,1);
          background: rgba(45, 212, 191, 0.6) !important;
          border-color: rgba(45, 212, 191, 1) !important;
          box-shadow: 0 0 60px rgba(45, 212, 191, 0.95), 0 0 140px rgba(45, 212, 191, 0.6) !important;
        }
        .choice-btn.shake-wrong {
          animation: gentleShake 0.35s ease-in-out;
        }
        .choice-btn.glow-wrong {
          animation: pop 220ms cubic-bezier(.2,.9,.2,1);
          background: rgba(239, 68, 68, 0.6) !important;
          border-color: rgba(239, 68, 68, 1) !important;
          box-shadow: 0 0 60px rgba(239, 68, 68, 0.95), 0 0 140px rgba(239, 68, 68, 0.6) !important;
        }

        /* Explicit utility classes for answer glow styling (kept for clarity and future use) */
        .answerGlowGreen {
          animation: pop 220ms cubic-bezier(.2,.9,.2,1);
          background: rgba(45, 212, 191, 0.6) !important;
          border-color: rgba(45, 212, 191, 1) !important;
          box-shadow: 0 0 60px rgba(45, 212, 191, 0.95), 0 0 140px rgba(45, 212, 191, 0.6) !important;
        }
        .answerGlowRed {
          animation: pop 220ms cubic-bezier(.2,.9,.2,1);
          background: rgba(239, 68, 68, 0.6) !important;
          border-color: rgba(239, 68, 68, 1) !important;
          box-shadow: 0 0 60px rgba(239, 68, 68, 0.95), 0 0 140px rgba(239, 68, 68, 0.6) !important;
        }
        .listen-btn-booming {
          animation: boomingPulse 1.8s ease-in-out infinite;
        }

        @keyframes confettiFall {
          0% { top: -10%; opacity: 1; }
          85% { opacity: 1; }
          100% { top: 120%; opacity: 0; }
        }

        @keyframes fireworkBurst {
          0% { transform: translate3d(0, 0, 0) scale(0.9) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translate3d(var(--dx), var(--dy), 0) scale(1) rotate(var(--rot)); opacity: 0; }
        }

        @keyframes fireworkFlash {
          0% { transform: scale(0.6); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) { 
          * { animation: none !important; transition: none !important; }
          .listen-btn-booming { animation: none !important; transform: scale(1) !important; }
        }
      `}</style>
      
      {/* Back Button */}
      {!selectedLevel ? (
        <Link
          to={withKid('/kids/games/phonics')}
          className="absolute top-5 right-5 px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 transition-all duration-200 font-semibold shadow-lg"
          style={{ zIndex: 50 }}
        >
          ← Back to Phonics Library
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => {
            // Save progress immediately before leaving
            if (kidId && selectedLevel && questions.length > 0 && !isComplete) {
              saveGameProgressDoc(kidId, {
                resume: {
                  level: selectedLevel,
                  round: currentRound,
                  stars: starsEarned,
                  questions,
                  updatedAt: Date.now()
                },
                version: 1
              }).catch(e => console.warn('Firestore save on exit failed:', e));
            }
            exitImmersiveMode();
            clearAllTimeouts();
            setSelectedLevel(null);
            setQuestions([]);
            setFeedback(null);
            setLastTappedChoice(null);
            setIsComplete(false);
            setStarsEarned(0);
            setCurrentRound(0);
            navigate(withKid('/kids/games/phonics/letter-sound'), { replace: true });
          }}
          className="absolute top-5 right-5 px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 transition-all duration-200 font-semibold shadow-lg text-white hover:text-white focus:text-white"
          style={{ zIndex: 50 }}
        >
          ← Back to Levels
        </button>
      )}

      {isComplete ? (
        <div className="text-center z-10 p-8 bg-black/30 backdrop-blur-md rounded-3xl border border-white/20">
          <h1 className="text-6xl font-bold text-yellow-300 mb-4">Mission Complete!</h1>
          <div className="text-5xl mb-6">
            {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
              <span key={i} className="text-3xl">
                {i < starsEarned ? '★' : '☆'}
              </span>
            ))}
          </div>
          <p className="text-2xl mb-4">You earned {starsEarned} stars!</p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => { if (selectedLevel) { generateAndStart(selectedLevel); enterImmersiveMode(); } }}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-2xl text-lg font-bold shadow-xl"
              type="button"
            >
              Play Again 🚀
            </button>
            <button
              onClick={() => { exitImmersiveMode(); clearAllTimeouts(); setSelectedLevel(null); setQuestions([]); setFeedback(null); setLastTappedChoice(null); navigate(withKid('/kids/games/phonics/letter-sound'), { replace: true }); }}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-lg font-semibold"
              type="button"
            >
              Choose Level
            </button>
            {selectedLevel && starsEarned >= 6 && selectedLevel < 7 && (
              <button
                onClick={() => {
                  const next = selectedLevel + 1;
                  const unlocked = getUnlockedLevel(kidId);
                  if (next <= unlocked) {
                    startLevel(next);
                    // Keep fullscreen active, just update URL
                    navigate({ pathname: '/kids/games/phonics/letter-sound', search: '?level=' + next }, { replace: true });
                  }
                }}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-2xl text-lg font-bold text-white"
                type="button"
              >
                Next Level ▶
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center px-4" style={{ zIndex: 10, paddingTop: 60 }}>
          {/* Progress Stars - Top center */}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex justify-center gap-2" aria-label={`Progress: ${starsEarned} of ${TOTAL_ROUNDS} stars earned`} style={{ zIndex: 20 }}>
            {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
              <span key={i} className="text-4xl drop-shadow-lg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
                {i < starsEarned ? '★' : '☆'}
              </span>
            ))}
          </div>

          {/* Top instructional text */}
          <div className="absolute top-24 left-1/2 text-3xl md:text-4xl font-bold text-gray-800 drop-shadow-lg text-center" style={{ transform: 'translateX(-50%)', width: 'min(1100px, 92vw)', textShadow: '2px 2px 4px rgba(255,255,255,0.5), 0 0 8px rgba(255,255,255,0.3)', zIndex: 20 }}>
            Tap the letter that says this sound
          </div>

          {/* Main gameplay: 2 columns on desktop, stacked on mobile */}
          <div className="w-full flex items-center justify-center" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 56px' }}>
          <div className="flex flex-col md:flex-row items-center justify-center" style={{ gap: '160px', transform: 'translateY(24px)' }}>
            {/* LEFT COLUMN: Listen Button */}
            <div className="flex flex-col items-center justify-center gap-6">
              <button
                onClick={playSound}
                type="button"
                aria-label="Listen to sound"
                className="listen-btn-booming relative flex items-center justify-center rounded-full shadow-2xl transition-transform hover:scale-105 active:scale-95"
                style={{
                  width: 340,
                  height: 340,
                  background: 'linear-gradient(135deg, #FF8C42 0%, #FF6B35 100%)',
                  border: '8px solid rgba(255,255,255,0.9)',
                  touchAction: 'manipulation',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                }}
              >
                <img 
                  src="/Games/Phonics/letter-sound-match/listen.png" 
                  alt="Listen" 
                  style={{
                    width: '70%',
                    height: '70%',
                    objectFit: 'contain',
                    pointerEvents: 'none',
                  }}
                />
              </button>
              <div className="text-4xl font-bold text-gray-800" style={{ textShadow: '2px 2px 4px rgba(255,255,255,0.6)' }}>
                listen
              </div>
            </div>

            {/* RIGHT COLUMN: Option Buttons */}
            <div className="flex flex-col items-stretch justify-center" style={{ gap: '34px', width: 420 }}>
              {currentQuestion.choices.map(choice => {
                const allItems = LEVELS.flatMap(l => l.items);
                const item = allItems.find(x => x.grapheme === choice);
                const displayText = item ? (item.display || item.grapheme) : choice;
                const isCorrect = choice === currentQuestion.target;
                const isWrong = choice === lastTappedChoice && !isCorrect;
                
                return (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => handleChoice(choice)}
                    aria-label={`Choose ${displayText}`}
                    className={`choice-btn flex items-center justify-center rounded-3xl shadow-xl font-black text-gray-800 transition-all
                      ${feedback === 'correct' && isCorrect ? 'sparkle-correct' : ''}
                      ${feedback === 'wrong' && isWrong ? 'glow-wrong shake-wrong' : ''}
                    `}
                    style={{
                      height: 160,
                      background: 'linear-gradient(135deg, #FFDAB9 0%, #FFB88C 100%)',
                      border: '6px solid rgba(139, 69, 19, 0.4)',
                      fontSize: displayText.length > 1 ? '5rem' : '6rem',
                      fontFamily: '"Comic Sans MS","Comic Sans",cursive',
                      touchAction: 'manipulation',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                    }}
                  >
                    {displayText.toLowerCase()}
                  </button>
                );
              })}
            </div>
          </div>
          </div>

          {/* Feedback Messages */}
          {feedback === 'correct' && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center text-4xl text-green-400 font-bold drop-shadow-lg" style={{ zIndex: 30, textShadow: '2px 2px 6px rgba(0,0,0,0.8)' }}>
              Great job! ✨
            </div>
          )}
          {feedback === 'wrong' && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center text-4xl text-yellow-300 font-bold drop-shadow-lg" style={{ zIndex: 30, textShadow: '2px 2px 6px rgba(0,0,0,0.8)' }}>
              Try again! 🌟
            </div>
          )}

          {/* Confetti Overlay */}
          {confettiActive && (
            <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 60, overflow: 'hidden' }} aria-hidden="true">
              {Array.from({ length: 50 }).map((_, i) => {
                const left = Math.random() * 100;
                const delay = Math.random() * 0.6;
                const duration = 2.8 + Math.random() * 1.4;
                const rotation = Math.random() * 360;
                const colors = ['#fbbf24', '#34d399', '#60a5fa', '#f87171', '#a78bfa', '#fb923c'];
                const color = colors[Math.floor(Math.random() * colors.length)];
                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: `${left}%`,
                      top: '-10%',
                      width: '10px',
                      height: '10px',
                      backgroundColor: color,
                      borderRadius: '2px',
                      animation: `confettiFall ${duration}s linear ${delay}s forwards`,
                      transform: `rotate(${rotation}deg)`,
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Firecracker Fireworks Overlay */}
          {fireworks.length > 0 && (
            <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 60, overflow: 'hidden' }} aria-hidden="true">
              {fireworks.map(particle => (
                <div
                  key={particle.id}
                  style={{
                    position: 'absolute',
                    left: particle.x,
                    top: particle.y,
                    width: particle.sizePx,
                    height: particle.sizePx,
                    backgroundColor: particle.color,
                    borderRadius: '2px',
                    // @ts-ignore - CSS variables work at runtime
                    '--dx': `${particle.dx}px`,
                    '--dy': `${particle.dy}px`,
                    '--rot': `${particle.rot}deg`,
                    animation: `fireworkBurst ${particle.durMs}ms ease-out ${particle.delayMs}ms forwards`,
                  } as React.CSSProperties}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
    )}
  </div>
  );
};

export default KidsPhonicsMission;
