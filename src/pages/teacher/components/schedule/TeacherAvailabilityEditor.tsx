import React, { useEffect, useMemo, useState } from 'react';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { addDays, format, startOfDay } from 'date-fns';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Badge } from '@components/ui/badge';
import { useToast } from '@components/hooks/use-toast';
import { db } from '../../../../lib/firebaseConfig';
import type { DemoSession } from '../../../../types/models';
import { useTeacherSessions } from '../../hooks/useTeacherSessions';
import {
  buildDayGridCells,
  buildScheduleRangeSnapshots,
  createAvailabilityWindow,
  DEFAULT_DEMO_DURATION_MINUTES,
  formatMinutesAsTimeHHmm,
  formatTimeLabel,
  getTimelineBounds,
  normalizeTeacherAvailabilityConfig,
  type SlotStatus,
  type TeacherAvailabilityConfig,
  type TeacherAvailabilityWindow,
  type TeacherBlockedSlotLite,
  validateTeacherAvailabilityWindows,
  WEEKDAY_OPTIONS,
} from '../../../../lib/teacherAvailability';

interface TeacherAvailabilityEditorProps {
  teacherId?: string;
}

const EMPTY_CONFIG: TeacherAvailabilityConfig = normalizeTeacherAvailabilityConfig({
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
  slotIntervalMinutes: 30,
  weeklyWindows: [],
});

const STATUS_STYLES: Record<SlotStatus, string> = {
  unavailable: 'bg-slate-100 text-slate-400',
  available: 'bg-emerald-50 text-emerald-700',
  class: 'bg-sky-100 text-sky-800',
  demo: 'bg-amber-100 text-amber-800',
  blocked: 'bg-rose-100 text-rose-800',
  conflict: 'bg-fuchsia-100 text-fuchsia-800',
};

const STATUS_LABELS: Record<SlotStatus, string> = {
  unavailable: '',
  available: 'Open',
  class: 'Class',
  demo: 'Demo',
  blocked: 'Block',
  conflict: 'Conflict',
};

function sortWindows(windows: TeacherAvailabilityWindow[]): TeacherAvailabilityWindow[] {
  return [...windows].sort((a, b) => {
    if (a.weekday !== b.weekday) return a.weekday - b.weekday;
    return a.startTime.localeCompare(b.startTime, undefined, { numeric: true });
  });
}

function serializeConfig(config: TeacherAvailabilityConfig): string {
  return JSON.stringify({
    timezone: config.timezone,
    slotIntervalMinutes: config.slotIntervalMinutes,
    weeklyWindows: sortWindows(config.weeklyWindows).map((window) => ({
      weekday: window.weekday,
      startTime: window.startTime,
      endTime: window.endTime,
    })),
  });
}

export function TeacherAvailabilityEditor({
  teacherId,
}: TeacherAvailabilityEditorProps): React.ReactElement {
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(!!teacherId);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<TeacherAvailabilityConfig>(EMPTY_CONFIG);
  const [savedConfig, setSavedConfig] = useState<TeacherAvailabilityConfig>(EMPTY_CONFIG);
  const [previewDays, setPreviewDays] = useState<7 | 14>(7);
  const [previewBlockedSlots, setPreviewBlockedSlots] = useState<TeacherBlockedSlotLite[]>([]);
  const [previewDemos, setPreviewDemos] = useState<DemoSession[]>([]);
  const [selectedPreviewCellKey, setSelectedPreviewCellKey] = useState<string>('');
  const previewStartDate = useMemo(() => startOfDay(new Date()), []);
  const previewEndDate = useMemo(
    () => addDays(previewStartDate, previewDays - 1),
    [previewDays, previewStartDate],
  );
  const previewEndAt = useMemo(
    () =>
      new Date(
        previewEndDate.getFullYear(),
        previewEndDate.getMonth(),
        previewEndDate.getDate(),
        23,
        59,
        59,
        999,
      ),
    [previewEndDate],
  );
  const previewStartDateKey = useMemo(() => format(previewStartDate, 'yyyy-MM-dd'), [previewStartDate]);
  const previewEndDateKey = useMemo(() => format(previewEndDate, 'yyyy-MM-dd'), [previewEndDate]);
  const { sessions: previewSessions } = useTeacherSessions(
    teacherId || undefined,
    previewStartDateKey,
    previewEndDateKey,
  );

  useEffect(() => {
    if (!teacherId) {
      setLoading(false);
      setDraft(EMPTY_CONFIG);
      setSavedConfig(EMPTY_CONFIG);
      return;
    }

    const ref = doc(db, 'teachers', teacherId, 'availability', 'config');
    const unsub = onSnapshot(
      ref,
      (snapshot) => {
        const nextConfig = normalizeTeacherAvailabilityConfig(snapshot.exists() ? snapshot.data() : {});
        setDraft(nextConfig);
        setSavedConfig(nextConfig);
        setLoading(false);
      },
      (error) => {
        console.error('teacher availability onSnapshot error', error);
        setLoading(false);
        toast({
          title: 'Unable to load availability',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive',
        });
      },
    );

    return () => unsub();
  }, [teacherId, toast]);

  useEffect(() => {
    if (!teacherId) {
      setPreviewBlockedSlots([]);
      return;
    }

    const q = query(
      collection(db, 'teachers', teacherId, 'blockedSlots'),
      where('startAt', '>=', Timestamp.fromDate(previewStartDate)),
      where('startAt', '<=', Timestamp.fromDate(previewEndAt)),
      orderBy('startAt', 'asc'),
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const nextBlockedSlots = snapshot.docs
          .map((item) => {
            const data = item.data();
            const startAt = data.startAt?.toDate ? data.startAt.toDate() : null;
            const endAt = data.endAt?.toDate ? data.endAt.toDate() : null;
            if (!startAt || !endAt) return null;
            return {
              id: item.id,
              startAt,
              endAt,
              reason: typeof data.reason === 'string' ? data.reason : '',
            } as TeacherBlockedSlotLite;
          })
          .filter((item): item is TeacherBlockedSlotLite => Boolean(item));
        setPreviewBlockedSlots(nextBlockedSlots);
      },
      (error) => {
        console.error('teacher preview blockedSlots error', error);
      },
    );

    return () => unsub();
  }, [previewEndAt, previewStartDate, teacherId]);

  useEffect(() => {
    if (!teacherId) {
      setPreviewDemos([]);
      return;
    }

    const q = query(collection(db, 'demoSessions'), where('assignedTeacherId', '==', teacherId));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const nextDemos = snapshot.docs
          .map((item) => ({ id: item.id, ...(item.data() as Omit<DemoSession, 'id'>) }))
          .filter((demo) => {
            const confirmedDate = String(demo.teacherConfirmedDate || '').trim();
            const status = String(demo.status || '').trim().toLowerCase();
            if (!confirmedDate) return false;
            if (status !== 'assigned' && status !== 'completed') return false;
            return confirmedDate >= previewStartDateKey && confirmedDate <= previewEndDateKey;
          })
          .sort((a, b) =>
            String(a.teacherConfirmedDate || '').localeCompare(String(b.teacherConfirmedDate || '')),
          );
        setPreviewDemos(nextDemos);
      },
      (error) => {
        console.error('teacher preview demos error', error);
      },
    );

    return () => unsub();
  }, [previewEndDateKey, previewStartDateKey, teacherId]);

  const isDirty = useMemo(
    () => serializeConfig(draft) !== serializeConfig(savedConfig),
    [draft, savedConfig],
  );

  const windowsByWeekday = useMemo(() => {
    const map = new Map<number, TeacherAvailabilityWindow[]>();
    draft.weeklyWindows.forEach((window) => {
      const list = map.get(window.weekday) || [];
      list.push(window);
      map.set(window.weekday, list);
    });
    return map;
  }, [draft.weeklyWindows]);

  const previewSnapshots = useMemo(
    () =>
      buildScheduleRangeSnapshots({
        startDate: previewStartDate,
        days: previewDays,
        availabilityConfig: draft,
        sessions: previewSessions,
        demos: previewDemos,
        blockedSlots: previewBlockedSlots,
        demoDurationMinutes: DEFAULT_DEMO_DURATION_MINUTES,
      }),
    [
      draft,
      previewBlockedSlots,
      previewDays,
      previewDemos,
      previewSessions,
      previewStartDate,
    ],
  );

  const previewTimelineBounds = useMemo(
    () => getTimelineBounds(previewSnapshots),
    [previewSnapshots],
  );

  const previewSlotIntervalMinutes = Math.max(15, draft.slotIntervalMinutes || 30);

  const previewTimeRows = useMemo(() => {
    const rows: number[] = [];
    for (
      let minutes = previewTimelineBounds.startMinutes;
      minutes < previewTimelineBounds.endMinutes;
      minutes += previewSlotIntervalMinutes
    ) {
      rows.push(minutes);
    }
    return rows;
  }, [previewSlotIntervalMinutes, previewTimelineBounds.endMinutes, previewTimelineBounds.startMinutes]);

  const previewCellsByDate = useMemo(() => {
    const map: Record<string, ReturnType<typeof buildDayGridCells>> = {};
    previewSnapshots.forEach((day) => {
      map[day.dateKey] = buildDayGridCells({
        day,
        slotIntervalMinutes: previewSlotIntervalMinutes,
        startMinutes: previewTimelineBounds.startMinutes,
        endMinutes: previewTimelineBounds.endMinutes,
      });
    });
    return map;
  }, [
    previewSlotIntervalMinutes,
    previewSnapshots,
    previewTimelineBounds.endMinutes,
    previewTimelineBounds.startMinutes,
  ]);

  const previewGridByDay = useMemo(
    () => previewSnapshots.map((day) => previewCellsByDate[day.dateKey] || []),
    [previewCellsByDate, previewSnapshots],
  );

  const selectedPreviewCell = useMemo(() => {
    if (!selectedPreviewCellKey) return null;
    const [dateKey, minuteText] = selectedPreviewCellKey.split('|');
    const minutes = Number(minuteText);
    if (!dateKey || !Number.isFinite(minutes)) return null;
    const dayIndex = previewSnapshots.findIndex((day) => day.dateKey === dateKey);
    const rowIndex = previewTimeRows.findIndex((value) => value === minutes);
    if (dayIndex < 0 || rowIndex < 0) return null;
    const cell = previewGridByDay[dayIndex]?.[rowIndex];
    if (!cell) return null;
    return {
      day: previewSnapshots[dayIndex],
      minutes,
      cell,
    };
  }, [previewGridByDay, previewSnapshots, previewTimeRows, selectedPreviewCellKey]);

  useEffect(() => {
    if (!selectedPreviewCellKey) return;
    if (!selectedPreviewCell) setSelectedPreviewCellKey('');
  }, [selectedPreviewCell, selectedPreviewCellKey]);

  const handleWindowChange = (
    windowId: string,
    patch: Partial<Pick<TeacherAvailabilityWindow, 'startTime' | 'endTime'>>,
  ) => {
    setDraft((current) => ({
      ...current,
      weeklyWindows: current.weeklyWindows.map((window) =>
        window.id === windowId ? { ...window, ...patch } : window,
      ),
    }));
  };

  const handleRemoveWindow = (windowId: string) => {
    setDraft((current) => ({
      ...current,
      weeklyWindows: current.weeklyWindows.filter((window) => window.id !== windowId),
    }));
  };

  const handleAddWindow = (weekday: number) => {
    setDraft((current) => ({
      ...current,
      weeklyWindows: sortWindows([...current.weeklyWindows, createAvailabilityWindow(weekday)]),
    }));
  };

  const applyWeekdayEveningPreset = () => {
    setDraft((current) => ({
      ...current,
      weeklyWindows: sortWindows([
        createAvailabilityWindow(1, '17:00', '21:00'),
        createAvailabilityWindow(2, '17:00', '21:00'),
        createAvailabilityWindow(3, '17:00', '21:00'),
        createAvailabilityWindow(4, '17:00', '21:00'),
        createAvailabilityWindow(5, '17:00', '21:00'),
      ]),
    }));
  };

  const clearAllWindows = () => {
    setDraft((current) => ({ ...current, weeklyWindows: [] }));
  };

  const clearWeekdayWindows = (weekday: number) => {
    setDraft((current) => ({
      ...current,
      weeklyWindows: current.weeklyWindows.filter((window) => window.weekday !== weekday),
    }));
  };

  const resetDraftToSaved = () => {
    setDraft(savedConfig);
  };

  const handleSave = async () => {
    if (!teacherId) {
      toast({
        title: 'Teacher is missing',
        description: 'Please sign in again.',
        variant: 'destructive',
      });
      return;
    }

    const validation = validateTeacherAvailabilityWindows(draft.weeklyWindows);
    if (!validation.ok) {
      toast({
        title: 'Availability needs a fix',
        description: validation.message,
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const normalized = normalizeTeacherAvailabilityConfig({
        ...draft,
        weeklyWindows: validation.windows,
      });

      await setDoc(
        doc(db, 'teachers', teacherId, 'availability', 'config'),
        {
          timezone: normalized.timezone,
          slotIntervalMinutes: normalized.slotIntervalMinutes,
          weeklyWindows: normalized.weeklyWindows,
          updatedAt: serverTimestamp(),
          updatedBy: teacherId,
        },
      );

      toast({
        title: 'Availability saved',
        description: 'Admissions can now see your updated weekly availability.',
      });
    } catch (error) {
      console.error('save teacher availability error', error);
      toast({
        title: 'Unable to save availability',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUnpublishAvailability = async () => {
    if (!teacherId) return;
    const shouldRemove = window.confirm(
      'Remove all published availability windows? Admin will no longer see open slots for you until you publish again.',
    );
    if (!shouldRemove) return;

    setSaving(true);
    try {
      await deleteDoc(doc(db, 'teachers', teacherId, 'availability', 'config'));
      toast({
        title: 'Availability removed',
        description: 'Your weekly availability has been unpublished.',
      });
    } catch (error) {
      console.error('unpublish teacher availability error', error);
      toast({
        title: 'Unable to remove availability',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!teacherId) {
    return (
      <Card className="border-slate-200 bg-white/90 p-4">
        <div className="text-sm text-muted-foreground">Teacher availability cannot load without a teacher id.</div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="border-slate-200 bg-white/90 p-4">
        <div className="text-sm text-muted-foreground">Loading weekly availability…</div>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 bg-white/95 p-4 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-900">Weekly Availability Planner</h3>
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
              {draft.timezone}
            </Badge>
            <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
              {savedConfig.weeklyWindows.length} published windows
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Publish the hours admissions can book. Keep one-off exceptions in the calendar below using
            Block Time.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={applyWeekdayEveningPreset}>
            Apply weekday evenings
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={resetDraftToSaved} disabled={!isDirty || saving}>
            Reset unsaved
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={clearAllWindows} disabled={saving}>
            Clear all draft
          </Button>
          <Button type="button" size="sm" onClick={handleSave} disabled={!isDirty || saving}>
            {saving ? 'Saving…' : isDirty ? 'Save availability' : 'Saved'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={handleUnpublishAvailability}
            disabled={saving || savedConfig.weeklyWindows.length === 0}
          >
            Remove published schedule
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {WEEKDAY_OPTIONS.map((day) => {
          const dayWindows = windowsByWeekday.get(day.value) || [];
          return (
            <div
              key={day.value}
              className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="w-full min-w-0 md:max-w-[180px]">
                  <div className="text-sm font-semibold text-slate-900">{day.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {dayWindows.length > 0
                      ? dayWindows.map((window) => `${formatTimeLabel(window.startTime)} - ${formatTimeLabel(window.endTime)}`).join(' • ')
                      : 'No published hours'}
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  {dayWindows.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-2 text-sm text-muted-foreground">
                      Admissions will treat this day as unavailable until you add a slot.
                    </div>
                  ) : (
                    dayWindows.map((window) => (
                      <div
                        key={window.id}
                        className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center"
                      >
                        <Input
                          type="time"
                          value={window.startTime}
                          onChange={(event) => handleWindowChange(window.id, { startTime: event.target.value })}
                          className="sm:w-[160px]"
                        />
                        <span className="hidden text-sm text-muted-foreground sm:inline">to</span>
                        <Input
                          type="time"
                          value={window.endTime}
                          onChange={(event) => handleWindowChange(window.id, { endTime: event.target.value })}
                          className="sm:w-[160px]"
                        />
                        <div className="sm:ml-auto">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-slate-500 hover:text-red-600"
                            onClick={() => handleRemoveWindow(window.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => handleAddWindow(day.value)}>
                      Add time window
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-slate-500 hover:text-red-600"
                      onClick={() => clearWeekdayWindows(day.value)}
                      disabled={dayWindows.length === 0}
                    >
                      Clear day
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-base font-semibold text-slate-900">Effective Preview (Before Save)</h4>
            <p className="text-sm text-muted-foreground">
              This uses your draft availability plus existing classes, demos, and manual blocks.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={previewDays === 7 ? 'default' : 'outline'}
              onClick={() => setPreviewDays(7)}
            >
              Next 7 days
            </Button>
            <Button
              type="button"
              size="sm"
              variant={previewDays === 14 ? 'default' : 'outline'}
              onClick={() => setPreviewDays(14)}
            >
              Next 14 days
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {(['available', 'class', 'demo', 'blocked', 'conflict'] as SlotStatus[]).map((status) => (
            <span
              key={status}
              className={`inline-flex items-center rounded-full px-3 py-1 font-medium ${STATUS_STYLES[status]}`}
            >
              {STATUS_LABELS[status]}
            </span>
          ))}
        </div>

        <div className="mt-4 max-h-[420px] overflow-auto rounded-xl border border-slate-200 bg-white p-2">
          <table className="min-w-max border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="sticky left-0 top-0 z-30 min-w-[95px] rounded-lg bg-white px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 shadow-sm">
                  Time
                </th>
                {previewSnapshots.map((day) => (
                  <th
                    key={day.dateKey}
                    className="sticky top-0 z-20 min-w-[104px] rounded-lg bg-slate-100 px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600"
                  >
                    <div>{format(day.date, 'EEE')}</div>
                    <div className="mt-1 text-[10px] font-medium text-slate-500">{format(day.date, 'd MMM')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewTimeRows.map((minutes, rowIndex) => (
                <tr key={minutes}>
                  <td className="sticky left-0 z-10 rounded-lg bg-white px-2 py-2 text-xs font-medium text-slate-500 shadow-sm">
                    {formatTimeLabel(formatMinutesAsTimeHHmm(minutes))}
                  </td>
                  {previewGridByDay.map((cells, dayIndex) => {
                    const cell = cells[rowIndex];
                    const key = `${previewSnapshots[dayIndex].dateKey}|${minutes}`;
                    const isSelected = selectedPreviewCellKey === key;
                    const isClickable = Boolean(cell && cell.status !== 'unavailable');
                    return (
                      <td
                        key={key}
                        title={(cell?.labels || []).join('\n')}
                        className={`h-[40px] min-w-[104px] rounded-lg px-2 py-1 text-center text-[11px] font-medium ${
                          STATUS_STYLES[cell?.status || 'unavailable']
                        } ${isClickable ? 'cursor-pointer' : ''} ${isSelected ? 'ring-2 ring-sky-400 ring-offset-1' : ''}`}
                        onClick={() => {
                          if (!isClickable) return;
                          setSelectedPreviewCellKey(key);
                        }}
                      >
                        {STATUS_LABELS[cell?.status || 'unavailable']}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedPreviewCell ? (
          <Card className="mt-4 border-slate-200 bg-slate-50/70 p-3 shadow-none">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm font-semibold text-slate-900">
                {format(selectedPreviewCell.day.date, 'EEE, d MMM')} ·{' '}
                {formatTimeLabel(formatMinutesAsTimeHHmm(selectedPreviewCell.minutes))} -{' '}
                {formatTimeLabel(
                  formatMinutesAsTimeHHmm(selectedPreviewCell.minutes + previewSlotIntervalMinutes),
                )}
              </div>
              <Badge className={STATUS_STYLES[selectedPreviewCell.cell.status]}>
                {STATUS_LABELS[selectedPreviewCell.cell.status] || 'Unavailable'}
              </Badge>
            </div>

            {selectedPreviewCell.cell.conflictReasons.length > 0 ? (
              <div className="mt-3">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Why conflict
                </div>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {selectedPreviewCell.cell.conflictReasons.map((reason, index) => (
                    <li key={`${reason}_${index}`}>• {reason}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-3">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Overlapping Sources
              </div>
              <div className="mt-2 space-y-2">
                {selectedPreviewCell.cell.sources.length === 0 ? (
                  <div className="text-sm text-slate-500">No overlapping source records for this slot.</div>
                ) : (
                  selectedPreviewCell.cell.sources.map((source) => (
                    <div key={`${source.kind}_${source.id}`} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        {source.kind}
                      </div>
                      <div className="mt-1 text-sm font-medium text-slate-800">{source.label}</div>
                      <div className="mt-1 text-xs text-slate-500">Source ID: {source.sourceId || source.id}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        ) : (
          <div className="mt-3 text-sm text-slate-500">
            Click any non-empty slot in the preview to inspect source records and conflict reasons.
          </div>
        )}
      </div>
    </Card>
  );
}

export default TeacherAvailabilityEditor;
