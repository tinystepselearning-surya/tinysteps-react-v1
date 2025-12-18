// src/pages/KidsBalloonPop.tsx
import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const KidsBalloonPop: React.FC = () => {
  const [searchParams] = useSearchParams();
  const kidId = searchParams.get('kidId') || '';

  const withKid = (path: string) => {
    if (!kidId) return path;
    const sep = path.includes('?') ? '&' : '?';
    return path.includes('kidId=') ? path : `${path}${sep}kidId=${encodeURIComponent(kidId)}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-12 px-4">
      <div className="w-full max-w-4xl mx-auto text-center mb-8">
        <h1 className="text-5xl font-bold">Balloon Pop (Jolly Levels)</h1>
        <p className="text-lg text-gray-500 mt-2">Pop the balloon with the correct sound</p>
        <p className="text-sm text-gray-400 mt-2">Kid: {kidId || 'Unknown'}</p>
      </div>

      <div className="w-full max-w-3xl mx-auto p-6 bg-white/5 rounded-2xl border border-white/10">
        <h2 className="text-2xl font-semibold mb-3">Coming soon</h2>
        <p className="text-sm text-white/80">Levels (sample):</p>
        <div className="mt-3 text-lg font-mono">Level 1 letters: s a t i p n</div>
      </div>

      <div className="w-full max-w-3xl mx-auto mt-8 flex justify-center">
        <Link
          to={withKid('/kids/games/phonics')}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full text-sm font-semibold"
        >
          ← Back to Phonics Library
        </Link>
      </div>
    </div>
  );
};

export default KidsBalloonPop;
