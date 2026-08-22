import callFunction from '../lib/callFunctions';

export interface AdminLeadEditPayload {
  leadId?: string | null;
  demoId?: string | null;
  parentName: string;
  parentPhone: string;
  parentEmail?: string | null;
  childName: string;
  childAge?: number | null;
  childGrade?: string | null;
  course: string;
  source?: string | null;
  preferredTimingText?: string | null;
  timezone?: string | null;
  notes?: string | null;
}

export interface AdminLeadDeletePayload {
  leadId?: string | null;
  demoId?: string | null;
}

export async function adminUpdateLeadWorkflowRecord(
  payload: AdminLeadEditPayload,
): Promise<{ ok: true }> {
  return callFunction<{ ok: true }, AdminLeadEditPayload>(
    'adminUpdateLeadWorkflowRecord',
    payload,
  );
}

export async function adminDeleteLeadWorkflowRecord(
  payload: AdminLeadDeletePayload,
): Promise<{ ok: true; deletedLeads: number; archivedDemos: number }> {
  return callFunction<
    { ok: true; deletedLeads: number; archivedDemos: number },
    AdminLeadDeletePayload
  >('adminDeleteLeadWorkflowRecord', payload);
}
