// src/pages/HomePage.tsx
// @ts-nocheck
import React, { lazy, startTransition, Suspense, useEffect, useRef, useState } from "react";
import { createWebPageSchema, organizationSchema, PUBLIC_FACTS, websiteSchema } from "../lib/schemas";
import Meta from "../components/common/Meta";
import ConversionHero from "../components/Home/ConversionHero";
import HomeEntitySummarySection from "../components/Home/HomeEntitySummarySection";
import {
  AssessmentStartPointsSection,
  ClassSamplesSection,
  HomeFaqSection,
  LearningPathsSection,
  ParentProblemRecognitionSection,
  TrustEvidenceSection,
  TrustSnapshotSection,
  WhyTinyStepsSection,
} from "../components/Home/HomeScrollJourneySections";

const ParentReassurance = lazy(() => import("../components/programs/ParentReassurance"));
const GlobalLearnersMapSection = lazy(() => import("../components/Home/GlobalLearnersMapSection"));
const StepTimeline = lazy(() => import("../components/Home/StepTimeline"));
const PricingCrispSection = lazy(() => import("../components/Home/PricingCrispSection"));
const FinalCTASection = lazy(() => import("../components/Home/FinalCTASection"));
const LearningJourneyRoadmapPPT = lazy(async () => {
  const mod = await import("./KidsEnglishExcellence");
  return { default: mod.LearningJourneyRoadmapPPT };
});

const homeSeoTitle = "Online English Classes for Kids in India | Tiny Steps";
const homeSeoDescription =
  "Live 1:1 online English classes for kids ages 3–12. Phonics, reading, grammar and speaking with a free 35-minute 1:1 online demo assessment class and parent updates.";
const homeCanonicalPath = "/";
const homeCanonicalUrl =
  homeCanonicalPath === "/" ? `${PUBLIC_FACTS.primaryWebsite}/` : `${PUBLIC_FACTS.primaryWebsite}${homeCanonicalPath}`;

const homeWebPageSchema = {
  ...createWebPageSchema({
    name: "Tiny Steps Learning — Online English Classes for Kids",
    description: homeSeoDescription,
    url: homeCanonicalUrl,
  }),
  "@id": `${homeCanonicalUrl}#webpage`,
  mainEntity: {
    "@id": `${PUBLIC_FACTS.primaryWebsite}/#educational-organization`,
  },
  about: [
    { "@type": "Thing", name: "Online English classes for children" },
    { "@type": "Thing", name: "Phonics and reading" },
    { "@type": "Thing", name: "Grammar and sentence building" },
    { "@type": "Thing", name: "Speaking and communication" },
  ],
  audience: {
    "@type": "EducationalAudience",
    educationalRole: "student",
    audienceType: "Children aged 3–12",
  },
};

const homeFaqItems = [
  {
    question: "What happens in the free 35-minute demo assessment?",
    answer:
      "The teacher checks the child’s current level across the skills that matter for the concern you shared, such as letter sounds, blending, reading fluency, sentence formation, grammar accuracy, pronunciation, or speaking confidence. The goal is to recommend the right starting point rather than place every child into the same lesson.",
  },
  {
    question: "How do you decide whether my child needs phonics, grammar, or speaking support?",
    answer:
      "Tiny Steps looks at the child’s current bottleneck. A child who cannot blend may need phonics first, while a child who reads comfortably but struggles to form sentences may need grammar or speaking support. The recommended path is based on demonstrated skills, not age alone.",
  },
  {
    question: "Are Tiny Steps classes 1:1 or group classes?",
    answer:
      `Classes are conducted through ${PUBLIC_FACTS.deliveryModel} in one-on-one and small-group formats. Standard 1:1 classes are ${PUBLIC_FACTS.sessionDuration}; small-group sessions are longer depending on group size.`,
  },
  {
    question: "How do parents know whether their child is improving?",
    answer:
      "Parents receive clear progress visibility on what the child is learning, where improvement is showing, and what the next focus should be. The learning journey is organised around named stages and milestones rather than unrelated topics.",
  },
];

const homeFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://tinystepslearning.com/#parent-faq",
  mainEntity: homeFaqItems.map((item) => ({
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
  const deferredAnchorRef = useRef<HTMLDivElement | null>(null);
  const [showPrimaryBelowFoldSections, setShowPrimaryBelowFoldSections] = useState(false);
  const [showDeferredSections, setShowDeferredSections] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    let settled = false;
    let observer: IntersectionObserver | null = null;
    let idleId: number | undefined;
    let timeoutId: number | undefined;

    const activate = () => {
      if (settled) return;
      settled = true;
      startTransition(() => setShowPrimaryBelowFoldSections(true));
      observer?.disconnect();
      if (idleId !== undefined && typeof win.cancelIdleCallback === "function") {
        win.cancelIdleCallback(idleId);
        idleId = undefined;
      }
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    };

    const target = belowFoldAnchorRef.current;
    if (target && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) activate();
        },
        { rootMargin: "900px 0px 900px 0px", threshold: 0.01 }
      );
      observer.observe(target);
    }

    if (typeof win.requestIdleCallback === "function") {
      idleId = win.requestIdleCallback(activate, { timeout: 6000 });
    } else {
      timeoutId = window.setTimeout(activate, 4200);
    }

    return () => {
      observer?.disconnect();
      if (idleId !== undefined && typeof win.cancelIdleCallback === "function") {
        win.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof navigator !== "undefined" && navigator.webdriver) return;

    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const isMobileViewport = window.matchMedia("(max-width: 767px)").matches;
    const connection = (navigator as any)?.connection;
    const effectiveType =
      typeof connection?.effectiveType === "string" ? connection.effectiveType.toLowerCase() : "";
    const isConstrainedNetwork =
      Boolean(connection?.saveData) || effectiveType === "slow-2g" || effectiveType === "2g";
    const fallbackDelayMs = isMobileViewport
      ? isConstrainedNetwork ? 18000 : 14000
      : isConstrainedNetwork ? 20000 : 16000;

    let settled = false;
    let observer: IntersectionObserver | null = null;
    let idleId: number | undefined;
    let timeoutId: number | undefined;

    const activate = () => {
      if (settled) return;
      settled = true;
      startTransition(() => setShowDeferredSections(true));
      observer?.disconnect();
      if (idleId !== undefined && typeof win.cancelIdleCallback === "function") {
        win.cancelIdleCallback(idleId);
        idleId = undefined;
      }
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    };

    const target = deferredAnchorRef.current;
    if (target && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) activate();
        },
        { rootMargin: "1200px 0px 1200px 0px", threshold: 0.01 }
      );
      observer.observe(target);
    }

    if (!isConstrainedNetwork) {
      if (typeof win.requestIdleCallback === "function") {
        idleId = win.requestIdleCallback(activate, { timeout: fallbackDelayMs });
      } else {
        timeoutId = window.setTimeout(activate, fallbackDelayMs);
      }
    }

    return () => {
      observer?.disconnect();
      if (idleId !== undefined && typeof win.cancelIdleCallback === "function") {
        win.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <>
      <Meta
        title={homeSeoTitle}
        description={homeSeoDescription}
        keywords="online english classes for kids, online english classes for children, phonics classes for kids, online grammar classes for kids, spoken english classes for kids online, english tutor for kids online"
        canonical={homeCanonicalUrl}
        jsonLd={[organizationSchema, websiteSchema, homeWebPageSchema, homeFaqSchema]}
      />

      {/* REVIEW ACTION 01 — HOOK: Keep the existing hero focused on what Tiny Steps is and the primary demo action. */}
      <ConversionHero />

      {/* AI/ENTITY SUMMARY: Keep critical brand facts and programme ownership in the initial crawlable DOM. */}
      <HomeEntitySummarySection />

      {/* REVIEW ACTION 02 — IDENTIFICATION: Replace the old generic approach block with parent problem recognition. */}
      <ParentProblemRecognitionSection />

      {/* REVIEW ACTION 03 — EARLY TRUST: Give a compact credibility snapshot without restarting the company story. */}
      <TrustSnapshotSection />

      {/* REVIEW ACTION 04 — DIAGNOSIS: Explain what the assessment checks and show common age-based starting points. */}
      <AssessmentStartPointsSection />

      <div ref={belowFoldAnchorRef} className="h-px w-full" aria-hidden="true" />

      {showPrimaryBelowFoldSections ? (
        <>
          {/* REVIEW ACTION 05 — PROGRAMMES: Keep only the three parent-relevant learning paths; remove SEO/location entry-point navigation. */}
          <LearningPathsSection />

          {/* REVIEW ACTION 06 — DIFFERENTIATION: Explain why the Tiny Steps system is different before asking for deeper trust. */}
          <WhyTinyStepsSection />
        </>
      ) : null}

      <div ref={deferredAnchorRef} className="h-px w-full" aria-hidden="true" />

      {showDeferredSections ? (
        <>
          {/* REVIEW ACTION 07 — PROOF: Replace unsupported outcome percentages with evidence parents can inspect. */}
          <TrustEvidenceSection />

          {/* REVIEW ACTION 08 — GLOBAL PROOF: Keep the learner map as concrete social proof, now inside the proof chapter. */}
          <div id="global-learners-proof">
            <Suspense fallback={null}>
              <GlobalLearnersMapSection />
            </Suspense>
          </div>

          {/* REVIEW ACTION 09 — JOURNEY: Show the high-level roadmap before the detailed learning-stage mechanics. */}
          <section className="px-6 py-12">
            <div className="mx-auto max-w-6xl">
              <Suspense fallback={null}>
                <LearningJourneyRoadmapPPT />
              </Suspense>
            </div>
          </section>

          {/* REVIEW ACTION 10 — METHOD: Explain child learning, teaching approach, parent visibility, and stage progression. */}
          <Suspense fallback={null}>
            <StepTimeline />
          </Suspense>

          {/* REVIEW ACTION 11 — CLASS SAMPLES: Give concrete classroom evidence immediately before the pricing decision. */}
          <ClassSamplesSection />

          {/* REVIEW ACTION 12 — PRICE: Show plans only after the parent understands fit, method, and classroom experience. */}
          <Suspense fallback={null}>
            <PricingCrispSection />
          </Suspense>

          {/* REVIEW ACTION 13 — RISK REVERSAL: Explain assessment → personalised plan → parent decides, with no commitment pressure. */}
          <Suspense fallback={null}>
            <ParentReassurance />
          </Suspense>

          {/* REVIEW ACTION 14 — OBJECTIONS: Replace the mid-page Quick Answer reset with a short practical FAQ near conversion. */}
          <HomeFaqSection items={homeFaqItems} />

          {/* REVIEW ACTION 15 — FINAL CONVERSION: End with one clear booking action after the full parent decision journey. */}
          <Suspense fallback={null}>
            <FinalCTASection />
          </Suspense>
        </>
      ) : null}
    </>
  );
}
