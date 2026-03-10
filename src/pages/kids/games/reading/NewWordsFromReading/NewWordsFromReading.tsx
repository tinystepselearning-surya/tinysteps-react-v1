import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { buildMissionReturnHref } from '../missionNavigation';
import { READING_PACKS, ReadingPack } from '../../../../../content/readingPacks';

export default function NewWordsFromReading() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const kidId = searchParams.get('kidId') || localStorage.getItem('ts_active_kid_v1') || '';
  const missionReturnHref = buildMissionReturnHref(searchParams, kidId);
  const missionTileId = searchParams.get('eemTile') || 'new-words-from-reading';

  const [state, setState] = useState<'selecting' | 'reading' | 'practice' | 'results'>('selecting');
  const [selectedPack, setSelectedPack] = useState<ReadingPack | null>(null);
  const [index, setIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  // Packs that have vocabulary defined
  const packsWithVocab = READING_PACKS.filter((p) => p.vocabulary && p.vocabulary.length > 0);

  const startPack = (pack: ReadingPack) => {
    setSelectedPack(pack);
    setState('reading');
    setIndex(0);
    setScore(0);
    setSelectedOption(null);
  };

  const currentVocab = selectedPack?.vocabulary || [];

  const makeOptions = (wordIndex: number) => {
    // Use only current pack vocabulary definitions as options
    const defs = currentVocab.map((v) => v.definition);
    // Shuffle order
    const shuffled = defs.map((d, i) => ({ d, i })).sort(() => Math.random() - 0.5);
    return shuffled.map((s) => s.d);
  };

  const handleOption = (optionIndex: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(optionIndex);
    const correctDefinition = currentVocab[index].definition;
    const options = makeOptions(index);
    const isCorrect = options[optionIndex] === correctDefinition;
    if (isCorrect) setScore((s) => s + 1);

    setTimeout(() => {
      if (index < currentVocab.length - 1) {
        setIndex((i) => i + 1);
        setSelectedOption(null);
      } else {
        setState('results');
      }
    }, 1000);
  };

  const reset = () => {
    setState('selecting');
    setSelectedPack(null);
    setIndex(0);
    setSelectedOption(null);
    setScore(0);
  };

  const finishToMission = () => {
    const returnUrl = new URL(missionReturnHref, window.location.origin);
    returnUrl.searchParams.set('eemDone', missionTileId);
    navigate(`${returnUrl.pathname}${returnUrl.search}`);
  };

  if (state === 'results') {
    return (
      <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-sky-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-3xl bg-white/90 border border-slate-200 shadow-sm p-8 text-center">
          <h2 className="text-3xl font-bold text-slate-800">Well done!</h2>
          <p className="mt-4 text-lg text-slate-600">You learned {score} of {currentVocab.length} new words.</p>
          <div className="mt-8 flex justify-center gap-4">
            <button onClick={finishToMission} className="rounded-2xl px-6 py-3 bg-sky-600 text-white hover:bg-sky-700 active:scale-[0.99] transition font-semibold">Back to Mission</button>
            <button onClick={reset} className="rounded-2xl px-6 py-3 bg-slate-200 text-slate-800 hover:bg-slate-300 active:scale-[0.99] transition font-semibold">Play Again</button>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'reading' && selectedPack) {
    return (
      <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-sky-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl h-[90vh] rounded-3xl bg-white/90 border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex-shrink-0 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-800">{selectedPack.title}</h1>
            <button onClick={reset} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-[0.99] transition">&larr; Back to Stories</button>
          </div>
          <div className="flex-grow flex flex-col items-center justify-center">
            <div className="prose lg:prose-xl text-left p-4 rounded-lg bg-slate-50 border max-h-[60vh] overflow-y-auto">
              <p>{selectedPack.passage}</p>
            </div>
            <button onClick={() => setState('practice')} className="mt-8 rounded-2xl px-6 py-3 bg-sky-600 text-white hover:bg-sky-700 active:scale-[0.99] transition font-semibold">Practice New Words</button>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'practice' && selectedPack) {
    const options = makeOptions(index);
    const correctDefinition = currentVocab[index].definition;
    return (
      <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-sky-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <p className="text-center text-slate-600 mb-4">Word {index + 1} of {currentVocab.length}</p>
          <h2 className="text-3xl font-semibold text-center text-slate-800">{currentVocab[index].word}</h2>
          <p className="text-center text-sm text-slate-500 mt-2">Choose the meaning from the list below.</p>
          <div className="mt-8 grid grid-cols-1 gap-4">
            {options.map((opt, i) => {
              let cls = 'w-full text-left p-5 rounded-lg border-2 font-semibold text-lg transition-all duration-200 ';
              if (selectedOption !== null) {
                if (opt === correctDefinition) cls += 'bg-green-100 border-green-400 text-green-800 scale-105';
                else if (i === selectedOption) cls += 'bg-red-100 border-red-400 text-red-800';
                else cls += 'bg-white border-slate-300 text-slate-800 opacity-60';
                cls += ' cursor-not-allowed';
              } else {
                cls += 'bg-white border-slate-300 hover:bg-sky-50 hover:border-sky-400 text-slate-800 cursor-pointer';
              }

              return (
                <button key={i} disabled={selectedOption !== null} onClick={() => handleOption(i)} className={cls}>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-sky-50 to-indigo-50 flex flex-col items-center justify-start p-4 pt-12">
      <div className="w-full max-w-4xl text-center">
        <h1 className="text-3xl font-bold text-slate-800">New Words from Reading</h1>
        <p className="mt-2 text-lg text-slate-600">Pick a story and practice new words from it.</p>
      </div>
      <div className="mt-8 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packsWithVocab.map((pack) => (
          <button key={pack.id} onClick={() => startPack(pack)} className="p-6 rounded-2xl border border-slate-300 bg-white/80 backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer text-left">
            <h3 className="text-xl font-bold text-slate-800">{pack.title}</h3>
            <p className="mt-2 text-sm text-slate-600">Level {pack.level} • {pack.vocabulary?.length} new words</p>
          </button>
        ))}
      </div>
      <button onClick={finishToMission} className="mt-8 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-[0.99] transition">&larr; Back to Mission</button>
    </div>
  );
}
