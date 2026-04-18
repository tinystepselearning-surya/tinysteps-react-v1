import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../Button/Button';

type FinalCTASectionProps = {
  ratingValue?: string;
  ratingCount?: number;
};

const FinalCTASection: React.FC<FinalCTASectionProps> = ({ ratingValue = '4.9/5', ratingCount = 0 }) => {
  return (
    <section className="bg-gradient-to-b from-white to-primary-50 py-20">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-heading text-3xl font-bold md:text-4xl">Ready to see your child’s English grow, week by week?</h2>
        <div className="mx-auto mt-6 space-y-3 text-gray-800">
          <p>Start with a free 1:1 assessment class. We’ll gently check your child’s current level and suggest the right Tiny Steps path for phonics, grammar or public speaking.</p>
          <ul className="mx-auto mt-4 max-w-md space-y-2 text-left text-gray-700">
            <li className="flex items-start">
              <span className="mr-3 mt-1 text-primary-600">•</span>
              <span>35-minute 1:1 session with a Tiny Steps mentor</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 mt-1 text-primary-600">•</span>
              <span>Age-appropriate activities in phonics, grammar or speaking</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 mt-1 text-primary-600">•</span>
              <span>Clear next-step recommendation for parents</span>
            </li>
          </ul>
        </div>
        <div className="mt-8 flex flex-col items-center gap-2">
          <Link to="/?book=1">
            <Button size="lg" aria-label="Book Free Assessment Class">Book Free Assessment Class</Button>
          </Link>
          <p className="text-sm text-gray-600">Takes less than 1 minute to book.</p>
          <div className="mt-4 text-sm text-gray-700">
            <p>Join 5000+ families across 15+ countries, including India, UAE, Vietnam, Singapore, Malaysia, UK, Canada, USA, Sweden, Germany, Australia, Sri Lanka, and Pakistan.</p>
            <p>⭐⭐⭐⭐⭐ {ratingValue} - Parent Reviews{ratingCount > 0 ? ` (${ratingCount} verified)` : ''} • 95% see improvement • 89% more confidence • 92% enjoy English</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;
