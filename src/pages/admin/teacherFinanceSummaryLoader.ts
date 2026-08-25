import { collection, collectionGroup, doc, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import { getDocLogged, getDocsLogged } from '../../lib/firestoreReadLogging';
import {
  aggregateTeacherEarnings,
  summarizeTeacherEarnings,
} from './analyticsV2Metrics';
import { summarizeTeacherFinanceRollups } from './teacherFinanceRollupMetrics';

export type TeacherFinanceSummary = ReturnType<typeof summarizeTeacherEarnings>;

export type TeacherFinanceSummaryDataset = {
  summary: TeacherFinanceSummary;
  source: 'rollup' | 'raw';
  rollupCount: number;
  fallbackReason: string | null;
};

type RawTeacherEarningEntry = Record<string, unknown> & { id: string };

const SOURCE = 'src/pages/admin/teacherFinanceSummaryLoader.ts';

const loadRawTeacherFinanceSummary = async (
  monthKey: string,
  fallbackReason: string,
): Promise<TeacherFinanceSummaryDataset> => {
  const snap = await getDocsLogged(
    'AnalyticsDashboardV3:month-teacher-earnings-fallback',
    query(collection(db, 'teacherEarnings'), where('monthKey', '==', monthKey)),
    { source: SOURCE },
  );
  const entries: RawTeacherEarningEntry[] = snap.docs
    .map((docSnap): RawTeacherEarningEntry => ({
      id: docSnap.id,
      ...(docSnap.data() as Record<string, unknown>),
    }))
    .filter((entry) => entry.archived !== true);
  const rows = aggregateTeacherEarnings(entries);
  return {
    summary: summarizeTeacherEarnings(rows),
    source: 'raw',
    rollupCount: 0,
    fallbackReason,
  };
};

/**
 * B6 Brick 6B2.
 *
 * Finance analytics reads teacher-month rollups only after Brick 6B1 certified the month. Both
 * the month marker and every returned rollup must remain analytics-ready. Any missing marker,
 * invalidated/legacy rollup, query/index error, or other uncertainty falls back to the existing
 * month-bounded teacherEarnings calculation.
 */
export async function loadTeacherFinanceSummary(
  monthKey: string,
): Promise<TeacherFinanceSummaryDataset> {
  if (!/^\d{4}-\d{2}$/.test(String(monthKey || '').trim())) {
    throw new Error('Select a valid analytics month.');
  }

  const readinessRef = doc(
    db,
    'adminStats',
    'teacherFinanceAnalyticsProjection',
    'months',
    monthKey,
  );
  const readinessSnap = await getDocLogged(
    'AnalyticsDashboardV3:teacher-finance-rollup-readiness',
    readinessRef,
    { source: SOURCE },
  );
  const readiness = readinessSnap.exists()
    ? (readinessSnap.data() as Record<string, unknown>)
    : null;
  const readinessVersion = Number(readiness?.analyticsProjectionVersion);
  const monthReady =
    readiness?.ready === true &&
    Number.isFinite(readinessVersion) &&
    readinessVersion >= 1;

  if (!monthReady) {
    return loadRawTeacherFinanceSummary(monthKey, 'month_not_certified');
  }

  try {
    const rollupSnap = await getDocsLogged(
      'AnalyticsDashboardV3:month-teacher-finance-rollups',
      query(collectionGroup(db, 'earnings'), where('monthKey', '==', monthKey)),
      { source: SOURCE },
    );
    const rollups = rollupSnap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Record<string, unknown>),
    }));
    const rollupSummary = summarizeTeacherFinanceRollups(rollups, monthKey);

    if (!rollupSummary.safeForFinanceSummary) {
      return loadRawTeacherFinanceSummary(monthKey, 'rollup_projection_not_safe');
    }

    return {
      summary: {
        totalDemoEarned: rollupSummary.totalDemoEarned,
        totalSessionEarned: rollupSummary.totalSessionEarned,
        totalDemoCount: rollupSummary.totalDemoCount,
        totalSessionCount: rollupSummary.totalSessionCount,
        totalCombinedEarned: rollupSummary.totalCombinedEarned,
      },
      source: 'rollup',
      rollupCount: rollupSummary.rollupCount,
      fallbackReason: null,
    };
  } catch {
    return loadRawTeacherFinanceSummary(monthKey, 'rollup_read_failed');
  }
}
