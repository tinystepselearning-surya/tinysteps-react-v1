import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, getDocs, query, where, setDoc, doc, serverTimestamp, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@components/ui/form';
import { toast } from '@components/hooks/use-toast';
import { User } from '../../../types/User';
import { Student } from '../../../types/Student';

const createStudentSchema = z.object({
  parentId: z.string().min(1, 'Select a parent'),
  fullName: z.string().min(2, 'Name required'),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  grade: z.string().min(1, 'Select grade'),
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

  const form = useForm<FormData>({
    // zodResolver generic typing can be strict in some RHF versions; cast to any to avoid incompat issues
    resolver: (zodResolver(createStudentSchema) as unknown) as any,
    defaultValues: { parentId: defaultParentId || '', fullName: '', dob: '', grade: '', status: 'active' },
  });

  useEffect(() => {
    // load parents
    const loadParents = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'parent'));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as User[];
        setParents(list);
      } catch (err) {
        console.error(err);
        toast({ title: 'Error', description: 'Failed to load parents', variant: 'destructive' });
      }
    };
    if (open) loadParents();
    // If defaultParentId is provided, set form value
    if (open && defaultParentId) {
      form.setValue('parentId', defaultParentId);
    }
  }, [open]);

  const onSubmit = async (values: FormData) => {
    try {
      const studentRef = doc(collection(db, 'kids'));
      const payload: Partial<Student> = {
        fullName: values.fullName,
        dob: values.dob,
        grade: values.grade,
        parentIds: [values.parentId],
        primaryParentId: values.parentId,
        status: values.status as any,
        summary: {
          phonicsMastery: 0,
          grammarMastery: 0,
          speakingMastery: 0,
          attendanceRate30d: 0,
          creditsRemaining: 0,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(studentRef, payload);

      // Update parent user document to include this kid id
      try {
        if (values.parentId) {
          await updateDoc(doc(db, 'users', values.parentId), { childIds: arrayUnion(studentRef.id), updatedAt: serverTimestamp() } as any);
        }
      } catch (err) {
        // ignore if update failed; admin can fix manually
      }

      toast({ title: 'Student created', description: `${values.fullName} created successfully` });
      setOpen(false);
      form.reset();
      onStudentCreated?.(studentRef.id);
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error', description: err.message || 'Failed to create student', variant: 'destructive' });
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
          <DialogDescription>Fill in basic information to create a new student profile and associate it with a parent.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Primary Parent</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent" />
                      </SelectTrigger>
                      <SelectContent>
                        {parents.map(p => (
                          <SelectItem key={p.uid || p.id} value={p.uid || p.id}>
                            {p.email} — {p.name || p.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
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

            <FormField
              control={form.control}
              name="dob"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">Create</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateStudentForm;
