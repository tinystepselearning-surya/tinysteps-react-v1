import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../Button/Button';

const FinalCTASection: React.FC = () => {
  return (
    <section className="bg-gradient-to-b from-white to-primary-50 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-700">One clear next step</p>
        <h2 className="mt-3 font-heading text-3xl font-bold text-slate-900 md:text-4xl">
          Find the right starting point for your child
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-700">
          Start with one free 35-minute 1:1 online demo assessment. You’ll leave with a recommended starting point for your child, then decide whether you want to continue.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Link to="/book-demo">
            <Button size="lg" aria-label="Book Free 35-Minute Demo">
              Book Free 35-Minute Demo
            </Button>
          </Link>
          <Link
            to="/class-samples"
            className="text-sm font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-primary-700"
          >
            Prefer to look first? View real class samples
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;
