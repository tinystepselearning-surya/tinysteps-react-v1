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
};

type ResearchArticleHeroProps = {
  eyebrowPrimary: string;
  eyebrowSecondary: string;
  title: string;
  description: string;
  authorLabel?: string;
  dateLabel: string;
  readTimeLabel: string;
  actions: HeroAction[];
  searchPainPoints: string[];
  heroPoints: HeroPoint[];
};

const ResearchArticleHero: React.FC<ResearchArticleHeroProps> = ({
  eyebrowPrimary,
  eyebrowSecondary,
  title,
  description,
  authorLabel = 'Tiny Steps Research Desk',
  dateLabel,
  readTimeLabel,
  actions,
  searchPainPoints,
  heroPoints,
}) => {
  return (
    <section className="relative isolate overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,186,119,0.28),_transparent_34%),radial-gradient(circle_at_82%_18%,_rgba(94,170,255,0.28),_transparent_30%),linear-gradient(160deg,_rgba(15,23,42,0.98)_0%,_rgba(15,23,42,0.95)_46%,_rgba(10,37,79,0.96)_100%)]" />
      <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-[#ff8a3d]/20 blur-3xl" />
      <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-28 sm:pb-20 sm:pt-32">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_360px] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-100">
              {eyebrowPrimary}
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff8a3d]" />
              {eyebrowSecondary}
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              {title}
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">{description}</p>

            <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-slate-200">
              <span className="rounded-full border border-white/15 bg-white/8 px-4 py-2">{authorLabel}</span>
              <span className="rounded-full border border-white/15 bg-white/8 px-4 py-2">{dateLabel}</span>
              <span className="rounded-full border border-white/15 bg-white/8 px-4 py-2">{readTimeLabel}</span>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {actions.map((action) => (
                <Link
                  key={action.label}
                  to={action.to}
                  className={
                    action.variant === 'secondary'
                      ? 'inline-flex items-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10'
                      : 'inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100'
                  }
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/12 bg-white/8 p-6 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">Parents often search</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-100">
              {searchPainPoints.map((item) => (
                <li key={item} className="border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {heroPoints.map((point) => (
            <div
              key={point.label}
              className="rounded-[28px] border border-white/12 bg-white/8 p-5 backdrop-blur"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">{point.label}</p>
              <p className="mt-3 text-xl font-bold text-white">{point.value}</p>
              <p className="mt-3 text-sm leading-6 text-slate-200">{point.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ResearchArticleHero;
