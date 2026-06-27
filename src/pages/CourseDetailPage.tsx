// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import { useParams, Link } from 'react-router-dom';
import { catalogs, curriculumBySlug } from '../content/courses';
import { getCourseWeeksOverride } from '../content/curriculumLoader';
import Meta from '../components/common/Meta';
import { WeekAccordion } from '../components/curriculum/WeekAccordion';
import { applySeo } from '../lib/seo';
import { createCourseSchema, createFAQPageSchema, PUBLIC_FACTS } from '../lib/schemas';
import AutoLinkedText from '../components/seo/AutoLinkedText';
import TestimonialsSection from '../components/seo/TestimonialsSection';
import { ONE_TO_ONE_MONTHLY_PACKAGES, formatINR } from '../config/pricing';
import { trackCoursePageCtaClick } from '../lib/conversionTracking';
import {
  getPublicCoursePathForSlug,
  isCanonicalPublicCourseSlug,
  resolvePublicCoursePageBySlug,
} from '../lib/publicCoursePages.js';

const COURSE_SCHEMA_BY_SLUG: Record<string, { name: string; description: string; educationalLevel: string }> = {
  'phonics-foundation': {
    name: 'Phonics Foundation Program',
    description:
      'Beginner phonics program for children who are starting letter sounds, early blending, CVC words, and reading readiness.',
    educationalLevel: 'Foundation',
  },
  'phonics-brush-up': {
    name: 'Phonics Brush-Up Program',
    description:
      'Revision-focused phonics program for children who know some phonics but need stronger blending, decoding, fluency, and confidence.',
    educationalLevel: 'Intermediate',
  },
  'phonics-advanced': {
    name: 'Advanced Phonics Program',
    description:
      'Advanced phonics program covering digraphs, long vowels, vowel teams, tricky words, spelling patterns, reading fluency, and passage reading.',
    educationalLevel: 'Advanced',
  },
  'basic-grammar': {
    name: 'Basic Grammar Program',
    description:
      'Foundational grammar program for children covering nouns, verbs, adjectives, articles, prepositions, punctuation, and sentence formation.',
    educationalLevel: 'Beginner',
  },
  'advanced-grammar': {
    name: 'Advanced Grammar Program',
    description:
      'Advanced grammar program for children focused on tenses, sentence structure, writing accuracy, paragraph writing, editing, and confident communication.',
    educationalLevel: 'Advanced',
  },
  'basic-public-speaking': {
    name: 'Basic Public Speaking Program',
    description:
      'Beginner public speaking program for children focused on self-introduction, full-sentence speaking, picture talk, storytelling, and confidence.',
    educationalLevel: 'Beginner',
  },
  'advanced-public-speaking': {
    name: 'Advanced Public Speaking Program',
    description:
      'Advanced public speaking program for children focused on structured speeches, debates, presentations, storytelling, voice modulation, and audience confidence.',
    educationalLevel: 'Advanced',
  },
};

const WHATSAPP_BASE = 'https://wa.me/919618398383?text=';

const CourseDetailPage: FC = () => {
  const params = useParams();
  const rawSlug = params.slug ?? params.courseId;
  const normalizedRawSlug = String(rawSlug ?? '').trim().toLowerCase();
  const coursePageConfig = useMemo(() => resolvePublicCoursePageBySlug(rawSlug), [rawSlug]);
  const slug = coursePageConfig?.internalSlug ?? normalizedRawSlug;
  const courseTrack = useMemo(() => {
    if (slug.includes('grammar')) return 'grammar';
    if (slug.includes('speaking') || slug.includes('communication')) return 'speaking';
    return 'phonics';
  }, [slug]);
  const courseTag = courseTrack;
  const course = useMemo(() => catalogs.find((c) => c.slug === slug), [slug]);
  const usedHrefs = useMemo(() => new Set<string>(), []);
  const base = curriculumBySlug[slug || ''] || curriculumBySlug[normalizedRawSlug || ''] || {};
  const weeks = useMemo(() => base?.weeks ?? [], [base?.weeks]);
  const [weeksState, setWeeks] = useState(weeks);
  const canonicalPath = coursePageConfig?.routePath ?? getPublicCoursePathForSlug(rawSlug) ?? (rawSlug ? `/courses/${rawSlug}` : '/courses');
  const canonicalUrl = `${PUBLIC_FACTS.primaryWebsite}${canonicalPath}`;

  useEffect(() => {
    (async () => {
      if (!slug) return;
      const override = await getCourseWeeksOverride(slug);
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
    if (course) return;
    applySeo({
      title: 'Course not found | Tiny Steps Learning',
      description: 'The course you are looking for does not exist.',
      canonicalPath,
      robots: 'noindex, follow',
      ogType: 'website',
    });
  }, [canonicalPath, course]);

  if (!course) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20">
        <h1 className="text-2xl font-bold">Course not found</h1>
        <p className="mt-2"><Link className="text-primary-600" to="/courses">Back to courses</Link></p>
      </div>
    );
  }

  const seoTitle = coursePageConfig?.title ?? `${course.name} | Tiny Steps`;
  const seoDescription =
    coursePageConfig?.description ??
    `${course.name}: ${course.overview.slice(0, 3).join(' • ')} • ${course.frequency} • ${course.price}`;
  const courseHeading = coursePageConfig?.h1 ?? course.name;
  const isCanonicalSlug = isCanonicalPublicCourseSlug(rawSlug);
  const starterPackage = ONE_TO_ONE_MONTHLY_PACKAGES[0];
  const whatsappHref = `${WHATSAPP_BASE}${encodeURIComponent(
    `Hi Tiny Steps! I want help choosing the right ${courseHeading} option for my child.`
  )}`;
  const courseSchemaConfig = COURSE_SCHEMA_BY_SLUG[course.slug] || {
    name: course.name,
    description: `${course.name} — ${course.overview.join(', ')}`,
    educationalLevel: course.level,
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${PUBLIC_FACTS.primaryWebsite}/` },
      { '@type': 'ListItem', position: 2, name: 'Courses', item: `${PUBLIC_FACTS.primaryWebsite}/courses` },
      {
        '@type': 'ListItem',
        position: 3,
        name: coursePageConfig?.breadcrumbName ?? course.name,
        item: canonicalUrl,
      },
    ],
  };

  const jsonLd = [breadcrumbSchema, createCourseSchema({
    name: courseSchemaConfig.name,
    description: courseSchemaConfig.description,
    url: canonicalUrl,
    educationalLevel: courseSchemaConfig.educationalLevel,
  })];

  if (Array.isArray(coursePageConfig?.faq) && coursePageConfig.faq.length > 0 && isCanonicalSlug) {
    jsonLd.push({
      ...createFAQPageSchema(coursePageConfig.faq),
      '@id': `${canonicalUrl}#faq`,
    });
  }

  return (
    <div className="bg-white">
      <Meta
        title={seoTitle}
        description={seoDescription}
        canonical={canonicalUrl}
        jsonLd={jsonLd}
        keywords={Array.isArray(coursePageConfig?.keywords) ? coursePageConfig.keywords.join(', ') : undefined}
      />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <span className="text-3xl">{course.icon}</span>
          <h1>{courseHeading}</h1>
        </div>
        <div className="mt-1 text-sm text-gray-600">{course.age} • {course.duration} • {course.frequency} • Level: {course.level}</div>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
          {seoDescription}
        </p>
        <div className="mt-5 max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-slate-700">
          Premium 1:1 pricing starts at {formatINR(400)}/class, with the 12-class starter plan at {formatINR(starterPackage.monthlyFee)} when that format fits your child.
        </div>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link
            to="/book-demo"
            onClick={() => trackCoursePageCtaClick({
              page_path: canonicalPath,
              cta_label: 'Book Free Assessment',
              cta_location: 'hero',
              destination_path: '/book-demo',
              program: courseTrack,
            })}
            className="inline-flex items-center rounded-full bg-primary-600 px-4 py-2 font-semibold text-white transition hover:bg-primary-700"
          >
            Book Free Assessment
          </Link>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackCoursePageCtaClick({
              page_path: canonicalPath,
              cta_label: 'WhatsApp Academic Advisor',
              cta_location: 'hero',
              destination_path: '/contact',
              program: courseTrack,
            })}
            className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 font-semibold text-emerald-800 transition hover:bg-emerald-100"
          >
            WhatsApp Academic Advisor
          </a>
          <Link to="/courses" className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900">
            Compare All Courses
          </Link>
        </div>
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
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Parent Trust</p>
          <p className="mt-2 text-sm text-slate-700">
            This page includes a curated sample of parent feedback for this learning track. Tiny Steps serves 5000+ students across 15+ countries with structured phonics, grammar, reading, and speaking pathways.
          </p>
          <p className="mt-2 text-sm text-slate-700">
            If you are unsure whether this is the right starting point, book a free assessment first and ask for the exact first 12-class plan before enrolling.
          </p>
          <p className="mt-2 text-sm text-slate-700">
            For fresh public reviews, parents may also check trusted third-party profiles such as Trustpilot, JustDial, and Reddit.
          </p>
        </div>

        <TestimonialsSection
          title="Parent feedback for this learning track"
          subtitle="Approved reviews from families in the same course pathway."
          courseTag={courseTag}
          limit={3}
          compact
          className="px-0"
          viewAllHref="/testimonials"
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

        {Array.isArray(coursePageConfig?.faq) && coursePageConfig.faq.length > 0 ? (
          <section id="faq" className="mt-12 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-heading text-2xl font-bold text-slate-900">Frequently Asked Questions</h2>
            <div className="mt-5 space-y-4">
              {coursePageConfig.faq.map((item) => (
                <article key={item.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-base font-semibold text-slate-900">{item.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{item.answer}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-12 rounded-2xl bg-slate-50 p-6">
          <h3 className="font-heading text-lg font-bold text-slate-900">Next Steps</h3>
          <p className="mt-1 text-sm text-slate-600">Continue exploring related guidance or book a personalized assessment for your child.</p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium">
            <Link to="/courses" className="text-primary-700 hover:underline">← All Courses</Link>
            {slug.includes('phonic') && <Link to="/phonics" className="text-primary-700 hover:underline">View Phonics Track</Link>}
            {slug.includes('grammar') && <Link to="/grammar" className="text-primary-700 hover:underline">View Grammar Track</Link>}
            {(slug.includes('speaking') || slug.includes('communication')) && <Link to="/speaking" className="text-primary-700 hover:underline">View Speaking Track</Link>}
            <Link to="/why-tiny-steps" className="text-primary-700 hover:underline">Why Choose Us?</Link>
            <Link to="/class-samples" className="text-primary-700 hover:underline">See Class Samples</Link>
            <Link to="/contact?book=1" className="inline-flex items-center rounded-full bg-primary-600 px-4 py-1.5 text-white transition hover:bg-primary-700">Book Free Assessment</Link>
          </div>
          {Array.isArray(coursePageConfig?.relatedLinks) && coursePageConfig.relatedLinks.length > 0 ? (
            <div className="mt-6 border-t border-slate-200 pt-5">
              <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Related Parent Resources</h4>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                {coursePageConfig.relatedLinks.map((item) => (
                  <Link key={item.to} to={item.to} className="text-primary-700 hover:underline">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
};

export default CourseDetailPage;
