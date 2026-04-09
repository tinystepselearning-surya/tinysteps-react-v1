import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchApprovedTestimonials, getFallbackTestimonials, type Testimonial } from '../../lib/testimonials';

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

const formatReviewer = (item: Testimonial): string => {
  if (item.consentToPublishName && item.parentName) return item.parentName;
  return item.reviewerType === 'teacher' ? 'Verified Teacher' : 'Verified Parent';
};

const formatChildLine = (item: Testimonial): string | null => {
  const agePart = typeof item.childAge === 'number' && item.childAge > 0 ? `${item.childAge}-year-old` : '';
  if (item.consentToPublishChildName && item.childName) {
    return agePart ? `Parent of ${item.childName}, age ${item.childAge}` : `Parent of ${item.childName}`;
  }
  if (agePart) return `Parent of a ${agePart}`;
  return null;
};

const formatCourseLabel = (item: Testimonial): string | null => {
  if (item.attendedCourse) return item.attendedCourse;
  if (item.courseTags.includes('phonics')) return 'Phonics Program';
  if (item.courseTags.includes('grammar')) return 'Grammar Program';
  if (item.courseTags.includes('speaking')) return 'Public Speaking Program';
  return null;
};

function TestimonialCard({ item, compact }: { item: Testimonial; compact?: boolean }) {
  const childLine = formatChildLine(item);
  const courseLine = formatCourseLabel(item);
  const displayText =
    item.publishedText ||
    item.reviewText ||
    (typeof item.rating === 'number' ? `Rated Tiny Steps ${item.rating} out of 5.` : 'Verified parent review.');

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {typeof item.rating === 'number' ? (
        <p className="mb-2 text-sm font-semibold text-amber-600" aria-label={`${item.rating} out of 5 stars`}>
          {'★'.repeat(item.rating)}{'☆'.repeat(Math.max(0, 5 - item.rating))}
        </p>
      ) : null}
      <p className={`text-slate-700 ${compact ? 'text-sm leading-6' : 'text-base leading-7'}`}>"{displayText}"</p>
      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="text-sm font-semibold text-slate-900">— {formatReviewer(item)}</p>
        {childLine ? <p className="text-xs text-slate-500">{childLine}</p> : null}
        {item.city ? <p className="text-xs text-slate-500">{item.city}</p> : null}
        {courseLine ? <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{courseLine}</p> : null}
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
  const [items, setItems] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadTestimonials() {
      setIsLoading(true);
      try {
        const liveItems = await fetchApprovedTestimonials({ pageTag, courseTag, featuredOnly, limit });
        if (cancelled) return;

        if (liveItems.length > 0) {
          setItems(liveItems);
        } else {
          setItems(getFallbackTestimonials({ pageTag, courseTag, featuredOnly, limit }));
        }
      } catch {
        if (cancelled) return;
        setItems(getFallbackTestimonials({ pageTag, courseTag, featuredOnly, limit }));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadTestimonials();
    return () => {
      cancelled = true;
    };
  }, [courseTag, featuredOnly, limit, pageTag]);

  const columnsClass = useMemo(() => (compact ? 'md:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-3'), [compact]);

  if (!isLoading && items.length === 0) {
    return (
      <section className={`px-6 py-8 ${className}`.trim()}>
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-2 text-sm text-slate-600">{subtitle}</p> : null}
          <p className="mt-4 text-sm text-slate-600">Parent testimonials will appear here after approval.</p>
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
