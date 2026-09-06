import React from 'react';
import {
  TEACHER_PAY_RETENTION_REASON_OPTIONS,
  type AttendanceCorrectionTeacherPayDisposition,
  type AttendanceCorrectionTeacherPayReasonCode,
} from './attendanceCorrectionTeacherPay';

type Props = {
  visible: boolean;
  disposition: AttendanceCorrectionTeacherPayDisposition;
  reasonCode: AttendanceCorrectionTeacherPayReasonCode;
  onDispositionChange: (value: AttendanceCorrectionTeacherPayDisposition) => void;
  onReasonCodeChange: (value: AttendanceCorrectionTeacherPayReasonCode) => void;
  disabled?: boolean;
};

export default function TeacherPayHandlingControl({
  visible,
  disposition,
  reasonCode,
  onDispositionChange,
  onReasonCodeChange,
  disabled = false,
}: Props) {
  if (!visible) return null;

  return (
    <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div>
        <div className="text-sm font-semibold text-slate-900">Teacher Payment Handling</div>
        <p className="mt-1 text-xs text-slate-600">
          Required for Present attendance corrections. Parent billing is unchanged; this only decides teacher compensation.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700">Payment decision (required)</label>
        <select
          className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"
          value={disposition}
          onChange={(event) => {
            const next = event.target.value as AttendanceCorrectionTeacherPayDisposition;
            onDispositionChange(next);
            if (next !== 'retain_school') onReasonCodeChange('');
          }}
          disabled={disabled}
        >
          <option value="">Select payment handling</option>
          <option value="credit_teacher">Credit Teacher Normally</option>
          <option value="retain_school">Retain Teacher Payment by School</option>
        </select>
      </div>

      {disposition === 'credit_teacher' ? (
        <div className="rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs text-emerald-800">
          Teacher will receive the normal snapshotted class rate.
        </div>
      ) : null}

      {disposition === 'retain_school' ? (
        <>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Retention reason (required)</label>
            <select
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm"
              value={reasonCode}
              onChange={(event) => onReasonCodeChange(event.target.value as AttendanceCorrectionTeacherPayReasonCode)}
              disabled={disabled}
            >
              <option value="">Select reason</option>
              {TEACHER_PAY_RETENTION_REASON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="rounded-md border border-amber-300 bg-white px-3 py-2 text-xs text-amber-900">
            Teacher will receive ₹0 for this class. The normal teacher rate remains preserved as the immutable rate snapshot and will be recorded as school-retained teacher pay.
          </div>
        </>
      ) : null}
    </div>
  );
}
