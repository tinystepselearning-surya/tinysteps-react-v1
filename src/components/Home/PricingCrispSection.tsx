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
            <CollapsibleCard title="Starter Plan" subtext="8 Live Classes/Month • ₹4,400" icon={<span>🎯</span>}>
              <ul className="list-disc pl-5 space-y-1">
                <li>8 live classes per month (2x/week).</li>
                <li>Flexible scheduling and easy reschedules.</li>
                <li>Weekly AI insight recap + nudges.</li>
                <li>Parent dashboard + recorded sessions.</li>
              </ul>
              <div className="mt-3 text-sm text-gray-600">Perfect for calmer schedules, new learners ages 3–6, or families easing in.</div>
              <div className="mt-4 flex gap-2">
                <Button size="sm">Start Trial</Button>
                <Button size="sm" variant="outline">Learn More</Button>
              </div>
            </CollapsibleCard>
          </div>

          <div className="max-w-sm">
            <CollapsibleCard title="🌟 Growth Plan (Most Popular)" subtext="12 Live Classes/Month • ₹6,600" icon={<span>🌟</span>} defaultOpen>
              <ul className="list-disc pl-5 space-y-1">
                <li>12 live classes per month (3x/week).</li>
                <li>Detailed weekly video & PDF reports.</li>
                <li>Custom curriculum packs + practice sheets.</li>
                <li>Priority mentor support + WhatsApp hotline.</li>
                <li>Monthly parent strategy call.</li>
              </ul>
              <div className="mt-3 text-sm text-gray-600">Best for steady growth, ages 5–10, and families targeting visible 12-week progress.</div>
              <div className="mt-4 flex gap-2">
                <Button size="sm">Start Trial</Button>
                <Button size="sm" variant="outline">Learn More</Button>
              </div>
              <div className="mt-3 text-xs text-gray-600">“Worth every rupee. We saw change in six weeks.” — Parent ⭐⭐⭐⭐⭐</div>
            </CollapsibleCard>
          </div>

          <div className="max-w-sm">
            <CollapsibleCard title="Intensive Plan" subtext="16 Live Classes/Month • ₹8,800" icon={<span>🚀</span>}>
              <ul className="list-disc pl-5 space-y-1">
                <li>16 live classes per month (4x/week).</li>
                <li>Fully flexible scheduling + priority slots.</li>
                <li>Daily nudges and micro-feedback.</li>
                <li>Senior mentor + capstone showreel.</li>
                <li>Bi-weekly parent consults.</li>
              </ul>
              <div className="mt-3 text-sm text-gray-600">Ideal for acceleration, competition prep, or fast catch-up across ages 7–12.</div>
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
