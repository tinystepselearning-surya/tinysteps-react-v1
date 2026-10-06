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
  'functions/src/messaging/syncMessageThreadsForActiveStudents.ts',
);
const indexSource = read(
  'functions/src/index.ts',
);

describe('Wave 1 R5C2C6 message-thread sync Admin authorization', () => {
  it('authorizes the Admin maintenance callable from canonical access only', () => {
    expect(source).toContain(
      "from '../helpers/canonicalAdminGuard'",
    );
    expect(source).toContain(
      'await ensureCanonicalAdmin(request.auth);',
    );
    expect(source).not.toContain(
      "from '../helpers/adminGuard'",
    );
    expect(source).not.toContain(
      'await ensureAdmin(request.auth);',
    );
  });

  it('preserves bounded message-thread sync behavior', () => {
    expect(source).toContain(
      'PROCESS_BATCH_SIZE = 10',
    );
    expect(source).toContain(
      'collectActiveKidIds',
    );
    expect(source).toContain(
      'buildMessageThreadSyncPayload',
    );
    expect(source).toContain(
      'upsertMessageThread',
    );
    expect(source).toContain(
      'MAX_ERROR_ITEMS = 20',
    );
  });

  it('keeps a single independently exported production callable', () => {
    expect(indexSource).toContain(
      "export { syncMessageThreadsForActiveStudents } from './messaging/syncMessageThreadsForActiveStudents';",
    );
  });
});
