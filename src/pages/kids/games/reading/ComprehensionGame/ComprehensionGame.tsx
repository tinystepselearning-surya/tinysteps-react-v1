
import React, { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { buildMissionReturnHref } from "../missionNavigation";
import { READING_PACKS, ReadingPack } from "../../../../../content/readingPacks";
import { recordLevelResult } from "../../../../../games/engine/recordLevelResult";

const CANONICAL_GAME_ID = "comprehension";
const CANONICAL_PROGRESS_DOC_ID = "comprehension";

function resolvePackLevelId(pack: ReadingPack): number {
  const parsed = Number.parseInt(String(pack.id || "").replace(/[^0-9]/g, ""), 10);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return Math.max(1, Number(pack.level) || 1);
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ComprehensionGame() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const kidId = searchParams.get("kidId") || localStorage.getItem("ts_active_kid_v1") || "";
  const missionReturnHref = buildMissionReturnHref(searchParams, kidId);
  const missionTileId = searchParams.get("eemTile") || 'comprehension-questions';

  const [gameState, setGameState] = useState<'selecting' | 'reading' | 'questioning' | 'results'>('selecting');
  const [selectedPack, setSelectedPack] = useState<ReadingPack | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const packStartedAtRef = useRef<number>(0);
  const completionSentRef = useRef<boolean>(false);

  const packsWithQuestions = READING_PACKS.filter(p => p.questions && p.questions.length > 0);
  const currentQuestion = selectedPack?.questions?.[questionIndex];

  const selectPack = (pack: ReadingPack) => {
    setSelectedPack(pack);
    setGameState('reading');
    packStartedAtRef.current = Date.now();
    completionSentRef.current = false;
  };

  function recordPackCompletion(pack: ReadingPack, finalScore: number) {
    if (!kidId) return;
    if (completionSentRef.current) return;
    completionSentRef.current = true;

    const totalQuestions = Math.max(1, pack.questions?.length || 0);
    const levelId = resolvePackLevelId(pack);
    const timeSpentMs = Math.max(0, Date.now() - packStartedAtRef.current);
    const accuracyPct = Math.round((finalScore / totalQuestions) * 100);

    void recordLevelResult({
      kidId,
      gameId: CANONICAL_GAME_ID,
      progressDocId: CANONICAL_PROGRESS_DOC_ID,
      levelId,
      completed: true,
      score: finalScore,
      accuracyPct: Math.max(0, Math.min(100, accuracyPct)),
      attempts: totalQuestions,
      timeSpentMs,
      skillTags: [
        "area:reading",
        "subtopic:comprehension",
        `pack:${pack.id}`,
        `level:${pack.level}`,
        ...((pack.tags || []).map((tag) => `topic:${String(tag).toLowerCase()}`)),
      ],
      completedAt: Date.now(),
    } as any).catch((err) => {
      console.error("[ComprehensionGame] recordLevelResult failed:", err);
    });
  }

  const handleOptionClick = (optionIndex: number) => {
    if (selectedOption !== null) return;

    setSelectedOption(optionIndex);
    const correct = optionIndex === currentQuestion?.correctOptionIndex;
    setIsCorrect(correct);
    if (correct) {
      setScore(s => s + 1);
    }

    setTimeout(() => {
      if (questionIndex < (selectedPack?.questions?.length || 0) - 1) {
        setQuestionIndex(q => q + 1);
        setSelectedOption(null);
        setIsCorrect(null);
      } else {
        if (selectedPack) {
          const finalScore = score + (correct ? 1 : 0);
          recordPackCompletion(selectedPack, finalScore);
        }
        setGameState('results');
      }
    }, 1200);
  };
  
  const resetGame = () => {
    setGameState('selecting');
    setSelectedPack(null);
    setQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsCorrect(null);
    packStartedAtRef.current = 0;
    completionSentRef.current = false;
  }

  const handleFinish = () => {
    const returnUrl = new URL(missionReturnHref, window.location.origin);
    returnUrl.searchParams.set("eemDone", missionTileId);
    navigate(`${returnUrl.pathname}${returnUrl.search}`);
  };

  if (gameState === 'results') {
    return (
        <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-sky-50 to-indigo-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-3xl bg-white/90 border border-slate-200 shadow-sm p-8 text-center">
                <h2 className="text-3xl font-bold text-slate-800">Great Job!</h2>
                <p className="mt-4 text-lg text-slate-600">
                    You answered {score} out of {selectedPack?.questions?.length} questions correctly.
                </p>
                <div className="mt-8 flex justify-center gap-4">
                    <button
                        onClick={handleFinish}
                        className="rounded-2xl px-6 py-3 bg-sky-600 text-white hover:bg-sky-700 active:scale-[0.99] transition font-semibold"
                    >
                        Back to Mission
                    </button>
                    <button
                        onClick={resetGame}
                        className="rounded-2xl px-6 py-3 bg-slate-200 text-slate-800 hover:bg-slate-300 active:scale-[0.99] transition font-semibold"
                    >
                        Play Again
                    </button>
                </div>
            </div>
        </div>
    );
  }
  
  if (gameState === 'reading' && selectedPack) {
    return (
      <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-sky-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl h-[90vh] rounded-3xl bg-white/90 border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex-shrink-0 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-800">{selectedPack.title}</h1>
            <button
              onClick={resetGame}
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
              onClick={() => setGameState('questioning')}
              className="mt-8 rounded-2xl px-6 py-3 bg-sky-600 text-white hover:bg-sky-700 active:scale-[0.99] transition font-semibold"
            >
              Start Questions
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'questioning' && selectedPack && currentQuestion) {
     return (
       <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-sky-50 to-indigo-50 flex items-center justify-center p-4">
         <div className="w-full max-w-2xl">
            <p className="text-center text-slate-600 mb-4">Question {questionIndex + 1} of {selectedPack.questions?.length}</p>
            <h2 className="text-3xl font-semibold text-center text-slate-800">{currentQuestion.question}</h2>
            <div className="mt-8 grid grid-cols-1 gap-4">
              {currentQuestion.options.map((option, index) => {
                
                let buttonClass = "w-full text-left p-5 rounded-lg border-2 font-semibold text-xl transition-all duration-200 ";
                if (selectedOption !== null) {
                  if (index === currentQuestion.correctOptionIndex) {
                    buttonClass += "bg-green-100 border-green-400 text-green-800 scale-105";
                  } else if (selectedOption === index) {
                     buttonClass += "bg-red-100 border-red-400 text-red-800";
                  } else {
                     buttonClass += "bg-white border-slate-300 text-slate-800 opacity-60";
                  }
                  buttonClass += " cursor-not-allowed";
                } else {
                  buttonClass += "bg-white border-slate-300 hover:bg-sky-50 hover:border-sky-400 text-slate-800 cursor-pointer";
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleOptionClick(index)}
                    disabled={selectedOption !== null}
                    className={buttonClass}
                  >
                    {option}
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
            <h1 className="text-3xl font-bold text-slate-800">Comprehension Questions</h1>
            <p className="mt-2 text-lg text-slate-600">Choose a story to read and answer questions.</p>
        </div>
        <div className="mt-8 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packsWithQuestions.map((pack) => (
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
