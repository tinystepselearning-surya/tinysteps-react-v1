import React from 'react';
import { CollapsibleCard } from '../common/CollapsibleCard';
import Button from '../Button/Button';

const PricingCrispSection: React.FC = () => {
  return (
    <section data-animate="fade-up" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <h3 className="font-heading text-2xl font-bold md:text-3xl">
            Flexible Premium Packs for Indian Families
          </h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Starter Pack */}
          <div className="max-w-sm">
            <CollapsibleCard
              title="Starter Pack"
              subtext="8 Live 1:1 Classes • ₹4,400"
              icon={<span>🎯</span>}
            >
              <ul className="list-disc pl-5 space-y-1">
                <li>8 live 1:1 classes (35 mins each).</li>
                <li>Usually 2 classes per week (finish in ~4 weeks).</li>
                <li>Weekly AI insight recap + gentle nudges.</li>
                <li>Parent dashboard + recorded sessions.</li>
              </ul>
              <div className="mt-3 text-sm text-gray-600">
                Perfect for calmer schedules, new learners ages 3–6, or families easing in.
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm">Start Trial</Button>
                <Button size="sm" variant="outline">
                  Learn More
                </Button>
              </div>
            </CollapsibleCard>
          </div>

          {/* Growth Pack (Most Popular) */}
          <div className="max-w-sm">
            <CollapsibleCard
              title="🌟 Growth Pack (Most Popular)"
              subtext="16 Live 1:1 Classes • ₹8,400"
              icon={<span>🌟</span>}
              defaultOpen
            >
              <ul className="list-disc pl-5 space-y-1">
                <li>16 live 1:1 classes (35 mins each).</li>
                <li>Ideal 2 classes per week over ~8 weeks.</li>
                <li>Detailed weekly video & PDF reports.</li>
                <li>Custom curriculum packs + practice sheets.</li>
                <li>Monthly parent strategy call.</li>
              </ul>
              <div className="mt-3 text-sm text-gray-600">
                Best for steady growth, ages 5–10, and families targeting visible 8–12 week progress.
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm">Start Trial</Button>
                <Button size="sm" variant="outline">
                  Learn More
                </Button>
              </div>
              <div className="mt-3 text-xs text-gray-600">
                “Worth every rupee. We saw change in six weeks.” — Parent ⭐⭐⭐⭐⭐
              </div>
            </CollapsibleCard>
          </div>

          {/* Intensive Pack */}
          <div className="max-w-sm">
            <CollapsibleCard
              title="Intensive Pack"
              subtext="24 Live 1:1 Classes • ₹12,000"
              icon={<span>🚀</span>}
            >
              <ul className="list-disc pl-5 space-y-1">
                <li>24 live 1:1 classes (35 mins each).</li>
                <li>Perfect for 3 classes/week or fast catch-up.</li>
                <li>Daily nudges and micro-feedback.</li>
                <li>Senior mentor + capstone showreel.</li>
                <li>Bi-weekly parent consults.</li>
              </ul>
              <div className="mt-3 text-sm text-gray-600">
                Ideal for acceleration, competition prep, or fast catch-up across ages 7–12.
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm">Start Trial</Button>
                <Button size="sm" variant="outline">
                  Learn More
                </Button>
              </div>
            </CollapsibleCard>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingCrispSection;
