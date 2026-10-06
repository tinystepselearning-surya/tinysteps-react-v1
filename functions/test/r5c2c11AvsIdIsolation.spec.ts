import fs from 'node:fs';
import path from 'node:path';
import {
  describe,
  expect,
  it,
} from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

const manualSource = read(
  'functions/src/attendanceValidation/manualVerificationCallable.ts',
);
const cachedSource = read(
  'functions/src/attendanceValidation/cachedGroupRevalidationCallable.ts',
);
const helperSource = read(
  'functions/src/attendanceValidation/avsId.ts',
);

describe('Wave 1 R5C2C11 prerequisite AVS validator isolation', () => {
  it('removes the manual verification dependency on the cached callable module', () => {
    expect(manualSource).toContain(
      "from './avsId'",
    );
    expect(manualSource).not.toContain(
      "from './cachedGroupRevalidationCallable'",
    );
  });

  it('preserves the exact AVS ID validation contract in the isolated helper', () => {
    expect(helperSource).toContain(
      "throw new HttpsError('invalid-argument'",
    );
    expect(helperSource).toContain(
      'id.length > 240',
    );
    expect(helperSource).toContain(
      "id.includes('/')",
    );
    expect(helperSource).toContain(
      'char.charCodeAt(0) < 32',
    );
  });

  it('keeps the cached callable structurally isolated from manual verification', () => {
    expect(cachedSource).toContain(
      'export function exactAvsId',
    );
    expect(manualSource).not.toContain(
      "from './cachedGroupRevalidationCallable'",
    );
  });
});
