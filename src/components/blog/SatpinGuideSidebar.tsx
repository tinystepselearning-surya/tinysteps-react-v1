import React from 'react';
import { Link } from 'react-router-dom';
import { trackEvent } from '../../lib/analytics';

type HeadingItem = {
  id: string;
  title: string;
  level: 'h2' | 'h3' | string;
};

type SatpinGuideSidebarProps = {
  tocItems: HeadingItem[];
};

function trackSatpinSidebarEvent(name: string, extra: Record<string, unknown> = {}) {
  trackEvent(name, {
    page_path: '/blog/satpin-phonics-guide',
    article_slug: 'satpin-phonics-guide',
    ...extra,
  });
}

const SatpinGuideSidebar: React.FC<SatpinGuideSidebarProps> = ({ tocItems }) => (
  <>
    {tocItems.length ? (
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">On this page</p>
        <nav className="mt-5 space-y-2" aria-label="SATPIN article sections">
          {tocItems.map((item, index) => (
            <a
              key={item.id}
              href={'#' + item.id}
              onClick={() => trackSatpinSidebarEvent('SatpinJumpNavClicked', { section_id: item.id })}
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
          onClick={() => trackSatpinSidebarEvent('SatpinHomePlanClicked', { cta_position: 'sidebar' })}
          className="block rounded-[1.25rem] border border-white bg-white/90 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300"
        >
          Open SATPIN home plan
        </Link>
        <Link
          to="/book-demo"
          onClick={() => trackSatpinSidebarEvent('SatpinAssessmentClicked', { cta_position: 'sidebar' })}
          className="block rounded-[1.25rem] bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Book free phonics assessment
        </Link>
      </div>
    </div>
  </>
);

export default SatpinGuideSidebar;
