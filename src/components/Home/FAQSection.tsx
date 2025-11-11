import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type QA = { q: string; a: string[] };

const qa: QA[] = [
  { q: 'My child is too shy. Will online classes make it worse?', a: [
    'No. Online is often BETTER for shy children — safer environment, one‑on‑one attention, breaks when needed, gradual confidence.',
    'Most shy children speak more by week 2–3 and engage fully by week 6–8. If not, we adjust method or teacher quickly.'
  ]},
  { q: 'How is this different from YouTube videos or apps?', a: [
    'Live teachers give immediate feedback and personalize lessons. Apps and videos can’t correct errors or adapt level.',
    'Your child practices speaking, gets accountability, and builds a relationship that keeps them engaged.'
  ]},
  { q: 'I don’t have time to sit with my child. Can they learn alone?', a: [
    'Yes. We design for convenience: 5–10 minutes daily practice, celebration of weekly wins, simple instructions.',
    'With 5 minutes daily: visible results in ~3 months. Without home practice: 5–6 months — still effective.'
  ]},
  { q: 'My child studies at a good school. Do they need extra classes?', a: [
    'Batch classes aren’t personalized; shy kids hide; weak kids fall behind. We teach skills, not just curriculum.'
  ]},
  { q: 'How do I know the teacher is actually teaching?', a: [
    'Weekly reports, video clips, home tasks, monthly assessments, and your child’s own explanations make learning visible.'
  ]},
  { q: 'What if my child doesn’t like their teacher?', a: [
    'We switch quickly — no charge. Relationship first. Learning is 60% relationship, 40% curriculum.'
  ]},
  { q: 'How long until my child reads independently?', a: [
    'Depends on starting point. Typical paths lead to independent reading within 5–8 months with right level and practice.'
  ]},
  { q: 'Is online learning as effective as in-person?', a: [
    'For language, one‑on‑one online is often equal or better: personalized, recorded, convenient, and data‑rich.'
  ]},
  { q: 'My child gets distracted easily. How will they focus?', a: [
    'Short 20–25 minute classes, interactive format, gamified, at the child’s best time. Interest and right level = focus.'
  ]},
  { q: 'What if my child is advanced and learns too fast?', a: [
    'We accelerate: skip basics, increase difficulty, add enrichment. Advanced learners thrive with 1:1 personalization.'
  ]},
];

const FAQSection: React.FC = () => {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <h2 className="font-heading text-3xl font-bold md:text-4xl">Frequently Asked Questions</h2>
        </div>

        <div className="mx-auto max-w-3xl divide-y divide-slate-200 rounded-2xl bg-white shadow-lg ring-1 ring-slate-200">
          {qa.map((item, idx) => (
            <div key={item.q} className="p-5">
              <button
                className="flex w-full items-center justify-between text-left"
                onClick={() => setOpen(open === idx ? null : idx)}
                aria-expanded={open === idx}
              >
                <span className="font-medium text-gray-900">{item.q}</span>
                <span className="text-primary-600">{open === idx ? '−' : '+'}</span>
              </button>
              <AnimatePresence initial={false}>
                {open === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 space-y-2 text-sm text-gray-700">
                      {item.a.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;

