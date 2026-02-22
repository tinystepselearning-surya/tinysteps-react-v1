import React, { useMemo, useState } from 'react';
import { Card } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { useTeacherStudents } from '../../hooks/useTeacherStudents';
import { TeacherStudent } from '../../../../types/Teacher';
import { Link } from 'react-router-dom';

interface StudentsListProps {
  teacherId?: string;
}

const filterByStatus = (students: TeacherStudent[], status: string) => {
  if (status === 'all') return students;
  return students.filter((student) => student.progressStatus === status);
};

export const StudentsList: React.FC<StudentsListProps> = ({ teacherId }) => {
  const { data: students = [], isLoading } = useTeacherStudents(teacherId);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const filtered = useMemo(() => {
    const byStatus = filterByStatus(students, status);
    if (!search) return byStatus;
    return byStatus.filter((student) =>
      student.fullName.toLowerCase().includes(search.toLowerCase())
    );
  }, [students, search, status]);

  return (
    <Card className="p-6 space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <Input placeholder="Search students" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="md:w-40">
            <SelectValue placeholder="Progress" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="on_track">On Track</SelectItem>
            <SelectItem value="needs_attention">Needs Attention</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading students...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No students found.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((student) => (
            <Card key={student.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{student.fullName}</h3>
                  <p className="text-sm text-muted-foreground">Grade {student.grade || 'N/A'}</p>
                </div>
                <Badge variant={student.progressStatus === 'needs_attention' ? 'destructive' : 'secondary'}>
                  {student.progressStatus === 'needs_attention' ? 'Needs Attention' : 'On Track'}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p>Courses: {(student.courseNames || []).join(', ') || '—'}</p>
                  {student.enrollmentStatus === 'pending_payment' && (
                    <Badge variant="outline" className="text-xs">
                      Pending payment
                    </Badge>
                  )}
                </div>
                <p>
                  Parent: {student.parentName || student.parentEmail || '—'}
                </p>
                <p>Last session: {student.lastSessionDate || '—'}</p>
              </div>
              <div className="pt-2">
                {student.id ? (
                  <Link
                    to={`/teacher/students/${student.id}/topic-progress`}
                    className="text-xs font-medium text-primary-600 hover:text-primary-700"
                  >
                    Update Progress
                  </Link>
                ) : (
                  <span className="text-xs text-muted-foreground cursor-not-allowed">
                    Update Progress (missing ID)
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
};
