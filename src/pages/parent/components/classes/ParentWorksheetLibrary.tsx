import { useMemo, useState } from 'react';
import { Download, ExternalLink, FileText, RefreshCw, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getSafeWorksheetUrl,
  getWorksheetDownloadUrl,
  groupParentWorksheets,
  type ParentWorksheetItem,
} from '../../../../lib/parentWorksheets';

type Props = {
  items: ParentWorksheetItem[];
  loading: boolean;
  refreshing?: boolean;
  onRefresh: () => void;
};

const WORKSHEET_TILE_THEMES = [
  'from-amber-50 via-orange-50 to-rose-50',
  'from-sky-50 via-indigo-50 to-violet-50',
  'from-emerald-50 via-teal-50 to-cyan-50',
  'from-fuchsia-50 via-pink-50 to-rose-50',
  'from-violet-50 via-purple-50 to-fuchsia-50',
  'from-cyan-50 via-sky-50 to-blue-50',
];

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
      className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4"
      aria-labelledby="worksheet-library-title"
      data-testid="parent-worksheet-library"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="worksheet-library-title" className="text-lg font-bold text-slate-950">Worksheet Library</h2>
            {!loading ? (
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                {items.length} resource{items.length === 1 ? '' : 's'}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Practice resources for your child, organised course-by-course and lesson-by-lesson.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={refreshing}
          className="h-8 shrink-0"
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div>
          <label htmlFor="parent-worksheet-search" className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Search library
          </label>
          <div className="relative mt-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <Input
              id="parent-worksheet-search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search lesson or worksheet…"
              className="h-9 pl-9"
            />
          </div>
        </div>
        <div className="pb-2 text-xs text-slate-500">{visibleItems.length} shown</div>
      </div>

      {loading ? (
        <div role="status" aria-label="Loading worksheets" className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-44 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : courseGroups.size === 0 ? (
        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          {needle ? 'No worksheets match your search.' : 'No worksheets have been shared for this course yet.'}
        </div>
      ) : (
        <div className="mt-4 space-y-5">
          {Array.from(courseGroups.entries()).map(([courseKey, lessons]) => (
            <section key={courseKey} aria-label={lessons[0].courseTitle}>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-slate-950">{lessons[0].courseTitle}</h3>
                  <p className="text-[11px] text-slate-500">{lessons.length} lesson{lessons.length === 1 ? '' : 's'} with practice material</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-testid="worksheet-tile-grid">
                {lessons.map((lesson, index) => (
                  <article
                    key={lesson.key}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
                    data-testid="worksheet-lesson-tile"
                  >
                    <div className={`relative h-24 overflow-hidden rounded-lg border border-white/80 bg-gradient-to-br ${WORKSHEET_TILE_THEMES[index % WORKSHEET_TILE_THEMES.length]}`}>
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.92),transparent_58%)]" />
                      <div className="absolute inset-x-2 top-2 flex items-center justify-between gap-2 text-[9px] font-semibold text-slate-600">
                        <span className="rounded-full bg-white/85 px-2 py-0.5">Practice</span>
                        <span className="max-w-[62%] truncate rounded-full bg-white/75 px-2 py-0.5">
                          {lesson.lessonFolderTitle || lesson.courseTitle}
                        </span>
                      </div>
                      <div className="absolute inset-x-2 bottom-2 rounded-md bg-white/88 px-2 py-1.5 shadow-sm backdrop-blur-[1px]">
                        <p className="truncate text-sm font-bold text-slate-900">{lesson.lessonTitle}</p>
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          {lesson.items.length} worksheet{lesson.items.length === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-1.5 space-y-1.5">
                      {lesson.items.map((item) => {
                        const openUrl = getSafeWorksheetUrl(item.url);
                        const downloadUrl = getWorksheetDownloadUrl(item.url);
                        return (
                          <div key={item.id} className="rounded-lg bg-slate-50 px-2 py-2">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="min-w-0 flex-1 truncate text-[12px] font-semibold text-slate-900">{item.title || 'Worksheet'}</p>
                                {item.resourceType ? (
                                  <span className="rounded-full bg-white px-1.5 py-0.5 text-[9px] font-medium text-slate-500">{item.resourceType}</span>
                                ) : null}
                              </div>
                              {item.description ? <p className="mt-0.5 line-clamp-1 text-[10px] text-slate-500">{item.description}</p> : null}
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1 px-1 text-[10px]"
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
                                  className="h-7 gap-1 px-1 text-[10px]"
                                  onClick={() => openSafely(downloadUrl)}
                                >
                                  Download <Download className="h-3 w-3" aria-hidden="true" />
                                </Button>
                              ) : (
                                <Button type="button" size="sm" variant="outline" className="h-7 px-1 text-[10px]" disabled>
                                  Download
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
