import { describe, expect, it } from 'vitest';

describe('teacher enquiries admin and public guardrails', () => {
  it('uses bounded one-shot admin reads instead of a realtime listener', async () => {
    const source = await import('./TeacherInquiriesWorkspace?raw').then(
      (module) => module.default as string,
    );

    expect(source).toContain("collection(db, 'teacherInquiries')");
    expect(source).toContain('limit(250)');
    expect(source).toContain('getDocs(');
    expect(source).not.toContain('onSnapshot(');
  });

  it('keeps the workflow deliberately minimal', async () => {
    const source = await import('./teacherInquiriesWorkflow?raw').then(
      (module) => module.default as string,
    );

    expect(source).toContain("'open' | 'admin_review' | 'closed'");
    expect(source).not.toContain('with_hr');
    expect(source).not.toContain('with_auditor');
    expect(source).not.toContain('mock_demo_pending');
    expect(source).toContain("{ value: 'selected', label: 'Selected & Closed' }");
    expect(source).toContain("{ value: 'not_selected', label: 'Not Selected & Closed' }");
  });

  it('saves public Careers applications without public admin fields', async () => {
    const source = await import('../public/CareersPage?raw').then(
      (module) => module.default as string,
    );

    expect(source).toContain("doc(collection(db, 'teacherInquiries'))");
    expect(source).toContain("stage: 'open'");
    expect(source).toContain("source: 'careers_page'");
    expect(source).not.toContain('adminNotes:');
    expect(source).not.toContain('finalStatus:');
  });
});
