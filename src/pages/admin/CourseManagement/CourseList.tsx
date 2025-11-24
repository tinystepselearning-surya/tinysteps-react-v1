import React, { useState } from 'react';
import { useCourses, useCourseEnrollments } from '../../../hooks/useData';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Badge } from '@components/ui/badge';
import { ChevronLeft, ChevronRight, Eye, Edit, Trash2 } from 'lucide-react';

interface CourseListProps {
  onViewCourse?: (courseId: string) => void;
  onEditCourse?: (courseId: string) => void;
  onDeleteCourse?: (courseId: string) => void;
  onCreateCourse?: () => void;
}

export default function CourseList({ 
  onViewCourse, 
  onEditCourse, 
  onDeleteCourse, 
  onCreateCourse 
}: CourseListProps) {
  const [filters, setFilters] = useState({
    area: '',
    level: '',
    status: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { data: courses = [], isLoading, error } = useCourses({
    area: filters.area || undefined,
    level: filters.level ? parseInt(filters.level) : undefined,
    status: filters.status || undefined,
    search: filters.search || undefined
  });

  const getAreaColor = (area: string) => {
    switch (area) {
      case 'Phonics': return 'bg-blue-100 text-blue-800';
      case 'Grammar': return 'bg-green-100 text-green-800';
      case 'Speaking': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTargetAge = (ages: number[]) => {
    if (!ages || ages.length === 0) return 'N/A';
    const min = Math.min(...ages);
    const max = Math.max(...ages);
    return min === max ? `${min}` : `${min}-${max}`;
  };

  const formatTargetGrade = (grades: string[]) => {
    if (!grades || grades.length === 0) return 'N/A';
    return grades.join(', ');
  };

  // Pagination
  const totalPages = Math.ceil(courses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCourses = courses.slice(startIndex, startIndex + itemsPerPage);

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading courses...</div>;
  }

  if (error) {
    return <div className="text-red-600 p-4">Error loading courses: {error.message}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="text-sm font-medium">Area</label>
            <Select
              value={filters.area || 'all'}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  area: value === 'all' ? '' : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Areas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                <SelectItem value="Phonics">Phonics</SelectItem>
                <SelectItem value="Grammar">Grammar</SelectItem>
                <SelectItem value="Speaking">Speaking</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Level</label>
            <Select
              value={filters.level || 'all'}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  level: value === 'all' ? '' : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {Array.from({length: 8}, (_, i) => (
                  <SelectItem key={i+1} value={(i+1).toString()}>{i+1}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Status</label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  status: value === 'all' ? '' : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Search</label>
                <Input 
                  placeholder="Search courses..." 
                  value={filters.search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({...filters, search: e.target.value})}
                />
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, courses.length)} of {courses.length} courses
        </div>
        {onCreateCourse && (
          <Button onClick={onCreateCourse}>
            Create New Course
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course Name</TableHead>
              <TableHead>Area</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Target Age/Grade</TableHead>
              <TableHead>Rate/Session</TableHead>
              <TableHead>Active Students</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
                {paginatedCourses.map((course: any) => (
              <CourseRow 
                key={course.id} 
                course={course} 
                onView={onViewCourse}
                onEdit={onEditCourse}
                onDelete={onDeleteCourse}
              />
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

interface CourseRowProps {
  course: any;
  onView?: (courseId: string) => void;
  onEdit?: (courseId: string) => void;
  onDelete?: (courseId: string) => void;
}

function CourseRow({ course, onView, onEdit, onDelete }: CourseRowProps) {
  const { data: enrollments = [] } = useCourseEnrollments(course.id || '');
  const activeStudents = enrollments.filter((e: any) => e.status === 'active').length;

  const getAreaColor = (area: string) => {
    switch (area) {
      case 'Phonics': return 'bg-blue-100 text-blue-800';
      case 'Grammar': return 'bg-green-100 text-green-800';
      case 'Speaking': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{course.name}</TableCell>
      <TableCell>
        <Badge className={getAreaColor(course.area)}>{course.area}</Badge>
      </TableCell>
      <TableCell>{course.level}</TableCell>
      <TableCell>
        <div className="text-sm">
          <div>Ages: {course.targetAge?.join(', ') || 'N/A'}</div>
          <div className="text-gray-500">{course.targetGrade?.join(', ') || 'N/A'}</div>
        </div>
      </TableCell>
      <TableCell>₹{course.ratePerSession}</TableCell>
      <TableCell>{activeStudents}</TableCell>
      <TableCell>
        <Badge className={getStatusColor(course.status)}>{course.status}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          {onView && (
            <Button size="sm" variant="outline" onClick={() => onView(course.id!)}>
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onEdit && (
            <Button size="sm" variant="outline" onClick={() => onEdit(course.id!)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button size="sm" variant="destructive" onClick={() => onDelete(course.id!)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
