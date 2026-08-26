import { describe, expect, it } from 'vitest';
import {
  isSimpleFollowUpDecision,
  resolveSimpleLeadAction,
  resolveSimpleLeadBucket,
  resolveSimpleStatusLabel,
  simpleOutcomeNeedsReason,
} from './leadsWorkflowBuckets';

describe('four-stage leads workflow buckets', () => {
  it('treats a new enquiry without a linked demo as a short-lived open sync state', () => {
    expect(resolveSimpleLeadBucket({ leadStatus: 'new', hasDemo: false })).toBe('open');
    expect(resolveSimpleLeadAction({ leadStatus: 'new', hasDemo: false })).toBe('awaiting_demo');
    expect(resolveSimpleStatusLabel({ leadStatus: 'new', hasDemo: false })).toBe('Preparing demo request');
  });

  it('keeps an unassigned demo in Open', () => {
    expect(resolveSimpleLeadBucket({ demoStatus: 'open', hasDemo: true })).toBe('open');
    expect(resolveSimpleLeadAction({ demoStatus: 'open', hasDemo: true })).toBe('assign_teacher');
    expect(resolveSimpleStatusLabel({ demoStatus: 'open', hasDemo: true })).toBe('Ready to assign');
  });

  it('allows an unassigned Open demo to close directly as no response', () => {
    const input = { demoStatus: 'open', conversionStatus: 'no_response', hasDemo: true };
    expect(resolveSimpleLeadBucket(input)).toBe('closed');
    expect(resolveSimpleLeadAction(input)).toBe('view_outcome');
    expect(resolveSimpleStatusLabel(input)).toBe('No response');
  });

  it('does not let stale pre-demo follow-up data override a newly linked open demo', () => {
    expect(resolveSimpleLeadBucket({ demoStatus: 'open', hasDemo: true, hasFollowUp: true })).toBe('open');
    expect(resolveSimpleLeadAction({ demoStatus: 'open', hasDemo: true, hasFollowUp: true })).toBe('assign_teacher');
  });

  it('moves only assigned demos into the teacher-owned bucket', () => {
    expect(resolveSimpleLeadBucket({ demoStatus: 'assigned', hasDemo: true })).toBe('in_progress');
    expect(resolveSimpleLeadAction({ demoStatus: 'assigned', hasDemo: true })).toBe('wait_teacher');
    expect(resolveSimpleStatusLabel({ demoStatus: 'assigned', hasDemo: true })).toBe('With teacher');
  });

  it('moves teacher-completed demos into the dedicated admin review bucket', () => {
    expect(resolveSimpleLeadBucket({ demoStatus: 'completed', hasDemo: true })).toBe('admin_review');
    expect(resolveSimpleLeadAction({ demoStatus: 'completed', hasDemo: true })).toBe('review_outcome');
    expect(resolveSimpleStatusLabel({ demoStatus: 'completed', hasDemo: true })).toBe('Ready for admin review');
  });

  it('routes cancelled demos to admin review instead of leaving them with the teacher', () => {
    expect(resolveSimpleLeadBucket({ demoStatus: 'cancelled', hasDemo: true })).toBe('admin_review');
    expect(resolveSimpleLeadAction({ demoStatus: 'cancelled', hasDemo: true })).toBe('review_outcome');
    expect(resolveSimpleStatusLabel({ demoStatus: 'cancelled', hasDemo: true })).toBe('Needs admin action');
  });

  it('keeps positive admin follow-up decisions in Admin Review', () => {
    expect(resolveSimpleLeadBucket({ demoStatus: 'completed', conversionStatus: 'interested', hasDemo: true })).toBe('admin_review');
    expect(resolveSimpleLeadBucket({ demoStatus: 'completed', conversionStatus: 'follow_up_later', hasDemo: true })).toBe('admin_review');
    expect(resolveSimpleStatusLabel({ demoStatus: 'completed', conversionStatus: 'interested', hasDemo: true })).toBe('Interested — follow up');
  });

  it('routes legacy pre-demo follow-up work to Admin Review', () => {
    expect(resolveSimpleLeadBucket({ leadStatus: 'attempted_contact', hasDemo: false, hasFollowUp: true })).toBe('admin_review');
    expect(resolveSimpleLeadAction({ leadStatus: 'attempted_contact', hasDemo: false, hasFollowUp: true })).toBe('follow_up_lead');
    expect(resolveSimpleStatusLabel({ leadStatus: 'attempted_contact', hasDemo: false, hasFollowUp: true })).toBe('Admin follow-up');
  });

  it('closes only terminal admin decisions', () => {
    expect(resolveSimpleLeadBucket({ demoStatus: 'completed', conversionStatus: 'enrolled', hasDemo: true })).toBe('closed');
    expect(resolveSimpleLeadBucket({ conversionStatus: 'not_interested' })).toBe('closed');
    expect(resolveSimpleLeadBucket({ leadStatus: 'wrong_fit' })).toBe('closed');
    expect(resolveSimpleLeadBucket({ leadStatus: 'no_response' })).toBe('closed');
  });

  it('keeps terminal decisions closed even when stale follow-up data remains', () => {
    expect(resolveSimpleLeadBucket({ leadStatus: 'not_interested', hasFollowUp: true })).toBe('closed');
    expect(resolveSimpleLeadBucket({ conversionStatus: 'enrolled', demoStatus: 'completed', hasDemo: true, hasFollowUp: true })).toBe('closed');
    expect(resolveSimpleLeadAction({ leadStatus: 'not_interested', hasDemo: false, hasFollowUp: true })).toBe('view_outcome');
  });

  it('defines follow-up and closure validation rules', () => {
    expect(isSimpleFollowUpDecision('interested')).toBe(true);
    expect(isSimpleFollowUpDecision('follow_up_later')).toBe(true);
    expect(isSimpleFollowUpDecision('enrolled')).toBe(false);

    expect(simpleOutcomeNeedsReason('not_interested')).toBe(true);
    expect(simpleOutcomeNeedsReason('wrong_fit')).toBe(true);
    expect(simpleOutcomeNeedsReason('no_response')).toBe(true);
    expect(simpleOutcomeNeedsReason('enrolled')).toBe(false);
  });
});
