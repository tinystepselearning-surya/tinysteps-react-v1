// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { applySeo } from '../lib/seo';
import { formatBlogDate, isoDateFromYMD } from '../lib/date';
import type { FC } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogPosts } from '../content/blog';
import AboutAuthor from '../components/AboutAuthor';
import ParentsAlsoAsk from '../components/ParentsAlsoAsk';
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
function truncate(s: string, n: number) {
  if (s.length <= n) return s;
  const trimmed = s.slice(0, n);
  const lastSpace = trimmed.lastIndexOf(' ');
  if (lastSpace > Math.floor(n * 0.6)) return trimmed.slice(0, lastSpace) + '…';
  return trimmed + '…';
}

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
    const obj: any = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: metaSource.title,
      // Use Person when author provided, else use Organization as site author
      author: metaSource.author
        ? { '@type': 'Person', name: metaSource.author }
        : { '@type': 'Organization', name: 'Tiny Steps Learning' },
      // Add dates only when present in metadata (do not invent dates)
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

    if (metaSource.date) {
      try {
        obj.datePublished = isoDateFromYMD(metaSource.date);
        // dateModified: prefer explicit modified date, else reuse published if available
        if (metaSource.modifiedDate) obj.dateModified = isoDateFromYMD(metaSource.modifiedDate);
        else obj.dateModified = isoDateFromYMD(metaSource.date);
      } catch (e) {
        // if conversion fails, omit dates rather than inventing
      }
    }

    // Publisher information (use existing site identity/logo if present)
    obj.publisher = {
      '@type': 'Organization',
      name: 'Tiny Steps Learning',
      logo: {
        '@type': 'ImageObject',
        url: 'https://tinystepslearning.com/logo.png',
      },
    };

    // Speakable schema for voice search + assistant integrations
    const speakableText = buildMetaDescription(metaSource) || metaSource.title || '';
    if (speakableText) {
      obj.speakable = {
        '@type': 'SpeakableSpecification',
        cssSelector: ['article h1', 'article > p:first-of-type'],
        xpath: ['/html/body/article/h1', '/html/body/article/p[1]'],
      };
    }

    return obj;
  }, [post, metaSource]);

  const faqSchema = useMemo(() => {
    if (!post?.faq?.length) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: post.faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    };
  }, [post]);

  const jsonLd = useMemo(() => {
    const blocks: any[] = [];
    blocks.push(breadcrumbSchema);
    if (articleSchema) blocks.push(articleSchema);
    if (faqSchema) blocks.push(faqSchema);
    return blocks;
  }, [breadcrumbSchema, articleSchema, faqSchema]);

  useEffect(() => {
    if (!slug) return;
    const canonical = `/blog/${slug}`;
    const source = metaSource || {};
    const isArticle = Boolean(source.title || post);
    const todayIso = new Date().toISOString().slice(0, 10);
    const isFutureDated = Boolean(source.date && String(source.date) > todayIso);

    if (!isArticle) {
      applySeo({
        title: 'Article not found | Tiny Steps Blog',
        description: 'The article you requested is not available.',
        canonicalPath: canonical,
        robots: 'noindex, follow',
        ogType: 'website',
      });
      return;
    }

    const title = `${source.title} | Tiny Steps Blog`;
    const description = buildMetaDescription(source) || 'Tiny Steps Learning blog post.';

    applySeo({
      title,
      description,
      canonicalPath: canonical,
      ogType: 'article',
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
        {metaSource.hero && (
          <img 
            src={metaSource.hero} 
            alt={metaSource.title}
            className="mt-4 w-full rounded-xl bg-slate-100 object-cover aspect-video"
            loading="lazy"
          />
        )}

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

        <section className="mt-10 px-0">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h2 className="text-xl font-semibold">Explore Tiny Steps classes</h2>
              <p className="mt-1 text-sm text-gray-700">Choose a program aligned to your child’s goals and level.</p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
                <Link to="/phonics" className="text-primary-600">phonics classes for kids</Link>
                <Link to="/grammar" className="text-primary-600">grammar classes for kids</Link>
                <Link to="/speaking" className="text-primary-600">public speaking classes for kids</Link>
              </div>
            </div>
          </div>
        </section>

        {/* About the Author section */}
        <AboutAuthor />

        {/* Parents Help Hub cross-link block (small, minimal) */}
        <section className="mt-10 px-0">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="text-xl font-semibold">Parents Help Hub</h2>
              <p className="mt-1 text-sm text-gray-700">Need a step-by-step plan at home? Use our parent guides (ages 3–12).</p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <Link to="/parents" className="text-primary-600 font-medium">View all parent guides</Link>
                {
                  // map some post slugs to the most relevant guide
                }
                {(() => {
                  const guideMap: Record<string, string> = {
                    'week-1-phonics-satpin-launch': '/parents/getting-started',
                    'week-2-phonics-blending-club': '/parents/phonics-mission',
                    'week-3-phonics-tricky-words': '/parents/common-mistakes',
                  };
                  const mapped = guideMap[slug || ''];
                  if (mapped) return <Link to={mapped} className="text-primary-600">Most relevant guide</Link>;
                  // fallback: show three helpful guides
                  return (
                    <>
                      <Link to="/parents/getting-started" className="text-primary-600">Getting started with phonics at home</Link>
                      <Link to="/parents/reading-at-home" className="text-primary-600">10-minute daily reading routine</Link>
                      <Link to="/parents/phonics-mission" className="text-primary-600">How to use Phonics Mission games</Link>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 flex justify-between text-sm">
          <Link className="text-primary-600" to="/courses">Learn more about our courses →</Link>
          <Link className="text-primary-600" to="/?book=1">Book your free class →</Link>
        </div>
      </div>
    </div>
  );
};

export default BlogPostPage;
