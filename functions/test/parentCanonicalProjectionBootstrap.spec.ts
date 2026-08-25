import { describe, expect, it } from 'vitest';

import {
  MAX_CHILD_PROGRESS_BOOTSTRAP_DOCS,
  MAX_PARENT_COURSE_ASSIGNMENTS,
  bootstrapCourseProgress,
  enrollmentMatchesCourseAssignment,
  currentIndiaMonthKey,
  isCurrentIndiaMonthKey,
  isSupportedCourseBootstrapRequestId,
  normalizeBootstrapKind,
} from '../src/parentCanonicalProjectionBootstrap';
import { buildSummaryFromDocs } from '../src/childCourseProgressProjectionV3';

const curriculum = {
  topics: [21, 24, 26, 27, 28, 34, 35, 36].map((lessonNumber, index) => ({
    id: `early-${lessonNumber}`,
    courseId: 'early-phonics',
    courseLabel: 'Early Phonics',
    displayTitle: `Lesson ${lessonNumber}`,
    lessonNumber,
    stageLabel: index < 4 ? 'Stage 1' : 'Stage 2',
    stageOrder: index < 4 ? 1 : 2,
  })),
};

const fakeProgressDoc = (id: string, data: Record<string, unknown>) => ({
  id,
  data: () => data,
}) as any;

function fakeBootstrapDb(args: {
  existing?: Record<string, unknown> | null;
  curriculumData?: Record<string, unknown>;
  progressDocs?: any[];
}) {
  const writes: Record<string, unknown>[] = [];
  let progressReads = 0;
  const summaryRef = {
    get: async () => ({ exists: Boolean(args.existing), data: () => args.existing || undefined }),
    set: async (data: Record<string, unknown>) => { writes.push(data); },
  };
  const progressRef = {
    limit: () => ({
      get: async () => {
        progressReads += 1;
        const docs = args.progressDocs || [];
        return { size: docs.length, docs };
      },
    }),
  };
  const db = {
    collection: (name: string) => {
      if (name === 'config') {
        return { doc: () => ({ get: async () => ({ data: () => args.curriculumData }) }) };
      }
      if (name !== 'students') throw new Error(`unexpected collection:${name}`);
      return {
        doc: () => ({
          collection: (child: string) => {
            if (child === 'courseProgress') return { doc: () => summaryRef };
            if (child === 'progress') return progressRef;
            throw new Error(`unexpected child collection:${child}`);
          },
        }),
      };
    },
  };
  return { db: db as any, writes, progressReadCount: () => progressReads };
}

describe('parent canonical projection bootstrap guardrails', () => {
  it('accepts only the two supported bounded bootstrap kinds', () => {
    expect(normalizeBootstrapKind('course_progress')).toBe('course_progress');
    expect(normalizeBootstrapKind('class_attendance')).toBe('class_attendance');
    expect(normalizeBootstrapKind('finance')).toBeNull();
    expect(normalizeBootstrapKind(undefined)).toBeNull();
  });

  it('accepts the saved-lesson v2 repair id while preserving v1 rollout compatibility', () => {
    expect(isSupportedCourseBootstrapRequestId('v1-course-early-phonics', 'early-phonics')).toBe(true);
    expect(isSupportedCourseBootstrapRequestId('v2-course-early-phonics', 'early-phonics')).toBe(true);
    expect(isSupportedCourseBootstrapRequestId('v2-course-early-phonics', 'phonics-foundations')).toBe(false);
    expect(isSupportedCourseBootstrapRequestId('v3-course-early-phonics', 'early-phonics')).toBe(false);
  });

  it('keeps the child progress bootstrap scan hard-capped', () => {
    expect(MAX_CHILD_PROGRESS_BOOTSTRAP_DOCS).toBe(250);
    expect(MAX_PARENT_COURSE_ASSIGNMENTS).toBe(20);
  });

  it('requires the authenticated parent and an operational matching course assignment', () => {
    expect(enrollmentMatchesCourseAssignment({
      parentId: 'parent-1',
      kidId: 'kid-1',
      courseId: 'early-phonics',
      status: 'active',
    }, 'parent-1', 'early-phonics', new Set(['kid-1']))).toBe(true);
    expect(enrollmentMatchesCourseAssignment({
      parentId: 'parent-2',
      courseId: 'early-phonics',
      status: 'active',
    }, 'parent-1', 'early-phonics', new Set(['kid-1']))).toBe(false);
    expect(enrollmentMatchesCourseAssignment({
      parentId: 'parent-1',
      courseId: 'advanced-phonics',
      status: 'active',
    }, 'parent-1', 'early-phonics', new Set(['kid-1']))).toBe(false);
    expect(enrollmentMatchesCourseAssignment({
      parentId: 'parent-1',
      courseId: 'early-phonics',
      status: 'completed',
    }, 'parent-1', 'early-phonics', new Set(['kid-1']))).toBe(false);
    expect(enrollmentMatchesCourseAssignment({
      parentId: 'parent-1',
      kidId: 'kid-2',
      courseId: 'early-phonics',
      status: 'active',
    }, 'parent-1', 'early-phonics', new Set(['kid-1']))).toBe(false);
  });

  it('is idempotent when a completed bootstrap already materialized the current projection', async () => {
    const existing = buildSummaryFromDocs('kid-1', 'early-phonics', [
      fakeProgressDoc('early-21', { topicId: 'early-21', courseId: 'early-phonics' }),
    ], curriculum);
    const fake = fakeBootstrapDb({ existing, curriculumData: curriculum });

    await expect(bootstrapCourseProgress({
      db: fake.db,
      kidId: 'kid-1',
      courseId: 'early-phonics',
    })).resolves.toMatchObject({ mode: 'already_current', totalTopics: 8 });
    expect(fake.progressReadCount()).toBe(0);
    expect(fake.writes).toHaveLength(0);
  });

  it('lazily reconstructs a historical existing parent projection from bounded saved lessons', async () => {
    const progressDocs = [21, 24, 26, 27, 28, 34].map((lessonNumber) =>
      fakeProgressDoc(`early-${lessonNumber}`, {
        topicId: `early-${lessonNumber}`,
        courseId: 'early-phonics',
        updatedAt: new Date(`2026-08-${String(lessonNumber % 20 + 1).padStart(2, '0')}T08:00:00Z`),
      }));
    const fake = fakeBootstrapDb({ curriculumData: curriculum, progressDocs });

    await expect(bootstrapCourseProgress({
      db: fake.db,
      kidId: 'kid-legacy',
      courseId: 'early-phonics',
    })).resolves.toMatchObject({
      mode: 'bootstrapped',
      relevantProgressDocuments: 6,
      totalTopics: 8,
      completedTopics: 6,
    });
    expect(fake.progressReadCount()).toBe(1);
    expect(fake.writes).toHaveLength(1);
    expect(fake.writes[0]).toMatchObject({ completedTopics: 6, totalTopics: 8 });
  });

  it('does not scan history or invent a denominator when curriculum is missing', async () => {
    const fake = fakeBootstrapDb({ progressDocs: [fakeProgressDoc('early-21', { mastery: 5 })] });
    await expect(bootstrapCourseProgress({
      db: fake.db,
      kidId: 'kid-legacy',
      courseId: 'early-phonics',
    })).resolves.toMatchObject({ mode: 'definition_missing', totalTopics: 0 });
    expect(fake.progressReadCount()).toBe(0);
    expect(fake.writes[0]).toMatchObject({
      definitionStatus: 'missing',
      totalTopics: 0,
      completedTopics: 0,
    });
  });

  it('uses the IST calendar month for attendance bootstrap eligibility', () => {
    const beforeBoundary = Date.parse('2026-08-31T17:00:00Z');
    const afterBoundary = Date.parse('2026-08-31T20:00:00Z');

    expect(currentIndiaMonthKey(beforeBoundary)).toBe('2026-08');
    expect(isCurrentIndiaMonthKey('2026-08', beforeBoundary)).toBe(true);
    expect(isCurrentIndiaMonthKey('2026-09', beforeBoundary)).toBe(false);

    expect(currentIndiaMonthKey(afterBoundary)).toBe('2026-09');
    expect(isCurrentIndiaMonthKey('2026-09', afterBoundary)).toBe(true);
    expect(isCurrentIndiaMonthKey('2026-08', afterBoundary)).toBe(false);
  });
});
