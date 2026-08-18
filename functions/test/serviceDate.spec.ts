import { describe, expect, it } from 'vitest';
import {
  classifyInvoiceCharges,
  resolveCanonicalServiceDate,
} from '../src/helpers/serviceDate';

type Charge = Record<string, unknown> & { id: string };

function classify(charges: Charge[], sessionsById: Record<string, Record<string, unknown> | null>, selectedMonth = '2026-07') {
  return classifyInvoiceCharges({ charges, sessionsById, selectedMonth });
}

describe('canonical service date and invoice integrity', () => {
  it('uses the linked July session date instead of an August ledger createdAt', () => {
    const [row] = classify(
      [{ id: 'session-1', sessionId: 'session-1', monthKey: '2026-07', createdAt: '2026-08-10T10:00:00Z', status: 'open' }],
      { 'session-1': { date: '2026-07-17', startAt: '2026-07-17T11:00:00Z' } },
    );
    expect(row).toMatchObject({ integrity: 'VALID', serviceDate: '2026-07-17', dateSource: 'session.date' });
  });

  it('flags and excludes an August service session tagged to July', () => {
    const [row] = classify(
      [{ id: 'charge-1', sessionId: 'session-1', monthKey: '2026-07', status: 'open' }],
      { 'session-1': { date: '2026-08-10' } },
    );
    expect(row).toMatchObject({ integrity: 'MONTH_MISMATCH', serviceMonthKey: '2026-08' });
  });

  it('preserves two genuine same-day sessions', () => {
    const rows = classify(
      [
        { id: 'charge-a', sessionId: 'session-a', monthKey: '2026-07', status: 'open' },
        { id: 'charge-b', sessionId: 'session-b', monthKey: '2026-07', status: 'open' },
      ],
      { 'session-a': { date: '2026-07-10' }, 'session-b': { date: '2026-07-10' } },
    );
    expect(rows.map((row) => row.integrity)).toEqual(['VALID', 'VALID']);
  });

  it('flags every active charge when one canonical session is duplicated', () => {
    const rows = classify(
      [
        { id: 'charge-a', sessionId: 'session-1', monthKey: '2026-07', status: 'open' },
        { id: 'charge-b', sessionId: 'session-1', monthKey: '2026-07', status: 'paid' },
      ],
      { 'session-1': { date: '2026-07-10' } },
    );
    expect(rows.map((row) => row.integrity)).toEqual(['DUPLICATE_SESSION_CHARGE', 'DUPLICATE_SESSION_CHARGE']);
  });

  it('does not count an inactive historical charge as a duplicate', () => {
    const rows = classify(
      [
        { id: 'charge-a', sessionId: 'session-1', monthKey: '2026-07', status: 'open' },
        { id: 'charge-b', sessionId: 'session-1', monthKey: '2026-07', status: 'void' },
      ],
      { 'session-1': { date: '2026-07-10' } },
    );
    expect(rows[0].integrity).toBe('VALID');
  });

  it('uses a historical charge snapshot only after linked session fields are exhausted', () => {
    const resolved = resolveCanonicalServiceDate(
      { date: 'invalid', startAt: null },
      { serviceDate: '2026-07-17', createdAt: '2026-08-10T10:00:00Z' },
    );
    expect(resolved).toMatchObject({ serviceDate: '2026-07-17', source: 'charge.serviceDate' });
  });

  it('classifies a missing linked session separately from an unresolved date', () => {
    const [row] = classify(
      [{ id: 'charge-1', sessionId: 'missing-session', monthKey: '2026-07', serviceDate: '2026-07-17', status: 'open' }],
      { 'missing-session': null },
    );
    expect(row.integrity).toBe('SESSION_MISSING');
  });

  it('never treats createdAt as a service date', () => {
    const [row] = classify(
      [{ id: 'charge-1', sessionId: 'session-1', monthKey: '2026-07', createdAt: '2026-07-17T10:00:00Z', status: 'open' }],
      { 'session-1': { date: 'invalid', startAt: null } },
    );
    expect(row).toMatchObject({ integrity: 'SERVICE_DATE_UNRESOLVED', serviceDate: null, dateSource: null });
  });

  it('never admits a charge without canonical session identity even when it has a legacy service date', () => {
    const [row] = classify(
      [{ id: 'charge-1', monthKey: '2026-07', serviceDate: '2026-07-17', status: 'open' }],
      {},
    );
    expect(row).toMatchObject({ integrity: 'SESSION_MISSING', serviceDate: null, dateSource: null });
  });

  it('uses Asia/Kolkata at UTC month boundaries', () => {
    const resolved = resolveCanonicalServiceDate({ startAt: '2026-06-30T19:00:00.000Z' }, null);
    expect(resolved).toMatchObject({ serviceDate: '2026-07-01', serviceMonthKey: '2026-07' });
  });

  it('marks explicitly supported legacy session-origin fields for audit', () => {
    const resolved = resolveCanonicalServiceDate(null, { chargeDate: '2026-07-17' });
    expect(resolved).toMatchObject({
      serviceDate: '2026-07-17',
      source: 'charge.legacySessionOrigin',
      usedLegacyChargeDate: true,
    });
  });
});
