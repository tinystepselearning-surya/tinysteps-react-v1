import React, { useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Badge } from '@components/ui/badge';
import { useToast } from '@components/hooks/use-toast';
import { db } from '../../../../lib/firebaseConfig';
import {
  createAvailabilityWindow,
  formatTimeLabel,
  normalizeTeacherAvailabilityConfig,
  type TeacherAvailabilityConfig,
  type TeacherAvailabilityWindow,
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
        { merge: true },
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
          <Button type="button" size="sm" variant="outline" onClick={clearAllWindows}>
            Clear all
          </Button>
          <Button type="button" size="sm" onClick={handleSave} disabled={!isDirty || saving}>
            {saving ? 'Saving…' : isDirty ? 'Save availability' : 'Saved'}
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

                  <Button type="button" size="sm" variant="outline" onClick={() => handleAddWindow(day.value)}>
                    Add time window
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default TeacherAvailabilityEditor;
