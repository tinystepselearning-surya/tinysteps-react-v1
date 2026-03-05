import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../lib/seo';

const PROGRAMS = [
  {
    id: 'reading-jumpstart',
    title: 'Reading Jumpstart',
    ages: 'Ages 4–7',
    duration: '10 weeks',
    focus: 'Full curriculum with extra focus on foundational reading fluency + decoding',
    outcomes: [
      'Blend CVC words confidently',
      'Read simple sentences with accuracy',
      'Build daily reading stamina',
    ],
  },
  {
    id: 'phonics-foundations',
    title: 'Phonics Foundations',
    ages: 'Ages 4–8',
    duration: '10 weeks',
    focus: 'Full curriculum with extra focus on SATPIN sounds + blending routines',
    outcomes: [
      'Master core sounds',
      'Blend faster with fewer prompts',
      'Improve accuracy on tricky words',
    ],
  },
  {
    id: 'confident-speaking',
    title: 'Confident Speaking',
    ages: 'Ages 6–12',
    duration: '10 weeks',
    focus: 'Full curriculum with extra focus on clear speech + expressive communication',
    outcomes: [
      'Speak with confidence in 60–90 seconds',
      'Use structure: intro, body, close',
      'Better pronunciation and clarity',
    ],
  },
];

const BATCHES = [
  {
    id: 'reading-jumpstart/batch-may-2026-morning-ist',
    label: 'Reading Jumpstart • Morning IST',
    dates: 'Apr 1–Jun 15, 2026',
    time: '9:00–9:40 AM IST',
    mode: 'Online',
    capacity: 'Max 6 kids',
  },
  {
    id: 'reading-jumpstart/batch-may-2026-evening-ist',
    label: 'Reading Jumpstart • Evening IST',
    dates: 'Apr 1–Jun 15, 2026',
    time: '6:00–6:40 PM IST',
    mode: 'Online',
    capacity: 'Max 6 kids',
  },
  {
    id: 'phonics-foundations/batch-may-2026-morning-ist',
    label: 'Phonics Foundations • Morning IST',
    dates: 'Apr 1–Jun 15, 2026',
    time: '10:00–10:40 AM IST',
    mode: 'Online',
    capacity: 'Max 6 kids',
  },
];
const STRETCH_CARDS = [
  {
    id: 'curriculum',
    title: 'Structured Curriculum',
    desc: 'Stage-wise phonics path + clear outcomes.',
    cta: 'See curriculum',
    href: '/curriculum',
  },
  {
    id: 'live',
    title: 'Live Interactive Classes',
    desc: '35–40 min sessions with trained teachers.',
    cta: 'How classes work',
    href: '/how-it-works',
  },
  {
    id: 'progress',
    title: 'Parent Progress Updates',
    desc: 'Weekly insights + next steps for practice.',
    cta: 'View dashboard',
    href: '/parent-dashboard-preview',
  },
  {
    id: 'camp',
    title: 'Summer Camp Highlights',
    desc: 'Daily speaking prompts + reading + fun activities.',
    cta: 'View camp plan',
    href: '/summer-english-camp-2026',
  },
];

const FAQS = [
  {
    question: 'What is this summer camp?',
    answer:
      'Tiny Steps Summer Camps are 10-week online programs (April 1–June 15, 2026) following our core curriculum in phonics, grammar, and public speaking. Group classes are the default, with a premium 1:1 option for faster personalization.',
  },
  {
    question: 'Who is it for?',
    answer:
      'These camps are for ages 4–12, grouped by ability level after a quick assessment. If your child is just starting to read, the Reading Jumpstart or Phonics Foundations tracks work best. If your child reads but needs clarity or confidence, the Confident Speaking camp is ideal.',
  },
  {
    question: 'How are group classes different from 1:1?',
    answer:
      'Group classes (1:4–1:6) focus on motivation and peer learning at a lower fee per child, while premium 1:1 is faster and fully personalized. Fees follow our standard group and premium 1:1 pricing. Both include stage-based progress updates and teacher feedback, but 1:1 allows deeper customization.',
  },
  {
    question: 'What happens if we miss a class?',
    answer:
      'We share quick recap notes and practice tasks after each class. If a child misses a session, mentors send a short catch‑up plan so they can rejoin smoothly without falling behind.',
  },
];

function StretchCardsRow() {
  const [activeId, setActiveId] = useState<string>(STRETCH_CARDS[0].id);

  return (
    <div className="flex flex-col gap-4 md:flex-row">
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
            className={`relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 ${isActive ? 'md:flex-[2_1_0%]' : 'md:flex-[1_1_0%] opacity-90 hover:opacity-100'}`}
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
      itemListElement: PROGRAMS.map((program, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Course',
          name: program.title,
          description: program.focus,
          provider: {
            '@type': 'Organization',
            name: 'Tiny Steps Learning',
          },
        },
      })),
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
      title: 'Online Summer Camps for Kids (Ages 4–12) | 10-Week Reading, Phonics & Speaking',
      description:
        'Online 10‑week summer camps for ages 4–12 with reading, phonics, and speaking tracks. Choose group batches or premium 1:1 for faster progress, with clear outcomes and mentor feedback.',
      canonicalPath: '/summer-camps',
      ogType: 'website',
      jsonLd: [breadcrumbSchema, courseListSchema, faqSchema],
    });
  }, []);

  return (
    <>
      <div className="bg-white pb-24 md:pb-0">
        <section className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-emerald-50">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
              Summer Camps 2026
            </p>
            <h1 className="mt-3 text-4xl font-bold text-gray-900 md:text-5xl">
              10 weeks to stronger reading + clearer phonics + confident speaking
            </h1>
            <p className="mt-4 max-w-3xl text-lg text-gray-700">
              Online summer camps for ages 4–12. Choose group classes for motivation
              and affordability, or premium 1:1 for faster, personalized progress.
            </p>
            <p className="mt-3 text-sm text-gray-600">
              Summer camp runs April 1–June 15, 2026 (10 weeks). Group classes are the default, with a premium 1:1 option.
            </p>
            <p className="mt-1 text-xs text-gray-600">
              Fees follow our standard group and premium 1:1 pricing.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full bg-white/80 px-4 py-1 text-gray-700">Ages 4–5</span>
              <span className="rounded-full bg-white/80 px-4 py-1 text-gray-700">Ages 6–7</span>
              <span className="rounded-full bg-white/80 px-4 py-1 text-gray-700">Ages 8–10</span>
              <span className="rounded-full bg-white/80 px-4 py-1 text-gray-700">Ages 10–12</span>
            </div>
            <p className="mt-2 text-xs text-gray-600">
              Age ranges are guidelines; final grouping is based on level after a quick assessment.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Group Classes</p>
                <p className="mt-2 text-sm text-gray-700">
                  Best for motivation + peer learning + affordability.
                  Format: 1:4 or 1:6. Includes stage-based progress updates + teacher feedback.
                </p>
                <div className="mt-4">
                  <Link
                    to="#batches"
                    className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    View Group Batches
                  </Link>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-600">Premium 1:1</p>
                <p className="mt-2 text-sm text-gray-700">
                  Best for faster progress + personalized attention. Includes a custom plan
                  and parent updates after every week.
                </p>
                <div className="mt-4">
                  <Link
                    to="/?book=1"
                    className="inline-flex items-center justify-center rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Request 1:1 Slot
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/?book=1"
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
              >
                Book Free Reading Check
              </Link>
              <a
                href="https://wa.me/919618398383"
                className="inline-flex items-center justify-center rounded-full border border-emerald-600 px-5 py-2.5 text-sm font-semibold text-emerald-700"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pt-10">
          <div className="rounded-2xl border border-emerald-100 bg-white p-4 text-sm text-gray-700">
            Prefer the full 10-week reading + grammar + speaking camp for ages 3–12?{' '}
            <Link to="/summer-english-camp-2026" className="font-semibold text-emerald-700 hover:text-emerald-800">
              View Summer English Camp 2026 →
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pt-10 pb-12">
          <div className="mb-6 flex flex-col gap-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">Quick Highlights</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Why families choose these camps</h2>
            <p className="text-sm text-gray-600">
              Tap a card to expand on mobile, or hover on desktop.
            </p>
          </div>
          <StretchCardsRow />
        </section>

        <section className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <h2 className="text-lg font-semibold text-gray-900">What is this camp?</h2>
              <p className="mt-2 text-sm text-gray-700">
                A 10‑week online summer camp following our core curriculum in phonics, grammar, and public
                speaking. Delivered primarily in group classes with a premium 1:1 option, plus mentor‑led
                sessions, practice tasks, and parent‑friendly progress updates.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <h2 className="text-lg font-semibold text-gray-900">What will my child achieve?</h2>
              <p className="mt-2 text-sm text-gray-700">
                Children finish with measurable progress across phonics, grammar, and speaking. You’ll receive
                stage-based progress updates and teacher feedback that show mastered skills and next steps.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-12">
          <h2 className="text-2xl font-semibold text-gray-900">Choose a program</h2>
          <p className="mt-2 text-sm text-gray-600">
            Pick the focus track that matches your child’s current level and goal. All tracks follow the full curriculum.
          </p>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {PROGRAMS.map((program) => (
              <div key={program.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">{program.title}</h3>
                <p className="text-xs text-gray-500">{program.ages} • {program.duration}</p>
                <p className="mt-2 text-sm text-gray-700">{program.focus}</p>
                <ul className="mt-3 list-disc pl-5 text-sm text-gray-700">
                  {program.outcomes.map((outcome) => (
                    <li key={outcome}>{outcome}</li>
                  ))}
                </ul>
                <div className="mt-4">
                  <Link
                    to={`/summer-camps/${program.id}`}
                    className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    View program details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="batches" className="mx-auto max-w-6xl px-6 pb-12">
          <h2 className="text-2xl font-semibold text-gray-900">Upcoming group batches</h2>
          <p className="mt-2 text-sm text-gray-600">
            One batch per URL for clearer event details and easier registration.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {BATCHES.map((batch) => (
              <Link
                key={batch.id}
                to={`/summer-camps/${batch.id}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-200"
              >
                <div className="text-sm font-semibold text-gray-900">{batch.label}</div>
                <div className="mt-2 text-xs text-gray-600">
                  {batch.dates} • {batch.time} • {batch.mode} • {batch.capacity}
                </div>
                <div className="mt-3 text-sm text-emerald-700 font-semibold">View batch →</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-16">
          <h2 className="text-2xl font-semibold text-gray-900">FAQs</h2>
          <div className="mt-4 space-y-4">
            {FAQS.map((faq) => (
              <div key={faq.question} className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-gray-900">{faq.question}</h3>
                <p className="mt-2 text-sm text-gray-700">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="fixed inset-x-0 bottom-0 z-40 md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex items-center justify-between gap-3 rounded-t-2xl border border-gray-200 bg-white/95 px-3 py-3 shadow-lg backdrop-blur">
              <Link
                to="/?book=1"
                className="flex-1 rounded-full bg-emerald-600 px-4 py-2 text-center text-sm font-semibold text-white"
              >
                Book Free Reading Check
              </Link>
              <a
                href="https://wa.me/919618398383"
                className="flex-1 rounded-full border border-emerald-600 px-4 py-2 text-center text-sm font-semibold text-emerald-700"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
