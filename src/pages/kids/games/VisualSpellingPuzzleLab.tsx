import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  VISUAL_SPELLING_PUZZLES,
  VISUAL_SPELLING_STAGES,
  shuffleVisualSpellingPuzzles,
  visualSpellingAnswer,
  type VisualSpellingPuzzle,
  type VisualSpellingStage,
} from '../../../lib/visualSpellingPuzzles';
import './VisualSpellingPuzzleLab.css';

const STAGE_SYMBOLS = ['🧭', '🧩', '🔎', '🏆'] as const;

type Feedback = 'correct' | 'retry' | null;

export default function VisualSpellingPuzzleLab() {
  const navigate = useNavigate();
  const [stageId, setStageId] = useState<VisualSpellingStage | null>(null);
  const [practiceRound, setPracticeRound] = useState(0);
  const focusHeadingRef = useRef<HTMLHeadingElement>(null);
  const [index, setIndex] = useState(0);
  const [chosenIndices, setChosenIndices] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [revealed, setRevealed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [independentCorrect, setIndependentCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const [sortIndex, setSortIndex] = useState(0);
  const [wrongChoice, setWrongChoice] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [recallMode, setRecallMode] = useState(false);
  const [recallValue, setRecallValue] = useState('');
  const [recallAttempted, setRecallAttempted] = useState(false);
  const [recallHintUsed, setRecallHintUsed] = useState(false);
  const [recallCorrect, setRecallCorrect] = useState(false);
  const [recallFirstTry, setRecallFirstTry] = useState(false);
  const [recallRevealed, setRecallRevealed] = useState(false);

  const puzzles = useMemo(() => {
    const selected = VISUAL_SPELLING_PUZZLES.filter(puzzle => puzzle.stage === stageId);
    return practiceRound ? shuffleVisualSpellingPuzzles(selected) : selected;
  }, [stageId, practiceRound]);
  const puzzle = puzzles[index] as VisualSpellingPuzzle | undefined;
  const recallWord = puzzles.find(p => p.kind === 'arrange') || puzzles[0];
  const activeSortWord = puzzle?.kind === 'sort'
    ? sortIndex === 0 ? puzzle.word : puzzle.pair.word
    : '';
  const activeSortAnswer = puzzle?.kind === 'sort'
    ? sortIndex === 0 ? puzzle.answer : puzzle.pair.answer
    : '';

  // Heading focus and scroll reset keep successive puzzles easy to find on
  // phones and make new activities discoverable to keyboard/screen-reader users.
  useEffect(() => {
    if (!stageId) return;
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    focusHeadingRef.current?.focus({ preventScroll: true });
  }, [stageId, index, recallMode, finished]);

  const startStage = (id: VisualSpellingStage, replay = false) => {
    setStageId(id);
    setPracticeRound(current => replay ? current + 1 : 0);
    setIndex(0);
    setChosenIndices([]);
    setFeedback(null);
    setRevealed(false);
    setShowHint(false);
    setAttempted(false);
    setIndependentCorrect(0);
    setFinished(false);
    setSortIndex(0);
    setWrongChoice(null);
    setRetryCount(0);
    setRecallMode(false);
    setRecallValue('');
    setRecallAttempted(false);
    setRecallHintUsed(false);
    setRecallCorrect(false);
    setRecallFirstTry(false);
    setRecallRevealed(false);
  };

  // A level's back button returns to this game's level chooser, never to
  // the unrelated English Excellence Games directory. From the chooser,
  // return to the canonical public spelling-game information page.
  const returnToSpellingHome = () => {
    if (stageId) {
      setStageId(null);
      return;
    }
    navigate('/free-spelling-game-for-kids');
  };

  const submit = (value: string) => {
    if (!puzzle || feedback === 'correct') return;
    const expected = puzzle.kind === 'sort' ? activeSortAnswer : visualSpellingAnswer(puzzle);
    const correct = value.toLocaleLowerCase('en') === expected.toLocaleLowerCase('en');
    if (correct) {
      // Sort both contrasting words before accepting the puzzle as complete.
      if (puzzle.kind === 'sort' && sortIndex === 0) {
        // A hint on the first word still makes this an assisted attempt,
        // even if the second word is answered independently.
        if (showHint) setAttempted(true);
        setSortIndex(1);
        setWrongChoice(null);
        setFeedback(null);
        setShowHint(false);
        return;
      }
      if (!attempted && !showHint) setIndependentCorrect(count => count + 1);
      setWrongChoice(null);
      setFeedback('correct');
    } else {
      setAttempted(true);
      setWrongChoice(value);
      setRetryCount(count => count + 1);
      setFeedback('retry');
    }
  };

  const revealAnswer = () => {
    if (!puzzle || feedback === 'correct') return;
    setAttempted(true);
    setRevealed(true);
    setFeedback('correct');
  };

  const submitRecall = () => {
    if (!recallWord || recallCorrect || recallRevealed) return;
    const correct = recallValue.trim().toLocaleLowerCase('en') === recallWord.word.toLocaleLowerCase('en');
    if (correct) {
      setRecallCorrect(true);
      if (!recallAttempted && !recallHintUsed) setRecallFirstTry(true);
    } else {
      setRecallAttempted(true);
    }
  };

  const pickTile = (tileIndex: number) => {
    if (!puzzle || puzzle.kind !== 'arrange' || feedback === 'correct') return;
    if (chosenIndices.includes(tileIndex) || tileIndex < 0 || tileIndex >= puzzle.tiles.length) return;
    setChosenIndices(previous => [...previous, tileIndex]);
    setFeedback(null);
  };

  const nextPuzzle = () => {
    if (index + 1 >= puzzles.length) {
      setRecallMode(true);
      return;
    }
    setIndex(current => current + 1);
    setChosenIndices([]);
    setFeedback(null);
    setRevealed(false);
    setShowHint(false);
    setAttempted(false);
    setWrongChoice(null);
    setRetryCount(0);
    setSortIndex(0);
  };

  const complete = puzzle?.kind === 'arrange' && chosenIndices.length === puzzle.tiles.length;
  const assembledWord = puzzle?.kind === 'arrange'
    ? chosenIndices.map(tileIndex => puzzle.tiles[tileIndex]).join('')
    : '';

  return (
    <section aria-label="Spelling Puzzle Lab" className="ts-spelling-surface px-3 pb-10 pt-6 text-white sm:px-5 sm:pb-14 sm:pt-9">
      <span aria-hidden="true" className="ts-spelling-glow ts-spelling-glow--coral" />
      <span aria-hidden="true" className="ts-spelling-glow ts-spelling-glow--aqua" />
      <div className="relative z-10 mx-auto max-w-5xl">
        <header className="mb-7 flex flex-wrap items-start justify-between gap-4 sm:mb-9">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2">
              <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-300 text-xl text-indigo-950 shadow-lg">✦</span>
              <p className="text-xs font-extrabold uppercase tracking-[.20em] text-cyan-100">Tiny Steps · Word Games</p>
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Spelling <span className="text-amber-300">Puzzle Lab</span></h1>
            <p className="mt-2 text-sm font-medium text-indigo-100 sm:text-base">Free for ages 8–10+ · No login · No sound · Nothing saved</p>
          </div>
          <button type="button" onClick={returnToSpellingHome}
            className="rounded-full border-2 border-white/40 bg-white/10 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300">
            <span aria-hidden="true">← </span>{stageId ? 'All Spelling Levels' : 'Spelling Game Page'}
          </button>
        </header>

        {!stageId && (
          <section aria-labelledby="choose-stage-heading">
            <div className="mb-6 rounded-3xl border border-white/25 bg-white/10 px-5 py-5 shadow-lg sm:px-7">
              <p className="mb-1 text-xs font-extrabold uppercase tracking-[.18em] text-amber-200">Your next word adventure</p>
              <h2 id="choose-stage-heading" className="text-2xl font-black sm:text-3xl">Choose a puzzle challenge</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-indigo-100 sm:text-base">Mix letters, spot tricky spellings, complete missing parts and discover word patterns. Pick any level and play at your own pace.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
              {VISUAL_SPELLING_STAGES.map((stage, i) => (
                <button key={stage.id} type="button" onClick={() => startStage(stage.id)}
                  className="ts-spelling-stage-card group flex min-h-56 flex-col p-5 text-left text-[#222052] sm:min-h-64 sm:p-7">
                  <span className="relative z-10 mb-4 flex items-start justify-between gap-3">
                    <span className="rounded-full bg-white/75 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-[#423477]">Level {i + 1}</span>
                    <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/55 text-3xl shadow-sm transition-transform group-hover:rotate-6">{STAGE_SYMBOLS[i]}</span>
                  </span>
                  <span className="relative z-10 block text-2xl font-black tracking-tight sm:text-3xl">{stage.title}</span>
                  <span className="relative z-10 mt-2 block max-w-xs text-sm font-medium leading-6">{stage.subtitle}</span>
                  <span className="relative z-10 mt-auto flex items-center justify-between gap-2 pt-5">
                    <span className="rounded-full bg-white/65 px-3 py-1.5 text-xs font-extrabold">{VISUAL_SPELLING_PUZZLES.filter(p => p.stage === stage.id).length} puzzles · untimed</span>
                    <span className="text-sm font-black">Let's play <span aria-hidden="true">→</span></span>
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-7 text-center text-sm font-medium text-indigo-100">No timers. No pressure. Just clever word puzzles and a little discovery.</p>
          </section>
        )}

        {stageId && finished && (
          <section className="ts-spelling-board p-5 text-slate-900 sm:p-10" aria-live="polite">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-200 text-4xl shadow-sm" aria-hidden="true">🏆</div>
            <p className="text-xs font-black uppercase tracking-widest text-indigo-700">Level complete · Great effort!</p>
            <h2 ref={focusHeadingRef} tabIndex={-1} className="mt-2 text-3xl font-black tracking-tight text-[#29235a] focus:outline-none">Nice word work!</h2>
            <p className="mt-3 text-lg">You completed {puzzles.length} visual spelling puzzles.</p>
            <p className="mt-2 text-sm">Independent first-try puzzles: {independentCorrect} of {puzzles.length}.</p>
            <p className="mt-2 text-sm">Final word recall: {recallFirstTry ? 'Correct independently on the first try' : recallCorrect ? 'Correct after practising' : 'Answer studied with help'}.</p>
            <p className="mt-2 text-sm">Hints and retries are part of learning. These results are not saved.</p>
            <p className="mt-4 text-sm text-slate-600">For lasting spelling confidence, return to these words later and try writing them in your own sentences without looking.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => startStage(stageId, true)} className="ts-spelling-primary px-6 py-3.5 font-black">Replay mixed puzzles</button>
              <button type="button" onClick={() => setStageId(null)} className="ts-spelling-secondary px-5 py-3 font-bold">Choose another level</button>
            </div>
          </section>
        )}

        {stageId && !finished && recallMode && recallWord && (
          <section className="ts-spelling-board p-5 text-slate-900 sm:p-9" aria-labelledby="recall-heading">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#efeaff] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#4e3dac]"><span aria-hidden="true">★</span> Final challenge · Remember and spell</span>
              <span className="rounded-full bg-amber-100 px-3 py-2 text-xs font-bold text-amber-800">Bonus round</span>
            </div>
            <h2 id="recall-heading" ref={focusHeadingRef} tabIndex={-1} className="mt-5 text-2xl font-black tracking-tight text-[#28245f] focus:outline-none sm:text-3xl">Can you spell it without the tiles?</h2>
            <p className="ts-spelling-clue mt-4 p-4 text-base font-medium text-[#293d64] sm:text-lg"><strong className="text-[#24668a]">Clue:</strong> {recallWord.clue}</p>
            <p className="mt-3 text-sm text-slate-600">Type the complete word from memory. No sound or picture is needed.</p>
            {!recallCorrect && !recallRevealed && (
              <form onSubmit={event => { event.preventDefault(); submitRecall(); }} className="mt-5 flex flex-col gap-3 sm:flex-row">
                <label className="flex-1">
                  <span className="mb-2 block text-sm font-bold">Your spelling</span>
                  <input type="text" value={recallValue} autoComplete="off" autoCapitalize="none" spellCheck={false}
                    onChange={event => setRecallValue(event.target.value)}
                    className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-lg font-semibold text-slate-950 focus:border-indigo-700 focus:outline-none"
                    aria-label="Type the spelling from memory" />
                </label>
                <button type="submit" disabled={!recallValue.trim()}
                  className="self-end rounded-xl bg-indigo-700 px-6 py-3.5 font-bold text-white disabled:opacity-50">Check spelling</button>
              </form>
            )}
            {recallAttempted && !recallCorrect && !recallRevealed && (
              <p role="status" className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">
                Not quite. Check the order of the letters, then try again.
              </p>
            )}
            {!recallCorrect && !recallRevealed && (
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={() => setRecallHintUsed(true)} disabled={recallHintUsed}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50">Need a hint?</button>
                {(recallAttempted || recallHintUsed) && (
                  <button type="button" onClick={() => setRecallRevealed(true)}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold">Show answer &amp; finish</button>
                )}
              </div>
            )}
            {recallHintUsed && !recallCorrect && !recallRevealed && (
              <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">Hint: The word starts with <strong>{recallWord.word.charAt(0).toUpperCase()}</strong>.</p>
            )}
            {(recallCorrect || recallRevealed) && (
              <div role="status" className="mt-5 rounded-xl bg-emerald-50 p-5 text-emerald-950">
                <h3 className="text-xl font-black">{recallRevealed ? 'Answer: ' : 'Correct! '}{recallWord.word}</h3>
                <p className="mt-2 text-sm">{recallWord.learningNote}</p>
                <button type="button" onClick={() => setFinished(true)}
                  className="mt-4 rounded-xl bg-emerald-700 px-6 py-3 font-bold text-white">See results</button>
              </div>
            )}
          </section>
        )}

        {stageId && puzzle && !recallMode && !finished && (
          <section className="ts-spelling-board p-5 text-slate-900 sm:p-9" aria-labelledby="puzzle-heading">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#efeaff] px-3 py-2 text-xs font-black text-[#4d3db0]">
                <span aria-hidden="true">✦</span> {VISUAL_SPELLING_STAGES.find(stage => stage.id === stageId)?.title}
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[#fff2d9] px-3 py-2 text-sm font-black text-[#75502d]">Puzzle {index + 1} of {puzzles.length}</span>
                
              </div>
            </div>
            <div aria-label="Puzzle progress" role="progressbar" aria-valuemin={0} aria-valuemax={puzzles.length}
              aria-valuenow={index + (feedback === 'correct' ? 1 : 0)}
              className="mb-7 flex gap-1.5">
              {puzzles.map((item, progressIndex) => (
                <span key={item.id} aria-hidden="true"
                  className={`ts-spelling-progress ${progressIndex < index || (progressIndex === index && feedback === 'correct')
                    ? 'ts-spelling-progress--complete'
                    : progressIndex === index ? 'ts-spelling-progress--active' : ''}`} />
              ))}
            </div>
            <div className="mb-3 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#8d579d]">
              <span aria-hidden="true">✦</span> Word mission
            </div>
            <h2 id="puzzle-heading" ref={focusHeadingRef} tabIndex={-1} className="text-2xl font-black tracking-tight text-[#28245f] focus:outline-none sm:text-3xl">
              {puzzle.kind === 'arrange' ? 'Build the correct word' :
               puzzle.kind === 'correct' ? 'Spot the correct spelling' :
               puzzle.kind === 'missing' ? 'Fill the missing letters' :
               'Sort the word'}
            </h2>
            <p className="ts-spelling-clue mt-4 p-4 text-base font-medium text-[#293d64] sm:text-lg"><strong className="text-[#24668a]">Clue:</strong> {puzzle.kind === 'sort' && sortIndex === 1 ? puzzle.pair.clue : puzzle.clue}</p>

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
                <p className="mb-3 text-center text-sm text-slate-600">
                  Sort both words to complete this puzzle ({sortIndex + 1} of 2). Drag into a group or tap the matching group.
                </p>
                <div className="mb-5 text-center">
                  <span
                    aria-live="polite"
                    draggable={feedback !== 'correct'}
                    onDragStart={event => event.dataTransfer.setData('text/plain', activeSortWord)}
                    className="inline-block max-w-full cursor-grab break-words rounded-xl border-2 border-indigo-300 bg-white px-4 py-4 text-2xl font-black text-indigo-950 shadow-sm sm:px-6 sm:text-3xl"
                    aria-label={'Word to sort: ' + activeSortWord}
                  >{activeSortWord}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {puzzle.categories.map(category => (
                    <button type="button" key={category} disabled={feedback === 'correct'}
                      onClick={() => submit(category)}
                      onDragOver={event => event.preventDefault()}
                      onDrop={event => {
                        event.preventDefault();
                        if (event.dataTransfer.getData('text/plain') === activeSortWord) submit(category);
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
              {showHint && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-950"><strong>Hint:</strong> {puzzle.kind === 'sort' && sortIndex === 1 ? 'Compare the ending or prefix with the two category names.' : puzzle.hint}</p>}
            </div>

            {feedback === 'retry' && (
              <p role="status" className="mt-5 rounded-xl bg-amber-50 p-4 font-medium text-amber-900">
                {puzzle.kind === 'arrange'
                  ? 'Those tiles are not in the correct order. Use Undo or Clear and try again.'
                  : puzzle.kind === 'correct'
                    ? `“${wrongChoice}” is not the accepted spelling. Compare the order of the letters and try again.`
                    : puzzle.kind === 'missing'
                      ? `“${wrongChoice}” does not complete this word. Check the letters on both sides.`
                      : `This word doesn't belong in “${wrongChoice}”. Look at its written pattern.`}
                {retryCount >= 2 ? ` ${puzzle.kind === 'sort' && sortIndex === 1 ? 'Compare the two category labels carefully.' : puzzle.hint}` : ''}
              </p>
            )}
            {feedback === 'correct' && (
              <div role="status" className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
                <h3 className="text-xl font-black">
                  {revealed
                    ? puzzle.kind === 'sort'
                      ? `Answers: ${puzzle.word} → ${puzzle.answer}; ${puzzle.pair.word} → ${puzzle.pair.answer}`
                      : `Answer: ${puzzle.word}`
                    : puzzle.kind === 'sort'
                      ? 'Both words sorted!'
                      : `You got it: ${puzzle.word}!`}
                </h3>
                {revealed && <p className="mt-2 text-sm font-semibold">This was a learning turn, not an independent correct answer.</p>}
                <p className="mt-2 text-sm">{puzzle.learningNote}</p>
                {puzzle.kind === 'sort' && <p className="mt-2 text-sm">{puzzle.pair.learningNote}</p>}
                <button type="button" onClick={nextPuzzle}
                  className="mt-5 rounded-xl bg-emerald-700 px-6 py-3 font-bold text-white hover:bg-emerald-800">
                  {index + 1 < puzzles.length ? 'Next puzzle' : 'Final spelling challenge'}
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </section>
  );
}
