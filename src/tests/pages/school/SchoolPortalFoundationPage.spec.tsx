import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SchoolPortalFoundationPage from '../../../pages/school/SchoolPortalFoundationPage';
import useAuthStore from '../../../store/useAuthStore';
import type { SchoolPortalAccess, SchoolRecord } from '../../../types/School';

const { getSchoolPortalAccessMock } = vi.hoisted(() => ({
  getSchoolPortalAccessMock: vi.fn(),
}));

vi.mock('../../../services/schoolService', () => ({
  getSchoolPortalAccess: getSchoolPortalAccessMock,
}));

const school = (overrides: Partial<SchoolRecord> = {}): SchoolRecord => ({
  id: 'school-a',
  schemaVersion: 1,
  schoolCode: 'TS-SCHOOLA',
  name: 'School A',
  nameSearch: 'school a',
  status: 'active',
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
  ...overrides,
});

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SchoolPortalFoundationPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('SchoolPortalFoundationPage', () => {
  beforeEach(() => {
    getSchoolPortalAccessMock.mockReset();
    useAuthStore.setState({
      user: {
        uid: 'school-admin-1',
        email: 'principal@example.com',
        displayName: 'Principal',
        role: 'schoolAdmin',
      },
      authStatus: 'authenticated',
      isLoading: false,
    });
  });

  it('shows the assignment-pending state when membership is absent', async () => {
    getSchoolPortalAccessMock.mockResolvedValue({
      access: null,
      schools: [],
      primarySchool: null,
    } satisfies SchoolPortalAccess);

    renderPage();

    expect(
      await screen.findByText(/a school has not been assigned to this login yet/i),
    ).toBeInTheDocument();
  });

  it('shows the primary school and assigned Learning Partner', async () => {
    const primarySchool = school();
    getSchoolPortalAccessMock.mockResolvedValue({
      access: {
        userId: 'school-admin-1',
        role: 'schoolAdmin',
        schoolIds: ['school-a'],
        primarySchoolId: 'school-a',
        status: 'active',
      },
      schools: [primarySchool],
      primarySchool,
    } satisfies SchoolPortalAccess);

    renderPage();

    expect(await screen.findByText('School A')).toBeInTheDocument();
    expect(screen.getByText('LP One')).toBeInTheDocument();
  });

  it('shows an unassigned Learning Partner state', async () => {
    const primarySchool = school({
      learningPartnerId: null,
      learningPartnerName: null,
      learningPartnerEmail: null,
    });
    getSchoolPortalAccessMock.mockResolvedValue({
      access: {
        userId: 'school-admin-1',
        role: 'schoolAdmin',
        schoolIds: ['school-a'],
        primarySchoolId: 'school-a',
        status: 'active',
      },
      schools: [primarySchool],
      primarySchool,
    } satisfies SchoolPortalAccess);

    renderPage();

    expect(await screen.findByText('Not assigned yet')).toBeInTheDocument();
  });

  it('shows linked school count and remains read-only', async () => {
    const primarySchool = school();
    const secondSchool = school({
      id: 'school-b',
      schoolCode: 'TS-SCHOOLB',
      name: 'School B',
      nameSearch: 'school b',
    });
    getSchoolPortalAccessMock.mockResolvedValue({
      access: {
        userId: 'school-admin-1',
        role: 'schoolAdmin',
        schoolIds: ['school-a', 'school-b'],
        primarySchoolId: 'school-a',
        status: 'active',
      },
      schools: [primarySchool, secondSchool],
      primarySchool,
    } satisfies SchoolPortalAccess);

    renderPage();

    expect(await screen.findByText('Linked campuses/schools: 2')).toBeInTheDocument();
    expect(screen.getByText('School B')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
