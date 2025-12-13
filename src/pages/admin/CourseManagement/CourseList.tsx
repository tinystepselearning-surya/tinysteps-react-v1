// CourseList.tsx
import { useEffect, useMemo, useState } from 'react';
import { useCourses, useAllEnrollments } from '../../../hooks/useData';

import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui/table';
import { Input } from '@components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { Badge } from '@components/ui/badge';

import { ChevronLeft, ChevronRight, Eye, Edit, Trash2 } from 'lucide-react';

/* -------------------- types -------------------- */

interface CourseListProps {
  onViewCourse?: (courseId: string) => void;
  onEditCourse?: (courseId: string) => void;
  onDeleteCourse?: (courseId: string) => void;
  onCreateCourse?: () => void;
}

/* -------------------- helpers -------------------- */

const areaBadge = (area: string) => {
  switch (area) {
    case 'Phonics':
      return 'bg-blue-100 text-blue-800';
    case 'Grammar':
      return 'bg-green-100 text-green-800';
    case 'Speaking':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const statusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'inactive':
      return 'bg-yellow-100 text-yellow-800';
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/* -------------------- component -------------------- */

export default function CourseList({
  onViewCourse,
  onEditCourse,
  onDeleteCourse,
  onCreateCourse,
}: CourseListProps) {
  const [filters, setFilters] = useState({
    area: 'all',
    level: 'all',
    status: 'all',
    search: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Reset to Page 1 whenever filters change (prevents empty pages)
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.area, filters.level, filters.status, filters.search]);

  const { data: courses = [], isLoading, error } = useCourses({
    area: filters.area !== 'all' ? filters.area : undefined,
    level: filters.level !== 'all' ? Number(filters.level) : undefined,
    status: filters.status !== 'all' ? filters.status : undefined,
    search: filters.search || undefined,
  });

  // ✅ fetch enrollments ONCE
  const { data: enrollments = [] } = useAllEnrollments();

  /* -------------------- derived data -------------------- */

  const activeCountByCourse = useMemo(() => {
    const map: Record<string, number> = {};
    enrollments.forEach((e: any) => {
      if (e.courseId && e.status === 'active') {
        map[e.courseId] = (map[e.courseId] || 0) + 1;
      }
    });
    return map;
  }, [enrollments]);

  const totalPages = Math.max(1, Math.ceil(courses.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCourses = courses.slice(startIndex, startIndex + itemsPerPage);

  /* -------------------- render -------------------- */

  if (isLoading) {
    return <div className="p-8 text-center">Loading courses…</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error loading courses: {(error as any)?.message || 'Unknown error'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Area */}
          <Select
            value={filters.area}
            onValueChange={(v) => setFilters((f) => ({ ...f, area: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              <SelectItem value="Phonics">Phonics</SelectItem>
              <SelectItem value="Grammar">Grammar</SelectItem>
              <SelectItem value="Speaking">Speaking</SelectItem>
            </SelectContent>
          </Select>

          {/* Level */}
          <Select
            value={filters.level}
            onValueChange={(v) => setFilters((f) => ({ ...f, level: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {Array.from({ length: 8 }).map((_, i) => (
                <SelectItem key={i} value={`${i + 1}`}>
                  {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status */}
          <Select
            value={filters.status}
            onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>

          {/* Search */}
          <Input
            placeholder="Search courses…"
            value={filters.search}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value }))
            }
            className="md:col-span-2"
          />
        </div>
      </Card>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {courses.length === 0 ? (
            'No courses found'
          ) : (
            <>
              Showing {startIndex + 1}–
              {Math.min(startIndex + itemsPerPage, courses.length)} of{' '}
              {courses.length}
            </>
          )}
        </div>

        {onCreateCourse && (
          <Button onClick={onCreateCourse}>Create Course</Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Area</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedCourses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center">
                  No courses to show.
                </TableCell>
              </TableRow>
            ) : (
              paginatedCourses.map((course: any) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.name}</TableCell>

                  <TableCell>
                    <Badge className={areaBadge(course.area)}>{course.area}</Badge>
                  </TableCell>

                  <TableCell>{course.level}</TableCell>

                  <TableCell className="text-sm">
                    {course.targetAge?.join(', ') || 'N/A'}
                    <div className="text-xs text-muted-foreground">
                      {course.targetGrade?.join(', ') || ''}
                    </div>
                  </TableCell>

                  <TableCell>₹{course.ratePerSession}</TableCell>

                  <TableCell>{activeCountByCourse[course.id] || 0}</TableCell>

                  <TableCell>
                    <Badge className={statusBadge(course.status)}>
                      {course.status}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex gap-2">
                      {onViewCourse && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewCourse(course.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}

                      {onEditCourse && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEditCourse(course.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}

                      {onDeleteCourse && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onDeleteCourse(course.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {courses.length > itemsPerPage && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
