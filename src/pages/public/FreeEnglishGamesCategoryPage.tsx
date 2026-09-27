import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import Meta from "../../components/common/Meta";
import MagicBento from "../../components/common/MagicBento";
import TinyStepsBrand from "../../components/common/TinyStepsBrand";
import { createFAQPageSchema } from "../../lib/schemas";
import { applySeo } from "../../lib/seo";
import { getEnglishExcellenceIcon } from "../../lib/englishExcellenceMission";
import {
  PUBLIC_ENGLISH_GAMES_HUB_PATH,
  PUBLIC_PROGRESS_STORAGE_KEY,
  getPublicCategoryTrackSummary,
  getPublicEnglishGamesCategoryByPath,
  getPublicEnglishGamesTilesForCategory,
  getPublicTileRoute,
  isPublicTilePlayable,
  parsePublicProgress,
} from "../../lib/publicEnglishGames";

const SITE_ORIGIN = "https://tinystepslearning.com";
const BALLOON_POP_PATH = "/free-balloon-pop-phonics-game-for-kids";

export default function FreeEnglishGamesCategoryPage() {
  const location = useLocation();
  const config = getPublicEnglishGamesCategoryByPath(location.pathname);
  const [completedTileIds, setCompletedTileIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    return parsePublicProgress(window.localStorage.getItem(PUBLIC_PROGRESS_STORAGE_KEY))?.completedTileIds || [];
  });

  useEffect(() => {
    if (!config) return;

    const pageUrl = `${SITE_ORIGIN}${config.route}`;
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_ORIGIN}/` },
        { "@type": "ListItem", position: 2, name: "Free English Games for Kids", item: `${SITE_ORIGIN}${PUBLIC_ENGLISH_GAMES_HUB_PATH}` },
        { "@type": "ListItem", position: 3, name: config.h1, item: pageUrl },
      ],
    };

    const faqItems = [
      { question: config.categoryQuestion, answer: config.categoryAnswer },
      { question: "How do these games help children learn English?", answer: config.learningAnswer },
      { question: "Are these games free?", answer: "Yes. These category pages link to free public practice games and browser-only previews from Tiny Steps." },
      { question: "Is login required?", answer: "No login is required. Public progress is saved only temporarily in this browser." },
      { question: "How is Tiny Steps different from free practice games?", answer: config.differenceAnswer },
    ];

    applySeo({
      title: config.title,
      description: config.description,
      canonicalPath: config.route,
      ogType: "website",
      jsonLd: [breadcrumbSchema, createFAQPageSchema(faqItems)],
    });
  }, [config]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      PUBLIC_PROGRESS_STORAGE_KEY,
      JSON.stringify({ v: 1, completedTileIds }),
    );
  }, [completedTileIds]);

  const tiles = useMemo(
    () => (config ? getPublicEnglishGamesTilesForCategory(config) : []),
    [config],
  );
  const playableTileIds = useMemo(
    () => new Set(tiles.filter(({ tile }) => isPublicTilePlayable(tile.gameId)).map(({ tile }) => tile.gameId)),
    [tiles],
  );
  const completedSet = useMemo(
    () => new Set(completedTileIds.filter((id) => playableTileIds.has(id))),
    [completedTileIds, playableTileIds],
  );

  if (!config) {
    return <Navigate to={PUBLIC_ENGLISH_GAMES_HUB_PATH} replace />;
  }

  const pageUrl = `${SITE_ORIGIN}${config.route}`;
  const tracks = getPublicCategoryTrackSummary(config);
  const playableCards = tiles.filter(({ tile }) => isPublicTilePlayable(tile.gameId));
  const quickLinks = playableCards.map(({ tile }) => ({
    route: getPublicTileRoute(tile.gameId)?.route,
    title: tile.gameTitle,
  })).filter((item): item is { route: string; title: string } => Boolean(item.route));
  const isLetterSoundCategory = config.route === "/free-letter-sound-games-for-kids";

  const faqItems = [
    { question: config.categoryQuestion, answer: config.categoryAnswer },
    { question: "How do these games help children learn English?", answer: config.learningAnswer },
    { question: "Are these games free?", answer: "Yes. These category pages link to free public practice games and browser-only previews from Tiny Steps." },
    { question: "Is login required?", answer: "No login is required. Public progress is saved only temporarily in this browser." },
    { question: "How is Tiny Steps different from free practice games?", answer: config.differenceAnswer },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05010f] text-slate-100">
      <Meta title={config.title} description={config.description} canonical={pageUrl} />

      <style>{`
        .public-category-kpi {
          border: 1px solid rgba(196, 181, 253, 0.18);
          background: linear-gradient(180deg, rgba(18, 12, 38, 0.95) 0%, rgba(12, 9, 28, 0.92) 100%);
          border-radius: 0.625rem;
          padding: 0.65rem 0.8rem;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
        }
        .public-category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 0.65rem;
          align-items: stretch;
        }
        .public-category-card {
          background:
            radial-gradient(circle at top, rgba(79, 70, 229, 0.16), transparent 34%),
            linear-gradient(180deg, rgba(13, 9, 28, 0.98) 0%, rgba(8, 5, 22, 0.96) 100%);
          border: 1px solid rgba(196, 181, 253, 0.14);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.05),
            0 8px 20px rgba(2, 6, 23, 0.26);
          min-height: 178px;
        }
      `}</style>

      <div className="relative z-10 mx-auto max-w-7xl px-3 pb-3 pt-12 sm:px-5 sm:py-3">
        <div className="rounded-xl border border-white/12 bg-[#090616]/88 p-3 shadow-xl backdrop-blur-md sm:p-4">
          <header className="grid gap-3 rounded-lg border border-white/10 bg-slate-950/65 px-3 py-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
            <TinyStepsBrand
              to=""
              subtitle="FREE LEARNING GAMES"
              className="pointer-events-none hidden px-0 py-0 hover:bg-transparent lg:flex"
              titleClassName="text-sm"
              subtitleClassName="text-[9px] tracking-[0.12em]"
            />

            <div className="min-w-0">
              <h1 className="text-xl font-black text-white sm:text-2xl">{config.h1}</h1>
              <p className="mt-1 max-w-3xl text-sm leading-5 text-slate-300">
                {config.intro}
              </p>
              <p className="mt-1 text-xs font-semibold text-emerald-200/90">
                No login required. Public progress is saved only temporarily in this browser.
              </p>
            </div>

            <nav className="flex max-w-full flex-wrap items-center gap-2 lg:justify-end" aria-label="Category page links">
              <Link
                to={PUBLIC_ENGLISH_GAMES_HUB_PATH}
                className="shrink-0 rounded-lg border border-white/15 bg-white/8 px-3 py-2 text-xs font-bold text-slate-100"
              >
                All English Games
              </Link>
              <Link
                to="/book-demo"
                className="shrink-0 rounded-lg bg-amber-300 px-3 py-2 text-xs font-black text-slate-900"
              >
                Book Free 35-Minute Demo
              </Link>
            </nav>
          </header>

          {isLetterSoundCategory ? (
            <section className="mt-3 rounded-lg border border-fuchsia-300/25 bg-[linear-gradient(135deg,rgba(88,28,135,0.42),rgba(14,116,144,0.28))] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-fuchsia-200">Featured Tiny Steps Phonics practice</p>
                  <h2 className="mt-1 text-lg font-black text-white">Tiny Steps Phonics Balloon Pop</h2>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-200">
                    Hear one target letter sound, find the matching printed letter, and pop the balloon. Start with SATPIN or choose another Tiny Steps Phonics sound group for quick sound-to-letter recall practice.
                  </p>
                </div>
                <Link
                  to={BALLOON_POP_PATH}
                  className="shrink-0 rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-black text-slate-950 hover:bg-cyan-200"
                >
                  Play Balloon Pop Free
                </Link>
              </div>
            </section>
          ) : null}

          <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
            <div className="public-category-kpi">
              <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-violet-200/80">Tracks Covered</div>
              <div className="mt-1 text-xl font-black text-slate-100">{tracks.length}</div>
            </div>
            <div className="public-category-kpi">
              <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-violet-200/80">Games Listed</div>
              <div className="mt-1 text-xl font-black text-slate-100">{tiles.length}</div>
            </div>
            <div className="public-category-kpi">
              <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-violet-200/80">Playable Now</div>
              <div className="mt-1 text-xl font-black text-slate-100">{playableCards.length}</div>
            </div>
            <div className="public-category-kpi">
              <div className="text-[10px] uppercase tracking-[0.16em] font-bold text-violet-200/80">Completed Here</div>
              <div className="mt-1 text-xl font-black text-slate-100">{completedSet.size}</div>
            </div>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="rounded-lg border border-violet-300/20 bg-slate-950/42 p-3 backdrop-blur-md">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Tracks Included</h2>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1 lg:grid lg:overflow-visible">
                {tracks.map((stage) => {
                  const stageTiles = tiles.filter((entry) => entry.stage.stageId === stage.stageId);
                  const readyNow = stageTiles.filter((entry) => isPublicTilePlayable(entry.tile.gameId)).length;
                  return (
                    <div
                      key={stage.stageId}
                      className="min-w-40 rounded-lg border border-violet-300/20 bg-slate-900/55 px-3 py-2 lg:min-w-0"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-indigo-600 px-2 text-[11px] font-black text-white">
                          {stage.stageNumber}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-300">
                          {readyNow}/{stageTiles.length} ready
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-extrabold text-slate-100">{stage.stageTitle}</p>
                    </div>
                  );
                })}
              </div>

              {quickLinks.length > 0 ? (
                <div className="mt-3">
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Playable Now</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {quickLinks.map((link) => (
                      <Link
                        key={`${link.route}:${link.title}`}
                        to={link.route}
                        className="rounded-full border border-sky-300/30 bg-sky-400/15 px-3 py-1.5 text-xs font-bold text-sky-100"
                      >
                        {link.title}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </aside>

            <section className="rounded-lg border border-violet-300/20 bg-slate-950/52 p-3 backdrop-blur-md">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-black text-slate-100">Category Games</h2>
                  <p className="mt-1 text-sm text-slate-300">
                    Relevant public games and browser-only previews from the shared English Excellence catalog.
                  </p>
                </div>
                <div className="rounded-full border border-emerald-300/35 bg-white/80 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700 shadow-sm">
                  No Login Required
                </div>
              </div>

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
                <div className="public-category-grid">
                  {tiles.map(({ stage, tile }) => {
                    const publicRoute = getPublicTileRoute(tile.gameId);
                    const isPlayable = isPublicTilePlayable(tile.gameId);
                    const isCompleted = completedSet.has(tile.gameId);

                    let badgeText = tile.comingSoon ? "COMING SOON" : "READY SOON";
                    let badgeClassName = "bg-violet-500/15 border-violet-400/40 text-violet-200";
                    let footerText = publicRoute?.footer || "Public version coming soon";
                    let ctaText = isPlayable ? "Play Free" : tile.comingSoon ? "Coming Soon" : "Ready Soon";

                    if (isCompleted) {
                      badgeText = "PLAYED HERE";
                      badgeClassName = "bg-emerald-500/15 border-emerald-400/40 text-emerald-200";
                      footerText = isPlayable ? "Replay in this browser" : footerText;
                    } else if (isPlayable) {
                      badgeText = "FREE TO PLAY";
                      badgeClassName = "bg-sky-500/15 border-sky-400/40 text-sky-200";
                    } else if (tile.comingSoon) {
                      badgeText = "COMING SOON";
                      badgeClassName = "bg-slate-700/30 border-slate-500/35 text-slate-200";
                    }

                    return (
                      <article key={tile.gameId} className="public-category-card rounded-lg p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-violet-300/20 bg-slate-900/65 text-lg">
                            {getEnglishExcellenceIcon(tile.gameTitle ?? tile.title ?? "")}
                          </div>
                          <span
                            className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${badgeClassName}`}
                          >
                            {badgeText}
                          </span>
                        </div>

                        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                          Track {stage.stageNumber}
                        </p>
                        <h3 className="mt-1 text-lg font-black text-slate-100">
                          {tile.gameTitle}
                        </h3>
                        <p className="mt-2 text-sm text-slate-300">{tile.desc}</p>
                        <p className="mt-2 text-[11px] font-semibold text-slate-400">
                          {footerText}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {publicRoute?.route ? (
                            <Link
                              to={publicRoute.route}
                              className={`inline-flex rounded-xl px-4 py-2 text-sm font-black ${
                                isPlayable
                                  ? "bg-cyan-400 text-slate-900 hover:bg-cyan-300"
                                  : "border border-slate-500 bg-slate-800/80 text-slate-100"
                              }`}
                            >
                              {ctaText}
                            </Link>
                          ) : (
                            <span className="inline-flex rounded-xl border border-slate-600 bg-slate-800/70 px-4 py-2 text-sm font-black text-slate-200">
                              {ctaText}
                            </span>
                          )}

                          <button
                            type="button"
                            disabled={!isPlayable}
                            onClick={() => {
                              if (!isPlayable) return;
                              setCompletedTileIds((prev) => (
                                prev.includes(tile.gameId)
                                  ? prev.filter((id) => id !== tile.gameId)
                                  : [...prev, tile.gameId]
                              ));
                            }}
                            className={`inline-flex rounded-xl border px-3 py-2 text-xs font-bold ${
                              isPlayable
                                ? "border-violet-400/35 bg-violet-500/10 text-violet-100"
                                : "cursor-not-allowed border-slate-600/50 bg-slate-800/45 text-slate-500"
                            }`}
                            aria-label={isCompleted ? `Set ${tile.gameTitle} to in progress` : `Mark ${tile.gameTitle} as completed`}
                          >
                            {isCompleted ? "Set to In Progress" : "Mark Completed"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </MagicBento>
            </section>
          </div>

          <div className="mt-3 rounded-lg border border-violet-300/20 bg-slate-950/42 px-4 py-3 backdrop-blur-md">
            <p className="text-sm font-semibold text-slate-200">
              Want saved progress and teacher guidance?{" "}
              <Link to="/book-demo" className="font-black text-cyan-300 underline underline-offset-4">
                Book one free 35-minute demo assessment class.
              </Link>
            </p>
          </div>
        </div>

        <section className="mt-3 grid gap-3 lg:grid-cols-[0.62fr_0.38fr]">
          <div className="rounded-lg border border-white/10 bg-slate-950/70 p-4 backdrop-blur-md">
            <h2 className="text-xl font-black text-white">Quick Answers for Parents</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {faqItems.map((item) => (
                <article key={item.question} className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <h3 className="faq-question text-sm font-extrabold text-slate-100">{item.question}</h3>
                  <p className="faq-answer mt-1 text-xs leading-5 text-slate-300">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-slate-950/70 p-4 backdrop-blur-md">
            <h2 className="text-xl font-black text-white">Why Tiny Steps Works Better</h2>
            <div className="mt-3 space-y-2">
              {[
                "Short browser-based practice with no login barrier",
                "Shared mission catalog that mirrors the structured Tiny Steps learning journey",
                "Useful for daily repetition while parents explore full guided classes",
                "Clear next step when families want saved progress and teacher support",
              ].map((point) => (
                <div key={point} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
                  {point}
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-lg border border-cyan-300/20 bg-cyan-400/10 p-3">
              <p className="text-sm font-semibold text-slate-100">
                Browse the full public catalog anytime from{" "}
                <Link
                  to={PUBLIC_ENGLISH_GAMES_HUB_PATH}
                  className="font-black text-cyan-200 underline underline-offset-4"
                >
                  Free English Games for Kids
                </Link>
                .
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
