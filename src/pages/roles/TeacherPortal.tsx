import { CURRICULUM } from "../../data/curriculum";
import { SAMPLE_PROGRESS_DB, attachCurriculumToProgress, getStudentProgress } from "../../data/progress-db";

const CLASSES = [
  {
    time: "3:00 PM",
    kid: "Kavya Rao",
    programme: "Phonics Foundations 1:1",
    focus: "Digraph blending · sh/ch",
    attendance: "Present",
    rating: 5,
    feedback: "Cracked the new digraph set—assign picture sort for homework.",
    progress: ["Completed reader: The Fish Shop", "+8% phonics mastery"],
  },
  {
    time: "4:15 PM",
    kid: "Aarav Sharma",
    programme: "Grammar Lab 1:1",
    focus: "Dialogue punctuation",
    attendance: "Present",
    rating: 4,
    feedback: "Understands dialogue tags; needs more pause practice.",
    progress: ["Uploaded draft II", "+6% writing rubric"],
  },
  {
    time: "6:00 PM",
    kid: "Riya Joshi",
    programme: "Public Speaking Studio 1:1",
    focus: "Showcase rehearsal",
    attendance: "Present",
    rating: 5,
    feedback: "Confident delivery; practise transitions before Sunday rehearsal.",
    progress: ["Video uploaded", "+5% confidence score"],
  },
];

const FOLLOW_UPS = [
  { student: "Kavya Rao", action: "Send reading log to Learning Manager for parent update" },
  { student: "Aarav Sharma", action: "Share rubric voice note via Learning Manager" },
  { student: "Riya Joshi", action: "Add showcase clip to portal and notify Learning Manager" },
];

const EARNINGS = {
  today: { classes: 3, amount: "₹525" },
  month: { classes: 36, amount: "₹6,300" },
  total: { classes: 108, amount: "₹18,900" },
  nextPayout: "28 Oct",
};

export default function TeacherPortal() {
  const phonicsTrack = CURRICULUM.find((track) => track.id === "phonics");
  const grammarTrack = CURRICULUM.find((track) => track.id === "grammar");
  const speakingTrack = CURRICULUM.find((track) => track.id === "speaking");

  const skillLookup = new Map<
    string,
    { levelTitle: string; unitTitle: string; skillTitle: string }
  >();

  CURRICULUM.forEach((track) => {
    track.levels.forEach((level) => {
      level.units.forEach((unit) => {
        unit.skills.forEach((skill) => {
          skillLookup.set(skill.id, {
            levelTitle: level.title,
            unitTitle: unit.title,
            skillTitle: skill.title,
          });
        });
      });
    });
  });

  const teacherDb = attachCurriculumToProgress(SAMPLE_PROGRESS_DB, CURRICULUM);
  const kavyaProgress = getStudentProgress(teacherDb, "stu-kavya");

  return (
    <div className="bg-slate-950 text-slate-100">
      <section className="border-b border-white/10 bg-gradient-to-br from-[#1d1b60] via-[#151137] to-[#0f172a]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-indigo-200">
            Teacher workspace preview
          </p>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl">
            One-to-one classes, updated in one place
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-300">
            Your class diary, daily feedback stars, and earnings snapshots are open for review while the new workflow goes
            live. Learning Managers remain the bridge for every parent message.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <article className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/30">
            <header className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Today&apos;s one-to-one classes</h2>
                <p className="text-sm text-indigo-200">Mark attendance, rate the session, and log curriculum wins.</p>
              </div>
              <span className="rounded-full bg-indigo-500/30 px-3 py-1 text-xs font-semibold text-indigo-200">
                Demo data
              </span>
            </header>
            <div className="mt-6 space-y-4">
              {CLASSES.map((session) => (
                <div
                  key={`${session.time}-${session.kid}`}
                  className="rounded-2xl border border-white/5 bg-white/[0.08] p-5 backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white/[0.12]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-slate-200">
                    <span>{session.kid}</span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-200">
                      {session.time}
                    </span>
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">{session.programme}</p>
                  <p className="mt-2 text-sm text-slate-300">Focus: {session.focus}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 font-semibold text-emerald-200">
                      Attendance · {session.attendance}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 font-semibold text-amber-200">
                      Rating · {"★".repeat(session.rating)}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-200">{session.feedback}</p>
                  <ul className="mt-3 space-y-1 text-xs text-indigo-100">
                    {session.progress.map((note) => (
                      <li key={note}>• {note}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </article>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-indigo-500/20 bg-indigo-500/10 p-6">
              <h3 className="text-lg font-semibold text-white">Quick attendance pulse</h3>
              <p className="mt-4 text-4xl font-black text-white">96%</p>
              <p className="mt-2 text-sm text-indigo-100">
                23/24 students present · one make-up flagged · export opens in Sheets soon.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold text-white">Earnings dashboard</h3>
              <div className="mt-4 grid gap-4 rounded-2xl bg-white/10 p-4 text-sm">
                <div className="flex items-center justify-between text-indigo-100">
                  <span>Today ({EARNINGS.today.classes} classes)</span>
                  <span className="font-semibold text-white">{EARNINGS.today.amount}</span>
                </div>
                <div className="flex items-center justify-between text-indigo-100">
                  <span>Month ({EARNINGS.month.classes} classes)</span>
                  <span className="font-semibold text-white">{EARNINGS.month.amount}</span>
                </div>
                <div className="flex items-center justify-between text-indigo-100">
                  <span>Till date ({EARNINGS.total.classes} classes)</span>
                  <span className="font-semibold text-white">{EARNINGS.total.amount}</span>
                </div>
              </div>
              <p className="mt-3 text-xs uppercase tracking-wide text-slate-300">
                Next payout · {EARNINGS.nextPayout} · Learning Manager will confirm.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold text-white">Follow-ups for the day</h3>
              <ul className="mt-4 space-y-3">
                {FOLLOW_UPS.map((item) => (
                  <li key={item.student} className="rounded-2xl border border-white/5 bg-white/[0.08] p-4">
                    <p className="text-sm font-semibold text-slate-200">{item.student}</p>
                    <p className="mt-1 text-sm text-slate-400">{item.action}</p>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-lg font-semibold text-white">What&apos;s coming next</h2>
          <p className="mt-3 text-sm text-slate-300">
            Daily class submissions will sync automatically with the parent dashboards and pay calculations. Until then, log
            each one-to-one session here and coordinate parent updates only through the Learning Manager.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold text-white">Curriculum blueprint</h2>
            <p className="mt-2 text-sm text-indigo-100">
              Plan your sequence confidently—each area moves from foundations to mastery inside one-to-one sessions.
            </p>
            <div className="mt-6 space-y-6">
              {[phonicsTrack, grammarTrack, speakingTrack]
                .filter(Boolean)
                .map((track) => (
                  <article key={track!.id} className="rounded-2xl border border-white/10 bg-white/[0.08] p-4">
                    <header className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-white">{track!.title}</h3>
                        <p className="text-xs text-sky-100">{track!.ageRange}</p>
                      </div>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-sky-100">
                        {track!.pathway.length} phases
                      </span>
                    </header>
                    <p className="mt-3 text-xs text-slate-200">{track!.focus}</p>
                    <ul className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-sky-100">
                      {track!.pathway.slice(0, 4).map((phase) => (
                        <li key={phase} className="rounded-full border border-white/10 px-3 py-1">
                          {phase}
                        </li>
                      ))}
                      {track!.pathway.length > 4 && (
                        <li className="rounded-full border border-white/10 px-3 py-1 text-sky-50">+{track!.pathway.length - 4} more</li>
                      )}
                    </ul>
                  </article>
                ))}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold text-white">Sample progress log (Kavya Rao)</h2>
            <p className="mt-2 text-sm text-indigo-100">
              Each entry stores mastery status, latest evidence, and the next action your Learning Manager shares with parents.
            </p>
            <div className="mt-5 space-y-4">
              {kavyaProgress.map((entry) => {
                const meta = skillLookup.get(entry.skillId);
                return (
                  <article key={entry.skillId} className="rounded-2xl border border-white/10 bg-white/[0.08] p-4">
                    <header className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-wide text-sky-200">
                      <span>{meta?.levelTitle ?? entry.levelId}</span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white">{entry.status}</span>
                    </header>
                    {meta?.unitTitle && (
                      <p className="mt-1 text-[11px] uppercase tracking-wide text-sky-100">{meta.unitTitle}</p>
                    )}
                    <p className="mt-2 text-sm font-semibold text-white">{meta?.skillTitle ?? entry.skillId}</p>
                    {entry.remarks && <p className="mt-2 text-xs text-slate-200">{entry.remarks}</p>}
                    {entry.lastEvidence && (
                      <p className="mt-3 text-[11px] text-sky-100">
                        Evidence: {entry.lastEvidence.type} · {entry.lastEvidence.loggedAt.slice(0, 10)}
                      </p>
                    )}
                    {entry.nextAction && (
                      <p className="mt-1 text-[11px] uppercase tracking-wide text-sky-200">Next action: {entry.nextAction}</p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
