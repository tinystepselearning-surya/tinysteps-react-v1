import React from 'react';
import { useCourse, useTopics, useCourseEnrollments } from '../../../hooks/useData';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import { Badge } from '@components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { ArrowLeft, Edit, AlertTriangle } from 'lucide-react';

/* -------------------- helpers -------------------- */

const sessionsPerMonth = (freq?: string) => {
  switch (freq) {
    case 'weekly':
      return 4;
    case 'biweekly':
      return 2;
    case 'monthly':
      return 1;
    default:
      return 4;
  }
};

/* -------------------- types -------------------- */

interface CourseDetailViewProps {
  courseId: string;
  onBack: () => void;
  onEdit: (courseId: string) => void; // ✅ changed
}

/* -------------------- component -------------------- */

export const CourseDetailView: React.FC<CourseDetailViewProps> = ({
  courseId,
  onBack,
  onEdit,
}) => {
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: topics = [], isLoading: topicsLoading } = useTopics(courseId);
  const { data: enrollments = [], isLoading: enrollmentsLoading } =
    useCourseEnrollments(courseId);

  if (courseLoading) {
    return <div className="p-8 text-center">Loading course details…</div>;
  }

  if (!course) {
    return <div className="p-8 text-center">Course not found</div>;
  }

  /* -------------------- derived metrics -------------------- */

  const activeEnrollments = enrollments.filter((e: any) => e.status === 'active');
  const completedEnrollments = enrollments.filter((e: any) => e.status === 'completed');

  const completionRate =
    enrollments.length > 0
      ? Math.round((completedEnrollments.length / enrollments.length) * 100)
      : 0;

  const expectedMonthlySessions = sessionsPerMonth(course.sessionFrequency);

  const hasTopicIssues =
    topics.length === 0 || topics.some((t: any) => t.sequenceNumber == null);

  /* -------------------- render -------------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{course.name}</h1>
            <p className="text-sm text-muted-foreground">{course.description}</p>
          </div>
        </div>

        {/* ✅ pass courseId, not course object */}
        <Button onClick={() => onEdit(courseId)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Course
        </Button>
      </div>

      {/* Integrity warnings */}
      {hasTopicIssues && (
        <Card className="border-destructive">
          <CardContent className="flex gap-2 items-center text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Curriculum integrity issue detected. Check topics and sequencing.
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Enrollments</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{enrollments.length}</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Students</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{activeEnrollments.length}</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Topics</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{topics.length}</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{completionRate}%</CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="topics">Topics</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Area:</strong> {course.area}
              </div>
              <div>
                <strong>Level:</strong> {course.level}
              </div>
              <div>
                <strong>Status:</strong>{' '}
                <Badge variant={course.status === 'active' ? 'default' : 'secondary'}>
                  {course.status}
                </Badge>
              </div>
              <div>
                <strong>Session Frequency:</strong> {course.sessionFrequency}
              </div>
              <div>
                <strong>Duration:</strong> {course.durationMinutes} min
              </div>
              <div>
                <strong>Rate / Session:</strong> ₹{course.ratePerSession}
              </div>
              <div>
                <strong>Expected Sessions / Month:</strong> {expectedMonthlySessions}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Topics */}
        <TabsContent value="topics">
          <Card>
            <CardHeader>
              <CardTitle>Curriculum Topics</CardTitle>
            </CardHeader>
            <CardContent>
              {topicsLoading ? (
                <div className="text-center py-4">Loading topics…</div>
              ) : topics.length === 0 ? (
                <div className="text-sm text-muted-foreground">No topics defined.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Minutes</TableHead>
                      <TableHead>Target Mastery</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topics
                      .sort(
                        (a: any, b: any) =>
                          (a.sequenceNumber || 0) - (b.sequenceNumber || 0)
                      )
                      .map((t: any) => (
                        <TableRow key={t.id}>
                          <TableCell>{t.sequenceNumber}</TableCell>
                          <TableCell className="font-medium">{t.name}</TableCell>
                          <TableCell>{t.estimatedMinutes} min</TableCell>
                          <TableCell>{t.targetMastery}%</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enrollments */}
        <TabsContent value="enrollments">
          <Card>
            <CardHeader>
              <CardTitle>Enrollments</CardTitle>
            </CardHeader>
            <CardContent>
              {enrollmentsLoading ? (
                <div className="text-center py-4">Loading…</div>
              ) : enrollments.length === 0 ? (
                <div className="text-sm text-muted-foreground">No enrollments yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Students</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Credits</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((e: any) => (
                      <TableRow key={e.id}>
                        <TableCell>
                          {e.kidNames?.join(', ') || e.kidIds?.join(', ') || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={e.status === 'active' ? 'default' : 'secondary'}>
                            {e.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {e.creditsRemaining ?? 0} / {e.creditsTotal ?? 0}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions */}
        <TabsContent value="sessions">
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Session management will be added here.
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics">
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Advanced analytics coming soon.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
