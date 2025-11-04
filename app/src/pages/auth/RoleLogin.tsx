import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";

type RoleKey = "kids" | "parents" | "teachers" | "learning-managers";

type RoleConfig = {
  title: string;
  subtitle: string;
  cta: string;
  helper: string;
  benefits: string[];
  guestLink?: { label: string; to: string };
};

const ROLE_CONFIG: Record<RoleKey, RoleConfig> = {
  kids: {
    title: "Tiny Steps Kids Login",
    subtitle: "Log in to unlock personalised games, saved worksheets, and progress stars.",
    cta: "Sign in to play",
    helper: "Use the credentials shared by your parent or coach",
    benefits: [
      "Access premium Story Studio and pronunciation labs",
      "Save your favourite practice games",
      "See the stars you earned in class this week",
    ],
    guestLink: { label: "Continue as guest", to: "/kids" },
  },
  parents: {
    title: "Tiny Steps Parent Login",
    subtitle:
      "Sign in to track class reports, download homework packs, and message your Learning Manager.",
    cta: "Sign in to view dashboard",
    helper: "Use the email address you registered with Tiny Steps Learning",
    benefits: [
      "View daily session summaries and feedback stars",
      "Download premium worksheets and voice-note recaps",
      "Manage payments and upcoming schedule",
    ],
    guestLink: { label: "Browse as guest", to: "/guest/parents" },
  },
  teachers: {
    title: "Tiny Steps Teacher Login",
    subtitle: "Access your class schedule, progress logs, and curated lesson resources.",
    cta: "Sign in to teaching suite",
    helper: "Only authorised Tiny Steps teachers can sign in here",
    benefits: [
      "Mark attendance and rate sessions in one place",
      "Upload voice notes and worksheet assignments",
      "Track payouts and follow-up actions for the day",
    ],
  },
  "learning-managers": {
    title: "Learning Manager Login",
    subtitle: "Coordinate families, teachers, and payments from your control room.",
    cta: "Sign in to control room",
    helper: "Learning Managers receive their credentials from Tiny Steps admin",
    benefits: [
      "Manage family pipelines and parent touchpoints",
      "Approve payouts and lesson changes",
      "Send branded reports and reminders in minutes",
    ],
  },
};

const TARGET_ROUTES: Record<RoleKey, string> = {
  kids: "/roles/kids",
  parents: "/parents",
  teachers: "/roles/teacher",
  "learning-managers": "/roles/rm",
};

export default function RoleLoginPage() {
  const params = useParams<{ role: RoleKey }>();
  const role = params.role as RoleKey | undefined;
  const config = role ? ROLE_CONFIG[role] : undefined;
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const navigate = useNavigate();

  const headline = useMemo(() => {
    if (!config) return "";
    return config.title;
  }, [config]);

  if (!config) {
    return <Navigate to="/login/parents" replace />;
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setTimeout(() => {
      if (typeof window !== "undefined" && role) {
        window.sessionStorage.setItem("tinysteps-role", role);
      }
      setStatus("success");
      const redirectTo = role ? TARGET_ROUTES[role] : TARGET_ROUTES.parents;
      setTimeout(() => {
        setStatus("idle");
        navigate(redirectTo, { replace: true });
      }, 1200);
    }, 900);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f6f8ff] via-[#fff7fa] to-[#f2f4ff]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center gap-12 px-4 py-12 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-3 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-[#1d4ed8] shadow-md shadow-[#1d4ed8]/10 backdrop-blur transition hover:-translate-y-0.5">
          ← Back to Tiny Steps Home
        </Link>

        <div className="grid w-full gap-10 rounded-3xl border border-white/60 bg-white/90 p-8 shadow-xl shadow-slate-900/5 md:grid-cols-[1.1fr,0.9fr] md:gap-12 lg:p-12">
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#1d4ed8]/70">
              Role sign-in
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((option) => (
                <Link
                  key={option.value}
                  to={`/login/${option.value}`}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    option.value === role
                      ? "border-[#1d4ed8] bg-[#1d4ed8]/10 text-[#1d4ed8]"
                      : "border-slate-200 text-slate-500 hover:border-[#1d4ed8]/40 hover:text-[#1d4ed8]"
                  }`}
                >
                  {option.label}
                </Link>
              ))}
            </div>
            <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">{headline}</h1>
            <p className="mt-3 text-sm text-slate-600 sm:text-base">{config.subtitle}</p>

            <ul className="mt-6 space-y-3 rounded-3xl border border-slate-100 bg-slate-50/60 p-6 text-sm text-slate-700">
              {config.benefits.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#1d4ed8]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {config.guestLink && (
              <div className="mt-6 rounded-2xl border border-dashed border-[#1d4ed8]/40 bg-[#eff6ff] px-5 py-4 text-sm text-[#1d4ed8]">
                Prefer to explore the free guest module first?{" "}
                <Link to={config.guestLink.to} className="font-semibold underline underline-offset-4">
                  {config.guestLink.label}
                </Link>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-inner shadow-slate-900/5 sm:p-8">
            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-slate-700">Email</label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-[#1d4ed8]/20 transition focus:ring-2"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-[#1d4ed8]/20 transition focus:ring-2"
                />
              </div>

              <p className="text-xs text-slate-500">{config.helper}</p>

              <button
                type="submit"
                className="w-full rounded-full bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#2563eb]/20 transition hover:-translate-y-0.5"
              >
                {status === "submitting" ? "Signing in…" : config.cta}
              </button>

              {status === "success" && (
                <p className="rounded-2xl bg-[#dcfce7] px-4 py-3 text-sm font-semibold text-[#047857]">
                  Sign-in verified! Redirecting you to your workspace…
                </p>
              )}
            </form>

            <p className="mt-6 text-xs text-slate-500">
              Forgotten your password? Reach out to{" "}
              <a
                href="mailto:hello@tinystepslearning.com"
                className="font-semibold text-[#1d4ed8] underline underline-offset-4"
              >
                hello@tinystepslearning.com
              </a>{" "}
              and the Tiny Steps team will help you reset it right away.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
const ROLE_OPTIONS: Array<{ value: RoleKey; label: string }> = [
  { value: "kids", label: "Kids" },
  { value: "parents", label: "Parents" },
  { value: "teachers", label: "Teachers" },
  { value: "learning-managers", label: "Learning Managers" },
];
