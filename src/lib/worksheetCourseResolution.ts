export type WorksheetCourseLike = {
  id: string;
  courseId?: string;
  name?: string;
  title?: string;
  label?: string;
  area?: string;
  status?: string;
};

export type WorksheetLessonLike = {
  id: string;
  area?: string;
  folderId?: string;
  courseId?: string;
  courseTitle?: string;
};

export type WorksheetFolderLike = {
  id: string;
  area?: string;
  title?: string;
  courseId?: string;
  courseTitle?: string;
};

export type WorksheetCourseResolution = {
  courseId: string;
  courseTitle: string;
  source: 'lesson' | 'folder' | 'inferred' | 'unresolved';
  ambiguous: boolean;
  score: number;
};

const AREA_ALIASES: Record<string, string> = {
  public_speaking: 'public speaking',
  'public-speaking': 'public speaking',
  speaking: 'public speaking',
  trial_classes: 'trial classes',
  'trial-classes': 'trial classes',
  spokenenglish: 'trial classes',
  'spoken-english': 'trial classes',
  spoken_english: 'trial classes',
};

function normalizeText(value: unknown): string {
  const raw = String(value ?? '').trim().toLowerCase();
  return AREA_ALIASES[raw] ?? raw.replace(/[_-]+/g, ' ');
}

function slugify(value: unknown): string {
  return normalizeText(value)
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function tokenSet(...values: unknown[]): Set<string> {
  return new Set(
    values
      .flatMap((value) => normalizeText(value).split(/[^a-z0-9]+/g))
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

function sameArea(a: unknown, b: unknown): boolean {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.includes('public speaking') && right.includes('public speaking')) return true;
  if (left.includes('trial') && right.includes('trial')) return true;
  return false;
}

export function worksheetCourseTitle(course: WorksheetCourseLike | null | undefined): string {
  if (!course) return '';
  return String(course.name || course.title || course.label || course.courseId || course.id || '').trim();
}

function findCourseById(courses: WorksheetCourseLike[], rawId: unknown): WorksheetCourseLike | null {
  const id = String(rawId ?? '').trim();
  if (!id) return null;
  return courses.find((course) => String(course.id || '').trim() === id || String(course.courseId || '').trim() === id) ?? null;
}

function scoreCourse(
  course: WorksheetCourseLike,
  lesson: WorksheetLessonLike,
  folder: WorksheetFolderLike | null,
): number {
  const folderTitle = String(folder?.title || '').trim();
  const folderSlug = slugify(folderTitle);
  const courseId = String(course.id || course.courseId || '').trim();
  const title = worksheetCourseTitle(course);
  const titleSlug = slugify(title);
  const targetTokens = tokenSet(folderTitle, lesson.area, folder?.area);
  const courseTokens = tokenSet(courseId, title, course.area);

  let score = 0;
  if (folderSlug && (courseId === folderSlug || titleSlug === folderSlug)) score += 220;
  else if (folderSlug && (titleSlug.includes(folderSlug) || folderSlug.includes(titleSlug))) score += 150;

  if (sameArea(lesson.area || folder?.area, course.area)) score += 80;

  let overlap = 0;
  targetTokens.forEach((token) => {
    if (courseTokens.has(token)) overlap += 1;
  });
  score += overlap * 20;

  if (targetTokens.size > 0 && Array.from(targetTokens).every((token) => courseTokens.has(token))) score += 50;

  const status = String(course.status || '').trim().toLowerCase();
  if (status === 'inactive' || status === 'draft' || status === 'archived') score -= 20;

  return score;
}

export function resolveWorksheetCourse(input: {
  lesson: WorksheetLessonLike | null | undefined;
  folder?: WorksheetFolderLike | null;
  courses: WorksheetCourseLike[];
}): WorksheetCourseResolution {
  const lesson = input.lesson;
  const folder = input.folder ?? null;
  const courses = input.courses || [];

  if (!lesson) {
    return { courseId: '', courseTitle: '', source: 'unresolved', ambiguous: false, score: 0 };
  }

  const lessonCourseId = String(lesson.courseId || '').trim();
  if (lessonCourseId) {
    const course = findCourseById(courses, lessonCourseId);
    return {
      courseId: lessonCourseId,
      courseTitle: String(lesson.courseTitle || worksheetCourseTitle(course) || lessonCourseId).trim(),
      source: 'lesson',
      ambiguous: false,
      score: Number.MAX_SAFE_INTEGER,
    };
  }

  const folderCourseId = String(folder?.courseId || '').trim();
  if (folderCourseId) {
    const course = findCourseById(courses, folderCourseId);
    return {
      courseId: folderCourseId,
      courseTitle: String(folder?.courseTitle || worksheetCourseTitle(course) || folderCourseId).trim(),
      source: 'folder',
      ambiguous: false,
      score: Number.MAX_SAFE_INTEGER - 1,
    };
  }

  const ranked = courses
    .map((course) => ({ course, score: scoreCourse(course, lesson, folder) }))
    .sort((a, b) => b.score - a.score || worksheetCourseTitle(a.course).localeCompare(worksheetCourseTitle(b.course)));

  const best = ranked[0];
  if (!best || best.score < 140) {
    return { courseId: '', courseTitle: '', source: 'unresolved', ambiguous: false, score: best?.score || 0 };
  }

  const second = ranked[1];
  const ambiguous = !!second && second.score >= best.score - 15;
  if (ambiguous) {
    return { courseId: '', courseTitle: '', source: 'unresolved', ambiguous: true, score: best.score };
  }

  return {
    courseId: String(best.course.id || best.course.courseId || '').trim(),
    courseTitle: worksheetCourseTitle(best.course),
    source: 'inferred',
    ambiguous: false,
    score: best.score,
  };
}
