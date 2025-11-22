var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { collection, getDocs, query, deleteDoc, doc, Timestamp, where, limit, startAfter } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../../lib/firebaseConfig';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Card } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@components/ui/dialog';
import { CreateUserForm } from './CreateUserForm';
import GmailParentsBucket from './GmailParentsBucket';
import { EditUserForm } from './EditUserForm';
import { toast } from '@components/hooks/use-toast';
import { UserFilters } from './UserFilters';
function UserTable({ users, onEdit, onDelete, onResetPassword, onSendResetLink }) {
    const getRoleBadgeVariant = (role) => {
        switch (role) {
            case 'admin': return 'destructive';
            case 'teacher': return 'default';
            case 'parent': return 'secondary';
            case 'learningPartner': return 'outline';
            case 'kid': return 'secondary';
            default: return 'default';
        }
    };
    const getStatusBadgeVariant = (status) => {
        switch (status) {
            case 'active': return 'default';
            case 'suspended': return 'destructive';
            case 'archived': return 'secondary';
            default: return 'default';
        }
    };
    return (_jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Email" }), _jsx(TableHead, { children: "Name" }), _jsx(TableHead, { children: "Role" }), _jsx(TableHead, { children: "Status" }), _jsx(TableHead, { children: "Created" }), _jsx(TableHead, { children: "Actions" })] }) }), _jsx(TableBody, { children: users.map((user) => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: user.email || '—' }), _jsx(TableCell, { children: user.name || '—' }), _jsx(TableCell, { children: _jsx(Badge, { variant: getRoleBadgeVariant(user.role), children: user.role || 'unknown' }) }), _jsx(TableCell, { children: _jsx(Badge, { variant: getStatusBadgeVariant(user.status), children: user.status || 'unknown' }) }), _jsx(TableCell, { children: (() => {
                                var _a, _b;
                                const createdAt = user.createdAt instanceof Date
                                    ? user.createdAt
                                    : ((_b = (_a = user.createdAt) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) || null;
                                return createdAt ? createdAt.toLocaleDateString() : '—';
                            })() }), _jsx(TableCell, { children: _jsxs("div", { className: "flex space-x-2", children: [_jsx(Button, { size: "sm", variant: "outline", onClick: () => onEdit(user), children: "Edit" }), _jsx(Button, { size: "sm", variant: "secondary", onClick: () => onResetPassword(user), children: "Reset Password" }), _jsx(Button, { size: "sm", variant: "outline", onClick: () => onSendResetLink(user), children: "Send Reset Link" }), _jsx(Button, { size: "sm", variant: "destructive", onClick: () => onDelete(user), children: "Delete" })] }) })] }, user.id))) })] }));
}
const PAGE_SIZE = 10;
export function UserList() {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [lastVisible, setLastVisible] = useState(null);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [resetPasswordUser, setResetPasswordUser] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
    const [showResetLinkDialog, setShowResetLinkDialog] = useState(false);
    const [resetLinkUser, setResetLinkUser] = useState(null);
    const [generatedResetLink, setGeneratedResetLink] = useState(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isGmailBucketOpen, setIsGmailBucketOpen] = useState(false);
    const fetchUsers = (...args_1) => __awaiter(this, [...args_1], void 0, function* (reset = false) {
        setIsLoading(true);
        try {
            let q = query(collection(db, 'users'), limit(PAGE_SIZE));
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
            const snapshot = yield getDocs(q);
            const newUsers = snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    uid: data.uid || doc.id, // Ensure uid is set
                    email: data.email || '',
                    name: data.name || '',
                    role: data.role || 'parent',
                    status: data.status || 'active', // Default to 'active'
                    createdAt: data.createdAt || Timestamp.fromDate(new Date()), // Ensure Timestamp
                    updatedAt: data.updatedAt || Timestamp.fromDate(new Date()), // Ensure Timestamp
                };
            });
            setUsers((prev) => (reset ? newUsers : [...prev, ...newUsers]));
            setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
            setHasMore(snapshot.docs.length === PAGE_SIZE);
        }
        catch (error) {
            console.error('Error fetching users:', error);
        }
        finally {
            setIsLoading(false);
        }
    });
    const handleLoadMore = () => {
        if (hasMore) {
            fetchUsers();
        }
    };
    const handleFiltersChange = () => {
        setLastVisible(null);
        fetchUsers(true);
    };
    useEffect(() => {
        fetchUsers(true);
    }, [searchTerm, roleFilter, statusFilter]);
    const handleUserCreated = (user) => __awaiter(this, void 0, void 0, function* () {
        try {
            // Refresh the users list and wait for the new user to appear before closing
            yield fetchUsers(true);
            toast({ title: 'User created', description: `${(user === null || user === void 0 ? void 0 : user.name) || (user === null || user === void 0 ? void 0 : user.email) || (user === null || user === void 0 ? void 0 : user.id)} created successfully` });
        }
        catch (err) {
            toast({ title: 'User created', description: 'User created, but we could not refresh the list immediately. Try refreshing the list manually.' });
        }
        finally {
            setIsCreateDialogOpen(false);
        }
    });
    const handleUserUpdated = () => {
        fetchUsers();
        setEditingUser(null);
    };
    const handleDeleteUser = (user) => __awaiter(this, void 0, void 0, function* () {
        if (window.confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
            try {
                // Delete user from Firebase Auth using Cloud Function
                const deleteUserFunction = httpsCallable(functions, 'adminDeleteUser');
                yield deleteUserFunction({ uid: user.uid });
                // Delete user document from Firestore
                yield deleteDoc(doc(db, 'users', user.id));
                toast({
                    title: 'Success',
                    description: 'User deleted successfully',
                });
                fetchUsers();
            }
            catch (error) {
                console.error('Error deleting user:', error);
                toast({
                    title: 'Error',
                    description: error.message || 'Failed to delete user',
                    variant: 'destructive',
                });
            }
        }
    });
    const resetPasswordMutation = useMutation({
        mutationFn: (_a) => __awaiter(this, [_a], void 0, function* ({ uid, newPassword }) {
            const resetPasswordFunction = httpsCallable(functions, 'adminResetPassword');
            return yield resetPasswordFunction({ uid, newPassword });
        }),
        onSuccess: () => {
            toast({
                title: 'Success',
                description: 'Password reset successfully',
            });
            setShowResetPasswordDialog(false);
            setResetPasswordUser(null);
            setNewPassword('');
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to reset password',
                variant: 'destructive',
            });
        },
    });
    const sendResetLinkMutation = useMutation({
        mutationFn: (_a) => __awaiter(this, [_a], void 0, function* ({ email }) {
            const generateResetLinkFn = httpsCallable(functions, 'adminGenerateResetLink');
            const res = yield generateResetLinkFn({ email });
            return res.data;
        }),
        onSuccess: (data) => {
            setGeneratedResetLink(data.resetLink);
            toast({ title: 'Reset link generated', description: 'Copy and send this link to the user.' });
        },
        onError: (err) => {
            toast({ title: 'Error', description: err.message || 'Failed to generate reset link', variant: 'destructive' });
        },
    });
    if (isLoading) {
        return (_jsx(Card, { className: "p-6", children: _jsx("div", { className: "text-center", children: "Loading users..." }) }));
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "text-2xl font-bold", children: "Users" }), _jsxs("div", { className: "flex gap-2 items-center", children: [_jsx(GmailParentsBucket, {}), _jsxs(Dialog, { open: isCreateDialogOpen, onOpenChange: setIsCreateDialogOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsx(Button, { children: "Create New User" }) }), _jsxs(DialogContent, { className: "max-w-4xl max-h-[90vh] overflow-y-auto", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Create New User" }), _jsx(DialogDescription, { children: "Create a new user account with the appropriate role and details." })] }), _jsx(CreateUserForm, { onUserCreated: handleUserCreated, onClose: () => setIsCreateDialogOpen(false) })] })] })] })] }), _jsx(UserFilters, { searchTerm: searchTerm, setSearchTerm: setSearchTerm, roleFilter: roleFilter, setRoleFilter: setRoleFilter, statusFilter: statusFilter, setStatusFilter: setStatusFilter, onFiltersChange: handleFiltersChange }), _jsxs(Card, { children: [_jsx(UserTable, { users: users, onEdit: (user) => setEditingUser(user), onDelete: handleDeleteUser, onResetPassword: (user) => {
                            setResetPasswordUser(user);
                            setShowResetPasswordDialog(true);
                        }, onSendResetLink: (user) => {
                            if (!user.email) {
                                toast({ title: 'No email', description: 'Cannot generate reset link without an email', variant: 'destructive' });
                                return;
                            }
                            setResetLinkUser(user);
                            setGeneratedResetLink(null);
                            setShowResetLinkDialog(true);
                            sendResetLinkMutation.mutate({ email: user.email });
                        } }), isLoading && _jsx("div", { className: "text-center py-4", children: "Loading..." }), !isLoading && users.length === 0 && _jsx("div", { className: "text-center py-8 text-gray-500", children: "No users found." }), hasMore && (_jsx("div", { className: "text-center py-4", children: _jsx(Button, { onClick: handleLoadMore, disabled: isLoading, children: "Load More" }) }))] }), editingUser && (_jsx(EditUserForm, { user: editingUser, onUserUpdated: handleUserUpdated, onCancel: () => setEditingUser(null) })), _jsx(Dialog, { open: showResetPasswordDialog, onOpenChange: setShowResetPasswordDialog, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Reset Password" }), _jsxs(DialogDescription, { children: ["Enter a new password for ", resetPasswordUser === null || resetPasswordUser === void 0 ? void 0 : resetPasswordUser.name, ". This will immediately change their password."] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "newPassword", className: "block text-sm font-medium mb-2", children: "New Password" }), _jsx(Input, { id: "newPassword", type: "password", value: newPassword, onChange: (e) => setNewPassword(e.target.value), placeholder: "Enter new password" })] }), _jsxs("div", { className: "flex justify-end space-x-2", children: [_jsx(Button, { variant: "outline", onClick: () => {
                                                setShowResetPasswordDialog(false);
                                                setResetPasswordUser(null);
                                                setNewPassword('');
                                            }, children: "Cancel" }), _jsx(Button, { onClick: () => {
                                                if (resetPasswordUser && newPassword) {
                                                    resetPasswordMutation.mutate({
                                                        uid: resetPasswordUser.uid,
                                                        newPassword,
                                                    });
                                                }
                                            }, disabled: !newPassword || resetPasswordMutation.isPending, children: resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password' })] })] })] }) }), _jsx(Dialog, { open: showResetLinkDialog, onOpenChange: setShowResetLinkDialog, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Reset Link" }), _jsxs(DialogDescription, { children: ["A password reset link has been generated for ", resetLinkUser === null || resetLinkUser === void 0 ? void 0 : resetLinkUser.name, " (", resetLinkUser === null || resetLinkUser === void 0 ? void 0 : resetLinkUser.email, ")."] })] }), _jsx("div", { className: "space-y-4", children: sendResetLinkMutation.isPending ? (_jsx("div", { children: "Generating reset link\u2026" })) : (_jsxs(_Fragment, { children: [_jsx("p", { className: "font-mono text-xs break-all", children: generatedResetLink || '—' }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => {
                                                    setShowResetLinkDialog(false);
                                                    setResetLinkUser(null);
                                                    setGeneratedResetLink(null);
                                                }, children: "Close" }), _jsx(Button, { onClick: () => {
                                                    if (generatedResetLink) {
                                                        navigator.clipboard.writeText(generatedResetLink);
                                                        toast({ title: 'Copied', description: 'Reset link copied to clipboard' });
                                                    }
                                                }, children: "Copy Link" })] })] })) })] }) })] }));
}
