import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (p: string) => fs.readFileSync(path.resolve(process.cwd(), p), 'utf8');
const curriculum = read('functions/src/phonicsCurriculumEnforcer.ts');
const notifications = read('functions/src/notifications/classReminders.ts');
const index = read('functions/src/index.ts');

describe('R5C2C21 grouped canonical Admin authorization', () => {
  it.each([
    ['curriculum', curriculum, './helpers/'],
    ['notifications', notifications, '../helpers/'],
  ])('%s uses canonical Admin and no legacy guard fallback', (_, code, root) => {
    expect(code).toContain(`from '${root}canonicalAdminGuard'`);
    expect(code).toContain('await ensureCanonicalAdmin(request.auth);');
    expect(code).not.toContain(`from '${root}adminGuard'`);
    expect(code).not.toContain('await ensureAdmin(request.auth);');
  });
  it('preserves curriculum callable and automatic correction trigger', () => {
    expect(curriculum).toContain('export const adminSyncCanonicalPhonicsCurriculum = onCall(');
    expect(curriculum).toContain('export const onCurriculumTopicsCanonicalize = onDocumentWritten(');
    expect(curriculum).toContain('ensureCanonicalPhonicsCurriculum({ source: \'firestore_guard\' })');
    expect(curriculum).toContain('phonicsCurriculumRevision: PHONICS_CURRICULUM_REVISION');
    expect(curriculum).toContain('{ merge: true }');
  });
  it('preserves notification token registration without an Admin requirement', () => {
    expect(notifications).toContain('export const registerNotificationToken = onCall(');
    expect(notifications).toContain("db.collection('notificationTokens')");
    expect(notifications).toContain('buildTokenDocId(token)');
    expect(notifications).toContain('export const sendTestPushNotification = onCall(');
    expect(notifications).toContain('sendPushToTokenDocs(');
  });
  it('retains all four deployed exports', () => {
    for (const name of [
      'adminSyncCanonicalPhonicsCurriculum',
      'onCurriculumTopicsCanonicalize',
      'registerNotificationToken',
      'sendTestPushNotification',
    ]) expect(index).toContain(name);
  });
});
