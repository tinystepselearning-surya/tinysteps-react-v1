// @ts-nocheck
import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
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
  const { user } = useAuthStore();

  return (
    <section data-animate="fade-up" className="bg-gradient-to-b from-[#fff8ee] via-white to-[#e7f4ff] px-6 py-16">
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[1fr_1fr]">
        <div>
          <div className="gradient-chip w-max">Watch how our class feels</div>
          <h2 className="mt-3 text-3xl font-semibold text-gray-900 md:text-4xl">Demo lesson • AI feedback overlay • Mentor commentary</h2>
          <p className="mt-3 text-gray-700">Parents can preview a real Tiny Steps session before booking. See how we mix joyful teaching with AI visibility.</p>
          <ul className="mt-4 space-y-3 text-sm text-gray-700">
            <li className="flex items-start gap-2"><span>📚</span>5 minutes of phonics or reading</li>
            <li className="flex items-start gap-2"><span>✍️</span>5 minutes of grammar or writing</li>
            <li className="flex items-start gap-2"><span>🗣️</span>5 minutes of speaking practice</li>
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
              aria-label="Book Free Assessment Class"
              className="rounded-full bg-gradient-to-r from-[#ff8f5c] via-[#ffb347] to-[#59c3ff] px-5 py-3 text-white shadow-lg"
              onClick={() => document.getElementById('book-trial')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Book Free Assessment Class
            </button>
            {!user && (
              <a
                href="https://wa.me/919618398383?text=Hi%20Tiny%20Steps!%20Share%20the%20demo%20class%20video%20please."
                className="rounded-full border border-gray-200 bg-white px-5 py-3 text-gray-900 shadow"
              >
                Get demo link on WhatsApp ↗
              </a>
            )}
          </div>
          <button className="mt-4 inline-block rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2">
            Watch a 2-minute preview
          </button>
        </div>
        <div>
          <div className="relative rounded-xl border border-gray-200 bg-white p-4 shadow-md">
            <h3 className="text-lg font-semibold text-gray-800">AI Feedback Insights</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>Accuracy: ⭐⭐⭐⭐☆</li>
              <li>Fluency: ⭐⭐⭐⭐☆</li>
              <li>Confidence: ⭐⭐⭐⭐☆</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoShowcase;
