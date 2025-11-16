import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Button } from '@components/ui/button';
import { toast } from '@components/hooks/use-toast';

export default function AssignTeacherModal({ enrollment, onClose }: { enrollment: any, onClose: () => void }) {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [specialization, setSpecialization] = useState<string | null>(null);

  useEffect(() => { fetchTeachers(); }, []);

  const fetchTeachers = async () => {
    const q = query(collection(db, 'users'), where('role', '==', 'teacher'));
    const snap = await getDocs(q);
    const arr: any[] = [];
    snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
    setTeachers(arr);
  };

  const handleConfirm = async () => {
    if (!selectedTeacher) {
      toast({ title: 'Select teacher', description: 'Please select a teacher', variant: 'destructive' });
      return;
    }

    try {
      await updateDoc(doc(db, 'enrollments', enrollment.id), {
        teacherId: selectedTeacher,
        status: 'pending_lp',
        updatedAt: serverTimestamp(),
      });

      // optional: add assigned mapping on user or parent if required
      toast({ title: 'Success', description: 'Teacher assigned' });
      onClose();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to assign teacher', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Teacher</DialogTitle>
          <DialogDescription>
            Select a teacher and optional specialization for this enrollment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>Student: {enrollment.studentId}</div>
          <div>Course: {enrollment.courseId}</div>

          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 border rounded"
              placeholder="Search teachers by name or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select
              value={specialization || '__all__'}
              onValueChange={(v) => setSpecialization(v === '__all__' ? null : v)}
            >
              <SelectTrigger className="w-44"><SelectValue placeholder="Specialization"/></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                {Array.from(new Set(teachers.flatMap(t => (t.specializations || []))))
                  .map((s: any) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Select onValueChange={(v) => setSelectedTeacher(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select teacher" />
            </SelectTrigger>
            <SelectContent>
              {teachers
                .filter(t => {
                  if (specialization && !(t.specializations || []).includes(specialization)) return false;
                  if (searchTerm) {
                    const str = (t.name || t.email || '').toLowerCase();
                    return str.includes(searchTerm.toLowerCase());
                  }
                  return true;
                })
                .map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name || t.email}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
