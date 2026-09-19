import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo, getRouteConfig } from '../../lib/seo';
import {
  PUBLIC_FACTS,
  SITE_ORIGIN,
  createFAQPageSchema,
  createWebPageSchema,
} from '../../lib/schemas';
import {
  SPEAKING_PROGRESS_DIMENSIONS,
  SPEAKING_PROGRESS_FRAMEWORK_GUARDRAILS,
  SPEAKING_PROGRESS_FRAMEWORK_NAME,
  SPEAKING_PROGRESS_FRAMEWORK_PATH,
  SPEAKING_PROGRESS_OBSERVATION_BANDS,
  SPEAKING_PROGRESS_PARENT_SUMMARY_FIELDS,
  SPEAKING_PROGRESS_REVIEW_LOOP,
} from '../../lib/speakingProgressFramework';

const routeSeo = getRouteConfig(SPEAKING_PROGRESS_FRAMEWORK_PATH);
const canonicalUrl = `${SITE_ORIGIN}${SPEAKING_PROGRESS_FRAMEWORK_PATH}`;
const pageTitle =
  routeSeo?.title ?? 'How Tiny Steps Measures Speaking Progress | 10-Skill Framework';
const pageDescription =
  routeSeo?.description ??
  'See the Tiny Steps Speaking Progress Framework: 10 observable speaking dimensions, support-to-independence evidence, fresh-task transfer checks, and parent-friendly progress reviews.';

const faqItems = [
  {
    question: 'Does the Tiny Steps Speaking Progress Framework give one overall score?',
    answer:
      'No. Tiny Steps keeps the ten dimensions separate because a child can be strong in one area and still need support in another. The framework records observable evidence, the support needed, fresh-task transfer, and the next teaching priority rather than averaging everything into one score.',
  },
  {
    question: 'Is this a clinical or standardised speaking assessment?',
    answer:
      'No. It is a Tiny Steps educational observation framework for teaching, placement and parent progress conversations. It is not a diagnostic, clinical, developmental-age, IQ-style or standardised language assessment.',
  },
  {
    question: 'What counts as speaking progress?',
    answer:
      'Useful progress includes clearer and more relevant responses, better organisation, more independent language, improved storytelling or presentation structure, less reliance on adult prompts, and transfer of the same skill to a comparable fresh task.',
  },
  {
    question: 'Does Tiny Steps judge a child’s accent or personality?',
    answer:
      'No. Delivery is judged by whether the listener can comfortably follow the message. Accent conformity, loudness, extroversion, theatrical performance and constant eye contact are not the definition of speaking progress.',
  },
  {
    question: 'Do all children need to improve across all ten dimensions at the same speed?',
    answer:
      'No. Children can have different speaking profiles. Tiny Steps uses the framework to identify the current bottleneck and choose one useful next target instead of expecting every dimension to move at the same pace.',
  },
  {
    question: 'How are multilingual children considered?',
    answer:
      'The framework records what the child demonstrates in the task and setting being observed. Differences across languages, listeners or settings are useful context and should not be converted into a diagnosis. The framework is designed for educational planning only.',
  },
];

const dimensionListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  '@id': `${canonicalUrl}#speaking-progress-dimensions`,
  name: 'Ten Tiny Steps speaking progress dimensions',
  numberOfItems: SPEAKING_PROGRESS_DIMENSIONS.length,
  itemListOrder: 'https://schema.org/ItemListOrderAscending',
  itemListElement: SPEAKING_PROGRESS_DIMENSIONS.map((dimension) => ({
    '@type': 'ListItem',
    position: dimension.order,
    item: {
      '@type': 'DefinedTerm',
      name: dimension.label,
      description: dimension.description,
    },
  })),
};

const observationBandSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  '@id': `${canonicalUrl}#observation-bands`,
  name: 'Tiny Steps speaking observation bands',
  numberOfItems: SPEAKING_PROGRESS_OBSERVATION_BANDS.length,
  itemListOrder: 'https://schema.org/ItemListOrderAscending',
  itemListElement: SPEAKING_PROGRESS_OBSERVATION_BANDS.map((band) => ({
    '@type': 'ListItem',
    position: band.order,
    item: {
      '@type': 'DefinedTerm',
      name: band.label,
      description: band.description,
    },
  })),
};

export default function SpeakingProgressFrameworkPage() {
  useEffect(() => {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: 'Speaking', item: `${SITE_ORIGIN}/speaking` },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Speaking Progress Framework',
          item: canonicalUrl,
        },
      ],
    };

    const webpageSchema = {
      ...createWebPageSchema({
        name: SPEAKING_PROGRESS_FRAMEWORK_NAME,
        description: pageDescription,
        url: canonicalUrl,
      }),
      about: [
        { '@type': 'Thing', name: 'children speaking progress' },
        { '@type': 'Thing', name: 'public speaking education' },
        { '@type': 'Thing', name: 'communication skills' },
      ],
      mainEntity: [
        { '@id': `${canonicalUrl}#speaking-progress-dimensions` },
        { '@id': `${canonicalUrl}#observation-bands` },
      ],
    };

    applySeo({
      title: pageTitle,
      description: pageDescription,
      canonicalPath: SPEAKING_PROGRESS_FRAMEWORK_PATH,
      robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
      ogType: 'website',
      keywords: [
        'speaking progress for kids',
        'how to measure speaking progress',
        'public speaking progress framework',
        'speaking assessment for children',
        'communication skills progress for kids',
        'public speaking rubric for kids',
      ],
      jsonLd: [
        webpageSchema,
        breadcrumbSchema,
        dimensionListSchema,
        observationBandSchema,
        createFAQPageSchema(faqItems),
      ],
    });
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#FFF9F1] via-white to-[#EEF8FF] text-slate-950">
      <section className="px-4 py-10 sm:px-6 md:py-14 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[32px] border border-orange-100 bg-white/95 p-6 shadow-sm sm:p-8 md:p-10">
            <div className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-orange-800">
              Tiny Steps educational framework
            </div>
            <h1 className="mt-4 max-w-4xl text-3xl font-black tracking-[-0.03em] text-slate-950 sm:text-4xl md:text-5xl">
              How Tiny Steps Measures Speaking Progress
            </h1>
            <p className="mt-5 max-w-4xl text-base leading-8 text-slate-700 md:text-lg">
              The {SPEAKING_PROGRESS_FRAMEWORK_NAME} looks at ten observable speaking dimensions.
              We compare what the child can do, how much support is needed, and whether the same skill
              appears again on a fresh task. We do not reduce a child&apos;s speaking profile to one
              percentage or one personality label.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['10 dimensions', 'Different parts of speaking stay visible instead of being averaged away.'],
                ['4 observation bands', 'Support is tracked from modelled participation to fresh-task transfer.'],
                ['Fresh-task evidence', 'Rehearsed success is checked again on a comparable unfamiliar task.'],
                ['One next target', 'The review ends with a useful teaching decision, not a vague label.'],
              ].map(([title, description]) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="font-bold text-slate-950">{title}</div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to="/book-demo"
                className="inline-flex min-h-[46px] items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800"
              >
                Book the free English assessment
              </Link>
              <Link
                to="/speaking"
                className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-900 hover:bg-slate-50"
              >
                Explore the Speaking programme
              </Link>
              <Link
                to="/parents/tracking-progress"
                className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-900 hover:bg-slate-50"
              >
                Parent progress guide
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-10 sm:px-6 md:pb-14 lg:px-8" aria-labelledby="framework-quick-answer">
        <div className="mx-auto max-w-6xl rounded-3xl border border-sky-100 bg-sky-50/60 p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-800">Quick answer</p>
          <h2 id="framework-quick-answer" className="mt-2 text-2xl font-black text-slate-950">
            What does Tiny Steps count as real speaking progress?
          </h2>
          <p className="mt-3 max-w-4xl leading-7 text-slate-700">
            Real progress means the child can communicate more clearly, relevantly and independently,
            then use the same underlying skill again when the exact prompt, topic, listener or material
            changes. More words, louder speech, a polished memorised script, or one successful familiar
            performance are not enough on their own.
          </p>
        </div>
      </section>

      <section className="bg-white px-4 py-12 sm:px-6 md:py-16 lg:px-8" aria-labelledby="dimensions-heading">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">The ten dimensions</p>
          <h2 id="dimensions-heading" className="mt-2 text-3xl font-black tracking-[-0.02em] text-slate-950">
            A speaking profile, not one total score
          </h2>
          <p className="mt-3 max-w-4xl leading-7 text-slate-600">
            The dimensions are deliberately separate. A child may organise ideas well but still depend on
            prompts, or speak confidently but need stronger storytelling structure. The useful question is
            which skill is limiting the next step.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {SPEAKING_PROGRESS_DIMENSIONS.map((dimension) => (
              <article key={dimension.id} className="rounded-3xl border border-slate-200 bg-[#fcfcfb] p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
                    {dimension.order}
                  </span>
                  <div>
                    <h3 className="text-xl font-black text-slate-950">{dimension.label}</h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-sky-900">{dimension.parentQuestion}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-700">{dimension.description}</p>
                <dl className="mt-5 space-y-3 text-sm leading-6">
                  <div>
                    <dt className="font-bold text-slate-950">Baseline evidence</dt>
                    <dd className="mt-1 text-slate-600">{dimension.baselineEvidence}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-slate-950">Visible progress</dt>
                    <dd className="mt-1 text-slate-600">{dimension.progressEvidence}</dd>
                  </div>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-3">
                    <dt className="font-bold text-amber-950">Do not judge it by</dt>
                    <dd className="mt-1 text-amber-900">{dimension.avoidJudgingBy}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 md:py-16 lg:px-8" aria-labelledby="bands-heading">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-700">Support-to-independence evidence</p>
          <h2 id="bands-heading" className="mt-2 text-3xl font-black tracking-[-0.02em] text-slate-950">
            Four observation bands
          </h2>
          <p className="mt-3 max-w-4xl leading-7 text-slate-600">
            These are teaching observations—not grades, age levels or standardised scores. The same child can
            sit in different bands for different dimensions.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {SPEAKING_PROGRESS_OBSERVATION_BANDS.map((band) => (
              <article key={band.id} className="rounded-3xl border border-violet-100 bg-white p-5 shadow-sm">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-violet-700">Band {band.order}</div>
                <h3 className="mt-2 text-lg font-black text-slate-950">{band.label}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-700">{band.description}</p>
                <p className="mt-4 rounded-2xl bg-violet-50 p-3 text-sm font-semibold leading-6 text-violet-950">
                  {band.evidenceQuestion}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-12 text-white sm:px-6 md:py-16 lg:px-8" aria-labelledby="assessment-use-heading">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-300">Initial assessment use</p>
              <h2 id="assessment-use-heading" className="mt-2 text-3xl font-black tracking-[-0.02em]">
                The framework guides observation; it does not turn one session into a diagnosis
              </h2>
              <p className="mt-4 leading-7 text-slate-300">
                During a speaking-focused assessment, the teacher selects tasks that match the child&apos;s age,
                current concern and likely programme fit. A single session does not need to force all ten
                dimensions into a complete scorecard. The goal is to identify the useful starting point and
                the first high-value target.
              </p>
              <Link
                to="/book-demo"
                className="mt-6 inline-flex min-h-[46px] items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-950"
              >
                See the assessment process
              </Link>
            </div>

            <ol className="grid gap-4 sm:grid-cols-2">
              {SPEAKING_PROGRESS_REVIEW_LOOP.map((step) => (
                <li key={step.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="text-xs font-black uppercase tracking-[0.16em] text-orange-300">0{step.order}</div>
                  <h3 className="mt-2 text-lg font-black">{step.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-12 sm:px-6 md:py-16 lg:px-8" aria-labelledby="parent-review-heading">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Parent progress communication</p>
          <h2 id="parent-review-heading" className="mt-2 text-3xl font-black tracking-[-0.02em] text-slate-950">
            What a useful speaking progress update should contain
          </h2>
          <p className="mt-3 max-w-4xl leading-7 text-slate-600">
            A parent update should make the evidence and next teaching decision understandable without turning
            the framework into a competitive ranking.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SPEAKING_PROGRESS_PARENT_SUMMARY_FIELDS.map((field) => (
              <div key={field} className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm font-semibold leading-6 text-emerald-950">
                {field}
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-600">
            Enrolled-family dashboards and existing progress records remain operational systems. Brick 7 defines
            the educational observation language; it does not silently rewrite historical progress data or
            manufacture a new percentage from old records.
          </p>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 md:py-16 lg:px-8" aria-labelledby="guardrails-heading">
        <div className="mx-auto max-w-6xl rounded-[32px] border border-amber-200 bg-amber-50/70 p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-800">Framework guardrails</p>
          <h2 id="guardrails-heading" className="mt-2 text-3xl font-black tracking-[-0.02em] text-slate-950">
            What this framework does not claim
          </h2>
          <ul className="mt-6 grid gap-3 md:grid-cols-2">
            {SPEAKING_PROGRESS_FRAMEWORK_GUARDRAILS.map((item) => (
              <li key={item} className="rounded-2xl border border-amber-200 bg-white/70 px-4 py-3 text-sm leading-6 text-slate-700">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white px-4 py-12 sm:px-6 md:py-16 lg:px-8" aria-labelledby="framework-faq-heading">
        <div className="mx-auto max-w-6xl">
          <h2 id="framework-faq-heading" className="text-3xl font-black tracking-[-0.02em] text-slate-950">
            Frequently asked questions
          </h2>
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {faqItems.map((item) => (
              <article key={item.question} className="rounded-3xl border border-slate-200 bg-[#fcfcfb] p-5">
                <h3 className="font-black text-slate-950">{item.question}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-700">{item.answer}</p>
              </article>
            ))}
          </div>

          <div className="mt-10 rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
            <h2 className="text-2xl font-black">Use the framework to choose the next useful step</h2>
            <p className="mt-3 max-w-3xl leading-7 text-slate-300">
              Start with what the child can demonstrate now, identify the current bottleneck, teach one target,
              and compare fresh evidence later. If you need help identifying the starting point, use the free
              Tiny Steps assessment.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link to="/book-demo" className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-950">
                Book the free assessment
              </Link>
              <Link to="/speaking" className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold text-white">
                View Speaking classes
              </Link>
            </div>
          </div>

          <p className="mt-8 text-xs leading-5 text-slate-500">
            {SPEAKING_PROGRESS_FRAMEWORK_NAME} is a Tiny Steps educational teaching and observation framework.
            It is not a clinical, medical, developmental or standardised language assessment.
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Published by {PUBLIC_FACTS.organizationName}.
          </p>
        </div>
      </section>
    </main>
  );
}
