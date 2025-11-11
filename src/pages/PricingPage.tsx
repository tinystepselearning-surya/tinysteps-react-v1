// @ts-nocheck
import React, { useEffect } from 'react';
import PricingCrispSection from '../components/Home/PricingCrispSection';
import Meta from '../components/common/Meta';

const PricingPage: React.FC = () => {
  useEffect(() => { document.title = 'Pricing | Tiny Steps'; }, []);
  const offerCatalog = {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: 'Tiny Steps Plans',
    itemListElement: [
      { '@type': 'Offer', name: 'STARTER', price: '4000', priceCurrency: 'INR' },
      { '@type': 'Offer', name: 'GROWTH', price: '7500', priceCurrency: 'INR' },
      { '@type': 'Offer', name: 'INTENSIVE', price: '10500', priceCurrency: 'INR' }
    ]
  };
  return (
    <div className="bg-white">
      <Meta title="Pricing | Tiny Steps Online School" description="Flexible plans for Indian families. Starter, Growth, Intensive. Free assessment. Pause or resume anytime." canonical="https://tinystepslearning.com/pricing" jsonLd={offerCatalog} />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="font-heading text-3xl font-bold md:text-4xl">Flexible Plans for Indian Families</h1>
      </div>
      <PricingCrispSection />
    </div>
  );
};

export default PricingPage;

