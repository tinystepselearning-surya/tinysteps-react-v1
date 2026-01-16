import React, { useEffect, useMemo, useRef, useState } from "react";
import { recordLevelResult } from "../../../../../games/engine/recordLevelResult";
import {
  type Item,
  type VowelGroup,
  type VowelGroupId,
  GAME_ID,
  PROGRESS_DOC_ID,
  SND_CONFETTI,
  clamp,
  splitVC,
  phonicLabel,
  animateNumber,
  tapSoundUrl,
  dragSoundUrl,
  mergeSoundUrl,
} from "./myFirstWordsData";

type SlideJoinGameProps = {
  kidId: string;
  groupId: VowelGroupId;
  group: VowelGroup;
  onBackToGroups: () => void;
  forcedMode?: "slide_join" | null;
};

export default function SlideJoinGame({
  kidId,
  groupId,
  group,
  onBackToGroups,
}: SlideJoinGameProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);

  const [started, setStarted] = useState(false);
  const [stageW, setStageW] = useState(0);

  const [idx, setIdx] = useState(0);
  const ITEMS = useMemo(() => group.words.map((w) => splitVC(w)), [group]);
  const hasItems = ITEMS.length > 0;
  const isLast = idx >= ITEMS.length - 1;
  const item =
    ITEMS[clamp(idx, 0, Math.max(0, ITEMS.length - 1))] ?? {
      left: "a",
      right: "t",
      word: "at",
    };

  const [merged, setMerged] = useState(false);
  const mergedRef = useRef(false);
  const [merging, setMerging] = useState(false);
  const mergingRef = useRef(false);

  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDraggedOnce, setHasDraggedOnce] = useState(false);

  const [showBurst, setShowBurst] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);

  const [attempts, setAttempts] = useState(0);
  const [startTs, setStartTs] = useState<number | null>(null);

  const [leftPopKey, setLeftPopKey] = useState(0);
  const [rightPopKey, setRightPopKey] = useState(0);
  const [mergedPopKey, setMergedPopKey] = useState(0);

  const cancelAnimRef = useRef<null | (() => void)>(null);
  const dragStartRef = useRef<{ x: number; p: number } | null>(null);

  // Audio
  const audioUnlockedRef = useRef(false);
  const tapRef = useRef<HTMLAudioElement | null>(null);
  const dragRefAudio = useRef<HTMLAudioElement | null>(null);
  const mergeWordRef = useRef<string>("");
  const mergeRefAudio = useRef<HTMLAudioElement | null>(null);
  const confettiRef = useRef<HTMLAudioElement | null>(null);
  const tapSrcRef = useRef<string>("");
  const dragSrcRef = useRef<string>("");

  const MERGE_THRESHOLD = 0.9;

  function ensureTapDragAudio(leftLetter: string) {
    const tapSrc = tapSoundUrl(leftLetter);
    const dragSrc = dragSoundUrl(leftLetter);

    if (!tapRef.current || tapSrcRef.current !== tapSrc) {
      tapSrcRef.current = tapSrc;
      tapRef.current = new Audio(tapSrc);
      tapRef.current.preload = "auto";
    }

    if (!dragRefAudio.current || dragSrcRef.current !== dragSrc) {
      dragSrcRef.current = dragSrc;
      dragRefAudio.current = new Audio(dragSrc);
      dragRefAudio.current.preload = "auto";
      dragRefAudio.current.loop = true;
    }

    if (!confettiRef.current) {
      confettiRef.current = new Audio(SND_CONFETTI);
      confettiRef.current.preload = "auto";
      confettiRef.current.loop = false;
      confettiRef.current.volume = 0.35;
    }
  }

  function ensureMergeAudio(word: string) {
    if (mergeWordRef.current === word && mergeRefAudio.current) return;
    mergeWordRef.current = word;
    mergeRefAudio.current = new Audio(mergeSoundUrl(word));
    mergeRefAudio.current.preload = "auto";
    mergeRefAudio.current.loop = false;
  }

  function stopDragLoop() {
    try {
      const a = dragRefAudio.current;
      if (!a) return;
      a.pause();
      a.currentTime = 0;
    } catch {}
  }

  function startDragLoop() {
    try {
      ensureTapDragAudio(item.left);
      if (!audioUnlockedRef.current) return;

      try {
        tapRef.current?.pause();
        mergeRefAudio.current?.pause();
      } catch {}

      const a = dragRefAudio.current;
      if (!a) return;
      a.loop = true;
      a.currentTime = 0;

      const p = a.play();
      if (p && typeof (p as any).catch === "function") p.catch(() => {});
    } catch {}
  }

  function pauseAllAudio() {
    try {
      stopDragLoop();
      tapRef.current?.pause();
      mergeRefAudio.current?.pause();
      confettiRef.current?.pause();

      if (tapRef.current) tapRef.current.currentTime = 0;
      if (mergeRefAudio.current) mergeRefAudio.current.currentTime = 0;
      if (confettiRef.current) confettiRef.current.currentTime = 0;
    } catch {}
  }

  async function playTap() {
    try {
      ensureTapDragAudio(item.left);
      if (!audioUnlockedRef.current) return;

      stopDragLoop();

      const a = tapRef.current;
      if (!a) return;
      a.pause();
      a.currentTime = 0;

      const p = a.play();
      if (p && typeof (p as any).catch === "function") await p.catch(() => {});
    } catch {}
  }

  async function playWord(word: string) {
    try {
      ensureMergeAudio(word);
      if (!audioUnlockedRef.current) return;

      stopDragLoop();

      const a = mergeRefAudio.current;
      if (!a) return;
      a.pause();
      a.currentTime = 0;

      const p = a.play();
      if (p && typeof (p as any).catch === "function") await p.catch(() => {});
    } catch {}
  }

  async function playConfetti() {
    try {
      ensureTapDragAudio(item.left);
      if (!audioUnlockedRef.current) return;

      const a = confettiRef.current;
      if (!a) return;
      a.pause();
      a.currentTime = 0;

      const p = a.play();
      if (p && typeof (p as any).catch === "function") await p.catch(() => {});
    } catch {}
  }

  function popLeft() {
    setLeftPopKey((k) => k + 1);
  }
  function popRight() {
    setRightPopKey((k) => k + 1);
  }
  function popMerged() {
    setMergedPopKey((k) => k + 1);
  }

  function fireSuccessFX() {
    setShowBurst(true);
    window.setTimeout(() => setShowBurst(false), 600);

    setConfettiKey((k) => k + 1);
    setShowConfetti(true);
    window.setTimeout(() => setShowConfetti(false), 1100);

    playConfetti();
  }

  function recordProgress(masteredWord: string) {
    if (!kidId) return;

    try {
      const spentMs = startTs
        ? Math.max(0, Math.round(performance.now() - startTs))
        : 0;

      recordLevelResult({
        gameId: GAME_ID,
        progressDocId: PROGRESS_DOC_ID,
        kidId,
        levelId: idx + 1,
        timeSpentMs: spentMs,
        attempts: Math.max(1, attempts),
        masteredItems: [masteredWord],
        skillTags: [
          "area:phonics",
          "subtopic:my_first_words",
          "mode:slide_join",
          `group:${groupId}`,
          `word:${masteredWord}`,
        ],
        completedAt: Date.now(),
      } as any);
    } catch (err) {
      console.error("recordLevelResult failed:", err);
    }
  }

  function resetForNewItemSync() {
    stopDragLoop();

    cancelAnimRef.current?.();
    cancelAnimRef.current = null;

    setMerged(false);
    mergedRef.current = false;
    setMerging(false);
    mergingRef.current = false;

    setProgress(0);
    progressRef.current = 0;
    setIsDragging(false);
    setHasDraggedOnce(false);

    setShowBurst(false);
    setShowConfetti(false);

    setAttempts(0);
    setStartTs(performance.now());
    dragStartRef.current = null;
  }

  function next() {
    if (!hasItems) return;
    resetForNewItemSync();
    setIdx((p) => clamp(p + 1, 0, ITEMS.length - 1));
  }

  function prev() {
    if (!hasItems) return;
    resetForNewItemSync();
    setIdx((p) => clamp(p - 1, 0, ITEMS.length - 1));
  }

  function onLeftBubblePointerDown(e: React.PointerEvent) {
    if (!started) return;
    if (mergedRef.current || mergingRef.current) return;

    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);

    cancelAnimRef.current?.();
    cancelAnimRef.current = null;

    setIsDragging(true);
    setHasDraggedOnce(true);
    dragStartRef.current = { x: e.clientX, p: progress };
    startDragLoop();
  }

  function onStagePointerMove(e: React.PointerEvent) {
    if (!isDragging) return;
    if (!stageRef.current) return;

    const start = dragStartRef.current;
    if (!start) return;

    const leftStartX = stageW * 0.35;
    const rightStartX = stageW * 0.65;
    const travel = Math.max(1, rightStartX - leftStartX);

    const dx = e.clientX - start.x;
    const nextP = clamp(start.p + dx / travel, 0, 1);
    setProgress(nextP);
    progressRef.current = nextP;
  }

  function endDragAndSnap() {
    setIsDragging(false);
    dragStartRef.current = null;

    if (progress >= MERGE_THRESHOLD) {
      cancelAnimRef.current = animateNumber(
        progress,
        1,
        180,
        (v) => {
          setProgress(v);
          progressRef.current = v;
        },
        () => {}
      );
    } else {
      cancelAnimRef.current = animateNumber(progress, 0, 220, (v) => {
        setProgress(v);
        progressRef.current = v;
      });
    }
  }

  function onStagePointerUp() {
    if (!isDragging) return;
    stopDragLoop();
    endDragAndSnap();
  }

  function onStagePointerCancel() {
    if (!isDragging) return;
    stopDragLoop();
    endDragAndSnap();
  }

  const confettiPieces = useMemo(() => {
    const count = 28;
    return Array.from({ length: count }).map((_, i) => ({
      id: `${confettiKey}-${i}`,
      left: Math.random() * 100,
      delay: Math.random() * 0.15,
      dur: 0.9 + Math.random() * 0.6,
      rot: Math.random() * 360,
      drift: (Math.random() * 2 - 1) * 40,
      size: 8 + Math.random() * 10,
    }));
  }, [confettiKey]);

  const instruction = useMemo(() => {
    if (!started) return "Tap Start to play.";
    if (merged) return `Nice! You made "${item.word}".`;
    if (merging) return "Merging...";
    return `Drag "${item.left}" to "${item.right}" to make "${item.word}".`;
  }, [started, merged, merging, item]);

  useEffect(() => {
    mergedRef.current = merged;
  }, [merged]);
  useEffect(() => {
    mergingRef.current = merging;
  }, [merging]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setStageW(r.width);
    });
    ro.observe(el);

    const r = el.getBoundingClientRect();
    setStageW(r.width);

    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    ensureTapDragAudio(item.left);
    ensureMergeAudio(item.word);
    pauseAllAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.left, item.word]);

  useEffect(() => {
    setStarted(true);
    setStartTs(performance.now());
    audioUnlockedRef.current = true;
    return () => pauseAllAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mergedRef.current || mergingRef.current) return;
    if (progress >= 0.99) {
      stopDragLoop();
      setMerging(true);
      mergingRef.current = true;
      window.setTimeout(() => {
        setMerging(false);
        mergingRef.current = false;
        setMerged(true);
        mergedRef.current = true;
        fireSuccessFX();
        popMerged();
        playWord(item.word);
        recordProgress(item.word);
      }, 260);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  const bubbleSize = Math.min(180, Math.max(120, Math.round(stageW * 0.14)));
  const leftStartX = stageW * 0.35;
  const rightStartX = stageW * 0.65;
  const travel = Math.max(1, rightStartX - leftStartX);
  const leftX = leftStartX + travel * progress;

  const near = progress >= MERGE_THRESHOLD && !merged;
  const attachTugPx = near ? -12 * ((progress - MERGE_THRESHOLD) / (1 - MERGE_THRESHOLD)) : 0;
  const rightX = rightStartX + attachTugPx;

  return (
    <div className="flex-1 min-h-0 relative">
      <style>{`
        @keyframes nudge {
          0%,100% { transform: translateX(0); opacity: .55; }
          50% { transform: translateX(18px); opacity: .85; }
        }
      `}</style>

      {/* Back button */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={onBackToGroups}
          className="px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold rounded-full shadow-lg hover:bg-white/20 hover:scale-105 transition-all duration-200"
        >
          ← Back to Groups
        </button>
      </div>

      <div className="relative h-full w-full" style={{ touchAction: "none" }}>
        <div className="absolute inset-0 bg-black/20" />

        {/* instructions */}
        {started && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-6 py-3 bg-white/80 backdrop-blur-md rounded-xl shadow-lg">
            <div className="text-center">
              <div className="text-sm font-semibold text-slate-900">{instruction}</div>
              {!merged && !merging && (
                <div className="mt-1 text-xs text-slate-700">Tip: drag the left bubble → to join the right.</div>
              )}
            </div>
          </div>
        )}

        {/* burst */}
        {showBurst && (
          <div
            className="absolute left-1/2 top-1/2 h-[180px] w-[180px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(16,185,129,0.55) 0%, rgba(16,185,129,0.12) 45%, rgba(16,185,129,0) 70%)",
              animation: "tsBurst 600ms ease-out forwards",
            }}
          />
        )}

        {/* confetti */}
        {showConfetti && (
          <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
            {confettiPieces.map((p) => (
              <span
                key={p.id}
                className="ts-confetti-piece"
                style={{
                  left: `${p.left}%`,
                  width: `${p.size}px`,
                  height: `${Math.max(5, Math.round(p.size * 0.45))}px`,
                  ["--delay" as any]: `${p.delay}s`,
                  ["--dur" as any]: `${p.dur}s`,
                  ["--rot" as any]: `${p.rot}deg`,
                  ["--dx" as any]: `${p.drift}px`,
                  ["--dx2" as any]: `${p.drift * 0.6}px`,
                }}
              />
            ))}
          </div>
        )}

        {/* Side arrows */}
        <button
          className="ts-side-btn"
          style={{ left: 16 }}
          onClick={prev}
          disabled={!started || idx === 0}
          aria-label="Previous"
        >
          <span style={{ opacity: !started || idx === 0 ? 0.35 : 1 }}>‹</span>
        </button>

        <button
          className="ts-side-btn"
          style={{
            right: 16,
            animation: started && merged && !isLast ? "tsArrowPulse 900ms ease-in-out infinite" : undefined,
          }}
          onClick={() => {
            if (!merged || !started) return;
            next();
          }}
          disabled={!started || isLast}
          aria-label="Next"
        >
          <span style={{ opacity: !started || isLast ? 0.35 : 1 }}>›</span>
        </button>

        {/* Stage with pointer handlers */}
        <div
          ref={stageRef}
          className="absolute inset-0 select-none"
          style={{ touchAction: "none" }}
          onPointerMove={onStagePointerMove}
          onPointerUp={onStagePointerUp}
          onPointerCancel={onStagePointerCancel}
        >
          {/* Instruction pill (top-center) */}
          {started && !merged && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
              <div className="px-4 py-2 rounded-full bg-white/90 text-black text-sm font-semibold shadow-lg">
                {!hasDraggedOnce ? "Drag the left bubble to join the sounds" : "Keep sliding… until they touch!"}
              </div>
            </div>
          )}

          {/* Arrow hint animation (only before first drag) */}
          {started && !hasDraggedOnce && !merged && (
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute top-1/2 -translate-y-1/2"
                style={{ left: `${leftStartX}px`, width: `${rightStartX - leftStartX}px` }}
              >
                <div className="flex items-center gap-2 opacity-70" style={{ animation: "nudge 1.1s ease-in-out infinite" }}>
                  <span className="text-white/80 text-2xl">➜</span>
                  <span className="text-white/60 text-base">slide</span>
                  <span className="text-white/80 text-2xl">➜</span>
                  <span className="text-white/80 text-2xl">➜</span>
                </div>
              </div>
            </div>
          )}

          {/* Rail line */}
          <div
            className="absolute top-1/2 -translate-y-1/2 left-0 right-0 mx-auto h-[4px] bg-white/20 rounded-full"
            style={{ width: "62%" }}
          />

          {/* Bubbles */}
          {!merged && (
            <>
              {/* Left bubble (draggable) */}
              <div
                className="absolute top-1/2"
                style={{
                  left: `${leftX}px`,
                  transform: "translate(-50%, -50%)",
                  transition: isDragging ? "none" : "transform 220ms ease-out",
                }}
              >
                <button
                  type="button"
                  onPointerDown={onLeftBubblePointerDown}
                  onPointerMove={onStagePointerMove}
                  onPointerUp={onStagePointerUp}
                  onPointerCancel={onStagePointerCancel}
                  onClick={() => {
                    if (!started || merging) return;
                    popLeft();
                    playTap();
                    setAttempts((a) => a + 1);
                  }}
                  className="rounded-full shadow-lg grid place-items-center text-white font-extrabold border-4 border-white/30"
                  style={{
                    width: bubbleSize,
                    height: bubbleSize,
                    touchAction: "none",
                    cursor: "grab",
                    fontSize: Math.round(bubbleSize * 0.4),
                    background: "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.35), rgba(255,255,255,0) 35%), linear-gradient(180deg, #60a5fa, #2563eb)",
                  }}
                  aria-label="Drag left bubble"
                >
                  <span
                    key={leftPopKey}
                    style={{
                      animation: "tsTapPop 260ms ease-out",
                      textShadow: "0 8px 22px rgba(0,0,0,0.35)",
                    }}
                  >
                    {item.left}
                  </span>
                </button>

                <div className="mt-3 text-center text-white/90 text-lg font-semibold" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                  {phonicLabel(item.left)}
                </div>
              </div>

              {/* Right bubble */}
              <div
                className="absolute top-1/2"
                style={{
                  left: `${rightX}px`,
                  transform: "translate(-50%, -50%)",
                  transition: isDragging ? "none" : "transform 220ms ease-out",
                }}
              >
                <div
                  className="rounded-full shadow-lg grid place-items-center text-white font-extrabold border-4 border-white/30"
                  style={{
                    width: bubbleSize,
                    height: bubbleSize,
                    fontSize: Math.round(bubbleSize * 0.4),
                    background: "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.35), rgba(255,255,255,0) 35%), linear-gradient(180deg, #c084fc, #7c3aed)",
                    boxShadow: near
                      ? "0 0 0 10px rgba(34,197,94,0.18), 0 18px 40px rgba(0,0,0,0.25)"
                      : "0 18px 40px rgba(0,0,0,0.25)",
                  }}
                  aria-label="Right bubble"
                >
                  <span
                    key={rightPopKey}
                    style={{
                      textShadow: "0 8px 22px rgba(0,0,0,0.35)",
                    }}
                  >
                    {item.right}
                  </span>
                </div>

                <div className="mt-3 text-center text-white/90 text-lg font-semibold" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                  {phonicLabel(item.right)}
                </div>
              </div>
            </>
          )}

          {/* Merged bubble */}
          {merged && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <button
                type="button"
                onClick={() => {
                  popMerged();
                  playWord(item.word);
                }}
                className="rounded-full shadow-2xl grid place-items-center text-white font-extrabold border-4 border-white/40 animate-[tsPopIn_220ms_ease-out_forwards]"
                style={{
                  width: Math.min(240, Math.round(stageW * 0.25)),
                  height: Math.min(240, Math.round(stageW * 0.25)),
                  fontSize: Math.round(Math.min(240, Math.round(stageW * 0.25)) * 0.35),
                  animation: "tsMergedPulse 1500ms ease-in-out infinite",
                  background: "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.35), rgba(255,255,255,0) 35%), linear-gradient(180deg, #34d399, #059669)",
                }}
              >
                <span
                  key={mergedPopKey}
                  style={{
                    animation: "tsTapPop 260ms ease-out",
                    textShadow: "0 10px 26px rgba(0,0,0,0.38)",
                  }}
                >
                  {item.word}
                </span>
              </button>

              <div className="mt-4 text-center text-white text-xl font-bold" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.4)" }}>
                /{item.word}/
              </div>
            </div>
          )}
        </div>

        {/* Next guidance after merge */}
        {started && merged && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
            {!isLast ? (
              <div className="rounded-2xl bg-white/85 backdrop-blur px-5 py-3 shadow-lg border border-black/5 text-center">
                <div className="text-sm font-extrabold text-slate-900">Great! Tap Next →</div>
                <button
                  onClick={next}
                  className="mt-2 rounded-xl bg-slate-900 px-5 py-2 text-white font-bold"
                >
                  Next
                </button>
              </div>
            ) : (
              <div className="rounded-2xl bg-white/85 backdrop-blur px-5 py-3 shadow-lg border border-black/5 text-center">
                <div className="text-sm font-extrabold text-slate-900">All done! 🎉</div>
                <button
                  onClick={() => setIdx(0)}
                  className="mt-2 rounded-xl bg-slate-900 px-5 py-2 text-white font-bold"
                >
                  Play again
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div
        className="shrink-0 px-4 py-3 flex flex-wrap gap-3 bg-white/80 backdrop-blur"
        style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
      >
        <button
          onClick={() => {
            setIdx(0);
            resetForNewItemSync();
          }}
          className="rounded-xl border bg-white px-4 py-2 font-semibold"
        >
          Reset
        </button>

        <button
          onClick={() => {
            if (!started || merged || merging) return;
            popLeft();
            playTap();
            setAttempts((a) => a + 1);
          }}
          className="rounded-xl bg-white/90 px-4 py-2 font-semibold border"
          disabled={!started}
        >
          🔊 Sound "{item.left}"
        </button>
      </div>
    </div>
  );
}
