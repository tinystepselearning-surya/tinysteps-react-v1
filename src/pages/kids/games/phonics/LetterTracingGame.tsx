// src/pages/kids/games/phonics/LetterTracingGame.tsx
// ✅ Mobile/tablet compatible (iPad/iPhone/Android): pointer-safe, gesture-safe, fullscreen-safe
// ✅ Fix: prevents auto-completing the whole letter after stroke 1.
// ✅ Completed strokes stay visible (proper letter formation).
// ✅ Forces a “lift and start again” between strokes.
// ✅ Fullscreen stable (native fullscreen when supported, “immersive mode” fallback when not).
// ✅ NEW: dropdown to jump to any letter in this level
// ✅ NEW: Next Letter button (skip current letter for testing)
// ✅ NEW: Confetti audio + center burst + continuous top-left/top-right shower (4s)
// ✅ NEW: Levels page shows game progress (no polling; manual refresh button)
//
// IMPORTANT: traceLetters.ts must be PURE TS (no JSX). JSX belongs here (.tsx).

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import {
  TRACE_LETTERS,
  TRACE_LEVELS,
  PRETRACE_ITEMS,
  PRETRACE_LEVEL,
  getEnabledPairsForLevel,
  isLevelReady,
  type LetterId,
  type PreTraceId,
  type TraceLetter,
  type TraceStroke,
  type TracePair,
} from "./tracing/traceLetters";
import { recordLevelResult } from "../../../../games/engine/recordLevelResult";

const BASE_ROUTE = "/kids/games/phonics/letter-tracing";
const GAME_ID = "letter-tracing";
const PROGRESS_DOC_ID = "phonics_letter_tracing";

type Mode = "levels" | "play";
type CaseStep = 0 | 1; // 0=Upper, 1=Lower
type Pt = { x: number; y: number; t: number; len: number };

// (prevents implicit-any even if TRACE_LEVELS is loosely typed)
type LevelPairView = { upper?: LetterId; lower?: LetterId };
type TraceLevelView = { levelId: number; title: string; subtitle?: string; pairs?: LevelPairView[] };

// --------------------
// Helpers
// --------------------
function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function parseTapPoint(pathD: string): { x: number; y: number } | null {
  const m = pathD.match(/M\s*([-\d.]+)\s+([-\d.]+)/i);
  if (!m) return null;
  return { x: Number(m[1]), y: Number(m[2]) };
}

// robust "M x y L x y" parser (accepts commas/newlines)
function parseLine(pathD: string): { a: { x: number; y: number }; b: { x: number; y: number } } | null {
  const m = pathD
    .trim()
    .match(/M\s*([-\d.]+)[\s,]+([-\d.]+)\s*L\s*([-\d.]+)[\s,]+([-\d.]+)/i);
  if (!m) return null;
  return {
    a: { x: Number(m[1]), y: Number(m[2]) },
    b: { x: Number(m[3]), y: Number(m[4]) },
  };
}

function useSvgPoint(svgRef: React.RefObject<SVGSVGElement | null>) {
  return (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const inv = ctm.inverse();
    const sp = pt.matrixTransform(inv);
    return { x: sp.x, y: sp.y };
  };
}

function hexToRgba(hex: string, a: number) {
  const h = hex.replace("#", "").trim();
  if (h.length !== 6) return `rgba(59,130,246,${a})`;
  const n = parseInt(h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}

// Slightly expand viewBox so letters sit more centered with breathing room
function expandViewBox(vb: string, pad = 10) {
  const parts = vb
    .trim()
    .split(/[\s,]+/)
    .map((s) => Number(s));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return vb;
  const [x, y, w, h] = parts;
  const p = Math.max(0, pad);
  return `${x - p} ${y - p} ${w + p * 2} ${h + p * 2}`;
}

// Native fullscreen helpers (Safari desktop uses webkit*; iOS Safari has no fullscreen API)
function getNativeFullscreenEl(): Element | null {
  const d: any = document;
  return document.fullscreenElement || d.webkitFullscreenElement || null;
}

async function requestFullscreenSafe(el: any) {
  try {
    if (el?.requestFullscreen) {
      await el.requestFullscreen({ navigationUI: "hide" } as any);
      return true;
    }
    if (el?.webkitRequestFullscreen) {
      el.webkitRequestFullscreen(); // Safari
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

async function exitFullscreenSafe() {
  try {
    const d: any = document;
    if (document.exitFullscreen) {
      await document.exitFullscreen();
      return;
    }
    if (d.webkitExitFullscreen) {
      d.webkitExitFullscreen();
      return;
    }
  } catch {
    // ignore
  }
}

/** -------- Progress helpers (flexible, works with multiple doc shapes) -------- */
function isUpperLetterId(x: string) {
  return /^[A-Z]$/.test(x);
}
function isLowerLetterId(x: string) {
  return /^[a-z]$/.test(x);
}

function extractMasteredItems(data: any): string[] {
  const candidates = [
    data?.masteredItems,
    data?.mastered,
    data?.itemsMastered,
    data?.summary?.masteredItems,
    data?.summary?.mastered,
    data?.stats?.masteredItems,
    data?.stats?.mastered,
    data?.progress?.masteredItems,
    data?.progress?.mastered,
  ];

  for (const c of candidates) {
    if (Array.isArray(c)) return c.map((v) => String(v)).filter(Boolean);
    if (c && typeof c === "object") {
      // map/object-set style { A:true, a:true } OR { A:{...} }
      return Object.keys(c).filter(Boolean);
    }
  }

  // last fallback: try scanning a "levels" object
  const levels = data?.levels;
  if (levels && typeof levels === "object") {
    const out: string[] = [];
    for (const k of Object.keys(levels)) {
      const lv = (levels as any)[k];
      const arr = lv?.masteredItems;
      if (Array.isArray(arr)) out.push(...arr.map((v: any) => String(v)));
    }
    return out.filter(Boolean);
  }

  return [];
}

function extractUpdatedAtMs(data: any): number | undefined {
  const candidates = [
    data?.updatedAt,
    data?.lastUpdatedAt,
    data?.refreshedAt,
    data?.syncedAt,
    data?.lastPlayedAt,
    data?.summary?.updatedAt,
    data?.stats?.updatedAt,
  ];

  for (const v of candidates) {
    if (!v) continue;
    if (typeof v === "number") return v;
    if (v instanceof Date) return v.getTime();
    if (typeof v?.toMillis === "function") return v.toMillis();
    if (typeof v?.seconds === "number") return v.seconds * 1000;
  }
  return undefined;
}

/** -------- Skill tag helpers (fixes upper/lower progress rollup) -------- */
function normalizeLetterTagFromId(letterId: string | null | undefined): string | null {
  if (!letterId) return null;
  const ch = String(letterId).trim().charAt(0);
  if (!/^[A-Za-z]$/.test(ch)) return null;
  return `letter:${ch.toLowerCase()}`; // ✅ always a-z
}

function caseTagFromStep(step: CaseStep): "case:upper" | "case:lower" {
  return step === 0 ? "case:upper" : "case:lower";
}

function stripLetterAndCaseTags(tags: string[]) {
  return (Array.isArray(tags) ? tags : []).filter((t) => {
    const s = String(t).toLowerCase();
    if (s.startsWith("letter:")) return false;
    if (s.startsWith("case:")) return false;
    return true;
  });
}

function uniqTags(tags: Array<string | null | undefined>) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const t of tags) {
    const v = (t ?? "").trim();
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function buildLetterTracingSkillTags(args: {
  baseTags: string[];
  isPretrace: boolean;
  levelForTracking: number;
  step: CaseStep;
  currentLetterId: LetterId | null;
}) {
  const cleanedBase = stripLetterAndCaseTags(args.baseTags);

  const letterTag = args.isPretrace ? null : normalizeLetterTagFromId(args.currentLetterId);
  const caseTag = args.isPretrace ? null : caseTagFromStep(args.step);
  const subtopicTag = args.isPretrace ? "subtopic:pretracing" : `subtopic:tracing_level_${args.levelForTracking}`;

  // ✅ Final tags used by rollup (case + normalized letter)
  return uniqTags([...cleanedBase, letterTag, caseTag, subtopicTag]);
}


type ProgressState = {
  status: "idle" | "loading" | "ready" | "error";
  mastered: Set<string>;
  sourcePath?: string;
  updatedAtMs?: number;
  error?: string;
};

const STROKE_COLORS = ["#2563EB", "#EC4899", "#22C55E", "#F59E0B", "#8B5CF6"] as const;

// ⭐ Your Canva asset (saved in /public/star.png)
const STAR_SRC = "/star.png";
// 🔊 Tracing sound (put tracing.mp3 in /public)
const TRACE_AUDIO_SRC = "/tracing.mp3";
// 🔊 Confetti sound (put confetti.mp3 in /public)
const CONFETTI_AUDIO_SRC = "/confetti.mp3";
// ⭐ sizes (reduce here)
const STAR_START_SIZE = 18;
const STAR_GUIDE_SIZE = 16;
const STAR_END_SIZE = 14;
// viewBox padding (center feel)
const VIEWBOX_PAD = 10;

function ConfettiBurst({ fire }: { fire: boolean }) {
  // Continuous corner shower + center burst (4s total)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const prevFireRef = useRef(false);
  const [burstId, setBurstId] = useState(0);

  useEffect(() => {
    const was = prevFireRef.current;
    if (fire && !was) setBurstId((n) => n + 1);
    prevFireRef.current = fire;
  }, [fire]);

  useEffect(() => {
    if (fire) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [fire]);

  useEffect(() => {
    if (!burstId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let W = 0;
    let H = 0;

    const resize = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const w = Math.max(1, canvas.clientWidth);
      const h = Math.max(1, canvas.clientHeight);
      W = w;
      H = h;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const rnd = (a: number, b: number) => a + Math.random() * (b - a);

    resize();

    const dur = 4000;

    type Piece = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      g: number;
      w: number;
      h: number;
      rot: number;
      vr: number;
      hue: number;
      born: number;
      life: number;
    };

    let pieces: Piece[] = [];

    const spawnRect = (p: Omit<Piece, "born" | "life">, now: number, life: number) => {
      pieces.push({ ...p, born: now, life });
    };

    const spawnCenterBurst = (now: number) => {
      const CENTER_COUNT = 220;
      for (let k = 0; k < CENTER_COUNT; k++) {
        const isStreamer = Math.random() < 0.35;
        const size = isStreamer ? 6 + Math.random() * 10 : 3 + Math.random() * 6;

        spawnRect(
          {
            x: W * (0.45 + Math.random() * 0.1),
            y: H * (0.4 + Math.random() * 0.1),
            vx: (Math.random() - 0.5) * (10 + Math.random() * 6),
            vy: -(7 + Math.random() * 10),
            g: 0.22 + Math.random() * 0.2,
            w: isStreamer ? size * 1.8 : size,
            h: isStreamer ? size * 0.55 : size,
            rot: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 0.35,
            hue: Math.floor(Math.random() * 360),
          },
          now,
          2200 + Math.random() * 900
        );
      }
    };

    const spawnShower = (side: "left" | "right", count: number, now: number) => {
      for (let k = 0; k < count; k++) {
        const isStreamer = Math.random() < 0.25;
        const size = isStreamer ? 6 + Math.random() * 9 : 3 + Math.random() * 6;
        const x = side === "left" ? W * rnd(0.05, 0.22) : W * rnd(0.78, 0.95);
        spawnRect(
          {
            x,
            y: rnd(-50, -10),
            vx: side === "left" ? rnd(0.6, 2.4) : rnd(-2.4, -0.6),
            vy: rnd(1.2, 3.8),
            g: 0.12 + Math.random() * 0.1,
            w: isStreamer ? size * 1.9 : size,
            h: isStreamer ? size * 0.55 : size,
            rot: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 0.25,
            hue: Math.floor(Math.random() * 360),
          },
          now,
          2400 + Math.random() * 900
        );
      }
    };

    const start = performance.now();
    spawnCenterBurst(start);

    const LEFT_RATE = 40;
    const RIGHT_RATE = 40;
    let leftAcc = 0;
    let rightAcc = 0;
    let prevNow = start;

    const tick = (now: number) => {
      const t = now - start;
      const dtMs = Math.max(0, now - prevNow);
      prevNow = now;
      const dtF = clamp(dtMs / 16.67, 0.5, 2.0);

      if (t < dur) {
        leftAcc += (LEFT_RATE * dtMs) / 1000;
        rightAcc += (RIGHT_RATE * dtMs) / 1000;
        const l = Math.floor(leftAcc);
        const r = Math.floor(rightAcc);
        if (l > 0) {
          leftAcc -= l;
          spawnShower("left", l, now);
        }
        if (r > 0) {
          rightAcc -= r;
          spawnShower("right", r, now);
        }
      }

      const globalFade = 1 - clamp((t - dur * 0.7) / (dur * 0.3), 0, 1);

      ctx.clearRect(0, 0, W, H);

      for (const p of pieces) {
        p.x += p.vx * dtF;
        p.y += p.vy * dtF;
        p.vy += p.g * dtF;
        p.rot += p.vr * dtF;
        p.vx *= 0.992;
        p.vy *= 0.996;
        const age = now - p.born;
        const lifeFade = 1 - clamp(age / p.life, 0, 1);
        const a = globalFade * lifeFade;
        if (a <= 0) continue;
        if (p.y > H + 120) continue;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = `hsla(${p.hue}, 92%, 58%, ${0.95 * a})`;
        ctx.strokeStyle = `hsla(${p.hue}, 92%, 40%, ${0.35 * a})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      pieces = pieces.filter((p) => {
        const age = now - p.born;
        if (age >= p.life) return false;
        if (p.y > H + 200) return false;
        return true;
      });

      if (pieces.length > 900) pieces = pieces.slice(pieces.length - 900);

      if (t < dur) {
        raf = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, W, H);
      }
    };

    raf = requestAnimationFrame(tick);

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, W, H);
    };
  }, [burstId]);

  return (
    <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" style={{ width: "100%", height: "100%" }} />
  );
}

export default function LetterTracingGame() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const fsRef = useRef<HTMLDivElement | null>(null);

  const kidId = searchParams.get("kidId") || localStorage.getItem("ts_active_kid_v1") || "";
  const fs = searchParams.get("fs") === "1";

  const levelParam = searchParams.get("level");
  const pairParam = searchParams.get("pair");
  const stepParam = searchParams.get("step");

  const mode: Mode = levelParam === null ? "levels" : "play";
  const levelIdRaw = levelParam === null ? null : Number(levelParam);
  const levelId = levelIdRaw === null || Number.isNaN(levelIdRaw) ? null : levelIdRaw;

  const pairIndexRaw = pairParam ? Number(pairParam) : 0;
  const pairIndex = Number.isNaN(pairIndexRaw) ? 0 : pairIndexRaw;

  const stepNumRaw = stepParam ? Number(stepParam) : 0;
  const step: CaseStep = stepNumRaw === 1 ? 1 : 0;

  const isPretrace = mode === "play" && levelId === 0;

  const enabledPairs: TracePair[] = useMemo(() => {
    if (mode !== "play" || isPretrace) return [];
    const lv = typeof levelId === "number" ? levelId : 1;
    return getEnabledPairsForLevel(lv);
  }, [mode, isPretrace, levelId]);

  const safePairIndex = useMemo(() => {
    if (isPretrace) return clamp(pairIndex, 0, PRETRACE_LEVEL.items.length - 1);
    const len = enabledPairs.length || 1;
    return clamp(pairIndex, 0, len - 1);
  }, [isPretrace, pairIndex, enabledPairs.length]);

  const currentPair = !isPretrace && mode === "play" ? enabledPairs[safePairIndex] ?? null : null;

  const currentLetterId: LetterId | null =
    !isPretrace && mode === "play" && currentPair?.upper
      ? step === 0
        ? currentPair.upper
        : currentPair.lower ?? null
      : null;

  const pretraceId: PreTraceId | null = isPretrace ? PRETRACE_LEVEL.items[safePairIndex] : null;

  const letterData: TraceLetter | null = isPretrace
    ? pretraceId
      ? PRETRACE_ITEMS[pretraceId]
      : null
    : currentLetterId
      ? (TRACE_LETTERS[currentLetterId] as TraceLetter | undefined) ?? null
      : null;

  // --------------------
  // Progress (Levels page only, no polling)
  // --------------------
  const [progress, setProgress] = useState<ProgressState>({
    status: "idle",
    mastered: new Set<string>(),
  });

  const fetchProgress = useCallback(async () => {
    if (!kidId) {
      setProgress({ status: "idle", mastered: new Set<string>() });
      return;
    }

    setProgress((p) => ({
      ...p,
      status: "loading",
      error: undefined,
    }));

    const db = getFirestore();

    // We try a few likely doc locations so it works even if your backend stores it differently.
    const candidates: Array<{ path: string[]; label: string }> = [
      { path: ["kids", kidId, "progress", PROGRESS_DOC_ID], label: "kids/{kidId}/progress/{docId}" },
      { path: ["kids", kidId, "gamesProgress", PROGRESS_DOC_ID], label: "kids/{kidId}/gamesProgress/{docId}" },
      { path: ["kids", kidId, "progress", GAME_ID], label: "kids/{kidId}/progress/{gameId}" },
      { path: ["kids", kidId, "gameSummaries", GAME_ID], label: "kids/{kidId}/gameSummaries/{gameId}" },
      { path: ["students", kidId, "progress", PROGRESS_DOC_ID], label: "students/{kidId}/progress/{docId}" },
      { path: ["students", kidId, "gamesProgress", PROGRESS_DOC_ID], label: "students/{kidId}/gamesProgress/{docId}" },
    ];

    for (const c of candidates) {
            try {
        const snap = await getDoc(doc(db, c.path.join("/")));

        if (!snap.exists()) continue;

        const data = snap.data();
        const items = extractMasteredItems(data);
        const updatedAtMs = extractUpdatedAtMs(data);

        setProgress({
          status: "ready",
          mastered: new Set(items),
          sourcePath: c.label,
          updatedAtMs,
        });
        return;
      } catch {
        // try next
      }
    }

    // nothing found yet (first-time users)
    setProgress({
      status: "ready",
      mastered: new Set<string>(),
      sourcePath: "not-found",
      updatedAtMs: undefined,
    });
  }, [kidId]);

  // Fetch ONCE when Levels page loads/returns. No polling.
  useEffect(() => {
    if (mode !== "levels") return;
    void fetchProgress();
  }, [mode, fetchProgress]);

  // --------------------
  // Stroke engine state
  // --------------------
  const [strokeIndex, setStrokeIndex] = useState(0);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [samples, setSamples] = useState<Pt[]>([]);
  const [rawLen, setRawLen] = useState(0);
  const [trimStartLen, setTrimStartLen] = useState(0);

  const [started, setStarted] = useState(false);
  const [lastIndex, setLastIndex] = useState(0);
  const lastIndexRef = useRef(0);

  const [letterDone, setLetterDone] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [timeStart, setTimeStart] = useState<number | null>(null);

  // refs (avoid timing issues)
  const startedRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const ignoreMovesRef = useRef(false);
  const capturedElRef = useRef<SVGSVGElement | null>(null);

  // --- timers (prevents old timeouts firing after navigation/reset) ---
  const timersRef = useRef<{ strokeAdvance?: number; confettiOff?: number }>({});

  const clearTimers = useCallback(() => {
    if (timersRef.current.strokeAdvance) {
      window.clearTimeout(timersRef.current.strokeAdvance);
      timersRef.current.strokeAdvance = undefined;
    }
    if (timersRef.current.confettiOff) {
      window.clearTimeout(timersRef.current.confettiOff);
      timersRef.current.confettiOff = undefined;
    }
  }, []);

  // unmount safety
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  // ⭐ hint star index
  const [hintIndex, setHintIndex] = useState(0);
  const hintIndexRef = useRef(0);

  // 🔊 Tracing audio
  const traceAudioRef = useRef<HTMLAudioElement | null>(null);
  const traceAudioPlayingRef = useRef(false);

  const startTraceAudio = useCallback(async () => {
    const a = traceAudioRef.current;
    if (!a) return;
    if (traceAudioPlayingRef.current) return;

    try {
      a.loop = true;
      a.volume = 0.7; // adjust if needed
      a.currentTime = 0;
      await a.play(); // may reject if not initiated by user gesture
      traceAudioPlayingRef.current = true;
    } catch {
      // ignore autoplay restrictions
    }
  }, []);

  const stopTraceAudio = useCallback(() => {
    const a = traceAudioRef.current;
    if (!a) return;
    try {
      a.pause();
      a.currentTime = 0;
    } catch {
      // ignore
    }
    traceAudioPlayingRef.current = false;
  }, []);

  // Tracks whether we successfully entered *native* fullscreen (so we can sync on ESC)
  const nativeFsEnteredRef = useRef(false);

  // 🔊 Confetti audio
  const confettiAudioRef = useRef<HTMLAudioElement | null>(null);
  const playConfettiSound = useCallback(async () => {
    const a = confettiAudioRef.current;
    if (!a) return;
    try {
      a.volume = 1;
      a.currentTime = 0;
      await a.play();
    } catch {
      // ignore autoplay/restriction issues
    }
  }, []);

  const currentStroke: TraceStroke | null = useMemo(() => {
    if (!letterData) return null;
    return letterData.strokes[strokeIndex] ?? null;
  }, [letterData, strokeIndex]);

  const renderViewBox = useMemo(() => {
    const vb = (letterData?.viewBox ?? "0 0 100 100").trim();
    return expandViewBox(vb, VIEWBOX_PAD);
  }, [letterData?.viewBox]);

  // ✅ Safe startT/endT
  const strokeStartT = useMemo(() => {
    return currentStroke && currentStroke.kind === "trace" ? currentStroke.startT : undefined;
  }, [currentStroke]);

  const strokeEndT = useMemo(() => {
    return currentStroke && currentStroke.kind === "trace" ? currentStroke.endT : undefined;
  }, [currentStroke]);

  const toSvg = useSvgPoint(svgRef);

  const currentColor = STROKE_COLORS[strokeIndex % STROKE_COLORS.length];
  const colorInk = (hex: string) => hexToRgba(hex, 0.72);
  const colorGuide = (hex: string) => hexToRgba(hex, 0.22);

  // ✅ Stop page scrolling/selection while playing (important for phones/tablets)
  useEffect(() => {
    if (mode !== "play") return;

    const prevOverflow = document.body.style.overflow;
    const prevTouchAction = (document.body.style as any).touchAction;
    const prevWebkitUserSelect = (document.body.style as any).webkitUserSelect;
    const prevUserSelect = (document.body.style as any).userSelect;

    document.body.style.overflow = "hidden";
    (document.body.style as any).touchAction = "none";
    (document.body.style as any).webkitUserSelect = "none";
    (document.body.style as any).userSelect = "none";

    return () => {
      document.body.style.overflow = prevOverflow;
      (document.body.style as any).touchAction = prevTouchAction;
      (document.body.style as any).webkitUserSelect = prevWebkitUserSelect;
      (document.body.style as any).userSelect = prevUserSelect;
    };
  }, [mode]);

  // ✅ If user exits *native* fullscreen (ESC), sync fs=1 only when we truly were native-fullscreen
  useEffect(() => {
    const onFsChange = () => {
      const nativeNow = !!getNativeFullscreenEl();
      if (nativeNow) return;

      if (nativeFsEnteredRef.current) {
        nativeFsEnteredRef.current = false;

        const sp = new URLSearchParams(window.location.search);
        if (sp.get("fs") === "1") {
          sp.delete("fs");
          setSearchParams(sp, { replace: true });
        }
      }
    };

    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange" as any, onFsChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange" as any, onFsChange);
    };
  }, [setSearchParams]);

  // ✅ Reset state when switching item (letter / pretrace item)
  useEffect(() => {
    clearTimers();
    setStrokeIndex(0);

    setStarted(false);
    setLastIndex(0);
    lastIndexRef.current = 0;

    startedRef.current = false;
    activePointerIdRef.current = null;
    ignoreMovesRef.current = false;
    capturedElRef.current = null;

    setLetterDone(false);
    setConfetti(false);
    setTimeStart(null);

    setHintIndex(0);
    hintIndexRef.current = 0;
  }, [currentLetterId, pretraceId, clearTimers]);

  // Stop trace audio on navigation or when changing strokes/letters
  useEffect(() => {
    stopTraceAudio();
  }, [mode, currentLetterId, pretraceId, strokeIndex, stopTraceAudio]);

  // ✅ Reset state when switching stroke (within same letter)
  useEffect(() => {
    setStarted(false);
    setLastIndex(0);
    lastIndexRef.current = 0;

    startedRef.current = false;
    activePointerIdRef.current = null;
    capturedElRef.current = null;
    ignoreMovesRef.current = false;

    setHintIndex(0);
    hintIndexRef.current = 0;
  }, [strokeIndex]);

  // Sampling for CURRENT stroke only
  useLayoutEffect(() => {
    if (!currentStroke || currentStroke.kind === "tap") {
      setSamples([]);
      setRawLen(0);
      setTrimStartLen(0);
      return;
    }

    const d = (currentStroke.pathD ?? "").trim();
    if (!d) {
      setSamples([]);
      setRawLen(0);
      setTrimStartLen(0);
      return;
    }

    const startT0 = typeof strokeStartT === "number" ? strokeStartT : 0;
    const endT0 = typeof strokeEndT === "number" ? strokeEndT : 1;
    const startT = clamp(startT0, 0, 0.999);
    const endT = clamp(endT0, startT + 0.001, 1);

    const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathEl.setAttribute("d", d);

    let len = 0;
    try {
      len = pathEl.getTotalLength();
    } catch {
      len = 0;
    }

    // Straight line fallback
    if (!len || len <= 0) {
      const line = parseLine(d);
      if (!line) {
        setSamples([]);
        setRawLen(0);
        setTrimStartLen(0);
        return;
      }

      const dx = line.b.x - line.a.x;
      const dy = line.b.y - line.a.y;
      const realLen = Math.max(0.0001, Math.sqrt(dx * dx + dy * dy));

      const sLen = realLen * startT;
      const eLen = realLen * endT;
      const wLen = Math.max(0.0001, eLen - sLen);

      const count = 220;
      const pts: Pt[] = [];
      for (let i = 0; i <= count; i++) {
        const t = i / count;
        const l = sLen + wLen * t;
        const along = l / realLen;
        const x = line.a.x + dx * along;
        const y = line.a.y + dy * along;
        pts.push({ x, y, t, len: l - sLen });
      }

      setRawLen(realLen);
      setTrimStartLen(sLen);
      setSamples(pts);

      setLastIndex(0);
      lastIndexRef.current = 0;
      return;
    }

    // General SVG path sampling
    const sLen = len * startT;
    const eLen = len * endT;
    const wLen = Math.max(0.0001, eLen - sLen);

    const count = 220;
    const pts: Pt[] = [];
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const l = sLen + wLen * t;
      const p = pathEl.getPointAtLength(l);
      pts.push({ x: p.x, y: p.y, t, len: l - sLen });
    }

    setRawLen(len);
    setTrimStartLen(sLen);
    setSamples(pts);

    setLastIndex(0);
    lastIndexRef.current = 0;
  }, [currentStroke?.pathD, currentStroke?.kind, strokeStartT, strokeEndT]);

  const isTap = currentStroke?.kind === "tap";

  const startPt = useMemo(() => {
    if (!currentStroke) return { x: 0, y: 0 };
    if (currentStroke.kind === "tap") return parseTapPoint(currentStroke.pathD) ?? { x: 0, y: 0 };
    return samples[0] ? { x: samples[0].x, y: samples[0].y } : { x: 0, y: 0 };
  }, [currentStroke, samples]);

  const endPt = useMemo(() => {
    if (!currentStroke) return { x: 0, y: 0 };
    if (currentStroke.kind === "tap") return startPt;
    const last = samples[samples.length - 1];
    return last ? { x: last.x, y: last.y } : { x: 0, y: 0 };
  }, [currentStroke, samples, startPt]);

  // ⭐ animate hint along path while idle (SLOWER now)
  useEffect(() => {
    if (letterDone) return;
    if (!currentStroke || currentStroke.kind === "tap") return;
    if (!samples.length) return;
    if (started || lastIndex > 0) return;

    let raf = 0;
    const durMs = 7600;
    const t0 = performance.now();

    const tick = (now: number) => {
      const frac = ((now - t0) % durMs) / durMs;
      const idx = Math.floor(frac * (samples.length - 1));
      if (idx !== hintIndexRef.current) {
        hintIndexRef.current = idx;
        setHintIndex(idx);
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [letterDone, currentStroke?.id, currentStroke?.kind, currentStroke?.pathD, samples.length, started, lastIndex]);

  const guideIndex = useMemo(() => {
    if (!samples.length) return 0;
    return started || lastIndex > 0 ? clamp(lastIndex, 0, samples.length - 1) : clamp(hintIndex, 0, samples.length - 1);
  }, [samples.length, started, lastIndex, hintIndex]);

  const guidePt = useMemo(() => {
    if (!currentStroke) return startPt;
    if (currentStroke.kind === "tap") return startPt;
    if (!samples.length) return startPt;
    const i = guideIndex;
    return { x: samples[i].x, y: samples[i].y };
  }, [currentStroke, samples, guideIndex, startPt]);

  const progressLen = useMemo(() => {
    if (!currentStroke || currentStroke.kind === "tap") return 0;
    if (!samples.length) return 0;
    const i = clamp(lastIndex, 0, samples.length - 1);
    return samples[i].len;
  }, [currentStroke, samples, lastIndex]);

  const guideDots = useMemo(() => {
    if (!currentStroke || currentStroke.kind === "tap") return [];
    if (!samples.length) return [];
    const count = 14;
    const dots: { x: number; y: number; key: number }[] = [];
    for (let i = 0; i < count; i++) {
      const ii = Math.floor((i / (count - 1)) * (samples.length - 1));
      const p = samples[ii];
      dots.push({ x: p.x, y: p.y, key: ii });
    }
    return dots;
  }, [currentStroke, samples]);

  // completed strokes stay visible
  const totalStrokes = letterData?.strokes?.length ?? 0;
  const completedCount = letterDone ? totalStrokes : Math.min(totalStrokes, strokeIndex + (ignoreMovesRef.current ? 1 : 0));

  const completedStrokes = useMemo(() => {
    if (!letterData) return [];
    return (letterData.strokes ?? []).slice(0, Math.max(0, Math.min(completedCount, letterData.strokes.length)));
  }, [letterData, completedCount]);

  const allTraceStrokes = useMemo(() => {
    if (!letterData) return [];
    return (letterData.strokes ?? []).filter((s) => s.kind === "trace" && (s.pathD ?? "").trim().length > 0);
  }, [letterData]);

  const showProgress = !letterDone && !isTap && lastIndex > 0 && rawLen > 0;
  const dashArray = rawLen > 0 ? `${progressLen} ${rawLen}` : undefined;
  const dashOffset = rawLen > 0 ? `${-trimStartLen}` : undefined;

  // ✅ dropdown options (jump to any letter in this level)
  const jumpOptions = useMemo(() => {
    if (mode !== "play" || isPretrace) return [];
    const lv = levelId ?? 1;
    return enabledPairs.flatMap((p, idx) => {
      const opts: { value: string; label: string }[] = [];
      if (p.upper) opts.push({ value: `${idx}|0`, label: `${p.upper} (Capital · L${lv})` });
      if (p.lower) opts.push({ value: `${idx}|1`, label: `${p.lower} (Small · L${lv})` });
      return opts;
    });
  }, [mode, isPretrace, levelId, enabledPairs]);

  // --------------------
  // Navigation helpers
  // --------------------
  function navigateTo(sp: URLSearchParams, replace: boolean) {
    const query = sp.toString();
    const url = query ? `${BASE_ROUTE}?${query}` : BASE_ROUTE;
    navigate(url, { replace });
  }

  function goGamesPortal() {
    try {
      const s = (window.history && (window.history.state as any)) || null;
      if (s && typeof s.idx === "number" && s.idx > 0) {
        navigate(-1);
        return;
      }
    } catch {}

    const sp = new URLSearchParams();
    if (kidId) sp.set("kidId", kidId);
    const url = sp.toString() ? `/kids/games/phonics?${sp.toString()}` : "/kids/games/phonics";
    navigate(url, { replace: true });
  }

  function navigatePlay(levelNum: number, pairIdx: number, stepNum: CaseStep, replace = false) {
    const sp = new URLSearchParams();
    if (kidId) sp.set("kidId", kidId);
    sp.set("level", String(levelNum));
    sp.set("pair", String(pairIdx));
    sp.set("step", String(stepNum));
    if (getNativeFullscreenEl() || fs) sp.set("fs", "1");
    navigateTo(sp, replace);
  }

  async function handlePlayButtonClick(levelNum: number, pairIdx: number, stepNum: CaseStep) {
    clearTimers();
    const sp = new URLSearchParams();
    if (kidId) sp.set("kidId", kidId);
    sp.set("level", String(levelNum));
    sp.set("pair", String(pairIdx));
    sp.set("step", String(stepNum));

    sp.set("fs", "1");
    navigateTo(sp, false);

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    const wrapper = fsRef.current;
    if (!wrapper) return;

    const ok = await requestFullscreenSafe(wrapper as any);
    if (ok) nativeFsEnteredRef.current = true;
  }

  async function setFs(on: boolean) {
    clearTimers();
    if (on) {
      const sp = new URLSearchParams(window.location.search);
      sp.set("fs", "1");
      setSearchParams(sp, { replace: true });

      const wrapper = fsRef.current;
      if (wrapper) {
        const ok = await requestFullscreenSafe(wrapper as any);
        if (ok) nativeFsEnteredRef.current = true;
      }
      return;
    }

    const sp = new URLSearchParams(window.location.search);
    sp.delete("fs");
    setSearchParams(sp, { replace: true });

    if (getNativeFullscreenEl()) {
      await exitFullscreenSafe();
    }
    nativeFsEnteredRef.current = false;
  }

  function goLevels() {
    clearTimers();
    setFs(false);
    const sp = new URLSearchParams();
    if (kidId) sp.set("kidId", kidId);
    navigateTo(sp, true);
  }

  function replay() {
    clearTimers();
    setStrokeIndex(0);
    setStarted(false);

    setLastIndex(0);
    lastIndexRef.current = 0;

    startedRef.current = false;
    activePointerIdRef.current = null;
    ignoreMovesRef.current = false;
    capturedElRef.current = null;

    setLetterDone(false);
    setConfetti(false);
    setTimeStart(null);

    setHintIndex(0);
    hintIndexRef.current = 0;
  }

  function goNext() {
    clearTimers();
    if (mode !== "play") return;

    if (isPretrace) {
      const nextIdx = safePairIndex + 1;
      if (nextIdx < PRETRACE_LEVEL.items.length) {
        navigatePlay(0, nextIdx, 0, false);
        return;
      }
      navigatePlay(1, 0, 0, false);
      return;
    }

    const currentLevelId = levelId ?? 1;

    if (step === 0) {
      if (currentPair?.lower) navigatePlay(currentLevelId, safePairIndex, 1, false);
      else navigatePlay(currentLevelId, safePairIndex + 1, 0, false);
      return;
    }

    const nextPair = safePairIndex + 1;
    if (nextPair < enabledPairs.length) {
      navigatePlay(currentLevelId, nextPair, 0, false);
      return;
    }

    const nextLevelId = currentLevelId + 1;
    if (nextLevelId <= (TRACE_LEVELS as unknown as TraceLevelView[]).length) {
      navigatePlay(nextLevelId, 0, 0, false);
      return;
    }

    goLevels();
  }

  function completeStroke() {
    clearTimers();
    stopTraceAudio();
    ignoreMovesRef.current = true;

    const pid = activePointerIdRef.current;
    const el = capturedElRef.current;
    if (pid !== null && el) {
      try {
        (el as any).releasePointerCapture?.(pid);
      } catch {}
    }

    startedRef.current = false;
    activePointerIdRef.current = null;
    capturedElRef.current = null;

    setStarted(false);
    setLastIndex(0);
    lastIndexRef.current = 0;

    const nextStroke = strokeIndex + 1;
    if (letterData && nextStroke < letterData.strokes.length) {
      timersRef.current.strokeAdvance = window.setTimeout(() => {
        ignoreMovesRef.current = false;
        setStrokeIndex((prev) => prev + 1);
      }, 220);
      return;
    }

    setLetterDone(true);

    setConfetti(true);
    timersRef.current.confettiOff = window.setTimeout(() => setConfetti(false), 4000);
    void playConfettiSound();

        if (!kidId) return;

    try {
      const spentMs = timeStart ? Math.max(0, Math.round(performance.now() - timeStart)) : 0;
      const levelForTracking = isPretrace ? 0 : levelId ?? 1;
      const mastered = isPretrace ? pretraceId ?? "" : currentLetterId ?? "";

      const baseTags = Array.isArray(letterData?.skillTags) ? letterData!.skillTags : [];

      const skillTags = buildLetterTracingSkillTags({
        baseTags,
        isPretrace,
        levelForTracking,
        step,
        currentLetterId,
      });

      const tagDeltas: Record<string, { attempts: number; correct: number; wrong: number }> =
        Object.fromEntries(skillTags.map((tag) => [tag, { attempts: 1, correct: 1, wrong: 0 }]));

      // Fire-and-forget progress write
      recordLevelResult({
        gameId: GAME_ID,
        progressDocId: PROGRESS_DOC_ID,
        kidId,
        levelId: levelForTracking,
        completed: true,
        accuracyPct: 100,
        durationSec: Math.round(spentMs / 1000),
        score: 100,
        skillTags,
        tagDeltas,
        masteredItems: [mastered].filter(Boolean),
        completedAt: Date.now(),
      } as any).catch(() => {});
    } catch {
      // never block gameplay for tracking errors
    }
  }



  // --------------------
  // Pointer handling
  // --------------------
  function handlePointerDown(e: React.PointerEvent) {
    if (letterDone) return;
    if (!currentStroke) return;
    if (ignoreMovesRef.current) return;

    e.preventDefault();
    capturedElRef.current = e.currentTarget as unknown as SVGSVGElement;

    if (timeStart === null) setTimeStart(performance.now());

    const p = toSvg(e.clientX, e.clientY);

    if (currentStroke.kind === "tap") {
      const target = parseTapPoint(currentStroke.pathD);
      if (!target) return;
      if (dist(p, target) <= 10) completeStroke();
      return;
    }

    const startRadius = 14;
    const resumeRadius = 18;

    const hasProgress = lastIndexRef.current > 0 && samples.length > 0;
    const resumePt = hasProgress ? samples[clamp(lastIndexRef.current, 0, samples.length - 1)] : startPt;
    const allowedR = hasProgress ? resumeRadius : startRadius;

    if (dist(p, resumePt) > allowedR) return;

    void startTraceAudio();

    startedRef.current = true;
    activePointerIdRef.current = e.pointerId;

    setStarted(true);

    if (!hasProgress) {
      setLastIndex(0);
      lastIndexRef.current = 0;
    }

    (e.currentTarget as any).setPointerCapture?.(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (letterDone) return;
    if (!currentStroke || currentStroke.kind === "tap") return;

    if (ignoreMovesRef.current) return;
    if (!startedRef.current) return;
    if (activePointerIdRef.current !== e.pointerId) return;
    if (!samples.length) return;

    e.preventDefault();

    const p = toSvg(e.clientX, e.clientY);

    const tolerance = 12;
    const i0 = clamp(lastIndexRef.current, 0, samples.length - 1);
    const window = 34;

    let bestI = i0;
    let bestD = Infinity;

    const startI = i0;
    const endI = clamp(i0 + window, 0, samples.length - 1);

    for (let i = startI; i <= endI; i++) {
      const d = dist(p, samples[i]);
      if (d < bestD) {
        bestD = d;
        bestI = i;
      }
    }

    if (bestD <= tolerance) {
      lastIndexRef.current = bestI;
      setLastIndex(bestI);

      if (bestI >= samples.length - 2) completeStroke();
    }
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (activePointerIdRef.current === e.pointerId) {
      stopTraceAudio();
      try {
        (e.currentTarget as any).releasePointerCapture?.(e.pointerId);
      } catch {}

      activePointerIdRef.current = null;
      startedRef.current = false;
      capturedElRef.current = null;

      setStarted(false);
    }
  }

  // --------------------
  // Levels screen (UX upgrade only — no logic changes)
  // --------------------
  if (mode === "levels") {
    const LEVELS = TRACE_LEVELS as unknown as TraceLevelView[];
    const mastered = progress.mastered;

    // chips for warmup (keep ids so we can show completion state)
    const pretraceChips = (PRETRACE_LEVEL.items ?? [])
      .map((id) => ({ id, label: PRETRACE_ITEMS[id]?.label ?? String(id) }))
      .filter((x) => Boolean(x.label))
      .slice(0, 6);

    // overall counts
    const preTotal = PRETRACE_LEVEL.items.length;
    const preDone = PRETRACE_LEVEL.items.filter((id) => mastered.has(String(id))).length;

    const upperSet = new Set<string>();
    const lowerSet = new Set<string>();
    for (const lv of LEVELS) {
      for (const p of lv.pairs ?? []) {
        if (p.upper) upperSet.add(String(p.upper));
        if (p.lower) lowerSet.add(String(p.lower));
      }
    }
    const upperTotal = upperSet.size;
    const lowerTotal = lowerSet.size;
    const upperDone = Array.from(upperSet).filter((id) => mastered.has(id)).length;
    const lowerDone = Array.from(lowerSet).filter((id) => mastered.has(id)).length;

    const letterTotal = upperTotal + lowerTotal;
    const letterDoneCount = upperDone + lowerDone;
    const letterPct = letterTotal > 0 ? Math.round((letterDoneCount / letterTotal) * 100) : 0;

    const updatedLabel =
      progress.updatedAtMs && Number.isFinite(progress.updatedAtMs)
        ? new Date(progress.updatedAtMs).toLocaleString()
        : undefined;

    const levelProgress = (lv: TraceLevelView) => {
      const ids: string[] = [];
      for (const p of lv.pairs ?? []) {
        if (p.upper) ids.push(String(p.upper));
        if (p.lower) ids.push(String(p.lower));
      }
      const unique = Array.from(new Set(ids));
      const done = unique.filter((id) => mastered.has(id)).length;
      const total = unique.length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      return { done, total, pct };
    };

    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="relative overflow-hidden rounded-[28px] border bg-white/60 p-6 shadow-sm backdrop-blur">
          <div className="pointer-events-none absolute -top-24 left-[-10%] h-72 w-72 rounded-full bg-sky-200/50 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-[-10%] h-72 w-72 rounded-full bg-pink-200/50 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.22),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(244,114,182,0.18),transparent_45%),radial-gradient(circle_at_45%_85%,rgba(34,197,94,0.10),transparent_45%)]" />

          <div className="relative">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">Letter Tracing Adventure</h1>

                <p className="mt-2 max-w-2xl text-sm text-slate-700">
                  Start with warm-up shapes → then trace <span className="font-semibold">Capital</span> and{" "}
                  <span className="font-semibold">Small</span> letters.
                </p>

                {/* Progress summary */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-extrabold text-slate-800 ring-1 ring-white/60">
                    🎯 Letters: {letterDoneCount}/{letterTotal} ({letterPct}%)
                  </span>
                  <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-extrabold text-slate-800 ring-1 ring-white/60">
                    🔠 Capital: {upperDone}/{upperTotal}
                  </span>
                  <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-extrabold text-slate-800 ring-1 ring-white/60">
                    🔡 Small: {lowerDone}/{lowerTotal}
                  </span>
                  <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-extrabold text-slate-800 ring-1 ring-white/60">
                    ✍️ Warm-up: {preDone}/{preTotal}
                  </span>
                  {updatedLabel && (
                    <span className="rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-white/60">
                      Last synced: {updatedLabel}
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mt-3 w-full max-w-xl">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/60">
                    <div className="h-full rounded-full bg-emerald-500/70" style={{ width: `${letterPct}%` }} />
                  </div>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-2">
                <button
                  onClick={goGamesPortal}
                  className="rounded-full border bg-white/80 px-4 py-2 text-sm font-semibold shadow-sm hover:shadow-md"
                >
                  ← Back to Games
                </button>

                <button
                  onClick={() => void fetchProgress()}
                  disabled={!kidId || progress.status === "loading"}
                  className={[
                    "rounded-full border bg-white/80 px-4 py-2 text-sm font-semibold shadow-sm hover:shadow-md",
                    (!kidId || progress.status === "loading") ? "opacity-60 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  {progress.status === "loading" ? "Refreshing…" : "Refresh progress"}
                </button>

                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-white/60">
                  ⭐ Start at the star
                </span>
                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-white/60">
                  ✋ Lift between strokes
                </span>
                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-white/60">
                  🎉 Earn confetti
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Learning Path */}
              <div className="lg:col-span-2">
                <div className="relative rounded-3xl border border-white/60 bg-white/65 p-4 shadow-sm backdrop-blur">
                  <div className="pointer-events-none absolute left-7 top-6 bottom-6 w-[3px] rounded-full bg-gradient-to-b from-sky-300 via-fuchsia-300 to-emerald-300 opacity-60" />

                  <div className="space-y-4 pl-12">
                    {/* Level 0 */}
                    <button
                      onClick={() => handlePlayButtonClick(0, 0, 0)}
                      className={[
                        "group relative w-full rounded-3xl border border-white/60 bg-gradient-to-r from-white/85 to-sky-50/60 p-4 text-left shadow-sm transition",
                        "hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0",
                      ].join(" ")}
                    >
                      <div className="absolute -left-[52px] top-1/2 -translate-y-1/2">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow ring-4 ring-sky-100">
                          <span className="animate-bounce text-lg">🚀</span>
                        </div>
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-lg font-extrabold text-slate-900">{PRETRACE_LEVEL.title}</div>
                          <div className="mt-0.5 text-sm font-semibold text-slate-600">{PRETRACE_LEVEL.subtitle}</div>
                        </div>

                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700 ring-1 ring-emerald-100">
                          <span className="animate-pulse">●</span> Ready
                          <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-extrabold text-slate-800 ring-1 ring-white/60">
                            {preDone}/{preTotal}
                          </span>
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {pretraceChips.map((c, i) => {
                          const done = mastered.has(String(c.id));
                          return (
                            <span
                              key={`${c.label}-${i}`}
                              className={[
                                "rounded-full px-3 py-1 text-xs font-semibold ring-1",
                                done
                                  ? "bg-emerald-50 text-emerald-800 ring-emerald-100"
                                  : "bg-white/80 text-slate-700 ring-white/70",
                              ].join(" ")}
                            >
                              {c.label}
                              {done ? " ✓" : ""}
                            </span>
                          );
                        })}
                        <span className="rounded-full bg-slate-900/90 px-3 py-1 text-xs font-semibold text-white">
                          {PRETRACE_LEVEL.items.length} activities
                        </span>
                      </div>

                      <div className="mt-3">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/60">
                          <div
                            className="h-full rounded-full bg-emerald-500/70"
                            style={{ width: `${preTotal > 0 ? Math.round((preDone / preTotal) * 100) : 0}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-xs font-semibold text-slate-600">Start here to make hands ready ✨</div>
                        <div className="text-sm font-black text-slate-900/50 transition group-hover:translate-x-1">→</div>
                      </div>
                    </button>

                    {/* Levels 1+ */}
                    {LEVELS.map((lv: any) => {
                      const ready = isLevelReady(lv.levelId);
                      const lp = levelProgress(lv);

                      const pairBadges = (lv.pairs ?? [])
                        .map((p: any) => {
                          const label = p?.upper && p?.lower ? `${p.upper}${p.lower}` : p?.upper ? String(p.upper) : p?.lower ? String(p.lower) : "";
                          if (!label) return null;
                          const done =
                            (p?.upper ? mastered.has(String(p.upper)) : true) && (p?.lower ? mastered.has(String(p.lower)) : true);
                          return { label, done };
                        })
                        .filter(Boolean) as Array<{ label: string; done: boolean }>;

                      const shownPairs = pairBadges.slice(0, 6);
                      const more = Math.max(0, pairBadges.length - shownPairs.length);

                      return (
                        <button
                          key={lv.levelId}
                          disabled={!ready}
                          onClick={() => handlePlayButtonClick(lv.levelId, 0, 0)}
                          className={[
                            "group relative w-full rounded-3xl border p-4 text-left shadow-sm transition backdrop-blur",
                            ready
                              ? "border-white/60 bg-gradient-to-r from-white/85 to-pink-50/60 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                              : "cursor-not-allowed border-white/40 bg-white/50 opacity-60",
                          ].join(" ")}
                        >
                          <div className="absolute -left-[52px] top-1/2 -translate-y-1/2">
                            <div
                              className={[
                                "flex h-11 w-11 items-center justify-center rounded-full bg-white shadow ring-4",
                                ready ? "ring-fuchsia-100" : "ring-slate-100",
                              ].join(" ")}
                            >
                              <span className="text-lg">{ready ? "⭐" : "🔒"}</span>
                            </div>
                          </div>

                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-lg font-extrabold text-slate-900">{lv.title}</div>
                              {lv.subtitle && (
                                <div className="mt-0.5 text-sm font-semibold text-slate-600">{lv.subtitle}</div>
                              )}
                            </div>

                            {ready ? (
                              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700 ring-1 ring-emerald-100">
                                <span className="animate-pulse">●</span> Ready
                                <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-extrabold text-slate-800 ring-1 ring-white/60">
                                  {lp.done}/{lp.total}
                                </span>
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-600 ring-1 ring-slate-200">
                                Coming soon
                              </span>
                            )}
                          </div>

                          {pairBadges.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {shownPairs.map((t) => (
                                <span
                                  key={t.label}
                                  className={[
                                    "rounded-full px-3 py-1 text-xs font-semibold ring-1",
                                    t.done
                                      ? "bg-emerald-50 text-emerald-800 ring-emerald-100"
                                      : "bg-white/80 text-slate-700 ring-white/70",
                                  ].join(" ")}
                                >
                                  {t.label}
                                  {t.done ? " ✓" : ""}
                                </span>
                              ))}
                              {more > 0 && (
                                <span className="rounded-full bg-slate-900/90 px-3 py-1 text-xs font-semibold text-white">
                                  +{more} more
                                </span>
                              )}
                            </div>
                          )}

                          {ready && lp.total > 0 && (
                            <div className="mt-3">
                              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/60">
                                <div className="h-full rounded-full bg-emerald-500/70" style={{ width: `${lp.pct}%` }} />
                              </div>
                            </div>
                          )}

                          <div className="mt-3 flex items-center justify-between">
                            <div className="text-xs font-semibold text-slate-600">
                              {ready ? "Tap to begin this level" : "Locked for now"}
                            </div>
                            <div className="text-sm font-black text-slate-900/50 transition group-hover:translate-x-1">→</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right “How to play” panel */}
              <div className="lg:col-span-1">
                <div className="rounded-3xl border border-white/60 bg-white/65 p-5 shadow-sm backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-extrabold text-slate-900">How to play</div>
                    <div className="text-xs font-semibold text-slate-600">Quick tips</div>
                  </div>

                  <ol className="mt-4 space-y-3 text-sm text-slate-700">
                    <li className="flex gap-3">
                      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-extrabold">
                        1
                      </span>
                      <div>
                        <div className="font-bold text-slate-900">Warm-up first</div>
                        <div className="text-slate-600">Lines & curves make handwriting easy.</div>
                      </div>
                    </li>

                    <li className="flex gap-3">
                      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 text-pink-700 font-extrabold">
                        2
                      </span>
                      <div>
                        <div className="font-bold text-slate-900">Capital → Small</div>
                        <div className="text-slate-600">Trace big letter, then small letter.</div>
                      </div>
                    </li>

                    <li className="flex gap-3">
                      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-extrabold">
                        3
                      </span>
                      <div>
                        <div className="font-bold text-slate-900">Slow & steady</div>
                        <div className="text-slate-600">Follow the moving star carefully.</div>
                      </div>
                    </li>
                  </ol>

                  <div className="mt-5 rounded-2xl bg-slate-900/90 p-4 text-white">
                    <div className="text-sm font-extrabold">Pro tip</div>
                    <p className="mt-1 text-sm text-white/80">
                      Use <span className="font-semibold text-white">Fullscreen</span> (or immersive mode) for the best tracing experience.
                    </p>
                  </div>

                  <div className="mt-4 text-xs font-semibold text-slate-500">
                    🌟 This screen is a “learning path” — kids feel like they’re moving forward level by level.
                  </div>

                  {/* Debug hint (safe to keep, helps you validate which doc it read) */}
                  {progress.status === "ready" && progress.sourcePath && progress.sourcePath !== "not-found" && (
                    <div className="mt-3 text-[11px] font-semibold text-slate-400">
                      Progress source: {progress.sourcePath}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 text-center text-xs font-semibold text-slate-600">
              Tip: Start from Level 0 even if the child knows letters — it improves pencil control ✍️
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------
  // Play guards
  // --------------------
  if (!letterData || !currentStroke) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="rounded-xl border bg-white p-6">
          <div className="text-lg font-semibold text-slate-900">This item isn't ready yet.</div>
          <button onClick={goLevels} className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-white">
            Back to Levels
          </button>
        </div>
      </div>
    );
  }

  const strokeNo = strokeIndex + 1;

  const headerLabel = isPretrace
    ? `Level 0 • ${letterData.label} • Stroke ${strokeNo}/${totalStrokes}`
    : `Level ${levelId ?? 1} • Pair ${safePairIndex + 1}/${enabledPairs.length || 1} • ${
        step === 0 ? "Capital" : "Small"
      } • Letter: ${currentLetterId ?? ""} • Stroke ${strokeNo}/${totalStrokes}`;

  // fs=1 is immersive mode (fixed), even if native fullscreen isn't supported (iOS)
  const wrapperClass = fs ? "fixed left-0 right-0 top-0 z-[9999] bg-slate-50" : "mx-auto w-full max-w-6xl px-4 py-6";

  return (
    <div
      ref={fsRef}
      className={wrapperClass}
      style={
        fs
          ? {
              height: "100dvh",
              paddingTop: "calc(16px + env(safe-area-inset-top))",
              paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
              paddingLeft: "calc(16px + env(safe-area-inset-left))",
              paddingRight: "calc(16px + env(safe-area-inset-right))",
              touchAction: "none",
              WebkitUserSelect: "none",
              userSelect: "none",
              WebkitTapHighlightColor: "transparent",
            }
          : {
              touchAction: "none",
              WebkitUserSelect: "none",
              userSelect: "none",
              WebkitTapHighlightColor: "transparent",
            }
      }
      onContextMenu={(e) => e.preventDefault()}
    >
      <audio ref={traceAudioRef} src={TRACE_AUDIO_SRC} preload="auto" />
      <audio ref={confettiAudioRef} src={CONFETTI_AUDIO_SRC} preload="auto" />

      <div className={fs ? "flex h-full w-full flex-col gap-3" : ""}>
        <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-2">
          <div className="rounded-full border bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-800">
            {headerLabel}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isPretrace && jumpOptions.length > 0 && (
              <select
                value={`${safePairIndex}|${step}`}
                onChange={(e) => {
                  const [pi, st] = e.target.value.split("|").map((x) => Number(x));
                  navigatePlay(levelId ?? 1, Number.isFinite(pi) ? pi : 0, st === 1 ? 1 : 0, false);
                }}
                className="rounded-full border bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800"
              >
                {jumpOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}

            <button onClick={goNext} className="rounded-full border bg-white px-4 py-2 text-xs sm:text-sm font-semibold">
              Next
            </button>

            {fs ? (
              <button
                onClick={() => setFs(false)}
                className="rounded-full border bg-white px-4 py-2 text-xs sm:text-sm font-semibold"
              >
                Exit
              </button>
            ) : (
              <button
                onClick={() => setFs(true)}
                className="rounded-full border bg-white px-4 py-2 text-xs sm:text-sm font-semibold"
              >
                Fullscreen
              </button>
            )}

            <button onClick={goLevels} className="rounded-full border bg-white px-4 py-2 text-xs sm:text-sm font-semibold">
              Levels
            </button>
          </div>
        </div>

        <div
          className={`relative overflow-hidden rounded-2xl border shadow-sm ${fs ? "flex-1 min-h-0" : ""}`}
          style={{
            background:
              "radial-gradient(circle at 20% 20%, rgba(56,189,248,0.18), transparent 55%), radial-gradient(circle at 80% 30%, rgba(244,114,182,0.16), transparent 55%), radial-gradient(circle at 45% 85%, rgba(34,197,94,0.10), transparent 55%), linear-gradient(135deg, #f8fbff 0%, #fff7fb 45%, #fffdf7 100%)",
          }}
        >
          <ConfettiBurst fire={confetti} />

          <div className="relative h-full w-full" style={!fs ? { aspectRatio: "16 / 9", minHeight: "55vh" } : {}}>
            <svg
              ref={svgRef}
              viewBox={renderViewBox}
              preserveAspectRatio="xMidYMid meet"
              className="absolute inset-0 h-full w-full touch-none select-none"
              style={{
                touchAction: "none",
                WebkitUserSelect: "none",
                userSelect: "none",
                WebkitTouchCallout: "none",
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onContextMenu={(e) => e.preventDefault()}
            >
              {/* 1) Full letter outline */}
              {allTraceStrokes.map((s, i) => {
                const c = STROKE_COLORS[i % STROKE_COLORS.length];
                return (
                  <path
                    key={`outline-${s.id ?? i}`}
                    d={(s.pathD ?? "").trim()}
                    fill="none"
                    stroke={hexToRgba(c, 0.1)}
                    strokeWidth={10}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pointerEvents="none"
                  />
                );
              })}

              {/* 2) Completed strokes */}
              {completedStrokes.map((s, i) => {
                if (s.kind === "tap") {
                  const p = parseTapPoint(s.pathD);
                  if (!p) return null;
                  const c = STROKE_COLORS[i % STROKE_COLORS.length];
                  return (
                    <circle
                      key={`done-tap-${s.id ?? i}`}
                      cx={p.x}
                      cy={p.y}
                      r={7}
                      fill={hexToRgba(c, 0.75)}
                      pointerEvents="none"
                    />
                  );
                }
                const d = (s.pathD ?? "").trim();
                if (!d) return null;
                const c = STROKE_COLORS[i % STROKE_COLORS.length];
                return (
                  <path
                    key={`done-${s.id ?? i}`}
                    d={d}
                    fill="none"
                    stroke={hexToRgba(c, 0.78)}
                    strokeWidth={12}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pointerEvents="none"
                  />
                );
              })}

              {/* 3) Current stroke guides */}
              {!letterDone && !isTap && (
                <>
                  <path
                    d={(currentStroke?.pathD ?? "").trim()}
                    fill="none"
                    stroke={colorGuide(currentColor)}
                    strokeWidth={10}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pointerEvents="none"
                  />

                  {guideDots.map((d) => (
                    <circle
                      key={d.key}
                      cx={d.x}
                      cy={d.y}
                      r={4.6}
                      fill={hexToRgba(currentColor, 0.18)}
                      pointerEvents="none"
                    />
                  ))}

                  {showProgress && (
                    <path
                      d={(currentStroke?.pathD ?? "").trim()}
                      fill="none"
                      stroke={colorInk(currentColor)}
                      strokeWidth={10}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray={dashArray}
                      strokeDashoffset={dashOffset}
                      pointerEvents="none"
                    />
                  )}
                </>
              )}

              {/* 4) Start marker + guide + end marker */}
              {!letterDone && (
                <>
                  {isTap ? (
                    <>
                      <circle cx={startPt.x} cy={startPt.y} r={10} fill={hexToRgba(currentColor, 0.18)} pointerEvents="none" />
                      <circle cx={startPt.x} cy={startPt.y} r={6.5} fill={hexToRgba(currentColor, 0.9)} pointerEvents="none" />
                    </>
                  ) : (
                    <>
                      {/* START */}
                      <g transform={`translate(${startPt.x}, ${startPt.y})`} pointerEvents="none">
                        <image
                          href={STAR_SRC}
                          xlinkHref={STAR_SRC}
                          x={-STAR_START_SIZE / 2}
                          y={-STAR_START_SIZE / 2}
                          width={STAR_START_SIZE}
                          height={STAR_START_SIZE}
                          preserveAspectRatio="xMidYMid meet"
                        />
                      </g>

                      {/* MOVING GUIDE STAR */}
                      <g transform={`translate(${guidePt.x}, ${guidePt.y})`} pointerEvents="none">
                        <g>
                          <animateTransform attributeName="transform" type="scale" values="1;1.12;1" dur="0.9s" repeatCount="indefinite" />
                          <image
                            href={STAR_SRC}
                            xlinkHref={STAR_SRC}
                            x={-STAR_GUIDE_SIZE / 2}
                            y={-STAR_GUIDE_SIZE / 2}
                            width={STAR_GUIDE_SIZE}
                            height={STAR_GUIDE_SIZE}
                            preserveAspectRatio="xMidYMid meet"
                          />
                        </g>
                      </g>

                      {/* END STAR */}
                      <g transform={`translate(${endPt.x}, ${endPt.y})`} pointerEvents="none">
                        <image
                          href={STAR_SRC}
                          xlinkHref={STAR_SRC}
                          x={-STAR_END_SIZE / 2}
                          y={-STAR_END_SIZE / 2}
                          width={STAR_END_SIZE}
                          height={STAR_END_SIZE}
                          preserveAspectRatio="xMidYMid meet"
                          opacity={0.85}
                        />
                      </g>
                    </>
                  )}
                </>
              )}
            </svg>
          </div>

          {/* Instruction bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-white/55 px-4 py-3 text-center text-sm font-semibold text-slate-700 backdrop-blur">
            {isTap ? "Tap the glowing dot." : "Start at the star. Follow the star and trace the line."}
          </div>

          {/* Completion popup */}
          {letterDone && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute bottom-20 right-4 sm:bottom-24 sm:right-6 pointer-events-auto">
                <div className="relative w-[320px] max-w-[calc(100vw-2rem)]">
                  <div className="absolute -inset-[2px] rounded-[26px] bg-gradient-to-r from-sky-400 via-fuchsia-400 to-emerald-400 opacity-70 blur-[10px]" />
                  <div className="relative overflow-hidden rounded-[26px] border border-white/60 bg-white/92 p-5 shadow-2xl backdrop-blur">
                    <div className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full bg-sky-200/40 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-pink-200/40 blur-2xl" />

                    <div className="pointer-events-none absolute right-3 top-3">
                      <span className="inline-flex h-3 w-3 animate-ping rounded-full bg-emerald-400/70" />
                    </div>
                    <div className="pointer-events-none absolute left-4 top-4">
                      <span className="inline-flex items-center justify-center rounded-full bg-slate-900/90 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-sm">
                        🎉 Perfect!
                      </span>
                    </div>

                    <div className="mt-2 flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-200 via-pink-200 to-sky-200 shadow-sm ring-1 ring-white/70">
                        <span className="animate-bounce text-2xl">⭐</span>
                      </div>

                      <div className="min-w-0">
                        <div className="text-lg font-extrabold text-slate-900">
                          Nice tracing! <span className="ml-1 inline-block animate-pulse">✨</span>
                        </div>
                        <p className="mt-0.5 text-sm font-semibold text-slate-600">What do you want to do next?</p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <button
                        onClick={replay}
                        className="rounded-full bg-slate-900 px-3 py-2 text-sm font-extrabold text-white shadow-sm transition hover:scale-[1.02] active:scale-[0.99]"
                      >
                        Replay
                      </button>

                      <button
                        onClick={goLevels}
                        className="rounded-full border bg-white px-3 py-2 text-sm font-extrabold text-slate-800 shadow-sm transition hover:scale-[1.02] active:scale-[0.99]"
                      >
                        Levels
                      </button>

                      <button
                        onClick={goNext}
                        className="rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 px-3 py-2 text-sm font-extrabold text-white shadow-sm transition hover:scale-[1.02] active:scale-[0.99]"
                      >
                        {isPretrace ? "Next shape" : step === 0 ? "Small letter" : "Next pair"}
                      </button>
                    </div>

                    <div className="mt-3 text-center text-xs font-semibold text-slate-500">
                      Tip: tap <span className="font-extrabold text-slate-700">Replay</span> to practice again ✍️
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
