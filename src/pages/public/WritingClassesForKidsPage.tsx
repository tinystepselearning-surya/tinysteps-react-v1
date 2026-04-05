import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';

const faqItems = [
  {
    question: 'What do online writing classes for kids improve first?',
    answer:
      'Most children first improve sentence clarity and grammar usage in school answers. With consistent live practice, paragraph structure and idea expression improve next.',
  },
  {
    question: 'My child knows grammar but cannot write clear answers. Can this help?',
    answer:
      'Yes. This usually needs guided writing practice, not more rule memorization. Tiny Steps coaches children to convert grammar knowledge into clearer written answers.',
  },
  {
    question: 'Are live online writing classes effective for school writing?',
    answer:
      'Yes. Live online writing classes are effective when children get regular writing tasks and real-time feedback. Parents can track progress through writing samples and stage goals.',
  },
];

export default function WritingClassesForKidsPage() {
  useEffect(() => {
    applySeo({
      title: 'English Writing Classes for Kids | Tiny Steps Learning',
      description:
        'English writing classes for kids focused on sentence writing, paragraph writing, grammar in use, and clearer idea expression with live guidance.',
      canonicalPath: '/writing-classes-for-kids',
      ogType: 'website',
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">English Writing Classes for Kids</h1>
        <p className="mt-4 text-lg text-slate-700">
          Support your child with guided writing practice for stronger sentences, clearer ideas, and confident expression.
        </p>
        <Link
          to="/book-demo"
          className="mt-8 inline-block rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          Book Free Assessment
        </Link>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">What are english writing classes for kids?</h2>
        <p className="text-slate-700">
          Tiny Steps online writing classes for kids (typically ages 6-14) use live guided teaching to improve sentence accuracy, paragraph flow, and grammar use in school writing. Parents usually see clearer written answers, better structure, and stronger confidence with regular practice.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Why parents choose writing support</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Child struggles to write clear, complete sentences.</li>
          <li>• Writing lacks structure even when speaking is strong.</li>
          <li>• Homework and school writing tasks take too long.</li>
          <li>• Parent wants writing confidence, not just grammar rules.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">How Tiny Steps helps</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Live writing-focused classes with immediate teacher feedback.</li>
          <li>• Structured progression from sentence building to paragraph writing.</li>
          <li>• Age-appropriate prompts to help children express ideas clearly.</li>
          <li>• Parent updates on writing quality, grammar usage, and next targets.</li>
        </ul>
        <p className="mt-4 text-sm text-slate-700">
          Core authority page:{' '}
          <Link to="/grammar" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            grammar and writing classes for kids
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
        <h2 className="text-2xl font-bold">Ready to improve your child’s writing?</h2>
        <p className="mt-2 text-slate-200">Book a free assessment and get a practical writing improvement plan.</p>
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
