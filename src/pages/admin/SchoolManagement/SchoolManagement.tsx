import { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, Plus } from 'lucide-react';

import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui/table';
import { useToast } from '@components/hooks/use-toast';

import {
  createSchool,
  listSchoolDirectoryUsersForAdmin,
  listSchoolsForAdmin,
  listSchoolUsersForAdmin,
  updateSchool,
} from '../../../services/schoolService';
import type {
  SchoolDirectoryUser,
  SchoolRecord,
  SchoolUserAccess,
} from '../../../types/School';
import SchoolAccessDialog from './SchoolAccessDialog';
import SchoolFormDialog, {
  type SchoolFormSubmitPayload,
} from './SchoolFormDialog';

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Please try again.';

const statusVariant = (status: SchoolRecord['status']) => {
  if (status === 'active') return 'default' as const;
  if (status === 'archived') return 'secondary' as const;
  return 'outline' as const;
};

export default function SchoolManagement() {
  const { toast } = useToast();
  const [schools, setSchools] = useState<SchoolRecord[]>([]);
  const [memberships, setMemberships] = useState<SchoolUserAccess[]>([]);
  const [directoryUsers, setDirectoryUsers] = useState<SchoolDirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<SchoolRecord | null>(null);
  const [accessSchool, setAccessSchool] = useState<SchoolRecord | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [nextSchools, nextMemberships, nextDirectoryUsers] =
        await Promise.all([
          listSchoolsForAdmin(),
          listSchoolUsersForAdmin(),
          listSchoolDirectoryUsersForAdmin(),
        ]);

      setSchools(nextSchools);
      setMemberships(nextMemberships);
      setDirectoryUsers(nextDirectoryUsers);
      setAccessSchool((current) =>
        current
          ? nextSchools.find((school) => school.id === current.id) || null
          : null,
      );
    } catch (error) {
      toast({
        title: 'Unable to load School Partnerships',
        description: errorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const learningPartners = useMemo(
    () =>
      directoryUsers.filter(
        (user) =>
          user.role === 'learningPartner' &&
          user.status.trim().toLowerCase() === 'active',
      ),
    [directoryUsers],
  );
  const schoolAdmins = useMemo(
    () => directoryUsers.filter((user) => user.role === 'schoolAdmin'),
    [directoryUsers],
  );
  const summary = useMemo(
    () => ({
      total: schools.length,
      active: schools.filter((school) => school.status === 'active').length,
      paused: schools.filter((school) => school.status === 'paused').length,
      archived: schools.filter((school) => school.status === 'archived').length,
    }),
    [schools],
  );

  const handleCreate = async (payload: SchoolFormSubmitPayload) => {
    await createSchool({
      name: payload.name,
      status: payload.status,
      contactName: payload.contactName,
      contactDesignation: payload.contactDesignation,
      contactEmail: payload.contactEmail,
      contactPhone: payload.contactPhone,
      city: payload.city,
      state: payload.state,
      country: payload.country,
      learningPartnerId: payload.learningPartnerId,
      schoolAdminUserIds: payload.schoolAdminUserId
        ? [payload.schoolAdminUserId]
        : [],
    });
    await refresh();
    setCreateOpen(false);
    toast({ title: 'School created' });
  };

  const handleEdit = async (payload: SchoolFormSubmitPayload) => {
    if (!editingSchool) return;
    await updateSchool({
      schoolId: editingSchool.id,
      name: payload.name,
      status: payload.status,
      contactName: payload.contactName,
      contactDesignation: payload.contactDesignation,
      contactEmail: payload.contactEmail,
      contactPhone: payload.contactPhone,
      city: payload.city,
      state: payload.state,
      country: payload.country,
    });
    await refresh();
    setEditingSchool(null);
    toast({ title: 'School updated' });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" aria-hidden="true" />
            <h1 className="text-2xl font-bold text-slate-900">School Partnerships</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Manage partner school identity, access, and Learning Partner ownership.
          </p>
        </div>
        <Button
          className="gap-2"
          aria-label="Create School"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create School
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Total Schools', summary.total],
          ['Active', summary.active],
          ['Paused', summary.paused],
          ['Archived', summary.archived],
        ].map(([label, value]) => (
          <Card key={label} className="p-4">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading schools…</div>
        ) : schools.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No partner schools have been created yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[1100px]">
              <TableHeader>
                <TableRow>
                  <TableHead>School</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Learning Partner</TableHead>
                  <TableHead>School Admins</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schools.map((school) => {
                  const adminCount = memberships.filter((membership) =>
                    membership.schoolIds.includes(school.id),
                  ).length;
                  const location = [school.location.city, school.location.state]
                    .filter(Boolean)
                    .join(', ');

                  return (
                    <TableRow key={school.id}>
                      <TableCell>
                        <p className="font-semibold text-slate-900">{school.name}</p>
                        <p className="text-xs text-slate-500">{school.schoolCode}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-slate-800">{school.contact.name}</p>
                        {school.contact.designation && (
                          <p className="text-xs text-slate-500">{school.contact.designation}</p>
                        )}
                        {school.contact.email && (
                          <p className="text-xs text-slate-500">{school.contact.email}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-slate-800">{location || 'Not provided'}</p>
                        <p className="text-xs text-slate-500">{school.location.country}</p>
                      </TableCell>
                      <TableCell>
                        {school.learningPartnerName || 'Not assigned'}
                      </TableCell>
                      <TableCell>{adminCount}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(school.status)}>
                          {school.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingSchool(school)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => setAccessSchool(school)}
                          >
                            Manage Access
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <SchoolFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        learningPartners={learningPartners}
        schoolAdmins={schoolAdmins}
        onSubmit={handleCreate}
      />
      <SchoolFormDialog
        open={Boolean(editingSchool)}
        onOpenChange={(open) => {
          if (!open) setEditingSchool(null);
        }}
        mode="edit"
        school={editingSchool}
        learningPartners={learningPartners}
        schoolAdmins={schoolAdmins}
        onSubmit={handleEdit}
      />
      <SchoolAccessDialog
        open={Boolean(accessSchool)}
        onOpenChange={(open) => {
          if (!open) setAccessSchool(null);
        }}
        school={accessSchool}
        learningPartners={learningPartners}
        schoolAdmins={schoolAdmins}
        memberships={memberships}
        onChanged={refresh}
      />
    </div>
  );
}
