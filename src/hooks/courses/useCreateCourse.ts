// src/hooks/courses/useCreateCourse.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';

type CreateCourseArgs = {
  data: Record<string, any>;
  createdBy: string;
};

type CreateCourseResult = { id: string };

export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation<CreateCourseResult, Error, CreateCourseArgs>({
    mutationFn: async ({ data, createdBy }) => {
      const courseRef = doc(collection(db, 'courses'));
      await setDoc(courseRef, {
        ...data,
        createdBy,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { id: courseRef.id };
    },
    onSuccess: () => {
      // ✅ this is what refreshes CourseList instantly
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}
