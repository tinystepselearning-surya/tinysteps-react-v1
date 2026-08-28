import { useEffect, useMemo, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema } from '../../lib/schemas';
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
      'Yes. Parents receive a clear recommendation on whether the child should start with phonics, grammar, reading, public speaking, or a combined learning path.',
  },
  {
    question: 'Is there pressure to enrol after the demo?',
    answer:
      'No. The demo assessment is meant to give parents clarity. Families can decide after understanding the child’s needs and recommended learning path.',
  },
];

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
      title: 'Book a Free 35-Minute Demo Assessment Class | Tiny Steps Learning',
      description:
        'Book one free 35-minute 1:1 online demo assessment class for your child. Understand their level in phonics, reading, grammar, sentence formation, pronunciation, and speaking confidence.',
      canonicalPath: '/book-demo',
      ogType: 'website',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: FREE_DEMO_OFFER_NAME,
          description: FREE_DEMO_FULL_DESCRIPTION,
          provider: {
            '@type': 'EducationalOrganization',
            name: 'Tiny Steps Learning',
          },
          serviceType: 'Online English demo assessment class for children',
          duration: 'PT35M',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'INR',
          },
        },
        createFAQPageSchema(assessmentFaqItems),
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
            to="/courses"
            className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            Explore Courses
          </Link>
        </div>

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

      <section className="mx-auto max-w-4xl px-6 py-12">
        <h2 className="mb-8 text-center text-3xl font-bold">Assessment outcomes</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 font-medium text-slate-800">Current level clarity</div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 font-medium text-slate-800">Right course recommendation</div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 font-medium text-slate-800">Suggested learning path</div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 font-medium text-slate-800">Parent-friendly next steps</div>
        </div>
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
        <h2 className="mb-4 text-3xl font-bold">Ready to Get Started?</h2>
        <p className="mx-auto mb-8 max-w-2xl text-gray-700">
          Book one free 35-minute demo assessment class. No credit card or
          enrolment commitment is required.
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
