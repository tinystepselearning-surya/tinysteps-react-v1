import React, { useEffect, useMemo, useRef, useState } from "react";
import { recordLevelResult } from "../../../../../games/engine/recordLevelResult";

import type { VowelGroup, VowelGroupId } from "./myFirstWordsData";
import {
  GAME_ID,
  PROGRESS_DOC_ID,
  SND_CONFETTI,
  mergeSoundUrl,
  clamp,
  shuffle,
  makeTapOptions,
} from "./myFirstWordsData";

type Props = {
  kidId: string;
  groupId: VowelGroupId;
  group: VowelGroup;

  // existing
  onBackToGroups: () => void;

  // NEW (optional): lets the game jump to the next group immediately
  onNextGroup?: () => void;

  // OPTIONAL (only if your parent has these “levels” screens)
  onBackToLevels?: () => void; // go back to Level picker (Level 1 / Level 2)
  onPracticeLevel1?: () => void; // jump to Slide & Join for same group
};

type Phase = "playing" | "success_pause" | "group_complete";

export default function TapWordGame({
  kidId,
  groupId,
  group,
  onBackToGroups,
  onNextGroup,
  onBackToLevels,
  onPracticeLevel1,
}: Props) {
  // order of questions
  const [order, setOrder] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);

  // answers
  const [options, setOptions] = useState<string[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  // feedback FX
  const [confettiKey, setConfettiKey] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shakeWord, setShakeWord] = useState<string | null>(null);

  // gameplay UI
  const [heartsLeft, setHeartsLeft] = useState(3);
  const [starsEarned, setStarsEarned] = useState(0);
  const [guideMsg, setGuideMsg] = useState("Tap Listen!");

  // phase / transitions
  const [phase, setPhase] = useState<Phase>("playing");
  const [showCorrectBanner, setShowCorrectBanner] = useState(false);

  // tracking
  const [attempts, setAttempts] = useState(0);
  const [startTs, setStartTs] = useState<number | null>(null);

  // audio
  const audioUnlockedRef = useRef(false);
  const wordAudioRef = useRef<HTMLAudioElement | null>(null);
  const confettiRef = useRef<HTMLAudioElement | null>(null);

  const list = useMemo(() => (order.length ? order : group.words), [order, group.words]);

  const target = useMemo(() => {
    return list[clamp(idx, 0, Math.max(0, list.length - 1))] ?? group.words[0] ?? "at";
  }, [list, idx, group.words]);

  const isLast = useMemo(() => idx >= Math.max(0, list.length - 1), [idx, list.length]);

  const nextQuestionNumber = useMemo(() => {
    if (isLast) return idx + 1;
    return idx + 2;
  }, [idx, isLast]);

  function initGroup() {
    const shuffled = shuffle(group.words);
    setOrder(shuffled);
    setIdx(0);

    setAttempts(0);
    setStartTs(performance.now());

    setPicked(null);
    setLocked(false);
    setShakeWord(null);

    setHeartsLeft(3);
    setStarsEarned(0);
    setGuideMsg("Tap Listen!");

    setPhase("playing");
    setShowCorrectBanner(false);

    const first = shuffled[0] ?? group.words[0];
    setOptions(makeTapOptions(first, group.words));
  }

  // init shuffle + first options on mount / group change
  useEffect(() => {
    initGroup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id, group.words]);

  // rebuild options whenever target changes
  useEffect(() => {
    if (!target) return;

    setOptions(makeTapOptions(target, group.words));
    setPicked(null);
    setLocked(false);
    setShakeWord(null);

    // hearts are “tries per question” here
    setHeartsLeft(3);
    setGuideMsg("Tap Listen!");
    setAttempts(0);
    setStartTs(performance.now());
    setShowCorrectBanner(false);
  }, [target, group.words]);

  useEffect(() => {
    if (heartsLeft === 0 && picked !== target) {
      setGuideMsg("Tap Listen again 🎧");
    }
  }, [heartsLeft, picked, target]);

  // keep audio ready (and stop old audio first)
  useEffect(() => {
    try {
      wordAudioRef.current?.pause();
      if (wordAudioRef.current) wordAudioRef.current.currentTime = 0;
    } catch {}

    const a = new Audio(mergeSoundUrl(target));
    a.preload = "auto";
    a.loop = false;
    wordAudioRef.current = a;

    if (!confettiRef.current) {
      const c = new Audio(SND_CONFETTI);
      c.preload = "auto";
      c.loop = false;
      c.volume = 0.35;
      confettiRef.current = c;
    }
  }, [target]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        wordAudioRef.current?.pause();
        if (wordAudioRef.current) wordAudioRef.current.currentTime = 0;
        confettiRef.current?.pause();
        if (confettiRef.current) confettiRef.current.currentTime = 0;
      } catch {}
      wordAudioRef.current = null;
      confettiRef.current = null;
    };
  }, []);

  async function unlockAudio() {
    if (audioUnlockedRef.current) return;

    const listA = [wordAudioRef.current, confettiRef.current].filter(Boolean) as HTMLAudioElement[];
    try {
      for (const a of listA) {
        try {
          a.pause();
          a.currentTime = 0;
          const prev = a.volume;
          a.volume = 0;
          const p = a.play();
          if (p && typeof (p as any).then === "function") await p;
          a.pause();
          a.currentTime = 0;
          a.volume = prev;
        } catch {}
      }
      audioUnlockedRef.current = true;
    } catch {}
  }

  async function playWord() {
    await unlockAudio();
    try {
      const a = wordAudioRef.current;
      if (!a) return;
      a.pause();
      a.currentTime = 0;
      const p = a.play();
      if (p && typeof (p as any).catch === "function") p.catch(() => {});
    } catch {}
  }

  async function playConfetti() {
    await unlockAudio();
    try {
      const a = confettiRef.current;
      if (!a) return;
      a.pause();
      a.currentTime = 0;
      const p = a.play();
      if (p && typeof (p as any).catch === "function") p.catch(() => {});
    } catch {}
  }

  function fireSuccess() {
    setConfettiKey((k) => k + 1);
    setShowConfetti(true);
    window.setTimeout(() => setShowConfetti(false), 1100);
    playConfetti();
  }

  function recordProgress(masteredWord: string, attemptsUsed: number) {
    if (!kidId) return;

    const spentMs = startTs ? Math.max(0, Math.round(performance.now() - startTs)) : 0;

    try {
      recordLevelResult({
        gameId: GAME_ID,
        progressDocId: PROGRESS_DOC_ID,
        kidId,
        levelId: idx + 1,
        timeSpentMs: spentMs,
        attempts: Math.max(1, attemptsUsed),
        masteredItems: [masteredWord],
        skillTags: [
          "area:phonics",
          "subtopic:my_first_words",
          "mode:tap_word",
          `group:${groupId}`,
          `word:${masteredWord}`,
        ],
        completedAt: Date.now(),
      } as any);
    } catch (err) {
      console.error("recordLevelResult failed:", err);
    }
  }

  function next() {
    const last = list.length - 1;
    setIdx((p) => clamp(p + 1, 0, last));
    setAttempts(0);
    setStartTs(performance.now());
  }

  function onPick(w: string) {
    if (locked || phase !== "playing") return;

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setPicked(w);

    if (w === target) {
      // ✅ Correct
      setLocked(true);
      setGuideMsg("Yay! ⭐");
      setStarsEarned((s) => Math.min(3, s + 1));
      fireSuccess();
      playWord();
      recordProgress(target, nextAttempts);

      // 👇 IMPORTANT: slow + obvious transition
      setPhase("success_pause");
      setShowCorrectBanner(true);

      // Keep the correct tile visible long enough to notice
      // (Kids need a beat to understand “I did it!”)
      const HOLD_MS = 1500;

      window.setTimeout(() => {
        setShowCorrectBanner(false);

        if (isLast) {
          setPhase("group_complete");
          setLocked(false);
          return;
        }

        // little “swap” feel
        setLocked(false);
        setPhase("playing");
        next();
      }, HOLD_MS);
    } else {
      // ❌ Wrong
      setLocked(true);
      setShakeWord(w);
      setGuideMsg("Oops! Try again ❤️");
      setHeartsLeft((h) => Math.max(0, h - 1));

      window.setTimeout(() => {
        setLocked(false);
        setShakeWord(null);
      }, 520);
    }
  }

  // confetti pieces
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

  const progressDots = useMemo(
    () => Array.from({ length: group.words.length }).map((_, i) => i),
    [group.words.length]
  );

  // tile themes (space candy)
  const tileThemes = useMemo(
    () => [
      {
        bg: "linear-gradient(135deg, rgba(59,130,246,.22), rgba(255,255,255,.92))",
        dot: "rgba(59,130,246,.95)",
      },
      {
        bg: "linear-gradient(135deg, rgba(168,85,247,.22), rgba(255,255,255,.92))",
        dot: "rgba(168,85,247,.95)",
      },
      {
        bg: "linear-gradient(135deg, rgba(236,72,153,.22), rgba(255,255,255,.92))",
        dot: "rgba(236,72,153,.95)",
      },
    ],
    []
  );

  const showGroupCompleteModal = phase === "group_complete";

  return (
    <div className="absolute inset-0">
      <style>{`
        @keyframes tsShake {
          0%,100% { transform: translateX(0) }
          20% { transform: translateX(-10px) }
          40% { transform: translateX(10px) }
          60% { transform: translateX(-7px) }
          80% { transform: translateX(7px) }
        }

        @keyframes tsPulseRing {
          0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.22) }
          100% { box-shadow: 0 0 0 22px rgba(255,255,255,0) }
        }

        @keyframes tsTileGlow {
          0%,100% { box-shadow: 0 18px 55px rgba(0,0,0,0.20), 0 0 0 rgba(0,0,0,0); transform: translateY(0) }
          50% { box-shadow: 0 24px 70px rgba(0,0,0,0.24), 0 0 28px rgba(168,85,247,0.20); transform: translateY(-2px) }
        }

        @keyframes tsShimmer {
          0% { transform: translateX(-140%) skewX(-14deg); opacity: 0; }
          22% { opacity: .20; }
          55% { opacity: .14; }
          100% { transform: translateX(140%) skewX(-14deg); opacity: 0; }
        }

        @keyframes tsFloat {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        @keyframes tsBars {
          0% { transform: scaleY(.35); opacity:.55; }
          50% { transform: scaleY(1); opacity:1; }
          100% { transform: scaleY(.45); opacity:.6; }
        }

        @keyframes tsConfettiFall {
          0%{transform:translate3d(var(--dx),-15vh,0) rotate(var(--rot));opacity:0}
          12%{opacity:1}
          100%{transform:translate3d(var(--dx2),110vh,0) rotate(calc(var(--rot) + 320deg));opacity:0}
        }

        @keyframes tsPop {
          0%{ transform: scale(.92); opacity:0 }
          100%{ transform: scale(1); opacity:1 }
        }

        @keyframes tsNebulaPulse {
          0%,100% { opacity: .62; filter: blur(70px); transform: scale(1); }
          50% { opacity: .85; filter: blur(82px); transform: scale(1.05); }
        }

        .ts-confetti-piece{
          position:absolute;top:0;border-radius:2px;opacity:0;
          animation:tsConfettiFall var(--dur) ease-in forwards;
          animation-delay:var(--delay);
          will-change:transform,opacity;
        }
        .ts-confetti-piece:nth-child(6n+1){background:rgba(59,130,246,0.75);}
        .ts-confetti-piece:nth-child(6n+2){background:rgba(16,185,129,0.75);}
        .ts-confetti-piece:nth-child(6n+3){background:rgba(249,115,22,0.75);}
        .ts-confetti-piece:nth-child(6n+4){background:rgba(168,85,247,0.75);}
        .ts-confetti-piece:nth-child(6n+5){background:rgba(236,72,153,0.70);}
        .ts-confetti-piece:nth-child(6n+6){background:rgba(245,158,11,0.75);}

        .ts-guide { animation: tsFloat 2.4s ease-in-out infinite; }

        .ts-bars span{
          display:inline-block;
          width:4px;
          height:14px;
          margin:0 2px;
          border-radius:3px;
          background: rgba(15,23,42,.75);
          transform-origin: bottom;
          animation: tsBars 900ms ease-in-out infinite;
        }
        .ts-bars span:nth-child(2){ animation-delay:120ms; height:18px; }
        .ts-bars span:nth-child(3){ animation-delay:240ms; height:12px; }
        .ts-bars span:nth-child(4){ animation-delay:360ms; height:16px; }

        .ts-answer-tile {
          position: relative;
          border: 2px solid rgba(255,255,255,0.28);
          box-shadow: 0 18px 55px rgba(0,0,0,0.20);
          overflow: hidden;
        }
        .ts-answer-tile::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 18px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent);
          width: 55%;
          transform: translateX(-140%) skewX(-14deg);
          animation: tsShimmer 3.8s ease-in-out infinite;
          pointer-events: none;
        }

        .ts-answer-idle { animation: tsTileGlow 3.4s ease-in-out infinite; }

        .ts-modal {
          animation: tsPop 160ms ease-out both;
        }
      `}</style>

      {/* Extra colorful “nebula” overlays (keeps your space theme more attractive) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-24 -left-24 w-[520px] h-[520px] rounded-full"
          style={{
            background: "radial-gradient(circle at 30% 30%, rgba(168,85,247,.55), transparent 60%)",
            animation: "tsNebulaPulse 6s ease-in-out infinite",
          }}
        />
        <div
          className="absolute top-10 -right-24 w-[520px] h-[520px] rounded-full"
          style={{
            background: "radial-gradient(circle at 30% 30%, rgba(59,130,246,.55), transparent 60%)",
            animation: "tsNebulaPulse 7s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -bottom-28 left-1/3 w-[640px] h-[640px] rounded-full"
          style={{
            background: "radial-gradient(circle at 30% 30%, rgba(236,72,153,.45), transparent 62%)",
            animation: "tsNebulaPulse 8s ease-in-out infinite",
          }}
        />
      </div>

      {/* Back button */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={onBackToGroups}
          className="px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold rounded-full shadow-lg hover:bg-white/20 hover:scale-105 transition-all duration-200"
        >
          ← Back to Groups
        </button>
      </div>

      {/* Confetti */}
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

      {/* GROUP COMPLETE MODAL */}
      {showGroupCompleteModal && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" />
          <div className="relative ts-modal w-full max-w-2xl rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-6 md:p-8">
            <div className="text-center">
              <div className="text-white text-3xl md:text-4xl font-extrabold">
                🎉 Group Complete!
              </div>
              <div className="mt-2 text-white/80">
                You finished <span className="text-white font-bold">{group.title}</span>. What next?
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Optional: Practice Level 1 */}
              {onPracticeLevel1 ? (
                <button
                  onClick={onPracticeLevel1}
                  className="rounded-2xl bg-white/90 text-slate-900 font-extrabold p-4 hover:scale-[1.02] transition shadow-xl"
                >
                  🧩 Practice Level 1
                  <div className="text-xs font-semibold opacity-70 mt-1">Slide & Join</div>
                </button>
              ) : (
                <button
                  onClick={() => initGroup()}
                  className="rounded-2xl bg-white/90 text-slate-900 font-extrabold p-4 hover:scale-[1.02] transition shadow-xl"
                >
                  🔁 Play again
                  <div className="text-xs font-semibold opacity-70 mt-1">Same group</div>
                </button>
              )}

              {/* ✅ Next immediate group */}
              <button
                onClick={() => {
                  // Prefer true “next group” jump if wired, else fallback to group list.
                  if (onNextGroup) onNextGroup();
                  else onBackToGroups();
                }}
                className="rounded-2xl bg-emerald-500/85 text-white font-extrabold p-4 hover:scale-[1.02] transition shadow-xl border border-emerald-200/40"
              >
                🚀 Next Group
                <div className="text-xs font-semibold opacity-90 mt-1">
                  Go to the next group
                </div>
              </button>

              {/* Back */}
              <button
                onClick={() => (onBackToLevels ? onBackToLevels() : onBackToGroups())}
                className="rounded-2xl bg-indigo-500/60 text-white font-extrabold p-4 hover:scale-[1.02] transition shadow-xl border border-white/20"
              >
                ⬅️ {onBackToLevels ? "Back to Levels" : "Back to Groups"}
                <div className="text-xs font-semibold opacity-90 mt-1">
                  Choose again
                </div>
              </button>
            </div>

            {/* Always show play again button if we used the Practice slot */}
            {onPracticeLevel1 && (
              <div className="mt-5 flex justify-center">
                <button
                  onClick={() => initGroup()}
                  className="rounded-xl bg-white/20 text-white font-bold px-5 py-3 hover:bg-white/25 transition border border-white/20"
                >
                  🔁 Play this group again
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="w-full max-w-5xl">
          {/* Header + hearts/stars + progress */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="text-white text-3xl font-extrabold drop-shadow">{group.title}</div>
            <div className="mt-1 text-white/70 text-sm">Quick Quiz • Listen and tap what you hear</div>

            <div className="mt-2 flex items-center justify-center gap-4 text-lg">
              <div className="flex gap-1" aria-label="Hearts">
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{ opacity: heartsLeft > i ? 1 : 0.22 }}>❤️</span>
                ))}
              </div>
              <div className="flex gap-1" aria-label="Stars">
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{ opacity: starsEarned > i ? 1 : 0.22 }}>⭐</span>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              {progressDots.map((i) => {
                const done = i < idx;
                const current = i === idx;
                return (
                  <span
                    key={i}
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      background: current
                        ? "rgba(255,255,255,0.95)"
                        : done
                          ? "rgba(34,197,94,0.85)"
                          : "rgba(255,255,255,0.25)",
                      boxShadow: current ? "0 0 18px rgba(255,255,255,0.35)" : "none",
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* QUESTION CARD */}
          <div className="rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <div className="text-white/70 text-xs font-extrabold tracking-widest">QUESTION</div>
                <div className="text-white text-2xl md:text-3xl font-extrabold mt-2">
                  Tap <span className="underline decoration-white/40">Listen</span>, then choose the word
                </div>
                <div className="text-white/70 text-sm mt-2">Listen carefully… then tap one answer tile 👇</div>
              </div>

              {/* Listen + Guide */}
              <div className="flex items-center gap-3">
                <div className="ts-guide flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md">
                  <div
                    className="w-9 h-9 rounded-full grid place-items-center text-lg shadow"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(59,130,246,.95), rgba(168,85,247,.95))",
                      color: "white",
                    }}
                  >
                    👩‍🚀
                  </div>
                  <div className="text-white/90 text-sm font-semibold leading-tight">
                    {guideMsg}
                    <div className="text-white/60 text-xs font-medium">Tap Listen 🎧</div>
                  </div>
                </div>

                <button
                  onClick={playWord}
                  disabled={phase !== "playing" && phase !== "success_pause"}
                  className="relative rounded-2xl bg-white px-7 py-4 font-extrabold text-slate-900 shadow-xl hover:scale-105 active:scale-95 transition disabled:opacity-70"
                  style={{ animation: "tsPulseRing 1.2s ease-out infinite" }}
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="ts-bars" aria-hidden>
                      <span /><span /><span /><span />
                    </span>
                    🔊 Listen
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* ANSWERS CARD */}
          <div
            className="mt-5 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl p-6 md:p-8 relative"
            style={{
              opacity: phase === "success_pause" ? 0.92 : 1,
              transform: phase === "success_pause" ? "scale(0.995)" : "scale(1)",
              transition: "all 240ms ease",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-white/70 text-xs font-extrabold tracking-widest">ANSWERS</div>
              <div className="text-white/75 text-sm font-semibold">
                Question <span className="text-white">{idx + 1}</span> / {group.words.length}
              </div>
            </div>

            {/* ✅ CLEAR success banner so kids realize “completed” */}
            {showCorrectBanner && (
              <div className="absolute left-1/2 -translate-x-1/2 -top-6 z-10">
                <div
                  className="rounded-2xl px-6 py-4 text-white font-extrabold shadow-2xl border border-white/25"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(16,185,129,.92), rgba(59,130,246,.65))",
                  }}
                >
                  ✅ Correct!
                  <div className="text-sm font-semibold opacity-95 mt-1">
                    🚀 Get ready… Question {nextQuestionNumber}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {options.map((w, i) => {
                const isPicked = picked === w;
                const isCorrectPick = picked && w === target && isPicked;
                const isWrongPick = picked && w !== target && isPicked;

                const theme = tileThemes[i % tileThemes.length];

                const base =
                  "ts-answer-tile rounded-2xl p-6 text-center font-extrabold text-5xl md:text-6xl transition select-none";

                const idle =
                  "ts-answer-idle text-slate-900 hover:scale-[1.02] active:scale-95";

                const correct =
                  "text-white border-emerald-200 shadow-[0_0_34px_rgba(16,185,129,0.38)]";

                const wrong =
                  "text-white border-rose-200 shadow-[0_0_28px_rgba(244,63,94,0.30)]";

                const disabledAll = locked || phase !== "playing";

                const bg =
                  isCorrectPick
                    ? "linear-gradient(135deg, rgba(16,185,129,.92), rgba(34,197,94,.72))"
                    : isWrongPick
                      ? "linear-gradient(135deg, rgba(244,63,94,.92), rgba(249,115,22,.55))"
                      : theme.bg;

                const dotColor =
                  isCorrectPick
                    ? "rgba(16,185,129,.95)"
                    : isWrongPick
                      ? "rgba(244,63,94,.95)"
                      : theme.dot;

                return (
                  <button
                    key={w}
                    onClick={() => onPick(w)}
                    disabled={disabledAll}
                    className={[
                      base,
                      !picked ? idle : isCorrectPick ? correct : isWrongPick ? wrong : idle,
                    ].join(" ")}
                    style={{
                      background: bg,
                      animationName: shakeWord === w ? "tsShake" : undefined,
                      animationDuration: shakeWord === w ? "520ms" : undefined,
                      animationTimingFunction: shakeWord === w ? "ease-in-out" : undefined,
                      animationFillMode: shakeWord === w ? "both" : undefined,
                      animationDelay: !picked ? `${i * 140}ms` : undefined,
                      opacity: disabledAll && !isPicked ? 0.92 : 1,
                    }}
                  >
                    <span
                      className="absolute top-3 left-3 h-3 w-3 rounded-full"
                      style={{
                        background: dotColor,
                        boxShadow: `0 0 16px ${dotColor}`,
                      }}
                    />
                    {w}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex items-center justify-between text-white/80 text-sm">
              <div>Attempts: <span className="text-white font-bold">{attempts}</span></div>

              {/* If group complete, hint the modal */}
              {phase === "group_complete" ? (
                <button
                  onClick={() => setPhase("group_complete")}
                  className="rounded-xl bg-white/15 text-white font-bold px-4 py-2 border border-white/20 hover:bg-white/20 transition"
                >
                  🎉 See options
                </button>
              ) : null}
            </div>

            {picked && picked !== target && (
              <div className="mt-4 text-center text-white font-semibold">
                Oops 😊 Tap <span className="underline">Listen</span> and try again!
              </div>
            )}

            {phase === "group_complete" && (
              <div className="mt-4 text-center text-emerald-200 font-extrabold text-lg">
                Yay! You finished this group 🎉
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
