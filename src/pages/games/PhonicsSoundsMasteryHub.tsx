import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";
import { readProgress, readMeta, writeMeta, type PsmProgress } from "../../lib/psmProgress";

const SERIES = [
  {
    id: "foundations",
    name: "Foundations",
    desc: "Sound awareness → phoneme intro → early blending",
    phases: [1, 2],
    levels: [
      {
        id: "p1-el-01",
        title: "Listen & Tap (3 sounds)",
        phase: 1,
        gameId: "elkonin",
        target: "segment 3 phonemes",
        route: "/games/elkonin?boxes=3&rounds=3&levelId=p1-el-01",
      },
      {
        id: "p1-el-02",
        title: "Listen & Tap (4 sounds)",
        phase: 1,
        gameId: "elkonin",
        target: "segment 4 phonemes",
        route: "/games/elkonin?boxes=4&rounds=4&levelId=p1-el-02",
      },
      {
        id: "p2-bp-01",
        title: "Phoneme → Grapheme: s / a / t",
        phase: 2,
        gameId: "balloon-pop",
        target: "select matching letter",
        route: "/games/balloon-pop-ipa?set=sat",
      },
      {
        id: "p2-bp-02",
        title: "Phoneme → Grapheme: p / i / n",
        phase: 2,
        gameId: "balloon-pop",
        target: "select matching letter",
        route: "/games/balloon-pop-ipa?set=pin",
      },
      {
        id: "p2-bl-01",
        title: "Blending Train: s-a-t → sat",
        phase: 2,
        gameId: "blend-train",
        target: "blend CVC orally",
        route: "/games/blending-train?set=sat",
      },
      {
        id: "p2-wt-01",
        title: "Build CVC: sat / pin",
        phase: 2,
        gameId: "word-tiles",
        target: "build & read CVC",
        route: "/games/word-tiles?group=satpin",
      },
    ],
  },
  {
    id: "bridge",
    name: "Bridge",
    desc: "Digraphs & blends (accuracy first)",
    phases: [3, 4],
    levels: [
      {
        id: "p3-bp-01",
        title: "/ʃ/ vs /tʃ/ vs /θ/",
        phase: 3,
        gameId: "balloon-pop",
        target: "minimal pairs (digraphs)",
        route: "/games/balloon-pop-ipa?set=sh-ch-th",
      },
      {
        id: "p3-wt-01",
        title: "Read & Build: sh-ip, ch-in",
        phase: 3,
        gameId: "word-tiles",
        target: "digraph decoding",
        route: "/games/word-tiles?set=sh-ch-th",
      },
      {
        id: "p4-min-01",
        title: "CCVC/CVCC sort",
        phase: 4,
        gameId: "minpairs",
        target: "adjacent consonants",
        route: "/games/minimal-pairs?type=ccvc",
      },
      {
        id: "p4-wt-02",
        title: "Build CCVC/CVCC words",
        phase: 4,
        gameId: "word-tiles",
        target: "blend clusters",
        route: "/games/word-tiles?set=ccvc-cvcc",
      },
    ],
  },
  {
    id: "advanced",
    name: "Advanced",
    desc: "Alternative spellings & morphology",
    phases: [5, 6],
    levels: [
      {
        id: "p5-gc-01",
        title: "/eɪ/: ai / ay / a-e",
        phase: 5,
        gameId: "grapheme-choice",
        target: "choose correct spelling",
        route: "/games/grapheme-choice?phoneme=eɪ",
      },
      {
        id: "p5-gc-02",
        title: "/iː/: ee / ea / e-e / y",
        phase: 5,
        gameId: "grapheme-choice",
        target: "choose correct spelling",
        route: "/games/grapheme-choice?phoneme=iː",
      },
      {
        id: "p6-dl-01",
        title: "hoped vs hopped (-ed)",
        phase: 6,
        gameId: "dictation-lite",
        target: "encoding + rules",
        route: "/games/dictation-lite?rule=double-consonant",
      },
      {
        id: "p6-tr-01",
        title: "Tricky words – spotlight",
        phase: 6,
        gameId: "tricky",
        target: "explicit irregulars",
        route: "/games/tricky-words?pack=core",
      },
    ],
  },
];

const bookIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    className="h-5 w-5"
  >
    <path d="M4 4.8a2.3 2.3 0 0 1 2.3-2.3h11.4A2.3 2.3 0 0 1 20 4.8v14.4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
    <path d="M8 2.5v18.7" />
  </svg>
);

export default function PhonicsSoundsMasteryHub() {
  const [activeTab, setActiveTab] = useState("foundations");
  const [progress, setProgress] = useState<PsmProgress>({});
  const [lastPlayedLevel, setLastPlayedLevel] = useState<string | undefined>();

  useEffect(() => {
    setProgress(readProgress());
    const meta = readMeta();
    setLastPlayedLevel(meta.lastPlayedLevel);
  }, []);

  const activeSeries = SERIES.find((s) => s.id === activeTab);

  const allLevels = SERIES.flatMap((s) => s.levels);
  
  const resumeLevel = lastPlayedLevel 
    ? allLevels.find((lvl) => lvl.id === lastPlayedLevel)
    : allLevels.find((lvl) => !progress[lvl.id]?.completed);

  function handleLevelClick(levelId: string) {
    writeMeta({ lastPlayedLevel: levelId });
  }

  return (
    <DashboardShell
      navItems={[
        {
          key: "games",
          label: "Games Gallery",
          href: "/games",
          icon: bookIcon,
        },
        {
          key: "psm",
          label: "Phonics Sounds Mastery",
          active: true,
          badge: "Path",
        },
      ]}
      header={{
        title: "Phonics Sounds Mastery",
        subtitle: "Foundations → Bridge → Advanced (Phases 1–6)",
      }}
    >
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex gap-2">
            {SERIES.map((series) => (
              <button
                key={series.id}
                onClick={() => setActiveTab(series.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === series.id
                    ? "bg-[#2563eb] text-white shadow-md shadow-[#2563eb]/30"
                    : "bg-white/80 text-slate-700 hover:bg-white"
                }`}
              >
                {series.name}
              </button>
            ))}
          </div>

          {resumeLevel && (
            <Link
              to={resumeLevel.route}
              onClick={() => handleLevelClick(resumeLevel.id)}
              className="rounded-full bg-[#f472b6] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#f472b6]/30 transition hover:bg-[#ec4899]"
            >
              Resume
            </Link>
          )}
        </div>

        {activeSeries && (
          <div className="mb-6 rounded-2xl border border-white/60 bg-white/60 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#2563eb]">
              {activeSeries.name} (Phases {activeSeries.phases.join(", ")})
            </h3>
            <p className="mt-1 text-sm text-slate-600">{activeSeries.desc}</p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeSeries?.levels.map((level) => {
            const isCompleted = progress[level.id]?.completed;
            const stars = progress[level.id]?.stars || 0;

            return (
              <article
                key={level.id}
                className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm transition hover:border-[#2563eb]/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400">
                        Phase {level.phase}
                      </span>
                      {isCompleted && (
                        <div className="flex items-center gap-1">
                          <svg
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-4 w-4 text-green-600"
                          >
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                          </svg>
                          {stars > 0 && (
                            <div className="flex gap-0.5">
                              {Array.from({ length: Math.min(stars, 3) }).map((_, i) => (
                                <svg
                                  key={i}
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  className="h-3 w-3 text-yellow-500"
                                >
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-slate-900">
                      {level.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600">{level.target}</p>
                  </div>
                </div>

                <Link
                  to={level.route}
                  onClick={() => handleLevelClick(level.id)}
                  className="mt-4 inline-flex items-center justify-center rounded-full bg-[#2563eb] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#2563eb]/30 transition hover:bg-[#1d4ed8]"
                >
                  {isCompleted ? "Replay" : "Play"}
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}
