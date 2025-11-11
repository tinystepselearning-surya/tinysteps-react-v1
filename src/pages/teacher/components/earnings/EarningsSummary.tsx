import React from 'react';
import { Card } from '@components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { useEarnings } from '../../hooks/useEarnings';

interface EarningsSummaryProps {
  teacherId?: string;
}

export const EarningsSummary: React.FC<EarningsSummaryProps> = ({ teacherId }) => {
  const { data, isLoading } = useEarnings(teacherId);

  if (isLoading || !data) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Loading earnings...</p>
      </Card>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card className="p-6 space-y-2">
        <h3 className="text-lg font-semibold">Monthly Overview</h3>
        <p className="text-sm text-muted-foreground">Month: {data.month || '—'}</p>
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
