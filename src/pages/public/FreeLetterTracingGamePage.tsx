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
    answer: 'No. This free tracing game works in your browser without login, so parents can start immediately.'
  },
  {
    question: 'What age group is this tracing game best for?',
    answer: 'It is best for early learners aged around 3 to 6 who are practising pre-writing strokes, capital letters, and small letters.'
  },
  {
    question: 'How often should my child play?',
    answer: 'Short daily sessions of around 10 minutes are enough for steady improvement in control and confidence.'
  },
  {
    question: 'Can this replace guided phonics teaching?',
    answer: 'This game is excellent for practice, but guided phonics teaching helps children connect tracing, sounds, and reading skills more deeply.'
  },
  {
    question: 'How is tracing connected to reading and spelling?',
    answer: 'Tracing strengthens hand control and letter familiarity. Guided phonics teaching then helps children connect those letters to sounds, blending, reading, and spelling.'
  }
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
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-2 sm:px-6 lg:px-8">
      <Meta
        title="Free Letter Tracing Game for Kids | Online Alphabet Tracing Practice"
        description="Free online letter tracing game for kids with alphabet tracing practice, pre-writing lines, and guided letter formation. Ideal for early learners building handwriting and phonics readiness."
        canonical={PAGE_URL}
      />

      <header className="rounded-3xl border border-sky-100 bg-gradient-to-br from-white via-sky-50 to-amber-50 p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Free Letter Tracing Game for Kids</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700">
          Help your child practise alphabet tracing online with guided strokes, simple warm-up patterns, and letter formation support. This page is designed for parents who want quick handwriting practice before moving into structured phonics, reading, and spelling work.
        </p>
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white/80 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Quick answer for parents</h2>
          <p className="mt-2 text-sm leading-7 text-slate-700">
            Tracing helps children learn how letters are formed. It does not replace phonics, but it supports
            the control and familiarity children need before they connect letters to sounds, reading, and
            early writing.
          </p>
        </div>
        <Link
          to={`${PAGE_PATH}?level=0&pair=0&step=0&fs=1#play`}
          onClick={() => trackFreeResourceStart('free_letter_tracing_game', PAGE_PATH)}
          className="mt-5 inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Start Free Tracing Game
        </Link>
      </header>

      <section id="play" className="mt-5 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
        <LetterTracingGame
          baseRoute={PAGE_PATH}
          missionReturnHrefOverride="/phonics-learning-games"
          showMissionBackButton={false}
          showProgressControls={false}
          forceAnonymousMode
          anonymousProgressStorageKey="__public_letter_tracing_free__"
        />
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-bold text-slate-900">What your child practises</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>• Pre-writing lines and curve patterns</li>
            <li>• Hand control and stroke direction</li>
            <li>• Capital letter formation</li>
            <li>• Small letter formation</li>
          </ul>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-bold text-slate-900">Age and usage guide</h2>
          <ol className="mt-3 space-y-2 text-sm text-slate-700">
            <li>1. Best for ages 3 to 6, or older beginners who need letter-formation practice.</li>
            <li>2. Start with warm-up shapes before letters and ask your child to begin from the red dot.</li>
            <li>3. Keep sessions short, calm, and consistent rather than long and tiring.</li>
          </ol>
        </article>
      </section>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-bold text-slate-900">Why tracing helps early writing and phonics readiness</h2>
        <p className="mt-3 text-sm leading-7 text-slate-700">
          Tracing builds fine-motor control, visual direction tracking, and muscle memory. These are core foundations children use later for neat handwriting, spelling confidence, and easier written expression. Once children recognise and form letters more comfortably, it becomes easier to connect those letters to sounds during phonics practice.
        </p>
      </section>

      <section className="mt-4 grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
          <h2 className="text-xl font-bold text-slate-900">Want structured phonics classes after tracing practice?</h2>
          <p className="mt-2 text-sm text-slate-700">
            Free tracing is a good start, but structured live support helps children move from letter practice to blending, reading, and spelling.
          </p>
          <Link to="/phonics" className="mt-3 inline-flex text-sm font-semibold text-emerald-800 underline underline-offset-4">
            Explore Tiny Steps phonics classes
          </Link>
          <Link to="/book-demo" className="mt-3 block text-sm font-semibold text-slate-900 underline underline-offset-4">
            Start with a free assessment
          </Link>
        </article>
        <article className="rounded-2xl border border-sky-200 bg-sky-50/50 p-5">
          <h2 className="text-xl font-bold text-slate-900">Link to other free learning games</h2>
          <div className="mt-2 flex flex-col gap-2 text-sm">
            <Link to="/letter-tracing-with-sounds-game" className="font-semibold text-sky-900 underline underline-offset-4">
              Letter Tracing With Sounds Game
            </Link>
            <Link to="/phonics-learning-games" className="font-semibold text-sky-900 underline underline-offset-4">
              More Tiny Steps learning games
            </Link>
          </div>
        </article>
      </section>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-bold text-slate-900">Tracing game vs structured phonics class</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <h3 className="text-base font-semibold text-slate-900">Tracing game</h3>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              Best for quick letter-formation practice, pencil control, and building comfort with capital and small letters.
            </p>
          </article>
          <article className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
            <h3 className="text-base font-semibold text-slate-900">Structured phonics class</h3>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              Best for learning how letters connect to sounds, how to blend words, and how to build reading and spelling confidence step by step.
            </p>
          </article>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-bold text-slate-900">Parent FAQ</h2>
        <div className="mt-4 space-y-4">
          {faqItems.map((faq) => (
            <article key={faq.question}>
              <h3 className="text-base font-semibold text-slate-900">{faq.question}</h3>
              <p className="mt-1 text-sm text-slate-700">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
