const SNAPSHOTS = [
  { label: "Active 1:1 families", value: "86", helper: "+4 this week" },
  { label: "Teacher sessions today", value: "48", helper: "Across phonics, grammar, speaking" },
  { label: "Parent touchpoints", value: "12", helper: "Updates queued for the day" },
];

const PIPELINE = [
  { stage: "Discovery booked", families: 12, notes: "Share call brief with assigned teacher" },
  { stage: "Trial completed", families: 7, notes: "Confirm fit & prepare fee proposal" },
  { stage: "Ready to enrol", families: 5, notes: "Issue contract + payment link" },
];

const COMMUNICATION = [
  {
    slot: "9:30 AM",
    parent: "Sneha Sharma",
    topic: "Grammar lab reschedule request",
    action: "Check teacher availability, confirm slot, update dashboard note",
  },
  {
    slot: "11:00 AM",
    parent: "Rahul Joshi",
    topic: "Speaking showcase prep call",
    action: "Share teacher feedback summary and upload video link",
  },
  {
    slot: "4:30 PM",
    parent: "Kavya’s dad",
    topic: "Phonics worksheet follow-up",
    action: "Send PDF pack + share class stars with parent",
  },
];

const TEACHER_SUMMARY = [
  { teacher: "Ananya", classes: 6, pay: "₹1,050", status: "Scheduled payout Fri" },
  { teacher: "Ravi", classes: 5, pay: "₹875", status: "Approved" },
  { teacher: "Fatima", classes: 4, pay: "₹700", status: "Awaiting attendance lock" },
];

const PARENT_FEES = [
  { family: "Rao", programme: "Phonics", balance: "₹1,050 due (3 classes remain)", type: "Installment" },
  { family: "Sharma", programme: "Grammar", balance: "₹2,100 credit (top-up)", type: "Advance" },
  { family: "Joshi", programme: "Speaking", balance: "₹1,400 credit · auto top-up 28 Oct", type: "Auto debit" },
];

export default function LearningManagerPortal() {
  return (
    <div className="bg-gradient-to-b from-[#0d1b2a] via-[#102941] to-[#061624] text-white">
      <section className="border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-sky-200">
            Learning manager view
          </p>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Coordinate teachers, parents, and payments—without logging in
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-sky-100">
            Teachers focus on one-to-one classes; parents connect only through you. Use this open dashboard to confirm
            reschedules, log feedback, and track fees while the new automations roll out.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {SNAPSHOTS.map((item) => (
            <div key={item.label} className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl shadow-black/30">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-200">{item.label}</p>
              <p className="mt-3 text-3xl font-black">{item.value}</p>
              <p className="mt-2 text-sm text-sky-100">{item.helper}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.3fr,1fr]">
          <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Family relationship flow</h2>
                <p className="text-sm text-sky-200">Stage updates feed the parent dashboards automatically.</p>
              </div>
              <span className="rounded-full bg-sky-500/20 px-3 py-1 text-xs font-semibold text-sky-100">Demo</span>
            </header>
            <div className="mt-6 space-y-4">
              {PIPELINE.map((item) => (
                <div key={item.stage} className="rounded-2xl border border-white/10 bg-white/[0.07] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-sky-100">{item.stage}</p>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                      {item.families} families
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-200">{item.notes}</p>
                </div>
              ))}
            </div>
          </article>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-sky-500/20 bg-sky-500/10 p-6">
              <h3 className="text-lg font-semibold text-white">Today&apos;s coordination</h3>
              <ul className="mt-4 space-y-3">
                {COMMUNICATION.map((item) => (
                  <li key={`${item.parent}-${item.slot}`} className="rounded-2xl border border-white/10 bg-white/[0.12] p-4">
                    <p className="text-sm font-semibold text-white">
                      {item.parent} · <span className="text-sky-200">{item.slot}</span>
                    </p>
                    <p className="mt-1 text-sm text-sky-100">{item.topic}</p>
                    <p className="mt-2 text-xs uppercase tracking-wide text-sky-200">{item.action}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold text-white">Teacher pay tracker</h3>
              <ul className="mt-4 space-y-3">
                {TEACHER_SUMMARY.map((row) => (
                  <li key={row.teacher} className="rounded-2xl border border-white/10 bg-white/[0.08] p-4">
                    <p className="text-sm font-semibold text-white">{row.teacher}</p>
                    <p className="mt-1 text-sm text-sky-100">{row.classes} classes · {row.pay}</p>
                    <p className="mt-2 text-xs uppercase tracking-wide text-sky-200">{row.status}</p>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.06] p-6">
          <h2 className="text-lg font-semibold text-white">Family fee overview</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {PARENT_FEES.map((family) => (
              <div key={family.family} className="rounded-2xl border border-white/10 bg-white/[0.08] p-4">
                <p className="text-sm font-semibold text-white">{family.family} family</p>
                <p className="mt-1 text-sm text-sky-100">{family.programme}</p>
                <p className="mt-3 text-lg font-bold text-white">{family.balance}</p>
                <p className="mt-2 text-xs uppercase tracking-wide text-sky-200">{family.type}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs uppercase tracking-wide text-slate-200">
            Learning Managers relay all balance updates to parents and teachers—no direct messaging.
          </p>
        </div>
      </section>
    </div>
  );
}
