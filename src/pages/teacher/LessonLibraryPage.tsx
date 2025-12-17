import React, { useEffect, useState } from 'react';
import { cn } from '@components/lib/utils';
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
};

type Lesson = {
  id: string;
  area: string;
  folderId: string;
  title: string;
  sortOrder?: number;
  active?: boolean;
  canvaEmbedUrl?: string | null;
};

const CATEGORIES = [
  { key: 'phonics', label: 'Phonics' },
  { key: 'grammar', label: 'Grammar' },
  { key: 'public_speaking', label: 'Public Speaking' },
];

export default function LessonLibraryPage(): JSX.Element {
  const [activeArea, setActiveArea] = useState<string>('phonics');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [lessonQuery, setLessonQuery] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    console.log('[LessonLibraryPage] Component mounted - useEffect triggered');
    let mounted = true;
    setLoading(true);

    async function load() {
      console.log('[LessonLibraryPage] load() called - fetching Firestore data...');
      setFetchError(null);
      try {
        const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
        const { db } = await import('../../lib/firebaseConfig');
        console.log('[LessonLibraryPage] Firestore db loaded:', db.app.options.projectId);

        const fQ = query(collection(db, 'lessonFolders'), orderBy('sortOrder', 'asc'));
        const fSnap = await getDocs(fQ);
        console.log('[LessonLibraryPage] lessonFolders query returned:', fSnap.size, 'docs');
        const fOut: Folder[] = fSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })).filter((f) => f.active !== false);
        console.log('[LessonLibraryPage] After active filter:', fOut.length, 'folders');
        if (fOut.length > 0) console.log('[LessonLibraryPage] Sample folder:', fOut[0]);

        const lQ = query(collection(db, 'lessons'), orderBy('sortOrder', 'asc'));
        const lSnap = await getDocs(lQ);
        console.log('[LessonLibraryPage] lessons query returned:', lSnap.size, 'docs');
        const lOut: Lesson[] = lSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })).filter((l) => l.active !== false);
        console.log('[LessonLibraryPage] After active filter:', lOut.length, 'lessons');
        if (lOut.length > 0) console.log('[LessonLibraryPage] Sample lesson:', lOut[0]);

        if (!mounted) return;
        setFolders(fOut);
        setLessons(lOut);
        // choose first folder in area if none selected
        const first = fOut.find((ff) => ff.area === activeArea);
        setSelectedFolderId((prev) => prev ?? first?.id ?? null);
      } catch (err: any) {
        const msg = err?.message || String(err);
        console.error('[LessonLibraryPage] LOAD FAILED:', err);
        console.error('[LessonLibraryPage] Error code:', err?.code, 'Error details:', err);
        setFetchError(msg);
        toast({ title: 'Error', description: 'Failed to load lesson library', variant: 'destructive' });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [activeArea]);

  const foldersForArea = folders.filter((f) => f.area === activeArea);
  const lessonsForFolder = lessons
    .filter((l) => l.folderId === selectedFolderId)
    .filter((l) => l.title.toLowerCase().includes(lessonQuery.toLowerCase()));

  // DEV-only status bar values
  const totalFolders = folders.length;
  const activeFolders = folders.filter((f) => f.active).length;
  const totalLessons = lessons.length;
  const activeLessons = lessons.filter((l) => l.active !== false).length;

  function openLesson(lesson: Lesson) {
    if (!lesson.canvaEmbedUrl) {
      toast({ title: 'No Canva link', description: 'No Canva link added yet for this lesson.', variant: 'destructive' });
      return;
    }
    setSelectedLesson(lesson);
  }

  return (
    <div data-testid="lesson-library" className="min-h-screen py-6">
      <div className="max-w-6xl mx-auto px-4">
        {/* Lesson library debug UI removed for production */}
            <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-indigo-600 font-semibold">Teacher Portal</p>
            <h1 data-testid="lesson-library-title" className="text-3xl font-bold">Lesson Library</h1>
            <p className="text-sm text-gray-600 mt-1">Browse lessons and open Canva embeds.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <div className="flex gap-2 mb-4">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => {
                    setActiveArea(cat.key);
                    // reset selected folder when area changes
                    setSelectedFolderId(null);
                  }}
                  className={cn(
                    'px-3 py-1 rounded-full text-sm font-medium transition',
                    activeArea === cat.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-100 text-gray-700'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <Card data-testid="lesson-folders-card" className="p-3">
              <h3 className="font-semibold mb-3">Folders</h3>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-8 bg-gray-100 animate-pulse rounded" />
                  ))}
                </div>
              ) : foldersForArea.length === 0 ? (
                <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded">
                  No folders found for {activeArea}. Contact admin to add folders.
                </div>
              ) : (
                <ul data-testid="lesson-folders-list" className="space-y-2">
                  {foldersForArea.map((f) => (
                    <li key={f.id}>
                      <button
                        onClick={() => setSelectedFolderId(f.id)}
                        data-testid={`lesson-folder-${f.id}`}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded hover:bg-gray-50',
                          selectedFolderId === f.id ? 'bg-blue-50 border border-blue-100' : 'bg-white'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">{f.title}</div>
                          <div className="text-xs text-gray-500">{f.sortOrder}</div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <Input data-testid="lesson-search" placeholder="Search lessons..." value={lessonQuery} onChange={(e) => setLessonQuery(e.target.value)} className="w-64" />
              <div className="text-sm text-gray-500">{lessonsForFolder.length} lessons</div>
            </div>

            <Card data-testid="lesson-lessons-card" className="p-3">
              <h3 className="font-semibold mb-3">Lessons</h3>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />
                  ))}
                </div>
              ) : !selectedFolderId ? (
                <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded">
                  ← Select a folder from the left to view lessons
                </div>
              ) : lessonsForFolder.length === 0 ? (
                <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded">
                  No lessons in this folder yet. Contact admin to add lessons.
                </div>
              ) : (
                <div data-testid="lesson-list" className="space-y-2">
                  {lessonsForFolder.map((l) => (
                    <div key={l.id} data-testid={`lesson-row-${l.id}`} className="flex items-center justify-between px-3 py-2 border rounded">
                      <div className="text-sm">{l.title}</div>
                      <div className="flex items-center gap-2">
                        <Button data-testid={`lesson-open-${l.id}`} size="sm" onClick={() => openLesson(l)} className="px-3">Open</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedLesson && (
        <div data-testid="lesson-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-4 overflow-hidden">
            <div className="p-4 border-b flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">{selectedLesson.title}</h2>
              </div>
              <div>
                <Button data-testid="lesson-close" variant="ghost" onClick={() => setSelectedLesson(null)}>Close</Button>
              </div>
            </div>

            <div className="p-4">
              <div className="aspect-video">
                <iframe data-testid="lesson-iframe" src={selectedLesson.canvaEmbedUrl as string} title={selectedLesson.title} className="w-full h-full border rounded" />
              </div>
            </div>

            <div className="p-4 border-t flex justify-end">
              <Button data-testid="lesson-close" onClick={() => setSelectedLesson(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
