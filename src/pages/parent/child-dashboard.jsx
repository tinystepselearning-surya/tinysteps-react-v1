import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { app, db } from '../../lib/firebaseConfig';
import SuggestedActivities from '../../components/parent/SuggestedActivities';
import { useAuthStore } from '../../store/useAuthStore';

const functionsClient = getFunctions(app, 'us-central1');
const generateParentInsights = httpsCallable(functionsClient, 'generateParentInsights');

export default function ParentChildDashboard() {
  const { parentId, childId } = useParams();
  const { user, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [insights, setInsights] = useState({ strengths: [], weaknesses: [], suggestions: [] });
  const [trend, setTrend] = useState([]);
  const [today, setToday] = useState({ completed: false, score: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!user || user.role !== 'parent' || user.uid !== parentId) {
      navigate('/unauthorized', { replace: true });
    }
  }, [isLoading, navigate, parentId, user]);

  useEffect(() => {
    const load = async () => {
      if (!childId) return;
      setLoading(true);
      try {
        const studentSnap = await getDoc(doc(db, 'students', childId));
        if (studentSnap.exists()) setProfile(studentSnap.data());

        // Today’s practice
        const todayKey = new Date().toISOString().slice(0, 10);
        const todayQ = query(
          collection(db, 'daily-practice'),
          where('studentId', '==', childId),
          where('dateKey', '==', todayKey),
          limit(1)
        );
        const todaySnap = await getDocs(todayQ);
        if (!todaySnap.empty) {
          const data = todaySnap.docs[0].data();
          setToday({
            completed: !!data.completed,
            score: Math.round(((data.score || 0) / 100) * (data.totalExercises || 5)),
            total: data.totalExercises || 5,
          });
        }

        // 7-day trend
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const historyQ = query(
          collection(db, 'practice-history'),
          where('studentId', '==', childId),
          orderBy('date', 'desc'),
          limit(20)
        );
        const histSnap = await getDocs(historyQ);
        const points = histSnap.docs
          .map((d) => {
            const data = d.data();
            const ts = data.date?.toDate ? data.date.toDate() : new Date();
            return { date: ts.toISOString().slice(5, 10), score: data.totalScore || 0 };
          })
          .slice(0, 7)
          .reverse();
        setTrend(points);

        // Insights (cached in Firestore if present)
        const insightDoc = await getDoc(
          doc(db, 'parent-insights', childId, 'daily', todayKey)
        );
        if (insightDoc.exists()) {
          setInsights(insightDoc.data());
        } else {
          const avgAccuracy =
            points.length > 0
              ? Math.round(points.reduce((s, p) => s + (p.score || 0), 0) / points.length)
              : 0;
          const resp = await generateParentInsights({
            childId,
            sessions: points.length,
            avgAccuracy,
            strengths: [],
            weaknesses: [],
          });
          setInsights(resp?.data || {});
        }
      } catch (err) {
        // ignore errors for now
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [childId]);

  const accuracyTrend = useMemo(() => trend || [], [trend]);

  return (
    <div className="min-h-screen bg-muted/20 py-6">
      <div className="max-w-6xl mx-auto px-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-indigo-600 font-semibold">Parent Portal</p>
            <h1 className="text-3xl font-bold text-gray-900">Child Dashboard</h1>
            {profile && (
              <p className="text-sm text-gray-600">
                {profile.studentName || 'Your child'} · Age {profile.age || '—'} · Level {profile.level || '—'}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm font-semibold">
              View detailed report
            </button>
            <button className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm font-semibold">
              Print summary
            </button>
          </div>
        </div>

        {loading && <div className="text-sm text-gray-500">Loading child data…</div>}

        {!loading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card title="Today's progress" subtitle={`${today.score}/${today.total} exercises`}>
                <p className="text-sm text-gray-600">
                  {today.completed ? 'Completed today 🎉' : 'Not started yet'}
                </p>
              </Card>
              <Card title="Strengths">
                <ul className="list-disc pl-4 text-sm text-gray-700 space-y-1">
                  {(insights.strengths || []).length === 0 && <li>We are still learning your child’s strengths.</li>}
                  {(insights.strengths || []).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </Card>
              <Card title="Needs practice">
                <ul className="list-disc pl-4 text-sm text-gray-700 space-y-1">
                  {(insights.weaknesses || []).length === 0 && <li>We’ll suggest focus areas soon.</li>}
                  {(insights.weaknesses || []).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">7-day accuracy trend</h3>
                {accuracyTrend.length === 0 ? (
                  <p className="text-sm text-gray-500">No data yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={accuracyTrend}>
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
              <Card title="Suggested activities">
                <SuggestedActivities suggestions={insights.suggestions || []} />
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Card({ title, subtitle, children }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-1">
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      <div className="text-sm text-gray-800">{children}</div>
    </div>
  );
}
