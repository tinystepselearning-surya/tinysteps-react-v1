import React, { useEffect, useState } from 'react';
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

const AREA_OPTIONS = [
  { value: 'phonics', label: 'Phonics' },
  { value: 'grammar', label: 'Grammar' },
  { value: 'public_speaking', label: 'Public Speaking' },
  { value: 'spoken_english', label: 'Spoken English' },
];

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
  const [lessonSort, setLessonSort] = useState<number>(0);
  const [lessonActive, setLessonActive] = useState(true);

  const [folders, setFolders] = useState<Folder[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFolders();
    fetchLessons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
      const { db } = await import('../../../lib/firebaseConfig');
      const q = query(collection(db, 'lessons'), orderBy('sortOrder', 'asc'));
      const snap = await getDocs(q);
      const out: Lesson[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setLessons(out);
    } catch (err) {
      console.error('fetchLessons failed', err);
      toast({ title: 'Error', description: 'Failed to load lessons', variant: 'destructive' });
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
    setLoading(true);
    try {
      const payload = {
        area: lessonArea,
        folderId: lessonFolderId,
        title: lessonTitle.trim(),
        canvaViewUrl: canvaViewUrl || null,
        canvaEmbedUrl: canvaEmbedUrl || null,
        tags: [],
        sortOrder: Number(lessonSort || 0),
        active: !!lessonActive,
        rolesAllowed: ['teacher', 'admin'],
      };
      if (import.meta.env.DEV) console.debug('[lessons] create', payload);
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { db, auth } = await import('../../../lib/firebaseConfig');
      const user = auth?.currentUser;
      await addDoc(collection(db, 'lessons'), {
        ...payload,
        createdBy: user?.uid || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Lesson created', description: lessonTitle });
      setLessonTitle('');
      setCanvaViewUrl('');
      setCanvaEmbedUrl('');
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

  const foldersForArea = folders.filter((f) => f.area === lessonArea);
  // UI-only state for searching
  const [folderQuery, setFolderQuery] = useState('');
  const [lessonQuery, setLessonQuery] = useState('');

  const filteredFolders = folders.filter((f) => f.title.toLowerCase().includes(folderQuery.toLowerCase()));
  const filteredLessons = lessons.filter((l) => l.title.toLowerCase().includes(lessonQuery.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Lesson Library Admin</h1>
        <p className="text-sm text-gray-600">These links are visible only to logged-in teachers/admins.</p>
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
                </tr>
              </thead>
              <tbody>
                {filteredFolders.map((f) => (
                  <tr key={f.id} className="border-t hover:bg-gray-50">
                    <td className="py-2 align-top">{f.area}</td>
                    <td className="py-2 align-top">{f.title}</td>
                    <td className="py-2 align-top">{f.sortOrder}</td>
                    <td className="py-2 align-top">
                      {f.active ? (
                        <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">Active</span>
                      ) : (
                        <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">Inactive</span>
                      )}
                    </td>
                  </tr>
                ))}
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
                </tr>
              </thead>
              <tbody>
                {filteredLessons.map((l) => (
                  <tr key={l.id} className="border-t hover:bg-gray-50">
                    <td className="py-2 align-top">{l.area}</td>
                    <td className="py-2 align-top">{folders.find((f) => f.id === l.folderId)?.title || '-'}</td>
                    <td className="py-2 align-top">{l.title}</td>
                    <td className="py-2 align-top">{l.sortOrder}</td>
                    <td className="py-2 align-top">
                      {l.active ? (
                        <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">Active</span>
                      ) : (
                        <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">Inactive</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
