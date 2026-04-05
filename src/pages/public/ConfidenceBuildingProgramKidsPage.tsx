import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';

const faqItems = [
  {
    question: 'What is a confidence-building program for kids?',
    answer:
      'A confidence-building program helps children communicate clearly, reduce hesitation, and express ideas more confidently. It focuses on practical speaking habits, not memorized scripts.',
  },
  {
    question: 'How do I know if my child needs speaking confidence support?',
    answer:
      'Common signs include avoiding class participation, giving very short answers, or freezing during speaking tasks. These usually improve with guided speaking routines and sentence support.',
  },
  {
    question: 'Will this help shy children speak more confidently?',
    answer:
      'Yes. Children build confidence in small steps, then progress to clearer expression and presentation readiness for school activities.',
  },
];

export default function ConfidenceBuildingProgramKidsPage() {
  useEffect(() => {
    applySeo({
      title: 'Confidence Building Program for Kids | Tiny Steps Learning',
      description:
        'Confidence building program for kids focused on expressive speaking, communication confidence, reduced hesitation, vocabulary growth, and public speaking readiness.',
      canonicalPath: '/confidence-building-program-kids',
      ogType: 'website',
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Confidence Building Program for Kids</h1>
        <p className="mt-4 text-lg text-slate-700">
          Build communication confidence, expressive speaking, and self-belief through supportive live guidance.
        </p>
        <Link
          to="/book-demo"
          className="mt-8 inline-block rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          Book Free Assessment
        </Link>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">What is a confidence building program for kids?</h2>
        <p className="text-slate-700">
          A confidence-building program for kids helps children speak with less hesitation and clearer sentence flow in school and daily situations. Tiny Steps delivers live guided communication practice so children build confidence, vocabulary, and presentation readiness step by step.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What this program helps with</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Stronger communication confidence in school and daily speaking.</li>
          <li>• Reduced hesitation while answering and expressing ideas.</li>
          <li>• Better vocabulary and sentence flow in spoken communication.</li>
          <li>• Public speaking readiness through guided confidence practice.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Why parents choose this program</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Child feels shy and avoids speaking in class.</li>
          <li>• Child knows answers but struggles to say them confidently.</li>
          <li>• Parent wants better self-expression, not just memorized speech.</li>
          <li>• Child needs confidence before debates, talks, and presentations.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">How Tiny Steps delivers it</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Live guided sessions with supportive speaking coaching.</li>
          <li>• Structured progression from basic speaking confidence to stage readiness.</li>
          <li>• Age-appropriate activities that encourage expressive communication.</li>
          <li>• Parent visibility through clear confidence and speaking milestones.</li>
        </ul>
        <p className="mt-4 text-sm text-slate-700">
          Related pages:{' '}
          <Link to="/speaking" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            public speaking classes for kids
          </Link>
          {' • '}
          <Link to="/spoken-english-classes-for-kids" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            spoken english classes for kids
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
        <h2 className="text-2xl font-bold">Ready to build lasting confidence in communication?</h2>
        <p className="mt-2 text-slate-200">Book a free assessment and get the right confidence plan.</p>
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
