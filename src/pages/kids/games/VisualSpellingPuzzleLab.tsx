import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  VISUAL_SPELLING_PUZZLES,
  VISUAL_SPELLING_STAGES,
  visualSpellingAnswer,
  type VisualSpellingPuzzle,
  type VisualSpellingStage,
} from '../../../lib/visualSpellingPuzzles';

type Feedback = 'correct' | 'retry' | null;

export default function VisualSpellingPuzzleLab() {
  const navigate = useNavigate();
  const [stageId, setStageId] = useState<VisualSpellingStage | null>(null);
  const [index, setIndex] = useState(0);
  const [chosenIndices, setChosenIndices] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [revealed, setRevealed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [independentCorrect, setIndependentCorrect] = useState(0);
  const [finished, setFinished] = useState(false);

  const puzzles = useMemo(
    () => VISUAL_SPELLING_PUZZLES.filter(puzzle => puzzle.stage === stageId),
    [stageId]
  );
  const puzzle = puzzles[index] as VisualSpellingPuzzle | undefined;

  const startStage = (id: VisualSpellingStage) => {
    setStageId(id);
    setIndex(0);
    setChosenIndices([]);
    setFeedback(null);
    setRevealed(false);
    setShowHint(false);
    setAttempted(false);
    setIndependentCorrect(0);
    setFinished(false);
  };

  const returnToHub = () => navigate('/free-english-games-for-kids');

  const submit = (value: string) => {
    if (!puzzle || feedback === 'correct') return;
    const correct = value.toLocaleLowerCase('en') === visualSpellingAnswer(puzzle).toLocaleLowerCase('en');
    if (correct) {
      if (!attempted && !showHint) setIndependentCorrect(count => count + 1);
      setFeedback('correct');
    } else {
      setAttempted(true);
      setFeedback('retry');
    }
  };

  const revealAnswer = () => {
    if (!puzzle || feedback === 'correct') return;
    setAttempted(true);
    setRevealed(true);
    setFeedback('correct');
  };

  const pickTile = (tileIndex: number) => {
    if (!puzzle || puzzle.kind !== 'arrange' || feedback === 'correct') return;
    if (chosenIndices.includes(tileIndex) || tileIndex < 0 || tileIndex >= puzzle.tiles.length) return;
    setChosenIndices(previous => [...previous, tileIndex]);
    setFeedback(null);
  };

  const nextPuzzle = () => {
    if (index + 1 >= puzzles.length) {
      setFinished(true);
      return;
    }
    setIndex(current => current + 1);
    setChosenIndices([]);
    setFeedback(null);
    setRevealed(false);
    setShowHint(false);
    setAttempted(false);
  };

  const complete = puzzle?.kind === 'arrange' && chosenIndices.length === puzzle.tiles.length;
  const assembledWord = puzzle?.kind === 'arrange'
    ? chosenIndices.map(tileIndex => puzzle.tiles[tileIndex]).join('')
    : '';

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-950 via-slate-900 to-sky-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-cyan-200">Tiny Steps · Learning Games</p>
            <h1 className="text-3xl font-black sm:text-4xl">Spelling Puzzle Lab</h1>
            <p className="mt-2 text-sm text-slate-200">Free for ages 8–10+ · No login · No sound · Nothing saved</p>
          </div>
          <button type="button" onClick={returnToHub}
            className="rounded-full border border-white/30 px-5 py-3 text-sm font-semibold hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            Back to Games Hub
          </button>
        </header>

        {!stageId && (
          <section aria-labelledby="choose-stage-heading">
            <h2 id="choose-stage-heading" className="mb-4 text-xl font-bold">Choose a puzzle challenge</h2>
            <p className="mb-6 text-slate-200">Mix letters, spot incorrect spellings, fill missing parts and sort words by their written patterns. Start at any level that feels right.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {VISUAL_SPELLING_STAGES.map((stage, i) => (
                <button key={stage.id} type="button" onClick={() => startStage(stage.id)}
                  className="rounded-3xl border border-white/20 bg-white/10 p-6 text-left shadow-lg transition hover:border-cyan-200 hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                  <span className="text-xs font-bold uppercase tracking-widest text-cyan-200">Level {i + 1}</span>
                  <span className="mt-2 block text-2xl font-black">{stage.title}</span>
                  <span className="mt-2 block text-sm text-slate-200">{stage.subtitle}</span>
                  <span className="mt-4 block text-xs font-semibold text-emerald-200">{VISUAL_SPELLING_PUZZLES.filter(p => p.stage === stage.id).length} puzzles · untimed</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {stageId && finished && (
          <section className="rounded-3xl bg-white p-6 text-slate-900 shadow-xl sm:p-10" aria-live="polite">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-700">Level complete</p>
            <h2 className="mt-2 text-3xl font-black">Nice word work!</h2>
            <p className="mt-3 text-lg">You completed {puzzles.length} visual spelling puzzles.</p>
            <p className="mt-2 text-sm">Independent first-try answers: {independentCorrect} of {puzzles.length}. Answers reached after hints or retries still count as practice.</p>
            <p className="mt-4 text-sm text-slate-600">For lasting spelling confidence, return to these words later and try writing them in your own sentences without looking.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => startStage(stageId)} className="rounded-xl bg-indigo-700 px-5 py-3 font-bold text-white hover:bg-indigo-800">Replay this level</button>
              <button type="button" onClick={() => setStageId(null)} className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-indigo-900">Choose another level</button>
            </div>
          </section>
        )}

        {stageId && puzzle && !finished && (
          <section className="rounded-3xl bg-white p-5 text-slate-900 shadow-xl sm:p-9" aria-labelledby="puzzle-heading">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800">
                {VISUAL_SPELLING_STAGES.find(stage => stage.id === stageId)?.title}
              </span>
              <span className="text-sm font-semibold text-slate-600">Puzzle {index + 1} of {puzzles.length}</span>
            </div>
            <div aria-hidden="true" className="mb-6 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: ((index + (feedback === 'correct' ? 1 : 0)) / puzzles.length * 100) + '%' }} />
            </div>
            <h2 id="puzzle-heading" className="text-2xl font-black">
              {puzzle.kind === 'arrange' ? 'Build the correct word' :
               puzzle.kind === 'correct' ? 'Spot the correct spelling' :
               puzzle.kind === 'missing' ? 'Fill the missing letters' :
               'Sort the word'}
            </h2>
            <p className="mt-3 rounded-xl bg-sky-50 p-4 text-lg text-slate-800"><strong>Clue:</strong> {puzzle.clue}</p>

            {puzzle.kind === 'arrange' && (
              <div className="mt-6">
                <p className="mb-3 text-sm font-semibold text-slate-600">Tap or drag tiles into the answer. Use Undo to change a choice.</p>
                <div
                  aria-label="Word assembly area"
                  onDragOver={event => event.preventDefault()}
                  onDrop={event => {
                    event.preventDefault();
                    const raw = event.dataTransfer.getData('text/plain');
                    if (/^\d+$/.test(raw)) pickTile(Number(raw));
                  }}
                  className="flex min-h-20 flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50 p-3">
                  {chosenIndices.length ? chosenIndices.map((tileIndex, position) => (
                    <span key={position} className="rounded-lg bg-indigo-700 px-4 py-3 text-xl font-bold text-white">{puzzle.tiles[tileIndex]}</span>
                  )) : <span className="text-sm text-slate-500">Drop tiles here or tap them below</span>}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {puzzle.tiles.map((tile, tileIndex) => (
                    <button
                      key={tileIndex}
                      type="button"
                      disabled={chosenIndices.includes(tileIndex) || feedback === 'correct'}
                      draggable={!chosenIndices.includes(tileIndex)}
                      onDragStart={event => event.dataTransfer.setData('text/plain', String(tileIndex))}
                      onClick={() => pickTile(tileIndex)}
                      className="min-h-14 min-w-14 rounded-xl border-2 border-indigo-200 bg-white px-4 py-3 text-xl font-bold shadow-sm hover:border-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-800 disabled:cursor-not-allowed disabled:opacity-25"
                      aria-label={'Add tile ' + tile + ', position ' + (tileIndex + 1)}>
                      {tile}
                    </button>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button type="button" disabled={!chosenIndices.length || feedback === 'correct'}
                    onClick={() => { setChosenIndices(old => old.slice(0, -1)); setFeedback(null); }}
                    className="rounded-lg border border-slate-300 px-4 py-2 font-semibold disabled:opacity-40">Undo</button>
                  <button type="button" disabled={!chosenIndices.length || feedback === 'correct'}
                    onClick={() => { setChosenIndices([]); setFeedback(null); }}
                    className="rounded-lg border border-slate-300 px-4 py-2 font-semibold disabled:opacity-40">Clear</button>
                  <button type="button" disabled={!complete || feedback === 'correct'}
                    onClick={() => submit(assembledWord)}
                    className="rounded-lg bg-indigo-700 px-5 py-2 font-bold text-white hover:bg-indigo-800 disabled:opacity-40">Check spelling</button>
                </div>
              </div>
            )}

            {puzzle.kind === 'correct' && (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {puzzle.options.map(option => (
                  <button type="button" key={option} disabled={feedback === 'correct'}
                    onClick={() => submit(option)}
                    className="min-h-16 rounded-xl border-2 border-slate-200 px-5 py-4 text-left text-xl font-bold hover:border-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-800 disabled:opacity-60">
                    {option}
                  </button>
                ))}
              </div>
            )}

            {puzzle.kind === 'missing' && (
              <div className="mt-6">
                <div className="mb-6 rounded-xl bg-indigo-50 p-5 text-center text-2xl font-black tracking-wide text-indigo-950">
                  {puzzle.before}<span className="mx-1 inline-block min-w-8 border-b-4 border-indigo-500">?</span>{puzzle.after}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {puzzle.choices.map(option => (
                    <button type="button" key={option} disabled={feedback === 'correct'}
                      onClick={() => submit(option)}
                      className="min-h-16 rounded-xl border-2 border-slate-200 bg-white p-3 text-xl font-black hover:border-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-800 disabled:opacity-60">{option}</button>
                  ))}
                </div>
              </div>
            )}

            {puzzle.kind === 'sort' && (
              <div className="mt-6">
                <p className="mb-3 text-center text-sm text-slate-600">Drag the word into a group, or tap the matching group.</p>
                <div className="mb-5 text-center">
                  <span
                    draggable={feedback !== 'correct'}
                    onDragStart={event => event.dataTransfer.setData('text/plain', puzzle.word)}
                    className="inline-block cursor-grab rounded-xl border-2 border-indigo-300 bg-white px-6 py-4 text-3xl font-black text-indigo-950 shadow-sm"
                    aria-label={'Word to sort: ' + puzzle.word}
                  >{puzzle.word}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {puzzle.categories.map(category => (
                    <button type="button" key={category} disabled={feedback === 'correct'}
                      onClick={() => submit(category)}
                      onDragOver={event => event.preventDefault()}
                      onDrop={event => {
                        event.preventDefault();
                        if (event.dataTransfer.getData('text/plain') === puzzle.word) submit(category);
                      }}
                      className="min-h-20 rounded-2xl border-2 border-indigo-200 bg-indigo-50 px-4 py-4 text-lg font-bold hover:border-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-800 disabled:opacity-60">{category}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setShowHint(true)} disabled={showHint || feedback === 'correct'}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50">Need a hint?</button>
                {(feedback === 'retry' || showHint) && (
                  <button type="button" onClick={revealAnswer} disabled={feedback === 'correct'}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50">
                    Show answer &amp; learn
                  </button>
                )}
              </div>
              {showHint && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-950"><strong>Hint:</strong> {puzzle.hint}</p>}
            </div>

            {feedback === 'retry' && (
              <p role="status" className="mt-5 rounded-xl bg-amber-50 p-4 font-medium text-amber-900">
                Not quite. Look at the clue and check the letter pattern. You can try again, use a hint or rearrange your tiles.
              </p>
            )}
            {feedback === 'correct' && (
              <div role="status" className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
                <h3 className="text-xl font-black">
                  {revealed ? `Answer: ${puzzle.kind === 'sort' ? puzzle.answer : puzzle.word}` : `You got it: ${puzzle.word}!`}
                </h3>
                {revealed && <p className="mt-2 text-sm font-semibold">This was a learning turn, not an independent correct answer.</p>}
                <p className="mt-2 text-sm">{puzzle.learningNote}</p>
                <button type="button" onClick={nextPuzzle}
                  className="mt-5 rounded-xl bg-emerald-700 px-6 py-3 font-bold text-white hover:bg-emerald-800">
                  {index + 1 < puzzles.length ? 'Next puzzle' : 'See my results'}
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
