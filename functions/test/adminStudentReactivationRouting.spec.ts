import fs from 'node:fs';
import path from 'node:path';
import {
  describe,
  expect,
  it,
} from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

const learnerSource = read(
  'functions/src/schoolOS/identity/canonicalPrimaryLearnerUpdate.ts',
);
const callableSource = read(
  'functions/src/adminUpdateStudent.ts',
);

describe('Archived student reactivation routing', () => {
  it('requires explicit reactivation intent for archived canonical learners', () => {
    expect(learnerSource).toContain(
      "input.reactivateArchived === true",
    );
    expect(learnerSource).toContain(
      "fields.status === 'active'",
    );
    expect(learnerSource).toContain(
      "currentStatus === 'archived'",
    );
    expect(learnerSource).toContain(
      "compatibilityStatus === 'archived'",
    );
    expect(learnerSource).toContain(
      'Boolean(kidData.archivedAt)',
    );
  });

  it('clears stale child archive evidence during explicit reactivation', () => {
    expect(learnerSource).toContain(
      'archivedAt: FieldValue.delete()',
    );
    expect(learnerSource).toContain(
      'archivedBy: FieldValue.delete()',
    );
    expect(learnerSource).toContain(
      'archivedReason: FieldValue.delete()',
    );
    expect(learnerSource).toContain(
      'isArchived: FieldValue.delete()',
    );
    expect(learnerSource).toContain(
      'reactivatedAt: now',
    );
    expect(learnerSource).toContain(
      'reactivatedBy: actorId',
    );
  });

  it('routes the explicit reactivation flag through adminUpdateStudent', () => {
    expect(callableSource).toContain(
      'reactivate?: boolean;',
    );
    expect(callableSource).toContain(
      'reactivateArchived:',
    );
    expect(callableSource).toContain(
      'data.reactivate === true',
    );
  });
});
