// @ts-nocheck
import React from 'react';
import Footer from '../components/common/Footer';
import ConversionHero from '../components/Home/ConversionHero';
import WhyParentsSection from '../components/Home/WhyParentsSection';
import LearningJourneySection from '../components/Home/LearningJourneySection';
import StatsProofSection from '../components/Home/StatsProofSection';
import HowToStartSection from '../components/Home/HowToStartSection';
import PricingSection from '../components/Home/PricingSection';
import FAQSection from '../components/Home/FAQSection';
import FinalCTASection from '../components/Home/FinalCTASection';

export default function HomePage() {
  return (
    <>
      <ConversionHero />
      <WhyParentsSection />
      <LearningJourneySection />
      <StatsProofSection />
      <HowToStartSection />
      <PricingSection />
      <FAQSection />
      <FinalCTASection />
      <Footer />
    </>
  );
}

