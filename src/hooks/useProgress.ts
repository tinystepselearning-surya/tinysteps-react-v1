import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import { StudentProgress, TeacherStudent } from '../types/Teacher';

export const useProgress = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [progressData, setProgressData] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    // Fetch students assigned to this teacher
    const studentsQuery = query(
      collection(db, 'kids'),
      where('teacherId', '==', user.uid)
    );

    const unsubscribeStudents = onSnapshot(
      studentsQuery,
      (snapshot) => {
        const studentsList: TeacherStudent[] = snapshot.docs.map(doc => ({
          id: doc.id,
          fullName: doc.data().fullName || '',
          grade: doc.data().grade,
          courseNames: doc.data().courseNames || [],
          progressStatus: doc.data().progressStatus || 'on_track',
          lastSessionDate: doc.data().lastSessionDate,
          avatarUrl: doc.data().avatarUrl,
        }));
        setStudents(studentsList);
      },
      (err) => {
        console.error('Error fetching students:', err);
        setError('Failed to load students');
      }
    );

    // Fetch progress data for students
    const progressQuery = query(
      collection(db, 'progress'),
      where('teacherId', '==', user.uid),
      orderBy('lastSession', 'desc')
    );

    const unsubscribeProgress = onSnapshot(
      progressQuery,
      (snapshot) => {
        const progressList: StudentProgress[] = snapshot.docs.map(doc => ({
          studentId: doc.id,
          studentName: doc.data().studentName || '',
          phonics: doc.data().phonics || 0,
          grammar: doc.data().grammar || 0,
          speaking: doc.data().speaking || 0,
          lastSession: doc.data().lastSession,
          attendanceRate: doc.data().attendanceRate || 0,
        }));
        setProgressData(progressList);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching progress:', err);
        setError('Failed to load progress data');
        setLoading(false);
      }
    );

    return () => {
      unsubscribeStudents();
      unsubscribeProgress();
    };
  }, [user?.uid]);

  return {
    students,
    progressData,
    loading,
    error,
  };
};