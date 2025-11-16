// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogPosts } from '../content/blog';
import Meta from '../components/common/Meta';

const BlogPostPage: React.FC = () => {
  const { slug } = useParams();
  const post = useMemo(() => blogPosts.find((p) => p.slug === slug), [slug]);
  const [MdxComp, setMdxComp] = useState<any>(null);
  const [mdxMeta, setMdxMeta] = useState<any>(null);
  useEffect(() => {
    (async () => {
      if (post || !slug) return;
      try {
        // const mod: any = await import(`../content/blog/${slug}.mdx`);
        // setMdxComp(() => mod.default);
        // setMdxMeta(mod.meta || {});
      } catch (e) {
        // not mdx
      }
    })();
  }, [slug]);

  if (!post && !MdxComp) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20">
        <h1 className="text-2xl font-bold">Article not found</h1>
        <p className="mt-2"><Link className="text-primary-600" to="/blog">Back to blog</Link></p>
      </div>
    );
  }

  const metaSource = post || mdxMeta || {};
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: metaSource.title,
    author: { '@type': 'Person', name: metaSource.author || 'Tiny Steps' },
    datePublished: new Date(metaSource.date || Date.now()).toISOString(),
    image: metaSource.hero ? `${location.origin}${metaSource.hero}` : undefined,
    wordCount: 2500,
    articleBody: post ? post.body.map(b => b.content).join('\n') : ''
  };

  return (
    <div className="bg-white">
      <Meta title={`${metaSource.title} | Tiny Steps Blog`} description={metaSource.excerpt || ''} canonical={`https://tinystepslearning.com/blog/${slug}`} jsonLd={jsonLd} />
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="text-xs text-primary-600">{metaSource.category || 'Parent Tips'}</div>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">{metaSource.title}</h1>
        <div className="mt-1 text-sm text-gray-600">by {metaSource.author || 'Tiny Steps'} • {metaSource.readTime || '5 min'} • {new Date(metaSource.date || Date.now()).toLocaleDateString()}</div>
        {metaSource.hero && <div className="mt-4 aspect-video w-full rounded-xl bg-slate-100" style={{backgroundImage: `url(${metaSource.hero})`, backgroundSize: 'cover'}} />}

        <article className="prose prose-slate mt-6 max-w-none">
          {post && post.body.map((b, i) => {
            if (b.type === 'h2') return <h2 key={i}>{b.content}</h2>;
            if (b.type === 'h3') return <h3 key={i}>{b.content}</h3>;
            if (b.type === 'li') return <li key={i}>{b.content}</li>;
            return <p key={i}>{b.content}</p>;
          })}
          {MdxComp && <MdxComp />}
        </article>

        <div className="mt-8 flex justify-between text-sm">
          <Link className="text-primary-600" to="/courses">Learn more about our courses →</Link>
          <Link className="text-primary-600" to="/">Book your free class →</Link>
        </div>
      </div>
    </div>
  );
};

export default BlogPostPage;
