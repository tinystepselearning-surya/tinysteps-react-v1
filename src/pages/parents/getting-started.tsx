import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { createHowToSchema } from '../../lib/schemas';
import parentsMeta from '../../content/parentsMeta';
import AboutAuthor from '../../components/AboutAuthor';

const stepFlow = [
  {
    step: 'Step 1',
    title: 'Book free assessment',
    detail: 'Pick a convenient time from Courses. No payment required to start.',
  },
  {
    step: 'Step 2',
    title: 'Attend 35-minute session',
    detail: 'A friendly live check of reading, letter-sound recall, and speaking confidence.',
  },
  {
    step: 'Step 3',
    title: 'Get teacher recommendation',
    detail: 'You receive level guidance, course fit, and next learning priorities.',
  },
  {
    step: 'Step 4',
    title: 'Start with confidence',
    detail: 'Begin with the right plan instead of trial-and-error worksheets.',
  },
];

const assessmentChecks = [
  {
    title: 'Reading check',
    detail: 'We review decoding comfort, fluency pace, and how your child handles unfamiliar words.',
  },
  {
    title: 'Letter-sound check',
    detail: 'We test sound recall, blending readiness, and core phonics foundations.',
  },
  {
    title: 'Speaking confidence check',
    detail: 'We observe sentence clarity, response confidence, and participation style.',
  },
  {
    title: 'Teacher recommendation',
    detail: 'You get a level match and course direction aligned to your childs current stage.',
  },
];

const afterAssessmentOutcomes = [
  'Recommended level your child can handle confidently',
  'Course suggestion with a clear next-step sequence',
  'Curriculum direction for phonics, grammar, or speaking priorities',
  'Home practice guidance you can apply in 10-minute routines',
];

const trustPoints = [
  { label: 'Ages served', value: '3-12 years' },
  { label: 'Assessment duration', value: '35 minutes live' },
  { label: 'Parent update', value: 'Within 12 hours' },
  { label: 'Approach', value: 'Personalized and no pressure' },
];

const prepChecklist = [
  'Keep 6-8 lowercase letter cards or a small alphabet chart ready.',
  'Keep one short reading sample (or school notebook) nearby.',
  'Choose a quiet space and test mic/camera 5 minutes early.',
  'Tell your child: "This is a friendly check, not an exam."',
];

const firstWeekPlan = [
  'Day 1: Ask teacher for one exact home target (example: blend 5 CVC words).',
  'Day 2-3: Run a fixed 10-minute routine at the same time.',
  'Day 4: Send one short progress note to the teacher.',
  'Day 5-6: Repeat only the same target; avoid adding random worksheets.',
  'Day 7: Do a mini review and celebrate one clear improvement.',
];

const whyParentsStartHere = [
  {
    title: 'Personalized from day one',
    detail: 'Children start at the right level, so progress feels steady and motivating.',
  },
  {
    title: 'No-pressure decision',
    detail: 'The assessment is free and guidance-led. Parents can decide calmly after clarity.',
  },
  {
    title: 'Fast useful feedback',
    detail: 'You leave with practical next steps instead of generic advice.',
  },
];

const commonMistakes = [
  'Waiting too long to assess, which delays easy early correction.',
  'Comparing with other children instead of tracking personal progress.',
  'Changing routines every two days before one target becomes stable.',
];

const parentScripts = [
  'Before class: "Let us do a short warm-up and try our best."',
  'During practice: "Show me how you sounded that word."',
  'After practice: "I liked how you stayed with the tricky part."',
];

const GettingStarted: React.FC = () => {
  useEffect(() => {
    const howToSchema = createHowToSchema(
      'Getting Started with Tiny Steps Learning',
      stepFlow.map(step => `${step.step}: ${step.title} - ${step.detail}`)
    );

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
        { '@type': 'ListItem', position: 2, name: 'Parents Hub', item: 'https://tinystepslearning.com/parents' },
        { '@type': 'ListItem', position: 3, name: 'Getting Started', item: 'https://tinystepslearning.com/parents/getting-started' }
      ]
    };

    const metaWithSchema = {
      ...parentsMeta['/parents/getting-started'],
      jsonLd: [howToSchema, breadcrumbSchema]
    };

    applySeo(metaWithSchema);
  }, []);

  return (
    <article className="mx-auto max-w-6xl px-6 py-8 md:py-12">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-orange-50 shadow-sm">
        <div className="px-6 py-8 md:px-10 md:py-12">
          <div className="inline-flex items-center rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
            Tiny Steps • Foundations Forever
          </div>
          <h1 className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">Getting Started with Tiny Steps</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700 md:text-lg">
            Your childs learning journey starts with the right level, the right teacher, and one simple first step.
            Every child begins with a free 35-minute assessment focused on reading, letter-sound knowledge, and speaking confidence.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link to="/?book=1" className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              Book Free Assessment
            </Link>
            <Link to="/courses" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50">
              Compare Courses
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
        <h2 className="text-2xl font-bold text-slate-900">Simple 4-step start</h2>
        <p className="mt-2 text-sm text-slate-600">A clear flow so parents know exactly what happens next.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stepFlow.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">{item.step}</p>
              <h3 className="mt-2 text-base font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-slate-900">What happens in the assessment?</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {assessmentChecks.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">What you receive after the assessment</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            {afterAssessmentOutcomes.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Why parents start here</h2>
          <div className="mt-4 space-y-4">
            {whyParentsStartHere.map((item) => (
              <div key={item.title} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-700">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Prepare in 10 minutes</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {prepChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">First 7 days after enrollment</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {firstWeekPlan.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6">
          <h2 className="text-xl font-bold text-slate-900">Common mistakes to avoid</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {commonMistakes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-xl font-bold text-slate-900">Parent scripts that keep practice positive</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {parentScripts.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <AboutAuthor className="mt-12" />

      <section className="mt-12 rounded-3xl border border-slate-200 bg-slate-900 px-6 py-8 text-white md:px-8">
        <h2 className="text-2xl font-bold">Ready to begin with clarity?</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-200 md:text-base">
          Start with the free assessment and get a clear recommendation before enrolling.
          This keeps learning focused, reduces stress, and helps your child progress faster.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link to="/?book=1" className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
            Book Your Free Assessment
          </Link>
          <Link to="/phonics" className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
            Explore Phonics Classes
          </Link>
        </div>
      </section>
    </article>
  );
};

export default GettingStarted;
