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
import { Input } from '@components/ui/input';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { updateKid } from '../../../services/kidsService';
import { toast } from '@components/hooks/use-toast';
import { Student } from '../../../types/Student';
import { useAuthStore } from '../../../store/useAuthStore';
import { Enrollment } from '../../../types/Enrollment';

interface Props {
  student: Student;
  onClose: () => void;
  onAssigned?: () => void;
}

type TeacherUser = {
  id: string;
  uid?: string;
  name?: string;
  email?: string;
  specializations?: string[];
  [key: string]: any;
};

type CourseDoc = {
  id: string;
  title?: string;
  name?: string;
  [key: string]: any;
};

export default function AssignTeacherModal({
  student,
  onClose,
  onAssigned,
}: Props) {
  const [teachers, setTeachers] = useState<TeacherUser[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [specialization, setSpecialization] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<CourseDoc[]>([]);
  const [courseMap, setCourseMap] = useState<Record<string, string>>({});
  const [selectedEnrollment, setSelectedEnrollment] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [canAssign, setCanAssign] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);

  const { user } = useAuthStore();

  const studentName =
    (student as any).fullName ||
    (student as any).name ||
    (student as any).displayName ||
    student.id;

  useEffect(() => {
    const load = async () => {
      try {
        // Teachers
        const tQ = query(
          collection(db, 'users'),
          where('role', '==', 'teacher'),
        );
        const tSnap = await getDocs(tQ);
        setTeachers(
          tSnap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          })) as TeacherUser[],
        );

        // Enrollments for this student
        const eQ = query(
          collection(db, 'enrollments'),
          where('studentId', '==', student.id),
        );
        const eSnap = await getDocs(eQ);
        setEnrollments(
          eSnap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          })) as Enrollment[],
        );

        // Courses + mapping
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
    const check = async () => {
      if (!user) {
        setCanAssign(false);
        return;
      }

      if (user.role === 'admin') {
        setCanAssign(true);
        return;
      }

      if (user.role === 'learningPartner') {
        const studentDoc = await getDoc(doc(db, 'kids', student.id));
        const lpId = studentDoc.exists()
          ? (studentDoc.data() as any).lpId
          : undefined;
        setCanAssign(lpId === user.uid);
        return;
      }

      // Teachers (for now) cannot assign themselves or others
      setCanAssign(false);
    };

    void check();
  }, [user, student.id]);

  const handleAssign = async () => {
    if (!selectedEnrollment) {
      toast({
        title: 'Select enrollment',
        description: 'Please select an enrollment (course).',
      });
      return;
    }
    if (!selectedTeacher) {
      toast({
        title: 'Select teacher',
        description: 'Please select a teacher.',
      });
      return;
    }

    if (!canAssign) {
      toast({
        title: 'Not authorized',
        description:
          'You do not have permission to assign teachers. Only Admins and the assigned Learning Partner can do this.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      // Update enrollment
      const enrRef = doc(db, 'enrollments', selectedEnrollment);
      await updateDoc(enrRef, {
        teacherId: selectedTeacher,
        status: 'active',
        updatedAt: serverTimestamp(),
      } as any);

      // Update the kid's teacherId
      await updateKid(student.id as string, {
        teacherId: selectedTeacher,
      } as any);

      toast({
        title: 'Assigned',
        description: 'Teacher assigned successfully.',
      });
      onAssigned?.();
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'permission-denied') {
        toast({
          title: 'Permission denied',
          description:
            'You do not have permission to assign teachers. Please contact an Admin or the assigned Learning Partner.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: err.message || 'Failed to assign teacher',
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
            Assign Teacher for {studentName}
          </DialogTitle>
          <DialogDescription>
            Select an enrollment and a teacher to assign. Admins and
            Learning Partners can update teacher assignments for students
            under their supervision. Assigning a teacher activates the enrollment.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Search + specialization filter */}
          <div className="flex gap-2">
            <Input
              className="flex-1"
              placeholder="Search teachers by name or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select
              value={specialization || '__all__'}
              onValueChange={(v) =>
                setSpecialization(v === '__all__' ? null : v)
              }
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Specialization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                {Array.from(
                  new Set(
                    teachers.flatMap(
                      (t) => (t.specializations as string[]) || [],
                    ),
                  ),
                ).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Enrollment selection */}
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

          {/* Teacher selection */}
          <div>
            <Select
              value={selectedTeacher}
              onValueChange={setSelectedTeacher}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers
                  .filter((t) => {
                    if (
                      specialization &&
                      !(
                        t.specializations || []
                      ).includes(specialization)
                    )
                      return false;
                    if (searchTerm) {
                      const str = (
                        t.name ||
                        t.email ||
                        ''
                      ).toLowerCase();
                      return str.includes(
                        searchTerm.toLowerCase(),
                      );
                    }
                    return true;
                  })
                  .map((t) => (
                    <SelectItem
                      key={t.uid || t.id}
                      value={t.uid || t.id}
                    >
                      {t.name || t.email || t.id}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {!canAssign && (
            <p className="text-xs text-red-500">
              You are not authorized to assign teachers for this student.
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
              ? 'Assign Teacher'
              : 'Not Authorized'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
