import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '../../..');
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('closed teacher recruitment', () => {
  it('removes active JobPosting structured data from HTML and React SEO', () => {
    const indexHtml = read('index.html');
    const careersSource = read('src/pages/public/CareersPage.tsx');
    expect(indexHtml).not.toContain("if (pathname !== '/careers') return;");
    expect(indexHtml).not.toContain("'@type': 'JobPosting'");
    expect(careersSource).not.toContain("'@type': 'JobPosting'");
    expect(careersSource).not.toContain('directApply: true');
    expect(careersSource).toContain('jsonLd: [faqSchema, breadcrumbSchema]');
  });

  it('shows a clear closing date and removes all public application routes', () => {
    const careersSource = read('src/pages/public/CareersPage.tsx');
    const headerSource = read('src/components/common/Header.tsx');
    const seoRegistry = read('src/lib/routeSeoRegistry.js');
    const rules = read('firestore.rules');
    expect(careersSource).toContain('11 October 2026');
    expect(careersSource).toContain('Teacher Recruitment Closed');
    expect(careersSource).not.toContain('CareerApplicationForm');
    expect(careersSource).not.toContain('wa.me/');
    expect(careersSource).not.toContain("collection(db, 'teacherInquiries')");
    expect(headerSource).toContain('disabled={isCareersPage}');
    expect(headerSource).toContain('Recruitment Closed');
    expect(seoRegistry).toContain('Teacher Recruitment Closed');
    expect(rules).toContain('allow create: if isAdmin();');
  });
});
