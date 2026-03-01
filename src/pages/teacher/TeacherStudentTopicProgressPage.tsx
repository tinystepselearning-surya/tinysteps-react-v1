// src/pages/teacher/TeacherStudentTopicProgressPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import StudentTopicProgressEditor from '../../components/teacher/StudentTopicProgressEditor';
import { db } from '../../lib/firebaseConfig';

const TeacherStudentTopicProgressPage: React.FC = () => {
  const { kidId } = useParams<{ kidId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [kidName, setKidName] = useState<string | null>(null);
  const [loadingName, setLoadingName] = useState(false);

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const returnTo = searchParams.get('returnTo');
  const fromStudents = searchParams.get('from') === 'students';
  const enrollmentId = searchParams.get('enrollmentId');

  const handleBack = () => {
    if (returnTo) {
      navigate(returnTo);
      return;
    }
    if (fromStudents) {
      navigate('/teacher?tab=students');
      return;
    }
    navigate(-1);
  };

  useEffect(() => {
    if (!kidId) return;

    let active = true;
    const getNameFromDoc = (data: any) =>
      data?.fullName ??
      data?.displayName ??
      data?.studentName ??
      data?.kidName ??
      data?.childName ??
      data?.name ??
      (data?.firstName || data?.lastName
        ? `${data?.firstName ?? ''} ${data?.lastName ?? ''}`.trim()
        : null);

    setLoadingName(true);

    const loadName = async () => {
      const kidSnap = await getDoc(doc(db, 'kids', kidId));
      if (!active) return;
      if (kidSnap.exists()) {
        setKidName(getNameFromDoc(kidSnap.data()));
        setLoadingName(false);
        return;
      }

      const studentSnap = await getDoc(doc(db, 'students', kidId));
      if (!active) return;
      if (studentSnap.exists()) {
        setKidName(getNameFromDoc(studentSnap.data()));
        setLoadingName(false);
        return;
      }

      if (enrollmentId) {
        const enrollmentSnap = await getDoc(doc(db, 'enrollments', enrollmentId));
        if (!active) return;
        if (enrollmentSnap.exists()) {
          setKidName(getNameFromDoc(enrollmentSnap.data()));
          setLoadingName(false);
          return;
        }
      }

      setKidName(null);
      setLoadingName(false);
    };

    loadName();

    return () => {
      active = false;
    };
  }, [kidId, enrollmentId]);

  if (!kidId) {
    return (
      <div className="px-4 py-8 text-sm text-slate-600">
        No student selected. Open this page with a valid student ID
        (e.g. via <code>/teacher/students/&lt;kidUid&gt;/topic-progress</code>).
      </div>
    );
  }

  return (
    <div className="px-4 pb-8 space-y-4">
      <div className="sticky top-0 z-20 -mx-4 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            ← {fromStudents || returnTo ? 'Back to My Students' : 'Back'}
          </button>
          <div className="text-sm font-semibold text-slate-900">
            {kidName ?? 'Student'} • Topic Progress
          </div>
          <button
            type="button"
            onClick={handleBack}
            className="text-sm font-semibold text-slate-500 hover:text-slate-900"
            aria-label="Close"
          >
            ✕ Close
          </button>
        </div>
      </div>

      <header>
        <p className="text-sm text-slate-700">
          Student: {kidName ?? kidId ?? 'Student'}
        </p>
        {loadingName && (
          <p className="mt-1 text-xs text-slate-500">Loading student name…</p>
        )}
        {kidName && (
          <p className="mt-1 text-xs text-slate-500">Student ID: {kidId}</p>
        )}
      </header>

      <StudentTopicProgressEditor
        kidId={kidId}
        kidName={kidName ?? undefined}
        onSaveAndBack={handleBack}
      />
    </div>
  );
};

export default TeacherStudentTopicProgressPage;
