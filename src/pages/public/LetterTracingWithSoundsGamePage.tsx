import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Meta from '../../components/common/Meta';
import LetterTracingWithSounds from '../kids/games/phonics/LetterTracingWithSounds';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema } from '../../lib/schemas';

const PAGE_PATH = '/letter-tracing-with-sounds-game';
const PAGE_URL = `https://tinystepslearning.com${PAGE_PATH}`;

const faqItems = [
  {
    question: 'How does tracing with sounds help children?',
    answer: 'Tracing with sounds helps children connect letter formation with phonics sounds, which supports both writing and reading readiness.'
  },
  {
    question: 'Can we play this tracing with sounds game for free?',
    answer: 'Yes. This page is publicly accessible and can be played in your browser without login.'
  },
  {
    question: 'Should my child finish pre-writing shapes first?',
    answer: 'Yes. Starting with lines and curves improves control before your child moves into full letter tracing.'
  },
  {
    question: 'What is a good practice routine for this game?',
    answer: 'Use short daily sessions, guide your child to trace slowly, and encourage them to repeat each sound after tracing.'
  }
];

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  '@id': `${PAGE_URL}#breadcrumb`,
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
    { '@type': 'ListItem', position: 2, name: 'Letter Tracing With Sounds Game', item: PAGE_URL },
  ],
};

const appSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  '@id': `${PAGE_URL}#webapp`,
  name: 'Letter Tracing With Sounds Game',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Any',
  url: PAGE_URL,
  description:
    'Online phonics tracing game where children trace letters and connect each letter with its sound through guided practice.',
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

export default function LetterTracingWithSoundsGamePage() {
  useEffect(() => {
    applySeo({
      title: 'Letter Tracing With Sounds Game for Kids | Phonics Practice',
      description:
        'Help your child trace letters and connect each letter with its sound through a simple online phonics tracing game for kids.',
      canonicalPath: PAGE_PATH,
      ogType: 'website',
      jsonLd: [appSchema, breadcrumbSchema, createFAQPageSchema(faqItems)],
    });
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-2 sm:px-6 lg:px-8">
      <Meta
        title="Letter Tracing With Sounds Game for Kids | Phonics Practice"
        description="Help your child trace letters and connect each letter with its sound through a simple online phonics tracing game for kids."
        canonical={PAGE_URL}
      />

      <header className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50 to-sky-50 p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Letter Tracing With Sounds Game</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700">
          Build letter formation and sound awareness together. Children trace each letter, hear its sound, and reinforce phonics through repeatable practice.
        </p>
        <Link
          to={`${PAGE_PATH}?level=0&pair=0&step=0&fs=1#play`}
          className="mt-5 inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Start Tracing With Sounds
        </Link>
      </header>

      <section id="play" className="mt-5 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
        <LetterTracingWithSounds
          baseRoute={PAGE_PATH}
          missionReturnHrefOverride="/phonics-learning-games"
          showMissionBackButton={false}
          showProgressControls={false}
          forceAnonymousMode
          anonymousProgressStorageKey="__public_letter_tracing_sounds_free__"
        />
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-bold text-slate-900">What your child practises</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>• Pre-writing patterns and control</li>
            <li>• Capital and small letter formation</li>
            <li>• Letter-sound recognition and recall</li>
            <li>• Listening and repeating sounds during tracing</li>
          </ul>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-bold text-slate-900">How to use this game</h2>
          <ol className="mt-3 space-y-2 text-sm text-slate-700">
            <li>1. Begin with the warm-up lines and curves.</li>
            <li>2. Ask your child to start from the red dot and trace slowly.</li>
            <li>3. Encourage repeating each sound after tracing.</li>
          </ol>
        </article>
      </section>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-bold text-slate-900">Why tracing helps early writing</h2>
        <p className="mt-3 text-sm leading-7 text-slate-700">
          Tracing helps children build writing rhythm, directional control, and hand stability. Adding sounds strengthens the phonics connection, so letter writing and letter reading grow together.
        </p>
      </section>

      <section className="mt-4 grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
          <h2 className="text-xl font-bold text-slate-900">Link to Tiny Steps phonics classes</h2>
          <p className="mt-2 text-sm text-slate-700">
            Want teacher-guided phonics support along with home practice?
          </p>
          <Link to="/phonics" className="mt-3 inline-flex text-sm font-semibold text-emerald-800 underline underline-offset-4">
            Explore Tiny Steps phonics classes
          </Link>
        </article>
        <article className="rounded-2xl border border-sky-200 bg-sky-50/50 p-5">
          <h2 className="text-xl font-bold text-slate-900">Link to other free learning games</h2>
          <div className="mt-2 flex flex-col gap-2 text-sm">
            <Link to="/free-letter-tracing-game-for-kids" className="font-semibold text-sky-900 underline underline-offset-4">
              Free Letter Tracing Game for Kids
            </Link>
            <Link to="/phonics-learning-games" className="font-semibold text-sky-900 underline underline-offset-4">
              More Tiny Steps learning games
            </Link>
          </div>
        </article>
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
