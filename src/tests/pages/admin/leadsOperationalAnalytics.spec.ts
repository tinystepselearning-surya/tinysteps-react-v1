import { describe, expect, it } from 'vitest';
import {
  LEAD_OPERATIONAL_QUEUES,
  deriveLeadAttention,
  istDayBounds,
  leadAgeBand,
  matchesOperationalQueue,
  stageAgeDays,
  type LeadOperationalRecord,
} from '../../../pages/admin/leadsOperationalAnalytics';

const ts = (iso: string) => ({ toMillis: () => Date.parse(iso) });
const NOW = Date.parse('2026-09-02T06:30:00.000Z'); // 12:00 IST

const lead = (overrides: Partial<LeadOperationalRecord> = {}): LeadOperationalRecord => ({
  id: 'lead-1',
  status: 'new',
  createdAt: ts('2026-09-02T04:30:00.000Z'),
  ...overrides,
});

describe('leadsOperationalAnalytics', () => {
  it('publishes the ten explicit operational queues', () => {
    expect(LEAD_OPERATIONAL_QUEUES.map((item) => item.key)).toEqual([
      'new_enquiries',
      'not_contacted',
      'follow_up_today',
      'overdue_follow_up',
      'no_response',
      'demo_not_scheduled',
      'demo_scheduled',
      'decision_pending',
      'enrolled',
      'lost',
    ]);
  });

  it('uses Asia/Kolkata day boundaries for due-today and overdue queues', () => {
    const bounds = istDayBounds(NOW);
    expect(new Date(bounds.startMs).toISOString()).toBe('2026-09-01T18:30:00.000Z');
    expect(new Date(bounds.endMs).toISOString()).toBe('2026-09-02T18:30:00.000Z');

    expect(matchesOperationalQueue(lead({
      status: 'admission_follow_up',
      nextFollowUpAt: ts('2026-09-02T03:30:00.000Z'),
    }), 'follow_up_today', NOW)).toBe(true);

    expect(matchesOperationalQueue(lead({
      status: 'admission_follow_up',
      nextFollowUpAt: ts('2026-09-01T10:00:00.000Z'),
    }), 'overdue_follow_up', NOW)).toBe(true);

    expect(matchesOperationalQueue(lead({
      status: 'admitted_confirmed',
      nextFollowUpAt: ts('2026-09-01T10:00:00.000Z'),
    }), 'overdue_follow_up', NOW)).toBe(false);
  });

  it('keeps queue membership rule-based and allows deliberate overlap', () => {
    const fresh = lead({ status: 'new' });
    expect(matchesOperationalQueue(fresh, 'new_enquiries', NOW)).toBe(true);
    expect(matchesOperationalQueue(fresh, 'not_contacted', NOW)).toBe(true);

    const noResponse = lead({ status: 'no_response' });
    expect(matchesOperationalQueue(noResponse, 'no_response', NOW)).toBe(true);
    expect(matchesOperationalQueue(noResponse, 'lost', NOW)).toBe(true);
  });

  it('flags overdue follow-ups before other attention rules', () => {
    const result = deriveLeadAttention(lead({
      status: 'admission_follow_up',
      nextFollowUpAt: ts('2026-09-01T10:00:00.000Z'),
      demoCompletedAt: ts('2026-09-02T02:00:00.000Z'),
    }), NOW);
    expect(result.level).toBe('needs_attention');
    expect(result.reason).toMatch(/overdue/i);
  });

  it('flags uncontacted leads after 24 hours without inventing a contact time', () => {
    const result = deriveLeadAttention(lead({
      status: 'attempted_contact',
      createdAt: ts('2026-08-31T06:30:00.000Z'),
      lastContactAt: null,
    }), NOW);
    expect(result.level).toBe('needs_attention');
    expect(result.reason).toMatch(/successful contact timestamp/i);
  });

  it('uses canonical demo milestone timestamps for stage-age attention', () => {
    const demoPending = lead({
      status: 'demo_pending_schedule',
      createdAt: ts('2026-08-20T06:30:00.000Z'),
      demoCreatedAt: ts('2026-08-30T06:30:00.000Z'),
    });
    expect(stageAgeDays(demoPending, NOW)).toBe(3);
    expect(deriveLeadAttention(demoPending, NOW).level).toBe('needs_attention');

    const decisionPending = lead({
      status: 'demo_completed',
      demoCompletedAt: ts('2026-08-29T06:30:00.000Z'),
    });
    expect(stageAgeDays(decisionPending, NOW)).toBe(4);
    expect(deriveLeadAttention(decisionPending, NOW).level).toBe('needs_attention');
  });

  it('does not classify closed leads as urgent even if stale follow-up data remains', () => {
    const result = deriveLeadAttention(lead({
      status: 'admitted_confirmed',
      nextFollowUpAt: ts('2026-08-01T00:00:00.000Z'),
    }), NOW);
    expect(result.level).toBe('closed');
  });

  it('assigns deterministic lead-age bands from enquiry received time', () => {
    expect(leadAgeBand(lead({ createdAt: ts('2026-09-02T05:30:00.000Z') }), NOW)).toBe('0_1');
    expect(leadAgeBand(lead({ createdAt: ts('2026-08-30T06:30:00.000Z') }), NOW)).toBe('2_3');
    expect(leadAgeBand(lead({ createdAt: ts('2026-08-27T06:30:00.000Z') }), NOW)).toBe('4_7');
    expect(leadAgeBand(lead({ createdAt: ts('2026-08-20T06:30:00.000Z') }), NOW)).toBe('8_14');
    expect(leadAgeBand(lead({ createdAt: ts('2026-08-01T06:30:00.000Z') }), NOW)).toBe('15_plus');
  });
});
