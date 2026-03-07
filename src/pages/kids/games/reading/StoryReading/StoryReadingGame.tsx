
import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { buildMissionReturnHref } from "../missionNavigation";
import { READING_PACKS, ReadingPack } from "../../../../../content/readingPacks";

// ============================================================================
// COMPONENT
// ============================================================================

export default function StoryReadingGame() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const kidId = searchParams.get("kidId") || localStorage.getItem("ts_active_kid_v1") || "";
  const missionReturnHref = buildMissionReturnHref(searchParams, kidId);
  const missionTileId = searchParams.get("eemTile") || 'story-reading';

  const [selectedPack, setSelectedPack] = useState<ReadingPack | null>(null);

  const handleFinish = () => {
    const returnUrl = new URL(missionReturnHref, window.location.origin);
    // For now, we just navigate back. We can add completion logic later.
    // returnUrl.searchParams.set("eemDone", missionTileId);
    navigate(`${returnUrl.pathname}${returnUrl.search}`);
  };

  const selectPack = (pack: ReadingPack) => {
    setSelectedPack(pack);
  };
  
  const backToSelection = () => {
    setSelectedPack(null);
  }

  if (selectedPack) {
    return (
      <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-sky-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl h-[90vh] rounded-3xl bg-white/90 border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex-shrink-0 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-800">{selectedPack.title}</h1>
            <button
              onClick={backToSelection}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-[0.99] transition"
            >
              &larr; Back to Stories
            </button>
          </div>
          <div className="flex-grow flex flex-col items-center justify-center">
            <div className="prose lg:prose-xl text-left p-4 rounded-lg bg-slate-50 border max-h-[60vh] overflow-y-auto">
              <p>{selectedPack.passage}</p>
            </div>
            <button 
              onClick={handleFinish}
              className="mt-8 rounded-2xl px-6 py-3 bg-sky-600 text-white hover:bg-sky-700 active:scale-[0.99] transition font-semibold"
            >
              I'm finished reading!
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-sky-50 to-indigo-50 flex flex-col items-center justify-start p-4 pt-12">
        <div className="w-full max-w-4xl text-center">
            <h1 className="text-3xl font-bold text-slate-800">Story Reading</h1>
            <p className="mt-2 text-lg text-slate-600">Choose a story to read.</p>
        </div>
        <div className="mt-8 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {READING_PACKS.map((pack: ReadingPack) => (
                <button
                    key={pack.id}
                    onClick={() => selectPack(pack)}
                    className="p-6 rounded-2xl border border-slate-300 bg-white/80 backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer text-left"
                >
                    <h3 className="text-xl font-bold text-slate-800">{pack.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">Level {pack.level}</p>
                </button>
            ))}
        </div>
         <button
            onClick={handleFinish}
            className="mt-8 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-[0.99] transition"
        >
            &larr; Back to Mission
        </button>
    </div>
  );
}
