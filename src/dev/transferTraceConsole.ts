import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebaseConfig';

type TraceStudentTransferPayload = {
  enrollmentId?: string;
  kidId?: string;
  studentName?: string;
  fromDate?: string;
  toDate?: string;
  includeSessions?: boolean;
  includeAuditLogs?: boolean;
  includeRepairCandidates?: boolean;
};

type RepairTransferPayload = {
  enrollmentId?: string;
  kidId?: string;
  fromTeacherUid?: string;
  toTeacherUid: string;
  fromDate: string;
  dryRun?: boolean;
};

type AuditAllTransferredSessionSnapshotIssuesPayload = {
  fromDate?: string;
  toDate?: string;
  teacherUid?: string;
  limit?: number;
  includeCompleted?: boolean;
  includePast?: boolean;
};

type ConsoleCallableResult<T = unknown> = Promise<T>;

declare global {
  interface Window {
    traceStudentTransfer?: (payload: TraceStudentTransferPayload) => ConsoleCallableResult;
    auditAllTransferredSessionSnapshotIssues?: (payload: AuditAllTransferredSessionSnapshotIssuesPayload) => ConsoleCallableResult;
    repairTransferDryRun?: (payload: Omit<RepairTransferPayload, 'dryRun'>) => ConsoleCallableResult;
    repairTransferApply?: (payload: Omit<RepairTransferPayload, 'dryRun'>) => ConsoleCallableResult;
  }
}

const traceStudentTransferHistory = httpsCallable(functions, 'traceStudentTransferHistory');
const auditAllTransferredSessionSnapshotIssuesCallable = httpsCallable(functions, 'auditAllTransferredSessionSnapshotIssues');
const repairTransferredTeacherSessionSnapshots = httpsCallable(functions, 'repairTransferredTeacherSessionSnapshots');

async function callAndLog<TPayload extends Record<string, unknown>>(label: string, callable: (payload: TPayload) => Promise<{ data: unknown }>, payload: TPayload) {
  console.info(`[transfer-trace] ${label}:request`, payload);
  const result = await callable(payload);
  console.info(`[transfer-trace] ${label}:response`, result.data);
  return result.data;
}

if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.traceStudentTransfer = (payload) =>
    callAndLog('traceStudentTransfer', traceStudentTransferHistory, payload);

  window.auditAllTransferredSessionSnapshotIssues = (payload) =>
    callAndLog('auditAllTransferredSessionSnapshotIssues', auditAllTransferredSessionSnapshotIssuesCallable, payload);

  window.repairTransferDryRun = (payload) =>
    callAndLog('repairTransferDryRun', repairTransferredTeacherSessionSnapshots, {
      ...payload,
      dryRun: true,
    });

  window.repairTransferApply = (payload) =>
    callAndLog('repairTransferApply', repairTransferredTeacherSessionSnapshots, {
      ...payload,
      dryRun: false,
    });

  console.info('[transfer-trace] dev console helpers ready', {
    helpers: [
      'window.traceStudentTransfer(payload)',
      'window.auditAllTransferredSessionSnapshotIssues(payload)',
      'window.repairTransferDryRun(payload)',
      'window.repairTransferApply(payload)',
    ],
  });
}

export {};
