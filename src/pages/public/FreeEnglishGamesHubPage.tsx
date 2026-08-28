import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Meta from "../../components/common/Meta";
import EnglishExcellenceHub, {
  type EnglishExcellenceHubCard,
  type EnglishExcellenceHubStat,
} from "../../components/games/EnglishExcellenceHub";
import {
  ENGLISH_EXCELLENCE_STAGES,
  getEnglishExcellenceIcon,
} from "../../lib/englishExcellenceMission";
import {
  PUBLIC_ENGLISH_GAMES_HUB_PATH,
  PUBLIC_ENGLISH_GAMES_CATEGORY_CONFIGS,
  PUBLIC_PROGRESS_STORAGE_KEY,
  PUBLIC_TILE_ROUTES,
  createEmptyPublicProgress,
  getPublicEnglishGameDirectoryEntries,
  parsePublicProgress,
} from "../../lib/publicEnglishGames";
import { applySeo } from "../../lib/seo";

const PAGE_PATH = PUBLIC_ENGLISH_GAMES_HUB_PATH;
const PAGE_URL = `https://tinystepslearning.com${PAGE_PATH}`;

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "@id": `${PAGE_URL}#breadcrumb`,
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://tinystepslearning.com/" },
    { "@type": "ListItem", position: 2, name: "Free English Games for Kids", item: PAGE_URL },
  ],
};

export default function FreeEnglishGamesHubPage() {
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
  const [progress, setProgress] = useState(() => {
    if (typeof window === "undefined") {
      return createEmptyPublicProgress();
    }
    return parsePublicProgress(window.localStorage.getItem(PUBLIC_PROGRESS_STORAGE_KEY)) || createEmptyPublicProgress();
  });

  useEffect(() => {
    applySeo({
      title: "Free English Games for Kids | Phonics, Reading, Grammar & Speaking",
      description:
        "Play free English learning games for kids from Tiny Steps. Practise phonics, letter sounds, reading, grammar, sentence building and speaking confidence. No login required.",
      canonicalPath: PAGE_PATH,
      ogType: "website",
      jsonLd: [breadcrumbSchema],
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PUBLIC_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    const activeTab = tabsRef.current[selectedStageIndex];
    if (activeTab && typeof activeTab.scrollIntoView === "function") {
      activeTab.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [selectedStageIndex]);

  const playableTileIds = useMemo(
    () =>
      new Set(
        ENGLISH_EXCELLENCE_STAGES.flatMap((stage) => stage.tiles)
          .filter((tile) => PUBLIC_TILE_ROUTES[tile.gameId]?.enabled)
          .map((tile) => tile.gameId),
      ),
    [],
  );
  const completedSet = useMemo(
    () => new Set(progress.completedTileIds.filter((id) => playableTileIds.has(id))),
    [playableTileIds, progress.completedTileIds],
  );
  const currentStage = ENGLISH_EXCELLENCE_STAGES[selectedStageIndex];

  const trainingTracks = useMemo(
    () =>
      ENGLISH_EXCELLENCE_STAGES.map((stage) => {
        const completed = stage.tiles.filter((tile) => completedSet.has(tile.gameId)).length;
        const total = stage.tiles.length;
        const playable = stage.tiles.filter((tile) => PUBLIC_TILE_ROUTES[tile.gameId]?.enabled).length;
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
        return {
          stageId: stage.stageId,
          stageNumber: stage.stageNumber,
          title: stage.stageTitle,
          completed,
          total,
          playable,
          pct,
        };
      }),
    [completedSet],
  );

  const totalReadyGames = useMemo(
    () => trainingTracks.reduce((sum, stage) => sum + stage.playable, 0),
    [trainingTracks],
  );

  const stats: EnglishExcellenceHubStat[] = [
    { label: "Tracks", value: 7 },
    { label: "Free Games", value: totalReadyGames },
    { label: "Completed Here", value: completedSet.size },
    { label: "Temporary", value: "Browser Only" },
  ];

  const toggleCompleted = (gameId: string) => {
    if (!playableTileIds.has(gameId)) return;
    setProgress((prev) => {
      const completed = new Set(prev.completedTileIds);
      if (completed.has(gameId)) completed.delete(gameId);
      else completed.add(gameId);
      return { v: 1, completedTileIds: [...completed] };
    });
  };

  const cards: EnglishExcellenceHubCard[] = currentStage.tiles.map((tile) => {
    const publicRoute = PUBLIC_TILE_ROUTES[tile.gameId];
    const isPlayable = Boolean(publicRoute?.enabled && publicRoute.route);
    const isCompleted = completedSet.has(tile.gameId);
    const locked = tile.comingSoon || !isPlayable;

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
      badgeClassName = "bg-slate-700/30 border-slate-500/35 text-slate-200";
    }

    return {
      tile: {
        ...tile,
        route: publicRoute?.route,
      },
      icon: getEnglishExcellenceIcon(tile.gameTitle ?? tile.title ?? ""),
      badgeText,
      badgeClassName,
      footerText,
      ctaText,
      locked,
      isCompleted,
    };
  });

  const gameDirectory = useMemo(() => getPublicEnglishGameDirectoryEntries(), []);

  return (
    <div className="min-h-screen bg-[#05010f]">
      <Meta
        title="Free English Games for Kids | Phonics, Reading, Grammar & Speaking"
        description="Play free English learning games for kids from Tiny Steps. Practise phonics, letter sounds, reading, grammar, sentence building and speaking confidence. No login required."
        canonical={PAGE_URL}
      />

      <EnglishExcellenceHub
        brandSubtitle="FREE LEARNING GAMES"
        title="English Excellence Games"
        trustLine="Play free English games for kids. No login required. Progress is saved only temporarily in this browser."
        topRight={
          <div className="inline-flex items-center rounded-full border border-emerald-300/35 bg-white/80 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700 shadow-sm">
            No Login Required
          </div>
        }
        currentStage={currentStage}
        trainingTracks={trainingTracks}
        stats={stats}
        cards={cards}
        selectedStageIndex={selectedStageIndex}
        onSelectStage={setSelectedStageIndex}
        linkPlayableTiles
        onToggleComplete={(event, _stageNumber, tile) => {
          event.stopPropagation();
          event.preventDefault();
          toggleCompleted(tile.gameId);
        }}
        tabsRef={tabsRef}
      />

      <div className="mx-auto w-full max-w-7xl space-y-4 px-3 pb-10 sm:px-5">
        <section
          aria-labelledby="featured-balloon-pop"
          className="overflow-hidden rounded-xl border border-fuchsia-300/25 bg-[linear-gradient(135deg,rgba(88,28,135,0.42),rgba(14,116,144,0.28))] p-5 shadow-[0_18px_60px_rgba(76,29,149,0.2)] sm:p-6"
        >
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-fuchsia-200">Featured Tiny Steps Phonics game</p>
              <h2 id="featured-balloon-pop" className="mt-2 text-2xl font-black text-white sm:text-3xl">
                Hear the sound → find the letter → pop the balloon 🎈
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
                Tiny Steps Phonics Balloon Pop turns letter-sound practice into a quick listening challenge. Children hear one target sound, scan the moving balloons, and pop the matching letter. Start with SATPIN or choose another sound group.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-100">
                {['Free', 'No login', 'Letter-sound listening', 'SATPIN included', 'Preschool & kindergarten'].map((item) => (
                  <span key={item} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-3 lg:max-w-[260px] lg:justify-end">
              <Link
                to="/free-balloon-pop-phonics-game-for-kids"
                className="inline-flex rounded-lg border border-cyan-200/40 bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 hover:bg-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200"
              >
                Play Tiny Steps Phonics Balloon Pop
              </Link>
              <Link
                to="/blog/satpin-phonics-guide"
                className="inline-flex rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm font-extrabold text-white hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              >
                Read the SATPIN Parent Guide
              </Link>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="browse-games-by-skill"
          className="rounded-lg border border-violet-300/20 bg-slate-950/60 p-4 backdrop-blur-md"
        >
          <h2 id="browse-games-by-skill" className="text-xl font-black text-white sm:text-2xl">
            Browse English Games by Skill
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PUBLIC_ENGLISH_GAMES_CATEGORY_CONFIGS.map((category) => (
              <article key={category.route} className="rounded-lg border border-violet-300/15 bg-slate-900/55 p-4">
                <h3 className="text-base font-extrabold text-cyan-100">
                  <Link className="hover:text-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300" to={category.route}>
                    {category.h1}
                  </Link>
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{category.intro}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="play-free-english-games"
          className="rounded-lg border border-violet-300/20 bg-slate-950/60 p-4 backdrop-blur-md"
        >
          <h2 id="play-free-english-games" className="text-xl font-black text-white sm:text-2xl">
            Play Free English Games
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {gameDirectory.map((game) => (
              <article key={game.route} className="rounded-lg border border-violet-300/15 bg-slate-900/55 p-4">
                <h3 className="text-base font-extrabold text-white">{game.title}</h3>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-violet-200">{game.stage}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{game.description}</p>
                <Link
                  className="mt-3 inline-flex rounded-lg border border-cyan-300/40 bg-cyan-400/10 px-3 py-2 text-sm font-extrabold text-cyan-100 hover:bg-cyan-400/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
                  to={game.route}
                >
                  Play {game.title}
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
