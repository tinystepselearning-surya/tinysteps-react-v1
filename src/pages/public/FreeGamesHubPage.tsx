import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Meta from '../../components/common/Meta';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema } from '../../lib/schemas';

const PAGE_PATH = '/free-games-for-kids';
const PAGE_URL = `https://tinystepslearning.com${PAGE_PATH}`;

const TRACKS = [
  { title: 'Letters & Sounds', status: '3 ready' },
  { title: 'Build Words', status: '1 ready' },
  { title: 'Phonics Play', status: '1 ready' },
  { title: 'Reading Practice', status: 'Coming soon' },
] as const;

const GAME_CARDS = [
  {
    title: 'Free Letter Tracing Game',
    description:
      'Children trace letters step by step with visual guides to build handwriting control and correct letter formation.',
    skills: ['Letter formation', 'Hand control', 'Stroke direction'],
    route: '/free-letter-tracing-game-for-kids',
    buttonLabel: 'Play Tracing Game',
    icon: '✍️',
  },
  {
    title: 'Letter Tracing With Sounds',
    description:
      'Children trace letters while listening to letter sounds, helping them connect writing practice with phonics.',
    skills: ['Letter sounds', 'Tracing', 'Phonics connection'],
    route: '/free-letter-tracing-with-sounds-game-for-kids',
    buttonLabel: 'Play Tracing With Sounds',
    icon: '🔊',
  },
  {
    title: 'Vocabulary Adventure Game',
    description:
      'Children practise word meanings through matching, context clues, synonyms, antonyms, and word recall challenges.',
    skills: ['Vocabulary', 'Word meaning', 'Context clues'],
    route: '/free-games/word-meaning-flashcards',
    buttonLabel: 'Play Vocabulary Adventure',
    icon: '📚',
  },
  {
    title: 'Balloon Pop Phonics Game',
    description:
      'Children listen, identify the correct letter sound, and pop the matching balloon to build sound recognition.',
    skills: ['Letter sounds', 'Listening', 'Sound matching'],
    route: '/free-balloon-pop-phonics-game-for-kids',
    buttonLabel: 'Play Balloon Pop',
    icon: '🎈',
  },
] as const;

const BENEFITS = [
  'Short practice sessions',
  'Child-friendly instructions',
  'Supports phonics and reading',
  'Works on desktop, tablet, and mobile',
] as const;

const FAQS = [
  {
    question: 'Are these games free?',
    answer: 'Yes. These learning games are free to play and can be used for short practice sessions at home.',
  },
  {
    question: 'What skills do these games help with?',
    answer:
      'They help children practise letter tracing, letter sounds, balloon pop listening, spelling, vocabulary, and early reading skills.',
  },
  {
    question: 'Do parents need to create an account?',
    answer: 'No. The free public games are accessible without a parent or child login.',
  },
  {
    question: 'Are these games a replacement for classes?',
    answer:
      'No. Free games support practice, while teacher-guided classes provide structured learning, correction, and progress tracking.',
  },
] as const;

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  '@id': `${PAGE_URL}#breadcrumb`,
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
    { '@type': 'ListItem', position: 2, name: 'Free Learning Games Mission', item: PAGE_URL },
  ],
};

export default function FreeGamesHubPage() {
  useEffect(() => {
    applySeo({
      title: 'Free Learning Games for Kids | Tracing, Phonics & Spelling Practice',
      description:
        'Play free learning games for kids from Tiny Steps. Practise letter tracing, phonics sounds, balloon pop, spelling, vocabulary, and early reading skills through interactive activities.',
      canonicalPath: PAGE_PATH,
      ogType: 'website',
      jsonLd: [breadcrumbSchema, createFAQPageSchema([...FAQS])],
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Meta
        title="Free Learning Games for Kids | Tracing, Phonics & Spelling Practice"
        description="Play free learning games for kids from Tiny Steps. Practise letter tracing, phonics sounds, balloon pop, spelling, vocabulary, and early reading skills through interactive activities."
        canonical={PAGE_URL}
      />

      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1f1147] to-[#2a0f3f] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(129,140,248,0.25),_transparent_40%),radial-gradient(circle_at_bottom_left,_rgba(251,191,36,0.18),_transparent_45%)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="rounded-3xl border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">Tiny Steps</p>
                <p className="text-sm font-bold text-white">KID WORKSPACE</p>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-4xl">Free Learning Games Mission</h1>
              <Link
                to="/book-demo"
                className="inline-flex w-fit rounded-full bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-900 hover:bg-amber-300"
              >
                Book Free Assessment
              </Link>
            </div>
            <p className="mt-4 max-w-3xl text-sm text-slate-200 sm:text-base">
              Practise tracing, sounds, spelling, and word meaning through simple, interactive games designed for early learners.
            </p>
            <a
              href="#free-games-list"
              className="mt-4 inline-flex rounded-full bg-white/90 px-5 py-2.5 text-sm font-bold text-slate-900 hover:bg-white"
            >
              Start Playing Free Games
            </a>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Tracks', value: '4' },
                { label: 'Games Ready', value: '4' },
                { label: 'Free Access', value: 'Yes' },
                { label: 'Practice Level', value: 'Beginner Friendly' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/20 bg-slate-900/55 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">{stat.label}</p>
                  <p className="mt-1 text-lg font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[0.32fr_0.68fr]">
              <aside className="rounded-2xl border border-white/20 bg-slate-950/55 p-4">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Training Tracks</h2>
                <div className="mt-3 space-y-2">
                  {TRACKS.map((track, idx) => (
                    <div key={track.title} className="rounded-xl border border-white/15 bg-white/5 p-3">
                      <p className="text-sm font-semibold text-white">{idx + 1}. {track.title}</p>
                      <p className="mt-1 text-xs text-slate-300">{track.status}</p>
                    </div>
                  ))}
                </div>
              </aside>

              <div id="free-games-list" className="grid gap-4 md:grid-cols-2">
                {GAME_CARDS.map((card) => (
                  <article key={card.title} className="rounded-2xl border border-indigo-300/25 bg-[#0d1333]/90 p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-400/20 text-lg">
                        {card.icon}
                      </span>
                      <span className="rounded-full border border-emerald-300/40 bg-emerald-400/20 px-2.5 py-1 text-[11px] font-bold text-emerald-100">
                        FREE
                      </span>
                    </div>
                    <h3 className="mt-4 text-xl font-bold text-white">{card.title}</h3>
                    <p className="mt-2 text-sm text-slate-300">{card.description}</p>
                    <ul className="mt-3 space-y-1 text-xs text-slate-300">
                      {card.skills.map((skill) => (
                        <li key={skill}>• {skill}</li>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Tap to open</p>
                    <Link
                      to={card.route}
                      className="mt-3 inline-flex rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-900 hover:bg-cyan-300"
                    >
                      {card.buttonLabel}
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold tracking-tight">What can children practise here?</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">
            Children can practise letter tracing, letter sounds, spelling, vocabulary, and early reading skills through free interactive games. These games are designed for short, focused practice and can be used with minimal parent support.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight">Why use Tiny Steps free games?</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((benefit) => (
            <article key={benefit} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">{benefit}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6 sm:pb-10 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight">Suggested Practice Path</h2>
        <ol className="mt-4 space-y-3 rounded-3xl border border-slate-200 bg-white p-6 text-sm leading-7 text-slate-700 sm:text-base">
          <li>1. Start with letter tracing.</li>
          <li>2. Practise tracing with sounds.</li>
          <li>3. Move to word meaning and vocabulary adventure practice.</li>
          <li>4. Book a free assessment if your child needs a structured learning plan.</li>
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6 sm:pb-10 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Want a structured plan for your child?</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">
            Free games are helpful for practice. A teacher-guided plan helps children build reading, grammar, sentence formation, and communication confidence step by step.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/book-demo" className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              Book Free Assessment
            </Link>
            <Link to="/courses" className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 hover:border-slate-400">
              Explore Courses
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold tracking-tight">Parent FAQ</h2>
          <div className="mt-5 space-y-4">
            {FAQS.map((faq) => (
              <article key={faq.question}>
                <h3 className="faq-question text-base font-semibold text-slate-900">{faq.question}</h3>
                <p className="faq-answer mt-2 text-sm leading-7 text-slate-700">{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
