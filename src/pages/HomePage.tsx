// src/pages/HomePage.tsx
// @ts-nocheck
import React, { lazy, Suspense, useEffect, useState } from "react";
import { applySeo } from "../lib/seo";
import { organizationSchema, localBusinessSchema } from "../lib/schemas";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Meta from "../components/common/Meta";
import ConversionHero from "../components/Home/ConversionHero";
import ParentReassurance from "../components/programs/ParentReassurance";
const GlobalImpactSection = lazy(() => import("../components/Home/GlobalImpactSection"));
const DemoShowcase = lazy(() => import("../components/Home/StatsProofSection"));
const StepTimeline = lazy(() => import("../components/Home/StepTimeline"));
const SocialProofCrispSection = lazy(() => import("../components/Home/SocialProofCrispSection"));
const PricingCrispSection = lazy(() => import("../components/Home/PricingCrispSection"));
const FinalCTASection = lazy(() => import("../components/Home/FinalCTASection"));
const LearningJourneyRoadmapPPT = lazy(async () => {
  const mod = await import("./KidsEnglishExcellence");
  return { default: mod.LearningJourneyRoadmapPPT };
});

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showDeferredSections, setShowDeferredSections] = useState(false);

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
      title: "Online Phonics, Grammar & Public Speaking Classes for Kids | Tiny Steps Learning",
      description:
        "Live 1:1 and small-group online phonics, grammar, and speaking classes for kids ages 3–12. Free assessment, structured curriculum, trained teachers, weekly parent updates.",
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

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.webdriver) return;

    const activate = () => setShowDeferredSections(true);
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    let idleId: number | undefined;
    let timeoutId: number | undefined;

    const onFirstInteraction = () => {
      activate();
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
      window.removeEventListener("touchstart", onFirstInteraction);
      window.removeEventListener("scroll", onFirstInteraction);
    };
    window.addEventListener("pointerdown", onFirstInteraction, { passive: true });
    window.addEventListener("keydown", onFirstInteraction, { passive: true });
    window.addEventListener("touchstart", onFirstInteraction, { passive: true });
    window.addEventListener("scroll", onFirstInteraction, { passive: true });

    if (typeof win.requestIdleCallback === "function") {
      idleId = win.requestIdleCallback(activate, { timeout: 2800 });
    } else {
      timeoutId = window.setTimeout(activate, 2400);
    }

    return () => {
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
      window.removeEventListener("touchstart", onFirstInteraction);
      window.removeEventListener("scroll", onFirstInteraction);
      if (idleId !== undefined && typeof win.cancelIdleCallback === "function") {
        win.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <>
      <Meta
        title="Online Phonics, Grammar & Public Speaking Classes for Kids | Tiny Steps Learning"
        description="1:1 online phonics, grammar, and public speaking classes for kids ages 3–12. Structured curriculum, trained teachers, weekly parent updates, and free assessment."
        keywords="phonics classes online India, grammar classes for kids, public speaking courses children, English learning kids ages 3-12, online English tuition India"
        canonical="https://tinystepslearning.com/"
      />

      {/* Anchor used by Header CTA */}
      <div id="book-trial" style={{ position: "relative", top: "-90px" }} aria-hidden="true" />

      {/* HERO */}
      <ConversionHero />

      {/* Program Navigation Cards */}
      <section className="px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Choose Your Focus</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Explore Our Core Programs</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Link
              to="/phonics"
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-emerald-50/30 to-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">
                📚
              </div>
              <h3 className="text-xl font-bold text-slate-900">Phonics Classes</h3>
              <p className="mt-1 text-sm text-slate-600">Ages 3–12</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                Letter sounds, blending, reading fluency. Structured path from sounds to confident reading.
              </p>
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 transition group-hover:gap-2">
                Explore Phonics
                <span className="text-lg">→</span>
              </div>
            </Link>

            <Link
              to="/grammar"
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-sky-50/30 to-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-2xl">
                ✏️
              </div>
              <h3 className="text-xl font-bold text-slate-900">Grammar Classes</h3>
              <p className="mt-1 text-sm text-slate-600">Ages 5–15</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                Sentence structure, tenses, writing clarity. Build correct, confident writing skills.
              </p>
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-sky-700 transition group-hover:gap-2">
                Explore Grammar
                <span className="text-lg">→</span>
              </div>
            </Link>

            <Link
              to="/speaking"
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-amber-50/30 to-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
                🎤
              </div>
              <h3 className="text-xl font-bold text-slate-900">Speaking Classes</h3>
              <p className="mt-1 text-sm text-slate-600">Ages 4–15</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                Presentation skills, confidence, clarity. Structured talks, Q&A handling, public speaking.
              </p>
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-amber-700 transition group-hover:gap-2">
                Explore Speaking
                <span className="text-lg">→</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Summer Camp CTA */}
      <section className="px-6 py-6">
        <div className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-[32px] border border-emerald-100/80 bg-gradient-to-r from-emerald-50 via-white to-sky-50 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.06)] sm:p-8">
            <div className="pointer-events-none absolute -left-16 top-0 h-40 w-40 rounded-full bg-emerald-200/40 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 rounded-full bg-sky-200/40 blur-3xl" />

            <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">Summer Camp 2026 • April-June</p>
                <h2 className="mt-2 text-2xl font-semibold text-gray-900 sm:text-3xl">Summer Catch-Up & Bridge Camp for ages 4–12</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-700 sm:text-base">
                  Choose from 3 fast-track programs: <strong>Phonics</strong>, <strong>Grammar</strong>, or <strong>Speaking</strong>. 10-week live online format with free placement assessment, clear routines, and progress tracking.
                </p>
                <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-700 px-3 py-1 text-sm font-semibold text-white">
                  <span className="line-through text-emerald-100">₹5,000</span>
                  <span>Effective price: ₹2,400</span>
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["Live small-group online", "Free assessment", "Capped batches", "April 1–June 15"].map((item) => (
                    <span key={item} className="rounded-full border border-white/80 bg-white/75 px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm backdrop-blur">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Link
                  to="/summer-camps"
                  className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-800"
                >
                  Start Free Assessment
                </Link>
                <Link
                  to="/summer-camps"
                  className="inline-flex items-center justify-center rounded-full border border-emerald-700 bg-white/70 px-5 py-2.5 text-sm font-semibold text-emerald-800 transition hover:-translate-y-0.5 hover:bg-emerald-50"
                >
                  View All 3 Programs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-2 pb-8">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-sky-100 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">English Excellence</p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-900">English Excellence Mission</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-700">
                Master reading, writing & speaking step by step
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                Give your child meaningful daily practice through guided English learning games that build strong foundations in letters & sounds, spelling, vocabulary, sentence making, reading, grammar, and confident speaking.
              </p>
            </div>
            <Link
              to="/games/english-excellence"
              className="inline-flex items-center justify-center rounded-full border border-sky-600 bg-sky-50 px-5 py-2.5 text-sm font-semibold text-sky-700 transition hover:-translate-y-0.5 hover:bg-sky-100"
            >
              Explore English Excellence
            </Link>
          </div>
        </div>
      </section>

      {showDeferredSections ? (
        <>
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
              <Suspense fallback={null}>
                <LearningJourneyRoadmapPPT />
              </Suspense>
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
        </>
      ) : null}

      {showDeferredSections ? (
        <>
          {/* Parents Help Hub CTA — small, calm, AEO-friendly */}
          <section className="px-6 py-8">
            <div className="mx-auto max-w-6xl">
              <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] backdrop-blur sm:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-700">For parents</p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">Parents Help Hub</h2>
                    <p className="mt-3 text-gray-700 sm:text-base">Clear, step-by-step guides for parents asking what phonics is, why it matters, how to teach it at home, and how to make daily reading support feel manageable.</p>
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
                    <Link to="/blog/phonics-for-parents-guide" className="group flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-slate-700 transition hover:border-primary-200 hover:bg-primary-50/60 hover:text-primary-700">
                      <span>What phonics is and how to teach it at home</span>
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

          <ParentReassurance />

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
        </>
      ) : null}

    </>
  );
}
