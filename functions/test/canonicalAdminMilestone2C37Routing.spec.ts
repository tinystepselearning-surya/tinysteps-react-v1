import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';

const src = (file: string) => readFileSync(resolve(process.cwd(), 'functions/src', file), 'utf8');
const wallet = src('wallet.ts');
const revenue = src('revenue.ts');
const index = src('index.ts');

describe('R5C2C37 bounded finance and wallet canonical Admin cutover', () => {
  it('replaces every requester guard without introducing a legacy fallback', () => {
    for (const [source, expected] of [[wallet, 9], [revenue, 7]] as const) {
      expect(source).toContain("from './helpers/canonicalAdminGuard'");
      expect(source).not.toContain("from './helpers/adminGuard'");
      expect(source).not.toMatch(/await\s+ensureAdmin\(/);
      expect((source.match(/await\s+ensureCanonicalAdmin\(/g) || []).length).toBe(expected);
    }
  });
  it('retains all nine wallet Admin callable interfaces, without moving trigger authorization', () => {
    for (const name of [
      'getWalletAutomationConfig',
      'setWalletAutomationConfig',
      'previewMissingWalletDeductions',
      'backfillMissingWalletDeductions',
      'adminReceiveParentPayment',
      'adminTopupParentWallet',
      'adminAdjustParentWallet',
      'initParentWalletOpeningDeficit',
      'reconcileParentWallet',
    ]) {
      expect(wallet).toContain('export const ' + name);
      expect(index).toContain(name);
    }
    expect(wallet).toContain('export const onBillingChargeWalletSync');
  });
  it('keeps revenue, payout and archive callable contracts in place', () => {
    for (const name of [
      'recordPayment',
      'recordTeacherPayout',
      'voidTeacherOrphanEarnings',
      'adminVoidSessionCharge',
      'previewFinanceCutoverArchive',
      'archiveFinanceRecordsThroughMonth',
      'reconcileSessionRevenueMonthKeys',
    ]) expect(revenue).toContain('export const ' + name);
    expect(revenue).toContain('normalizeArchiveThroughMonthKeyOrThrow');
    expect(revenue).toContain('normalizeMonthKeyOrThrow');
    expect(revenue).toContain('export const onSessionRevenueWrite');
  });
});
