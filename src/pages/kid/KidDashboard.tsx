import React from 'react';

export default function KidDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Games & Learning</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 bg-white rounded shadow cursor-pointer hover:shadow-lg">
            <div className="bg-blue-200 h-32 rounded mb-2 flex items-center justify-center">
              🎮
            </div>
            <p className="font-semibold">Game {i}</p>
            <p className="text-sm text-gray-600">Play now</p>
          </div>
        ))}
      </div>
    </div>
  );
}