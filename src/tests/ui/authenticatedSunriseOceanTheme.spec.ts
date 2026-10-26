import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filename: string) => fs.readFileSync(path.join(process.cwd(), filename), 'utf8');

describe('Sunrise/Ocean authenticated workspace rollout', () => {
  it('keeps all five authenticated portal shells opted into shared surface tokens', () => {
    const roots = [
      'src/pages/admin/AdminDashboard.tsx',
      'src/pages/teacher/TeacherDashboard.tsx',
      'src/pages/parent/ParentDashboard.tsx',
      'src/pages/lp/LPDashboard.tsx',
      'src/pages/school/SchoolPortalFoundationPage.tsx',
    ];
    for (const root of roots) expect(read(root), root).toContain('ts-auth-surface');
  });

  it('defines one scoped token layer without forcing semantic colours onto descendants', () => {
    const css = read('src/index.css');
    for (const declaration of [
      '.ts-auth-surface {',
      '--ts-app-page: #F4F8FF',
      '--ts-app-ink: #17284C',
      '--ts-app-border: #D7E5F4',
      '--ts-app-purple: #604577',
      '--ts-app-accent: #C2410C',
      '.dark .ts-auth-surface {',
    ]) expect(css).toContain(declaration);
    expect(css).not.toContain('.ts-auth-surface * {');
    expect(css).not.toContain('.ts-auth-surface [class*="text-"]');
  });

  it('preserves payment and school-error severity cues while theming shells', () => {
    const school = read('src/pages/school/SchoolPortalFoundationPage.tsx');
    const admin = read('src/pages/admin/AdminDashboard.tsx');
    expect(school).toContain('border-red-200');
    expect(school).toContain('text-red-700');
    expect(admin).toContain('text-red-600');
    expect(read('src/pages/admin/components/Sidebar.tsx')).toContain('bg-[#212B5C]');
  });

  it('keeps the whole-source audit read-only and reviews all role roots', () => {
    const audit = read('scripts/audit-all-portal-colours.mjs');
    for (const portal of ['admin', 'teacher', 'parent', 'learningPartner', 'school']) {
      expect(audit).toContain(portal);
    }
    expect(audit).toContain('semanticExclusions');
    expect(audit).not.toMatch(/firebase deploy|setDoc\(|updateDoc\(|deleteDoc\(/);
  });
});
