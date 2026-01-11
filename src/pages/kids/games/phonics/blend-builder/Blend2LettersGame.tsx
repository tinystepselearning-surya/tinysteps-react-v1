import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// ✅ IMPORTANT: adjust this import if your project path differs.
import { recordLevelResult } from "../../../../../games/engine/recordLevelResult";

type Item = {
  left: string;
  right: string;
  word: string;
};

const GAME_ID = "blend_2letters_v1";
const PROGRESS_DOC_ID = "phonics_blend_2letters";

const ITEMS: Item[] = [{ left: "a", right: "t", word: "at" }];

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function Blend2LettersGame() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const kidId =
    searchParams.get("kidId") ||
    localStorage.getItem("ts_active_kid_v1") ||
    "";

  const [idx, setIdx] = useState(0);
  const item = ITEMS[clamp(idx, 0, ITEMS.length - 1)];

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const arenaRef = useRef<HTMLDivElement | null>(null);

  const [started, setStarted] = useState(false);

  const [merged, setMerged] = useState(false);
  const mergedRef = useRef(false);

  const [merging, setMerging] = useState(false);
  const mergingRef = useRef(false);

  // ✅ single source of truth for both dots movement
  // 0 = start positions, 1 = meet at center
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);

  const [isDragging, setIsDragging] = useState(false);

  const [travelPx, setTravelPx] = useState(220); // will be updated by ResizeObserver

  const [showBurst, setShowBurst] = useState(false);

  // Attempts + time
  const [attempts, setAttempts] = useState(0);
  const [startTs, setStartTs] = useState<number | null>(null);

  // --- Drag session (window listeners) ---
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    moved: boolean;
  }>({ active: false, startX: 0, moved: false });

  const suppressClickRef = useRef(false);

  // --- TTS ---
  const ttsUnlockedRef = useRef(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  function pickVoice() {
    try {
      if (!("speechSynthesis" in window)) return;
      const synth = window.speechSynthesis;
      const voices = synth.getVoices?.() ?? [];
      const v =
        voices.find((x) => /en-IN/i.test(x.lang)) ||
        voices.find((x) => /en-US/i.test(x.lang)) ||
        voices.find((x) => /^en/i.test(x.lang));
      voiceRef.current = v ?? null;
    } catch {}
  }

  useEffect(() => {
    pickVoice();
    try {
      window.speechSynthesis.onvoiceschanged = () => pickVoice();
    } catch {}
    return () => {
      try {
        window.speechSynthesis.onvoiceschanged = null;
      } catch {}
    };
  }, []);

  function unlockTTS() {
    try {
      if (!("speechSynthesis" in window)) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      synth.speak(u);
      ttsUnlockedRef.current = true;
    } catch {}
  }

  function speak(text: string) {
    try {
      if (!("speechSynthesis" in window)) return;
      const synth = window.speechSynthesis;

      if (!ttsUnlockedRef.current) unlockTTS();

      try {
        synth.resume?.();
      } catch {}

      synth.cancel();

      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9;
      u.pitch = 1.0;

      if (!voiceRef.current) pickVoice();
      if (voiceRef.current) u.voice = voiceRef.current;

      synth.speak(u);
    } catch {}
  }

  async function requestRealFullscreen() {
    try {
      const el = wrapperRef.current as any;
      if (!el) return;
      if (document.fullscreenElement) return;
      await el.requestFullscreen?.();
    } catch {}
  }

  function exitFullscreenIfAny() {
    try {
      if (document.fullscreenElement) document.exitFullscreen?.();
    } catch {}
  }

  const instruction = useMemo(() => {
    if (!started) return "Tap Start to play.";
    if (merged) return `Nice! You made “${item.word}”.`;
    if (merging) return "Merging...";
    return `Drag “${item.left}” to “${item.right}” to make “${item.word}”.`;
  }, [started, merged, merging, item]);

  useEffect(() => {
    mergedRef.current = merged;
  }, [merged]);

  useEffect(() => {
    mergingRef.current = merging;
  }, [merging]);

  // ✅ Keep travel distance correct on every screen size
  useEffect(() => {
    const el = arenaRef.current;
    if (!el) return;

    const update = () => {
      const r = el.getBoundingClientRect();
      // This must match your CSS positions: 32% and 68% meeting at 50% => 18% shift each
      setTravelPx(Math.max(120, r.width * 0.18));
    };

    update();

    let ro: ResizeObserver | null = null;
    try {
      ro = new ResizeObserver(() => update());
      ro.observe(el);
    } catch {
      const onResize = () => update();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    return () => ro?.disconnect();
  }, []);

  // Reset per item
  useEffect(() => {
    setMerged(false);
    setMerging(false);
    setProgress(0);
    progressRef.current = 0;
    setIsDragging(false);
    setShowBurst(false);
    setAttempts(0);
    setStartTs(null);

    dragRef.current = { active: false, startX: 0, moved: false };
    suppressClickRef.current = false;
  }, [idx]);

  function cleanupDragListeners() {
    window.removeEventListener("mousemove", onWinMouseMove as any);
    window.removeEventListener("mouseup", onWinMouseUp as any);
    window.removeEventListener("touchmove", onWinTouchMove as any);
    window.removeEventListener("touchend", onWinTouchEnd as any);
    window.removeEventListener("touchcancel", onWinTouchEnd as any);
  }

  function goBack() {
    cleanupDragListeners();
    exitFullscreenIfAny();
    navigate(`/kids/games/phonics${kidId ? `?kidId=${encodeURIComponent(kidId)}` : ""}`);
  }

  function reset() {
    cleanupDragListeners();
    setMerged(false);
    setMerging(false);
    setProgress(0);
    progressRef.current = 0;
    setIsDragging(false);
    setShowBurst(false);

    dragRef.current = { active: false, startX: 0, moved: false };
    suppressClickRef.current = false;
  }

  function next() {
    setIdx((p) => clamp(p + 1, 0, ITEMS.length - 1));
  }
  function prev() {
    setIdx((p) => clamp(p - 1, 0, ITEMS.length - 1));
  }

  async function onStart() {
    setStarted(true);
    unlockTTS();
    await requestRealFullscreen();
  }

  function finishMerge() {
    setMerging(false);
    setMerged(true);

    setShowBurst(true);
    window.setTimeout(() => setShowBurst(false), 600);

    speak(item.word);

    if (kidId) {
      try {
        const spentMs = startTs ? Math.max(0, Math.round(performance.now() - startTs)) : 0;

        recordLevelResult({
          gameId: GAME_ID,
          progressDocId: PROGRESS_DOC_ID,
          kidId,
          levelId: 1,
          timeSpentMs: spentMs,
          attempts: Math.max(1, attempts),
          masteredItems: [item.word],
          skillTags: [
            "area:phonics",
            "subtopic:blend_2letters",
            `word:${item.word}`,
            `letter:${item.left}`,
            `letter:${item.right}`,
          ],
          completedAt: Date.now(),
        } as any);
      } catch (err) {
        console.error("recordLevelResult failed:", err);
      }
    }
  }

  // ✅ progress-driven movement (both dots same pace)
  function setProgressFromDx(dx: number) {
    const p = clamp(dx / travelPx, 0, 1);
    setProgress(p);
    progressRef.current = p;

    if (p >= 1 && !mergedRef.current && !mergingRef.current) {
      cleanupDragListeners();
      dragRef.current.active = false;
      setIsDragging(false);
      setMerging(true);

      // tiny delay so the final "snap to center" feels like a merge moment
      window.setTimeout(() => finishMerge(), 180);
    }
  }

  function endDragTapOrSnap() {
    const moved = dragRef.current.moved;
    dragRef.current.active = false;
    cleanupDragListeners();

    // If user just tapped (not dragged) => play left sound
    if (!moved && !mergedRef.current && !mergingRef.current) {
      speak(item.left);
      setAttempts((a) => a + 1);
    }

    // If dragged but not merged => snap back
    if (moved && progressRef.current < 1 && !mergedRef.current && !mergingRef.current) {
      setProgress(0);
      progressRef.current = 0;
    }

    setIsDragging(false);

    suppressClickRef.current = true;
    window.setTimeout(() => (suppressClickRef.current = false), 0);
  }

  function onWinMouseMove(e: MouseEvent) {
    if (!dragRef.current.active) return;
    if (mergedRef.current || mergingRef.current) return;

    const dx = e.clientX - dragRef.current.startX;

    if (!dragRef.current.moved) {
      if (Math.abs(dx) >= 6) {
        dragRef.current.moved = true;
        setIsDragging(true);
      } else {
        return;
      }
    }

    setProgressFromDx(dx);
  }

  function onWinMouseUp() {
    if (!dragRef.current.active) return;
    endDragTapOrSnap();
  }

  function onWinTouchMove(e: TouchEvent) {
    if (!dragRef.current.active) return;
    if (mergedRef.current || mergingRef.current) return;

    // stop page scroll
    e.preventDefault();

    const t = e.touches[0];
    if (!t) return;

    const dx = t.clientX - dragRef.current.startX;

    if (!dragRef.current.moved) {
      if (Math.abs(dx) >= 6) {
        dragRef.current.moved = true;
        setIsDragging(true);
      } else {
        return;
      }
    }

    setProgressFromDx(dx);
  }

  function onWinTouchEnd() {
    if (!dragRef.current.active) return;
    endDragTapOrSnap();
  }

  function beginDragAt(clientX: number) {
    if (!started) return;
    if (mergedRef.current || mergingRef.current) return;

    if (startTs === null) setStartTs(performance.now());

    dragRef.current = { active: true, startX: clientX, moved: false };
    setIsDragging(false);

    cleanupDragListeners();
    window.addEventListener("mousemove", onWinMouseMove as any);
    window.addEventListener("mouseup", onWinMouseUp as any);
    window.addEventListener("touchmove", onWinTouchMove as any, { passive: false });
    window.addEventListener("touchend", onWinTouchEnd as any);
    window.addEventListener("touchcancel", onWinTouchEnd as any);
  }

  function onLeftMouseDown(e: React.MouseEvent) {
    if (!started) return;
    e.preventDefault();
    e.stopPropagation();
    beginDragAt(e.clientX);
  }

  function onLeftTouchStart(e: React.TouchEvent) {
    if (!started) return;
    const t = e.touches[0];
    if (!t) return;
    e.preventDefault();
    e.stopPropagation();
    beginDragAt(t.clientX);
  }

  // ✅ both dots move using same progress
  const leftX = progress * travelPx;
  const rightX = -progress * travelPx;

  const dotTransition = merging
    ? "transform 180ms cubic-bezier(0.2, 1, 0.2, 1)"
    : isDragging
      ? "transform 0ms"
      : "transform 220ms ease-out";

  return (
    <div ref={wrapperRef} className="fixed inset-0 z-[999] bg-slate-950 flex flex-col">
      <style>
        {`
          @keyframes tsPulseGlow {
            0%, 100% {
              box-shadow: 0 12px 28px rgba(0,0,0,0.25), 0 0 0 0 rgba(59,130,246,0.0);
            }
            50% {
              box-shadow: 0 12px 28px rgba(0,0,0,0.25), 0 0 0 12px rgba(59,130,246,0.18);
            }
          }
          @keyframes tsPopIn {
            0% { transform: translate(-50%, -50%) scale(0.85); opacity: 0; }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          }
          @keyframes tsBurst {
            0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0.0; }
            20% { opacity: 0.9; }
            100% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; }
          }
          @keyframes tsMergedPulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); }
            50% { transform: translate(-50%, -50%) scale(1.04); }
          }
        `}
      </style>

      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur">
        <button onClick={goBack} className="rounded-full border bg-white px-4 py-2 text-sm font-semibold">
          ← Back
        </button>

        <div className="rounded-full border bg-white px-4 py-2 text-sm font-semibold text-slate-800">
          Blend Builder • 2 Letters
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            disabled={idx === 0}
            className={[
              "rounded-full border px-4 py-2 text-sm font-semibold",
              idx === 0 ? "opacity-40 cursor-not-allowed bg-white" : "bg-white hover:bg-slate-50",
            ].join(" ")}
          >
            ◀
          </button>
          <button
            onClick={next}
            disabled={idx === ITEMS.length - 1}
            className={[
              "rounded-full border px-4 py-2 text-sm font-semibold",
              idx === ITEMS.length - 1 ? "opacity-40 cursor-not-allowed bg-white" : "bg-white hover:bg-slate-50",
            ].join(" ")}
          >
            ▶
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 min-h-0">
        <div className="mx-auto h-full w-full max-w-6xl px-4 py-4 flex flex-col min-h-0">
          <div className="flex-1 min-h-0 rounded-2xl border border-white/10 bg-[#0b1220] shadow-sm overflow-hidden">
            <div ref={arenaRef} className="relative h-full w-full" style={{ touchAction: "none" }}>
              {/* stars */}
              <div
                className="absolute inset-0 opacity-70"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 30%, rgba(255,255,255,.18) 1px, transparent 1px), radial-gradient(circle at 70% 60%, rgba(255,255,255,.14) 1px, transparent 1px), radial-gradient(circle at 40% 80%, rgba(255,255,255,.10) 1px, transparent 1px)",
                  backgroundSize: "240px 240px",
                }}
              />

              {/* line */}
              <div className="absolute left-1/2 top-1/2 h-[6px] w-[56%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10" />

              {/* burst */}
              {showBurst && (
                <div
                  className="absolute left-1/2 top-1/2 h-[160px] w-[160px] rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(16,185,129,0.55) 0%, rgba(16,185,129,0.12) 45%, rgba(16,185,129,0) 70%)",
                    animation: "tsBurst 600ms ease-out forwards",
                  }}
                />
              )}

              {/* dots (hide when merged) */}
              {!merged && (
                <>
                  {/* right dot */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!started || merging) return;
                      speak(item.right);
                      setAttempts((a) => a + 1);
                    }}
                    className={[
                      "absolute left-[68%] top-1/2 -translate-x-1/2 -translate-y-1/2",
                      "h-[96px] w-[96px] rounded-full font-bold text-4xl",
                      "bg-white text-slate-900 shadow-lg transition select-none",
                    ].join(" ")}
                    style={{
                      transform: `translate(calc(-50% + ${rightX}px), -50%)`,
                      transition: dotTransition,
                      animation: started && !merging ? "tsPulseGlow 1600ms ease-in-out infinite 800ms" : undefined,
                      willChange: "transform",
                      zIndex: 5,
                    }}
                  >
                    {item.right}
                  </button>

                  {/* left dot */}
                  <button
                    type="button"
                    onMouseDown={onLeftMouseDown}
                    onTouchStart={onLeftTouchStart}
                    onClick={() => {
                      if (!started) return;
                      if (suppressClickRef.current) return;
                      if (!merging) {
                        speak(item.left);
                        setAttempts((a) => a + 1);
                      }
                    }}
                    className={[
                      "absolute left-[32%] top-1/2 -translate-x-1/2 -translate-y-1/2",
                      "h-[96px] w-[96px] rounded-full font-bold text-4xl",
                      "bg-white text-slate-900 shadow-lg transition select-none",
                    ].join(" ")}
                    style={{
                      transform: `translate(calc(-50% + ${leftX}px), -50%)`,
                      transition: dotTransition,
                      animation: started && !merging && !draggingRef.current ? "tsPulseGlow 1600ms ease-in-out infinite" : undefined,
                      touchAction: "none",
                      userSelect: "none",
                      WebkitUserSelect: "none",
                      cursor: "grab",
                      willChange: "transform",
                      zIndex: 5,
                    }}
                  >
                    {item.left}
                  </button>
                </>
              )}

              {/* ✅ merged dot at exact center showing "at" */}
              {merged && (
                <button
                  type="button"
                  onClick={() => speak(item.word)}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[108px] w-[108px] rounded-full bg-white text-slate-900 shadow-xl font-extrabold text-4xl"
                  style={{
                    animation: "tsPopIn 220ms ease-out forwards, tsMergedPulse 1500ms ease-in-out infinite 280ms",
                  }}
                >
                  {item.word}
                </button>
              )}

              {/* bottom instruction */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/35 px-4 py-3 text-center">
                <div className="text-sm font-semibold text-white">{instruction}</div>
                {started && !merged && !merging && (
                  <div className="mt-1 text-xs text-white/80">Tip: drag a → both dots slide into the middle.</div>
                )}
              </div>

              {/* start overlay */}
              {!started && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <div className="w-full max-w-md rounded-2xl bg-white px-6 py-6 shadow-xl text-center">
                    <div className="text-xl font-extrabold text-slate-900">Blend Builder</div>
                    <div className="mt-2 text-sm text-slate-600">Drag to blend • Hear the word</div>
                    <button
                      className="mt-5 w-full rounded-2xl bg-slate-900 px-4 py-3 text-white font-bold text-lg"
                      onClick={onStart}
                    >
                      Start (Fullscreen)
                    </button>
                    <div className="mt-3 text-xs text-slate-500">Note: sound + fullscreen needs one tap.</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom controls */}
          <div
            className="shrink-0 mt-3 flex flex-wrap gap-3"
            style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
          >
            <button onClick={reset} className="rounded-xl border bg-white px-4 py-2 font-semibold" disabled={!started}>
              Reset
            </button>

            <button
              onClick={() => {
                if (!started || merged || merging) return;
                speak(item.left);
                setAttempts((a) => a + 1);
              }}
              className="rounded-xl bg-white/90 px-4 py-2 font-semibold border"
              disabled={!started}
            >
              🔊 Sound "{item.left}"
            </button>

            <button
              onClick={() => {
                if (!started || merged || merging) return;
                speak(item.right);
                setAttempts((a) => a + 1);
              }}
              className="rounded-xl bg-white/90 px-4 py-2 font-semibold border"
              disabled={!started}
            >
              🔊 Sound "{item.right}"
            </button>

            <div className="ml-auto rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-700">
              Attempts: {attempts}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
