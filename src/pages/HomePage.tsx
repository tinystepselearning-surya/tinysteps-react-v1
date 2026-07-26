// src/pages/HomePage.tsx
// @ts-nocheck
import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { organizationSchema, PUBLIC_FACTS, websiteSchema } from "../lib/schemas";
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

const PARENT_HELP_POINTS = [
  "Short, practical guides",
  "Home routines that fit real schedules",
  "Friendly support for common phonics questions",
];
const CORE_PROGRAMS_TEXT = `${PUBLIC_FACTS.corePrograms[0]}, ${PUBLIC_FACTS.corePrograms[1]}, and ${PUBLIC_FACTS.corePrograms[2]}`;
const homeSeoTitle = "Online English Classes for Kids in India | Tiny Steps";
const homeSeoDescription =
  "Live 1:1 online English classes for kids ages 3–12. Phonics, reading, grammar and speaking with a free assessment and parent updates.";
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
        keywords="online english classes for kids, online english classes for children, phonics classes for kids, online grammar classes for kids, spoken english classes for kids online, english tutor for kids online"
        canonical={homeCanonicalUrl}
        jsonLd={[organizationSchema, websiteSchema, quickAnswerFaqSchema]}
      />

      {/* HERO */}
      <ConversionHero />

      <section className="px-6 pb-6">
        <div className="mx-auto max-w-6xl rounded-[30px] border border-slate-200/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98)_0%,rgba(247,250,255,0.98)_55%,rgba(255,251,245,0.98)_100%)] p-6 shadow-[0_22px_60px_rgba(15,23,42,0.06)] ring-1 ring-white/70 sm:p-8">
          <div className="inline-flex rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-600 shadow-sm">
            Tiny Steps approach
          </div>
          <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-3xl">Structured support before parents choose a plan</h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-700 sm:text-base">
            Tiny Steps classes are designed by Priya and the Tiny Steps academic team for children who need structured support in phonics, reading, grammar, sentence formation and confident speaking.
          </p>
        </div>
      </section>

      <section id="free-assessment-checklist" className="px-6 py-4">
        <div className="mx-auto grid max-w-[84rem] gap-6 lg:grid-cols-[1.08fr_0.92fr] xl:gap-8">
          <div className="relative overflow-hidden rounded-[34px] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.95)_0%,rgba(245,252,255,0.96)_30%,rgba(236,245,255,0.96)_62%,rgba(255,248,238,0.95)_100%)] p-6 shadow-[0_30px_90px_rgba(62,84,120,0.14)] ring-1 ring-white/80 sm:p-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(90deg,rgba(99,102,241,0.08)_0%,rgba(56,189,248,0.08)_48%,rgba(251,191,36,0.06)_100%)]" />
            <div className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-sky-200/30 blur-3xl" />
            <div className="pointer-events-none absolute -left-8 bottom-0 h-36 w-36 rounded-full bg-indigo-100/35 blur-3xl" />
            <div className="relative inline-flex rounded-full border border-sky-200/80 bg-white/82 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.30em] text-sky-900 shadow-[0_10px_25px_rgba(125,160,210,0.16)] backdrop-blur">
              Free assessment
            </div>
            <h2 className="mt-5 max-w-xl text-2xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-[2.15rem] sm:leading-[1.05]">What we check in the free assessment</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-700 sm:text-[1.02rem]">
              The assessment helps Tiny Steps understand where your child is currently getting stuck before recommending the best starting point.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                'Letter-sound knowledge',
                'Blending ability',
                'CVC word reading',
                'Reading fluency',
                'Sentence formation',
                'Grammar accuracy',
                'Speaking confidence',
                'Pronunciation clarity',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[22px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.92)_0%,rgba(248,251,255,0.96)_100%)] px-4 py-3.5 text-sm font-medium tracking-[-0.01em] text-slate-700 shadow-[0_14px_34px_rgba(76,98,136,0.08)] backdrop-blur"
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Link
                to="/book-demo"
                className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#0f172a_0%,#1e3a8a_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(37,99,235,0.28)] transition hover:brightness-110"
              >
                Book Free Assessment
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[34px] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.95)_0%,rgba(240,248,255,0.97)_34%,rgba(236,247,255,0.96)_64%,rgba(247,244,255,0.95)_100%)] p-6 shadow-[0_30px_90px_rgba(62,84,120,0.14)] ring-1 ring-white/80 sm:p-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(90deg,rgba(56,189,248,0.08)_0%,rgba(14,165,233,0.08)_45%,rgba(99,102,241,0.08)_100%)]" />
            <div className="pointer-events-none absolute -left-8 top-0 h-40 w-40 rounded-full bg-sky-200/30 blur-3xl" />
            <div className="pointer-events-none absolute -right-8 bottom-0 h-36 w-36 rounded-full bg-violet-100/35 blur-3xl" />
            <div className="relative inline-flex rounded-full border border-sky-200/80 bg-white/82 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.30em] text-sky-900 shadow-[0_10px_25px_rgba(125,160,210,0.16)] backdrop-blur">
              Age guidance
            </div>
            <h2 className="mt-5 max-w-xl text-2xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-[2.15rem] sm:leading-[1.05]">Common starting points by age</h2>
            <div className="mt-5 overflow-hidden rounded-[26px] border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(247,250,255,0.97)_100%)] shadow-[0_18px_44px_rgba(76,98,136,0.08)] backdrop-blur">
              <table className="w-full table-fixed border-collapse text-left text-sm text-slate-700">
                <colgroup>
                  <col className="w-[15%] min-w-[84px]" />
                  <col className="w-[38%]" />
                  <col className="w-[47%]" />
                </colgroup>
                <thead className="bg-[linear-gradient(180deg,#f8fcff_0%,#eef6ff_100%)] text-slate-900">
                  <tr>
                    <th className="px-5 py-4 text-[0.95rem] font-semibold tracking-[-0.01em]">Age</th>
                    <th className="px-5 py-4 text-[0.95rem] font-semibold tracking-[-0.01em]">Parent concern</th>
                    <th className="px-5 py-4 text-[0.95rem] font-semibold tracking-[-0.01em]">Tiny Steps focus</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['3–4', 'Not speaking clearly', 'Vocabulary, sounds, confidence'],
                    ['5–6', 'Knows letters but cannot read', 'Phonics, blending, CVC'],
                    ['7–8', 'Reads slowly, grammar mistakes', 'Fluency + grammar basics'],
                    ['9–12', 'Hesitates to speak', 'Public speaking, sentence confidence'],
                  ].map(([age, concern, focus]) => (
                    <tr key={age} className="border-t border-slate-200/70 odd:bg-white/85 even:bg-sky-50/30">
                      <td className="whitespace-nowrap px-5 py-4 align-middle text-base font-semibold tracking-[-0.02em] text-slate-900">{age}</td>
                      <td className="px-5 py-4 align-middle text-[0.98rem] leading-7 text-slate-700">{concern}</td>
                      <td className="px-5 py-4 align-middle text-[0.98rem] leading-7 text-slate-700">{focus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

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
            <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Explore the Main Tiny Steps Learning Paths</h2>
            <p className="mt-2 text-sm text-slate-600">
              For age-based pathways, parents can start with{' '}
              <Link to="/english-classes-for-4-year-old" className="font-medium underline underline-offset-2 hover:text-slate-900">
                English classes for 4-year-old children
              </Link>{' '}
              or{' '}
              <Link to="/english-classes-for-5-year-old" className="font-medium underline underline-offset-2 hover:text-slate-900">
                support for 5-year-old children
              </Link>.
              {' '}Families comparing providers can also review our{' '}
              <Link to="/best-online-phonics-classes-for-kids-in-india" className="font-medium underline underline-offset-2 hover:text-slate-900">
                best online phonics classes for kids in India
              </Link>{' '}
              guide.
              <br className="hidden sm:block" />
              Not sure where to begin? See <Link to="/class-samples" className="font-medium underline underline-offset-2 hover:text-slate-900">live class samples</Link>, discover <Link to="/why-tiny-steps" className="font-medium underline underline-offset-2 hover:text-slate-900">why parents choose us</Link>, or browse <Link to="/courses" className="font-medium underline underline-offset-2 hover:text-slate-900">all online courses</Link>.
              {' '}Start with <Link to="/online-english-classes-for-kids" className="font-medium underline underline-offset-2 hover:text-slate-900">online English classes for kids</Link>, compare <Link to="/spoken-english-classes-for-kids-online" className="font-medium underline underline-offset-2 hover:text-slate-900">spoken English classes online</Link>, and if you are searching locally, explore <Link to="/online-english-classes-hyderabad" className="font-medium underline underline-offset-2 hover:text-slate-900">Hyderabad online English classes</Link>.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Link
              to="/phonics"
              className="group relative overflow-hidden rounded-[30px] border border-slate-200 bg-[linear-gradient(145deg,#ffffff_0%,#f3fff8_55%,#ffffff_100%)] p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400/70 via-emerald-200/30 to-transparent" />
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
              className="group relative overflow-hidden rounded-[30px] border border-slate-200 bg-[linear-gradient(145deg,#ffffff_0%,#f5fbff_55%,#ffffff_100%)] p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400/70 via-sky-200/30 to-transparent" />
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
              className="group relative overflow-hidden rounded-[30px] border border-slate-200 bg-[linear-gradient(145deg,#ffffff_0%,#fff8ef_55%,#ffffff_100%)] p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400/70 via-orange-200/30 to-transparent" />
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
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Link
              to="/online-english-classes-for-kids"
              className="group rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_18px_44px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-slate-300"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">National parent page</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">Online English Classes for Kids</h3>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                Start here if you want the full Tiny Steps overview across phonics, reading, grammar, and speaking support.
              </p>
            </Link>
            <Link
              to="/spoken-english-classes-for-kids-online"
              className="group rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_18px_44px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-slate-300"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Speaking confidence page</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">Spoken English Classes for Kids Online</h3>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                Best for children who give one-word answers, understand English but hesitate to speak, or need sentence expansion.
              </p>
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[32px] border border-slate-200 bg-[linear-gradient(145deg,#ffffff_0%,#f8fbff_48%,#fff8ef_100%)] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.05)] sm:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">Popular parent entry points</p>
                <h2 className="mt-2 text-2xl font-semibold text-gray-900 sm:text-3xl">Choose the right English starting page for your child</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-700 sm:text-base">
                  Compare the main national page for English support, a speaking-confidence page for hesitant communicators, and the Hyderabad-focused page for local parents.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Link to="/online-english-classes-for-kids" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300">
                  Online English Classes for Kids
                </Link>
                <Link to="/spoken-english-classes-for-kids-online" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300">
                  Spoken English Classes Online
                </Link>
                <Link to="/online-english-classes-hyderabad" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300">
                  Hyderabad Parents
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-2 pb-8">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-sky-100 bg-[linear-gradient(145deg,#ffffff_0%,#f7fbff_52%,#fff8ef_100%)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">English Excellence</p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-900">Free Practice Before Structured Learning</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-700">
                Start with child-friendly games, then move into a stronger Tiny Steps learning path.
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                <Suspense fallback={<>Give your child meaningful daily practice through guided English learning games that build strong foundations in letters & sounds, spelling, vocabulary, sentence making, reading, grammar, and confident speaking.</>}>
                  <AutoLinkedText text="Give your child meaningful daily practice through guided English learning games that build strong foundations in letters & sounds, spelling, vocabulary, sentence making, reading, grammar, and confident speaking." />
                </Suspense>
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Try the free web versions:{' '}
                <Link to="/free-letter-tracing-game-for-kids" className="font-semibold underline underline-offset-2 hover:text-slate-900">
                  Free ABC Tracing Game
                </Link>
                {' '}and{' '}
                <Link to="/letter-tracing-with-sounds-game" className="font-semibold underline underline-offset-2 hover:text-slate-900">
                  Tracing With Sounds
                </Link>
                . Parents can also move next to{' '}
                <Link to="/online-english-classes-for-kids" className="font-semibold underline underline-offset-2 hover:text-slate-900">
                  online English classes for kids
                </Link>
                .
              </p>
            </div>
            <Link
              to="/phonics-learning-games"
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
