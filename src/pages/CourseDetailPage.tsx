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
import type { StaticTestimonialProgram } from '../lib/staticTestimonials';
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
    name: 'Phonics Foundations Program',
    description:
      'Beginner phonics program for children building letter-sound knowledge, oral blending, CVC decoding, early spelling, and reading readiness.',
    educationalLevel: 'Foundation',
  },
  'phonics-brush-up': {
    name: 'Early Phonics Program',
    description:
      'Early phonics program for developing readers covering digraphs, long vowels, vowel teams, Magic E, core phonics rules, decoding, and spelling.',
    educationalLevel: 'Early',
  },
  'phonics-advanced': {
    name: 'Advanced Phonics Program',
    description:
      'Advanced phonics program covering complex vowel patterns, advanced sound families, longer-word decoding, spelling patterns, and connected reading fluency.',
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

const TESTIMONIAL_PROGRAM_BY_COURSE_SLUG: Record<string, StaticTestimonialProgram> = {
  'phonics-foundation': 'Phonics Foundations',
  'phonics-brush-up': 'Early Phonics',
  'phonics-advanced': 'Advanced Phonics',
  'basic-grammar': 'Basic Grammar',
  'advanced-grammar': 'Advanced Grammar',
  'basic-public-speaking': 'Basic Public Speaking',
  'advanced-public-speaking': 'Advanced Public Speaking',
};

const COURSE_PAGE_GUIDE = [
  {
    href: '#course-fit',
    number: '01',
    title: 'Check the fit',
    detail: 'Match the outcomes to what your child needs now.',
  },
  {
    href: '#lesson-path',
    number: '02',
    title: 'See the learning path',
    detail: 'Review the exact stages and lesson sequence.',
  },
  {
    href: '#parent-feedback',
    number: '03',
    title: 'Review parent feedback',
    detail: 'Read feedback from the same course level.',
  },
  {
    href: '#faq',
    number: '04',
    title: 'Clear final questions',
    detail: 'Check placement and progression before deciding.',
  },
] as const;

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
  const stageAuthority = coursePageConfig?.stageAuthority;
  const testimonialProgram = TESTIMONIAL_PROGRAM_BY_COURSE_SLUG[course.slug];
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
    teaches: Array.isArray(coursePageConfig?.teaches) ? coursePageConfig.teaches : undefined,
  })];

  if (Array.isArray(coursePageConfig?.faq) && coursePageConfig.faq.length > 0 && isCanonicalSlug) {
    jsonLd.push({
      ...createFAQPageSchema(coursePageConfig.faq),
      '@id': `${canonicalUrl}#faq`,
    });
  }

  if (Array.isArray(stageAuthority?.sequence) && stageAuthority.sequence.length > 0 && isCanonicalSlug) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${canonicalUrl}#phonics-program-stages`,
      name: 'Tiny Steps phonics programme stages',
      itemListElement: stageAuthority.sequence.map((stage, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: stage.name,
        item: `${PUBLIC_FACTS.primaryWebsite}${stage.routePath}`,
      })),
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
              This page includes a curated sample of parent feedback for this course level. If you are unsure whether this is the right starting point, book the free 35-minute 1:1 online demo assessment class first and ask for the exact first 12-class plan before enrolling.
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

      <section className="px-6 pb-3 lg:px-8" aria-label="How to use this course page">
        <div className="mx-auto max-w-7xl rounded-[1.75rem] border border-slate-200/90 bg-white/90 p-3 shadow-[0_14px_36px_rgba(15,23,42,0.07)] backdrop-blur sm:p-4">
          <div className="flex flex-col gap-1 px-2 pb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">A clear decision path</p>
            <p className="text-xs leading-5 text-slate-500">Follow the page in order, then use the free assessment only if you still need placement help.</p>
          </div>
          <ol className="grid gap-2 md:grid-cols-4">
            {COURSE_PAGE_GUIDE.map((step) => (
              <li key={step.href}>
                <a
                  href={step.href}
                  className="group flex h-full items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-3.5 py-3 transition hover:border-slate-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                >
                  <span className="mt-0.5 text-xs font-black tracking-[0.12em] text-orange-600">{step.number}</span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-900 group-hover:text-slate-950">{step.title}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-slate-500">{step.detail}</span>
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <LeadSection id="course-fit" className="scroll-mt-24">
        <LeadCard className="bg-gradient-to-br from-white via-orange-50/40 to-sky-50/40">
          <LeadSectionHeading
            eyebrow="Step 1 · Course fit"
            title="First, check what this course is designed to improve"
            description="Match these outcomes to what you are seeing now. If several points fit your child, continue to the lesson path below."
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

      {stageAuthority ? (
        <LeadSection id="phonics-stage-fit" className="scroll-mt-24">
          <LeadCard className="bg-gradient-to-br from-white via-sky-50/35 to-orange-50/35">
            <LeadSectionHeading
              eyebrow="Course fit · Phonics stage"
              title={stageAuthority.title}
              description={stageAuthority.directAnswer}
            />

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <LeadCard className="border-slate-100 bg-white">
                <h3 className="text-lg font-semibold text-slate-900">Signs this may be the right starting stage</h3>
                <ul className="mt-4 space-y-2 text-sm leading-7 text-slate-700">
                  {stageAuthority.entrySignals.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </LeadCard>
              <LeadCard className="border-slate-100 bg-white">
                <h3 className="text-lg font-semibold text-slate-900">Skills this stage builds</h3>
                <ul className="mt-4 space-y-2 text-sm leading-7 text-slate-700">
                  {stageAuthority.skillsBuilt.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </LeadCard>
              <LeadCard className="border-slate-100 bg-white">
                <h3 className="text-lg font-semibold text-slate-900">Readiness to move forward</h3>
                <ul className="mt-4 space-y-2 text-sm leading-7 text-slate-700">
                  {stageAuthority.exitSignals.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </LeadCard>
            </div>

            {Array.isArray(stageAuthority.sequence) && stageAuthority.sequence.length > 0 ? (
              <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
                <h3 className="text-lg font-semibold text-slate-900">Tiny Steps phonics progression</h3>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-700">
                  Foundation, Early, and Advanced are readiness-based stages. The assessment helps identify the most useful starting point, and children move forward when the underlying skills are secure rather than simply because of age.
                </p>
                <ol className="mt-5 grid gap-4 md:grid-cols-3">
                  {stageAuthority.sequence.map((stage, index) => {
                    const isCurrentStage = stage.routePath === canonicalPath;
                    return (
                      <li
                        key={stage.routePath}
                        className={`rounded-2xl border p-4 ${isCurrentStage ? 'border-slate-400 bg-slate-50' : 'border-slate-200 bg-white'}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Stage {index + 1} • {stage.level}
                          </span>
                          {isCurrentStage ? (
                            <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white">Current stage</span>
                          ) : null}
                        </div>
                        <Link
                          to={stage.routePath}
                          aria-current={isCurrentStage ? 'page' : undefined}
                          className="mt-3 block text-base font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4"
                        >
                          {stage.name}
                        </Link>
                        <p className="mt-2 text-sm leading-6 text-slate-700">{stage.summary}</p>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ) : null}
          </LeadCard>
        </LeadSection>
      ) : null}

      <LeadSection id="lesson-path" className="scroll-mt-24">
        <LeadCard>
          <LeadSectionHeading
            eyebrow="Step 2 · Learning path"
            title="Then, see how the course unfolds lesson by lesson"
            description="The first stage is open as a sample. Expand only the stages you want to inspect, or open all stages for a complete curriculum view."
          />
          <p className="mt-3 text-sm leading-6 text-slate-700">
            See the detailed lesson sequence for this level below. For the relationship between Phonics, Grammar, and Speaking, see the{' '}
            <Link to="/curriculum" className="font-semibold text-slate-900 underline underline-offset-4">
              complete Tiny Steps curriculum roadmap
            </Link>.
          </p>
          {weeksState && weeksState.length ? (
            <div className="mt-5">
              <WeekAccordion items={weeksState} defaultOpenFirst />
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-700">Detailed lesson-by-lesson curriculum coming soon.</p>
          )}
        </LeadCard>
      </LeadSection>

      <LeadSection id="parent-feedback" className="scroll-mt-24 pb-2">
        <TestimonialsSection
          eyebrow="Step 3 · Parent feedback"
          title={`Parent feedback for ${course.name}`}
          subtitle="Approved feedback from families in this exact course level, shown after the curriculum so you can compare the learning plan with the outcomes parents noticed."
          program={testimonialProgram}
          courseTag={courseTrack}
          limit={3}
          compact
          className="px-0"
          viewAllHref="/testimonials"
          viewAllLabel="View all program reviews"
        />
      </LeadSection>

      {Array.isArray(coursePageConfig?.faq) && coursePageConfig.faq.length > 0 ? (
        <LeadSection id="faq" className="scroll-mt-24">
          <LeadCard>
            <LeadSectionHeading
              eyebrow="Step 4 · Before you decide"
              title="Questions parents usually ask before enrolling"
              description="Use these answers to clear placement, progression, and course-expectation questions before choosing a starting level."
            />
            <div className="mt-6">
              <FAQSection items={coursePageConfig.faq} />
            </div>
          </LeadCard>
        </LeadSection>
      ) : null}

      <LeadSection className="pb-4">
        <FinalLeadCTA
          title="Not sure this is the right starting level?"
          description="The free 35-minute 1:1 demo is an assessment, not a commitment. We’ll check your child’s current skills, confirm the most useful starting level, and suggest the first learning focus."
          actions={
            <>
              <Link
                to="/book-demo"
                onClick={() =>
                  trackCoursePageCtaClick({
                    page_path: canonicalPath,
                    cta_label: 'Book Free 35-Minute Demo',
                    cta_location: 'footer',
                    destination_path: '/book-demo',
                    program: courseTrack,
                  })
                }
                className="inline-flex items-center justify-center rounded-full border border-white bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-[0_12px_26px_rgba(0,0,0,0.18)] transition hover:bg-orange-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                Book Free 35-Minute Demo
              </Link>
              <Link
                to="/curriculum"
                onClick={() =>
                  trackCoursePageCtaClick({
                    page_path: canonicalPath,
                    cta_label: 'View Curriculum Roadmap',
                    cta_location: 'footer',
                    destination_path: '/curriculum',
                    program: courseTrack,
                  })
                }
                className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:border-white/70 hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                View Curriculum Roadmap
              </Link>
            </>
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
