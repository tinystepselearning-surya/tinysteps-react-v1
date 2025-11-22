import { useEffect, useState } from 'react';
import { usePracticeBuddy } from './usePracticeBuddy';
import PracticeBuddyCard from './PracticeBuddyCard.jsx';

// Main UI container for kids' Practice Buddy
export default function PracticeBuddy({ studentId, onBeforePractice, onAfterPractice }) {
  const {
    selectedWord,
    setSelectedWord,
    aiResponse,
    tokensUsed,
    loading,
    error,
    todayCount,
    lastDurationMs,
    practiceWord,
    pickRandomWord,
    wordList,
  } = usePracticeBuddy(studentId);

  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setShowHint(false);
  }, [selectedWord]);

  const onPractice = async () => {
    onBeforePractice?.();
    await practiceWord(selectedWord);
    onAfterPractice?.();
  };

  const onTryAnother = () => {
    pickRandomWord();
    setShowHint(false);
  };

  const onExplainAgain = async () => {
    onBeforePractice?.();
    await practiceWord(selectedWord);
    onAfterPractice?.();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-r from-indigo-50 to-sky-50 rounded-3xl p-6 border border-indigo-100 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-indigo-600 font-semibold">Kids&apos; Portal</p>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <span role="img" aria-label="robot">
                🤖
              </span>{' '}
              Practice Buddy
            </h1>
            <p className="text-gray-600 mt-2">
              Pick a SATPIN CVC word and I&apos;ll break it down with sounds, a sentence, and a hint.
            </p>
          </div>
          <div className="px-3 py-2 bg-white border border-indigo-100 rounded-xl text-sm text-gray-700">
            <div className="font-semibold text-indigo-700">Guardrails</div>
            <ul className="list-disc pl-4">
              <li>Whitelist words only</li>
              <li>10 sessions/day</li>
              <li>30s timeout</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pick a word to practice
            </label>
            <div className="flex gap-3">
              <select
                value={selectedWord}
                onChange={(e) => setSelectedWord(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {wordList.map((word) => (
                  <option key={word} value={word}>
                    {word}
                  </option>
                ))}
              </select>
              <button
                onClick={onPractice}
                disabled={loading}
                className="min-w-[140px] inline-flex justify-center items-center rounded-xl bg-indigo-600 text-white font-semibold px-4 py-3 shadow hover:bg-indigo-700 transition disabled:opacity-60"
              >
                {loading ? 'Thinking…' : 'Practice'}
              </button>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-indigo-100 p-4 shadow-sm text-sm text-gray-700">
            <div className="font-semibold text-indigo-700 mb-1">Today&apos;s score</div>
            <div className="text-2xl font-bold text-gray-900">{todayCount}/10</div>
            <p className="text-gray-500">Great job! You practiced {todayCount} words today.</p>
            {lastDurationMs != null && (
              <p className="text-xs text-gray-400 mt-1">Last response in {(lastDurationMs / 1000).toFixed(1)}s</p>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="mt-6">
          <PracticeBuddyCard
            aiResponse={aiResponse}
            selectedWord={selectedWord}
            tokensUsed={tokensUsed}
            showHint={showHint}
            onToggleHint={() => setShowHint((v) => !v)}
            onExplainAgain={onExplainAgain}
            onTryAnother={onTryAnother}
            loading={loading}
            todayCount={todayCount}
          />
        </div>

        {loading && (
          <div className="mt-4 text-sm text-gray-500 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-indigo-200 animate-pulse" />
            Summoning Practice Buddy… please wait.
          </div>
        )}

        <div className="mt-6 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm text-sm text-gray-700">
          <p className="font-semibold text-gray-900 mb-2">How it works</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>We send a safe prompt to Groq (mixtral-8x7b-32768) via Cloud Function.</li>
            <li>Responses are logged to <code className="font-mono text-xs">student-ai-history</code> for teachers/parents.</li>
            <li>Kids are capped at 10 practice sessions per day to keep focus.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
