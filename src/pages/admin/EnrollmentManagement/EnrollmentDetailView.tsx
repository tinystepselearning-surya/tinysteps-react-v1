import React, { useEffect, useState } from 'react';
import { doc, getDoc, getDocs, collection, query, where, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Textarea } from '@components/ui/textarea';
import { toast } from '@components/hooks/use-toast';

export default function EnrollmentDetailView({ enrollmentId, onClose }: { enrollmentId: string, onClose: () => void }) {
  const [enrollment, setEnrollment] = useState<any | null>(null);
  const [student, setStudent] = useState<any | null>(null);
  const [course, setCourse] = useState<any | null>(null);
  const [teacher, setTeacher] = useState<any | null>(null);
  const [lp, setLp] = useState<any | null>(null);
  const [parent, setParent] = useState<any | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => { fetch(); }, [enrollmentId]);

  const fetch = async () => {
    const eSnap = await getDoc(doc(db, 'enrollments', enrollmentId));
    if (!eSnap.exists()) return;
    const data = { id: eSnap.id, ...(eSnap.data() as any) };
    setEnrollment(data);

    if (data.studentId) {
      const s = await getDoc(doc(db, 'kids', data.studentId));
      setStudent(s.exists() ? { id: s.id, ...s.data() } : null);
    }
    if (data.courseId) {
      const c = await getDoc(doc(db, 'courses', data.courseId));
      setCourse(c.exists() ? { id: c.id, ...c.data() } : null);
    }
    if (data.teacherId) {
      const t = await getDoc(doc(db, 'users', data.teacherId));
      setTeacher(t.exists() ? { id: t.id, ...t.data() } : null);
    }
    if (data.lpId) {
      const l = await getDoc(doc(db, 'users', data.lpId));
      setLp(l.exists() ? { id: l.id, ...l.data() } : null);
    }
    if (data.parentId) {
      const p = await getDoc(doc(db, 'users', data.parentId));
      setParent(p.exists() ? { id: p.id, ...p.data() } : null);
    }
  };

  const saveNote = async () => {
    if (!enrollment) return;
    try {
      const notes = (enrollment.notes || '') + '\n' + note;
      await updateDoc(doc(db, 'enrollments', enrollment.id), { notes, updatedAt: serverTimestamp() });
      setNote('');
      toast({ title: 'Saved', description: 'Note saved' });
      fetch();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save note', variant: 'destructive' });
    }
  };

  if (!enrollment) return <div>Loading...</div>;

  const topicProgress = enrollment.topicProgress || {};

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Enrollment Details</h3>
        <div>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student & Course</CardTitle>
        </CardHeader>
        <CardContent>
          <div><strong>Student:</strong> {student?.name} - {student?.grade}</div>
          <div><strong>Age:</strong> {student?.age || student?.dob || 'Unknown'}</div>
          <div><strong>Course:</strong> {course?.name} ({course?.area})</div>
          <div><strong>Teacher:</strong> {teacher?.name || 'Unassigned'}</div>
          <div><strong>Learning Partner:</strong> {lp?.name || 'Unassigned'}</div>
          <div><strong>Parent:</strong> {parent?.name || parent?.email}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Progress by Topic</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(topicProgress).length === 0 ? (
            <div className="text-sm text-gray-500">No topic progress yet.</div>
          ) : (
            <div className="space-y-2">
              {Object.entries(topicProgress).map(([topicId, t]: any) => (
                <div key={topicId} className="p-2 border rounded">
                  <div><strong>Topic:</strong> {t.name || topicId}</div>
                  <div>Status: <Badge variant={t.status === 'completed' ? 'default' : 'secondary'}>{t.status}</Badge></div>
                  <div>Mastery: {t.mastery || 0}%</div>
                  <div>Last Updated: {t.lastUpdated?.toDate ? t.lastUpdated.toDate().toLocaleString() : '-'}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Credits & Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div>Credits Used: {enrollment.creditsUsed || 0}</div>
          <div>Credits Total: {enrollment.creditsTotal || 0}</div>
          <div>Credits Remaining: {enrollment.creditsRemaining || 0}</div>
          <div>Enrollment Date: {enrollment.enrollmentDate?.toDate ? enrollment.enrollmentDate.toDate().toLocaleDateString() : 'Unknown'}</div>
          <div>Start Date: {enrollment.startDate ? new Date(enrollment.startDate).toLocaleDateString() : 'Not started'}</div>
          <div>Completion Date: {enrollment.completionDate || 'N/A'}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admin Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2">{enrollment.notes || 'No notes'}</div>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add admin note" />
          <div className="flex gap-2 mt-2">
            <Button onClick={saveNote}>Save Note</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
