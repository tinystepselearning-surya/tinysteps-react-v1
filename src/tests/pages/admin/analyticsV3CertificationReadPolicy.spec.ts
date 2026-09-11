import { describe, expect, it } from 'vitest';

describe('Analytics V3 Brick 8 read policy', () => {
  it('keeps certification purely in-memory with no Firestore query path', async () => {
    const section = await import('../../../pages/admin/AnalyticsV3CertificationSection?raw')
      .then((module) => module.default as string);
    const core = await import('../../../pages/admin/analyticsV3Certification?raw')
      .then((module) => module.default as string);

    for (const source of [section, core]) {
      expect(source).not.toContain("from 'firebase/firestore'");
      expect(source).not.toContain('getDocs(');
      expect(source).not.toContain('onSnapshot(');
      expect(source).not.toContain('collection(');
    }
  });

  it('reuses the existing Growth snapshots and excludes the certification panel from summary mode', async () => {
    const manager = await import('../../../pages/admin/DemoSessionsManagement?raw')
      .then((module) => module.default as string);

    expect(manager).toContain('leads={resolvedLeads}');
    expect(manager).toContain('demos={resolvedDemos}');
    expect(manager).toContain("variant === 'full'");
    expect(manager).toContain('<AnalyticsV3CertificationSection');
  });
});
