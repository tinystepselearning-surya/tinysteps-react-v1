// CourseManagement.tsx
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@components/hooks/use-toast';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@components/ui/dialog';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';

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
    if (!t) {
      toast({ title: 'Missing title', description: 'Please enter a course title', variant: 'destructive' });
      return;
    }
    const slug = slugify(t);
    if (!slug) {
      toast({ title: 'Invalid title', description: 'Title produced an invalid id', variant: 'destructive' });
      return;
    }

    try {
      setIsSaving(true);
      const { doc, setDoc, serverTimestamp, getDoc } = await import('firebase/firestore');
      const { db } = await import('../../../lib/firebaseConfig');

      if (import.meta.env?.DEV) console.debug('[courses] create start', { title: t, slug, track, level });

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

      // verify write
      try {
        const snap = await getDoc(doc(db, 'courses', slug));
        if (import.meta.env?.DEV) console.debug('[courses] create wrote doc exists?', snap.exists());
      } catch (e) {
        if (import.meta.env?.DEV) console.debug('[courses] create verify failed', e);
      }

      setTitle('');
      setOpen(false);
      // invalidate courses query so CourseList refetches
      try {
        await queryClient.invalidateQueries({ queryKey: ['courses'], exact: false });
      } catch (e) {
        // ignore
      }
      // show success toast
      toast({ title: 'Course created', description: `${t} was added.` });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[courses] create failed', err);
      toast({ title: 'Failed to create course', description: String((err as any)?.message || err), variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Course Management</h2>

        <Button type="button" onClick={() => setOpen(true)}>Create New Course</Button>
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

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="courseTrack">Track</Label>
              <Select value={track} onValueChange={(v) => setTrack(v)}>
                <SelectTrigger id="courseTrack">
                  <SelectValue placeholder="Select track" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phonics">Phonics</SelectItem>
                  <SelectItem value="grammar">Grammar</SelectItem>
                  <SelectItem value="public_speaking">Public Speaking</SelectItem>
                  <SelectItem value="spoken_english">Spoken English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="courseLevel">Level</Label>
              <Select value={level} onValueChange={(v) => setLevel(v)}>
                <SelectTrigger id="courseLevel">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="foundation">Foundation</SelectItem>
                  <SelectItem value="early">Early</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="crash">Crash Course</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="all_levels">All Levels</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleCreate} disabled={!title.trim() || isSaving}>
              {isSaving ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
