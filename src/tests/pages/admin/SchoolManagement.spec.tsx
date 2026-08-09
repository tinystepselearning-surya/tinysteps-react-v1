import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SchoolManagement from '../../../pages/admin/SchoolManagement/SchoolManagement';

const {
  listSchoolsMock,
  listMembershipsMock,
  listDirectoryMock,
} = vi.hoisted(() => ({
  listSchoolsMock: vi.fn(),
  listMembershipsMock: vi.fn(),
  listDirectoryMock: vi.fn(),
}));

vi.mock('../../../services/schoolService', () => ({
  listSchoolsForAdmin: listSchoolsMock,
  listSchoolUsersForAdmin: listMembershipsMock,
  listSchoolDirectoryUsersForAdmin: listDirectoryMock,
  createSchool: vi.fn(),
  updateSchool: vi.fn(),
  assignSchoolLearningPartner: vi.fn(),
  linkSchoolUser: vi.fn(),
  unlinkSchoolUser: vi.fn(),
}));

describe('SchoolManagement', () => {
  beforeEach(() => {
    listSchoolsMock.mockResolvedValue([
      {
        id: 'school-a',
        schemaVersion: 1,
        schoolCode: 'TS-SCHOOLA',
        name: 'School A',
        nameSearch: 'school a',
        status: 'archived',
        contact: {
          name: 'Principal A',
          designation: 'Principal',
          email: 'principal@example.com',
          phone: null,
        },
        location: {
          city: 'Hyderabad',
          state: 'Telangana',
          country: 'India',
        },
        learningPartnerId: 'lp-1',
        learningPartnerName: 'LP One',
        learningPartnerEmail: 'lp@example.com',
      },
    ]);
    listMembershipsMock.mockResolvedValue([]);
    listDirectoryMock.mockResolvedValue([]);
  });

  it('renders school operations data and the create action', async () => {
    render(<SchoolManagement />);

    expect(await screen.findByText('School A')).toBeInTheDocument();
    expect(screen.getByText('LP One')).toBeInTheDocument();
    expect(screen.getAllByText('archived').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Create School' })).toBeInTheDocument();
  });

  it('contains no direct Firestore school mutation calls', () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        'src/pages/admin/SchoolManagement/SchoolManagement.tsx',
      ),
      'utf8',
    );

    expect(source).not.toMatch(/\b(setDoc|updateDoc|deleteDoc)\b/);
  });
});
