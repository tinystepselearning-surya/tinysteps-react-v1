import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useProgress } from '../../hooks/useProgress';
import { TeacherStudent, StudentProgress } from '../../types/Teacher';

const StudentProgressView: React.FC = () => {
  const { students, progressData, loading, error } = useProgress();
  const [selectedStudent, setSelectedStudent] = useState<TeacherStudent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || student.progressStatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStudentProgress = (studentId: string): StudentProgress | undefined => {
    return progressData.find(p => p.studentId === studentId);
  };

  const ProgressBar: React.FC<{ value: number; label: string }> = ({ value, label }) => (
    <div className="mb-2">
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full"
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );

  if (loading) {
    return <div className="p-6">Loading student progress...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Student Progress</h1>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">All Students</TabsTrigger>
          <TabsTrigger value="detail" disabled={!selectedStudent}>
            Student Detail
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="on_track">On Track</SelectItem>
                <SelectItem value="needs_attention">Needs Attention</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredStudents.map((student) => {
              const progress = getStudentProgress(student.id);
              return (
                <Card key={student.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{student.fullName}</CardTitle>
                      <Badge
                        variant={student.progressStatus === 'on_track' ? 'default' : 'destructive'}
                      >
                        {student.progressStatus === 'on_track' ? 'On Track' : 'Needs Attention'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Grade: {student.grade || 'N/A'}</p>
                      <p className="text-sm text-gray-600">
                        Courses: {student.courseNames?.join(', ') || 'None'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Last Session: {student.lastSessionDate || 'N/A'}
                      </p>
                      {progress && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">Quick Progress:</p>
                          <ProgressBar value={progress.phonics} label="Phonics" />
                          <ProgressBar value={progress.grammar} label="Grammar" />
                          <ProgressBar value={progress.speaking} label="Speaking" />
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full"
                      onClick={() => setSelectedStudent(student)}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="detail" className="space-y-4">
          {selectedStudent && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{selectedStudent.fullName}'s Progress</h2>
                <Button variant="outline" onClick={() => setSelectedStudent(null)}>
                  Back to List
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Student Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><strong>Grade:</strong> {selectedStudent.grade || 'N/A'}</p>
                  <p><strong>Courses:</strong> {selectedStudent.courseNames?.join(', ') || 'None'}</p>
                  <p><strong>Status:</strong>
                    <Badge
                      variant={selectedStudent.progressStatus === 'on_track' ? 'default' : 'destructive'}
                      className="ml-2"
                    >
                      {selectedStudent.progressStatus === 'on_track' ? 'On Track' : 'Needs Attention'}
                    </Badge>
                  </p>
                  <p><strong>Last Session:</strong> {selectedStudent.lastSessionDate || 'N/A'}</p>
                </CardContent>
              </Card>

              {(() => {
                const progress = getStudentProgress(selectedStudent.id);
                if (!progress) {
                  return (
                    <Card>
                      <CardContent className="p-6 text-center text-gray-500">
                        No progress data available for this student.
                      </CardContent>
                    </Card>
                  );
                }

                return (
                  <Card>
                    <CardHeader>
                      <CardTitle>Progress Charts</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-3">Subject Progress</h3>
                        <ProgressBar value={progress.phonics} label="Phonics" />
                        <ProgressBar value={progress.grammar} label="Grammar" />
                        <ProgressBar value={progress.speaking} label="Speaking" />
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {progress.attendanceRate}%
                          </div>
                          <div className="text-sm text-gray-600">Attendance Rate</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {Math.round((progress.phonics + progress.grammar + progress.speaking) / 3)}%
                          </div>
                          <div className="text-sm text-gray-600">Average Progress</div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h3 className="font-medium mb-3">Recent Activity</h3>
                        <p className="text-sm text-gray-600">
                          Last session: {progress.lastSession || 'N/A'}
                        </p>
                        {/* Add timeline or recent sessions here if available */}
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentProgressView;