import React from 'react';
import { motion } from 'framer-motion';
import Button from '../Button/Button';

const ConversionHero: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-hero py-20 md:py-28">
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
          Your Child's Confidence Starts Here.
          <br className="hidden md:block" />
          <span className="animated-gradient-text">Master English from Sounds to Stage.</span>
        </motion.h1>
        <motion.p
          className="mx-auto mt-5 max-w-2xl font-body text-lg text-gray-700 md:text-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Expert 1:1 Online Classes in Phonics, Grammar & Public Speaking
          <br />
          For Children Ages 3-12 • Personalized • Proven Results
        </motion.p>
        <motion.div
          className="mt-8 flex flex-col items-center justify-center gap-3"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Button size="lg" aria-label="Book Your Free Assessment Class">
            Book Your Free Assessment Class
          </Button>
          <p className="text-sm text-gray-600">
            See your child's learning level in 20 minutes — No payment needed
          </p>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 place-items-center gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-white/80 p-4 text-sm shadow-lg backdrop-blur">
            🗣️ One child speaking • confident hand raised
          </div>
          <div className="rounded-2xl bg-white/80 p-4 text-sm shadow-lg backdrop-blur">
            📚 One child reading • book in hand
          </div>
          <div className="rounded-2xl bg-white/80 p-4 text-sm shadow-lg backdrop-blur">
            ✍️ One child writing • pen in hand
          </div>
        </div>
      </div>
    </section>
  );
};

export default ConversionHero;

