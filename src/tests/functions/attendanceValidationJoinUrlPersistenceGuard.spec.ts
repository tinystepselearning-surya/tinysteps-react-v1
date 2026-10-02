import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('AVS enrollment join URL fallback persistence guard', () => {
  const unified = read(
    'functions/src/attendanceValidation/runValidationCallable.ts',
  );
  const forceFresh = read(
    'functions/src/attendanceValidation/forceFreshEvidenceCallable.ts',
  );
  const cached = read(
    'functions/src/attendanceValidation/cachedGroupRevalidationCallable.ts',
  );
  const persistence = read(
    'functions/src/attendanceValidation/groupValidation.ts',
  );

  it('keeps raw Firestore rows separate from validation-only URL enrichment in Run Validation', () => {
    expect(unified).toContain(
      'const persistenceRows = rows.map((row) => ({ id: row.id, data: row.data }));',
    );
    expect(
      unified.indexOf('const persistenceRows = rows.map'),
    ).toBeLessThan(
      unified.indexOf('row.data = joinUrlResolution.session'),
    );
    expect(unified).toContain(
      'persistAvsGroupCases(db, persistenceRows, cases)',
    );
    expect(unified).not.toContain(
      'persistAvsGroupCases(db, rows, cases)',
    );
  });

  it('keeps raw Firestore rows separate from validation-only URL enrichment in force-fresh', () => {
    expect(forceFresh).toContain(
      'const persistenceRows = rows.map((row) => ({ id: row.id, data: row.data }));',
    );
    expect(
      forceFresh.indexOf('const persistenceRows = rows.map'),
    ).toBeLessThan(
      forceFresh.indexOf('row.data = joinUrlResolution.session'),
    );
    expect(forceFresh).toContain(
      'persistAvsGroupCases(db, persistenceRows, cases)',
    );
    expect(forceFresh).not.toContain(
      'persistAvsGroupCases(db, rows, cases)',
    );
  });

  it('keeps raw Firestore rows for cached revalidation persistence', () => {
    expect(cached).toContain(
      'const persistenceRows = rows.map((row) => ({ id: row.id, data: row.data }));',
    );
    expect(
      cached.indexOf('const persistenceRows = rows.map'),
    ).toBeLessThan(
      cached.indexOf('row.data = joinUrlResolution.session'),
    );
    expect(cached).toContain(
      'persistAvsGroupCases(db, persistenceRows, result.cases)',
    );
    expect(cached).not.toContain(
      'persistAvsGroupCases(db, rows, result.cases)',
    );
  });

  it('retains the exact concurrency guard against genuine operational changes', () => {
    expect(persistence).toContain(
      '!isDeepStrictEqual(doc.data(), rows[index].data)',
    );
    expect(persistence).toContain(
      "throw new HttpsError('aborted', 'Attendance changed during validation. Run Validation again.')",
    );
  });
});
