import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';

const faqItems = [
  {
    question: 'What should english classes for a 4 year old focus on?',
    answer:
      'At age 4, classes should focus on listening, letter sounds, early vocabulary, and playful speaking confidence through short guided activities.',
  },
  {
    question: 'Can online classes work for a 4 year old child?',
    answer:
      'Yes, when classes are short, interactive, and age-appropriate. Gentle routines and teacher guidance keep young learners engaged.',
  },
  {
    question: 'How often should a 4 year old attend classes?',
    answer:
      'Two to three short live sessions per week is usually enough to build steady foundation skills without overload.',
  },
];

export default function EnglishClassesFor4YearOldPage() {
  useEffect(() => {
    applySeo({
      title: 'English Classes for 4 Year Old | Tiny Steps Learning',
      description:
        'English classes for 4 year old children focused on listening, letter sounds, early vocabulary, playful speaking confidence, and gentle online learning routines.',
      canonicalPath: '/english-classes-for-4-year-old',
      ogType: 'website',
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">English Classes for 4 Year Old</h1>
        <p className="mt-4 text-lg text-slate-700">
          Build a gentle English foundation with playful, live sessions designed for preschool learners.
        </p>
        <Link
          to="/book-demo"
          className="mt-8 inline-block rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          Book Free 35-Minute Demo
        </Link>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">What are english classes for 4 year old children?</h2>
        <p className="text-slate-700">
          English classes for 4 year old children should build listening, letter sounds, early vocabulary, and playful speaking confidence through structured, age-appropriate teaching.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What children at this age usually need</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Listening games that improve attention and comprehension.</li>
          <li>• Clear introduction to letter sounds through repetition.</li>
          <li>• Everyday vocabulary for home and classroom communication.</li>
          <li>• Play-based speaking prompts to reduce hesitation.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Common parent concerns</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• My child knows letters but not letter sounds.</li>
          <li>• My child understands but speaks very little.</li>
          <li>• My child loses focus quickly during learning tasks.</li>
          <li>• I want gentle online learning without pressure.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">How Tiny Steps helps</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Live guided classes with warm, child-friendly mentoring.</li>
          <li>• Age-appropriate progression from listening to early speaking.</li>
          <li>• Interactive activities that make early English enjoyable.</li>
          <li>• Personal attention and simple parent guidance for home support.</li>
        </ul>
        <p className="mt-4 text-sm text-slate-700">
          Core foundation page:{' '}
          <Link to="/phonics" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            phonics classes for kids
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
        <h2 className="text-2xl font-bold">Ready to start your 4-year-old’s English journey?</h2>
        <p className="mt-2 text-slate-200">Book one free 35-minute 1:1 online demo assessment class and get a gentle, age-appropriate plan.</p>
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
