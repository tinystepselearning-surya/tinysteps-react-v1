import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';

const faqItems = [
  {
    question: 'How can I help my slow reader child at home?',
    answer:
      'Keep practice short and consistent, focus on sound blending, and use guided reading routines. The right support improves speed and confidence over time.',
  },
  {
    question: 'Does slow reading always mean low ability?',
    answer:
      'No. Many children read slowly due to decoding habits or confidence gaps, not lack of ability. Structured fluency practice can make a big difference.',
  },
  {
    question: 'Can fluency improve along with comprehension?',
    answer:
      'Yes. As decoding becomes smoother, children spend less effort on words and more on understanding meaning.',
  },
];

export default function SlowReaderChildHelpPage() {
  useEffect(() => {
    applySeo({
      title: 'Slow Reader Child Help | Reading Fluency Support | Tiny Steps Learning',
      description:
        'Slow reader child help for parents focused on reading pace, fluency flow, and comprehension stamina through structured guided practice.',
      canonicalPath: '/slow-reader-child-help',
      ogType: 'website',
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Slow Reader Child Help: Improve Pace and Fluency</h1>
        <p className="mt-4 text-lg text-slate-700">
          If your child reads word-by-word or very slowly, focused fluency support can improve pace, flow, and comprehension confidence.
        </p>
        <Link
          to="/book-demo"
          className="mt-8 inline-block rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          Book Free Assessment
        </Link>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">What does slow reader child help mean?</h2>
        <p className="text-slate-700">
          Slow reader child help means identifying where reading pace breaks down, then using guided fluency practice so children read with smoother flow, better speed, and stronger understanding.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Problem explained in simple parent language</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Slow reading often comes from unclear sound-to-word decoding.</li>
          <li>• Children pause too much when blending is not automatic.</li>
          <li>• Reading can feel tiring, which reduces confidence and consistency.</li>
          <li>• With guided practice, speed and comfort can improve gradually.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Common signs parents notice</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Child reads word-by-word with long pauses.</li>
          <li>• Child avoids longer passages or reading aloud.</li>
          <li>• Child loses meaning while focusing on decoding.</li>
          <li>• Child feels frustrated with reading homework.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">How Tiny Steps helps</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Live guided sessions for decoding and fluency correction.</li>
          <li>• Structured progression from sound accuracy to reading speed.</li>
          <li>• Age-appropriate fluency tasks that build confidence steadily.</li>
          <li>• Parent-friendly progress visibility for pace and comprehension growth.</li>
        </ul>
        <p className="mt-4 text-sm text-slate-700">
          Helpful pages:{' '}
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
        <h2 className="text-2xl font-bold">Need a practical plan for slow reading pace?</h2>
        <p className="mt-2 text-slate-200">Book a free assessment and get a focused fluency improvement plan.</p>
        <Link
          to="/book-demo"
          className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Book Free Assessment Class
        </Link>
      </section>
    </div>
  );
}
