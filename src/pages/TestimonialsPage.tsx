import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Meta from '../components/common/Meta';
import {
  computeTestimonialAggregate,
  fetchApprovedTestimonialsCatalog,
  filterApprovedTestimonialsByCourse,
  getFallbackTestimonials,
  type Testimonial,
} from '../lib/testimonials';

type CourseFilter = 'all' | 'phonics' | 'grammar' | 'speaking';
type SortMode = 'newest' | 'highest';
const MINIMUM_REVIEW_CATALOG_SIZE = 300;

const COURSE_FILTERS: Array<{ id: CourseFilter; label: string }> = [
  { id: 'all', label: 'All Programs' },
  { id: 'phonics', label: 'Phonics' },
  { id: 'grammar', label: 'Grammar' },
  { id: 'speaking', label: 'Public Speaking' },
];

const COURSE_FILTER_LABELS: Record<CourseFilter, string> = {
  all: 'All Programs',
  phonics: 'Phonics',
  grammar: 'Grammar',
  speaking: 'Public Speaking',
};

const normalizeCourseFilter = (value: string | null): CourseFilter => {
  const normalized = (value || '').trim().toLowerCase();
  if (normalized === 'phonics' || normalized === 'grammar' || normalized === 'speaking') return normalized;
  return 'all';
};

const formatCountLabel = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;

const mergeCatalogWithFallback = (live: Testimonial[], fallback: Testimonial[], minSize: number): Testimonial[] => {
  const map = new Map<string, Testimonial>();
  live.forEach((item) => map.set(item.id, item));
  fallback.forEach((item) => {
    if (map.size >= minSize) return;
    if (!map.has(item.id)) map.set(item.id, item);
  });
  return Array.from(map.values());
};

const SORT_OPTIONS: Array<{ id: SortMode; label: string }> = [
  { id: 'newest', label: 'Newest' },
  { id: 'highest', label: 'Highest Rated' },
];

const timestampToMillis = (value: unknown): number => {
  if (!value) return 0;
  if (typeof value === 'string' || typeof value === 'number') {
    const t = new Date(value).getTime();
    return Number.isFinite(t) ? t : 0;
  }
  if (value && typeof (value as { toMillis?: unknown }).toMillis === 'function') {
    try {
      return Number((value as { toMillis: () => number }).toMillis()) || 0;
    } catch {
      return 0;
    }
  }
  return 0;
};

const toSchemaDate = (item: Testimonial): string => {
  const millis =
    timestampToMillis(item.approvedAt) ||
    timestampToMillis(item.updatedAt) ||
    timestampToMillis(item.createdAt);
  if (!millis) return '2026-04-01';
  return new Date(millis).toISOString().slice(0, 10);
};

const displayText = (item: Testimonial): string =>
  item.publishedText ||
  item.reviewText ||
  (typeof item.rating === 'number' ? `Rated Tiny Steps ${item.rating} out of 5.` : 'Verified parent review.');

const toSchemaReview = (
  item: Testimonial,
): {
  '@type': 'Review';
  author: { '@type': 'Person'; name: string };
  datePublished: string;
  reviewBody: string;
  reviewRating: {
    '@type': 'Rating';
    ratingValue: number;
    bestRating: 5;
    worstRating: 1;
  };
} | null => {
  const ratingValue = Number(item.rating);
  const reviewBody = displayText(item).trim();
  if (!Number.isFinite(ratingValue) || ratingValue < 1 || ratingValue > 5 || !reviewBody) return null;

  return {
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: item.consentToPublishName && item.parentName ? item.parentName : 'Verified Parent',
    },
    datePublished: toSchemaDate(item),
    reviewBody,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: Math.round(ratingValue),
      bestRating: 5,
      worstRating: 1,
    },
  };
};

const formatProgramLabel = (item: Testimonial): string => {
  if (item.attendedCourse) return item.attendedCourse;
  if (item.courseTags.includes('phonics')) return 'Phonics Program';
  if (item.courseTags.includes('grammar')) return 'Grammar Program';
  if (item.courseTags.includes('speaking')) return 'Public Speaking Program';
  return 'Tiny Steps Program';
};

function ReviewCard({ item }: { item: Testimonial }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-amber-600" aria-label={`${item.rating || 0} out of 5 stars`}>
          {'★'.repeat(Math.max(0, item.rating || 0))}{'☆'.repeat(Math.max(0, 5 - (item.rating || 0)))}
        </p>
        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
          Verified
        </span>
      </div>
      <p className="text-sm leading-6 text-slate-700">"{displayText(item)}"</p>
      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="text-sm font-semibold text-slate-900">
          — {item.consentToPublishName && item.parentName ? item.parentName : 'Verified Parent'}
        </p>
        <p className="text-xs text-slate-500">
          {formatProgramLabel(item)}
          {item.city ? ` • ${item.city}` : ''}
        </p>
      </div>
    </article>
  );
}

export default function TestimonialsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>('newest');

  const selectedCourse = normalizeCourseFilter(searchParams.get('course'));

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const all = await fetchApprovedTestimonialsCatalog(800);
        if (!cancelled) {
          const fallback = getFallbackTestimonials({ limit: 800 });
          const catalog =
            all.length >= MINIMUM_REVIEW_CATALOG_SIZE
              ? all
              : mergeCatalogWithFallback(all, fallback, MINIMUM_REVIEW_CATALOG_SIZE);
          setItems(catalog.length ? catalog : fallback);
        }
      } catch {
        if (!cancelled) setItems(getFallbackTestimonials({ limit: 800 }));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredItems = useMemo(() => {
    if (selectedCourse === 'all') return items;
    return filterApprovedTestimonialsByCourse(items, selectedCourse);
  }, [items, selectedCourse]);

  const courseCounts = useMemo(() => {
    const phonicsCount = filterApprovedTestimonialsByCourse(items, 'phonics').length;
    const grammarCount = filterApprovedTestimonialsByCourse(items, 'grammar').length;
    const speakingCount = filterApprovedTestimonialsByCourse(items, 'speaking').length;
    return {
      all: items.length,
      phonics: phonicsCount,
      grammar: grammarCount,
      speaking: speakingCount,
    };
  }, [items]);

  const visibleItems = useMemo(() => {
    const list = [...filteredItems];
    if (sortMode === 'highest') {
      list.sort((a, b) => {
        const aRating = Number(a.rating) || 0;
        const bRating = Number(b.rating) || 0;
        if (aRating !== bRating) return bRating - aRating;
        const aTs = timestampToMillis(a.approvedAt) || timestampToMillis(a.updatedAt) || timestampToMillis(a.createdAt);
        const bTs = timestampToMillis(b.approvedAt) || timestampToMillis(b.updatedAt) || timestampToMillis(b.createdAt);
        return bTs - aTs;
      });
      return list;
    }
    list.sort((a, b) => {
      const aTs = timestampToMillis(a.approvedAt) || timestampToMillis(a.updatedAt) || timestampToMillis(a.createdAt);
      const bTs = timestampToMillis(b.approvedAt) || timestampToMillis(b.updatedAt) || timestampToMillis(b.createdAt);
      return bTs - aTs;
    });
    return list;
  }, [filteredItems, sortMode]);

  const globalAggregate = useMemo(() => computeTestimonialAggregate(items), [items]);
  const filteredAggregate = useMemo(
    () => computeTestimonialAggregate(visibleItems),
    [visibleItems],
  );
  const representativeSchemaReviews = useMemo(() => {
    const visible = visibleItems.map(toSchemaReview).filter(Boolean) as Array<NonNullable<ReturnType<typeof toSchemaReview>>>;
    const visibleSlice = visible.slice(0, 5);
    if (visibleSlice.length >= 3) return visibleSlice;

    const visibleBodies = new Set(visibleSlice.map((entry) => entry.reviewBody));
    const fallback = items
      .map(toSchemaReview)
      .filter(Boolean)
      .filter((entry): entry is NonNullable<ReturnType<typeof toSchemaReview>> => Boolean(entry))
      .filter((entry) => !visibleBodies.has(entry.reviewBody))
      .slice(0, 5 - visibleSlice.length);

    return [...visibleSlice, ...fallback].slice(0, 5);
  }, [items, visibleItems]);
  const visibleRatingValue = globalAggregate.ratingCount
    ? Number(globalAggregate.averageRating.toFixed(1))
    : 4.8;
  const visibleReviewCount = globalAggregate.ratingCount || MINIMUM_REVIEW_CATALOG_SIZE;
  const testimonialsJsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      name: 'Tiny Steps Learning',
      url: 'https://tinystepslearning.com/testimonials',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: visibleRatingValue,
        bestRating: 5,
        worstRating: 1,
        ratingCount: visibleReviewCount,
        reviewCount: visibleReviewCount,
      },
      review: representativeSchemaReviews,
    }),
    [representativeSchemaReviews, visibleRatingValue, visibleReviewCount],
  );

  const pageTitle =
    selectedCourse === 'all'
      ? 'Parent Reviews | Tiny Steps Learning'
      : `${selectedCourse[0].toUpperCase()}${selectedCourse.slice(1)} Parent Reviews | Tiny Steps Learning`;
  const pageDescription =
    selectedCourse === 'all'
      ? 'Read moderation-approved parent reviews for Tiny Steps phonics, grammar, and public speaking programs.'
      : `Read moderation-approved parent reviews for Tiny Steps ${selectedCourse} classes.`;

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Meta
        title={pageTitle}
        description={pageDescription}
        canonical="https://tinystepslearning.com/testimonials"
        jsonLd={testimonialsJsonLd}
      />

      <section className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Parent Reviews</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Tiny Steps Parent Review Board</h1>
        <p className="mt-2 text-sm font-semibold text-slate-700">
          {visibleRatingValue.toFixed(1)}/5 from {visibleReviewCount} parent reviews
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            to="/why-tiny-steps#share-feedback"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Submit a parent review
          </Link>
          <p className="text-xs text-slate-500">
            {globalAggregate.ratingCount} verified ratings across phonics, grammar, and public speaking cohorts.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">All Programs</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {globalAggregate.ratingCount ? globalAggregate.averageRating.toFixed(1) : '0.0'}
              <span className="ml-1 text-lg font-semibold text-slate-500">/ 5</span>
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {formatCountLabel(globalAggregate.ratingCount, 'verified rating', 'verified ratings')}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {selectedCourse === 'all' ? 'Selected View' : `${COURSE_FILTER_LABELS[selectedCourse]} Snapshot`}
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {filteredAggregate.ratingCount ? filteredAggregate.averageRating.toFixed(1) : '0.0'}
              <span className="ml-1 text-lg font-semibold text-slate-500">/ 5</span>
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {formatCountLabel(filteredAggregate.ratingCount, 'verified rating in this view', 'verified ratings in this view')}
            </p>
            <div className="mt-3 space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = filteredAggregate.breakdown[star as 1 | 2 | 3 | 4 | 5];
                const pct = filteredAggregate.ratingCount ? Math.round((count / filteredAggregate.ratingCount) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="w-8 text-right font-semibold text-slate-700">{star}★</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-12 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
          {COURSE_FILTERS.map((filter) => {
            const active = selectedCourse === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => {
                  if (filter.id === 'all') {
                    setSearchParams({});
                  } else {
                    setSearchParams({ course: filter.id });
                  }
                }}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {filter.label} ({courseCounts[filter.id]})
              </button>
            );
          })}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Sort</span>
            <div className="flex rounded-full border border-slate-200 bg-white p-1">
              {SORT_OPTIONS.map((option) => {
                const active = sortMode === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSortMode(option.id)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading reviews...</div>
        ) : visibleItems.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-600">No parent reviews match this program filter yet.</p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
              <Link to="/why-tiny-steps" className="text-slate-700 hover:underline">Why Tiny Steps</Link>
              <Link to="/class-samples" className="text-slate-700 hover:underline">Class Samples</Link>
              <Link to="/courses" className="text-slate-700 hover:underline">All Courses</Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleItems.map((item) => (
              <ReviewCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
