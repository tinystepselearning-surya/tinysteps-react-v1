const IST_OFFSET_MS = 330 * 60 * 1000;

export function normalizeTimeForLabel(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return '';
  const match = /^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(raw);
  if (!match) return '';
  return `${String(Number(match[1])).padStart(2, '0')}:${match[2]}`;
}

export function toIstDateLabel(value: Date): string {
  const shifted = new Date(value.getTime() + IST_OFFSET_MS);
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(
    shifted.getUTCDate(),
  ).padStart(2, '0')}`;
}

export function toIstTimeLabel(value: Date): string {
  const shifted = new Date(value.getTime() + IST_OFFSET_MS);
  return `${String(shifted.getUTCHours()).padStart(2, '0')}:${String(shifted.getUTCMinutes()).padStart(2, '0')}`;
}

export function collectKidIds(data: Record<string, unknown>): string[] {
  const ids = new Set<string>();
  const add = (value: unknown) => {
    const id = String(value || '').trim();
    if (id) ids.add(id);
  };

  if (Array.isArray(data.kidIds)) data.kidIds.forEach(add);
  add(data.kidId);
  add(data.studentId);
  add(data.childId);
  return Array.from(ids);
}

export function normalizeEnrollmentStatus(value: unknown): string {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'active';
  if (raw === 'pending_teacher') return 'trial';
  if (raw === 'pending_payment') return 'active';
  if (raw === 'enrolled' || raw === 'current' || raw === 'ongoing') return 'active';
  if (raw === 'canceled') return 'cancelled';
  return raw;
}

export class AttendanceCorrectionAfterCreateError extends Error {
  constructor(
    readonly sessionId: string,
    readonly originalError: unknown,
  ) {
    super('The session was created, but its attendance correction failed.');
    this.name = 'AttendanceCorrectionAfterCreateError';
  }
}

export async function createMissingSessionAndSaveAttendance(args: {
  createSession: () => Promise<{ sessionId: string; alreadyExisted?: boolean }>;
  saveAttendance: (sessionId: string) => Promise<unknown>;
}): Promise<{ sessionId: string; alreadyExisted: boolean }> {
  const created = await args.createSession();
  const sessionId = String(created.sessionId || '').trim();
  if (!sessionId) {
    throw new Error('The manual session was created without returning a session ID.');
  }

  try {
    await args.saveAttendance(sessionId);
  } catch (error) {
    throw new AttendanceCorrectionAfterCreateError(sessionId, error);
  }

  return { sessionId, alreadyExisted: created.alreadyExisted === true };
}
