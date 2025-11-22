import React, { useEffect, useState } from 'react';
import { TodaySession } from './components/session/TodaySession';
import { ProgressBars } from './components/progress/ProgressBars';
import { Achievements } from './components/achievements/Achievements';
import { WorksheetsList } from './components/worksheets/WorksheetsList';
import { useAuthStore } from '../../store/useAuthStore';
import DailyProgressCard from '../../components/DailyPractice/DailyProgressCard.jsx';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';

export default function KidDashboard() {
  const { user } = useAuthStore();
  const practiceLink = user?.uid ? `/kids/${user.uid}/practice-buddy` : '/kids/me/practice-buddy';
  const dailyLink = user?.uid ? `/kids/${user.uid}/daily-practice` : '/kids/me/daily-practice';
  const [dailyStatus, setDailyStatus] = useState({ score: 0, total: 5, completed: false });

  useEffect(() => {
    const fetchDaily = async () => {
      if (!user?.uid) return;
      const todayKey = new Date().toISOString().slice(0, 10);
      const q = query(
        collection(db, 'daily-practice'),
        where('studentId', '==', user.uid),
        where('dateKey', '==', todayKey),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data: any = snap.docs[0].data();
        setDailyStatus({
          score: Math.round(((data.score || 0) / 100) * (data.totalExercises || 5)),
          total: data.totalExercises || 5,
          completed: !!data.completed,
        });
      }
    };
    fetchDaily().catch(() => {});
  }, [user?.uid]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center py-6">
          <h1 className="text-4xl font-bold text-blue-800 mb-2">🎓 Tiny Steps Learning</h1>
          <p className="text-lg text-purple-600">Welcome back! Let's learn and have fun! 🌟</p>
        </div>

        {/* Today's Session - Priority */}
        <div className="w-full">
          <TodaySession />
        </div>

        {/* Daily Practice Goal */}
        <div className="grid grid-cols-1">
          <DailyProgressCard
            score={dailyStatus.score}
            total={dailyStatus.total}
            completed={dailyStatus.completed}
            onStart={() => (window.location.href = dailyLink)}
          />
        </div>

        {/* Progress and Achievements Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ProgressBars />
          <Achievements />
        </div>

        {/* Worksheets Row */}
        <div className="w-full">
          <WorksheetsList />
        </div>

        {/* Footer */}
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-2 bg-white px-6 py-3 rounded-full shadow-lg">
            <span className="text-2xl">💪</span>
            <span className="text-lg font-semibold text-gray-700">
              Keep learning, you're amazing!
            </span>
            <span className="text-2xl">🎉</span>
          </div>
        </div>
      </div>
    </div>
  );
}
