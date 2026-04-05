import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';

const faqItems = [
  {
    question: 'What does a reading fluency program help with?',
    answer:
      'A reading fluency program helps children move from slow, word-by-word decoding to smoother reading. It improves pace, accuracy, confidence, and understanding over time.',
  },
  {
    question: 'My child knows phonics but still reads slowly. Can this help?',
    answer:
      'Yes. Many children need guided fluency practice even after learning basic phonics. Structured live sessions help reduce pauses and improve reading flow.',
  },
  {
    question: 'How quickly can reading fluency improve?',
    answer:
      'Many children show early improvement in reading flow within a few weeks of consistent classes. Stronger fluency and comprehension outcomes build with regular guided practice.',
  },
];

export default function ReadingFluencyProgramPage() {
  useEffect(() => {
    applySeo({
      title: 'Reading Fluency Program for Kids | Tiny Steps Learning',
      description:
        'Reading fluency program for kids focused on decoding-to-fluency progression, smoother reading pace, stronger accuracy, confidence, and comprehension support.',
      canonicalPath: '/reading-fluency-program',
      ogType: 'website',
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Reading Fluency Program for Kids</h1>
        <p className="mt-4 text-lg text-slate-700">
          Help your child move from slow, effortful reading to smoother, more confident reading with guided live support.
        </p>
        <Link
          to="/book-demo"
          className="mt-8 inline-block rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          Book Free Assessment
        </Link>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">What is a reading fluency program for kids?</h2>
        <p className="text-slate-700">
          A reading fluency program for kids helps children move from slow, effortful reading to smoother, more accurate sentence reading. Tiny Steps provides live guided sessions that strengthen pace, confidence, and comprehension readiness.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What this program helps with</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Decoding-to-fluency progression for smoother sentence reading.</li>
          <li>• Better reading pace without losing word accuracy.</li>
          <li>• Stronger confidence while reading aloud.</li>
          <li>• Improved reading accuracy and early comprehension support.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Why parents choose this program</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Child can decode words but does not read smoothly.</li>
          <li>• Child reads slowly and loses confidence in class tasks.</li>
          <li>• Parent wants measurable progress in pace and clarity.</li>
          <li>• Child needs stronger fluency before higher comprehension demands.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">How Tiny Steps delivers it</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Live guided teaching with real-time reading correction.</li>
          <li>• Structured progression from phonics accuracy to fluency flow.</li>
          <li>• Age-appropriate reading tasks that build confidence step by step.</li>
          <li>• Parent visibility with clear progress updates and next focus areas.</li>
        </ul>
        <p className="mt-4 text-sm text-slate-700">
          Related pages:{' '}
          <Link to="/reading-classes-for-kids" className="font-semibold underline underline-offset-2 hover:text-slate-900">
            reading classes for kids
          </Link>
          {' • '}
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
        <h2 className="text-2xl font-bold">Ready to build stronger reading fluency?</h2>
        <p className="mt-2 text-slate-200">Book a free assessment and get a focused fluency roadmap.</p>
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
