import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../lib/seo';

const SUMMER_CAMP_ENROLLMENT_PRICE = 2400;
const SUMMER_CAMP_DISCOUNT_PERCENT = 70;
const SUMMER_CAMP_FULL_PRICE = Number(
  (SUMMER_CAMP_ENROLLMENT_PRICE / (1 - SUMMER_CAMP_DISCOUNT_PERCENT / 100)).toFixed(2)
);
const SUMMER_CAMP_FAST_TRACK_TEXT = "Hi, I'm looking for a summer camp program, fast track pack.";

function getWhatsAppUrl(message: string) {
  return `https://wa.me/919618398383?text=${encodeURIComponent(message)}`;
}

function getProgramEnrollText(programTitle: string) {
  return `Hi, I'm looking to enroll for Summer Camp ${programTitle}.`;
}

function getBatchEnrollText(batchLabel: string) {
  return `Hi, I'm looking to enroll for Summer Camp ${batchLabel} batch.`;
}

const SUMMER_CAMP_WHATSAPP_URL = getWhatsAppUrl(SUMMER_CAMP_FAST_TRACK_TEXT);

function formatINR(value: number) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

const PROGRAMS = [
  {
    id: 'phonics-fast-track',
    title: 'Phonics Fast Track',
    ages: 'Ages 4–8',
    duration: '10 weeks',
    subjects: ['Phonics'],
    focus: 'Fast-track course to refresh letter sounds, blending, and reading confidence',
    outcomes: [
      'Refresh core sounds + common blends',
      'Read short words and phrases with better accuracy',
      'Build a daily 10-minute phonics routine',
    ],
  },
  {
    id: 'grammar-fast-track',
    title: 'Grammar Fast Track',
    ages: 'Ages 6–12',
    duration: '10 weeks',
    subjects: ['Grammar'],
    focus: 'Fast-track course to strengthen sentence structure, punctuation, and writing clarity',
    outcomes: [
      'Fix common grammar mistakes in daily writing',
      'Use tense, punctuation, and sentence order correctly',
      'Write cleaner paragraphs with stronger flow',
    ],
  },
  {
    id: 'speaking-fast-track',
    title: 'Speaking Fast Track',
    ages: 'Ages 6–12',
    duration: '10 weeks',
    subjects: ['Speaking'],
    focus: 'Fast-track course for confident speaking, presentation flow, and better pronunciation',
    outcomes: [
      'Speak confidently in short structured talks',
      'Use intro-body-close format naturally',
      'Improve clarity, pace, and voice control',
    ],
  },
];

const BATCHES = [
  {
    id: 'phonics-fast-track/batch-apr-2026-morning-ist',
    label: 'Phonics Fast Track',
    dates: 'Apr 1–Jun 15, 2026',
    duration: '10 weeks',
    mode: 'Online',
    capacity: 'Small group',
  },
  {
    id: 'grammar-fast-track/batch-apr-2026-evening-ist',
    label: 'Grammar Fast Track',
    dates: 'Apr 1–Jun 15, 2026',
    duration: '10 weeks',
    mode: 'Online',
    capacity: 'Small group',
  },
  {
    id: 'speaking-fast-track/batch-apr-2026-evening-ist',
    label: 'Speaking Fast Track',
    dates: 'Apr 1–Jun 15, 2026',
    duration: '10 weeks',
    mode: 'Online',
    capacity: 'Small group',
  },
];
const STRETCH_CARDS = [
  {
    id: 'group',
    title: 'Group-First Design',
    desc: 'Small live batches that keep kids active and engaged.',
    cta: 'See group plan',
    href: '/curriculum',
  },
  {
    id: 'curriculum',
    title: 'Same Core Curriculum',
    desc: 'Phonics, grammar, and speaking as a focused summer brush-up.',
    cta: 'View curriculum',
    href: '/curriculum',
  },
  {
    id: 'results',
    title: 'Planned 10-Week Learning Path',
    desc: 'Clear detailed learning path planned for 10 weeks with strong outcomes.',
    cta: 'See learning path',
    href: '/summer-camps#programs',
  },
  {
    id: 'price',
    title: 'Simple Enrollment',
    desc: `Fast Track Pack: ₹${formatINR(SUMMER_CAMP_ENROLLMENT_PRICE)} (70% off from ₹${formatINR(SUMMER_CAMP_FULL_PRICE)}).`,
    cta: 'Enroll now',
    href: '/summer-camps#programs',
  },
];

const FAQS = [
  {
    question: 'What is included in the ₹2,400 Fast Track Pack fee?',
    answer:
      `The summer camp enrollment is ₹${formatINR(SUMMER_CAMP_ENROLLMENT_PRICE)} per child, currently ${SUMMER_CAMP_DISCOUNT_PERCENT}% off from ₹${formatINR(SUMMER_CAMP_FULL_PRICE)}. This includes entry into the 10-week group camp, 50–60 minute live online classes, phonics + grammar + speaking brush-up, effective worksheets, and class recordings.`,
  },
  {
    question: 'Is this summer camp group-only or 1:1?',
    answer:
      'This page is for group-only summer camp enrollment. It is designed as a small-batch, motivation-first format for summer continuity and revision.',
  },
  {
    question: 'What is this summer camp?',
    answer:
      'Tiny Steps Summer Camp is a 10-week online group brush-up program (April 1–June 15, 2026) for phonics, grammar, and public speaking. It follows our regular curriculum in a lighter summer format to keep learning active.',
  },
  {
    question: 'Who is it for?',
    answer:
      'These camps are for ages 4–12, grouped by ability level after a quick assessment. Choose from Phonics Fast Track, Grammar Fast Track, or Speaking Fast Track based on your child’s immediate need.',
  },
  {
    question: 'How are batches formed for Indian and global parents?',
    answer:
      'We group by age + current level after a quick assessment. Since classes are fully online, families from India and outside India can join; we help shortlist suitable timings before enrollment.',
  },
  {
    question: 'What is the batch size and class duration?',
    answer:
      'Each batch is kept intentionally small so every child gets active participation and direct teacher feedback. Session duration is typically 50–60 minutes live online.',
  },
  {
    question: 'Will my child get personal attention in a group class?',
    answer:
      'Yes. Small-group design allows live correction, speaking turns, and targeted mentor feedback in every class.',
  },
  {
    question: 'What outcomes should parents expect by the end of camp?',
    answer:
      'Children complete a focused brush-up in their selected track: stronger reading/phonics accuracy, cleaner grammar usage and writing structure, or better speaking confidence and clarity.',
  },
  {
    question: 'My child is shy or weak in basics. Can they still join?',
    answer:
      'Yes. The program is built for mixed confidence levels. We place children by level and use step-by-step teaching so shy learners can participate without pressure and build momentum gradually.',
  },
  {
    question: 'What happens if we miss a class due to travel or vacation?',
    answer:
      'We share recap notes and practice tasks after each class. If a child misses a session, mentors send a short catch-up plan so they can rejoin smoothly without losing continuity.',
  },
  {
    question: 'How do parents track progress during the camp?',
    answer:
      'Since this is a group camp, we follow a clear detailed 10-week learning path with outcome goals instead of individual weekly dashboards for every child. Mentors guide families on how to use worksheets and recordings for steady progress.',
  },
  {
    question: 'Do you provide home practice or assignments?',
    answer:
      'Yes. Children get effective worksheets aligned to class goals, and class recordings are shared for revision and continuity.',
  },
  {
    question: 'How quickly can we enroll and confirm a seat?',
    answer:
      'Enrollment is quick. Click Enroll or WhatsApp on this page and send your request; our team will share the next suitable batch options and help reserve your child’s seat.',
  },
  {
    question: 'Can we choose a specific focus track?',
    answer:
      'Yes. Parents can choose Phonics Fast Track, Grammar Fast Track, or Speaking Fast Track based on immediate need. All tracks follow Tiny Steps core curriculum with track-specific emphasis.',
  },
  {
    question: 'What do we need at home to attend classes?',
    answer:
      'A stable internet connection, a phone/tablet/laptop with audio, and a quiet learning corner are enough for smooth participation.',
  },
  {
    question: 'Is there an assessment before final placement?',
    answer:
      'Yes. We do a quick baseline check before final grouping to ensure the child joins the right level and gets maximum benefit from the summer batch.',
  },
];

const SUMMER_CAMP_SEO_KEYWORDS = [
  'online summer camp for kids india',
  'summer camp for kids online india',
  'online summer camp for kids',
  'phonics classes for kids online india',
  'grammar classes for kids online',
  'public speaking classes for kids online india',
  'summer camp fees for kids',
  'summer camp fees india',
  'small batch online classes for kids',
  'class recordings for kids online classes',
  'worksheets for kids summer camp',
  'book free trial class for kids',
  'english summer camp for kids india',
  'summer fast track course for kids',
];

const INDIA_PARENT_SEARCH_INTENTS = [
  {
    query: 'Online summer camp for kids in India',
    answer:
      'Live online batches for ages 4-12 with a clear 10-week learning path, 50–60 minute classes, effective worksheets, and class recordings.',
    cta: 'View group batches',
    href: '/summer-camps#batches',
  },
  {
    query: 'Phonics classes for kids online',
    answer:
      'Phonics Fast Track refreshes letter sounds, blending, and reading routines so children restart school with stronger reading confidence.',
    cta: 'See phonics fast track',
    href: '/summer-camps/phonics-fast-track',
  },
  {
    query: 'Grammar classes for kids online',
    answer:
      'Grammar Fast Track focuses on sentence structure, punctuation, tense, and writing clarity with live guided correction.',
    cta: 'See grammar fast track',
    href: '/summer-camps/grammar-fast-track',
  },
  {
    query: 'Public speaking classes for kids online',
    answer:
      'Speaking Fast Track builds confidence, clarity, and structured expression through speaking drills and short presentations.',
    cta: 'See speaking fast track',
    href: '/summer-camps/speaking-fast-track',
  },
  {
    query: 'Summer camp fees for kids',
    answer:
      `Fast Track Pack enrollment is ₹${formatINR(SUMMER_CAMP_ENROLLMENT_PRICE)} per child, currently ${SUMMER_CAMP_DISCOUNT_PERCENT}% off from ₹${formatINR(SUMMER_CAMP_FULL_PRICE)}.`,
    cta: 'Check fee and enroll',
    href: '/summer-camps#enrollment',
  },
  {
    query: 'Online summer camp near me',
    answer:
      'The camp runs fully online, so families across India can join without commute while still getting live teacher-led small-group classes.',
    cta: 'Chat on WhatsApp',
    href: '/summer-camps#whatsapp-enroll',
  },
];

const INDIA_CITY_COVERAGE = [
  'Hyderabad',
  'Bengaluru',
  'Chennai',
  'Mumbai',
  'Delhi NCR',
  'Pune',
  'Kolkata',
  'Ahmedabad',
];

const PARENT_ENROLLMENT_CHECKLIST = [
  {
    title: 'Small Group Learning',
    detail: 'Small-group classes so each child gets speaking time and direct teacher feedback.',
  },
  {
    title: 'Clear Weekly Schedule',
    detail: '50–60 minute live sessions with new batches starting weekly for easier start dates.',
  },
  {
    title: 'Practical Curriculum',
    detail: 'Phonics, grammar, and speaking fast-track tracks aligned to the regular Tiny Steps curriculum.',
  },
  {
    title: '10-Week Learning Path',
    detail: 'Clear detailed learning path planned for 10 weeks with best-result outcomes.',
  },
  {
    title: 'Missed Class Support',
    detail: 'Effective worksheets and class recordings support continuity if any class is missed.',
  },
  {
    title: 'Fast Admission Support',
    detail: 'One-click WhatsApp enrollment with a prefilled summer fast-track enquiry message.',
  },
];

function StretchCardsRow() {
  const [activeId, setActiveId] = useState<string>(STRETCH_CARDS[0].id);

  return (
    <div className="flex flex-col gap-3 sm:gap-4 md:flex-row">
      {STRETCH_CARDS.map((card) => {
        const isActive = activeId === card.id;
        return (
          <Link
            key={card.id}
            to={card.href}
            onMouseEnter={() => setActiveId(card.id)}
            onFocus={() => setActiveId(card.id)}
            onClick={(event) => {
              if (typeof window !== 'undefined') {
                const prefersTap = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
                if (prefersTap && !isActive) {
                  event.preventDefault();
                  setActiveId(card.id);
                }
              }
            }}
            className={`relative overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition-colors motion-reduce:transition-none sm:p-5 lg:p-6 md:transition-all md:duration-300 ${isActive ? 'md:flex-[2_1_0%]' : 'md:flex-[1_1_0%] opacity-90 hover:opacity-100'}`}
          >
            <div className="flex h-full flex-col gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{card.desc}</p>
              </div>
              <div className="mt-auto text-sm font-semibold text-emerald-700">
                {card.cta} →
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function SummerCampsPage() {
  useEffect(() => {
    const pageDescription =
      'Online summer camp for kids in India with 10-week phonics, grammar, and speaking fast-track group courses. Fast Track Pack enrollment at ₹2,400 (70% off) with 50–60 minute live classes, effective worksheets, and class recordings.';

    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': 'https://tinystepslearning.com/summer-camps#faq',
      mainEntity: FAQS.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    };

    const courseListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': 'https://tinystepslearning.com/summer-camps#courses',
      name: 'Tiny Steps Summer Camp Fast Track Courses',
      itemListElement: PROGRAMS.map((program, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Course',
          '@id': `https://tinystepslearning.com/summer-camps/${program.id}`,
          name: program.title,
          description: program.focus,
          inLanguage: 'en-IN',
          courseMode: 'Online',
          educationalLevel: program.ages,
          teaches: program.subjects,
          offers: {
            '@type': 'Offer',
            priceCurrency: 'INR',
            price: SUMMER_CAMP_ENROLLMENT_PRICE,
            availability: 'https://schema.org/InStock',
            eligibleRegion: 'IN',
            url: `https://tinystepslearning.com/summer-camps/${program.id}`,
          },
          provider: {
            '@type': 'Organization',
            name: 'Tiny Steps Learning',
            url: 'https://tinystepslearning.com',
          },
        },
      })),
    };

    const webPageSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': 'https://tinystepslearning.com/summer-camps#webpage',
      url: 'https://tinystepslearning.com/summer-camps',
      name: 'Online Summer Camp for Kids in India | Tiny Steps Learning',
      description: pageDescription,
      inLanguage: 'en-IN',
      audience: {
        '@type': 'PeopleAudience',
        suggestedMinAge: 4,
        suggestedMaxAge: 12,
      },
      about: [
        { '@type': 'Thing', name: 'Online summer camp for kids in India' },
        { '@type': 'Thing', name: 'Phonics classes for kids online' },
        { '@type': 'Thing', name: 'Grammar classes for kids online' },
        { '@type': 'Thing', name: 'Public speaking classes for kids online' },
      ],
    };

    const serviceSchema = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      '@id': 'https://tinystepslearning.com/summer-camps#service',
      name: 'Tiny Steps Summer Camp Fast Track Pack',
      serviceType: 'Online summer camp for kids',
      areaServed: {
        '@type': 'Country',
        name: 'India',
      },
      provider: {
        '@type': 'EducationalOrganization',
        name: 'Tiny Steps Learning',
        url: 'https://tinystepslearning.com',
      },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'INR',
        price: SUMMER_CAMP_ENROLLMENT_PRICE,
        category: 'Summer Camp Fast Track Pack',
        availability: 'https://schema.org/InStock',
        eligibleRegion: 'IN',
        url: 'https://tinystepslearning.com/summer-camps',
      },
      availableChannel: {
        '@type': 'ServiceChannel',
        serviceUrl: 'https://tinystepslearning.com/summer-camps',
        availableLanguage: ['en-IN', 'en'],
      },
    };

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://tinystepslearning.com/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Summer Camps',
          item: 'https://tinystepslearning.com/summer-camps',
        },
      ],
    };

    applySeo({
      title: 'Online Summer Camp for Kids in India | Phonics, Grammar & Speaking Fast Track',
      description: pageDescription,
      keywords: SUMMER_CAMP_SEO_KEYWORDS,
      canonicalPath: '/summer-camps',
      robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
      ogType: 'website',
      jsonLd: [breadcrumbSchema, webPageSchema, serviceSchema, courseListSchema, faqSchema],
    });
  }, []);

  return (
    <>
      <div className="bg-white pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <section className="relative overflow-hidden bg-gradient-to-br from-[#fff4da] via-[#fffdf5] to-[#def6ff]">
          <div className="pointer-events-none absolute -left-24 top-8 hidden h-72 w-72 rounded-full bg-[#ffb13d]/30 blur-3xl sm:block" />
          <div className="pointer-events-none absolute right-0 top-0 hidden h-80 w-80 rounded-full bg-[#00b5d8]/20 blur-3xl sm:block" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 hidden h-64 w-64 rounded-full bg-[#00b894]/20 blur-3xl sm:block" />
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
            <div className="grid items-end gap-6 sm:gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <nav aria-label="Breadcrumb" className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <ol className="flex flex-wrap items-center gap-2">
                    <li>
                      <Link to="/" className="hover:text-emerald-700">Home</Link>
                    </li>
                    <li aria-hidden="true">/</li>
                    <li className="text-emerald-700">Summer Camps</li>
                  </ol>
                </nav>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
                  Summer Fast Track 2026
                </p>
                <h1 className="mt-3 text-3xl font-black leading-tight text-slate-900 sm:text-4xl md:text-5xl">
                  India&apos;s Premium Online Summer Camp for Kids
                </h1>
                <p className="mt-4 max-w-3xl text-base text-slate-700 sm:text-lg">
                  Online group classes for ages 4–12 across India. Choose Phonics, Grammar, or
                  Speaking Fast Track courses designed to sharpen core skills before school
                  reopens.
                </p>
                <p className="mt-3 text-sm text-slate-600">
                  Camp window: April 1–June 15, 2026 • 10 weeks • New batches start weekly.
                </p>
                <div className="mt-5 flex flex-wrap gap-3 text-sm">
                  <span className="rounded-full bg-white px-4 py-1 text-slate-700 shadow-sm">Ages 4–5</span>
                  <span className="rounded-full bg-white px-4 py-1 text-slate-700 shadow-sm">Ages 6–7</span>
                  <span className="rounded-full bg-white px-4 py-1 text-slate-700 shadow-sm">Ages 8–10</span>
                  <span className="rounded-full bg-white px-4 py-1 text-slate-700 shadow-sm">Ages 10–12</span>
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  Age ranges are guidelines; final grouping is based on level after a quick assessment.
                </p>
              </div>
              <div
                id="enrollment"
                className="scroll-mt-24 rounded-3xl border border-emerald-200 bg-white/95 p-5 shadow-lg backdrop-blur-sm sm:p-6 sm:shadow-xl"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
                  Summer Camp Enrollment
                </p>
                <p className="mt-2 text-4xl font-black text-slate-900 sm:text-5xl">₹{formatINR(SUMMER_CAMP_ENROLLMENT_PRICE)}</p>
                <p className="mt-1 text-xs font-semibold text-emerald-700">
                  <span className="text-slate-500 line-through">₹{formatINR(SUMMER_CAMP_FULL_PRICE)}</span>{' '}
                  <span>{SUMMER_CAMP_DISCOUNT_PERCENT}% OFF</span>
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Fast Track Pack fee per child for the summer group camp.
                </p>
                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <p>Live online group batches across India</p>
                  <p>50–60 minute live classes</p>
                  <p>Phonics + grammar + speaking brush-up</p>
                  <p>Effective worksheets + class recordings</p>
                </div>
                <div id="whatsapp-enroll" className="mt-5 flex scroll-mt-24 flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <a
                    href={SUMMER_CAMP_WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[46px] items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm"
                  >
                    Enroll for ₹{formatINR(SUMMER_CAMP_ENROLLMENT_PRICE)}
                  </a>
                  <a
                    href={SUMMER_CAMP_WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700"
                  >
                    WhatsApp us
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={SUMMER_CAMP_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[46px] w-full items-center justify-center rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm sm:w-auto"
              >
                Reserve My Camp Seat
              </a>
              <a
                href={SUMMER_CAMP_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[46px] w-full items-center justify-center rounded-full border border-emerald-600 px-5 py-2.5 text-sm font-semibold text-emerald-700 sm:w-auto"
              >
                Chat on WhatsApp
              </a>
              <Link
                to="/contact"
                className="inline-flex min-h-[46px] w-full items-center justify-center rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 sm:w-auto"
              >
                Ask for batch timing
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-10">
          <div className="rounded-2xl border border-emerald-100 bg-white p-4 text-sm leading-relaxed text-gray-700">
            Quick jumps:{' '}
            <Link to="/summer-camps#programs" className="font-semibold text-emerald-700 hover:text-emerald-800">
              Choose a program
            </Link>{' '}
            •{' '}
            <Link to="/summer-camps#india-parent-searches" className="font-semibold text-emerald-700 hover:text-emerald-800">
              Parent enrollment guide
            </Link>{' '}
            •{' '}
            <Link to="/summer-camps#batches" className="font-semibold text-emerald-700 hover:text-emerald-800">
              View group batches
            </Link>{' '}
            •{' '}
            <Link to="/summer-camps#faqs" className="font-semibold text-emerald-700 hover:text-emerald-800">
              Read FAQs
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6 sm:pb-12 sm:pt-10">
          <div className="mb-6 flex flex-col gap-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">Quick Highlights</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Why families choose these camps</h2>
            <p className="text-sm text-gray-600">
              Tap a card to expand on mobile, or hover on desktop.
            </p>
          </div>
          <StretchCardsRow />
        </section>

        <section id="india-parent-searches" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-10 sm:px-6 sm:pb-12">
          <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-[#fff7e6] via-white to-[#e7f7ff] p-5 shadow-sm sm:p-6 md:p-8">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
                Parent Enrollment Guide
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">
                Key questions parents ask before they enroll
              </h2>
              <p className="mt-3 text-sm text-gray-700">
                Quick answers on class format, fees, learning outcomes, and age-appropriate
                tracks to help families decide faster.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {INDIA_PARENT_SEARCH_INTENTS.map((intent) => (
                <div key={intent.query} className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm sm:p-5">
                  <h3 className="text-base font-semibold text-gray-900">{intent.query}</h3>
                  <p className="mt-2 text-sm text-gray-700">{intent.answer}</p>
                  <Link
                    to={intent.href}
                    className="mt-3 inline-flex min-h-[44px] items-center text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    {intent.cta} →
                  </Link>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-amber-100 pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-600">
                Cities We Commonly Serve Online
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {INDIA_CITY_COVERAGE.map((city) => (
                  <span key={city} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-slate-100">
                    {city}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 sm:pb-12">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
              Parent Enrollment Checklist
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
              What Indian parents compare before choosing a summer camp
            </h2>
            <p className="mt-3 text-sm text-slate-700">
              We built this program around the six decision points parents ask most before payment.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {PARENT_ENROLLMENT_CHECKLIST.map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-slate-700">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900">What is this camp?</h2>
              <p className="mt-2 text-sm text-gray-700">
                A 10‑week online summer brush-up camp following our core curriculum in phonics, grammar, and
                public speaking. It is intentionally group-first, with a clear detailed 10-week learning path,
                50–60 minute classes, effective worksheets, and class recordings.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900">What will my child achieve?</h2>
              <p className="mt-2 text-sm text-gray-700">
                Children finish with measurable progress across phonics, grammar, and speaking through a
                structured 10-week learning path and outcome-focused teaching.
              </p>
            </div>
          </div>
        </section>

        <section id="programs" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-10 sm:px-6 sm:pb-12">
          <h2 className="text-2xl font-semibold text-gray-900">Choose a program</h2>
          <p className="mt-2 text-sm text-gray-600">
            Pick the focus track that matches your child’s current level and goal. All tracks follow the full curriculum.
          </p>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {PROGRAMS.map((program) => (
              <div key={program.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <h3 className="text-lg font-semibold text-gray-900">{program.title}</h3>
                <p className="text-xs text-gray-500">{program.ages} • {program.duration}</p>
                <p className="mt-2 text-sm text-gray-700">{program.focus}</p>
                <ul className="mt-3 list-disc pl-5 text-sm text-gray-700">
                  {program.outcomes.map((outcome) => (
                    <li key={outcome}>{outcome}</li>
                  ))}
                </ul>
                <div className="mt-4">
                  <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <span className="mr-1 text-slate-500 line-through">₹{formatINR(SUMMER_CAMP_FULL_PRICE)}</span>
                    <span>
                      ₹{formatINR(SUMMER_CAMP_ENROLLMENT_PRICE)} ({SUMMER_CAMP_DISCOUNT_PERCENT}% OFF)
                    </span>
                  </span>
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  <a
                    href={getWhatsAppUrl(getProgramEnrollText(program.title))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Enroll now
                  </a>
                  <Link
                    to={`/summer-camps/${program.id}`}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    View program details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="batches" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-10 sm:px-6 sm:pb-12">
          <h2 className="text-2xl font-semibold text-gray-900">Upcoming group batches</h2>
          <p className="mt-2 text-sm text-gray-600">
            Choose a track and enroll instantly on WhatsApp.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {BATCHES.map((batch) => (
              <a
                key={batch.id}
                href={getWhatsAppUrl(getBatchEnrollText(batch.label))}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-emerald-200 sm:p-5"
              >
                <div className="text-sm font-semibold text-gray-900">{batch.label}</div>
                <div className="mt-2 text-xs text-gray-600">
                  {batch.dates} • {batch.duration} • {batch.mode} • {batch.capacity}
                </div>
                <div className="mt-3 text-sm font-semibold text-emerald-700">Enroll on WhatsApp →</div>
              </a>
            ))}
          </div>
        </section>

        <section id="faqs" className="mx-auto max-w-5xl scroll-mt-24 px-4 pb-10 sm:px-6 sm:pb-16">
          <h2 className="text-2xl font-semibold text-gray-900">FAQs</h2>
          <div className="mt-4 space-y-4">
            {FAQS.map((faq) => (
              <div key={faq.question} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-gray-900">{faq.question}</h3>
                <p className="mt-2 text-sm text-gray-700">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="fixed inset-x-0 bottom-0 z-40 md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="mx-auto max-w-6xl px-3 pb-2">
            <div className="flex items-center justify-between gap-2 rounded-[20px] border border-emerald-100/80 bg-white/95 p-2 shadow-[0_-6px_30px_rgba(15,23,42,0.22)] backdrop-blur-md">
              <a
                href={SUMMER_CAMP_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-full bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                Enroll ₹{formatINR(SUMMER_CAMP_ENROLLMENT_PRICE)}
              </a>
              <a
                href={SUMMER_CAMP_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-full border border-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-emerald-700"
              >
                Open WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
