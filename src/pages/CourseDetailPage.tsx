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
import {
  CourseCTAGroup,
  FAQSection,
  FinalLeadCTA,
  LeadCard,
  LeadHero,
  LeadPageShell,
  LeadSection,
  LeadSectionHeading,
} from '../components/marketing/LeadPageSections';
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
  const programPath = courseTrack === 'phonics' ? '/phonics' : courseTrack === 'grammar' ? '/grammar' : '/speaking';
  const programLabel = courseTrack === 'phonics' ? 'Phonics' : courseTrack === 'grammar' ? 'Grammar' : 'Speaking & Communication';
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
      { '@type': 'ListItem', position: 2, name: 'Curriculum', item: `${PUBLIC_FACTS.primaryWebsite}/curriculum` },
      { '@type': 'ListItem', position: 3, name: programLabel, item: `${PUBLIC_FACTS.primaryWebsite}${programPath}` },
      {
        '@type': 'ListItem',
        position: 4,
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
    <LeadPageShell>
      <Meta
        title={seoTitle}
        description={seoDescription}
        canonical={canonicalUrl}
        jsonLd={jsonLd}
        keywords={Array.isArray(coursePageConfig?.keywords) ? coursePageConfig.keywords.join(', ') : undefined}
      />
      <LeadHero
        eyebrow={`${course.icon} Tiny Steps • ${course.level} course`}
        title={courseHeading}
        description={seoDescription}
        trustChips={[
          { label: course.age, tone: 'warm' },
          { label: course.duration, tone: 'cool' },
          { label: course.frequency, tone: 'neutral' },
          { label: `${formatINR(400)}/class`, tone: 'mint' },
        ]}
        supportingText={`Premium 1:1 pricing starts at ${formatINR(400)}/class, with the 12-class starter plan at ${formatINR(starterPackage.monthlyFee)} when that format fits your child.`}
        stats={[
          { label: 'Students guided', value: '5000+', helper: 'Structured programs across phonics, grammar, reading, and speaking' },
          { label: 'Countries reached', value: '15+', helper: 'Parent trust built across India and global family communities' },
          { label: 'Course level', value: course.level, helper: 'Assessment-led placement before enrollment' },
          { label: 'Program format', value: 'Live 1:1', helper: 'Pacing adjusts to the child rather than a group average' },
        ]}
        actions={
          <CourseCTAGroup
            items={[
              {
                label: 'Book Free 35-Minute Demo',
                to: '/book-demo',
                variant: 'primary',
                onClick: () =>
                  trackCoursePageCtaClick({
                    page_path: canonicalPath,
                    cta_label: 'Book Free 35-Minute Demo',
                    cta_location: 'hero',
                    destination_path: '/book-demo',
                    program: courseTrack,
                  }),
              },
              {
                label: 'WhatsApp Academic Advisor',
                href: whatsappHref,
                variant: 'secondary',
                onClick: () =>
                  trackCoursePageCtaClick({
                    page_path: canonicalPath,
                    cta_label: 'WhatsApp Academic Advisor',
                    cta_location: 'hero',
                    destination_path: '/contact',
                    program: courseTrack,
                  }),
              },
              { label: 'View Full Curriculum Roadmap', to: '/curriculum', variant: 'ghost' },
            ]}
            renderLink={(item, className) =>
              item.to ? (
                <Link key={item.label} to={item.to} onClick={item.onClick} className={className}>
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={item.onClick}
                  className={className}
                >
                  {item.label}
                </a>
              )
            }
          />
        }
        aside={
          <LeadCard className="bg-[linear-gradient(150deg,rgba(255,255,255,0.98),rgba(248,251,255,0.94),rgba(255,250,244,0.92))]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Parent trust</p>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              This page includes a curated sample of parent feedback for this learning track. If you are unsure whether this is the right starting point, book the free 35-minute 1:1 online demo assessment class first and ask for the exact first 12-class plan before enrolling.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pricing trust</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{formatINR(400)}/class • {formatINR(starterPackage.monthlyFee)} / 12 classes</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Delivery model</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">Assessment first, then level-based progression</p>
              </div>
            </div>
          </LeadCard>
        }
      />

      <LeadSection>
        <LeadCard className="bg-gradient-to-br from-white via-orange-50/40 to-sky-50/40">
          <LeadSectionHeading
            eyebrow="Course overview"
            title="What this course helps your child improve first"
            description="The layout is premium, but the content stays course-specific so parents can still judge fit quickly."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <LeadCard className="border-slate-100 bg-white">
              <h3 className="text-lg font-semibold text-slate-900">Quick overview</h3>
              <ul className="mt-4 space-y-2 text-sm leading-7 text-slate-700">
                {course.overview.map((o) => (
                  <li key={o}>• <AutoLinkedText text={o} usedHrefs={usedHrefs} /></li>
                ))}
              </ul>
            </LeadCard>
            <LeadCard className="border-slate-100 bg-white">
              <h3 className="text-lg font-semibold text-slate-900">Learning outcomes</h3>
              <ul className="mt-4 space-y-2 text-sm leading-7 text-slate-700">
                {course.outcomes.map((o) => (
                  <li key={o}>• <AutoLinkedText text={o} usedHrefs={usedHrefs} /></li>
                ))}
              </ul>
            </LeadCard>
          </div>
        </LeadCard>
      </LeadSection>

      <LeadSection className="pb-2">
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
      </LeadSection>

      <LeadSection>
        <LeadCard>
          <LeadSectionHeading
            eyebrow="Lesson path"
            title="How the course unfolds lesson by lesson"
            description="Parents can see the learning path clearly before they commit."
          />
          <p className="mt-3 text-sm leading-6 text-slate-700">
            This page owns the detailed lesson sequence for this level. For the relationship between Phonics, Grammar, and Speaking, see the{' '}
            <Link to="/curriculum" className="font-semibold text-slate-900 underline underline-offset-4">
              complete Tiny Steps curriculum roadmap
            </Link>.
          </p>
          {weeksState && weeksState.length ? (
            <div className="mt-5">
              <WeekAccordion items={weeksState} />
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-700">Detailed lesson-by-lesson curriculum coming soon.</p>
          )}
        </LeadCard>
      </LeadSection>

      {Array.isArray(coursePageConfig?.faq) && coursePageConfig.faq.length > 0 ? (
        <LeadSection id="faq">
          <LeadCard>
            <LeadSectionHeading
              eyebrow="FAQs"
              title="Questions parents usually ask before enrolling"
              description="FAQ content stays course-specific and continues to support valid structured data."
            />
            <div className="mt-6">
              <FAQSection items={coursePageConfig.faq} />
            </div>
          </LeadCard>
        </LeadSection>
      ) : null}

      <LeadSection className="pb-4">
        <FinalLeadCTA
          title="Need help confirming whether this is the right starting level?"
          description="Continue exploring related guidance or book a personalized assessment before choosing the course pack."
          actions={
            <CourseCTAGroup
              items={[
                {
                  label: 'Book Free 35-Minute Demo',
                  to: '/book-demo',
                  variant: 'primary',
                  onClick: () =>
                    trackCoursePageCtaClick({
                      page_path: canonicalPath,
                      cta_label: 'Book Free 35-Minute Demo',
                      cta_location: 'footer',
                      destination_path: '/book-demo',
                      program: courseTrack,
                    }),
                },
                { label: 'View Full Curriculum Roadmap', to: '/curriculum', variant: 'ghost' },
                { label: `View ${programLabel} Program`, to: programPath, variant: 'ghost' },
              ]}
              renderLink={(item, className) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={item.onClick}
                  className={`${className} ${item.variant === 'ghost' ? 'border-white/30 bg-transparent text-white hover:bg-white/10' : 'bg-white text-slate-900 hover:bg-slate-100'}`}
                >
                  {item.label}
                </Link>
              )}
            />
          }
        />
        {Array.isArray(coursePageConfig?.relatedLinks) && coursePageConfig.relatedLinks.length > 0 ? (
          <div className="mx-auto mt-5 max-w-7xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Related parent resources</h3>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              {coursePageConfig.relatedLinks.map((item) => (
                <Link key={item.to} to={item.to} className="font-semibold text-slate-900 underline underline-offset-4">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </LeadSection>
    </LeadPageShell>
  );
};

export default CourseDetailPage;
