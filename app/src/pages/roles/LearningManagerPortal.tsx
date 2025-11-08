import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardShell from "../../components/dashboard/DashboardShell";
import { buildNavItems } from "../../components/dashboard/navItems";
import { useAuth } from "../../contexts/AuthContext";

type OperationsTab = "pipeline" | "teachers" | "parents";

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
  { family: "Rao", programme: "Phonics", balance: "₹1,050 due · 3 classes remain", type: "Installment" },
  { family: "Sharma", programme: "Grammar", balance: "₹2,100 credit · top-up", type: "Advance" },
  { family: "Joshi", programme: "Speaking", balance: "₹1,400 credit · auto debit 28 Oct", type: "Auto debit" },
];

const CHECKLIST = [
  { title: "Send phonics reading log to Rao family", owner: "Learning Partner" },
  { title: "Confirm showcase rehearsal logistics", owner: "Teacher · Riya", highlight: true },
  { title: "Share fee reminder draft with finance", owner: "Learning Partner" },
];

export default function LearningManagerPortal() {
  const navigate = useNavigate();
  const { user, role, loading, signOut } = useAuth();

  console.log('[LearningManagerPortal] User:', user?.email, 'Role:', role, 'Loading:', loading);

  useEffect(() => {
    if (loading) return; // Wait for auth to load

    if (!user) {
      navigate("/login/learning-managers", { replace: true });
      return;
    }

    // Allow access for learning-partner role or admin (for testing)
    if (role !== "learning-partner" && role !== "admin") {
      console.log('[LearningManagerPortal] Access denied for role:', role);
      navigate("/login/learning-managers", { replace: true });
    }
  }, [navigate, user, role, loading]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authorized, don't render anything (useEffect will redirect)
  if (!user || (role !== "learning-partner" && role !== "admin")) {
    return null;
  }

  const [activeTab, setActiveTab] = useState<OperationsTab>("pipeline");

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
      buildNavItems("groups", {
        includeKeys: ["groups", "homework", "payouts"],
        overrides: {
          groups: {
            label: "Learning partner hub",
            badge: `${SNAPSHOTS[1].value}`,
            onSelect: scrollToId("operations-board"),
          },
          homework: {
            label: "Daily checklist",
            badge: `${COMMUNICATION.length}`,
            onSelect: scrollToId("daily-checklist"),
          },
          payouts: {
            label: "Fee overview",
            onSelect: scrollToId("family-fee"),
          },
        },
      }),
    [scrollToId],
  );

  const headerToolbar = (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <button className="inline-flex items-center justify-center rounded-full border border-[#0b7ad7]/20 bg-white px-4 py-2 text-sm font-semibold text-[#0b7ad7] shadow-sm shadow-[#0b7ad7]/10 transition hover:bg-[#0b7ad7]/10">
        Export daily sheet
      </button>
      <button className="inline-flex items-center justify-center rounded-full bg-[#0b7ad7] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#0b7ad7]/30 transition hover:bg-[#0b6ac0]">
        Create parent update
      </button>
      <button
        onClick={signOut}
        className="inline-flex items-center justify-center rounded-full border border-red-500/20 bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm shadow-red-500/10 transition hover:bg-red-50"
      >
        Sign Out
      </button>
    </div>
  );

  const rightRail = (
    <>
      <section className="rounded-3xl border border-[#0b7ad7]/10 bg-white p-6 shadow-xl shadow-slate-900/8">
        <h2 className="text-base font-semibold text-slate-900">Today&apos;s snapshot</h2>
        <div className="mt-4 space-y-3">
          {SNAPSHOTS.map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0b7ad7]">{item.label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{item.value}</p>
              <p className="mt-1 text-xs text-slate-600">{item.helper}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[#0b7ad7]/10 bg-white p-6 shadow-xl shadow-slate-900/8">
        <h2 className="text-base font-semibold text-slate-900">Fee alerts</h2>
        <div className="mt-4 space-y-3">
          {PARENT_FEES.map((family) => (
            <div key={family.family} className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">{family.family} family</p>
              <p className="text-xs uppercase tracking-[0.22em] text-[#0b7ad7]">{family.programme}</p>
              <p className="mt-2 text-sm text-slate-600">{family.balance}</p>
              <p className="mt-1 text-xs text-slate-500">{family.type}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );

  return (
    <DashboardShell
      navItems={navItems}
      header={{
        title: "Learning partner control room",
        subtitle:
          "Coordinate teachers, parents, and payments without switching tools. Draft updates and confirm reschedules in seconds.",
        toolbar: headerToolbar,
      }}
      rightRail={rightRail}
    >
      <section id="operations-board" className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-900/8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Operations board</h2>
            <p className="mt-1 text-sm text-slate-600">
              Switch between family pipeline, teacher payouts, and parent communication.
            </p>
          </div>
          <div className="flex rounded-full bg-white/70 p-1 shadow-inner shadow-slate-900/5">
            {(["pipeline", "teachers", "parents"] as OperationsTab[]).map((tab) => {
              const label = tab === "pipeline" ? "Family pipeline" : tab === "teachers" ? "Teacher payouts" : "Parent calls";
              const selected = activeTab === tab;
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

        {activeTab === "pipeline" && (
          <div className="mt-6 space-y-4">
            {PIPELINE.map((item) => (
              <article key={item.stage} className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-lg font-semibold text-slate-900">{item.stage}</p>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#0b7ad7]">
                    {item.families} families
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600">{item.notes}</p>
              </article>
            ))}
          </div>
        )}

        {activeTab === "teachers" && (
          <div className="mt-6 space-y-4">
            {TEACHER_SUMMARY.map((row) => (
              <article key={row.teacher} className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{row.teacher}</p>
                    <p className="text-sm text-slate-600">{row.classes} classes today</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#0b7ad7]">
                    {row.pay}
                  </span>
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.22em] text-[#0b7ad7]">{row.status}</p>
              </article>
            ))}
          </div>
        )}

        {activeTab === "parents" && (
          <div className="mt-6 space-y-4">
            {COMMUNICATION.map((item) => (
              <article key={`${item.parent}-${item.slot}`} className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-lg font-semibold text-slate-900">{item.parent}</p>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#0b7ad7]">{item.slot}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{item.topic}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.22em] text-[#0b7ad7]">{item.action}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="family-fee" className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-900/8">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Family fee overview</h2>
            <p className="mt-1 text-sm text-slate-600">
              Track balances before nightly parent updates go out.
            </p>
          </div>
          <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-100">
            Download CSV
          </button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {PARENT_FEES.map((family) => (
            <article key={family.family} className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm">
              <p className="text-lg font-semibold text-slate-900">{family.family} family</p>
              <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[#0b7ad7]">{family.programme}</p>
              <p className="mt-3 text-sm text-slate-600">{family.balance}</p>
              <p className="mt-2 text-xs text-slate-500">{family.type}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="daily-checklist" className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-900/8">
        <h2 className="text-xl font-semibold text-slate-900">Daily checklist</h2>
        <p className="mt-1 text-sm text-slate-600">
          Confirm these items before the evening parent digest.
        </p>
        <div className="mt-6 space-y-3">
          {CHECKLIST.map((item) => (
            <div
              key={item.title}
              className={`rounded-3xl border border-white/60 px-5 py-4 text-sm text-slate-600 ${
                item.highlight ? "bg-[#e0f2fe]" : "bg-white/80"
              }`}
            >
              <p className="font-semibold text-slate-900">{item.title}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[#0b7ad7]">{item.owner}</p>
            </div>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
