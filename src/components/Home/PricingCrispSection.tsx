import React from 'react';
import { CollapsibleCard } from '../common/CollapsibleCard';
import Button from '../Button/Button';

const PricingCrispSection: React.FC = () => {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <h3 className="font-heading text-2xl font-bold md:text-3xl">Flexible Plans for Indian Families</h3>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="max-w-sm">
            <CollapsibleCard title="STARTER PLAN" subtext="4 Classes/Month • ₹4,000" icon={<span>🎯</span>}>
              <ul className="list-disc pl-5 space-y-1">
                <li>4 classes per month</li>
                <li>Flexible scheduling</li>
                <li>Weekly progress reports</li>
                <li>24-hour rescheduling</li>
                <li>Access to all materials</li>
              </ul>
              <div className="mt-3 text-sm text-gray-600">Best for testing the program, busy schedules, ages 3–5.</div>
              <div className="mt-4 flex gap-2">
                <Button size="sm">Start Trial</Button>
                <Button size="sm" variant="outline">Learn More</Button>
              </div>
            </CollapsibleCard>
          </div>

          <div className="max-w-sm">
            <CollapsibleCard title="🌟 GROWTH PLAN (Most Popular)" subtext="8 Classes/Month • ₹7,500" icon={<span>🌟</span>} defaultOpen>
              <ul className="list-disc pl-5 space-y-1">
                <li>8 classes per month</li>
                <li>Flexible scheduling</li>
                <li>Detailed weekly reports</li>
                <li>Custom curriculum & guides</li>
                <li>Priority teacher support</li>
                <li>Free assessment & monthly review</li>
              </ul>
              <div className="mt-3 text-sm text-gray-600">Best for consistent progress, 2x/week, ages 5–8. Includes parent consultation call.</div>
              <div className="mt-4 flex gap-2">
                <Button size="sm">Start Trial</Button>
                <Button size="sm" variant="outline">Learn More</Button>
              </div>
              <div className="mt-3 text-xs text-gray-600">“Worth every rupee. Visible progress.” — Parent ⭐⭐⭐⭐⭐</div>
            </CollapsibleCard>
          </div>

          <div className="max-w-sm">
            <CollapsibleCard title="INTENSIVE PLAN" subtext="12 Classes/Month • ₹10,500" icon={<span>🚀</span>}>
              <ul className="list-disc pl-5 space-y-1">
                <li>12 classes per month</li>
                <li>Fully flexible scheduling</li>
                <li>Daily progress updates</li>
                <li>Priority teacher assignment</li>
                <li>Direct messaging & bi-weekly calls</li>
              </ul>
              <div className="mt-3 text-sm text-gray-600">Best for faster results, focused goals, ages 8–12, or catching up quickly.</div>
              <div className="mt-4 flex gap-2">
                <Button size="sm">Start Trial</Button>
                <Button size="sm" variant="outline">Learn More</Button>
              </div>
            </CollapsibleCard>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingCrispSection;

