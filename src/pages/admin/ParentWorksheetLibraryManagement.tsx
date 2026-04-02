import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { Archive, ExternalLink, FileSpreadsheet, Pencil, RotateCcw } from 'lucide-react';

import { useToast } from '@components/hooks/use-toast';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { Textarea } from '@components/ui/textarea';
import { db } from '../../lib/firebaseConfig';
import {
  getSafeWorksheetUrl,
  normalizeWorksheetUrl,
  toParentWorksheetItem,
  type ParentWorksheetItem,
} from '../../lib/parentWorksheets';
import { useAuthStore } from '../../store/useAuthStore';

type WorksheetFormState = {
  title: string;
  url: string;
  description: string;
  category: string;
  thumbnailUrl: string;
  kidId: string;
  courseId: string;
  enrollmentId: string;
  stageTag: string;
  sortOrder: string;
  isActive: boolean;
};

const INITIAL_FORM: WorksheetFormState = {
  title: '',
  url: '',
  description: '',
  category: '',
  thumbnailUrl: '',
  kidId: '',
  courseId: '',
  enrollmentId: '',
  stageTag: '',
  sortOrder: '0',
  isActive: true,
};

const toMillis = (value: any): number => {
  if (!value) return 0;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  if (Number.isFinite(value?.seconds)) return Number(value.seconds) * 1000;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function ParentWorksheetLibraryManagement(): JSX.Element {
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [form, setForm] = useState<WorksheetFormState>(INITIAL_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const worksheetsQuery = useQuery({
    queryKey: ['adminParentWorksheetLibrary'],
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    queryFn: async (): Promise<ParentWorksheetItem[]> => {
      const ref = query(collection(db, 'parentWorksheetLibrary'), limit(400));
      const snap = await getDocs(ref);
      return snap.docs.map((entry) => toParentWorksheetItem(entry.id, entry.data()));
    },
  });

  const kidsQuery = useQuery({
    queryKey: ['adminParentWorksheetKids'],
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    queryFn: async (): Promise<any[]> => {
      const snap = await getDocs(query(collection(db, 'kids'), limit(500)));
      return snap.docs.map((entry) => ({ id: entry.id, ...(entry.data() as any) }));
    },
  });

  const coursesQuery = useQuery({
    queryKey: ['adminParentWorksheetCourses'],
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    queryFn: async (): Promise<any[]> => {
      const snap = await getDocs(query(collection(db, 'courses'), limit(300)));
      return snap.docs.map((entry) => ({ id: entry.id, ...(entry.data() as any) }));
    },
  });

  const enrollmentsQuery = useQuery({
    queryKey: ['adminParentWorksheetEnrollments', form.kidId],
    enabled: !!form.kidId,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    queryFn: async (): Promise<any[]> => {
      const byKidId = await getDocs(
        query(collection(db, 'enrollments'), where('kidId', '==', form.kidId), limit(200)),
      );
      const byKidIds = await getDocs(
        query(collection(db, 'enrollments'), where('kidIds', 'array-contains', form.kidId), limit(200)),
      );
      const map = new Map<string, any>();
      byKidId.docs.forEach((entry) => map.set(entry.id, { id: entry.id, ...(entry.data() as any) }));
      byKidIds.docs.forEach((entry) => map.set(entry.id, { id: entry.id, ...(entry.data() as any) }));
      return Array.from(map.values());
    },
  });

  const kids = useMemo(() => kidsQuery.data ?? [], [kidsQuery.data]);
  const courses = useMemo(() => coursesQuery.data ?? [], [coursesQuery.data]);
  const enrollments = useMemo(() => enrollmentsQuery.data ?? [], [enrollmentsQuery.data]);
  const selectedEnrollment = useMemo(
    () => enrollments.find((enrollment) => String(enrollment.id) === String(form.enrollmentId)) ?? null,
    [enrollments, form.enrollmentId],
  );

  const worksheetItems = useMemo(() => {
    const items = worksheetsQuery.data ?? [];
    return [...items].sort((a, b) => {
      if (a.isArchived !== b.isArchived) return a.isArchived ? 1 : -1;
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return toMillis(b.updatedAt) - toMillis(a.updatedAt);
    });
  }, [worksheetsQuery.data]);

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
  };

  const updateForm = <K extends keyof WorksheetFormState>(key: K, value: WorksheetFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const title = String(form.title || '').trim();
    const url = normalizeWorksheetUrl(form.url);
    const directCourseId = String(form.courseId || '').trim();
    const inferredCourseId = String(selectedEnrollment?.courseId || '').trim();
    const resolvedCourseId = directCourseId || inferredCourseId;
    if (!title) {
      toast({ title: 'Title required', description: 'Please add a worksheet title.', variant: 'destructive' });
      return;
    }
    if (!url) {
      toast({ title: 'Valid URL required', description: 'Please paste a valid worksheet link.', variant: 'destructive' });
      return;
    }
    if (!resolvedCourseId) {
      toast({
        title: 'Course required',
        description: 'Please select the course this worksheet belongs to.',
        variant: 'destructive',
      });
      return;
    }

    const sortOrder = Number(form.sortOrder);
    const payload = {
      title,
      url,
      worksheetUrl: url,
      description: String(form.description || '').trim(),
      category: String(form.category || '').trim(),
      thumbnailUrl: normalizeWorksheetUrl(form.thumbnailUrl),
      targetCourseIds: [resolvedCourseId],
      targetKidIds: form.kidId ? [form.kidId] : [],
      targetChildIds: form.kidId ? [form.kidId] : [],
      targetEnrollmentIds: form.enrollmentId ? [form.enrollmentId] : [],
      targetStageTags: form.stageTag ? [String(form.stageTag).trim()] : [],
      stageTags: form.stageTag ? [String(form.stageTag).trim()] : [],
      isActive: form.isActive,
      active: form.isActive,
      isArchived: false,
      archived: false,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      updatedAt: serverTimestamp(),
      updatedBy: user?.uid || null,
      updatedByEmail: user?.email || null,
    };

    setIsSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'parentWorksheetLibrary', editingId), payload);
        toast({ title: 'Worksheet updated' });
      } else {
        await addDoc(collection(db, 'parentWorksheetLibrary'), {
          ...payload,
          createdAt: serverTimestamp(),
          createdBy: user?.uid || null,
          createdByEmail: user?.email || null,
        });
        toast({ title: 'Worksheet added' });
      }
      resetForm();
      await worksheetsQuery.refetch();
    } catch (error: any) {
      console.error('[ParentWorksheetLibraryManagement] save failed', error);
      toast({
        title: 'Save failed',
        description: error?.message || 'Could not save worksheet.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (item: ParentWorksheetItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      url: item.url,
      description: item.description,
      category: item.category,
      thumbnailUrl: item.thumbnailUrl,
      kidId: item.targetKidIds[0] || '',
      courseId: item.targetCourseIds[0] || '',
      enrollmentId: item.targetEnrollmentIds[0] || '',
      stageTag: item.targetStageTags[0] || '',
      sortOrder: String(item.sortOrder ?? 0),
      isActive: item.isActive,
    });
  };

  const toggleArchive = async (item: ParentWorksheetItem, nextArchived: boolean) => {
    setActionId(item.id);
    try {
      await updateDoc(doc(db, 'parentWorksheetLibrary', item.id), {
        isArchived: nextArchived,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid || null,
        updatedByEmail: user?.email || null,
      });
      await worksheetsQuery.refetch();
      toast({ title: nextArchived ? 'Worksheet archived' : 'Worksheet restored' });
    } catch (error: any) {
      console.error('[ParentWorksheetLibraryManagement] archive toggle failed', error);
      toast({
        title: 'Update failed',
        description: error?.message || 'Could not update worksheet.',
        variant: 'destructive',
      });
    } finally {
      setActionId(null);
    }
  };

  const toggleActive = async (item: ParentWorksheetItem, nextActive: boolean) => {
    setActionId(item.id);
    try {
      await updateDoc(doc(db, 'parentWorksheetLibrary', item.id), {
        isActive: nextActive,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid || null,
        updatedByEmail: user?.email || null,
      });
      await worksheetsQuery.refetch();
      toast({ title: nextActive ? 'Worksheet activated' : 'Worksheet hidden' });
    } catch (error: any) {
      console.error('[ParentWorksheetLibraryManagement] active toggle failed', error);
      toast({
        title: 'Update failed',
        description: error?.message || 'Could not update worksheet.',
        variant: 'destructive',
      });
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="p-5 space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Parent Worksheet Library</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Admin-managed worksheet links shown in Parent Dashboard → Classes → Worksheets.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Worksheet Title *</Label>
            <Input
              value={form.title}
              onChange={(event) => updateForm('title', event.target.value)}
              placeholder="Worksheet 1 - CVC Blending"
            />
          </div>
          <div className="space-y-2">
            <Label>Worksheet URL (Google Drive) *</Label>
            <Input
              value={form.url}
              onChange={(event) => updateForm('url', event.target.value)}
              placeholder="https://drive.google.com/..."
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Input
              value={form.category}
              onChange={(event) => updateForm('category', event.target.value)}
              placeholder="Revision / Homework / Blending"
            />
          </div>
          <div className="space-y-2">
            <Label>Thumbnail URL (optional)</Label>
            <Input
              value={form.thumbnailUrl}
              onChange={(event) => updateForm('thumbnailUrl', event.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label>Course Scope *</Label>
            <Select value={form.courseId || '__none__'} onValueChange={(value) => updateForm('courseId', value === '__none__' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select course</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name || course.title || course.label || course.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Sort Order</Label>
            <Input
              type="number"
              value={form.sortOrder}
              onChange={(event) => updateForm('sortOrder', event.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Description (optional)</Label>
            <Textarea
              value={form.description}
              onChange={(event) => updateForm('description', event.target.value)}
              placeholder="Short parent-facing worksheet guidance"
              rows={3}
            />
          </div>
        </div>

        <details className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/40">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-100">
            Advanced targeting (optional)
          </summary>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Child Scope (optional)</Label>
              <Select value={form.kidId || '__none__'} onValueChange={(value) => updateForm('kidId', value === '__none__' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select child" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No child scope</SelectItem>
                  {kids.map((kid) => (
                    <SelectItem key={kid.id} value={kid.id}>
                      {kid.fullName || kid.name || kid.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          <div className="space-y-2">
            <Label>Enrollment Scope (optional)</Label>
            <Select
              value={form.enrollmentId || '__none__'}
              onValueChange={(value) => updateForm('enrollmentId', value === '__none__' ? '' : value)}
              disabled={!form.kidId}
            >
              <SelectTrigger>
                <SelectValue placeholder={form.kidId ? 'Select enrollment' : 'Pick child first'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No enrollment scope</SelectItem>
                {enrollments.map((enrollment) => (
                  <SelectItem key={enrollment.id} value={enrollment.id}>
                    {enrollment.courseName || enrollment.courseLabel || enrollment.courseId || enrollment.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Stage / Topic tag (optional)</Label>
            <Input
              value={form.stageTag}
              onChange={(event) => updateForm('stageTag', event.target.value)}
              placeholder="Stage 2 / Short vowels"
            />
          </div>
            <div className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-xs text-slate-500 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-300 md:col-span-2">
              Legacy parent targeting fields are intentionally hidden from normal workflow.
              Course targeting drives parent visibility by default.
            </div>
          </div>
        </details>

        <div className="flex flex-wrap items-center gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => updateForm('isActive', event.target.checked)}
            />
            Active (visible in parent library)
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : editingId ? 'Update Worksheet' : 'Add Worksheet'}
          </Button>
          {editingId ? (
            <Button variant="outline" onClick={resetForm} disabled={isSaving}>
              Cancel Edit
            </Button>
          ) : null}
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Worksheet Items</h3>
          <Button variant="outline" size="sm" onClick={() => worksheetsQuery.refetch()} disabled={worksheetsQuery.isFetching}>
            {worksheetsQuery.isFetching ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {worksheetsQuery.isLoading ? (
          <div className="text-sm text-slate-600 dark:text-slate-300">Loading worksheets...</div>
        ) : worksheetItems.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
            No worksheets added yet.
          </div>
        ) : (
          <div className="space-y-3">
            {worksheetItems.map((item) => {
              const safeUrl = getSafeWorksheetUrl(item.url);
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {item.title || 'Untitled worksheet'}
                        </h4>
                        {!item.isActive ? <Badge variant="secondary">Hidden</Badge> : null}
                        {item.isArchived ? <Badge variant="outline">Archived</Badge> : null}
                        {item.category ? <Badge variant="outline">{item.category}</Badge> : null}
                      </div>
                      {item.description ? (
                        <p className="text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
                      ) : null}
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        {item.targetKidIds.length ? <span>Kid: {item.targetKidIds.join(', ')}</span> : null}
                        {item.targetCourseIds.length ? <span>Course: {item.targetCourseIds.join(', ')}</span> : null}
                        {item.targetEnrollmentIds.length ? <span>Enrollment: {item.targetEnrollmentIds.join(', ')}</span> : null}
                        {!item.targetCourseIds.length && item.targetParentIds.length ? <span>Legacy parent scope</span> : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!safeUrl) return;
                          window.open(safeUrl, '_blank', 'noopener,noreferrer');
                        }}
                        disabled={!safeUrl}
                      >
                        Open
                        <ExternalLink className="ml-1 h-3.5 w-3.5" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(item, !item.isActive)}
                        disabled={actionId === item.id}
                      >
                        {item.isActive ? 'Hide' : 'Show'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleArchive(item, !item.isArchived)}
                        disabled={actionId === item.id}
                      >
                        {item.isArchived ? (
                          <>
                            <RotateCcw className="mr-1 h-3.5 w-3.5" />
                            Restore
                          </>
                        ) : (
                          <>
                            <Archive className="mr-1 h-3.5 w-3.5" />
                            Archive
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
          <FileSpreadsheet className="h-4 w-4" />
          Scope behavior
        </div>
        <ul className="mt-2 space-y-1 list-disc pl-5">
          <li>Parent visibility is primarily controlled by `targetCourseIds` via child active enrollments.</li>
          <li>Optional `targetKidIds` and `targetEnrollmentIds` apply additional filtering.</li>
          <li>Legacy `targetParentIds` docs are still readable as fallback during transition.</li>
          <li>This feature stores worksheet links only. Files remain in Google Drive.</li>
        </ul>
      </Card>
    </div>
  );
}
