import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  Timestamp,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { db, functions, auth } from '../../../lib/firebaseConfig';

import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { Input } from '@components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui/table';
import { ChevronDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@components/ui/dialog';

import { CreateUserForm } from './CreateUserForm';
import { EditUserForm } from './EditUserForm';
import { toast } from '@components/hooks/use-toast';
import { User } from '../../../types/User';
import { UserFilters } from './UserFilters';

// ---------- Table Component ----------
interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onArchive: (user: User) => void;
  onResetPassword: (user: User) => void;
  sortField: UserSortField | null;
  sortDirection: SortDirection;
  onSort: (field: UserSortField) => void;
}

interface UserRoleCounts {
  all: number;
  admin: number;
  teacher: number;
  parent: number;
  students: number;
}

type UserSortField = 'email' | 'name' | 'role' | 'status' | 'phone' | 'createdAt';
type SortDirection = 'asc' | 'desc';
type UserPageSize = 'all' | 25 | 50 | 100;

const isHardDeleteProtectedRole = (role?: string) => {
  const normalized = String(role || '').trim().toLowerCase();
  return normalized === 'parent' || normalized === 'student' || normalized === 'kid';
};

function UserTable({
  users,
  onEdit,
  onDelete,
  onArchive,
  onResetPassword,
  sortField,
  sortDirection,
  onSort,
}: UserTableProps) {
  const getFirstNonEmpty = (...values: unknown[]) => {
    for (const value of values) {
      if (typeof value !== 'string') continue;
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
    return '';
  };

  const normalizeCountryCode = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    const digits = trimmed.replace(/[^\d]/g, '');
    if (!digits) return '';
    return `+${digits}`;
  };

  const normalizePhoneValue = (value: string) => value.trim().replace(/\s+/g, ' ');

  const getParentPhoneInfo = (user: User) => {
    const countryCode = normalizeCountryCode(getFirstNonEmpty(user.phoneCountryCode, user.countryCode));
    const phoneLocal = normalizePhoneValue(
      getFirstNonEmpty(user.phoneLocal, user.phoneNumber, user.mobile, user.contactNumber)
    );
    const phoneCombined = normalizePhoneValue(getFirstNonEmpty(user.phone));
    const phoneValue = phoneLocal || phoneCombined;

    if (countryCode && phoneValue) {
      const displayPhone =
        phoneLocal.length > 0
          ? `${countryCode} ${phoneLocal}`
          : phoneCombined.startsWith(countryCode)
            ? phoneCombined
            : `${countryCode} ${phoneCombined}`;
      return { text: displayPhone, badge: 'Complete', tone: 'complete' as const };
    }

    if (countryCode && !phoneValue) {
      return { text: 'Missing phone', badge: 'Missing phone', tone: 'warning' as const };
    }

    if (!countryCode && phoneValue) {
      return { text: 'Missing country code', badge: 'Missing country code', tone: 'warning' as const };
    }

    return { text: 'Not added', badge: 'Not added', tone: 'empty' as const };
  };

  const getPhoneBadgeClassName = (tone: 'complete' | 'warning' | 'empty') => {
    if (tone === 'complete') {
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    }
    if (tone === 'warning') {
      return 'border-amber-200 bg-amber-50 text-amber-700';
    }
    return 'border-slate-200 bg-slate-50 text-slate-600';
  };

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'teacher':
        return 'default';
      case 'parent':
        return 'secondary';
      case 'student':
      case 'learningPartner':
        return 'outline';
      case 'kid':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusBadgeVariant = (status?: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'suspended':
        return 'destructive';
      case 'archived':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Table className="w-full min-w-[1080px] text-sm">
      <TableHeader>
        <TableRow>
          {([
            { field: 'email', label: 'Email', className: 'px-3 py-2 text-xs font-semibold min-w-[250px]' },
            { field: 'name', label: 'Name', className: 'px-3 py-2 text-xs font-semibold min-w-[180px]' },
            { field: 'role', label: 'Role', className: 'px-3 py-2 text-xs font-semibold min-w-[110px]' },
            { field: 'status', label: 'Status', className: 'px-3 py-2 text-xs font-semibold min-w-[110px]' },
            { field: 'phone', label: 'Phone', className: 'px-3 py-2 text-xs font-semibold min-w-[190px]' },
            { field: 'createdAt', label: 'Created', className: 'px-3 py-2 text-xs font-semibold min-w-[120px]' },
          ] as Array<{ field: UserSortField; label: string; className: string }>).map((column) => (
            <TableHead key={column.field} className={column.className}>
              <button
                type="button"
                onClick={() => onSort(column.field)}
                className="inline-flex items-center gap-1 rounded hover:text-blue-700"
                title={`Sort by ${column.label}`}
              >
                <span>{column.label}</span>
                <span className="text-[10px] leading-none">
                  {sortField === column.field ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                </span>
              </button>
            </TableHead>
          ))}
          <TableHead className="px-3 py-2 text-xs font-semibold text-right min-w-[120px]">Actions</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id} className="hover:bg-slate-50/70">
            <TableCell className="px-3 py-2 whitespace-nowrap">
              <div className="max-w-[200px] truncate" title={user.email || ''}>
                {user.email || '—'}
              </div>
            </TableCell>
            <TableCell className="px-3 py-2 whitespace-nowrap">
              <div className="max-w-[160px] truncate" title={user.name || ''}>
                {user.name || '—'}
              </div>
            </TableCell>

            <TableCell className="px-3 py-2 whitespace-nowrap">
              <Badge variant={getRoleBadgeVariant(user.role)}>
                {user.role || 'unknown'}
              </Badge>
            </TableCell>

            <TableCell className="px-3 py-2 whitespace-nowrap">
              <Badge variant={getStatusBadgeVariant(user.status)}>
                {user.status || 'unknown'}
              </Badge>
            </TableCell>

            <TableCell className="px-3 py-2 whitespace-nowrap">
              {(() => {
                const role = String(user.role || '').trim().toLowerCase();
                const isParent = role === 'parent';
                if (!isParent) {
                  const rawPhone = normalizePhoneValue(
                    getFirstNonEmpty(
                      user.phoneCountryCode && user.phoneLocal
                        ? `${normalizeCountryCode(user.phoneCountryCode)} ${user.phoneLocal}`
                        : '',
                      user.phone,
                      user.phoneNumber,
                      user.mobile,
                      user.contactNumber
                    )
                  );
                  return rawPhone || '—';
                }

                const phoneInfo = getParentPhoneInfo(user);
                return (
                  <div className="flex items-center gap-2">
                    <span className="max-w-[130px] truncate" title={phoneInfo.text}>
                      {phoneInfo.text}
                    </span>
                    <Badge variant="outline" className={getPhoneBadgeClassName(phoneInfo.tone)}>
                      {phoneInfo.badge}
                    </Badge>
                  </div>
                );
              })()}
            </TableCell>

            <TableCell className="px-3 py-2 whitespace-nowrap">
              {(() => {
                const createdAt =
                  user.createdAt instanceof Date
                    ? user.createdAt
                    : // firestore Timestamp support
                      (user.createdAt as any)?.toDate?.() || null;
                return createdAt ? createdAt.toLocaleDateString() : '—';
              })()}
            </TableCell>

            <TableCell className="px-3 py-2 text-right whitespace-nowrap">
              {(() => {
                const deleteBlocked = isHardDeleteProtectedRole(user.role);
                return (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="inline-flex items-center gap-1">
                    Actions
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onSelect={() => onEdit(user)}>Edit</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onResetPassword(user)}>
                    Reset Password
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => onArchive(user)}>Archive</DropdownMenuItem>
                  {deleteBlocked ? (
                    <DropdownMenuItem disabled>
                      Delete disabled (archive only)
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onSelect={() => onDelete(user)}
                    >
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
                );
              })()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ---------- Main ----------
export function UserList() {
  const [draftSearchTerm, setDraftSearchTerm] = useState('');
  const [draftRoleFilter, setDraftRoleFilter] = useState<string>('all');
  const [draftStatusFilter, setDraftStatusFilter] = useState<string>('all');

  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [appliedRoleFilter, setAppliedRoleFilter] = useState<string>('all');
  const [appliedStatusFilter, setAppliedStatusFilter] = useState<string>('all');

  const [users, setUsers] = useState<User[]>([]);
  const [roleCounts, setRoleCounts] = useState<UserRoleCounts>({
    all: 0,
    admin: 0,
    teacher: 0,
    parent: 0,
    students: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetPasswordSaving, setIsResetPasswordSaving] = useState(false);
  const [sortField, setSortField] = useState<UserSortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [pageSize, setPageSize] = useState<UserPageSize>('all');

  const normalizeRole = (role?: string) => String(role || '').trim().toLowerCase();
  const normalizeStatus = (status?: string) => String(status || '').trim().toLowerCase();
  const normalizeRoleFilter = (role: string) => String(role || '').trim().toLowerCase();
  const normalizeStatusFilter = (status: string) => String(status || '').trim().toLowerCase();

  const isStudentRole = useCallback((role?: string) => {
    const normalizedRole = String(role || '').trim().toLowerCase();
    return normalizedRole === 'student' || normalizedRole === 'students' || normalizedRole === 'kid';
  }, []);

  // ---------------- Fetch Users ----------------
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc')
      );


      const snapshot = await getDocs(q);

      const newUsers = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          uid: data.uid || d.id,
          email: data.email || '',
          name: data.name || data.displayName || '',
          phone: typeof data.phone === 'string' ? data.phone : '',
          phoneCountryCode: typeof data.phoneCountryCode === 'string' ? data.phoneCountryCode : '',
          phoneLocal: typeof data.phoneLocal === 'string' ? data.phoneLocal : '',
          phoneNumber: typeof data.phoneNumber === 'string' ? data.phoneNumber : '',
          mobile: typeof data.mobile === 'string' ? data.mobile : '',
          contactNumber: typeof data.contactNumber === 'string' ? data.contactNumber : '',
          countryCode: typeof data.countryCode === 'string' ? data.countryCode : '',
          role:
            (data.role as
              | 'parent'
              | 'admin'
              | 'teacher'
              | 'learningPartner'
              | 'kid') || 'parent',
          status: (data.status as 'active' | 'suspended' | 'archived') || 'active',
          createdAt: data.createdAt || Timestamp.fromDate(new Date()),
          updatedAt: data.updatedAt || Timestamp.fromDate(new Date()),
        } as User;
      });

      setUsers(newUsers);
    } catch (error: any) {
      console.error('Error fetching users:', error);

      const msg = (error && error.message) || String(error);
      if (msg.includes('Missing or insufficient permissions')) {
        toast({
          title: 'Permission error',
          description:
            'Missing permissions reading users. Make sure you are signed in as an admin (and in production, your token has admin claims).',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: msg || 'Failed to fetch users.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const baseFilteredForCounts = useMemo(() => {
    const normalizedAppliedStatus = normalizeStatusFilter(appliedStatusFilter);
    const appliedSearch = appliedSearchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesStatus =
        normalizedAppliedStatus === 'all' || normalizeStatus(user.status) === normalizedAppliedStatus;

      const matchesSearch =
        appliedSearch.length === 0 ||
        user.name?.toLowerCase().includes(appliedSearch) ||
        user.email?.toLowerCase().includes(appliedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [users, appliedStatusFilter, appliedSearchTerm]);

  useEffect(() => {
    let admin = 0;
    let teacher = 0;
    let parent = 0;
    let students = 0;

    for (const user of baseFilteredForCounts) {
      const role = normalizeRole(user.role);
      if (role === 'admin') admin += 1;
      if (role === 'teacher') teacher += 1;
      if (role === 'parent') parent += 1;
      if (isStudentRole(role)) students += 1;
    }

    setRoleCounts({
      all: baseFilteredForCounts.length,
      admin,
      teacher,
      parent,
      students,
    });
  }, [baseFilteredForCounts, isStudentRole]);

  const filteredUsers = useMemo(() => {
    const normalizedRoleFilter = normalizeRoleFilter(appliedRoleFilter);

    return baseFilteredForCounts.filter((user) => {
      const userRole = normalizeRole(user.role);
      if (normalizedRoleFilter === 'all') return true;
      if (normalizedRoleFilter === 'students') return isStudentRole(userRole);
      return userRole === normalizedRoleFilter;
    });
  }, [baseFilteredForCounts, appliedRoleFilter, isStudentRole]);

  const sortedUsers = useMemo(() => {
    if (!sortField) return filteredUsers;
    const list = [...filteredUsers];
    const directionFactor = sortDirection === 'asc' ? 1 : -1;

    list.sort((a, b) => {
      if (sortField === 'createdAt') {
        const aDate =
          a.createdAt instanceof Date ? a.createdAt : ((a.createdAt as any)?.toDate?.() || null);
        const bDate =
          b.createdAt instanceof Date ? b.createdAt : ((b.createdAt as any)?.toDate?.() || null);
        const aTime = aDate instanceof Date ? aDate.getTime() : 0;
        const bTime = bDate instanceof Date ? bDate.getTime() : 0;
        return (aTime - bTime) * directionFactor;
      }

      const aVal = String((a as any)[sortField] || '').toLowerCase();
      const bVal = String((b as any)[sortField] || '').toLowerCase();
      return aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' }) * directionFactor;
    });

    return list;
  }, [filteredUsers, sortField, sortDirection]);

  const visibleUsers = useMemo(() => {
    if (pageSize === 'all') return sortedUsers;
    return sortedUsers.slice(0, pageSize);
  }, [sortedUsers, pageSize]);

  const handleSort = (field: UserSortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortField(field);
    setSortDirection('asc');
  };

  const roleTabs = useMemo(() => {
    return [
      {
        key: 'all',
        label: 'Overall List',
        count: roleCounts.all,
        activeClass: 'from-slate-700 to-slate-500',
      },
      {
        key: 'admin',
        label: 'Admin',
        count: roleCounts.admin,
        activeClass: 'from-rose-500 to-orange-400',
      },
      {
        key: 'teacher',
        label: 'Teacher',
        count: roleCounts.teacher,
        activeClass: 'from-blue-600 to-cyan-500',
      },
      {
        key: 'parent',
        label: 'Parent',
        count: roleCounts.parent,
        activeClass: 'from-fuchsia-500 to-pink-500',
      },
      {
        key: 'students',
        label: 'Student',
        count: roleCounts.students,
        activeClass: 'from-emerald-500 to-teal-500',
      },
    ] as const;
  }, [roleCounts.all, roleCounts.admin, roleCounts.teacher, roleCounts.parent, roleCounts.students]);

  // Initial fetch
  useEffect(() => {
    setUsers([]);
    fetchUsers();
  }, []);

  // If redirected here with a createdUserId query param (e.g. /surya?createdUserId=...),
  // refresh the users list and clear the param. This avoids relying on any global
  // `handleUserCreated` function that may not exist in production bundles.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const createdUserId = params.get('createdUserId');
      if (createdUserId) {
        (async () => {
          await fetchUsers();
          try {
            toast({ title: 'User created', description: `User ${createdUserId} created.` });
          } catch (e) {
            // swallow toast errors
          }
          // remove query param so refresh doesn't repeat
          try {
            const url = new URL(window.location.href);
            url.searchParams.delete('createdUserId');
            window.history.replaceState({}, '', url.toString());
          } catch (e) {
            // ignore
          }
        })();
      }
    } catch (err) {
      // ignore malformed URL or other errors
       
      console.debug('createdUserId handling failed', err);
    }
    // Only run once on mount
  }, []);

  const handleFiltersChange = () => {
    setAppliedSearchTerm(draftSearchTerm);
    setAppliedRoleFilter(draftRoleFilter);
    setAppliedStatusFilter(draftStatusFilter);
  };

  const handleClearFilters = () => {
    setDraftSearchTerm('');
    setDraftRoleFilter('all');
    setDraftStatusFilter('all');

    setAppliedSearchTerm('');
    setAppliedRoleFilter('all');
    setAppliedStatusFilter('all');
  };

  // After CreateUserForm success
  const handleUserCreated = async (user?: User) => {
    setIsCreateDialogOpen(false);
    setTimeout(async () => {
      await fetchUsers();
      toast({
        title: 'User created',
        description: `${user?.name || user?.email || 'User'} created successfully`,
      });
    }, 400);
  };

  const handleUserUpdated = async () => {
    await fetchUsers();
    setEditingUser(null);
  };

  // ---------------- Archive User (soft delete) ----------------
  const handleArchiveUser = async (user: User) => {
    const ok = window.confirm(
      `Archive ${user.name || user.email || user.id}?\n\nThey will not be deleted, but status becomes "archived".`
    );
    if (!ok) return;

    try {
      await updateDoc(doc(db, 'users', user.id), {
        status: 'archived',
        updatedAt: serverTimestamp(),
      });

      toast({ title: 'Archived', description: 'User archived successfully.' });
      await fetchUsers();
    } catch (error: any) {
      console.error('Archive failed:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to archive user.',
        variant: 'destructive',
      });
    }
  };

  // ---------------- Delete User (hard delete) ----------------
  // IMPORTANT:
  // - This expects a deployed Cloud Function: adminDeleteUser (v2 callable)
  // - Cloud Function should delete Auth user + Firestore /users/{uid} (and any mirror docs)
  const handleDeleteUser = async (user: User) => {
    if (isHardDeleteProtectedRole(user.role)) {
      toast({
        title: 'Delete blocked',
        description: 'Parent/student accounts are archive-only to protect financial history.',
        variant: 'destructive',
      });
      return;
    }

    const ok = window.confirm(
      `Delete ${user.name || user.email || user.id}?\n\nThis will permanently remove the account (Auth + Firestore).`
    );
    if (!ok) return;

    try {
      const current = auth.currentUser;
      if (!current) throw new Error('You are not signed in.');

      // Call v2 function
      const deleteUserFn = httpsCallable(functions, 'adminDeleteUser');
      await deleteUserFn({ uid: user.uid });

      // Optional safety fallback: if function does NOT delete /users doc, we remove it here.
      // If your function already deletes it, this will simply throw "not-found" which we can ignore.
      try {
        await deleteDoc(doc(db, 'users', user.id));
      } catch {
        // ignore
      }

      toast({ title: 'Deleted', description: 'User deleted successfully.' });
      await fetchUsers();
    } catch (error: any) {
      console.error('Delete failed:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user.',
        variant: 'destructive',
      });
    }
  };

  const closeResetPasswordDialog = () => {
    setShowResetPasswordDialog(false);
    setResetPasswordUser(null);
    setNewPassword('');
    setConfirmPassword('');
    setIsResetPasswordSaving(false);
  };

  const handleOpenResetPassword = (user: User) => {
    setResetPasswordUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setShowResetPasswordDialog(true);
  };

  const handleResetPassword = async () => {
    const targetUid = resetPasswordUser?.uid || resetPasswordUser?.id;
    if (!targetUid) {
      toast({
        title: 'Missing user',
        description: 'Could not identify this user for password reset.',
        variant: 'destructive',
      });
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      toast({
        title: 'Invalid password',
        description: 'Password must be at least 8 characters.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please re-enter matching passwords.',
        variant: 'destructive',
      });
      return;
    }

    setIsResetPasswordSaving(true);
    try {
      const fn = httpsCallable(functions, 'adminResetPassword');
      await fn({
        uid: targetUid,
        newPassword,
      });
      toast({
        title: 'Password updated',
        description: `Password updated for ${resetPasswordUser?.email || 'user'}.`,
      });
      closeResetPasswordDialog();
    } catch (err: any) {
      console.error('Password reset failed:', err);
      toast({
        title: 'Reset failed',
        description: err?.message || 'Failed to update password.',
        variant: 'destructive',
      });
    } finally {
      setIsResetPasswordSaving(false);
    }
  };

  // ---------------- Render ----------------
  if (isLoading && users.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">Loading users...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-end items-center">
        <div className="flex gap-2 items-center">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>Create New User</Button>
            </DialogTrigger>

            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Create a new user account with the appropriate role and details.
                </DialogDescription>
              </DialogHeader>

              <CreateUserForm
                onUserCreated={handleUserCreated}
                onClose={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Role Tabs */}
      <div className="flex flex-wrap gap-2">
        {roleTabs.map((tab) => {
          const isActive = draftRoleFilter === tab.key;
          return (
            <Button
              key={tab.key}
              type="button"
              size="sm"
              onClick={() => setDraftRoleFilter(tab.key)}
              className={`h-8 rounded-full px-3 text-xs font-semibold transition ${
                isActive
                  ? `bg-gradient-to-r ${tab.activeClass} text-white shadow-sm`
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
              variant={isActive ? 'default' : 'outline'}
            >
              {tab.label}: {tab.count}
            </Button>
          );
        })}
      </div>

      <UserFilters
        searchTerm={draftSearchTerm}
        setSearchTerm={setDraftSearchTerm}
        roleFilter={draftRoleFilter}
        setRoleFilter={setDraftRoleFilter}
        statusFilter={draftStatusFilter}
        setStatusFilter={setDraftStatusFilter}
        onApplyFilters={handleFiltersChange}
        onClearFilters={handleClearFilters}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="user-rows-per-page" className="text-sm font-medium text-slate-700">
            Rows per page
          </label>
          <select
            id="user-rows-per-page"
            value={String(pageSize)}
            onChange={(event) => {
              const value = event.target.value;
              if (value === 'all') {
                setPageSize('all');
                return;
              }
              const parsed = Number(value);
              if (parsed === 25 || parsed === 50 || parsed === 100) {
                setPageSize(parsed as 25 | 50 | 100);
              }
            }}
            className="h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-700"
          >
            <option value="all">All</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>

        <p className="text-sm text-slate-600">
          {pageSize === 'all'
            ? `Showing all ${sortedUsers.length} results`
            : `Showing ${visibleUsers.length} of ${sortedUsers.length} results`}
        </p>
      </div>

      {/* Table */}
      <Card className="overflow-x-auto">
        <UserTable
          users={visibleUsers}
          onEdit={(u) => setEditingUser(u)}
          onDelete={handleDeleteUser}
          onArchive={handleArchiveUser}
          onResetPassword={handleOpenResetPassword}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />

        {isLoading && <div className="text-center py-4">Loading…</div>}

        {!isLoading && visibleUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">No users found.</div>
        )}
      </Card>

      {/* Edit */}
      {editingUser && (
        <EditUserForm
          user={editingUser}
          onUserUpdated={handleUserUpdated}
          onCancel={() => setEditingUser(null)}
        />
      )}

      {/* Reset Password Dialog */}
      <Dialog
        open={showResetPasswordDialog}
        onOpenChange={(open) => {
          if (open) {
            setShowResetPasswordDialog(true);
            return;
          }
          closeResetPasswordDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {resetPasswordUser?.name || 'User'} (
              {resetPasswordUser?.email || '—'}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">New Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Confirm Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
              />
            </div>

            <p className="text-xs text-slate-500">
              Minimum 8 characters. Share the new password securely with the user.
            </p>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={closeResetPasswordDialog}
                disabled={isResetPasswordSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleResetPassword} disabled={isResetPasswordSaving}>
                {isResetPasswordSaving ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
