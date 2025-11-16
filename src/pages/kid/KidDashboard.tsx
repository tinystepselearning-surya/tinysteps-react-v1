import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TodaySession } from './components/session/TodaySession';
import { ProgressBars } from './components/progress/ProgressBars';
import { Achievements } from './components/achievements/Achievements';
import { WorksheetsList } from './components/worksheets/WorksheetsList';
import { GamesList } from './components/games/GamesList';
import { useAuthStore } from '../../store/useAuthStore';
import DailyProgressCard from '../../components/DailyPractice/DailyProgressCard';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';

export default function KidDashboard() {
  const { user } = useAuthStore();
  const practiceLink = user?.uid ? `/kids/${user.uid}/practice-buddy` : '/kids/me/practice-buddy';
  const dailyLink = user?.uid ? `/kids/${user.uid}/daily-practice` : '/kids/me/daily-practice';
  const gameBase = user?.uid ? `/kids/${user.uid}` : '/kids/me';
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

        {/* Worksheets and Games Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <WorksheetsList />
          <GamesList />
        </div>

        {/* Games Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-indigo-600 font-semibold uppercase tracking-wide">Games</p>
              <h3 className="text-xl font-bold text-gray-900">Play and learn with Tiny Steps AI</h3>
            </div>
            <span className="text-xs text-gray-500">New! Try SpellBee, Maze, Bingo</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <GameCard title="SpellBee Trainer" desc="Spell words and get instant feedback" link={`${gameBase}/spellbee`} emoji="🐝" />
            <GameCard title="Phonics Maze" desc="Follow sounds to escape the maze" link={`${gameBase}/phonics-maze`} emoji="🌀" />
            <GameCard title="Sight Word Bingo" desc="Mark words that match the clue" link={`${gameBase}/bingo`} emoji="🎯" />
            <GameCard title="Grammar Builder" desc="Pick grammar choices to build a story" link={`${gameBase}/grammar-builder`} emoji="📖" />
            <GameCard title="Speaking Stage" desc="Practice prompts with your voice" link={`${gameBase}/speaking`} emoji="🎤" />
            <GameCard title="Reading Adventure" desc="Read chapters and answer questions" link={`${gameBase}/reading-adventure`} emoji="📚" />
          </div>
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

function GameCard({ title, desc, link, emoji }: { title: string; desc: string; link: string; emoji?: string }) {
  return (
    <Link
      to={link}
      className="block p-4 rounded-2xl bg-white border border-indigo-100 shadow hover:shadow-md transition space-y-2"
    >
      <div className="flex items-center justify-between">
        <p className="text-xl">{emoji || '🎮'}</p>
        <span className="text-xs text-indigo-500 font-semibold uppercase">Play</span>
      </div>
      <p className="text-lg font-bold text-gray-900">{title}</p>
      <p className="text-sm text-gray-600">{desc}</p>
    </Link>
  );
}
