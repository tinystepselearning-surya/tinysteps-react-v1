import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import WorksheetGenerator from '../../components/WorksheetGenerator/WorksheetGenerator.jsx';
import { db } from '../../lib/firebaseConfig';
import { useAuthStore } from '../../store/useAuthStore';

type Student = { id: string; name?: string; studentName?: string; classId?: string };

export default function WorksheetGeneratorPage() {
  const { teacherId } = useParams();
  const { user, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [recentTemplates, setRecentTemplates] = useState<any[]>([]);

  useEffect(() => {
    if (!teacherId) return;
    const fetchStudents = async () => {
      try {
        const q = query(
          collection(db, 'students'),
          where('teacherId', '==', teacherId),
          orderBy('studentName')
        );
        const snap = await getDocs(q);
        const list: Student[] = [];
        snap.forEach((doc) => list.push({ id: doc.id, ...(doc.data() as any) }));
        setStudents(list);
      } catch (err) {
        // ignore fetch errors in UI
      }
    };

    const fetchWorksheets = async () => {
      try {
        const q = query(
          collection(db, 'worksheets'),
          where('teacherId', '==', teacherId),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        const snap = await getDocs(q);
        const list: any[] = [];
        snap.forEach((doc) => list.push({ id: doc.id, ...(doc.data() as any) }));
        setRecentTemplates(list);
      } catch (err) {
        // ignore fetch errors in UI
      }
    };

    fetchStudents();
    fetchWorksheets();
  }, [teacherId]);

  useEffect(() => {
    if (isLoading) return;
    if (!user || user.role !== 'teacher' || user.uid !== teacherId) {
      navigate('/unauthorized', { replace: true });
    }
  }, [isLoading, navigate, teacherId, user]);

  const goWithTopic = (topic: string) => {
    // For now navigate to same page; hook will allow quick adjustments
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-white py-6">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-indigo-600 font-semibold">Teacher Portal</p>
            <h1 className="text-3xl font-bold text-gray-900">
              Worksheet Generator <span role="img" aria-label="sparkle">✨</span>
            </h1>
            <p className="text-sm text-gray-600">
              Create worksheets, save to your library, and share with parents.
            </p>
          </div>
          <Link to={`/teacher/${teacherId}/dashboard`} className="text-sm text-indigo-700 hover:underline font-semibold">
            ← Back to dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <WorksheetGenerator teacherId={teacherId as string} />
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Assigned students</h3>
              {students.length === 0 ? (
                <p className="text-xs text-gray-500">No students found.</p>
              ) : (
                <ul className="space-y-1 text-sm text-gray-700">
                  {students.map((s) => (
                    <li key={s.id} className="flex justify-between">
                      <span>{s.name || s.studentName || 'Student'}</span>
                      <span className="text-xs text-gray-400">{s.classId || ''}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Quick Actions</h3>
                <span className="text-xs text-gray-500">Shortcuts</span>
              </div>
              <button
                onClick={() => goWithTopic('Phonics')}
                className="w-full px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 transition"
              >
                Generate Phonics Worksheet
              </button>
              <button
                onClick={() => goWithTopic('Grammar')}
                className="w-full px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition"
              >
                Generate Grammar Worksheet
              </button>
              <div className="pt-2">
                <h4 className="text-xs uppercase text-gray-500 font-semibold mb-1">
                  Recent templates
                </h4>
                {recentTemplates.length === 0 ? (
                  <p className="text-xs text-gray-500">Nothing yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {recentTemplates.map((tpl) => (
                      <li key={tpl.id} className="p-2 border border-gray-100 rounded-lg">
                        <div className="text-sm font-semibold text-gray-900">
                          {tpl.topic} · {tpl.level}
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {tpl.content?.slice(0, 120) || 'No content'}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
