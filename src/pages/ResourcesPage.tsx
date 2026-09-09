import { useEffect, useState, type FC } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  BookOpenText,
  Gamepad2,
  HeartHandshake,
  MessagesSquare,
  PenLine,
  School,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Meta from '../components/common/Meta';
import KnowledgeBreadcrumbs from '../components/common/KnowledgeBreadcrumbs';
import { buildBreadcrumbListSchema, buildSpeakableSpecification, getBreadcrumbTrail } from '../lib/breadcrumbAeoGeoRegistry.js';
import { getRouteConfig } from '../lib/seo';
import {
  ORGANIZATION_ID,
  SITE_ORIGIN,
  WEBSITE_ID,
  organizationSchema,
  websiteSchema,
} from '../lib/schemas';

const RESOURCE_PATHWAYS = [
  {
    eyebrow: 'Reading foundations',
    title: 'Phonics & Reading',
    description:
      'Build from letter sounds and blending into decoding, CVC words, spelling patterns, and confident reading fluency.',
    to: '/resources/phonics',
    icon: BookOpenText,
    iconTone: 'border-sky-200/80 bg-sky-50 text-sky-700',
    accentLine: 'from-sky-400 via-cyan-400 to-blue-500',
    orb: 'bg-sky-200/[0.55]',
    hoverBorder: 'group-hover:border-sky-300/90',
    spotlight: 'rgba(14, 165, 233, 0.16)',
  },
  {
    eyebrow: 'Clearer sentences',
    title: 'Grammar & Writing',
    description:
      'Strengthen grammar, sentence formation, vocabulary, punctuation, and the move from stronger sentences into better writing.',
    to: '/resources/grammar',
    icon: PenLine,
    iconTone: 'border-emerald-200/80 bg-emerald-50 text-emerald-700',
    accentLine: 'from-emerald-400 via-teal-400 to-cyan-500',
    orb: 'bg-emerald-200/[0.55]',
    hoverBorder: 'group-hover:border-emerald-300/90',
    spotlight: 'rgba(16, 185, 129, 0.15)',
  },
  {
    eyebrow: 'Confident expression',
    title: 'Speaking & Communication',
    description:
      'Build fuller answers, organised ideas, storytelling, clear speaking, vocabulary, and age-appropriate public-speaking confidence.',
    to: '/resources/speaking',
    icon: MessagesSquare,
    iconTone: 'border-amber-200/80 bg-amber-50 text-amber-700',
    accentLine: 'from-amber-400 via-orange-400 to-rose-400',
    orb: 'bg-amber-200/[0.55]',
    hoverBorder: 'group-hover:border-amber-300/90',
    spotlight: 'rgba(245, 158, 11, 0.15)',
  },
  {
    eyebrow: 'Start with the concern',
    title: 'Parent Help',
    description:
      'Start from the reading, learning, progress, or course-choice concern you are actually seeing at home and find the closest support path.',
    to: '/parents',
    icon: HeartHandshake,
    iconTone: 'border-rose-200/80 bg-rose-50 text-rose-700',
    accentLine: 'from-rose-400 via-pink-400 to-orange-400',
    orb: 'bg-rose-200/[0.55]',
    hoverBorder: 'group-hover:border-rose-300/90',
    spotlight: 'rgba(244, 63, 94, 0.13)',
  },
  {
    eyebrow: 'Practise interactively',
    title: 'Free Learning Activities',
    description:
      'Practise tracing, sounds, listening, word building, spelling, reading, grammar, sentences, and speaking through focused learning games.',
    to: '/free-english-games-for-kids',
    icon: Gamepad2,
    iconTone: 'border-violet-200/80 bg-violet-50 text-violet-700',
    accentLine: 'from-violet-400 via-fuchsia-400 to-pink-400',
    orb: 'bg-violet-200/[0.55]',
    hoverBorder: 'group-hover:border-violet-300/90',
    spotlight: 'rgba(139, 92, 246, 0.14)',
  },
  {
    eyebrow: 'For education teams',
    title: 'Schools & Educators',
    description:
      'Explore school phonics implementation, foundational-literacy guidance, teacher development, learning benchmarks, and partnership resources.',
    to: '/for-schools',
    icon: School,
    iconTone: 'border-indigo-200/80 bg-indigo-50 text-indigo-700',
    accentLine: 'from-indigo-400 via-blue-400 to-slate-500',
    orb: 'bg-indigo-200/[0.55]',
    hoverBorder: 'group-hover:border-indigo-300/90',
    spotlight: 'rgba(99, 102, 241, 0.14)',
  },
] as const;

type ResourcePathway = (typeof RESOURCE_PATHWAYS)[number];

function usePrefersReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReduceMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener?.('change', updatePreference);
    return () => mediaQuery.removeEventListener?.('change', updatePreference);
  }, []);

  return reduceMotion;
}

function ResourcePathwayCard({
  pathway,
  reduceMotion,
}: {
  pathway: ResourcePathway;
  reduceMotion: boolean;
}) {
  const Icon = pathway.icon;

  return (
    <motion.div
      className="h-full"
      initial={false}
      whileHover={reduceMotion ? undefined : { y: -4 }}
      whileTap={reduceMotion ? undefined : { scale: 0.994 }}
      transition={{ type: 'spring', stiffness: 310, damping: 24, mass: 0.75 }}
    >
      <Link
        to={pathway.to}
        aria-label={`Open ${pathway.title}`}
        onPointerMove={(event) => {
          if (reduceMotion || event.pointerType === 'touch') return;
          const rect = event.currentTarget.getBoundingClientRect();
          event.currentTarget.style.setProperty('--spotlight-x', `${event.clientX - rect.left}px`);
          event.currentTarget.style.setProperty('--spotlight-y', `${event.clientY - rect.top}px`);
        }}
        className={`group relative isolate flex h-full min-h-[140px] overflow-hidden rounded-[1.35rem] border border-slate-200/90 bg-white/[0.92] px-[17px] py-[14px] shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition-[border-color,box-shadow,background-color] duration-300 hover:bg-white hover:shadow-[0_16px_38px_rgba(15,23,42,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 ${pathway.hoverBorder}`}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(300px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), ${pathway.spotlight}, transparent 58%)`,
          }}
        />
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute -right-10 -top-12 z-0 h-28 w-28 rounded-full blur-3xl transition-transform duration-500 group-hover:scale-125 ${pathway.orb}`}
        />
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-[17px] top-0 z-10 h-[3px] origin-left rounded-b-full bg-gradient-to-r ${pathway.accentLine} transition-transform duration-300 group-hover:scale-x-100 md:scale-x-[0.72]`}
        />

        <div className="relative z-10 flex w-full flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border shadow-[0_4px_12px_rgba(15,23,42,0.045)] transition duration-300 group-hover:-rotate-2 group-hover:scale-105 ${pathway.iconTone}`}
              >
                <Icon aria-hidden="true" className="h-[17px] w-[17px]" strokeWidth={2.05} />
              </span>
              <p className="text-[9px] font-black uppercase tracking-[0.21em] text-slate-500 sm:text-[9.5px]">
                {pathway.eyebrow}
              </p>
            </div>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-slate-200 bg-white/80 text-slate-500 shadow-sm transition duration-300 group-hover:border-slate-300 group-hover:bg-slate-950 group-hover:text-white">
              <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </div>

          <h2 className="mt-2 text-[1.2rem] font-black tracking-[-0.025em] text-slate-950 sm:text-[1.25rem]">
            {pathway.title}
          </h2>
          <p className="mt-0.5 max-w-[40rem] text-[12.5px] leading-[1.24rem] text-slate-600 sm:text-[13px]">
            {pathway.description}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

const ResourcesPage: FC = () => {
  const reduceMotion = usePrefersReducedMotion();
  const seo = getRouteConfig('/resources');
  const title = seo?.title ?? 'English Learning Resources for Kids, Parents & Educators | Tiny Steps';
  const description =
    seo?.description ??
    'Explore Tiny Steps phonics and reading, grammar and writing, speaking and communication guides, parent help, free learning activities, and school resources.';
  const canonicalPath = seo?.canonicalPath ?? '/resources';
  const canonicalUrl = `${SITE_ORIGIN}${canonicalPath}`;

  const breadcrumbItems = getBreadcrumbTrail({ pathname: canonicalPath, title: 'Resources' });
  const breadcrumbSchema = buildBreadcrumbListSchema(breadcrumbItems, SITE_ORIGIN);

  const pathwayListId = `${canonicalUrl}#resource-pathways`;
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': pathwayListId,
    name: 'Tiny Steps English learning resource pathways',
    numberOfItems: RESOURCE_PATHWAYS.length,
    itemListElement: RESOURCE_PATHWAYS.map((pathway, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: pathway.title,
      url: new URL(pathway.to, SITE_ORIGIN).toString(),
    })),
  };

  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: title,
    description,
    inLanguage: 'en-IN',
    isPartOf: { '@id': WEBSITE_ID },
    publisher: { '@id': ORGANIZATION_ID },
    mainEntity: { '@id': pathwayListId },
    breadcrumb: { '@id': breadcrumbSchema['@id'] },
    speakable: buildSpeakableSpecification(['.ts-answer-title', '.ts-answer-summary']),
  };

  return (
    <main className="relative min-h-[calc(100svh-5rem)] overflow-hidden bg-[radial-gradient(circle_at_8%_4%,rgba(14,165,233,0.075),transparent_26%),radial-gradient(circle_at_92%_8%,rgba(249,115,22,0.065),transparent_23%),linear-gradient(180deg,#fbfaf8_0%,#ffffff_50%,#f6f8fb_100%)] text-slate-950">
      <Meta
        title={title}
        description={description}
        canonical={canonicalUrl}
        jsonLd={[organizationSchema, websiteSchema, collectionPageSchema, breadcrumbSchema, itemListSchema]}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-44 w-[64rem] -translate-x-1/2 rounded-full bg-white/[0.65] blur-3xl"
      />

      <section className="relative mx-auto flex w-full max-w-[1320px] flex-col px-5 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-5">
        <KnowledgeBreadcrumbs items={breadcrumbItems} className="mb-2 text-xs" />

        <header className="w-full">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500 sm:text-[11px]">
              Tiny Steps Resources
            </p>

            <Link
              to="/blog"
              className="group inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white/[0.85] px-4 py-2 text-xs font-black text-slate-700 shadow-sm transition duration-200 hover:border-slate-300 hover:bg-white hover:text-slate-950 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 sm:text-[13px]"
            >
              Browse all guides
              <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>

          <h1 className="ts-answer-title mt-1.5 max-w-none text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl lg:text-[2.7rem] lg:leading-[1.03] xl:whitespace-nowrap">
            English Learning Resources for Kids, Parents & Educators
          </h1>

          <p className="ts-answer-summary mt-2 max-w-none text-sm leading-6 text-slate-600 sm:text-[15px] sm:leading-6 xl:whitespace-nowrap">
            Choose the pathway that matches what you need and go directly to the right Tiny Steps guide, activity, parent support, or school resource.
          </p>
        </header>

        <div id="resource-paths" className="mx-auto mt-5 grid w-full max-w-[1240px] gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {RESOURCE_PATHWAYS.map((pathway) => (
            <ResourcePathwayCard key={pathway.title} pathway={pathway} reduceMotion={reduceMotion} />
          ))}
        </div>
      </section>
    </main>
  );
};

export default ResourcesPage;
