import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Button } from '@components/ui/button';
import { toast } from '@components/hooks/use-toast';

export default function AssignLPModal({ enrollment, onClose }: { enrollment: any, onClose: () => void }) {
  const [lps, setLps] = useState<any[]>([]);
  const [selectedLP, setSelectedLP] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => { fetchLPs(); }, []);

  const fetchLPs = async () => {
    const q = query(collection(db, 'users'), where('role', '==', 'learningPartner'));
    const snap = await getDocs(q);
    const arr: any[] = [];
    snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
    setLps(arr);
  };

  const handleConfirm = async () => {
    if (!selectedLP) {
      toast({ title: 'Select LP', description: 'Please select a Learning Partner', variant: 'destructive' });
      return;
    }

    try {
      await updateDoc(doc(db, 'enrollments', enrollment.id), {
        lpId: selectedLP,
        status: 'active',
        startDate: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({ title: 'Success', description: 'LP assigned and enrollment activated' });
      onClose();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to assign LP', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Learning Partner</DialogTitle>
          <DialogDescription>
            Choose a learning partner to manage this enrollment and activate the student&apos;s course.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>Student: {enrollment.studentId}</div>
          <div>Course: {enrollment.courseId}</div>

          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 border rounded"
              placeholder="Search LP by name or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select onValueChange={(v) => setSelectedLP(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select LP" />
            </SelectTrigger>
            <SelectContent>
              {lps.filter(lp => {
                if (!searchTerm) return true;
                const s = (lp.name || lp.email || '').toLowerCase();
                return s.includes(searchTerm.toLowerCase());
              }).map(t => (
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
