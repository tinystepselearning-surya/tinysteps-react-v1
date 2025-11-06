/**
 * Custom hook for managing courses
 */

import { useState, useEffect, useCallback } from 'react';
import type { Course, CourseFilters, CourseStats } from '../types/content';
import * as courseService from '../services/courseService';

export function useCourses(initialFilters?: CourseFilters) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CourseFilters | undefined>(initialFilters);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await courseService.getCourses(filters);
      setCourses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch courses');
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const createCourse = useCallback(async (
    data: any,
    createdBy: string,
    thumbnailUrl?: string
  ) => {
    try {
      const newCourse = await courseService.createCourse(data, createdBy, thumbnailUrl);
      setCourses(prev => [newCourse, ...prev]);
      return newCourse;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create course');
      throw err;
    }
  }, []);

  const updateCourse = useCallback(async (id: string, updates: Partial<Course>) => {
    try {
      await courseService.updateCourse(id, updates);
      setCourses(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update course');
      throw err;
    }
  }, []);

  const deleteCourse = useCallback(async (id: string, hardDelete?: boolean) => {
    try {
      await courseService.deleteCourse(id, hardDelete);
      if (hardDelete) {
        setCourses(prev => prev.filter(c => c.id !== id));
      } else {
        setCourses(prev => prev.map(c => c.id === id ? { ...c, status: 'archived' as const } : c));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete course');
      throw err;
    }
  }, []);

  const publishCourse = useCallback(async (id: string) => {
    try {
      await courseService.publishCourse(id);
      setCourses(prev => prev.map(c => 
        c.id === id 
          ? { ...c, status: 'published' as const, publishedAt: new Date().toISOString() }
          : c
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish course');
      throw err;
    }
  }, []);

  const duplicateCourse = useCallback(async (id: string, createdBy: string) => {
    try {
      const newCourse = await courseService.duplicateCourse(id, createdBy);
      setCourses(prev => [newCourse, ...prev]);
      return newCourse;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate course');
      throw err;
    }
  }, []);

  const refreshCourses = useCallback(() => {
    fetchCourses();
  }, [fetchCourses]);

  return {
    courses,
    loading,
    error,
    filters,
    setFilters,
    createCourse,
    updateCourse,
    deleteCourse,
    publishCourse,
    duplicateCourse,
    refreshCourses
  };
}

export function useCourseStats() {
  const [stats, setStats] = useState<CourseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const data = await courseService.getCourseStats();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch course stats');
        console.error('Error fetching course stats:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return { stats, loading, error };
}

export function useCourse(courseId: string) {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourse() {
      if (!courseId) return;
      
      setLoading(true);
      setError(null);
      try {
        const data = await courseService.getCourseById(courseId);
        setCourse(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch course');
        console.error('Error fetching course:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCourse();
  }, [courseId]);

  return { course, loading, error };
}
