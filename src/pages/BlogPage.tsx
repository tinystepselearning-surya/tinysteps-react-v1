// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { blogPosts } from '../content/blog';
import { fetchMdxPosts } from '../content/blogMdx';
import Meta from '../components/common/Meta';
import NewsletterForm from '../components/common/NewsletterForm';

const BlogPage: FC = () => {
  const [topic, setTopic] = useState<'All'|'Phonics'|'Grammar'|'Public Speaking'|'Parent Tips'|'Research'>('All');
  const [sort, setSort] = useState<'Newest'|'Most Popular'|'Most Read'>('Newest');
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
  const featured = combined
    .filter((p) => topic === 'All' || p.category === topic)
    .sort((a,b) => (sort==='Newest' ? (a.date<b.date?1:-1) : 0))[0];

  useEffect(() => { document.title = 'Insights for Indian Parents | Tiny Steps Blog'; }, []);

  return (
    <div className="bg-white">
      <Meta title="Tiny Steps Blog | Insights for Indian Parents" description="Premium 1:1 online English school for ages 3–12. IB-aligned phonics, grammar and public speaking with kind live mentors, AI-guided practice and weekly parent progress insights. Free assessment class; flexible monthly plans." canonical="https://tinystepslearning.com/blog" jsonLd={blogSchema} />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-3xl font-bold md:text-4xl">Insights for Indian Parents</h1>
          <p className="mt-2 text-base text-gray-700">Expert tips, research‑backed articles, success stories</p>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {['All','Phonics','Grammar','Public Speaking','Parent Tips','Research'].map((t) => (
              <button key={t} onClick={() => setTopic(t as any)} className={`rounded-full px-3 py-1 text-sm ${topic===t?'bg-primary-500 text-white':'bg-slate-100'}`}>{t}</button>
            ))}
          </div>
          <div className="text-sm">
            <label className="mr-2 text-gray-700">Sort:</label>
            <select value={sort} onChange={(e)=>setSort(e.target.value as any)} className="rounded-full border px-3 py-1 text-sm">
              {['Newest','Most Popular','Most Read'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {featured && (
          <Link to={`/blog/${featured.slug}`} className="block rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
            <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
              <div>
                <h2 className="text-2xl font-bold">{featured.title}</h2>
                <div className="mt-1 text-sm text-gray-600">by {featured.author} • {featured.readTime} • {new Date(featured.date).toLocaleDateString()}</div>
                <p className="mt-3 text-gray-700">{featured.excerpt}</p>
              </div>
              <div className="aspect-video w-full rounded-xl bg-slate-100" style={{backgroundImage: `url(${featured.hero||''})`, backgroundSize: 'cover'}} />
            </div>
          </Link>
        )}

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {combined.slice(1).map((p) => (
            <Link key={p.slug} to={`/blog/${p.slug}`} className="rounded-2xl bg-white p-5 shadow ring-1 ring-slate-200 transition-transform hover:-translate-y-1">
              <div className="aspect-video w-full rounded-xl bg-slate-100 mb-4" style={{backgroundImage: `url(${p.hero||''})`, backgroundSize: 'cover'}} />
              <div className="text-xs text-primary-600">{p.category}</div>
              <div className="mt-1 font-semibold text-gray-900">{p.title}</div>
              <div className="text-xs text-gray-600">{p.readTime} • {new Date(p.date).toLocaleDateString()}</div>
              <p className="mt-2 text-sm text-gray-700 line-clamp-3">{p.excerpt}</p>
            </Link>
          ))}
        </div>

        <div className="mt-12 mx-auto max-w-xl rounded-2xl bg-gradient-to-r from-primary-50 to-secondary-50 p-6 text-center ring-1 ring-slate-200">
          <div className="font-semibold">Get weekly tips for your child\'s English journey</div>
          <div className="mt-3"><NewsletterForm /></div>
        </div>
      </div>
    </div>
  );
};

export default BlogPage;
