/**
 * WordsModal Component
 * Displays a list of words in a group with mastery and accuracy
 */

import { useEffect } from 'react';

export interface WordsModalProps {
  open: boolean;
  groupId: string;
  words: Array<{
    id: string;
    word: string;
    mastery: number;
    accuracy: number;
  }>;
  onClose: () => void;
}

export default function WordsModal({
  open,
  groupId,
  words,
  onClose,
}: WordsModalProps) {
  // Handle Esc key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (open) {
      document.addEventListener('keydown', handleEsc);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  // Mastery dot color based on level
  const getMasteryColor = (mastery: number) => {
    if (mastery >= 3) return 'bg-emerald-500'; // Mastered
    if (mastery >= 2) return 'bg-green-500'; // Good
    if (mastery >= 1) return 'bg-amber-500'; // Learning
    return 'bg-slate-300'; // Not started
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="words-modal-title"
    >
      <div
        className="relative w-[90vw] max-w-[720px] max-h-[80vh] overflow-auto rounded-2xl bg-white p-4 sm:p-5 shadow-2xl ring-1 ring-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <h2
            id="words-modal-title"
            className="text-xl sm:text-2xl font-extrabold text-slate-800"
          >
            Group {groupId} Words
          </h2>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label="Close modal"
          >
            <span className="text-2xl leading-none">×</span>
          </button>
        </div>

        {/* Words List */}
        {words.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No words in this group yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {words.map((word) => (
              <div
                key={word.id}
                className="py-3 flex items-center gap-3 hover:bg-slate-50 px-2 rounded transition"
              >
                {/* Mastery Dot */}
                <div
                  className={`h-3 w-3 rounded-full ${getMasteryColor(
                    word.mastery
                  )} shrink-0`}
                  aria-label={`Mastery level: ${word.mastery}`}
                  title={
                    word.mastery >= 3
                      ? 'Mastered'
                      : word.mastery >= 2
                      ? 'Good progress'
                      : word.mastery >= 1
                      ? 'Learning'
                      : 'Not started'
                  }
                />

                {/* Word */}
                <div className="flex-1 font-semibold text-slate-800 text-base sm:text-lg">
                  {word.word}
                </div>

                {/* Accuracy Badge */}
                <div
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    word.accuracy >= 80
                      ? 'bg-emerald-50 text-emerald-700'
                      : word.accuracy >= 60
                      ? 'bg-amber-50 text-amber-700'
                      : word.accuracy > 0
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-slate-50 text-slate-600'
                  }`}
                >
                  {word.accuracy > 0 ? `${word.accuracy}%` : 'New'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-center text-sm text-slate-500">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span>Mastered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span>Good</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <span>Learning</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-slate-300" />
              <span>New</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
