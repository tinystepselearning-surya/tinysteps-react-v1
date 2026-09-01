import { useEffect, useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { formatBlogDate } from '../../lib/date';
import { ORGANIZATION_ID, PUBLIC_FACTS, SITE_ORIGIN } from '../../lib/schemas';
import useRevealAnimations from '../../hooks/useRevealAnimations';
import ResearchArticleHero from '../../components/blog/ResearchArticleHero';
import post from '../../content/blog/posts/research/phonics-for-parents-guide';

const ARTICLE_PATH = `/blog/${post.slug}`;
const ARTICLE_URL = `${SITE_ORIGIN}${ARTICLE_PATH}`;
const BLOG_URL = `${SITE_ORIGIN}/blog`;
const EFFECTIVE_DATE = post.modifiedDate || post.date;

const HERO_POINTS = [
  {
    label: 'How phonics works',
    value: 'Hear → map → blend → spell → read',
    detail: 'See how sound–print knowledge becomes decoding, spelling and increasingly fluent connected reading.',
  },
  {
    label: 'What parents should do',
    value: 'Reinforce the taught system',
    detail: 'Use matched practice and print-focused prompts instead of introducing a competing sequence or encouraging guessing.',
  },
  {
    label: 'What progress looks like',
    value: 'Transfer into fresh words and text',
    detail: 'Look beyond rehearsed flashcards and notice whether the child can apply taught knowledge in unfamiliar words and connected reading.',
  },
];

const SEARCH_PAIN_POINTS = [
  'My child knows some sounds but still struggles to read words.',
  'I want to help at home without teaching a different phonics system.',
  'I am not sure when to prompt, correct, or let my child try independently.',
  'I want to know what real phonics progress should look like beyond worksheets.',
];

function slugifyHeading(value: string) {
  return value
    .replace(/\*\*/g, '')
    .replace(/\[[^\]]+\]\([^)]+\)/g, '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section';
}

function renderInline(text: string): ReactNode {
  const nodes: ReactNode[] = [];
  const tokenPattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('**')) {
      nodes.push(
        <strong key={`strong-${match.index}`} className="font-semibold text-slate-900">
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (linkMatch) {
        const [, label, href] = linkMatch;
        if (href.startsWith('/')) {
          nodes.push(
            <Link
              key={`link-${match.index}`}
              to={href}
              className="font-medium text-primary-700 underline decoration-primary-200 underline-offset-4 transition hover:text-primary-900"
            >
              {label}
            </Link>,
          );
        } else {
          nodes.push(
            <a
              key={`link-${match.index}`}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary-700 underline decoration-primary-200 underline-offset-4 transition hover:text-primary-900"
            >
              {label}
            </a>,
          );
        }
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length ? nodes : text;
}

function extractExternalUrls() {
  const urls = new Set<string>();
  const pattern = /\[[^\]]+\]\((https?:\/\/[^)]+)\)/g;

  for (const block of post.body) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(block.content)) !== null) {
      urls.add(match[1]);
    }
    pattern.lastIndex = 0;
  }

  return Array.from(urls);
}

function renderBody() {
  const nodes: ReactNode[] = [];
  let index = 0;

  while (index < post.body.length) {
    const block = post.body[index];

    if (block.type === 'li') {
      const items: typeof post.body = [];
      while (index < post.body.length && post.body[index].type === 'li') {
        items.push(post.body[index]);
        index += 1;
      }

      nodes.push(
        <ul
          key={`list-${index}`}
          className="my-6 space-y-3 rounded-3xl border border-slate-200 bg-slate-50/80 px-6 py-5 text-base leading-7 text-slate-700 sm:text-lg"
        >
          {items.map((item, itemIndex) => (
            <li key={`${item.content}-${itemIndex}`} className="flex gap-3">
              <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-primary-500" aria-hidden="true" />
              <span>{renderInline(item.content)}</span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    if (block.type === 'h2') {
      nodes.push(
        <h2
          key={`h2-${index}`}
          id={slugifyHeading(block.content)}
          className="scroll-mt-28 pt-9 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl"
        >
          {renderInline(block.content)}
        </h2>,
      );
    } else if (block.type === 'h3') {
      nodes.push(
        <h3 key={`h3-${index}`} className="pt-5 text-2xl font-bold tracking-tight text-slate-900">
          {renderInline(block.content)}
        </h3>,
      );
    } else {
      nodes.push(
        <p key={`p-${index}`} className="mt-4 text-base leading-8 text-slate-700 sm:text-lg">
          {renderInline(block.content)}
        </p>,
      );
    }

    index += 1;
  }

  return nodes;
}

export default function PhonicsForParentsResearchPage() {
  useRevealAnimations();

  const headings = useMemo(
    () => post.body.filter((block) => block.type === 'h2').map((block) => ({ id: slugifyHeading(block.content), label: block.content.replace(/\*\*/g, '') })),
    [],
  );
  const externalUrls = useMemo(() => extractExternalUrls(), []);

  const jsonLd = useMemo(() => {
    const schemas: Record<string, unknown>[] = [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: BLOG_URL },
          { '@type': 'ListItem', position: 3, name: post.title, item: ARTICLE_URL },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.metaDescription || post.excerpt,
        datePublished: post.date,
        dateModified: EFFECTIVE_DATE,
        articleSection: post.category,
        image: post.hero ? `${SITE_ORIGIN}${post.hero}` : undefined,
        author: {
          '@type': 'Organization',
          name: post.author,
        },
        publisher: {
          '@id': ORGANIZATION_ID,
          name: PUBLIC_FACTS.organizationName,
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': ARTICLE_URL,
        },
        citation: externalUrls,
      },
    ];

    if (post.faq?.length) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: post.faq.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      });
    }

    return schemas;
  }, [externalUrls]);

  useEffect(() => {
    applySeo({
      title: `${post.title} | Tiny Steps Blog`,
      description: post.metaDescription || post.excerpt,
      canonicalPath: ARTICLE_PATH,
      robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
      ogType: 'article',
      jsonLd,
    });
  }, [jsonLd]);

  return (
    <article className="bg-[linear-gradient(180deg,#fff9f1_0%,#f8fbff_28%,#ffffff_52%,#f8fbff_100%)]">
      <ResearchArticleHero
        eyebrowPrimary="Research Guide"
        eyebrowSecondary="Parent Phonics"
        title={post.title}
        description={post.excerpt}
        dateLabel={formatBlogDate(EFFECTIVE_DATE)}
        readTimeLabel={post.readTime}
        actions={[
          { label: 'Book a free reading assessment', to: '/book-demo' },
          { label: 'Explore phonics classes', to: '/phonics', variant: 'secondary' },
        ]}
        searchPainPoints={SEARCH_PAIN_POINTS}
        heroPoints={HERO_POINTS}
      />

      <div className="mx-auto max-w-7xl px-6 py-10 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-14 lg:py-14">
        <aside className="hidden lg:block">
          <div className="sticky top-28 rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-600">In this guide</p>
            <nav className="mt-5 max-h-[65vh] space-y-3 overflow-y-auto pr-2" aria-label="Article sections">
              {headings.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block text-sm font-medium leading-5 text-slate-600 transition hover:text-primary-700"
                >
                  {item.label}
                </a>
              ))}
              {post.faq?.length ? (
                <a href="#faq" className="block text-sm font-medium text-slate-600 transition hover:text-primary-700">
                  Frequently asked questions
                </a>
              ) : null}
            </nav>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white px-6 py-8 shadow-[0_24px_80px_rgba(15,23,42,0.07)] sm:px-10 sm:py-10 lg:px-12">
            <div className="mb-8 flex flex-wrap items-center gap-3 border-b border-slate-200 pb-6 text-sm text-slate-600">
              <span className="rounded-full bg-primary-50 px-3 py-1 font-semibold text-primary-700">{post.discoveryCategory || post.category}</span>
              <span>By {post.author}</span>
              <span aria-hidden="true">•</span>
              <span>Updated {formatBlogDate(EFFECTIVE_DATE)}</span>
            </div>

            <div data-animate="fade-up" className="max-w-3xl">
              {renderBody()}
            </div>

            {post.faq?.length ? (
              <section id="faq" data-animate="fade-up" className="mt-14 scroll-mt-28 border-t border-slate-200 pt-10">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-600">Parent FAQs</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Frequently asked questions</h2>
                <div className="mt-7 space-y-4">
                  {post.faq.map((faq) => (
                    <details key={faq.question} className="group rounded-3xl border border-slate-200 bg-slate-50/70 px-6 py-5">
                      <summary className="cursor-pointer list-none pr-8 text-lg font-bold text-slate-900 marker:hidden">
                        {faq.question}
                      </summary>
                      <p className="mt-3 text-base leading-7 text-slate-700">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            ) : null}

            <section data-animate="fade-up" className="mt-14 rounded-[2rem] border border-primary-100 bg-primary-50/70 p-7 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-700">Next step</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Use the guide to support the child’s current reading stage</h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-700">
                If you want professional help identifying the right starting point, explore the Tiny Steps phonics pathway or book a free reading assessment.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/phonics" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Explore phonics classes
                </Link>
                <Link to="/book-demo" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400">
                  Book a free assessment
                </Link>
              </div>
            </section>
          </div>
        </main>
      </div>
    </article>
  );
}
