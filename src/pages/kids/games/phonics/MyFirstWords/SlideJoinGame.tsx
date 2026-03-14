import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { recordLevelResult } from "../../../../../games/engine/recordLevelResult";
import {
  type VowelGroup,
  type VowelGroupId,
  SND_CONFETTI,
  clamp,
  splitVC,
  phonicLabel,
  animateNumber,
  tapSoundUrl,
  dragSoundUrl,
  mergeSoundUrl,
} from "./myFirstWordsData";

const CANONICAL_GAME_ID = "my-first-words";
const CANONICAL_PROGRESS_DOC_ID = "phonics_my_first_words";
const SLIDE_JOIN_LEVEL_ID = 1;

type SlideJoinGameProps = {
  kidId: string;
  groupId: VowelGroupId;
  group: VowelGroup;
  onBackToGroups: () => void;
  forcedMode?: "slide_join" | null;
};

// Motor-friendly thresholds + scaffolding ladder
const MERGE_THRESHOLD = 0.88; // easier than 0.9
const SNAP_THRESHOLD = 0.80;  // if close, snap to success
const AUTO_HINT_MS = 4000;    // visual nudge if idle
const FAILS_FOR_ASSIST = 2;   // show Join button
const FAILS_FOR_GUIDED = 3;   // auto-slide “watch me”

export default function SlideJoinGame({ kidId, groupId, group, onBackToGroups }: SlideJoinGameProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);

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

  // Start / phases
  const [started, setStarted] = useState(false);
  const [merged, setMerged] = useState(false);
  const mergedRef = useRef(false);
  const [merging, setMerging] = useState(false);
  const mergingRef = useRef(false);

  // Movement state
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDraggedOnce, setHasDraggedOnce] = useState(false);
  const dragStartRef = useRef<{ x: number; p: number } | null>(null);
  const dragAttemptStartTsRef = useRef<number | null>(null);

  // Scaffolding
  const [fails, setFails] = useState(0);
  const failsRef = useRef(0);
  const [assistEnabled, setAssistEnabled] = useState(false);
  const assistUsedRef = useRef(false);
  const guidedUsedRef = useRef(false);

  const [hintPulse, setHintPulse] = useState(false);
  const hintLevelUsedRef = useRef(0); // 0 none, 1 hint, 2 assist, 3 guided

  // FX
  const [showBurst, setShowBurst] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);

  const [leftPopKey, setLeftPopKey] = useState(0);
  const [rightPopKey, setRightPopKey] = useState(0);
  const [mergedPopKey, setMergedPopKey] = useState(0);

  // Telemetry
  const startTsRef = useRef<number | null>(null);
  const runStartTsRef = useRef<number | null>(null);
  const runResultSentRef = useRef(false);
  const runMasteredWordsRef = useRef<Set<string>>(new Set());
  const runAttemptsRef = useRef(0);
  const [mergeAttempts, setMergeAttempts] = useState(0);
  const mergeAttemptsRef = useRef(0);
  const soundReplaysRef = useRef(0);
  const timeToFirstActionMsRef = useRef<number | null>(null);
  const lastActionTsRef = useRef<number>(performance.now());
  const dragDurationsRef = useRef<number[]>([]);

  // Anim cancellation
  const cancelAnimRef = useRef<null | (() => void)>(null);

  // Audio
  const audioUnlockedRef = useRef(false);
  const tapRef = useRef<HTMLAudioElement | null>(null);
  const dragRefAudio = useRef<HTMLAudioElement | null>(null);
  const mergeWordRef = useRef<string>("");
  const mergeRefAudio = useRef<HTMLAudioElement | null>(null);
  const confettiRef = useRef<HTMLAudioElement | null>(null);
  const tapSrcRef = useRef<string>("");
  const dragSrcRef = useRef<string>("");

  // ---------- geometry ----------
  const bubbleSize = Math.min(190, Math.max(130, Math.round(stageW * 0.15)));
  const leftStartX = stageW * 0.35;
  const rightStartX = stageW * 0.65;
  const travel = Math.max(1, rightStartX - leftStartX);
  const leftX = leftStartX + travel * progress;

  const near = progress >= MERGE_THRESHOLD && !merged;
  const attachTugPx = near ? -12 * ((progress - MERGE_THRESHOLD) / (1 - MERGE_THRESHOLD)) : 0;
  const rightX = rightStartX + attachTugPx;

  // ---------- helpers ----------
  const markAction = useCallback(() => {
    const now = performance.now();
    lastActionTsRef.current = now;
    if (timeToFirstActionMsRef.current == null && startTsRef.current != null) {
      timeToFirstActionMsRef.current = Math.max(0, Math.round(now - startTsRef.current));
    }
  }, []);

  function ensureTapDragAudio(leftLetter: string) {
    const tapSrc = tapSoundUrl(leftLetter);
    const dragSrc = dragSoundUrl(leftLetter);

    if (!tapRef.current || tapSrcRef.current !== tapSrc) {
      tapSrcRef.current = tapSrc;
      tapRef.current = new Audio(tapSrc);
      tapRef.current.preload = "auto";
      tapRef.current.volume = 0.95;
    }

    if (!dragRefAudio.current || dragSrcRef.current !== dragSrc) {
      dragSrcRef.current = dragSrc;
      dragRefAudio.current = new Audio(dragSrc);
      dragRefAudio.current.preload = "auto";
      dragRefAudio.current.loop = true;
      dragRefAudio.current.volume = 0.65;
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
    mergeRefAudio.current.volume = 0.95;
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

  async function primeAudioOnGesture() {
    try {
      ensureTapDragAudio(item.left);
      ensureMergeAudio(item.word);

      // iOS/Safari gesture prime
      const a = tapRef.current;
      if (!a) return;
      a.muted = true;
      a.currentTime = 0;
      const p = a.play();
      if (p && typeof (p as any).catch === "function") await p.catch(() => {});
      a.pause();
      a.currentTime = 0;
      a.muted = false;

      audioUnlockedRef.current = true;
    } catch {
      // even if prime fails, we keep the UI playable
      audioUnlockedRef.current = true;
    }
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

  function resetRunTracking() {
    runStartTsRef.current = performance.now();
    runResultSentRef.current = false;
    runMasteredWordsRef.current = new Set();
    runAttemptsRef.current = 0;
  }

  function incrementMergeAttempt() {
    setMergeAttempts((a) => {
      const na = a + 1;
      mergeAttemptsRef.current = na;
      return na;
    });
    runAttemptsRef.current += 1;
  }

  function recordRunCompletion() {
    if (!kidId) return;
    if (runResultSentRef.current) return;

    try {
      const spentMs =
        runStartTsRef.current != null
          ? Math.max(0, Math.round(performance.now() - runStartTsRef.current))
          : 0;
      const masteredItems = Array.from(runMasteredWordsRef.current);
      const attemptsUsed = Math.max(1, runAttemptsRef.current);

      recordLevelResult({
        gameId: CANONICAL_GAME_ID,
        progressDocId: CANONICAL_PROGRESS_DOC_ID,
        kidId,
        levelId: SLIDE_JOIN_LEVEL_ID,
        completed: true,
        timeSpentMs: spentMs,
        attempts: attemptsUsed,
        masteredItems,
        skillTags: [
          "area:phonics",
          "subtopic:my_first_words",
          "mode:slide_join",
          `group:${groupId}`,
        ],
        completedAt: Date.now(),

        // extra telemetry (recordLevelResult accepts any)
        meta: {
          fails: failsRef.current,
          assistUsed: assistUsedRef.current,
          guidedSuccessUsed: guidedUsedRef.current,
          hintLevelUsed: hintLevelUsedRef.current,
          timeToFirstActionMs: timeToFirstActionMsRef.current,
          dragDurationsMs: dragDurationsRef.current.slice(0, 30),
          soundReplays: soundReplaysRef.current,
        },
      } as any);
      runResultSentRef.current = true;
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

    setFails(0);
    failsRef.current = 0;
    setAssistEnabled(false);
    assistUsedRef.current = false;
    guidedUsedRef.current = false;
    setHintPulse(false);
    hintLevelUsedRef.current = 0;

    setMergeAttempts(0);
    mergeAttemptsRef.current = 0;
    soundReplaysRef.current = 0;
    timeToFirstActionMsRef.current = null;
    dragDurationsRef.current = [];

    startTsRef.current = started ? performance.now() : null;
    dragStartRef.current = null;
    dragAttemptStartTsRef.current = null;
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

  // ---------- pointer handlers ----------
  function onLeftBubblePointerDown(e: React.PointerEvent) {
    if (!started) return;
    if (mergedRef.current || mergingRef.current) return;

    markAction();
    setHintPulse(false);

    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);

    cancelAnimRef.current?.();
    cancelAnimRef.current = null;

    setIsDragging(true);
    setHasDraggedOnce(true);

    dragStartRef.current = { x: e.clientX, p: progressRef.current };
    dragAttemptStartTsRef.current = performance.now();

    startDragLoop();
  }

  function onStagePointerMove(e: React.PointerEvent) {
    if (!isDragging) return;
    if (!stageRef.current) return;

    const start = dragStartRef.current;
    if (!start) return;

    const dx = e.clientX - start.x;
    const nextP = clamp(start.p + dx / travel, 0, 1);
    setProgress(nextP);
    progressRef.current = nextP;
  }

  function registerFailedAttempt() {
    incrementMergeAttempt();

    setFails((f) => {
      const nf = f + 1;
      failsRef.current = nf;

      // ladder: hint -> assist -> guided
      if (nf >= 1 && hintLevelUsedRef.current < 1) hintLevelUsedRef.current = 1;
      if (nf >= FAILS_FOR_ASSIST) {
        setAssistEnabled(true);
        if (hintLevelUsedRef.current < 2) hintLevelUsedRef.current = 2;
      }
      return nf;
    });

    // Quick visual guidance (no punishment)
    setHintPulse(true);
    window.setTimeout(() => setHintPulse(false), 700);
  }

  function endDragAndSnap() {
    setIsDragging(false);
    dragStartRef.current = null;

    // drag duration telemetry
    const t0 = dragAttemptStartTsRef.current;
    dragAttemptStartTsRef.current = null;
    if (t0 != null) {
      const dur = Math.max(0, Math.round(performance.now() - t0));
      dragDurationsRef.current.push(dur);
    }

    // Decide success / snap / fail
    const p = progressRef.current;

    // ✅ Motor-friendly snap zone
    if (p >= SNAP_THRESHOLD && !mergedRef.current && !mergingRef.current) {
      cancelAnimRef.current = animateNumber(
        p,
        1,
        170,
        (v) => {
          setProgress(v);
          progressRef.current = v;
        },
        () => {}
      );
      return;
    }

    if (p >= MERGE_THRESHOLD) {
      cancelAnimRef.current = animateNumber(
        p,
        1,
        180,
        (v) => {
          setProgress(v);
          progressRef.current = v;
        },
        () => {}
      );
      return;
    }

    // fail + snap back
    registerFailedAttempt();

    // Guided success after repeated struggles
    if (failsRef.current + 1 >= FAILS_FOR_GUIDED) {
      if (hintLevelUsedRef.current < 3) hintLevelUsedRef.current = 3;
      guidedUsedRef.current = true;

      // snap back a little then auto-slide (watch me)
      cancelAnimRef.current = animateNumber(p, 0, 160, (v) => {
        setProgress(v);
        progressRef.current = v;
      });

      window.setTimeout(() => {
        if (mergedRef.current || mergingRef.current) return;
        cancelAnimRef.current = animateNumber(0, 1, 260, (v) => {
          setProgress(v);
          progressRef.current = v;
        });
      }, 220);

      return;
    }

    cancelAnimRef.current = animateNumber(p, 0, 220, (v) => {
      setProgress(v);
      progressRef.current = v;
    });
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

  // Tap-to-join assist (accessibility)
  function doAssistJoin() {
    if (!started || mergedRef.current || mergingRef.current) return;

    markAction();
    assistUsedRef.current = true;
    if (hintLevelUsedRef.current < 2) hintLevelUsedRef.current = 2;

    incrementMergeAttempt();

    cancelAnimRef.current?.();
    cancelAnimRef.current = animateNumber(progressRef.current, 1, 220, (v) => {
      setProgress(v);
      progressRef.current = v;
    });
  }

  // ---------- derived UI ----------
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
      hue: (i * 37) % 360,
    }));
  }, [confettiKey]);

  const instruction = useMemo(() => {
    if (!started) return "Tap Start to play.";
    if (merged) return `Nice! You made "${item.word}".`;
    if (merging) return "Joining...";
    return `Drag "${item.left}" to "${item.right}" to make "${item.word}".`;
  }, [started, merged, merging, item]);

  // ---------- effects ----------
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

  // Idle hint (visual only)
  useEffect(() => {
    if (!started || merged || merging) return;

    const t = window.setInterval(() => {
      const now = performance.now();
      if (now - lastActionTsRef.current > AUTO_HINT_MS) {
        if (hintLevelUsedRef.current < 1) hintLevelUsedRef.current = 1;
        setHintPulse(true);
        window.setTimeout(() => setHintPulse(false), 700);
        lastActionTsRef.current = now; // avoid constant pulsing
      }
    }, 500);

    return () => window.clearInterval(t);
  }, [started, merged, merging]);

  // Merge completion watcher
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
        runMasteredWordsRef.current.add(item.word);
        if (isLast) {
          recordRunCompletion();
        }
      }, 260);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, isLast, item.word]);

  // Cleanup
  useEffect(() => {
    return () => pauseAllAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- UI ----------
  return (
    <div className="flex-1 min-h-0 relative">
      <style>{`
        /* Core animations used by this component (self-contained) */
        @keyframes tsTapPop { 0%{transform:scale(1)} 50%{transform:scale(0.92)} 100%{transform:scale(1)} }
        @keyframes tsBurst { 0%{transform:translate(-50%,-50%) scale(.6); opacity:.9} 100%{transform:translate(-50%,-50%) scale(1.7); opacity:0} }
        @keyframes tsMergedPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.03)} }
        @keyframes tsArrowPulse { 0%,100%{transform:scale(1); opacity:.75} 50%{transform:scale(1.08); opacity:1} }
        @keyframes tsNudge { 0%,100%{transform:translateX(0); opacity:.55} 50%{transform:translateX(18px); opacity:.85} }
        @keyframes tsRailPulse { 0%,100%{opacity:.25} 50%{opacity:.6} }
        @keyframes tsConfettiFall {
          0% { transform: translate3d(0,-12px,0) rotate(var(--rot)); opacity: 1; }
          100% { transform: translate3d(var(--dx), 110vh, 0) rotate(calc(var(--rot) + 720deg)); opacity: 0; }
        }

        .ts-side-btn{
          position:absolute; top:50%;
          transform:translateY(-50%);
          width:64px; height:64px;
          border-radius:9999px;
          background:rgba(255,255,255,.78);
          backdrop-filter: blur(10px);
          box-shadow: 0 10px 30px rgba(0,0,0,.25);
          border: 1px solid rgba(0,0,0,.06);
          font-size: 44px;
          font-weight: 900;
          z-index:40;
          display:grid;
          place-items:center;
          user-select:none;
          -webkit-tap-highlight-color: transparent;
        }
        .ts-side-btn:disabled{ opacity:.5; }

        .ts-confetti-piece{
          position:absolute;
          top:-16px;
          border-radius: 999px;
          background: hsl(var(--hue) 85% 60%);
          animation: tsConfettiFall var(--dur) ease-in forwards;
          animation-delay: var(--delay);
          box-shadow: 0 6px 18px rgba(0,0,0,.15);
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

        {/* Tap-to-start overlay (gesture-based audio unlock) */}
        {!started && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/45 backdrop-blur-sm">
            <button
              onClick={async () => {
                await primeAudioOnGesture();
                startTsRef.current = performance.now();
                resetRunTracking();
                lastActionTsRef.current = performance.now();
                setStarted(true);
                setHasDraggedOnce(false);
                // gentle: play the left sound once on start (still within gesture chain)
                soundReplaysRef.current += 1;
                popLeft();
                await playTap();
              }}
              className="px-12 py-7 bg-white rounded-3xl shadow-2xl border border-black/10 text-slate-900 font-black text-4xl hover:scale-[1.03] active:scale-[0.99] transition-transform"
              style={{ boxShadow: "0 30px 80px rgba(0,0,0,.45)" }}
            >
              Tap to Start
            </button>
          </div>
        )}

        {/* Single instruction bar (keep it simple) */}
        {started && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-6 py-3 bg-white/85 backdrop-blur-md rounded-xl shadow-lg border border-black/5">
            <div className="text-center">
              <div className="text-sm font-semibold text-slate-900">{instruction}</div>
              {!merged && !merging && assistEnabled && (
                <div className="mt-1 text-xs text-slate-700">
                  Need help? Tap <span className="font-bold">JOIN</span>.
                </div>
              )}
              {!merged && !merging && !assistEnabled && !hasDraggedOnce && (
                <div className="mt-1 text-xs text-slate-700">
                  Tip: slide the left bubble on the line.
                </div>
              )}
            </div>
          </div>
        )}

        {/* burst */}
        {showBurst && (
          <div
            className="absolute left-1/2 top-1/2 h-[180px] w-[180px] rounded-full"
            style={{
              transform: "translate(-50%,-50%)",
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
                style={
                  {
                    left: `${p.left}%`,
                    width: `${p.size}px`,
                    height: `${Math.max(5, Math.round(p.size * 0.45))}px`,
                    ["--delay" as any]: `${p.delay}s`,
                    ["--dur" as any]: `${p.dur}s`,
                    ["--rot" as any]: `${p.rot}deg`,
                    ["--dx" as any]: `${p.drift}px`,
                    ["--hue" as any]: `${p.hue}`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        )}

        {/* Side arrows */}
        <button className="ts-side-btn" style={{ left: 16 }} onClick={prev} disabled={!started || idx === 0} aria-label="Previous">
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
          {/* Arrow hint (only before first drag) */}
          {started && !hasDraggedOnce && !merged && (
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute top-1/2 -translate-y-1/2"
                style={{ left: `${leftStartX}px`, width: `${rightStartX - leftStartX}px` }}
              >
                <div className="flex items-center gap-2 opacity-70" style={{ animation: "tsNudge 1.1s ease-in-out infinite" }}>
                  <span className="text-white/80 text-2xl">➜</span>
                  <span className="text-white/60 text-base">slide</span>
                  <span className="text-white/80 text-2xl">➜</span>
                  <span className="text-white/80 text-2xl">➜</span>
                </div>
              </div>
            </div>
          )}

          {/* Rail line (pulse on hints) */}
          <div
            className="absolute top-1/2 -translate-y-1/2 left-0 right-0 mx-auto h-[4px] bg-white/20 rounded-full"
            style={{
              width: "62%",
              animation: hintPulse ? "tsRailPulse 700ms ease-in-out" : undefined,
            }}
          />

          {/* Assist button (tap-to-join fallback) */}
          {started && !merged && !merging && assistEnabled && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40">
              <button
                onClick={doAssistJoin}
                className="rounded-2xl bg-white/90 backdrop-blur px-6 py-3 shadow-lg border border-black/5 font-extrabold text-slate-900 text-lg"
              >
                JOIN
              </button>
            </div>
          )}

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
                  onClick={async () => {
                    if (!started || merging) return;
                    markAction();
                    popLeft();
                    soundReplaysRef.current += 1;
                    await playTap();
                  }}
                  className="rounded-full shadow-lg grid place-items-center text-white font-extrabold border-4 border-white/30"
                  style={{
                    width: bubbleSize,
                    height: bubbleSize,
                    touchAction: "none",
                    cursor: "grab",
                    fontSize: Math.round(bubbleSize * 0.4),
                    background:
                      "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.35), rgba(255,255,255,0) 35%), linear-gradient(180deg, #60a5fa, #2563eb)",
                    boxShadow: hintPulse ? "0 0 0 10px rgba(251,191,36,0.16), 0 18px 40px rgba(0,0,0,0.25)" : undefined,
                    WebkitTapHighlightColor: "transparent",
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

                <div
                  className="mt-3 text-center text-white/90 text-lg font-semibold"
                  style={{ textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
                >
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
                    background:
                      "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.35), rgba(255,255,255,0) 35%), linear-gradient(180deg, #c084fc, #7c3aed)",
                    boxShadow: near
                      ? "0 0 0 10px rgba(34,197,94,0.18), 0 18px 40px rgba(0,0,0,0.25)"
                      : hintPulse
                      ? "0 0 0 10px rgba(251,191,36,0.12), 0 18px 40px rgba(0,0,0,0.25)"
                      : "0 18px 40px rgba(0,0,0,0.25)",
                  }}
                  aria-label="Right bubble"
                >
                  <span
                    key={rightPopKey}
                    style={{ textShadow: "0 8px 22px rgba(0,0,0,0.35)" }}
                  >
                    {item.right}
                  </span>
                </div>

                <div
                  className="mt-3 text-center text-white/90 text-lg font-semibold"
                  style={{ textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
                >
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
                onClick={async () => {
                  markAction();
                  popMerged();
                  await playWord(item.word);
                }}
                className="rounded-full shadow-2xl grid place-items-center text-white font-extrabold border-4 border-white/40"
                style={{
                  width: Math.min(240, Math.round(stageW * 0.25)),
                  height: Math.min(240, Math.round(stageW * 0.25)),
                  fontSize: Math.round(Math.min(240, Math.round(stageW * 0.25)) * 0.35),
                  animation: "tsMergedPulse 1500ms ease-in-out infinite",
                  background:
                    "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.35), rgba(255,255,255,0) 35%), linear-gradient(180deg, #34d399, #059669)",
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
                <button onClick={next} className="mt-2 rounded-xl bg-slate-900 px-5 py-2 text-white font-bold">
                  Next
                </button>
              </div>
            ) : (
              <div className="rounded-2xl bg-white/85 backdrop-blur px-5 py-3 shadow-lg border border-black/5 text-center">
                <div className="text-sm font-extrabold text-slate-900">All done! 🎉</div>
                <button
                  onClick={() => {
                    setIdx(0);
                    resetForNewItemSync();
                    resetRunTracking();
                  }}
                  className="mt-2 rounded-xl bg-slate-900 px-5 py-2 text-white font-bold"
                >
                  Play again
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom controls (minimal + consistent) */}
      <div
        className="shrink-0 px-4 py-3 flex flex-wrap gap-3 bg-white/80 backdrop-blur"
        style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
      >
        <button
          onClick={() => {
            setIdx(0);
            resetForNewItemSync();
            resetRunTracking();
          }}
          className="rounded-xl border bg-white px-4 py-2 font-semibold"
          disabled={!started}
        >
          Reset
        </button>

        <button
          onClick={async () => {
            if (!started || merged || merging) return;
            markAction();
            popLeft();
            soundReplaysRef.current += 1;
            await playTap();
          }}
          className="rounded-xl bg-white/90 px-4 py-2 font-semibold border"
          disabled={!started}
        >
          🔊 Sound “{item.left}”
        </button>

        {started && !merged && !merging && assistEnabled && (
          <button
            onClick={doAssistJoin}
            className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white"
          >
            JOIN
          </button>
        )}
      </div>
    </div>
  );
}
