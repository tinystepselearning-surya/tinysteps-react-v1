import { describe, expect, it } from 'vitest';
import {
  ACTIVE_LEAD_STATUSES,
  CLOSED_LEAD_PAGE_SIZE,
  CLOSED_LEAD_STATUSES,
  mergeLeadCollections,
} from './leadsRealtime';

describe('optimized leads realtime model', () => {
  it('keeps every operational workflow status in the realtime set', () => {
    expect(ACTIVE_LEAD_STATUSES).toEqual([
      'new',
      'attempted_contact',
      'contacted',
      'qualified',
      'demo_pending_schedule',
      'demo_booked',
      'demo_completed',
      'admission_follow_up',
    ]);
  });

  it('keeps terminal decisions out of the operational realtime set', () => {
    const active = new Set(ACTIVE_LEAD_STATUSES);
    CLOSED_LEAD_STATUSES.forEach((status) => expect(active.has(status as any)).toBe(false));
    expect(CLOSED_LEAD_STATUSES).toEqual([
      'admitted_confirmed',
      'not_interested',
      'wrong_fit',
      'no_response',
      'lost',
    ]);
  });

  it('bounds each closed-history page', () => {
    expect(CLOSED_LEAD_PAGE_SIZE).toBe(100);
  });

  it('deduplicates query streams and lets terminal state win during transitions', () => {
    const active = [
      { id: 'lead-1', status: 'demo_completed' },
      { id: 'lead-2', status: 'demo_booked' },
    ];
    const closed = [
      { id: 'lead-1', status: 'admitted_confirmed' },
      { id: 'lead-3', status: 'lost' },
    ];

    expect(mergeLeadCollections(active, closed)).toEqual([
      { id: 'lead-1', status: 'admitted_confirmed' },
      { id: 'lead-2', status: 'demo_booked' },
      { id: 'lead-3', status: 'lost' },
    ]);
  });
});
