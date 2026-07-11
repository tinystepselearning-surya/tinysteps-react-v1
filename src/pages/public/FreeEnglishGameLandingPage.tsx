import { useEffect } from "react";
import { Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import Meta from "../../components/common/Meta";
import TinyStepsBrand from "../../components/common/TinyStepsBrand";
import LiquidEther from "../../components/components/LiquidEther";
import { createFAQPageSchema } from "../../lib/schemas";
import { applySeo } from "../../lib/seo";
import PublicEnglishGamePlayer from "./PublicEnglishGamePlayer";
import {
  PUBLIC_ENGLISH_GAMES_HUB_PATH,
  getPublicEnglishGameLandingByPath,
  getPublicEnglishGameLandingTiles,
  getPublicTileRoute,
  isPublicTilePlayable,
} from "../../lib/publicEnglishGames";

const SITE_ORIGIN = "https://tinystepslearning.com";

export default function FreeEnglishGameLandingPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const config = getPublicEnglishGameLandingByPath(location.pathname);
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

    const faqItems = [
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
  const faqItems = [
    { question: "Is this game free?", answer: "Yes. This Tiny Steps public game page is free to open in your browser." },
    { question: "Does this game require login?", answer: "No. You do not need a login or child profile to use this public page." },
    { question: "Is progress saved?", answer: "Progress is saved only temporarily in this browser." },
    { question: "What age is this game for?", answer: `${config.h1} is best for ${config.ageRange.toLowerCase()}.` },
    { question: "What skill does this game practise?", answer: config.skillAnswer },
    { question: "How is Tiny Steps different from free practice games?", answer: config.differenceAnswer },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05010f] text-slate-100">
      <Meta title={config.seoTitle} description={config.seoDescription} canonical={pageUrl} />

      <style>{`
        .public-game-panel {
          border: 1px solid rgba(196, 181, 253, 0.18);
          background: linear-gradient(180deg, rgba(18, 12, 38, 0.95) 0%, rgba(12, 9, 28, 0.92) 100%);
          border-radius: 1.5rem;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 30px rgba(2, 6, 23, 0.28);
        }
        .public-game-card {
          background:
            radial-gradient(circle at top, rgba(79, 70, 229, 0.16), transparent 34%),
            linear-gradient(180deg, rgba(13, 9, 28, 0.98) 0%, rgba(8, 5, 22, 0.96) 100%);
          border: 1px solid rgba(196, 181, 253, 0.14);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.05),
            0 16px 36px rgba(2, 6, 23, 0.36);
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

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-white/12 bg-white/8 p-4 shadow-2xl backdrop-blur-md sm:p-6">
          <div className="grid gap-4 rounded-2xl border border-slate-900/10 bg-white/65 px-4 py-4 text-slate-900 shadow-sm md:grid-cols-[auto_1fr_auto] md:items-center">
            <TinyStepsBrand
              to=""
              subtitle="FREE LEARNING GAMES"
              className="pointer-events-none px-0 py-0 hover:bg-transparent"
              titleClassName="text-base"
              subtitleClassName="tracking-[0.18em]"
            />

            <div className="flex flex-col items-start justify-center md:items-center">
              <div className="inline-flex items-center rounded-full border border-indigo-400/40 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 px-4 py-1.5 shadow-[0_8px_24px_rgba(59,130,246,0.35)]">
                <h1
                  className="text-sm font-black tracking-[0.02em] text-white sm:text-xl md:text-2xl"
                  style={{ textShadow: "0 2px 8px rgba(2, 6, 23, 0.45)" }}
                >
                  {config.h1}
                </h1>
              </div>
              <p className="mt-3 max-w-3xl text-sm font-medium text-slate-700 md:text-center">
                {config.intro}
              </p>
              <p className="mt-2 text-xs font-semibold text-slate-600 md:text-center">
                No login required. Progress is saved only temporarily in this browser.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <Link
                to={PUBLIC_ENGLISH_GAMES_HUB_PATH}
                className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-800"
              >
                All English Games
              </Link>
              <Link
                to={config.categoryPath}
                className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-800"
              >
                Category Page
              </Link>
              <Link
                to="/book-demo"
                className="inline-flex rounded-full border border-amber-300/50 bg-amber-300 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-900"
              >
                Book Free Demo
              </Link>
            </div>
          </div>

          <section className="mt-4 grid gap-4 lg:grid-cols-[0.55fr_0.45fr]">
            <div className="public-game-panel p-5">
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

              <h2 className="mt-4 text-2xl font-black text-slate-100">What this page covers</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {config.seoDescription}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {config.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-sky-300/25 bg-sky-400/10 px-3 py-1.5 text-xs font-bold text-sky-100"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              <div className="mt-6">
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

            <div className="public-game-panel p-5">
              <h2 className="text-2xl font-black text-slate-100">How to play</h2>
              <ol className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
                {config.howToPlay.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-6 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4">
                <p className="text-sm font-semibold text-slate-100">
                  Want saved progress and teacher guidance?{" "}
                  <Link to="/book-demo" className="font-black text-cyan-200 underline underline-offset-4">
                    Book a free demo.
                  </Link>
                </p>
              </div>
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

          <section className="mt-4 public-game-panel p-5">
            <h2 className="text-2xl font-black text-slate-100">Related game skills</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {tiles.map(({ stage, tile }) => {
                const route = getPublicTileRoute(tile.gameId);
                const isPlayable = isPublicTilePlayable(tile.gameId);
                const isSelfRoute = route?.route === config.publicPath;
                const relatedStatusText = isPlayable
                  ? "FREE TO PLAY"
                  : tile.comingSoon
                    ? "COMING SOON"
                    : "READY SOON";
                return (
                  <article key={tile.gameId} className="public-game-card rounded-2xl p-4">
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

        <section className="mt-6 grid gap-4 lg:grid-cols-[0.56fr_0.44fr]">
          <div className="public-game-panel p-5">
            <h2 className="text-2xl font-black text-slate-100">Parent FAQ</h2>
            <div className="mt-4 space-y-4">
              {faqItems.map((item) => (
                <article key={item.question} className="rounded-2xl border border-white/10 bg-slate-950/42 p-4">
                  <h3 className="faq-question text-base font-extrabold text-slate-100">{item.question}</h3>
                  <p className="faq-answer mt-2 text-sm leading-7 text-slate-300">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="public-game-panel p-5">
            <h2 className="text-2xl font-black text-slate-100">Quick links</h2>
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
              <Link
                to="/book-demo"
                className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-4 text-sm font-bold text-cyan-100"
              >
                Want saved progress and teacher guidance? Book a free demo.
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
