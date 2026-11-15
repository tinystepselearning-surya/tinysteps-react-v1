import { describe, expect, it } from 'vitest';
import {
  isSimpleFollowUpDecision,
  resolveSimpleLeadAction,
  resolveSimpleLeadBucket,
  resolveSimpleStatusLabel,
  resolveLeadTriage,
  resolveEnquiryContactPreference,
  labelEnquiryContactPreference,
  simpleOutcomeNeedsReason,
} from './leadsWorkflowBuckets';

describe('four-stage leads workflow buckets', () => {
  it('treats a new enquiry without a linked demo as a short-lived open sync state', () => {
    expect(resolveSimpleLeadBucket({ leadStatus: 'new', hasDemo: false })).toBe('open');
    expect(resolveSimpleLeadAction({ leadStatus: 'new', hasDemo: false })).toBe('assign_teacher');
    expect(resolveSimpleStatusLabel({ leadStatus: 'new', hasDemo: false })).toBe('Demo request not linked');
  });

  it('keeps group and undecided enquiries assignable even when a demo link is missing', () => {
    for (const format of ['small_group', 'unsure']) {
      const input = { leadStatus: 'new', hasDemo: false, classFormatPreference: format };
      expect(resolveSimpleLeadBucket(input)).toBe('open');
      expect(resolveSimpleLeadAction(input)).toBe('assign_teacher');
    }
    expect(resolveSimpleStatusLabel({ hasDemo: false, classFormatPreference: 'small_group' })).toBe('Demo request not linked');
    expect(resolveSimpleStatusLabel({ hasDemo: false, classFormatPreference: 'unsure' })).toBe('Demo request not linked');
    expect(resolveSimpleLeadAction({ hasDemo: false, classFormatPreference: 'one_to_one' })).toBe('assign_teacher');
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

describe('guide-inspired lead triage — read-only evidence, never a verification score', () => {
  const completeLead = {
    parentName: 'Parent',
    parentPhone: '+91 98765 43210',
    childName: 'Child',
    childAge: 6,
    course: 'Phonics',
    mainConcern: 'Blending sounds to read words',
    source: 'website',
  };

  it('sorts only explicit parent-stated timing without treating it as verified intent', () => {
    expect(resolveLeadTriage({ ...completeLead, urgency: 'Today' }))
      .toMatchObject({ statedUrgency: 'Today', urgencyRank: 0, detailGaps: [] });
    expect(resolveLeadTriage({ ...completeLead, urgency: 'This week' }).urgencyRank).toBe(1);
    expect(resolveLeadTriage({ ...completeLead, urgency: 'This month' }).urgencyRank).toBe(2);
    expect(resolveLeadTriage({ ...completeLead, urgency: 'Just exploring' }).urgencyRank).toBe(3);
    expect(resolveLeadTriage({ ...completeLead, urgency: 'unknown' }))
      .toMatchObject({ statedUrgency: null, urgencyRank: 4 });
    expect(resolveLeadTriage({ ...completeLead, urgency: ' TODAY ' }).statedUrgency).toBe('Today');
  });

  it('identifies missing essentials but never treats an optional email, city or campaign as mandatory', () => {
    const result = resolveLeadTriage({
      parentName: '', parentPhone: '123', childName: null,
      childAge: '0', course: '—', source: '', mainConcern: '',
    });
    expect(result.detailGaps).toEqual([
      'parent name', 'contact number', 'child name',
      'child age', 'learning goal', 'enquiry source',
    ]);
    expect(result.urgencyRank).toBe(4);
  });

  it('preserves a genuinely undecided learning concern instead of mistaking inferred Reading for confirmed intent', () => {
    const result = resolveLeadTriage({
      ...completeLead,
      mainConcern: 'Not sure where to start',
      course: 'Reading',
      urgency: 'Just exploring',
    });
    expect(result.needsCourseGuidance).toBe(true);
    expect(result.detailGaps).toEqual(['course guidance']);
    expect(result.statedUrgency).toBe('Just exploring');
  });

  it('accepts the 13+ enquiry age band without treating it as a missing age', () => {
    const result = resolveLeadTriage({ ...completeLead, childAge: '13+' });
    expect(result.detailGaps).not.toContain('child age');
    const missingAge = resolveLeadTriage({ ...completeLead, childAge: null });
    expect(missingAge.detailGaps).toContain('child age');
  });

  it('leaves a complete known-goal lead out of missing-detail triage', () => {
    expect(resolveLeadTriage(completeLead).detailGaps).toEqual([]);
    expect(resolveLeadTriage({ ...completeLead, urgency: null }).statedUrgency).toBe(null);
  });
});

describe('parent-requested enquiry contact method', () => {
  it('accepts only an explicit matched permission and known preference', () => {
    expect(resolveEnquiryContactPreference({ contactPreference: 'phone', contactPermission: true })).toBe('phone');
    expect(resolveEnquiryContactPreference({ contactPreference: 'whatsapp', contactPermission: true })).toBe('whatsapp');
    expect(resolveEnquiryContactPreference({ contactPreference: 'either', contactPermission: true })).toBe('either');
    expect(resolveEnquiryContactPreference({ contactPreference: 'phone', contactPermission: false })).toBe(null);
    expect(resolveEnquiryContactPreference({ contactPreference: 'phone' })).toBe(null);
    expect(resolveEnquiryContactPreference({ contactPermission: true })).toBe(null);
    expect(resolveEnquiryContactPreference({ contactPreference: 'marketing', contactPermission: true })).toBe(null);
    expect(resolveEnquiryContactPreference(null)).toBe(null);
  });
  it('uses channel-specific labels without implying WhatsApp account verification', () => {
    expect(labelEnquiryContactPreference('phone')).toBe('Phone callback');
    expect(labelEnquiryContactPreference('whatsapp')).toBe('WhatsApp reply');
    expect(labelEnquiryContactPreference('either')).toBe('Phone or WhatsApp');
  });
});
