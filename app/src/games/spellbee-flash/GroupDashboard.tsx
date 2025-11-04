/**
 * GroupDashboard Component
 * A-Z overview showing progress for each letter group
 */

import { useState, useMemo } from 'react';
import { WORDS } from './data';
import {
  listWordsForGroup,
  computeGroupStats,
  getWordMasteryAndAccuracy,
  getMasteryData,
} from './utils';
import GroupCard from './GroupCard';
import WordsModal from './WordsModal';

export default function GroupDashboard() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [progressModalOpen, setProgressModalOpen] = useState(false);

  // Compute stats for all groups (A-Z + All + #)
  const groupStats = useMemo(() => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const groups: Record<
      string,
      {
        total: number;
        completed: number;
        percent: number;
        confidence: 'Low' | 'Medium' | 'High';
        trend: 'improving' | 'stable' | 'declining' | 'new';
      }
    > = {};

    // Compute each letter group
    for (const letter of alphabet) {
      const stats = computeGroupStats(WORDS, letter);
      if (stats.total > 0) {
        groups[letter] = stats;
      }
    }

    // Compute "All" group
    groups['All'] = computeGroupStats(WORDS, 'All');

    // Compute "#" (non-alpha) group
    const nonAlphaStats = computeGroupStats(WORDS, '#');
    if (nonAlphaStats.total > 0) {
      groups['#'] = nonAlphaStats;
    }

    return groups;
  }, []);

  // Get last played group from localStorage
  const lastPlayedGroup = useMemo(() => {
    const saved = localStorage.getItem('spellbee-last-group-v1');
    return saved && groupStats[saved] ? saved : null;
  }, [groupStats]);

  // Handlers
  const handleStart = (groupId: string) => {
    // Save to localStorage
    localStorage.setItem('spellbee-last-group-v1', groupId);
    
    // Navigate back to game
    window.location.href = '/kids/games/spellbee-flash';
  };

  const handleView = (groupId: string) => {
    setSelectedGroup(groupId);
    setModalOpen(true);
  };

  const handleReset = (groupId: string) => {
    if (!confirm(`Reset all progress for group ${groupId}?`)) return;

    const words = listWordsForGroup(WORDS, groupId);
    const mastery = JSON.parse(
      localStorage.getItem('spellbee-mastery-v1') || '{}'
    );

    // Clear mastery for all words in this group
    for (const word of words) {
      const index = WORDS.indexOf(word);
      if (index !== -1 && mastery[index]) {
        delete mastery[index];
      }
    }

    localStorage.setItem('spellbee-mastery-v1', JSON.stringify(mastery));

    // Force re-render
    window.location.reload();
  };

  // Prepare modal data
  const modalWords = useMemo(() => {
    if (!selectedGroup) return [];

    const words = listWordsForGroup(WORDS, selectedGroup);
    const masteryData = getMasteryData();

    return words.map((word) => {
      const wordIndex = WORDS.indexOf(word);
      const { mastery, accuracy } = getWordMasteryAndAccuracy(wordIndex);
      const masteryInfo = masteryData.get(wordIndex);

      // Calculate total attempts
      const attempts = masteryInfo ? masteryInfo.correct + masteryInfo.wrong : 0;
      
      // Get last practiced date
      const lastPracticed = masteryInfo?.lastSeen 
        ? new Date(masteryInfo.lastSeen).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })
        : null;

      return {
        id: `${wordIndex}-${word.word}`,
        word: word.word,
        mastery,
        accuracy,
        attempts,
        lastPracticed,
      };
    });
  }, [selectedGroup]);

  // Render groups in order: All, A-Z, #
  const groupOrder = useMemo(() => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const order: string[] = ['All'];

    for (const letter of alphabet) {
      if (groupStats[letter]) {
        order.push(letter);
      }
    }

    if (groupStats['#']) {
      order.push('#');
    }

    return order;
  }, [groupStats]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 sm:p-6">
      <div className="max-w-[1280px] mx-auto">
        {/* Back Button and View Progress */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 rounded-xl bg-white hover:bg-slate-50 px-4 py-2 text-sm font-semibold shadow ring-1 ring-slate-200 focus:outline-none focus:ring-[3px] focus:ring-purple-500 focus:ring-offset-2 transition text-slate-700 min-h-[56px]"
            aria-label="Go back to game"
          >
            <span aria-hidden="true">←</span>
            <span>Back to Game</span>
          </button>

          <button
            onClick={() => setProgressModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-4 py-2 text-sm font-semibold shadow-lg text-white focus:outline-none focus:ring-[3px] focus:ring-purple-500 focus:ring-offset-2 transition min-h-[56px]"
            aria-label="View overall progress"
          >
            <span aria-hidden="true">📊</span>
            <span>View Progress</span>
          </button>
        </div>

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 mb-2">
            Group Dashboard
          </h1>
          <p className="text-slate-600 text-base sm:text-lg">
            Track your progress across all letter groups
          </p>
        </div>

        {/* Summary Chips */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* All Groups Summary */}
          <div className="rounded-xl bg-purple-100 px-4 py-2.5 border border-purple-200">
            <div className="text-xs uppercase tracking-wide text-purple-700 font-semibold mb-0.5">
              All Groups
            </div>
            <div className="text-2xl font-extrabold text-purple-900">
              {groupStats['All']?.completed ?? 0} /{' '}
              {groupStats['All']?.total ?? 0}
            </div>
            <div className="text-xs text-purple-700 mt-0.5">
              {groupStats['All']?.percent ?? 0}% Complete
            </div>
          </div>

          {/* Last Played */}
          {lastPlayedGroup && lastPlayedGroup !== 'All' && (
            <div className="rounded-xl bg-blue-100 px-4 py-2.5 border border-blue-200">
              <div className="text-xs uppercase tracking-wide text-blue-700 font-semibold mb-0.5">
                Last Played
              </div>
              <div className="text-2xl font-extrabold text-blue-900">
                Group {lastPlayedGroup}
              </div>
              <div className="text-xs text-blue-700 mt-0.5">
                {groupStats[lastPlayedGroup]?.completed ?? 0} /{' '}
                {groupStats[lastPlayedGroup]?.total ?? 0} Words
              </div>
            </div>
          )}
        </div>

        {/* Groups Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {groupOrder.map((groupId) => (
            <GroupCard
              key={groupId}
              groupId={groupId}
              stats={groupStats[groupId]}
              onStart={() => handleStart(groupId)}
              onView={() => handleView(groupId)}
              onReset={() => handleReset(groupId)}
            />
          ))}
        </div>

        {/* Words Modal */}
        <WordsModal
          open={modalOpen}
          groupId={selectedGroup ?? ''}
          words={modalWords}
          onClose={() => {
            setModalOpen(false);
            setSelectedGroup(null);
          }}
        />

        {/* Progress Modal */}
        {progressModalOpen && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="progress-modal-title"
            onClick={() => setProgressModalOpen(false)}
          >
            <div
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2
                  id="progress-modal-title"
                  className="text-2xl sm:text-3xl font-extrabold text-slate-800"
                >
                  📊 Your Progress
                </h2>
                <button
                  onClick={() => setProgressModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-2xl font-bold min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-slate-100 transition focus:outline-none focus:ring-[3px] focus:ring-purple-500"
                  aria-label="Close progress modal"
                >
                  ✕
                </button>
              </div>

              {/* Overall Stats */}
              <div className="space-y-6">
                {/* Total Progress */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-200">
                  <h3 className="text-lg font-bold text-purple-900 mb-4">
                    Overall Progress
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-3xl font-extrabold text-purple-600">
                        {groupStats['All']?.completed ?? 0}
                      </div>
                      <div className="text-sm text-purple-700">Words Mastered</div>
                    </div>
                    <div>
                      <div className="text-3xl font-extrabold text-blue-600">
                        {groupStats['All']?.total ?? 0}
                      </div>
                      <div className="text-sm text-blue-700">Total Words</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-3xl font-extrabold text-green-600">
                        {groupStats['All']?.percent ?? 0}%
                      </div>
                      <div className="text-sm text-green-700">Complete</div>
                    </div>
                  </div>
                </div>

                {/* Confidence Breakdown */}
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">
                    Confidence Level
                  </h3>
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-2">
                        {groupStats['All']?.confidence === 'High' && '🟢 High'}
                        {groupStats['All']?.confidence === 'Medium' && '🟡 Medium'}
                        {groupStats['All']?.confidence === 'Low' && '🔴 Low'}
                      </div>
                      <p className="text-sm text-slate-600">
                        {groupStats['All']?.confidence === 'High' &&
                          'Excellent work! Keep it up!'}
                        {groupStats['All']?.confidence === 'Medium' &&
                          'Good progress! Keep practicing!'}
                        {groupStats['All']?.confidence === 'Low' &&
                          'Keep learning! You can do it!'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Group Breakdown */}
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">
                    Groups Overview
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {Object.entries(groupStats)
                      .filter(([id]) => id !== 'All')
                      .map(([groupId, stats]) => (
                        <div
                          key={groupId}
                          className="flex items-center justify-between py-2 px-3 bg-white rounded-lg"
                        >
                          <span className="font-semibold text-slate-700">
                            Group {groupId}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-600">
                              {stats.completed}/{stats.total}
                            </span>
                            <span className="text-sm font-bold text-purple-600">
                              {stats.percent}%
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setProgressModalOpen(false)}
                  className="w-full min-h-[56px] px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 focus:outline-none focus:ring-[3px] focus:ring-purple-500 focus:ring-offset-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
