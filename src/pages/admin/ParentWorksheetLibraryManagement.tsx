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
import {
  existingArchivedState,
  explicitTeacherScriptPatch,
  normalizeLessonWorksheetResources as normalizeResources,
  removeLessonWorksheetResource as removeResource,
  upsertLessonWorksheetResource as upsertResource,
  worksheetResourceProjectionPatch,
  type LessonWorksheetResource,
} from '../../lib/adminWorksheetResources';
import {
  resolveWorksheetCourse,
  worksheetCourseTitle,
  type WorksheetCourseLike,
} from '../../lib/worksheetCourseResolution';

type FolderRow = {
  id: string;
  area: string;
  title: string;
  sortOrder?: number;
  active?: boolean;
  courseId?: string;
  courseTitle?: string;
};

type LessonRow = {
  id: string;
  area: string;
  folderId: string;
  title: string;
  sortOrder?: number;
  active?: boolean;
  courseId?: string;
  courseTitle?: string;
  teacherScript?: string;
  worksheetResources?: LessonWorksheetResource[];
};

type CourseRow = WorksheetCourseLike & Record<string, unknown>;

type WorksheetFormState = {
  title: string;
  url: string;
  description: string;
  resourceType: string;
  lessonId: string;
  sortOrder: string;
  stageTag: string;
  kidId: string;
  enrollmentId: string;
  isActive: boolean;
};

type WorksheetStatusFilter = 'all' | 'active' | 'hidden' | 'archived';

const NONE_VALUE = '__none__';
const ALL_VALUE = '__all__';

const RESOURCE_TYPES = [
  'Practice worksheet',
  'Revision worksheet',
  'Reading practice',
  'Writing practice',
  'Assessment',
  'Homework',
  'Activity',
  'Challenge',
  'Supplementary resource',
] as const;

const INITIAL_FORM: WorksheetFormState = {
  title: '',
  url: '',
  description: '',
  resourceType: 'Practice worksheet',
  lessonId: '',
  sortOrder: '0',
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

const normalizeCourseId = (course: CourseRow): string => String(course.id || course.courseId || '').trim();

export default function ParentWorksheetLibraryManagement(): JSX.Element {
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [form, setForm] = useState<WorksheetFormState>(INITIAL_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [teacherScript, setTeacherScript] = useState('');
  const [mappingCourseId, setMappingCourseId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingScript, setIsSavingScript] = useState(false);
  const [isSavingCourseMapping, setIsSavingCourseMapping] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const [searchFilter, setSearchFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState(ALL_VALUE);
  const [lessonFilter, setLessonFilter] = useState(ALL_VALUE);
  const [statusFilter, setStatusFilter] = useState<WorksheetStatusFilter>('all');
  const [resourceTypeFilter, setResourceTypeFilter] = useState(ALL_VALUE);

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
    queryFn: async (): Promise<CourseRow[]> => {
      const snap = await getDocs(query(collection(db, 'courses'), limit(300)));
      return snap.docs.map((entry) => ({ id: entry.id, ...(entry.data() as any) } as CourseRow));
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
          courseId: String(data?.courseId || '').trim(),
          courseTitle: String(data?.courseTitle || '').trim(),
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
      const [byKidId, byStudentId, byChildId, byKidIds] = await Promise.all([
        getDocs(query(collection(db, 'enrollments'), where('kidId', '==', form.kidId), limit(200))),
        getDocs(query(collection(db, 'enrollments'), where('studentId', '==', form.kidId), limit(200))),
        getDocs(query(collection(db, 'enrollments'), where('childId', '==', form.kidId), limit(200))),
        getDocs(query(collection(db, 'enrollments'), where('kidIds', 'array-contains', form.kidId), limit(200))),
      ]);
      const map = new Map<string, any>();
      byKidId.docs.forEach((entry) => map.set(entry.id, { id: entry.id, ...(entry.data() as any) }));
      byStudentId.docs.forEach((entry) => map.set(entry.id, { id: entry.id, ...(entry.data() as any) }));
      byChildId.docs.forEach((entry) => map.set(entry.id, { id: entry.id, ...(entry.data() as any) }));
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
  const selectedFolder = selectedLesson ? folderById.get(selectedLesson.folderId) ?? null : null;

  const courseResolution = useMemo(
    () => resolveWorksheetCourse({ lesson: selectedLesson, folder: selectedFolder, courses }),
    [courses, selectedFolder, selectedLesson],
  );
  const resolvedCourseId = courseResolution.courseId;
  const selectedCourse = useMemo(
    () => courses.find((course) => normalizeCourseId(course) === resolvedCourseId) ?? null,
    [courses, resolvedCourseId],
  );
  const resolvedCourseTitle = courseResolution.courseTitle || worksheetCourseTitle(selectedCourse) || resolvedCourseId;

  const worksheetItems = useMemo(() => {
    const items = worksheetsQuery.data ?? [];
    return [...items].sort((a, b) => {
      if (a.isArchived !== b.isArchived) return a.isArchived ? 1 : -1;
      if (a.lessonTitle !== b.lessonTitle) return a.lessonTitle.localeCompare(b.lessonTitle);
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return toMillis(b.updatedAt) - toMillis(a.updatedAt);
    });
  }, [worksheetsQuery.data]);

  const resourceTypeOptions = useMemo(() => {
    const extra = worksheetItems
      .map((item) => String(item.resourceType || '').trim())
      .filter((value) => value && !RESOURCE_TYPES.includes(value as (typeof RESOURCE_TYPES)[number]));
    return [...RESOURCE_TYPES, ...Array.from(new Set(extra)).sort()];
  }, [worksheetItems]);

  const filteredWorksheetItems = useMemo(() => {
    const needle = searchFilter.trim().toLowerCase();
    return worksheetItems.filter((item) => {
      if (needle) {
        const haystack = [
          item.title,
          item.description,
          item.resourceType,
          item.lessonTitle,
          item.lessonFolderTitle,
          item.courseId,
          item.courseTitle,
          ...item.targetStageTags,
        ].join(' ').toLowerCase();
        if (!haystack.includes(needle)) return false;
      }

      if (courseFilter !== ALL_VALUE) {
        const itemCourseIds = new Set([item.courseId, ...item.targetCourseIds].filter(Boolean));
        if (!itemCourseIds.has(courseFilter)) return false;
      }

      if (lessonFilter !== ALL_VALUE && item.lessonId !== lessonFilter) return false;
      if (resourceTypeFilter !== ALL_VALUE && item.resourceType !== resourceTypeFilter) return false;

      if (statusFilter === 'active' && (item.isArchived || !item.isActive)) return false;
      if (statusFilter === 'hidden' && (item.isArchived || item.isActive)) return false;
      if (statusFilter === 'archived' && !item.isArchived) return false;

      return true;
    });
  }, [courseFilter, lessonFilter, resourceTypeFilter, searchFilter, statusFilter, worksheetItems]);

  useEffect(() => {
    if (!form.lessonId) {
      setTeacherScript('');
      return;
    }
    const lesson = lessonById.get(form.lessonId);
    setTeacherScript(String(lesson?.teacherScript || ''));
  }, [form.lessonId, lessonById]);

  useEffect(() => {
    setMappingCourseId(courseResolution.courseId || '');
  }, [courseResolution.courseId, form.lessonId]);

  const updateForm = <K extends keyof WorksheetFormState>(key: K, value: WorksheetFormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
  };

  const resetFilters = () => {
    setSearchFilter('');
    setCourseFilter(ALL_VALUE);
    setLessonFilter(ALL_VALUE);
    setStatusFilter('all');
    setResourceTypeFilter(ALL_VALUE);
  };

  const lessonLabel = (lesson: LessonRow): string => {
    const folder = folderById.get(lesson.folderId);
    const prefix = folder?.title ? `${folder.title} · ` : '';
    return `${prefix}${lesson.title}`;
  };

  const saveLessonCourseMapping = async () => {
    if (!selectedLesson) {
      toast({ title: 'Lesson required', description: 'Select a lesson before mapping its course.', variant: 'destructive' });
      return;
    }
    const course = courses.find((entry) => normalizeCourseId(entry) === mappingCourseId);
    if (!course) {
      toast({ title: 'Course required', description: 'Choose the canonical course for this lesson.', variant: 'destructive' });
      return;
    }

    setIsSavingCourseMapping(true);
    try {
      const courseId = normalizeCourseId(course);
      const courseTitle = worksheetCourseTitle(course) || courseId;
      await setDoc(
        doc(db, 'lessonCatalog', selectedLesson.id),
        {
          courseId,
          courseTitle,
          courseMappedAt: serverTimestamp(),
          courseMappedBy: user?.uid || null,
          courseMappedByEmail: user?.email || null,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      toast({ title: 'Lesson course mapped', description: `${selectedLesson.title} → ${courseTitle}` });
      await lessonsQuery.refetch();
    } catch (error: any) {
      console.error('[WorksheetManagement] course mapping save failed', error);
      toast({ title: 'Mapping failed', description: error?.message || 'Could not map this lesson to a course.', variant: 'destructive' });
    } finally {
      setIsSavingCourseMapping(false);
    }
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
          ...explicitTeacherScriptPatch(teacherScript),
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
    const courseId = String(resolvedCourseId || '').trim();
    const courseTitle = String(resolvedCourseTitle || '').trim() || courseId;
    const enrollmentCourseId = String(selectedEnrollment?.courseId || '').trim();

    if (!lesson) {
      toast({ title: 'Lesson required', description: 'Tag the worksheet to the lesson where it is taught.', variant: 'destructive' });
      return;
    }
    if (!courseId) {
      toast({
        title: 'Lesson course mapping required',
        description: courseResolution.ambiguous
          ? 'This lesson matches more than one course. Map the lesson to its canonical course first.'
          : 'This lesson does not have a reliable course mapping yet. Map it once before adding worksheets.',
        variant: 'destructive',
      });
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
    if (selectedEnrollment && enrollmentCourseId !== courseId) {
      toast({ title: 'Enrollment mismatch', description: 'The enrollment override must belong to this lesson’s course.', variant: 'destructive' });
      return;
    }
    if (form.enrollmentId && !selectedEnrollment) {
      toast({ title: 'Enrollment required', description: 'Select a valid enrollment for this child.', variant: 'destructive' });
      return;
    }
    if (form.kidId) {
      const childHasCourse = enrollments.some((enrollment) =>
        String(enrollment.courseId || '').trim() === courseId
        && !['inactive', 'cancelled', 'canceled', 'withdrawn', 'closed', 'completed', 'archived']
          .includes(String(enrollment.status || 'active').trim().toLowerCase()),
      );
      if (!childHasCourse) {
        toast({ title: 'Child/course mismatch', description: 'The selected child needs a valid enrollment in this lesson’s course.', variant: 'destructive' });
        return;
      }
    }

    const worksheetRef = editingId
      ? doc(db, 'parentWorksheetLibrary', editingId)
      : doc(collection(db, 'parentWorksheetLibrary'));
    const sortOrder = Number(form.sortOrder);
    const normalizedSortOrder = Number.isFinite(sortOrder) ? sortOrder : 0;
    const resourceType = String(form.resourceType || '').trim() || 'Practice worksheet';

    setIsSaving(true);
    try {
      await runTransaction(db, async (transaction) => {
        const existingWorksheetSnap = editingId ? await transaction.get(worksheetRef) : null;
        const previousLessonId = existingWorksheetSnap?.exists()
          ? String(existingWorksheetSnap.data()?.lessonId || '').trim()
          : '';
        const existingData = existingWorksheetSnap?.data() || {};
        const existingArchived = existingArchivedState(existingData);

        const nextLessonRef = doc(db, 'lessonCatalog', lesson.id);
        const previousLessonRef = previousLessonId && previousLessonId !== lesson.id
          ? doc(db, 'lessonCatalog', previousLessonId)
          : null;

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
          lessonFolderId: lesson.folderId,
          lessonFolderTitle: folderById.get(lesson.folderId)?.title || '',
          courseId,
          courseTitle,
          targetLessonIds: [lesson.id],
          targetCourseIds: [courseId],
          targetKidIds: form.kidId ? [form.kidId] : [],
          targetChildIds: form.kidId ? [form.kidId] : [],
          targetEnrollmentIds: form.enrollmentId ? [form.enrollmentId] : [],
          targetStageTags: form.stageTag ? [String(form.stageTag).trim()] : [],
          stageTags: form.stageTag ? [String(form.stageTag).trim()] : [],
          isActive: form.isActive,
          active: form.isActive,
          isArchived: editingId ? existingArchived : false,
          archived: editingId ? existingArchived : false,
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
          archived: editingId ? existingArchived : false,
          targetCourseIds: [courseId],
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
            ...worksheetResourceProjectionPatch(currentResources, mirroredResource),
            courseId,
            courseTitle,
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
    setEditingId(item.id);
    setForm({
      title: item.title,
      url: item.url,
      description: item.description,
      resourceType: item.resourceType || (item.lessonTitle ? '' : item.category) || 'Practice worksheet',
      lessonId: item.lessonId,
      sortOrder: String(item.sortOrder ?? 0),
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

  const canonicalCourseTone = courseResolution.source === 'lesson' || courseResolution.source === 'folder';

  return (
    <div className="space-y-5">
      <Card className="space-y-5 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Worksheet & Resource Manager</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
              Attach each Google Drive worksheet to a curriculum lesson. The lesson owns the course relationship, so admins cannot accidentally publish a worksheet under a mismatched course.
            </p>
          </div>
          {editingId ? (
            <Button type="button" variant="outline" onClick={resetForm}>Cancel edit</Button>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Lesson / Class *</Label>
            <Select
              value={form.lessonId || NONE_VALUE}
              onValueChange={(value) => {
                const lessonId = value === NONE_VALUE ? '' : value;
                setForm((previous) => ({ ...previous, lessonId, enrollmentId: '' }));
              }}
            >
              <SelectTrigger><SelectValue placeholder="Select the lesson" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>Select lesson</SelectItem>
                {lessons.map((lesson) => (
                  <SelectItem key={lesson.id} value={lesson.id}>{lessonLabel(lesson)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">This canonical lesson links slides, teacher resources, worksheets, and the parent course entitlement.</p>
          </div>

          <div className="space-y-2">
            <Label>Course from selected lesson *</Label>
            <div className="min-h-10 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
              {!selectedLesson ? (
                <span className="text-sm text-slate-500">Select a lesson first.</span>
              ) : resolvedCourseId ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{resolvedCourseTitle}</span>
                  <Badge variant="outline">{canonicalCourseTone ? 'Canonical mapping' : 'Auto-matched'}</Badge>
                </div>
              ) : (
                <span className="text-sm font-medium text-amber-700">
                  {courseResolution.ambiguous ? 'More than one course matches this lesson.' : 'No reliable course mapping found for this lesson.'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">Course visibility is derived from the lesson and is no longer selected separately per worksheet.</p>

            {selectedLesson ? (
              <details className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
                <summary className="cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {resolvedCourseId ? 'Change lesson course mapping' : 'Map this lesson to a course'}
                </summary>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Select value={mappingCourseId || NONE_VALUE} onValueChange={(value) => setMappingCourseId(value === NONE_VALUE ? '' : value)}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Select canonical course" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>Select course</SelectItem>
                      {courses.map((course) => {
                        const courseId = normalizeCourseId(course);
                        return <SelectItem key={courseId} value={courseId}>{worksheetCourseTitle(course) || courseId}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" onClick={saveLessonCourseMapping} disabled={isSavingCourseMapping || !mappingCourseId}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSavingCourseMapping ? 'Saving…' : 'Save lesson mapping'}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-slate-500">This is a one-time lesson setting, not a worksheet visibility setting.</p>
              </details>
            ) : null}
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
            <Select value={form.resourceType} onValueChange={(value) => updateForm('resourceType', value)}>
              <SelectTrigger><SelectValue placeholder="Select activity type" /></SelectTrigger>
              <SelectContent>
                {RESOURCE_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                {form.resourceType && !RESOURCE_TYPES.includes(form.resourceType as (typeof RESOURCE_TYPES)[number]) ? (
                  <SelectItem value={form.resourceType}>{form.resourceType} (existing)</SelectItem>
                ) : null}
              </SelectContent>
            </Select>
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

        <details className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/40">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-100">Advanced targeting (optional)</summary>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Child override</Label>
              <Select
                value={form.kidId || NONE_VALUE}
                onValueChange={(value) => {
                  const nextKidId = value === NONE_VALUE ? '' : value;
                  setForm((previous) => ({ ...previous, kidId: nextKidId, enrollmentId: '' }));
                }}
              >
                <SelectTrigger><SelectValue placeholder="All children on course" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>No child override</SelectItem>
                  {kids.map((kid) => <SelectItem key={kid.id} value={kid.id}>{kid.fullName || kid.name || kid.id}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Enrollment override</Label>
              <Select
                value={form.enrollmentId || NONE_VALUE}
                onValueChange={(value) => updateForm('enrollmentId', value === NONE_VALUE ? '' : value)}
                disabled={!form.kidId || !resolvedCourseId}
              >
                <SelectTrigger><SelectValue placeholder="No enrollment override" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>No enrollment override</SelectItem>
                  {enrollments
                    .filter((enrollment) => !resolvedCourseId || String(enrollment.courseId) === resolvedCourseId)
                    .map((enrollment) => (
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

      <Card className="space-y-4 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-indigo-50 p-2 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200">
            <BookOpenText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Lesson teaching script</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              This belongs to the selected lesson, not to any worksheet. It is stored on the teacher-readable lesson catalog and is never written to the parent worksheet document.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
          {selectedLesson ? (
            <span><strong>{lessonLabel(selectedLesson)}</strong>{resolvedCourseTitle ? ` · ${resolvedCourseTitle}` : ''}</span>
          ) : (
            <span className="text-slate-500">Select a Lesson / Class above to manage its teacher script.</span>
          )}
        </div>

        <Textarea
          value={teacherScript}
          onChange={(event) => setTeacherScript(event.target.value)}
          placeholder="Paste the teacher-facing lesson script here: opening, explanation, examples, prompts, checks for understanding, and close."
          rows={10}
          disabled={!selectedLesson}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-500">Private to teachers/admins. Parents never receive this field.</p>
          <Button type="button" variant="outline" onClick={saveTeacherScript} disabled={isSavingScript || !selectedLesson}>
            <Save className="mr-2 h-4 w-4" />
            {isSavingScript ? 'Saving script…' : 'Save lesson script'}
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Worksheet items</h3>
            <p className="text-sm text-slate-500">Search and audit lesson-linked resources across courses before editing, hiding, or archiving them.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => Promise.all([worksheetsQuery.refetch(), lessonsQuery.refetch()])}>
            Refresh
          </Button>
        </div>

        <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 md:grid-cols-2 xl:grid-cols-5 dark:border-slate-700 dark:bg-slate-900/40">
          <div className="space-y-1 xl:col-span-2">
            <Label className="text-xs">Search</Label>
            <Input value={searchFilter} onChange={(event) => setSearchFilter(event.target.value)} placeholder="Title, lesson, course, guidance, tag…" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Course</Label>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>All courses</SelectItem>
                {courses.map((course) => {
                  const courseId = normalizeCourseId(course);
                  return <SelectItem key={courseId} value={courseId}>{worksheetCourseTitle(course) || courseId}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Lesson</Label>
            <Select value={lessonFilter} onValueChange={setLessonFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>All lessons</SelectItem>
                {lessons.map((lesson) => <SelectItem key={lesson.id} value={lesson.id}>{lessonLabel(lesson)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as WorksheetStatusFilter)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 xl:col-span-2">
            <Label className="text-xs">Activity type</Label>
            <Select value={resourceTypeFilter} onValueChange={setResourceTypeFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>All activity types</SelectItem>
                {resourceTypeOptions.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end xl:col-span-3">
            <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>Reset filters</Button>
            <span className="ml-auto text-xs text-slate-500">Showing {filteredWorksheetItems.length} of {worksheetItems.length}</span>
          </div>
        </div>

        {worksheetsQuery.isLoading ? (
          <div className="py-8 text-center text-sm text-slate-500">Loading worksheets…</div>
        ) : worksheetItems.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">No worksheets added yet.</div>
        ) : filteredWorksheetItems.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">No worksheets match the selected filters.</div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredWorksheetItems.map((item) => {
              const safeUrl = getSafeWorksheetUrl(item.url);
              const itemLesson = lessonById.get(item.lessonId);
              const itemCourseId = item.courseId || item.targetCourseIds[0] || '';
              const itemCourse = courses.find((course) => normalizeCourseId(course) === itemCourseId);
              const itemCourseTitle = item.courseTitle || worksheetCourseTitle(itemCourse) || itemCourseId || '—';
              return (
                <div key={item.id} className="flex flex-col gap-3 py-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{item.title || 'Worksheet'}</span>
                      {item.isArchived ? <Badge variant="outline">Archived</Badge> : null}
                      {!item.isArchived && !item.isActive ? <Badge variant="secondary">Hidden</Badge> : null}
                      {item.resourceType ? <Badge variant="outline">{item.resourceType}</Badge> : null}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Lesson: {itemLesson ? lessonLabel(itemLesson) : item.lessonTitle || 'Legacy / not linked'}
                      {' · '}Course: {itemCourseTitle}
                      {' · '}Order: {item.sortOrder}
                    </div>
                    {item.description ? <p className="mt-1 line-clamp-1 text-xs text-slate-500">{item.description}</p> : null}
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
        <strong>Visibility model:</strong> lesson association controls teacher resources; the lesson’s canonical course controls parent visibility; optional child/enrolment overrides only narrow access further. Class scripts remain on the teacher-readable lesson catalog and are never written to the parent worksheet document.
      </Card>
    </div>
  );
}
