export interface TeacherTopicResumeProgress {
  id: string;
  updatedAt?: unknown;
  savedAt?: unknown;
  createdAt?: unknown;
}

export interface TeacherTopicResumeCurriculumTopic {
  id: string;
  order: number;
}

function timestampMs(value: unknown): number {
  if (!value) return 0;
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof value === 'object') {
    const row = value as {
      toMillis?: () => number;
      toDate?: () => Date;
      seconds?: number;
      nanoseconds?: number;
      _seconds?: number;
      _nanoseconds?: number;
    };
    if (typeof row.toMillis === 'function') {
      const millis = row.toMillis();
      return Number.isFinite(millis) ? millis : 0;
    }
    if (typeof row.toDate === 'function') {
      const millis = row.toDate().getTime();
      return Number.isFinite(millis) ? millis : 0;
    }
    const seconds = Number(row.seconds ?? row._seconds);
    const nanoseconds = Number(row.nanoseconds ?? row._nanoseconds ?? 0);
    if (Number.isFinite(seconds)) {
      return seconds * 1000 + (Number.isFinite(nanoseconds) ? nanoseconds / 1_000_000 : 0);
    }
  }
  return 0;
}

function progressSavedAtMs(progress: TeacherTopicResumeProgress): number {
  return Math.max(
    timestampMs(progress.updatedAt),
    timestampMs(progress.savedAt),
    timestampMs(progress.createdAt),
  );
}

/**
 * Resolve the lesson the teacher should land on when opening Topic Progress.
 *
 * Only progress rows that still belong to the current curriculum are eligible.
 * The most recently saved row wins. When legacy rows have no usable timestamps,
 * the higher curriculum order is used only as a deterministic fallback.
 */
export function selectTeacherTopicResumeId(
  progressRows: TeacherTopicResumeProgress[],
  courseTopics: TeacherTopicResumeCurriculumTopic[],
): string | null {
  if (!progressRows.length || !courseTopics.length) return null;

  const topicOrder = new Map(courseTopics.map((topic) => [topic.id, topic.order]));
  const candidates = progressRows.filter((row) => topicOrder.has(row.id));
  if (!candidates.length) return null;

  candidates.sort((a, b) => {
    const savedAtDelta = progressSavedAtMs(b) - progressSavedAtMs(a);
    if (savedAtDelta !== 0) return savedAtDelta;

    const orderDelta = (topicOrder.get(b.id) ?? -1) - (topicOrder.get(a.id) ?? -1);
    if (orderDelta !== 0) return orderDelta;

    return a.id.localeCompare(b.id);
  });

  return candidates[0]?.id ?? null;
}
