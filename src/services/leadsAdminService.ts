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

const canonicalLeadId = (leadId?: string | null): string | null => {
  const cleaned = String(leadId || '').trim();
  return cleaned && !cleaned.startsWith('demo_') ? cleaned : null;
};

export async function adminUpdateLeadWorkflowRecord(
  payload: AdminLeadEditPayload,
): Promise<{ ok: true }> {
  const safePayload = { ...payload, leadId: canonicalLeadId(payload.leadId) };
  return callFunction<{ ok: true }, AdminLeadEditPayload>(
    'adminUpdateLeadWorkflowRecord',
    safePayload,
  );
}

export async function adminDeleteLeadWorkflowRecord(
  payload: AdminLeadDeletePayload,
): Promise<{ ok: true; deletedLeads: number; archivedDemos: number }> {
  const safePayload = { ...payload, leadId: canonicalLeadId(payload.leadId) };
  return callFunction<
    { ok: true; deletedLeads: number; archivedDemos: number },
    AdminLeadDeletePayload
  >('adminDeleteLeadWorkflowRecord', safePayload);
}
