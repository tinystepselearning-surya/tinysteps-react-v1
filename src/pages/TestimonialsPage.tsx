import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Meta from '../components/common/Meta';
import {
  fetchApprovedTestimonialsCatalog,
  filterApprovedTestimonialsByCourse,
  getFallbackTestimonials,
  type Testimonial,
} from '../lib/testimonials';

type CourseFilter = 'all' | 'phonics' | 'grammar' | 'speaking';
const MINIMUM_REVIEW_CATALOG_SIZE = 300;

const COURSE_FILTERS: Array<{ id: CourseFilter; label: string }> = [
  { id: 'all', label: 'All Programs' },
  { id: 'phonics', label: 'Phonics' },
  { id: 'grammar', label: 'Grammar' },
  { id: 'speaking', label: 'Public Speaking' },
];

const normalizeCourseFilter = (value: string | null): CourseFilter => {
  const normalized = (value || '').trim().toLowerCase();
  if (normalized === 'phonics' || normalized === 'grammar' || normalized === 'speaking') return normalized;
  return 'all';
};

const mergeCatalogWithFallback = (live: Testimonial[], fallback: Testimonial[], minSize: number): Testimonial[] => {
  const map = new Map<string, Testimonial>();
  live.forEach((item) => map.set(item.id, item));
  fallback.forEach((item) => {
    if (map.size >= minSize) return;
    if (!map.has(item.id)) map.set(item.id, item);
  });
  return Array.from(map.values());
};
const quickAnswerFaqItems = [
  {
    question: 'What do Tiny Steps testimonials show?',
    answer:
      'They show parent experiences with Tiny Steps classes, including how children participate, respond to teachers, and build confidence over time.',
  },
  {
    question: 'Can testimonials help parents choose the right program?',
    answer:
      'Yes. Testimonials can help parents understand whether the child needs support in phonics, grammar, sentence formation, communication, or public speaking.',
  },
  {
    question: 'Do all children progress at the same speed?',
    answer:
      "No. Each child's progress depends on age, current level, consistency, class participation, and practice outside class.",
  },
  {
    question: 'What should parents look for in testimonials?',
    answer:
      'Parents should look for comments about teacher guidance, child engagement, reading confidence, sentence confidence, clarity, participation, and parent communication.',
  },
];
const quickAnswerFaqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': 'https://tinystepslearning.com/testimonials#quick-answer-faq',
  mainEntity: quickAnswerFaqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};

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

const displayText = (item: Testimonial): string =>
  item.publishedText ||
  item.reviewText ||
  'Parent shared feedback for Tiny Steps.';

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
      <p className="text-sm leading-6 text-slate-700">"{displayText(item)}"</p>
      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="text-sm font-semibold text-slate-900">
          — {item.consentToPublishName && item.parentName ? item.parentName : 'Parent'}
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
    list.sort((a, b) => {
      const aTs = timestampToMillis(a.approvedAt) || timestampToMillis(a.updatedAt) || timestampToMillis(a.createdAt);
      const bTs = timestampToMillis(b.approvedAt) || timestampToMillis(b.updatedAt) || timestampToMillis(b.createdAt);
      return bTs - aTs;
    });
    return list;
  }, [filteredItems]);

  const pageJsonLd = useMemo(() => [quickAnswerFaqSchema], []);

  const pageTitle =
    selectedCourse === 'all'
      ? 'Parent Reviews | Tiny Steps Learning'
      : `${selectedCourse[0].toUpperCase()}${selectedCourse.slice(1)} Parent Reviews | Tiny Steps Learning`;
  const pageDescription =
    selectedCourse === 'all'
      ? 'Read parent feedback and experiences for Tiny Steps phonics, grammar, and public speaking programs.'
      : `Read parent feedback and experiences for Tiny Steps ${selectedCourse} classes.`;

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Meta
        title={pageTitle}
        description={pageDescription}
        canonical="https://tinystepslearning.com/testimonials"
        jsonLd={pageJsonLd}
      />

      <section className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Parent Feedback</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Stories from Tiny Steps Families</h1>
        <p className="mt-2 text-sm text-slate-700">
          Real parent experiences on what felt helpful, how children responded, and what improved over time.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            to="/why-tiny-steps#share-feedback"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Submit a parent review
          </Link>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <section className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
            <h2 className="text-2xl font-bold text-slate-900">Quick Answer for Parents</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Tiny Steps testimonials help parents understand how children experience our online English learning classes
              across phonics, grammar, sentence formation, communication, and public speaking. Parent feedback can show
              improvements in reading confidence, participation, sentence confidence, clarity, and willingness to speak.
              Testimonials should be viewed as real parent experiences, while each child&apos;s progress may vary based on
              age, current level, consistency, and practice.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {quickAnswerFaqItems.map((item) => (
                <article key={item.question} className="rounded-xl border border-slate-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-slate-900">{item.question}</h3>
                  <p className="mt-2 text-sm text-slate-700">{item.answer}</p>
                </article>
              ))}
            </div>
          </section>
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
        </div>

        {isLoading ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading parent stories...</div>
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
