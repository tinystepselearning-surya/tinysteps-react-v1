import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { createHowToSchema } from '../../lib/schemas';
import parentsMeta from '../../content/parentsMeta';
import AboutAuthor from '../../components/AboutAuthor';

const stepFlow = [
  {
    step: 'Step 1',
    title: 'Book the free 35-minute demo assessment',
    detail: 'Choose a suitable slot through the canonical demo-booking page. No payment is required to start.',
  },
  {
    step: 'Step 2',
    title: 'Attend the live 1:1 session',
    detail: 'The teacher checks skills relevant to your child’s age, current level, and the learning concern you shared.',
  },
  {
    step: 'Step 3',
    title: 'Review the teacher recommendation',
    detail: 'You receive level guidance, the first learning priority, and the most relevant course direction.',
  },
  {
    step: 'Step 4',
    title: 'Decide the next step',
    detail: 'Review the suggested pathway, curriculum, schedule, and pricing before deciding whether to enrol.',
  },
];

const assessmentChecks = [
  {
    title: 'Reading and decoding signals',
    detail: 'When relevant, the teacher observes how your child approaches familiar and unfamiliar words, blending, accuracy, and reading flow.',
  },
  {
    title: 'Phonics foundations',
    detail: 'When phonics is the concern, the teacher may check sound recall, blending, short-word decoding, and the patterns your child already uses confidently.',
  },
  {
    title: 'Grammar, writing, or speaking signals',
    detail: 'Depending on the child’s need, the session may include sentence formation, writing application, response length, clarity, or speaking confidence.',
  },
  {
    title: 'Starting-point recommendation',
    detail: 'The purpose is to identify one useful first priority and the pathway that best matches the child’s current stage.',
  },
];

const afterAssessmentOutcomes = [
  'A clearer picture of the child’s current independent skills',
  'One practical first learning priority instead of a broad “improve English” goal',
  'A course or pathway recommendation when Tiny Steps support is a suitable fit',
  'Simple home-practice guidance connected to the current target',
];

const trustPoints = [
  { label: 'Ages served', value: '3–12 years' },
  { label: 'Assessment duration', value: '35 minutes live' },
  { label: 'Format', value: '1:1 online' },
  { label: 'Decision', value: 'No obligation to enrol' },
];

const prepChecklist = [
  'Keep a recent school notebook, reading book, or writing sample nearby if it relates to your concern.',
  'Use a quiet space and test the microphone, camera, and internet connection before the session.',
  'Tell the teacher the main concern in one sentence, such as “she knows sounds but guesses words” or “he speaks well but struggles to write.”',
  'Tell your child this is a friendly learning session, not an exam.',
];

const firstWeekPlan = [
  'Ask the teacher for one exact home target connected to the starting level.',
  'Keep practice short and repeat the same target across fresh examples.',
  'Notice how much prompting the child still needs rather than counting worksheets completed.',
  'Avoid teaching several new rules or patterns ahead of the current plan.',
  'At the next review, compare what the child can now do independently with the original baseline.',
];

const whyParentsStartHere = [
  {
    title: 'Placement before purchase',
    detail: 'The assessment gives parents a clearer starting point before they choose a course or package.',
  },
  {
    title: 'No-pressure decision',
    detail: 'The demo assessment is free. Parents can review the recommendation, curriculum, and pricing before enrolling.',
  },
  {
    title: 'Specific next step',
    detail: 'A useful recommendation should identify the first learning priority rather than giving only a general level label.',
  },
];

const commonMistakes = [
  'Choosing a course only by age without checking the child’s present skills.',
  'Comparing with other children instead of tracking the same child over time.',
  'Adding random worksheets before the current target has had enough practice.',
];

const parentScripts = [
  'Before class: “This is a short learning session. Just show the teacher what you can do.”',
  'During practice: “Try the strategy your teacher showed you before I help.”',
  'After practice: “I liked how you retried that part independently.”',
];

const GettingStarted: React.FC = () => {
  useEffect(() => {
    const howToSchema = createHowToSchema(
      'Getting Started with Tiny Steps Learning',
      stepFlow.map((step) => `${step.step}: ${step.title} - ${step.detail}`),
    );

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
        { '@type': 'ListItem', position: 2, name: 'Parents Hub', item: 'https://tinystepslearning.com/parents' },
        { '@type': 'ListItem', position: 3, name: 'Getting Started', item: 'https://tinystepslearning.com/parents/getting-started' },
      ],
    };

    applySeo({
      ...parentsMeta['/parents/getting-started'],
      jsonLd: [howToSchema, breadcrumbSchema],
    });
  }, []);

  return (
    <article className="mx-auto max-w-6xl px-6 py-8 md:py-12">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-orange-50 shadow-sm">
        <div className="px-6 py-8 md:px-10 md:py-12">
          <div className="inline-flex items-center rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
            Tiny Steps • Parent Onboarding Guide
          </div>
          <h1 className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">Getting Started with Tiny Steps</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700 md:text-lg">
            Start with one free 35-minute 1:1 online demo assessment class. The goal is to understand your child’s current stage, identify the first useful learning priority, and review the most suitable next pathway before you enrol.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link to="/book-demo" className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              Book Free 35-Minute Demo
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
        <h2 className="text-2xl font-bold text-slate-900">The four-step starting process</h2>
        <p className="mt-2 text-sm text-slate-600">A simple flow so you know what happens before any paid programme begins.</p>
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
        <h2 className="text-2xl font-bold text-slate-900">What may be checked in the assessment?</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          The session should match the concern you shared. A child does not need every English skill tested in one sitting.
        </p>
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
          <h2 className="text-xl font-bold text-slate-900">What you should understand after the assessment</h2>
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
          <h2 className="text-xl font-bold text-slate-900">Why start with placement?</h2>
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
          <h2 className="text-xl font-bold text-slate-900">Prepare for the demo in a few minutes</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {prepChecklist.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">What to do in the first week after enrolment</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {firstWeekPlan.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6">
          <h2 className="text-xl font-bold text-slate-900">Common mistakes to avoid</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {commonMistakes.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-xl font-bold text-slate-900">Parent scripts that keep the first week useful</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {parentScripts.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </section>

      <AboutAuthor className="mt-12" />

      <section className="mt-12 rounded-3xl border border-slate-200 bg-slate-900 px-6 py-8 text-white md:px-8">
        <h2 className="text-2xl font-bold">Ready to identify the right starting point?</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-200 md:text-base">
          Book the free 35-minute 1:1 online demo assessment class, review the recommendation, and decide whether the proposed pathway fits your child before enrolling.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link to="/book-demo" className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
            Book Free 35-Minute Demo
          </Link>
          <Link to="/parents/choosing-course" className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
            Choose the Right Course
          </Link>
        </div>
      </section>
    </article>
  );
};

export default GettingStarted;
