import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Meta from '../../components/common/Meta';
import LetterTracingGame from '../kids/games/phonics/LetterTracingGame';
import { LETTER_IDS, isLetterReady } from '../kids/games/phonics/tracing/traceLetters';
import { trackEvent } from '../../lib/analytics';
import { trackFreeResourceStart, trackFreeResourceToTrialClick } from '../../lib/conversionTracking';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema, createWebPageSchema } from '../../lib/schemas';

const PAGE_PATH = '/free-letter-tracing-game-for-kids';
const PAGE_URL = `https://tinystepslearning.com${PAGE_PATH}`;

const faqItems = [
  {
    question: 'Is this letter tracing game free?',
    answer: 'Yes. Children can practise pre-writing strokes and letter tracing online for free.',
  },
  {
    question: 'What age is this letter tracing game for?',
    answer: 'It is best for preschool, kindergarten, and early phonics learners who are starting alphabet writing.',
  },
  {
    question: 'Should my child start with letters or lines?',
    answer: 'Children who are new to writing should start with Level 0 lines and curves before moving to capital and small letters.',
  },
  {
    question: 'Does tracing help with reading?',
    answer: 'Tracing helps children recognise letter shapes and formation. For reading, children also need letter sounds, blending, and phonics practice.',
  },
  {
    question: 'Can my child practise one letter at a time?',
    answer: 'Yes. Children can choose individual letters and practise capital and small letter formation step by step.',
  },
] as const;

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
    'Play a free online letter tracing game for kids. Practise pre-writing strokes, capital letters, small letters, and early phonics readiness with Tiny Steps.',
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
  const [searchParams] = useSearchParams();
  const isPlayMode = searchParams.get('level') !== null;
  const readyLetters = useMemo(
    () =>
      LETTER_IDS.filter((letterId) => letterId === letterId.toUpperCase() && isLetterReady(letterId) && isLetterReady(letterId.toLowerCase() as typeof letterId))
        .map((upper, index) => {
          const lower = upper.toLowerCase();
          return {
            upper,
            lower,
            pairIndex: index,
            anchorId: `trace-letter-${lower}`,
            href: `${PAGE_PATH}?level=1&pair=${index}&step=0&fs=1#play`,
          };
        }),
    [],
  );
  const practiceLetters = useMemo(
    () =>
      Array.from({ length: 26 }, (_, index) => {
        const upper = String.fromCharCode(65 + index);
        return {
          label: `Trace letter ${upper}`,
          href: `${PAGE_PATH}?level=1&pair=${index}&step=0#play`,
        };
      }),
    [],
  );

  useEffect(() => {
    applySeo({
      title: 'Free Letter Tracing Game for Kids | Tiny Steps',
      description:
        'Play a free online letter tracing game for kids. Practise pre-writing strokes, capital letters, small letters, and early phonics readiness with Tiny Steps.',
      canonicalPath: PAGE_PATH,
      ogType: 'website',
      jsonLd: [
        createWebPageSchema({
          name: 'Free Letter Tracing Game for Kids',
          description:
            'Play a free online letter tracing game for kids with pre-writing strokes, uppercase and lowercase tracing, and phonics-readiness support.',
          url: PAGE_URL,
        }),
        appSchema,
        breadcrumbSchema,
        createFAQPageSchema([...faqItems]),
      ],
    });
  }, []);

  const handleHeroStart = () => {
    trackFreeResourceStart('free_letter_tracing_game', PAGE_PATH);
    trackEvent('letter_tracing_game_start', {
      page_path: PAGE_PATH,
      game_id: 'letter-tracing',
      source_context: 'hero_cta',
    });
  };

  const handleBookDemoClick = () => {
    trackFreeResourceToTrialClick({
      page_path: PAGE_PATH,
      cta_label: 'Book Free Phonics Assessment',
      cta_location: 'post_game_cta',
      destination_path: '/book-demo',
      program: 'phonics',
    });
    trackEvent('letter_tracing_book_demo_click', {
      page_path: PAGE_PATH,
      game_id: 'letter-tracing',
      destination_path: '/book-demo',
      source_context: 'post_game_cta',
    });
  };

  const handleLetterStart = (upper: string, lower: string, sourceContext: string) => {
    trackFreeResourceStart(`letter_tracing_${lower}`, PAGE_PATH);
    trackEvent('letter_tracing_level_start', {
      page_path: PAGE_PATH,
      game_id: 'letter-tracing',
      source_context: sourceContext,
      level: 1,
      item_id: upper,
      item_type: 'letter',
    });
  };

  return (
    <div className="overflow-x-clip bg-[linear-gradient(180deg,#fff8ef_0%,#f7fbff_38%,#ffffff_100%)]">
      <Meta
        title="Free Letter Tracing Game for Kids | Tiny Steps"
        description="Play a free online letter tracing game for kids. Practise pre-writing strokes, capital letters, small letters, and early phonics readiness with Tiny Steps."
        canonical={PAGE_URL}
      />

      <div className="mx-auto w-full max-w-7xl px-4 pb-14 pt-4 sm:px-6 lg:px-8">
        {!isPlayMode ? (
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
                  Help your child practise pre-writing strokes, capital letters, and small letters with a simple online tracing game designed for preschool and early phonics learners.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to={`${PAGE_PATH}?level=0&pair=0&step=0&fs=1#play`}
                    onClick={handleHeroStart}
                    className="inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Start pre-writing strokes
                  </Link>
                  <Link
                    to={`${PAGE_PATH}?level=1&pair=0&step=0&fs=1#play`}
                    onClick={handleHeroStart}
                    className="inline-flex items-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                  >
                    Start capital and small letter tracing
                  </Link>
                </div>
              </div>

              <aside className="rounded-[28px] border border-slate-200 bg-white/88 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Quick answer for parents</p>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  Tracing helps children learn letter formation and pencil control. It is useful for writing readiness, but children still need letter sounds, blending, and phonics practice for reading.
                </p>
                <div className="mt-4 grid gap-3">
                  {[
                    'No login required',
                    'Best for preschool and kindergarten',
                    'Works on desktop, tablet, and mobile',
                    'Useful before deeper phonics and blending practice',
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-700">
                      {item}
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </header>
        ) : null}

        <section className={isPlayMode ? '' : 'mt-5'}>
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
        </section>

        {!isPlayMode ? (
          <>
            <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
                <h2 className="text-xl font-bold text-slate-900">What children practise</h2>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
                  <li>• Standing lines, sleeping lines, slanting lines, and curves</li>
                  <li>• Capital and small letter formation</li>
                  <li>• Starting from the correct point</li>
                  <li>• Hand-eye coordination for early writing</li>
                </ul>
              </article>

              <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
                <h2 className="text-xl font-bold text-slate-900">How to play</h2>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
                  <li>• Choose Level 0 for lines and curves</li>
                  <li>• Move to letter levels after pre-writing practice</li>
                  <li>• Start from the red dot and follow the blue guide</li>
                  <li>• Practise capital and small letters together</li>
                </ul>
              </article>

              <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
                <h2 className="text-xl font-bold text-slate-900">Best for</h2>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
                  <li>• Preschool and kindergarten children</li>
                  <li>• Children starting alphabet writing</li>
                  <li>• Children who know letters but need writing confidence</li>
                  <li>• Parents looking for a simple online letter tracing activity</li>
                </ul>
              </article>

              <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
                <h2 className="text-xl font-bold text-slate-900">Next step after tracing</h2>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  Letter tracing helps children recognise shapes and letter formation. For reading, children also need letter sounds, blending, and phonics practice. Book a free phonics assessment if you want to know the right starting level for your child.
                </p>
              </article>
            </section>

            <section className="mt-5 rounded-[28px] border border-amber-200 bg-[linear-gradient(145deg,#fff8ef_0%,#ffffff_55%,#fef3c7_100%)] p-6 shadow-[0_18px_44px_rgba(15,23,42,0.05)]">
              <h2 className="text-2xl font-bold text-slate-900">Practice letter tracing A to Z</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-700">
                Choose a letter to practise capital and small letter formation. Children can start with pre-writing strokes first, then move to alphabet tracing.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {readyLetters.map((item) => (
                  <a
                    key={`jump-${item.upper}`}
                    href={`#${item.anchorId}`}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-sky-300 hover:text-slate-900"
                  >
                    {item.upper}
                  </a>
                ))}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {readyLetters.map((item) => (
                  <article
                    key={item.upper}
                    id={item.anchorId}
                    className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm scroll-mt-28"
                  >
                    <h3 className="text-lg font-bold text-slate-900">Trace letter {item.upper}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      Capital {item.upper} and small {item.lower}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Start at the red dot and follow the blue guide.
                    </p>
                    <Link
                      to={item.href}
                      onClick={() => handleLetterStart(item.upper, item.lower, 'letter_section_card')}
                      className="mt-4 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Trace letter {item.upper}
                    </Link>
                  </article>
                ))}
              </div>
            </section>

            <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
              <p className="text-sm leading-7 text-slate-700">
                If your child traces letters but struggles to read sounds or blend words,{' '}
                <Link
                  to="/book-demo"
                  onClick={handleBookDemoClick}
                  className="font-semibold text-slate-900 underline underline-offset-4"
                >
                  book a free phonics assessment
                </Link>
                .
              </p>
            </section>

            <section className="mt-5 rounded-[28px] border border-amber-200 bg-[linear-gradient(145deg,#fff8ef_0%,#ffffff_55%,#fef3c7_100%)] p-6 shadow-[0_18px_44px_rgba(15,23,42,0.05)]">
              <h2 className="text-2xl font-bold text-slate-900">Want to know your child&apos;s phonics level?</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">
                If your child enjoys tracing but struggles with sounds, blending, or reading words, book a free Tiny Steps phonics assessment.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to="/book-demo"
                  onClick={handleBookDemoClick}
                  className="inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Book Free Phonics Assessment
                </Link>
                <Link
                  to="/phonics-learning-games"
                  className="inline-flex rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  Explore more phonics games
                </Link>
              </div>
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
          </>
        ) : null}
      </div>
    </div>
  );
}
