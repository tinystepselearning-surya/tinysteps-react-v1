import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SlideJoinGame from "./SlideJoinGame";
import TapWordGame from "./TapWordGame";
import {
  type LevelId,
  type VowelGroupId,
  MY_FIRST_WORDS_META,
  LEVELS,
  VOWEL_GROUPS,
} from "./myFirstWordsData";
import { applyKidAndMissionContext, buildMissionReturnHref } from "../missionNavigation";

type MyFirstWordsGameProps = {
  forceAnonymousMode?: boolean;
  missionReturnHrefOverride?: string;
  missionBackLabel?: string;
};

export default function MyFirstWordsGame({
  forceAnonymousMode = false,
  missionReturnHrefOverride,
  missionBackLabel = "← Back to Mission",
}: MyFirstWordsGameProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const kidId =
    forceAnonymousMode ? "" : searchParams.get("kidId") || localStorage.getItem("ts_active_kid_v1") || "";
  const missionReturnHref =
    missionReturnHrefOverride ?? buildMissionReturnHref(searchParams, kidId);

  type Mode = "slide_join" | "tap_word";

  const urlModeRaw = (searchParams.get("mode") || "").toLowerCase();
  const forcedMode: Mode | null =
    urlModeRaw === "tap_word"
      ? "tap_word"
      : urlModeRaw === "slide_join"
      ? "slide_join"
      : null;

  const subtitle =
    forcedMode === "slide_join"
      ? "Level 1: Slide & Join (Practice)"
      : forcedMode === "tap_word"
      ? "Level 2: Tap the Word (Quick Quiz)"
      : "Level 1: Slide & Join (Practice) · Level 2: Tap the Word (Quick Quiz)";

  const [activeLevelId, setActiveLevelId] = useState<LevelId>(
    forcedMode ?? "slide_join"
  );
  const [activeGroupId, setActiveGroupId] = useState<VowelGroupId | null>(null);
  const [isInGameplay, setIsInGameplay] = useState(false);

  useEffect(() => {
    if (forcedMode && activeLevelId !== forcedMode) setActiveLevelId(forcedMode);
  }, [forcedMode, activeLevelId]);

  const activeLevel = useMemo(
    () => LEVELS.find((l) => l.id === activeLevelId) ?? LEVELS[0],
    [activeLevelId]
  );

  const activeGroup = useMemo(() => {
    if (!activeGroupId) return null;
    return VOWEL_GROUPS.find((g) => g.id === activeGroupId) ?? null;
  }, [activeGroupId]);

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

  function onPickMode(next: LevelId) {
    if (forcedMode) return;
    setActiveLevelId(next);

    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      applyKidAndMissionContext(p, searchParams, kidId);
      p.set("mode", next);
      return p;
    });
  }

  function goBack() {
    exitFullscreenIfAny();
    navigate(missionReturnHref);
  }

  function onBackToGroups() {
    setIsInGameplay(false);
    setActiveGroupId(null);
  }

  const modeBadge =
    activeLevelId === "slide_join" ? "practice" : "quick quiz";

  return (
    <div
      ref={wrapperRef}
      className="fixed inset-0 z-[999] flex flex-col"
      style={{
        background: "linear-gradient(180deg, #050510 0%, #150a2b 35%, #0b2a5e 100%)",
        boxShadow: "inset 0 0 160px rgba(0,0,0,0.75)",
      }}
    >
      <div className="absolute inset-0 blend-stars" aria-hidden />

      <style>
        {`
          .blend-stars::before, .blend-stars::after {
            content: '';
            position: absolute;
            inset: 0;
            pointer-events: none;
            background-image:
              radial-gradient(circle at 10% 15%, white 1px, transparent 1.1px),
              radial-gradient(circle at 80% 20%, white 0.8px, transparent 0.9px),
              radial-gradient(circle at 30% 70%, white 1px, transparent 1.1px),
              radial-gradient(circle at 65% 60%, white 0.9px, transparent 1px);
            background-size: 110px 110px;
          }
          .blend-stars::before { animation: slowDrift 120s linear infinite, twinkle 6s ease-in-out infinite; }
          .blend-stars::after { background-size: 160px 160px; animation: slowDrift 160s linear infinite, twinkle 8s ease-in-out infinite 2s; }

          @keyframes twinkle { 0%,100%{opacity:0.35}50%{opacity:1} }
          @keyframes slowDrift { 0%{transform:translate(0,0)}100%{transform:translate(20px,-20px)} }
          @keyframes tsTapPop { 0%{transform:scale(1)}40%{transform:scale(1.10)}100%{transform:scale(1)} }
          @keyframes tsBurst { 0%{transform:translate(-50%,-50%) scale(0.3);opacity:0}20%{opacity:.9}100%{transform:translate(-50%,-50%) scale(1.8);opacity:0} }
          @keyframes tsPopIn { 0%{transform:translate(-50%,-50%) scale(.85);opacity:0}100%{transform:translate(-50%,-50%) scale(1);opacity:1} }
          @keyframes tsMergedPulse { 0%,100%{transform:scale(1)}50%{transform:scale(1.03)} }
          @keyframes tsArrowPulse { 0%,100%{transform:translateY(-50%) scale(1)}50%{transform:translateY(-50%) scale(1.06)} }
          @keyframes tsConfettiFall {
            0%{transform:translate3d(var(--dx),-15vh,0) rotate(var(--rot));opacity:0}
            12%{opacity:1}
            100%{transform:translate3d(var(--dx2),110vh,0) rotate(calc(var(--rot) + 320deg));opacity:0}
          }

          .ts-side-btn{
            position:absolute;top:50%;
            transform:translateY(-50%);
            z-index:60;
            width:56px;height:56px;border-radius:999px;
            background:rgba(255,255,255,0.82);
            backdrop-filter:blur(10px);
            border:1px solid rgba(0,0,0,0.10);
            box-shadow:0 14px 34px rgba(0,0,0,0.14);
            display:grid;place-items:center;
            font-size:22px;font-weight:900;
            color:rgba(15,23,42,0.92);
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
        `}
      </style>

      {isInGameplay && activeGroup ? (
        <>
          {activeLevelId === "slide_join" ? (
            <SlideJoinGame
              kidId={kidId}
              groupId={activeGroup.id}
              group={activeGroup}
              onBackToGroups={onBackToGroups}
              forceAnonymousMode={forceAnonymousMode}
            />
          ) : (
            <TapWordGame
              kidId={kidId}
              groupId={activeGroup.id}
              group={activeGroup}
              onBackToGroups={onBackToGroups}
              forceAnonymousMode={forceAnonymousMode}
              onNextGroup={() => {
                const ids = VOWEL_GROUPS.map((g) => g.id);
                const i = Math.max(0, ids.indexOf(activeGroup.id));
                const nextId = ids[i + 1] ?? ids[0];
                setActiveGroupId(nextId);
                setIsInGameplay(true);
              }}
            />
          )}
        </>
      ) : (
        <div className="flex-1 min-h-0 relative overflow-auto flex flex-col items-center justify-start py-12 px-4">
          <button
            onClick={goBack}
            className="absolute top-6 right-6 px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold rounded-full shadow-lg hover:bg-white/20 hover:scale-105 transition-all duration-200 z-10"
          >
            {missionBackLabel}
          </button>

          <div className="w-full max-w-6xl mx-auto text-center mb-8 relative z-10">
            <h1 className="text-5xl md:text-6xl font-bold text-white drop-shadow-2xl">{MY_FIRST_WORDS_META.title}</h1>
            <p className="text-lg text-purple-300 mt-2 drop-shadow-lg">{subtitle}</p>

            {forcedMode == null && (
              <div className="mt-8 inline-block">
                <div className="text-xs font-semibold text-white/70 mb-3 tracking-wider uppercase">Choose Level</div>
                <div className="flex flex-wrap justify-center gap-3 px-6 py-4 rounded-2xl bg-black/30 border border-white/10 backdrop-blur-md shadow-2xl">
                  {LEVELS.map((l) => {
                    const active = activeLevelId === l.id;
                    return (
                      <button
                        key={l.id}
                        onClick={() => onPickMode(l.id)}
                        className={`px-6 py-3 rounded-full font-bold text-base md:text-lg transition-all whitespace-nowrap ${
                          active
                            ? "bg-white/25 text-white border-2 border-white/60 ring-2 ring-white/30 shadow-xl scale-105"
                            : "bg-white/5 text-white/70 border-2 border-white/20 hover:bg-white/12 hover:border-white/40 hover:text-white/90"
                        }`}
                      >
                        {l.title}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 text-sm text-white/70">{activeLevel.subtitle}</div>
              </div>
            )}
          </div>

          <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            {VOWEL_GROUPS.map((group, i) => {
              const preview = group.words.map((w) => `-${w}`).join(", ");
              const gradients = [
                "bg-gradient-to-br from-pink-400/20 to-purple-400/20",
                "bg-gradient-to-br from-blue-400/20 to-cyan-400/20",
                "bg-gradient-to-br from-green-400/20 to-emerald-400/20",
                "bg-gradient-to-br from-yellow-400/20 to-orange-400/20",
                "bg-gradient-to-br from-violet-400/20 to-indigo-400/20",
              ];
              const bgGradient = gradients[i % gradients.length];

              return (
                <button
                  key={group.id}
                  onClick={() => {
                    setActiveGroupId(group.id);
                    setIsInGameplay(true);
                    requestRealFullscreen();
                  }}
                  className={`${bgGradient} p-6 rounded-2xl border border-white/20 backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-2xl cursor-pointer text-left`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-2xl font-bold text-white drop-shadow-lg">{group.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 text-[11px] font-bold rounded-full bg-white/20 text-white border border-white/20">
                        {modeBadge}
                      </span>
                      {group.hint && (
                        <span className="px-2 py-1 text-xs font-semibold bg-white/30 text-white rounded-full backdrop-blur-sm">
                          {group.hint}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-white/90 mt-3 drop-shadow">{preview}</p>

                  <div className="mt-5 flex items-center justify-between">
                    <div className="text-yellow-300 font-semibold drop-shadow">Play</div>
                    <div className="text-sm text-white/80 drop-shadow">
                      {group.words.length} families
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-white/70">
                    {activeLevelId === "slide_join"
                      ? "Practice building the words (blend the sounds)."
                      : "Quick quiz: listen and tap the correct word."}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
