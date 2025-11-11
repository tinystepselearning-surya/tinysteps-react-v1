// @ts-nocheck
import React from 'react';
import Footer from '../components/common/Footer';
import ConversionHero from '../components/Home/ConversionHero';
import WhyChooseCollapsibleSection from '../components/Home/WhyChooseCollapsibleSection';
import StepTimeline from '../components/Home/StepTimeline';
import CoursesSection from '../components/Home/CoursesSection';
import SocialProofCrispSection from '../components/Home/SocialProofCrispSection';
import PricingCrispSection from '../components/Home/PricingCrispSection';
import FAQSection from '../components/Home/FAQSection';
import FinalCTASection from '../components/Home/FinalCTASection';
import Meta from '../components/common/Meta';
import TrustSignals from '../components/Trust/TrustSignals';
import TestimonialsCarousel from '../components/Home/TestimonialsCarousel';
import TeacherProfiles from '../components/Home/TeacherProfiles';
import TrialForm from '../components/forms/TrialForm';

export default function HomePage() {
  return (
    <>
      <Meta
        title="Tiny Steps Online School | Phonics, Grammar & Public Speaking Classes for Indian Kids (Ages 3-12)"
        description="Expert 1:1 online English classes for ages 3-12. Master phonics, grammar & public speaking. ₹4,000-10,500/month. Free assessment class. 95% see improvement in 3 months."
        keywords="phonics classes online India, grammar classes for kids, public speaking courses children, English learning kids ages 3-12, online English tuition India, best English coaching India"
        canonical="https://tinystepslearning.com/"
      />
      <ConversionHero />
      <TrustSignals />
      <TestimonialsCarousel />
      <TeacherProfiles />
      <WhyChooseCollapsibleSection />
      <StepTimeline />
      <CoursesSection />
      <SocialProofCrispSection />
      <section id="book-trial" className="px-6 py-12">
        <div className="mx-auto max-w-6xl grid gap-8 rounded-3xl bg-white/80 p-8 shadow-card-hover md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="gradient-chip w-max">AI-curated learning journey</div>
            <h2 className="text-3xl font-semibold text-gray-900">3500+ students, 8 countries, one personalized path</h2>
            <p className="text-gray-700">Our AI engine maps your child’s current mastery, curates the weekly plan, and sends parents actionable insights every Friday.</p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>🌅 Sunrise-inspired lessons that stay joyful and calm</li>
              <li>🌍 Learners in India, US, UK, Canada, Singapore, Malaysia, Vietnam, UAE, Australia</li>
              <li>📊 Parent dashboard with AI-driven learning path insights</li>
            </ul>
          </div>
          <div className="glass-panel p-6">
            <h3 className="text-lg font-semibold text-gray-900">Book a Free Trial & WhatsApp us instantly</h3>
            <p className="mt-1 text-sm text-gray-600">Fill the form—details auto-share with our advisor on WhatsApp (+91 96183 98383).</p>
            <div className="mt-4">
              <TrialForm context="home_book_trial" />
            </div>
          </div>
        </div>
      </section>
      <PricingCrispSection />
      <FAQSection />
      <FinalCTASection />
      <Footer />
    </>
  );
}
