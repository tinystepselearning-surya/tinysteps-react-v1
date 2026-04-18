import React from 'react';

type CalendarViewMode = 'day' | 'week' | 'month' | 'grid';
type CalendarLayoutMode = 'teacher' | 'grid';

interface TeacherOption {
  value: string;
  label: string;
}

interface CalendarHeaderProps {
  selectedTeacherId?: string;
  onTeacherChange?: (teacherId: string) => void;
  teacherOptions?: TeacherOption[];
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  layoutMode?: CalendarLayoutMode;
  onLayoutModeChange?: (mode: CalendarLayoutMode) => void;
  title?: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
}

const VIEW_OPTIONS: Array<{ value: CalendarViewMode; label: string }> = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'grid', label: 'Grid' },
];

const LAYOUT_OPTIONS: Array<{ value: CalendarLayoutMode; label: string }> = [
  { value: 'teacher', label: 'Teacher' },
  { value: 'grid', label: 'Grid' },
];

function SegmentedButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
        active
          ? 'border-slate-300 bg-slate-100 text-slate-900 shadow-sm'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800'
      }`}
    >
      {label}
    </button>
  );
}

export default function CalendarHeader({
  selectedTeacherId,
  onTeacherChange,
  teacherOptions = [],
  viewMode,
  onViewModeChange,
  layoutMode,
  onLayoutModeChange,
  title,
  subtitle,
  rightSlot,
}: CalendarHeaderProps): React.ReactElement {
  const showTeacherSelect = teacherOptions.length > 0;
  const showLayoutToggle = Boolean(layoutMode && onLayoutModeChange);
  const showTeacherEmptyState = Boolean(onTeacherChange) && !showTeacherSelect;
  const selectedTeacherLabel =
    teacherOptions.find((teacher) => teacher.value === selectedTeacherId)?.label || '';

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white/95 p-5 shadow-sm md:p-6">
      {title || subtitle ? (
        <div className="mb-5">
          {title ? <h2 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h2> : null}
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
          {selectedTeacherLabel ? (
            <div className="mt-2 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
              {selectedTeacherLabel}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          {showTeacherSelect ? (
            <div className="min-w-[220px]">
              <label className="mb-1 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                Teacher
              </label>
              <select
                value={selectedTeacherId ?? ''}
                onChange={(event) => onTeacherChange?.(event.target.value)}
                className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
              >
                <option value="">Select teacher</option>
                {teacherOptions.map((teacher) => (
                  <option key={teacher.value} value={teacher.value}>
                    {teacher.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {showTeacherEmptyState ? (
            <div className="min-w-[220px] rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              No teachers available.
            </div>
          ) : null}

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2">
            <div className="mb-1 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">View</div>
            <div className="flex flex-wrap gap-2">
              {VIEW_OPTIONS.map((option) => (
                <SegmentedButton
                  key={option.value}
                  active={viewMode === option.value}
                  label={option.label}
                  onClick={() => onViewModeChange(option.value)}
                />
              ))}
            </div>
          </div>

          {showLayoutToggle ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2">
              <div className="mb-1 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Layout</div>
              <div className="flex flex-wrap gap-2">
                {LAYOUT_OPTIONS.map((option) => (
                  <SegmentedButton
                    key={option.value}
                    active={layoutMode === option.value}
                    label={option.label}
                    onClick={() => onLayoutModeChange?.(option.value)}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {rightSlot ? <div className="xl:ml-4">{rightSlot}</div> : null}
      </div>
    </div>
  );
}
