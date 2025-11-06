import { useCallback, useMemo, useState } from "react";
import DashboardShell from "../components/dashboard/DashboardShell";
import { buildNavItems } from "../components/dashboard/navItems";

type ParentTab = "progress" | "homework" | "updates";

const PROGRAMME_SUMMARIES = [
  {
    id: "phonics",
    name: "Phonics Foundations",
    accent: "from-[#fee2b6] to-[#fbbf24]",
    summary: "Letter-sound mastery, blending fluency, and expressive reading.",
    quickStats: [
      { label: "Sound mastery", value: "92%", helper: "Completed 24 / 26 focus sounds" },
      { label: "Practice streak", value: "5 days", helper: "Home activity streak" },
    ],
    progress: [
      { label: "SATPIN + next sets", value: 95 },
      { label: "Digraph discovery", value: 72 },
      { label: "Story retell", value: 80 },
    ],
    milestone: "Practise voice modulation for expressive reading",
  },
  {
    id: "grammar",
    name: "Grammar & Writing Lab",
    accent: "from-[#d9e9ff] to-[#60a5fa]",
    summary: "Sentence craft, punctuation practice, and confident drafting.",
    quickStats: [
      { label: "Grammar accuracy", value: "87%", helper: "Last 5 submissions" },
      { label: "Draft feedback", value: "4 notes", helper: "Voice notes this week" },
    ],
    progress: [
      { label: "Sentence expansion", value: 84 },
      { label: "Punctuation mastery", value: 68 },
      { label: "Editing skills", value: 76 },
    ],
    milestone: "Draft persuasive letter #1 ready for teacher comments",
  },
  {
    id: "speaking",
    name: "Public Speaking Studio",
    accent: "from-[#e0e7ff] to-[#6366f1]",
    summary: "Storytelling, voice modulation, and stage confidence drills.",
    quickStats: [
      { label: "Confidence score", value: "4.8 / 5", helper: "Self + coach rating" },
      { label: "Video library", value: "9 clips", helper: "Feedback tagged recordings" },
    ],
    progress: [
      { label: "Voice modulation", value: 78 },
      { label: "Story structure", value: 88 },
      { label: "Audience Q&A", value: 65 },
    ],
    milestone: "Practise quick bridging statements for Q&A",
  },
];

const HOMEWORK_QUEUE = [
  {
    id: "class-19",
    title: "Class #19",
    subject: "English · Pronunciation",
    duration: "30 mins",
    date: "6 February 2024 · 6:15 pm — 7:00 pm",
    coach: "Aaminah Khan",
    status: "Completed",
  },
  {
    id: "class-27",
    title: "Class #27",
    subject: "English · Pronunciation",
    duration: "30 mins",
    date: "9 February 2024 · 5:30 pm — 6:00 pm",
    coach: "Aaminah Khan",
    status: "Pending review",
  },
  {
    id: "class-29",
    title: "Class #29",
    subject: "English · Pronunciation",
    duration: "30 mins",
    date: "13 February 2024 · 5:30 pm — 6:00 pm",
    coach: "Aaminah Khan",
    status: "Uploaded",
  },
];

const UPCOMING_EVENTS = [
  {
    id: "debate",
    title: "Confidence circle — debate",
    timing: "Thu · 7:30 PM · Online",
    focus: "Quick rebuttal rounds",
  },
  {
    id: "showcase",
    title: "Showcase rehearsal",
    timing: "Sun · 11:00 AM · Studio",
    focus: "Stage blocking & mic cues",
  },
  {
    id: "portfolio",
    title: "Portfolio review call",
    timing: "Sat · 4:00 PM · Virtual",
    focus: "Share rubric insights",
  },
];

const FEE_STATUS = {
  badge: "Due soon",
  amount: "₹1,050 · 3 classes left",
  detail: "Learning Manager will confirm the top-up reminder on Thursday.",
};

const MONTHLY_HIGHLIGHTS = [
  "Kavya mastered sh/ch digraphs and can explain tricky words independently.",
  "Aarav edited dialogue tags accurately using question mark pause practice.",
  "Riya’s voice projection improved; showcase clip shared with you on portal.",
];

const CONTACT_INFO = [
  { label: "Learning Manager", value: "Saanvi Gupta · +91 98200 11234" },
  { label: "Email", value: "support@tinysteps.in" },
];

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-[#0b7ad7]" style={{ width: `${value}%` }} />
    </div>
  );
}

export default function Parents() {
  const [activeTab, setActiveTab] = useState<ParentTab>("progress");
  const [programmeFilter, setProgrammeFilter] = useState<string>("all");

  const pendingHomework = HOMEWORK_QUEUE.filter((item) => item.status !== "Completed").length;

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
      buildNavItems("parents", {
        includeKeys: ["parents", "homework", "kids"],
        overrides: {
          parents: {
            label: "Family dashboard",
            badge: `${PROGRAMME_SUMMARIES.length}`,
            onSelect: scrollToId("learning-overview"),
          },
          homework: {
            label: "Homework log",
            badge: pendingHomework ? `${pendingHomework}` : undefined,
            onSelect: scrollToId("daily-updates"),
          },
          kids: { label: "Kids arena", href: "/roles/kids" },
        },
      }),
    [pendingHomework, scrollToId],
  );

  const filteredProgrammes = useMemo(() => {
    if (programmeFilter === "all") return PROGRAMME_SUMMARIES;
    return PROGRAMME_SUMMARIES.filter((programme) => programme.id === programmeFilter);
  }, [programmeFilter]);

  const headerToolbar = (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <button className="inline-flex items-center justify-center rounded-full border border-[#0b7ad7]/20 bg-white px-4 py-2 text-sm font-semibold text-[#0b7ad7] shadow-sm shadow-[#0b7ad7]/10 transition hover:bg-[#0b7ad7]/10">
        Download monthly summary
      </button>
      <button className="inline-flex items-center justify-center rounded-full bg-[#0b7ad7] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#0b7ad7]/30 transition hover:bg-[#0b6ac0]">
        Message Learning Manager
      </button>
    </div>
  );

  const rightRail = (
    <>
      <section className="rounded-3xl border border-[#0b7ad7]/10 bg-white p-6 shadow-xl shadow-slate-900/8">
        <h2 className="text-base font-semibold text-slate-900">Fee status</h2>
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#fee2b6] px-3 py-1 text-xs font-semibold text-[#b45309]">
            {FEE_STATUS.badge}
          </span>
          <p className="mt-3 text-base font-semibold text-slate-900">{FEE_STATUS.amount}</p>
          <p className="mt-2 text-xs text-slate-500">{FEE_STATUS.detail}</p>
        </div>
      </section>

      <section className="rounded-3xl border border-[#0b7ad7]/10 bg-white p-6 shadow-xl shadow-slate-900/8">
        <h2 className="text-base font-semibold text-slate-900">Monthly highlights</h2>
        <ul className="mt-4 space-y-3 text-sm text-slate-600">
          {MONTHLY_HIGHLIGHTS.map((item) => (
            <li key={item} className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-[#0b7ad7]/10 bg-white p-6 shadow-xl shadow-slate-900/8">
        <h2 className="text-base font-semibold text-slate-900">Need help?</h2>
        <ul className="mt-4 space-y-3 text-sm text-slate-600">
          {CONTACT_INFO.map((row) => (
            <li key={row.label} className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0b7ad7]">{row.label}</p>
              <p className="mt-1 text-sm text-slate-600">{row.value}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );

  return (
    <DashboardShell
      navItems={navItems}
      header={{
        title: "Family dashboard",
        subtitle:
          "Track progress, homework, and upcoming events. Learning Managers coordinate every update so you never miss a milestone.",
        toolbar: headerToolbar,
      }}
      rightRail={rightRail}
    >
      <section id="learning-overview" className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-900/8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Learning overview</h2>
            <p className="mt-1 text-sm text-slate-600">Choose a programme to view detailed progress and milestones.</p>
          </div>
            <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setProgrammeFilter("all")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                programmeFilter === "all" ? "bg-[#0b7ad7] text-white shadow" : "bg-slate-100 text-slate-600"
              }`}
              type="button"
            >
              All programmes
            </button>
            {PROGRAMME_SUMMARIES.map((programme) => (
              <button
                key={programme.id}
                onClick={() => setProgrammeFilter(programme.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  programmeFilter === programme.id ? "bg-[#0b7ad7] text-white shadow" : "bg-slate-100 text-slate-600"
                }`}
                type="button"
              >
                {programme.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {filteredProgrammes.map((programme) => (
            <article
              key={programme.id}
              className="flex flex-col gap-4 rounded-3xl border border-white/70 bg-white/85 p-5 shadow-sm shadow-slate-900/10 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className={`h-20 w-24 shrink-0 rounded-2xl bg-gradient-to-br ${programme.accent}`} />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">{programme.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{programme.summary}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {programme.quickStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0b7ad7]">{stat.label}</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{stat.value}</p>
                    <p className="mt-1 text-xs text-slate-500">{stat.helper}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {programme.progress.map((skill) => (
                  <div key={skill.label}>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{skill.label}</span>
                      <span className="font-semibold text-slate-700">{skill.value}%</span>
                    </div>
                    <ProgressBar value={skill.value} />
                  </div>
                ))}
              </div>
              <div className="rounded-2xl bg-white/70 px-4 py-3 text-sm text-slate-600">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0b7ad7]">Current focus</span>
                <p className="mt-1">{programme.milestone}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="daily-updates" className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-900/8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Daily updates</h2>
            <p className="mt-1 text-sm text-slate-600">
              Switch between progress notes, homework timelines, and upcoming events.
            </p>
          </div>
          <div className="flex rounded-full bg-white/70 p-1 shadow-inner shadow-slate-900/5">
            {(["progress", "homework", "updates"] as ParentTab[]).map((tab) => {
              const selected = activeTab === tab;
              const label = tab === "progress" ? "Progress" : tab === "homework" ? "Homework" : "Updates";
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                    selected ? "bg-white text-[#0b7ad7] shadow" : "text-slate-500"
                  }`}
                  type="button"
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === "progress" && (
          <div className="mt-6 space-y-4 text-sm text-slate-600">
            {MONTHLY_HIGHLIGHTS.map((highlight) => (
              <div
                key={highlight}
                className="rounded-3xl border border-white/60 bg-white/75 px-5 py-4 text-slate-700 shadow-sm"
              >
                {highlight}
              </div>
            ))}
          </div>
        )}

        {activeTab === "homework" && (
          <div className="mt-6 space-y-4">
            {HOMEWORK_QUEUE.map((task) => (
              <article key={task.id} className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm">
                <header className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{task.title}</h3>
                    <p className="text-sm text-slate-600">{task.subject}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      task.status === "Completed"
                        ? "bg-[#dcfce7] text-[#047857]"
                        : task.status === "Uploaded"
                          ? "bg-[#e0e7ff] text-[#4338ca]"
                          : "bg-[#fee2b6] text-[#b45309]"
                    }`}
                  >
                    {task.status}
                  </span>
                </header>
                <p className="mt-3 text-sm text-slate-600">{task.date}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-white px-3 py-1 font-semibold text-[#0b7ad7]">{task.duration}</span>
                  <span>Coach · {task.coach}</span>
                </div>
              </article>
            ))}
          </div>
        )}

        {activeTab === "updates" && (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {UPCOMING_EVENTS.map((event) => (
              <article key={event.id} className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900">{event.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{event.timing}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-[#7c2d58]">Focus</p>
                <p className="mt-1 text-sm text-slate-600">{event.focus}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
