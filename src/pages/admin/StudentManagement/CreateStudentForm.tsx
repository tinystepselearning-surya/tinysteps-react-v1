// src/pages/admin/StudentManagement/CreateStudentForm.tsx
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, getDocs, query, where } from 'firebase/firestore';

import { db } from '../../../lib/firebaseConfig';
import { createKid } from '../../../services/kidsService';

import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@components/ui/form';
import { toast } from '@components/hooks/use-toast';

import { User } from '../../../types/User';

const createStudentSchema = z.object({
  parentId: z.string().min(1, 'Select a parent'),
  fullName: z.string().min(2, 'Name required'),

  // ✅ Age in years (2–15), stored as number
  ageYears: z.preprocess(
    (v) => {
      // RHF Input gives string; convert safely to number
      if (v === '' || v === null || v === undefined) return undefined;
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    },
    // ✅ FIX: your zod version doesn't support required_error
    z
      .number({ message: 'Age required' })
      .int('Age must be a whole number')
      .min(2, 'Age must be at least 2')
      .max(15, 'Age must be 15 or less'),
  ),

  grade: z.string().min(1, 'Select grade'),

  // With default() zod makes this optional in the TS type
  status: z.enum(['active', 'suspended', 'archived']).default('active'),
});

type FormData = z.infer<typeof createStudentSchema>;

interface Props {
  onStudentCreated?: (studentId: string) => void;
  defaultParentId?: string | null;
}

export function CreateStudentForm({ onStudentCreated, defaultParentId }: Props) {
  const [open, setOpen] = useState(false);
  const [parents, setParents] = useState<User[]>([]);

  // NOTE: we don't pass a generic here; we also cast resolver to any.
  // This avoids the Control<TFieldValues> / Resolver<TFieldValues> conflict
  // you’re seeing with your RHF + resolver versions.
  const form = useForm({
    resolver: zodResolver(createStudentSchema) as any,
    defaultValues: {
      parentId: defaultParentId || '',
      fullName: '',
      ageYears: '' as any, // start empty, validated by schema on submit
      grade: '',
      status: 'active',
    } as any,
  });

  const { isSubmitting } = form.formState;

  // Load parents when dialog opens
  useEffect(() => {
    if (!open) return;

    const loadParents = async () => {
      try {
        const qParents = query(
          collection(db, 'users'),
          where('role', '==', 'parent'),
        );
        const snap = await getDocs(qParents);
        const allParents = snap.docs.map(
          (d) => ({ id: d.id, ...(d.data() as any) }) as User,
        );
        setParents(allParents);
      } catch (err) {
        console.error(err);
        toast({
          title: 'Error',
          description: 'Failed to load parents',
          variant: 'destructive',
        });
      }
    };

    void loadParents();
  }, [open]);

  // Apply defaultParentId when opening or when prop changes
  useEffect(() => {
    if (open && defaultParentId) {
      form.setValue('parentId', defaultParentId as any);
    }
  }, [open, defaultParentId, form]);

  const onSubmit = async (values: FormData) => {
    try {
      const status = values.status ?? 'active';

      // ✅ IMPORTANT: Do NOT send dob at all (no undefined either)
      const payload: any = {
        fullName: values.fullName,
        ageYears: values.ageYears,
        grade: values.grade,
        parentIds: [values.parentId],
        primaryParentId: values.parentId,
        status,
        summary: {
          phonicsMastery: 0,
          grammarMastery: 0,
          speakingMastery: 0,
          attendanceRate30d: 0,
          creditsRemaining: 0,
        },
      };

      const newKidId = await createKid(payload);

      toast({
        title: 'Student created',
        description: `${values.fullName} created successfully`,
      });

      setOpen(false);
      form.reset({
        parentId: defaultParentId || '',
        fullName: '',
        ageYears: '' as any,
        grade: '',
        status: 'active',
      } as any);

      onStudentCreated?.(newKidId);
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to create student',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Student</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Student</DialogTitle>
          <DialogDescription>
            Fill in basic information to create a new student profile and associate it with a parent.
            <br />
            <span className="text-xs text-muted-foreground">
              We only ask for age (years). Date of birth is not required.
            </span>
          </DialogDescription>
        </DialogHeader>

        <Form {...(form as any)}>
          <form
            onSubmit={form.handleSubmit((values) => onSubmit(values as any))}
            className="space-y-4"
          >
            {/* Parent */}
            <FormField
              control={form.control as any}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Primary Parent</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent" />
                      </SelectTrigger>
                      <SelectContent>
                        {parents.map((p) => {
                          const id = (p as any).id || (p as any).uid;
                          const labelName = p.name || p.email;
                          return (
                            <SelectItem key={id} value={id}>
                              {p.email} — {labelName}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Full name */}
            <FormField
              control={form.control as any}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Child Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ✅ Age (years) */}
            <FormField
              control={form.control as any}
              name="ageYears"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age (years)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={2}
                      max={15}
                      step={1}
                      placeholder="e.g., 5"
                      value={(field.value ?? '') as any}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Grade */}
            <FormField
              control={form.control as any}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pre-K">Pre-K</SelectItem>
                        <SelectItem value="KG">KG</SelectItem>
                        <SelectItem value="Grade 1">Grade 1</SelectItem>
                        <SelectItem value="Grade 2">Grade 2</SelectItem>
                        <SelectItem value="Grade 3">Grade 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Footer actions */}
            <DialogFooter className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating…' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateStudentForm;
