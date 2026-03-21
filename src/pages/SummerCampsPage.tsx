import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../lib/seo';

const SUMMER_CAMP_ENROLLMENT_PRICE = 2400;
const SUMMER_CAMP_FULL_PRICE = 5000;
const SUMMER_CAMP_BATCH_CAP = 8;
const SUMMER_CAMP_PLANNED_CLASS_COUNT = 24;
const SUMMER_CAMP_EFFECTIVE_PER_CLASS_PRICE = Math.round(
  SUMMER_CAMP_ENROLLMENT_PRICE / SUMMER_CAMP_PLANNED_CLASS_COUNT
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
    capacity: `Capped at ${SUMMER_CAMP_BATCH_CAP} students`,
  },
  {
    id: 'grammar-fast-track/batch-apr-2026-evening-ist',
    label: 'Grammar Fast Track',
    dates: 'Apr 1–Jun 15, 2026',
    duration: '10 weeks',
    mode: 'Online',
    capacity: `Capped at ${SUMMER_CAMP_BATCH_CAP} students`,
  },
  {
    id: 'speaking-fast-track/batch-apr-2026-evening-ist',
    label: 'Speaking Fast Track',
    dates: 'Apr 1–Jun 15, 2026',
    duration: '10 weeks',
    mode: 'Online',
    capacity: `Capped at ${SUMMER_CAMP_BATCH_CAP} students`,
  },
];
const STRETCH_CARDS = [
  {
    id: 'group',
    title: 'Limited Batch Size',
    desc: `Only ${SUMMER_CAMP_BATCH_CAP} students per batch for real attention and active participation.`,
    cta: 'See why it works',
    href: '/summer-camps#difference',
    surfaceClass: 'from-[#fff4df] via-[#fffaf2] to-[#ffe8c8]',
    borderClass: 'border-amber-200/80',
    ctaClass: 'text-amber-700',
    glowClass: 'bg-amber-300/30',
  },
  {
    id: 'curriculum',
    title: 'Premium Curriculum',
    desc: 'Same Tiny Steps learning framework in a focused summer format.',
    cta: 'View curriculum',
    href: '/curriculum',
    surfaceClass: 'from-[#e8f8ff] via-[#f4fcff] to-[#e9fff7]',
    borderClass: 'border-sky-200/80',
    ctaClass: 'text-sky-700',
    glowClass: 'bg-sky-300/30',
  },
  {
    id: 'results',
    title: 'Outcome-Focused Plan',
    desc: 'Clear 10-week learning path designed for measurable improvement.',
    cta: 'See learning path',
    href: '/summer-camps#programs',
    surfaceClass: 'from-[#efe9ff] via-[#f7f4ff] to-[#e8f2ff]',
    borderClass: 'border-violet-200/80',
    ctaClass: 'text-violet-700',
    glowClass: 'bg-violet-300/30',
  },
  {
    id: 'price',
    title: 'Simple Enrollment',
    desc: `Fast Track Pack list fee: ₹${formatINR(SUMMER_CAMP_FULL_PRICE)}. Effective price: ₹${formatINR(SUMMER_CAMP_ENROLLMENT_PRICE)}.`,
    cta: 'Enroll now',
    href: '/summer-camps#programs',
    surfaceClass: 'from-[#e9fff4] via-[#f6fffb] to-[#e7f7ff]',
    borderClass: 'border-emerald-200/80',
    ctaClass: 'text-emerald-700',
    glowClass: 'bg-emerald-300/30',
  },
];

const FAQS = [
  {
    question: `Why is Tiny Steps Summer Camp limited to ${SUMMER_CAMP_BATCH_CAP} students?`,
    answer:
      `Tiny Steps limits each batch to ${SUMMER_CAMP_BATCH_CAP} students so every child gets enough speaking time, reading turns, and teacher attention during class.`,
  },
  {
    question: 'How is Tiny Steps different from regular summer camps?',
    answer:
      `Many summer camps are designed for larger groups and broader reach. Tiny Steps takes a different approach with limited batch sizes, live teacher-led interaction, and a stronger focus on real learning outcomes.`,
  },
  {
    question: 'Is Tiny Steps Summer Camp only fun or also academic?',
    answer:
      'It is both. Children learn through engaging activities, and the program is also designed to improve phonics, grammar, reading, speaking, and confidence.',
  },
  {
    question: 'Will my child get personal attention in a group class?',
    answer:
      `Yes. Since each batch is capped at ${SUMMER_CAMP_BATCH_CAP} students, the teacher can observe participation, correct mistakes live, and guide each child more effectively than in larger groups.`,
  },
  {
    question: 'What does my child improve in this summer camp?',
    answer:
      'Depending on the selected track, children improve in reading fluency, phonics accuracy, grammar usage, sentence formation, speaking confidence, pronunciation, and classroom participation.',
  },
  {
    question: 'What is included in the ₹2,400 Fast Track Pack fee?',
    answer:
      `The summer camp list fee is ₹${formatINR(SUMMER_CAMP_FULL_PRICE)} per child. Effective price: ₹${formatINR(SUMMER_CAMP_ENROLLMENT_PRICE)} per child. This includes entry into the 10-week group camp, 50–60 minute live online classes, phonics + grammar + speaking brush-up, effective worksheets, and class recordings. At the planned ${SUMMER_CAMP_PLANNED_CLASS_COUNT}-session schedule, this works out to about ₹${formatINR(SUMMER_CAMP_EFFECTIVE_PER_CLASS_PRICE)} per class.`,
  },
  {
    question: 'What is the class duration and support material?',
    answer:
      'Each session is typically 50–60 minutes. Children also receive effective worksheets and class recordings to revise and continue learning at home.',
  },
  {
    question: 'How do parents track progress during this group camp?',
    answer:
      'Since this is a group camp, we follow a clear detailed 10-week learning path with outcome goals instead of individual weekly dashboards for every child.',
  },
  {
    question: 'Is this summer camp group-only or 1:1?',
    answer:
      `This page is for premium small-group summer camp enrollment only. It is intentionally capped at ${SUMMER_CAMP_BATCH_CAP} students per batch.`,
  },
  {
    question: 'Who is this camp best for?',
    answer:
      'These camps are for ages 4–12, grouped by level after a quick assessment. Families can choose Phonics Fast Track, Grammar Fast Track, or Speaking Fast Track based on immediate need.',
  },
  {
    question: 'What happens if we miss a class due to travel or vacation?',
    answer:
      'Class recordings and worksheets support revision, so children can catch up and continue smoothly after a missed session.',
  },
  {
    question: 'How quickly can we enroll and confirm a seat?',
    answer:
      'Enrollment is quick. Click Enroll or WhatsApp on this page and send your request; our team will share suitable batch options and help reserve your child’s seat.',
  },
  {
    question: 'Can we choose a specific focus track?',
    answer:
      'Yes. Parents can choose Phonics Fast Track, Grammar Fast Track, or Speaking Fast Track. All tracks follow Tiny Steps core curriculum with track-specific emphasis.',
  },
  {
    question: 'Is this summer camp suitable for beginners?',
    answer:
      'Yes. Beginners can join. We do a quick level check before placement and group children by readiness so they are not overwhelmed.',
  },
  {
    question: 'How are phonics, grammar, and speaking levels decided?',
    answer:
      'Level placement happens through a quick pre-enrollment check. We review your child’s current ability and assign the right fast-track level for better participation and outcomes.',
  },
  {
    question: 'Do you offer a trial class before enrollment?',
    answer:
      'We start with a quick level check and counselor guidance. If you want a preview of how classes run, message us on WhatsApp and we will share the current onboarding options.',
  },
  {
    question: 'What is the teacher-to-student ratio in this camp?',
    answer:
      `Each batch is limited to ${SUMMER_CAMP_BATCH_CAP} students, which keeps the teacher-to-student ratio focused and allows active speaking, reading turns, and in-class correction.`,
  },
  {
    question: 'Can parents outside India enroll in this summer camp?',
    answer:
      'Yes. Classes are online, so global families can join based on available batch windows and time-zone fit.',
  },
  {
    question: 'Is there a completion certificate or final summary?',
    answer:
      'Parents receive a clear summary of track completion and next-step recommendations at the end of the camp. Ask the team during enrollment for the latest certificate policy.',
  },
];

const SUMMER_CAMP_SEO_KEYWORDS = [
  'premium summer camp for kids',
  'best online summer camp for kids in india',
  'online summer camp for kids in india',
  'small-group online summer camp',
  'small group summer camp for kids',
  'phonics summer camp online',
  'grammar summer camp for kids',
  'public speaking summer camp for kids',
  'english summer program for children',
  'summer camp with limited batch size',
  'online english summer camp for children',
  'best summer camp for phonics and reading',
  'interactive summer camp for kids',
  'summer camp fees for kids',
  'summer camp fees india',
  'summer camp near me online',
  'class recordings for kids online classes',
  'worksheets for kids summer camp',
];

const INDIA_PARENT_SEARCH_INTENTS = [
  {
    query: 'Online summer camp for kids in India',
    answer:
      `If you want a serious summer program without crowd-style teaching, this is it. We keep each batch capped at ${SUMMER_CAMP_BATCH_CAP} students with a clear 10-week plan, 50–60 minute classes, worksheets, and recordings.`,
    cta: 'View group batches',
    href: '/summer-camps#batches',
    cardClass: 'from-[#e9f8ff] via-[#f5fcff] to-[#e8fff7] border-sky-200/70',
    buttonClass: 'from-sky-600 to-cyan-500 hover:from-sky-700 hover:to-cyan-600',
  },
  {
    query: 'Phonics classes for kids online',
    answer:
      'Phonics Fast Track refreshes sounds, blends, and reading confidence so your child returns to school with stronger fluency and fewer reading pauses.',
    cta: 'See phonics fast track',
    href: '/summer-camps/phonics-fast-track',
    cardClass: 'from-[#fff6e7] via-[#fffaf2] to-[#fff2de] border-amber-200/70',
    buttonClass: 'from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600',
  },
  {
    query: 'Grammar classes for kids online',
    answer:
      'Grammar Fast Track helps children clean up sentence structure, punctuation, and tense with live guidance and practical writing correction.',
    cta: 'See grammar fast track',
    href: '/summer-camps/grammar-fast-track',
    cardClass: 'from-[#efe9ff] via-[#f7f3ff] to-[#edefff] border-violet-200/70',
    buttonClass: 'from-violet-600 to-indigo-500 hover:from-violet-700 hover:to-indigo-600',
  },
  {
    query: 'Public speaking classes for kids online',
    answer:
      'Speaking Fast Track builds clarity, confidence, and structured speaking so children can respond, present, and communicate with ease.',
    cta: 'See speaking fast track',
    href: '/summer-camps/speaking-fast-track',
    cardClass: 'from-[#ffeef4] via-[#fff5f8] to-[#ffe8ef] border-rose-200/70',
    buttonClass: 'from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-600',
  },
  {
    query: 'Summer camp fees for kids',
    answer:
      `Fast Track Pack list fee is ₹${formatINR(SUMMER_CAMP_FULL_PRICE)} per child. Effective price: ₹${formatINR(SUMMER_CAMP_ENROLLMENT_PRICE)} per child. Planned ${SUMMER_CAMP_PLANNED_CLASS_COUNT} live sessions means about ₹${formatINR(SUMMER_CAMP_EFFECTIVE_PER_CLASS_PRICE)} per class.`,
    cta: 'Check fee and enroll',
    href: '/summer-camps#enrollment',
    cardClass: 'from-[#eefcf2] via-[#f7fff9] to-[#e8fbff] border-emerald-200/70',
    buttonClass: 'from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600',
  },
  {
    query: 'Online summer camp near me',
    answer:
      'Completely online. Families across India can join from home and still get live teacher-led sessions with real interaction and correction.',
    cta: 'Chat on WhatsApp',
    href: '/summer-camps#whatsapp-enroll',
    cardClass: 'from-[#edf3ff] via-[#f6f9ff] to-[#eaf0ff] border-indigo-200/70',
    buttonClass: 'from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600',
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
    title: `Only ${SUMMER_CAMP_BATCH_CAP} Students per Batch`,
    detail: 'No crowd learning. Every child gets active turns, teacher attention, and live correction.',
    cardClass: 'from-[#ebf7ff] via-white to-[#e8fff6] border-sky-200/70',
    badgeClass: 'bg-sky-100 text-sky-700',
  },
  {
    title: '50–60 Minute Live Classes',
    detail: 'Longer classes for deeper guided practice in reading, grammar, and speaking.',
    cardClass: 'from-[#fff7e7] via-white to-[#fff1df] border-amber-200/70',
    badgeClass: 'bg-amber-100 text-amber-700',
  },
  {
    title: 'Premium Curriculum',
    detail: 'Phonics, grammar, and speaking fast-track tracks aligned to the regular Tiny Steps curriculum.',
    cardClass: 'from-[#f1ecff] via-white to-[#ecefff] border-violet-200/70',
    badgeClass: 'bg-violet-100 text-violet-700',
  },
  {
    title: '10-Week Learning Path',
    detail: 'Clear detailed learning path planned for 10 weeks with strong outcomes.',
    cardClass: 'from-[#e8fff4] via-white to-[#e9fbff] border-emerald-200/70',
    badgeClass: 'bg-emerald-100 text-emerald-700',
  },
  {
    title: 'Worksheets + Class Recordings',
    detail: 'Effective worksheets and class recordings support continuity and home revision.',
    cardClass: 'from-[#ffeef5] via-white to-[#fff4f8] border-rose-200/70',
    badgeClass: 'bg-rose-100 text-rose-700',
  },
  {
    title: 'Fast Admission Support',
    detail: 'One-click WhatsApp enrollment with a prefilled summer fast-track enquiry message.',
    cardClass: 'from-[#edf2ff] via-white to-[#eff7ff] border-indigo-200/70',
    badgeClass: 'bg-indigo-100 text-indigo-700',
  },
];

const DIFFERENCE_ROWS = [
  {
    conventional: 'Often larger groups',
    premium: `Only ${SUMMER_CAMP_BATCH_CAP} students per batch`,
    rowClass: 'from-amber-50/60 to-orange-50/50',
  },
  {
    conventional: 'General delivery',
    premium: 'Focused skill-based teaching',
    rowClass: 'from-sky-50/60 to-cyan-50/50',
  },
  {
    conventional: 'Limited child participation',
    premium: 'Every child gets active turns',
    rowClass: 'from-violet-50/60 to-indigo-50/50',
  },
  {
    conventional: 'Less room for live correction',
    premium: 'Better teacher observation and feedback',
    rowClass: 'from-emerald-50/60 to-teal-50/50',
  },
  {
    conventional: 'Often broad activity-style engagement',
    premium: 'Structured learning in phonics, grammar, reading, and speaking',
    rowClass: 'from-rose-50/60 to-pink-50/50',
  },
  {
    conventional: 'Harder to notice progress gaps',
    premium: 'Easier to guide improvement in class',
    rowClass: 'from-indigo-50/60 to-blue-50/50',
  },
  {
    conventional: 'Can feel crowded',
    premium: 'Feels guided, warm, and interactive',
    rowClass: 'from-emerald-50/60 to-lime-50/50',
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
            className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-4 shadow-sm transition-all duration-300 motion-reduce:transition-none sm:p-5 lg:p-6 ${card.surfaceClass} ${card.borderClass} ${isActive ? 'md:flex-[2_1_0%] md:-translate-y-1 md:shadow-xl' : 'md:flex-[1_1_0%] opacity-95 hover:opacity-100 hover:-translate-y-1 hover:shadow-lg'}`}
          >
            <div className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl ${card.glowClass}`} />
            <div className="flex h-full flex-col gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
                <p className="mt-2 text-sm text-slate-700">{card.desc}</p>
              </div>
              <div className={`mt-auto text-sm font-semibold transition-transform duration-300 group-hover:translate-x-1 ${card.ctaClass}`}>
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
      `Premium online summer camp for kids in India with 10-week phonics, grammar, and speaking fast-track courses. Small-group batches capped at ${SUMMER_CAMP_BATCH_CAP} students with 50–60 minute live classes, effective worksheets, and class recordings.`;

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
          description: `${program.focus}. Premium small-group summer camp capped at ${SUMMER_CAMP_BATCH_CAP} students.`,
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
      name: 'Premium Online Summer Camp for Kids in India | Tiny Steps Learning',
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
      description: `Premium small-group summer camp capped at ${SUMMER_CAMP_BATCH_CAP} students with a clear 10-week learning path.`,
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
      title: 'Premium Online Summer Camp for Kids in India | Tiny Steps Learning',
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
        <section className="relative isolate overflow-hidden bg-[radial-gradient(120%_120%_at_0%_0%,#ffd8a2_0%,rgba(255,216,162,0)_46%),radial-gradient(95%_95%_at_100%_0%,#a8ecff_0%,rgba(168,236,255,0)_50%),radial-gradient(90%_90%_at_50%_100%,#b8f4df_0%,rgba(184,244,223,0)_52%),linear-gradient(135deg,#fff8ed_0%,#f8fcff_46%,#eefdf6_100%)]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.3)_0%,rgba(255,255,255,0)_55%)]" />
          <div className="pointer-events-none absolute -left-20 top-4 h-72 w-72 rounded-full bg-[#ffad45]/25 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-[#2dc7ff]/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[#14c48f]/20 blur-3xl" />
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
                  Premium Online Summer Camp for Kids
                </h1>
                <p className="mt-4 max-w-3xl text-base text-slate-700 sm:text-lg">
                  Unlike large-volume summer camps, Tiny Steps is intentionally capped at {SUMMER_CAMP_BATCH_CAP} students per batch.
                  Children get more chances to speak, read, respond, and improve with live teacher attention.
                </p>
                <p className="mt-3 text-sm text-slate-600">
                  Camp window: April 1–June 15, 2026 • 10 weeks • New batches start weekly.
                </p>
                <div className="mt-5 flex flex-wrap gap-3 text-sm">
                  <span className="rounded-full bg-white px-4 py-1 text-slate-700 shadow-sm">Ages 4–5</span>
                  <span className="rounded-full bg-white px-4 py-1 text-slate-700 shadow-sm">Ages 6–7</span>
                  <span className="rounded-full bg-white px-4 py-1 text-slate-700 shadow-sm">Ages 8–10</span>
                  <span className="rounded-full bg-white px-4 py-1 text-slate-700 shadow-sm">Ages 10–12</span>
                  <span className="rounded-full bg-emerald-100 px-4 py-1 font-semibold text-emerald-800">
                    Capped at {SUMMER_CAMP_BATCH_CAP} students per batch
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  Age ranges are guidelines; final grouping is based on level after a quick assessment.
                </p>
              </div>
              <div
                id="enrollment"
                className="scroll-mt-24 rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-white/95 via-white to-emerald-50/70 p-5 shadow-[0_14px_40px_rgba(16,185,129,0.12)] backdrop-blur-sm sm:p-6 sm:shadow-[0_18px_55px_rgba(16,185,129,0.16)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
                  Summer Camp Enrollment
                </p>
                <p className="mt-2 text-4xl font-black text-slate-900 sm:text-5xl">₹{formatINR(SUMMER_CAMP_ENROLLMENT_PRICE)}</p>
                <p className="mt-1 text-xs font-semibold text-emerald-700">
                  <span className="text-slate-500 line-through">₹{formatINR(SUMMER_CAMP_FULL_PRICE)}</span>{' '}
                  <span>Effective price: ₹{formatINR(SUMMER_CAMP_ENROLLMENT_PRICE)}</span>
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Fast Track Pack fee per child for the summer group camp.
                </p>
                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <p>Capped at {SUMMER_CAMP_BATCH_CAP} students per batch</p>
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
                    className="inline-flex min-h-[46px] items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-emerald-700 hover:to-teal-600 hover:shadow-lg"
                  >
                    Enroll for ₹{formatINR(SUMMER_CAMP_ENROLLMENT_PRICE)}
                  </a>
                  <a
                    href={SUMMER_CAMP_WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-emerald-500 bg-white/90 px-4 py-2 text-sm font-semibold text-emerald-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-600 hover:bg-emerald-50"
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
                className="inline-flex min-h-[46px] w-full items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-emerald-700 hover:to-teal-600 hover:shadow-lg sm:w-auto"
              >
                Reserve My Camp Seat
              </a>
              <a
                href={SUMMER_CAMP_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[46px] w-full items-center justify-center rounded-full border border-emerald-500 bg-white/90 px-5 py-2.5 text-sm font-semibold text-emerald-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-600 hover:bg-emerald-50 sm:w-auto"
              >
                Chat on WhatsApp
              </a>
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
            <Link to="/summer-camps#fee-breakdown" className="font-semibold text-emerald-700 hover:text-emerald-800">
              Fee breakdown
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

        <section id="difference" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-10 sm:px-6 sm:pb-12">
          <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-[#f9fcff] to-[#eefbf4] p-5 shadow-sm sm:p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
              Why Tiny Steps Is Different
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
              Premium outcomes, small group, real attention
            </h2>
            <p className="mt-3 text-sm text-slate-700">
              Many camps optimize for volume. Tiny Steps is designed for visible progress with tighter batches, live correction, and real participation in every class.
            </p>

            <div className="mt-6 hidden md:block">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-sm">
                <table className="min-w-full text-sm">
                  <thead className="bg-gradient-to-r from-slate-100 via-white to-emerald-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Conventional Summer Camps</th>
                      <th className="px-4 py-3 text-left font-semibold text-emerald-800">Tiny Steps Premium Summer Camp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DIFFERENCE_ROWS.map((row) => (
                      <tr
                        key={row.conventional}
                        className={`bg-gradient-to-r ${row.rowClass} transition-all duration-300 hover:scale-[1.01] hover:shadow-inner`}
                      >
                        <td className="border-t border-white/70 px-4 py-3.5 text-slate-700">{row.conventional}</td>
                        <td className="border-t border-white/70 px-4 py-3.5 font-medium text-slate-900">{row.premium}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:hidden">
              {DIFFERENCE_ROWS.map((row) => (
                <div
                  key={row.conventional}
                  className={`rounded-2xl border border-slate-200 bg-gradient-to-br ${row.rowClass} p-4 shadow-sm transition-transform duration-300 active:scale-[0.99]`}
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">Conventional</div>
                  <p className="mt-1 text-sm text-slate-700">{row.conventional}</p>
                  <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-700">Tiny Steps</div>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{row.premium}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-[#e8fff6] via-white to-[#eaf8ff] p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-emerald-800">What your child gets</h3>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                  <li>More speaking and reading turns in every class</li>
                  <li>More teacher attention and direct correction</li>
                  <li>More confidence in a focused, safe group</li>
                  <li>More skill growth, not passive listening</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-violet-200/70 bg-gradient-to-br from-[#f1ebff] via-white to-[#e8f0ff] p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">Positioning line</h3>
                <p className="mt-2 text-sm font-medium text-slate-800">
                  In every capped batch of {SUMMER_CAMP_BATCH_CAP}, your child is seen, coached, corrected, and improved.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="india-parent-searches" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-10 sm:px-6 sm:pb-12">
          <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-[#fff8eb] via-[#ffffff] to-[#ebf8ff] p-5 shadow-sm sm:p-6 md:p-8">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
                Parent Enrollment Guide
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">
                Questions parents usually ask us before enrolling
              </h2>
              <p className="mt-3 text-sm text-gray-700">
                These are the real questions families ask on calls and WhatsApp. We answered them clearly so you can decide faster, without guesswork.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {INDIA_PARENT_SEARCH_INTENTS.map((intent) => (
                <div
                  key={intent.query}
                  className={`group rounded-2xl border bg-gradient-to-br p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-5 ${intent.cardClass}`}
                >
                  <h3 className="text-base font-semibold text-gray-900">{intent.query}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{intent.answer}</p>
                  <Link
                    to={intent.href}
                    className={`mt-4 inline-flex min-h-[42px] w-full items-center justify-center rounded-full bg-gradient-to-r px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-300 group-hover:shadow-md sm:w-auto ${intent.buttonClass}`}
                  >
                    {intent.cta}
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
                  <span key={city} className="rounded-full border border-slate-200/80 bg-gradient-to-r from-white to-slate-50 px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm">
                    {city}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 sm:pb-12">
          <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-[#f8fbff] via-white to-[#f3fff9] p-5 shadow-sm sm:p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
              Parent Enrollment Checklist
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
              What Indian parents compare before choosing a summer camp
            </h2>
            <p className="mt-3 text-sm text-slate-700">
              This is the practical checklist most parents ask us to clarify before they pay.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {PARENT_ENROLLMENT_CHECKLIST.map((item, idx) => (
                <div
                  key={item.title}
                  className={`rounded-2xl border bg-gradient-to-br p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${item.cardClass}`}
                >
                  <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold ${item.badgeClass}`}>
                    {idx + 1}
                  </span>
                  <h3 className="mt-2 text-sm font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="fee-breakdown" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-10 sm:px-6 sm:pb-12">
          <div className="rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-[#ebfff7] via-white to-[#edf8ff] p-5 shadow-sm sm:p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
              Transparent Pricing
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
              Clear fee breakdown for the summer fast-track pack
            </h2>
            <p className="mt-3 text-sm text-slate-700">
              No confusing package math. We show the list fee and the effective fee clearly so parents can decide quickly.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">List fee</p>
                <p className="mt-2 text-2xl font-black text-slate-900 line-through">₹{formatINR(SUMMER_CAMP_FULL_PRICE)}</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Effective price</p>
                <p className="mt-2 text-2xl font-black text-emerald-800">₹{formatINR(SUMMER_CAMP_ENROLLMENT_PRICE)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Planned sessions</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{SUMMER_CAMP_PLANNED_CLASS_COUNT}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Effective per class</p>
                <p className="mt-2 text-2xl font-black text-slate-900">₹{formatINR(SUMMER_CAMP_EFFECTIVE_PER_CLASS_PRICE)}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-600">
              Session count may vary slightly by holidays and batch calendar.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 sm:pb-12">
          <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-[#fff9ef] via-white to-[#eef8ff] p-5 shadow-sm sm:p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
              Parent Decision Guide
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
              How to choose the best online summer camp for kids in India
            </h2>
            <p className="mt-3 text-sm text-slate-700">
              Before you enroll in any small-group online summer camp, compare class size, teaching quality, and outcome clarity.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">Check interaction, not just marketing</h3>
                <p className="mt-2 text-sm text-slate-700">
                  Ask how much real speaking and reading time each child gets during a live class.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">Check the learning path</h3>
                <p className="mt-2 text-sm text-slate-700">
                  Prefer camps with a structured week-by-week skill plan instead of random activities.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">Check revision support</h3>
                <p className="mt-2 text-sm text-slate-700">
                  Worksheets and recordings help children revise after class and maintain continuity.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/best-online-phonics-classes-india"
                className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
              >
                Compare online phonics options
              </Link>
              <Link
                to="/blog"
                className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Read parent guides
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900">What is this camp?</h2>
              <p className="mt-2 text-sm text-gray-700">
                Tiny Steps Summer Camp is a premium small-group online program, capped at {SUMMER_CAMP_BATCH_CAP} students per batch. It follows our core curriculum in phonics, grammar, reading, and speaking with a clear detailed 10-week learning path.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900">What will my child achieve?</h2>
              <p className="mt-2 text-sm text-gray-700">
                Children finish with stronger reading fluency, better grammar accuracy, and higher speaking confidence through active participation, guided correction, and outcome-focused teaching.
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
                <p className="text-xs text-gray-500">{program.ages} • {program.duration} • Capped at {SUMMER_CAMP_BATCH_CAP}</p>
                <p className="mt-1 text-xs text-gray-500">50–60 min live classes • Worksheets + recordings</p>
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
                      Effective price: ₹{formatINR(SUMMER_CAMP_ENROLLMENT_PRICE)}
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
