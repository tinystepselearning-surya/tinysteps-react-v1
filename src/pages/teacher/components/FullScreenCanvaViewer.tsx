import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Button } from '@components/ui/button';
import { X, Maximize, Minimize } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { callFunction } from '../../../lib/callFunctions';

type ViolationType =
  | 'RIGHT_CLICK'
  | 'PRINT'
  | 'SAVE'
  | 'VIEW_SOURCE'
  | 'DEVTOOLS'
  | 'CANVA_CONTROLS_BLOCKED'
  | 'COPY'
  | 'CUT'
  | 'SELECT'
  | 'DRAG'
  | 'TAB_HIDDEN'
  | 'WINDOW_BLUR';

interface FullScreenCanvaViewerProps {
  accessId: string;
  teacherId: string;
  teacherName: string;
  onClose: () => void;
  initialLessonTitle?: string;
}

type ResolveLessonAccessViewerResponse = {
  lessonTitle: string;
  canvaEmbedUrl: string;
  expiresAtMs: number;
};

type LessonLoadDebugError = {
  code: string;
  message: string;
  details: unknown;
};

const MAX_VIOLATIONS = 75;
const TOAST_THROTTLE_MS = 2000;

// ── Annotation types ────────────────────────────────────────────────────────
type AnnotateTool = 'pen' | 'star' | 'heart';
type AnnotatePoint = { x: number; y: number };
type AnnotateStroke = {
  points: AnnotatePoint[];
  color: string;
  size: number;
  glitter: boolean;
};
type AnnotateSticker = {
  x: number; y: number;
  emoji: string;
  size: string;
};
type WhiteboardTool = 'pen' | 'eraser';
const ANNOTATE_QUICK_COLORS = [
  { label: 'Blue',   value: '#2563EB' },
  { label: 'Red',    value: '#DC2626' },
  { label: 'Black',  value: '#111827' },
  { label: 'Purple', value: '#7C3AED' },
  { label: 'Orange', value: '#EA580C' },
  { label: 'Green',  value: '#16A34A' },
  { label: 'Yellow', value: '#EAB308' },
];
const ANNOTATE_SIZES = [3, 6, 10, 14];
const GLITTER_COLORS = ['#FF2D55','#FF9500','#FFCC00','#34C759','#007AFF','#AF52DE'];
// ────────────────────────────────────────────────────────────────────────────

function normalizeCanvaEmbedUrl(rawUrl: unknown): string {
  if (typeof rawUrl !== 'string') return '';
  const candidate = rawUrl.trim();
  if (!candidate) return '';

  try {
    const parsed = new URL(candidate);
    const host = parsed.hostname.toLowerCase();
    if (!(host === 'canva.com' || host.endsWith('.canva.com'))) return '';
    if (parsed.protocol !== 'https:') return '';
    const path = parsed.pathname.toLowerCase();
    const isEditablePath = path.includes('/edit');
    const isViewPath = path.includes('/view');
    if (isEditablePath || !isViewPath) return '';

    parsed.searchParams.set('embed', '1');
    parsed.searchParams.set('ui', '0');
    return parsed.toString();
  } catch {
    return '';
  }
}

function timestampToMs(value: unknown): number {
  if (typeof value === 'object' && value !== null && typeof (value as any).toMillis === 'function') {
    const ms = Number((value as any).toMillis());
    return Number.isFinite(ms) ? ms : 0;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return 0;
}

function toFriendlyLessonLoadError(error: any): string {
  const code = String(error?.code || '').toLowerCase();
  const details = typeof error?.details === 'string' ? error.details.trim() : '';
  const rawMessage = typeof error?.message === 'string' ? error.message.trim() : '';

  if (details) return details;

  const cleanMessage = rawMessage
    .replace(/^firebase:\s*/i, '')
    .replace(/\s*\(functions\/[a-z-]+\)\.?$/i, '')
    .trim();

  if (cleanMessage && cleanMessage.toLowerCase() !== 'internal') {
    return cleanMessage;
  }

  if (code.endsWith('/not-found')) return 'Lesson not found.';
  if (code.endsWith('/failed-precondition')) return 'Lesson is missing a Canva view link.';
  if (code.endsWith('/invalid-argument')) return 'Lesson has an invalid Canva view link. Use a /view URL (not /edit).';
  return 'Unable to open this lesson right now. Please reopen from Lesson Library.';
}

export function FullScreenCanvaViewer({
  accessId,
  teacherId,
  teacherName,
  onClose,
  initialLessonTitle,
}: FullScreenCanvaViewerProps) {
  const [showWarning, setShowWarning] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [blockedActionCount, setBlockedActionCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControlsMessage, setShowControlsMessage] = useState(false);
  const [resolvedLessonTitle, setResolvedLessonTitle] = useState(initialLessonTitle || 'Lesson');
  const [resolvedCanvaEmbedUrl, setResolvedCanvaEmbedUrl] = useState('');
  const [expiresAtMs, setExpiresAtMs] = useState(0);
  const [lessonLoading, setLessonLoading] = useState(true);
  const [lessonLoadError, setLessonLoadError] = useState<string | null>(null);
  const [lessonLoadDebugError, setLessonLoadDebugError] = useState<LessonLoadDebugError | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  // ── Teacher Effects Overlay ──────────────────────────────────────────────
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const [showDrum, setShowDrum] = useState(false);
  const [drumFading, setDrumFading] = useState(false);
  const [showStars, setShowStars] = useState(false);
  const [starsKey, setStarsKey] = useState(0);
  const [showHearts, setShowHearts] = useState(false);
  const [heartsKey, setHeartsKey] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showEffectsPanel, setShowEffectsPanel] = useState(false);
  const confettiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drumTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drumFadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const starsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // confetti pattern cycles 0 → 1 → 2 → 0 …
  const confettiPatternRef = useRef<0 | 1 | 2>(0);
  // ─────────────────────────────────────────────────────────────────────────

  // ── Annotation layer ─────────────────────────────────────────────────────
  const [annotateEnabled, setAnnotateEnabled] = useState(false);
  const [annotateTool, setAnnotateTool] = useState<AnnotateTool>('pen');
  const [annotateColor, setAnnotateColor] = useState('#2563EB');
  const [annotateSize, setAnnotateSize] = useState(6);
  const [glitterMode, setGlitterMode] = useState(false);
  const [annotateShowPanel, setAnnotateShowPanel] = useState(false);
  const [annotatePaletteOpen, setAnnotatePaletteOpen] = useState(false);
  const [annotateSizeOpen, setAnnotateSizeOpen] = useState(false);
  // strokes + stickers stored in refs so canvas redraw never triggers re-render
  const strokesRef = useRef<AnnotateStroke[]>([]);
  const stickersRef = useRef<AnnotateSticker[]>([]);
  // force re-render of sticker DOM layer
  const [stickerRenderKey, setStickerRenderKey] = useState(0);
  const annotateCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<AnnotateStroke | null>(null);
  const glitterIndexRef = useRef(0);
  // ─────────────────────────────────────────────────────────────────────────

  // ── In-app whiteboard ────────────────────────────────────────────────────
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);
  const [whiteboardTool, setWhiteboardTool] = useState<WhiteboardTool>('pen');
  const [whiteboardColor, setWhiteboardColor] = useState('#0f172a');
  const [whiteboardSize, setWhiteboardSize] = useState(6);
  const whiteboardCanvasRef = useRef<HTMLCanvasElement>(null);
  const whiteboardStrokesRef = useRef<AnnotateStroke[]>([]);
  const whiteboardCurrentStrokeRef = useRef<AnnotateStroke | null>(null);
  const whiteboardIsDrawingRef = useRef(false);
  // ─────────────────────────────────────────────────────────────────────────

  const isLocalDebug =
    import.meta.env.DEV || (typeof window !== 'undefined' && window.location.hostname === 'localhost');

  const openedAtRef = useRef<number>(Date.now());
  const hasWrittenOpenLog = useRef(false);
  const viewerRef = useRef<HTMLDivElement>(null);
  const canvaIframeRef = useRef<HTMLIFrameElement>(null);
  const lastToastTimeRef = useRef<number>(0);
  const lastBlockedActionAtMsRef = useRef<number | null>(null);
  const blockedActionTypeCountsRef = useRef<Record<ViolationType, number>>({
    RIGHT_CLICK: 0,
    PRINT: 0,
    SAVE: 0,
    VIEW_SOURCE: 0,
    DEVTOOLS: 0,
    CANVA_CONTROLS_BLOCKED: 0,
    COPY: 0,
    CUT: 0,
    SELECT: 0,
    DRAG: 0,
    TAB_HIDDEN: 0,
    WINDOW_BLUR: 0,
  });

  const focusCanvaFrame = useCallback(() => {
    const frame = canvaIframeRef.current;
    if (!frame) return;
    frame.focus();
    try {
      frame.contentWindow?.focus();
    } catch {
      // cross-origin focus can fail silently in some browsers
    }
  }, []);

  // Curated Canva-style palette: 8 bright, saturated, non-muddy colours
  const CONFETTI_COLORS = [
    '#1971C2', // bright blue
    '#0CA678', // teal
    '#7048E8', // purple
    '#F03E7C', // hot pink
    '#F783AC', // light pink
    '#F59F00', // amber/yellow
    '#E8590C', // orange
    '#2F9E44', // green
  ];
  // confettiPattern is captured from the ref at the moment of each memo recompute (on key bump)
  const confettiPattern = useRef<0 | 1 | 2>(confettiPatternRef.current);
  const confettiParticles = useMemo(() => {
    const pat = confettiPattern.current;
    return Array.from({ length: 120 }, (_, i) => {
      const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      // 98% paper strips/squares — almost no dots; bulk > variety
      const isRect = Math.random() > 0.02;
      // ~20% squares, 80% wide ribbons
      const isSquare = isRect && Math.random() < 0.20;
      const baseSize = 10 + Math.floor(Math.random() * 6); // 10–15px squares
      // Ribbons: wider (18–28px) and taller (7–11px) for better visibility
      const w = isRect ? (isSquare ? `${baseSize}px` : `${18 + Math.floor(Math.random() * 11)}px`) : `${8 + Math.floor(Math.random() * 5)}px`;
      const h = isRect ? (isSquare ? `${baseSize}px` : `${7 + Math.floor(Math.random() * 5)}px`)  : w;
      const br = isRect ? '2px' : '50%';
      const dur = 2800 + Math.random() * 800;  // 2800–3600ms — slower, more floaty
      const delay = Math.random() * 1600;       // stagger up to 1.6s

      let left = `${Math.random() * 100}%`;
      let top: string | undefined = '-20px';
      let bottom: string | undefined = undefined;
      let dx = `${(Math.random() - 0.5) * 280}px`;
      let dy = '0px';
      let patClass = 'pattern-top';

      if (pat === 0) {
        // bottom burst: spawn near bottom-center, launch upward via keyframe
        patClass = 'pattern-bottom';
        left = `${28 + Math.random() * 44}%`; // wider centre cluster
        top = undefined;
        bottom = `${Math.random() * 6}%`;     // near the very bottom
        dx = `${(Math.random() - 0.5) * 680}px`; // wide lateral spread
      } else if (pat === 1) {
        // side burst: alternating left / right edge, push toward centre
        patClass = 'pattern-side';
        const fromLeft = i % 2 === 0;
        left = fromLeft ? `${Math.random() * 6}%` : `${94 + Math.random() * 6}%`;
        top = `${8 + Math.random() * 70}%`;
        dx = fromLeft
          ? `${100 + Math.random() * 340}px`
          : `${-(100 + Math.random() * 340)}px`;
        dy = `${(Math.random() - 0.35) * 160}px`;
      } else {
        // top shower: full-width gentle rain with slight lateral drift
        patClass = 'pattern-top';
        left = `${-2 + Math.random() * 104}%`;
        dx = `${(Math.random() - 0.5) * 80}px`; // gentle drift only
      }

      return {
        id: i, color, w, h, br, left, top, bottom, patClass,
        '--cf-dur': `${dur.toFixed(0)}ms`,
        '--cf-delay': `${delay.toFixed(0)}ms`,
        '--cf-dx': dx,
        '--cf-dy': dy,
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confettiKey]);

  const triggerConfetti = useCallback(() => {
    if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current);
    // Advance pattern 0→1→2→0
    confettiPatternRef.current = ((confettiPatternRef.current + 1) % 3) as 0 | 1 | 2;
    confettiPattern.current = confettiPatternRef.current;
    setConfettiKey((k) => k + 1);
    setShowConfetti(true);
    confettiTimerRef.current = setTimeout(() => setShowConfetti(false), 5000);

    // Celebration sound: play the local confetti.mp3 asset (cheerful applause clip)
    if (soundEnabled) {
      try {
        const audio = new Audio('/confetti.mp3');
        audio.volume = 0.7;
        audio.play().catch(() => { /* autoplay blocked — silent fail */ });
      } catch { /* silent fail */ }
    }
  }, [soundEnabled]);

  const [drumShaking, setDrumShaking] = useState(false);

  const triggerDrum = useCallback(() => {
    // Clear any running drum timers cleanly
    if (drumFadeTimerRef.current) clearTimeout(drumFadeTimerRef.current);
    if (drumTimerRef.current) clearTimeout(drumTimerRef.current);
    setDrumFading(false);
    setDrumShaking(false);
    setShowDrum(true);

    // 3-hit drum audio sequence via Web Audio API
    if (soundEnabled) {
      try {
        const ctx = new AudioContext();

        const playHit = (t: number, kickFreq: number, kickGain: number, noiseGain: number) => {
          // Kick
          const kGain = ctx.createGain();
          kGain.gain.setValueAtTime(kickGain, t);
          kGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
          kGain.connect(ctx.destination);
          const kOsc = ctx.createOscillator();
          kOsc.type = 'sine';
          kOsc.frequency.setValueAtTime(kickFreq, t);
          kOsc.frequency.exponentialRampToValueAtTime(35, t + 0.25);
          kOsc.connect(kGain);
          kOsc.start(t); kOsc.stop(t + 0.35);
          // Snare noise
          const bufSize = Math.floor(ctx.sampleRate * 0.14);
          const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
          const ch = buf.getChannelData(0);
          for (let j = 0; j < bufSize; j++) ch[j] = Math.random() * 2 - 1;
          const nSrc = ctx.createBufferSource();
          nSrc.buffer = buf;
          const nGain = ctx.createGain();
          nGain.gain.setValueAtTime(noiseGain, t + 0.02);
          nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          nSrc.connect(nGain); nGain.connect(ctx.destination);
          nSrc.start(t + 0.02); nSrc.stop(t + 0.18);
        };

        const now = ctx.currentTime;
        playHit(now,        190, 0.9, 0.65);  // hit 1 — strong but not harsh
        playHit(now + 0.44, 175, 0.8, 0.55);  // hit 2 — spaced out, softer
        playHit(now + 0.82, 210, 1.0, 0.72);  // hit 3 — accent, more space to breathe
        setTimeout(() => ctx.close(), 1600);
      } catch { /* silent fail */ }
    }

    // Shake on 2nd and 3rd hit — timing matches new audio spacing, longer shake
    const shakeTimer1 = setTimeout(() => {
      setDrumShaking(true);
      setTimeout(() => setDrumShaking(false), 180);
    }, 440);
    const shakeTimer2 = setTimeout(() => {
      setDrumShaking(true);
      setTimeout(() => setDrumShaking(false), 180);
    }, 820);

    // Start fade-out after 2.4s, remove after 3s
    drumFadeTimerRef.current = setTimeout(() => {
      setDrumFading(true);
      drumTimerRef.current = setTimeout(() => {
        setShowDrum(false);
        setDrumFading(false);
        setDrumShaking(false);
      }, 600);
    }, 2400);

    return () => {
      clearTimeout(shakeTimer1);
      clearTimeout(shakeTimer2);
    };
  }, [soundEnabled]);

  const triggerStars = useCallback(() => {
    if (starsTimerRef.current) clearTimeout(starsTimerRef.current);
    setStarsKey((k) => k + 1);
    setShowStars(true);
    starsTimerRef.current = setTimeout(() => setShowStars(false), 3000);
  }, []);

  // 3 fixed large star positions for maximum visibility
  const STAR_POSITIONS = [
    { left: '22%', top: '28%', delay: '0ms',   dur: '3000ms', size: '7rem' },
    { left: '50%', top: '16%', delay: '120ms',  dur: '3200ms', size: '8.5rem' },
    { left: '76%', top: '30%', delay: '60ms',   dur: '2900ms', size: '7.5rem' },
  ] as const;

  const triggerHearts = useCallback(() => {
    if (heartsTimerRef.current) clearTimeout(heartsTimerRef.current);
    setHeartsKey((k) => k + 1);
    setShowHearts(true);
    heartsTimerRef.current = setTimeout(() => setShowHearts(false), 3200);
  }, []);

  // 2 large heart positions
  const HEART_POSITIONS = [
    { left: '33%', top: '36%', delay: '0ms',  dur: '3000ms', size: '9rem', emoji: '❤️' },
    { left: '57%', top: '30%', delay: '200ms', dur: '3200ms', size: '8rem', emoji: '💖' },
  ] as const;

  // ── Annotation helpers ───────────────────────────────────────────────────
  /** Full canvas redraw from strokesRef */
  const redrawCanvas = useCallback(() => {
    const canvas = annotateCanvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;
    ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    for (const stroke of strokesRef.current) {
      if (stroke.points.length < 2) continue;
      let glitIdx = 0;
      for (let i = 1; i < stroke.points.length; i++) {
        const from = stroke.points[i - 1];
        const to = stroke.points[i];
        ctx2d.beginPath();
        ctx2d.lineWidth = stroke.size;
        ctx2d.lineCap = 'round';
        ctx2d.lineJoin = 'round';
        ctx2d.strokeStyle = stroke.glitter
          ? GLITTER_COLORS[glitIdx % GLITTER_COLORS.length]
          : stroke.color;
        if (stroke.glitter) glitIdx++;
        ctx2d.moveTo(from.x, from.y);
        ctx2d.lineTo(to.x, to.y);
        ctx2d.stroke();
      }
    }
  }, []);

  /** Get canvas-relative pointer position */
  const canvasPos = useCallback((e: React.PointerEvent<HTMLCanvasElement>): AnnotatePoint => {
    const rect = annotateCanvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const onCanvasPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!annotateEnabled || annotateTool !== 'pen') return;
    e.preventDefault();
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    glitterIndexRef.current = 0;
    const pt = canvasPos(e);
    currentStrokeRef.current = {
      points: [pt],
      color: annotateColor,
      size: annotateSize,
      glitter: glitterMode,
    };
  }, [annotateEnabled, annotateTool, annotateColor, annotateSize, glitterMode, canvasPos]);

  const onCanvasPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;
    e.preventDefault();
    const pt = canvasPos(e);
    const stroke = currentStrokeRef.current;
    const prev = stroke.points[stroke.points.length - 1];
    const dx = pt.x - prev.x;
    const dy = pt.y - prev.y;
    if (dx * dx + dy * dy < 4) return;
    stroke.points.push(pt);
    const canvas = annotateCanvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;
    ctx2d.beginPath();
    ctx2d.lineWidth = stroke.size;
    ctx2d.lineCap = 'round';
    ctx2d.lineJoin = 'round';
    ctx2d.strokeStyle = stroke.glitter
      ? GLITTER_COLORS[glitterIndexRef.current % GLITTER_COLORS.length]
      : stroke.color;
    glitterIndexRef.current++;
    ctx2d.moveTo(prev.x, prev.y);
    ctx2d.lineTo(pt.x, pt.y);
    ctx2d.stroke();
  }, [canvasPos]);

  const onCanvasPointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;
    e.preventDefault();
    isDrawingRef.current = false;
    if (currentStrokeRef.current.points.length >= 1) {
      strokesRef.current = [...strokesRef.current, currentStrokeRef.current];
    }
    currentStrokeRef.current = null;
    focusCanvaFrame();
  }, [focusCanvaFrame]);

  const onCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!annotateEnabled) return;
    if (annotateTool !== 'star' && annotateTool !== 'heart') return;
    const rect = annotateCanvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const emoji = annotateTool === 'star' ? '⭐' : '❤️';
    const sizeMap: Record<number, string> = { 3: '2rem', 6: '2.8rem', 10: '3.5rem', 14: '4.5rem' };
    const size = sizeMap[annotateSize] ?? '3rem';
    stickersRef.current = [...stickersRef.current, { x, y, emoji, size }];
    setStickerRenderKey((k) => k + 1);
    focusCanvaFrame();
  }, [annotateEnabled, annotateTool, annotateSize, focusCanvaFrame]);

  const annotateUndo = useCallback(() => {
    if (stickersRef.current.length > 0) {
      stickersRef.current = stickersRef.current.slice(0, -1);
      setStickerRenderKey((k) => k + 1);
    } else if (strokesRef.current.length > 0) {
      strokesRef.current = strokesRef.current.slice(0, -1);
      redrawCanvas();
    }
  }, [redrawCanvas]);

  const annotateClear = useCallback(() => {
    strokesRef.current = [];
    stickersRef.current = [];
    redrawCanvas();
    setStickerRenderKey((k) => k + 1);
    focusCanvaFrame();
  }, [focusCanvaFrame, redrawCanvas]);

  // Resize canvas to match its CSS size when viewer dimensions change
  useEffect(() => {
    const canvas = annotateCanvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        redrawCanvas();
      }
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [redrawCanvas]);

  // ─────────────────────────────────────────────────────────────────────────

  // ── Whiteboard helpers ───────────────────────────────────────────────────
  const redrawWhiteboard = useCallback(() => {
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;
    ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    ctx2d.fillStyle = '#ffffff';
    ctx2d.fillRect(0, 0, canvas.width, canvas.height);
    for (const stroke of whiteboardStrokesRef.current) {
      if (stroke.points.length < 2) continue;
      for (let i = 1; i < stroke.points.length; i++) {
        const from = stroke.points[i - 1];
        const to = stroke.points[i];
        ctx2d.beginPath();
        ctx2d.lineWidth = stroke.size;
        ctx2d.lineCap = 'round';
        ctx2d.lineJoin = 'round';
        ctx2d.strokeStyle = stroke.color;
        ctx2d.moveTo(from.x, from.y);
        ctx2d.lineTo(to.x, to.y);
        ctx2d.stroke();
      }
    }
  }, []);

  const whiteboardCanvasPos = useCallback((e: React.PointerEvent<HTMLCanvasElement>): AnnotatePoint => {
    const rect = whiteboardCanvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const onWhiteboardPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    whiteboardIsDrawingRef.current = true;
    const point = whiteboardCanvasPos(e);
    whiteboardCurrentStrokeRef.current = {
      points: [point],
      color: whiteboardTool === 'eraser' ? '#ffffff' : whiteboardColor,
      size: whiteboardTool === 'eraser' ? Math.max(14, whiteboardSize * 2) : whiteboardSize,
      glitter: false,
    };
  }, [whiteboardCanvasPos, whiteboardColor, whiteboardSize, whiteboardTool]);

  const onWhiteboardPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!whiteboardIsDrawingRef.current || !whiteboardCurrentStrokeRef.current) return;
    e.preventDefault();
    const point = whiteboardCanvasPos(e);
    const stroke = whiteboardCurrentStrokeRef.current;
    const prev = stroke.points[stroke.points.length - 1];
    const dx = point.x - prev.x;
    const dy = point.y - prev.y;
    if (dx * dx + dy * dy < 4) return;
    stroke.points.push(point);
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;
    ctx2d.beginPath();
    ctx2d.lineWidth = stroke.size;
    ctx2d.lineCap = 'round';
    ctx2d.lineJoin = 'round';
    ctx2d.strokeStyle = stroke.color;
    ctx2d.moveTo(prev.x, prev.y);
    ctx2d.lineTo(point.x, point.y);
    ctx2d.stroke();
  }, [whiteboardCanvasPos]);

  const onWhiteboardPointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!whiteboardIsDrawingRef.current || !whiteboardCurrentStrokeRef.current) return;
    e.preventDefault();
    whiteboardIsDrawingRef.current = false;
    whiteboardStrokesRef.current = [...whiteboardStrokesRef.current, whiteboardCurrentStrokeRef.current];
    whiteboardCurrentStrokeRef.current = null;
  }, []);

  const whiteboardUndo = useCallback(() => {
    if (whiteboardStrokesRef.current.length === 0) return;
    whiteboardStrokesRef.current = whiteboardStrokesRef.current.slice(0, -1);
    redrawWhiteboard();
  }, [redrawWhiteboard]);

  const whiteboardClear = useCallback(() => {
    whiteboardStrokesRef.current = [];
    redrawWhiteboard();
  }, [redrawWhiteboard]);

  useEffect(() => {
    if (!whiteboardOpen) return;
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return;
    const syncCanvasSize = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      redrawWhiteboard();
    };
    syncCanvasSize();
    const observer = new ResizeObserver(syncCanvasSize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [redrawWhiteboard, whiteboardOpen]);
  // ─────────────────────────────────────────────────────────────────────────

  const pushViolation = useCallback((type: ViolationType) => {
    lastBlockedActionAtMsRef.current = Date.now();
    blockedActionTypeCountsRef.current[type] = (blockedActionTypeCountsRef.current[type] || 0) + 1;
    setBlockedActionCount((prev) => Math.min(prev + 1, MAX_VIOLATIONS));
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadAccessSession() {
      setLessonLoading(true);
      setLessonLoadError(null);
      setLessonLoadDebugError(null);
      setSessionExpired(false);

      try {
        const response = await callFunction<ResolveLessonAccessViewerResponse, { accessId: string }>(
          'resolveLessonAccessViewer',
          { accessId }
        );

        const embedUrl = normalizeCanvaEmbedUrl(response?.canvaEmbedUrl || '');
        if (!embedUrl) {
          throw new Error('Lesson access has no valid Canva embed URL.');
        }

        const expiresMs = Number(response?.expiresAtMs || 0);
        if (!Number.isFinite(expiresMs) || expiresMs <= 0) {
          throw new Error('Lesson access is invalid. Reopen from library.');
        }

        const title = String(response?.lessonTitle || '').trim() || initialLessonTitle || 'Lesson';
        const expired = Date.now() >= expiresMs;

        if (!mounted) return;

        setResolvedLessonTitle(title);
        setResolvedCanvaEmbedUrl(embedUrl);
        setExpiresAtMs(expiresMs);
        setSessionExpired(expired);
      } catch (error: any) {
        if (!mounted) return;
        if (import.meta.env.DEV) {
          console.error('[FullScreenCanvaViewer] resolveLessonAccessViewer failed', {
            accessId,
            code: error?.code,
            message: error?.message,
            details: error?.details,
            raw: error,
          });
        }
        setLessonLoadDebugError({
          code: String(error?.code || ''),
          message: String(error?.message || ''),
          details: typeof error?.details === 'string' ? error.details : '',
        });
        setLessonLoadError(toFriendlyLessonLoadError(error));
      } finally {
        if (mounted) {
          setLessonLoading(false);
        }
      }
    }

    loadAccessSession();
    return () => {
      mounted = false;
    };
  }, [accessId, initialLessonTitle, teacherId]);

  useEffect(() => {
    if (!expiresAtMs) return;

    const timer = window.setInterval(() => {
      if (Date.now() >= expiresAtMs) {
        setSessionExpired(true);
      }
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [expiresAtMs]);

  useEffect(() => {
    if (hasWrittenOpenLog.current) return;
    hasWrittenOpenLog.current = true;

    const writeOpenLog = async () => {
      try {
        const auditRef = doc(db, 'lesson_view_audit', accessId);
        await setDoc(
          auditRef,
          {
            accessId,
            teacherId,
            teacherName,
            mode: 'full',
            openedAt: serverTimestamp(),
            blockedActionCount: 0,
            blockedActionTypes: blockedActionTypeCountsRef.current,
          },
          { merge: true }
        );
      } catch (error) {
        console.error('[FullScreenCanvaViewer] Failed to write open audit log:', error);
      }
    };

    writeOpenLog();
  }, [accessId, teacherId, teacherName]);

  const handleContinue = useCallback(async () => {
    if (!agreedToTerms) return;

    try {
      await setDoc(
        doc(db, 'lesson_view_audit', accessId),
        {
          policyAcceptedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('[FullScreenCanvaViewer] Failed to log policy acceptance:', error);
    }

    setShowWarning(false);

    if (viewerRef.current && !sessionExpired && !lessonLoadError) {
      try {
        await viewerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch (error) {
        console.error('[FullScreenCanvaViewer] Failed to enter fullscreen:', error);
      }
    }
  }, [accessId, agreedToTerms, lessonLoadError, sessionExpired]);

  const handleClose = useCallback(async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // no-op
      }
    }

    const durationSec = Math.floor((Date.now() - openedAtRef.current) / 1000);

    try {
      await setDoc(
        doc(db, 'lesson_view_audit', accessId),
        {
          closedAt: serverTimestamp(),
          durationSec,
          blockedActionCount,
          blockedActionTypes: blockedActionTypeCountsRef.current,
          lastBlockedActionAtMs: lastBlockedActionAtMsRef.current,
        },
        { merge: true }
      );
    } catch (error) {
      console.error('[FullScreenCanvaViewer] Failed to write close audit log:', error);
    }

    onClose();
  }, [accessId, blockedActionCount, onClose]);

  const handleControlShieldClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      pushViolation('CANVA_CONTROLS_BLOCKED');

      const now = Date.now();
      if (now - lastToastTimeRef.current >= TOAST_THROTTLE_MS) {
        lastToastTimeRef.current = now;
        setShowControlsMessage(true);
        window.setTimeout(() => setShowControlsMessage(false), 2500);
      }
    },
    [pushViolation]
  );

  const handleEnterFullscreen = useCallback(async () => {
    if (viewerRef.current && !document.fullscreenElement) {
      try {
        await viewerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch {
        // no-op
      }
    }
  }, []);

  const handleExitFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch {
        // no-op
      }
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const onContextMenu = (event: Event) => {
      if (isLocalDebug) return;
      event.preventDefault();
      pushViolation('RIGHT_CLICK');
    };
    const onCopy = (event: Event) => {
      event.preventDefault();
      pushViolation('COPY');
    };
    const onCut = (event: Event) => {
      event.preventDefault();
      pushViolation('CUT');
    };
    const onDragStart = (event: Event) => {
      event.preventDefault();
      pushViolation('DRAG');
    };
    const onSelectStart = (event: Event) => {
      event.preventDefault();
      pushViolation('SELECT');
    };

    const onBlur = () => {
      pushViolation('WINDOW_BLUR');
    };
    const onVisibilityChange = () => {
      if (document.hidden) {
        pushViolation('TAB_HIDDEN');
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const ctrl = event.ctrlKey || event.metaKey;
      let violationType: ViolationType | null = null;

      if (ctrl && event.key.toLowerCase() === 'p') violationType = 'PRINT';
      else if (ctrl && event.key.toLowerCase() === 's') violationType = 'SAVE';
      else if (ctrl && event.key.toLowerCase() === 'u') violationType = 'VIEW_SOURCE';
      else if (ctrl && event.shiftKey && event.key.toLowerCase() === 'i') violationType = 'DEVTOOLS';
      else if (event.key === 'F12') violationType = 'DEVTOOLS';

      if (!violationType) return;
      event.preventDefault();
      event.stopPropagation();
      pushViolation(violationType);
    };

    document.addEventListener('contextmenu', onContextMenu, true);
    document.addEventListener('copy', onCopy, true);
    document.addEventListener('cut', onCut, true);
    document.addEventListener('dragstart', onDragStart, true);
    document.addEventListener('selectstart', onSelectStart, true);
    document.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('contextmenu', onContextMenu, true);
      document.removeEventListener('copy', onCopy, true);
      document.removeEventListener('cut', onCut, true);
      document.removeEventListener('dragstart', onDragStart, true);
      document.removeEventListener('selectstart', onSelectStart, true);
      document.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isLocalDebug, pushViolation]);

  // Teacher effects keyboard shortcuts
  useEffect(() => {
    const onEffectsKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      if (event.key === 'c' || event.key === 'C' || event.key === '1') {
        event.stopPropagation();
        triggerConfetti();
      } else if (event.key === 'd' || event.key === 'D' || event.key === '2') {
        event.stopPropagation();
        triggerDrum();
      } else if (event.key === 's' || event.key === 'S' || event.key === '3') {
        event.stopPropagation();
        triggerStars();
      } else if (event.key === 'l' || event.key === 'L' || event.key === '4') {
        event.stopPropagation();
        triggerHearts();
      } else if (event.key === 'w' || event.key === 'W') {
        event.stopPropagation();
        setWhiteboardOpen((v) => !v);
      } else if (event.key === 'a' || event.key === 'A') {
        event.stopPropagation();
        setAnnotateShowPanel((v) => {
          const next = !v;
          setAnnotateEnabled(next);
          return next;
        });
        setAnnotatePaletteOpen(false);
        setAnnotateSizeOpen(false);
      }
    };

    document.addEventListener('keydown', onEffectsKey);
    return () => {
      document.removeEventListener('keydown', onEffectsKey);
      // Cleanup timers on unmount
      if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current);
      if (drumTimerRef.current) clearTimeout(drumTimerRef.current);
      if (drumFadeTimerRef.current) clearTimeout(drumFadeTimerRef.current);
      if (starsTimerRef.current) clearTimeout(starsTimerRef.current);
      if (heartsTimerRef.current) clearTimeout(heartsTimerRef.current);
    };
  }, [triggerConfetti, triggerDrum, triggerStars, triggerHearts]);

  // Keep Canva slide keyboard navigation working while annotation is enabled.
  useEffect(() => {
    const onSlideNavKey = (event: KeyboardEvent) => {
      if (!annotateEnabled) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const isNavKey =
        event.key === 'ArrowRight' ||
        event.key === 'ArrowLeft' ||
        event.key === 'PageDown' ||
        event.key === 'PageUp' ||
        event.key === ' ';
      if (!isNavKey) return;
      focusCanvaFrame();
    };
    document.addEventListener('keydown', onSlideNavKey, true);
    return () => {
      document.removeEventListener('keydown', onSlideNavKey, true);
    };
  }, [annotateEnabled, focusCanvaFrame]);

  const formattedDebugDetails = (() => {
    const details = lessonLoadDebugError?.details;
    if (details == null) return '(none)';
    if (typeof details === 'string') return details || '(none)';
    try {
      return JSON.stringify(details, null, 2);
    } catch {
      return String(details);
    }
  })();

  useEffect(() => {
    const handleBeforeUnload = async () => {
      const durationSec = Math.floor((Date.now() - openedAtRef.current) / 1000);
      try {
        await setDoc(
          doc(db, 'lesson_view_audit', accessId),
          {
            closedAt: serverTimestamp(),
            durationSec,
            blockedActionCount,
            blockedActionTypes: blockedActionTypeCountsRef.current,
            lastBlockedActionAtMs: lastBlockedActionAtMsRef.current,
          },
          { merge: true }
        );
      } catch {
        // no-op
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [accessId, blockedActionCount]);

  const contentReady = !lessonLoading && !lessonLoadError && !sessionExpired && !!resolvedCanvaEmbedUrl;
  const remainingSeconds = expiresAtMs ? Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000)) : 0;
  const remainingMinutes = Math.floor(remainingSeconds / 60);
  const remainingSecondsRemainder = remainingSeconds % 60;

  return (
    <div ref={viewerRef} className="fixed inset-0 z-50 bg-white" style={{ userSelect: 'none' }}>
      {showWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Copyright Notice</h2>
            <p className="text-gray-700 mb-6">
              This lesson is proprietary TinySteps content. Downloading, recording, sharing, or
              redistributing this material is prohibited and audited.
            </p>
            <p className="text-sm font-semibold text-amber-700 mb-6">
              Open only during active class time. Access expires in 50 minutes.
            </p>
            <label className="flex items-start gap-3 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(event) => setAgreedToTerms(event.target.checked)}
                className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                I understand and agree to these terms.
              </span>
            </label>
            <Button onClick={handleContinue} disabled={!agreedToTerms} className="w-full">
              Continue
            </Button>
          </div>
        </div>
      )}

      <div className="h-16 bg-gray-900 text-white flex items-center justify-between px-6 relative z-50">
        <div className="flex items-center gap-4 min-w-0">
          <h1 className="text-lg font-semibold truncate max-w-xl">{resolvedLessonTitle}</h1>
          <span className="text-sm text-gray-400">Secure Viewer</span>
          {!showWarning && !lessonLoadError && !sessionExpired && expiresAtMs ? (
            <span className="text-xs text-amber-300">
              Expires in {remainingMinutes}:{String(remainingSecondsRemainder).padStart(2, '0')}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {!isFullscreen ? (
            <Button onClick={handleEnterFullscreen} variant="ghost" className="text-white hover:bg-gray-800">
              <Maximize className="w-5 h-5 mr-2" />
              Fullscreen
            </Button>
          ) : (
            <Button onClick={handleExitFullscreen} variant="ghost" className="text-white hover:bg-gray-800">
              <Minimize className="w-5 h-5 mr-2" />
              Exit
            </Button>
          )}
          <Button onClick={handleClose} variant="ghost" className="text-white hover:bg-gray-800">
            <X className="w-5 h-5 mr-2" />
            Close
          </Button>
        </div>
      </div>

      <div className="relative overflow-hidden" style={{ height: 'calc(100vh - 4rem)' }}>
        {/* ── Confetti overlay ───────────────────────────────────────────── */}
        {showConfetti && (
          <div key={confettiKey} className="confetti-container" aria-hidden="true">
            {confettiParticles.map((p) => (
              <div
                key={p.id}
                className={`confetti-piece ${p.patClass}`}
                style={{
                  left: p.left,
                  ...(p.top !== undefined ? { top: p.top } : {}),
                  ...(p.bottom !== undefined ? { bottom: p.bottom } : {}),
                  backgroundColor: p.color,
                  width: p.w,
                  height: p.h,
                  borderRadius: p.br,
                  ['--cf-dur' as string]: p['--cf-dur'],
                  ['--cf-delay' as string]: p['--cf-delay'],
                  ['--cf-dx' as string]: p['--cf-dx'],
                  ['--cf-dy' as string]: p['--cf-dy'],
                } as React.CSSProperties}
              />
            ))}
          </div>
        )}

        {/* ── Stars overlay (3 large glowing stars) ────────────────────────── */}
        {showStars && (
          <div key={starsKey} className="stars-overlay" aria-hidden="true">
            {STAR_POSITIONS.map((sp, i) => (
              <span
                key={i}
                className="star-big"
                style={{
                  left: sp.left,
                  top: sp.top,
                  fontSize: sp.size,
                  ['--st-dur' as string]: sp.dur,
                  ['--st-delay' as string]: sp.delay,
                } as React.CSSProperties}
              >
                ⭐
              </span>
            ))}
          </div>
        )}

        {/* ── Hearts overlay (2 large popping hearts) ───────────────────────── */}
        {showHearts && (
          <div key={heartsKey} className="hearts-overlay" aria-hidden="true">
            {HEART_POSITIONS.map((hp, i) => (
              <span
                key={i}
                className="heart-big"
                style={{
                  left: hp.left,
                  top: hp.top,
                  fontSize: hp.size,
                  ['--ht-dur' as string]: hp.dur,
                  ['--ht-delay' as string]: hp.delay,
                } as React.CSSProperties}
              >
                {hp.emoji}
              </span>
            ))}
          </div>
        )}

        {/* ── Drum overlay (large, 3-hit) ─────────────────────────────────────── */}
        {showDrum && (
          <div className="drum-overlay" aria-hidden="true">
            <span
              className={drumFading ? 'drum-fade-out' : drumShaking ? 'drum-shake' : 'drum-pop'}
              style={{ fontSize: '12rem', filter: 'drop-shadow(0 12px 40px rgba(0,0,0,0.45))' }}
            >
              🥁
            </span>
          </div>
        )}

        {/* ── Annotation canvas layer ──────────────────────────────────────── */}
        <canvas
          ref={annotateCanvasRef}
          className="absolute inset-0 w-full h-full"
          style={{
            zIndex: 48,
            pointerEvents: annotateEnabled ? 'auto' : 'none',
            // pen: inline SVG pen cursor; star/heart: normal default
            cursor: annotateEnabled && annotateTool === 'pen'
              ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Cpath d='M14.5 1.5l4 4-10 10-4.5 1 1-4.5z' fill='%23fff' stroke='%23333' stroke-width='1.2'/%3E%3Cpath d='M1 19l1-4.5' stroke='%23333' stroke-width='1.2'/%3E%3C/svg%3E") 2 18, crosshair`
              : 'default',
            touchAction: 'none',
          }}
          onPointerDown={onCanvasPointerDown}
          onPointerMove={onCanvasPointerMove}
          onPointerUp={onCanvasPointerUp}
          onPointerLeave={onCanvasPointerUp}
          onClick={onCanvasClick}
        />

        {/* ── Annotation sticker layer ─────────────────────────────────────── */}
        <div
          key={stickerRenderKey}
          className="absolute inset-0 w-full h-full"
          style={{ zIndex: 49, pointerEvents: 'none' }}
          aria-hidden="true"
        >
          {stickersRef.current.map((s, i) => (
            <span
              key={i}
              style={{
                position: 'absolute',
                left: s.x,
                top: s.y,
                fontSize: s.size,
                transform: 'translate(-50%, -50%)',
                lineHeight: 1,
                userSelect: 'none',
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.35))',
              }}
            >
              {s.emoji}
            </span>
          ))}
        </div>

        {/* Minimal Zoom-like annotation rail */}
        <div className="annotation-sidebar-root" style={{ pointerEvents: 'auto' }}>
          <button
            onClick={() => {
              setAnnotateShowPanel((v) => {
                const next = !v;
                setAnnotateEnabled(next);
                if (!next) {
                  setAnnotatePaletteOpen(false);
                  setAnnotateSizeOpen(false);
                }
                return next;
              });
              focusCanvaFrame();
            }}
            className={`annotation-launcher ${annotateEnabled ? 'annotation-launcher--on' : ''}`}
            aria-label={annotateShowPanel ? 'Hide annotation tools' : 'Show annotation tools'}
            title="Annotation tools (A)"
            onMouseDown={(event) => event.preventDefault()}
          >
            ✏️
          </button>

          <div className={`annotation-strip ${annotateShowPanel ? 'annotation-strip--open' : ''}`}>
            {([
              { tool: 'pen' as AnnotateTool, emoji: '✏️', label: 'Pen' },
              { tool: 'star' as AnnotateTool, emoji: '⭐', label: 'Star' },
              { tool: 'heart' as AnnotateTool, emoji: '❤️', label: 'Heart' },
            ]).map(({ tool, emoji, label }) => (
              <button
                key={tool}
                onClick={() => {
                  setAnnotateTool(tool);
                  setAnnotateEnabled(true);
                  setAnnotateShowPanel(true);
                  setAnnotatePaletteOpen(false);
                  setAnnotateSizeOpen(false);
                }}
                className={`annotation-strip-btn ${annotateEnabled && annotateTool === tool ? 'annotation-strip-btn--active' : ''}`}
                aria-label={label}
                title={label}
                onMouseDown={(event) => event.preventDefault()}
              >
                {emoji}
              </button>
            ))}

            <button
              onClick={() => {
                setAnnotatePaletteOpen((v) => !v);
                setAnnotateSizeOpen(false);
              }}
              className={`annotation-strip-btn ${annotatePaletteOpen ? 'annotation-strip-btn--active' : ''}`}
              aria-label="Color palette"
              title="Color palette"
              onMouseDown={(event) => event.preventDefault()}
            >
              🎨
            </button>

            <button
              onClick={() => {
                setAnnotateSizeOpen((v) => !v);
                setAnnotatePaletteOpen(false);
              }}
              className={`annotation-strip-btn ${annotateSizeOpen ? 'annotation-strip-btn--active' : ''}`}
              aria-label="Pen size options"
              title={`Pen size ${annotateSize}`}
              onMouseDown={(event) => event.preventDefault()}
            >
              {annotateSize}
            </button>

            <button
              onClick={annotateUndo}
              className="annotation-strip-btn"
              aria-label="Undo annotation"
              title="Undo"
              onMouseDown={(event) => event.preventDefault()}
            >
              ↩
            </button>

            <button
              onClick={annotateClear}
              className="annotation-strip-btn annotation-strip-btn--danger"
              aria-label="Clear this slide annotations"
              title="Clear this slide"
              onMouseDown={(event) => event.preventDefault()}
            >
              🗑
            </button>
          </div>

          {annotateShowPanel && annotatePaletteOpen && (
            <div className="annotation-palette-popover">
              <button
                title="Glitter / multicolor"
                onClick={() => {
                  setGlitterMode((v) => !v);
                  setAnnotateEnabled(true);
                }}
                className={`atb-color-swatch atb-color-swatch--glitter ${glitterMode ? 'atb-color-swatch--selected' : ''}`}
                aria-label="Glitter pen"
                onMouseDown={(event) => event.preventDefault()}
              >
                {glitterMode && <span className="atb-color-check">✓</span>}
              </button>
              {ANNOTATE_QUICK_COLORS.map(({ label, value }) => (
                <button
                  key={value}
                  title={label}
                  onClick={() => {
                    setAnnotateColor(value);
                    setGlitterMode(false);
                    setAnnotateEnabled(true);
                  }}
                  className="atb-color-swatch"
                  style={{ backgroundColor: value }}
                  aria-label={`Color ${label}`}
                  onMouseDown={(event) => event.preventDefault()}
                >
                  {!glitterMode && annotateColor === value && (
                    <span className="atb-color-check">✓</span>
                  )}
                </button>
              ))}
              <label
                title="Custom color"
                className={`atb-color-swatch atb-color-swatch--custom ${!glitterMode && !ANNOTATE_QUICK_COLORS.some((c) => c.value === annotateColor) ? 'atb-color-swatch--selected' : ''}`}
                aria-label="Custom color"
                style={{ position: 'relative', overflow: 'hidden' }}
                onMouseDown={(event) => event.preventDefault()}
              >
                <span
                  className="atb-custom-preview"
                  style={{ backgroundColor: glitterMode ? '#888' : annotateColor }}
                />
                <input
                  type="color"
                  value={annotateColor}
                  onChange={(e) => {
                    setAnnotateColor(e.target.value);
                    setGlitterMode(false);
                    setAnnotateEnabled(true);
                  }}
                  className="atb-color-input"
                  aria-label="Choose custom color"
                />
              </label>
            </div>
          )}
          {annotateShowPanel && annotateSizeOpen && (
            <div className="annotation-size-popover">
              {ANNOTATE_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setAnnotateSize(size);
                    setAnnotateEnabled(true);
                  }}
                  className={`annotation-size-choice ${annotateSize === size ? 'annotation-size-choice--active' : ''}`}
                  title={`Pen size ${size}`}
                  aria-label={`Pen size ${size}`}
                  onMouseDown={(event) => event.preventDefault()}
                >
                  <span
                    className="annotation-size-choice-dot"
                    style={{ width: Math.max(4, size), height: Math.max(4, size) }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right-side reactions + whiteboard rail to keep bottom slide bar clear */}
        <div className="effects-side-root" style={{ pointerEvents: 'auto' }}>
          <button
            onClick={() => setShowEffectsPanel((v) => !v)}
            className={`effects-side-trigger ${showEffectsPanel ? 'effects-side-trigger--active' : ''}`}
            aria-label={showEffectsPanel ? 'Hide reactions' : 'Show reactions'}
            title="Reactions"
            onMouseDown={(event) => event.preventDefault()}
          >
            🙂
          </button>
          <button
            onClick={() => setWhiteboardOpen((v) => !v)}
            className={`effects-side-trigger ${whiteboardOpen ? 'effects-side-trigger--active' : ''}`}
            aria-label={whiteboardOpen ? 'Close whiteboard' : 'Open whiteboard'}
            title="Whiteboard (W)"
            onMouseDown={(event) => event.preventDefault()}
          >
            🧑‍🏫
          </button>
          <div className={`effects-side-popover ${showEffectsPanel ? 'effects-side-popover--open' : ''}`}>
            {([
              { fn: triggerConfetti, emoji: '🎉', label: 'Confetti', keys: 'C / 1' },
              { fn: triggerDrum, emoji: '🥁', label: 'Drumroll', keys: 'D / 2' },
              { fn: triggerStars, emoji: '⭐', label: 'Stars', keys: 'S / 3' },
              { fn: triggerHearts, emoji: '❤️', label: 'Love', keys: 'L / 4' },
            ] as const).map(({ fn, emoji, label, keys }) => (
              <button
                key={label}
                onClick={fn}
                className="effects-popover-btn"
                aria-label={`${label} reaction`}
                onMouseDown={(event) => event.preventDefault()}
              >
                <span className="effects-popover-emoji">{emoji}</span>
                <span className="effects-popover-label">{label}</span>
                <span className="effects-popover-keys">{keys}</span>
              </button>
            ))}
            <button
              onClick={() => setSoundEnabled((v) => !v)}
              className="effects-popover-btn effects-popover-btn--sound"
              aria-label={soundEnabled ? 'Mute reaction sounds' : 'Unmute reaction sounds'}
              onMouseDown={(event) => event.preventDefault()}
            >
              <span className="effects-popover-emoji">{soundEnabled ? '🔊' : '🔇'}</span>
              <span className="effects-popover-label">{soundEnabled ? 'Sound on' : 'Muted'}</span>
            </button>
          </div>
        </div>

        {whiteboardOpen && (
          <div className="whiteboard-overlay">
            <div className="whiteboard-header">
              <div className="whiteboard-title">Class Whiteboard</div>
              <div className="whiteboard-header-actions">
                <button
                  onClick={() => setWhiteboardTool('pen')}
                  className={`whiteboard-tool-btn ${whiteboardTool === 'pen' ? 'whiteboard-tool-btn--active' : ''}`}
                  aria-label="Whiteboard pen"
                >
                  ✏️ Pen
                </button>
                <button
                  onClick={() => setWhiteboardTool('eraser')}
                  className={`whiteboard-tool-btn ${whiteboardTool === 'eraser' ? 'whiteboard-tool-btn--active' : ''}`}
                  aria-label="Whiteboard eraser"
                >
                  🧽 Eraser
                </button>
                <button onClick={whiteboardUndo} className="whiteboard-utility-btn" aria-label="Undo whiteboard stroke">
                  Undo
                </button>
                <button onClick={whiteboardClear} className="whiteboard-utility-btn whiteboard-utility-btn--danger" aria-label="Clear whiteboard">
                  Clear
                </button>
                <button onClick={() => setWhiteboardOpen(false)} className="whiteboard-close-btn" aria-label="Close whiteboard">
                  ✕
                </button>
              </div>
            </div>
            <div className="whiteboard-toolbar">
              <div className="whiteboard-colors">
                {['#0f172a', '#dc2626', '#2563eb', '#16a34a', '#d97706', '#7c3aed'].map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setWhiteboardColor(color);
                      setWhiteboardTool('pen');
                    }}
                    className={`whiteboard-color-dot ${whiteboardColor === color && whiteboardTool === 'pen' ? 'whiteboard-color-dot--active' : ''}`}
                    style={{ backgroundColor: color }}
                    aria-label={`Whiteboard color ${color}`}
                  />
                ))}
              </div>
              <div className="whiteboard-size-row">
                {ANNOTATE_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => setWhiteboardSize(size)}
                    className={`whiteboard-size-btn ${whiteboardSize === size ? 'whiteboard-size-btn--active' : ''}`}
                    aria-label={`Whiteboard size ${size}`}
                  >
                    <span style={{ width: Math.max(4, size), height: Math.max(4, size) }} />
                  </button>
                ))}
              </div>
            </div>
            <div className="whiteboard-canvas-wrap">
              <canvas
                ref={whiteboardCanvasRef}
                className="whiteboard-canvas"
                onPointerDown={onWhiteboardPointerDown}
                onPointerMove={onWhiteboardPointerMove}
                onPointerUp={onWhiteboardPointerUp}
                onPointerLeave={onWhiteboardPointerUp}
                style={{ touchAction: 'none' }}
              />
            </div>
          </div>
        )}

        {showControlsMessage && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg font-semibold">
            Restricted action blocked
          </div>
        )}

        {lessonLoadError && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white">
            <div className="max-w-lg p-6 border rounded-lg bg-red-50 border-red-200">
              <h3 className="text-lg font-semibold text-red-700">Unable to open lesson</h3>
              <p className="text-sm text-red-600 mt-2">{lessonLoadError}</p>
              {isLocalDebug && lessonLoadDebugError && (
                <div className="mt-3 rounded border border-red-200 bg-white p-2 text-xs text-red-700 font-mono whitespace-pre-wrap break-all">
                  {`code: ${lessonLoadDebugError.code || '(none)'}`}
                  <br />
                  {`message: ${lessonLoadDebugError.message || '(none)'}`}
                  <br />
                  {`details: ${formattedDebugDetails}`}
                </div>
              )}
            </div>
          </div>
        )}

        {sessionExpired && !lessonLoadError && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white">
            <div className="max-w-lg p-6 border rounded-lg bg-amber-50 border-amber-200">
              <h3 className="text-lg font-semibold text-amber-700">Access expired</h3>
              <p className="text-sm text-amber-700 mt-2">
                Your 50-minute access window has ended. Reopen this lesson from Lesson Library.
              </p>
              <div className="mt-4">
                <Button onClick={handleClose}>Back to Lesson Library</Button>
              </div>
            </div>
          </div>
        )}

        {lessonLoading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white">
            <div className="text-sm text-gray-600">Loading secure lesson viewer...</div>
          </div>
        )}

        {contentReady && !showWarning && (
          <iframe
            ref={canvaIframeRef}
            src={resolvedCanvaEmbedUrl}
            title={resolvedLessonTitle}
            className="w-full h-full border-0"
            allow="fullscreen"
            loading="eager"
            tabIndex={-1}
            onLoad={focusCanvaFrame}
            style={{ position: 'relative', zIndex: 10 }}
          />
        )}
      </div>
    </div>
  );
}
