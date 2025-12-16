// CourseManagement.tsx
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@components/ui/dialog';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';

import CourseList from './CourseList';

export default function CourseManagement() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [track, setTrack] = useState('phonics');
  const [level, setLevel] = useState('foundation');
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  function slugify(input: string) {
    return input
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
  }

  async function handleCreate() {
    const t = title.trim();
    if (!t) return;
    const slug = slugify(t);

    try {
      setIsSaving(true);
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../../../lib/firebaseConfig');

      await setDoc(
        doc(db, 'courses', slug),
        {
          title: t,
          code: slug,
          track: track || 'phonics',
          level: level || 'foundation',
          active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      setTitle('');
      setOpen(false);
      // invalidate courses query so CourseList refetches
      try {
        await queryClient.invalidateQueries({ queryKey: ['courses'], exact: false });
      } catch (e) {
        // ignore
      }
      // simple feedback
      // eslint-disable-next-line no-alert
      alert('Course created');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to create course', err);
      // eslint-disable-next-line no-alert
      alert('Failed to create course — check console');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Course Management</h2>

        <Button onClick={() => setOpen(true)}>Create New Course</Button>
      </div>

      <Card className="p-6">
        <CourseList />
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a course</DialogTitle>
            <DialogDescription>
              Enter a title for the course. You can edit details later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="courseTitle">Course title</Label>
            <Input
              id="courseTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Phonics Foundations"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!title.trim() || isSaving}>
              {isSaving ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
