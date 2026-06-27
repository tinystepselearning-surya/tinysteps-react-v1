import type { ReactNode } from 'react';

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
      return 'border-orange-200 bg-orange-50 text-orange-900';
  }
}

function buttonClass(variant: CtaItem['variant']) {
  switch (variant) {
    case 'secondary':
      return 'border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100';
    case 'ghost':
      return 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50';
    case 'primary':
    default:
      return 'bg-slate-900 text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)] hover:bg-slate-800';
  }
}

export function LeadPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-x-clip bg-gradient-to-b from-orange-50/40 via-white to-sky-50/45 pb-20">
      <div className="pointer-events-none absolute -left-20 top-20 h-64 w-64 rounded-full bg-orange-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-12 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />
      {children}
    </div>
  );
}

export function LeadHero({
  actions,
  aside,
  eyebrow,
  stats,
  supportingText,
  title,
  trustChips,
  description,
}: {
  actions?: ReactNode;
  aside?: ReactNode;
  eyebrow: string;
  stats?: StatItem[];
  supportingText?: ReactNode;
  title: string;
  trustChips?: TrustChip[];
  description: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden px-6 py-10 md:py-12 lg:px-8 lg:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,_rgba(251,146,60,0.18),_transparent_30%),radial-gradient(circle_at_85%_0%,_rgba(125,211,252,0.2),_transparent_36%),linear-gradient(180deg,_rgba(255,248,239,0.96),_rgba(248,250,252,0.94))]" />
      <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        <div>
          <p className="inline-flex rounded-full border border-orange-200/80 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-700 shadow-sm">
            {eyebrow}
          </p>
          <h1 className="mt-4 max-w-[720px] text-[38px] font-black leading-[1.03] tracking-[-0.035em] text-slate-950 md:text-[48px] lg:text-[56px]">
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

        <div className="space-y-4">
          {aside}
          {stats?.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-white/80 bg-white/92 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">{item.value}</p>
                  {item.helper ? <p className="mt-1 text-sm text-slate-600">{item.helper}</p> : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
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
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
}) {
  return (
    <div>
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{eyebrow}</p> : null}
      <h2 className="mt-2 text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">{title}</h2>
      {description ? <div className="mt-3 max-w-4xl text-sm leading-7 text-slate-700 sm:text-base">{description}</div> : null}
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
    <div className={`rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.08)] ${className}`}>
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
  title,
}: {
  actions?: ReactNode;
  description: ReactNode;
  title: string;
}) {
  return (
    <LeadCard className="overflow-hidden border-slate-900 bg-slate-900 px-6 py-8 text-white md:px-8">
      <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
      <div className="mt-3 max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">{description}</div>
      {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
    </LeadCard>
  );
}
