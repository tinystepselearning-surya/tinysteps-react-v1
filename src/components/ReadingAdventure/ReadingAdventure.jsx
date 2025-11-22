import { useState } from 'react';
import { motion } from 'framer-motion';
import useReadingAdventure from './useReadingAdventure';
import ProgressBar from './ProgressBar.jsx';
import ChapterDisplay from './ChapterDisplay.jsx';
import ComprehensionQuestion from './ComprehensionQuestion.jsx';

export default function ReadingAdventure({ bookId = 'default-book', readingLevel = 'early-primary' }) {
  const { chapterNumber, chapter, loading, error, history, answer, reload } = useReadingAdventure({ bookId, readingLevel });
  const [completed, setCompleted] = useState(false);

  const handleAnswer = (opt) => {
    const correct = opt === chapter?.correctAnswer;
    if (correct) {
      if (chapterNumber >= 10) setCompleted(true);
    }
    answer(opt);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-indigo-600 font-semibold">Reading Adventure</p>
          <h1 className="text-3xl font-bold text-gray-900">Unlock each chapter by answering correctly</h1>
          <p className="text-sm text-gray-600">Book: {bookId} · Level: {readingLevel}</p>
        </div>
        <button onClick={reload} className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm font-semibold">
          Reload
        </button>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">{error}</div>}
      {loading && <div className="text-sm text-gray-500">Loading chapter…</div>}

      <ProgressBar current={chapterNumber} total={10} />

      <ChapterDisplay chapterText={chapter?.chapter} />

      <ComprehensionQuestion question={chapter?.question} options={chapter?.options} onSelect={handleAnswer} />

      {completed && (
        <motion.div initial={{ opacity: 0.8 }} animate={{ opacity: 1 }} className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800">
          <p className="text-lg font-bold">Book completed! 🎉</p>
          <p className="text-sm">Great job reading and answering the questions.</p>
        </motion.div>
      )}

      {history.length > 0 && (
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-700">
          <p className="font-semibold">Recent answers</p>
          <ul className="list-disc pl-4">
            {history.slice(-5).map((h, idx) => (
              <li key={idx} className={h.correct ? 'text-emerald-700' : 'text-amber-700'}>
                Chapter {h.chapterNumber}: {h.choice} {h.correct ? '✅' : '❌'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
