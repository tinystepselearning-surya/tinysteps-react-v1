import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronDown, ExternalLink, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { BlogPost } from '../../content/blog/types';
import { trackEvent } from '../../lib/analytics';

type HeadingItem = {
  id: string;
  title: string;
  level: 'h2' | 'h3' | string;
};

type SatpinGuideExperienceProps = {
  post: BlogPost;
  headingItems: HeadingItem[];
  tocItems: HeadingItem[];
  resolvedHero?: string | null;
};

type SatpinGuideSidebarProps = {
  tocItems: HeadingItem[];
};

type BlogBlock = BlogPost['body'][number];

type GuideSection = {
  title: string;
  id: string;
  blocks: BlogBlock[];
};

type GuideSubsection = {
  title: string;
  id: string;
  blocks: BlogBlock[];
};

const SATPIN_SLUG = 'satpin-phonics-guide';

const READY_SIGNALS = [
  'Recalls several taught sounds from print.',
  'Tracks letters from left to right.',
  'Attempts to join sounds instead of guessing from one letter.',
  'Can work with a simple word built only from taught correspondences.',
];

const NEXT_PATH = [
  'SATPIN sounds',
  'CVC words',
  'Broader sound–spelling patterns',
  'Short decodable text',
  'Increasingly independent reading',
];

const METHOD_ROWS = [
  ['An early letter–sound set', 'A complete reading curriculum'],
  ['A way to form early decodable words', 'A standalone teaching methodology'],
  ['One possible starting sequence', 'A universally mandatory first six letters'],
];

const BLEND_EXAMPLES = [
  { sounds: ['s', 'a', 't'], word: 'sat' },
  { sounds: ['p', 'i', 'n'], word: 'pin' },
  { sounds: ['t', 'a', 'p'], word: 'tap' },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'section';
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
      if (href.startsWith('/')) {
        nodes.push(
          <Link
            key={keyPrefix + '-link-' + tokenIndex}
            to={href}
            className="font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 transition hover:text-primary-700"
          >
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
            className="font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 transition hover:text-primary-700"
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

function buildSections(post: BlogPost, headingItems: HeadingItem[]): GuideSection[] {
  const headingIdByTitle = new Map(headingItems.map((item) => [item.title, item.id]));
  const sections: GuideSection[] = [];
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
  }

  return sections;
}

function buildSubsections(section: GuideSection | undefined, headingItems: HeadingItem[]) {
  if (!section) return { intro: [] as BlogBlock[], subsections: [] as GuideSubsection[] };

  const headingIdByTitle = new Map(headingItems.map((item) => [item.title, item.id]));
  const intro: BlogBlock[] = [];
  const subsections: GuideSubsection[] = [];
  let current: GuideSubsection | null = null;

  for (const block of section.blocks) {
    if (block.type === 'h3') {
      current = {
        title: block.content,
        id: headingIdByTitle.get(block.content) || slugify(block.content),
        blocks: [],
      };
      subsections.push(current);
      continue;
    }

    if (current) current.blocks.push(block);
    else intro.push(block);
  }

  return { intro, subsections };
}

function SectionHeading({
  section,
  eyebrow,
  description,
}: {
  section: GuideSection;
  eyebrow: string;
  description?: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
        {section.title}
      </h2>
      {description ? <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{description}</p> : null}
    </div>
  );
}

function TextBlocks({
  blocks,
  compact = false,
}: {
  blocks: BlogBlock[];
  compact?: boolean;
}) {
  const nodes: React.ReactNode[] = [];

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];

    if (block.type === 'p') {
      nodes.push(
        <p
          key={'p-' + i}
          className={compact ? 'text-sm leading-7 text-slate-700' : 'text-[1rem] leading-8 text-slate-700'}
        >
          {renderRichText(block.content, 'p-' + i)}
        </p>,
      );
      continue;
    }

    if (block.type === 'h3') {
      nodes.push(
        <h3 key={'h3-' + i} className="text-lg font-bold text-slate-950">
          {block.content}
        </h3>,
      );
      continue;
    }

    if (block.type === 'li') {
      const items: BlogBlock[] = [];
      let j = i;
      for (; j < blocks.length && blocks[j].type === 'li'; j += 1) items.push(blocks[j]);

      nodes.push(
        <ul key={'ul-' + i} className="space-y-2.5">
          {items.map((item, index) => (
            <li key={'li-' + index} className="flex gap-2.5 text-sm leading-7 text-slate-700">
              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary-700" aria-hidden="true" />
              <span>{renderRichText(item.content, 'li-' + i + '-' + index)}</span>
            </li>
          ))}
        </ul>,
      );
      i = j - 1;
    }
  }

  return <div className="space-y-4">{nodes}</div>;
}

function trackSatpinEvent(name: string, extra: Record<string, unknown> = {}) {
  trackEvent(name, {
    page_path: '/blog/satpin-phonics-guide',
    article_slug: SATPIN_SLUG,
    ...extra,
  });
}

function parseEvidenceItem(text: string) {
  const urlMatch = text.match(/(https?:\/\/\S+)\s*$/);
  const url = urlMatch?.[1] || '';
  const withoutUrl = url ? text.slice(0, text.length - url.length).trim() : text.trim();
  const separator = withoutUrl.indexOf(' — ');

  if (separator === -1) {
    return { name: 'Evidence source', description: withoutUrl, url };
  }

  return {
    name: withoutUrl.slice(0, separator).trim(),
    description: withoutUrl.slice(separator + 3).trim(),
    url,
  };
}

function wordBankFromBlock(block: BlogBlock) {
  const match = block.content.match(/^\*\*([^*]+)\*\*\s*(.+)$/);
  if (!match) return null;
  return {
    label: match[1].replace(/:\s*$/, ''),
    words: match[2]
      .split(',')
      .map((word) => word.trim().replace(/\.$/, ''))
      .filter(Boolean),
  };
}

export const SatpinGuideSidebar: React.FC<SatpinGuideSidebarProps> = ({ tocItems }) => (
  <>
    {tocItems.length ? (
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">On this page</p>
        <nav className="mt-5 space-y-2" aria-label="SATPIN article sections">
          {tocItems.map((item, index) => (
            <a
              key={item.id}
              href={'#' + item.id}
              onClick={() => trackSatpinEvent('SatpinJumpNavClicked', { section_id: item.id })}
              className="group flex items-start gap-3 rounded-xl px-2 py-2 text-sm font-semibold leading-6 text-slate-800 transition hover:bg-slate-50 hover:text-primary-700"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[0.68rem] font-bold text-slate-500 group-hover:bg-primary-50 group-hover:text-primary-700">
                {index + 1}
              </span>
              <span>{item.title.replace(/^Quick answer:\s*/i, 'Quick answer: ')}</span>
            </a>
          ))}
        </nav>
      </div>
    ) : null}

    <div className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(145deg,#fff8ee_0%,#eef6ff_100%)] p-6 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Need help choosing the next step?</p>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        Use the home plan for practice structure, or book an assessment when you need stage-specific guidance.
      </p>
      <div className="mt-5 space-y-3">
        <Link
          to="/blog/week-1-phonics-satpin-launch"
          onClick={() => trackSatpinEvent('SatpinHomePlanClicked', { cta_position: 'sidebar' })}
          className="block rounded-[1.25rem] border border-white bg-white/90 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300"
        >
          Open SATPIN home plan
        </Link>
        <Link
          to="/book-demo"
          onClick={() => trackSatpinEvent('SatpinAssessmentClicked', { cta_position: 'sidebar' })}
          className="block rounded-[1.25rem] bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Book free phonics assessment
        </Link>
      </div>
    </div>
  </>
);

const SatpinGuideExperience: React.FC<SatpinGuideExperienceProps> = ({
  post,
  headingItems,
  tocItems,
  resolvedHero,
}) => {
  const [activeBlend, setActiveBlend] = useState(0);
  const [expandedSound, setExpandedSound] = useState<string | null>('s');

  const sections = useMemo(() => buildSections(post, headingItems), [headingItems, post]);
  const byPrefix = (prefix: string) => sections.find((section) => section.title.startsWith(prefix));

  const quick = byPrefix('Quick answer:');
  const standFor = byPrefix('What does SATPIN stand for?');
  const sounds = byPrefix('SATPIN sounds:');
  const order = byPrefix('SATPIN order:');
  const method = byPrefix('Is SATPIN a phonics method?');
  const useful = byPrefix('Why can SATPIN be a useful first set?');
  const words = byPrefix('SATPIN words:');
  const blending = byPrefix('Do children need to master all six SATPIN sounds before blending?');
  const pronunciation = byPrefix('Letter sounds, letter names');
  const sequence = byPrefix('A parent-friendly SATPIN start sequence');
  const sentences = byPrefix('SATPIN sentences and early reading:');
  const progress = byPrefix('What should SATPIN progress look like?');
  const difficulties = byPrefix('Five common SATPIN difficulties');
  const after = byPrefix('What comes after SATPIN?');
  const home = byPrefix('SATPIN at home:');
  const games = byPrefix('Where Tiny Steps free games fit');
  const review = byPrefix('When to ask for a closer teaching review');
  const evidence = byPrefix('Evidence and references');
  const bottom = byPrefix('Bottom line for parents');

  const usefulGroups = useMemo(() => buildSubsections(useful, headingItems), [headingItems, useful]);
  const sequenceGroups = useMemo(() => buildSubsections(sequence, headingItems), [headingItems, sequence]);
  const pronunciationGroups = useMemo(() => buildSubsections(pronunciation, headingItems), [headingItems, pronunciation]);
  const difficultyGroups = useMemo(() => buildSubsections(difficulties, headingItems), [difficulties, headingItems]);

  const soundItems = sounds?.blocks.filter((block) => block.type === 'li') || [];
  const soundIntro = sounds?.blocks.filter((block) => block.type !== 'li') || [];
  const wordBanks = (words?.blocks.filter((block) => block.type === 'li') || [])
    .map(wordBankFromBlock)
    .filter(Boolean) as Array<{ label: string; words: string[] }>;
  const wordProse = words?.blocks.filter((block) => block.type !== 'li') || [];
  const progressSignals = progress?.blocks.filter((block) => block.type === 'li') || [];
  const progressProse = progress?.blocks.filter((block) => block.type !== 'li') || [];
  const evidenceItems = evidence?.blocks.filter((block) => block.type === 'li').map((block) => parseEvidenceItem(block.content)) || [];
  const evidenceIntro = evidence?.blocks.filter((block) => block.type !== 'li') || [];
  const activeBlendExample = BLEND_EXAMPLES[activeBlend];

  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;

    const seen = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const sectionId = (entry.target as HTMLElement).dataset.satpinSection;
          if (!sectionId || seen.has(sectionId)) continue;
          seen.add(sectionId);
          trackSatpinEvent('SatpinSectionViewed', { section_id: sectionId });
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.35 },
    );

    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-satpin-section]'));
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const jumpLinks = tocItems.map((item) => (
    <a
      key={item.id}
      href={'#' + item.id}
      onClick={() => trackSatpinEvent('SatpinJumpNavClicked', { section_id: item.id })}
      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:border-primary-200 hover:text-primary-700"
    >
      {item.title
        .replace(/^Quick answer:\s*/i, 'Quick answer')
        .replace(/^SATPIN\s+/i, '')
        .replace(/:\s.*$/, '')}
    </a>
  ));

  return (
    <div className="space-y-7">
      {resolvedHero ? (
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.07)]">
          <div className="aspect-[1.65/1] w-full sm:aspect-[2.15/1]">
            <img
              src={resolvedHero}
              alt="Child practising early sound-letter matching"
              className="h-full w-full object-cover object-center"
              width={1600}
              height={900}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      ) : null}

      {tocItems.length ? (
        <details className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-slate-900">
            Jump to a SATPIN section
            <ChevronDown className="h-5 w-5 text-slate-500" aria-hidden="true" />
          </summary>
          <nav className="mt-4 flex flex-wrap gap-2" aria-label="SATPIN article sections">
            {jumpLinks}
          </nav>
        </details>
      ) : null}

      {quick ? (
        <section
          id={quick.id}
          data-satpin-section="quick-answer"
          className="scroll-mt-28 overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(145deg,#fff8ed_0%,#ffffff_48%,#eef6ff_100%)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)] sm:p-8"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              SATPIN in 60 seconds
            </span>
            <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-600">
              Parent quick answer
            </span>
          </div>
          <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{quick.title}</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {quick.blocks.map((block, index) => (
              <div key={'quick-' + index} className="rounded-[1.4rem] border border-white/80 bg-white/80 p-5 shadow-sm">
                <p className="text-sm leading-7 text-slate-700">{renderRichText(block.content, 'quick-' + index)}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              'Starter sound–spelling set',
              'Blend before perfect six-sound mastery',
              'Not a complete method',
              'Progress by transfer, not arbitrary scores',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm font-semibold leading-6 text-slate-800">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary-700" aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {standFor ? (
        <section
          id={standFor.id}
          data-satpin-section="what-satpin-stands-for"
          className="scroll-mt-28 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.04)] sm:p-8"
        >
          <SectionHeading section={standFor} eyebrow="Start here" />
          <div className="mt-6 flex flex-wrap gap-2" aria-label="SATPIN letters">
            {'satpin'.split('').map((letter, index) => (
              <span
                key={letter + index}
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-[linear-gradient(145deg,#fff7eb,#eef6ff)] text-xl font-black lowercase text-slate-950 shadow-sm"
              >
                {letter}
              </span>
            ))}
          </div>
          <div className="mt-6 max-w-4xl">
            <TextBlocks blocks={standFor.blocks} />
          </div>
        </section>
      ) : null}

      {sounds ? (
        <section
          id={sounds.id}
          data-satpin-section="satpin-sounds"
          className="scroll-mt-28 rounded-[2rem] border border-slate-200 bg-[#f8fbff] p-6 shadow-[0_16px_40px_rgba(15,23,42,0.04)] sm:p-8"
        >
          <SectionHeading
            section={sounds}
            eyebrow="See it clearly"
            description="Tap a card for a small blending cue. The sound examples remain visible and crawlable without interaction."
          />

          <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {soundItems.map((block, index) => {
              const letter = block.content.match(/^\*\*([a-z])\*\*/i)?.[1] || String(index + 1);
              const detail = block.content.replace(/^\*\*[a-z]\*\*\s*—\s*/i, '');
              const isOpen = expandedSound === letter;

              return (
                <button
                  key={letter + index}
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => {
                    setExpandedSound(isOpen ? null : letter);
                    trackSatpinEvent('SatpinSoundCardOpened', { sound: letter });
                  }}
                  className="rounded-[1.5rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-2xl font-black lowercase text-white">
                      {letter}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Sound {index + 1}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-700">{renderRichText(detail, 'sound-' + index)}</p>
                  {isOpen ? (
                    <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium leading-6 text-slate-600">
                      Say the sound smoothly, then move directly into one of the example words.
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-[1.4rem] border border-slate-200 bg-white p-5">
            <TextBlocks blocks={soundIntro} compact />
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        {order ? (
          <section
            id={order.id}
            data-satpin-section="satpin-order"
            className="scroll-mt-28 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.04)] sm:p-7"
          >
            <SectionHeading section={order} eyebrow="Sequence clarity" />
            <div className="mt-5">
              <TextBlocks blocks={order.blocks} compact />
            </div>
          </section>
        ) : null}

        {method ? (
          <section
            id={method.id}
            data-satpin-section="satpin-method"
            className="scroll-mt-28 rounded-[2rem] border border-slate-200 bg-[linear-gradient(145deg,#fffaf2,#f8fbff)] p-6 shadow-[0_16px_40px_rgba(15,23,42,0.04)] sm:p-7"
          >
            <SectionHeading section={method} eyebrow="Avoid a common misconception" />
            <div className="mt-5 overflow-hidden rounded-[1.3rem] border border-slate-200 bg-white">
              <div className="grid grid-cols-2 bg-slate-950 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                <span>SATPIN is</span>
                <span>SATPIN is not</span>
              </div>
              {METHOD_ROWS.map(([yes, no]) => (
                <div key={yes} className="grid grid-cols-2 border-t border-slate-100 px-4 py-3 text-sm leading-6 text-slate-700 first:border-t-0">
                  <span className="pr-3 font-medium text-slate-900">{yes}</span>
                  <span className="border-l border-slate-100 pl-3">{no}</span>
                </div>
              ))}
            </div>
            <div className="mt-5">
              <TextBlocks blocks={method.blocks} compact />
            </div>
          </section>
        ) : null}
      </div>

      {words ? (
        <section
          id={words.id}
          data-satpin-section="satpin-words"
          className="scroll-mt-28 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.04)] sm:p-8"
        >
          <SectionHeading
            section={words}
            eyebrow="Build real words"
            description="Use the word banks for decoding variety—not for sight-word memorisation."
          />

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {wordBanks.map((bank) => (
              <div key={bank.label} className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(145deg,#fff8ed,#f7fbff)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{bank.label}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {bank.words.map((word) => (
                    <span key={word} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-900">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-700">Try the blend</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {BLEND_EXAMPLES.map((example, index) => (
                <button
                  key={example.word}
                  type="button"
                  onClick={() => setActiveBlend(index)}
                  aria-pressed={activeBlend === index}
                  className={
                    activeBlend === index
                      ? 'rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white'
                      : 'rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300'
                  }
                >
                  {example.word}
                </button>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2" aria-label={'Blend ' + activeBlendExample.word}>
              {activeBlendExample.sounds.map((sound, index) => (
                <React.Fragment key={sound + index}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-black text-slate-950">
                    {sound}
                  </span>
                  {index < activeBlendExample.sounds.length - 1 ? <span className="text-slate-400">+</span> : null}
                </React.Fragment>
              ))}
              <ArrowRight className="mx-1 h-5 w-5 text-primary-700" aria-hidden="true" />
              <span className="rounded-2xl bg-primary-50 px-4 py-2 text-lg font-black text-primary-900">
                {activeBlendExample.word}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <TextBlocks blocks={wordProse} />
          </div>
        </section>
      ) : null}

      {blending ? (
        <section
          id={blending.id}
          data-satpin-section="when-to-blend"
          className="scroll-mt-28 overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_20px_50px_rgba(15,23,42,0.12)] sm:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Blending readiness</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">{blending.title}</h2>
          <div className="mt-6 rounded-[1.4rem] border border-white/10 bg-white/10 p-5">
            <p className="text-lg font-black text-white">No—do not wait for perfect six-sound mastery.</p>
            <p className="mt-2 text-sm leading-7 text-slate-200">
              Blending can begin once the child knows enough taught correspondences to form a simple word.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {READY_SIGNALS.map((signal) => (
              <div key={signal} className="flex gap-3 rounded-[1.25rem] border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-100">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" aria-hidden="true" />
                <span>{signal}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-4 text-sm leading-7 text-slate-200">
            {blending.blocks.map((block, index) => (
              <p key={'blend-copy-' + index}>{renderRichText(block.content, 'blend-copy-' + index)}</p>
            ))}
          </div>
        </section>
      ) : null}

      {useful ? (
        <section
          id={useful.id}
          data-satpin-section="why-satpin-helps"
          className="scroll-mt-28 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.04)] sm:p-8"
        >
          <SectionHeading section={useful} eyebrow="Why this starter set can work" />
          {usefulGroups.intro.length ? <div className="mt-5"><TextBlocks blocks={usefulGroups.intro} /></div> : null}
          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            {usefulGroups.subsections.map((group, index) => (
              <div key={group.title} className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">{index + 1}</span>
                <h3 id={group.id} className="scroll-mt-28 mt-4 text-lg font-black leading-7 text-slate-950">
                  {group.title.replace(/^\d+\.\s*/, '')}
                </h3>
                <div className="mt-3">
                  <TextBlocks blocks={group.blocks} compact />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {pronunciation ? (
        <section
          id={pronunciation.id}
          data-satpin-section="pronunciation"
          className="scroll-mt-28 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.04)] sm:p-8"
        >
          <SectionHeading section={pronunciation} eyebrow="Pronunciation note" />
          <details className="mt-5 rounded-[1.4rem] border border-slate-200 bg-slate-50/60 p-5">
            <summary className="cursor-pointer text-sm font-bold text-slate-900">
              Open the letter-name and blendable-pronunciation guidance
            </summary>
            <div className="mt-5 space-y-5">
              {pronunciationGroups.intro.length ? <TextBlocks blocks={pronunciationGroups.intro} compact /> : null}
              {pronunciationGroups.subsections.map((group) => (
                <div key={group.title}>
                  <h3 id={group.id} className="scroll-mt-28 text-base font-black text-slate-950">{group.title}</h3>
                  <div className="mt-2"><TextBlocks blocks={group.blocks} compact /></div>
                </div>
              ))}
            </div>
          </details>
        </section>
      ) : null}

      {sequence ? (
        <section
          id={sequence.id}
          data-satpin-section="satpin-sequence"
          className="scroll-mt-28 rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-6 shadow-[0_16px_40px_rgba(15,23,42,0.04)] sm:p-8"
        >
          <SectionHeading
            section={sequence}
            eyebrow="The chronological pathway"
            description="Move through the steps based on what the child can actually do—not a fixed daily timetable."
          />
          {sequenceGroups.intro.length ? <div className="mt-5"><TextBlocks blocks={sequenceGroups.intro} /></div> : null}

          <div className="mt-7 space-y-4">
            {sequenceGroups.subsections.map((group, index) => (
              <div key={group.title} className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 sm:grid-cols-[56px_minmax(0,1fr)] sm:p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-lg font-black text-primary-800">
                  {index + 1}
                </div>
                <div>
                  <h3 id={group.id} className="scroll-mt-28 text-lg font-black leading-7 text-slate-950">
                    {group.title.replace(/^Step\s+\d+\s+—\s+/i, '')}
                  </h3>
                  <div className="mt-3">
                    <TextBlocks blocks={group.blocks} compact />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {sentences ? (
        <section
          id={sentences.id}
          data-satpin-section="satpin-sentences"
          className="scroll-mt-28 rounded-[2rem] border border-slate-200 bg-[linear-gradient(145deg,#fff8ed,#ffffff)] p-6 shadow-[0_16px_40px_rgba(15,23,42,0.04)] sm:p-8"
        >
          <SectionHeading section={sentences} eyebrow="Bridge into real reading" />
          <div className="mt-5">
            <TextBlocks blocks={sentences.blocks} />
          </div>
        </section>
      ) : null}

      {progress ? (
        <section
          id={progress.id}
          data-satpin-section="satpin-progress"
          className="scroll-mt-28 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.04)] sm:p-8"
        >
          <SectionHeading
            section={progress}
            eyebrow="Progress checkpoint"
            description="Look for increasing independence and transfer. These are editorial progression signals, not standardised cut-offs."
          />
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {progressSignals.map((block, index) => (
              <div key={'progress-' + index} className={index === progressSignals.length - 1 ? 'rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-5 sm:col-span-2' : 'rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-5'}>
                <div className="flex gap-3 text-sm leading-7 text-slate-700">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">{index + 1}</span>
                  <span>{renderRichText(block.content, 'progress-' + index)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <TextBlocks blocks={progressProse} compact />
          </div>
        </section>
      ) : null}

      {difficulties ? (
        <section
          id={difficulties.id}
          data-satpin-section="satpin-difficulties"
          className="scroll-mt-28 rounded-[2rem] border border-slate-200 bg-[#f8fbff] p-6 shadow-[0_16px_40px_rgba(15,23,42,0.04)] sm:p-8"
        >
          <SectionHeading
            section={difficulties}
            eyebrow="If your child is stuck"
            description="Open the situation that matches what you are seeing. Each route keeps the advice specific rather than adding more content automatically."
          />

          <div className="mt-6 space-y-3">
            {difficultyGroups.subsections.map((group, index) => (
              <details
                key={group.title}
                className="group rounded-[1.4rem] border border-slate-200 bg-white p-5"
                onToggle={(event) => {
                  if (event.currentTarget.open) {
                    trackSatpinEvent('SatpinDiagnosticOpened', {
                      diagnostic_id: group.id,
                      diagnostic_number: index + 1,
                    });
                  }
                }}
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                  <span className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-black text-primary-800">
                      {index + 1}
                    </span>
                    <span id={group.id} className="scroll-mt-28 pt-1 text-sm font-bold leading-6 text-slate-950">
                      {group.title.replace(/^\d+\.\s*/, '')}
                    </span>
                  </span>
                  <ChevronDown className="mt-1 h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
                </summary>
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <TextBlocks blocks={group.blocks} compact />
                </div>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {after ? (
        <section
          id={after.id}
          data-satpin-section="after-satpin"
          className="scroll-mt-28 rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_20px_50px_rgba(15,23,42,0.12)] sm:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">The next stage</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">{after.title}</h2>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {NEXT_PATH.map((step, index) => (
              <React.Fragment key={step}>
                <span className={index === 0 ? 'rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-950' : 'rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100'}>
                  {step}
                </span>
                {index < NEXT_PATH.length - 1 ? <ArrowRight className="h-4 w-4 text-slate-400" aria-hidden="true" /> : null}
              </React.Fragment>
            ))}
          </div>
          <div className="mt-6 space-y-4 text-sm leading-7 text-slate-200">
            {after.blocks.map((block, index) => (
              <p key={'after-' + index}>{renderRichText(block.content, 'after-' + index)}</p>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {[home, games, review].filter(Boolean).map((section) => (
          <section
            key={section!.title}
            id={section!.id}
            data-satpin-section={slugify(section!.title)}
            className="scroll-mt-28 rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.04)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Practical next route</p>
            <h2 className="mt-3 text-lg font-black leading-7 text-slate-950">{section!.title}</h2>
            <div className="mt-4">
              <TextBlocks blocks={section!.blocks} compact />
            </div>
          </section>
        ))}
      </div>

      {evidence ? (
        <section
          id={evidence.id}
          data-satpin-section="evidence"
          className="scroll-mt-28 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.04)] sm:p-8"
        >
          <SectionHeading
            section={evidence}
            eyebrow="Why this guidance is trustworthy"
            description="The sources support systematic phonics principles. They do not establish SATPIN as the only valid first set or define a universal mastery score."
          />

          <div className="mt-5">
            <TextBlocks blocks={evidenceIntro} compact />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {evidenceItems.map((source, index) => (
              <div key={source.name + index} className="rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-5">
                <p className="text-sm font-black leading-6 text-slate-950">{source.name}</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">{renderRichText(source.description, 'evidence-' + index)}</p>
                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary-700 transition hover:text-primary-900"
                  >
                    Read source
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {bottom ? (
        <section
          id={bottom.id}
          data-satpin-section="bottom-line"
          className="scroll-mt-28 rounded-[2rem] border border-slate-200 bg-[linear-gradient(145deg,#fff7ea_0%,#eef6ff_100%)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)] sm:p-8"
        >
          <SectionHeading section={bottom} eyebrow="Bottom line for parents" />
          <div className="mt-5 max-w-4xl">
            <TextBlocks blocks={bottom.blocks} />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/blog/week-1-phonics-satpin-launch"
              onClick={() => trackSatpinEvent('SatpinHomePlanClicked', { cta_position: 'article_end' })}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400"
            >
              Use the SATPIN home plan
            </Link>
            <Link
              to="/phonics"
              onClick={() => trackSatpinEvent('SatpinPhonicsClassesClicked', { cta_position: 'article_end' })}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400"
            >
              Explore phonics classes
            </Link>
            <Link
              to="/book-demo"
              onClick={() => trackSatpinEvent('SatpinAssessmentClicked', { cta_position: 'article_end' })}
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Book a free phonics assessment
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default SatpinGuideExperience;
