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
  setDoc,
  doc,
  serverTimestamp,
  getDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { useCourses } from '../../../hooks/useData';
import { toast } from '@components/hooks/use-toast';
import { Student } from '../../../types/Student';
import { useAuthStore } from '../../../store/useAuthStore';

interface Props {
  student: Student;
  onClose: () => void;
  onAssigned?: () => void;
}

type Course = {
  id: string;
  name?: string;
  title?: string;
  level?: string;
  area?: string;
  levelName?: string;
  status?: string;
  feePerClass?: number;
  ratePerSession?: number;
  sessionFrequency?: string;
};

const defaultCourses = [
  'Phonics Foundations',
  'Early Phonics',
  'Advanced Phonics',
  'Basic Grammar',
  'Advanced Grammar',
  'Public Speaking (Basic)',
  'Public Speaking (Advanced)',
];

// simple helper to estimate credits for a monthly cycle
const sessionsPerMonthForFrequency = (freq?: string) => {
  switch (freq) {
    case 'weekly':
      return 4;
    case 'biweekly':
      return 2;
    case 'monthly':
      return 1;
    default:
      return 4;
  }
};

export default function AssignCourseModal({
  student,
  onClose,
  onAssigned,
}: Props) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [lpCanAssign, setLpCanAssign] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [feePerClassInput, setFeePerClassInput] = useState<string>('');
  const [teacherPayPerSessionInput, setTeacherPayPerSessionInput] = useState<string>('');

  const { user } = useAuthStore();

  // Derive a safe display name without touching unknown typed fields
  const studentName =
    (student as any).fullName ||
    (student as any).name ||
    (student as any).displayName ||
    student.id;

  // Admin can always assign — no async needed. LP needs a Firestore check.
  const isAdmin = user?.role === 'admin';
  const canAssign = isAdmin || lpCanAssign === true;

  // Load courses from hook (only active by default); keep fallback if none
  const { data: fetchedCourses = [], isLoading: coursesLoading } = useCourses({ status: 'active' });

  useEffect(() => {
    if (Array.isArray(fetchedCourses) && fetchedCourses.length > 0) {
      setCourses(fetchedCourses as any);
      return;
    }

    // In development only: fallback to defaults when no courses exist so dev flows keep working
    if (import.meta.env?.DEV) {
      const mapped: Course[] = defaultCourses.map((title) => ({
        id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        title,
        status: 'active',
      }));
      setCourses(mapped);
      return;
    }

    // In production/non-DEV: explicitly show empty list (no fallback)
    setCourses([]);
  }, [fetchedCourses]);

  const normalizeArea = (value?: string) => {
    const v = String(value || '').toLowerCase().trim();
    if (v.includes('phonics')) return 'phonics';
    if (v.includes('grammar')) return 'grammar';
    if (v.includes('speaking') || v.includes('speech') || v.includes('public')) return 'speaking';
    return v;
  };

  const normalizeLevel = (value?: string) => {
    const v = String(value || '').toLowerCase().trim();
    if (v.includes('foundation')) return 'foundations';
    if (v.includes('early')) return 'early';
    if (v.includes('basic')) return 'basic';
    if (v.includes('intermediate')) return 'intermediate';
    if (v.includes('advanced')) return 'advanced';
    return v;
  };

  const sortedCourses = React.useMemo(() => {
    const areaOrder = ['phonics', 'grammar', 'speaking'];
    const levelOrderByArea: Record<string, string[]> = {
      phonics: ['foundations', 'early', 'advanced'],
      grammar: ['basic', 'advanced'],
      speaking: ['basic', 'advanced'],
    };

    // Filter out intermediate-level grammar and speaking courses.
    // Business rule: Only basic → advanced progression is offered for these areas.
    // Intermediate tier is not part of the active curriculum offering.
    const filteredCourses = courses.filter((course) => {
      const id = String(course.id || '').toLowerCase();
      if (id.includes('intermediate-grammar') || id.includes('intermediate-public-speaking')) return false;
      const level = normalizeLevel(course.level || course.levelName);
      const area = normalizeArea(course.area);
      if ((area === 'grammar' || area === 'speaking') && level === 'intermediate') return false;
      return true;
    });

    return [...filteredCourses].sort((a, b) => {
      const areaA = normalizeArea(a.area);
      const areaB = normalizeArea(b.area);
      const areaIdxA = areaOrder.indexOf(areaA);
      const areaIdxB = areaOrder.indexOf(areaB);
      if (areaIdxA !== areaIdxB) {
        return (areaIdxA === -1 ? 999 : areaIdxA) - (areaIdxB === -1 ? 999 : areaIdxB);
      }

      const levelA = normalizeLevel(a.level || a.levelName);
      const levelB = normalizeLevel(b.level || b.levelName);
      const levelOrder = levelOrderByArea[areaA] || [];
      const levelIdxA = levelOrder.indexOf(levelA);
      const levelIdxB = levelOrder.indexOf(levelB);
      if (levelIdxA !== levelIdxB) {
        return (levelIdxA === -1 ? 999 : levelIdxA) - (levelIdxB === -1 ? 999 : levelIdxB);
      }

      const nameA = (a.name || a.title || a.id || '').toLowerCase();
      const nameB = (b.name || b.title || b.id || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [courses]);

  // For LP role: check if this LP is assigned to the student (async Firestore check).
  // Admin authorization is derived synchronously from user.role above.
  useEffect(() => {
    if (!user || !student) return;
    if (user.role !== 'learningPartner') return;

    const check = async () => {
      try {
        const studentDoc = await getDoc(doc(db, 'kids', student.id));
        const data = studentDoc.exists()
          ? (studentDoc.data() as any)
          : (student as any);

        const lpId = data.lpId || data.primaryLpId || (student as any).lpId;
        setLpCanAssign(lpId === user.uid);
      } catch (err) {
        console.error(err);
        setLpCanAssign(false);
      }
    };

    void check();
  }, [user, student]);

  useEffect(() => {
    if (!selected) {
      setFeePerClassInput('');
      setTeacherPayPerSessionInput('');
      return;
    }
    const selectedCourse = courses.find((c) => c.id === selected);
    if (!selectedCourse) {
      setFeePerClassInput('');
      setTeacherPayPerSessionInput('');
      return;
    }
    const rawDefault =
      selectedCourse.feePerClass ??
      selectedCourse.ratePerSession ??
      0;
    const defaultFee = Number(rawDefault);
    if (Number.isFinite(defaultFee) && defaultFee > 0) {
      setFeePerClassInput(String(defaultFee));
    } else {
      setFeePerClassInput('');
    }
  }, [selected, courses]);

  const handleAssign = async () => {
    if (!selected) {
      toast({
        title: 'Select a course',
        description: 'Please choose a course before assigning.',
      });
      return;
    }

    if (!canAssign) {
      toast({
        title: 'Not authorized',
        description:
          'You do not have permission to assign a course to this student.',
        variant: 'destructive',
      });
      return;
    }

    const feePerClass = Number(feePerClassInput);
    if (!Number.isFinite(feePerClass) || feePerClass <= 0) {
      toast({
        title: 'Fee per class required',
        description: 'Enter a valid fee per class before assigning.',
        variant: 'destructive',
      });
      return;
    }

    const rawTeacherPay = Number(teacherPayPerSessionInput);
    const teacherPayPerSession =
      Number.isFinite(rawTeacherPay) && rawTeacherPay > 0 ? rawTeacherPay : 0;

    try {
      setSaving(true);

      // Prevent duplicate enrollment for same student + course across canonical + legacy fields.
      const [existingByStudentId, existingByKidId, existingByKidIds] = await Promise.all([
        getDocs(
          query(
            collection(db, 'enrollments'),
            where('studentId', '==', student.id),
            where('courseId', '==', selected),
          ),
        ),
        getDocs(
          query(
            collection(db, 'enrollments'),
            where('kidId', '==', student.id),
            where('courseId', '==', selected),
          ),
        ),
        getDocs(
          query(
            collection(db, 'enrollments'),
            where('kidIds', 'array-contains', student.id),
            where('courseId', '==', selected),
          ),
        ),
      ]);
      if (!existingByStudentId.empty || !existingByKidId.empty || !existingByKidIds.empty) {
        toast({
          title: 'Already assigned',
          description:
            'This course is already assigned to the student.',
          variant: 'destructive',
        });
        return;
      }

      // Read primary parent from kid doc
      const studentDoc = await getDoc(doc(db, 'kids', student.id));
      const studentData = studentDoc.exists()
        ? (studentDoc.data() as any)
        : (student as any);

      const primaryParentId =
        studentData.primaryParentId ||
        studentData.parentId ||
        (student as any).primaryParentId ||
        (student as any).parentId ||
        null;

      const selectedCourse = courses.find((c) => c.id === selected);
      const sessionFrequency =
        selectedCourse?.sessionFrequency || 'weekly';
      const sessionsPerMonth =
        sessionsPerMonthForFrequency(sessionFrequency);
      const billingCycle: 'monthly' = 'monthly';
      const creditsTotal = sessionsPerMonth; // 1-month worth of sessions
      const parentIds = Array.isArray(studentData.parentIds)
        ? studentData.parentIds.map(String).filter(Boolean)
        : [];
      if (primaryParentId && !parentIds.includes(primaryParentId)) {
        parentIds.push(primaryParentId);
      }

      const enrollmentRef = doc(collection(db, 'enrollments'));

      await setDoc(enrollmentRef, {
        enrollmentId: enrollmentRef.id,
        studentId: student.id,
        kidId: student.id,
        kidIds: [student.id],
        courseId: selected,
        teacherId: null,
        teacherIds: [],
        lpId: null,
        parentId: primaryParentId,
        parentIds,
        status: 'trial',
        feePerClass,
        ratePerSession: feePerClass,
        teacherPayPerSession,
        currency: 'INR',
        billingCycle,
        creditsTotal,
        creditsUsed: 0,
        creditsRemaining: creditsTotal,
        topicProgress: {},
        enrollmentDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user?.uid || null,
      });

      toast({
        title: 'Assigned',
        description: 'Course assigned to student.',
      });
      onAssigned?.();
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'permission-denied') {
        toast({
          title: 'Permission denied',
          description:
            'You do not have permission to create enrollments. Please contact an Admin or be assigned as a Learning Partner for this student.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: err.message || 'Failed to assign course',
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Assign Course to {studentName}
          </DialogTitle>
          <DialogDescription>
            Choose a course for this student and create an enrollment.
            Only Admins and the assigned Learning Partner can perform
            this action.
          </DialogDescription>
        </DialogHeader>

          <div className="py-4 space-y-4">
            {coursesLoading ? (
              <div className="p-4 text-sm text-muted-foreground text-center">Loading courses…</div>
            ) : sortedCourses.length > 0 ? (
              <div className="space-y-1">
                <label className="text-sm font-medium">Course</label>
                <Select value={selected} onValueChange={setSelected}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedCourses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {(c.name || c.title || 'Untitled Course')}
                        {(c.area || c.level) ? ` — ${c.area || ''}${c.area && c.level ? ' / ' : ''}${c.level || ''}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="p-4 rounded border border-dashed border-gray-200 text-sm text-muted-foreground">
                No courses found. Please add courses in Course Management first.
              </div>
            )}

            {selected && (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Fee per class (₹) *</label>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    placeholder="e.g., 599"
                    value={feePerClassInput}
                    onChange={(e) => setFeePerClassInput(e.target.value)}
                  />
                  {feePerClassInput && Number(feePerClassInput) <= 0 && (
                    <p className="text-xs text-red-500">Fee must be greater than 0.</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Teacher pay per session (₹)</label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    placeholder="e.g., 300"
                    value={teacherPayPerSessionInput}
                    onChange={(e) => setTeacherPayPerSessionInput(e.target.value)}
                  />
                  {(!teacherPayPerSessionInput || Number(teacherPayPerSessionInput) <= 0) && (
                    <p className="text-xs text-amber-600">
                      Teacher earnings will be ₹0 until set.
                    </p>
                  )}
                </div>
              </>
            )}

            {!canAssign && user?.role !== 'learningPartner' && (
              <p className="text-xs text-red-500">
                You are not authorized to assign courses for this student.
              </p>
            )}
            {!canAssign && user?.role === 'learningPartner' && lpCanAssign === false && (
              <p className="text-xs text-red-500">
                You are not the assigned Learning Partner for this student.
              </p>
            )}
          </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!canAssign || saving || !selected || coursesLoading}
          >
            {saving ? 'Assigning…' : 'Assign Course'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
