import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, CheckCircle2, ChevronDown, ExternalLink } from 'lucide-react';
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

type RichTone = 'light' | 'dark';

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
  'Independent reading',
];

const METHOD_ROWS = [
  ['An early letter–sound set', 'A complete reading curriculum'],
  ['A route into early decodable words', 'A standalone teaching methodology'],
  ['One useful starting sequence', 'A mandatory first six letters'],
];

const BLEND_EXAMPLES = [
  { sounds: ['s', 'a', 't'], word: 'sat' },
  { sounds: ['p', 'i', 'n'], word: 'pin' },
  { sounds: ['t', 'a', 'p'], word: 'tap' },
];

const SEQUENCE_TITLES = [
  'Learn a small sound set',
  'Begin blending',
  'Add spelling',
  'Test fresh words',
  'Read a short line',
];

const PRACTICAL_SUMMARIES: Record<string, string> = {
  'SATPIN at home: guide versus routine':
    'Use this when you want a session-by-session home routine with word banks and practical examples.',
  'Where Tiny Steps free games fit':
    'Use games for sound recognition and letter familiarity, then check the skill away from the game.',
  'When to ask for a closer teaching review':
    'Use this when sound recall, blending or previously secure knowledge repeatedly breaks down.',
};

const MOBILE_LABELS: Array<[string, string]> = [
  ['Quick answer:', 'Overview'],
  ['SATPIN sounds:', 'Sounds'],
  ['SATPIN words:', 'First words'],
  ['Do children need to master all six SATPIN sounds before blending?', 'Start blending'],
  ['A parent-friendly SATPIN start sequence', 'How to practise'],
  ['What should SATPIN progress look like?', 'Progress & help'],
  ['What comes after SATPIN?', 'What next'],
  ['Evidence and references', 'Evidence'],
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'section';
}

function shortNavLabel(title: string) {
  return MOBILE_LABELS.find(([prefix]) => title.startsWith(prefix))?.[1] || title;
}

function renderRichText(text: string, keyPrefix = 'rich', tone: RichTone = 'light'): React.ReactNode {
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
        <strong
          key={keyPrefix + '-strong-' + tokenIndex}
          className={tone === 'dark' ? 'font-semibold text-white' : 'font-semibold text-slate-950'}
        >
          {raw.slice(2, -2)}
        </strong>,
      );
    } else {
      const label = match[2];
      const href = match[3];
      const linkClass =
        tone === 'dark'
          ? 'font-medium text-sky-200 underline decoration-white/30 underline-offset-4 transition hover:text-white'
          : 'font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 transition hover:text-[#0b5bd3]';

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

function splitFirstParagraph(blocks: BlogBlock[]) {
  const index = blocks.findIndex((block) => block.type === 'p');
  if (index === -1) return { first: null as BlogBlock | null, rest: blocks };
  return {
    first: blocks[index],
    rest: blocks.filter((_, blockIndex) => blockIndex !== index),
  };
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
    <div className="max-w-3xl">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#0b5bd3]">{eyebrow}</p>
      <h2 className="mt-2 text-[1.75rem] font-black tracking-[-0.035em] text-slate-950 sm:text-[2rem]">
        {section.title}
      </h2>
      {description ? <p className="mt-2 text-[0.95rem] leading-7 text-slate-500">{description}</p> : null}
    </div>
  );
}

function TextBlocks({
  blocks,
  compact = false,
  tone = 'light',
}: {
  blocks: BlogBlock[];
  compact?: boolean;
  tone?: RichTone;
}) {
  const nodes: React.ReactNode[] = [];
  const normalText = tone === 'dark' ? 'text-slate-200' : 'text-slate-700';
  const headingText = tone === 'dark' ? 'text-white' : 'text-slate-950';

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];

    if (block.type === 'p') {
      nodes.push(
        <p key={'p-' + i} className={compact ? 'text-[0.94rem] leading-7 ' + normalText : 'text-[1rem] leading-8 ' + normalText}>
          {renderRichText(block.content, 'p-' + i, tone)}
        </p>,
      );
      continue;
    }

    if (block.type === 'h3') {
      nodes.push(
        <h3 key={'h3-' + i} className={'text-lg font-bold ' + headingText}>
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
        <ul key={'ul-' + i} className="space-y-2">
          {items.map((item, index) => (
            <li key={'li-' + index} className={'flex gap-2.5 text-[0.94rem] leading-7 ' + normalText}>
              <CheckCircle2 className={tone === 'dark' ? 'mt-1 h-4 w-4 shrink-0 text-sky-300' : 'mt-1 h-4 w-4 shrink-0 text-[#0b5bd3]'} aria-hidden="true" />
              <span>{renderRichText(item.content, 'li-' + i + '-' + index, tone)}</span>
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

  if (separator === -1) return { name: 'Evidence source', description: withoutUrl, url };

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

const SatpinGuideExperience: React.FC<SatpinGuideExperienceProps> = ({
  post,
  headingItems,
  tocItems,
  resolvedHero,
}) => {
  const [activeBlend, setActiveBlend] = useState(0);
  const [activeSound, setActiveSound] = useState('s');

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
  const soundData = soundItems.map((block, index) => {
    const letter = block.content.match(/^\*\*([a-z])\*\*/i)?.[1] || String(index + 1);
    return {
      letter,
      detail: block.content.replace(/^\*\*[a-z]\*\*\s*—\s*/i, ''),
    };
  });
  const selectedSound = soundData.find((item) => item.letter === activeSound) || soundData[0];

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
      { threshold: 0.3 },
    );

    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-satpin-section]'));
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <div id="top" className="space-y-6 sm:space-y-8">
      {tocItems.length ? (
        <details className="rounded-[20px] border border-slate-200/80 bg-white/[0.85] p-4 shadow-sm backdrop-blur-xl lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-900">
            Guide index
            <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
          </summary>
          <nav className="mt-4 grid grid-cols-2 gap-2" aria-label="SATPIN article sections">
            {tocItems.map((item, index) => (
              <a
                key={item.id}
                href={'#' + item.id}
                onClick={() => trackSatpinEvent('SatpinJumpNavClicked', { section_id: item.id })}
                className="rounded-[12px] bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700"
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
          data-satpin-section="quick-answer"
          className="scroll-mt-28 overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.05)]"
        >
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-950 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white">
                  SATPIN in 60 seconds
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[0.68rem] font-semibold text-slate-500">
                  Parent quick answer
                </span>
              </div>

              <h2 className="ts-answer-title ts-blog-hero-title mt-5 max-w-3xl text-[1.9rem] font-black tracking-[-0.04em] text-slate-950 sm:text-[2.25rem]">
                {quick.title}
              </h2>

              <div className="mt-6 divide-y divide-slate-100 rounded-[20px] bg-slate-50/70 px-5">
                {quick.blocks.map((block, index) => (
                  <div key={'quick-' + index} className="grid gap-2 py-4 sm:grid-cols-[28px_minmax(0,1fr)]">
                    <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-[#0b5bd3] shadow-sm">
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <p className={index === 0 ? 'ts-answer-summary ts-blog-quick-answer text-[0.98rem] leading-7 text-slate-700' : 'text-[0.98rem] leading-7 text-slate-700'}>
                      {renderRichText(block.content, 'quick-' + index)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {resolvedHero ? (
              <div className="border-t border-slate-100 lg:border-l lg:border-t-0">
                <div className="h-full min-h-64 overflow-hidden lg:min-h-full">
                  <img
                    src={resolvedHero}
                    alt="Child practising early sound-letter matching"
                    className="h-full w-full object-cover object-[50%_66%]"
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

      {(standFor || sounds) ? (
        <div className="overflow-hidden border-y border-slate-200/70">
          {standFor ? (
            <section id={standFor.id} data-satpin-section="what-satpin-stands-for" className="scroll-mt-28 p-6 sm:p-8">
              <SectionHeading section={standFor} eyebrow="Start here" />
              <div className="mt-5 flex flex-wrap gap-2" aria-label="SATPIN letters">
                {'satpin'.split('').map((letter, index) => (
                  <span
                    key={letter + index}
                    className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-slate-100 text-lg font-black lowercase text-slate-950"
                  >
                    {letter}
                  </span>
                ))}
              </div>
              <div className="mt-5 max-w-4xl">
                <TextBlocks blocks={standFor.blocks} compact />
              </div>
            </section>
          ) : null}

          {sounds ? (
            <section id={sounds.id} data-satpin-section="satpin-sounds" className="scroll-mt-28 border-t border-slate-100 p-6 sm:p-8">
              <SectionHeading
                section={sounds}
                eyebrow="See it clearly"
                description="Choose a sound to see one clean blending cue. The full sound guidance remains directly below."
              />

              <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {soundData.map((item, index) => {
                  const active = selectedSound?.letter === item.letter;
                  return (
                    <button
                      key={item.letter + index}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setActiveSound(item.letter);
                        trackSatpinEvent('SatpinSoundCardOpened', { sound: item.letter });
                      }}
                      className={
                        active
                          ? 'flex min-h-20 flex-col items-center justify-center rounded-[18px] bg-slate-950 px-3 py-4 text-white shadow-sm'
                          : 'flex min-h-20 flex-col items-center justify-center rounded-[18px] bg-slate-100 px-3 py-4 text-slate-950 transition hover:bg-slate-200/70'
                      }
                    >
                      <span className="text-2xl font-black lowercase">{item.letter}</span>
                      <span className={active ? 'mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-slate-300' : 'mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-slate-400'}>
                        Sound {index + 1}
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedSound ? (
                <div className="mt-4 rounded-[18px] bg-[#f5f8fc] p-5">
                  <p className="text-sm leading-7 text-slate-700">{renderRichText(selectedSound.detail, 'selected-sound')}</p>
                  <p className="mt-2 text-xs leading-6 text-slate-500">Keep the sound clean and move directly into the example word.</p>
                </div>
              ) : null}

              <div className="mt-5 border-t border-slate-100 pt-5">
                <TextBlocks blocks={soundIntro} compact />
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      {(order || method) ? (
        <div className="grid gap-8 border-y border-slate-200/70 py-8 md:grid-cols-2">
          {order ? (
            <section
              id={order.id}
              data-satpin-section="satpin-order"
              className="scroll-mt-28 px-1 sm:px-2"
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
              className="scroll-mt-28 px-1 sm:px-2"
            >
              <SectionHeading section={method} eyebrow="One useful distinction" />
              <div className="mt-5 overflow-hidden rounded-[16px] border border-slate-200/80">
                <div className="grid grid-cols-2 bg-slate-950 px-4 py-2.5 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-white">
                  <span>SATPIN is</span>
                  <span>SATPIN is not</span>
                </div>
                {METHOD_ROWS.map(([yes, no]) => (
                  <div key={yes} className="grid grid-cols-2 border-t border-slate-100 px-4 py-3 text-[0.84rem] leading-6 text-slate-600 first:border-t-0">
                    <span className="pr-3 font-semibold text-slate-900">{yes}</span>
                    <span className="border-l border-slate-100 pl-3">{no}</span>
                  </div>
                ))}
              </div>
              <details className="mt-4 group">
                <summary className="cursor-pointer list-none text-sm font-semibold text-[#0b5bd3]">Read the full explanation</summary>
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <TextBlocks blocks={method.blocks} compact />
                </div>
              </details>
            </section>
          ) : null}
        </div>
      ) : null}

      {useful ? (
        <section
          id={useful.id}
          data-satpin-section="why-satpin-helps"
          className="scroll-mt-28 px-1 py-4 sm:px-2 sm:py-6"
        >
          <SectionHeading section={useful} eyebrow="Why the starter set can work" />
          {usefulGroups.intro.length ? <div className="mt-4"><TextBlocks blocks={usefulGroups.intro} compact /></div> : null}

          <div className="mt-6 grid gap-3 lg:grid-cols-3">
            {usefulGroups.subsections.map((group, index) => {
              const split = splitFirstParagraph(group.blocks);
              return (
                <div key={group.title} className="border-t border-slate-200 pt-4">
                  <span className="text-[0.68rem] font-bold tabular-nums text-[#0b5bd3]">{String(index + 1).padStart(2, '0')}</span>
                  <h3 id={group.id} className="scroll-mt-28 mt-2 text-lg font-black leading-6 tracking-tight text-slate-950">
                    {group.title.replace(/^\d+\.\s*/, '')}
                  </h3>
                  {split.first ? (
                    <p className="mt-3 line-clamp-4 text-sm leading-7 text-slate-600">
                      {renderRichText(split.first.content, 'useful-first-' + index)}
                    </p>
                  ) : null}
                  {split.rest.length ? (
                    <details className="mt-3">
                      <summary className="cursor-pointer list-none text-sm font-semibold text-[#0b5bd3]">More detail</summary>
                      <div className="mt-3 border-t border-slate-200 pt-3">
                        <TextBlocks blocks={split.rest} compact />
                      </div>
                    </details>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {words ? (
        <section
          id={words.id}
          data-satpin-section="satpin-words"
          className="scroll-mt-28 rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_16px_45px_rgba(15,23,42,0.045)] sm:p-8"
        >
          <SectionHeading section={words} eyebrow="Build real words" description="Use the word banks for decoding variety—not for sight-word memorisation." />

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {wordBanks.map((bank) => (
              <div key={bank.label} className="rounded-[20px] bg-slate-50 p-5">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-400">{bank.label}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {bank.words.map((word) => (
                    <span key={word} className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.08)]">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-[20px] bg-[#f5f8fc] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#0b5bd3]">Try the blend</p>
              <div className="flex gap-1.5">
                {BLEND_EXAMPLES.map((example, index) => (
                  <button
                    key={example.word}
                    type="button"
                    onClick={() => setActiveBlend(index)}
                    aria-pressed={activeBlend === index}
                    className={
                      activeBlend === index
                        ? 'rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white'
                        : 'rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm'
                    }
                  >
                    {example.word}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2" aria-label={'Blend ' + activeBlendExample.word}>
              {activeBlendExample.sounds.map((sound, index) => (
                <React.Fragment key={sound + index}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white text-lg font-black text-slate-950 shadow-sm">
                    {sound}
                  </span>
                  {index < activeBlendExample.sounds.length - 1 ? <span className="text-slate-300">+</span> : null}
                </React.Fragment>
              ))}
              <ArrowRight className="mx-1 h-4 w-4 text-[#0b5bd3]" aria-hidden="true" />
              <span className="rounded-[12px] bg-[#eaf3ff] px-4 py-2 text-base font-black text-[#0b5bd3]">
                {activeBlendExample.word}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <TextBlocks blocks={wordProse} compact />
          </div>
        </section>
      ) : null}

      {blending ? (
        <section
          id={blending.id}
          data-satpin-section="when-to-blend"
          className="scroll-mt-28 rounded-[30px] border border-[#d9e8ff] bg-[#f4f8ff] p-6 shadow-[0_16px_45px_rgba(15,23,42,0.04)] sm:p-8"
        >
          <SectionHeading section={blending} eyebrow="Blending readiness" />
          <div className="mt-5 rounded-[18px] bg-white p-5 shadow-sm">
            <p className="text-lg font-black tracking-tight text-slate-950">No—do not wait for perfect six-sound mastery.</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">Blending can begin once the child knows enough taught correspondences to form a simple word.</p>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {READY_SIGNALS.map((signal) => (
              <div key={signal} className="flex gap-3 rounded-[16px] bg-white/75 p-4 text-sm leading-6 text-slate-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0b5bd3]" aria-hidden="true" />
                <span>{signal}</span>
              </div>
            ))}
          </div>

          <details className="mt-5 rounded-[18px] bg-white/70 p-5">
            <summary className="cursor-pointer list-none text-sm font-semibold text-[#0b5bd3]">Read the evidence and blending examples</summary>
            <div className="mt-4 border-t border-slate-200/70 pt-4">
              <TextBlocks blocks={blending.blocks} compact />
            </div>
          </details>
        </section>
      ) : null}

      {pronunciation ? (
        <section
          id={pronunciation.id}
          data-satpin-section="pronunciation"
          className="scroll-mt-28 border-y border-slate-200/70 px-1 py-7 sm:px-2 sm:py-8"
        >
          <SectionHeading section={pronunciation} eyebrow="Pronunciation note" />
          <details className="mt-4 rounded-[16px] bg-white/80 p-4">
            <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">Letter names, blendable pronunciations and “pure sounds”</summary>
            <div className="mt-4 border-t border-slate-200 pt-4">
              {pronunciationGroups.intro.length ? <TextBlocks blocks={pronunciationGroups.intro} compact /> : null}
              <div className="mt-4 space-y-4">
                {pronunciationGroups.subsections.map((group) => (
                  <div key={group.title}>
                    <h3 id={group.id} className="scroll-mt-28 text-base font-black text-slate-950">{group.title}</h3>
                    <div className="mt-2"><TextBlocks blocks={group.blocks} compact /></div>
                  </div>
                ))}
              </div>
            </div>
          </details>
        </section>
      ) : null}

      {sequence ? (
        <section
          id={sequence.id}
          data-satpin-section="satpin-sequence"
          className="scroll-mt-28 rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_16px_45px_rgba(15,23,42,0.045)] sm:p-8"
        >
          <SectionHeading section={sequence} eyebrow="How to practise" description="A simple progression: teach, blend, spell, test a fresh word, then move into short text." />
          {sequenceGroups.intro.length ? <div className="mt-4"><TextBlocks blocks={sequenceGroups.intro} compact /></div> : null}

          <div className="relative mt-6">
            <div className="absolute bottom-5 left-[17px] top-5 hidden w-px bg-slate-200 sm:block" aria-hidden="true" />
            <div className="space-y-3">
              {sequenceGroups.subsections.map((group, index) => {
                const split = splitFirstParagraph(group.blocks);
                return (
                  <div key={group.title} className="relative rounded-[20px] bg-slate-50 p-5 sm:ml-14">
                    <span className="absolute -left-14 top-5 hidden h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white sm:flex">
                      {index + 1}
                    </span>
                    <div className="flex items-start gap-3 sm:block">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white sm:hidden">{index + 1}</span>
                      <div>
                        <h3 id={group.id} className="scroll-mt-28 text-lg font-black tracking-tight text-slate-950">
                          {SEQUENCE_TITLES[index] || group.title.replace(/^Step\s+\d+\s+—\s+/i, '')}
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          {group.title.replace(/^Step\s+\d+\s+—\s+/i, '')}
                        </p>
                        {split.first ? (
                          <p className="mt-2 text-sm leading-7 text-slate-600">{renderRichText(split.first.content, 'sequence-first-' + index)}</p>
                        ) : null}
                        {split.rest.length ? (
                          <details className="mt-3">
                            <summary className="cursor-pointer list-none text-sm font-semibold text-[#0b5bd3]">Teaching detail</summary>
                            <div className="mt-3 border-t border-slate-200 pt-3">
                              <TextBlocks blocks={split.rest} compact />
                            </div>
                          </details>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {sentences ? (
        <section
          id={sentences.id}
          data-satpin-section="satpin-sentences"
          className="scroll-mt-28 border-y border-slate-200/70 px-1 py-7 sm:px-2 sm:py-8"
        >
          <SectionHeading section={sentences} eyebrow="Bridge into real reading" />
          <div className="mt-4"><TextBlocks blocks={sentences.blocks} compact /></div>
        </section>
      ) : null}

      {(progress || difficulties) ? (
        <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.04)]">
      {progress ? (
        <section
          id={progress.id}
          data-satpin-section="satpin-progress"
          className="scroll-mt-28 p-6 sm:p-8"
        >
          <SectionHeading section={progress} eyebrow="Progress and support" description="Look for independence and transfer first; then open the troubleshooting guidance only if a specific difficulty persists." />
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {progressSignals.map((block, index) => (
              <div key={'progress-' + index} className={index === progressSignals.length - 1 ? 'rounded-[18px] bg-slate-50 p-4 sm:col-span-2' : 'rounded-[18px] bg-slate-50 p-4'}>
                <div className="flex gap-3 text-sm leading-7 text-slate-700">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-950 text-[0.68rem] font-bold text-white">{index + 1}</span>
                  <span>{renderRichText(block.content, 'progress-' + index)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5"><TextBlocks blocks={progressProse} compact /></div>
        </section>
      ) : null}

      {difficulties ? (
        <section
          id={difficulties.id}
          data-satpin-section="satpin-difficulties"
          className="scroll-mt-28 border-t border-slate-100 p-6 sm:p-8"
        >
          <SectionHeading section={difficulties} eyebrow="If your child is stuck" description="Open only the situation that matches what you are seeing." />
          <div className="mt-5 divide-y divide-slate-100 overflow-hidden rounded-[20px] bg-slate-50">
            {difficultyGroups.subsections.map((group, index) => (
              <details
                key={group.title}
                className="group p-5"
                onToggle={(event) => {
                  if (event.currentTarget.open) {
                    trackSatpinEvent('SatpinDiagnosticOpened', { diagnostic_id: group.id, diagnostic_number: index + 1 });
                  }
                }}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <span className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[0.68rem] font-bold text-slate-500 shadow-sm">{index + 1}</span>
                    <span id={group.id} className="scroll-mt-28 text-sm font-semibold leading-6 text-slate-950">{group.title.replace(/^\d+\.\s*/, '')}</span>
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="mt-4 border-t border-slate-200 pt-4"><TextBlocks blocks={group.blocks} compact /></div>
              </details>
            ))}
          </div>
        </section>
      ) : null}


        </div>
      ) : null}

      {after ? (
        <section
          id={after.id}
          data-satpin-section="after-satpin"
          className="scroll-mt-28 rounded-[30px] border border-slate-200/80 bg-[#f6f7f9] p-6 sm:p-8"
        >
          <SectionHeading section={after} eyebrow="The next stage" />
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {NEXT_PATH.map((step, index) => (
              <React.Fragment key={step}>
                <span className={index === 0 ? 'rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white' : 'rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm'}>
                  {step}
                </span>
                {index < NEXT_PATH.length - 1 ? <ArrowRight className="h-4 w-4 text-slate-300" aria-hidden="true" /> : null}
              </React.Fragment>
            ))}
          </div>
          <details className="mt-5 rounded-[18px] bg-white p-5">
            <summary className="cursor-pointer list-none text-sm font-semibold text-[#0b5bd3]">Read the progression guidance</summary>
            <div className="mt-4 border-t border-slate-100 pt-4"><TextBlocks blocks={after.blocks} compact /></div>
          </details>
        </section>
      ) : null}

      <div className="border-y border-slate-200/70">
        <div className="divide-y divide-slate-200/70">
          {[home, games, review].filter(Boolean).map((section) => (
            <section
              key={section!.title}
              id={section!.id}
              data-satpin-section={slugify(section!.title)}
              className="scroll-mt-28 py-5 sm:py-6"
            >
              <div className="grid gap-3 md:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] md:gap-8">
                <div>
                  <p className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-slate-400">Related guidance</p>
                  <h2 className="mt-2 text-lg font-black tracking-tight text-slate-950">{section!.title}</h2>
                </div>
                <div>
                  <p className="text-sm leading-7 text-slate-600">{PRACTICAL_SUMMARIES[section!.title] || 'Open this route when it matches the child’s current need.'}</p>
                  <details className="mt-2">
                    <summary className="cursor-pointer list-none text-sm font-semibold text-[#0b5bd3]">Full guidance</summary>
                    <div className="mt-3 border-t border-slate-200/70 pt-3"><TextBlocks blocks={section!.blocks} compact /></div>
                  </details>
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>

      {evidence ? (
        <section
          id={evidence.id}
          data-satpin-section="evidence"
          className="scroll-mt-28 rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.04)] sm:p-6"
        >
          <SectionHeading section={evidence} eyebrow="Evidence behind this guide" description="Readable source summaries first; full external citations remain linked and intact." />
          <div className="mt-4"><TextBlocks blocks={evidenceIntro} compact /></div>

          <div className="mt-5 grid gap-2 md:grid-cols-2">
            {evidenceItems.map((source, index) => (
              <div key={source.name + index} className="rounded-[16px] bg-slate-50/80 p-4">
                <p className="text-sm font-black leading-6 text-slate-950">{source.name}</p>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">{renderRichText(source.description, 'evidence-' + index)}</p>
                {source.url ? (
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0b5bd3] transition hover:text-[#07449f]">
                    Read source
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
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
          className="scroll-mt-28 border-y border-slate-200/70 px-1 py-7 sm:px-2 sm:py-8"
        >
          <SectionHeading section={bottom} eyebrow="Bottom line for parents" />
          <div className="mt-4 max-w-4xl"><TextBlocks blocks={bottom.blocks} compact /></div>
        </section>
      ) : null}
    </div>
  );
};

export default SatpinGuideExperience;
