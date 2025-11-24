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
                <li>Personalised assessment + roadmap.</li>
                <li>Around 2 classes per week.</li>
                <li>₹600 per class (₹4,800 total).</li>
              </ul>
              <div className="mt-4 flex gap-2">
                <Button size="sm" aria-label="Book Free Assessment Class">Book Free Assessment Class</Button>
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
                <li>Everything in Starter + monthly mastery review.</li>
                <li>3–4 classes per week.</li>
                <li>₹575 per class (₹9,200 total).</li>
              </ul>
              <div className="mt-4 flex gap-2">
                <Button size="sm" aria-label="Book Free Assessment Class">Book Free Assessment Class</Button>
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
                <li>Daily AI-guided practice + priority scheduling.</li>
                <li>Best per-class value for 1:1 mentoring.</li>
                <li>₹550 per class (₹13,200 total).</li>
              </ul>
              <div className="mt-4 flex gap-2">
                <Button size="sm" aria-label="Book Free Assessment Class">Book Free Assessment Class</Button>
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
