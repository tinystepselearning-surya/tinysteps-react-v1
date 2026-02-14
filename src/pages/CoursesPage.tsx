// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { applySeo } from "../lib/seo";
import type { FC } from "react";
import { CourseCard } from "../components/courses/CourseCard";
import { ParentReportPreview } from "../components/courses/ParentReportPreview";
import { catalogs } from "../content/courses";
import { DEFAULT_PER_CLASS_PRICE, formatINR } from '../constants/pricing';
import { organizationSchema } from '../lib/schemas';

const DASH_RE = /[\u2010\u2011\u2012\u2013\u2014\u2212]/g; // hyphen variants
const norm = (v: any) =>
  String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(DASH_RE, "-");

type Track = "phonics" | "grammar" | "speaking";
type TrackOrAll = Track | "all";

const TRACK_META: Record<Track, { title: string; subtitle: string; emoji: string }> = {
  phonics: {
    title: "Phonics",
    subtitle: "Sounds → blending → reading confidence",
    emoji: "🔤",
  },
  grammar: {
    title: "Grammar",
    subtitle: "Strong sentence building & accuracy",
    emoji: "🧩",
  },
  speaking: {
    title: "Public Speaking",
    subtitle: "Confidence, clarity & expression",
    emoji: "🎤",
  },
};

const LEVEL_OPTIONS = ["all", "Foundation", "Basic", "Intermediate", "Advanced", "Brush-Up"] as const;

const COURSE_ORDER = [
  "phonics foundation",
  "phonics advanced",
  "phonics brush-up",
  "grammar essentials",
  "grammar mastery",
  "public speaking foundations",
  "public speaking excellence",
];

function sortCourses(a: any, b: any) {
  const ai = COURSE_ORDER.indexOf(norm(a?.name));
  const bi = COURSE_ORDER.indexOf(norm(b?.name));
  if (ai !== -1 && bi !== -1) return ai - bi;
  if (ai !== -1) return -1;
  if (bi !== -1) return 1;
  return norm(a?.name).localeCompare(norm(b?.name));
}

const CoursesHero = () => (
  <section data-animate="fade-up" className="relative overflow-hidden bg-gradient-hero text-white">
    <div className="absolute inset-0 opacity-20">
      <div className="absolute -left-10 top-10 h-48 w-48 rounded-full bg-white/30 blur-3xl" />
      <div className="absolute right-0 bottom-10 h-64 w-64 rounded-full bg-white/30 blur-3xl" />
    </div>

    <div className="relative mx-auto max-w-6xl px-6 py-14 md:py-16">
      <div className="max-w-3xl">
        <p className="text-sm uppercase tracking-widest text-white/80">Live 1:1 English programs</p>
        <h1 className="mt-3 text-4xl font-bold md:text-5xl">Choose the perfect track for your child</h1>
        <p className="mt-4 text-white/90">
          Phonics, grammar, public speaking, and brush-up paths—mapped week-by-week with transparent pricing.
        </p>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-white/20 px-4 py-1">Ages 3–12</span>
          <span className="rounded-full bg-white/20 px-4 py-1">Parent-rated ★★★★★</span>
          {/* show per-class price from shared constant */}
          <span className="rounded-full bg-white/20 px-4 py-1">{formatINR(DEFAULT_PER_CLASS_PRICE)} per live session</span>
        </div>
      </div>
    </div>
  </section>
);

const allCourses = catalogs;

const CoursesPage: FC = () => {
  const [track, setTrack] = useState<TrackOrAll>("all");
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<(typeof LEVEL_OPTIONS)[number]>("all");

  useEffect(() => {
    const breadcrumb = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
        { '@type': 'ListItem', position: 2, name: 'Courses', item: 'https://tinystepslearning.com/courses' },
      ],
    };

    // Build Course schemas for AEO (Answer Engine Optimization)
    const courseSchemas = catalogs.map((c) => ({
      '@context': 'https://schema.org',
      '@type': 'Course',
      '@id': `https://tinystepslearning.com/#course-${c.slug}`,
      name: c.name,
      description: `${c.duration} live 1:1 ${c.track} program for ${c.age.toLowerCase()}. ${c.overview.join(', ')}.`,
      provider: {
        '@type': 'Organization',
        '@id': 'https://tinystepslearning.com/#organization',
        name: 'Tiny Steps Learning'
      },
      url: `https://tinystepslearning.com/courses#${c.slug}`,
      audience: {
        '@type': 'EducationalAudience',
        educationalRole: 'student',
        audienceType: c.age
      },
      educationalLevel: c.level,
      inLanguage: 'en-IN',
      areaServed: 'IN'
    }));

    applySeo({
      title: "Online English Courses for Kids: Phonics, Grammar & Public Speaking | Tiny Steps",
      description:
        "1:1 live English classes in India for ages 3–12 — Phonics, Grammar and Public Speaking. Structured week-by-week courses with clear progress and parent updates.",
      canonicalPath: "/courses",
      ogType: "website",
      jsonLd: [organizationSchema, breadcrumb, ...courseSchemas],
    });
  }, []);

  const filtered = useMemo(() => {
    const q = norm(query);
    const levelN = norm(level);

    return allCourses
      .filter((c) => {
        const trackOk = track === "all" || norm(c.track) === norm(track);

        // Make level filtering tolerant to Brush-Up / Brush-Up etc
        const cLevelN = norm(c.level);
        const levelOk = level === "all" || cLevelN === levelN;

        const hay = `${c?.name ?? ""} ${(c?.overview ?? []).join(" ")}`;
        const queryOk = !q || norm(hay).includes(q);

        return trackOk && levelOk && queryOk;
      })
      .slice()
      .sort(sortCourses);
  }, [track, level, query]);

  const isFiltered = track !== "all" || level !== "all" || query.trim().length > 0;

  const grouped = useMemo(() => {
    const by: Record<Track, any[]> = { phonics: [], grammar: [], speaking: [] };
    filtered.forEach((c) => {
      const t = (norm(c.track) as Track) || "phonics";
      if (t in by) by[t as Track].push(c);
    });
    (Object.keys(by) as Track[]).forEach((t) => by[t].sort(sortCourses));
    return by;
  }, [filtered]);

  return (
    <div className="page-gradient relative overflow-hidden">
      <CoursesHero />

      <div className="mx-auto max-w-6xl px-6 pb-16">
        {/* Top filter bar */}
        <div data-animate="fade-up" className="glass-panel mb-6 p-4 md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-2 text-sm font-semibold">Track</div>
              <div className="flex flex-wrap gap-2">
                {(["all", "phonics", "grammar", "speaking"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTrack(t)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition ${
                      track === t
                        ? "bg-primary-500 text-white shadow-sm"
                        : "bg-slate-100 text-gray-700 hover:bg-white"
                    }`}
                  >
                    {t === "all" ? "All" : TRACK_META[t].title}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-w-0">
              <div className="mb-2 text-sm font-semibold">Level</div>
              <div className="flex flex-wrap gap-2">
                {LEVEL_OPTIONS.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition ${
                      level === l ? "bg-primary-500 text-white shadow-sm" : "bg-slate-100 text-gray-700 hover:bg-white"
                    }`}
                  >
                    {l === "all" ? "All" : l}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full lg:w-[360px]">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold">Search</div>
                {isFiltered && (
                  <button
                    onClick={() => {
                      setTrack("all");
                      setLevel("all");
                      setQuery("");
                    }}
                    className="text-xs font-semibold text-gray-600 hover:text-gray-900"
                  >
                    Clear
                  </button>
                )}
              </div>
              <input
                className="interactive-input w-full"
                placeholder="Search courses, topics, outcomes…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
            <div>
              Showing <span className="font-semibold text-gray-800">{filtered.length}</span>{" "}
              course{filtered.length === 1 ? "" : "s"}
              {track !== "all" && (
                <>
                  {" "}
                  • <span className="font-semibold text-gray-800">{TRACK_META[track as Track].title}</span>
                </>
              )}
              {level !== "all" && (
                <>
                  {" "}
                  • <span className="font-semibold text-gray-800">{level}</span>
                </>
              )}
              {query.trim() && (
                <>
                  {" "}
                  • “<span className="font-semibold text-gray-800">{query.trim()}</span>”
                </>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div data-animate="fade-up" className="space-y-10">
          {/* Curated view when All tracks is selected */}
          {track === "all" ? (
            (["phonics", "grammar", "speaking"] as Track[]).map((t) => {
              const list = grouped[t] || [];
              if (!list.length) return null;

              return (
                <section key={t} className="glass-panel p-6 md:p-7">
                  <div className="mb-5 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{TRACK_META[t].emoji}</span>
                      <h2 className="text-xl font-bold text-gray-900">{TRACK_META[t].title}</h2>
                    </div>
                    <p className="text-sm text-gray-600">{TRACK_META[t].subtitle}</p>
                  </div>

                  <div className="grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((c) => (
                      <div key={c.slug ?? c.name} className="h-full">
                        <CourseCard {...c} />
                      </div>
                    ))}
                  </div>
                </section>
              );
            })
          ) : (
            <section className="glass-panel p-6 md:p-7">
              <div className="mb-5 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{TRACK_META[track as Track].emoji}</span>
                  <h2 className="text-xl font-bold text-gray-900">{TRACK_META[track as Track].title}</h2>
                </div>
                <p className="text-sm text-gray-600">{TRACK_META[track as Track].subtitle}</p>
              </div>

              {filtered.length === 0 ? (
                <div className="rounded-2xl bg-white/70 p-6 text-sm text-gray-700">
                  No courses match your filters. Try clearing Level/Search.
                </div>
              ) : (
                <div className="grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((c) => (
                      <div key={c.slug ?? c.name} className="h-full">
                        <CourseCard {...c} />
                      </div>
                    ))}
                </div>
              )}
            </section>
          )}

          {/* Parent report preview */}
          <div data-animate="fade-up" data-animate-delay="0.05s" className="glass-panel">
            <ParentReportPreview track={track} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursesPage;
