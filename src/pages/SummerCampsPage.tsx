import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../lib/seo';

const PROGRAMS = [
  {
    id: 'reading-jumpstart',
    title: 'Reading Jumpstart',
    ages: 'Ages 4–7',
    duration: '3 weeks',
    focus: 'Foundational reading fluency + decoding',
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
    duration: '3 weeks',
    focus: 'SATPIN sounds + blending routines',
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
    duration: '3 weeks',
    focus: 'Clear speech + expressive communication',
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
    dates: 'May 4–23, 2026',
    time: '9:00–9:40 AM IST',
    mode: 'Online',
    capacity: 'Max 6 kids',
  },
  {
    id: 'reading-jumpstart/batch-may-2026-evening-ist',
    label: 'Reading Jumpstart • Evening IST',
    dates: 'May 4–23, 2026',
    time: '6:00–6:40 PM IST',
    mode: 'Online',
    capacity: 'Max 6 kids',
  },
  {
    id: 'phonics-foundations/batch-may-2026-morning-ist',
    label: 'Phonics Foundations • Morning IST',
    dates: 'May 4–23, 2026',
    time: '10:00–10:40 AM IST',
    mode: 'Online',
    capacity: 'Max 6 kids',
  },
];

const FAQS = [
  {
    question: 'What is this summer camp?',
    answer:
      'Tiny Steps Summer Camps are short, structured online programs (3 weeks) focused on a single outcome: stronger reading, clearer phonics, or confident speaking. Children attend live mentor-led sessions with clear milestones, practice tasks, and weekly feedback so parents can see progress quickly.',
  },
  {
    question: 'Who is it for?',
    answer:
      'These camps are for ages 4–12, grouped by ability level. If your child is just starting to read, the Reading Jumpstart or Phonics Foundations tracks work best. If your child reads but needs clarity or confidence, the Confident Speaking camp is ideal.',
  },
  {
    question: 'How are group classes different from 1:1?',
    answer:
      'Group classes (1:4–1:6) focus on motivation and peer learning at a lower fee per child, while premium 1:1 is faster and fully personalized. Both include stage-based progress updates and teacher feedback, but 1:1 allows deeper customization.',
  },
  {
    question: 'What happens if we miss a class?',
    answer:
      'We share quick recap notes and practice tasks after each class. If a child misses a session, mentors send a short catch‑up plan so they can rejoin the next class without falling behind.',
  },
];

export default function SummerCampsPage() {
  useEffect(() => {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
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
      title: 'Online Summer Camps for Kids (Reading, Phonics, Speaking) | Tiny Steps',
      description:
        '3‑week online summer camps for ages 4–12. Reading, phonics, and confident speaking tracks with group classes or premium 1:1. Clear outcomes, stage-based progress updates, and live mentor feedback.',
      canonicalPath: '/summer-camps',
      ogType: 'website',
      jsonLd: [breadcrumbSchema, courseListSchema, faqSchema],
    });
  }, []);

  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-emerald-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
            Summer Camps 2026
          </p>
          <h1 className="mt-3 text-4xl font-bold text-gray-900 md:text-5xl">
            3 weeks to stronger reading + confident speaking
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-gray-700">
            Online summer camps for ages 4–12. Choose group classes for motivation
            and affordability, or premium 1:1 for faster, personalized progress.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-white/80 px-4 py-1 text-gray-700">Ages 4–5</span>
            <span className="rounded-full bg-white/80 px-4 py-1 text-gray-700">Ages 6–7</span>
            <span className="rounded-full bg-white/80 px-4 py-1 text-gray-700">Ages 8–10</span>
            <span className="rounded-full bg-white/80 px-4 py-1 text-gray-700">Ages 10–12</span>
          </div>

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

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h2 className="text-lg font-semibold text-gray-900">What is this camp?</h2>
            <p className="mt-2 text-sm text-gray-700">
              A 3‑week online camp with a single, clear outcome: better reading, stronger phonics,
              or confident speaking. Each week includes live mentor‑led classes, practice tasks,
              and parent‑friendly progress updates so you can see improvement quickly.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h2 className="text-lg font-semibold text-gray-900">What will my child achieve?</h2>
            <p className="mt-2 text-sm text-gray-700">
              Children finish with measurable progress: clearer decoding, smoother reading, or stronger
              speaking confidence. You’ll receive stage-based progress updates and teacher feedback that show
              mastered skills and next steps.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-12">
        <h2 className="text-2xl font-semibold text-gray-900">Choose a program</h2>
        <p className="mt-2 text-sm text-gray-600">
          Pick the camp that matches your child’s current level and goal.
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
    </div>
  );
}
