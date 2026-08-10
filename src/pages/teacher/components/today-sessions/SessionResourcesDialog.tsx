import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { BookOpenText, ExternalLink, FileSpreadsheet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { db } from '../../../../lib/firebaseConfig';
import { getSafeWorksheetUrl } from '../../../../lib/parentWorksheets';
import type { TeacherSession } from '../../../../types/Teacher';
import { lessonMatchesSession, resolveSessionLessonId } from '../../../../lib/sessionResourceMatching';

type Resource = { id: string; title: string; url: string; description?: string; resourceType?: string; targetCourseIds?: string[]; active?: boolean; archived?: boolean };
type Lesson = { id: string; title: string; teacherScript?: string; worksheetResources: Resource[] };

export function SessionResourcesDialog({ session, open, onOpenChange }: { session: TeacherSession; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    void getDocs(collection(db, 'lessonCatalog')).then((snap) => {
      if (!active) return;
      const rows = snap.docs.map((entry) => {
        const data = entry.data() as any;
        const resources = Array.isArray(data.worksheetResources) ? data.worksheetResources : [];
        return {
          id: entry.id,
          title: String(data.title || 'Lesson'),
          teacherScript: String(data.teacherScript || '').trim(),
          worksheetResources: resources.map((resource: any) => ({
            id: String(resource.id || ''), title: String(resource.title || 'Worksheet'), url: String(resource.url || ''),
            description: String(resource.description || ''), resourceType: String(resource.resourceType || ''),
            targetCourseIds: Array.isArray(resource.targetCourseIds) ? resource.targetCourseIds.map(String) : [],
            active: resource.active !== false, archived: resource.archived === true,
          })).filter((resource: Resource) => resource.id && resource.active !== false && !resource.archived),
        };
      }).filter((lesson) => lessonMatchesSession(lesson, session));
      setLessons(rows);
      setSelectedId(resolveSessionLessonId(session) || rows[0]?.id || '');
    }).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [open, session]);

  const selected = useMemo(() => lessons.find((lesson) => lesson.id === selectedId) || lessons[0], [lessons, selectedId]);
  const canonical = !!resolveSessionLessonId(session);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[82vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>Class resources</DialogTitle></DialogHeader>
        {loading ? <p className="text-sm text-slate-500">Loading resources…</p> : lessons.length === 0 ? (
          <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">No lesson resources are linked to this session’s course yet. Open Lesson Library to choose from the full curriculum.</p>
        ) : (
          <div className="space-y-4">
            {!canonical && lessons.length > 1 ? (
              <label className="block text-sm font-medium text-slate-700">Choose lesson
                <select className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3" value={selected?.id || ''} onChange={(event) => setSelectedId(event.target.value)}>
                  {lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}
                </select>
              </label>
            ) : null}
            <h3 className="text-sm font-semibold text-slate-900">{selected?.title}</h3>
            <section aria-label="Worksheets" className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><FileSpreadsheet className="h-4 w-4" /> Worksheets</div>
              {selected?.worksheetResources.length ? selected.worksheetResources.map((resource) => {
                const safeUrl = getSafeWorksheetUrl(resource.url);
                return <div key={resource.id} className="flex items-start justify-between gap-3 rounded-lg border p-3"><div><p className="text-sm font-semibold">{resource.title}</p>{resource.description ? <p className="mt-1 text-xs text-slate-600">{resource.description}</p> : null}</div><Button size="sm" variant="outline" disabled={!safeUrl} onClick={() => safeUrl && window.open(safeUrl, '_blank', 'noopener,noreferrer')}>Open <ExternalLink className="ml-1 h-3.5 w-3.5" /></Button></div>;
              }) : <p className="text-sm text-slate-500">No worksheets for this lesson.</p>}
            </section>
            <section aria-label="Class script">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><BookOpenText className="h-4 w-4" /> Class script</div>
              <div className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-800">{selected?.teacherScript || 'No class script has been added yet.'}</div>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
