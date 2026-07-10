import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  PUBLIC_PROGRESS_STORAGE_KEY,
  PUBLIC_TILE_ROUTES,
  createEmptyPublicProgress,
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
  const navigate = useNavigate();
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

  const completedSet = useMemo(() => new Set(progress.completedTileIds), [progress.completedTileIds]);
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
    { label: "Completed Here", value: progress.completedTileIds.length },
    { label: "Temporary", value: "Browser Only" },
  ];

  const toggleCompleted = (gameId: string) => {
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
        onTileClick={(_, tile) => {
          const route = PUBLIC_TILE_ROUTES[tile.gameId];
          if (!route?.route) return;
          navigate(route.route);
        }}
        onToggleComplete={(event, _stageNumber, tile) => {
          event.stopPropagation();
          event.preventDefault();
          toggleCompleted(tile.gameId);
        }}
        tabsRef={tabsRef}
      />
    </div>
  );
}
