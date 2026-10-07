import fs from 'node:fs';
import path from 'node:path';
import {
  describe,
  expect,
  it,
} from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

const source = read('functions/src/adminUpdateUserCanonical.ts');

describe('Archived user reactivation routing', () => {
  it('detects archived to active as a reactivation', () => {
    expect(source).toContain(
      "previousStatus === 'archived' &&",
    );
    expect(source).toContain(
      "status === 'active'",
    );
  });

  it('clears stale compatibility archive markers in the same canonical update plan', () => {
    expect(source).toContain(
      'userProjection.data.archivedAt = null;',
    );
    expect(source).toContain(
      'userProjection.data.archivedBy = null;',
    );
    expect(source).toContain(
      'userProjection.data.reactivatedAt =',
    );
    expect(source).toContain(
      'userProjection.data.reactivatedBy =',
    );
  });

  it('continues to refresh canonical auth access after update', () => {
    expect(source).toContain(
      'refreshAuthAccessReadModelBestEffort',
    );
    expect(source).toContain(
      "context: 'adminUpdateUser'",
    );
  });
});
