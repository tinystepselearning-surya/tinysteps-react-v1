import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../lib/firebaseConfig';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@components/ui/form';
import { toast } from '@components/hooks/use-toast';
import { User } from '../../../types/User';
import {
  AUTH_ROLES,
  normalizeAuthRole,
} from '../../../constants/roles';

const editUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  role: z.enum(AUTH_ROLES),
  status: z.enum(['active', 'suspended', 'archived']),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

interface EditUserFormProps {
  user: User;
  onUserUpdated: () => void;
  onCancel: () => void;
}

const normalizeRoleForForm = (
  role: string,
): EditUserFormData['role'] =>
  normalizeAuthRole(role) ?? 'parent';

export function EditUserForm({ user, onUserUpdated, onCancel }: EditUserFormProps) {
  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: normalizeRoleForForm(user.role),
      status: user.status,
    },
  });

  const { handleSubmit, formState: { isSubmitting }, reset } = form;

  useEffect(() => {
    reset({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: normalizeRoleForForm(user.role),
      status: user.status,
    });
  }, [user, reset]);

  const onSubmit = async (data: EditUserFormData) => {
    try {
      const targetUid = user.uid || user.id;
      const updateUserFn = httpsCallable(functions, 'adminUpdateUser');
      const result = await updateUserFn({
        uid: targetUid,
        displayName: data.name,
        email: data.email,
        phone: data.phone || null,
        role: data.role,
        status: data.status,
      });

      const payload = result.data as { success?: boolean; error?: string } | undefined;
      if (payload?.success === false) {
        throw new Error(payload.error || 'Failed to update user');
      }

      toast({
        title: 'Success',
        description: 'User updated successfully',
      });

      onUserUpdated();
    } catch (error: any) {
      console.error('Error updating user:', error);
      const code = error?.code || error?.status || null;
      let description = error?.message || 'Failed to update user';
      if (code === 'permission-denied' || /admin/i.test(description)) {
        description = 'You do not have permission to update users.';
      } else if (code === 'already-exists' || /already exists|already taken|not available/i.test(description)) {
        if (/phone/i.test(description)) {
          description = 'This phone number is already in use. Please use a different phone number.';
        } else {
          description = 'This user ID is already taken or not available. Please try another user ID.';
        }
      }
      toast({
        title: 'Error',
        description,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Edit the user's profile information, role and status. Be careful when changing roles as it may affect permissions.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Full Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User ID / Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="learningPartner">Learning Partner</SelectItem>
                        <SelectItem value="schoolAdmin">School Admin</SelectItem>
                        <SelectItem value="kid">Kid</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update User'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
