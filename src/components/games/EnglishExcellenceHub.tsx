import type { MouseEvent, ReactNode, RefObject } from "react";
import { Link } from "react-router-dom";
import TinyStepsBrand from "../common/TinyStepsBrand";
import MagicBento from "../common/MagicBento";
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
  onTileClick?: (stageNumber: number, tile: EnglishExcellenceTile) => void;
  linkPlayableTiles?: boolean;
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
  linkPlayableTiles = false,
  onToggleComplete,
  onPulseEnd,
  tabsRef,
}: EnglishExcellenceHubProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05010f] px-3 pb-3 pt-12 sm:px-5 sm:py-3">
      <style>{`
        .lms-kpi {
          border: 1px solid rgba(196, 181, 253, 0.18);
          background: linear-gradient(180deg, rgba(18, 12, 38, 0.95) 0%, rgba(12, 9, 28, 0.92) 100%);
          border-radius: 0.625rem;
          padding: 0.6rem 0.75rem;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
        }
        .tiles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 0.65rem;
          align-items: stretch;
        }
        .tile {
          background:
            radial-gradient(circle at top, rgba(79, 70, 229, 0.16), transparent 34%),
            linear-gradient(180deg, rgba(13, 9, 28, 0.98) 0%, rgba(8, 5, 22, 0.96) 100%);
          border: 1px solid rgba(196, 181, 253, 0.14);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.05),
            0 8px 20px rgba(2, 6, 23, 0.28);
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

      <div className="relative z-20 mx-auto mb-3 w-full max-w-7xl">
        <header className="grid gap-3 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-3 backdrop-blur-md lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
          <TinyStepsBrand
            to=""
            subtitle={brandSubtitle}
            className="pointer-events-none hidden px-0 py-0 hover:bg-transparent lg:flex"
            titleClassName="text-sm"
            subtitleClassName="text-[9px] tracking-[0.12em]"
          />

          <div className="min-w-0">
            <h1 className="truncate text-xl font-black text-white sm:text-2xl">{title}</h1>
            {trustLine ? (
              <p className="mt-1 text-xs font-semibold text-emerald-200/90 sm:text-sm">{trustLine}</p>
            ) : null}
          </div>

          <div className="flex justify-start lg:justify-end">{topRight}</div>
        </header>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl pb-3">
        <div className="grid grid-cols-1 gap-3 items-start">
          <aside className="rounded-lg border border-violet-300/20 bg-slate-950/55 p-2.5 backdrop-blur-md">
            <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-cyan-300/35 bg-slate-900/65 px-2.5 py-1 shadow-[0_6px_18px_rgba(34,211,238,0.25)]">
              <span
                className="bg-gradient-to-r from-cyan-200 via-fuchsia-200 to-lime-200 bg-clip-text text-xs font-black uppercase tracking-[0.2em] text-transparent"
                style={{ textShadow: "0 0 10px rgba(34, 211, 238, 0.42)" }}
              >
                Training Tracks
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {trainingTracks.map((track, idx) => (
                <button
                  key={track.stageId}
                  ref={(el) => {
                    if (tabsRef?.current) tabsRef.current[idx] = el;
                  }}
                  onClick={() => onSelectStage(idx)}
                  type="button"
                  className={`min-w-40 overflow-hidden rounded-lg border px-2 py-1.5 text-left transition-all ${
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

          <main className="rounded-lg border border-violet-300/20 bg-slate-950/60 p-3 backdrop-blur-md">
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="lms-kpi">
                  <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-violet-200/80">{stat.label}</div>
                  <div className="mt-1 text-xl font-black text-slate-100">{stat.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-3">
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
                  {cards.map((card, idx) => {
                    const linkRoute = linkPlayableTiles && !card.locked ? card.tile.route : undefined;
                    return (
                    <article
                      key={card.tile.gameId}
                      onClick={linkRoute ? undefined : () => onTileClick?.(currentStage.stageNumber, card.tile)}
                      className={`magic-bento-card tile relative rounded-lg p-3 flex flex-col gap-2 ${card.locked ? "locked" : "cursor-pointer"} ${
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
                      {linkRoute ? (
                        <Link
                          to={linkRoute}
                          className="absolute inset-0 z-10 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                          aria-label={`Play ${card.tile.gameTitle ?? card.tile.title}`}
                        >
                          <span className="sr-only">Play {card.tile.gameTitle ?? card.tile.title}</span>
                        </Link>
                      ) : null}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300/20 bg-slate-900/60 text-lg shadow-inner">
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
                              onClick={(event) => {
                                event.stopPropagation();
                                event.preventDefault();
                                onToggleComplete(event, currentStage.stageNumber, card.tile);
                              }}
                              className={`
                                relative z-20 w-8 h-8 rounded-full border flex items-center justify-center text-sm font-black
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
                    </article>
                    );
                  })}
                </div>
              </MagicBento>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
