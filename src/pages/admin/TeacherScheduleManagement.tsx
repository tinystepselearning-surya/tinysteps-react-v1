import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query, Timestamp, where } from 'firebase/firestore';
import {
  addDays,
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@components/ui/tabs';
import { useTeacherSessions } from '../teacher/hooks/useTeacherSessions';
import { db } from '../../lib/firebaseConfig';
import type { DemoSession } from '../../types/models';
import {
  buildDayGridCells,
  buildScheduleRangeSnapshots,
  flattenOpenIntervals,
  formatIntervalLabel,
  formatTimeLabel,
  getTimelineBounds,
  normalizeTeacherAvailabilityConfig,
  summarizeScheduleRange,
  type SlotStatus,
  type TeacherAvailabilityConfig,
  type TeacherBlockedSlotLite,
  type ScheduleDaySnapshot,
  WEEKDAY_OPTIONS,
} from '../../lib/teacherAvailability';

type CalendarViewMode = 'day' | 'week' | 'month';

type TeacherOption = {
  id: string;
  name: string;
  email: string;
};

type SectionKey = 'suggestions' | 'canvas' | 'details';

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

const MONTH_WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function toHours(count: number, slotIntervalMinutes: number): string {
  return `${((count * slotIntervalMinutes) / 60).toFixed(1)}h`;
}

function resolveTeacherName(data: Record<string, unknown>, fallbackId: string): string {
  const candidates = [data.displayName, data.fullName, data.name, data.firstName, data.email, fallbackId];
  const resolved = candidates.find((value) => typeof value === 'string' && value.trim().length > 0);
  return typeof resolved === 'string' ? resolved.trim() : fallbackId;
}

function formatTeacherWeekSummary(config: TeacherAvailabilityConfig | null | undefined): string {
  const normalized = normalizeTeacherAvailabilityConfig(config || {});
  if (normalized.weeklyWindows.length === 0) return 'No published availability';

  const grouped = new Map<number, string[]>();
  normalized.weeklyWindows.forEach((window) => {
    const list = grouped.get(window.weekday) || [];
    list.push(`${formatTimeLabel(window.startTime)} - ${formatTimeLabel(window.endTime)}`);
    grouped.set(window.weekday, list);
  });

  return WEEKDAY_OPTIONS.filter((day) => grouped.has(day.value))
    .map((day) => `${day.shortLabel} ${grouped.get(day.value)?.join(', ')}`)
    .join(' • ');
}

function MetricCard({
  label,
  value,
  tone = 'text-slate-900',
}: {
  label: string;
  value: string;
  tone?: string;
}): React.ReactElement {
  return (
    <Card className="border-slate-200 bg-white/95 p-4 shadow-sm">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${tone}`}>{value}</div>
    </Card>
  );
}

function DayIntervals({
  title,
  intervals,
  tone,
}: {
  title: string;
  intervals: Array<{ id: string; startAt: Date; endAt: Date; label: string }>;
  tone: string;
}): React.ReactElement {
  if (intervals.length === 0) {
    return (
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</div>
        <div className="mt-2 text-sm text-slate-400">None</div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</div>
      <div className="mt-2 space-y-2">
        {intervals.map((interval) => (
          <div key={interval.id} className={`rounded-xl px-3 py-2 text-sm ${tone}`}>
            <div className="font-medium">{formatIntervalLabel(interval.startAt, interval.endAt)}</div>
            <div className="mt-1 text-xs opacity-80">{interval.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  expanded,
  onToggle,
}: {
  title: string;
  subtitle: string;
  expanded: boolean;
  onToggle: () => void;
}): React.ReactElement {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h4 className="text-lg font-semibold text-slate-900">{title}</h4>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <Button type="button" size="sm" variant="outline" onClick={onToggle} className="shrink-0">
        {expanded ? (
          <>
            <ChevronUp className="mr-1 h-4 w-4" />
            Collapse
          </>
        ) : (
          <>
            <ChevronDown className="mr-1 h-4 w-4" />
            Expand
          </>
        )}
      </Button>
    </div>
  );
}

function buildRangeMeta(view: CalendarViewMode, focusDate: Date): {
  startDate: Date;
  endDate: Date;
  days: number;
  title: string;
  subtitle: string;
} {
  if (view === 'day') {
    const startDate = startOfDay(focusDate);
    const endDate = endOfDay(focusDate);
    return {
      startDate,
      endDate,
      days: 1,
      title: format(startDate, 'EEEE, d MMM yyyy'),
      subtitle: 'Day view',
    };
  }

  if (view === 'week') {
    const startDate = startOfWeek(focusDate, { weekStartsOn: 1 });
    const endDate = endOfWeek(focusDate, { weekStartsOn: 1 });
    return {
      startDate,
      endDate,
      days: differenceInCalendarDays(endDate, startDate) + 1,
      title: `${format(startDate, 'd MMM')} - ${format(endDate, 'd MMM yyyy')}`,
      subtitle: 'Week view',
    };
  }

  const startDate = startOfMonth(focusDate);
  const endDate = endOfMonth(focusDate);
  return {
    startDate,
    endDate,
    days: differenceInCalendarDays(endDate, startDate) + 1,
    title: format(startDate, 'MMMM yyyy'),
    subtitle: 'Month view',
  };
}

export default function TeacherScheduleManagement(): React.ReactElement {
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [calendarView, setCalendarView] = useState<CalendarViewMode>('week');
  const [focusDate, setFocusDate] = useState<Date>(startOfDay(new Date()));
  const [availabilityByTeacher, setAvailabilityByTeacher] = useState<Record<string, TeacherAvailabilityConfig>>({});
  const [blockedSlots, setBlockedSlots] = useState<TeacherBlockedSlotLite[]>([]);
  const [demos, setDemos] = useState<DemoSession[]>([]);
  const [selectedDayKey, setSelectedDayKey] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    suggestions: true,
    canvas: true,
    details: true,
  });

  const rangeMeta = useMemo(() => buildRangeMeta(calendarView, focusDate), [calendarView, focusDate]);
  const startDate = rangeMeta.startDate;
  const endDate = rangeMeta.endDate;
  const startDateKey = useMemo(() => format(startDate, 'yyyy-MM-dd'), [startDate]);
  const endDateKey = useMemo(() => format(endDate, 'yyyy-MM-dd'), [endDate]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const nextTeachers = snapshot.docs
          .map(
            (item) =>
              ({
                id: item.id,
                ...(item.data() as Record<string, unknown>),
              }) as Record<string, unknown> & { id: string },
          )
          .filter((row) => {
            const role = String(row.role || '').trim().toLowerCase();
            const roles = Array.isArray(row.roles)
              ? row.roles.map((value: unknown) => String(value).trim().toLowerCase())
              : [];
            return role === 'teacher' || roles.includes('teacher');
          })
          .map((row) => ({
            id: row.id,
            name: resolveTeacherName(row, row.id),
            email: typeof row.email === 'string' ? row.email : '',
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        setTeachers(nextTeachers);
        setSelectedTeacherId((current) => {
          if (current && nextTeachers.some((teacher) => teacher.id === current)) return current;
          return nextTeachers[0]?.id || '';
        });
      },
      (error) => {
        console.error('teacher users onSnapshot error', error);
      },
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    if (teachers.length === 0) {
      setAvailabilityByTeacher({});
      return;
    }

    const unsubs = teachers.map((teacher) =>
      onSnapshot(
        doc(db, 'teachers', teacher.id, 'availability', 'config'),
        (snapshot) => {
          setAvailabilityByTeacher((current) => ({
            ...current,
            [teacher.id]: normalizeTeacherAvailabilityConfig(snapshot.exists() ? snapshot.data() : {}),
          }));
        },
        (error) => {
          console.error('teacher availability summary onSnapshot error', error);
        },
      ),
    );

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [teachers]);

  useEffect(() => {
    if (!selectedTeacherId) {
      setBlockedSlots([]);
      return;
    }

    const q = query(
      collection(db, 'teachers', selectedTeacherId, 'blockedSlots'),
      where('startAt', '>=', Timestamp.fromDate(startDate)),
      where('startAt', '<=', Timestamp.fromDate(endDate)),
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
        setBlockedSlots(nextBlockedSlots);
      },
      (error) => {
        console.error('teacher blockedSlots admin view error', error);
      },
    );

    return () => unsub();
  }, [endDate, selectedTeacherId, startDate]);

  useEffect(() => {
    if (!selectedTeacherId) {
      setDemos([]);
      return;
    }

    const q = query(collection(db, 'demoSessions'), where('assignedTeacherId', '==', selectedTeacherId));
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
            return confirmedDate >= startDateKey && confirmedDate <= endDateKey;
          })
          .sort((a, b) =>
            String(a.teacherConfirmedDate || '').localeCompare(String(b.teacherConfirmedDate || '')),
          );
        setDemos(nextDemos);
      },
      (error) => {
        console.error('teacher demos admin view error', error);
      },
    );

    return () => unsub();
  }, [endDateKey, selectedTeacherId, startDateKey]);

  const { sessions, isLoading: sessionsLoading } = useTeacherSessions(
    selectedTeacherId || undefined,
    startDateKey,
    endDateKey,
  );

  const filteredTeachers = useMemo(() => {
    const search = teacherSearch.trim().toLowerCase();
    if (!search) return teachers;
    return teachers.filter((teacher) =>
      `${teacher.name} ${teacher.email}`.toLowerCase().includes(search),
    );
  }, [teacherSearch, teachers]);

  const selectedTeacher = useMemo(
    () => teachers.find((teacher) => teacher.id === selectedTeacherId) || null,
    [selectedTeacherId, teachers],
  );

  const selectedAvailability = availabilityByTeacher[selectedTeacherId] || null;

  const scheduleDays = useMemo(
    () =>
      buildScheduleRangeSnapshots({
        startDate,
        days: rangeMeta.days,
        availabilityConfig: selectedAvailability,
        sessions,
        demos,
        blockedSlots,
      }),
    [blockedSlots, demos, rangeMeta.days, selectedAvailability, sessions, startDate],
  );

  useEffect(() => {
    if (scheduleDays.length === 0) {
      setSelectedDayKey('');
      return;
    }
    setSelectedDayKey((current) =>
      scheduleDays.some((day) => day.dateKey === current) ? current : scheduleDays[0].dateKey,
    );
  }, [scheduleDays]);

  const selectedDaySnapshot = useMemo(
    () => scheduleDays.find((day) => day.dateKey === selectedDayKey) || scheduleDays[0] || null,
    [scheduleDays, selectedDayKey],
  );

  const timelineBounds = useMemo(
    () => getTimelineBounds(calendarView === 'month' && selectedDaySnapshot ? [selectedDaySnapshot] : scheduleDays),
    [calendarView, scheduleDays, selectedDaySnapshot],
  );
  const slotIntervalMinutes = selectedAvailability?.slotIntervalMinutes || 30;

  const timeRows = useMemo(() => {
    const rows: number[] = [];
    for (
      let minutes = timelineBounds.startMinutes;
      minutes < timelineBounds.endMinutes;
      minutes += slotIntervalMinutes
    ) {
      rows.push(minutes);
    }
    return rows;
  }, [slotIntervalMinutes, timelineBounds.endMinutes, timelineBounds.startMinutes]);

  const dayCellsByDate = useMemo(() => {
    const map: Record<string, ReturnType<typeof buildDayGridCells>> = {};
    scheduleDays.forEach((day) => {
      map[day.dateKey] = buildDayGridCells({
        day,
        slotIntervalMinutes,
        startMinutes: timelineBounds.startMinutes,
        endMinutes: timelineBounds.endMinutes,
      });
    });
    return map;
  }, [scheduleDays, slotIntervalMinutes, timelineBounds.endMinutes, timelineBounds.startMinutes]);

  const dayGrid = useMemo(
    () => scheduleDays.map((day) => dayCellsByDate[day.dateKey] || []),
    [dayCellsByDate, scheduleDays],
  );

  const summaryCounts = useMemo(
    () =>
      summarizeScheduleRange({
        days: scheduleDays,
        slotIntervalMinutes,
        startMinutes: timelineBounds.startMinutes,
        endMinutes: timelineBounds.endMinutes,
      }),
    [scheduleDays, slotIntervalMinutes, timelineBounds.endMinutes, timelineBounds.startMinutes],
  );

  const nextBookableIntervals = useMemo(
    () =>
      flattenOpenIntervals(scheduleDays)
        .filter((interval) => interval.endAt > new Date())
        .slice(0, 12),
    [scheduleDays],
  );

  const allClassIntervals = useMemo(
    () => scheduleDays.flatMap((day) => day.classIntervals).sort((a, b) => a.startAt.getTime() - b.startAt.getTime()),
    [scheduleDays],
  );

  const allDemoIntervals = useMemo(
    () => scheduleDays.flatMap((day) => day.demoIntervals).sort((a, b) => a.startAt.getTime() - b.startAt.getTime()),
    [scheduleDays],
  );

  const nextClass = useMemo(
    () => allClassIntervals.find((interval) => interval.endAt > new Date()) || null,
    [allClassIntervals],
  );

  const nextDemo = useMemo(
    () => allDemoIntervals.find((interval) => interval.endAt > new Date()) || null,
    [allDemoIntervals],
  );

  const publishedSlots = summaryCounts.available + summaryCounts.class + summaryCounts.demo + summaryCounts.blocked;
  const utilizationPct = publishedSlots > 0
    ? Math.round(((summaryCounts.class + summaryCounts.demo) / publishedSlots) * 100)
    : 0;

  const monthLeadingBlanks = useMemo(() => {
    if (calendarView !== 'month' || scheduleDays.length === 0) return 0;
    return scheduleDays[0].date.getDay();
  }, [calendarView, scheduleDays]);

  const monthCalendarCells = useMemo(() => {
    if (calendarView !== 'month') return [] as Array<ScheduleDaySnapshot | null>;
    const cells: Array<ScheduleDaySnapshot | null> = [
      ...Array.from({ length: monthLeadingBlanks }, () => null),
      ...scheduleDays,
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calendarView, monthLeadingBlanks, scheduleDays]);

  const selectedTimeGridDays = useMemo(() => {
    if (calendarView === 'month') return selectedDaySnapshot ? [selectedDaySnapshot] : [];
    return scheduleDays;
  }, [calendarView, scheduleDays, selectedDaySnapshot]);

  const selectedTimeGrid = useMemo(
    () => selectedTimeGridDays.map((day) => dayCellsByDate[day.dateKey] || []),
    [dayCellsByDate, selectedTimeGridDays],
  );

  const toggleSection = (key: SectionKey) => {
    setExpandedSections((current) => ({ ...current, [key]: !current[key] }));
  };

  const handlePrev = () => {
    if (calendarView === 'day') setFocusDate((current) => addDays(current, -1));
    else if (calendarView === 'week') setFocusDate((current) => subWeeks(current, 1));
    else setFocusDate((current) => subMonths(current, 1));
  };

  const handleNext = () => {
    if (calendarView === 'day') setFocusDate((current) => addDays(current, 1));
    else if (calendarView === 'week') setFocusDate((current) => addWeeks(current, 1));
    else setFocusDate((current) => addMonths(current, 1));
  };

  const handleToday = () => setFocusDate(startOfDay(new Date()));

  if (teachers.length === 0) {
    return (
      <Card className="border-slate-200 bg-white/95 p-6 shadow-sm">
        <div className="text-sm text-muted-foreground">No teacher profiles are available yet.</div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 bg-white/95 p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Teacher Schedule Board</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick a teacher, then review what is open, booked, blocked, or conflicting.
            </p>
          </div>
          <div className="w-full lg:w-[320px]">
            <Input
              value={teacherSearch}
              onChange={(event) => setTeacherSearch(event.target.value)}
              placeholder="Search teacher"
            />
          </div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {filteredTeachers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              No teacher matched your search.
            </div>
          ) : (
            filteredTeachers.map((teacher) => {
              const isSelected = teacher.id === selectedTeacherId;
              return (
                <button
                  key={teacher.id}
                  type="button"
                  onClick={() => setSelectedTeacherId(teacher.id)}
                  className={`min-w-[250px] shrink-0 rounded-xl border p-3 text-left transition ${
                    isSelected ? 'border-sky-300 bg-sky-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="text-sm font-semibold text-slate-900">{teacher.name}</div>
                  <div className="mt-1 text-xs text-slate-500">{teacher.email || 'No email'}</div>
                  <div className="mt-2 line-clamp-1 text-xs text-slate-500">
                    {formatTeacherWeekSummary(availabilityByTeacher[teacher.id])}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </Card>

      <Card className="border-slate-200 bg-white/95 p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-2xl font-semibold text-slate-900">
                {selectedTeacher?.name || 'Select a teacher'}
              </h3>
              {selectedAvailability?.timezone ? (
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  {selectedAvailability.timezone}
                </Badge>
              ) : null}
            </div>
            <div className="text-sm text-muted-foreground">
              Weekly pattern: {formatTeacherWeekSummary(selectedAvailability)}
            </div>
            <div className="text-sm text-muted-foreground">
              {rangeMeta.subtitle}: {rangeMeta.title}
            </div>
          </div>

          <div className="space-y-2">
            <Tabs
              value={calendarView}
              onValueChange={(value) => setCalendarView(value as CalendarViewMode)}
              className="w-full"
            >
              <TabsList className="grid h-auto grid-cols-3 rounded-xl border border-slate-200 bg-slate-50 p-1">
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handlePrev}>
                Prev
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleToday}>
                Today
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleNext}>
                Next
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2 text-sm text-slate-600 md:grid-cols-3">
          <div>
            <span className="font-semibold text-slate-900">Next class:</span>{' '}
            {nextClass ? `${format(nextClass.startAt, 'EEE d MMM, h:mm a')}` : 'None in range'}
          </div>
          <div>
            <span className="font-semibold text-slate-900">Next demo:</span>{' '}
            {nextDemo ? `${format(nextDemo.startAt, 'EEE d MMM, h:mm a')}` : 'None in range'}
          </div>
          <div>
            <span className="font-semibold text-slate-900">Utilization:</span> {utilizationPct}%
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {(['available', 'class', 'demo', 'blocked', 'conflict'] as SlotStatus[]).map((status) => (
            <span
              key={status}
              className={`inline-flex items-center rounded-full px-3 py-1 font-medium ${STATUS_STYLES[status]}`}
            >
              {STATUS_LABELS[status]}
            </span>
          ))}
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Open To Book" value={toHours(summaryCounts.available, slotIntervalMinutes)} tone="text-emerald-700" />
        <MetricCard label="Regular Classes" value={toHours(summaryCounts.class, slotIntervalMinutes)} tone="text-sky-700" />
        <MetricCard label="Demos" value={toHours(summaryCounts.demo, slotIntervalMinutes)} tone="text-amber-700" />
        <MetricCard label="Teacher Blocks" value={toHours(summaryCounts.blocked, slotIntervalMinutes)} tone="text-rose-700" />
        <MetricCard label="Conflicts" value={`${summaryCounts.conflict} slots`} tone={summaryCounts.conflict > 0 ? 'text-fuchsia-700' : 'text-slate-900'} />
      </div>

      <Card className="border-slate-200 bg-white/95 p-4 shadow-sm">
              <SectionHeader
                title="Bookable Slot Suggestions"
                subtitle="These are the next open intervals after classes, demos, and manual blocks are reconciled."
                expanded={expandedSections.suggestions}
                onToggle={() => toggleSection('suggestions')}
              />
              {expandedSections.suggestions ? (
                nextBookableIntervals.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-muted-foreground">
                    No open bookable intervals in this range.
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {nextBookableIntervals.map((interval) => (
                      <div key={interval.id} className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                          {format(interval.startAt, 'EEE, d MMM')}
                        </div>
                        <div className="mt-2 text-sm font-medium text-emerald-900">
                          {formatIntervalLabel(interval.startAt, interval.endAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : null}
            </Card>

      <Card className="border-slate-200 bg-white/95 p-4 shadow-sm">
              <SectionHeader
                title={calendarView === 'month' ? 'Month Calendar' : 'Calendar Timeline'}
                subtitle={
                  calendarView === 'month'
                    ? 'Click any day to open details and view classes, demos, blocks, and conflicts.'
                    : 'Scroll horizontally/vertically. Header and time column stay pinned for context.'
                }
                expanded={expandedSections.canvas}
                onToggle={() => toggleSection('canvas')}
              />
              {expandedSections.canvas ? (
                calendarView === 'month' ? (
                  <div className="mt-4">
                    <div className="mb-2 grid grid-cols-7 gap-2">
                      {MONTH_WEEKDAY_LABELS.map((label) => (
                        <div
                          key={label}
                          className="rounded-xl border border-slate-200 bg-slate-50 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
                        >
                          {label}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                      {monthCalendarCells.map((day, index) => {
                        if (!day) {
                          return <div key={`blank_${index}`} className="h-[118px] rounded-xl border border-transparent" />;
                        }
                        const dayCells = dayCellsByDate[day.dateKey] || [];
                        const conflictCount = dayCells.filter((cell) => cell.status === 'conflict').length;
                        const classCount = day.classIntervals.length;
                        const demoCount = day.demoIntervals.length;
                        const openCount = day.openIntervals.length;
                        const blockCount = day.blockedIntervals.length;
                        const isSelected = selectedDaySnapshot?.dateKey === day.dateKey;
                        return (
                          <button
                            type="button"
                            key={day.dateKey}
                            onClick={() => setSelectedDayKey(day.dateKey)}
                            className={`h-[118px] rounded-xl border p-2 text-left transition ${
                              isSelected
                                ? 'border-sky-300 bg-sky-50 shadow-sm'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="text-xs font-semibold text-slate-900">{format(day.date, 'd')}</div>
                            <div className="mt-2 space-y-1 text-[11px]">
                              <div className="text-emerald-700">Open: {openCount}</div>
                              <div className="text-sky-700">Class: {classCount}</div>
                              <div className="text-amber-700">Demo: {demoCount}</div>
                              <div className="text-rose-700">Block: {blockCount}</div>
                              {conflictCount > 0 ? <div className="text-fuchsia-700">Conflict: {conflictCount}</div> : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 max-h-[500px] overflow-auto">
                    <table className="min-w-max border-separate border-spacing-1">
                      <thead>
                        <tr>
                          <th className="sticky left-0 top-0 z-40 min-w-[100px] rounded-xl bg-white px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 shadow-sm">
                            Time
                          </th>
                          {selectedTimeGridDays.map((day) => (
                            <th
                              key={day.dateKey}
                              className="sticky top-0 z-20 min-w-[110px] rounded-xl bg-slate-100 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-600"
                            >
                              <div>{format(day.date, 'EEE')}</div>
                              <div className="mt-1 text-[11px] font-medium text-slate-500">{format(day.date, 'd MMM')}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {timeRows.map((minutes, rowIndex) => (
                          <tr key={minutes}>
                            <td className="sticky left-0 z-10 rounded-xl bg-white px-3 py-2 text-xs font-medium text-slate-500 shadow-sm">
                              {formatTimeLabel(format(new Date(2026, 0, 1, Math.floor(minutes / 60), minutes % 60), 'HH:mm'))}
                            </td>
                            {selectedTimeGrid.map((cells, dayIndex) => {
                              const cell = cells[rowIndex];
                              return (
                                <td
                                  key={`${selectedTimeGridDays[dayIndex].dateKey}_${minutes}`}
                                  title={cell?.labels.join('\n') || ''}
                                  className={`h-[42px] min-w-[110px] rounded-xl px-2 py-1 text-center text-[11px] font-medium ${
                                    STATUS_STYLES[cell?.status || 'unavailable']
                                  }`}
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
                )
              ) : null}
            </Card>

      <Card className="border-slate-200 bg-white/95 p-4 shadow-sm">
              <SectionHeader
                title="Selected Day Details"
                subtitle="Use this panel to inspect exact intervals for one date."
                expanded={expandedSections.details}
                onToggle={() => toggleSection('details')}
              />

              {expandedSections.details ? (
                selectedDaySnapshot ? (
                  <>
                    <div className="mt-4 flex max-w-full gap-2 overflow-x-auto pb-1">
                      {scheduleDays.map((day) => (
                        <Button
                          key={day.dateKey}
                          type="button"
                          size="sm"
                          variant={selectedDaySnapshot.dateKey === day.dateKey ? 'default' : 'outline'}
                          onClick={() => setSelectedDayKey(day.dateKey)}
                        >
                          {format(day.date, 'EEE d')}
                        </Button>
                      ))}
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <Card className="border-slate-200 bg-white p-4 shadow-none">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{format(selectedDaySnapshot.date, 'EEEE')}</div>
                            <div className="text-xs text-slate-500">{format(selectedDaySnapshot.date, 'd MMM yyyy')}</div>
                          </div>
                          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                            {selectedDaySnapshot.openIntervals.length > 0 ? `${selectedDaySnapshot.openIntervals.length} open windows` : 'No open window'}
                          </Badge>
                        </div>

                        <div className="mt-4 grid gap-4">
                          <DayIntervals
                            title="Open To Book"
                            intervals={selectedDaySnapshot.openIntervals}
                            tone="bg-emerald-50 text-emerald-900"
                          />
                          <DayIntervals
                            title="Regular Classes"
                            intervals={selectedDaySnapshot.classIntervals}
                            tone="bg-sky-50 text-sky-900"
                          />
                        </div>
                      </Card>

                      <Card className="border-slate-200 bg-white p-4 shadow-none">
                        <div className="mt-4 grid gap-4">
                          <DayIntervals
                            title="Demos"
                            intervals={selectedDaySnapshot.demoIntervals}
                            tone="bg-amber-50 text-amber-900"
                          />
                          <DayIntervals
                            title="Manual Blocks"
                            intervals={selectedDaySnapshot.blockedIntervals}
                            tone="bg-rose-50 text-rose-900"
                          />
                        </div>
                      </Card>
                    </div>
                  </>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-muted-foreground">
                    No day data available in this range.
                  </div>
                )
              ) : null}
            </Card>

      <div className="pb-2" />
    </div>
  );
}
