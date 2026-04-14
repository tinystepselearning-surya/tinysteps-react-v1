import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';

const faqItems = [
  {
    question: 'What should English classes for a 5 year old focus on first?',
    answer:
      'At age 5, the priority is the transition from readiness to early reading: stable letter sounds, blending into simple words, short-sentence speaking, and confidence with classroom responses.',
  },
  {
    question: 'My 5-year-old knows letters but cannot read words yet. Is that normal?',
    answer:
      'Yes, this is common. Many children at this age know letter names before decoding is automatic. Structured blending and decodable reading routines usually help bridge that gap.',
  },
  {
    question: 'How is this page different from classes for 4-year-olds and 6-year-olds?',
    answer:
      'Age 4 is more listening-and-sound readiness. Age 6 usually expects stronger fluency and sentence-level grammar transfer. Age 5 is the bridge where first real reading habits should become stable.',
  },
  {
    question: 'Will speaking confidence improve along with early reading?',
    answer:
      'Yes. As children decode with less stress, they usually speak in fuller sentences and participate more comfortably in class and daily conversation.',
  },
  {
    question: 'When should parents seek structured support at this age?',
    answer:
      'Seek structured support if blending remains weak, reading avoidance increases, or your child cannot move from letter knowledge to simple word reading after consistent guided practice.',
  },
];

export default function EnglishClassesFor5YearOldPage() {
  useEffect(() => {
    applySeo({
      title: 'English Classes for 5 Year Old: Early Reading Bridge Support | Tiny Steps Learning',
      description:
        'Parent guide to English classes for 5 year olds: age-specific support for sound-to-word blending, early reading confidence, sentence speaking, and classroom readiness.',
      canonicalPath: '/english-classes-for-5-year-old',
      ogType: 'website',
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">English Classes for 5 Year Old</h1>
        <p className="mt-4 text-lg text-slate-700">
          Age-5 support focused on the key bridge: from letter familiarity to confident first-word reading and clearer sentence speaking.
        </p>
        <Link
          to="/book-demo"
          className="mt-8 inline-block rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          Book Free Assessment
        </Link>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">Quick answer</h2>
        <p className="text-slate-700">
          At age 5, children should begin turning sounds into words and words into simple sentence reading. This page is for that transition stage, where gentle but structured phonics-and-speaking support makes the biggest difference.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What age-5 learners usually need</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Sound recall that is consistent (not only letter-name recitation).</li>
          <li>• Blending practice for short words with less guessing.</li>
          <li>• Early sentence reading confidence through decodable text.</li>
          <li>• Vocabulary and sentence-speaking routines for classroom participation.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Parent symptom map at age 5</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Child behavior: knows letters but cannot blend. What it may mean: decoding bridge is not stable. Next step: oral plus print blending routines.</li>
          <li>• Child behavior: guesses from picture cues. What it may mean: sound-to-word habit is weak. Next step: controlled decodable reading.</li>
          <li>• Child behavior: reads a few words but avoids sentence reading. What it may mean: confidence threshold is low. Next step: short success-first sentence practice.</li>
          <li>• Child behavior: understands but gives very short spoken replies. What it may mean: expressive sentence confidence is limited. Next step: sentence starter routines.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What to check at home this week</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Can your child produce sounds for common lowercase letters reliably?</li>
          <li>• Can your child blend 4-6 short words without heavy prompting?</li>
          <li>• Can your child read 1-2 short decodable sentences with support?</li>
          <li>• Can your child answer using a full short sentence in conversation?</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What each result usually suggests</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Sounds low, blending low: return to structured sound mapping first.</li>
          <li>• Sounds okay, blending weak: focus on repeated blending loops.</li>
          <li>• Word reading okay, sentence confidence low: increase short sentence routines.</li>
          <li>• Reading improving, speaking still short: add sentence expansion prompts daily.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What to start doing</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Keep one short daily routine: sounds, blend, read, speak.</li>
          <li>• Use consistent prompts like “say sounds first, then blend.”</li>
          <li>• End with one easy reading and speaking success each session.</li>
          <li>• Track one weekly marker: blending ease, sentence reading, or speaking length.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-rose-100 bg-rose-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What to avoid</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Do not jump to hard readers before blending is stable.</li>
          <li>• Do not rely only on alphabet recitation as reading progress.</li>
          <li>• Do not force long sessions that increase avoidance.</li>
          <li>• Do not compare your child’s pace with older learners.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-amber-100 bg-amber-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">When to seek structured support</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Blending does not improve despite steady home effort.</li>
          <li>• Reading confidence is dropping, not rising.</li>
          <li>• Child resists early reading tasks repeatedly.</li>
          <li>• Parent needs a clear step-by-step progression for this stage.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">FAQs</h2>
        <div className="space-y-4">
          {faqItems.map((item) => (
            <article key={item.question}>
              <h3 className="font-semibold text-slate-900">{item.question}</h3>
              <p className="mt-1 text-sm text-slate-700">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Relevant next-step links</h2>
        <ul className="space-y-2 text-slate-700">
          <li>
            • For younger readiness stage:{' '}
            <Link to="/english-classes-for-4-year-old" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              English Classes for 4 Year Old
            </Link>
          </li>
          <li>
            • For next-stage progression:{' '}
            <Link to="/english-classes-for-6-year-old" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              English Classes for 6 Year Old
            </Link>
          </li>
          <li>
            • For focused early decoding bridge:{' '}
            <Link to="/online-phonics-reading-classes" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Online Phonics and Reading Classes
            </Link>
          </li>
          <li>
            • For core phonics pathway:{' '}
            <Link to="/phonics" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Phonics Classes for Kids
            </Link>
          </li>
        </ul>
      </section>

      <section className="rounded-xl bg-slate-900 p-8 text-center text-white">
        <h2 className="text-2xl font-bold">Ready to support your 5-year-old’s English growth?</h2>
        <p className="mt-2 text-slate-200">Book a free assessment and get a focused age-5 learning plan.</p>
        <Link
          to="/book-demo"
          className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Book Demo
        </Link>
      </section>
    </div>
  );
}
