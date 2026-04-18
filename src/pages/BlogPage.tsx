// @ts-nocheck
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { applySeo } from '../lib/seo';
import { blogPosts } from '../content/blog';
import { fetchMdxPosts } from '../content/blogMdx';
import { formatBlogDate, isoDateFromYMD } from '../lib/date';
import Meta from '../components/common/Meta';
import NewsletterForm from '../components/common/NewsletterForm';
import AboutAuthor from '../components/AboutAuthor';

const TOPIC_OPTIONS = ['All', 'Phonics', 'Grammar', 'Public Speaking', 'Parent Tips', 'Research'] as const;
const SORT_OPTIONS = ['Newest', 'Most Popular', 'Most Read'] as const;

const SEARCH_INTENT_LANES = [
  {
    label: 'What is Jolly Phonics and is it best for my child?',
    helper: 'Understand synthetic phonics, compare methods, and see how Tiny Steps uses it in practice.',
    to: '/blog/what-is-jolly-phonics-and-is-it-the-best-way-to-teach-reading',
    accent: 'from-[#eef6ff] to-[#fff5ea]',
  },
  {
    label: 'What is synthetic phonics and how is it different?',
    helper: 'Get a parent-friendly synthetic phonics explainer with method comparison.',
    to: '/blog/synthetic-phonics-vs-traditional-reading',
    accent: 'from-[#fff0df] to-[#eef6ff]',
  },
  {
    label: 'My child knows letters but still cannot read words',
    helper: 'Understand why ABC knowledge is not decoding and what to do next at home.',
    to: '/blog/child-knows-abc-but-cannot-read',
    accent: 'from-[#eef6ff] to-[#fff7eb]',
  },
  {
    label: 'What is the right age to start phonics?',
    helper: 'Use readiness signs and age guidance for early or catch-up readers.',
    to: '/blog/what-age-to-start-phonics',
    accent: 'from-[#f4f9f0] to-[#eef6ff]',
  },
  {
    label: 'Online vs offline/school phonics classes: what works better?',
    helper: 'Compare class formats and pick the right support model for your child.',
    to: '/blog/online-phonics-classes-vs-school',
    accent: 'from-[#fff3eb] to-[#f2f6ff]',
  },
];

const START_HERE_LINKS = [
  { label: 'What is Jolly Phonics guide', to: '/blog/what-is-jolly-phonics-and-is-it-the-best-way-to-teach-reading' },
  { label: 'What is synthetic phonics?', to: '/blog/synthetic-phonics-vs-traditional-reading' },
  { label: 'Child knows ABC but cannot read', to: '/blog/child-knows-abc-but-cannot-read' },
  { label: 'Right age to start phonics', to: '/blog/what-age-to-start-phonics' },
  { label: 'Phonics vs sight words/traditional reading', to: '/blog/science-of-phonics-learning' },
  { label: 'Why kids struggle with reading', to: '/blog/how-phonics-classes-help-kids-read' },
  { label: 'How to teach phonics at home', to: '/blog/phonics-activities-for-kids-at-home' },
  { label: 'Online vs offline/school phonics', to: '/blog/online-phonics-classes-vs-school' },
  { label: 'Parents Help Hub', to: '/parents' },
];

const HERO_PROOF_POINTS = [
  '56+ curated parent articles',
  'Phonics, grammar, speaking, and routines',
  'Built for ages 3-12 and multilingual homes',
];

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
    answer: 'Start with the phonics parent guide for the big picture, then use the SATPIN week 1 roadmap if your child knows letters but still cannot blend simple words.',
  },
  {
    question: 'Does the blog help parents searching for grammar or speaking support too?',
    answer: 'Yes. The index is organized around phonics, grammar, public speaking, parent routines, and research-backed guides so families can move quickly to the right topic.',
  },
  {
    question: 'Are these blog posts written for Indian parents only?',
    answer: 'No. Tiny Steps writes for global parents, while keeping examples practical for multilingual families and school systems such as CBSE, ICSE, Cambridge, IB, and other English-medium settings.',
  },
  {
    question: 'Can AI search tools or voice assistants surface these blog answers?',
    answer: 'That is the goal. We structure posts around real parent questions, concise answer-first summaries, FAQs, and clear topic pages so search engines and AI assistants can cite the right article more easily.',
  },
];

const FEATURED_GUIDE_SLUGS = [
  'synthetic-phonics-vs-traditional-reading',
  'child-knows-abc-but-cannot-read',
  'what-age-to-start-phonics',
  'online-phonics-classes-vs-school',
];

const CATEGORY_THEME = {
  Phonics: {
    text: 'text-sky-700',
    chip: 'bg-sky-100 text-sky-700',
    panel: 'from-[#eef6ff] to-[#fff9f1]',
    helper: 'Decoding, blending, tricky words, and reading foundations.',
  },
  Grammar: {
    text: 'text-emerald-700',
    chip: 'bg-emerald-100 text-emerald-700',
    panel: 'from-[#f2fbf4] to-[#eef6ff]',
    helper: 'Sentence building, writing structure, editing, and clarity.',
  },
  'Public Speaking': {
    text: 'text-amber-700',
    chip: 'bg-amber-100 text-amber-700',
    panel: 'from-[#fff5ea] to-[#eef6ff]',
    helper: 'Confidence, fluency, presentation habits, and speaking practice.',
  },
  'Parent Tips': {
    text: 'text-rose-700',
    chip: 'bg-rose-100 text-rose-700',
    panel: 'from-[#fff3f1] to-[#fffaf5]',
    helper: 'Daily routines, planning, behavior support, and school transitions.',
  },
  Research: {
    text: 'text-violet-700',
    chip: 'bg-violet-100 text-violet-700',
    panel: 'from-[#f4f0ff] to-[#eef6ff]',
    helper: 'Deep research guides, roadmaps, and evidence summaries.',
  },
};

function getCategoryTheme(category: string) {
  return CATEGORY_THEME[category] || CATEGORY_THEME['Parent Tips'];
}

function buildSearchableText(post: any) {
  const keywordText = Array.isArray(post.body) ? post.body.map((block) => block.content).join(' ') : '';
  const faqText = Array.isArray(post.faq) ? post.faq.map((item) => `${item.question} ${item.answer}`).join(' ') : '';
  return `${post.title} ${post.excerpt} ${post.category} ${post.author} ${post.metaDescription || ''} ${keywordText} ${faqText}`.toLowerCase();
}

const BlogPage: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [topic, setTopic] = useState<(typeof TOPIC_OPTIONS)[number]>('All');
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]>('Newest');
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [visibleCount, setVisibleCount] = useState(9);
  const [mdxPosts, setMdxPosts] = useState<any[]>([]);
  const deferredQuery = useDeferredValue(searchQuery.trim().toLowerCase());

  useEffect(() => {
    fetchMdxPosts().then(setMdxPosts).catch(() => setMdxPosts([]));
  }, []);

  useEffect(() => {
    setVisibleCount(9);
  }, [topic, sort, deferredQuery]);

  useEffect(() => {
    const nextSearch = searchParams.get('search') || '';
    if (nextSearch === searchQuery) return;
    setSearchQuery(nextSearch);
  }, [searchParams, searchQuery]);

  useEffect(() => {
    const nextSearch = searchQuery.trim();
    const currentSearch = searchParams.get('search') || '';
    if (currentSearch === nextSearch) return;

    const nextParams = new URLSearchParams(searchParams);
    if (nextSearch) nextParams.set('search', nextSearch);
    else nextParams.delete('search');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, searchQuery, setSearchParams]);

  const mdxConverted = useMemo(
    () =>
      mdxPosts.map((post) => ({
        slug: post.slug,
        title: post.title || post.slug,
        category: post.category || 'Parent Tips',
        author: post.author || 'Tiny Steps',
        date: post.date || new Date().toISOString().slice(0, 10),
        readTime: post.readTime || '5 min read',
        hero: post.hero,
        excerpt: post.excerpt || '',
      })),
    [mdxPosts],
  );

  const combinedPosts = useMemo(() => [...mdxConverted, ...blogPosts], [mdxConverted]);
  const todayIso = new Date().toISOString().slice(0, 10);
  const publishedPosts = useMemo(
    () => combinedPosts.filter((post) => !post.date || String(post.date) <= todayIso),
    [combinedPosts, todayIso],
  );

  const topicCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of publishedPosts) {
      counts.set(post.category, (counts.get(post.category) || 0) + 1);
    }
    return counts;
  }, [publishedPosts]);

  const filteredPosts = useMemo(
    () =>
      publishedPosts.filter((post) => {
        if (topic !== 'All' && post.category !== topic) return false;
        if (!deferredQuery) return true;
        return buildSearchableText(post).includes(deferredQuery);
      }),
    [publishedPosts, topic, deferredQuery],
  );

  const sortedPosts = useMemo(() => {
    const list = [...filteredPosts];
    if (sort === 'Newest') {
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (sort === 'Most Popular') {
      list.sort((a, b) => (b.popularScore || 0) - (a.popularScore || 0));
    } else {
      list.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
    }
    return list;
  }, [filteredPosts, sort]);

  const spotlightPosts = useMemo(() => {
    const fromCurated = FEATURED_GUIDE_SLUGS
      .map((slug) => publishedPosts.find((post) => post.slug === slug))
      .filter(Boolean);

    if (topic === 'All' && !deferredQuery) {
      return fromCurated;
    }

    return sortedPosts.slice(0, 3);
  }, [publishedPosts, sortedPosts, topic, deferredQuery]);

  const leadPost = spotlightPosts[0] || sortedPosts[0];
  const remainingPosts = useMemo(
    () => sortedPosts.filter((post) => post.slug !== leadPost?.slug),
    [sortedPosts, leadPost],
  );
  const visiblePosts = remainingPosts.slice(0, visibleCount);
  const canLoadMore = visiblePosts.length < remainingPosts.length;

  const quickTopicCards = useMemo(() => {
    const topicToSlug = {
      Phonics: 'phonics-for-parents-guide',
      Grammar: 'week-7-grammar-nouns-to-paragraphs',
      'Public Speaking': 'week-12-speaking-confidence-seeds',
      'Parent Tips': 'week-25-back-to-school-plan',
      Research: 'week-1-phonics-satpin-launch',
    };

    return Object.entries(topicToSlug)
      .map(([category, slug]) => publishedPosts.find((post) => post.slug === slug))
      .filter(Boolean);
  }, [publishedPosts]);

  const archiveByTopic = useMemo(() => {
    const grouped = new Map<string, any[]>();

    for (const post of publishedPosts) {
      if (!grouped.has(post.category)) grouped.set(post.category, []);
      grouped.get(post.category).push(post);
    }

    for (const [category, posts] of grouped.entries()) {
      posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      grouped.set(category, posts);
    }

    return grouped;
  }, [publishedPosts]);

  const blogSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Tiny Steps Parent Desk',
      description:
        'Parent-friendly blog for phonics, grammar, public speaking, and home English routines for children ages 3-12.',
      blogPost: publishedPosts.map((post) => ({
        '@type': 'BlogPosting',
        headline: post.title,
        datePublished: isoDateFromYMD(post.date),
        dateModified: isoDateFromYMD(post.date),
        articleSection: post.category,
        image: post.hero
          ? String(post.hero).startsWith('http')
            ? post.hero
            : `https://tinystepslearning.com${post.hero}`
          : 'https://tinystepslearning.com/logo-square.webp',
        author: {
          '@type': 'Organization',
          name: 'Tiny Steps Learning',
          url: 'https://tinystepslearning.com',
        },
        url: `https://tinystepslearning.com/blog/${post.slug}`,
      })),
    }),
    [publishedPosts],
  );

  const collectionSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Tiny Steps Blog',
      description:
        'Search and browse phonics, grammar, speaking, and parent routine articles for children ages 3-12.',
      url: 'https://tinystepslearning.com/blog',
      audience: {
        '@type': 'Audience',
        audienceType: 'Parents of children ages 3-12',
      },
      about: [
        'phonics for kids',
        'grammar for kids',
        'public speaking for kids',
        'online english classes for kids',
        'parent routines for reading at home',
      ],
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: publishedPosts.slice(0, 24).map((post, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: `https://tinystepslearning.com/blog/${post.slug}`,
          name: post.title,
        })),
      },
    }),
    [publishedPosts],
  );

  const faqSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': 'https://tinystepslearning.com/blog#faqpage',
      mainEntity: BLOG_FAQS.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    }),
    [],
  );

  const breadcrumbSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://tinystepslearning.com/blog' },
      ],
    }),
    [],
  );

  const metaTitle = 'Tiny Steps Blog | Phonics, Grammar, Speaking & English Help for Parents';
  const metaDescription =
    'Browse parent-friendly phonics, grammar, speaking, and English-learning blogs for kids ages 3-12. Find SATPIN guides, reading routines, grammar roadmaps, and confidence-building support.';

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

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6eee3_0%,#fbfaf7_20%,#ffffff_46%,#f4f8fc_100%)] text-slate-900">
      <Meta
        title={metaTitle}
        description={metaDescription}
        keywords={BLOG_META_KEYWORDS.join(', ')}
        canonical="https://tinystepslearning.com/blog"
        jsonLd={[breadcrumbSchema, blogSchema, collectionSchema, faqSchema]}
      />

      <section className="relative overflow-hidden border-b border-slate-800 bg-[linear-gradient(135deg,#0f172a_0%,#16233c_48%,#1d2942_100%)] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(242,187,104,0.16),transparent_26%),radial-gradient(circle_at_82%_18%,rgba(103,152,224,0.2),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(15,23,42,0),rgba(15,23,42,0.44))]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-7 sm:px-6 sm:pb-16 sm:pt-9">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_390px] lg:items-start">
            <div className="max-w-4xl">
              <div className="inline-flex items-center rounded-full border border-white/14 bg-white/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-100 backdrop-blur">
                Tiny Steps Parent Desk
              </div>
              <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-[4rem] lg:leading-[1.02]">
                Find the right phonics, grammar, and speaking help in minutes
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200">
                Research-backed guidance for parents searching what phonics is, why reading is stuck, how to
                improve grammar and writing, or how to build speaking confidence without turning home practice
                into pressure.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-200">
                {HERO_PROOF_POINTS.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/12 bg-white/8 px-4 py-2 backdrop-blur"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/parents"
                  className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                >
                  Explore the Parents Hub
                </Link>
                <Link
                  to="/?book=1"
                  className="inline-flex items-center rounded-full border border-white/18 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/12"
                >
                  Book Free Assessment
                </Link>
              </div>

            </div>

            <div className="rounded-[2.25rem] border border-white/10 bg-white/8 p-6 shadow-[0_30px_80px_rgba(2,6,23,0.32)] backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">
                Popular parent routes
              </p>
              <div className="mt-5 divide-y divide-white/10">
                {SEARCH_INTENT_LANES.map((lane) => (
                  <Link
                    key={lane.label}
                    to={lane.to}
                    className="group block py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-base font-semibold leading-7 text-white transition group-hover:text-[#ffd8a8]">
                          {lane.label}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{lane.helper}</p>
                      </div>
                      <span className="mt-1 text-lg text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-white">
                        →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(135deg,#121a2d,#1a2946)] p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">Start here</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight">Use the blog like a parent help library, not a long scroll</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
              Start with the roadmap or guide that matches your child&apos;s main blocker, then move deeper into
              topic-specific posts only if you need more examples, routines, or class-selection help.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {START_HERE_LINKS.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/16"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {quickTopicCards.slice(0, 4).map((post) => {
              const theme = getCategoryTheme(post.category);
              return (
                <Link
                  key={post.slug}
                  to={`/blog/${post.slug}`}
                  className={`rounded-[1.75rem] border border-slate-200 bg-gradient-to-br ${theme.panel} p-5 transition hover:-translate-y-0.5 hover:shadow-md`}
                >
                  <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${theme.chip}`}>
                    {post.category}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold leading-7 text-slate-900">{post.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{theme.helper}</p>
                  <p className="mt-3 text-xs text-slate-500">
                    {topicCounts.get(post.category) || 0} articles in this topic
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-3 rounded-[1.8rem] border border-slate-200/80 bg-white/86 p-2.5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur lg:sticky lg:top-20 lg:z-20">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {TOPIC_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTopic(option)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    topic === option
                      ? 'bg-slate-950 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <label htmlFor="blog-search" className="sr-only">
                Search blog topics
              </label>
              <input
                id="blog-search"
                type="search"
                value={searchQuery}
                onChange={(event) => {
                  const value = event.target.value;
                  startTransition(() => setSearchQuery(value));
                }}
                placeholder="Search phonics, grammar, speaking, SATPIN, writing..."
                className="w-full rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-primary-400 sm:w-[280px]"
              />
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as (typeof SORT_OPTIONS)[number])}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-primary-400"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span>
              Showing <span className="font-semibold text-slate-900">{sortedPosts.length}</span> article
              {sortedPosts.length === 1 ? '' : 's'}
            </span>
            {deferredQuery ? (
              <span>
                for <span className="font-semibold text-slate-900">"{searchQuery.trim()}"</span>
              </span>
            ) : null}
            <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-flex" />
            <span>Built for parents searching phonics, grammar, speaking, and English-learning help.</span>
          </div>
        </section>

        {leadPost ? (
          <section className="mt-2 grid gap-3 xl:grid-cols-[minmax(0,1fr)_240px] xl:items-start">
            <div className="min-w-0 space-y-2.5">
              <Link
                to={`/blog/${leadPost.slug}`}
                className="flex min-w-0 items-center overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-[0_10px_26px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(15,23,42,0.1)]"
              >
                <div className="min-w-0 flex-1 p-3">
                  <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getCategoryTheme(leadPost.category).chip}`}>
                    {leadPost.category}
                  </div>
                  <h2 className="mt-1.5 text-[16px] font-black leading-5 tracking-tight text-slate-950 line-clamp-2">
                    {leadPost.title}
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    by {leadPost.author} • {leadPost.readTime} • {formatBlogDate(leadPost.date)}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-slate-700 line-clamp-2">
                    {leadPost.metaDescription || leadPost.excerpt}
                  </p>
                  <div className="mt-2 inline-flex items-center rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-semibold text-white">
                    Read article
                  </div>
                </div>

                {leadPost.hero ? (
                  <div className="hidden shrink-0 md:block w-[160px] pr-3">
                    <div
                      className="h-[96px] w-full rounded-xl bg-slate-100 bg-cover bg-center transition duration-500 hover:scale-[1.03]"
                      style={{ backgroundImage: `url(${leadPost.hero})` }}
                    />
                  </div>
                ) : (
                  <div className="hidden shrink-0 md:block w-[160px] pr-3">
                    <div className="h-[96px] w-full rounded-xl bg-[linear-gradient(135deg,#eef6ff,#fff5ea)]" />
                  </div>
                )}
              </Link>

              <div className="rounded-[1.4rem] border border-slate-200 bg-[linear-gradient(135deg,#fff4df,#eef6ff)] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Top topic lanes</p>
                  <span className="text-xs text-slate-500">Jump to the right shelf</span>
                </div>
                <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {TOPIC_OPTIONS.filter((item) => item !== 'All').map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setTopic(category)}
                      className="flex w-full items-center justify-between rounded-[0.95rem] border border-white/80 bg-white/85 px-3 py-1.5 text-left transition hover:border-slate-300"
                    >
                      <span className="text-sm font-semibold text-slate-900">{category}</span>
                      <span className="text-xs text-slate-500">{topicCounts.get(category) || 0}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">Why this page is easier to use</p>
                <ul className="mt-2 space-y-1.5 text-sm leading-5 text-slate-600">
                  <li className="flex gap-2.5">
                    <span className="mt-2 h-2 w-2 rounded-full bg-primary-500" />
                    <span>Use topic chips to narrow by phonics, grammar, speaking, parent routines, or research.</span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="mt-2 h-2 w-2 rounded-full bg-primary-500" />
                    <span>Search like a parent would: “phonics for parents”, “SATPIN”, “shy child”, or “grammar writing”.</span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="mt-2 h-2 w-2 rounded-full bg-primary-500" />
                    <span>Load only what you need instead of scrolling through the entire archive in one pass.</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        ) : null}

        {spotlightPosts.length > 1 ? (
          <section className="mt-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">Spotlight</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Useful routes for high-intent parent searches</h2>
              </div>
              <Link to="/faq" className="text-sm font-semibold text-primary-700">
                See all parent FAQs
              </Link>
            </div>

            <div className="mt-2.5 grid gap-2.5 md:grid-cols-3">
              {spotlightPosts.slice(1, 4).map((post) => {
                const theme = getCategoryTheme(post.category);
                return (
                  <Link
                    key={post.slug}
                    to={`/blog/${post.slug}`}
                    className="overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white shadow-[0_7px_18px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                  >
                    {post.hero ? (
                      <div
                        className="aspect-[2.8/1] bg-slate-100 bg-cover bg-center transition duration-500 hover:scale-[1.03]"
                        style={{ backgroundImage: `url(${post.hero})` }}
                      />
                    ) : (
                      <div className={`aspect-[2.8/1] bg-gradient-to-br ${theme.panel}`} />
                    )}
                    <div className="p-2.5">
                      <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${theme.chip}`}>
                        {post.category}
                      </div>
                      <h3 className="mt-1.5 text-sm font-semibold leading-5 text-slate-900 line-clamp-2">{post.title}</h3>
                      <p className="mt-0.5 text-sm leading-5 text-slate-600 line-clamp-2">
                        {post.metaDescription || post.excerpt}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="mt-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">Library</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Browse by topic without the endless feed feel</h2>
            </div>
            {remainingPosts.length > 0 ? (
              <p className="text-sm text-slate-500">Showing {Math.min(visiblePosts.length, remainingPosts.length)} of {remainingPosts.length} additional articles</p>
            ) : null}
          </div>

          {remainingPosts.length === 0 ? (
            <div className="mt-5 rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <h3 className="text-xl font-semibold text-slate-900">No articles match that search yet</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Try a different parent-style query, clear the search, or switch back to all topics.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => startTransition(() => setSearchQuery(''))}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
                >
                  Clear search
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTopic('All');
                    setSort('Newest');
                  }}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
                >
                  Reset filters
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-2.5 grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
                {visiblePosts.map((post) => {
                  const theme = getCategoryTheme(post.category);
                  return (
                    <Link
                      key={post.slug}
                      to={`/blog/${post.slug}`}
                      className="group overflow-hidden rounded-[1.35rem] border border-slate-200/90 bg-white shadow-[0_7px_18px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                    >
                      {post.hero ? (
                        <div
                          className="aspect-[2.8/1] bg-slate-100 bg-cover bg-center transition duration-500 group-hover:scale-[1.03]"
                          style={{ backgroundImage: `url(${post.hero})` }}
                        />
                      ) : (
                        <div className={`aspect-[2.8/1] bg-gradient-to-br ${theme.panel}`} />
                      )}
                      <div className="p-2.5">
                        <div className="flex items-center justify-between gap-3">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${theme.chip}`}>
                            {post.category}
                          </span>
                          <span className="text-xs text-slate-500">{post.readTime}</span>
                        </div>
                        <h3 className="mt-1 text-sm font-semibold leading-5 text-slate-900 line-clamp-2">{post.title}</h3>
                        <p className="mt-0.5 text-xs text-slate-500">{formatBlogDate(post.date)}</p>
                        <p className="mt-0.5 text-sm leading-5 text-slate-600 line-clamp-2">
                          {post.metaDescription || post.excerpt}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {canLoadMore ? (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((count) => count + 9)}
                    className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Load more articles
                  </button>
                </div>
              ) : null}
            </>
          )}
        </section>

        <section className="mt-12 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">Parents also ask</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Parents also ask before they choose the next step</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {BLOG_FAQS.map((faq) => (
                <details key={faq.question} className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4">
                  <summary className="cursor-pointer list-none text-base font-semibold leading-6 text-slate-900">
                    {faq.question}
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#fff5e7,#eef6ff)] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Need a direct answer?</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Need a clearer route for your question?</h2>
            <div className="mt-5 space-y-3">
              <Link to="/faq" className="block rounded-[1.25rem] border border-white/80 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300">
                Explore the full FAQ page
              </Link>
              <Link to="/blog/phonics-for-parents-guide" className="block rounded-[1.25rem] border border-white/80 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300">
                Read the full phonics parent guide
              </Link>
              <Link to="/blog/week-12-speaking-confidence-seeds" className="block rounded-[1.25rem] border border-white/80 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300">
                Read the speaking confidence roadmap
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <details className="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">Archive directory</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Browse the full archive by topic</h2>
              </div>
              <span className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-500 transition group-open:rotate-45">
                +
              </span>
            </summary>

            <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
              {TOPIC_OPTIONS.filter((topicName) => topicName !== 'All').map((topicName) => {
                const posts = archiveByTopic.get(topicName) || [];

                return (
                  <div key={topicName}>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{topicName}</h3>
                    <div className="mt-3 space-y-2">
                      {posts.map((post) => (
                        <Link
                          key={post.slug}
                          to={`/blog/${post.slug}`}
                          className="block text-sm leading-6 text-slate-700 transition hover:text-primary-700"
                        >
                          {post.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        </section>

        <AboutAuthor
          className="mt-12"
          title="About Tiny Steps Blog & Founder"
          intro="The Tiny Steps blog is written to help parents move quickly from search queries to practical next steps in phonics, grammar, speaking, and home routines."
          note="Every Tiny Steps blog is shaped to answer real parent questions clearly, then connect those answers to practical routines, classes, and support paths."
          badges={['Foundations Forever', 'Tiny Steps Blog', 'Parent-first teaching']}
          highlights={[
            { label: 'Primary purpose', value: 'Help parents choose the right next move faster' },
            { label: 'Topics covered', value: 'Phonics, grammar, speaking, routines, and research guides' },
            { label: 'Editorial approach', value: 'Search-intent clarity with practical home-use guidance' },
          ]}
        />

        <section className="mt-12 overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#101828,#1b2a46)] px-6 py-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">Inbox-worthy guidance</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Get practical tips for your child&apos;s English journey</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
                Weekly parent-friendly notes on phonics, grammar, speaking, home routines, and new Tiny Steps research articles.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
              <NewsletterForm />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default BlogPage;
