// src/pages/teacher/TeacherStudentTopicProgressPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import StudentTopicProgressEditor from '../../components/teacher/StudentTopicProgressEditorCanonical';
import { db } from '../../lib/firebaseConfig';
import TinyStepsBrand from '../../components/common/TinyStepsBrand';

type TopicProgressLocationState = {
  studentName?: unknown;
};

const normalizeDisplayName = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const TeacherStudentTopicProgressPage: React.FC = () => {
  const { kidId } = useParams<{ kidId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const routedStudentName = normalizeDisplayName(
    (location.state as TopicProgressLocationState | null)?.studentName,
  );
  const [kidName, setKidName] = useState<string | null>(() => routedStudentName || null);
  const [loadingName, setLoadingName] = useState(false);

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const returnTo = searchParams.get('returnTo');
  const fromStudents = searchParams.get('from') === 'students';
  const enrollmentId = searchParams.get('enrollmentId');
  const courseId = searchParams.get('courseId');

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

    // My Students already has the child's display name in memory. Reuse that
    // navigation state so normal in-app navigation performs zero extra reads
    // solely for the name. Direct URL loads still use the safe fallbacks below.
    if (routedStudentName) {
      setKidName(routedStudentName);
      setLoadingName(false);
      return;
    }

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

    const readName = async (collectionName: 'enrollments' | 'students' | 'kids', id: string) => {
      try {
        const snap = await getDoc(doc(db, collectionName, id));
        if (!active || !snap.exists()) return null;
        return getNameFromDoc(snap.data());
      } catch {
        // Name resolution is presentation-only. A denied legacy lookup must not
        // interrupt the teacher's already-authorized progress workflow.
        return null;
      }
    };

    setKidName(null);
    setLoadingName(true);

    const loadName = async () => {
      try {
        // The route already carries the canonical enrollment used to authorize
        // progress. Prefer that single, teacher-readable document for the name.
        if (enrollmentId) {
          const enrollmentName = await readName('enrollments', enrollmentId);
          if (!active) return;
          if (enrollmentName) {
            setKidName(enrollmentName);
            return;
          }
        }

        // Historical enrollments may not contain a display name. Fall back to
        // child documents, but treat permission-denied as a recoverable miss.
        const studentName = await readName('students', kidId);
        if (!active) return;
        if (studentName) {
          setKidName(studentName);
          return;
        }

        const kidNameFallback = await readName('kids', kidId);
        if (!active) return;
        setKidName(kidNameFallback);
      } finally {
        if (active) setLoadingName(false);
      }
    };

    void loadName();

    return () => {
      active = false;
    };
  }, [kidId, enrollmentId, routedStudentName]);

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
        courseId={courseId ?? undefined}
        onSaveAndBack={handleBack}
      />
    </div>
  );
};

export default TeacherStudentTopicProgressPage;
