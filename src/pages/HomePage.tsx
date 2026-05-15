// src/pages/HomePage.tsx
// @ts-nocheck
import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { localBusinessSchema, PUBLIC_FACTS } from "../lib/schemas";
import { Link } from "react-router-dom";
import Meta from "../components/common/Meta";
import ConversionHero from "../components/Home/ConversionHero";
const AutoLinkedText = lazy(() => import("../components/seo/AutoLinkedText"));
const ParentReassurance = lazy(() => import("../components/programs/ParentReassurance"));
const GlobalLearnersMapSection = lazy(() => import("../components/Home/GlobalLearnersMapSection"));
const DemoShowcase = lazy(() => import("../components/Home/StatsProofSection"));
const StepTimeline = lazy(() => import("../components/Home/StepTimeline"));
const PricingCrispSection = lazy(() => import("../components/Home/PricingCrispSection"));
const FinalCTASection = lazy(() => import("../components/Home/FinalCTASection"));
const LearningJourneyRoadmapPPT = lazy(async () => {
  const mod = await import("./KidsEnglishExcellence");
  return { default: mod.LearningJourneyRoadmapPPT };
});

const SUMMER_CAMP_BADGES = [
  "24 live classes in 4 weeks",
  "Monday to Saturday batches",
  "Sunday holiday",
  "Season: 27 Apr to 13 Jun 2026",
  "Batch starts: 27 Apr, 4 May, 11 May, 18 May",
];
const PARENT_HELP_POINTS = [
  "Short, practical guides",
  "Home routines that fit real schedules",
  "Friendly support for common phonics questions",
];
const CORE_PROGRAMS_TEXT = `${PUBLIC_FACTS.corePrograms[0]}, ${PUBLIC_FACTS.corePrograms[1]}, and ${PUBLIC_FACTS.corePrograms[2]}`;
const homeSeoTitle = "Premium Online English Classes for Kids in India | Tiny Steps Learning";
const homeSeoDescription =
  "Tiny Steps offers premium 1:1 online English classes for children aged 3–12 across phonics, grammar, reading, sentence formation, communication, and public speaking.";
const homeCanonicalPath = "/";
const homeCanonicalUrl =
  homeCanonicalPath === "/" ? `${PUBLIC_FACTS.primaryWebsite}/` : `${PUBLIC_FACTS.primaryWebsite}${homeCanonicalPath}`;
const quickAnswerFaqItems = [
  {
    question: "What does Tiny Steps Learning teach?",
    answer:
      `${PUBLIC_FACTS.brandName} offers ${PUBLIC_FACTS.positioning} through ${CORE_PROGRAMS_TEXT} programs.`,
  },
  {
    question: "Who are Tiny Steps classes for?",
    answer:
      "Classes are for children who need support with reading, grammar, writing clarity, sentence confidence, pronunciation practice, storytelling, or communication confidence.",
  },
  {
    question: "How are Tiny Steps classes conducted?",
    answer:
      `Classes are conducted through ${PUBLIC_FACTS.deliveryModel} in one-on-one and small-group formats. Each session is ${PUBLIC_FACTS.sessionDuration}.`,
  },
  {
    question: "How do parents know if the child is improving?",
    answer:
      "Parents receive updates on what the child is learning, where the child is improving, and which areas need more practice.",
  },
];
const quickAnswerFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://tinystepslearning.com/#quick-answer-faq",
  mainEntity: quickAnswerFaqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function HomePage() {
  const belowFoldAnchorRef = useRef<HTMLDivElement | null>(null);
  const [showPrimaryBelowFoldSections, setShowPrimaryBelowFoldSections] = useState(false);
  const [showDeferredSections, setShowDeferredSections] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let settled = false;
    let observer: IntersectionObserver | null = null;
    let fallbackTimer: number | undefined;

    const reveal = () => {
      if (settled) return;
      settled = true;
      setShowPrimaryBelowFoldSections(true);
      observer?.disconnect();
      if (fallbackTimer !== undefined) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = undefined;
      }
      window.removeEventListener("scroll", reveal);
      window.removeEventListener("pointerdown", reveal);
      window.removeEventListener("touchstart", reveal);
      window.removeEventListener("keydown", reveal);
    };

    const target = belowFoldAnchorRef.current;
    if (target && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            reveal();
          }
        },
        { rootMargin: "900px 0px 900px 0px", threshold: 0.01 }
      );
      observer.observe(target);
    }

    window.addEventListener("scroll", reveal, { passive: true, once: true });
    window.addEventListener("pointerdown", reveal, { passive: true, once: true });
    window.addEventListener("touchstart", reveal, { passive: true, once: true });
    window.addEventListener("keydown", reveal, { once: true });
    fallbackTimer = window.setTimeout(reveal, 2200);

    return () => {
      observer?.disconnect();
      if (fallbackTimer !== undefined) {
        window.clearTimeout(fallbackTimer);
      }
      window.removeEventListener("scroll", reveal);
      window.removeEventListener("pointerdown", reveal);
      window.removeEventListener("touchstart", reveal);
      window.removeEventListener("keydown", reveal);
    };
  }, []);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.webdriver) return;

    const activate = () => setShowDeferredSections(true);
    const isMobileViewport = window.matchMedia("(max-width: 767px)").matches;
    const connection = (navigator as any)?.connection;
    const effectiveType =
      typeof connection?.effectiveType === "string" ? connection.effectiveType.toLowerCase() : "";
    const isConstrainedNetwork =
      Boolean(connection?.saveData) || effectiveType === "slow-2g" || effectiveType === "2g";
    const fallbackDelayMs = isMobileViewport
      ? isConstrainedNetwork ? 9200 : 6800
      : isConstrainedNetwork ? 12000 : 9800;
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    let idleId: number | undefined;
    let timeoutId: number | undefined;

    const clearScheduledActivation = () => {
      if (idleId !== undefined && typeof win.cancelIdleCallback === "function") {
        win.cancelIdleCallback(idleId);
        idleId = undefined;
      }
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    };

    const onFirstInteraction = () => {
      clearScheduledActivation();
      activate();
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
      window.removeEventListener("touchstart", onFirstInteraction);
      window.removeEventListener("scroll", onFirstInteraction);
    };
    window.addEventListener("pointerdown", onFirstInteraction, { passive: true, once: true });
    window.addEventListener("keydown", onFirstInteraction, { once: true });
    window.addEventListener("touchstart", onFirstInteraction, { passive: true, once: true });
    window.addEventListener("scroll", onFirstInteraction, { passive: true, once: true });

    if (typeof win.requestIdleCallback === "function") {
      idleId = win.requestIdleCallback(activate, { timeout: fallbackDelayMs });
    } else {
      timeoutId = window.setTimeout(activate, fallbackDelayMs);
    }

    return () => {
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
      window.removeEventListener("touchstart", onFirstInteraction);
      window.removeEventListener("scroll", onFirstInteraction);
      clearScheduledActivation();
    };
  }, []);

  return (
    <>
      <Meta
        title={homeSeoTitle}
        description={homeSeoDescription}
        keywords="online english classes for kids india, phonics classes for kids, online grammar classes for kids, public speaking classes for kids online, premium 1:1 english classes for children"
        canonical={homeCanonicalUrl}
        jsonLd={[localBusinessSchema, quickAnswerFaqSchema]}
      />

      {/* HERO */}
      <ConversionHero />

      <div ref={belowFoldAnchorRef} className="h-px w-full" aria-hidden="true" />

      {showPrimaryBelowFoldSections ? (
        <>
      <section className="px-6 py-8">
        <div className="mx-auto max-w-6xl rounded-[30px] border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-sky-50 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-8">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Quick Answer for Parents</h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-700 sm:text-base">
            {PUBLIC_FACTS.brandName} offers {PUBLIC_FACTS.positioning}, with core programs in {CORE_PROGRAMS_TEXT}. Tiny Steps supports children who need
            help with reading confidence, grammar foundations, sentence formation, clear expression, and confident
            communication. Founded by Priya, Tiny Steps is led by an academic team focused on structured, child-friendly teaching.
            Classes are conducted through {PUBLIC_FACTS.deliveryModel} in one-on-one and small-group formats, with teacher-led
            practice, child-friendly activities, guided correction, and parent progress updates.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {quickAnswerFaqItems.map((item) => (
              <article key={item.question} className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">{item.question}</h3>
                <p className="mt-2 text-sm text-slate-700">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Program Navigation Cards */}
      <section className="px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Choose Your Focus</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Explore Our Core Programs</h2>
            <p className="mt-2 text-sm text-slate-600">
              For age-based pathways, parents can start with{' '}
              <Link to="/english-classes-for-4-year-old" className="font-medium underline underline-offset-2 hover:text-slate-900">
                English classes for 4-year-old children
              </Link>{' '}
              or{' '}
              <Link to="/english-classes-for-5-year-old" className="font-medium underline underline-offset-2 hover:text-slate-900">
                support for 5-year-old children
              </Link>.
              <br className="hidden sm:block" />
              Not sure where to begin? See <Link to="/class-samples" className="font-medium underline underline-offset-2 hover:text-slate-900">live class samples</Link>, discover <Link to="/why-tiny-steps" className="font-medium underline underline-offset-2 hover:text-slate-900">why parents choose us</Link>, or browse <Link to="/courses" className="font-medium underline underline-offset-2 hover:text-slate-900">all online courses</Link>.
            </p>
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
              <p className="mt-1 text-sm text-slate-600">Ages 3–12</p>
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
              <p className="mt-1 text-sm text-slate-600">Ages 3–12</p>
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
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">Summer Camp Season 2026 • 27 April to 13 June</p>
                <h2 className="mt-2 text-2xl font-semibold text-gray-900 sm:text-3xl">A focused 4-week summer learning program for ages 4–12</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-700 sm:text-base">
                  Choose from 3 fast-track programs: <strong>Phonics</strong>, <strong>Grammar</strong>, or <strong>Speaking</strong>. {`Each child joins one 24 live-class batch in 4 weeks inside the Summer Camp Season from 27 April to 13 June 2026.`} Limited batch start dates are 27 April, 4 May, 11 May and 18 May 2026, with Sunday kept as a holiday.
                </p>
                <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-700 px-3 py-1 text-sm font-semibold text-white">
                  <span className="line-through text-emerald-100">₹5,000</span>
                  <span>Effective price: ₹2,400</span>
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {SUMMER_CAMP_BADGES.map((item) => (
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
                  Book Free Assessment
                </Link>
                <Link
                  to="/summer-camps"
                  className="inline-flex items-center justify-center rounded-full border border-emerald-700 bg-white/70 px-5 py-2.5 text-sm font-semibold text-emerald-800 transition hover:-translate-y-0.5 hover:bg-emerald-50"
                >
                  Explore Summer Camp 2026
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
                <Suspense fallback={<>Give your child meaningful daily practice through guided English learning games that build strong foundations in letters & sounds, spelling, vocabulary, sentence making, reading, grammar, and confident speaking.</>}>
                  <AutoLinkedText text="Give your child meaningful daily practice through guided English learning games that build strong foundations in letters & sounds, spelling, vocabulary, sentence making, reading, grammar, and confident speaking." />
                </Suspense>
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
        </>
      ) : null}

      {showDeferredSections ? (
        <>
          <Suspense fallback={null}>
            <GlobalLearnersMapSection />
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
                    <p className="mt-3 text-gray-700 sm:text-base">
                      <Suspense fallback={<>Clear, step-by-step guides for parents asking what phonics is, why it matters, how to teach it at home, and how to make daily reading support feel manageable.</>}>
                        <AutoLinkedText text="Clear, step-by-step guides for parents asking what phonics is, why it matters, how to teach it at home, and how to make daily reading support feel manageable." />
                      </Suspense>
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3 lg:w-[360px] lg:grid-cols-1">
                    {PARENT_HELP_POINTS.map((item) => (
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

          <Suspense fallback={null}>
            <ParentReassurance />
          </Suspense>

          <Suspense fallback={null}>
            <FinalCTASection />
          </Suspense>

        </>
      ) : null}

    </>
  );
}
