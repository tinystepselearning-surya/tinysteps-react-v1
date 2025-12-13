// src/hooks/courses/useUpdateCourse.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';

type Params = {
  courseId: string;
  data: any;
  updatedBy: string;
};

export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, data, updatedBy }: Params) => {
      await updateDoc(doc(db, 'courses', courseId), {
        ...data,
        updatedBy,
        updatedAt: serverTimestamp(),
      });
      return { id: courseId };
    },
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', vars.courseId] });
    },
  });
}
