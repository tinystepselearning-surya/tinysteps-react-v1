// src/pages/teacher/TeacherStudentTopicProgressPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import StudentTopicProgressEditor from '../../components/teacher/StudentTopicProgressEditor';

const TeacherStudentTopicProgressPage: React.FC = () => {
  const { kidId } = useParams<{ kidId: string }>();
  const [kidName, setKidName] = useState<string | null>(null);
  const [loadingName, setLoadingName] = useState(false);

  useEffect(() => {
    if (!kidId) return;

    setLoadingName(true);
    const ref = doc(db, 'students', kidId);

    getDoc(ref)
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data() as any;
          setKidName(
            data.fullName ??
              data.displayName ??
              data.name ??
              null,
          );
        } else {
          setKidName(null);
        }
      })
      .finally(() => setLoadingName(false));
  }, [kidId]);

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
      <header>
        <h1 className="text-xl font-semibold text-slate-900">
          Student Topic Progress
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Student ID: {kidId}
        </p>
        {loadingName && (
          <p className="mt-1 text-xs text-slate-500">
            Loading student name…
          </p>
        )}
        {!loadingName && kidName && (
          <p className="mt-1 text-sm text-slate-700">
            Name: {kidName}
          </p>
        )}
      </header>

      <StudentTopicProgressEditor
        kidId={kidId}
        kidName={kidName ?? undefined}
      />
    </div>
  );
};

export default TeacherStudentTopicProgressPage;
