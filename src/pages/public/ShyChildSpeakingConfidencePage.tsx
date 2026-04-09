import { useEffect } from 'react';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';

const faqItems = [
  {
    question: 'How do I improve shy child speaking confidence?',
    answer:
      'Start with low-pressure speaking routines, sentence support, and consistent guided practice. Confidence grows when children feel safe and successful.',
  },
  {
    question: 'My child understands but does not speak much. Is that normal?',
    answer:
      'Yes, this is common. Many children need structured opportunities and encouragement to turn understanding into confident speaking.',
  },
  {
    question: 'Can speaking confidence help in school participation?',
    answer:
      'Yes. As confidence improves, children usually participate more in class, answer clearly, and present ideas with less hesitation.',
  },
];

export default function ShyChildSpeakingConfidencePage() {
  useEffect(() => {
    applySeo({
      title: 'Shy Child Speaking Confidence Help | Tiny Steps Learning',
      description:
        'Support for shy child speaking confidence with guided communication practice, sentence support, vocabulary building, and public speaking readiness.',
      canonicalPath: '/shy-child-speaking-confidence',
      ogType: 'website',
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Shy Child Speaking Confidence</h1>
        <p className="mt-4 text-lg text-slate-700">
          If your child feels shy speaking, supportive communication coaching can build confidence step by step.
        </p>
        <Link
          to="/book-demo"
          className="mt-8 inline-block rounded-lg bg-slate-900 px-8 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          Book Free Assessment
        </Link>
      </section>

      <section className="mb-10 rounded-xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">How to support a shy child’s speaking confidence?</h2>
        <p className="text-slate-700">
          If your child is shy to speak, the issue is often confidence, not capability. Structured speaking practice with sentence and vocabulary support can help children communicate more comfortably.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Problem explained in simple parent language</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Some children know answers but hesitate to say them aloud.</li>
          <li>• Fear of mistakes can block natural communication.</li>
          <li>• Limited speaking practice can keep sentence flow weak.</li>
          <li>• Confidence grows with gentle, repeated speaking success.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Common signs parents notice</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Child avoids speaking in class or group settings.</li>
          <li>• Child gives very short answers despite understanding.</li>
          <li>• Child struggles to form full sentences confidently.</li>
          <li>• Child gets nervous before speaking tasks or presentations.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">How Tiny Steps helps</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Live guided speaking practice in a reassuring environment.</li>
          <li>• Structured progression from simple speaking to confident communication.</li>
          <li>• Age-appropriate vocabulary and sentence support for clarity.</li>
          <li>• Confidence-building routines with parent visibility on progress.</li>
        </ul>
        <p className="mt-4 text-sm text-slate-700">
          Helpful pages:{' '}
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
        <h2 className="text-2xl font-bold">Want to build your child’s speaking confidence?</h2>
        <p className="mt-2 text-slate-200">Book a free assessment and get a supportive communication plan.</p>
        <Link
          to="/book-demo"
          className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Book Demo
        </Link>
      </section>
      <ClusterSeoNav cluster="speaking" />
    </div>
  );
}
