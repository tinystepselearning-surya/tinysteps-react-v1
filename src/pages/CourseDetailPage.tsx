// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import { useParams, Link } from 'react-router-dom';
import { catalogs, curriculumBySlug } from '../content/courses';
import { getCourseWeeksOverride } from '../content/curriculumLoader';
import Meta from '../components/common/Meta';
import { WeekAccordion } from '../components/curriculum/WeekAccordion';
import { applySeo } from '../lib/seo';
import AutoLinkedText from '../components/seo/AutoLinkedText';
import TestimonialsSection from '../components/seo/TestimonialsSection';
import {
  createCourseReviewSchemaFragment,
  computeTestimonialAggregate,
  fetchApprovedTestimonialsCatalog,
  filterApprovedTestimonialsByCourse,
  getFallbackTestimonials,
  getCourseTagFromSlug,
  type Testimonial,
} from '../lib/testimonials';

const CourseDetailPage: FC = () => {
  const params = useParams();
  const rawSlug = params.slug ?? params.courseId;
  const normalizeSlug = (value?: string | null) => {
    const key = String(value ?? '').trim();
    if (!key) return '';
    const lower = key.toLowerCase();
    if (lower === 'grammar-essentials') return 'basic-grammar';
    if (lower === 'grammar-mastery') return 'advanced-grammar';
    if (lower === 'public-speaking-foundations') return 'basic-public-speaking';
    if (lower === 'public-speaking-excellence') return 'advanced-public-speaking';
    return lower;
  };
  const slug = normalizeSlug(rawSlug);
  const courseTag = getCourseTagFromSlug(slug);
  const courseTrack = useMemo(() => {
    if (slug.includes('grammar')) return 'grammar';
    if (slug.includes('speaking') || slug.includes('communication')) return 'speaking';
    return 'phonics';
  }, [slug]);
  const course = useMemo(() => catalogs.find((c) => c.slug === slug), [slug]);
  const [courseReviewItems, setCourseReviewItems] = useState<Testimonial[]>(() =>
    filterApprovedTestimonialsByCourse(getFallbackTestimonials({ limit: 800 }), courseTrack),
  );
  const usedHrefs = useMemo(() => new Set<string>(), [slug]);
  const base = curriculumBySlug[slug || ''] || curriculumBySlug[rawSlug || ''] || {};
  const weeks = useMemo(() => base?.weeks ?? [], [base?.weeks]);
  const [weeksState, setWeeks] = useState(weeks);
  const courseAggregate = useMemo(
    () => computeTestimonialAggregate(courseReviewItems),
    [courseReviewItems],
  );

  useEffect(() => {
    (async () => {
      if (!slug) return;
      const override = await getCourseWeeksOverride(rawSlug || slug);
      const baseWeeks = weeks;
      if (override && override.length && baseWeeks?.length && override.length === baseWeeks.length) {
        const merged = baseWeeks.map((baseItem, idx) => ({
          ...baseItem,
          focus: override[idx]?.focus ?? baseItem.focus,
          learns: override[idx]?.learns ?? baseItem.learns,
          activities: override[idx]?.activities ?? baseItem.activities,
          homework: override[idx]?.homework ?? baseItem.homework,
          mastery: override[idx]?.mastery ?? baseItem.mastery,
        }));
        setWeeks(merged);
        return;
      }
      setWeeks(baseWeeks);
    })();
  }, [slug, rawSlug, weeks]);

  useEffect(() => {
    if (course) document.title = `${course.name} | Tiny Steps`;
  }, [course, slug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fallback = filterApprovedTestimonialsByCourse(
        getFallbackTestimonials({ limit: 800 }),
        courseTrack,
      );
      if (!cancelled) setCourseReviewItems(fallback);

      try {
        const approved = await fetchApprovedTestimonialsCatalog(800);
        const catalog = approved.length ? approved : getFallbackTestimonials({ limit: 800 });
        if (cancelled) return;
        const filtered = filterApprovedTestimonialsByCourse(catalog, courseTrack);
        setCourseReviewItems(filtered);
      } catch {
        if (cancelled) return;
        setCourseReviewItems(fallback);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseTrack]);

  useEffect(() => {
    if (course) return;
    applySeo({
      title: 'Course not found | Tiny Steps Learning',
      description: 'The course you are looking for does not exist.',
      canonicalPath: rawSlug ? `/courses/${rawSlug}` : '/courses',
      robots: 'noindex, follow',
      ogType: 'website',
    });
  }, [course, rawSlug]);

  if (!course) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20">
        <h1 className="text-2xl font-bold">Course not found</h1>
        <p className="mt-2"><Link className="text-primary-600" to="/courses">Back to courses</Link></p>
      </div>
    );
  }

  const priceNumber =
    (course.price || '').match(/₹\s*([\d,]+)/)?.[1]?.replace(/,/g, '') || '0';
  const canonicalUrl = `https://tinystepslearning.com/courses/${course.slug}`;
  const jsonLd: any = useMemo(() => {
    const reviewFragment = createCourseReviewSchemaFragment({
      items: courseReviewItems,
      maxReviews: 5,
    });

    return {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: course.name,
      description: `${course.name} — ${course.overview.join(', ')}`,
      provider: { '@type': 'Organization', name: 'Tiny Steps Online School', sameAs: 'https://tinystepslearning.com' },
      courseCode: course.slug.toUpperCase().replace(/-/g, '_'),
      educationLevel: course.level,
      audience: { '@type': 'EducationalAudience', educationalRole: 'student', age: course.age.replace('Ages ', '') },
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: 'OnlineCoursePlatform',
        offers: {
          '@type': 'Offer',
          price: priceNumber,
          priceCurrency: 'INR',
          availability: 'https://schema.org/InStock'
        }
      },
      ...reviewFragment,
    };
  }, [course, courseReviewItems, priceNumber]);

  return (
    <div className="bg-white">
      <Meta
        title={`${course.name} | Tiny Steps`}
        description={`${course.name}: ${course.overview.slice(0,3).join(' • ')} • ${course.frequency} • ${course.price}`}
        canonical={canonicalUrl}
        jsonLd={jsonLd}
      />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <span className="text-3xl">{course.icon}</span>
          <h1>{course.name}</h1>
        </div>
        <div className="mt-1 text-sm text-gray-600">{course.age} • {course.duration} • {course.frequency} • Level: {course.level}</div>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="font-semibold">Quick Overview</h2>
            <ul className="mt-2 list-disc pl-5 text-sm text-gray-800">
              {course.overview.map((o) => <li key={o}><AutoLinkedText text={o} usedHrefs={usedHrefs} /></li>)}
            </ul>
          </div>
          <div>
            <h2 className="font-semibold">Learning Outcomes</h2>
            <ul className="mt-2 list-disc pl-5 text-sm text-gray-800">
              {course.outcomes.map((o) => <li key={o}><AutoLinkedText text={o} usedHrefs={usedHrefs} /></li>)}
            </ul>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Track Parent Rating</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {courseAggregate.ratingCount ? courseAggregate.averageRating.toFixed(1) : '0.0'}
            <span className="ml-1 text-lg font-semibold text-slate-500">/ 5</span>
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {courseAggregate.ratingCount} {courseAggregate.ratingCount === 1 ? 'approved rating' : 'approved ratings'} for this learning track
          </p>
        </div>

        <TestimonialsSection
          title="Parent feedback for this learning track"
          subtitle="Approved reviews from families in the same course pathway."
          courseTag={courseTag}
          limit={3}
          compact
          className="px-0"
          viewAllHref={`/testimonials?course=${courseTrack}`}
          viewAllLabel="View all program reviews"
        />

        <div className="mt-10">
          <h2 className="font-heading text-2xl font-bold">Detailed Curriculum</h2>
          {weeksState && weeksState.length ? (
            <div className="mt-3">
              <WeekAccordion items={weeksState} />
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-700">Detailed lesson‑by‑lesson curriculum coming soon.</p>
          )}
        </div>

        <div className="mt-12 rounded-2xl bg-slate-50 p-6">
          <h3 className="font-heading text-lg font-bold text-slate-900">Next Steps</h3>
          <p className="mt-1 text-sm text-slate-600">Continue exploring or contact us for a personalized plan.</p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium">
            <Link to="/courses" className="text-primary-700 hover:underline">← All Courses</Link>
            {slug.includes('phonic') && <Link to="/phonics" className="text-primary-700 hover:underline">View Phonics Track</Link>}
            {slug.includes('grammar') && <Link to="/grammar" className="text-primary-700 hover:underline">View Grammar Track</Link>}
            {(slug.includes('speaking') || slug.includes('communication')) && <Link to="/speaking" className="text-primary-700 hover:underline">View Speaking Track</Link>}
            <Link to="/why-tiny-steps" className="text-primary-700 hover:underline">Why Choose Us?</Link>
            <Link to="/class-samples" className="text-primary-700 hover:underline">See Class Samples</Link>
            <Link to="/contact?book=1" className="inline-flex items-center rounded-full bg-primary-600 px-4 py-1.5 text-white transition hover:bg-primary-700">Book Free Assessment</Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CourseDetailPage;
