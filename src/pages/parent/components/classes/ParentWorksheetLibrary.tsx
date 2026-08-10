import { Download, ExternalLink, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
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

const openSafely = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

export function ParentWorksheetLibrary({ items, loading, refreshing = false, onRefresh }: Props) {
  const groups = groupParentWorksheets(items);
  const courseGroups = new Map<string, typeof groups>();
  groups.forEach((group) => {
    const key = group.courseId || group.courseTitle;
    courseGroups.set(key, [...(courseGroups.get(key) || []), group]);
  });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5" aria-labelledby="worksheet-library-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 id="worksheet-library-title" className="text-base font-semibold text-slate-950">Worksheet Library</h3>
          <p className="mt-1 text-sm text-slate-600">Practice resources shared for this child’s courses.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      {loading ? (
        <div role="status" className="mt-4 rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">Loading worksheets…</div>
      ) : courseGroups.size === 0 ? (
        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-7 text-center text-sm text-slate-500">No worksheets have been shared for this course yet.</div>
      ) : (
        <div className="mt-4 space-y-5">
          {Array.from(courseGroups.entries()).map(([courseKey, lessons]) => (
            <section key={courseKey} aria-label={lessons[0].courseTitle}>
              <h4 className="text-sm font-semibold text-slate-950">{lessons[0].courseTitle}</h4>
              <div className="mt-2 divide-y divide-slate-200 rounded-xl border border-slate-200">
                {lessons.map((lesson) => (
                  <div key={lesson.key} className="p-3 sm:p-4">
                    <div className="mb-2">
                      {lesson.lessonFolderTitle ? <p className="text-xs font-medium text-indigo-700">{lesson.lessonFolderTitle}</p> : null}
                      <h5 className="text-sm font-semibold text-slate-900">{lesson.lessonTitle}</h5>
                    </div>
                    <div className="space-y-2">
                      {lesson.items.map((item) => {
                        const openUrl = getSafeWorksheetUrl(item.url);
                        const downloadUrl = getWorksheetDownloadUrl(item.url);
                        return (
                          <article key={item.id} className="flex flex-col gap-2 rounded-lg bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-slate-900">{item.title || 'Worksheet'}</p>
                                {item.resourceType ? <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600">{item.resourceType}</span> : null}
                              </div>
                              {item.description ? <p className="mt-1 text-xs leading-5 text-slate-600">{item.description}</p> : null}
                            </div>
                            <div className="flex shrink-0 gap-2">
                              <Button type="button" size="sm" variant="outline" disabled={!openUrl} onClick={() => openUrl && openSafely(openUrl)}>
                                Open <ExternalLink className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
                              </Button>
                              {downloadUrl ? (
                                <Button type="button" size="sm" variant="outline" onClick={() => openSafely(downloadUrl)}>
                                  Download <Download className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
                                </Button>
                              ) : null}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
