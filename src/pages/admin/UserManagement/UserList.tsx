import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  deleteDoc,
  doc,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
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
}

interface UserRoleCounts {
  admin: number;
  teacher: number;
  parent: number;
  students: number;
}

function UserTable({
  users,
  onEdit,
  onDelete,
  onArchive,
  onResetPassword,
}: UserTableProps) {
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
    <Table className="w-full min-w-[940px] text-sm">
      <TableHeader>
        <TableRow>
          <TableHead className="px-3 py-2 text-xs font-semibold min-w-[250px]">Email</TableHead>
          <TableHead className="px-3 py-2 text-xs font-semibold min-w-[180px]">Name</TableHead>
          <TableHead className="px-3 py-2 text-xs font-semibold min-w-[110px]">Role</TableHead>
          <TableHead className="px-3 py-2 text-xs font-semibold min-w-[110px]">Status</TableHead>
          <TableHead className="px-3 py-2 text-xs font-semibold min-w-[120px]">Created</TableHead>
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
                const createdAt =
                  user.createdAt instanceof Date
                    ? user.createdAt
                    : // firestore Timestamp support
                      (user.createdAt as any)?.toDate?.() || null;
                return createdAt ? createdAt.toLocaleDateString() : '—';
              })()}
            </TableCell>

            <TableCell className="px-3 py-2 text-right whitespace-nowrap">
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
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onSelect={() => onDelete(user)}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ---------- Pagination ----------
const PAGE_SIZE = 10;

// ---------- Main ----------
export function UserList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [roleCounts, setRoleCounts] = useState<UserRoleCounts>({
    admin: 0,
    teacher: 0,
    parent: 0,
    students: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetPasswordSaving, setIsResetPasswordSaving] = useState(false);

  // ---------------- Fetch Users ----------------
  const fetchUsers = async (reset = false) => {
    setIsLoading(true);
    try {
      let q = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE)
      );

      if (!reset && lastVisible) {
        q = query(q, startAfter(lastVisible));
      }

      const snapshot = await getDocs(q);

      const newUsers = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          uid: data.uid || d.id,
          email: data.email || '',
          name: data.name || data.displayName || '',
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

      setUsers((prev) => (reset ? newUsers : [...prev, ...newUsers]));
      setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
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

  const fetchRoleCounts = async () => {
    try {
      const [usersSnap, kidsSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'kids')),
      ]);

      let admin = 0;
      let teacher = 0;
      let parent = 0;

      usersSnap.forEach((userDoc) => {
        const role = userDoc.data()?.role;
        if (role === 'admin') admin += 1;
        if (role === 'teacher') teacher += 1;
        if (role === 'parent') parent += 1;
      });

      setRoleCounts({
        admin,
        teacher,
        parent,
        students: kidsSnap.size,
      });
    } catch (error) {
      console.error('Error fetching role counts:', error);
    }
  };

  const filteredUsers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const normalizedRole = String(user.role || '').toLowerCase();
      const normalizedStatus = String(user.status || '').toLowerCase();
      const normalizedRoleFilter = String(roleFilter).toLowerCase();
      const matchesRole =
        normalizedRoleFilter === 'all'
          ? true
          : normalizedRoleFilter === 'students'
            ? normalizedRole === 'kid' || normalizedRole === 'student'
            : normalizedRole === normalizedRoleFilter;
      const matchesStatus =
        statusFilter === 'all' || normalizedStatus === String(statusFilter).toLowerCase();

      const matchesSearch =
        search.length === 0 ||
        user.name?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search);

      return matchesRole && matchesStatus && matchesSearch;
    });
  }, [users, roleFilter, statusFilter, searchTerm]);

  const roleTabs = useMemo(() => {
    const total = roleCounts.admin + roleCounts.teacher + roleCounts.parent + roleCounts.students;
    return [
      {
        key: 'all',
        label: 'Overall List',
        count: total,
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
  }, [roleCounts.admin, roleCounts.teacher, roleCounts.parent, roleCounts.students]);

  // Initial fetch
  useEffect(() => {
    setLastVisible(null);
    setUsers([]);
    fetchUsers(true);
    fetchRoleCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          await fetchUsers(true);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoadMore = () => {
    if (hasMore && !isLoading) fetchUsers(false);
  };

  const handleFiltersChange = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
  };

  // After CreateUserForm success
  const handleUserCreated = async (user?: User) => {
    setIsCreateDialogOpen(false);
    setTimeout(async () => {
      await fetchUsers(true);
      await fetchRoleCounts();
      toast({
        title: 'User created',
        description: `${user?.name || user?.email || 'User'} created successfully`,
      });
    }, 400);
  };

  const handleUserUpdated = async () => {
    await fetchUsers(true);
    await fetchRoleCounts();
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
      await fetchUsers(true);
      await fetchRoleCounts();
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
      await fetchUsers(true);
      await fetchRoleCounts();
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
          const isActive = roleFilter === tab.key;
          return (
            <Button
              key={tab.key}
              type="button"
              size="sm"
              onClick={() => setRoleFilter(tab.key)}
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
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onFiltersChange={handleFiltersChange}
      />

      {/* Table */}
      <Card className="overflow-x-auto">
        <UserTable
          users={filteredUsers}
          onEdit={(u) => setEditingUser(u)}
          onDelete={handleDeleteUser}
          onArchive={handleArchiveUser}
          onResetPassword={handleOpenResetPassword}
        />

        {isLoading && <div className="text-center py-4">Loading…</div>}

        {!isLoading && filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">No users found.</div>
        )}

        {hasMore && (
          <div className="text-center py-4">
            <Button onClick={handleLoadMore} disabled={isLoading}>
              Load More
            </Button>
          </div>
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
