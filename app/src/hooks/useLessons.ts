/**
 * Custom hook for managing lessons
 */

import { useState, useEffect, useCallback } from 'react';
import type { Lesson, Activity } from '../types/content';
import * as lessonService from '../services/lessonService';

export function useLessons(courseId: string) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLessons = useCallback(async () => {
    if (!courseId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await lessonService.getLessons(courseId);
      setLessons(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch lessons');
      console.error('Error fetching lessons:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const createLesson = useCallback(async (
    data: any,
    createdBy: string
  ) => {
    try {
      const newLesson = await lessonService.createLesson(courseId, data, createdBy);
      setLessons(prev => [...prev, newLesson]);
      return newLesson;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create lesson');
      throw err;
    }
  }, [courseId]);

  const updateLesson = useCallback(async (id: string, updates: Partial<Lesson>) => {
    try {
      await lessonService.updateLesson(id, updates);
      setLessons(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update lesson');
      throw err;
    }
  }, []);

  const deleteLesson = useCallback(async (id: string) => {
    try {
      await lessonService.deleteLesson(id);
      setLessons(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete lesson');
      throw err;
    }
  }, []);

  const reorderLessons = useCallback(async (lessonIds: string[]) => {
    try {
      await lessonService.reorderLessons(courseId, lessonIds);
      // Fetch lessons again to get updated order
      await fetchLessons();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder lessons');
      throw err;
    }
  }, [courseId, fetchLessons]);

  const addActivity = useCallback(async (lessonId: string, activity: Activity) => {
    try {
      await lessonService.addActivityToLesson(lessonId, activity);
      setLessons(prev => prev.map(l => 
        l.id === lessonId 
          ? { ...l, activities: [...l.activities, activity], duration: l.duration + activity.duration }
          : l
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add activity');
      throw err;
    }
  }, []);

  const updateActivity = useCallback(async (
    lessonId: string,
    activityId: string,
    updates: Partial<Activity>
  ) => {
    try {
      await lessonService.updateActivityInLesson(lessonId, activityId, updates);
      setLessons(prev => prev.map(l => 
        l.id === lessonId
          ? {
              ...l,
              activities: l.activities.map(a => 
                a.id === activityId ? { ...a, ...updates } : a
              )
            }
          : l
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update activity');
      throw err;
    }
  }, []);

  const removeActivity = useCallback(async (lessonId: string, activityId: string) => {
    try {
      await lessonService.removeActivityFromLesson(lessonId, activityId);
      setLessons(prev => prev.map(l => 
        l.id === lessonId
          ? { ...l, activities: l.activities.filter(a => a.id !== activityId) }
          : l
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove activity');
      throw err;
    }
  }, []);

  const refreshLessons = useCallback(() => {
    fetchLessons();
  }, [fetchLessons]);

  return {
    lessons,
    loading,
    error,
    createLesson,
    updateLesson,
    deleteLesson,
    reorderLessons,
    addActivity,
    updateActivity,
    removeActivity,
    refreshLessons
  };
}

export function useLesson(lessonId: string) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLesson() {
      if (!lessonId) return;
      
      setLoading(true);
      setError(null);
      try {
        const data = await lessonService.getLessonById(lessonId);
        setLesson(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch lesson');
        console.error('Error fetching lesson:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLesson();
  }, [lessonId]);

  return { lesson, loading, error };
}
