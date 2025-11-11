import React from 'react';
import Button from '../Button/Button';

const FinalCTASection: React.FC = () => {
  return (
    <section className="bg-gradient-to-b from-white to-primary-50 py-20">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-heading text-3xl font-bold md:text-4xl">Your Child's Confidence Journey Starts Today</h2>
        <div className="mx-auto mt-6 space-y-3 text-gray-800">
          <p>You know your child is capable. You know they have so much to say. You know they're smarter than they're showing.</p>
          <p>What's holding them back? Fear, embarrassment, confidence, school pressure — none of this is permanent.</p>
          <p>The right teacher. The right approach. The right support. That's all it takes.</p>
          <p className="italic">Three months from now, you could be saying: “I don't recognize my child's confidence.”</p>
        </div>
        <div className="mt-8 flex flex-col items-center gap-2">
          <Button size="lg">BOOK FREE ASSESSMENT NOW</Button>
          <p className="text-sm text-gray-600">20 minutes • No payment • See if Tiny Steps is right for your child</p>
          <div className="mt-4 text-sm text-gray-700">
            <p>Join 3500+ families across India, the US, UK, Canada, Singapore, Malaysia, Vietnam, UAE & Australia.</p>
            <p>⭐⭐⭐⭐⭐ 4.9/5 - Parent Reviews • 95% see improvement • 89% more confidence • 92% enjoy English</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;
