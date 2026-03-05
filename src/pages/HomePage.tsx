// src/pages/HomePage.tsx
// @ts-nocheck
import React, { lazy, Suspense, useEffect } from "react";
import { applySeo } from "../lib/seo";
import { organizationSchema, localBusinessSchema } from "../lib/schemas";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Meta from "../components/common/Meta";
import ConversionHero from "../components/Home/ConversionHero";
import { LearningJourneyRoadmapPPT } from "./KidsEnglishExcellence";

/**
 * Safe optional sections loader:
 * - prevents Vite 500 if a section component was deleted/renamed
 * - missing section renders nothing (no crash)
 */

const modules = {
  ...import.meta.glob("../components/Home/**/*.{tsx,ts,jsx,js}"),
  ...import.meta.glob("../components/common/**/*.{tsx,ts,jsx,js}"),
  ...import.meta.glob("../components/**/*.{tsx,ts,jsx,js}"),
};

const NullSection = () => null;

function pick(candidates: string[]) {
  for (const key of candidates) {
    if (modules[key]) return modules[key];
  }
  return null;
}

function safeLazy(modFn: any) {
  return lazy(async () => {
    try {
      if (!modFn) return { default: NullSection };
      const mod = await modFn();
      return { default: mod?.default || NullSection };
    } catch (e) {
      console.warn("[HomePage] Optional section failed to load:", e);
      return { default: NullSection };
    }
  });
}

// ✅ Sections (restored) — loaded safely
const GlobalImpactSection = safeLazy(
  pick([
    "../components/Home/GlobalImpactSection.tsx",
    "../components/Home/GlobalImpactSection.jsx",
    "../components/Home/GlobalImpactSection/index.tsx",
    "../components/Home/GlobalImpactSection/index.jsx",
  ])
);

const DemoShowcase = safeLazy(
  pick([
    "../components/Home/DemoShowcase.tsx",
    "../components/Home/DemoShowcase.jsx",
    "../components/Home/DemoShowcase/index.tsx",
    "../components/Home/DemoShowcase/index.jsx",
  ])
);

// WhyChooseCollapsibleSection removed from homepage (do not render)

const StepTimeline = safeLazy(
  pick([
    "../components/Home/StepTimeline.tsx",
    "../components/Home/StepTimeline.jsx",
    "../components/Home/StepTimeline/index.tsx",
    "../components/Home/StepTimeline/index.jsx",
  ])
);

const SocialProofCrispSection = safeLazy(
  pick([
    "../components/Home/SocialProofCrispSection.tsx",
    "../components/Home/SocialProofCrispSection.jsx",
    "../components/Home/SocialProofCrispSection/index.tsx",
    "../components/Home/SocialProofCrispSection/index.jsx",
  ])
);

const StatsStripSection = safeLazy(
  pick([
    "../components/Home/StatsStrip.tsx",
    "../components/Home/StatsStrip.jsx",
    "../components/Home/StatsStrip/index.tsx",
    "../components/Home/StatsStrip/index.jsx",
  ])
);

const PricingCrispSection = safeLazy(
  pick([
    "../components/Home/PricingCrispSection.tsx",
    "../components/Home/PricingCrispSection.jsx",
    "../components/Home/PricingCrispSection/index.tsx",
    "../components/Home/PricingCrispSection/index.jsx",
  ])
);


const FinalCTASection = safeLazy(
  pick([
    "../components/Home/FinalCTASection.tsx",
    "../components/Home/FinalCTASection.jsx",
    "../components/Home/FinalCTASection/index.tsx",
    "../components/Home/FinalCTASection/index.jsx",
  ])
);

const Footer = safeLazy(
  pick([
    "../components/common/Footer.tsx",
    "../components/common/Footer.jsx",
    "../components/common/Footer/index.tsx",
    "../components/common/Footer/index.jsx",
  ])
);

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.search && location.search.includes("book=1")) {
      // wait one tick so the page can render, then scroll and remove the query
      setTimeout(() => {
        document.getElementById("book-trial")?.scrollIntoView({ behavior: "smooth", block: "start" });
        // replace the URL to remove the query param without adding history
        try {
          navigate("/", { replace: true });
        } catch {
          // ignore navigation errors in SSR/test envs
        }
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  useEffect(() => {
    applySeo({
      title: "Tiny Steps Learning | Phonics & Grammar for Kids (3–12)",
      description:
        "Tiny Steps Learning helps children build strong phonics and grammar foundations through simple, fun, step-by-step learning.",
      canonicalPath: "/",
      ogType: "website",
      jsonLd: [
        organizationSchema,
        localBusinessSchema,
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Tiny Steps Learning',
          url: 'https://tinystepslearning.com',
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: 'https://tinystepslearning.com/courses?q={search_term_string}'
            },
            'query-input': 'required name=search_term_string'
          }
        },
      ],
    });
  }, []);

  return (
    <>
      <Meta
        title="Tiny Steps Online English School | 1:1 Phonics, Grammar & Public Speaking for Kids (3–12)"
        description="Premium 1:1 online English classes for ages 3–12. IB-aligned phonics, grammar and public speaking with kind live mentors, AI-guided practice, and simple stage-based progress updates for parents. Book a free assessment class."
        keywords="phonics classes online India, grammar classes for kids, public speaking courses children, English learning kids ages 3-12, online English tuition India"
        canonical="https://tinystepslearning.com/"
      />

      {/* Anchor used by Header CTA */}
      <div id="book-trial" style={{ position: "relative", top: "-90px" }} aria-hidden="true" />

      {/* HERO */}
      <ConversionHero />
      <Suspense fallback={null}>
        <StatsStripSection />
      </Suspense>

      {/* Summer Camp CTA */}
      <section className="px-6 py-6">
        <div className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-[32px] border border-emerald-100/80 bg-gradient-to-r from-emerald-50 via-white to-sky-50 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.06)] sm:p-8">
            <div className="pointer-events-none absolute -left-16 top-0 h-40 w-40 rounded-full bg-emerald-200/40 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 rounded-full bg-sky-200/40 blur-3xl" />

            <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">Summer Camp 2026</p>
                <h2 className="mt-2 text-2xl font-semibold text-gray-900 sm:text-3xl">Online Summer English Camp for ages 3-12</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-700 sm:text-base">Phonics, grammar, and confident speaking in a 10-week live format with clear routines, light homework, and progress parents can actually follow.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["10-week program", "Live online", "Limited seats", "Daily practice support"].map((item) => (
                    <span key={item} className="rounded-full border border-white/80 bg-white/75 px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm backdrop-blur">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/summer-english-camp-2026"
                  className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700"
                >
                  View Camp
                </Link>
                <Link
                  to="/summer-camps"
                  className="inline-flex items-center justify-center rounded-full border border-emerald-600 bg-white/70 px-5 py-2.5 text-sm font-semibold text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-50"
                >
                  See Camps
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ✅ Restored sections */}
      <Suspense fallback={null}>
        <GlobalImpactSection />
      </Suspense>

      <Suspense fallback={null}>
        <DemoShowcase />
      </Suspense>

      {/* WhyChooseCollapsibleSection intentionally removed */}

      {/* ✅ PPT-style Journey Roadmap (above Learning Stages) */}
      <section className="px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <LearningJourneyRoadmapPPT />
        </div>
      </section>

      <Suspense fallback={null}>
        <StepTimeline />
      </Suspense>

      <Suspense fallback={null}>
        <SocialProofCrispSection />
      </Suspense>

      <Suspense fallback={null}>
        <PricingCrispSection />
      </Suspense>

      {/* Parents Help Hub CTA — small, calm, AEO-friendly */}
      <section className="px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] backdrop-blur sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-700">For parents</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">Parents Help Hub</h2>
                <p className="mt-3 text-gray-700 sm:text-base">Clear, step-by-step phonics and home practice guides for ages 3-12, written to reduce guesswork and make daily support feel manageable.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3 lg:w-[360px] lg:grid-cols-1">
                {[
                  "Short, practical guides",
                  "Home routines that fit real schedules",
                  "Friendly support for common phonics questions",
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <ul className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              <li>
                <Link to="/parents" className="group flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-primary-700 transition hover:border-primary-200 hover:bg-primary-50/60">
                  <span className="font-semibold">View all guides</span>
                  <span className="text-slate-400 transition group-hover:translate-x-0.5">→</span>
                </Link>
              </li>
              <li>
                <Link to="/parents/getting-started" className="group flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 transition hover:border-primary-200 hover:bg-primary-50/60 hover:text-primary-700">
                  <span>Getting started with phonics at home</span>
                  <span className="text-slate-400 transition group-hover:translate-x-0.5">→</span>
                </Link>
              </li>
              <li>
                <Link to="/parents/reading-at-home" className="group flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 transition hover:border-primary-200 hover:bg-primary-50/60 hover:text-primary-700">
                  <span>10-minute daily reading routine</span>
                  <span className="text-slate-400 transition group-hover:translate-x-0.5">→</span>
                </Link>
              </li>
              <li>
                <Link to="/parents/phonics-mission" className="group flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 transition hover:border-primary-200 hover:bg-primary-50/60 hover:text-primary-700">
                  <span>How to use Phonics Mission games</span>
                  <span className="text-slate-400 transition group-hover:translate-x-0.5">→</span>
                </Link>
              </li>
              <li>
                <Link to="/parents/common-mistakes" className="group flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 transition hover:border-primary-200 hover:bg-primary-50/60 hover:text-primary-700">
                  <span>Common phonics mistakes to avoid</span>
                  <span className="text-slate-400 transition group-hover:translate-x-0.5">→</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <FinalCTASection />
      </Suspense>

      {/* Locations served — helps 'near me' intent while clarifying we're online */}
      <section className="px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[32px] border border-slate-200/80 bg-gradient-to-br from-white via-white to-sky-50 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] sm:p-8">
            <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">English classes for kids worldwide</h2>
            <p className="mt-3 max-w-3xl text-gray-700">Tiny Steps now supports admissions from 15+ countries. Families join us from India, the UAE, Vietnam, Singapore, Malaysia, the UK, Canada, the USA, Sweden, Germany, Australia, Sri Lanka, Pakistan, and more.</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {['India','UAE','Vietnam','Singapore','Malaysia','UK','Canada','USA','Sweden','Germany','Australia','Sri Lanka','Pakistan'].map((c) => (
                <span key={c} className="rounded-full border border-white bg-white px-3 py-1 text-sm font-medium text-slate-700 shadow-sm">{c}</span>
              ))}
            </div>

            <div className="mt-6">
              <a href="/courses" className="inline-flex items-center rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-700">See courses</a>
            </div>
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </>
  );
}
