import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUp, ChevronRight } from 'lucide-react';
import { trackEvent } from '../../lib/analytics';

type HeadingItem = {
  id: string;
  title: string;
  level: 'h2' | 'h3' | string;
};

type SatpinGuideSidebarProps = {
  tocItems: HeadingItem[];
};

const NAV_LABELS: Array<[string, string]> = [
  ['Quick answer:', 'Overview'],
  ['SATPIN sounds:', 'Sounds'],
  ['SATPIN words:', 'First words'],
  ['Do children need to master all six SATPIN sounds before blending?', 'Start blending'],
  ['A parent-friendly SATPIN start sequence', 'How to practise'],
  ['What should SATPIN progress look like?', 'Progress & help'],
  ['What comes after SATPIN?', 'What next'],
  ['Evidence and references', 'Evidence'],
];

function shortLabel(title: string) {
  return NAV_LABELS.find(([prefix]) => title.startsWith(prefix))?.[1] || title;
}

function trackSatpinSidebarEvent(name: string, extra: Record<string, unknown> = {}) {
  trackEvent(name, {
    page_path: '/blog/satpin-phonics-guide',
    article_slug: 'satpin-phonics-guide',
    ...extra,
  });
}

const SatpinGuideSidebar: React.FC<SatpinGuideSidebarProps> = ({ tocItems }) => {
  const [activeId, setActiveId] = useState(tocItems[0]?.id || '');
  const itemIds = useMemo(() => tocItems.map((item) => item.id), [tocItems]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const sections = itemIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (!sections.length) return;

    let frame = 0;

    const syncActiveSection = () => {
      frame = 0;
      const readingMarker = Math.max(136, Math.min(window.innerHeight * 0.28, 260));
      let nextSection = sections[0];

      for (const section of sections) {
        if (section.getBoundingClientRect().top <= readingMarker) {
          nextSection = section;
        } else {
          break;
        }
      }

      const atPageEnd =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 8;
      if (atPageEnd) nextSection = sections[sections.length - 1];

      setActiveId((current) => (current === nextSection.id ? current : nextSection.id));
    };

    const scheduleSync = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(syncActiveSection);
    };

    syncActiveSection();
    window.addEventListener('scroll', scheduleSync, { passive: true });
    window.addEventListener('resize', scheduleSync);
    window.addEventListener('hashchange', scheduleSync);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleSync);
      window.removeEventListener('resize', scheduleSync);
      window.removeEventListener('hashchange', scheduleSync);
    };
  }, [itemIds]);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-[24px] border border-white/80 bg-white/[0.78] p-3 shadow-[0_16px_45px_rgba(15,23,42,0.07)] backdrop-blur-2xl supports-[backdrop-filter]:bg-white/[0.72]">
        <div className="flex items-center justify-between px-2 pb-3 pt-1">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-400">Guide index</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">SATPIN</p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[0.68rem] font-semibold tabular-nums text-slate-500">
            {tocItems.length} sections
          </span>
        </div>

        <nav className="space-y-1" aria-label="SATPIN guide index">
          {tocItems.map((item, index) => {
            const active = activeId === item.id;
            return (
              <a
                key={item.id}
                href={'#' + item.id}
                aria-current={active ? 'location' : undefined}
                onClick={() => {
                  setActiveId(item.id);
                  trackSatpinSidebarEvent('SatpinJumpNavClicked', { section_id: item.id });
                }}
                className={
                  active
                    ? 'group flex items-center gap-3 rounded-[14px] bg-[#eef5ff] px-3 py-2.5 text-sm font-semibold text-[#0b5bd3]'
                    : 'group flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100/80 hover:text-slate-950'
                }
              >
                <span className={active ? 'w-5 text-[0.67rem] font-bold tabular-nums text-[#0b5bd3]' : 'w-5 text-[0.67rem] font-semibold tabular-nums text-slate-400'}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1 truncate">{shortLabel(item.title)}</span>
                <ChevronRight className={active ? 'h-3.5 w-3.5 text-[#0b5bd3]' : 'h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500'} aria-hidden="true" />
              </a>
            );
          })}
        </nav>

        <div className="mt-3 border-t border-slate-200/70 px-2 pt-3">
          <a
            href="#top"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
          >
            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
            Back to top
          </a>
        </div>
      </div>

    </div>
  );
};

export default SatpinGuideSidebar;
