import type { FC } from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';

interface TeachersListProps {
  lpId?: string;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  subjects: string[];
  totalStudents: number;
  sessionsThisMonth: number;
  averageRating: number;
  status: 'active' | 'inactive';
}

export const TeachersList: FC<TeachersListProps> = ({ lpId }) => {
  // Mock data - in real implementation, fetch from Firestore
  const teachers: Teacher[] = [
    {
      id: '1',
      name: 'Ms. Anjali Verma',
      email: 'anjali@example.com',
      phone: '+91 98765 43212',
      subjects: ['Phonics', 'Grammar'],
      totalStudents: 15,
      sessionsThisMonth: 45,
      averageRating: 4.8,
      status: 'active',
    },
    {
      id: '2',
      name: 'Mr. Ramesh Singh',
      email: 'ramesh@example.com',
      phone: '+91 98765 43213',
      subjects: ['Speaking', 'Grammar'],
      totalStudents: 12,
      sessionsThisMonth: 38,
      averageRating: 4.6,
      status: 'active',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Assigned Teachers</h2>
        <Button>Add Teacher</Button>
      </div>

      <div className="grid gap-4">
        {teachers.map((teacher) => (
          <Card key={teacher.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">{teacher.name}</h3>
                  <Badge variant={teacher.status === 'active' ? 'default' : 'secondary'}>
                    {teacher.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{teacher.email}</p>
                <p className="text-muted-foreground">{teacher.phone}</p>
                <div className="flex gap-4 text-sm">
                  <span>Subjects: {teacher.subjects.join(', ')}</span>
                  <span>{teacher.totalStudents} students</span>
                </div>
                <div className="flex gap-4 text-sm">
                  <span>{teacher.sessionsThisMonth} sessions this month</span>
                  <span>⭐ {teacher.averageRating}/5</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  View Details
                </Button>
                <Button variant="outline" size="sm">
                  Schedule
                </Button>
                <Button variant="outline" size="sm">
                  Contact
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TeachersList;