import React from 'react';

function parseSections(text) {
  const sections = {
    breakdown: '',
    sentence: '',
    hint: '',
    tip: '',
  };

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  lines.forEach((line) => {
    const lower = line.toLowerCase();
    if (lower.startsWith('sound') || lower.includes('breakdown')) {
      sections.breakdown = line.replace(/sound breakdown[:\-]?\s*/i, '');
    } else if (lower.startsWith('example') || lower.includes('sentence')) {
      sections.sentence = line.replace(/example sentence[:\-]?\s*/i, '');
    } else if (lower.includes('picture') || lower.includes('hint')) {
      sections.hint = line.replace(/(picture )?hint[:\-]?\s*/i, '');
    } else if (lower.includes('fun tip') || lower.includes('tip')) {
      sections.tip = line.replace(/(fun )?tip[:\-]?\s*/i, '');
    }
  });

  return sections;
}

export function PracticeBuddyCard({
  aiResponse,
  selectedWord,
  tokensUsed,
  showHint,
  onToggleHint,
  onExplainAgain,
  onTryAnother,
  loading,
  todayCount,
}) {
  const sections = parseSections(aiResponse || '');
  const hasStructured =
    sections.breakdown || sections.sentence || sections.hint || sections.tip;

  return (
    <div className="bg-white/80 rounded-2xl p-6 shadow-lg border border-indigo-50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-indigo-600 font-medium">🤖 Practice Buddy</p>
          <h2 className="text-xl font-semibold text-gray-900 capitalize">
            Word: {selectedWord}
          </h2>
        </div>
        {tokensUsed != null && (
          <span className="text-xs px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">
            Tokens: {tokensUsed}
          </span>
        )}
      </div>

      {aiResponse ? (
        <div className="space-y-4">
          {hasStructured ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sections.breakdown && (
                <div className="p-3 rounded-xl bg-violet-50 border border-violet-100">
                  <p className="text-xs uppercase text-violet-600 font-semibold">
                    Sound breakdown
                  </p>
                  <p className="mt-1 text-gray-900">{sections.breakdown}</p>
                </div>
              )}
              {sections.sentence && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <p className="text-xs uppercase text-emerald-600 font-semibold">
                    Example sentence
                  </p>
                  <p className="mt-1 text-gray-900">{sections.sentence}</p>
                </div>
              )}
              {sections.hint && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <p className="text-xs uppercase text-amber-600 font-semibold">
                    Picture hint
                  </p>
                  <p className="mt-1 text-gray-900">
                    {showHint ? sections.hint : 'Tap "Show hint" to reveal'}
                  </p>
                </div>
              )}
              {sections.tip && (
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-100">
                  <p className="text-xs uppercase text-sky-600 font-semibold">
                    Fun tip
                  </p>
                  <p className="mt-1 text-gray-900">{sections.tip}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-800 whitespace-pre-line leading-relaxed">
              {aiResponse}
            </p>
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-500">Pick a word and let&apos;s practice!</div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          onClick={onTryAnother}
          className="px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold shadow hover:bg-indigo-700 transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Thinking…' : 'Try another word'}
        </button>
        <button
          onClick={onToggleHint}
          className="px-4 py-2 rounded-full bg-white border border-indigo-200 text-indigo-700 text-sm font-semibold hover:bg-indigo-50 transition disabled:opacity-50"
          disabled={loading || !sections.hint}
        >
          {showHint ? 'Hide hint' : 'Show hint'}
        </button>
        <button
          onClick={onExplainAgain}
          className="px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50"
          disabled={loading}
        >
          Explain again
        </button>
      </div>

      <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200">
        <p className="text-emerald-700 font-semibold">
          Great job! You practiced {todayCount} {todayCount === 1 ? 'word' : 'words'} today!
        </p>
        <p className="text-emerald-700 text-sm">Keep going to reach 10 words daily.</p>
      </div>
    </div>
  );
}

export default PracticeBuddyCard;
