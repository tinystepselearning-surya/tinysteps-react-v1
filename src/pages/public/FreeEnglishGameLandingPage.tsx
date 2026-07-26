import { useEffect } from "react";
import { Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import Meta from "../../components/common/Meta";
import TinyStepsBrand from "../../components/common/TinyStepsBrand";
import { createFAQPageSchema } from "../../lib/schemas";
import { applySeo } from "../../lib/seo";
import { trackFreeResourceToTrialClick } from "../../lib/conversionTracking";
import PublicEnglishGamePlayer from "./PublicEnglishGamePlayer";
import {
  PUBLIC_ENGLISH_GAMES_HUB_PATH,
  getPublicEnglishGameLandingByPath,
  getPublicEnglishGameLandingTiles,
  getPublicTileRoute,
  isPublicTilePlayable,
  ENGLISH_EXCELLENCE_STAGES,
  type PublicEnglishGameLandingConfig,
  type EnglishExcellenceStage,
  type EnglishExcellenceTile,
} from "../../lib/publicEnglishGames";

const SITE_ORIGIN = "https://tinystepslearning.com";

export default function FreeEnglishGameLandingPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const config: PublicEnglishGameLandingConfig | null = getPublicEnglishGameLandingByPath(location.pathname);
  const isPlayMode = searchParams.get("play") === "1";
  const shouldRenderPlayer = !!config?.isPublicPlayReady && isPlayMode;

  useEffect(() => {
    if (!config) return;

    const pageUrl = `${SITE_ORIGIN}${config.publicPath}`;
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

    // Use custom FAQs if provided, otherwise fall back to generic
    const faqItems = config.faqs || [
      { question: "Is this game free?", answer: "Yes. This Tiny Steps public game page is free to open in your browser." },
      { question: "Does this game require login?", answer: "No. You do not need a login or child profile to use this public page." },
      { question: "Is progress saved?", answer: "Progress is saved only temporarily in this browser." },
      { question: "What age is this game for?", answer: `${config.h1} is best for ${config.ageRange.toLowerCase()}.` },
      { question: "What skill does this game practise?", answer: config.skillAnswer },
      { question: "How is Tiny Steps different from free practice games?", answer: config.differenceAnswer },
    ];

    applySeo({
      title: config.seoTitle,
      description: config.seoDescription,
      canonicalPath: config.publicPath,
      ogType: "website",
      jsonLd: [breadcrumbSchema, createFAQPageSchema(faqItems)],
    });
  }, [config]);

  if (!config || !config.isPublicPageReady) {
    return <Navigate to={PUBLIC_ENGLISH_GAMES_HUB_PATH} replace />;
  }

  const pageUrl = `${SITE_ORIGIN}${config.publicPath}`;
  const tiles = getPublicEnglishGameLandingTiles(config);

  // Use custom FAQs if provided, otherwise fall back to generic
  const faqItems = config.faqs || [
    { question: "Is this game free?", answer: "Yes. This Tiny Steps public game page is free to open in your browser." },
    { question: "Does this game require login?", answer: "No. You do not need a login or child profile to use this public page." },
    { question: "Is progress saved?", answer: "Progress is saved only temporarily in this browser." },
    { question: "What age is this game for?", answer: `${config.h1} is best for ${config.ageRange.toLowerCase()}.` },
    { question: "What skill does this game practise?", answer: config.skillAnswer },
    { question: "How is Tiny Steps different from free practice games?", answer: config.differenceAnswer },
  ];

  // Get curated related games if specified, otherwise use all from config
  const relatedTiles: Array<{ stage: EnglishExcellenceStage; tile: EnglishExcellenceTile }> = config.relatedGameIds
    ? ENGLISH_EXCELLENCE_STAGES.flatMap((stage: EnglishExcellenceStage) =>
        stage.tiles
          .filter((tile: EnglishExcellenceTile) => config.relatedGameIds?.includes(tile.gameId))
          .map((tile: EnglishExcellenceTile) => ({ stage, tile }))
      )
    : tiles;

  // Find next game tile if specified
  const nextGameTile: { stage: EnglishExcellenceStage; tile: EnglishExcellenceTile } | null = config.nextGameId
    ? ENGLISH_EXCELLENCE_STAGES.flatMap((stage: EnglishExcellenceStage) =>
        stage.tiles
          .filter((tile: EnglishExcellenceTile) => tile.gameId === config.nextGameId)
          .map((tile: EnglishExcellenceTile) => ({ stage, tile }))
      )[0]
    : null;

  const handleAssessmentClick = () => {
    trackFreeResourceToTrialClick({
      page_path: config.publicPath,
      cta_label: "Book Free 35-Minute Demo",
      cta_location: "assessment_bridge",
      destination_path: "/book-demo",
      program: "phonics",
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05010f] text-slate-100">
      <Meta title={config.seoTitle} description={config.seoDescription} canonical={pageUrl} />

      <style>{`
        .public-game-panel {
          border: 1px solid rgba(196, 181, 253, 0.18);
          background: rgba(12, 9, 28, 0.86);
          border-radius: 0.75rem;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
        }
        .public-game-card {
          background:
            radial-gradient(circle at top, rgba(79, 70, 229, 0.16), transparent 34%),
            linear-gradient(180deg, rgba(13, 9, 28, 0.98) 0%, rgba(8, 5, 22, 0.96) 100%);
          border: 1px solid rgba(196, 181, 253, 0.14);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.05),
            0 8px 20px rgba(2, 6, 23, 0.26);
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
                No login required. Progress is saved only temporarily in this browser.
              </p>
            </div>

            <nav className="flex max-w-full flex-wrap items-center gap-2 lg:justify-end" aria-label="Game page links">
              <Link
                to={PUBLIC_ENGLISH_GAMES_HUB_PATH}
                className="shrink-0 rounded-lg border border-white/15 bg-white/8 px-3 py-2 text-xs font-bold text-slate-100"
              >
                All English Games
              </Link>
              <Link
                to={config.categoryPath}
                className="shrink-0 rounded-lg border border-white/15 bg-white/8 px-3 py-2 text-xs font-bold text-slate-100"
              >
                Category Page
              </Link>
              <Link
                to="/book-demo"
                className="shrink-0 rounded-lg bg-amber-300 px-3 py-2 text-xs font-black text-slate-900"
              >
                Book Free 35-Minute Demo
              </Link>
            </nav>
          </header>

          <section className="mt-3 grid gap-3 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="public-game-panel p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-cyan-300/35 bg-cyan-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-100">
                  {config.ageRange}
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${
                    config.isPublicPlayReady
                      ? "border-emerald-300/35 bg-emerald-400/15 text-emerald-100"
                      : "border-violet-300/35 bg-violet-400/15 text-violet-100"
                  }`}
                >
                  {config.isPublicPlayReady ? "FREE TO PLAY" : config.statusText.toUpperCase()}
                </span>
              </div>

              {config.benefits ? (
                <>
                  <h2 className="mt-3 text-xl font-black text-slate-100">What children learn</h2>
                  <ul className="mt-2 grid gap-x-4 gap-y-1 text-sm leading-6 text-slate-300 sm:grid-cols-2">
                    {config.benefits.map((benefit) => (
                      <li key={benefit} className="flex gap-2">
                        <span className="mt-1 text-cyan-400">•</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <h2 className="mt-3 text-xl font-black text-slate-100">What this page covers</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {config.seoDescription}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {config.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-sky-300/25 bg-sky-400/10 px-3 py-1.5 text-xs font-bold text-sky-100"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </>
              )}

              <div className="mt-4">
                {config.isPublicPlayReady && config.playPath ? (
                  <Link
                    to={config.playPath}
                    className="inline-flex rounded-xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-900 hover:bg-cyan-300"
                  >
                    Play Free
                  </Link>
                ) : (
                  <span className="inline-flex rounded-xl border border-slate-500/30 bg-slate-800/80 px-5 py-3 text-sm font-black text-slate-200">
                    {config.statusText}
                  </span>
                )}
              </div>
            </div>

            <div className="public-game-panel p-4">
              <h2 className="text-xl font-black text-slate-100">How to play</h2>
              <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                {config.howToPlay.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>

              {config.parentGuidance ? (
                <div className="mt-4 rounded-lg border border-amber-300/20 bg-amber-400/10 p-3">
                  <h3 className="text-sm font-black uppercase tracking-[0.12em] text-amber-200">Parent Guidance</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-100">
                    {config.parentGuidance}
                  </p>
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-3">
                  <p className="text-sm font-semibold text-slate-100">
                    Want saved progress and teacher guidance?{" "}
                    <Link to="/book-demo" className="font-black text-cyan-200 underline underline-offset-4">
                      Book one free 35-minute demo assessment class.
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </section>

          {shouldRenderPlayer ? (
            <section id="play" className="mt-4 public-game-panel p-3 sm:p-4">
              <div className="rounded-2xl border border-white/10 bg-slate-950/36 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-black text-slate-100">Guest Play Mode</h2>
                    <p className="mt-2 text-sm text-slate-300">
                      No login required. Progress is saved only temporarily in this browser.
                    </p>
                  </div>
                  <Link
                    to={config.publicPath}
                    className="inline-flex rounded-full border border-slate-400/30 bg-slate-900/70 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-100"
                  >
                    Back to English Games
                  </Link>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/25">
                <PublicEnglishGamePlayer publicPath={config.publicPath} />
              </div>
            </section>
          ) : null}

          {config.commonMistakes && (
            <section className="mt-3 public-game-panel p-4">
              <h2 className="text-lg font-black text-slate-100">Helpful tip</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {config.commonMistakes}
              </p>
            </section>
          )}

          {nextGameTile && (
            <section className="mt-3 public-game-panel p-4">
              <h2 className="text-xl font-black text-slate-100">Ready for the next step?</h2>
              <p className="mt-2 text-sm text-slate-300">
                After {config.h1.toLowerCase()}, try:
              </p>
              <article className="mt-4 public-game-card rounded-2xl p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Track {nextGameTile.stage.stageNumber}
                </p>
                <h3 className="mt-2 text-xl font-black text-slate-100">{nextGameTile.tile.gameTitle}</h3>
                <p className="mt-2 text-sm text-slate-300">{nextGameTile.tile.desc}</p>
                {getPublicTileRoute(nextGameTile.tile.gameId)?.route && (
                  <Link
                    to={getPublicTileRoute(nextGameTile.tile.gameId)!.route!}
                    className="mt-4 inline-flex rounded-xl bg-cyan-400 px-4 py-2 text-sm font-black text-slate-900 hover:bg-cyan-300"
                  >
                    Try {nextGameTile.tile.gameTitle}
                  </Link>
                )}
              </article>
            </section>
          )}

          <section className="mt-3 public-game-panel p-4">
            <h2 className="text-xl font-black text-slate-100">Related game skills</h2>
            <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {relatedTiles.map(({ stage, tile }: { stage: EnglishExcellenceStage; tile: EnglishExcellenceTile }) => {
                const route = getPublicTileRoute(tile.gameId);
                const isPlayable = isPublicTilePlayable(tile.gameId);
                const isSelfRoute = route?.route === config.publicPath;
                const relatedStatusText = isPlayable
                  ? "FREE TO PLAY"
                  : tile.comingSoon
                    ? "COMING SOON"
                    : "READY SOON";
                return (
                  <article key={tile.gameId} className="public-game-card rounded-lg p-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      Track {stage.stageNumber}
                    </p>
                    <h3 className="mt-2 text-lg font-black text-slate-100">{tile.gameTitle}</h3>
                    <p className="mt-2 text-sm text-slate-300">{tile.desc}</p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                          isPlayable
                            ? "border-emerald-300/35 bg-emerald-400/15 text-emerald-100"
                            : tile.comingSoon
                              ? "border-slate-500/35 bg-slate-700/30 text-slate-200"
                              : "border-violet-300/35 bg-violet-400/15 text-violet-100"
                        }`}
                      >
                        {relatedStatusText}
                      </span>

                      {!isSelfRoute && route?.route ? (
                        <Link
                          to={route.route}
                          className="text-xs font-black text-cyan-200 underline underline-offset-4"
                        >
                          {isPlayable ? "Open page" : "View page"}
                        </Link>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>

        <section className="mt-3 grid gap-3 lg:grid-cols-[0.56fr_0.44fr]">
          <div className="public-game-panel p-4">
            <h2 className="text-xl font-black text-slate-100">Parent FAQ</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {faqItems.map((item) => (
                <article key={item.question} className="rounded-lg border border-white/10 bg-slate-950/42 p-3">
                  <h3 className="faq-question text-sm font-extrabold text-slate-100">{item.question}</h3>
                  <p className="faq-answer mt-1 text-xs leading-5 text-slate-300">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="public-game-panel p-4">
            {config.assessmentBridge ? (
              <>
                <h2 className="text-xl font-black text-slate-100">Take the next step</h2>
                <div className="mt-3 rounded-lg border border-amber-300/20 bg-amber-400/10 p-4">
                  <h3 className="text-base font-bold text-slate-100">From free games to guided learning</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-200">
                    {config.assessmentBridge}
                  </p>
                  <Link
                    to="/book-demo"
                    onClick={handleAssessmentClick}
                    className="mt-4 inline-flex rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-900 hover:bg-amber-300"
                  >
                    Book Free 35-Minute Demo
                  </Link>
                </div>
                <div className="mt-4 grid gap-3">
                  <Link
                    to={PUBLIC_ENGLISH_GAMES_HUB_PATH}
                    className="rounded-2xl border border-white/10 bg-slate-950/42 px-4 py-4 text-sm font-bold text-slate-100"
                  >
                    Back to Free English Games for Kids
                  </Link>
                  <Link
                    to={config.categoryPath}
                    className="rounded-2xl border border-white/10 bg-slate-950/42 px-4 py-4 text-sm font-bold text-slate-100"
                  >
                    Open the related category page
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-black text-slate-100">Quick links</h2>
                <div className="mt-3 grid gap-2">
                  <Link
                    to={PUBLIC_ENGLISH_GAMES_HUB_PATH}
                    className="rounded-2xl border border-white/10 bg-slate-950/42 px-4 py-4 text-sm font-bold text-slate-100"
                  >
                    Back to Free English Games for Kids
                  </Link>
                  <Link
                    to={config.categoryPath}
                    className="rounded-2xl border border-white/10 bg-slate-950/42 px-4 py-4 text-sm font-bold text-slate-100"
                  >
                    Open the related category page
                  </Link>
                  <Link
                    to="/book-demo"
                    className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-4 text-sm font-bold text-cyan-100"
                  >
                    Want saved progress and teacher guidance? Book one free 35-minute demo assessment class.
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
