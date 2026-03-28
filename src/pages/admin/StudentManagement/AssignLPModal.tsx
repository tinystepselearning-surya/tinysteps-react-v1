import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { updateKid } from '../../../services/kidsService';
import { toast } from '@components/hooks/use-toast';
import { Student } from '../../../types/Student';
import { useAuthStore } from '../../../store/useAuthStore';
import { Enrollment } from '../../../types/Enrollment';
import { Input } from '@components/ui/input';

interface Props {
  student: Student;
  onClose: () => void;
  onAssigned?: () => void;
}

type LPUser = {
  id: string;
  uid?: string;
  name?: string;
  email?: string;
  [key: string]: any;
};

type CourseDoc = {
  id: string;
  title?: string;
  name?: string;
  [key: string]: any;
};

export default function AssignLPModal({
  student,
  onClose,
  onAssigned,
}: Props) {
  const [lps, setLps] = useState<LPUser[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<CourseDoc[]>([]);
  const [courseMap, setCourseMap] = useState<Record<string, string>>({});
  const [selectedEnrollment, setSelectedEnrollment] = useState<string>('');
  const [selectedLP, setSelectedLP] = useState<string>('');
  const [canAssign, setCanAssign] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);

  const { user } = useAuthStore();

  // Safe display name for student
  const studentName =
    (student as any).fullName ||
    (student as any).name ||
    (student as any).displayName ||
    student.id;

  useEffect(() => {
    const load = async () => {
      try {
        // Load LPs
        const lpQ = query(
          collection(db, 'users'),
          where('role', '==', 'learningPartner'),
        );
        const lpSnap = await getDocs(lpQ);
        setLps(
          lpSnap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          })) as LPUser[],
        );

        // Load enrollments for this student (canonical + legacy identifiers)
        const [studentSnap, kidSnap, kidIdsSnap] = await Promise.all([
          getDocs(
            query(
              collection(db, 'enrollments'),
              where('studentId', '==', student.id),
            ),
          ),
          getDocs(
            query(
              collection(db, 'enrollments'),
              where('kidId', '==', student.id),
            ),
          ),
          getDocs(
            query(
              collection(db, 'enrollments'),
              where('kidIds', 'array-contains', student.id),
            ),
          ),
        ]);
        const enrollmentMap = new Map<string, Enrollment>();
        [studentSnap, kidSnap, kidIdsSnap].forEach((snap) => {
          snap.docs.forEach((d) => {
            enrollmentMap.set(d.id, {
              id: d.id,
              ...(d.data() as any),
            } as Enrollment);
          });
        });
        setEnrollments(Array.from(enrollmentMap.values()));

        // Load courses and build a lookup map
        const cSnap = await getDocs(collection(db, 'courses'));
        const cList: CourseDoc[] = cSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setCourses(cList);

        const cMap: Record<string, string> = {};
        cList.forEach((c) => {
          cMap[c.id] = c.title || c.name || c.id;
        });
        setCourseMap(cMap);
      } catch (err) {
        console.error(err);
        toast({
          title: 'Error',
          description: 'Failed to load data',
          variant: 'destructive',
        });
      }
    };

    void load();
  }, [student.id]);

  useEffect(() => {
    // Only Admins can assign LPs to a student (for now)
    setCanAssign(user?.role === 'admin');
  }, [user]);

  const handleAssign = async () => {
    if (!selectedEnrollment) {
      toast({
        title: 'Select enrollment',
        description: 'Please select an enrollment (course).',
      });
      return;
    }
    if (!selectedLP) {
      toast({
        title: 'Select LP',
        description: 'Please select a Learning Partner.',
      });
      return;
    }

    if (!canAssign) {
      toast({
        title: 'Not authorized',
        description:
          'You do not have permission to assign a Learning Partner. Only Admins can do this.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      // Update the enrollment with LP
      const enrRef = doc(db, 'enrollments', selectedEnrollment);
      await updateDoc(enrRef, {
        lpId: selectedLP,
        status: 'active',
        updatedAt: serverTimestamp(),
      } as any);

      // Update the kid's lpId (primary LP)
      await updateKid(student.id as string, {
        lpId: selectedLP,
      } as any);

      toast({
        title: 'Assigned',
        description: 'Learning Partner assigned successfully.',
      });
      onAssigned?.();
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'permission-denied') {
        toast({
          title: 'Permission denied',
          description:
            'You do not have permission to assign a Learning Partner. Please contact an Admin.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: err.message || 'Failed to assign Learning Partner',
          variant: 'destructive',
        });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            Assign Learning Partner for {studentName}
          </DialogTitle>
          <DialogDescription>
            Assign a Learning Partner to the student’s enrollment. Only
            Admins can set a Learning Partner for a student.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Enrollment (Course) selection */}
          <div>
            <Select
              value={selectedEnrollment}
              onValueChange={setSelectedEnrollment}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select enrollment (course)" />
              </SelectTrigger>
              <SelectContent>
                {enrollments.map((e) => {
                  const courseId =
                    (e as any).courseId ||
                    (e as any).course_id ||
                    (e as any).course;
                  const label =
                    courseMap[courseId] || courseId || e.id;

                  return (
                    <SelectItem key={e.id} value={e.id}>
                      {label} — {e.status}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* LP search */}
          <div className="flex gap-2">
            <Input
              className="flex-1"
              placeholder="Search LP by name or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* LP selection */}
          <div>
            <Select
              value={selectedLP}
              onValueChange={setSelectedLP}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Learning Partner" />
              </SelectTrigger>
              <SelectContent>
                {lps
                  .filter((lp) => {
                    if (!searchTerm) return true;
                    const s = (
                      lp.name ||
                      lp.email ||
                      ''
                    ).toLowerCase();
                    return s.includes(searchTerm.toLowerCase());
                  })
                  .map((l) => (
                    <SelectItem
                      key={l.uid || l.id}
                      value={l.uid || l.id}
                    >
                      {l.name || l.email || l.id}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {!canAssign && (
            <p className="text-xs text-red-500">
              You are not authorized to assign a Learning Partner.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!canAssign || saving}
          >
            {saving
              ? 'Assigning…'
              : canAssign
              ? 'Assign LP'
              : 'Not Authorized'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
