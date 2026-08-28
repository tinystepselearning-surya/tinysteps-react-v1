import { startTransition, useDeferredValue, useEffect, useMemo, useState, type FC } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { blogPosts } from '../../content/blog';
import { getBlogAudience, getBlogDiscoveryCategory } from '../../content/blog/shared/audience';
import { buildBlogAuthorSchema, resolveBlogAuthor } from '../../content/blog/shared/editorialTrust';
import { resolveBlogHero } from '../../content/blog/shared/heroFamilies';
import type { BlogDiscoveryCategory, BlogPost } from '../../content/blog/types';
import { fetchMdxPosts, type MdxMeta } from '../../content/blogMdx';
import Meta from '../../components/common/Meta';
import NewsletterForm from '../../components/common/NewsletterForm';
import { formatBlogDate, isoDateFromYMD } from '../../lib/date';
import { applySeo } from '../../lib/seo';
import { ORGANIZATION_ID, PUBLIC_FACTS, SITE_ORIGIN } from '../../lib/schemas';
import {
  BLOG_TOPIC_OPTIONS,
  PARENT_GOAL_ROUTES,
  filterBlogIndexPosts,
  getAuthorityPosts,
  getBlogCardLabel,
  getBlogDiscoveryTopic,
  getLibraryCountLabel,
  getBlogTopicCounts,
  getPublishedCountLabel,
  isParentFacingBlogPost,
  isPublishedBlogPost,
  sortBlogIndexPostsNewest,
  type BlogIndexItem,
  type BlogTopic,
} from './blogIndexUx';

const TEAM_AUTHOR_LABEL = 'Tiny Steps Academic Team';
const INITIAL_LIBRARY_COUNT = 9;

const BLOG_META_KEYWORDS = [
  'phonics for parents',
  'phonics blog for kids',
  'grammar help for children',
  'public speaking for kids blog',
  'english classes for kids parent guide',
  'SATPIN phonics guide',
  'reading help at home for kids',
  'online english learning blog for parents',
];

const BLOG_FAQS = [
  {
    question: 'Which Tiny Steps blog should I start with if my child is struggling with reading?',
    answer:
      'Start with the guide that matches the exact blocker: ABC knowledge without reading, letter sounds without blending, or the broader phonics parent guide if you are not sure where the gap sits.',
  },
  {
    question: 'Does the blog cover grammar and speaking as well as phonics?',
    answer:
      'Yes. The Parent library includes phonics, grammar, speaking, English communication, and practical parent guidance. School leaders can switch to the Schools & Research filter.',
  },
  {
    question: 'Are these guides only for parents in India?',
    answer:
      'No. The guidance is written for families globally, while many examples are also useful for multilingual homes and English-medium school contexts in India.',
  },
  {
    question: 'How do I find a specific answer without scrolling through the whole archive?',
    answer:
      'Use the search box with the words you would naturally use as a parent, choose the most relevant topic, and load more articles only when you want to go deeper.',
  },
];

const SOURCE_CATEGORIES: BlogPost['category'][] = [
  'Phonics',
  'Grammar',
  'Public Speaking',
  'English Communication',
  'Parent Tips',
  'Research',
];

const DISCOVERY_STYLES: Record<BlogDiscoveryCategory, { chip: string; wash: string }> = {
  Phonics: {
    chip: 'bg-sky-100 text-sky-800',
    wash: 'from-sky-50 to-blue-100',
  },
  Grammar: {
    chip: 'bg-emerald-100 text-emerald-800',
    wash: 'from-emerald-50 to-teal-100',
  },
  'Speaking & Communication': {
    chip: 'bg-amber-100 text-amber-800',
    wash: 'from-amber-50 to-orange-100',
  },
  'Parent Guides': {
    chip: 'bg-rose-100 text-rose-800',
    wash: 'from-rose-50 to-orange-100',
  },
  'Schools & Research': {
    chip: 'bg-violet-100 text-violet-800',
    wash: 'from-violet-50 to-indigo-100',
  },
};

const TOPIC_LABELS: Record<BlogTopic, string> = {
  Parent: 'Parent library',
  Phonics: 'Phonics',
  Grammar: 'Grammar',
  'Speaking & Communication': 'Speaking',
  'Parent Guides': 'Parent guides',
  'Schools & Research': 'Schools & research',
  All: 'All articles',
};

function normalizeCategory(value: unknown): BlogPost['category'] {
  const candidate = String(value ?? '').trim() as BlogPost['category'];
  return SOURCE_CATEGORIES.includes(candidate) ? candidate : 'Parent Tips';
}

function toIndexItem(meta: MdxMeta): BlogIndexItem {
  const category = normalizeCategory(meta.category);
  const identity = { slug: meta.slug, category };

  return {
    slug: meta.slug,
    title: meta.title || meta.slug,
    category,
    author: meta.author || TEAM_AUTHOR_LABEL,
    date: meta.date || new Date().toISOString().slice(0, 10),
    readTime: meta.readTime || '5 min read',
    hero: meta.hero,
    excerpt: meta.excerpt || '',
    audience: getBlogAudience(identity),
    discoveryCategory: getBlogDiscoveryCategory(identity),
  };
}

function toDisplayAuthor(post: BlogIndexItem): string {
  const author = resolveBlogAuthor(post.author, post.category);
  if (author.key === 'founder') return author.name;
  return `${PUBLIC_FACTS.brandName} ${author.role}`;
}

function readTopicParam(value: string | null): BlogTopic {
  if (!value) return 'Parent';
  return BLOG_TOPIC_OPTIONS.includes(value as BlogTopic) ? (value as BlogTopic) : 'Parent';
}

function slugHash(slug: string): number {
  return [...slug].reduce((total, character) => total + character.charCodeAt(0), 0);
}

function getImagePosition(slug: string): string {
  const positions = ['object-center', 'object-[44%_center]', 'object-[56%_center]'] as const;
  return positions[slugHash(slug) % positions.length];
}

function getSchoolVisualLabel(title: string): string {
  const normalized = title.toLowerCase();
  if (normalized.includes('teacher training')) return 'Teacher training';
  if (normalized.includes('assess') || normalized.includes('assessment')) return 'Assessment';
  if (normalized.includes('benchmark')) return 'Benchmarks';
  if (normalized.includes('scope') || normalized.includes('sequence')) return 'Scope & sequence';
  if (normalized.includes('cbse') || normalized.includes('ncf')) return 'Curriculum';
  if (normalized.includes('systematic') || normalized.includes('cumulative')) return 'Systematic phonics';
  if (normalized.includes('letter sounds') || normalized.includes('decoding')) return 'Decoding';
  return 'Research brief';
}

const ArticleImage: FC<{ post: BlogIndexItem; eager?: boolean }> = ({ post, eager = false }) => {
  const topic = getBlogDiscoveryTopic(post);
  const style = DISCOVERY_STYLES[topic];
  const resolvedHero = resolveBlogHero(post);
  const useSchoolResearchTile = topic === 'Schools & Research' && resolvedHero === '/blog/hero-research.jpg';
  const hero = post.category === 'Research' && topic === 'Phonics' && resolvedHero === post.hero
    ? '/blog/hero-phonics.jpg'
    : resolvedHero;

  if (useSchoolResearchTile) {
    return (
      <div aria-hidden="true" className={`aspect-[16/9] bg-gradient-to-br ${style.wash} p-5 sm:p-6`}>
        <div className="flex h-full flex-col justify-between rounded-[1.2rem] border border-white/80 bg-white/55 p-4 backdrop-blur-sm">
          <span className="w-fit rounded-full border border-violet-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-700">
            Schools & Research
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Tiny Steps brief</p>
            <p className="mt-2 text-xl font-black tracking-tight text-slate-900">{getSchoolVisualLabel(post.title)}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hero) {
    return <div aria-hidden="true" className={`aspect-[16/9] w-full bg-gradient-to-br ${style.wash}`} />;
  }

  return (
    <div className="aspect-[16/9] overflow-hidden bg-slate-100">
      <img
        src={hero}
        alt=""
        width={720}
        height={405}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        className={`h-full w-full object-cover ${getImagePosition(post.slug)} transition duration-300 group-hover:scale-[1.02] motion-reduce:transform-none`}
      />
    </div>
  );
};

const BlogIndexPage: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('search') ?? '');
  const [topic, setTopic] = useState<BlogTopic>(() => readTopicParam(searchParams.get('topic')));
  const [visibleCount, setVisibleCount] = useState(INITIAL_LIBRARY_COUNT);
  const [mdxPosts, setMdxPosts] = useState<MdxMeta[]>([]);
  const deferredQuery = useDeferredValue(query.trim());

  useEffect(() => {
    fetchMdxPosts().then(setMdxPosts).catch(() => setMdxPosts([]));
  }, []);

  useEffect(() => {
    setQuery(searchParams.get('search') ?? '');
    setTopic(readTopicParam(searchParams.get('topic')));
  }, [searchParams]);

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams);
    const cleanQuery = query.trim();

    if (cleanQuery) nextParams.set('search', cleanQuery);
    else nextParams.delete('search');

    if (topic !== 'Parent') nextParams.set('topic', topic);
    else nextParams.delete('topic');

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [query, searchParams, setSearchParams, topic]);

  useEffect(() => {
    setVisibleCount(INITIAL_LIBRARY_COUNT);
  }, [deferredQuery, topic]);

  const allPosts = useMemo<BlogIndexItem[]>(() => {
    const combined = [...mdxPosts.map(toIndexItem), ...blogPosts];
    const bySlug = new Map<string, BlogIndexItem>();
    for (const post of combined) {
      if (!bySlug.has(post.slug)) bySlug.set(post.slug, post);
    }
    return [...bySlug.values()];
  }, [mdxPosts]);

  const todayIso = new Date().toISOString().slice(0, 10);
  const publishedPosts = useMemo(
    () => allPosts.filter((post) => isPublishedBlogPost(post, todayIso)),
    [allPosts, todayIso],
  );
  const sortedPublishedPosts = useMemo(() => sortBlogIndexPostsNewest(publishedPosts), [publishedPosts]);
  const parentCount = useMemo(
    () => sortedPublishedPosts.filter((post) => isParentFacingBlogPost(post)).length,
    [sortedPublishedPosts],
  );
  const topicCounts = useMemo(() => getBlogTopicCounts(sortedPublishedPosts), [sortedPublishedPosts]);
  const filteredPosts = useMemo(
    () => sortBlogIndexPostsNewest(filterBlogIndexPosts(sortedPublishedPosts, topic, deferredQuery)),
    [deferredQuery, sortedPublishedPosts, topic],
  );
  const authorityPosts = useMemo(() => getAuthorityPosts(sortedPublishedPosts), [sortedPublishedPosts]);
  const defaultParentView = !deferredQuery && topic === 'Parent';
  const authoritySlugs = useMemo(() => new Set(authorityPosts.map((post) => post.slug)), [authorityPosts]);
  const libraryPosts = useMemo(
    () => (defaultParentView ? filteredPosts.filter((post) => !authoritySlugs.has(post.slug)) : filteredPosts),
    [authoritySlugs, defaultParentView, filteredPosts],
  );
  const visiblePosts = libraryPosts.slice(0, visibleCount);
  const canLoadMore = visiblePosts.length < libraryPosts.length;
  const libraryCountLabel = getLibraryCountLabel(libraryPosts.length, defaultParentView);
  const schoolsCount = topicCounts.get('Schools & Research') ?? 0;

  const blogSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Tiny Steps Parent Desk',
      description:
        'Parent-friendly blog for phonics, grammar, speaking, English communication, home routines, and education research.',
      publisher: { '@id': ORGANIZATION_ID },
      blogPost: sortedPublishedPosts.map((post) => ({
        '@type': 'BlogPosting',
        headline: post.title,
        datePublished: isoDateFromYMD(post.date),
        ...(post.modifiedDate ? { dateModified: isoDateFromYMD(post.modifiedDate) } : {}),
        articleSection: post.discoveryCategory || post.category,
        image: post.hero
          ? String(post.hero).startsWith('http')
            ? post.hero
            : `${SITE_ORIGIN}${post.hero}`
          : `${SITE_ORIGIN}/logo-square.webp`,
        author: buildBlogAuthorSchema(resolveBlogAuthor(post.author, post.category)),
        publisher: { '@id': ORGANIZATION_ID },
        url: `${SITE_ORIGIN}/blog/${post.slug}`,
      })),
    }),
    [sortedPublishedPosts],
  );

  const collectionSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Tiny Steps Blog',
      description:
        'Search and browse phonics, grammar, speaking, communication, parent guidance, and research articles.',
      url: `${SITE_ORIGIN}/blog`,
      audience: {
        '@type': 'Audience',
        audienceType: 'Parents, caregivers, educators, and school leaders',
      },
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: sortedPublishedPosts.slice(0, 24).map((post, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: `${SITE_ORIGIN}/blog/${post.slug}`,
          name: post.title,
        })),
      },
    }),
    [sortedPublishedPosts],
  );

  const faqSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${SITE_ORIGIN}/blog#faqpage`,
      mainEntity: BLOG_FAQS.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    }),
    [],
  );

  const breadcrumbSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_ORIGIN}/blog` },
      ],
    }),
    [],
  );

  const metaTitle = 'Tiny Steps Blog | Phonics, Grammar, Speaking & English Help for Parents';
  const metaDescription =
    'Browse parent-friendly phonics, grammar, speaking, and English-learning guides for kids ages 3-12, plus practical routines and education research.';

  useEffect(() => {
    applySeo({
      title: metaTitle,
      description: metaDescription,
      keywords: BLOG_META_KEYWORDS,
      canonicalPath: '/blog',
      ogType: 'website',
      jsonLd: [breadcrumbSchema, blogSchema, collectionSchema, faqSchema],
    });
  }, [blogSchema, breadcrumbSchema, collectionSchema, faqSchema]);

  const clearFilters = () => {
    startTransition(() => {
      setQuery('');
      setTopic('Parent');
    });
  };

  const libraryHeading = deferredQuery
    ? 'Your matching articles'
    : topic === 'Parent'
      ? 'Browse the parent library'
      : topic === 'Schools & Research'
        ? 'Schools & research'
        : topic === 'All'
          ? 'Browse all articles'
          : `Browse ${TOPIC_LABELS[topic].toLowerCase()}`;

  return (
    <div className="min-h-screen bg-[#fbfaf7] pb-20 text-slate-950 sm:pb-24 lg:pb-8">
      <Meta
        title={metaTitle}
        description={metaDescription}
        keywords={BLOG_META_KEYWORDS.join(', ')}
        canonical={`${SITE_ORIGIN}/blog`}
        jsonLd={[breadcrumbSchema, blogSchema, collectionSchema, faqSchema]}
      />

      <section className="relative overflow-hidden border-b border-slate-200 bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(56,189,248,0.16),transparent_28%),radial-gradient(circle_at_82%_20%,rgba(251,191,36,0.14),transparent_24%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-200">Tiny Steps Parent Desk</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl lg:leading-[1.04]">
                Find the right English-learning answer without searching through a long feed
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
                Start with your child&apos;s exact reading, grammar, writing, or speaking blocker. Search the library only when you need to go deeper.
              </p>
              <div className="mt-7 flex flex-wrap gap-2 text-sm text-slate-200">
                <span className="rounded-full border border-white/15 bg-white/5 px-3.5 py-2">
                  {getPublishedCountLabel(sortedPublishedPosts.length)}
                </span>
                <span className="rounded-full border border-white/15 bg-white/5 px-3.5 py-2">Ages 3-12</span>
                <span className="rounded-full border border-white/15 bg-white/5 px-3.5 py-2">Parent-friendly, practical guidance</span>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">Need structured support?</p>
              <p className="mt-3 text-lg font-semibold leading-7">Move from reading the answer to choosing the next step.</p>
              <div className="mt-5 grid gap-2">
                <Link
                  to="/parents"
                  className="rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                >
                  Explore the Parents Hub
                </Link>
                <Link
                  to="/book-demo"
                  className="rounded-xl border border-white/20 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                >
                  Book a Free Demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <section aria-labelledby="start-here-heading">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-700">Start with the problem</p>
              <h2 id="start-here-heading" className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                What are you trying to solve today?
              </h2>
            </div>
            <Link
              to="/blog?topic=Schools%20%26%20Research"
              className="text-sm font-semibold text-primary-700 hover:text-primary-800"
            >
              School leader? Browse schools & research →
            </Link>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {PARENT_GOAL_ROUTES.map((route) => (
              <Link
                key={route.id}
                to={route.to}
                className="group rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 motion-reduce:transform-none"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{route.eyebrow}</p>
                <h3 className="mt-2 text-base font-bold leading-6 text-slate-950">{route.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{route.helper}</p>
                <span className="mt-4 inline-flex text-sm font-semibold text-primary-700">Read guide →</span>
              </Link>
            ))}
          </div>
        </section>

        {defaultParentView && authorityPosts.length > 0 ? (
          <section aria-labelledby="featured-heading" className="mt-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-700">Featured guides</p>
              <h2 id="featured-heading" className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                Featured guides to start with
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Clear starting points for common questions about phonics, reading, and communication, with practical next steps for families.
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {authorityPosts.map((post, index) => {
                const style = DISCOVERY_STYLES[getBlogDiscoveryTopic(post)];
                return (
                  <Link
                    key={post.slug}
                    to={`/blog/${post.slug}`}
                    className="group overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 motion-reduce:transform-none"
                  >
                    <ArticleImage post={post} eager={index === 0} />
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style.chip}`}>{getBlogCardLabel(post)}</span>
                        <span className="text-xs text-slate-500">{post.readTime}</span>
                      </div>
                      <h3 className="mt-3 text-lg font-bold leading-7 text-slate-950">{post.title}</h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{post.metaDescription || post.excerpt}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        <section aria-labelledby="library-heading" className="mt-10">
          <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:sticky lg:top-20 lg:z-20">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] xl:items-end">
              <div className="min-w-0">
                <label htmlFor="blog-search" className="text-sm font-semibold text-slate-900">
                  Search the blog
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    id="blog-search"
                    type="search"
                    value={query}
                    onChange={(event) => {
                      const next = event.target.value;
                      startTransition(() => setQuery(next));
                    }}
                    placeholder="Try “SATPIN”, “cannot blend”, “sentence writing”, “shy child”..."
                    className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={() => startTransition(() => setQuery(''))}
                      className="rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">Filter by topic</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {BLOG_TOPIC_OPTIONS.map((option) => {
                    const active = topic === option;
                    const count = option === 'Parent'
                      ? parentCount
                      : option === 'All'
                        ? sortedPublishedPosts.length
                        : topicCounts.get(option) ?? 0;
                    return (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={active}
                        onClick={() => startTransition(() => setTopic(option))}
                        className={`rounded-full px-3.5 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 ${
                          active
                            ? 'bg-slate-950 text-white'
                            : 'border border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {TOPIC_LABELS[option]} <span className={active ? 'text-slate-300' : 'text-slate-400'}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-700">Library</p>
              <h2 id="library-heading" className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                {libraryHeading}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {libraryCountLabel ? (
                <p aria-live="polite" className="text-sm text-slate-500">
                  {libraryCountLabel}
                </p>
              ) : null}
              {topic === 'Parent' && schoolsCount > 0 ? (
                <button
                  type="button"
                  onClick={() => startTransition(() => setTopic('Schools & Research'))}
                  className="text-sm font-semibold text-primary-700 hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                >
                  School resources ({schoolsCount}) →
                </button>
              ) : null}
            </div>
          </div>

          {libraryPosts.length === 0 ? (
            <div className="mt-5 rounded-[1.6rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
              <h3 className="text-xl font-bold">No articles match that combination</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
                Try fewer search words, choose another topic, or reset the filters to return to the parent library.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              >
                Reset to parent library
              </button>
            </div>
          ) : (
            <>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visiblePosts.map((post) => {
                  const style = DISCOVERY_STYLES[getBlogDiscoveryTopic(post)];
                  return (
                    <article key={post.slug} className="group overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                      <Link
                        to={`/blog/${post.slug}`}
                        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500"
                      >
                        <ArticleImage post={post} />
                        <div className="p-4">
                          <div className="flex items-center justify-between gap-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style.chip}`}>{getBlogCardLabel(post)}</span>
                            <span className="text-xs text-slate-500">{post.readTime}</span>
                          </div>
                          <h3 className="mt-3 text-lg font-bold leading-7 text-slate-950">{post.title}</h3>
                          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{post.metaDescription || post.excerpt}</p>
                          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500">
                            <span>{formatBlogDate(post.date)}</span>
                            <span>By {toDisplayAuthor(post)}</span>
                          </div>
                        </div>
                      </Link>
                    </article>
                  );
                })}
              </div>

              {canLoadMore ? (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((count) => count + INITIAL_LIBRARY_COUNT)}
                    className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                  >
                    Load {Math.min(INITIAL_LIBRARY_COUNT, libraryPosts.length - visiblePosts.length)} more articles
                  </button>
                </div>
              ) : null}
            </>
          )}
        </section>

        <section className="mt-12 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-700">Parents also ask</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Quick answers before you choose the next step</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {BLOG_FAQS.map((faq) => (
                <details key={faq.question} className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                  <summary className="cursor-pointer text-sm font-bold leading-6 text-slate-950">{faq.question}</summary>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>

          <aside className="rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-amber-50 to-sky-50 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Useful next routes</p>
            <h2 className="mt-2 text-xl font-black tracking-tight">Go beyond the library</h2>
            <div className="mt-5 grid gap-2">
              <Link to="/parents" className="rounded-xl border border-white bg-white/90 px-4 py-3 text-sm font-semibold text-slate-900 hover:border-slate-300">
                Parents Help Hub →
              </Link>
              <Link to="/free-english-games-for-kids" className="rounded-xl border border-white bg-white/90 px-4 py-3 text-sm font-semibold text-slate-900 hover:border-slate-300">
                Free English games →
              </Link>
              <Link to="/for-schools" className="rounded-xl border border-white bg-white/90 px-4 py-3 text-sm font-semibold text-slate-900 hover:border-slate-300">
                School partnership resources →
              </Link>
            </div>
          </aside>
        </section>

        <section
          className="mt-10 rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(135deg,#fff8ef_0%,#f8fbff_62%,#ffffff_100%)] p-5 shadow-sm sm:p-6"
          aria-label="About Tiny Steps Blog and founder"
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)] lg:items-center">
            <div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <img
                  src="/priya-founder-tiny-steps-learning.webp"
                  alt="Priya, Founder of Tiny Steps Learning"
                  width={128}
                  height={128}
                  loading="lazy"
                  decoding="async"
                  className="h-16 w-16 rounded-2xl border border-slate-200 object-cover shadow-md"
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-700">Founder, Tiny Steps Learning</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                    <Link to="/team" className="underline decoration-slate-300 underline-offset-4 hover:text-primary-700">Priya</Link>
                  </h2>
                </div>
              </div>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
                Priya leads Tiny Steps academic direction across curriculum, lesson design, teacher guidance, teaching quality, and parent communication.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/team" className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50">
                  Meet the Tiny Steps team
                </Link>
                <Link to="/contact" className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50">
                  Report a correction
                </Link>
              </div>
            </div>

            <div className="rounded-[1.4rem] border border-slate-200 bg-white/85 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Editorial responsibility</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Tiny Steps organizes guides around common learning blockers and practical next steps. Published and updated dates change only when the underlying editorial record changes.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-10 overflow-hidden rounded-[1.8rem] bg-slate-950 p-6 text-white shadow-lg sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-200">Inbox guidance</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Get practical English-learning ideas in your inbox</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                Parent-friendly notes on phonics, reading, grammar, speaking, home routines, and new Tiny Steps guidance.
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-white/10 bg-white/10 p-4">
              <NewsletterForm />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default BlogIndexPage;
