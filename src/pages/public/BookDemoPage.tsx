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
  bookDemoSeo?.title ?? 'Book a Free 35-Minute Demo Class | Tiny Steps Learning';
const bookDemoDescription =
  bookDemoSeo?.description ??
  'Book a free 35-minute 1:1 demo assessment for your child. Understand their current phonics, reading, grammar or spoken English level and recommended starting path.';
const bookDemoCanonicalPath = bookDemoSeo?.canonicalPath ?? '/book-demo';
const bookDemoCanonicalUrl = `${SITE_ORIGIN}${bookDemoCanonicalPath}`;

const assessmentSteps = [
  {
    number: '01',
    title: 'Understand the current stage',
    description: 'We begin with your child’s age, current English level and learning needs.',
  },
  {
    number: '02',
    title: 'Check key skills',
    description:
      'Depending on your child’s level, the teacher may assess phonics, reading, grammar, sentence formation, pronunciation or speaking.',
  },
  {
    number: '03',
    title: 'Identify the starting point',
    description: 'We identify which skills are secure and which areas need support first.',
  },
  {
    number: '04',
    title: 'Recommend the next step',
    description: 'Parents receive a recommended Tiny Steps program and starting level based on the assessment.',
  },
];

const assessmentOutcomes = [
  {
    title: 'Current level',
    description: 'Where your child currently stands.',
  },
  {
    title: 'Priority skill',
    description: 'Which skill should receive attention first.',
  },
  {
    title: 'Recommended starting path',
    description: 'The appropriate Tiny Steps program and level.',
  },
  {
    title: 'Next steps',
    description: 'What parents can do next if they choose to continue.',
  },
];

const decisionChecks = [
  {
    title: 'Program',
    description: 'Which learning path is being recommended?',
  },
  {
    title: 'Starting level',
    description: 'Where will your child begin?',
  },
  {
    title: 'Class format',
    description: 'Is the recommended option 1:1 or small group?',
  },
  {
    title: 'Pricing',
    description: 'What does the recommended plan currently cost?',
  },
];

const assessmentFaqItems = [
  {
    question: 'Is the Tiny Steps demo assessment free?',
    answer:
      'Yes. One free 35-minute 1:1 online assessment is available per child before enrolment.',
  },
  {
    question: 'How long is the assessment?',
    answer: `The assessment is approximately ${FREE_DEMO_DURATION_MINUTES} minutes.`,
  },
  {
    question: 'What will my child be assessed on?',
    answer:
      'This depends on your child’s age and current level. The teacher may check phonics, reading, grammar, sentence formation, pronunciation or speaking skills.',
  },
  {
    question: 'Will I receive a course recommendation?',
    answer:
      'Yes. Based on the session, Tiny Steps recommends an appropriate program and starting level.',
  },
  {
    question: 'Do I need to enrol after the assessment?',
    answer:
      'No. Parents can review the recommendation, curriculum, class format and pricing before deciding.',
  },
  {
    question: 'How will I receive available slots?',
    answer:
      'After submitting the form, our team will contact you on WhatsApp with available assessment timings.',
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
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffaf4_0%,#f8fbff_32%,#ffffff_100%)] text-slate-900">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-[-80px] top-10 h-72 w-72 rounded-full bg-orange-200/35 blur-3xl" />
        <div className="pointer-events-none absolute right-[-80px] top-20 h-72 w-72 rounded-full bg-sky-200/35 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-14 text-center sm:px-6 md:pb-14 md:pt-16 lg:px-8">
          <p className="mx-auto inline-flex rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-700">
            Free 1:1 assessment
          </p>
          <h1 className="mx-auto mt-5 max-w-4xl font-heading text-4xl font-black leading-[1.05] tracking-[-0.03em] text-slate-950 md:text-6xl">
            Book One Free 35-Minute Demo Assessment Class
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-700 md:text-xl">
            Understand your child&apos;s current level and find the right starting point for phonics, reading, grammar or spoken English.
          </p>

          <div className="mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-center gap-2.5 text-sm font-semibold text-slate-700">
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">35-minute live 1:1 assessment</span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">One free session per child</span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">No credit card required</span>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#assessment-form"
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-7 py-3.5 text-base font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              {FREE_DEMO_CTA_LABEL}
            </a>
            <Link
              to="/class-samples"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-7 py-3.5 text-base font-bold text-slate-900 transition hover:-translate-y-0.5 hover:bg-slate-50"
            >
              Watch Class Samples
            </Link>
          </div>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600">
            Want to see how Tiny Steps classes work first? View real class samples before booking.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-14 sm:px-6 lg:px-8">
        <div id="assessment-form" className="rounded-[32px] border border-slate-200 bg-white p-3 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="px-3 pb-3 pt-3 text-center sm:px-6">
            <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">Book Your Assessment</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Share a few details. Our team will confirm suitable slots on WhatsApp.
            </p>
          </div>
          <PublicAssessmentForm
            source={assessmentSource}
            autoFocusFirstField
            onSuccess={blogDemoContext ? () => trackBlogDemoSubmit(blogDemoContext) : undefined}
          />
          <p className="px-4 pb-3 pt-1 text-center text-xs font-medium text-slate-500 sm:text-sm">
            Takes less than a minute • No commitment • We&apos;ll contact you on WhatsApp with available assessment slots.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">The assessment flow</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.02em] text-slate-950 md:text-4xl">
            What Happens in the Demo Assessment?
          </h2>
        </div>
        <div className="mt-9 grid gap-5 md:grid-cols-2">
          {assessmentSteps.map((step) => (
            <article key={step.number} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
                  {step.number}
                </span>
                <div>
                  <h3 className="text-xl font-bold text-slate-950">{step.title}</h3>
                  <p className="mt-2 leading-7 text-slate-600">{step.description}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50/70 py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-black tracking-[-0.02em] text-slate-950 md:text-4xl">
            Who Is This Assessment For?
          </h2>
          <div className="mx-auto mt-8 max-w-4xl rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                'Your child knows letters but struggles to read words confidently.',
                'Your child reads slowly, guesses words or finds blending difficult.',
                'Your child understands grammar but struggles to use it correctly.',
                'Your child speaks mainly in short or incomplete sentences.',
                'Your child lacks confidence while speaking.',
                'You are unsure which Tiny Steps program or level is appropriate.',
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl bg-slate-50 px-4 py-4 text-slate-700">
                  <span aria-hidden="true" className="mt-0.5 font-black text-orange-500">✓</span>
                  <span className="leading-7">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Assessment outcomes</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.02em] text-slate-950 md:text-4xl">
            What Will You Understand After the Assessment?
          </h2>
        </div>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {assessmentOutcomes.map((item) => (
            <article key={item.title} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            </article>
          ))}
        </div>
        <p className="mx-auto mt-5 max-w-3xl text-center text-sm leading-6 text-slate-500">
          Assessment recommendations are based on what is observed during the session. Individual learning progress varies.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 lg:px-8" aria-labelledby="decision-heading">
        <div className="rounded-[32px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:p-8 md:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">Decision support</p>
          <h2 id="decision-heading" className="mt-3 text-3xl font-black tracking-[-0.02em] md:text-4xl">
            Before You Enrol
          </h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-300">
            You should feel clear about these four points before choosing a program.
          </p>
          <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {decisionChecks.map((item) => (
              <article key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
              </article>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/curriculum" className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/15">
              View Curriculum
            </Link>
            <Link to="/class-samples" className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/15">
              Watch Class Samples
            </Link>
            <Link to="/pricing" className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/15">
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8" aria-labelledby="demo-faq-heading">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Common questions</p>
          <h2 id="demo-faq-heading" className="mt-3 text-3xl font-black tracking-[-0.02em] text-slate-950 md:text-4xl">
            Demo Assessment FAQs
          </h2>
        </div>
        <div className="mt-9 grid gap-4 md:grid-cols-2">
          {assessmentFaqItems.map((item) => (
            <article key={item.question} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-950">{item.question}</h3>
              <p className="mt-2 leading-7 text-slate-600">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[34px] border border-orange-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_52%,#eff6ff_100%)] px-6 py-10 text-center shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:px-10 sm:py-12">
          <h2 className="text-3xl font-black tracking-[-0.02em] text-slate-950 md:text-4xl">
            Ready to Understand Your Child’s Starting Point?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-700">
            Book one free 35-minute assessment and receive a recommended learning path based on your child&apos;s current skills.
          </p>
          <a
            href="#assessment-form"
            className="mt-7 inline-flex items-center justify-center rounded-full bg-slate-950 px-7 py-3.5 text-base font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            Book Free Assessment
          </a>
          <p className="mt-3 text-sm text-slate-500">One free session per child • No credit card required</p>
        </div>
      </section>
    </div>
  );
}
