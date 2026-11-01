import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import FacultyTrustLink from '../../components/programs/FacultyTrustLink';
import PublicTeacherProfilesSection, {
  AcademicLeadershipProfilesSection,
  TeacherTrainingFacultySection,
} from '../../pages/team/PublicTeacherProfilesSection';
import {
  APPROVED_ACADEMIC_LEADERSHIP_PROFILES,
  APPROVED_ACADEMIC_QUALITY_PHOTOS,
  APPROVED_PUBLIC_TEACHER_PROFILES,
  APPROVED_PUBLIC_TRAINER_PROFILES,
  TRAINING_FOCUS_AREAS,
  isApprovedPublicProfile,
} from '../../pages/team/publicTeacherProfiles';

describe('Academic faculty roster, consent controls and commercial page anchors', () => {
  it('defines training disciplines without inventing individual trainer headcounts', () => {
    expect(TRAINING_FOCUS_AREAS.map((area) => area.id)).toEqual([
      'phonics-reading',
      'grammar-speaking',
      'child-pedagogy',
      'teaching-quality',
    ]);
    expect(new Set(TRAINING_FOCUS_AREAS.map((area) => area.id)).size).toBe(TRAINING_FOCUS_AREAS.length);
  });

  it('requires every published person to have explicit consent and verifiable credentials', () => {
    const everyone = [
      ...APPROVED_ACADEMIC_LEADERSHIP_PROFILES,
      ...APPROVED_PUBLIC_TRAINER_PROFILES,
      ...APPROVED_PUBLIC_TEACHER_PROFILES,
    ];
    expect(new Set(everyone.map((person) => person.id)).size).toBe(everyone.length);
    for (const person of everyone) {
      expect(isApprovedPublicProfile(person)).toBe(true);
      expect(person.qualifications.every((degree) => degree.trim().length > 0)).toBe(true);
      if (person.photoPath) {
        expect(person.photoPath).toMatch(/^\/images\/team\/[a-z0-9-]+\.webp$/);
      }
      expect(Object.keys(person)).not.toContain('phone');
      expect(Object.keys(person)).not.toContain('email');
    }
    for (const teacher of APPROVED_PUBLIC_TEACHER_PROFILES) {
      expect(teacher.specialisms.length).toBeGreaterThan(0);
      expect(teacher.specialisms.every((subject) => ['phonics', 'grammar', 'public-speaking'].includes(subject))).toBe(true);
    }
    for (const trainer of APPROVED_PUBLIC_TRAINER_PROFILES) {
      expect(trainer.focusAreas.length).toBeGreaterThan(0);
      expect(trainer.focusAreas.every((area) => TRAINING_FOCUS_AREAS.some((item) => item.id === area))).toBe(true);
    }
    for (const photo of APPROVED_ACADEMIC_QUALITY_PHOTOS) {
      expect(photo.publicationApproved).toBe(true);
      expect(photo.alt.trim()).not.toBe('');
      expect(photo.photoPath).toMatch(/^\/images\/team\/[a-z0-9-]+\.webp$/);
    }
  });

  it('keeps direct links to all three real teacher section anchors', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <PublicTeacherProfilesSection />
      </MemoryRouter>,
    );
    expect(html).toContain('id="our-teachers"');
    expect(html).toContain('id="teachers-phonics"');
    expect(html).toContain('id="teachers-grammar"');
    expect(html).toContain('id="teachers-public-speaking"');
    expect(html).toContain('Meet our teachers and their qualifications');
  });

  it.each([
    ['phonics', '/team#teachers-phonics'],
    ['grammar', '/team#teachers-grammar'],
    ['speaking', '/team#teachers-public-speaking'],
  ] as const)('routes %s commercial pages to %s', (track, route) => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <FacultyTrustLink track={track} />
      </MemoryRouter>,
    );
    expect(html).toContain(`href="${route}"`);
  });

  it('renders leadership and weekly trainer-development evidence without fake people', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <AcademicLeadershipProfilesSection />
        <TeacherTrainingFacultySection />
      </MemoryRouter>,
    );
    expect(html).toContain('Weekly learning and coaching');
    expect(html).toContain('Phonics &amp; Reading');
    expect(html).toContain('Child Pedagogy &amp; Learning Methods');
    expect(html).toContain('internal professional development');
  });
});
