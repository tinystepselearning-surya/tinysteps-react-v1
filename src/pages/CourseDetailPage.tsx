// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { catalogs, curriculumBySlug } from '../content/courses';
import { getCourseWeeksOverride } from '../content/curriculumLoader';
import Meta from '../components/common/Meta';
import { WeekAccordion } from '../components/curriculum/WeekAccordion';

const CourseDetailPage: React.FC = () => {
  const { slug } = useParams();
  const course = useMemo(() => catalogs.find((c) => c.slug === slug), [slug]);
  const base = curriculumBySlug[slug || ''] || {};
  const [weeks, setWeeks] = useState(base.weeks || []);

  useEffect(() => {
    (async () => {
      if (!slug) return;
      const override = await getCourseWeeksOverride(slug);
      if (override && override.length) setWeeks(override);
      else setWeeks(base.weeks || []);
    })();
  }, [slug]);

  useEffect(() => {
    if (course) document.title = `${course.name} | Tiny Steps`;
  }, [course]);

  if (!course) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20">
        <h1 className="text-2xl font-bold">Course not found</h1>
        <p className="mt-2"><Link className="text-primary-600" to="/courses">Back to courses</Link></p>
      </div>
    );
  }

  const priceNumber = (course.price || '').replace(/[^0-9]/g, '') || '0';
  const reviewCountMatch = (course.reviews || '').match(/\((\d+) reviews\)/i);
  const ratingCount = reviewCountMatch ? reviewCountMatch[1] : undefined;
  const jsonLd: any = {
    '@context': 'https://schema.org/',
    '@type': 'Course',
    name: course.name,
    description: `${course.name} — ${course.overview.join(', ')}`,
    provider: { '@type': 'Organization', name: 'Tiny Steps Online School', sameAs: 'https://tinystepslearning.com' },
    courseCode: course.slug.toUpperCase().replace(/-/g, '_'),
    educationLevel: course.level,
    audience: { '@type': 'EducationalAudience', educationalRole: 'student', age: course.age.replace('Ages ', '') },
    duration: 'P12W',
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'OnlineCoursePlatform',
      offers: {
        '@type': 'Offer',
        price: priceNumber,
        priceCurrency: 'INR',
        availability: 'http://schema.org/InStock'
      }
    }
  };
  if (ratingCount) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: '5.0',
      ratingCount
    };
  }

  return (
    <div className="bg-white">
      <Meta
        title={`${course.name} | Tiny Steps`}
        description={`${course.name}: ${course.overview.slice(0,3).join(' • ')} • ${course.frequency} • ${course.price}`}
        canonical={`https://tinystepslearning.com/courses/${course.slug}`}
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
              {course.overview.map((o) => <li key={o}>{o}</li>)}
            </ul>
          </div>
          <div>
            <h2 className="font-semibold">Learning Outcomes</h2>
            <ul className="mt-2 list-disc pl-5 text-sm text-gray-800">
              {course.outcomes.map((o) => <li key={o}>{o}</li>)}
            </ul>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="font-heading text-2xl font-bold">Detailed Curriculum</h2>
          {weeks && weeks.length ? (
            <div className="mt-3">
              <WeekAccordion items={weeks} />
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-700">Detailed week‑by‑week curriculum coming soon.</p>
          )}
        </div>

        <div className="mt-10 text-sm text-gray-700">
          <Link className="text-primary-600" to="/courses">← Back to all courses</Link>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
