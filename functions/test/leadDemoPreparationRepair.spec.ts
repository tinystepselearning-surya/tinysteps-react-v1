import { describe, expect, it } from 'vitest';
import { shouldRepairPreparingDemoLead } from '../src/leadDemoPreparationRepair';

describe('legacy preparing-demo repair guard', () => {
  it('repairs a legacy website lead that predates canonical dedupe fields', () => {
    expect(shouldRepairPreparingDemoLead('lead-old-website', {
      source: 'website',
      status: 'new',
      childName: 'Samaira',
      primaryPhone: '+16089823283',
    })).toBe(true);
  });

  it('does not repair leads that already have demo lifecycle evidence', () => {
    expect(shouldRepairPreparingDemoLead('lead-with-demo', {
      source: 'website',
      status: 'demo_pending_schedule',
      childName: 'Samaira',
      primaryPhone: '+16089823283',
      demoIds: ['existing-demo'],
    })).toBe(false);

    expect(shouldRepairPreparingDemoLead('lead-with-demo-date', {
      source: 'website',
      status: 'new',
      childName: 'Samaira',
      primaryPhone: '+16089823283',
      demoCreatedAt: { seconds: 123 },
    })).toBe(false);
  });

  it('does not touch terminal, synthetic, invalid identity or known-conflict records', () => {
    expect(shouldRepairPreparingDemoLead('demo_legacy', {
      childName: 'Child',
      primaryPhone: '9440436379',
    })).toBe(false);

    expect(shouldRepairPreparingDemoLead('lead-closed', {
      status: 'not_interested',
      childName: 'Child',
      primaryPhone: '9440436379',
    })).toBe(false);

    expect(shouldRepairPreparingDemoLead('lead-no-phone', {
      status: 'new',
      childName: 'Child',
    })).toBe(false);

    expect(shouldRepairPreparingDemoLead('lead-conflict', {
      source: 'website',
      status: 'new',
      childName: 'Child',
      primaryPhone: '9440436379',
      dedupeConflict: 'identity_index_canonical_mismatch',
    })).toBe(false);
  });

  it('repairs valid non-website leads without requiring website canonical metadata', () => {
    expect(shouldRepairPreparingDemoLead('lead-whatsapp', {
      source: 'whatsapp',
      status: 'new',
      childName: 'Child',
      whatsappNumber: '+919440436379',
    })).toBe(true);
  });
});
