import { useState } from "react";
import { Link } from "react-router-dom";

type DashboardCourse = {
  id: "phonics" | "grammar" | "speaking";
  name: string;
  summary: string;
  accent: { from: string; to: string; text: string; bg: string };
  quickStats: Array<{ label: string; value: string; helper?: string }>;
  progress: Array<{ label: string; value: number; description?: string }>;
  attendance: { percent: number; streak: string; helper: string };
  milestones: Array<{ status: "complete" | "active"; label: string; detail?: string }>;
  upcoming: Array<{ title: string; date: string; focus: string }>;
  dayFeedback: { rating: number; summary: string; notes: string };
  feeStatus: { badge: "Due soon" | "On track" | "Credit"; amount: string; detail: string };
};

const DASHBOARD: DashboardCourse[] = [
  {
    id: "phonics",
    name: "Phonics Foundations",
    summary:
      "Systematic phonics that takes children from letter-sound mastery to expressive, confident reading with daily home practice nudges.",
    accent: { from: "#ff9a5c", to: "#f97316", text: "#9a3412", bg: "#fff6f0" },
    quickStats: [
      { label: "Sound Mastery", value: "92%", helper: "Completed 24/26 focus sounds" },
      { label: "Blending Fluency", value: "4.6/5", helper: "Reads CVC words in 24s" },
      { label: "Practice Consistency", value: "5 days", helper: "Weekly home activity streak" },
    ],
    progress: [
      { label: "SATPIN + next sets", value: 95, description: "Solid decoding accuracy" },
      { label: "Digraph discovery", value: 72, description: "sh, ch, th introduced" },
      { label: "Story retell", value: 80, description: "Sequencing with prompts" },
    ],
    attendance: {
      percent: 96,
      streak: "8 classes on-time",
      helper: "One make-up session scheduled next week",
    },
    dayFeedback: {
      rating: 5,
      summary: "Coach note: Kavya mastered the sh/ch digraphs today.",
      notes: "Please use picture sort pack shared on WhatsApp by your Learning Manager.",
    },
    feeStatus: {
      badge: "Due soon",
      amount: "₹1,050 due (3 classes left)",
      detail: "Learning Manager will confirm the top-up reminder on Thursday.",
    },
    milestones: [
      { status: "complete", label: "Reads consonant blends smoothly" },
      { status: "complete", label: "Spots silent-e patterns independently" },
      { status: "active", label: "Expressive reading with punctuation cues", detail: "Coach feedback: practise voice modulation" },
    ],
    upcoming: [
      { title: "Blending games circle", date: "Tue · 5:00 PM (online)", focus: "Reinforce digraph decoding" },
      { title: "Library read-aloud upload", date: "Fri · 7:00 PM (home task)", focus: "Share favourite page recording" },
    ],
  },
  {
    id: "grammar",
    name: "Grammar & Writing Lab",
    summary:
      "Sentence craft, punctuation practice, and creative writing labs that turn young writers into confident communicators.",
    accent: { from: "#7dd3fc", to: "#0ea5e9", text: "#0c4a6e", bg: "#f0f9ff" },
    quickStats: [
      { label: "Grammar Accuracy", value: "87%", helper: "Last 5 submissions" },
      { label: "Draft Feedback", value: "4 notes", helper: "Teacher voice notes this week" },
      { label: "Writing Portfolio", value: "12 pieces", helper: "Stories, reports & poems" },
    ],
    progress: [
      { label: "Sentence expansion", value: 84, description: "Uses vivid adjectives" },
      { label: "Punctuation mastery", value: 68, description: "Practising commas & dialogue" },
      { label: "Editing skills", value: 76, description: "Self-edits with rubric" },
    ],
    attendance: {
      percent: 94,
      streak: "6 classes on-time",
      helper: "Project day swap approved for next week",
    },
    dayFeedback: {
      rating: 4,
      summary: "Teacher note: Aarav edited dialogue tags accurately.",
      notes: "Revision worksheet emailed to you—Learning Manager will check in on Friday.",
    },
    feeStatus: {
      badge: "On track",
      amount: "₹2,100 credit (6 classes prepaid)",
      detail: "We will alert you when balance reaches two classes.",
    },
    milestones: [
      { status: "complete", label: "Labels parts of speech in context" },
      { status: "complete", label: "Publishes a descriptive paragraph with feedback applied" },
      { status: "active", label: "Writes persuasive letter draft #1", detail: "Draft ready for teacher comments" },
    ],
    upcoming: [
      { title: "Grammar lab—dialogue writing", date: "Wed · 6:30 PM (studio)", focus: "Punctuating speech" },
      { title: "Portfolio review call", date: "Sat · 4:00 PM (virtual)", focus: "Share rubric insights" },
    ],
  },
  {
    id: "speaking",
    name: "Public Speaking Studio",
    summary:
      "Structured storytelling, vocal training, and stage etiquette that nurture confident presenters ready for any audience.",
    accent: { from: "#a5b4fc", to: "#6366f1", text: "#312e81", bg: "#eef2ff" },
    quickStats: [
      { label: "Confidence Score", value: "4.8/5", helper: "Self & coach rating" },
      { label: "Stage Presence", value: "91%", helper: "Eye contact • Posture" },
      { label: "Video Library", value: "9 clips", helper: "Feedback tagged recordings" },
    ],
    progress: [
      { label: "Voice modulation", value: 78, description: "Practising power + pauses" },
      { label: "Story structure", value: 88, description: "Uses hook-body-close" },
      { label: "Audience Q&A", value: 65, description: "Building spontaneous replies" },
    ],
    attendance: {
      percent: 98,
      streak: "10 classes on-time",
      helper: "Invited to monthly showcase",
    },
    dayFeedback: {
      rating: 5,
      summary: "Coach note: Riya’s voice projection improved in rehearsal.",
      notes: "Watch the uploaded clip—Learning Manager will share the showcase timeline.",
    },
    feeStatus: {
      badge: "Credit",
      amount: "₹1,400 credit · auto top-up 28 Oct",
      detail: "Advance balance covers the next 4 classes.",
    },
    milestones: [
      { status: "complete", label: "Delivers 3-minute keynote with gestures" },
      { status: "complete", label: "Uploads self-reflection after each speech" },
      { status: "active", label: "Handles panel questions confidently", detail: "Coach tip: practise bridging statements" },
    ],
    upcoming: [
      { title: "Confidence circle—debate", date: "Thu · 7:30 PM (online)", focus: "Quick rebuttal rounds" },
      { title: "Showcase evening rehearsal", date: "Sun · 11:00 AM (studio)", focus: "Stage blocking & mic cues" },
    ],
  },
];

const PROGRAMMES = [
  {
    title: "Phonics Foundations",
    description: "Systematic phonics that moves from letter-sound mastery to blending and expressive reading.",
    cta: "Book Phonics Demo",
    href: "/main/courses/phonics/",
  },
  {
    title: "Grammar & Writing Lab",
    description: "Sentence craft, punctuation practice, and creative writing workshops for budding authors.",
    cta: "Schedule Grammar Trial",
    href: "/main/courses/grammar/",
  },
  {
    title: "Public Speaking Studio",
    description: "Structured storytelling, vocal training, and stage etiquette that boost presentation confidence.",
    cta: "Reserve Speaking Session",
    href: "/main/courses/public-speaking/",
  },
];

const WHY_POINTS = [
  {
    title: "Personalised journeys",
    description:
      "Initial diagnostics help us place your child on the right level. Weekly feedback loops keep you informed about wins and focus areas.",
  },
  {
    title: "Outcome-first teaching",
    description:
      "Our teachers align every session to measurable outcomes—reading fluency, writing accuracy, or confident presentation—so you know what improves.",
  },
  {
    title: "Flexible schedules",
    description:
      "Choose after-school or weekend slots. One-to-one sessions run 35 minutes and recordings are shared for quick catch-up.",
  },
  {
    title: "Guidance for every step",
    description:
      "You receive curated practice packs, WhatsApp nudges, and termly review calls to keep momentum going at home.",
  },
];

const ENROLMENT_STEPS = [
  {
    title: "1. Book a free programme demo",
    detail: "Meet the teacher, experience a mini lesson, and confirm the right level.",
  },
  {
    title: "2. Receive personalised roadmap",
    detail: "We send a written plan with goals, schedule options, and transparent pricing.",
  },
  {
    title: "3. Complete enrolment online",
    detail: "Secure payment link, digital receipts, and instant parent portal access.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Within a month of joining, Kavya started blending sounds on her own. The weekly notes helped us practise exactly what she learnt in class.",
    name: "Anita Rao",
    meta: "Bengaluru · Kavya, Grade 1",
  },
  {
    quote:
      "The grammar roadmap gave us clarity on milestones. Aarav’s teacher keeps us in the loop after every project, so we know exactly where he shines and where to support.",
    name: "Rahul & Sneha Sharma",
    meta: "Pune · Aarav, Grade 4",
  },
  {
    quote:
      "Riya went from whispering her speeches to presenting confidently in two terms. The speaking rubrics and videos on the portal make progress visible.",
    name: "Meera Joshi",
    meta: "Mumbai · Riya, Grade 5",
  },
];

export default function Parents() {
  const [active, setActive] = useState<DashboardCourse>(DASHBOARD[0]);

  return (
    <div className="bg-white text-gray-900">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#fff3ea] via-white to-[#ffe6d4]">
        <div className="absolute inset-0 opacity-10 mix-blend-multiply bg-[radial-gradient(circle_at_top,_rgba(255,237,213,0.9),_rgba(255,124,47,0.45))]" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 py-24 text-center md:py-32">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#fca76d] bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-[#d94b03]">
            Parents
          </p>
          <h1 className="text-4xl font-black tracking-tight text-[#d94b03] sm:text-5xl">
            Free Resources for Parents
          </h1>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-700 sm:text-xl">
            Discover research-backed programmes that grow reading, writing, and speaking confidence—then keep an eye on
            progress with dashboards, snapshots, and milestone timelines while we continue building the portal. Learning Managers
            coordinate every teacher-parent check-in so your updates stay clear and timely.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="#programmes"
              className="rounded-full bg-[#ff7c2f] px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-white shadow-lg shadow-[#ff8a4c]/30 transition hover:-translate-y-0.5"
            >
              Explore Programmes
            </a>
            <a
              href="/main/book-demo/"
              className="rounded-full border border-[#ff7c2f33] px-6 py-3 text-sm font-semibold text-[#d94b03] transition hover:border-[#ff7c2f] hover:bg-[#fff6ef]"
            >
              Book a Free Demo
            </a>
          </div>
        </div>
      </section>

      {/* Why choose */}
      <section className="bg-white py-20" id="promise">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-[#0f172a] sm:text-4xl">Why parents choose Tiny Steps</h2>
            <p className="mt-4 text-lg text-gray-600">
              Lessons are designed by educators, powered by data, and delivered with warmth—so you see real progress at
              home and in school.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {WHY_POINTS.map((point) => (
              <article
                key={point.title}
                className="rounded-3xl border border-gray-100 bg-[#fafafa] p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <h3 className="text-xl font-semibold text-[#d94b03]">{point.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-gray-600">{point.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Programmes */}
      <section className="bg-[#fef6f1] py-20" id="programmes">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-[#0f172a] sm:text-4xl">Programmes open for enrolment</h2>
            <p className="mt-4 text-lg text-gray-600">
              Explore the curriculum, schedules, and outcomes before you book a free demo. We keep value and student progress
              transparent so you can enrol with confidence.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PROGRAMMES.map((programme) => (
              <article
                key={programme.title}
                className="flex h-full flex-col rounded-3xl border border-[#ffd8bd] bg-white p-8 shadow-md shadow-[#ffede0]/60"
              >
                <h3 className="text-2xl font-semibold text-[#d94b03]">{programme.title}</h3>
                <p className="mt-3 flex-1 text-base leading-relaxed text-gray-600">{programme.description}</p>
                <a
                  href={programme.href}
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-[#ff7c2f] px-5 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-md transition hover:-translate-y-0.5"
                >
                  {programme.cta}
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboards */}
      <section className="bg-white py-24" id="dashboards">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold text-[#0f172a] sm:text-4xl">Sample dashboards parents will see</h2>
              <p className="mt-4 text-lg text-gray-600">
                These mockups preview the curriculum progress, attendance history, and milestone trackers we are building.
                Every course shows quick stats, detailed mastery bars, and what is coming up next for your child.
              </p>
            </div>
            <div className="inline-flex shrink-0 rounded-full border border-gray-200 bg-white p-2">
              {DASHBOARD.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => setActive(course)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    active.id === course.id
                      ? "bg-[#ff7c2f] text-white shadow-[0_8px_18px_-12px_rgba(240,112,24,1)]"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                  aria-pressed={active.id === course.id}
                >
                  {course.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-[3fr,2fr]">
            <div className="relative overflow-hidden rounded-[32px] border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/40">
              <div
                className="absolute inset-x-0 top-0 h-2"
                style={{ backgroundImage: `linear-gradient(90deg, ${active.accent.from}, ${active.accent.to})` }}
                aria-hidden="true"
              />
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.28em]" style={{ color: active.accent.text }}>
                    {active.name}
                  </p>
                  <p className="mt-3 text-base text-gray-600">{active.summary}</p>
                </div>

                <div className="grid gap-4 rounded-3xl bg-gray-50/70 p-5 sm:grid-cols-3">
                  {active.quickStats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl bg-white/70 p-4 text-center shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{stat.label}</p>
                      <p className="mt-2 text-2xl font-black text-[#0f172a]">{stat.value}</p>
                      {stat.helper && <p className="mt-1 text-xs text-gray-500">{stat.helper}</p>}
                    </div>
                  ))}
                </div>

                <div className="space-y-5">
                  <h3 className="text-lg font-semibold text-[#0f172a]">Curriculum progress</h3>
                  <div className="space-y-4">
                    {active.progress.map((metric) => (
                      <div key={metric.label}>
                        <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
                          <span>{metric.label}</span>
                          <span>{metric.value}%</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${metric.value}%`,
                              backgroundImage: `linear-gradient(90deg, ${active.accent.from}, ${active.accent.to})`,
                            }}
                          />
                        </div>
                        {metric.description && (
                          <p className="mt-1 text-xs text-gray-500">{metric.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#0f172a]">Milestones</h3>
                  <ul className="space-y-3">
                    {active.milestones.map((milestone) => (
                      <li
                        key={milestone.label}
                        className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-[#fafafa] p-4"
                      >
                        <span
                          className={`mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            milestone.status === "complete"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {milestone.status === "complete" ? "✓" : "•"}
                        </span>
                        <div className="text-sm text-gray-700">
                          <p className="font-semibold text-[#0f172a]">{milestone.label}</p>
                          {milestone.detail && <p className="mt-1 text-xs text-gray-500">{milestone.detail}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div
                className="rounded-[28px] border border-gray-100 p-6 shadow-lg"
                style={{ backgroundColor: active.accent.bg }}
              >
                <h3 className="text-lg font-semibold text-[#0f172a]">Attendance snapshot</h3>
                <p className="mt-4 text-4xl font-black text-[#0f172a]">{active.attendance.percent}%</p>
                <p className="mt-1 text-sm font-semibold text-gray-600">{active.attendance.streak}</p>
                <p className="mt-2 text-sm text-gray-600">{active.attendance.helper}</p>
              </div>

              <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-[#0f172a]">Up next</h3>
                <ul className="mt-4 space-y-4">
                  {active.upcoming.map((item) => (
                    <li key={item.title} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-sm font-semibold text-[#0f172a]">{item.title}</p>
                      <p className="mt-1 text-xs text-gray-500 uppercase tracking-wide">{item.date}</p>
                      <p className="mt-2 text-sm text-gray-600">{item.focus}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-[#0f172a]">Today&apos;s class recap</h3>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#fff6ef] px-3 py-1 text-xs font-semibold text-[#d94b03]">
                  {"★".repeat(active.dayFeedback.rating)} rating
                </div>
                <p className="mt-3 text-sm font-semibold text-[#0f172a]">{active.dayFeedback.summary}</p>
                <p className="mt-2 text-sm text-gray-600">{active.dayFeedback.notes}</p>
                <p className="mt-4 text-xs uppercase tracking-wide text-gray-500">
                  Shared by your Learning Manager after the teacher logs the session.
                </p>
              </div>

              <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-[#0f172a]">Fees & credits</h3>
                <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-gray-900/5 px-3 py-1 text-xs font-semibold text-gray-700">
                  {active.feeStatus.badge}
                </span>
                <p className="mt-3 text-2xl font-black text-[#0f172a]">{active.feeStatus.amount}</p>
                <p className="mt-2 text-sm text-gray-600">{active.feeStatus.detail}</p>
                <p className="mt-4 text-xs uppercase tracking-wide text-gray-500">
                  Learning Manager handles all payment nudges—reply to their message for clarifications.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enrolment steps */}
      <section className="bg-[#0f172a] py-24 text-white" id="enrolment">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold sm:text-4xl">How enrolment works</h2>
            <p className="mt-4 text-lg text-slate-300">
              From discovery call to first class, the experience stays transparent and parent-friendly.
            </p>
          </div>
          <ul className="mt-12 grid gap-6 md:grid-cols-3">
            {ENROLMENT_STEPS.map((step) => (
              <li key={step.title} className="rounded-3xl bg-white/5 p-8">
                <p className="text-xl font-semibold text-white">{step.title}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{step.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-[#f7f3ff] py-24" id="testimonials">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-[#0f172a] sm:text-4xl">What parents are saying</h2>
            <p className="mt-4 text-lg text-gray-600">
              Families across India trust Tiny Steps to make literacy joyful. Hear how our teachers, routines, and parent
              updates build lasting confidence.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((item) => (
              <article key={item.name} className="flex h-full flex-col rounded-3xl bg-white p-8 shadow-lg shadow-[#d4d2ff]/50">
                <p className="text-lg font-semibold text-[#0f172a] leading-relaxed">“{item.quote}”</p>
                <div className="mt-6 border-t border-gray-100 pt-4 text-sm text-gray-600">
                  <p className="font-semibold text-[#0f172a]">{item.name}</p>
                  <p>{item.meta}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Support */}
      <section className="bg-white py-24" id="support">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-[#0f172a] sm:text-4xl">Support that continues after sign-up</h2>
            <p className="mt-4 text-lg text-gray-600">
              Stay updated through progress snapshots, monthly learning tips, and anytime messaging. We are building the unified
              parent portal in the open—no passwords required while development is underway.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <article className="rounded-3xl border border-gray-100 bg-[#f8fafc] p-8">
              <h3 className="text-xl font-semibold text-[#0f172a]">Progress snapshots</h3>
              <p className="mt-3 text-base leading-relaxed text-gray-600">
                Track attendance, mastered skills, and upcoming goals from the sample dashboards above. We will keep improving
                the experience with your feedback.
              </p>
            </article>
            <article className="rounded-3xl border border-gray-100 bg-[#fff7ed] p-8">
              <h3 className="text-xl font-semibold text-[#0f172a]">Home practice toolkit</h3>
              <p className="mt-3 text-base leading-relaxed text-gray-600">
                Downloadable worksheets, reading lists, and speaking prompts are shared weekly after class, so parents can keep
                momentum going between sessions.
              </p>
            </article>
          </div>
          <div className="mt-16 flex flex-col items-center rounded-3xl border border-dashed border-[#ff7c2f] bg-[#fff7f0] p-10 text-center">
            <span className="rounded-full bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-[#d94b03]">
              Next steps
            </span>
            <p className="mt-4 max-w-xl text-lg text-gray-600">
              Already enrolled? Access stays open—just pick the dashboard you need. Have a question about schedules or adding a
              sibling? Your learning manager is a message away.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                href="/main/book-demo/"
                className="rounded-full bg-[#ff7c2f] px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-white shadow-md transition hover:-translate-y-0.5"
              >
                Book a Trial Call
              </a>
              <Link
                to="/roles/rm"
                className="rounded-full border border-[#ff7c2f33] px-6 py-3 text-sm font-semibold text-[#d94b03] transition hover:border-[#ff7c2f] hover:bg-[#fff6ef]"
              >
                Meet a Learning Manager
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
