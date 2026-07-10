import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Meta from '../../components/common/Meta';
import { applySeo } from '../../lib/seo';
import { createFAQPageSchema } from '../../lib/schemas';
import KidsBalloonPop from '../KidsBalloonPop';

const PAGE_PATH = '/free-balloon-pop-phonics-game-for-kids';
const PAGE_URL = `https://tinystepslearning.com${PAGE_PATH}`;

const faqItems = [
  {
    question: 'Is this Balloon Pop phonics game free to use?',
    answer: 'Yes. This public phonics game is free to play without login.',
  },
  {
    question: 'Do we need a child account to play?',
    answer: 'No. Families can open this game directly and play in anonymous mode.',
  },
  {
    question: 'What does this game help with?',
    answer: 'It helps children practise listening to letter sounds and matching the correct sound quickly.',
  },
];

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  '@id': `${PAGE_URL}#breadcrumb`,
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
    { '@type': 'ListItem', position: 2, name: 'Free Balloon Pop Phonics Game for Kids', item: PAGE_URL },
  ],
};

export default function FreeBalloonPopGamePage() {
  useEffect(() => {
    applySeo({
      title: 'Free Balloon Pop Phonics Game for Kids | Tiny Steps',
      description:
        'Play a free balloon pop phonics game for kids. Children listen to letter sounds, choose the correct balloon, and build early phonics recognition through play.',
      canonicalPath: PAGE_PATH,
      ogType: 'website',
      jsonLd: [breadcrumbSchema, createFAQPageSchema(faqItems)],
    });
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-2 sm:px-6 lg:px-8">
      <Meta
        title="Free Balloon Pop Phonics Game for Kids | Tiny Steps"
        description="Play a free balloon pop phonics game for kids. Children listen to letter sounds, choose the correct balloon, and build early phonics recognition through play."
        canonical={PAGE_URL}
      />

      <div className="mb-3 flex justify-end">
        <Link
          to="/free-english-games-for-kids"
          className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:border-slate-400"
        >
          ← Back to Free Games
        </Link>
      </div>

      <header className="rounded-3xl border border-violet-100 bg-gradient-to-br from-white via-violet-50 to-sky-50 p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Free Balloon Pop Phonics Game for Kids</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700">
          Pop the balloons with the correct sounds and help your child practise phonics through a fun listening game.
        </p>
        <a
          href="#play"
          className="mt-5 inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Start Balloon Pop
        </a>
      </header>

      <section id="play" className="mt-5 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
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
    </div>
  );
}
