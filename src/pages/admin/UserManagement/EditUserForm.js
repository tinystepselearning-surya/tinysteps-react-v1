var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { httpsCallable } from 'firebase/functions';
import { doc, updateDoc } from 'firebase/firestore';
import { functions, db } from '../../../lib/firebaseConfig';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@components/ui/form';
import { toast } from '@components/hooks/use-toast';
const editUserSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    role: z.enum(['admin', 'teacher', 'parent', 'learningPartner', 'kid']),
    status: z.enum(['active', 'suspended', 'archived']),
});
export function EditUserForm({ user, onUserUpdated, onCancel }) {
    const form = useForm({
        resolver: zodResolver(editUserSchema),
        defaultValues: {
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            role: user.role,
            status: user.status,
        },
    });
    const { handleSubmit, formState: { isSubmitting }, reset } = form;
    useEffect(() => {
        reset({
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            role: user.role,
            status: user.status,
        });
    }, [user, reset]);
    const onSubmit = (data) => __awaiter(this, void 0, void 0, function* () {
        try {
            // Update user document in Firestore
            const userRef = doc(db, 'users', user.id);
            yield updateDoc(userRef, {
                name: data.name,
                email: data.email,
                phone: data.phone || null,
                role: data.role,
                status: data.status,
                updatedAt: new Date(),
            });
            // If email changed, we need to update Firebase Auth
            if (data.email !== user.email) {
                const updateUserEmail = httpsCallable(functions, 'adminUpdateUserEmail');
                yield updateUserEmail({
                    uid: user.uid,
                    email: data.email,
                });
            }
            toast({
                title: 'Success',
                description: 'User updated successfully',
            });
            onUserUpdated();
        }
        catch (error) {
            console.error('Error updating user:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to update user',
                variant: 'destructive',
            });
        }
    });
    return (_jsx(Dialog, { open: true, onOpenChange: onCancel, children: _jsxs(DialogContent, { className: "sm:max-w-[425px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Edit User" }), _jsx(DialogDescription, { children: "Edit the user's profile information, role and status. Be careful when changing roles as it may affect permissions." })] }), _jsx(Form, Object.assign({}, form, { children: _jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-4", children: [_jsx(FormField, { control: form.control, name: "name", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Full Name" }), _jsx(FormControl, { children: _jsx(Input, Object.assign({ placeholder: "Full Name" }, field)) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "email", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Email" }), _jsx(FormControl, { children: _jsx(Input, Object.assign({ type: "email", placeholder: "email@example.com" }, field)) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "phone", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Phone (Optional)" }), _jsx(FormControl, { children: _jsx(Input, Object.assign({ placeholder: "+1 (555) 123-4567" }, field)) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "role", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Role" }), _jsx(FormControl, { children: _jsxs(Select, { value: field.value, onValueChange: field.onChange, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select a role" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "admin", children: "Admin" }), _jsx(SelectItem, { value: "teacher", children: "Teacher" }), _jsx(SelectItem, { value: "parent", children: "Parent" }), _jsx(SelectItem, { value: "learningPartner", children: "Learning Partner" }), _jsx(SelectItem, { value: "kid", children: "Kid" })] })] }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "status", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Status" }), _jsx(FormControl, { children: _jsxs(Select, { value: field.value, onValueChange: field.onChange, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select status" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "active", children: "Active" }), _jsx(SelectItem, { value: "suspended", children: "Suspended" }), _jsx(SelectItem, { value: "archived", children: "Archived" })] })] }) }), _jsx(FormMessage, {})] })) }), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "button", variant: "outline", onClick: onCancel, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: isSubmitting, children: isSubmitting ? 'Updating...' : 'Update User' })] })] }) }))] }) }));
}
