import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('AVS historical class-session creation trigger routing', () => {
  const source = read(
    'functions/src/attendanceValidation/classSessionCreateDirtyTrigger.ts',
  );
  const index = read('functions/src/index.ts');

  it('listens only to classSession creates and exports the trigger', () => {
    expect(source).toContain('onDocumentCreated(');
    expect(source).toContain(
      "document: 'classSessions/{sessionId}'",
    );
    expect(index).toContain(
      'export { onAttendanceValidationHistoricalSessionCreated }',
    );
  });

  it('queues only already-completed historical service dates', () => {
    expect(source).toContain(
      'shouldMarkCreatedClassSessionDirty(',
    );
    expect(source).toContain(
      'eventDate(event.time)',
    );
    expect(source).toContain(
      "reason: 'historical_session_created'",
    );
    expect(source).toContain(
      'serviceDateYmd < currentIstYmd(now)',
    );
  });

  it('adds no operational collection read or mutation', () => {
    expect(source).not.toContain(".collection('classSessions')");
    expect(source).not.toContain('.get()');
    expect(source).not.toContain('.update(');
    expect(source).not.toContain("collection('billingCharges')");
    expect(source).not.toContain("collection('teacherEarnings')");
    expect(source).not.toContain("collection('payments')");
  });
});
