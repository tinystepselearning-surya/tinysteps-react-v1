import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

describe('Wave 1 current-user authorization invariant', () => {
  const adminGuard = read('functions/src/helpers/adminGuard.ts');
  const lifecycle = read('functions/src/lifecycle.ts');
  const makeup = read('functions/src/createMakeupSessionFromCredit.ts');
  const refreshPublicKb = read('functions/src/ai/refreshPublicKb.ts');
  const sendMessage = read('functions/src/messaging/sendMessage.ts');
  const createThread = read('functions/src/messaging/createOrSyncMessageThread.ts');
  const rules = read('firestore.rules');

  it('requires a current users document for callable Admin authorization', () => {
    expect(adminGuard).toContain("collection('users')");
    expect(adminGuard).toContain('stale/orphan Admin claim rejected');
    expect(adminGuard).toContain('if (!snap.exists)');
    expect(adminGuard).toContain('if (!isActiveOrLegacyUser(data))');
    expect(adminGuard).not.toContain('if (isAdmin) return;');
  });

  it('removes direct token-only Admin bypasses from mixed-role callables', () => {
    expect(lifecycle).not.toContain(
      "if (auth.token?.role === 'admin' || auth.token?.admin === true) return;",
    );

    const userLookup = makeup.indexOf(
      "collection('users').doc(auth.uid).get()",
    );
    const tokenFallback = makeup.indexOf(
      'const tokenRole = normalizeRole(auth.token?.role)',
    );
    expect(userLookup).toBeGreaterThanOrEqual(0);
    expect(tokenFallback).toBeGreaterThan(userLookup);

    expect(refreshPublicKb).toContain(
      'await ensureAdmin(request.auth);',
    );
    expect(sendMessage).toContain('return isCurrentAdmin(auth);');
    expect(createThread).toContain('return isCurrentAdmin(auth);');
    expect(sendMessage).not.toContain('function isTokenAdmin');
    expect(createThread).not.toContain('function isTokenAdmin');
  });

  it('does not treat an Admin role custom claim as Firestore business authority', () => {
    const adminStart = rules.indexOf('function isAdmin()');
    const tokenRoleStart = rules.indexOf('function tokenRole()');
    expect(adminStart).toBeGreaterThanOrEqual(0);
    expect(tokenRoleStart).toBeGreaterThan(adminStart);

    const adminBlock = rules.slice(adminStart, tokenRoleStart);
    expect(adminBlock).toContain('userIsActiveOrLegacy(request.auth.uid)');
    expect(adminBlock).toContain("userRole(request.auth.uid) == 'admin'");
    expect(adminBlock).not.toContain(
      "request.auth.token.role.lower() == 'admin'",
    );
  });

  it('requires current Firestore identity for generic portal role predicates', () => {
    for (const functionName of [
      'isFounder',
      'isSchoolAdmin',
      'isTeacher',
      'isParent',
      'isLP',
      'isKid',
    ]) {
      const start = rules.indexOf(`function ${functionName}()`);
      expect(start).toBeGreaterThanOrEqual(0);
      const end = rules.indexOf('\n    }', start);
      const block = rules.slice(start, end + 6);
      expect(block).toContain(
        'userIsActiveOrLegacy(request.auth.uid)',
      );
    }
  });
});
