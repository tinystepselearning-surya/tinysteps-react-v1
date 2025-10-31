import { useMemo, useState } from "react";
import { CURRICULUM, type CurriculumAreaId } from "../data/curriculum";

type TrackStyle = {
  headerBg: string;
  chipBg: string;
  chipText: string;
  unitBg: string;
  accentBorder: string;
};

const TRACK_STYLES: Record<CurriculumAreaId, TrackStyle> = {
  phonics: {
    headerBg: "bg-gradient-to-r from-[#fbe7ff] via-[#f4ecff] to-[#e3f4ff]",
    chipBg: "bg-[#fdf4ff] text-[#a855f7]",
    chipText: "text-[#a855f7]",
    unitBg: "bg-[#fdf4ff]/80",
    accentBorder: "border-[#f5d7ff]",
  },
  grammar: {
    headerBg: "bg-gradient-to-r from-[#e7f3ff] via-[#f0f8ff] to-[#fef6ff]",
    chipBg: "bg-[#ebf4ff] text-[#2563eb]",
    chipText: "text-[#2563eb]",
    unitBg: "bg-[#f0f6ff]",
    accentBorder: "border-[#cfe0ff]",
  },
  speaking: {
    headerBg: "bg-gradient-to-r from-[#f4e7ff] via-[#f8eaff] to-[#eaf5ff]",
    chipBg: "bg-[#f7edff] text-[#7c3aed]",
    chipText: "text-[#7c3aed]",
    unitBg: "bg-[#f5f0ff]",
    accentBorder: "border-[#dcc7ff]",
  },
};

const FILTER_LABELS: Record<CurriculumAreaId, string> = {
  phonics: "Phonics",
  grammar: "Grammar",
  speaking: "Public Speaking",
};

export default function Curriculum() {
  const [activeTrack, setActiveTrack] = useState<CurriculumAreaId | "all">("all");
  const tracksToRender = activeTrack === "all" ? CURRICULUM : CURRICULUM.filter((track) => track.id === activeTrack);
  const [expandedLevels, setExpandedLevels] = useState<Record<string, boolean>>({});

  const currentLevelIds = useMemo(
    () => tracksToRender.flatMap((track) => track.levels.map((level) => level.id)),
    [tracksToRender],
  );

  const handleSelectTrack = (trackId: CurriculumAreaId | "all") => {
    setActiveTrack(trackId);
    if (trackId !== "all") {
      const el = document.getElementById(trackId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const toggleLevel = (levelId: string) => {
    setExpandedLevels((prev) => {
      const explicit = prev[levelId];
      const defaultExpanded = activeTrack !== "all";
      const current = explicit ?? defaultExpanded;
      return { ...prev, [levelId]: !current };
    });
  };

  const setAllLevels = (value: boolean) => {
    setExpandedLevels((prev) => {
      const next = { ...prev };
      currentLevelIds.forEach((id) => {
        next[id] = value;
      });
      return next;
    });
  };

  return (
    <div className="bg-gradient-to-br from-[#f5f0ff] via-white to-[#eaf5ff] scroll-smooth">
      <section className="bg-gradient-to-br from-[#ede7ff] via-[#f8edff] to-[#eaf6ff]">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#ffb38d] bg-white/60 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-[#d94b03]">
            Curriculum
          </p>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-[#0f172a] sm:text-5xl">
            Tiny Steps Master Curriculum
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-gray-700 sm:text-xl">
            Every one-to-one journey maps foundations, fluency, and mastery through clear levels, teacher logging, and parent
            dashboards.
          </p>
          <p className="mx-auto mt-3 max-w-3xl text-sm uppercase tracking-[0.28em] text-gray-500">
            Ages 3–12 · Listening · Reading · Writing · Speaking
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-3xl border border-gray-100 bg-[#fafafa] p-6 shadow-inner shadow-gray-200/60">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm font-semibold text-[#d94b03]">Jump to a track</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleSelectTrack("all")}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition ${
                  activeTrack === "all" ? "bg-[#d94b03] text-white" : "bg-white text-[#d94b03] hover:bg-[#ffe3d1]"
                }`}
                aria-pressed={activeTrack === "all"}
              >
                View all
              </button>
              {CURRICULUM.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => handleSelectTrack(track.id)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition ${
                    activeTrack === track.id ? "bg-[#0f172a] text-white" : "bg-white text-[#0f172a] hover:bg-[#e9efff]"
                  }`}
                  aria-pressed={activeTrack === track.id}
                >
                  {FILTER_LABELS[track.id]}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold text-[#0f172a]">
            {CURRICULUM.map((track) => (
              <a
                key={track.id}
                href={`#${track.id}`}
                className="rounded-full border border-[#bfd0ff] bg-white px-3 py-1 text-[#273371] hover:bg-[#f4f7ff]"
              >
                {FILTER_LABELS[track.id]} Track
              </a>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-[#0f172a]">
            <button
              type="button"
              onClick={() => setAllLevels(true)}
              className="rounded-full border border-[#bfd0ff] bg-white px-3 py-2 uppercase tracking-[0.22em] hover:bg-[#f4f7ff]"
            >
              Expand all levels
            </button>
            <button
              type="button"
              onClick={() => setAllLevels(false)}
              className="rounded-full border border-[#ffb88a] bg-white px-3 py-2 uppercase tracking-[0.22em] hover:bg-[#ffe3d1]"
            >
              Collapse all
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-16 space-y-16">
        {tracksToRender.map((track) => (
          <section key={track.id} id={track.id} className="space-y-8 scroll-mt-24">
            <header
              className={`rounded-3xl border border-gray-100 ${TRACK_STYLES[track.id].headerBg} p-8 shadow-xl shadow-gray-200/60 transition hover:-translate-y-1`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f172a]/70">
                {track.ageRange}
              </p>
              <h2 className="mt-2 text-3xl font-bold text-[#0f172a]">{track.title}</h2>
              <p className="mt-4 text-lg text-gray-700">{track.focus}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-[#d94b03]">
                {track.pathway.map((phase) => (
                  <span
                    key={phase}
                    className={`rounded-full border ${TRACK_STYLES[track.id].accentBorder} ${TRACK_STYLES[track.id].chipBg} px-3 py-1`}
                  >
                    {phase}
                  </span>
                ))}
              </div>
              <ul className="mt-6 grid gap-3 text-sm text-gray-600 md:grid-cols-3">
                {track.deliveryNotes.map((note, idx) => (
                  <li key={idx} className="rounded-2xl border border-white bg-white p-4 shadow-sm shadow-[#ffe0c8]/40">
                    {note}
                  </li>
                ))}
              </ul>
            </header>

            <div className="space-y-10">
              {track.levels.map((level) => (
                <article key={level.id} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/50">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d94b03]">{level.ageRange}</p>
                      <h3 className="mt-1 text-2xl font-bold text-[#0f172a]">{level.title}</h3>
                      <p className="mt-2 max-w-2xl text-sm text-gray-600">{level.summary}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleLevel(level.id)}
                      className="inline-flex items-center gap-2 rounded-full border border-[#ffb88a] bg-[#fff3eb] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#d94b03] transition hover:-translate-y-px hover:bg-[#ffd6b8]"
                      >
                      Mastery Stage
                      <span aria-hidden="true">
                        {(expandedLevels[level.id] ?? activeTrack !== "all") ? "−" : "+"}
                      </span>
                    </button>
                  </div>

                  <p className="mt-3 text-xs uppercase tracking-[0.28em] text-gray-500">
                    {(expandedLevels[level.id] ?? activeTrack !== "all")
                      ? "Showing focus areas and skills"
                      : "Tap to expand focus areas and skills"}
                  </p>

                  {(expandedLevels[level.id] ?? activeTrack !== "all") && (
                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                      {level.units.map((unit) => (
                        <div
                          key={unit.id}
                          className={`rounded-2xl border ${TRACK_STYLES[track.id].accentBorder} ${TRACK_STYLES[track.id].unitBg} p-5 shadow-inner shadow-gray-200/40`}
                        >
                          <h4 className="text-lg font-semibold text-[#0f172a]">{unit.title}</h4>
                          <p className="mt-2 text-sm text-gray-600">{unit.summary}</p>
                          <ul className="mt-4 space-y-2 text-sm text-gray-700">
                            {unit.skills.map((skill) => (
                              <li key={skill.id} className="rounded-xl bg-white/90 px-3 py-2 shadow-sm shadow-gray-200/60 transition hover:-translate-y-0.5 hover:shadow-lg">
                                <p className="font-semibold text-[#0f172a]">{skill.title}</p>
                                <p className="text-xs text-gray-500">{skill.description}</p>
                                {skill.notes && <p className="mt-1 text-xs text-gray-500">{skill.notes}</p>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
