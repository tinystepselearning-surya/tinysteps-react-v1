import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Wave 1 R4 createStudentForParent canonical cutover', () => {
  const source = readFileSync(
    'src/parentStudents.ts',
    'utf8',
  );

  it('delegates learner creation to the canonical-primary writer', () => {
    expect(source).toContain(
      'executeCanonicalLearnerCreate',
    );
    expect(source).toContain(
      'nestedParentStudentCompatibility',
    );
    expect(source).toContain(
      "status: 'active'",
    );
  });

  it('does not directly create nested or kids Firestore documents', () => {
    expect(source).not.toContain('studentRef.set(');
    expect(source).not.toContain(
      "collection('students').doc()",
    );
    expect(source).not.toContain(
      "collection('kids').doc()",
    );
    expect(source).not.toContain(
      'FieldValue.serverTimestamp',
    );
  });

  it('fails closed instead of guessing trial/inactive canonical status', () => {
    expect(source).toContain(
      'does not yet have an approved canonical mapping',
    );
    expect(source).toContain(
      "'failed-precondition'",
    );
  });

  it('privacy-tokenizes new success/error telemetry', () => {
    expect(source).toContain(
      'canonicalIdentityTelemetryToken',
    );
    expect(source).not.toContain(
      'callerUid:',
    );
    expect(source).not.toContain(
      'requestedParentId:',
    );
  });

  it('keeps learner private profiles server-only under current rules', () => {
    const rules = readFileSync(
      '../firestore.rules',
      'utf8',
    );

    expect(rules).not.toContain(
      'match /learnerPrivateProfiles/',
    );
  });
});
