import { getStaticTestimonialsByCourseTag, getStaticTestimonialsForSection } from '../../lib/staticTestimonials';

type TestimonialSnippetsProps = {
  title?: string;
  courseTag?: string;
  pageTag?: string;
  limit?: number;
  className?: string;
};

export default function TestimonialSnippets({
  title = 'What parents say',
  courseTag,
  pageTag,
  limit = 3,
  className = '',
}: TestimonialSnippetsProps) {
  const items = courseTag
    ? getStaticTestimonialsByCourseTag(courseTag, limit)
    : getStaticTestimonialsForSection({ pageTag, limit });

  if (!items.length) return null;

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm ${className}`}>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-sm leading-6 text-slate-700">&ldquo;{item.quote}&rdquo;</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              {item.parentName}
              {item.location ? ` • ${item.location}` : ''}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
