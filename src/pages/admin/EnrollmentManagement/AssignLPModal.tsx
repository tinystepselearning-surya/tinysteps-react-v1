// src/pages/admin/EnrollmentManagement/AssignLPModal.tsx
import React, { useEffect, useMemo, useState } from 'react';
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

interface AssignLPModalProps {
  enrollment: any;
  onClose: () => void;
}

const NONE = '__none__';

export default function AssignLPModal({
  enrollment,
  onClose,
}: AssignLPModalProps) {
  const [lps, setLps] = useState<any[]>([]);
  const [selectedLPId, setSelectedLPId] =
    useState<string>(NONE);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);

  /* ---------------- load LPs ---------------- */
  useEffect(() => {
    const load = async () => {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'learningPartner'),
      );
      const snap = await getDocs(q);
      const arr: any[] = [];
      snap.forEach((d) =>
        arr.push({ id: d.id, ...d.data() }),
      );
      setLps(arr);
    };

    void load();
  }, []);

  /* ---------------- filtered LPs ---------------- */
  const filteredLPs = useMemo(() => {
    if (!searchTerm) return lps;

    const q = searchTerm.toLowerCase();
    return lps.filter((lp) => {
      const text = (
        lp.name ||
        lp.email ||
        ''
      ).toLowerCase();
      return text.includes(q);
    });
  }, [lps, searchTerm]);

  /* ---------------- confirm ---------------- */
  const handleConfirm = async () => {
    if (selectedLPId === NONE) {
      toast({
        title: 'Select Learning Partner',
        description:
          'Please select a Learning Partner',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      await updateDoc(
        doc(db, 'enrollments', enrollment.id),
        {
          lpId: selectedLPId,
          status: 'active',
          startDate: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
      );

      toast({
        title: 'Learning Partner assigned',
        description:
          'Enrollment is now active',
      });

      onClose();
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Error',
        description:
          err?.message ||
          'Failed to assign Learning Partner',
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
          <DialogTitle>
            Assign Learning Partner
          </DialogTitle>
          <DialogDescription>
            Assign a Learning Partner and
            activate the enrollment.
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

          <input
            className="w-full px-3 py-2 border rounded"
            placeholder="Search LP name or email"
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
          />

          <Select
            value={selectedLPId}
            onValueChange={setSelectedLPId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Learning Partner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>
                Select Learning Partner
              </SelectItem>
              {filteredLPs.map((lp) => (
                <SelectItem
                  key={lp.id}
                  value={lp.id}
                >
                  {lp.name || lp.email}
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
