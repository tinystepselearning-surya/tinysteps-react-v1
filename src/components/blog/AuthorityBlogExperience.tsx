import React, { useEffect, useMemo } from 'react';
import { CheckCircle2, ChevronDown, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { BlogPost } from '../../content/blog/types';
import { trackEvent } from '../../lib/analytics';

type HeadingItem = {
  id: string;
  title: string;
  level: 'h2' | 'h3' | string;
};

type AuthorityBlogExperienceProps = {
  post: BlogPost;
  headingItems: HeadingItem[];
  tocItems: HeadingItem[];
  resolvedHero?: string | null;
};

type BlogBlock = BlogPost['body'][number];

type GuideSection = {
  title: string;
  id: string;
  blocks: BlogBlock[];
};

type EvidenceItem = {
  name: string;
  description: string;
  url: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'section';
}

function shortNavLabel(title: string) {
  if (/^Quick answer:/i.test(title)) return 'Overview';
  if (/^Evidence\b|\bEvidence and\b|\bSources reviewed\b/i.test(title)) return 'Evidence';
  if (/^(What to use next|Useful next steps|Tiny Steps next step|Where Tiny Steps fits|How Tiny Steps fits)/i.test(title)) return 'What next';
  return title;
}

function renderRichText(text: string, keyPrefix = 'rich'): React.ReactNode {
  if (!text) return text;

  const nodes: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\[([^\]]+)\]\((\/[a-z0-9][^)\s]*|https?:\/\/[^)\s]+)\))/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let tokenIndex = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));

    const raw = match[0];
    if (raw.startsWith('**') && raw.endsWith('**')) {
      nodes.push(
        <strong key={keyPrefix + '-strong-' + tokenIndex} className="font-semibold text-slate-950">
          {raw.slice(2, -2)}
        </strong>,
      );
    } else {
      const label = match[2];
      const href = match[3];
      const linkClass =
        'font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 transition hover:text-[#0b5bd3]';

      if (href.startsWith('/')) {
        nodes.push(
          <Link key={keyPrefix + '-link-' + tokenIndex} to={href} className={linkClass}>
            {label}
          </Link>,
        );
      } else {
        nodes.push(
          <a
            key={keyPrefix + '-link-' + tokenIndex}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            {label}
          </a>,
        );
      }
    }

    lastIndex = match.index + raw.length;
    tokenIndex += 1;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes.length ? nodes : text;
}

function buildSections(post: BlogPost, headingItems: HeadingItem[]) {
  const headingIdByTitle = new Map(headingItems.map((item) => [item.title, item.id]));
  const sections: GuideSection[] = [];
  const prefaceBlocks: BlogBlock[] = [];
  let current: GuideSection | null = null;

  for (const block of post.body || []) {
    if (block.type === 'h2') {
      current = {
        title: block.content,
        id: headingIdByTitle.get(block.content) || slugify(block.content),
        blocks: [],
      };
      sections.push(current);
      continue;
    }

    if (current) current.blocks.push(block);
    else prefaceBlocks.push(block);
  }

  if (!sections.length) {
    return [{
      title: post.title,
      id: 'article-overview',
      blocks: prefaceBlocks,
    }];
  }

  if (prefaceBlocks.length) {
    sections[0] = {
      ...sections[0],
      blocks: [...prefaceBlocks, ...sections[0].blocks],
    };
  }

  return sections;
}

function parseEvidenceItem(text: string): EvidenceItem | null {
  const markdownMatch = text.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)(?::\s*|\s*—\s*)?(.*)$/i);
  if (markdownMatch) {
    return {
      name: markdownMatch[1].trim(),
      url: markdownMatch[2].trim(),
      description: markdownMatch[3].trim(),
    };
  }

  const urlMatch = text.match(/(https?:\/\/\S+)\s*$/);
  if (!urlMatch) return null;

  const url = urlMatch[1];
  const withoutUrl = text.slice(0, text.length - url.length).trim();
  const separator = withoutUrl.indexOf(' — ');

  if (separator !== -1) {
    return {
      name: withoutUrl.slice(0, separator).trim(),
      description: withoutUrl.slice(separator + 3).trim().replace(/:\s*$/, ''),
      url,
    };
  }

  return {
    name: withoutUrl.replace(/:\s*$/, '') || 'Evidence source',
    description: '',
    url,
  };
}

function isEvidenceSection(title: string) {
  return /^Evidence\b|\bsources? reviewed\b|\breferences\b/i.test(title);
}

function isNextSection(title: string) {
  return /^(What to use next|Useful next steps|Tiny Steps next step|Where Tiny Steps fits|How Tiny Steps fits)/i.test(title);
}

function RichBlocks({
  blocks,
  headingItems,
  compact = false,
}: {
  blocks: BlogBlock[];
  headingItems: HeadingItem[];
  compact?: boolean;
}) {
  const headingIdByTitle = useMemo(
    () => new Map(headingItems.map((item) => [item.title, item.id])),
    [headingItems],
  );
  const nodes: React.ReactNode[] = [];

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];

    if (block.type === 'h3') {
      nodes.push(
        <h3
          key={'h3-' + i}
          id={headingIdByTitle.get(block.content)}
          className="scroll-mt-28 border-t border-slate-200/70 pt-5 text-lg font-black leading-7 tracking-[-0.02em] text-slate-950 first:border-t-0 first:pt-0 sm:text-xl"
        >
          {block.content}
        </h3>,
      );
      continue;
    }

    if (block.type === 'p') {
      const calloutMatch = block.content.match(/^@@card:\s*([^|]+)\|(.+)$/);
      if (calloutMatch) {
        const title = calloutMatch[1].trim();
        const entries = calloutMatch[2].split('|').map((item) => item.trim()).filter(Boolean);
        nodes.push(
          <section key={'card-' + i} className="rounded-[18px] border border-slate-200/80 bg-slate-50/80 p-5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#0b5bd3]">{title}</p>
            <ul className="mt-3 space-y-2.5">
              {entries.map((entry, index) => (
                <li key={'card-' + i + '-' + index} className="flex gap-2.5 text-sm leading-7 text-slate-700">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#0b5bd3]" aria-hidden="true" />
                  <span>{renderRichText(entry, 'card-' + i + '-' + index)}</span>
                </li>
              ))}
            </ul>
          </section>,
        );
        continue;
      }

      nodes.push(
        <p
          key={'p-' + i}
          className={compact ? 'text-[0.95rem] leading-7 text-slate-700' : 'text-[1rem] leading-8 text-slate-700'}
        >
          {renderRichText(block.content, 'p-' + i)}
        </p>,
      );
      continue;
    }

    if (block.type === 'li') {
      const items: BlogBlock[] = [];
      let j = i;
      for (; j < blocks.length && blocks[j].type === 'li'; j += 1) items.push(blocks[j]);

      const pipeRows = items
        .map((item) => item.content.split('|').map((cell) => cell.trim()))
        .filter((cells) => cells.length > 1);
      const isPipeTable =
        pipeRows.length === items.length &&
        pipeRows.length > 0 &&
        pipeRows.every((cells) => cells.length === pipeRows[0].length);

      if (isPipeTable && pipeRows[0].length === 2) {
        const [header, ...rows] = pipeRows;
        nodes.push(
          <div key={'table-' + i} className="overflow-hidden rounded-[18px] border border-slate-200/80">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-950 text-white">
                <tr>
                  <th className="px-4 py-3 font-semibold">{header[0]}</th>
                  <th className="border-l border-white/10 px-4 py-3 font-semibold">{header[1]}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={'row-' + rowIndex} className="border-t border-slate-100 bg-white">
                    <td className="px-4 py-3 align-top leading-6 text-slate-700">{renderRichText(row[0], 'table-a-' + rowIndex)}</td>
                    <td className="border-l border-slate-100 px-4 py-3 align-top leading-6 text-slate-700">{renderRichText(row[1], 'table-b-' + rowIndex)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        );
      } else {
        nodes.push(
          <ul key={'ul-' + i} className="space-y-2.5">
            {items.map((item, index) => (
              <li key={'li-' + index} className="flex gap-2.5 text-[0.95rem] leading-7 text-slate-700">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#0b5bd3]" aria-hidden="true" />
                <span>{renderRichText(item.content, 'li-' + i + '-' + index)}</span>
              </li>
            ))}
          </ul>,
        );
      }

      i = j - 1;
    }
  }

  return <div className="space-y-4">{nodes}</div>;
}

function EvidenceSection({
  section,
  headingItems,
}: {
  section: GuideSection;
  headingItems: HeadingItem[];
}) {
  const evidenceItems = section.blocks
    .filter((block) => block.type === 'li')
    .map((block) => parseEvidenceItem(block.content))
    .filter(Boolean) as EvidenceItem[];
  const evidenceSourceTexts = new Set(
    section.blocks
      .filter((block) => block.type === 'li' && parseEvidenceItem(block.content))
      .map((block) => block.content),
  );
  const introBlocks = section.blocks.filter(
    (block) => block.type !== 'li' || !evidenceSourceTexts.has(block.content),
  );

  return (
    <section
      id={section.id}
      data-authority-section={section.id}
      className="scroll-mt-28 rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.04)] sm:p-6"
    >
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#0b5bd3]">Evidence behind this guide</p>
      <h2 className="mt-2 text-[1.75rem] font-black tracking-[-0.035em] text-slate-950 sm:text-[2rem]">{section.title}</h2>
      {introBlocks.length ? (
        <div className="mt-4">
          <RichBlocks blocks={introBlocks} headingItems={headingItems} compact />
        </div>
      ) : null}

      {evidenceItems.length ? (
        <div className="mt-5 grid gap-2">
          {evidenceItems.map((item, index) => (
            <article key={item.url + index} className="rounded-[16px] bg-slate-50/80 p-4">
              <p className="text-sm font-bold leading-6 text-slate-950">{item.name}</p>
              {item.description ? <p className="mt-1.5 text-sm leading-6 text-slate-600">{item.description}</p> : null}
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0b5bd3] transition hover:text-[#0847a6]"
              >
                Read source
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

const AuthorityBlogExperience: React.FC<AuthorityBlogExperienceProps> = ({
  post,
  headingItems,
  tocItems,
  resolvedHero,
}) => {
  const sections = useMemo(() => buildSections(post, headingItems), [headingItems, post]);
  const quick = sections.find((section) => /^Quick answer:/i.test(section.title)) || sections[0];
  const remaining = sections.filter((section) => section !== quick);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;

    const seen = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const sectionId = (entry.target as HTMLElement).dataset.authoritySection;
          if (!sectionId || seen.has(sectionId)) continue;
          seen.add(sectionId);
          trackEvent('AuthorityBlogSectionViewed', {
            page_path: '/blog/' + post.slug,
            article_slug: post.slug,
            section_id: sectionId,
          });
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.3 },
    );

    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-authority-section]'));
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [post.slug]);

  return (
    <div id="top" className="space-y-6 sm:space-y-8">
      {tocItems.length ? (
        <details className="rounded-[20px] border border-slate-200/80 bg-white/[0.85] p-4 shadow-sm backdrop-blur-xl lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-900">
            Guide index
            <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
          </summary>
          <nav className="mt-4 grid grid-cols-2 gap-2" aria-label={post.title + ' article sections'}>
            {tocItems.map((item, index) => (
              <a
                key={item.id}
                href={'#' + item.id}
                onClick={() =>
                  trackEvent('AuthorityBlogJumpNavClicked', {
                    page_path: '/blog/' + post.slug,
                    article_slug: post.slug,
                    section_id: item.id,
                  })
                }
                className="rounded-[12px] bg-slate-50 px-3 py-2.5 text-xs font-semibold leading-5 text-slate-700"
              >
                <span className="mr-1.5 text-slate-400">{String(index + 1).padStart(2, '0')}</span>
                {shortNavLabel(item.title)}
              </a>
            ))}
          </nav>
        </details>
      ) : null}

      {quick ? (
        <section
          id={quick.id}
          data-authority-section={quick.id}
          className="scroll-mt-28 overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.05)]"
        >
          <div className={resolvedHero ? 'grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]' : ''}>
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-950 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white">
                  Quick answer
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[0.68rem] font-semibold text-slate-500">
                  Start here
                </span>
              </div>
              <h2 className="ts-answer-title ts-blog-hero-title mt-5 max-w-3xl text-[1.9rem] font-black tracking-[-0.04em] text-slate-950 sm:text-[2.25rem]">
                {quick.title}
              </h2>
              <div className="ts-answer-summary ts-blog-quick-answer mt-5 max-w-4xl">
                <RichBlocks blocks={quick.blocks} headingItems={headingItems} compact />
              </div>
            </div>

            {resolvedHero ? (
              <div className="border-t border-slate-100 lg:border-l lg:border-t-0">
                <div className="h-full min-h-64 overflow-hidden lg:min-h-full">
                  <img
                    src={resolvedHero}
                    alt={post.title}
                    className="h-full w-full bg-slate-100 object-cover object-center"
                    width={900}
                    height={900}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <div className="space-y-6">
        {remaining.map((section, index) => {
          if (isEvidenceSection(section.title)) {
            return <EvidenceSection key={section.id} section={section} headingItems={headingItems} />;
          }

          const nextSection = isNextSection(section.title);
          return (
            <section
              key={section.id}
              id={section.id}
              data-authority-section={section.id}
              className={
                nextSection
                  ? 'scroll-mt-28 rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.04)] sm:p-8'
                  : 'scroll-mt-28 border-y border-slate-200/70 px-1 py-7 sm:px-2 sm:py-8'
              }
            >
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#0b5bd3]">
                {nextSection ? 'Continue from here' : 'Guide section ' + String(index + 2).padStart(2, '0')}
              </p>
              <h2 className="mt-2 max-w-4xl text-[1.75rem] font-black tracking-[-0.035em] text-slate-950 sm:text-[2rem]">
                {section.title}
              </h2>
              <div className="mt-5 max-w-4xl">
                <RichBlocks blocks={section.blocks} headingItems={headingItems} />
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default AuthorityBlogExperience;
