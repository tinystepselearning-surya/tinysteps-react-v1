import { useCallback, useMemo, useState } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";
import { buildNavItems } from "../../components/dashboard/navItems";

type KidsTab = "games" | "worksheets" | "stories" | "live";

const GAME_LIBRARY = [
  {
    id: "phonics-safari",
    title: "Phonics Safari",
    level: "Ages 5-7",
    duration: "10 mins",
    description: "Match letter sounds to friendly jungle animals and unlock the secret word.",
    badge: "New",
  },
  {
    id: "grammar-galaxy",
    title: "Grammar Galaxy",
    level: "Ages 8-10",
    duration: "12 mins",
    description: "Fix spaceship sentences and collect star coins for correctly placed punctuation.",
    badge: "Top pick",
  },
  {
    id: "speech-quest",
    title: "Speech Quest",
    level: "Ages 9-12",
    duration: "8 mins",
    description: "Practise storytelling prompts and earn applause by recording your best opening lines.",
  },
];

const WORKSHEETS = [
  {
    id: "blends-pack",
    title: "Blend Busters Pack",
    focus: "Phonics · sh, ch, th",
    pages: 6,
    format: "Printable + interactive",
  },
  {
    id: "dialogue-tags",
    title: "Dialogue Tags Detective",
    focus: "Grammar · punctuation",
    pages: 4,
    format: "PDF + audio guide",
  },
  {
    id: "debate-cards",
    title: "Debate Sparks Cards",
    focus: "Public speaking · quick rebuttals",
    pages: 5,
    format: "Flip cards",
  },
];

const STORY_LIBRARY = [
  {
    id: "rainbow-rocket",
    title: "Rainbow Rocket",
    author: "Tiny Steps Originals",
    length: "6 min read",
    theme: "Confidence & curiosity",
  },
  {
    id: "milo-manners",
    title: "Milo and the Magic Manners",
    author: "Coach Aaminah",
    length: "8 min read",
    theme: "Empathy & friendship",
  },
  {
    id: "lost-letter",
    title: "The Case of the Lost Letter",
    author: "Coach Ravi",
    length: "10 min read",
    theme: "Creative writing mystery",
  },
];

const LIVE_SESSIONS = [
  {
    id: "junior-club",
    title: "Junior Reading Club",
    time: "Tue · 5:30 PM",
    coach: "Coach Kavya",
    detail: "Read aloud your favourite page and play expression bingo.",
  },
  {
    id: "story-lab",
    title: "Story Lab Workshop",
    time: "Thu · 6:00 PM",
    coach: "Coach Riya",
    detail: "Create a mini-comic with characters, setting, and a wow ending.",
  },
  {
    id: "confidence-circle",
    title: "Confidence Circle",
    time: "Sat · 11:00 AM",
    coach: "Coach Aarav",
    detail: "Join a fun improv game to practise quick-thinking responses.",
  },
];

export default function KidsPortal() {
  const [activeTab, setActiveTab] = useState<KidsTab>("games");
  const [selectedGame, setSelectedGame] = useState(GAME_LIBRARY[0].id);

  const scrollToId = useCallback((id: string) => {
    return () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
  }, []);

  const navItems = useMemo(
    () =>
      buildNavItems("kids", {
        includeKeys: ["kids", "parents", "homework"],
        overrides: {
          kids: { label: "Kids arena", badge: "Fun", onSelect: scrollToId("kids-adventure") },
          parents: { label: "Family dashboard", href: "/parents" },
          homework: { label: "Practice hub", onSelect: scrollToId("kids-adventure") },
        },
      }),
    [scrollToId],
  );

  const headerToolbar = (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <button className="inline-flex items-center justify-center rounded-full border border-[#7c2d58]/30 bg-white/90 px-4 py-2 text-sm font-semibold text-[#7c2d58] shadow-sm shadow-[#7c2d58]/15 transition hover:bg-[#7c2d58]/10">
        Download activity pack
      </button>
      <button className="inline-flex items-center justify-center rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#2563eb]/30 transition hover:bg-[#1d4ed8]">
        Join live club
      </button>
    </div>
  );

  return (
    <DashboardShell
      navItems={navItems}
      header={{
        title: "Kids play & learn hub",
        subtitle:
          "Pick a quick game, download worksheets, or hop into a live class. Everything is curated for short, joyful practice.",
        toolbar: headerToolbar,
      }}
    >
      <section id="kids-adventure" className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-900/8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Choose your adventure</h2>
            <p className="mt-1 text-sm text-slate-600">
              Switch tabs to explore mini-games, printable worksheets, storybooks, or join a live club.
            </p>
          </div>
          <div className="flex rounded-full bg-white/70 p-1 shadow-inner shadow-slate-900/5">
            {(["games", "worksheets", "stories", "live"] as KidsTab[]).map((tab) => {
              const label =
                tab === "games"
                  ? "Games"
                  : tab === "worksheets"
                    ? "Worksheets"
                    : tab === "stories"
                      ? "Story books"
                      : "Live clubs";
              const selected = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                    selected ? "bg-white text-[#2563eb] shadow" : "text-slate-500"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === "games" && (
          <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr,1fr]">
            <div className="space-y-4">
              {GAME_LIBRARY.map((game) => {
                const selected = selectedGame === game.id;
                return (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => setSelectedGame(game.id)}
                    className={`w-full rounded-3xl border px-5 py-5 text-left transition ${
                      selected
                        ? "border-[#2563eb]/60 bg-white shadow-lg shadow-[#2563eb]/10"
                        : "border-white/60 bg-white/80 shadow-sm hover:border-[#2563eb]/30"
                    }`}
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
                  </button>
                );
              })}
            </div>
            <aside className="rounded-3xl border border-white/60 bg-white/85 p-5 shadow-inner shadow-slate-900/10">
              <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#2563eb]">How to play</h3>
              {GAME_LIBRARY.filter((game) => game.id === selectedGame).map((game) => (
                <div key={game.id} className="mt-4 space-y-3 text-sm text-slate-600">
                  <p>
                    Launch <strong>{game.title}</strong> on a tablet or laptop. Use headphones if you want a quieter space.
                  </p>
                  <p>
                    Complete the challenge in under {game.duration}. Screenshots of your score go straight to your Learning
                    Manager.
                  </p>
                  <p className="rounded-2xl bg-[#2563eb]/10 px-4 py-3 text-[#1d4ed8]">
                    Tip: replay the level to beat your personal best and unlock bonus stickers.
                  </p>
                </div>
              ))}
            </aside>
          </div>
        )}

        {activeTab === "worksheets" && (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {WORKSHEETS.map((sheet) => (
              <article key={sheet.id} className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900">{sheet.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{sheet.focus}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.22em] text-[#7c2d58]">{sheet.format}</p>
                <p className="mt-1 text-xs text-slate-500">{sheet.pages} pages</p>
                <button className="mt-4 inline-flex items-center justify-center rounded-full bg-[#2563eb] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#2563eb]/30 transition hover:bg-[#1d4ed8]">
                  Download
                </button>
              </article>
            ))}
          </div>
        )}

        {activeTab === "stories" && (
          <div className="mt-6 space-y-4">
            {STORY_LIBRARY.map((story) => (
              <article key={story.id} className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{story.title}</h3>
                    <p className="text-sm text-slate-600">By {story.author}</p>
                  </div>
                  <span className="rounded-full bg-[#f9a8d4]/20 px-3 py-1 text-xs font-semibold text-[#be185d]">
                    {story.theme}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600">{story.length}</p>
                <button className="mt-3 inline-flex items-center justify-center rounded-full border border-[#2563eb]/30 bg-white px-4 py-2 text-xs font-semibold text-[#2563eb] shadow-sm transition hover:bg-[#2563eb]/10">
                  Read online
                </button>
              </article>
            ))}
          </div>
        )}

        {activeTab === "live" && (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {LIVE_SESSIONS.map((session) => (
              <article key={session.id} className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900">{session.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{session.detail}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.22em] text-[#2563eb]">{session.time}</p>
                <p className="mt-1 text-xs text-slate-500">Coach {session.coach}</p>
                <button className="mt-4 inline-flex items-center justify-center rounded-full bg-[#7c2d58] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#7c2d58]/30 transition hover:bg-[#661f47]">
                  Reserve my seat
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
