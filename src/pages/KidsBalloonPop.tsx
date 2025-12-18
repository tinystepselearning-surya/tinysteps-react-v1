// src/pages/KidsBalloonPop.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';

type Balloon = {
	id: number;
	letter: string;
	x: number; // percent 0..100
	y: number; // percent (0 at top, 100 at bottom)
	speed: number; // percent per second
	popping?: boolean;
	wobblePhase?: number; // For horizontal wobble animation
	isPopping?: boolean; // Short burst animation state
	popAt?: number; // Timestamp when pop started
};

// Jolly Phonics levels with proper progression
type LevelConfig = {
	id: number;
	title: string;
	letters: string[];
	balloonCount: number;
	speedMin: number;
	speedMax: number;
};

const JOLLY_LEVELS: LevelConfig[] = [
	{ id: 1, title: 'Level 1', letters: ['s', 'a', 't', 'i', 'p', 'n'], balloonCount: 6, speedMin: 8, speedMax: 14 },
	{ id: 2, title: 'Level 2', letters: ['c', 'k', 'e', 'h', 'r', 'm'], balloonCount: 6, speedMin: 8, speedMax: 15 },
	{ id: 3, title: 'Level 3', letters: ['d', 'g', 'o', 'u', 'l', 'f', 'b'], balloonCount: 7, speedMin: 9, speedMax: 16 },
	{ id: 4, title: 'Level 4', letters: ['ai', 'j', 'oa', 'ie', 'ee', 'or'], balloonCount: 6, speedMin: 9, speedMax: 16 },
	{ id: 5, title: 'Level 5', letters: ['z', 'w', 'ng', 'v', 'oo'], balloonCount: 5, speedMin: 10, speedMax: 17 },
	{ id: 6, title: 'Level 6', letters: ['y', 'x', 'ch', 'sh', 'th'], balloonCount: 5, speedMin: 10, speedMax: 18 },
	{ id: 7, title: 'Level 7', letters: ['qu', 'ou', 'oi', 'ue', 'er', 'ar'], balloonCount: 6, speedMin: 11, speedMax: 18 },
];

// Progress tracking per kid
type Progress = {
	unlocked: number; // highest unlocked level (1-7)
	completed: Record<number, { stars: number; bestScore: number }>;
};

const TARGET_CORRECT = 10; // Correct pops needed to complete level
const BALLOON_SIZE = 90; // px width

const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const choice = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

// LocalStorage progress helpers
const getProgressKey = (kidId: string) => kidId ? `ts_balloonpop_progress_${kidId}` : 'ts_balloonpop_progress_guest';

const loadProgress = (kidId: string): Progress => {
	if (typeof window === 'undefined') return { unlocked: 1, completed: {} };
	try {
		const key = getProgressKey(kidId);
		const raw = localStorage.getItem(key);
		if (!raw) return { unlocked: 1, completed: {} };
		const parsed = JSON.parse(raw);
		return {
			unlocked: parsed.unlocked || 1,
			completed: parsed.completed || {},
		};
	} catch (e) {
		console.error('Failed to load progress', e);
		return { unlocked: 1, completed: {} };
	}
};

const saveProgress = (kidId: string, progress: Progress) => {
	if (typeof window === 'undefined') return;
	try {
		const key = getProgressKey(kidId);
		localStorage.setItem(key, JSON.stringify(progress));
	} catch (e) {
		console.error('Failed to save progress', e);
	}
};

// Game session logging helper
async function logGameSession(kidId: string, payload: any) {
	try {
		if (!kidId) return;
		const { collection, addDoc, serverTimestamp, getFirestore } = await import('firebase/firestore');
		const db = getFirestore();

		await addDoc(collection(db, 'students', kidId, 'gameSessions'), {
			...payload,
			createdAt: serverTimestamp(),
			startedAt: payload.startedAt ?? serverTimestamp(),
			endedAt: payload.endedAt ?? serverTimestamp(),
		});
	} catch {
		// fail silently
	}
}

// Balloon factory using level config
const makeBalloon = (id: number, letters: string[], speedMin: number, speedMax: number): Balloon => ({
	id,
	letter: choice(letters),
	x: rand(10, 85),
	y: rand(105, 180),
	speed: rand(speedMin, speedMax),
	wobblePhase: rand(0, Math.PI * 2),
});

// Non-overlapping spawn - prevent balloons from stacking
const MIN_DX = 12; // minimum horizontal gap (percent)
const MIN_DY = 16; // minimum vertical gap (percent)

const makeBalloonNoOverlap = (id: number, letters: string[], speedMin: number, speedMax: number, existingBalloons: Balloon[]): Balloon => {
	// Try up to 25 times to find non-overlapping position
	for (let attempt = 0; attempt < 25; attempt++) {
		const x = rand(10, 90);
		const y = rand(110, 170);
		
		// Check if position is far enough from all existing balloons
		const overlaps = existingBalloons.some(b => {
			const dx = Math.abs(x - b.x);
			const dy = Math.abs(y - b.y);
			return dx < MIN_DX && dy < MIN_DY;
		});
		
		if (!overlaps) {
			return {
				id,
				letter: choice(letters),
				x,
				y,
				speed: rand(speedMin, speedMax),
				wobblePhase: rand(0, Math.PI * 2),
			};
		}
	}
	
	// Fallback: use evenly spaced pattern
	const count = existingBalloons.length + 1;
	const spacing = count > 1 ? 76 / (count - 1) : 0;
	const x = 12 + (id % count) * spacing;
	const y = 110 + ((id % 3) * 18);
	
	return {
		id,
		letter: choice(letters),
		x,
		y,
		speed: rand(speedMin, speedMax),
		wobblePhase: rand(0, Math.PI * 2),
	};
};

// Ensure desired count of target balloons exist (answer-aware spawning)
const ensureTargetCount = (balloons: Balloon[], target: string, desiredCount: number): Balloon[] => {
	// Count non-popping balloons with target letter
	const currentCount = balloons.filter(b => b.letter === target && !b.isPopping).length;
	if (currentCount >= desiredCount) return balloons;
	
	const needed = desiredCount - currentCount;
	
	// Get non-popping balloons that aren't already the target
	const candidates = balloons.filter(b => b.letter !== target && !b.isPopping);
	
	// Prefer visible balloons (on-screen between -10 and 95%)
	const visibleCandidates = candidates.filter(b => b.y >= -10 && b.y <= 95);
	const toConvert = visibleCandidates.length >= needed ? visibleCandidates.slice(0, needed) : 
		[...visibleCandidates, ...candidates.slice(0, needed - visibleCandidates.length)];
	
	// Convert selected balloons to target
	const convertIds = new Set(toConvert.map(b => b.id));
	return balloons.map(b => convertIds.has(b.id) ? { ...b, letter: target } : b);
};

const BALLOON_COLORS = [
	'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
	'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
	'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
	'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
	'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
	'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
];

// Web Audio pop sound generator (no files needed)
const playPopSound = () => {
	try {
		const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
		if (!AudioContext) return;

		const ctx = new AudioContext();
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();

		osc.connect(gain);
		gain.connect(ctx.destination);

		// Pop sound: quick frequency drop with envelope
		osc.frequency.setValueAtTime(320, ctx.currentTime);
		osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.08);

		// Volume envelope: quick attack, fast decay
		gain.gain.setValueAtTime(0.12, ctx.currentTime); // Low volume
		gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

		osc.type = 'sine';
		osc.start(ctx.currentTime);
		osc.stop(ctx.currentTime + 0.12);

		// Clean up
		setTimeout(() => {
			try { ctx.close(); } catch (e) {/* ignore */}
		}, 200);
	} catch (e) {
		// Safari may need user gesture first time, but balloon click qualifies
		console.debug('Audio context blocked or unavailable', e);
	}
};

// Phonics sound mapping (grapheme → speech label)
const SOUND_MAP: Record<string, string> = {
	// Single letters
	s: 'sss', a: 'a', t: 't', i: 'ih', p: 'p', n: 'nn',
	c: 'k', k: 'k', e: 'eh', h: 'h', r: 'rr', m: 'mm',
	d: 'd', g: 'g', o: 'oh', u: 'uh', l: 'll', f: 'ff', b: 'b',
	j: 'j', z: 'z', w: 'w', v: 'v', y: 'y', x: 'ks',
	// Digraphs
	sh: 'sh', ch: 'ch', th: 'th', ng: 'ng', qu: 'kw',
	// Long vowels
	ai: 'ay', oa: 'oh', ie: 'eye', ee: 'ee', oo: 'oo', ou: 'ow', oi: 'oy', ue: 'yoo',
	// Bossy-r
	or: 'or', er: 'er', ar: 'ar',
};

// Audio context singleton
let audioContextRef: AudioContext | null = null;
const ensureAudioContext = () => {
	if (!audioContextRef) {
		const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
		if (AudioContext) {
			audioContextRef = new AudioContext();
		}
	}
	return audioContextRef;
};

// Generic tone player
const playTone = (params: { freq: number; durMs: number; type?: OscillatorType; gain?: number }) => {
	try {
		const ctx = ensureAudioContext();
		if (!ctx) return;

		const osc = ctx.createOscillator();
		const gainNode = ctx.createGain();

		osc.connect(gainNode);
		gainNode.connect(ctx.destination);

		osc.frequency.value = params.freq;
		osc.type = params.type || 'sine';
		gainNode.gain.value = params.gain || 0.1;

		osc.start(ctx.currentTime);
		osc.stop(ctx.currentTime + params.durMs / 1000);
	} catch (e) {
		console.debug('Audio error', e);
	}
};

// Success ding
const playCorrectDing = () => {
	playTone({ freq: 800, durMs: 120, gain: 0.08 });
	setTimeout(() => playTone({ freq: 1000, durMs: 100, gain: 0.06 }), 60);
};

// Wrong oops
const playWrongOops = () => {
	playTone({ freq: 200, durMs: 150, type: 'square', gain: 0.07 });
};

// Level complete celebration
const playTaDa = () => {
	const notes = [523, 659, 784, 1047]; // C-E-G-C arpeggio
	notes.forEach((freq, i) => {
		setTimeout(() => playTone({ freq, durMs: 200, gain: 0.09 }), i * 80);
	});
};

// Phonics target cue
const playTargetCue = (target: string) => {
	// Play a simple beep
	playTone({ freq: 600, durMs: 150, gain: 0.08 });
	
	// Optionally speak the sound
	if (typeof window !== 'undefined' && 'speechSynthesis' in window && !prefersReducedMotion) {
		try {
			const utterance = new SpeechSynthesisUtterance(SOUND_MAP[target] || target);
			utterance.volume = 0.3;
			utterance.rate = 0.9;
			utterance.pitch = 1.1;
			setTimeout(() => window.speechSynthesis.speak(utterance), 200);
		} catch (e) {
			console.debug('Speech synthesis error', e);
		}
	}
};

const KidsBalloonPop: React.FC = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const kidId = searchParams.get('kidId') || '';
	const levelParam = searchParams.get('level');
	const currentLevelId = levelParam ? parseInt(levelParam, 10) : null;

	// Load progress from localStorage
	const [progress, setProgress] = useState<Progress>(() => loadProgress(kidId));

	// Get current level config
	const currentLevel = currentLevelId ? JOLLY_LEVELS.find(l => l.id === currentLevelId) : null;

	// Helper to navigate with kidId preserved
	const navigateWithKid = useCallback((path: string) => {
		const params = new URLSearchParams();
		if (kidId) params.set('kidId', kidId);
		navigate(`${path}?${params.toString()}`);
	}, [kidId, navigate]);

	const goToLevels = useCallback(() => {
		navigateWithKid('/kids/games/phonics/balloon-pop');
	}, [navigateWithKid]);

	const playLevel = useCallback(async (levelId: number) => {
		// Check if level is unlocked
		if (levelId > progress.unlocked) {
			console.warn('Level not unlocked yet');
			return;
		}

		// CRITICAL: Request fullscreen INSIDE the click handler (user gesture)
		setFullscreenMode(true);
		setFeedback(null);
		setFsBlocked(false);

		// Wait a frame for container to render
		await new Promise(resolve => setTimeout(resolve, 50));

		// Attempt real fullscreen with Safari fallbacks
		try {
			const elem = containerRef.current;
			if (!elem) {
				console.warn('Container not ready');
				return;
			}

			if (elem.requestFullscreen) {
				await elem.requestFullscreen();
			} else if ((elem as any).webkitRequestFullscreen) {
				await (elem as any).webkitRequestFullscreen();
			} else if ((elem as any).webkitEnterFullscreen) {
				await (elem as any).webkitEnterFullscreen();
			}
		} catch (e) {
			console.warn('Fullscreen blocked or unavailable', e);
			setFsBlocked(true);
			setTimeout(() => setFsBlocked(false), 4000);
		}

		// Update URL to reflect level
		const params = new URLSearchParams();
		if (kidId) params.set('kidId', kidId);
		params.set('level', levelId.toString());
		navigate(`/kids/games/phonics/balloon-pop?${params.toString()}`, { replace: true });

		// Initialize game with level config (but don't start motion yet)
		const level = JOLLY_LEVELS.find(l => l.id === levelId);
		if (level) {
			// Create non-overlapping initial balloons
			const initialBalloons: Balloon[] = [];
			for (let i = 0; i < level.balloonCount; i++) {
				initialBalloons.push(makeBalloonNoOverlap(i, level.letters, level.speedMin, level.speedMax, initialBalloons));
			}
			
			const targetLetter = choice(level.letters);
			const desiredTargetCount = Math.min(2, level.balloonCount, level.letters.length);
			setBalloons(ensureTargetCount(initialBalloons, targetLetter, desiredTargetCount));
			setTarget(targetLetter);
			setScore(0);
			setLives(3);
			setCorrectCount(0);
			setWrongCount(0);
			setRunning(false);
			setHasStarted(false);
			setLevelComplete(false);
			lastCorrectPopRef.current = Date.now();
		}
	}, [kidId, navigate, progress.unlocked]);

	const [balloons, setBalloons] = useState<Balloon[]>([]);
	const [running, setRunning] = useState(false);
	const [hasStarted, setHasStarted] = useState(false);
	const [fullscreenMode, setFullscreenMode] = useState(false);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [fsBlocked, setFsBlocked] = useState(false);
	const [target, setTarget] = useState<string>('');
	const [score, setScore] = useState(0);
	const [lives, setLives] = useState(3);
	const [correctCount, setCorrectCount] = useState(0);
	const [wrongCount, setWrongCount] = useState(0);
	const [levelComplete, setLevelComplete] = useState(false);
	const [feedback, setFeedback] = useState<string | null>(null);
	const [targetBounce, setTargetBounce] = useState(false);
	const [hintUntil, setHintUntil] = useState<number>(0);
	const [sparkles, setSparkles] = useState<Array<{id: number; x: number; y: number; until: number}>>([]);
	const [shakeUntil, setShakeUntil] = useState<number>(0);
	const rafRef = useRef<number | null>(null);
	const lastTimeRef = useRef<number | null>(null);
	const lastCorrectPopRef = useRef<number>(Date.now());
	const containerRef = useRef<HTMLDivElement | null>(null);
	const startTimeRef = useRef<number>(Date.now());
	const confettiGeneratedRef = useRef<boolean>(false);
	// Session logging refs
	const sessionStartMsRef = useRef<number | null>(null);
	const sessionLoggedRef = useRef(false);

	// Enter fullscreen
	const enterFullscreen = useCallback(async () => {
		setFullscreenMode(true);
		setRunning(true);
		setFeedback(null);
		setFsBlocked(false);

		// Attempt real fullscreen with Safari fallbacks
		try {
			const elem = containerRef.current;
			if (!elem) return;

			if (elem.requestFullscreen) {
				await elem.requestFullscreen();
			} else if ((elem as any).webkitRequestFullscreen) {
				// Safari iOS/Mac fallback
				await (elem as any).webkitRequestFullscreen();
			} else if ((elem as any).webkitEnterFullscreen) {
				// Older Safari fallback
				await (elem as any).webkitEnterFullscreen();
			}
		} catch (e) {
			console.warn('Fullscreen blocked or unavailable', e);
			setFsBlocked(true);
			setTimeout(() => setFsBlocked(false), 4000);
		}
	}, []);

	// Exit fullscreen
	const exitFullscreen = useCallback(() => {
		// Log session if exiting mid-game
		if (kidId && sessionStartMsRef.current && !sessionLoggedRef.current && currentLevel && hasStarted) {
			sessionLoggedRef.current = true;
			const endMs = Date.now();
			const durationSec = Math.round((endMs - sessionStartMsRef.current) / 1000);
			const attempts = score + wrongCount;
			const accuracy = attempts > 0 ? score / attempts : 0;
			
			const skills = ['letter_sounds'];
			const digraphSet = new Set(['sh','ch','th','ai','oa','ee','ie','oi','ou','ue','qu','ng','oo','er','ar']);
			const hasDigraphs = currentLevel.letters.some(g => g.length > 1 || digraphSet.has(g));
			if (hasDigraphs) skills.push('digraphs_advanced');

			logGameSession(kidId, {
				gameId: 'balloon_pop',
				mode: 'phonics',
				level: currentLevel.id,
				skills,
				graphemes: currentLevel.letters,
				attempts,
				correct: score,
				wrong: wrongCount,
				accuracy,
				durationSec,
			});
		}

		setFullscreenMode(false);
		setRunning(false);
		setHasStarted(false);

		// Exit real fullscreen if active
		try {
			if (document.exitFullscreen) {
				document.exitFullscreen().catch(() => {/* ignore */});
			} else if ((document as any).webkitExitFullscreen) {
				(document as any).webkitExitFullscreen();
			}
		} catch (e) {
			// ignore
		}

		// Navigate back to levels
		goToLevels();
	}, [goToLevels, kidId, currentLevel, hasStarted, score, wrongCount]);

	// Listen for fullscreen changes (user presses Esc, etc.)
	useEffect(() => {
		const handleFSChange = () => {
			const isFull = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
			setIsFullscreen(isFull);

			// If user exits fullscreen via Esc, return to levels page
			if (!isFull && fullscreenMode) {
				setFullscreenMode(false);
				setRunning(false);
				goToLevels();
			}
		};

		document.addEventListener('fullscreenchange', handleFSChange);
		document.addEventListener('webkitfullscreenchange', handleFSChange);

		return () => {
			document.removeEventListener('fullscreenchange', handleFSChange);
			document.removeEventListener('webkitfullscreenchange', handleFSChange);
		};
	}, [fullscreenMode, goToLevels]);

	// Play target phonics cue when target changes
	useEffect(() => {
		if (hasStarted && fullscreenMode && target && !levelComplete && lives > 0) {
			playTargetCue(target);
		}
	}, [target, hasStarted, fullscreenMode, levelComplete, lives]);

	// Lock body scroll when in fullscreen mode
	useEffect(() => {
		if (fullscreenMode) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	}, [fullscreenMode]);

	// Respawn balloon by id with non-overlapping logic
	const respawn = useCallback((id: number) => {
		if (!currentLevel) return;
		setBalloons(prev => {
			const others = prev.filter(b => b.id !== id);
			const newBalloon = makeBalloonNoOverlap(id, currentLevel.letters, currentLevel.speedMin, currentLevel.speedMax, others);
			const updated = prev.map(b => b.id === id ? newBalloon : b);
			const desiredTargetCount = Math.min(2, currentLevel.balloonCount, currentLevel.letters.length);
			return ensureTargetCount(updated, target, desiredTargetCount);
		});
	}, [currentLevel, target]);

	// Choose a new target avoiding repeat and ensure it exists on screen
	const pickNewTarget = useCallback((prev?: string) => {
		if (!currentLevel) return prev || '';
		if (currentLevel.letters.length === 1) return currentLevel.letters[0];
		let next = choice(currentLevel.letters);
		let attempts = 0;
		while (next === prev && attempts < 8) {
			next = choice(currentLevel.letters);
			attempts += 1;
		}
		// Ensure 2 target balloons exist
		const desiredTargetCount = Math.min(2, currentLevel.balloonCount, currentLevel.letters.length);
		setBalloons(prevBalloons => ensureTargetCount(prevBalloons, next, desiredTargetCount));
		lastCorrectPopRef.current = Date.now();
		return next;
	}, [currentLevel]);

	// Handle level completion
	const completeLevel = useCallback(() => {
		if (!currentLevel) return;

		setRunning(false);
		setLevelComplete(true);
		confettiGeneratedRef.current = false; // Reset for confetti generation

		// Play celebration sound
		playTaDa();
		
		// Speak celebration
		if (typeof window !== 'undefined' && 'speechSynthesis' in window && !prefersReducedMotion) {
			setTimeout(() => {
				try {
					const utterance = new SpeechSynthesisUtterance('Level complete!');
					utterance.volume = 0.4;
					utterance.rate = 1.0;
					window.speechSynthesis.speak(utterance);
				} catch (e) {
					console.debug('Speech error', e);
				}
			}, 400);
		}

		// Calculate stars based on wrong clicks
		const stars = wrongCount === 0 ? 3 : wrongCount === 1 ? 2 : 1;

		// Update progress
		const newProgress: Progress = {
			unlocked: Math.min(7, Math.max(progress.unlocked, currentLevel.id + 1)),
			completed: {
				...progress.completed,
				[currentLevel.id]: {
					stars,
					bestScore: Math.max(progress.completed[currentLevel.id]?.bestScore || 0, score),
				},
			},
		};
		setProgress(newProgress);
		saveProgress(kidId, newProgress);
	}, [currentLevel, wrongCount, score, progress, kidId]);

	// Play next level in fullscreen
	const playNextLevel = useCallback(() => {
		if (!currentLevel || currentLevel.id >= 7) return;
		const nextLevelId = currentLevel.id + 1;
		const nextLevel = JOLLY_LEVELS.find(l => l.id === nextLevelId);
		if (!nextLevel) return;

		// Reset state for new level with non-overlapping balloons
		const initialBalloons: Balloon[] = [];
		for (let i = 0; i < nextLevel.balloonCount; i++) {
			initialBalloons.push(makeBalloonNoOverlap(i, nextLevel.letters, nextLevel.speedMin, nextLevel.speedMax, initialBalloons));
		}
		
		const targetLetter = choice(nextLevel.letters);
		const desiredTargetCount = Math.min(2, nextLevel.balloonCount, nextLevel.letters.length);
		setBalloons(ensureTargetCount(initialBalloons, targetLetter, desiredTargetCount));
		setTarget(targetLetter);
		lastCorrectPopRef.current = Date.now();
		setScore(0);
		setLives(3);
		setCorrectCount(0);
		setWrongCount(0);
		setLevelComplete(false);
		setHasStarted(false);

		// Update URL
		const params = new URLSearchParams();
		if (kidId) params.set('kidId', kidId);
		params.set('level', nextLevelId.toString());
		navigate(`/kids/games/phonics/balloon-pop?${params.toString()}`, { replace: true });
	}, [currentLevel, kidId, navigate]);

	// Replay current level
	const replayLevel = useCallback(() => {
		if (!currentLevel) return;
		
		// Create non-overlapping initial balloons
		const initialBalloons: Balloon[] = [];
		for (let i = 0; i < currentLevel.balloonCount; i++) {
			initialBalloons.push(makeBalloonNoOverlap(i, currentLevel.letters, currentLevel.speedMin, currentLevel.speedMax, initialBalloons));
		}
		
		const targetLetter = choice(currentLevel.letters);
		const desiredTargetCount = Math.min(2, currentLevel.balloonCount, currentLevel.letters.length);
		setBalloons(ensureTargetCount(initialBalloons, targetLetter, desiredTargetCount));
		setTarget(targetLetter);
		lastCorrectPopRef.current = Date.now();
		setScore(0);
		setLives(3);
		setCorrectCount(0);
		setWrongCount(0);
		setLevelComplete(false);
		setHasStarted(false);
	}, [currentLevel]);

	// Handle balloon click with burst + sound
	const handlePop = useCallback((id: number) => {
		const b = balloons.find(x => x.id === id);
		if (!b || b.isPopping) return;

		playPopSound();
		setBalloons(prev => prev.map(x => (x.id === id ? { ...x, isPopping: true, popAt: Date.now() } : x)));

		setTimeout(() => {
			if (b.letter === target) {
				// Correct balloon - play ding + sparkle
				playCorrectDing();
				lastCorrectPopRef.current = Date.now();
				
				// Add sparkle effect at balloon position
				if (containerRef.current) {
					const rect = containerRef.current.getBoundingClientRect();
					const sparkleX = (b.x / 100) * rect.width;
					const sparkleY = (Math.max(5, Math.min(85, b.y)) / 100) * rect.height;
					setSparkles(prev => [...prev, { id: Date.now(), x: sparkleX, y: sparkleY, until: Date.now() + 300 }]);
				}
				
				setScore(s => s + 1);
				setCorrectCount(c => {
					const newCount = c + 1;
					if (newCount >= TARGET_CORRECT) {
						// Level complete!
						setTimeout(() => completeLevel(), 300);
					}
					return newCount;
				});
				setTarget(prev => pickNewTarget(prev));
			} else {
				// Wrong balloon - play oops + shake target button
				playWrongOops();
				setShakeUntil(Date.now() + 250);
				setWrongCount(w => w + 1);
				setLives(l => l - 1);
				setFeedback('Try again!');
				setTimeout(() => setFeedback(null), 800);
			}
			
			respawn(id);
		}, 220);
	}, [balloons, target, completeLevel, pickNewTarget, respawn]);

	// Handle target button click (focus cue bounce)
	const handleTargetBounce = () => {
		setTargetBounce(true);
		setTimeout(() => setTargetBounce(false), 400);
	};

	// Authoritative animation loop - smooth float with stable balloon count and hint pulse
	useEffect(() => {
		if (!hasStarted || !fullscreenMode || !currentLevel || levelComplete || lives <= 0) {
			if (rafRef.current) {
				cancelAnimationFrame(rafRef.current);
				rafRef.current = null;
			}
			lastTimeRef.current = null;
			return;
		}

		const desiredTargetCount = Math.min(2, currentLevel.balloonCount, currentLevel.letters.length);

		// Even with reduced motion, balloons should move (just slower/smoother)
		if (prefersReducedMotion) {
			// Slower discrete updates for reduced motion
			const interval = setInterval(() => {
				const now = Date.now();
				
				// Check if hint should be shown (4 seconds since last correct pop)
				if (now - lastCorrectPopRef.current > 4000) {
					setHintUntil(now + 800);
					lastCorrectPopRef.current = now; // Reset to avoid constant pulsing
				}
				
				setBalloons(prev => {
					let updated = prev.map(b => {
						if (b.isPopping) return b; // Don't move popping balloons
						let y = b.y - 3; // Slower constant speed
						if (y < -25) {
							// Respawn below screen with non-overlapping logic
							const others = prev.filter(x => x.id !== b.id);
							return makeBalloonNoOverlap(b.id, currentLevel.letters, currentLevel.speedMin, currentLevel.speedMax, others);
						}
						return { ...b, y };
					});
					
					// Ensure stable balloon count
					const active = updated.filter(b => !b.isPopping);
					if (active.length < currentLevel.balloonCount) {
						const missing = currentLevel.balloonCount - active.length;
						for (let i = 0; i < missing; i++) {
							const newId = Math.max(...updated.map(b => b.id), -1) + 1;
							updated.push(makeBalloonNoOverlap(newId, currentLevel.letters, currentLevel.speedMin, currentLevel.speedMax, updated));
						}
					}
					
					return ensureTargetCount(updated, target, desiredTargetCount);
				});
			}, 120); // Update every 120ms instead of every frame
			return () => clearInterval(interval);
		}

		// Normal smooth RAF animation loop with dt clamping
		const step = (ts: number) => {
			if (!lastTimeRef.current) lastTimeRef.current = ts;
			const rawDtSec = (ts - lastTimeRef.current) / 1000;
			const dtSec = Math.min(0.033, rawDtSec); // Clamp to ~33ms max to prevent jumps
			lastTimeRef.current = ts;
			const now = Date.now();

			// Check if hint should be shown (4 seconds since last correct pop)
			if (now - lastCorrectPopRef.current > 4000) {
				setHintUntil(now + 800);
				lastCorrectPopRef.current = now; // Reset to avoid constant pulsing
			}

			setBalloons(prev => {
				let updated = prev.map(b => {
					if (b.isPopping) return b; // Don't move popping balloons
					let y = b.y - b.speed * dtSec; // Move upward smoothly
					if (y < -25) {
						// Respawn below screen with non-overlapping logic
						const others = prev.filter(x => x.id !== b.id);
						return makeBalloonNoOverlap(b.id, currentLevel.letters, currentLevel.speedMin, currentLevel.speedMax, others);
					}
					return { ...b, y };
				});
				
				// Ensure stable balloon count - immediately spawn missing balloons
				const active = updated.filter(b => !b.isPopping);
				if (active.length < currentLevel.balloonCount) {
					const missing = currentLevel.balloonCount - active.length;
					for (let i = 0; i < missing; i++) {
						const newId = Math.max(...updated.map(b => b.id), -1) + 1;
						updated.push(makeBalloonNoOverlap(newId, currentLevel.letters, currentLevel.speedMin, currentLevel.speedMax, updated));
					}
				}
				
				return ensureTargetCount(updated, target, desiredTargetCount);
			});

			rafRef.current = requestAnimationFrame(step);
		};

		rafRef.current = requestAnimationFrame(step);
		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
			lastTimeRef.current = null;
		};
	}, [hasStarted, fullscreenMode, currentLevel, levelComplete, lives, target]);

	// If lives reach 0 stop game
	useEffect(() => {
		if (lives <= 0) {
			setRunning(false);
		}
	}, [lives]);

	// Landing page (Choose Levels screen)
	if (!fullscreenMode) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-start py-8 px-4" style={{background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)'}}>
				<style>{`
					.level-card { padding:18px; border-radius:16px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); cursor:pointer; transition:all 0.2s ease; }
					.level-card:hover:not(.locked) { background:rgba(255,255,255,0.08); transform:translateY(-2px); }
					.level-card.locked { opacity:0.4; cursor:not-allowed; }
					@media (prefers-reduced-motion: reduce) { .level-card { transition:none !important; transform:none !important; } }
				`}</style>

				{/* Back to Phonics Library */}
				<Link
					to={kidId ? `/kids/games/phonics?kidId=${encodeURIComponent(kidId)}` : '/kids/games/phonics'}
					className="absolute top-5 right-5 px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 transition-all duration-200 font-semibold shadow-lg text-white"
					style={{ zIndex: 50 }}
				>
					← Back to Phonics Library
				</Link>

				<div className="w-full max-w-6xl mx-auto text-center mb-8">
					<h1 className="text-5xl font-bold text-white">Choose Level</h1>
					<p className="text-white/70 mt-2">Pick a Jolly Phonics level to play Balloon Pop</p>

					{!kidId && (
						<div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-500/40 rounded-lg max-w-md mx-auto">
							<p className="text-yellow-200 font-semibold mb-3">⚠️ No child selected</p>
							<p className="text-yellow-100/80 text-sm mb-4">Please go back and choose a child to track progress.</p>
							<Link
								to="/parent"
								className="inline-block px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors"
							>
								← Back to Parent Dashboard
							</Link>
						</div>
					)}
				</div>

				<div className="w-full max-w-3xl mx-auto grid grid-cols-1 gap-4">
					{JOLLY_LEVELS.map(level => {
						const locked = level.id > progress.unlocked;
						const completed = progress.completed[level.id];
						const stars = completed ? '⭐'.repeat(completed.stars) : '';
						return (
							<button
								key={level.id}
								type="button"
								aria-label={`Level ${level.id} ${level.title}`}
								onClick={() => { if (!locked) playLevel(level.id); }}
								className={`level-card ${locked ? 'locked' : ''}`}
							>
								<div className="flex flex-col gap-3">
									<div className="flex items-center justify-between">
										<div className="text-left flex-1">
											<div className="flex items-center gap-2">
												<div className="text-2xl font-bold text-white">{level.title}</div>
												{completed && <div className="text-base">{stars}</div>}
											</div>
											<div className="text-sm text-white/80 mt-2">{level.letters.join(' ')}</div>
											{completed && (
												<div className="text-xs text-green-300 mt-1 font-semibold">Completed • Best: {completed.bestScore}</div>
											)}
										</div>
										<div className="text-sm text-white/60 font-semibold">
											{locked ? '🔒 Locked' : '▶ Play'}
										</div>
									</div>
								</div>
							</button>
						);
					})}
				</div>
			</div>
		);
	}

	// Fullscreen game overlay with Premium Sunny Sky
	return (
		<div ref={containerRef} className="fixed inset-0 z-[9999] overflow-hidden" style={{background: 'linear-gradient(180deg, #87CEEB 0%, #B0E8FF 40%, #E0F6FF 70%, #F0F9FF 100%)', width: '100vw', height: '100vh'}}>
			<style>{`
				@keyframes hintPulse {
					0%, 100% { transform: translate(-50%, -50%) scale(1); box-shadow: 0 0 0 rgba(251, 191, 36, 0); }
					50% { transform: translate(-50%, -50%) scale(1.15); box-shadow: 0 0 40px rgba(251, 191, 36, 0.8), 0 0 80px rgba(251, 191, 36, 0.4); }
				}
				@keyframes targetShake {
					0%, 100% { transform: translateX(-50%) translateY(0); }
					25% { transform: translateX(-50%) translateY(-5px) rotate(-3deg); }
					75% { transform: translateX(-50%) translateY(-5px) rotate(3deg); }
				}
				@keyframes sparkleFade {
					0% { opacity: 1; transform: translate(-50%, -50%) scale(0.5); }
					50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
					100% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
				}
				@keyframes confettiFall {
					0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
					100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
				}
				@keyframes cloudDrift {
					0% { transform: translateX(-15vw); }
					100% { transform: translateX(115vw); }
				}
				@keyframes cloudDrift2 {
					0% { transform: translateX(-20vw); }
					100% { transform: translateX(120vw); }
				}
				@keyframes cloudDrift3 {
					0% { transform: translateX(-10vw) translateY(0); }
					50% { transform: translateX(55vw) translateY(-8px); }
					100% { transform: translateX(120vw) translateY(0); }
				}
				@keyframes birdFly {
					0% { transform: translateX(-60px) translateY(0) rotateY(0deg); }
					25% { transform: translateX(20vw) translateY(-15px) rotateY(0deg); }
					50% { transform: translateX(45vw) translateY(-5px) rotateY(180deg); }
					75% { transform: translateX(70vw) translateY(-20px) rotateY(180deg); }
					100% { transform: translateX(110vw) translateY(5px) rotateY(180deg); }
				}
				@keyframes birdFly2 {
					0% { transform: translateX(-80px) translateY(10px); }
					40% { transform: translateX(35vw) translateY(-10px); }
					100% { transform: translateX(115vw) translateY(15px); }
				}
				@keyframes sunPulse {
					0%, 100% { transform: scale(1); opacity: 0.95; }
					50% { transform: scale(1.08); opacity: 1; }
				}
				@keyframes sunRays {
					0%, 100% { transform: rotate(0deg); }
					100% { transform: rotate(360deg); }
				}
				@keyframes targetBounce {
					0%, 100% { transform: translate(-50%, 0) scale(1); }
					50% { transform: translate(-50%, -12px) scale(1.05); }
				}
				@keyframes targetGlow {
					0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.6), 0 0 40px rgba(251, 191, 36, 0.4), 0 8px 24px rgba(0,0,0,0.3); }
					50% { box-shadow: 0 0 35px rgba(251, 191, 36, 0.9), 0 0 70px rgba(251, 191, 36, 0.6), 0 8px 24px rgba(0,0,0,0.3); }
				}
				@keyframes targetBounceExtra {
					0%, 100% { transform: translate(-50%, 0) scale(1); }
					25% { transform: translate(-50%, -18px) scale(1.1); }
					50% { transform: translate(-50%, -8px) scale(1.08); }
					75% { transform: translate(-50%, -14px) scale(1.09); }
				}
				@keyframes balloonWobble {
					0%, 100% { transform: translateX(0); }
					25% { transform: translateX(3px); }
					75% { transform: translateX(-3px); }
				}

				/* Cloud styling */
				.cloud {
					position: absolute;
					background: rgba(255, 255, 255, 0.85);
					border-radius: 100px;
					pointer-events: none;
					filter: blur(1px);
					box-shadow: 0 2px 8px rgba(255,255,255,0.5);
				}
				.cloud::before, .cloud::after {
					content: '';
					position: absolute;
					background: rgba(255, 255, 255, 0.85);
					border-radius: 100%;
					filter: blur(1px);
				}
				.cloud-1 { width: 140px; height: 60px; top: 12%; left: 0; animation: cloudDrift 90s linear infinite; }
				.cloud-1::before { width: 70px; height: 70px; top: -35px; left: 15px; }
				.cloud-1::after { width: 90px; height: 90px; top: -45px; right: 15px; }

				.cloud-2 { width: 120px; height: 50px; top: 28%; left: 0; animation: cloudDrift2 110s linear infinite; animation-delay: -30s; }
				.cloud-2::before { width: 60px; height: 60px; top: -30px; left: 20px; }
				.cloud-2::after { width: 75px; height: 75px; top: -38px; right: 20px; }

				.cloud-3 { width: 100px; height: 45px; top: 55%; left: 0; animation: cloudDrift3 95s ease-in-out infinite; animation-delay: -60s; }
				.cloud-3::before { width: 50px; height: 50px; top: -25px; left: 15px; }
				.cloud-3::after { width: 65px; height: 65px; top: -32px; right: 18px; }

				.cloud-4 { width: 110px; height: 48px; top: 70%; left: 0; animation: cloudDrift 105s linear infinite; animation-delay: -15s; }
				.cloud-4::before { width: 55px; height: 55px; top: -28px; left: 18px; }
				.cloud-4::after { width: 70px; height: 70px; top: -35px; right: 16px; }

				/* Sun with rays */
				.sun {
					position: absolute;
					top: 6%;
					right: 10%;
					width: 100px;
					height: 100px;
					pointer-events: none;
				}
				.sun-core {
					position: absolute;
					inset: 15%;
					border-radius: 50%;
					background: radial-gradient(circle at 35% 35%, #FFF9E6, #FFD700 40%, #FFA500 80%);
					box-shadow: 0 0 40px rgba(255, 215, 0, 0.8), 0 0 80px rgba(255, 215, 0, 0.4);
					animation: sunPulse 6s ease-in-out infinite;
				}
				.sun-rays {
					position: absolute;
					inset: 0;
					animation: sunRays 60s linear infinite;
				}
				.sun-rays::before, .sun-rays::after {
					content: '';
					position: absolute;
					inset: 0;
					background: conic-gradient(from 0deg, 
						transparent 0deg, transparent 10deg,
						rgba(255, 215, 0, 0.15) 12deg, rgba(255, 215, 0, 0.15) 13deg,
						transparent 15deg, transparent 40deg,
						rgba(255, 215, 0, 0.15) 42deg, rgba(255, 215, 0, 0.15) 43deg,
						transparent 45deg, transparent 85deg,
						rgba(255, 215, 0, 0.15) 87deg, rgba(255, 215, 0, 0.15) 88deg,
						transparent 90deg, transparent 130deg,
						rgba(255, 215, 0, 0.15) 132deg, rgba(255, 215, 0, 0.15) 133deg,
						transparent 135deg, transparent 175deg,
						rgba(255, 215, 0, 0.15) 177deg, rgba(255, 215, 0, 0.15) 178deg,
						transparent 180deg
					);
					border-radius: 50%;
				}
				.sun-rays::after {
					transform: rotate(45deg);
				}

				/* Birds */
				.bird {
					position: absolute;
					font-size: 20px;
					pointer-events: none;
					opacity: 0.7;
				}
				.bird-1 { top: 18%; left: 0; animation: birdFly 35s ease-in-out infinite; }
				.bird-2 { top: 35%; left: 0; animation: birdFly2 28s linear infinite; animation-delay: -10s; }
				.bird-3 { top: 48%; left: 0; animation: birdFly 40s ease-in-out infinite; animation-delay: -20s; }

				/* Target button animations */
				.target-button {
					animation: targetBounce 2s ease-in-out infinite, targetGlow 2s ease-in-out infinite;
				}
				.target-button.bounce-extra {
					animation: targetBounceExtra 0.4s ease-out, targetGlow 2s ease-in-out infinite;
				}

				/* Pop burst animation */
				@keyframes popBurst {
					0% { 
						transform: translate(-50%, -50%) scale(1);
						opacity: 1;
					}
					100% { 
						transform: translate(-50%, -50%) scale(3);
						opacity: 0;
					}
				}
				@keyframes popScale {
					0% { transform: translate(-50%, -50%) scale(1); }
					50% { transform: translate(-50%, -50%) scale(0.6); }
					100% { transform: translate(-50%, -50%) scale(0); }
				}
				.burst-particle {
					position: absolute;
					width: 8px;
					height: 8px;
					border-radius: 50%;
					background: radial-gradient(circle, rgba(255,255,255,0.9), rgba(255,215,0,0.6));
					animation: popBurst 0.22s ease-out forwards;
				}

				@media (prefers-reduced-motion: reduce) {
					.cloud, .bird, .sun-core, .sun-rays, .target-button { animation: none !important; }
				}
			`}</style>

			{/* Sunny Sky Elements */}
			<div className="sun">
				<div className="sun-rays" />
				<div className="sun-core" />
			</div>
			<div className="cloud cloud-1" />
			<div className="cloud cloud-2" />
			<div className="cloud cloud-3" />
			<div className="cloud cloud-4" />
			<div className="bird bird-1">🕊️</div>
			<div className="bird bird-2">🐦</div>
			<div className="bird bird-3">🕊️</div>

			{/* Tap to Start overlay */}
			{!hasStarted && !levelComplete && lives > 0 && (
				<div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
					<button
						onClick={() => setHasStarted(true)}
						className="px-16 py-8 bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:from-green-500 hover:via-green-600 hover:to-green-700 text-white text-5xl font-black rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-200 animate-bounce"
						style={{
							animation: 'bounce 1.5s ease-in-out infinite',
							boxShadow: '0 0 60px rgba(34, 197, 94, 0.6), 0 20px 50px rgba(0,0,0,0.5)',
						}}
					>
						🎈 Tap to Start! 🎈
					</button>
				</div>
			)}

			{/* Exit button */}
			<button
				onClick={exitFullscreen}
				className="absolute top-4 right-4 z-50 px-4 py-2 bg-red-500/90 hover:bg-red-600 text-white font-semibold rounded-full shadow-lg backdrop-blur-sm"
			>
				✕ Exit
			</button>

			{/* HUD with backdrop blur */}
			<div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex gap-4 items-center bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full shadow-xl border border-white/50">
				<div className="text-sm font-semibold text-gray-800">{currentLevel?.title || 'Level'}</div>
				<div className="text-sm font-semibold text-gray-800">Score: <span className="font-bold text-green-600">{score}</span></div>
				<div className="text-sm font-semibold text-gray-800">Lives: <span className="font-bold text-red-600">{lives}</span></div>
				<div className="text-sm font-semibold text-gray-800">Progress: <span className="font-bold text-blue-600">{correctCount}/{TARGET_CORRECT}</span></div>
			</div>

			{/* Helper text with Hear Again button */}
			<div className="absolute top-20 left-6 z-30 flex items-center gap-3">
				<div className="text-white/70 text-sm font-medium backdrop-blur-sm bg-black/10 px-3 py-1.5 rounded-lg">
					👆 Tap the balloon with letter: <span className="font-bold text-white text-lg">{target}</span>
				</div>
				<button
					onClick={() => playTargetCue(target)}
					className="px-3 py-1.5 bg-blue-500/90 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-lg backdrop-blur-sm transition-all"
					style={{ touchAction: 'manipulation' }}
				>
					🔊 Hear Again
				</button>
			</div>

			{/* Fullscreen blocked toast */}
			{fsBlocked && (
				<div className="absolute top-20 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg z-50">
					Tap fullscreen icon / allow fullscreen
				</div>
			)}

			{/* Sparkle effects */}
			{sparkles.map(sparkle => (
				<div
					key={sparkle.id}
					className="absolute pointer-events-none z-50"
					style={{
						left: sparkle.x,
						top: sparkle.y,
						width: 60,
						height: 60,
						background: 'radial-gradient(circle, rgba(255,223,0,0.9) 0%, rgba(255,193,7,0.6) 40%, transparent 70%)',
						borderRadius: '50%',
						animation: 'sparkleFade 0.3s ease-out forwards',
					}}
				/>
			))}

			{/* Game area - balloons with safe bottom zone */}
			<div className="absolute inset-0 flex items-center justify-center" style={{paddingBottom: 150, paddingTop: 100}}>
				{balloons.map(b => {
					// Calculate wobble offset (horizontal sway)
					const now = Date.now();
					const elapsed = (now - startTimeRef.current) * 0.001;
					const wobbleOffset = Math.sin((elapsed + (b.wobblePhase || 0)) * 2) * 10;
					
					// Check if this balloon should show hint pulse
					const shouldPulse = b.letter === target && !b.isPopping && now < hintUntil;
					
					// If popping, show burst particles
					if (b.isPopping) {
						const particles = Array.from({ length: 10 }, (_, i) => {
							const angle = (i / 10) * Math.PI * 2;
							const distance = 25;
							const xOffset = Math.cos(angle) * distance;
							const yOffset = Math.sin(angle) * distance;
							return (
								<div
									key={i}
									className="burst-particle"
									style={{
										left: '50%',
										top: '50%',
										transform: `translate(calc(-50% + ${xOffset}px), calc(-50% + ${yOffset}px))`,
									}}
								/>
							);
						});

						return (
							<div
								key={b.id}
								className="absolute"
								style={{
									left: `calc(${b.x}% + ${wobbleOffset}px)`,
									top: `${Math.max(5, Math.min(85, b.y))}%`,
									width: 95,
									height: 115,
									pointerEvents: 'none',
									zIndex: 25,
								}}
							>
								{particles}
							</div>
						);
					}
					
					// Normal balloon with shine, knot, and string
					return (
						<button
							key={b.id}
							onClick={() => { if (lives > 0 && hasStarted && !b.isPopping) handlePop(b.id); }}
							aria-label={`Balloon ${b.letter}`}
							className="absolute focus:outline-none focus:ring-4 focus:ring-yellow-400"
							style={{
								left: `${b.x}%`,
								top: `${Math.max(5, Math.min(85, b.y))}%`,
								transform: `translate3d(${wobbleOffset}px, -50%, 0) translateX(-50%)`,
								width: 95,
								height: 140,
								zIndex: 20,
								background: 'transparent',
								border: 'none',
								cursor: 'pointer',
								padding: 8,
								willChange: 'transform',
								animation: shouldPulse ? 'hintPulse 0.8s ease-in-out' : 'none',
								touchAction: 'manipulation',
								userSelect: 'none',
								WebkitUserSelect: 'none',
							}}
						>
							{/* String - thin line from knot downward */}
							<div
								style={{
									position: 'absolute',
									left: '50%',
									bottom: 0,
									width: 2,
									height: 25,
									background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.1))',
									transform: 'translateX(-50%)',
									borderRadius: '1px',
								}}
							/>

							{/* Balloon body */}
							<div
								style={{
									position: 'absolute',
									left: '50%',
									top: 0,
									transform: 'translateX(-50%)',
									width: 95,
									height: 115,
									borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
									background: BALLOON_COLORS[b.id % BALLOON_COLORS.length],
									boxShadow: '0 12px 35px rgba(0,0,0,0.35), inset 0 -3px 10px rgba(0,0,0,0.2)',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								{/* Shine highlight */}
								<div
									style={{
										position: 'absolute',
										top: '15%',
										left: '20%',
										width: '35%',
										height: '40%',
										borderRadius: '50%',
										background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 40%, transparent 70%)',
										transform: 'rotate(-25deg)',
										pointerEvents: 'none',
									}}
								/>

								{/* Letter */}
								<span
									style={{
										fontSize: b.letter.length > 1 ? 32 : 38,
										fontWeight: 900,
										color: '#fff',
										textShadow: '2px 2px 8px rgba(0,0,0,0.5), 0 0 4px rgba(0,0,0,0.3)',
										zIndex: 1,
									}}
								>
									{b.letter}
								</span>
							</div>

							{/* Knot - small diamond at bottom center of balloon */}
							<div
								style={{
									position: 'absolute',
									left: '50%',
									bottom: 22,
									width: 8,
									height: 10,
									background: 'rgba(0,0,0,0.4)',
									transform: 'translateX(-50%) rotate(45deg)',
									borderRadius: '2px',
								}}
							/>
						</button>
					);
				})}
			</div>

			{/* Big bouncing target button at center-bottom */}
			{lives > 0 && hasStarted && (
				<button
					onClick={handleTargetBounce}
					className={`absolute left-1/2 px-8 py-4 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 rounded-full font-black text-white focus:outline-none focus:ring-4 focus:ring-yellow-500`}
					style={{
						bottom: 24,
						transform: 'translateX(-50%)',
						zIndex: 30,
						pointerEvents: 'auto',
						border: '4px solid rgba(255,255,255,0.9)',
						animation: Date.now() < shakeUntil ? 'targetShake 0.25s ease-in-out' : 
							(targetBounce ? 'targetBounceExtra 0.4s ease-out' : 'targetBounce 2s ease-in-out infinite'),
						touchAction: 'manipulation',
						userSelect: 'none',
						WebkitUserSelect: 'none',
					}}
				>
					<div className="flex items-center gap-3">
						<span className="text-xl opacity-80">POP:</span>
						<span className={`${target.length > 1 ? 'text-5xl' : 'text-6xl'} drop-shadow-lg`}>{target}</span>
					</div>
				</button>
			)}

			{/* Feedback */}
			{feedback && (
				<div className="absolute top-20 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-6 py-3 rounded-full text-lg font-bold shadow-lg z-50">
					{feedback}
				</div>
			)}

			{/* Level Complete overlay */}
			{levelComplete && currentLevel && (() => {
				// Generate confetti once
				if (!confettiGeneratedRef.current) {
					confettiGeneratedRef.current = true;
				}
				
				const confettiPieces = Array.from({ length: 25 }, (_, i) => ({
					id: i,
					left: Math.random() * 100,
					color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'][i % 6],
					delay: Math.random() * 0.5,
					duration: 1.2 + Math.random() * 0.6,
				}));
				
				return (
					<div className="absolute inset-0 bg-gradient-to-br from-purple-600/95 via-pink-500/95 to-orange-500/95 flex flex-col items-center justify-center text-center z-50 backdrop-blur-sm">
						{/* Confetti */}
						{confettiPieces.map(piece => (
							<div
								key={piece.id}
								className="absolute pointer-events-none"
								style={{
									left: `${piece.left}%`,
									top: 0,
									width: 10,
									height: 10,
									backgroundColor: piece.color,
									animation: `confettiFall ${piece.duration}s ease-in forwards`,
									animationDelay: `${piece.delay}s`,
								}}
							/>
						))}
						
						<div className="text-8xl mb-4 animate-bounce">🎉</div>
						<h2 className="text-6xl font-bold text-white mb-2">{currentLevel.title} Complete!</h2>
						<div className="text-7xl mb-4">
							{wrongCount === 0 ? '⭐⭐⭐' : wrongCount === 1 ? '⭐⭐' : '⭐'}
						</div>
						<p className="text-3xl text-white mb-8">Score: <span className="font-bold text-yellow-200">{score}</span></p>
						<div className="flex gap-4 flex-wrap justify-center">
							{currentLevel.id < 7 && currentLevel.id + 1 <= progress.unlocked && (
								<button 
									onClick={playNextLevel} 
									className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-2xl text-2xl font-bold text-white shadow-2xl transform hover:scale-105 transition-all"
									style={{ touchAction: 'manipulation' }}
								>
									➡️ Next Level
								</button>
							)}
							<button 
								onClick={replayLevel} 
								className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl text-2xl font-bold text-white shadow-2xl transform hover:scale-105 transition-all"
								style={{ touchAction: 'manipulation' }}
							>
								🔄 Replay
							</button>
							<button 
								onClick={exitFullscreen} 
								className="px-8 py-4 bg-gray-700 hover:bg-gray-800 rounded-2xl text-2xl font-bold text-white shadow-2xl transform hover:scale-105 transition-all"
								style={{ touchAction: 'manipulation' }}
							>
								⬅️ Back to Levels
							</button>
						</div>
					</div>
				);
			})()}

			{/* Game Over overlay */}
			{lives <= 0 && !levelComplete && (
				<div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-center z-50">
					<h2 className="text-5xl font-bold text-white mb-4">Game Over</h2>
					<p className="text-2xl text-white mb-2">Score: <span className="font-bold text-yellow-300">{score}</span></p>
					<p className="text-xl text-white/80 mb-8">You got {correctCount} out of {TARGET_CORRECT} correct</p>
					<div className="flex gap-4">
						<button 
							onClick={replayLevel} 
							className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-lg font-semibold text-white shadow-lg"
							style={{ touchAction: 'manipulation' }}
						>
							🔄 Try Again
						</button>
						<button 
							onClick={exitFullscreen} 
							className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-xl text-lg font-semibold text-white shadow-lg"
							style={{ touchAction: 'manipulation' }}
						>
							⬅️ Back to Levels
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default KidsBalloonPop;