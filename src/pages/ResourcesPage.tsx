import type { FC } from 'react';
import { Link } from 'react-router-dom';
import Meta from '../components/common/Meta';
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
      'Build from listening and letter sounds into blending, decoding, CVC words, spelling patterns, and reading fluency.',
    to: '/resources/phonics',
    linkLabel: 'Explore phonics & reading',
    chips: ['Sounds', 'Blending', 'CVC', 'Fluency'],
    accent: 'from-sky-50 via-white to-blue-50',
    ring: 'group-hover:border-sky-300',
  },
  {
    eyebrow: 'Clearer sentences',
    title: 'Grammar & Writing',
    description:
      'Strengthen sentence formation, grammar accuracy, vocabulary, punctuation, and the move from sentences into better writing.',
    to: '/resources/grammar',
    linkLabel: 'Explore grammar & writing',
    chips: ['Grammar', 'Sentences', 'Vocabulary', 'Writing'],
    accent: 'from-emerald-50 via-white to-teal-50',
    ring: 'group-hover:border-emerald-300',
  },
  {
    eyebrow: 'Confident expression',
    title: 'Speaking & Communication',
    description:
      'Help children answer in fuller sentences, organise ideas, tell stories, speak clearly, and build public-speaking confidence.',
    to: '/resources/speaking',
    linkLabel: 'Explore speaking resources',
    chips: ['Confidence', 'Storytelling', 'Vocabulary', 'Speaking'],
    accent: 'from-amber-50 via-white to-orange-50',
    ring: 'group-hover:border-amber-300',
  },
  {
    eyebrow: 'Start with the concern',
    title: 'Parent Help',
    description:
      'Choose a path from the learning problem you are actually seeing at home instead of trying random worksheets or activities.',
    to: '/parents',
    linkLabel: 'Open the Parents Hub',
    chips: ['Reading gaps', 'Course choice', 'Home support', 'Progress'],
    accent: 'from-rose-50 via-white to-orange-50',
    ring: 'group-hover:border-rose-300',
  },
  {
    eyebrow: 'Practise interactively',
    title: 'Free Learning Activities',
    description:
      'Use Tiny Steps games for tracing, sounds, listening, word building, spelling, reading, grammar, sentences, and speaking practice.',
    to: '/free-english-games-for-kids',
    linkLabel: 'Explore free activities',
    chips: ['Tracing', 'Sounds', 'Words', 'Reading'],
    accent: 'from-violet-50 via-white to-fuchsia-50',
    ring: 'group-hover:border-violet-300',
  },
  {
    eyebrow: 'For education teams',
    title: 'Schools & Educators',
    description:
      'Explore foundational-literacy guidance, school phonics implementation, teacher-development context, benchmarks, and partnership resources.',
    to: '/for-schools',
    linkLabel: 'Explore school resources',
    chips: ['Phonics', 'Teachers', 'Benchmarks', 'Schools'],
    accent: 'from-indigo-50 via-white to-slate-50',
    ring: 'group-hover:border-indigo-300',
  },
] as const;

const RESOURCE_FLOW = [
  {
    number: '01',
    title: 'Learn',
    description: 'Use a guide to understand the skill, progression, or learning problem clearly.',
    to: '/blog',
    label: 'Browse all guides',
  },
  {
    number: '02',
    title: 'Practise',
    description: 'Move from explanation into a focused game or activity when practice is the useful next step.',
    to: '/free-english-games-for-kids',
    label: 'Open free activities',
  },
  {
    number: '03',
    title: 'Get the right next step',
    description: 'If the child is still stuck, use the Parents Hub to identify the closest concern and support path.',
    to: '/parents',
    label: 'Use Parent Help',
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

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${SITE_ORIGIN}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Resources',
        item: canonicalUrl,
      },
    ],
  };

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
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f3ec_0%,#fbfaf8_18%,#ffffff_48%,#f4f7fb_100%)] text-slate-950">
      <Meta
        title={title}
        description={description}
        canonical={canonicalUrl}
        jsonLd={[organizationSchema, websiteSchema, collectionPageSchema, breadcrumbSchema, itemListSchema]}
      />

      <section className="relative overflow-hidden border-b border-slate-800 bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(56,189,248,0.17),transparent_34%),radial-gradient(circle_at_82%_20%,rgba(251,191,36,0.14),transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_48%,#172554_100%)]" />
        <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-16 sm:pb-20 sm:pt-20 lg:pb-24 lg:pt-24">
          <div className="max-w-4xl">
            <span className="inline-flex rounded-full border border-white/15 bg-white/8 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.26em] text-sky-100 backdrop-blur">
              Tiny Steps Resources
            </span>
            <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-[-0.035em] text-white sm:text-5xl lg:text-[4.25rem] lg:leading-[1.02]">
              English Learning Resources for Kids, Parents & Educators
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200 sm:text-xl">
              Start with the subject, problem, or type of practice you need. Tiny Steps Resources brings together
              our learning guides, parent support, interactive activities, and school resources without making you
              search through one long article feed.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#resource-paths"
                className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
              >
                Choose a resource path
              </a>
              <Link
                to="/blog"
                className="inline-flex items-center rounded-full border border-white/20 bg-white/8 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/14"
              >
                Browse all guides
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="resource-paths" className="mx-auto max-w-7xl px-6 py-14 sm:py-16 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Choose where to start</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.025em] text-slate-950 sm:text-4xl">
            One resource gateway. Six clear pathways.
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-600 sm:text-lg">
            Each pathway keeps its own job. Guides explain, games help children practise, Parent Help starts from a
            concern, and school resources remain separate from the family learning journey.
          </p>
        </div>

        <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {RESOURCE_PATHWAYS.map((pathway) => (
            <Link
              key={pathway.title}
              to={pathway.to}
              className={`group flex min-h-[310px] flex-col rounded-[2rem] border border-slate-200 bg-gradient-to-br ${pathway.accent} p-6 shadow-[0_18px_50px_rgba(15,23,42,0.055)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_26px_65px_rgba(15,23,42,0.10)] ${pathway.ring}`}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">{pathway.eyebrow}</p>
              <h3 className="mt-4 text-2xl font-black tracking-[-0.02em] text-slate-950">{pathway.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{pathway.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {pathway.chips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-slate-200/90 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-600"
                  >
                    {chip}
                  </span>
                ))}
              </div>
              <div className="mt-auto pt-7 text-sm font-black text-slate-900">
                <span>{pathway.linkLabel}</span>
                <span aria-hidden="true" className="ml-2 inline-block transition group-hover:translate-x-1">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white/80">
        <div className="mx-auto max-w-7xl px-6 py-14 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[330px_minmax(0,1fr)] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">How the library works</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.025em] text-slate-950">
                Learn → practise → choose the next step
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Resources should reduce confusion, not create another content maze. Use only the next layer that is
                useful for your child, classroom, or school.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {RESOURCE_FLOW.map((step) => (
                <article key={step.number} className="rounded-[1.7rem] border border-slate-200 bg-slate-50/75 p-5">
                  <p className="text-xs font-black tracking-[0.2em] text-slate-400">{step.number}</p>
                  <h3 className="mt-4 text-xl font-black text-slate-950">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{step.description}</p>
                  <Link to={step.to} className="mt-5 inline-flex text-sm font-bold text-slate-900 hover:underline">
                    {step.label} →
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14 sm:py-16">
        <div className="rounded-[2.2rem] border border-slate-200 bg-slate-950 p-7 text-white shadow-[0_28px_70px_rgba(15,23,42,0.14)] sm:p-9 lg:flex lg:items-center lg:justify-between lg:gap-10">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-200">Looking for classes instead?</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Keep learning resources and programme decisions separate.
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
              If you are comparing live Tiny Steps programmes rather than looking for a free guide or activity, use
              the Courses page. If you are unsure where your child should begin, the assessment is there when it is
              genuinely useful.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 lg:mt-0 lg:justify-end">
            <Link
              to="/courses"
              className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
            >
              Explore Courses
            </Link>
            <Link
              to="/book-demo"
              className="inline-flex rounded-full border border-white/20 bg-white/8 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/14"
            >
              Check My Child’s Level
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ResourcesPage;
