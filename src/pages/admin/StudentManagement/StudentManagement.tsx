// src/pages/admin/StudentManagement/StudentManagement.tsx
import { useCallback, useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@components/ui/card';
import { Button } from '@components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui/table';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { useToast } from '@components/hooks/use-toast';
import { Plus, X } from 'lucide-react';
import StudentBulkUploader from './StudentBulkUploader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';

type Kid = {
  id: string;
  name?: string;
  fullName?: string;
  displayName?: string;
  grade?: string;
  age?: number | string;
  parentId?: string | null;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  status?: string;
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any;
};

type ParentUser = {
  id: string;
  name?: string;
  displayName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  contactNumber?: string;
  role?: string;
  [key: string]: any;
};

export default function StudentManagement() {
  const [students, setStudents] = useState<Kid[]>([]);
  const [parentsMap, setParentsMap] = useState<Record<string, ParentUser>>({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'kids'));
      const arr: Kid[] = [];
      const parentIds = new Set<string>();

      snap.forEach((s) => {
        const data = { id: s.id, ...(s.data() as any) } as Kid;
        arr.push(data);
        if (data.parentId) {
          parentIds.add(String(data.parentId));
        }
      });

      setStudents(arr);

      // fetch linked parent user docs if any parentId references exist
      const pMap: Record<string, ParentUser> = {};
      if (parentIds.size > 0) {
        const usersSnap = await getDocs(collection(db, 'users'));
        usersSnap.forEach((u) => {
          if (parentIds.has(u.id)) {
            pMap[u.id] = { id: u.id, ...(u.data() as any) };
          }
        });
      }
      setParentsMap(pMap);
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Error',
        description: err?.message || 'Failed to load students',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // Run once on mount to load initial students list
    void fetchStudents();
  }, [fetchStudents]);

  const filtered = students.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();

    const studentName =
      s.name || s.fullName || s.displayName || '';
    const parentUser = s.parentId ? parentsMap[String(s.parentId)] : undefined;

    const parentDisplayName =
      parentUser?.name ||
      parentUser?.displayName ||
      parentUser?.fullName ||
      s.parentName ||
      s.parentEmail ||
      s.parentPhone ||
      '';

    const haystack =
      (studentName + ' ' + parentDisplayName).toLowerCase();

    return haystack.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center gap-3">
        <h2 className="text-2xl font-bold">Student Management</h2>
        <div className="flex gap-2">
          <StudentBulkUploader />
          <Button
            variant={showCreate ? 'outline' : 'default'}
            onClick={() => setShowCreate((v) => !v)}
          >
            {showCreate ? (
              <>
                <X className="h-4 w-4 mr-1" />
                Close Form
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Create New Student
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Create Student Form */}
      {showCreate && (
        <Card className="p-4">
          <CardHeader className="px-0 pt-0 pb-2">
            <CardTitle className="text-lg">
              New Student Details
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <CreateStudentForm
              onCreated={() => {
                void fetchStudents();
                setShowCreate(false);
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Search + List */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-semibold">All Students</h3>
            <p className="text-xs text-gray-500">
              View students, their grades, and linked parents. Course enrollments are managed in the Enrollment Management tab.
            </p>
          </div>
          <div className="w-64">
            <Input
              placeholder="Search by student or parent"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-8">
            Loading students…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No students found. Try adjusting your search or add a new
            student.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Parent Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => {
                  const name =
                    s.name ||
                    s.fullName ||
                    s.displayName ||
                    'Unnamed';

                  const parentUser = s.parentId
                    ? parentsMap[String(s.parentId)]
                    : undefined;

                  const parentName =
                    parentUser?.name ||
                    parentUser?.displayName ||
                    parentUser?.fullName ||
                    s.parentName ||
                    'Unknown';

                  const parentContact =
                    parentUser?.phone ||
                    parentUser?.mobile ||
                    parentUser?.contactNumber ||
                    parentUser?.email ||
                    s.parentEmail ||
                    s.parentPhone ||
                    '-';

                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        {name}
                      </TableCell>
                      <TableCell>{s.grade || '-'}</TableCell>
                      <TableCell>{s.age ?? '-'}</TableCell>
                      <TableCell>{parentName}</TableCell>
                      <TableCell>{parentContact}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}

/**
 * Inline Create Student form
 * - Now supports linking to an existing parent user (users collection) via parentId
 * - Still stores parentName, parentEmail, parentPhone for display
 */
function CreateStudentForm({
  onCreated,
}: {
  onCreated?: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [age, setAge] = useState<string>('');
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentId, setParentId] = useState<string | undefined>();
  const [parents, setParents] = useState<ParentUser[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadParents = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const arr: ParentUser[] = [];
        snap.forEach((u) =>
          arr.push({ id: u.id, ...(u.data() as any) }),
        );

        // prefer users with role="parent" but fall back if not present
        const parentCandidates =
          arr.filter((u) => u.role === 'parent') || arr;

        setParents(parentCandidates);
      } catch (err) {
        console.error('Failed to load parent users', err);
      }
    };

    void loadParents();
  }, []);

  const handleSelectParent = (id: string) => {
    setParentId(id);
    const p = parents.find((x) => x.id === id);
    if (p) {
      const displayName =
        p.name || p.displayName || p.fullName || '';

      // If manual fields are empty, prefill from parent user
      if (!parentName) setParentName(displayName);
      if (!parentEmail && p.email) setParentEmail(p.email);
      if (!parentPhone) {
        const phone =
          p.phone || p.mobile || p.contactNumber || '';
        if (phone) setParentPhone(phone);
      }
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter the student name.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      await addDoc(collection(db, 'kids'), {
        name: name.trim(),
        grade: grade.trim() || null,
        age: age ? Number(age) || age : null,
        parentId: parentId || null,
        parentName: parentName.trim() || null,
        parentEmail: parentEmail.trim() || null,
        parentPhone: parentPhone.trim() || null,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Student created',
        description: 'The student has been added to the list.',
      });

      setName('');
      setGrade('');
      setAge('');
      setParentId(undefined);
      setParentName('');
      setParentEmail('');
      setParentPhone('');

      onCreated?.();
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Error',
        description: err?.message || 'Failed to create student',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Student name */}
      <div className="space-y-1">
        <Label>Student Name *</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Aarav Sharma"
        />
      </div>

      {/* Grade */}
      <div className="space-y-1">
        <Label>Grade / Class</Label>
        <Input
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          placeholder="e.g., Grade 3"
        />
      </div>

      {/* Age */}
      <div className="space-y-1">
        <Label>Age</Label>
        <Input
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="e.g., 7"
        />
      </div>

      {/* Link to parent account */}
      <div className="space-y-1">
        <Label>Link to Parent Account (optional)</Label>
        <Select
          value={parentId}
          onValueChange={(v) => handleSelectParent(v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select existing parent (if any)" />
          </SelectTrigger>
          <SelectContent>
            {parents.map((p) => {
              const displayName =
                p.name || p.displayName || p.fullName || 'Unnamed';
              const email = p.email || '';
              return (
                <SelectItem key={p.id} value={p.id}>
                  {displayName}
                  {email ? ` — ${email}` : ''}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">
          This links the child to a parent user (from the users collection) so enrollments and dashboards show correct parent details.
        </p>
      </div>

      {/* Parent name */}
      <div className="space-y-1">
        <Label>Parent Name (display)</Label>
        <Input
          value={parentName}
          onChange={(e) => setParentName(e.target.value)}
          placeholder="e.g., Priya R."
        />
      </div>

      {/* Parent email */}
      <div className="space-y-1">
        <Label>Parent Email</Label>
        <Input
          type="email"
          value={parentEmail}
          onChange={(e) => setParentEmail(e.target.value)}
          placeholder="e.g., parent@example.com"
        />
      </div>

      {/* Parent phone */}
      <div className="space-y-1">
        <Label>Parent Phone</Label>
        <Input
          value={parentPhone}
          onChange={(e) => setParentPhone(e.target.value)}
          placeholder="e.g., +91 9xxxx xxxxx"
        />
      </div>

      <div className="col-span-1 md:col-span-2 flex justify-end gap-2 mt-2">
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving…' : 'Save Student'}
        </Button>
      </div>
    </div>
  );
}
