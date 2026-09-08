import type { FC } from 'react';
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
    linkLabel: 'Explore phonics & reading',
    accent: 'from-sky-50 via-white to-blue-50',
    ring: 'group-hover:border-sky-300',
  },
  {
    eyebrow: 'Clearer sentences',
    title: 'Grammar & Writing',
    description:
      'Strengthen grammar, sentence formation, vocabulary, punctuation, and the move from stronger sentences into better writing.',
    to: '/resources/grammar',
    linkLabel: 'Explore grammar & writing',
    accent: 'from-emerald-50 via-white to-teal-50',
    ring: 'group-hover:border-emerald-300',
  },
  {
    eyebrow: 'Confident expression',
    title: 'Speaking & Communication',
    description:
      'Build fuller answers, organised ideas, storytelling, clear speaking, vocabulary, and age-appropriate public-speaking confidence.',
    to: '/resources/speaking',
    linkLabel: 'Explore speaking resources',
    accent: 'from-amber-50 via-white to-orange-50',
    ring: 'group-hover:border-amber-300',
  },
  {
    eyebrow: 'Start with the concern',
    title: 'Parent Help',
    description:
      'Start from the reading, learning, progress, or course-choice concern you are actually seeing at home and find the closest support path.',
    to: '/parents',
    linkLabel: 'Open Parent Help',
    accent: 'from-rose-50 via-white to-orange-50',
    ring: 'group-hover:border-rose-300',
  },
  {
    eyebrow: 'Practise interactively',
    title: 'Free Learning Activities',
    description:
      'Practise tracing, sounds, listening, word building, spelling, reading, grammar, sentences, and speaking through focused learning games.',
    to: '/free-english-games-for-kids',
    linkLabel: 'Explore free activities',
    accent: 'from-violet-50 via-white to-fuchsia-50',
    ring: 'group-hover:border-violet-300',
  },
  {
    eyebrow: 'For education teams',
    title: 'Schools & Educators',
    description:
      'Explore school phonics implementation, foundational-literacy guidance, teacher development, learning benchmarks, and partnership resources.',
    to: '/for-schools',
    linkLabel: 'Explore school resources',
    accent: 'from-indigo-50 via-white to-slate-50',
    ring: 'group-hover:border-indigo-300',
  },
] as const;

const ResourcesPage: FC = () => {
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
    <main className="min-h-[calc(100svh-5rem)] overflow-hidden bg-[radial-gradient(circle_at_8%_4%,rgba(14,165,233,0.08),transparent_28%),radial-gradient(circle_at_92%_10%,rgba(249,115,22,0.07),transparent_24%),linear-gradient(180deg,#fbfaf8_0%,#ffffff_54%,#f7f9fc_100%)] text-slate-950">
      <Meta
        title={title}
        description={description}
        canonical={canonicalUrl}
        jsonLd={[organizationSchema, websiteSchema, collectionPageSchema, breadcrumbSchema, itemListSchema]}
      />

      <section className="mx-auto flex w-full max-w-7xl flex-col px-5 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
        <KnowledgeBreadcrumbs items={breadcrumbItems} className="mb-3 text-xs sm:mb-4" />

        <header className="max-w-5xl">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500 sm:text-[11px]">
            Tiny Steps Resources
          </p>
          <h1 className="ts-answer-title mt-2 max-w-5xl text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-4xl lg:text-[2.8rem] lg:leading-[1.04]">
            English Learning Resources for Kids, Parents & Educators
          </h1>
          <div className="mt-3 flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
            <p className="ts-answer-summary max-w-3xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
              Choose the pathway that matches what you need and go directly to the right Tiny Steps guide, activity,
              parent support, or school resource.
            </p>
            <Link
              to="/blog"
              className="shrink-0 text-xs font-black text-slate-700 transition hover:text-slate-950 hover:underline sm:pb-1 sm:text-sm"
            >
              Browse all guides →
            </Link>
          </div>
        </header>

        <div id="resource-paths" className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-5">
          {RESOURCE_PATHWAYS.map((pathway) => (
            <Link
              key={pathway.title}
              to={pathway.to}
              className={`group flex min-h-[172px] flex-col rounded-[1.55rem] border border-slate-200/90 bg-gradient-to-br ${pathway.accent} p-5 shadow-[0_12px_34px_rgba(15,23,42,0.045)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,23,42,0.085)] ${pathway.ring}`}
            >
              <p className="text-[9px] font-black uppercase tracking-[0.23em] text-slate-500 sm:text-[10px]">
                {pathway.eyebrow}
              </p>
              <h2 className="mt-2 text-xl font-black tracking-[-0.02em] text-slate-950 sm:text-[1.35rem]">
                {pathway.title}
              </h2>
              <p className="mt-2 text-[13px] leading-[1.55rem] text-slate-600 sm:text-sm">
                {pathway.description}
              </p>
              <div className="mt-auto pt-3 text-[13px] font-black text-slate-900 sm:text-sm">
                <span>{pathway.linkLabel}</span>
                <span aria-hidden="true" className="ml-2 inline-block transition group-hover:translate-x-1">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
};

export default ResourcesPage;
