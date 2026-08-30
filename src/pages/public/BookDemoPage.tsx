import { useEffect, useMemo, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { applySeo, getRouteConfig } from '../../lib/seo';
import {
  ORGANIZATION_ID,
  PUBLIC_FACTS,
  SITE_ORIGIN,
  createFAQPageSchema,
  createWebPageSchema,
} from '../../lib/schemas';
import {
  getBlogConversionAttribution,
  parseBlogLeadSourceDetail,
  resolveBlogLeadSourceDetail,
} from '../../lib/blogLeadAttribution';
import { trackBlogDemoStart, trackBlogDemoSubmit } from '../../lib/blogConversionTracking';
import type { BlogConversionFamily } from '../../content/blog/shared/conversionFamilies';
import PublicAssessmentForm from '../../components/forms/PublicAssessmentForm';
import {
  FREE_DEMO_CTA_LABEL,
  FREE_DEMO_DURATION_MINUTES,
  FREE_DEMO_FULL_DESCRIPTION,
  FREE_DEMO_OFFER_NAME,
} from '../../config/publicOffer';

const bookDemoSeo = getRouteConfig('/book-demo');
const bookDemoTitle =
  bookDemoSeo?.title ?? 'Book a Free 35-Minute Demo Assessment Class | Tiny Steps Learning';
const bookDemoDescription =
  bookDemoSeo?.description ??
  'Book one free 35-minute 1:1 online demo assessment class for your child. Understand their level in phonics, reading, grammar, sentence formation, pronunciation, and speaking confidence.';
const bookDemoCanonicalPath = bookDemoSeo?.canonicalPath ?? '/book-demo';
const bookDemoCanonicalUrl = `${SITE_ORIGIN}${bookDemoCanonicalPath}`;

const decisionChecks = [
  {
    title: 'Current skill gap',
    description: 'Understand what is already secure and which reading, language or speaking skill needs support first.',
  },
  {
    title: 'Teaching interaction fit',
    description: 'Notice how your child responds to live prompts, modelling, correction and guided practice.',
  },
  {
    title: 'Recommended learning path',
    description: 'Ask which Tiny Steps pathway and starting level are being recommended, and why.',
  },
  {
    title: 'Format and price clarity',
    description: 'Review the recommended class format, expected frequency and current pricing before deciding to enrol.',
  },
];

const assessmentFaqItems = [
  {
    question: 'Is the Tiny Steps demo assessment class free?',
    answer:
      `${FREE_DEMO_FULL_DESCRIPTION} It costs ₹0, requires no credit card, and there is no pressure to enrol.`,
  },
  {
    question: 'How long is the free demo assessment class?',
    answer:
      `The free demo assessment class is ${FREE_DEMO_DURATION_MINUTES} minutes.`,
  },
  {
    question: 'What will be checked in the demo assessment?',
    answer:
      'The teacher may check phonics, reading, grammar, sentence formation, pronunciation, and speaking confidence depending on the child’s age and current level.',
  },
  {
    question: 'Will parents get a course recommendation?',
    answer:
      'Yes. Parents receive a recommendation on whether the child should start with phonics, grammar, reading, public speaking, or a combined learning path, based on what is observed in the assessment.',
  },
  {
    question: 'Can I check class samples, parent feedback and pricing before I decide?',
    answer:
      'Yes. You can review Tiny Steps class samples, curated first-party parent feedback, the curriculum roadmap and current pricing before or after the demo. The assessment is another decision signal, not a requirement to enrol.',
  },
  {
    question: 'What should I ask after the demo assessment?',
    answer:
      'Ask what your child can do independently, which skill needs attention first, which program and starting level are recommended, what class format and frequency fit that need, and what the current fee will be.',
  },
  {
    question: 'Does the demo guarantee progress or a particular result?',
    answer:
      'No. The demo provides a snapshot of the child’s current level and a recommended next step. Progress depends on the child’s starting point, attendance, practice, response to teaching and time; no specific result is guaranteed.',
  },
  {
    question: 'Is there pressure to enrol after the demo?',
    answer:
      'No. The demo assessment is meant to give parents clarity. Families can decide after understanding the child’s needs, recommended learning path, class format and current pricing.',
  },
];

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
    { '@type': 'ListItem', position: 2, name: 'Book Demo', item: bookDemoCanonicalUrl },
  ],
};

const webpageSchema = createWebPageSchema({
  name: FREE_DEMO_OFFER_NAME,
  description: bookDemoDescription,
  url: bookDemoCanonicalUrl,
});

const assessmentServiceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': `${bookDemoCanonicalUrl}#assessment-service`,
  name: FREE_DEMO_OFFER_NAME,
  description: FREE_DEMO_FULL_DESCRIPTION,
  url: bookDemoCanonicalUrl,
  provider: {
    '@type': 'EducationalOrganization',
    '@id': ORGANIZATION_ID,
    name: PUBLIC_FACTS.organizationName,
  },
  serviceType: 'Online English demo assessment class for children',
  duration: `PT${FREE_DEMO_DURATION_MINUTES}M`,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'INR',
    url: bookDemoCanonicalUrl,
  },
};

const decisionChecklistSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  '@id': `${bookDemoCanonicalUrl}#decision-checklist`,
  name: 'What parents should confirm before enrolling after a Tiny Steps demo',
  itemListOrder: 'https://schema.org/ItemListOrderAscending',
  itemListElement: decisionChecks.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.title,
    description: item.description,
  })),
};

function programForBlogFamily(family: BlogConversionFamily) {
  if (family === 'phonics-diagnostic' || family === 'phonics-practice' || family === 'reading-fluency') {
    return 'phonics' as const;
  }
  if (family === 'grammar-diagnostic' || family === 'sentence-building') return 'grammar' as const;
  if (family === 'speaking-confidence') return 'speaking' as const;
  return 'general' as const;
}

export default function BookDemoPage() {
  const location = useLocation();
  const demoStartTrackedRef = useRef(false);
  const assessmentSource = useMemo(
    () => resolveBlogLeadSourceDetail(location.search) || 'book_demo_page',
    [location.search],
  );
  const blogDemoContext = useMemo(() => {
    const parsed = parseBlogLeadSourceDetail(assessmentSource);
    if (!parsed) return null;
    const stored = getBlogConversionAttribution();
    return {
      article_slug: parsed.articleSlug,
      conversion_family: parsed.family,
      intent_cluster: stored.lastIntentCluster || parsed.family,
      program: programForBlogFamily(parsed.family),
      cta_position: parsed.ctaPosition,
      destination_path: '/book-demo',
    };
  }, [assessmentSource]);

  useEffect(() => {
    applySeo({
      title: bookDemoTitle,
      description: bookDemoDescription,
      canonicalPath: bookDemoCanonicalPath,
      ogType: 'website',
      jsonLd: [
        webpageSchema,
        assessmentServiceSchema,
        decisionChecklistSchema,
        breadcrumbSchema,
        { ...createFAQPageSchema(assessmentFaqItems), '@id': `${bookDemoCanonicalUrl}#faq` },
      ],
    });
  }, []);

  useEffect(() => {
    if (!blogDemoContext) return;
    const assessmentForm = document.getElementById('assessment-form');
    if (!assessmentForm) return;

    const handleStart = () => {
      if (demoStartTrackedRef.current) return;
      demoStartTrackedRef.current = true;
      trackBlogDemoStart(blogDemoContext);
    };

    assessmentForm.addEventListener('focusin', handleStart);
    return () => assessmentForm.removeEventListener('focusin', handleStart);
  }, [blogDemoContext]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <section className="mx-auto max-w-5xl px-6 py-14 text-center md:py-16">
        <h1 className="font-heading text-4xl font-bold leading-tight md:text-5xl">
          Book One Free 35-Minute Demo Assessment Class
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-lg text-gray-700">
          One free 35-minute 1:1 online class to understand your child&apos;s
          current level in phonics, reading, grammar, sentence formation,
          pronunciation, and speaking confidence.
        </p>

        <ul className="mx-auto mt-6 grid max-w-3xl gap-3 text-left text-sm text-slate-700 sm:grid-cols-2">
          <li className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            One free session per child
          </li>
          <li className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            35-minute live 1:1 class
          </li>
          <li className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            Personalised course recommendation
          </li>
          <li className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            No credit card or enrolment pressure
          </li>
        </ul>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#assessment-form"
            className="inline-flex items-center rounded-2xl bg-gradient-to-r from-tiny-blue-600 to-tiny-purple-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:shadow-xl"
          >
            {FREE_DEMO_CTA_LABEL}
          </a>
          <Link
            to="/class-samples"
            className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            Watch Class Samples
          </Link>
        </div>

        <p className="mx-auto mt-5 max-w-3xl text-sm leading-6 text-slate-600">
          You do not need to decide during the demo. Use the session to understand your child&apos;s level, then compare the recommendation with the curriculum, class samples, parent feedback and current pricing.
        </p>

        <div id="assessment-form" className="mx-auto mt-12 max-w-2xl">
          <PublicAssessmentForm
            source={assessmentSource}
            autoFocusFirstField
            onSuccess={blogDemoContext ? () => trackBlogDemoSubmit(blogDemoContext) : undefined}
          />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12">
        <h2 className="mb-8 text-center text-3xl font-bold">What happens in the demo assessment?</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <span className="text-2xl font-bold text-blue-600">1</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold">Understand Current Stage</h3>
            <p className="text-gray-600">We understand your child&apos;s age and current English level.</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <span className="text-2xl font-bold text-purple-600">2</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold">Skill Check</h3>
            <p className="text-gray-600">
              We check reading, phonics, grammar, sentence formation, or speaking needs based on the child&apos;s stage.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <span className="text-2xl font-bold text-green-600">3</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold">Path Recommendation</h3>
            <p className="text-gray-600">
              We identify the right learning path: Phonics, Grammar, Reading, or Public Speaking.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <span className="text-2xl font-bold text-orange-600">4</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold">Clear Next Step</h3>
            <p className="text-gray-600">Parents receive a clear recommendation for the next step.</p>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-tiny-blue-50 to-tiny-purple-50 py-14">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-8 text-center text-3xl font-bold">Who should book this?</h2>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <ul className="space-y-3 text-gray-700">
              <li>• Your child knows letters but cannot read words confidently.</li>
              <li>• Your child reads slowly or guesses words.</li>
              <li>• Your child speaks in one-word answers or short broken sentences.</li>
              <li>• Your child knows grammar rules but makes mistakes while speaking or writing.</li>
              <li>• Your child is shy or lacks confidence while speaking.</li>
              <li>• You are unsure which Tiny Steps course is right.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12" aria-labelledby="decision-heading">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Decision support</p>
          <h2 id="decision-heading" className="mt-2 text-3xl font-bold text-slate-900">What to confirm before you enrol</h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-700">
            The demo is for clarity, not a rushed purchase. After the session, make sure you understand these four points before choosing a plan.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {decisionChecks.map((item, index) => (
              <article key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Check {index + 1}</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{item.description}</p>
              </article>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
            <Link to="/class-samples" className="text-slate-700 underline underline-offset-4">Watch class samples</Link>
            <Link to="/testimonials" className="text-slate-700 underline underline-offset-4">Read parent feedback</Link>
            <Link to="/curriculum" className="text-slate-700 underline underline-offset-4">Review curriculum</Link>
            <Link to="/pricing" className="text-slate-700 underline underline-offset-4">Check current pricing</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12">
        <h2 className="mb-8 text-center text-3xl font-bold">Assessment outcomes</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 font-medium text-slate-800">Current level clarity</div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 font-medium text-slate-800">Recommended starting path</div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 font-medium text-slate-800">First skill to prioritise</div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 font-medium text-slate-800">Parent-friendly next steps</div>
        </div>
        <p className="mt-5 text-center text-sm leading-6 text-slate-600">
          These outcomes describe the purpose of the assessment. They do not guarantee a particular learning result or progression speed.
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12" aria-labelledby="demo-faq-heading">
        <h2 id="demo-faq-heading" className="mb-8 text-center text-3xl font-bold">
          Free demo assessment FAQs
        </h2>
        <div className="space-y-4">
          {assessmentFaqItems.map((item) => (
            <article key={item.question} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">{item.question}</h3>
              <p className="mt-2 leading-7 text-slate-700">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2 className="mb-4 text-3xl font-bold">Ready to understand your child’s starting point?</h2>
        <p className="mx-auto mb-8 max-w-2xl text-gray-700">
          Book one free 35-minute demo assessment class. No credit card or enrolment commitment is required, and you can review the recommendation before deciding.
        </p>
        <a
          href="#assessment-form"
          className="inline-block rounded-2xl bg-gradient-to-r from-tiny-blue-600 to-tiny-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:shadow-xl"
        >
          {FREE_DEMO_CTA_LABEL}
        </a>
      </section>
    </div>
  );
}
