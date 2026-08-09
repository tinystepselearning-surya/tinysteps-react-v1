import callFunction from '../lib/callFunctions';

export type TeacherDemoCancellationReason =
  | 'parent_unavailable'
  | 'teacher_unavailable'
  | 'technical_issue'
  | 'reschedule_requested'
  | 'other';

export interface TeacherCancelAssignedDemoInput {
  demoId: string;
  reason: TeacherDemoCancellationReason;
  note?: string;
}

export interface TeacherCancelAssignedDemoResult {
  ok: boolean;
  demoId: string;
  status: 'cancelled';
}

export async function teacherCancelAssignedDemo(
  input: TeacherCancelAssignedDemoInput,
): Promise<TeacherCancelAssignedDemoResult> {
  return callFunction<TeacherCancelAssignedDemoResult, TeacherCancelAssignedDemoInput>(
    'teacherCancelAssignedDemo',
    {
      demoId: input.demoId.trim(),
      reason: input.reason,
      note: input.note?.trim() || undefined,
    },
  );
}
