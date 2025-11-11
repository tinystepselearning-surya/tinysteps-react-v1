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
      <PricingCrispSection />
      <FAQSection />
      <FinalCTASection />
      <Footer />
    </>
  );
}
