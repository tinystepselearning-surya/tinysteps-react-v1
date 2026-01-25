// src/pages/KidsEnglishExcellence.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

// ============================================================================
// TYPES
// ============================================================================

type Tile = {
  title: string;
  desc: string;
  route?: string;
  comingSoon?: boolean;
};

type Stage = {
  stageNumber: number;
  stageTitle: string;
  tiles: Tile[];
};

type TileStatus = "not_started" | "in_progress" | "completed";

type TileProgress = {
  status: TileStatus;
  opens: number;
  firstOpenedAt?: number;
  lastOpenedAt?: number;
  completedAt?: number;
};

type ProgressStore = {
  v: 1;
  tiles: Record<string, TileProgress>;
};

// ============================================================================
// STAGES (mapped to existing routes you already have)
// ============================================================================

const STAGES: Stage[] = [
  {
    stageNumber: 1,
    stageTitle: "Letters & Sounds",
    tiles: [
      {
        title: "Letter Tracing",
        desc: "trace letters (basic)",
        route: "/kids/games/phonics/letter-tracing",
      },
      {
        title: "Letter Tracing + Sounds",
        desc: "trace with sound feedback",
        route: "/kids/games/phonics/letter-tracing-sounds",
      },
      {
        title: "Letter Sounds",
        desc: "letter → sound match",
        route: "/kids/games/phonics/letter-sound",
      },
      {
        title: "Balloon Pop",
        desc: "pop the correct sound",
        route: "/kids/games/phonics/balloon-pop",
      },
      {
        title: "Sound Listening",
        desc: "hear and choose",
        route: "/kids/games/phonics/sound-detective",
      },
    ],
  },
  {
    stageNumber: 2,
    stageTitle: "Build Words",
    tiles: [
      {
        title: "Blend 2 Sounds",
        desc: "slide & join (sa, at…)",
        route: "/kids/games/phonics/my-first-words",
      },
      {
        title: "More Blending",
        desc: "blend builder activities",
        route: "/kids/games/phonics?phase=blend_builder",
      },
      {
        title: "Read Tiny Words",
        desc: "CVC word reader (level 1)",
        route: "/kids/games/phonics/cvc-word-reader",
      },
      {
        title: "Word Families",
        desc: "make-a-word (rimes)",
        route: "/kids/games/phonics?phase=cvc_word_reader",
      },
      { title: "Spelling Practice", desc: "hear → spell", comingSoon: true },
    ],
  },
  {
    stageNumber: 3,
    stageTitle: "Make Sentences",
    tiles: [
      {
        title: "Read Sentences",
        desc: "tap-to-read (guided)",
        route: "/kids/games/phonics/sentence-stepper",
      },
      {
        title: "Early Reader Fluency",
        desc: "sentence packs",
        route: "/kids/games/phonics?phase=early_reader_fluency",
      },
      { title: "Sentence Builder", desc: "put words in order", comingSoon: true },
      { title: "Grammar Fix", desc: "simple corrections", comingSoon: true },
      { title: "Better Sentences", desc: "add describing words", comingSoon: true },
    ],
  },
  {
    stageNumber: 4,
    stageTitle: "Read & Understand",
    tiles: [
      { title: "Fluent Reading", desc: "speed + smooth (calm)", comingSoon: true },
      { title: "Story Reading", desc: "short passages", comingSoon: true },
      { title: "New Words from Reading", desc: "vocab in context", comingSoon: true },
      { title: "Comprehension Questions", desc: "who/what/where/why", comingSoon: true },
      { title: "Summarize Simply", desc: "tell 1–2 lines", comingSoon: true },
    ],
  },
  {
    stageNumber: 5,
    stageTitle: "Speak with Confidence",
    tiles: [
      { title: "Picture Talk", desc: "describe what you see", comingSoon: true },
      { title: "Explain Reasons", desc: "because…", comingSoon: true },
      { title: "Storytelling", desc: "beginning–middle–end", comingSoon: true },
      { title: "Everyday Speaking", desc: "roleplay: shop/school", comingSoon: true },
      { title: "Mixed Practice", desc: "fun review", comingSoon: true },
    ],
  },
];

// ============================================================================
// HELPERS
// ============================================================================

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getTileId = (stageNumber: number, tileTitle: string) => `${stageNumber}:${slugify(tileTitle)}`;

const storageKeyForKid = (kidId: string) => `ts_eem_progress_v1_${kidId || "anon"}`;

const safeParse = <T,>(raw: string | null): T | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const getIcon = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes("tracing")) return "✍️";
  if (t.includes("balloon")) return "🎈";
  if (t.includes("sound") || t.includes("listening")) return "🔤";
  if (t.includes("blend")) return "🔗";
  if (t.includes("word")) return "📝";
  if (t.includes("sentence") || t.includes("fluency")) return "🧩";
  if (t.includes("read")) return "📖";
  if (t.includes("speak")) return "🗣️";
  return "✨";
};

const statusLabel = (s: TileStatus) => {
  if (s === "completed") return "Completed";
  if (s === "in_progress") return "In progress";
  return "Not started";
};

// ============================================================================
// COMPONENT
// ============================================================================

const KidsEnglishExcellence: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const kidId = searchParams.get("kidId") || "";

  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Progress store (per kid)
  const [store, setStore] = useState<ProgressStore>({ v: 1, tiles: {} });

  // “first open” pulse
  const [pulseTileId, setPulseTileId] = useState<string | null>(null);

  // Auto-recover kidId from localStorage if missing in URL
  useEffect(() => {
    if (!kidId) {
      try {
        const stored = localStorage.getItem("ts_active_kid_v1") || null;
        if (stored) {
          const newParams = new URLSearchParams(searchParams);
          newParams.set("kidId", stored);
          navigate({ search: newParams.toString() }, { replace: true });
        }
      } catch {
        // ignore
      }
    }
  }, [kidId, navigate, searchParams]);

  // Load per-kid progress
  useEffect(() => {
    const key = storageKeyForKid(kidId);
    const parsed = safeParse<ProgressStore>(localStorage.getItem(key));
    if (parsed && parsed.v === 1 && parsed.tiles) setStore(parsed);
    else setStore({ v: 1, tiles: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kidId]);

  // Save per-kid progress
  useEffect(() => {
    const key = storageKeyForKid(kidId);
    try {
      localStorage.setItem(key, JSON.stringify(store));
    } catch {
      // ignore
    }
  }, [kidId, store]);

  // Auto-scroll active tab into view
  useEffect(() => {
    const activeTab = tabsRef.current[selectedStageIndex];
    if (activeTab) activeTab.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [selectedStageIndex]);

  // Optional completion hook: ?eemDone=<tileId>
  useEffect(() => {
    const done = searchParams.get("eemDone");
    if (!done) return;

    setStore((prev) => {
      const next = { ...prev, tiles: { ...prev.tiles } };
      const existing: TileProgress = next.tiles[done] || { status: "not_started", opens: 0 };
      next.tiles[done] = {
        ...existing,
        status: "completed",
        completedAt: Date.now(),
        lastOpenedAt: Date.now(),
      };
      return next;
    });

    const newParams = new URLSearchParams(searchParams);
    newParams.delete("eemDone");
    navigate({ search: newParams.toString() }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const currentStage = STAGES[selectedStageIndex];

  const getTileStatus = (tileId: string): TileStatus => store.tiles[tileId]?.status || "not_started";

  const stageStats = useMemo(() => {
    const total = currentStage.tiles.length;
    const playable = currentStage.tiles.filter((t) => !t.comingSoon && !!t.route).length;
    const completed = currentStage.tiles.reduce((acc, t) => {
      const tid = getTileId(currentStage.stageNumber, t.title);
      return acc + (getTileStatus(tid) === "completed" ? 1 : 0);
    }, 0);
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, playable, completed, pct };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStage, store]);

  const overallStats = useMemo(() => {
    const allTiles = STAGES.flatMap((st) => st.tiles.map((t) => getTileId(st.stageNumber, t.title)));
    const total = allTiles.length;
    let completed = 0;
    for (const tid of allTiles) if (getTileStatus(tid) === "completed") completed += 1;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pct };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  const appendKidId = (route: string) => {
    if (!kidId) return route;
    const sep = route.includes("?") ? "&" : "?";
    return `${route}${sep}kidId=${encodeURIComponent(kidId)}`;
  };

  const appendEemMeta = (route: string, tileId: string) => {
    const withKid = appendKidId(route);
    const sep = withKid.includes("?") ? "&" : "?";
    const returnTo = "/kids/games/english-excellence";
    return `${withKid}${sep}eemTile=${encodeURIComponent(tileId)}&eemReturn=${encodeURIComponent(returnTo)}`;
  };

  const setTileProgress = (tileId: string, patch: Partial<TileProgress>) => {
    setStore((prev) => {
      const next: ProgressStore = { ...prev, tiles: { ...prev.tiles } };
      const existing: TileProgress = next.tiles[tileId] || { status: "not_started", opens: 0 };
      next.tiles[tileId] = { ...existing, ...patch };
      return next;
    });
  };

  const handleTileClick = (stageNumber: number, tile: Tile) => {
    if (tile.comingSoon || !tile.route) return;

    const tileId = getTileId(stageNumber, tile.title);
    const status = getTileStatus(tileId);
    const now = Date.now();

    if (status === "not_started") {
      setTileProgress(tileId, {
        status: "in_progress",
        opens: (store.tiles[tileId]?.opens || 0) + 1,
        firstOpenedAt: now,
        lastOpenedAt: now,
      });

      setPulseTileId(tileId);
      window.setTimeout(() => navigate(appendEemMeta(tile.route!, tileId)), 200);
      return;
    }

    setTileProgress(tileId, {
      opens: (store.tiles[tileId]?.opens || 0) + 1,
      lastOpenedAt: now,
    });

    navigate(appendEemMeta(tile.route, tileId));
  };

  const toggleCompleted = (e: React.MouseEvent, stageNumber: number, tile: Tile) => {
    e.stopPropagation();
    e.preventDefault();
    if (tile.comingSoon) return;

    const tileId = getTileId(stageNumber, tile.title);
    const status = getTileStatus(tileId);
    const now = Date.now();

    if (status === "completed") {
      setTileProgress(tileId, { status: "in_progress", completedAt: undefined, lastOpenedAt: now });
      return;
    }

    const existingOpens = store.tiles[tileId]?.opens || 0;
    setTileProgress(tileId, {
      status: "completed",
      completedAt: now,
      lastOpenedAt: now,
      opens: Math.max(existingOpens, 1),
      firstOpenedAt: store.tiles[tileId]?.firstOpenedAt || now,
    });
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start py-8 px-4 overflow-hidden text-slate-900 bg-gradient-to-br from-sky-50 via-indigo-50 to-cyan-50">
      <style>{`
        /* Soft calm blobs (light theme) */
        .soft-blob {
          position: absolute;
          filter: blur(90px);
          opacity: 0.45;
          animation: drift 18s ease-in-out infinite alternate;
          pointer-events: none;
        }
        .b1 { top: -14%; left: -10%; width: 52vw; height: 52vh; background: rgba(56,189,248,0.55); }  /* sky */
        .b2 { top: 8%; right: -14%; width: 60vw; height: 60vh; background: rgba(99,102,241,0.45); animation-delay: -6s; } /* indigo */
        .b3 { bottom: -16%; left: 16%; width: 55vw; height: 45vh; background: rgba(34,211,238,0.40); animation-delay: -9s; } /* cyan */
        @keyframes drift {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); }
          100% { transform: translate(26px, 18px) scale(1.06) rotate(3deg); }
        }

        /* Subtle grain */
        .grain {
          position: absolute; inset: 0; opacity: 0.035; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }

        /* Tabs */
        .tab-pill { transition: all 0.22s ease; }
        .tab-pill.active { box-shadow: 0 8px 24px rgba(99,102,241,0.20); transform: scale(1.02); }

        /* Compact tiles (light glass) */
        .tile {
          background: rgba(255,255,255,0.65);
          border: 1px solid rgba(15,23,42,0.08);
          backdrop-filter: blur(10px);
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease;
          position: relative;
          overflow: hidden;
        }
        .tile:hover {
          transform: translateY(-3px);
          border-color: rgba(99,102,241,0.28);
          background: rgba(255,255,255,0.78);
          box-shadow: 0 14px 28px -16px rgba(15,23,42,0.35);
        }
        .tile.locked { opacity: 0.65; cursor: not-allowed; }
        .tile.locked:hover { transform: none; box-shadow: none; border-color: rgba(15,23,42,0.08); background: rgba(255,255,255,0.65); }

        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px);} to { opacity: 1; transform: translateY(0);} }

        /* First-open pulse (soft) */
        @keyframes tilePulse {
          0% { box-shadow: 0 0 0 rgba(99,102,241,0); }
          30% { box-shadow: 0 0 32px rgba(99,102,241,0.30); }
          100% { box-shadow: 0 0 0 rgba(99,102,241,0); }
        }
        .pulse { animation: tilePulse 0.70s ease-in-out 1; }
        .pulse::after{
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: 16px;
          border: 2px solid rgba(99,102,241,0.24);
          opacity: 0;
          animation: ring 0.70s ease-in-out 1;
          pointer-events: none;
        }
        @keyframes ring {
          0% { opacity: 0; transform: scale(0.99); }
          30% { opacity: 1; transform: scale(1.00); }
          100% { opacity: 0; transform: scale(1.02); }
        }

        /* Grid */
        .tiles-grid {
          display: grid;
          grid-template-columns: repeat(1, minmax(0, 1fr));
          gap: 14px;
        }
        @media (min-width: 640px) {
          .tiles-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
        }
        @media (min-width: 1024px) {
          .tiles-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .soft-blob { animation: none !important; }
          .tile { transition: none !important; }
          .pulse, .pulse::after { animation: none !important; }
        }
      `}</style>

      {/* Background Layers */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="soft-blob b1 rounded-full" />
        <div className="soft-blob b2 rounded-full" />
        <div className="soft-blob b3 rounded-full" />
        <div className="grain" />
      </div>

      {/* Back */}
      <Link
        to={`/kids/games${kidId ? `?kidId=${kidId}` : ""}`}
        className="absolute top-6 right-6 px-5 py-2 bg-white/70 backdrop-blur-md border border-slate-900/10 text-slate-900 font-semibold rounded-full shadow-sm hover:bg-white/85 hover:scale-105 transition-all duration-200 z-50"
      >
        ← Back to Games Hub
      </Link>

      {/* Header */}
      <div className="relative z-10 text-center max-w-4xl mx-auto mt-2 mb-7 px-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 border border-slate-900/10 backdrop-blur-md text-xs font-extrabold text-indigo-700 mb-4 shadow-sm">
          <span>🚀</span> Complete English Journey
        </div>

        <h1 className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 via-slate-900 to-sky-700 drop-shadow-sm mb-2">
          English Excellence Mission
        </h1>

        <p className="text-base md:text-lg text-slate-700/90 font-semibold">
          Master reading, writing & speaking step by step
        </p>

        {/* Stage progress bar */}
        <div className="mt-6 mx-auto max-w-2xl">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
            <span>
              Stage {currentStage.stageNumber}: {currentStage.stageTitle}
            </span>
            <span>
              {stageStats.completed}/{stageStats.total} completed • {stageStats.playable} ready
            </span>
          </div>

          <div className="h-3 rounded-full bg-white/70 border border-slate-900/10 overflow-hidden shadow-sm">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-sky-600"
              style={{ width: `${stageStats.pct}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-center gap-3 text-[11px] font-bold text-slate-700/70">
            <span>Overall: {overallStats.completed}/{overallStats.total} completed</span>
            <span className="opacity-40">•</span>
            <span>{overallStats.pct}%</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="relative z-10 w-full max-w-6xl mx-auto mb-5 overflow-hidden select-none">
        <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-sky-50 via-indigo-50 to-transparent z-20 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-cyan-50 via-indigo-50 to-transparent z-20 pointer-events-none" />

        <div className="flex overflow-x-auto pb-4 pt-1 gap-3 px-8" style={{ scrollbarWidth: "none" }}>
          {STAGES.map((stage, idx) => (
            <button
              key={idx}
              ref={(el) => {
                tabsRef.current[idx] = el;
              }}
              onClick={() => setSelectedStageIndex(idx)}
              className={`
                tab-pill relative flex-shrink-0 flex items-center gap-3 px-1.5 py-1.5 pr-6 rounded-full border
                ${
                  idx === selectedStageIndex
                    ? "active bg-white/75 border-indigo-500/25 text-slate-900 shadow-sm"
                    : "bg-white/55 border-slate-900/10 text-slate-700/70 hover:bg-white/75 hover:border-slate-900/15"
                }
              `}
              type="button"
            >
              <div
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-black shadow-inner
                  ${idx === selectedStageIndex ? "bg-indigo-600 text-white" : "bg-white/60 border border-slate-900/10 text-slate-700"}
                `}
              >
                {stage.stageNumber}
              </div>
              <span className="font-extrabold tracking-wide text-sm">{stage.stageTitle}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Compact Tiles */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 pb-20">
        <div className="tiles-grid">
          {currentStage.tiles.map((tile, idx) => {
            const locked = tile.comingSoon || !tile.route;
            const tileId = getTileId(currentStage.stageNumber, tile.title);
            const icon = getIcon(tile.title);
            const status = getTileStatus(tileId);

            const badgeClass =
              status === "completed"
                ? "bg-emerald-600/10 border-emerald-600/20 text-emerald-700"
                : status === "in_progress"
                ? "bg-sky-600/10 border-sky-600/20 text-sky-700"
                : "bg-slate-900/5 border-slate-900/10 text-slate-700/70";

            const isPulse = pulseTileId === tileId;

            return (
              <div
                key={`${tile.title}-${idx}`}
                onClick={() => handleTileClick(currentStage.stageNumber, tile)}
                className={`tile rounded-2xl p-4 flex flex-col gap-3 ${locked ? "locked" : "cursor-pointer"} ${
                  isPulse ? "pulse" : ""
                }`}
                style={{
                  animationFillMode: "both",
                  animationDuration: "0.35s",
                  animationDelay: `${idx * 35}ms`,
                  animationName: "fadeInUp",
                }}
                onAnimationEnd={() => {
                  if (isPulse) setPulseTileId(null);
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-white/70 border border-slate-900/10 flex items-center justify-center text-xl shadow-inner">
                    {icon}
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-extrabold tracking-wider border ${badgeClass}`}
                      title={`Status: ${statusLabel(status)}`}
                    >
                      {statusLabel(status)}
                    </div>

                    {!locked && (
                      <button
                        type="button"
                        onClick={(e) => toggleCompleted(e, currentStage.stageNumber, tile)}
                        className={`
                          w-8 h-8 rounded-full border flex items-center justify-center text-sm font-black
                          ${
                            status === "completed"
                              ? "bg-emerald-600/10 border-emerald-600/20 text-emerald-700"
                              : "bg-white/60 border-slate-900/10 text-slate-700/70 hover:bg-white/80 hover:text-slate-900"
                          }
                        `}
                        title={status === "completed" ? "Set to In progress" : "Mark as Completed"}
                        aria-label={status === "completed" ? "Set to In progress" : "Mark as Completed"}
                      >
                        ✓
                      </button>
                    )}
                  </div>
                </div>

                <div className="min-h-[56px]">
                  <div className="text-base font-extrabold text-slate-900 leading-snug">{tile.title}</div>
                  <div className="text-xs text-slate-700/70 font-semibold mt-1">{tile.desc}</div>
                </div>

                <div className="mt-auto flex items-center justify-between">
                  <div className="text-[11px] text-slate-700/60 font-bold">
                    {locked ? "Locked" : status === "completed" ? "Replay anytime" : "Tap to open"}
                  </div>

                  <div
                    className={`
                      text-xs font-extrabold px-3 py-1.5 rounded-xl border shadow-sm
                      ${
                        locked
                          ? "bg-white/60 border-slate-900/10 text-slate-500"
                          : "bg-gradient-to-r from-indigo-600 to-sky-600 border-white/40 text-white"
                      }
                    `}
                  >
                    {locked ? "Soon" : "Play"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => navigate(appendKidId("/kids/games/phonics"))}
            className="px-5 py-2.5 rounded-full bg-white/70 border border-slate-900/10 text-slate-800 hover:bg-white/85 transition font-bold shadow-sm"
          >
            Browse Full Phonics Library →
          </button>
        </div>
      </div>
    </div>
  );
};

export default KidsEnglishExcellence;
