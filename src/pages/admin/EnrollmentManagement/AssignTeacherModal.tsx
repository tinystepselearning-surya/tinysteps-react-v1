// src/pages/admin/EnrollmentManagement/AssignTeacherModal.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db, functions } from '../../../lib/firebaseConfig';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { Button } from '@components/ui/button';
import { toast } from '@components/hooks/use-toast';
import { httpsCallable } from 'firebase/functions';

interface AssignTeacherModalProps {
  enrollment: any;
  onClose: () => void;
  studentName?: string;
  courseName?: string;
  currentTeacherName?: string;
  currentTeacherEmail?: string;
  currentTeacherId?: string;
}

const NONE = '__none__';
const ALL = '__all__';

const cleanText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

export default function AssignTeacherModal({
  enrollment,
  onClose,
  studentName,
  courseName,
  currentTeacherName,
  currentTeacherEmail,
  currentTeacherId,
}: AssignTeacherModalProps) {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] =
    useState<string>(NONE);
  const [searchTerm, setSearchTerm] = useState('');
  const [specialization, setSpecialization] =
    useState<string>(ALL);
  const [saving, setSaving] = useState(false);

  /* ---------------- load teachers ---------------- */
  useEffect(() => {
    const load = async () => {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'teacher'),
      );
      const snap = await getDocs(q);
      const arr: any[] = [];
      snap.forEach((d) =>
        arr.push({ id: d.id, ...d.data() }),
      );
      setTeachers(arr);
    };

    void load();
  }, []);

  /* ---------------- derived ---------------- */
  const enrollmentTeacherId = useMemo(
    () =>
      cleanText(currentTeacherId) ||
      cleanText(enrollment?.teacherId),
    [currentTeacherId, enrollment?.teacherId]
  );

  const teacherById = useMemo(() => {
    const map = new Map<string, any>();
    teachers.forEach((teacher) => {
      const id = cleanText(teacher?.id);
      if (id) map.set(id, teacher);
    });
    return map;
  }, [teachers]);

  const currentTeacherDoc = enrollmentTeacherId ? teacherById.get(enrollmentTeacherId) : null;
  const resolvedCurrentTeacherName =
    cleanText(currentTeacherName) ||
    cleanText(enrollment?.teacherName) ||
    cleanText(currentTeacherDoc?.displayName) ||
    cleanText(currentTeacherDoc?.name);
  const resolvedCurrentTeacherEmail =
    cleanText(currentTeacherEmail) ||
    cleanText(enrollment?.teacherEmail) ||
    cleanText(currentTeacherDoc?.email);

  const selectedTeacher =
    selectedTeacherId !== NONE ? teacherById.get(selectedTeacherId) : null;
  const selectedTeacherName =
    cleanText(selectedTeacher?.displayName) ||
    cleanText(selectedTeacher?.name) ||
    cleanText(selectedTeacher?.email) ||
    cleanText(selectedTeacher?.id);
  const selectedTeacherEmail = cleanText(selectedTeacher?.email);

  const sameTeacherSelected =
    selectedTeacherId !== NONE &&
    Boolean(enrollmentTeacherId) &&
    selectedTeacherId === enrollmentTeacherId;
  const canConfirm =
    selectedTeacherId !== NONE &&
    Boolean(selectedTeacher) &&
    !sameTeacherSelected;

  const resolvedStudentName =
    cleanText(studentName) ||
    cleanText(enrollment?.studentName) ||
    cleanText(enrollment?.childName) ||
    cleanText(enrollment?.kidName) ||
    cleanText(enrollment?.kid?.name) ||
    cleanText(enrollment?.student?.name) ||
    cleanText(enrollment?.studentId) ||
    cleanText(enrollment?.kidId) ||
    'Unknown';
  const resolvedCourseName =
    cleanText(courseName) ||
    cleanText(enrollment?.courseName) ||
    cleanText(enrollment?.courseTitle) ||
    cleanText(enrollment?.courseId) ||
    'Unknown';

  const allSpecializations = useMemo(() => {
    const set = new Set<string>();
    teachers.forEach((t) =>
      (t.specializations || []).forEach((s: string) =>
        set.add(s),
      ),
    );
    return Array.from(set);
  }, [teachers]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      if (
        specialization !== ALL &&
        !(t.specializations || []).includes(
          specialization,
        )
      )
        return false;

      if (searchTerm) {
        const text = (
          t.name ||
          t.email ||
          ''
        ).toLowerCase();
        return text.includes(searchTerm.toLowerCase());
      }

      return true;
    });
  }, [teachers, specialization, searchTerm]);

  /* ---------------- confirm ---------------- */
  const handleConfirm = async () => {
    if (selectedTeacherId === NONE) {
      toast({
        title: 'Select new teacher',
        description: 'Please select a teacher to continue.',
        variant: 'destructive',
      });
      return;
    }
    if (!selectedTeacher) {
      toast({
        title: 'Invalid teacher',
        description: 'Selected teacher was not found. Please reselect.',
        variant: 'destructive',
      });
      return;
    }
    if (sameTeacherSelected) {
      toast({
        title: 'Same teacher selected',
        description: 'Please choose a different teacher before saving.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      const fn = httpsCallable(functions, 'reassignEnrollmentTeacher');
      await fn({ enrollmentId: enrollment.id, newTeacherId: selectedTeacherId });

      toast({
        title: 'Teacher reassigned',
        description: 'Enrollment teacher updated successfully.',
      });

      onClose();
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Error',
        description:
          err?.message ||
          'Failed to reassign teacher',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Reassign Teacher</DialogTitle>
          <DialogDescription>
            Review current teacher, select a new teacher, and confirm before saving.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border p-3 text-sm space-y-2">
            <div>
              <strong>Student:</strong>{' '}
              {resolvedStudentName}
            </div>
            <div>
              <strong>Course:</strong>{' '}
              {resolvedCourseName}
            </div>
            <div>
              <strong>Current Teacher:</strong>
              <div className="mt-1 text-xs space-y-0.5 text-muted-foreground">
                <div>Name: {resolvedCurrentTeacherName || '—'}</div>
                <div>Email: {resolvedCurrentTeacherEmail || '—'}</div>
                <div>ID: {enrollmentTeacherId || '—'}</div>
              </div>
            </div>
          </div>

          {/* Search + specialization */}
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 border rounded"
              placeholder="Search teacher name / email"
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
            />

            <Select
              value={specialization}
              onValueChange={setSpecialization}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>
                  All
                </SelectItem>
                {allSpecializations.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">New Teacher</label>
          </div>
          <Select
            value={selectedTeacherId}
            onValueChange={setSelectedTeacherId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select teacher" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>
                Select teacher
              </SelectItem>
              {filteredTeachers.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {cleanText(t.displayName) || cleanText(t.name) || cleanText(t.email) || t.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {sameTeacherSelected && (
            <p className="text-sm text-red-600">
              Selected teacher is the same as the current teacher. Choose a different teacher.
            </p>
          )}

          {selectedTeacher ? (
            <div className="rounded-md border p-3 text-sm space-y-2">
              <div className="font-medium">Confirmation Summary</div>
              <div className="text-xs text-muted-foreground space-y-2">
                <div>
                  <div><strong>Current Teacher</strong></div>
                  <div>Name: {resolvedCurrentTeacherName || '—'}</div>
                  <div>Email: {resolvedCurrentTeacherEmail || '—'}</div>
                  <div>ID: {enrollmentTeacherId || '—'}</div>
                </div>
                <div>
                  <div><strong>New Teacher</strong></div>
                  <div>Name: {selectedTeacherName || '—'}</div>
                  <div>Email: {selectedTeacherEmail || '—'}</div>
                  <div>ID: {cleanText(selectedTeacher?.id) || selectedTeacherId}</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={saving || !canConfirm}
          >
            {saving ? 'Saving…' : 'Confirm Reassignment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
