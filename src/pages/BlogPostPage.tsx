// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { applySeo } from '../lib/seo';
import { formatBlogDate, isoDateFromYMD } from '../lib/date';
import type { FC } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogPosts } from '../content/blog';
import { ORGANIZATION_ID, PUBLIC_FACTS, SITE_ORIGIN } from '../lib/schemas';
import AboutAuthor from '../components/AboutAuthor';
import ParentsAlsoAsk from '../components/ParentsAlsoAsk';
import ResearchArticleHero from '../components/blog/ResearchArticleHero';
// Meta removed — use applySeo as single source of truth

const FOUNDER_AUTHOR_NAME = 'Priya';
const TEAM_AUTHOR_LABEL = 'Tiny Steps Academic Team';

const isFounderAuthor = (author: unknown): boolean =>
  String(author || '').trim().toLowerCase() === FOUNDER_AUTHOR_NAME.toLowerCase();

const getArticleAuthorLabel = (author: unknown): string =>
  isFounderAuthor(author)
    ? `${FOUNDER_AUTHOR_NAME} • Founder, ${PUBLIC_FACTS.brandName}`
    : TEAM_AUTHOR_LABEL;

const CATEGORY_ARTICLE_CONFIG = {
  Phonics: {
    primaryAction: { label: 'Explore Tiny Steps phonics classes', to: '/phonics' },
    secondaryAction: { label: 'Book a free phonics assessment', to: '/?book=1' },
    learningPathIntro:
      'Continue with a structured phonics pathway, or review the full learning roadmap before choosing the next program.',
    learningPathLinks: [
      { label: 'Structured phonics program', to: '/phonics' },
      { label: 'Full learning roadmap', to: '/curriculum' },
      { label: 'Choose the right course', to: '/courses' },
    ],
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
    learningPathIntro:
      'Move from grammar confusion to clearer sentence-building with the right grammar path and a stage-wise curriculum view.',
    learningPathLinks: [
      { label: 'Grammar learning path', to: '/grammar' },
      { label: 'Full learning roadmap', to: '/curriculum' },
      { label: 'Choose the right course', to: '/courses' },
    ],
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
        detail: 'Helpful when speaking confidence is stronger than written accuracy or structure.',
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
    learningPathIntro:
      'Support communication confidence with a speaking-focused route, then map the next stage in the wider curriculum.',
    learningPathLinks: [
      { label: 'Speaking confidence program', to: '/speaking' },
      { label: 'Full learning roadmap', to: '/curriculum' },
      { label: 'Choose the right course', to: '/courses' },
    ],
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
    learningPathIntro:
      'When you are deciding the next step, use the course chooser and curriculum roadmap to match support to your child’s current need.',
    learningPathLinks: [
      { label: 'Choose the right course', to: '/courses' },
      { label: 'Full learning roadmap', to: '/curriculum' },
    ],
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
    learningPathIntro:
      'Turn research takeaways into action with a clear course-selection route and a connected curriculum pathway.',
    learningPathLinks: [
      { label: 'Choose the right course', to: '/courses' },
      { label: 'Full learning roadmap', to: '/curriculum' },
    ],
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

const POST_CTA_OVERRIDES: Record<string, {
  primaryAction?: {
    label: string;
    to: string;
  };
  learningPathIntro?: string;
  learningPathLinks?: Array<{
    label: string;
    to: string;
  }>;
  suppressCoursesFallback?: boolean;
}> = {
  'child-knows-abc-but-cannot-read': {
    primaryAction: { label: 'Explore Tiny Steps phonics classes', to: '/phonics' },
    learningPathIntro:
      'For this decoding gap, start with the structured phonics pathway and keep one steady routine for the next few weeks.',
    learningPathLinks: [{ label: 'Structured phonics program', to: '/phonics' }],
    suppressCoursesFallback: true,
  },
  'what-is-phonics-for-kids': {
    primaryAction: { label: 'Explore Tiny Steps phonics classes', to: '/phonics' },
    learningPathIntro:
      'If you are starting phonics now, use one structured phonics route first before adding broader program decisions.',
    learningPathLinks: [{ label: 'Structured phonics program', to: '/phonics' }],
    suppressCoursesFallback: true,
  },
  'week-23-grammar-speaking-bridge': {
    primaryAction: { label: 'Explore Tiny Steps grammar classes', to: '/grammar' },
    learningPathIntro:
      'When spoken ideas are stronger than writing, the next best move is a grammar path focused on sentence-building and written expression.',
    learningPathLinks: [{ label: 'Grammar learning path', to: '/grammar' }],
    suppressCoursesFallback: true,
  },
  'online-english-classes-for-kids-india': {
    primaryAction: { label: 'Choose the right course', to: '/courses' },
    learningPathIntro:
      'Use the course chooser to match your child’s current bottleneck to the right starting program.',
    learningPathLinks: [{ label: 'Course chooser', to: '/courses' }],
    suppressCoursesFallback: true,
  },
  'engage-children-phonics-grammar-speaking-at-home': {
    primaryAction: { label: 'Choose the right course', to: '/courses' },
    learningPathIntro:
      'If your child needs structured support across phonics, grammar, and speaking, use the course chooser to pick one clear starting route.',
    learningPathLinks: [
      { label: 'Course chooser', to: '/courses' },
      { label: 'Book a free assessment', to: '/?book=1' },
    ],
    suppressCoursesFallback: true,
  },
  'june-school-reopening-english-readiness-plan': {
    primaryAction: { label: 'Book a June readiness assessment', to: '/?book=1' },
    learningPathIntro:
      'Before school reopens, use a short structured pathway to refresh phonics, grammar, reading, and speaking with clear weekly goals.',
    learningPathLinks: [
      { label: 'Start 2-week refreshment route', to: '/courses' },
      { label: 'Check English readiness now', to: '/contact' },
    ],
    suppressCoursesFallback: true,
  },
  'phonics-grammar-speaking-connected-english-communication': {
    primaryAction: { label: 'Explore integrated course options', to: '/courses' },
    learningPathIntro:
      'When reading, grammar, and speaking gaps appear together, an integrated English pathway helps children apply all three skills in real communication.',
    learningPathLinks: [
      { label: 'View curriculum roadmap', to: '/curriculum' },
      { label: 'Why parents choose Tiny Steps', to: '/why-tiny-steps' },
    ],
    suppressCoursesFallback: true,
  },
  'how-to-choose-phonics-classes': {
    primaryAction: { label: 'Explore Tiny Steps phonics classes', to: '/phonics' },
    learningPathIntro:
      'For this decision, focus on one phonics pathway with clear stage-fit and measurable decoding progress.',
    learningPathLinks: [{ label: 'Structured phonics program', to: '/phonics' }],
    suppressCoursesFallback: true,
  },
  'week-17-grammar-assessment': {
    primaryAction: { label: 'Explore Tiny Steps grammar classes', to: '/grammar' },
    learningPathIntro:
      'After assessment, move into one grammar pathway that targets sentence accuracy and writing clarity in sequence.',
    learningPathLinks: [{ label: 'Grammar learning path', to: '/grammar' }],
    suppressCoursesFallback: true,
  },
  'week-12-speaking-confidence-seeds': {
    primaryAction: { label: 'Explore Tiny Steps speaking classes', to: '/speaking' },
    learningPathIntro:
      'When confidence is the core gap, continue with one speaking pathway built around guided stages and low-pressure practice.',
    learningPathLinks: [{ label: 'Speaking confidence program', to: '/speaking' }],
    suppressCoursesFallback: true,
  },
  'week-18-speaking-video-feedback': {
    primaryAction: { label: 'Explore Tiny Steps speaking classes', to: '/speaking' },
    learningPathIntro:
      'Use one speaking pathway to turn gentle feedback into steady confidence and clearer speaking habits.',
    learningPathLinks: [{ label: 'Speaking confidence program', to: '/speaking' }],
    suppressCoursesFallback: true,
  },
  'week-21-speaking-competition-prep': {
    primaryAction: { label: 'Explore Tiny Steps speaking classes', to: '/speaking' },
    learningPathIntro:
      'Competition preparation works best with one speaking pathway that builds stage comfort, expression, and confidence step by step.',
    learningPathLinks: [{ label: 'Speaking confidence program', to: '/speaking' }],
    suppressCoursesFallback: true,
  },
  'week-20-grammar-editing-camp': {
    primaryAction: { label: 'Explore Tiny Steps grammar classes', to: '/grammar' },
    learningPathIntro:
      'When editing is the bottleneck, continue with one grammar pathway focused on sentence quality and writing clarity.',
    learningPathLinks: [{ label: 'Grammar learning path', to: '/grammar' }],
    suppressCoursesFallback: true,
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

function renderInlineContent(text: string) {
  if (typeof text !== 'string' || text.length === 0) return text;

  const nodes: any[] = [];
  const pattern = /\[([^\]]+)\]\((\/[a-z0-9][^)\s]*|https?:\/\/[^)\s]+)\)/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const [raw, label, href] = match;
    const start = match.index;

    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }

    if (href.startsWith('/')) {
      nodes.push(
        <Link key={`inline-link-${start}-${href}`} to={href} className="text-slate-900 underline hover:text-sky-700">
          {label}
        </Link>,
      );
    } else {
      nodes.push(
        <a
          key={`inline-link-${start}-${href}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-900 underline hover:text-sky-700"
        >
          {label}
        </a>,
      );
    }

    lastIndex = start + raw.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length ? nodes : text;
}

const PHONICS_ROUTE = {
  label: 'Online Phonics Classes',
  to: '/phonics',
};

const GRAMMAR_ROUTE = {
  label: 'Grammar & Sentence Formation',
  to: '/grammar',
};

const SPEAKING_ROUTE = {
  label: 'Communication & Public Speaking',
  to: '/speaking',
};

const GENERIC_ROUTE = {
  label: 'Find the Right Course',
  to: '/courses',
};

const PHONICS_KEYWORDS = ['phonics', 'reading', 'blend', 'cvc', 'vowel', 'digraph', 'spelling', 'sight words'];
const GRAMMAR_KEYWORDS = ['grammar', 'sentence', 'writing', 'noun', 'verb', 'tense', 'punctuation', 'paragraph'];
const SPEAKING_KEYWORDS = ['speaking', 'communication', 'confidence', 'public speaking', 'shy', 'one-word', 'answers'];

function hasAnyKeyword(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function resolveNextStepRoute(params: { category?: unknown; slug?: unknown; title?: unknown }) {
  const category = String(params.category || '').toLowerCase();
  if (category.includes('phonics')) return PHONICS_ROUTE;
  if (category.includes('grammar')) return GRAMMAR_ROUTE;
  if (
    category.includes('public speaking')
    || category.includes('speaking')
    || category.includes('communication')
  ) {
    return SPEAKING_ROUTE;
  }

  const classifierText = `${String(params.slug || '')} ${String(params.title || '')}`.toLowerCase();
  if (hasAnyKeyword(classifierText, PHONICS_KEYWORDS)) return PHONICS_ROUTE;
  if (hasAnyKeyword(classifierText, GRAMMAR_KEYWORDS)) return GRAMMAR_ROUTE;
  if (hasAnyKeyword(classifierText, SPEAKING_KEYWORDS)) return SPEAKING_ROUTE;
  return GENERIC_ROUTE;
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

function normalizeEyebrowLabel(value: string) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function deriveEyebrowSecondaryLabel(title: string, category: string, isWeekRoadmap: boolean) {
  const safeTitle = String(title || '');
  const safeCategory = String(category || 'Parent Guide');

  if (/parent\s+guide/i.test(safeTitle)) return 'Parent Guide';
  if (/readiness/i.test(safeTitle)) return 'Reading Readiness';
  if (/method\s+comparison|comparison|vs\.?/i.test(safeTitle)) return 'Method Comparison';
  if (/checklist/i.test(safeTitle)) return 'Checklist';
  if (/faq/i.test(safeTitle)) return 'FAQ';
  if (/research/i.test(safeTitle) || /research/i.test(safeCategory)) return 'Research Guide';

  if (isWeekRoadmap) return safeCategory;
  return '';
}

const BlogPostPage: FC = () => {
  const { slug } = useParams();
  const post = useMemo(() => blogPosts.find((p) => p.slug === slug), [slug]);
  const isStoryUnderstandingPillar = slug === 'why-child-reads-words-but-does-not-understand-story';
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

  const canonicalArticleUrl = useMemo(
    () => `${SITE_ORIGIN}/blog/${slug || metaSource.slug || ''}`,
    [metaSource.slug, slug],
  );

  const breadcrumbSchema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_ORIGIN}/blog` },
      { '@type': 'ListItem', position: 3, name: metaSource.title || 'Article', item: canonicalArticleUrl },
    ],
  }), [canonicalArticleUrl, metaSource.title]);

  const articleSchema = useMemo(() => {
    if (!post && !metaSource) return null;
    const obj: any = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: metaSource.title,
      author: {
        '@type': 'Organization',
        name: PUBLIC_FACTS.brandName,
      },
      url: canonicalArticleUrl,
      // Add dates only when present in metadata (do not invent dates)
      image: metaSource.hero
        ? (metaSource.hero.startsWith('http') ? metaSource.hero : `${SITE_ORIGIN}${metaSource.hero}`)
        : `${SITE_ORIGIN}/og-default.jpg`,
      description: buildMetaDescription(metaSource) || undefined,
      articleSection: metaSource.category || undefined,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': canonicalArticleUrl,
      },
      inLanguage: 'en-IN',
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

    obj.publisher = {
      '@id': ORGANIZATION_ID,
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
  }, [canonicalArticleUrl, metaSource, post]);

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
    const description = buildMetaDescription(source) || `${PUBLIC_FACTS.brandName} blog post.`;

    applySeo({
      title,
      description,
      canonicalPath: canonical,
      ogType: 'article',
      jsonLd,
    });
  }, [slug, metaSource, jsonLd, breadcrumbSchema, post]);

  const categoryConfig = CATEGORY_ARTICLE_CONFIG[metaSource.category] || CATEGORY_ARTICLE_CONFIG['Parent Tips'];
  const postCtaOverride = slug ? POST_CTA_OVERRIDES[slug] : undefined;
  const primaryAction = postCtaOverride?.primaryAction || categoryConfig.primaryAction;
  const learningPathIntro = postCtaOverride?.learningPathIntro || categoryConfig.learningPathIntro;
  const weekMatch = String(metaSource.title || '').match(/^Week\s+(\d+)/i);
  const eyebrowPrimary = weekMatch ? `Week ${weekMatch[1]} Roadmap` : metaSource.category || 'Parent Guide';
  const rawEyebrowSecondary = deriveEyebrowSecondaryLabel(
    String(metaSource.title || ''),
    String(metaSource.category || 'Parent Guide'),
    Boolean(weekMatch),
  );
  const eyebrowSecondary =
    normalizeEyebrowLabel(rawEyebrowSecondary) === normalizeEyebrowLabel(eyebrowPrimary)
      ? ''
      : rawEyebrowSecondary;
  const heroSearchPainPoints =
    Array.isArray(post?.faq) && post.faq.length > 0
      ? post.faq.slice(0, 4).map((item) => item.question)
      : categoryConfig.searchPainPoints;
  const articleAuthorLabel = getArticleAuthorLabel(metaSource.author);
  const learningPathLinks = Array.isArray(postCtaOverride?.learningPathLinks)
    ? postCtaOverride.learningPathLinks
    : Array.isArray(categoryConfig.learningPathLinks)
      ? categoryConfig.learningPathLinks
      : [];
  const suppressCoursesFallback = Boolean(postCtaOverride?.suppressCoursesFallback);
  const hasCoursesLink = learningPathLinks.some((link) => link?.to === '/courses');
  const heroDescription = metaSource.metaDescription || metaSource.excerpt || buildMetaDescription(metaSource);
  const nextStepPrimaryRoute = useMemo(
    () => resolveNextStepRoute({ category: metaSource.category, slug, title: metaSource.title }),
    [metaSource.category, metaSource.title, slug],
  );
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

        const pipeRows = items
          .map((txt) => txt.split('|').map((cell) => cell.trim()))
          .filter((cells) => cells.length > 1);
        const isPipeTable = pipeRows.length === items.length
          && pipeRows.every((cells) => cells.length === pipeRows[0].length);

        if (isPipeTable && pipeRows[0].length === 2) {
          const [header, ...rows] = pipeRows;
          const tableKey = `table-${slug || (post && post.slug) || i}-${i}`;
          nodes.push(
            <div key={tableKey} className="my-8 overflow-x-auto">
              <table className="min-w-full border border-slate-300 text-left text-base">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 px-4 py-3 font-semibold text-slate-900">{header[0]}</th>
                    <th className="border border-slate-300 px-4 py-3 font-semibold text-slate-900">{header[1]}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={`${tableKey}-row-${idx}`}>
                      <td className="border border-slate-300 px-4 py-3 align-top text-slate-700">{row[0]}</td>
                      <td className="border border-slate-300 px-4 py-3 align-top text-slate-700">{row[1]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>,
          );
          i = j - 1;
          continue;
        }

        const ulKey = `ul-${slug || (post && post.slug) || i}-${i}`;
        nodes.push(
          <ul key={ulKey}>
            {items.map((txt, k) => {
              const internalPathMatch = txt.match(/^(.+?):\s(\/[a-z0-9][a-z0-9\-\/]*)$/i);
              if (internalPathMatch) {
                const [, label, path] = internalPathMatch;
                return (
                  <li key={`${ulKey}-li-${k}`}>
                    <span>{label}: </span>
                    <Link to={path} className="text-slate-900 underline hover:text-sky-700">
                      {path}
                    </Link>
                  </li>
                );
              }
              return <li key={`${ulKey}-li-${k}`}>{renderInlineContent(txt)}</li>;
            })}
          </ul>,
        );
        i = j - 1;
        continue;
      }

      if (block.type === 'p') {
        const calloutMatch = block.content.match(/^@@card:\s*([^|]+)\|(.+)$/);
        if (calloutMatch) {
          const title = calloutMatch[1].trim();
          const entries = calloutMatch[2]
            .split('|')
            .map((item) => item.trim())
            .filter(Boolean);
          nodes.push(
            <section
              key={`card-${i}`}
              className="not-prose my-8 rounded-[1.4rem] border border-slate-200 bg-[linear-gradient(135deg,#fff8ef_0%,#f6faff_100%)] p-5 shadow-[0_14px_35px_rgba(15,23,42,0.05)] ring-1 ring-slate-200/70 sm:p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-700">{title}</p>
              <ul className="mt-3 space-y-2.5 text-[0.99rem] leading-7 text-slate-700">
                {entries.map((entry, index) => (
                  <li key={`card-${i}-entry-${index}`} className="flex gap-2">
                    <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" />
                    <span>{renderInlineContent(entry)}</span>
                  </li>
                ))}
              </ul>
            </section>,
          );
          continue;
        }
      }

      nodes.push(<p key={`p-${i}`}>{renderInlineContent(block.content)}</p>);
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
        authorLabel={articleAuthorLabel}
        dateLabel={formatBlogDate(metaSource.date)}
        readTimeLabel={metaSource.readTime || '5 min read'}
        actions={[primaryAction, categoryConfig.secondaryAction]}
        searchPainPoints={heroSearchPainPoints}
        heroPoints={categoryConfig.heroPoints}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-8">
            <div>
              <Link to="/blog" className="inline-flex items-center text-sm font-semibold text-primary-700">← Back to Blogs</Link>
            </div>

            {metaSource.hero ? (
              <div className="self-start overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
                <div className={`aspect-[1.68/1] w-full ${isStoryUnderstandingPillar ? 'xl:aspect-[2.25/1]' : 'xl:aspect-[2.05/1]'}`}>
                  <img
                    src={metaSource.hero}
                    alt={metaSource.title}
                    className="h-full w-full bg-slate-100 object-cover object-center"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            ) : null}

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">Quick answer</p>
              <h2 className="ts-blog-hero-title mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-4xl">
                {metaSource.title}
              </h2>
              <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-700">
                {heroDescription}
              </p>
            </section>

            <article className="rounded-[2rem] border border-slate-200 bg-white px-6 py-8 shadow-[0_24px_60px_rgba(15,23,42,0.06)] sm:px-8">
              <div className={`prose prose-slate prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tight ${isStoryUnderstandingPillar ? 'prose-h2:mt-24 prose-h3:mt-12' : 'prose-h2:mt-20 prose-h3:mt-11'} prose-h2:mb-6 prose-h2:border-b prose-h2:border-slate-200 prose-h2:pb-2 prose-h2:text-3xl sm:prose-h2:text-[2.2rem] prose-h2:text-slate-950 prose-h3:mb-3 prose-h3:text-xl sm:prose-h3:text-[1.55rem] prose-h3:text-slate-900 prose-p:my-5 prose-p:text-[1.04rem] prose-p:leading-8 prose-p:text-slate-700 prose-ul:my-6 prose-li:my-2 prose-li:text-slate-700`}>
                {articleNodes}
              </div>
            </article>

            {post?.faq?.length ? <ParentsAlsoAsk items={post.faq} /> : null}

            <section className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#101828,#1b2a46)] px-6 py-8 text-white shadow-[0_28px_80px_rgba(15,23,42,0.18)] sm:px-8">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">Continue with Tiny Steps learning paths</p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight">Turn this article into a clearer next step</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
                    {learningPathIntro || 'Choose a program aligned to your child&apos;s current stage and next learning goal.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 lg:justify-end">
                  {learningPathLinks.map((link, index) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={
                        index === 0
                          ? 'inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100'
                          : 'inline-flex items-center rounded-full border border-white/18 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15'
                      }
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </section>

            <AboutAuthor variant={metaSource.category === 'Research' ? 'research' : 'standard'} />

            <section className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#f8fbff_0%,#eef8f2_100%)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">Parent Guidance</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Next Step for Parents</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                If your child is facing this challenge, start with the right learning path instead of trying random worksheets. Tiny Steps can help identify whether your child needs support with phonics, grammar, reading, sentence formation, or speaking confidence.
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
                <Link to={nextStepPrimaryRoute.to} className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-white transition hover:bg-slate-800">
                  {nextStepPrimaryRoute.label}
                </Link>
                <Link to="/courses" className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-3 text-slate-900 shadow-sm transition hover:bg-slate-50">
                  Explore Courses
                </Link>
                <Link to="/book-demo" className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-3 text-slate-900 shadow-sm transition hover:bg-slate-50">
                  Book Free Assessment
                </Link>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#fff8ef_0%,#f6faff_100%)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">Recommended Next for Parents</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Looking for more structured support?</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                Explore our main programs, related guides, or compare courses directly.
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
                {primaryAction && (
                  <Link to={primaryAction.to} className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-white transition hover:bg-slate-800">
                    {primaryAction.label}
                  </Link>
                )}
                {blogPosts
                  .filter(p => p.category === metaSource.category && p.slug !== slug && !p.hideFromList)
                  .slice(0, 3)
                  .map(related => (
                    <Link key={related.slug} to={`/blog/${related.slug}`} className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-3 text-slate-900 shadow-sm transition hover:bg-slate-50">
                      {related.title}
                    </Link>
                  ))}
                {!hasCoursesLink && !suppressCoursesFallback ? (
                  <Link to="/courses" className="inline-flex items-center rounded-full border border-slate-200 bg-[#f4f8fc] px-5 py-3 text-slate-900 transition hover:bg-[#e8f1f8]">Explore all courses</Link>
                ) : null}
              </div>
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
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
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Content ownership</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Published by {PUBLIC_FACTS.brandName}. This article is prepared by the Tiny Steps academic team to help parents make practical English-learning decisions.
                  </p>
                </div>
              </div>
            </div>

            {headingItems.length ? (
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">On this page</p>
                <nav className="mt-5 space-y-2">
                  {headingItems.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block transition hover:text-primary-700 ${
                        item.level === 'h3'
                          ? 'pl-4 text-xs leading-5 text-slate-500'
                          : 'text-sm font-semibold leading-6 text-slate-900'
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
