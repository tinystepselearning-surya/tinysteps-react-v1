import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../lib/seo';
import { createFAQPageSchema } from '../lib/schemas';
import {
  PUBLIC_SITE_FACTS,
  SUMMER_CAMP_2026_ARCHIVE_LABEL,
  formatPublicInr,
} from '../config/publicFacts';

const summer = PUBLIC_SITE_FACTS.summerCamp2026;

const historicalTracks = [
  {
    title: 'Phonics Fast Track',
    ages: 'Ages 4–8',
    href: '/summer-camps/phonics-fast-track',
    description: 'A focused seasonal track for sound review, blending, decoding, and early reading confidence.',
  },
  {
    title: 'Grammar Fast Track',
    ages: 'Ages 6–12',
    href: '/summer-camps/grammar-fast-track',
    description: 'A focused seasonal track for sentence structure, grammar application, punctuation, and writing clarity.',
  },
  {
    title: 'Speaking Fast Track',
    ages: 'Ages 6–12',
    href: '/summer-camps/speaking-fast-track',
    description: 'A focused seasonal track for structured answers, storytelling, presentation flow, and speaking confidence.',
  },
];

const faqItems = [
  {
    question: 'Is Tiny Steps Summer Camp 2026 still open?',
    answer: `No. Tiny Steps Summer Camp 2026 concluded on ${summer.endDateLabel}. This page is retained as an archive and an evergreen guide for families planning future school-break learning.`,
  },
  {
    question: 'When did Summer Camp 2026 run?',
    answer: `The 2026 season ran from ${summer.startDateLabel} to ${summer.endDateLabel}. Each historical batch followed a focused four-week learning plan.`,
  },
  {
    question: 'What were the Summer Camp 2026 tracks?',
    answer: 'The 2026 tracks were Phonics Fast Track, Grammar Fast Track, and Speaking Fast Track. Each route is retained as a historical programme summary rather than an active enrollment page.',
  },
  {
    question: 'What can parents use now?',
    answer: 'Tiny Steps year-round phonics, grammar, reading, and speaking programmes remain available. Parents can start with the course pages or a regular free 35-minute 1:1 demo assessment class.',
  },
  {
    question: 'Will Tiny Steps run another summer programme?',
    answer: 'Future seasonal programmes will be published only when dates, format, capacity, and enrollment terms are confirmed. The 2026 archive should not be treated as a current offer.',
  },
];

export default function SummerCampsPage() {
  useEffect(() => {
    applySeo({
      title: 'Tiny Steps Summer Camp 2026 Archive & Summer Learning Guide',
      description: `Tiny Steps Summer Camp 2026 concluded on ${summer.endDateLabel}. Review the historical tracks and use this evergreen guide to plan reading, grammar, and speaking support during school breaks.`,
      canonicalPath: '/summer-camps',
      ogType: 'website',
      jsonLd: [createFAQPageSchema(faqItems)],
    });
  }, []);

  return (
    <main className="bg-slate-50">
      <section className="border-b border-amber-200 bg-amber-50">
        <div className="mx-auto max-w-6xl px-4 py-3 text-center text-sm font-semibold text-amber-900 sm:px-6">
          {SUMMER_CAMP_2026_ARCHIVE_LABEL} Enrollment is closed; this page is an archive and planning resource.
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Seasonal archive</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Summer Camp 2026: what ran, what families learned, and what to use now
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
            Tiny Steps Summer Camp 2026 ran from {summer.startDateLabel} to {summer.endDateLabel}. The season is complete. We keep this page online because the learning structure, parent decision criteria, and school-break planning ideas remain useful even after enrollment closes.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/courses" className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
              Explore year-round courses
            </Link>
            <Link to="/book-demo" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800">
              Book regular 35-minute assessment
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Season</div>
            <div className="mt-2 font-bold text-slate-900">{summer.startDateLabel} – {summer.endDateLabel}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Historical format</div>
            <div className="mt-2 font-bold text-slate-900">{summer.classCount} live classes / {summer.batchDurationWeeks} weeks</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Historical batch cap</div>
            <div className="mt-2 font-bold text-slate-900">Up to {summer.batchCap} learners</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Historical fee</div>
            <div className="mt-2 font-bold text-slate-900">₹{formatPublicInr(summer.historicalEnrollmentPriceInr)}</div>
            <div className="mt-1 text-xs text-slate-500">Archive only — not a current price</div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-slate-900">Historical 2026 tracks</h2>
          <p className="mt-2 max-w-3xl text-slate-700">
            These links explain what each 2026 track focused on. They are programme archives, not active seat-booking pages.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {historicalTracks.map((track) => (
              <Link key={track.title} to={track.href} className="rounded-2xl border border-slate-200 p-5 transition hover:border-slate-400">
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">{track.ages}</div>
                <h3 className="mt-2 text-lg font-bold text-slate-900">{track.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{track.description}</p>
                <span className="mt-4 inline-block text-sm font-semibold text-slate-900">View archive →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-12 sm:px-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-slate-900">How to plan useful English learning during a school break</h2>
          <ol className="mt-5 space-y-4 text-slate-700">
            <li><strong>1. Diagnose one bottleneck.</strong> Decide whether the main issue is decoding, reading fluency, grammar/writing, or speaking confidence.</li>
            <li><strong>2. Choose one measurable outcome.</strong> For example: blend unfamiliar CVC words, retell a short passage, write clearer sentences, or answer in complete thoughts.</li>
            <li><strong>3. Keep practice cumulative.</strong> New work should reuse earlier skills rather than replacing them with unrelated activities each day.</li>
            <li><strong>4. Check transfer.</strong> Use fresh words, sentences, stories, or speaking prompts so progress is not confused with memorisation.</li>
            <li><strong>5. Protect rest.</strong> A school break should still leave room for play, family time, sleep, and unstructured reading.</li>
          </ol>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-slate-900">Year-round Tiny Steps options</h2>
          <div className="mt-5 space-y-3">
            {[
              ['/phonics', 'Phonics', 'For sound-symbol knowledge, blending, decoding, spelling patterns, and early reading.'],
              ['/reading-classes-for-kids', 'Reading', 'For fluency, comprehension, vocabulary, and reading confidence.'],
              ['/grammar', 'Grammar', 'For sentence formation, grammar application, and writing clarity.'],
              ['/speaking', 'Speaking', 'For structured answers, storytelling, expression, and public speaking.'],
            ].map(([href, title, description]) => (
              <Link key={href} to={href} className="block rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
                <div className="font-semibold text-slate-900">{title}</div>
                <div className="mt-1 text-sm text-slate-600">{description}</div>
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-slate-900">Summer Camp 2026 FAQs</h2>
          <div className="mt-6 space-y-5">
            {faqItems.map((item) => (
              <article key={item.question}>
                <h3 className="font-semibold text-slate-900">{item.question}</h3>
                <p className="mt-1 leading-6 text-slate-700">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
