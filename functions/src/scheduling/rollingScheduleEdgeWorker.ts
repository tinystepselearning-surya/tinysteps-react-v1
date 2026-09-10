import {
  ROLLING_SCHEDULE_HORIZON_DAYS,
  ROLLING_SCHEDULE_MATERIALIZATION_VERSION,
  addDaysYmd,
  buildRollingMaterializationPlan,
  buildRollingScheduledSessionPayload,
  type RollingMaterializationOccurrence,
  type RollingScheduleMaterializationState,
  type RollingScheduleMaterializerStore,
} from './rollingScheduleMaterializer';

export const MAX_ROLLING_EDGE_DATES_PER_ENROLLMENT_RUN = 4;
export const MAX_ROLLING_EDGE_OCCURRENCES_PER_ENROLLMENT_RUN = 32;

export type RollingScheduleEdgeWorkerStore = Pick<
  RollingScheduleMaterializerStore,
  'getSessionsByIds' | 'createSessionIfAbsent' | 'updateEnrollmentMaterialization'
>;

export type RollingDueEdgePlan = {
  enrollmentId: string;
  todayYmd: string;
  scheduleRevision: number;
  isDue: boolean;
  edgeDates: string[];
  occurrences: RollingMaterializationOccurrence[];
  backlogRemaining: boolean;
  initialMaterialization: RollingScheduleMaterializationState;
  finalMaterialization: RollingScheduleMaterializationState;
};

export type MaterializeRollingDueEdgePlanInput = {
  enrollment: Record<string, unknown>;
  plan: RollingDueEdgePlan;
  actorId?: string;
  dryRun?: boolean;
};

export type MaterializeRollingDueEdgesInput = {
  enrollmentId: string;
  enrollment: Record<string, unknown>;
  todayYmd: string;
  actorId?: string;
  dryRun?: boolean;
};

export type MaterializeRollingDueEdgesResult = {
  enrollmentId: string;
  todayYmd: string;
  scheduleRevision: number;
  isDue: boolean;
  edgeDates: string[];
  backlogRemaining: boolean;
  expectedCount: number;
  existingCount: number;
  wouldCreateCount: number;
  createdCount: number;
  raceAlreadyExistsCount: number;
  metadataUpdated: boolean;
  createdSessionIds: string[];
  preservedExistingSessionIds: string[];
  materialization: RollingScheduleMaterializationState;
};

function isRecordLike(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function requirePositiveInteger(value: unknown, fieldName: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${fieldName} must be a positive integer`);
  }
  return parsed;
}

function requireYmd(value: unknown, fieldName: string): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) throw new Error(`${fieldName} is required`);
  addDaysYmd(text, 0);
  return text;
}

function optionalYmd(value: unknown, fieldName: string): string | null {
  if (value === null || value === undefined || value === '') return null;
  return requireYmd(value, fieldName);
}

function normalizePersistedMaterialization(
  enrollment: Record<string, unknown>,
): RollingScheduleMaterializationState {
  const raw = enrollment.scheduleMaterialization;
  if (!isRecordLike(raw)) {
    throw new Error('Enrollment has no rolling schedule materialization state');
  }

  const schemaVersion = requirePositiveInteger(
    raw.schemaVersion,
    'scheduleMaterialization.schemaVersion',
  );
  if (schemaVersion !== ROLLING_SCHEDULE_MATERIALIZATION_VERSION) {
    throw new Error('Unsupported rolling schedule materialization schema version');
  }

  const horizonDays = requirePositiveInteger(
    raw.horizonDays,
    'scheduleMaterialization.horizonDays',
  );
  if (horizonDays !== ROLLING_SCHEDULE_HORIZON_DAYS) {
    throw new Error(`Rolling schedule horizon must remain exactly ${ROLLING_SCHEDULE_HORIZON_DAYS} days`);
  }

  const scheduleRevision = requirePositiveInteger(
    raw.scheduleRevision,
    'scheduleMaterialization.scheduleRevision',
  );
  const materializedThroughYmd = requireYmd(
    raw.materializedThroughYmd,
    'scheduleMaterialization.materializedThroughYmd',
  );
  const nextOccurrenceYmd = optionalYmd(
    raw.nextOccurrenceYmd,
    'scheduleMaterialization.nextOccurrenceYmd',
  );
  const nextMaterializationDueYmd = optionalYmd(
    raw.nextMaterializationDueYmd,
    'scheduleMaterialization.nextMaterializationDueYmd',
  );

  if (Boolean(nextOccurrenceYmd) !== Boolean(nextMaterializationDueYmd)) {
    throw new Error('Rolling schedule next-occurrence and due pointers must be set or cleared together');
  }
  if (nextOccurrenceYmd && nextOccurrenceYmd <= materializedThroughYmd) {
    throw new Error('Rolling schedule next occurrence must be after materializedThroughYmd');
  }
  if (
    nextOccurrenceYmd &&
    nextMaterializationDueYmd &&
    addDaysYmd(nextMaterializationDueYmd, ROLLING_SCHEDULE_HORIZON_DAYS) !== nextOccurrenceYmd
  ) {
    throw new Error('Rolling schedule due pointer is not aligned to the 14-day horizon');
  }

  return {
    schemaVersion,
    horizonDays,
    scheduleRevision,
    materializedThroughYmd,
    nextOccurrenceYmd,
    nextMaterializationDueYmd,
  };
}

function sameOccurrenceIdentity(
  left: RollingMaterializationOccurrence,
  right: RollingMaterializationOccurrence,
): boolean {
  return (
    left.date === right.date &&
    left.startTime === right.startTime &&
    left.durationMinutes === right.durationMinutes &&
    left.sessionId === right.sessionId &&
    left.startAtUtcMs === right.startAtUtcMs &&
    left.endAtUtcMs === right.endAtUtcMs
  );
}

export function buildRollingScheduleDueEdgePlan(args: {
  enrollmentId: string;
  enrollment: Record<string, unknown>;
  todayYmd: string;
}): RollingDueEdgePlan {
  const enrollmentId = String(args.enrollmentId || '').trim();
  if (!enrollmentId) throw new Error('enrollmentId is required');
  const todayYmd = requireYmd(args.todayYmd, 'todayYmd');
  const initialMaterialization = normalizePersistedMaterialization(args.enrollment);

  let nextOccurrenceYmd = initialMaterialization.nextOccurrenceYmd;
  let nextDueYmd = initialMaterialization.nextMaterializationDueYmd;
  let finalMaterialization = initialMaterialization;
  const edgeDates: string[] = [];
  const occurrences: RollingMaterializationOccurrence[] = [];

  if (!nextOccurrenceYmd || !nextDueYmd || nextDueYmd > todayYmd) {
    return {
      enrollmentId,
      todayYmd,
      scheduleRevision: initialMaterialization.scheduleRevision,
      isDue: false,
      edgeDates,
      occurrences,
      backlogRemaining: false,
      initialMaterialization,
      finalMaterialization,
    };
  }

  while (
    nextOccurrenceYmd &&
    nextDueYmd &&
    nextDueYmd <= todayYmd &&
    edgeDates.length < MAX_ROLLING_EDGE_DATES_PER_ENROLLMENT_RUN
  ) {
    if (addDaysYmd(nextDueYmd, ROLLING_SCHEDULE_HORIZON_DAYS) !== nextOccurrenceYmd) {
      throw new Error('Rolling schedule due pointer drifted from its next occurrence');
    }

    const windowPlan = buildRollingMaterializationPlan({
      enrollmentId,
      enrollment: args.enrollment,
      anchorYmd: nextDueYmd,
    });
    if (windowPlan.revisionResetRequired) {
      throw new Error('Schedule revision changed; full 14-day rematerialization is required before edge replenishment');
    }
    if (windowPlan.scheduleRevision !== initialMaterialization.scheduleRevision) {
      throw new Error('Rolling schedule materialization revision does not match the current schedule revision');
    }
    if (windowPlan.horizonEndYmd !== nextOccurrenceYmd) {
      throw new Error('Rolling schedule next occurrence is inconsistent with the due-date horizon');
    }

    const targetOccurrences = windowPlan.occurrences.filter(
      (occurrence) => occurrence.date === nextOccurrenceYmd,
    );
    if (!targetOccurrences.length) {
      throw new Error('Rolling schedule due pointer no longer resolves to a recurrence occurrence');
    }

    const expectedIds = new Set(targetOccurrences.map((occurrence) => occurrence.sessionId));
    if (expectedIds.size !== targetOccurrences.length) {
      throw new Error('Rolling schedule target date contains duplicate deterministic session identities');
    }

    const projectedCount = occurrences.length + targetOccurrences.length;
    if (projectedCount > MAX_ROLLING_EDGE_OCCURRENCES_PER_ENROLLMENT_RUN) {
      throw new Error(
        `Rolling edge worker refused more than ${MAX_ROLLING_EDGE_OCCURRENCES_PER_ENROLLMENT_RUN} session candidates for one enrollment`,
      );
    }

    edgeDates.push(nextOccurrenceYmd);
    occurrences.push(...targetOccurrences);
    finalMaterialization = windowPlan.materialization;
    nextOccurrenceYmd = finalMaterialization.nextOccurrenceYmd;
    nextDueYmd = finalMaterialization.nextMaterializationDueYmd;
  }

  const allIds = new Set(occurrences.map((occurrence) => occurrence.sessionId));
  if (allIds.size !== occurrences.length) {
    throw new Error('Rolling edge catch-up plan contains duplicate deterministic session identities');
  }

  const backlogRemaining = Boolean(nextDueYmd && nextDueYmd <= todayYmd);
  return {
    enrollmentId,
    todayYmd,
    scheduleRevision: initialMaterialization.scheduleRevision,
    isDue: edgeDates.length > 0,
    edgeDates,
    occurrences,
    backlogRemaining,
    initialMaterialization,
    finalMaterialization,
  };
}

export async function materializeRollingDueEdgePlanWithStore(
  store: RollingScheduleEdgeWorkerStore,
  input: MaterializeRollingDueEdgePlanInput,
): Promise<MaterializeRollingDueEdgesResult> {
  const {plan, enrollment} = input;
  const sessionIds = plan.occurrences.map((occurrence) => occurrence.sessionId);

  if (!plan.isDue || !sessionIds.length) {
    return {
      enrollmentId: plan.enrollmentId,
      todayYmd: plan.todayYmd,
      scheduleRevision: plan.scheduleRevision,
      isDue: false,
      edgeDates: [],
      backlogRemaining: false,
      expectedCount: 0,
      existingCount: 0,
      wouldCreateCount: 0,
      createdCount: 0,
      raceAlreadyExistsCount: 0,
      metadataUpdated: false,
      createdSessionIds: [],
      preservedExistingSessionIds: [],
      materialization: plan.finalMaterialization,
    };
  }

  const existing = await store.getSessionsByIds(sessionIds);
  const existingIds = sessionIds.filter((sessionId) => existing.has(sessionId));
  const missingOccurrences = plan.occurrences.filter(
    (occurrence) => !existing.has(occurrence.sessionId),
  );

  // Build every payload before the first write. This preserves the fail-closed
  // financial/identity guarantees from Brick 3 even when a catch-up run spans
  // several due edge dates.
  const preparedCreates = missingOccurrences.map((occurrence) => ({
    occurrence,
    payload: buildRollingScheduledSessionPayload({
      enrollmentId: plan.enrollmentId,
      enrollment,
      occurrence,
      scheduleRevision: plan.scheduleRevision,
      actorId: input.actorId || 'system:rolling_schedule_edge_worker',
    }),
  }));

  if (input.dryRun) {
    return {
      enrollmentId: plan.enrollmentId,
      todayYmd: plan.todayYmd,
      scheduleRevision: plan.scheduleRevision,
      isDue: true,
      edgeDates: [...plan.edgeDates],
      backlogRemaining: plan.backlogRemaining,
      expectedCount: sessionIds.length,
      existingCount: existingIds.length,
      wouldCreateCount: preparedCreates.length,
      createdCount: 0,
      raceAlreadyExistsCount: 0,
      metadataUpdated: false,
      createdSessionIds: [],
      preservedExistingSessionIds: existingIds,
      materialization: plan.finalMaterialization,
    };
  }

  const createdSessionIds: string[] = [];
  let raceAlreadyExistsCount = 0;
  for (const prepared of preparedCreates) {
    const outcome = await store.createSessionIfAbsent(
      prepared.occurrence.sessionId,
      prepared.payload,
    );
    if (outcome === 'created') createdSessionIds.push(prepared.occurrence.sessionId);
    else raceAlreadyExistsCount += 1;
  }

  await store.updateEnrollmentMaterialization(
    plan.enrollmentId,
    plan.finalMaterialization,
  );

  return {
    enrollmentId: plan.enrollmentId,
    todayYmd: plan.todayYmd,
    scheduleRevision: plan.scheduleRevision,
    isDue: true,
    edgeDates: [...plan.edgeDates],
    backlogRemaining: plan.backlogRemaining,
    expectedCount: sessionIds.length,
    existingCount: existingIds.length,
    wouldCreateCount: preparedCreates.length,
    createdCount: createdSessionIds.length,
    raceAlreadyExistsCount,
    metadataUpdated: true,
    createdSessionIds,
    preservedExistingSessionIds: existingIds,
    materialization: plan.finalMaterialization,
  };
}

export async function materializeRollingDueEdgesWithStore(
  store: RollingScheduleEdgeWorkerStore,
  input: MaterializeRollingDueEdgesInput,
): Promise<MaterializeRollingDueEdgesResult> {
  const plan = buildRollingScheduleDueEdgePlan({
    enrollmentId: input.enrollmentId,
    enrollment: input.enrollment,
    todayYmd: input.todayYmd,
  });
  return materializeRollingDueEdgePlanWithStore(store, {
    enrollment: input.enrollment,
    plan,
    actorId: input.actorId,
    dryRun: input.dryRun,
  });
}

export function assertRollingEdgeOccurrenceParity(
  edgeOccurrence: RollingMaterializationOccurrence,
  fullWindowOccurrence: RollingMaterializationOccurrence,
): void {
  if (!sameOccurrenceIdentity(edgeOccurrence, fullWindowOccurrence)) {
    throw new Error('Rolling edge occurrence identity diverged from the Brick 3 materializer');
  }
}
