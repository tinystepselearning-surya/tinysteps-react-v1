import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import {
  Archive,
  BookOpenText,
  ExternalLink,
  FileSpreadsheet,
  Pencil,
  RotateCcw,
  Save,
} from 'lucide-react';

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

type FolderRow = {
  id: string;
  area: string;
  title: string;
  sortOrder?: number;
  active?: boolean;
};

type LessonWorksheetResource = {
  id: string;
  title: string;
  url: string;
  description?: string;
  resourceType?: string;
  sortOrder?: number;
  active?: boolean;
  archived?: boolean;
};

type LessonRow = {
  id: string;
  area: string;
  folderId: string;
  title: string;
  sortOrder?: number;
  active?: boolean;
  teacherScript?: string;
  worksheetResources?: LessonWorksheetResource[];
};

type WorksheetFormState = {
  title: string;
  url: string;
  description: string;
  resourceType: string;
  lessonId: string;
  courseId: string;
  sortOrder: string;
  teacherScript: string;
  stageTag: string;
  kidId: string;
  enrollmentId: string;
  isActive: boolean;
};

const INITIAL_FORM: WorksheetFormState = {
  title: '',
  url: '',
  description: '',
  resourceType: 'Practice worksheet',
  lessonId: '',
  courseId: '',
  sortOrder: '0',
  teacherScript: '',
  stageTag: '',
  kidId: '',
  enrollmentId: '',
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

const normalizeResources = (value: unknown): LessonWorksheetResource[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((resource: any) => ({
      id: String(resource?.id || '').trim(),
      title: String(resource?.title || '').trim(),
      url: String(resource?.url || resource?.worksheetUrl || '').trim(),
      description: String(resource?.description || '').trim(),
      resourceType: String(resource?.resourceType || resource?.category || '').trim(),
      sortOrder: Number.isFinite(Number(resource?.sortOrder)) ? Number(resource.sortOrder) : 0,
      active: resource?.active !== false,
      archived: resource?.archived === true,
    }))
    .filter((resource) => resource.id && resource.title && resource.url);
};

const upsertResource = (
  resources: LessonWorksheetResource[],
  nextResource: LessonWorksheetResource,
): LessonWorksheetResource[] => {
  const withoutCurrent = resources.filter((resource) => resource.id !== nextResource.id);
  return [...withoutCurrent, nextResource].sort((a, b) => {
    const orderDiff = Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
    if (orderDiff !== 0) return orderDiff;
    return a.title.localeCompare(b.title);
  });
};

const removeResource = (
  resources: LessonWorksheetResource[],
  worksheetId: string,
): LessonWorksheetResource[] => resources.filter((resource) => resource.id !== worksheetId);

export default function ParentWorksheetLibraryManagement(): JSX.Element {
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [form, setForm] = useState<WorksheetFormState>(INITIAL_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingScript, setIsSavingScript] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const worksheetsQuery = useQuery({
    queryKey: ['adminParentWorksheetLibrary'],
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    queryFn: async (): Promise<ParentWorksheetItem[]> => {
      const snap = await getDocs(query(collection(db, 'parentWorksheetLibrary'), limit(500)));
      return snap.docs.map((entry) => toParentWorksheetItem(entry.id, entry.data()));
    },
  });

  const coursesQuery = useQuery({
    queryKey: ['adminWorksheetCourses'],
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<any[]> => {
      const snap = await getDocs(query(collection(db, 'courses'), limit(300)));
      return snap.docs.map((entry) => ({ id: entry.id, ...(entry.data() as any) }));
    },
  });

  const foldersQuery = useQuery({
    queryKey: ['adminWorksheetLessonFolders'],
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<FolderRow[]> => {
      const snap = await getDocs(query(collection(db, 'lessonFolders'), orderBy('sortOrder', 'asc')));
      return snap.docs.map((entry) => ({ id: entry.id, ...(entry.data() as any) } as FolderRow));
    },
  });

  const lessonsQuery = useQuery({
    queryKey: ['adminWorksheetLessonCatalog'],
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    queryFn: async (): Promise<LessonRow[]> => {
      const snap = await getDocs(query(collection(db, 'lessonCatalog'), orderBy('sortOrder', 'asc')));
      return snap.docs.map((entry) => {
        const data = entry.data() as any;
        return {
          id: entry.id,
          ...data,
          teacherScript: String(data?.teacherScript || '').trim(),
          worksheetResources: normalizeResources(data?.worksheetResources),
        } as LessonRow;
      });
    },
  });

  const kidsQuery = useQuery({
    queryKey: ['adminWorksheetKids'],
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<any[]> => {
      const snap = await getDocs(query(collection(db, 'kids'), limit(500)));
      return snap.docs.map((entry) => ({ id: entry.id, ...(entry.data() as any) }));
    },
  });

  const enrollmentsQuery = useQuery({
    queryKey: ['adminWorksheetEnrollments', form.kidId],
    enabled: !!form.kidId,
    staleTime: 0,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<any[]> => {
      const [byKidId, byKidIds] = await Promise.all([
        getDocs(query(collection(db, 'enrollments'), where('kidId', '==', form.kidId), limit(200))),
        getDocs(query(collection(db, 'enrollments'), where('kidIds', 'array-contains', form.kidId), limit(200))),
      ]);
      const map = new Map<string, any>();
      byKidId.docs.forEach((entry) => map.set(entry.id, { id: entry.id, ...(entry.data() as any) }));
      byKidIds.docs.forEach((entry) => map.set(entry.id, { id: entry.id, ...(entry.data() as any) }));
      return Array.from(map.values());
    },
  });

  const courses = useMemo(() => coursesQuery.data ?? [], [coursesQuery.data]);
  const folders = useMemo(() => foldersQuery.data ?? [], [foldersQuery.data]);
  const lessons = useMemo(() => (lessonsQuery.data ?? []).filter((lesson) => lesson.active !== false), [lessonsQuery.data]);
  const kids = useMemo(() => kidsQuery.data ?? [], [kidsQuery.data]);
  const enrollments = useMemo(() => enrollmentsQuery.data ?? [], [enrollmentsQuery.data]);
  const selectedLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === form.lessonId) ?? null,
    [form.lessonId, lessons],
  );
  const selectedEnrollment = useMemo(
    () => enrollments.find((enrollment) => String(enrollment.id) === String(form.enrollmentId)) ?? null,
    [enrollments, form.enrollmentId],
  );
  const folderById = useMemo(() => new Map(folders.map((folder) => [folder.id, folder])), [folders]);
  const lessonById = useMemo(() => new Map(lessons.map((lesson) => [lesson.id, lesson])), [lessons]);

  const worksheetItems = useMemo(() => {
    const items = worksheetsQuery.data ?? [];
    return [...items].sort((a, b) => {
      if (a.isArchived !== b.isArchived) return a.isArchived ? 1 : -1;
      if (a.lessonTitle !== b.lessonTitle) return a.lessonTitle.localeCompare(b.lessonTitle);
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return toMillis(b.updatedAt) - toMillis(a.updatedAt);
    });
  }, [worksheetsQuery.data]);

  useEffect(() => {
    if (!form.lessonId) return;
    const lesson = lessonById.get(form.lessonId);
    if (!lesson) return;
    setForm((previous) => ({
      ...previous,
      teacherScript: String(lesson.teacherScript || ''),
    }));
  }, [form.lessonId, lessonById]);

  const updateForm = <K extends keyof WorksheetFormState>(key: K, value: WorksheetFormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
  };

  const lessonLabel = (lesson: LessonRow): string => {
    const folder = folderById.get(lesson.folderId);
    const prefix = folder?.title ? `${folder.title} · ` : '';
    return `${prefix}${lesson.title}`;
  };

  const saveTeacherScript = async () => {
    if (!selectedLesson) {
      toast({ title: 'Lesson required', description: 'Select a lesson before saving its class script.', variant: 'destructive' });
      return;
    }
    setIsSavingScript(true);
    try {
      await setDoc(
        doc(db, 'lessonCatalog', selectedLesson.id),
        {
          teacherScript: String(form.teacherScript || '').trim(),
          teacherScriptUpdatedAt: serverTimestamp(),
          teacherScriptUpdatedBy: user?.uid || null,
          teacherScriptUpdatedByEmail: user?.email || null,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      toast({ title: 'Class script saved', description: selectedLesson.title });
      await lessonsQuery.refetch();
    } catch (error: any) {
      console.error('[WorksheetManagement] class script save failed', error);
      toast({ title: 'Save failed', description: error?.message || 'Could not save the class script.', variant: 'destructive' });
    } finally {
      setIsSavingScript(false);
    }
  };

  const handleSaveWorksheet = async () => {
    const title = String(form.title || '').trim();
    const url = normalizeWorksheetUrl(form.url);
    const lesson = selectedLesson;
    const directCourseId = String(form.courseId || '').trim();
    const inferredCourseId = String(selectedEnrollment?.courseId || '').trim();
    const resolvedCourseId = directCourseId || inferredCourseId;

    if (!lesson) {
      toast({ title: 'Lesson required', description: 'Tag the worksheet to the lesson where it is taught.', variant: 'destructive' });
      return;
    }
    if (!resolvedCourseId) {
      toast({ title: 'Course required', description: 'Select the enrolled course that should receive this worksheet.', variant: 'destructive' });
      return;
    }
    if (!title) {
      toast({ title: 'Title required', description: 'Add a short parent-friendly worksheet title.', variant: 'destructive' });
      return;
    }
    if (!url) {
      toast({ title: 'Valid URL required', description: 'Paste a valid Google Drive or HTTPS worksheet link.', variant: 'destructive' });
      return;
    }

    const worksheetRef = editingId
      ? doc(db, 'parentWorksheetLibrary', editingId)
      : doc(collection(db, 'parentWorksheetLibrary'));
    const sortOrder = Number(form.sortOrder);
    const normalizedSortOrder = Number.isFinite(sortOrder) ? sortOrder : 0;
    const resourceType = String(form.resourceType || '').trim() || 'Practice worksheet';
    const script = String(form.teacherScript || '').trim();

    setIsSaving(true);
    try {
      await runTransaction(db, async (transaction) => {
        const existingWorksheetSnap = editingId ? await transaction.get(worksheetRef) : null;
        const previousLessonId = existingWorksheetSnap?.exists()
          ? String(existingWorksheetSnap.data()?.lessonId || '').trim()
          : '';

        const nextLessonRef = doc(db, 'lessonCatalog', lesson.id);
        const previousLessonRef = previousLessonId && previousLessonId !== lesson.id
          ? doc(db, 'lessonCatalog', previousLessonId)
          : null;

        // Firestore transactions require reads before writes.
        const nextLessonSnap = await transaction.get(nextLessonRef);
        const previousLessonSnap = previousLessonRef ? await transaction.get(previousLessonRef) : null;

        const worksheetPayload = {
          title,
          url,
          worksheetUrl: url,
          description: String(form.description || '').trim(),
          resourceType,
          category: resourceType,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          targetLessonIds: [lesson.id],
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
          sortOrder: normalizedSortOrder,
          updatedAt: serverTimestamp(),
          updatedBy: user?.uid || null,
          updatedByEmail: user?.email || null,
          ...(editingId
            ? {}
            : {
                createdAt: serverTimestamp(),
                createdBy: user?.uid || null,
                createdByEmail: user?.email || null,
              }),
        };

        transaction.set(worksheetRef, worksheetPayload, { merge: true });

        const mirroredResource: LessonWorksheetResource = {
          id: worksheetRef.id,
          title,
          url,
          description: String(form.description || '').trim(),
          resourceType,
          sortOrder: normalizedSortOrder,
          active: form.isActive,
          archived: false,
        };

        if (previousLessonRef && previousLessonSnap?.exists()) {
          const previousResources = normalizeResources(previousLessonSnap.data()?.worksheetResources);
          transaction.set(
            previousLessonRef,
            {
              worksheetResources: removeResource(previousResources, worksheetRef.id),
              resourcesUpdatedAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          );
        }

        const currentResources = normalizeResources(nextLessonSnap.data()?.worksheetResources);
        transaction.set(
          nextLessonRef,
          {
            worksheetResources: upsertResource(currentResources, mirroredResource),
            teacherScript: script,
            teacherScriptUpdatedAt: serverTimestamp(),
            teacherScriptUpdatedBy: user?.uid || null,
            teacherScriptUpdatedByEmail: user?.email || null,
            resourcesUpdatedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      });

      toast({ title: editingId ? 'Worksheet updated' : 'Worksheet added', description: `${lesson.title} · ${title}` });
      resetForm();
      await Promise.all([worksheetsQuery.refetch(), lessonsQuery.refetch()]);
    } catch (error: any) {
      console.error('[WorksheetManagement] worksheet save failed', error);
      toast({ title: 'Save failed', description: error?.message || 'Could not save the worksheet.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (item: ParentWorksheetItem) => {
    const lesson = lessonById.get(item.lessonId);
    setEditingId(item.id);
    setForm({
      title: item.title,
      url: item.url,
      description: item.description,
      resourceType: item.resourceType || (item.lessonTitle ? '' : item.category) || 'Practice worksheet',
      lessonId: item.lessonId,
      courseId: item.targetCourseIds[0] || '',
      sortOrder: String(item.sortOrder ?? 0),
      teacherScript: String(lesson?.teacherScript || ''),
      stageTag: item.targetStageTags[0] || '',
      kidId: item.targetKidIds[0] || '',
      enrollmentId: item.targetEnrollmentIds[0] || '',
      isActive: item.isActive,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateWorksheetState = async (
    item: ParentWorksheetItem,
    patch: { isActive?: boolean; isArchived?: boolean },
  ) => {
    setActionId(item.id);
    try {
      const worksheetRef = doc(db, 'parentWorksheetLibrary', item.id);
      await runTransaction(db, async (transaction) => {
        const worksheetSnap = await transaction.get(worksheetRef);
        if (!worksheetSnap.exists()) throw new Error('Worksheet no longer exists.');

        const data = worksheetSnap.data() as any;
        const lessonId = String(data?.lessonId || item.lessonId || '').trim();
        const lessonRef = lessonId ? doc(db, 'lessonCatalog', lessonId) : null;
        const lessonSnap = lessonRef ? await transaction.get(lessonRef) : null;

        const nextActive = patch.isActive ?? (data?.isActive !== false && data?.active !== false);
        const nextArchived = patch.isArchived ?? (data?.isArchived === true || data?.archived === true);

        transaction.set(
          worksheetRef,
          {
            ...(patch.isActive !== undefined ? { isActive: patch.isActive, active: patch.isActive } : {}),
            ...(patch.isArchived !== undefined ? { isArchived: patch.isArchived, archived: patch.isArchived } : {}),
            updatedAt: serverTimestamp(),
            updatedBy: user?.uid || null,
            updatedByEmail: user?.email || null,
          },
          { merge: true },
        );

        if (lessonRef && lessonSnap?.exists()) {
          const resources = normalizeResources(lessonSnap.data()?.worksheetResources);
          const resource = resources.find((entry) => entry.id === item.id);
          if (resource) {
            transaction.set(
              lessonRef,
              {
                worksheetResources: upsertResource(resources, {
                  ...resource,
                  active: nextActive,
                  archived: nextArchived,
                }),
                resourcesUpdatedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              },
              { merge: true },
            );
          }
        }
      });
      await Promise.all([worksheetsQuery.refetch(), lessonsQuery.refetch()]);
      toast({
        title: patch.isArchived === true
          ? 'Worksheet archived'
          : patch.isArchived === false
            ? 'Worksheet restored'
            : patch.isActive === false
              ? 'Worksheet hidden'
              : 'Worksheet activated',
      });
    } catch (error: any) {
      console.error('[WorksheetManagement] state update failed', error);
      toast({ title: 'Update failed', description: error?.message || 'Could not update worksheet.', variant: 'destructive' });
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="space-y-5 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Worksheet & Teaching Resource Manager</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
              Attach each Google Drive worksheet to a curriculum lesson and an enrolled course. The same lesson record powers the teacher worksheet buttons and private class script, while parents only receive worksheets allowed by their enrolment.
            </p>
          </div>
          {editingId ? (
            <Button type="button" variant="outline" onClick={resetForm}>Cancel edit</Button>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2 lg:col-span-1">
            <Label>Lesson / Class *</Label>
            <Select value={form.lessonId || '__none__'} onValueChange={(value) => updateForm('lessonId', value === '__none__' ? '' : value)}>
              <SelectTrigger><SelectValue placeholder="Select the lesson" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select lesson</SelectItem>
                {lessons.map((lesson) => (
                  <SelectItem key={lesson.id} value={lesson.id}>{lessonLabel(lesson)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">This is the canonical link between lesson content, teacher resources, and parent worksheets.</p>
          </div>

          <div className="space-y-2">
            <Label>Course visibility *</Label>
            <Select value={form.courseId || '__none__'} onValueChange={(value) => updateForm('courseId', value === '__none__' ? '' : value)}>
              <SelectTrigger><SelectValue placeholder="Select enrolled course" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select course</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name || course.title || course.label || course.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">Parents see this resource only when the selected child is enrolled in this course.</p>
          </div>

          <div className="space-y-2">
            <Label>Worksheet title *</Label>
            <Input value={form.title} onChange={(event) => updateForm('title', event.target.value)} placeholder="CVC Blending Practice" />
          </div>

          <div className="space-y-2">
            <Label>Google Drive / worksheet URL *</Label>
            <Input value={form.url} onChange={(event) => updateForm('url', event.target.value)} placeholder="https://drive.google.com/..." />
          </div>

          <div className="space-y-2">
            <Label>Activity type</Label>
            <Input value={form.resourceType} onChange={(event) => updateForm('resourceType', event.target.value)} placeholder="Practice worksheet / Homework / Revision" />
          </div>

          <div className="space-y-2">
            <Label>Sort order</Label>
            <Input type="number" value={form.sortOrder} onChange={(event) => updateForm('sortOrder', event.target.value)} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Parent guidance</Label>
            <Textarea value={form.description} onChange={(event) => updateForm('description', event.target.value)} placeholder="One short sentence explaining what the child should practise." rows={2} />
          </div>
        </div>

        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 dark:border-indigo-900 dark:bg-indigo-950/20">
          <div className="mb-2 flex items-center gap-2">
            <BookOpenText className="h-4 w-4 text-indigo-700" />
            <Label className="text-sm font-semibold text-indigo-950 dark:text-indigo-100">Teacher class script</Label>
          </div>
          <Textarea
            value={form.teacherScript}
            onChange={(event) => updateForm('teacherScript', event.target.value)}
            placeholder="Paste the teacher-facing lesson script here: opening, explanation, examples, prompts, checks for understanding, and close."
            rows={10}
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-indigo-800/80 dark:text-indigo-200/80">Private to teachers/admins. Parents never read this field.</p>
            <Button type="button" variant="outline" onClick={saveTeacherScript} disabled={isSavingScript || !form.lessonId}>
              <Save className="mr-2 h-4 w-4" />
              {isSavingScript ? 'Saving script…' : 'Save class script'}
            </Button>
          </div>
        </div>

        <details className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/40">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-100">Advanced targeting (optional)</summary>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Child override</Label>
              <Select
                value={form.kidId || '__none__'}
                onValueChange={(value) => {
                  const nextKidId = value === '__none__' ? '' : value;
                  setForm((previous) => ({ ...previous, kidId: nextKidId, enrollmentId: '' }));
                }}
              >
                <SelectTrigger><SelectValue placeholder="All children on course" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No child override</SelectItem>
                  {kids.map((kid) => <SelectItem key={kid.id} value={kid.id}>{kid.fullName || kid.name || kid.id}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Enrollment override</Label>
              <Select value={form.enrollmentId || '__none__'} onValueChange={(value) => updateForm('enrollmentId', value === '__none__' ? '' : value)} disabled={!form.kidId}>
                <SelectTrigger><SelectValue placeholder="No enrollment override" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No enrollment override</SelectItem>
                  {enrollments.map((enrollment) => (
                    <SelectItem key={enrollment.id} value={enrollment.id}>
                      {enrollment.courseName || enrollment.courseLabel || enrollment.courseId || enrollment.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Stage / topic tag</Label>
              <Input value={form.stageTag} onChange={(event) => updateForm('stageTag', event.target.value)} placeholder="Stage 2 / Short vowels" />
            </div>
          </div>
        </details>

        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          <input type="checkbox" checked={form.isActive} onChange={(event) => updateForm('isActive', event.target.checked)} />
          Active for parent and teacher resource views
        </label>

        <Button type="button" onClick={handleSaveWorksheet} disabled={isSaving}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          {isSaving ? 'Saving worksheet…' : editingId ? 'Update worksheet' : 'Add worksheet'}
        </Button>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Worksheet items</h3>
            <p className="text-sm text-slate-500">Lesson-linked resources appear in teacher Lesson Library and parent Classes → Worksheets.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => Promise.all([worksheetsQuery.refetch(), lessonsQuery.refetch()])}>
            Refresh
          </Button>
        </div>

        {worksheetsQuery.isLoading ? (
          <div className="py-8 text-center text-sm text-slate-500">Loading worksheets…</div>
        ) : worksheetItems.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">No worksheets added yet.</div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {worksheetItems.map((item) => {
              const safeUrl = getSafeWorksheetUrl(item.url);
              const itemLesson = lessonById.get(item.lessonId);
              return (
                <div key={item.id} className="flex flex-col gap-3 py-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{item.title || 'Worksheet'}</span>
                      {item.isArchived ? <Badge variant="outline">Archived</Badge> : null}
                      {!item.isActive ? <Badge variant="secondary">Hidden</Badge> : null}
                      {item.resourceType ? <Badge variant="outline">{item.resourceType}</Badge> : null}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Lesson: {itemLesson ? lessonLabel(itemLesson) : item.lessonTitle || 'Legacy / not linked'}
                      {' · '}Course: {item.targetCourseIds[0] || '—'}
                      {' · '}Order: {item.sortOrder}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" disabled={!safeUrl} onClick={() => safeUrl && window.open(safeUrl, '_blank', 'noopener,noreferrer')}>
                      Open <ExternalLink className="ml-1 h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => handleEdit(item)}>
                      <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                    </Button>
                    {item.isArchived ? (
                      <Button type="button" size="sm" variant="outline" disabled={actionId === item.id} onClick={() => updateWorksheetState(item, { isArchived: false })}>
                        <RotateCcw className="mr-1 h-3.5 w-3.5" /> Restore
                      </Button>
                    ) : (
                      <>
                        <Button type="button" size="sm" variant="outline" disabled={actionId === item.id} onClick={() => updateWorksheetState(item, { isActive: !item.isActive })}>
                          {item.isActive ? 'Hide' : 'Activate'}
                        </Button>
                        <Button type="button" size="sm" variant="outline" disabled={actionId === item.id} onClick={() => updateWorksheetState(item, { isArchived: true })}>
                          <Archive className="mr-1 h-3.5 w-3.5" /> Archive
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="border-dashed p-4 text-sm text-slate-600 dark:text-slate-300">
        <strong>Visibility model:</strong> lesson association controls teacher resources; course enrolment controls parent visibility; optional child/enrolment overrides only narrow access further. Class scripts remain on the teacher-readable lesson catalog and are never written to the parent worksheet document.
      </Card>
    </div>
  );
}
