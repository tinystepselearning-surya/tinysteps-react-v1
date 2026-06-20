import type { ReactNode } from 'react';

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  badges?: string[];
  actions?: ReactNode;
  align?: 'left' | 'center';
};

export default function PageHero({
  eyebrow,
  title,
  description,
  badges = [],
  actions,
  align = 'left',
}: PageHeroProps) {
  const isCenter = align === 'center';
  const badgeStyles = [
    'border-[#F5DAB7] bg-[#FFF7EC] text-[#7A4A10]',
    'border-[#D6E6F7] bg-[#F6FBFF] text-[#214667]',
    'border-[#E4DCF8] bg-[#FBF8FF] text-[#4F447B]',
    'border-[#D4EFDF] bg-[#F4FFF8] text-[#235F49]',
  ];

  return (
    <section className="relative overflow-hidden px-6 pb-10 pt-28 sm:pb-12 sm:pt-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,214,170,0.65),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(186,230,253,0.5),_transparent_34%),radial-gradient(circle_at_60%_85%,_rgba(221,214,254,0.35),_transparent_22%),linear-gradient(180deg,_#fffaf4_0%,_#ffffff_68%,_#f8fbff_100%)]" />
        <div className="absolute -left-24 top-8 h-64 w-64 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-violet-200/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className={`max-w-3xl ${isCenter ? 'mx-auto text-center' : ''}`}>
          {eyebrow ? (
            <p className={`inline-flex rounded-full border border-orange-200/80 bg-white/88 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-700 shadow-sm ${isCenter ? 'justify-center' : ''}`}>
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">{title}</h1>
          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">{description}</p>

          {badges.length ? (
            <div className={`mt-6 flex flex-wrap gap-2 ${isCenter ? 'justify-center' : ''}`}>
              {badges.map((badge, index) => (
                <span
                  key={badge}
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold shadow-sm ${badgeStyles[index % badgeStyles.length]}`}
                >
                  {badge}
                </span>
              ))}
            </div>
          ) : null}

          {actions ? <div className={`mt-8 flex flex-wrap gap-3 ${isCenter ? 'justify-center' : ''}`}>{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}
