import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';

const faqItems = [
  {
    question: 'How much do phonics classes cost in India?',
    answer:
      'Phonics class fees in India vary by format (1:1 or group), class frequency, and support depth. Live, teacher-led programs usually cost more than app-only or large-batch options because they provide guided correction and progress tracking.',
  },
  {
    question: 'Why are phonics fees different across programs?',
    answer:
      'Fees change based on personal attention, teaching quality, lesson structure, and parent reporting. Programs with live correction and clearer outcomes usually carry higher fees.',
  },
  {
    question: 'How do I choose the right phonics plan for my child?',
    answer:
      'Start with a level assessment and identify whether your child needs beginner decoding support or faster fluency growth. Choose a plan based on required support intensity, not price alone.',
  },
];

export default function PhonicsFeesIndiaPage() {
  useEffect(() => {
    applySeo({
      title: 'Phonics Class Fees in India | Tiny Steps Learning',
      description:
        'Understand phonics class fees in India, what affects pricing, and how to choose the right live support format based on your child’s learning needs.',
      canonicalPath: '/phonics-fees-india',
      ogType: 'website',
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Phonics Class Fees in India</h1>
        <p className="mt-4 text-lg text-slate-700">
          Compare phonics fee expectations clearly and choose the right format for your child’s reading stage.
        </p>
        <Link
          to="/book-demo"
          className="mt-8 inline-block rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          Book Free Assessment
        </Link>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">How much do phonics classes cost in India?</h2>
        <p className="text-slate-700">
          Phonics class fees in India depend on class format, learning frequency, and support depth. Tiny Steps offers live online phonics support with structured progression so parents can choose a fee-to-outcome plan that matches their child’s reading stage.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Why parents compare fees carefully</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Low-cost options may not include live correction or guided progression.</li>
          <li>• Group classes and 1:1 classes solve different learning needs.</li>
          <li>• Faster, structured support can reduce long-term learning delays.</li>
          <li>• Parents want clear value, not hidden trade-offs.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">How Tiny Steps positions value</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Live classes focused on reading outcomes, not passive screen time.</li>
          <li>• Structured phonics progression from sounds to fluent reading confidence.</li>
          <li>• Age-appropriate teaching with active teacher involvement.</li>
          <li>• Parent updates and practical guidance to support progress at home.</li>
        </ul>
        <p className="mt-4 text-sm text-slate-700">
          Core authority page:{' '}
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
        <h2 className="text-2xl font-bold">Need the right fee-to-outcome fit?</h2>
        <p className="mt-2 text-slate-200">Book a free assessment and get a suitable recommendation for your child.</p>
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
