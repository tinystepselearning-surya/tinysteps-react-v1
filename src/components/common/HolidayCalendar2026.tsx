import { CalendarDays, Info } from 'lucide-react';
import { Badge } from '@components/ui/badge';
import { Card } from '@components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui/table';
import { cn } from '@components/lib/utils';

type HolidayStatus = 'regular' | 'optional';

type HolidayItem = {
  dateIso: string;
  name: string;
  status: HolidayStatus;
};

export const HOLIDAY_CALENDAR_2026: HolidayItem[] = [
  { dateIso: '2026-01-01', name: "New Year's Day", status: 'optional' },
  { dateIso: '2026-01-13', name: 'Lohri', status: 'optional' },
  { dateIso: '2026-01-14', name: 'Makar Sankranti / Pongal', status: 'regular' },
  { dateIso: '2026-01-15', name: 'Magh Bihu / Bhogali Bihu', status: 'optional' },
  { dateIso: '2026-01-26', name: 'Republic Day', status: 'regular' },
  { dateIso: '2026-03-04', name: 'Holi', status: 'regular' },
  { dateIso: '2026-03-19', name: 'Ugadi / Gudi Padwa', status: 'optional' },
  { dateIso: '2026-03-21', name: 'Id-ul-Fitr / Ramzan Eid', status: 'regular' },
  { dateIso: '2026-03-26', name: 'Ram Navami', status: 'optional' },
  { dateIso: '2026-04-03', name: 'Good Friday', status: 'regular' },
  { dateIso: '2026-04-14', name: 'Vaisakhi / Tamil New Year', status: 'regular' },
  { dateIso: '2026-04-15', name: 'Bohag Bihu', status: 'optional' },
  { dateIso: '2026-05-27', name: 'Id-ul-Zuha / Bakrid', status: 'regular' },
  { dateIso: '2026-06-26', name: 'Muharram / Ashura', status: 'regular' },
  { dateIso: '2026-07-16', name: 'Rath Yatra', status: 'regular' },
  { dateIso: '2026-08-15', name: 'Independence Day', status: 'regular' },
  { dateIso: '2026-08-26', name: 'Onam', status: 'regular' },
  { dateIso: '2026-08-28', name: 'Raksha Bandhan', status: 'optional' },
  { dateIso: '2026-09-04', name: 'Janmashtami', status: 'regular' },
  { dateIso: '2026-09-14', name: 'Ganesh Chaturthi', status: 'regular' },
  { dateIso: '2026-10-19', name: 'Maha Ashtami / Durga Puja', status: 'regular' },
  { dateIso: '2026-10-20', name: 'Dussehra / Vijayadashami', status: 'regular' },
  { dateIso: '2026-11-08', name: 'Diwali / Deepavali', status: 'regular' },
  { dateIso: '2026-11-15', name: 'Chhath Puja', status: 'optional' },
  { dateIso: '2026-12-25', name: 'Christmas', status: 'regular' },
];

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const dayFormatter = new Intl.DateTimeFormat('en-IN', { weekday: 'long' });
const monthFormatter = new Intl.DateTimeFormat('en-IN', { month: 'short' });

const toLocalDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const statusBadgeClass: Record<HolidayStatus, string> = {
  regular: 'border-emerald-200 bg-emerald-100/80 text-emerald-800',
  optional: 'border-amber-200 bg-amber-100/80 text-amber-800',
};

export type HolidayCalendar2026Props = {
  className?: string;
  title?: string;
  subtitle?: string;
};

export default function HolidayCalendar2026({
  className,
  title = '2026 Holiday Calendar',
  subtitle = 'All holidays are visible. Up to two per month are marked as regular; extra significant days are optional.',
}: HolidayCalendar2026Props) {
  const regularCount = HOLIDAY_CALENDAR_2026.filter(
    (holiday) => holiday.status === 'regular',
  ).length;
  const optionalCount = HOLIDAY_CALENDAR_2026.length - regularCount;

  return (
    <Card
      className={cn(
        'overflow-hidden border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
    >
      <div className="border-b border-slate-200/80 bg-gradient-to-r from-amber-50 via-emerald-50 to-sky-50 px-5 py-4 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <CalendarDays className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg font-semibold">{title}</h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">{subtitle}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
              <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Total
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {HOLIDAY_CALENDAR_2026.length}
              </div>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 dark:border-emerald-900/60 dark:bg-emerald-900/20">
              <div className="text-[11px] uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                Regular
              </div>
              <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                {regularCount}
              </div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 dark:border-amber-900/60 dark:bg-amber-900/20">
              <div className="text-[11px] uppercase tracking-wide text-amber-700 dark:text-amber-300">
                Optional
              </div>
              <div className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                {optionalCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4 md:p-5">
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          <Table className="min-w-[760px]">
            <TableHeader className="bg-slate-50/90 dark:bg-slate-800/70">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-3 py-3 text-xs uppercase tracking-wide">Date</TableHead>
                <TableHead className="px-3 py-3 text-xs uppercase tracking-wide">Day</TableHead>
                <TableHead className="px-3 py-3 text-xs uppercase tracking-wide">Month</TableHead>
                <TableHead className="px-3 py-3 text-xs uppercase tracking-wide">Holiday</TableHead>
                <TableHead className="px-3 py-3 text-xs uppercase tracking-wide">Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {HOLIDAY_CALENDAR_2026.map((holiday) => {
                const asDate = toLocalDate(holiday.dateIso);
                return (
                  <TableRow
                    key={`${holiday.dateIso}-${holiday.name}`}
                    className={cn(
                      holiday.status === 'regular'
                        ? 'bg-emerald-50/35 dark:bg-emerald-950/10'
                        : 'bg-amber-50/35 dark:bg-amber-950/10',
                    )}
                  >
                    <TableCell className="px-3 py-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {dateFormatter.format(asDate)}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm text-slate-700 dark:text-slate-300">
                      {dayFormatter.format(asDate)}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400">
                      {monthFormatter.format(asDate)}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm text-slate-800 dark:text-slate-200">
                      {holiday.name}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm">
                      <Badge
                        variant="outline"
                        className={cn(
                          'font-semibold capitalize',
                          statusBadgeClass[holiday.status],
                        )}
                      >
                        {holiday.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800 dark:border-sky-900/50 dark:bg-sky-950/25 dark:text-sky-200">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Islamic festival dates may shift by moon sighting in some regions.</p>
        </div>
      </div>
    </Card>
  );
}
