import React from "react";
import {
  BookOpenText,
  CheckCircle2,
  Globe2,
  Mic2,
  Sparkles,
  Star,
} from "lucide-react";
import BookAssessmentForm from "../forms/BookAssessmentForm";

// Constants
const SUN_ORANGE = "#ff6a00";

const heroHighlights = [
  {
    eyebrow: "THE APPROACH",
    title: "Personalised Learning Pace",
    desc: "1:1 and small-group classes designed around each child’s level, pace, and confidence.",
    icon: <Sparkles className="h-5 w-5 text-orange-600" aria-hidden="true" />,
  },
  {
    eyebrow: "THE REACH",
    title: "Global Families",
    desc: "Trusted by families across 15+ countries in Asia, Europe, North America, and the Middle East.",
    icon: <Globe2 className="h-5 w-5 text-orange-600" aria-hidden="true" />,
  },
  {
    eyebrow: "THE OUTCOME",
    title: "Confident English Skills",
    desc: "Phonics, grammar, reading, and speaking built through calm routines and clear progress.",
    icon: <Mic2 className="h-5 w-5 text-orange-600" aria-hidden="true" />,
  },
];

// --- Components ---

const GlassCard = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`relative overflow-hidden rounded-[24px] border border-white/55 bg-white/45 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,23,42,0.08)] ${className}`}
  >
    {children}
  </div>
);

const SunTile = ({ eyebrow, title, desc, icon, size = "small" }: any) => (
  <div
    className={`group relative flex flex-col justify-between p-1 transition-all hover:-translate-y-1.5 ${
      size === "large" ? "md:col-span-2" : "col-span-1"
    }`}
  >
    <GlassCard className="h-full min-h-[208px] border-white/70 transition-all duration-500 group-hover:border-orange-200/70 group-hover:shadow-[0_18px_50px_rgba(255,106,0,0.12)] md:min-h-[220px]">
      {/* premium hover glow (subtle) */}
      <div className="pointer-events-none absolute inset-0 rounded-[24px] opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,106,0,0.20),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_90%,rgba(255,200,150,0.18),transparent_55%)]" />
      </div>

      {/* top highlight hairline */}
      <div className="pointer-events-none absolute left-0 top-0 h-px w-full opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-gradient-to-r from-transparent via-orange-300/70 to-transparent" />

      <div className="relative p-3.5 md:p-4">
        <div className="mb-2 flex items-center gap-2.5">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm transition-transform duration-300 group-hover:rotate-6 md:h-10 md:w-10">
            {icon}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-700/80">
            {eyebrow}
          </span>
        </div>

        <div>
          <h2 className="mt-1 text-[15px] font-bold leading-tight text-slate-900 md:text-base">{title}</h2>
          <p className="mt-1.5 text-[12px] leading-6 text-slate-600 md:text-[12.5px] md:leading-6">{desc}</p>
        </div>
      </div>

      {/* Subtle accent line */}
      <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-orange-500/70 to-transparent transition-all duration-500 group-hover:w-full" />
    </GlassCard>
  </div>
);

const ConversionHero: React.FC = () => {
  return (
    <section className="relative min-h-[82vh] overflow-hidden px-4 pb-10 pt-6 md:min-h-screen md:px-8 md:pb-12 md:pt-8">
      {/* ✅ Classy Sunrise Background (more depth, less wash) */}
      <div className="pointer-events-none absolute inset-0">
        {/* base */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, #FFF5EC 0%, #FFF9F4 32%, #FFFFFF 100%)",
          }}
        />

        {/* strong sun glow top-left (focused) */}
        <div
          style={{
            background:
              "radial-gradient(circle at 35% 35%, rgba(255,106,0,0.36) 0%, rgba(255,150,90,0.14) 38%, rgba(255,255,255,0) 72%)",
          }}
          className="absolute left-[-6%] top-[-18%] hidden h-[720px] w-[720px] rounded-full blur-[140px] md:block"
          aria-hidden
        />

        {/* gentle warm veil (kept light so it doesn't look orange everywhere) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(255,170,120,0.10),transparent_62%)]" />

        {/* ✅ white spotlight behind the form (right side pop) */}
        <div
          style={{
            background:
              "radial-gradient(circle at 60% 38%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.55) 26%, rgba(255,255,255,0) 62%)",
          }}
          className="absolute right-[-12%] top-[6%] hidden h-[760px] w-[760px] rounded-full blur-[70px] md:block"
          aria-hidden
        />

        {/* horizon haze for depth */}
        <div
          className="absolute inset-x-0 top-[62%] h-48"
          style={{
            background:
              "linear-gradient(180deg, rgba(148,163,184,0.10) 0%, rgba(255,255,255,0.0) 100%)",
          }}
        />

        {/* subtle paper-like texture (no dots) */}
        <div
          className="absolute inset-0 opacity-[0.035] mix-blend-multiply"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(15,23,42,0.020) 0, rgba(15,23,42,0.020) 1px, transparent 1px, transparent 14px), repeating-linear-gradient(-45deg, rgba(15,23,42,0.016) 0, rgba(15,23,42,0.016) 1px, transparent 1px, transparent 18px)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
          {/* LEFT CONTENT */}
          <div className="flex flex-col justify-center">
            <div
              className="inline-flex w-fit items-center gap-3 rounded-full border border-orange-200/60 bg-white/80 px-4 py-2 text-[12px] font-bold text-orange-800 shadow-sm backdrop-blur-md"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500"></span>
              </span>
              TRUSTED BY FAMILIES ACROSS 15+ COUNTRIES
            </div>

            <h1
              className="mt-6 max-w-4xl text-4xl font-black leading-[0.95] tracking-tight text-slate-900 md:text-6xl lg:text-7xl"
            >
              Gentle, high-impact
              <br />
              <span className="bg-gradient-to-r from-orange-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">
                English foundations
              </span>
            </h1>

            <p
              className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg"
            >
              A structured, low-stress journey for ages 3-12. Tiny Steps blends
              phonics, grammar, and speaking into one calm weekly rhythm so kids
              read better, write better, and speak with more confidence.
            </p>

            <p
              className="mt-3 max-w-2xl text-sm font-semibold text-slate-700 md:text-base"
            >
              Personalised English learning for children ages 3–12.
            </p>

            <div
              className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-slate-700"
            >
              <a href="/phonics-classes-for-kids" className="underline decoration-slate-300 underline-offset-4 transition hover:text-slate-900">
                phonics classes for kids
              </a>
              <a href="/english-grammar-writing-classes" className="underline decoration-slate-300 underline-offset-4 transition hover:text-slate-900">
                grammar classes for kids
              </a>
              <a href="/public-speaking-communication-kids" className="underline decoration-slate-300 underline-offset-4 transition hover:text-slate-900">
                public speaking classes for kids
              </a>
            </div>

            {/* BENTO GRID VALUE PROPS */}
            <div className="mt-6 hidden grid-cols-1 gap-1 md:grid md:grid-cols-2 lg:grid-cols-3">
              {heroHighlights.map((item) => (
                <SunTile
                  key={item.title}
                  eyebrow={item.eyebrow}
                  title={item.title}
                  desc={item.desc}
                  icon={item.icon}
                />
              ))}
            </div>

            <div
              className="mt-4 max-w-2xl rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm backdrop-blur"
            >
              <p className="font-medium text-slate-800">
                Structured curriculum, trained teachers, weekly parent updates, and personalized pacing — designed to help children read, write, and speak with confidence.
              </p>
              <p className="mt-1 text-slate-600">
                Calm routines, clear milestones, and consistent feedback make progress easy to see.
              </p>
            </div>

            <div
              className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-4 py-2 shadow-sm backdrop-blur">
                <span className="inline-flex items-center gap-1 text-amber-500">
                  <Star className="h-4 w-4 fill-current" aria-hidden="true" />
                  <Star className="h-4 w-4 fill-current" aria-hidden="true" />
                  <Star className="h-4 w-4 fill-current" aria-hidden="true" />
                  <Star className="h-4 w-4 fill-current" aria-hidden="true" />
                  <Star className="h-4 w-4 fill-current" aria-hidden="true" />
                </span>
                <span className="font-semibold text-slate-700">
                  Parent-loved live classes
                </span>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 shadow-sm backdrop-blur">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                Weekly parent updates and clear next steps
              </span>
            </div>
          </div>

          {/* RIGHT FORM CARD */}
          <div className="relative lg:pl-6">
            <div className="pointer-events-none absolute -right-3 top-6 hidden rounded-[28px] border border-white/70 bg-white/70 px-4 py-3 shadow-[0_16px_45px_rgba(255,106,0,0.12)] backdrop-blur md:block">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                  <BookOpenText className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">
                    Structured Path
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    Phonics to speaking
                  </div>
                </div>
              </div>
            </div>

            <BookAssessmentForm defaultInterest="Phonics" />

            {/* Floating Decorative Element */}
            <div className="absolute -bottom-4 -left-2 h-20 w-20 animate-bounce rounded-3xl bg-white p-4 shadow-xl [animation-duration:3.5s] md:-left-6">
              <div className="flex h-full w-full items-center justify-center rounded-xl bg-orange-50 text-2xl">
                🎓
              </div>
            </div>

            <div className="absolute -bottom-6 right-4 hidden animate-bounce rounded-full border border-emerald-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg backdrop-blur [animation-duration:4s] [animation-delay:0.4s] sm:inline-flex">
              <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" aria-hidden="true" />
              Reply via WhatsApp
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ConversionHero;
