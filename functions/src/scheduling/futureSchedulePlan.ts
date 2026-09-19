import {createHash} from 'node:crypto';
import {
  type FutureScheduleBlockedEvidence,
  type FutureScheduleEnrollmentInspection,
  type FutureScheduleInspection,
  type FutureScheduleMetadataDrift,
  type FutureScheduleOccurrenceInspection,
} from './futureScheduleInspection';

export type FutureSchedulePlanAction =
  | {
      kind: 'CREATE_EXPECTED_REGULAR';
      actionId: string;
      occurrenceSessionId: string;
      date: string;
      startTime: string;
      durationMinutes: number;
      reasons: string[];
    }
  | {
      kind: 'RETIRE_DUPLICATE_REGULAR';
      actionId: string;
      sessionId: string;
      occurrenceSessionId: string;
      keepSessionId: string;
      reasons: string[];
    }
  | {
      kind: 'RETIRE_UNEXPECTED_REGULAR';
      actionId: string;
      sessionId: string;
      date: string;
      startTime: string;
      reasons: string[];
    }
  | {
      kind: 'RETIRE_MISMATCHED_REGULAR';
      actionId: string;
      sessionId: string;
      occurrenceSessionId: string;
      reasons: string[];
    }
  | {
      kind: 'RESTORE_EXPECTED_REGULAR';
      actionId: string;
      sessionId: string;
      occurrenceSessionId: string;
      reasons: string[];
    }
  | {
      kind: 'REWRITE_EXPECTED_REGULAR';
      actionId: string;
      sessionId: string;
      occurrenceSessionId: string;
      reasons: string[];
    }
  | {
      kind: 'SYNC_REGULAR_METADATA';
      actionId: string;
      sessionId: string;
      reasons: string[];
    };

export type FutureSchedulePlanBlocker = {
  blockerId: string;
  occurrenceSessionId: string | null;
  sessionId: string | null;
  reasons: string[];
};

export type FutureScheduleReconciliationPlan = {
  enrollmentId: string;
  todayYmd: string | null;
  managedFromYmd: string | null;
  managedThroughYmd: string | null;
  scheduleRevision: number | null;
  sourceWarnings: string[];
  actions: FutureSchedulePlanAction[];
  blockers: FutureSchedulePlanBlocker[];
  readyToApply: boolean;
  isNoop: boolean;
  planFingerprint: string;
  summary: {
    creates: number;
    restores: number;
    rewrites: number;
    metadataSyncs: number;
    retireDuplicates: number;
    retireUnexpected: number;
    retireMismatched: number;
    blockers: number;
  };
};

const SAFE_REWRITE_REASONS = new Set([
  'teacher_identity_mismatch',
  'duration_mismatch',
]);

const NON_ACTIONABLE_BLOCKER_REASONS = new Set([
  'active_and_linked_exception_conflict',
  'active_and_protected_regular_conflict',
  'ambiguous_non_exception_session_source',
  'child_identity_mismatch',
  'course_identity_mismatch',
  'enrollment_identity_mismatch',
  'expected_document_identity_mismatch',
  'expected_document_occupied_by_conflicting_session',
  'future_regular_session_contains_protected_state',
  'inactive_expected_regular_session',
  'invalid_exception_identity',
  'invalid_session_date_or_time',
  'linked_exception_not_operational',
  'non_restorable_system_cancelled_expected_session',
  'protected_or_invalid_future_status',
  'protected_regular_identity_mismatch',
  'session_date_time_timestamp_mismatch',
  'unexpected_regular_session_protected',
]);

const text = (value: unknown): string => String(value || '').trim();

const sortedUnique = (values: readonly string[]): string[] =>
  Array.from(new Set(values.map((value) => text(value)).filter(Boolean))).sort();

const stableStringify = (value: unknown): string => {
  if (value === null || value === undefined) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
};

const actionPriority = (kind: FutureSchedulePlanAction['kind']): number => {
  switch (kind) {
    case 'RETIRE_DUPLICATE_REGULAR':
    case 'RETIRE_UNEXPECTED_REGULAR':
    case 'RETIRE_MISMATCHED_REGULAR':
      return 10;
    case 'RESTORE_EXPECTED_REGULAR':
    case 'REWRITE_EXPECTED_REGULAR':
      return 20;
    case 'SYNC_REGULAR_METADATA':
      return 30;
    case 'CREATE_EXPECTED_REGULAR':
      return 40;
  }
};

const sortActions = (
  actions: FutureSchedulePlanAction[],
): FutureSchedulePlanAction[] => [...actions].sort((a, b) => {
  const byPriority = actionPriority(a.kind) - actionPriority(b.kind);
  if (byPriority !== 0) return byPriority;
  return a.actionId.localeCompare(b.actionId);
});

const makeBlocker = (args: {
  occurrenceSessionId?: string | null;
  sessionId?: string | null;
  reasons: string[];
}): FutureSchedulePlanBlocker => {
  const occurrenceSessionId = text(args.occurrenceSessionId) || null;
  const sessionId = text(args.sessionId) || null;
  const reasons = sortedUnique(args.reasons);
  return {
    blockerId: [
      'block',
      occurrenceSessionId || '-',
      sessionId || '-',
      reasons.join('+') || 'unknown',
    ].join(':'),
    occurrenceSessionId,
    sessionId,
    reasons,
  };
};

const mergeBlockers = (
  blockers: FutureSchedulePlanBlocker[],
): FutureSchedulePlanBlocker[] => {
  const byId = new Map<string, FutureSchedulePlanBlocker>();
  blockers.forEach((blocker) => {
    if (!byId.has(blocker.blockerId)) byId.set(blocker.blockerId, blocker);
  });
  return Array.from(byId.values()).sort((a, b) => a.blockerId.localeCompare(b.blockerId));
};

const evidenceForOccurrence = (
  inspection: FutureScheduleInspection,
  occurrenceSessionId: string,
): FutureScheduleBlockedEvidence[] =>
  inspection.blockedEvidence.filter(
    (row) => row.occurrenceSessionId === occurrenceSessionId,
  );

const allDetailedReasons = (
  inspection: FutureScheduleInspection,
  occurrence: FutureScheduleOccurrenceInspection,
): string[] => sortedUnique([
  ...occurrence.reasons,
  ...evidenceForOccurrence(inspection, occurrence.occurrence.sessionId)
    .flatMap((row) => row.reasons),
]);

const metadataAction = (
  drift: FutureScheduleMetadataDrift,
): FutureSchedulePlanAction => ({
  kind: 'SYNC_REGULAR_METADATA',
  actionId: `sync:${drift.sessionId}`,
  sessionId: drift.sessionId,
  reasons: sortedUnique(drift.reasons),
});

const isPureSystemRestore = (reasons: readonly string[]): boolean => {
  const detailed = sortedUnique(reasons);
  return (
    detailed.includes('system_cancelled_expected_session_requires_restore') &&
    detailed.every((reason) =>
      reason === 'system_cancelled_expected_session_requires_restore' ||
      reason === 'regular_session_identity_mismatch'
    )
  );
};

const isSafeRewrite = (reasons: readonly string[]): boolean => {
  const detailed = sortedUnique(reasons).filter(
    (reason) => reason !== 'regular_session_identity_mismatch',
  );
  return (
    detailed.length > 0 &&
    detailed.every((reason) => SAFE_REWRITE_REASONS.has(reason))
  );
};

const hasNonActionableBlocker = (reasons: readonly string[]): boolean =>
  reasons.some((reason) => NON_ACTIONABLE_BLOCKER_REASONS.has(reason));

function actionsForBlockedOccurrence(args: {
  inspection: FutureScheduleInspection;
  occurrence: FutureScheduleOccurrenceInspection;
}): {
  actions: FutureSchedulePlanAction[];
  blockers: FutureSchedulePlanBlocker[];
} {
  const {inspection, occurrence} = args;
  const expectedId = occurrence.occurrence.sessionId;
  const relatedIds = sortedUnique(occurrence.relatedSessionIds);
  const reasons = allDetailedReasons(inspection, occurrence);

  if (
    isPureSystemRestore(reasons) &&
    relatedIds.length === 1
  ) {
    const sessionId = relatedIds[0];
    if (sessionId === expectedId) {
      return {
        actions: [{
          kind: 'RESTORE_EXPECTED_REGULAR',
          actionId: `restore:${expectedId}`,
          sessionId,
          occurrenceSessionId: expectedId,
          reasons: ['system_cancelled_expected_session_requires_restore'],
        }],
        blockers: [],
      };
    }

    return {
      actions: [{
        kind: 'CREATE_EXPECTED_REGULAR',
        actionId: `create:${expectedId}`,
        occurrenceSessionId: expectedId,
        date: occurrence.occurrence.date,
        startTime: occurrence.occurrence.startTime,
        durationMinutes: occurrence.occurrence.durationMinutes,
        reasons: ['system_cancelled_legacy_occurrence_requires_canonical_create'],
      }],
      blockers: [],
    };
  }

  if (
    isSafeRewrite(reasons) &&
    !hasNonActionableBlocker(reasons) &&
    relatedIds.length === 1
  ) {
    const sessionId = relatedIds[0];
    const actionableReasons = sortedUnique(
      reasons.filter((reason) => SAFE_REWRITE_REASONS.has(reason)),
    );

    if (sessionId === expectedId) {
      return {
        actions: [{
          kind: 'REWRITE_EXPECTED_REGULAR',
          actionId: `rewrite:${expectedId}`,
          sessionId,
          occurrenceSessionId: expectedId,
          reasons: actionableReasons,
        }],
        blockers: [],
      };
    }

    return {
      actions: [
        {
          kind: 'RETIRE_MISMATCHED_REGULAR',
          actionId: `retire-mismatch:${sessionId}`,
          sessionId,
          occurrenceSessionId: expectedId,
          reasons: actionableReasons,
        },
        {
          kind: 'CREATE_EXPECTED_REGULAR',
          actionId: `create:${expectedId}`,
          occurrenceSessionId: expectedId,
          date: occurrence.occurrence.date,
          startTime: occurrence.occurrence.startTime,
          durationMinutes: occurrence.occurrence.durationMinutes,
          reasons: actionableReasons,
        },
      ],
      blockers: [],
    };
  }

  if (relatedIds.length === 0) {
    return {
      actions: [],
      blockers: [makeBlocker({
        occurrenceSessionId: expectedId,
        reasons: reasons.length ? reasons : ['blocked_occurrence_without_session_evidence'],
      })],
    };
  }

  return {
    actions: [],
    blockers: relatedIds.map((sessionId) => makeBlocker({
      occurrenceSessionId: expectedId,
      sessionId,
      reasons: reasons.length ? reasons : ['blocked_occurrence'],
    })),
  };
}

function fingerprintPlan(
  plan: Omit<FutureScheduleReconciliationPlan, 'planFingerprint'>,
): string {
  return createHash('sha256')
    .update(stableStringify(plan))
    .digest('hex');
}

export function buildFutureScheduleReconciliationPlan(
  enrollmentInspection: FutureScheduleEnrollmentInspection,
): FutureScheduleReconciliationPlan {
  if (enrollmentInspection.kind === 'blocked_source') {
    const blockers = enrollmentInspection.assessment.issues.map((reason) =>
      makeBlocker({reasons: [`source:${reason}`]})
    );
    const base: Omit<FutureScheduleReconciliationPlan, 'planFingerprint'> = {
      enrollmentId: enrollmentInspection.enrollmentId,
      todayYmd: null,
      managedFromYmd: null,
      managedThroughYmd: null,
      scheduleRevision: null,
      sourceWarnings: sortedUnique(enrollmentInspection.assessment.warnings),
      actions: [],
      blockers,
      readyToApply: false,
      isNoop: false,
      summary: {
        creates: 0,
        restores: 0,
        rewrites: 0,
        metadataSyncs: 0,
        retireDuplicates: 0,
        retireUnexpected: 0,
        retireMismatched: 0,
        blockers: blockers.length,
      },
    };
    return {...base, planFingerprint: fingerprintPlan(base)};
  }

  const {inspection, assessment, enrollmentId} = enrollmentInspection;
  const actions: FutureSchedulePlanAction[] = [];
  const blockers: FutureSchedulePlanBlocker[] = [];

  inspection.occurrences.forEach((row) => {
    switch (row.state) {
      case 'correct':
      case 'protected_exception':
        break;
      case 'missing':
        actions.push({
          kind: 'CREATE_EXPECTED_REGULAR',
          actionId: `create:${row.occurrence.sessionId}`,
          occurrenceSessionId: row.occurrence.sessionId,
          date: row.occurrence.date,
          startTime: row.occurrence.startTime,
          durationMinutes: row.occurrence.durationMinutes,
          reasons: ['missing_regular_session'],
        });
        break;
      case 'duplicate': {
        const duplicate = inspection.duplicates.find(
          (item) => item.occurrenceSessionId === row.occurrence.sessionId,
        );
        if (!duplicate) {
          blockers.push(makeBlocker({
            occurrenceSessionId: row.occurrence.sessionId,
            reasons: ['duplicate_classification_without_duplicate_evidence'],
          }));
          break;
        }
        duplicate.duplicateSessionIds.forEach((sessionId) => {
          actions.push({
            kind: 'RETIRE_DUPLICATE_REGULAR',
            actionId: `retire-duplicate:${sessionId}`,
            sessionId,
            occurrenceSessionId: duplicate.occurrenceSessionId,
            keepSessionId: duplicate.canonicalSessionId,
            reasons: ['duplicate_regular_session'],
          });
        });
        break;
      }
      case 'blocked': {
        const planned = actionsForBlockedOccurrence({inspection, occurrence: row});
        actions.push(...planned.actions);
        blockers.push(...planned.blockers);
        break;
      }
    }
  });

  inspection.unexpectedRegularSessions.forEach((row) => {
    actions.push({
      kind: 'RETIRE_UNEXPECTED_REGULAR',
      actionId: `retire-unexpected:${row.sessionId}`,
      sessionId: row.sessionId,
      date: row.date,
      startTime: row.startTime,
      reasons: sortedUnique(row.reasons),
    });
  });

  inspection.metadataDrift.forEach((drift) => {
    actions.push(metadataAction(drift));
  });

  inspection.blockedEvidence
    .filter((evidence) => evidence.occurrenceSessionId === null)
    .forEach((evidence) => {
      blockers.push(makeBlocker({
        sessionId: evidence.sessionId,
        reasons: evidence.reasons,
      }));
    });

  const finalActions = sortActions(actions);

  const needsFinanciallyCompleteExpectedPayload = finalActions.some((action) =>
    action.kind === 'CREATE_EXPECTED_REGULAR' ||
    action.kind === 'REWRITE_EXPECTED_REGULAR' ||
    action.kind === 'RESTORE_EXPECTED_REGULAR'
  );
  if (
    needsFinanciallyCompleteExpectedPayload &&
    assessment.warnings.includes('missing_billing_rate')
  ) {
    blockers.push(makeBlocker({
      reasons: ['source:missing_billing_rate_for_session_write'],
    }));
  }

  const finalBlockers = mergeBlockers(blockers);
  const summary = {
    creates: finalActions.filter((row) => row.kind === 'CREATE_EXPECTED_REGULAR').length,
    restores: finalActions.filter((row) => row.kind === 'RESTORE_EXPECTED_REGULAR').length,
    rewrites: finalActions.filter((row) => row.kind === 'REWRITE_EXPECTED_REGULAR').length,
    metadataSyncs: finalActions.filter((row) => row.kind === 'SYNC_REGULAR_METADATA').length,
    retireDuplicates: finalActions.filter((row) => row.kind === 'RETIRE_DUPLICATE_REGULAR').length,
    retireUnexpected: finalActions.filter((row) => row.kind === 'RETIRE_UNEXPECTED_REGULAR').length,
    retireMismatched: finalActions.filter((row) => row.kind === 'RETIRE_MISMATCHED_REGULAR').length,
    blockers: finalBlockers.length,
  };

  const base: Omit<FutureScheduleReconciliationPlan, 'planFingerprint'> = {
    enrollmentId,
    todayYmd: inspection.plan.todayYmd,
    managedFromYmd: inspection.plan.managedFromYmd,
    managedThroughYmd: inspection.plan.managedThroughYmd,
    scheduleRevision: inspection.plan.scheduleRevision,
    sourceWarnings: sortedUnique(assessment.warnings),
    actions: finalActions,
    blockers: finalBlockers,
    readyToApply: finalBlockers.length === 0,
    isNoop: finalActions.length === 0 && finalBlockers.length === 0,
    summary,
  };

  return {...base, planFingerprint: fingerprintPlan(base)};
}
