import { FormEvent, useEffect, useState } from 'react';

import { Button } from '@components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { Input } from '@components/ui/input';

import type {
  SchoolDirectoryUser,
  SchoolFormFields,
  SchoolRecord,
  SchoolStatus,
} from '../../../types/School';

const NONE = '__none__';

export interface SchoolFormSubmitPayload extends SchoolFormFields {
  learningPartnerId?: string | null;
  schoolAdminUserId?: string | null;
}

interface SchoolFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  school?: SchoolRecord | null;
  learningPartners: SchoolDirectoryUser[];
  schoolAdmins: SchoolDirectoryUser[];
  onSubmit: (payload: SchoolFormSubmitPayload) => Promise<void>;
}

const emptyFields = (): SchoolFormFields => ({
  name: '',
  status: 'active',
  contactName: '',
  contactDesignation: '',
  contactEmail: '',
  contactPhone: '',
  city: '',
  state: '',
  country: 'India',
});

export default function SchoolFormDialog({
  open,
  onOpenChange,
  mode,
  school,
  learningPartners,
  schoolAdmins,
  onSubmit,
}: SchoolFormDialogProps) {
  const [fields, setFields] = useState<SchoolFormFields>(emptyFields);
  const [learningPartnerId, setLearningPartnerId] = useState(NONE);
  const [schoolAdminUserId, setSchoolAdminUserId] = useState(NONE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;

    if (mode === 'edit' && school) {
      setFields({
        name: school.name,
        status: school.status,
        contactName: school.contact.name,
        contactDesignation: school.contact.designation || '',
        contactEmail: school.contact.email || '',
        contactPhone: school.contact.phone || '',
        city: school.location.city || '',
        state: school.location.state || '',
        country: school.location.country || 'India',
      });
    } else {
      setFields(emptyFields());
      setLearningPartnerId(NONE);
      setSchoolAdminUserId(NONE);
    }

    setError('');
    setSubmitting(false);
  }, [mode, open, school]);

  const updateField = <K extends keyof SchoolFormFields>(
    key: K,
    value: SchoolFormFields[K],
  ) => setFields((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    const name = fields.name.trim();
    const contactName = fields.contactName.trim();
    if (!name || !contactName) {
      setError('School name and contact person name are required.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const payload: SchoolFormSubmitPayload = {
        name,
        status: fields.status,
        contactName,
        contactDesignation: fields.contactDesignation.trim(),
        contactEmail: fields.contactEmail.trim(),
        contactPhone: fields.contactPhone.trim(),
        city: fields.city.trim(),
        state: fields.state.trim(),
        country: fields.country.trim() || 'India',
      };

      if (mode === 'create') {
        const canAssignInitialAccess = fields.status !== 'archived';
        payload.learningPartnerId =
          canAssignInitialAccess && learningPartnerId !== NONE
            ? learningPartnerId
            : null;
        payload.schoolAdminUserId =
          canAssignInitialAccess && schoolAdminUserId !== NONE
            ? schoolAdminUserId
            : null;
      }

      await onSubmit(payload);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to save the school. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const activeSchoolAdmins = schoolAdmins.filter(
    (user) => user.status.trim().toLowerCase() === 'active',
  );
  const archivedCreate = mode === 'create' && fields.status === 'archived';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create School' : 'Edit School'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Register a partner school and optionally link existing users.'
              : 'Update the school profile. Manage access separately.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="School name" required>
              <Input
                value={fields.name}
                onChange={(event) => updateField('name', event.target.value)}
                required
              />
            </Field>
            <Field label="Status">
              <select
                value={fields.status}
                onChange={(event) =>
                  updateField('status', event.target.value as SchoolStatus)
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
            <Field label="Contact person name" required>
              <Input
                value={fields.contactName}
                onChange={(event) => updateField('contactName', event.target.value)}
                required
              />
            </Field>
            <Field label="Designation">
              <Input
                value={fields.contactDesignation}
                onChange={(event) => updateField('contactDesignation', event.target.value)}
              />
            </Field>
            <Field label="Contact email">
              <Input
                type="email"
                value={fields.contactEmail}
                onChange={(event) => updateField('contactEmail', event.target.value)}
              />
            </Field>
            <Field label="Contact phone">
              <Input
                value={fields.contactPhone}
                onChange={(event) => updateField('contactPhone', event.target.value)}
              />
            </Field>
            <Field label="City">
              <Input
                value={fields.city}
                onChange={(event) => updateField('city', event.target.value)}
              />
            </Field>
            <Field label="State">
              <Input
                value={fields.state}
                onChange={(event) => updateField('state', event.target.value)}
              />
            </Field>
            <Field label="Country">
              <Input
                value={fields.country}
                onChange={(event) => updateField('country', event.target.value)}
              />
            </Field>
          </div>

          {mode === 'create' && (
            <div className="grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
              <Field label="Initial Learning Partner">
                <select
                  value={learningPartnerId}
                  onChange={(event) => setLearningPartnerId(event.target.value)}
                  disabled={archivedCreate}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value={NONE}>Not assigned</option>
                  {learningPartners.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}{user.email ? ` — ${user.email}` : ''}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Initial School Admin login">
                <select
                  value={schoolAdminUserId}
                  onChange={(event) => setSchoolAdminUserId(event.target.value)}
                  disabled={archivedCreate}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value={NONE}>Not linked</option>
                  {activeSchoolAdmins.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}{user.email ? ` — ${user.email}` : ''}
                    </option>
                  ))}
                </select>
              </Field>
              {archivedCreate && (
                <p className="text-sm text-amber-700 sm:col-span-2">
                  Archived schools are created without active access assignments. Restore the school before assigning a Learning Partner or School Admin login.
                </p>
              )}
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm text-red-600">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : mode === 'create' ? 'Create School' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1.5 text-sm font-medium text-slate-700">
      <span>{label}{required ? ' *' : ''}</span>
      {children}
    </label>
  );
}
