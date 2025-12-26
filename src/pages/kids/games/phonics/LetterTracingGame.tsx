// src/pages/kids/games/phonics/LetterTracingGame.tsx
// ✅ Fix: prevents auto-completing the whole letter after stroke 1.
// ✅ Completed strokes stay visible (proper letter formation).
// ✅ Forces a “lift and start again” between strokes.
// ✅ Fullscreen stable.
// ✅ NEW: dropdown to jump to any letter in this level
// ✅ NEW: Next Letter button (skip current letter for testing)
//
// IMPORTANT: traceLetters.ts must be PURE TS (no JSX). JSX belongs here (.tsx).

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

const STROKE_COLORS = ["#2563EB", "#EC4899", "#22C55E", "#F59E0B", "#8B5CF6"] as const;

// ⭐ Your Canva asset (saved in /public/star.png)
const STAR_SRC = "/star.png";
// ⭐ sizes (reduce here)
const STAR_START_SIZE = 18;
const STAR_GUIDE_SIZE = 16;
const STAR_END_SIZE = 14;
// viewBox padding (center feel)
const VIEWBOX_PAD = 10;

function ConfettiBurst({ fire }: { fire: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!fire) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resize();

    const W0 = canvas.width;
    const H0 = canvas.height;

    const pieces = Array.from({ length: 140 }).map(() => ({
      x: W0 / 2,
      y: H0 / 2,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.8) * 12,
      g: 0.25 + Math.random() * 0.25,
      r: 2 + Math.random() * 3,
      a: 1,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      hue: Math.floor(Math.random() * 360),
    }));

    const start = performance.now();
    const dur = 1200;

    const tick = (now: number) => {
      const t = now - start;
      const fade = 1 - clamp(t / dur, 0, 1);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of pieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.g;
        p.rot += p.vr;
        p.a = fade;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 60%, ${p.a})`;
        ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
        ctx.restore();
      }

      if (t < dur) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, [fire]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0"
      style={{ width: "100%", height: "100%" }}
    />
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
  // Stroke engine state
  // --------------------
  const [strokeIndex, setStrokeIndex] = useState(0);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [samples, setSamples] = useState<Pt[]>([]);
  const [rawLen, setRawLen] = useState(0);
  const [trimStartLen, setTrimStartLen] = useState(0);

  const [started, setStarted] = useState(false);
  const [lastIndex, setLastIndex] = useState(0);

  const [letterDone, setLetterDone] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [timeStart, setTimeStart] = useState<number | null>(null);

  // refs (avoid timing issues)
  const startedRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const ignoreMovesRef = useRef(false);
  const capturedElRef = useRef<SVGSVGElement | null>(null);

  // ⭐ hint star index
  const [hintIndex, setHintIndex] = useState(0);
  const hintIndexRef = useRef(0);

  const currentStroke: TraceStroke | null = useMemo(() => {
    if (!letterData) return null;
    return letterData.strokes[strokeIndex] ?? null;
  }, [letterData, strokeIndex]);

  const renderViewBox = useMemo(() => {
    const vb = (letterData?.viewBox ?? "0 0 100 100").trim();
    return expandViewBox(vb, VIEWBOX_PAD);
  }, [letterData?.viewBox]);

  // ✅ Safe startT/endT (prevents TS error on union type)
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

  // Lock body scroll in fullscreen
  useEffect(() => {
    if (!fs) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [fs]);

  // If user exits fullscreen (ESC), remove fs=1
  useEffect(() => {
    const onFsChange = () => {
      if (document.fullscreenElement) return;
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("fs") === "1") {
        sp.delete("fs");
        setSearchParams(sp, { replace: true });
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, [setSearchParams]);

  // Reset state when switching item
  useEffect(() => {
    setStrokeIndex(0);

    setStarted(false);
    setLastIndex(0);

    startedRef.current = false;
    activePointerIdRef.current = null;
    ignoreMovesRef.current = false;
    capturedElRef.current = null;

    setLetterDone(false);
    setConfetti(false);
    setTimeStart(null);

    setHintIndex(0);
    hintIndexRef.current = 0;
  }, [currentLetterId, pretraceId]);

  // Reset state when switching stroke
  useEffect(() => {
    setStarted(false);
    setLastIndex(0);

    startedRef.current = false;
    activePointerIdRef.current = null;

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

  // ⭐ animate hint along path while idle
  useEffect(() => {
    if (letterDone) return;
    if (!currentStroke || currentStroke.kind === "tap") return;
    if (!samples.length) return;
    if (started || lastIndex > 0) return;

    let raf = 0;
    const durMs = 5200;
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
    return started || lastIndex > 0
      ? clamp(lastIndex, 0, samples.length - 1)
      : clamp(hintIndex, 0, samples.length - 1);
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
  const completedCount = letterDone ? totalStrokes : strokeIndex;

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

  // ✅ dropdown options (jump to any letter in this level) — hook MUST be before any return
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

  function navigatePlay(levelNum: number, pairIdx: number, stepNum: CaseStep, replace = false) {
    const sp = new URLSearchParams();
    if (kidId) sp.set("kidId", kidId);
    sp.set("level", String(levelNum));
    sp.set("pair", String(pairIdx));
    sp.set("step", String(stepNum));
    if (document.fullscreenElement || fs) sp.set("fs", "1");
    navigateTo(sp, replace);
  }

  async function handlePlayButtonClick(levelNum: number, pairIdx: number, stepNum: CaseStep) {
    const sp = new URLSearchParams();
    if (kidId) sp.set("kidId", kidId);
    sp.set("level", String(levelNum));
    sp.set("pair", String(pairIdx));
    sp.set("step", String(stepNum));
    navigateTo(sp, false);

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    if (document.fullscreenElement) {
      sp.set("fs", "1");
      navigateTo(sp, true);
      return;
    }

    const wrapper = fsRef.current;
    if (!wrapper?.requestFullscreen) return;

    try {
      await wrapper.requestFullscreen({ navigationUI: "hide" } as any);
      sp.set("fs", "1");
      navigateTo(sp, true);
    } catch {}
  }

  async function setFs(on: boolean) {
    if (on) {
      if (document.fullscreenElement) {
        const sp = new URLSearchParams(window.location.search);
        sp.set("fs", "1");
        setSearchParams(sp, { replace: true });
        return;
      }
      const wrapper = fsRef.current;
      if (!wrapper?.requestFullscreen) return;
      try {
        await wrapper.requestFullscreen({ navigationUI: "hide" } as any);
        const sp = new URLSearchParams(window.location.search);
        sp.set("fs", "1");
        setSearchParams(sp, { replace: true });
      } catch {}
      return;
    }

    const sp = new URLSearchParams(window.location.search);
    sp.delete("fs");
    setSearchParams(sp, { replace: true });
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  function goLevels() {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    const sp = new URLSearchParams();
    if (kidId) sp.set("kidId", kidId);
    navigateTo(sp, true);
  }

  function replay() {
    setStrokeIndex(0);
    setStarted(false);
    setLastIndex(0);

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

  // ✅ Next Letter button uses this (skip without completing)
  function goNext() {
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
    setStarted(false);
    setLastIndex(0);

    const nextStroke = strokeIndex + 1;
    if (letterData && nextStroke < letterData.strokes.length) {
      // ✅ force "lift and start again" between strokes
      setTimeout(() => {
        ignoreMovesRef.current = false;
        setStrokeIndex((prev) => prev + 1);
      }, 220);
      return;
    }

    setLetterDone(true);
    setConfetti(true);
    setTimeout(() => setConfetti(false), 1100);

    if (!kidId) return;

    try {
      const spentMs = timeStart ? Math.max(0, Math.round(performance.now() - timeStart)) : 0;
      const levelForTracking = isPretrace ? 0 : levelId ?? 1;
      const mastered = isPretrace ? pretraceId ?? "" : currentLetterId ?? "";

      recordLevelResult(
        {
          gameId: GAME_ID,
          progressDocId: PROGRESS_DOC_ID,
          kidId,
          levelId: levelForTracking,
          attempts: 1,
          scorePct: 100,
          points: 100,
          timeSpentMs: spentMs,
          masteredItems: [mastered].filter(Boolean),
          skillTags: [
            ...(letterData?.skillTags ?? []),
            isPretrace ? "subtopic:pretracing" : `subtopic:tracing_level_${levelForTracking}`,
          ],
          completedAt: Date.now(),
        } as any
      );
    } catch {}
  }

  // --------------------
  // Pointer handling
  // --------------------
  function handlePointerDown(e: React.PointerEvent) {
    if (letterDone) return;
    if (!currentStroke) return;

    e.preventDefault();

    ignoreMovesRef.current = false;
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
    if (dist(p, startPt) > startRadius) return;

    startedRef.current = true;
    activePointerIdRef.current = e.pointerId;

    setStarted(true);
    (e.currentTarget as any).setPointerCapture?.(e.pointerId);
    setLastIndex(0);
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
    const i0 = clamp(lastIndex, 0, samples.length - 1);
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
      setLastIndex(bestI);
      if (bestI >= samples.length - 2) completeStroke();
    }
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (activePointerIdRef.current === e.pointerId) {
      try {
        (e.currentTarget as any).releasePointerCapture?.(e.pointerId);
      } catch {}

      activePointerIdRef.current = null;
      startedRef.current = false;
      capturedElRef.current = null;

      setStarted(false);

      ignoreMovesRef.current = false;
    }
  }

  // --------------------
  // Levels screen
  // --------------------
  if (mode === "levels") {
    const LEVELS = TRACE_LEVELS as unknown as readonly TraceLevelView[];

    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-slate-900">Letter Tracing</h1>
        <p className="mt-1 text-slate-600">Start with Level 0, then trace Capital → Small.</p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <button
            onClick={() => handlePlayButtonClick(0, 0, 0)}
            className="rounded-xl border bg-white p-5 text-left shadow-sm transition hover:shadow-md hover:border-slate-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-slate-900">{PRETRACE_LEVEL.title}</div>
                <div className="text-sm text-slate-600">{PRETRACE_LEVEL.subtitle}</div>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">Ready</span>
            </div>
            <div className="mt-2 text-sm text-slate-600">{PRETRACE_LEVEL.items.length} activities</div>
          </button>

          {LEVELS.map((lv: TraceLevelView) => {
            const ready = isLevelReady(lv.levelId);
            return (
              <button
                key={lv.levelId}
                disabled={!ready}
                onClick={() => handlePlayButtonClick(lv.levelId, 0, 0)}
                className={[
                  "rounded-xl border bg-white p-5 text-left shadow-sm transition",
                  ready ? "hover:shadow-md hover:border-slate-300" : "opacity-50 cursor-not-allowed",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold text-slate-900">{lv.title}</div>
                    {lv.subtitle && <div className="text-sm text-slate-600">{lv.subtitle}</div>}
                  </div>
                  {ready ? (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">Ready</span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      Coming soon
                    </span>
                  )}
                </div>

                <div className="mt-2 text-sm text-slate-600">
                  Pairs:{" "}
                  {(lv.pairs ?? [])
                    .map((p: LevelPairView) => (p?.upper && p?.lower ? `${p.upper}${p.lower}` : ""))
                    .filter(Boolean)
                    .join("  ")}
                </div>
              </button>
            );
          })}
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

  const wrapperClass = fs ? "fixed inset-0 z-[9999] bg-slate-50" : "mx-auto w-full max-w-6xl px-4 py-6";

  return (
    <div ref={fsRef} className={wrapperClass}>
      <div className={fs ? "flex h-full w-full flex-col p-4" : ""}>
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="rounded-full border bg-white px-4 py-2 text-sm font-semibold text-slate-800">{headerLabel}</div>

          <div className="flex items-center gap-2">
            {/* ✅ Jump dropdown */}
            {!isPretrace && jumpOptions.length > 0 && (
              <select
                value={`${safePairIndex}|${step}`}
                onChange={(e) => {
                  const [pi, st] = e.target.value.split("|").map((x) => Number(x));
                  navigatePlay(levelId ?? 1, Number.isFinite(pi) ? pi : 0, st === 1 ? 1 : 0, false);
                }}
                className="rounded-full border bg-white px-3 py-2 text-sm font-semibold text-slate-800"
              >
                {jumpOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}

            {/* ✅ Skip for testing */}
            <button onClick={goNext} className="rounded-full border bg-white px-4 py-2 text-sm font-semibold">
              Next Letter
            </button>

            {fs ? (
              <button onClick={() => setFs(false)} className="rounded-full border bg-white px-4 py-2 text-sm font-semibold">
                Exit Fullscreen
              </button>
            ) : (
              <button onClick={() => setFs(true)} className="rounded-full border bg-white px-4 py-2 text-sm font-semibold">
                Fullscreen
              </button>
            )}

            <button onClick={goLevels} className="rounded-full border bg-white px-4 py-2 text-sm font-semibold">
              Back to Levels
            </button>
          </div>
        </div>

        <div
          className={`relative mt-4 overflow-hidden rounded-2xl border shadow-sm ${fs ? "flex-1" : ""}`}
          style={{
            background:
              "radial-gradient(circle at 20% 20%, rgba(56,189,248,0.18), transparent 55%), radial-gradient(circle at 80% 30%, rgba(244,114,182,0.16), transparent 55%), radial-gradient(circle at 45% 85%, rgba(34,197,94,0.10), transparent 55%), linear-gradient(135deg, #f8fbff 0%, #fff7fb 45%, #fffdf7 100%)",
          }}
        >
          <ConfettiBurst fire={confetti} />

          <div className="relative w-full h-full" style={!fs ? { aspectRatio: "16 / 9" } : {}}>
            <svg
              ref={svgRef}
              viewBox={renderViewBox}
              preserveAspectRatio="xMidYMid meet"
              className="absolute inset-0 h-full w-full"
              style={{ touchAction: "none" }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {/* 1) Full letter outline */}
              {allTraceStrokes.map((s, i) => {
                const c = STROKE_COLORS[i % STROKE_COLORS.length];
                return (
                  <path
                    key={`outline-${s.id ?? i}`}
                    d={(s.pathD ?? "").trim()}
                    fill="none"
                    stroke={hexToRgba(c, 0.10)}
                    strokeWidth={10}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              })}

              {/* 2) Completed strokes */}
              {completedStrokes.map((s, i) => {
                if (s.kind === "tap") {
                  const p = parseTapPoint(s.pathD);
                  if (!p) return null;
                  const c = STROKE_COLORS[i % STROKE_COLORS.length];
                  return <circle key={`done-tap-${s.id ?? i}`} cx={p.x} cy={p.y} r={7} fill={hexToRgba(c, 0.75)} />;
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
                  />

                  {guideDots.map((d) => (
                    <circle key={d.key} cx={d.x} cy={d.y} r={4.6} fill={hexToRgba(currentColor, 0.18)} />
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
                    />
                  )}
                </>
              )}

              {/* 4) Start marker + guide + end marker */}
              {!letterDone && (
                <>
                  {isTap ? (
                    <>
                      <circle cx={startPt.x} cy={startPt.y} r={10} fill={hexToRgba(currentColor, 0.18)} />
                      <circle cx={startPt.x} cy={startPt.y} r={6.5} fill={hexToRgba(currentColor, 0.9)} />
                    </>
                  ) : (
                    <>
                      {/* START (only your PNG, no extra glow circles) */}
                      <g transform={`translate(${startPt.x}, ${startPt.y})`}>
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

                      {/* MOVING GUIDE STAR (small + subtle pulse, no blurred circle) */}
                      <g transform={`translate(${guidePt.x}, ${guidePt.y})`}>
                        <g>
                          <animateTransform
                            attributeName="transform"
                            type="scale"
                            values="1;1.12;1"
                            dur="0.9s"
                            repeatCount="indefinite"
                          />
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

                      {/* END STAR (smaller) */}
                      <g transform={`translate(${endPt.x}, ${endPt.y})`}>
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

          <div className="absolute bottom-0 left-0 right-0 px-4 py-3 text-center text-sm font-semibold text-slate-700 bg-white/55 backdrop-blur">
            {isTap ? "Tap the glowing dot." : "Start at the star. Follow the star and trace the line."}
          </div>

          {/* Completion popup */}
          {letterDone && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute bottom-16 left-1/2 w-[92%] max-w-xl -translate-x-1/2 pointer-events-auto">
                <div className="rounded-2xl bg-white/95 backdrop-blur p-5 shadow-xl border">
                  <div className="text-xl font-semibold text-slate-900">Nice tracing! 🎉</div>
                  <p className="mt-1 text-slate-600">Next step?</p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button onClick={replay} className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">
                      Replay
                    </button>

                    <button onClick={goLevels} className="rounded-lg border bg-white px-4 py-2 font-semibold">
                      Back to Levels
                    </button>

                    <button onClick={goNext} className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white">
                      {isPretrace ? "Next shape" : step === 0 ? "Next: small letter" : "Next pair"}
                    </button>
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
