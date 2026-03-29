import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { createHowToSchema } from '../../lib/schemas';
import parentsMeta from '../../content/parentsMeta';

const trustPoints = [
  { label: 'Recommended daily time', value: '10-15 minutes' },
  { label: 'Best age range', value: '3-10 years' },
  { label: 'Core reading targets', value: 'Accuracy, fluency, meaning' },
  { label: 'Parent role', value: 'Coach, not examiner' },
];

const evidenceBlocks = [
  {
    title: 'Phonics + decoding first',
    detail: 'Systematic phonics helps early readers decode unfamiliar words more reliably than guessing from pictures. Home reading should reinforce taught sound patterns.',
    action: 'Choose texts that use sounds your child has already learned in class.',
  },
  {
    title: 'Repeated oral reading builds fluency',
    detail: 'Reading the same short passage more than once improves accuracy, smoothness, and confidence. Fluency grows through short repeated practice, not long one-time reading.',
    action: 'Re-read one short passage at the end of each session for 1-2 minutes.',
  },
  {
    title: 'Comprehension starts early',
    detail: 'Children should decode and understand together. Even in beginner texts, quick meaning checks build vocabulary, recall, and thinking habits.',
    action: 'Ask two short questions after reading: "Who?" and "What happened?"',
  },
  {
    title: 'Short routines beat long sessions',
    detail: 'Consistent daily practice produces stronger gains than occasional long sessions. A calm, predictable routine also reduces resistance.',
    action: 'Keep one fixed reading slot daily and stop while your child still feels successful.',
  },
];

const routineCards = [
  {
    step: 'Minute 1-2',
    title: 'Warm-up words',
    detail: 'Review 3 target words from yesterday using sound-by-sound decoding.',
  },
  {
    step: 'Minute 3-6',
    title: 'Guided reading',
    detail: 'Child reads one short decodable passage while you support with prompts.',
  },
  {
    step: 'Minute 7-8',
    title: 'Meaning check',
    detail: 'Ask two quick comprehension questions about who, what, and where.',
  },
  {
    step: 'Minute 9-10',
    title: 'Fluency re-read',
    detail: 'Read the same lines once more for smoother pace and confidence.',
  },
];

const stagePlan = [
  {
    stage: 'Beginner (new decoder)',
    text: 'Short CVC lines and simple SATPIN-style words',
    sample: 'Example: "Pat sat." "Sam taps."',
    parentMove: 'Track each sound, then blend; avoid picture guessing.',
  },
  {
    stage: 'Early reader',
    text: 'Short passages with one target pattern (magic-e, digraphs, bossy-r)',
    sample: 'Example: "The kite is big." "The bird can turn."',
    parentMove: 'Focus on one pattern per day and re-read for fluency.',
  },
  {
    stage: 'Growing reader',
    text: 'Short stories with vocabulary support and 3-question recall',
    sample: 'Example: 5-8 sentence passage with beginning-middle-end check.',
    parentMove: 'Ask for retell using full sentences, not one-word answers.',
  },
];

const troubleshooting = [
  {
    problem: 'My child stops at every difficult word',
    fix: 'Use this prompt: "Say the sounds slowly, then blend." Give one model and ask for retry.',
  },
  {
    problem: 'My child reads words but does not understand',
    fix: 'Pause after each 1-2 lines and ask one meaning question immediately.',
  },
  {
    problem: 'My child avoids reading time',
    fix: 'Reduce to 5 minutes for 3 days, add choice of text, then return to 10 minutes.',
  },
  {
    problem: 'Reading is accurate but still slow',
    fix: 'Use repeated reading: same short passage twice, then celebrate smoother second read.',
  },
];

const questionBank = [
  'Who is this part about?',
  'What happened first?',
  'Which word tells us where?',
  'Why do you think that happened?',
  'How does the character feel now?',
];

const parentScripts = [
  'Before reading: "We will read for 10 minutes and stop."',
  'During reading: "Try it slowly first, then say it smoothly."',
  'After reading: "I liked how you retried the tricky word."',
];

const progressChecklist = [
  'My child decodes more words without help than last week.',
  'Reading feels smoother on second read of the same passage.',
  'My child answers 1-2 meaning questions with confidence.',
  'Reading time has become a calmer daily habit.',
];

const ReadingAtHome: React.FC = () => {
  useEffect(() => {
    const howToSchema = createHowToSchema(
      'How to Build a Daily Reading Routine at Home',
      [
        'Minute 1-2: Warm-up words - Review 3 target words from yesterday using sound-by-sound decoding',
        'Minute 3-6: Guided reading - Child reads one short decodable passage while you support with prompts',
        'Minute 7-8: Meaning check - Ask two quick comprehension questions about who, what, and where',
        'Choose texts that use sounds your child has already learned in class',
        'Re-read one short passage at the end of each session for 1-2 minutes',
        'Ask two short questions after reading: Who and What happened',
        'Keep one fixed reading slot daily and stop while your child still feels successful'
      ]
    );

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
        { '@type': 'ListItem', position: 2, name: 'Parents Hub', item: 'https://tinystepslearning.com/parents' },
        { '@type': 'ListItem', position: 3, name: 'Reading at Home', item: 'https://tinystepslearning.com/parents/reading-at-home' }
      ]
    };

    const metaWithSchema = {
      ...parentsMeta['/parents/reading-at-home'],
      jsonLd: [howToSchema, breadcrumbSchema]
    };

    applySeo(metaWithSchema);
  }, []);

  return (
  <article className="mx-auto max-w-6xl px-6 py-8 md:py-12">
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-amber-50 via-white to-sky-50 shadow-sm">
      <div className="px-6 py-8 md:px-10 md:py-12">
        <div className="inline-flex items-center rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
          Tiny Steps • Foundations Forever
        </div>
        <h1 className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">Reading at Home: Science-Backed Daily Routine</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700 md:text-lg">
          A calm 10-minute reading routine can improve decoding, fluency, and understanding when it is consistent and level-appropriate.
          This page gives you the exact parent plan to use every day.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link to="/?book=1" className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
            Book Free Assessment
          </Link>
          <Link to="/curriculum" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50">
            View Reading Path
          </Link>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {trustPoints.map((point) => (
            <div key={point.label} className="rounded-2xl border border-white/80 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{point.label}</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{point.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="mt-10">
      <h2 className="text-2xl font-bold text-slate-900">What research consistently shows</h2>
      <p className="mt-2 text-sm text-slate-600">Evidence-informed principles translated into parent actions.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {evidenceBlocks.map((item) => (
          <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">{item.detail}</p>
            <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
              Parent action: {item.action}
            </p>
          </div>
        ))}
      </div>
    </section>

    <section className="mt-12">
      <h2 className="text-2xl font-bold text-slate-900">10-minute daily reading routine</h2>
      <p className="mt-2 text-sm text-slate-600">Short, repeatable, and realistic for busy families.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {routineCards.map((card) => (
          <div key={card.step} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">{card.step}</p>
            <h3 className="mt-2 text-base font-semibold text-slate-900">{card.title}</h3>
            <p className="mt-2 text-sm text-slate-700">{card.detail}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="mt-12">
      <h2 className="text-2xl font-bold text-slate-900">What to read at each stage</h2>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {stagePlan.map((stage) => (
          <div key={stage.stage} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-base font-semibold text-slate-900">{stage.stage}</h3>
            <p className="mt-2 text-sm text-slate-700"><strong>Text type:</strong> {stage.text}</p>
            <p className="mt-2 text-sm text-slate-700"><strong>Sample:</strong> {stage.sample}</p>
            <p className="mt-2 text-sm text-slate-700"><strong>Parent move:</strong> {stage.parentMove}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="mt-12 grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6">
        <h2 className="text-xl font-bold text-slate-900">Troubleshooting in real time</h2>
        <div className="mt-4 space-y-3">
          {troubleshooting.map((item) => (
            <div key={item.problem} className="rounded-xl border border-rose-100 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">{item.problem}</p>
              <p className="mt-1 text-sm text-slate-700">{item.fix}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-xl font-bold text-slate-900">Parent script bank</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
          {parentScripts.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h3 className="mt-6 text-base font-semibold text-slate-900">Question bank (copy and use)</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
          {questionBank.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>

    <section className="mt-12 grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Weekly progress checklist</h2>
        <ul className="mt-4 space-y-3 text-sm text-slate-700">
          {progressChecklist.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Keep reading joyful, not stressful</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>Stop before fatigue. End with one success sentence.</li>
          <li>Use one text level below frustration when motivation drops.</li>
          <li>Correct once, then return to flow. Avoid over-correcting every line.</li>
          <li>Pair this with daily phonics practice for faster transfer into reading.</li>
        </ul>
      </div>
    </section>

    <section className="mt-12 rounded-3xl border border-slate-200 bg-slate-900 px-6 py-8 text-white md:px-8">
      <h2 className="text-2xl font-bold">Need a personalized reading plan?</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-200 md:text-base">
        Book a free assessment to identify your childs exact reading stage and get a practical home routine matched to that level.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link to="/?book=1" className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
          Book Free Assessment
        </Link>
        <Link to="/phonics" className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
          Explore Phonics Classes
        </Link>
      </div>
    </section>
  </article>
);

}

export default ReadingAtHome;
