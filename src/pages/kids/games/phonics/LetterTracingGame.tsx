// src/pages/kids/games/phonics/LetterTracingGame.tsx
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  TRACE_LETTERS,
  TRACE_LEVELS,
  PRETRACE_ITEMS,
  PRETRACE_LEVEL,
  type LetterId,
  type PreTraceId,
  type TraceLetter,
  type TraceStroke,
} from "./tracing/traceLetters";
import { recordLevelResult } from "../../../../games/engine/recordLevelResult";

const BASE_ROUTE = "/kids/games/phonics/letter-tracing";
const GAME_ID = "letter-tracing";
const PROGRESS_DOC_ID = "phonics_letter_tracing";

type Mode = "levels" | "play";
type CaseStep = 0 | 1; // 0=Upper, 1=Lower
type Pt = { x: number; y: number; t: number; len: number };

// --------------------
// Helpers
// --------------------
function clamp(n: number, a: number, b: number) {
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

function ConfettiBurst({ fire }: { fire: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!fire) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const W = (canvas.width = canvas.offsetWidth);
    const H = (canvas.height = canvas.offsetHeight);

    const pieces = Array.from({ length: 140 }).map(() => ({
      x: W / 2,
      y: H / 2,
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
      ctx.clearRect(0, 0, W, H);

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
    return () => cancelAnimationFrame(raf);
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

  const kidId = searchParams.get("kidId") || "";
  const fs = searchParams.get("fs") === "1";

  // Query params:
  // level: 0..5
  // pair: index
  // step: 0 (Upper) or 1 (Lower)
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

  const traceLevelIndex =
    mode === "play" && levelId !== null && levelId > 0
      ? clamp(levelId - 1, 0, TRACE_LEVELS.length - 1)
      : 0;

  const safePairIndex = useMemo(() => {
    if (isPretrace) return clamp(pairIndex, 0, PRETRACE_LEVEL.items.length - 1);
    const pairsLen = TRACE_LEVELS[traceLevelIndex]?.pairs?.length ?? 1;
    return clamp(pairIndex, 0, Math.max(0, pairsLen - 1));
  }, [isPretrace, pairIndex, traceLevelIndex]);

  const currentPair =
    !isPretrace && mode === "play" ? TRACE_LEVELS[traceLevelIndex]?.pairs?.[safePairIndex] : null;

  const currentLetterId: LetterId | null =
    !isPretrace && mode === "play" && currentPair?.upper
      ? (step === 0 ? currentPair.upper : (currentPair.lower ?? null))
      : null;

  const pretraceId: PreTraceId | null = isPretrace ? PRETRACE_LEVEL.items[safePairIndex] : null;

  const letterData: TraceLetter | null = isPretrace
    ? (pretraceId ? PRETRACE_ITEMS[pretraceId] : null)
    : (currentLetterId ? (TRACE_LETTERS[currentLetterId] ?? null) : null);

  // --- stroke engine state ---
  const [strokeIndex, setStrokeIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [samples, setSamples] = useState<Pt[]>([]);
  const [totalLen, setTotalLen] = useState(0);

  const [started, setStarted] = useState(false);
  const [activePointerId, setActivePointerId] = useState<number | null>(null);
  const [lastIndex, setLastIndex] = useState(0);

  const [letterDone, setLetterDone] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [timeStart, setTimeStart] = useState<number | null>(null);

  const currentStroke: TraceStroke | null = useMemo(() => {
    if (!letterData) return null;
    return letterData.strokes[strokeIndex] ?? null;
  }, [letterData, strokeIndex]);

  const toSvg = useSvgPoint(svgRef);

  // Lock body scroll in in-page fullscreen
  useEffect(() => {
    if (!fs) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [fs]);

  // Reset when switching "thing to play"
  useEffect(() => {
    setStrokeIndex(0);
    setStarted(false);
    setActivePointerId(null);
    setLastIndex(0);
    setLetterDone(false);
    setConfetti(false);
    setTimeStart(null);
    setSamples([]);
    setTotalLen(0);
  }, [currentLetterId, pretraceId]);

  // Reset when switching stroke
  {
    setStarted(false);
    setActivePointerId(null);
    setLastIndex(0);
    setSamples([]);
    setTotalLen(0);useEffect(() => 
  }, [strokeIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setActivePointerId(null);
      setStarted(false);
    };
  }, []);

  // ✅ Build samples using an in-memory SVGPathElement
  useLayoutEffect(() => {
    if (!currentStroke || currentStroke.kind === "tap") {
      setSamples([]);
      setTotalLen(0);
      return;
    }

    const d = (currentStroke.pathD ?? "").trim();
    if (!d) {
      setSamples([]);
      setTotalLen(0);
      return;
    }

    const startT = clamp(currentStroke.startT ?? 0, 0, 1);
    const endT = clamp(currentStroke.endT ?? 1, 0, 1);

    const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathEl.setAttribute("d", d);

    let len = 0;
    try {
      len = pathEl.getTotalLength();
    } catch {
      len = 0;
    }

    // fallback for simple lines
    if (!len || len <= 0) {
      const line = parseLine(d);
      if (!line) {
        setSamples([]);
        setTotalLen(0);
        return;
      }
      const dx = line.b.x - line.a.x;
      const dy = line.b.y - line.a.y;
      const realLen = Math.max(0.0001, Math.sqrt(dx * dx + dy * dy));

      const count = 180;
      const pts: Pt[] = [];
      for (let i = 0; i <= count; i++) {
        const tt = i / count;
        const x = line.a.x + dx * tt;
        const y = line.a.y + dy * tt;
        pts.push({ x, y, t: tt, len: realLen * tt });
      }
      setTotalLen(realLen);
      setSamples(pts);
      setLastIndex(0);
      return;
    }

    setTotalLen(len);

    const startLen = len * startT;
    const endLen = len * endT;

    const count = 180;
    const pts: Pt[] = [];
    for (let i = 0; i <= count; i++) {
      const tt = i / count;
      const l = startLen + (endLen - startLen) * tt;
      const p = pathEl.getPointAtLength(l);
      pts.push({ x: p.x, y: p.y, t: tt, len: l });
    }

    setSamples(pts);
    setLastIndex(0);
  }, [currentStroke?.pathD, currentStroke?.kind, currentStroke?.startT, currentStroke?.endT]);

  const isTap = currentStroke?.kind === "tap";

  const startPt = useMemo(() => {
    if (!currentStroke) return { x: 50, y: 50 };
    if (currentStroke.kind === "tap") return parseTapPoint(currentStroke.pathD) ?? { x: 50, y: 50 };
    if (!samples.length) return { x: 50, y: 50 };
    return { x: samples[0].x, y: samples[0].y };
  }, [currentStroke, samples]);

  const endPt = useMemo(() => {
    if (!currentStroke) return { x: 50, y: 50 };
    if (currentStroke.kind === "tap") return startPt;
    if (!samples.length) return { x: 50, y: 50 };
    const last = samples[samples.length - 1];
    return { x: last.x, y: last.y };
  }, [currentStroke, samples, startPt]);

  const guidePt = useMemo(() => {
    if (!currentStroke) return startPt;
    if (currentStroke.kind === "tap") return startPt;
    if (!samples.length) return startPt;
    const i = clamp(lastIndex, 0, samples.length - 1);
    return { x: samples[i].x, y: samples[i].y };
  }, [currentStroke, samples, lastIndex, startPt]);

  const progressLen = useMemo(() => {
    if (!currentStroke) return 0;
    if (currentStroke.kind === "tap") return 0;
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
      dots.push({ x: samples[ii].x, y: samples[ii].y, key: ii });
    }
    return dots;
  }, [currentStroke, samples]);

  // ✅ FIX: Fullscreen must be triggered in the button click handler DIRECTLY
  function handlePlayButtonClick(levelNum: number, pairIdx: number, stepNum: CaseStep) {
    // Try browser fullscreen FIRST (must be in user gesture)
    if (!document.fullscreenElement) {
      const el: any = document.documentElement;
      try {
        const p = el.requestFullscreen?.({ navigationUI: "hide" });
        if (p?.catch) p.catch(() => {});
      } catch {
        // ignore
      }
    }

    // Then navigate with fs=1 for in-page overlay
    const sp = new URLSearchParams();
    if (kidId) sp.set("kidId", kidId);
    sp.set("level", String(levelNum));
    sp.set("pair", String(pairIdx));
    sp.set("step", String(stepNum));
    sp.set("fs", "1");

    setSearchParams(sp, { replace: false });
    navigate(`${BASE_ROUTE}?${sp.toString()}`);
  }

  function setFs(on: boolean) {
    const sp = new URLSearchParams(searchParams);
    if (on) sp.set("fs", "1");
    else sp.delete("fs");
    setSearchParams(sp, { replace: true });
  }

  function goLevels() {
    // Exit browser fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }

    const sp = new URLSearchParams();
    if (kidId) sp.set("kidId", kidId);
    setSearchParams(sp, { replace: false });
    navigate(`${BASE_ROUTE}?${sp.toString()}`);
  }

  function replay() {
    setStrokeIndex(0);
    setStarted(false);
    setActivePointerId(null);
    setLastIndex(0);
    setLetterDone(false);
    setConfetti(false);
    setTimeStart(null);
  }

  function goNext() {
    if (mode !== "play") return;

    if (isPretrace) {
      const nextIdx = safePairIndex + 1;
      if (nextIdx < PRETRACE_LEVEL.items.length) {
        handlePlayButtonClick(0, nextIdx, 0);
        return;
      }
      handlePlayButtonClick(1, 0, 0);
      return;
    }

    const currentLevelId = levelId ?? 1;
    const pairs = TRACE_LEVELS[traceLevelIndex]?.pairs ?? [];

    if (step === 0) {
      if (currentPair?.lower) handlePlayButtonClick(currentLevelId, safePairIndex, 1);
      else handlePlayButtonClick(currentLevelId, safePairIndex + 1, 0);
      return;
    }

    const nextPair = safePairIndex + 1;
    if (nextPair < pairs.length) {
      handlePlayButtonClick(currentLevelId, nextPair, 0);
      return;
    }

    const nextLevelId = currentLevelId + 1;
    if (nextLevelId <= TRACE_LEVELS.length) {
      handlePlayButtonClick(nextLevelId, 0, 0);
      return;
    }

    goLevels();
  }

  function completeStroke() {
    const nextStroke = strokeIndex + 1;
    if (letterData && nextStroke < letterData.strokes.length) {
      setTimeout(() => setStrokeIndex((p) => p + 1), 220);
      return;
    }

    setLetterDone(true);
    setConfetti(true);
    setTimeout(() => setConfetti(false), 1100);

    try {
      const spentMs = timeStart ? Math.max(0, Math.round(performance.now() - timeStart)) : 0;
      const levelForTracking = isPretrace ? 0 : traceLevelIndex + 1;
      const mastered = isPretrace ? pretraceId ?? "" : currentLetterId ?? "";

      recordLevelResult({
        gameId: GAME_ID,
        progressDocId: PROGRESS_DOC_ID,
        kidId,
        levelId: levelForTracking,
        timeSpentMs: spentMs,
        masteredItems: [mastered].filter(Boolean),
        skillTags: [
          ...(letterData?.skillTags ?? []),
          isPretrace ? "subtopic:pretracing" : `subtopic:tracing_level_${traceLevelIndex + 1}`,
        ],
        completedAt: Date.now(),
      } as any);
    } catch (err) {
      console.error("Failed to record result:", err);
    }
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (letterDone) return;
    if (!currentStroke) return;

    e.preventDefault();

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

    setStarted(true);
    setActivePointerId(e.pointerId);
    (e.currentTarget as any).setPointerCapture?.(e.pointerId);
    setLastIndex(0);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (letterDone) return;
    if (!currentStroke || currentStroke.kind === "tap") return;
    if (!started) return;
    if (activePointerId !== e.pointerId) return;
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
    if (activePointerId === e.pointerId) {
      setActivePointerId(null);
      setStarted(false);
    }
  }

  // --------------------
  // Levels screen
  // --------------------
  if (mode === "levels") {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-slate-900">Letter Tracing</h1>
        <p className="mt-1 text-slate-600">
          Start with Level 0 (lines & curves), then practice Capital → Small (A then a).
        </p>

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
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                Ready
              </span>
            </div>
            <div className="mt-2 text-sm text-slate-600">
              {PRETRACE_LEVEL.items.length} activities: lines, slants & curves
            </div>
          </button>

          {TRACE_LEVELS.map((lv) => {
            const first = lv.pairs?.[0];
            const up = first?.upper;
            const lo = first?.lower;

            const ready = Boolean(up && lo && TRACE_LETTERS[up] && TRACE_LETTERS[lo]);

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
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      Ready
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      Coming soon
                    </span>
                  )}
                </div>

                <div className="mt-2 text-sm text-slate-600">
                  Pairs:{" "}
                  {(lv.pairs ?? [])
                    .map((p) => (p?.upper && p?.lower ? `${p.upper}${p.lower}` : ""))
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

  const totalStrokes = letterData.strokes.length;
  const strokeNo = strokeIndex + 1;

  const showProgress = !isTap && lastIndex > 0 && totalLen > 0;
  const dashArray = totalLen > 0 ? `${progressLen} ${Math.max(1, totalLen - progressLen)}` : "0 9999";

  const headerLabel = isPretrace
    ? `Level 0 • ${letterData.label} • Stroke ${strokeNo}/${totalStrokes}`
    : `Level ${traceLevelIndex + 1} • Pair ${safePairIndex + 1}/${TRACE_LEVELS[traceLevelIndex]?.pairs?.length ?? 1} • ${
        step === 0 ? "Capital" : "Small"
      } • Letter: ${currentLetterId ?? ""} • Stroke ${strokeNo}/${totalStrokes}`;

  const wrapperClass = fs
    ? "fixed inset-0 z-[9999] bg-white"
    : "mx-auto w-full max-w-6xl px-4 py-6";

  return (
    <div className={wrapperClass} ref={containerRef}>
      <div className={fs ? "flex h-full w-full flex-col p-4" : ""}>
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="rounded-full border bg-white px-4 py-2 text-sm font-semibold text-slate-800">
            {headerLabel}
          </div>

          <div className="flex items-center gap-2">
            {fs && (
              <button
                onClick={() => {
                  setFs(false);
                  if (document.fullscreenElement) {
                    document.exitFullscreen?.().catch(() => {});
                  }
                }}
                className="rounded-full border bg-white px-4 py-2 text-sm font-semibold"
              >
                Exit Fullscreen
              </button>
            )}

            <button onClick={goLevels} className="rounded-full border bg-white px-4 py-2 text-sm font-semibold">
              Back to Levels
            </button>
          </div>
        </div>

        <div className={`relative mt-4 overflow-hidden rounded-2xl border bg-[#fbf5ec] shadow-sm ${fs ? "flex-1" : ""}`}>
          <ConfettiBurst fire={confetti} />

          <div className="relative w-full h-full" style={!fs ? { aspectRatio: "16 / 9" } : {}}>
            <svg
              ref={svgRef}
              viewBox={letterData.viewBox}
              className="absolute inset-0 h-full w-full"
              style={{ touchAction: "none" }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {!isTap && (
                <path
                  d={(currentStroke?.pathD ?? "").trim()}
                  fill="none"
                  stroke="rgba(59, 130, 246, 0.18)"
                  strokeWidth={10}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {!isTap &&
                guideDots.map((d) => (
                  <circle key={d.key} cx={d.x} cy={d.y} r={4.6} fill="rgba(59, 130, 246, 0.22)" />
                ))}

              {!isTap && showProgress && (
                <path
                  d={(currentStroke?.pathD ?? "").trim()}
                  fill="none"
                  stroke="rgba(37, 99, 235, 0.85)"
                  strokeWidth={10}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={dashArray}
                />
              )}

              <circle cx={startPt.x} cy={startPt.y} r={9} fill="rgba(239,68,68,1)" />

              {!isTap && <circle cx={guidePt.x} cy={guidePt.y} r={7} fill="rgba(37,99,235,0.95)" />}

              {isTap && (
                <>
                  <circle cx={startPt.x} cy={startPt.y} r={10} fill="rgba(37,99,235,0.15)" />
                  <circle cx={startPt.x} cy={startPt.y} r={6.5} fill="rgba(37,99,235,0.95)" />
                </>
              )}

              {!isTap && (
                <g transform={`translate(${endPt.x - 7}, ${endPt.y - 7})`}>
                  <text x="0" y="14" fontSize="18">
                    ⭐
                  </text>
                </g>
              )}
            </svg>
          </div>

          <div className="absolute bottom-0 left-0 right-0 px-4 py-3 text-center text-sm font-medium text-slate-700 bg-[#fbf5ec]">
            {isTap ? "Tap the blue dot." : "Start from the red dot and follow the blue dot."}
          </div>

          {letterDone && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="w-[92%] max-w-xl rounded-2xl bg-white p-6 shadow-xl">
                <div className="text-xl font-semibold text-slate-900">Nice tracing! 🎉</div>
                <p className="mt-1 text-slate-600">Next step?</p>

                <div className="mt-5 flex flex-wrap gap-3">
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
          )}
        </div>

        {!isPretrace && !fs && (
          <div className="mt-4 rounded-xl border bg-white p-4">
            <div className="text-sm font-semibold text-slate-800">Level {traceLevelIndex + 1} pairs:</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(TRACE_LEVELS[traceLevelIndex]?.pairs ?? []).map((p, pi) => {
                const up = p?.upper;
                const lo = p?.lower;
                const ready = Boolean(up && lo && TRACE_LETTERS[up] && TRACE_LETTERS[lo]);
                const active = pi === safePairIndex;

                return (
                  <button
                    key={`${up ?? "?"}${lo ?? "?"}-${pi}`}
                    disabled={!ready}
                    onClick={() => handlePlayButtonClick(levelId ?? 1, pi, 0)}
                    className={[
                      "rounded-full px-3 py-1 text-sm font-semibold transition",
                      active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700",
                      ready ? "hover:bg-slate-200" : "opacity-50 cursor-not-allowed",
                    ].join(" ")}
                  >
                    {up ?? "?"} {lo ?? "?"}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
