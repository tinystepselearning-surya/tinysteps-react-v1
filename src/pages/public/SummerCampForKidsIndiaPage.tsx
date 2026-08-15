import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema } from '../../lib/schemas';
import { PUBLIC_SITE_FACTS, SUMMER_CAMP_2026_ARCHIVE_LABEL } from '../../config/publicFacts';

const summer = PUBLIC_SITE_FACTS.summerCamp2026;

const faqItems = [
  {
    question: 'Is Tiny Steps Summer Camp 2026 currently open?',
    answer: `No. The 2026 season concluded on ${summer.endDateLabel}. This page is retained as an India-focused summer-learning planning guide and historical archive.`,
  },
  {
    question: 'What should parents look for in an online summer learning programme?',
    answer: 'Look for a clear starting-level check, a focused skill goal, teacher-led practice, cumulative progression, useful feedback, and evidence that the child can apply the skill to fresh examples.',
  },
  {
    question: 'Should a summer programme promise mastery in a few weeks?',
    answer: 'No. A short programme can create focused practice and momentum, but durable reading, grammar, and communication skills need continued application after the seasonal programme ends.',
  },
  {
    question: 'What can Tiny Steps parents use now?',
    answer: 'Year-round phonics, reading, grammar, and speaking programmes are available. Families can book a regular free 35-minute 1:1 demo assessment class before choosing a pathway.',
  },
];

export default function SummerCampForKidsIndiaPage() {
  useEffect(() => {
    applySeo({
      title: 'Summer Camp for Kids India: 2026 Archive & Parent Planning Guide',
      description: `Tiny Steps Summer Camp 2026 concluded on ${summer.endDateLabel}. Use this evergreen parent guide to compare online summer learning by goal, structure, teaching quality, and transfer evidence.`,
      canonicalPath: '/summer-camp-for-kids-india',
      ogType: 'website',
      jsonLd: [createFAQPageSchema(faqItems)],
    });
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
        {SUMMER_CAMP_2026_ARCHIVE_LABEL} Enrollment is closed. The material below is retained for parent planning, not as a current offer.
      </div>

      <section className="py-12 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">India parent planning guide</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">How to choose a useful summer learning programme for your child</h1>
        <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-700">
          A good summer programme should solve a specific learning problem—not simply fill the calendar. Start with the child’s present reading, grammar, or communication gap, then choose a programme that teaches, practises, checks, and revisits that skill.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        {[
          ['1. Start with the bottleneck', 'A child who cannot blend words needs a different plan from a child who reads fluently but struggles with comprehension or sentence formation.'],
          ['2. Check the sequence', 'The programme should explain what is taught first, what builds next, and how earlier learning is reviewed instead of offering unrelated daily activities.'],
          ['3. Check active practice', 'Children need to read, write, answer, explain, or speak during the session. Passive watching is not a substitute for guided performance.'],
          ['4. Check transfer', 'Ask how the teacher verifies learning on a fresh word, sentence, story, or speaking prompt that was not rehearsed in advance.'],
          ['5. Check correction quality', 'Useful feedback identifies the error, models the right strategy, lets the child retry, and revisits the same skill later.'],
          ['6. Check the post-programme plan', 'A short seasonal programme should end with a clear next step so progress continues after the holiday period.'],
        ].map(([title, text]) => (
          <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            <p className="mt-2 leading-7 text-slate-700">{text}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-7 sm:p-9">
        <h2 className="text-2xl font-bold text-slate-900">Tiny Steps Summer Camp 2026 — historical context</h2>
        <p className="mt-3 leading-7 text-slate-700">
          The 2026 season ran from {summer.startDateLabel} to {summer.endDateLabel}. Historical tracks covered phonics, grammar, and speaking in focused four-week batches. Those dates, batch details, and historical fees are no longer enrollment terms.
        </p>
        <Link to="/summer-camps" className="mt-5 inline-block font-semibold text-slate-900 underline underline-offset-4">Review the full 2026 archive</Link>
      </section>

      <section className="mt-10 rounded-3xl bg-slate-900 p-7 text-white sm:p-9">
        <h2 className="text-2xl font-bold">Need English support now?</h2>
        <p className="mt-3 max-w-2xl text-slate-200">Use Tiny Steps year-round programmes rather than an expired seasonal offer. A regular assessment can identify the child’s current starting point.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/courses" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900">Explore courses</Link>
          <Link to="/book-demo" className="rounded-full border border-slate-600 px-5 py-3 text-sm font-semibold text-white">Book regular 35-minute assessment</Link>
        </div>
      </section>

      <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-7 sm:p-9">
        <h2 className="text-2xl font-bold text-slate-900">FAQs</h2>
        <div className="mt-5 space-y-5">
          {faqItems.map((item) => (
            <article key={item.question}>
              <h3 className="font-semibold text-slate-900">{item.question}</h3>
              <p className="mt-1 leading-6 text-slate-700">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
