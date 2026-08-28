import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Meta from '../../components/common/Meta';
import { trackEvent } from '../../lib/analytics';
import { trackFreeResourceStart, trackFreeResourceToTrialClick } from '../../lib/conversionTracking';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema, createWebPageSchema } from '../../lib/schemas';
import KidsBalloonPop from '../KidsBalloonPop';

const PAGE_PATH = '/free-balloon-pop-phonics-game-for-kids';
const PAGE_URL = `https://tinystepslearning.com${PAGE_PATH}`;
const PUBLIC_PROGRESS_KEY = 'ts_balloonpop_progress_guest';
const SEO_TITLE = 'Free Balloon Pop Phonics Game for Kids | Tiny Steps';
const SEO_DESCRIPTION =
  'Play a free balloon pop phonics game for kids. Children listen to letter sounds, choose the correct balloon, and build early phonics recognition through play.';

const faqItems = [
  {
    question: 'Is this Balloon Pop phonics game free to use?',
    answer: 'Yes. Children can play this Tiny Steps phonics listening game free in the browser without creating an account.',
  },
  {
    question: 'What age is the Balloon Pop phonics game for?',
    answer: 'It is best for preschool, kindergarten, and early-primary children who are learning or revising English letter sounds.',
  },
  {
    question: 'What does the Balloon Pop game teach?',
    answer: 'The game helps children hear a letter sound, identify the matching letter, and respond quickly. This strengthens letter-sound recall, listening discrimination, and early reading readiness.',
  },
  {
    question: 'Does the game include SATPIN practice?',
    answer: 'Yes. The first Tiny Steps phonics sound group uses s, a, t, i, p, and n so beginners can practise a familiar early sound set before moving to more letters.',
  },
  {
    question: 'Should my child say the letter name or the letter sound?',
    answer: 'During this activity, focus on the sound the letter represents. Letter names are useful too, but sound recall is the skill children need for blending and early decoding.',
  },
  {
    question: 'Can teachers and homeschool families use this game?',
    answer: 'Yes. It works well as a short phonics warm-up, sound-recognition activity, revision game, or listening break before blending and reading practice.',
  },
  {
    question: 'Will a phonics game alone teach my child to read?',
    answer: 'No single game teaches the full reading process. Letter-sound practice supports the foundation, while children also need blending, decoding, word reading, fluency, and guided correction.',
  },
] as const;

const soundGroups = [
  { level: 'Sound Group 1', letters: 's · a · t · i · p · n', note: 'SATPIN listening and sound recall' },
  { level: 'Sound Group 2', letters: 'c · k · e · h · r · m', note: 'Expand early consonant and vowel recognition' },
  { level: 'Sound Group 3', letters: 'd · g · o · u · l · f', note: 'Build faster mixed-sound recognition' },
  { level: 'Sound Group 4', letters: 'b · j', note: 'Focused listening practice' },
  { level: 'Sound Group 5', letters: 'v · w', note: 'Focused listening practice' },
  { level: 'Sound Group 6', letters: 'x · y', note: 'Later alphabet sound practice' },
  { level: 'Sound Group 7', letters: 'q · z', note: 'Complete the current sound set' },
] as const;

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  '@id': `${PAGE_URL}#breadcrumb`,
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
    { '@type': 'ListItem', position: 2, name: 'Free Phonics Games for Kids', item: 'https://tinystepslearning.com/free-phonics-games-for-kids' },
    { '@type': 'ListItem', position: 3, name: 'Free Phonics Balloon Pop Game for Kids', item: PAGE_URL },
  ],
};

const appSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  '@id': `${PAGE_URL}#webapp`,
  name: 'Tiny Steps Phonics Balloon Pop',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Any',
  url: PAGE_URL,
  description:
    'A free Tiny Steps phonics listening game where children hear a letter sound, identify the matching letter, and pop the correct balloon.',
  isAccessibleForFree: true,
  educationalUse: 'Phonics letter-sound recognition and listening practice',
  learningResourceType: 'Educational game',
  audience: {
    '@type': 'EducationalAudience',
    educationalRole: 'student',
  },
  publisher: {
    '@type': 'EducationalOrganization',
    name: 'Tiny Steps Learning',
    url: 'https://tinystepslearning.com/',
  },
};

function readPublicCompletionCounts(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(PUBLIC_PROGRESS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as {
      completed?: Record<string, { completedSessions?: number }>;
    };
    return Object.fromEntries(
      Object.entries(parsed.completed || {}).map(([level, value]) => [level, Number(value?.completedSessions || 0)]),
    );
  } catch {
    return {};
  }
}

export default function FreeBalloonPopGamePage() {
  const [searchParams] = useSearchParams();
  const selectedLevel = searchParams.get('level');
  const lastTrackedLevelRef = useRef<string | null>(null);
  const completionCountsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    applySeo({
      title: SEO_TITLE,
      description: SEO_DESCRIPTION,
      canonicalPath: PAGE_PATH,
      ogType: 'website',
      jsonLd: [
        createWebPageSchema({
          name: 'Free Phonics Balloon Pop Game for Kids',
          description:
            'A free online Tiny Steps phonics game for letter-sound listening, sound recognition, and early reading readiness.',
          url: PAGE_URL,
        }),
        appSchema,
        breadcrumbSchema,
        createFAQPageSchema([...faqItems]),
      ],
    });
  }, []);

  useEffect(() => {
    if (!selectedLevel || selectedLevel === lastTrackedLevelRef.current) return;
    lastTrackedLevelRef.current = selectedLevel;
    trackEvent('balloon_pop_level_select', {
      page_path: PAGE_PATH,
      game_id: 'balloon-pop',
      level: Number(selectedLevel),
      sound_group: `sound_group_${selectedLevel}`,
      source_context: 'public_free_game',
    });
  }, [selectedLevel]);

  useEffect(() => {
    completionCountsRef.current = readPublicCompletionCounts();
    const timer = window.setInterval(() => {
      const nextCounts = readPublicCompletionCounts();
      Object.entries(nextCounts).forEach(([level, completedSessions]) => {
        const previous = completionCountsRef.current[level] || 0;
        if (completedSessions > previous) {
          trackEvent('balloon_pop_level_complete', {
            page_path: PAGE_PATH,
            game_id: 'balloon-pop',
            level: Number(level),
            sound_group: `sound_group_${level}`,
            completed_sessions: completedSessions,
            public_mode: true,
          });
        }
      });
      completionCountsRef.current = nextCounts;
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const handleGameStart = (sourceContext: string) => {
    trackFreeResourceStart('free_balloon_pop_phonics_game', PAGE_PATH);
    trackEvent('balloon_pop_game_start', {
      page_path: PAGE_PATH,
      game_id: 'balloon-pop',
      source_context: sourceContext,
    });
  };

  const handleNextGameClick = (destinationPath: string, label: string) => {
    trackEvent('balloon_pop_next_game_click', {
      page_path: PAGE_PATH,
      game_id: 'balloon-pop',
      destination_path: destinationPath,
      destination_label: label,
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
    trackEvent('balloon_pop_book_demo_click', {
      page_path: PAGE_PATH,
      game_id: 'balloon-pop',
      destination_path: '/book-demo',
      source_context: 'post_game_cta',
    });
  };

  return (
    <div className="overflow-x-clip bg-[linear-gradient(180deg,#f8f5ff_0%,#f5fbff_34%,#ffffff_100%)]">
      <Meta title={SEO_TITLE} description={SEO_DESCRIPTION} canonical={PAGE_URL} />

      <div className="mx-auto w-full max-w-7xl px-4 pb-14 pt-4 sm:px-6 lg:px-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/free-phonics-games-for-kids"
            className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:border-slate-400"
          >
            ← Free Phonics Games
          </Link>
          <Link
            to="/free-english-games-for-kids"
            className="text-sm font-semibold text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-slate-900"
          >
            Browse all free English games
          </Link>
        </div>

        <header className="relative overflow-hidden rounded-[32px] border border-violet-100 bg-[linear-gradient(145deg,#ffffff_0%,#f7f2ff_48%,#eef9ff_100%)] p-6 shadow-[0_22px_60px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="pointer-events-none absolute -left-12 top-8 h-44 w-44 rounded-full bg-violet-200/35 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-0 h-52 w-52 rounded-full bg-sky-200/35 blur-3xl" />

          <div className="relative grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div>
              <p className="inline-flex rounded-full border border-violet-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-700">
                Tiny Steps Phonics · Free listening practice
              </p>
              <h1 className="mt-4 text-[34px] font-black leading-[1.04] tracking-[-0.035em] text-slate-950 sm:text-[44px]">
                Free Phonics Balloon Pop Game for Kids
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700 sm:text-lg sm:leading-8">
                Hear a letter sound, find the matching letter, and pop the correct balloon. This child-friendly Tiny Steps Phonics game turns sound recognition into quick, playful listening practice for early readers.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to={`${PAGE_PATH}?level=1#play`}
                  onClick={() => handleGameStart('hero_sound_group_1')}
                  className="inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Start with SATPIN
                </Link>
                <a
                  href="#play"
                  onClick={() => handleGameStart('hero_choose_level')}
                  className="inline-flex items-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  Choose a sound group
                </a>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
                {['Free', 'No login', 'Preschool & kindergarten', 'Tablet · mobile · desktop', 'Letter-sound listening'].map((item) => (
                  <span key={item} className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <aside className="rounded-[28px] border border-white/80 bg-white/88 p-5 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">The Tiny Steps learning loop</p>
              <div className="mt-4 grid grid-cols-5 gap-2 text-center">
                {[
                  ['1', 'Hear'],
                  ['2', 'Identify'],
                  ['3', 'Match'],
                  ['4', 'Pop'],
                  ['5', 'Repeat'],
                ].map(([step, label]) => (
                  <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 px-2 py-3">
                    <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">{step}</div>
                    <div className="mt-2 text-[11px] font-bold text-slate-700 sm:text-xs">{label}</div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-700">
                Children are not asked to guess a word. They listen for one sound, connect it to the printed letter, respond, and hear the sound again. That repeated sound-to-print connection supports the foundation needed before blending.
              </p>
            </aside>
          </div>
        </header>

        <section id="play" className="mt-5 rounded-[32px] border border-slate-200 bg-white p-2 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
          <KidsBalloonPop
            baseRoute={PAGE_PATH}
            missionReturnHrefOverride="/free-english-games-for-kids"
            missionBackLabel="← Back to Free Games"
            hideNoKidNotice
            publicMode
            unlockAllLevels
            showTopBackButton={false}
            disableFullscreen
          />
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
            <h2 className="text-xl font-bold text-slate-900">What children practise</h2>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
              <li>• Hearing a target letter sound clearly</li>
              <li>• Matching a sound to the correct printed letter</li>
              <li>• Faster letter-sound recall</li>
              <li>• Listening attention and visual scanning</li>
            </ul>
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
            <h2 className="text-xl font-bold text-slate-900">How to play</h2>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
              <li>• Choose a Tiny Steps phonics sound group</li>
              <li>• Listen to the target sound</li>
              <li>• Find the balloon carrying the matching letter</li>
              <li>• Pop it and repeat until the round is complete</li>
            </ul>
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
            <h2 className="text-xl font-bold text-slate-900">Best for</h2>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
              <li>• Preschool and kindergarten learners</li>
              <li>• Children revising alphabet sounds</li>
              <li>• Children who confuse letter names and sounds</li>
              <li>• Short home or classroom phonics warm-ups</li>
            </ul>
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
            <h2 className="text-xl font-bold text-slate-900">Why this matters for reading</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Children need quick sound-to-letter recall before blending feels easy. Balloon Pop strengthens that recognition step, then children can move into oral blending, CVC words, and connected reading.
            </p>
          </article>
        </section>

        <section className="mt-5 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.05)]">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">Tiny Steps Phonics sound groups</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Start with a small sound set, then expand gradually</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              The public game groups letters into short practice sets so children can focus on a manageable number of sounds at one time. Sound Group 1 begins with SATPIN, a useful early set because those letters can later combine into many simple words.
            </p>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {soundGroups.map((group, index) => (
              <Link
                key={group.level}
                to={`${PAGE_PATH}?level=${index + 1}#play`}
                onClick={() => handleGameStart(`sound_group_${index + 1}`)}
                className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-violet-300 hover:bg-violet-50/60"
              >
                <div className="text-sm font-bold text-slate-900">{group.level}</div>
                <div className="mt-2 text-lg font-black tracking-wide text-violet-700">{group.letters}</div>
                <div className="mt-2 text-xs leading-5 text-slate-600">{group.note}</div>
              </Link>
            ))}
          </div>

          <p className="mt-4 text-sm leading-7 text-slate-700">
            Parents starting with SATPIN can also read the{' '}
            <Link to="/blog/satpin-phonics-guide" className="font-semibold text-violet-700 underline underline-offset-4">
              SATPIN phonics guide for parents
            </Link>{' '}
            for a fuller home-practice sequence.
          </p>
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-2">
          <article className="rounded-[28px] border border-slate-200 bg-[linear-gradient(145deg,#f8fbff_0%,#ffffff_100%)] p-6 shadow-[0_18px_44px_rgba(15,23,42,0.05)]">
            <h2 className="text-2xl font-bold text-slate-900">Parent guidance: keep the game purposeful</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
              <li>• Start with one sound group instead of jumping across all levels.</li>
              <li>• Ask your child to say the sound aloud after hearing it.</li>
              <li>• If two sounds are confused, slow down and practise those sounds separately.</li>
              <li>• Stop while the activity still feels fun; short repeated sessions are more useful than one long session.</li>
              <li>• After the game, blend two or three familiar sounds orally so recognition transfers toward reading.</li>
            </ul>
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-[linear-gradient(145deg,#fff9f1_0%,#ffffff_100%)] p-6 shadow-[0_18px_44px_rgba(15,23,42,0.05)]">
            <h2 className="text-2xl font-bold text-slate-900">For teachers and homeschool practice</h2>
            <p className="mt-4 text-sm leading-7 text-slate-700">
              Use Balloon Pop as a 5–10 minute sound-recognition warm-up before blending or word reading. It is especially useful when children need more repetition without turning phonics review into a worksheet-only task.
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              For broader practice, browse the{' '}
              <Link to="/free-letter-sound-games-for-kids" className="font-semibold text-violet-700 underline underline-offset-4">
                free letter-sound games collection
              </Link>{' '}
              or the complete{' '}
              <Link to="/free-phonics-games-for-kids" className="font-semibold text-violet-700 underline underline-offset-4">
                free phonics games collection
              </Link>.
            </p>
          </article>
        </section>

        <section className="mt-5 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.05)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Continue the Tiny Steps phonics journey</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Move from seeing letters to hearing, matching, listening, and blending sounds</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {[
              {
                title: '1. Trace letters',
                body: 'Build letter-shape recognition and formation.',
                to: '/free-letter-tracing-game-for-kids',
              },
              {
                title: '2. Trace + sound',
                body: 'Connect the letter shape with its sound.',
                to: '/letter-tracing-with-sounds-game',
              },
              {
                title: '3. Letter sounds',
                body: 'Practise direct letter-to-sound matching and recall.',
                to: '/free-letter-sounds-game-for-kids',
              },
              {
                title: '4. Balloon Pop',
                body: 'Hear a sound and find its matching letter quickly.',
                to: PAGE_PATH,
              },
              {
                title: '5. Sound listening',
                body: 'Strengthen listening and sound discrimination.',
                to: '/free-sound-listening-game-for-kids',
              },
              {
                title: '6. Blend words',
                body: 'Join known sounds into simple words and begin decoding.',
                to: '/free-word-building-game-for-kids',
              },
            ].map((item) => (
              <Link
                key={item.title}
                to={item.to}
                onClick={() => handleNextGameClick(item.to, item.title)}
                className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 hover:border-violet-300"
              >
                <div className="text-sm font-bold text-slate-900">{item.title}</div>
                <div className="mt-2 text-sm leading-6 text-slate-600">{item.body}</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.05)]">
          <h2 className="text-2xl font-bold text-slate-900">Frequently asked questions</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {faqItems.map((item) => (
              <article key={item.question} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <h3 className="text-base font-bold text-slate-900">{item.question}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-700">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-[30px] border border-violet-200 bg-[linear-gradient(135deg,#f7f2ff_0%,#eef9ff_100%)] p-6 sm:p-8">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">When free practice is not enough</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Find your child’s next phonics step</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">
                If your child still confuses sounds, guesses words, or struggles to blend after regular practice, a structured assessment can identify whether the gap is sound recall, blending, decoding, or fluency.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/book-demo"
                onClick={handleBookDemoClick}
                className="inline-flex rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Book Free Phonics Assessment
              </Link>
              <Link
                to="/phonics"
                className="inline-flex rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                Explore Tiny Steps Phonics
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
