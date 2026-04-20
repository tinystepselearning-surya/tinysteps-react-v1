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
      accentButton: 'bg-slate-900',
      accentButtonHover: 'hover:bg-slate-700',
    },
  },
  grammar: {
    route: '/english-grammar-writing-classes',
    breadcrumbName: 'English Grammar & Writing Classes',
    seoTitle: 'English Grammar & Writing Classes for Kids | Tiny Steps Learning',
    seoDescription:
      'Explore Tiny Steps English grammar and writing classes for kids with live online support for sentence structure, punctuation, grammar control, and writing clarity.',
    eyebrow: 'Tiny Steps Grammar',
    heroTitle: 'English Grammar & Writing Classes',
    heroDescription:
      'A grammar and writing pathway built around Beginner Grammar and Advanced Grammar. Children build sentence structure, punctuation, grammar control, and guided writing before moving into advanced editing and writing clarity.',
    whoIntro:
      'These two grammar tracks cover the full Tiny Steps grammar pathway from foundations to advanced writing control.',
    learnIntro:
      'Each track below is rendered from the same course overview bullets used in the Tiny Steps catalog.',
    outcomesIntro:
      'These are the outcomes currently defined for the Tiny Steps grammar tracks.',
    approachIntro:
      'The grammar pathway is designed to stay easy to follow: fixed lesson counts, named stages, and a clear move from foundations to advanced writing.',
    ctaTitle: 'Book a free grammar assessment',
    ctaDescription:
      'We will help you choose the right starting point between Beginner Grammar and Advanced Grammar.',
    palette: {
      accentText: 'text-emerald-700',
      accentSurface: 'bg-emerald-50',
      accentBorder: 'border-emerald-200',
      accentButton: 'bg-slate-900',
      accentButtonHover: 'hover:bg-slate-700',
    },
  },
  speaking: {
    route: '/public-speaking-communication-kids',
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
      accentButton: 'bg-slate-900',
      accentButtonHover: 'hover:bg-slate-700',
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
