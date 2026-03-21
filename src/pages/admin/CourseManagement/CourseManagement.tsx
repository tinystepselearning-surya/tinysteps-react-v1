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
  const [editOpen, setEditOpen] = useState(false);
  const [editCourseId, setEditCourseId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTrack, setEditTrack] = useState('phonics');
  const [editLevel, setEditLevel] = useState('foundation');
  const [editActive, setEditActive] = useState(true);
  const [editRate, setEditRate] = useState('');
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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
       
      console.error('[courses] create failed', err);
      toast({ title: 'Failed to create course', description: String((err as any)?.message || err), variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }

  const normalizeTrack = (value: string) => {
    const raw = String(value || '').toLowerCase().trim();
    if (!raw) return 'phonics';
    if (raw === 'public speaking' || raw === 'public_speaking') return 'public_speaking';
    if (raw === 'spoken english' || raw === 'spoken_english') return 'spoken_english';
    return raw;
  };

  const openEditCourse = async (courseId: string) => {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../../../lib/firebaseConfig');
      const snap = await getDoc(doc(db, 'courses', courseId));
      if (!snap.exists()) {
        toast({ title: 'Course not found', variant: 'destructive' });
        return;
      }
      const data: any = snap.data();
      const courseTitle = data.title || data.name || data.code || courseId;
      const area = data.area || data.track || 'phonics';
      const nextTrack = normalizeTrack(area);
      const nextLevel = data.level || 'foundation';
      const active =
        typeof data.active === 'boolean'
          ? data.active
          : String(data.status || '').toLowerCase() === 'active';
      const rate = data.ratePerSession ?? data.rate ?? '';

      setEditCourseId(courseId);
      setEditTitle(courseTitle);
      setEditTrack(nextTrack);
      setEditLevel(String(nextLevel));
      setEditActive(active);
      setEditRate(rate ? String(rate) : '');
      setEditOpen(true);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to load course',
        variant: 'destructive',
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editCourseId) return;
    const nextTitle = editTitle.trim();
    if (!nextTitle) {
      toast({
        title: 'Missing title',
        description: 'Please enter a course title',
        variant: 'destructive',
      });
      return;
    }
    const rateValue = Number(editRate);
    const ratePerSession = Number.isFinite(rateValue) ? rateValue : 0;
    const normalizedTrack = normalizeTrack(editTrack);
    const areaLabel =
      normalizedTrack === 'phonics'
        ? 'Phonics'
        : normalizedTrack === 'grammar'
          ? 'Grammar'
          : normalizedTrack === 'public_speaking' || normalizedTrack === 'spoken_english'
            ? 'Speaking'
            : normalizedTrack;

    try {
      setIsEditing(true);
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../../../lib/firebaseConfig');
      await updateDoc(doc(db, 'courses', editCourseId), {
        title: nextTitle,
        name: nextTitle,
        track: normalizedTrack,
        area: areaLabel,
        level: editLevel,
        active: editActive,
        status: editActive ? 'active' : 'inactive',
        ratePerSession,
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Course updated' });
      setEditOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['courses'], exact: false });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to update course',
        variant: 'destructive',
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleToggleActive = async (courseId: string, nextActive: boolean) => {
    try {
      setIsEditing(true);
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../../../lib/firebaseConfig');
      await updateDoc(doc(db, 'courses', courseId), {
        active: nextActive,
        status: nextActive ? 'active' : 'inactive',
        updatedAt: serverTimestamp(),
      });
      toast({ title: nextActive ? 'Course activated' : 'Course deactivated' });
      await queryClient.invalidateQueries({ queryKey: ['courses'], exact: false });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to update course',
        variant: 'destructive',
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      const { collection, getDocs, limit, query, where } = await import('firebase/firestore');
      const { db } = await import('../../../lib/firebaseConfig');
      const [byCourseId, byCourseField, byCourseAlt] = await Promise.all([
        getDocs(query(collection(db, 'enrollments'), where('courseId', '==', courseId), limit(1))),
        getDocs(query(collection(db, 'enrollments'), where('course', '==', courseId), limit(1))),
        getDocs(query(collection(db, 'enrollments'), where('course_id', '==', courseId), limit(1))),
      ]);

      if (!byCourseId.empty || !byCourseField.empty || !byCourseAlt.empty) {
        toast({
          title: 'Cannot delete course',
          description: 'Course has enrollments. Deactivate instead.',
          variant: 'destructive',
        });
        return;
      }

      const confirm = window.prompt('Type DELETE to permanently remove this course.');
      if (confirm !== 'DELETE') return;

      setIsEditing(true);
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'courses', courseId));
      toast({ title: 'Course deleted' });
      await queryClient.invalidateQueries({ queryKey: ['courses'], exact: false });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to delete course',
        variant: 'destructive',
      });
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold leading-tight tracking-tight">Course Management</h2>

        <Button type="button" onClick={() => setOpen(true)}>Create New Course</Button>
      </div>

      <Card className="p-4">
        <CourseList
          onEditCourse={openEditCourse}
          onDeleteCourse={handleDeleteCourse}
          onToggleActive={handleToggleActive}
        />
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit course</DialogTitle>
            <DialogDescription>
              Update course details. Deactivate instead of deleting if enrollments exist.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="editCourseTitle">Course title</Label>
            <Input
              id="editCourseTitle"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="e.g., Phonics Foundations"
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="editCourseTrack">Track</Label>
              <Select value={editTrack} onValueChange={(v) => setEditTrack(v)}>
                <SelectTrigger id="editCourseTrack">
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
              <Label htmlFor="editCourseLevel">Level</Label>
              <Select value={editLevel} onValueChange={(v) => setEditLevel(v)}>
                <SelectTrigger id="editCourseLevel">
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

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="editCourseActive">Active</Label>
              <Select
                value={editActive ? 'active' : 'inactive'}
                onValueChange={(v) => setEditActive(v === 'active')}
              >
                <SelectTrigger id="editCourseActive">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editCourseRate">Rate (₹)</Label>
              <Input
                id="editCourseRate"
                type="number"
                step="1"
                value={editRate}
                onChange={(e) => setEditRate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveEdit} disabled={!editTitle.trim() || isEditing}>
              {isEditing ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
