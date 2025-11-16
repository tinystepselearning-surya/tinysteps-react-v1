import React from 'react';
import { motion } from 'framer-motion';
import usePhoneticsMaze from './usePhoneticsMaze';
import MazeRenderer from './MazeRenderer';
import JunctionChoice from './JunctionChoice';
import FeedbackPopup from './FeedbackPopup';
import PlayerCharacter from './PlayerCharacter';

export default function PhoneticsMaze({ userId, difficulty = 'medium', focusTopic = 'CVC' }) {
  const {
    maze,
    loading,
    error,
    currentCell,
    currentJunction,
    correctPath,
    positionIndex,
    isComplete,
    feedback,
    answerJunction,
    reload,
  } = usePhoneticsMaze({ userId, difficulty, focusTopic });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-indigo-600 font-semibold">Phonics Maze</p>
          <h1 className="text-3xl font-bold text-gray-900">Find the correct sounds!</h1>
          <p className="text-sm text-gray-600">Difficulty: {difficulty} • Topic: {focusTopic}</p>
        </div>
        <button
          onClick={reload}
          className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm font-semibold"
        >
          Reload maze
        </button>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">{error}</div>}
      {loading && <div className="text-sm text-gray-500">Loading maze…</div>}

      {maze && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="relative">
            <MazeRenderer rows={maze.rows} cols={maze.cols} path={correctPath} currentIndex={positionIndex} showPlayer={false} />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ transform: 'translate(0,0)' }}
            >
              <PlayerCharacter current={currentCell} />
            </div>
          </div>
          <div className="space-y-3">
            <motion.div
              key={`${currentCell?.[0]}-${currentCell?.[1]}`}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              className="p-3 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-between"
            >
              <div>
                <p className="text-sm text-gray-600">Position</p>
                <p className="text-lg font-semibold">
                  {currentCell ? `[${currentCell[0]}, ${currentCell[1]}]` : 'Start'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Progress</p>
                <p className="text-lg font-semibold">
                  {Math.min(positionIndex + 1, correctPath.length)}/{correctPath.length || '?'}
                </p>
              </div>
            </motion.div>

            {isComplete ? (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <p className="text-lg font-bold text-emerald-700">Maze completed! 🎉</p>
                <p className="text-sm text-emerald-700">Great job following the sounds.</p>
              </div>
            ) : (
              <>
                <JunctionChoice junction={currentJunction} onSelect={answerJunction} />
                <FeedbackPopup feedback={feedback} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
