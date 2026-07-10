import type { MouseEvent, ReactNode, RefObject } from "react";
import TinyStepsBrand from "../common/TinyStepsBrand";
import MagicBento from "../common/MagicBento";
import LiquidEther from "../components/LiquidEther";
import type { EnglishExcellenceStage, EnglishExcellenceTile } from "../../lib/englishExcellenceMission";

export type EnglishExcellenceHubTrack = {
  stageId: string;
  stageNumber: number;
  title: string;
  completed: number;
  total: number;
  playable: number;
  pct: number;
};

export type EnglishExcellenceHubStat = {
  label: string;
  value: string | number;
};

export type EnglishExcellenceHubCard = {
  tile: EnglishExcellenceTile;
  icon: string;
  badgeText: string;
  badgeClassName: string;
  footerText: string;
  ctaText: string;
  locked: boolean;
  isCompleted: boolean;
  pulse?: boolean;
};

type EnglishExcellenceHubProps = {
  brandSubtitle: string;
  title: string;
  trustLine?: string;
  topRight?: ReactNode;
  currentStage: EnglishExcellenceStage;
  trainingTracks: EnglishExcellenceHubTrack[];
  stats: EnglishExcellenceHubStat[];
  cards: EnglishExcellenceHubCard[];
  selectedStageIndex: number;
  onSelectStage: (idx: number) => void;
  onTileClick: (stageNumber: number, tile: EnglishExcellenceTile) => void;
  onToggleComplete?: (
    event: MouseEvent<HTMLButtonElement>,
    stageNumber: number,
    tile: EnglishExcellenceTile,
  ) => void;
  onPulseEnd?: () => void;
  tabsRef?: RefObject<(HTMLButtonElement | null)[]>;
};

export default function EnglishExcellenceHub({
  brandSubtitle,
  title,
  trustLine,
  topRight,
  currentStage,
  trainingTracks,
  stats,
  cards,
  selectedStageIndex,
  onSelectStage,
  onTileClick,
  onToggleComplete,
  onPulseEnd,
  tabsRef,
}: EnglishExcellenceHubProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05010f] p-3 sm:p-4">
      <style>{`
        .lms-kpi {
          border: 1px solid rgba(196, 181, 253, 0.18);
          background: linear-gradient(180deg, rgba(18, 12, 38, 0.95) 0%, rgba(12, 9, 28, 0.92) 100%);
          border-radius: 1.25rem;
          padding: 0.9rem 1rem;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 10px 24px rgba(2, 6, 23, 0.26);
        }
        .tiles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 0.9rem;
          align-items: stretch;
        }
        .tile {
          background:
            radial-gradient(circle at top, rgba(79, 70, 229, 0.16), transparent 34%),
            linear-gradient(180deg, rgba(13, 9, 28, 0.98) 0%, rgba(8, 5, 22, 0.96) 100%);
          border: 1px solid rgba(196, 181, 253, 0.14);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.05),
            0 16px 36px rgba(2, 6, 23, 0.36);
          transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
          min-height: 170px;
        }
        .tile:hover {
          transform: translateY(-2px);
          border-color: rgba(167, 139, 250, 0.38);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.05),
            0 18px 42px rgba(59, 130, 246, 0.22);
        }
        .tile.locked {
          opacity: 0.78;
          filter: saturate(0.7);
        }
        .magic-bento-title {
          text-shadow: 0 2px 8px rgba(15, 23, 42, 0.45);
        }
        .magic-bento-description {
          line-height: 1.4;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseRing {
          0% { box-shadow: 0 0 0 0 rgba(96, 165, 250, 0.45); }
          80% { box-shadow: 0 0 0 16px rgba(96, 165, 250, 0); }
          100% { box-shadow: 0 0 0 0 rgba(96, 165, 250, 0); }
        }
        .pulse {
          position: relative;
          border-color: rgba(96, 165, 250, 0.8) !important;
        }
        .pulse::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 1rem;
          animation: pulseRing 1s ease-out 1;
        }
        @media (prefers-reduced-motion: reduce) {
          .tile { transition: none !important; }
          .pulse, .pulse::after { animation: none !important; }
        }
      `}</style>

      <div className="absolute inset-0 pointer-events-none">
        <LiquidEther
          className="absolute inset-0 opacity-95"
          style={{ width: "100%", height: "100%" }}
          mouseForce={20}
          cursorSize={100}
          isViscous
          viscous={30}
          colors={["#1A063F", "#3B1289", "#6D28D9"]}
          autoDemo
          autoSpeed={0.5}
          autoIntensity={2.2}
          isBounce={false}
          resolution={0.5}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#04020d]/74 via-[#090318]/60 to-[#12042c]/76" />
      </div>

      <div className="relative z-20 w-full max-w-6xl mx-auto px-4 mb-2">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-slate-900/10 bg-white/65 backdrop-blur-md px-3 py-2 shadow-sm">
          <TinyStepsBrand
            to=""
            subtitle={brandSubtitle}
            className="pointer-events-none px-0 py-0 hover:bg-transparent"
            titleClassName="text-base"
            subtitleClassName="tracking-[0.18em]"
          />

          <div className="flex justify-center">
            <div className="inline-flex items-center rounded-full border border-indigo-400/40 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 px-4 py-1.5 shadow-[0_8px_24px_rgba(59,130,246,0.35)]">
              <span
                className="text-center text-sm md:text-2xl font-black tracking-[0.02em] text-white whitespace-nowrap overflow-hidden text-ellipsis"
                style={{ textShadow: "0 2px 8px rgba(2, 6, 23, 0.45)" }}
              >
                {title}
              </span>
            </div>
          </div>

          <div className="flex justify-end">{topRight}</div>
        </div>
        {trustLine ? (
          <p className="mt-2 text-center text-xs font-semibold tracking-[0.01em] text-slate-200 sm:text-sm">
            {trustLine}
          </p>
        ) : null}
      </div>

      <div className="relative z-10 w-full max-w-[1320px] mx-auto px-4 pb-4 xl:h-[calc(100vh-124px)]">
        <div className="grid grid-cols-1 xl:grid-cols-[240px_minmax(0,1fr)] gap-3 items-start xl:h-full xl:min-h-0">
          <aside className="rounded-2xl border border-violet-300/20 bg-slate-950/42 backdrop-blur-md shadow-sm p-2.5 xl:h-full xl:min-h-0 xl:flex xl:flex-col">
            <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-cyan-300/35 bg-slate-900/65 px-2.5 py-1 shadow-[0_6px_18px_rgba(34,211,238,0.25)]">
              <span
                className="bg-gradient-to-r from-cyan-200 via-fuchsia-200 to-lime-200 bg-clip-text text-xs font-black uppercase tracking-[0.2em] text-transparent"
                style={{ textShadow: "0 0 10px rgba(34, 211, 238, 0.42)" }}
              >
                Training Tracks
              </span>
            </div>
            <div className="grid gap-1.5 xl:flex-1 xl:min-h-0 xl:overflow-y-auto xl:pr-1">
              {trainingTracks.map((track, idx) => (
                <button
                  key={track.stageId}
                  ref={(el) => {
                    if (tabsRef?.current) tabsRef.current[idx] = el;
                  }}
                  onClick={() => onSelectStage(idx)}
                  type="button"
                  className={`w-full h-full min-h-0 overflow-hidden text-left rounded-xl border px-2 py-1.5 transition-all ${
                    idx === selectedStageIndex
                      ? "border-violet-400/60 bg-violet-500/12 shadow-sm"
                      : "border-violet-300/20 bg-slate-900/45 hover:bg-slate-900/60 hover:border-violet-300/35"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="inline-flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px] font-black">
                      {track.stageNumber}
                    </span>
                    <span className="text-[10px] font-bold text-violet-100/85">
                      {track.completed}/{track.total}
                    </span>
                  </div>
                  <div className="text-[13px] font-extrabold text-slate-100 leading-tight">{track.title}</div>
                  <div className="text-[10px] font-semibold text-slate-300 mt-0.5">{track.playable} ready</div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-slate-700/70 overflow-hidden">
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                      style={{ width: `${track.pct}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <main className="rounded-2xl border border-violet-300/20 bg-slate-950/52 backdrop-blur-md shadow-sm p-3 xl:h-full xl:flex xl:flex-col">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              {stats.map((stat) => (
                <div key={stat.label} className="lms-kpi">
                  <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-violet-200/80">{stat.label}</div>
                  <div className="mt-1 text-xl font-black text-slate-100">{stat.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-3 xl:flex-1 xl:min-h-0 xl:overflow-y-auto pr-1">
              <MagicBento
                textAutoHide
                enableStars
                enableSpotlight
                enableBorderGlow
                enableTilt={false}
                enableMagnetism={false}
                clickEffect
                spotlightRadius={400}
                particleCount={12}
                glowColor="168, 85, 247"
                disableAnimations={false}
              >
                <div className="tiles-grid">
                  {cards.map((card, idx) => (
                    <div
                      key={card.tile.gameId}
                      onClick={() => onTileClick(currentStage.stageNumber, card.tile)}
                      className={`magic-bento-card tile rounded-2xl p-4 flex flex-col gap-3 ${card.locked ? "locked" : "cursor-pointer"} ${
                        card.pulse ? "pulse" : ""
                      }`}
                      style={{
                        animationFillMode: "both",
                        animationDuration: "0.35s",
                        animationDelay: `${idx * 35}ms`,
                        animationName: "fadeInUp",
                      }}
                      onAnimationEnd={() => {
                        if (card.pulse) onPulseEnd?.();
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-10 h-10 rounded-xl bg-slate-900/60 border border-slate-300/20 flex items-center justify-center text-xl shadow-inner">
                          {card.icon}
                        </div>

                        <div className="flex items-center gap-2">
                          <div
                            className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-extrabold tracking-wider border ${card.badgeClassName}`}
                            title={`Status: ${card.badgeText}`}
                          >
                            {card.badgeText}
                          </div>

                          {!card.locked && onToggleComplete ? (
                            <button
                              type="button"
                              onClick={(event) => onToggleComplete(event, currentStage.stageNumber, card.tile)}
                              className={`
                                w-8 h-8 rounded-full border flex items-center justify-center text-sm font-black
                                ${
                                  card.isCompleted
                                    ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-200"
                                    : "bg-slate-900/45 border-slate-300/25 text-slate-200 hover:bg-slate-800/70 hover:text-white"
                                }
                              `}
                              title={card.isCompleted ? "Set to in progress" : "Mark as completed"}
                              aria-label={card.isCompleted ? "Set to in progress" : "Mark as completed"}
                            >
                              ✓
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <div className="min-h-[56px]">
                        <div className="magic-bento-title text-base font-extrabold text-slate-100 leading-snug">{card.tile.gameTitle ?? card.tile.title}</div>
                        <div className="magic-bento-description text-xs text-slate-300/85 font-semibold mt-1">{card.tile.desc}</div>
                      </div>

                      <div className="mt-auto flex items-center justify-between">
                        <div className="text-[11px] text-slate-300/80 font-bold">{card.footerText}</div>

                        <div
                          className={`
                            text-xs font-extrabold px-3 py-1.5 rounded-xl border shadow-sm
                            ${
                              card.locked
                                ? "bg-slate-800/70 border-slate-400/20 text-slate-300"
                                : "bg-gradient-to-r from-indigo-600 to-sky-600 border-white/40 text-white"
                            }
                          `}
                        >
                          {card.ctaText}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </MagicBento>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
