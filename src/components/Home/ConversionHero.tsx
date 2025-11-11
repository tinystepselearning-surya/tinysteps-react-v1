import React from 'react';
import { motion } from 'framer-motion';
import Button from '../Button/Button';
import { trackEvent } from '../../lib/analytics';

const ConversionHero: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_#ffe8c2,_#ffd28a,_#8ed1ff)] py-20 md:py-28">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-[#ff9f43]/60 blur-3xl" />
        <div className="absolute right-10 top-20 h-48 w-48 rounded-full bg-[#66c4ff]/40 blur-3xl" />
        <div className="absolute bottom-10 left-1/3 h-36 w-64 rounded-full bg-[#ffc857]/40 blur-3xl" />
      </div>
      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-6 text-left lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <motion.h1
            className="font-heading text-4xl font-extrabold text-gray-900 md:text-5xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            IB-aligned Phonics, Grammar & Public Speaking for Ages 3–12.
            <span className="block text-3xl md:text-4xl text-[#ff8f5c]">AI-curated journeys. Live mentors. Sunrise energy.</span>
          </motion.h1>
          <motion.p
            className="mt-4 max-w-2xl text-lg text-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            3500+ students across India, US, UK, Canada, Singapore, Malaysia, Vietnam, UAE & Australia learn with Tiny Steps. Our AI engine maps every child&apos;s needs and sends parents weekly learning path insights.
          </motion.p>
          <motion.div
            className="mt-6 flex flex-col gap-3 sm:flex-row"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Button
              size="lg"
              aria-label="Book Free Trial"
              onClick={() => {
                trackEvent('cta_click', { location: 'hero', label: 'book_free_trial' });
                document.getElementById('book-trial')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Book Free Trial
            </Button>
            <a
              href="/courses"
              onClick={() => trackEvent('cta_click', { location: 'hero', label: 'see_courses' })}
              className="rounded-2xl border border-white/70 bg-white/80 px-6 py-3 text-center font-semibold text-[#ff8f5c] shadow-sm hover:shadow transition"
            >
              Explore Courses
            </a>
          </motion.div>
          <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold text-gray-700">
            {['Live 1:1 mentors', 'AI learning paths', 'Parent insights dashboard'].map((chip) => (
              <span key={chip} className="rounded-full bg-white/80 px-3 py-1">{chip}</span>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="rounded-[32px] bg-white/90 p-6 shadow-[0_20px_45px_rgba(255,143,92,0.25)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm uppercase tracking-widest text-gray-500">Next live demo</div>
                <div className="text-2xl font-bold text-gray-900">Today • 7:00 PM</div>
              </div>
              <span className="rounded-full bg-[#ffe8c2] px-3 py-1 text-xs font-semibold text-[#ff8f5c]">Watch preview</span>
            </div>
            <div className="mt-5 space-y-3 text-sm text-gray-600">
              <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
                <span>🧠 AI-curated curriculum</span>
                <span className="text-xs text-gray-500">Personalized weekly plan</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
                <span>📈 Parent dashboard</span>
                <span className="text-xs text-gray-500">Weekly insights</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
                <span>🌍 Countries</span>
                <span className="text-xs text-gray-500">IN • US • UK • CA • SG • MY • VN • UAE • AU</span>
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-dashed border-gray-200 p-4 text-xs text-gray-600">
              Sunrise-grade polish, crafted for Tiny Steps parents. Every detail feels warm, trustworthy, and joyful.
            </div>
          </div>
        </div>
      </div>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-4 left-0 right-0 z-30 flex justify-center px-4 sm:hidden">
        <a
          href="#book-trial"
          onClick={() => trackEvent('cta_click', { location: 'sticky_mobile', label: 'book_free_trial' })}
          className="w-full max-w-md rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 px-6 py-3 text-center text-white font-semibold shadow-xl"
          aria-label="Book Free Trial"
        >
          Book Free Trial
        </a>
      </div>
    </section>
  );
};

export default ConversionHero;
