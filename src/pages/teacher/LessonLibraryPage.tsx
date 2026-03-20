import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { cn } from '@components/lib/utils';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { toast } from '@components/hooks/use-toast';
import callFunction from '../../lib/callFunctions';
import { useAuthStore } from '../../store/useAuthStore';

type Folder = {
  id: string;
  area: string;
  title: string;
  sortOrder?: number;
  active?: boolean;
};

type Lesson = {
  id: string;
  area: string;
  folderId: string;
  title: string;
  tags?: string[];
  sortOrder?: number;
  active?: boolean;
};

type LessonAccessSessionResponse = {
  accessId: string;
  expiresAtMs: number;
  lessonOpenCountToday: number;
  totalLessonOpensToday: number;
  lessonTitle: string;
};

const CATEGORIES = [
  { key: 'phonics', label: 'Phonics' },
  { key: 'grammar', label: 'Grammar' },
  { key: 'public_speaking', label: 'Public Speaking' },
  { key: 'spoken_english', label: 'Spoken English' },
];

const AREA_ALIASES: Record<string, string> = {
  speaking: 'public_speaking',
  'public speaking': 'public_speaking',
  'public-speaking': 'public_speaking',
  spokenenglish: 'spoken_english',
  'spoken-english': 'spoken_english',
};

const IST_OFFSET_MINUTES = 330;

function normalizeArea(area: unknown): string {
  const raw = String(area ?? '').trim().toLowerCase();
  return AREA_ALIASES[raw] ?? raw;
}

function normalizeSortOrder(sortOrder: unknown): number {
  const value = Number(sortOrder);
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
}

function sortByOrderThenTitle<T extends { sortOrder?: number; title: string }>(a: T, b: T): number {
  const orderDiff = normalizeSortOrder(a.sortOrder) - normalizeSortOrder(b.sortOrder);
  if (orderDiff !== 0) return orderDiff;
  return a.title.localeCompare(b.title);
}

function normalizeTags(rawTags: unknown): string[] {
  if (!Array.isArray(rawTags)) return [];
  return rawTags.map((tag) => String(tag).trim()).filter(Boolean);
}

function getIstDateKeyCompact(nowMs: number): string {
  const istMs = nowMs + IST_OFFSET_MINUTES * 60 * 1000;
  const istDate = new Date(istMs);
  const year = String(istDate.getUTCFullYear());
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

const LESSON_TILE_THEMES = [
  'from-amber-50 via-orange-50 to-rose-50',
  'from-sky-50 via-indigo-50 to-violet-50',
  'from-emerald-50 via-teal-50 to-cyan-50',
  'from-fuchsia-50 via-pink-50 to-rose-50',
];

function getLessonTileTheme(index: number): string {
  return LESSON_TILE_THEMES[index % LESSON_TILE_THEMES.length];
}

export default function LessonLibraryPage(): JSX.Element {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [activeArea, setActiveArea] = useState<string>('phonics');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [lessonQuery, setLessonQuery] = useState('');
  const [reloadVersion, setReloadVersion] = useState(0);
  const [todayLessonOpens, setTodayLessonOpens] = useState<number>(0);
  const [openingLessonId, setOpeningLessonId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    async function load() {
      setFetchError(null);
      try {
        const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
        const { db } = await import('../../lib/firebaseConfig');

        const fQ = query(collection(db, 'lessonFolders'), orderBy('sortOrder', 'asc'));
        const fSnap = await getDocs(fQ);
        const fOut: Folder[] = fSnap.docs
          .map((d) => {
            const data = d.data() as any;
            return {
              id: d.id,
              ...data,
              area: normalizeArea(data?.area),
            };
          })
          .filter((folder) => folder.active !== false)
          .sort(sortByOrderThenTitle);

        const lQ = query(collection(db, 'lessonCatalog'), orderBy('sortOrder', 'asc'));
        const lSnap = await getDocs(lQ);
        const lOut: Lesson[] = lSnap.docs
          .map((d) => {
            const data = d.data() as any;
            return {
              id: d.id,
              ...data,
              area: normalizeArea(data?.area),
              tags: normalizeTags(data?.tags),
            };
          })
          .filter((lesson) => lesson.active !== false)
          .sort(sortByOrderThenTitle);

        if (!mounted) return;
        setFolders(fOut);
        setLessons(lOut);
      } catch (err: any) {
        const msg = err?.message || String(err);
        console.error('[LessonLibraryPage] Load failed:', err);
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
  }, [reloadVersion]);

  useEffect(() => {
    let mounted = true;
    async function loadTodayOpens() {
      if (!user?.uid) {
        if (mounted) setTodayLessonOpens(0);
        return;
      }

      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../../lib/firebaseConfig');
        const dateKeyCompact = getIstDateKeyCompact(Date.now());
        const dailyRef = doc(db, 'teacherDailyAccess', `${user.uid}_${dateKeyCompact}`);
        const dailySnap = await getDoc(dailyRef);
        const count = dailySnap.exists() ? Number(dailySnap.data()?.totalLessonOpens || 0) : 0;
        if (mounted) {
          setTodayLessonOpens(Number.isFinite(count) ? count : 0);
        }
      } catch (error) {
        console.error('[LessonLibraryPage] Failed to load today opens:', error);
      }
    }

    loadTodayOpens();
    return () => {
      mounted = false;
    };
  }, [reloadVersion, user?.uid]);

  useEffect(() => {
    setSelectedFolderId((previous) => {
      const fallbackFolderId = folders.find((folder) => folder.area === activeArea)?.id ?? null;
      if (!previous) return fallbackFolderId;
      const previousStillValid = folders.some((folder) => folder.id === previous && folder.area === activeArea);
      return previousStillValid ? previous : fallbackFolderId;
    });
  }, [activeArea, folders]);

  const refreshLibrary = useCallback(() => {
    setReloadVersion((current) => current + 1);
  }, []);

  const foldersForArea = useMemo(() => {
    return folders.filter((folder) => folder.area === activeArea);
  }, [activeArea, folders]);

  const folderLessonCounts = useMemo(() => {
    return lessons.reduce<Record<string, number>>((acc, lesson) => {
      acc[lesson.folderId] = (acc[lesson.folderId] ?? 0) + 1;
      return acc;
    }, {});
  }, [lessons]);

  const areaLessonCounts = useMemo(() => {
    return lessons.reduce<Record<string, number>>((acc, lesson) => {
      acc[lesson.area] = (acc[lesson.area] ?? 0) + 1;
      return acc;
    }, {});
  }, [lessons]);

  const normalizedLessonQuery = lessonQuery.trim().toLowerCase();
  const lessonsForFolder = useMemo(() => {
    return lessons
      .filter((lesson) => lesson.folderId === selectedFolderId)
      .filter((lesson) => {
        if (!normalizedLessonQuery) return true;
        const searchableText = `${lesson.title} ${lesson.tags?.join(' ') ?? ''}`.toLowerCase();
        return searchableText.includes(normalizedLessonQuery);
      });
  }, [lessons, normalizedLessonQuery, selectedFolderId]);

  const selectedFolderName = folders.find((folder) => folder.id === selectedFolderId)?.title ?? '';

  const startLessonAccess = useCallback(
    async (lesson: Lesson): Promise<LessonAccessSessionResponse | null> => {
      setOpeningLessonId(lesson.id);
      try {
        const response = await callFunction<LessonAccessSessionResponse, { lessonId: string }>(
          'createLessonAccessSession',
          { lessonId: lesson.id }
        );
        setTodayLessonOpens(response.totalLessonOpensToday);
        return response;
      } catch (error: any) {
        const message = error?.message || 'Could not open lesson right now.';
        console.error('[LessonLibraryPage] createLessonAccessSession failed:', error);
        toast({ title: 'Unable to open lesson', description: message, variant: 'destructive' });
        return null;
      } finally {
        setOpeningLessonId(null);
      }
    },
    []
  );

  const openLessonInFullView = useCallback(
    async (lesson: Lesson) => {
      const session = await startLessonAccess(lesson);
      if (!session) return;

      const params = new URLSearchParams({
        tab: 'lessons',
        viewMode: 'full',
        accessId: session.accessId,
      });
      navigate(`/teacher?${params.toString()}`);
    },
    [navigate, startLessonAccess]
  );

  const isOpening = (lessonId: string): boolean => openingLessonId === lessonId;
  const headerControlsHost =
    typeof document !== 'undefined' ? document.getElementById('teacher-lessons-controls-slot') : null;
  const headerControls = (
    <div className="flex items-center gap-2">
      <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => {
              setActiveArea(cat.key);
              setSelectedFolderId(null);
            }}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 py-1 text-[13px] font-medium transition-colors',
              activeArea === cat.key
                ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            )}
          >
            <span>{cat.label}</span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                activeArea === cat.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              )}
            >
              {areaLessonCounts[cat.key] ?? 0}
            </span>
          </button>
        ))}

        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-7 w-20 shrink-0 rounded-md bg-slate-100 animate-pulse" />
            ))
          : foldersForArea.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolderId(folder.id)}
                data-testid={`lesson-folder-${folder.id}`}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-[13px] transition',
                  selectedFolderId === folder.id
                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                )}
              >
                <span className="font-medium">{folder.title}</span>
                <span className="text-[11px] text-slate-500">{folderLessonCounts[folder.id] ?? 0}</span>
              </button>
            ))}

        <span className="shrink-0 px-1 text-[10px] text-slate-500">Opens today: {todayLessonOpens}</span>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={refreshLibrary}
        disabled={loading}
        className="h-8 shrink-0 px-3 text-xs"
      >
        {loading ? 'Refreshing...' : 'Refresh'}
      </Button>
    </div>
  );

  return (
    <div data-testid="lesson-library" className="min-h-screen py-3">
      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        {headerControlsHost ? createPortal(headerControls, headerControlsHost) : null}
        {!headerControlsHost ? <Card className="mb-3 border-slate-200 p-3">{headerControls}</Card> : null}

        <div className="space-y-3">
          {fetchError && !loading ? (
            <Card className="border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-700">Couldn&apos;t load the lesson library.</p>
              <p className="text-xs text-red-600 mt-1 break-all">{fetchError}</p>
            </Card>
          ) : null}

          <Card data-testid="lesson-lessons-card" className="p-2.5 sm:p-3">
            <div className="mb-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-900">
              Open lessons only when class starts. Access expires in 50 minutes, and off-class opening is not allowed.
            </div>
            <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h3 className="font-semibold">Lessons</h3>
                {selectedFolderName ? (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{selectedFolderName}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2 sm:justify-end">
                <div className="relative w-full sm:w-80">
                  <Input
                    data-testid="lesson-search"
                    placeholder="Search lessons or tags..."
                    value={lessonQuery}
                    onChange={(e) => setLessonQuery(e.target.value)}
                    className="h-8 pr-14"
                  />
                  {lessonQuery ? (
                    <button
                      type="button"
                      data-testid="lesson-search-clear"
                      onClick={() => setLessonQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-600 hover:text-gray-900"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">{lessonsForFolder.length} shown</span>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />
                ))}
              </div>
            ) : !selectedFolderId ? (
              <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded">
                Select a folder to view lessons.
              </div>
            ) : lessonsForFolder.length === 0 ? (
              <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded">
                {normalizedLessonQuery
                  ? 'No lessons match your search in this folder.'
                  : 'No lessons in this folder yet. Contact admin to add lessons.'}
              </div>
            ) : (
              <div data-testid="lesson-list" className="max-h-[72vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                  {lessonsForFolder.map((lesson, index) => (
                    <button
                      type="button"
                      key={lesson.id}
                      data-testid={`lesson-row-${lesson.id}`}
                      aria-label={`Open ${lesson.title} in full view`}
                      onClick={() => openLessonInFullView(lesson)}
                      disabled={isOpening(lesson.id)}
                      className={cn(
                        'rounded-lg border border-slate-200 bg-white p-1.5 text-left shadow-sm transition hover:border-blue-200 hover:shadow',
                        isOpening(lesson.id) ? 'cursor-wait opacity-75' : 'cursor-pointer'
                      )}
                    >
                      <div
                        className={cn(
                          'relative h-20 overflow-hidden rounded-md border border-white/80 bg-gradient-to-br',
                          getLessonTileTheme(index)
                        )}
                      >
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.9),transparent_55%)]" />
                        <div className="absolute inset-x-1.5 top-1.5 flex items-center justify-between text-[9px] font-semibold text-slate-600">
                          <span className="rounded-full bg-white/80 px-1.5 py-0.5">Lesson</span>
                          <span className="max-w-[55%] truncate rounded-full bg-white/70 px-1.5 py-0.5">
                            {selectedFolderName || 'Folder'}
                          </span>
                        </div>
                        <div className="absolute inset-x-1.5 bottom-1.5 rounded-md bg-white/85 px-1.5 py-1 shadow-sm backdrop-blur-[1px]">
                          <p className="truncate text-[13px] font-semibold text-slate-800">{lesson.title}</p>
                        </div>
                      </div>

                      <div className="mt-1.5 min-h-[28px]">
                        {lesson.tags && lesson.tags.length > 0 ? (
                          <p className="line-clamp-1 text-[10px] text-slate-500">Hints: {lesson.tags.join(', ')}</p>
                        ) : (
                          <p className="text-[10px] text-slate-400">No hints</p>
                        )}
                      </div>

                      {isOpening(lesson.id) ? (
                        <div className="mt-1 text-[10px] font-medium text-blue-700">Opening lesson...</div>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
