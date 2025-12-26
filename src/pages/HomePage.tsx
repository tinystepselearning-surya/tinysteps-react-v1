// src/pages/HomePage.tsx
// @ts-nocheck
import { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import Meta from "../components/common/Meta";
import ConversionHero from "../components/Home/ConversionHero";
import TrialForm from "../components/forms/TrialForm";

// ✅ Removed sections:
// - PopularPrograms (Pick a track...)
// - InteractiveSampleActivitySection (Try a tiny activity...)
// - TestimonialsCarousel (Parent Testimonials)

const GlobalImpactSection = lazy(() => import("../components/Home/GlobalImpactSection"));
const DemoShowcase = lazy(() => import("../components/Home/DemoShowcase"));
const WhyChooseCollapsibleSectionLazy = lazy(() => import("../components/Home/WhyChooseCollapsibleSection"));
const StepTimelineLazy = lazy(() => import("../components/Home/StepTimeline"));
const SocialProofCrispSectionLazy = lazy(() => import("../components/Home/SocialProofCrispSection"));
const PricingCrispSectionLazy = lazy(() => import("../components/Home/PricingCrispSection"));
const FAQSectionLazy = lazy(() => import("../components/Home/FAQSection"));
const FinalCTASectionLazy = lazy(() => import("../components/Home/FinalCTASection"));
const FooterLazy = lazy(() => import("../components/common/Footer"));

function requestFullscreenSafe() {
  try {
    const el: any = document.documentElement;
    if (el?.requestFullscreen) return el.requestFullscreen();
    if (el?.webkitRequestFullscreen) return el.webkitRequestFullscreen(); // Safari
  } catch {
    // ignore
  }
  return Promise.resolve();
}

export default function HomePage() {
  const navigate = useNavigate();

  const goToChristmasTree = () => {
    // ✅ SPA navigation so fullscreen doesn't get dropped by reload
    navigate("/seasonal/christmas-tree");
  };

  return (
    <>
      <Meta
        title="Tiny Steps Online English School | 1:1 Phonics, Grammar & Public Speaking for Kids (3–12)"
        description="Premium 1:1 online English classes for ages 3–12. IB-aligned phonics, grammar and public speaking with kind live mentors, AI-guided practice, and simple weekly progress updates for parents. Book a free assessment class."
        keywords="phonics classes online India, grammar classes for kids, public speaking courses children, English learning kids ages 3-12, online English tuition India, best English coaching India"
        canonical="https://tinystepslearning.com/"
      />

      <ConversionHero />

      {/* Christmas banner — seasonal tile */}
      <section className="px-6 py-6">
        <div className="mx-auto max-w-6xl">
          <div
            role="button"
            tabIndex={0}
            className="group block cursor-pointer overflow-hidden rounded-2xl border bg-white p-0 shadow-lg transition hover:shadow-xl"
            aria-label="Open Christmas Tree Decorator"
            onKeyDown={async (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                await requestFullscreenSafe();
                goToChristmasTree();
              }
            }}
            onClick={async () => {
              await requestFullscreenSafe();
              goToChristmasTree();
            }}
          >
            <div className="relative flex h-28 items-center justify-between md:h-32">
              <img
                src="/seasonal/christmas/homepagetile.jpg"
                alt="Christmas banner"
                className="absolute inset-0 h-full w-full object-cover"
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/30" />

              <div className="relative z-10 flex w-full items-center justify-between px-6">
                <div className="text-white">
                  <div className="text-xl font-semibold">Merry Christmas</div>
                  <div className="text-sm opacity-90">Festive fun: decorate the tree and celebrate!</div>
                </div>

                <div className="relative z-10">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await requestFullscreenSafe();
                      goToChristmasTree();
                    }}
                  >
                    Open Game
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <GlobalImpactSection />
      </Suspense>

    

      <Suspense fallback={null}>
        <DemoShowcase />
      </Suspense>

      <Suspense fallback={null}>
        <WhyChooseCollapsibleSectionLazy />
      </Suspense>

      <Suspense fallback={null}>
        <StepTimelineLazy />
      </Suspense>



      <Suspense fallback={null}>
        <SocialProofCrispSectionLazy />
      </Suspense>

      {/* Book trial */}
      <section id="book-trial" className="px-6 py-12">
        <div className="mx-auto grid max-w-6xl gap-8 rounded-3xl bg-white/80 p-8 shadow-card-hover md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="gradient-chip w-max">AI-curated learning journey</div>
            <h2 className="text-3xl font-semibold text-gray-900">Empowering 3500+ students across 9 countries</h2>
            <p className="text-gray-700">
              Our AI engine maps your child’s current mastery, curates the weekly plan, and sends parents actionable
              insights every Friday.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>🌅 Bright-sky lessons that feel joyful and calm</li>
              <li>🌍 Learners in India, US, UK, Canada, Singapore, Malaysia, Vietnam, UAE, Australia</li>
              <li>📊 Parent dashboard with AI-driven learning path insights</li>
            </ul>
          </div>

          <div className="glass-panel p-6">
            <h3 className="text-lg font-semibold text-gray-900">Book Your Free Assessment Class</h3>
            <p className="mt-1 text-sm text-gray-600">
              Fill out the form below, and our team will contact you shortly. Your privacy is our priority.
            </p>
            <div className="mt-4">
              <TrialForm context="home_book_trial" />
            </div>
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <PricingCrispSectionLazy />
      </Suspense>

      <Suspense fallback={null}>
        <FAQSectionLazy />
      </Suspense>

      <Suspense fallback={null}>
        <FinalCTASectionLazy />
      </Suspense>

      <Suspense fallback={null}>
        <FooterLazy />
      </Suspense>
    </>
  );
}
