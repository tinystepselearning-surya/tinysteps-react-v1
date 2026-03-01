import React from 'react';
import { Card, CardContent } from '@components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Badge } from '@components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { masteryLabel } from '../lib/mastery';

const SessionTracking: React.FC = () => {
  const [selectedChild, setSelectedChild] = React.useState('');

  // No sample child data is shipped. The UI shows actual children via data hooks in real use.
  const children: { id: string; name: string }[] = [];

  const sessions: { id: number; childId: string; date: string; time: string; course: string; teacher?: string; attendance?: string; mastery?: number | string; feedback?: string; notes?: string }[] = [];

  const filteredSessions = selectedChild ? sessions.filter(s => s.childId === selectedChild) : sessions;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Session Tracking & Attendance</h1>

      {/* Child Selector */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <Select
            value={selectedChild || 'all'}
            onValueChange={(value) => setSelectedChild(value === 'all' ? '' : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Child" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {children.map(child => (
                <SelectItem key={child.id} value={child.id}>{child.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card>
        <CardContent>
          {filteredSessions.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No sessions found. Connect your account to view sessions.</div>
          ) : (
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Mastery</TableHead>
                <TableHead>Feedback</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>{session.date} {session.time}</TableCell>
                  <TableCell>{session.course}</TableCell>
                  <TableCell>{session.teacher}</TableCell>
                  <TableCell>
                    <Badge variant={session.attendance === 'Present' ? 'default' : session.attendance === 'Absent' ? 'destructive' : 'secondary'}>
                      {session.attendance}
                    </Badge>
                  </TableCell>
                  <TableCell>{masteryLabel(session.mastery)}</TableCell>
                  <TableCell>{session.feedback}</TableCell>
                  <TableCell>{session.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionTracking;
