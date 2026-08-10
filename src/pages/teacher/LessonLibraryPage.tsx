import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  BookOpenText,
  ExternalLink,
  FileSpreadsheet,
  RefreshCw,
  Search,
} from 'lucide-react';

import { cn } from '@components/lib/utils';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { toast } from '@components/hooks/use-toast';
import callFunction from '../../lib/callFunctions';
import { getSafeWorksheetUrl } from '../../lib/parentWorksheets';
import { useAuthStore } from '../../store/useAuthStore';

type Folder = {
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

type Lesson = {
  id: string;
  area: string;
  folderId: string;
  title: string;
  tags?: string[];
  sortOrder?: number;
  active?: boolean;
  teacherScript?: string;
  worksheetResources?: LessonWorksheetResource[];
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
  { key: 'trial_classes', label: 'Trial Classes' },
];

const AREA_ALIASES: Record<string, string> = {
  speaking: 'public_speaking',
  'public speaking': 'public_speaking',
  'public-speaking': 'public_speaking',
  spokenenglish: 'trial_classes',
  'spoken-english': 'trial_classes',
  spoken_english: 'trial_classes',
  'spoken english': 'trial_classes',
  trialclasses: 'trial_classes',
  'trial classes': 'trial_classes',
  'trial-class': 'trial_classes',
};

const LESSON_TILE_THEMES = [
  'from-amber-50 via-orange-50 to-rose-50',
  'from-sky-50 via-indigo-50 to-violet-50',
  'from-emerald-50 via-teal-50 to-cyan-50',
  'from-fuchsia-50 via-pink-50 to-rose-50',
];

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
  return Array.from(new Set(rawTags.map((tag) => String(tag).trim()).filter(Boolean)));
}

function normalizeWorksheetResources(rawResources: unknown): LessonWorksheetResource[] {
  if (!Array.isArray(rawResources)) return [];
  return rawResources
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
    .filter((resource) => resource.id && resource.title && resource.url && resource.active !== false && !resource.archived)
    .sort(sortByOrderThenTitle);
}

function getIstDateKeyCompact(nowMs: number): string {
  const istMs = nowMs + IST_OFFSET_MINUTES * 60 * 1000;
  const istDate = new Date(istMs);
  const year = String(istDate.getUTCFullYear());
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export default function LessonLibraryPage(): JSX.Element {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [activeArea, setActiveArea] = useState('phonics');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [lessonQuery, setLessonQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [todayLessonOpens, setTodayLessonOpens] = useState(0);
  const [openingLessonId, setOpeningLessonId] = useState<string | null>(null);
  const [worksheetLesson, setWorksheetLesson] = useState<Lesson | null>(null);
  const [scriptLesson, setScriptLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    async function loadLibrary() {
      setFetchError(null);
      try {
        const { collection, getDocs, orderBy, query } = await import('firebase/firestore');
        const { db } = await import('../../lib/firebaseConfig');

        const [foldersSnap, lessonsSnap] = await Promise.all([
          getDocs(query(collection(db, 'lessonFolders'), orderBy('sortOrder', 'asc'))),
          getDocs(query(collection(db, 'lessonCatalog'), orderBy('sortOrder', 'asc'))),
        ]);

        const folderRows: Folder[] = foldersSnap.docs
          .map((entry) => {
            const data = entry.data() as any;
            return {
              id: entry.id,
              ...data,
              area: normalizeArea(data?.area),
            } as Folder;
          })
          .filter((folder) => folder.active !== false)
          .sort(sortByOrderThenTitle);

        const lessonRows: Lesson[] = lessonsSnap.docs
          .map((entry) => {
            const data = entry.data() as any;
            return {
              id: entry.id,
              ...data,
              area: normalizeArea(data?.area),
              tags: normalizeTags(data?.tags),
              teacherScript: String(data?.teacherScript || '').trim(),
              worksheetResources: normalizeWorksheetResources(data?.worksheetResources),
            } as Lesson;
          })
          .filter((lesson) => lesson.active !== false)
          .sort(sortByOrderThenTitle);

        if (!mounted) return;
        setFolders(folderRows);
        setLessons(lessonRows);
      } catch (error: any) {
        const message = error?.message || String(error);
        console.error('[LessonLibraryPage] Load failed:', error);
        if (mounted) setFetchError(message);
        toast({ title: 'Error', description: 'Failed to load lesson library', variant: 'destructive' });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadLibrary();
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
        const dailyRef = doc(db, 'teacherDailyAccess', `${user.uid}_${getIstDateKeyCompact(Date.now())}`);
        const dailySnap = await getDoc(dailyRef);
        const count = dailySnap.exists() ? Number(dailySnap.data()?.totalLessonOpens || 0) : 0;
        if (mounted) setTodayLessonOpens(Number.isFinite(count) ? count : 0);
      } catch (error) {
        console.error('[LessonLibraryPage] Failed to load daily opens:', error);
      }
    }
    void loadTodayOpens();
    return () => {
      mounted = false;
    };
  }, [reloadVersion, user?.uid]);

  const foldersForArea = useMemo(
    () => folders.filter((folder) => folder.area === activeArea),
    [activeArea, folders],
  );

  useEffect(() => {
    if (activeArea === 'trial_classes') {
      setSelectedFolderId(null);
      return;
    }
    setSelectedFolderId((previous) => {
      if (previous && foldersForArea.some((folder) => folder.id === previous)) return previous;
      return foldersForArea[0]?.id ?? null;
    });
  }, [activeArea, foldersForArea]);

  const areaLessonCounts = useMemo(() => {
    return lessons.reduce<Record<string, number>>((acc, lesson) => {
      acc[lesson.area] = (acc[lesson.area] ?? 0) + 1;
      return acc;
    }, {});
  }, [lessons]);

  const selectedFolderName = useMemo(() => {
    if (activeArea === 'trial_classes') return 'All Trial Classes';
    return folders.find((folder) => folder.id === selectedFolderId)?.title || '';
  }, [activeArea, folders, selectedFolderId]);

  const lessonsForFolder = useMemo(() => {
    const needle = lessonQuery.trim().toLowerCase();
    return lessons.filter((lesson) => {
      const inScope = activeArea === 'trial_classes'
        ? lesson.area === 'trial_classes'
        : lesson.area === activeArea && lesson.folderId === selectedFolderId;
      if (!inScope) return false;
      if (!needle) return true;
      const searchable = [
        lesson.title,
        ...(lesson.tags || []),
        ...(lesson.worksheetResources || []).flatMap((resource) => [resource.title, resource.resourceType || '']),
      ].join(' ').toLowerCase();
      return searchable.includes(needle);
    });
  }, [activeArea, lessonQuery, lessons, selectedFolderId]);

  const startLessonAccess = useCallback(async (lesson: Lesson): Promise<LessonAccessSessionResponse | null> => {
    setOpeningLessonId(lesson.id);
    try {
      const response = await callFunction<LessonAccessSessionResponse, { lessonId: string }>(
        'createLessonAccessSession',
        { lessonId: lesson.id },
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
  }, []);

  const openLessonInFullView = useCallback(async (lesson: Lesson) => {
    const session = await startLessonAccess(lesson);
    if (!session) return;
    const params = new URLSearchParams({
      tab: 'lessons',
      viewMode: 'full',
      accessId: session.accessId,
    });
    navigate(`/teacher?${params.toString()}`);
  }, [navigate, startLessonAccess]);

  const openWorksheet = (resource: LessonWorksheetResource) => {
    const safeUrl = getSafeWorksheetUrl(resource.url);
    if (!safeUrl) {
      toast({ title: 'Worksheet unavailable', description: 'This resource link is invalid. Please contact admin.', variant: 'destructive' });
      return;
    }
    window.open(safeUrl, '_blank', 'noopener,noreferrer');
  };

  const copyScript = async (lesson: Lesson) => {
    const script = String(lesson.teacherScript || '').trim();
    if (!script) return;
    try {
      await navigator.clipboard.writeText(script);
      toast({ title: 'Class script copied' });
    } catch {
      toast({ title: 'Copy unavailable', description: 'Select the script text and copy it manually.', variant: 'destructive' });
    }
  };

  const refreshLibrary = useCallback(() => setReloadVersion((current) => current + 1), []);
  const headerControlsHost = typeof document !== 'undefined'
    ? document.getElementById('teacher-lessons-controls-slot')
    : null;

  const headerControls = (
    <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIES.map((category) => (
          <button
            key={category.key}
            type="button"
            onClick={() => setActiveArea(category.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
              activeArea === category.key
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
            )}
          >
            {category.label}
            <span className={cn(
              'rounded-full px-1.5 py-0.5 text-[10px]',
              activeArea === category.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600',
            )}>
              {areaLessonCounts[category.key] ?? 0}
            </span>
          </button>
        ))}
        <span className="text-[11px] text-slate-500">Opens today: {todayLessonOpens}</span>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={refreshLibrary} disabled={loading} className="h-8 gap-1.5">
        <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        Refresh
      </Button>
    </div>
  );

  return (
    <div data-testid="lesson-library" className="min-h-screen py-3">
      <div className="mx-auto max-w-6xl px-3 sm:px-4">
        {headerControlsHost ? createPortal(headerControls, headerControlsHost) : (
          <Card className="mb-3 border-slate-200 p-3">{headerControls}</Card>
        )}

        {fetchError && !loading ? (
          <Card className="mb-3 border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-700">Couldn&apos;t load the lesson library.</p>
            <p className="mt-1 break-all text-xs text-red-600">{fetchError}</p>
          </Card>
        ) : null}

        <Card data-testid="lesson-lessons-card" className="p-3">
          <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-900">
            Open lesson slides only when class starts. Worksheet and class-script buttons are teacher preparation resources; lesson slide access still expires after 50 minutes.
          </div>

          <div className="mb-3 grid gap-2 lg:grid-cols-[220px_1fr_auto] lg:items-center">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Folder</label>
              {activeArea === 'trial_classes' ? (
                <div className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">All Trial Classes</div>
              ) : (
                <select
                  value={selectedFolderId || ''}
                  onChange={(event) => setSelectedFolderId(event.target.value || null)}
                  className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-800"
                >
                  {foldersForArea.length === 0 ? <option value="">No folders</option> : null}
                  {foldersForArea.map((folder) => <option key={folder.id} value={folder.id}>{folder.title}</option>)}
                </select>
              )}
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Search</label>
              <div className="relative mt-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  data-testid="lesson-search"
                  value={lessonQuery}
                  onChange={(event) => setLessonQuery(event.target.value)}
                  placeholder="Search lesson, tags, or worksheet…"
                  className="h-9 pl-9"
                />
              </div>
            </div>

            <div className="pt-4 text-xs text-slate-500 lg:pt-0">
              {lessonsForFolder.length} shown
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, index) => <div key={index} className="h-40 animate-pulse rounded-lg bg-slate-100" />)}
            </div>
          ) : activeArea !== 'trial_classes' && !selectedFolderId ? (
            <div className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-600">Select a folder to view lessons.</div>
          ) : lessonsForFolder.length === 0 ? (
            <div className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-600">No lessons match this view.</div>
          ) : (
            <div data-testid="lesson-list" className="max-h-[72vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                {lessonsForFolder.map((lesson, index) => {
                  const resources = lesson.worksheetResources || [];
                  const hasScript = !!String(lesson.teacherScript || '').trim();
                  const isOpening = openingLessonId === lesson.id;
                  return (
                    <div
                      key={lesson.id}
                      data-testid={`lesson-row-${lesson.id}`}
                      className="rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm transition hover:border-blue-200 hover:shadow"
                    >
                      <div className={cn(
                        'relative h-20 overflow-hidden rounded-md border border-white/80 bg-gradient-to-br',
                        LESSON_TILE_THEMES[index % LESSON_TILE_THEMES.length],
                      )}>
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.9),transparent_55%)]" />
                        <div className="absolute inset-x-1.5 top-1.5 flex items-center justify-between text-[9px] font-semibold text-slate-600">
                          <span className="rounded-full bg-white/80 px-1.5 py-0.5">Lesson</span>
                          <span className="max-w-[58%] truncate rounded-full bg-white/70 px-1.5 py-0.5">{selectedFolderName || 'Folder'}</span>
                        </div>
                        <div className="absolute inset-x-1.5 bottom-1.5 rounded-md bg-white/85 px-1.5 py-1 shadow-sm backdrop-blur-[1px]">
                          <p className="truncate text-[13px] font-semibold text-slate-800">{lesson.title}</p>
                        </div>
                      </div>

                      <div className="mt-1.5 min-h-[30px]">
                        {lesson.tags && lesson.tags.length > 0 ? (
                          <p className="line-clamp-1 text-[10px] text-slate-500">Hints: {lesson.tags.join(', ')}</p>
                        ) : (
                          <p className="text-[10px] text-slate-400">No hints</p>
                        )}
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          {resources.length} worksheet{resources.length === 1 ? '' : 's'} · {hasScript ? 'Script ready' : 'No script'}
                        </p>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        className="mt-1 h-7 w-full text-[11px]"
                        onClick={() => openLessonInFullView(lesson)}
                        disabled={isOpening}
                      >
                        {isOpening ? 'Opening…' : 'Open lesson'}
                      </Button>

                      <div className="mt-1 grid grid-cols-2 gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1 px-1 text-[10px]"
                          disabled={resources.length === 0}
                          onClick={() => setWorksheetLesson(lesson)}
                        >
                          <FileSpreadsheet className="h-3 w-3" />
                          Worksheet{resources.length > 1 ? `s ${resources.length}` : ''}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1 px-1 text-[10px]"
                          disabled={!hasScript}
                          onClick={() => setScriptLesson(lesson)}
                        >
                          <BookOpenText className="h-3 w-3" />
                          Class script
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      </div>

      <Dialog open={!!worksheetLesson} onOpenChange={(open) => !open && setWorksheetLesson(null)}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{worksheetLesson?.title || 'Lesson'} · Worksheets</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {(worksheetLesson?.worksheetResources || []).map((resource) => (
              <div key={resource.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{resource.title}</p>
                    {resource.resourceType ? <p className="mt-0.5 text-xs font-medium text-indigo-700">{resource.resourceType}</p> : null}
                    {resource.description ? <p className="mt-1 text-xs text-slate-600">{resource.description}</p> : null}
                  </div>
                  <Button type="button" size="sm" variant="outline" className="shrink-0" onClick={() => openWorksheet(resource)}>
                    Open <ExternalLink className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!scriptLesson} onOpenChange={(open) => !open && setScriptLesson(null)}>
        <DialogContent className="max-h-[82vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{scriptLesson?.title || 'Lesson'} · Class script</DialogTitle>
          </DialogHeader>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="whitespace-pre-wrap text-sm leading-6 text-slate-800">
              {scriptLesson?.teacherScript || 'No class script has been added yet.'}
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" disabled={!scriptLesson?.teacherScript} onClick={() => scriptLesson && copyScript(scriptLesson)}>
              Copy script
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
