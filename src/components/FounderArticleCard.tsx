import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FounderArticleCard() {
  const [open, setOpen] = useState(false);

  return (
    <article className="max-w-4xl mx-auto my-10 bg-white rounded-2xl shadow-md overflow-hidden">
      <div className="p-6 md:p-8">
        <header className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold">Foundations Forever: Why Phonics Matters for Every Child</h2>
            <p className="mt-2 text-sm text-gray-600">By Founder, Tiny Steps Learning</p>
          </div>

          <div className="ml-4 flex-shrink-0">
            <button
              aria-expanded={open}
              onClick={() => setOpen((s) => !s)}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white w-10 h-10 focus:outline-none focus:ring-2 focus:ring-blue-300"
              aria-label={open ? 'Collapse article' : 'Expand article'}
            >
                  <motion.svg
                    className="w-5 h-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden
                    animate={{ rotate: open ? 180 : 0, scale: open ? 1.03 : 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                    whileTap={{ scale: 0.95 }}
                  >
                <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l6 6a1 1 0 01-1.414 1.414L10 5.414 4.707 10.707A1 1 0 113.293 9.293l6-6A1 1 0 0110 3z" clipRule="evenodd" />
              </motion.svg>
            </button>
          </div>
        </header>

        <div className="mt-4 text-gray-700">
          <p className="mb-4">At Tiny Steps, my mission has always been simple yet profound: to give every child a strong beginning—one that lasts a lifetime. When I launched Tiny Steps, I envisioned a place where learning to read wasn’t a chore but a joy; where children would experience the magic of words and stories through play, curiosity and connection.</p>

          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                style={{ overflow: 'hidden' }}
                layout
              >
                <div className="space-y-4 py-4">
                  <p><strong>Phonics: Unlocking the Code of Reading</strong><br/>Phonics is the bridge between the sounds we hear (phonemes) and the letters and letter-groups that represent those sounds on a page (graphemes). When a child realises that the sound /s/ is written as s, and that combining /a/ and /t/ forms the word sat, reading becomes a solvable, joyful puzzle.</p>

                  <p><strong>How Young Minds Learn Best</strong><br/>The early years—roughly ages three to seven—are a period of explosive language growth. At Tiny Steps, I nurture code-related skills (decoding) and oral-language skills (comprehension) together because reading is more than decoding; it’s also about comprehension.</p>

                  <p><strong>Why I Start With SATPIN—Not A–Z</strong><br/>Many schools still teach the alphabet from A to Z. Cambridge experts recommend starting with six letters—s, a, t, p, i, n—because these building blocks let children form dozens of simple, meaningful words right away. When children can read their first real word in Week 1, their eyes light up.</p>

                  <p><strong>My Classroom in Action</strong><br/>Active learning: children sing, clap, trace and act out sounds. Story-based connections and layered reading help make each lesson meaningful. Parents receive guidance so story-time becomes a chance to bond and explore new words together.</p>

                  <p><strong>From Sounds to Sentences</strong><br/>Once children feel comfortable with phonics, we expand their skills into fluent reading and expressive writing. Writing emerges naturally from tracing shapes to crafting simple sentences and creative stories.</p>

                  <p><strong>Assessment the Tiny Steps Way</strong><br/>We use running records, story-retelling and drawing portfolios to understand each learner’s progress—methods aligned with Cambridge’s holistic assessment recommendations.</p>

                  <p className="italic">“Phonics is not a subject—it’s a superpower. It helps children connect sounds to symbols, reading to meaning, and learning to joy.”</p>

                  <p><strong>Parents as Partners</strong><br/>Weekly learning notes, Read & Reflect moments, a sound library and progress snapshots help families stay connected and celebrate every tiny step.</p>

                  <p>— Founder<br/>Tiny Steps Learning</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      <div className="border-t px-6 py-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Foundations Forever</div>
          <div>
            <button onClick={() => setOpen(false)} className="text-sm text-gray-700 hover:underline">Close</button>
          </div>
        </div>
      </div>
    </article>
  );
}
