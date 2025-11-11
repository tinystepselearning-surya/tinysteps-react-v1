// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';

const highlights = [
  'Real snippets from phonics, grammar, and public speaking sessions',
  'AI-driven feedback overlay shows pronunciation + fluency insights',
  'Parents get a Friday email + WhatsApp note summarizing wins & nudges'
];

const sessions = [
  { title: 'Phonics Superstar', duration: '35 min • Ages 4-7', description: 'SATPIN warm-up + blending game + decodable reading' },
  { title: 'Grammar Builders', duration: '40 min • Ages 7-12', description: 'Sentence surgery + paragraph lab + creative prompt' },
  { title: 'Super Speakers', duration: '30 min • Ages 5-15', description: 'Hook-Body-Close practice + vocal variety drills' }
];

const DemoShowcase = () => {
  return (
    <section data-animate="fade-up" className="bg-gradient-to-b from-[#fff8ee] via-white to-[#e7f4ff] px-6 py-16">
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[1fr_1fr]">
        <div>
          <div className="gradient-chip w-max">Watch how our class feels</div>
          <h2 className="mt-3 text-3xl font-semibold text-gray-900 md:text-4xl">Demo lesson • AI feedback overlay • Mentor commentary</h2>
          <p className="mt-3 text-gray-700">Parents can preview a real Tiny Steps session before booking. See how we mix joyful teaching with AI visibility.</p>
          <ul className="mt-4 space-y-3 text-sm text-gray-700">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-2"><span>🎥</span>{item}</li>
            ))}
          </ul>
          <div className="mt-6 grid gap-3 rounded-2xl border border-gray-100 bg-white/80 p-4">
            {sessions.map((session) => (
              <div key={session.title} className="rounded-xl border border-gray-100 bg-white/90 p-3">
                <div className="text-sm font-semibold text-gray-900">{session.title}</div>
                <div className="text-xs text-gray-500">{session.duration}</div>
                <p className="text-xs text-gray-600">{session.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
            <button
              className="rounded-full bg-gradient-to-r from-[#ff8f5c] via-[#ffb347] to-[#59c3ff] px-5 py-3 text-white shadow-lg"
              onClick={() => document.getElementById('book-trial')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Book free trial after demo
            </button>
            <a
              href="https://wa.me/919618398383?text=Hi%20Tiny%20Steps!%20Share%20the%20demo%20class%20video%20please."
              className="rounded-full border border-gray-200 bg-white px-5 py-3 text-gray-900 shadow"
            >
              Get demo link on WhatsApp ↗
            </a>
          </div>
        </div>
        <motion.div
          className="relative overflow-hidden rounded-[32px] border border-white/70 bg-black/90 shadow-2xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
        >
          <video
            className="h-full w-full object-cover"
            poster="/images/demo-class-poster.jpg"
            controls
            preload="none"
          >
            <source src="/videos/demo-class.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/90 p-4 shadow-lg">
            <div className="text-xs uppercase tracking-[0.3em] text-gray-500">AI insight overlay</div>
            <p className="text-sm font-semibold text-gray-900">“Arjun nailed consonant blends today. Focus for next class: long vowels + expression.”</p>
            <p className="text-xs text-gray-500">Sent automatically to parents after every class.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DemoShowcase;
