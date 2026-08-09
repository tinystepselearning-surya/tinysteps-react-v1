import { useEffect, useMemo, useState } from 'react';

import { Button } from '@components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { Badge } from '@components/ui/badge';
import { useToast } from '@components/hooks/use-toast';

import {
  assignSchoolLearningPartner,
  linkSchoolUser,
  unlinkSchoolUser,
} from '../../../services/schoolService';
import type {
  SchoolDirectoryUser,
  SchoolRecord,
  SchoolUserAccess,
} from '../../../types/School';

const NONE = '__none__';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  school: SchoolRecord | null;
  learningPartners: SchoolDirectoryUser[];
  schoolAdmins: SchoolDirectoryUser[];
  memberships: SchoolUserAccess[];
  onChanged: () => Promise<void>;
}

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Please try again.';

export default function SchoolAccessDialog({
  open,
  onOpenChange,
  school,
  learningPartners,
  schoolAdmins,
  memberships,
  onChanged,
}: Props) {
  const { toast } = useToast();
  const [selectedLpId, setSelectedLpId] = useState(NONE);
  const [selectedAdminId, setSelectedAdminId] = useState(NONE);
  const [savingLp, setSavingLp] = useState(false);
  const [linking, setLinking] = useState(false);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelectedLpId(school?.learningPartnerId || NONE);
    setSelectedAdminId(NONE);
  }, [open, school]);

  const linkedMemberships = useMemo(
    () =>
      school
        ? memberships.filter((membership) =>
            membership.schoolIds.includes(school.id),
          )
        : [],
    [memberships, school],
  );
  const linkedIds = useMemo(
    () => new Set(linkedMemberships.map((membership) => membership.userId)),
    [linkedMemberships],
  );
  const directoryById = useMemo(
    () => new Map(schoolAdmins.map((user) => [user.id, user])),
    [schoolAdmins],
  );
  const availableAdmins = schoolAdmins.filter(
    (user) =>
      user.status.trim().toLowerCase() === 'active' && !linkedIds.has(user.id),
  );

  if (!school) return null;
  const archived = school.status === 'archived';

  const handleSaveLp = async () => {
    setSavingLp(true);
    try {
      await assignSchoolLearningPartner({
        schoolId: school.id,
        learningPartnerId: selectedLpId === NONE ? null : selectedLpId,
      });
      await onChanged();
      toast({ title: 'Learning Partner assignment updated' });
    } catch (error) {
      toast({
        title: 'Unable to update Learning Partner',
        description: errorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setSavingLp(false);
    }
  };

  const handleLink = async () => {
    if (selectedAdminId === NONE) return;
    setLinking(true);
    try {
      await linkSchoolUser({
        schoolId: school.id,
        userId: selectedAdminId,
        makePrimary: true,
      });
      await onChanged();
      setSelectedAdminId(NONE);
      toast({ title: 'School Admin linked' });
    } catch (error) {
      toast({
        title: 'Unable to link School Admin',
        description: errorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async (userId: string) => {
    if (!window.confirm('Unlink this School Admin from the school?')) return;
    setUnlinkingId(userId);
    try {
      await unlinkSchoolUser({ schoolId: school.id, userId });
      await onChanged();
      toast({ title: 'School Admin unlinked' });
    } catch (error) {
      toast({
        title: 'Unable to unlink School Admin',
        description: errorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setUnlinkingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Access — {school.name}</DialogTitle>
          <DialogDescription>
            Assign the current Learning Partner and link existing School Admin logins.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <section className="space-y-3 rounded-xl border border-slate-200 p-4">
            <div>
              <h3 className="font-semibold text-slate-900">Learning Partner</h3>
              <p className="text-sm text-slate-500">
                Current: {school.learningPartnerName || 'Not assigned'}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={selectedLpId}
                onChange={(event) => setSelectedLpId(event.target.value)}
                disabled={archived || savingLp}
                className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value={NONE}>Not assigned</option>
                {learningPartners.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}{user.email ? ` — ${user.email}` : ''}
                  </option>
                ))}
              </select>
              <Button onClick={handleSaveLp} disabled={archived || savingLp}>
                {savingLp ? 'Saving…' : 'Save Assignment'}
              </Button>
            </div>
            {archived && (
              <p className="text-sm text-amber-700">
                Restore this school before changing access.
              </p>
            )}
          </section>

          <section className="space-y-3 rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900">School Admin logins</h3>
            {linkedMemberships.length === 0 ? (
              <p className="text-sm text-slate-500">No School Admin logins are linked.</p>
            ) : (
              <div className="space-y-2">
                {linkedMemberships.map((membership) => {
                  const user = directoryById.get(membership.userId);
                  return (
                    <div
                      key={membership.userId}
                      className="flex flex-col gap-2 rounded-lg bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-slate-900">
                            {user?.name || membership.userId}
                          </p>
                          {membership.primarySchoolId === school.id && (
                            <Badge variant="outline">Primary</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">{user?.email || 'Email unavailable'}</p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={unlinkingId === membership.userId}
                        onClick={() => handleUnlink(membership.userId)}
                      >
                        {unlinkingId === membership.userId ? 'Unlinking…' : 'Unlink'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col gap-2 border-t border-slate-200 pt-3 sm:flex-row">
              <select
                value={selectedAdminId}
                onChange={(event) => setSelectedAdminId(event.target.value)}
                disabled={archived || linking}
                className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value={NONE}>Select School Admin</option>
                {availableAdmins.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}{user.email ? ` — ${user.email}` : ''}
                  </option>
                ))}
              </select>
              <Button
                onClick={handleLink}
                disabled={archived || linking || selectedAdminId === NONE}
              >
                {linking ? 'Linking…' : 'Link School Admin'}
              </Button>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
