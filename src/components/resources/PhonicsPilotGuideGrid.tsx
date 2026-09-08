import type { FC } from 'react';
import { Link } from 'react-router-dom';
import {
  PHONICS_PROGRAMMATIC_PILOT_GROUPS,
  PHONICS_PROGRAMMATIC_PILOT_PAGES,
  getPhonicsProgrammaticPilotPagesByGroup,
  type PhonicsProgrammaticPilotPage,
} from '../../lib/phonicsProgrammaticPilot.js';

export const PHONICS_PILOT_RESOURCE_LINKS = Object.freeze(
  PHONICS_PROGRAMMATIC_PILOT_PAGES.map((page) => Object.freeze({
    title: page.cardTitle,
    description: page.concept.quickAnswer,
    to: page.path,
    label: `Open ${page.cardTitle}`,
  })),
);

const groupDescriptions: Record<string, string> = {
  'Spelling rules': 'Understand the rule boundary, examples and exceptions before asking a child to apply the spelling independently.',
  'Consonant patterns': 'Focus on one sound or consonant spelling pattern at a time, with clear contrasts and decoding practice.',
  'Vowel patterns': 'Compare vowel spellings carefully so children learn patterns without assuming that one spelling always has one sound.',
  'Word structure': 'Use syllable and word-structure cues to move beyond single-syllable decoding into longer words.',
};

const GuideCard: FC<{ page: PhonicsProgrammaticPilotPage }> = ({ page }) => (
  <Link
    to={page.path}
    className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_10px_32px_rgba(15,23,42,0.045)] transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_16px_38px_rgba(15,23,42,0.08)]"
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-[15px] font-black tracking-[-0.01em] text-slate-950 group-hover:text-sky-800">
          {page.cardTitle}
        </h3>
        <p className="mt-1.5 line-clamp-3 text-sm leading-6 text-slate-600">
          {page.concept.quickAnswer}
        </p>
      </div>
      <span aria-hidden="true" className="mt-0.5 text-lg text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-sky-600">→</span>
    </div>
  </Link>
);

const PhonicsPilotGuideGrid: FC = () => (
  <section aria-labelledby="focused-phonics-guides" className="mt-10 rounded-[2rem] border border-slate-200/80 bg-slate-50/70 p-5 sm:p-7 lg:p-8">
    <div className="max-w-3xl">
      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-700">Focused phonics guides</p>
      <h2 id="focused-phonics-guides" className="mt-2 text-2xl font-black tracking-[-0.025em] text-slate-950 sm:text-3xl">
        Learn one spelling or sound pattern clearly
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
        These focused guides sit below the broader phonics pathway. Choose the pattern your child is currently learning rather than working through every page at once.
      </p>
    </div>

    <div className="mt-7 space-y-7">
      {PHONICS_PROGRAMMATIC_PILOT_GROUPS.map((group) => {
        const pages = getPhonicsProgrammaticPilotPagesByGroup(group);
        return (
          <section key={group} aria-labelledby={`pilot-group-${group.toLowerCase().replace(/\s+/g, '-')}`}>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 id={`pilot-group-${group.toLowerCase().replace(/\s+/g, '-')}`} className="text-base font-black text-slate-900">{group}</h3>
                <p className="mt-1 max-w-3xl text-sm leading-5 text-slate-500">{groupDescriptions[group]}</p>
              </div>
              <span className="text-xs font-bold text-slate-400">{pages.length} guides</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {pages.map((page) => <GuideCard key={page.path} page={page} />)}
            </div>
          </section>
        );
      })}
    </div>
  </section>
);

export default PhonicsPilotGuideGrid;
