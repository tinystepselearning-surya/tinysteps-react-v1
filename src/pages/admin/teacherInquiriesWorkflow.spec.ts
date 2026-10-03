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

  it('keeps only selected and not-selected as current closed outcomes', () => {
    expect(normalizeTeacherInquiryFinalStatus('selected')).toBe('selected');
    expect(normalizeTeacherInquiryFinalStatus('not_selected')).toBe('not_selected');
    expect(normalizeTeacherInquiryFinalStatus('mock_demo_pending')).toBe('');
  });

  it('maps legacy closed outcomes into not selected so historical records stay visible', () => {
    expect(normalizeTeacherInquiryFinalStatus('no_response')).toBe('not_selected');
    expect(normalizeTeacherInquiryFinalStatus('withdrawn')).toBe('not_selected');
  });

  it('requires a final status before an application can close', () => {
    expect(canCloseTeacherInquiry('selected')).toBe(true);
    expect(canCloseTeacherInquiry('not_selected')).toBe(true);
    expect(canCloseTeacherInquiry('')).toBe(false);
  });

  it('formats the two closed decisions for the admin UI', () => {
    expect(teacherInquiryFinalStatusLabel('selected')).toBe('Selected & Closed');
    expect(teacherInquiryFinalStatusLabel('not_selected')).toBe('Not Selected & Closed');
    expect(teacherInquiryFinalStatusLabel('no_response')).toBe('Not Selected & Closed');
    expect(teacherInquiryFinalStatusLabel('withdrawn')).toBe('Not Selected & Closed');
  });
});
