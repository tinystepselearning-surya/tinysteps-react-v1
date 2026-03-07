import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Meta from '../../components/common/Meta';
import { applySeo } from '../../lib/seo';

const GAMES_WHATSAPP_URL = `https://wa.me/919618398383?text=${encodeURIComponent(
  'Hey TinySteps, I want to know more about the game subscription.'
)}`;

const GAME_CARDS = [
  {
    title: 'Letter Tracing',
    badge: 'Live now',
    description:
      'Children start with pre-writing lines and curves, then move into capital and small letter tracing with guided visual support.',
    points: ['Pre-tracing warm-up', 'Capital to small letters', 'Guided dots and stroke flow'],
    emoji: '✍️',
  },
  {
    title: 'Sound Practice Games',
    badge: 'Included',
    description:
      'Children build sound awareness through playful phonics activities designed for short, focused daily practice.',
    points: ['Letter-sound recall', 'Listening practice', 'Confidence-building repetition'],
    emoji: '🔊',
  },
  {
    title: 'Reading Readiness',
    badge: 'Included',
    description:
      'Games are designed to support the journey from recognising letters to blending, reading, and independent confidence.',
    points: ['Step-by-step progression', 'Practice at home', 'Child-friendly learning flow'],
    emoji: '📚',
  },
];

const BENEFITS = [
  'Easy for young children to use independently',
  'Structured practice that feels playful, not heavy',
  'Perfect add-on to phonics classes and homework',
  'Designed for repetition, confidence, and skill growth',
];

const FAQS = [
  {
    question: 'Is the pricing per child?',
    answer: 'Yes. Pricing is per child: ₹199 per month or ₹999 lifetime access, with a 3-day free trial before you commit.',
  },
  {
    question: 'What age group is this for?',
    answer: 'This works best for early learners who are building phonics, letter formation, and reading readiness skills at home.',
  },
  {
    question: 'Can my child use it without much parent support?',
    answer: 'That is the goal. The games are designed to be clear, visual, and simple enough for regular independent practice.',
  },
  {
    question: 'Do I need to print anything?',
    answer: 'No. This is designed as on-screen practice so children can learn directly in the web app.',
  },
];

export default function LearningGamesMarketingPage() {
  useEffect(() => {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
        { '@type': 'ListItem', position: 2, name: 'Phonics Learning Games', item: 'https://tinystepslearning.com/phonics-learning-games' },
      ],
    };

    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    };

    applySeo({
      title: 'Phonics Practice Games for Kids | Tiny Steps Learning',
      description:
        'Interactive phonics practice games for kids with tracing, sound work, and reading readiness. ₹199/month or ₹999 lifetime per child, with a 3-day free trial.',
      canonicalPath: '/phonics-learning-games',
      ogType: 'website',
      jsonLd: [breadcrumbSchema, faqSchema],
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Meta
        title="Phonics Practice Games for Kids | Tiny Steps Learning"
        description="Interactive phonics practice games for kids with tracing, sound work, and reading readiness. ₹199/month or ₹999 lifetime per child, with a 3-day free trial."
        canonical="https://tinystepslearning.com/phonics-learning-games"
      />

      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.18),_transparent_35%),radial-gradient(circle_at_left,_rgba(59,130,246,0.12),_transparent_35%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-sm font-medium text-orange-700">
                Tiny Steps Learning Games
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 md:text-6xl">
                Playful learning games that help children practice phonics with confidence.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
                Give your child meaningful daily practice through guided learning games built for phonics foundations,
                tracing, and early reading readiness.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href={GAMES_WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5"
                >
                  Start 3-day free trial
                </a>
                <a
                  href={GAMES_WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400"
                >
                  Ask about lifetime access
                </a>
              </div>

              <p className="mt-4 text-sm font-medium text-slate-600">
                All game subscription enquiries open WhatsApp directly with a ready-to-send message for Tiny Steps.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {BENEFITS.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm"
                  >
                    <div className="mt-0.5 text-lg">✨</div>
                    <p className="text-sm leading-6 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
              <div className="rounded-[24px] bg-gradient-to-br from-sky-50 via-amber-50 to-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Simple pricing</div>
                    <div className="mt-1 text-2xl font-bold text-slate-900">One child. One clear plan.</div>
                  </div>
                  <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    3-day free trial
                  </div>
                </div>

                <div className="mt-6 grid gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="text-sm font-medium text-slate-500">Monthly</div>
                    <div className="mt-2 text-4xl font-bold text-slate-900">₹199</div>
                    <div className="mt-1 text-sm text-slate-600">per month / per child</div>
                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      Ideal for parents who want a low-risk way to begin daily skill practice after the 3-day free trial.
                    </p>
                  </div>

                  <div className="rounded-2xl border-2 border-slate-900 bg-slate-900 p-5 text-white">
                    <div className="text-sm font-medium text-slate-300">Lifetime</div>
                    <div className="mt-2 text-4xl font-bold">₹999</div>
                    <div className="mt-1 text-sm text-slate-300">one-time / per child</div>
                    <p className="mt-4 text-sm leading-6 text-slate-200">
                      Best for parents who want long-term access without worrying about monthly renewals.
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  Built as a smart practice companion for Tiny Steps learners: short, focused, repeatable, and child-friendly.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-20">
        <div className="max-w-3xl">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">Why parents love this</div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
            Not just screen time. Structured learning time.
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            These games are designed to help children practice important foundational skills in a way that feels playful,
            visual, and manageable. Parents get something meaningful. Children get something engaging.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-3xl">🎯</div>
            <h3 className="mt-4 text-xl font-semibold">Skill-focused</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Every activity is designed to practice a real learning skill such as tracing, sound recall, or reading readiness.
            </p>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-3xl">🧠</div>
            <h3 className="mt-4 text-xl font-semibold">Step-by-step progression</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Children move from easier practice to more advanced tasks, so confidence grows steadily instead of getting lost.
            </p>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-3xl">💛</div>
            <h3 className="mt-4 text-xl font-semibold">Built for young learners</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Clear visuals, simple interactions, and a calm child-friendly flow make it easier for kids to stay engaged.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-20">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-700">Inside the experience</div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">Games designed around learning outcomes</h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Tiny Steps games are not random activities. They are built to support phonics foundations, independent practice,
                and confidence-building at home.
              </p>
            </div>
            <a
              href={GAMES_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5"
            >
              Ask for access
            </a>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {GAME_CARDS.map((card) => (
              <div key={card.title} className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="text-4xl">{card.emoji}</div>
                  <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                    {card.badge}
                  </div>
                </div>
                <h3 className="mt-5 text-2xl font-semibold text-slate-900">{card.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{card.description}</p>
                <div className="mt-5 space-y-2">
                  {card.points.map((point) => (
                    <div key={point} className="flex items-start gap-3 rounded-2xl bg-white p-3">
                      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-500" />
                      <p className="text-sm leading-6 text-slate-700">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">What children get</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">A better way to practice at home</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              For many parents, the challenge is not finding content. It is finding practice that is simple, repeatable, and effective.
              This page solves that problem.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: 'Guided tracing flow',
                text: 'Children are shown where to start and how to continue, making early writing practice more intuitive.',
              },
              {
                title: 'Replay and repeat',
                text: 'Children can practice again and again, which is exactly what early learners need for confidence and retention.',
              },
              {
                title: 'Progressive learning',
                text: 'They move from simple warm-up shapes into letters and then into broader phonics confidence-building practice.',
              },
              {
                title: 'Simple for families',
                text: 'No complicated setup. Open the game and let your child practice in short, focused sessions.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-900">
        <div className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-20">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-300">Choose your plan</div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-5xl">
                Start small or unlock it once.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-300">
                Try the 3-day free trial first, then continue with the monthly plan or secure lifetime access.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[28px] border border-slate-700 bg-slate-800 p-6 text-white">
                <div className="text-sm font-medium text-slate-300">Monthly access</div>
                <div className="mt-2 text-4xl font-bold">₹199</div>
                <div className="mt-1 text-sm text-slate-400">per month / per child</div>
                <a
                  href={GAMES_WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900"
                >
                  Start monthly
                </a>
              </div>

              <div className="rounded-[28px] border border-orange-400 bg-gradient-to-br from-orange-500 to-amber-400 p-6 text-white shadow-lg shadow-orange-500/20">
                <div className="text-sm font-medium text-orange-50">Lifetime access</div>
                <div className="mt-2 text-4xl font-bold">₹999</div>
                <div className="mt-1 text-sm text-orange-50/90">one-time / per child</div>
                <a
                  href={GAMES_WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
                >
                  Get lifetime plan
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-14 md:px-10 md:py-20">
        <div className="text-center">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">FAQ</div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">Common parent questions</h2>
        </div>
        <div className="mt-10 space-y-4">
          {FAQS.map((item) => (
            <div key={item.question} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">{item.question}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14 text-center md:px-10 md:py-20">
          <div className="mx-auto max-w-3xl rounded-[32px] border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-orange-50 p-8 shadow-sm md:p-12">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">Ready to begin?</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
              Give your child a fun, focused way to practice every week.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Start with a 3-day free trial, then continue at ₹199/month or unlock lifetime access for ₹999 per child.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href={GAMES_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5"
              >
                Contact Tiny Steps
              </a>
              <Link
                to="/phonics-classes-for-kids"
                className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800"
              >
                See phonics classes
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
