import { Link, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

type GuestRole = "kids" | "parents";

const GUEST_CONFIG: Record<GuestRole, { title: string; blurb: string; highlights: string[]; upgrade: string }> = {
  kids: {
    title: "Kids Guest Hub",
    blurb:
      "Play a rotating set of free Tiny Steps games and story starters. Log in later to save your favourites and unlock premium adventures.",
    highlights: [
      "Daily trio of phonics and vocabulary mini-games",
      "Read-along story excerpts and colouring downloads",
      "Pronunciation warm-up videos picked by Tiny Steps coaches",
    ],
    upgrade: "/login/kids",
  },
  parents: {
    title: "Parent Guest Preview",
    blurb:
      "Explore an open dashboard sample before enrolling. You’ll see how we share progress snapshots, homework nudges, and schedule reminders.",
    highlights: [
      "Sample class report with feedback stars and next steps",
      "Printable worksheet pack (Level 1 Phonics)",
      "Weekly learning goals checklist to try at home",
    ],
    upgrade: "/login/parents",
  },
};

export default function GuestPortalPage() {
  const params = useParams<{ role: GuestRole }>();
  const role = params.role ?? "parents";
  const config = GUEST_CONFIG[role] ?? GUEST_CONFIG.parents;
  const { user, role: userRole } = useAuth();

  // If user is logged in, redirect them to their actual dashboard
  if (user && userRole) {
    const dashboardRoutes: Record<string, string> = {
      admin: "/surya/dashboard",
      "learning-partner": "/rm/dashboard",
      teacher: "/teacher/dashboard",
      parent: "/parent/dashboard",
      student: "/kids/home",
    };
    
    const redirectTo = dashboardRoutes[userRole] || "/parent/dashboard";
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#fff7ed] to-[#f1f5f9]">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-[#2563eb] shadow-sm shadow-[#2563eb]/10 hover:-translate-y-0.5"
          >
            ← Back to Tiny Steps
          </Link>
          <Link
            to={config.upgrade}
            className="inline-flex items-center rounded-full bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] px-5 py-2 text-sm font-semibold text-white shadow-md shadow-[#2563eb]/20 hover:-translate-y-0.5"
          >
            Sign in for premium access
          </Link>
        </div>

        <header className="mt-10 rounded-3xl border border-white/70 bg-white/90 p-8 shadow-lg shadow-slate-900/5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2563eb]/70">Guest access</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">{config.title}</h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">{config.blurb}</p>
        </header>

        <section className="mt-10 grid gap-6 sm:grid-cols-2">
          {config.highlights.map((item) => (
            <article key={item} className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm shadow-slate-900/5">
              <h2 className="text-base font-semibold text-[#1f2937]">Free preview</h2>
              <p className="mt-2 text-sm text-slate-600">{item}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-3xl border border-dashed border-[#2563eb]/40 bg-[#eff6ff] p-6 text-sm text-[#1d4ed8]">
          <h3 className="text-base font-semibold">Upgrade when you’re ready</h3>
          <p className="mt-2">
            Enjoy these resources as often as you like. When you’re ready for the full Tiny Steps experience—live classes,
            progress dashboards, and coach feedback—sign in or create an account from the button above.
          </p>
        </section>
      </div>
    </div>
  );
}
