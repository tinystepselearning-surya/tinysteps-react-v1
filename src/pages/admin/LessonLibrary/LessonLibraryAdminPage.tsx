import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { toast } from '@components/hooks/use-toast';

type Folder = {
  id: string;
  area: string;
  title: string;
  sortOrder: number;
  active: boolean;
  createdAt?: any;
  updatedAt?: any;
};

type Lesson = {
  id: string;
  area: string;
  folderId: string;
  title: string;
  canvaViewUrl?: string | null;
  canvaEmbedUrl?: string | null;
  tags?: string[];
  sortOrder?: number;
  active?: boolean;
  rolesAllowed?: string[];
  createdAt?: any;
  updatedAt?: any;
  createdBy?: string | null;
};

type LessonDailyAuditRow = {
  id: string;
  teacherUid: string;
  teacherName: string;
  lessonId: string;
  lessonTitle: string;
  dateKey: string;
  openCount: number;
  firstOpenedAt?: any;
  lastOpenedAt?: any;
};

type TeacherDailyAccessRow = {
  id: string;
  teacherUid: string;
  teacherName: string;
  dateKey: string;
  totalLessonOpens: number;
  distinctLessonCount: number;
  lastAccessedAt?: any;
};

type EditableFolderDraft = {
  area: string;
  title: string;
  sortOrder: number;
  active: boolean;
};

type EditableLessonDraft = {
  area: string;
  folderId: string;
  title: string;
  canvaViewUrl: string;
  canvaEmbedUrl: string;
  tagsInput: string;
  sortOrder: number;
  active: boolean;
};

const AREA_OPTIONS = [
  { value: 'phonics', label: 'Phonics' },
  { value: 'grammar', label: 'Grammar' },
  { value: 'public_speaking', label: 'Public Speaking' },
  { value: 'spoken_english', label: 'Spoken English' },
];

function isValidHttpsCanvaUrl(rawUrl: string): boolean {
  if (!rawUrl.trim()) return false;
  try {
    const url = new URL(rawUrl.trim());
    return url.protocol === 'https:' && url.hostname.includes('canva.com');
  } catch {
    return false;
  }
}

function deriveEmbedUrl(canvaViewUrl: string, explicitEmbedUrl: string): string {
  const preferred = explicitEmbedUrl.trim();
  if (preferred) return preferred;
  const fallback = canvaViewUrl.trim();
  if (!fallback) return '';
  try {
    const url = new URL(fallback);
    url.searchParams.set('embed', '1');
    return url.toString();
  } catch {
    return '';
  }
}

function parseTagsInput(rawTags: string): string[] {
  const cleanTags = rawTags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
  return Array.from(new Set(cleanTags));
}

function normalizeTags(rawTags: unknown): string[] {
  if (!Array.isArray(rawTags)) return [];
  return Array.from(
    new Set(
      rawTags
        .map((tag) => String(tag).trim())
        .filter(Boolean)
    )
  );
}

function toLessonCatalogPayload(lesson: {
  area: string;
  folderId: string;
  title: string;
  tags?: string[];
  sortOrder?: number;
  active?: boolean;
}) {
  return {
    area: lesson.area,
    folderId: lesson.folderId,
    title: lesson.title,
    tags: lesson.tags || [],
    sortOrder: Number(lesson.sortOrder || 0),
    active: lesson.active !== false,
  };
}

function formatDateTime(value: unknown): string {
  if (typeof value === 'object' && value !== null && typeof (value as any).toMillis === 'function') {
    const ms = Number((value as any).toMillis());
    if (Number.isFinite(ms)) {
      return new Date(ms).toLocaleString();
    }
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toLocaleString();
  }
  return '-';
}

export default function LessonLibraryAdminPage() {
  const [area, setArea] = useState('phonics');
  const [folderTitle, setFolderTitle] = useState('');

  const [folderSort, setFolderSort] = useState<number>(0);
  const [folderActive, setFolderActive] = useState(true);

  const [lessonArea, setLessonArea] = useState('phonics');
  const [lessonFolderId, setLessonFolderId] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [canvaViewUrl, setCanvaViewUrl] = useState('');
  const [canvaEmbedUrl, setCanvaEmbedUrl] = useState('');
  const [lessonTagsInput, setLessonTagsInput] = useState('');
  const [lessonSort, setLessonSort] = useState<number>(0);
  const [lessonActive, setLessonActive] = useState(true);

  const [folders, setFolders] = useState<Folder[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonDailyAudit, setLessonDailyAudit] = useState<LessonDailyAuditRow[]>([]);
  const [teacherDailyAccess, setTeacherDailyAccess] = useState<TeacherDailyAccessRow[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [folderDraft, setFolderDraft] = useState<EditableFolderDraft>({
    area: 'phonics',
    title: '',
    sortOrder: 0,
    active: true,
  });
  const [lessonDraft, setLessonDraft] = useState<EditableLessonDraft>({
    area: 'phonics',
    folderId: '',
    title: '',
    canvaViewUrl: '',
    canvaEmbedUrl: '',
    tagsInput: '',
    sortOrder: 0,
    active: true,
  });
  const [auditLessonQuery, setAuditLessonQuery] = useState('');
  const [auditTeacherQuery, setAuditTeacherQuery] = useState('');

  useEffect(() => {
    fetchFolders();
    fetchLessons();
    fetchAuditTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const areaFolders = folders.filter((folder) => folder.area === lessonArea);
    if (areaFolders.length === 0) {
      setLessonFolderId('');
      return;
    }
    const selectedIsValid = areaFolders.some((folder) => folder.id === lessonFolderId);
    if (!selectedIsValid) {
      setLessonFolderId(areaFolders[0].id);
    }
  }, [folders, lessonArea, lessonFolderId]);

  useEffect(() => {
    if (!editingLessonId) return;
    const areaFolders = folders.filter((folder) => folder.area === lessonDraft.area);
    if (areaFolders.length === 0) {
      if (lessonDraft.folderId !== '') {
        setLessonDraft((prev) => ({ ...prev, folderId: '' }));
      }
      return;
    }
    const selectedIsValid = areaFolders.some((folder) => folder.id === lessonDraft.folderId);
    if (!selectedIsValid) {
      setLessonDraft((prev) => ({ ...prev, folderId: areaFolders[0].id }));
    }
  }, [editingLessonId, folders, lessonDraft.area, lessonDraft.folderId]);

  async function fetchFolders() {
    try {
      const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
      const { db } = await import('../../../lib/firebaseConfig');
      const q = query(collection(db, 'lessonFolders'), orderBy('sortOrder', 'asc'));
      const snap = await getDocs(q);
      const out: Folder[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setFolders(out);
      if (!lessonFolderId && out.length) setLessonFolderId(out[0].id);
    } catch (err) {
      console.error('fetchFolders failed', err);
      toast({ title: 'Error', description: 'Failed to load folders', variant: 'destructive' });
    }
  }

  async function fetchLessons() {
    try {
      const { collection, doc, getDocs, query, orderBy, setDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../../../lib/firebaseConfig');
      const q = query(collection(db, 'lessons'), orderBy('sortOrder', 'asc'));
      const snap = await getDocs(q);
      const out: Lesson[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          ...data,
          tags: normalizeTags(data?.tags),
        };
      });
      setLessons(out);

      const catalogSnap = await getDocs(collection(db, 'lessonCatalog'));
      const catalogIds = new Set(catalogSnap.docs.map((d) => d.id));
      const missingCatalogLessons = out.filter((lesson) => !catalogIds.has(lesson.id));

      if (missingCatalogLessons.length > 0) {
        await Promise.all(
          missingCatalogLessons.map((lesson) =>
            setDoc(doc(db, 'lessonCatalog', lesson.id), {
              ...toLessonCatalogPayload({
                area: lesson.area,
                folderId: lesson.folderId,
                title: lesson.title,
                tags: lesson.tags || [],
                sortOrder: lesson.sortOrder || 0,
                active: lesson.active !== false,
              }),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            })
          )
        );
      }
    } catch (err) {
      console.error('fetchLessons failed', err);
      toast({ title: 'Error', description: 'Failed to load lessons', variant: 'destructive' });
    }
  }

  async function fetchAuditTables() {
    setAuditLoading(true);
    try {
      const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
      const { db } = await import('../../../lib/firebaseConfig');
      const lessonDailyQuery = query(collection(db, 'lessonDailyAudit'), orderBy('lastOpenedAt', 'desc'));
      const teacherDailyQuery = query(collection(db, 'teacherDailyAccess'), orderBy('lastAccessedAt', 'desc'));

      const [lessonDailySnap, teacherDailySnap] = await Promise.all([
        getDocs(lessonDailyQuery),
        getDocs(teacherDailyQuery),
      ]);

      const lessonDailyRows: LessonDailyAuditRow[] = lessonDailySnap.docs.map((docSnap) => {
        const data = docSnap.data() as any;
        return {
          id: docSnap.id,
          teacherUid: String(data.teacherUid || ''),
          teacherName: String(data.teacherName || 'Teacher'),
          lessonId: String(data.lessonId || ''),
          lessonTitle: String(data.lessonTitle || 'Lesson'),
          dateKey: String(data.dateKey || ''),
          openCount: Number(data.openCount || 0),
          firstOpenedAt: data.firstOpenedAt,
          lastOpenedAt: data.lastOpenedAt,
        };
      });

      const teacherDailyRows: TeacherDailyAccessRow[] = teacherDailySnap.docs.map((docSnap) => {
        const data = docSnap.data() as any;
        return {
          id: docSnap.id,
          teacherUid: String(data.teacherUid || ''),
          teacherName: String(data.teacherName || 'Teacher'),
          dateKey: String(data.dateKey || ''),
          totalLessonOpens: Number(data.totalLessonOpens || 0),
          distinctLessonCount: Number(data.distinctLessonCount || 0),
          lastAccessedAt: data.lastAccessedAt,
        };
      });

      setLessonDailyAudit(lessonDailyRows);
      setTeacherDailyAccess(teacherDailyRows);
    } catch (err) {
      console.error('[lesson-audit] fetch failed', err);
      toast({
        title: 'Audit unavailable',
        description: 'Could not load lesson usage audit tables.',
        variant: 'destructive',
      });
    } finally {
      setAuditLoading(false);
    }
  }

  async function handleCreateFolder(e?: React.FormEvent) {
    e?.preventDefault?.();
    if (!folderTitle.trim()) return toast({ title: 'Validation', description: 'Folder title required', variant: 'destructive' });
    setLoading(true);
    try {
      const payload = {
        area,
        title: folderTitle.trim(),
        sortOrder: Number(folderSort || 0),
        active: !!folderActive,
      };
      if (import.meta.env.DEV) console.debug('[lessonFolders] create', payload);
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../../../lib/firebaseConfig');
      await addDoc(collection(db, 'lessonFolders'), {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Folder created', description: folderTitle });
      setFolderTitle('');
      setFolderSort(0);
      setFolderActive(true);
      await fetchFolders();
    } catch (err) {
      console.error('[lessonFolders] create failed', err);
      toast({ title: 'Error', description: 'Failed to create folder', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateLesson(e?: React.FormEvent) {
    e?.preventDefault?.();
    if (!lessonTitle.trim()) return toast({ title: 'Validation', description: 'Lesson title required', variant: 'destructive' });
    if (!lessonFolderId) return toast({ title: 'Validation', description: 'Select a folder', variant: 'destructive' });
    if (!isValidHttpsCanvaUrl(canvaViewUrl)) {
      return toast({ title: 'Validation', description: 'Enter a valid Canva view URL (https).', variant: 'destructive' });
    }
    const finalEmbedUrl = deriveEmbedUrl(canvaViewUrl, canvaEmbedUrl);
    if (!isValidHttpsCanvaUrl(finalEmbedUrl)) {
      return toast({ title: 'Validation', description: 'Enter a valid Canva embed URL (https).', variant: 'destructive' });
    }
    setLoading(true);
    try {
      const tags = parseTagsInput(lessonTagsInput);
      const payload = {
        area: lessonArea,
        folderId: lessonFolderId,
        title: lessonTitle.trim(),
        canvaViewUrl: canvaViewUrl.trim(),
        canvaEmbedUrl: finalEmbedUrl,
        tags,
        sortOrder: Number(lessonSort || 0),
        active: !!lessonActive,
        rolesAllowed: ['teacher', 'admin'],
      };
      if (import.meta.env.DEV) console.debug('[lessons] create', payload);
      const { collection, doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const { db, auth } = await import('../../../lib/firebaseConfig');
      const user = auth?.currentUser;
      const lessonRef = doc(collection(db, 'lessons'));

      await Promise.all([
        setDoc(lessonRef, {
          ...payload,
          createdBy: user?.uid || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
        setDoc(doc(db, 'lessonCatalog', lessonRef.id), {
          ...toLessonCatalogPayload(payload),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      ]);
      toast({ title: 'Lesson created', description: lessonTitle });
      setLessonTitle('');
      setCanvaViewUrl('');
      setCanvaEmbedUrl('');
      setLessonTagsInput('');
      setLessonSort(0);
      setLessonActive(true);
      await fetchLessons();
    } catch (err) {
      console.error('[lessons] create failed', err);
      toast({ title: 'Error', description: 'Failed to create lesson', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  function startFolderEdit(folder: Folder) {
    setEditingFolderId(folder.id);
    setFolderDraft({
      area: folder.area,
      title: folder.title,
      sortOrder: Number(folder.sortOrder || 0),
      active: folder.active !== false,
    });
  }

  function cancelFolderEdit() {
    setEditingFolderId(null);
    setFolderDraft({
      area: 'phonics',
      title: '',
      sortOrder: 0,
      active: true,
    });
  }

  async function saveFolderEdit() {
    if (!editingFolderId) return;
    if (!folderDraft.title.trim()) {
      return toast({ title: 'Validation', description: 'Folder title required', variant: 'destructive' });
    }

    setLoading(true);
    try {
      const { doc, updateDoc, writeBatch, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../../../lib/firebaseConfig');
      const existingFolder = folders.find((folder) => folder.id === editingFolderId);
      await updateDoc(doc(db, 'lessonFolders', editingFolderId), {
        area: folderDraft.area,
        title: folderDraft.title.trim(),
        sortOrder: Number(folderDraft.sortOrder || 0),
        active: !!folderDraft.active,
        updatedAt: serverTimestamp(),
      });

      if (existingFolder && existingFolder.area !== folderDraft.area) {
        const linkedLessons = lessons.filter((lesson) => lesson.folderId === editingFolderId);
        if (linkedLessons.length > 0) {
          const batch = writeBatch(db);
          linkedLessons.forEach((lesson) => {
            batch.update(doc(db, 'lessons', lesson.id), {
              area: folderDraft.area,
              updatedAt: serverTimestamp(),
            });
            batch.set(
              doc(db, 'lessonCatalog', lesson.id),
              {
                area: folderDraft.area,
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
          });
          await batch.commit();
        }
      }

      toast({ title: 'Folder updated', description: folderDraft.title.trim() });
      cancelFolderEdit();
      await fetchFolders();
      await fetchLessons();
    } catch (err) {
      console.error('[lessonFolders] update failed', err);
      toast({ title: 'Error', description: 'Failed to update folder', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function deleteFolder(folder: Folder) {
    const linkedLessons = lessons.filter((lesson) => lesson.folderId === folder.id);
    const warning =
      linkedLessons.length > 0
        ? `Delete folder "${folder.title}" and ${linkedLessons.length} linked lesson(s)? This cannot be undone.`
        : `Delete folder "${folder.title}"? This cannot be undone.`;
    const confirmed = window.confirm(warning);
    if (!confirmed) return;

    setLoading(true);
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      const { db } = await import('../../../lib/firebaseConfig');

      if (linkedLessons.length > 0) {
        await Promise.all(
          linkedLessons.flatMap((lesson) => [
            deleteDoc(doc(db, 'lessons', lesson.id)),
            deleteDoc(doc(db, 'lessonCatalog', lesson.id)),
          ])
        );
      }
      await deleteDoc(doc(db, 'lessonFolders', folder.id));

      toast({ title: 'Folder deleted', description: folder.title });
      if (editingFolderId === folder.id) {
        cancelFolderEdit();
      }
      await fetchFolders();
      await fetchLessons();
    } catch (err) {
      console.error('[lessonFolders] delete failed', err);
      toast({ title: 'Error', description: 'Failed to delete folder', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  function startLessonEdit(lesson: Lesson) {
    setEditingLessonId(lesson.id);
    setLessonDraft({
      area: lesson.area,
      folderId: lesson.folderId,
      title: lesson.title,
      canvaViewUrl: (lesson.canvaViewUrl || '').trim(),
      canvaEmbedUrl: (lesson.canvaEmbedUrl || '').trim(),
      tagsInput: (lesson.tags || []).join(', '),
      sortOrder: Number(lesson.sortOrder || 0),
      active: lesson.active !== false,
    });
  }

  function cancelLessonEdit() {
    setEditingLessonId(null);
    setLessonDraft({
      area: 'phonics',
      folderId: '',
      title: '',
      canvaViewUrl: '',
      canvaEmbedUrl: '',
      tagsInput: '',
      sortOrder: 0,
      active: true,
    });
  }

  async function saveLessonEdit() {
    if (!editingLessonId) return;
    if (!lessonDraft.title.trim()) {
      return toast({ title: 'Validation', description: 'Lesson title required', variant: 'destructive' });
    }
    if (!lessonDraft.folderId) {
      return toast({ title: 'Validation', description: 'Select a folder', variant: 'destructive' });
    }
    if (!isValidHttpsCanvaUrl(lessonDraft.canvaViewUrl)) {
      return toast({ title: 'Validation', description: 'Enter a valid Canva view URL (https).', variant: 'destructive' });
    }
    const finalEmbedUrl = deriveEmbedUrl(lessonDraft.canvaViewUrl, lessonDraft.canvaEmbedUrl);
    if (!isValidHttpsCanvaUrl(finalEmbedUrl)) {
      return toast({ title: 'Validation', description: 'Enter a valid Canva embed URL (https).', variant: 'destructive' });
    }

    setLoading(true);
    try {
      const { doc, updateDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../../../lib/firebaseConfig');
      const updatedLessonPayload = {
        area: lessonDraft.area,
        folderId: lessonDraft.folderId,
        title: lessonDraft.title.trim(),
        canvaViewUrl: lessonDraft.canvaViewUrl.trim(),
        canvaEmbedUrl: finalEmbedUrl,
        tags: parseTagsInput(lessonDraft.tagsInput),
        sortOrder: Number(lessonDraft.sortOrder || 0),
        active: !!lessonDraft.active,
      };
      await Promise.all([
        updateDoc(doc(db, 'lessons', editingLessonId), {
          ...updatedLessonPayload,
          updatedAt: serverTimestamp(),
        }),
        setDoc(
          doc(db, 'lessonCatalog', editingLessonId),
          {
            ...toLessonCatalogPayload(updatedLessonPayload),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ),
      ]);
      toast({ title: 'Lesson updated', description: lessonDraft.title.trim() });
      cancelLessonEdit();
      await fetchLessons();
      await fetchFolders();
    } catch (err) {
      console.error('[lessons] update failed', err);
      toast({ title: 'Error', description: 'Failed to update lesson', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function deleteLesson(lesson: Lesson) {
    const confirmed = window.confirm(`Delete lesson "${lesson.title}"? This cannot be undone.`);
    if (!confirmed) return;

    setLoading(true);
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      const { db } = await import('../../../lib/firebaseConfig');
      await Promise.all([
        deleteDoc(doc(db, 'lessons', lesson.id)),
        deleteDoc(doc(db, 'lessonCatalog', lesson.id)),
      ]);
      toast({ title: 'Lesson deleted', description: lesson.title });
      if (editingLessonId === lesson.id) {
        cancelLessonEdit();
      }
      await fetchLessons();
    } catch (err) {
      console.error('[lessons] delete failed', err);
      toast({ title: 'Error', description: 'Failed to delete lesson', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  const foldersForArea = folders.filter((f) => f.area === lessonArea);
  // UI-only state for searching
  const [folderQuery, setFolderQuery] = useState('');
  const [lessonQuery, setLessonQuery] = useState('');

  const filteredFolders = folders.filter((f) => f.title.toLowerCase().includes(folderQuery.toLowerCase()));
  const filteredLessons = lessons.filter((lesson) => {
    const queryText = lessonQuery.toLowerCase();
    const folderTitle = folders.find((folder) => folder.id === lesson.folderId)?.title || '';
    const tagsText = (lesson.tags || []).join(' ').toLowerCase();
    return (
      lesson.title.toLowerCase().includes(queryText) ||
      lesson.area.toLowerCase().includes(queryText) ||
      folderTitle.toLowerCase().includes(queryText) ||
      tagsText.includes(queryText)
    );
  });

  const filteredLessonDailyAudit = useMemo(() => {
    const queryText = auditLessonQuery.trim().toLowerCase();
    if (!queryText) return lessonDailyAudit;
    return lessonDailyAudit.filter((row) => {
      return (
        row.teacherName.toLowerCase().includes(queryText) ||
        row.lessonTitle.toLowerCase().includes(queryText) ||
        row.dateKey.toLowerCase().includes(queryText)
      );
    });
  }, [auditLessonQuery, lessonDailyAudit]);

  const filteredTeacherDailyAccess = useMemo(() => {
    const queryText = auditTeacherQuery.trim().toLowerCase();
    if (!queryText) return teacherDailyAccess;
    return teacherDailyAccess.filter((row) => {
      return (
        row.teacherName.toLowerCase().includes(queryText) ||
        row.dateKey.toLowerCase().includes(queryText) ||
        row.teacherUid.toLowerCase().includes(queryText)
      );
    });
  }, [auditTeacherQuery, teacherDailyAccess]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Lesson Library Admin</h1>
        <p className="text-sm text-gray-600">
          Store Canva view/embed links for secure teacher playback. Links are shown only to logged-in teachers/admins.
        </p>
      </header>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 mb-6">
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Create Folder</h3>
          <form onSubmit={handleCreateFolder} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-sm mb-1">Area</div>
              <select value={area} onChange={(e) => setArea(e.target.value)} className="w-full border rounded px-2 py-1">
                {AREA_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="text-sm mb-1">Sort</div>
              <Input type="number" value={folderSort} onChange={(e) => setFolderSort(Number(e.target.value || 0))} />
            </div>

            <div className="md:col-span-2">
              <div className="text-sm mb-1">Folder Title</div>
              <Input value={folderTitle} onChange={(e) => setFolderTitle(e.target.value)} />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={folderActive}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFolderActive(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Active</span>
            </div>

            <div className="md:col-span-2 flex justify-end">
              <Button type="button" onClick={handleCreateFolder} disabled={loading} className="px-4">
                Create Folder
              </Button>
            </div>
          </form>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-3">Create Lesson</h3>
          <form onSubmit={handleCreateLesson} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-sm mb-1">Area</div>
              <select value={lessonArea} onChange={(e) => setLessonArea(e.target.value)} className="w-full border rounded px-2 py-1">
                {AREA_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="text-sm mb-1">Folder</div>
              <select value={lessonFolderId} onChange={(e) => setLessonFolderId(e.target.value)} className="w-full border rounded px-2 py-1">
                <option value="">Select folder</option>
                {foldersForArea.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <div className="text-sm mb-1">Lesson Title</div>
              <Input value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} />
            </div>

            <div className="md:col-span-2">
              <div className="text-sm mb-1">Canva View URL</div>
              <Input value={canvaViewUrl} onChange={(e) => setCanvaViewUrl(e.target.value)} />
            </div>

            <div className="md:col-span-2">
              <div className="text-sm mb-1">Canva Embed URL (optional)</div>
              <Input value={canvaEmbedUrl} onChange={(e) => setCanvaEmbedUrl(e.target.value)} />
            </div>

            <div className="md:col-span-2">
              <div className="text-sm mb-1">Tags (comma separated)</div>
              <Input
                value={lessonTagsInput}
                onChange={(e) => setLessonTagsInput(e.target.value)}
                placeholder="Example: short vowels, reading fluency, worksheet"
              />
            </div>

            <div>
              <div className="text-sm mb-1">Sort</div>
              <Input type="number" value={lessonSort} onChange={(e) => setLessonSort(Number(e.target.value || 0))} />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={lessonActive}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLessonActive(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Active</span>
            </div>

            <div className="md:col-span-2 flex justify-end">
              <Button type="button" onClick={handleCreateLesson} disabled={loading} className="px-4">
                Create Lesson
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Existing Folders</h3>
            <Input placeholder="Search folders..." value={folderQuery} onChange={(e) => setFolderQuery(e.target.value)} className="w-48" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto border-collapse">
              <thead>
                <tr className="text-left">
                  <th className="pb-2">Area</th>
                  <th className="pb-2">Title</th>
                  <th className="pb-2">Sort</th>
                  <th className="pb-2">Active</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFolders.map((folder) => (
                  <tr key={folder.id} className="border-t hover:bg-gray-50">
                    {editingFolderId === folder.id ? (
                      <>
                        <td className="py-2 align-top pr-2">
                          <select
                            value={folderDraft.area}
                            onChange={(e) => setFolderDraft((prev) => ({ ...prev, area: e.target.value }))}
                            className="w-full border rounded px-2 py-1"
                          >
                            {AREA_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 align-top pr-2">
                          <Input
                            value={folderDraft.title}
                            onChange={(e) => setFolderDraft((prev) => ({ ...prev, title: e.target.value }))}
                          />
                        </td>
                        <td className="py-2 align-top pr-2">
                          <Input
                            type="number"
                            value={folderDraft.sortOrder}
                            onChange={(e) =>
                              setFolderDraft((prev) => ({ ...prev, sortOrder: Number(e.target.value || 0) }))
                            }
                          />
                        </td>
                        <td className="py-2 align-top pr-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={folderDraft.active}
                              onChange={(e) => setFolderDraft((prev) => ({ ...prev, active: e.target.checked }))}
                            />
                            <span>{folderDraft.active ? 'Active' : 'Inactive'}</span>
                          </label>
                        </td>
                        <td className="py-2 align-top">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" onClick={saveFolderEdit} disabled={loading}>
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelFolderEdit} disabled={loading}>
                              Cancel
                            </Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 align-top">{folder.area}</td>
                        <td className="py-2 align-top">{folder.title}</td>
                        <td className="py-2 align-top">{folder.sortOrder}</td>
                        <td className="py-2 align-top">
                          {folder.active ? (
                            <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">Active</span>
                          ) : (
                            <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">Inactive</span>
                          )}
                        </td>
                        <td className="py-2 align-top">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => startFolderEdit(folder)} disabled={loading}>
                              Edit
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteFolder(folder)} disabled={loading}>
                              Delete
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {filteredFolders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-500">
                      No folders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Existing Lessons</h3>
            <Input placeholder="Search lessons..." value={lessonQuery} onChange={(e) => setLessonQuery(e.target.value)} className="w-48" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto border-collapse">
              <thead>
                <tr className="text-left">
                  <th className="pb-2">Area</th>
                  <th className="pb-2">Folder</th>
                  <th className="pb-2">Title</th>
                  <th className="pb-2">Sort</th>
                  <th className="pb-2">Active</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLessons.map((lesson) => (
                  <tr key={lesson.id} className="border-t hover:bg-gray-50">
                    {editingLessonId === lesson.id ? (
                      <>
                        <td className="py-2 align-top pr-2">
                          <select
                            value={lessonDraft.area}
                            onChange={(e) => setLessonDraft((prev) => ({ ...prev, area: e.target.value }))}
                            className="w-full border rounded px-2 py-1"
                          >
                            {AREA_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 align-top pr-2">
                          <select
                            value={lessonDraft.folderId}
                            onChange={(e) => setLessonDraft((prev) => ({ ...prev, folderId: e.target.value }))}
                            className="w-full border rounded px-2 py-1"
                          >
                            <option value="">Select folder</option>
                            {folders
                              .filter((folder) => folder.area === lessonDraft.area)
                              .map((folder) => (
                                <option key={folder.id} value={folder.id}>
                                  {folder.title}
                                </option>
                              ))}
                          </select>
                        </td>
                        <td className="py-2 align-top pr-2">
                          <div className="space-y-2 min-w-[260px]">
                            <Input
                              value={lessonDraft.title}
                              onChange={(e) => setLessonDraft((prev) => ({ ...prev, title: e.target.value }))}
                              placeholder="Lesson title"
                            />
                            <Input
                              value={lessonDraft.canvaViewUrl}
                              onChange={(e) => setLessonDraft((prev) => ({ ...prev, canvaViewUrl: e.target.value }))}
                              placeholder="Canva view URL"
                            />
                            <Input
                              value={lessonDraft.canvaEmbedUrl}
                              onChange={(e) => setLessonDraft((prev) => ({ ...prev, canvaEmbedUrl: e.target.value }))}
                              placeholder="Canva embed URL"
                            />
                            <Input
                              value={lessonDraft.tagsInput}
                              onChange={(e) => setLessonDraft((prev) => ({ ...prev, tagsInput: e.target.value }))}
                              placeholder="Tags: short vowels, blends"
                            />
                          </div>
                        </td>
                        <td className="py-2 align-top pr-2">
                          <Input
                            type="number"
                            value={lessonDraft.sortOrder}
                            onChange={(e) =>
                              setLessonDraft((prev) => ({ ...prev, sortOrder: Number(e.target.value || 0) }))
                            }
                          />
                        </td>
                        <td className="py-2 align-top pr-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={lessonDraft.active}
                              onChange={(e) => setLessonDraft((prev) => ({ ...prev, active: e.target.checked }))}
                            />
                            <span>{lessonDraft.active ? 'Active' : 'Inactive'}</span>
                          </label>
                        </td>
                        <td className="py-2 align-top">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" onClick={saveLessonEdit} disabled={loading}>
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelLessonEdit} disabled={loading}>
                              Cancel
                            </Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 align-top">{lesson.area}</td>
                        <td className="py-2 align-top">{folders.find((folder) => folder.id === lesson.folderId)?.title || '-'}</td>
                        <td className="py-2 align-top">
                          <div className="min-w-[220px]">
                            <p>{lesson.title}</p>
                            {lesson.tags && lesson.tags.length > 0 ? (
                              <p className="mt-0.5 text-xs text-gray-500">Tags: {lesson.tags.join(', ')}</p>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-2 align-top">{lesson.sortOrder}</td>
                        <td className="py-2 align-top">
                          {lesson.active ? (
                            <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">Active</span>
                          ) : (
                            <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">Inactive</span>
                          )}
                        </td>
                        <td className="py-2 align-top">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => startLessonEdit(lesson)} disabled={loading}>
                              Edit
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteLesson(lesson)} disabled={loading}>
                              Delete
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {filteredLessons.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-500">
                      No lessons found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 mt-6">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3 gap-3">
            <h3 className="font-semibold">Lesson Daily Audit</h3>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search teacher/lesson/date..."
                value={auditLessonQuery}
                onChange={(e) => setAuditLessonQuery(e.target.value)}
                className="w-56"
              />
              <Button type="button" size="sm" variant="outline" onClick={fetchAuditTables} disabled={auditLoading}>
                {auditLoading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto border-collapse">
              <thead>
                <tr className="text-left">
                  <th className="pb-2">Teacher</th>
                  <th className="pb-2">Lesson</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Opens</th>
                  <th className="pb-2">First Open</th>
                  <th className="pb-2">Last Open</th>
                </tr>
              </thead>
              <tbody>
                {filteredLessonDailyAudit.map((row) => (
                  <tr key={row.id} className="border-t hover:bg-gray-50">
                    <td className="py-2 align-top">{row.teacherName}</td>
                    <td className="py-2 align-top">{row.lessonTitle}</td>
                    <td className="py-2 align-top">{row.dateKey || '-'}</td>
                    <td className="py-2 align-top">{row.openCount}</td>
                    <td className="py-2 align-top">{formatDateTime(row.firstOpenedAt)}</td>
                    <td className="py-2 align-top">{formatDateTime(row.lastOpenedAt)}</td>
                  </tr>
                ))}
                {!auditLoading && filteredLessonDailyAudit.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-500">
                      No audit rows found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3 gap-3">
            <h3 className="font-semibold">Teacher Daily Access</h3>
            <Input
              placeholder="Search teacher/date/uid..."
              value={auditTeacherQuery}
              onChange={(e) => setAuditTeacherQuery(e.target.value)}
              className="w-56"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto border-collapse">
              <thead>
                <tr className="text-left">
                  <th className="pb-2">Teacher</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Total Opens</th>
                  <th className="pb-2">Distinct Lessons</th>
                  <th className="pb-2">Last Access</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeacherDailyAccess.map((row) => (
                  <tr key={row.id} className="border-t hover:bg-gray-50">
                    <td className="py-2 align-top">{row.teacherName}</td>
                    <td className="py-2 align-top">{row.dateKey || '-'}</td>
                    <td className="py-2 align-top">{row.totalLessonOpens}</td>
                    <td className="py-2 align-top">{row.distinctLessonCount}</td>
                    <td className="py-2 align-top">{formatDateTime(row.lastAccessedAt)}</td>
                  </tr>
                ))}
                {!auditLoading && filteredTeacherDailyAccess.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-500">
                      No teacher daily rows found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
