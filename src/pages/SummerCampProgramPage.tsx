import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { applySeo } from '../lib/seo';
import { createFAQPageSchema } from '../lib/schemas';
import { PUBLIC_SITE_FACTS, SUMMER_CAMP_2026_ARCHIVE_LABEL } from '../config/publicFacts';

const summer = PUBLIC_SITE_FACTS.summerCamp2026;

type ProgramConfig = {
  slug: string;
  title: string;
  ages: string;
  focus: string;
  learned: string[];
  transferChecks: string[];
  yearRoundHref: string;
  yearRoundLabel: string;
};

const PROGRAMS: Record<string, ProgramConfig> = {
  'phonics-fast-track': {
    slug: 'phonics-fast-track',
    title: 'Phonics Fast Track',
    ages: 'Ages 4–8',
    focus: 'sound review, blending, decoding, word reading, and early reading confidence',
    learned: ['sound-symbol review', 'oral and printed blending', 'decoding unfamiliar words', 'guided sentence reading'],
    transferChecks: ['Read a new word rather than a memorised list.', 'Blend sounds without relying on picture guessing.', 'Carry a taught pattern into a fresh sentence.'],
    yearRoundHref: '/phonics',
    yearRoundLabel: 'Explore year-round phonics',
  },
  'grammar-fast-track': {
    slug: 'grammar-fast-track',
    title: 'Grammar Fast Track',
    ages: 'Ages 6–12',
    focus: 'sentence structure, grammar application, punctuation, editing, and writing clarity',
    learned: ['sentence construction', 'tense and agreement practice', 'punctuation in context', 'guided editing and rewriting'],
    transferChecks: ['Apply a rule in a new sentence.', 'Spot and correct an error independently.', 'Use grammar while writing rather than only naming the rule.'],
    yearRoundHref: '/grammar',
    yearRoundLabel: 'Explore year-round grammar',
  },
  'speaking-fast-track': {
    slug: 'speaking-fast-track',
    title: 'Speaking Fast Track',
    ages: 'Ages 6–12',
    focus: 'structured answers, storytelling, presentation flow, clarity, and speaking confidence',
    learned: ['answer expansion', 'idea organisation', 'storytelling structure', 'presentation delivery and expression'],
    transferChecks: ['Answer an unfamiliar question in complete thoughts.', 'Organise a short response without memorising a script.', 'Speak with useful pace, clarity, and expression.'],
    yearRoundHref: '/speaking',
    yearRoundLabel: 'Explore year-round speaking',
  },
};

function titleCase(value: string) {
  return value.split(/[-_]/g).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export default function SummerCampProgramPage() {
  const { programSlug, batchSlug } = useParams<{ programSlug: string; batchSlug?: string }>();
  const program = useMemo(() => (programSlug ? PROGRAMS[programSlug] ?? null : null), [programSlug]);

  useEffect(() => {
    const title = program ? `${program.title} Summer Camp 2026 Archive | Tiny Steps` : 'Summer Camp 2026 Archive | Tiny Steps';
    const description = program
      ? `${program.title} was part of Tiny Steps Summer Camp 2026, which concluded on ${summer.endDateLabel}. Review the historical learning focus and year-round next steps.`
      : `Tiny Steps Summer Camp 2026 concluded on ${summer.endDateLabel}.`;
    const faq = program
      ? [
          { question: `What is the status of ${program.title}?`, answer: `${SUMMER_CAMP_2026_ARCHIVE_LABEL} This page is retained as a historical programme summary.` },
          { question: `What did ${program.title} focus on?`, answer: `The 2026 track focused on ${program.focus}.` },
          { question: 'What should parents use now?', answer: `Use the year-round Tiny Steps pathway at ${program.yearRoundHref} or book a regular assessment to identify the child's current starting point.` },
        ]
      : [];

    applySeo({
      title: batchSlug ? `${titleCase(batchSlug)} | ${title}` : title,
      description,
      canonicalPath: batchSlug ? `/summer-camps/${programSlug}/${batchSlug}` : `/summer-camps/${programSlug}`,
      robots: batchSlug || !program ? 'noindex, follow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
      noIndex: Boolean(batchSlug) || !program,
      ogType: 'website',
      jsonLd: faq.length ? [createFAQPageSchema(faq)] : [],
    });
  }, [program, programSlug, batchSlug]);

  if (!program) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-bold text-slate-900">Summer Camp programme archive</h1>
        <p className="mt-3 text-slate-700">This programme record is not available. Summer Camp 2026 concluded on {summer.endDateLabel}.</p>
        <Link to="/summer-camps" className="mt-6 inline-block rounded-full bg-slate-900 px-5 py-3 font-semibold text-white">View Summer Camp archive</Link>
      </main>
    );
  }

  return (
    <main className="bg-slate-50">
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-900">
        {SUMMER_CAMP_2026_ARCHIVE_LABEL} This page is retained for historical learning context.
      </div>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <nav className="text-sm text-slate-500" aria-label="Breadcrumb">
          <Link to="/summer-camps" className="font-semibold hover:text-slate-900">Summer Camp archive</Link>
          <span className="px-2">/</span>
          <span>{program.title}</span>
        </nav>
        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Historical 2026 programme</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">{program.title}</h1>
        <p className="mt-4 text-lg text-slate-700">{program.ages} · Historical focus: {program.focus}.</p>
        <p className="mt-4 max-w-3xl leading-7 text-slate-700">
          This track was part of Tiny Steps Summer Camp 2026, which concluded on {summer.endDateLabel}. Outdated schedules, fees, and promotional details are intentionally omitted. The page is retained so parents can understand the learning design and choose an appropriate year-round pathway today.
        </p>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 pb-12 sm:px-6 md:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-2xl font-bold text-slate-900">What the track taught</h2>
          <ul className="mt-4 space-y-3 text-slate-700">
            {program.learned.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-2xl font-bold text-slate-900">What counts as real transfer</h2>
          <ul className="mt-4 space-y-3 text-slate-700">
            {program.transferChecks.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </article>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        <div className="rounded-3xl bg-slate-900 p-7 text-white sm:p-9">
          <h2 className="text-2xl font-bold">What families can do now</h2>
          <p className="mt-3 max-w-2xl text-slate-200">
            If this learning need is still relevant, use the year-round programme or a regular Tiny Steps assessment to identify the child’s current level and next step.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to={program.yearRoundHref} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900">{program.yearRoundLabel}</Link>
            <Link to="/book-demo" className="rounded-full border border-slate-600 px-5 py-3 text-sm font-semibold text-white">Book regular 35-minute assessment</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
