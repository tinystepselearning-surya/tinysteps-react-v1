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

      {/* Summer Camp CTA */}
      <section className="px-6 py-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-sky-50 p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">Summer Camp 2026</p>
                <h2 className="mt-2 text-2xl font-semibold text-gray-900">Online Summer English Camp for ages 3–12</h2>
                <p className="mt-1 text-sm text-gray-700">Phonics, grammar, and confident speaking in 7 weeks. Limited seats.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/summer-english-camp-2026"
                  className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
                >
                  View Camp
                </Link>
                <Link
                  to="/summer-camps"
                  className="inline-flex items-center justify-center rounded-full border border-emerald-600 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition"
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
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Parents Help Hub</h2>
            <p className="mt-2 text-gray-700">Step-by-step phonics and home practice guides for ages 3–12.</p>

            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/parents" className="text-primary-600 font-medium">View all guides</Link>
              </li>
              <li>
                <Link to="/parents/getting-started" className="text-primary-600">Getting started with phonics at home</Link>
              </li>
              <li>
                <Link to="/parents/reading-at-home" className="text-primary-600">10-minute daily reading routine</Link>
              </li>
              <li>
                <Link to="/parents/phonics-mission" className="text-primary-600">How to use Phonics Mission games</Link>
              </li>
              <li>
                <Link to="/parents/common-mistakes" className="text-primary-600">Common phonics mistakes to avoid</Link>
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
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">English classes for kids worldwide</h2>
            <p className="mt-2 text-gray-700">"Searching for 'kids English classes near me'? Tiny Steps is 1:1 online, so children can learn from anywhere in the world—Hyderabad, Chennai, Mumbai, Delhi, Pune, Kolkata, London, Dubai, Singapore and more."</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {['Hyderabad','Chennai','Mumbai','Delhi NCR','Pune','Kolkata','London','Dubai','Singapore','New York','Toronto'].map((c) => (
                <span key={c} className="rounded-full bg-slate-100 px-3 py-1 text-sm">{c}</span>
              ))}
            </div>

            <div className="mt-4">
              <a href="/courses" className="inline-flex items-center rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white">See courses</a>
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
