import { useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';

export type CreateCourseArgs = {
  id: string;                // ✅ slug → courses/{id}
  data: Record<string, any>;  // you can replace with your Course type later
  createdBy: string;
};

export type CreateCourseResult = { id: string };

export function useCreateCourse() {
  const qc = useQueryClient();

  return useMutation<CreateCourseResult, Error, CreateCourseArgs>({
    mutationFn: async ({ id, data, createdBy }) => {
      const ref = doc(db, 'courses', id);

      // prevent accidental overwrite
      const existing = await getDoc(ref);
      if (existing.exists()) {
        throw new Error(`Course already exists with id: ${id}`);
      }

      await setDoc(ref, {
        ...data,
        id,                 // ✅ keep inside doc too (useful)
        courseId: id,        // ✅ keep inside doc too (useful)
        createdBy,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { id };
    },

    onSuccess: () => {
      // invalidate anything that lists courses
      qc.invalidateQueries({ queryKey: ['courses'] });
      qc.invalidateQueries({ queryKey: ['adminCourses'] });
    },
  });
}
