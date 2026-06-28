import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Meta from '../../components/common/Meta';
import LetterTracingGame from '../kids/games/phonics/LetterTracingGame';
import { trackFreeResourceStart } from '../../lib/conversionTracking';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema, createWebPageSchema } from '../../lib/schemas';

const PAGE_PATH = '/free-letter-tracing-game-for-kids';
const PAGE_URL = `https://tinystepslearning.com${PAGE_PATH}`;

const faqItems = [
  {
    question: 'Do we need to sign in to play this free tracing game?',
    answer: 'No. This free tracing game works in your browser without login, so parents can start immediately.',
  },
  {
    question: 'What age group is this tracing game best for?',
    answer: 'It is best for early learners aged around 3 to 6 who are practising pre-writing strokes, capital letters, and small letters.',
  },
  {
    question: 'How often should my child play?',
    answer: 'Short daily sessions of around 10 minutes are enough for steady improvement in control and confidence.',
  },
  {
    question: 'Can this replace guided phonics teaching?',
    answer: 'This game is excellent for practice, but guided phonics teaching helps children connect tracing, sounds, and reading skills more deeply.',
  },
  {
    question: 'How is tracing connected to reading and spelling?',
    answer: 'Tracing strengthens hand control and letter familiarity. Guided phonics teaching then helps children connect those letters to sounds, blending, reading, and spelling.',
  },
];

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  '@id': `${PAGE_URL}#breadcrumb`,
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
    { '@type': 'ListItem', position: 2, name: 'Free Letter Tracing Game for Kids', item: PAGE_URL },
  ],
};

const appSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  '@id': `${PAGE_URL}#webapp`,
  name: 'Free Letter Tracing Game for Kids',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Any',
  url: PAGE_URL,
  description:
    'Free online letter tracing game where kids practise lines, curves, capital letters, and small letters by starting at the red dot and following the guide.',
  isAccessibleForFree: true,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'INR',
  },
  publisher: {
    '@type': 'EducationalOrganization',
    name: 'Tiny Steps Learning',
    url: 'https://tinystepslearning.com/',
  },
};

export default function FreeLetterTracingGamePage() {
  useEffect(() => {
    applySeo({
      title: 'Free Letter Tracing Game for Kids | Online Alphabet Tracing Practice',
      description:
        'Free online letter tracing game for kids with alphabet tracing practice, pre-writing lines, and guided letter formation. Ideal for early learners building handwriting and phonics readiness.',
      canonicalPath: PAGE_PATH,
      ogType: 'website',
      jsonLd: [
        createWebPageSchema({
          name: 'Free Letter Tracing Game for Kids',
          description:
            'Free online letter tracing game for kids with guided alphabet tracing practice and parent-friendly support for handwriting and phonics readiness.',
          url: PAGE_URL,
        }),
        appSchema,
        breadcrumbSchema,
        createFAQPageSchema(faqItems),
      ],
    });
  }, []);

  return (
    <div className="overflow-x-clip bg-[linear-gradient(180deg,#fff8ef_0%,#f7fbff_38%,#ffffff_100%)]">
      <Meta
        title="Free Letter Tracing Game for Kids | Online Alphabet Tracing Practice"
        description="Free online letter tracing game for kids with alphabet tracing practice, pre-writing lines, and guided letter formation. Ideal for early learners building handwriting and phonics readiness."
        canonical={PAGE_URL}
      />

      <div className="mx-auto w-full max-w-7xl px-4 pb-14 pt-4 sm:px-6 lg:px-8">
        <header className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(145deg,#ffffff_0%,#f5fbff_50%,#fff7ec_100%)] p-6 shadow-[0_22px_60px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="pointer-events-none absolute -left-10 top-8 h-40 w-40 rounded-full bg-orange-200/30 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-sky-200/30 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div>
              <p className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-700">
                Free parent-friendly tracing practice
              </p>
              <h1 className="mt-4 text-[34px] font-black leading-[1.04] tracking-[-0.035em] text-slate-950 sm:text-[44px]">
                Free Letter Tracing Game for Kids
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700 sm:text-lg sm:leading-8">
                Help your child practise alphabet tracing online with guided strokes, simple warm-up patterns, and letter-formation support before moving into stronger phonics and reading readiness work.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to={`${PAGE_PATH}?level=0&pair=0&step=0&fs=1#play`}
                  onClick={() => trackFreeResourceStart('free_letter_tracing_game', PAGE_PATH)}
                  className="inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Start Free Tracing Game
                </Link>
                <Link
                  to="/online-english-classes-for-kids"
                  className="inline-flex items-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  Explore Online English Classes
                </Link>
              </div>
            </div>

            <aside className="rounded-[28px] border border-slate-200 bg-white/88 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Quick answer for parents</p>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                Tracing helps children learn how letters are formed. It does not replace phonics, but it supports the control and familiarity children need before they connect letters to sounds, reading, and early writing.
              </p>
              <div className="mt-4 grid gap-3">
                {[
                  'No login required',
                  'Best for ages 3 to 6',
                  'Short sessions work well on mobile',
                  'Works as a gentle lead-in to phonics readiness',
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </header>

        <section className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div id="play" className="rounded-[32px] border border-slate-200 bg-white p-2 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
            <LetterTracingGame
              baseRoute={PAGE_PATH}
              missionReturnHrefOverride="/phonics-learning-games"
              showMissionBackButton={false}
              showProgressControls={false}
              forceAnonymousMode
              anonymousProgressStorageKey="__public_letter_tracing_free__"
            />
          </div>

          <div className="space-y-4">
            <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <h2 className="text-xl font-bold text-slate-900">What your child practises</h2>
              <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
                <li>• Pre-writing lines and curve patterns</li>
                <li>• Hand control and stroke direction</li>
                <li>• Capital letter formation</li>
                <li>• Small letter formation</li>
              </ul>
            </article>

            <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <h2 className="text-xl font-bold text-slate-900">Age and usage guide</h2>
              <ol className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
                <li>1. Best for ages 3 to 6, or older beginners who need letter-formation practice.</li>
                <li>2. Start with warm-up shapes before letters and ask your child to begin from the red dot.</li>
                <li>3. Keep sessions short, calm, and consistent rather than long and tiring.</li>
              </ol>
            </article>
          </div>
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.05)]">
            <h2 className="text-xl font-bold text-slate-900">Why tracing helps early writing and phonics readiness</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Tracing builds fine-motor control, visual direction tracking, and muscle memory. These are core foundations children use later for neat handwriting, spelling confidence, and easier written expression. Once children recognise and form letters more comfortably, it becomes easier to connect those letters to sounds during phonics practice.
            </p>
          </article>

          <article className="rounded-[28px] border border-amber-200 bg-[linear-gradient(145deg,#fff8ef_0%,#ffffff_55%,#fef3c7_100%)] p-6 shadow-[0_18px_44px_rgba(15,23,42,0.05)]">
            <h2 className="text-xl font-bold text-slate-900">Tracing is step one. Want to know what your child should learn next?</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">
              This page keeps gameplay simple for children. If you want parent guidance on what comes after tracing, book a free reading readiness check and get a clear next step across phonics, reading, and early English foundations.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/book-demo" className="inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                Get a Free Reading Readiness Check
              </Link>
              <Link to="/phonics" className="inline-flex rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
                Explore Phonics Classes
              </Link>
            </div>
          </article>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-2">
          <article className="rounded-[28px] border border-emerald-200 bg-emerald-50/60 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
            <h2 className="text-xl font-bold text-slate-900">Want structured phonics classes after tracing practice?</h2>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              Free tracing is a good start, but structured live support helps children move from letter practice to blending, reading, and spelling.
            </p>
            <div className="mt-4 flex flex-col gap-2 text-sm font-semibold">
              <Link to="/phonics" className="text-emerald-800 underline underline-offset-4">
                Explore Tiny Steps phonics classes
              </Link>
              <Link to="/online-english-classes-for-kids" className="text-slate-900 underline underline-offset-4">
                See the full online English pathway
              </Link>
            </div>
          </article>

          <article className="rounded-[28px] border border-sky-200 bg-sky-50/60 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
            <h2 className="text-xl font-bold text-slate-900">Other free learning options</h2>
            <div className="mt-3 flex flex-col gap-2 text-sm font-semibold">
              <Link to="/letter-tracing-with-sounds-game" className="text-sky-900 underline underline-offset-4">
                Letter Tracing With Sounds Game
              </Link>
              <Link to="/phonics-learning-games" className="text-sky-900 underline underline-offset-4">
                More Tiny Steps learning games
              </Link>
            </div>
          </article>
        </section>

        <section className="mt-5 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.05)]">
          <h2 className="text-xl font-bold text-slate-900">Parent FAQ</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {faqItems.map((faq) => (
              <article key={faq.question} className="rounded-2xl border border-slate-200 bg-slate-50/75 p-4">
                <h3 className="text-base font-semibold text-slate-900">{faq.question}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-700">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
