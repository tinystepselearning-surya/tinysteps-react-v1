/**
 * Course Service Functions
 * Handles all course-related operations including CRUD, publishing, and duplication
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import type {
  Course,
  CourseFilters,
  CourseStats,
  CreateCourseFormData
} from '../types/content';

const COURSES_COLLECTION = 'courses';
const LESSONS_COLLECTION = 'lessons';

/**
 * Get all courses with optional filtering
 */
export async function getCourses(filters?: CourseFilters): Promise<Course[]> {
  try {
    const coursesRef = collection(db, COURSES_COLLECTION);
    let q = query(coursesRef, orderBy('createdAt', 'desc'));

    // Apply filters
    if (filters) {
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters.phase !== undefined) {
        q = query(q, where('phase', '==', filters.phase));
      }
      if (filters.difficulty) {
        q = query(q, where('difficulty', '==', filters.difficulty));
      }
      if (filters.category) {
        q = query(q, where('category', '==', filters.category));
      }
      if (filters.createdBy) {
        q = query(q, where('createdBy', '==', filters.createdBy));
      }
    }

    const snapshot = await getDocs(q);
    let courses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Course[];

    // Client-side filtering for complex queries
    if (filters) {
      // Filter by tags (array contains)
      if (filters.tags && filters.tags.length > 0) {
        courses = courses.filter(course =>
          filters.tags!.some(tag => course.tags.includes(tag))
        );
      }

      // Filter by search term
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        courses = courses.filter(course =>
          course.title.toLowerCase().includes(term) ||
          course.description.toLowerCase().includes(term) ||
          course.tags.some(tag => tag.toLowerCase().includes(term))
        );
      }
    }

    return courses;
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
}

/**
 * Get a single course by ID with full details
 */
export async function getCourseById(id: string): Promise<Course | null> {
  try {
    const courseDoc = await getDoc(doc(db, COURSES_COLLECTION, id));
    
    if (!courseDoc.exists()) {
      return null;
    }

    return {
      id: courseDoc.id,
      ...courseDoc.data()
    } as Course;
  } catch (error) {
    console.error('Error fetching course:', error);
    throw error;
  }
}

/**
 * Create a new course
 */
export async function createCourse(
  data: CreateCourseFormData,
  createdBy: string,
  thumbnailUrl?: string
): Promise<Course> {
  try {
    const now = new Date().toISOString();
    
    const courseData: Omit<Course, 'id'> = {
      title: data.title,
      description: data.description,
      phase: data.phase,
      difficulty: data.difficulty,
      ageRange: data.ageRange,
      thumbnailUrl: thumbnailUrl || '',
      status: 'draft',
      lessons: [],
      objectives: data.objectives,
      estimatedDuration: 0,
      category: data.category,
      tags: data.tags,
      createdBy,
      createdAt: now,
      updatedAt: now,
      enrolledStudents: 0,
      completionRate: 0
    };

    const docRef = await addDoc(collection(db, COURSES_COLLECTION), courseData);
    
    console.log(`✅ Course created: ${docRef.id}`);
    
    return {
      id: docRef.id,
      ...courseData
    };
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
}

/**
 * Update course data
 */
export async function updateCourse(id: string, updates: Partial<Course>): Promise<void> {
  try {
    const courseRef = doc(db, COURSES_COLLECTION, id);
    
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

    await updateDoc(courseRef, {
      ...cleanUpdates,
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ Course updated: ${id}`);
  } catch (error) {
    console.error('Error updating course:', error);
    throw error;
  }
}

/**
 * Delete a course (soft delete by archiving)
 */
export async function deleteCourse(id: string, hardDelete: boolean = false): Promise<void> {
  try {
    if (hardDelete) {
      // Hard delete: Remove course and all its lessons
      const batch = writeBatch(db);
      
      // Get course to find its lessons
      const course = await getCourseById(id);
      if (!course) {
        throw new Error('Course not found');
      }

      // Delete all lessons
      if (course.lessons.length > 0) {
        for (const lessonId of course.lessons) {
          batch.delete(doc(db, LESSONS_COLLECTION, lessonId));
        }
      }

      // Delete course
      batch.delete(doc(db, COURSES_COLLECTION, id));

      await batch.commit();
      console.log(`✅ Course hard deleted: ${id} (${course.lessons.length} lessons removed)`);
    } else {
      // Soft delete: Archive the course
      await updateCourse(id, {
        status: 'archived',
        updatedAt: new Date().toISOString()
      });
      console.log(`✅ Course archived: ${id}`);
    }
  } catch (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
}

/**
 * Publish a course (change status from draft to published)
 */
export async function publishCourse(id: string): Promise<void> {
  try {
    const course = await getCourseById(id);
    
    if (!course) {
      throw new Error('Course not found');
    }

    // Validation before publishing
    if (course.lessons.length === 0) {
      throw new Error('Cannot publish course without lessons');
    }

    if (!course.title || !course.description) {
      throw new Error('Course must have title and description');
    }

    if (course.objectives.length === 0) {
      throw new Error('Course must have at least one learning objective');
    }

    await updateDoc(doc(db, COURSES_COLLECTION, id), {
      status: 'published',
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ Course published: ${id}`);
  } catch (error) {
    console.error('Error publishing course:', error);
    throw error;
  }
}

/**
 * Duplicate a course (clone with new ID)
 */
export async function duplicateCourse(id: string, createdBy: string): Promise<Course> {
  try {
    const originalCourse = await getCourseById(id);
    
    if (!originalCourse) {
      throw new Error('Course not found');
    }

    const now = new Date().toISOString();
    
    // Create duplicate course data
    const duplicateData: Omit<Course, 'id'> = {
      ...originalCourse,
      title: `${originalCourse.title} (Copy)`,
      status: 'draft',
      lessons: [], // Don't copy lessons yet - that would require duplicating lesson docs
      createdBy,
      createdAt: now,
      updatedAt: now,
      publishedAt: undefined,
      enrolledStudents: 0,
      completionRate: 0
    };

    const docRef = await addDoc(collection(db, COURSES_COLLECTION), duplicateData);
    
    console.log(`✅ Course duplicated: ${id} → ${docRef.id}`);
    
    // TODO: In a full implementation, you would also duplicate all lessons
    // For now, we just create an empty duplicate
    
    return {
      id: docRef.id,
      ...duplicateData
    };
  } catch (error) {
    console.error('Error duplicating course:', error);
    throw error;
  }
}

/**
 * Get course statistics
 */
export async function getCourseStats(): Promise<CourseStats> {
  try {
    const courses = await getCourses();
    const lessonsSnapshot = await getDocs(collection(db, LESSONS_COLLECTION));
    
    // Calculate statistics
    const totalCourses = courses.length;
    const publishedCourses = courses.filter(c => c.status === 'published').length;
    const draftCourses = courses.filter(c => c.status === 'draft').length;
    const archivedCourses = courses.filter(c => c.status === 'archived').length;
    const totalLessons = lessonsSnapshot.size;
    
    // Calculate total activities (would need to iterate through lessons)
    let totalActivities = 0;
    lessonsSnapshot.docs.forEach(doc => {
      const lesson = doc.data();
      if (lesson.activities) {
        totalActivities += lesson.activities.length;
      }
    });

    // Calculate average completion rate
    const coursesWithCompletionRate = courses.filter(c => c.completionRate !== undefined);
    const avgCompletionRate = coursesWithCompletionRate.length > 0
      ? coursesWithCompletionRate.reduce((sum, c) => sum + (c.completionRate || 0), 0) / coursesWithCompletionRate.length
      : 0;

    // Calculate total enrollments
    const totalEnrollments = courses.reduce((sum, c) => sum + c.enrolledStudents, 0);

    return {
      totalCourses,
      publishedCourses,
      draftCourses,
      archivedCourses,
      totalLessons,
      totalActivities,
      totalResources: 0, // Would need to query resources collection
      avgCompletionRate: Math.round(avgCompletionRate),
      totalEnrollments
    };
  } catch (error) {
    console.error('Error fetching course stats:', error);
    throw error;
  }
}

/**
 * Add lesson to course
 */
export async function addLessonToCourse(courseId: string, lessonId: string): Promise<void> {
  try {
    const course = await getCourseById(courseId);
    
    if (!course) {
      throw new Error('Course not found');
    }

    if (!course.lessons.includes(lessonId)) {
      await updateDoc(doc(db, COURSES_COLLECTION, courseId), {
        lessons: [...course.lessons, lessonId],
        updatedAt: new Date().toISOString()
      });

      console.log(`✅ Lesson ${lessonId} added to course ${courseId}`);
    }
  } catch (error) {
    console.error('Error adding lesson to course:', error);
    throw error;
  }
}

/**
 * Remove lesson from course
 */
export async function removeLessonFromCourse(courseId: string, lessonId: string): Promise<void> {
  try {
    const course = await getCourseById(courseId);
    
    if (!course) {
      throw new Error('Course not found');
    }

    await updateDoc(doc(db, COURSES_COLLECTION, courseId), {
      lessons: course.lessons.filter(id => id !== lessonId),
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ Lesson ${lessonId} removed from course ${courseId}`);
  } catch (error) {
    console.error('Error removing lesson from course:', error);
    throw error;
  }
}

/**
 * Reorder lessons in a course
 */
export async function reorderCourseLessons(courseId: string, lessonIds: string[]): Promise<void> {
  try {
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
 * Update course duration based on lessons
 */
export async function updateCourseDuration(courseId: string): Promise<void> {
  try {
    const course = await getCourseById(courseId);
    
    if (!course) {
      throw new Error('Course not found');
    }

    // Get all lessons and sum their durations
    let totalDuration = 0;
    for (const lessonId of course.lessons) {
      const lessonDoc = await getDoc(doc(db, LESSONS_COLLECTION, lessonId));
      if (lessonDoc.exists()) {
        const lesson = lessonDoc.data();
        totalDuration += lesson.duration || 0;
      }
    }

    await updateDoc(doc(db, COURSES_COLLECTION, courseId), {
      estimatedDuration: totalDuration,
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ Course duration updated: ${courseId} (${totalDuration} minutes)`);
  } catch (error) {
    console.error('Error updating course duration:', error);
    throw error;
  }
}
