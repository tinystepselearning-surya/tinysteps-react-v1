import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';

const faqItems = [
  {
    question: 'What should english classes for a 6 year old focus on?',
    answer:
      'At age 6, classes should focus on reading fluency, grammar basics, sentence formation, and confidence in both reading and speaking tasks.',
  },
  {
    question: 'Can grammar be taught without making classes boring?',
    answer:
      'Yes. Grammar basics can be taught through short interactive tasks, sentence games, and guided correction instead of heavy worksheets.',
  },
  {
    question: 'How do I know if my child needs phonics revision at age 6?',
    answer:
      'If your child reads slowly, skips sounds, or guesses words, phonics reinforcement can improve reading flow and confidence.',
  },
];

export default function EnglishClassesFor6YearOldPage() {
  useEffect(() => {
    applySeo({
      title: 'English Classes for 6 Year Old | Tiny Steps Learning',
      description:
        'English classes for 6 year old children focused on reading fluency, grammar foundations, sentence formation, and stronger expression confidence.',
      canonicalPath: '/english-classes-for-6-year-old',
      ogType: 'website',
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">English Classes for 6 Year Old</h1>
        <p className="mt-4 text-lg text-slate-700">
          Build reading confidence, grammar basics, and clearer sentence expression through structured live classes.
        </p>
        <Link
          to="/book-demo"
          className="mt-8 inline-block rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          Book Free Assessment
        </Link>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">What are english classes for 6 year old children?</h2>
        <p className="text-slate-700">
          English classes for 6 year old children should strengthen reading fluency, grammar foundations, sentence formation, and confidence through structured, age-appropriate learning.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What children at this age usually need</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Reading fluency support beyond basic word decoding.</li>
          <li>• Grammar foundations for clearer sentence construction.</li>
          <li>• Sentence speaking and writing confidence in school tasks.</li>
          <li>• Guided correction to reduce repeated language errors.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Common parent concerns</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• My child reads, but not smoothly or confidently.</li>
          <li>• My child struggles to form complete sentences.</li>
          <li>• My child makes frequent grammar mistakes.</li>
          <li>• I want stronger classroom communication confidence.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">How Tiny Steps helps</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Live guided teaching for reading, grammar, and sentence expression.</li>
          <li>• Age-appropriate progression matching current school demands.</li>
          <li>• Interactive tasks for reading fluency and grammar application.</li>
          <li>• Personal attention with clear parent updates on progress.</li>
        </ul>
        <p className="mt-4 text-sm text-slate-700">
          Core authority pages:{' '}
          <Link to="/phonics" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            phonics support
          </Link>
          {' • '}
          <Link to="/grammar" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            grammar and writing classes
          </Link>
        </p>
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

      <section className="rounded-xl bg-slate-900 p-8 text-center text-white">
        <h2 className="text-2xl font-bold">Ready to improve your 6-year-old’s English skills?</h2>
        <p className="mt-2 text-slate-200">Book a free assessment and get a practical step-by-step plan.</p>
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
