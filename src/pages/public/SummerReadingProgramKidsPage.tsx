import { useEffect } from 'react';
import ClusterSeoNav from '../../components/programs/ClusterSeoNav';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';

const faqItems = [
  {
    question: 'What is a summer reading program for kids?',
    answer:
      'A summer reading program is a short seasonal plan designed to protect reading momentum during school break. It focuses on consistency, fluency retention, and school-readiness rather than heavy academic overload.',
  },
  {
    question: 'How is this different from a regular reading fluency program?',
    answer:
      'A regular fluency program is year-round and deeper in scope. This summer version is a focused bridge: maintain gains, prevent backslide, and return to school with steadier reading confidence.',
  },
  {
    question: 'My child reads slowly and avoids books during vacation. Is this suitable?',
    answer:
      'Yes. This is a common summer pattern. Short guided routines can reduce avoidance, rebuild flow, and keep reading from slipping during the break.',
  },
  {
    question: 'How many weeks of summer reading support are usually useful?',
    answer:
      'Many families benefit from a focused multi-week block with steady weekly practice and clear goals. The key is consistency and right-level text, not long daily sessions.',
  },
  {
    question: 'When should parents seek structured summer support?',
    answer:
      'Choose structured summer support if reading confidence dipped in the last school term, home practice is inconsistent, or your child returns from breaks with noticeable loss in fluency or accuracy.',
  },
];

export default function SummerReadingProgramKidsPage() {
  useEffect(() => {
    applySeo({
      title: 'Summer Reading Program for Kids: Prevent Reading Slide | Tiny Steps Learning',
      description:
        'Parent guide to our summer reading program for kids: prevent reading slide, keep fluency steady during vacation, and return to school with stronger reading confidence.',
      canonicalPath: '/summer-reading-program-kids',
      ogType: 'website',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqItems.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })),
        },
      ],
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Summer Reading Program for Kids</h1>
        <p className="mt-4 text-lg text-slate-700">
          Keep reading momentum through vacation with a focused summer plan that protects fluency, confidence, and school restart readiness.
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
          This summer reading program helps children maintain and strengthen reading habits during school break. The goal is to prevent summer slide, keep pace and accuracy stable, and reduce restart stress when school reopens.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Who this summer program is for</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Children who improved during term but lose consistency during long breaks.</li>
          <li>• Children who read slowly and avoid reading when routines become unstructured.</li>
          <li>• Families who want short, guided summer continuity instead of random worksheets.</li>
          <li>• Parents who want school restart to feel smoother, not like starting over.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Summer-specific reading risks this page addresses</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Fluency drop after 2-4 weeks without guided reading.</li>
          <li>• Increased guessing habits when children stop decoding routines.</li>
          <li>• Lower reading stamina after irregular practice.</li>
          <li>• Confidence dip when school resumes with higher text demand.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What to check at home this week</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Can your child read short passages with similar confidence as during school term?</li>
          <li>• Are pauses and restarts increasing compared to last month?</li>
          <li>• Can your child answer one simple meaning question after reading?</li>
          <li>• Is reading becoming a daily routine or getting skipped repeatedly?</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What each result suggests</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Confidence and pace stable: continue light maintenance routine.</li>
          <li>• Accuracy stable but pace slipping: add repeated passage reading with guided correction.</li>
          <li>• Guessing or avoidance rising: return to controlled decoding plus short fluency cycles.</li>
          <li>• Comprehension dropping with passage length: add short chunk reading with immediate meaning checks.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What to start doing this summer</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Keep one short daily reading slot, even on travel days.</li>
          <li>• Use a simple loop: review, read, check meaning, end with one success.</li>
          <li>• Track one weekly metric (smoothness, accuracy, or reading willingness).</li>
          <li>• Keep text level manageable so confidence remains high.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-rose-100 bg-rose-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What to avoid in summer reading</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Do not pause reading completely for long stretches.</li>
          <li>• Do not jump to harder books only to “catch up quickly.”</li>
          <li>• Do not replace all guided reading with passive app time.</li>
          <li>• Do not wait until school reopen week to restart reading routines.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-amber-100 bg-amber-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">When to choose structured summer reading support</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Reading momentum dropped at the end of the last term.</li>
          <li>• Child resists reading unless heavily prompted.</li>
          <li>• Parent wants a practical bridge into the next term.</li>
          <li>• Home-only plans are not staying consistent through vacation.</li>
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
            • For full seasonal track options:{' '}
            <Link to="/summer-camps" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Summer Camps
            </Link>
          </li>
          <li>
            • For year-round fluency planning:{' '}
            <Link to="/reading-fluency-program" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Reading Fluency Program
            </Link>
          </li>
          <li>
            • For practical parent summer routine ideas:{' '}
            <Link to="/blog/week-27-prevent-summer-slide-reading" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Prevent Summer Slide Reading Guide
            </Link>
          </li>
          <li>
            • For decoding-first support:{' '}
            <Link to="/phonics" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Phonics Classes
            </Link>
          </li>
        </ul>
      </section>

      <section className="rounded-xl bg-slate-900 p-8 text-center text-white">
        <h2 className="text-2xl font-bold">Want a clear summer reading plan for your child?</h2>
        <p className="mt-2 text-slate-200">Book a free assessment and get a focused summer reading roadmap.</p>
        <Link
          to="/book-demo"
          className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Book Demo
        </Link>
      </section>
      <ClusterSeoNav cluster="phonics" />
    </div>
  );
}
