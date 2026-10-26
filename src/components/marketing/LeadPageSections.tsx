import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

type TrustChip = {
  label: string;
  tone?: 'warm' | 'cool' | 'neutral' | 'mint';
};

type StatItem = {
  label: string;
  value: string;
  helper?: string;
};

type CtaItem = {
  href?: string;
  onClick?: () => void;
  label: string;
  to?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
};

function toneClass(tone: TrustChip['tone']) {
  switch (tone) {
    case 'cool':
      return 'border-sky-200 bg-sky-50 text-sky-900';
    case 'mint':
      return 'border-emerald-200 bg-emerald-50 text-emerald-900';
    case 'neutral':
      return 'border-slate-200 bg-white text-slate-800';
    case 'warm':
    default:
      return 'border-[#E5C7D8] bg-[#FFE5EB] text-[#603C62]';
  }
}

function buttonClass(variant: CtaItem['variant']) {
  switch (variant) {
    case 'secondary':
      return 'border border-[#CDBDE8] bg-[#F1EDFC] text-[#4D3972] hover:bg-[#E5DDF8]';
    case 'ghost':
      return 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50';
    case 'primary':
    default:
      return 'bg-[#212B5C] text-white shadow-[0_12px_28px_rgba(33,43,92,0.16)] hover:bg-[#384C80]';
  }
}

export function LeadPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="lead-page-shell relative overflow-x-clip bg-gradient-to-b from-[#E7F3FF] via-[#F8F6FF] to-[#F4F8FF] pb-20">
      <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-[#CC8994]/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-12 h-80 w-80 rounded-full bg-sky-200/35 blur-3xl" />
      <div className="pointer-events-none absolute left-1/3 top-[42rem] h-72 w-72 rounded-full bg-[#755E96]/10 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 top-[78rem] h-64 w-64 rounded-full bg-emerald-100/35 blur-3xl" />
      {children}
    </div>
  );
}

export function LeadHero({
  actions,
  alignDesktopTop = false,
  aside,
  compactTopSpacing = false,
  eyebrow,
  eyebrowClassName,
  stats,
  supportingText,
  title,
  trustChips,
  description,
  showLeftDecoration = true,
}: {
  actions?: ReactNode;
  alignDesktopTop?: boolean;
  aside?: ReactNode;
  compactTopSpacing?: boolean;
  eyebrow: string;
  eyebrowClassName?: string;
  stats?: StatItem[];
  supportingText?: ReactNode;
  title: ReactNode;
  trustChips?: TrustChip[];
  description: ReactNode;
  showLeftDecoration?: boolean;
}) {
  const hasHeroSidebar = aside != null || Boolean(stats?.length);

  return (
    <section
      className={
        compactTopSpacing
          ? 'relative overflow-hidden px-6 pb-12 pt-16 md:pb-14 md:pt-10 lg:px-8 lg:pb-16 lg:pt-6'
          : 'relative overflow-hidden px-6 py-12 md:py-14 lg:px-8 lg:py-16'
      }
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_12%,_rgba(204,137,148,0.15),_transparent_28%),radial-gradient(circle_at_88%_4%,_rgba(110,149,210,0.20),_transparent_32%),linear-gradient(135deg,_rgba(231,243,255,0.94),_rgba(241,237,252,0.85)_48%,_rgba(255,245,223,0.68))]" />
      {showLeftDecoration ? (
        <div className="pointer-events-none absolute left-[4%] top-12 h-24 w-24 rounded-full border border-[#D7E5F4] bg-white/25" />
      ) : null}
      <div className="pointer-events-none absolute right-[7%] top-24 h-16 w-16 rotate-12 rounded-2xl border border-sky-200/70 bg-white/30" />
      <div
        className={`relative mx-auto grid max-w-7xl gap-10 ${hasHeroSidebar ? 'lg:grid-cols-[1.04fr_0.96fr]' : 'lg:grid-cols-1'} ${
          alignDesktopTop ? 'lg:items-start' : 'lg:items-center'
        }`}
      >
        <div>
          <p
            className={twMerge(
              'inline-flex rounded-full border border-[#D7E5F4] bg-gradient-to-r from-white via-[#F1EDFC] to-[#FFF5DF] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#604577] shadow-[0_8px_24px_rgba(33,43,92,0.06)]',
              eyebrowClassName,
            )}
          >
            {eyebrow}
          </p>
          <h1 className="mt-5 max-w-[760px] text-[40px] font-black leading-[1.02] tracking-[-0.042em] text-slate-950 md:text-[52px] lg:text-[62px]">
            {title}
          </h1>
          <div className="mt-5 max-w-[680px] text-base leading-7 text-slate-700 md:text-lg md:leading-8">
            {description}
          </div>
          {trustChips?.length ? (
            <div className="mt-7 flex flex-wrap gap-2.5">
              {trustChips.map((chip) => (
                <span
                  key={chip.label}
                  className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-semibold shadow-sm ${toneClass(chip.tone)}`}
                >
                  {chip.label}
                </span>
              ))}
            </div>
          ) : null}
          {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}
          {supportingText ? <div className="mt-5 max-w-3xl text-sm leading-6 text-slate-700">{supportingText}</div> : null}
        </div>

        {hasHeroSidebar ? (
          <div className="space-y-4">
            {aside}
            {stats?.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {stats.map((item, index) => (
                  <div
                    key={item.label}
                    className={`rounded-3xl border p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(15,23,42,0.12)] ${
                      index % 4 === 0
                        ? 'border-[#E3DDF3] bg-gradient-to-br from-white to-[#F1EDFC]'
                        : index % 4 === 1
                          ? 'border-sky-200/80 bg-gradient-to-br from-white to-[#E7F3FF]'
                          : index % 4 === 2
                            ? 'border-[#D7E5F4] bg-gradient-to-br from-white to-[#EAF6F5]'
                            : 'border-[#E3DDF3] bg-gradient-to-br from-white to-[#F1EDFC]'
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                    <p className="mt-1 text-2xl font-bold text-slate-950">{item.value}</p>
                    {item.helper ? <p className="mt-1 text-sm text-slate-600">{item.helper}</p> : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function CourseCTAGroup({
  items,
  renderLink,
}: {
  items: CtaItem[];
  renderLink: (item: CtaItem, className: string) => ReactNode;
}) {
  return (
    <>
      {items.map((item) =>
        renderLink(
          item,
          `inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition ${buttonClass(item.variant)}`,
        ),
      )}
    </>
  );
}

export function LeadSection({
  children,
  className = '',
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`px-6 py-7 lg:px-8 ${className}`}>
      <div className="mx-auto max-w-7xl">{children}</div>
    </section>
  );
}

export function LeadSectionHeading({
  eyebrow,
  title,
  description,
  tone = 'light',
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  tone?: 'light' | 'dark';
}) {
  const isDark = tone === 'dark';

  return (
    <div>
      {eyebrow ? (
        <p
          className={`text-xs font-semibold uppercase tracking-[0.18em] ${
            isDark ? 'text-[#FFE5EB]' : 'text-slate-500'
          }`}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={`mt-2 text-2xl font-bold leading-tight sm:text-3xl ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}
      >
        {title}
      </h2>
      {description ? (
        <div
          className={`mt-3 max-w-4xl text-sm leading-7 sm:text-base ${
            isDark ? 'text-slate-200' : 'text-slate-700'
          }`}
        >
          {description}
        </div>
      ) : null}
    </div>
  );
}

export function LeadCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={twMerge(
        'rounded-[2rem] border border-slate-200/90 bg-white/95 p-6 shadow-[0_20px_54px_rgba(15,23,42,0.09)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FAQSection({
  items,
}: {
  items: Array<{ answer: ReactNode; question: string }>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <LeadCard key={item.question} className="bg-slate-50/90">
          <h3 className="text-base font-semibold text-slate-900">{item.question}</h3>
          <div className="mt-2 text-sm leading-7 text-slate-700">{item.answer}</div>
        </LeadCard>
      ))}
    </div>
  );
}

export function FinalLeadCTA({
  actions,
  description,
  statement,
  title,
}: {
  actions?: ReactNode;
  description: ReactNode;
  statement?: ReactNode;
  title: string;
}) {
  return (
    <LeadCard className="overflow-hidden border-slate-900 bg-slate-900 px-6 py-8 text-white md:px-8">
      <div className={statement ? 'grid gap-7 lg:grid-cols-[1.08fr_0.92fr] lg:items-center' : ''}>
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
          <div className="mt-3 max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">{description}</div>
          {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
        {statement ? (
          <div className="rounded-3xl border border-white/15 bg-white/[0.07] p-5 shadow-inner md:p-6">
            {statement}
          </div>
        ) : null}
      </div>
    </LeadCard>
  );
}
