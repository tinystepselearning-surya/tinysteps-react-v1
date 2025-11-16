import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../../lib/firebaseConfig';
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

export function UserList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [showResetLinkDialog, setShowResetLinkDialog] = useState(false);
  const [resetLinkUser, setResetLinkUser] = useState<User | null>(null);
  const [generatedResetLink, setGeneratedResetLink] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isGmailBucketOpen, setIsGmailBucketOpen] = useState(false);

  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as User[];
    },
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];

    return users.filter(user => {
      const email = user.email?.toLowerCase?.() || '';
      const name = user.name?.toLowerCase?.() || '';
      const role = user.role || 'parent';
      const status = user.status || 'active';

      const matchesSearch =
        email.includes(searchTerm.toLowerCase()) ||
        name.includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || role === roleFilter;
      const matchesStatus = statusFilter === 'all' || status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

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

  const handleUserCreated = async (user?: User) => {
    try {
      // Refresh the users list and wait for the new user to appear before closing
      await refetch();
      toast({ title: 'User created', description: `${user?.name || user?.email || user?.id} created successfully` });
    } catch (err: any) {
      toast({ title: 'User created', description: 'User created, but we could not refresh the list immediately. Try refreshing the list manually.' });
    } finally {
      setIsCreateDialogOpen(false);
    }
  };

  const handleUserUpdated = () => {
    refetch();
    setEditingUser(null);
  };

  const handleDeleteUser = async (user: User) => {
    if (window.confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
      try {
        // Delete user from Firebase Auth using Cloud Function
        const deleteUserFunction = httpsCallable(functions, 'adminDeleteUser');
        await deleteUserFunction({ uid: user.uid });

        // Delete user document from Firestore
        await deleteDoc(doc(db, 'users', user.id));

        toast({
          title: 'Success',
          description: 'User deleted successfully',
        });

        refetch();
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

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-500">
          Error loading users: {error.message}
          <Button onClick={() => refetch()} className="ml-4">Retry</Button>
        </div>
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
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="teacher">Teacher</SelectItem>
              <SelectItem value="parent">Parent</SelectItem>
              <SelectItem value="learningPartner">Learning Partner</SelectItem>
              <SelectItem value="kid">Kid</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
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
            {filteredUsers.map((user) => (
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
                        : user.createdAt?.seconds
                          ? new Date(user.createdAt.seconds * 1000)
                          : null;
                    return createdAt ? createdAt.toLocaleDateString() : '—';
                  })()}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingUser(user)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setResetPasswordUser(user);
                        setShowResetPasswordDialog(true);
                      }}
                    >
                      Reset Password
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (!user.email) {
                          toast({ title: 'No email', description: 'Cannot generate reset link without an email', variant: 'destructive' });
                          return;
                        }
                        setResetLinkUser(user);
                        setGeneratedResetLink(null);
                        setShowResetLinkDialog(true);
                        sendResetLinkMutation.mutate({ email: user.email });
                      }}
                    >
                      Send Reset Link
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteUser(user)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No users found matching your criteria.
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
