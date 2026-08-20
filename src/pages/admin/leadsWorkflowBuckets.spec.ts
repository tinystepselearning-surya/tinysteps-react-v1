import { describe, expect, it } from 'vitest';
import {
  resolveSimpleLeadAction,
  resolveSimpleLeadBucket,
  resolveSimpleStatusLabel,
} from './leadsWorkflowBuckets';

describe('simple leads workflow buckets', () => {
  it('keeps a new enquiry in the open pool', () => {
    expect(resolveSimpleLeadBucket({ leadStatus: 'new' })).toBe('open');
    expect(resolveSimpleLeadAction({ leadStatus: 'new', hasDemo: false })).toBe('create_demo');
  });

  it('keeps an unassigned open demo in the open pool', () => {
    expect(resolveSimpleLeadBucket({ demoStatus: 'open' })).toBe('open');
    expect(resolveSimpleLeadAction({ demoStatus: 'open', hasDemo: true })).toBe('assign_teacher');
  });

  it('moves assigned and teacher-completed demos to in progress', () => {
    expect(resolveSimpleLeadBucket({ demoStatus: 'assigned' })).toBe('in_progress');
    expect(resolveSimpleLeadBucket({ demoStatus: 'completed' })).toBe('in_progress');
    expect(resolveSimpleStatusLabel({ demoStatus: 'completed', hasDemo: true })).toBe('Teacher response ready');
  });

  it('keeps positive follow-up decisions in progress', () => {
    expect(resolveSimpleLeadBucket({ demoStatus: 'completed', conversionStatus: 'interested' })).toBe('in_progress');
    expect(resolveSimpleLeadBucket({ demoStatus: 'completed', conversionStatus: 'follow_up_later' })).toBe('in_progress');
  });

  it('closes only terminal admin decisions', () => {
    expect(resolveSimpleLeadBucket({ demoStatus: 'completed', conversionStatus: 'enrolled' })).toBe('closed');
    expect(resolveSimpleLeadBucket({ conversionStatus: 'not_interested' })).toBe('closed');
    expect(resolveSimpleLeadBucket({ leadStatus: 'wrong_fit' })).toBe('closed');
    expect(resolveSimpleLeadBucket({ leadStatus: 'no_response' })).toBe('closed');
  });

  it('keeps a cancelled demo visible until admin decides the outcome', () => {
    expect(resolveSimpleLeadBucket({ demoStatus: 'cancelled' })).toBe('in_progress');
    expect(resolveSimpleLeadAction({ demoStatus: 'cancelled', hasDemo: true })).toBe('review_outcome');
  });
});
