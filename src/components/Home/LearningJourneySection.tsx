import React from 'react';
import { motion } from 'framer-motion';

const steps = [
  {
    title: 'Step 1: Initial Assessment',
    duration: 'Lesson 1',
    body: [
      'Your child\'s first class is an assessment session — not real learning yet.',
      'We discover current level, learning style, personality, and specific needs.',
      'Result: A custom learning plan, your detailed report, and a teacher ready to teach YOUR child.'
    ]
  },
  {
    title: 'Step 2: Intensive Learning (Lessons 2–20)',
    duration: 'Lesson-based, pace flexible',
    body: [
      'Phonics: sounds → word building → fluency → spelling patterns.',
      'Grammar: parts of speech → sentence building → tenses → fix common mistakes.',
      'Public Speaking: confidence → clear pronunciation → storytelling → quick answers.',
      'Class (25 mins): 5 warm‑up • 15 core • 5 fun practice.'
    ]
  },
  {
    title: 'Step 3: Consolidation & Confidence (Lessons 21–36)',
    duration: 'Lesson-based, pace flexible',
    body: [
      'Reads stories, speaks in sentences, answers without hesitation, corrects themselves.',
      'Public speaking intensifies: show & tell, story without prompts, Q&A.',
      'Milestones: around Lesson 10 first unprompted conversation • around Lesson 20 reads without pointing • around Lesson 30 speaks on camera.'
    ]
  },
  {
    title: 'Step 4: Mastery & Independence (Month 4+)',
    duration: 'Ongoing',
    body: [
      'Reads independently, speaks confidently, asks questions, wants to learn more.',
      'Paths: advanced levels • group prep • lesson refresh.',
      'Habit: reading for pleasure • speaking naturally • confidence at school.'
    ]
  }
];

const LearningJourneySection: React.FC = () => {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <h2 className="font-heading text-3xl font-bold md:text-4xl">Your Child\'s Lesson-by-Lesson Transformation</h2>
        </div>
        <div className="relative">
          <div className="absolute left-1/2 top-0 hidden h-full w-0.5 -translate-x-1/2 bg-gradient-to-b from-primary-500 to-secondary-500 md:block" />
          <ol className="space-y-10">
            {steps.map((s, _i) => (
              <li key={s.title} className="md:grid md:grid-cols-2 md:items-center md:gap-10">
                <motion.div
                  className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.4 }}
                >
                  <h3 className="font-heading text-xl font-semibold text-gray-900">{s.title}</h3>
                  <p className="text-sm text-primary-600">{s.duration}</p>
                  <ul className="mt-3 space-y-2 text-gray-700">
                    {s.body.map((b, idx) => (
                      <li key={idx}>• {b}</li>
                    ))}
                  </ul>
                </motion.div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
};

export default LearningJourneySection;
