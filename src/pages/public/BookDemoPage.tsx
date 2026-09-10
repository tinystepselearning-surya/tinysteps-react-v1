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
import { PUBLIC_SITE_FACTS } from '../../config/publicFacts';

const bookDemoSeo = getRouteConfig('/book-demo');
const bookDemoTitle =
  bookDemoSeo?.title ?? `Free ${FREE_DEMO_DURATION_MINUTES}-Minute 1:1 English Assessment | Tiny Steps`;
const bookDemoDescription =
  bookDemoSeo?.description ??
  `Book one free ${FREE_DEMO_DURATION_MINUTES}-minute live 1:1 online English assessment for your child. Identify the right phonics, reading, grammar, writing or speaking path before enrolment.`;
const bookDemoCanonicalPath = bookDemoSeo?.canonicalPath ?? '/book-demo';
const bookDemoCanonicalUrl = `${SITE_ORIGIN}${bookDemoCanonicalPath}`;

const assessmentKeywords = [
  'free English assessment for kids online',
  'free online English assessment for kids',
  'free English demo class for kids',
  'free online English demo class',
  'free 1 to 1 English demo class',
  'English level assessment for kids',
  'online English assessment for child',
  'free English trial class for kids',
  'book English demo class for kids',
  'free phonics assessment online',
  'free reading assessment for kids',
  'free grammar assessment for kids',
  'free speaking assessment for kids',
];

const assessmentSteps = [
  {
    number: '01',
    title: 'Understand the current stage',
    description: 'We begin with your child’s age, current English level and the main concern you are seeing.',
  },
  {
    number: '02',
    title: 'Check the relevant skills',
    description:
      'The teacher focuses on the skills connected to that concern—for example phonics, reading, grammar, writing, spoken English or communication.',
  },
  {
    number: '03',
    title: 'Identify the starting point',
    description: 'We identify which skills appear secure and which area should receive attention first.',
  },
  {
    number: '04',
    title: 'Recommend the next step',
    description: 'Parents receive a recommended Tiny Steps programme and starting point based on what was observed.',
  },
];

const assessmentOutcomes = [
  {
    title: 'Current level',
    description: 'A clearer view of the child’s present skill level in the area assessed.',
  },
  {
    title: 'Priority skill',
    description: 'Which learning need should receive attention first.',
  },
  {
    title: 'Recommended starting path',
    description: 'The most appropriate Tiny Steps programme and starting point.',
  },
  {
    title: 'Next steps',
    description: 'What parents can review next if they choose to continue.',
  },
];

const decisionChecks = [
  {
    title: 'Programme',
    description: 'Which learning path is being recommended?',
  },
  {
    title: 'Starting point',
    description: 'Where should your child begin?',
  },
  {
    title: 'Class format',
    description: 'Is the suitable option live 1:1 or an available small group?',
  },
  {
    title: 'Pricing',
    description: 'What does the recommended format currently cost?',
  },
];

const programmeRoutes = [
  {
    name: 'Phonics',
    href: '/phonics',
    fit: 'Letter sounds, blending, decoding, spelling patterns and early reading foundations.',
  },
  {
    name: 'Reading',
    href: '/reading-classes-for-kids',
    fit: 'Broader reading accuracy, connected reading, vocabulary, comprehension and reading confidence.',
  },
  {
    name: 'Grammar',
    href: '/grammar',
    fit: 'Sentence structure, parts of speech, tenses, punctuation and grammar accuracy.',
  },
  {
    name: 'Writing',
    href: '/writing-classes-for-kids',
    fit: 'Idea development, paragraphs, stories, school writing, editing and independent written expression.',
  },
  {
    name: 'Spoken English',
    href: '/spoken-english-classes-for-kids-online',
    fit: 'Everyday conversation, fuller responses, vocabulary in use and conversational fluency.',
  },
  {
    name: 'Public Speaking & Communication',
    href: '/speaking',
    fit: 'Structured answers, storytelling, presentations, show-and-tell and general communication skills.',
  },
  {
    name: 'Confidence Building',
    href: '/confidence-building-program-kids',
    fit: 'Specialist support when speaking comfort, participation confidence or dependence on prompting is the main barrier.',
  },
];

const assessmentFaqItems = [
  {
    question: 'Is the Tiny Steps demo assessment free?',
    answer:
      `Yes. Tiny Steps offers one free ${FREE_DEMO_DURATION_MINUTES}-minute live 1:1 online demo assessment per child before enrolment.`,
  },
  {
    question: 'How long is the assessment?',
    answer: `The live 1:1 assessment is ${FREE_DEMO_DURATION_MINUTES} minutes.`,
  },
  {
    question: 'Do I need to know which programme my child needs before booking?',
    answer:
      'No. The form asks for the main concern you are seeing. The assessment is designed to help identify the most appropriate Tiny Steps programme and starting point.',
  },
  {
    question: 'What can my child be assessed on?',
    answer:
      'The session is targeted to the child’s main concern and current level. Depending on the need, the teacher may check phonics, reading, grammar, writing, spoken English, public speaking or communication confidence rather than trying to test every skill in one session.',
  },
  {
    question: 'Will I receive a programme recommendation?',
    answer:
      'Yes. Based on what is observed during the session, Tiny Steps recommends an appropriate programme and starting point. Parents can then review the curriculum, class format and pricing before deciding.',
  },
  {
    question: 'Is the free demo a multi-class free trial?',
    answer:
      `No. The current Tiny Steps free offer is one ${FREE_DEMO_DURATION_MINUTES}-minute live 1:1 demo assessment session per child. It is an assessment and programme-fit session, not a multi-class free course.`,
  },
  {
    question: 'Can families outside India book the free assessment?',
    answer:
      'Yes. Tiny Steps serves families in India and worldwide. International and NRI families can request an assessment, subject to compatible teacher timings.',
  },
  {
    question: 'Do I need to enrol after the assessment?',
    answer:
      'No. Parents can review the recommendation, programme, class format, available timings and current pricing before deciding whether to enrol.',
  },
  {
    question: 'How will I receive available slots?',
    answer:
      'After submitting the form, the Tiny Steps team will contact you on WhatsApp to discuss the child’s requirement and arrange a suitable assessment slot.',
  },
];

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
    { '@type': 'ListItem', position: 2, name: 'Free Demo Assessment', item: bookDemoCanonicalUrl },
  ],
};

const webpageSchema = {
  ...createWebPageSchema({
    name: FREE_DEMO_OFFER_NAME,
    description: bookDemoDescription,
    url: bookDemoCanonicalUrl,
  }),
  '@id': `${bookDemoCanonicalUrl}#webpage`,
  about: [
    { '@type': 'Thing', name: 'Free online English assessment for kids' },
    { '@type': 'Thing', name: 'English level assessment for children' },
    { '@type': 'Thing', name: 'Online English demo class for kids' },
  ],
};

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
  serviceType: 'Free live 1:1 online English demo assessment for children',
  duration: `PT${FREE_DEMO_DURATION_MINUTES}M`,
  areaServed: ['India', 'Worldwide'],
  audience: {
    '@type': 'EducationalAudience',
    educationalRole: 'student',
    audienceType: PUBLIC_SITE_FACTS.audience.label,
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'INR',
    url: bookDemoCanonicalUrl,
    availability: 'https://schema.org/InStock',
  },
};

const decisionChecklistSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  '@id': `${bookDemoCanonicalUrl}#decision-checklist`,
  name: 'What parents should confirm before enrolling after a Tiny Steps assessment',
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
      keywords: assessmentKeywords,
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
    <div className="min-h-screen overflow-x-clip bg-[#fbfaf8] text-slate-900">
      <section className="relative overflow-hidden border-b border-slate-200/70 bg-[radial-gradient(circle_at_8%_16%,rgba(251,146,60,0.16),transparent_28%),radial-gradient(circle_at_92%_12%,rgba(125,211,252,0.18),transparent_30%),linear-gradient(180deg,#fffdfa_0%,#f8fbff_100%)]">
        <div className="pointer-events-none absolute left-1/2 top-[-14rem] h-[30rem] w-[52rem] -translate-x-1/2 rounded-full border border-orange-100/70" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-16 sm:px-6 md:pt-20 lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)] lg:items-center lg:gap-16 lg:px-8 lg:pb-20 lg:pt-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/85 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-700 shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              Free live 1:1 assessment
            </div>

            <h1 className="mt-6 font-heading text-4xl font-black leading-[1.03] tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-[4rem]">
              Book a Free {FREE_DEMO_DURATION_MINUTES}-Minute 1:1 English Assessment
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700 sm:text-xl">
              Tell us the main concern you are seeing. The live assessment helps identify your child&apos;s current starting point and the most suitable Tiny Steps learning path.
            </p>

            <div className="mt-7 grid max-w-2xl gap-3 sm:grid-cols-3">
              {[
                `${FREE_DEMO_DURATION_MINUTES}-minute live 1:1 assessment`,
                'One free session per child',
                `${PUBLIC_SITE_FACTS.audience.label} · India & worldwide`,
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5 text-sm font-semibold leading-6 text-slate-700">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-black text-orange-700">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#assessment-form"
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-7 py-3.5 text-base font-bold text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                {FREE_DEMO_CTA_LABEL}
              </a>
              <Link
                to="/class-samples"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white/90 px-7 py-3.5 text-base font-bold text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-white"
              >
                Watch Class Samples
                <span className="ml-2" aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <div id="assessment-form" className="scroll-mt-28 lg:py-2">
            <PublicAssessmentForm
              source={assessmentSource}
              title="Book Your Free Assessment"
              description="Share your child’s main concern. Our team will contact you on WhatsApp and arrange a suitable assessment slot."
              submitLabel={FREE_DEMO_CTA_LABEL}
              submitAriaLabel={FREE_DEMO_CTA_LABEL}
              appearance="embedded"
              helperText="One free live 1:1 assessment per child • No enrolment commitment"
              secondaryHelperText={null}
              onSuccess={blogDemoContext ? () => trackBlogDemoSubmit(blogDemoContext) : undefined}
            />
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-700">The assessment flow</p>
            <h2 className="mt-3 font-heading text-3xl font-black tracking-[-0.03em] text-slate-950 md:text-4xl">
              What Happens in the Demo Assessment?
            </h2>
            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              A focused {FREE_DEMO_DURATION_MINUTES}-minute session designed to understand the child&apos;s main learning need and what should come next.
            </p>
          </div>

          <div className="mt-10 grid overflow-hidden rounded-[28px] border border-slate-200 bg-[#fcfcfb] md:grid-cols-2 lg:grid-cols-4">
            {assessmentSteps.map((step, index) => (
              <article
                key={step.number}
                className={`relative p-6 sm:p-7 ${index > 0 ? 'border-t border-slate-200 md:border-t-0 md:border-l' : ''} ${index === 2 ? 'md:border-l-0 md:border-t lg:border-l lg:border-t-0' : ''} ${index === 3 ? 'md:border-t lg:border-t-0' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black tracking-[0.16em] text-orange-600">{step.number}</span>
                  <span className="h-px w-10 bg-orange-200" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-lg font-black leading-6 text-slate-950">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[36px] border border-orange-100 bg-[linear-gradient(120deg,#fff7ed_0%,#fffdfa_48%,#eef7ff_100%)] shadow-[0_28px_80px_rgba(15,23,42,0.07)]">
            <div className="grid gap-10 px-6 py-10 sm:px-10 sm:py-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-center lg:px-14 lg:py-14">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-700">A useful fit check</p>
                <h2 className="mt-3 font-heading text-3xl font-black tracking-[-0.03em] text-slate-950 md:text-4xl">
                  Who Is This Assessment For?
                </h2>
                <p className="mt-4 max-w-md leading-7 text-slate-600">
                  Especially useful when you can see the difficulty but are not yet sure which programme or starting point fits best.
                </p>
              </div>

              <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                {[
                  'Your child knows letters or sounds but struggles to blend and read unfamiliar words.',
                  'Your child reads but is slow, guesses words, or has difficulty understanding connected text.',
                  'Your child makes recurring grammar or sentence-structure errors while speaking or writing.',
                  'Your child needs help developing ideas, paragraphs, stories or school writing.',
                  'Your child gives short or hesitant responses in everyday English conversation.',
                  'Your child needs public-speaking, communication or confidence support—or you are simply not sure where to start.',
                ].map((item, index) => (
                  <div key={item} className={`flex gap-3 border-b border-slate-200/70 pb-4 text-slate-700 ${index >= 4 ? 'sm:border-b-0' : ''}`}>
                    <span aria-hidden="true" className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-orange-600 shadow-sm">✓</span>
                    <span className="text-sm leading-7 sm:text-base">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20" aria-labelledby="programme-routes-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-700">Assessment-led routing</p>
            <h2 id="programme-routes-heading" className="mt-3 font-heading text-3xl font-black tracking-[-0.03em] text-slate-950 md:text-4xl">
              What Can the Assessment Recommend?
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              You do not need to choose a programme before booking. The assessment helps identify the most relevant starting path; each programme page then explains the curriculum in depth.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {programmeRoutes.map((route) => (
              <article key={route.href} className="rounded-[26px] border border-slate-200 bg-[#fcfcfb] p-6">
                <h3 className="text-lg font-black text-slate-950">{route.name}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{route.fit}</p>
                <Link to={route.href} className="mt-5 inline-flex text-sm font-bold text-orange-700 underline decoration-orange-200 underline-offset-4">
                  Explore {route.name}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">Assessment outcomes</p>
              <h2 className="mt-3 font-heading text-3xl font-black tracking-[-0.03em] text-white md:text-4xl">
                What Will You Understand After the Assessment?
              </h2>
              <p className="mt-4 max-w-lg leading-7 text-slate-300">
                The goal is decision clarity: what appears secure, what needs attention first, and which route makes sense next.
              </p>
            </div>

            <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
              {assessmentOutcomes.map((item, index) => (
                <article key={item.title} className="border-l border-white/15 pl-5">
                  <span className="text-xs font-black tracking-[0.18em] text-orange-300">0{index + 1}</span>
                  <h3 className="mt-2 text-xl font-black text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="my-12 h-px bg-white/10" />

          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16" aria-labelledby="decision-heading">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Decision support</p>
              <h2 id="decision-heading" className="mt-3 font-heading text-3xl font-black tracking-[-0.03em] text-white">
                Before You Enrol
              </h2>
              <p className="mt-3 max-w-md leading-7 text-slate-300">
                You should feel clear about these four points before choosing a paid programme or package.
              </p>
            </div>

            <div>
              <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
                {decisionChecks.map((item) => (
                  <article key={item.title}>
                    <h3 className="text-base font-black text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
                  </article>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/curriculum" className="rounded-full border border-white/15 bg-white/[0.06] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10">
                  View Curriculum
                </Link>
                <Link to="/class-samples" className="rounded-full border border-orange-300/40 bg-orange-300/10 px-5 py-2.5 text-sm font-bold text-orange-100 transition hover:bg-orange-300/15">
                  Watch Class Samples
                </Link>
                <Link to="/pricing" className="rounded-full border border-white/15 bg-white/[0.06] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10">
                  View Pricing
                </Link>
              </div>
            </div>
          </div>

          <p className="mt-10 text-xs leading-5 text-slate-500">
            Assessment recommendations are based on what is observed during the session. A single assessment does not measure every English skill, and individual learning progress varies.
          </p>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20" aria-labelledby="demo-faq-heading">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-700">Common questions</p>
              <h2 id="demo-faq-heading" className="mt-3 font-heading text-3xl font-black tracking-[-0.03em] text-slate-950 md:text-4xl">
                Free Demo Assessment FAQs
              </h2>
              <p className="mt-4 max-w-md leading-7 text-slate-600">
                What parents need to know before requesting a slot.
              </p>
            </div>

            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {assessmentFaqItems.map((item) => (
                <details key={item.question} className="group py-1">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 text-left">
                    <span className="text-base font-black text-slate-950 sm:text-lg">{item.question}</span>
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-xl font-light text-slate-500 transition group-open:rotate-45" aria-hidden="true">+</span>
                  </summary>
                  <p className="max-w-2xl pb-5 pr-12 leading-7 text-slate-600">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[34px] border border-orange-200 bg-[linear-gradient(115deg,#fff1e6_0%,#fff9f3_45%,#edf7ff_100%)] px-6 py-10 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:px-10 md:flex md:items-center md:justify-between md:gap-10 lg:px-12">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-700">Ready when you are</p>
            <h2 className="mt-2 font-heading text-3xl font-black tracking-[-0.03em] text-slate-950 md:text-4xl">
              Ready to Understand Your Child’s Starting Point?
            </h2>
            <p className="mt-3 max-w-2xl leading-7 text-slate-700">
              Book one free {FREE_DEMO_DURATION_MINUTES}-minute live 1:1 assessment and receive a recommended learning path based on the skills observed during the session.
            </p>
          </div>
          <div className="mt-7 shrink-0 md:mt-0 md:text-right">
            <a
              href="#assessment-form"
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-7 py-3.5 text-base font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              {FREE_DEMO_CTA_LABEL}
            </a>
            <p className="mt-3 text-xs text-slate-500">One free live 1:1 assessment per child • No enrolment commitment</p>
          </div>
        </div>
      </section>
    </div>
  );
}
