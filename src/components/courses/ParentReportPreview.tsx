// @ts-nocheck
import React from 'react';
import { MasteryProgress } from '../common/MasteryProgress';

export const ParentReportPreview: React.FC = () => {
  return (
    <div className="rounded-2xl bg-white p-5 shadow ring-1 ring-slate-200">
      <div className="mb-3 font-semibold text-gray-900">📊 Weekly Progress Summary</div>
      <div className="mb-3 grid grid-cols-1 items-center gap-4 md:grid-cols-3">
        <div className="space-y-1 text-sm text-gray-700">
          <div>Child: Aditya</div>
          <div>Week: 4</div>
          <div>Course: Phonics Foundation</div>
        </div>
        <div className="flex items-center gap-3">
          <MasteryProgress percent={45} />
          <div className="text-sm text-gray-700">Developing</div>
        </div>
        <div className="text-xs text-gray-600">
          Trend: 15% → 25% → 38% → 45%
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="font-medium">✓ Mastered This Week:</div>
          <ul className="list-disc pl-5 text-sm">
            <li>Digraph identification (sh, ch, th)</li>
            <li>CVC word formation (6/8 correct)</li>
            <li>Sound-motion association</li>
          </ul>
        </div>
        <div>
          <div className="font-medium">⚠ Needs Practice:</div>
          <ul className="list-disc pl-5 text-sm">
            <li>Blending speed</li>
            <li>“Qu” digraph</li>
          </ul>
        </div>
      </div>
      <div className="mt-3 text-sm text-gray-700">
        💡 Tips: Play "Digraph Detective" 5 mins • Read the decodable reader 10 mins • Practice writing CVC words 5 mins
      </div>
      <div className="mt-3 text-right text-sm text-primary-600">[Download Full Report PDF]</div>
    </div>
  );
};

