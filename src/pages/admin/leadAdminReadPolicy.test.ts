import { describe, expect, it } from 'vitest';

/**
 * Guardrails for the Leads & Enquiries recovery-tools implementation.
 * These tests intentionally inspect the source because the cost-control contract is
 * architectural: no eager teacher listener, communications load on demand, and the
 * correction path stays callable-only rather than becoming a background trigger.
 */

describe('Leads admin read/write guardrails', () => {
  it('keeps the teacher directory lazy and one-shot', async () => {
    const source = await import('./LeadsInquiriesWorkspaceV2?raw').then((module) => module.default as string);
    expect(source).toContain("getDocs(query(collection(db, 'users'), where('role', '==', 'teacher')))" );
    expect(source).not.toContain("onSnapshot(\n      teachersQuery");
    expect(source).toContain('Teacher options load only when this dialog is opened');
  });

  it('keeps communications on demand instead of subscribing in the page', async () => {
    const source = await import('../../services/leadCommunicationsService?raw').then((module) => module.default as string);
    expect(source).toContain('getDocs(');
    expect(source).toContain('limit(safeLimit)');
    expect(source).not.toContain('onSnapshot(');
  });
});
