/**
 * Courses Overview Page
 * Main dashboard for course management with grid/list view, filters, and stats
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCourses, useCourseStats } from '../../hooks/useCourses';
import type { ContentStatus, DifficultyLevel } from '../../types/content';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  Squares2X2Icon,
  ListBulletIcon,
  PencilSquareIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  RocketLaunchIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { CONTENT_CATEGORIES, PHONICS_PHASES } from '../../types/content';

type ViewMode = 'grid' | 'list';

export default function CoursesOverview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats, loading: statsLoading } = useCourseStats();
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContentStatus | 'all'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyLevel | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
  const [phaseFilter, setPhaseFilter] = useState<number | 'all'>('all');

  // Build filters for the hook
  const filters = useMemo(() => {
    const f: any = {};
    if (statusFilter !== 'all') f.status = statusFilter;
    if (difficultyFilter !== 'all') f.difficulty = difficultyFilter;
    if (categoryFilter !== 'all') f.category = categoryFilter;
    if (phaseFilter !== 'all') f.phase = phaseFilter;
    if (searchTerm) f.searchTerm = searchTerm;
    return f;
  }, [statusFilter, difficultyFilter, categoryFilter, phaseFilter, searchTerm]);

  const { 
    courses, 
    loading, 
    error, 
    deleteCourse, 
    publishCourse, 
    duplicateCourse 
  } = useCourses(filters);

  const handleCreateCourse = () => {
    navigate('/surya/courses/new');
  };

  const handleEditCourse = (courseId: string) => {
    navigate(`/surya/courses/${courseId}/edit`);
  };

  const handleViewCourse = (courseId: string) => {
    navigate(`/surya/courses/${courseId}`);
  };

  const handleDeleteCourse = async (courseId: string, courseName: string) => {
    if (window.confirm(`Are you sure you want to archive "${courseName}"?`)) {
      try {
        await deleteCourse(courseId, false); // Soft delete
      } catch (err) {
        alert('Failed to archive course');
      }
    }
  };

  const handlePublishCourse = async (courseId: string, courseName: string) => {
    if (window.confirm(`Publish "${courseName}"? This will make it available to students.`)) {
      try {
        await publishCourse(courseId);
      } catch (err: any) {
        alert(err.message || 'Failed to publish course');
      }
    }
  };

  const handleDuplicateCourse = async (courseId: string) => {
    try {
      const newCourse = await duplicateCourse(courseId, user?.uid || '');
      navigate(`/surya/courses/${newCourse.id}/edit`);
    } catch (err) {
      alert('Failed to duplicate course');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDifficultyFilter('all');
    setCategoryFilter('all');
    setPhaseFilter('all');
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || difficultyFilter !== 'all' || categoryFilter !== 'all' || phaseFilter !== 'all';

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error loading courses: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
            <p className="text-gray-600 mt-1">Manage your learning content and curriculum</p>
          </div>
          <button
            onClick={handleCreateCourse}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Create Course
          </button>
        </div>

        {/* Stats */}
        {!statsLoading && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="text-sm text-gray-600">Total Courses</div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalCourses}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="text-sm text-gray-600">Published</div>
              <div className="text-2xl font-bold text-green-600">{stats.publishedCourses}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="text-sm text-gray-600">Total Lessons</div>
              <div className="text-2xl font-bold text-indigo-600">{stats.totalLessons}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="text-sm text-gray-600">Avg Completion</div>
              <div className="text-2xl font-bold text-purple-600">{stats.avgCompletionRate.toFixed(1)}%</div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          {/* Search Bar */}
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses by title, description, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Filter Section */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-gray-700">
              <FunnelIcon className="w-5 h-5" />
              <span className="font-medium">Filters:</span>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              {['all', 'draft', 'published', 'archived'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status as any)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {/* Difficulty Filter */}
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Categories</option>
              {Object.values(CONTENT_CATEGORIES).map((cat: string) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Phase Filter */}
            <select
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Phases</option>
              {PHONICS_PHASES.map(phase => (
                <option key={phase.value} value={phase.value}>{phase.label}</option>
              ))}
            </select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Clear Filters
              </button>
            )}

            {/* View Mode Toggle */}
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${
                  viewMode === 'grid'
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${
                  viewMode === 'list'
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <ListBulletIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          {loading ? 'Loading...' : `${courses.length} course${courses.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="text-gray-600 mt-4">Loading courses...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && courses.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-200">
          <MagnifyingGlassIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
          <p className="text-gray-600 mb-6">
            {hasActiveFilters
              ? 'Try adjusting your filters to see more results.'
              : 'Get started by creating your first course.'}
          </p>
          {!hasActiveFilters && (
            <button
              onClick={handleCreateCourse}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Create Your First Course
            </button>
          )}
        </div>
      )}

      {/* Grid View */}
      {!loading && courses.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Thumbnail */}
              <div className="h-48 bg-gradient-to-br from-indigo-500 to-purple-600 relative">
                {course.thumbnailUrl ? (
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white text-6xl font-bold opacity-20">
                    {course.title.charAt(0)}
                  </div>
                )}
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      course.status === 'published'
                        ? 'bg-green-500 text-white'
                        : course.status === 'draft'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-500 text-white'
                    }`}
                  >
                    {course.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>

                {/* Metadata */}
                <div className="flex flex-wrap gap-2 mb-4 text-xs">
                  <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                    {course.category}
                  </span>
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                    {course.difficulty}
                  </span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    Phase {course.phase}
                  </span>
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {course.lessons.length} lesson{course.lessons.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewCourse(course.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    title="View"
                  >
                    <EyeIcon className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => handleEditCourse(course.id)}
                    className="flex items-center justify-center px-3 py-2 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors"
                    title="Edit"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                  </button>
                  {course.status === 'draft' && (
                    <button
                      onClick={() => handlePublishCourse(course.id, course.title)}
                      className="flex items-center justify-center px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      title="Publish"
                    >
                      <RocketLaunchIcon className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDuplicateCourse(course.id)}
                    className="flex items-center justify-center px-3 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                    title="Duplicate"
                  >
                    <DocumentDuplicateIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course.id, course.title)}
                    className="flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    title="Archive"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {!loading && courses.length > 0 && viewMode === 'list' && (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lessons
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {course.title.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{course.title}</div>
                        <div className="text-sm text-gray-500">{course.difficulty}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{course.category}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{course.lessons.length}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        course.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : course.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {course.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(course.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleViewCourse(course.id)}
                        className="text-gray-600 hover:text-gray-900"
                        title="View"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEditCourse(course.id)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit"
                      >
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                      {course.status === 'draft' && (
                        <button
                          onClick={() => handlePublishCourse(course.id, course.title)}
                          className="text-green-600 hover:text-green-900"
                          title="Publish"
                        >
                          <RocketLaunchIcon className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDuplicateCourse(course.id)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Duplicate"
                      >
                        <DocumentDuplicateIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course.id, course.title)}
                        className="text-red-600 hover:text-red-900"
                        title="Archive"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
