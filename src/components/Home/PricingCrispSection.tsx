import React from 'react';
import { CollapsibleCard } from '../common/CollapsibleCard';
import Button from '../Button/Button';

const PricingCrispSection: React.FC = () => {
  return (
    <section data-animate="fade-up" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <h3 className="font-heading text-2xl font-bold md:text-3xl">
            Premium 1:1 classes, simple plans
          </h3>
          <p className="mt-3 text-gray-700 max-w-2xl mx-auto">
            Choose flexible monthly packs that fit your child’s schedule. Every plan includes live 1:1 classes, AI-guided practice, and clear progress updates for parents.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Starter Pack */}
          <div className="max-w-sm">
            <CollapsibleCard
              title="Starter · 8 classes / month"
              subtext="Perfect for new families trying 1:1 classes"
              icon={<span>🎯</span>}
            >
              <ul className="list-disc pl-5 space-y-1">
                <li>Perfect for new families trying 1:1 classes.</li>
                <li>Around 2 classes per week.</li>
                <li>From under ₹600 per class (approx.).</li>
              </ul>
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
              title="Growth · 16 classes / month"
              subtext="For steady progress with 3–4 classes weekly"
              icon={<span>🌟</span>}
              defaultOpen
            >
              <ul className="list-disc pl-5 space-y-1">
                <li>For steady progress with 3–4 classes each week.</li>
                <li>Lower per-class pricing compared to Starter.</li>
                <li>Weekly progress reports and practice packs.</li>
              </ul>
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

          {/* Power Pack */}
          <div className="max-w-sm">
            <CollapsibleCard
              title="Power · 24 classes / month"
              subtext="Ideal for consistent practice across skills"
              icon={<span>🚀</span>}
            >
              <ul className="list-disc pl-5 space-y-1">
                <li>Ideal for kids who love consistent practice.</li>
                <li>Best per-class value across phonics, grammar and speaking.</li>
                <li>Great for sustained progress and confidence building.</li>
              </ul>
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
