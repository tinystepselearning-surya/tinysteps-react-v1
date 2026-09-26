// src/pages/HomePage.tsx
// @ts-nocheck
import React, { lazy, startTransition, Suspense, useEffect, useRef, useState } from "react";
import { createWebPageSchema, organizationSchema, PUBLIC_FACTS, websiteSchema } from "../lib/schemas";
import { STANDARD_PRICING_SUMMARY } from "../config/publicOffer";
import Meta from "../components/common/Meta";
import ConversionHero from "../components/Home/ConversionHero";
import HomeEntitySummarySection from "../components/Home/HomeEntitySummarySection";
import {
  AssessmentStartPointsSection,
  ClassSamplesSection,
  HomeFaqSection,
  LearningPathsSection,
  ParentProblemRecognitionSection,
  TrustSnapshotSection,
  WhyTinyStepsSection,
} from "../components/Home/HomeScrollJourneySections";

const ParentReassurance = lazy(() => import("../components/programs/ParentReassurance"));
const GlobalLearnersMapSection = lazy(() => import("../components/Home/GlobalLearnersMapSection"));
const StepTimeline = lazy(() => import("../components/Home/StepTimeline"));
const PricingCrispSection = lazy(() => import("../components/Home/PricingCrispSection"));
const FinalCTASection = lazy(() => import("../components/Home/FinalCTASection"));

const homeSeoTitle = "Tiny Steps Learning | Online English Learning for Kids Ages 3–12";
const homeSeoDescription =
  "Tiny Steps Learning offers live 1:1 and small-group English learning for ages 3–12 across phonics and reading, grammar and sentence building, and speaking and communication. Start with a free 35-minute 1:1 online demo assessment.";
const homeCanonicalPath = "/";
const homeCanonicalUrl =
  homeCanonicalPath === "/" ? `${PUBLIC_FACTS.primaryWebsite}/` : `${PUBLIC_FACTS.primaryWebsite}${homeCanonicalPath}`;

const homeWebPageSchema = {
  ...createWebPageSchema({
    name: "Tiny Steps Learning — Online English Learning for Kids Ages 3–12",
    description: homeSeoDescription,
    url: homeCanonicalUrl,
  }),
  "@id": `${homeCanonicalUrl}#webpage`,
  mainEntity: {
    "@id": `${PUBLIC_FACTS.primaryWebsite}/#educational-organization`,
  },
  about: [
    { "@type": "Thing", name: "Online English learning for children" },
    { "@type": "Thing", name: "Phonics and decoding" },
    { "@type": "Thing", name: "Reading fluency and comprehension" },
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
    question: "What age group does Tiny Steps teach?",
    answer:
      "Tiny Steps teaches children ages 3–12. Age helps us choose appropriate tasks, but the recommended starting point is based on the child’s current skill level rather than age alone.",
  },
  {
    question: "What happens in the free 35-minute demo assessment?",
    answer:
      "The teacher checks the skills most relevant to the concern you shared, such as letter sounds, blending, reading fluency, sentence formation, grammar accuracy, pronunciation, or speaking confidence. The goal is to recommend the right starting point before enrolment.",
  },
  {
    question: "How do you choose between phonics, reading, grammar, and speaking?",
    answer:
      "Tiny Steps starts with the strongest current learning gap. Difficulty decoding unfamiliar words may point toward phonics; accurate but effortful reading may need fluency support; repeated sentence errors may need grammar; short or hesitant answers may need speaking support.",
  },
  {
    question: "Are Tiny Steps classes 1:1 or group classes?",
    answer:
      `Classes are conducted through ${PUBLIC_FACTS.deliveryModel} in one-on-one and small-group formats. Standard 1:1 classes are ${PUBLIC_FACTS.sessionDuration}; small-group sessions are longer because more children need individual response time.`,
  },
  {
    question: "How long is each Tiny Steps class?",
    answer:
      `Standard 1:1 classes are ${PUBLIC_FACTS.sessionDuration}. Small-group class duration varies by group size and format, so the current pricing page is the source of truth for the exact option you are considering.`,
  },
  {
    question: "Which platform does Tiny Steps use for live classes?",
    answer:
      "Tiny Steps conducts live online classes through Microsoft Teams. Enrolled families receive access through the scheduled class flow and parent portal.",
  },
  {
    question: "How much do Tiny Steps classes cost?",
    answer:
      `${STANDARD_PRICING_SUMMARY}. Package and teacher-format options can differ, so check the pricing page for the current complete fee structure before enrolment.`,
  },
  {
    question: "How do parents know whether their child is improving?",
    answer:
      "Parents receive clear visibility into what the child is learning, where improvement is showing, and what the next focus should be. Progress is organised around named skills and learning stages rather than unrelated topics.",
  },
  {
    question: "What if I need to cancel or reschedule a class?",
    answer:
      "Parents should give at least 24 hours’ notice when they need to cancel or reschedule. With that notice, Tiny Steps will make reasonable efforts to offer a replacement class or alternate slot, subject to teacher availability and scheduling constraints.",
  },
]

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

      {/* REVIEW ACTION 02 — IDENTIFICATION: Preserve the parent-first recognition step immediately after the hero. */}
      <ParentProblemRecognitionSection />

      {/* AI/ENTITY BRIDGE: Clarify the brand and intent owners without interrupting the hero → problem-recognition flow. */}
      <HomeEntitySummarySection />

      {/* REVIEW ACTION 03 — EARLY TRUST: Give a compact credibility snapshot without restarting the company story. */}
      <TrustSnapshotSection />

      {/* REVIEW ACTION 04 — DIAGNOSIS: Explain what the assessment may check without assigning children by age alone. */}
      <AssessmentStartPointsSection />

      <div ref={belowFoldAnchorRef} className="h-px w-full" aria-hidden="true" />

      {showPrimaryBelowFoldSections ? (
        <>
          {/* REVIEW ACTION 05 — PROGRAMMES: Keep the four parent-relevant learning paths; remove SEO/location entry-point navigation. */}
          <LearningPathsSection />

          {/* REVIEW ACTION 06 — DIFFERENTIATION: Explain why the Tiny Steps system is different before asking for deeper trust. */}
          <WhyTinyStepsSection />
        </>
      ) : null}

      <div ref={deferredAnchorRef} className="h-px w-full" aria-hidden="true" />

      {showDeferredSections ? (
        <>
          {/* REVIEW ACTION 07 — GLOBAL PROOF: Move directly into concrete social proof instead of adding a directory of proof cards. */}
          <div id="global-learners-proof">
            <Suspense fallback={null}>
              <GlobalLearnersMapSection />
            </Suspense>
          </div>

          {/* REVIEW ACTION 08 — METHOD: Explain how each pathway works without adding a second, competing journey model. */}
          <Suspense fallback={null}>
            <StepTimeline />
          </Suspense>

          {/* REVIEW ACTION 09 — CLASS SAMPLES: Give concrete classroom evidence immediately before the pricing decision. */}
          <ClassSamplesSection />

          {/* REVIEW ACTION 10 — PRICE: Show plans only after the parent understands fit, method, and classroom experience. */}
          <Suspense fallback={null}>
            <PricingCrispSection />
          </Suspense>

          {/* REVIEW ACTION 11 — RISK REVERSAL: Explain assessment → recommended starting point → parent decides. */}
          <Suspense fallback={null}>
            <ParentReassurance />
          </Suspense>

          {/* REVIEW ACTION 12 — OBJECTIONS: Keep a short practical FAQ near conversion. */}
          <HomeFaqSection items={homeFaqItems} />

          {/* REVIEW ACTION 13 — FINAL CONVERSION: End with one concise booking action, not another full information block. */}
          <Suspense fallback={null}>
            <FinalCTASection />
          </Suspense>
        </>
      ) : null}
    </>
  );
}
