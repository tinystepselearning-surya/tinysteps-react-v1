import { describe, expect, it } from 'vitest';
import {
  isSimpleFollowUpDecision,
  resolveSimpleLeadAction,
  resolveSimpleLeadBucket,
  resolveSimpleStatusLabel,
  simpleOutcomeNeedsReason,
} from './leadsWorkflowBuckets';

describe('simple leads workflow buckets', () => {
  it('keeps a new enquiry in the open pool with one work action', () => {
    expect(resolveSimpleLeadBucket({ leadStatus: 'new', hasDemo: false })).toBe('open');
    expect(resolveSimpleLeadAction({ leadStatus: 'new', hasDemo: false })).toBe('work_lead');
    expect(resolveSimpleStatusLabel({ leadStatus: 'new', hasDemo: false })).toBe('New enquiry');
  });

  it('keeps an unassigned open demo in the open pool', () => {
    expect(resolveSimpleLeadBucket({ demoStatus: 'open', hasDemo: true })).toBe('open');
    expect(resolveSimpleLeadAction({ demoStatus: 'open', hasDemo: true })).toBe('assign_teacher');
    expect(resolveSimpleStatusLabel({ demoStatus: 'open', hasDemo: true })).toBe('Ready to assign');
  });

  it('does not let a stale pre-demo follow-up override a newly created open demo', () => {
    expect(resolveSimpleLeadBucket({ demoStatus: 'open', hasDemo: true, hasFollowUp: true })).toBe('open');
    expect(resolveSimpleLeadAction({ demoStatus: 'open', hasDemo: true, hasFollowUp: true })).toBe('assign_teacher');
    expect(resolveSimpleStatusLabel({ demoStatus: 'open', hasDemo: true, hasFollowUp: true })).toBe('Ready to assign');
  });

  it('moves assigned and teacher-completed demos to in progress', () => {
    expect(resolveSimpleLeadBucket({ demoStatus: 'assigned', hasDemo: true })).toBe('in_progress');
    expect(resolveSimpleLeadBucket({ demoStatus: 'completed', hasDemo: true })).toBe('in_progress');
    expect(resolveSimpleLeadAction({ demoStatus: 'assigned', hasDemo: true })).toBe('wait_teacher');
    expect(resolveSimpleStatusLabel({ demoStatus: 'completed', hasDemo: true })).toBe('Teacher response ready');
  });

  it('moves a pre-demo parent follow-up out of the open pool', () => {
    expect(resolveSimpleLeadBucket({ leadStatus: 'attempted_contact', hasDemo: false, hasFollowUp: true })).toBe('in_progress');
    expect(resolveSimpleLeadAction({ leadStatus: 'attempted_contact', hasDemo: false, hasFollowUp: true })).toBe('follow_up_lead');
    expect(resolveSimpleStatusLabel({ leadStatus: 'attempted_contact', hasDemo: false, hasFollowUp: true })).toBe('Parent follow-up');
  });

  it('keeps positive post-demo decisions in progress and shows the admin decision', () => {
    expect(resolveSimpleLeadBucket({ demoStatus: 'completed', conversionStatus: 'interested', hasDemo: true })).toBe('in_progress');
    expect(resolveSimpleLeadBucket({ demoStatus: 'completed', conversionStatus: 'follow_up_later', hasDemo: true })).toBe('in_progress');
    expect(resolveSimpleStatusLabel({ demoStatus: 'completed', conversionStatus: 'interested', hasDemo: true })).toBe('Interested — follow up');
    expect(resolveSimpleStatusLabel({ demoStatus: 'completed', conversionStatus: 'follow_up_later', hasDemo: true })).toBe('Follow up later');
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

  it('keeps a cancelled demo visible until admin decides the outcome', () => {
    expect(resolveSimpleLeadBucket({ demoStatus: 'cancelled', hasDemo: true })).toBe('in_progress');
    expect(resolveSimpleLeadAction({ demoStatus: 'cancelled', hasDemo: true })).toBe('review_outcome');
    expect(resolveSimpleStatusLabel({ demoStatus: 'cancelled', hasDemo: true })).toBe('Needs admin decision');
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
