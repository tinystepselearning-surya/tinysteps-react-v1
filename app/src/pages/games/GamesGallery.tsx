import { Link } from "react-router-dom";
import DashboardShell from "../../components/dashboard/DashboardShell";
import type { ReactNode } from "react";
import PhonicsSoundsMasteryTile from "../../components/tiles/PhonicsSoundsMasteryTile";
import { gameMeta as spellBeeGameMeta } from "../../games/spellbee-flash";
import { gameMeta as meaningMatchGameMeta } from "../../games/meaning-match";
import { gameMeta as balloonPopGameMeta } from "../../games/balloon-pop";
import { gameMeta as balloonPopIPAMeta } from "../../games/balloon-pop-ipa";
import { gameMeta as quickMeaningMeta } from "../../games/quick-meaning-quiz";
import { gameMeta as bossLevelMeta } from "../../games/boss-level";

const iconClass = "h-5 w-5";
const bookIcon: ReactNode = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={iconClass}>
    <path d="M4 4.8a2.3 2.3 0 0 1 2.3-2.3h11.4A2.3 2.3 0 0 1 20 4.8v14.4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
    <path d="M8 2.5v18.7" />
  </svg>
);

type GameCard = {
  id: string;
  title: string;
  level: string;
  duration: string;
  description: string;
  badge?: string;
  launchHref?: string;
  launchLabel?: string;
};

const GAME_LIBRARY: GameCard[] = [
  {
    id: balloonPopIPAMeta.slug,
    title: balloonPopIPAMeta.title,
    level: "Beginner",
    duration: "6-10 mins",
    description: balloonPopIPAMeta.description,
    badge: "New!",
    // Requirement: link to /games/balloon-pop-ipa
    launchHref: `/games/${balloonPopIPAMeta.slug}`,
    launchLabel: "Play"
  },
  {
    id: "phonics-safari",
    title: "Phonics Safari Adventure",
    level: "Beginner",
    duration: "10 mins",
    description: "Hunt for letter sounds in the jungle. Match beginning sounds to pictures.",
  },
  {
    id: "rhyme-time",
    title: "Rhyme Time Challenge",
    level: "Grade 1-2",
    duration: "5 mins",
    description: "Race against time to find rhyming word pairs. Fun with word families!",
  },
  {
    id: bossLevelMeta.slug,
    title: bossLevelMeta.title,
    level: "Grade 1-2",
    duration: "7 mins",
    description: bossLevelMeta.description,
    badge: "Boss!",
    launchHref: `/kids/games/${bossLevelMeta.slug}`,
    launchLabel: "Play"
  },
  {
    id: quickMeaningMeta.slug,
    title: quickMeaningMeta.title,
    level: "Grade 1-2",
    duration: "12 mins",
    description: quickMeaningMeta.description,
    badge: "New!",
    launchHref: `/kids/games/${quickMeaningMeta.slug}`,
    launchLabel: "Play"
  },
  {
    id: balloonPopGameMeta.slug,
    title: balloonPopGameMeta.title,
    level: "Grade 1-2",
    duration: "8 mins",
    description: balloonPopGameMeta.description,
    launchHref: `/kids/games/${balloonPopGameMeta.slug}`,
    launchLabel: "Play"
  },
  {
    id: meaningMatchGameMeta.slug,
    title: meaningMatchGameMeta.title,
    level: "Grade 1-2",
    duration: "10 mins",
    description: meaningMatchGameMeta.description,
    launchHref: `/kids/games/${meaningMatchGameMeta.slug}`,
    launchLabel: "Play"
  },
  {
    id: spellBeeGameMeta.slug,
    title: spellBeeGameMeta.title,
    level: "Grade 1-3",
    duration: "15 mins",
    description: spellBeeGameMeta.description,
    badge: "Hot!",
    launchHref: `/kids/games/${spellBeeGameMeta.slug}`,
    launchLabel: "Play"
  }
];

export default function GamesGallery() {
  return (
    <DashboardShell
      navItems={[
        { 
          key: "kids", 
          label: "Kids Zone", 
          href: "/kids",
          icon: bookIcon
        },
        {
          key: "games",
          label: "Games Gallery",
          active: true,
          badge: "Fun"
        }
      ]}
      header={{
        title: "Games Gallery",
        subtitle: "Pick a game and start your learning adventure!",
      }}
    >
      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <PhonicsSoundsMasteryTile />
          {GAME_LIBRARY.map((game) => (
            <article 
              key={game.id}
              className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm hover:border-[#2563eb]/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{game.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{game.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-[#2563eb]/10 px-3 py-1 font-semibold text-[#2563eb]">
                      {game.level}
                    </span>
                    <span className="rounded-full bg-[#7c2d58]/10 px-3 py-1 font-semibold text-[#7c2d58]">
                      {game.duration}
                    </span>
                  </div>
                </div>
                {game.badge && (
                  <span className="rounded-full bg-[#f472b6]/10 px-3 py-1 text-xs font-semibold text-[#be185d]">
                    {game.badge}
                  </span>
                )}
              </div>
              
              {game.launchHref && (
                <Link
                  to={game.launchHref}
                  className="mt-4 inline-flex items-center justify-center rounded-full bg-[#2563eb] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#2563eb]/30 transition hover:bg-[#1d4ed8]"
                >
                  {game.launchLabel || "Play Now"}
                </Link>
              )}
            </article>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}