import { catalogs, curriculumBySlug, type CourseCatalogItem } from './courses';

export type SubjectLandingId = 'phonics' | 'grammar' | 'speaking';

type SubjectPalette = {
  accentText: string;
  accentSurface: string;
  accentBorder: string;
  accentButton: string;
  accentButtonHover: string;
};

type SubjectLandingConfig = {
  route: string;
  breadcrumbName: string;
  seoTitle: string;
  seoDescription: string;
  eyebrow: string;
  heroTitle: string;
  heroDescription: string;
  whoIntro: string;
  learnIntro: string;
  outcomesIntro: string;
  approachIntro: string;
  ctaTitle: string;
  ctaDescription: string;
  palette: SubjectPalette;
};

export type SubjectLandingStage = {
  title: string;
  focus: string;
  lessonRange: string;
};

export type SubjectLandingTrack = {
  slug: string;
  name: string;
  age: string;
  level: string;
  lessonCount: number;
  overview: string[];
  outcomes: string[];
  stages: SubjectLandingStage[];
};

export type SubjectLandingData = SubjectLandingConfig & {
  subject: SubjectLandingId;
  ageSpan: string;
  heroBadges: string[];
  trackNames: string[];
  tracks: SubjectLandingTrack[];
  approachPoints: string[];
};

const SUBJECT_TRACK_SLUGS: Record<SubjectLandingId, string[]> = {
  phonics: ['phonics-foundation', 'phonics-brush-up', 'phonics-advanced'],
  grammar: ['basic-grammar', 'advanced-grammar'],
  speaking: ['basic-public-speaking', 'advanced-public-speaking'],
};

const SUBJECT_CONFIGS: Record<SubjectLandingId, SubjectLandingConfig> = {
  phonics: {
    route: '/phonics-classes-for-kids',
    breadcrumbName: 'Phonics Classes for Kids',
    seoTitle: 'Online Phonics Classes for Kids | Synthetic & Jolly-Style Support | Tiny Steps Learning',
    seoDescription:
      'Explore online phonics classes for kids ages 3-12 with systematic synthetic phonics, SATPIN progression, Jolly Phonics style actions, and advanced decoding support.',
    eyebrow: 'Tiny Steps Phonics',
    heroTitle: 'Phonics Classes for Kids',
    heroDescription:
      'A structured phonics pathway built around Phonics Foundations, Early Phonics, and Advanced Phonics. Children begin with letter sounds and early blending, then move into digraphs, long vowels, advanced patterns, and fluency.',
    whoIntro:
      'Choose the track that matches your child\'s current reading stage. Each option below comes directly from the Tiny Steps course catalog.',
    learnIntro:
      'These are the exact focus areas listed for each phonics track in the course catalog.',
    outcomesIntro:
      'Parents can expect the learning outcomes already defined in the Tiny Steps phonics tracks.',
    approachIntro:
      'The phonics pathway stays clear because the same catalog and curriculum structure is used across the public site.',
    ctaTitle: 'Book a free 35-minute phonics assessment session',
    ctaDescription:
      'Book your free 35-minute session and we will help you choose the right starting point across Phonics Foundations, Early Phonics, and Advanced Phonics.',
    palette: {
      accentText: 'text-sky-700',
      accentSurface: 'bg-sky-50',
      accentBorder: 'border-sky-200',
      accentButton: 'bg-gradient-to-r from-[#FF7B66] to-[#FF9B72]',
      accentButtonHover: 'hover:from-[#FF715B] hover:to-[#FF9267]',
    },
  },
  grammar: {
    route: '/english-grammar-writing-classes',
    breadcrumbName: 'Grammar Level & Writing Pathway Guide',
    seoTitle: 'Grammar Level Guide for Kids: Beginner vs Advanced | Tiny Steps',
    seoDescription:
      'Compare Beginner and Advanced Grammar levels, then choose the dedicated Grammar or Writing programme based on whether the child needs sentence accuracy or longer composition.',
    eyebrow: 'Tiny Steps • Programme Guide',
    heroTitle: 'Grammar Levels Guide: Beginner, Advanced, or Writing?',
    heroDescription:
      'Use this guide to compare the two Grammar course levels and decide when the child needs the broader Grammar programme versus dedicated Writing support. Generic grammar-class intent belongs to the Grammar programme; longer composition belongs to Writing.',
    whoIntro:
      'Compare the two Grammar course levels by current control. Use the dedicated Writing programme when idea development, paragraphs, stories, editing, or longer composition is the main need.',
    learnIntro:
      'Each Grammar level below keeps a narrow course-stage role rather than competing with the main Grammar programme page.',
    outcomesIntro:
      'Use these level-specific outcomes to compare placement; use the Grammar and Writing programme owners for broad programme decisions.',
    approachIntro:
      'The hierarchy is deliberate: /grammar owns the broad Grammar programme, these course levels own Beginner or Advanced placement, and Writing owns longer composition.',
    ctaTitle: 'Book a free assessment to choose the right Grammar level',
    ctaDescription:
      'We will identify whether the child needs Beginner Grammar, Advanced Grammar, or a Writing-focused pathway.',
    palette: {
      accentText: 'text-emerald-700',
      accentSurface: 'bg-emerald-50',
      accentBorder: 'border-emerald-200',
      accentButton: 'bg-gradient-to-r from-[#FF7B66] to-[#FF9B72]',
      accentButtonHover: 'hover:from-[#FF715B] hover:to-[#FF9267]',
    },
  },
  speaking: {
    route: '/speaking',
    breadcrumbName: 'Public Speaking & Communication Programs',
    seoTitle: 'Public Speaking & Communication Programs for Kids | Tiny Steps Learning',
    seoDescription:
      'Explore Tiny Steps public speaking and communication programs for kids with live online coaching for confidence, storytelling, structure, and presentation skills.',
    eyebrow: 'Tiny Steps Speaking',
    heroTitle: 'Public Speaking & Communication Programs',
    heroDescription:
      'A speaking pathway built around Public Speaking (Basic) and Public Speaking (Advanced). Children begin with communication confidence and clear expression, then progress to structure, storytelling, Q&A, persuasion, and presentations.',
    whoIntro:
      'These tracks cover the Tiny Steps speaking pathway from confidence-building routines to polished presentations.',
    learnIntro:
      'Each focus area below comes from the same speaking course data already used elsewhere in the site.',
    outcomesIntro:
      'Parents can use these published outcomes to understand what each speaking track is designed to build.',
    approachIntro:
      'The speaking pathway keeps expectations clear by using fixed lesson counts and named stage progressions instead of vague promises.',
    ctaTitle: 'Book a free speaking assessment',
    ctaDescription:
      'We will help you choose the right starting point between Public Speaking (Basic) and Public Speaking (Advanced).',
    palette: {
      accentText: 'text-amber-700',
      accentSurface: 'bg-amber-50',
      accentBorder: 'border-amber-200',
      accentButton: 'bg-gradient-to-r from-[#FF7B66] to-[#FF9B72]',
      accentButtonHover: 'hover:from-[#FF715B] hover:to-[#FF9267]',
    },
  },
};

const lessonCountFromDuration = (duration: string) => {
  const match = duration.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
};

const extractAgeRange = (age: string) => {
  const numbers = age.match(/\d+/g)?.map(Number) ?? [];
  if (!numbers.length) return null;
  if (numbers.length === 1) return { min: numbers[0], max: numbers[0] };
  return { min: numbers[0], max: numbers[1] };
};

const formatLessonRange = (start: number, end: number) =>
  start === end ? `Lesson ${start}` : `Lessons ${start}-${end}`;

const buildStages = (slug: string): SubjectLandingStage[] => {
  const weeks = curriculumBySlug[slug]?.weeks ?? [];
  let cursor = 1;

  return weeks.map((week) => {
    const lessonCount = week.lessons?.length ?? 0;
    const start = cursor;
    const end = lessonCount > 0 ? cursor + lessonCount - 1 : cursor;
    cursor = end + 1;

    return {
      title: week.title,
      focus: week.focus ?? '',
      lessonRange: formatLessonRange(start, end),
    };
  });
};

const buildTrack = (course: CourseCatalogItem): SubjectLandingTrack => ({
  slug: course.slug,
  name: course.name,
  age: course.age,
  level: course.level,
  lessonCount: lessonCountFromDuration(course.duration),
  overview: course.overview,
  outcomes: course.outcomes,
  stages: buildStages(course.slug),
});

const buildAgeSpan = (tracks: SubjectLandingTrack[]) => {
  const ages = tracks
    .map((track) => extractAgeRange(track.age))
    .filter((value): value is { min: number; max: number } => Boolean(value));

  if (!ages.length) return 'Ages vary by track';

  const min = Math.min(...ages.map((age) => age.min));
  const max = Math.max(...ages.map((age) => age.max));
  return `Ages ${min}-${max}`;
};

const buildApproachPoints = (tracks: SubjectLandingTrack[], ageSpan: string) => {
  const totalLessons = tracks.reduce((sum, track) => sum + track.lessonCount, 0);
  const totalStages = tracks.reduce((sum, track) => sum + track.stages.length, 0);

  return [
    `The pathway spans ${ageSpan.toLowerCase()} across ${tracks.length} named tracks.`,
    `Every track has a fixed lesson count, for a total of ${totalLessons} lessons across the full pathway.`,
    `The curriculum is broken into ${totalStages} named stages, so the next step is always visible.`,
    `Progression stays clear: ${tracks.map((track) => track.name).join(' -> ')}.`,
  ];
};

export function getSubjectLandingData(subject: SubjectLandingId): SubjectLandingData {
  const config = SUBJECT_CONFIGS[subject];
  const slugs = SUBJECT_TRACK_SLUGS[subject];
  const tracks = slugs
    .map((slug) => catalogs.find((course) => course.slug === slug))
    .filter((course): course is CourseCatalogItem => Boolean(course))
    .map(buildTrack);

  const ageSpan = buildAgeSpan(tracks);
  const totalLessons = tracks.reduce((sum, track) => sum + track.lessonCount, 0);

  return {
    subject,
    ...config,
    ageSpan,
    heroBadges: [ageSpan, `${tracks.length} tracks`, `${totalLessons} lessons across the pathway`],
    trackNames: tracks.map((track) => track.name),
    tracks,
    approachPoints: buildApproachPoints(tracks, ageSpan),
  };
}

export const SUBJECT_LANDING_ROUTE_META = Object.values(SUBJECT_CONFIGS).reduce<Record<string, {
  title: string;
  description: string;
  canonicalPath: string;
  ogType: 'website';
}>>((acc, config) => {
  acc[config.route] = {
    title: config.seoTitle,
    description: config.seoDescription,
    canonicalPath: config.route,
    ogType: 'website',
  };
  return acc;
}, {});
