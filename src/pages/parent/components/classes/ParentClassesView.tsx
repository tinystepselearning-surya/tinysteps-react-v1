import type { ReactNode } from "react";
import {
  BookOpen,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Video,
} from "lucide-react";

import { cn } from "@/components/lib/utils";
import {
  getParentClassStatusLabel,
  getParentClassStatusTone,
  shouldShowClassJoinAction,
  type ParentClassesFilterId,
  type ParentClassesResourceId,
  type ParentClassesViewId,
  type ParentClassSessionDisplay,
} from "./parentClassPresentation";

type FilterDefinition = {
  id: ParentClassesFilterId;
  label: string;
  count: number | null;
  scopeText: string;
  emptyText: string;
};

type ResourceDefinition = {
  id: ParentClassesResourceId;
  label: string;
  description: string;
  count?: number | null;
  disabled?: boolean;
  disabledReason?: string;
};

type ParentClassesViewProps = {
  activeView: ParentClassesViewId;
  filters: FilterDefinition[];
  activeRows: ParentClassSessionDisplay[];
  nextClass: ParentClassSessionDisplay | null;
  resources: ResourceDefinition[];
  joiningSessionId: string | null;
  isSessionsLoading: boolean;
  sessionsError: string | null;
  onSelectFilter: (filter: ParentClassesFilterId) => void;
  onSelectResource: (resource: ParentClassesResourceId) => void;
  onJoinSession: (row: ParentClassSessionDisplay) => void;
  resourceContent?: ReactNode;
};

const FILTER_ICONS = {
  today: CalendarCheck,
  upcoming: CalendarClock,
  completed: CheckCircle2,
  past_pending: Clock3,
  rescheduled: CalendarClock,
} satisfies Record<ParentClassesFilterId, typeof CalendarCheck>;

const RESOURCE_ICONS = {
  calendar: CalendarDays,
  worksheets: BookOpen,
  recordings: Video,
} satisfies Record<ParentClassesResourceId, typeof CalendarDays>;

function ParentClassesSkeleton() {
  return (
    <div role="status" aria-label="Loading classes" className="space-y-3">
      <span className="sr-only">Loading classes…</span>
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="h-3 w-24 rounded bg-slate-200" />
        <div className="mt-3 h-5 w-40 rounded bg-slate-200" />
        <div className="mt-2 h-3 w-56 max-w-full rounded bg-slate-100" />
        <div className="mt-4 h-11 w-full rounded-xl bg-slate-200 sm:w-32" />
      </div>
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="flex min-h-[92px] items-center gap-3 border-b border-slate-200 bg-white px-4 py-3"
          data-testid="parent-class-skeleton-row"
        >
          <div className="h-10 w-16 rounded bg-slate-200" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-2/5 rounded bg-slate-200" />
            <div className="h-3 w-3/5 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

type JoinButtonProps = {
  row: ParentClassSessionDisplay;
  joining: boolean;
  onJoin: (row: ParentClassSessionDisplay) => void;
  compact?: boolean;
};

function JoinButton({ row, joining, onJoin, compact = false }: JoinButtonProps) {
  const reasonId = `class-join-reason-${row.id}`;
  const showAction = shouldShowClassJoinAction(row.status);
  if (!showAction) return null;

  return (
    <div className={cn("shrink-0", compact ? "w-auto" : "w-full sm:w-auto")}>
      <button
        type="button"
        onClick={() => onJoin(row)}
        disabled={!row.canJoin || joining}
        aria-label={`${joining ? "Opening" : "Join"} ${row.courseName} class`}
        aria-describedby={!row.canJoin ? reasonId : undefined}
        className={cn(
          "flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold outline-none transition active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-slate-600 focus-visible:ring-offset-2",
          compact ? "w-auto" : "w-full sm:w-auto",
          row.canJoin && !joining
            ? "bg-slate-900 text-white hover:bg-slate-800"
            : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-500",
        )}
      >
        {joining ? "Opening…" : "Join Class"}
        <ExternalLink className="ml-1.5 h-4 w-4" aria-hidden="true" />
      </button>
      {!row.canJoin ? (
        <p id={reasonId} className="mt-1 text-xs text-slate-500">
          {row.joinDisabledReason}
        </p>
      ) : null}
    </div>
  );
}

type ParentNextClassCardProps = {
  row: ParentClassSessionDisplay | null;
  joiningSessionId: string | null;
  onJoin: (row: ParentClassSessionDisplay) => void;
};

function ParentNextClassCard({
  row,
  joiningSessionId,
  onJoin,
}: ParentNextClassCardProps) {
  return (
    <section
      aria-labelledby="parent-next-class-title"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      data-testid="parent-next-class"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Up next</p>
      <h2 id="parent-next-class-title" className="mt-1 text-lg font-semibold text-slate-950">
        {row ? (row.isToday ? "Today’s class" : "Next class") : "No upcoming class"}
      </h2>
      {!row ? (
        <p className="mt-2 text-sm leading-5 text-slate-600">
          New class details will appear here when they are scheduled.
        </p>
      ) : (
        <div className="mt-3 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-600">
              <time dateTime={row.dateTime}>{row.isToday ? "Today" : row.dateLabel}</time>
            </p>
            <p className="mt-0.5 text-2xl font-semibold tracking-tight text-slate-950">
              {row.timeLabel}
            </p>
            <p className="mt-2 break-words text-sm font-semibold text-slate-900">
              {row.courseName}
            </p>
            <p className="mt-0.5 break-words text-sm text-slate-600">
              {row.teacherName ? `Teacher: ${row.teacherName}` : "Teacher details will appear when assigned."}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
                  getParentClassStatusTone(row.status),
                )}
              >
                {getParentClassStatusLabel(row.status)}
              </span>
              {row.childName ? <span className="text-xs text-slate-500">{row.childName}</span> : null}
            </div>
            {row.indiaTimeLabel ? (
              <p className="mt-2 text-xs leading-4 text-slate-500">
                {row.indiaTimeLabel}
              </p>
            ) : null}
          </div>
          <JoinButton
            row={row}
            joining={joiningSessionId === row.id}
            onJoin={onJoin}
          />
        </div>
      )}
    </section>
  );
}

type ParentSessionRowProps = {
  row: ParentClassSessionDisplay;
  joining: boolean;
  onJoin: (row: ParentClassSessionDisplay) => void;
};

function ParentSessionRow({ row, joining, onJoin }: ParentSessionRowProps) {
  const isHistorical =
    row.status === "completed" || row.status === "cancelled" || row.status === "no_show";

  return (
    <article
      className={cn(
        "grid min-w-0 gap-3 border-b border-slate-200 px-4 py-3.5 last:border-b-0 md:grid-cols-[150px,130px,minmax(0,1fr),auto] md:items-center",
        isHistorical ? "bg-slate-50/60" : "bg-white",
      )}
      data-session-id={row.id}
      aria-label={`${row.dateLabel}, ${row.timeLabel}, ${row.courseName}, ${getParentClassStatusLabel(row.status)}`}
    >
      <div className="min-w-0">
        <time className="text-sm font-semibold text-slate-950" dateTime={row.dateTime}>
          {row.dateLabel}
        </time>
        {row.indiaTimeLabel ? (
          <p className="mt-1 text-[11px] leading-4 text-slate-500">{row.indiaTimeLabel}</p>
        ) : null}
      </div>
      <p className="text-base font-semibold text-slate-950">{row.timeLabel}</p>
      <div className="min-w-0">
        <p className="break-words text-sm font-semibold text-slate-900">{row.courseName}</p>
        <p className="mt-0.5 break-words text-xs text-slate-600">
          {row.teacherName ? `Teacher: ${row.teacherName}` : "Teacher not assigned"}
          {row.childName ? ` · ${row.childName}` : ""}
        </p>
        <span
          className={cn(
            "mt-2 inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
            getParentClassStatusTone(row.status),
          )}
        >
          {getParentClassStatusLabel(row.status)}
        </span>
      </div>
      <JoinButton
        row={row}
        joining={joining}
        onJoin={onJoin}
        compact
      />
    </article>
  );
}

type ParentSessionListProps = {
  title: string;
  scopeText: string;
  emptyText: string;
  rows: ParentClassSessionDisplay[];
  joiningSessionId: string | null;
  onJoin: (row: ParentClassSessionDisplay) => void;
};

function ParentSessionList({
  title,
  scopeText,
  emptyText,
  rows,
  joiningSessionId,
  onJoin,
}: ParentSessionListProps) {
  return (
    <section aria-labelledby="parent-session-list-title" className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <h2 id="parent-session-list-title" className="text-sm font-semibold text-slate-950">
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">{scopeText}</p>
        </div>
        <span className="shrink-0 text-xs font-medium text-slate-500">
          {rows.length} {rows.length === 1 ? "class" : "classes"}
        </span>
      </div>
      {rows.length === 0 ? (
        <div role="status" className="px-4 py-7 text-sm text-slate-600">
          {emptyText}
        </div>
      ) : (
        <div className="md:max-h-[62vh] md:overflow-y-auto md:[scrollbar-gutter:stable]">
          {rows.map((row) => (
            <ParentSessionRow
              key={row.id}
              row={row}
              joining={joiningSessionId === row.id}
              onJoin={onJoin}
            />
          ))}
        </div>
      )}
    </section>
  );
}

type ParentClassResourcesProps = {
  resources: ResourceDefinition[];
  activeView: ParentClassesViewId;
  onSelect: (resource: ParentClassesResourceId) => void;
};

function ParentClassResources({
  resources,
  activeView,
  onSelect,
}: ParentClassResourcesProps) {
  return (
    <section aria-labelledby="parent-class-resources-title">
      <h2 id="parent-class-resources-title" className="mb-2 text-sm font-semibold text-slate-950">
        Class resources
      </h2>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {resources.map((resource) => {
          const Icon = RESOURCE_ICONS[resource.id];
          const isActive = activeView === resource.id;
          const reasonId = `class-resource-reason-${resource.id}`;
          return (
            <button
              key={resource.id}
              type="button"
              onClick={() => onSelect(resource.id)}
              disabled={resource.disabled}
              aria-current={isActive ? "page" : undefined}
              aria-describedby={resource.disabledReason ? reasonId : undefined}
              className="flex min-h-14 w-full min-w-0 items-center gap-3 border-b border-slate-200 px-4 py-3 text-left outline-none transition last:border-b-0 hover:bg-slate-50 active:bg-slate-100 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-900">{resource.label}</span>
                <span
                  id={resource.disabledReason ? reasonId : undefined}
                  className="mt-0.5 block truncate text-xs text-slate-500"
                >
                  {resource.disabledReason || resource.description}
                </span>
              </span>
              {typeof resource.count === "number" ? (
                <span className="shrink-0 text-xs font-semibold text-slate-600">
                  {resource.count}
                </span>
              ) : null}
              <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function ParentClassesView({
  activeView,
  filters,
  activeRows,
  nextClass,
  resources,
  joiningSessionId,
  isSessionsLoading,
  sessionsError,
  onSelectFilter,
  onSelectResource,
  onJoinSession,
  resourceContent,
}: ParentClassesViewProps) {
  const activeFilter = filters.find((filter) => filter.id === activeView) || null;
  const isResourceView = activeView === "calendar" || activeView === "worksheets";

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden" data-testid="parent-classes-view">
      {isSessionsLoading ? (
        <ParentClassesSkeleton />
      ) : (
        <ParentNextClassCard
          row={nextClass}
          joiningSessionId={joiningSessionId}
          onJoin={onJoinSession}
        />
      )}

      <nav aria-label="Class session filters">
        <div
          role="tablist"
          className="scrollbar-hide flex max-w-full snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]"
          data-testid="parent-class-filter-scroll"
        >
          {filters.map((filter) => {
            const Icon = FILTER_ICONS[filter.id];
            const selected = activeView === filter.id;
            const countLabel = filter.count === null ? "loading" : String(filter.count);
            return (
              <button
                key={filter.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="parent-classes-active-content"
                aria-label={`${filter.label}, ${countLabel}`}
                onClick={() => onSelectFilter(filter.id)}
                className={cn(
                  "inline-flex min-h-11 shrink-0 snap-start items-center gap-1.5 rounded-full border px-3 text-sm font-semibold outline-none transition active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-slate-600",
                  selected
                    ? "border-slate-300 bg-slate-200 text-slate-950"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {filter.label}
                <span aria-hidden="true" className="text-xs">
                  {filter.count === null ? "…" : filter.count}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {sessionsError ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800">
          {sessionsError}
        </div>
      ) : null}

      <div id="parent-classes-active-content" role="tabpanel">
        {!sessionsError && !isSessionsLoading && activeFilter ? (
          <ParentSessionList
            title={activeFilter.label}
            scopeText={activeFilter.scopeText}
            emptyText={activeFilter.emptyText}
            rows={activeRows}
            joiningSessionId={joiningSessionId}
            onJoin={onJoinSession}
          />
        ) : null}
      </div>

      {isResourceView ? null : (
        <ParentClassResources resources={resources} activeView={activeView} onSelect={onSelectResource} />
      )}

      {isResourceView ? (
        <>
          <ParentClassResources resources={resources} activeView={activeView} onSelect={onSelectResource} />
          {resourceContent}
        </>
      ) : null}
    </div>
  );
}
