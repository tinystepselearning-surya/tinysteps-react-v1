import React, { memo } from "react";
import { Globe2, Mic2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import BookAssessmentForm from "../forms/BookAssessmentForm";
import { PUBLIC_LEARNER_REACH_LABEL } from "../../config/publicFacts";

const heroHighlights = [
  {
    eyebrow: "THE APPROACH",
    title: "Structured Learning Path",
    desc: "Live 1:1 and small-group classes matched to each child’s reading, grammar, and speaking stage.",
    icon: <Sparkles className="h-5 w-5 text-orange-600" aria-hidden="true" />,
  },
  {
    eyebrow: "THE REACH",
    title: "Trusted Worldwide",
    desc: `${PUBLIC_LEARNER_REACH_LABEL} have learned with Tiny Steps through live online support.`,
    icon: <Globe2 className="h-5 w-5 text-orange-600" aria-hidden="true" />,
  },
  {
    eyebrow: "THE OUTCOME",
    title: "Visible Parent Progress",
    desc: "Structured phonics, reading, grammar, and speaking growth with weekly parent updates.",
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
    className={`relative overflow-hidden rounded-[22px] border border-white/65 bg-white/55 backdrop-blur-xl shadow-[0_8px_26px_rgba(15,23,42,0.06)] ${className}`}
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
    <GlassCard className="h-full min-h-[148px] border-white/70 transition-all duration-300 group-hover:border-orange-200/70 md:min-h-[154px]">
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
    <section className="relative overflow-hidden px-4 pb-6 pt-6 md:px-8 md:pb-8 md:pt-8">
      {/* ✅ Classy Sunrise Background (more depth, less wash) */}
      <div className="pointer-events-none absolute inset-0">
        {/* base */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, #FFF8F3 0%, #FFFBF8 38%, #FFFFFF 100%)",
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

        {/* brand wash behind the headline to improve contrast and identity */}
        <div
          className="absolute left-[2%] top-[4%] h-[360px] w-[360px] rounded-full blur-[95px] md:h-[440px] md:w-[520px]"
          style={{
            background:
              "radial-gradient(circle at 32% 35%, rgba(255,196,71,0.28) 0%, rgba(255,142,43,0.18) 34%, rgba(255,255,255,0) 72%)",
          }}
          aria-hidden
        />

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
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(28rem,0.92fr)] lg:items-start">
          {/* LEFT CONTENT */}
          <div className="flex min-w-0 flex-col justify-center">
            <div
              className="inline-flex w-fit items-center gap-3 rounded-full border border-amber-200/80 bg-white/90 px-4 py-2 text-[12px] font-extrabold tracking-[0.06em] text-[#9A3412] shadow-[0_12px_30px_rgba(251,146,60,0.14)] backdrop-blur-md"
            >
              <span className="relative flex h-2 w-2">
                <span className="motion-safe:animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500"></span>
              </span>
              LIVE ONLINE ENGLISH CLASSES FOR KIDS
            </div>

            <h1
              className="mt-6 max-w-4xl text-[clamp(2.75rem,11.5vw,4.2rem)] font-black leading-[0.94] tracking-[-0.05em] text-[#172033] sm:text-[clamp(3.5rem,9vw,4.5rem)] lg:text-[clamp(3.5rem,5.35vw,4.65rem)] xl:text-[4.8rem] 2xl:text-[5rem]"
            >
              <span className="block lg:whitespace-nowrap" data-hero-line="online-english">
                <span
                  className="text-white [text-shadow:-1px_-1px_0_rgba(245,115,22,0.9),1px_-1px_0_rgba(245,115,22,0.9),-1px_1px_0_rgba(245,115,22,0.9),1px_1px_0_rgba(245,115,22,0.9),0_8px_24px_rgba(251,146,60,0.22)] [-webkit-text-stroke:0.35px_rgba(245,115,22,0.72)]"
                >
                  Online
                </span>{" "}
                <span className="bg-gradient-to-r from-[#F59E0B] via-[#F97316] to-[#FBBF24] bg-clip-text text-transparent [text-shadow:0_10px_28px_rgba(245,158,11,0.18)]">
                  English
                </span>
              </span>
              <span className="block lg:whitespace-nowrap" data-hero-line="classes-for-kids">
                <span className="bg-gradient-to-r from-[#F59E0B] via-[#F97316] to-[#FBBF24] bg-clip-text text-transparent [text-shadow:0_10px_28px_rgba(245,158,11,0.18)]">
                  Classes
                </span>{" "}
                <span
                  className="text-white [text-shadow:-1px_-1px_0_rgba(245,115,22,0.9),1px_-1px_0_rgba(245,115,22,0.9),-1px_1px_0_rgba(245,115,22,0.9),1px_1px_0_rgba(245,115,22,0.9),0_8px_24px_rgba(251,146,60,0.22)] [-webkit-text-stroke:0.35px_rgba(245,115,22,0.72)]"
                >
                  for Kids
                </span>
              </span>
            </h1>

            <p
              className="mt-5 max-w-2xl text-[1.04rem] font-semibold leading-8 text-[#182B57] [text-shadow:-0.7px_-0.7px_0_rgba(255,255,255,0.78),0.7px_-0.7px_0_rgba(255,255,255,0.78),-0.7px_0.7px_0_rgba(255,255,255,0.78),0.7px_0.7px_0_rgba(255,255,255,0.78)] md:text-[1.16rem] md:leading-9"
            >
              Book one free 35-minute 1:1 online demo assessment class and find whether your child should start with phonics, reading, grammar,
              sentence formation, or speaking confidence.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/book-demo"
                className="inline-flex items-center justify-center rounded-full bg-[#182338] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(23,32,51,0.20)] transition hover:bg-[#111B2D]"
              >
                Book Free 35-Minute Demo
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center rounded-full border border-[#182338]/18 bg-white/88 px-6 py-3 text-sm font-semibold text-[#182338] shadow-[0_10px_24px_rgba(23,32,51,0.08)] backdrop-blur transition hover:border-[#182338]/28 hover:bg-white"
              >
                See Pricing
              </Link>
              <Link
                to="/class-samples"
                className="inline-flex items-center justify-center rounded-full border border-amber-200 bg-gradient-to-r from-[#FFF7DB] to-[#FFEBD5] px-6 py-3 text-sm font-semibold text-[#9A3412] shadow-[0_10px_24px_rgba(245,158,11,0.12)] backdrop-blur transition hover:border-orange-300 hover:from-[#FFF2C2] hover:to-[#FFE4C6]"
              >
                Class Samples
              </Link>
            </div>

          </div>

          {/* RIGHT FORM CARD */}
          <div className="relative min-w-0 lg:pl-6">
            <BookAssessmentForm
              source="homepage_hero_assessment"
              title="Share Your Child's Details"
              description="Tell us where your child needs support so the free assessment can focus on the right skills."
              submitLabel="Book Free 35-Minute Demo on WhatsApp"
              submitAriaLabel="Book Free 35-Minute Demo on WhatsApp"
              appearance="heroCompact"
              helperText="20–30 seconds • No commitment • WhatsApp confirmation"
              secondaryHelperText={null}
            />

          </div>
        </div>

        {/* Shared proof row: keeps both hero columns visually balanced on tablet and desktop. */}
        <div className="mt-4 hidden gap-2 md:grid md:grid-cols-3">
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
      </div>
    </section>
  );
};

export default memo(ConversionHero);
