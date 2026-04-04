import { useMemo, useState } from "react";

type JourneyCategory = "phonics" | "grammar" | "speaking" | "breakthrough";
type JourneyKey = "S1" | "S2" | "S3" | "S4" | "S5" | "S6" | "S7" | "S8";
type JourneyDetail = {
  childCanDo: readonly string[];
  nextMilestone: string;
  teacherFocus: readonly string[];
  homePractice: string;
};

type JourneyStop = {
  key: JourneyKey;
  title: string;
  category: JourneyCategory;
};

const JOURNEY_STOPS: JourneyStop[] = [
  { key: "S1", title: "Pre-Writing Skills (Tracing)", category: "phonics" },
  { key: "S2", title: "Letter-Sound Correspondence & Letter Formation", category: "phonics" },
  { key: "S3", title: "Blending & Word Families", category: "phonics" },
  { key: "S4", title: "Sentence Reading (Decoding & Fluency)", category: "phonics" },
  { key: "S5", title: "Sentence Writing (Handwriting & Punctuation)", category: "grammar" },
  { key: "S6", title: "Spelling Patterns & Phonics Rules", category: "grammar" },
  { key: "S7", title: "Grammar & Vocabulary", category: "speaking" },
  { key: "S8", title: "Confident Speaking (No Stage Fright)", category: "breakthrough" },
];

const CATEGORY_META: Record<JourneyCategory, { badge: string; dot: string; panel: string }> = {
  phonics: {
    badge: "border-orange-200 bg-orange-50 text-orange-800",
    dot: "bg-orange-500",
    panel: "from-orange-50 via-white to-orange-100/70",
  },
  grammar: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-500",
    panel: "from-emerald-50 via-white to-emerald-100/70",
  },
  speaking: {
    badge: "border-violet-200 bg-violet-50 text-violet-800",
    dot: "bg-violet-500",
    panel: "from-violet-50 via-white to-violet-100/70",
  },
  breakthrough: {
    badge: "border-amber-200 bg-amber-50 text-amber-900",
    dot: "bg-amber-500",
    panel: "from-amber-50 via-white to-amber-100/70",
  },
};

const JOURNEY_DETAILS: Record<JourneyKey, JourneyDetail> = {
  S1: {
    childCanDo: ["Hold pencil like a pro", "Trace big curves", "Keep lines neat"],
    nextMilestone: "Write first letters with correct formation",
    teacherFocus: ["Grip strength", "Line control", "Confidence building"],
    homePractice: "Trace shapes in sand or on paper for 5 minutes",
  },
  S2: {
    childCanDo: ["Say 26 letter sounds", "Form letters correctly", "Say sounds in order"],
    nextMilestone: "Blend 2-3 sounds into words",
    teacherFocus: ["Sound accuracy", "Letter formation", "Muscle memory"],
    homePractice: "Point to letters and say their sounds at home",
  },
  S3: {
    childCanDo: ["Blend sounds into words", "Read CVC words", "Spell 3-letter words"],
    nextMilestone: "Read simple sentences smoothly",
    teacherFocus: ["Blending fluency", "Word family patterns", "Spelling sounds"],
    homePractice: "Read 5 simple CVC words together and spell them",
  },
  S4: {
    childCanDo: ["Decode sentences", "Pause at periods", "Answer simple questions"],
    nextMilestone: "Write simple sentences independently",
    teacherFocus: ["Fluency building", "Comprehension", "Punctuation awareness"],
    homePractice: "Read a 3-sentence story and ask what happened",
  },
  S5: {
    childCanDo: ["Write full sentences", "Use capitals correctly", "Add periods"],
    nextMilestone: "Spell common words without help",
    teacherFocus: ["Sentence structure", "Punctuation rules", "Speed and accuracy"],
    homePractice: "Write 3 short sentences about the day",
  },
  S6: {
    childCanDo: ["Apply magic-e rule", "Use vowel teams", "Spell pattern words"],
    nextMilestone: "Spell multisyllabic words",
    teacherFocus: ["Pattern recognition", "Rule application", "Word structure"],
    homePractice: "Find words with ai or ee sounds in books",
  },
  S7: {
    childCanDo: ["Use correct tenses", "Build longer sentences", "Use richer vocabulary"],
    nextMilestone: "Write short paragraphs with confidence",
    teacherFocus: ["Grammar rules", "Vocabulary expansion", "Sentence variety"],
    homePractice: "Use before, after, and because in daily writing",
  },
  S8: {
    childCanDo: ["Speak on stage", "Handle any topic", "Speak with confidence"],
    nextMilestone: "Present ideas to larger groups",
    teacherFocus: ["Speaking confidence", "Presentation skills", "Handling nervousness"],
    homePractice: "Practice a 1-minute talk on a fun topic",
  },
} as const;

const toRoman = (n: number) =>
  ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][n] || String(n);

export default function LearningJourneyRoadmapPPT() {
  const [activeKey, setActiveKey] = useState<JourneyStop["key"]>("S1");

  const active = useMemo(() => {
    const stop = JOURNEY_STOPS.find((item) => item.key === activeKey) ?? JOURNEY_STOPS[0];
    return {
      ...stop,
      ...JOURNEY_DETAILS[stop.key],
    };
  }, [activeKey]);

  const activeIndex = JOURNEY_STOPS.findIndex((item) => item.key === active.key) + 1;
  const activeMeta = CATEGORY_META[active.category];

  return (
    <section className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,247,237,0.96)_0%,rgba(240,249,255,0.92)_100%)] shadow-[0_18px_50px_rgba(2,6,23,0.08)]">
      <div className="px-5 pb-4 pt-5 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-3xl font-black tracking-tight text-slate-900">The Journey</div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700 sm:text-base">
            <strong>Tracing to reading to writing to confident speaking</strong> with tiny wins,
            guided practice, and calm confidence-building.
          </p>
        </div>
      </div>

      <div className="px-5 pb-5 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="flex snap-x gap-3 overflow-x-auto pb-1">
            {JOURNEY_STOPS.map((stop, index) => {
              const meta = CATEGORY_META[stop.category];
              const isActive = stop.key === active.key;

              return (
                <button
                  key={stop.key}
                  type="button"
                  onClick={() => setActiveKey(stop.key)}
                  className={`min-w-[220px] snap-start rounded-[24px] border px-4 py-4 text-left shadow-sm transition hover:-translate-y-0.5 ${
                    isActive
                      ? "border-slate-900 bg-white text-slate-900 shadow-[0_18px_35px_rgba(15,23,42,0.08)]"
                      : "border-white/70 bg-white/75 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${meta.dot}`} />
                    <span className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                      Stage {toRoman(index + 1)}
                    </span>
                  </div>
                  <div className="mt-3 text-sm font-bold leading-5">{stop.title}</div>
                  <span className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${meta.badge}`}>
                    {stop.category}
                  </span>
                </button>
              );
            })}
          </div>

          <div className={`rounded-[24px] border border-slate-200 bg-gradient-to-br ${activeMeta.panel} p-4 shadow-[0_14px_30px_rgba(2,6,23,0.06)] sm:p-5`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">
                  Stage {toRoman(activeIndex)}
                </div>
                <div className="mt-1 text-xl font-black text-slate-900">{active.title}</div>
              </div>
              <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-sm font-semibold ${activeMeta.badge}`}>
                {active.category}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-[18px] border border-slate-200/80 bg-white/90 p-4 shadow-sm">
                <div className="text-sm font-black text-slate-900">Child Can Do</div>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {active.childCanDo.map((item: string) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="rounded-[18px] border border-slate-200/80 bg-white/90 p-4 shadow-sm">
                <div className="text-sm font-black text-slate-900">Next Milestone</div>
                <p className="mt-3 text-sm leading-6 text-slate-700">{active.nextMilestone}</p>
              </article>

              <article className="rounded-[18px] border border-slate-200/80 bg-white/90 p-4 shadow-sm">
                <div className="text-sm font-black text-slate-900">Teacher Focus</div>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {active.teacherFocus.map((item: string) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="rounded-[18px] border border-slate-200/80 bg-white/90 p-4 shadow-sm">
                <div className="text-sm font-black text-slate-900">5-min Home Practice</div>
                <p className="mt-3 text-sm leading-6 text-slate-700">{active.homePractice}</p>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
