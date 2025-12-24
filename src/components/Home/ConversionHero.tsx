import React from 'react';
import { motion } from 'framer-motion';
import Button from '../Button/Button';
import { trackEvent } from '../../lib/analytics';

const ConversionHero: React.FC = () => {
  return (
    <section
      data-animate="fade-up"
      className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_#ffe6cc,_#fff8ec,_#dff2ff_70%)] pt-6 pb-10 md:pt-8 md:pb-12 lg:pt-10 lg:pb-14"
    >
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div
          data-parallax
          data-parallax-speed="-0.2"
          className="absolute -left-16 top-6 h-48 w-48 rounded-full bg-[#ff9f43]/60 blur-3xl"
        />
        <div
          data-parallax
          data-parallax-speed="0.1"
          className="absolute right-8 top-16 h-56 w-56 rounded-full bg-[#66c4ff]/45 blur-3xl"
        />
        <div
          data-parallax
          data-parallax-speed="-0.05"
          className="absolute bottom-6 left-1/4 h-40 w-72 rounded-full bg-[#ffc857]/40 blur-3xl"
        />
        <div
          data-parallax
          data-parallax-speed="0.15"
          className="absolute top-1/2 left-0 h-24 w-24 rounded-full bg-[#8b5cf6]/25 blur-3xl"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
          <div>
            <div className="inline-flex items-center rounded-full border border-white/40 bg-white/10 px-4 py-1 text-xs font-medium tracking-wide text-slate-900/80 shadow-sm backdrop-blur">
              Tiny Steps • Building Bright Futures
            </div>
            <motion.h1
              className="mt-4 text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem] leading-tight max-w-3xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              IB-aligned Phonics,
              <br className="hidden md:block" />
              Grammar &amp; Public Speaking
              <br className="hidden md:block" />
              for Ages{' '}
              <span className="whitespace-nowrap">3–12.</span>
            </motion.h1>
            <motion.p
              className="mt-3 text-base sm:text-lg text-slate-700 max-w-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              @ Tiny Steps, our AI engine suggests the right activities for each child and sends parents
              simple weekly progress updates.
            </motion.p>
            <motion.div
              className="mt-4 flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-3"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Button
                size="lg"
                className="text-sm"
                aria-label="Book a free Tiny Steps assessment class"
                onClick={() => {
                  trackEvent('cta_click', { location: 'hero', label: 'book_free_assessment_class' });
                  document.getElementById('book-trial')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Book Free Assessment
              </Button>
              <p className="mt-2 text-sm text-gray-600">
                35-minute Session · No payment · See if Tiny Steps is right for your child
              </p>
            </motion.div>

            <div className="mt-4 space-y-3 text-sm text-gray-600">
              {/* Removed repetitive stats */}
            </div>
          </div>

          <div className="w-full max-w-md lg:justify-self-end lg:self-start">
            <div className="w-full max-w-md rounded-3xl bg-white shadow-xl shadow-slate-900/5 border border-slate-100 p-5 sm:p-6 lg:p-7 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm uppercase tracking-widest text-gray-500">
                    Free assessment class
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    Book a 1:1 demo at your convenient time this week
                  </div>
                </div>
                <span className="rounded-full bg-[#ffe8c2] px-3 py-1 text-xs font-semibold text-[#ff8f5c]">
                  Watch preview
                </span>
              </div>
              <div className="mt-5 space-y-3 text-sm text-gray-600">
                <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
                  <span>🧠 AI-guided practice plan</span>
                  <span className="text-xs text-gray-500">AI suggests the right activities each week (currently curated + reviewed by human mentors)</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
                  <span>📈 Parent dashboard</span>
                  <span className="text-xs text-gray-500">Weekly insights</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
                  <span>🌍 Countries</span>
                  <span className="text-xs text-gray-500">
                    IN • US • UK • CA • SG • MY • VN • UAE • AU
                  </span>
                </div>
              </div>
              <div className="mt-5 rounded-2xl border border-dashed border-gray-200 p-4 text-xs text-gray-600">
                Each session is structured, distraction-free, and focused on building your child&apos;s confidence—plus
                regular updates for parents.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-4 left-0 right-0 z-30 flex justify-center px-4 sm:hidden">
        <a
          href="#book-trial"
          onClick={() => trackEvent('cta_click', { location: 'sticky_mobile', label: 'book_free_assessment_class' })}
          className="w-full max-w-md rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 px-6 py-3 text-center text-white font-semibold shadow-xl"
          aria-label="Book Free Assessment Class"
        >
          Book Free Assessment Class
        </a>
      </div>
    </section>
  );
};

export default ConversionHero;
