// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { applySeo } from '../lib/seo';
import { formatBlogDate, isoDateFromYMD } from '../lib/date';
import type { FC } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogPosts } from '../content/blog';
// Meta removed — use applySeo as single source of truth

const BlogPostPage: FC = () => {
  const { slug } = useParams();
  const post = useMemo(() => blogPosts.find((p) => p.slug === slug), [slug]);
  const [MdxComp, setMdxComp] = useState<any>(null);
  const [mdxMeta, setMdxMeta] = useState<any>(null);
  useEffect(() => {
    (async () => {
      if (!post || !slug) return;
      try {
        // const mod: any = await import(`../content/blog/${slug}.mdx`);
        // setMdxComp(() => mod.default);
        // setMdxMeta(mod.meta || {});
      } catch (e) {
        // not mdx
      }
    })();
  }, [slug, post]);

  // hooks must run before any early returns
  const metaSource = useMemo(() => post || mdxMeta || {}, [post, mdxMeta]);

  // Small helper: derive a safe meta description (150-160 chars) from post data
  function buildMetaDescription(src: any) {
    if (!src) return '';
    const raw = src.metaDescription || src.excerpt;
    if (raw && typeof raw === 'string' && raw.trim().length > 0) {
      return truncate(raw.trim(), 155);
    }

    // Try to extract first paragraph from body (if present)
    const body = src.body;
    if (Array.isArray(body)) {
      for (const b of body) {
        if (b && (b.type === 'p' || b.type === 'para' || b.type === undefined) && typeof b.content === 'string' && b.content.trim()) {
          return truncate(b.content.trim(), 155);
        }
      }
    }

    // fallback to title
    if (src.title) return truncate(src.title, 155);
    return '';
  }

  function truncate(s: string, n: number) {
    if (s.length <= n) return s;
    const trimmed = s.slice(0, n);
    const lastSpace = trimmed.lastIndexOf(' ');
    if (lastSpace > Math.floor(n * 0.6)) return trimmed.slice(0, lastSpace) + '…';
    return trimmed + '…';
  }

  const breadcrumbSchema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://tinystepslearning.com/blog' },
      { '@type': 'ListItem', position: 3, name: metaSource.title || 'Article', item: `https://tinystepslearning.com/blog/${slug}` },
    ],
  }), [metaSource, slug]);

  const articleSchema = useMemo(() => {
    if (!post && !metaSource) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: metaSource.title,
      author: { '@type': 'Person', name: metaSource.author || 'Tiny Steps' },
      datePublished: metaSource.date ? isoDateFromYMD(metaSource.date) : new Date().toISOString(),
      // Prefer absolute hero URL when available; fall back to site origin if running in browser.
      image: metaSource.hero ? (metaSource.hero.startsWith('http') ? metaSource.hero : `https://tinystepslearning.com${metaSource.hero}`) : undefined,
      description: buildMetaDescription(metaSource) || undefined,
      articleSection: metaSource.category || undefined,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://tinystepslearning.com/blog/${slug}`,
      },
      wordCount: post && Array.isArray(post.body) ? post.body.map((b) => (b.content || '')).join('\n').split(/\s+/).length : 2500,
      articleBody: post ? post.body.map((b) => b.content).join('\n') : '',
    };
  }, [post, metaSource]);

  const jsonLd = useMemo(() => {
    const blocks: any[] = [];
    blocks.push(breadcrumbSchema);
    if (articleSchema) blocks.push(articleSchema);
    return blocks;
  }, [breadcrumbSchema, articleSchema]);

  useEffect(() => {
    if (!slug) return;
    const canonical = `/blog/${slug}`;

    const source = metaSource || {};
    const title = source.title ? `${source.title} | Tiny Steps Blog` : 'Blog | Tiny Steps Blog';
    const description = buildMetaDescription(source) || 'Tiny Steps Learning blog post.';
    const isArticle = Boolean(source.title || post);

    applySeo({
      title,
      description,
      canonicalPath: isArticle ? canonical : '/blog',
      ogType: isArticle ? 'article' : 'website',
      jsonLd,
    });
  }, [slug, metaSource, jsonLd, breadcrumbSchema, post]);

  if (!post && !MdxComp) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20">
        <h1 className="text-2xl font-bold">Article not found</h1>
        <p className="mt-2"><Link className="text-primary-600" to="/blog">Back to blog</Link></p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Meta removed — SEO handled by applySeo in useEffect */}
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-4">
          <Link to="/blog" className="inline-flex items-center text-primary-600 text-sm">← Back to Blogs</Link>
        </div>
        <div className="text-xs text-primary-600">{metaSource.category || 'Parent Tips'}</div>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">{metaSource.title}</h1>
        <div className="mt-1 text-sm text-gray-600">by {metaSource.author || 'Tiny Steps'} • {metaSource.readTime || '5 min'} • {formatBlogDate(metaSource.date)}</div>
        {metaSource.hero && <div className="mt-4 aspect-video w-full rounded-xl bg-slate-100" style={{backgroundImage: `url(${metaSource.hero})`, backgroundSize: 'cover'}} />}

        <article className="prose prose-slate mt-6 max-w-none">
          {post && (() => {
            const nodes: any[] = [];
            const blocks = post.body || [];
            for (let i = 0; i < blocks.length; i += 1) {
              const b = blocks[i];
              if (b.type === 'h2') {
                nodes.push(<h2 key={`h2-${i}`}>{b.content}</h2>);
                continue;
              }
              if (b.type === 'h3') {
                nodes.push(<h3 key={`h3-${i}`}>{b.content}</h3>);
                continue;
              }

              if (b.type === 'li') {
                // collect consecutive li items
                const items: any[] = [];
                let j = i;
                for (; j < blocks.length && blocks[j].type === 'li'; j += 1) {
                  items.push(blocks[j].content);
                }
                // render a single ul for this run
                const ulKey = `ul-${slug || (post && post.slug) || i}-${i}`;
                nodes.push(
                  <ul key={ulKey}>
                    {items.map((txt, k) => (
                      <li key={`${ulKey}-li-${k}`}>{txt}</li>
                    ))}
                  </ul>
                );
                // advance the outer loop to the last consumed li (j-1), outer loop will i++ so set i = j-1
                i = j - 1;
                continue;
              }

              // default paragraph
              nodes.push(<p key={`p-${i}`}>{b.content}</p>);
            }

            return nodes;
          })()}
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
