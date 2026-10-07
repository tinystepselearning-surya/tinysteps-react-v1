import fs from 'node:fs';
import path from 'node:path';
import {
  describe,
  expect,
  it,
} from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(
    path.resolve(process.cwd(), relativePath),
    'utf8',
  );

const source = read(
  'functions/src/reconcileParentPaymentsMonthReadModels.ts',
);
const indexSource = read(
  'functions/src/index.ts',
);

describe('Wave 1 R5C2C13 parent-payment read-model Admin authorization', () => {
  it('authorizes the callable from canonical Admin access only', () => {
    expect(source).toContain(
      "from './helpers/canonicalAdminGuard'",
    );
    expect(source).toContain(
      'await ensureCanonicalAdmin(request.auth);',
    );
    expect(source).not.toContain(
      "from './helpers/adminGuard'",
    );
    expect(source).not.toContain(
      'await ensureAdmin(request.auth);',
    );
  });

  it('preserves dry-run default and derived-read-model-only write safety', () => {
    expect(source).toContain(
      'const dryRun = data.dryRun !== false;',
    );
    expect(source).toContain(
      'writesPayments: false',
    );
    expect(source).toContain(
      'writesBillingCharges: false',
    );
    expect(source).toContain(
      'writesWallets: false',
    );
    expect(source).toContain(
      'writesMonthlyReadModels: !dryRun',
    );
    expect(source).toContain(
      'const HARD_MAX_PARENTS = 1500;',
    );
  });

  it('keeps one independently exported production callable', () => {
    expect(indexSource).toContain(
      'export { reconcileParentPaymentsMonthReadModels } from "./reconcileParentPaymentsMonthReadModels";',
    );
  });
});
