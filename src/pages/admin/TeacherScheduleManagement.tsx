import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
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
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { useTeacherSessions } from '../teacher/hooks/useTeacherSessions';
import CalendarHeader from '../teacher/components/schedule/CalendarHeader';
import TeacherCalendarView from '../teacher/components/schedule/TeacherCalendarView';
import DayGridView from '../teacher/components/schedule/DayGridView';
import { db } from '../../lib/firebaseConfig';
import {
  formatTimeLabel,
  normalizeTeacherAvailabilityConfig,
  type TeacherAvailabilityConfig,
} from '../../lib/teacherAvailability';

type CalendarViewMode = 'day' | 'week' | 'workweek' | 'month';
type SimplifiedViewMode = 'day' | 'week' | 'month' | 'grid';
type LayoutMode = 'teacher' | 'grid';

type TeacherOption = {
  id: string;
  name: string;
  email: string;
};

function resolveTeacherName(data: Record<string, unknown>, fallbackId: string): string {
  const candidates = [data.displayName, data.fullName, data.name, data.firstName, data.email, fallbackId];
  const resolved = candidates.find((value) => typeof value === 'string' && value.trim().length > 0);
  return typeof resolved === 'string' ? resolved.trim() : fallbackId;
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

  if (view === 'workweek') {
    const startDate = startOfWeek(focusDate, { weekStartsOn: 1 });
    const endDate = addDays(startDate, 4);
    return {
      startDate,
      endDate,
      days: differenceInCalendarDays(endDate, startDate) + 1,
      title: `${format(startDate, 'd MMM')} - ${format(endDate, 'd MMM yyyy')}`,
      subtitle: 'Work week view',
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

function parseTimeToMinutes(value: unknown): number | null {
  const text = String(value || '').trim();
  const hhmm = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(text);
  if (hhmm) {
    const hours = Number(hhmm[1]);
    const minutes = Number(hhmm[2]);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) return hours * 60 + minutes;
  }

  const ampm = /^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/.exec(text);
  if (ampm) {
    let hours = Number(ampm[1]);
    const minutes = Number(ampm[2]);
    if (hours >= 1 && hours <= 12 && minutes >= 0 && minutes <= 59) {
      const suffix = ampm[3].toLowerCase();
      if (suffix === 'pm' && hours < 12) hours += 12;
      if (suffix === 'am' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    }
  }

  const asDate = new Date(text);
  if (!Number.isNaN(asDate.getTime())) return asDate.getHours() * 60 + asDate.getMinutes();
  return null;
}

function sessionDateKey(session: any): string {
  const dateText = String(session?.date || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return dateText;
  const startAt = session?.startAt?.toDate ? session.startAt.toDate() : (session?.startAt ? new Date(session.startAt) : null);
  if (startAt instanceof Date && !Number.isNaN(startAt.getTime())) {
    return format(startAt, 'yyyy-MM-dd');
  }
  const parsedDate = new Date(dateText);
  if (!Number.isNaN(parsedDate.getTime())) return format(parsedDate, 'yyyy-MM-dd');
  return '';
}

function sessionStartMinutes(session: any): number | null {
  const fromStartTime = parseTimeToMinutes(session?.startTime);
  if (fromStartTime !== null) return fromStartTime;
  const startAt = session?.startAt?.toDate ? session.startAt.toDate() : (session?.startAt ? new Date(session.startAt) : null);
  if (startAt instanceof Date && !Number.isNaN(startAt.getTime())) {
    return startAt.getHours() * 60 + startAt.getMinutes();
  }
  return null;
}

function sessionEndMinutes(session: any): number | null {
  const fromEndTime = parseTimeToMinutes(session?.endTime);
  if (fromEndTime !== null) return fromEndTime;
  const endAt = session?.endAt?.toDate ? session.endAt.toDate() : (session?.endAt ? new Date(session.endAt) : null);
  if (endAt instanceof Date && !Number.isNaN(endAt.getTime())) {
    return endAt.getHours() * 60 + endAt.getMinutes();
  }
  return null;
}

export default function TeacherScheduleManagement(): React.ReactElement {
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('teacher');
  const [simplifiedViewMode, setSimplifiedViewMode] = useState<SimplifiedViewMode>('week');
  const [calendarView, setCalendarView] = useState<CalendarViewMode>('week');
  const [focusDate, setFocusDate] = useState<Date>(startOfDay(new Date()));
  const [availabilityByTeacher, setAvailabilityByTeacher] = useState<Record<string, TeacherAvailabilityConfig>>({});

  const rangeMeta = useMemo(() => buildRangeMeta(calendarView, focusDate), [calendarView, focusDate]);
  const normalizedHeaderMode = useMemo<SimplifiedViewMode>(() => {
    if (layoutMode === 'grid') return 'grid';
    if (simplifiedViewMode === 'grid') return 'day';
    return simplifiedViewMode;
  }, [layoutMode, simplifiedViewMode]);
  const startDate = rangeMeta.startDate;
  const endDate = rangeMeta.endDate;
  const startDateKey = useMemo(() => format(startDate, 'yyyy-MM-dd'), [startDate]);
  const endDateKey = useMemo(() => format(endDate, 'yyyy-MM-dd'), [endDate]);

  useEffect(() => {
    const mappedView: CalendarViewMode =
      normalizedHeaderMode === 'week'
        ? 'week'
        : normalizedHeaderMode === 'month'
          ? 'month'
          : 'day';
    setCalendarView((current) => (current === mappedView ? current : mappedView));
  }, [normalizedHeaderMode]);

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

  const { sessions } = useTeacherSessions(
    selectedTeacherId || undefined,
    startDateKey,
    endDateKey,
  );
  const { sessions: allTeacherSessions } = useTeacherSessions(
    undefined,
    startDateKey,
    endDateKey,
    true,
  );

  const headerTeacherOptions = useMemo(
    () =>
      teachers.map((teacher) => ({
        value: teacher.id,
        label: teacher.email ? `${teacher.name} (${teacher.email})` : teacher.name,
      })),
    [teachers],
  );

  const selectedTeacher = useMemo(
    () => teachers.find((teacher) => teacher.id === selectedTeacherId) || null,
    [selectedTeacherId, teachers],
  );
  const selectedAvailability = availabilityByTeacher[selectedTeacherId] || null;

  const slotIntervalMinutes = selectedAvailability?.slotIntervalMinutes || 30;
  const workingDayStartMinutes = 4 * 60;
  const workingDayEndMinutes = 24 * 60;

  const dayViewSlotRows = useMemo(
    () => {
      const boundaries = new Set<number>([workingDayStartMinutes, workingDayEndMinutes]);

      sessions.forEach((session: any) => {
        const start = sessionStartMinutes(session);
        const end = sessionEndMinutes(session);
        if (start !== null && start >= workingDayStartMinutes && start < workingDayEndMinutes) {
          boundaries.add(start);
        }
        if (end !== null && end > workingDayStartMinutes && end <= workingDayEndMinutes) {
          boundaries.add(end);
        }
      });

      const sorted = Array.from(boundaries).sort((a, b) => a - b);
      const rows: Array<{ key: string; label: string; startMinutes?: number; endMinutes?: number }> = [];

      for (let index = 0; index < sorted.length - 1; index += 1) {
        const start = sorted[index];
        const end = sorted[index + 1];
        if (end <= start) continue;
        rows.push({
          key: `slot_${start}`,
          label: formatTimeLabel(
            format(new Date(2026, 0, 1, Math.floor(start / 60), start % 60), 'HH:mm'),
          ),
          startMinutes: start,
          endMinutes: end,
        });
      }

      if (rows.length > 0) return rows;
      return [
        {
          key: `slot_${workingDayStartMinutes}`,
          label: formatTimeLabel(
            format(new Date(2026, 0, 1, Math.floor(workingDayStartMinutes / 60), workingDayStartMinutes % 60), 'HH:mm'),
          ),
          startMinutes: workingDayStartMinutes,
          endMinutes: workingDayEndMinutes,
        },
      ];
    },
    [sessions, workingDayEndMinutes, workingDayStartMinutes],
  );

  const gridSessions = useMemo(
    () => (allTeacherSessions.length > 0 ? allTeacherSessions : sessions),
    [allTeacherSessions, sessions],
  );

  const gridTimeSlots = useMemo(() => {
    const map = new Map<string, { key: string; label: string; startMinutes?: number; endMinutes?: number }>();
    dayViewSlotRows.forEach((slot) => map.set(slot.key, slot));

    const focusDateKey = format(focusDate, 'yyyy-MM-dd');
    gridSessions
      .filter((session: any) => sessionDateKey(session) === focusDateKey)
      .forEach((session: any) => {
        const minutes = sessionStartMinutes(session);
        if (minutes === null) return;
        const key = `slot_${minutes}`;
        if (map.has(key)) return;
        map.set(key, {
          key,
          label: formatTimeLabel(format(new Date(2026, 0, 1, Math.floor(minutes / 60), minutes % 60), 'HH:mm')),
          startMinutes: minutes,
          endMinutes: minutes + slotIntervalMinutes,
        });
      });

    return Array.from(map.values()).sort(
      (a, b) => (a.startMinutes ?? Number.MAX_SAFE_INTEGER) - (b.startMinutes ?? Number.MAX_SAFE_INTEGER),
    );
  }, [dayViewSlotRows, focusDate, gridSessions, slotIntervalMinutes]);

  const gridTeachers = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    teachers.forEach((teacher) => {
      map.set(teacher.id, { id: teacher.id, name: teacher.name });
    });

    gridSessions.forEach((session: any) => {
      const teacherId = String(session?.teacherId || session?.assignedTeacherId || '').trim();
      if (!teacherId || map.has(teacherId)) return;
      const fallbackName =
        String(session?.teacherName || session?.teacherDisplayName || session?.teacherEmail || '').trim() ||
        teacherId;
      map.set(teacherId, { id: teacherId, name: fallbackName });
    });

    return Array.from(map.values());
  }, [gridSessions, teachers]);

  const shouldRenderDayGridView = layoutMode === 'grid' || simplifiedViewMode === 'grid';
  const teacherViewMode: 'day' | 'week' | 'month' =
    normalizedHeaderMode === 'month'
      ? 'month'
      : normalizedHeaderMode === 'week'
        ? 'week'
        : 'day';
  const selectedTeacherLabel = selectedTeacher?.name || 'No teacher selected';
  const headerTitle = shouldRenderDayGridView ? 'Scheduling Console' : 'Teacher Scheduling Console';
  const headerSubtitle = shouldRenderDayGridView
    ? 'Compare all teachers by time slot for the selected day.'
    : 'Pick one teacher to review schedule load across day, week, or month.';
  const headerDateLabel = rangeMeta.title;
  const contentTitle = shouldRenderDayGridView ? 'Day Grid' : selectedTeacherLabel;
  const contentSubtitle = shouldRenderDayGridView
    ? 'Use this matrix to spot open slots and overlaps quickly.'
    : 'Booked and available slots are shown in an agenda-style view.';

  const handleHeaderViewModeChange = (mode: SimplifiedViewMode) => {
    if (mode === 'grid') {
      setLayoutMode('grid');
      setSimplifiedViewMode('grid');
      return;
    }
    setLayoutMode('teacher');
    setSimplifiedViewMode(mode);
  };

  const handleHeaderLayoutModeChange = (mode: LayoutMode) => {
    if (mode === 'grid') {
      setLayoutMode('grid');
      setSimplifiedViewMode('grid');
      return;
    }
    setLayoutMode('teacher');
    setSimplifiedViewMode((current) => (current === 'grid' ? 'day' : current));
  };

  const handlePrev = () => {
    if (calendarView === 'day') setFocusDate((current) => addDays(current, -1));
    else if (calendarView === 'week' || calendarView === 'workweek') setFocusDate((current) => subWeeks(current, 1));
    else setFocusDate((current) => subMonths(current, 1));
  };

  const handleNext = () => {
    if (calendarView === 'day') setFocusDate((current) => addDays(current, 1));
    else if (calendarView === 'week' || calendarView === 'workweek') setFocusDate((current) => addWeeks(current, 1));
    else setFocusDate((current) => addMonths(current, 1));
  };

  const handleToday = () => setFocusDate(startOfDay(new Date()));
  const dateInputValue = format(focusDate, 'yyyy-MM-dd');
  const handleDateFilterChange = (value: string) => {
    if (!value) return;
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return;
    setFocusDate(startOfDay(parsed));
  };

  if (teachers.length === 0) {
    return (
      <Card className="border-slate-200 bg-white/95 p-6 shadow-sm">
        <div className="text-sm text-muted-foreground">No teacher profiles are available yet.</div>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <CalendarHeader
        selectedTeacherId={selectedTeacherId}
        onTeacherChange={setSelectedTeacherId}
        teacherOptions={headerTeacherOptions}
        viewMode={normalizedHeaderMode}
        onViewModeChange={handleHeaderViewModeChange}
        layoutMode={layoutMode}
        onLayoutModeChange={handleHeaderLayoutModeChange}
        title={headerTitle}
        subtitle={headerSubtitle}
        rightSlot={(
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              {headerDateLabel}
            </div>
            <input
              type="date"
              value={dateInputValue}
              onChange={(event) => handleDateFilterChange(event.target.value)}
              className="h-9 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
              aria-label="Filter by date"
            />
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
        )}
      />

      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-3.5 py-3 shadow-sm">
          <div>
            <div className="text-base font-semibold text-slate-900">{contentTitle}</div>
            <div className="mt-1 text-xs text-slate-500">{contentSubtitle}</div>
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
            {shouldRenderDayGridView
              ? `${gridSessions.length} sessions in range`
              : `${sessions.length} sessions in range`}
          </div>
        </div>
        {shouldRenderDayGridView ? (
          <DayGridView
            teachers={gridTeachers}
            sessions={gridSessions}
            selectedDate={focusDate}
            timeSlots={gridTimeSlots}
          />
        ) : (
          <TeacherCalendarView
            viewMode={teacherViewMode}
            selectedDate={focusDate}
            selectedTeacherId={selectedTeacherId}
            sessions={sessions}
            slotRows={dayViewSlotRows}
            emptyLabel="No slots available for this day."
          />
        )}
      </div>
    </div>
  );
}
