/**
 * Lesson Service Functions
 * Handles all lesson-related operations including CRUD and activity management
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import type {
  Lesson,
  Activity,
  CreateLessonFormData
} from '../types/content';

const LESSONS_COLLECTION = 'lessons';
const COURSES_COLLECTION = 'courses';

/**
 * Get all lessons for a specific course
 */
export async function getLessons(courseId: string): Promise<Lesson[]> {
  try {
    const lessonsRef = collection(db, LESSONS_COLLECTION);
    const q = query(
      lessonsRef,
      where('courseId', '==', courseId),
      orderBy('order', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Lesson[];
  } catch (error) {
    console.error('Error fetching lessons:', error);
    throw error;
  }
}

/**
 * Get a single lesson by ID
 */
export async function getLessonById(id: string): Promise<Lesson | null> {
  try {
    const lessonDoc = await getDoc(doc(db, LESSONS_COLLECTION, id));
    
    if (!lessonDoc.exists()) {
      return null;
    }

    return {
      id: lessonDoc.id,
      ...lessonDoc.data()
    } as Lesson;
  } catch (error) {
    console.error('Error fetching lesson:', error);
    throw error;
  }
}

/**
 * Create a new lesson in a course
 */
export async function createLesson(
  courseId: string,
  data: CreateLessonFormData,
  createdBy: string
): Promise<Lesson> {
  try {
    const now = new Date().toISOString();
    
    // Get current lessons to determine order
    const existingLessons = await getLessons(courseId);
    const order = existingLessons.length;

    const lessonData: Omit<Lesson, 'id'> = {
      courseId,
      title: data.title,
      description: data.description,
      objectives: data.objectives,
      activities: [],
      resources: [],
      order,
      duration: data.duration || 0,
      createdBy,
      createdAt: now,
      updatedAt: now
    };

    const docRef = await addDoc(collection(db, LESSONS_COLLECTION), lessonData);
    
    // Update course to include this lesson
    const courseRef = doc(db, COURSES_COLLECTION, courseId);
    const courseDoc = await getDoc(courseRef);
    
    if (courseDoc.exists()) {
      const courseData = courseDoc.data();
      await updateDoc(courseRef, {
        lessons: [...(courseData.lessons || []), docRef.id],
        updatedAt: now
      });
    }

    console.log(`✅ Lesson created: ${docRef.id} in course ${courseId}`);
    
    return {
      id: docRef.id,
      ...lessonData
    };
  } catch (error) {
    console.error('Error creating lesson:', error);
    throw error;
  }
}

/**
 * Update lesson data
 */
export async function updateLesson(id: string, updates: Partial<Lesson>): Promise<void> {
  try {
    const lessonRef = doc(db, LESSONS_COLLECTION, id);
    
    // Filter out undefined values and id
    const cleanUpdates: Record<string, any> = {};
    Object.keys(updates).forEach(key => {
      if (key !== 'id') {
        const value = (updates as any)[key];
        if (value !== undefined) {
          cleanUpdates[key] = value;
        }
      }
    });

    await updateDoc(lessonRef, {
      ...cleanUpdates,
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ Lesson updated: ${id}`);
  } catch (error) {
    console.error('Error updating lesson:', error);
    throw error;
  }
}

/**
 * Delete a lesson and remove it from the course
 */
export async function deleteLesson(id: string): Promise<void> {
  try {
    const lesson = await getLessonById(id);
    
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    // Remove lesson from course
    const courseRef = doc(db, COURSES_COLLECTION, lesson.courseId);
    const courseDoc = await getDoc(courseRef);
    
    if (courseDoc.exists()) {
      const courseData = courseDoc.data();
      await updateDoc(courseRef, {
        lessons: (courseData.lessons || []).filter((lid: string) => lid !== id),
        updatedAt: new Date().toISOString()
      });
    }

    // Delete lesson document
    await deleteDoc(doc(db, LESSONS_COLLECTION, id));

    // Reorder remaining lessons
    const remainingLessons = await getLessons(lesson.courseId);
    await reorderLessons(lesson.courseId, remainingLessons.map(l => l.id));

    console.log(`✅ Lesson deleted: ${id}`);
  } catch (error) {
    console.error('Error deleting lesson:', error);
    throw error;
  }
}

/**
 * Reorder lessons in a course
 */
export async function reorderLessons(courseId: string, lessonIds: string[]): Promise<void> {
  try {
    // Update the order field for each lesson
    const updates = lessonIds.map((lessonId, index) => {
      return updateDoc(doc(db, LESSONS_COLLECTION, lessonId), {
        order: index,
        updatedAt: new Date().toISOString()
      });
    });

    await Promise.all(updates);

    // Update course lessons array
    await updateDoc(doc(db, COURSES_COLLECTION, courseId), {
      lessons: lessonIds,
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ Lessons reordered in course ${courseId}`);
  } catch (error) {
    console.error('Error reordering lessons:', error);
    throw error;
  }
}

/**
 * Add activity to lesson
 */
export async function addActivityToLesson(lessonId: string, activity: Activity): Promise<void> {
  try {
    const lesson = await getLessonById(lessonId);
    
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    // Set activity order
    const newActivity = {
      ...activity,
      order: lesson.activities.length
    };

    // Calculate new lesson duration
    const newDuration = lesson.duration + activity.duration;

    await updateDoc(doc(db, LESSONS_COLLECTION, lessonId), {
      activities: [...lesson.activities, newActivity],
      duration: newDuration,
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ Activity added to lesson ${lessonId}`);
  } catch (error) {
    console.error('Error adding activity:', error);
    throw error;
  }
}

/**
 * Update activity in lesson
 */
export async function updateActivityInLesson(
  lessonId: string,
  activityId: string,
  updates: Partial<Activity>
): Promise<void> {
  try {
    const lesson = await getLessonById(lessonId);
    
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    const activityIndex = lesson.activities.findIndex(a => a.id === activityId);
    
    if (activityIndex === -1) {
      throw new Error('Activity not found in lesson');
    }

    // Update the activity
    const updatedActivities = [...lesson.activities];
    updatedActivities[activityIndex] = {
      ...updatedActivities[activityIndex],
      ...updates
    };

    // Recalculate lesson duration
    const newDuration = updatedActivities.reduce((sum, a) => sum + a.duration, 0);

    await updateDoc(doc(db, LESSONS_COLLECTION, lessonId), {
      activities: updatedActivities,
      duration: newDuration,
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ Activity ${activityId} updated in lesson ${lessonId}`);
  } catch (error) {
    console.error('Error updating activity:', error);
    throw error;
  }
}

/**
 * Remove activity from lesson
 */
export async function removeActivityFromLesson(lessonId: string, activityId: string): Promise<void> {
  try {
    const lesson = await getLessonById(lessonId);
    
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    const updatedActivities = lesson.activities.filter(a => a.id !== activityId);
    
    // Recalculate lesson duration
    const newDuration = updatedActivities.reduce((sum, a) => sum + a.duration, 0);

    // Reorder remaining activities
    const reorderedActivities = updatedActivities.map((a, index) => ({
      ...a,
      order: index
    }));

    await updateDoc(doc(db, LESSONS_COLLECTION, lessonId), {
      activities: reorderedActivities,
      duration: newDuration,
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ Activity ${activityId} removed from lesson ${lessonId}`);
  } catch (error) {
    console.error('Error removing activity:', error);
    throw error;
  }
}

/**
 * Reorder activities in a lesson
 */
export async function reorderActivities(lessonId: string, activityIds: string[]): Promise<void> {
  try {
    const lesson = await getLessonById(lessonId);
    
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    // Reorder activities based on activityIds array
    const reorderedActivities = activityIds.map((activityId, index) => {
      const activity = lesson.activities.find(a => a.id === activityId);
      if (!activity) {
        throw new Error(`Activity ${activityId} not found`);
      }
      return {
        ...activity,
        order: index
      };
    });

    await updateDoc(doc(db, LESSONS_COLLECTION, lessonId), {
      activities: reorderedActivities,
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ Activities reordered in lesson ${lessonId}`);
  } catch (error) {
    console.error('Error reordering activities:', error);
    throw error;
  }
}

/**
 * Add resource to lesson
 */
export async function addResourceToLesson(lessonId: string, resourceId: string): Promise<void> {
  try {
    const lesson = await getLessonById(lessonId);
    
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    if (!lesson.resources.includes(resourceId)) {
      await updateDoc(doc(db, LESSONS_COLLECTION, lessonId), {
        resources: [...lesson.resources, resourceId],
        updatedAt: new Date().toISOString()
      });

      console.log(`✅ Resource ${resourceId} added to lesson ${lessonId}`);
    }
  } catch (error) {
    console.error('Error adding resource:', error);
    throw error;
  }
}

/**
 * Remove resource from lesson
 */
export async function removeResourceFromLesson(lessonId: string, resourceId: string): Promise<void> {
  try {
    const lesson = await getLessonById(lessonId);
    
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    await updateDoc(doc(db, LESSONS_COLLECTION, lessonId), {
      resources: lesson.resources.filter(id => id !== resourceId),
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ Resource ${resourceId} removed from lesson ${lessonId}`);
  } catch (error) {
    console.error('Error removing resource:', error);
    throw error;
  }
}
