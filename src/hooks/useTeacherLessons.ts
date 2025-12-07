import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';
import type { TeacherLesson, LessonCategory } from '../types/lessonLibrary';

interface UseTeacherLessonsResult {
  lessons: TeacherLesson[];
  isLoading: boolean;
  error: Error | null;
}

const toTeacherLesson = (id: string, data: any): TeacherLesson => ({
  id,
  title: data.title || '',
  category: data.category as LessonCategory,
  level: data.level,
  ageRange: data.ageRange,
  durationMinutes: data.durationMinutes,
  tags: data.tags || [],
  canvaUrl: data.canvaUrl,
  thumbnailUrl: data.thumbnailUrl,
  isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
  isDraft: !!data.isDraft,
});

export const useTeacherLessons = (category?: LessonCategory): UseTeacherLessonsResult => {
  const [lessons, setLessons] = useState<TeacherLesson[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const q = category
      ? query(
          collection(db, 'teacherLessons'),
          where('category', '==', category),
          orderBy('createdAt', 'desc')
        )
      : query(collection(db, 'teacherLessons'), orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        try {
          const data = snapshot.docs
            .map((d) => ({ id: d.id, ...(d.data() as any) }))
            .filter((doc: any) => doc.isDraft !== true) // exclude drafts
            .map((doc: any) => toTeacherLesson(doc.id, doc));

          setLessons(data);
          setIsLoading(false);
        } catch (err: any) {
          console.error('useTeacherLessons mapping error', err);
          setError(err as Error);
          setIsLoading(false);
        }
      },
      (err) => {
        console.error('useTeacherLessons snapshot error', err);
        setError(err as Error);
        setIsLoading(false);
      }
    );

    return () => unsub();
  }, [category]);

  return { lessons, isLoading, error };
};
