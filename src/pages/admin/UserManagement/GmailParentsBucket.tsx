import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, doc, getDoc, setDoc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { updateKid } from '../../../services/kidsService';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import AssignCourseModal from '../StudentManagement/AssignCourseModal';
import CreateStudentForm from '../StudentManagement/CreateStudentForm';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@components/ui/dialog';
import { Input } from '@components/ui/input';
import { Student } from '../../../types/Student';
import { User } from '../../../types/User';
import { toast } from '@components/hooks/use-toast';

interface Props { open?: boolean; }
export default function GmailParentsBucket({ open = true }: Props) {
  const [parents, setParents] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [openCreateStudentForParent, setOpenCreateStudentForParent] = useState<User | null>(null);
  const [assigningStudent, setAssigningStudent] = useState<Student | null>(null);

  useEffect(() => {
    const loadParents = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const allUsers = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        setParents(allUsers.filter(u => (u.role === 'parent' || (u.roles && u.roles.includes && u.roles.includes('parent'))) && u.provider === 'google.com'));
      } catch (err) {
        console.error(err);
        toast({ title: 'Error', description: 'Failed to load Gmail parents', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    if (open) loadParents();
  }, []);

  const handleAddKid = (parent: User) => {
    setOpenCreateStudentForParent(parent);
  };

  const handleCreatedKid = async (kidId: string) => {
    toast({ title: 'Kid created', description: 'Kid was created successfully and linked to parent' });
    // refresh parent list to show updated child counts
    setOpenCreateStudentForParent(null);
    try { // reload list
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const allUsers = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setParents(allUsers.filter(u => (u.role === 'parent' || (u.roles && u.roles.includes && u.roles.includes('parent'))) && u.provider === 'google.com'));
    } catch (err) {
      // ignore
    }
  };

    function MapExistingKidButton({ parentId, onMapped }: { parentId: string; onMapped?: () => void; }) {
      const [open, setOpen] = useState(false);
      const [kids, setKids] = useState<any[]>([]);
      const [selected, setSelected] = useState<Set<string>>(new Set());
      const [queryText, setQueryText] = useState('');

      useEffect(() => {
        if (!open) return;
        const load = async () => {
          try {
            const q = query(collection(db, 'kids'));
            const snap = await getDocs(q);
            setKids(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
          } catch (err) {
            console.error('Failed to load kids', err);
          }
        };
        load();
      }, [open]);

      const apply = async () => {
        try {
          for (const kidId of Array.from(selected)) {
            await updateKid(kidId, { parentIds: arrayUnion(parentId) } as any);
            await updateDoc(doc(db, 'users', parentId), { childIds: arrayUnion(kidId), updatedAt: serverTimestamp() } as any);
          }
          toast({ title: 'Mapped', description: `Mapped ${selected.size} kid(s) to parent.` });
          setOpen(false);
          onMapped?.();
        } catch (err) {
          console.error(err);
          toast({ title: 'Error', description: 'Failed to map kids', variant: 'destructive' });
        }
      };

      return (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">Map Existing Kid</Button>
          </DialogTrigger>
          <DialogContent>
              <DialogHeader>
                <DialogTitle>Map existing kids to parent</DialogTitle>
                <DialogDescription>Select one or more existing student profiles and link them to this parent account.</DialogDescription>
              </DialogHeader>
            <div className="space-y-2">
              <Input placeholder="Search kids..." value={queryText} onChange={(e) => setQueryText(e.target.value)} />
              <div className="max-h-64 overflow-y-auto mt-2 space-y-1">
                {kids.filter(k => !queryText || (k.fullName || '').toLowerCase().includes(queryText.toLowerCase())).map(k => (
                  <label key={k.id} className="flex items-center gap-2">
                    <input type="checkbox" checked={selected.has(k.id)} onChange={(e) => {
                      const s = new Set(selected);
                      if (e.target.checked) s.add(k.id); else s.delete(k.id);
                      setSelected(s);
                    }} />
                    <span>{k.fullName} — {k.grade}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={apply}>Map Selected</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      );
    }

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Gmail Signups (Parents)</h3>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="space-y-4">
          {parents.length === 0 && <div>No Gmail-signed-up parents found</div>}
          {parents.map(p => (
            <div key={p.id} className="flex justify-between items-center border rounded p-3">
              <div>
                <div className="font-medium">{p.name || p.email}</div>
                <div className="text-sm text-muted-foreground">{p.email}</div>
              </div>
                <div className="flex gap-2 items-center">
                <Button size="sm" variant="outline" onClick={() => handleAddKid(p)}>Add Kid</Button>
                <MapExistingKidButton parentId={p.id} onMapped={() => {
                  // refresh parents list after map
                  setTimeout(() => {
                    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
                    getDocs(q).then(snap => {
                      const allUsers = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
                      setParents(allUsers.filter(u => (u.role === 'parent' || (u.roles && u.roles.includes && u.roles.includes('parent'))) && u.provider === 'google.com'));
                    }).catch(() => {});
                  }, 100);
                }} />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    // Load this parent's kids and if one found prompt to assign course
                    try {
                      const q = query(collection(db, 'kids'));
                      const snap = await getDocs(q);
                      const allKids = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
                      const parentKids = allKids.filter(k => (k.parentIds || []).includes(p.id));
                      if (parentKids.length === 0) {
                        toast({ title: 'No kids', description: 'This parent has no kids yet. Add a kid first.' });
                        return;
                      }
                      const k = parentKids[0];
                      const student = { id: k.id, ...k } as Student;
                      setAssigningStudent(student);
                    } catch (err) {
                      console.error(err);
                      toast({ title: 'Error', description: 'Failed to query kids', variant: 'destructive' });
                    }
                  }}
                >
                  Assign Course
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { window.location.href = `/dev-admin?parentId=${p.id}`; }}>Manage Subscriptions</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {openCreateStudentForParent && (
        <Dialog open={true} onOpenChange={() => setOpenCreateStudentForParent(null)}>
            <DialogContent className="max-w-2xl">
            <CreateStudentForm defaultParentId={openCreateStudentForParent.id} onStudentCreated={(id) => handleCreatedKid(id)} />
          </DialogContent>
        </Dialog>
      )}

      {assigningStudent && (
        <AssignCourseModal
          student={assigningStudent}
          onClose={() => setAssigningStudent(null)}
          onAssigned={() => setAssigningStudent(null)}
        />
      )}
    </Card>
  );
}
