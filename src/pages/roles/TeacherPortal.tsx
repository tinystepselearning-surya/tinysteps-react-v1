import { useMemo, useState } from "react";
import { CURRICULUM, type CurriculumAreaId } from "../../data/curriculum";
import {
  SAMPLE_PROGRESS_DB,
  attachCurriculumToProgress,
  getStudentProgress,
  type ProgressEntry,
} from "../../data/progress-db";

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

const FEEDBACK_LIBRARY: Record<"phonics" | "grammar" | "speaking", string[]> = {
  phonics: [
    "Blended independently — continue home read-aloud.",
    "Needed prompts on middle sounds — reteach next session.",
    "Great expression while reading decodable text.",
  ],
  grammar: [
    "Applied the rule accurately in guided practice.",
    "Needs another pass on punctuation for questions.",
    "Excellent editing — ready for an extended draft.",
  ],
  speaking: [
    "Confident voice projection — practise pauses at home.",
    "Great storytelling structure — work on eye contact.",
    "Handled impromptu prompt well — add more descriptive words.",
  ],
};

export default function TeacherPortal() {
  const phonicsTrack = CURRICULUM.find((track) => track.id === "phonics");
  const grammarTrack = CURRICULUM.find((track) => track.id === "grammar");
  const speakingTrack = CURRICULUM.find((track) => track.id === "speaking");

  const skillLookup = useMemo(() => {
    const map = new Map<string, { levelTitle: string; unitTitle: string; skillTitle: string }>();
    CURRICULUM.forEach((track) => {
      track.levels.forEach((level) => {
        level.units.forEach((unit) => {
          unit.skills.forEach((skill) => {
            map.set(skill.id, {
              levelTitle: level.title,
              unitTitle: unit.title,
              skillTitle: skill.title,
            });
          });
        });
      });
    });
    return map;
  }, []);

  const teacherDb = attachCurriculumToProgress(SAMPLE_PROGRESS_DB, CURRICULUM);
  const kavyaProgress = getStudentProgress(teacherDb, "stu-phonics-kavya");

  const [searchTerm, setSearchTerm] = useState("");
  const [draftLogs, setDraftLogs] = useState<
    Record<string, { date: string; skillId: string; rating: string; note: string; saved?: boolean }>
  >({});

  const rosterByProgramme = useMemo(() => {
    const base = new Map<
      typeof teacherDb.progress[number]["programmeId"],
      Map<string, typeof teacherDb.progress[number]>
    >();

    teacherDb.progress.forEach((entry) => {
      if (!base.has(entry.programmeId)) {
        base.set(entry.programmeId, new Map());
      }
      const programmeMap = base.get(entry.programmeId)!;
      const existing = programmeMap.get(entry.studentId);
      if (!existing || existing.updatedAt < entry.updatedAt) {
        programmeMap.set(entry.studentId, entry);
      }
    });

    return new Map(
      Array.from(base.entries()).map(([programmeId, studentMap]) => [
        programmeId,
        Array.from(studentMap.values()).sort((a, b) => a.studentName.localeCompare(b.studentName)),
      ]),
    );
  }, [teacherDb.progress]);

  const filteredRosterEntries = useMemo<[CurriculumAreaId, ProgressEntry[]][]>(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return Array.from(rosterByProgramme.entries());
    }
    return Array.from(rosterByProgramme.entries())
      .map(([programmeId, students]) => {
        const filteredStudents = students.filter(
          (entry) =>
            entry.studentName.toLowerCase().includes(term) ||
            entry.admissionNumber.toLowerCase().includes(term),
        );
        return [programmeId, filteredStudents] as [CurriculumAreaId, ProgressEntry[]];
      })
      .filter(([, students]) => students.length > 0);
  }, [rosterByProgramme, searchTerm]);

  const skillOptionsByProgramme = useMemo(() => {
    const map = new Map<string, Array<{ value: string; label: string }>>();
    CURRICULUM.forEach((track) => {
      const options: Array<{ value: string; label: string }> = [];
      track.levels.forEach((level) => {
        level.units.forEach((unit) => {
          unit.skills.forEach((skill) => {
            options.push({
              value: skill.id,
              label: `${unit.title}: ${skill.title}`,
            });
          });
        });
      });
      map.set(track.id, options);
    });
    return map;
  }, []);

  const updateDraft = (studentId: string, patch: Partial<{ date: string; skillId: string; rating: string; note: string }>) => {
    setDraftLogs((prev) => {
      const prevDraft = prev[studentId] ?? { date: "", skillId: "", rating: "5", note: "" };
      return { ...prev, [studentId]: { ...prevDraft, ...patch, saved: false } };
    });
  };

  const markSaved = (studentId: string) => {
    setDraftLogs((prev) => {
      const prevDraft = prev[studentId];
      if (!prevDraft) return prev;
      return { ...prev, [studentId]: { ...prevDraft, saved: true } };
    });
  };

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

        <section className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Student roster preview</h2>
              <p className="mt-2 text-sm text-indigo-100">
                Ten students across phonics, grammar, and public speaking are listed here with their current mastery focus and next action.
              </p>
            </div>
            <label className="flex w-full max-w-sm items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-indigo-100">
              <span className="text-indigo-200">Search</span>
              <input
                value={searchTerm}
                onChange={(ev) => setSearchTerm(ev.target.value)}
                placeholder="Name or admission #"
                className="w-full bg-transparent text-white placeholder:text-indigo-200/60 focus:outline-none"
              />
            </label>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {filteredRosterEntries.length === 0 && (
              <p className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 text-sm text-indigo-100">
                No students match “{searchTerm}”. Try another name or admission number.
              </p>
            )}
            {filteredRosterEntries.map(([programmeId, students]) => {
              const track =
                programmeId === "phonics" ? phonicsTrack : programmeId === "grammar" ? grammarTrack : speakingTrack;
              const programmeName = track?.title ?? programmeId;
              return (
                <div key={programmeId} className="rounded-2xl border border-white/10 bg-white/[0.08] p-5 shadow-inner shadow-black/30">
                  <header className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-200">{programmeName}</p>
                      <p className="text-sm text-slate-200">{students.length} students</p>
                    </div>
                  </header>
                  <ul className="mt-4 space-y-3 max-h-80 overflow-y-auto pr-1">
                    {students.map((entry) => {
                      const meta = skillLookup.get(entry.skillId);
                      const draft = draftLogs[entry.studentId] ?? {
                        date: "",
                        skillId: entry.skillId,
                        rating: "5",
                        note: FEEDBACK_LIBRARY[entry.programmeId as "phonics" | "grammar" | "speaking"][0] ?? "",
                        saved: false,
                      };
                      const skillOptions =
                        skillOptionsByProgramme.get(entry.programmeId) ?? [
                          { value: entry.skillId, label: meta?.skillTitle ?? entry.skillId },
                        ];
                      const feedbackLibrary = FEEDBACK_LIBRARY[entry.programmeId as "phonics" | "grammar" | "speaking"] ?? [];
                      return (
                        <li key={entry.studentId} className="rounded-xl border border-white/10 bg-white/[0.12] p-4 space-y-3">
                          <p className="text-sm font-semibold text-white">
                            {entry.studentName}
                            <span className="ml-2 text-[11px] font-normal text-indigo-200">
                              #{entry.admissionNumber}
                            </span>
                          </p>
                          <p className="text-xs uppercase tracking-wide text-indigo-200">
                            {meta?.levelTitle ?? entry.levelId}
                          </p>
                          <p className="mt-1 text-xs text-slate-200">{meta?.skillTitle ?? entry.skillId}</p>
                          <div className="mt-2 flex items-center justify-between text-xs text-slate-300">
                            <span>Status: {entry.status}</span>
                            {entry.nextAction && <span>Next: {entry.nextAction}</span>}
                          </div>
                          <form
                            className="space-y-2 text-xs text-slate-200"
                            onSubmit={(ev) => {
                              ev.preventDefault();
                              if (!draft.date || !draft.skillId) {
                                alert("Pick a date and curriculum focus before saving.");
                                return;
                              }
                              markSaved(entry.studentId);
                            }}
                          >
                            <label className="flex flex-col gap-1">
                              <span>Date</span>
                              <input
                                type="date"
                                value={draft.date}
                                onChange={(ev) => updateDraft(entry.studentId, { date: ev.target.value })}
                                className="rounded-lg border border-white/10 bg-white/90 px-2 py-1 text-slate-900"
                              />
                            </label>
                            <label className="flex flex-col gap-1">
                              <span>Curriculum focus</span>
                              <select
                                value={draft.skillId}
                                onChange={(ev) => updateDraft(entry.studentId, { skillId: ev.target.value })}
                                className="rounded-lg border border-white/10 bg-white/90 px-2 py-1 text-slate-900"
                              >
                                <option value="">Select module</option>
                                {skillOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="flex flex-col gap-1">
                              <span>Rating (0-5 stars)</span>
                              <input
                                type="range"
                                min="0"
                                max="5"
                                value={draft.rating}
                                onChange={(ev) => updateDraft(entry.studentId, { rating: ev.target.value })}
                              />
                              <span>{draft.rating} ★</span>
                            </label>
                            <label className="flex flex-col gap-1">
                              <span>Feedback snippet</span>
                              <select
                                value={draft.note}
                                onChange={(ev) => updateDraft(entry.studentId, { note: ev.target.value })}
                                className="rounded-lg border border-white/10 bg-white/90 px-2 py-1 text-slate-900"
                              >
                                {feedbackLibrary.length === 0 ? (
                                  <option value="">Preset feedback coming soon</option>
                                ) : (
                                  feedbackLibrary.map((statement) => (
                                    <option key={statement} value={statement}>
                                      {statement}
                                    </option>
                                  ))
                                )}
                              </select>
                            </label>
                            <button
                              type="submit"
                              className="w-full rounded-full bg-indigo-500/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-indigo-400"
                            >
                              Save log
                            </button>
                            {draft.saved && (
                              <p className="text-[11px] uppercase tracking-wide text-emerald-300">Saved locally · synced soon</p>
                            )}
                          </form>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      </section>
    </div>
  );
}
