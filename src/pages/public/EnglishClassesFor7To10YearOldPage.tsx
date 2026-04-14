import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';

const faqItems = [
  {
    question: 'What should English classes for 7 to 10 year olds focus on first?',
    answer:
      'At this stage, children usually need stronger comprehension, sentence construction, paragraph writing, and confident oral explanation. The focus should move beyond basic word reading into applied school language skills.',
  },
  {
    question: 'My child reads the chapter but cannot explain answers clearly. Is this common at 7-10?',
    answer:
      'Yes, this is common. Many children can read text but struggle to convert understanding into clear spoken and written responses. Structured practice in explanation and answer framing helps.',
  },
  {
    question: 'How is this different from an English foundation program?',
    answer:
      'Foundation programs are broader and can include younger stages. This page is specifically for 7-10 needs: school-style comprehension, written response quality, grammar transfer, and class participation confidence.',
  },
  {
    question: 'Can one plan improve reading, grammar, writing, and speaking together?',
    answer:
      'Yes, when activities are sequenced by age-level expectations and each skill reinforces the others. Children progress faster when comprehension, sentence quality, and expression are trained together.',
  },
  {
    question: 'When should parents seek structured support for this age group?',
    answer:
      'Seek structured support when school feedback shows repeated gaps in comprehension, writing clarity, or participation, and home practice is not creating stable progress across these areas.',
  },
];

export default function EnglishClassesFor7To10YearOldPage() {
  useEffect(() => {
    applySeo({
      title: 'English Classes for 7 to 10 Year Old: Age-Stage Learning Support | Tiny Steps Learning',
      description:
        'Parent guide to English classes for 7 to 10 year olds: age-stage expectations, common school-language gaps, and structured support across reading, grammar, writing, and speaking.',
      canonicalPath: '/english-classes-for-7-10-year-old',
      ogType: 'website',
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">English Classes for 7 to 10 Year Old</h1>
        <p className="mt-4 text-lg text-slate-700">
          Age-stage support for school English demands: stronger comprehension, clearer writing, better grammar transfer, and more confident speaking.
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
          For ages 7-10, English learning should move from “basic correctness” to “school-ready application.” Children need to read for meaning, write complete structured responses, and explain ideas confidently in class.
        </p>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What changes at ages 7-10</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Reading tasks become meaning-focused, not just word decoding.</li>
          <li>• Writing expectations shift from short lines to structured paragraph answers.</li>
          <li>• Grammar must transfer into real writing and speech, not only workbook correction.</li>
          <li>• Classroom participation and oral explanation start affecting overall confidence.</li>
          <li>• Children are expected to justify answers, not only select them.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Parent symptom map for this age band</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Child behavior: reads passage but cannot explain answers. What it may mean: comprehension expression gap. Next step: teach answer framing with evidence from text.</li>
          <li>• Child behavior: knows grammar rules but repeats writing errors. What it may mean: transfer gap. Next step: apply grammar in child’s own sentences daily.</li>
          <li>• Child behavior: writes very short responses. What it may mean: weak structure planning. Next step: use simple response template (point, reason, example).</li>
          <li>• Child behavior: avoids speaking in class. What it may mean: performance confidence gap. Next step: build short oral explanation routines.</li>
          <li>• Child behavior: performs unevenly across tasks. What it may mean: unbalanced skill development. Next step: use integrated weekly plan across reading-writing-speaking.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What to check at home this week</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Comprehension: can your child answer who/why/how questions with evidence from text?</li>
          <li>• Writing: can your child write 4-6 connected sentences with clear flow?</li>
          <li>• Grammar transfer: can your child self-correct common sentence errors?</li>
          <li>• Speaking: can your child explain one idea in complete sentences without freezing?</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What each result suggests</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Reading okay, writing weak: prioritize response-structure writing practice.</li>
          <li>• Grammar knowledge okay, usage weak: increase applied sentence-editing tasks.</li>
          <li>• Writing okay, speaking weak: add short oral explanation and presentation routines.</li>
          <li>• Multiple areas weak: use an integrated age-stage support pathway.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What to start doing</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Use one weekly cycle: read, discuss, write, explain aloud.</li>
          <li>• Practise answer quality with short prompts instead of only worksheet completion.</li>
          <li>• Keep grammar correction linked to child-created writing samples.</li>
          <li>• Track one visible gain per week in comprehension, writing, and speaking.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-rose-100 bg-rose-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">What to avoid</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• Do not treat this age as only grammar-drill stage.</li>
          <li>• Do not separate reading, writing, and speaking into disconnected routines for long.</li>
          <li>• Do not measure progress only by test scores without expression quality checks.</li>
          <li>• Do not overload advanced content before core response skills are stable.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-xl border border-amber-100 bg-amber-50 p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900">When to choose structured support</h2>
        <ul className="space-y-2 text-slate-700">
          <li>• School feedback repeatedly flags comprehension and answer-quality concerns.</li>
          <li>• Child works hard but written and spoken response clarity stays low.</li>
          <li>• Parent sees mixed performance and cannot identify the right focus sequence.</li>
          <li>• Child confidence drops before class participation or assessments.</li>
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
            • For broader multi-age planning:{' '}
            <Link to="/online-english-classes-for-kids-india" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Online English Classes for Kids India
            </Link>
          </li>
          <li>
            • For baseline multi-skill pathway:{' '}
            <Link to="/english-foundation-program" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              English Foundation Program
            </Link>
          </li>
          <li>
            • For reading-focused support:{' '}
            <Link to="/reading-classes-for-kids" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Reading Classes for Kids
            </Link>
          </li>
          <li>
            • For grammar-focused support:{' '}
            <Link to="/grammar" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Grammar Classes
            </Link>
          </li>
          <li>
            • For speaking-focused support:{' '}
            <Link to="/speaking" className="font-semibold underline underline-offset-2 hover:text-slate-900">
              Speaking Classes
            </Link>
          </li>
        </ul>
      </section>

      <section className="rounded-xl bg-slate-900 p-8 text-center text-white">
        <h2 className="text-2xl font-bold">Ready to strengthen age-appropriate English skills for 7-10?</h2>
        <p className="mt-2 text-slate-200">Book a free assessment and get a clear next-step plan.</p>
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
