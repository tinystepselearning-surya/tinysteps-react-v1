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
}

const NONE = '__none__';
const ALL = '__all__';

export default function AssignTeacherModal({
  enrollment,
  onClose,
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
        title: 'Select teacher',
        description: 'Please select a teacher',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      const fn = httpsCallable(functions, 'reassignEnrollmentTeacher');
      await fn({ enrollmentId: enrollment.id, newTeacherId: selectedTeacherId });

      toast({
        title: 'Teacher assigned',
        description: 'Teacher successfully assigned',
      });

      onClose();
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Error',
        description:
          err?.message ||
          'Failed to assign teacher',
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
          <DialogTitle>Assign Teacher</DialogTitle>
          <DialogDescription>
            Assign a teacher to this enrollment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <div>
              <strong>Student:</strong>{' '}
              {enrollment.studentId}
            </div>
            <div>
              <strong>Course:</strong>{' '}
              {enrollment.courseId}
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

          {/* Teacher select */}
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
                  {t.name || t.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            disabled={saving}
          >
            {saving ? 'Assigning…' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
