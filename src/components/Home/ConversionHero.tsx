import React from 'react';
import { motion } from 'framer-motion';
import Button from '../Button/Button';
import { trackEvent } from '../../lib/analytics';

const ConversionHero: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_#ffd166,_#ff9f1c,_#52a5f0)] py-20 md:py-28">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-primary-100 blur-3xl" />
        <div className="absolute right-10 top-20 h-48 w-48 rounded-full bg-secondary-500/40 blur-3xl" />
        <div className="absolute bottom-10 left-1/3 h-36 w-64 rounded-full bg-accent-500/40 blur-3xl" />
      </div>
      <div className="relative z-10 mx-auto max-w-6xl px-6 text-center">
        <motion.h1
          className="font-heading text-4xl font-extrabold text-gray-900 md:text-6xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Make English Their Superpower.
          <br className="hidden md:block" />
          <span className="animated-gradient-text">Live 1:1 Phonics, Grammar & Speaking</span>
        </motion.h1>
        <motion.p
          className="mx-auto mt-5 max-w-2xl font-body text-lg text-gray-700 md:text-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Ages 3–12 • Personalized, research-backed lessons • Weekly progress you can see
        </motion.p>
        <motion.div
          className="mt-8 flex flex-col items-center justify-center gap-3"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex flex-col gap-3 sm:flex-row">
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
              className="px-6 py-3 rounded-2xl border border-primary-300 bg-white/80 text-primary-700 font-semibold shadow-sm hover:shadow transition"
            >
              See Courses
            </a>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-gray-700">
            <span className="rounded-full bg-white/80 px-3 py-1">Live 1‑on‑1</span>
            <span className="rounded-full bg-white/80 px-3 py-1">All‑India</span>
            <span className="rounded-full bg-white/80 px-3 py-1">Parent‑rated ★★★★★</span>
          </div>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 place-items-center gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-white/80 p-4 text-sm shadow-lg backdrop-blur">🗣️ Confident speaking in weeks</div>
          <div className="rounded-2xl bg-white/80 p-4 text-sm shadow-lg backdrop-blur">📚 Decoding → Fluency roadmaps</div>
          <div className="rounded-2xl bg-white/80 p-4 text-sm shadow-lg backdrop-blur">✍️ Write clearly with structure</div>
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
