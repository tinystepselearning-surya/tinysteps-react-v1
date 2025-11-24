import React, { useState } from 'react';
import { useCourse, useTopics, useCourseEnrollments } from '../../../hooks/useData';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import { Badge } from '@components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { ArrowLeft, Users, BookOpen, Calendar, TrendingUp, Edit } from 'lucide-react';

interface CourseDetailViewProps {
  courseId: string;
  onBack: () => void;
  onEdit: (course: any) => void;
}

export const CourseDetailView: React.FC<CourseDetailViewProps> = ({ courseId, onBack, onEdit }) => {
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: topics = [], isLoading: topicsLoading } = useTopics(courseId);
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useCourseEnrollments(courseId);

  if (courseLoading) {
    return <div className="flex justify-center p-8">Loading course details...</div>;
  }

  if (!course) {
    return <div className="text-center p-8">Course not found</div>;
  }

    const activeEnrollments = enrollments.filter((e: { status: string }) => e.status === 'active');
    const completedEnrollments = enrollments.filter((e: { status: string }) => e.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{course.name}</h1>
            <p className="text-gray-600">{course.description}</p>
          </div>
        </div>
        <Button onClick={() => onEdit(course)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Course
        </Button>
      </div>

      {/* Course Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrollments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEnrollments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Topics</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topics.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {enrollments.length > 0 ? Math.round((completedEnrollments.length / enrollments.length) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Details Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="topics">Topics</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Course Area</label>
                  <p className="text-sm text-gray-600">{course.area}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Level</label>
                  <p className="text-sm text-gray-600">{course.level}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Badge variant={course.status === 'active' ? 'default' : 'secondary'}>
                    {course.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Duration</label>
                  <p className="text-sm text-gray-600">{course.durationMinutes} minutes</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Session Frequency</label>
                  <p className="text-sm text-gray-600">{course.sessionFrequency}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Rate per Session</label>
                  <p className="text-sm text-gray-600">₹{course.ratePerSession}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Max Students</label>
                  <p className="text-sm text-gray-600">{course.maxStudentsPerSession}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Target Age</label>
                  <p className="text-sm text-gray-600">{course.targetAge.join('-')} years</p>
                </div>
              </div>

              {course.prerequisites && course.prerequisites.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Prerequisites</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {course.prerequisites.map((prereq: string, index: number) => (
                      <Badge key={index} variant="outline">{prereq}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {course.topics && course.topics.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Topics</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                      {course.topics.map((topic: string, index: number) => (
                        <Badge key={index} variant="outline">{topic}</Badge>
                      ))}
                  </div>
                </div>
              )}

              {course.targetGrade && course.targetGrade.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Target Grades</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {course.targetGrade.map((grade: string, index: number) => (
                      <Badge key={index} variant="outline">{grade}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Topics</CardTitle>
            </CardHeader>
            <CardContent>
              {topicsLoading ? (
                <div className="text-center py-4">Loading topics...</div>
              ) : topics.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No topics defined for this course</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sequence</TableHead>
                      <TableHead>Topic Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Target Mastery</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topics
                      .sort((a: any, b: any) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0))
                      .map((topic: any) => (
                        <TableRow key={topic.id}>
                          <TableCell>{topic.sequenceNumber}</TableCell>
                          <TableCell className="font-medium">{topic.name}</TableCell>
                          <TableCell className="max-w-xs truncate">{topic.description}</TableCell>
                          <TableCell>{topic.estimatedMinutes} min</TableCell>
                          <TableCell>{topic.targetMastery}%</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrollments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Enrollments</CardTitle>
            </CardHeader>
            <CardContent>
              {enrollmentsLoading ? (
                <div className="text-center py-4">Loading enrollments...</div>
              ) : enrollments.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No students enrolled in this course</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Students</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Credits Remaining</TableHead>
                      <TableHead>Enrollment Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((enrollment: any) => (
                      <TableRow key={enrollment.id}>
                        <TableCell className="font-medium">
                          {enrollment.kidIds?.join(', ') || 'Unknown Students'}
                        </TableCell>
                        <TableCell>
                          {enrollment.parentId || 'Unknown Parent'}
                        </TableCell>
                        <TableCell>
                          {enrollment.status || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {enrollment.creditsRemaining || 0} credits remaining
                        </TableCell>
                        <TableCell>
                          <Badge variant={enrollment.status === 'active' ? 'default' : 'secondary'}>
                            {enrollment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Session management will be implemented in the Sessions tab
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Detailed analytics and charts will be implemented here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};