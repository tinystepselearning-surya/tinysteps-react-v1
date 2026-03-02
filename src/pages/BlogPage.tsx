// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { applySeo } from '../lib/seo';
import type { FC } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { blogPosts } from '../content/blog';
import { formatBlogDate } from '../lib/date';
import { fetchMdxPosts } from '../content/blogMdx';
import Meta from '../components/common/Meta';
import NewsletterForm from '../components/common/NewsletterForm';

function requestFullscreenSafe() {
  try {
    const el: any = document.documentElement;
    if (el?.requestFullscreen) return el.requestFullscreen();
    if (el?.webkitRequestFullscreen) return el.webkitRequestFullscreen?.(); // Safari
  } catch {
    // ignore
  }
  return Promise.resolve();
}

const FAQS = [
  {
    question: 'Who is the Tiny Steps blog for?',
    answer: 'The blog is written for parents of children ages 3–12 who want practical, research‑backed English learning tips. You will find phonics, grammar, speaking, and home‑practice guidance that fits busy routines.'
  },
  {
    question: 'How often are new articles published?',
    answer: 'We publish new articles regularly across phonics, grammar, speaking, and parent tips. Check back often for fresh routines, games, and classroom‑aligned strategies.'
  },
  {
    question: 'Are the tips suitable for preschoolers?',
    answer: 'Yes. Many posts focus on ages 3–6 with short activities, sound practice, and simple routines. We also include guidance for older kids who need reading or writing support.'
  },
  {
    question: 'Do I need prior teaching experience to use these tips?',
    answer: 'No. Each article is written in parent‑friendly language with step‑by‑step guidance. Start with the “Start here” links for simple routines you can use immediately.'
  },
  {
    question: 'Are the tips aligned with school curricula in India?',
    answer: 'Yes. We keep examples and progression compatible with CBSE, ICSE, and IB expectations. The focus is on sound‑to‑print skills and clear communication.'
  },
  {
    question: 'What if my child struggles with reading confidence?',
    answer: 'Look for posts on blending, tricky words, and confidence‑building. We also share small‑win routines that help children read without pressure.'
  },
  {
    question: 'Can these tips replace live classes?',
    answer: 'They are best used to support learning at home. Live classes add feedback, correction, and pacing, while the blog provides practice ideas and parent guidance.'
  },
  {
    question: 'How do I choose the right topic for my child?',
    answer: 'Use the topic filters (Phonics, Grammar, Public Speaking, Parent Tips, Research) to match your child’s current need. If you are unsure, start with phonics and daily routine posts.'
  }
];

const BlogPage: FC = () => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState<'All'|'Phonics'|'Grammar'|'Public Speaking'|'Parent Tips'|'Research'>('All');
  const [sort, setSort] = useState<'Newest'|'Most Popular'|'Most Read'>('Newest');
  const [searchQuery, setSearchQuery] = useState('');
  const goToChristmasTree = () => navigate('/seasonal/christmas-tree');
  const posts = useMemo(() => {
    const list = blogPosts.filter((p) => topic === 'All' || p.category === topic);
    if (sort === 'Newest') return list.sort((a,b)=> (a.date<b.date?1:-1));
    if (sort === 'Most Popular') return list.sort((a,b)=> ((b.popularScore||0) - (a.popularScore||0)));
    if (sort === 'Most Read') return list.sort((a,b)=> ((b.viewsCount||0) - (a.viewsCount||0)));
    return list;
  }, [topic, sort]);
  const [mdxPosts, setMdxPosts] = useState<any[]>([]);

  useEffect(() => {
    fetchMdxPosts().then(setMdxPosts).catch(()=>setMdxPosts([]));
  }, []);

  const mdxConverted = mdxPosts.map((m) => ({
    slug: m.slug,
    title: m.title || m.slug,
    category: m.category || 'Parent Tips',
    author: m.author || 'Tiny Steps',
    date: m.date || new Date().toISOString().slice(0,10),
    readTime: m.readTime || '5 min',
    hero: m.hero,
    excerpt: m.excerpt || ''
  }));

  const combined = useMemo(() => [...mdxConverted, ...blogPosts], [mdxConverted]);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const combinedFiltered = useMemo(() => {
    return combined.filter((p) => {
      if (topic !== 'All' && p.category !== topic) return false;
      if (!normalizedQuery) return true;
      const searchable = `${p.title} ${p.excerpt} ${p.category} ${p.author}`.toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [combined, topic, normalizedQuery]);

  // Ensure the rendered list respects the selected `sort` option.
  const sortedPosts = useMemo(() => {
    const list = [...combinedFiltered];
    if (sort === 'Newest') {
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (sort === 'Most Popular') {
      list.sort((a, b) => (b.popularScore || 0) - (a.popularScore || 0));
    } else if (sort === 'Most Read') {
      list.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
    }
    return list;
  }, [combinedFiltered, sort]);
  const blogSchema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Tiny Steps Blog',
    blogPost: combined.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      datePublished: post.date,
      author: { '@type': 'Person', name: post.author || 'Tiny Steps' },
      url: `https://tinystepslearning.com/blog/${post.slug}`
    }))
  }), [combined]);

  const collectionSchema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Tiny Steps Blog',
    description: 'Practical phonics, grammar & speaking tips for parents: SATPIN, blending, tricky words, routines, and confidence-building.',
    url: 'https://tinystepslearning.com/blog',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: combined.slice(0, 20).map((post, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `https://tinystepslearning.com/blog/${post.slug}`,
        name: post.title
      }))
    }
  }), [combined]);

  const organizationSchema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://tinystepslearning.com/#organization',
    name: 'Tiny Steps Learning',
    url: 'https://tinystepslearning.com',
    logo: 'https://tinystepslearning.com/logo.png',
    sameAs: [
      'https://www.facebook.com/tinystepslearning',
      'https://www.instagram.com/tinystepslearning'
    ]
  }), []);

  const faqSchema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': 'https://tinystepslearning.com/blog#faqpage',
    mainEntity: FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }), []);

  const featured = useMemo(() => sortedPosts[0], [sortedPosts]);
  const visiblePosts = useMemo(() => {
    if (!featured) return sortedPosts;
    return sortedPosts.filter((post) => post.slug !== featured.slug);
  }, [featured, sortedPosts]);

  const breadcrumb = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://tinystepslearning.com/blog' },
    ],
  }), []);

  useEffect(() => {
    applySeo({
      title: 'Tiny Steps Blog | Phonics, Grammar & Speaking Tips for Indian Parents',
      description: 'Practical phonics, grammar & speaking tips for parents: SATPIN, blending, tricky words, routines, and confidence-building—by Tiny Steps Learning.',
      canonicalPath: '/blog',
      ogType: 'website',
      jsonLd: [organizationSchema, breadcrumb, blogSchema, collectionSchema, faqSchema],
    });
  }, [breadcrumb, blogSchema, collectionSchema, faqSchema, organizationSchema]);

  return (
    <div className="bg-white">
      <Meta title="Tiny Steps Blog | Phonics, Grammar & Speaking Tips for Indian Parents" description="Practical phonics, grammar & speaking tips for parents: SATPIN, blending, tricky words, routines, and confidence-building—by Tiny Steps Learning." canonical="https://tinystepslearning.com/blog" jsonLd={blogSchema} />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-3xl font-bold md:text-4xl">Insights for Indian Parents</h1>
          <p className="mt-2 text-base text-gray-700">Expert tips, research‑backed articles, success stories</p>
        </div>

        <section className="mb-6">
          <div className="overflow-hidden rounded-2xl border bg-white shadow-lg">
            <div className="relative flex h-28 items-center justify-between md:h-32">
              <img
                src="/seasonal/christmas/homepagetile.jpg"
                alt="Christmas banner"
                className="absolute inset-0 h-full w-full object-cover"
                draggable={false}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/30" />

              <div className="relative z-10 flex w-full items-center justify-between px-6">
                <div className="text-white">
                  <div className="text-xl font-semibold">Merry Christmas</div>
                  <div className="text-sm opacity-90">Festive fun: decorate the tree and celebrate!</div>
                </div>

                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white"
                  onClick={async () => {
                    await requestFullscreenSafe();
                    goToChristmasTree();
                  }}
                >
                  Open Game
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 bg-blue-50 border-l-4 border-[#4a7c2c] p-5 rounded-lg">
          <h2 className="text-lg font-bold text-[#2d5016] mb-2">What will parents find on the Tiny Steps blog?</h2>
          <p className="text-gray-700 leading-relaxed">
            The Tiny Steps blog offers practical, research‑backed guidance for parents of children ages 3–12. You will find phonics routines, reading tips, grammar support, and public‑speaking confidence builders—plus simple at‑home activities that fit busy schedules and align with Indian school expectations.
          </p>
        </section>

        <div className="mb-6 mx-auto max-w-6xl px-6">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="text-xl font-semibold">Start here</h2>
            <p className="mt-1 text-sm text-gray-700">Three quick guides to begin today.</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link to="/parents/getting-started" className="text-primary-600 font-medium">Getting started with phonics at home</Link>
              <Link to="/parents/reading-at-home" className="text-primary-600">10-minute daily reading routine</Link>
              <Link to="/parents/phonics-mission" className="text-primary-600">How to use Phonics Mission games</Link>
            </div>
          </div>
        </div>

        {/* Slim Parents Help Hub CTA — above blog list to surface parents guides */}
        <div className="mb-6 mx-auto max-w-6xl px-6">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="text-xl font-semibold">Parents Help Hub</h2>
            <p className="mt-1 text-sm text-gray-700">Step-by-step phonics and home practice guides for ages 3–12.</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link to="/parents" className="text-primary-600 font-medium">View all guides</Link>
              <Link to="/parents/getting-started" className="text-primary-600">Getting started with phonics at home</Link>
              <Link to="/parents/reading-at-home" className="text-primary-600">10-minute daily reading routine</Link>
              <Link to="/parents/phonics-mission" className="text-primary-600">How to use Phonics Mission games</Link>
              <Link to="/parents/common-mistakes" className="text-primary-600">Common phonics mistakes to avoid</Link>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {['All','Phonics','Grammar','Public Speaking','Parent Tips','Research'].map((t) => (
              <button key={t} onClick={() => setTopic(t as any)} className={`rounded-full px-3 py-1 text-sm ${topic===t?'bg-primary-500 text-white':'bg-slate-100'}`}>{t}</button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label htmlFor="blog-search" className="sr-only">Search blog posts</label>
            <input
              id="blog-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics, authors, or keywords"
              className="w-full min-w-[220px] rounded-full border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="text-sm">
              <label className="mr-2 text-gray-700">Sort:</label>
              <select value={sort} onChange={(e)=>setSort(e.target.value as any)} className="rounded-full border px-3 py-1 text-sm">
                {['Newest','Most Popular','Most Read'].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {featured && (
          <Link to={`/blog/${featured.slug}`} className="block rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
            <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
              <div>
                <h2 className="text-2xl font-bold">{featured.title}</h2>
                <div className="mt-1 text-sm text-gray-600">by {featured.author} • {featured.readTime} • {formatBlogDate(featured.date)}</div>
                <p className="mt-3 text-gray-700">{featured.excerpt}</p>
              </div>
              {featured.hero ? (
                <div className="aspect-video w-full rounded-xl bg-slate-100" style={{backgroundImage: `url(${featured.hero})`, backgroundSize: 'cover'}} />
              ) : (
                <div className="aspect-video w-full rounded-xl bg-gradient-to-r from-sky-50 to-orange-50" />
              )}
            </div>
          </Link>
        )}

        {visiblePosts.length === 0 ? (
          <div className="mt-10 rounded-2xl bg-white p-6 text-center shadow ring-1 ring-slate-200">
            <h2 className="text-xl font-semibold text-[#2d5016]">No articles found</h2>
            <p className="mt-2 text-sm text-gray-700">Try a different keyword, clear filters, or choose a topic.</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="rounded-full border px-4 py-2 text-sm text-[#2d5016]"
              >
                Clear search
              </button>
              <button
                type="button"
                onClick={() => {
                  setTopic('All');
                  setSort('Newest');
                }}
                className="rounded-full border px-4 py-2 text-sm text-[#2d5016]"
              >
                Reset filters
              </button>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {['Phonics', 'SATPIN', 'Reading', 'Shy child'].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setSearchQuery(chip)}
                  className="rounded-full bg-slate-100 px-3 py-1 text-sm"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visiblePosts.map((p) => (
              <Link key={p.slug} to={`/blog/${p.slug}`} className="rounded-2xl bg-white p-5 shadow ring-1 ring-slate-200 transition-transform hover:-translate-y-1">
                {p.hero ? (
                  <div className="aspect-video w-full rounded-xl bg-slate-100 mb-4" style={{backgroundImage: `url(${p.hero})`, backgroundSize: 'cover'}} />
                ) : (
                  <div className="aspect-video w-full rounded-xl mb-4 bg-gradient-to-r from-sky-50 to-orange-50" />
                )}
                <div className="text-xs text-primary-600">{p.category}</div>
                <div className="mt-1 font-semibold text-gray-900">{p.title}</div>
                <div className="text-xs text-gray-600">{p.readTime} • {formatBlogDate(p.date)}</div>
                <p className="mt-2 text-sm text-gray-700 line-clamp-3">{p.excerpt}</p>
              </Link>
            ))}
          </div>
        )}

        <section className="mt-12">
          <h2 className="text-3xl font-bold text-[#2d5016] mb-6">FAQs</h2>
          <div className="space-y-6">
            {FAQS.map((faq) => (
              <div key={faq.question} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <h3 className="text-lg font-bold text-[#2d5016] mb-2">{faq.question}</h3>
                <p className="text-gray-700">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-12 mx-auto max-w-xl rounded-2xl bg-gradient-to-r from-primary-50 to-secondary-50 p-6 text-center ring-1 ring-slate-200">
          <div className="font-semibold">Get practical tips for your child\'s English journey</div>
          <div className="mt-3"><NewsletterForm /></div>
        </div>
      </div>
    </div>
  );
};

export default BlogPage;
