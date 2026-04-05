// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { applySeo } from '../lib/seo';
import { formatBlogDate, isoDateFromYMD } from '../lib/date';
import type { FC } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogPosts } from '../content/blog';
import AboutAuthor from '../components/AboutAuthor';
import ParentsAlsoAsk from '../components/ParentsAlsoAsk';
import ResearchArticleHero from '../components/blog/ResearchArticleHero';
// Meta removed — use applySeo as single source of truth

const CATEGORY_ARTICLE_CONFIG = {
  Phonics: {
    primaryAction: { label: 'Explore Tiny Steps phonics classes', to: '/phonics' },
    secondaryAction: { label: 'Book a free phonics assessment', to: '/?book=1' },
    searchPainPoints: [
      'My child knows letters but still cannot blend words.',
      'I need a simple phonics routine that fits real home life.',
      'Reading practice feels harder than it should at this stage.',
      'I want to know what progress should look like next.',
    ],
    heroPoints: [
      {
        label: 'Best for',
        value: 'Decoding and blending support',
        detail: 'Useful for parents working on sounds, CVC words, tricky words, and calmer reading routines.',
      },
      {
        label: 'Use this when',
        value: 'Reading feels stuck',
        detail: 'A practical route for families who want progress without turning phonics into pressure.',
      },
      {
        label: 'Next best route',
        value: 'Phonics Mission',
        detail: 'Pair this article with the 7-day home phonics plan if you want a stronger weekly routine.',
      },
    ],
    sidebarTitle: 'Need a home phonics plan?',
    sidebarDescription:
      'Use the Parents Hub playbooks for a calmer weekly routine, progress checkpoints, and low-pressure support.',
    sidebarLinks: [
      { label: 'Open phonics mission', to: '/parents/phonics-mission' },
      { label: 'Read at home routine', to: '/parents/reading-at-home' },
      { label: 'Browse phonics classes', to: '/phonics' },
    ],
  },
  Grammar: {
    primaryAction: { label: 'Explore Tiny Steps grammar classes', to: '/grammar' },
    secondaryAction: { label: 'Book a free grammar assessment', to: '/?book=1' },
    searchPainPoints: [
      'My child speaks well but struggles to write clearly.',
      'Grammar practice feels repetitive and does not transfer into writing.',
      'I need a calmer way to improve sentences and paragraph structure.',
      'I want to know what grammar support is worth doing at home.',
    ],
    heroPoints: [
      {
        label: 'Best for',
        value: 'Writing clarity and grammar transfer',
        detail: 'Built for parents supporting sentence construction, tenses, editing, and paragraph habits.',
      },
      {
        label: 'Use this when',
        value: 'Writing feels messy or inconsistent',
        detail: 'Helpful when spoken English is stronger than written accuracy or structure.',
      },
      {
        label: 'Next best route',
        value: 'Parents Hub playbooks',
        detail: 'Use the parent guides when you want support routines without nagging or over-correcting.',
      },
    ],
    sidebarTitle: 'Need a steadier writing routine?',
    sidebarDescription:
      'Use the parent support guides when homework, grammar practice, or writing confidence needs structure.',
    sidebarLinks: [
      { label: 'Help with homework', to: '/parents/helping-with-homework' },
      { label: 'Track progress at home', to: '/parents/tracking-progress' },
      { label: 'Browse grammar classes', to: '/grammar' },
    ],
  },
  'Public Speaking': {
    primaryAction: { label: 'Explore Tiny Steps speaking classes', to: '/speaking' },
    secondaryAction: { label: 'Book a free speaking assessment', to: '/?book=1' },
    searchPainPoints: [
      'My child talks at home but freezes in class or with relatives.',
      'Speaking practice turns into pressure too quickly.',
      'I need a calm plan for confidence, not forced performance.',
      'I want to help without making my child more self-conscious.',
    ],
    heroPoints: [
      {
        label: 'Best for',
        value: 'Confidence, fluency, and voice structure',
        detail: 'Designed for shy speakers, reluctant responders, and children building presentation habits.',
      },
      {
        label: 'Use this when',
        value: 'Speaking feels uneven',
        detail: 'Useful when a child can talk in some settings but goes quiet in others.',
      },
      {
        label: 'Next best route',
        value: 'Speaking confidence support',
        detail: 'Pair this with the parent confidence playbook if you want gentle scripts and low-pressure follow-through.',
      },
    ],
    sidebarTitle: 'Need calmer speaking support?',
    sidebarDescription:
      'Use the parent playbooks when your child needs confidence-building routines, scripts, and realistic practice.',
    sidebarLinks: [
      { label: 'Open speaking confidence guide', to: '/parents/speech-confidence' },
      { label: 'Read the Parents Hub', to: '/parents' },
      { label: 'Browse speaking classes', to: '/speaking' },
    ],
  },
  'Parent Tips': {
    primaryAction: { label: 'Explore the Parents Hub', to: '/parents' },
    secondaryAction: { label: 'Book a free assessment', to: '/?book=1' },
    searchPainPoints: [
      'I want a routine that actually works in a busy family schedule.',
      'I need practical next steps instead of more generic parenting advice.',
      'I want to help at home without turning practice into conflict.',
      'I need clarity on what to do this week, not a long theory lesson.',
    ],
    heroPoints: [
      {
        label: 'Best for',
        value: 'Real home routines',
        detail: 'Built for families juggling reading, school, grammar, speaking, and screen-time decisions.',
      },
      {
        label: 'Use this when',
        value: 'You need the next right move',
        detail: 'Helpful for busy parents who want a realistic plan they can use this week.',
      },
      {
        label: 'Next best route',
        value: 'Parents Help Hub',
        detail: 'Use the broader parent guides when you want age-based routines and route-specific support.',
      },
    ],
    sidebarTitle: 'Need a more guided next step?',
    sidebarDescription:
      'Use the parent support hub for routines, progress guidance, and the most relevant next playbook.',
    sidebarLinks: [
      { label: 'Open the Parents Hub', to: '/parents' },
      { label: 'Track progress at home', to: '/parents/tracking-progress' },
      { label: 'Book a free assessment', to: '/?book=1' },
    ],
  },
  Research: {
    primaryAction: { label: 'Explore the Parents Hub', to: '/parents' },
    secondaryAction: { label: 'Book a free assessment', to: '/?book=1' },
    searchPainPoints: [
      'I want the research summary, not just general advice.',
      'I need guidance that still works in real homes and classrooms.',
      'I am comparing what evidence says with what parents can actually do.',
      'I want a route that is practical, calm, and measurable.',
    ],
    heroPoints: [
      {
        label: 'Best for',
        value: 'Evidence-backed parent guidance',
        detail: 'Useful when you want research translated into home actions and realistic class decisions.',
      },
      {
        label: 'Use this when',
        value: 'You want depth with clarity',
        detail: 'A stronger fit for parents looking for explanations, routines, and decision support together.',
      },
      {
        label: 'Next best route',
        value: 'Parents Hub + roadmap posts',
        detail: 'Use the guides and route-specific articles when you want to turn research into a weekly plan.',
      },
    ],
    sidebarTitle: 'Need the practical route after the research?',
    sidebarDescription:
      'Use the Parents Hub and weekly roadmaps when you want to apply the ideas in a calmer weekly routine.',
    sidebarLinks: [
      { label: 'Explore the Parents Hub', to: '/parents' },
      { label: 'Read the phonics guide', to: '/blog/phonics-for-parents-guide' },
      { label: 'Book a free assessment', to: '/?book=1' },
    ],
  },
};

function truncate(s: string, n: number) {
  if (s.length <= n) return s;
  const trimmed = s.slice(0, n);
  const lastSpace = trimmed.lastIndexOf(' ');
  if (lastSpace > Math.floor(n * 0.6)) return trimmed.slice(0, lastSpace) + '…';
  return trimmed + '…';
}

function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'section';
}

function buildHeadingMeta(blocks: Array<{ type: string; content: string }> = []) {
  const counts = new Map<string, number>();

  return blocks
    .filter((block) => block.type === 'h2' || block.type === 'h3')
    .map((block) => {
      const baseId = slugifyHeading(block.content || 'section');
      const currentCount = counts.get(baseId) || 0;
      counts.set(baseId, currentCount + 1);

      return {
        id: currentCount === 0 ? baseId : `${baseId}-${currentCount + 1}`,
        title: block.content,
        level: block.type,
      };
    });
}

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
        url: 'https://tinystepslearning.com/logo-square.webp',
      },
    };

    // Speakable schema for voice search + assistant integrations
    const speakableText = buildMetaDescription(metaSource) || metaSource.title || '';
    if (speakableText) {
      obj.speakable = {
        '@type': 'SpeakableSpecification',
        cssSelector: ['.ts-blog-hero-title', '.ts-blog-quick-answer'],
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

  const categoryConfig = CATEGORY_ARTICLE_CONFIG[metaSource.category] || CATEGORY_ARTICLE_CONFIG['Parent Tips'];
  const weekMatch = String(metaSource.title || '').match(/^Week\s+(\d+)/i);
  const eyebrowPrimary = weekMatch ? `Week ${weekMatch[1]} Roadmap` : metaSource.category || 'Parent Guide';
  const eyebrowSecondary = (metaSource.category || 'Parent Guide').replace(/\s+/g, ' ');
  const heroSearchPainPoints =
    Array.isArray(post?.faq) && post.faq.length > 0
      ? post.faq.slice(0, 4).map((item) => item.question)
      : categoryConfig.searchPainPoints;
  const heroDescription = metaSource.metaDescription || metaSource.excerpt || buildMetaDescription(metaSource);
  const headingItems = useMemo(() => buildHeadingMeta(post?.body || []), [post]);
  const articleNodes = useMemo(() => {
    if (!post) return MdxComp ? <MdxComp /> : null;

    const nodes: any[] = [];
    const blocks = post.body || [];
    let headingIndex = 0;

    for (let i = 0; i < blocks.length; i += 1) {
      const block = blocks[i];

      if (block.type === 'h2' || block.type === 'h3') {
        const heading = headingItems[headingIndex];
        headingIndex += 1;
        const Tag = block.type;
        nodes.push(
          <Tag
            key={`${block.type}-${i}`}
            id={heading?.id}
            className="scroll-mt-28"
          >
            {block.content}
          </Tag>,
        );
        continue;
      }

      if (block.type === 'li') {
        const items: any[] = [];
        let j = i;

        for (; j < blocks.length && blocks[j].type === 'li'; j += 1) {
          items.push(blocks[j].content);
        }

        const ulKey = `ul-${slug || (post && post.slug) || i}-${i}`;
        nodes.push(
          <ul key={ulKey}>
            {items.map((txt, k) => (
              <li key={`${ulKey}-li-${k}`}>{txt}</li>
            ))}
          </ul>,
        );
        i = j - 1;
        continue;
      }

      nodes.push(<p key={`p-${i}`}>{block.content}</p>);
    }

    if (MdxComp) {
      nodes.push(<MdxComp key="mdx-comp" />);
    }

    return nodes;
  }, [MdxComp, headingItems, post, slug]);

  if (!post && !MdxComp) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20">
        <h1 className="text-2xl font-bold">Article not found</h1>
        <p className="mt-2"><Link className="text-primary-600" to="/blog">Back to blog</Link></p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6eee3_0%,#fbfaf7_22%,#ffffff_48%,#f4f8fc_100%)] text-slate-900">
      <ResearchArticleHero
        eyebrowPrimary={eyebrowPrimary}
        eyebrowSecondary={eyebrowSecondary}
        title={metaSource.title}
        description={heroDescription}
        authorLabel={metaSource.author === 'Priya' ? 'Priya • Tiny Steps Founder' : metaSource.author || 'Tiny Steps Learning'}
        dateLabel={formatBlogDate(metaSource.date)}
        readTimeLabel={metaSource.readTime || '5 min read'}
        actions={[categoryConfig.primaryAction, categoryConfig.secondaryAction]}
        searchPainPoints={heroSearchPainPoints}
        heroPoints={categoryConfig.heroPoints}
      />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6">
          <Link to="/blog" className="inline-flex items-center text-sm font-semibold text-primary-700">← Back to Blogs</Link>
        </div>

        <section className={`grid gap-6 ${metaSource.hero ? 'xl:grid-cols-[minmax(0,1.12fr)_360px]' : ''}`}>
          {metaSource.hero ? (
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
              <img
                src={metaSource.hero}
                alt={metaSource.title}
                className="aspect-[1.68/1] w-full bg-slate-100 object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
          ) : null}

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">Article snapshot</p>
            <div className="mt-4 rounded-[1.6rem] border border-slate-200 bg-[linear-gradient(135deg,#fff5e7,#eef6ff)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Quick answer</p>
              <p className="ts-blog-quick-answer mt-3 text-base leading-8 text-slate-700">
                {metaSource.excerpt || buildMetaDescription(metaSource)}
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Category</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{metaSource.category || 'Parent Tips'}</p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Best next move</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">{categoryConfig.sidebarDescription}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-10 grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-8">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">Quick answer</p>
              <h2 className="ts-blog-hero-title mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                {metaSource.title}
              </h2>
              <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-700">
                {heroDescription}
              </p>
            </section>

            <article className="rounded-[2rem] border border-slate-200 bg-white px-6 py-8 shadow-[0_24px_60px_rgba(15,23,42,0.06)] sm:px-8">
              <div className="prose prose-slate prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tight prose-h2:mt-14 prose-h2:text-4xl prose-h2:text-slate-950 prose-h3:mt-8 prose-h3:text-2xl prose-h3:text-slate-900 prose-p:text-[1.04rem] prose-p:leading-8 prose-p:text-slate-700 prose-ul:my-6 prose-li:my-2 prose-li:text-slate-700">
                {articleNodes}
              </div>
            </article>

            {post?.faq?.length ? <ParentsAlsoAsk items={post.faq} /> : null}

            <section className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#101828,#1b2a46)] px-6 py-8 text-white shadow-[0_28px_80px_rgba(15,23,42,0.18)] sm:px-8">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">Explore Tiny Steps classes</p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight">Turn this article into a clearer plan for your child</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
                    Choose a program aligned to your child&apos;s current stage in phonics, grammar, or speaking confidence.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 lg:justify-end">
                  <Link to="/phonics" className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">phonics classes for kids</Link>
                  <Link to="/grammar" className="inline-flex items-center rounded-full border border-white/18 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15">grammar classes for kids</Link>
                  <Link to="/speaking" className="inline-flex items-center rounded-full border border-white/18 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15">public speaking classes for kids</Link>
                </div>
              </div>
            </section>

            <AboutAuthor variant={metaSource.category === 'Research' ? 'research' : 'standard'} />

            <section className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#fff8ef_0%,#f6faff_100%)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">Parents Help Hub</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Need the step-by-step version for home?</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                Use the Parents Help Hub when you want a routine, a practical weekly plan, or a calmer next step matched to your child&apos;s current blocker.
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
                <Link to="/parents" className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-white transition hover:bg-slate-800">View all parent guides</Link>
                <Link to="/parents/getting-started" className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-3 text-slate-900 transition hover:bg-slate-50">Getting started with phonics</Link>
                <Link to="/parents/reading-at-home" className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-3 text-slate-900 transition hover:bg-slate-50">10-minute reading routine</Link>
                <Link to="/parents/phonics-mission" className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-3 text-slate-900 transition hover:bg-slate-50">Phonics Mission plan</Link>
              </div>
            </section>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            {headingItems.length ? (
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">On this page</p>
                <nav className="mt-5 space-y-3">
                  {headingItems.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block text-sm leading-6 transition hover:text-primary-700 ${
                        item.level === 'h3' ? 'pl-4 text-slate-500' : 'font-semibold text-slate-900'
                      }`}
                    >
                      {item.title}
                    </a>
                  ))}
                </nav>
              </div>
            ) : null}

            <div className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#fff5e7,#eef6ff)] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{categoryConfig.sidebarTitle}</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">{categoryConfig.sidebarDescription}</p>
              <div className="mt-5 space-y-3">
                {categoryConfig.sidebarLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.to}
                    className="block rounded-[1.25rem] border border-white/80 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default BlogPostPage;
