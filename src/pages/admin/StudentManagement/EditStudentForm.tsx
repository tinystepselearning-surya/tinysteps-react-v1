import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { toast } from '@components/hooks/use-toast';
import { Student } from '../../../types/Student';

interface Props {
  student: Student;
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export default function EditStudentForm({ student, open, onClose, onUpdated }: Props) {
  const [fullName, setFullName] = useState(student.fullName || '');
  const [dob, setDob] = useState(student.dob || '');
  const [grade, setGrade] = useState(student.grade || '');
  const [status, setStatus] = useState(student.status || 'active');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'kids', student.id), {
        fullName,
        dob,
        grade,
        status,
      });
      toast({ title: 'Updated', description: 'Student updated' });
      onUpdated?.();
      onClose();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Update failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full Name" />
          <Input value={dob} onChange={e => setDob(e.target.value)} placeholder="DOB (YYYY-MM-DD)" />
          <Select value={grade} onValueChange={(value: string) => setGrade(value)}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Grade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Pre-K">Pre-K</SelectItem>
              <SelectItem value="KG">KG</SelectItem>
              <SelectItem value="Grade 1">Grade 1</SelectItem>
              <SelectItem value="Grade 2">Grade 2</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(value: "active" | "suspended" | "archived") => setStatus(value)}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleUpdate} disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
