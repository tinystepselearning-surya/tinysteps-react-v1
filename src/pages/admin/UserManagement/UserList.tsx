import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { collection, getDocs, query, orderBy, deleteDoc, doc, Timestamp, where, limit, startAfter, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions, auth } from '../../../lib/firebaseConfig';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Card } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@components/ui/dialog';
import { CreateUserForm } from './CreateUserForm';
import GmailParentsBucket from './GmailParentsBucket';
import { EditUserForm } from './EditUserForm';
import { toast } from '@components/hooks/use-toast';
import { User } from '../../../types/User';
import { UserFilters } from './UserFilters';

// Define types for UserTable props
interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onResetPassword: (user: User) => void;
  onSendResetLink: (user: User) => void;
}

function UserTable({ users, onEdit, onDelete, onResetPassword, onSendResetLink }: UserTableProps) {
  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'teacher': return 'default';
      case 'parent': return 'secondary';
      case 'learningPartner': return 'outline';
      case 'kid': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusBadgeVariant = (status?: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'suspended': return 'destructive';
      case 'archived': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.email || '—'}</TableCell>
            <TableCell>{user.name || '—'}</TableCell>
            <TableCell>
              <Badge variant={getRoleBadgeVariant(user.role)}>
                {user.role || 'unknown'}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={getStatusBadgeVariant(user.status)}>
                {user.status || 'unknown'}
              </Badge>
            </TableCell>
            <TableCell>
              {(() => {
                const createdAt =
                  user.createdAt instanceof Date
                    ? user.createdAt
                    : user.createdAt?.toDate?.() || null;
                return createdAt ? createdAt.toLocaleDateString() : '—';
              })()}
            </TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={() => onEdit(user)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onResetPassword(user)}
                >
                  Reset Password
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSendResetLink(user)}
                >
                  Send Reset Link
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDelete(user)}
                >
                  Delete
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const PAGE_SIZE = 10;

export function UserList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [showResetLinkDialog, setShowResetLinkDialog] = useState(false);
  const [resetLinkUser, setResetLinkUser] = useState<User | null>(null);
  const [generatedResetLink, setGeneratedResetLink] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isGmailBucketOpen, setIsGmailBucketOpen] = useState(false);

  const fetchUsers = async (reset = false) => {
    setIsLoading(true);
    try {
      let q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));

      if (searchTerm) {
        q = query(q, where('email', '>=', searchTerm), where('email', '<=', searchTerm + '\uf8ff'));
      }

      if (roleFilter !== 'all') {
        q = query(q, where('role', '==', roleFilter));
      }

      if (statusFilter !== 'all') {
        q = query(q, where('status', '==', statusFilter));
      }

      if (!reset && lastVisible) {
        q = query(q, startAfter(lastVisible));
      }

      const snapshot = await getDocs(q);
      const newUsers = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          uid: data.uid || doc.id, // Ensure uid is set
          email: data.email || '',
          name: data.name || '',
          role: (data.role as 'parent' | 'admin' | 'teacher' | 'learningPartner' | 'kid') || 'parent',
          status: (data.status as 'active' | 'suspended' | 'archived') || 'active', // Default to 'active'
          createdAt: data.createdAt || Timestamp.fromDate(new Date()), // Ensure Timestamp
          updatedAt: data.updatedAt || Timestamp.fromDate(new Date()), // Ensure Timestamp
        } as User;
      });

      setUsers((prev) => (reset ? newUsers : [...prev, ...newUsers]));
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (error: any) {
      // Extra diagnostics for permission issues
      console.error('Error fetching users:', error);

      // Log current firebase auth state to help debugging in dev
      try {
        const current = auth.currentUser;
        console.debug('Firebase auth.currentUser:', current ? { uid: current.uid, email: current.email } : null);
      } catch (e) {
        console.debug('Could not read auth.currentUser', e);
      }

      // Friendly, actionable messages for common error cases
      const msg = (error && error.message) || String(error);

      if (msg.includes('Missing or insufficient permissions')) {
        // If running in dev, include emulator hints
        const usingEmulator = import.meta.env?.VITE_USE_FIRESTORE_EMULATOR === 'true' || import.meta.env?.VITE_USE_AUTH_EMULATOR === 'true';
        const emulatorHint = usingEmulator
          ? 'Make sure you are signed into the Auth emulator as an admin (run the dev `set-admin` script, or sign in with the seeded admin account).'
          : 'Check you are signed in and have the correct admin privileges (or set VITE_USE_FIRESTORE_EMULATOR / VITE_USE_AUTH_EMULATOR in dev).';

        toast({
          title: 'Permission error',
          description: `Missing or insufficient permissions when reading users. ${emulatorHint}`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: msg || 'Failed to fetch users. Please try again later.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(true);
  }, [searchTerm, roleFilter, statusFilter]);


  const handleLoadMore = () => {
    if (hasMore) {
      fetchUsers();
    }
  };

  const handleFiltersChange = () => {
    setLastVisible(null);
    fetchUsers(true);
  };

  // This useEffect is now replaced by the one above
  /*
  useEffect(() => {
    fetchUsers(true);
  }, [searchTerm, roleFilter, statusFilter]);
  */

  const handleUserCreated = async (user?: User) => {
    setIsCreateDialogOpen(false);
    // Add a small delay to ensure Firestore has propagated the write
    setTimeout(async () => {
      try {
        await fetchUsers(true);
        toast({ title: 'User created', description: `${user?.name || user?.email || user?.id} created successfully` });
      } catch (err: any) {
        toast({ title: 'User created', description: 'User created, but we could not refresh the list immediately. Try refreshing the list manually.' });
      }
    }, 500);
  };

  const handleUserUpdated = () => {
    fetchUsers();
    setEditingUser(null);
  };

  const handleDeleteUser = async (user: User) => {
    if (window.confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
      try {
        // Get the current user's ID token
        const idToken = await auth.currentUser?.getIdToken();

        if (!idToken) {
          throw new Error('No authentication token available');
        }

        // Delete user from Firebase Auth using Cloud Function
        const response = await fetch('http://127.0.0.1:5001/tinysteps-react-v1/asia-south1/adminDeleteUser', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({ uid: user.uid }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete user');
        }

        // Delete user document from Firestore
        await deleteDoc(doc(db, 'users', user.id));

        toast({
          title: 'Success',
          description: 'User deleted successfully',
        });

        fetchUsers();
      } catch (error: any) {
        console.error('Error deleting user:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete user',
          variant: 'destructive',
        });
      }
    }
  };

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ uid, newPassword }: { uid: string; newPassword: string }) => {
      const resetPasswordFunction = httpsCallable(functions, 'adminResetPassword');
      return await resetPasswordFunction({ uid, newPassword });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Password reset successfully',
      });
      setShowResetPasswordDialog(false);
      setResetPasswordUser(null);
      setNewPassword('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password',
        variant: 'destructive',
      });
    },
  });

  const sendResetLinkMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const generateResetLinkFn = httpsCallable(functions, 'adminGenerateResetLink');
      const res = await generateResetLinkFn({ email });
      return res.data as { resetLink: string };
    },
    onSuccess: (data) => {
      setGeneratedResetLink(data.resetLink);
      toast({ title: 'Reset link generated', description: 'Copy and send this link to the user.' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message || 'Failed to generate reset link', variant: 'destructive' });
    },
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center">Loading users...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Users</h2>
        <div className="flex gap-2 items-center">
          <GmailParentsBucket />
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

      {/* Filters */}
      <UserFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onFiltersChange={handleFiltersChange}
      />

      {/* Users Table */}
      <Card>
        <UserTable
          users={users}
          onEdit={(user) => setEditingUser(user)}
          onDelete={handleDeleteUser}
          onResetPassword={(user) => {
            setResetPasswordUser(user);
            setShowResetPasswordDialog(true);
          }}
          onSendResetLink={(user) => {
            if (!user.email) {
              toast({ title: 'No email', description: 'Cannot generate reset link without an email', variant: 'destructive' });
              return;
            }
            setResetLinkUser(user);
            setGeneratedResetLink(null);
            setShowResetLinkDialog(true);
            sendResetLinkMutation.mutate({ email: user.email });
          }}
        />

        {isLoading && <div className="text-center py-4">Loading...</div>}
        {!isLoading && users.length === 0 && <div className="text-center py-8 text-gray-500">No users found.</div>}
        {hasMore && (
          <div className="text-center py-4">
            <Button onClick={handleLoadMore} disabled={isLoading}>
              Load More
            </Button>
          </div>
        )}
      </Card>

      {/* Edit User Dialog */}
      {editingUser && (
        <EditUserForm
          user={editingUser}
          onUserUpdated={handleUserUpdated}
          onCancel={() => setEditingUser(null)}
        />
      )}

      {/* Reset Password Dialog */}
      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter a new password for {resetPasswordUser?.name}. This will immediately change their password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
                New Password
              </label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowResetPasswordDialog(false);
                  setResetPasswordUser(null);
                  setNewPassword('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (resetPasswordUser && newPassword) {
                    resetPasswordMutation.mutate({
                      uid: resetPasswordUser.uid,
                      newPassword,
                    });
                  }
                }}
                disabled={!newPassword || resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Link Dialog */}
      <Dialog open={showResetLinkDialog} onOpenChange={setShowResetLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Link</DialogTitle>
            <DialogDescription>
              A password reset link has been generated for {resetLinkUser?.name} ({resetLinkUser?.email}).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {sendResetLinkMutation.isPending ? (
              <div>Generating reset link…</div>
            ) : (
              <>
                <p className="font-mono text-xs break-all">{generatedResetLink || '—'}</p>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowResetLinkDialog(false);
                      setResetLinkUser(null);
                      setGeneratedResetLink(null);
                    }}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      if (generatedResetLink) {
                        navigator.clipboard.writeText(generatedResetLink);
                        toast({ title: 'Copied', description: 'Reset link copied to clipboard' });
                      }
                    }}
                  >
                    Copy Link
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
