// src/pages/teacher/TeacherStudentTopicProgressPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import StudentTopicProgressEditor from '../../components/teacher/StudentTopicProgressEditorCanonical';
import { db } from '../../lib/firebaseConfig';
import TinyStepsBrand from '../../components/common/TinyStepsBrand';

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
    <div className="space-y-3 px-4 pb-6 pt-3">
      <div className="sticky top-0 z-20 -mx-4 border-b border-slate-200 bg-white/90 px-4 py-2.5 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <TinyStepsBrand subtitle="Teacher workspace" className="shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Teacher
              </div>
              <div className="truncate text-sm font-semibold text-slate-900">
                {kidName ?? 'Student'} • Topic Progress
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="text-sm font-semibold text-slate-700 hover:text-slate-900"
            >
              ← {fromStudents || returnTo ? 'Back to My Students' : 'Back'}
            </button>
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
      </div>

      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
        <p className="font-medium text-slate-700">
          Student: {kidName ?? 'Student'}
        </p>
        {loadingName && (
          <p className="text-slate-500">Loading student name…</p>
        )}
      </header>

      <StudentTopicProgressEditor
        kidId={kidId}
        kidName={kidName ?? undefined}
        enrollmentId={enrollmentId ?? undefined}
        onSaveAndBack={handleBack}
      />
    </div>
  );
};

export default TeacherStudentTopicProgressPage;
