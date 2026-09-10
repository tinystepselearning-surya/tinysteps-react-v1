import fs from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LeadHero } from '../../components/marketing/LeadPageSections';

const repoRoot = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('course and curriculum parent-facing cleanup', () => {
  it('removes the legacy trust aside at its course-detail source', () => {
    const courseDetail = read('src/pages/CourseDetailPage.tsx');

    for (const legacyCopy of ['Parent trust', 'Pricing trust', 'Delivery model']) {
      expect(courseDetail).not.toContain(legacyCopy);
    }

    expect(courseDetail).not.toMatch(/\baside=\{/);
    expect(courseDetail).toContain("label: 'Countries reached'");
    expect(courseDetail).toContain("label: 'Program format'");
  });

  it('keeps LeadHero generic and renders caller-provided aside content normally', () => {
    const leadHero = read('src/components/marketing/LeadPageSections.tsx');

    expect(leadHero).not.toContain('getNodeText');
    expect(leadHero).not.toContain('isLegacyInternalTrustAside');
    expect(leadHero).not.toContain('visibleAside');

    render(
      <LeadHero
        eyebrow="Course"
        title="A clear learning path"
        description="Choose the level that fits."
        aside={<div>Useful course comparison</div>}
      />,
    );

    expect(screen.getByText('Useful course comparison')).toBeInTheDocument();
  });

  it('does not render an empty hero sidebar when no aside or stats are supplied', () => {
    const { container } = render(
      <LeadHero eyebrow="Course" title="A clear learning path" description="Choose the level that fits." />,
    );

    expect(container.querySelector('.space-y-4')).not.toBeInTheDocument();
    expect(container.querySelector('.lg\\:grid-cols-1')).toBeInTheDocument();
  });

  it('keeps the courses and curriculum hubs focused on parent decisions', () => {
    const courses = read('src/pages/CoursesPage.tsx');
    const curriculum = read('src/pages/CurriculumPage.tsx');

    expect(courses).toContain('Find the Right English Course for Your Child');
    expect(courses).toContain('View Curriculum Roadmap');
    expect(curriculum).toContain('The complete Tiny Steps learning roadmap');
    expect(curriculum).toContain("name: 'Advanced Grammar'");

    for (const internalLabel of ['Parent trust', 'Pricing trust', 'Delivery model']) {
      expect(courses).not.toContain(internalLabel);
      expect(curriculum).not.toContain(internalLabel);
    }
  });
});
