import React from 'react';
import { Link } from 'react-router-dom';

type HeroPoint = {
  label: string;
  value: string;
  detail: string;
};

type HeroAction = {
  label: string;
  to: string;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
};

type ResearchArticleHeroProps = {
  eyebrowPrimary: string;
  eyebrowSecondary?: string;
  title: string;
  description: string;
  authorLabel?: string;
  authorRole?: string;
  authorTo?: string;
  dateLabel: string;
  readTimeLabel: string;
  actions: HeroAction[];
  searchPainPoints: string[];
  searchLabel?: string;
  heroPoints: HeroPoint[];
  compact?: boolean;
};

const ResearchArticleHero: React.FC<ResearchArticleHeroProps> = ({
  eyebrowPrimary,
  eyebrowSecondary,
  title,
  description,
  authorLabel = 'Tiny Steps Learning',
  authorRole = 'Research Desk',
  authorTo = '/team',
  dateLabel,
  readTimeLabel,
  actions,
  searchPainPoints,
  searchLabel = 'Parents often search',
  heroPoints,
  compact = false,
}) => {
  return (
    <section className={compact ? 'relative isolate overflow-hidden bg-[#0b1220] text-white' : 'relative isolate overflow-hidden bg-slate-950 text-white'}>
      <div className={compact ? 'absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,_rgba(255,170,112,0.18),_transparent_28%),radial-gradient(circle_at_86%_12%,_rgba(82,153,255,0.18),_transparent_30%),linear-gradient(145deg,_#121927_0%,_#0b1220_58%,_#10233f_100%)]' : 'absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,186,119,0.28),_transparent_34%),radial-gradient(circle_at_82%_18%,_rgba(94,170,255,0.28),_transparent_30%),linear-gradient(160deg,_rgba(15,23,42,0.98)_0%,_rgba(15,23,42,0.95)_46%,_rgba(10,37,79,0.96)_100%)]'} />
      {!compact ? <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-[#ff8a3d]/20 blur-3xl" /> : null}
      {!compact ? <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl" /> : null}

      <div className={`relative mx-auto max-w-7xl px-4 sm:px-6 ${compact ? 'pb-8 pt-14 sm:pb-9 sm:pt-16' : 'pb-14 pt-24 sm:pb-20 sm:pt-32'}`}>
        <div className={compact ? 'grid gap-5' : 'grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_360px] lg:items-end'}>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-100">
              {eyebrowPrimary}
              {eyebrowSecondary ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#ff8a3d]" />
                  {eyebrowSecondary}
                </>
              ) : null}
            </div>

            <h1 className={`max-w-4xl font-black tracking-tight text-white ${compact ? 'mt-4 text-3xl sm:text-[2.35rem] lg:text-[2.85rem]' : 'mt-6 text-3xl sm:text-5xl lg:text-6xl'}`}>
              {title}
            </h1>

            <p className={`${compact ? 'mt-3' : 'mt-6'} max-w-3xl text-base leading-7 text-slate-200 sm:text-lg sm:leading-8`}>{description}</p>

            <div className={`${compact ? 'mt-5' : 'mt-8'} flex flex-wrap items-center gap-3 text-sm text-slate-200`}>
              <Link
                to={authorTo}
                className="rounded-full border border-white/15 bg-white/8 px-4 py-2 transition hover:bg-white/12 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                aria-label={`About ${authorLabel}`}
              >
                <span className="font-semibold text-white">{authorLabel}</span>
                {authorRole ? <span className="text-slate-300"> · {authorRole}</span> : null}
              </Link>
              <span className="rounded-full border border-white/15 bg-white/8 px-4 py-2">{dateLabel}</span>
              <span className="rounded-full border border-white/15 bg-white/8 px-4 py-2">{readTimeLabel}</span>
            </div>

            <div className={`${compact ? 'mt-4' : 'mt-8'} flex flex-wrap gap-3`}>
              {actions.map((action) => (
                <Link
                  key={action.label}
                  to={action.to}
                  onClick={action.onClick}
                  className={
                    action.variant === 'secondary'
                      ? 'inline-flex max-w-full items-center justify-center rounded-full border border-white/20 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10'
                      : 'inline-flex max-w-full items-center justify-center rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-slate-100'
                  }
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>

          <div className={compact ? 'rounded-[22px] border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl' : 'rounded-[32px] border border-white/12 bg-white/8 p-5 sm:p-6 backdrop-blur'}>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">{searchLabel}</p>
            <ul className={compact ? 'mt-3 flex flex-wrap gap-2 text-sm leading-6 text-slate-100' : 'mt-4 space-y-3 text-sm leading-6 text-slate-100'}>
              {searchPainPoints.map((item) => (
                <li key={item} className={compact ? 'rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-200' : 'border-b border-white/10 pb-3 last:border-b-0 last:pb-0'}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={`${compact ? 'mt-5' : 'mt-10'} grid gap-4 lg:grid-cols-3`}>
          {heroPoints.map((point) => (
            <div
              key={point.label}
              className={compact ? 'rounded-[20px] border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl' : 'rounded-[28px] border border-white/12 bg-white/8 p-5 backdrop-blur'}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">{point.label}</p>
              <p className={compact ? 'mt-2 text-lg font-bold tracking-tight text-white' : 'mt-3 text-xl font-bold text-white'}>{point.value}</p>
              <p className={compact ? 'mt-2 text-xs leading-5 text-slate-300' : 'mt-3 text-sm leading-6 text-slate-200'}>{point.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ResearchArticleHero;
