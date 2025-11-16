import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Input } from '../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { ParentSession } from '../../../../types/Parent';
import useAuthStore from '../../../../store/useAuthStore';
import { useUpcomingSessions } from '../../hooks/useUpcomingSessions';

const UpcomingSessionsView: React.FC = () => {
  const { user } = useAuthStore();
  const { data: sessions = [], isLoading } = useUpcomingSessions([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');

  // No demo data shipped in builds; rely on real data from hooks.
  const sessionsToUse = sessions;

  const groupedSessions = sessionsToUse.reduce((acc: Record<string, ParentSession[]>, session: ParentSession) => {
    const date = new Date(session.date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    let group = 'Later';
    if (date.toDateString() === today.toDateString()) {
      group = 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      group = 'Tomorrow';
    } else if (date <= nextWeek) {
      group = 'This Week';
    }

    if (!acc[group]) acc[group] = [];
    acc[group].push(session);
    return acc;
  }, {} as Record<string, ParentSession[]>);

  const filteredSessions = Object.entries(groupedSessions).reduce((acc, [group, groupSessions]) => {
    const filtered = groupSessions.filter(session => {
      const matchesSearch = session.kidName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           session.courseName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = filterDate === 'all' || group.toLowerCase().replace(' ', '') === filterDate;
      const matchesCourse = filterCourse === 'all' || session.courseName === filterCourse;
      return matchesSearch && matchesDate && matchesCourse;
    });
    if (filtered.length > 0) {
      acc[group] = filtered;
    }
    return acc;
  }, {} as Record<string, ParentSession[]>);

  if (isLoading) {
    return <div className="p-6">Loading sessions...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Upcoming Sessions</h1>
      </div>

      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search by child or course..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filterDate} onValueChange={setFilterDate}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dates</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="tomorrow">Tomorrow</SelectItem>
            <SelectItem value="thisweek">This Week</SelectItem>
            <SelectItem value="later">Later</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCourse} onValueChange={setFilterCourse}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            <SelectItem value="Phonics Level 2">Phonics Level 2</SelectItem>
            <SelectItem value="Grammar Basics">Grammar Basics</SelectItem>
            <SelectItem value="Speaking Practice">Speaking Practice</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-6">
        {Object.keys(filteredSessions).length === 0 && (
          <div className="p-6 text-sm text-gray-500">No upcoming sessions yet.</div>
        )}
        {Object.entries(filteredSessions).map(([group, groupSessions]: [string, ParentSession[]]) => (
          <Card key={group}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {group}
                <Badge variant="secondary">{groupSessions.length} sessions</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {groupSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-lg font-bold text-blue-600">
                        {session.kidName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{session.startTime} - {new Date(new Date(`2000-01-01T${session.startTime}`).getTime() + 30 * 60000).toTimeString().slice(0, 5)}</p>
                        <p className="text-sm text-gray-600">{session.kidName}</p>
                        <p className="text-sm text-gray-600">{session.courseName}</p>
                        <p className="text-sm text-gray-600">Teacher: {session.teacherName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {group === 'Today' && session.joinUrl && (
                        <Button variant="default" size="sm">
                          Join Zoom
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        Set Reminder
                      </Button>
                      <Button variant="outline" size="sm">
                        Reschedule
                      </Button>
                      <Button variant="outline" size="sm">
                        Contact Teacher
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UpcomingSessionsView;