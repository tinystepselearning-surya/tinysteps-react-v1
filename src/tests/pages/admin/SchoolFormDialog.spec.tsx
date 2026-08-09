import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SchoolFormDialog from '../../../pages/admin/SchoolManagement/SchoolFormDialog';

const learningPartners = [
  {
    id: 'lp-1',
    name: 'Learning Partner One',
    email: 'lp@example.com',
    role: 'learningPartner' as const,
    status: 'active',
  },
];

const schoolAdmins = [
  {
    id: 'school-admin-1',
    name: 'Principal One',
    email: 'principal@example.com',
    role: 'schoolAdmin' as const,
    status: 'active',
  },
];

describe('SchoolFormDialog', () => {
  it('drops initial access assignments when creating an archived school', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <SchoolFormDialog
        open
        onOpenChange={vi.fn()}
        mode="create"
        learningPartners={learningPartners}
        schoolAdmins={schoolAdmins}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText('School name *'), {
      target: { value: 'Archived Partner School' },
    });
    fireEvent.change(screen.getByLabelText('Contact person name *'), {
      target: { value: 'Principal A' },
    });

    const lpSelect = screen.getByLabelText('Initial Learning Partner');
    const adminSelect = screen.getByLabelText('Initial School Admin login');

    fireEvent.change(lpSelect, { target: { value: 'lp-1' } });
    fireEvent.change(adminSelect, {
      target: { value: 'school-admin-1' },
    });

    fireEvent.change(screen.getByLabelText('Status'), {
      target: { value: 'archived' },
    });

    expect(lpSelect).toBeDisabled();
    expect(adminSelect).toBeDisabled();
    expect(
      screen.getByText(
        /archived schools are created without active access assignments/i,
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Create School' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Archived Partner School',
        status: 'archived',
        contactName: 'Principal A',
        learningPartnerId: null,
        schoolAdminUserId: null,
      }),
    );
  });
});
