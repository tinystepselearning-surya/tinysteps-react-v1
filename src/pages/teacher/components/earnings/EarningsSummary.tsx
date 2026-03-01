import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { Card } from '@components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { useEarnings } from '../../hooks/useEarnings';
import { useAuthStore } from '../../../../store/useAuthStore';
import { Input } from '@components/ui/input';

interface EarningsSummaryProps {
  teacherId?: string;
}

const monthKeyFromDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const EarningsSummary: FC<EarningsSummaryProps> = ({ teacherId }) => {
  const { user } = useAuthStore();
  const resolvedTeacherId = teacherId || user?.uid;
  const [selectedMonth, setSelectedMonth] = useState<string>(() => monthKeyFromDate(new Date()));
  const { data, isLoading, isError, error } = useEarnings(resolvedTeacherId, selectedMonth);
  const received = useMemo(() => {
    const total = Number(data?.totalEarnings || 0);
    const pending = Number(data?.pendingEarnings || 0);
    return Math.max(total - pending, 0);
  }, [data?.totalEarnings, data?.pendingEarnings]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Loading earnings...</p>
      </Card>
    );
  }

  if (!resolvedTeacherId) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">
          Unable to load earnings. Please refresh or contact support.
        </p>
      </Card>
    );
  }

  if (isError) {
    console.error('Error loading teacher earnings:', error);
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">
          Unable to load earnings. Please try again.
        </p>
      </Card>
    );
  }

  const isEmpty =
    !data ||
    (
      data.totalSessions === 0 &&
      data.sessionsCompleted === 0 &&
      data.totalEarnings === 0 &&
      data.pendingEarnings === 0 &&
      (data.breakdownByCourse?.length || 0) === 0 &&
      (data.payments?.length || 0) === 0
    );

  if (isEmpty) {
    return (
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Monthly Overview</h3>
            <p className="text-sm text-muted-foreground">No earnings yet for this month.</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Month</label>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-[150px]"
            />
          </div>
        </div>
        <div className="mt-3 text-2xl font-bold">₹0</div>
      </Card>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card className="p-6 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Monthly Overview</h3>
            <p className="text-sm text-muted-foreground">Month: {data.month || selectedMonth}</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Month</label>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-[150px]"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Sessions</p>
            <p className="text-2xl font-bold">{data.totalSessions}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold">{data.sessionsCompleted}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Rate / Session</p>
            <p className="text-2xl font-bold">₹{data.ratePerSession}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Earnings</p>
            <p className="text-2xl font-bold">₹{data.totalEarnings}</p>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>Pending Sessions</span>
          <span>{data.sessionsPending}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>Pending Earnings</span>
          <span>₹{data.pendingEarnings}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>Payments Received</span>
          <span>₹{received}</span>
        </div>
        <div className="flex items-center justify-between text-sm font-medium">
          <span>Balance Left</span>
          <span>₹{data.pendingEarnings}</span>
        </div>
      </Card>
      <Card className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Breakdown by Course</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data.breakdownByCourse || []).map((row) => (
                <TableRow key={row.courseName}>
                  <TableCell>{row.courseName}</TableCell>
                  <TableCell>{row.sessions}</TableCell>
                  <TableCell>₹{row.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div>
          <h3 className="text-lg font-semibold">Recent Payments</h3>
          {!(data.payments && data.payments.length) ? (
            <p className="text-sm text-muted-foreground">No payments recorded.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.payments?.slice(0, 3).map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.date}</TableCell>
                    <TableCell>₹{payment.amount}</TableCell>
                    <TableCell className="capitalize">{payment.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
};
