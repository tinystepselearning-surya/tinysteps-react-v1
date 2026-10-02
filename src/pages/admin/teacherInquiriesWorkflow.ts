export type TeacherInquiryStage = 'open' | 'admin_review' | 'closed';

export type TeacherInquiryFinalStatus =
  | 'selected'
  | 'not_selected'
  | 'no_response'
  | 'withdrawn';

export const TEACHER_INQUIRY_STAGE_OPTIONS: Array<{
  value: TeacherInquiryStage;
  label: string;
  description: string;
}> = [
  {
    value: 'open',
    label: 'Open',
    description: 'New teacher applications waiting for admin review.',
  },
  {
    value: 'admin_review',
    label: 'Admin Review',
    description: 'Applications currently being handled by admin.',
  },
  {
    value: 'closed',
    label: 'Closed',
    description: 'Applications with a final decision.',
  },
];

export const TEACHER_INQUIRY_FINAL_STATUS_OPTIONS: Array<{
  value: TeacherInquiryFinalStatus;
  label: string;
}> = [
  { value: 'selected', label: 'Selected' },
  { value: 'not_selected', label: 'Not Selected' },
  { value: 'no_response', label: 'No Response' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

const STAGES = new Set<TeacherInquiryStage>(
  TEACHER_INQUIRY_STAGE_OPTIONS.map((item) => item.value),
);

const FINAL_STATUSES = new Set<TeacherInquiryFinalStatus>(
  TEACHER_INQUIRY_FINAL_STATUS_OPTIONS.map((item) => item.value),
);

export function normalizeTeacherInquiryStage(value: unknown): TeacherInquiryStage {
  const normalized = String(value || '').trim().toLowerCase() as TeacherInquiryStage;
  return STAGES.has(normalized) ? normalized : 'open';
}

export function normalizeTeacherInquiryFinalStatus(
  value: unknown,
): TeacherInquiryFinalStatus | '' {
  const normalized = String(value || '').trim().toLowerCase() as TeacherInquiryFinalStatus;
  return FINAL_STATUSES.has(normalized) ? normalized : '';
}

export function canCloseTeacherInquiry(value: unknown): boolean {
  return normalizeTeacherInquiryFinalStatus(value) !== '';
}

export function teacherInquiryFinalStatusLabel(value: unknown): string {
  const normalized = normalizeTeacherInquiryFinalStatus(value);
  return (
    TEACHER_INQUIRY_FINAL_STATUS_OPTIONS.find((item) => item.value === normalized)?.label ||
    'Not decided'
  );
}
