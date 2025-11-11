import React from 'react';
import { CollapsibleCard } from '../common/CollapsibleCard';
import Button from '../Button/Button';

const WhyChooseCollapsibleSection: React.FC = () => {
  return (
    <section className="bg-gradient-to-b from-white to-slate-50/50 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <h2 className="font-heading text-3xl font-bold md:text-4xl">Why Choose Tiny Steps</h2>
          <p className="mt-2 text-base text-gray-700">Crisp, scannable benefits — details on demand</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <CollapsibleCard
            icon={<span>📍</span>}
            title="Customized to YOUR Child"
            subtext="Not one-size-fits-all"
            cta={<Button size="sm" variant="outline">Learn More</Button>}
          >
            <ul className="list-disc pl-5 space-y-1">
              <li>Every lesson adapted to child's level</li>
              <li>Struggling? We focus there</li>
              <li>Advanced? We skip basics</li>
              <li>Shy? We build confidence gradually</li>
            </ul>
          </CollapsibleCard>

          <CollapsibleCard
            icon={<span>👩‍🏫</span>}
            title="Expert Teachers"
            subtext="Certified. Experienced. Personal"
            cta={<Button size="sm" variant="outline">Meet Our Teachers</Button>}
          >
            <ul className="list-disc pl-5 space-y-1">
              <li>Certified in early childhood education</li>
              <li>Trained in phonics & speech</li>
              <li>Native English speakers</li>
              <li>Average 8 years experience</li>
              <li>Available 5 AM – 10 PM IST</li>
            </ul>
          </CollapsibleCard>

          <CollapsibleCard
            icon={<span>📊</span>}
            title="You See Progress. Every Week"
            subtext="Reports and milestones"
            cta={<Button size="sm" variant="outline">Sample Report</Button>}
          >
            <ul className="list-disc pl-5 space-y-1">
              <li>What was learned each week</li>
              <li>Specific improvements (pronunciation, grammar)</li>
              <li>Home practice (5 mins/day)</li>
              <li>Next week's goals</li>
            </ul>
          </CollapsibleCard>

          <CollapsibleCard
            icon={<span>⏰</span>}
            title="Classes When You Want"
            subtext="Flexible & reschedulable"
            cta={<Button size="sm" variant="outline">Check Availability</Button>}
          >
            <ul className="list-disc pl-5 space-y-1">
              <li>Choose your own schedule</li>
              <li>Reschedule up to 24 hours before</li>
              <li>No fixed batch times</li>
              <li>Pause anytime, resume anytime</li>
            </ul>
          </CollapsibleCard>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseCollapsibleSection;

