import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';

const faqItems = [
  {
    question: 'What should english classes for a 5 year old include?',
    answer:
      'Classes should include phonics blending, reading readiness activities, vocabulary growth, and simple sentence speaking with live support.',
  },
  {
    question: 'Can this age start early reading confidently?',
    answer:
      'Yes. With structured blending practice and guided decoding, many 5-year-olds build early reading confidence quickly.',
  },
  {
    question: 'Will spoken confidence improve too?',
    answer:
      'Yes. Age-appropriate speaking prompts and sentence practice help children participate more confidently in class and daily conversation.',
  },
];

export default function EnglishClassesFor5YearOldPage() {
  useEffect(() => {
    applySeo({
      title: 'English Classes for 5 Year Old | Tiny Steps Learning',
      description:
        'English classes for 5 year old children focused on phonics blending, reading readiness, sentence speaking, and confidence in class participation.',
      canonicalPath: '/english-classes-for-5-year-old',
      ogType: 'website',
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">English Classes for 5 Year Old</h1>
        <p className="mt-4 text-lg text-slate-700">
          Strengthen phonics, early reading, and speaking confidence with live, age-appropriate English classes.
        </p>
        <Link
          to="/book-demo"
          className="mt-8 inline-block rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          Book Free Assessment
        </Link>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">What are english classes for 5 year old children?</h2>
        <p className="text-slate-700">
          English classes for 5 year old children should build phonics, vocabulary, listening, early reading, and confidence through structured, age-appropriate teaching.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What children at this age usually need</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Blending practice to connect sounds and words.</li>
          <li>• Early reading readiness through guided decoding.</li>
          <li>• Vocabulary expansion for classroom communication.</li>
          <li>• Sentence speaking routines for participation confidence.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Common parent concerns</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• My child can say letters but cannot blend sounds.</li>
          <li>• My child is shy and does not answer in class.</li>
          <li>• My child is not fully ready for early reading tasks.</li>
          <li>• I want steady progress without pressure.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">How Tiny Steps helps</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Live guided teaching with consistent correction and encouragement.</li>
          <li>• Age-appropriate progression from sounds to reading readiness.</li>
          <li>• Interactive activities to improve speaking and participation.</li>
          <li>• Personal attention with parent-friendly progress updates.</li>
        </ul>
        <p className="mt-4 text-sm text-slate-700">
          Core authority pages:{' '}
          <Link to="/phonics" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            phonics classes for kids
          </Link>
          {' • '}
          <Link to="/speaking" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            speaking confidence classes
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
        <h2 className="text-2xl font-bold">Ready to support your 5-year-old’s English growth?</h2>
        <p className="mt-2 text-slate-200">Book a free assessment and get a focused learning plan.</p>
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
