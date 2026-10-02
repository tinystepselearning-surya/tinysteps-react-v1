import { describe, expect, it } from 'vitest';
import {
  canCloseTeacherInquiry,
  normalizeTeacherInquiryFinalStatus,
  normalizeTeacherInquiryStage,
  teacherInquiryFinalStatusLabel,
} from './teacherInquiriesWorkflow';

describe('teacher enquiries three-stage workflow', () => {
  it('keeps only Open, Admin Review and Closed as valid stages', () => {
    expect(normalizeTeacherInquiryStage('open')).toBe('open');
    expect(normalizeTeacherInquiryStage('admin_review')).toBe('admin_review');
    expect(normalizeTeacherInquiryStage('closed')).toBe('closed');
    expect(normalizeTeacherInquiryStage('with_hr')).toBe('open');
    expect(normalizeTeacherInquiryStage('with_auditor')).toBe('open');
  });

  it('keeps final statuses intentionally small', () => {
    expect(normalizeTeacherInquiryFinalStatus('selected')).toBe('selected');
    expect(normalizeTeacherInquiryFinalStatus('not_selected')).toBe('not_selected');
    expect(normalizeTeacherInquiryFinalStatus('no_response')).toBe('no_response');
    expect(normalizeTeacherInquiryFinalStatus('withdrawn')).toBe('withdrawn');
    expect(normalizeTeacherInquiryFinalStatus('mock_demo_pending')).toBe('');
  });

  it('requires a final status before an application can close', () => {
    expect(canCloseTeacherInquiry('selected')).toBe(true);
    expect(canCloseTeacherInquiry('not_selected')).toBe(true);
    expect(canCloseTeacherInquiry('')).toBe(false);
  });

  it('formats final decisions for the admin UI', () => {
    expect(teacherInquiryFinalStatusLabel('selected')).toBe('Selected');
    expect(teacherInquiryFinalStatusLabel('not_selected')).toBe('Not Selected');
    expect(teacherInquiryFinalStatusLabel('no_response')).toBe('No Response');
    expect(teacherInquiryFinalStatusLabel('withdrawn')).toBe('Withdrawn');
  });
});
