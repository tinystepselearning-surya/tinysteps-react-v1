import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getStaticTestimonialsForSection, type StaticTestimonial } from '../../lib/staticTestimonials';

type TestimonialsSectionProps = {
  title: string;
  subtitle?: string;
  limit?: number;
  pageTag?: string;
  courseTag?: string;
  featuredOnly?: boolean;
  compact?: boolean;
  className?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
};

const formatChildLine = (item: StaticTestimonial): string | null => {
  if (typeof item.childAge === 'number' && item.childAge > 0) return `Parent of a ${item.childAge}-year-old learner`;
  return null;
};

function TestimonialCard({ item, compact }: { item: StaticTestimonial; compact?: boolean }) {
  const childLine = formatChildLine(item);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="mb-2 text-sm font-semibold text-amber-600" aria-label={`${item.rating} out of 5 stars`}>
        {'★'.repeat(item.rating)}
      </p>
      <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
      <p className={`mt-2 text-slate-700 ${compact ? 'text-sm leading-6' : 'text-base leading-7'}`}>"{item.quote}"</p>
      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="text-sm font-semibold text-slate-900">— {item.parentName}</p>
        {childLine ? <p className="text-xs text-slate-500">{childLine}</p> : null}
        {item.location ? <p className="text-xs text-slate-500">{item.location}</p> : null}
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{item.program}</p>
      </div>
    </article>
  );
}

export default function TestimonialsSection({
  title,
  subtitle,
  limit = 4,
  pageTag,
  courseTag,
  featuredOnly = false,
  compact = false,
  className = '',
  viewAllHref,
  viewAllLabel = 'View all reviews',
}: TestimonialsSectionProps) {
  void featuredOnly;

  const items = useMemo(
    () => getStaticTestimonialsForSection({ pageTag, courseTag, limit }),
    [courseTag, limit, pageTag],
  );

  const columnsClass = useMemo(() => (compact ? 'md:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-3'), [compact]);

  if (items.length === 0) {
    return (
      <section className={`px-6 py-8 ${className}`.trim()}>
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-2 text-sm text-slate-600">{subtitle}</p> : null}
          <p className="mt-4 text-sm text-slate-600">Parent testimonials will appear here soon.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={`px-6 py-8 ${className}`.trim()}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Parent Reviews</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h2>
            {subtitle ? <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">{subtitle}</p> : null}
          </div>
          {viewAllHref ? (
            <Link
              to={viewAllHref}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              {viewAllLabel}
            </Link>
          ) : null}
        </div>
        <div className={`grid gap-4 ${columnsClass}`}>
          {items.map((item) => (
            <TestimonialCard key={item.id} item={item} compact={compact} />
          ))}
        </div>
      </div>
    </section>
  );
}
