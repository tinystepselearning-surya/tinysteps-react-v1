import { useMemo, useState } from 'react';
import {
  Backpack,
  Blocks,
  BookOpen,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  NotebookPen,
  Pencil,
  RefreshCw,
  Search,
  SpellCheck,
  Sparkles,
  Star,
  Stars,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getSafeWorksheetUrl,
  getWorksheetDownloadUrl,
  groupParentWorksheets,
  type ParentWorksheetItem,
} from '../../../../lib/parentWorksheets';
import {
  getWorksheetDecorativeLetter,
  getWorksheetDisplayLesson,
  getWorksheetFocusLabel,
} from './worksheetPresentation';

type Props = {
  items: ParentWorksheetItem[];
  loading: boolean;
  refreshing?: boolean;
  onRefresh: () => void;
};

const WORKSHEET_TILE_THEMES = [
  {
    gradient: 'from-amber-100 via-orange-50 to-rose-100',
    border: 'border-amber-200/90',
    badge: 'bg-amber-100 text-amber-800',
    button: 'bg-amber-500 text-white hover:bg-amber-600',
    accent: 'text-amber-700/75',
    lessonText: 'text-amber-800',
    focusText: 'text-orange-700',
    glow: 'bg-amber-300/40',
  },
  {
    gradient: 'from-sky-100 via-indigo-50 to-violet-100',
    border: 'border-sky-200/90',
    badge: 'bg-sky-100 text-sky-800',
    button: 'bg-sky-500 text-white hover:bg-sky-600',
    accent: 'text-sky-700/75',
    lessonText: 'text-sky-800',
    focusText: 'text-blue-700',
    glow: 'bg-sky-300/40',
  },
  {
    gradient: 'from-emerald-100 via-teal-50 to-cyan-100',
    border: 'border-emerald-200/90',
    badge: 'bg-emerald-100 text-emerald-800',
    button: 'bg-emerald-500 text-white hover:bg-emerald-600',
    accent: 'text-emerald-700/75',
    lessonText: 'text-emerald-800',
    focusText: 'text-teal-700',
    glow: 'bg-emerald-300/40',
  },
  {
    gradient: 'from-pink-100 via-fuchsia-50 to-rose-100',
    border: 'border-pink-200/90',
    badge: 'bg-pink-100 text-pink-800',
    button: 'bg-pink-500 text-white hover:bg-pink-600',
    accent: 'text-pink-700/75',
    lessonText: 'text-pink-800',
    focusText: 'text-rose-700',
    glow: 'bg-pink-300/40',
  },
  {
    gradient: 'from-violet-100 via-purple-50 to-fuchsia-100',
    border: 'border-violet-200/90',
    badge: 'bg-violet-100 text-violet-800',
    button: 'bg-violet-500 text-white hover:bg-violet-600',
    accent: 'text-violet-700/75',
    lessonText: 'text-violet-800',
    focusText: 'text-purple-700',
    glow: 'bg-violet-300/40',
  },
  {
    gradient: 'from-cyan-100 via-sky-50 to-blue-100',
    border: 'border-cyan-200/90',
    badge: 'bg-cyan-100 text-cyan-800',
    button: 'bg-cyan-500 text-white hover:bg-cyan-600',
    accent: 'text-cyan-700/75',
    lessonText: 'text-cyan-800',
    focusText: 'text-sky-700',
    glow: 'bg-cyan-300/40',
  },
  {
    gradient: 'from-lime-100 via-emerald-50 to-teal-100',
    border: 'border-lime-200/90',
    badge: 'bg-lime-100 text-lime-800',
    button: 'bg-lime-500 text-white hover:bg-lime-600',
    accent: 'text-lime-700/75',
    lessonText: 'text-lime-800',
    focusText: 'text-emerald-700',
    glow: 'bg-lime-300/40',
  },
  {
    gradient: 'from-orange-100 via-amber-50 to-yellow-100',
    border: 'border-orange-200/90',
    badge: 'bg-orange-100 text-orange-800',
    button: 'bg-orange-500 text-white hover:bg-orange-600',
    accent: 'text-orange-700/75',
    lessonText: 'text-orange-800',
    focusText: 'text-amber-700',
    glow: 'bg-orange-300/40',
  },
];

const LEARNING_MOTIFS = [Pencil, Blocks, BookOpen, NotebookPen, Stars, Backpack, GraduationCap, SpellCheck];

const openSafely = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

export function ParentWorksheetLibrary({ items, loading, refreshing = false, onRefresh }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const needle = searchQuery.trim().toLowerCase();

  const visibleItems = useMemo(() => {
    if (!needle) return items;
    return items.filter((item) => [
      item.title,
      item.description,
      item.resourceType,
      item.lessonTitle,
      getWorksheetDisplayLesson(item.lessonTitle),
      getWorksheetFocusLabel(item.lessonTitle, item.title),
      item.lessonFolderTitle,
      item.courseTitle,
    ].join(' ').toLowerCase().includes(needle));
  }, [items, needle]);

  const groups = useMemo(() => groupParentWorksheets(visibleItems), [visibleItems]);
  const courseGroups = useMemo(() => {
    const grouped = new Map<string, typeof groups>();
    groups.forEach((group) => {
      const key = group.courseId || group.courseTitle;
      grouped.set(key, [...(grouped.get(key) || []), group]);
    });
    return grouped;
  }, [groups]);

  return (
    <section
      className="rounded-[26px] border border-violet-100 bg-gradient-to-br from-white via-violet-50/25 to-sky-50/40 p-3 shadow-sm sm:p-4"
      aria-labelledby="worksheet-library-title"
      data-testid="parent-worksheet-library"
    >
      <div className="relative overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-100 via-fuchsia-50 to-amber-50 p-4 sm:p-5">
        <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-fuchsia-300/25 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 left-1/3 h-28 w-28 rounded-full bg-amber-300/30 blur-2xl" />
        <Star className="pointer-events-none absolute right-7 top-5 h-5 w-5 rotate-12 text-amber-400/80" aria-hidden="true" />
        <Sparkles className="pointer-events-none absolute bottom-5 right-20 h-4 w-4 text-fuchsia-400/80" aria-hidden="true" />

        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-sm shadow-violet-200">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-violet-700 shadow-sm">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  Practice time
                </span>
                {!loading ? (
                  <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                    {items.length} resource{items.length === 1 ? '' : 's'}
                  </span>
                ) : null}
              </div>
              <h2 id="worksheet-library-title" className="mt-1 text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">
                Worksheet Library
              </h2>
              <p className="mt-1 max-w-2xl text-sm font-medium text-slate-600">
                Pick a lesson, open a worksheet and make practice feel easy and fun.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={refreshing}
            className="h-9 shrink-0 border-white/80 bg-white/85 font-semibold text-violet-700 shadow-sm hover:bg-white"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div>
          <label htmlFor="parent-worksheet-search" className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
            Find a worksheet
          </label>
          <div className="relative mt-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-400" aria-hidden="true" />
            <Input
              id="parent-worksheet-search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search lesson or worksheet…"
              className="h-10 rounded-xl border-violet-100 bg-white/90 pl-9 shadow-sm focus-visible:ring-violet-300"
            />
          </div>
        </div>
        <div className="pb-2 text-xs font-medium text-slate-500">{visibleItems.length} shown</div>
      </div>

      {loading ? (
        <div role="status" aria-label="Loading worksheets" className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-48 animate-pulse rounded-2xl bg-gradient-to-br from-violet-100 via-slate-50 to-sky-100" />
          ))}
        </div>
      ) : courseGroups.size === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-violet-200 bg-gradient-to-br from-violet-50 to-sky-50 px-4 py-10 text-center text-sm font-medium text-slate-500">
          {needle ? 'No worksheets match your search.' : 'No worksheets have been shared for this course yet.'}
        </div>
      ) : (
        <div className="mt-4 space-y-6">
          {Array.from(courseGroups.entries()).map(([courseKey, lessons], courseIndex) => (
            <section key={courseKey} aria-label={lessons[0].courseTitle}>
              <div className="mb-2.5 flex items-center gap-2.5 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-fuchsia-50 px-3 py-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-extrabold text-slate-950">{lessons[0].courseTitle}</h3>
                  <p className="text-[11px] font-medium text-slate-500">
                    {lessons.length} lesson{lessons.length === 1 ? '' : 's'} with practice material
                  </p>
                </div>
                <span className="hidden rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-indigo-600 shadow-sm sm:inline-flex">
                  Keep learning ✨
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-testid="worksheet-tile-grid">
                {lessons.map((lesson, index) => {
                  const theme = WORKSHEET_TILE_THEMES[(index + courseIndex) % WORKSHEET_TILE_THEMES.length];
                  const displayLesson = getWorksheetDisplayLesson(lesson.lessonTitle);
                  const focusLabel = getWorksheetFocusLabel(lesson.lessonTitle, lesson.items[0]?.title || '');
                  const decorativeLetter = getWorksheetDecorativeLetter(focusLabel);
                  const LearningMotif = LEARNING_MOTIFS[(index + courseIndex) % LEARNING_MOTIFS.length];
                  return (
                    <article
                      key={lesson.key}
                      className={`group overflow-hidden rounded-2xl border bg-white p-1.5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg motion-reduce:transform-none motion-reduce:transition-none ${theme.border}`}
                      data-testid="worksheet-lesson-tile"
                    >
                      <div className={`relative h-32 overflow-hidden rounded-[14px] bg-gradient-to-br ${theme.gradient}`}>
                        <div className={`pointer-events-none absolute -right-5 -top-5 h-20 w-20 rounded-full ${theme.glow}`} />
                        <div className="pointer-events-none absolute -bottom-8 -left-5 h-20 w-20 rounded-full bg-white/45" />

                        <div className="absolute left-2 top-2 text-[9px] font-bold text-slate-700">
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 shadow-sm">
                            <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
                            Practice
                          </span>
                        </div>

                        <div className={`pointer-events-none absolute right-3 top-2 flex h-14 w-14 items-center justify-center ${theme.accent}`} aria-hidden="true">
                          {decorativeLetter ? (
                            <span className="font-heading text-[48px] font-black leading-none opacity-70">{decorativeLetter}</span>
                          ) : (
                            <LearningMotif className="h-10 w-10 rotate-6 opacity-55" strokeWidth={1.8} />
                          )}
                        </div>

                        <div className="absolute bottom-2.5 left-2.5 right-2.5 rounded-xl border border-white/70 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-[2px]">
                          <p className={`text-lg font-extrabold leading-tight tracking-tight ${theme.lessonText}`}>{displayLesson}</p>
                          <p className={`mt-0.5 truncate text-xl font-extrabold leading-tight tracking-tight ${theme.focusText}`} title={focusLabel}>
                            {focusLabel}
                          </p>
                          <p className="mt-1 text-[10px] font-semibold text-slate-500">
                            {lesson.items.length} worksheet{lesson.items.length === 1 ? '' : 's'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-1.5 space-y-1.5">
                        {lesson.items.map((item) => {
                          const openUrl = getSafeWorksheetUrl(item.url);
                          const downloadUrl = getWorksheetDownloadUrl(item.url);
                          return (
                            <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50/80 px-2.5 py-2.5">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <p className="min-w-0 flex-1 truncate text-[12px] font-bold text-slate-900">
                                    {lesson.items.length === 1 && item.title === focusLabel ? 'Ready to practise' : item.title || 'Worksheet'}
                                  </p>
                                  {item.resourceType ? (
                                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${theme.badge}`}>
                                      {item.resourceType}
                                    </span>
                                  ) : null}
                                </div>
                                {item.description ? (
                                  <p className="mt-0.5 line-clamp-1 text-[10px] font-medium text-slate-500">{item.description}</p>
                                ) : null}
                              </div>
                              <div className="mt-2 grid grid-cols-2 gap-1.5">
                                <Button
                                  type="button"
                                  size="sm"
                                  className={`h-8 gap-1 rounded-lg px-1 text-[10px] font-bold shadow-sm ${theme.button}`}
                                  disabled={!openUrl}
                                  onClick={() => openUrl && openSafely(openUrl)}
                                >
                                  Open <ExternalLink className="h-3 w-3" aria-hidden="true" />
                                </Button>
                                {downloadUrl ? (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-8 gap-1 rounded-lg border-slate-200 bg-white px-1 text-[10px] font-bold text-slate-700 hover:bg-slate-50"
                                    onClick={() => openSafely(downloadUrl)}
                                  >
                                    Download <Download className="h-3 w-3" aria-hidden="true" />
                                  </Button>
                                ) : (
                                  <Button type="button" size="sm" variant="outline" className="h-8 rounded-lg px-1 text-[10px]" disabled>
                                    Download
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
