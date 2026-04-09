// @ts-nocheck
import React, { useState } from 'react';

const LevelTabs = ({ levels }: any) => {
  const [active, setActive] = useState(levels[0]);
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-5xl rounded-3xl bg-white/90 p-6 shadow-card-hover">
        <div className="flex flex-wrap gap-3">
          {levels.map((level: any) => (
            <button
              key={level.name}
              onClick={() => setActive(level)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                active.name === level.name ? 'bg-gradient-to-r from-[#ff8f5c] to-[#59c3ff] text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {level.name}
            </button>
          ))}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <ul className="space-y-2 text-sm text-gray-700">
            {active.outcomes.map((item: string) => (
              <li key={item} className="flex items-start gap-2"><span>✅</span>{item}</li>
            ))}
          </ul>
          <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-600">
            <div>
              <div className="font-semibold text-gray-900">Download curriculum</div>
              <p>Get the full lesson-by-lesson plan for {active.name}. Includes home practice + assessments.</p>
              <a href={active.pdf || '/curriculum'} className="mt-2 inline-flex items-center text-tiny-blue-600 hover:text-tiny-blue-800">Download PDF →</a>
            </div>
            {active.courseHref && (
              <div className="border-t border-gray-200 pt-3">
                <div className="font-semibold text-gray-900">View Program Details</div>
                <a href={active.courseHref} className="mt-1 inline-flex items-center text-emerald-600 hover:text-emerald-800 transition">Explore {active.name} course details →</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LevelTabs;
