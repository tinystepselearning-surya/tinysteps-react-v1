import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildFinanceReconciliationMonthBounds,
} from '../src/helpers/financeReconciliationCompletedSessions';

describe('B6 Brick 5 finance reconciliation completed-session scope', () => {
  it('builds exact IST boundaries for August 2026', () => {
    const bounds = buildFinanceReconciliationMonthBounds('2026-08');

    expect(bounds.firstDate).toBe('2026-08-01');
    expect(bounds.nextMonthDate).toBe('2026-09-01');
    expect(bounds.startAtInclusive.toISOString()).toBe('2026-07-31T18:30:00.000Z');
    expect(bounds.startAtExclusive.toISOString()).toBe('2026-08-31T18:30:00.000Z');
  });

  it('handles year rollover without changing the IST boundary contract', () => {
    const bounds = buildFinanceReconciliationMonthBounds('2026-12');

    expect(bounds.firstDate).toBe('2026-12-01');
    expect(bounds.nextMonthDate).toBe('2027-01-01');
    expect(bounds.startAtInclusive.toISOString()).toBe('2026-11-30T18:30:00.000Z');
    expect(bounds.startAtExclusive.toISOString()).toBe('2026-12-31T18:30:00.000Z');
  });

  it('rejects malformed or impossible month keys', () => {
    expect(() => buildFinanceReconciliationMonthBounds('2026-8')).toThrow(
      'monthKey must be YYYY-MM',
    );
    expect(() => buildFinanceReconciliationMonthBounds('2026-13')).toThrow(
      'monthKey must be YYYY-MM',
    );
  });

  it('keeps month-scoped reads on canonical service-date fields and preserves all-time fallback', () => {
    const source = fs.readFileSync(
      path.resolve(
        process.cwd(),
        'functions/src/helpers/financeReconciliationCompletedSessions.ts',
      ),
      'utf8',
    );

    expect(source).toContain("where('date', '>=', bounds.firstDate)");
    expect(source).toContain("where('date', '<', bounds.nextMonthDate)");
    expect(source).toContain("where('startAt', '>=', admin.firestore.Timestamp.fromDate(bounds.startAtInclusive))");
    expect(source).toContain("where('startAt', '<', admin.firestore.Timestamp.fromDate(bounds.startAtExclusive))");
    expect(source).toContain("where('monthKey', '==', monthKey)");
    expect(source).toContain("where('status', '==', 'completed')");
    expect(source).toContain("mode: 'month_bounded_canonical_union'");
  });

  it('wires the bounded fetcher into the reconciliation report and retires the broad completed-session scan', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'functions/src/financeReconciliationReport.ts'),
      'utf8',
    );

    expect(source).toContain(
      "import { fetchCompletedSessionsForFinanceReconciliation } from './helpers/financeReconciliationCompletedSessions';",
    );
    expect(source).toContain('fetchCompletedSessionsForFinanceReconciliation({');
    expect(source).toContain('maxDocs: maxDocsPerCollection');
    expect(source).not.toContain(
      "fetchLimitedDocs(db.collection('classSessions').where('status', '==', 'completed'), maxDocsPerCollection)",
    );
  });
});
